'use strict';
/* ============ ink.js — motor de escrita livre, pontas, precisão e ponteiros ============ */

const INK_COLORS = [
  { id: 'snow',   label: 'Neve',     value: '#edf1ff' },
  { id: 'slate',  label: 'Grafite',  value: '#0f172a' },
  { id: 'blue',   label: 'Azul',     value: '#8fa2ff' },
  { id: 'mint',   label: 'Menta',    value: '#5fe3c4' },
  { id: 'amber',  label: 'Âmbar',    value: '#ffd166' },
  { id: 'coral',  label: 'Coral',    value: '#ff6b81' },
  { id: 'lilac',  label: 'Lilás',    value: '#c792ea' },
  { id: 'orange', label: 'Laranja',  value: '#fb923c' }
];

const INK_SIZES = [
  { id: 'fine', label: 'Fina',   size: 2.4 },
  { id: 'med',  label: 'Média',  size: 4.5 },
  { id: 'bold', label: 'Grossa', size: 8.5 }
];

const INK_TOOLS = ['pen', 'marker', 'eraser'];

const INK_NIBS = [
  { id: 'round',    label: 'Redonda',   desc: 'Traço fluido e macio' },
  { id: 'fountain', label: 'Tinteiro',  desc: 'Caligrafia angular expressiva' },
  { id: 'chisel',   label: 'Chanfrada', desc: 'Ponta reta inclinada' },
  { id: 'fine',     label: 'Técnica',   desc: 'Linha firme de precisão' }
];

const INK_BAR_POSITIONS = [
  { id: 'top',    label: 'Topo' },
  { id: 'bottom', label: 'Base' },
  { id: 'left',   label: 'Esquerda' },
  { id: 'right',  label: 'Direita' },
  { id: 'free',   label: 'Livre' }
];

function inkColorHex(v, fallback) {
  return /^#[0-9a-f]{3,8}$/i.test(String(v || '')) ? String(v) : (fallback || '#edf1ff');
}

function inkRound(n, digits) {
  const f = Math.pow(10, digits || 2);
  return Math.round(n * f) / f;
}

function inkClamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}

function inkNum(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function defaultInkConfig() {
  return {
    tool: 'pen',
    color: '#edf1ff',
    size: 4.5,
    nib: 'round',
    smoothing: 35,
    pressureVar: 65,
    cursorShape: 'auto',
    orientation: 'horizontal',
    position: 'top',
    freeX: null,
    freeY: null,
    collapsed: false
  };
}

function normalizeInkConfig(raw) {
  const def = defaultInkConfig();
  if (!raw || typeof raw !== 'object') return def;
  const tool = INK_TOOLS.includes(raw.tool) ? raw.tool : def.tool;
  const color = inkColorHex(raw.color, def.color);
  const size = inkClamp(inkRound(inkNum(raw.size, def.size), 2), 1, 28);
  const nib = INK_NIBS.some(n => n.id === raw.nib) ? raw.nib : def.nib;
  const smoothing = inkClamp(Math.round(inkNum(raw.smoothing, def.smoothing)), 0, 100);
  const pressureVar = inkClamp(Math.round(inkNum(raw.pressureVar, def.pressureVar)), 0, 100);
  const cursorShape = ['auto', 'dot', 'cross'].includes(raw.cursorShape) ? raw.cursorShape : def.cursorShape;
  const orientation = raw.orientation === 'vertical' ? 'vertical' : 'horizontal';
  const position = INK_BAR_POSITIONS.some(p => p.id === raw.position) ? raw.position : def.position;
  const freeX = raw.freeX == null || !Number.isFinite(Number(raw.freeX)) ? null : Math.round(Number(raw.freeX));
  const freeY = raw.freeY == null || !Number.isFinite(Number(raw.freeY)) ? null : Math.round(Number(raw.freeY));
  const collapsed = !!raw.collapsed;
  return { tool, color, size, nib, smoothing, pressureVar, cursorShape, orientation, position, freeX, freeY, collapsed };
}

/* pressão real para mesa digitalizadora/stylus e modulação por velocidade no mouse/touch, escaladas por pressureVar (0..100) */
function inkEffectivePressure(rawPressure, pointerType, speed, pressureVar) {
  const pv = inkClamp(inkNum(pressureVar, 65), 0, 100) / 100;
  if (pv <= 0.001) return 1;

  if (pointerType === 'pen') {
    const p = (typeof rawPressure === 'number' && Number.isFinite(rawPressure) && rawPressure > 0)
      ? rawPressure
      : 0.5;
    const curved = 0.20 + Math.pow(inkClamp(p, 0.02, 1), 0.78) * (1.05 + pv * 0.55);
    const blended = 1 + (curved - 1) * pv;
    return inkRound(inkClamp(blended, 0.2, 1.8), 3);
  }

  const sp = Math.max(0, Number(speed) || 0);
  const rawVel = 1.08 - Math.min(0.42, sp * 0.14);
  const blended = 1 + (rawVel - 1) * pv;
  return inkRound(inkClamp(blended, 0.52, 1.15), 3);
}

/* suavização ponderada por nível de precisão (0 = fiel ponto a ponto; 100 = suavização caligráfica) */
function inkSmoothPoints(points, smoothing) {
  if (!Array.isArray(points) || points.length < 3) return Array.isArray(points) ? points.slice() : [];
  const s = inkClamp(inkNum(smoothing, 35), 0, 100) / 100;
  if (s <= 0.04) return points.map(pt => ({ x: pt.x, y: pt.y, p: pt.p }));

  let cur = points.map(pt => ({ x: pt.x, y: pt.y, p: pt.p }));
  const passes = s > 0.65 ? 2 : 1;
  const w = Math.min(0.95, s * 0.92);

  for (let pass = 0; pass < passes; pass++) {
    const next = [cur[0]];
    for (let i = 1; i < cur.length - 1; i++) {
      const a = cur[i - 1], b = cur[i], c = cur[i + 1];
      const keep = 1 - w * 0.5;
      const side = w * 0.25;
      next.push({
        x: inkRound(a.x * side + b.x * keep + c.x * side, 2),
        y: inkRound(a.y * side + b.y * keep + c.y * side, 2),
        p: inkRound((a.p * side + b.p * keep + c.p * side), 3)
      });
    }
    next.push(cur[cur.length - 1]);
    cur = next;
  }
  return cur;
}

function normalizeInkStroke(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const tool = raw.tool === 'marker' ? 'marker' : 'pen';
  const nib = INK_NIBS.some(n => n.id === raw.nib) ? raw.nib : 'round';
  const color = inkColorHex(raw.color, '#edf1ff');
  const size = inkClamp(inkNum(raw.size, 4.5), 1, 28);
  const pts = Array.isArray(raw.points)
    ? raw.points
      .filter(pt => pt && Number.isFinite(Number(pt.x)) && Number.isFinite(Number(pt.y)))
      .map(pt => ({
        x: inkRound(Number(pt.x), 2),
        y: inkRound(Number(pt.y), 2),
        p: inkRound(inkClamp(inkNum(pt.p, 0.75), 0.15, 1.85), 3)
      }))
    : [];
  if (!pts.length) return null;
  return {
    id: String(raw.id || ('ink_' + Math.random().toString(36).slice(2, 9))),
    tool,
    nib,
    color,
    size,
    points: pts
  };
}

function normalizeInkStrokes(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const s = normalizeInkStroke(list[i]);
    if (s) out.push(s);
  }
  return out;
}

function inkStrokeBounds(strokes) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  (strokes || []).forEach(s => {
    const pad = (s.size || 4) * (s.tool === 'marker' ? 2 : 1.3);
    (s.points || []).forEach(pt => {
      if (pt.x - pad < minX) minX = pt.x - pad;
      if (pt.y - pad < minY) minY = pt.y - pad;
      if (pt.x + pad > maxX) maxX = pt.x + pad;
      if (pt.y + pad > maxY) maxY = pt.y + pad;
    });
  });
  if (!Number.isFinite(minX)) return null;
  return { minX, minY, maxX, maxY };
}

/* distância mínima ao quadrado entre o ponto (px, py) e o segmento (ax, ay)-(bx, by) */
function inkDistSqToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq <= 0.0001) {
    const ex = px - ax, ey = py - ay;
    return ex * ex + ey * ey;
  }
  const t = inkClamp(((px - ax) * dx + (py - ay) * dy) / lenSq, 0, 1);
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  const ex = px - cx, ey = py - cy;
  return ex * ex + ey * ey;
}

/* borracha precisa: remove apenas o trecho atingido e divide o traço em subtraços contínuos */
function eraseInkAtSegment(strokes, ax, ay, bx, by, radius) {
  if (!Array.isArray(strokes) || !strokes.length) return { nextStrokes: strokes || [], changed: false };
  const r = Math.max(4, Number(radius) || 14);
  let changed = false;
  const nextStrokes = [];

  for (let i = 0; i < strokes.length; i++) {
    const st = strokes[i];
    const pts = st.points || [];
    if (!pts.length) continue;

    const hitR = r + (st.size || 4) * (st.tool === 'marker' ? 1.1 : 0.5);
    const hitRSq = hitR * hitR;

    let run = [];
    let anyRemoved = false;
    let prevHit = false;

    for (let j = 0; j < pts.length; j++) {
      const pt = pts[j];
      const hitPoint = inkDistSqToSegment(pt.x, pt.y, ax, ay, bx, by) <= hitRSq;

      let hitSpan = false;
      if (!hitPoint && !prevHit && j > 0) {
        const prev = pts[j - 1];
        const mx = (prev.x + pt.x) * 0.5;
        const my = (prev.y + pt.y) * 0.5;
        hitSpan =
          inkDistSqToSegment(mx, my, ax, ay, bx, by) <= hitRSq ||
          inkDistSqToSegment(ax, ay, prev.x, prev.y, pt.x, pt.y) <= hitRSq ||
          inkDistSqToSegment(bx, by, prev.x, prev.y, pt.x, pt.y) <= hitRSq;
      }

      if (hitPoint || hitSpan) {
        anyRemoved = true;
        if (run.length >= 2 || (run.length === 1 && pts.length === 1)) {
          nextStrokes.push({
            id: run.length === pts.length ? st.id : ('ink_' + Math.random().toString(36).slice(2, 9)),
            tool: st.tool,
            nib: st.nib || 'round',
            color: st.color,
            size: st.size,
            points: run
          });
        }
        run = hitPoint ? [] : [pt];
      } else {
        run.push(pt);
      }
      prevHit = hitPoint;
    }

    if (anyRemoved) {
      changed = true;
      if (run.length >= 2) {
        nextStrokes.push({
          id: 'ink_' + Math.random().toString(36).slice(2, 9),
          tool: st.tool,
          nib: st.nib || 'round',
          color: st.color,
          size: st.size,
          points: run
        });
      }
    } else {
      nextStrokes.push(st);
    }
  }

  return { nextStrokes, changed };
}

/* renderização suave por ponto médio quadrático, ponta e pressão */
function renderInkStroke(ctx, stroke) {
  if (!ctx || !stroke || !stroke.points || !stroke.points.length) return;
  const pts = stroke.points;
  const isMarker = stroke.tool === 'marker';
  const nib = stroke.nib || 'round';
  const baseW = stroke.size * (isMarker ? 3.2 : 1);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = stroke.color || '#edf1ff';
  ctx.fillStyle = stroke.color || '#edf1ff';
  ctx.globalAlpha = isMarker ? 0.36 : 0.96;

  if (pts.length === 1) {
    const p0 = pts[0];
    const r = Math.max(0.65, (baseW * (p0.p || 0.85)) * 0.5);
    ctx.beginPath();
    if (!isMarker && nib === 'chisel') {
      ctx.translate(p0.x, p0.y);
      ctx.rotate(-0.66);
      ctx.fillRect(-r * 1.35, -r * 0.36, r * 2.7, r * 0.72);
    } else {
      ctx.arc(p0.x, p0.y, nib === 'fine' ? r * 0.8 : r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  if (isMarker) {
    ctx.beginPath();
    ctx.lineWidth = baseW;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) * 0.5;
      const my = (pts[i].y + pts[i + 1].y) * 0.5;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    ctx.restore();
    return;
  }

  /* ponta chanfrada: fita inclinada contínua em -38° sem frestas entre segmentos */
  if (nib === 'chisel') {
    ctx.globalAlpha = 1;
    ctx.lineWidth = 0.75;
    const tilt = -0.663;
    const dx = Math.cos(tilt);
    const dy = Math.sin(tilt);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const half0 = Math.max(1.2, baseW * 0.72 * (a.p || 0.85));
      const half1 = Math.max(1.2, baseW * 0.72 * (b.p || 0.85));
      ctx.beginPath();
      ctx.moveTo(a.x - dx * half0, a.y - dy * half0);
      ctx.lineTo(a.x + dx * half0, a.y + dy * half0);
      ctx.lineTo(b.x + dx * half1, b.y + dy * half1);
      ctx.lineTo(b.x - dx * half1, b.y - dy * half1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  let prevMidX = pts[0].x;
  let prevMidY = pts[0].y;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const midX = i === pts.length - 1 ? p1.x : (p0.x + p1.x) * 0.5;
    const midY = i === pts.length - 1 ? p1.y : (p0.y + p1.y) * 0.5;
    const pressure = ((p0.p || 0.85) + (p1.p || 0.85)) * 0.5;

    let width = baseW * pressure;
    if (nib === 'fine') {
      width = baseW * (0.68 + (pressure - 0.8) * 0.35);
    } else if (nib === 'fountain') {
      const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
      const directional = 0.44 + 0.74 * Math.abs(Math.sin(ang + 0.62));
      width = baseW * pressure * directional;
    }

    ctx.lineWidth = Math.max(0.65, width);
    ctx.beginPath();
    ctx.moveTo(prevMidX, prevMidY);
    ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
    ctx.stroke();
    prevMidX = midX;
    prevMidY = midY;
  }

  ctx.restore();
}

/* ponteiros personalizados (dots e cruzes pequenas estéticos para caneta, ponta, marcador e borracha) */
function wsInkCursorSvg(tool, color, size, shape, nib) {
  const c = inkColorHex(color, '#edf1ff');
  const mode = (shape === 'dot' || shape === 'cross')
    ? shape
    : (tool === 'eraser' ? 'cross' : (tool === 'marker' ? 'cross' : 'dot'));
  const activeNib = nib || 'round';

  if (tool === 'eraser') {
    const r = inkClamp(Math.round(5 + (Number(size) || 4.5) * 0.45), 6, 10);
    return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
      '<circle cx="12" cy="12" r="' + r + '" fill="rgba(255,255,255,0.12)" stroke="rgba(10,14,30,0.9)" stroke-width="2.2"/>' +
      '<circle cx="12" cy="12" r="' + r + '" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-dasharray="2.4 2"/>' +
      '<path d="M12 8.2v7.6M8.2 12h7.6" stroke="rgba(10,14,30,0.9)" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M12 8.2v7.6M8.2 12h7.6" stroke="#ffffff" stroke-width="1.25" stroke-linecap="round"/>' +
      '</svg>';
  }

  if (mode === 'cross') {
    const dotR = tool === 'marker'
      ? 2.4
      : (activeNib === 'fine' ? 1.5 : inkClamp(1.6 + (Number(size) || 4.5) * 0.14, 1.8, 3.4));
    const arm = tool === 'marker' ? 5.2 : 4.6;
    const x1 = 12 - arm;
    let centerMark = '<circle cx="12" cy="12" r="' + dotR.toFixed(1) + '" fill="' + c + '" stroke="rgba(10,14,30,0.88)" stroke-width="1.1"/>';
    if (tool === 'pen' && activeNib === 'chisel') {
      centerMark = '<path d="M9.6 14.4 14.4 9.6" stroke="rgba(10,14,30,0.92)" stroke-width="3.6" stroke-linecap="round"/>' +
        '<path d="M9.6 14.4 14.4 9.6" stroke="' + c + '" stroke-width="2" stroke-linecap="round"/>';
    } else if (tool === 'pen' && activeNib === 'fountain') {
      centerMark = '<polygon points="12,8.8 15.2,12 12,15.2 8.8,12" fill="' + c + '" stroke="rgba(10,14,30,0.9)" stroke-width="1.1"/>';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
      '<path d="M12 ' + x1.toFixed(1) + 'v' + (arm * 2).toFixed(1) + 'M' + x1.toFixed(1) + ' 12h' + (arm * 2).toFixed(1) + '" stroke="rgba(10,14,30,0.9)" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M12 ' + x1.toFixed(1) + 'v' + (arm * 2).toFixed(1) + 'M' + x1.toFixed(1) + ' 12h' + (arm * 2).toFixed(1) + '" stroke="#ffffff" stroke-width="1.25" stroke-linecap="round"/>' +
      centerMark +
      '</svg>';
  }

  /* dot estético para caneta: anel duplo de alto contraste + núcleo moldado pelo tipo de ponta */
  const innerR = activeNib === 'fine'
    ? inkClamp(1.4 + (Number(size) || 4.5) * 0.1, 1.5, 2.6)
    : inkClamp(2.0 + (Number(size) || 4.5) * 0.22, 2.2, 4.8);
  const ringR = inkClamp(innerR + 3.4, 5.4, 9.6);
  let nibCore = '<circle cx="12" cy="12" r="' + innerR.toFixed(1) + '" fill="' + c + '" stroke="rgba(10,14,30,0.88)" stroke-width="1.1"/>';
  if (tool === 'pen' && activeNib === 'chisel') {
    nibCore = '<path d="M9.3 14.7 14.7 9.3" stroke="rgba(10,14,30,0.92)" stroke-width="3.8" stroke-linecap="round"/>' +
      '<path d="M9.3 14.7 14.7 9.3" stroke="' + c + '" stroke-width="2.2" stroke-linecap="round"/>';
  } else if (tool === 'pen' && activeNib === 'fountain') {
    const dr = Math.max(2.6, innerR + 0.5);
    nibCore = '<polygon points="12,' + (12 - dr).toFixed(1) + ' ' + (12 + dr).toFixed(1) + ',12 12,' + (12 + dr).toFixed(1) + ' ' + (12 - dr).toFixed(1) + ',12" fill="' + c + '" stroke="rgba(10,14,30,0.9)" stroke-width="1.1"/>';
  }

  return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
    '<circle cx="12" cy="12" r="' + ringR.toFixed(1) + '" fill="none" stroke="rgba(10,14,30,0.78)" stroke-width="2.2"/>' +
    '<circle cx="12" cy="12" r="' + ringR.toFixed(1) + '" fill="none" stroke="rgba(255,255,255,0.92)" stroke-width="1.15"/>' +
    nibCore +
    '</svg>';
}

function wsInkCursorCss(tool, color, size, shape, nib) {
  return 'url("data:image/svg+xml,' + encodeURIComponent(wsInkCursorSvg(tool, color, size, shape, nib)) + '") 12 12, crosshair';
}

/* cálculo puro de posicionamento da barra de escrita sem colisões nas predefinições */
function calcInkBarPlacement(opts) {
  const pad = 14;
  const sw = Math.max(320, Number(opts.shellW) || 1280);
  const sh = Math.max(320, Number(opts.shellH) || 720);
  const bw = Math.min(sw - pad * 2, Math.max(44, Number(opts.barW) || 400));
  const bh = Math.min(sh - pad * 2, Math.max(40, Number(opts.barH) || 46));
  const topClear = Math.max(66, Math.ceil(Math.max(Number(opts.brandBottom) || 56, Number(opts.actionsBottom) || 56) + 10));
  const dockAnchor = String(opts.dockAnchor || 'bc');
  const bottomClear = dockAnchor.startsWith('b')
    ? Math.max(82, Math.ceil((sh - (Number(opts.dockTop) || (sh - 72))) + 14))
    : 22;

  const pos = opts.position || 'top';
  let left = (sw - bw) * 0.5;
  let top = topClear;

  if (pos === 'bottom') {
    left = (sw - bw) * 0.5;
    top = sh - bh - bottomClear;
  } else if (pos === 'left') {
    left = pad;
    top = Math.max(topClear, (sh - bh) * 0.5);
  } else if (pos === 'right') {
    left = sw - bw - pad;
    const zoomSafeBottom = sh - 235;
    const centered = Math.max(topClear, (sh - bh) * 0.5);
    top = Math.max(topClear, Math.min(centered, zoomSafeBottom - bh));
  } else if (pos === 'free' && opts.freeX != null && opts.freeY != null) {
    left = Number(opts.freeX);
    top = Number(opts.freeY);
  }

  return {
    left: Math.round(inkClamp(left, pad, Math.max(pad, sw - bw - pad))),
    top: Math.round(inkClamp(top, pad, Math.max(pad, sh - bh - pad)))
  };
}
