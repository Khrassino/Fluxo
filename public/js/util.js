'use strict';
/* ============ util.js — auxiliares e ícones ============ */
const $  = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}

function todayKey(d) {
  d = d || new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function fmtClock(sec) {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? h + ':' + mm + ':' + ss : mm + ':' + ss;
}

function fmtHours(sec) {
  sec = Math.round(sec);
  let h = Math.floor(sec / 3600);
  let m = Math.round((sec % 3600) / 60);
  if (m === 60) { h++; m = 0; }
  if (h === 0 && m === 0) return '0min';
  const parts = [];
  if (h) parts.push(h + 'h');
  if (m) parts.push(m + 'min');
  return parts.join(' ');
}

function debounce(fn, ms) {
  let t;
  return function () {
    const args = arguments;
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), ms);
  };
}

/* ---- ícones (SVG inline, stroke currentColor) ---- */
const ICON_PATHS = {
  home:     '<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
  timer:    '<path d="M10 2h4"/><path d="M12 2.5V5"/><circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2.5"/>',
  chart:    '<path d="M4 20h16"/><path d="M7 20v-6"/><path d="M12 20V8"/><path d="M17 20v-10"/>',
  tasks:    '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="m8.5 12.5 2.5 2.5 4.5-5.5"/>',
  sliders:  '<path d="M4 8h9"/><path d="M17 8h3"/><path d="M4 16h3"/><path d="M11 16h9"/><circle cx="15" cy="8" r="2.6"/><circle cx="7" cy="16" r="2.6"/>',
  music:    '<path d="M9 17.5V5l11-2v12.5"/><circle cx="6.5" cy="17.5" r="2.6"/><circle cx="17.5" cy="15.5" r="2.6"/>',
  play:     '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/>',
  pause:    '<rect x="6.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none"/>',
  plus:     '<path d="M12 5v14M5 12h14"/>',
  trash:    '<path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13.5h9l1-13.5"/><path d="M10 11v6M14 11v6"/>',
  close:    '<path d="M6 6l12 12M18 6L6 18"/>',
  upload:   '<path d="M12 15V4"/><path d="m7 9 5-5 5 5"/><path d="M4 15v5h16v-5"/>',
  check:    '<path d="m5 12.5 5 5L19 7"/>',
  skip:     '<path d="M6 5.5v13l9-6.5z" fill="currentColor" stroke="none"/><path d="M18 5.5v13"/>',
  reset:    '<path d="M3 12a9 9 0 1 0 9-9 9.7 9.7 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  flame:    '<path d="M12 3s-6 5.3-6 10a6 6 0 0 0 12 0c0-4.7-6-10-6-10z"/><path d="M12 21a2.5 2.5 0 0 1-2.5-2.5c0-1.8 2.5-4 2.5-4s2.5 2.2 2.5 4A2.5 2.5 0 0 1 12 21z"/>',
  clock:    '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  calendar: '<rect x="4" y="6" width="16" height="15" rx="3"/><path d="M8 3v5M16 3v5M4 10.5h16"/>',
  checkc:   '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>',
  target:   '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
  sparkle:  '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  image:    '<rect x="4" y="5" width="16" height="14" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="m5 17 4.5-4.5L14 17l2.5-2.5L20 18"/>',
  palette:  '<path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 0-4H12a1.5 1.5 0 0 1 0-3h4.5A4.5 4.5 0 0 0 21 13.5 9.3 9.3 0 0 0 12 3z"/><circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none"/><circle cx="16.5" cy="10" r="1" fill="currentColor" stroke="none"/>',
  motion:   '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  grid:     '<rect x="4" y="4" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2"/>',
  pencil:   '<path d="M4 20h4.5L20 8.5 15.5 4 4 15.5z"/><path d="m13.5 6 4.5 4.5"/>',
  download: '<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M4 19.5h16"/>',
  moon:     '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>',
  grip:     '<circle cx="9" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.3" fill="currentColor" stroke="none"/>',
  lock:     '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  eye:      '<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="2.6"/>',
  eyeoff:   '<path d="M4 4l16 16"/><path d="M9.9 5.2A9.8 9.8 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-3 3.6"/><path d="M6.2 6.7A17.6 17.6 0 0 0 2.5 12S6 19 12 19a9.7 9.7 0 0 0 4.1-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  chevL:    '<path d="m14.5 5-7 7 7 7"/>',
  chevR:    '<path d="m9.5 5 7 7-7 7"/>',
  chevU:    '<path d="m5 14.5 7-7 7 7"/>',
  chevD:    '<path d="m5 9.5 7 7 7-7"/>',
  leaf:     '<path d="M20 4C12 4 5 8 5 15a5 5 0 0 0 5 5c7 0 10-7 10-16z"/><path d="M5.5 19.5C7.5 13.5 11.5 10 16.5 8"/>',
  sun:      '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6"/>',
  snow:     '<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5 4.2 16.5"/><path d="m9.4 4.4 2.6 2 2.6-2M9.4 19.6l2.6-2 2.6 2"/>',
  bolt:     '<path d="M13 2 5 13h6l-1 9 8-11h-6z"/>',
  disc:     '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.4"/><path d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5"/>',
  board:    '<rect x="3.5" y="4" width="8.5" height="7" rx="2"/><rect x="12" y="13" width="8.5" height="7" rx="2"/><path d="M12 7.5h2.5a2 2 0 0 1 2 2V13"/><path d="M7.5 11v3.5a2 2 0 0 0 2 2H12"/>',
  file:     '<path d="M6 3.5h7l4 4V20H6z"/><path d="M13 3.5V8h4"/><path d="M9 12h6M9 15.5h6"/>',
  folder:   '<path d="M3.5 6.5h5.8l2 2H20.5v9.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
  cursor:   '<path d="m6 3.5 12.5 8.2-5.7 1.2-2.6 5.6z"/>',
  hand:     '<path d="M18 11V6a1.5 1.5 0 0 0-3 0"/><path d="M15 10V4.5a1.5 1.5 0 0 0-3 0V10"/><path d="M12 10V5.5a1.5 1.5 0 0 0-3 0V12"/><path d="M9 12V9.5a1.5 1.5 0 0 0-3 0V15a6 6 0 0 0 6 6h1a5 5 0 0 0 5-5v-5a1.5 1.5 0 0 0-3 0"/>',
  rotate:   '<path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 4v5h-5"/>',
  highlight:'<path d="m6 14 8.5-8.5 4 4L10 18H6z"/><path d="M5 21h14"/>',
  pen:      '<path d="M4 20h4l11.5-11.5a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="m14.5 6.5 3 3"/>',
  eraser:   '<path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/>',
  undo:     '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo:     '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  fit:      '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  arrow:    '<path d="M5 19 19 5"/><path d="m11 5h8v8"/>',
  search:   '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  hash:     '<path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16"/>',
  checklist:'<path d="M4 7.5 6 9.5 9.5 6"/><path d="M12 8h8"/><path d="M4 16.5 6 18.5 9.5 15"/><path d="M12 17h8"/>',
  layers:   '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M4 9.5h16"/>',
  link:     '<path d="M10 13.5a4.5 4.5 0 0 0 6.4.4l2.1-2.1a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2"/><path d="M14 10.5a4.5 4.5 0 0 0-6.4-.4L5.5 12.2a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/>',
  swap:     '<path d="M7 7h12l-3-3M17 17H5l3 3"/>',
  flag:     '<path d="M5 21V4"/><path d="M5 4h11l-1.5 4.5L16 13H5"/>',
  tag:      '<path d="M4 12V4h8l8 8-8 8z"/><circle cx="8.5" cy="8.5" r="1" fill="currentColor" stroke="none"/>',
  alert:    '<circle cx="12" cy="12" r="9"/><path d="M12 8v4.8"/><circle cx="12" cy="16.5" r=".8" fill="currentColor" stroke="none"/>',
  sublist:  '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none"/>',
  logo:     '<circle cx="12" cy="12" r="7.6"/><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/>'
};

function svgIcon(name) {
  return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON_PATHS[name] || '') + '</svg>';
}

/* ---- deformação elástica (bolinha externa + núcleo interno) ---- */
function calcElasticTarget(vx, vy, dt) {
  const stepMs = Math.max(8, dt || 16);
  const norm = 16 / stepMs;
  const speed = Math.hypot(vx, vy) * norm;
  const power = Math.min(1, speed / 18);
  const eased = Math.pow(power, 0.78);
  const sx = 1 + eased * 0.42;
  const sy = 1 - eased * 0.25;
  /* o núcleo claro interno resiste ao achatamento e escorrega com inércia oposta */
  const innerSx = 1 - eased * 0.13;
  const innerSy = 1 + eased * 0.22;
  const lagMag = -eased * 7.5;
  const angle = speed > 0.2 ? Math.atan2(vy, vx) * 180 / Math.PI : 0;
  return { sx, sy, innerSx, innerSy, lagX: lagMag, lagY: 0, angle, power: eased };
}

function createElasticSpring(applyFn) {
  let sx = 1, sy = 1, vsx = 0, vsy = 0;
  let isx = 1, isy = 1, visx = 0, visy = 0;
  let ix = 0, iy = 0, vix = 0, viy = 0;
  let angle = 0;
  let tsx = 1, tsy = 1, tisx = 1, tisy = 1, tix = 0, tiy = 0;
  let raf = null;
  let onSettled = null;

  const tick = () => {
    raf = null;
    const k = 0.23, d = 0.68;
    const ik = 0.18, id = 0.64;

    vsx = (vsx + (tsx - sx) * k) * d; sx += vsx;
    vsy = (vsy + (tsy - sy) * k) * d; sy += vsy;
    visx = (visx + (tisx - isx) * ik) * id; isx += visx;
    visy = (visy + (tisy - isy) * ik) * id; isy += visy;
    vix = (vix + (tix - ix) * ik) * id; ix += vix;
    viy = (viy + (tiy - iy) * ik) * id; iy += viy;

    if (typeof applyFn === 'function') {
      applyFn({ sx, sy, isx, isy, ix, iy, angle });
    }

    const done =
      Math.abs(tsx - sx) < 0.002 && Math.abs(vsx) < 0.002 &&
      Math.abs(tsy - sy) < 0.002 && Math.abs(vsy) < 0.002 &&
      Math.abs(tisx - isx) < 0.002 && Math.abs(visx) < 0.002 &&
      Math.abs(tisy - isy) < 0.002 && Math.abs(visy) < 0.002 &&
      Math.abs(tix - ix) < 0.05 && Math.abs(vix) < 0.05 &&
      Math.abs(tiy - iy) < 0.05 && Math.abs(viy) < 0.05;

    if (!done) {
      raf = requestAnimationFrame(tick);
    } else {
      sx = tsx; sy = tsy; isx = tisx; isy = tisy; ix = tix; iy = tiy;
      vsx = vsy = visx = visy = vix = viy = 0;
      if (typeof applyFn === 'function') applyFn({ sx, sy, isx, isy, ix, iy, angle });
      if (onSettled) {
        const cb = onSettled;
        onSettled = null;
        cb();
      }
    }
  };

  const wake = () => {
    if (!raf && typeof requestAnimationFrame === 'function') raf = requestAnimationFrame(tick);
  };

  return {
    impulse(vx, vy, dt) {
      const t = calcElasticTarget(vx, vy, dt);
      if (t.power > 0.02) angle = t.angle;
      tsx = t.sx;
      tsy = t.sy;
      tisx = t.innerSx;
      tisy = t.innerSy;
      tix = t.lagX;
      tiy = t.lagY;
      onSettled = null;
      wake();
    },
    release(cb) {
      tsx = 1; tsy = 1;
      tisx = 1; tisy = 1;
      tix = 0; tiy = 0;
      onSettled = cb || null;
      wake();
    },
    snap() {
      if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
      raf = null;
      sx = sy = isx = isy = 1;
      vsx = vsy = visx = visy = vix = viy = ix = iy = 0;
      tsx = tsy = tisx = tisy = 1;
      tix = tiy = 0;
      angle = 0;
      onSettled = null;
      if (typeof applyFn === 'function') applyFn({ sx, sy, isx, isy, ix, iy, angle });
    }
  };
}

/* ---- toast ---- */
function toast(msg, icon) {
  const t = el('div', 'toast', svgIcon(icon || 'sparkle') + '<span></span>');
  t.lastChild.textContent = msg;
  $('#toasts').append(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 350);
  }, 2800);
}
