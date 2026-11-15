'use strict';
/* ============ ws-store.js — multi-áreas, formato .fluxo e gestos de touchpad ============ */

const WS_MAX_WORKSPACES = 5;
const WS_FILE_FORMAT = 'fluxo-workspace';
const WS_FILE_VERSION = 1;
const WS_INDEX_KEY = 'ws_index';
const WS_DEFAULT_ID = 'ws_default';
const WS_DEFAULT_NAME = 'Quadro principal';

function wsSanitizeName(name, fallback) {
  const s = String(name == null ? '' : name).replace(/\s+/g, ' ').trim();
  if (!s) return fallback || WS_DEFAULT_NAME;
  return s.slice(0, 42);
}

function wsFileSlug(name) {
  const raw = String(name || WS_DEFAULT_NAME)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return raw || 'area-de-trabalho';
}

function wsBoardMetaKey(wsId) {
  return 'board_' + String(wsId || WS_DEFAULT_ID);
}

function wsBgFileKey(wsId) {
  return 'bg_' + String(wsId || WS_DEFAULT_ID);
}

function wsArrayBufferToBase64(buf) {
  if (!buf) return '';
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  if (!bytes.length) return '';
  const chunk = 0x2000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    const sub = bytes.subarray(i, Math.min(i + chunk, bytes.length));
    binary += String.fromCharCode.apply(null, sub);
  }
  return btoa(binary);
}

function wsBase64ToArrayBuffer(b64) {
  let clean = String(b64 || '').trim();
  const comma = clean.indexOf(',');
  if (clean.startsWith('data:') && comma >= 0) clean = clean.slice(comma + 1);
  clean = clean.replace(/\s+/g, '');
  if (!clean) return new ArrayBuffer(0);
  const bin = atob(clean);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes.buffer;
}

function wsDefaultIndex(now) {
  const ts = Number(now) || Date.now();
  return {
    activeId: WS_DEFAULT_ID,
    items: [{ id: WS_DEFAULT_ID, name: WS_DEFAULT_NAME, updatedAt: ts }]
  };
}

function wsNormalizeIndex(raw, now) {
  const ts = Number(now) || Date.now();
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.items)) {
    return wsDefaultIndex(ts);
  }
  const seen = new Set();
  const items = [];
  for (let i = 0; i < raw.items.length && items.length < WS_MAX_WORKSPACES; i++) {
    const it = raw.items[i];
    if (!it || !it.id) continue;
    const id = String(it.id).trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    items.push({
      id,
      name: wsSanitizeName(it.name, 'Quadro ' + (items.length + 1)),
      updatedAt: Number.isFinite(Number(it.updatedAt)) ? Number(it.updatedAt) : ts
    });
  }
  if (!items.length) return wsDefaultIndex(ts);
  const activeId = items.some(it => it.id === raw.activeId) ? String(raw.activeId) : items[0].id;
  return { activeId, items };
}

function wsCreateWorkspaceEntry(index, name, newId, now) {
  const cur = wsNormalizeIndex(index, now);
  if (cur.items.length >= WS_MAX_WORKSPACES) {
    return { ok: false, reason: 'limit', limit: WS_MAX_WORKSPACES, index: cur };
  }
  const id = String(newId || '').trim();
  if (!id || cur.items.some(it => it.id === id)) {
    return { ok: false, reason: 'duplicate', limit: WS_MAX_WORKSPACES, index: cur };
  }
  const ts = Number(now) || Date.now();
  const entry = {
    id,
    name: wsSanitizeName(name, 'Quadro ' + (cur.items.length + 1)),
    updatedAt: ts
  };
  return {
    ok: true,
    entry,
    index: {
      activeId: entry.id,
      items: cur.items.concat([entry])
    }
  };
}

function wsRenameWorkspaceEntry(index, id, name, now) {
  const cur = wsNormalizeIndex(index, now);
  const target = String(id || '');
  const ts = Number(now) || Date.now();
  let found = false;
  const items = cur.items.map((it) => {
    if (it.id !== target) return it;
    found = true;
    return { id: it.id, name: wsSanitizeName(name, it.name), updatedAt: ts };
  });
  return { ok: found, index: { activeId: cur.activeId, items } };
}

function wsSwitchWorkspaceEntry(index, id) {
  const cur = wsNormalizeIndex(index);
  const target = String(id || '');
  if (!cur.items.some(it => it.id === target)) {
    return { ok: false, index: cur };
  }
  return { ok: true, index: { activeId: target, items: cur.items.slice() } };
}

function wsDeleteWorkspaceEntry(index, id) {
  const cur = wsNormalizeIndex(index);
  if (cur.items.length <= 1) {
    return { ok: false, reason: 'last', index: cur };
  }
  const target = String(id || '');
  const pos = cur.items.findIndex(it => it.id === target);
  if (pos < 0) return { ok: false, reason: 'missing', index: cur };
  const items = cur.items.filter(it => it.id !== target);
  let nextActive = cur.activeId;
  if (nextActive === target) {
    const pick = items[Math.min(pos, items.length - 1)] || items[0];
    nextActive = pick.id;
  }
  return {
    ok: true,
    deletedId: target,
    nextActiveId: nextActive,
    index: { activeId: nextActive, items }
  };
}

function buildWorkspaceExportBundle(opts) {
  opts = opts || {};
  const board = opts.board ? JSON.parse(JSON.stringify(opts.board)) : {};
  const pdfBuffers = opts.pdfBuffers || {};
  const imageUrls = opts.imageUrls || {};
  const pdfOut = {};
  const imgOut = {};

  (Array.isArray(board.pdfs) ? board.pdfs : []).forEach((p) => {
    if (!p || !p.id) return;
    const raw = pdfBuffers[p.id];
    if (raw) {
      pdfOut[p.id] = typeof raw === 'string' ? raw : wsArrayBufferToBase64(raw);
    }
  });
  (Array.isArray(board.images) ? board.images : []).forEach((im) => {
    if (!im || !im.id) return;
    const url = imageUrls[im.id];
    if (typeof url === 'string' && url) imgOut[im.id] = url;
  });

  const bg = typeof opts.bgDataUrl === 'string' && opts.bgDataUrl ? opts.bgDataUrl : null;
  if (board.bg && typeof board.bg === 'object') {
    board.bg.image = !!(board.bg.image && bg);
  }

  return {
    format: WS_FILE_FORMAT,
    version: WS_FILE_VERSION,
    name: wsSanitizeName(opts.name, WS_DEFAULT_NAME),
    exportedAt: opts.exportedAt || new Date().toISOString(),
    board,
    files: {
      bg,
      pdfs: pdfOut,
      images: imgOut
    }
  };
}

function parseWorkspaceImportBundle(rawTextOrObj, fallbackName) {
  let obj = rawTextOrObj;
  if (typeof obj === 'string') {
    const trimmed = obj.trim();
    if (!trimmed) return { ok: false, error: 'O arquivo selecionado está vazio.' };
    try {
      obj = JSON.parse(trimmed);
    } catch (e) {
      return { ok: false, error: 'Não foi possível ler o arquivo (.fluxo inválido).' };
    }
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return { ok: false, error: 'Estrutura de arquivo não reconhecida.' };
  }

  let board = null;
  let files = { bg: null, pdfs: {}, images: {} };
  let name = fallbackName || WS_DEFAULT_NAME;

  if (obj.format === WS_FILE_FORMAT) {
    if (!obj.board || typeof obj.board !== 'object' || Array.isArray(obj.board)) {
      return { ok: false, error: 'O arquivo não contém dados válidos do quadro.' };
    }
    board = obj.board;
    if (obj.name) name = obj.name;
    const f = obj.files && typeof obj.files === 'object' ? obj.files : {};
    files = {
      bg: typeof f.bg === 'string' && f.bg.startsWith('data:') ? f.bg : null,
      pdfs: f.pdfs && typeof f.pdfs === 'object' && !Array.isArray(f.pdfs) ? f.pdfs : {},
      images: f.images && typeof f.images === 'object' && !Array.isArray(f.images) ? f.images : {}
    };
  } else if (obj.board && typeof obj.board === 'object' && !Array.isArray(obj.board)) {
    board = obj.board;
    if (obj.name) name = obj.name;
    const f = obj.files && typeof obj.files === 'object' ? obj.files : {};
    files = {
      bg: typeof f.bg === 'string' && f.bg.startsWith('data:') ? f.bg : null,
      pdfs: f.pdfs && typeof f.pdfs === 'object' ? f.pdfs : {},
      images: f.images && typeof f.images === 'object' ? f.images : {}
    };
  } else if (Array.isArray(obj.cards) || Array.isArray(obj.strokes) || (obj.view && typeof obj.view === 'object')) {
    board = obj;
  } else {
    return { ok: false, error: 'Este arquivo não parece ser uma Área de Trabalho do Fluxo.' };
  }

  return {
    ok: true,
    name: wsSanitizeName(name, fallbackName || WS_DEFAULT_NAME),
    board,
    files
  };
}

function remapWorkspaceBundle(parsed, makeUid) {
  const gen = typeof makeUid === 'function'
    ? makeUid
    : (() => Math.random().toString(36).slice(2, 9) + Date.now().toString(36));
  const board = JSON.parse(JSON.stringify(parsed.board || {}));
  const srcFiles = parsed.files || { bg: null, pdfs: {}, images: {} };

  const pdfMap = new Map();
  const imgMap = new Map();
  const cardMap = new Map();
  const pdfFiles = {};
  const imageFiles = {};

  if (Array.isArray(board.pdfs)) {
    board.pdfs = board.pdfs.filter(p => p && p.id).map((p) => {
      const oldId = String(p.id);
      const nextId = String(gen());
      pdfMap.set(oldId, nextId);
      const rawB64 = srcFiles.pdfs && srcFiles.pdfs[oldId];
      if (typeof rawB64 === 'string' && rawB64.trim()) {
        try { pdfFiles[nextId] = wsBase64ToArrayBuffer(rawB64); } catch (e) { /* ignora pdf corrompido */ }
      }
      return Object.assign({}, p, { id: nextId });
    });
  }

  if (Array.isArray(board.images)) {
    board.images = board.images.filter(im => im && im.id).map((im) => {
      const oldId = String(im.id);
      const nextId = String(gen());
      imgMap.set(oldId, nextId);
      const rawUrl = srcFiles.images && srcFiles.images[oldId];
      if (typeof rawUrl === 'string' && rawUrl.startsWith('data:')) {
        imageFiles[nextId] = rawUrl;
      }
      return Object.assign({}, im, { id: nextId });
    });
  }

  if (Array.isArray(board.cards)) {
    board.cards = board.cards.filter(c => c && c.id).map((c) => {
      const oldId = String(c.id);
      const nextId = String(gen());
      cardMap.set(oldId, nextId);
      const next = Object.assign({}, c, { id: nextId });
      if (next.type === 'pdf' && next.pdfId) {
        next.pdfId = pdfMap.get(String(next.pdfId)) || String(next.pdfId);
      } else if (next.type === 'image' && next.imgId) {
        next.imgId = imgMap.get(String(next.imgId)) || String(next.imgId);
      } else if (next.source && next.source.pdfId) {
        next.source = Object.assign({}, next.source, {
          pdfId: pdfMap.get(String(next.source.pdfId)) || String(next.source.pdfId)
        });
      }
      return next;
    });
  }

  if (Array.isArray(board.arrows)) {
    board.arrows = board.arrows.map((a) => {
      if (!a) return a;
      return Object.assign({}, a, {
        id: String(gen()),
        from: cardMap.get(String(a.from)) || String(a.from),
        to: cardMap.get(String(a.to)) || String(a.to)
      });
    });
  }

  if (Array.isArray(board.strokes)) {
    board.strokes = board.strokes.map((st) => (st ? Object.assign({}, st, { id: String(gen()) }) : st));
  }

  const bgDataUrl = typeof srcFiles.bg === 'string' && srcFiles.bg.startsWith('data:') ? srcFiles.bg : null;
  if (board.bg && typeof board.bg === 'object') {
    board.bg.image = !!(board.bg.image && bgDataUrl);
  }

  return {
    name: wsSanitizeName(parsed.name, WS_DEFAULT_NAME),
    board,
    bgDataUrl,
    pdfFiles,
    imageFiles
  };
}

/* Classificação pura de gestos de wheel:
   - pinça no touchpad (ctrlKey/metaKey) -> zoom
   - arraste com dois dedos no touchpad (deltaX != 0, ou pixel delta pequeno/fracionário, ou sequência contínua) -> pan
   - roda discreta do mouse -> zoom */
function classifyWheelGesture(ev, state) {
  ev = ev || {};
  if (ev.ctrlKey || ev.metaKey) return 'zoom';
  if (ev.shiftKey) return 'pan';

  const dx = Math.abs(Number(ev.deltaX) || 0);
  const dy = Math.abs(Number(ev.deltaY) || 0);
  const mode = Number(ev.deltaMode) || 0;
  const now = Number(ev.timeStamp) || 0;

  if (dx > 0.1) {
    if (state) state.lastPanAt = now;
    return 'pan';
  }
  if (mode === 0 && dy > 0 && (dy < 48 || !Number.isInteger(dy))) {
    if (state) state.lastPanAt = now;
    return 'pan';
  }
  if (state && now > 0 && state.lastPanAt > 0 && (now - state.lastPanAt) < 240 && (dy < 96 || !Number.isInteger(dy))) {
    state.lastPanAt = now;
    return 'pan';
  }
  return 'zoom';
}
