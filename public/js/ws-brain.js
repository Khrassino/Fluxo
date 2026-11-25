'use strict';
/* ============ ws-brain.js — busca no quadro/PDFs, cartões de estudo e rede de ligações ============ */

const WS_CARD_TYPES = ['note', 'concept', 'checklist', 'group', 'pdf', 'image'];

const WS_CARD_EDITABLE_SELECTOR = [
  '.ws-note-body',
  '.ws-formula-input',
  '.ws-concept-title',
  '.ws-concept-tags-inp',
  '.ws-check-title',
  '.ws-check-item-txt',
  '.ws-check-add input',
  '.ws-group-title',
  '.ws-pdf-sinput'
].join(', ');

function wsCanEditCard(opts) {
  if (!opts || !opts.cardId) return false;
  if (opts.drawMode || opts.selectMode || opts.linkFrom) return false;
  const ids = opts.selectedIds;
  if (!ids) return false;
  if (typeof ids.has === 'function') {
    return ids.size === 1 && ids.has(opts.cardId);
  }
  if (Array.isArray(ids)) {
    return ids.length === 1 && ids[0] === opts.cardId;
  }
  return false;
}

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

const WS_BG_PATTERNS = ['dots', 'lines', 'grid', 'cross', 'none'];

function wsNormalizeBgPattern(val) {
  const s = String(val || 'dots');
  return WS_BG_PATTERNS.includes(s) ? s : 'dots';
}

const WS_ARROW_ROUTINGS = ['s-curve', 'straight', 'orthogonal', 'organic'];
const WS_ARROW_LINE_STYLES = ['solid', 'dashed', 'dotted'];
const WS_ARROW_WIDTHS = [1.5, 2, 2.5, 3, 4];
const WS_ARROW_CAPS = ['auto', 'circle', 'square', 'diamond', 'bar', 'arrow', 'none', 'circle-open', 'square-open'];
const WS_ARROW_CAP_SHAPES = ['circle', 'square', 'diamond', 'bar', 'arrow', 'none'];

function wsNormalizeArrowCap(val) {
  const s = String(val || 'auto');
  return WS_ARROW_CAPS.includes(s) ? s : 'auto';
}

function wsNormalizeArrowRouting(val, allowAuto) {
  const s = String(val || (allowAuto ? 'auto' : 's-curve'));
  if (allowAuto && s === 'auto') return 'auto';
  return WS_ARROW_ROUTINGS.includes(s) ? s : (allowAuto ? 'auto' : 's-curve');
}

function wsNormalizeArrowLineStyle(val, allowAuto) {
  const s = String(val || (allowAuto ? 'auto' : 'solid'));
  if (allowAuto && s === 'auto') return 'auto';
  return WS_ARROW_LINE_STYLES.includes(s) ? s : (allowAuto ? 'auto' : 'solid');
}

function wsNormalizeArrowWidth(val, allowAuto) {
  if (allowAuto && (val === '' || val == null || Number(val) === 0)) return 0;
  const n = Number(val);
  if (!Number.isFinite(n) || n <= 0) return allowAuto ? 0 : 1.8;
  return clampNum(Math.round(n * 10) / 10, 1, 6);
}

function wsDefaultDirForKind(kind) {
  return (kind === 'supports' || kind === 'sequence') ? 'forward' : 'none';
}

function wsDefaultLinkSettings() {
  return {
    routing: 's-curve',
    types: {
      relates:  { cap: 'circle',  lineStyle: 'solid', width: 1.8, color: '' },
      contrast: { cap: 'square',  lineStyle: 'solid', width: 1.8, color: '' },
      supports: { cap: 'diamond', lineStyle: 'solid', width: 1.8, color: '' },
      sequence: { cap: 'arrow',   lineStyle: 'solid', width: 1.8, color: '' }
    }
  };
}

function wsNormalizeLinkDefaults(raw) {
  const def = wsDefaultLinkSettings();
  if (!raw || typeof raw !== 'object') return def;
  const out = {
    routing: wsNormalizeArrowRouting(raw.routing, false),
    types: {}
  };
  const srcTypes = raw.types && typeof raw.types === 'object' ? raw.types : {};
  ['relates', 'contrast', 'supports', 'sequence'].forEach((k) => {
    const base = def.types[k];
    const src = srcTypes[k] && typeof srcTypes[k] === 'object' ? srcTypes[k] : {};
    let cap = k === 'sequence' ? 'arrow' : String(src.cap || base.cap);
    if (!WS_ARROW_CAP_SHAPES.includes(cap)) cap = base.cap;
    out.types[k] = {
      cap,
      lineStyle: wsNormalizeArrowLineStyle(src.lineStyle, false),
      width: wsNormalizeArrowWidth(src.width, false),
      color: /^#[0-9a-f]{3,8}$/i.test(String(src.color || '')) ? String(src.color) : ''
    };
  });
  return out;
}

function wsDefaultShapeForKind(kind, linkDefaults) {
  if (kind === 'sequence') return 'arrow';
  const norm = linkDefaults ? wsNormalizeLinkDefaults(linkDefaults) : wsDefaultLinkSettings();
  const cfg = norm.types[kind] || norm.types.relates;
  return (cfg && cfg.cap) || (kind === 'contrast' ? 'square' : (kind === 'supports' ? 'diamond' : 'circle'));
}

function wsResolveEndPort(rawCap, defaultShape, side, dir) {
  const cap = wsNormalizeArrowCap(rawCap);
  const effectiveShape = cap === 'auto' ? defaultShape : cap;

  if (effectiveShape === 'none') {
    return { shape: 'none', mode: 'none', outsideOffset: 0, legacyCap: 'none' };
  }
  if (effectiveShape === 'arrow') {
    if (cap === 'arrow') {
      return { shape: 'arrow', mode: 'arrow', outsideOffset: 2, legacyCap: 'arrow' };
    }
    const active = dir === 'both' || (dir === 'forward' && side === 'end');
    return active
      ? { shape: 'arrow', mode: 'arrow', outsideOffset: 2, legacyCap: 'arrow' }
      : { shape: 'none', mode: 'none', outsideOffset: 0, legacyCap: 'none' };
  }
  if (effectiveShape === 'bar') {
    return { shape: 'bar', mode: 'bar', outsideOffset: 0, legacyCap: 'bar' };
  }
  if (effectiveShape === 'circle-open') {
    return { shape: 'circle', mode: 'open', outsideOffset: 0, legacyCap: 'circle-open' };
  }
  if (effectiveShape === 'square-open') {
    return { shape: 'square', mode: 'open', outsideOffset: 0, legacyCap: 'square-open' };
  }
  const hasCore = dir === 'both' || (dir === 'forward' && side === 'end');
  const mode = hasCore ? 'core' : 'open';
  const legacyCap = effectiveShape === 'circle'
    ? (hasCore ? 'circle' : 'circle-open')
    : (effectiveShape === 'square' ? (hasCore ? 'square' : 'square-open') : effectiveShape);
  return { shape: effectiveShape, mode, outsideOffset: 0, legacyCap };
}

function wsResolveArrowEndpoints(arrow, linkDefaults) {
  const kind = (arrow && WS_ARROW_KINDS.some(k => k.id === arrow.kind)) ? arrow.kind : 'relates';
  const dir = (arrow && WS_ARROW_DIRS.some(d => d.id === arrow.dir)) ? arrow.dir : wsDefaultDirForKind(kind);
  const defShape = wsDefaultShapeForKind(kind, linkDefaults);

  if (kind === 'sequence') {
    const startCap = arrow && arrow.startCap && arrow.startCap !== 'auto' ? arrow.startCap : 'auto';
    const endCap = arrow && arrow.endCap && arrow.endCap !== 'auto' ? arrow.endCap : 'auto';
    return {
      start: wsResolveEndPort(startCap, 'arrow', 'start', dir),
      end: wsResolveEndPort(endCap, 'arrow', 'end', dir)
    };
  }
  return {
    start: wsResolveEndPort(arrow && arrow.startCap, defShape, 'start', dir),
    end: wsResolveEndPort(arrow && arrow.endCap, defShape, 'end', dir)
  };
}

function wsResolveArrowCaps(arrow, linkDefaults) {
  const res = wsResolveArrowEndpoints(arrow, linkDefaults);
  return {
    startCap: res.start.legacyCap,
    endCap: res.end.legacyCap
  };
}

function wsLineDashArray(lineStyle, width) {
  const w = Math.max(1.2, Number(width) || 1.8);
  if (lineStyle === 'dashed') return (w * 3.8).toFixed(1) + ' ' + (w * 2.6).toFixed(1);
  if (lineStyle === 'dotted') return (w * 0.9).toFixed(1) + ' ' + (w * 2.5).toFixed(1);
  return '';
}

function wsResolveArrowStyle(arrow, linkDefaults) {
  const normDefs = linkDefaults ? wsNormalizeLinkDefaults(linkDefaults) : wsDefaultLinkSettings();
  const kind = (arrow && WS_ARROW_KINDS.some(k => k.id === arrow.kind)) ? arrow.kind : 'relates';
  const typeDef = normDefs.types[kind] || normDefs.types.relates;

  const routing = (arrow && arrow.routing && arrow.routing !== 'auto')
    ? wsNormalizeArrowRouting(arrow.routing, false)
    : normDefs.routing;
  const lineStyle = (arrow && arrow.lineStyle && arrow.lineStyle !== 'auto')
    ? wsNormalizeArrowLineStyle(arrow.lineStyle, false)
    : typeDef.lineStyle;
  const width = (arrow && Number(arrow.width) > 0)
    ? wsNormalizeArrowWidth(arrow.width, false)
    : typeDef.width;
  const color = (arrow && /^#[0-9a-f]{3,8}$/i.test(String(arrow.color || '')))
    ? String(arrow.color)
    : (typeDef.color || '');
  const dashArray = wsLineDashArray(lineStyle, width);
  return { routing, lineStyle, width, color, dashArray };
}

function wsArrowCardPairKey(aId, bId) {
  const sa = String(aId || '');
  const sb = String(bId || '');
  return sa < sb ? (sa + '|' + sb) : (sb + '|' + sa);
}

function wsBuildArrowPairIndex(arrows) {
  const map = new Map();
  if (!Array.isArray(arrows)) return map;
  for (let i = 0; i < arrows.length; i++) {
    const a = arrows[i];
    if (!a || !a.from || !a.to) continue;
    const key = wsArrowCardPairKey(a.from, a.to);
    let list = map.get(key);
    if (!list) {
      list = [];
      map.set(key, list);
    }
    list.push(a);
  }
  return map;
}

function wsRayBoxEdge(rect, tx, ty, outwardOffset, originShiftX, originShiftY) {
  const x = Number(rect && rect.x) || 0;
  const y = Number(rect && rect.y) || 0;
  const w = Math.max(1, Number(rect && rect.w) || 1);
  const h = Math.max(1, Number(rect && rect.h) || 1);
  const cx = x + w / 2;
  const cy = y + h / 2;
  const sx = clampNum(originShiftX || 0, -w * 0.32, w * 0.32);
  const sy = clampNum(originShiftY || 0, -h * 0.32, h * 0.32);
  const ox = cx + sx;
  const oy = cy + sy;
  const dx = tx - ox;
  const dy = ty - oy;
  if (!dx && !dy) return { x: ox, y: oy, nx: 1, ny: 0, side: 'right' };

  const halfLeft = (ox - x);
  const halfRight = (x + w - ox);
  const halfTop = (oy - y);
  const halfBot = (y + h - oy);
  const txRatio = dx > 0 ? halfRight / dx : (dx < 0 ? halfLeft / -dx : Infinity);
  const tyRatio = dy > 0 ? halfBot / dy : (dy < 0 ? halfTop / -dy : Infinity);
  const tEdge = Math.min(txRatio, tyRatio);
  const ex = ox + dx * tEdge;
  const ey = oy + dy * tEdge;

  let nx = 0, ny = 0, side = 'right';
  if (txRatio <= tyRatio) {
    nx = dx >= 0 ? 1 : -1;
    side = nx > 0 ? 'right' : 'left';
  } else {
    ny = dy >= 0 ? 1 : -1;
    side = ny > 0 ? 'bottom' : 'top';
  }
  const off = Number(outwardOffset) || 0;
  const dLen = Math.hypot(dx, dy) || 1;
  return {
    x: ex + (dx / dLen) * off,
    y: ey + (dy / dLen) * off,
    nx,
    ny,
    side
  };
}

function wsPickNearestSides(fromRect, toRect) {
  const fcx = fromRect.x + fromRect.w / 2;
  const fcy = fromRect.y + fromRect.h / 2;
  const tcx = toRect.x + toRect.w / 2;
  const tcy = toRect.y + toRect.h / 2;
  const dx = tcx - fcx;
  const dy = tcy - fcy;
  const spanX = Math.max(1, (fromRect.w + toRect.w) * 0.5);
  const spanY = Math.max(1, (fromRect.h + toRect.h) * 0.5);

  if (Math.abs(dx) / spanX >= Math.abs(dy) / spanY) {
    return dx >= 0
      ? { fromSide: 'right', toSide: 'left' }
      : { fromSide: 'left', toSide: 'right' };
  }
  return dy >= 0
    ? { fromSide: 'bottom', toSide: 'top' }
    : { fromSide: 'top', toSide: 'bottom' };
}

function wsSideMidpointAnchor(rect, side, laneOffset, outwardOffset) {
  const x = Number(rect && rect.x) || 0;
  const y = Number(rect && rect.y) || 0;
  const w = Math.max(1, Number(rect && rect.w) || 1);
  const h = Math.max(1, Number(rect && rect.h) || 1);
  const padX = Math.min(14, w * 0.25);
  const padY = Math.min(14, h * 0.25);
  const lane = Number(laneOffset) || 0;
  const off = Number(outwardOffset) || 0;

  if (side === 'left') {
    return {
      x: x - off,
      y: clampNum(y + h / 2 + lane, y + padY, y + h - padY),
      nx: -1,
      ny: 0,
      side
    };
  }
  if (side === 'right') {
    return {
      x: x + w + off,
      y: clampNum(y + h / 2 + lane, y + padY, y + h - padY),
      nx: 1,
      ny: 0,
      side
    };
  }
  if (side === 'top') {
    return {
      x: clampNum(x + w / 2 + lane, x + padX, x + w - padX),
      y: y - off,
      nx: 0,
      ny: -1,
      side
    };
  }
  return {
    x: clampNum(x + w / 2 + lane, x + padX, x + w - padX),
    y: y + h + off,
    nx: 0,
    ny: 1,
    side: 'bottom'
  };
}

function wsLabelAbovePos(mx, my, tx, ty) {
  const tLen = Math.hypot(tx, ty) || 1;
  const ux = tx / tLen;
  const uy = ty / tLen;
  let nx = -uy;
  let ny = ux;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  if (Math.abs(ny) < 0.28) {
    return { lx: mx, ly: my - 13.5 };
  }
  return {
    lx: mx + nx * 13.5,
    ly: my + ny * 13.5
  };
}

function wsBuildArrowGeometry(fromRect, toRect, opts) {
  opts = opts || {};
  const routing = wsNormalizeArrowRouting(opts.routing || 's-curve', false);
  const lane = Number(opts.laneOffset) || 0;
  const startOff = Number(opts.startOffset) || 0;
  const endOff = Number(opts.endOffset) || 0;

  const fc = { x: fromRect.x + fromRect.w / 2, y: fromRect.y + fromRect.h / 2 };
  const tc = { x: toRect.x + toRect.w / 2, y: toRect.y + toRect.h / 2 };

  if (routing === 'straight') {
    const cdx = tc.x - fc.x;
    const cdy = tc.y - fc.y;
    const cDist = Math.hypot(cdx, cdy) || 1;
    const cnx = -cdy / cDist;
    const cny = cdx / cDist;
    const shiftX = cnx * lane * 0.55;
    const shiftY = cny * lane * 0.55;
    const p1 = wsRayBoxEdge(fromRect, tc.x + shiftX, tc.y + shiftY, startOff, shiftX, shiftY);
    const p2 = wsRayBoxEdge(toRect, fc.x + shiftX, fc.y + shiftY, endOff, shiftX, shiftY);
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const lpos = wsLabelAbovePos(mx, my, dx, dy);
    return {
      d: 'M' + p1.x.toFixed(1) + ' ' + p1.y.toFixed(1) + ' L' + p2.x.toFixed(1) + ' ' + p2.y.toFixed(1),
      x1: p1.x, y1: p1.y,
      x2: p2.x, y2: p2.y,
      mx, my,
      lx: lpos.lx, ly: lpos.ly,
      startAngle: Math.atan2(dy, dx) * 180 / Math.PI,
      endAngle: Math.atan2(dy, dx) * 180 / Math.PI,
      p1, p2
    };
  }

  const sides = wsPickNearestSides(fromRect, toRect);
  const p1 = wsSideMidpointAnchor(fromRect, sides.fromSide, lane * 0.55, startOff);
  const p2 = wsSideMidpointAnchor(toRect, sides.toSide, lane * 0.55, endOff);
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy) || 1;
  const startAngle = Math.atan2(p1.ny, p1.nx) * 180 / Math.PI;
  const endAngle = Math.atan2(-p2.ny, -p2.nx) * 180 / Math.PI;

  if (routing === 'orthogonal') {
    const horiz = sides.fromSide === 'left' || sides.fromSide === 'right';
    const stub = 24;
    const pts = [{ x: p1.x, y: p1.y }];
    if (horiz) {
      const forward = dx * p1.nx >= 12;
      if (forward) {
        const midX = (p1.x + p2.x) / 2 + lane * 0.35;
        pts.push({ x: midX, y: p1.y }, { x: midX, y: p2.y });
      } else {
        const sx1 = p1.x + p1.nx * stub;
        const sx2 = p2.x + p2.nx * stub;
        const midY = (p1.y + p2.y) / 2 + lane * 0.35;
        pts.push({ x: sx1, y: p1.y }, { x: sx1, y: midY }, { x: sx2, y: midY }, { x: sx2, y: p2.y });
      }
    } else {
      const forward = dy * p1.ny >= 12;
      if (forward) {
        const midY = (p1.y + p2.y) / 2 + lane * 0.35;
        pts.push({ x: p1.x, y: midY }, { x: p2.x, y: midY });
      } else {
        const sy1 = p1.y + p1.ny * stub;
        const sy2 = p2.y + p2.ny * stub;
        const midX = (p1.x + p2.x) / 2 + lane * 0.35;
        pts.push({ x: p1.x, y: sy1 }, { x: midX, y: sy1 }, { x: midX, y: sy2 }, { x: p2.x, y: sy2 });
      }
    }
    pts.push({ x: p2.x, y: p2.y });

    let totalLen = 0;
    const segLens = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const sl = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
      segLens.push(sl);
      totalLen += sl;
    }
    let half = totalLen / 2;
    let mx = (p1.x + p2.x) / 2;
    let my = (p1.y + p2.y) / 2;
    let mtx = dx, mty = dy;
    for (let i = 0; i < segLens.length; i++) {
      if (half <= segLens[i] || i === segLens.length - 1) {
        const frac = segLens[i] > 0.01 ? clampNum(half / segLens[i], 0, 1) : 0.5;
        mx = pts[i].x + (pts[i + 1].x - pts[i].x) * frac;
        my = pts[i].y + (pts[i + 1].y - pts[i].y) * frac;
        mtx = pts[i + 1].x - pts[i].x;
        mty = pts[i + 1].y - pts[i].y;
        break;
      }
      half -= segLens[i];
    }
    const lpos = wsLabelAbovePos(mx, my, mtx || dx, mty || dy);
    const d = pts.map((pt, i) => (i === 0 ? 'M' : 'L') + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1)).join(' ');
    return {
      d, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
      mx, my, lx: lpos.lx, ly: lpos.ly,
      startAngle, endAngle, p1, p2
    };
  }

  if (routing === 'organic') {
    const geom = wsArrowCurveGeometry(p1, p2, fc, tc, 0);
    const bendNx = -dy / dist;
    const bendNy = dx / dist;
    const c1x = geom.c1x + bendNx * lane * 0.85;
    const c1y = geom.c1y + bendNy * lane * 0.85;
    const c2x = geom.c2x + bendNx * lane * 0.85;
    const c2y = geom.c2y + bendNy * lane * 0.85;
    const d = 'M' + p1.x.toFixed(1) + ' ' + p1.y.toFixed(1) +
      ' C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ', ' +
      c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ', ' +
      p2.x.toFixed(1) + ' ' + p2.y.toFixed(1);
    const mx = 0.125 * p1.x + 0.375 * c1x + 0.375 * c2x + 0.125 * p2.x;
    const my = 0.125 * p1.y + 0.375 * c1y + 0.375 * c2y + 0.125 * p2.y;
    const tanX = 0.75 * (c2x - c1x) + 0.25 * (p2.x - p1.x);
    const tanY = 0.75 * (c2y - c1y) + 0.25 * (p2.y - p1.y);
    const lpos = wsLabelAbovePos(mx, my, tanX || dx, tanY || dy);
    return {
      d, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
      c1x, c1y, c2x, c2y,
      mx, my, lx: lpos.lx, ly: lpos.ly,
      startAngle: Math.atan2(c1y - p1.y, c1x - p1.x) * 180 / Math.PI,
      endAngle: Math.atan2(p2.y - c2y, p2.x - c2x) * 180 / Math.PI,
      p1, p2
    };
  }

  /* s-curve (padrão) — sai perpendicular pelo meio do lado mais próximo */
  const horiz = sides.fromSide === 'left' || sides.fromSide === 'right';
  const primaryDist = horiz ? Math.abs(dx) : Math.abs(dy);
  const handle = clampNum(Math.max(primaryDist * 0.5, dist * 0.28, 36), 34, 210);
  const nx = -dy / dist;
  const ny = dx / dist;
  const c1x = p1.x + p1.nx * handle + nx * lane * 0.3;
  const c1y = p1.y + p1.ny * handle + ny * lane * 0.3;
  const c2x = p2.x + p2.nx * handle + nx * lane * 0.3;
  const c2y = p2.y + p2.ny * handle + ny * lane * 0.3;
  const d = 'M' + p1.x.toFixed(1) + ' ' + p1.y.toFixed(1) +
    ' C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ', ' +
    c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ', ' +
    p2.x.toFixed(1) + ' ' + p2.y.toFixed(1);
  const mx = 0.125 * p1.x + 0.375 * c1x + 0.375 * c2x + 0.125 * p2.x;
  const my = 0.125 * p1.y + 0.375 * c1y + 0.375 * c2y + 0.125 * p2.y;
  const tanX = 0.75 * (c2x - c1x) + 0.25 * (p2.x - p1.x);
  const tanY = 0.75 * (c2y - c1y) + 0.25 * (p2.y - p1.y);
  const lpos = wsLabelAbovePos(mx, my, tanX || dx, tanY || dy);
  return {
    d, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
    c1x, c1y, c2x, c2y,
    mx, my, lx: lpos.lx, ly: lpos.ly,
    startAngle, endAngle, p1, p2
  };
}

function wsArrowCurveGeometry(p1, p2, fc, tc, laneOffset) {
  const x1 = Number(p1 && p1.x) || 0;
  const y1 = Number(p1 && p1.y) || 0;
  const x2 = Number(p2 && p2.x) || 0;
  const y2 = Number(p2 && p2.y) || 0;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = -dy / dist;
  const ny = dx / dist;
  const lane = Number(laneOffset) || 0;

  // Deslocamento lateral suave apenas para separar ligações paralelas + flexão natural
  const sx1 = x1 + nx * lane * 0.45;
  const sy1 = y1 + ny * lane * 0.45;
  const sx2 = x2 + nx * lane * 0.45;
  const sy2 = y2 + ny * lane * 0.45;

  let c1x, c1y, c2x, c2y;
  const bend = clampNum(dist * 0.38, 36, 175);
  const fcx = fc ? Number(fc.x) || x1 : x1;
  const fcy = fc ? Number(fc.y) || y1 : y1;
  const tcx = tc ? Number(tc.x) || x2 : x2;
  const tcy = tc ? Number(tc.y) || y2 : y2;

  const outX = p1 && p1.nx != null ? p1.nx : (x1 - fcx);
  const outY = p1 && p1.ny != null ? p1.ny : (y1 - fcy);
  const inX = p2 && p2.nx != null ? p2.nx : (x2 - tcx);
  const inY = p2 && p2.ny != null ? p2.ny : (y2 - tcy);

  if (Math.hypot(outX, outY) > 0.2 && Math.hypot(inX, inY) > 0.2) {
    const outLen = Math.hypot(outX, outY) || 1;
    const inLen = Math.hypot(inX, inY) || 1;
    const ux1 = outX / outLen;
    const uy1 = outY / outLen;
    const ux2 = inX / inLen;
    const uy2 = inY / inLen;
    c1x = sx1 + ux1 * bend + nx * lane * 0.85;
    c1y = sy1 + uy1 * bend + ny * lane * 0.85;
    c2x = sx2 + ux2 * bend + nx * lane * 0.85;
    c2y = sy2 + uy2 * bend + ny * lane * 0.85;
  } else {
    const bow = lane !== 0 ? lane * 1.15 : clampNum(dist * 0.14, 14, 48);
    c1x = sx1 + dx * 0.32 + nx * bow;
    c1y = sy1 + dy * 0.32 + ny * bow;
    c2x = sx2 - dx * 0.32 + nx * bow;
    c2y = sy2 - dy * 0.32 + ny * bow;
  }

  const d = 'M' + sx1.toFixed(1) + ' ' + sy1.toFixed(1) +
    ' C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ', ' +
    c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ', ' +
    sx2.toFixed(1) + ' ' + sy2.toFixed(1);

  const mx = 0.125 * sx1 + 0.375 * c1x + 0.375 * c2x + 0.125 * sx2;
  const my = 0.125 * sy1 + 0.375 * c1y + 0.375 * c2y + 0.125 * sy2;

  return { d, mx, my, x1: sx1, y1: sy1, x2: sx2, y2: sy2, c1x, c1y, c2x, c2y };
}

function clampNum(v, a, b) {
  return Math.min(b, Math.max(a, v));
}

function wsNormalizeArrow(raw, genId) {
  if (!raw || !raw.from || !raw.to || raw.from === raw.to) return null;
  const makeId = typeof genId === 'function' ? genId : (() => Math.random().toString(36).slice(2, 9));
  const kind = WS_ARROW_KINDS.some(k => k.id === raw.kind) ? raw.kind : 'relates';
  const dir = WS_ARROW_DIRS.some(d => d.id === raw.dir) ? raw.dir : wsDefaultDirForKind(kind);
  const color = /^#[0-9a-f]{3,8}$/i.test(String(raw.color || '')) ? String(raw.color) : '';
  const label = String(raw.label == null ? '' : raw.label).replace(/\s+/g, ' ').trim().slice(0, 48);
  const startCap = wsNormalizeArrowCap(raw.startCap);
  const endCap = wsNormalizeArrowCap(raw.endCap);
  const routing = wsNormalizeArrowRouting(raw.routing, true);
  const lineStyle = wsNormalizeArrowLineStyle(raw.lineStyle, true);
  const width = wsNormalizeArrowWidth(raw.width, true);
  return {
    id: String(raw.id || makeId()),
    from: String(raw.from),
    to: String(raw.to),
    kind,
    dir,
    routing,
    lineStyle,
    width,
    label,
    color,
    startCap,
    endCap
  };
}

function wsArrowKindMeta(kind) {
  const base = WS_ARROW_KINDS.find(k => k.id === kind) || WS_ARROW_KINDS[0];
  if (typeof t === 'function') {
    return Object.assign({}, base, { label: t('ws.arrow.' + base.id, null, base.label) });
  }
  return base;
}

function wsCardTypeLabel(type) {
  const trFn = typeof t === 'function' ? t : null;
  switch (type) {
    case 'concept': return trFn ? trFn('ws.card.concept', null, 'Conceito') : 'Conceito';
    case 'checklist': return trFn ? trFn('ws.card.checklist', null, 'Checklist') : 'Checklist';
    case 'group': return trFn ? trFn('ws.card.group', null, 'Quadro') : 'Quadro';
    case 'pdf': return trFn ? trFn('ws.card.pdf', null, 'PDF') : 'PDF';
    case 'image': return trFn ? trFn('ws.card.image', null, 'Imagem') : 'Imagem';
    default: return trFn ? trFn('ws.card.note', null, 'Nota') : 'Nota';
  }
}

function wsCardDisplayTitle(card, board) {
  const trFn = typeof t === 'function' ? t : null;
  if (!card) return trFn ? trFn('ws.card.generic', null, 'Cartão') : 'Cartão';
  if (card.type === 'pdf') {
    const meta = board && Array.isArray(board.pdfs) ? board.pdfs.find(p => p && p.id === card.pdfId) : null;
    return (meta && meta.name) || (trFn ? trFn('ws.card.pdf', null, 'PDF') : 'PDF');
  }
  if (card.type === 'image') {
    const meta = board && Array.isArray(board.images) ? board.images.find(im => im && im.id === card.imgId) : null;
    return (meta && meta.name) || (trFn ? trFn('ws.card.image', null, 'Imagem') : 'Imagem');
  }
  if (card.type === 'concept' || card.type === 'checklist' || card.type === 'group') {
    const ttl = String(card.title || '').trim();
    if (ttl) return ttl;
    return wsCardTypeLabel(card.type);
  }
  const firstLine = String(card.text || '').split('\n').map(l => l.trim()).find(Boolean);
  return firstLine ? firstLine.slice(0, 48) : (trFn ? trFn('ws.card.noteEmpty', null, 'Nota sem texto') : 'Nota sem texto');
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

function wsSelectGroupableCards(cards, selectedIds) {
  if (!Array.isArray(cards) || !selectedIds) return [];
  const selSet = selectedIds instanceof Set ? selectedIds : new Set(Array.isArray(selectedIds) ? selectedIds : []);
  if (!selSet.size) return [];
  const out = [];
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    if (!c || !c.id || c.type === 'group' || !selSet.has(c.id)) continue;
    if (!Number.isFinite(c.x) || !Number.isFinite(c.y)) continue;
    out.push(c);
  }
  return out;
}

function wsCountGroupableCards(cards, selectedIds) {
  return wsSelectGroupableCards(cards, selectedIds).length;
}

function wsComputeGroupBounds(cards, selectedIds, opts) {
  const items = wsSelectGroupableCards(cards, selectedIds);
  if (items.length < 2) return null;
  opts = opts || {};
  const padX = Number.isFinite(opts.padX) ? opts.padX : 24;
  const padTop = Number.isFinite(opts.padTop) ? opts.padTop : 64;
  const padBottom = Number.isFinite(opts.padBottom) ? opts.padBottom : 46;
  const minW = Number.isFinite(opts.minW) ? opts.minW : 280;
  const minH = Number.isFinite(opts.minH) ? opts.minH : 180;
  const maxW = Number.isFinite(opts.maxW) ? opts.maxW : 4800;
  const maxH = Number.isFinite(opts.maxH) ? opts.maxH : 4800;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const childIds = [];

  for (let i = 0; i < items.length; i++) {
    const c = items[i];
    const cw = Math.max(1, Number(c.w) || 0);
    const ch = Math.max(1, Number(c.h) || 0);
    if (c.x < minX) minX = c.x;
    if (c.y < minY) minY = c.y;
    if (c.x + cw > maxX) maxX = c.x + cw;
    if (c.y + ch > maxY) maxY = c.y + ch;
    childIds.push(c.id);
  }

  const rawW = (maxX - minX) + padX * 2;
  const rawH = (maxY - minY) + padTop + padBottom;
  const w = Math.min(maxW, Math.max(minW, Math.round(rawW)));
  const h = Math.min(maxH, Math.max(minH, Math.round(rawH)));
  const extraX = Math.max(0, (w - rawW) / 2);
  const extraY = Math.max(0, (h - rawH) / 2);
  const x = Math.round(minX - padX - extraX);
  const y = Math.round(minY - padTop - extraY);

  return { x, y, w, h, childIds };
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
            meta: typeof t === 'function' ? t('ws.card.groupMeta', null, 'Quadro agrupador') : 'Quadro agrupador',
            snippet: '',
            score: normQ ? 88 : 11
          });
        }
      } else if (c.type === 'image') {
        const im = imgMap.get(c.imgId);
        const name = (im && im.name) || (typeof t === 'function' ? t('ws.card.image', null, 'Imagem') : 'Imagem');
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
        const pagesMeta = pages ? (' · ' + (typeof t === 'function' ? t('ws.card.pdfPages', { n: pages }, pages + ' pág.') : (pages + ' pág.'))) : '';
        if (!normQ) {
          results.push({
            kind: 'pdf', cardId: c.id, cardType: 'pdf', title: pdfName,
            meta: 'PDF' + pagesMeta,
            snippet: highlights.length ? (typeof t === 'function' ? t('ws.card.pdfHighlights', { n: highlights.length }, highlights.length + ' destaque(s)') : (highlights.length + ' destaque(s)')) : '',
            score: 15
          });
          return;
        }
        let matched = false;
        if (wsNormalizeText(pdfName).includes(normQ)) {
          matched = true;
          results.push({
            kind: 'pdf', cardId: c.id, cardType: 'pdf', title: pdfName,
            meta: 'PDF' + pagesMeta,
            snippet: typeof t === 'function' ? t('ws.card.pdfDoc', null, 'Documento PDF') : 'Documento PDF',
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
              meta: typeof t === 'function' ? t('ws.card.hlMeta', { page: h.page }, 'Destaque · p. ' + h.page) : ('Destaque · p. ' + h.page),
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
          meta: typeof t === 'function' ? t('ws.card.linkMeta', { kind: kindLabel }, 'Ligação · ' + kindLabel) : ('Ligação · ' + kindLabel),
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

function wsPointToSegmentDistSq(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const lenSq = vx * vx + vy * vy;
  if (lenSq <= 1e-6) {
    const dx = px - ax;
    const dy = py - ay;
    return dx * dx + dy * dy;
  }
  const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / lenSq));
  const cx = ax + t * vx;
  const cy = ay + t * vy;
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy;
}

function wsFindStrokeAtPoint(strokes, pt, tolerance) {
  if (!Array.isArray(strokes) || !strokes.length || !pt) return null;
  const px = Number(pt.x);
  const py = Number(pt.y);
  if (!Number.isFinite(px) || !Number.isFinite(py)) return null;
  const tol = Math.max(2, Number(tolerance) || 6);

  for (let i = strokes.length - 1; i >= 0; i--) {
    const st = strokes[i];
    if (!st || !st.id || !Array.isArray(st.points) || !st.points.length) continue;
    const hitR = tol + Math.max(2, (Number(st.size) || 4) * (st.tool === 'marker' ? 1.4 : 0.7));
    const hitSq = hitR * hitR;
    const sb = wsStrokeBounds(st);
    if (sb && (px < sb.x - hitR || px > sb.x + sb.w + hitR || py < sb.y - hitR || py > sb.y + sb.h + hitR)) {
      continue;
    }
    const pts = st.points;
    if (pts.length === 1) {
      const dx = px - (Number(pts[0].x) || 0);
      const dy = py - (Number(pts[0].y) || 0);
      if (dx * dx + dy * dy <= hitSq) return st;
      continue;
    }
    for (let j = 1; j < pts.length; j++) {
      const a = pts[j - 1];
      const b = pts[j];
      if (!a || !b) continue;
      if (wsPointToSegmentDistSq(px, py, Number(a.x) || 0, Number(a.y) || 0, Number(b.x) || 0, Number(b.y) || 0) <= hitSq) {
        return st;
      }
    }
  }
  return null;
}

function wsIsPointInStrokeSelection(strokes, selectedIds, pt, pad) {
  if (!Array.isArray(strokes) || !strokes.length || !selectedIds || !pt) return false;
  const px = Number(pt.x);
  const py = Number(pt.y);
  if (!Number.isFinite(px) || !Number.isFinite(py)) return false;
  const hasFn = typeof selectedIds.has === 'function';
  const selList = strokes.filter(s => s && s.id && (hasFn ? selectedIds.has(s.id) : Array.isArray(selectedIds) && selectedIds.includes(s.id)));
  if (!selList.length) return false;
  const bb = wsStrokesBounds(selList);
  if (!bb) return false;
  const p = Math.max(0, Number(pad) || 0);
  return px >= bb.x - p && px <= bb.x + bb.w + p && py >= bb.y - p && py <= bb.y + bb.h + p;
}

function wsApplyStrokeOffsets(strokeItems, dx, dy) {
  if (!Array.isArray(strokeItems) || !strokeItems.length) return;
  const rx = Number(dx) || 0;
  const ry = Number(dy) || 0;
  for (let k = 0; k < strokeItems.length; k++) {
    const item = strokeItems[k];
    if (!item || !item.stroke || !Array.isArray(item.stroke.points) || !Array.isArray(item.origPoints)) continue;
    const pts = item.stroke.points;
    const orig = item.origPoints;
    const len = Math.min(pts.length, orig.length);
    for (let i = 0; i < len; i++) {
      if (!pts[i] || !orig[i]) continue;
      pts[i].x = Math.round((Number(orig[i].x) + rx) * 100) / 100;
      pts[i].y = Math.round((Number(orig[i].y) + ry) * 100) / 100;
    }
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

function wsCompactMathSlotsInHtml(html) {
  const src = String(html == null ? '' : html);
  if (!src.includes('ws-math-slot')) return src;
  let out = '';
  let pos = 0;
  const openRe = /<span\b([^>]*\bws-math-slot\b[^>]*)>/gi;
  let match;
  while ((match = openRe.exec(src)) !== null) {
    if (match.index < pos) continue;
    out += src.slice(pos, match.index);
    const attrs = match[1] || '';
    const texM = /data-tex\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrs);
    const dispM = /data-display\s*=\s*(?:"([01])"|'([01])'|([01]))/i.exec(attrs);
    const rawTex = texM ? (texM[1] != null ? texM[1] : texM[2]) : '';
    const isDisplay = dispM ? ((dispM[1] || dispM[2] || dispM[3]) === '1') : false;

    let depth = 1;
    let scan = openRe.lastIndex;
    const tagRe = /<(\/?)span\b[^>]*>/gi;
    tagRe.lastIndex = scan;
    let tm;
    let endIdx = -1;
    while ((tm = tagRe.exec(src)) !== null) {
      if (tm[1] === '/') depth--;
      else depth++;
      if (depth === 0) {
        endIdx = tagRe.lastIndex;
        break;
      }
    }
    if (endIdx < 0) endIdx = openRe.lastIndex;
    const decodedTex = String(rawTex || '')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
    const escapedTex = wsEscapeHtmlText(decodedTex);
    const delim = isDisplay ? '$$' : '$';
    if (decodedTex.trim()) {
      out += '<span class="ws-math-slot" contenteditable="false" data-tex="' + escapedTex + '" data-display="' + (isDisplay ? '1' : '0') + '">' + delim + escapedTex + delim + '</span>';
    }
    pos = endIdx;
    openRe.lastIndex = endIdx;
  }
  out += src.slice(pos);
  return out;
}

function wsSanitizeNoteHtml(html) {
  let s = String(html == null ? '' : html);
  if (!s.trim()) return '';
  s = wsCompactMathSlotsInHtml(s);
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
    if (tag === 'span' && /\bws-math-slot\b/i.test(rawAttrs || '')) {
      const texM = /data-tex\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(rawAttrs || '');
      const dispM = /data-display\s*=\s*(?:"([01])"|'([01])'|([01]))/i.exec(rawAttrs || '');
      const texVal = texM ? (texM[1] != null ? texM[1] : texM[2]) : '';
      const dispVal = dispM ? (dispM[1] || dispM[2] || dispM[3] || '0') : '0';
      return '<span class="ws-math-slot" contenteditable="false" data-tex="' + texVal + '" data-display="' + dispVal + '">';
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
  let s = String(html == null ? '' : html);
  if (!s) return '';
  s = wsCompactMathSlotsInHtml(s);
  s = s
    .replace(/<\s*(script|style|iframe|object|embed|svg|math|link|meta|base)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|style|iframe|object|embed|svg|math|link|meta|base)[^>]*\/?>/gi, '');
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

function wsComputeResizeSnap(box, otherBoxes, opts) {
  opts = opts || {};
  const gridSize = Math.max(8, Number(opts.gridSize) || WS_SNAP_GRID);
  const minW = Math.max(40, Number(opts.minW) || 170);
  const minH = Math.max(40, Number(opts.minH) || 100);
  const snapDist = Number(opts.snapDist != null ? opts.snapDist : 8);
  const elemSnapDist = Number(opts.elemSnapDist != null ? opts.elemSnapDist : 12);
  const pullDist = Number(opts.pullDist != null ? opts.pullDist : 28);
  const revealDist = Number(opts.revealDist != null ? opts.revealDist : 54);
  const nearRadius = Number(opts.nearRadius != null ? opts.nearRadius : 240);
  const guideMaxGap = Number(opts.guideMaxGap != null ? opts.guideMaxGap : 180);

  const rx = Number(box && box.x) || 0;
  const ry = Number(box && box.y) || 0;
  const rawW = Math.max(minW, Number(box && box.w) || minW);
  const rawH = Math.max(minH, Number(box && box.h) || minH);
  const rawRight = rx + rawW;
  const rawBottom = ry + rawH;
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
    const gapX = Math.max(0, ox - rawRight, rx - (ox + ow));
    const gapY = Math.max(0, oy - rawBottom, ry - (oy + oh));
    const boxDist = Math.hypot(gapX, gapY);
    if (boxDist < nearestBoxDist) nearestBoxDist = boxDist;
    enrichedOthers.push({ x: ox, y: oy, w: ow, h: oh, gapX, gapY, boxDist });
  }

  let proximity = 0;
  if (nearestBoxDist < nearRadius) {
    const pt = Math.max(0, Math.min(1, 1 - nearestBoxDist / nearRadius));
    proximity = pt * pt * (3 - 2 * pt);
  }

  const evalEdge = (edgeVal, minEdge, origin, axis) => {
    const minGrid = Math.ceil(minEdge / gridSize) * gridSize;
    const gridTarget = Math.max(minGrid, Math.round(edgeVal / gridSize) * gridSize);
    const gridDist = Math.abs(edgeVal - gridTarget);
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
      const crossEnd = axis === 'x' ? Math.max(rawBottom, oy + oh) : Math.max(rawRight, ox + ow);
      const crossProx = Math.max(0, Math.min(1, 1 - crossGap / guideMaxGap));

      const cands = [
        { val: pos + len, guide: pos + len },
        { val: origin + len, guide: pos + len },
        { val: pos, guide: pos }
      ];
      for (let j = 0; j < cands.length; j++) {
        if (cands[j].val < minEdge) continue;
        const dist = Math.abs(edgeVal - cands[j].val);
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

    let out = edgeVal;
    let snapped = false;
    let strength = 0;
    if (chosenDist <= threshold) {
      out = chosenTarget;
      snapped = true;
      strength = 1;
    } else if (chosenDist <= pullDist) {
      const t = (pullDist - chosenDist) / Math.max(1, pullDist - threshold);
      const pull = 0.28 * t * t;
      out = edgeVal + (chosenTarget - edgeVal) * pull;
      strength = 0.3 + 0.65 * t;
    } else if (chosenDist <= revealDist) {
      const t = (revealDist - chosenDist) / Math.max(1, revealDist - pullDist);
      strength = 0.3 * t;
    }

    if (guide) guide.strength = strength * (0.28 + 0.72 * guide.crossProx);

    return {
      val: Math.max(minEdge, out),
      target: chosenTarget,
      snapped,
      strength,
      source,
      guide
    };
  };

  const ax = evalEdge(rawRight, rx + minW, rx, 'x');
  const ay = evalEdge(rawBottom, ry + minH, ry, 'y');
  const finalW = Math.round(Math.max(minW, ax.val - rx));
  const finalH = Math.round(Math.max(minH, ay.val - ry));
  const targetW = Math.round(Math.max(minW, ax.target - rx));
  const targetH = Math.round(Math.max(minH, ay.target - ry));
  const radialDist = Math.hypot(rawRight - ax.target, rawBottom - ay.target);
  const radialNear = Math.max(0, Math.min(1, 1 - radialDist / (revealDist * 1.15)));
  const moldStrength = Math.max(radialNear * radialNear, (ax.strength + ay.strength) * 0.5);
  const gridOpacity = 0.38 + 0.62 * proximity;
  const locked = !!((ax.snapped && ay.snapped) || (ax.snapped && ax.source === 'element') || (ay.snapped && ay.source === 'element'));

  return {
    x: rx,
    y: ry,
    w: finalW,
    h: finalH,
    targetX: rx,
    targetY: ry,
    targetW,
    targetH,
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
    WS_ARROW_CAPS,
    WS_ARROW_CAP_SHAPES,
    WS_ARROW_ROUTINGS,
    WS_ARROW_LINE_STYLES,
    WS_ARROW_WIDTHS,
    WS_BG_PATTERNS,
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
    wsNormalizeBgPattern,
    wsNormalizeArrowCap,
    wsNormalizeArrowRouting,
    wsNormalizeArrowLineStyle,
    wsNormalizeArrowWidth,
    wsDefaultDirForKind,
    wsDefaultLinkSettings,
    wsNormalizeLinkDefaults,
    wsDefaultShapeForKind,
    wsResolveEndPort,
    wsResolveArrowEndpoints,
    wsArrowDefaultCaps,
    wsResolveArrowCaps,
    wsLineDashArray,
    wsResolveArrowStyle,
    wsArrowCardPairKey,
    wsBuildArrowPairIndex,
    wsRayBoxEdge,
    wsPickNearestSides,
    wsSideMidpointAnchor,
    wsLabelAbovePos,
    wsBuildArrowGeometry,
    wsArrowCurveGeometry,
    wsNormalizeArrow,
    wsArrowKindMeta,
    wsCardTypeLabel,
    wsCardDisplayTitle,
    wsGetCardConnections,
    wsGroupChildIds,
    wsCountGroupableCards,
    wsComputeGroupBounds,
    wsSearchBoard,
    wsSearchPdfPages,
    wsRectsIntersect,
    wsStrokeBounds,
    wsStrokesBounds,
    wsFindItemsInBox,
    wsMoveStrokePoints,
    wsPointToSegmentDistSq,
    wsFindStrokeAtPoint,
    wsIsPointInStrokeSelection,
    wsApplyStrokeOffsets,
    wsNormalizeNoteFont,
    wsNoteFontFamily,
    wsNormalizeNoteSize,
    wsNormalizeNoteAlign,
    wsPlainTextToNoteHtml,
    wsSanitizeNoteHtml,
    wsNoteHtmlToPlainText,
    wsShouldWheelScrollNote,
    wsComputeSnap,
    wsComputeResizeSnap
  };
}
