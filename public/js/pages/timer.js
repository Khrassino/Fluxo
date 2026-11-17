'use strict';
/* ============ pages/timer.js — cronômetro / temporizador ============ */
const TIMER_PRESETS = [
  { id: 'focus',  label: 'Foco' },
  { id: 'short',  label: 'Pausa' },
  { id: 'long',   label: 'Descanso' },
  { id: 'custom', label: 'Personalizado' }
];

function timerHexToRgba(hex, alpha) {
  if (!hex || hex.charAt(0) !== '#') return hex;
  let h = hex.slice(1);
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (h.length !== 6) return hex;
  const n = parseInt(h, 16);
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
}

const TimerPage = {
  RING_C: 2 * Math.PI * 88, // circunferência do anel
  chars: [],
  lastText: '',

  init() {
    // aplica configurações visuais salvas
    this.applyConfig();

    // tabs
    $$('#page-timer .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Store.state.timer.tab = btn.dataset.tab;
        this.resetRuntime();
        Store.save();
        this.syncUI();
      });
    });

    // presets
    const box = $('#timer-presets');
    TIMER_PRESETS.forEach(p => {
      const b = el('button', 'preset-btn', '<span></span>');
      b.dataset.preset = p.id;
      b.addEventListener('click', () => {
        Store.state.timer.preset = p.id;
        this.resetRuntime();
        Store.save();
        this.syncUI();
      });
      box.append(b);
    });

    // controles
    $('#timer-toggle').addEventListener('click', () => this.startPause());
    $('#timer-reset').addEventListener('click', () => { this.resetRuntime(); Store.save(); this.syncUI(); });
    $('#timer-skip').addEventListener('click', () => this.skip());

    // teclado
    document.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return;
      if (Router.route !== 'timer') return;
      if (e.code === 'Space' || e.code === 'KeyS') {
        e.preventDefault();
        this.startPause();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        this.resetRuntime();
        Store.save();
        this.syncUI();
      }
    });

    // ícones dos botões
    $('#timer-reset').innerHTML = svgIcon('reset');
    $('#timer-skip').innerHTML = svgIcon('skip');

    // anel
    $('#ring-progress').style.strokeDasharray = this.RING_C;

    // halo de ações da versão minimalista
    this.initHalo();

    // restaura exibição e mantém o tique global
    this.applyIdleConfig();
    this.syncUI();
    setInterval(() => this.tick(), 250);
  },

  /* -------- configuração visual -------- */
  applyConfig() {
    const t = Store.state.timer;
    const root = document.documentElement.style;
    const f = FONTS.find(x => x.id === t.font) || FONTS[0];
    if (typeof Themes !== 'undefined') Themes.ensureFonts([f.id]);
    const tint = t.tint || '';

    root.setProperty('--timer-font', f.family);
    root.setProperty('--timer-size', t.size);
    root.setProperty('--timer-weight', t.weight || 400);
    root.setProperty('--timer-tracking', ((t.tracking || 0) / 100).toFixed(2) + 'em');
    root.setProperty('--timer-ring-width', t.ringWidth || 5);
    root.setProperty('--timer-color', tint || 'var(--text)');
    root.setProperty('--timer-ring-color', tint || 'var(--accent)');
    root.setProperty('--timer-glow-color', tint ? timerHexToRgba(tint, .55) : 'var(--accent-glow)');

    const glow = clamp((t.glow || 0) / 100, 0, 1);
    root.setProperty('--timer-glow-1', (glow * 12).toFixed(1) + 'px');
    root.setProperty('--timer-glow-2', (glow * 30).toFixed(1) + 'px');
    root.setProperty('--dim-opacity', (t.dim / 100).toFixed(2));

    document.body.dataset.blur = t.blur ? 'on' : 'off';
    document.body.dataset.timerTab = t.tab;
    document.body.dataset.timerRing = t.ring ? 'on' : 'off';
    document.body.dataset.timerRingStyle = t.ringStyle || 'solid';
    document.body.dataset.timerGlow = (t.effectGlow && (t.glow || 0) > 0) ? 'on' : 'off';
    document.body.dataset.timerShadow = t.effectShadow ? 'on' : 'off';
    document.body.dataset.timerOutline = t.effectOutline ? 'on' : 'off';
    document.body.dataset.timerPulse = t.effectPulse ? 'on' : 'off';
    document.body.dataset.timerBackdrop = t.backdrop || 'none';
    document.body.dataset.timerDigit = t.digitAnim || 'none';
    document.body.dataset.timerBlink = t.blink ? 'on' : 'off';
    document.body.dataset.timerLabel = t.label ? 'on' : 'off';
    document.body.dataset.timerRunning = t.running ? 'on' : 'off';
    document.body.dataset.timerView = t.view || 'classic';
    this.applyIdleConfig();
  },

  /* -------- o que permanece visível durante a inatividade -------- */
  applyIdleConfig() {
    const cfg = (Store.state.timer && Store.state.timer.idle) || {};
    const map = {
      label: '.timer-label',
      ring: '.ring',
      tabs: '.timer-tabs',
      presets: '.timer-presets',
      sessions: '.timer-sessions',
      controls: '.timer-controls',
      hint: '.timer-hint'
    };
    Object.keys(map).forEach(key => {
      const node = $('#page-timer ' + map[key]);
      if (node) node.classList.toggle('idle-hide', !cfg[key]);
    });
  },

  /* -------- halo radial da versão minimalista -------- */
  HALO_ACTIONS: [
    { id: 'toggle', dir: 'up',    icon: 'play',  label: 'Iniciar' },
    { id: 'reset',  dir: 'right', icon: 'reset', label: 'Reiniciar' },
    { id: 'preset', dir: 'down',  icon: 'timer', label: 'Preset' },
    { id: 'mode',   dir: 'left',  icon: 'skip',  label: 'Modo' }
  ],
  HALO_DIRS: {
    up: 'toggle', right: 'reset', down: 'preset', left: 'mode'
  },

  presetLabel(id) {
    const def = TIMER_PRESETS.find(p => p.id === id);
    return tr('timer.preset.' + id, def ? def.label : id);
  },

  refreshHaloLabels() {
    this.HALO_ACTIONS.forEach(a => {
      const lbl = $('#timer-halo .halo-act[data-action="' + a.id + '"] .halo-label');
      if (lbl) lbl.textContent = tr('timer.halo.' + a.id, a.label);
    });
    this.updateHalo();
  },

  initHalo() {
    const halo = $('#timer-halo');
    const stage = $('#page-timer .timer-stage');
    if (!halo || !stage) return;

    halo.innerHTML = '';
    this.HALO_ACTIONS.forEach(a => {
      const node = el('div', 'halo-act');
      node.dataset.action = a.id;
      node.dataset.dir = a.dir;
      node.innerHTML =
        '<span class="halo-icon">' + svgIcon(a.icon) + '</span>' +
        '<span class="halo-label">' + tr('timer.halo.' + a.id, a.label) + '</span>';
      halo.append(node);
    });

    let origin = null;
    let active = null;

    const setActive = (action) => {
      active = action;
      $$('#timer-halo .halo-act').forEach(n => n.classList.toggle('active', n.dataset.action === action));
    };

    const actionFor = (dx, dy) => {
      if (Math.hypot(dx, dy) < 24) return null;
      const ang = Math.atan2(dy, dx) * 180 / Math.PI;
      const dirs = [
        { dir: 'right', a: 0 },
        { dir: 'down',  a: 90 },
        { dir: 'left',  a: 180 },
        { dir: 'up',    a: -90 }
      ];
      let best = null, diff = Infinity;
      dirs.forEach(d => {
        const dd = Math.abs(((ang - d.a + 540) % 360) - 180);
        if (dd < diff) { diff = dd; best = d.dir; }
      });
      return this.HALO_DIRS[best] || null;
    };

    const onMove = (e) => {
      if (!origin) return;
      setActive(actionFor(e.clientX - origin.x, e.clientY - origin.y));
    };

    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      const action = active;
      origin = null;
      this.hideHalo();
      if (action) this.haloAction(action);
    };

    stage.addEventListener('pointerdown', (e) => {
      if ((Store.state.timer.view || 'classic') !== 'focus') return;
      if (Router.route !== 'timer') return;
      if (e.button != null && e.button !== 0) return;
      e.preventDefault();
      const rect = stage.getBoundingClientRect();
      origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      setActive(null);
      this.showHalo();
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onUp);
    });
  },

  showHalo() {
    document.body.classList.add('halo-open');
    this.updateHalo();
  },

  hideHalo() {
    document.body.classList.remove('halo-open');
    $$('#timer-halo .halo-act').forEach(n => n.classList.remove('active'));
  },

  updateHalo() {
    const node = $('#timer-halo .halo-act[data-action="toggle"]');
    if (!node) return;
    const running = Store.state.timer.running;
    node.innerHTML =
      '<span class="halo-icon">' + svgIcon(running ? 'pause' : 'play') + '</span>' +
      '<span class="halo-label">' + (running ? tr('timer.pause', 'Pausar') : tr('timer.start', 'Iniciar')) + '</span>';
  },

  haloAction(action) {
    const t = Store.state.timer;
    if (action === 'toggle') {
      this.startPause();
    } else if (action === 'reset') {
      this.resetRuntime();
      Store.save();
      this.syncUI();
    } else if (action === 'preset') {
      const order = TIMER_PRESETS.map(p => p.id);
      const at = Math.max(0, order.indexOf(t.preset));
      t.preset = order[(at + 1) % order.length];
      this.resetRuntime();
      Store.save();
      this.syncUI();
    } else if (action === 'mode') {
      t.tab = t.tab === 'countdown' ? 'stopwatch' : 'countdown';
      this.resetRuntime();
      Store.save();
      this.syncUI();
    }
  },

  /* -------- cálculo de tempo -------- */
  presetTotal() {
    const t = Store.state.timer;
    const mins = t.durations[t.preset] || 25;
    return Math.max(1, Math.round(mins)) * 60;
  },

  remainingNow() {
    const t = Store.state.timer;
    if (t.tab !== 'countdown') return 0;
    if (t.running && t.endsAt) return Math.max(0, (t.endsAt - Date.now()) / 1000);
    return t.remaining != null ? t.remaining : this.presetTotal();
  },

  elapsedNow() {
    const t = Store.state.timer;
    if (t.tab !== 'stopwatch') return 0;
    if (t.running && t.startedAt) return t.baseElapsed + (Date.now() - t.startedAt) / 1000;
    return t.baseElapsed || 0;
  },

  /* -------- ações -------- */
  startPause() {
    const t = Store.state.timer;
    if (t.tab === 'countdown') {
      if (t.running) {
        t.remaining = this.remainingNow();
        t.running = false;
        t.endsAt = null;
      } else {
        let rem = t.remaining != null ? t.remaining : this.presetTotal();
        if (rem <= 0) { this.resetRuntime(); rem = this.presetTotal(); }
        t.endsAt = Date.now() + rem * 1000;
        t.running = true;
      }
    } else {
      if (t.running) {
        t.baseElapsed = this.elapsedNow();
        t.running = false;
        t.startedAt = null;
      } else {
        t.startedAt = Date.now();
        t.running = true;
      }
    }
    Store.save();
    this.syncUI();
  },

  quickFocus() {
    const t = Store.state.timer;
    if (t.tab === 'countdown' && t.running) {
      if (Router.route !== 'timer') location.hash = '#/tempo';
      return;
    }
    t.tab = 'countdown';
    t.preset = 'focus';
    this.resetRuntime();
    t.endsAt = Date.now() + this.presetTotal() * 1000;
    t.running = true;
    Store.save();
    this.syncUI();
    if (Router.route !== 'timer') location.hash = '#/tempo';
  },

  resetRuntime() {
    const t = Store.state.timer;
    t.running = false;
    t.endsAt = null;
    t.startedAt = null;
    if (t.tab === 'countdown') t.remaining = null;
    else t.baseElapsed = 0;
  },

  skip() {
    const t = Store.state.timer;
    if (t.tab === 'countdown' && t.running) {
      this.finish(false); // pular não conta como sessão concluída
    } else {
      this.resetRuntime();
      Store.save();
      this.syncUI();
    }
  },

  finish(counted) {
    const t = Store.state.timer;
    const wasPreset = t.preset;
    this.resetRuntime();

    if (counted) {
      const day = todayKey();
      const tr = Store.state.tracker;
      tr.focusByDay[day] = (tr.focusByDay[day] || 0) + 1;
      if (t.sound) Sound.chime();
      this.flashTitle();
      const wasLbl = this.presetLabel(wasPreset).toLowerCase();
      toast(tr('timer.finishedToast', 'Tempo de ' + wasLbl + ' concluído!', { label: wasLbl }), 'target');

      if (t.autoCycle && t.tab === 'countdown') {
        if (wasPreset === 'focus') {
          t.cycleCount = (t.cycleCount || 0) + 1;
          t.preset = (t.cycleCount % Math.max(2, t.cycle)) === 0 ? 'long' : 'short';
        } else {
          t.preset = 'focus';
        }
        const nextLbl = this.presetLabel(t.preset);
        toast(tr('timer.nextToast', 'Próximo: ' + nextLbl + ' · ' + t.durations[t.preset] + 'min', { label: nextLbl, m: t.durations[t.preset] }), 'timer');
      } else {
        t.remaining = 0;
      }
    }

    Store.save();
    this.syncUI();
  },

  flashTitle() {
    clearInterval(this.titleIv);
    let n = 0;
    this.titleIv = setInterval(() => {
      document.title = (n % 2 ? '⏰ ' : '') + tr('timer.finishedTitle', 'Tempo concluído!');
      if (++n > 7) {
        clearInterval(this.titleIv);
        this.titleIv = null;
        document.title = tr('title.' + Router.route, Router.route === 'home' ? 'Fluxo' : Router.routeLabel(Router.route) + ' · Fluxo');
      }
    }, 700);
  },

  /* -------- tique global (detecta fim mesmo fora da página) -------- */
  tick() {
    const t = Store.state.timer;
    if (t.tab === 'countdown' && t.running && t.endsAt && Date.now() >= t.endsAt) {
      const lateMin = (Date.now() - t.endsAt) / 60000;
      this.finish(lateMin < 30); // não conta sessões encerradas há muito tempo
      return;
    }
    if (Router.route === 'timer') this.syncUI();
  },

  /* -------- exibição dígito a dígito (permite flip / piscar) -------- */
  renderTime(text) {
    const timeEl = $('#timer-time');
    const flip = (Store.state.timer.digitAnim === 'flip');

    if (timeEl.children.length !== text.length) {
      timeEl.innerHTML = '';
      this.chars = [];
      for (const ch of text) {
        const span = el('span', ch === ':' ? 't-colon' : 't-digit');
        span.textContent = ch;
        span.dataset.val = ch;
        timeEl.append(span);
        this.chars.push(span);
      }
    } else {
      for (let i = 0; i < text.length; i++) {
        const span = this.chars[i];
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
    this.lastText = text;
  },

  /* -------- interface -------- */
  syncUI() {
    const t = Store.state.timer;
    document.body.dataset.timerTab = t.tab;
    document.body.dataset.timerRunning = t.running ? 'on' : 'off';
    document.body.dataset.timerLabel = t.label ? 'on' : 'off';

    $$('#page-timer .tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === t.tab));
    $$('#timer-presets .preset-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.preset === t.preset);
      const p = TIMER_PRESETS.find(x => x.id === b.dataset.preset);
      b.textContent = this.presetLabel(p.id) + ' · ' + t.durations[p.id] + 'min';
    });

    // tempo exibido
    let text, progress;
    if (t.tab === 'countdown') {
      const rem = this.remainingNow();
      const total = this.presetTotal();
      text = fmtClock(rem);
      progress = clamp(rem / total, 0, 1);
      $('#timer-label').textContent = this.presetLabel(t.preset) +
        (t.running ? '' : (rem <= 0 && t.remaining === 0 ? tr('timer.doneSuffix', ' · concluído') : ''));
    } else {
      const elap = this.elapsedNow();
      text = fmtClock(elap);
      progress = ((elap % 3600) / 3600);
      $('#timer-label').textContent = tr('timer.elapsed', 'tempo decorrido');
    }
    this.renderTime(text);

    const ring = $('#ring-progress');
    ring.style.strokeDashoffset = (this.RING_C * (1 - progress)).toFixed(1);

    const btn = $('#timer-toggle');
    btn.innerHTML = (t.running ? svgIcon('pause') : svgIcon('play')) +
      '<span>' + (t.running ? tr('timer.pause', 'Pausar') : tr('timer.start', 'Iniciar')) + '</span>';

    // sessões de foco de hoje
    const today = todayKey();
    const focusToday = Store.state.tracker.focusByDay[today] || 0;
    const sessions = $('#timer-sessions');
    if (sessions) {
      if (focusToday === 0) {
        sessions.textContent = tr('timer.sessionsNone', 'nenhum foco hoje — comece quando quiser');
      } else {
        const countTxt = focusToday === 1
          ? tr('timer.sessionsOne', '1 foco hoje')
          : tr('timer.sessionsMany', focusToday + ' focos hoje', { n: focusToday });
        const cycleTxt = t.autoCycle
          ? tr('timer.sessionsCycle', ' · pausa longa a cada ' + t.cycle + ' focos', { n: t.cycle })
          : '';
        sessions.textContent = countTxt + cycleTxt;
      }
    }

    this.updateHalo();
  }
};
