'use strict';
/* ============ usage.js — rastreio de tempo de uso ============ */
const Usage = {
  dirty: false,

  start() {
    const st = Store.state;
    if (!st.meta.firstDay) { st.meta.firstDay = todayKey(); Store.save(); }

    setInterval(() => this.tick(), 5000);
    setInterval(() => this.flush(), 30000);

    const saveHook = () => this.flush();
    document.addEventListener('visibilitychange', saveHook);
    window.addEventListener('beforeunload', saveHook);
    window.addEventListener('pagehide', saveHook);

    this.tick();
  },

  tick() {
    if (document.hidden) return;
    // Aba visível sem interação não conta como uso (evita inflar as horas)
    const last = (typeof Idle !== 'undefined') ? Idle.last : 0;
    if (!last || Date.now() - last > 7000) return;
    const t = todayKey();
    const tr = Store.state.tracker;
    tr.usageByDay[t] = (tr.usageByDay[t] || 0) + 5;
    this.dirty = true;
    if (typeof TrackerPage !== 'undefined') TrackerPage.softRefresh();
  },

  flush() {
    if (!this.dirty) return;
    this.dirty = false;
    Store.save();
  },

  daysUsed() {
    return Object.keys(Store.state.tracker.usageByDay).filter(k => Store.state.tracker.usageByDay[k] > 0).length;
  },

  totalSeconds() {
    const u = Store.state.tracker.usageByDay;
    return Object.keys(u).reduce((s, k) => s + u[k], 0);
  },

  todaySeconds() {
    return Store.state.tracker.usageByDay[todayKey()] || 0;
  },

  streak() {
    const u = Store.state.tracker.usageByDay;
    const d = new Date();
    let n = 0;
    for (;;) {
      const k = todayKey(d);
      if ((u[k] || 0) > 0) { n++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return n;
  }
};
