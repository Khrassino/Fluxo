'use strict';
/* ============ pages/tasks.js — tarefas ============ */
const TasksPage = {
  filter: 'all',
  tagFilter: 'all',
  query: '',
  expandedIds: new Set(),
  lastDeleted: null,
  undoTimer: null,

  init() {
    $('#tasks-add').innerHTML = svgIcon('plus');
    const ghost = $('#ghost-tasks');
    if (ghost) ghost.innerHTML = svgIcon('tasks');

    const dueIco = $('#tasks-due-ico');
    if (dueIco) dueIco.innerHTML = svgIcon('calendar');
    const prioIco = $('#tasks-prio-ico');
    if (prioIco) prioIco.innerHTML = svgIcon('flag');
    const tagIco = $('#tasks-tag-ico');
    if (tagIco) tagIco.innerHTML = svgIcon('tag');
    const searchIco = $('#tasks-search-ico');
    if (searchIco) searchIco.innerHTML = svgIcon('search');
    const searchClear = $('#tasks-search-clear');
    if (searchClear) searchClear.innerHTML = svgIcon('close');

    this.applyConfig();
    this.resetComposeDefaults();

    $('#tasks-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.add();
    });

    $$('#tasks-compose-opts [data-due-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const dueInput = $('#tasks-due-input');
        if (!dueInput) return;
        const todayStr = taskLocalDateKey();
        const target = btn.dataset.duePreset === 'tomorrow'
          ? taskAddDaysKey(todayStr, 1)
          : todayStr;
        dueInput.value = dueInput.value === target ? '' : target;
        this.syncComposeDueUI();
      });
    });

    const dueInput = $('#tasks-due-input');
    if (dueInput) {
      dueInput.addEventListener('change', () => this.syncComposeDueUI());
    }

    const searchInput = $('#tasks-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.query = searchInput.value;
        if (searchClear) searchClear.hidden = !this.query;
        this.render();
      });
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          if (this.query) {
            this.query = '';
            searchInput.value = '';
            if (searchClear) searchClear.hidden = true;
            this.render();
          } else {
            searchInput.blur();
          }
        }
      });
    }

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        this.query = '';
        if (searchInput) { searchInput.value = ''; searchInput.focus(); }
        searchClear.hidden = true;
        this.render();
      });
    }

    $$('#tasks-filters .filter-chip').forEach(b => {
      b.addEventListener('click', () => {
        this.filter = b.dataset.filter;
        $$('#tasks-filters .filter-chip').forEach(x => x.classList.toggle('active', x === b));
        this.render();
      });
    });

    const tagSelect = $('#tasks-tag-filter');
    if (tagSelect) {
      tagSelect.addEventListener('change', () => {
        this.tagFilter = tagSelect.value || 'all';
        this.render();
      });
    }

    const sortSelect = $('#tasks-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        Store.state.tasks.sort = sortSelect.value;
        Store.save();
        this.render();
        if (typeof Panel !== 'undefined' && document.body.classList.contains('panel-open')) {
          Panel.render();
        }
      });
    }

    $('#tasks-clear').addEventListener('click', () => this.clearDone());

    const undoBtn = $('#tasks-undo-btn');
    if (undoBtn) undoBtn.addEventListener('click', () => this.undoDelete());

    document.addEventListener('keydown', (e) => {
      if (typeof Router !== 'undefined' && Router.route !== 'tasks') return;
      if (document.body.classList.contains('panel-open')) return;
      const tag = (e.target && e.target.tagName || '').toUpperCase();
      const isField = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        if (searchInput && Store.state.tasks.showSearch !== false) {
          e.preventDefault();
          searchInput.focus();
          searchInput.select();
        }
      } else if (!isField && e.key === '/') {
        if (searchInput && Store.state.tasks.showSearch !== false) {
          e.preventDefault();
          searchInput.focus();
          searchInput.select();
        }
      }
    });

    this.render();
  },

  applyConfig() {
    const t = Store.state.tasks;
    const page = $('#page-tasks');
    if (!page) return;
    page.style.setProperty('--task-accent', t.accent || 'var(--accent)');
    page.dataset.anim = t.anim || 'slide';
    page.dataset.style = t.cardStyle || 'glass';
    page.dataset.density = t.density || 'comfortable';
    page.dataset.check = t.checkShape || 'rounded';
    page.dataset.overdue = t.highlightOverdue !== false ? 'on' : 'off';

    const composeOpts = $('#tasks-compose-opts');
    if (composeOpts) composeOpts.hidden = t.showComposeOpts === false;

    const searchWrap = $('#tasks-search-wrap');
    const searchInput = $('#tasks-search');
    const searchClear = $('#tasks-search-clear');
    const showSearch = t.showSearch !== false;
    if (searchWrap) searchWrap.hidden = !showSearch;
    if (!showSearch && this.query) {
      this.query = '';
      if (searchInput) searchInput.value = '';
      if (searchClear) searchClear.hidden = true;
    }

    const showExtra = t.showExtraControls !== false;
    $$('#tasks-filters [data-filter="today"], #tasks-filters [data-filter="overdue"]').forEach(btn => {
      btn.hidden = !showExtra;
    });
    const tagFilterEl = $('#tasks-tag-filter');
    if (tagFilterEl) tagFilterEl.hidden = !showExtra;
    const sortSelect = $('#tasks-sort');
    if (sortSelect) {
      sortSelect.hidden = !showExtra;
      if (sortSelect.value !== (t.sort || 'recent')) {
        sortSelect.value = t.sort || 'recent';
      }
    }
    if (!showExtra) {
      if (this.filter === 'today' || this.filter === 'overdue') this.filter = 'all';
      if (this.tagFilter !== 'all') this.tagFilter = 'all';
    }

    this.applyIdleConfig();
  },

  applyIdleConfig() {
    const cfg = (Store.state.tasks && Store.state.tasks.idle) || {};
    const summary = $('#tasks-summary');
    const form = $('#tasks-form');
    const controls = $('#tasks-controls');
    if (summary) summary.classList.toggle('idle-hide', !cfg.summary);
    if (form) form.classList.toggle('idle-hide', !cfg.composer);
    if (controls) controls.classList.toggle('idle-hide', !cfg.controls);
  },

  resetComposeDefaults() {
    const t = Store.state.tasks;
    const dueInput = $('#tasks-due-input');
    const prioInput = $('#tasks-priority-input');
    const tagInput = $('#tasks-tag-input');
    const todayStr = taskLocalDateKey();

    if (dueInput) {
      if (t.defaultDue === 'today') dueInput.value = todayStr;
      else if (t.defaultDue === 'tomorrow') dueInput.value = taskAddDaysKey(todayStr, 1);
      else dueInput.value = '';
      this.syncComposeDueUI();
    }
    if (prioInput) {
      prioInput.value = normalizeTaskPriority(t.defaultPriority);
    }
    if (tagInput) tagInput.value = '';
  },

  syncComposeDueUI() {
    const dueInput = $('#tasks-due-input');
    const dueLabel = $('#tasks-due-label');
    if (!dueInput || !dueLabel) return;
    const val = normalizeDueDate(dueInput.value);
    const todayStr = taskLocalDateKey();
    const tomorrowStr = taskAddDaysKey(todayStr, 1);

    $$('#tasks-compose-opts [data-due-preset]').forEach(btn => {
      const target = btn.dataset.duePreset === 'tomorrow' ? tomorrowStr : todayStr;
      btn.classList.toggle('active', val === target);
    });

    if (!val) {
      dueLabel.textContent = tr('tasks.dueLabel', 'Prazo');
      dueLabel.parentElement.classList.remove('has-date');
    } else {
      dueLabel.parentElement.classList.add('has-date');
      if (val === todayStr) dueLabel.textContent = tr('tasks.dueToday', 'Hoje');
      else if (val === tomorrowStr) dueLabel.textContent = tr('tasks.dueTomorrow', 'Amanhã');
      else dueLabel.textContent = formatShortDatePt(val, todayStr);
    }
  },

  add() {
    const input = $('#tasks-input');
    const text = input.value.trim();
    if (!text) { input.focus(); return; }

    const dueInput = $('#tasks-due-input');
    const prioInput = $('#tasks-priority-input');
    const tagInput = $('#tasks-tag-input');

    const item = normalizeTaskItem({
      id: uid(),
      text,
      done: false,
      createdAt: new Date().toISOString(),
      doneAt: null,
      dueDate: dueInput ? dueInput.value : null,
      priority: prioInput ? prioInput.value : Store.state.tasks.defaultPriority,
      tag: tagInput ? tagInput.value : '',
      notes: '',
      subtasks: []
    });

    Store.state.tasks.items.unshift(item);
    Store.save();

    input.value = '';
    this.resetComposeDefaults();
    input.focus();

    if (this.filter === 'done') {
      this.filter = 'all';
      $$('#tasks-filters .filter-chip').forEach(x => x.classList.toggle('active', x.dataset.filter === 'all'));
    }
    if (this.tagFilter !== 'all' && taskNormalizeText(item.tag) !== taskNormalizeText(this.tagFilter)) {
      this.tagFilter = 'all';
    }
    this.render(true);
    if (typeof HomePage !== 'undefined') HomePage.renderChips();
  },

  toggle(id) {
    const item = Store.state.tasks.items.find(t => t.id === id);
    if (!item) return;
    item.done = !item.done;
    item.doneAt = item.done ? new Date().toISOString() : null;
    Store.state.tracker.tasksCompleted = Math.max(0, Store.state.tracker.tasksCompleted + (item.done ? 1 : -1));
    if (item.done && Store.state.tasks.popSound) Sound.pop();
    Store.save();
    this.render();
    if (typeof TrackerPage !== 'undefined') TrackerPage.softRefresh();
    if (typeof HomePage !== 'undefined') HomePage.renderChips();
  },

  startEdit(id) {
    const item = Store.state.tasks.items.find(t => t.id === id);
    if (!item) return;
    const li = document.querySelector('.task[data-id="' + id + '"]');
    if (!li) return;
    const span = $('.task-text', li);
    if (!span) return;

    const input = el('input', 'task-edit');
    input.type = 'text';
    input.maxLength = 200;
    input.value = item.text;
    span.replaceWith(input);
    input.focus();
    input.select();

    let done = false;
    const finish = (save) => {
      if (done) return;
      done = true;
      const val = input.value.trim();
      if (save && val && val !== item.text) {
        item.text = val;
        Store.save();
        toast(tr('tasks.updated', 'Tarefa atualizada'), 'pencil');
      }
      this.render();
      if (typeof HomePage !== 'undefined') HomePage.renderChips();
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); finish(true); }
      else if (e.key === 'Escape') { e.preventDefault(); finish(false); }
    });
    input.addEventListener('blur', () => finish(true));
  },

  showUndoBanner(msg, payload) {
    this.lastDeleted = payload;
    clearTimeout(this.undoTimer);
    const bar = $('#tasks-undo');
    const txt = $('#tasks-undo-msg');
    if (txt) txt.textContent = msg;
    if (bar) bar.hidden = false;
    this.undoTimer = setTimeout(() => {
      this.lastDeleted = null;
      if (bar) bar.hidden = true;
    }, 6000);
  },

  undoDelete() {
    if (!this.lastDeleted) return;
    const payload = this.lastDeleted;
    this.lastDeleted = null;
    clearTimeout(this.undoTimer);
    const bar = $('#tasks-undo');
    if (bar) bar.hidden = true;

    if (Array.isArray(payload.batch)) {
      payload.batch.forEach(entry => {
        const at = clamp(entry.index, 0, Store.state.tasks.items.length);
        Store.state.tasks.items.splice(at, 0, entry.item);
      });
    } else if (payload.item) {
      const at = clamp(payload.index, 0, Store.state.tasks.items.length);
      Store.state.tasks.items.splice(at, 0, payload.item);
    }
    Store.save();
    this.render();
    if (typeof HomePage !== 'undefined') HomePage.renderChips();
    toast(tr('tasks.restored', 'Tarefa restaurada'), 'reset');
  },

  remove(id) {
    const li = document.querySelector('.task[data-id="' + id + '"]');
    const finish = () => {
      const idx = Store.state.tasks.items.findIndex(t => t.id === id);
      if (idx < 0) return;
      const item = Store.state.tasks.items[idx];
      Store.state.tasks.items.splice(idx, 1);
      this.expandedIds.delete(id);
      Store.save();
      this.render();
      this.showUndoBanner(tr('tasks.removed', 'Tarefa removida'), { item, index: idx });
      if (typeof HomePage !== 'undefined') HomePage.renderChips();
    };
    if (li) { li.classList.add('exit'); setTimeout(finish, 220); }
    else finish();
  },

  clearDone() {
    const batch = [];
    const kept = [];
    Store.state.tasks.items.forEach((t, idx) => {
      if (t.done) batch.push({ item: t, index: idx });
      else kept.push(t);
    });
    if (!batch.length) { toast(tr('tasks.noneDone', 'Nenhuma tarefa concluída'), 'checkc'); return; }
    Store.state.tasks.items = kept;
    Store.save();
    this.render();
    this.showUndoBanner(
      batch.length === 1
        ? tr('tasks.clearedOne', '1 concluída removida')
        : tr('tasks.clearedMany', batch.length + ' concluídas removidas', { n: batch.length }),
      { batch }
    );
    if (typeof HomePage !== 'undefined') HomePage.renderChips();
  },

  toggleExpand(id) {
    if (this.expandedIds.has(id)) this.expandedIds.delete(id);
    else this.expandedIds.add(id);
    this.render();
  },

  focusTask(item) {
    if (!item || typeof TimerPage === 'undefined') return;
    toast(tr('tasks.focusStart', 'Foco iniciado: ' + item.text, { text: item.text }), 'play');
    TimerPage.quickFocus();
  },

  syncTagDatalist(existingTags) {
    const dl = $('#tasks-tag-list');
    if (dl) {
      const defaults = (typeof getLang === 'function' && getLang() === 'en')
        ? ['Study', 'Work', 'Personal', 'Review']
        : TASK_DEFAULT_TAGS;
      const set = new Set([...defaults, ...existingTags]);
      dl.innerHTML = '';
      set.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        dl.append(opt);
      });
    }

    const sel = $('#tasks-tag-filter');
    if (sel) {
      const prev = this.tagFilter || 'all';
      sel.innerHTML = '<option value="all">' + tr('tasks.allTags', 'Todas categorias') + '</option>';
      existingTags.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        sel.append(opt);
      });
      const stillValid = prev === 'all' || existingTags.some(t => taskNormalizeText(t) === taskNormalizeText(prev));
      this.tagFilter = stillValid ? prev : 'all';
      sel.value = this.tagFilter;
    }
  },

  renderMeta(item, cfg, todayStr) {
    const parts = [];
    const due = getDueInfo(item.dueDate, item.done, todayStr);
    const subs = Array.isArray(item.subtasks) ? item.subtasks : [];
    const subDone = subs.filter(s => s.done).length;

    if (cfg.showMeta) {
      if (item.priority && item.priority !== 'none') {
        const pDef = TASK_PRIORITIES.find(p => p.id === item.priority);
        if (pDef) {
          parts.push({
            cls: 'task-meta-item prio-' + item.priority,
            icon: 'flag',
            text: tr('tasks.prio.' + pDef.id, pDef.short)
          });
        }
      }
      if (due.status !== 'none') {
        parts.push({
          cls: 'task-meta-item due-' + due.status,
          icon: due.status === 'overdue' ? 'alert' : 'calendar',
          text: due.label
        });
      }
      if (item.tag) {
        parts.push({
          cls: 'task-meta-item tag-item',
          icon: 'tag',
          text: item.tag
        });
      }
      if (subs.length) {
        parts.push({
          cls: 'task-meta-item sub-item',
          icon: 'sublist',
          text: tr('tasks.subtasksCount', subDone + '/' + subs.length + ' subtarefas', { done: subDone, total: subs.length })
        });
      }
      if (item.notes && item.notes.trim()) {
        parts.push({
          cls: 'task-meta-item note-item',
          icon: null,
          text: tr('tasks.withNotes', 'Com anotações')
        });
      }
    }

    if (cfg.showCreated && item.createdAt) {
      const createdKey = item.createdAt.slice(0, 10);
      const formatted = formatShortDatePt(createdKey, todayStr);
      if (formatted) {
        parts.push({
          cls: 'task-meta-item created-item',
          icon: null,
          text: tr('tasks.createdOn', 'Criada em ' + formatted, { date: formatted })
        });
      }
    }

    if (!parts.length) return null;
    const row = el('div', 'task-meta');
    parts.forEach((p, idx) => {
      if (idx > 0) {
        const sep = el('span', 'task-meta-sep', '·');
        sep.setAttribute('aria-hidden', 'true');
        row.append(sep);
      }
      const span = el('span', p.cls);
      if (p.icon) span.innerHTML = svgIcon(p.icon);
      const txt = document.createElement('span');
      txt.textContent = p.text;
      span.append(txt);
      row.append(span);
    });
    return row;
  },

  renderDetails(item, todayStr) {
    const box = el('div', 'task-details');

    /* Linha de propriedades rápidas: Prazo, Prioridade, Categoria */
    const props = el('div', 'task-details-grid');

    // Prazo
    const dueField = el('div', 'task-detail-field');
    dueField.append(el('span', 'task-detail-label', tr('tasks.dueLabel', 'Prazo')));
    const dueControls = el('div', 'task-detail-due');
    const dInp = el('input', 'task-detail-input');
    dInp.type = 'date';
    dInp.value = item.dueDate || '';
    dInp.setAttribute('aria-label', tr('tasks.dueAria', 'Alterar prazo da tarefa'));
    dInp.addEventListener('change', () => {
      item.dueDate = normalizeDueDate(dInp.value);
      Store.save();
      this.render();
    });
    const dToday = el('button', 'task-mini-btn' + (item.dueDate === todayStr ? ' active' : ''), tr('tasks.dueToday', 'Hoje'));
    dToday.type = 'button';
    dToday.addEventListener('click', () => {
      item.dueDate = todayStr;
      Store.save();
      this.render();
    });
    const tomorrowStr = taskAddDaysKey(todayStr, 1);
    const dTom = el('button', 'task-mini-btn' + (item.dueDate === tomorrowStr ? ' active' : ''), tr('tasks.dueTomorrow', 'Amanhã'));
    dTom.type = 'button';
    dTom.addEventListener('click', () => {
      item.dueDate = tomorrowStr;
      Store.save();
      this.render();
    });
    const dClear = el('button', 'task-mini-btn', tr('tasks.clear', 'Limpar'));
    dClear.type = 'button';
    dClear.disabled = !item.dueDate;
    dClear.addEventListener('click', () => {
      item.dueDate = null;
      Store.save();
      this.render();
    });
    dueControls.append(dInp, dToday, dTom, dClear);
    dueField.append(dueControls);

    // Prioridade
    const prioField = el('div', 'task-detail-field');
    prioField.append(el('span', 'task-detail-label', tr('tasks.priority', 'Prioridade')));
    const prioGroup = el('div', 'task-detail-seg');
    TASK_PRIORITIES.forEach(p => {
      const pText = p.id === 'none' ? tr('panel.tasks.prioNone', 'Nenhuma') : tr('tasks.prio.' + p.id, p.short);
      const b = el('button', 'task-mini-btn' + ((item.priority || 'none') === p.id ? ' active' : ''), pText);
      b.type = 'button';
      b.addEventListener('click', () => {
        item.priority = p.id;
        Store.save();
        this.render();
      });
      prioGroup.append(b);
    });
    prioField.append(prioGroup);

    // Categoria
    const tagField = el('div', 'task-detail-field');
    tagField.append(el('span', 'task-detail-label', tr('tasks.category', 'Categoria')));
    const tInp = el('input', 'task-detail-input');
    tInp.type = 'text';
    tInp.maxLength = 32;
    tInp.placeholder = tr('tasks.categoryPlaceholder', 'Ex.: Estudos, Prova…');
    tInp.setAttribute('list', 'tasks-tag-list');
    tInp.value = item.tag || '';
    tInp.setAttribute('aria-label', tr('tasks.tagAria', 'Categoria'));
    tInp.addEventListener('change', () => {
      item.tag = normalizeTaskTag(tInp.value);
      Store.save();
      this.render();
    });
    tagField.append(tInp);

    props.append(dueField, prioField, tagField);
    box.append(props);

    // Anotações
    const notesField = el('div', 'task-detail-field');
    notesField.append(el('span', 'task-detail-label', tr('tasks.notes', 'Anotações')));
    const ta = el('textarea', 'task-detail-notes');
    ta.rows = 2;
    ta.maxLength = 1000;
    ta.placeholder = tr('tasks.notesPlaceholder', 'Detalhes, páginas, links ou critérios de conclusão…');
    ta.value = item.notes || '';
    ta.setAttribute('aria-label', tr('tasks.notes', 'Anotações'));
    ta.addEventListener('input', () => {
      item.notes = ta.value;
      Store.save();
    });
    ta.addEventListener('blur', () => {
      this.render();
    });
    notesField.append(ta);
    box.append(notesField);

    // Subtarefas
    const subsWrap = el('div', 'task-subtasks');
    const subs = Array.isArray(item.subtasks) ? item.subtasks : (item.subtasks = []);
    const subDone = subs.filter(s => s.done).length;
    subsWrap.append(el('span', 'task-detail-label', tr('tasks.subtasks', 'Subtarefas') + (subs.length ? ' (' + subDone + '/' + subs.length + ')' : '')));

    if (subs.length) {
      const ul = el('div', 'task-sub-list');
      subs.forEach(st => {
        const row = el('div', 'task-sub-row' + (st.done ? ' done' : ''));
        const cb = el('button', 'task-sub-check', svgIcon('check'));
        cb.type = 'button';
        cb.setAttribute('aria-label', st.done ? tr('tasks.reopenSub', 'Reabrir subtarefa') : tr('tasks.doneSub', 'Concluir subtarefa'));
        cb.addEventListener('click', () => {
          st.done = !st.done;
          Store.save();
          this.render();
        });
        const lbl = el('span', 'task-sub-txt');
        lbl.textContent = st.text;
        const rm = el('button', 'task-sub-del', svgIcon('close'));
        rm.type = 'button';
        rm.title = tr('tasks.removeSub', 'Remover subtarefa');
        rm.setAttribute('aria-label', rm.title);
        rm.addEventListener('click', () => {
          item.subtasks = item.subtasks.filter(x => x.id !== st.id);
          Store.save();
          this.render();
        });
        row.append(cb, lbl, rm);
        ul.append(row);
      });
      subsWrap.append(ul);
    }

    const subForm = el('form', 'task-sub-add');
    const subInp = el('input', 'task-sub-input');
    subInp.type = 'text';
    subInp.maxLength = 200;
    subInp.placeholder = tr('tasks.addSubPlaceholder', '+ Adicionar subtarefa…');
    subInp.setAttribute('aria-label', tr('tasks.newSubAria', 'Nova subtarefa'));
    const subBtn = el('button', 'task-sub-btn', svgIcon('plus'));
    subBtn.type = 'submit';
    subBtn.title = tr('tasks.addSubTitle', 'Adicionar subtarefa');
    subBtn.setAttribute('aria-label', subBtn.title);
    subForm.append(subInp, subBtn);
    subForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = subInp.value.trim();
      if (!val) return;
      item.subtasks.push({ id: uid(), text: val, done: false });
      Store.save();
      this.render();
      const focusBack = document.querySelector('.task[data-id="' + item.id + '"] .task-sub-input');
      if (focusBack) focusBack.focus();
    });
    subsWrap.append(subForm);
    box.append(subsWrap);

    return box;
  },

  render(withEnterAnim) {
    const cfg = Store.state.tasks;
    const todayStr = taskLocalDateKey();
    const stats = computeTaskStats(cfg.items, todayStr);
    this.syncTagDatalist(stats.tags);

    const items = filterAndSortTasks(cfg.items, {
      filter: this.filter,
      tag: this.tagFilter,
      query: this.query,
      sort: cfg.sort,
      doneLast: cfg.doneLast
    }, todayStr);

    // Atualiza contadores dos filtros
    const counts = {
      all: stats.total,
      pending: stats.pending,
      today: stats.dueToday,
      overdue: stats.overdue,
      done: stats.done
    };
    $$('#tasks-filters .filter-chip').forEach(btn => {
      const f = btn.dataset.filter;
      btn.classList.toggle('active', f === this.filter);
      const span = btn.querySelector('[data-fcount]');
      if (span) span.textContent = String(counts[f] != null ? counts[f] : 0);
    });

    // Barra de resumo e progresso
    const summaryBox = $('#tasks-summary');
    if (summaryBox) {
      summaryBox.hidden = !cfg.showProgress || stats.total === 0;
      if (!summaryBox.hidden) {
        const doneUnit = stats.total === 1 ? tr('tasks.doneOne', 'concluída') : tr('tasks.doneMany', 'concluídas');
        const summaryParts = [tr('tasks.summaryDone', stats.done + ' de ' + stats.total + ' ' + doneUnit, { done: stats.done, total: stats.total, unit: doneUnit })];
        if (stats.overdue > 0) {
          summaryParts.push(stats.overdue === 1
            ? tr('tasks.overdueOne', '1 atrasada', { n: 1 })
            : tr('tasks.overdueMany', stats.overdue + ' atrasadas', { n: stats.overdue }));
        }
        if (stats.dueToday > 0) summaryParts.push(tr('tasks.forToday', stats.dueToday + ' para hoje', { n: stats.dueToday }));
        $('#tasks-summary-text').textContent = summaryParts.join(' · ');
        $('#tasks-summary-pct').textContent = stats.percent + '%';
        $('#tasks-summary-fill').style.width = stats.percent + '%';
      }
    }

    const sortSelect = $('#tasks-sort');
    if (sortSelect) sortSelect.value = cfg.sort || 'recent';

    const list = $('#task-list');
    list.innerHTML = '';
    items.forEach(item => {
      const due = getDueInfo(item.dueDate, item.done, todayStr);
      const expanded = this.expandedIds.has(item.id);
      const cls = ['task'];
      if (item.done) cls.push('done');
      if (due.status === 'overdue' && cfg.highlightOverdue !== false) cls.push('is-overdue');
      if (due.status === 'today') cls.push('is-today');
      if (expanded) cls.push('expanded');

      const li = el('li', cls.join(' '));
      li.dataset.id = item.id;

      const main = el('div', 'task-main');

      const check = el('button', 'task-check', svgIcon('check'));
      check.type = 'button';
      check.title = item.done ? tr('tasks.reopenTask', 'Reabrir tarefa') : tr('tasks.doneTask', 'Concluir tarefa');
      check.setAttribute('aria-label', check.title);
      check.addEventListener('click', () => this.toggle(item.id));

      const body = el('div', 'task-body');
      const span = el('span', 'task-text');
      span.textContent = item.text;
      span.title = tr('tasks.dblClickEdit', 'Duplo clique para editar');
      span.addEventListener('dblclick', () => this.startEdit(item.id));
      body.append(span);

      const meta = this.renderMeta(item, cfg, todayStr);
      if (meta) body.append(meta);

      const actions = el('div', 'task-actions');

      if (!item.done) {
        const focusBtn = el('button', 'task-act-btn task-focus-btn', svgIcon('play'));
        focusBtn.type = 'button';
        focusBtn.title = tr('tasks.focusTask', 'Iniciar foco nesta tarefa');
        focusBtn.setAttribute('aria-label', focusBtn.title);
        focusBtn.addEventListener('click', () => this.focusTask(item));
        actions.append(focusBtn);
      }

      const hasExtra = !!(item.notes && item.notes.trim()) || (Array.isArray(item.subtasks) && item.subtasks.length > 0);
      const expBtn = el('button', 'task-act-btn task-expand-btn' + (expanded ? ' open' : '') + (hasExtra ? ' has-extra' : ''), svgIcon('chevD'));
      expBtn.type = 'button';
      expBtn.title = expanded ? tr('tasks.hideDetails', 'Ocultar detalhes') : tr('tasks.showDetails', 'Detalhes, prazo, notas e subtarefas');
      expBtn.setAttribute('aria-label', expBtn.title);
      expBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      expBtn.addEventListener('click', () => this.toggleExpand(item.id));

      const edit = el('button', 'task-act-btn task-edit-btn', svgIcon('pencil'));
      edit.type = 'button';
      edit.title = tr('tasks.rename', 'Renomear');
      edit.setAttribute('aria-label', tr('tasks.editTaskAria', 'Editar tarefa'));
      edit.addEventListener('click', () => this.startEdit(item.id));

      const del = el('button', 'task-act-btn task-del', svgIcon('trash'));
      del.type = 'button';
      del.title = tr('tasks.delete', 'Excluir');
      del.setAttribute('aria-label', tr('tasks.deleteTaskAria', 'Excluir tarefa'));
      del.addEventListener('click', () => this.remove(item.id));

      actions.append(expBtn, edit, del);
      main.append(check, body, actions);
      li.append(main);

      if (expanded) {
        li.append(this.renderDetails(item, todayStr));
      }

      list.append(li);
    });

    const overduePart = stats.overdue > 0
      ? ' · ' + (stats.overdue === 1
        ? tr('tasks.overdueOne', '1 atrasada', { n: 1 })
        : tr('tasks.overdueMany', stats.overdue + ' atrasadas', { n: stats.overdue }))
      : '';
    $('#tasks-count').textContent = stats.pending === 0
      ? (cfg.items.length ? tr('tasks.countAllDone', 'tudo em ordem') : tr('tasks.countClean', 'uma lista limpa, uma mente limpa'))
      : (stats.pending === 1
        ? tr('tasks.countPendingOne', '1 pendente')
        : tr('tasks.countPendingMany', stats.pending + ' pendentes', { n: stats.pending })) + overduePart;

    const emptyEl = $('#tasks-empty');
    if (items.length) {
      emptyEl.style.display = 'none';
    } else {
      emptyEl.style.display = 'block';
      const hasAnyFilter = !!(this.query.trim() || this.filter !== 'all' || this.tagFilter !== 'all');
      if (cfg.items.length && hasAnyFilter) {
        emptyEl.innerHTML =
          '<p>' + tr('tasks.emptyFiltered', 'Nenhuma tarefa corresponde à busca ou aos filtros ativos.') + '</p>' +
          '<button type="button" class="tasks-empty-reset" id="tasks-empty-reset">' + tr('tasks.emptyReset', 'Limpar busca e filtros') + '</button>';
        const resetBtn = $('#tasks-empty-reset');
        if (resetBtn) {
          resetBtn.addEventListener('click', () => {
            this.query = '';
            this.filter = 'all';
            this.tagFilter = 'all';
            const sInp = $('#tasks-search');
            const sClr = $('#tasks-search-clear');
            if (sInp) sInp.value = '';
            if (sClr) sClr.hidden = true;
            this.render();
          });
        }
      } else {
        emptyEl.innerHTML = tr('tasks.emptyDefault', 'Nada por aqui.<br>Adicione sua primeira tarefa com prazo, prioridade ou categoria.');
      }
    }

    $('#tasks-clear').style.visibility = cfg.items.some(t => t.done) ? 'visible' : 'hidden';

    if (withEnterAnim) {
      const first = list.firstElementChild;
      if (first) {
        first.classList.add('enter');
        first.addEventListener('animationend', () => first.classList.remove('enter'), { once: true });
      }
    }
  }
};
