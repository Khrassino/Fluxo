'use strict';
/* ============ layout-edit.js — edição direta na tela ============ */
const LayoutEdit = {
  active: null,
  items: [],
  drag: null,

  ctxFor(page) {
    if (page === 'tracker') {
      return {
        page: 'tracker',
        route: 'tracker',
        container: '#tracker-wrap',
        defs: TRACKER_LAYOUT,
        get: () => TrackerPage.layout(),
        save: (arr) => {
          Store.state.tracker.layout = arr;
          Store.save();
          TrackerPage.applyLayout();
        },
        nodes: {
          header: '#tracker-header',
          stats:  '#stats-grid',
          chart:  '#chart-card',
          chart2: '#chart2-card',
          goal:   '#goal-card'
        }
      };
    }
    return {
      page: 'home',
      route: 'home',
      container: '#home-wrap',
      defs: HOME_LAYOUT,
      get: () => HomePage.layout(),
      save: (arr) => {
        Store.state.home.layout = arr;
        Store.save();
        const qItem = arr.find(x => x.id === 'quote');
        if (qItem && typeof QuotesStore !== 'undefined') {
          QuotesStore.state.enabled = qItem.on !== false;
          QuotesStore.save();
          if (typeof QuotesUI !== 'undefined') {
            QuotesUI.refreshSelection('sync');
            QuotesUI.render();
          }
        }
        HomePage.applyLayout();
      },
      nodes: {
        greet: '#home-greet',
        clock: '#home-clock',
        date:  '#home-date',
        quote: '#home-quote',
        chips: '#home-chips'
      }
    };
  },

  start(page) {
    if (this.active) this.stop();
    const ctx = this.ctxFor(page);

    if (Router.route !== ctx.route) {
      location.hash = '#/' + (ctx.route === 'home' ? 'inicio' : 'progresso');
      setTimeout(() => this.start(page), 280);
      return;
    }

    this.active = { ctx };
    document.body.classList.add('layout-editing');
    const pageEl = $('#page-' + ctx.route);
    if (pageEl) pageEl.classList.add('le-page');

    this._esc = (e) => { if (e.key === 'Escape') this.stop(); };
    this._route = () => {
      if (this.active && Router.route !== this.active.ctx.route) this.stop();
    };
    document.addEventListener('keydown', this._esc);
    window.addEventListener('hashchange', this._route);

    this.buildBar();
    this.decorate();
    if (typeof Idle !== 'undefined') Idle.wake();
    toast(tr('le.toastStart', 'Arraste os elementos · solte na lixeira para remover'), 'grip');
  },

  stop() {
    if (!this.active) return;
    this.cancelDrag();
    document.body.classList.remove('layout-editing', 'le-dragging');
    $$('.le-item').forEach(n => {
      n.classList.remove('le-item', 'le-locked', 'le-hidden', 'le-dragging');
      n.style.position = '';
      n.style.left = '';
      n.style.top = '';
      n.style.width = '';
      n.style.height = '';
      n.style.margin = '';
      n.style.zIndex = '';
      n.style.pointerEvents = '';
    });
    $$('.home-chip-remove').forEach(n => n.remove());
    $$('.goal-var-btn').forEach(n => n.remove());
    $$('.le-container').forEach(n => n.classList.remove('le-container'));
    $$('.le-page').forEach(n => n.classList.remove('le-page'));
    $$('.le-stat').forEach(n => {
      n.classList.remove('le-stat', 'le-dragging');
      n.style.position = '';
      n.style.left = '';
      n.style.top = '';
      n.style.width = '';
      n.style.height = '';
      n.style.margin = '';
      n.style.zIndex = '';
      n.style.pointerEvents = '';
    });
    const bar = $('#layout-bar');
    if (bar) bar.remove();
    document.removeEventListener('keydown', this._esc);
    window.removeEventListener('hashchange', this._route);
    this.active = null;
    this.items = [];
    if (typeof Idle !== 'undefined') Idle.wake();
  },

  /* -------- barra flutuante -------- */
  buildBar() {
    const old = $('#layout-bar');
    if (old) old.remove();

    const bar = el('div', 'layout-bar');
    bar.id = 'layout-bar';
    bar.innerHTML =
      '<div class="le-tray empty" id="le-tray">' +
        '<span class="le-tray-label">' + tr('le.trayEmpty', 'Elementos ocultos') + '</span>' +
        '<div class="le-tray-items" id="le-tray-items"></div>' +
      '</div>' +
      '<div class="le-bar-actions">' +
        '<div class="le-remove" id="le-remove">' + svgIcon('trash') + '<span>' + tr('le.removeZone', 'Solte aqui para remover') + '</span></div>' +
        '<button class="le-done" id="le-done">' + svgIcon('check') + '<span>' + tr('le.done', 'Concluir') + '</span></button>' +
      '</div>';
    document.body.append(bar);

    $('#le-done').addEventListener('click', () => this.stop());
  },

  /* -------- prepara os elementos da página -------- */
  decorate() {
    if (!this.active) return;
    const ctx = this.active.ctx;
    const items = ctx.get();
    this.items = items;

    const container = $(ctx.container);
    if (container) container.classList.add('le-container');

    Object.keys(ctx.nodes).forEach(id => {
      const node = $(ctx.nodes[id]);
      if (!node) return;
      const item = items.find(x => x.id === id);
      node.dataset.leId = id;
      node.classList.add('le-item');
      node.classList.toggle('le-locked', !!(item && item.locked));
      node.classList.toggle('le-hidden', !item || item.on === false);
      if (!node._leBound) {
        node.addEventListener('pointerdown', (e) => this.onDown(e, node), true);
        node._leBound = true;
      }
    });

    // Em Início: adiciona botão de remoção rápida a cada atalho da tela
    if (ctx.page === 'home') {
      $$('#home-chips .home-chip').forEach(chip => {
        if (!chip.querySelector('.home-chip-remove')) {
          const rm = el('span', 'home-chip-remove', '×');
          rm.setAttribute('role', 'button');
          rm.setAttribute('tabindex', '0');
          rm.title = tr('le.removeChip', 'Remover este atalho');
          rm.addEventListener('pointerdown', (e) => e.stopPropagation());
          const removeChip = (e) => {
            e.stopPropagation();
            const id = chip.dataset.chipId;
            const chips = HomePage.chipsLayout();
            const target = chips.find(x => x.id === id);
            if (target) {
              target.on = false;
              Store.state.home.chips = chips;
              Store.save();
              HomePage.renderChips();
              this.decorate();
              toast(tr('le.chipRemoved', 'Atalho removido · recupere na barra inferior'), 'eyeoff');
            }
          };
          rm.addEventListener('click', removeChip);
          rm.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); removeChip(e); }
          });
          chip.append(rm);
        }
      });
    }

    // Em Progresso: adiciona botão de alternar variação de estilo na meta diária
    if (ctx.page === 'tracker') {
      const goalCard = $('#goal-card');
      if (goalCard && !goalCard.querySelector('.goal-var-btn')) {
        const varBtn = el('button', 'chip goal-var-btn', svgIcon('sliders') + '<span>' + tr('le.variation', 'Variação') + '</span>');
        varBtn.title = tr('le.variationTitle', 'Alternar visual da meta diária (barra, circular ou marcos)');
        varBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const cur = Store.state.tracker.goalStyle || 'bar';
          const styles = ['bar', 'ring', 'milestones'];
          const next = styles[(styles.indexOf(cur) + 1) % styles.length];
          Store.state.tracker.goalStyle = next;
          Store.save();
          TrackerPage.renderGoal();
          if (this.active) this.decorate();
          const styleLabel = tr('le.goalStyle.' + next, next === 'bar' ? 'Barra' : next === 'ring' ? 'Circular' : 'Marcos');
          toast(tr('le.goalStyleToast', 'Estilo da meta: ' + styleLabel, { style: styleLabel }), 'sparkle');
        });
        goalCard.append(varBtn);
      }

      // Arraste individual de stat-cards dentro do stats-grid
      this.decorateStatCards();
    }

    this.renderTray(items);
  },

  decorateStatCards() {
    $$('#stats-grid .stat-card').forEach(card => card.classList.add('le-stat'));
  },

  renderTray(items) {
    const box = $('#le-tray-items');
    const tray = $('#le-tray');
    if (!box || !tray) return;
    box.innerHTML = '';
    const ctx = this.active.ctx;
    const hidden = items.filter(x => !x.locked && x.on === false);

    // Na tela inicial, também coleta atalhos ocultos
    const hiddenChips = ctx.page === 'home'
      ? HomePage.chipsLayout().filter(c => !c.on)
      : [];

    // Na tela de progresso, também coleta cartões de estatísticas ocultos
    const hiddenWidgets = ctx.page === 'tracker'
      ? TrackerPage.widgets().filter(w => !w.on)
      : [];

    const totalHidden = hidden.length + hiddenChips.length + hiddenWidgets.length;
    tray.classList.toggle('empty', totalHidden === 0);

    const label = $('.le-tray-label', tray);
    if (label) {
      label.textContent = totalHidden
        ? tr('le.trayPick', 'Toque para adicionar de volta')
        : tr('le.trayEmpty', 'Nenhum elemento oculto');
    }

    // Blocos estruturais ocultos
    hidden.forEach(item => {
      const def = ctx.defs.find(d => d.id === item.id) || { label: item.id };
      const prefix = ctx.page === 'tracker' ? 'tracker.layout.' : 'home.layout.';
      const lbl = tr(prefix + item.id, def.label);
      const chip = el('button', 'le-chip', svgIcon('plus') + '<span>' + lbl + '</span>');
      chip.title = lbl;
      chip.addEventListener('click', () => this.toggleItem(item.id, true));
      box.append(chip);
    });

    // Atalhos ocultos (página inicial)
    hiddenChips.forEach(c => {
      const def = HOME_CHIP_DEFS.find(d => d.id === c.id) || { label: c.id };
      const lbl = tr('home.chipDef.' + c.id, def.label);
      const chip = el('button', 'le-chip', svgIcon('plus') + '<span>' + tr('le.chipPrefix', 'Atalho: ' + lbl, { label: lbl }) + '</span>');
      chip.title = lbl;
      chip.addEventListener('click', () => {
        const chips = HomePage.chipsLayout();
        const target = chips.find(x => x.id === c.id);
        if (target) {
          target.on = true;
          Store.state.home.chips = chips;
          Store.save();
          HomePage.renderChips();
          this.decorate();
          toast(tr('le.chipAdded', 'Atalho ' + lbl + ' adicionado', { label: lbl }), 'check');
        }
      });
      box.append(chip);
    });

    // Cartões de estatística ocultos (página de progresso)
    hiddenWidgets.forEach(w => {
      const def = TRACKER_WIDGET_DEFS.find(d => d.id === w.id) || { label: w.id };
      const lbl = tr('tracker.widget.' + w.id, def.label);
      const chip = el('button', 'le-chip', svgIcon('plus') + '<span>' + tr('le.cardPrefix', 'Cartão: ' + lbl, { label: lbl }) + '</span>');
      chip.title = lbl;
      chip.addEventListener('click', () => {
        const widgets = TrackerPage.widgets();
        const target = widgets.find(x => x.id === w.id);
        if (target) {
          target.on = true;
          Store.state.tracker.widgets = widgets;
          Store.save();
          TrackerPage.render();
          this.decorate();
          toast(tr('le.cardAdded', 'Cartão ' + lbl + ' adicionado', { label: lbl }), 'check');
        }
      });
      box.append(chip);
    });
  },

  toggleItem(id, on) {
    if (!this.active) return;
    const arr = this.active.ctx.get();
    const item = arr.find(x => x.id === id);
    if (!item) return;
    item.on = on;
    this.active.ctx.save(arr);
    this.decorate();
  },

  /* -------- arraste -------- */
  onDown(e, node) {
    if (!this.active || this.drag) return;
    if (e.button != null && e.button !== 0) return;
    if (e.target.closest && e.target.closest('.stat-edit-tools, .home-chip-remove, .goal-var-btn')) return;

    let target = node;
    let kind = 'block';
    const statCard = e.target.closest && e.target.closest('#stats-grid > .stat-card');
    if (statCard && node.contains(statCard)) {
      target = statCard;
      kind = 'stat';
    } else {
      if (node.classList.contains('le-locked')) {
        e.preventDefault();
        return;
      }
      const item = this.items.find(x => x.id === node.dataset.leId);
      if (!item) return;
    }
    e.preventDefault();
    e.stopPropagation();

    const rect = target.getBoundingClientRect();
    const drag = {
      node: target,
      kind,
      id: kind === 'stat' ? target.dataset.statId : node.dataset.leId,
      rect,
      start: { x: e.clientX, y: e.clientY },
      moved: false,
      placeholder: null,
      onMove: null,
      onUp: null
    };
    drag.onMove = (ev) => this.onMove(ev);
    drag.onUp = (ev) => this.onUp(ev);
    this.drag = drag;

    document.addEventListener('pointermove', drag.onMove);
    document.addEventListener('pointerup', drag.onUp);
    document.addEventListener('pointercancel', drag.onUp);
  },

  onMove(e) {
    const d = this.drag;
    if (!d || !this.active) return;

    if (!d.moved) {
      if (Math.hypot(e.clientX - d.start.x, e.clientY - d.start.y) < 5) return;
      d.moved = true;
      const ph = document.createElement('div');
      ph.className = 'le-placeholder';
      ph.style.height = d.rect.height + 'px';
      if (d.kind === 'stat' && d.node.classList.contains('size-2x')) ph.style.gridColumn = 'span 2';
      d.node.parentNode.insertBefore(ph, d.node);
      d.placeholder = ph;

      d.node.classList.add('le-dragging');
      d.node.style.position = 'fixed';
      d.node.style.left = d.rect.left + 'px';
      d.node.style.top = d.rect.top + 'px';
      d.node.style.width = d.rect.width + 'px';
      d.node.style.height = d.rect.height + 'px';
      d.node.style.margin = '0';
      d.node.style.zIndex = '220';
      d.node.style.pointerEvents = 'none';
      document.body.classList.add('le-dragging');
    }

    d.node.style.left = (d.rect.left + e.clientX - d.start.x) + 'px';
    d.node.style.top = (d.rect.top + e.clientY - d.start.y) + 'px';

    const overRemove = this.isOverRemove(e.clientX, e.clientY);
    const removeZone = $('#le-remove');
    if (removeZone) removeZone.classList.toggle('over', overRemove);
    if (overRemove) return;

    if (d.kind === 'stat') {
      this.placeStat(e, d);
      return;
    }

    const container = $(this.active.ctx.container);
    if (!container || !d.placeholder) return;
    const siblings = Array.from(container.children).filter(n =>
      n.classList && n.classList.contains('le-item') && n !== d.node
    );
    let before = null;
    for (const sib of siblings) {
      const r = sib.getBoundingClientRect();
      if (e.clientY < r.top + r.height / 2) { before = sib; break; }
    }
    if (before) container.insertBefore(d.placeholder, before);
    else container.append(d.placeholder);
  },

  onUp(e) {
    const d = this.drag;
    if (!d) return;
    document.removeEventListener('pointermove', d.onMove);
    document.removeEventListener('pointerup', d.onUp);
    document.removeEventListener('pointercancel', d.onUp);
    this.drag = null;

    if (!d.moved) return;

    const overRemove = this.isOverRemove(e.clientX, e.clientY);
    d.node.classList.remove('le-dragging');
    d.node.style.position = '';
    d.node.style.left = '';
    d.node.style.top = '';
    d.node.style.width = '';
    d.node.style.height = '';
    d.node.style.margin = '';
    d.node.style.zIndex = '';
    d.node.style.pointerEvents = '';
    document.body.classList.remove('le-dragging');
    const removeZone = $('#le-remove');
    if (removeZone) removeZone.classList.remove('over');

    if (overRemove) {
      if (d.placeholder) d.placeholder.remove();
      if (d.kind === 'stat') {
        this.removeStat(d.id);
        return;
      }
      this.toggleItem(d.id, false);
      toast(tr('le.itemRemoved', 'Elemento removido · recupere na barra inferior'), 'eyeoff');
      return;
    }

    if (d.kind === 'stat') {
      const slot = d.placeholder;
      if (slot && slot.parentNode) {
        slot.parentNode.insertBefore(d.node, slot);
        slot.remove();
        this.saveStatOrder();
      }
      return;
    }

    const target = d.placeholder;
    if (target && target.parentNode) {
      target.parentNode.insertBefore(d.node, target);
      target.remove();
      this.saveFromDOM();
    }
  },

  cancelDrag() {
    const d = this.drag;
    if (!d) return;
    document.removeEventListener('pointermove', d.onMove);
    document.removeEventListener('pointerup', d.onUp);
    document.removeEventListener('pointercancel', d.onUp);
    if (d.placeholder && d.placeholder.parentNode) {
      d.placeholder.parentNode.insertBefore(d.node, d.placeholder);
      d.placeholder.remove();
    }
    d.node.classList.remove('le-dragging');
    d.node.style.position = '';
    d.node.style.left = '';
    d.node.style.top = '';
    d.node.style.width = '';
    d.node.style.height = '';
    d.node.style.margin = '';
    d.node.style.zIndex = '';
    d.node.style.pointerEvents = '';
    const removeZone = $('#le-remove');
    if (removeZone) removeZone.classList.remove('over');
    this.drag = null;
    document.body.classList.remove('le-dragging');
  },

  placeStat(e, d) {
    const grid = $('#stats-grid');
    if (!grid || !d.placeholder) return;
    const siblings = Array.from(grid.children).filter(n =>
      n !== d.node && n !== d.placeholder && n.classList && n.classList.contains('stat-card')
    );
    let before = null;
    for (const sib of siblings) {
      const r = sib.getBoundingClientRect();
      const cy = r.top + r.height / 2;
      const cx = r.left + r.width / 2;
      if (e.clientY < cy - r.height * 0.15 || (e.clientY < r.bottom && e.clientX < cx)) {
        before = sib;
        break;
      }
    }
    if (before) {
      if (d.placeholder.nextSibling !== before) grid.insertBefore(d.placeholder, before);
    } else if (grid.lastElementChild !== d.placeholder) {
      grid.append(d.placeholder);
    }
  },

  removeStat(id) {
    const widgets = TrackerPage.widgets();
    const target = widgets.find(x => x.id === id);
    if (!target) return;
    target.on = false;
    Store.state.tracker.widgets = widgets;
    Store.save();
    TrackerPage.render();
    this.decorate();
    toast(tr('le.cardRemoved', 'Cartão removido · recupere na barra inferior'), 'eyeoff');
  },

  saveStatOrder() {
    const grid = $('#stats-grid');
    if (!grid) return;
    const order = Array.from(grid.children)
      .filter(n => n.classList && n.classList.contains('stat-card'))
      .map(n => n.dataset.statId);
    const widgets = TrackerPage.widgets();
    const out = [];
    order.forEach(id => {
      const w = widgets.find(x => x.id === id);
      if (w) out.push(w);
    });
    widgets.forEach(w => {
      if (!out.some(x => x.id === w.id)) out.push(w);
    });
    Store.state.tracker.widgets = out;
    Store.save();
  },

  isOverRemove(x, y) {
    const zone = $('#le-remove');
    if (!zone) return false;
    const r = zone.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  },

  saveFromDOM() {
    if (!this.active) return;
    const ctx = this.active.ctx;
    const container = $(ctx.container);
    if (!container) return;
    const order = Array.from(container.children)
      .filter(n => n.classList && n.classList.contains('le-item'))
      .map(n => n.dataset.leId);
    const current = ctx.get();
    const out = [];
    order.forEach(id => {
      const item = current.find(x => x.id === id);
      if (item) out.push(item);
    });
    current.forEach(item => {
      if (!out.some(x => x.id === item.id)) out.push(item);
    });
    ctx.save(out);
    this.decorate();
  }
};
