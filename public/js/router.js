'use strict';
/* ============ router.js — navegação ============ */
const Router = {
  route: 'home',
  routes: ['home', 'timer', 'tracker', 'tasks', 'workspace'],
  labels: { home: 'Início', timer: 'Cronômetro', tracker: 'Progresso', tasks: 'Tarefas', workspace: 'Área de Trabalho' },
  icons:  { home: 'home', timer: 'timer', tracker: 'chart', tasks: 'tasks', workspace: 'board' },
  slugs:  { inicio: 'home', tempo: 'timer', progresso: 'tracker', tarefas: 'tasks', quadro: 'workspace', 'area-de-trabalho': 'workspace' },

  dockOpen: false,
  dockTimer: null,
  dockIdleMs: 10000,
  anchor: 'bc',
  anchors: ['bc', 'bl', 'br', 'ml', 'mr', 'tc', 'tl', 'tr'],
  dragging: false,
  hovering: false,
  hoverOpenTimer: null,
  hoverCloseTimer: null,
  suppressClick: false,
  molds: null,

  slugFor(route) {
    return Object.keys(this.slugs).find(s => this.slugs[s] === route) || 'inicio';
  },

  routeLabel(route) {
    const def = this.labels[route] || route;
    return tr('nav.' + route, def);
  },

  dockToggleTitle(open) {
    if (open) {
      return typeof getLang === 'function' && getLang() === 'en' ? 'Collapse navigation' : 'Recolher navegação';
    }
    const base = tr('nav.openMenu', 'Abrir navegação');
    const dragHint = typeof getLang === 'function' && getLang() === 'en' ? 'drag to move' : 'arraste para mover';
    return base + ' · ' + dragHint;
  },

  syncLanguage() {
    const toggle = $('#dock-toggle');
    if (toggle) {
      const title = this.dockToggleTitle(this.dockOpen);
      toggle.title = title;
      toggle.setAttribute('aria-label', this.dockOpen ? title : tr('nav.openMenu', 'Abrir navegação'));
    }
    $$('#dock .dock-btn[data-route]').forEach(b => {
      const lbl = this.routeLabel(b.dataset.route);
      b.title = lbl;
      b.setAttribute('aria-label', lbl);
    });
    const gear = $('#dock-settings');
    if (gear) {
      const lbl = tr('nav.customize', 'Personalizar');
      gear.title = lbl;
      gear.setAttribute('aria-label', lbl);
    }
    document.title = tr('title.' + this.route, this.route === 'home' ? 'Fluxo' : (this.routeLabel(this.route) + ' · Fluxo'));
  },

  init() {
    const dock = $('#dock');

    /* bolinha que expande a navegação */
    const toggle = el('button', 'dock-toggle', svgIcon('logo'));
    toggle.id = 'dock-toggle';
    toggle.title = this.dockToggleTitle(false);
    toggle.setAttribute('aria-label', tr('nav.openMenu', 'Abrir navegação'));
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.suppressClick) { this.suppressClick = false; return; }
      this.popBall();
      this.toggleDock();
    });
    dock.append(toggle);
    this.bindDrag(toggle);

    const items = el('div', 'dock-items');
    this.routes.forEach(r => {
      const b = el('button', 'dock-btn', svgIcon(this.icons[r]));
      b.dataset.route = r;
      const lbl = this.routeLabel(r);
      b.title = lbl;
      b.setAttribute('aria-label', lbl);
      b.addEventListener('click', () => { location.hash = '#/' + this.slugFor(r); });
      items.append(b);
    });
    items.append(el('div', 'dock-sep'));
    const gear = el('button', 'dock-btn', svgIcon('sliders'));
    gear.id = 'dock-settings';
    const gearLbl = tr('nav.customize', 'Personalizar');
    gear.title = gearLbl;
    gear.setAttribute('aria-label', gearLbl);
    gear.addEventListener('click', () => Panel.toggle());
    items.append(gear);
    dock.append(items);

    /* moldes transparentes das posições de encaixe */
    this.buildMolds();

    /* qualquer movimento do mouse mantém a navegação aberta */
    document.addEventListener('pointermove', () => {
      if (this.dockOpen && !this.dragging) this.armDock();
    }, { passive: true });
    dock.addEventListener('pointerdown', () => {
      if (this.dockOpen) this.armDock();
    });

    /* expandir ao passar o mouse (opcional, com pequeno atraso) */
    dock.addEventListener('pointerenter', (e) => {
      if (!this.hoverEnabled()) return;
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (this.dragging) return;
      this.hovering = true;
      clearTimeout(this.hoverCloseTimer);
      this.hoverCloseTimer = null;
      clearTimeout(this.dockTimer);
      this.dockTimer = null;
      if (!this.dockOpen && !this.hoverOpenTimer) {
        this.hoverOpenTimer = setTimeout(() => {
          this.hoverOpenTimer = null;
          if (this.hovering && !this.dragging && !this.dockOpen) this.toggleDock(true);
        }, 340);
      }
    });
    dock.addEventListener('pointerleave', (e) => {
      if (!this.hoverEnabled()) return;
      if (e.pointerType && e.pointerType !== 'mouse') return;
      this.hovering = false;
      clearTimeout(this.hoverOpenTimer);
      this.hoverOpenTimer = null;
      if (this.dragging) return;
      clearTimeout(this.hoverCloseTimer);
      this.hoverCloseTimer = setTimeout(() => {
        this.hoverCloseTimer = null;
        if (!this.hovering && this.dockOpen) this.toggleDock(false);
      }, 120);
    });

    /* posição salva */
    const saved = Store.state.dock && Store.state.dock.anchor;
    this.applyAnchor(this.anchors.includes(saved) ? saved : 'bc', false);

    window.addEventListener('resize', () => {
      if (this.dragging) return;
      if (typeof this.applyAnchor === 'function') this.applyAnchor(this.anchor, false);
      this.positionMolds();
    });
    window.addEventListener('hashchange', () => this.go());
    this.go();
  },

  /* -------- arrastar a bolinha -------- */
  bindDrag(toggle) {
    let start = null;

    const onMove = (e) => {
      if (!start) return;
      if (!this.dragging) {
        if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < 7) return;
        this.beginDrag(start, toggle);
      }
      this.moveDrag(e);
    };

    const onUp = (e) => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      toggle.classList.remove('pressed');
      toggle.classList.add('bounce');
      setTimeout(() => toggle.classList.remove('bounce'), 650);
      if (this.dragging) {
        this.suppressClick = true;
        setTimeout(() => { this.suppressClick = false; }, 300);
        this.endDrag();
      }
      start = null;
    };

    toggle.addEventListener('pointerdown', (e) => {
      if (e.button != null && e.button !== 0) return;
      clearTimeout(this.dockTimer);
      this.dockTimer = null;
      clearTimeout(this.hoverOpenTimer);
      this.hoverOpenTimer = null;
      start = { x: e.clientX, y: e.clientY };
      toggle.classList.remove('bounce');
      toggle.classList.add('pressed');
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onUp);
    });
  },

  beginDrag(start, toggle) {
    const dock = $('#dock');
    const tRect = toggle.getBoundingClientRect();
    const ball = { x: tRect.left + tRect.width / 2, y: tRect.top + tRect.height / 2 };
    this.dragging = true;
    this.dockOpen = false;
    this.hovering = false;
    clearTimeout(this.hoverOpenTimer);
    clearTimeout(this.hoverCloseTimer);
    this.hoverOpenTimer = null;
    this.hoverCloseTimer = null;
    this.anchor = null;
    clearTimeout(this.dockTimer);
    this.dockTimer = null;
    dock.classList.remove('open');
    dock.classList.remove('settling');
    this.anchors.forEach(a => dock.classList.remove('pos-' + a));
    dock.classList.add('dragging');
    document.body.classList.add('dock-dragging');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.title = this.dockToggleTitle(false);
    toggle.setAttribute('aria-label', toggle.title);

    const size = 62;
    this._grab = { x: start.x - ball.x, y: start.y - ball.y };
    this._half = size / 2;
    this._last = { x: start.x, y: start.y };
    this._lastMove = performance.now();
    dock.style.left = (start.x - this._grab.x - this._half) + 'px';
    dock.style.top  = (start.y - this._grab.y - this._half) + 'px';
    if (!this._spring) {
      this._spring = createElasticSpring((s) => this.applySpringState(s));
    }
    this._spring.snap();

    if (this.molds) {
      this.positionMolds();
      this.molds.classList.add('visible');
      this.updateMolds(ball);
    }
  },

  applySpringState(s) {
    const dock = $('#dock');
    if (!dock) return;
    dock.style.setProperty('--dock-sx', s.sx.toFixed(3));
    dock.style.setProperty('--dock-sy', s.sy.toFixed(3));
    dock.style.setProperty('--dock-angle', s.angle.toFixed(1) + 'deg');
    dock.style.setProperty('--dock-angle-neg', (-s.angle).toFixed(1) + 'deg');
    dock.style.setProperty('--dock-isx', s.isx.toFixed(3));
    dock.style.setProperty('--dock-isy', s.isy.toFixed(3));
    dock.style.setProperty('--dock-ix', s.ix.toFixed(2) + 'px');
    dock.style.setProperty('--dock-iy', s.iy.toFixed(2) + 'px');
  },

  setDeform(sx, sy, angle, settle) {
    this.applySpringState({ sx, sy, isx: 1, isy: 1, ix: 0, iy: 0, angle: angle || 0 });
    const dock = $('#dock');
    if (dock) {
      if (settle) dock.classList.add('settling');
      else dock.classList.remove('settling');
    }
  },

  resetDeform() {
    if (!this.dragging || !this._spring) return;
    this._spring.release();
  },

  moveDrag(e) {
    const dock = $('#dock');
    if (!dock || !this.dragging) return;
    const vx = e.clientX - this._last.x;
    const vy = e.clientY - this._last.y;
    const now = performance.now();
    const dt = Math.max(8, now - this._lastMove);
    this._lastMove = now;

    if (this._spring) this._spring.impulse(vx, vy, dt);

    const left = clamp(e.clientX - this._grab.x - this._half, 8, innerWidth - 70);
    const top  = clamp(e.clientY - this._grab.y - this._half, 8, innerHeight - 70);
    dock.style.left = left + 'px';
    dock.style.top = top + 'px';
    this._last = { x: e.clientX, y: e.clientY };
    this.updateMolds({ x: e.clientX - this._grab.x, y: e.clientY - this._grab.y });

    clearTimeout(this._settleTimer);
    this._settleTimer = setTimeout(() => this.resetDeform(), 75);
  },

  endDrag() {
    const dock = $('#dock');
    if (!dock) return;
    clearTimeout(this._settleTimer);
    if (this._spring) this._spring.snap();
    const rect = dock.getBoundingClientRect();
    const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const anchor = this.nearestAnchor(center);
    this.dragging = false;
    document.body.classList.remove('dock-dragging');
    dock.classList.remove('dragging', 'settling');
    if (this.molds) this.molds.classList.remove('visible');
    dock.style.left = '';
    dock.style.top = '';
    ['--dock-sx', '--dock-sy', '--dock-angle', '--dock-angle-neg', '--dock-isx', '--dock-isy', '--dock-ix', '--dock-iy']
      .forEach(p => dock.style.removeProperty(p));
    this.applyAnchor(anchor, true, rect);
  },

  /* -------- moldes de encaixe -------- */
  buildMolds() {
    if (this.molds) this.molds.remove();
    const wrap = el('div', 'dock-molds');
    wrap.id = 'dock-molds';
    wrap.setAttribute('aria-hidden', 'true');
    this.anchors.forEach(a => {
      const m = el('div', 'dock-mold');
      m.dataset.anchor = a;
      wrap.append(m);
    });
    document.body.append(wrap);
    this.molds = wrap;
    this.positionMolds();
  },

  positionMolds() {
    if (!this.molds) return;
    this.anchors.forEach(a => {
      const node = this.molds.querySelector('[data-anchor="' + a + '"]');
      if (!node) return;
      const p = this.anchorCenter(a);
      node.style.left = (p.x - 31) + 'px';
      node.style.top = (p.y - 31) + 'px';
    });
  },

  updateMolds(center) {
    if (!this.molds || !center) return;
    this.anchors.forEach(a => {
      const node = this.molds.querySelector('[data-anchor="' + a + '"]');
      if (!node) return;
      const p = this.anchorCenter(a);
      const d = Math.hypot(center.x - p.x, center.y - p.y);
      const near = clamp(1 - d / 320, 0, 1);
      const strength = near * near;
      node.style.opacity = (0.035 + strength * 0.55).toFixed(3);
      node.style.transform = 'scale(' + (0.86 + strength * 0.24).toFixed(3) + ')';
      node.classList.toggle('near', strength > 0.55);
    });
  },

  nearestAnchor(point) {
    let best = 'bc';
    let dist = Infinity;
    this.anchors.forEach(a => {
      const p = this.anchorCenter(a);
      const d = Math.hypot(point.x - p.x, point.y - p.y);
      if (d < dist) { dist = d; best = a; }
    });
    return best;
  },

  anchorCenter(anchor) {
    const m = 22, half = 31;
    const w = innerWidth, h = innerHeight;
    switch (anchor) {
      case 'bl': return { x: m + half, y: h - m - half };
      case 'br': return { x: w - m - half, y: h - m - half };
      case 'ml': return { x: m + half, y: h / 2 };
      case 'mr': return { x: w - m - half, y: h / 2 };
      case 'tc': return { x: w / 2, y: m + half };
      case 'tl': return { x: m + half, y: m + half };
      case 'tr': return { x: w - m - half, y: m + half };
      default:   return { x: w / 2, y: h - m - half };
    }
  },

  anchorBase(anchor) {
    if (anchor === 'tc' || anchor === 'bc') return 'translateX(-50%)';
    if (anchor === 'ml' || anchor === 'mr') return 'translateY(-50%)';
    return 'none';
  },

  hoverEnabled() {
    return !!(Store.state.dock && Store.state.dock.hover);
  },

  setPanelSide(left) {
    const body = document.body;
    if (body.classList.contains('panel-left') === left) return;
    body.classList.add('panel-instant');
    body.classList.toggle('panel-left', left);
    void body.offsetWidth;
    requestAnimationFrame(() => body.classList.remove('panel-instant'));
  },

  applyAnchor(anchor, animate, fromRect) {
    const dock = $('#dock');
    if (!dock) return;
    this.anchor = anchor;
    this.anchors.forEach(a => dock.classList.toggle('pos-' + a, a === anchor));
    this.setPanelSide(anchor === 'br' || anchor === 'mr' || anchor === 'tr');
    if (Store.state.dock) {
      Store.state.dock.anchor = anchor;
      Store.save();
    }
    if (!animate || !fromRect) return;

    const target = dock.getBoundingClientRect();
    const dx = fromRect.left - target.left;
    const dy = fromRect.top - target.top;
    const base = this.anchorBase(anchor);
    if (!dock.animate) return;
    try {
      const anim = dock.animate([
        { transform: 'translate(' + dx + 'px,' + dy + 'px) ' + base + ' scale(1.24,.78)' },
        { transform: 'translate(' + (dx * 0.14) + 'px,' + (dy * 0.14) + 'px) ' + base + ' scale(.83,1.19)', offset: 0.42 },
        { transform: base + ' scale(1.12,.89)', offset: 0.64 },
        { transform: base + ' scale(.95,1.06)', offset: 0.82 },
        { transform: base + ' scale(1.02,.98)', offset: 0.92 },
        { transform: base }
      ], { duration: 680, easing: 'cubic-bezier(.22,.8,.3,1)' });
      anim.onfinish = () => anim.cancel();

      const toggle = $('#dock-toggle');
      if (toggle && toggle.animate) {
        const ix = clamp(dx * 0.08, -7, 7);
        const iy = clamp(dy * 0.08, -7, 7);
        const ia = toggle.animate([
          { transform: 'translate(' + (-ix) + 'px,' + (-iy) + 'px) scale(.86,1.16)' },
          { transform: 'translate(' + (ix * 0.7) + 'px,' + (iy * 0.7) + 'px) scale(1.16,.85)', offset: 0.46 },
          { transform: 'translate(' + (-ix * 0.35) + 'px,' + (-iy * 0.35) + 'px) scale(.92,1.09)', offset: 0.70 },
          { transform: 'translate(' + (ix * 0.15) + 'px,' + (iy * 0.15) + 'px) scale(1.04,.96)', offset: 0.86 },
          { transform: 'none' }
        ], { duration: 720, easing: 'cubic-bezier(.2,.85,.35,1)' });
        ia.onfinish = () => ia.cancel();
      }
    } catch (e) { /* sem suporte a WAAPI */ }
  },

  popBall() {
    const toggle = $('#dock-toggle');
    if (!toggle) return;
    toggle.classList.remove('pop');
    void toggle.offsetWidth;
    toggle.classList.add('pop');
    setTimeout(() => toggle.classList.remove('pop'), 720);
  },

  toggleDock(open) {
    const dock = $('#dock');
    if (!dock) return;
    this.dockOpen = open == null ? !this.dockOpen : !!open;
    dock.classList.toggle('open', this.dockOpen);
    const toggle = $('#dock-toggle');
    if (toggle) {
      toggle.setAttribute('aria-expanded', this.dockOpen ? 'true' : 'false');
      toggle.title = this.dockToggleTitle(this.dockOpen);
      toggle.setAttribute('aria-label', toggle.title);
    }
    clearTimeout(this.dockTimer);
    this.dockTimer = null;
    if (this.dockOpen) this.armDock();
  },

  armDock() {
    clearTimeout(this.dockTimer);
    this.dockTimer = setTimeout(() => {
      if (!this.hovering) this.toggleDock(false);
    }, this.dockIdleMs);
  },

  parse() {
    const h = (location.hash || '').replace(/^#\/?/, '').trim();
    return this.slugs[h] || 'home';
  },

  go() {
    const next = this.parse();
    const changed = next !== this.route;
    this.route = next;
    document.body.dataset.route = next;

    $$('.page').forEach(p => p.classList.toggle('active', p.dataset.page === next));
    $$('#dock .dock-btn[data-route]').forEach(b => b.classList.toggle('active', b.dataset.route === next));

    if (next === 'timer') TimerPage.syncUI();
    else if (typeof TimerPage !== 'undefined') TimerPage.hideHalo();
    if (next === 'tracker') TrackerPage.render();
    if (next === 'tasks') TasksPage.render();
    if (next === 'home') HomePage.renderChips();
    if (next === 'workspace' && typeof Workspace !== 'undefined') Workspace.enter();
    if (next !== 'workspace' && typeof Workspace !== 'undefined') Workspace.leave();

    // a chuva e o fundo ficam em pausa na Área de Trabalho
    if (typeof Motion !== 'undefined') Motion.setSuspended(next === 'workspace');

    if (changed && document.body.classList.contains('panel-open')) Panel.render();
    document.title = tr('title.' + next, next === 'home' ? 'Fluxo' : this.routeLabel(next) + ' · Fluxo');
  }
};
