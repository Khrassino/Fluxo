'use strict';
/* ============ quotes-store.js — armazenamento, biblioteca, cache API e seleção ============ */

const QUOTES_STORAGE_KEY = 'fluxo-quotes-v1';
const QUOTES_API_CACHE_KEY = 'fluxo-quotes-api-cache-v1';
const QUOTES_API_ENDPOINT = 'https://dummyjson.com/quotes';
const QUOTES_API_TTL_MS = 24 * 60 * 60 * 1000;
const QUOTES_API_BATCH_LIMIT = 40;
const QUOTES_API_TIMEOUT_MS = 5000;

/* Biblioteca interna offline: exclusivamente texto e autor/referência verificados, sem categorias. */
const INTERNAL_QUOTES = {
  pt: [
    {
      text: 'O correr da vida embrulha tudo. A vida é assim: esquenta e esfria, aperta e daí afrouxa, sossega e depois desinquieta.',
      author: 'Guimarães Rosa · Grande Sertão: Veredas'
    },
    {
      text: 'Tudo vale a pena se a alma não é pequena.',
      author: 'Fernando Pessoa · Mensagem'
    },
    {
      text: 'Tenho em mim todos os sonhos do mundo.',
      author: 'Fernando Pessoa (Álvaro de Campos)'
    },
    {
      text: 'Não é que tenhamos pouco tempo de vida, mas que desperdiçamos muito dele.',
      author: 'Sêneca · Sobre a Brevidade da Vida'
    },
    {
      text: 'Você tem poder sobre a sua mente — não sobre os acontecimentos externos. Perceba isso e encontrará força.',
      author: 'Marco Aurélio · Meditações'
    },
    {
      text: 'A perfeição é alcançada não quando não há mais nada a acrescentar, mas quando não há mais nada a retirar.',
      author: 'Antoine de Saint-Exupéry · Terra dos Homens'
    },
    {
      text: 'A atenção é a forma mais rara e mais pura de generosidade.',
      author: 'Simone Weil · A Gravidade e a Graça'
    },
    {
      text: 'Faça o que puder, com o que tiver, onde estiver.',
      author: 'Theodore Roosevelt'
    },
    {
      text: 'Comece de onde você está. Use o que você tem. Faça o que você pode.',
      author: 'Arthur Ashe'
    },
    {
      text: 'Quem tem um porquê para viver pode suportar quase qualquer como.',
      author: 'Friedrich Nietzsche · Crepúsculo dos Ídolos'
    },
    {
      text: 'A verdadeira viagem de descobrimento não consiste em procurar novas paisagens, mas em ter novos olhos.',
      author: 'Marcel Proust · Em Busca do Tempo Perdido'
    },
    {
      text: 'Caminhante, não há caminho, faz-se caminho ao andar.',
      author: 'Antonio Machado · Campos de Castilla'
    },
    {
      text: 'De tudo, ficaram três coisas: a certeza de que estamos começando, a certeza de que é preciso continuar e a certeza de que podemos ser interrompidos antes de terminar.',
      author: 'Fernando Sabino · O Encontro Marcado'
    },
    {
      text: 'Renda-se, como eu me rendi. Mergulhe no que você não conhece como eu mergulhei.',
      author: 'Clarice Lispector'
    },
    {
      text: 'A imaginação é mais importante que o conhecimento.',
      author: 'Albert Einstein'
    },
    {
      text: 'A disciplina é a ponte entre objetivos e realizações.',
      author: 'Jim Rohn'
    }
  ],
  en: [
    {
      text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
      author: 'Will Durant'
    },
    {
      text: 'Simplicity is about subtracting the obvious and adding the meaningful.',
      author: 'John Maeda · The Laws of Simplicity'
    },
    {
      text: 'You have power over your mind — not outside events. Realize this, and you will find strength.',
      author: 'Marcus Aurelius · Meditations'
    },
    {
      text: 'Well begun is half done.',
      author: 'Aristotle · Politics'
    },
    {
      text: 'It is not that we have a short time to live, but that we waste a lot of it.',
      author: 'Seneca · On the Shortness of Life'
    },
    {
      text: 'How we spend our days is, of course, how we spend our lives.',
      author: 'Annie Dillard · The Writing Life'
    },
    {
      text: 'Focus is a matter of deciding what things you are not going to do.',
      author: 'John Carmack'
    },
    {
      text: 'Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away.',
      author: 'Antoine de Saint-Exupéry · Wind, Sand and Stars'
    },
    {
      text: 'Do what you can, with what you have, where you are.',
      author: 'Theodore Roosevelt'
    },
    {
      text: 'Action is the foundational key to all success.',
      author: 'Pablo Picasso'
    },
    {
      text: 'The secret of getting ahead is getting started.',
      author: 'Mark Twain'
    },
    {
      text: 'Small deeds done are better than great deeds planned.',
      author: 'Peter Marshall'
    },
    {
      text: 'Quiet minds cannot be perplexed or frightened, but go on in fortune or misfortune at their own private pace.',
      author: 'Robert Louis Stevenson'
    },
    {
      text: 'The best way out is always through.',
      author: 'Robert Frost · A Servant to Servants'
    },
    {
      text: 'In the midst of chaos, there is also opportunity.',
      author: 'Sun Tzu · The Art of War'
    },
    {
      text: 'Attention is the rarest and purest form of generosity.',
      author: 'Simone Weil · Gravity and Grace'
    }
  ]
};

function quoteClamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function quoteTodayKey(d) {
  if (typeof todayKey === 'function') return todayKey(d);
  const dt = d || new Date();
  return dt.getFullYear() + '-' +
    String(dt.getMonth() + 1).padStart(2, '0') + '-' +
    String(dt.getDate()).padStart(2, '0');
}

function quoteCleanText(v, maxLen) {
  const s = String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
  if (!s) return '';
  return maxLen && s.length > maxLen ? s.slice(0, maxLen).trim() : s;
}

function quoteMakeKey(source, text, author) {
  const norm = quoteCleanText(text).toLowerCase() + '|' + quoteCleanText(author).toLowerCase();
  let hash = 2166136261;
  for (let i = 0; i < norm.length; i++) {
    hash ^= norm.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (source || 'q') + ':' + (hash >>> 0).toString(36);
}

function defaultQuotesState() {
  return {
    v: 1,
    enabled: true,
    frequency: 'daily', // 'daily' | 'open' | 'manual'
    sources: {
      internal: true,
      custom: true,
      api: false
    },
    style: {
      size: 15,         // 12..24 px
      font: 'inter',    // id de FONTS
      align: 'center',  // 'left' | 'center' | 'right'
      showAuthor: true
    },
    custom: [],         // [{ id, text, author }]
    selection: {
      key: '',
      text: '',
      author: '',
      source: '',
      dayKey: ''
    }
  };
}

function normalizeCustomQuoteItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const text = quoteCleanText(raw.text, 500);
  if (!text) return null;
  const author = quoteCleanText(raw.author, 120);
  const id = typeof raw.id === 'string' && raw.id.trim()
    ? raw.id.trim()
    : ('cq_' + quoteMakeKey('custom', text, author).split(':')[1] + '_' + Math.random().toString(36).slice(2, 6));
  return { id, text, author };
}

function normalizeQuotesState(raw) {
  const base = defaultQuotesState();
  if (!raw || typeof raw !== 'object') return base;

  const freq = ['daily', 'open', 'manual'].includes(raw.frequency) ? raw.frequency : base.frequency;

  const rawSrc = raw.sources && typeof raw.sources === 'object' ? raw.sources : {};
  const sources = {
    internal: rawSrc.internal !== false,
    custom: rawSrc.custom !== false,
    api: !!rawSrc.api
  };

  const rawStyle = raw.style && typeof raw.style === 'object' ? raw.style : {};
  const sizeNum = Number(rawStyle.size);
  const validFonts = typeof FONTS !== 'undefined' && Array.isArray(FONTS)
    ? FONTS.map(f => f.id)
    : ['inter'];
  const font = validFonts.includes(rawStyle.font) ? rawStyle.font : base.style.font;
  const align = ['left', 'center', 'right'].includes(rawStyle.align) ? rawStyle.align : base.style.align;

  const custom = Array.isArray(raw.custom)
    ? raw.custom.map(normalizeCustomQuoteItem).filter(Boolean)
    : [];

  const rawSel = raw.selection && typeof raw.selection === 'object' ? raw.selection : {};
  const selText = quoteCleanText(rawSel.text, 500);
  const selAuthor = quoteCleanText(rawSel.author, 120);
  const selSource = ['internal', 'custom', 'api'].includes(rawSel.source) ? rawSel.source : '';
  const selDay = typeof rawSel.dayKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawSel.dayKey) ? rawSel.dayKey : '';
  const selKey = selText
    ? (typeof rawSel.key === 'string' && rawSel.key.trim() ? rawSel.key.trim() : quoteMakeKey(selSource || 'q', selText, selAuthor))
    : '';

  return {
    v: 1,
    enabled: raw.enabled !== false,
    frequency: freq,
    sources,
    style: {
      size: Number.isFinite(sizeNum) ? quoteClamp(Math.round(sizeNum), 12, 24) : base.style.size,
      font,
      align,
      showAuthor: rawStyle.showAuthor !== false
    },
    custom,
    selection: {
      key: selKey,
      text: selText,
      author: selAuthor,
      source: selSource,
      dayKey: selDay
    }
  };
}

function getInternalQuotesList(lang) {
  const code = lang === 'pt' ? 'pt' : 'en';
  const list = INTERNAL_QUOTES[code] || INTERNAL_QUOTES.en;
  return list.map(q => ({
    key: quoteMakeKey('internal', q.text, q.author),
    text: q.text,
    author: q.author,
    source: 'internal'
  }));
}

function sanitizeApiQuotesPayload(payload) {
  const arr = Array.isArray(payload)
    ? payload
    : (payload && Array.isArray(payload.quotes) ? payload.quotes : null);
  if (!arr) return { valid: false, items: [], total: 0 };

  const seen = new Set();
  const items = [];
  for (let i = 0; i < arr.length; i++) {
    const raw = arr[i];
    if (!raw || typeof raw !== 'object') continue;
    const text = quoteCleanText(raw.quote != null ? raw.quote : raw.text, 280);
    if (!text || text.length < 8) continue;
    const norm = text.toLowerCase();
    if (seen.has(norm)) continue;
    seen.add(norm);
    // Nunca inventar autoria; usar apenas se confirmada pelo retorno
    const rawAuthor = quoteCleanText(raw.author, 120);
    const author = /^unknown$/i.test(rawAuthor) ? '' : rawAuthor;
    items.push({ text, author });
  }

  const totalNum = payload && Number.isFinite(Number(payload.total)) ? Math.max(0, Math.round(Number(payload.total))) : items.length;
  return { valid: true, items, total: totalNum };
}

function getQuotePool(state, apiCacheItems, lang) {
  const st = state || defaultQuotesState();
  const src = st.sources || {};
  const pool = [];
  const seenText = new Set();

  const pushUnique = (item) => {
    const clean = quoteCleanText(item.text, 500);
    if (!clean) return;
    const sig = clean.toLowerCase();
    if (seenText.has(sig)) return;
    seenText.add(sig);
    const author = quoteCleanText(item.author, 120);
    pool.push({
      key: item.key || quoteMakeKey(item.source, clean, author),
      text: clean,
      author,
      source: item.source
    });
  };

  if (src.custom && Array.isArray(st.custom)) {
    st.custom.forEach(c => {
      pushUnique({
        key: quoteMakeKey('custom', c.text, c.author),
        text: c.text,
        author: c.author,
        source: 'custom'
      });
    });
  }

  if (src.internal) {
    getInternalQuotesList(lang).forEach(pushUnique);
  }

  if (src.api && Array.isArray(apiCacheItems)) {
    apiCacheItems.forEach(a => {
      pushUnique({
        key: quoteMakeKey('api', a.text, a.author),
        text: a.text,
        author: a.author,
        source: 'api'
      });
    });
  }

  return pool;
}

function pickNonConsecutiveQuote(pool, lastKey, rng) {
  if (!Array.isArray(pool) || pool.length === 0) return null;
  if (pool.length === 1) return pool[0];
  const candidates = lastKey ? pool.filter(item => item.key !== lastKey) : pool;
  const list = candidates.length > 0 ? candidates : pool;
  const randFn = typeof rng === 'function' ? rng : Math.random;
  const rawIdx = Math.floor(randFn() * list.length);
  const idx = quoteClamp(Number.isFinite(rawIdx) ? rawIdx : 0, 0, list.length - 1);
  return list[idx];
}

function resolveQuoteSelection(state, apiCacheItems, ctx) {
  const st = state || defaultQuotesState();
  const c = ctx || {};
  const trigger = c.trigger || 'sync'; // 'boot' | 'manual' | 'sync' | 'lang'
  const today = c.today || quoteTodayKey();
  const lang = c.lang === 'pt' ? 'pt' : 'en';
  const rng = c.rng;

  const pool = getQuotePool(st, apiCacheItems, lang);
  if (!st.enabled || pool.length === 0) {
    return {
      pool,
      activeQuote: null,
      selection: st.selection,
      changed: false
    };
  }

  const sel = st.selection || {};
  const matched = sel.key ? pool.find(item => item.key === sel.key) : null;

  let shouldRotate = false;
  if (trigger === 'manual') {
    shouldRotate = true;
  } else if (!matched) {
    shouldRotate = true;
  } else if (st.frequency === 'open') {
    shouldRotate = trigger === 'boot';
  } else if (st.frequency === 'daily') {
    shouldRotate = sel.dayKey !== today;
  } else if (st.frequency === 'manual') {
    shouldRotate = false;
  }

  if (!shouldRotate && matched) {
    const nextSel = {
      key: matched.key,
      text: matched.text,
      author: matched.author,
      source: matched.source,
      dayKey: sel.dayKey || today
    };
    return {
      pool,
      activeQuote: matched,
      selection: nextSel,
      changed: nextSel.key !== sel.key || nextSel.dayKey !== sel.dayKey
    };
  }

  const picked = pickNonConsecutiveQuote(pool, sel.key || '', rng);
  if (!picked) {
    return { pool, activeQuote: null, selection: sel, changed: false };
  }

  const nextSel = {
    key: picked.key,
    text: picked.text,
    author: picked.author,
    source: picked.source,
    dayKey: today
  };

  return {
    pool,
    activeQuote: picked,
    selection: nextSel,
    changed: true
  };
}

function isQuotesApiCacheFresh(cache, now) {
  if (!cache || typeof cache !== 'object') return false;
  if (!Array.isArray(cache.items) || cache.items.length === 0) return false;
  const ts = Number(cache.fetchedAt);
  if (!Number.isFinite(ts) || ts <= 0) return false;
  const cur = Number.isFinite(now) ? now : Date.now();
  return (cur - ts) >= 0 && (cur - ts) < QUOTES_API_TTL_MS;
}

const QuotesStore = {
  state: defaultQuotesState(),
  apiCache: { fetchedAt: 0, nextSkip: 0, total: 0, items: [] },
  _refreshPromise: null,

  load() {
    let raw = null;
    try { raw = localStorage.getItem(QUOTES_STORAGE_KEY); } catch (e) { /* ignora */ }
    if (raw) {
      try { this.state = normalizeQuotesState(JSON.parse(raw)); }
      catch (e) { this.state = defaultQuotesState(); }
    } else {
      this.state = defaultQuotesState();
    }
    this.loadApiCache();
    return this.state;
  },

  save() {
    try {
      localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(this.state));
      return true;
    } catch (e) {
      return false;
    }
  },

  loadApiCache() {
    let raw = null;
    try { raw = localStorage.getItem(QUOTES_API_CACHE_KEY); } catch (e) { /* ignora */ }
    if (!raw) {
      this.apiCache = { fetchedAt: 0, nextSkip: 0, total: 0, items: [] };
      return this.apiCache;
    }
    try {
      const parsed = JSON.parse(raw);
      const clean = sanitizeApiQuotesPayload(parsed && Array.isArray(parsed.items)
        ? parsed.items.map(it => ({ quote: it.text, author: it.author }))
        : []);
      this.apiCache = {
        fetchedAt: Number.isFinite(Number(parsed && parsed.fetchedAt)) ? Number(parsed.fetchedAt) : 0,
        nextSkip: Number.isFinite(Number(parsed && parsed.nextSkip)) ? Math.max(0, Math.round(Number(parsed.nextSkip))) : 0,
        total: Number.isFinite(Number(parsed && parsed.total)) ? Math.max(0, Math.round(Number(parsed.total))) : 0,
        items: clean.valid ? clean.items : []
      };
    } catch (e) {
      this.apiCache = { fetchedAt: 0, nextSkip: 0, total: 0, items: [] };
    }
    return this.apiCache;
  },

  saveApiCache(cache) {
    this.apiCache = cache;
    try {
      localStorage.setItem(QUOTES_API_CACHE_KEY, JSON.stringify(cache));
      return true;
    } catch (e) {
      return false;
    }
  },

  isEnabled() {
    return !!(this.state && this.state.enabled);
  },

  getPool(lang) {
    const l = lang || (typeof getLang === 'function' ? getLang() : 'en');
    return getQuotePool(this.state, this.apiCache.items, l);
  },

  resolve(trigger, opts) {
    const o = opts || {};
    const lang = o.lang || (typeof getLang === 'function' ? getLang() : 'en');
    const today = o.today || quoteTodayKey();
    const res = resolveQuoteSelection(this.state, this.apiCache.items, {
      trigger: trigger || 'sync',
      today,
      lang,
      rng: o.rng
    });
    if (res.changed) {
      this.state.selection = res.selection;
      this.save();
    }
    return res;
  },

  addCustomQuote(text, author) {
    const item = normalizeCustomQuoteItem({
      id: 'cq_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
      text,
      author
    });
    if (!item) return null;
    this.state.custom.unshift(item);
    this.save();
    return item;
  },

  updateCustomQuote(id, text, author) {
    const idx = this.state.custom.findIndex(c => c.id === id);
    if (idx < 0) return null;
    const prev = this.state.custom[idx];
    const cleanText = quoteCleanText(text, 500);
    if (!cleanText) return null;
    const cleanAuthor = quoteCleanText(author, 120);
    const updated = { id: prev.id, text: cleanText, author: cleanAuthor };
    this.state.custom[idx] = updated;

    const prevKey = quoteMakeKey('custom', prev.text, prev.author);
    if (this.state.selection && this.state.selection.key === prevKey) {
      this.state.selection = {
        key: quoteMakeKey('custom', updated.text, updated.author),
        text: updated.text,
        author: updated.author,
        source: 'custom',
        dayKey: this.state.selection.dayKey || quoteTodayKey()
      };
    }
    this.save();
    return updated;
  },

  deleteCustomQuote(id) {
    const idx = this.state.custom.findIndex(c => c.id === id);
    if (idx < 0) return false;
    this.state.custom.splice(idx, 1);
    this.save();
    return true;
  },

  async refreshApiCache(opts) {
    const o = opts || {};
    const force = !!o.force;
    const now = Number.isFinite(o.now) ? o.now : Date.now();
    const fetchFn = o.fetchFn || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
    const isOnline = o.navigatorOnline !== undefined
      ? !!o.navigatorOnline
      : (typeof navigator !== 'undefined' && navigator.onLine === false ? false : true);

    if (!this.state.sources || !this.state.sources.api) {
      return { ok: false, skipped: true, reason: 'disabled', items: this.apiCache.items };
    }
    if (!force && isQuotesApiCacheFresh(this.apiCache, now)) {
      return { ok: true, skipped: true, reason: 'fresh', items: this.apiCache.items };
    }
    if (!isOnline || !fetchFn) {
      return { ok: false, skipped: true, reason: isOnline ? 'no-fetch' : 'offline', items: this.apiCache.items };
    }
    if (this._refreshPromise && !force) {
      return this._refreshPromise;
    }

    const run = async () => {
      const total = this.apiCache.total > 0 ? this.apiCache.total : 0;
      let skip = Number.isFinite(this.apiCache.nextSkip) ? this.apiCache.nextSkip : 0;
      if (total > 0 && skip >= total) skip = 0;

      const url = QUOTES_API_ENDPOINT + '?limit=' + QUOTES_API_BATCH_LIMIT + '&skip=' + skip;
      const hasAbort = typeof AbortController === 'function';
      const ctrl = hasAbort ? new AbortController() : null;
      const timer = ctrl ? setTimeout(() => { try { ctrl.abort(); } catch (e) {} }, QUOTES_API_TIMEOUT_MS) : null;

      try {
        const res = await fetchFn(url, ctrl ? { signal: ctrl.signal } : undefined);
        if (!res || !res.ok) {
          return { ok: false, skipped: false, reason: 'http', items: this.apiCache.items };
        }
        const json = await res.json();
        const parsed = sanitizeApiQuotesPayload(json);
        if (!parsed.valid || parsed.items.length === 0) {
          return { ok: false, skipped: false, reason: 'empty', items: this.apiCache.items };
        }
        const nextTotal = parsed.total > 0 ? parsed.total : parsed.items.length;
        const nextSkip = nextTotal > QUOTES_API_BATCH_LIMIT
          ? (skip + QUOTES_API_BATCH_LIMIT) % nextTotal
          : 0;
        const nextCache = {
          fetchedAt: now,
          nextSkip,
          total: nextTotal,
          items: parsed.items
        };
        this.saveApiCache(nextCache);
        return { ok: true, skipped: false, reason: 'fetched', items: nextCache.items };
      } catch (e) {
        return { ok: false, skipped: false, reason: 'error', items: this.apiCache.items };
      } finally {
        if (timer) clearTimeout(timer);
        this._refreshPromise = null;
      }
    };

    this._refreshPromise = run();
    return this._refreshPromise;
  }
};
