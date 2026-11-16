'use strict';
/* ============ ws-brain.js — busca no quadro/PDFs, cartões de estudo e rede de ligações ============ */

const WS_CARD_TYPES = ['note', 'concept', 'checklist', 'group', 'pdf', 'image'];

const WS_CARD_TINTS = [
  { id: '',       label: 'Padrão', color: '' },
  { id: 'blue',   label: 'Azul',   color: '#6e8efb' },
  { id: 'mint',   label: 'Menta',  color: '#4fd1b5' },
  { id: 'amber',  label: 'Âmbar',  color: '#f2b84b' },
  { id: 'rose',   label: 'Rosa',   color: '#f07195' },
  { id: 'violet', label: 'Lilás',  color: '#b388eb' }
];

const WS_ARROW_KINDS = [
  { id: 'relates',  label: 'Relaciona', dash: '' },
  { id: 'supports', label: 'Sustenta',  dash: '', support: true },
  { id: 'contrast', label: 'Contrasta', dash: '7 5' },
  { id: 'sequence', label: 'Sequência', dash: '2.5 5' }
];

const WS_ARROW_DIRS = [
  { id: 'forward', label: '→' },
  { id: 'both',    label: '↔' },
  { id: 'none',    label: '—' }
];

const WS_ARROW_COLORS = [
  { id: '',        label: 'Tema',  value: '' },
  { id: '#8fa2ff', label: 'Azul',  value: '#8fa2ff' },
  { id: '#5fe3c4', label: 'Menta', value: '#5fe3c4' },
  { id: '#ffd166', label: 'Âmbar', value: '#ffd166' },
  { id: '#ff8fa3', label: 'Rosa',  value: '#ff8fa3' },
  { id: '#c792ea', label: 'Lilás', value: '#c792ea' }
];

function wsNormalizeText(s) {
  return String(s == null ? '' : s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function wsNormalizeTags(raw) {
  let parts = [];
  if (Array.isArray(raw)) parts = raw;
  else if (typeof raw === 'string') parts = raw.split(/[,\s;]+/);
  const out = [];
  const seen = new Set();
  for (let i = 0; i < parts.length && out.length < 8; i++) {
    const clean = String(parts[i] == null ? '' : parts[i])
      .replace(/^#+/, '')
      .replace(/[^\p{L}\p{N}_-]/gu, '')
      .toLowerCase()
      .slice(0, 24);
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    out.push(clean);
  }
  return out;
}

function wsFormatTagsLine(tags) {
  if (!Array.isArray(tags) || !tags.length) return '';
  return tags.map(t => '#' + t).join(' · ');
}

function wsNormalizeChecklistItems(raw, genId) {
  if (!Array.isArray(raw)) return [];
  const makeId = typeof genId === 'function' ? genId : (() => Math.random().toString(36).slice(2, 9));
  const out = [];
  for (let i = 0; i < raw.length && out.length < 40; i++) {
    const it = raw[i];
    if (!it || typeof it !== 'object') continue;
    out.push({
      id: String(it.id || makeId()),
      text: String(it.text == null ? '' : it.text).slice(0, 240),
      done: !!it.done
    });
  }
  return out;
}

function wsValidTint(tint) {
  const s = String(tint || '');
  return WS_CARD_TINTS.some(t => t.id === s) ? s : '';
}

function wsNormalizeArrow(raw, genId) {
  if (!raw || !raw.from || !raw.to || raw.from === raw.to) return null;
  const makeId = typeof genId === 'function' ? genId : (() => Math.random().toString(36).slice(2, 9));
  const kind = WS_ARROW_KINDS.some(k => k.id === raw.kind) ? raw.kind : 'relates';
  const dir = WS_ARROW_DIRS.some(d => d.id === raw.dir) ? raw.dir : 'forward';
  const color = /^#[0-9a-f]{3,8}$/i.test(String(raw.color || '')) ? String(raw.color) : '';
  const label = String(raw.label == null ? '' : raw.label).replace(/\s+/g, ' ').trim().slice(0, 48);
  return {
    id: String(raw.id || makeId()),
    from: String(raw.from),
    to: String(raw.to),
    kind,
    dir,
    label,
    color
  };
}

function wsArrowKindMeta(kind) {
  return WS_ARROW_KINDS.find(k => k.id === kind) || WS_ARROW_KINDS[0];
}

function wsCardTypeLabel(type) {
  switch (type) {
    case 'concept': return 'Conceito';
    case 'checklist': return 'Checklist';
    case 'group': return 'Grupo';
    case 'pdf': return 'PDF';
    case 'image': return 'Imagem';
    default: return 'Nota';
  }
}

function wsCardDisplayTitle(card, board) {
  if (!card) return 'Cartão';
  if (card.type === 'pdf') {
    const meta = board && Array.isArray(board.pdfs) ? board.pdfs.find(p => p && p.id === card.pdfId) : null;
    return (meta && meta.name) || 'PDF';
  }
  if (card.type === 'image') {
    const meta = board && Array.isArray(board.images) ? board.images.find(im => im && im.id === card.imgId) : null;
    return (meta && meta.name) || 'Imagem';
  }
  if (card.type === 'concept' || card.type === 'checklist' || card.type === 'group') {
    const t = String(card.title || '').trim();
    if (t) return t;
    return wsCardTypeLabel(card.type);
  }
  const firstLine = String(card.text || '').split('\n').map(l => l.trim()).find(Boolean);
  return firstLine ? firstLine.slice(0, 48) : 'Nota sem texto';
}

function wsGetCardConnections(board, cardId) {
  const incoming = [];
  const outgoing = [];
  const all = [];
  if (!board || !Array.isArray(board.arrows) || !cardId) {
    return { incoming, outgoing, all, total: 0 };
  }
  const cards = Array.isArray(board.cards) ? board.cards : [];
  const byId = new Map(cards.map(c => [c.id, c]));

  board.arrows.forEach((a) => {
    if (!a || (a.from !== cardId && a.to !== cardId)) return;
    const isOut = a.from === cardId;
    const partnerId = isOut ? a.to : a.from;
    const partner = byId.get(partnerId);
    if (!partner) return;
    const norm = wsNormalizeArrow(a);
    const kindMeta = wsArrowKindMeta(norm.kind);
    const entry = {
      arrowId: norm.id,
      partnerId,
      partnerType: partner.type,
      partnerTypeLabel: wsCardTypeLabel(partner.type),
      partnerTitle: wsCardDisplayTitle(partner, board),
      direction: norm.dir === 'both' ? 'both' : (norm.dir === 'none' ? 'none' : (isOut ? 'out' : 'in')),
      kind: norm.kind,
      kindLabel: kindMeta.label,
      label: norm.label || ''
    };
    if (norm.dir === 'both' || isOut) outgoing.push(entry);
    if (norm.dir === 'both' || !isOut) incoming.push(entry);
    all.push(entry);
  });

  return { incoming, outgoing, all, total: all.length };
}

function wsGroupChildIds(cards, groupCard) {
  if (!Array.isArray(cards) || !groupCard || groupCard.type !== 'group') return [];
  const gx1 = groupCard.x;
  const gy1 = groupCard.y;
  const gx2 = groupCard.x + groupCard.w;
  const gy2 = groupCard.y + groupCard.h;
  const ids = [];
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    if (!c || c.id === groupCard.id || c.type === 'group') continue;
    const cx = c.x + c.w / 2;
    const cy = c.y + c.h / 2;
    if (cx >= gx1 && cx <= gx2 && cy >= gy1 && cy <= gy2) ids.push(c.id);
  }
  return ids;
}

function wsExtractSnippet(rawText, normQuery) {
  const clean = String(rawText || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  if (!normQuery) return clean.slice(0, 88);
  const norm = wsNormalizeText(clean);
  const pos = norm.indexOf(normQuery);
  if (pos < 0) return clean.slice(0, 88);
  const approxIdx = Math.max(0, Math.min(clean.length - 1, Math.floor(pos * (clean.length / Math.max(1, norm.length)))));
  const start = Math.max(0, approxIdx - 28);
  const end = Math.min(clean.length, start + 88);
  return (start > 0 ? '…' : '') + clean.slice(start, end) + (end < clean.length ? '…' : '');
}

function wsSearchBoard(board, query, opts) {
  opts = opts || {};
  const scope = opts.scope || 'all'; // all | cards | pdfs | links
  const rawQ = String(query == null ? '' : query).trim();
  const normQ = wsNormalizeText(rawQ);
  const tagFilter = rawQ.startsWith('#') ? wsNormalizeText(rawQ.slice(1)) : '';
  const results = [];
  if (!board) return results;

  const cards = Array.isArray(board.cards) ? board.cards : [];
  const cardMap = new Map(cards.map(c => [c.id, c]));
  const pdfMap = new Map((Array.isArray(board.pdfs) ? board.pdfs : []).filter(p => p && p.id).map(p => [p.id, p]));
  const imgMap = new Map((Array.isArray(board.images) ? board.images : []).filter(im => im && im.id).map(im => [im.id, im]));

  if (scope === 'all' || scope === 'cards' || scope === 'pdfs') {
    cards.forEach((c) => {
      if (!c || !c.id) return;
      if (scope === 'pdfs' && c.type !== 'pdf') return;
      if (scope === 'cards' && c.type === 'pdf') return;

      const title = wsCardDisplayTitle(c, board);
      const typeLabel = wsCardTypeLabel(c.type);

      if (c.type === 'note') {
        const text = String(c.text || '');
        if (!normQ) {
          results.push({ kind: 'card', cardId: c.id, cardType: c.type, title, meta: typeLabel, snippet: wsExtractSnippet(text, ''), score: 10 });
          return;
        }
        const nTitle = wsNormalizeText(title);
        const nText = wsNormalizeText(text);
        if (nTitle.includes(normQ) || nText.includes(normQ)) {
          results.push({
            kind: 'card',
            cardId: c.id,
            cardType: c.type,
            title,
            meta: typeLabel,
            snippet: wsExtractSnippet(text, normQ),
            score: nTitle.startsWith(normQ) ? 90 : (nText.includes(normQ) ? 65 : 50)
          });
        }
      } else if (c.type === 'concept') {
        const tags = Array.isArray(c.tags) ? c.tags : [];
        const tagsLine = wsFormatTagsLine(tags);
        const body = String(c.text || '');
        const tagMatch = tagFilter
          ? tags.some(t => wsNormalizeText(t).includes(tagFilter))
          : tags.some(t => wsNormalizeText(t).includes(normQ));
        if (!normQ) {
          results.push({
            kind: 'card', cardId: c.id, cardType: c.type, title,
            meta: tagsLine ? (typeLabel + ' · ' + tagsLine) : typeLabel,
            snippet: wsExtractSnippet(body, ''),
            score: 14
          });
          return;
        }
        const nTitle = wsNormalizeText(title);
        const nBody = wsNormalizeText(body);
        if (tagMatch || nTitle.includes(normQ) || nBody.includes(normQ)) {
          results.push({
            kind: 'card',
            cardId: c.id,
            cardType: c.type,
            title,
            meta: tagsLine ? (typeLabel + ' · ' + tagsLine) : typeLabel,
            snippet: wsExtractSnippet(body || tagsLine, normQ),
            score: nTitle.includes(normQ) ? 95 : (tagMatch ? 85 : 68)
          });
        }
      } else if (c.type === 'checklist') {
        const items = Array.isArray(c.items) ? c.items : [];
        const doneCount = items.filter(it => it && it.done).length;
        const joined = items.map(it => it && it.text ? it.text : '').join(' · ');
        if (!normQ) {
          results.push({
            kind: 'card', cardId: c.id, cardType: c.type, title,
            meta: typeLabel + ' · ' + doneCount + '/' + items.length,
            snippet: wsExtractSnippet(joined, ''),
            score: 13
          });
          return;
        }
        const nTitle = wsNormalizeText(title);
        const hitItem = items.find(it => it && wsNormalizeText(it.text).includes(normQ));
        if (nTitle.includes(normQ) || hitItem) {
          results.push({
            kind: 'card', cardId: c.id, cardType: c.type, title,
            meta: typeLabel + ' · ' + doneCount + '/' + items.length,
            snippet: hitItem ? hitItem.text : wsExtractSnippet(joined, ''),
            score: nTitle.includes(normQ) ? 92 : 70
          });
        }
      } else if (c.type === 'group') {
        if (!normQ || wsNormalizeText(title).includes(normQ)) {
          results.push({
            kind: 'card', cardId: c.id, cardType: c.type, title,
            meta: 'Quadro agrupador',
            snippet: '',
            score: normQ ? 88 : 11
          });
        }
      } else if (c.type === 'image') {
        const im = imgMap.get(c.imgId);
        const name = (im && im.name) || 'Imagem';
        if (!normQ || wsNormalizeText(name).includes(normQ)) {
          results.push({
            kind: 'card', cardId: c.id, cardType: c.type, title: name,
            meta: typeLabel, snippet: '',
            score: normQ ? 72 : 9
          });
        }
      } else if (c.type === 'pdf') {
        const meta = pdfMap.get(c.pdfId);
        const pdfName = (meta && meta.name) || 'PDF';
        const pages = (meta && meta.pages) || 0;
        const highlights = (meta && Array.isArray(meta.highlights)) ? meta.highlights : [];
        if (!normQ) {
          results.push({
            kind: 'pdf', cardId: c.id, cardType: 'pdf', title: pdfName,
            meta: 'PDF' + (pages ? ' · ' + pages + ' pág.' : ''),
            snippet: highlights.length ? (highlights.length + ' destaque(s)') : '',
            score: 15
          });
          return;
        }
        let matched = false;
        if (wsNormalizeText(pdfName).includes(normQ)) {
          matched = true;
          results.push({
            kind: 'pdf', cardId: c.id, cardType: 'pdf', title: pdfName,
            meta: 'PDF' + (pages ? ' · ' + pages + ' pág.' : ''),
            snippet: 'Documento PDF',
            score: 86
          });
        }
        highlights.forEach((h) => {
          if (h && wsNormalizeText(h.text).includes(normQ)) {
            matched = true;
            results.push({
              kind: 'highlight',
              cardId: c.id,
              cardType: 'pdf',
              page: h.page,
              title: pdfName,
              meta: 'Destaque · p. ' + h.page,
              snippet: wsExtractSnippet(h.text, normQ),
              score: 78
            });
          }
        });
        if (!matched && scope === 'pdfs') {
          // sem match neste PDF
        }
      }
    });
  }

  if (scope === 'all' || scope === 'links') {
    (Array.isArray(board.arrows) ? board.arrows : []).forEach((rawArrow) => {
      const a = wsNormalizeArrow(rawArrow);
      if (!a) return;
      const fromC = cardMap.get(a.from);
      const toC = cardMap.get(a.to);
      if (!fromC || !toC) return;
      const fromTitle = wsCardDisplayTitle(fromC, board);
      const toTitle = wsCardDisplayTitle(toC, board);
      const kindLabel = wsArrowKindMeta(a.kind).label;
      const dirSym = a.dir === 'both' ? '↔' : (a.dir === 'none' ? '—' : '→');
      const fullLabel = fromTitle + ' ' + dirSym + ' ' + toTitle;
      const searchStr = wsNormalizeText([a.label, kindLabel, fromTitle, toTitle].join(' '));
      if (!normQ || searchStr.includes(normQ)) {
        results.push({
          kind: 'arrow',
          arrowId: a.id,
          cardId: a.from,
          title: a.label ? a.label : (kindLabel + ': ' + fullLabel),
          meta: 'Ligação · ' + kindLabel,
          snippet: fullLabel,
          score: a.label && wsNormalizeText(a.label).includes(normQ) ? 84 : (normQ ? 58 : 8)
        });
      }
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 40);
}

function wsSearchPdfPages(pagesText, query) {
  const normQ = wsNormalizeText(query);
  if (!normQ || !Array.isArray(pagesText)) return [];
  const matches = [];
  for (let i = 0; i < pagesText.length; i++) {
    const entry = pagesText[i];
    if (!entry || !entry.page || !entry.text) continue;
    const raw = String(entry.text);
    const norm = wsNormalizeText(raw);
    let idx = 0;
    let occ = 0;
    while (idx <= norm.length - normQ.length) {
      const hit = norm.indexOf(normQ, idx);
      if (hit < 0) break;
      matches.push({
        page: entry.page,
        occOnPage: occ,
        snippet: wsExtractSnippet(raw, normQ)
      });
      occ++;
      idx = hit + Math.max(1, normQ.length);
      if (matches.length >= 250) return matches;
    }
  }
  return matches;
}

function wsRectsIntersect(a, b) {
  if (!a || !b) return false;
  return a.x <= b.x + b.w && a.x + a.w >= b.x && a.y <= b.y + b.h && a.y + a.h >= b.y;
}

function wsStrokeBounds(stroke) {
  if (!stroke || !Array.isArray(stroke.points) || !stroke.points.length) return null;
  const pad = Math.max(4, (Number(stroke.size) || 4) * (stroke.tool === 'marker' ? 2 : 1.1));
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < stroke.points.length; i++) {
    const pt = stroke.points[i];
    if (!pt || !Number.isFinite(Number(pt.x)) || !Number.isFinite(Number(pt.y))) continue;
    const x = Number(pt.x);
    const y = Number(pt.y);
    if (x - pad < minX) minX = x - pad;
    if (y - pad < minY) minY = y - pad;
    if (x + pad > maxX) maxX = x + pad;
    if (y + pad > maxY) maxY = y + pad;
  }
  if (!Number.isFinite(minX)) return null;
  return { x: minX, y: minY, w: Math.max(2, maxX - minX), h: Math.max(2, maxY - minY) };
}

function wsStrokesBounds(strokes) {
  if (!Array.isArray(strokes) || !strokes.length) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < strokes.length; i++) {
    const b = wsStrokeBounds(strokes[i]);
    if (!b) continue;
    if (b.x < minX) minX = b.x;
    if (b.y < minY) minY = b.y;
    if (b.x + b.w > maxX) maxX = b.x + b.w;
    if (b.y + b.h > maxY) maxY = b.y + b.h;
  }
  if (!Number.isFinite(minX)) return null;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function wsFindItemsInBox(board, boxWorld) {
  const cardIds = [];
  const strokeIds = [];
  if (!board || !boxWorld) return { cardIds, strokeIds };
  const bx = Math.min(boxWorld.x, boxWorld.x + boxWorld.w);
  const by = Math.min(boxWorld.y, boxWorld.y + boxWorld.h);
  const bw = Math.abs(boxWorld.w);
  const bh = Math.abs(boxWorld.h);
  const normBox = { x: bx, y: by, w: bw, h: bh };

  const cards = Array.isArray(board.cards) ? board.cards : [];
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    if (!c || !c.id) continue;
    if (wsRectsIntersect({ x: Number(c.x) || 0, y: Number(c.y) || 0, w: Number(c.w) || 0, h: Number(c.h) || 0 }, normBox)) {
      cardIds.push(c.id);
    }
  }

  const strokes = Array.isArray(board.strokes) ? board.strokes : [];
  for (let i = 0; i < strokes.length; i++) {
    const st = strokes[i];
    if (!st || !st.id) continue;
    const sb = wsStrokeBounds(st);
    if (sb && wsRectsIntersect(sb, normBox)) strokeIds.push(st.id);
  }
  return { cardIds, strokeIds };
}

function wsMoveStrokePoints(stroke, dx, dy) {
  if (!stroke || !Array.isArray(stroke.points)) return;
  const rx = Number(dx) || 0;
  const ry = Number(dy) || 0;
  for (let i = 0; i < stroke.points.length; i++) {
    const pt = stroke.points[i];
    if (!pt) continue;
    pt.x = Math.round((Number(pt.x) + rx) * 100) / 100;
    pt.y = Math.round((Number(pt.y) + ry) * 100) / 100;
  }
}

const WS_SNAP_GRID = 26;

const WS_NOTE_FONTS = [
  { id: 'inter',     label: 'Inter',     family: "'Inter', system-ui, sans-serif" },
  { id: 'dmsans',    label: 'DM Sans',   family: "'DM Sans', system-ui, sans-serif" },
  { id: 'outfit',    label: 'Outfit',    family: "'Outfit', system-ui, sans-serif" },
  { id: 'space',     label: 'Space',     family: "'Space Grotesk', system-ui, sans-serif" },
  { id: 'playfair',  label: 'Playfair',  family: "'Playfair Display', serif" },
  { id: 'fraunces',  label: 'Fraunces',  family: "'Fraunces', serif" },
  { id: 'jetbrains', label: 'Mono',      family: "'JetBrains Mono', monospace" },
  { id: 'chakra',    label: 'Chakra',    family: "'Chakra Petch', sans-serif" }
];

const WS_NOTE_SIZES = [12, 14, 16, 18, 22];
const WS_NOTE_ALIGNS = ['left', 'center', 'right', 'justify'];
const WS_NOTE_BULLETS = ['disc', 'dash', 'arrow', 'decimal'];

function wsNormalizeNoteFont(id) {
  const s = String(id || 'inter');
  return WS_NOTE_FONTS.some(f => f.id === s) ? s : 'inter';
}

function wsNoteFontFamily(id) {
  const f = WS_NOTE_FONTS.find(x => x.id === id);
  return f ? f.family : "var(--font-ui)";
}

function wsNormalizeNoteSize(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return 14;
  return Math.min(28, Math.max(11, Math.round(n)));
}

function wsNormalizeNoteAlign(val) {
  const s = String(val || 'left').toLowerCase();
  return WS_NOTE_ALIGNS.includes(s) ? s : 'left';
}

function wsEscapeHtmlText(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function wsPlainTextToNoteHtml(text) {
  const norm = String(text == null ? '' : text).replace(/\r\n?/g, '\n');
  if (!norm) return '';
  const lines = norm.split('\n');
  return lines.map(line => (line ? '<div>' + wsEscapeHtmlText(line) + '</div>' : '<div><br></div>')).join('');
}

function wsSanitizeNoteHtml(html) {
  let s = String(html == null ? '' : html);
  if (!s.trim()) return '';
  s = s
    .replace(/<\s*(script|style|iframe|object|embed|svg|math|link|meta|base)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|style|iframe|object|embed|svg|math|link|meta|base)[^>]*\/?>/gi, '');

  const allowedTags = new Set(['b', 'strong', 'i', 'em', 'u', 's', 'strike', 'del', 'ul', 'ol', 'li', 'p', 'div', 'br', 'span']);
  const tagMap = { strong: 'b', em: 'i', strike: 's', del: 's' };

  return s.replace(/<(\/?)([a-z0-9-]+)([^>]*)>/gi, (full, slash, rawTag, rawAttrs) => {
    const lc = rawTag.toLowerCase();
    if (!allowedTags.has(lc)) return '';
    const tag = tagMap[lc] || lc;
    if (slash) return '</' + tag + '>';
    if (tag === 'br') return '<br>';

    let outAttrs = '';
    if (tag === 'ul') {
      const bm = /data-bullet\s*=\s*(['"]?)(disc|dash|arrow)\1/i.exec(rawAttrs || '');
      if (bm) outAttrs += ' data-bullet="' + bm[2].toLowerCase() + '"';
    }
    if (tag === 'div' || tag === 'p' || tag === 'li' || tag === 'span') {
      const sm = /style\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(rawAttrs || '');
      if (sm) {
        const styleStr = sm[1] != null ? sm[1] : sm[2];
        const alignM = /text-align\s*:\s*(left|center|right|justify)/i.exec(styleStr || '');
        if (alignM) outAttrs += ' style="text-align:' + alignM[1].toLowerCase() + '"';
      }
    }
    return '<' + tag + outAttrs + '>';
  }).slice(0, 40000);
}

function wsNoteHtmlToPlainText(html) {
  const s = String(html == null ? '' : html);
  if (!s) return '';
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|p|li|ul|ol)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd();
}

function wsShouldWheelScrollNote(metrics) {
  if (!metrics) return false;
  const sh = Number(metrics.scrollHeight) || 0;
  const ch = Number(metrics.clientHeight) || 0;
  return sh > ch + 2;
}

function wsComputeSnap(movingBox, otherBoxes, opts) {
  opts = opts || {};
  const gridSize = Math.max(8, Number(opts.gridSize) || WS_SNAP_GRID);
  const gap = Number(opts.gap != null ? opts.gap : gridSize);
  const snapDist = Number(opts.snapDist != null ? opts.snapDist : 7);
  const elemSnapDist = Number(opts.elemSnapDist != null ? opts.elemSnapDist : 12);
  const pullDist = Number(opts.pullDist != null ? opts.pullDist : 28);
  const revealDist = Number(opts.revealDist != null ? opts.revealDist : 54);
  const nearRadius = Number(opts.nearRadius != null ? opts.nearRadius : 220);
  const guideMaxGap = Number(opts.guideMaxGap != null ? opts.guideMaxGap : 150);

  const rx = Number(movingBox && movingBox.x) || 0;
  const ry = Number(movingBox && movingBox.y) || 0;
  const rw = Math.max(1, Number(movingBox && movingBox.w) || 1);
  const rh = Math.max(1, Number(movingBox && movingBox.h) || 1);
  const others = Array.isArray(otherBoxes) ? otherBoxes : [];

  let nearestBoxDist = Infinity;
  const enrichedOthers = [];
  for (let i = 0; i < others.length; i++) {
    const o = others[i];
    if (!o) continue;
    const ox = Number(o.x) || 0;
    const oy = Number(o.y) || 0;
    const ow = Math.max(1, Number(o.w) || 1);
    const oh = Math.max(1, Number(o.h) || 1);
    const gapX = Math.max(0, ox - (rx + rw), rx - (ox + ow));
    const gapY = Math.max(0, oy - (ry + rh), ry - (oy + oh));
    const boxDist = Math.hypot(gapX, gapY);
    if (boxDist < nearestBoxDist) nearestBoxDist = boxDist;
    enrichedOthers.push({ x: ox, y: oy, w: ow, h: oh, gapX, gapY, boxDist });
  }

  let proximity = 0;
  if (nearestBoxDist < nearRadius) {
    const pt = Math.max(0, Math.min(1, 1 - nearestBoxDist / nearRadius));
    proximity = pt * pt * (3 - 2 * pt);
  }

  const evalAxis = (rawVal, size, axis) => {
    const gridTarget = Math.round(rawVal / gridSize) * gridSize;
    const gridDist = Math.abs(rawVal - gridTarget);
    let bestElem = null;

    for (let i = 0; i < enrichedOthers.length; i++) {
      const o = enrichedOthers[i];
      if (o.boxDist > nearRadius) continue;
      const crossGap = axis === 'x' ? o.gapY : o.gapX;
      if (crossGap > guideMaxGap) continue;

      const ox = o.x;
      const oy = o.y;
      const ow = o.w;
      const oh = o.h;
      const pos = axis === 'x' ? ox : oy;
      const len = axis === 'x' ? ow : oh;
      const crossStart = axis === 'x' ? Math.min(ry, oy) : Math.min(rx, ox);
      const crossEnd = axis === 'x' ? Math.max(ry + rh, oy + oh) : Math.max(rx + rw, ox + ow);
      const crossProx = Math.max(0, Math.min(1, 1 - crossGap / guideMaxGap));

      const cands = [
        { val: pos, guide: pos },
        { val: pos + len - size, guide: pos + len },
        { val: pos + len / 2 - size / 2, guide: pos + len / 2 },
        { val: pos + len + gap, guide: pos + len + gap },
        { val: pos - gap - size, guide: pos - gap }
      ];
      for (let j = 0; j < cands.length; j++) {
        const dist = Math.abs(rawVal - cands[j].val);
        if (dist <= revealDist && (!bestElem || dist < bestElem.dist)) {
          bestElem = {
            target: cands[j].val,
            guide: cands[j].guide,
            dist,
            min: crossStart - 10,
            max: crossEnd + 10,
            crossProx
          };
        }
      }
    }

    let chosenTarget = gridTarget;
    let chosenDist = gridDist;
    let threshold = snapDist;
    let guide = null;
    let source = 'grid';

    if (bestElem && (bestElem.dist <= elemSnapDist || bestElem.dist <= gridDist + 2)) {
      chosenTarget = bestElem.target;
      chosenDist = bestElem.dist;
      threshold = elemSnapDist;
      guide = {
        pos: bestElem.guide,
        min: bestElem.min,
        max: bestElem.max,
        crossProx: bestElem.crossProx
      };
      source = 'element';
    }

    let out = rawVal;
    let snapped = false;
    let strength = 0;
    if (chosenDist <= threshold) {
      out = chosenTarget;
      snapped = true;
      strength = 1;
    } else if (chosenDist <= pullDist) {
      const t = (pullDist - chosenDist) / Math.max(1, pullDist - threshold);
      const pull = 0.28 * t * t;
      out = rawVal + (chosenTarget - rawVal) * pull;
      strength = 0.3 + 0.65 * t;
    } else if (chosenDist <= revealDist) {
      const t = (revealDist - chosenDist) / Math.max(1, revealDist - pullDist);
      strength = 0.3 * t;
    }

    if (guide) {
      guide.strength = strength * (0.28 + 0.72 * guide.crossProx);
    }

    return {
      val: out,
      target: chosenTarget,
      dist: chosenDist,
      snapped,
      strength,
      source,
      guide
    };
  };

  const ax = evalAxis(rx, rw, 'x');
  const ay = evalAxis(ry, rh, 'y');
  const radialDist = Math.hypot(rx - ax.target, ry - ay.target);
  const radialNear = Math.max(0, Math.min(1, 1 - radialDist / (revealDist * 1.15)));
  const moldStrength = Math.max(radialNear * radialNear, (ax.strength + ay.strength) * 0.5);
  const gridOpacity = 0.38 + 0.62 * proximity;
  const locked = !!((ax.snapped && ay.snapped) || (ax.snapped && ax.source === 'element') || (ay.snapped && ay.source === 'element'));

  return {
    x: ax.val,
    y: ay.val,
    targetX: ax.target,
    targetY: ay.target,
    snappedX: ax.snapped,
    snappedY: ay.snapped,
    locked,
    strengthX: ax.strength,
    strengthY: ay.strength,
    proximity,
    nearestDist: nearestBoxDist,
    gridOpacity,
    moldStrength,
    near: (ax.snapped && ay.snapped) || moldStrength > 0.58,
    guideX: ax.guide ? Object.assign({ snapped: ax.snapped }, ax.guide) : null,
    guideY: ay.guide ? Object.assign({ snapped: ay.snapped }, ay.guide) : null
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    WS_CARD_TYPES,
    WS_CARD_TINTS,
    WS_ARROW_KINDS,
    WS_ARROW_DIRS,
    WS_ARROW_COLORS,
    WS_SNAP_GRID,
    WS_NOTE_FONTS,
    WS_NOTE_SIZES,
    WS_NOTE_ALIGNS,
    WS_NOTE_BULLETS,
    wsNormalizeText,
    wsNormalizeTags,
    wsFormatTagsLine,
    wsNormalizeChecklistItems,
    wsValidTint,
    wsNormalizeArrow,
    wsArrowKindMeta,
    wsCardTypeLabel,
    wsCardDisplayTitle,
    wsGetCardConnections,
    wsGroupChildIds,
    wsSearchBoard,
    wsSearchPdfPages,
    wsRectsIntersect,
    wsStrokeBounds,
    wsStrokesBounds,
    wsFindItemsInBox,
    wsMoveStrokePoints,
    wsNormalizeNoteFont,
    wsNoteFontFamily,
    wsNormalizeNoteSize,
    wsNormalizeNoteAlign,
    wsPlainTextToNoteHtml,
    wsSanitizeNoteHtml,
    wsNoteHtmlToPlainText,
    wsShouldWheelScrollNote,
    wsComputeSnap
  };
}
