import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function loadQuotesContext(initialStorage: Record<string, string> = {}) {
  const storageMap = new Map<string, string>(Object.entries(initialStorage));
  const noop = () => {};

  const sandbox: any = {
    console,
    Math,
    Date,
    Number,
    String,
    Array,
    Object,
    JSON,
    Promise,
    Set,
    Map,
    Intl,
    AbortController,
    setTimeout,
    clearTimeout,
    localStorage: {
      getItem: (k: string) => storageMap.get(k) ?? null,
      setItem: (k: string, v: string) => storageMap.set(k, String(v)),
      removeItem: (k: string) => storageMap.delete(k),
    },
    indexedDB: { open: () => null, deleteDatabase: noop },
    document: {
      documentElement: { dataset: {}, style: { setProperty: noop, removeProperty: noop }, lang: 'en' },
      body: { classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, dataset: {} },
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: noop,
    },
    window: {},
    navigator: { onLine: true },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  for (const rel of ['public/js/util.js', 'public/js/i18n.js', 'public/js/themes.js', 'public/js/quotes-store.js']) {
    const code = fs.readFileSync(path.resolve(process.cwd(), rel), 'utf8');
    vm.runInContext(code, sandbox, { filename: rel });
  }

  return { sandbox, storageMap };
}

test('INTERNAL_QUOTES contains authentic offline entries with strictly text and author only', () => {
  const { sandbox } = loadQuotesContext();
  const data = JSON.parse(vm.runInContext('JSON.stringify(INTERNAL_QUOTES)', sandbox)) as Record<string, any[]>;

  assert.ok(Array.isArray(data.pt) && data.pt.length >= 12);
  assert.ok(Array.isArray(data.en) && data.en.length >= 12);

  for (const lang of ['pt', 'en']) {
    for (const item of data[lang]) {
      assert.deepEqual(Object.keys(item).sort(), ['author', 'text']);
      assert.equal(typeof item.text, 'string');
      assert.ok(item.text.trim().length > 10);
      assert.equal(typeof item.author, 'string');
      assert.ok(item.author.trim().length > 2);
    }
  }
});

test('QuotesStore persists custom quotes CRUD (with optional author) and preferences in localStorage', () => {
  const { sandbox, storageMap } = loadQuotesContext();

  const out = JSON.parse(vm.runInContext(`(() => {
    QuotesStore.load();
    const q1 = QuotesStore.addCustomQuote('  Foco é dizer não.  ', '');
    const q2 = QuotesStore.addCustomQuote('Menos, porém melhor.', 'Dieter Rams');

    QuotesStore.state.frequency = 'manual';
    QuotesStore.state.style = { size: 18, font: 'playfair', align: 'left', showAuthor: false };
    QuotesStore.state.selection = {
      key: quoteMakeKey('custom', q2.text, q2.author),
      text: q2.text,
      author: q2.author,
      source: 'custom',
      dayKey: '2026-11-19'
    };
    QuotesStore.save();

    const updated = QuotesStore.updateCustomQuote(q2.id, 'Menos, porém melhor sempre.', 'Dieter Rams');
    const deletedOk = QuotesStore.deleteCustomQuote(q1.id);

    // Reload from localStorage
    QuotesStore.state = defaultQuotesState();
    QuotesStore.load();
    return JSON.stringify({
      q1Author: q1.author,
      updatedText: updated.text,
      deletedOk,
      reloadedCustom: QuotesStore.state.custom,
      reloadedFreq: QuotesStore.state.frequency,
      reloadedStyle: QuotesStore.state.style,
      reloadedSel: QuotesStore.state.selection
    });
  })()`, sandbox));

  assert.equal(out.q1Author, '');
  assert.equal(out.updatedText, 'Menos, porém melhor sempre.');
  assert.equal(out.deletedOk, true);
  assert.equal(out.reloadedCustom.length, 1);
  assert.equal(out.reloadedCustom[0].text, 'Menos, porém melhor sempre.');
  assert.equal(out.reloadedFreq, 'manual');
  assert.deepEqual(out.reloadedStyle, { size: 18, font: 'playfair', align: 'left', showAuthor: false });
  assert.equal(out.reloadedSel.text, 'Menos, porém melhor sempre.');
  assert.ok(storageMap.has('fluxo-quotes-v1'));
});

test('resolveQuoteSelection enforces non-consecutive quotes across daily, open, and manual frequencies', () => {
  const { sandbox } = loadQuotesContext();

  const out = JSON.parse(vm.runInContext(`(() => {
    QuotesStore.load();
    QuotesStore.state.sources = { internal: false, custom: true, api: false };
    QuotesStore.addCustomQuote('Quote A', 'Author A');
    QuotesStore.addCustomQuote('Quote B', 'Author B');

    // 1) Daily mode: stable within same day, rotates next day without repeating
    QuotesStore.state.frequency = 'daily';
    const d1a = QuotesStore.resolve('boot', { today: '2026-11-19', lang: 'en', rng: () => 0 }).activeQuote;
    const d1b = QuotesStore.resolve('boot', { today: '2026-11-19', lang: 'en', rng: () => 0.99 }).activeQuote;
    const d2 = QuotesStore.resolve('boot', { today: '2026-11-20', lang: 'en', rng: () => 0 }).activeQuote;

    // 2) Open mode: always rotates on boot without consecutive repeats
    QuotesStore.state.frequency = 'open';
    let prevOpen = d2.key;
    let repeatedOnOpen = false;
    for (let i = 0; i < 10; i++) {
      const next = QuotesStore.resolve('boot', { today: '2026-11-20', lang: 'en', rng: () => 0 }).activeQuote;
      if (next.key === prevOpen) repeatedOnOpen = true;
      prevOpen = next.key;
    }

    // 3) Manual mode: keeps quote across boots, rotates only on manual trigger
    QuotesStore.state.frequency = 'manual';
    const mStart = QuotesStore.resolve('sync', { today: '2026-11-20', lang: 'en' }).activeQuote;
    const mBoot1 = QuotesStore.resolve('boot', { today: '2026-11-21', lang: 'en', rng: () => 0.99 }).activeQuote;
    const mNext = QuotesStore.resolve('manual', { today: '2026-11-21', lang: 'en', rng: () => 0 }).activeQuote;

    // 4) Empty pool fallback: disabling remaining sources yields null gracefully
    QuotesStore.state.sources = { internal: false, custom: false, api: false };
    const emptyRes = QuotesStore.resolve('sync', { today: '2026-11-21', lang: 'en' }).activeQuote;

    return JSON.stringify({
      d1aKey: d1a.key,
      d1bKey: d1b.key,
      d2Key: d2.key,
      repeatedOnOpen,
      mStartKey: mStart.key,
      mBoot1Key: mBoot1.key,
      mNextKey: mNext.key,
      emptyRes
    });
  })()`, sandbox));

  assert.equal(out.d1aKey, out.d1bKey);
  assert.notEqual(out.d2Key, out.d1aKey);
  assert.equal(out.repeatedOnOpen, false);
  assert.equal(out.mBoot1Key, out.mStartKey);
  assert.notEqual(out.mNextKey, out.mStartKey);
  assert.equal(out.emptyRes, null);
});

test('QuotesStore.refreshApiCache respects TTL cache, avoids fetch on every open, never fabricates authors, and falls back offline', async () => {
  const { sandbox } = loadQuotesContext();

  const outJson = await vm.runInContext(`(async () => {
    QuotesStore.load();
    let fetchCalls = 0;
    const mockFetchOk = async (url) => {
      fetchCalls++;
      return {
        ok: true,
        json: async () => ({
          quotes: [
            { id: 1, quote: 'Action is the foundational key to all success.', author: 'Pablo Picasso' },
            { id: 2, quote: 'Stay curious and keep learning every single day.', author: 'Unknown' },
            { id: 3, quote: 'Short', author: 'Too Short' }
          ],
          total: 100
        })
      };
    };

    // Disabled API -> zero fetches
    const disabledRes = await QuotesStore.refreshApiCache({ fetchFn: mockFetchOk, now: 1000000 });

    // Enabled API with empty cache -> 1 fetch
    QuotesStore.state.sources.api = true;
    const fetchedRes = await QuotesStore.refreshApiCache({ fetchFn: mockFetchOk, now: 1000000 });

    // Re-check 1 hour later -> cache still fresh, zero new fetches
    const freshRes = await QuotesStore.refreshApiCache({ fetchFn: mockFetchOk, now: 1000000 + 3600 * 1000 });

    // Expired after 25 hours while offline -> zero fetches, existing cache preserved
    const offlineRes = await QuotesStore.refreshApiCache({
      fetchFn: mockFetchOk,
      now: 1000000 + 25 * 3600 * 1000,
      navigatorOnline: false
    });

    // Expired while online but network errors -> preserves existing cache cleanly
    const mockFetchFail = async () => { throw new Error('Network down'); };
    const failRes = await QuotesStore.refreshApiCache({
      fetchFn: mockFetchFail,
      now: 1000000 + 25 * 3600 * 1000,
      navigatorOnline: true
    });

    return JSON.stringify({
      fetchCalls,
      disabledReason: disabledRes.reason,
      fetchedOk: fetchedRes.ok,
      fetchedItems: fetchedRes.items,
      freshReason: freshRes.reason,
      offlineReason: offlineRes.reason,
      offlineItemsCount: offlineRes.items.length,
      failReason: failRes.reason,
      failItemsCount: failRes.items.length
    });
  })()`, sandbox);

  const out = JSON.parse(outJson);
  assert.equal(out.disabledReason, 'disabled');
  assert.equal(out.fetchCalls, 1);
  assert.equal(out.fetchedOk, true);
  assert.equal(out.fetchedItems.length, 2);
  assert.equal(out.fetchedItems[0].author, 'Pablo Picasso');
  assert.equal(out.fetchedItems[1].author, '');
  assert.equal(out.freshReason, 'fresh');
  assert.equal(out.offlineReason, 'offline');
  assert.equal(out.offlineItemsCount, 2);
  assert.equal(out.failReason, 'error');
  assert.equal(out.failItemsCount, 2);
});

test('i18n includes PT and EN translations for Quotes drawer and settings', () => {
  const { sandbox } = loadQuotesContext();
  const out = JSON.parse(vm.runInContext(`JSON.stringify({
    ptDrawer: I18N_DICT.pt['panel.drawer.quotes'],
    enDrawer: I18N_DICT.en['panel.drawer.quotes'],
    ptHome: I18N_DICT.pt['home.layout.quote'],
    enHome: I18N_DICT.en['home.layout.quote'],
    ptDaily: I18N_DICT.pt['panel.quotes.freqDaily'],
    enDaily: I18N_DICT.en['panel.quotes.freqDaily']
  })`, sandbox));

  assert.equal(out.ptDrawer, 'Citações');
  assert.equal(out.enDrawer, 'Quotes');
  assert.equal(out.ptHome, 'Citação');
  assert.equal(out.enHome, 'Quote');
  assert.equal(out.ptDaily, 'Diariamente');
  assert.equal(out.enDaily, 'Daily');
});
