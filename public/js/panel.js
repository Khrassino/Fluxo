'use strict';
/* ============ panel.js — painel de personalização ============ */

const ACCENT_PRESETS = [
  { id: '#ff7a59', label: 'Coral',   color: '#ff7a59' },
  { id: '#4ecb9d', label: 'Menta',   color: '#4ecb9d' },
  { id: '#58b7ff', label: 'Céu',     color: '#58b7ff' },
  { id: '#a78bfa', label: 'Violeta', color: '#a78bfa' },
  { id: '#f2b84b', label: 'Ouro',    color: '#f2b84b' },
  { id: '#f472b6', label: 'Rosa',    color: '#f472b6' }
];

/* ---- construtores padronizados de controles ---- */
function pSection(icon, title) {
  const sec = el('div', 'panel-section');
  sec.append(el('h3', null, svgIcon(icon) + '<span>' + title + '</span>'));
  return sec;
}
function pSub(title, badge) {
  const h = el('h4', 'panel-sub');
  h.append(el('span', null, title));
  if (badge) h.append(el('span', 'panel-badge-test', badge));
  return h;
}
function pCtl(labelHtml) {
  const c = el('div', 'ctl');
  if (labelHtml) c.append(el('div', 'ctl-label', labelHtml));
  return c;
}
function pGroup(dimmed) {
  const g = el('div', 'ctl-group' + (dimmed ? ' is-dimmed' : ''));
  return g;
}
function lockGroup(group, locked, reason) {
  if (!group) return group;
  const isLocked = !!locked;
  if (group.classList && typeof group.classList.toggle === 'function') {
    group.classList.toggle('is-dimmed', isLocked);
  }
  const walk = (node) => {
    if (!node || !Array.isArray(node.children)) return;
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (!child) continue;
      const tag = String(child.tagName || '').toUpperCase();
      if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
        if (isLocked) {
          child.disabled = true;
          child.tabIndex = -1;
          if (typeof child.setAttribute === 'function') child.setAttribute('aria-disabled', 'true');
        } else {
          if (!(child.dataset && child.dataset.keepDisabled === '1')) {
            child.disabled = false;
            child.tabIndex = 0;
            if (typeof child.removeAttribute === 'function') child.removeAttribute('aria-disabled');
          }
        }
        if (child.classList && child.classList.contains('switch')) {
          child.classList.toggle('is-disabled', isLocked);
        }
      }
      if (child.classList && child.classList.contains('switch-row')) {
        child.classList.toggle('is-dimmed', isLocked);
      }
      walk(child);
    }
  };
  walk(group);
  if (typeof group.querySelectorAll === 'function') {
    Array.from(group.querySelectorAll('.panel-lock-note')).forEach(n => {
      if (n && typeof n.remove === 'function') n.remove();
    });
  }
  if (isLocked && reason) {
    group.append(el('p', 'panel-lock-note', reason));
  }
  return group;
}
function actionRow(buttons) {
  const row = el('div', 'panel-actions');
  buttons.forEach(b => row.append(b));
  return row;
}
function chipGroup(options, active, onPick) {
  const grid = el('div', 'chip-grid');
  options.forEach(o => {
    const isActive = o.id === active;
    const b = el('button', 'chip' + (isActive ? ' active' : ''));
    b.type = 'button';
    b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    if (o.icon) b.innerHTML = svgIcon(o.icon) + '<span>' + o.label + '</span>';
    else b.textContent = o.label;
    if (o.cls) b.classList.add(o.cls);
    if (o.style) Object.assign(b.style, o.style);
    if (o.disabled) {
      b.disabled = true;
      b.tabIndex = -1;
      b.setAttribute('aria-disabled', 'true');
      b.dataset.keepDisabled = '1';
    }
    b.addEventListener('click', () => {
      if (b.disabled) return;
      onPick(o.id);
    });
    grid.append(b);
  });
  return grid;
}
function sliderRow(label, min, max, value, fmt, onInput, step) {
  const c = el('div', 'ctl');
  const lab = el('div', 'ctl-label', '<span>' + label + '</span><b></b>');
  const b = lab.querySelector('b');
  b.textContent = fmt(value);
  const input = el('input');
  input.type = 'range';
  input.min = min;
  input.max = max;
  input.step = step || 1;
  input.value = value;
  input.setAttribute('aria-label', label);
  input.addEventListener('input', () => {
    if (input.disabled) return;
    b.textContent = fmt(+input.value);
    onInput(+input.value);
  });
  c.append(lab, input);
  return c;
}
function switchRow(label, checked, onChange, opts) {
  const locked = !!(opts && opts.locked);
  const isDisabled = !!(opts && opts.disabled);
  const isDimmed = isDisabled || !!(opts && opts.dimmed);
  const row = el('div', 'switch-row' + (isDimmed ? ' is-dimmed' : ''), '<span>' + label + '</span>');
  if (locked) {
    const tag = el('span', 'switch-locked', (opts && opts.lockedText) || tr('panel.alwaysVisible', 'Sempre visível'));
    row.append(tag);
    return row;
  }
  const sw = el('button', 'switch' + (checked ? ' on' : '') + (isDisabled ? ' is-disabled' : ''));
  sw.type = 'button';
  sw.setAttribute('role', 'switch');
  sw.setAttribute('aria-checked', checked ? 'true' : 'false');
  sw.setAttribute('aria-label', label);
  if (isDisabled) {
    sw.disabled = true;
    sw.tabIndex = -1;
    sw.setAttribute('aria-disabled', 'true');
    sw.dataset.keepDisabled = '1';
  }
  sw.addEventListener('click', () => {
    if (sw.disabled) return;
    const on = !sw.classList.contains('on');
    sw.classList.toggle('on', on);
    sw.setAttribute('aria-checked', on ? 'true' : 'false');
    onChange(on);
  });
  row.append(sw);
  return row;
}
function numRow(label, value, min, max, onChange, compact) {
  const row = el('div', compact ? 'num-cell' : 'num-row');
  const lab = el('label', null, label);
  const inp = el('input');
  inp.type = 'number';
  inp.min = min;
  inp.max = max;
  inp.value = value;
  inp.setAttribute('aria-label', label);
  inp.addEventListener('change', () => {
    const v = clamp(Math.round(+inp.value || min), min, max);
    inp.value = v;
    onChange(v);
  });
  row.append(lab, inp);
  return row;
}
function uploadBtn(label, accept, onFile) {
  const lab = el('label', 'upload-btn', svgIcon('upload') + '<span>' + label + '</span>');
  const inp = el('input');
  inp.type = 'file';
  inp.accept = accept;
  inp.addEventListener('change', () => {
    const f = inp.files[0];
    inp.value = '';
    if (f) onFile(f);
  });
  lab.append(inp);
  return lab;
}
function colorField(label, value, onChange) {
  const row = el('div', 'color-field');
  row.append(el('span', 'color-field-label', label));
  const picker = el('input');
  picker.type = 'color';
  picker.value = value;
  picker.title = label;
  picker.setAttribute('aria-label', label);
  picker.addEventListener('input', () => onChange(picker.value));
  row.append(picker);
  return row;
}
function accentColorControl(label, currentValue, onChange) {
  const val = (currentValue || '').trim();
  const valLower = val.toLowerCase();
  const isPreset = ACCENT_PRESETS.some(p => p.id.toLowerCase() === valLower);
  const isCustom = !!val && !isPreset;

  const ctl = pCtl('<span>' + label + '</span>');
  const grid = el('div', 'accent-grid');

  const themeBtn = el('button', 'chip' + (!val ? ' active' : ''), tr('panel.themeColor', 'Cor do tema'));
  themeBtn.type = 'button';
  themeBtn.setAttribute('aria-pressed', !val ? 'true' : 'false');

  const dots = [];
  const customWrap = el('label', 'accent-custom' + (isCustom ? ' active' : ''));
  customWrap.title = tr('panel.customColor', 'Cor personalizada');

  const syncActive = (nextVal) => {
    const norm = (nextVal || '').trim().toLowerCase();
    const matchedPreset = ACCENT_PRESETS.some(p => p.id.toLowerCase() === norm);
    themeBtn.classList.toggle('active', !norm);
    themeBtn.setAttribute('aria-pressed', !norm ? 'true' : 'false');
    dots.forEach(({ btn, id }) => {
      const hit = id.toLowerCase() === norm;
      btn.classList.toggle('active', hit);
      btn.setAttribute('aria-pressed', hit ? 'true' : 'false');
    });
    customWrap.classList.toggle('active', !!norm && !matchedPreset);
  };

  themeBtn.addEventListener('click', () => {
    syncActive('');
    onChange('');
  });
  grid.append(themeBtn);

  ACCENT_PRESETS.forEach(p => {
    const active = valLower === p.id.toLowerCase();
    const dot = el('button', 'accent-dot' + (active ? ' active' : ''));
    dot.type = 'button';
    dot.style.background = p.color;
    dot.title = p.label;
    dot.setAttribute('aria-label', p.label);
    dot.setAttribute('aria-pressed', active ? 'true' : 'false');
    dot.addEventListener('click', () => {
      syncActive(p.id);
      onChange(p.id);
    });
    dots.push({ btn: dot, id: p.id });
    grid.append(dot);
  });

  const picker = el('input');
  picker.type = 'color';
  picker.value = val || '#8fa2ff';
  picker.title = tr('panel.customColor', 'Cor personalizada');
  picker.setAttribute('aria-label', label + ' · ' + tr('panel.customColor', 'Cor personalizada'));
  picker.addEventListener('input', () => {
    syncActive(picker.value);
    onChange(picker.value);
  });
  customWrap.append(picker);
  grid.append(customWrap);

  ctl.append(grid);
  return ctl;
}

/* ---- ordem lógica das gavetas: Aparência -> Páginas (na ordem da navegação) -> Sistema ---- */
const PANEL_DRAWERS = [
  { id: 'themes',     label: 'Temas e cores',           icon: 'palette', group: 'Aparência' },
  { id: 'appearance', label: 'Papel de parede e fonte', icon: 'image',   group: 'Aparência' },
  { id: 'effects',    label: 'Efeitos',                 icon: 'motion',  group: 'Aparência' },
  { id: 'music',      label: 'Música e atmosfera',      icon: 'music',   group: 'Aparência' },
  { id: 'home',       label: 'Início',                  icon: 'home',    group: 'Páginas' },
  { id: 'timer',      label: 'Cronômetro',              icon: 'timer',   group: 'Páginas' },
  { id: 'tracker',    label: 'Progresso',               icon: 'chart',   group: 'Páginas' },
  { id: 'tasks',      label: 'Tarefas',                 icon: 'tasks',   group: 'Páginas' },
  { id: 'general',    label: 'Geral',                   icon: 'sliders', group: 'Sistema' }
];

const Panel = {
  openId: 'themes',
  confirmingReset: false,
  pendingBackup: null,
  editingQuoteId: null,

  init() {
    $('#panel-close').innerHTML = svgIcon('close');
    const closeLabel = tr('panel.close', 'Fechar personalização');
    $('#panel-close').title = closeLabel;
    $('#panel-close').setAttribute('aria-label', closeLabel);
    $('#panel-close').addEventListener('click', () => this.close());
    $('#panel-backdrop').addEventListener('click', () => this.close());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
    this.render();
  },

  open() {
    document.body.classList.add('panel-open');
    if (typeof Idle !== 'undefined') Idle.wake();
    this.render();
  },
  close() {
    this.confirmingReset = false;
    this.pendingBackup = null;
    this.editingQuoteId = null;
    document.body.classList.remove('panel-open');
    if (typeof Idle !== 'undefined') Idle.wake();
  },
  toggle() {
    if (document.body.classList.contains('panel-open')) this.close();
    else this.open();
  },

  openDrawer(id) {
    this.openId = id;
    this.confirmingReset = false;
    this.pendingBackup = null;
    this.editingQuoteId = null;
    this.render();
    const head = $('#panel-body .panel-drawer.open .drawer-head');
    if (head) head.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  },

  buildDrawer(id) {
    const builders = {
      themes:     () => this.themesSection(),
      appearance: () => this.appearanceSection(),
      effects:    () => this.effectsSection(),
      music:      () => this.musicSection(),
      home:       () => this.homeSection(),
      timer:      () => this.timerSection(),
      tracker:    () => this.trackerSection(),
      tasks:      () => this.tasksSection(),
      general:    () => this.generalSection()
    };
    return (builders[id] || builders.themes)();
  },

  toggleDrawer(id) {
    this.openId = this.openId === id ? null : id;
    this.confirmingReset = false;
    this.pendingBackup = null;
    this.editingQuoteId = null;
    this.render();
    const head = $('#panel-body .panel-drawer.open .drawer-head');
    if (head) head.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  },

  render() {
    const body = $('#panel-body');
    if (!body) return;
    const scroll = body.scrollTop;
    body.innerHTML = '';

    const groupKeyMap = {
      'Aparência': 'panel.group.appearance',
      'Páginas': 'panel.group.pages',
      'Sistema': 'panel.group.system'
    };

    let lastGroup = null;
    PANEL_DRAWERS.forEach((d, idx) => {
      if (d.group !== lastGroup) {
        lastGroup = d.group;
        const gLabel = tr(groupKeyMap[d.group] || d.group, d.group);
        body.append(el('div', 'panel-group-label', gLabel));
      }
      const next = PANEL_DRAWERS[idx + 1];
      const isGroupLast = !next || next.group !== d.group;
      const open = d.id === this.openId;
      const drawer = el('section', 'panel-drawer' + (open ? ' open' : '') + (isGroupLast ? ' group-last' : ''));
      drawer.dataset.drawer = d.id;

      const dLabel = tr('panel.drawer.' + d.id, d.label);
      const head = el('button', 'drawer-head');
      head.type = 'button';
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
      head.innerHTML =
        '<span class="drawer-icon">' + svgIcon(d.icon) + '</span>' +
        '<span class="drawer-title">' + dLabel + '</span>' +
        '<span class="drawer-chev">' + svgIcon('chevD') + '</span>';
      head.addEventListener('click', () => this.toggleDrawer(d.id));

      const wrap = el('div', 'drawer-body');
      const inner = el('div', 'drawer-inner');
      if (open) inner.append(this.buildDrawer(d.id));
      wrap.append(inner);
      drawer.append(head, wrap);
      body.append(drawer);
    });

    body.scrollTop = scroll;
  },

  /* ================= 1. temas e cores ================= */
  themesSection() {
    const a = Store.state.appearance;
    const sec = pSection('palette', tr('panel.drawer.themes', 'Temas e cores'));
    const activeMusic = typeof Themes !== 'undefined' && typeof Themes.activeMusicTheme === 'function'
      ? Themes.activeMusicTheme() : null;
    const musicLocked = !!activeMusic;
    const trackTitle = activeMusic && activeMusic.meta ? activeMusic.meta.title : (activeMusic ? activeMusic.id : '');

    if (musicLocked) {
      const hint = el('div', 'panel-hint-box', '<span>' + tr('panel.lock.musicThemeOn', 'Bloqueado enquanto o tema automático da música "{track}" estiver ativo.', { track: trackTitle }) + '</span>');
      const goBtn = el('button', 'panel-hint-link', tr('panel.lock.openMusic', 'Abrir música'));
      goBtn.type = 'button';
      goBtn.addEventListener('click', () => this.openDrawer('music'));
      hint.append(goBtn);
      sec.append(hint);
    }

    const themeLockGroup = pGroup(musicLocked);
    themeLockGroup.append(pSub(tr('panel.themes.sub', 'Tema')));
    const themeCtl = pCtl();

    const makeThemeCard = (item, extraCls) => {
      const label = typeof getThemeLabel === 'function' ? getThemeLabel(item.id) : item.label;
      const active = item.id === a.theme;
      const b = el('button', 'theme-card' + (extraCls ? ' ' + extraCls : '') + (active ? ' active' : ''));
      b.type = 'button';
      b.dataset.theme = item.id;
      b.title = label;
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
      const customTheme = item.id === 'custom';
      const bg = customTheme ? (a.custom.bg || item.bg) : item.bg;
      const accent = customTheme ? (a.custom.accent || item.accent) : item.accent;
      const accent2 = customTheme ? (a.custom.accent2 || item.accent2) : item.accent2;
      const ink = customTheme ? (a.custom.text || item.ink) : item.ink;
      b.style.setProperty('--tc-bg', bg);
      b.style.setProperty('--tc-accent', accent);
      b.style.setProperty('--tc-accent2', accent2);
      b.style.setProperty('--tc-ink', ink);
      b.innerHTML =
        '<span class="theme-dots" aria-hidden="true"><i></i><i></i></span>' +
        '<span class="theme-name">' + label + '</span>' +
        '<span class="theme-check" aria-hidden="true">' + (active ? svgIcon('check') : '') + '</span>';
      b.addEventListener('click', () => {
        if (b.disabled) return;
        Store.state.appearance.theme = item.id;
        Themes.apply();
        Store.save();
        this.render();
      });
      return b;
    };

    const darkThemes = THEMES.filter(item => item.tone !== 'light' && item.tone !== 'custom');
    const lightThemes = THEMES.filter(item => item.tone === 'light');
    const customThemeItem = THEMES.find(item => item.id === 'custom');

    if (darkThemes.length) {
      themeCtl.append(el('div', 'panel-mini-label', tr('panel.themes.darkGroup', 'Escuros')));
      const darkGrid = el('div', 'theme-grid');
      darkThemes.forEach(item => darkGrid.append(makeThemeCard(item)));
      themeCtl.append(darkGrid);
    }
    if (lightThemes.length) {
      themeCtl.append(el('div', 'panel-mini-label', tr('panel.themes.lightGroup', 'Claros')));
      const lightGrid = el('div', 'theme-grid');
      lightThemes.forEach(item => lightGrid.append(makeThemeCard(item)));
      themeCtl.append(lightGrid);
    }
    if (customThemeItem) {
      const customWrap = el('div', 'theme-grid theme-grid-custom');
      customWrap.append(makeThemeCard(customThemeItem, 'theme-card-custom'));
      themeCtl.append(customWrap);
    }

    themeLockGroup.append(themeCtl);

    if (a.theme === 'custom') {
      themeLockGroup.append(pSub(tr('panel.themes.customSub', 'Cores do tema personalizado')));
      const c = a.custom || {};
      const grid = el('div', 'custom-colors');
      const set = (key, val) => {
        Store.state.appearance.custom[key] = val;
        Themes.apply();
        Store.save();
      };
      grid.append(colorField(tr('panel.themes.bg', 'Fundo'), c.bg || '#0a0e1e', v => set('bg', v)));
      grid.append(colorField(tr('panel.themes.accent', 'Destaque'), c.accent || '#8fa2ff', v => set('accent', v)));
      grid.append(colorField(tr('panel.themes.accent2', 'Destaque 2'), c.accent2 || '#5fe3c4', v => set('accent2', v)));
      grid.append(colorField(tr('panel.themes.text', 'Texto'), c.text || '#edf1ff', v => set('text', v)));
      themeLockGroup.append(grid);

      themeLockGroup.append(sliderRow(tr('panel.themes.glass', 'Vidro (opacidade)'), 0, 100, c.glass == null ? 55 : c.glass, v => v + '%', v => {
        Store.state.appearance.custom.glass = v;
        Themes.apply();
        Store.save();
      }));

      const reset = el('button', 'chip', svgIcon('reset') + '<span>' + tr('panel.restoreDefault', 'Restaurar padrão') + '</span>');
      reset.type = 'button';
      reset.addEventListener('click', () => {
        if (reset.disabled) return;
        Store.state.appearance.custom = Store.defaults().appearance.custom;
        Themes.apply();
        Store.save();
        this.render();
      });
      themeLockGroup.append(actionRow([reset]));
    }

    lockGroup(themeLockGroup, musicLocked);
    sec.append(themeLockGroup);
    return sec;
  },

  /* ================= 2. papel de parede e fonte ================= */
  appearanceSection() {
    const a = Store.state.appearance;
    const sec = pSection('image', tr('panel.drawer.appearance', 'Papel de parede e fonte'));
    const activeMusic = typeof Themes !== 'undefined' && typeof Themes.activeMusicTheme === 'function'
      ? Themes.activeMusicTheme() : null;
    const musicLocked = !!activeMusic;
    const trackTitle = activeMusic && activeMusic.meta ? activeMusic.meta.title : (activeMusic ? activeMusic.id : '');

    if (musicLocked) {
      const hint = el('div', 'panel-hint-box', '<span>' + tr('panel.lock.musicThemeOn', 'Bloqueado enquanto o tema automático da música "{track}" estiver ativo.', { track: trackTitle }) + '</span>');
      const goBtn = el('button', 'panel-hint-link', tr('panel.lock.openMusic', 'Abrir música'));
      goBtn.type = 'button';
      goBtn.addEventListener('click', () => this.openDrawer('music'));
      hint.append(goBtn);
      sec.append(hint);
    }

    const wpGroup = pGroup(musicLocked);
    wpGroup.append(pSub(tr('panel.app.wallpaper', 'Papel de parede')));
    const wpCtl = pCtl();

    const uploadControl = uploadBtn(Themes.customWallpaperUrl ? tr('panel.app.changeImage', 'Trocar imagem') : tr('panel.app.sendImage', 'Enviar imagem'), 'image/*', async (file) => {
      if (!file.type.startsWith('image/')) { toast(tr('panel.app.chooseImageErr', 'Escolha um arquivo de imagem'), 'close'); return; }
      if (file.size > 8 * 1024 * 1024) { toast(tr('panel.app.imageTooBig', 'Imagem muito grande (máx. 8 MB)'), 'close'); return; }
      try {
        const url = await readFileAsDataURL(file);
        await Files.put('customWallpaper', url);
        Themes.customWallpaperUrl = url;
        Store.state.appearance.wallpaper = 'custom';
        Store.save();
        Themes.apply();
        this.render();
        toast(tr('panel.app.imageSaved', 'Papel de parede atualizado'), 'image');
      } catch (e) { toast(tr('panel.app.imageSaveErr', 'Não foi possível salvar a imagem'), 'close'); }
    });

    const makeWallCard = (w) => {
      const label = typeof getWallpaperLabel === 'function' ? getWallpaperLabel(w.id) : w.label;
      const active = w.id === a.wallpaper;
      const b = el('button', 'wall-card' + (active ? ' active' : ''));
      b.type = 'button';
      b.dataset.wallpaper = w.id;
      b.title = label;
      b.setAttribute('aria-pressed', active ? 'true' : 'false');

      const thumb = el('span', 'wall-thumb' + (w.id === 'nenhum' ? ' is-pure' : ''));
      thumb.style.background = w.id === 'nenhum' ? 'var(--bg)' : w.bg;
      if (w.id === 'nenhum') thumb.innerHTML = '<span class="wall-pure-dot" aria-hidden="true"></span>';

      const name = el('span', 'wall-name', label);
      b.append(thumb, name);
      b.addEventListener('click', () => {
        if (b.disabled) return;
        Store.state.appearance.wallpaper = w.id;
        Themes.apply();
        Store.save();
        this.render();
      });
      return b;
    };

    const atmosWps = WALLPAPERS.filter(w => w.group !== 'light');
    const lightWps = WALLPAPERS.filter(w => w.group === 'light');

    if (atmosWps.length) {
      wpCtl.append(el('div', 'panel-mini-label', tr('panel.app.wpAtmos', 'Atmosféricos')));
      const atmosGrid = el('div', 'wall-grid');
      atmosWps.forEach(w => atmosGrid.append(makeWallCard(w)));
      wpCtl.append(atmosGrid);
    }

    wpCtl.append(el('div', 'panel-mini-label', tr('panel.app.wpMinimal', 'Claros e neutros')));
    const minGrid = el('div', 'wall-grid');
    lightWps.forEach(w => minGrid.append(makeWallCard(w)));

    const customActive = a.wallpaper === 'custom';
    const custom = el('button', 'wall-card' + (customActive ? ' active' : ''));
    custom.type = 'button';
    custom.dataset.wallpaper = 'custom';
    const yourImg = tr('panel.app.yourImage', 'Sua imagem');
    custom.title = yourImg;
    custom.setAttribute('aria-pressed', customActive ? 'true' : 'false');
    const customThumb = el('span', 'wall-thumb' + (Themes.customWallpaperUrl ? '' : ' is-empty'));
    if (Themes.customWallpaperUrl) {
      customThumb.style.background = 'url("' + Themes.customWallpaperUrl + '") center / cover no-repeat';
    } else {
      customThumb.innerHTML = svgIcon('image');
    }
    custom.append(customThumb, el('span', 'wall-name', yourImg));
    custom.addEventListener('click', () => {
      if (custom.disabled) return;
      if (!Themes.customWallpaperUrl) {
        const fileInp = uploadControl.querySelector('input[type="file"]');
        if (fileInp && typeof fileInp.click === 'function') fileInp.click();
        else toast(tr('panel.app.sendFirst', 'Envie uma imagem primeiro'), 'image');
        return;
      }
      Store.state.appearance.wallpaper = 'custom';
      Themes.apply();
      Store.save();
      this.render();
    });
    minGrid.append(custom);
    wpCtl.append(minGrid);

    const wpBtns = [uploadControl];
    if (Themes.customWallpaperUrl) {
      const rm = el('button', 'chip', tr('panel.app.removeImage', 'Remover imagem'));
      rm.type = 'button';
      rm.addEventListener('click', async () => {
        if (rm.disabled) return;
        await Files.del('customWallpaper');
        Themes.customWallpaperUrl = null;
        if (Store.state.appearance.wallpaper === 'custom') Store.state.appearance.wallpaper = 'aurora';
        Store.save();
        Themes.apply();
        this.render();
      });
      wpBtns.push(rm);
    }
    wpCtl.append(actionRow(wpBtns));
    wpGroup.append(wpCtl);
    lockGroup(wpGroup, musicLocked);
    sec.append(wpGroup);

    sec.append(pSub(tr('panel.app.uiFontSub', 'Tipografia da interface')));
    const fontCtl = pCtl('<span>' + tr('panel.app.font', 'Fonte') + '</span>');
    Themes.ensureFonts(UI_FONTS.map(f => f.id));
    fontCtl.append(chipGroup(
      UI_FONTS.map(f => ({ id: f.id, label: f.label, cls: 'font-chip', style: { fontFamily: f.family } })),
      a.uiFont,
      (id) => {
        Store.state.appearance.uiFont = id;
        Themes.apply();
        Store.save();
        this.render();
      }
    ));
    sec.append(fontCtl);
    return sec;
  },

  /* ================= 3. efeitos ================= */
  effectsSection() {
    const m = Store.state.motion;
    const p = Store.state.particles;
    const mu = Store.state.music || {};
    const fx = Store.state.effects || (Store.state.effects = { level: 'full' });
    const globalOff = fx.level === 'off';
    const sec = pSection('motion', tr('panel.drawer.effects', 'Efeitos'));

    const activeThematic = !globalOff && typeof Sound !== 'undefined' && Sound.playing && typeof getThematicTrack === 'function'
      ? getThematicTrack(mu.track) : null;
    const musicParticlesLocked = !!(activeThematic && mu.visualEffects !== false && mu.sceneParticles !== false);

    sec.append(pSub(tr('panel.fx.perf', 'Desempenho')));
    const lvlCtl = pCtl('<span>' + tr('panel.fx.globalLevel', 'Nível global de efeitos') + '</span>');
    lvlCtl.append(chipGroup([
      { id: 'full',    label: tr('panel.fx.full', 'Completos') },
      { id: 'reduced', label: tr('panel.fx.reduced', 'Reduzidos') },
      { id: 'off',     label: tr('panel.fx.off', 'Desligados') }
    ], fx.level || 'full', (id) => {
      fx.level = id;
      Motion.readState();
      Store.save();
      this.render();
    }));
    sec.append(lvlCtl);
    sec.append(el('p', 'panel-note', tr('panel.fx.perfNote', 'Reduzidos deixam o fundo mais discreto e econômico. Desligados pausam movimento e partículas (a Área de Trabalho já pausa tudo automaticamente).')));

    sec.append(pSub(tr('panel.fx.motionSub', 'Movimento do fundo')));
    sec.append(switchRow(tr('panel.fx.motionOn', 'Movimento ativado'), m.enabled, (on) => {
      Store.state.motion.enabled = on;
      Motion.readState();
      Store.save();
      this.render();
    }, { disabled: globalOff }));

    const mGroup = pGroup(globalOff || !m.enabled);
    const mStyleCtl = pCtl('<span>' + tr('panel.fx.style', 'Estilo') + '</span>');
    mStyleCtl.append(chipGroup(
      MOTION_MODES.map(item => ({
        id: item.id,
        label: typeof getMotionModeLabel === 'function' ? getMotionModeLabel(item.id) : item.label
      })),
      m.mode,
      (id) => {
        Store.state.motion.mode = id;
        Motion.readState();
        Store.save();
        this.render();
      }
    ));
    mGroup.append(mStyleCtl);
    mGroup.append(sliderRow(tr('panel.fx.intensity', 'Intensidade'), 0, 100, m.intensity, v => v + '%', v => {
      Store.state.motion.intensity = v;
      Motion.readState();
      Store.save();
    }));
    mGroup.append(sliderRow(tr('panel.fx.smoothness', 'Suavidade'), 0, 100, m.smoothness, v => v + '%', v => {
      Store.state.motion.smoothness = v;
      Motion.readState();
      Store.save();
    }));
    lockGroup(
      mGroup,
      globalOff || !m.enabled,
      globalOff ? tr('panel.lock.effectsOff', 'Bloqueado porque os efeitos globais estão desligados.') : (!m.enabled ? tr('panel.lock.motionOff', 'Ative o movimento do fundo para ajustar estes controles.') : '')
    );
    sec.append(mGroup);
    sec.append(el('p', 'panel-note', tr('panel.fx.motionNote', 'Todos os estilos reagem ao mouse. Deslizar, Profundidade, Inclinação, Balanço e Deriva mudam como o fundo acompanha o ponteiro.')));

    sec.append(pSub(tr('panel.fx.particlesSub', 'Partículas')));
    sec.append(switchRow(tr('panel.fx.particlesOn', 'Partículas ativadas'), p.enabled, (on) => {
      Store.state.particles.enabled = on;
      Motion.readState();
      Store.save();
      this.render();
    }, { disabled: globalOff || musicParticlesLocked }));

    const pLocked = globalOff || !p.enabled || musicParticlesLocked;
    const pReason = globalOff
      ? tr('panel.lock.effectsOff', 'Bloqueado porque os efeitos globais estão desligados.')
      : (musicParticlesLocked
        ? tr('panel.lock.musicParticlesOn', 'Controlado pelas partículas da música "{track}" enquanto ela toca.', { track: activeThematic.title })
        : (!p.enabled ? tr('panel.lock.particlesOff', 'Ative as partículas para personalizar estilo e densidade.') : ''));

    const pGroupBox = pGroup(pLocked);
    const pStyleCtl = pCtl('<span>' + tr('panel.fx.style', 'Estilo') + '</span>');
    pStyleCtl.append(chipGroup(
      PARTICLE_STYLES.map(item => ({
        id: item.id,
        label: typeof getParticleStyleLabel === 'function' ? getParticleStyleLabel(item.id) : item.label
      })),
      p.style,
      (id) => {
        Store.state.particles.style = id;
        Motion.readState();
        Store.save();
        this.render();
      }
    ));
    pGroupBox.append(pStyleCtl);
    pGroupBox.append(sliderRow(tr('panel.fx.amount', 'Quantidade'), 0, 100, p.amount, v => v + '%', v => {
      Store.state.particles.amount = v;
      Motion.readState();
      Store.save();
    }));
    pGroupBox.append(switchRow(tr('panel.fx.interactive', 'Interagir com o mouse'), p.interactive, (on) => {
      Store.state.particles.interactive = on;
      Motion.readState();
      Store.save();
    }));
    lockGroup(pGroupBox, pLocked, pReason);
    sec.append(pGroupBox);
    sec.append(el('p', 'panel-note', tr('panel.fx.particlesNote', 'Chuva cai e desvia de leve do mouse; Onda cria ondas circulares; Poeira flutua; Tela molhada escorre; Neve deriva; Teclas faz teclas subirem e destaca as teclas que você digitar.')));
    return sec;
  },

  /* ================= 4. música e atmosfera ================= */
  musicSection() {
    const m = Store.state.music || {};
    const fx = Store.state.effects || { level: 'full' };
    const globalOff = fx.level === 'off';
    const sec = pSection('music', tr('panel.drawer.music', 'Música e atmosfera'));
    const tracks = typeof CUSTOM_THEMATIC_TRACKS !== 'undefined' ? CUSTOM_THEMATIC_TRACKS : [];

    sec.append(pSub(tr('panel.music.thematicSub', 'Músicas temáticas'), tr('panel.music.testBadge', 'Testes')));
    sec.append(el('p', 'panel-note', tr('panel.music.thematicNote', 'Experiências visuais completas: cada capa altera a paleta do aplicativo e ativa cenários sutis enquanto toca.')));

    const grid = el('div', 'music-cover-grid');
    tracks.forEach(trMeta => {
      const isSelected = m.track === trMeta.id;
      const isPlaying = isSelected && typeof Sound !== 'undefined' && Sound.playing;
      const coverSrc = trMeta.coverSrc || (typeof buildTrackCoverSvgDataUrl === 'function' ? buildTrackCoverSvgDataUrl(trMeta.id) : '');

      const tile = el('button', 'music-cover-tile' + (isSelected ? ' active' : '') + (isPlaying ? ' playing' : ''));
      tile.type = 'button';
      tile.dataset.trackId = trMeta.id;
      const labelTxt = isPlaying
        ? tr('panel.music.pause', 'Pausar {title}', { title: trMeta.title })
        : tr('panel.music.play', 'Tocar {title}', { title: trMeta.title });
      tile.title = labelTxt;
      tile.setAttribute('aria-label', labelTxt);
      tile.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');

      if (coverSrc) {
        const img = el('img');
        img.src = coverSrc;
        img.alt = tr('panel.music.coverAlt', 'Capa de {title}', { title: trMeta.title });
        img.loading = 'lazy';
        tile.append(img);
      }

      const overlay = el('span', 'music-cover-overlay');
      overlay.setAttribute('aria-hidden', 'true');
      overlay.append(el('span', 'music-cover-play-badge', svgIcon(isPlaying ? 'pause' : 'play')));
      tile.append(overlay);

      tile.addEventListener('click', () => {
        if (Store.state.music.track === trMeta.id && Sound.playing) Sound.stop();
        else Sound.play(trMeta.id);
        this.render();
      });

      grid.append(tile);
    });
    sec.append(grid);

    sec.append(pSub(tr('panel.music.basicSub', 'Trilhas de estudo e ambiente')));
    sec.append(el('p', 'panel-note', tr('panel.music.basicNote', 'Sons leves e contínuos para leitura, escrita e concentração profunda, sem alterar o tema da página.')));
    const hasCustomAudio = typeof Sound !== 'undefined' && !!Sound.customSrc;
    const basicIds = ['none', 'typing', 'keys', 'writing', 'rain', 'ocean', 'pad', 'fireplace', 'night'];
    if (hasCustomAudio) basicIds.push('custom');
    const opts = basicIds.map(id => ({
      id,
      label: typeof getTrackLabel === 'function' ? getTrackLabel(id) : id
    }));

    const musicCtl = pCtl('<span>' + tr('panel.music.trackLabel', 'Trilha') + '</span>');
    musicCtl.append(chipGroup(opts, m.track || 'none', (id) => {
      Store.state.music.track = id;
      Store.save();
      if (id === 'none') {
        Sound.stop();
        Sound.syncVisuals();
      } else {
        Sound.play(id);
      }
      this.render();
    }));
    sec.append(musicCtl);

    sec.append(sliderRow(tr('panel.music.volume', 'Volume'), 0, 100, Math.round((m.volume == null ? 0.35 : m.volume) * 100), v => v + '%', v => Sound.setVolume(v / 100)));

    const musicBtns = [uploadBtn(hasCustomAudio ? tr('panel.music.changeAudio', 'Trocar áudio') : tr('panel.music.sendAudio', 'Enviar áudio'), 'audio/*', async (file) => {
      if (!file.type.startsWith('audio/')) { toast(tr('panel.music.chooseAudioErr', 'Escolha um arquivo de áudio'), 'close'); return; }
      if (file.size > 12 * 1024 * 1024) { toast(tr('panel.music.audioTooBig', 'Áudio muito grande (máx. 12 MB)'), 'close'); return; }
      try {
        const url = await readFileAsDataURL(file);
        await Files.put('customMusic', url);
        Sound.setCustomSource(url);
        Store.state.music.track = 'custom';
        Store.save();
        Sound.play('custom');
        this.render();
        toast(tr('panel.music.audioSaved', 'Áudio carregado'), 'music');
      } catch (e) { toast(tr('panel.music.audioSaveErr', 'Não foi possível salvar o áudio'), 'close'); }
    })];
    if (hasCustomAudio) {
      const rmMusic = el('button', 'chip', tr('panel.music.removeAudio', 'Remover áudio'));
      rmMusic.type = 'button';
      rmMusic.addEventListener('click', async () => {
        await Files.del('customMusic');
        Sound.setCustomSource(null);
        if (Sound.bgm && Store.state.music.track === 'custom') {
          Sound.bgm.pause();
          Sound.bgm.removeAttribute('src');
          Sound.bgm.load();
        }
        if (Store.state.music.track === 'custom') {
          Store.state.music.track = 'none';
          Sound.stop();
        }
        Store.save();
        this.render();
        toast(tr('panel.music.audioRemoved', 'Áudio removido'), 'trash');
      });
      musicBtns.push(rmMusic);
    }
    sec.append(actionRow(musicBtns));

    sec.append(pSub(tr('panel.music.animSub', 'Tema e animações da música')));
    if (globalOff) {
      const hint = el('div', 'panel-hint-box', '<span>' + tr('panel.music.globalOffBox', 'Os efeitos globais estão desligados.') + '</span>');
      const goBtn = el('button', 'panel-hint-link', tr('panel.configure', 'Configurar'));
      goBtn.type = 'button';
      goBtn.addEventListener('click', () => this.openDrawer('effects'));
      hint.append(goBtn);
      sec.append(hint);
    }
    sec.append(switchRow(tr('panel.music.dynamicTheme', 'Aplicar tema da capa enquanto toca'), m.dynamicTheme !== false, (on) => {
      Store.state.music.dynamicTheme = on;
      Store.save();
      Sound.syncVisuals();
    }));
    sec.append(switchRow(tr('panel.music.visualEffects', 'Animações visuais da música'), m.visualEffects !== false, (on) => {
      Store.state.music.visualEffects = on;
      Store.save();
      Sound.syncVisuals();
      this.render();
    }, { disabled: globalOff }));

    const visLocked = globalOff || m.visualEffects === false;
    const visReason = globalOff
      ? tr('panel.lock.effectsOff', 'Bloqueado porque os efeitos globais estão desligados.')
      : (m.visualEffects === false ? tr('panel.lock.musicVisualOff', 'Ative as animações visuais da música para personalizar estes ajustes.') : '');

    const visGroup = pGroup(visLocked);
    visGroup.append(switchRow(tr('panel.music.sceneElements', 'Elementos no fundo (ramos e cercas)'), m.sceneElements !== false, (on) => {
      Store.state.music.sceneElements = on;
      Store.save();
      Sound.syncVisuals();
      this.render();
    }));
    visGroup.append(switchRow(tr('panel.music.sceneParticles', 'Partículas musicais (pétalas e brasas)'), m.sceneParticles !== false, (on) => {
      Store.state.music.sceneParticles = on;
      Store.save();
      Sound.syncVisuals();
      this.render();
    }));
    const interactiveOff = !visLocked && m.sceneElements === false && m.sceneParticles === false;
    visGroup.append(switchRow(tr('panel.music.sceneInteractive', 'Interação com o mouse'), m.sceneInteractive !== false, (on) => {
      Store.state.music.sceneInteractive = on;
      Store.save();
      Sound.syncVisuals();
    }, { disabled: visLocked || interactiveOff }));
    if (interactiveOff) {
      visGroup.append(el('p', 'panel-lock-note', tr('panel.lock.sceneInteractiveOff', 'Ative elementos de fundo ou partículas musicais para usar a interação.')));
    }
    visGroup.append(sliderRow(tr('panel.music.sceneIntensity', 'Intensidade das animações'), 0, 100, m.sceneIntensity == null ? 65 : m.sceneIntensity, v => v + '%', v => {
      Store.state.music.sceneIntensity = v;
      Store.save();
      if (typeof Motion !== 'undefined') Motion.readState();
    }));
    lockGroup(visGroup, visLocked, visReason);
    sec.append(visGroup);
    sec.append(el('p', 'panel-note', tr('panel.music.animNote', 'Flowers traz ramos e rosas na base com pétalas que desviam do mouse; March traz cercas de trincheira e brasas subindo com o ponteiro.')));
    return sec;
  },

  syncMusicUI() {
    if (!document.body.classList.contains('panel-open') || this.openId !== 'music') return;
    const m = Store.state.music || {};
    $$('.music-cover-tile', $('#panel-body')).forEach(tile => {
      const id = tile.dataset.trackId;
      const meta = typeof getThematicTrack === 'function' ? getThematicTrack(id) : null;
      const title = meta ? meta.title : id;
      const isSelected = m.track === id;
      const isPlaying = isSelected && typeof Sound !== 'undefined' && Sound.playing;
      tile.classList.toggle('active', isSelected);
      tile.classList.toggle('playing', isPlaying);
      const labelTxt = isPlaying
        ? tr('panel.music.pause', 'Pausar {title}', { title })
        : tr('panel.music.play', 'Tocar {title}', { title });
      tile.title = labelTxt;
      tile.setAttribute('aria-label', labelTxt);
      tile.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
      const badge = tile.querySelector('.music-cover-play-badge');
      if (badge) badge.innerHTML = svgIcon(isPlaying ? 'pause' : 'play');
    });
  },

  /* ---- botão que abre o editor direto na página ---- */
  editOnScreen(page) {
    const b = el('button', 'chip', svgIcon('grip') + '<span>' + tr('panel.editOnScreen', 'Editar na tela') + '</span>');
    b.type = 'button';
    b.addEventListener('click', () => {
      this.close();
      setTimeout(() => LayoutEdit.start(page), 300);
    });
    return b;
  },

  /* ---- editor padronizado de ordem e visibilidade ---- */
  dragEditor(items, defs, onChange, opts) {
    const list = el('div', 'drag-list');
    const lockedIndex = items.findIndex(x => x.locked);
    const renderExtra = opts && opts.renderExtra;
    const labelKeyPrefix = (opts && opts.labelPrefix) || '';

    const persist = (arr) => {
      if (lockedIndex >= 0) {
        const locked = arr.find(x => x.locked);
        if (locked) {
          const at = arr.indexOf(locked);
          if (at !== lockedIndex) {
            arr.splice(at, 1);
            arr.splice(clamp(lockedIndex, 0, arr.length), 0, locked);
          }
        }
      }
      onChange(arr);
    };

    items.forEach((item, idx) => {
      const def = defs.find(d => d.id === item.id) || { label: item.id };
      const label = labelKeyPrefix ? tr(labelKeyPrefix + item.id, def.label) : def.label;
      const row = el('div', 'drag-row' + (item.locked ? ' locked' : '') + (item.on ? '' : ' off'));
      row.draggable = !item.locked;
      row.dataset.id = item.id;
      row.append(el('span', 'drag-handle', item.locked ? svgIcon('lock') : svgIcon('grip')));
      row.append(el('span', 'drag-label', label));

      if (item.locked) {
        row.append(el('span', 'drag-fixed', tr('panel.fixed', 'fixo')));
      } else {
        if (renderExtra) {
          const extra = renderExtra(item, row, () => persist(items));
          if (extra) row.append(extra);
        }

        const sw = el('button', 'switch' + (item.on ? ' on' : ''));
        sw.type = 'button';
        sw.setAttribute('role', 'switch');
        sw.setAttribute('aria-checked', item.on ? 'true' : 'false');
        const toggleLabel = (item.on ? tr('panel.hide', 'Ocultar') : tr('panel.show', 'Mostrar')) + ' ' + label;
        sw.setAttribute('aria-label', toggleLabel);
        sw.title = item.on ? tr('panel.hide', 'Ocultar') : tr('panel.show', 'Mostrar');
        sw.addEventListener('click', (e) => {
          e.stopPropagation();
          item.on = !item.on;
          sw.classList.toggle('on', item.on);
          sw.setAttribute('aria-checked', item.on ? 'true' : 'false');
          sw.setAttribute('aria-label', (item.on ? tr('panel.hide', 'Ocultar') : tr('panel.show', 'Mostrar')) + ' ' + label);
          row.classList.toggle('off', !item.on);
          persist(items);
        });
        row.append(sw);

        const canUp = idx > 0 && !items[idx - 1].locked;
        const canDown = idx < items.length - 1 && !items[idx + 1].locked;

        const up = el('button', 'drag-move', svgIcon('chevU'));
        up.type = 'button';
        up.disabled = !canUp;
        up.title = tr('panel.moveUp', 'Mover para cima');
        up.setAttribute('aria-label', tr('panel.moveItemUp', 'Mover {label} para cima', { label }));
        up.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!canUp) return;
          const arr = items.slice();
          const tmp = arr[idx - 1]; arr[idx - 1] = arr[idx]; arr[idx] = tmp;
          persist(arr);
        });

        const down = el('button', 'drag-move', svgIcon('chevD'));
        down.type = 'button';
        down.disabled = !canDown;
        down.title = tr('panel.moveDown', 'Mover para baixo');
        down.setAttribute('aria-label', tr('panel.moveItemDown', 'Mover {label} para baixo', { label }));
        down.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!canDown) return;
          const arr = items.slice();
          const tmp = arr[idx + 1]; arr[idx + 1] = arr[idx]; arr[idx] = tmp;
          persist(arr);
        });
        row.append(up, down);

        row.addEventListener('dragstart', (e) => {
          this._dragFrom = idx;
          row.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
          try { e.dataTransfer.setData('text/plain', String(idx)); } catch (err) { /* ignora */ }
        });
        row.addEventListener('dragend', () => {
          this._dragFrom = null;
          row.classList.remove('dragging');
          $$('.drag-row', list).forEach(r => r.classList.remove('over'));
        });
        row.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          row.classList.add('over');
        });
        row.addEventListener('dragleave', () => row.classList.remove('over'));
        row.addEventListener('drop', (e) => {
          e.preventDefault();
          row.classList.remove('over');
          const from = this._dragFrom;
          this._dragFrom = null;
          if (from == null || from < 0 || from === idx) return;
          const arr = items.slice();
          const moved = arr.splice(from, 1)[0];
          arr.splice(idx, 0, moved);
          persist(arr);
        });
      }

      list.append(row);
    });
    return list;
  },

  /* ---- bloco padronizado de "Durante a inatividade" ---- */
  idleSwitchList(sec, noteText, items, lockOpts) {
    sec.append(pSub(tr('panel.duringIdle', 'Durante a inatividade')));
    sec.append(el('p', 'panel-note', noteText));
    const idleTimeout = Store.state.idle ? Number(Store.state.idle.timeout) : 60;
    if (!idleTimeout) {
      const hint = el('div', 'panel-hint-box', '<span>' + tr('panel.idleOffNote', 'O modo calmo está desligado.') + '</span>');
      const goBtn = el('button', 'panel-hint-link', tr('panel.configure', 'Configurar'));
      goBtn.type = 'button';
      goBtn.addEventListener('click', () => this.openDrawer('general'));
      hint.append(goBtn);
      sec.append(hint);
    }
    const extraLock = !!(lockOpts && lockOpts.locked);
    const allLocked = !idleTimeout || extraLock;
    const reason = (lockOpts && lockOpts.reason) || (!idleTimeout ? tr('panel.lock.idleOff', 'Ligue o modo calmo em Geral para configurar o comportamento em inatividade.') : '');
    const box = pGroup(allLocked);
    items.forEach(item => {
      box.append(switchRow(item.label, item.checked, item.onChange, {
        locked: item.locked,
        disabled: !item.locked && (allLocked || !!item.disabled)
      }));
    });
    if (allLocked && reason) box.append(el('p', 'panel-lock-note', reason));
    sec.append(box);
  },

  /* ================= 4. página: início (inclui atalhos) ================= */
  homeSection() {
    const sec = pSection('home', tr('panel.drawer.home', 'Início'));

    sec.append(pSub(tr('panel.home.elements', 'Elementos da página')));
    sec.append(el('p', 'panel-note', tr('panel.home.elementsNote', 'Arraste para reordenar ou use os interruptores para mostrar e ocultar. O relógio é fixo.')));
    const items = HomePage.layout();
    sec.append(this.dragEditor(items, HOME_LAYOUT, (arr) => {
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
      this.render();
    }, { labelPrefix: 'home.layout.' }));

    const resetLayout = el('button', 'chip', svgIcon('reset') + '<span>' + tr('panel.restoreDefault', 'Restaurar padrão') + '</span>');
    resetLayout.type = 'button';
    resetLayout.addEventListener('click', () => {
      Store.state.home.layout = Store.defaults().home.layout;
      Store.save();
      if (typeof QuotesStore !== 'undefined') {
        QuotesStore.state.enabled = true;
        QuotesStore.save();
        if (typeof QuotesUI !== 'undefined') {
          QuotesUI.refreshSelection('sync');
          QuotesUI.render();
        }
      }
      HomePage.applyLayout();
      this.render();
    });
    sec.append(actionRow([this.editOnScreen('home'), resetLayout]));

    sec.append(pSub(tr('panel.home.chips', 'Atalhos da tela inicial')));
    sec.append(el('p', 'panel-note', tr('panel.home.chipsNote', 'Escolha quais atalhos aparecem abaixo da data e a ordem de exibição.')));
    const chipsItems = HomePage.chipsLayout();
    sec.append(this.dragEditor(chipsItems, HOME_CHIP_DEFS, (arr) => {
      Store.state.home.chips = arr;
      Store.save();
      HomePage.renderChips();
      this.render();
    }, { labelPrefix: 'home.chipDef.' }));

    const resetChips = el('button', 'chip', svgIcon('reset') + '<span>' + tr('panel.restoreDefault', 'Restaurar padrão') + '</span>');
    resetChips.type = 'button';
    resetChips.addEventListener('click', () => {
      Store.state.home.chips = Store.defaults().home.chips;
      Store.save();
      HomePage.renderChips();
      this.render();
    });
    sec.append(actionRow([resetChips]));

    this.appendQuotesControls(sec);

    this.idleSwitchList(
      sec,
      tr('panel.home.idleNote', 'O relógio permanece sempre visível; escolha quais elementos continuam aparecendo no modo calmo.'),
      HomePage.layout().map(item => {
        const def = HOME_LAYOUT.find(d => d.id === item.id) || { label: item.id };
        return {
          label: tr('home.layout.' + item.id, def.label),
          locked: item.id === 'clock',
          checked: item.idle !== false,
          onChange: (on) => {
            const arr = HomePage.layout();
            const target = arr.find(x => x.id === item.id);
            if (target && target.id !== 'clock') target.idle = on;
            Store.state.home.layout = arr;
            Store.save();
            HomePage.applyLayout();
          }
        };
      })
    );

    return sec;
  },

  /* ---- bloco compacto de citações dentro de Início ---- */
  appendQuotesControls(sec) {
    const st = typeof QuotesStore !== 'undefined' && QuotesStore.state
      ? QuotesStore.state
      : { enabled: true, frequency: 'daily', sources: { internal: true, custom: true, api: false }, style: { size: 15, font: 'inter', align: 'center', showAuthor: true }, custom: [] };
    const src = st.sources || {};
    const style = st.style || {};
    const layoutQuote = HomePage.layout().find(x => x.id === 'quote');
    const quoteEnabled = st.enabled !== false && (!layoutQuote || layoutQuote.on !== false);

    sec.append(pSub(tr('panel.drawer.quotes', 'Citações')));
    sec.append(switchRow(tr('panel.quotes.enable', 'Exibir citações na tela inicial'), quoteEnabled, (on) => {
      if (typeof QuotesUI !== 'undefined') QuotesUI.setEnabled(on);
      this.render();
    }));

    const activeGroup = pGroup(!quoteEnabled);

    const freqCtl = pCtl('<span>' + tr('panel.quotes.frequency', 'Frequência de troca') + '</span>');
    freqCtl.append(chipGroup([
      { id: 'daily',  label: tr('panel.quotes.freqDaily', 'Diariamente') },
      { id: 'open',   label: tr('panel.quotes.freqOpen', 'A cada abertura') },
      { id: 'manual', label: tr('panel.quotes.freqManual', 'Manualmente') }
    ], st.frequency || 'daily', (id) => {
      if (typeof QuotesUI !== 'undefined') QuotesUI.setFrequency(id);
      this.render();
    }));
    activeGroup.append(freqCtl);

    const nextBtn = el('button', 'chip', svgIcon('reset') + '<span>' + tr('panel.quotes.nextNow', 'Trocar citação agora') + '</span>');
    nextBtn.type = 'button';
    nextBtn.addEventListener('click', () => {
      if (typeof QuotesUI !== 'undefined') QuotesUI.nextQuote();
      this.render();
    });
    activeGroup.append(actionRow([nextBtn]));

    const srcCtl = pCtl('<span>' + tr('panel.quotes.sourcesSub', 'Fontes') + '</span>');
    srcCtl.append(switchRow(tr('panel.quotes.srcInternal', 'Biblioteca interna'), !!src.internal, (on) => {
      if (typeof QuotesUI !== 'undefined') QuotesUI.setSource('internal', on);
      this.render();
    }));
    srcCtl.append(switchRow(tr('panel.quotes.srcCustom', 'Minhas citações'), !!src.custom, (on) => {
      if (typeof QuotesUI !== 'undefined') QuotesUI.setSource('custom', on);
      this.render();
    }));
    srcCtl.append(switchRow(tr('panel.quotes.srcApi', 'API externa'), !!src.api, (on) => {
      if (typeof QuotesUI !== 'undefined') QuotesUI.setSource('api', on);
      this.render();
    }));
    srcCtl.append(el('p', 'panel-note', tr('panel.quotes.sourcesNote', 'Combine uma ou mais fontes. Se uma fonte estiver vazia ou offline, as demais continuam disponíveis.')));

    if (src.api) {
      srcCtl.append(el('p', 'panel-note', tr('panel.quotes.apiNote', 'Citações externas em inglês via DummyJSON, salvas em cache local diário sem tradução automática.')));
      const refreshBtn = el('button', 'chip', svgIcon('reset') + '<span>' + tr('panel.quotes.apiRefresh', 'Atualizar cache externo') + '</span>');
      refreshBtn.type = 'button';
      refreshBtn.addEventListener('click', async () => {
        if (refreshBtn.disabled || typeof QuotesUI === 'undefined') return;
        refreshBtn.disabled = true;
        await QuotesUI.refreshExternalNow();
        this.render();
      });
      srcCtl.append(actionRow([refreshBtn]));
    }

    const poolCount = typeof QuotesStore !== 'undefined' ? QuotesStore.getPool().length : 0;
    if (quoteEnabled && poolCount === 0) {
      srcCtl.append(el('p', 'panel-note', tr('panel.quotes.noSources', 'Nenhuma citação disponível com as fontes selecionadas.')));
    }
    activeGroup.append(srcCtl);

    activeGroup.append(sliderRow(tr('panel.quotes.size', 'Tamanho do texto'), 12, 24, style.size || 15, v => v + 'px', (v) => {
      if (typeof QuotesUI !== 'undefined') QuotesUI.setStyle({ size: v });
    }));

    const fontCtl = pCtl('<span>' + tr('panel.quotes.font', 'Fonte') + '</span>');
    if (typeof FONTS !== 'undefined') {
      Themes.ensureFonts(FONTS.map(f => f.id));
      fontCtl.append(chipGroup(
        FONTS.map(f => ({ id: f.id, label: f.label, cls: 'font-chip', style: { fontFamily: f.family } })),
        style.font || 'inter',
        (id) => {
          if (typeof QuotesUI !== 'undefined') QuotesUI.setStyle({ font: id });
          this.render();
        }
      ));
    }
    activeGroup.append(fontCtl);

    const alignCtl = pCtl('<span>' + tr('panel.quotes.align', 'Alinhamento') + '</span>');
    alignCtl.append(chipGroup([
      { id: 'left',   label: tr('panel.quotes.alignLeft', 'Esquerda'), icon: 'alignL' },
      { id: 'center', label: tr('panel.quotes.alignCenter', 'Centro'),  icon: 'alignC' },
      { id: 'right',  label: tr('panel.quotes.alignRight', 'Direita'),  icon: 'alignR' }
    ], style.align || 'center', (id) => {
      if (typeof QuotesUI !== 'undefined') QuotesUI.setStyle({ align: id });
      this.render();
    }));
    activeGroup.append(alignCtl);

    activeGroup.append(switchRow(tr('panel.quotes.showAuthor', 'Exibir autor ou referência'), style.showAuthor !== false, (on) => {
      if (typeof QuotesUI !== 'undefined') QuotesUI.setStyle({ showAuthor: on });
    }));

    lockGroup(activeGroup, !quoteEnabled, !quoteEnabled ? tr('panel.quotes.disabledNote', 'Ative as citações para ajustar frequência, fontes e aparência.') : '');
    sec.append(activeGroup);

    /* ---- Minhas citações (sempre 2 campos: texto e autor/referência opcional) ---- */
    const customCtl = pCtl('<span>' + tr('panel.quotes.customSub', 'Minhas citações') + '</span>');

    const form = el('form', 'quote-form');
    const textInp = el('textarea', 'quote-input');
    textInp.rows = 2;
    textInp.maxLength = 500;
    textInp.placeholder = tr('panel.quotes.textPh', 'Texto da citação…');
    textInp.setAttribute('aria-label', tr('panel.quotes.textAria', 'Texto da citação'));

    const authorInp = el('input', 'quote-input');
    authorInp.type = 'text';
    authorInp.maxLength = 120;
    authorInp.placeholder = tr('panel.quotes.authorPh', 'Autor ou referência (opcional)…');
    authorInp.setAttribute('aria-label', tr('panel.quotes.authorAria', 'Autor ou referência (opcional)'));

    const addBtn = el('button', 'chip is-primary', svgIcon('plus') + '<span>' + tr('panel.quotes.addBtn', 'Adicionar citação') + '</span>');
    addBtn.type = 'submit';

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const txt = textInp.value.trim();
      if (!txt) {
        toast(tr('panel.quotes.emptyTextErr', 'Escreva o texto da citação primeiro'), 'close');
        textInp.focus();
        return;
      }
      if (typeof QuotesUI !== 'undefined') {
        QuotesUI.addCustom(txt, authorInp.value.trim());
      }
      textInp.value = '';
      authorInp.value = '';
      this.editingQuoteId = null;
      this.render();
      toast(tr('panel.quotes.addedToast', 'Citação adicionada'), 'check');
    });

    form.append(textInp, authorInp, actionRow([addBtn]));
    customCtl.append(form);

    const customList = Array.isArray(st.custom) ? st.custom : [];
    if (customList.length === 0) {
      customCtl.append(el('p', 'panel-note', tr('panel.quotes.customEmpty', 'Nenhuma citação personalizada ainda.')));
    } else {
      const listEl = el('div', 'quote-list');
      customList.forEach(item => {
        const row = el('div', 'quote-row');
        if (this.editingQuoteId === item.id) {
          const editForm = el('form', 'quote-edit-form');
          const eText = el('textarea', 'quote-input');
          eText.rows = 2;
          eText.maxLength = 500;
          eText.value = item.text;
          eText.placeholder = tr('panel.quotes.textPh', 'Texto da citação…');
          eText.setAttribute('aria-label', tr('panel.quotes.textAria', 'Texto da citação'));

          const eAuthor = el('input', 'quote-input');
          eAuthor.type = 'text';
          eAuthor.maxLength = 120;
          eAuthor.value = item.author || '';
          eAuthor.placeholder = tr('panel.quotes.authorPh', 'Autor ou referência (opcional)…');
          eAuthor.setAttribute('aria-label', tr('panel.quotes.authorAria', 'Autor ou referência (opcional)'));

          const cancelBtn = el('button', 'chip', tr('panel.quotes.cancelBtn', 'Cancelar'));
          cancelBtn.type = 'button';
          cancelBtn.addEventListener('click', () => {
            this.editingQuoteId = null;
            this.render();
          });

          const saveBtn = el('button', 'chip is-primary', tr('panel.quotes.saveBtn', 'Salvar'));
          saveBtn.type = 'submit';

          editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nextTxt = eText.value.trim();
            if (!nextTxt) {
              toast(tr('panel.quotes.emptyTextErr', 'Escreva o texto da citação primeiro'), 'close');
              eText.focus();
              return;
            }
            if (typeof QuotesUI !== 'undefined') {
              QuotesUI.updateCustom(item.id, nextTxt, eAuthor.value.trim());
            }
            this.editingQuoteId = null;
            this.render();
          });

          const act = el('div', 'quote-edit-actions');
          act.append(cancelBtn, saveBtn);
          editForm.append(eText, eAuthor, act);
          row.append(editForm);
        } else {
          const main = el('div', 'quote-row-main');
          const pTxt = el('p', 'quote-row-text');
          pTxt.textContent = item.text;
          main.append(pTxt);
          if (item.author) {
            const pAuth = el('p', 'quote-row-author');
            pAuth.textContent = item.author;
            main.append(pAuth);
          }

          const actions = el('div', 'quote-row-actions');
          const editBtn = el('button', 'quote-row-btn', svgIcon('pencil'));
          editBtn.type = 'button';
          editBtn.title = tr('panel.quotes.editAria', 'Editar citação');
          editBtn.setAttribute('aria-label', tr('panel.quotes.editAria', 'Editar citação'));
          editBtn.addEventListener('click', () => {
            this.editingQuoteId = item.id;
            this.render();
          });

          const delBtn = el('button', 'quote-row-btn danger', svgIcon('trash'));
          delBtn.type = 'button';
          delBtn.title = tr('panel.quotes.delAria', 'Excluir citação');
          delBtn.setAttribute('aria-label', tr('panel.quotes.delAria', 'Excluir citação'));
          delBtn.addEventListener('click', () => {
            if (typeof QuotesUI !== 'undefined') QuotesUI.deleteCustom(item.id);
            this.render();
          });

          actions.append(editBtn, delBtn);
          row.append(main, actions);
        }
        listEl.append(row);
      });
      customCtl.append(listEl);
    }

    sec.append(customCtl);
  },

  /* ================= 5. página: cronômetro ================= */
  timerSection() {
    const t = Store.state.timer;
    const sec = pSection('timer', tr('panel.drawer.timer', 'Cronômetro'));
    const apply = (sync) => {
      TimerPage.applyConfig();
      if (sync) TimerPage.syncUI();
      Store.save();
    };

    sec.append(pSub(tr('panel.timer.viewSub', 'Estilo da página')));
    const viewCtl = pCtl();
    viewCtl.append(chipGroup([
      { id: 'classic', label: tr('panel.timer.classic', 'Clássica') },
      { id: 'focus',   label: tr('panel.timer.focus', 'Minimalista') }
    ], t.view || 'classic', (id) => {
      Store.state.timer.view = id;
      apply(true);
      this.render();
    }));
    sec.append(viewCtl);
    sec.append(el('p', 'panel-note', tr('panel.timer.viewNote', 'Na versão minimalista fica apenas o relógio. Pressione e arraste: cima inicia/pausa, direita reinicia, baixo troca o preset e esquerda alterna o modo.')));

    sec.append(pSub(tr('panel.timer.digitsSub', 'Número e dígitos')));
    const fontCtl = pCtl('<span>' + tr('panel.timer.font', 'Fonte') + '</span>');
    Themes.ensureFonts(FONTS.map(f => f.id));
    fontCtl.append(chipGroup(
      FONTS.map(f => ({ id: f.id, label: f.label, cls: 'font-chip', style: { fontFamily: f.family } })),
      t.font,
      (id) => {
        Store.state.timer.font = id;
        apply();
        this.render();
      }
    ));
    sec.append(fontCtl);

    sec.append(sliderRow(tr('panel.timer.size', 'Tamanho'), 48, 160, t.size, v => v + 'px', v => {
      Store.state.timer.size = v;
      apply();
    }));
    sec.append(sliderRow(tr('panel.timer.weight', 'Peso da fonte'), 200, 800, t.weight, v => String(v), v => {
      Store.state.timer.weight = v;
      apply();
    }, 100));
    sec.append(sliderRow(tr('panel.timer.tracking', 'Espaçamento'), 0, 20, t.tracking, v => (v / 100).toFixed(2) + 'em', v => {
      Store.state.timer.tracking = v;
      apply();
    }));

    sec.append(accentColorControl(tr('panel.timer.tint', 'Cor do número'), t.tint || '', (val) => {
      Store.state.timer.tint = val;
      apply();
    }));

    const animCtl = pCtl('<span>' + tr('panel.timer.digitAnim', 'Animação dos dígitos') + '</span>');
    animCtl.append(chipGroup([
      { id: 'none', label: tr('panel.timer.none', 'Nenhuma') },
      { id: 'flip', label: tr('panel.timer.flip', 'Flip') }
    ], t.digitAnim || 'none', (id) => {
      Store.state.timer.digitAnim = id;
      apply();
      this.render();
    }));
    sec.append(animCtl);
    sec.append(switchRow(tr('panel.timer.blink', 'Dois-pontos piscando'), t.blink, (on) => {
      Store.state.timer.blink = on;
      apply();
    }));
    sec.append(switchRow(tr('panel.timer.showLabel', 'Mostrar rótulo do preset'), t.label, (on) => {
      Store.state.timer.label = on;
      apply();
    }));

    sec.append(pSub(tr('panel.timer.effectsSub', 'Efeitos do número')));
    sec.append(switchRow(tr('panel.timer.glow', 'Brilho / neon'), t.effectGlow, (on) => {
      Store.state.timer.effectGlow = on;
      apply();
      this.render();
    }));
    const glowGroup = pGroup(!t.effectGlow);
    glowGroup.append(sliderRow(tr('panel.timer.glowInt', 'Intensidade do brilho'), 0, 100, t.glow, v => v === 0 ? tr('panel.timer.off', 'desligado') : v + '%', v => {
      Store.state.timer.glow = v;
      apply();
    }));
    lockGroup(glowGroup, !t.effectGlow, !t.effectGlow ? tr('panel.lock.timerGlowOff', 'Ative Brilho / neon para ajustar a intensidade.') : '');
    sec.append(glowGroup);

    sec.append(switchRow(tr('panel.timer.shadow', 'Sombra projetada'), t.effectShadow, (on) => {
      Store.state.timer.effectShadow = on;
      apply();
    }));
    sec.append(switchRow(tr('panel.timer.outline', 'Contorno vazado'), t.effectOutline, (on) => {
      Store.state.timer.effectOutline = on;
      apply();
    }));
    sec.append(switchRow(tr('panel.timer.pulse', 'Pulsação suave'), t.effectPulse, (on) => {
      Store.state.timer.effectPulse = on;
      apply();
    }));

    sec.append(pSub(tr('panel.timer.ringSub', 'Anel e fundo do relógio')));
    sec.append(switchRow(tr('panel.timer.ring', 'Anel de progresso'), t.ring, (on) => {
      Store.state.timer.ring = on;
      apply();
      this.render();
    }));
    const ringGroup = pGroup(!t.ring);
    ringGroup.append(sliderRow(tr('panel.timer.ringWidth', 'Espessura do anel'), 1, 12, t.ringWidth, v => v + 'px', v => {
      Store.state.timer.ringWidth = v;
      apply();
    }));
    const ringCtl = pCtl('<span>' + tr('panel.timer.ringStyle', 'Estilo do anel') + '</span>');
    ringCtl.append(chipGroup([
      { id: 'solid',    label: tr('panel.timer.solid', 'Sólido') },
      { id: 'gradient', label: tr('panel.timer.gradient', 'Gradiente') },
      { id: 'dashed',   label: tr('panel.timer.dashed', 'Tracejado') }
    ], t.ringStyle || 'solid', (id) => {
      Store.state.timer.ringStyle = id;
      apply();
      this.render();
    }));
    ringGroup.append(ringCtl);
    lockGroup(ringGroup, !t.ring, !t.ring ? tr('panel.lock.timerRingOff', 'Ative o anel de progresso para escolher espessura e estilo.') : '');
    sec.append(ringGroup);

    const backCtl = pCtl('<span>' + tr('panel.timer.backdrop', 'Atrás do número') + '</span>');
    backCtl.append(chipGroup([
      { id: 'none',  label: tr('panel.timer.noneN', 'Nenhum') },
      { id: 'glass', label: tr('panel.timer.glass', 'Vidro') },
      { id: 'solid', label: tr('panel.timer.card', 'Cartão') },
      { id: 'halo',  label: tr('panel.timer.halo', 'Halo') }
    ], t.backdrop || 'none', (id) => {
      Store.state.timer.backdrop = id;
      apply();
      this.render();
    }));
    sec.append(backCtl);

    sec.append(pSub(tr('panel.timer.sessionsSub', 'Sessões e durações')));
    const durCtl = pCtl('<span>' + tr('panel.timer.durations', 'Durações (min)') + '</span>');
    const durGrid = el('div', 'num-grid');
    durGrid.append(numRow(tr('panel.timer.durFocus', 'Foco'), t.durations.focus, 1, 180, v => {
      Store.state.timer.durations.focus = v;
      apply(true);
    }, true));
    durGrid.append(numRow(tr('panel.timer.durShort', 'Pausa curta'), t.durations.short, 1, 60, v => {
      Store.state.timer.durations.short = v;
      apply(true);
    }, true));
    durGrid.append(numRow(tr('panel.timer.durLong', 'Pausa longa'), t.durations.long, 1, 90, v => {
      Store.state.timer.durations.long = v;
      apply(true);
    }, true));
    durGrid.append(numRow(tr('panel.timer.durCustom', 'Personalizado'), t.durations.custom, 1, 180, v => {
      Store.state.timer.durations.custom = v;
      apply(true);
    }, true));
    durCtl.append(durGrid);
    sec.append(durCtl);

    sec.append(switchRow(tr('panel.timer.autoCycle', 'Ciclo automático'), t.autoCycle, (on) => {
      Store.state.timer.autoCycle = on;
      apply(true);
      this.render();
    }));
    const cycleGroup = pGroup(!t.autoCycle);
    cycleGroup.append(numRow(tr('panel.timer.cycleCount', 'Focos antes da pausa longa'), t.cycle, 2, 12, v => {
      Store.state.timer.cycle = v;
      apply(true);
    }));
    lockGroup(cycleGroup, !t.autoCycle, !t.autoCycle ? tr('panel.lock.timerCycleOff', 'Ative o ciclo automático para definir o intervalo da pausa longa.') : '');
    sec.append(cycleGroup);

    sec.append(switchRow(tr('panel.timer.soundFinish', 'Som ao finalizar'), t.sound, (on) => {
      Store.state.timer.sound = on;
      Store.save();
    }));

    sec.append(pSub(tr('panel.timer.bgFocusSub', 'Fundo durante o foco')));
    sec.append(sliderRow(tr('panel.timer.dim', 'Escurecimento do fundo'), 0, 100, t.dim, v => v + '%', v => {
      Store.state.timer.dim = v;
      apply();
    }));
    sec.append(switchRow(tr('panel.timer.blur', 'Desfocar o fundo'), t.blur, (on) => {
      Store.state.timer.blur = on;
      apply();
    }));

    const idleDefs = [
      { id: 'ring',     label: tr('panel.timer.idle.ring', 'Anel ao redor') },
      { id: 'label',    label: tr('panel.timer.idle.label', 'Rótulo do preset') },
      { id: 'tabs',     label: tr('panel.timer.idle.tabs', 'Abas temporizador/cronômetro') },
      { id: 'presets',  label: tr('panel.timer.idle.presets', 'Botões de preset') },
      { id: 'sessions', label: tr('panel.timer.idle.sessions', 'Sessões de hoje') },
      { id: 'controls', label: tr('panel.timer.idle.controls', 'Controles') },
      { id: 'hint',     label: tr('panel.timer.idle.hint', 'Dica de atalhos') }
    ];
    t.idle = t.idle || {};
    const focusLocked = (t.view || 'classic') === 'focus';
    this.idleSwitchList(
      sec,
      tr('panel.timer.idleNote', 'O relógio permanece sempre visível; na versão minimalista apenas ele é exibido.'),
      [
        { label: tr('panel.timer.idle.clock', 'Relógio'), locked: true, checked: true },
        ...idleDefs.map(d => ({
          label: d.label,
          checked: t.idle[d.id] !== false,
          onChange: (on) => {
            Store.state.timer.idle[d.id] = on;
            TimerPage.applyConfig();
            Store.save();
          }
        }))
      ],
      {
        locked: focusLocked,
        reason: focusLocked ? tr('panel.lock.timerFocusView', 'Na versão minimalista apenas o relógio permanece visível.') : ''
      }
    );

    return sec;
  },

  /* ================= 6. página: progresso ================= */
  trackerSection() {
    const trState = Store.state.tracker;
    const sec = pSection('chart', tr('panel.drawer.tracker', 'Progresso'));

    sec.append(pSub(tr('panel.tracker.elements', 'Elementos da página')));
    sec.append(el('p', 'panel-note', tr('panel.tracker.elementsNote', 'Arraste para reordenar e use os interruptores para mostrar ou ocultar cada bloco.')));
    const items = TrackerPage.layout();
    sec.append(this.dragEditor(items, TRACKER_LAYOUT, (arr) => {
      Store.state.tracker.layout = arr;
      Store.save();
      TrackerPage.applyLayout();
      this.render();
    }, { labelPrefix: 'tracker.layout.' }));

    const resetLayout = el('button', 'chip', svgIcon('reset') + '<span>' + tr('panel.restoreDefault', 'Restaurar padrão') + '</span>');
    resetLayout.type = 'button';
    resetLayout.addEventListener('click', () => {
      Store.state.tracker.layout = Store.defaults().tracker.layout;
      Store.save();
      TrackerPage.applyLayout();
      TrackerPage.renderControls();
      this.render();
    });
    sec.append(actionRow([this.editOnScreen('tracker'), resetLayout]));

    sec.append(pSub(tr('panel.tracker.widgets', 'Cartões de resumo (até 8)')));
    sec.append(el('p', 'panel-note', tr('panel.tracker.widgetsNote', 'Arraste para reordenar, escolha quais exibir e alterne entre tamanho 1x (quadrado) e 2x (largo).')));
    const widgets = TrackerPage.widgets();
    sec.append(this.dragEditor(widgets, TRACKER_WIDGET_DEFS, (arr) => {
      Store.state.tracker.widgets = arr;
      Store.save();
      TrackerPage.render();
      this.render();
    }, {
      labelPrefix: 'tracker.widget.',
      renderExtra: (item, row, persist) => {
        const def = TRACKER_WIDGET_DEFS.find(d => d.id === item.id) || { label: item.id };
        const wLabel = tr('tracker.widget.' + item.id, def.label);
        const curSize = item.size === '2x' ? '2x' : '1x';
        const sizeBtn = el('button', 'drag-size' + (curSize === '2x' ? ' active' : ''), curSize);
        sizeBtn.type = 'button';
        sizeBtn.title = tr('panel.tracker.sizeHint', 'Alternar tamanho: 1x (quadrado) ou 2x (largo)');
        sizeBtn.setAttribute('aria-label', tr('panel.tracker.sizeAria', 'Tamanho do cartão {label}: {size}', { label: wLabel, size: curSize }));
        sizeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          item.size = item.size === '2x' ? '1x' : '2x';
          sizeBtn.textContent = item.size;
          sizeBtn.classList.toggle('active', item.size === '2x');
          sizeBtn.setAttribute('aria-label', tr('panel.tracker.sizeAria', 'Tamanho do cartão {label}: {size}', { label: wLabel, size: item.size }));
          persist();
        });
        return sizeBtn;
      }
    }));

    const resetWidgets = el('button', 'chip', svgIcon('reset') + '<span>' + tr('panel.restoreDefault', 'Restaurar padrão') + '</span>');
    resetWidgets.type = 'button';
    resetWidgets.addEventListener('click', () => {
      Store.state.tracker.widgets = Store.defaults().tracker.widgets;
      Store.save();
      TrackerPage.render();
      this.render();
    });
    sec.append(actionRow([resetWidgets]));

    sec.append(pSub(tr('panel.tracker.mainChart', 'Gráfico principal')));
    sec.append(el('p', 'panel-note', tr('panel.tracker.mainChartNote', 'Métrica: horas de uso diárias.')));
    const typeCtl = pCtl('<span>' + tr('panel.tracker.visual', 'Visual') + '</span>');
    typeCtl.append(chipGroup(
      TRACKER_TYPES.map(tp => ({ id: tp.id, label: tr('tracker.type.' + tp.id, tp.label) })),
      trState.chart,
      (id) => {
        Store.state.tracker.chart = id;
        Store.save();
        TrackerPage.renderControls();
        TrackerPage.renderChart();
        this.render();
      }
    ));
    sec.append(typeCtl);

    const periodCtl = pCtl('<span>' + tr('panel.tracker.period', 'Período') + '</span>');
    periodCtl.append(chipGroup(
      TRACKER_PERIODS.map(p => ({ id: String(p), label: p === 365 ? tr('panel.tracker.year1', '1 ano') : tr('panel.tracker.daysN', '{n} dias', { n: p }) })),
      String(trState.period),
      (id) => {
        Store.state.tracker.period = +id;
        if (+id !== 365) Store.state.tracker.yearOffset = 0;
        Store.save();
        TrackerPage.renderControls();
        TrackerPage.renderChart();
        this.render();
      }
    ));
    sec.append(periodCtl);

    sec.append(pSub(tr('panel.tracker.secondChart', 'Segundo gráfico')));
    const c2 = trState.chart2 = trState.chart2 || { on: false, chart: 'ring', period: 365, yearOffset: 0, metric: 'focus' };
    c2.on = TrackerPage.chart2On();
    sec.append(switchRow(tr('panel.tracker.showSecondChart', 'Exibir segundo gráfico'), c2.on, (on) => {
      c2.on = on;
      const arr = TrackerPage.layout();
      const target = arr.find(x => x.id === 'chart2');
      if (target) target.on = on;
      Store.state.tracker.layout = arr;
      Store.save();
      TrackerPage.applyLayout();
      TrackerPage.renderControls();
      TrackerPage.renderChart2();
      this.render();
    }));
    if (c2.on) {
      const metricCtl = pCtl('<span>' + tr('panel.tracker.metric', 'Métrica') + '</span>');
      metricCtl.append(chipGroup([
        { id: 'focus', label: tr('panel.tracker.metricFocus', 'Sessões de foco') },
        { id: 'hours', label: tr('panel.tracker.metricHours', 'Horas de uso') }
      ], c2.metric || 'focus', (id) => {
        c2.metric = id;
        Store.save();
        TrackerPage.renderControls();
        TrackerPage.renderChart2();
        this.render();
      }));
      sec.append(metricCtl);

      const typeCtl2 = pCtl('<span>' + tr('panel.tracker.visual', 'Visual') + '</span>');
      typeCtl2.append(chipGroup(
        TRACKER_TYPES.map(tp => ({ id: tp.id, label: tr('tracker.type.' + tp.id, tp.label) })),
        c2.chart,
        (id) => {
          c2.chart = id;
          Store.save();
          TrackerPage.renderControls();
          TrackerPage.renderChart2();
          this.render();
        }
      ));
      sec.append(typeCtl2);

      const periodCtl2 = pCtl('<span>' + tr('panel.tracker.period', 'Período') + '</span>');
      periodCtl2.append(chipGroup(
        TRACKER_PERIODS.map(p => ({ id: String(p), label: p === 365 ? tr('panel.tracker.year1', '1 ano') : tr('panel.tracker.daysN', '{n} dias', { n: p }) })),
        String(c2.period),
        (id) => {
          c2.period = +id;
          if (+id !== 365) c2.yearOffset = 0;
          Store.save();
          TrackerPage.renderControls();
          TrackerPage.renderChart2();
          this.render();
        }
      ));
      sec.append(periodCtl2);
    }

    sec.append(pSub(tr('panel.tracker.heatmaps', 'Heatmaps')));
    sec.append(sliderRow(tr('panel.tracker.cellSize', 'Tamanho das células'), 10, 34, trState.heatCell || 18, v => v + 'px', v => {
      Store.state.tracker.heatCell = v;
      Store.save();
      TrackerPage.renderChart();
      if (c2.on) TrackerPage.renderChart2();
    }));
    sec.append(el('p', 'panel-note', tr('panel.tracker.heatmapsNote', 'Aplica-se aos dois gráficos quando estiverem em grade ou circular. A cor acompanha a intensidade de cada dia.')));

    sec.append(pSub(tr('panel.tracker.goalSub', 'Meta diária')));
    const goalStyleCtl = pCtl('<span>' + tr('panel.tracker.goalStyle', 'Estilo da meta') + '</span>');
    goalStyleCtl.append(chipGroup([
      { id: 'bar',        label: tr('panel.tracker.goalBar', 'Barra contínua') },
      { id: 'ring',       label: tr('panel.tracker.goalRing', 'Medidor circular') },
      { id: 'milestones', label: tr('panel.tracker.goalMilestones', 'Com marcos (25%-100%)') }
    ], trState.goalStyle || 'bar', (id) => {
      Store.state.tracker.goalStyle = id;
      Store.save();
      TrackerPage.render();
      this.render();
    }));
    sec.append(goalStyleCtl);
    sec.append(numRow(tr('panel.tracker.hoursPerDay', 'Horas por dia'), trState.goal, 0, 16, v => {
      Store.state.tracker.goal = v;
      Store.save();
      TrackerPage.render();
    }));

    return sec;
  },

  /* ================= 7. página: tarefas ================= */
  tasksSection() {
    const cfg = Store.state.tasks;
    const sec = pSection('tasks', tr('panel.drawer.tasks', 'Tarefas'));

    const applyTasks = (resetCompose) => {
      Store.save();
      TasksPage.applyConfig();
      if (resetCompose) TasksPage.resetComposeDefaults();
      TasksPage.render();
    };

    sec.append(pSub(tr('panel.tasks.appearance', 'Aparência')));
    sec.append(accentColorControl(tr('panel.tasks.accent', 'Cor de destaque'), cfg.accent || '', (val) => {
      Store.state.tasks.accent = val;
      applyTasks();
    }));

    const styleCtl = pCtl('<span>' + tr('panel.tasks.cardStyle', 'Estilo dos cartões') + '</span>');
    styleCtl.append(chipGroup([
      { id: 'glass',   label: tr('panel.tasks.glass', 'Vidro') },
      { id: 'solid',   label: tr('panel.tasks.solid', 'Sólido') },
      { id: 'minimal', label: tr('panel.tasks.minimal', 'Minimalista') }
    ], cfg.cardStyle || 'glass', (id) => {
      Store.state.tasks.cardStyle = id;
      applyTasks();
      this.render();
    }));
    sec.append(styleCtl);

    const densityCtl = pCtl('<span>' + tr('panel.tasks.density', 'Densidade da lista') + '</span>');
    densityCtl.append(chipGroup([
      { id: 'comfortable', label: tr('panel.tasks.comfortable', 'Confortável') },
      { id: 'compact',     label: tr('panel.tasks.compact', 'Compacta') }
    ], cfg.density || 'comfortable', (id) => {
      Store.state.tasks.density = id;
      applyTasks();
      this.render();
    }));
    sec.append(densityCtl);

    const checkCtl = pCtl('<span>' + tr('panel.tasks.checkShape', 'Caixa de seleção') + '</span>');
    checkCtl.append(chipGroup([
      { id: 'rounded', label: tr('panel.tasks.rounded', 'Arredondada') },
      { id: 'circle',  label: tr('panel.tasks.circle', 'Circular') },
      { id: 'square',  label: tr('panel.tasks.square', 'Quadrada') }
    ], cfg.checkShape || 'rounded', (id) => {
      Store.state.tasks.checkShape = id;
      applyTasks();
      this.render();
    }));
    sec.append(checkCtl);

    const animCtl = pCtl('<span>' + tr('panel.tasks.anim', 'Animação ao adicionar') + '</span>');
    animCtl.append(chipGroup([
      { id: 'slide', label: tr('panel.tasks.slide', 'Deslizar') },
      { id: 'fade',  label: tr('panel.tasks.fade', 'Suave') },
      { id: 'pop',   label: tr('panel.tasks.pop', 'Pop') }
    ], cfg.anim || 'slide', (id) => {
      Store.state.tasks.anim = id;
      applyTasks();
      this.render();
    }));
    sec.append(animCtl);

    sec.append(pSub(tr('panel.tasks.visibleSub', 'Elementos visíveis')));
    sec.append(switchRow(tr('panel.tasks.showSearch', 'Barra de busca'), cfg.showSearch !== false, (on) => {
      Store.state.tasks.showSearch = on;
      applyTasks();
    }));
    sec.append(switchRow(tr('panel.tasks.showComposeOpts', 'Opções rápidas ao criar (prazo, prioridade, categoria)'), cfg.showComposeOpts !== false, (on) => {
      Store.state.tasks.showComposeOpts = on;
      applyTasks();
    }));
    sec.append(switchRow(tr('panel.tasks.showExtraControls', 'Filtros de prazo, categoria e ordenação'), cfg.showExtraControls !== false, (on) => {
      Store.state.tasks.showExtraControls = on;
      applyTasks();
    }));
    sec.append(switchRow(tr('panel.tasks.showProgress', 'Barra de resumo e progresso'), !!cfg.showProgress, (on) => {
      Store.state.tasks.showProgress = on;
      applyTasks();
    }));
    sec.append(switchRow(tr('panel.tasks.showMeta', 'Prazo, prioridade e categoria na linha'), cfg.showMeta !== false, (on) => {
      Store.state.tasks.showMeta = on;
      applyTasks();
    }));
    sec.append(switchRow(tr('panel.tasks.showCreated', 'Data de criação na linha'), !!cfg.showCreated, (on) => {
      Store.state.tasks.showCreated = on;
      applyTasks();
    }));
    sec.append(switchRow(tr('panel.tasks.highlightOverdue', 'Destacar tarefas atrasadas'), cfg.highlightOverdue !== false, (on) => {
      Store.state.tasks.highlightOverdue = on;
      applyTasks();
    }));

    sec.append(pSub(tr('panel.tasks.behaviorSub', 'Lista e comportamento')));
    const sortCtl = pCtl('<span>' + tr('panel.tasks.sort', 'Ordenação') + '</span>');
    sortCtl.append(chipGroup([
      { id: 'recent',   label: tr('panel.tasks.sortRecent', 'Recentes') },
      { id: 'due',      label: tr('panel.tasks.sortDue', 'Vencimento') },
      { id: 'priority', label: tr('panel.tasks.sortPriority', 'Prioridade') },
      { id: 'oldest',   label: tr('panel.tasks.sortOldest', 'Antigas') },
      { id: 'alpha',    label: tr('panel.tasks.sortAlpha', 'A–Z') }
    ], cfg.sort || 'recent', (id) => {
      Store.state.tasks.sort = id;
      applyTasks();
      this.render();
    }));
    sec.append(sortCtl);

    const defPrioCtl = pCtl('<span>' + tr('panel.tasks.defPrio', 'Prioridade padrão ao criar') + '</span>');
    defPrioCtl.append(chipGroup([
      { id: 'none',   label: tr('panel.tasks.prioNone', 'Nenhuma') },
      { id: 'low',    label: tr('panel.tasks.prioLow', 'Baixa') },
      { id: 'medium', label: tr('panel.tasks.prioMedium', 'Média') },
      { id: 'high',   label: tr('panel.tasks.prioHigh', 'Alta') }
    ], cfg.defaultPriority || 'none', (id) => {
      Store.state.tasks.defaultPriority = id;
      applyTasks(true);
      this.render();
    }));
    sec.append(defPrioCtl);

    const defDueCtl = pCtl('<span>' + tr('panel.tasks.defDue', 'Vencimento padrão ao criar') + '</span>');
    defDueCtl.append(chipGroup([
      { id: 'none',     label: tr('panel.tasks.dueNone', 'Sem data') },
      { id: 'today',    label: tr('panel.tasks.dueToday', 'Hoje') },
      { id: 'tomorrow', label: tr('panel.tasks.dueTomorrow', 'Amanhã') }
    ], cfg.defaultDue || 'none', (id) => {
      Store.state.tasks.defaultDue = id;
      applyTasks(true);
      this.render();
    }));
    sec.append(defDueCtl);

    sec.append(switchRow(tr('panel.tasks.doneLast', 'Concluídas ao final da lista'), cfg.doneLast !== false, (on) => {
      Store.state.tasks.doneLast = on;
      applyTasks();
    }));
    sec.append(switchRow(tr('panel.tasks.popSound', 'Som ao concluir'), cfg.popSound !== false, (on) => {
      Store.state.tasks.popSound = on;
      Store.save();
    }));

    cfg.idle = cfg.idle || {};
    this.idleSwitchList(
      sec,
      tr('panel.tasks.idleNote', 'Escolha o que permanece visível na página de tarefas quando o modo calmo estiver ativo.'),
      [
        {
          label: tr('panel.tasks.idleSummary', 'Barra de resumo e progresso'),
          checked: cfg.idle.summary !== false,
          onChange: (on) => {
            Store.state.tasks.idle.summary = on;
            TasksPage.applyIdleConfig();
            Store.save();
          }
        },
        {
          label: tr('panel.tasks.idleComposer', 'Caixa de criação'),
          checked: !!cfg.idle.composer,
          onChange: (on) => {
            Store.state.tasks.idle.composer = on;
            TasksPage.applyIdleConfig();
            Store.save();
          }
        },
        {
          label: tr('panel.tasks.idleControls', 'Busca e filtros'),
          checked: !!cfg.idle.controls,
          onChange: (on) => {
            Store.state.tasks.idle.controls = on;
            TasksPage.applyIdleConfig();
            Store.save();
          }
        }
      ]
    );

    const resetTasks = el('button', 'chip', svgIcon('reset') + '<span>' + tr('panel.tasks.reset', 'Restaurar aparência padrão') + '</span>');
    resetTasks.type = 'button';
    resetTasks.addEventListener('click', () => {
      const preservedItems = Array.isArray(Store.state.tasks.items) ? Store.state.tasks.items.slice() : [];
      Store.state.tasks = Object.assign(Store.defaults().tasks, { items: preservedItems });
      applyTasks(true);
      this.render();
      toast(tr('panel.tasks.resetToast', 'Ajustes de tarefas restaurados'), 'reset');
    });
    sec.append(actionRow([resetTasks]));
    sec.append(el('p', 'panel-note', tr('panel.tasks.tip', 'Dica: pressione / ou Ctrl+F na tela de tarefas para buscar; dê duplo clique no texto para renomear.')));
    return sec;
  },

  /* ================= 8. sistema: geral ================= */
  generalSection() {
    const sec = pSection('sliders', tr('panel.drawer.general', 'Geral'));

    sec.append(pSub(tr('panel.general.langSub', 'Idioma')));
    const langCtl = pCtl('<span>' + tr('panel.general.langLabel', 'Idioma da interface') + '</span>');
    const curLang = typeof getLang === 'function' ? getLang() : (Store.state.lang === 'en' ? 'en' : 'pt');
    langCtl.append(chipGroup([
      { id: 'pt', label: 'Português (BR)' },
      { id: 'en', label: 'English' }
    ], curLang, (id) => {
      if (typeof setLang === 'function') setLang(id);
      else {
        Store.state.lang = id;
        Store.save();
        this.render();
      }
    }));
    sec.append(langCtl);
    sec.append(el('p', 'panel-note', tr('panel.general.langNote', 'Altera textos, datas e menus instantaneamente em todas as páginas.')));

    sec.append(pSub(tr('panel.general.calmSub', 'Modo calmo')));
    sec.append(el('p', 'panel-note', tr('panel.general.calmNote', 'Depois de um tempo sem atividade, os detalhes somem. Você pode escolher o que permanece visível em Início e Cronômetro.')));
    const idleCtl = pCtl('<span>' + tr('panel.general.hideAfter', 'Esconder detalhes após') + '</span>');
    idleCtl.append(chipGroup([
      { id: '30',  label: '30s' },
      { id: '60',  label: '1min' },
      { id: '120', label: '2min' },
      { id: '300', label: '5min' },
      { id: '0',   label: tr('panel.general.off', 'Desligado') }
    ], String(Store.state.idle.timeout), (id) => {
      Store.state.idle.timeout = +id;
      Store.save();
      Idle.apply();
      this.render();
    }));
    sec.append(idleCtl);

    sec.append(pSub(tr('panel.general.dockSub', 'Bolinha de navegação')));
    sec.append(switchRow(tr('panel.general.dockHover', 'Expandir ao passar o mouse'), !!(Store.state.dock && Store.state.dock.hover), (on) => {
      Store.state.dock.hover = on;
      Store.save();
      if (!on && Router.hovering) {
        Router.hovering = false;
        Router.toggleDock(false);
      }
    }));
    sec.append(el('p', 'panel-note', tr('panel.general.dockNote', 'Arraste a bolinha para 8 posições na tela. Perto das bordas direitas, o painel abre pela esquerda.')));

    const musicShortcut = el('div', 'panel-hint-box', '<span>' + tr('panel.general.musicHint', 'Músicas temáticas, trilhas e capas ficam em Aparência.') + '</span>');
    const goMusic = el('button', 'panel-hint-link', tr('panel.general.openMusic', 'Abrir música'));
    goMusic.type = 'button';
    goMusic.addEventListener('click', () => this.openDrawer('music'));
    musicShortcut.append(goMusic);
    sec.append(musicShortcut);

    sec.append(pSub(tr('panel.general.guidesSub', 'Guias de boas-vindas')));
    const replayGuidesBtn = el('button', 'chip', svgIcon('sparkle') + '<span>' + tr('panel.general.guidesReplay', 'Mostrar boas-vindas novamente') + '</span>');
    replayGuidesBtn.type = 'button';
    replayGuidesBtn.addEventListener('click', () => {
      if (typeof Welcome !== 'undefined' && typeof Welcome.replayAll === 'function') {
        this.close();
        Welcome.replayAll();
      }
      toast(tr('panel.general.guidesToast', 'Boas-vindas reativadas em todas as páginas'), 'sparkle');
    });
    sec.append(actionRow([replayGuidesBtn]));
    sec.append(el('p', 'panel-note', tr('panel.general.guidesNote', 'Reexibe o cartão ilustrativo de introdução na primeira abertura de cada página.')));

    sec.append(pSub(tr('panel.general.dataSub', 'Dados e backup')));
    sec.append(el('p', 'panel-note', tr('panel.general.dataSummary', '{days} dias · {hours} de uso · {tasks} tarefas realizadas.', {
      days: Usage.daysUsed(),
      hours: fmtHours(Usage.totalSeconds()),
      tasks: Store.state.tracker.tasksCompleted
    })));
    const exportBtn = el('button', 'chip', svgIcon('download') + '<span>' + tr('panel.general.export', 'Exportar dados (JSON)') + '</span>');
    exportBtn.type = 'button';
    exportBtn.addEventListener('click', () => TrackerPage.exportData());

    const importInput = el('input');
    importInput.type = 'file';
    importInput.accept = '.json,application/json';
    importInput.style.display = 'none';
    importInput.setAttribute('aria-hidden', 'true');
    importInput.addEventListener('change', async () => {
      const file = importInput.files && importInput.files[0];
      importInput.value = '';
      if (!file) return;
      try {
        const text = await file.text();
        const res = parseAndValidateBackup(text);
        if (!res.ok) {
          const fallback = res.errorKey === 'panel.general.importNotFluxo'
            ? 'Este arquivo não é um backup do Fluxo.'
            : 'Arquivo de backup JSON inválido.';
          toast(tr(res.errorKey, fallback), 'close');
          return;
        }
        this.pendingBackup = { name: file.name || 'backup.json', parsed: res };
        this.confirmingReset = false;
        this.render();
      } catch (e) {
        toast(tr('panel.general.importInvalid', 'Arquivo de backup JSON inválido.'), 'close');
      }
    });

    const importBtn = el('button', 'chip', svgIcon('upload') + '<span>' + tr('panel.general.import', 'Importar backup') + '</span>');
    importBtn.type = 'button';
    importBtn.addEventListener('click', () => importInput.click());

    sec.append(actionRow([exportBtn, importBtn]), importInput);

    if (this.pendingBackup) {
      const pb = this.pendingBackup;
      const msgKey = pb.parsed.isLegacyStateOnly ? 'panel.general.importConfirmLegacy' : 'panel.general.importConfirm';
      const msgDef = pb.parsed.isLegacyStateOnly
        ? 'Isso substitui os dados atuais de estado ({file}). Área de trabalho e arquivos atuais serão mantidos.'
        : 'Isso substitui os dados atuais ({file}). Continuar?';
      const importBox = el('div', 'panel-hint-box');
      importBox.append(el('span', null, tr(msgKey, msgDef, { file: pb.name })));
      const cancelImport = el('button', 'chip', tr('panel.general.cancel', 'Cancelar'));
      cancelImport.type = 'button';
      cancelImport.addEventListener('click', () => {
        this.pendingBackup = null;
        this.render();
      });
      const confirmImport = el('button', 'chip is-primary', tr('panel.general.importConfirmBtn', 'Restaurar backup'));
      confirmImport.type = 'button';
      confirmImport.addEventListener('click', async () => {
        if (confirmImport.disabled) return;
        confirmImport.disabled = true;
        cancelImport.disabled = true;
        confirmImport.textContent = tr('panel.general.importRestoring', 'Restaurando...');
        try {
          await AppBackup.restore(pb.parsed);
          location.reload();
        } catch (e) {
          confirmImport.disabled = false;
          cancelImport.disabled = false;
          confirmImport.textContent = tr('panel.general.importConfirmBtn', 'Restaurar backup');
          toast(tr('panel.general.importFail', 'Não foi possível restaurar o backup.'), 'close');
        }
      });
      sec.append(importBox, actionRow([cancelImport, confirmImport]));
    }

    if (!this.confirmingReset) {
      const btn = el('button', 'danger-btn', tr('panel.general.eraseAll', 'Apagar todos os dados'));
      btn.type = 'button';
      btn.style.marginTop = '14px';
      btn.addEventListener('click', () => {
        this.confirmingReset = true;
        this.pendingBackup = null;
        this.render();
      });
      sec.append(btn);
    } else {
      const confirmBox = el('div', 'panel-hint-box', '<span>' + tr('panel.general.eraseConfirm', 'Apagar tarefas, progresso, quadro e ajustes?') + '</span>');
      confirmBox.style.marginTop = '14px';
      const cancelBtn = el('button', 'chip', tr('panel.general.cancel', 'Cancelar'));
      cancelBtn.type = 'button';
      cancelBtn.addEventListener('click', () => {
        this.confirmingReset = false;
        this.render();
      });
      const yesBtn = el('button', 'danger-btn', tr('panel.general.confirmErase', 'Confirmar exclusão'));
      yesBtn.type = 'button';
      yesBtn.addEventListener('click', () => this.resetAll());
      sec.append(confirmBox, actionRow([cancelBtn]), yesBtn);
    }
    return sec;
  },

  resetAll() {
    try {
      localStorage.removeItem(STORE_KEY);
      Object.keys(localStorage)
        .filter(k => k.startsWith('fluxo-file-') || k.startsWith('fluxo-ws-') || k.startsWith('fluxo-quotes-'))
        .forEach(k => localStorage.removeItem(k));
    } catch (e) { /* ignora */ }
    try {
      if (Files.db) Files.db.close();
      indexedDB.deleteDatabase('fluxo-files');
    } catch (e) { /* ignora */ }

    const reload = () => setTimeout(() => location.reload(), 150);
    try {
      if (typeof WorkspaceDB !== 'undefined') {
        WorkspaceDB.clearAll().then(() => {
          try { indexedDB.deleteDatabase('fluxo-workspace'); } catch (e) { /* ignora */ }
          reload();
        }).catch(reload);
        return;
      }
    } catch (e) { /* ignora */ }
    reload();
  }
};
