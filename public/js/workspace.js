'use strict';
/* ============ workspace.js — Área de Trabalho (quadro infinito) ============ */

const WS_DB_NAME = 'fluxo-workspace';
const WS_BOARD_KEY = 'board';

/* cursor padronizado da Área de Trabalho: mãozinha pequena coerente com pan e arraste */
const WS_CURSOR_DEFAULT = 'hand';

function wsNormCursor() {
  return WS_CURSOR_DEFAULT;
}

function wsCursorSvg(kind) {
  let path = '';
  if (kind === 'grabbing') {
    path = 'M7.8 12.5V9.3a1.2 1.2 0 0 1 2.4 0v1.7V8.2a1.2 1.2 0 0 1 2.4 0v2.8V8.8a1.2 1.2 0 0 1 2.4 0v2.5V10a1.15 1.15 0 0 1 2.3 0v4.8a5.2 5.2 0 0 1-5.2 5.2h-1.1a4.7 4.7 0 0 1-4-2.2l-1.5-2.5a1.2 1.2 0 0 1 .4-1.65c.55-.35 1.25-.2 1.6.35l.3.5z';
  } else if (kind === 'pointer') {
    path = 'M9.2 13.4V4.5a1.25 1.25 0 0 1 2.5 0v5.8h.3V8.6a1.15 1.15 0 0 1 2.3 0v2.1h.2V9.3a1.1 1.1 0 0 1 2.2 0v2h.2v-1a1.05 1.05 0 0 1 2.1 0v4.8a5.3 5.3 0 0 1-5.3 5.3h-1.2a4.8 4.8 0 0 1-4.1-2.3l-2.1-3.3a1.15 1.15 0 0 1 .4-1.6c.55-.35 1.25-.2 1.6.35l.95 1.35z';
  } else {
    path = 'M8.4 12.2V5.3a1.15 1.15 0 0 1 2.3 0v5V3.9a1.15 1.15 0 0 1 2.3 0v6.4V4.9a1.15 1.15 0 0 1 2.3 0v5.7V7.1a1.1 1.1 0 0 1 2.2 0v7.4a5.4 5.4 0 0 1-5.4 5.4h-1.1a4.8 4.8 0 0 1-4.1-2.3l-2.1-3.3a1.15 1.15 0 0 1 .4-1.6c.55-.35 1.2-.2 1.6.35l1.6 1.9z';
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
    '<path d="' + path + '" fill="#ffffff" stroke="rgba(12,16,28,0.88)" stroke-width="1.65" stroke-linejoin="round" stroke-linecap="round"/>' +
    '</svg>';
}

function wsHandCursorSvg(closed) {
  return wsCursorSvg(closed ? 'grabbing' : 'hand');
}

function wsHandCursorCss(closed) {
  return 'url("data:image/svg+xml,' + encodeURIComponent(wsHandCursorSvg(!!closed)) + '") 11 11, ' + (closed ? 'grabbing' : 'grab');
}

function wsPointerCursorCss() {
  return 'url("data:image/svg+xml,' + encodeURIComponent(wsCursorSvg('pointer')) + '") 9 4, pointer';
}

function wsCursorCss() {
  return wsHandCursorCss(false);
}

const WS_BG_SWATCHES = ['', '#0b0f1a', '#121826', '#1b1b24', '#22252e', '#f4f1ea', '#e9eef7', '#dce8e4', '#f3e6df'];

const WS_HL_COLORS = [
  { id: 'yellow', label: 'Amarelo', value: '#ffd84d' },
  { id: 'green',  label: 'Verde',   value: '#7ee787' },
  { id: 'blue',   label: 'Azul',    value: '#7cc4ff' },
  { id: 'pink',   label: 'Rosa',    value: '#ff9ecb' },
  { id: 'orange', label: 'Laranja', value: '#ffb86b' }
];

const WS_TIMER_STYLES = [
  { id: 'minimal', label: 'Minimalista' },
  { id: 'ring',    label: 'Circular' },
  { id: 'flip',    label: 'Flip' }
];

const WS_TIMER_COLORS = [
  { label: 'Tema',  value: '' },
  { label: 'Azul',  value: '#8fa2ff' },
  { label: 'Verde', value: '#5fe3c4' },
  { label: 'Âmbar', value: '#ffd166' },
  { label: 'Rosa',  value: '#ff8fa3' },
  { label: 'Lilás', value: '#c792ea' },
  { label: 'Neve',  value: '#f2f5ff' }
];

function wsNum(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function wsColor(v, fallback) {
  return /^#[0-9a-f]{3,8}$/i.test(String(v || '')) ? v : (fallback || '');
}

function wsEscape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function wsTr(key, params, fallback) {
  if (typeof t === 'function') return t(key, params, fallback);
  let str = String(fallback != null ? fallback : key);
  if (params && typeof params === 'object') {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), String(v));
    }
  }
  return str;
}

const WS_COLOR_KEY_BY_LABEL = {
  'Padrão': 'default', 'Tema': 'theme', 'Azul': 'blue', 'Menta': 'mint',
  'Âmbar': 'amber', 'Rosa': 'rose', 'Lilás': 'violet', 'Amarelo': 'yellow',
  'Verde': 'green', 'Laranja': 'orange', 'Neve': 'snow', 'Grafite': 'slate', 'Coral': 'coral'
};

function wsColorLabel(item) {
  if (!item) return '';
  const id = item.id != null ? String(item.id) : '';
  const mapById = { '': item.label === 'Tema' ? 'theme' : 'default', blue: 'blue', mint: 'mint', amber: 'amber', rose: 'rose', violet: 'violet', yellow: 'yellow', green: 'green', pink: 'pink', orange: 'orange', snow: 'snow', slate: 'slate', coral: 'coral', lilac: 'lilac' };
  const keyPart = mapById[id] || WS_COLOR_KEY_BY_LABEL[item.label] || '';
  return keyPart ? wsTr('ws.color.' + keyPart, null, item.label) : (item.label || '');
}

const WS_BG_PATTERN_OPTS = [
  { id: 'dots', key: 'ws.bg.dots', def: 'Pontos' },
  { id: 'lines', key: 'ws.bg.lines', def: 'Linhas' },
  { id: 'grid', key: 'ws.bg.grid', def: 'Grade' },
  { id: 'cross', key: 'ws.bg.cross', def: 'Cruzes' },
  { id: 'none', key: 'ws.bg.none', def: 'Liso' }
];

const WS_ARROW_CAP_OPTS = [
  { id: 'auto', key: 'ws.arrow.capAuto', def: 'Auto' },
  { id: 'circle', key: 'ws.arrow.capCircle', def: 'Círculo' },
  { id: 'square', key: 'ws.arrow.capSquare', def: 'Quadrado' },
  { id: 'diamond', key: 'ws.arrow.capDiamond', def: 'Losango' },
  { id: 'bar', key: 'ws.arrow.capBar', def: 'Barra' },
  { id: 'arrow', key: 'ws.arrow.capArrow', def: 'Seta' },
  { id: 'none', key: 'ws.arrow.capNone', def: 'Nenhuma' }
];

const WS_ARROW_ROUTING_OPTS = [
  { id: 'auto', key: 'ws.arrow.routing.auto', def: 'Auto' },
  { id: 's-curve', key: 'ws.arrow.routing.scurve', def: 'Curva S' },
  { id: 'straight', key: 'ws.arrow.routing.straight', def: 'Reta' },
  { id: 'orthogonal', key: 'ws.arrow.routing.orthogonal', def: 'Ângulo' },
  { id: 'organic', key: 'ws.arrow.routing.organic', def: 'Orgânica' }
];

const WS_ARROW_LINE_STYLE_OPTS = [
  { id: 'auto', key: 'ws.arrow.style.auto', def: 'Auto' },
  { id: 'solid', key: 'ws.arrow.style.solid', def: 'Sólida' },
  { id: 'dashed', key: 'ws.arrow.style.dashed', def: 'Tracejada' },
  { id: 'dotted', key: 'ws.arrow.style.dotted', def: 'Pontilhada' }
];

const WS_ARROW_WIDTH_OPTS = [1.5, 1.8, 2, 2.5, 3, 4];

/* ============ banco próprio do quadro ============ */
const WorkspaceDB = {
  db: null,
  opening: null,
  fallback: false,

  open() {
    if (this.db) return Promise.resolve(this.db);
    if (this.opening) return this.opening;
    this.opening = new Promise((resolve) => {
      let req;
      try { req = indexedDB.open(WS_DB_NAME, 1); }
      catch (e) { this.fallback = true; return resolve(null); }
      if (!req) { this.fallback = true; return resolve(null); }
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
        if (!db.objectStoreNames.contains('files')) db.createObjectStore('files');
      };
      req.onsuccess = () => { this.db = req.result; resolve(this.db); };
      req.onerror = () => { this.fallback = true; resolve(null); };
      setTimeout(() => { if (!this.db && !this.fallback) { this.fallback = true; resolve(null); } }, 1800);
    });
    return this.opening;
  },

  getMeta(key) {
    return this.open().then((db) => {
      if (!db) {
        try { return JSON.parse(localStorage.getItem('fluxo-ws-' + key) || 'null'); }
        catch (e) { return null; }
      }
      return new Promise((resolve) => {
        try {
          const tx = db.transaction('meta', 'readonly');
          const rq = tx.objectStore('meta').get(key);
          rq.onsuccess = () => resolve(rq.result == null ? null : rq.result);
          rq.onerror = () => resolve(null);
        } catch (e) { resolve(null); }
      });
    });
  },

  setMeta(key, value) {
    return this.open().then((db) => {
      if (!db) {
        try { localStorage.setItem('fluxo-ws-' + key, JSON.stringify(value)); } catch (e) { /* ignora */ }
        return;
      }
      return new Promise((resolve, reject) => {
        try {
          const tx = db.transaction('meta', 'readwrite');
          tx.objectStore('meta').put(value, key);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error || new Error('idb'));
        } catch (e) { reject(e); }
      });
    });
  },

  getFile(key) {
    return this.open().then((db) => {
      if (!db) return null;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction('files', 'readonly');
          const rq = tx.objectStore('files').get(key);
          rq.onsuccess = () => resolve(rq.result == null ? null : rq.result);
          rq.onerror = () => resolve(null);
        } catch (e) { resolve(null); }
      });
    });
  },

  putFile(key, value) {
    return this.open().then((db) => {
      if (!db) throw new Error('sem banco');
      return new Promise((resolve, reject) => {
        try {
          const tx = db.transaction('files', 'readwrite');
          tx.objectStore('files').put(value, key);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error || new Error('idb'));
        } catch (e) { reject(e); }
      });
    });
  },

  delFile(key) {
    return this.open().then((db) => {
      if (!db) return;
      try {
        const tx = db.transaction('files', 'readwrite');
        tx.objectStore('files').delete(key);
      } catch (e) { /* ignora */ }
    });
  },

  delMeta(key) {
    try { localStorage.removeItem('fluxo-ws-' + key); } catch (e) { /* ignora */ }
    return this.open().then((db) => {
      if (!db) return;
      try {
        const tx = db.transaction('meta', 'readwrite');
        tx.objectStore('meta').delete(key);
      } catch (e) { /* ignora */ }
    });
  },

  clearAll() {
    return this.open().then((db) => {
      if (db) {
        try {
          const tx = db.transaction(['meta', 'files'], 'readwrite');
          tx.objectStore('meta').clear();
          tx.objectStore('files').clear();
        } catch (e) { /* ignora */ }
        try { db.close(); } catch (e) { /* ignora */ }
      }
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && k.startsWith('fluxo-ws-')) localStorage.removeItem(k);
        }
      } catch (e) { /* ignora */ }
      this.db = null;
      this.opening = null;
    });
  }
};

/* ============ estado e utilidades do quadro ============ */
const Workspace = {
  inited: false,
  initPromise: null,
  loaded: false,
  entered: false,
  board: null,
  bgUrl: null,

  els: {},
  cardEls: new Map(),
  arrowEls: new Map(),
  pdfDocs: new Map(),
  pdfPromises: new Map(),
  pdfTasks: new Map(),
  pdfTokens: new Map(),
  pdfRendered: new Map(),
  pdfPageDims: new Map(),
  pdfTextCache: new Map(),
  pdfSearch: new Map(),
  imgUrls: new Map(),

  selCard: null,
  selectedIds: new Set(),
  selectedStrokes: new Set(),
  selArrow: null,
  arrowAdvOpen: false,
  arrowPairIndex: new Map(),
  cardArrowIndex: new Map(),
  linkFrom: null,
  popover: null,
  confirmOpen: null,
  selection: null,
  searchQuery: '',
  searchScope: 'all',
  searchIdx: 0,
  searchHits: [],
  connCardId: null,

  selectMode: false,
  selectSpacePan: false,
  marquee: null,
  panning: null,
  cardDrag: null,
  strokeDrag: null,
  cardResize: null,
  timerDrag: null,
  pdfPress: null,
  pdfPan: null,
  imgPan: null,
  selDrag: null,
  dragGhost: null,
  suppressContextMenu: false,

  drawMode: false,
  inkTool: 'pen',
  inkColor: '#edf1ff',
  inkSize: 4.5,
  inkCursorShape: 'auto',
  inkBarDrag: null,
  inkSettingsOpen: false,
  inkStroke: null,
  inkEraser: null,
  hoveredGripEl: null,
  inkUndo: [],
  inkRedo: [],
  inkSpacePan: false,
  inkHandLock: false,
  inkRaf: null,
  timerSpring: null,
  timerSettleTimer: null,

  wsIndex: null,
  activeWsId: typeof WS_DEFAULT_ID !== 'undefined' ? WS_DEFAULT_ID : 'ws_default',
  editingWsId: null,
  wheelState: { lastPanAt: 0 },
  touchPtrs: new Map(),
  touchPinch: null,

  saveTimer: null,
  timerIv: null,
  pdfRefreshTimer: null,
  pdfLibPromise: null,
  lastTimerText: '',
  timerChars: [],
  fontsHooked: false,
  needsCenterView: false,

  /* -------- modelo -------- */
  defaultBoard() {
    return {
      v: 1,
      bg: { color: '', image: false, pattern: 'dots' },
      cursor: WS_CURSOR_DEFAULT,
      view: { x: 0, y: 0, scale: 1 },
      cards: [],
      arrows: [],
      linkDefaults: typeof wsDefaultLinkSettings === 'function' ? wsDefaultLinkSettings() : {
        routing: 's-curve',
        types: {
          relates: { cap: 'circle', lineStyle: 'solid', width: 1.8, color: '' },
          contrast: { cap: 'square', lineStyle: 'solid', width: 1.8, color: '' },
          supports: { cap: 'diamond', lineStyle: 'solid', width: 1.8, color: '' },
          sequence: { cap: 'arrow', lineStyle: 'solid', width: 1.8, color: '' }
        }
      },
      pdfs: [],
      images: [],
      strokes: [],
      ink: typeof defaultInkConfig === 'function' ? defaultInkConfig() : {
        tool: 'pen', color: '#edf1ff', size: 4.5, nib: 'round',
        smoothing: 35, pressureVar: 65, cursorShape: 'auto',
        orientation: 'horizontal', position: 'top', freeX: null, freeY: null, collapsed: false
      },
      timer: {
        x: null, y: null, min: false, visible: true,
        style: 'ring', color: '', font: 'inter', size: 34, opacity: 100
      }
    };
  },

  normalize(raw) {
    const def = this.defaultBoard();
    const b = Object.assign({}, def);
    if (!raw || typeof raw !== 'object') return b;

    b.bg = Object.assign({}, def.bg, raw.bg || {});
    b.bg.color = wsColor(b.bg.color, '');
    b.bg.image = !!b.bg.image;
    b.bg.pattern = typeof wsNormalizeBgPattern === 'function' ? wsNormalizeBgPattern(b.bg.pattern) : 'dots';
    b.cursor = wsNormCursor(raw.cursor);
    b.linkDefaults = typeof wsNormalizeLinkDefaults === 'function' ? wsNormalizeLinkDefaults(raw.linkDefaults) : def.linkDefaults;

    const view = raw.view || {};
    b.view = {
      x: wsNum(view.x, def.view.x),
      y: wsNum(view.y, def.view.y),
      scale: clamp(wsNum(view.scale, 1), 0.2, 4.0)
    };

    b.timer = Object.assign({}, def.timer, raw.timer || {});
    b.timer.style = WS_TIMER_STYLES.some(s => s.id === b.timer.style) ? b.timer.style : 'ring';
    b.timer.color = wsColor(b.timer.color, '');
    b.timer.font = (typeof FONTS !== 'undefined' && FONTS.some(f => f.id === b.timer.font)) ? b.timer.font : 'inter';
    b.timer.size = clamp(wsNum(b.timer.size, 34), 20, 72);
    b.timer.opacity = clamp(wsNum(b.timer.opacity, 100), 20, 100);
    b.timer.x = b.timer.x == null ? null : wsNum(b.timer.x, null);
    b.timer.y = b.timer.y == null ? null : wsNum(b.timer.y, null);
    b.timer.visible = b.timer.visible !== false;
    b.timer.min = !!b.timer.min;

    b.pdfs = (Array.isArray(raw.pdfs) ? raw.pdfs : [])
      .filter(p => p && p.id)
      .map(p => ({
        id: String(p.id),
        name: String(p.name || 'PDF'),
        size: wsNum(p.size, 0),
        pages: Math.max(0, wsNum(p.pages, 0)),
        highlights: (Array.isArray(p.highlights) ? p.highlights : [])
          .filter(h => h && h.page)
          .map(h => ({
            id: String(h.id || uid()),
            page: Math.max(1, wsNum(h.page, 1)),
            color: wsColor(h.color, WS_HL_COLORS[0].value),
            text: String(h.text || ''),
            rects: (Array.isArray(h.rects) ? h.rects : []).filter(r => r)
              .map(r => ({
                x: clamp(wsNum(r.x, 0), 0, 1),
                y: clamp(wsNum(r.y, 0), 0, 1),
                w: clamp(wsNum(r.w, 0), 0, 1),
                h: clamp(wsNum(r.h, 0), 0, 1)
              }))
          }))
      }));

    b.images = (Array.isArray(raw.images) ? raw.images : [])
      .filter(im => im && im.id)
      .map(im => ({
        id: String(im.id),
        name: String(im.name || 'Imagem'),
        size: wsNum(im.size, 0),
        natW: Math.max(1, wsNum(im.natW, 400)),
        natH: Math.max(1, wsNum(im.natH, 300))
      }));

    const pdfIds = new Set(b.pdfs.map(p => p.id));
    const imgIds = new Set(b.images.map(im => im.id));
    const validTypes = typeof WS_CARD_TYPES !== 'undefined' ? WS_CARD_TYPES : ['note', 'concept', 'checklist', 'group', 'pdf', 'image'];
    b.cards = (Array.isArray(raw.cards) ? raw.cards : [])
      .filter(c => c && c.id && validTypes.includes(c.type))
      .filter(c => (c.type !== 'pdf' || pdfIds.has(String(c.pdfId))) && (c.type !== 'image' || imgIds.has(String(c.imgId))))
      .map(c => {
        const type = c.type;
        const defW = type === 'pdf' ? 540 : (type === 'image' ? 380 : (type === 'group' ? 440 : (type === 'concept' ? 310 : (type === 'checklist' ? 300 : 280))));
        const defH = type === 'pdf' ? 700 : (type === 'image' ? 300 : (type === 'group' ? 320 : (type === 'concept' ? 230 : (type === 'checklist' ? 250 : 170))));
        const card = {
          id: String(c.id),
          type,
          x: wsNum(c.x, 0),
          y: wsNum(c.y, 0),
          w: clamp(wsNum(c.w, defW), 190, 2400),
          h: clamp(wsNum(c.h, defH), 96, 2400)
        };
        if (card.type === 'pdf') {
          card.pdfId = String(c.pdfId);
          card.page = Math.max(1, wsNum(c.page, 1));
          card.zoom = clamp(wsNum(c.zoom, 1), 0.5, 3.5);
          card.editMode = !!c.editMode;
          card.pdfMode = ['read', 'pan', 'highlight', 'note'].includes(c.pdfMode) ? c.pdfMode : 'read';
          card.hlColor = wsColor(c.hlColor, WS_HL_COLORS[0].value);
          const rot = Number(c.rotation);
          card.rotation = (rot === 90 || rot === 180 || rot === 270) ? rot : 0;
        } else if (card.type === 'image') {
          card.imgId = String(c.imgId);
          card.zoom = clamp(wsNum(c.zoom, 1), 0.5, 4.0);
        } else if (card.type === 'concept') {
          card.title = typeof c.title === 'string' ? c.title.slice(0, 120) : '';
          card.tags = typeof wsNormalizeTags === 'function' ? wsNormalizeTags(c.tags) : [];
          card.text = typeof c.text === 'string' ? c.text : '';
          card.accent = typeof wsValidTint === 'function' ? wsValidTint(c.accent) : '';
        } else if (card.type === 'checklist') {
          card.title = typeof c.title === 'string' ? c.title.slice(0, 120) : '';
          card.items = typeof wsNormalizeChecklistItems === 'function' ? wsNormalizeChecklistItems(c.items, () => uid()) : [];
          card.accent = typeof wsValidTint === 'function' ? wsValidTint(c.accent) : '';
        } else if (card.type === 'group') {
          card.title = typeof c.title === 'string' ? c.title.slice(0, 120) : '';
          card.accent = typeof wsValidTint === 'function' ? wsValidTint(c.accent || 'blue') : '';
        } else {
          const rawHtml = typeof c.html === 'string' && typeof wsSanitizeNoteHtml === 'function'
            ? wsSanitizeNoteHtml(c.html)
            : '';
          let textVal = typeof c.text === 'string' ? c.text : '';
          if (!textVal && rawHtml && typeof wsNoteHtmlToPlainText === 'function') {
            textVal = wsNoteHtmlToPlainText(rawHtml);
          }
          card.text = textVal;
          card.html = rawHtml || (textVal && typeof wsPlainTextToNoteHtml === 'function' ? wsPlainTextToNoteHtml(textVal) : '');
          card.accent = typeof wsValidTint === 'function' ? wsValidTint(c.accent) : '';
          card.font = typeof wsNormalizeNoteFont === 'function' ? wsNormalizeNoteFont(c.font) : 'inter';
          card.fontSize = typeof wsNormalizeNoteSize === 'function' ? wsNormalizeNoteSize(c.fontSize) : 14;
          card.align = typeof wsNormalizeNoteAlign === 'function' ? wsNormalizeNoteAlign(c.align) : 'left';
          card.editMode = !!c.editMode;
          card.source = c.source && c.source.pdfId ? {
            pdfId: String(c.source.pdfId),
            page: Math.max(1, wsNum(c.source.page, 1))
          } : null;
        }
        return card;
      });

    const cardIds = new Set(b.cards.map(c => c.id));
    const seen = new Set();
    b.arrows = (Array.isArray(raw.arrows) ? raw.arrows : [])
      .filter(a => a && a.from && a.to && a.from !== a.to)
      .filter(a => cardIds.has(String(a.from)) && cardIds.has(String(a.to)))
      .filter(a => {
        const k = a.from + '>' + a.to;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .map(a => (typeof wsNormalizeArrow === 'function'
        ? wsNormalizeArrow(a, () => uid())
        : { id: String(a.id || uid()), from: String(a.from), to: String(a.to), kind: 'relates', dir: 'forward', label: '', color: '' }))
      .filter(Boolean);

    b.strokes = typeof normalizeInkStrokes === 'function' ? normalizeInkStrokes(raw.strokes) : [];
    b.ink = typeof normalizeInkConfig === 'function' ? normalizeInkConfig(raw.ink) : def.ink;

    return b;
  },

  bgKey(wsId) {
    const id = wsId || this.activeWsId;
    return typeof wsBgFileKey === 'function' ? wsBgFileKey(id) : ('bg_' + id);
  },

  currentWsEntry() {
    const defName = wsTr('ws.defaultBoard', null, 'Quadro principal');
    if (!this.wsIndex || !Array.isArray(this.wsIndex.items)) return { id: this.activeWsId, name: defName };
    return this.wsIndex.items.find(it => it.id === this.activeWsId) || this.wsIndex.items[0] || { id: this.activeWsId, name: defName };
  },

  async loadBgFor(wsId) {
    let url = null;
    try { url = await WorkspaceDB.getFile(this.bgKey(wsId)); } catch (e) { url = null; }
    if (!url && wsId === (typeof WS_DEFAULT_ID !== 'undefined' ? WS_DEFAULT_ID : 'ws_default')) {
      try {
        const legacyBg = await WorkspaceDB.getFile('bg');
        if (legacyBg) {
          url = legacyBg;
          WorkspaceDB.putFile(this.bgKey(wsId), legacyBg).catch(() => {});
        }
      } catch (e) { /* ignora */ }
    }
    return url;
  },

  async loadBoardFor(wsId) {
    const key = typeof wsBoardMetaKey === 'function' ? wsBoardMetaKey(wsId) : ('board_' + wsId);
    let raw = null;
    try { raw = await WorkspaceDB.getMeta(key); } catch (e) { raw = null; }
    if (!raw && wsId === (typeof WS_DEFAULT_ID !== 'undefined' ? WS_DEFAULT_ID : 'ws_default')) {
      try {
        raw = await WorkspaceDB.getMeta(WS_BOARD_KEY);
        if (raw) await WorkspaceDB.setMeta(key, raw);
      } catch (e) { raw = null; }
    }
    return raw;
  },

  async load() {
    const idxKey = typeof WS_INDEX_KEY !== 'undefined' ? WS_INDEX_KEY : 'ws_index';
    let rawIdx = null;
    try { rawIdx = await WorkspaceDB.getMeta(idxKey); } catch (e) { rawIdx = null; }
    this.wsIndex = typeof wsNormalizeIndex === 'function' ? wsNormalizeIndex(rawIdx) : {
      activeId: 'ws_default',
      items: [{ id: 'ws_default', name: 'Quadro principal', updatedAt: Date.now() }]
    };
    if (!rawIdx) {
      WorkspaceDB.setMeta(idxKey, this.wsIndex).catch(() => {});
    }
    this.activeWsId = this.wsIndex.activeId;

    const raw = await this.loadBoardFor(this.activeWsId);
    this.board = this.normalize(raw);
    this.bgUrl = await this.loadBgFor(this.activeWsId);
    if (!raw || !raw.view) {
      const r = this.els.viewport.getBoundingClientRect();
      if (r.width > 40 && r.height > 40) {
        this.board.view = { x: r.width / 2, y: r.height / 2, scale: 1 };
      } else {
        this.needsCenterView = true;
      }
    }
    this.loaded = true;
  },

  scheduleSave() {
    if (!this.loaded) return;
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.flushSave(), 240);
  },

  flushSave() {
    clearTimeout(this.saveTimer);
    this.saveTimer = null;
    if (!this.loaded || !this.board) return Promise.resolve();
    const key = typeof wsBoardMetaKey === 'function' ? wsBoardMetaKey(this.activeWsId) : ('board_' + this.activeWsId);
    if (this.wsIndex && Array.isArray(this.wsIndex.items)) {
      const entry = this.wsIndex.items.find(it => it.id === this.activeWsId);
      if (entry) entry.updatedAt = Date.now();
      const idxKey = typeof WS_INDEX_KEY !== 'undefined' ? WS_INDEX_KEY : 'ws_index';
      WorkspaceDB.setMeta(idxKey, this.wsIndex).catch(() => {});
    }
    return WorkspaceDB.setMeta(key, this.board).catch(() => {
      toast(wsTr('ws.saveErr', null, 'Não foi possível salvar o quadro'), 'close');
    });
  },

  /* -------- inicialização -------- */
  async init() {
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      this.cacheEls();
      this.buildEmpty();
      this.buildTopbar();
      this.buildInkBar();
      this.buildZoom();
      this.buildTimer();
      this.bindEvents();
      await WorkspaceDB.open().catch(() => null);
      await this.load();
      this.updateTopbar();
      this.renderAll();
      this.resizeInkCanvas();
      this.applyView();
      this.applyBg();
      this.applyCursor();
      this.applyInkCursor();
      this.renderTimer();
      this.updateEmpty();
      this.updateHint();
      this.inited = true;
    })();
    return this.initPromise;
  },

  cacheEls() {
    this.els = {
      shell: $('#ws-shell'),
      viewport: $('#ws-viewport'),
      world: $('#ws-world'),
      inkCanvas: $('#ws-ink-canvas'),
      inkBar: $('#ws-ink-bar'),
      inkSettings: $('#ws-ink-settings'),
      snapLayer: $('#ws-snap-layer'),
      snapGrid: $('#ws-snap-grid'),
      snapMold: $('#ws-snap-mold'),
      snapGx: $('#ws-snap-gx'),
      snapGy: $('#ws-snap-gy'),
      arrows: $('#ws-arrows'),
      arrowLayer: $('#ws-arrow-layer'),
      empty: $('#ws-empty'),
      topbar: $('#ws-topbar'),
      zoom: $('#ws-zoom'),
      hint: $('#ws-hint'),
      popovers: $('#ws-popovers'),
      timerRoot: $('#ws-timer-root'),
      selTools: $('#ws-sel-tools'),
      arrowTools: $('#ws-arrow-tools'),
      multiTools: $('#ws-multi-tools'),
      marquee: $('#ws-marquee'),
      drop: $('#ws-drop'),
      fileBg: $('#ws-file-bg'),
      filePdf: $('#ws-file-pdf'),
      fileImg: $('#ws-file-img'),
      fileImport: $('#ws-file-import')
    };
  },

  async enter() {
    await this.init();
    if (this.entered) return;
    if (typeof Router !== 'undefined' && Router.route !== 'workspace') return;
    this.entered = true;
    if (this.needsCenterView) {
      const r = this.els.viewport.getBoundingClientRect();
      this.board.view = { x: r.width / 2, y: r.height / 2, scale: 1 };
      this.needsCenterView = false;
      this.scheduleSave();
    }
    this.resizeInkCanvas();
    this.applyView();
    this.applyBg();
    this.applyCursor();
    this.applyInkCursor();
    this.applyTimerPosition();
    this.renderTimer();
    this.updateEmpty();
    this.syncDockClearance();
    this.startTimerLoop();
    setTimeout(() => this.refreshPdfs(), 50);
  },

  leave() {
    if (!this.entered) return;
    this.entered = false;
    this.stopTimerLoop();
    this.setDrawMode(false);
    this.setSelectMode(false);
    this.finishMarquee(false);
    this.hideSnapOverlay();
    this.closePopover();
    this.closeTimerSettings();
    this.hideSelectionTools();
    this.select(null);
    this.selectArrow(null);
    this.cancelLink();
    this.flushSave();
  },

  /* -------- interface fixa -------- */
  buildEmpty() {
    const box = this.els.empty;
    box.innerHTML =
      '<div class="ws-empty-icon">' + svgIcon('board') + '</div>' +
      '<p>' + wsEscape(wsTr('ws.emptyTitle2', null, 'Seu quadro está em branco')) + '</p>' +
      '<small>' + wsEscape(wsTr('ws.emptySub2', null, 'Crie notas, conceitos com #tags, checklists, grupos, solte PDFs, cole prints (Ctrl+V) e ligue ideias.')) + '</small>' +
      '<div class="ws-empty-actions">' +
        '<button class="ws-empty-btn primary" data-empty="card">' + svgIcon('plus') + '<span>' + wsEscape(wsTr('ws.emptyNote', null, 'Nova nota')) + '</span></button>' +
        '<button class="ws-empty-btn" data-empty="concept">' + svgIcon('hash') + '<span>' + wsEscape(wsTr('ws.addConcept', null, 'Conceito')) + '</span></button>' +
        '<button class="ws-empty-btn" data-empty="checklist">' + svgIcon('checklist') + '<span>' + wsEscape(wsTr('ws.addChecklist', null, 'Checklist')) + '</span></button>' +
        '<button class="ws-empty-btn" data-empty="draw">' + svgIcon('pen') + '<span>' + wsEscape(wsTr('ws.emptyDraw', null, 'Escrever')) + '</span></button>' +
        '<button class="ws-empty-btn" data-empty="pdf">' + svgIcon('file') + '<span>' + wsEscape(wsTr('ws.addPdf', null, 'PDF')) + '</span></button>' +
        '<button class="ws-empty-btn" data-empty="img">' + svgIcon('image') + '<span>' + wsEscape(wsTr('ws.addImage', null, 'Imagem')) + '</span></button>' +
      '</div>';
    if (!box._wsBound) {
      box._wsBound = true;
      box.addEventListener('click', (e) => {
        const b = e.target.closest('[data-empty]');
        if (!b) return;
        const act = b.dataset.empty;
        if (act === 'card') this.addNote();
        else if (act === 'concept') this.addConcept();
        else if (act === 'checklist') this.addChecklist();
        else if (act === 'draw') this.setDrawMode(true);
        else if (act === 'pdf') this.els.filePdf.click();
        else if (act === 'img') this.els.fileImg.click();
        else this.openBgPopover();
      });
    }
  },

  buildTopbar() {
    const bar = this.els.topbar;
    bar.innerHTML =
      '<button type="button" class="ws-brand" data-act="boards" title="' + wsEscape(wsTr('ws.brandTitle', null, 'Trocar de área de trabalho, criar nova ou salvar/abrir arquivo (.fluxo)')) + '" aria-label="' + wsEscape(wsTr('ws.brandAria', null, 'Áreas de trabalho')) + '">' +
        '<span class="ws-brand-icon">' + svgIcon('board') + '</span>' +
        '<div class="ws-brand-text"><b id="ws-brand-name">' + wsEscape(wsTr('ws.defaultBoard', null, 'Quadro principal')) + '</b><small id="ws-brand-meta">' + wsEscape(wsTr('ws.brandMeta', { cur: 1, max: 5 }, 'Áreas · 1/5')) + '</small></div>' +
        '<span class="ws-brand-chev">' + svgIcon('chevD') + '</span>' +
      '</button>' +
      '<div class="ws-actions" role="toolbar" aria-label="' + wsEscape(wsTr('ws.toolbarAria', null, 'Ferramentas do quadro')) + '">' +
        '<button class="ws-tool wide" data-act="select" title="' + wsEscape(wsTr('ws.selectTitle', null, 'Quadrado de seleção (arraste ou Shift+arraste · V)')) + '">' + svgIcon('cursor') + '<span>' + wsEscape(wsTr('ws.select', null, 'Selecionar')) + '</span></button>' +
        '<button class="ws-tool wide" data-act="add" title="' + wsEscape(wsTr('ws.newTitle', null, 'Adicionar nota, conceito, checklist ou grupo')) + '">' + svgIcon('plus') + '<span>' + wsEscape(wsTr('ws.newBtn', null, 'Novo')) + '</span></button>' +
        '<button class="ws-tool wide" data-act="draw" title="' + wsEscape(wsTr('ws.drawTitle', null, 'Escrever ou desenhar livremente (D)')) + '">' + svgIcon('pen') + '<span>' + wsEscape(wsTr('ws.emptyDraw', null, 'Escrever')) + '</span></button>' +
        '<button class="ws-tool wide" data-act="pdf" title="' + wsEscape(wsTr('ws.pdfTitle', null, 'Adicionar PDF')) + '">' + svgIcon('file') + '<span>' + wsEscape(wsTr('ws.addPdf', null, 'PDF')) + '</span></button>' +
        '<button class="ws-tool wide" data-act="img" title="' + wsEscape(wsTr('ws.imgTitle', null, 'Adicionar imagem ou print (ou Ctrl+V)')) + '">' + svgIcon('image') + '<span>' + wsEscape(wsTr('ws.addImage', null, 'Imagem')) + '</span></button>' +
        '<button class="ws-tool wide" data-act="link" title="' + wsEscape(wsTr('ws.linkTitle', null, 'Ligar dois cartões')) + '">' + svgIcon('arrow') + '<span>' + wsEscape(wsTr('ws.link', null, 'Ligar')) + '</span></button>' +
        '<span class="ws-tool-sep"></span>' +
        '<button class="ws-tool wide" data-act="search" title="' + wsEscape(wsTr('ws.searchTitle', null, 'Buscar no quadro e nos PDFs (Ctrl+F)')) + '">' + svgIcon('search') + '<span>' + wsEscape(wsTr('ws.searchBtn', null, 'Buscar')) + '</span></button>' +
        '<button class="ws-tool" data-act="linkdefs" title="' + wsEscape(wsTr('ws.linkDefsTitle', null, 'Padrões das ligações')) + '" aria-label="' + wsEscape(wsTr('ws.linkDefsTitle', null, 'Padrões das ligações')) + '">' + svgIcon('sliders') + '</button>' +
        '<button class="ws-tool" data-act="bg" title="' + wsEscape(wsTr('ws.bgTitle', null, 'Fundo do quadro')) + '">' + svgIcon('palette') + '</button>' +
        '<button class="ws-tool" data-act="timer" title="' + wsEscape(wsTr('ws.timerTitle', null, 'Mostrar ou ocultar o cronômetro')) + '">' + svgIcon('timer') + '</button>' +
        '<button class="ws-tool" data-act="fit" title="' + wsEscape(wsTr('ws.fitTitle', null, 'Ajustar o quadro à tela')) + '">' + svgIcon('fit') + '</button>' +
        '<span class="ws-tool-sep"></span>' +
        '<button class="ws-tool" data-act="export" title="' + wsEscape(wsTr('ws.exportTitle', null, 'Salvar área de trabalho como arquivo (.fluxo)')) + '" aria-label="' + wsEscape(wsTr('ws.boards.saveFile', null, 'Salvar arquivo')) + '">' + svgIcon('download') + '</button>' +
        '<button class="ws-tool" data-act="import" title="' + wsEscape(wsTr('ws.importTitle', null, 'Abrir arquivo de área de trabalho (.fluxo)')) + '" aria-label="' + wsEscape(wsTr('ws.boards.openFile', null, 'Abrir arquivo')) + '">' + svgIcon('folder') + '</button>' +
      '</div>';
    if (!bar._wsBound) {
      bar._wsBound = true;
      bar.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act]');
        if (!b) return;
        if (typeof b.blur === 'function') b.blur();
        const act = b.dataset.act;
        if (act === 'boards') this.openBoardsPopover();
        else if (act === 'select') this.setSelectMode(!this.selectMode);
        else if (act === 'add') this.openAddPopover();
        else if (act === 'card') this.addNote();
        else if (act === 'draw') this.setDrawMode(!this.drawMode);
        else if (act === 'pdf') this.els.filePdf.click();
        else if (act === 'img') this.els.fileImg.click();
        else if (act === 'link') this.beginLink();
        else if (act === 'search') this.openSearchPopover();
        else if (act === 'linkdefs') this.openLinkDefaultsPopover();
        else if (act === 'bg') this.openBgPopover();
        else if (act === 'timer') this.toggleTimerVisible();
        else if (act === 'fit') this.fitView();
        else if (act === 'export') this.exportWorkspaceFile();
        else if (act === 'import') this.els.fileImport && this.els.fileImport.click();
      });
    }
    this.updateTopbar();
  },

  updateTopbar() {
    const selBtn = this.els.topbar.querySelector('[data-act="select"]');
    if (selBtn) {
      selBtn.classList.toggle('active', !!this.selectMode);
      selBtn.setAttribute('aria-pressed', this.selectMode ? 'true' : 'false');
    }
    const draw = this.els.topbar.querySelector('[data-act="draw"]');
    if (draw) {
      draw.classList.toggle('active', !!this.drawMode);
      draw.setAttribute('aria-pressed', this.drawMode ? 'true' : 'false');
    }
    const add = this.els.topbar.querySelector('[data-act="add"]');
    if (add) add.classList.toggle('active', this.popover === 'add');
    const search = this.els.topbar.querySelector('[data-act="search"]');
    if (search) search.classList.toggle('active', this.popover === 'search');
    const linkdefs = this.els.topbar.querySelector('[data-act="linkdefs"]');
    if (linkdefs) linkdefs.classList.toggle('active', this.popover === 'linkdefs');
    const bgBtn = this.els.topbar.querySelector('[data-act="bg"]');
    if (bgBtn) bgBtn.classList.toggle('active', this.popover === 'bg');
    const link = this.els.topbar.querySelector('[data-act="link"]');
    if (link) link.classList.toggle('active', !!this.linkFrom);
    const timer = this.els.topbar.querySelector('[data-act="timer"]');
    if (timer && this.board) timer.classList.toggle('active', !!this.board.timer.visible);
    const brand = this.els.topbar.querySelector('.ws-brand');
    if (brand) brand.classList.toggle('active', this.popover === 'boards');
    const nameEl = this.els.topbar.querySelector('#ws-brand-name');
    const metaEl = this.els.topbar.querySelector('#ws-brand-meta');
    if (nameEl) nameEl.textContent = this.currentWsEntry().name || wsTr('ws.defaultBoard', null, 'Quadro principal');
    if (metaEl) {
      const total = (this.wsIndex && this.wsIndex.items ? this.wsIndex.items.length : 1);
      const max = typeof WS_MAX_WORKSPACES !== 'undefined' ? WS_MAX_WORKSPACES : 5;
      metaEl.textContent = wsTr('ws.brandMeta', { cur: total, max }, 'Áreas · ' + total + '/' + max);
    }
  },

  updateHint() {
    if (!this.els.hint) return;
    if (this.drawMode) {
      this.els.hint.textContent = wsTr('ws.hintDraw', null, 'escreva livremente · segure Espaço ou Alt para arrastar · dois dedos movem · Ctrl+Z desfaz · Esc sai');
    } else if (this.selectMode) {
      this.els.hint.textContent = wsTr('ws.hintSelect', null, 'arraste para fazer o quadrado de seleção · Shift adiciona · segure Espaço para mover · Ctrl+A seleciona tudo · Esc sai');
    } else {
      this.els.hint.textContent = wsTr('ws.hintDefault', null, 'arraste o fundo para mover · Shift+arraste ou Selecionar (V) faz seleção · Shift ao mover/redimensionar alinha ao grid · Ctrl+A seleciona tudo');
    }
    this.syncDockClearance();
  },

  syncDockClearance() {
    const shell = this.els && this.els.shell;
    if (!shell) return;
    const anchor = (typeof Store !== 'undefined' && Store.state && Store.state.dock && Store.state.dock.anchor) || 'bc';
    shell.dataset.dock = anchor;
    const hasBottomTools = !!(
      (this.els.arrowTools && !this.els.arrowTools.hidden) ||
      (this.els.multiTools && !this.els.multiTools.hidden)
    );
    shell.classList.toggle('has-bottom-tools', hasBottomTools);
    const dockEl = document.getElementById('dock');
    const sr = shell.getBoundingClientRect ? shell.getBoundingClientRect() : null;
    if (dockEl && sr && sr.height > 0 && typeof dockEl.getBoundingClientRect === 'function') {
      const dr = dockEl.getBoundingClientRect();
      if (dr.height > 0 && (anchor === 'bc' || anchor === 'bl' || anchor === 'br')) {
        const dockFoot = Math.max(76, Math.round(sr.bottom - dr.top));
        const barBottom = Math.max(98, dockFoot + 22);
        const dockBottom = Math.max(96, dockFoot + 20);
        shell.style.setProperty('--ws-bar-bottom', barBottom + 'px');
        shell.style.setProperty('--ws-dock-bottom', dockBottom + 'px');
        return;
      }
    }
    shell.style.setProperty('--ws-bar-bottom', anchor === 'bc' ? '98px' : '22px');
    shell.style.setProperty('--ws-dock-bottom', '98px');
  },

  buildZoom() {
    const z = this.els.zoom;
    z.innerHTML =
      '<button class="ws-zoom-btn" data-z="in" title="' + wsEscape(wsTr('ws.zoomIn', null, 'Aproximar')) + '">+</button>' +
      '<div class="ws-zoom-level">100%</div>' +
      '<button class="ws-zoom-btn" data-z="out" title="' + wsEscape(wsTr('ws.zoomOut', null, 'Afastar')) + '">−</button>' +
      '<button class="ws-zoom-btn" data-z="fit" title="' + wsEscape(wsTr('ws.zoomFit', null, 'Ajustar à tela')) + '">' + svgIcon('fit') + '</button>';
    if (!z._wsBound) {
      z._wsBound = true;
      z.addEventListener('click', (e) => {
        const b = e.target.closest('[data-z]');
        if (!b) return;
        if (b.dataset.z === 'in') this.zoomAt(null, null, 1.2);
        else if (b.dataset.z === 'out') this.zoomAt(null, null, 1 / 1.2);
        else this.fitView();
      });
    }
  },

  /* -------- visão: pan, zoom, ajuste -------- */
  applyView() {
    const v = this.board.view;
    this.els.world.style.transform = 'translate(' + v.x.toFixed(2) + 'px,' + v.y.toFixed(2) + 'px) scale(' + v.scale.toFixed(3) + ')';
    const lvl = this.els.zoom.querySelector('.ws-zoom-level');
    if (lvl) lvl.textContent = Math.round(v.scale * 100) + '%';
    this.els.world.style.setProperty('--ws-scale', v.scale);
    this.scheduleInkRender();
  },

  screenToWorld(clientX, clientY) {
    const r = this.els.viewport.getBoundingClientRect();
    const v = this.board.view;
    return { x: (clientX - r.left - v.x) / v.scale, y: (clientY - r.top - v.y) / v.scale };
  },

  centerWorld() {
    const r = this.els.viewport.getBoundingClientRect();
    return this.screenToWorld(r.left + r.width / 2, r.top + r.height / 2);
  },

  zoomAt(clientX, clientY, factor) {
    const v = this.board.view;
    const r = this.els.viewport.getBoundingClientRect();
    const px = clientX == null ? r.width / 2 : clientX - r.left;
    const py = clientY == null ? r.height / 2 : clientY - r.top;
    const ns = clamp(v.scale * factor, 0.2, 4.0);
    if (ns === v.scale) return;
    v.x = px - (px - v.x) * (ns / v.scale);
    v.y = py - (py - v.y) * (ns / v.scale);
    v.scale = ns;
    this.applyView();
    this.scheduleSave();
    this.schedulePdfRefresh();
  },

  fitView() {
    const cards = this.board.cards;
    const sb = typeof inkStrokeBounds === 'function' ? inkStrokeBounds(this.board.strokes) : null;
    const r = this.els.viewport.getBoundingClientRect();
    if (!cards.length && !sb) {
      this.board.view = { x: r.width / 2, y: r.height / 2, scale: 1 };
      this.applyView();
      this.scheduleSave();
      return;
    }
    let minX = sb ? sb.minX : Infinity;
    let minY = sb ? sb.minY : Infinity;
    let maxX = sb ? sb.maxX : -Infinity;
    let maxY = sb ? sb.maxY : -Infinity;
    cards.forEach(c => {
      minX = Math.min(minX, c.x);
      minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x + c.w);
      maxY = Math.max(maxY, c.y + c.h);
    });
    const pad = 74;
    const bw = Math.max(1, maxX - minX);
    const bh = Math.max(1, maxY - minY);
    const scale = clamp(Math.min((r.width - pad * 2) / bw, (r.height - pad * 2 - 30) / bh), 0.2, 1.6);
    this.board.view = {
      scale,
      x: r.width / 2 - (minX + bw / 2) * scale,
      y: r.height / 2 - (minY + bh / 2) * scale
    };
    this.applyView();
    this.scheduleSave();
    this.schedulePdfRefresh();
  },

  updateEmpty() {
    if (!this.els.empty || !this.board) return;
    const hasStrokes = !!(this.board.strokes && this.board.strokes.length);
    this.els.empty.hidden = this.board.cards.length > 0 || hasStrokes || this.drawMode;
  },

  /* -------- fundo e cursor -------- */
  applyBg() {
    const vp = this.els.viewport;
    const bg = this.board.bg;
    const pattern = typeof wsNormalizeBgPattern === 'function' ? wsNormalizeBgPattern(bg.pattern) : (bg.pattern || 'dots');
    vp.dataset.bgPattern = pattern;
    if (bg.color) this.els.shell.style.setProperty('--ws-canvas-bg', bg.color);
    else this.els.shell.style.removeProperty('--ws-canvas-bg');
    if (bg.image && this.bgUrl) {
      vp.style.backgroundImage = 'url("' + this.bgUrl + '")';
      vp.style.backgroundSize = 'cover';
      vp.style.backgroundPosition = 'center';
      vp.style.backgroundColor = bg.color || 'var(--bg)';
    } else {
      vp.style.backgroundImage = '';
      vp.style.backgroundSize = '';
      vp.style.backgroundPosition = '';
      vp.style.backgroundColor = bg.color || 'var(--bg)';
    }
  },

  applyCursor() {
    const open = wsHandCursorCss(false);
    const closed = wsHandCursorCss(true);
    const pointer = wsPointerCursorCss();
    this.els.shell.style.setProperty('--ws-cursor-hand', open);
    this.els.shell.style.setProperty('--ws-cursor-grabbing', closed);
    this.els.shell.style.setProperty('--ws-cursor-pointer', pointer);
    this.els.viewport.style.cursor = open;
  },

  setBgPattern(pattern, keepOpen) {
    this.board.bg.pattern = typeof wsNormalizeBgPattern === 'function' ? wsNormalizeBgPattern(pattern) : pattern;
    this.applyBg();
    this.scheduleSave();
    if (keepOpen) this.refreshBgPopover();
  },

  setBgColor(color, keepOpen) {
    color = wsColor(color, '');
    if (this.board.bg.image) {
      this.board.bg.image = false;
      this.bgUrl = null;
      WorkspaceDB.delFile(this.bgKey()).catch(() => {});
      if (this.activeWsId === (typeof WS_DEFAULT_ID !== 'undefined' ? WS_DEFAULT_ID : 'ws_default')) {
        WorkspaceDB.delFile('bg').catch(() => {});
      }
    }
    this.board.bg.color = color;
    this.applyBg();
    this.scheduleSave();
    if (keepOpen) this.openBgPopover();
  },

  refreshBgPopover() {
    if (this.popover === 'bg') {
      this.popover = null;
      this.openBgPopover();
    }
  },

  async setBgImageFile(file) {
    if (!file || !/^image\//.test(file.type)) return;
    if (file.size > 10 * 1024 * 1024) {
      toast(wsTr('ws.bgTooBig', null, 'Imagem muito grande — use até 10 MB'), 'image');
      return;
    }
    try {
      const url = await readFileAsDataURL(file);
      await WorkspaceDB.putFile(this.bgKey(), url);
      this.bgUrl = url;
      this.board.bg.image = true;
      this.applyBg();
      this.scheduleSave();
      this.refreshBgPopover();
      toast(wsTr('ws.bgUpdated', null, 'Fundo atualizado'), 'image');
    } catch (e) {
      toast(wsTr('ws.bgSaveErr', null, 'Não foi possível salvar a imagem'), 'close');
    }
  },

  removeBgImage() {
    this.bgUrl = null;
    this.board.bg.image = false;
    WorkspaceDB.delFile(this.bgKey()).catch(() => {});
    if (this.activeWsId === (typeof WS_DEFAULT_ID !== 'undefined' ? WS_DEFAULT_ID : 'ws_default')) {
      WorkspaceDB.delFile('bg').catch(() => {});
    }
    this.applyBg();
    this.scheduleSave();
    this.refreshBgPopover();
  },

  /* -------- multi-áreas e arquivos externos (.fluxo) -------- */
  clearRuntimeCaches() {
    this.pdfDocs.forEach((doc) => {
      if (doc && doc.destroy) { try { doc.destroy(); } catch (e) { /* ignora */ } }
    });
    this.pdfTasks.forEach((task) => {
      if (task && task.cancel) { try { task.cancel(); } catch (e) { /* ignora */ } }
    });
    this.pdfDocs.clear();
    this.pdfPromises.clear();
    this.pdfTasks.clear();
    this.pdfTokens.clear();
    this.pdfRendered.clear();
    this.pdfPageDims.clear();
    this.pdfTextCache.clear();
    this.pdfSearch.clear();
    this.imgUrls.clear();
    this.cardEls.clear();
    this.arrowEls.clear();
    this.inkUndo = [];
    this.inkRedo = [];
    this.inkStroke = null;
    this.inkEraser = null;
    this.setHoveredGrip(null);
    this.inkSpacePan = false;
    this.inkHandLock = false;
    this.selectMode = false;
    this.selectSpacePan = false;
    this.marquee = null;
    this.strokeDrag = null;
    this.selCard = null;
    this.selectedIds.clear();
    this.selectedStrokes.clear();
    this.selArrow = null;
    this.linkFrom = null;
    this.connCardId = null;
    this.searchHits = [];
    this.bgUrl = null;
    this.touchPtrs.clear();
    this.touchPinch = null;
    if (this.els.shell) this.els.shell.classList.remove('selecting', 'space-pan', 'dragging-card');
    if (this.els.viewport) this.els.viewport.classList.remove('stroke-sel-hover');
    if (this.els.marquee) this.els.marquee.hidden = true;
    if (this.els.multiTools) { this.els.multiTools.hidden = true; this.els.multiTools.innerHTML = ''; }
    if (this.els.arrowTools) { this.els.arrowTools.hidden = true; this.els.arrowTools.innerHTML = ''; }
    this.syncDockClearance();
  },

  async switchWorkspace(targetId) {
    if (!targetId || targetId === this.activeWsId) return;
    if (typeof wsSwitchWorkspaceEntry !== 'function') return;
    const sw = wsSwitchWorkspaceEntry(this.wsIndex, targetId);
    if (!sw.ok) return;

    await this.flushSave();
    this.setDrawMode(false);
    this.cancelLink();
    this.hideSelectionTools();
    this.closeTimerSettings();
    this.clearRuntimeCaches();

    this.wsIndex = sw.index;
    this.activeWsId = targetId;
    const idxKey = typeof WS_INDEX_KEY !== 'undefined' ? WS_INDEX_KEY : 'ws_index';
    await WorkspaceDB.setMeta(idxKey, this.wsIndex).catch(() => {});

    const raw = await this.loadBoardFor(targetId);
    this.board = this.normalize(raw);
    this.bgUrl = await this.loadBgFor(targetId);
    if (!raw || !raw.view) {
      const r = this.els.viewport.getBoundingClientRect();
      this.board.view = r.width > 40 ? { x: r.width / 2, y: r.height / 2, scale: 1 } : { x: 0, y: 0, scale: 1 };
    }

    this.renderAll();
    this.resizeInkCanvas();
    this.applyView();
    this.applyBg();
    this.applyCursor();
    this.applyInkCursor();
    this.renderTimer();
    this.updateEmpty();
    this.updateTopbar();
    this.updateHint();
    setTimeout(() => this.refreshPdfs(), 40);
  },

  async createWorkspace(name) {
    if (typeof wsCreateWorkspaceEntry !== 'function') return;
    await this.flushSave();
    const res = wsCreateWorkspaceEntry(this.wsIndex, name, 'ws_' + uid(), Date.now());
    if (!res.ok) {
      const maxWs = typeof WS_MAX_WORKSPACES !== 'undefined' ? WS_MAX_WORKSPACES : 5;
      toast(wsTr('ws.boards.limitPh', { max: maxWs }, 'Limite de ' + maxWs + ' áreas atingido'), 'board');
      this.refreshBoardsPopover();
      return;
    }

    this.setDrawMode(false);
    this.cancelLink();
    this.hideSelectionTools();
    this.closeTimerSettings();
    this.clearRuntimeCaches();

    this.wsIndex = res.index;
    this.activeWsId = res.entry.id;
    const r = this.els.viewport.getBoundingClientRect();
    this.board = this.defaultBoard();
    if (r.width > 40 && r.height > 40) {
      this.board.view = { x: r.width / 2, y: r.height / 2, scale: 1 };
    }
    await this.flushSave();
    this.closePopover();
    this.renderAll();
    this.resizeInkCanvas();
    this.applyView();
    this.applyBg();
    this.applyCursor();
    this.applyInkCursor();
    this.renderTimer();
    this.updateEmpty();
    this.updateTopbar();
    toast(wsTr('ws.boards.created', { name: res.entry.name }, 'Área "' + res.entry.name + '" criada'), 'board');
  },

  async renameWorkspace(id, newName) {
    if (typeof wsRenameWorkspaceEntry !== 'function') return;
    const res = wsRenameWorkspaceEntry(this.wsIndex, id, newName, Date.now());
    if (!res.ok) return;
    this.wsIndex = res.index;
    this.editingWsId = null;
    const idxKey = typeof WS_INDEX_KEY !== 'undefined' ? WS_INDEX_KEY : 'ws_index';
    await WorkspaceDB.setMeta(idxKey, this.wsIndex).catch(() => {});
    this.updateTopbar();
    this.refreshBoardsPopover();
  },

  async deleteWorkspaceFiles(wsId, boardObj) {
    WorkspaceDB.delFile(this.bgKey(wsId)).catch(() => {});
    if (wsId === (typeof WS_DEFAULT_ID !== 'undefined' ? WS_DEFAULT_ID : 'ws_default')) {
      WorkspaceDB.delFile('bg').catch(() => {});
    }
    if (boardObj && Array.isArray(boardObj.pdfs)) {
      boardObj.pdfs.forEach((p) => { if (p && p.id) WorkspaceDB.delFile(p.id).catch(() => {}); });
    }
    if (boardObj && Array.isArray(boardObj.images)) {
      boardObj.images.forEach((im) => { if (im && im.id) WorkspaceDB.delFile(im.id).catch(() => {}); });
    }
    const metaKey = typeof wsBoardMetaKey === 'function' ? wsBoardMetaKey(wsId) : ('board_' + wsId);
    await WorkspaceDB.delMeta(metaKey).catch(() => {});
    if (wsId === (typeof WS_DEFAULT_ID !== 'undefined' ? WS_DEFAULT_ID : 'ws_default')) {
      await WorkspaceDB.delMeta(WS_BOARD_KEY).catch(() => {});
    }
  },

  async deleteWorkspace(id) {
    if (typeof wsDeleteWorkspaceEntry !== 'function') return;
    if (!this.wsIndex || this.wsIndex.items.length <= 1) {
      toast(wsTr('ws.boards.keepOne', null, 'Mantenha ao menos 1 área de trabalho'), 'board');
      return;
    }
    const entry = this.wsIndex.items.find(it => it.id === id);
    if (!entry) return;
    const ok = await this.openConfirm({
      title: wsTr('ws.boards.delTitle', { name: entry.name }, 'Excluir "' + entry.name + '"?'),
      message: wsTr('ws.boards.delMsg', null, 'Os cartões, PDFs, imagens e desenhos desta área serão removidos do navegador.'),
      confirmLabel: wsTr('ws.boards.delConfirm', null, 'Excluir área'),
      danger: true
    });
    if (!ok) return;

    const targetBoard = id === this.activeWsId
      ? this.board
      : this.normalize(await this.loadBoardFor(id));

    const res = wsDeleteWorkspaceEntry(this.wsIndex, id);
    if (!res.ok) return;
    await this.deleteWorkspaceFiles(id, targetBoard);

    this.wsIndex = res.index;
    const idxKey = typeof WS_INDEX_KEY !== 'undefined' ? WS_INDEX_KEY : 'ws_index';
    await WorkspaceDB.setMeta(idxKey, this.wsIndex).catch(() => {});

    if (id === this.activeWsId) {
      this.setDrawMode(false);
      this.cancelLink();
      this.hideSelectionTools();
      this.closeTimerSettings();
      this.clearRuntimeCaches();
      this.activeWsId = res.nextActiveId;
      const raw = await this.loadBoardFor(this.activeWsId);
      this.board = this.normalize(raw);
      this.bgUrl = await this.loadBgFor(this.activeWsId);
      this.renderAll();
      this.resizeInkCanvas();
      this.applyView();
      this.applyBg();
      this.renderTimer();
      this.updateEmpty();
      setTimeout(() => this.refreshPdfs(), 40);
    }
    this.updateTopbar();
    this.openBoardsPopover();
    toast(wsTr('ws.boards.deleted', null, 'Área excluída'), 'trash');
  },

  async exportWorkspaceFile() {
    if (!this.board || typeof buildWorkspaceExportBundle !== 'function') return;
    await this.flushSave();
    const entry = this.currentWsEntry();
    const bgDataUrl = this.board.bg && this.board.bg.image ? (this.bgUrl || await this.loadBgFor(this.activeWsId)) : null;

    const pdfBuffers = {};
    for (const p of (this.board.pdfs || [])) {
      if (!p || !p.id) continue;
      try {
        const buf = await WorkspaceDB.getFile(p.id);
        if (buf) pdfBuffers[p.id] = buf;
      } catch (e) { /* ignora */ }
    }
    const imageUrls = {};
    for (const im of (this.board.images || [])) {
      if (!im || !im.id) continue;
      let url = this.imgUrls.get(im.id);
      if (!url) {
        try { url = await WorkspaceDB.getFile(im.id); } catch (e) { url = null; }
      }
      if (url) imageUrls[im.id] = url;
    }

    const bundle = buildWorkspaceExportBundle({
      name: entry.name,
      board: this.board,
      bgDataUrl,
      pdfBuffers,
      imageUrls
    });
    const filename = (typeof wsFileSlug === 'function' ? wsFileSlug(entry.name) : 'area-de-trabalho') + '.fluxo';
    const blob = new Blob([JSON.stringify(bundle)], { type: 'application/json' });
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objUrl), 1500);
    toast(wsTr('ws.boards.savedIn', { file: filename }, 'Área salva em ' + filename), 'download');
  },

  async importWorkspaceFile(file) {
    if (!file || typeof parseWorkspaceImportBundle !== 'function' || typeof remapWorkspaceBundle !== 'function') return;
    let text = '';
    try { text = await file.text(); }
    catch (e) { toast(wsTr('ws.boards.readErr', null, 'Não foi possível ler o arquivo selecionado'), 'close'); return; }

    const fallbackName = String(file.name || '').replace(/\.(fluxo|json)$/i, '');
    const parsed = parseWorkspaceImportBundle(text, fallbackName);
    if (!parsed.ok) {
      toast(parsed.error || wsTr('ws.boards.invalidFile', null, 'Arquivo inválido'), 'close');
      return;
    }

    const remapped = remapWorkspaceBundle(parsed, () => uid());
    const nextBoard = this.normalize(remapped.board);
    const maxWs = typeof WS_MAX_WORKSPACES !== 'undefined' ? WS_MAX_WORKSPACES : 5;
    const hasRoom = this.wsIndex && this.wsIndex.items.length < maxWs;

    let targetId = null;
    let replacing = false;

    if (hasRoom) {
      const created = wsCreateWorkspaceEntry(this.wsIndex, remapped.name, 'ws_' + uid(), Date.now());
      if (!created.ok) return;
      await this.flushSave();
      this.wsIndex = created.index;
      targetId = created.entry.id;
    } else {
      const curName = this.currentWsEntry().name || '';
      const ok = await this.openConfirm({
        title: wsTr('ws.boards.replaceTitle', { max: maxWs }, 'Limite de ' + maxWs + ' áreas atingido'),
        message: wsTr('ws.boards.replaceMsg', { cur: curName, next: remapped.name }, 'Substituir o quadro atual ("' + curName + '") pelo arquivo "' + remapped.name + '"?'),
        confirmLabel: wsTr('ws.boards.replaceConfirm', null, 'Substituir quadro'),
        danger: true
      });
      if (!ok) return;
      replacing = true;
      targetId = this.activeWsId;
      await this.deleteWorkspaceFiles(targetId, this.board);
      const ren = wsRenameWorkspaceEntry(this.wsIndex, targetId, remapped.name, Date.now());
      if (ren.ok) this.wsIndex = ren.index;
    }

    if (remapped.bgDataUrl && nextBoard.bg && nextBoard.bg.image) {
      await WorkspaceDB.putFile(this.bgKey(targetId), remapped.bgDataUrl).catch(() => { nextBoard.bg.image = false; });
    }
    for (const [pdfId, buf] of Object.entries(remapped.pdfFiles || {})) {
      await WorkspaceDB.putFile(pdfId, buf).catch(() => {});
    }
    for (const [imgId, url] of Object.entries(remapped.imageFiles || {})) {
      await WorkspaceDB.putFile(imgId, url).catch(() => {});
    }

    const metaKey = typeof wsBoardMetaKey === 'function' ? wsBoardMetaKey(targetId) : ('board_' + targetId);
    await WorkspaceDB.setMeta(metaKey, nextBoard).catch(() => {});
    const idxKey = typeof WS_INDEX_KEY !== 'undefined' ? WS_INDEX_KEY : 'ws_index';
    await WorkspaceDB.setMeta(idxKey, this.wsIndex).catch(() => {});

    this.setDrawMode(false);
    this.cancelLink();
    this.hideSelectionTools();
    this.closeTimerSettings();
    this.closePopover();
    this.clearRuntimeCaches();

    this.activeWsId = targetId;
    this.board = nextBoard;
    this.bgUrl = remapped.bgDataUrl || null;

    this.renderAll();
    this.resizeInkCanvas();
    this.applyView();
    this.applyBg();
    this.applyCursor();
    this.applyInkCursor();
    this.renderTimer();
    this.updateEmpty();
    this.updateTopbar();
    setTimeout(() => this.refreshPdfs(), 40);
    toast(wsTr(replacing ? 'ws.boards.replaced' : 'ws.boards.opened', { name: remapped.name }, (replacing ? 'Quadro substituído: ' : 'Área aberta: ') + remapped.name), 'folder');
  },

  refreshBoardsPopover() {
    if (this.popover === 'boards') {
      this.popover = null;
      this.openBoardsPopover();
    }
  },

  openBoardsPopover() {
    if (this.popover === 'boards') { this.closePopover(); return; }
    this.closeTimerSettings();
    this.closeInkSettings();
    this.popover = 'boards';
    this.updateTopbar();

    const idx = this.wsIndex || { activeId: this.activeWsId, items: [{ id: this.activeWsId, name: wsTr('ws.defaultBoard', null, 'Quadro principal') }] };
    const maxWs = typeof WS_MAX_WORKSPACES !== 'undefined' ? WS_MAX_WORKSPACES : 5;
    const atLimit = idx.items.length >= maxWs;
    const onlyOne = idx.items.length <= 1;

    const listHtml = idx.items.map((it) => {
      const active = it.id === this.activeWsId;
      if (this.editingWsId === it.id) {
        return '<div class="ws-board-row' + (active ? ' active' : '') + '">' +
          '<input type="text" class="ws-board-rename" data-wsinput="' + wsEscape(it.id) + '" value="' + wsEscape(it.name) + '" maxlength="42" aria-label="' + wsEscape(wsTr('ws.boards.nameAria', null, 'Nome da área')) + '">' +
          '<button type="button" class="ws-board-act" data-wssave="' + wsEscape(it.id) + '" title="' + wsEscape(wsTr('ws.boards.saveName', null, 'Salvar nome')) + '" aria-label="' + wsEscape(wsTr('ws.boards.saveName', null, 'Salvar nome')) + '">' + svgIcon('check') + '</button>' +
        '</div>';
      }
      const renTip = wsTr('ws.boards.rename', null, 'Renomear') + ' ' + it.name;
      const delTip = onlyOne ? wsTr('ws.boards.keepOne', null, 'Mantenha ao menos 1 área') : (wsTr('ws.boards.delete', null, 'Excluir') + ' ' + it.name);
      return '<div class="ws-board-row' + (active ? ' active' : '') + '">' +
        '<button type="button" class="ws-board-switch" data-wsid="' + wsEscape(it.id) + '">' +
          '<span class="ws-board-dot"></span>' +
          '<span class="ws-board-name">' + wsEscape(it.name) + '</span>' +
        '</button>' +
        '<div class="ws-board-acts">' +
          '<button type="button" class="ws-board-act" data-wsrename="' + wsEscape(it.id) + '" title="' + wsEscape(renTip) + '" aria-label="' + wsEscape(renTip) + '">' + svgIcon('pencil') + '</button>' +
          '<button type="button" class="ws-board-act danger" data-wsdel="' + wsEscape(it.id) + '"' + (onlyOne ? ' disabled' : '') + ' title="' + wsEscape(delTip) + '" aria-label="' + wsEscape(delTip) + '">' + svgIcon('trash') + '</button>' +
        '</div>' +
      '</div>';
    }).join('');

    const html =
      '<div class="ws-popover left">' +
        '<div class="ws-pop-head">' +
          '<p class="ws-pop-title">' + wsEscape(wsTr('ws.boards.title', null, 'Áreas de trabalho')) + '</p>' +
          '<span class="ws-pop-quota' + (atLimit ? ' full' : '') + '" data-testid="ws-quota">' + idx.items.length + '/' + maxWs + '</span>' +
        '</div>' +
        '<div class="ws-boards-list">' + listHtml + '</div>' +
        '<form class="ws-create-form" data-wsnewform>' +
          '<input type="text" class="ws-create-input" data-wsnewname placeholder="' + wsEscape(atLimit ? wsTr('ws.boards.limitPh', { max: maxWs }, 'Limite de ' + maxWs + ' áreas atingido') : wsTr('ws.boards.namePlaceholder', null, 'Nome da nova área…')) + '" maxlength="42"' + (atLimit ? ' disabled' : '') + '>' +
          '<button type="submit" class="ws-create-btn"' + (atLimit ? ' disabled' : '') + '>' + svgIcon('plus') + '<span>' + wsEscape(wsTr('ws.boards.newBtn', null, 'Nova')) + '</span></button>' +
        '</form>' +
        '<p class="ws-pop-note">' + wsEscape(wsTr('ws.boards.limitNote', { max: maxWs }, 'Limite de ' + maxWs + ' áreas simultâneas para manter o navegador leve e responsivo.')) + '</p>' +
        '<div class="ws-pop-sub">' + wsEscape(wsTr('ws.boards.extFile', null, 'Arquivo externo (.fluxo)')) + '</div>' +
        '<div class="ws-io-grid">' +
          '<button type="button" class="ws-io-btn" data-wsexport>' + svgIcon('download') + '<span>' + wsEscape(wsTr('ws.boards.saveFile', null, 'Salvar arquivo')) + '</span></button>' +
          '<button type="button" class="ws-io-btn" data-wsimport>' + svgIcon('folder') + '<span>' + wsEscape(wsTr('ws.boards.openFile', null, 'Abrir arquivo')) + '</span></button>' +
        '</div>' +
      '</div>';

    this.els.popovers.innerHTML = html;
    const pop = this.els.popovers.firstChild;

    pop.addEventListener('pointerdown', (e) => e.stopPropagation());
    pop.addEventListener('click', (e) => {
      const swBtn = e.target.closest('[data-wsid]');
      if (swBtn) {
        const id = swBtn.dataset.wsid;
        this.closePopover();
        this.switchWorkspace(id);
        return;
      }
      const renBtn = e.target.closest('[data-wsrename]');
      if (renBtn) {
        this.editingWsId = renBtn.dataset.wsrename;
        this.refreshBoardsPopover();
        const inp = this.els.popovers.querySelector('[data-wsinput]');
        if (inp) { inp.focus(); inp.select(); }
        return;
      }
      const saveBtn = e.target.closest('[data-wssave]');
      if (saveBtn) {
        const inp = pop.querySelector('[data-wsinput]');
        this.renameWorkspace(saveBtn.dataset.wssave, inp ? inp.value : '');
        return;
      }
      const delBtn = e.target.closest('[data-wsdel]');
      if (delBtn && !delBtn.disabled) {
        this.deleteWorkspace(delBtn.dataset.wsdel);
        return;
      }
      if (e.target.closest('[data-wsexport]')) {
        this.exportWorkspaceFile();
        return;
      }
      if (e.target.closest('[data-wsimport]')) {
        if (this.els.fileImport) this.els.fileImport.click();
      }
    });

    const renameInput = pop.querySelector('[data-wsinput]');
    if (renameInput) {
      renameInput.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          e.preventDefault();
          this.renameWorkspace(renameInput.dataset.wsinput, renameInput.value);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this.editingWsId = null;
          this.refreshBoardsPopover();
        }
      });
    }

    const createForm = pop.querySelector('[data-wsnewform]');
    if (createForm) {
      createForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (atLimit) return;
        const inp = createForm.querySelector('[data-wsnewname]');
        this.createWorkspace(inp ? inp.value : '');
      });
    }
  },

  /* -------- popovers e confirmações -------- */
  closePopover() {
    const prev = this.popover;
    this.popover = null;
    this.editingWsId = null;
    this.connCardId = null;
    if (this.confirmOpen) {
      const finish = this.confirmOpen;
      this.confirmOpen = null;
      finish(false);
    }
    this.els.popovers.innerHTML = '';
    if (prev === 'boards' || prev === 'search' || prev === 'add' || prev === 'linkdefs' || prev === 'bg') this.updateTopbar();
  },

  openConfirm(opts) {
    this.closePopover();
    this.closeTimerSettings();
    return new Promise((resolve) => {
      let done = false;
      const finish = (ok) => {
        if (done) return;
        done = true;
        this.confirmOpen = null;
        this.popover = null;
        this.els.popovers.innerHTML = '';
        resolve(!!ok);
      };
      this.confirmOpen = finish;
      this.popover = 'confirm';

      const backdrop = el('div', 'ws-confirm-backdrop');
      const dialog = el('div', 'ws-confirm-dialog');
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.innerHTML =
        '<h3>' + wsEscape(opts.title || wsTr('ws.confirmTitle', null, 'Confirmar')) + '</h3>' +
        (opts.message ? '<p>' + wsEscape(opts.message) + '</p>' : '') +
        '<div class="ws-confirm-actions">' +
          '<button type="button" class="ws-confirm-btn" data-confirm="cancel">' + wsEscape(opts.cancelLabel || wsTr('ws.confirmCancel', null, 'Cancelar')) + '</button>' +
          '<button type="button" class="ws-confirm-btn ' + (opts.danger ? 'danger' : 'primary') + '" data-confirm="ok">' + wsEscape(opts.confirmLabel || wsTr('ws.confirmOk', null, 'Confirmar')) + '</button>' +
        '</div>';
      backdrop.append(dialog);
      this.els.popovers.innerHTML = '';
      this.els.popovers.append(backdrop);

      backdrop.addEventListener('pointerdown', (e) => e.stopPropagation());
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) { finish(false); return; }
        const btn = e.target.closest('[data-confirm]');
        if (!btn) return;
        finish(btn.dataset.confirm === 'ok');
      });
      const okBtn = dialog.querySelector('[data-confirm="ok"]');
      if (okBtn) okBtn.focus();
    });
  },

  openBgPopover() {
    if (this.popover === 'bg') { this.closePopover(); return; }
    this.closeTimerSettings();
    this.popover = 'bg';
    const bg = this.board.bg;
    const current = bg.color || '';
    const pattern = typeof wsNormalizeBgPattern === 'function' ? wsNormalizeBgPattern(bg.pattern) : (bg.pattern || 'dots');
    const patternBtns = WS_BG_PATTERN_OPTS.map(p =>
      '<button type="button" class="ws-pop-chip' + (pattern === p.id ? ' active' : '') + '" data-bgpattern="' + p.id + '">' + wsEscape(wsTr(p.key, null, p.def)) + '</button>'
    ).join('');

    let html = '<div class="ws-popover"><p class="ws-pop-title">' + wsEscape(wsTr('ws.bgPopTitle', null, 'Fundo da área')) + '</p>' +
      '<div class="ws-pop-sub" style="margin-top:0">' + wsEscape(wsTr('ws.bgPatternSub', null, 'Padrão da área')) + '</div>' +
      '<div class="ws-pop-row">' + patternBtns + '</div>' +
      '<div class="ws-pop-sub">' + wsEscape(wsTr('ws.bgSolidSub', null, 'Cor sólida')) + '</div>' +
      '<div class="ws-color-grid">';
    WS_BG_SWATCHES.forEach(c => {
      const val = c || '';
      const bgc = c || 'var(--bg)';
      html += '<button class="ws-swatch' + (val === current && !bg.image ? ' active' : '') + '" data-bgcolor="' + val + '" title="' + wsEscape(val || wsTr('ws.bgThemeColor', null, 'Cor do tema')) + '" style="background:' + bgc + '"></button>';
    });
    html += '</div>' +
      '<label class="ws-color-custom"><input type="color" value="' + (wsColor(current, '#0b0f1a') || '#0b0f1a') + '" data-bgcustom><span>' + wsEscape(wsTr('ws.bgCustomColor', null, 'Cor personalizada')) + '</span></label>' +
      '<div class="ws-pop-sub">' + wsEscape(wsTr('ws.bgImageSub', null, 'Imagem de fundo')) + '</div>' +
      '<div class="ws-pop-row">' +
        '<button class="ws-pop-chip" data-bgimg>' + svgIcon('upload') + ' ' + wsEscape(wsTr('ws.bgChooseImg', null, 'Escolher imagem')) + '</button>' +
        (bg.image ? '<button class="ws-pop-chip" data-bgdel>' + wsEscape(wsTr('ws.bgRemoveImg', null, 'Remover')) + '</button>' : '') +
      '</div>' +
      '<p class="ws-pop-note">' + wsEscape(wsTr('ws.bgNote', null, 'Cor, padrão ou imagem de até 10 MB. O fundo fica salvo junto com o quadro.')) + '</p></div>';
    this.els.popovers.innerHTML = html;
    const pop = this.els.popovers.firstChild;
    pop.addEventListener('click', (e) => {
      const patBtn = e.target.closest('[data-bgpattern]');
      if (patBtn) { this.setBgPattern(patBtn.dataset.bgpattern, true); return; }
      const colorBtn = e.target.closest('[data-bgcolor]');
      if (colorBtn) { this.setBgColor(colorBtn.dataset.bgcolor); this.refreshBgPopover(); return; }
      if (e.target.closest('[data-bgimg]')) { this.els.fileBg.click(); return; }
      if (e.target.closest('[data-bgdel]')) { this.removeBgImage(); return; }
    });
    const custom = pop.querySelector('[data-bgcustom]');
    if (custom) custom.addEventListener('change', () => { this.setBgColor(custom.value); this.refreshBgPopover(); });
    this.updateTopbar();
  },

  openLinkDefaultsPopover() {
    if (this.popover === 'linkdefs') { this.closePopover(); return; }
    this.closeTimerSettings();
    this.closeInkSettings();
    this.popover = 'linkdefs';
    this.updateTopbar();
    this.renderLinkDefaultsPopover();
  },

  renderLinkDefaultsPopover() {
    if (this.popover !== 'linkdefs' || !this.board) return;
    const defs = typeof wsNormalizeLinkDefaults === 'function'
      ? wsNormalizeLinkDefaults(this.board.linkDefaults)
      : (this.board.linkDefaults || { routing: 's-curve', types: {} });
    this.board.linkDefaults = defs;

    const routingBtns = WS_ARROW_ROUTING_OPTS.filter(r => r.id !== 'auto').map(r =>
      '<button type="button" class="ws-pop-chip' + (defs.routing === r.id ? ' active' : '') + '" data-ldroute="' + r.id + '">' +
        wsEscape(wsTr(r.key, null, r.def)) +
      '</button>'
    ).join('');

    const shapeOpts = WS_ARROW_CAP_OPTS.filter(c => c.id !== 'auto');
    const styleOpts = WS_ARROW_LINE_STYLE_OPTS.filter(s => s.id !== 'auto');
    const colors = typeof WS_ARROW_COLORS !== 'undefined' ? WS_ARROW_COLORS : [];

    const buildPreviewSvg = (kindId, cfg) => {
      const dash = typeof wsLineDashArray === 'function' ? wsLineDashArray(cfg.lineStyle, Math.max(1.5, cfg.width || 1.8)) : '';
      const dashAttr = dash ? ' stroke-dasharray="' + dash + '"' : '';
      const sw = Math.min(2.6, Math.max(1.3, (cfg.width || 1.8) * 0.9));
      const colStyle = cfg.color ? (' style="--ld-col:' + cfg.color + '"') : '';
      if (kindId === 'sequence') {
        return '<svg class="ws-ld-preview" viewBox="0 0 34 12" aria-hidden="true"' + colStyle + '>' +
          '<path d="M2 6h22" stroke="currentColor" stroke-width="' + sw.toFixed(1) + '" stroke-linecap="round"' + dashAttr + '/>' +
          '<path d="M23 2.5L32 6 23 9.5 25 6Z" fill="currentColor"/>' +
        '</svg>';
      }
      const cap = cfg.cap || 'circle';
      const hasCore = kindId === 'supports';
      const capEl = (cx, isTarget) => {
        if (cap === 'none') return '';
        if (cap === 'bar') return '<path d="M' + cx + ' 2V10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';
        if (cap === 'arrow') {
          return isTarget
            ? '<path d="M' + (cx - 6) + ' 2.5L' + (cx + 1.5) + ' 6 ' + (cx - 6) + ' 9.5 ' + (cx - 4.2) + ' 6Z" fill="currentColor"/>'
            : '<path d="M' + (cx + 6) + ' 2.5L' + (cx - 1.5) + ' 6 ' + (cx + 6) + ' 9.5 ' + (cx + 4.2) + ' 6Z" fill="currentColor"/>';
        }
        if (cap === 'square') {
          return '<rect x="' + (cx - 3.3) + '" y="2.7" width="6.6" height="6.6" rx="1.5" fill="var(--bg-soft, var(--bg))" stroke="currentColor" stroke-width="1.5"/>' +
            (hasCore && isTarget ? '<rect x="' + (cx - 1.4) + '" y="4.6" width="2.8" height="2.8" rx="0.6" fill="currentColor"/>' : '');
        }
        if (cap === 'diamond') {
          return '<path d="M' + cx + ' 1.8L' + (cx + 4.2) + ' 6 ' + cx + ' 10.2 ' + (cx - 4.2) + ' 6Z" fill="var(--bg-soft, var(--bg))" stroke="currentColor" stroke-width="1.45"/>' +
            (hasCore && isTarget ? '<path d="M' + cx + ' 4.1L' + (cx + 1.9) + ' 6 ' + cx + ' 7.9 ' + (cx - 1.9) + ' 6Z" fill="currentColor"/>' : '');
        }
        return '<circle cx="' + cx + '" cy="6" r="3.4" fill="var(--bg-soft, var(--bg))" stroke="currentColor" stroke-width="1.5"/>' +
          (hasCore && isTarget ? '<circle cx="' + cx + '" cy="6" r="1.5" fill="currentColor"/>' : '');
      };
      return '<svg class="ws-ld-preview" viewBox="0 0 34 12" aria-hidden="true"' + colStyle + '>' +
        '<path d="M6 6h22" stroke="currentColor" stroke-width="' + sw.toFixed(1) + '" stroke-linecap="round"' + dashAttr + '/>' +
        capEl(5.5, false) + capEl(28.5, true) +
      '</svg>';
    };

    const renderTypeCard = (kindId, isSeq) => {
      const kMeta = (typeof WS_ARROW_KINDS !== 'undefined' ? WS_ARROW_KINDS : []).find(x => x.id === kindId) || { id: kindId, label: kindId };
      const cfg = defs.types[kindId] || { cap: 'circle', lineStyle: 'solid', width: 1.8, color: '' };
      const ruleText = isSeq
        ? wsTr('ws.linkDefsCapRuleSeq', null, 'Seta externa fixa · Direcional')
        : (kindId === 'supports'
          ? wsTr('ws.linkDefsCapRuleDir', null, 'Direcional por padrão')
          : wsTr('ws.linkDefsCapRuleUndir', null, 'Sem direção por padrão'));

      const capField = isSeq ? '' : (
        '<label class="ws-ld-field">' +
          '<span>' + wsEscape(wsTr('ws.linkDefsShape', null, 'Forma')) + '</span>' +
          '<select class="ws-ar-capselect" data-ldcap="' + kindId + '">' +
            shapeOpts.map(opt => '<option value="' + opt.id + '"' + (cfg.cap === opt.id ? ' selected' : '') + '>' + wsEscape(wsTr(opt.key, null, opt.def)) + '</option>').join('') +
          '</select>' +
        '</label>'
      );
      const styleField =
        '<label class="ws-ld-field">' +
          '<span>' + wsEscape(wsTr('ws.arrow.lineStyle', null, 'Linha')) + '</span>' +
          '<select class="ws-ar-capselect" data-ldstyle="' + kindId + '">' +
            styleOpts.map(opt => '<option value="' + opt.id + '"' + (cfg.lineStyle === opt.id ? ' selected' : '') + '>' + wsEscape(wsTr(opt.key, null, opt.def)) + '</option>').join('') +
          '</select>' +
        '</label>';
      const widthField =
        '<label class="ws-ld-field">' +
          '<span>' + wsEscape(wsTr('ws.arrow.width', null, 'Espessura')) + '</span>' +
          '<select class="ws-ar-capselect" data-ldwidth="' + kindId + '">' +
            WS_ARROW_WIDTH_OPTS.map(w => '<option value="' + w + '"' + (Math.abs((cfg.width || 1.8) - w) < 0.05 ? ' selected' : '') + '>' + w + 'px</option>').join('') +
          '</select>' +
        '</label>';
      const dotCtrl =
        '<div class="ws-ld-colorrow">' +
          '<span>' + wsEscape(wsTr('ws.arrow.color', null, 'Cor')) + '</span>' +
          '<div class="ws-ld-dots">' + colors.map(c =>
            '<button type="button" class="ws-sel-dot' + ((cfg.color || '') === c.value ? ' active' : '') + '" data-ldcolor="' + kindId + '" data-val="' + c.value + '" title="' + wsEscape(wsColorLabel(c)) + '" style="background:' + (c.value || 'var(--surface-2)') + (c.value ? '' : ';box-shadow:inset 0 0 0 1.5px var(--text-faint)') + '"></button>'
          ).join('') + '</div>' +
        '</div>';

      return '<div class="ws-ld-row' + (isSeq ? ' is-seq' : '') + '">' +
        '<div class="ws-ld-head">' +
          '<span class="ws-ld-titlewrap">' + buildPreviewSvg(kindId, cfg) + '<span>' + wsEscape(wsTr('ws.arrow.' + kindId, null, kMeta.label)) + '</span></span>' +
          '<span class="ws-ld-rule">' + wsEscape(ruleText) + '</span>' +
        '</div>' +
        '<div class="ws-ld-ctrlgrid' + (isSeq ? ' cols-2' : '') + '">' + capField + styleField + widthField + '</div>' +
        dotCtrl +
      '</div>';
    };

    const configurableRows = ['relates', 'supports', 'contrast'].map(id => renderTypeCard(id, false)).join('');
    const sequenceRow = renderTypeCard('sequence', true);

    this.els.popovers.innerHTML =
      '<div class="ws-popover ws-linkdef-pop">' +
        '<div class="ws-pop-head"><p class="ws-pop-title">' + wsEscape(wsTr('ws.linkDefsPopTitle', null, 'Configurações de ligações')) + '</p></div>' +
        '<div class="ws-pop-sub" style="margin-top:0">' + wsEscape(wsTr('ws.linkDefsGlobalRouting', null, 'Traçado padrão global')) + '</div>' +
        '<div class="ws-pop-row">' + routingBtns + '</div>' +
        '<div class="ws-pop-sub">' + wsEscape(wsTr('ws.linkDefsSemanticTypes', null, 'Pontas configuráveis por tipo')) + '</div>' +
        '<div class="ws-ld-rows">' + configurableRows + '</div>' +
        '<div class="ws-pop-sub">' + wsEscape(wsTr('ws.linkDefsFlowType', null, 'Fluxo sequencial')) + '</div>' +
        '<div class="ws-ld-rows">' + sequenceRow + '</div>' +
        '<div class="ws-pop-row" style="margin-top:10px">' +
          '<button type="button" class="ws-pop-chip" data-ldreset>' + wsEscape(wsTr('ws.linkDefsReset', null, 'Restaurar padrões')) + '</button>' +
        '</div>' +
        '<p class="ws-pop-note">' + wsEscape(wsTr('ws.linkDefsNote', null, 'Ligações configuradas em Auto seguem estes padrões automaticamente.')) + '</p>' +
      '</div>';

    const pop = this.els.popovers.firstChild;
    pop.addEventListener('pointerdown', (e) => e.stopPropagation());
    pop.addEventListener('click', (e) => {
      const rb = e.target.closest('[data-ldroute]');
      if (rb) {
        this.board.linkDefaults.routing = rb.dataset.ldroute;
        this.renderArrows();
        if (this.selArrow) this.renderArrowTools();
        this.renderLinkDefaultsPopover();
        this.scheduleSave();
        return;
      }
      const cb = e.target.closest('[data-ldcolor]');
      if (cb) {
        const k = cb.dataset.ldcolor;
        if (this.board.linkDefaults.types[k]) {
          this.board.linkDefaults.types[k].color = cb.dataset.val || '';
          this.renderArrows();
          if (this.selArrow) this.renderArrowTools();
          this.renderLinkDefaultsPopover();
          this.scheduleSave();
        }
        return;
      }
      if (e.target.closest('[data-ldreset]')) {
        this.board.linkDefaults = typeof wsDefaultLinkSettings === 'function' ? wsDefaultLinkSettings() : this.board.linkDefaults;
        this.renderArrows();
        if (this.selArrow) this.renderArrowTools();
        this.renderLinkDefaultsPopover();
        this.scheduleSave();
      }
    });
    pop.addEventListener('change', (e) => {
      const capSel = e.target.closest('[data-ldcap]');
      if (capSel) {
        const k = capSel.dataset.ldcap;
        if (k !== 'sequence' && this.board.linkDefaults.types[k]) {
          this.board.linkDefaults.types[k].cap = capSel.value;
          this.renderArrows();
          if (this.selArrow) this.renderArrowTools();
          this.renderLinkDefaultsPopover();
          this.scheduleSave();
        }
        return;
      }
      const stSel = e.target.closest('[data-ldstyle]');
      if (stSel) {
        const k = stSel.dataset.ldstyle;
        if (this.board.linkDefaults.types[k]) {
          this.board.linkDefaults.types[k].lineStyle = stSel.value;
          this.renderArrows();
          if (this.selArrow) this.renderArrowTools();
          this.renderLinkDefaultsPopover();
          this.scheduleSave();
        }
        return;
      }
      const wSel = e.target.closest('[data-ldwidth]');
      if (wSel) {
        const k = wSel.dataset.ldwidth;
        if (this.board.linkDefaults.types[k]) {
          this.board.linkDefaults.types[k].width = Number(wSel.value) || 1.8;
          this.renderArrows();
          if (this.selArrow) this.renderArrowTools();
          this.renderLinkDefaultsPopover();
          this.scheduleSave();
        }
      }
    });
  },

  openCustomPopover(html) {
    this.closeTimerSettings();
    this.popover = 'custom';
    this.els.popovers.innerHTML = '<div class="ws-popover">' + html + '</div>';
    return this.els.popovers.firstChild;
  },

  /* -------- menu de criação, busca no quadro e conexões -------- */
  openAddPopover() {
    if (this.popover === 'add') { this.closePopover(); return; }
    this.closeTimerSettings();
    this.closeInkSettings();
    this.popover = 'add';
    this.updateTopbar();
    const html =
      '<div class="ws-popover ws-add-pop">' +
        '<p class="ws-pop-title">' + wsEscape(wsTr('ws.addPopTitle', null, 'Adicionar ao quadro')) + '</p>' +
        '<div class="ws-add-list">' +
          '<button type="button" class="ws-add-item" data-newcard="note">' +
            svgIcon('pencil') +
            '<div><b>' + wsEscape(wsTr('ws.addPopNoteTitle', null, 'Nota rápida')) + '</b><span>' + wsEscape(wsTr('ws.addPopNoteDesc', null, 'Anotação livre ou colada do PDF (duplo clique no quadro)')) + '</span></div>' +
          '</button>' +
          '<button type="button" class="ws-add-item" data-newcard="concept">' +
            svgIcon('hash') +
            '<div><b>' + wsEscape(wsTr('ws.addPopConceptTitle', null, 'Conceito / Ideia')) + '</b><span>' + wsEscape(wsTr('ws.addPopConceptDesc', null, 'Título, #tags e síntese para ligar ideias')) + '</span></div>' +
          '</button>' +
          '<button type="button" class="ws-add-item" data-newcard="checklist">' +
            svgIcon('checklist') +
            '<div><b>' + wsEscape(wsTr('ws.addPopCheckTitle', null, 'Checklist / Revisão')) + '</b><span>' + wsEscape(wsTr('ws.addPopCheckDesc', null, 'Lista de tópicos marcáveis com progresso')) + '</span></div>' +
          '</button>' +
          '<button type="button" class="ws-add-item" data-newcard="group">' +
            svgIcon('layers') +
            '<div><b>' + wsEscape(wsTr('ws.addPopGroupTitle', null, 'Quadro / Grupo')) + '</b><span>' + wsEscape(wsTr('ws.addPopGroupDesc', null, 'Agrupa visualmente cartões de um mesmo tema')) + '</span></div>' +
          '</button>' +
        '</div>' +
      '</div>';
    this.els.popovers.innerHTML = html;
    const pop = this.els.popovers.firstChild;
    pop.addEventListener('pointerdown', (e) => e.stopPropagation());
    pop.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-newcard]');
      if (!btn) return;
      const kind = btn.dataset.newcard;
      this.closePopover();
      if (kind === 'concept') this.addConcept();
      else if (kind === 'checklist') this.addChecklist();
      else if (kind === 'group') this.addGroup();
      else this.addNote();
    });
  },

  openSearchPopover() {
    if (this.popover === 'search') {
      const inp = this.els.popovers.querySelector('[data-wssearch]');
      if (inp) { inp.focus(); inp.select(); }
      return;
    }
    this.closeTimerSettings();
    this.closeInkSettings();
    this.popover = 'search';
    this.searchIdx = 0;
    this.updateTopbar();

    const scopes = [
      { id: 'all',   label: wsTr('ws.searchScopeAll', null, 'Tudo') },
      { id: 'cards', label: wsTr('ws.searchScopeCards', null, 'Cartões') },
      { id: 'pdfs',  label: wsTr('ws.searchScopePdfs', null, 'PDFs') },
      { id: 'links', label: wsTr('ws.searchScopeLinks', null, 'Ligações') }
    ].map(s =>
      '<button type="button" class="ws-search-tab' + (this.searchScope === s.id ? ' active' : '') + '" data-wsscope="' + s.id + '">' + wsEscape(s.label) + '</button>'
    ).join('');

    const html =
      '<div class="ws-popover ws-search-pop" role="dialog" aria-label="' + wsEscape(wsTr('ws.searchPopAria', null, 'Buscar na área de trabalho')) + '">' +
        '<div class="ws-search-input-wrap">' +
          svgIcon('search') +
          '<input type="text" class="ws-search-input" data-wssearch value="' + wsEscape(this.searchQuery) + '" placeholder="' + wsEscape(wsTr('ws.searchPopPh', null, 'Buscar notas, conceitos, #tags, PDFs, ligações…')) + '" autocomplete="off">' +
          '<button type="button" class="ws-card-btn" data-wssearchclear title="' + wsEscape(wsTr('ws.searchPopClear', null, 'Limpar busca')) + '" aria-label="' + wsEscape(wsTr('ws.searchPopClear', null, 'Limpar busca')) + '"' + (this.searchQuery ? '' : ' hidden') + '>' + svgIcon('close') + '</button>' +
        '</div>' +
        '<div class="ws-search-tabs">' + scopes + '</div>' +
        '<div class="ws-search-list" data-wsresults></div>' +
        '<p class="ws-pop-note" data-wssearchhint>' + wsEscape(wsTr('ws.searchPopHint', null, '↑↓ navega · Enter foca no cartão · Esc fecha')) + '</p>' +
      '</div>';

    this.els.popovers.innerHTML = html;
    const pop = this.els.popovers.firstChild;
    const inp = pop.querySelector('[data-wssearch]');
    const clearBtn = pop.querySelector('[data-wssearchclear]');

    pop.addEventListener('pointerdown', (e) => e.stopPropagation());
    pop.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-wsscope]');
      if (tab) {
        this.searchScope = tab.dataset.wsscope;
        this.searchIdx = 0;
        pop.querySelectorAll('[data-wsscope]').forEach(b => b.classList.toggle('active', b.dataset.wsscope === this.searchScope));
        this.renderSearchResults();
        if (inp) inp.focus();
        return;
      }
      if (e.target.closest('[data-wssearchclear]')) {
        this.searchQuery = '';
        this.searchIdx = 0;
        if (inp) { inp.value = ''; inp.focus(); }
        if (clearBtn) clearBtn.hidden = true;
        this.renderSearchResults();
        return;
      }
      const hitEl = e.target.closest('[data-wshit]');
      if (hitEl) {
        const idx = Number(hitEl.dataset.wshit);
        const hit = this.searchHits[idx];
        if (hit) this.jumpToSearchResult(hit);
      }
    });

    if (inp) {
      inp.addEventListener('input', () => {
        this.searchQuery = inp.value;
        this.searchIdx = 0;
        if (clearBtn) clearBtn.hidden = !inp.value;
        this.renderSearchResults();
      });
      inp.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Escape') { e.preventDefault(); this.closePopover(); return; }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (this.searchHits.length) {
            this.searchIdx = (this.searchIdx + 1) % this.searchHits.length;
            this.renderSearchResults();
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (this.searchHits.length) {
            this.searchIdx = (this.searchIdx - 1 + this.searchHits.length) % this.searchHits.length;
            this.renderSearchResults();
          }
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const hit = this.searchHits[this.searchIdx];
          if (hit) this.jumpToSearchResult(hit);
        }
      });
      setTimeout(() => { inp.focus(); inp.select(); }, 10);
    }
    this.renderSearchResults();
  },

  renderSearchResults() {
    if (this.popover !== 'search') return;
    const list = this.els.popovers.querySelector('[data-wsresults]');
    if (!list) return;
    const hits = typeof wsSearchBoard === 'function'
      ? wsSearchBoard(this.board, this.searchQuery, { scope: this.searchScope })
      : [];
    this.searchHits = hits;
    if (this.searchIdx >= hits.length) this.searchIdx = 0;

    if (!hits.length) {
      const q = this.searchQuery.trim();
      list.innerHTML = '<div class="ws-search-empty">' +
        wsEscape(q
          ? wsTr('ws.searchEmptyQuery', { q }, 'Nenhum resultado encontrado para "' + q + '".')
          : wsTr('ws.searchEmptyBoard', null, 'O quadro ainda não tem itens para buscar.')) +
        '</div>';
      return;
    }

    const iconFor = (hit) => {
      if (hit.kind === 'arrow') return 'link';
      if (hit.cardType === 'concept') return 'hash';
      if (hit.cardType === 'checklist') return 'checklist';
      if (hit.cardType === 'group') return 'layers';
      if (hit.cardType === 'pdf') return 'file';
      if (hit.cardType === 'image') return 'image';
      return 'pencil';
    };

    list.innerHTML = hits.map((h, i) =>
      '<button type="button" class="ws-search-hit' + (i === this.searchIdx ? ' active' : '') + '" data-wshit="' + i + '">' +
        svgIcon(iconFor(h)) +
        '<div class="ws-search-hit-body">' +
          '<div class="ws-search-hit-top"><b>' + wsEscape(h.title) + '</b><span>' + wsEscape(h.meta) + '</span></div>' +
          (h.snippet ? '<p>' + wsEscape(h.snippet) + '</p>' : '') +
        '</div>' +
      '</button>'
    ).join('');
  },

  jumpToSearchResult(hit) {
    if (!hit) return;
    this.closePopover();
    if (hit.kind === 'arrow' && hit.arrowId) {
      const a = this.board.arrows.find(x => x.id === hit.arrowId);
      if (a) this.focusCard(a.from, { selectArrowId: a.id });
      return;
    }
    this.focusCard(hit.cardId, { page: hit.page });
  },

  focusCard(cardId, opts) {
    opts = opts || {};
    const card = this.board.cards.find(c => c.id === cardId);
    if (!card) return;
    const r = this.els.viewport.getBoundingClientRect();
    const v = this.board.view;
    const topPad = 78;
    const botPad = 56;
    const availW = Math.max(200, r.width - 72);
    const availH = Math.max(200, r.height - topPad - botPad);
    const fitScale = clamp(Math.min(availW / Math.max(1, card.w), availH / Math.max(1, card.h)), 0.25, 1.25);
    if (v.scale < 0.72) v.scale = Math.min(0.95, fitScale);
    else if (card.w * v.scale > availW || card.h * v.scale > availH) v.scale = fitScale;
    const targetCenterY = topPad + availH / 2;
    v.x = r.width / 2 - (card.x + card.w / 2) * v.scale;
    v.y = targetCenterY - (card.y + card.h / 2) * v.scale;
    this.applyView();
    this.scheduleSave();

    if (card.type === 'pdf' && opts.page && opts.page !== card.page) {
      card.page = opts.page;
      this.pdfRendered.delete(card.id);
      this.renderPdfCard(card, true);
    } else {
      this.schedulePdfRefresh();
    }

    if (opts.selectArrowId) this.selectArrow(opts.selectArrowId);
    else this.select(card.id);

    const node = this.cardEls.get(card.id);
    if (node) {
      node.classList.remove('search-hit');
      void node.offsetWidth;
      node.classList.add('search-hit');
      setTimeout(() => node.classList.remove('search-hit'), 1500);
    }
  },

  openConnectionsPopover(card) {
    if (!card) return;
    if (this.popover === 'connections' && this.connCardId === card.id) {
      this.closePopover();
      return;
    }
    this.closeTimerSettings();
    this.closeInkSettings();
    this.popover = 'connections';
    this.connCardId = card.id;
    this.updateTopbar();

    const cardTitle = typeof wsCardDisplayTitle === 'function' ? wsCardDisplayTitle(card, this.board) : wsTr('ws.card.generic', null, 'Cartão');
    const info = typeof wsGetCardConnections === 'function'
      ? wsGetCardConnections(this.board, card.id)
      : { all: [], total: 0 };

    const existingPartnerIds = new Set(info.all.map(x => x.partnerId));
    const candidates = this.board.cards
      .filter(c => c.id !== card.id && !existingPartnerIds.has(c.id))
      .sort((a, b) => (a.type === 'group' ? 1 : 0) - (b.type === 'group' ? 1 : 0));

    const editLabel = wsTr('ws.connEdit', null, 'Editar ligação');
    const delLabel = wsTr('ws.connDel', null, 'Remover ligação');
    const connHtml = info.all.length
      ? info.all.map(c => {
        const dirSym = c.direction === 'both' ? '↔' : (c.direction === 'in' ? '←' : (c.direction === 'none' ? '—' : '→'));
        return '<div class="ws-conn-row">' +
          '<button type="button" class="ws-conn-jump" data-connjump="' + wsEscape(c.partnerId) + '">' +
            '<span class="ws-conn-dir">' + dirSym + '</span>' +
            '<div class="ws-conn-meta"><b>' + wsEscape(c.partnerTitle) + '</b><small>' + wsEscape(c.partnerTypeLabel) + ' · ' + wsEscape(c.kindLabel) + (c.label ? ' · ' + wsEscape(c.label) : '') + '</small></div>' +
          '</button>' +
          '<button type="button" class="ws-board-act" data-connedit="' + wsEscape(c.arrowId) + '" title="' + wsEscape(editLabel) + '">' + svgIcon('sliders') + '</button>' +
          '<button type="button" class="ws-board-act danger" data-conndel="' + wsEscape(c.arrowId) + '" title="' + wsEscape(delLabel) + '">' + svgIcon('trash') + '</button>' +
        '</div>';
      }).join('')
      : '<p class="ws-pop-note" style="margin-top:0">' + wsEscape(wsTr('ws.connNoneYet', null, 'Nenhuma ligação neste cartão ainda.')) + '</p>';

    const quickHtml = candidates.length
      ? '<div class="ws-pop-sub">' + wsEscape(wsTr('ws.connQuickSub', null, 'Ligar rapidamente a…')) + '</div>' +
        '<div class="ws-conn-quick">' +
        candidates.slice(0, 12).map(other => {
          const ot = typeof wsCardDisplayTitle === 'function' ? wsCardDisplayTitle(other, this.board) : wsTr('ws.card.generic', null, 'Cartão');
          const otype = typeof wsCardTypeLabel === 'function' ? wsCardTypeLabel(other.type) : other.type;
          return '<button type="button" class="ws-pop-chip ws-conn-add" data-connlink="' + wsEscape(other.id) + '">' +
            svgIcon('arrow') + '<span>' + wsEscape(ot) + '</span><small>' + wsEscape(otype) + '</small></button>';
        }).join('') +
        '</div>'
      : '';

    const html =
      '<div class="ws-popover ws-conn-pop">' +
        '<div class="ws-pop-head">' +
          '<p class="ws-pop-title">' + wsEscape(wsTr('ws.connPopTitle', { title: cardTitle }, 'Conexões · ' + cardTitle)) + '</p>' +
          '<span class="ws-pop-quota">' + info.total + '</span>' +
        '</div>' +
        '<div class="ws-conn-list">' + connHtml + '</div>' +
        '<div class="ws-pop-row" style="margin-top:10px">' +
          '<button type="button" class="ws-io-btn" style="flex:1" data-connclickmode>' + svgIcon('arrow') + '<span>' + wsEscape(wsTr('ws.connClickMode', null, 'Clicar no destino no quadro')) + '</span></button>' +
        '</div>' +
        quickHtml +
      '</div>';

    this.els.popovers.innerHTML = html;
    const pop = this.els.popovers.firstChild;
    pop.addEventListener('pointerdown', (e) => e.stopPropagation());
    pop.addEventListener('click', (e) => {
      const jump = e.target.closest('[data-connjump]');
      if (jump) {
        const pid = jump.dataset.connjump;
        this.closePopover();
        this.focusCard(pid);
        return;
      }
      const editA = e.target.closest('[data-connedit]');
      if (editA) {
        const aid = editA.dataset.connedit;
        this.closePopover();
        this.selectArrow(aid);
        return;
      }
      const delA = e.target.closest('[data-conndel]');
      if (delA) {
        this.removeArrow(delA.dataset.conndel);
        this.openConnectionsPopover(card);
        return;
      }
      const linkTo = e.target.closest('[data-connlink]');
      if (linkTo) {
        this.makeArrow(card.id, linkTo.dataset.connlink);
        this.openConnectionsPopover(card);
        return;
      }
      if (e.target.closest('[data-connclickmode]')) {
        this.closePopover();
        this.beginLink(card.id);
      }
    });
  },

  /* -------- cartões -------- */
  renderAll() {
    this.els.world.querySelectorAll('.ws-card').forEach(n => n.remove());
    this.cardEls.clear();
    this.board.cards.forEach(card => this.createCardEl(card));
    this.renderArrows();
    this.updateEmpty();
  },

  cardButton(icon, title, cls) {
    const b = el('button', 'ws-card-btn' + (cls ? ' ' + cls : ''));
    b.type = 'button';
    b.title = title;
    b.setAttribute('aria-label', title);
    b.innerHTML = svgIcon(icon);
    return b;
  },

  applyCardTint(node, tintId) {
    if (!node) return;
    const list = typeof WS_CARD_TINTS !== 'undefined' ? WS_CARD_TINTS : [];
    const found = list.find(t => t.id === tintId);
    if (found && found.color) {
      node.style.setProperty('--ws-card-tint', found.color);
      node.dataset.tint = found.id;
    } else {
      node.style.removeProperty('--ws-card-tint');
      delete node.dataset.tint;
    }
    if (node.dataset && node.dataset.id && this.board) {
      this.updateArrowsFor(node.dataset.id);
    }
  },

  refreshCardConnectionBadges() {
    this.board.cards.forEach((c) => {
      const node = this.cardEls.get(c.id);
      if (!node) return;
      const btn = node.querySelector('[data-card-conns]');
      if (!btn) return;
      const n = this.board.arrows.filter(a => a.from === c.id || a.to === c.id).length;
      const sp = btn.querySelector('span');
      if (sp) sp.textContent = n > 0 ? String(n) : '';
      btn.classList.toggle('has-links', n > 0);
      btn.title = n > 0
        ? (n === 1 ? wsTr('ws.connOne', null, '1 conexão · ver ou ligar') : wsTr('ws.connMany', { n }, n + ' conexões · ver ou ligar'))
        : wsTr('ws.connNone', null, 'Ver conexões ou ligar a outro cartão');
    });
  },

  createCardEl(card) {
    const node = el('article', 'ws-card ws-' + card.type);
    node.dataset.id = card.id;
    node.style.transform = 'translate(' + card.x + 'px,' + card.y + 'px)';
    node.style.width = card.w + 'px';
    node.style.height = card.h + 'px';
    node.style.setProperty('--ws-card-h', card.h + 'px');
    this.applyCardTint(node, card.accent || '');

    const head = el('header', 'ws-card-head');
    const grip = el('span', 'ws-card-grip', svgIcon('grip'));
    grip.title = wsTr('ws.gripTitle', null, 'Arraste por aqui para mover');
    grip.setAttribute('aria-label', wsTr('ws.gripAria', null, 'Arraste para mover'));
    head.append(grip);

    const connCount = this.board.arrows.filter(a => a.from === card.id || a.to === card.id).length;
    const makeConnsBtn = () => {
      const b = el('button', 'ws-card-conn' + (connCount > 0 ? ' has-links' : ''));
      b.type = 'button';
      b.dataset.cardConns = card.id;
      b.title = connCount > 0
        ? (connCount === 1 ? wsTr('ws.connOne', null, '1 conexão · ver ou ligar') : wsTr('ws.connMany', { n: connCount }, connCount + ' conexões · ver ou ligar'))
        : wsTr('ws.connNone', null, 'Ver conexões ou ligar a outro cartão');
      b.innerHTML = svgIcon('link') + '<span>' + (connCount > 0 ? String(connCount) : '') + '</span>';
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openConnectionsPopover(card);
      });
      return b;
    };

    if (card.type === 'note') {
      const title = el('span', 'ws-card-title', wsTr('ws.card.note', null, 'Nota'));
      head.append(title);
      if (card.source) {
        const src = el('button', 'ws-card-src');
        src.type = 'button';
        src.title = wsTr('ws.noteSourceTitle', null, 'Abrir o PDF de origem');
        src.innerHTML = svgIcon('file') + '<span>p.' + card.source.page + '</span>';
        src.addEventListener('click', (e) => {
          e.stopPropagation();
          this.revealSource(card);
        });
        head.append(src);
      }
      const editBtn = this.cardButton('pencil', wsTr('ws.noteEditTitle', null, 'Opções de formatação e cor da nota'), card.editMode ? 'active' : '');
      editBtn.dataset.noteact = 'edit';
      editBtn.setAttribute('aria-pressed', card.editMode ? 'true' : 'false');

      const conns = makeConnsBtn();
      const link = this.cardButton('arrow', wsTr('ws.linkCardTitle', null, 'Ligar a outro cartão'));
      link.addEventListener('click', (e) => {
        e.stopPropagation();
        this.beginLink(card.id);
      });
      const del = this.cardButton('close', wsTr('ws.removeCardTitle', null, 'Remover cartão'), 'danger');
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        this.requestRemoveCard(card);
      });
      head.append(editBtn, conns, link, del);

      const editBar = el('div', 'ws-note-editbar');
      editBar.hidden = !card.editMode;

      const fonts = typeof WS_NOTE_FONTS !== 'undefined' ? WS_NOTE_FONTS : [{ id: 'inter', label: 'Inter' }];
      const sizes = typeof WS_NOTE_SIZES !== 'undefined' ? WS_NOTE_SIZES : [12, 14, 16, 18, 22];
      const tints = typeof WS_CARD_TINTS !== 'undefined' ? WS_CARD_TINTS : [{ id: '', label: 'Padrão', color: '' }];

      const fmtGroup = el('div', 'ws-note-tgroup');
      [
        { cmd: 'bold', label: 'B', cls: '', title: wsTr('ws.noteBold', null, 'Negrito (Ctrl+B)') },
        { cmd: 'italic', label: 'I', cls: 'is-italic', title: wsTr('ws.noteItalic', null, 'Itálico (Ctrl+I)') },
        { cmd: 'underline', label: 'S', cls: 'is-under', title: wsTr('ws.noteUnderline', null, 'Sublinhado (Ctrl+U)') },
        { cmd: 'strikeThrough', label: 'T', cls: 'is-strike', title: wsTr('ws.noteStrike', null, 'Cortado / Tachado') }
      ].forEach(it => {
        const b = el('button', 'ws-note-tool' + (it.cls ? ' ' + it.cls : ''), it.label);
        b.type = 'button';
        b.dataset.notecmd = it.cmd;
        b.title = it.title;
        b.setAttribute('aria-label', it.title);
        fmtGroup.append(b);
      });

      const alignGroup = el('div', 'ws-note-tgroup');
      [
        { id: 'left', icon: 'alignL', title: wsTr('ws.noteAlignL', null, 'Alinhar à esquerda') },
        { id: 'center', icon: 'alignC', title: wsTr('ws.noteAlignC', null, 'Centralizar texto') },
        { id: 'right', icon: 'alignR', title: wsTr('ws.noteAlignR', null, 'Alinhar à direita') },
        { id: 'justify', icon: 'alignJ', title: wsTr('ws.noteAlignJ', null, 'Justificar texto') }
      ].forEach(it => {
        const b = el('button', 'ws-note-tool');
        b.type = 'button';
        b.dataset.notealign = it.id;
        b.title = it.title;
        b.setAttribute('aria-label', it.title);
        b.innerHTML = svgIcon(it.icon);
        alignGroup.append(b);
      });

      const fontSel = el('select', 'ws-note-select');
      fontSel.dataset.notefont = '1';
      fontSel.title = wsTr('ws.noteFontTitle', null, 'Fonte da nota');
      fontSel.setAttribute('aria-label', fontSel.title);
      fonts.forEach(f => {
        const opt = el('option', '', f.label);
        opt.value = f.id;
        fontSel.append(opt);
      });
      fontSel.value = card.font || 'inter';

      const sizeSel = el('select', 'ws-note-select');
      sizeSel.dataset.notesize = '1';
      sizeSel.title = wsTr('ws.noteSizeTitle', null, 'Tamanho do texto');
      sizeSel.setAttribute('aria-label', sizeSel.title);
      sizes.forEach(sz => {
        const opt = el('option', '', sz + 'px');
        opt.value = String(sz);
        sizeSel.append(opt);
      });
      if (!sizes.includes(Number(card.fontSize))) {
        const customOpt = el('option', '', (card.fontSize || 14) + 'px');
        customOpt.value = String(card.fontSize || 14);
        sizeSel.append(customOpt);
      }
      sizeSel.value = String(card.fontSize || 14);

      const listGroup = el('div', 'ws-note-tgroup');
      [
        { id: 'disc', label: '•', title: wsTr('ws.noteListDisc', null, 'Tópicos com marcador (•)') },
        { id: 'dash', label: '—', title: wsTr('ws.noteListDash', null, 'Tópicos com travessão (—)') },
        { id: 'arrow', label: '▸', title: wsTr('ws.noteListArrow', null, 'Tópicos com seta (▸)') },
        { id: 'decimal', label: '1.', title: wsTr('ws.noteListNum', null, 'Lista numerada') }
      ].forEach(it => {
        const b = el('button', 'ws-note-tool', it.label);
        b.type = 'button';
        b.dataset.notelist = it.id;
        b.title = it.title;
        b.setAttribute('aria-label', it.title);
        listGroup.append(b);
      });

      const mathBtn = el('button', 'ws-note-tool', '∑');
      mathBtn.type = 'button';
      mathBtn.dataset.notemath = '1';
      mathBtn.title = wsTr('ws.mathInsertTitle', null, 'Inserir fórmula LaTeX ($...$ ou $$...$$)');
      mathBtn.setAttribute('aria-label', mathBtn.title);

      const colorBox = el('div', 'ws-pdf-hlcolors');
      tints.forEach(t => {
        const dot = el('button', 'ws-pdf-hldot' + ((card.accent || '') === t.id ? ' active' : ''));
        dot.type = 'button';
        dot.dataset.notetint = t.id;
        const cName = wsColorLabel(t);
        dot.title = wsTr('ws.noteColorLabel', { label: cName }, 'Cor ' + cName);
        dot.setAttribute('aria-label', dot.title);
        if (t.color) dot.style.background = t.color;
        else {
          dot.style.background = 'var(--surface-2)';
          dot.style.boxShadow = 'inset 0 0 0 1px var(--text-faint)';
        }
        colorBox.append(dot);
      });

      editBar.append(
        fmtGroup,
        el('span', 'ws-note-sep'),
        alignGroup,
        el('span', 'ws-note-sep'),
        fontSel,
        sizeSel,
        el('span', 'ws-note-sep'),
        listGroup,
        el('span', 'ws-note-sep'),
        mathBtn,
        el('span', 'ws-note-sep'),
        colorBox
      );

      const buildFormulaBox = () => {
        const box = el('div', 'ws-formula-box');
        box.hidden = true;
        box.innerHTML =
          '<div class="ws-formula-head">' +
            '<span class="ws-formula-label">' + wsEscape(wsTr('ws.mathBoxLabel', null, 'Fórmula')) + '</span>' +
            '<div class="ws-formula-acts">' +
              '<button type="button" class="ws-formula-btn active" data-fmode="0" title="Inline ($...$)">$</button>' +
              '<button type="button" class="ws-formula-btn" data-fmode="1" title="Bloco ($$...$$)">$$</button>' +
              '<button type="button" class="ws-formula-btn danger" data-fdel title="' + wsEscape(wsTr('ws.mathRemoveBtn', null, 'Remover fórmula')) + '">' + svgIcon('trash') + '</button>' +
              '<button type="button" class="ws-formula-btn primary" data-fdone title="' + wsEscape(wsTr('ws.mathDoneBtn', null, 'Concluir')) + '">' + svgIcon('check') + '<span>' + wsEscape(wsTr('ws.mathDoneBtn', null, 'Concluir')) + '</span></button>' +
            '</div>' +
          '</div>' +
          '<textarea class="ws-formula-input" rows="2" spellcheck="false" placeholder="' + wsEscape(wsTr('ws.mathInputPh', null, 'Digite LaTeX ao vivo, ex.: \\frac{a}{b}')) + '"></textarea>' +
          '<div class="ws-formula-warn" hidden><span class="ws-formula-warn-dot"></span><span class="ws-formula-warn-txt"></span></div>';
        box.addEventListener('pointerdown', (e) => e.stopPropagation());
        box.addEventListener('click', (e) => e.stopPropagation());
        return {
          box,
          inp: box.querySelector('.ws-formula-input'),
          warn: box.querySelector('.ws-formula-warn'),
          warnTxt: box.querySelector('.ws-formula-warn-txt'),
          modeBtns: Array.from(box.querySelectorAll('[data-fmode]')),
          delBtn: box.querySelector('[data-fdel]'),
          doneBtn: box.querySelector('[data-fdone]')
        };
      };

      const formatFormulaErr = (res) => {
        if (!res || res.valid || res.isEmpty) return '';
        const msg = wsTr('ws.mathErr.' + (res.code || 'braces'), { cmd: res.detail || '' }, res.reason || '');
        if (res.usedFallback) {
          return wsTr('ws.mathErrPrefix', null, 'Mantendo último resultado válido:') + ' ' + msg;
        }
        return msg;
      };

      const stage = el('div', 'ws-note-stage');
      const textPane = el('div', 'ws-note-text-pane');
      const body = el('div', 'ws-note-body');
      body.contentEditable = 'true';
      body.spellcheck = false;
      body.dataset.placeholder = wsTr('ws.notePlaceholder', null, 'Escreva algo…');
      const mathView = el('div', 'ws-note-math-view');
      mathView.hidden = true;
      mathView.title = wsTr('ws.mathPreviewHint', null, 'Clique numa fórmula para editar ou no texto para escrever');
      textPane.append(body, mathView);
      const fUi = buildFormulaBox();
      stage.append(textPane, fUi.box);

      const syncFormulaSide = () => {
        const w = Number(card.w) || 280;
        stage.classList.toggle('formula-side', !fUi.box.hidden && w >= 430);
      };
      node._syncFormulaLayout = syncFormulaSide;

      const applyNoteTypography = () => {
        const fam = typeof wsNoteFontFamily === 'function' ? wsNoteFontFamily(card.font) : 'var(--font-ui)';
        body.style.setProperty('--ws-note-font', fam);
        body.style.setProperty('--ws-note-size', (card.fontSize || 14) + 'px');
        body.style.setProperty('--ws-note-align', card.align || 'left');
        mathView.style.setProperty('--ws-note-font', fam);
        mathView.style.setProperty('--ws-note-size', (card.fontSize || 14) + 'px');
        mathView.style.setProperty('--ws-note-align', card.align || 'left');
        if (typeof Themes !== 'undefined' && Themes.ensureFonts && card.font) {
          Themes.ensureFonts([card.font]);
        }
      };
      applyNoteTypography();

      const initHtml = card.html || (card.text && typeof wsPlainTextToNoteHtml === 'function' ? wsPlainTextToNoteHtml(card.text) : '');
      body.innerHTML = typeof wsSanitizeNoteHtml === 'function' ? wsSanitizeNoteHtml(initHtml) : initHtml;

      const renderSlotVisual = (slot, tex, displayMode, updateFallbackOnlyOnValid) => {
        if (!slot) return { valid: true, isEmpty: false };
        const clean = String(tex == null ? '' : tex);
        const safe = typeof wsRenderTexSafe === 'function'
          ? wsRenderTexSafe(clean, !!displayMode, slot._lastValidHtml || '')
          : { valid: true, isEmpty: !clean.trim(), html: wsEscape(clean), usedFallback: false };
        slot.dataset.tex = clean;
        slot.dataset.display = displayMode ? '1' : '0';
        slot.contentEditable = 'false';
        slot.title = wsTr('ws.mathSlotClickHint', null, 'Clique para editar esta fórmula');
        if (safe.valid) {
          slot._lastValidHtml = safe.html;
          slot.innerHTML = safe.html;
          slot.classList.remove('has-fallback');
        } else if (safe.isEmpty) {
          if (!updateFallbackOnlyOnValid) slot._lastValidHtml = '';
          slot.innerHTML = '<span class="ws-math-slot-ph">∑</span>';
          slot.classList.remove('has-fallback');
        } else {
          if (safe.usedFallback && safe.html) {
            slot.innerHTML = safe.html;
          } else {
            slot.innerHTML = '<span class="ws-math-slot-ph">' + wsEscape(clean) + '</span>';
          }
          slot.classList.add('has-fallback');
        }
        return safe;
      };

      const hydrateNoteMathSlots = () => {
        body.querySelectorAll('.ws-math-slot').forEach(slot => {
          const tex = slot.dataset.tex || '';
          const disp = slot.dataset.display === '1';
          renderSlotVisual(slot, tex, disp, false);
        });
      };
      hydrateNoteMathSlots();

      const syncNoteEmpty = () => {
        const plain = (body.innerText || '').replace(/\u00a0/g, ' ').replace(/\n/g, '').trim();
        const hasList = !!body.querySelector('ul, ol');
        const hasSlot = !!body.querySelector('.ws-math-slot');
        body.dataset.empty = (!plain && !hasList && !hasSlot) ? 'true' : 'false';
      };
      syncNoteEmpty();

      const commitNoteContent = () => {
        const sanitized = typeof wsSanitizeNoteHtml === 'function' ? wsSanitizeNoteHtml(body.innerHTML) : body.innerHTML;
        card.html = sanitized;
        card.text = typeof wsNoteHtmlToPlainText === 'function'
          ? wsNoteHtmlToPlainText(sanitized)
          : (body.innerText || '');
        syncNoteEmpty();
        this.scheduleSave();
      };

      let activeSlot = null;
      let activeDisplayMode = false;

      const syncFormulaModeBtns = () => {
        fUi.modeBtns.forEach(b => b.classList.toggle('active', (b.dataset.fmode === '1') === activeDisplayMode));
      };

      const applyActiveFormulaUpdate = (fromUserInput) => {
        if (!activeSlot || !body.contains(activeSlot)) return;
        const val = fUi.inp.value;
        const res = renderSlotVisual(activeSlot, val, activeDisplayMode, true);
        if (!res.valid && !res.isEmpty) {
          fUi.warn.hidden = false;
          fUi.warnTxt.textContent = formatFormulaErr(res);
        } else {
          fUi.warn.hidden = true;
          fUi.warnTxt.textContent = '';
        }
        if (fromUserInput) commitNoteContent();
        requestAnimationFrame(() => this.updateArrowsFor(card.id));
      };

      const closeFormulaBox = (opts) => {
        opts = opts || {};
        if (activeSlot) {
          activeSlot.classList.remove('is-editing');
          if (!String(activeSlot.dataset.tex || '').trim() || opts.remove) {
            activeSlot.remove();
          }
          activeSlot = null;
        }
        fUi.box.hidden = true;
        fUi.warn.hidden = true;
        stage.classList.remove('formula-side');
        node.classList.remove('formula-open');
        commitNoteContent();
        requestAnimationFrame(() => this.updateArrowsFor(card.id));
        if (opts.focusBody) {
          body.focus();
        } else if (opts.previewIfBlurred && document.activeElement !== body) {
          renderNoteMathPreview();
        }
      };

      const openFormulaForSlot = (slot, selectText) => {
        if (!slot) return;
        if (activeSlot && activeSlot !== slot) {
          activeSlot.classList.remove('is-editing');
          if (!String(activeSlot.dataset.tex || '').trim()) activeSlot.remove();
        }
        mathView.hidden = true;
        stage.classList.remove('showing-math');
        activeSlot = slot;
        activeDisplayMode = slot.dataset.display === '1';
        slot.classList.add('is-editing');
        fUi.inp.value = slot.dataset.tex || '';
        syncFormulaModeBtns();
        fUi.box.hidden = false;
        node.classList.add('formula-open');
        syncFormulaSide();
        applyActiveFormulaUpdate(false);
        setTimeout(() => {
          fUi.inp.focus();
          if (selectText) fUi.inp.select();
        }, 0);
      };

      const promoteRawMathToSlots = () => {
        if (body.querySelector('.ws-math-slot')) return;
        const rawHtml = card.html || body.innerHTML || '';
        if (typeof wsRenderNoteDisplayHtml !== 'function' || typeof wsHasMathDelimiters !== 'function' || !wsHasMathDelimiters(card.text || '')) return;
        const withMath = wsRenderNoteDisplayHtml(rawHtml);
        const tmp = document.createElement('div');
        tmp.innerHTML = withMath;
        const nodes = tmp.querySelectorAll('.ws-math-inline[data-tex], .ws-math-display[data-tex]');
        if (!nodes.length) return;
        nodes.forEach(elMath => {
          const slot = document.createElement('span');
          slot.className = 'ws-math-slot';
          slot.contentEditable = 'false';
          slot.dataset.tex = elMath.getAttribute('data-tex') || '';
          slot.dataset.display = elMath.getAttribute('data-display') === '1' ? '1' : '0';
          elMath.replaceWith(slot);
        });
        body.innerHTML = tmp.innerHTML;
        hydrateNoteMathSlots();
        commitNoteContent();
      };

      const insertNewFormulaSlot = () => {
        mathView.hidden = true;
        stage.classList.remove('showing-math');
        ensureBodyFocusCaret();
        const sel = window.getSelection();
        const selected = sel ? sel.toString().trim() : '';
        const initialTex = selected || '\\frac{a}{b}';
        const slot = document.createElement('span');
        slot.className = 'ws-math-slot';
        slot.contentEditable = 'false';
        slot.dataset.tex = initialTex;
        slot.dataset.display = '0';
        renderSlotVisual(slot, initialTex, false, false);
        const spaceAfter = document.createTextNode(' ');
        if (sel && sel.rangeCount && body.contains(sel.anchorNode)) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(spaceAfter);
          range.insertNode(slot);
          range.setStartAfter(spaceAfter);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        } else {
          body.append(slot, spaceAfter);
        }
        commitNoteContent();
        openFormulaForSlot(slot, !selected);
      };

      fUi.inp.addEventListener('input', () => applyActiveFormulaUpdate(true));
      fUi.inp.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Escape') {
          e.preventDefault();
          closeFormulaBox({ focusBody: false, previewIfBlurred: true });
          return;
        }
        if (e.key === 'Enter' && (!activeDisplayMode || e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          closeFormulaBox({ focusBody: true });
        }
      });
      fUi.modeBtns.forEach(b => {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          activeDisplayMode = b.dataset.fmode === '1';
          syncFormulaModeBtns();
          applyActiveFormulaUpdate(true);
          fUi.inp.focus();
        });
      });
      fUi.doneBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeFormulaBox({ focusBody: true });
      });
      fUi.delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeFormulaBox({ remove: true, focusBody: true });
      });

      const findSelectionList = () => {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return null;
        let cur = sel.anchorNode;
        while (cur && cur !== body) {
          if (cur.nodeType === 1 && (cur.tagName === 'UL' || cur.tagName === 'OL')) return cur;
          cur = cur.parentNode;
        }
        return null;
      };

      const findSelectionAlign = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount && body.contains(sel.anchorNode)) {
          let cur = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentNode;
          while (cur && cur !== body) {
            if (cur.nodeType === 1 && cur.style && cur.style.textAlign) {
              const a = cur.style.textAlign.toLowerCase();
              if (['left', 'center', 'right', 'justify'].includes(a)) return a;
            }
            cur = cur.parentNode;
          }
        }
        return card.align || 'left';
      };

      const ensureBodyFocusCaret = () => {
        const sel = window.getSelection();
        if (document.activeElement === body && sel && sel.rangeCount && body.contains(sel.anchorNode)) return;
        body.focus();
        const range = document.createRange();
        range.selectNodeContents(body);
        range.collapse(false);
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
        }
      };

      const syncToolbar = () => {
        const inFocus = document.activeElement === body;
        editBar.querySelectorAll('[data-notecmd]').forEach(btn => {
          let active = false;
          if (inFocus) {
            try { active = !!document.queryCommandState(btn.dataset.notecmd); } catch (err) { active = false; }
          }
          btn.classList.toggle('active', active);
          btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        const activeAlign = findSelectionAlign();
        editBar.querySelectorAll('[data-notealign]').forEach(btn => {
          const active = btn.dataset.notealign === activeAlign;
          btn.classList.toggle('active', active);
          btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        const curList = inFocus ? findSelectionList() : null;
        const activeList = curList
          ? (curList.tagName === 'OL' ? 'decimal' : (curList.dataset.bullet || 'disc'))
          : '';
        editBar.querySelectorAll('[data-notelist]').forEach(btn => {
          const active = btn.dataset.notelist === activeList;
          btn.classList.toggle('active', active);
          btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        editBar.querySelectorAll('[data-notetint]').forEach(dot => {
          dot.classList.toggle('active', (dot.dataset.notetint || '') === (card.accent || ''));
        });
        if (fontSel.value !== (card.font || 'inter')) fontSel.value = card.font || 'inter';
        if (sizeSel.value !== String(card.fontSize || 14)) sizeSel.value = String(card.fontSize || 14);
      };
      body._syncToolbar = syncToolbar;

      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        card.editMode = !card.editMode;
        editBar.hidden = !card.editMode;
        editBtn.classList.toggle('active', card.editMode);
        editBtn.setAttribute('aria-pressed', card.editMode ? 'true' : 'false');
        if (card.editMode) syncToolbar();
        this.scheduleSave();
      });

      editBar.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (!e.target.closest('select')) e.preventDefault();
      });

      editBar.addEventListener('click', (e) => {
        e.stopPropagation();
        const cmdBtn = e.target.closest('[data-notecmd]');
        if (cmdBtn) {
          ensureBodyFocusCaret();
          try { document.execCommand(cmdBtn.dataset.notecmd, false, null); } catch (err) { /* ignora */ }
          commitNoteContent();
          syncToolbar();
          return;
        }
        const alignBtn = e.target.closest('[data-notealign]');
        if (alignBtn) {
          const nextAlign = typeof wsNormalizeNoteAlign === 'function'
            ? wsNormalizeNoteAlign(alignBtn.dataset.notealign)
            : alignBtn.dataset.notealign;
          const sel = window.getSelection();
          const blocks = Array.from(body.children).filter(ch => /^(DIV|P|UL|OL)$/i.test(ch.tagName));
          const hasFocusRange = document.activeElement === body && sel && sel.rangeCount && body.contains(sel.anchorNode);
          if (hasFocusRange && blocks.length > 1 && !sel.isCollapsed) {
            const cmdMap = { left: 'justifyLeft', center: 'justifyCenter', right: 'justifyRight', justify: 'justifyFull' };
            try { document.execCommand(cmdMap[nextAlign] || 'justifyLeft', false, null); } catch (err) { /* ignora */ }
          } else {
            card.align = nextAlign;
            body.querySelectorAll('[style*="text-align"]').forEach(elBlock => {
              elBlock.style.textAlign = '';
              if (!elBlock.getAttribute('style')) elBlock.removeAttribute('style');
            });
            applyNoteTypography();
          }
          commitNoteContent();
          syncToolbar();
          return;
        }
        const listBtn = e.target.closest('[data-notelist]');
        if (listBtn) {
          const kind = listBtn.dataset.notelist;
          ensureBodyFocusCaret();
          if (kind === 'decimal') {
            try { document.execCommand('insertOrderedList', false, null); } catch (err) { /* ignora */ }
          } else {
            const curList = findSelectionList();
            if (curList && curList.tagName === 'UL') {
              const curBullet = curList.dataset.bullet || 'disc';
              if (curBullet === kind) {
                try { document.execCommand('insertUnorderedList', false, null); } catch (err) { /* ignora */ }
              } else {
                curList.dataset.bullet = kind;
              }
            } else {
              try { document.execCommand('insertUnorderedList', false, null); } catch (err) { /* ignora */ }
              const nextList = findSelectionList();
              if (nextList && nextList.tagName === 'UL') {
                nextList.dataset.bullet = kind;
              } else {
                body.querySelectorAll('ul:not([data-bullet])').forEach(ul => { ul.dataset.bullet = kind; });
              }
            }
          }
          commitNoteContent();
          syncToolbar();
          return;
        }
        const mathBtn = e.target.closest('[data-notemath]');
        if (mathBtn) {
          insertNewFormulaSlot();
          return;
        }
        const tintDot = e.target.closest('[data-notetint]');
        if (tintDot) {
          card.accent = tintDot.dataset.notetint || '';
          this.applyCardTint(node, card.accent);
          syncToolbar();
          this.scheduleSave();
        }
      });

      const renderNoteMathPreview = () => {
        if (!fUi.box.hidden) {
          mathView.hidden = true;
          stage.classList.remove('showing-math');
          return;
        }
        const plain = card.text || '';
        const hasRawOrSlot = typeof wsHasMathDelimiters === 'function' && wsHasMathDelimiters(plain);
        if (hasRawOrSlot && document.activeElement !== body && !body.querySelector('.ws-math-slot')) {
          const sanitized = card.html || (typeof wsPlainTextToNoteHtml === 'function' ? wsPlainTextToNoteHtml(plain) : '');
          const curScroll = body.scrollTop;
          mathView.innerHTML = typeof wsRenderNoteDisplayHtml === 'function'
            ? wsRenderNoteDisplayHtml(sanitized)
            : sanitized;
          mathView.hidden = false;
          stage.classList.add('showing-math');
          mathView.scrollTop = curScroll;
        } else {
          mathView.hidden = true;
          stage.classList.remove('showing-math');
        }
      };

      fontSel.addEventListener('change', () => {
        card.font = typeof wsNormalizeNoteFont === 'function' ? wsNormalizeNoteFont(fontSel.value) : fontSel.value;
        applyNoteTypography();
        renderNoteMathPreview();
        this.scheduleSave();
      });
      sizeSel.addEventListener('change', () => {
        card.fontSize = typeof wsNormalizeNoteSize === 'function' ? wsNormalizeNoteSize(sizeSel.value) : Number(sizeSel.value);
        applyNoteTypography();
        renderNoteMathPreview();
        this.scheduleSave();
      });

      mathView.addEventListener('click', (e) => {
        e.stopPropagation();
        const mathEl = e.target.closest('.ws-math-inline[data-tex], .ws-math-display[data-tex]');
        if (mathEl) {
          const allMath = Array.from(mathView.querySelectorAll('.ws-math-inline[data-tex], .ws-math-display[data-tex]'));
          const idx = allMath.indexOf(mathEl);
          promoteRawMathToSlots();
          const slots = Array.from(body.querySelectorAll('.ws-math-slot'));
          if (idx >= 0 && slots[idx]) {
            openFormulaForSlot(slots[idx], false);
            return;
          }
        }
        const curScroll = mathView.scrollTop;
        mathView.hidden = true;
        stage.classList.remove('showing-math');
        body.focus();
        body.scrollTop = curScroll;
        syncToolbar();
      });
      body.addEventListener('click', (e) => {
        const slot = e.target.closest('.ws-math-slot');
        if (slot) {
          e.preventDefault();
          e.stopPropagation();
          openFormulaForSlot(slot, false);
        }
      });
      body.addEventListener('input', () => {
        commitNoteContent();
        syncToolbar();
      });
      body.addEventListener('focus', () => {
        mathView.hidden = true;
        stage.classList.remove('showing-math');
        syncToolbar();
      });
      body.addEventListener('blur', () => {
        setTimeout(() => {
          if (!fUi.box.hidden && fUi.box.contains(document.activeElement)) return;
          commitNoteContent();
          renderNoteMathPreview();
        }, 0);
      });
      body.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          body.blur();
        }
      });
      body.addEventListener('keyup', () => syncToolbar());
      body.addEventListener('mouseup', () => syncToolbar());
      body.addEventListener('paste', (e) => {
        const cd = e.clipboardData;
        if (!cd) return;
        const text = cd.getData('text/plain');
        if (typeof text !== 'string') return;
        e.preventDefault();
        e.stopPropagation();
        try {
          if (!document.execCommand('insertText', false, text)) {
            const sel = window.getSelection();
            if (sel && sel.rangeCount) {
              sel.deleteFromDocument();
              sel.getRangeAt(0).insertNode(document.createTextNode(text));
              sel.collapseToEnd();
            }
          }
        } catch (err) { /* ignora */ }
        commitNoteContent();
        syncToolbar();
      });
      body.addEventListener('wheel', (e) => {
        if (!this.entered) return;
        if (e.ctrlKey || e.metaKey) return;
        if (typeof wsShouldWheelScrollNote === 'function'
            ? wsShouldWheelScrollNote(body)
            : (body.scrollHeight > body.clientHeight + 2)) {
          e.stopPropagation();
        }
      }, { passive: true });
      mathView.addEventListener('wheel', (e) => {
        if (!this.entered) return;
        if (e.ctrlKey || e.metaKey) return;
        if (mathView.scrollHeight > mathView.clientHeight + 2) {
          e.stopPropagation();
        }
      }, { passive: true });
      node.addEventListener('wheel', (e) => {
        if (!this.entered) return;
        if (e.ctrlKey || e.metaKey) return;
        const scroller = stage.classList.contains('showing-math') ? mathView : body;
        const overflowing = typeof wsShouldWheelScrollNote === 'function'
          ? wsShouldWheelScrollNote(scroller)
          : (scroller.scrollHeight > scroller.clientHeight + 2);
        if (!overflowing) return;
        e.preventDefault();
        e.stopPropagation();
        scroller.scrollTop += (e.deltaY || 0);
      }, { passive: false });

      renderNoteMathPreview();
      const resize = el('div', 'ws-resize');
      resize.title = wsTr('ws.resize', null, 'Redimensionar');
      node.append(head, editBar, stage, resize);
      resize.addEventListener('pointerdown', (e) => this.startResize(e, card));
    } else if (card.type === 'concept') {
      const title = el('span', 'ws-card-title', wsTr('ws.card.concept', null, 'Conceito'));
      const tintBar = el('div', 'ws-card-tints');
      (typeof WS_CARD_TINTS !== 'undefined' ? WS_CARD_TINTS : []).forEach(t => {
        const dot = el('button', 'ws-tint-dot' + ((card.accent || '') === t.id ? ' active' : ''));
        dot.type = 'button';
        const cName = wsColorLabel(t);
        dot.title = wsTr('ws.noteColorLabel', { label: cName }, 'Cor ' + cName);
        dot.style.background = t.color || 'var(--border)';
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          card.accent = t.id;
          this.applyCardTint(node, card.accent);
          tintBar.querySelectorAll('.ws-tint-dot').forEach((d, idx) => d.classList.toggle('active', idx === WS_CARD_TINTS.indexOf(t)));
          this.scheduleSave();
        });
        tintBar.append(dot);
      });
      const mathBtn = el('button', 'ws-card-btn', '∑');
      mathBtn.type = 'button';
      mathBtn.dataset.conceptmath = '1';
      mathBtn.title = wsTr('ws.mathInsertTitle', null, 'Inserir fórmula LaTeX');
      mathBtn.setAttribute('aria-label', mathBtn.title);
      const conns = makeConnsBtn();
      const link = this.cardButton('arrow', wsTr('ws.linkCardTitle', null, 'Ligar a outro cartão'));
      link.addEventListener('click', (e) => { e.stopPropagation(); this.beginLink(card.id); });
      const del = this.cardButton('close', wsTr('ws.conceptRemoveTitle', null, 'Remover conceito'), 'danger');
      del.addEventListener('click', (e) => { e.stopPropagation(); this.requestRemoveCard(card); });
      head.append(title, tintBar, mathBtn, conns, link, del);

      const wrap = el('div', 'ws-concept-wrap');
      const nameInp = el('input', 'ws-concept-title');
      nameInp.type = 'text';
      nameInp.placeholder = wsTr('ws.conceptTitlePh', null, 'Título do conceito…');
      nameInp.value = card.title || '';
      nameInp.maxLength = 120;
      nameInp.addEventListener('input', () => {
        card.title = nameInp.value;
        this.scheduleSave();
      });

      const tagsRow = el('div', 'ws-concept-tags-row');
      const tagsInp = el('input', 'ws-concept-tags-inp');
      tagsInp.type = 'text';
      tagsInp.placeholder = wsTr('ws.conceptTagsPh', null, 'Adicione #tags…');
      tagsInp.setAttribute('aria-label', wsTr('ws.conceptTagsAria', null, 'Tags do conceito'));
      const formatTagsInput = () => {
        const line = typeof wsFormatTagsLine === 'function' ? wsFormatTagsLine(card.tags) : '';
        tagsInp.value = line;
        tagsInp.classList.toggle('has-tags', !!line);
      };
      formatTagsInput();
      tagsInp.addEventListener('focus', () => {
        if (Array.isArray(card.tags) && card.tags.length) {
          tagsInp.value = card.tags.map(t => '#' + t).join(' ');
        }
      });
      tagsInp.addEventListener('input', () => {
        card.tags = typeof wsNormalizeTags === 'function' ? wsNormalizeTags(tagsInp.value) : [];
        tagsInp.classList.toggle('has-tags', card.tags.length > 0);
        this.scheduleSave();
      });
      tagsInp.addEventListener('blur', () => {
        formatTagsInput();
      });
      tagsInp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); tagsInp.blur(); }
      });
      tagsRow.append(tagsInp);

      const stage = el('div', 'ws-note-stage');
      const textPane = el('div', 'ws-note-text-pane');
      const body = el('textarea', 'ws-note-body');
      body.placeholder = wsTr('ws.conceptBodyPh', null, 'Síntese, exemplo ou pergunta de revisão…');
      body.value = card.text || '';
      body.spellcheck = false;
      const mathView = el('div', 'ws-note-math-view');
      mathView.hidden = true;
      mathView.title = wsTr('ws.mathPreviewHint', null, 'Clique numa fórmula para editar ou no texto para escrever');
      textPane.append(body, mathView);

      const fBox = el('div', 'ws-formula-box');
      fBox.hidden = true;
      fBox.innerHTML =
        '<div class="ws-formula-head">' +
          '<span class="ws-formula-label">' + wsEscape(wsTr('ws.mathBoxLabel', null, 'Fórmula')) + '</span>' +
          '<div class="ws-formula-acts">' +
            '<button type="button" class="ws-formula-btn active" data-fmode="0" title="Inline ($...$)">$</button>' +
            '<button type="button" class="ws-formula-btn" data-fmode="1" title="Bloco ($$...$$)">$$</button>' +
            '<button type="button" class="ws-formula-btn danger" data-fdel title="' + wsEscape(wsTr('ws.mathRemoveBtn', null, 'Remover fórmula')) + '">' + svgIcon('trash') + '</button>' +
            '<button type="button" class="ws-formula-btn primary" data-fdone title="' + wsEscape(wsTr('ws.mathDoneBtn', null, 'Concluir')) + '">' + svgIcon('check') + '<span>' + wsEscape(wsTr('ws.mathDoneBtn', null, 'Concluir')) + '</span></button>' +
          '</div>' +
        '</div>' +
        '<textarea class="ws-formula-input" rows="2" spellcheck="false" placeholder="' + wsEscape(wsTr('ws.mathInputPh', null, 'Digite LaTeX ao vivo, ex.: \\frac{a}{b}')) + '"></textarea>' +
        '<div class="ws-formula-warn" hidden><span class="ws-formula-warn-dot"></span><span class="ws-formula-warn-txt"></span></div>';
      fBox.addEventListener('pointerdown', (e) => e.stopPropagation());
      fBox.addEventListener('click', (e) => e.stopPropagation());
      stage.append(textPane, fBox);

      const fInp = fBox.querySelector('.ws-formula-input');
      const fWarn = fBox.querySelector('.ws-formula-warn');
      const fWarnTxt = fBox.querySelector('.ws-formula-warn-txt');
      const fModeBtns = Array.from(fBox.querySelectorAll('[data-fmode]'));
      const fDelBtn = fBox.querySelector('[data-fdel]');
      const fDoneBtn = fBox.querySelector('[data-fdone]');

      const syncConceptFormulaSide = () => {
        const w = Number(card.w) || 280;
        stage.classList.toggle('formula-side', !fBox.hidden && w >= 430);
      };
      node._syncFormulaLayout = syncConceptFormulaSide;

      let activeFormulaRange = null;

      const findConceptMathTokens = (srcText) => {
        const src = String(srcText || '');
        const masked = src.replace(/\\\$/g, '\uE001');
        const re = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$(?!\s)([^\n$]+?)(?<!\s)\$(?!\d)/g;
        const list = [];
        let m;
        while ((m = re.exec(masked)) !== null) {
          const isDisplay = m[1] != null || m[2] != null;
          const texRaw = m[1] != null ? m[1] : (m[2] != null ? m[2] : (m[3] != null ? m[3] : m[4]));
          list.push({
            start: m.index,
            end: re.lastIndex,
            displayMode: isDisplay,
            tex: String(texRaw || '').split('\uE001').join('\\$')
          });
        }
        return list;
      };

      const renderConceptMathPreview = (liveSafe) => {
        const textVal = card.text || '';
        const showLive = !fBox.hidden && activeFormulaRange;
        if (showLive || (typeof wsHasMathDelimiters === 'function' && wsHasMathDelimiters(textVal) && document.activeElement !== body)) {
          const curScroll = body.scrollTop;
          if (showLive && liveSafe && !liveSafe.valid) {
            const before = textVal.slice(0, activeFormulaRange.start);
            const after = textVal.slice(activeFormulaRange.end);
            const beforeHtml = typeof wsRenderTextWithMath === 'function' ? wsRenderTextWithMath(before) : wsEscape(before).replace(/\n/g, '<br>');
            const afterHtml = typeof wsRenderTextWithMath === 'function' ? wsRenderTextWithMath(after) : wsEscape(after).replace(/\n/g, '<br>');
            const slotHtml = liveSafe.usedFallback && liveSafe.html
              ? liveSafe.html
              : ('<span class="ws-math-inline">' + wsEscape(fInp.value || '∑') + '</span>');
            mathView.innerHTML = beforeHtml +
              '<span class="ws-math-editing' + (!liveSafe.isEmpty ? ' has-fallback' : '') + '">' + slotHtml + '</span>' +
              afterHtml;
          } else {
            mathView.innerHTML = typeof wsRenderTextWithMath === 'function'
              ? wsRenderTextWithMath(textVal)
              : wsEscape(textVal).replace(/\n/g, '<br>');
            if (showLive) {
              const allNodes = mathView.querySelectorAll('.ws-math-inline, .ws-math-display');
              const tokIdx = activeFormulaRange.tokenIndex;
              if (tokIdx >= 0 && allNodes[tokIdx]) allNodes[tokIdx].classList.add('ws-math-editing');
            }
          }
          mathView.hidden = false;
          stage.classList.add('showing-math');
          mathView.scrollTop = curScroll;
        } else {
          mathView.hidden = true;
          stage.classList.remove('showing-math');
        }
      };

      const updateConceptFormula = (fromInput) => {
        if (!activeFormulaRange) return;
        const code = fInp.value;
        const disp = !!activeFormulaRange.displayMode;
        const safe = typeof wsRenderTexSafe === 'function'
          ? wsRenderTexSafe(code, disp, activeFormulaRange.lastValidHtml || '')
          : { valid: true, isEmpty: !code.trim(), html: wsEscape(code), usedFallback: false };
        if (safe.valid) {
          activeFormulaRange.lastValidHtml = safe.html;
          fWarn.hidden = true;
          fWarnTxt.textContent = '';
        } else if (!safe.isEmpty) {
          const msg = wsTr('ws.mathErr.' + (safe.code || 'braces'), { cmd: safe.detail || '' }, safe.reason || '');
          fWarn.hidden = false;
          fWarnTxt.textContent = (safe.usedFallback ? wsTr('ws.mathErrPrefix', null, 'Mantendo último resultado válido:') + ' ' : '') + msg;
        } else {
          fWarn.hidden = true;
          fWarnTxt.textContent = '';
        }

        if (fromInput) {
          const d = disp ? '$$' : '$';
          const replacement = code.trim() ? (d + code + d) : '';
          const txt = card.text || '';
          const nextTxt = txt.slice(0, activeFormulaRange.start) + replacement + txt.slice(activeFormulaRange.end);
          activeFormulaRange.end = activeFormulaRange.start + replacement.length;
          card.text = nextTxt;
          body.value = nextTxt;
          const toks = findConceptMathTokens(nextTxt);
          activeFormulaRange.tokenIndex = toks.findIndex(t => t.start === activeFormulaRange.start);
          this.scheduleSave();
        }
        renderConceptMathPreview(safe);
        requestAnimationFrame(() => this.updateArrowsFor(card.id));
      };

      const openConceptFormulaRange = (range, selectInput) => {
        activeFormulaRange = range;
        fInp.value = range.initialTex || '';
        fModeBtns.forEach(b => b.classList.toggle('active', (b.dataset.fmode === '1') === !!range.displayMode));
        fBox.hidden = false;
        node.classList.add('formula-open');
        syncConceptFormulaSide();
        updateConceptFormula(false);
        setTimeout(() => {
          fInp.focus();
          if (selectInput) fInp.select();
        }, 0);
      };

      const closeConceptFormulaBox = (opts) => {
        opts = opts || {};
        if (activeFormulaRange && (opts.remove || !fInp.value.trim())) {
          const txt = card.text || '';
          card.text = txt.slice(0, activeFormulaRange.start) + txt.slice(activeFormulaRange.end);
          body.value = card.text;
          this.scheduleSave();
        }
        activeFormulaRange = null;
        fBox.hidden = true;
        fWarn.hidden = true;
        stage.classList.remove('formula-side');
        node.classList.remove('formula-open');
        renderConceptMathPreview();
        requestAnimationFrame(() => this.updateArrowsFor(card.id));
        if (opts.focusBody) body.focus();
      };

      mathBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const curText = card.text || '';
        const s = typeof body.selectionStart === 'number' ? body.selectionStart : curText.length;
        const end = typeof body.selectionEnd === 'number' ? body.selectionEnd : s;
        const selected = curText.slice(s, end).trim();
        const initTex = selected || '\\frac{a}{b}';
        const rep = '$' + initTex + '$';
        card.text = curText.slice(0, s) + rep + curText.slice(end);
        body.value = card.text;
        this.scheduleSave();
        const toks = findConceptMathTokens(card.text);
        const tokIdx = toks.findIndex(t => t.start === s);
        const initialSafe = typeof wsRenderTexSafe === 'function' ? wsRenderTexSafe(initTex, false, '') : { valid: true, html: '' };
        openConceptFormulaRange({
          start: s,
          end: s + rep.length,
          displayMode: false,
          initialTex: initTex,
          lastValidHtml: initialSafe.valid ? initialSafe.html : '',
          tokenIndex: tokIdx
        }, !selected);
      });

      fInp.addEventListener('input', () => updateConceptFormula(true));
      fInp.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Escape') {
          e.preventDefault();
          closeConceptFormulaBox({ focusBody: false });
          return;
        }
        if (e.key === 'Enter' && (!(activeFormulaRange && activeFormulaRange.displayMode) || e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          closeConceptFormulaBox({ focusBody: false });
        }
      });
      fModeBtns.forEach(b => {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!activeFormulaRange) return;
          activeFormulaRange.displayMode = b.dataset.fmode === '1';
          fModeBtns.forEach(btn => btn.classList.toggle('active', btn === b));
          updateConceptFormula(true);
          fInp.focus();
        });
      });
      fDoneBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeConceptFormulaBox({ focusBody: false });
      });
      fDelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeConceptFormulaBox({ remove: true, focusBody: true });
      });

      mathView.addEventListener('click', (e) => {
        e.stopPropagation();
        const mathEl = e.target.closest('.ws-math-inline[data-tex], .ws-math-display[data-tex]');
        if (mathEl) {
          const allMath = Array.from(mathView.querySelectorAll('.ws-math-inline[data-tex], .ws-math-display[data-tex]'));
          const idx = allMath.indexOf(mathEl);
          const toks = findConceptMathTokens(card.text || '');
          const tok = idx >= 0 ? toks[idx] : null;
          if (tok) {
            const safe = typeof wsRenderTexSafe === 'function' ? wsRenderTexSafe(tok.tex, tok.displayMode, '') : { valid: true, html: '' };
            openConceptFormulaRange({
              start: tok.start,
              end: tok.end,
              displayMode: tok.displayMode,
              initialTex: tok.tex,
              lastValidHtml: safe.valid ? safe.html : '',
              tokenIndex: idx
            }, false);
            return;
          }
        }
        closeConceptFormulaBox({ focusBody: false });
        const curScroll = mathView.scrollTop;
        mathView.hidden = true;
        stage.classList.remove('showing-math');
        body.focus();
        body.scrollTop = curScroll;
      });
      body.addEventListener('input', () => {
        card.text = body.value;
        this.scheduleSave();
      });
      body.addEventListener('focus', () => {
        if (!fBox.hidden) closeConceptFormulaBox({ focusBody: false });
        mathView.hidden = true;
        stage.classList.remove('showing-math');
      });
      body.addEventListener('blur', () => {
        renderConceptMathPreview();
      });
      body.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          body.blur();
        }
      });
      body.addEventListener('wheel', (e) => {
        if (!this.entered) return;
        if (e.ctrlKey || e.metaKey) return;
        if (typeof wsShouldWheelScrollNote === 'function'
            ? wsShouldWheelScrollNote(body)
            : (body.scrollHeight > body.clientHeight + 2)) {
          e.stopPropagation();
        }
      }, { passive: true });
      mathView.addEventListener('wheel', (e) => {
        if (!this.entered) return;
        if (e.ctrlKey || e.metaKey) return;
        if (mathView.scrollHeight > mathView.clientHeight + 2) {
          e.stopPropagation();
        }
      }, { passive: true });

      renderConceptMathPreview();
      wrap.append(nameInp, tagsRow, stage);
      const resize = el('div', 'ws-resize');
      resize.title = wsTr('ws.resize', null, 'Redimensionar');
      node.append(head, wrap, resize);
      resize.addEventListener('pointerdown', (e) => this.startResize(e, card));
    } else if (card.type === 'checklist') {
      const titleInp = el('input', 'ws-check-title');
      titleInp.type = 'text';
      titleInp.placeholder = wsTr('ws.checkTitlePh', null, 'Checklist de estudo…');
      titleInp.value = card.title || '';
      titleInp.maxLength = 120;
      titleInp.addEventListener('pointerdown', (e) => e.stopPropagation());
      titleInp.addEventListener('input', () => {
        card.title = titleInp.value;
        this.scheduleSave();
      });

      const prog = el('span', 'ws-check-prog');
      const conns = makeConnsBtn();
      const link = this.cardButton('arrow', wsTr('ws.linkCardTitle', null, 'Ligar a outro cartão'));
      link.addEventListener('click', (e) => { e.stopPropagation(); this.beginLink(card.id); });
      const del = this.cardButton('close', wsTr('ws.checkRemoveTitle', null, 'Remover checklist'), 'danger');
      del.addEventListener('click', (e) => { e.stopPropagation(); this.requestRemoveCard(card); });
      head.append(titleInp, prog, conns, link, del);

      const listEl = el('div', 'ws-check-list');
      const addForm = el('form', 'ws-check-add');
      addForm.innerHTML = '<input type="text" placeholder="' + wsEscape(wsTr('ws.checkAddPh', null, '+ Novo item (Enter)…')) + '" maxlength="240"><button type="submit" title="' + wsEscape(wsTr('ws.checkAddTitle', null, 'Adicionar item')) + '">' + svgIcon('plus') + '</button>';

      const renderItems = () => {
        card.items = Array.isArray(card.items) ? card.items : [];
        const doneCount = card.items.filter(it => it && it.done).length;
        prog.textContent = doneCount + '/' + card.items.length;
        listEl.innerHTML = '';
        if (!card.items.length) {
          listEl.append(el('div', 'ws-check-empty', wsTr('ws.checkEmpty', null, 'Adicione tópicos ou passos abaixo.')));
          return;
        }
        card.items.forEach((it) => {
          const row = el('div', 'ws-check-row' + (it.done ? ' done' : ''));
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.checked = !!it.done;
          cb.setAttribute('aria-label', wsTr('ws.checkAria', null, 'Marcar item'));
          cb.addEventListener('change', () => {
            it.done = cb.checked;
            row.classList.toggle('done', it.done);
            prog.textContent = card.items.filter(x => x && x.done).length + '/' + card.items.length;
            this.scheduleSave();
          });
          const txt = document.createElement('input');
          txt.type = 'text';
          txt.className = 'ws-check-item-txt';
          txt.value = it.text || '';
          txt.maxLength = 240;
          txt.addEventListener('input', () => {
            it.text = txt.value;
            this.scheduleSave();
          });
          const rm = this.cardButton('close', wsTr('ws.checkRemoveItem', null, 'Remover item'), 'danger');
          rm.addEventListener('click', (e) => {
            e.stopPropagation();
            card.items = card.items.filter(x => x.id !== it.id);
            renderItems();
            this.scheduleSave();
          });
          row.append(cb, txt, rm);
          listEl.append(row);
        });
      };
      renderItems();

      addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const inp = addForm.querySelector('input');
        const txt = (inp && inp.value || '').trim();
        if (!txt) return;
        card.items.push({ id: uid(), text: txt.slice(0, 240), done: false });
        inp.value = '';
        renderItems();
        this.scheduleSave();
      });

      const resize = el('div', 'ws-resize');
      resize.title = wsTr('ws.resize', null, 'Redimensionar');
      node.append(head, listEl, addForm, resize);
      resize.addEventListener('pointerdown', (e) => this.startResize(e, card));
    } else if (card.type === 'group') {
      const titleInp = el('input', 'ws-group-title');
      titleInp.type = 'text';
      titleInp.placeholder = wsTr('ws.groupTitlePh', null, 'Nome do grupo…');
      titleInp.value = card.title || '';
      titleInp.maxLength = 120;
      titleInp.addEventListener('pointerdown', (e) => e.stopPropagation());
      titleInp.addEventListener('input', () => {
        card.title = titleInp.value;
        this.scheduleSave();
      });

      const tintBar = el('div', 'ws-card-tints');
      (typeof WS_CARD_TINTS !== 'undefined' ? WS_CARD_TINTS : []).forEach(t => {
        const dot = el('button', 'ws-tint-dot' + ((card.accent || '') === t.id ? ' active' : ''));
        dot.type = 'button';
        const cName = wsColorLabel(t);
        dot.title = wsTr('ws.noteColorLabel', { label: cName }, 'Cor ' + cName);
        dot.style.background = t.color || 'var(--border)';
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          card.accent = t.id;
          this.applyCardTint(node, card.accent);
          tintBar.querySelectorAll('.ws-tint-dot').forEach((d, idx) => d.classList.toggle('active', idx === WS_CARD_TINTS.indexOf(t)));
          this.scheduleSave();
        });
        tintBar.append(dot);
      });

      const conns = makeConnsBtn();
      const link = this.cardButton('arrow', wsTr('ws.groupLinkTitle', null, 'Ligar grupo a outro cartão'));
      link.addEventListener('click', (e) => { e.stopPropagation(); this.beginLink(card.id); });
      const del = this.cardButton('close', wsTr('ws.groupRemoveTitle', null, 'Remover grupo'), 'danger');
      del.addEventListener('click', (e) => { e.stopPropagation(); this.requestRemoveCard(card); });
      head.append(titleInp, tintBar, conns, link, del);

      const hint = el('div', 'ws-group-hint', wsTr('ws.groupHint', null, 'Arraste a moldura para mover tudo · segure Alt para mover só a moldura'));
      const resize = el('div', 'ws-resize');
      resize.title = wsTr('ws.groupResizeTitle', null, 'Redimensionar grupo');
      node.append(head, hint, resize);
      resize.addEventListener('pointerdown', (e) => this.startResize(e, card));
    } else if (card.type === 'image') {
      const meta = this.imgMeta(card);
      const fallbackImgTitle = wsTr('ws.card.image', null, 'Imagem');
      const title = el('span', 'ws-card-title');
      title.textContent = meta ? meta.name : fallbackImgTitle;
      title.title = meta ? meta.name : fallbackImgTitle;
      head.append(title);

      const zoomBar = el('div', 'ws-pdf-zoombar');
      const zOutBtn = el('button', 'ws-card-btn ws-pdf-zbtn', '−');
      zOutBtn.type = 'button';
      zOutBtn.dataset.imgact = 'zout';
      zOutBtn.title = wsTr('ws.img.zoomOut', null, 'Diminuir zoom da imagem');
      zOutBtn.setAttribute('aria-label', zOutBtn.title);
      const zValBtn = el('button', 'ws-pdf-zoomval');
      zValBtn.type = 'button';
      zValBtn.textContent = Math.round((card.zoom || 1) * 100) + '%';
      zValBtn.title = wsTr('ws.img.zoomReset', null, 'Restaurar zoom para 100%');
      zValBtn.setAttribute('aria-label', zValBtn.title);
      const zInBtn = el('button', 'ws-card-btn ws-pdf-zbtn', '+');
      zInBtn.type = 'button';
      zInBtn.dataset.imgact = 'zin';
      zInBtn.title = wsTr('ws.img.zoomIn', null, 'Aumentar zoom da imagem');
      zInBtn.setAttribute('aria-label', zInBtn.title);
      zoomBar.append(zOutBtn, zValBtn, zInBtn);
      head.append(zoomBar);

      const conns = makeConnsBtn();
      const link = this.cardButton('arrow', wsTr('ws.linkCardTitle', null, 'Ligar a outro cartão'));
      link.addEventListener('click', (e) => {
        e.stopPropagation();
        this.beginLink(card.id);
      });
      const del = this.cardButton('close', wsTr('ws.img.removeTitle', null, 'Remover imagem'), 'danger');
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        this.requestRemoveCard(card);
      });
      head.append(conns, link, del);

      const frame = el('div', 'ws-img-frame');
      frame.innerHTML =
        '<div class="ws-img-body">' +
          '<div class="ws-img-stage"><img alt="' + wsEscape(meta ? meta.name : fallbackImgTitle) + '"></div>' +
        '</div>';
      const body = frame.querySelector('.ws-img-body');
      const resize = el('div', 'ws-resize');
      resize.title = wsTr('ws.resize', null, 'Redimensionar');
      node.append(head, frame, resize);
      resize.addEventListener('pointerdown', (e) => this.startResize(e, card));

      zOutBtn.addEventListener('click', (e) => { e.stopPropagation(); this.setImageZoom(card, (card.zoom || 1) - 0.25); });
      zInBtn.addEventListener('click', (e) => { e.stopPropagation(); this.setImageZoom(card, (card.zoom || 1) + 0.25); });
      zValBtn.addEventListener('click', (e) => { e.stopPropagation(); this.setImageZoom(card, 1); });

      body.addEventListener('pointerdown', (e) => this.onImagePointerDown(e, card, body));
      body.addEventListener('contextmenu', (e) => {
        if (this.suppressContextMenu || body.classList.contains('is-zoomed')) e.preventDefault();
      });
      body.addEventListener('wheel', (e) => {
        if (!this.entered) return;
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
          const factor = Math.exp(-e.deltaY * 0.0022);
          this.setImageZoom(card, (card.zoom || 1) * factor);
          return;
        }
        if (body.classList.contains('is-zoomed') &&
            (body.scrollHeight > body.clientHeight + 2 || body.scrollWidth > body.clientWidth + 2)) {
          e.stopPropagation();
        }
      }, { passive: false });
    } else {
      const meta = this.pdfMeta(card);
      const title = el('span', 'ws-card-title');
      title.textContent = meta ? meta.name : 'PDF';
      title.title = meta ? meta.name : 'PDF';
      head.append(title);

      const totalPages = meta && meta.pages ? meta.pages : 0;
      const pager = el('div', 'ws-pdf-pager');
      const prevBtn = this.cardButton('chevL', wsTr('ws.pdf.prevPage', null, 'Página anterior'), 'ws-pdf-pbtn');
      prevBtn.dataset.pdfact = 'prev';
      const pageBtn = el('button', 'ws-pdf-page');
      pageBtn.type = 'button';
      pageBtn.textContent = (card.page || 1) + ' / ' + (totalPages || '…');
      pageBtn.title = wsTr('ws.pdf.gotoPageTitle', null, 'Clique para ir para uma página específica');
      const nextBtn = this.cardButton('chevR', wsTr('ws.pdf.nextPage', null, 'Próxima página'), 'ws-pdf-pbtn');
      nextBtn.dataset.pdfact = 'next';
      pager.append(prevBtn, pageBtn, nextBtn);
      head.append(pager);

      const zoomBar = el('div', 'ws-pdf-zoombar');
      const zOutBtn = el('button', 'ws-card-btn ws-pdf-zbtn', '−');
      zOutBtn.type = 'button';
      zOutBtn.dataset.pdfact = 'zout';
      zOutBtn.title = wsTr('ws.pdf.zoomOut', null, 'Diminuir zoom do PDF');
      zOutBtn.setAttribute('aria-label', zOutBtn.title);
      const zValBtn = el('button', 'ws-pdf-zoomval');
      zValBtn.type = 'button';
      zValBtn.textContent = Math.round((card.zoom || 1) * 100) + '%';
      zValBtn.title = wsTr('ws.pdf.zoomReset', null, 'Restaurar zoom para 100% (ajustar)');
      zValBtn.setAttribute('aria-label', zValBtn.title);
      const zInBtn = el('button', 'ws-card-btn ws-pdf-zbtn', '+');
      zInBtn.type = 'button';
      zInBtn.dataset.pdfact = 'zin';
      zInBtn.title = wsTr('ws.pdf.zoomIn', null, 'Aumentar zoom do PDF');
      zInBtn.setAttribute('aria-label', zInBtn.title);
      zoomBar.append(zOutBtn, zValBtn, zInBtn);
      head.append(zoomBar);

      const searchBtn = this.cardButton('search', wsTr('ws.pdf.searchTitle', null, 'Buscar palavras neste PDF'));
      searchBtn.dataset.pdfact = 'search';
      searchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePdfSearch(card);
      });

      const editBtn = this.cardButton('pencil', wsTr('ws.pdf.editTitle', null, 'Opções de edição e movimento do PDF'), card.editMode ? 'active' : '');
      editBtn.dataset.pdfact = 'edit';
      editBtn.setAttribute('aria-pressed', card.editMode ? 'true' : 'false');
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePdfEditMode(card);
      });

      const conns = makeConnsBtn();
      const link = this.cardButton('arrow', wsTr('ws.linkCardTitle', null, 'Ligar a outro cartão'));
      link.addEventListener('click', (e) => {
        e.stopPropagation();
        this.beginLink(card.id);
      });
      const hl = this.cardButton('highlight', wsTr('ws.pdf.hlTitle', null, 'Destaques desta página'));
      hl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openHighlights(card);
      });
      const del = this.cardButton('close', wsTr('ws.pdf.removeTitle', null, 'Remover PDF'), 'danger');
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        this.requestRemoveCard(card);
      });
      head.append(searchBtn, editBtn, conns, link, hl, del);

      const searchBar = el('div', 'ws-pdf-searchbar');
      searchBar.hidden = true;
      searchBar.innerHTML =
        svgIcon('search') +
        '<input type="text" class="ws-pdf-sinput" placeholder="' + wsEscape(wsTr('ws.pdf.searchPh', null, 'Buscar dentro deste PDF…')) + '" aria-label="' + wsEscape(wsTr('ws.pdf.searchPh', null, 'Buscar no PDF')) + '">' +
        '<span class="ws-pdf-scount" data-pdfscount></span>' +
        '<button type="button" class="ws-card-btn ws-pdf-sbtn" data-pdfsact="prev" title="' + wsEscape(wsTr('ws.pdf.searchPrev', null, 'Anterior (Shift+Enter)')) + '" aria-label="' + wsEscape(wsTr('ws.pdf.searchPrev', null, 'Anterior (Shift+Enter)')) + '">' + svgIcon('chevU') + '</button>' +
        '<button type="button" class="ws-card-btn ws-pdf-sbtn" data-pdfsact="next" title="' + wsEscape(wsTr('ws.pdf.searchNext', null, 'Próxima (Enter)')) + '" aria-label="' + wsEscape(wsTr('ws.pdf.searchNext', null, 'Próxima (Enter)')) + '">' + svgIcon('chevD') + '</button>' +
        '<button type="button" class="ws-card-btn ws-pdf-sbtn" data-pdfsact="close" title="' + wsEscape(wsTr('ws.pdf.searchClose', null, 'Fechar busca (Esc)')) + '" aria-label="' + wsEscape(wsTr('ws.pdf.searchClose', null, 'Fechar busca (Esc)')) + '">' + svgIcon('close') + '</button>';

      const sInput = searchBar.querySelector('.ws-pdf-sinput');
      let pdfSearchTimer = null;
      searchBar.addEventListener('pointerdown', (e) => e.stopPropagation());
      searchBar.addEventListener('click', (e) => {
        e.stopPropagation();
        const act = e.target.closest('[data-pdfsact]');
        if (!act) return;
        if (act.dataset.pdfsact === 'prev') this.stepPdfSearch(card, -1);
        else if (act.dataset.pdfsact === 'next') this.stepPdfSearch(card, 1);
        else if (act.dataset.pdfsact === 'close') this.togglePdfSearch(card, false);
      });
      if (sInput) {
        sInput.addEventListener('input', () => {
          clearTimeout(pdfSearchTimer);
          pdfSearchTimer = setTimeout(() => this.runPdfSearch(card, sInput.value), 120);
        });
        sInput.addEventListener('keydown', (e) => {
          e.stopPropagation();
          if (e.key === 'Escape') { e.preventDefault(); this.togglePdfSearch(card, false); }
          else if (e.key === 'Enter') {
            e.preventDefault();
            this.stepPdfSearch(card, e.shiftKey ? -1 : 1);
          }
        });
      }

      const editBar = el('div', 'ws-pdf-editbar');
      editBar.hidden = !card.editMode;
      let hlDots = '';
      WS_HL_COLORS.forEach(c => {
        const cLabel = wsColorLabel(c);
        hlDots += '<button type="button" class="ws-pdf-hldot' + (card.hlColor === c.value ? ' active' : '') + '" data-hlpick="' + c.value + '" title="' + wsEscape(wsTr('ws.noteColorLabel', { label: cLabel }, 'Cor ' + cLabel)) + '" aria-label="' + wsEscape(wsTr('ws.noteColorLabel', { label: cLabel }, 'Cor ' + cLabel)) + '" style="background:' + c.value + '"></button>';
      });
      editBar.innerHTML =
        '<button type="button" class="ws-pdf-modebtn" data-pdfmode="read" title="' + wsEscape(wsTr('ws.pdf.modeReadTip', null, 'Selecionar texto e clicar para mudar página')) + '">' + svgIcon('cursor') + '<span>' + wsEscape(wsTr('ws.pdf.modeRead', null, 'Ler')) + '</span></button>' +
        '<button type="button" class="ws-pdf-modebtn" data-pdfmode="pan" title="' + wsEscape(wsTr('ws.pdf.modePanTip', null, 'Arrastar/mexer com a mão (ou botão direito)')) + '">' + svgIcon('hand') + '<span>' + wsEscape(wsTr('ws.pdf.modePan', null, 'Mexer')) + '</span></button>' +
        '<button type="button" class="ws-pdf-modebtn" data-pdfmode="highlight" title="' + wsEscape(wsTr('ws.pdf.modeHlTip', null, 'Selecionar texto para destacar direto')) + '">' + svgIcon('highlight') + '<span>' + wsEscape(wsTr('ws.pdf.modeHl', null, 'Destacar')) + '</span></button>' +
        '<button type="button" class="ws-pdf-modebtn" data-pdfmode="note" title="' + wsEscape(wsTr('ws.pdf.modeNoteTip', null, 'Clicar no PDF para criar um cartão de nota')) + '">' + svgIcon('plus') + '<span>' + wsEscape(wsTr('ws.pdf.modeNote', null, 'Nota')) + '</span></button>' +
        '<div class="ws-pdf-hlcolors"' + (card.pdfMode === 'highlight' ? '' : ' hidden') + '>' + hlDots + '</div>' +
        '<button type="button" class="ws-pdf-modebtn" data-pdfact="rotate" title="' + wsEscape(wsTr('ws.pdf.rotateTip', null, 'Girar página 90°')) + '">' + svgIcon('rotate') + '<span>' + wsEscape(wsTr('ws.pdf.rotate', null, 'Girar')) + '</span></button>' +
        '<span class="ws-pdf-edithint">' + wsEscape(wsTr('ws.pdf.rightHint', null, 'botão direito mexe')) + '</span>';

      editBar.addEventListener('pointerdown', (e) => e.stopPropagation());
      editBar.addEventListener('click', (e) => {
        e.stopPropagation();
        const modeBtn = e.target.closest('[data-pdfmode]');
        if (modeBtn) {
          this.setPdfMode(card, modeBtn.dataset.pdfmode);
          return;
        }
        const dot = e.target.closest('[data-hlpick]');
        if (dot) {
          card.hlColor = dot.dataset.hlpick;
          this.syncPdfControls(card);
          this.scheduleSave();
          return;
        }
        const rot = e.target.closest('[data-pdfact="rotate"]');
        if (rot) {
          card.rotation = ((card.rotation || 0) + 90) % 360;
          this.pdfRendered.delete(card.id);
          this.scheduleSave();
          this.renderPdfCard(card, true);
        }
      });

      const frame = el('div', 'ws-pdf-frame');
      frame.innerHTML =
        '<div class="ws-pdf-body">' +
          '<div class="ws-pdf-stage">' +
            '<div class="ws-pdf-page-wrap">' +
              '<canvas></canvas>' +
              '<div class="ws-hl-layer"></div>' +
              '<div class="ws-text-layer"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="ws-pdf-nav prev" data-pdfact="prev" title="' + wsEscape(wsTr('ws.pdf.prevPage', null, 'Página anterior')) + ' (←)" aria-label="' + wsEscape(wsTr('ws.pdf.prevPage', null, 'Página anterior')) + '">' + svgIcon('chevL') + '</button>' +
        '<button type="button" class="ws-pdf-nav next" data-pdfact="next" title="' + wsEscape(wsTr('ws.pdf.nextPage', null, 'Próxima página')) + ' (→)" aria-label="' + wsEscape(wsTr('ws.pdf.nextPage', null, 'Próxima página')) + '">' + svgIcon('chevR') + '</button>' +
        '<div class="ws-pdf-loading">' + wsEscape(wsTr('ws.pdf.loading', null, 'carregando PDF')) + '</div>';
      const body = frame.querySelector('.ws-pdf-body');
      const resize = el('div', 'ws-resize');
      resize.title = wsTr('ws.resize', null, 'Redimensionar');
      node.append(head, searchBar, editBar, frame, resize);
      resize.addEventListener('pointerdown', (e) => this.startResize(e, card));

      prevBtn.addEventListener('click', (e) => { e.stopPropagation(); this.prevPdfPage(card); });
      nextBtn.addEventListener('click', (e) => { e.stopPropagation(); this.nextPdfPage(card); });
      pageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.promptPdfPage(card, pageBtn);
      });
      zOutBtn.addEventListener('click', (e) => { e.stopPropagation(); this.setPdfZoom(card, (card.zoom || 1) - 0.25); });
      zInBtn.addEventListener('click', (e) => { e.stopPropagation(); this.setPdfZoom(card, (card.zoom || 1) + 0.25); });
      zValBtn.addEventListener('click', (e) => { e.stopPropagation(); this.setPdfZoom(card, 1); });

      frame.querySelectorAll('.ws-pdf-nav').forEach(btn => {
        btn.addEventListener('pointerdown', (e) => e.stopPropagation());
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (btn.classList.contains('prev')) this.prevPdfPage(card);
          else this.nextPdfPage(card);
        });
      });

      body.addEventListener('pointerdown', (e) => this.onPdfPointerDown(e, card, body));
      body.addEventListener('contextmenu', (e) => {
        if (this.suppressContextMenu || card.editMode || card.pdfMode === 'pan') e.preventDefault();
      });
      body.addEventListener('wheel', (e) => {
        if (!this.entered) return;
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
          const factor = Math.exp(-e.deltaY * 0.0022);
          this.setPdfZoom(card, (card.zoom || 1) * factor);
          return;
        }
        if (body.classList.contains('is-zoomed') &&
            (body.scrollHeight > body.clientHeight + 2 || body.scrollWidth > body.clientWidth + 2)) {
          e.stopPropagation();
        }
      }, { passive: false });
    }

    head.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, input')) return;
      this.startCardDrag(e, card);
    });

    node.addEventListener('pointerdown', (e) => {
      if (e.shiftKey) {
        this.select(card.id, { toggle: true });
        return;
      }
      if (!this.selectedIds.has(card.id) || this.selectedIds.size <= 1) {
        this.select(card.id);
      }
    });
    this.els.world.append(node);
    this.cardEls.set(card.id, node);
    if (card.type === 'pdf') this.syncPdfControls(card);
    return node;
  },

  rebuildCard(card) {
    const old = this.cardEls.get(card.id);
    if (old) old.remove();
    this.cardEls.delete(card.id);
    this.pdfRendered.delete(card.id);
    this.createCardEl(card);
  },

  pdfMeta(card) {
    return this.board.pdfs.find(p => p.id === card.pdfId) || null;
  },

  imgMeta(card) {
    return (this.board.images || []).find(im => im.id === card.imgId) || null;
  },

  addNote(opts) {
    opts = opts || {};
    const c = this.centerWorld();
    const text = typeof opts.text === 'string' ? opts.text : '';
    const rawHtml = typeof opts.html === 'string' && typeof wsSanitizeNoteHtml === 'function'
      ? wsSanitizeNoteHtml(opts.html)
      : (text && typeof wsPlainTextToNoteHtml === 'function' ? wsPlainTextToNoteHtml(text) : '');
    const card = {
      id: uid(),
      type: 'note',
      x: opts.x == null ? c.x - 140 : opts.x,
      y: opts.y == null ? c.y - 85 : opts.y,
      w: opts.w || 280,
      h: opts.h || 170,
      text,
      html: rawHtml,
      accent: typeof wsValidTint === 'function' ? wsValidTint(opts.accent) : (opts.accent || ''),
      font: typeof wsNormalizeNoteFont === 'function' ? wsNormalizeNoteFont(opts.font) : 'inter',
      fontSize: typeof wsNormalizeNoteSize === 'function' ? wsNormalizeNoteSize(opts.fontSize) : 14,
      align: typeof wsNormalizeNoteAlign === 'function' ? wsNormalizeNoteAlign(opts.align) : 'left',
      editMode: !!opts.editMode,
      source: opts.source || null
    };
    this.board.cards.push(card);
    this.createCardEl(card);
    this.updateEmpty();
    this.scheduleSave();
    this.select(card.id);
    if (!text && !rawHtml && opts.focus !== false) {
      const node = this.cardEls.get(card.id);
      const body = node && node.querySelector('.ws-note-body');
      if (body) setTimeout(() => body.focus(), 30);
    }
    return card;
  },

  addConcept(opts) {
    opts = opts || {};
    const c = this.centerWorld();
    const card = {
      id: uid(),
      type: 'concept',
      x: opts.x == null ? c.x - 160 : opts.x,
      y: opts.y == null ? c.y - 115 : opts.y,
      w: opts.w || 320,
      h: opts.h || 230,
      title: opts.title || '',
      tags: Array.isArray(opts.tags) ? opts.tags : [],
      text: opts.text || '',
      accent: opts.accent || 'blue'
    };
    this.board.cards.push(card);
    this.createCardEl(card);
    this.updateEmpty();
    this.scheduleSave();
    this.select(card.id);
    if (opts.focus !== false) {
      const node = this.cardEls.get(card.id);
      const inp = node && node.querySelector('.ws-concept-title');
      if (inp) setTimeout(() => inp.focus(), 30);
    }
    return card;
  },

  addChecklist(opts) {
    opts = opts || {};
    const c = this.centerWorld();
    const card = {
      id: uid(),
      type: 'checklist',
      x: opts.x == null ? c.x - 150 : opts.x,
      y: opts.y == null ? c.y - 125 : opts.y,
      w: opts.w || 300,
      h: opts.h || 250,
      title: opts.title != null ? opts.title : wsTr('ws.checkTitleDef', null, 'Revisão'),
      items: Array.isArray(opts.items) ? opts.items : [],
      accent: opts.accent || ''
    };
    this.board.cards.push(card);
    this.createCardEl(card);
    this.updateEmpty();
    this.scheduleSave();
    this.select(card.id);
    if (opts.focus !== false) {
      const node = this.cardEls.get(card.id);
      const inp = node && node.querySelector('.ws-check-add input');
      if (inp) setTimeout(() => inp.focus(), 30);
    }
    return card;
  },

  addGroup(opts) {
    opts = opts || {};
    const c = this.centerWorld();
    const card = {
      id: uid(),
      type: 'group',
      x: opts.x == null ? c.x - 220 : opts.x,
      y: opts.y == null ? c.y - 160 : opts.y,
      w: opts.w || 440,
      h: opts.h || 320,
      title: opts.title != null ? opts.title : wsTr('ws.groupTitleDef', null, 'Novo grupo'),
      accent: opts.accent || 'blue'
    };
    this.board.cards.push(card);
    this.createCardEl(card);
    this.updateEmpty();
    this.scheduleSave();
    this.select(card.id);
    if (opts.focus !== false) {
      const node = this.cardEls.get(card.id);
      const inp = node && node.querySelector('.ws-group-title');
      if (inp) setTimeout(() => { inp.focus(); inp.select(); }, 30);
    }
    return card;
  },

  async requestRemoveCard(card) {
    if (!card) return;
    if (card.type === 'pdf') {
      const ok = await this.openConfirm({
        title: wsTr('ws.confirmDeletePdfTitle', null, 'Remover este PDF do quadro?'),
        message: wsTr('ws.confirmDeletePdfMsg', null, 'O arquivo salvo no navegador também será apagado.'),
        confirmLabel: wsTr('ws.confirmDeleteBtn', null, 'Remover'),
        danger: true
      });
      if (!ok) return;
    }
    this.removeCard(card);
  },

  removeCard(card) {
    if (!card) return;

    this.board.arrows = this.board.arrows.filter(a => a.from !== card.id && a.to !== card.id);
    this.board.cards = this.board.cards.filter(c => c.id !== card.id);
    const node = this.cardEls.get(card.id);
    if (node) node.remove();
    this.cardEls.delete(card.id);
    this.pdfRendered.delete(card.id);
    this.pdfPageDims.delete(card.id);
    this.pdfSearch.delete(card.id);
    this.pdfTokens.set(card.id, 'revoked');

    if (card.type === 'pdf') {
      const doc = this.pdfDocs.get(card.pdfId);
      if (doc && doc.destroy) { try { doc.destroy(); } catch (e) { /* ignora */ } }
      this.pdfDocs.delete(card.pdfId);
      this.pdfPromises.delete(card.pdfId);
      this.pdfTextCache.delete(card.pdfId);
      WorkspaceDB.delFile(card.pdfId).catch(() => {});
      this.board.pdfs = this.board.pdfs.filter(p => p.id !== card.pdfId);
      this.board.cards.forEach(c => {
        if (c.type === 'note' && c.source && c.source.pdfId === card.pdfId) {
          c.source = null;
          this.rebuildCard(c);
        }
      });
    } else if (card.type === 'image') {
      this.imgUrls.delete(card.imgId);
      WorkspaceDB.delFile(card.imgId).catch(() => {});
      this.board.images = (this.board.images || []).filter(im => im.id !== card.imgId);
    }

    this.selectedIds.delete(card.id);
    if (this.selCard === card.id) {
      const rem = Array.from(this.selectedIds);
      this.selCard = rem.length ? rem[rem.length - 1] : null;
    }
    if (this.selArrow && !this.board.arrows.some(a => a.id === this.selArrow)) {
      this.selArrow = null;
    }
    this.syncSelectionClasses();
    this.renderMultiTools();
    this.renderArrows();
    this.renderArrowTools();
    this.refreshCardConnectionBadges();
    this.updateEmpty();
    this.flushSave();
  },

  setSelectMode(on) {
    on = !!on;
    if (this.selectMode === on) return;
    this.selectMode = on;
    if (on && this.drawMode) this.setDrawMode(false);
    if (on) this.hideSnapOverlay();
    if (!on) {
      this.selectSpacePan = false;
      this.finishMarquee(false);
    }
    if (this.els.shell) {
      this.els.shell.classList.toggle('selecting', on);
      this.els.shell.classList.toggle('space-pan', false);
    }
    this.updateTopbar();
    this.updateHint();
  },

  syncSelectionClasses() {
    this.cardEls.forEach((node, cid) => {
      node.classList.toggle('selected', this.selectedIds.has(cid));
    });
  },

  select(id, opts) {
    opts = opts || {};
    if (this.linkFrom && id && id !== this.linkFrom && !opts.toggle) {
      this.makeArrow(this.linkFrom, id);
      this.cancelLink();
      return;
    }
    if (!id) {
      this.selectedIds.clear();
      this.selectedStrokes.clear();
      this.selCard = null;
    } else if (opts.toggle) {
      if (this.selectedIds.has(id)) {
        this.selectedIds.delete(id);
        const rem = Array.from(this.selectedIds);
        this.selCard = rem.length ? rem[rem.length - 1] : null;
      } else {
        this.selectedIds.add(id);
        this.selCard = id;
      }
    } else {
      this.selectedIds.clear();
      this.selectedStrokes.clear();
      this.selectedIds.add(id);
      this.selCard = id;
    }
    this.selArrow = null;
    this.syncSelectionClasses();
    this.updateArrowSelection();
    this.renderArrowTools();
    this.renderMultiTools();
    this.renderInk();
    if (this.els.viewport && !this.selectedStrokes.size) {
      this.els.viewport.classList.remove('stroke-sel-hover');
    }
    if (!id) this.hideSnapOverlay();
  },

  selectAll() {
    if (!this.entered || !this.board) return;
    this.cancelLink();
    this.closePopover();
    this.closeTimerSettings();
    this.hideSelectionTools();
    this.clearNativeSelection();

    const cards = Array.isArray(this.board.cards) ? this.board.cards : [];
    const strokes = Array.isArray(this.board.strokes) ? this.board.strokes : [];
    this.selectedIds.clear();
    this.selectedStrokes.clear();
    this.selArrow = null;

    cards.forEach(c => { if (c && c.id) this.selectedIds.add(c.id); });
    strokes.forEach(s => { if (s && s.id) this.selectedStrokes.add(s.id); });
    this.selCard = cards.length ? cards[cards.length - 1].id : null;

    this.syncSelectionClasses();
    this.updateArrowSelection();
    this.renderArrowTools();
    this.renderMultiTools();
    this.renderInk();

    const total = this.selectedIds.size + this.selectedStrokes.size;
    if (!total) toast(wsTr('ws.selectAllEmpty', null, 'Nada no quadro para selecionar'), 'cursor');
  },

  async deleteSelected() {
    if (!this.board) return;
    const cardIds = Array.from(this.selectedIds);
    const strokeIds = new Set(this.selectedStrokes);
    if (!cardIds.length && !strokeIds.size) return;

    const cardsToRemove = cardIds
      .map(id => this.board.cards.find(c => c.id === id))
      .filter(Boolean);
    const hasPdf = cardsToRemove.some(c => c.type === 'pdf');
    if (hasPdf) {
      const ok = await this.openConfirm({
        title: wsTr('ws.confirmMultiTitle', { n: cardsToRemove.length + strokeIds.size }, 'Remover ' + (cardsToRemove.length + strokeIds.size) + ' item(ns) selecionado(s)?'),
        message: wsTr('ws.confirmMultiMsg', null, 'Os PDFs incluídos na seleção também serão apagados do navegador.'),
        confirmLabel: wsTr('ws.confirmMultiBtn', null, 'Remover tudo'),
        danger: true
      });
      if (!ok) return;
    }

    if (strokeIds.size && Array.isArray(this.board.strokes) && this.board.strokes.length) {
      this.pushInkUndo();
      this.board.strokes = this.board.strokes.filter(s => !strokeIds.has(s.id));
    }

    const removedSet = new Set(cardIds);
    cardsToRemove.forEach((card) => {
      this.board.arrows = this.board.arrows.filter(a => a.from !== card.id && a.to !== card.id);
      this.board.cards = this.board.cards.filter(c => c.id !== card.id);
      const node = this.cardEls.get(card.id);
      if (node) node.remove();
      this.cardEls.delete(card.id);
      this.pdfRendered.delete(card.id);
      this.pdfPageDims.delete(card.id);
      this.pdfSearch.delete(card.id);
      this.pdfTokens.set(card.id, 'revoked');

      if (card.type === 'pdf') {
        const doc = this.pdfDocs.get(card.pdfId);
        if (doc && doc.destroy) { try { doc.destroy(); } catch (e) { /* ignora */ } }
        this.pdfDocs.delete(card.pdfId);
        this.pdfPromises.delete(card.pdfId);
        this.pdfTextCache.delete(card.pdfId);
        WorkspaceDB.delFile(card.pdfId).catch(() => {});
        this.board.pdfs = this.board.pdfs.filter(p => p.id !== card.pdfId);
      } else if (card.type === 'image') {
        this.imgUrls.delete(card.imgId);
        WorkspaceDB.delFile(card.imgId).catch(() => {});
        this.board.images = (this.board.images || []).filter(im => im.id !== card.imgId);
      }
    });

    if (removedSet.size) {
      const activePdfIds = new Set(this.board.pdfs.map(p => p.id));
      this.board.cards.forEach(c => {
        if (c.type === 'note' && c.source && !activePdfIds.has(c.source.pdfId)) {
          c.source = null;
          this.rebuildCard(c);
        }
      });
    }

    this.selectedIds.clear();
    this.selectedStrokes.clear();
    this.selCard = null;
    if (this.selArrow && !this.board.arrows.some(a => a.id === this.selArrow)) {
      this.selArrow = null;
    }

    this.syncSelectionClasses();
    this.renderMultiTools();
    this.renderArrows();
    this.renderArrowTools();
    this.refreshCardConnectionBadges();
    this.renderInk();
    this.renderInkBar();
    this.updateEmpty();
    this.flushSave();
  },

  renderMultiTools() {
    const box = this.els.multiTools;
    if (!box) return;
    const cCount = this.selectedIds.size;
    const sCount = this.selectedStrokes.size;
    const total = cCount + sCount;
    if (total < 2 && sCount === 0) {
      box.hidden = true;
      box.innerHTML = '';
      this.syncDockClearance();
      return;
    }
    const parts = [];
    if (cCount) parts.push(cCount === 1 ? wsTr('ws.multiOneCard', null, '1 cartão') : wsTr('ws.multiManyCards', { n: cCount }, cCount + ' cartões'));
    if (sCount) parts.push(sCount === 1 ? wsTr('ws.multiOneStroke', null, '1 traço') : wsTr('ws.multiManyStrokes', { n: sCount }, sCount + ' traços'));
    box.innerHTML =
      '<span class="ws-multi-count">' + parts.join(' · ') + '</span>' +
      '<button type="button" class="ws-ar-chip danger" data-mact="del" title="' + wsEscape(wsTr('ws.multiDelTitle', null, 'Excluir selecionados (Del)')) + '">' + svgIcon('trash') + '<span>' + wsEscape(wsTr('ws.multiDel', null, 'Excluir')) + '</span></button>' +
      '<button type="button" class="ws-ar-chip" data-mact="clear" title="' + wsEscape(wsTr('ws.multiClearTitle', null, 'Limpar seleção (Esc)')) + '">' + svgIcon('close') + '<span>' + wsEscape(wsTr('ws.multiClear', null, 'Limpar')) + '</span></button>';
    box.hidden = false;
    this.syncDockClearance();
  },

  selectArrow(id) {
    this.selCard = null;
    this.selectedIds.clear();
    this.selectedStrokes.clear();
    this.syncSelectionClasses();
    this.renderMultiTools();
    this.renderInk();
    if (this.selArrow !== (id || null)) this.arrowAdvOpen = false;
    this.selArrow = id || null;
    this.updateArrowSelection();
    this.renderArrowTools();
  },

  updateArrowSelection() {
    this.arrowEls.forEach((o, id) => {
      const isSel = id === this.selArrow;
      o.line.classList.toggle('sel', isSel);
      o.hit.classList.toggle('sel', isSel);
      if (o.labelGroup) o.labelGroup.classList.toggle('sel', isSel);
      if (o.g) o.g.classList.toggle('sel', isSel);
    });
  },

  beginLink(cardId) {
    const from = cardId || this.selCard;
    if (!from) { toast(wsTr('ws.linkSelectStart', null, 'Selecione um cartão para começar a ligação'), 'arrow'); return; }
    if (this.linkFrom === from) { this.cancelLink(); return; }
    this.cancelLink();
    this.linkFrom = from;
    const node = this.cardEls.get(from);
    if (node) node.classList.add('link-source');
    if (this.els.shell) this.els.shell.classList.add('linking');
    this.updateTopbar();
    toast(wsTr('ws.linkPickTarget', null, 'Clique no cartão de destino · Esc cancela'), 'arrow');
  },

  cancelLink() {
    if (!this.linkFrom) return;
    const node = this.cardEls.get(this.linkFrom);
    if (node) node.classList.remove('link-source');
    if (this.els.shell) this.els.shell.classList.remove('linking');
    this.linkFrom = null;
    this.updateTopbar();
  },

  /* -------- setas e ligações -------- */
  rebuildArrowIndexes() {
    const arrows = (this.board && Array.isArray(this.board.arrows)) ? this.board.arrows : [];
    this.arrowPairIndex = typeof wsBuildArrowPairIndex === 'function'
      ? wsBuildArrowPairIndex(arrows)
      : new Map();
    const cardMap = new Map();
    for (let i = 0; i < arrows.length; i++) {
      const a = arrows[i];
      if (!a || !a.from || !a.to) continue;
      let fList = cardMap.get(a.from);
      if (!fList) { fList = []; cardMap.set(a.from, fList); }
      fList.push(a);
      let tList = cardMap.get(a.to);
      if (!tList) { tList = []; cardMap.set(a.to, tList); }
      tList.push(a);
    }
    this.cardArrowIndex = cardMap;
  },

  getCardPortFill(card) {
    if (!card || card.type === 'group') return 'var(--ws-canvas-bg, var(--bg))';
    if (card.accent && typeof WS_CARD_TINTS !== 'undefined') {
      const tint = WS_CARD_TINTS.find(t => t.id === card.accent);
      if (tint && tint.color) {
        return 'color-mix(in srgb, ' + tint.color + ' 14%, var(--bg-soft, var(--bg)))';
      }
    }
    return 'var(--bg-soft, var(--bg))';
  },

  makeArrow(from, to, opts) {
    if (!from || !to || from === to) return null;
    if (this.board.arrows.some(a => a.from === from && a.to === to)) {
      toast(wsTr('ws.linkAlready', null, 'Esses cartões já estão ligados'), 'arrow');
      return null;
    }
    opts = opts || {};
    const kind = opts.kind || 'relates';
    const defDir = typeof wsDefaultDirForKind === 'function'
      ? wsDefaultDirForKind(kind)
      : ((kind === 'supports' || kind === 'sequence') ? 'forward' : 'none');
    const rawArrow = {
      id: uid(),
      from,
      to,
      kind,
      dir: opts.dir || defDir,
      routing: opts.routing || 'auto',
      lineStyle: opts.lineStyle || 'auto',
      width: opts.width || 0,
      label: opts.label || '',
      color: opts.color || '',
      startCap: opts.startCap || 'auto',
      endCap: opts.endCap || 'auto'
    };
    const a = typeof wsNormalizeArrow === 'function' ? wsNormalizeArrow(rawArrow) : rawArrow;
    this.board.arrows.push(a);
    this.rebuildArrowIndexes();
    this.createArrowEl(a);
    const pairKey = typeof wsArrowCardPairKey === 'function'
      ? wsArrowCardPairKey(from, to)
      : ([from, to].sort().join('|'));
    const siblings = this.arrowPairIndex.get(pairKey) || [a];
    siblings.forEach(sib => this.updateArrow(sib.id));
    this.refreshCardConnectionBadges();
    this.selectArrow(a.id);
    this.scheduleSave();
    return a;
  },

  removeArrow(id) {
    const target = this.board.arrows.find(a => a.id === id);
    this.board.arrows = this.board.arrows.filter(a => a.id !== id);
    const o = this.arrowEls.get(id);
    if (o) o.g.remove();
    this.arrowEls.delete(id);
    if (this.selArrow === id) this.selArrow = null;
    this.rebuildArrowIndexes();
    if (target) {
      const pairKey = typeof wsArrowCardPairKey === 'function'
        ? wsArrowCardPairKey(target.from, target.to)
        : ([target.from, target.to].sort().join('|'));
      const siblings = this.arrowPairIndex.get(pairKey) || [];
      siblings.forEach(sib => this.updateArrow(sib.id));
    }
    this.refreshCardConnectionBadges();
    this.renderArrowTools();
    this.scheduleSave();
  },

  renderArrows() {
    this.els.arrowLayer.innerHTML = '';
    this.arrowEls.clear();
    this.rebuildArrowIndexes();
    this.board.arrows.forEach(a => this.createArrowEl(a));
    this.board.arrows.forEach(a => this.updateArrow(a.id));
    this.updateArrowSelection();
    this.refreshCardConnectionBadges();
  },

  createArrowEl(a) {
    const NS = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'ws-arrow-g');
    g.dataset.id = a.id;
    const hit = document.createElementNS(NS, 'path');
    hit.setAttribute('class', 'ws-arrow-hit');
    const line = document.createElementNS(NS, 'path');
    line.setAttribute('class', 'ws-arrow');
    const portsGroup = document.createElementNS(NS, 'g');
    portsGroup.setAttribute('class', 'ws-arrow-ports');

    const labelGroup = document.createElementNS(NS, 'g');
    labelGroup.setAttribute('class', 'ws-arrow-label-g');
    const labelTxt = document.createElementNS(NS, 'text');
    labelTxt.setAttribute('class', 'ws-arrow-label');
    labelTxt.setAttribute('text-anchor', 'middle');
    labelTxt.setAttribute('dominant-baseline', 'central');
    labelGroup.append(labelTxt);

    const title = document.createElementNS(NS, 'title');
    title.textContent = wsTr('ws.arrowHoverTip', null, 'Ligação — clique para editar ou Delete para remover');
    g.append(hit, line, portsGroup, labelGroup, title);

    const onSelect = (e) => {
      e.stopPropagation();
      this.selectArrow(a.id);
    };
    const onFocusLabel = (e) => {
      e.stopPropagation();
      this.selectArrow(a.id);
      const inp = this.els.arrowTools && this.els.arrowTools.querySelector('[data-arlabel]');
      if (inp) { inp.focus(); inp.select(); }
    };
    hit.addEventListener('pointerdown', onSelect);
    hit.addEventListener('dblclick', onFocusLabel);
    labelGroup.addEventListener('pointerdown', onSelect);
    labelGroup.addEventListener('dblclick', onFocusLabel);

    this.els.arrowLayer.append(g);
    this.arrowEls.set(a.id, { g, hit, line, portsGroup, labelGroup, labelTxt, arrow: a });
  },

  renderArrowPorts(o, geom, endpoints, style, fromCard, toCard) {
    const pg = o.portsGroup;
    if (!pg) return;
    const NS = 'http://www.w3.org/2000/svg';
    pg.innerHTML = '';

    const drawOne = (port, x, y, angle, card, isStart) => {
      if (!port || port.shape === 'none' || port.mode === 'none') return;
      const g = document.createElementNS(NS, 'g');
      g.style.setProperty('--ws-port-fill', this.getCardPortFill(card));

      if (port.shape === 'arrow') {
        const rot = isStart ? (angle + 180) : angle;
        g.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') rotate(' + rot.toFixed(1) + ')');
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('class', 'ws-arrow-port-arrow');
        p.setAttribute('d', 'M -10.5 -4.6 L 0 0 L -10.5 4.6 L -8.2 0 Z');
        g.append(p);
        pg.append(g);
        return;
      }

      if (port.shape === 'bar') {
        g.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') rotate(' + angle.toFixed(1) + ')');
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('class', 'ws-arrow-port-bar');
        p.setAttribute('d', 'M 0 -5.5 L 0 5.5');
        g.append(p);
        pg.append(g);
        return;
      }

      if (port.shape === 'circle') {
        g.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')');
        const outer = document.createElementNS(NS, 'circle');
        outer.setAttribute('class', 'ws-arrow-port-outer');
        outer.setAttribute('cx', '0');
        outer.setAttribute('cy', '0');
        outer.setAttribute('r', '5');
        g.append(outer);
        if (port.mode === 'core') {
          const core = document.createElementNS(NS, 'circle');
          core.setAttribute('class', 'ws-arrow-port-core');
          core.setAttribute('cx', '0');
          core.setAttribute('cy', '0');
          core.setAttribute('r', '2.35');
          g.append(core);
        }
        pg.append(g);
        return;
      }

      if (port.shape === 'square') {
        g.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') rotate(' + angle.toFixed(1) + ')');
        const outer = document.createElementNS(NS, 'rect');
        outer.setAttribute('class', 'ws-arrow-port-outer');
        outer.setAttribute('x', '-4.8');
        outer.setAttribute('y', '-4.8');
        outer.setAttribute('width', '9.6');
        outer.setAttribute('height', '9.6');
        outer.setAttribute('rx', '2.2');
        g.append(outer);
        if (port.mode === 'core') {
          const core = document.createElementNS(NS, 'rect');
          core.setAttribute('class', 'ws-arrow-port-core');
          core.setAttribute('x', '-2.2');
          core.setAttribute('y', '-2.2');
          core.setAttribute('width', '4.4');
          core.setAttribute('height', '4.4');
          core.setAttribute('rx', '0.9');
          g.append(core);
        }
        pg.append(g);
        return;
      }

      if (port.shape === 'diamond') {
        g.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')');
        const outer = document.createElementNS(NS, 'path');
        outer.setAttribute('class', 'ws-arrow-port-outer');
        outer.setAttribute('d', 'M 0 -6 L 6 0 L 0 6 L -6 0 Z');
        g.append(outer);
        if (port.mode === 'core') {
          const core = document.createElementNS(NS, 'path');
          core.setAttribute('class', 'ws-arrow-port-core');
          core.setAttribute('d', 'M 0 -2.8 L 2.8 0 L 0 2.8 L -2.8 0 Z');
          g.append(core);
        }
        pg.append(g);
      }
    };

    drawOne(endpoints.start, geom.x1, geom.y1, geom.startAngle || 0, fromCard, true);
    drawOne(endpoints.end, geom.x2, geom.y2, geom.endAngle || 0, toCard, false);
  },

  updateArrow(id) {
    const o = this.arrowEls.get(id);
    if (!o) return;
    const a = o.arrow;
    const from = this.board.cards.find(c => c.id === a.from);
    const to = this.board.cards.find(c => c.id === a.to);
    if (!from || !to) { o.g.style.display = 'none'; return; }
    o.g.style.display = '';

    if (!this.arrowPairIndex || (!this.arrowPairIndex.size && this.board.arrows.length)) {
      this.rebuildArrowIndexes();
    }
    const pairKey = typeof wsArrowCardPairKey === 'function'
      ? wsArrowCardPairKey(a.from, a.to)
      : ([a.from, a.to].sort().join('|'));
    const pairArrows = this.arrowPairIndex.get(pairKey) || [a];
    let laneOffset = 0;
    if (pairArrows.length > 1) {
      const idx = pairArrows.findIndex(x => x.id === a.id);
      const rawOffset = (idx - (pairArrows.length - 1) / 2) * 40;
      laneOffset = a.from > a.to ? -rawOffset : rawOffset;
    }

    const linkDefs = this.board.linkDefaults;
    const endpoints = typeof wsResolveArrowEndpoints === 'function'
      ? wsResolveArrowEndpoints(a, linkDefs)
      : {
          start: { shape: 'none', mode: 'none', outsideOffset: 0 },
          end: { shape: 'arrow', mode: 'arrow', outsideOffset: 2 }
        };
    const style = typeof wsResolveArrowStyle === 'function'
      ? wsResolveArrowStyle(a, linkDefs)
      : { routing: 's-curve', lineStyle: 'solid', width: 1.8, color: a.color || '', dashArray: '' };

    const fromNode = this.cardEls.get(from.id);
    const toNode = this.cardEls.get(to.id);
    const fromBox = (fromNode && fromNode.classList.contains('formula-open'))
      ? { ...from, h: Math.max(from.h, fromNode.offsetHeight) }
      : from;
    const toBox = (toNode && toNode.classList.contains('formula-open'))
      ? { ...to, h: Math.max(to.h, toNode.offsetHeight) }
      : to;

    const geom = typeof wsBuildArrowGeometry === 'function'
      ? wsBuildArrowGeometry(fromBox, toBox, {
          routing: style.routing,
          laneOffset,
          startOffset: endpoints.start.outsideOffset,
          endOffset: endpoints.end.outsideOffset
        })
      : {
          d: 'M ' + (from.x + from.w / 2).toFixed(1) + ' ' + (from.y + from.h / 2).toFixed(1) +
             ' L ' + (to.x + to.w / 2).toFixed(1) + ' ' + (to.y + to.h / 2).toFixed(1),
          x1: from.x + from.w / 2, y1: from.y + from.h / 2,
          x2: to.x + to.w / 2, y2: to.y + to.h / 2,
          mx: (from.x + from.w / 2 + to.x + to.w / 2) / 2,
          my: (from.y + from.h / 2 + to.y + to.h / 2) / 2,
          lx: (from.x + from.w / 2 + to.x + to.w / 2) / 2,
          ly: (from.y + from.h / 2 + to.y + to.h / 2) / 2 - 13.5,
          startAngle: 0, endAngle: 0
        };

    o.hit.setAttribute('d', geom.d);
    o.line.setAttribute('d', geom.d);
    o.line.dataset.kind = a.kind || 'relates';

    if (style.dashArray) o.line.setAttribute('stroke-dasharray', style.dashArray);
    else o.line.removeAttribute('stroke-dasharray');

    const isSel = this.selArrow === a.id;
    o.line.style.strokeWidth = String(style.width + (isSel ? 0.8 : 0));

    if (style.color) {
      o.g.style.setProperty('--ws-arrow-col', style.color);
      o.g.dataset.hasColor = '1';
    } else {
      o.g.style.removeProperty('--ws-arrow-col');
      delete o.g.dataset.hasColor;
    }

    this.renderArrowPorts(o, geom, endpoints, style, from, to);

    const lbl = String(a.label || '').trim();
    if (lbl) {
      o.labelGroup.style.display = '';
      o.labelTxt.textContent = lbl;
      o.labelTxt.setAttribute('x', geom.lx.toFixed(1));
      o.labelTxt.setAttribute('y', geom.ly.toFixed(1));
    } else {
      o.labelGroup.style.display = 'none';
    }
  },

  renderArrowTools() {
    const bar = this.els.arrowTools;
    if (!bar) return;
    if (!this.selArrow) {
      bar.hidden = true;
      bar.innerHTML = '';
      this.syncDockClearance();
      return;
    }
    const a = this.board.arrows.find(x => x.id === this.selArrow);
    if (!a) {
      this.selArrow = null;
      bar.hidden = true;
      bar.innerHTML = '';
      this.syncDockClearance();
      return;
    }

    const kindSwatch = (id) => {
      if (id === 'contrast') {
        return '<svg class="ws-ar-swatch" viewBox="0 0 22 10" aria-hidden="true">' +
          '<path d="M5 5h12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' +
          '<rect x="1.5" y="2.2" width="5.2" height="5.2" rx="1.3" fill="var(--bg-soft, var(--bg))" stroke="currentColor" stroke-width="1.35"/>' +
          '<rect x="15.3" y="2.2" width="5.2" height="5.2" rx="1.3" fill="var(--bg-soft, var(--bg))" stroke="currentColor" stroke-width="1.35"/>' +
        '</svg>';
      }
      if (id === 'supports') {
        return '<svg class="ws-ar-swatch" viewBox="0 0 22 10" aria-hidden="true">' +
          '<path d="M5 5h12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' +
          '<path d="M4 1.5L7.5 5 4 8.5 0.5 5Z" fill="var(--bg-soft, var(--bg))" stroke="currentColor" stroke-width="1.3"/>' +
          '<path d="M18 1.5L21.5 5 18 8.5 14.5 5Z" fill="var(--bg-soft, var(--bg))" stroke="currentColor" stroke-width="1.3"/>' +
          '<path d="M18 3.3L19.7 5 18 6.7 16.3 5Z" fill="currentColor"/>' +
        '</svg>';
      }
      if (id === 'sequence') {
        return '<svg class="ws-ar-swatch" viewBox="0 0 22 10" aria-hidden="true">' +
          '<path d="M2 5h13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
          '<path d="M14 2L20.5 5 14 8 15.6 5Z" fill="currentColor"/>' +
        '</svg>';
      }
      return '<svg class="ws-ar-swatch" viewBox="0 0 22 10" aria-hidden="true">' +
        '<path d="M5 5h12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' +
        '<circle cx="4" cy="5" r="2.6" fill="var(--bg-soft, var(--bg))" stroke="currentColor" stroke-width="1.35"/>' +
        '<circle cx="18" cy="5" r="2.6" fill="var(--bg-soft, var(--bg))" stroke="currentColor" stroke-width="1.35"/>' +
      '</svg>';
    };

    const kinds = (typeof WS_ARROW_KINDS !== 'undefined' ? WS_ARROW_KINDS : [])
      .map(k => '<button type="button" class="ws-ar-chip' + ((a.kind || 'relates') === k.id ? ' active' : '') + '" data-arkind="' + k.id + '">' + kindSwatch(k.id) + '<span>' + wsEscape(wsTr('ws.arrow.' + k.id, null, k.label)) + '</span></button>')
      .join('');
    const dirs = (typeof WS_ARROW_DIRS !== 'undefined' ? WS_ARROW_DIRS : [])
      .map(d => '<button type="button" class="ws-ar-chip' + ((a.dir || 'none') === d.id ? ' active' : '') + '" data-ardir="' + d.id + '" title="' + wsEscape(wsTr('ws.arrow.' + d.id, null, d.label)) + '">' + d.label + '</button>')
      .join('');
    const routingOpts = WS_ARROW_ROUTING_OPTS.map(opt =>
      '<option value="' + opt.id + '"' + ((a.routing || 'auto') === opt.id ? ' selected' : '') + '>' + wsEscape(wsTr(opt.key, null, opt.def)) + '</option>'
    ).join('');
    const styleOpts = WS_ARROW_LINE_STYLE_OPTS.map(opt =>
      '<option value="' + opt.id + '"' + ((a.lineStyle || 'auto') === opt.id ? ' selected' : '') + '>' + wsEscape(wsTr(opt.key, null, opt.def)) + '</option>'
    ).join('');
    const colors = (typeof WS_ARROW_COLORS !== 'undefined' ? WS_ARROW_COLORS : [])
      .map(c => {
        const cName = wsColorLabel(c);
        return '<button type="button" class="ws-sel-dot' + ((a.color || '') === c.value ? ' active' : '') + '" data-arcolor="' + c.value + '" title="' + wsEscape(cName) + '" style="background:' + (c.value || 'var(--surface-2)') + (c.value ? '' : ';box-shadow:inset 0 0 0 1.5px var(--text-faint)') + '"></button>';
      })
      .join('');

    const capOptsHtml = (curVal) => {
      const opts = WS_ARROW_CAP_OPTS.slice();
      if (curVal === 'circle-open') opts.push({ id: 'circle-open', key: 'ws.arrow.capCircleOpen', def: 'Círculo vazado' });
      else if (curVal === 'square-open') opts.push({ id: 'square-open', key: 'ws.arrow.capSquareOpen', def: 'Quadrado vazado' });
      return opts.map(opt =>
        '<option value="' + opt.id + '"' + ((curVal || 'auto') === opt.id ? ' selected' : '') + '>' + wsEscape(wsTr(opt.key, null, opt.def)) + '</option>'
      ).join('');
    };
    const widthOptsHtml = '<option value="0"' + (!(Number(a.width) > 0) ? ' selected' : '') + '>' + wsEscape(wsTr('ws.arrow.widthAuto', null, 'Auto')) + '</option>' +
      WS_ARROW_WIDTH_OPTS.map(w => '<option value="' + w + '"' + (Math.abs(Number(a.width) - w) < 0.05 ? ' selected' : '') + '>' + w + 'px</option>').join('');

    const advOpen = !!this.arrowAdvOpen;
    const isSeq = (a.kind || 'relates') === 'sequence';
    const advCapsHtml = isSeq
      ? '<span class="ws-ar-seqnote">' + wsEscape(wsTr('ws.arrow.seqCapsNote', null, 'Sequência usa sempre seta externa nas pontas direcionais')) + '</span>' +
        '<label class="ws-ar-capwrap"><span>' + wsEscape(wsTr('ws.arrow.width', null, 'Espessura')) + '</span><select class="ws-ar-capselect" data-arwidth aria-label="' + wsEscape(wsTr('ws.arrow.width', null, 'Espessura')) + '">' + widthOptsHtml + '</select></label>'
      : '<label class="ws-ar-capwrap"><span>' + wsEscape(wsTr('ws.arrow.startCap', null, 'Origem')) + '</span><select class="ws-ar-capselect" data-arcap="start" aria-label="' + wsEscape(wsTr('ws.arrow.startCap', null, 'Origem')) + '">' + capOptsHtml(a.startCap || 'auto') + '</select></label>' +
        '<label class="ws-ar-capwrap"><span>' + wsEscape(wsTr('ws.arrow.endCap', null, 'Destino')) + '</span><select class="ws-ar-capselect" data-arcap="end" aria-label="' + wsEscape(wsTr('ws.arrow.endCap', null, 'Destino')) + '">' + capOptsHtml(a.endCap || 'auto') + '</select></label>' +
        '<label class="ws-ar-capwrap"><span>' + wsEscape(wsTr('ws.arrow.width', null, 'Espessura')) + '</span><select class="ws-ar-capselect" data-arwidth aria-label="' + wsEscape(wsTr('ws.arrow.width', null, 'Espessura')) + '">' + widthOptsHtml + '</select></label>';

    bar.innerHTML =
      '<div class="ws-ar-main">' +
        '<input type="text" class="ws-ar-input" data-arlabel value="' + wsEscape(a.label || '') + '" placeholder="' + wsEscape(wsTr('ws.arrowLabelPh', null, 'Rótulo da ligação (ex.: causa, resume)…')) + '" maxlength="48" aria-label="' + wsEscape(wsTr('ws.arrowLabelAria', null, 'Rótulo da ligação')) + '">' +
        '<span class="ws-ink-sep"></span>' +
        '<div class="ws-ar-group">' + kinds + '</div>' +
        '<span class="ws-ink-sep"></span>' +
        '<div class="ws-ar-group">' + dirs + '<button type="button" class="ws-ar-chip" data-arinvert title="' + wsEscape(wsTr('ws.arrowInvertTitle', null, 'Inverter direção')) + '">' + svgIcon('swap') + '</button></div>' +
        '<span class="ws-ink-sep"></span>' +
        '<select class="ws-ar-capselect" data-arrouting aria-label="' + wsEscape(wsTr('ws.arrow.routing', null, 'Traçado')) + '" title="' + wsEscape(wsTr('ws.arrow.routing', null, 'Traçado')) + '">' + routingOpts + '</select>' +
        '<select class="ws-ar-capselect" data-arstyle aria-label="' + wsEscape(wsTr('ws.arrow.lineStyle', null, 'Linha')) + '" title="' + wsEscape(wsTr('ws.arrow.lineStyle', null, 'Linha')) + '">' + styleOpts + '</select>' +
        '<span class="ws-ink-sep"></span>' +
        '<div class="ws-ar-group">' + colors + '</div>' +
        '<span class="ws-ink-sep"></span>' +
        '<button type="button" class="ws-ar-chip' + (advOpen ? ' active' : '') + '" data-aradv aria-expanded="' + (advOpen ? 'true' : 'false') + '">' + svgIcon(advOpen ? 'chevU' : 'chevD') + '<span>' + wsEscape(wsTr('ws.arrow.advanced', null, 'Avançado')) + '</span></button>' +
        '<button type="button" class="ws-card-btn danger" data-ardel title="' + wsEscape(wsTr('ws.arrowDelTitle', null, 'Remover ligação (Delete)')) + '">' + svgIcon('trash') + '</button>' +
      '</div>' +
      '<div class="ws-ar-adv"' + (advOpen ? '' : ' hidden') + '>' +
        '<div class="ws-ar-caps" title="' + wsEscape(wsTr('ws.arrow.capsTitle', null, 'Pontas das extremidades')) + '">' + advCapsHtml + '</div>' +
        '<button type="button" class="ws-ar-chip" data-aropendefs>' + svgIcon('sliders') + '<span>' + wsEscape(wsTr('ws.arrow.capsDefaults', null, 'Padrões…')) + '</span></button>' +
      '</div>';
    bar.hidden = false;
    this.syncDockClearance();

    const inp = bar.querySelector('[data-arlabel]');
    if (inp) {
      inp.addEventListener('pointerdown', (e) => e.stopPropagation());
      inp.addEventListener('input', () => {
        a.label = inp.value.replace(/\s+/g, ' ').slice(0, 48);
        this.updateArrow(a.id);
        this.scheduleSave();
      });
      inp.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter' || e.key === 'Escape') {
          e.preventDefault();
          inp.blur();
        }
      });
    }
    const routeSel = bar.querySelector('[data-arrouting]');
    if (routeSel) {
      routeSel.addEventListener('pointerdown', (e) => e.stopPropagation());
      routeSel.addEventListener('change', () => {
        a.routing = typeof wsNormalizeArrowRouting === 'function' ? wsNormalizeArrowRouting(routeSel.value, true) : routeSel.value;
        this.updateArrow(a.id);
        this.scheduleSave();
      });
    }
    const styleSel = bar.querySelector('[data-arstyle]');
    if (styleSel) {
      styleSel.addEventListener('pointerdown', (e) => e.stopPropagation());
      styleSel.addEventListener('change', () => {
        a.lineStyle = typeof wsNormalizeArrowLineStyle === 'function' ? wsNormalizeArrowLineStyle(styleSel.value, true) : styleSel.value;
        this.updateArrow(a.id);
        this.scheduleSave();
      });
    }
    const widthSel = bar.querySelector('[data-arwidth]');
    if (widthSel) {
      widthSel.addEventListener('pointerdown', (e) => e.stopPropagation());
      widthSel.addEventListener('change', () => {
        a.width = typeof wsNormalizeArrowWidth === 'function' ? wsNormalizeArrowWidth(widthSel.value, true) : Number(widthSel.value);
        this.updateArrow(a.id);
        this.scheduleSave();
      });
    }
    bar.querySelectorAll('[data-arcap]').forEach(sel => {
      sel.addEventListener('pointerdown', (e) => e.stopPropagation());
      sel.addEventListener('change', () => {
        const side = sel.dataset.arcap;
        const val = typeof wsNormalizeArrowCap === 'function' ? wsNormalizeArrowCap(sel.value) : sel.value;
        if (side === 'start') a.startCap = val;
        else a.endCap = val;
        this.updateArrow(a.id);
        this.scheduleSave();
      });
    });
    bar.onpointerdown = (e) => e.stopPropagation();
    bar.onclick = (e) => {
      e.stopPropagation();
      const kb = e.target.closest('[data-arkind]');
      if (kb) {
        const nextKind = kb.dataset.arkind;
        const prevKind = a.kind || 'relates';
        a.kind = nextKind;
        if (typeof wsDefaultDirForKind === 'function' && a.dir === wsDefaultDirForKind(prevKind)) {
          a.dir = wsDefaultDirForKind(nextKind);
        }
        this.updateArrow(a.id);
        this.renderArrowTools();
        this.scheduleSave();
        return;
      }
      const db = e.target.closest('[data-ardir]');
      if (db) {
        a.dir = db.dataset.ardir;
        this.updateArrow(a.id);
        this.renderArrowTools();
        this.scheduleSave();
        return;
      }
      if (e.target.closest('[data-arinvert]')) {
        const tmp = a.from;
        a.from = a.to;
        a.to = tmp;
        const tmpCap = a.startCap;
        a.startCap = a.endCap || 'auto';
        a.endCap = tmpCap || 'auto';
        this.rebuildArrowIndexes();
        this.updateArrow(a.id);
        this.renderArrowTools();
        this.scheduleSave();
        return;
      }
      const cb = e.target.closest('[data-arcolor]');
      if (cb) {
        a.color = cb.dataset.arcolor;
        this.updateArrow(a.id);
        this.renderArrowTools();
        this.scheduleSave();
        return;
      }
      if (e.target.closest('[data-aradv]')) {
        this.arrowAdvOpen = !this.arrowAdvOpen;
        this.renderArrowTools();
        return;
      }
      if (e.target.closest('[data-aropendefs]')) {
        this.openLinkDefaultsPopover();
        return;
      }
      if (e.target.closest('[data-ardel]')) {
        this.removeArrow(a.id);
      }
    };
  },

  cardEdge(card, tx, ty) {
    if (typeof wsRayBoxEdge === 'function') return wsRayBoxEdge(card, tx, ty, 0, 0, 0);
    const cx = card.x + card.w / 2;
    const cy = card.y + card.h / 2;
    const dx = tx - cx;
    const dy = ty - cy;
    if (!dx && !dy) return { x: cx, y: cy };
    const sx = dx ? (card.w / 2) / Math.abs(dx) : Infinity;
    const sy = dy ? (card.h / 2) / Math.abs(dy) : Infinity;
    const t = Math.min(sx, sy);
    return { x: cx + dx * t, y: cy + dy * t };
  },

  updateArrowsFor(cardId) {
    if (!this.cardArrowIndex || (!this.cardArrowIndex.size && this.board && this.board.arrows.length)) {
      this.rebuildArrowIndexes();
    }
    const list = this.cardArrowIndex.get(cardId);
    if (!list || !list.length) return;
    for (let i = 0; i < list.length; i++) {
      this.updateArrow(list[i].id);
    }
  },

  updateArrowsForSet(cardIds) {
    if (!cardIds || !cardIds.length) return;
    if (!this.cardArrowIndex || (!this.cardArrowIndex.size && this.board && this.board.arrows.length)) {
      this.rebuildArrowIndexes();
    }
    const seen = new Set();
    for (let i = 0; i < cardIds.length; i++) {
      const list = this.cardArrowIndex.get(cardIds[i]);
      if (!list) continue;
      for (let j = 0; j < list.length; j++) {
        const aid = list[j].id;
        if (seen.has(aid)) continue;
        seen.add(aid);
        this.updateArrow(aid);
      }
    }
  },

  /* -------- PDFs -------- */
  loadPdfLib() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (this.pdfLibPromise) return this.pdfLibPromise;
    this.pdfLibPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'js/vendor/pdf.min.js';
      s.onload = () => {
        try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/vendor/pdf.worker.min.js'; }
        catch (e) { /* ignora */ }
        resolve(window.pdfjsLib);
      };
      s.onerror = () => reject(new Error('pdf.js não carregou'));
      document.head.append(s);
    });
    return this.pdfLibPromise;
  },

  ensurePdfDoc(pdfId) {
    if (this.pdfDocs.has(pdfId)) return Promise.resolve(this.pdfDocs.get(pdfId));
    if (this.pdfPromises.has(pdfId)) return this.pdfPromises.get(pdfId);
    const job = (async () => {
      await this.loadPdfLib();
      const buf = await WorkspaceDB.getFile(pdfId);
      if (!buf) throw new Error('arquivo ausente');
      const doc = await window.pdfjsLib.getDocument({
        data: new Uint8Array(buf.slice(0)),
        isEvalSupported: false
      }).promise;
      const meta = this.board.pdfs.find(p => p.id === pdfId);
      if (meta) {
        meta.pages = doc.numPages;
        this.scheduleSave();
      }
      this.pdfDocs.set(pdfId, doc);
      this.pdfPromises.delete(pdfId);
      return doc;
    })();
    this.pdfPromises.set(pdfId, job);
    job.catch(() => { this.pdfPromises.delete(pdfId); });
    return job;
  },

  refreshPdfs() {
    if (!this.entered) return;
    this.board.cards.forEach(card => {
      if (card.type === 'pdf') this.renderPdfCard(card);
      else if (card.type === 'image') this.renderImageCard(card);
    });
  },

  schedulePdfRefresh() {
    clearTimeout(this.pdfRefreshTimer);
    this.pdfRefreshTimer = setTimeout(() => this.refreshPdfs(), 180);
  },

  syncPdfControls(card, totalPages) {
    const node = this.cardEls.get(card.id);
    if (!node) return;
    const meta = this.pdfMeta(card);
    const total = totalPages || (meta && meta.pages) || 0;
    const page = Math.max(1, card.page || 1);
    const zoom = clamp(wsNum(card.zoom, 1), 0.5, 3.5);
    const mode = ['read', 'pan', 'highlight', 'note'].includes(card.pdfMode) ? card.pdfMode : 'read';

    const pageEl = node.querySelector('.ws-pdf-page');
    if (pageEl) pageEl.textContent = page + ' / ' + (total || '…');

    node.querySelectorAll('[data-pdfact="prev"]').forEach(b => { b.disabled = page <= 1; });
    node.querySelectorAll('[data-pdfact="next"]').forEach(b => { b.disabled = total > 0 && page >= total; });

    const zVal = node.querySelector('.ws-pdf-zoomval');
    if (zVal) zVal.textContent = Math.round(zoom * 100) + '%';
    const zOut = node.querySelector('[data-pdfact="zout"]');
    const zIn = node.querySelector('[data-pdfact="zin"]');
    if (zOut) zOut.disabled = zoom <= 0.51;
    if (zIn) zIn.disabled = zoom >= 3.49;

    const editBtn = node.querySelector('[data-pdfact="edit"]');
    if (editBtn) {
      editBtn.classList.toggle('active', !!card.editMode);
      editBtn.setAttribute('aria-pressed', card.editMode ? 'true' : 'false');
    }
    const editBar = node.querySelector('.ws-pdf-editbar');
    if (editBar) {
      editBar.hidden = !card.editMode;
      editBar.querySelectorAll('[data-pdfmode]').forEach(b => {
        b.classList.toggle('active', b.dataset.pdfmode === mode);
      });
      const colorsWrap = editBar.querySelector('.ws-pdf-hlcolors');
      if (colorsWrap) {
        colorsWrap.hidden = mode !== 'highlight';
        colorsWrap.querySelectorAll('[data-hlpick]').forEach(dot => {
          dot.classList.toggle('active', dot.dataset.hlpick === card.hlColor);
        });
      }
    }
    const body = node.querySelector('.ws-pdf-body');
    if (body) {
      body.classList.toggle('mode-read', mode === 'read');
      body.classList.toggle('mode-pan', mode === 'pan');
      body.classList.toggle('mode-highlight', mode === 'highlight');
      body.classList.toggle('mode-note', mode === 'note');
    }
  },

  togglePdfEditMode(card) {
    if (!card || card.type !== 'pdf') return;
    card.editMode = !card.editMode;
    if (card.editMode && card.pdfMode === 'read') {
      card.pdfMode = 'pan';
    } else if (!card.editMode) {
      card.pdfMode = 'read';
    }
    this.syncPdfControls(card);
    this.scheduleSave();
  },

  setPdfMode(card, mode) {
    if (!card || card.type !== 'pdf') return;
    card.pdfMode = ['read', 'pan', 'highlight', 'note'].includes(mode) ? mode : 'read';
    this.hideSelectionTools();
    this.syncPdfControls(card);
    this.scheduleSave();
  },

  async renderPdfCard(card, force) {
    if (!this.entered) return;
    const node = this.cardEls.get(card.id);
    if (!node) return;
    const frame = node.querySelector('.ws-pdf-frame') || node;
    const body = node.querySelector('.ws-pdf-body');
    if (!body) return;
    const bw = Math.floor(body.clientWidth);
    const bh = Math.floor(body.clientHeight);
    if (bw < 24 || bh < 24) return;

    const pdfZoom = clamp(wsNum(card.zoom, 1), 0.5, 3.5);
    const rot = (card.rotation === 90 || card.rotation === 180 || card.rotation === 270) ? card.rotation : 0;
    const quality = clamp(Math.max(1.5, (window.devicePixelRatio || 1) * this.board.view.scale), 1.5, 3.5);
    const key = [card.pdfId, card.page, bw, bh, Math.round(pdfZoom * 100), Math.round(quality * 10), rot].join('|');
    const wrap = body.querySelector('.ws-pdf-page-wrap');
    const canvas = body.querySelector('canvas');
    const textLayer = body.querySelector('.ws-text-layer');
    const loading = frame.querySelector('.ws-pdf-loading');
    this.syncPdfControls(card);
    if (!force && this.pdfRendered.get(card.id) === key && canvas.width > 0) return;

    const token = uid();
    this.pdfTokens.set(card.id, token);
    loading.hidden = false;
    loading.textContent = wsTr('ws.pdf.loading', null, 'carregando PDF');

    try {
      const doc = await this.ensurePdfDoc(card.pdfId);
      if (this.pdfTokens.get(card.id) !== token) return;
      const num = doc.numPages || 1;
      card.page = clamp(card.page || 1, 1, num);
      const page = await doc.getPage(card.page);
      if (this.pdfTokens.get(card.id) !== token) return;

      const base = page.getViewport({ scale: 1, rotation: rot });
      const fit = Math.min(Math.max(24, bw - 12) / base.width, Math.max(24, bh - 12) / base.height);
      const viewScale = fit * pdfZoom;
      const dispW = Math.max(1, Math.round(base.width * viewScale));
      const dispH = Math.max(1, Math.round(base.height * viewScale));

      const prev = this.pdfTasks.get(card.id);
      if (prev && prev.cancel) { try { prev.cancel(); } catch (e) { /* ignora */ } }

      let renderScale = viewScale * quality;
      const maxRenderSide = Math.max(base.width * renderScale, base.height * renderScale);
      if (maxRenderSide > 3600) renderScale *= 3600 / maxRenderSide;

      const renderVp = page.getViewport({ scale: renderScale, rotation: rot });
      canvas.width = Math.max(1, Math.floor(renderVp.width));
      canvas.height = Math.max(1, Math.floor(renderVp.height));
      canvas.style.width = dispW + 'px';
      canvas.style.height = dispH + 'px';
      if (wrap) {
        wrap.style.width = dispW + 'px';
        wrap.style.height = dispH + 'px';
      }
      body.classList.toggle('is-zoomed', pdfZoom > 1.01 || dispW > bw - 2 || dispH > bh - 2);

      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const task = page.render({ canvasContext: ctx, viewport: renderVp });
      this.pdfTasks.set(card.id, task);
      await task.promise;
      if (this.pdfTokens.get(card.id) !== token) return;
      this.pdfTasks.delete(card.id);

      textLayer.innerHTML = '';
      textLayer.style.width = dispW + 'px';
      textLayer.style.height = dispH + 'px';
      textLayer.style.setProperty('--scale-factor', String(viewScale));
      const content = await page.getTextContent();
      if (this.pdfTokens.get(card.id) !== token) return;
      const textTask = window.pdfjsLib.renderTextLayer({
        textContentSource: content,
        container: textLayer,
        viewport: page.getViewport({ scale: viewScale, rotation: rot }),
        textDivs: []
      });
      await textTask.promise;
      if (this.pdfTokens.get(card.id) !== token) return;

      this.pdfPageDims.set(card.id, { w: dispW, h: dispH });
      this.syncPdfControls(card, num);
      this.pdfRendered.set(card.id, key);
      this.renderHighlights(card);
      this.applyPdfSearchMarks(card);
      loading.hidden = true;
      this.scheduleSave();
    } catch (err) {
      if (this.pdfTokens.get(card.id) === token) {
        loading.hidden = false;
        loading.textContent = wsTr('ws.pdf.loadErr', null, 'Não foi possível abrir este PDF');
      }
    }
  },

  /* -------- busca interna no PDF -------- */
  togglePdfSearch(card, forceOpen) {
    if (!card || card.type !== 'pdf') return;
    const node = this.cardEls.get(card.id);
    if (!node) return;
    const bar = node.querySelector('.ws-pdf-searchbar');
    const btn = node.querySelector('[data-pdfact="search"]');
    const inp = bar && bar.querySelector('.ws-pdf-sinput');
    if (!bar) return;

    const st = this.pdfSearch.get(card.id) || { open: false, query: '', matches: [], activeIdx: 0 };
    const nextOpen = forceOpen != null ? !!forceOpen : !st.open;
    st.open = nextOpen;
    this.pdfSearch.set(card.id, st);

    bar.hidden = !nextOpen;
    if (btn) btn.classList.toggle('active', nextOpen);
    if (nextOpen) {
      if (inp) setTimeout(() => { inp.focus(); inp.select(); }, 10);
      if (st.query) this.applyPdfSearchMarks(card);
    } else {
      this.applyPdfSearchMarks(card);
    }
  },

  async extractPdfTextPages(pdfId) {
    const cached = this.pdfTextCache.get(pdfId);
    if (cached) return cached;
    const job = (async () => {
      const doc = await this.ensurePdfDoc(pdfId);
      const out = [];
      for (let p = 1; p <= doc.numPages; p++) {
        const page = await doc.getPage(p);
        const content = await page.getTextContent();
        const text = (content && Array.isArray(content.items))
          ? content.items.map(it => it && it.str ? it.str : '').join(' ')
          : '';
        out.push({ page: p, text });
      }
      this.pdfTextCache.set(pdfId, out);
      return out;
    })();
    this.pdfTextCache.set(pdfId, job);
    job.catch(() => { this.pdfTextCache.delete(pdfId); });
    return job;
  },

  updatePdfSearchCounter(card) {
    const node = this.cardEls.get(card.id);
    if (!node) return;
    const out = node.querySelector('[data-pdfscount]');
    if (!out) return;
    const st = this.pdfSearch.get(card.id);
    if (!st || !st.query || !st.query.trim()) {
      out.textContent = '';
      return;
    }
    if (st.searching) {
      out.textContent = '…';
      return;
    }
    if (!st.matches.length) {
      out.textContent = '0';
      return;
    }
    const cur = st.matches[st.activeIdx] || st.matches[0];
    out.textContent = (st.activeIdx + 1) + '/' + st.matches.length + ' · p.' + cur.page;
  },

  async runPdfSearch(card, query) {
    if (!card || card.type !== 'pdf') return;
    const st = this.pdfSearch.get(card.id) || { open: true, query: '', matches: [], activeIdx: 0 };
    st.query = String(query || '');
    st.activeIdx = 0;

    if (!st.query.trim()) {
      st.matches = [];
      st.searching = false;
      this.pdfSearch.set(card.id, st);
      this.updatePdfSearchCounter(card);
      this.applyPdfSearchMarks(card);
      return;
    }

    st.searching = true;
    this.pdfSearch.set(card.id, st);
    this.updatePdfSearchCounter(card);

    try {
      const pagesText = await this.extractPdfTextPages(card.pdfId);
      const current = this.pdfSearch.get(card.id);
      if (!current || current.query !== st.query) return;
      const matches = typeof wsSearchPdfPages === 'function'
        ? wsSearchPdfPages(pagesText, st.query)
        : [];
      current.matches = matches;
      current.searching = false;
      let startIdx = matches.findIndex(m => m.page >= (card.page || 1));
      if (startIdx < 0) startIdx = 0;
      current.activeIdx = startIdx;
      this.pdfSearch.set(card.id, current);
      this.updatePdfSearchCounter(card);

      if (matches.length) {
        const hit = matches[startIdx];
        if (hit.page !== card.page) this.goPdfPage(card, hit.page);
        else this.applyPdfSearchMarks(card);
      } else {
        this.applyPdfSearchMarks(card);
      }
    } catch (e) {
      const current = this.pdfSearch.get(card.id);
      if (current) {
        current.searching = false;
        current.matches = [];
        this.updatePdfSearchCounter(card);
      }
    }
  },

  stepPdfSearch(card, delta) {
    if (!card || card.type !== 'pdf') return;
    const st = this.pdfSearch.get(card.id);
    if (!st || !st.matches || !st.matches.length) return;
    st.activeIdx = (st.activeIdx + delta + st.matches.length) % st.matches.length;
    this.updatePdfSearchCounter(card);
    const hit = st.matches[st.activeIdx];
    if (hit.page !== card.page) this.goPdfPage(card, hit.page);
    else this.applyPdfSearchMarks(card);
  },

  applyPdfSearchMarks(card) {
    const node = this.cardEls.get(card.id);
    if (!node) return;
    const layer = node.querySelector('.ws-text-layer');
    if (!layer) return;

    layer.querySelectorAll('mark.ws-pdf-match').forEach((m) => {
      const parent = m.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(m.textContent || ''), m);
        parent.normalize();
      }
    });

    const st = this.pdfSearch.get(card.id);
    this.updatePdfSearchCounter(card);
    if (!st || !st.open || !st.query || !st.query.trim()) return;

    const normQ = typeof wsNormalizeText === 'function'
      ? wsNormalizeText(st.query)
      : st.query.trim().toLowerCase();
    if (!normQ) return;

    const marks = [];
    const spans = layer.querySelectorAll('span');
    for (let s = 0; s < spans.length; s++) {
      const sp = spans[s];
      const raw = sp.textContent || '';
      if (!raw) continue;
      let folded = '';
      const mapIdx = [];
      for (let i = 0; i < raw.length; i++) {
        const ch = raw[i].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        for (let k = 0; k < ch.length; k++) {
          folded += ch[k];
          mapIdx.push(i);
        }
      }
      if (!folded.includes(normQ)) continue;
      const ranges = [];
      let pos = 0;
      while (pos <= folded.length - normQ.length) {
        const hit = folded.indexOf(normQ, pos);
        if (hit < 0) break;
        const startOrig = mapIdx[hit];
        const endOrig = mapIdx[hit + normQ.length - 1] + 1;
        ranges.push([startOrig, endOrig]);
        pos = hit + Math.max(1, normQ.length);
      }
      if (!ranges.length) continue;

      const frag = document.createDocumentFragment();
      let cursor = 0;
      for (let r = 0; r < ranges.length; r++) {
        const [a, b] = ranges[r];
        if (a > cursor) frag.appendChild(document.createTextNode(raw.slice(cursor, a)));
        const mk = document.createElement('mark');
        mk.className = 'ws-pdf-match';
        mk.textContent = raw.slice(a, b);
        frag.appendChild(mk);
        marks.push(mk);
        cursor = b;
      }
      if (cursor < raw.length) frag.appendChild(document.createTextNode(raw.slice(cursor)));
      sp.textContent = '';
      sp.appendChild(frag);
    }

    if (marks.length && st.matches && st.matches.length) {
      const activeHit = st.matches[st.activeIdx];
      let localIdx = activeHit && activeHit.page === card.page ? (activeHit.occOnPage || 0) : 0;
      localIdx = clamp(localIdx, 0, marks.length - 1);
      const target = marks[localIdx];
      if (target) {
        target.classList.add('current');
        const body = node.querySelector('.ws-pdf-body');
        if (body && body.classList.contains('is-zoomed') && typeof target.scrollIntoView === 'function') {
          try { target.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' }); } catch (e) { /* ignora */ }
        }
      }
    }
  },

  goPdfPage(card, pageNum) {
    if (!card || card.type !== 'pdf') return;
    const meta = this.pdfMeta(card);
    const total = meta && meta.pages ? meta.pages : 0;
    const next = total ? clamp(Math.round(pageNum), 1, total) : Math.max(1, Math.round(pageNum));
    if (next === card.page) { this.syncPdfControls(card); return; }
    card.page = next;
    this.hideSelectionTools();
    this.clearNativeSelection();
    this.pdfRendered.delete(card.id);
    const node = this.cardEls.get(card.id);
    const body = node && node.querySelector('.ws-pdf-body');
    if (body) { body.scrollTop = 0; body.scrollLeft = 0; }
    this.syncPdfControls(card);
    this.scheduleSave();
    this.renderPdfCard(card, true);
  },

  prevPdfPage(card) {
    if (!card || card.type !== 'pdf') return;
    this.goPdfPage(card, (card.page || 1) - 1);
  },

  nextPdfPage(card) {
    if (!card || card.type !== 'pdf') return;
    this.goPdfPage(card, (card.page || 1) + 1);
  },

  promptPdfPage(card, pageBtn) {
    if (!card || !pageBtn || pageBtn.hidden) return;
    const meta = this.pdfMeta(card);
    const total = (meta && meta.pages) || 1;
    const input = el('input', 'ws-pdf-page-input');
    input.type = 'number';
    input.min = 1;
    input.max = total;
    input.value = String(card.page || 1);
    input.setAttribute('aria-label', wsTr('ws.pdf.gotoPageAria', null, 'Ir para a página'));
    pageBtn.hidden = true;
    pageBtn.after(input);
    input.focus();
    input.select();

    let done = false;
    const finish = (commit) => {
      if (done) return;
      done = true;
      const target = Math.round(Number(input.value));
      input.remove();
      pageBtn.hidden = false;
      if (commit && Number.isFinite(target) && target >= 1) {
        this.goPdfPage(card, target);
      }
    };
    input.addEventListener('pointerdown', (e) => e.stopPropagation());
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') { e.preventDefault(); finish(true); }
      else if (e.key === 'Escape') { e.preventDefault(); finish(false); }
    });
    input.addEventListener('blur', () => finish(true));
  },

  setPdfZoom(card, nextZoom) {
    if (!card || card.type !== 'pdf') return;
    const prevZoom = clamp(wsNum(card.zoom, 1), 0.5, 3.5);
    const clamped = clamp(Math.round(nextZoom * 100) / 100, 0.5, 3.5);
    if (Math.abs(clamped - prevZoom) < 0.01) { this.syncPdfControls(card); return; }

    const node = this.cardEls.get(card.id);
    const body = node && node.querySelector('.ws-pdf-body');
    const sx = body ? body.scrollLeft : 0;
    const sy = body ? body.scrollTop : 0;
    const canScrollX = !!(body && body.scrollWidth > body.clientWidth + 2 && sx > 2);
    const canScrollY = !!(body && body.scrollHeight > body.clientHeight + 2 && sy > 2);
    const rx = canScrollX ? (sx + body.clientWidth / 2) / body.scrollWidth : 0;
    const ry = canScrollY ? (sy + body.clientHeight / 2) / body.scrollHeight : 0;

    card.zoom = clamped;
    this.pdfRendered.delete(card.id);
    this.syncPdfControls(card);
    this.scheduleSave();
    this.renderPdfCard(card, true).then(() => {
      if (!body) return;
      if (clamped <= 1.01) {
        body.scrollLeft = 0;
        body.scrollTop = 0;
      } else {
        body.scrollLeft = canScrollX
          ? Math.max(0, rx * body.scrollWidth - body.clientWidth / 2)
          : 0;
        body.scrollTop = canScrollY
          ? Math.max(0, ry * body.scrollHeight - body.clientHeight / 2)
          : 0;
      }
    });
  },

  async addPdfFile(file, at) {
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
    if (!isPdf) return;
    if (this.board.pdfs.length >= 5) {
      toast(wsTr('ws.pdf.limitToast', null, 'Limite de 5 PDFs no quadro'), 'file');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      const mb = (file.size / 1048576).toFixed(1);
      const proceed = await this.openConfirm({
        title: wsTr('ws.pdf.largeTitle', { mb }, 'PDF grande (' + mb + ' MB)'),
        message: wsTr('ws.pdf.largeMsg', null, 'Arquivos maiores podem deixar o quadro mais lento. Deseja adicionar mesmo assim?'),
        confirmLabel: wsTr('ws.pdf.largeConfirm', null, 'Adicionar')
      });
      if (!proceed) return;
    }
    let buf;
    try { buf = await file.arrayBuffer(); }
    catch (e) { toast(wsTr('ws.pdf.readErr', null, 'Não foi possível ler o PDF'), 'close'); return; }

    const id = uid();
    try { await WorkspaceDB.putFile(id, buf); }
    catch (e) { toast(wsTr('ws.pdf.saveErr', null, 'Sem espaço para salvar este PDF'), 'close'); return; }

    const name = (file.name || 'Documento.pdf').replace(/\.pdf$/i, '');
    this.board.pdfs.push({ id, name, size: file.size, pages: 0, highlights: [] });

    const vpRect = this.els.viewport ? this.els.viewport.getBoundingClientRect() : { width: 1200, height: 800 };
    const w = clamp(Math.round((vpRect.width || 1200) * 0.45), 320, 560);
    const h = clamp(Math.round(w * 1.3), 420, 720);
    const p = at || this.centerWorld();
    const card = {
      id: uid(),
      type: 'pdf',
      pdfId: id,
      x: p.x - w / 2,
      y: p.y - h / 2,
      w,
      h,
      page: 1,
      zoom: 1,
      editMode: false,
      pdfMode: 'read',
      hlColor: WS_HL_COLORS[0].value,
      rotation: 0
    };
    this.board.cards.push(card);
    this.createCardEl(card);
    this.updateEmpty();
    await this.flushSave();
    this.select(card.id);
    this.renderPdfCard(card, true);
    toast(wsTr('ws.pdf.addedToast', null, 'PDF adicionado ao quadro'), 'file');
  },

  /* -------- imagens e prints -------- */
  async renderImageCard(card) {
    if (!this.entered || !card || card.type !== 'image') return;
    const node = this.cardEls.get(card.id);
    if (!node) return;
    const body = node.querySelector('.ws-img-body');
    const img = node.querySelector('.ws-img-stage img');
    if (!body || !img) return;

    let url = this.imgUrls.get(card.imgId);
    if (!url) {
      url = await WorkspaceDB.getFile(card.imgId).catch(() => null);
      if (url) this.imgUrls.set(card.imgId, url);
    }
    if (!url) return;
    if (img.src !== url) img.src = url;

    const meta = this.imgMeta(card);
    const bw = Math.max(40, Math.floor(body.clientWidth));
    const bh = Math.max(40, Math.floor(body.clientHeight));
    const natW = (meta && meta.natW) || img.naturalWidth || 400;
    const natH = (meta && meta.natH) || img.naturalHeight || 300;
    const zoom = clamp(wsNum(card.zoom, 1), 0.5, 4.0);
    const fit = Math.min(Math.max(24, bw - 16) / natW, Math.max(24, bh - 16) / natH);
    const dispW = Math.max(1, Math.round(natW * fit * zoom));
    const dispH = Math.max(1, Math.round(natH * fit * zoom));

    img.style.width = dispW + 'px';
    img.style.height = dispH + 'px';
    body.classList.toggle('is-zoomed', zoom > 1.01 || dispW > bw - 2 || dispH > bh - 2);

    const zVal = node.querySelector('.ws-pdf-zoomval');
    if (zVal) zVal.textContent = Math.round(zoom * 100) + '%';
    const zOut = node.querySelector('[data-imgact="zout"]');
    const zIn = node.querySelector('[data-imgact="zin"]');
    if (zOut) zOut.disabled = zoom <= 0.51;
    if (zIn) zIn.disabled = zoom >= 3.99;
  },

  setImageZoom(card, nextZoom) {
    if (!card || card.type !== 'image') return;
    const clamped = clamp(Math.round(nextZoom * 100) / 100, 0.5, 4.0);
    card.zoom = clamped;
    this.scheduleSave();
    this.renderImageCard(card);
  },

  async addImageFile(file, opts) {
    if (!file) return;
    opts = opts || {};
    const isImg = /^image\//.test(file.type || '') || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(file.name || '');
    if (!isImg) return;
    if ((this.board.images || []).length >= 25) {
      toast(wsTr('ws.img.limit', null, 'Limite de 25 imagens no quadro'), 'image');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast(wsTr('ws.img.tooBig', null, 'Imagem muito grande — use até 15 MB'), 'image');
      return;
    }
    let dataUrl;
    try { dataUrl = await readFileAsDataURL(file); }
    catch (e) { toast(wsTr('ws.img.readErr', null, 'Não foi possível ler a imagem'), 'close'); return; }

    const dims = await new Promise((resolve) => {
      const probe = new Image();
      probe.onload = () => resolve({ w: probe.naturalWidth || 420, h: probe.naturalHeight || 300 });
      probe.onerror = () => resolve({ w: 420, h: 300 });
      probe.src = dataUrl;
    });

    const id = uid();
    try { await WorkspaceDB.putFile(id, dataUrl); }
    catch (e) { toast(wsTr('ws.img.saveErr', null, 'Sem espaço para salvar a imagem'), 'close'); return; }

    this.imgUrls.set(id, dataUrl);
    const rawName = file.name && !/^image\./i.test(file.name) ? file.name.replace(/\.[^.]+$/, '') : (opts.fromPaste ? wsTr('ws.img.pastedName', null, 'Print colado') : wsTr('ws.card.image', null, 'Imagem'));
    this.board.images = this.board.images || [];
    this.board.images.push({ id, name: rawName, size: file.size || 0, natW: dims.w, natH: dims.h });

    const maxW = 460;
    const maxH = 480;
    const ratio = Math.min(maxW / dims.w, maxH / dims.h, 1);
    const w = clamp(Math.round(dims.w * ratio) + 16, 220, 520);
    const h = clamp(Math.round(dims.h * ratio) + 52, 160, 560);
    const p = opts.x != null ? opts : this.centerWorld();
    const card = {
      id: uid(),
      type: 'image',
      imgId: id,
      x: p.x - w / 2,
      y: p.y - h / 2,
      w,
      h,
      zoom: 1
    };
    this.board.cards.push(card);
    this.createCardEl(card);
    this.updateEmpty();
    await this.flushSave();
    this.select(card.id);
    this.renderImageCard(card);
    toast(opts.fromPaste ? wsTr('ws.img.pasted', null, 'Print colado no quadro') : wsTr('ws.img.added', null, 'Imagem adicionada ao quadro'), 'image');
  },

  onImagePointerDown(e, card, body) {
    if (e.button !== 0 && e.button !== 2) return;
    if (e.target.closest('button, input')) return;
    const br = body.getBoundingClientRect();
    if (e.clientX - br.left > body.clientWidth || e.clientY - br.top > body.clientHeight) return;
    e.preventDefault();
    e.stopPropagation();
    this.select(card.id);
    const scrollable = body.scrollWidth > body.clientWidth + 2 || body.scrollHeight > body.clientHeight + 2;
    this.imgPan = {
      card,
      body,
      button: e.button,
      scrollable,
      startX: e.clientX,
      startY: e.clientY,
      scrollX: body.scrollLeft,
      scrollY: body.scrollTop,
      cardStart: this.screenToWorld(e.clientX, e.clientY),
      cardOrig: { x: card.x, y: card.y },
      moved: false
    };
    body.classList.add('panning');
  },

  revealSource(noteCard) {
    if (!noteCard.source) return;
    const pdf = this.board.cards.find(c => c.type === 'pdf' && c.pdfId === noteCard.source.pdfId);
    if (!pdf) { toast(wsTr('ws.pdf.sourceMissing', null, 'O PDF de origem não está mais no quadro'), 'file'); return; }
    pdf.page = Math.max(1, noteCard.source.page || 1);
    this.pdfRendered.delete(pdf.id);
    this.renderPdfCard(pdf, true);
    const r = this.els.viewport.getBoundingClientRect();
    const v = this.board.view;
    v.x = r.width / 2 - (pdf.x + pdf.w / 2) * v.scale;
    v.y = r.height / 2 - (pdf.y + pdf.h / 2) * v.scale;
    this.applyView();
    this.scheduleSave();
    this.select(pdf.id);
  },

  /* -------- destaques -------- */
  renderHighlights(card) {
    const node = this.cardEls.get(card.id);
    if (!node) return;
    const layer = node.querySelector('.ws-hl-layer');
    const meta = this.pdfMeta(card);
    const dims = this.pdfPageDims.get(card.id);
    if (!layer || !meta || !dims) return;
    layer.style.width = dims.w + 'px';
    layer.style.height = dims.h + 'px';
    layer.innerHTML = '';
    (meta.highlights || []).forEach(h => {
      if (h.page !== card.page) return;
      h.rects.forEach(r => {
        const mark = el('i', 'ws-hl');
        mark.style.left = (r.x * 100).toFixed(3) + '%';
        mark.style.top = (r.y * 100).toFixed(3) + '%';
        mark.style.width = (r.w * 100).toFixed(3) + '%';
        mark.style.height = (r.h * 100).toFixed(3) + '%';
        mark.style.background = h.color;
        layer.append(mark);
      });
    });
  },

  openHighlights(card) {
    const meta = this.pdfMeta(card);
    if (!meta) return;
    const list = (meta.highlights || []).filter(h => h.page === card.page);
    if (!list.length) {
      toast(wsTr('ws.pdf.hlNone', null, 'Nenhum destaque nesta página'), 'highlight');
      return;
    }
    const delHlLabel = wsTr('ws.pdf.hlDel', null, 'Remover destaque');
    let html = '<p class="ws-pop-title">' + wsEscape(wsTr('ws.pdf.hlHead', { page: card.page }, 'Destaques · p. ' + card.page)) + '</p><div class="ws-hl-list">';
    list.forEach(h => {
      html += '<div class="ws-hl-item">' +
        '<i style="background:' + h.color + '"></i>' +
        '<span title="' + wsEscape(h.text) + '">' + wsEscape((h.text || '…').slice(0, 72)) + '</span>' +
        '<button data-hldel="' + h.id + '" title="' + wsEscape(delHlLabel) + '">' + svgIcon('trash') + '</button></div>';
    });
    html += '</div><p class="ws-pop-note">' + wsEscape(wsTr('ws.pdf.hlNote', null, 'Os destaques ficam salvos com o PDF.')) + '</p>';
    const pop = this.openCustomPopover(html);
    pop.addEventListener('click', (e) => {
      const b = e.target.closest('[data-hldel]');
      if (!b) return;
      meta.highlights = (meta.highlights || []).filter(h => h.id !== b.dataset.hldel);
      this.renderHighlights(card);
      this.scheduleSave();
      this.openHighlights(card);
    });
  },

  /* -------- eventos gerais e gestos de touchpad -------- */
  panBy(dx, dy) {
    if (!this.board) return;
    const v = this.board.view;
    v.x += dx;
    v.y += dy;
    this.applyView();
    this.scheduleSave();
    this.schedulePdfRefresh();
  },

  handleBoardWheel(e) {
    if (!this.entered || !this.board) return;
    e.preventDefault();
    e.stopPropagation();
    const gesture = typeof classifyWheelGesture === 'function'
      ? classifyWheelGesture(e, this.wheelState)
      : ((e.ctrlKey || e.metaKey) ? 'zoom' : 'zoom');

    if (gesture === 'pan') {
      const mult = e.deltaMode === 1 ? 16 : (e.deltaMode === 2 ? 120 : 1);
      this.panBy(-(e.deltaX || 0) * mult, -(e.deltaY || 0) * mult);
      return;
    }
    const sens = (e.ctrlKey || e.metaKey) && Math.abs(e.deltaY) < 25 ? 0.01 : 0.0016;
    const factor = Math.exp(-clamp(e.deltaY || 0, -160, 160) * sens);
    this.zoomAt(e.clientX, e.clientY, factor);
  },

  trackTouchStart(e) {
    if (e.pointerType !== 'touch') return false;
    this.touchPtrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.touchPtrs.size >= 2) {
      const pts = Array.from(this.touchPtrs.values()).slice(0, 2);
      const cx = (pts[0].x + pts[1].x) / 2;
      const cy = (pts[0].y + pts[1].y) / 2;
      const dist = Math.max(12, Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y));
      this.touchPinch = { cx, cy, dist };
      if (this.inkStroke && (!this.inkStroke.points || (this.inkStroke.points.length <= 4 && performance.now() - (this.inkStroke.startedAt || 0) < 160))) {
        this.inkStroke = null;
        this.renderInk();
        this.updateEmpty();
      }
      if (this.panning) {
        this.els.viewport.classList.remove('panning');
        this.panning = null;
      }
      return true;
    }
    return false;
  },

  trackTouchMove(e) {
    if (e.pointerType !== 'touch' || !this.touchPtrs.has(e.pointerId)) return false;
    this.touchPtrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.touchPtrs.size >= 2 && this.touchPinch && this.board) {
      const pts = Array.from(this.touchPtrs.values()).slice(0, 2);
      const cx = (pts[0].x + pts[1].x) / 2;
      const cy = (pts[0].y + pts[1].y) / 2;
      const dist = Math.max(12, Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y));
      const dx = cx - this.touchPinch.cx;
      const dy = cy - this.touchPinch.cy;
      const v = this.board.view;
      v.x += dx;
      v.y += dy;
      const ratio = dist / this.touchPinch.dist;
      if (Math.abs(ratio - 1) > 0.008) {
        const r = this.els.viewport.getBoundingClientRect();
        const px = cx - r.left;
        const py = cy - r.top;
        const ns = clamp(v.scale * ratio, 0.2, 4.0);
        if (ns !== v.scale) {
          v.x = px - (px - v.x) * (ns / v.scale);
          v.y = py - (py - v.y) * (ns / v.scale);
          v.scale = ns;
        }
        this.touchPinch.dist = dist;
      }
      this.touchPinch.cx = cx;
      this.touchPinch.cy = cy;
      this.applyView();
      return true;
    }
    return false;
  },

  trackTouchEnd(e) {
    if (e.pointerType !== 'touch') return false;
    this.touchPtrs.delete(e.pointerId);
    if (this.touchPtrs.size < 2 && this.touchPinch) {
      this.touchPinch = null;
      this.scheduleSave();
      this.schedulePdfRefresh();
      return true;
    }
    return false;
  },

  bindEvents() {
    const vp = this.els.viewport;

    vp.addEventListener('pointerdown', (e) => this.onViewportPointerDown(e));
    vp.addEventListener('wheel', (e) => this.handleBoardWheel(e), { passive: false });

    vp.addEventListener('dblclick', (e) => {
      if (this.drawMode) return;
      if (e.target.closest('.ws-card, .ws-topbar, .ws-zoom, .ws-timer, .ws-popover, .ws-sel-tools, .ws-arrow-tools, .ws-empty')) return;
      const p = this.screenToWorld(e.clientX, e.clientY);
      this.addNote({ x: p.x - 140, y: p.y - 85, focus: true });
    });

    document.addEventListener('pointermove', (e) => this.onPointerMove(e));
    document.addEventListener('pointerup', (e) => this.onPointerUp(e));
    document.addEventListener('pointercancel', (e) => this.onPointerUp(e));
    document.addEventListener('pointerdown', (e) => this.onDocPointerDown(e));
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('contextmenu', (e) => {
      if (this.suppressContextMenu) {
        e.preventDefault();
        this.suppressContextMenu = false;
      }
    });
    document.addEventListener('selectionchange', () => {
      if (!this.entered) return;
      const ae = document.activeElement;
      if (ae && ae.classList && ae.classList.contains('ws-note-body') && typeof ae._syncToolbar === 'function') {
        ae._syncToolbar();
      }
    });
    document.addEventListener('paste', async (e) => {
      if (!this.entered || !this.board) return;
      if (document.body.classList.contains('panel-open') || this.confirmOpen) return;
      const ae = document.activeElement;
      const tag = (ae && ae.tagName || '').toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (ae && ae.isContentEditable)) return;
      const cd = e.clipboardData;
      if (!cd) return;
      const files = [];
      if (cd.items) {
        for (let i = 0; i < cd.items.length; i++) {
          const it = cd.items[i];
          if (it.kind === 'file' && /^image\//.test(it.type || '')) {
            const f = it.getAsFile();
            if (f) files.push(f);
          }
        }
      }
      if (!files.length && cd.files) {
        for (let i = 0; i < cd.files.length; i++) {
          if (/^image\//.test(cd.files[i].type || '')) files.push(cd.files[i]);
        }
      }
      if (files.length) {
        e.preventDefault();
        const at = this.centerWorld();
        for (let i = 0; i < files.length; i++) {
          await this.addImageFile(files[i], { x: at.x + i * 26, y: at.y + i * 26, fromPaste: true });
        }
        return;
      }
      const rawText = cd.getData('text/plain');
      if (typeof rawText === 'string' && rawText.trim()) {
        const clean = rawText.replace(/\r\n?/g, '\n').replace(/^\n+|\n+$/g, '').slice(0, 12000);
        if (clean.trim()) {
          e.preventDefault();
          this.addNote({ text: clean, w: 280, h: 170, focus: false });
          toast(wsTr('ws.note.pastedToast', null, 'Nota colada na área de trabalho'), 'file');
        }
      }
    });

    window.addEventListener('resize', () => {
      if (!this.board) return;
      this.applyTimerPosition();
      if (!this.els.timerSettings.hidden) this.positionTimerSettings();
    });

    this.els.selTools.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.els.selTools.addEventListener('click', (e) => {
      const dot = e.target.closest('[data-hlcolor]');
      if (dot) { this.applyHighlight(dot.dataset.hlcolor); return; }
      if (e.target.closest('[data-selcard]')) this.selectionToCard();
    });

    if (this.els.multiTools) {
      this.els.multiTools.addEventListener('pointerdown', (e) => e.stopPropagation());
      this.els.multiTools.addEventListener('click', (e) => {
        const b = e.target.closest('[data-mact]');
        if (!b) return;
        if (b.dataset.mact === 'del') this.deleteSelected();
        else if (b.dataset.mact === 'clear') this.select(null);
      });
    }

    this.els.filePdf.addEventListener('change', () => {
      const files = Array.from(this.els.filePdf.files || []);
      this.els.filePdf.value = '';
      const at = this.centerWorld();
      files.forEach((f, i) => this.addPdfFile(f, { x: at.x + i * 26, y: at.y + i * 26 }));
    });

    this.els.fileImg.addEventListener('change', () => {
      const files = Array.from(this.els.fileImg.files || []);
      this.els.fileImg.value = '';
      const at = this.centerWorld();
      files.forEach((f, i) => this.addImageFile(f, { x: at.x + i * 26, y: at.y + i * 26 }));
    });

    this.els.fileBg.addEventListener('change', () => {
      const f = (this.els.fileBg.files || [])[0];
      this.els.fileBg.value = '';
      if (f) this.setBgImageFile(f);
    });

    if (this.els.fileImport) {
      this.els.fileImport.addEventListener('change', () => {
        const f = (this.els.fileImport.files || [])[0];
        this.els.fileImport.value = '';
        if (f) this.importWorkspaceFile(f);
      });
    }

    const shell = this.els.shell;
    const hasFiles = (e) => !!(e.dataTransfer && Array.from(e.dataTransfer.types || []).indexOf('Files') >= 0);
    shell.addEventListener('dragenter', (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      shell.classList.add('drop-active');
    });
    shell.addEventListener('dragover', (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
      shell.classList.add('drop-active');
    });
    shell.addEventListener('dragleave', (e) => {
      if (e.target === shell || !shell.contains(e.relatedTarget)) shell.classList.remove('drop-active');
    });
    shell.addEventListener('drop', async (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      shell.classList.remove('drop-active');
      const files = Array.from(e.dataTransfer.files || []);
      const at = this.screenToWorld(e.clientX, e.clientY);
      let i = 0;
      for (const f of files) {
        if (/\.fluxo$/i.test(f.name || '')) {
          await this.importWorkspaceFile(f);
          return;
        }
        if (f.type === 'application/pdf' || /\.pdf$/i.test(f.name || '')) {
          await this.addPdfFile(f, { x: at.x + i * 26, y: at.y + i * 26 });
          i++;
        } else if (/^image\//.test(f.type) || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(f.name || '')) {
          await this.addImageFile(f, { x: at.x + i * 26, y: at.y + i * 26 });
          i++;
        }
      }
    });

    window.addEventListener('pagehide', () => this.flushSave());
    window.addEventListener('resize', () => {
      this.resizeInkCanvas();
      this.renderInk();
      this.positionInkBar();
      this.positionInkSettings();
      this.syncDockClearance();
    });
    document.addEventListener('keyup', (e) => {
      if (e.key === 'Shift') {
        if (this.cardDrag) this.applyCardDragPositions(this.cardDrag, false);
        else if (this.strokeDrag) this.applyStrokeDragPositions(this.strokeDrag, false);
        else if (this.cardResize) this.applyCardResize(this.cardResize, false);
        else this.hideSnapOverlay();
      }
      if ((e.code === 'Space' || e.key === 'Alt') && this.inkSpacePan) {
        if (this.drawMode) e.preventDefault();
        this.inkSpacePan = false;
        this.syncInkPanCursor();
        if (this.drawMode) this.renderInkBar();
      }
      if (e.code === 'Space' && this.selectSpacePan) {
        this.selectSpacePan = false;
        if (this.els.shell) this.els.shell.classList.remove('space-pan');
      }
    });
    window.addEventListener('blur', () => {
      if (this.inkSpacePan) {
        this.inkSpacePan = false;
        this.syncInkPanCursor();
      }
      if (this.selectSpacePan) {
        this.selectSpacePan = false;
        if (this.els.shell) this.els.shell.classList.remove('space-pan');
      }
      this.hideSnapOverlay();
      this.finishMarquee(false);
      this.touchPtrs.clear();
      this.touchPinch = null;
    });
  },

  /* -------- escrita livre / mesa digitalizadora -------- */
  inkCfg() {
    if (this.board) {
      if (!this.board.ink && typeof defaultInkConfig === 'function') this.board.ink = defaultInkConfig();
      if (this.board.ink) return this.board.ink;
    }
    if (!this._fallbackInk) {
      this._fallbackInk = typeof defaultInkConfig === 'function' ? defaultInkConfig() : {
        tool: this.inkTool || 'pen',
        color: this.inkColor || '#edf1ff',
        size: this.inkSize || 4.5,
        nib: 'round',
        smoothing: 35,
        pressureVar: 65,
        cursorShape: this.inkCursorShape || 'auto',
        orientation: 'horizontal',
        position: 'top',
        freeX: null,
        freeY: null,
        collapsed: false
      };
    }
    return this._fallbackInk;
  },

  syncInkRefs() {
    const c = this.inkCfg();
    this.inkTool = c.tool;
    this.inkColor = c.color;
    this.inkSize = c.size;
    this.inkCursorShape = c.cursorShape;
  },

  patchInkCfg(patch, persist) {
    const c = this.inkCfg();
    Object.assign(c, patch);
    if (this.board && typeof normalizeInkConfig === 'function') {
      this.board.ink = normalizeInkConfig(c);
    }
    this.syncInkRefs();
    this.applyInkCursor();
    this.renderInkBar();
    this.renderInkSettings();
    if (persist !== false) this.scheduleSave();
  },

  nibPreviewSvg(nibId) {
    if (nibId === 'fountain') {
      return '<svg viewBox="0 0 28 18" aria-hidden="true"><path d="M3 14c4-6 7-9 10-8s5 5 12-2" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M12 6c2 0 4 4 7 2" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>';
    }
    if (nibId === 'chisel') {
      return '<svg viewBox="0 0 28 18" aria-hidden="true"><path d="M5 13 13 5l10 8-4 2-6-5-5 5z" fill="currentColor"/></svg>';
    }
    if (nibId === 'fine') {
      return '<svg viewBox="0 0 28 18" aria-hidden="true"><path d="M3 13c5-5 11-9 22-7" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
    }
    return '<svg viewBox="0 0 28 18" aria-hidden="true"><path d="M3 13c5-7 11-7 22-2" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg>';
  },

  buildInkBar() {
    const bar = this.els.inkBar;
    if (!bar) return;
    bar.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      const grip = e.target.closest('.ws-ink-grip');
      if (grip && e.button === 0) {
        e.preventDefault();
        const sr = this.els.shell.getBoundingClientRect();
        const br = bar.getBoundingClientRect();
        this.inkBarDrag = {
          id: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          origX: br.left - sr.left,
          origY: br.top - sr.top,
          moved: false
        };
        bar.classList.add('dragging');
      }
    });
    bar.addEventListener('click', (e) => {
      const anyBtn = e.target.closest('button');
      if (anyBtn && typeof anyBtn.blur === 'function') anyBtn.blur();
      const tBtn = e.target.closest('[data-inktool]');
      if (tBtn) {
        this.inkHandLock = false;
        this.patchInkCfg({ tool: tBtn.dataset.inktool });
        this.syncInkPanCursor();
        return;
      }
      const cBtn = e.target.closest('[data-inkcolor]');
      if (cBtn) {
        this.inkHandLock = false;
        const cur = this.inkCfg();
        this.patchInkCfg({
          color: cBtn.dataset.inkcolor,
          tool: cur.tool === 'eraser' ? 'pen' : cur.tool
        });
        this.syncInkPanCursor();
        return;
      }
      const sBtn = e.target.closest('[data-inksize]');
      if (sBtn) {
        this.patchInkCfg({ size: Number(sBtn.dataset.inksize) || 4.5 });
        return;
      }
      const act = e.target.closest('[data-inkact]');
      if (!act) return;
      const cmd = act.dataset.inkact;
      if (cmd === 'hand') {
        this.inkHandLock = !this.inkHandLock;
        this.syncInkPanCursor();
        this.renderInkBar();
      }
      else if (cmd === 'undo') this.undoInk();
      else if (cmd === 'redo') this.redoInk();
      else if (cmd === 'clear') this.clearInk();
      else if (cmd === 'collapse') this.patchInkCfg({ collapsed: !this.inkCfg().collapsed });
      else if (cmd === 'settings') this.toggleInkSettings();
      else if (cmd === 'done') this.setDrawMode(false);
    });
    bar.addEventListener('input', (e) => {
      const pick = e.target.closest('[data-inkpick]');
      if (!pick) return;
      const cur = this.inkCfg();
      this.patchInkCfg({
        color: pick.value,
        tool: cur.tool === 'eraser' ? 'pen' : cur.tool
      });
    });

    const setEl = this.els.inkSettings;
    if (setEl) {
      setEl.addEventListener('pointerdown', (e) => e.stopPropagation());
      setEl.addEventListener('click', (e) => {
        if (e.target.closest('[data-inksetclose]')) {
          this.closeInkSettings();
          return;
        }
        const nib = e.target.closest('[data-inknib]');
        if (nib) { this.patchInkCfg({ nib: nib.dataset.inknib }); return; }
        const cur = e.target.closest('[data-inkcur]');
        if (cur) { this.patchInkCfg({ cursorShape: cur.dataset.inkcur }); return; }
        const ori = e.target.closest('[data-inkori]');
        if (ori) {
          this.patchInkCfg({ orientation: ori.dataset.inkori });
          return;
        }
        const pos = e.target.closest('[data-inkpos]');
        if (pos) {
          const p = pos.dataset.inkpos;
          const next = { position: p };
          if (p === 'left' || p === 'right') next.orientation = 'vertical';
          else if (p === 'top' || p === 'bottom') next.orientation = 'horizontal';
          if (p === 'free') {
            const c = this.inkCfg();
            if (c.freeX == null || c.freeY == null) {
              const sr = this.els.shell.getBoundingClientRect();
              const br = this.els.inkBar.getBoundingClientRect();
              next.freeX = Math.round(br.left - sr.left);
              next.freeY = Math.round(br.top - sr.top);
            }
          }
          this.patchInkCfg(next);
          return;
        }
        const col = e.target.closest('[data-inkcol]');
        if (col) {
          this.patchInkCfg({ collapsed: col.dataset.inkcol === '1' });
        }
      });
      setEl.addEventListener('input', (e) => {
        const sl = e.target.closest('[data-inkrange]');
        if (!sl) return;
        const key = sl.dataset.inkrange;
        const val = Number(sl.value);
        if (key === 'smoothing' || key === 'pressureVar') {
          this.inkCfg()[key] = val;
          const out = setEl.querySelector('[data-inkval="' + key + '"]');
          if (out) out.textContent = val + '%';
          this.scheduleSave();
        }
      });
    }

    const ic = this.els.inkCanvas;
    if (ic) {
      ic.addEventListener('pointerdown', (e) => this.onInkPointerDown(e));
      ic.addEventListener('pointermove', (e) => this.onInkPointerMove(e));
      ic.addEventListener('pointerup', (e) => this.onInkPointerUp(e));
      ic.addEventListener('pointercancel', (e) => this.onInkPointerUp(e));
      ic.addEventListener('pointerleave', () => this.setHoveredGrip(null));
      ic.addEventListener('contextmenu', (e) => {
        if (this.drawMode || this.suppressContextMenu) e.preventDefault();
      });
      ic.addEventListener('wheel', (e) => this.handleBoardWheel(e), { passive: false });
    }
    this.syncInkRefs();
    this.renderInkBar();
  },

  renderInkBar() {
    const bar = this.els.inkBar;
    if (!bar) return;
    const cfg = this.inkCfg();
    this.syncInkRefs();
    const isVert = cfg.orientation === 'vertical';
    const isCollapsed = !!cfg.collapsed;

    bar.classList.toggle('vertical', isVert);
    bar.classList.toggle('collapsed', isCollapsed);

    const dragGripTitle = wsTr('ws.ink.dragGrip', null, 'Arrastar barra de escrita (posição livre)');
    const dragGripAria = wsTr('ws.ink.gripAria', null, 'Arrastar barra de escrita');
    const grip = '<button type="button" class="ws-ink-grip" title="' + wsEscape(dragGripTitle) + '" aria-label="' + wsEscape(dragGripAria) + '">' + svgIcon('grip') + '</button>';

    const penLabel = wsTr('ws.ink.pen', null, 'Caneta');
    const markerLabel = wsTr('ws.ink.marker', null, 'Marcador');
    const eraserLabel = wsTr('ws.ink.eraser', null, 'Borracha');
    const moveLabel = wsTr('ws.ink.move', null, 'Mover');
    const doneLabel = wsTr('ws.ink.done', null, 'Concluir');
    const doneTip = wsTr('ws.ink.doneTitle', null, 'Sair do modo de escrita (Esc)');
    const settingsTip = wsTr('ws.ink.settingsTitle', null, 'Configurações de escrita');

    if (isCollapsed) {
      const toolIcon = cfg.tool === 'eraser' ? 'eraser' : (cfg.tool === 'marker' ? 'highlight' : 'pen');
      const expandIcon = isVert ? 'chevR' : 'chevD';
      const expandTip = wsTr('ws.ink.expand', null, 'Expandir barra');
      bar.innerHTML =
        grip +
        '<div class="ws-ink-badge" title="' + wsEscape(wsTr('ws.ink.activeBadge', null, 'Ferramenta e cor ativas')) + '">' +
          svgIcon(toolIcon) +
          (cfg.tool !== 'eraser' ? '<span class="ws-ink-badge-dot" style="background:' + cfg.color + '"></span>' : '') +
          '<span>' + wsEscape(cfg.tool === 'eraser' ? eraserLabel : (cfg.tool === 'marker' ? markerLabel : penLabel)) + '</span>' +
        '</div>' +
        '<button type="button" class="ws-ink-btn' + (this.inkSettingsOpen ? ' active' : '') + '" data-inkact="settings" title="' + wsEscape(settingsTip) + '" aria-expanded="' + (this.inkSettingsOpen ? 'true' : 'false') + '">' + svgIcon('sliders') + '</button>' +
        '<button type="button" class="ws-ink-btn" data-inkact="collapse" title="' + wsEscape(expandTip) + '" aria-label="' + wsEscape(expandTip) + '">' + svgIcon(expandIcon) + '</button>' +
        '<button type="button" class="ws-ink-btn" data-inkact="done" title="' + wsEscape(doneTip) + '" aria-label="' + wsEscape(doneLabel) + '">' + svgIcon('close') + '</button>';
      if (!bar.hidden) {
        this.positionInkBar();
        if (this.inkSettingsOpen) this.positionInkSettings();
      }
      return;
    }

    const colors = (typeof INK_COLORS !== 'undefined' ? INK_COLORS : [])
      .map(c => {
        const lbl = wsColorLabel(c);
        return '<button type="button" class="ws-ink-dot' + (cfg.color.toLowerCase() === c.value.toLowerCase() && cfg.tool !== 'eraser' ? ' active' : '') + '" data-inkcolor="' + c.value + '" title="' + wsEscape(lbl) + '" aria-label="' + wsEscape(wsTr('ws.noteColorLabel', { label: lbl }, 'Cor ' + lbl)) + '" style="background:' + c.value + '"></button>';
      })
      .join('');
    const sizes = (typeof INK_SIZES !== 'undefined' ? INK_SIZES : [])
      .map(s => {
        const lbl = wsTr('ws.ink.size.' + s.id, null, s.label);
        return '<button type="button" class="ws-ink-size' + (Math.abs(cfg.size - s.size) < 0.2 ? ' active' : '') + '" data-inksize="' + s.size + '" title="' + wsEscape(wsTr('ws.ink.sizeTip', { label: lbl }, 'Espessura ' + lbl)) + '">' + wsEscape(isVert ? lbl[0] : lbl) + '</button>';
      })
      .join('');
    const hasStrokes = !!(this.board && this.board.strokes && this.board.strokes.length);
    const collapseIcon = isVert ? 'chevL' : 'chevU';
    const collapseTip = wsTr('ws.ink.collapse', null, 'Retrair barra');

    const panReady = !!(this.inkSpacePan || this.inkHandLock);
    bar.innerHTML =
      grip +
      '<div class="ws-ink-group">' +
        '<button type="button" class="ws-ink-btn' + (!panReady && cfg.tool === 'pen' ? ' active' : '') + '" data-inktool="pen" title="' + wsEscape(wsTr('ws.ink.penTip', null, 'Caneta (suporta mesa digitalizadora)')) + '">' + svgIcon('pen') + '<span>' + wsEscape(penLabel) + '</span></button>' +
        '<button type="button" class="ws-ink-btn' + (!panReady && cfg.tool === 'marker' ? ' active' : '') + '" data-inktool="marker" title="' + wsEscape(wsTr('ws.ink.markerTip', null, 'Marca-texto')) + '">' + svgIcon('highlight') + '<span>' + wsEscape(markerLabel) + '</span></button>' +
        '<button type="button" class="ws-ink-btn' + (!panReady && cfg.tool === 'eraser' ? ' active' : '') + '" data-inktool="eraser" title="' + wsEscape(wsTr('ws.ink.eraserTip', null, 'Borracha')) + '">' + svgIcon('eraser') + '<span>' + wsEscape(eraserLabel) + '</span></button>' +
        '<button type="button" class="ws-ink-btn' + (panReady ? ' active' : '') + '" data-inkact="hand" title="' + wsEscape(wsTr('ws.ink.moveTip', null, 'Destravar mouse para arrastar (segure Espaço ou Alt, ou tecle H)')) + '" aria-pressed="' + (panReady ? 'true' : 'false') + '">' + svgIcon('hand') + '<span>' + wsEscape(moveLabel) + '</span></button>' +
      '</div>' +
      '<span class="ws-ink-sep"></span>' +
      '<div class="ws-ink-colors">' +
        colors +
        '<input type="color" class="ws-ink-pick" data-inkpick value="' + cfg.color + '" title="' + wsEscape(wsTr('ws.ink.otherColor', null, 'Outra cor')) + '">' +
      '</div>' +
      '<span class="ws-ink-sep"></span>' +
      '<div class="ws-ink-group">' + sizes + '</div>' +
      '<span class="ws-ink-sep"></span>' +
      '<div class="ws-ink-group">' +
        '<button type="button" class="ws-ink-btn' + (this.inkSettingsOpen ? ' active' : '') + '" data-inkact="settings" title="' + wsEscape(wsTr('ws.ink.toolsTip', null, 'Precisão, pressão, ponta e disposição da barra')) + '" aria-expanded="' + (this.inkSettingsOpen ? 'true' : 'false') + '">' + svgIcon('sliders') + '<span>' + wsEscape(wsTr('ws.ink.tools', null, 'Ajustes')) + '</span></button>' +
        '<button type="button" class="ws-ink-btn" data-inkact="undo" title="' + wsEscape(wsTr('ws.ink.undoTip', null, 'Desfazer traço (Ctrl+Z)')) + '"' + (this.inkUndo.length ? '' : ' disabled') + '>' + svgIcon('undo') + '</button>' +
        '<button type="button" class="ws-ink-btn" data-inkact="redo" title="' + wsEscape(wsTr('ws.ink.redoTip', null, 'Refazer traço (Ctrl+Y)')) + '"' + (this.inkRedo.length ? '' : ' disabled') + '>' + svgIcon('redo') + '</button>' +
        '<button type="button" class="ws-ink-btn" data-inkact="clear" title="' + wsEscape(wsTr('ws.ink.clearTip', null, 'Apagar todos os desenhos')) + '"' + (hasStrokes ? '' : ' disabled') + '>' + svgIcon('trash') + '</button>' +
        '<button type="button" class="ws-ink-btn" data-inkact="collapse" title="' + wsEscape(collapseTip) + '" aria-label="' + wsEscape(collapseTip) + '">' + svgIcon(collapseIcon) + '</button>' +
      '</div>' +
      '<button type="button" class="ws-ink-done" data-inkact="done" title="' + wsEscape(doneTip) + '" aria-label="' + wsEscape(doneLabel) + '">' + (isVert ? svgIcon('check') : wsEscape(doneLabel)) + '</button>';

    if (!bar.hidden) {
      this.positionInkBar();
      if (this.inkSettingsOpen) this.positionInkSettings();
    }
  },

  toggleInkSettings() {
    if (this.inkSettingsOpen) this.closeInkSettings();
    else this.openInkSettings();
  },

  openInkSettings() {
    this.inkSettingsOpen = true;
    this.renderInkBar();
    this.renderInkSettings();
    if (this.els.inkSettings) this.els.inkSettings.hidden = false;
    this.positionInkSettings();
  },

  closeInkSettings() {
    if (!this.inkSettingsOpen && (!this.els.inkSettings || this.els.inkSettings.hidden)) return;
    this.inkSettingsOpen = false;
    if (this.els.inkSettings) this.els.inkSettings.hidden = true;
    this.renderInkBar();
  },

  renderInkSettings() {
    const box = this.els.inkSettings;
    if (!box) return;
    if (!this.inkSettingsOpen) { box.hidden = true; return; }
    const cfg = this.inkCfg();
    const nibs = (typeof INK_NIBS !== 'undefined' ? INK_NIBS : []).map(n => {
      const lbl = wsTr('ws.ink.nib.' + n.id, null, n.label);
      const desc = wsTr('ws.ink.nibDesc.' + n.id, null, n.desc);
      return '<button type="button" class="ws-ink-nib' + (cfg.nib === n.id ? ' active' : '') + '" data-inknib="' + n.id + '" title="' + wsEscape(desc) + '">' +
        this.nibPreviewSvg(n.id) + '<span>' + wsEscape(lbl) + '</span></button>';
    }).join('');
    const cursors = [
      { id: 'auto', label: wsTr('ws.ink.curAuto', null, 'Auto') },
      { id: 'dot', label: wsTr('ws.ink.curDot', null, 'Ponto') },
      { id: 'cross', label: wsTr('ws.ink.curCross', null, 'Cruz') }
    ].map(c =>
      '<button type="button" class="ws-ink-segbtn' + (cfg.cursorShape === c.id ? ' active' : '') + '" data-inkcur="' + c.id + '">' + wsEscape(c.label) + '</button>'
    ).join('');
    const oris = [
      { id: 'horizontal', label: wsTr('ws.ink.oriHoriz', null, 'Horizontal') },
      { id: 'vertical', label: wsTr('ws.ink.oriVert', null, 'Vertical') }
    ].map(o =>
      '<button type="button" class="ws-ink-segbtn' + (cfg.orientation === o.id ? ' active' : '') + '" data-inkori="' + o.id + '">' + wsEscape(o.label) + '</button>'
    ).join('');
    const poses = (typeof INK_BAR_POSITIONS !== 'undefined' ? INK_BAR_POSITIONS : []).map(p =>
      '<button type="button" class="ws-ink-segbtn' + (cfg.position === p.id ? ' active' : '') + '" data-inkpos="' + p.id + '">' + wsEscape(wsTr('ws.ink.pos.' + p.id, null, p.label)) + '</button>'
    ).join('');

    box.innerHTML =
      '<div class="ws-ink-sethead">' +
        '<p class="ws-pop-title">' + wsEscape(wsTr('ws.ink.settings', null, 'Ajustes da escrita')) + '</p>' +
        '<button type="button" class="ws-card-btn" data-inksetclose title="' + wsEscape(wsTr('ws.ink.close', null, 'Fechar')) + '">' + svgIcon('close') + '</button>' +
      '</div>' +
      '<div class="ws-tset-group" style="margin-top:8px;padding-top:10px">' +
        '<h4>' + wsEscape(wsTr('ws.ink.nibSub', null, 'Ponta da caneta')) + '</h4>' +
        '<p class="ws-tset-hint">' + wsEscape(wsTr('ws.ink.nibHint', null, 'Muda o formato e a resposta direcional do traço.')) + '</p>' +
        '<div class="ws-ink-nibs">' + nibs + '</div>' +
      '</div>' +
      '<div class="ws-tset-group">' +
        '<h4>' + wsEscape(wsTr('ws.ink.pressSmoothSub', null, 'Precisão e pressão')) + '</h4>' +
        '<label class="ws-range-row">' +
          '<span>' + wsEscape(wsTr('ws.ink.smoothVal', null, 'Precisão / suavização')) + ' <b data-inkval="smoothing">' + cfg.smoothing + '%</b></span>' +
          '<input type="range" min="0" max="100" step="5" data-inkrange="smoothing" value="' + cfg.smoothing + '">' +
        '</label>' +
        '<label class="ws-range-row">' +
          '<span>' + wsEscape(wsTr('ws.ink.pressVal', null, 'Variação de pressão')) + ' <b data-inkval="pressureVar">' + cfg.pressureVar + '%</b></span>' +
          '<input type="range" min="0" max="100" step="5" data-inkrange="pressureVar" value="' + cfg.pressureVar + '">' +
        '</label>' +
      '</div>' +
      '<div class="ws-tset-group">' +
        '<h4>' + wsEscape(wsTr('ws.ink.cursorSub', null, 'Ponteiro')) + '</h4>' +
        '<div class="ws-ink-seg">' + cursors + '</div>' +
      '</div>' +
      '<div class="ws-tset-group">' +
        '<h4>' + wsEscape(wsTr('ws.ink.barLayoutSub', null, 'Disposição da barra')) + '</h4>' +
        '<p class="ws-tset-hint">' + wsEscape(wsTr('ws.ink.barLayoutHint', null, 'Alinhe nos topos, laterais ou arraste pela alça.')) + '</p>' +
        '<div class="ws-ink-seg">' + oris + '</div>' +
        '<div class="ws-ink-seg">' + poses + '</div>' +
        '<div class="ws-ink-seg">' +
          '<button type="button" class="ws-ink-segbtn' + (!cfg.collapsed ? ' active' : '') + '" data-inkcol="0">' + wsEscape(wsTr('ws.ink.expanded', null, 'Expandida')) + '</button>' +
          '<button type="button" class="ws-ink-segbtn' + (cfg.collapsed ? ' active' : '') + '" data-inkcol="1">' + wsEscape(wsTr('ws.ink.collapsed', null, 'Retraída')) + '</button>' +
        '</div>' +
      '</div>';
    box.hidden = false;
  },

  positionInkSettings() {
    const box = this.els.inkSettings;
    const bar = this.els.inkBar;
    const shell = this.els.shell;
    if (!box || !bar || !shell || !this.inkSettingsOpen || bar.hidden) return;
    const sr = shell.getBoundingClientRect();
    const br = bar.getBoundingClientRect();
    const sw = box.offsetWidth || 292;
    const sh = box.offsetHeight || 380;
    const cfg = this.inkCfg();

    let left = br.left - sr.left + (br.width - sw) / 2;
    let top = br.bottom - sr.top + 8;

    if (cfg.position === 'left') {
      left = br.right - sr.left + 10;
      top = br.top - sr.top + (br.height - sh) / 2;
    } else if (cfg.position === 'right') {
      left = br.left - sr.left - sw - 10;
      top = br.top - sr.top + (br.height - sh) / 2;
    } else if (cfg.position === 'bottom' || br.bottom - sr.top + sh + 20 > sr.height) {
      top = br.top - sr.top - sh - 8;
    }

    left = clamp(left, 14, Math.max(14, sr.width - sw - 14));
    top = clamp(top, 14, Math.max(14, sr.height - sh - 14));
    box.style.left = Math.round(left) + 'px';
    box.style.top = Math.round(top) + 'px';
  },

  syncInkPanCursor() {
    const ic = this.els.inkCanvas;
    if (!ic) return;
    const ready = !!(this.drawMode && (this.inkSpacePan || this.inkHandLock));
    ic.classList.toggle('pan-ready', ready);
    if (!ready) ic.classList.remove('panning-ink');
  },

  setDrawMode(on) {
    on = !!on;
    if (this.drawMode === on) return;
    this.drawMode = on;
    if (on) {
      this.strokeDrag = null;
      if (this.els.viewport) this.els.viewport.classList.remove('stroke-sel-hover');
      this.cancelLink();
      this.closePopover();
      this.hideSelectionTools();
      this.hideSnapOverlay();
      this.select(null);
      this.syncInkRefs();
      this.inkSpacePan = false;
      this.inkHandLock = false;
      if (this.els.shell) this.els.shell.classList.add('drawing');
      if (this.els.inkBar) {
        this.els.inkBar.hidden = false;
        this.renderInkBar();
        this.positionInkBar();
      }
      this.applyInkCursor();
      this.syncInkPanCursor();
      this.resizeInkCanvas();
      this.renderInk();
    } else {
      this.inkStroke = null;
      this.inkEraser = null;
      this.inkBarDrag = null;
      this.inkSpacePan = false;
      this.inkHandLock = false;
      this.setHoveredGrip(null);
      this.closeInkSettings();
      if (this.els.shell) this.els.shell.classList.remove('drawing');
      if (this.els.inkCanvas) {
        this.els.inkCanvas.classList.remove('panning-ink', 'pan-ready', 'grip-hover');
      }
      if (this.els.inkBar) {
        this.els.inkBar.classList.remove('dragging');
        this.els.inkBar.hidden = true;
      }
    }
    this.updateTopbar();
    this.updateEmpty();
    this.updateHint();
  },

  positionInkBar() {
    const bar = this.els.inkBar;
    const shell = this.els.shell;
    if (!bar || bar.hidden || !shell) return;
    const sr = shell.getBoundingClientRect();
    const brand = shell.querySelector('.ws-brand');
    const actions = shell.querySelector('.ws-actions');
    const dockEl = document.getElementById('dock');
    const cfg = this.inkCfg();
    const pos = typeof calcInkBarPlacement === 'function'
      ? calcInkBarPlacement({
        shellW: sr.width,
        shellH: sr.height,
        barW: bar.offsetWidth || 320,
        barH: bar.offsetHeight || 44,
        brandBottom: brand ? brand.getBoundingClientRect().bottom - sr.top : 56,
        actionsBottom: actions ? actions.getBoundingClientRect().bottom - sr.top : 56,
        dockTop: dockEl ? dockEl.getBoundingClientRect().top - sr.top : sr.height - 72,
        dockAnchor: (typeof Store !== 'undefined' && Store.state && Store.state.dock && Store.state.dock.anchor) || 'bc',
        position: cfg.position,
        freeX: cfg.freeX,
        freeY: cfg.freeY
      })
      : { left: 14, top: 68 };
    bar.style.left = pos.left + 'px';
    bar.style.top = pos.top + 'px';
  },

  applyInkCursor() {
    if (!this.els.shell || typeof wsInkCursorCss !== 'function') return;
    const cfg = this.inkCfg();
    const shape = cfg.cursorShape === 'auto' ? undefined : cfg.cursorShape;
    const css = wsInkCursorCss(cfg.tool, cfg.color, cfg.size, shape, cfg.nib);
    this.els.shell.style.setProperty('--ws-cursor-ink', css);
  },

  pushInkUndo() {
    if (!this.board) return;
    const snap = JSON.parse(JSON.stringify(this.board.strokes || []));
    this.inkUndo.push(snap);
    if (this.inkUndo.length > 40) this.inkUndo.shift();
    this.inkRedo = [];
  },

  undoInk() {
    if (!this.inkUndo.length || !this.board) return;
    this.inkRedo.push(JSON.parse(JSON.stringify(this.board.strokes || [])));
    this.board.strokes = this.inkUndo.pop();
    this.renderInk();
    this.renderInkBar();
    this.updateEmpty();
    this.flushSave();
  },

  redoInk() {
    if (!this.inkRedo.length || !this.board) return;
    this.inkUndo.push(JSON.parse(JSON.stringify(this.board.strokes || [])));
    this.board.strokes = this.inkRedo.pop();
    this.renderInk();
    this.renderInkBar();
    this.updateEmpty();
    this.flushSave();
  },

  async clearInk() {
    if (!this.board || !(this.board.strokes && this.board.strokes.length)) return;
    const ok = await this.openConfirm({
      title: wsTr('ws.ink.clearTitle', null, 'Limpar todos os desenhos?'),
      message: wsTr('ws.ink.clearMsg', null, 'Isso apagará todos os traços à mão livre do quadro.'),
      confirmLabel: wsTr('ws.ink.clearConfirm', null, 'Limpar'),
      danger: true
    });
    if (!ok) return;
    this.pushInkUndo();
    this.board.strokes = [];
    this.renderInk();
    this.renderInkBar();
    this.updateEmpty();
    this.flushSave();
  },

  resizeInkCanvas() {
    const ic = this.els.inkCanvas;
    const vp = this.els.viewport;
    if (!ic || !vp) return;
    const rect = vp.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (ic.width !== Math.round(w * dpr) || ic.height !== Math.round(h * dpr)) {
      ic.width = Math.round(w * dpr);
      ic.height = Math.round(h * dpr);
    }
  },

  scheduleInkRender() {
    if (this.inkRaf) return;
    this.inkRaf = requestAnimationFrame(() => {
      this.inkRaf = null;
      this.renderInk();
    });
  },

  renderInk() {
    const ic = this.els.inkCanvas;
    if (!ic || !this.board) return;
    const ctx = ic.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const v = this.board.view || { x: 0, y: 0, scale: 1 };
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ic.width, ic.height);
    ctx.setTransform(dpr * v.scale, 0, 0, dpr * v.scale, dpr * v.x, dpr * v.y);

    const strokes = this.board.strokes || [];
    for (let i = 0; i < strokes.length; i++) {
      renderInkStroke(ctx, strokes[i]);
    }
    if (this.inkStroke) {
      renderInkStroke(ctx, this.inkStroke);
    }
    if (this.selectedStrokes && this.selectedStrokes.size && typeof wsStrokesBounds === 'function') {
      const selList = strokes.filter(s => s && this.selectedStrokes.has(s.id));
      const bb = wsStrokesBounds(selList);
      if (bb) {
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#8fa2ff';
        ctx.save();
        ctx.strokeStyle = accent;
        ctx.lineWidth = Math.max(1, 1.5 / Math.max(0.25, v.scale));
        ctx.setLineDash([5 / Math.max(0.25, v.scale), 4 / Math.max(0.25, v.scale)]);
        ctx.fillStyle = 'rgba(143,162,255,0.06)';
        ctx.fillRect(bb.x - 4, bb.y - 4, bb.w + 8, bb.h + 8);
        ctx.strokeRect(bb.x - 4, bb.y - 4, bb.w + 8, bb.h + 8);
        ctx.restore();
      }
    }
  },

  setHoveredGrip(gripEl) {
    if (this.hoveredGripEl && this.hoveredGripEl !== gripEl) {
      this.hoveredGripEl.classList.remove('is-hover');
    }
    this.hoveredGripEl = gripEl || null;
    if (this.hoveredGripEl) this.hoveredGripEl.classList.add('is-hover');
    if (this.els && this.els.inkCanvas) {
      this.els.inkCanvas.classList.toggle('grip-hover', !!this.hoveredGripEl);
    }
  },

  findCardGripAt(clientX, clientY) {
    if (!this.entered || !this.board || typeof document.elementsFromPoint !== 'function') return null;
    const stack = document.elementsFromPoint(clientX, clientY);
    if (!stack || !stack.length) return null;
    let gripEl = null;
    for (let i = 0; i < stack.length; i++) {
      const elNode = stack[i];
      if (!elNode || elNode === this.els.inkCanvas) continue;
      if (elNode.closest && elNode.closest('#ws-arrows, .ws-arrows, #ws-snap-layer, .ws-marquee, .ws-drop')) {
        continue;
      }
      if (elNode.closest && elNode.closest('.ws-ink-bar, .ws-ink-settings, .ws-topbar, .ws-zoom, .ws-timer, .ws-popover, .ws-sel-tools, .ws-arrow-tools, .ws-multi-tools')) {
        return null;
      }
      if (!gripEl && elNode.closest) {
        const g = elNode.closest('.ws-card-grip');
        if (g) gripEl = g;
      }
      const cardNode = elNode.closest ? elNode.closest('.ws-card') : null;
      if (cardNode) {
        if (!gripEl || !cardNode.contains(gripEl)) return null;
        const cid = cardNode.dataset && cardNode.dataset.id;
        const card = cid ? (this.board.cards || []).find(c => c.id === cid) : null;
        if (!card) return null;
        return { card, node: cardNode, grip: gripEl };
      }
    }
    return null;
  },

  isPointInSelectedStrokes(worldPt, pad) {
    if (!this.board || !this.selectedStrokes || !this.selectedStrokes.size || !worldPt) return false;
    if (typeof wsIsPointInStrokeSelection === 'function') {
      return wsIsPointInStrokeSelection(this.board.strokes || [], this.selectedStrokes, worldPt, pad);
    }
    return false;
  },

  startStrokeSelectionDrag(e) {
    if (!this.board || !this.selectedStrokes || !this.selectedStrokes.size) return false;
    const selList = (this.board.strokes || []).filter(s => s && this.selectedStrokes.has(s.id));
    if (!selList.length) return false;

    e.preventDefault();
    e.stopPropagation();
    const start = this.screenToWorld(e.clientX, e.clientY);
    const strokeItems = selList.map(st => ({
      stroke: st,
      origPoints: (st.points || []).map(pt => ({ x: Number(pt.x) || 0, y: Number(pt.y) || 0, p: pt.p }))
    }));
    const cardItems = Array.from(this.selectedIds)
      .map(id => this.board.cards.find(c => c.id === id))
      .filter(Boolean)
      .map(c => ({ card: c, origX: c.x, origY: c.y }));
    const origStrokesBox = typeof wsStrokesBounds === 'function' ? wsStrokesBounds(selList) : null;

    this.strokeDrag = {
      id: e.pointerId,
      start,
      screenX: e.clientX,
      screenY: e.clientY,
      rawDx: 0,
      rawDy: 0,
      moved: false,
      pushedUndo: false,
      strokes: strokeItems,
      cards: cardItems,
      origStrokesBox
    };
    if (this.els.shell) this.els.shell.classList.add('dragging-card');
    if (this.els.viewport) {
      try { this.els.viewport.setPointerCapture(e.pointerId); } catch (err) { /* ignora */ }
    }
    if (e.shiftKey) this.applyStrokeDragPositions(this.strokeDrag, true);
    else this.hideSnapOverlay();
    return true;
  },

  applyStrokeDragPositions(d, useSnap) {
    if (!d) return;
    let dx = d.rawDx || 0;
    let dy = d.rawDy || 0;

    if (useSnap && typeof wsComputeSnap === 'function') {
      const movingCardIds = new Set();
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      if (d.origStrokesBox) {
        minX = d.origStrokesBox.x + dx;
        minY = d.origStrokesBox.y + dy;
        maxX = d.origStrokesBox.x + d.origStrokesBox.w + dx;
        maxY = d.origStrokesBox.y + d.origStrokesBox.h + dy;
      }
      if (d.cards && d.cards.length) {
        d.cards.forEach(item => {
          movingCardIds.add(item.card.id);
          const x = item.origX + dx;
          const y = item.origY + dy;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x + item.card.w > maxX) maxX = x + item.card.w;
          if (y + item.card.h > maxY) maxY = y + item.card.h;
        });
      }
      if (Number.isFinite(minX)) {
        const box = { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
        const others = (this.board.cards || []).filter(c => c && !movingCardIds.has(c.id));
        const snapRes = wsComputeSnap(box, others);
        dx += (snapRes.x - box.x);
        dy += (snapRes.y - box.y);
        this.renderSnapOverlay(snapRes, { x: snapRes.x, y: snapRes.y, w: box.w, h: box.h });
      }
    } else {
      this.hideSnapOverlay();
    }

    if (typeof wsApplyStrokeOffsets === 'function') {
      wsApplyStrokeOffsets(d.strokes, dx, dy);
    } else {
      d.strokes.forEach((item) => {
        const pts = item.stroke.points;
        for (let i = 0; i < pts.length && i < item.origPoints.length; i++) {
          pts[i].x = Math.round((item.origPoints[i].x + dx) * 100) / 100;
          pts[i].y = Math.round((item.origPoints[i].y + dy) * 100) / 100;
        }
      });
    }

    if (d.cards && d.cards.length) {
      const movedIds = [];
      d.cards.forEach((item) => {
        item.card.x = item.origX + dx;
        item.card.y = item.origY + dy;
        const node = this.cardEls.get(item.card.id);
        if (node) node.style.transform = 'translate(' + item.card.x + 'px,' + item.card.y + 'px)';
        movedIds.push(item.card.id);
      });
      this.updateArrowsForSet(movedIds);
    }
    this.scheduleInkRender();
  },

  onInkPointerDown(e) {
    if (!this.entered || !this.drawMode) return;
    if (this.trackTouchStart(e)) {
      this.setHoveredGrip(null);
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    /* botão do meio, botão direito, Espaço, Alt ou ferramenta Mover destravam o mouse para arrastar o quadro */
    if (e.button === 1 || e.button === 2 || this.inkSpacePan || this.inkHandLock || e.altKey) {
      this.setHoveredGrip(null);
      e.preventDefault();
      e.stopPropagation();
      this.panning = {
        id: e.pointerId,
        button: e.button,
        moved: false,
        startX: e.clientX,
        startY: e.clientY,
        viewX: this.board.view.x,
        viewY: this.board.view.y
      };
      this.els.viewport.classList.add('panning');
      this.els.inkCanvas.classList.add('panning-ink');
      try { this.els.inkCanvas.setPointerCapture(e.pointerId); } catch (err) { /* ignora */ }
      return;
    }
    if (e.button === 0) {
      const gripHit = this.findCardGripAt(e.clientX, e.clientY);
      if (gripHit) {
        this.closePopover();
        this.closeTimerSettings();
        this.setHoveredGrip(gripHit.grip);
        this.startCardDrag(e, gripHit.card);
        if (this.cardDrag && this.els.inkCanvas) {
          this.cardDrag.captureEl = this.els.inkCanvas;
          try { this.els.inkCanvas.setPointerCapture(e.pointerId); } catch (err) { /* ignora */ }
        }
        return;
      }
    }
    if (e.button !== 0 && e.button !== 5) return;
    this.setHoveredGrip(null);
    e.preventDefault();
    e.stopPropagation();
    this.closePopover();
    this.closeTimerSettings();

    const cfg = this.inkCfg();
    const p = this.screenToWorld(e.clientX, e.clientY);
    /* ponta traseira / botão borracha de mesas digitalizadoras (button 5 ou buttons 32) */
    const tailEraser = e.pointerType === 'pen' && (e.button === 5 || (e.buttons & 32) === 32);
    const activeTool = tailEraser ? 'eraser' : cfg.tool;

    try { this.els.inkCanvas.setPointerCapture(e.pointerId); } catch (err) { /* ignora */ }

    if (activeTool === 'eraser') {
      const r = Math.max(8, (cfg.size * 2.4) / Math.max(0.4, this.board.view.scale));
      this.inkEraser = {
        id: e.pointerId,
        lastX: p.x,
        lastY: p.y,
        radius: r,
        pushedUndo: false
      };
      const res = eraseInkAtSegment(this.board.strokes || [], p.x, p.y, p.x, p.y, r);
      if (res.changed) {
        this.pushInkUndo();
        this.inkEraser.pushedUndo = true;
        this.board.strokes = res.nextStrokes;
        this.renderInk();
      }
      return;
    }

    const pressure = inkEffectivePressure(e.pressure, e.pointerType, 0, cfg.pressureVar);
    this.inkStroke = {
      id: uid(),
      tool: activeTool === 'marker' ? 'marker' : 'pen',
      nib: cfg.nib || 'round',
      color: cfg.color,
      size: cfg.size,
      pointerId: e.pointerId,
      startedAt: performance.now(),
      lastTime: performance.now(),
      lastX: p.x,
      lastY: p.y,
      points: [{ x: inkRound(p.x, 2), y: inkRound(p.y, 2), p: pressure }]
    };
    this.updateEmpty();
    this.renderInk();
  },

  onInkPointerMove(e) {
    if (!this.drawMode) return;
    if (this.cardDrag) return;
    if (this.trackTouchMove(e)) return;
    if (this.panning && this.panning.id === e.pointerId) {
      const v = this.board.view;
      if (Math.hypot(e.clientX - this.panning.startX, e.clientY - this.panning.startY) > 3) this.panning.moved = true;
      v.x = this.panning.viewX + (e.clientX - this.panning.startX);
      v.y = this.panning.viewY + (e.clientY - this.panning.startY);
      this.applyView();
      return;
    }

    if (this.inkEraser && this.inkEraser.id === e.pointerId) {
      const samples = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [e];
      const list = samples && samples.length ? samples : [e];
      let anyChanged = false;
      for (let i = 0; i < list.length; i++) {
        const pt = this.screenToWorld(list[i].clientX, list[i].clientY);
        const res = eraseInkAtSegment(this.board.strokes || [], this.inkEraser.lastX, this.inkEraser.lastY, pt.x, pt.y, this.inkEraser.radius);
        this.inkEraser.lastX = pt.x;
        this.inkEraser.lastY = pt.y;
        if (res.changed) {
          if (!this.inkEraser.pushedUndo) {
            this.pushInkUndo();
            this.inkEraser.pushedUndo = true;
          }
          this.board.strokes = res.nextStrokes;
          anyChanged = true;
        }
      }
      if (anyChanged) this.scheduleInkRender();
      return;
    }

    if (this.inkStroke && this.inkStroke.pointerId === e.pointerId) {
      const st = this.inkStroke;
      const cfg = this.inkCfg();
      const samples = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [e];
      const list = samples && samples.length ? samples : [e];
      const baseStep = 0.65 + (cfg.smoothing / 100) * 1.4;
      const minStep = baseStep / Math.max(0.35, this.board.view.scale);
      let added = false;

      for (let i = 0; i < list.length; i++) {
        const ev = list[i];
        const pt = this.screenToWorld(ev.clientX, ev.clientY);
        const dist = Math.hypot(pt.x - st.lastX, pt.y - st.lastY);
        if (dist < minStep && i < list.length - 1) continue;
        const now = ev.timeStamp || performance.now();
        const dt = Math.max(4, now - st.lastTime);
        const speed = dist / dt;
        const pressure = inkEffectivePressure(ev.pressure, ev.pointerType || e.pointerType, speed, cfg.pressureVar);
        st.points.push({ x: inkRound(pt.x, 2), y: inkRound(pt.y, 2), p: pressure });
        st.lastX = pt.x;
        st.lastY = pt.y;
        st.lastTime = now;
        added = true;
      }
      if (added) this.scheduleInkRender();
      return;
    }

    if (!this.inkSpacePan && !this.inkHandLock && !e.altKey) {
      const gripHit = this.findCardGripAt(e.clientX, e.clientY);
      this.setHoveredGrip(gripHit ? gripHit.grip : null);
    } else {
      this.setHoveredGrip(null);
    }
  },

  onInkPointerUp(e) {
    this.trackTouchEnd(e);
    if (this.panning && this.panning.id === e.pointerId) {
      const wasRightMove = this.panning.button === 2 && this.panning.moved;
      this.els.viewport.classList.remove('panning');
      if (this.els.inkCanvas) {
        this.els.inkCanvas.classList.remove('panning-ink');
        this.syncInkPanCursor();
        try { this.els.inkCanvas.releasePointerCapture(e.pointerId); } catch (err) { /* ignora */ }
      }
      this.panning = null;
      if (wasRightMove) this.suppressContextMenu = true;
      this.scheduleSave();
      return;
    }

    if (this.inkEraser && this.inkEraser.id === e.pointerId) {
      const didChange = this.inkEraser.pushedUndo;
      this.inkEraser = null;
      try { this.els.inkCanvas.releasePointerCapture(e.pointerId); } catch (err) { /* ignora */ }
      if (didChange) {
        this.renderInk();
        this.renderInkBar();
        this.updateEmpty();
        this.flushSave();
      }
      return;
    }

    if (this.inkStroke && this.inkStroke.pointerId === e.pointerId) {
      const raw = this.inkStroke;
      this.inkStroke = null;
      try { this.els.inkCanvas.releasePointerCapture(e.pointerId); } catch (err) { /* ignora */ }
      const cfg = this.inkCfg();
      if (typeof inkSmoothPoints === 'function' && raw.points && raw.points.length >= 3) {
        raw.points = inkSmoothPoints(raw.points, cfg.smoothing);
      }
      const committed = normalizeInkStroke(raw);
      if (committed) {
        this.pushInkUndo();
        this.board.strokes = this.board.strokes || [];
        this.board.strokes.push(committed);
        this.renderInk();
        this.renderInkBar();
        this.updateEmpty();
        this.flushSave();
      }
    }
  },

  updateMarqueeBox(clientX, clientY) {
    const m = this.marquee;
    if (!m || !this.els.shell || !this.els.marquee) return;
    m.curX = clientX;
    m.curY = clientY;
    if (Math.hypot(clientX - m.startX, clientY - m.startY) > 3) m.moved = true;

    const sr = this.els.shell.getBoundingClientRect();
    const x1 = clamp(Math.min(m.startX, m.curX) - sr.left, 0, sr.width);
    const y1 = clamp(Math.min(m.startY, m.curY) - sr.top, 0, sr.height);
    const x2 = clamp(Math.max(m.startX, m.curX) - sr.left, 0, sr.width);
    const y2 = clamp(Math.max(m.startY, m.curY) - sr.top, 0, sr.height);
    const box = this.els.marquee;
    box.style.left = Math.round(x1) + 'px';
    box.style.top = Math.round(y1) + 'px';
    box.style.width = Math.max(1, Math.round(x2 - x1)) + 'px';
    box.style.height = Math.max(1, Math.round(y2 - y1)) + 'px';
    box.hidden = !m.moved;

    if (m.moved && typeof wsFindItemsInBox === 'function') {
      const w1 = this.screenToWorld(sr.left + x1, sr.top + y1);
      const w2 = this.screenToWorld(sr.left + x2, sr.top + y2);
      const hits = wsFindItemsInBox(this.board, {
        x: Math.min(w1.x, w2.x),
        y: Math.min(w1.y, w2.y),
        w: Math.abs(w2.x - w1.x),
        h: Math.abs(w2.y - w1.y)
      });
      this.selectedIds = new Set(m.additive ? [...m.prevCards, ...hits.cardIds] : hits.cardIds);
      this.selectedStrokes = new Set(m.additive ? [...m.prevStrokes, ...hits.strokeIds] : hits.strokeIds);
      const arr = Array.from(this.selectedIds);
      this.selCard = arr.length ? arr[arr.length - 1] : null;
      this.syncSelectionClasses();
      this.renderMultiTools();
      this.renderInk();
    }
  },

  finishMarquee(commit) {
    if (!this.marquee) return;
    const m = this.marquee;
    this.marquee = null;
    try { this.els.viewport.releasePointerCapture(m.id); } catch (err) { /* ignora */ }
    if (this.els.marquee) this.els.marquee.hidden = true;
    if (!commit) {
      this.selectedIds = new Set(m.prevCards || []);
      this.selectedStrokes = new Set(m.prevStrokes || []);
      const arr = Array.from(this.selectedIds);
      this.selCard = arr.length ? arr[arr.length - 1] : null;
      this.syncSelectionClasses();
      this.renderMultiTools();
      this.renderInk();
      return;
    }
    if (!m.moved) {
      const worldPt = this.screenToWorld(m.curX, m.curY);
      const tol = Math.max(6, 7 / Math.max(0.25, this.board.view.scale));
      const hitStroke = typeof wsFindStrokeAtPoint === 'function'
        ? wsFindStrokeAtPoint(this.board && this.board.strokes, worldPt, tol)
        : null;
      if (m.additive) {
        if (hitStroke) {
          if (this.selectedStrokes.has(hitStroke.id)) this.selectedStrokes.delete(hitStroke.id);
          else this.selectedStrokes.add(hitStroke.id);
          this.syncSelectionClasses();
          this.renderMultiTools();
          this.renderInk();
        }
      } else if (hitStroke && this.selectMode) {
        this.selectedIds.clear();
        this.selCard = null;
        this.selectedStrokes = new Set([hitStroke.id]);
        this.syncSelectionClasses();
        this.renderMultiTools();
        this.renderInk();
      } else {
        this.select(null);
      }
    }
  },

  onViewportPointerDown(e) {
    if (!this.entered) return;
    if (e.button != null && e.button !== 0 && e.button !== 1) return;
    if (e.target.closest('.ws-card, .ws-topbar, .ws-ink-bar, .ws-ink-settings, .ws-zoom, .ws-timer, .ws-popover, .ws-sel-tools, .ws-arrow-tools, .ws-multi-tools, .ws-empty')) return;

    this.closePopover();
    this.closeTimerSettings();
    this.hideSelectionTools();
    this.cancelLink();

    if (this.trackTouchStart(e)) {
      e.preventDefault();
      return;
    }

    if (e.button === 0 && !e.shiftKey && !this.selectSpacePan && this.selectedStrokes && this.selectedStrokes.size > 0) {
      const worldPt = this.screenToWorld(e.clientX, e.clientY);
      const pad = Math.max(6, 6 / Math.max(0.25, this.board.view.scale));
      if (this.isPointInSelectedStrokes(worldPt, pad)) {
        if (this.startStrokeSelectionDrag(e)) return;
      }
    }

    const wantMarquee = e.button === 0 && (this.selectMode || e.shiftKey) && !this.selectSpacePan;
    if (wantMarquee) {
      const prevCards = new Set(this.selectedIds);
      const prevStrokes = new Set(this.selectedStrokes);
      if (!e.shiftKey) {
        this.select(null);
      }
      this.marquee = {
        id: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        curX: e.clientX,
        curY: e.clientY,
        moved: false,
        additive: !!e.shiftKey,
        prevCards,
        prevStrokes
      };
      try { this.els.viewport.setPointerCapture(e.pointerId); } catch (err) { /* ignora */ }
      e.preventDefault();
      return;
    }

    this.select(null);
    this.panning = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      viewX: this.board.view.x,
      viewY: this.board.view.y
    };
    this.els.viewport.classList.add('panning');
    try { this.els.viewport.setPointerCapture(e.pointerId); } catch (err) { /* ignora */ }
    e.preventDefault();
  },

  onPointerMove(e) {
    if (this.trackTouchMove(e)) return;
    if (this.marquee && this.marquee.id === e.pointerId) {
      this.updateMarqueeBox(e.clientX, e.clientY);
      return;
    }
    if (this.inkBarDrag) {
      const d = this.inkBarDrag;
      const bar = this.els.inkBar;
      const shell = this.els.shell;
      if (bar && shell) {
        const dx = e.clientX - d.startX;
        const dy = e.clientY - d.startY;
        if (Math.hypot(dx, dy) > 3) d.moved = true;
        const sr = shell.getBoundingClientRect();
        const pad = 14;
        const maxX = Math.max(pad, sr.width - (bar.offsetWidth || 60) - pad);
        const maxY = Math.max(pad, sr.height - (bar.offsetHeight || 44) - pad);
        const nextX = clamp(Math.round(d.origX + dx), pad, maxX);
        const nextY = clamp(Math.round(d.origY + dy), pad, maxY);
        const cfg = this.inkCfg();
        cfg.position = 'free';
        cfg.freeX = nextX;
        cfg.freeY = nextY;
        bar.style.left = nextX + 'px';
        bar.style.top = nextY + 'px';
        if (this.inkSettingsOpen) this.positionInkSettings();
      }
      return;
    }

    if (this.panning) {
      const v = this.board.view;
      v.x = this.panning.viewX + (e.clientX - this.panning.startX);
      v.y = this.panning.viewY + (e.clientY - this.panning.startY);
      this.applyView();
      return;
    }

    if (this.cardDrag) {
      const d = this.cardDrag;
      const p = this.screenToWorld(e.clientX, e.clientY);
      d.rawDx = p.x - d.start.x;
      d.rawDy = p.y - d.start.y;
      if (!d.moved && Math.hypot(e.clientX - d.screenX, e.clientY - d.screenY) > 3) {
        d.moved = true;
        if (d.multiStrokes && d.multiStrokes.length && !d.pushedInkUndo) {
          this.pushInkUndo();
          d.pushedInkUndo = true;
        }
      }
      this.applyCardDragPositions(d, !!e.shiftKey);
      return;
    }

    if (this.strokeDrag && this.strokeDrag.id === e.pointerId) {
      const d = this.strokeDrag;
      const p = this.screenToWorld(e.clientX, e.clientY);
      d.rawDx = p.x - d.start.x;
      d.rawDy = p.y - d.start.y;
      if (!d.moved && Math.hypot(e.clientX - d.screenX, e.clientY - d.screenY) > 3) {
        d.moved = true;
        if (!d.pushedUndo) {
          this.pushInkUndo();
          d.pushedUndo = true;
        }
      }
      this.applyStrokeDragPositions(d, !!e.shiftKey);
      return;
    }

    if (this.pdfPan) {
      const pan = this.pdfPan;
      const dx = e.clientX - pan.startX;
      const dy = e.clientY - pan.startY;
      if (Math.hypot(dx, dy) > 3) pan.moved = true;
      if (pan.scrollable) {
        pan.body.scrollLeft = pan.scrollX - dx;
        pan.body.scrollTop = pan.scrollY - dy;
      } else {
        const p = this.screenToWorld(e.clientX, e.clientY);
        pan.card.x = pan.cardOrig.x + (p.x - pan.cardStart.x);
        pan.card.y = pan.cardOrig.y + (p.y - pan.cardStart.y);
        const node = this.cardEls.get(pan.card.id);
        if (node) node.style.transform = 'translate(' + pan.card.x + 'px,' + pan.card.y + 'px)';
        this.updateArrowsFor(pan.card.id);
      }
      return;
    }

    if (this.imgPan) {
      const pan = this.imgPan;
      const dx = e.clientX - pan.startX;
      const dy = e.clientY - pan.startY;
      if (Math.hypot(dx, dy) > 3) pan.moved = true;
      if (pan.scrollable) {
        pan.body.scrollLeft = pan.scrollX - dx;
        pan.body.scrollTop = pan.scrollY - dy;
      } else {
        const p = this.screenToWorld(e.clientX, e.clientY);
        pan.card.x = pan.cardOrig.x + (p.x - pan.cardStart.x);
        pan.card.y = pan.cardOrig.y + (p.y - pan.cardStart.y);
        const node = this.cardEls.get(pan.card.id);
        if (node) node.style.transform = 'translate(' + pan.card.x + 'px,' + pan.card.y + 'px)';
        this.updateArrowsFor(pan.card.id);
      }
      return;
    }

    if (this.cardResize) {
      const r = this.cardResize;
      const scale = this.board.view.scale;
      r.rawW = clamp(r.origW + (e.clientX - r.startX) / scale, 190, 2400);
      r.rawH = clamp(r.origH + (e.clientY - r.startY) / scale, 96, 2400);
      this.applyCardResize(r, !!e.shiftKey);
      return;
    }

    if (this.timerDrag) {
      const d = this.timerDrag;
      const t = this.board.timer;
      t.x = d.origX + (e.clientX - d.startX);
      t.y = d.origY + (e.clientY - d.startY);
      if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 4) {
        d.moved = true;
        if (d.ball && this.els.timer) this.els.timer.classList.remove('pressed');
      }
      if (d.ball && this.timerSpring) {
        const vx = e.clientX - d.lastX;
        const vy = e.clientY - d.lastY;
        const now = performance.now();
        const dt = Math.max(8, now - d.lastMove);
        d.lastX = e.clientX;
        d.lastY = e.clientY;
        d.lastMove = now;
        this.timerSpring.impulse(vx, vy, dt);
        clearTimeout(this.timerSettleTimer);
        this.timerSettleTimer = setTimeout(() => {
          if (this.timerDrag && this.timerSpring) this.timerSpring.release();
        }, 75);
      }
      this.applyTimerPosition();
      if (!this.els.timerSettings.hidden) this.positionTimerSettings();
      return;
    }

    if (this.selDrag) {
      const d = this.selDrag;
      if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 7) d.moved = true;
      if (d.moved) this.moveDragGhost(e.clientX, e.clientY, d.text);
      return;
    }

    if (this.pdfPress) {
      if (Math.hypot(e.clientX - this.pdfPress.startX, e.clientY - this.pdfPress.startY) > 6) {
        this.pdfPress.moved = true;
      }
    }

    if (this.entered && !this.drawMode && this.els.viewport) {
      let overSelStrokes = false;
      if (this.selectedStrokes && this.selectedStrokes.size > 0 && !this.selectSpacePan && !this.cardResize && !this.pdfPan && !this.imgPan && !this.timerDrag && !this.selDrag) {
        const tgt = e.target;
        const blocked = tgt && tgt.closest && tgt.closest('.ws-card, .ws-topbar, .ws-ink-bar, .ws-ink-settings, .ws-zoom, .ws-timer, .ws-popover, .ws-sel-tools, .ws-arrow-tools, .ws-multi-tools, .ws-empty');
        if (!blocked) {
          const pad = Math.max(6, 6 / Math.max(0.25, (this.board && this.board.view && this.board.view.scale) || 1));
          overSelStrokes = this.isPointInSelectedStrokes(this.screenToWorld(e.clientX, e.clientY), pad);
        }
      }
      this.els.viewport.classList.toggle('stroke-sel-hover', overSelStrokes);
    }
  },

  onPointerUp(e) {
    this.trackTouchEnd(e);
    if (this.marquee && this.marquee.id === e.pointerId) {
      this.finishMarquee(e.type !== 'pointercancel');
      return;
    }
    if (this.inkBarDrag) {
      const moved = this.inkBarDrag.moved;
      this.inkBarDrag = null;
      if (this.els.inkBar) this.els.inkBar.classList.remove('dragging');
      if (moved) {
        if (this.inkSettingsOpen) {
          this.renderInkSettings();
          this.positionInkSettings();
        }
        this.scheduleSave();
      }
      return;
    }

    if (this.panning) {
      this.els.viewport.classList.remove('panning');
      try { this.els.viewport.releasePointerCapture(this.panning.id); } catch (err) { /* ignora */ }
      this.panning = null;
      this.scheduleSave();
      return;
    }

    if (this.cardDrag) {
      const d = this.cardDrag;
      this.cardDrag = null;
      if (d.captureEl) {
        try { d.captureEl.releasePointerCapture(e.pointerId); } catch (err) { /* ignora */ }
      }
      if (this.els.shell) this.els.shell.classList.remove('dragging-card');
      if (this.drawMode) {
        const gh = (!this.inkSpacePan && !this.inkHandLock && !e.altKey) ? this.findCardGripAt(e.clientX, e.clientY) : null;
        this.setHoveredGrip(gh ? gh.grip : null);
      } else {
        this.setHoveredGrip(null);
      }
      if (d.shiftToggleCandidate && !d.moved) {
        this.select(d.card.id, { toggle: true });
      }
      if (e.shiftKey && !this.drawMode) this.showSnapPreviewFromSelection();
      else this.hideSnapOverlay();
      this.scheduleSave();
      return;
    }

    if (this.strokeDrag && this.strokeDrag.id === e.pointerId) {
      const d = this.strokeDrag;
      this.strokeDrag = null;
      if (this.els.shell) this.els.shell.classList.remove('dragging-card');
      if (this.els.viewport) {
        try { this.els.viewport.releasePointerCapture(e.pointerId); } catch (err) { /* ignora */ }
      }
      this.hideSnapOverlay();
      if (d.moved) {
        this.renderInk();
        this.flushSave();
      }
      return;
    }

    if (this.pdfPan) {
      const pan = this.pdfPan;
      this.pdfPan = null;
      pan.body.classList.remove('panning');
      if (pan.button === 2 && pan.moved) this.suppressContextMenu = true;
      if (!pan.scrollable && pan.moved) this.scheduleSave();
      return;
    }

    if (this.imgPan) {
      const pan = this.imgPan;
      this.imgPan = null;
      pan.body.classList.remove('panning');
      if (pan.button === 2 && pan.moved) this.suppressContextMenu = true;
      if (!pan.scrollable && pan.moved) this.scheduleSave();
      return;
    }

    if (this.cardResize) {
      const r = this.cardResize;
      this.cardResize = null;
      if (e.shiftKey) this.showSnapPreviewFromSelection();
      else this.hideSnapOverlay();
      this.scheduleSave();
      if (r.card.type === 'pdf') this.renderPdfCard(r.card, true);
      else if (r.card.type === 'image') this.renderImageCard(r.card);
      return;
    }

    if (this.timerDrag) {
      const d = this.timerDrag;
      this.timerDrag = null;
      clearTimeout(this.timerSettleTimer);
      if (this.timerSpring) this.timerSpring.snap();
      const timer = this.els.timer;
      if (timer) {
        timer.classList.remove('dragging', 'pressed');
        ['--ball-sx', '--ball-sy', '--ball-angle', '--ball-angle-neg', '--ball-isx', '--ball-isy', '--ball-ix', '--ball-iy']
          .forEach(p => timer.style.removeProperty(p));
      }
      if (d.ball && !d.moved) {
        this.board.timer.min = false;
        this.renderTimer();
      } else if (d.ball && timer) {
        this.bounceTimerBall();
      }
      this.scheduleSave();
      return;
    }

    if (this.selDrag) {
      const d = this.selDrag;
      this.selDrag = null;
      this.removeDragGhost();
      if (d.moved) {
        const node = this.cardEls.get(d.card.id);
        const rect = node ? node.getBoundingClientRect() : null;
        const outside = !rect || e.clientX < rect.left - 2 || e.clientX > rect.right + 2 ||
          e.clientY < rect.top - 2 || e.clientY > rect.bottom + 2;
        if (outside) {
          this.createLinkedCardFromSelection(d.card, d.text, e.clientX, e.clientY);
          this.clearNativeSelection();
          this.hideSelectionTools();
          return;
        }
      }
      setTimeout(() => this.showSelectionTools(), 0);
      return;
    }

    if (this.pdfPress) {
      const press = this.pdfPress;
      this.pdfPress = null;
      const mode = press.card.pdfMode || 'read';
      if (mode === 'highlight') {
        setTimeout(() => {
          this.showSelectionTools();
          if (this.selection && this.selection.card && this.selection.card.id === press.card.id) {
            this.applyHighlight(press.card.hlColor || WS_HL_COLORS[0].value);
          }
        }, 0);
        return;
      }
      if (mode === 'note' && !press.moved) {
        this.createLinkedNoteAt(press.card, e.clientX, e.clientY);
        return;
      }
      if (mode === 'read' && !press.moved && !press.hadSelection) {
        const r = press.body.getBoundingClientRect();
        const relX = (e.clientX - r.left) / Math.max(1, press.body.clientWidth);
        if (relX < 0.35) this.prevPdfPage(press.card);
        else this.nextPdfPage(press.card);
      }
      setTimeout(() => this.showSelectionTools(), 0);
    }
  },

  createLinkedNoteAt(card, clientX, clientY) {
    const p = this.screenToWorld(clientX, clientY);
    const note = this.addNote({
      x: Math.max(card.x + card.w + 26, p.x + 28),
      y: p.y - 70,
      w: 280,
      h: 170,
      text: '',
      source: { pdfId: card.pdfId, page: card.page },
      focus: true
    });
    this.makeArrow(card.id, note.id);
    toast(wsTr('ws.pdf.noteLinkedToast', { page: card.page }, 'Cartão ligado à p. ' + card.page + ' criado'), 'file');
  },

  onDocPointerDown(e) {
    if (!this.entered) return;
    const t = e.target;
    if (this.popover && this.popover !== 'confirm' &&
        !t.closest('.ws-popover') &&
        !t.closest('[data-act="bg"]') &&
        !t.closest('[data-act="boards"]') &&
        !t.closest('[data-act="search"]') &&
        !t.closest('[data-act="add"]') &&
        !t.closest('[data-card-conns]')) {
      this.closePopover();
    }
    if (!this.els.timerSettings.hidden && !t.closest('.ws-timer-settings') && !t.closest('#ws-timer') && !t.closest('[data-tset]')) {
      this.closeTimerSettings();
    }
    if (this.inkSettingsOpen && !t.closest('#ws-ink-settings') && !t.closest('#ws-ink-bar')) {
      this.closeInkSettings();
    }
    if (this.selection && !t.closest('#ws-sel-tools') && !t.closest('.ws-text-layer')) {
      this.hideSelectionTools();
    }
    if (this.selArrow && !t.closest('#ws-arrow-tools') && !t.closest('.ws-arrow-hit') && !t.closest('.ws-arrow-label-g')) {
      this.selectArrow(null);
    }
  },

  onKeyDown(e) {
    if (!this.entered) return;
    const tag = (e.target.tagName || '').toUpperCase();
    const editing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable;
    if (e.key === 'Shift' && !e.repeat) {
      if (this.cardDrag) this.applyCardDragPositions(this.cardDrag, true);
      else if (this.strokeDrag) this.applyStrokeDragPositions(this.strokeDrag, true);
      else if (this.cardResize) this.applyCardResize(this.cardResize, true);
      else if (!editing) this.showSnapPreviewFromSelection();
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      if (this.selCard) {
        const sc = this.board.cards.find(c => c.id === this.selCard);
        const pst = sc && sc.type === 'pdf' ? this.pdfSearch.get(sc.id) : null;
        if (pst && pst.open) {
          this.togglePdfSearch(sc, true);
          return;
        }
      }
      this.openSearchPopover();
      return;
    }

    if (e.key === 'Escape') {
      if (this.inkSettingsOpen) {
        this.closeInkSettings();
        return;
      }
      if (this.drawMode) {
        this.setDrawMode(false);
        return;
      }
      if (this.selectMode) {
        this.setSelectMode(false);
        return;
      }
      this.cancelLink();
      this.select(null);
      this.hideSelectionTools();
      this.closePopover();
      this.closeTimerSettings();
      return;
    }
    if (editing) return;
    if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key === '/') {
      e.preventDefault();
      this.openSearchPopover();
      return;
    }
    if (e.code === 'Space' && this.selectMode && !this.marquee) {
      e.preventDefault();
      if (!this.selectSpacePan) {
        this.selectSpacePan = true;
        if (this.els.shell) this.els.shell.classList.add('space-pan');
      }
      return;
    }
    if ((e.code === 'Space' || e.key === 'Alt') && this.drawMode && !this.inkStroke && !this.inkEraser) {
      e.preventDefault();
      if (document.activeElement && document.activeElement.closest && document.activeElement.closest('#ws-shell button')) {
        document.activeElement.blur();
      }
      if (!this.inkSpacePan) {
        this.inkSpacePan = true;
        this.syncInkPanCursor();
        this.renderInkBar();
      }
      return;
    }
    if (!e.ctrlKey && !e.metaKey && !e.altKey && this.drawMode && (e.key === 'h' || e.key === 'H')) {
      e.preventDefault();
      this.inkHandLock = !this.inkHandLock;
      this.syncInkPanCursor();
      this.renderInkBar();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && this.drawMode) {
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); this.undoInk(); return; }
      if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); this.redoInk(); return; }
    }
    if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'v' || e.key === 'V')) {
      e.preventDefault();
      this.setSelectMode(!this.selectMode);
      return;
    }
    if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'd' || e.key === 'D')) {
      e.preventDefault();
      this.setDrawMode(!this.drawMode);
      return;
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (this.selArrow) {
        e.preventDefault();
        this.removeArrow(this.selArrow);
        this.selArrow = null;
      } else if (this.selectedIds.size > 1 || this.selectedStrokes.size > 0) {
        e.preventDefault();
        this.deleteSelected();
      } else if (this.selCard) {
        e.preventDefault();
        const card = this.board.cards.find(c => c.id === this.selCard);
        if (card) this.requestRemoveCard(card);
      }
      return;
    }
    if (this.selCard) {
      const card = this.board.cards.find(c => c.id === this.selCard);
      if (card && card.type === 'pdf') {
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault();
          this.prevPdfPage(card);
        } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
          e.preventDefault();
          this.nextPdfPage(card);
        } else if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          this.setPdfZoom(card, (card.zoom || 1) + 0.25);
        } else if (e.key === '-') {
          e.preventDefault();
          this.setPdfZoom(card, (card.zoom || 1) - 0.25);
        } else if (e.key === '0') {
          e.preventDefault();
          this.setPdfZoom(card, 1);
        }
      } else if (card && card.type === 'image') {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          this.setImageZoom(card, (card.zoom || 1) + 0.25);
        } else if (e.key === '-') {
          e.preventDefault();
          this.setImageZoom(card, (card.zoom || 1) - 0.25);
        } else if (e.key === '0') {
          e.preventDefault();
          this.setImageZoom(card, 1);
        }
      }
    }
  },

  startCardDrag(e, card) {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const shiftHeld = !!e.shiftKey;
    let shiftToggleCandidate = false;
    if (shiftHeld) {
      if (this.selectedIds.has(card.id)) {
        shiftToggleCandidate = true;
      } else if (this.selectedIds.size > 0) {
        this.select(card.id, { toggle: true });
      } else {
        this.select(card.id);
      }
    } else if (!this.selectedIds.has(card.id)) {
      this.select(card.id);
    }
    if (this.els.shell) this.els.shell.classList.add('dragging-card');
    const start = this.screenToWorld(e.clientX, e.clientY);

    let multiCards = null;
    let multiStrokes = null;
    if (this.selectedIds.size > 1 || this.selectedStrokes.size > 0) {
      multiCards = Array.from(this.selectedIds)
        .map(id => this.board.cards.find(c => c.id === id))
        .filter(Boolean)
        .map(c => ({ card: c, origX: c.x, origY: c.y }));
      multiStrokes = (this.board.strokes || [])
        .filter(s => s && this.selectedStrokes.has(s.id))
        .map(s => ({
          stroke: s,
          origPoints: (s.points || []).map(pt => ({ x: Number(pt.x) || 0, y: Number(pt.y) || 0, p: pt.p }))
        }));
    }

    let children = null;
    if (!multiCards && !e.altKey && card.type === 'group' && typeof wsGroupChildIds === 'function') {
      const ids = wsGroupChildIds(this.board.cards, card);
      children = ids
        .map(id => this.board.cards.find(c => c.id === id))
        .filter(Boolean)
        .map(c => ({ card: c, origX: c.x, origY: c.y }));
    }
    this.cardDrag = {
      card,
      start,
      orig: { x: card.x, y: card.y },
      rawDx: 0,
      rawDy: 0,
      children,
      multiCards,
      multiStrokes,
      pushedInkUndo: false,
      shiftToggleCandidate,
      screenX: e.clientX,
      screenY: e.clientY,
      moved: false,
      id: e.pointerId
    };
    if (shiftHeld) this.applyCardDragPositions(this.cardDrag, true);
    else this.hideSnapOverlay();
  },

  applyCardDragPositions(d, useSnap) {
    if (!d) return;
    let dx = d.rawDx || 0;
    let dy = d.rawDy || 0;

    if (useSnap && typeof wsComputeSnap === 'function') {
      const movingIds = new Set();
      let box = { x: d.orig.x + dx, y: d.orig.y + dy, w: d.card.w, h: d.card.h };
      if (d.multiCards && d.multiCards.length) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        d.multiCards.forEach(item => {
          movingIds.add(item.card.id);
          const x = item.origX + dx;
          const y = item.origY + dy;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x + item.card.w > maxX) maxX = x + item.card.w;
          if (y + item.card.h > maxY) maxY = y + item.card.h;
        });
        if (Number.isFinite(minX)) {
          box = { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
        }
      } else {
        movingIds.add(d.card.id);
        if (d.children && d.children.length) {
          d.children.forEach(ch => movingIds.add(ch.card.id));
        }
      }
      const others = (this.board.cards || []).filter(c => c && !movingIds.has(c.id));
      const snapRes = wsComputeSnap(box, others);
      dx += (snapRes.x - box.x);
      dy += (snapRes.y - box.y);
      this.renderSnapOverlay(snapRes, { x: snapRes.x, y: snapRes.y, w: box.w, h: box.h });
    } else {
      this.hideSnapOverlay();
    }

    if (d.multiCards && d.multiCards.length) {
      const movedIds = [];
      d.multiCards.forEach((item) => {
        item.card.x = item.origX + dx;
        item.card.y = item.origY + dy;
        const node = this.cardEls.get(item.card.id);
        if (node) node.style.transform = 'translate(' + item.card.x + 'px,' + item.card.y + 'px)';
        movedIds.push(item.card.id);
      });
      this.updateArrowsForSet(movedIds);
      if (d.multiStrokes && d.multiStrokes.length) {
        if (typeof wsApplyStrokeOffsets === 'function') {
          wsApplyStrokeOffsets(d.multiStrokes, dx, dy);
        }
        this.scheduleInkRender();
      }
      return;
    }

    d.card.x = d.orig.x + dx;
    d.card.y = d.orig.y + dy;
    const node = this.cardEls.get(d.card.id);
    if (node) node.style.transform = 'translate(' + d.card.x + 'px,' + d.card.y + 'px)';
    if (d.children && d.children.length) {
      const movedIds = [d.card.id];
      d.children.forEach((ch) => {
        ch.card.x = ch.origX + dx;
        ch.card.y = ch.origY + dy;
        const cn = this.cardEls.get(ch.card.id);
        if (cn) cn.style.transform = 'translate(' + ch.card.x + 'px,' + ch.card.y + 'px)';
        movedIds.push(ch.card.id);
      });
      this.updateArrowsForSet(movedIds);
    } else {
      this.updateArrowsFor(d.card.id);
    }
  },

  showSnapPreviewFromSelection() {
    if (!this.entered || !this.board || typeof wsComputeSnap !== 'function') return;
    if (this.drawMode || this.selectMode || this.marquee || this.cardDrag || this.cardResize || this.popover || this.linkFrom) return;
    const ids = this.selectedIds && this.selectedIds.size
      ? Array.from(this.selectedIds)
      : (this.selCard ? [this.selCard] : []);
    if (!ids.length) return;
    const movingIds = new Set();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    ids.forEach((id) => {
      const c = this.board.cards.find(x => x.id === id);
      if (!c) return;
      movingIds.add(c.id);
      if (c.type === 'group' && typeof wsGroupChildIds === 'function') {
        wsGroupChildIds(this.board.cards, c).forEach(cid => movingIds.add(cid));
      }
      if (c.x < minX) minX = c.x;
      if (c.y < minY) minY = c.y;
      if (c.x + c.w > maxX) maxX = c.x + c.w;
      if (c.y + c.h > maxY) maxY = c.y + c.h;
    });
    if (!Number.isFinite(minX)) return;
    const box = { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
    const others = (this.board.cards || []).filter(c => c && !movingIds.has(c.id));
    const snapRes = wsComputeSnap(box, others);
    this.renderSnapOverlay(snapRes, box, { preview: true });
  },

  renderSnapOverlay(snapRes, curBox, opts) {
    const layer = this.els && this.els.snapLayer;
    if (!layer || !snapRes || !curBox) return;
    const isPreview = !!(opts && opts.preview);
    const isResize = !!(opts && opts.resize);
    layer.classList.add('active');
    const prox = Math.max(0, Math.min(1, Number(snapRes.proximity) || 0));
    layer.style.setProperty('--snap-prox', prox.toFixed(3));

    const boxW = (isResize && snapRes.targetW != null) ? snapRes.targetW : curBox.w;
    const boxH = (isResize && snapRes.targetH != null) ? snapRes.targetH : curBox.h;

    const gridStep = typeof WS_SNAP_GRID !== 'undefined' ? WS_SNAP_GRID : 26;
    const gridEl = this.els.snapGrid;
    if (gridEl) {
      const pad = Math.round(140 + 80 * prox);
      const gw = Math.ceil((boxW + pad * 2) / (gridStep * 2)) * (gridStep * 2);
      const gh = Math.ceil((boxH + pad * 2) / (gridStep * 2)) * (gridStep * 2);
      const refX = isPreview ? curBox.x : (snapRes.targetX != null ? snapRes.targetX : curBox.x);
      const refY = isPreview ? curBox.y : (snapRes.targetY != null ? snapRes.targetY : curBox.y);
      const cx = refX + boxW / 2;
      const cy = refY + boxH / 2;
      const gx = Math.round(cx / gridStep) * gridStep - gw / 2;
      const gy = Math.round(cy / gridStep) * gridStep - gh / 2;
      gridEl.style.left = gx + 'px';
      gridEl.style.top = gy + 'px';
      gridEl.style.width = gw + 'px';
      gridEl.style.height = gh + 'px';
      gridEl.style.opacity = (snapRes.gridOpacity != null ? snapRes.gridOpacity : (0.38 + 0.62 * prox)).toFixed(3);
    }

    const moldEl = this.els.snapMold;
    if (moldEl) {
      const isNear = !!snapRes.near && prox > 0.35;
      const mx = isPreview ? curBox.x : (snapRes.targetX != null ? snapRes.targetX : curBox.x);
      const my = isPreview ? curBox.y : (snapRes.targetY != null ? snapRes.targetY : curBox.y);
      const scale = isPreview ? 1.004 : (isNear ? 1.004 : (1 + (1 - snapRes.moldStrength) * 0.015));
      moldEl.style.width = boxW + 'px';
      moldEl.style.height = boxH + 'px';
      moldEl.style.transform = 'translate(' + mx + 'px,' + my + 'px) scale(' + scale.toFixed(4) + ')';
      moldEl.style.opacity = (0.2 + 0.54 * prox + (isNear ? 0.22 : 0)).toFixed(3);
      moldEl.classList.toggle('near', isNear);

      const nowLocked = !isPreview && !!snapRes.locked;
      if (nowLocked && !this._wasSnapLocked) {
        moldEl.classList.remove('just-locked');
        if (typeof moldEl.offsetWidth === 'number') void moldEl.offsetWidth;
        moldEl.classList.add('just-locked');
        clearTimeout(this._snapLockTimer);
        this._snapLockTimer = setTimeout(() => {
          if (this.els && this.els.snapMold) this.els.snapMold.classList.remove('just-locked');
        }, 280);
      } else if (!nowLocked) {
        moldEl.classList.remove('just-locked');
      }
      this._wasSnapLocked = nowLocked;
    }

    const gxEl = this.els.snapGx;
    if (gxEl) {
      if (snapRes.guideX && snapRes.guideX.strength > 0.16) {
        gxEl.hidden = false;
        gxEl.style.left = snapRes.guideX.pos + 'px';
        gxEl.style.top = snapRes.guideX.min + 'px';
        gxEl.style.height = Math.max(20, snapRes.guideX.max - snapRes.guideX.min) + 'px';
        gxEl.style.opacity = (0.2 + 0.72 * snapRes.guideX.strength).toFixed(3);
      } else {
        gxEl.hidden = true;
      }
    }

    const gyEl = this.els.snapGy;
    if (gyEl) {
      if (snapRes.guideY && snapRes.guideY.strength > 0.16) {
        gyEl.hidden = false;
        gyEl.style.top = snapRes.guideY.pos + 'px';
        gyEl.style.left = snapRes.guideY.min + 'px';
        gyEl.style.width = Math.max(20, snapRes.guideY.max - snapRes.guideY.min) + 'px';
        gyEl.style.opacity = (0.2 + 0.72 * snapRes.guideY.strength).toFixed(3);
      } else {
        gyEl.hidden = true;
      }
    }
  },

  hideSnapOverlay() {
    this._wasSnapLocked = false;
    clearTimeout(this._snapLockTimer);
    if (!this.els || !this.els.snapLayer) return;
    this.els.snapLayer.classList.remove('active');
    if (this.els.snapGx) this.els.snapGx.hidden = true;
    if (this.els.snapGy) this.els.snapGy.hidden = true;
    if (this.els.snapMold) {
      this.els.snapMold.classList.remove('near');
      this.els.snapMold.classList.remove('just-locked');
    }
  },

  startResize(e, card) {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    this.select(card.id);
    this.cardResize = {
      card,
      startX: e.clientX,
      startY: e.clientY,
      origW: card.w,
      origH: card.h,
      rawW: card.w,
      rawH: card.h,
      id: e.pointerId
    };
    if (e.shiftKey) this.applyCardResize(this.cardResize, true);
    else this.hideSnapOverlay();
  },

  applyCardResize(r, useSnap) {
    if (!r || !r.card) return;
    let nextW = clamp(r.rawW != null ? r.rawW : r.origW, 190, 2400);
    let nextH = clamp(r.rawH != null ? r.rawH : r.origH, 96, 2400);
    if (useSnap && typeof wsComputeResizeSnap === 'function') {
      const others = (this.board.cards || []).filter(c => c && c.id !== r.card.id);
      const snapRes = wsComputeResizeSnap(
        { x: r.card.x, y: r.card.y, w: nextW, h: nextH },
        others,
        { minW: 190, minH: 96 }
      );
      nextW = clamp(snapRes.w, 190, 2400);
      nextH = clamp(snapRes.h, 96, 2400);
      this.renderSnapOverlay(snapRes, { x: r.card.x, y: r.card.y, w: nextW, h: nextH }, { resize: true });
    } else {
      this.hideSnapOverlay();
    }
    r.card.w = nextW;
    r.card.h = nextH;
    const node = this.cardEls.get(r.card.id);
    if (node) {
      node.style.width = nextW + 'px';
      node.style.height = nextH + 'px';
      node.style.setProperty('--ws-card-h', nextH + 'px');
      if (typeof node._syncFormulaLayout === 'function') node._syncFormulaLayout();
    }
    this.updateArrowsFor(r.card.id);
  },

  /* -------- seleção de texto e movimento no PDF -------- */
  onPdfPointerDown(e, card, body) {
    if (e.button !== 0 && e.button !== 2) return;
    if (e.target.closest('button, input')) return;
    const br = body.getBoundingClientRect();
    if (e.clientX - br.left > body.clientWidth || e.clientY - br.top > body.clientHeight) return;

    const rightHand = e.button === 2 && (card.editMode || card.pdfMode === 'pan' || body.classList.contains('is-zoomed'));
    const leftHand = e.button === 0 && card.pdfMode === 'pan';
    if (rightHand || leftHand) {
      e.preventDefault();
      e.stopPropagation();
      this.select(card.id);
      const scrollable = body.scrollWidth > body.clientWidth + 2 || body.scrollHeight > body.clientHeight + 2;
      this.pdfPan = {
        card,
        body,
        button: e.button,
        scrollable,
        startX: e.clientX,
        startY: e.clientY,
        scrollX: body.scrollLeft,
        scrollY: body.scrollTop,
        cardStart: this.screenToWorld(e.clientX, e.clientY),
        cardOrig: { x: card.x, y: card.y },
        moved: false
      };
      body.classList.add('panning');
      return;
    }

    if (e.button !== 0) return;

    const sel = window.getSelection();
    const hadSelection = !!(sel && !sel.isCollapsed);
    if (hadSelection && this.selectionInsideCard(card)) {
      if (this.pointInSelection(e.clientX, e.clientY, sel)) {
        e.preventDefault();
        e.stopPropagation();
        this.selDrag = {
          card,
          text: sel.toString(),
          startX: e.clientX,
          startY: e.clientY,
          moved: false,
          range: sel.getRangeAt(0).cloneRange()
        };
        return;
      }
    }

    this.pdfPress = {
      card,
      body,
      hadSelection,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      pointerId: e.pointerId
    };
  },

  selectionInsideCard(card) {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode || !sel.focusNode) return false;
    const node = this.cardEls.get(card.id);
    if (!node) return false;
    return node.contains(sel.anchorNode) && node.contains(sel.focusNode);
  },

  pointInSelection(x, y, sel) {
    if (!sel || !sel.rangeCount) return false;
    const rects = sel.getRangeAt(0).getClientRects();
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      if (r.width < 1 && r.height < 1) continue;
      if (x >= r.left - 3 && x <= r.right + 3 && y >= r.top - 3 && y <= r.bottom + 3) return true;
    }
    return false;
  },

  showSelectionTools() {
    if (!this.entered) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) { this.hideSelectionTools(); return; }

    const range = sel.getRangeAt(0);
    let node = range.commonAncestorContainer;
    if (node && node.nodeType === 3) node = node.parentElement;
    const layer = node && node.closest ? node.closest('.ws-text-layer') : null;
    if (!layer) { this.hideSelectionTools(); return; }
    const article = layer.closest('.ws-card');
    if (!article) { this.hideSelectionTools(); return; }
    const card = this.board.cards.find(c => c.id === article.dataset.id);
    if (!card || card.type !== 'pdf') { this.hideSelectionTools(); return; }

    const text = sel.toString().trim();
    if (!text) { this.hideSelectionTools(); return; }

    this.selection = { card, range: range.cloneRange(), text };
    let html = '<span>' + wsEscape(wsTr('ws.pdf.selHighlight', null, 'destacar')) + '</span>';
    WS_HL_COLORS.forEach(c => {
      const lbl = wsColorLabel(c).toLowerCase();
      html += '<button class="ws-sel-dot" data-hlcolor="' + c.value + '" title="' + wsEscape(wsTr('ws.pdf.selHighlight', null, 'destacar') + ' · ' + lbl) + '" style="background:' + c.value + '"></button>';
    });
    html += '<span style="opacity:.5">·</span>' +
      '<button class="ws-tool wide" data-selcard title="' + wsEscape(wsTr('ws.pdf.selCardTip', null, 'Criar um cartão com este trecho')) + '">' + svgIcon('file') + '<span>' + wsEscape(wsTr('ws.pdf.selCard', null, 'cartão')) + '</span></button>';
    this.els.selTools.innerHTML = html;

    const rect = range.getBoundingClientRect();
    const shellRect = this.els.shell.getBoundingClientRect();
    const tw = 236;
    let left = rect.left + rect.width / 2 - shellRect.left - tw / 2;
    left = clamp(left, 10, Math.max(10, shellRect.width - tw - 10));
    let top = rect.top - shellRect.top - 48;
    if (top < 62) top = rect.bottom - shellRect.top + 10;
    this.els.selTools.style.left = left + 'px';
    this.els.selTools.style.top = top + 'px';
    this.els.selTools.hidden = false;
  },

  hideSelectionTools() {
    this.selection = null;
    if (this.els.selTools) {
      this.els.selTools.hidden = true;
      this.els.selTools.innerHTML = '';
    }
  },

  clearNativeSelection() {
    try {
      const sel = window.getSelection();
      if (sel) sel.removeAllRanges();
    } catch (e) { /* ignora */ }
  },

  applyHighlight(color) {
    const sel = this.selection;
    if (!sel || !sel.card) return;
    const node = this.cardEls.get(sel.card.id);
    if (!node) return;
    const layer = node.querySelector('.ws-text-layer');
    if (!layer) return;
    const lr = layer.getBoundingClientRect();
    if (lr.width < 1 || lr.height < 1) return;

    const rects = [];
    const raw = sel.range.getClientRects();
    for (let i = 0; i < raw.length; i++) {
      const r = raw[i];
      if (r.width < 1 || r.height < 1) continue;
      const x1 = Math.max(r.left, lr.left);
      const y1 = Math.max(r.top, lr.top);
      const x2 = Math.min(r.right, lr.right);
      const y2 = Math.min(r.bottom, lr.bottom);
      if (x2 - x1 < 1 || y2 - y1 < 1) continue;
      rects.push({
        x: clamp((x1 - lr.left) / lr.width, 0, 1),
        y: clamp((y1 - lr.top) / lr.height, 0, 1),
        w: clamp((x2 - x1) / lr.width, 0, 1),
        h: clamp((y2 - y1) / lr.height, 0, 1)
      });
    }
    const meta = this.pdfMeta(sel.card);
    if (!meta || !rects.length) return;

    meta.highlights = meta.highlights || [];
    meta.highlights.push({
      id: uid(),
      page: sel.card.page,
      color: color,
      text: sel.text,
      rects
    });
    this.renderHighlights(sel.card);
    this.clearNativeSelection();
    this.hideSelectionTools();
    this.scheduleSave();
    toast(wsTr('ws.pdf.hlToast', null, 'Trecho destacado'), 'highlight');
  },

  selectionToCard() {
    const sel = this.selection;
    if (!sel) return;
    const rect = sel.range.getBoundingClientRect();
    const world = this.screenToWorld(
      rect.left + Math.min(rect.width, 240) / 2,
      rect.bottom + 26
    );
    this.createLinkedCardFromSelection(sel.card, sel.text, null, null, world);
    this.clearNativeSelection();
    this.hideSelectionTools();
  },

  createLinkedCardFromSelection(card, text, clientX, clientY, worldPoint) {
    if (!text || !text.trim()) return;
    let p = worldPoint;
    if (!p) {
      const shellRect = this.els.shell.getBoundingClientRect();
      p = this.screenToWorld(
        clientX == null ? shellRect.left + shellRect.width / 2 : clientX,
        clientY == null ? shellRect.top + shellRect.height / 2 : clientY
      );
    }
    const clean = text.replace(/\u00a0/g, ' ').replace(/[ \t]+\n/g, '\n').trim().slice(0, 6000);
    const note = this.addNote({
      x: p.x - 150,
      y: p.y - 50,
      w: 300,
      h: 190,
      text: clean,
      source: { pdfId: card.pdfId, page: card.page },
      focus: false
    });
    this.select(note.id);
    toast(wsTr('ws.pdf.selCardToast', null, 'Cartão ligado ao PDF criado'), 'file');
  },

  ensureDragGhost(text) {
    if (this.dragGhost) return this.dragGhost;
    const g = el('div', 'ws-drag-ghost');
    const snippet = el('span');
    snippet.textContent = text.replace(/\s+/g, ' ').slice(0, 92);
    g.innerHTML = svgIcon('file');
    g.append(snippet);
    document.body.append(g);
    this.dragGhost = g;
    return g;
  },

  moveDragGhost(x, y, text) {
    const g = this.ensureDragGhost(text || '');
    g.style.left = (x + 16) + 'px';
    g.style.top = (y + 14) + 'px';
  },

  removeDragGhost() {
    if (this.dragGhost) this.dragGhost.remove();
    this.dragGhost = null;
  },

  /* -------- cronômetro flutuante -------- */
  buildTimer() {
    const root = this.els.timerRoot;
    root.innerHTML = '';
    const timer = el('div', 'ws-timer style-ring');
    timer.id = 'ws-timer';
    timer.innerHTML =
      '<div class="ws-timer-head">' +
        '<span class="ws-timer-mode">' + wsEscape(wsTr('timer.preset.focus', null, 'Foco')) + '</span>' +
        '<button class="ws-timer-btn" data-tact="settings" title="' + wsEscape(wsTr('ws.timer.settingsTip', null, 'Configurações do cronômetro')) + '">' + svgIcon('sliders') + '</button>' +
        '<button class="ws-timer-btn" data-tact="min" title="' + wsEscape(wsTr('ws.timer.minTip', null, 'Minimizar em bolinha')) + '">' + svgIcon('chevD') + '</button>' +
      '</div>' +
      '<div class="ws-timer-ball" title="' + wsEscape(wsTr('ws.timer.openTip', null, 'Abrir cronômetro')) + '">25:00</div>' +
      '<div class="ws-timer-body">' +
        '<div class="ws-timer-ring">' +
          '<svg viewBox="0 0 100 100" aria-hidden="true">' +
            '<circle class="ws-timer-ring-bg" cx="50" cy="50" r="44"></circle>' +
            '<circle class="ws-timer-ring-fg" cx="50" cy="50" r="44"></circle>' +
          '</svg>' +
          '<span class="ws-timer-time"></span>' +
        '</div>' +
      '</div>' +
      '<span class="ws-timer-measure" aria-hidden="true"></span>' +
      '<div class="ws-timer-controls">' +
        '<button class="ws-timer-ctrl" data-tact="reset" title="' + wsEscape(wsTr('timer.resetAria', null, 'Reiniciar')) + '">' + svgIcon('reset') + '</button>' +
        '<button class="ws-timer-ctrl main" data-tact="toggle" title="' + wsEscape(wsTr('timer.start', null, 'Iniciar')) + '">' + svgIcon('play') + '</button>' +
        '<button class="ws-timer-ctrl" data-tact="skip" title="' + wsEscape(wsTr('timer.skipAria', null, 'Pular')) + '">' + svgIcon('skip') + '</button>' +
      '</div>';
    root.append(timer);

    const settings = el('div', 'ws-timer-settings');
    settings.hidden = true;
    root.append(settings);

    this.els.timer = timer;
    this.els.timerSettings = settings;

    const fg = timer.querySelector('.ws-timer-ring-fg');
    if (fg) fg.style.strokeDasharray = (2 * Math.PI * 44).toFixed(2);

    /* a fonte escolhida pode terminar de carregar depois: refaz as medidas do halo e do card */
    if (!this.fontsHooked && document.fonts && document.fonts.addEventListener) {
      this.fontsHooked = true;
      document.fonts.addEventListener('loadingdone', () => {
        if (!this.entered || !this.board) return;
        this.fitTimer();
        this.applyTimerPosition();
      });
    }

    timer.addEventListener('click', (e) => {
      const b = e.target.closest('[data-tact]');
      if (!b) return;
      e.stopPropagation();
      const act = b.dataset.tact;
      if (act === 'settings') this.openTimerSettings();
      else if (act === 'min') {
        this.board.timer.min = true;
        this.renderTimer();
        this.bounceTimerBall();
        this.scheduleSave();
      } else if (act === 'toggle') {
        TimerPage.startPause();
        this.updateTimerFace();
      } else if (act === 'reset') {
        TimerPage.resetRuntime();
        Store.save();
        TimerPage.syncUI();
        this.updateTimerFace();
      } else if (act === 'skip') {
        TimerPage.skip();
        this.updateTimerFace();
      }
    });

    const head = timer.querySelector('.ws-timer-head');
    head.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      this.startTimerDrag(e, false);
    });
    const ball = timer.querySelector('.ws-timer-ball');
    ball.addEventListener('pointerdown', (e) => this.startTimerDrag(e, true));

    settings.addEventListener('click', (e) => {
      const st = e.target.closest('[data-style]');
      if (st) {
        this.board.timer.style = st.dataset.style;
        this.renderTimer();
        this.renderTimerSettings();
        this.scheduleSave();
        return;
      }
      const col = e.target.closest('[data-color]');
      if (col) {
        this.board.timer.color = col.dataset.color;
        this.renderTimer();
        this.renderTimerSettings();
        this.scheduleSave();
        return;
      }
      const act = e.target.closest('[data-tact]');
      if (!act) return;
      if (act.dataset.tact === 'hide') {
        this.board.timer.visible = false;
        this.closeTimerSettings();
        this.renderTimer();
        this.scheduleSave();
      } else if (act.dataset.tact === 'resetpos') {
        this.board.timer.x = null;
        this.board.timer.y = null;
        this.applyTimerPosition();
        this.positionTimerSettings();
        this.scheduleSave();
      }
    });

    settings.addEventListener('input', (e) => {
      const range = e.target.closest('[data-range]');
      if (range) {
        const val = Number(range.value);
        if (range.dataset.range === 'size') this.board.timer.size = clamp(val, 20, 72);
        else this.board.timer.opacity = clamp(val, 20, 100);
        const out = range.parentElement.querySelector('[data-out]');
        if (out) out.textContent = range.dataset.range === 'size' ? val + 'px' : val + '%';
        this.renderTimer();
        this.scheduleSave();
        return;
      }
      const col = e.target.closest('[data-tcolor]');
      if (col) {
        this.board.timer.color = wsColor(col.value, '');
        this.renderTimer();
        this.scheduleSave();
      }
    });

    settings.addEventListener('change', (e) => {
      const font = e.target.closest('[data-tfont]');
      if (font) {
        this.board.timer.font = font.value;
        this.renderTimer();
        this.scheduleSave();
        return;
      }
      const col = e.target.closest('[data-tcolor]');
      if (col) {
        this.board.timer.color = wsColor(col.value, '');
        this.renderTimer();
        this.renderTimerSettings();
        this.scheduleSave();
      }
    });
  },

  timerFont() {
    const id = this.board.timer.font;
    const f = (typeof FONTS !== 'undefined' ? FONTS : []).find(x => x.id === id) || { id: 'inter', family: 'var(--font-ui)' };
    if (typeof Themes !== 'undefined' && Themes.ensureFonts) Themes.ensureFonts([f.id]);
    return f.family;
  },

  renderTimer() {
    if (!this.board || !this.els.timer) return;
    const t = this.board.timer;
    const node = this.els.timer;
    node.hidden = !t.visible;
    node.className = 'ws-timer style-' + t.style + (t.min ? ' min' : '');
    node.style.setProperty('--ws-timer-font', this.timerFont());
    node.style.setProperty('--ws-timer-size', t.size + 'px');
    if (t.color) node.style.setProperty('--ws-timer-tint', t.color);
    else node.style.removeProperty('--ws-timer-tint');
    node.style.opacity = (t.opacity / 100).toFixed(2);
    this.updateTimerFace();
    this.fitTimer();
    this.applyTimerPosition();
    if (this.els.timerSettings && !this.els.timerSettings.hidden) this.positionTimerSettings();
    this.updateTopbar();
  },

  /* O halo (anel) e a bolinha acompanham o tamanho real do relógio: mede o texto na fonte
     escolhida e dimensiona o círculo para que o tempo caiba por inteiro dentro dele. */
  fitTimer() {
    const node = this.els.timer;
    if (!node || node.hidden || !this.board) return;
    const m = node.querySelector('.ws-timer-measure');
    if (!m) return;
    const t = this.board.timer;
    const long = (this.lastTimerText || '').split(':').length > 2;
    const tpl = long ? '0:00:00' : '00:00';

    m.className = 'ws-timer-measure m-text';
    m.textContent = tpl;
    const rr = m.getBoundingClientRect();
    /* folga proporcional ao corpo da fonte, para o texto nunca encostar no traço do anel */
    const tw = rr.width + t.size * 0.35;
    const th = Math.max(rr.height, t.size) + t.size * 0.25;
    const ring = Math.max(96, Math.ceil(Math.hypot(tw, th) + 28));

    m.className = 'ws-timer-measure m-ball';
    const br = m.getBoundingClientRect();
    const ball = Math.max(62, Math.ceil(Math.hypot(br.width, br.height) + 28));

    const strokePx = clamp(ring * 0.04, 4, 10);
    node.style.setProperty('--ws-timer-ring', ring + 'px');
    node.style.setProperty('--ws-timer-ball', ball + 'px');
    node.style.setProperty('--ws-timer-stroke', (strokePx / ring * 100).toFixed(2));
  },

  /* mostra o tempo dígito a dígito (como a página Tempo): só o dígito que mudou é recriado/animado */
  renderTimerText(text) {
    const timeEl = this.els.timer && this.els.timer.querySelector('.ws-timer-time');
    if (!timeEl) return false;
    const flip = this.board.timer.style === 'flip';
    let rebuilt = false;
    if (timeEl.children.length !== text.length || this.timerChars.length !== text.length) {
      timeEl.innerHTML = '';
      this.timerChars = [];
      for (const ch of text) {
        const span = el('span', ch === ':' ? 'ws-t-colon' : 'ws-t-digit');
        span.textContent = ch;
        span.dataset.val = ch;
        timeEl.append(span);
        this.timerChars.push(span);
      }
      rebuilt = true;
    } else {
      for (let i = 0; i < text.length; i++) {
        const span = this.timerChars[i];
        const ch = text[i];
        if (span.dataset.val === ch) continue;
        span.dataset.val = ch;
        span.textContent = ch;
        if (flip && ch !== ':') {
          span.classList.remove('changed');
          void span.offsetWidth;
          span.classList.add('changed');
        }
      }
    }
    timeEl.setAttribute('aria-label', text);
    return rebuilt;
  },

  applyTimerPosition() {
    if (!this.board || !this.els.timer) return;
    const t = this.board.timer;
    const r = this.els.shell.getBoundingClientRect();
    if (r.width < 40 || r.height < 40) return;
    if (this.els.timer.hidden) return;
    /* mede o card real (o tamanho muda com a fonte, o estilo e a bolinha) */
    const w = this.els.timer.offsetWidth || (t.min ? 56 : 196);
    const h = this.els.timer.offsetHeight || (t.min ? 56 : 224);
    // deixa um corredor à direita para o controle de zoom não ficar sob o cronômetro
    const rightGuard = 60;
    if (t.x == null) t.x = r.width - w - 88;
    if (t.y == null) t.y = r.height - h - 62;
    t.x = clamp(t.x, 8, Math.max(8, r.width - w - rightGuard));
    t.y = clamp(t.y, 8, Math.max(8, r.height - h - 8));
    this.els.timer.style.left = t.x + 'px';
    this.els.timer.style.top = t.y + 'px';
  },

  applyTimerSpringState(s) {
    const timer = this.els.timer;
    if (!timer) return;
    timer.style.setProperty('--ball-sx', s.sx.toFixed(3));
    timer.style.setProperty('--ball-sy', s.sy.toFixed(3));
    timer.style.setProperty('--ball-angle', s.angle.toFixed(1) + 'deg');
    timer.style.setProperty('--ball-angle-neg', (-s.angle).toFixed(1) + 'deg');
    timer.style.setProperty('--ball-isx', s.isx.toFixed(3));
    timer.style.setProperty('--ball-isy', s.isy.toFixed(3));
    timer.style.setProperty('--ball-ix', s.ix.toFixed(2) + 'px');
    timer.style.setProperty('--ball-iy', s.iy.toFixed(2) + 'px');
  },

  bounceTimerBall() {
    const timer = this.els.timer;
    if (!timer || !timer.classList.contains('min')) return;
    timer.classList.remove('bounce');
    void timer.offsetWidth;
    timer.classList.add('bounce');
    setTimeout(() => timer.classList.remove('bounce'), 760);
    if (timer.animate) {
      try {
        const a = timer.animate([
          { transform: 'scale(1.24, .78)' },
          { transform: 'scale(.83, 1.19)', offset: 0.34 },
          { transform: 'scale(1.11, .90)', offset: 0.60 },
          { transform: 'scale(.95, 1.05)', offset: 0.80 },
          { transform: 'scale(1.02, .98)', offset: 0.91 },
          { transform: 'none' }
        ], { duration: 700, easing: 'cubic-bezier(.22,.85,.35,1)' });
        a.onfinish = () => a.cancel();
      } catch (e) { /* ignora */ }
    }
  },

  startTimerDrag(e, ball) {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    this.closeTimerSettings();
    const t = this.board.timer;
    this.applyTimerPosition();
    this.timerDrag = {
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      lastMove: performance.now(),
      origX: t.x,
      origY: t.y,
      moved: false,
      ball: !!ball
    };
    this.els.timer.classList.remove('bounce');
    this.els.timer.classList.add('dragging');
    if (ball) {
      this.els.timer.classList.add('pressed');
      if (!this.timerSpring) {
        this.timerSpring = createElasticSpring((s) => this.applyTimerSpringState(s));
      }
      this.timerSpring.snap();
    }
  },

  updateTimerFace() {
    if (!this.board || !this.els.timer) return;
    if (typeof TimerPage === 'undefined') return;
    const t = Store.state.timer;
    const countdown = t.tab === 'countdown';
    const total = TimerPage.presetTotal();
    const rem = TimerPage.remainingNow();
    const elapsed = TimerPage.elapsedNow();
    const text = countdown ? fmtClock(rem) : fmtClock(elapsed);
    const progress = countdown
      ? clamp(rem / Math.max(1, total), 0, 1)
      : ((elapsed % 3600) / 3600);

    const ball = this.els.timer.querySelector('.ws-timer-ball');
    const rebuilt = this.renderTimerText(text);
    if (ball && ball.textContent !== text) ball.textContent = text;

    const preset = (typeof TIMER_PRESETS !== 'undefined' ? TIMER_PRESETS : []).find(p => p.id === t.preset);
    const presetLbl = preset ? wsTr('timer.preset.' + preset.id, null, preset.label) : wsTr('timer.preset.focus', null, 'Foco');
    const mode = countdown ? presetLbl : wsTr('timer.tab.stopwatch', null, 'Cronômetro');
    const modeEl = this.els.timer.querySelector('.ws-timer-mode');
    if (modeEl) modeEl.textContent = mode + (t.running ? wsTr('ws.timer.activeSuffix', null, ' · ativo') : '');

    const fg = this.els.timer.querySelector('.ws-timer-ring-fg');
    if (fg) {
      const c = 2 * Math.PI * 44;
      fg.style.strokeDashoffset = (c * (1 - progress)).toFixed(2);
    }

    const btn = this.els.timer.querySelector('[data-tact="toggle"]');
    if (btn) {
      const state = t.running ? 'pause' : 'play';
      const tip = t.running ? wsTr('timer.pause', null, 'Pausar') : wsTr('timer.start', null, 'Iniciar');
      if (btn.dataset.state !== state || btn.title !== tip) {
        btn.dataset.state = state;
        btn.innerHTML = svgIcon(state);
        btn.title = tip;
      }
    }
    const lenChanged = (this.lastTimerText || '').length !== text.length;
    this.lastTimerText = text;
    /* o texto ganhou/perdeu dígitos (ex.: 59:59 → 1:00:00): ajusta o halo e o card */
    if (rebuilt && lenChanged && !this.els.timer.hidden) {
      this.fitTimer();
      this.applyTimerPosition();
    }
  },

  startTimerLoop() {
    this.stopTimerLoop();
    this.updateTimerFace();
    this.timerIv = setInterval(() => {
      if (this.entered) this.updateTimerFace();
    }, 250);
  },

  stopTimerLoop() {
    clearInterval(this.timerIv);
    this.timerIv = null;
  },

  toggleTimerVisible() {
    const t = this.board.timer;
    t.visible = !t.visible;
    if (t.visible) {
      this.applyTimerPosition();
      this.renderTimer();
    } else {
      this.closeTimerSettings();
      this.renderTimer();
    }
    this.scheduleSave();
  },

  openTimerSettings() {
    if (!this.board.timer.visible) {
      this.board.timer.visible = true;
      this.renderTimer();
    }
    if (!this.els.timerSettings.hidden) { this.closeTimerSettings(); return; }
    this.closePopover();
    this.els.timerSettings.hidden = false;
    this.renderTimerSettings();
    this.positionTimerSettings();
  },

  closeTimerSettings() {
    if (this.els.timerSettings) this.els.timerSettings.hidden = true;
  },

  positionTimerSettings() {
    if (!this.board || !this.els.timerSettings || this.els.timerSettings.hidden) return;
    const t = this.board.timer;
    const r = this.els.shell.getBoundingClientRect();
    const box = this.els.timerSettings;
    const bw = 272;
    box.style.maxHeight = Math.max(200, r.height - 16) + 'px';
    const bh = Math.min(box.scrollHeight || 420, Math.max(200, r.height - 16));
    const nw = this.els.timer.offsetWidth || (t.min ? 56 : 196);
    let left = t.x - bw - 12;
    if (left < 8) left = t.x + nw + 12;
    left = clamp(left, 8, Math.max(8, r.width - bw - 8));
    const top = clamp(t.y, 8, Math.max(8, r.height - bh - 8));
    box.style.left = left + 'px';
    box.style.top = top + 'px';
  },

  renderTimerSettings() {
    const box = this.els.timerSettings;
    if (!box) return;
    const t = this.board.timer;
    const prev = {
      minimal: '<span class="ws-sp ws-sp-min">25</span>',
      ring:    '<span class="ws-sp ws-sp-ring"></span>',
      flip:    '<span class="ws-sp ws-sp-flip"><b>2</b><b>5</b></span>'
    };
    const styleKeyMap = { minimal: 'ws.timer.styleMinimal', ring: 'ws.timer.styleRing', flip: 'ws.timer.styleFlip' };
    let html = '<div class="ws-tset-head"><p class="ws-pop-title">' + wsEscape(wsTr('ws.timer.popTitle', null, 'Cronômetro flutuante')) + '</p>' +
      '<span class="ws-tset-sub">' + wsEscape(wsTr('ws.timer.popSub', null, 'Mesmo tempo da página Tempo. Tudo aqui é só visual.')) + '</span></div>';

    /* 1 — forma do relógio */
    html += '<section class="ws-tset-group"><h4>' + wsEscape(wsTr('ws.timer.styleHead', null, 'Estilo')) + '</h4>' +
      '<p class="ws-tset-hint">' + wsEscape(wsTr('ws.timer.styleHint', null, 'Escolha o formato do relógio.')) + '</p><div class="ws-style-row">';
    WS_TIMER_STYLES.forEach(s => {
      const lbl = wsTr(styleKeyMap[s.id] || 'ws.timer.styleMinimal', null, s.label);
      html += '<button class="ws-style-btn' + (t.style === s.id ? ' active' : '') + '" data-style="' + s.id + '">' +
        prev[s.id] + '<span>' + wsEscape(lbl) + '</span></button>';
    });
    html += '</div></section>';

    /* 2 — cor */
    html += '<section class="ws-tset-group"><h4>' + wsEscape(wsTr('ws.timer.colorHead', null, 'Cor')) + '</h4>' +
      '<p class="ws-tset-hint">' + wsEscape(wsTr('ws.timer.colorHint', null, 'Dígitos e halo usam a mesma cor.')) + '</p><div class="ws-color-grid">';
    WS_TIMER_COLORS.forEach(c => {
      const bg = c.value || 'var(--accent)';
      const lbl = wsColorLabel(c);
      html += '<button class="ws-swatch' + (t.color === c.value ? ' active' : '') + '" data-color="' + c.value + '" title="' + wsEscape(lbl) + '" style="background:' + bg + '"></button>';
    });
    html += '</div><label class="ws-color-custom"><input type="color" value="' +
      (wsColor(t.color, '#8fa2ff') || '#8fa2ff') + '" data-tcolor><span>' + wsEscape(wsTr('ws.bgCustomColor', null, 'Cor personalizada')) + '</span></label></section>';

    /* 3 — fonte e tamanho */
    html += '<section class="ws-tset-group"><h4>' + wsEscape(wsTr('ws.timer.fontSizeHead', null, 'Fonte e tamanho')) + '</h4>' +
      '<p class="ws-tset-hint">' + wsEscape(wsTr('ws.timer.fontSizeHint', null, 'O halo e o card crescem junto com o tamanho.')) + '</p>' +
      '<div class="ws-range-row"><span>' + wsEscape(wsTr('ws.timer.fontLabel', null, 'Fonte')) + '</span><select class="ws-select" data-tfont>';
    (typeof FONTS !== 'undefined' ? FONTS : []).forEach(f => {
      html += '<option value="' + f.id + '"' + (f.id === t.font ? ' selected' : '') + '>' + wsEscape(f.label) + '</option>';
    });
    html += '</select></div>' +
      '<div class="ws-range-row"><span>' + wsEscape(wsTr('ws.timer.sizeLabel', null, 'Tamanho')) + ' <b data-out>' + t.size + 'px</b></span>' +
      '<input type="range" min="20" max="72" step="1" value="' + t.size + '" data-range="size"></div></section>';

    /* 4 — janela */
    html += '<section class="ws-tset-group"><h4>' + wsEscape(wsTr('ws.timer.winHead', null, 'Janela')) + '</h4>' +
      '<div class="ws-range-row"><span>' + wsEscape(wsTr('ws.timer.opacityLabel', null, 'Transparência')) + ' <b data-out>' + t.opacity + '%</b></span>' +
      '<input type="range" min="20" max="100" step="1" value="' + t.opacity + '" data-range="opacity"></div>' +
      '<div class="ws-pop-row" style="margin-top:12px">' +
      '<button class="ws-pop-chip" data-tact="resetpos">' + wsEscape(wsTr('ws.timer.resetPos', null, 'Posição padrão')) + '</button>' +
      '<button class="ws-pop-chip" data-tact="hide">' + wsEscape(wsTr('ws.timer.hide', null, 'Ocultar')) + '</button></div>' +
      '<p class="ws-pop-note">' + wsEscape(wsTr('ws.timer.winNote', null, 'Arraste pelo topo para mover; o botão de seta minimiza em bolinha.')) + '</p></section>';

    box.innerHTML = html;
    this.positionTimerSettings();
  },

  syncLanguage() {
    if (!this.inited) return;
    if (this.els.empty) this.buildEmpty();
    if (this.els.topbar) this.buildTopbar();
    if (this.els.zoom) {
      this.buildZoom();
      if (this.board && this.board.view) {
        const lvl = this.els.zoom.querySelector('.ws-zoom-level');
        if (lvl) lvl.textContent = Math.round(this.board.view.scale * 100) + '%';
      }
    }
    this.updateHint();
    if (this.board) {
      this.renderAll();
      this.refreshPdfs();
      this.renderArrowTools();
      this.renderMultiTools();
      this.renderInkBar();
      if (this.inkSettingsOpen) this.renderInkSettings();
      if (this.els.timer) {
        const tm = this.els.timer;
        const headBtns = tm.querySelectorAll('.ws-timer-head [data-tact]');
        headBtns.forEach(b => {
          if (b.dataset.tact === 'settings') b.title = wsTr('ws.timer.settingsTip', null, 'Configurações do cronômetro');
          else if (b.dataset.tact === 'min') b.title = wsTr('ws.timer.minTip', null, 'Minimizar em bolinha');
        });
        const ball = tm.querySelector('.ws-timer-ball');
        if (ball) ball.title = wsTr('ws.timer.openTip', null, 'Abrir cronômetro');
        const ctrlBtns = tm.querySelectorAll('.ws-timer-controls [data-tact]');
        ctrlBtns.forEach(b => {
          if (b.dataset.tact === 'reset') b.title = wsTr('timer.resetAria', null, 'Reiniciar');
          else if (b.dataset.tact === 'skip') b.title = wsTr('timer.skipAria', null, 'Pular');
        });
        this.updateTimerFace();
        if (this.els.timerSettings && !this.els.timerSettings.hidden) this.renderTimerSettings();
      }
      if (this.popover === 'boards') this.refreshBoardsPopover();
      else if (this.popover === 'bg') this.refreshBgPopover();
      else if (this.popover === 'linkdefs') { this.popover = null; this.openLinkDefaultsPopover(); }
      else if (this.popover === 'add') { this.popover = null; this.openAddPopover(); }
      else if (this.popover === 'search') { this.popover = null; this.openSearchPopover(); }
      else if (this.popover === 'connections' && this.connCardId) {
        const c = this.board.cards.find(x => x.id === this.connCardId);
        if (c) { this.popover = null; this.openConnectionsPopover(c); }
      }
    }
  },

};
