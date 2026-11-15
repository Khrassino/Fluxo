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
  { id: 'snow',  label: 'Neve' }
];

/* estilos antigos migram para os equivalentes novos.
   Chuva = gotas caindo; Onda = ondas circulares num lago (efeitos separados).
   Atenção: "rain" NUNCA entra aqui — a conversão única do antigo rain (ondas) → waves
   é feita em Store.load() com a marca meta.fxStyleV, para o usuário poder escolher Chuva depois. */
const PARTICLE_ALIASES = { water: 'wet', bubbles: 'waves', lake: 'waves', ripples: 'waves', drizzle: 'rain' };

const Motion = {
  /* movimento do fundo */
  on: true,
  mode: 'depth',
  intensity: 0.55,
  smoothK: 0.08,

  /* partículas */
  pOn: true,
  pStyle: 'dust',
  pAmount: 0.55,
  pInteractive: true,

  /* nível global de efeitos: full | reduced | off */
  level: 'full',
  suspended: false,
  ambientClock: 0,

  cur: { x: 0, y: 0 },
  tgt: { x: 0, y: 0 },

  canvas: null,
  pctx: null,
  particles: [],
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
    this.pctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());

    document.addEventListener('pointermove', (e) => {
      this.tgt.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.tgt.y = (e.clientY / window.innerHeight) * 2 - 1;
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

    this.readState(true);
    this.loop();
  },

  readState(force) {
    const m = Store.state.motion || {};
    const p = Store.state.particles || {};
    const fx = Store.state.effects || {};
    const prevStyle = this.pStyle;
    const prevAmount = this.pAmount;

    this.level = ['full', 'reduced', 'off'].includes(fx.level) ? fx.level : 'full';
    const soft = this.level === 'reduced' ? 0.45 : 1;

    this.on = !!m.enabled && this.level !== 'off';
    this.mode = MOTION_MODES.some(x => x.id === m.mode) ? m.mode : 'depth';
    this.intensity = clamp((Number(m.intensity) || 0) / 100, 0, 1) * soft;
    this.smoothK = 0.02 + (clamp(Number(m.smoothness) || 0, 0, 100) / 100) * 0.13;
    m.mode = this.mode; // normaliza estados antigos

    this.pOn = p.enabled !== false && this.level !== 'off';
    const wanted = PARTICLE_ALIASES[p.style] || p.style;
    this.pStyle = PARTICLE_STYLES.some(x => x.id === wanted) ? wanted : 'dust';
    this.pAmount = clamp((p.amount == null ? 55 : Number(p.amount)) / 100, 0, 1) * soft;
    this.pInteractive = p.interactive !== false && this.level !== 'off';
    p.style = this.pStyle;

    this.syncColors();
    if (force || prevStyle !== this.pStyle || prevAmount !== this.pAmount) this.spawnParticles();
  },

  /* pausa tudo enquanto a Área de Trabalho está aberta */
  setSuspended(on) {
    on = !!on;
    if (this.suspended === on) return;
    this.suspended = on;
    this.pointer.active = false;
    this.ripples = [];
    if (this.canvas && this.pctx) this.pctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const wp = $('#wallpaper');
    const glow = $('#glow-layer');
    if (wp) wp.style.transform = 'none';
    if (glow) glow.style.transform = 'translate(-50%, -50%)';
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
    /* Onda é feita apenas de ondulações ambientes — nenhuma partícula cai */
    if (this.pStyle === 'waves') { this.particles = []; this.ripples = []; return; }
    const w = window.innerWidth, h = window.innerHeight;
    const base = clamp(Math.round((w * h) / 19000), 24, 88);
    const factor = this.pStyle === 'wet' ? 1.0 : 1;
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
    p.c = Math.random() > 0.5 ? 1 : 2;
    switch (this.pStyle) {
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
    // limpa campos que pertencem a outros estilos (evita estado residual)
    p.impactY = null;
    p.stickY = null;
    p.willStick = false;
    p.mode = null;
    p.tiny = false;
    switch (this.pStyle) {
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
    const glow = $('#glow-layer');
    const x = this.cur.x, y = this.cur.y, i = this.intensity;

    if (!this.on) {
      wp.style.transform = 'none';
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
    }

    if (this.pOn && this.pAmount > 0.01) {
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
    const active = this.pInteractive && this.pointer.active;
    const t = this.time;

    if (this.pStyle === 'waves') {
      this.stepAmbientRipples(w, h);
      return;
    }

    this.particles.forEach(p => {
      let hit = 0;
      switch (this.pStyle) {
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
    const interval = (2100 - this.pAmount * 1200) * slow;
    if (this.ambientClock >= interval && this.ripples.length < 4 + Math.round(this.pAmount * 10)) {
      this.ambientClock = 0;
      const x = 40 + Math.random() * Math.max(1, w - 80);
      const y = 40 + Math.random() * Math.max(1, h - 80);
      this.addRipple(x, y, 'ambient', 0.65 + Math.random() * 0.5);
      // de vez em quando duas gotas caem quase juntas
      if (Math.random() < 0.16) {
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

    this.particles.forEach(p => {
      const col = p.c === 1 ? this.accent : this.accent2;
      const watery = this.pStyle === 'wet' || this.pStyle === 'drizzle';
      const glow = p.hit;
      ctx.shadowBlur = glow > 0.02 ? (watery ? 8 : 16) * glow : 0;
      ctx.shadowColor = watery ? 'rgba(205,228,255,1)' : col;

      switch (this.pStyle) {
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

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
};
