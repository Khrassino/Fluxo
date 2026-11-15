'use strict';
/* ============ idle.js — modo calmo após inatividade ============ */
const Idle = {
  timer: null,
  timeoutMs: 60000,
  last: 0,
  enabled: true,

  init() {
    this.readState();
    const wake = () => this.wake();
    ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(evt => {
      document.addEventListener(evt, wake, { passive: true });
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.disarm();
      else this.arm();
    });
    this.arm();
  },

  readState() {
    const cfg = Store.state.idle || { timeout: 60 };
    this.timeoutMs = Math.max(0, Number(cfg.timeout) || 0) * 1000;
    this.enabled = this.timeoutMs > 0;
  },

  apply() {
    this.readState();
    document.body.classList.remove('idle');
    this.last = Date.now();
    this.arm();
  },

  arm() {
    clearTimeout(this.timer);
    this.timer = null;
    if (!this.enabled) {
      document.body.classList.remove('idle');
      return;
    }
    this.timer = setTimeout(() => this.sleep(), this.timeoutMs);
  },

  disarm() {
    clearTimeout(this.timer);
    this.timer = null;
  },

  sleep() {
    if (!this.enabled) return;
    if (document.hidden ||
        document.body.classList.contains('panel-open') ||
        document.body.classList.contains('layout-editing')) {
      this.arm();
      return;
    }
    document.body.classList.add('idle');
  },

  wake() {
    const now = Date.now();
    if (document.body.classList.contains('idle')) document.body.classList.remove('idle');
    // evita reiniciar o temporizador dezenas de vezes por segundo
    if (now - this.last < 180) return;
    this.last = now;
    this.arm();
  }
};
