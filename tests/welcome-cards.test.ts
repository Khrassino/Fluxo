import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function loadWelcomeContext(initialStoreJson?: string | null) {
  const noop = () => {};
  const storage = new Map<string, string>();
  if (initialStoreJson) storage.set('fluxo-state-v1', initialStoreJson);

  const appendedToBody: any[] = [];
  const makeNode = (tag: string) => {
    const attrs: Record<string, string> = {};
    const classes = new Set<string>();
    const listeners: Record<string, Array<(e?: any) => void>> = {};
    const node: any = {
      tagName: tag.toUpperCase(),
      id: '',
      className: '',
      hidden: false,
      isConnected: true,
      dataset: {} as Record<string, string>,
      style: {
        _props: {} as Record<string, string>,
        setProperty(k: string, v: string) { this._props[k] = String(v); },
        removeProperty(k: string) { delete this._props[k]; },
      },
      innerHTML: '',
      classList: {
        add: (...c: string[]) => c.forEach(x => classes.add(x)),
        remove: (...c: string[]) => c.forEach(x => classes.delete(x)),
        toggle: (c: string, force?: boolean) => {
          const next = force === undefined ? !classes.has(c) : !!force;
          if (next) classes.add(c);
          else classes.delete(c);
          return next;
        },
        contains: (c: string) => classes.has(c),
      },
      setAttribute: (k: string, v: string) => { attrs[k] = String(v); },
      getAttribute: (k: string) => attrs[k] ?? null,
      addEventListener: (ev: string, fn: (e?: any) => void) => {
        if (!listeners[ev]) listeners[ev] = [];
        listeners[ev].push(fn);
      },
      querySelector: (sel: string) => {
        if (sel === '[data-wact="done"]') return { addEventListener: (ev: string, fn: () => void) => { node._doneClick = fn; } };
        if (sel === '[data-wact="close"]') return { addEventListener: (ev: string, fn: () => void) => { node._closeClick = fn; } };
        if (sel === '[data-wact="skip"]') return { addEventListener: (ev: string, fn: () => void) => { node._skipClick = fn; } };
        return null;
      },
      remove: noop,
    };
    return node;
  };

  let createdCard: any = null;
  const docListeners: Record<string, Array<(e: any) => void>> = {};

  const sandbox: any = {
    console,
    Math,
    Date,
    Object,
    Array,
    JSON,
    String,
    Number,
    Boolean,
    setTimeout: (fn: () => void) => { fn(); return 1; },
    clearTimeout: noop,
    innerWidth: 1440,
    localStorage: {
      getItem: (k: string) => (storage.has(k) ? storage.get(k)! : null),
      setItem: (k: string, v: string) => { storage.set(k, String(v)); },
      removeItem: (k: string) => { storage.delete(k); },
      get length() { return storage.size; },
      key: (i: number) => Array.from(storage.keys())[i] ?? null,
    },
    document: {
      documentElement: { lang: 'en', dataset: {}, style: { setProperty: noop } },
      body: {
        dataset: {} as Record<string, string>,
        classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
        append: (n: any) => { appendedToBody.push(n); createdCard = n; },
      },
      getElementById: (id: string) => {
        if (id === 'welcome-card') return createdCard;
        if (id === 'ws-topbar') return { getBoundingClientRect: () => ({ top: 14, bottom: 118, height: 104 }) };
        return null;
      },
      createElement: (tag: string) => makeNode(tag),
      addEventListener: (ev: string, fn: (e: any) => void) => {
        if (!docListeners[ev]) docListeners[ev] = [];
        docListeners[ev].push(fn);
      },
      querySelectorAll: () => [],
      querySelector: () => null,
    },
    window: null as any,
    addEventListener: noop,
    Router: { route: 'home', anchor: 'bc' },
    _storage: storage,
    _docListeners: docListeners,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  for (const rel of ['public/js/util.js', 'public/js/i18n.js', 'public/js/storage.js', 'public/js/welcome.js']) {
    const code = fs.readFileSync(path.resolve(process.cwd(), rel), 'utf8');
    vm.runInContext(code, sandbox, { filename: rel });
  }

  return { sandbox, storage, docListeners };
}

test('Store.defaults and Store.load initialize and migrate meta.seenPages across all 5 routes', () => {
  // Fresh state
  const { sandbox } = loadWelcomeContext(null);
  const freshState = JSON.parse(vm.runInContext('JSON.stringify(Store.load())', sandbox));
  assert.deepEqual(freshState.meta.seenPages, {
    home: false,
    timer: false,
    tracker: false,
    tasks: false,
    workspace: false,
  });

  // Legacy state lacking seenPages + partially seen state
  const legacyJson = JSON.stringify({ v: 1, lang: 'pt', meta: { firstDay: '2026-01-01', seenTip: true } });
  const { sandbox: legacyCtx } = loadWelcomeContext(legacyJson);
  const migrated = JSON.parse(vm.runInContext('JSON.stringify(Store.load())', legacyCtx));
  assert.deepEqual(migrated.meta.seenPages, {
    home: false,
    timer: false,
    tracker: false,
    tasks: false,
    workspace: false,
  });

  const partialJson = JSON.stringify({ v: 1, lang: 'en', meta: { seenPages: { home: true, workspace: 'yes' } } });
  const { sandbox: partialCtx } = loadWelcomeContext(partialJson);
  const partial = JSON.parse(vm.runInContext('JSON.stringify(Store.load())', partialCtx));
  assert.deepEqual(partial.meta.seenPages, {
    home: true,
    timer: false,
    tracker: false,
    tasks: false,
    workspace: true,
  });
});

test('pure welcome helpers compute visibility, transitions, and dock-aware placements cleanly', () => {
  const { sandbox } = loadWelcomeContext();
  const res = JSON.parse(vm.runInContext(`(() => {
    const initSeen = resetWelcomeSeen();
    const showHome = shouldShowWelcome('home', initSeen);
    const showUnknown = shouldShowWelcome('settings', initSeen);
    const afterHome = markWelcomeSeen(initSeen, 'home');
    const showHomeAgain = shouldShowWelcome('home', afterHome);
    const showTimerStill = shouldShowWelcome('timer', afterHome);
    const allSeen = markAllWelcomeSeen();
    const showAnyAfterSkipAll = WELCOME_PAGES.some(p => shouldShowWelcome(p, allSeen));

    const anchors = {
      homeBcDesktop: computeWelcomeAnchor('home', 'bc', false),
      homeBrDesktop: computeWelcomeAnchor('home', 'br', false),
      homeMrDesktop: computeWelcomeAnchor('home', 'mr', false),
      wsBcDesktop: computeWelcomeAnchor('workspace', 'bc', false),
      wsTrDesktop: computeWelcomeAnchor('workspace', 'tr', false),
      homeBcMobile: computeWelcomeAnchor('home', 'bc', true),
      homeTcMobile: computeWelcomeAnchor('home', 'tc', true),
      wsMobile: computeWelcomeAnchor('workspace', 'bc', true),
    };

    const svgs = {};
    for (const p of WELCOME_PAGES) svgs[p] = welcomeIllustrationSvg(p);

    return JSON.stringify({
      showHome,
      showUnknown,
      showHomeAgain,
      showTimerStill,
      showAnyAfterSkipAll,
      anchors,
      svgs,
    });
  })()`, sandbox));

  assert.equal(res.showHome, true);
  assert.equal(res.showUnknown, false);
  assert.equal(res.showHomeAgain, false);
  assert.equal(res.showTimerStill, true);
  assert.equal(res.showAnyAfterSkipAll, false);

  assert.deepEqual(res.anchors, {
    homeBcDesktop: 'bottom-right',
    homeBrDesktop: 'bottom-left',
    homeMrDesktop: 'bottom-left',
    wsBcDesktop: 'top-right',
    wsTrDesktop: 'top-left',
    homeBcMobile: 'mobile-bottom',
    homeTcMobile: 'mobile-bottom-low',
    wsMobile: 'mobile-top',
  });

  const uniqueSvgs = new Set(Object.values(res.svgs));
  assert.equal(uniqueSvgs.size, 5);
  for (const svg of uniqueSvgs) {
    assert.ok(String(svg).includes('<svg class="welcome-svg"'));
    assert.ok(String(svg).includes('aria-hidden="true"'));
  }
});

test('Welcome controller displays on first visit per page, persists dismiss/skipAll, updates on language change, and replays cleanly', () => {
  const { sandbox, storage } = loadWelcomeContext();
  const out = JSON.parse(vm.runInContext(`(() => {
    Store.load();
    Welcome.init();

    // First visit on home -> shown
    Welcome.onRoute('home');
    const homeShown = !Welcome.el.hidden;
    const homeTitleEn = Welcome.el.innerHTML.includes('Your calm starting point');

    // Switch language to PT while home welcome card is open -> updates immediately
    Store.state.lang = 'pt';
    Welcome.syncLanguage();
    const homeTitlePt = Welcome.el.innerHTML.includes('Seu ponto de partida calmo');

    // Dismiss home -> hidden & persisted, returning to home stays hidden
    Welcome.dismiss('home');
    const hiddenAfterDismiss = Welcome.el.hidden;
    Welcome.onRoute('home');
    const stillHiddenOnRevisit = Welcome.el.hidden;

    // First visit on workspace -> shown at top-right and sets body dataset
    Router.route = 'workspace';
    Welcome.onRoute('workspace');
    const wsShown = !Welcome.el.hidden;
    const wsPos = Welcome.el.dataset.pos;
    const bodyPosDesktop = document.body.dataset.welcomePos;

    // Mobile workspace -> measures #ws-topbar clearance
    window.innerWidth = 390;
    Welcome.syncPlacement();
    const wsPosMobile = Welcome.el.dataset.pos;
    const mobileTopOffset = Welcome.el.style._props['--welcome-top'];
    window.innerWidth = 1440;

    // Skip all -> hides workspace, clears body.dataset.welcomePos, and marks remaining pages seen
    Welcome.dismissAll();
    const bodyPosAfterSkip = document.body.dataset.welcomePos || '';
    Welcome.onRoute('tasks');
    const tasksHiddenAfterSkipAll = Welcome.el.hidden;

    // Replay all -> re-enables and displays for current route
    Router.route = 'tasks';
    Welcome.replayAll();
    const tasksShownAfterReplay = !Welcome.el.hidden;

    return JSON.stringify({
      homeShown,
      homeTitleEn,
      homeTitlePt,
      hiddenAfterDismiss,
      stillHiddenOnRevisit,
      wsShown,
      wsPos,
      bodyPosDesktop,
      wsPosMobile,
      mobileTopOffset,
      bodyPosAfterSkip,
      tasksHiddenAfterSkipAll,
      tasksShownAfterReplay,
      savedSeen: Store.state.meta.seenPages,
    });
  })()`, sandbox));

  assert.equal(out.homeShown, true);
  assert.equal(out.homeTitleEn, true);
  assert.equal(out.homeTitlePt, true);
  assert.equal(out.hiddenAfterDismiss, true);
  assert.equal(out.stillHiddenOnRevisit, true);
  assert.equal(out.wsShown, true);
  assert.equal(out.wsPos, 'top-right');
  assert.equal(out.bodyPosDesktop, 'top-right');
  assert.equal(out.wsPosMobile, 'mobile-top');
  assert.equal(out.mobileTopOffset, '128px');
  assert.equal(out.bodyPosAfterSkip, '');
  assert.equal(out.tasksHiddenAfterSkipAll, true);
  assert.equal(out.tasksShownAfterReplay, true);
  assert.deepEqual(out.savedSeen, {
    home: false,
    timer: false,
    tracker: false,
    tasks: false,
    workspace: false,
  });

  // Ensure persisted in localStorage
  const savedRaw = storage.get('fluxo-state-v1');
  assert.ok(savedRaw && JSON.parse(savedRaw).meta.seenPages);
});

test('i18n provides complete PT and EN keys for all 5 welcome cards and replay control', () => {
  const { sandbox } = loadWelcomeContext();
  const check = JSON.parse(vm.runInContext(`(() => {
    const required = [
      'welcome.ariaLabel', 'welcome.closeAria', 'welcome.gotIt', 'welcome.skipAll',
      'panel.general.guidesSub', 'panel.general.guidesReplay', 'panel.general.guidesNote', 'panel.general.guidesToast'
    ];
    for (const p of WELCOME_PAGES) {
      required.push('welcome.' + p + '.kicker', 'welcome.' + p + '.title', 'welcome.' + p + '.desc',
        'welcome.' + p + '.tip1', 'welcome.' + p + '.tip2', 'welcome.' + p + '.tip3');
    }
    const missingPt = required.filter(k => !I18N_DICT.pt[k]);
    const missingEn = required.filter(k => !I18N_DICT.en[k]);
    return JSON.stringify({ total: required.length, missingPt, missingEn });
  })()`, sandbox));

  assert.equal(check.total, 38);
  assert.deepEqual(check.missingPt, []);
  assert.deepEqual(check.missingEn, []);
});
