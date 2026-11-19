'use strict';
/* ============ motion.js — movimento do fundo + partículas ============ */
const MOTION_MODES = [
  { id: 'shift', label: 'Deslizar' },
  { id: 'depth', label: 'Profundidade' },
  { id: 'tilt',  label: 'Inclinação' },
  { id: 'sway',  label: 'Balanço' },
  { id: 'drift', label: 'Deriva' }
];

const PARTICLE_STYLES = [
  { id: 'dust',  label: 'Poeira' },
  { id: 'rain',  label: 'Chuva' },
  { id: 'waves', label: 'Onda' },
  { id: 'wet',   label: 'Tela molhada' },
  { id: 'snow',  label: 'Neve' },
  { id: 'keys',  label: 'Teclas' }
];

function getMotionModeLabel(id) {
  const item = MOTION_MODES.find(x => x.id === id);
  const fb = item ? item.label : id;
  return typeof t === 'function' ? t('motion.' + id, null, fb) : fb;
}

function getParticleStyleLabel(id) {
  const item = PARTICLE_STYLES.find(x => x.id === id);
  const fb = item ? item.label : id;
  return typeof t === 'function' ? t('particle.' + id, null, fb) : fb;
}

const AMBIENT_KEY_POOL = ['⌘', 'A', 'S', 'D', 'F', 'K', '↵', '⇧', 'E', 'R', '⌥', '·'];

function formatKeycapLabel(key) {
  if (key == null) return '·';
  const k = String(key);
  if (k === ' ') return 'SPACE';
  if (k === 'Enter') return '↵';
  if (k === 'Backspace') return '⌫';
  if (k === 'Tab') return '⇥';
  if (k === 'Shift') return '⇧';
  if (k === 'Control') return 'CTRL';
  if (k === 'Alt') return 'ALT';
  if (k === 'Meta') return '⌘';
  if (k === 'Escape') return 'ESC';
  if (k === 'CapsLock') return 'CAPS';
  if (k === 'Delete') return 'DEL';
  if (k === 'ArrowUp') return '↑';
  if (k === 'ArrowDown') return '↓';
  if (k === 'ArrowLeft') return '←';
  if (k === 'ArrowRight') return '→';
  if (k.length === 1) return k.toUpperCase();
  if (k.length <= 4) return k.toUpperCase();
  return k.slice(0, 3).toUpperCase();
}

function keyRoundedRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function smoothClosedPathFromPoints(pts) {
  const n = pts.length;
  if (n < 3) return '';
  const mid = (a, b) => [(a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5];
  const m0 = mid(pts[n - 1], pts[0]);
  let d = 'M' + m0[0].toFixed(1) + ' ' + m0[1].toFixed(1);
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const next = pts[(i + 1) % n];
    const m = mid(p, next);
    d += ' Q' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ' ' + m[0].toFixed(1) + ' ' + m[1].toFixed(1);
  }
  return d + ' Z';
}

function smoothOpenPathFromPoints(pts) {
  const n = pts.length;
  if (n < 2) return '';
  if (n === 2) {
    return 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1) + ' L' + pts[1][0].toFixed(1) + ' ' + pts[1][1].toFixed(1);
  }
  let d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
  for (let i = 1; i < n - 1; i++) {
    const mx = ((pts[i][0] + pts[i + 1][0]) * 0.5).toFixed(1);
    const my = ((pts[i][1] + pts[i + 1][1]) * 0.5).toFixed(1);
    d += ' Q' + pts[i][0].toFixed(1) + ' ' + pts[i][1].toFixed(1) + ' ' + mx + ' ' + my;
  }
  const last = pts[n - 1];
  return d + ' L' + last[0].toFixed(1) + ' ' + last[1].toFixed(1);
}

function buildMarchWireGroup(cfg) {
  const loops = cfg.loops || [];
  const strands = cfg.strands || [];
  const wireMain = cfg.wireMain || '#9eb0be';
  const wireSub = cfg.wireSub || '#7c8e9d';
  const wireWarm = cfg.wireWarm || 'var(--accent)';
  const strokeW = cfg.strokeWidth || 1.25;
  const barbLen = cfg.barbLen || 5.4;

  const mainPaths = [];
  const subPaths = [];
  const warmPaths = [];
  const barbSegs = [];

  const pushBarb = (p, t, n, len) => {
    const L = len || barbLen;
    // Duas pontas diagonais cruzadas típicas do arame farpado desenhado à mão
    const a1x = (p[0] - t[0] * 2.2 - n[0] * L).toFixed(1);
    const a1y = (p[1] - t[1] * 2.2 - n[1] * L).toFixed(1);
    const a2x = (p[0] + t[0] * 2.4 + n[0] * L).toFixed(1);
    const a2y = (p[1] + t[1] * 2.4 + n[1] * L).toFixed(1);

    const b1x = (p[0] + t[0] * 1.4 - n[0] * (L * 0.88)).toFixed(1);
    const b1y = (p[1] + t[1] * 1.4 - n[1] * (L * 0.88)).toFixed(1);
    const b2x = (p[0] - t[0] * 1.6 + n[0] * (L * 0.92)).toFixed(1);
    const b2y = (p[1] - t[1] * 1.6 + n[1] * (L * 0.92)).toFixed(1);

    barbSegs.push('M' + a1x + ' ' + a1y + ' L' + a2x + ' ' + a2y + ' M' + b1x + ' ' + b1y + ' L' + b2x + ' ' + b2y);
  };

  loops.forEach((lp, idx) => {
    const N = lp.steps || 40;
    const rot = ((lp.rotDeg || 0) * Math.PI) / 180;
    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);
    const seed = lp.seed || (idx + 1) * 1.73;
    const turns = lp.turns || 7;
    const wobble = lp.wobble == null ? 0.085 : lp.wobble;
    const base = [];

    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const w = 1 +
        wobble * Math.sin(a * 2 + seed) +
        (wobble * 0.62) * Math.cos(a * 3 - seed * 1.4) +
        (wobble * 0.34) * Math.sin(a * 5 + seed * 0.7);
      const lx = lp.rx * w * Math.cos(a);
      const ly = lp.ry * w * Math.sin(a);
      base.push([
        lp.cx + lx * cosR - ly * sinR,
        lp.cy + lx * sinR + ly * cosR
      ]);
    }

    const s1 = [];
    const s2 = [];
    const barbEvery = lp.barbEvery || 6;
    const barbOffset = lp.barbOffset || 0;

    for (let i = 0; i < N; i++) {
      const prev = base[(i - 1 + N) % N];
      const next = base[(i + 1) % N];
      let tx = next[0] - prev[0];
      let ty = next[1] - prev[1];
      const len = Math.hypot(tx, ty) || 1;
      tx /= len;
      ty /= len;
      const nx = -ty;
      const ny = tx;
      const a = (i / N) * Math.PI * 2;
      const sep = (lp.sep || 1.45) * Math.sin(a * turns + seed) + 0.42;

      s1.push([base[i][0] + nx * sep, base[i][1] + ny * sep]);
      s2.push([base[i][0] - nx * sep * 0.88, base[i][1] - ny * sep * 0.88]);

      if ((i + barbOffset) % barbEvery === 0) {
        pushBarb(base[i], [tx, ty], [nx, ny], lp.barbLen || barbLen);
      }
    }

    mainPaths.push(smoothClosedPathFromPoints(s1));
    subPaths.push(smoothClosedPathFromPoints(s2));
    if (lp.warmRim) warmPaths.push(smoothClosedPathFromPoints(s1));
  });

  strands.forEach((st, idx) => {
    const pts = st.pts || [];
    if (pts.length < 2) return;
    const seed = st.seed || (idx + 1) * 2.1;
    const turns = st.turns || 5;
    const s1 = [];
    const s2 = [];

    for (let i = 0; i < pts.length; i++) {
      const prev = pts[Math.max(0, i - 1)];
      const next = pts[Math.min(pts.length - 1, i + 1)];
      let tx = next[0] - prev[0];
      let ty = next[1] - prev[1];
      const len = Math.hypot(tx, ty) || 1;
      tx /= len;
      ty /= len;
      const nx = -ty;
      const ny = tx;
      const u = i / Math.max(1, pts.length - 1);
      const sep = (st.sep || 1.25) * Math.sin(u * Math.PI * turns + seed) + 0.35;
      s1.push([pts[i][0] + nx * sep, pts[i][1] + ny * sep]);
      s2.push([pts[i][0] - nx * sep * 0.85, pts[i][1] - ny * sep * 0.85]);

      if (st.barbs && st.barbs.includes(i)) {
        pushBarb(pts[i], [tx, ty], [nx, ny], st.barbLen || barbLen * 0.92);
      }
    }

    mainPaths.push(smoothOpenPathFromPoints(s1));
    subPaths.push(smoothOpenPathFromPoints(s2));
  });

  return (
    '<g fill="none" stroke-linecap="round" stroke-linejoin="round">' +
      (warmPaths.length
        ? '<path d="' + warmPaths.join(' ') + '" stroke="' + wireWarm + '" stroke-opacity="0.16" stroke-width="' + (strokeW * 1.35).toFixed(2) + '"/>'
        : '') +
      '<path d="' + subPaths.join(' ') + '" stroke="' + wireSub + '" stroke-opacity="' + (cfg.subOpacity || 0.44) + '" stroke-width="' + (strokeW * 0.86).toFixed(2) + '"/>' +
      '<path d="' + mainPaths.join(' ') + '" stroke="' + wireMain + '" stroke-opacity="' + (cfg.mainOpacity || 0.68) + '" stroke-width="' + strokeW.toFixed(2) + '"/>' +
      (barbSegs.length
        ? '<path d="' + barbSegs.join(' ') + '" stroke="' + wireMain + '" stroke-opacity="' + (cfg.barbOpacity || 0.72) + '" stroke-width="' + (strokeW * 0.9).toFixed(2) + '"/>'
        : '') +
    '</g>'
  );
}

/* estilos antigos migram para os equivalentes novos.
   Chuva = gotas caindo; Onda = ondas circulares num lago (efeitos separados).
   Atenção: "rain" NUNCA entra aqui — a conversão única do antigo rain (ondas) → waves
   é feita em Store.load() com a marca meta.fxStyleV, para o usuário poder escolher Chuva depois. */
const PARTICLE_ALIASES = { water: 'wet', bubbles: 'waves', lake: 'waves', ripples: 'waves', drizzle: 'rain' };

function resolveMusicVisualState(state, playing, thematicMeta) {
  const st = state || {};
  const fx = st.effects || {};
  const m = st.motion || {};
  const p = st.particles || {};
  const mu = st.music || {};

  const level = ['full', 'reduced', 'off'].includes(fx.level) ? fx.level : 'full';
  const soft = level === 'reduced' ? 0.45 : 1;
  const globalOn = level !== 'off';

  const baseParticleWanted = PARTICLE_ALIASES[p.style] || p.style;
  const baseParticleStyle = PARTICLE_STYLES.some(x => x.id === baseParticleWanted) ? baseParticleWanted : 'dust';
  const baseParticleOn = p.enabled !== false && globalOn;

  const musicActive = !!(globalOn && playing && thematicMeta && mu.visualEffects !== false);
  const musicIntensity = clamp((mu.sceneIntensity == null ? 65 : Number(mu.sceneIntensity)) / 100, 0, 1) * (level === 'reduced' ? 0.5 : 1);

  const sceneId = musicActive && mu.sceneElements !== false ? thematicMeta.sceneId : null;
  const musicParticleStyle = musicActive && mu.sceneParticles !== false ? thematicMeta.particleStyle : null;

  const activeParticleStyle = musicParticleStyle || (baseParticleOn ? baseParticleStyle : null);
  const activeParticleInteractive = musicParticleStyle
    ? (mu.sceneInteractive !== false && globalOn)
    : (p.interactive !== false && globalOn);
  const activeParticleAmount = musicParticleStyle
    ? clamp(0.32 + musicIntensity * 0.68, 0, 1)
    : clamp((p.amount == null ? 55 : Number(p.amount)) / 100, 0, 1) * soft;

  return {
    level,
    soft,
    motionOn: !!m.enabled && globalOn,
    motionMode: MOTION_MODES.some(x => x.id === m.mode) ? m.mode : 'depth',
    motionIntensity: clamp((Number(m.intensity) || 0) / 100, 0, 1) * soft,
    smoothK: 0.02 + (clamp(Number(m.smoothness) || 0, 0, 100) / 100) * 0.13,
    baseParticleOn,
    baseParticleStyle,
    musicActive,
    musicIntensity,
    sceneId,
    activeParticleStyle,
    activeParticleInteractive,
    activeParticleAmount
  };
}

const Motion = {
  /* movimento do fundo */
  on: true,
  mode: 'depth',
  intensity: 0.55,
  smoothK: 0.08,

  /* partículas */
  pOn: true,
  pStyle: 'dust',
  effectivePStyle: 'dust',
  pAmount: 0.55,
  pInteractive: true,

  /* cena visual da música */
  sceneEl: null,
  activeSceneId: null,
  _sceneClearTimer: null,
  musicIntensity: 0.65,
  layerBack: null,
  layerFront: null,

  /* nível global de efeitos: full | reduced | off */
  level: 'full',
  suspended: false,
  ambientClock: 0,

  cur: { x: 0, y: 0 },
  tgt: { x: 0, y: 0 },

  canvas: null,
  pctx: null,
  particles: [],
  typedKeys: [],
  dyingParticles: [],
  dyingStyle: null,
  ripples: [],
  lastMouseRipple: { x: -9999, y: -9999, time: 0 },
  accent: '#8fa2ff',
  accent2: '#5fe3c4',
  raf: null,
  clearing: false,
  time: 0,

  pointer: { x: -9999, y: -9999, active: false, vx: 0, vy: 0, lastX: -9999, lastY: -9999 },

  init() {
    this.canvas = $('#fx-canvas');
    this.sceneEl = $('#music-scene');
    this.pctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());

    document.addEventListener('pointermove', (e) => {
      this.tgt.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.tgt.y = (e.clientY / window.innerHeight) * 2 - 1;
      if (this.pointer.lastX > -9000) {
        this.pointer.vx = clamp(e.clientX - this.pointer.lastX, -42, 42);
        this.pointer.vy = clamp(e.clientY - this.pointer.lastY, -42, 42);
      }
      this.pointer.x = e.clientX;
      this.pointer.y = e.clientY;
      this.pointer.lastX = e.clientX;
      this.pointer.lastY = e.clientY;
      this.pointer.active = true;
    }, { passive: true });

    // O ponteiro não cria ondas: apenas perturba as cristas que o alcançam
    document.addEventListener('pointerleave', () => {
      this.tgt.x = 0; this.tgt.y = 0;
      this.pointer.active = false;
      this.pointer.lastX = -9999; this.pointer.lastY = -9999;
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.tgt.x = 0; this.tgt.y = 0;
        this.pointer.active = false;
        this.pointer.lastX = -9999; this.pointer.lastY = -9999;
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.repeat || this.suspended) return;
      if (!this.pOn || !this.pInteractive || this.effectivePStyle !== 'keys') return;
      this.spawnTypedKeyParticle(e.key);
    }, { passive: true });

    this.readState(true);
    this.loop();
  },

  spawnTypedKeyParticle(keyName) {
    const w = window.innerWidth || 1200;
    const h = window.innerHeight || 800;
    const label = formatKeycapLabel(keyName);
    const wide = label.length >= 4 ? 1.85 : (label.length >= 2 ? 1.32 : 1);
    if (this.typedKeys.length >= 36) this.typedKeys.shift();
    this.typedKeys.push({
      x: w * (0.10 + Math.random() * 0.80),
      y: h + 16,
      vx: (Math.random() - 0.5) * 0.85,
      vy: -(1.65 + Math.random() * 1.15),
      size: label.length > 2 ? 32 : 28,
      wide,
      rot: (Math.random() - 0.5) * 0.22,
      rotSpeed: (Math.random() - 0.5) * 0.008,
      phase: Math.random() * Math.PI * 2,
      hit: 0,
      a: 0.94,
      age: 0,
      c: Math.random() < 0.58 ? 1 : 2,
      typed: true,
      label
    });
  },

  readState(force) {
    const m = Store.state.motion || {};
    const p = Store.state.particles || {};
    const playing = typeof Sound !== 'undefined' && !!Sound.playing;
    const thematic = typeof getThematicTrack === 'function' && Store.state.music
      ? getThematicTrack(Store.state.music.track)
      : null;

    const prevEffective = this.effectivePStyle;
    const prevAmount = this.pAmount;

    const resolved = resolveMusicVisualState(Store.state, playing, thematic);
    this.level = resolved.level;
    this.on = resolved.motionOn;
    this.mode = resolved.motionMode;
    this.intensity = resolved.motionIntensity;
    this.smoothK = resolved.smoothK;
    m.mode = this.mode;

    this.pStyle = resolved.baseParticleStyle;
    p.style = this.pStyle;

    this.effectivePStyle = resolved.activeParticleStyle;
    this.pOn = !!resolved.activeParticleStyle;
    this.pAmount = resolved.activeParticleAmount;
    this.pInteractive = resolved.activeParticleInteractive;
    this.musicIntensity = resolved.musicIntensity;

    this.syncColors();
    this.syncMusicScene(resolved.sceneId);
    if (force || prevEffective !== this.effectivePStyle || Math.abs(prevAmount - this.pAmount) > 0.04) {
      if (!force && prevEffective !== this.effectivePStyle && (prevEffective === 'petals' || prevEffective === 'embers') && this.particles.length) {
        this.dyingStyle = prevEffective;
        this.dyingParticles = this.particles.map(pt => Object.assign({}, pt, { fade: 1 }));
      }
      this.spawnParticles();
    }
  },

  /* pausa tudo enquanto a Área de Trabalho está aberta */
  setSuspended(on) {
    on = !!on;
    if (this.suspended === on) return;
    this.suspended = on;
    this.pointer.active = false;
    this.ripples = [];
    this.dyingParticles = [];
    this.typedKeys = [];
    if (this.canvas && this.pctx) this.pctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const wp = $('#wallpaper');
    const wpFade = $('#wallpaper-fade');
    const glow = $('#glow-layer');
    if (wp) wp.style.transform = 'none';
    if (wpFade) wpFade.style.transform = 'none';
    if (glow) glow.style.transform = 'translate(-50%, -50%)';
    if (this.sceneEl) this.sceneEl.classList.toggle('active', !on && !!this.activeSceneId);
  },

  buildFlowersSceneHtml() {
    const rose = (x, y, s, flip) => (
      '<g transform="translate(' + x + ' ' + y + ') scale(' + (flip ? -s : s) + ' ' + s + ')">' +
        '<path d="M-8 10 Q0 16 8 10 Q2 4 -8 10 Z" fill="var(--accent-2)" fill-opacity="0.46" stroke="var(--accent-2)" stroke-width="1"/>' +
        '<path d="M-19 2 C-22 -11 -7 -22 4 -17 C-2 -9 -4 4 -19 2 Z" fill="var(--accent)" fill-opacity="0.34" stroke="var(--accent)" stroke-width="1.3"/>' +
        '<path d="M19 1 C22 -12 8 -22 -4 -17 C2 -9 4 4 19 1 Z" fill="var(--accent)" fill-opacity="0.30" stroke="var(--accent)" stroke-width="1.3"/>' +
        '<path d="M-13 8 C-14 -7 0 -17 12 -9 C16 -1 11 11 0 12 C-8 12 -12 10 -13 8 Z" fill="var(--accent)" fill-opacity="0.46" stroke="var(--text)" stroke-opacity="0.62" stroke-width="1.2"/>' +
        '<path d="M-5 2 C-6 -6 3 -9 7 -3 C9 3 2 7 -3 4 C-5 2 -4 -2 1 -2" fill="none" stroke="var(--text)" stroke-opacity="0.88" stroke-width="1.35" stroke-linecap="round"/>' +
      '</g>'
    );
    const bud = (x, y, s, rot) => (
      '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ') scale(' + s + ')">' +
        '<path d="M-4 7 Q0 11 4 7" fill="none" stroke="var(--accent-2)" stroke-width="1.4" stroke-linecap="round"/>' +
        '<path d="M-5 5 C-7 -4 -2 -11 0 -13 C3 -10 7 -4 5 5 Z" fill="var(--accent)" fill-opacity="0.42" stroke="var(--accent)" stroke-width="1.2"/>' +
      '</g>'
    );

    const leftBack =
      '<svg class="ms-cluster-l" viewBox="0 0 420 260">' +
        '<g fill="none" stroke="var(--accent-2)" stroke-linecap="round">' +
          '<path d="M10 260 Q74 196 138 142 Q184 104 242 84" stroke-width="2" opacity="0.58"/>' +
          '<path d="M96 178 Q162 152 232 164" stroke-width="1.5" opacity="0.46"/>' +
        '</g>' +
        '<g fill="var(--accent-2)" fill-opacity="0.24" stroke="var(--accent-2)" stroke-width="1.1">' +
          '<path d="M72 204 C44 190 36 168 48 156 C68 164 78 184 72 204 Z"/>' +
          '<path d="M148 144 C138 118 148 96 164 94 C172 114 166 132 148 144 Z"/>' +
          '<path d="M188 158 C196 138 216 130 232 138 C220 152 206 160 188 158 Z"/>' +
        '</g>' +
        rose(246, 82, 0.72, false) +
        bud(236, 162, 0.75, 42) +
      '</svg>';

    const rightBack =
      '<svg class="ms-cluster-r" viewBox="0 0 420 260">' +
        '<g transform="translate(420 0) scale(-1 1)">' +
          '<g fill="none" stroke="var(--accent-2)" stroke-linecap="round">' +
            '<path d="M10 260 Q74 196 138 142 Q184 104 242 84" stroke-width="2" opacity="0.58"/>' +
            '<path d="M96 178 Q162 152 232 164" stroke-width="1.5" opacity="0.46"/>' +
          '</g>' +
          '<g fill="var(--accent-2)" fill-opacity="0.24" stroke="var(--accent-2)" stroke-width="1.1">' +
            '<path d="M72 204 C44 190 36 168 48 156 C68 164 78 184 72 204 Z"/>' +
            '<path d="M148 144 C138 118 148 96 164 94 C172 114 166 132 148 144 Z"/>' +
            '<path d="M188 158 C196 138 216 130 232 138 C220 152 206 160 188 158 Z"/>' +
          '</g>' +
          rose(246, 82, 0.72, false) +
          bud(236, 162, 0.75, 42) +
        '</g>' +
      '</svg>';

    const leftFront =
      '<svg class="ms-cluster-l" viewBox="0 0 440 270">' +
        '<g fill="none" stroke="var(--accent-2)" stroke-linecap="round">' +
          '<path d="M-8 272 Q58 202 108 146 Q138 112 174 96" stroke-width="2.5" opacity="0.82"/>' +
          '<path d="M92 166 Q170 144 252 162 Q284 170 306 160" stroke-width="1.8" opacity="0.72"/>' +
          '<path d="M38 228 Q114 212 192 234" stroke-width="1.5" opacity="0.62"/>' +
        '</g>' +
        '<g fill="var(--accent-2)" fill-opacity="0.30" stroke="var(--accent-2)" stroke-width="1.2">' +
          '<path d="M52 206 C24 192 14 168 28 154 C50 164 62 184 52 206 Z"/>' +
          '<path d="M126 156 C122 128 138 108 158 112 C156 134 144 148 126 156 Z"/>' +
          '<path d="M210 156 C218 130 242 122 258 132 C246 148 228 158 210 156 Z"/>' +
          '<path d="M138 224 C150 202 174 198 188 210 C172 222 154 228 138 224 Z"/>' +
        '</g>' +
        rose(176, 94, 1.0, false) +
        rose(308, 158, 0.72, false) +
        bud(194, 234, 0.78, 62) +
      '</svg>';

    const rightFront =
      '<svg class="ms-cluster-r" viewBox="0 0 440 270">' +
        '<g transform="translate(440 0) scale(-1 1)">' +
          '<g fill="none" stroke="var(--accent-2)" stroke-linecap="round">' +
            '<path d="M-8 272 Q58 202 108 146 Q138 112 174 96" stroke-width="2.5" opacity="0.82"/>' +
            '<path d="M92 166 Q170 144 252 162 Q284 170 306 160" stroke-width="1.8" opacity="0.72"/>' +
            '<path d="M38 228 Q114 212 192 234" stroke-width="1.5" opacity="0.62"/>' +
          '</g>' +
          '<g fill="var(--accent-2)" fill-opacity="0.30" stroke="var(--accent-2)" stroke-width="1.2">' +
            '<path d="M52 206 C24 192 14 168 28 154 C50 164 62 184 52 206 Z"/>' +
            '<path d="M126 156 C122 128 138 108 158 112 C156 134 144 148 126 156 Z"/>' +
            '<path d="M210 156 C218 130 242 122 258 132 C246 148 228 158 210 156 Z"/>' +
            '<path d="M138 224 C150 202 174 198 188 210 C172 222 154 228 138 224 Z"/>' +
          '</g>' +
          rose(176, 94, 1.0, false) +
          rose(308, 158, 0.72, false) +
          bud(194, 234, 0.78, 62) +
        '</g>' +
      '</svg>';

    return (
      '<div class="ms-layer ms-layer-back">' + leftBack + rightBack + '</div>' +
      '<div class="ms-layer ms-layer-front">' + leftFront + rightFront + '</div>'
    );
  },

  buildMarchSceneHtml() {
    /* Rolo orgânico principal à esquerda — inspirado no esboço de arame farpado emaranhado */
    const leftFrontSvg =
      '<svg class="ms-cluster-l" viewBox="0 0 460 280">' +
        buildMarchWireGroup({
          strokeWidth: 1.32,
          barbLen: 5.6,
          mainOpacity: 0.74,
          subOpacity: 0.48,
          barbOpacity: 0.78,
          loops: [
            { cx: 152, cy: 174, rx: 94, ry: 74, rotDeg: -14, seed: 0.7, steps: 42, turns: 8, barbEvery: 5, barbOffset: 1, warmRim: true },
            { cx: 205, cy: 184, rx: 108, ry: 56, rotDeg: 22, seed: 2.1, steps: 42, turns: 7, barbEvery: 6, barbOffset: 3 },
            { cx: 242, cy: 192, rx: 86, ry: 68, rotDeg: -28, seed: 3.6, steps: 38, turns: 7, barbEvery: 6, barbOffset: 2, warmRim: true },
            { cx: 196, cy: 162, rx: 118, ry: 42, rotDeg: -6, seed: 4.9, steps: 40, turns: 9, barbEvery: 7, barbOffset: 4 }
          ],
          strands: [
            { pts: [[18, 258], [62, 252], [116, 238], [164, 246], [228, 254], [288, 244], [344, 224]], turns: 6, barbs: [2, 4] },
            { pts: [[88, 118], [134, 152], [186, 188], [244, 222], [296, 246]], turns: 5, barbs: [1, 3] },
            { pts: [[78, 228], [136, 198], [198, 168], [262, 146], [304, 156]], turns: 5, barbs: [1, 3] }
          ]
        }) +
      '</svg>';

    /* Variação assimétrica à direita — rolo mais baixo, estendido e solto */
    const rightFrontSvg =
      '<svg class="ms-cluster-r" viewBox="0 0 440 270">' +
        buildMarchWireGroup({
          strokeWidth: 1.24,
          barbLen: 5.2,
          mainOpacity: 0.66,
          subOpacity: 0.42,
          barbOpacity: 0.72,
          loops: [
            { cx: 274, cy: 194, rx: 92, ry: 54, rotDeg: 18, seed: 1.4, steps: 40, turns: 7, barbEvery: 6, barbOffset: 2, warmRim: true },
            { cx: 224, cy: 204, rx: 102, ry: 44, rotDeg: -16, seed: 2.9, steps: 38, turns: 7, barbEvery: 6, barbOffset: 4 },
            { cx: 312, cy: 184, rx: 70, ry: 62, rotDeg: -22, seed: 4.3, steps: 36, turns: 6, barbEvery: 6, barbOffset: 1 }
          ],
          strands: [
            { pts: [[104, 244], [156, 232], [208, 242], [274, 248], [348, 242], [414, 250]], turns: 6, barbs: [1, 4] },
            { pts: [[168, 220], [226, 192], [286, 174], [352, 168]], turns: 5, barbs: [1, 2] }
          ]
        }) +
      '</svg>';

    /* Camada de fundo suave para profundidade no movimento (parallax) */
    const backSpanSvg =
      '<svg class="ms-span-svg" viewBox="0 0 1440 260" preserveAspectRatio="xMidYMax slice">' +
        '<path d="M0 260 L0 238 Q260 226 520 236 T1040 232 T1440 238 L1440 260 Z" fill="var(--bg)" opacity="0.72"/>' +
        buildMarchWireGroup({
          strokeWidth: 0.95,
          barbLen: 4.1,
          mainOpacity: 0.34,
          subOpacity: 0.22,
          barbOpacity: 0.36,
          loops: [
            { cx: 310, cy: 204, rx: 78, ry: 42, rotDeg: -12, seed: 5.2, steps: 32, turns: 6, barbEvery: 7, barbOffset: 1 },
            { cx: 365, cy: 212, rx: 66, ry: 34, rotDeg: 19, seed: 6.1, steps: 30, turns: 5, barbEvery: 7, barbOffset: 3 },
            { cx: 1090, cy: 208, rx: 84, ry: 38, rotDeg: 14, seed: 7.4, steps: 32, turns: 6, barbEvery: 7, barbOffset: 2 },
            { cx: 1152, cy: 202, rx: 58, ry: 44, rotDeg: -20, seed: 8.3, steps: 30, turns: 5, barbEvery: 7, barbOffset: 0 }
          ],
          strands: [
            { pts: [[38, 244], [240, 232], [480, 238], [720, 234], [980, 239], [1220, 232], [1402, 242]], turns: 9, barbs: [2, 4] }
          ]
        }) +
      '</svg>';

    return (
      '<div class="ms-layer ms-layer-back">' + backSpanSvg + '</div>' +
      '<div class="ms-layer ms-layer-front">' + leftFrontSvg + rightFrontSvg + '</div>'
    );
  },

  syncMusicScene(sceneId) {
    if (!this.sceneEl) return;
    const prevId = this.activeSceneId;
    clearTimeout(this._sceneClearTimer);
    this._sceneClearTimer = null;
    this.activeSceneId = sceneId || null;

    if (!this.activeSceneId) {
      this.sceneEl.classList.remove('active');
      if (prevId || this.sceneEl.firstChild) {
        this._sceneClearTimer = setTimeout(() => {
          this._sceneClearTimer = null;
          if (!this.activeSceneId && this.sceneEl) {
            this.sceneEl.classList.remove('scene-flowers', 'scene-march');
            this.sceneEl.innerHTML = '';
            this.layerBack = null;
            this.layerFront = null;
          }
        }, 1300);
      }
      return;
    }

    if (prevId !== this.activeSceneId || !this.sceneEl.firstChild) {
      this.sceneEl.classList.remove('scene-flowers', 'scene-march');
      this.sceneEl.classList.add('scene-' + this.activeSceneId);
      this.sceneEl.innerHTML = this.activeSceneId === 'flowers'
        ? this.buildFlowersSceneHtml()
        : this.buildMarchSceneHtml();
      this.layerBack = this.sceneEl.querySelector('.ms-layer-back');
      this.layerFront = this.sceneEl.querySelector('.ms-layer-front');
      if (!this.suspended && typeof requestAnimationFrame === 'function') {
        this.sceneEl.classList.remove('active');
        requestAnimationFrame(() => {
          if (this.sceneEl && this.activeSceneId === sceneId && !this.suspended) {
            this.sceneEl.classList.add('active');
          }
        });
        return;
      }
    }
    this.sceneEl.classList.toggle('active', !this.suspended);
  },

  updateMusicSceneTransforms(x, y, bgIntensity) {
    if (!this.sceneEl || this.suspended || (!this.activeSceneId && !this.sceneEl.firstChild)) return;
    const mi = this.musicIntensity;
    const sway = Math.sin(this.time * 0.00085) * (3.5 * mi);
    const swayRot = Math.sin(this.time * 0.00062) * (0.45 * mi);
    const px = this.on ? (0.4 + bgIntensity * 0.75) : (0.28 + mi * 0.35);

    if (this.layerBack) {
      const bx = (-x * 26 * px) + sway * 0.6;
      const by = -y * 12 * px;
      this.layerBack.style.transform =
        'translate3d(' + bx.toFixed(1) + 'px,' + by.toFixed(1) + 'px,0) rotate(' + (swayRot * 0.4).toFixed(2) + 'deg)';
    }
    if (this.layerFront) {
      const fx = (-x * 46 * px) + sway * 1.15;
      const fy = -y * 20 * px;
      this.layerFront.style.transform =
        'translate3d(' + fx.toFixed(1) + 'px,' + fy.toFixed(1) + 'px,0) rotate(' + (swayRot * 0.85).toFixed(2) + 'deg)';
    }
  },

  syncColors() {
    const cs = getComputedStyle(document.documentElement);
    this.accent = (cs.getPropertyValue('--accent') || '').trim() || '#8fa2ff';
    this.accent2 = (cs.getPropertyValue('--accent-2') || '').trim() || '#5fe3c4';
  },

  resize() {
    if (!this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const oldW = this.canvas.width / dpr || window.innerWidth;
    const oldH = this.canvas.height / dpr || window.innerHeight;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.particles.length && oldW && oldH) {
      const sx = window.innerWidth / oldW;
      const sy = window.innerHeight / oldH;
      this.particles.forEach(p => {
        p.x *= sx; p.y *= sy;
        p.ax = p.ax == null ? p.x : p.ax * sx;
        p.ay = p.ay == null ? p.y : p.ay * sy;
        if (p.impactY != null) p.impactY *= sy;
        if (p.stickY != null) p.stickY *= sy;
      });
    } else if (this.particles.length) {
      this.particles.forEach(p => this.resetParticle(p, false));
    }
    if (!this.particles.length) this.spawnParticles();
  },

  /* ---------------- criação de partículas ---------------- */
  spawnParticles() {
    if (!this.pctx) return;
    const style = this.effectivePStyle;
    if (style !== 'keys') this.typedKeys = [];
    if (!style) { this.particles = []; return; }
    /* Onda é feita apenas de ondulações ambientes — nenhuma partícula cai */
    if (style === 'waves') { this.particles = []; this.ripples = []; return; }
    const w = window.innerWidth, h = window.innerHeight;
    const base = clamp(Math.round((w * h) / 19000), 24, 88);
    const factor = (style === 'petals') ? 0.58 : (style === 'embers' ? 0.82 : (style === 'keys' ? 0.44 : 1));
    const count = clamp(Math.round(base * (0.25 + this.pAmount * 1.4) * factor), 4, 170);
    this.particles = [];
    for (let i = 0; i < count; i++) {
      const p = { phase: Math.random() * Math.PI * 2, hit: 0 };
      this.initParticle(p, true);
      this.particles.push(p);
    }
  },

  initParticle(p, scatter) {
    const w = window.innerWidth, h = window.innerHeight;
    const style = this.effectivePStyle || this.pStyle;
    p.c = Math.random() > 0.5 ? 1 : 2;
    switch (style) {
      case 'petals':
        p.x = Math.random() * w;
        p.y = scatter ? Math.random() * h : -24 - Math.random() * 60;
        p.vx = (Math.random() - 0.5) * 0.45;
        p.vy = 0.52 + Math.random() * 0.88;
        p.r = 4.6 + Math.random() * 4.8;
        p.a = 0.34 + Math.random() * 0.42;
        p.rot = Math.random() * Math.PI * 2;
        p.rotSpeed = (Math.random() - 0.5) * 0.025;
        p.flip = Math.random() * Math.PI * 2;
        p.flipSpeed = 0.02 + Math.random() * 0.032;
        p.c = Math.random() < 0.72 ? 1 : 2;
        break;
      case 'embers':
        p.x = Math.random() * w;
        p.y = scatter ? Math.random() * h : h + 12 + Math.random() * 70;
        p.vx = (Math.random() - 0.5) * 0.45;
        p.vy = -(0.65 + Math.random() * 1.45);
        p.r = 1.0 + Math.random() * 2.4;
        p.a = 0.38 + Math.random() * 0.52;
        p.flicker = 0.004 + Math.random() * 0.006;
        p.c = Math.random() < 0.62 ? 1 : 2;
        break;
      case 'rain':
        p.x = Math.random() * w;
        p.y = scatter ? Math.random() * h : -30 - Math.random() * 120;
        p.vx = (Math.random() - 0.5) * 0.4;
        p.vy = 4 + Math.random() * 7;
        p.r = 0.7 + Math.random() * 1.3;
        p.len = 8 + Math.random() * 16;
        p.a = 0.18 + Math.random() * 0.35;
        break;
      case 'wet': {
        p.x = Math.random() * w;
        p.vx = 0;
        p.tiny = Math.random() < 0.36;
        p.mode = (!p.tiny && Math.random() < 0.55) ? 'cling' : 'run';
        p.wob = Math.random() * Math.PI * 2;
        if (p.mode === 'cling') {
          p.y = Math.random() * h;
          p.vy = 0;
          p.stickY = null;
        } else {
          p.y = scatter ? Math.random() * h * 0.85 : -20 - Math.random() * 60;
          p.vy = 0.10 + Math.random() * 0.24;
          p.stickY = clamp(p.y + 70 + Math.random() * 340, 24, h - 8);
          p.willStick = Math.random() < 0.62;
        }
        p.r = p.tiny
          ? 0.9 + Math.random() * 1.5
          : 2.2 + Math.pow(Math.random(), 1.5) * 5.6;
        p.a = 0.30 + Math.random() * 0.42;
        break;
      }
      case 'snow':
        p.x = Math.random() * w;
        p.y = scatter ? Math.random() * h : -20;
        p.vx = (Math.random() - 0.5) * 0.35;
        p.vy = 0.25 + Math.random() * 0.65;
        p.r = 1.1 + Math.random() * 2.6;
        p.a = 0.25 + Math.random() * 0.45;
        break;
      case 'keys':
        p.x = Math.random() * w;
        p.y = scatter ? Math.random() * h : h + 28 + Math.random() * 70;
        p.vx = (Math.random() - 0.5) * 0.28;
        p.vy = -(0.42 + Math.random() * 0.72);
        p.size = 18 + Math.random() * 14;
        p.wide = Math.random() < 0.14 ? 1.55 : 1;
        p.rot = (Math.random() - 0.5) * 0.26;
        p.rotSpeed = (Math.random() - 0.5) * 0.005;
        p.a = 0.16 + Math.random() * 0.24;
        p.typed = false;
        p.label = AMBIENT_KEY_POOL[Math.floor(Math.random() * AMBIENT_KEY_POOL.length)];
        break;
      case 'drizzle':
        p.x = Math.random() * w;
        p.impactY = h * (0.12 + Math.random() * 0.80);
        p.y = scatter ? Math.random() * p.impactY : -12 - Math.random() * 40;
        p.vx = (Math.random() - 0.5) * 0.10;
        p.vy = 2.0 + Math.random() * 2.8;
        p.r = 0.55 + Math.random() * 0.55;
        p.len = 6 + Math.random() * 10;
        p.a = 0.08 + Math.random() * 0.12;
        break;
      default: /* dust */
        p.x = Math.random() * w;
        p.y = Math.random() * h;
        p.ax = p.x; p.ay = p.y;
        p.vx = 0; p.vy = 0;
        p.r = 1.2 + Math.random() * 3.2;
        p.a = 0.12 + Math.random() * 0.40;
        p.speed = 0.0004 + Math.random() * 0.0009;
        break;
    }
  },

  resetParticle(p, fromTop) {
    const w = window.innerWidth, h = window.innerHeight;
    const style = this.effectivePStyle || this.pStyle;
    // limpa campos que pertencem a outros estilos (evita estado residual)
    p.impactY = null;
    p.stickY = null;
    p.willStick = false;
    p.mode = null;
    p.tiny = false;
    p.typed = false;
    switch (style) {
      case 'petals':
        p.x = Math.random() * w;
        p.y = -24 - Math.random() * 50;
        p.vx = (Math.random() - 0.5) * 0.45;
        p.vy = 0.52 + Math.random() * 0.88;
        p.rot = Math.random() * Math.PI * 2;
        break;
      case 'embers':
        p.x = Math.random() * w;
        p.y = h + 14 + Math.random() * 50;
        p.vx = (Math.random() - 0.5) * 0.45;
        p.vy = -(0.65 + Math.random() * 1.45);
        break;
      case 'rain':
        p.x = Math.random() * w; p.y = -30 - Math.random() * 80;
        p.vx = (Math.random() - 0.5) * 0.4; p.vy = 4 + Math.random() * 7;
        break;
      case 'wet': {
        p.x = Math.random() * w;
        p.vx = 0;
        p.tiny = Math.random() < 0.36;
        p.mode = (!p.tiny && Math.random() < 0.55) ? 'cling' : 'run';
        p.wob = Math.random() * Math.PI * 2;
        if (p.mode === 'cling') {
          p.y = Math.random() * h;
          p.vy = 0;
          p.stickY = null;
        } else {
          p.y = -20 - Math.random() * 60;
          p.vy = 0.10 + Math.random() * 0.24;
          p.stickY = 24 + Math.random() * Math.max(24, h * 0.9);
          p.willStick = Math.random() < 0.62;
        }
        p.r = p.tiny
          ? 0.9 + Math.random() * 1.5
          : 2.2 + Math.pow(Math.random(), 1.5) * 5.6;
        p.a = 0.30 + Math.random() * 0.42;
        break;
      }
      case 'snow':
        p.x = Math.random() * w; p.y = -20;
        p.vx = (Math.random() - 0.5) * 0.35; p.vy = 0.25 + Math.random() * 0.65;
        break;
      case 'keys':
        p.x = Math.random() * w;
        p.y = h + 28 + Math.random() * 70;
        p.vx = (Math.random() - 0.5) * 0.28;
        p.vy = -(0.42 + Math.random() * 0.72);
        p.rot = (Math.random() - 0.5) * 0.26;
        p.label = AMBIENT_KEY_POOL[Math.floor(Math.random() * AMBIENT_KEY_POOL.length)];
        break;
      case 'drizzle':
        p.x = Math.random() * w;
        p.impactY = h * (0.12 + Math.random() * 0.80);
        p.y = -12 - Math.random() * 40;
        p.vx = (Math.random() - 0.5) * 0.10;
        p.vy = 2.0 + Math.random() * 2.8;
        p.r = 0.55 + Math.random() * 0.55;
        p.len = 6 + Math.random() * 10;
        p.a = 0.08 + Math.random() * 0.12;
        break;
      default:
        p.x = Math.random() * w; p.y = Math.random() * h;
        p.ax = p.x; p.ay = p.y; p.vx = 0; p.vy = 0;
        break;
    }
    if (fromTop) p.hit = 0;
  },

  wrapX(p) {
    const w = window.innerWidth;
    if (p.x < -40) { p.x = w + 40; if (p.ax != null) p.ax = p.x; }
    if (p.x > w + 40) { p.x = -40; if (p.ax != null) p.ax = p.x; }
  },

  /* ---------------- laço principal ---------------- */
  loop() {
    if (this.suspended) {
      this.raf = requestAnimationFrame(() => this.loop());
      return;
    }

    const k = this.smoothK;
    this.cur.x += (this.tgt.x - this.cur.x) * k;
    this.cur.y += (this.tgt.y - this.cur.y) * k;
    this.time += 16;

    this.pointer.vx *= 0.90;
    this.pointer.vy *= 0.90;

    const wp = $('#wallpaper');
    const wpFade = $('#wallpaper-fade');
    const glow = $('#glow-layer');
    const x = this.cur.x, y = this.cur.y, i = this.intensity;

    if (!this.on) {
      wp.style.transform = 'none';
      if (wpFade) wpFade.style.transform = 'none';
      glow.style.transform = 'translate(-50%, -50%)';
    } else {
      let wt = '';
      switch (this.mode) {
        case 'shift':
          wt = 'translate3d(' + (-x * 34 * i).toFixed(1) + 'px,' + (-y * 24 * i).toFixed(1) + 'px,0)';
          glow.style.transform = 'translate(-50%,' + (-50 - y * 6 * i) + '%) translate3d(' + (x * 14 * i).toFixed(1) + 'px,' + (y * 10 * i).toFixed(1) + 'px,0)';
          break;
        case 'depth':
          wt = 'translate3d(' + (-x * 52 * i).toFixed(1) + 'px,' + (-y * 36 * i).toFixed(1) + 'px,0) scale(' + (1.08 + i * 0.05).toFixed(3) + ')';
          glow.style.transform = 'translate(-50%,-50%) translate3d(' + (x * 64 * i).toFixed(1) + 'px,' + (y * 44 * i).toFixed(1) + 'px,0)';
          break;
        case 'tilt':
          wt = 'perspective(1100px) rotateY(' + (x * 7 * i).toFixed(2) + 'deg) rotateX(' + (-y * 7 * i).toFixed(2) + 'deg) scale(1.14)';
          glow.style.transform = 'translate(-50%,-50%) perspective(1100px) rotateY(' + (x * 3 * i).toFixed(2) + 'deg) rotateX(' + (-y * 3 * i).toFixed(2) + 'deg)';
          break;
        case 'sway':
          wt = 'translate3d(' + (-x * 44 * i).toFixed(1) + 'px,' + (-y * 30 * i).toFixed(1) + 'px,0) rotate(' + (-x * 2.4 * i).toFixed(2) + 'deg) scale(' + (1.10 + i * 0.05).toFixed(3) + ')';
          glow.style.transform = 'translate(-50%,-50%) translate3d(' + (x * 38 * i).toFixed(1) + 'px,' + (y * 26 * i).toFixed(1) + 'px,0) scale(' + (1 + i * 0.08).toFixed(3) + ')';
          break;
        case 'drift':
          wt = 'translate3d(' + (-x * 92 * i).toFixed(1) + 'px,' + (-y * 68 * i).toFixed(1) + 'px,0) scale(' + (1.16 + i * 0.08).toFixed(3) + ')';
          glow.style.transform = 'translate(-50%,-50%) translate3d(' + (x * 110 * i).toFixed(1) + 'px,' + (y * 82 * i).toFixed(1) + 'px,0) scale(' + (1 + i * 0.16).toFixed(3) + ')';
          break;
        default:
          wt = 'none';
      }
      wp.style.transform = wt;
      if (wpFade) wpFade.style.transform = wt;
    }

    this.updateMusicSceneTransforms(x, y, i);

    const hasLiveParticles = this.pOn && this.pAmount > 0.01 && this.effectivePStyle;
    if (hasLiveParticles || this.dyingParticles.length > 0 || this.typedKeys.length > 0) {
      this.stepParticles();
      this.drawParticles();
      this.clearing = false;
    } else if (!this.clearing) {
      this.pctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      this.clearing = true;
    }

    this.raf = requestAnimationFrame(() => this.loop());
  },

  /* ---------------- física das partículas e ondas ---------------- */
  addRipple(x, y, type = 'ambient', strength = 1) {
    if (this.ripples.length > 28) this.ripples.shift();
    const maxR = (105 + Math.random() * 95) * strength * (0.75 + this.intensity * 0.55);
    // Propagações circulares em uma superfície 2D: velocidade constante e
    // decaimento de amplitude com a distância percorrida.
    const speed = 0.052 * (0.86 + this.intensity * 0.34);
    this.ripples.push({
      x, y,
      type,
      birth: performance.now(),
      maxRadius: maxR,
      speed: speed,
      wavelength: 18 + Math.random() * 13,
      crests: Math.random() < 0.45 ? 3 : 2,
      maxAlpha: 0.42 * (0.45 + this.pAmount * 0.85),
      fade: 1,
      c: Math.random() > 0.45 ? 1 : 2
    });
  },

  drawRipples() {
    if (!this.ripples.length) return;
    const ctx = this.pctx;
    const now = performance.now();
    const pointerActive = this.pInteractive && this.pointer.active;
    const px = this.pointer.x, py = this.pointer.y;
    const mouseRadius = 58; // região local de interferência

    this.ripples.forEach(rip => {
      const age = now - rip.birth;
      const curR = age * rip.speed;
      const col = rip.c === 1 ? this.accent : this.accent2;
      const dCenterToMouse = pointerActive ? Math.hypot(px - rip.x, py - rip.y) : 9999;

      for (let k = 0; k < rip.crests; k++) {
        const cr = curR - k * rip.wavelength;
        if (cr <= 1.5 || cr > rip.maxRadius) continue;

        const p = cr / rip.maxRadius;
        // decaimento físico suave da amplitude com a distância
        const distDecay = (1 - p) * Math.sqrt(1 - p);
        const crestEnvelope = Math.sin(((rip.crests - k) / rip.crests) * Math.PI * 0.5);
        const alpha = clamp(rip.maxAlpha * distDecay * crestEnvelope * (rip.fade == null ? 1 : rip.fade), 0, 1);
        if (alpha < 0.005) continue;

        ctx.globalAlpha = alpha;
        ctx.strokeStyle = col;
        ctx.lineWidth = clamp(1.35 * (1 - p * 0.42), 0.55, 2.1);

        // a crista só é perturbada no instante em que alcança o ponteiro
        const touchesMouse = pointerActive && Math.abs(cr - dCenterToMouse) < (mouseRadius + 14);

        if (!touchesMouse) {
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, cr, 0, Math.PI * 2);
          ctx.stroke();

          if (p < 0.82) {
            ctx.globalAlpha = alpha * 0.55;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = clamp(0.85 * (1 - p), 0.35, 1.2);
            ctx.beginPath();
            ctx.arc(rip.x, rip.y, cr, Math.PI * 1.08, Math.PI * 1.92);
            ctx.stroke();
          }
        } else {
          // interferência local: pequenas ondulações no ponto de contato
          const steps = 72;
          const path = (from, to) => {
            ctx.beginPath();
            for (let s = from; s <= to; s++) {
              const th = (s / steps) * Math.PI * 2;
              const bx = rip.x + Math.cos(th) * cr;
              const by = rip.y + Math.sin(th) * cr;
              const dm = Math.hypot(bx - px, by - py);
              let effR = cr;
              if (dm < mouseRadius) {
                const wgt = 1 - dm / mouseRadius;
                const noise = (Math.sin(dm * 0.42 - now * 0.0032) * 3.4 +
                  Math.cos(th * 15 + now * 0.0017) * 1.8) * (wgt * wgt);
                effR = cr + noise;
              }
              const vx = rip.x + Math.cos(th) * effR;
              const vy = rip.y + Math.sin(th) * effR;
              if (s === from) ctx.moveTo(vx, vy);
              else ctx.lineTo(vx, vy);
            }
            ctx.stroke();
          };
          path(0, steps);

          if (p < 0.82) {
            ctx.globalAlpha = alpha * 0.5;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = clamp(0.8 * (1 - p), 0.35, 1.1);
            path(Math.round(steps * 0.52), Math.round(steps * 0.95));
          }
        }
      }
    });

    ctx.globalAlpha = 1;
  },

  pointerPush(p, strength, horizontalOnly) {
    if (!this.pInteractive || !this.pointer.active) return 0;
    const px = this.pointer.x, py = this.pointer.y;
    const radius = 80 + this.intensity * 90;
    const dx = p.x - px, dy = p.y - py;
    const dist = Math.hypot(dx, dy);
    if (dist >= radius || dist < 0.001) return 0;
    const near = 1 - dist / radius;
    const push = near * near * strength;
    const inv = 1 / dist;
    p.vx += dx * inv * push;
    if (!horizontalOnly) p.vy += dy * inv * push;
    return near;
  },

  stepParticles() {
    const w = window.innerWidth, h = window.innerHeight;
    const style = this.effectivePStyle || this.pStyle;
    const active = this.pInteractive && this.pointer.active;
    const t = this.time;

    if (this.dyingParticles.length) {
      const ds = this.dyingStyle;
      this.dyingParticles = this.dyingParticles.filter(p => {
        p.fade = (p.fade == null ? 1 : p.fade) - 0.014;
        if (ds === 'petals') {
          const breeze = Math.sin(t * 0.0011 + p.phase) * 0.34;
          p.x += p.vx + breeze;
          p.y += clamp(p.vy * 0.8, 0.15, 3.0);
          p.vx *= 0.965;
          p.rot = (p.rot || 0) + (p.rotSpeed || 0.012);
          p.flip = (p.flip || 0) + (p.flipSpeed || 0.024);
        } else if (ds === 'embers') {
          const curl = Math.sin(t * 0.002 + p.phase) * 0.42;
          p.x += p.vx + curl;
          p.y += p.vy * 0.95;
          p.vx *= 0.955;
        }
        return p.fade > 0.015;
      });
    }

    if (!this.pOn || !this.effectivePStyle) return;

    if (style === 'waves') {
      this.stepAmbientRipples(w, h);
      return;
    }

    this.particles.forEach(p => {
      let hit = 0;
      switch (style) {
        case 'petals': {
          hit = this.pointerPush(p, 0.78, false);
          if (hit > 0.05 && active) {
            p.vx += this.pointer.vx * 0.012 * hit;
            p.vy += Math.max(-0.22, this.pointer.vy * 0.005 * hit);
          }
          const breeze = Math.sin(t * 0.0011 + p.phase) * 0.34 + this.cur.x * 0.25 * this.musicIntensity;
          p.x += p.vx + breeze;
          p.y += clamp(p.vy * (0.65 + this.musicIntensity * 0.65), 0.15, 3.2);
          p.vy += ((0.52 + (p.phase % 0.8)) - p.vy) * 0.02;
          p.vx *= 0.965;
          p.rot = (p.rot || 0) + (p.rotSpeed || 0.012) + p.vx * 0.02;
          p.flip = (p.flip || 0) + (p.flipSpeed || 0.024);
          this.wrapX(p);
          if (p.y > h + 32) this.resetParticle(p, true);
          break;
        }
        case 'embers': {
          hit = this.pointerPush(p, 0.92, false);
          if (hit > 0.05 && active) {
            p.vx += this.pointer.vx * 0.018 * hit;
            p.vy -= Math.abs(this.pointer.vx + this.pointer.vy) * 0.005 * hit;
          }
          const curl = Math.sin(t * 0.002 + p.phase) * 0.42 + Math.cos(t * 0.0013 + p.phase * 1.7) * 0.18;
          p.x += p.vx + curl + this.cur.x * 0.22 * this.musicIntensity;
          p.y += p.vy * (0.70 + this.musicIntensity * 0.72);
          p.vy += (-(0.75 + (p.phase % 1.1)) - p.vy) * 0.018;
          p.vx *= 0.955;
          this.wrapX(p);
          if (p.y < -28) this.resetParticle(p, true);
          break;
        }
        case 'rain': {
          hit = this.pointerPush(p, 0.55, false);
          p.vx += (this.pointer.vx * 0.0025) * (active ? 1 : 0);
          p.x += p.vx + Math.sin(t * 0.001 + p.phase) * 0.12;
          p.y += p.vy * (0.55 + this.intensity * 0.9);
          p.vx *= 0.97;
          this.wrapX(p);
          if (p.y > h + 40) this.resetParticle(p, true);
          break;
        }
        case 'wet': {
          hit = this.pointerPush(p, 0.20, true);
          if (p.tiny) {
            p.x += Math.sin(t * 0.0009 + p.wob) * 0.025;
            p.y += Math.cos(t * 0.0012 + p.wob) * 0.018;
          } else if (p.mode === 'cling') {
            p.x += Math.sin(t * 0.0006 + p.wob) * 0.05 + p.vx * 0.25;
            p.y += Math.cos(t * 0.0008 + p.wob) * 0.03;
            if (hit > 0.55 && Math.random() < 0.02) {
              p.mode = 'run';
              p.vy = 0.10 + Math.random() * 0.10;
              p.stickY = null;
              p.willStick = false;
            }
          } else {
            p.vy = Math.min(1.0, p.vy + 0.0028);
            p.x += Math.sin(t * 0.0011 + p.wob) * 0.08 + p.vx * 0.4;
            p.y += p.vy * (0.45 + this.intensity * 0.9);
            if (p.willStick && p.stickY != null && p.y >= p.stickY) {
              p.mode = 'cling';
              p.vy = 0;
              p.stickY = null;
              p.willStick = false;
            }
          }
          p.vx *= 0.95;
          this.wrapX(p);
          if (p.y > h + 22) this.resetParticle(p, true);
          break;
        }
        case 'snow': {
          hit = this.pointerPush(p, 0.42, false);
          p.x += p.vx + Math.sin(t * 0.0012 + p.phase) * 0.42;
          p.y += p.vy * (0.45 + this.intensity * 0.8);
          p.vx *= 0.985;
          this.wrapX(p);
          if (p.y > h + 24) this.resetParticle(p, true);
          break;
        }
        case 'keys': {
          hit = this.pointerPush(p, 0.52, false);
          p.x += p.vx + Math.sin(t * 0.0009 + p.phase) * 0.24;
          p.y += p.vy * (0.55 + this.intensity * 0.65);
          p.vx *= 0.97;
          p.rot = (p.rot || 0) + (p.rotSpeed || 0.002);
          this.wrapX(p);
          if (p.y < -48) this.resetParticle(p, true);
          break;
        }
        case 'drizzle': {
          /* cada partícula é uma gota que cai até a superfície do lago;
             ao tocar a água, nasce uma frente de ondas concêntricas. */
          p.x += p.vx + Math.sin(t * 0.0004 + p.phase) * 0.03;
          p.y += p.vy * (0.70 + this.intensity * 0.60);
          this.wrapX(p);
          if (p.impactY == null) p.impactY = h * (0.12 + Math.random() * 0.80);
          if (p.y >= p.impactY) {
            if (Math.random() < 0.72) {
              this.addRipple(p.x, p.impactY, 'drop', 0.55 + Math.random() * 0.45);
            }
            this.resetParticle(p, true);
          }
          break;
        }
        default: { /* dust */
          const t2 = t * p.speed;
          const amp = 5 + p.r * 2.2;
          const tx = p.ax + Math.cos(t2 + p.phase) * amp + Math.sin(t2 * 0.7 + p.phase) * amp * 0.4;
          const ty = p.ay + Math.sin(t2 + p.phase * 1.3) * amp + Math.cos(t2 * 0.8 + p.phase) * amp * 0.4;
          p.vx += (tx - p.x) * 0.0032;
          p.vy += (ty - p.y) * 0.0032;
          hit = this.pointerPush(p, 0.55, false);
          p.vx *= 0.94; p.vy *= 0.94;
          const sp = Math.hypot(p.vx, p.vy);
          if (sp > 1.4) { p.vx = p.vx / sp * 1.4; p.vy = p.vy / sp * 1.4; }
          p.x += p.vx; p.y += p.vy;
          if (p.x < -20) { p.x = w + 20; p.ax = p.x; }
          if (p.x > w + 20) { p.x = -20; p.ax = p.x; }
          if (p.y < -20) { p.y = h + 20; p.ay = p.y; }
          if (p.y > h + 20) { p.y = -20; p.ay = p.y; }
        }
      }
      p.hit += (hit - p.hit) * 0.12;
    });

    if (this.typedKeys.length) {
      this.typedKeys = this.typedKeys.filter(tk => {
        const hit = this.pointerPush(tk, 0.72, false);
        tk.hit += (hit - tk.hit) * 0.14;
        tk.age += 16;
        tk.x += tk.vx + Math.sin(t * 0.0018 + tk.phase) * 0.35;
        tk.y += tk.vy * (0.85 + this.intensity * 0.55);
        tk.vx *= 0.97;
        tk.rot += tk.rotSpeed;
        if (tk.y < h * 0.22) tk.a *= 0.95;
        return tk.y > -64 && tk.a > 0.03;
      });
    }

    // Limpa ondulações que já propagaram além do limite ou terminaram o fade
    const now = performance.now();
    this.ripples = this.ripples.filter(rip => {
      if (rip.fade != null && rip.fade <= 0.02) return false;
      const age = now - rip.birth;
      const curR = age * rip.speed;
      return curR < rip.maxRadius + rip.wavelength * rip.crests;
    });
  },

  /* ondas concêntricas surgindo sozinhas em pontos aleatórios da tela */
  stepAmbientRipples(w, h) {
    this.ambientClock += 16;
    const slow = this.level === 'reduced' ? 1.7 : 1;
    const interval = (1760 - this.pAmount * 1020) * slow;
    if (this.ambientClock >= interval && this.ripples.length < 5 + Math.round(this.pAmount * 11)) {
      this.ambientClock = 0;
      const x = 40 + Math.random() * Math.max(1, w - 80);
      const y = 40 + Math.random() * Math.max(1, h - 80);
      this.addRipple(x, y, 'ambient', 0.65 + Math.random() * 0.5);
      // de vez em quando duas gotas caem quase juntas
      if (Math.random() < 0.21) {
        this.addRipple(
          clamp(x + (Math.random() - 0.5) * 220, 20, w - 20),
          clamp(y + (Math.random() - 0.5) * 180, 20, h - 20),
          'ambient', 0.4 + Math.random() * 0.35
        );
      }
    }

    const now = performance.now();
    this.ripples = this.ripples.filter(rip => {
      if (rip.fade != null && rip.fade <= 0.02) return false;
      return (now - rip.birth) * rip.speed < rip.maxRadius + rip.wavelength * rip.crests;
    });
  },

  drawParticles() {
    const ctx = this.pctx;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.lineCap = 'round';

    // Ondas de propagação na superfície (também renderiza ondas residuais ao trocar de estilo)
    if (this.ripples.length > 0) {
      this.drawRipples();
    }

    if (this.dyingParticles.length) {
      const ds = this.dyingStyle;
      this.dyingParticles.forEach(p => {
        const f = clamp(p.fade == null ? 1 : p.fade, 0, 1);
        if (ds === 'petals') {
          const squash = 0.36 + 0.64 * Math.abs(Math.cos(p.flip || 0));
          const pw = p.r * 1.15;
          const ph = p.r * 0.62 * squash;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot || 0);
          ctx.globalAlpha = clamp(p.a, 0.12, 0.92) * f;
          ctx.fillStyle = p.c === 1 ? '#f4a5b8' : '#fce7ef';
          ctx.beginPath();
          ctx.moveTo(-pw, 0);
          ctx.quadraticCurveTo(-pw * 0.2, -ph * 1.35, pw, 0);
          ctx.quadraticCurveTo(-pw * 0.1, ph * 1.25, -pw, 0);
          ctx.fill();
          ctx.restore();
        } else if (ds === 'embers') {
          const colD = p.c === 1 ? '#f59e0b' : '#ef4444';
          const flick = 0.62 + 0.38 * Math.sin(this.time * (p.flicker || 0.005) + p.phase);
          const alpha = clamp(p.a * flick, 0.08, 1) * f;
          ctx.shadowBlur = 8 * f;
          ctx.shadowColor = colD;
          ctx.globalAlpha = alpha * 0.45;
          ctx.fillStyle = colD;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 1.85, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    if (!this.pOn || !this.effectivePStyle) {
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      return;
    }

    const style = this.effectivePStyle || this.pStyle;
    this.particles.forEach(p => {
      const col = p.c === 1 ? this.accent : this.accent2;
      const watery = style === 'wet' || style === 'drizzle';
      const glow = p.hit;
      ctx.shadowBlur = glow > 0.02 ? (watery ? 8 : 16) * glow : 0;
      ctx.shadowColor = watery ? 'rgba(205,228,255,1)' : col;

      switch (style) {
        case 'petals': {
          const squash = 0.36 + 0.64 * Math.abs(Math.cos(p.flip || 0));
          const pw = p.r * 1.15;
          const ph = p.r * 0.62 * squash;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot || 0);
          ctx.globalAlpha = clamp(p.a + glow * 0.32, 0.12, 0.92);
          ctx.fillStyle = p.c === 1 ? this.accent : '#fce7ef';
          ctx.beginPath();
          ctx.moveTo(-pw, 0);
          ctx.quadraticCurveTo(-pw * 0.2, -ph * 1.35, pw, 0);
          ctx.quadraticCurveTo(-pw * 0.1, ph * 1.25, -pw, 0);
          ctx.fill();
          ctx.globalAlpha *= 0.45;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 0.65;
          ctx.stroke();
          ctx.restore();
          break;
        }
        case 'embers': {
          const flick = 0.62 + 0.38 * Math.sin(this.time * (p.flicker || 0.005) + p.phase);
          const alpha = clamp(p.a * flick + glow * 0.38, 0.08, 1);
          const rad = p.r * (1 + glow * 0.65);
          ctx.shadowBlur = 8 + glow * 14;
          ctx.shadowColor = col;
          ctx.globalAlpha = alpha * 0.48;
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(p.x, p.y, rad * 1.85, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = glow > 0.25 ? '#fff7e6' : col;
          ctx.beginPath();
          ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'rain': {
          ctx.globalAlpha = Math.min(1, p.a + glow * 0.45);
          ctx.strokeStyle = col;
          ctx.lineWidth = p.r;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 1.6, p.y - p.len);
          ctx.stroke();
          break;
        }
        case 'wet': {
          const stretch = 1 + Math.min(0.30, p.vy * 0.35);
          const rx = p.r * 0.84;
          const ry = p.r * stretch;

          if (p.tiny) {
            ctx.globalAlpha = 0.16 + p.a * 0.28 + glow * 0.15;
            ctx.fillStyle = 'rgba(205,226,250,1)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 0.34 + glow * 0.25;
            ctx.fillStyle = 'rgba(255,255,255,1)';
            ctx.beginPath();
            ctx.arc(p.x - p.r * 0.26, p.y - p.r * 0.26, Math.max(0.3, p.r * 0.34), 0, Math.PI * 2);
            ctx.fill();
            break;
          }

          /* rastro fino de água escorrendo */
          if (p.mode === 'run' && p.vy > 0.06) {
            const len = 8 + p.vy * 34;
            ctx.globalAlpha = 0.06 + p.vy * 0.10;
            ctx.strokeStyle = 'rgba(196,220,248,1)';
            ctx.lineWidth = Math.max(0.8, p.r * 0.34);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y - ry - len);
            ctx.lineTo(p.x, p.y - ry * 0.7);
            ctx.stroke();
          }

          /* corpo da gota sobre o vidro */
          ctx.globalAlpha = 0.10 + p.a * 0.16 + glow * 0.06;
          ctx.fillStyle = 'rgba(186,212,240,1)';
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, rx, ry, 0, 0, Math.PI * 2);
          ctx.fill();

          /* sombra interna na base da gota */
          ctx.globalAlpha = 0.16 + glow * 0.06;
          ctx.strokeStyle = 'rgba(8,14,24,1)';
          ctx.lineWidth = Math.max(0.8, p.r * 0.20);
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, rx * 0.92, ry * 0.92, 0, Math.PI * 0.12, Math.PI * 0.88);
          ctx.stroke();

          /* borda iluminada do vidro */
          ctx.globalAlpha = 0.24 + glow * 0.16;
          ctx.strokeStyle = 'rgba(232,244,255,1)';
          ctx.lineWidth = Math.max(0.6, p.r * 0.13);
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, rx, ry, 0, Math.PI * 1.06, Math.PI * 1.94);
          ctx.stroke();

          /* reflexo especular */
          ctx.globalAlpha = 0.42 + p.a * 0.25 + glow * 0.16;
          ctx.fillStyle = 'rgba(255,255,255,1)';
          ctx.beginPath();
          ctx.ellipse(p.x - rx * 0.30, p.y - ry * 0.34,
            Math.max(0.45, p.r * 0.16), Math.max(0.65, p.r * 0.24), -0.35, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'snow': {
          ctx.globalAlpha = Math.min(1, p.a + glow * 0.5);
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * (1 + glow * 0.5), 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'keys': {
          this.drawKeycap(ctx, p, col, false);
          break;
        }
        case 'drizzle': {
          /* microgotas caindo até a superfície; a onda nasce no impacto */
          ctx.globalAlpha = p.a;
          ctx.strokeStyle = 'rgba(198,224,255,1)';
          ctx.lineWidth = p.r;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - p.len);
          ctx.lineTo(p.x - p.vx * 0.5, p.y);
          ctx.stroke();

          ctx.globalAlpha = Math.min(0.75, p.a * 1.8);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.45, p.r * 0.8), 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        default: {
          ctx.globalAlpha = Math.min(1, p.a + glow * 0.5);
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * (1 + glow * 0.7), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    if (this.typedKeys.length) {
      this.typedKeys.forEach(tk => {
        const col = tk.c === 1 ? this.accent : this.accent2;
        this.drawKeycap(ctx, tk, col, true);
      });
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  },

  drawKeycap(ctx, p, col, isTyped) {
    const s = p.size || 24;
    const w = s * (p.wide || 1);
    const h = s;
    const glow = p.hit || 0;
    const popScale = isTyped ? Math.min(1, 0.72 + ((p.age || 0) / 140) * 0.28) : 1;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot || 0);
    if (popScale !== 1) ctx.scale(popScale, popScale);

    if (isTyped) {
      // Teclas clicadas pelo usuário: corpo preenchido com brilho luminoso, face dupla e legenda nítida
      ctx.shadowBlur = 16 + glow * 10;
      ctx.shadowColor = col;
      ctx.globalAlpha = clamp(p.a, 0.05, 0.96);

      // Base/saia 3D mais escura
      keyRoundedRect(ctx, -w / 2, -h / 2 + 2.5, w, h, 7);
      ctx.fillStyle = 'rgba(8, 10, 18, 0.72)';
      ctx.fill();

      // Corpo da tecla preenchido com a cor de destaque
      keyRoundedRect(ctx, -w / 2, -h / 2, w, h, 7);
      ctx.fillStyle = col;
      ctx.globalAlpha = clamp(p.a * 0.30, 0.05, 0.36);
      ctx.fill();
      ctx.globalAlpha = clamp(p.a, 0.05, 0.96);
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.65;
      ctx.stroke();

      // Topo luminoso da tecla
      keyRoundedRect(ctx, -w / 2 + 3.2, -h / 2 + 2.5, w - 6.4, h - 6.4, 4.5);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Legenda nítida da tecla pressionada
      if (p.label) {
        const fs = p.label.length > 2 ? Math.max(8, h * 0.28) : Math.max(10, h * 0.44);
        ctx.font = '700 ' + fs.toFixed(1) + 'px "JetBrains Mono", "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(p.label, 0, -0.5);
      }
    } else {
      // Teclas ambientes: contorno translúcido minimalista e discreto
      ctx.shadowBlur = glow > 0.02 ? 12 * glow : 0;
      ctx.shadowColor = col;
      ctx.globalAlpha = clamp(p.a + glow * 0.25, 0.08, 0.58);

      // Saia inferior sutil
      keyRoundedRect(ctx, -w / 2, -h / 2 + 2.5, w, h, 5.5);
      ctx.strokeStyle = col;
      ctx.lineWidth = 0.85;
      ctx.globalAlpha *= 0.45;
      ctx.stroke();

      // Contorno principal
      ctx.globalAlpha = clamp(p.a + glow * 0.25, 0.08, 0.58);
      keyRoundedRect(ctx, -w / 2, -h / 2, w, h, 5.5);
      ctx.fillStyle = col;
      ctx.globalAlpha *= 0.14;
      ctx.fill();
      ctx.globalAlpha = clamp(p.a + glow * 0.25, 0.08, 0.58);
      ctx.lineWidth = 1.1;
      ctx.stroke();

      if (p.label) {
        const fs = Math.max(8, h * 0.38);
        ctx.font = '500 ' + fs.toFixed(1) + 'px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = col;
        ctx.globalAlpha *= 0.72;
        ctx.fillText(p.label, 0, -0.5);
      }
    }

    ctx.restore();
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { resolveMusicVisualState, formatKeycapLabel, buildMarchWireGroup, MOTION_MODES, PARTICLE_STYLES };
}
