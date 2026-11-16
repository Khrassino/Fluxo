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
    b.addEventListener('click', () => onPick(o.id));
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
    b.textContent = fmt(+input.value);
    onInput(+input.value);
  });
  c.append(lab, input);
  return c;
}
function switchRow(label, checked, onChange, opts) {
  const locked = !!(opts && opts.locked);
  const row = el('div', 'switch-row', '<span>' + label + '</span>');
  if (locked) {
    const tag = el('span', 'switch-locked', (opts && opts.lockedText) || 'Sempre visível');
    row.append(tag);
    return row;
  }
  const sw = el('button', 'switch' + (checked ? ' on' : ''));
  sw.type = 'button';
  sw.setAttribute('role', 'switch');
  sw.setAttribute('aria-checked', checked ? 'true' : 'false');
  sw.setAttribute('aria-label', label);
  sw.addEventListener('click', () => {
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

  const themeBtn = el('button', 'chip' + (!val ? ' active' : ''), 'Cor do tema');
  themeBtn.type = 'button';
  themeBtn.setAttribute('aria-pressed', !val ? 'true' : 'false');

  const dots = [];
  const customWrap = el('label', 'accent-custom' + (isCustom ? ' active' : ''));
  customWrap.title = 'Cor personalizada';

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
  picker.title = 'Cor personalizada';
  picker.setAttribute('aria-label', label + ' personalizada');
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

  init() {
    $('#panel-close').innerHTML = svgIcon('close');
    $('#panel-close').setAttribute('aria-label', 'Fechar personalização');
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
    this.render();
    const head = $('#panel-body .panel-drawer.open .drawer-head');
    if (head) head.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  },

  render() {
    const body = $('#panel-body');
    if (!body) return;
    const scroll = body.scrollTop;
    body.innerHTML = '';

    let lastGroup = null;
    PANEL_DRAWERS.forEach((d, idx) => {
      if (d.group !== lastGroup) {
        lastGroup = d.group;
        body.append(el('div', 'panel-group-label', d.group));
      }
      const next = PANEL_DRAWERS[idx + 1];
      const isGroupLast = !next || next.group !== d.group;
      const open = d.id === this.openId;
      const drawer = el('section', 'panel-drawer' + (open ? ' open' : '') + (isGroupLast ? ' group-last' : ''));
      drawer.dataset.drawer = d.id;

      const head = el('button', 'drawer-head');
      head.type = 'button';
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
      head.innerHTML =
        '<span class="drawer-icon">' + svgIcon(d.icon) + '</span>' +
        '<span class="drawer-title">' + d.label + '</span>' +
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
    const sec = pSection('palette', 'Temas e cores');

    sec.append(pSub('Tema'));
    const themeCtl = pCtl();
    const tGrid = el('div', 'theme-grid');
    THEMES.forEach(t => {
      const active = t.id === a.theme;
      const b = el('button', 'theme-card' + (active ? ' active' : ''));
      b.type = 'button';
      b.dataset.theme = t.id;
      b.title = t.label;
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
      const customTheme = t.id === 'custom';
      const bg = customTheme ? (a.custom.bg || t.bg) : t.bg;
      const accent = customTheme ? (a.custom.accent || t.accent) : t.accent;
      const accent2 = customTheme ? (a.custom.accent2 || t.accent2) : t.accent2;
      const ink = customTheme ? (a.custom.text || t.ink) : t.ink;
      b.style.setProperty('--tc-bg', bg);
      b.style.setProperty('--tc-accent', accent);
      b.style.setProperty('--tc-accent2', accent2);
      b.style.setProperty('--tc-ink', ink);
      b.innerHTML =
        '<span class="theme-glyph">' + svgIcon(t.icon || 'palette') + '</span>' +
        '<span class="theme-dots"><i></i><i></i></span>' +
        '<span class="theme-name">' + t.label + '</span>';
      b.addEventListener('click', () => {
        Store.state.appearance.theme = t.id;
        Themes.apply();
        Store.save();
        this.render();
      });
      tGrid.append(b);
    });
    themeCtl.append(tGrid);
    sec.append(themeCtl);

    if (a.theme === 'custom') {
      sec.append(pSub('Cores do tema personalizado'));
      const c = a.custom || {};
      const grid = el('div', 'custom-colors');
      const set = (key, val) => {
        Store.state.appearance.custom[key] = val;
        Themes.apply();
        Store.save();
      };
      grid.append(colorField('Fundo', c.bg || '#0a0e1e', v => set('bg', v)));
      grid.append(colorField('Destaque', c.accent || '#8fa2ff', v => set('accent', v)));
      grid.append(colorField('Destaque 2', c.accent2 || '#5fe3c4', v => set('accent2', v)));
      grid.append(colorField('Texto', c.text || '#edf1ff', v => set('text', v)));
      sec.append(grid);

      sec.append(sliderRow('Vidro (opacidade)', 0, 100, c.glass == null ? 55 : c.glass, v => v + '%', v => {
        Store.state.appearance.custom.glass = v;
        Themes.apply();
        Store.save();
      }));

      const reset = el('button', 'chip', svgIcon('reset') + '<span>Restaurar padrão</span>');
      reset.type = 'button';
      reset.addEventListener('click', () => {
        Store.state.appearance.custom = Store.defaults().appearance.custom;
        Themes.apply();
        Store.save();
        this.render();
      });
      sec.append(actionRow([reset]));
    }

    return sec;
  },

  /* ================= 2. papel de parede e fonte ================= */
  appearanceSection() {
    const a = Store.state.appearance;
    const sec = pSection('image', 'Papel de parede e fonte');

    sec.append(pSub('Papel de parede'));
    const wpCtl = pCtl();
    const wGrid = el('div', 'wall-grid');
    WALLPAPERS.forEach(w => {
      const active = w.id === a.wallpaper;
      const b = el('button', 'wall-card' + (active ? ' active' : ''));
      b.type = 'button';
      b.style.background = w.id === 'nenhum' ? 'var(--bg)' : w.bg;
      b.title = w.label;
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
      b.innerHTML = '<span class="wall-name">' + w.label + '</span>';
      b.addEventListener('click', () => {
        Store.state.appearance.wallpaper = w.id;
        Themes.apply();
        Store.save();
        this.render();
      });
      wGrid.append(b);
    });
    const customActive = a.wallpaper === 'custom';
    const custom = el('button', 'wall-card' + (customActive ? ' active' : ''));
    custom.type = 'button';
    custom.style.background = Themes.customWallpaperUrl
      ? 'url("' + Themes.customWallpaperUrl + '") center/cover'
      : 'var(--surface-2)';
    custom.title = 'Sua imagem';
    custom.setAttribute('aria-pressed', customActive ? 'true' : 'false');
    custom.innerHTML = '<span class="wall-name">Sua imagem</span>';
    custom.addEventListener('click', () => {
      if (!Themes.customWallpaperUrl) { toast('Envie uma imagem primeiro', 'image'); return; }
      Store.state.appearance.wallpaper = 'custom';
      Themes.apply();
      Store.save();
      this.render();
    });
    wGrid.append(custom);
    wpCtl.append(wGrid);

    const wpBtns = [uploadBtn(Themes.customWallpaperUrl ? 'Trocar imagem' : 'Enviar imagem', 'image/*', async (file) => {
      if (!file.type.startsWith('image/')) { toast('Escolha um arquivo de imagem', 'close'); return; }
      if (file.size > 8 * 1024 * 1024) { toast('Imagem muito grande (máx. 8 MB)', 'close'); return; }
      try {
        const url = await readFileAsDataURL(file);
        await Files.put('customWallpaper', url);
        Themes.customWallpaperUrl = url;
        Store.state.appearance.wallpaper = 'custom';
        Store.save();
        Themes.apply();
        this.render();
        toast('Papel de parede atualizado', 'image');
      } catch (e) { toast('Não foi possível salvar a imagem', 'close'); }
    })];
    if (Themes.customWallpaperUrl) {
      const rm = el('button', 'chip', 'Remover imagem');
      rm.type = 'button';
      rm.addEventListener('click', async () => {
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
    sec.append(wpCtl);

    sec.append(pSub('Tipografia da interface'));
    const fontCtl = pCtl('<span>Fonte</span>');
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
    const fx = Store.state.effects || (Store.state.effects = { level: 'full' });
    const globalOff = fx.level === 'off';
    const sec = pSection('motion', 'Efeitos');

    sec.append(pSub('Desempenho'));
    const lvlCtl = pCtl('<span>Nível global de efeitos</span>');
    lvlCtl.append(chipGroup([
      { id: 'full',    label: 'Completos' },
      { id: 'reduced', label: 'Reduzidos' },
      { id: 'off',     label: 'Desligados' }
    ], fx.level || 'full', (id) => {
      fx.level = id;
      Motion.readState();
      Store.save();
      this.render();
    }));
    sec.append(lvlCtl);
    sec.append(el('p', 'panel-note', 'Reduzidos deixam o fundo mais discreto e econômico. Desligados pausam movimento e partículas (a Área de Trabalho já pausa tudo automaticamente).'));

    sec.append(pSub('Movimento do fundo'));
    sec.append(switchRow('Movimento ativado', m.enabled, (on) => {
      Store.state.motion.enabled = on;
      Motion.readState();
      Store.save();
      this.render();
    }));
    const mGroup = pGroup(globalOff || !m.enabled);
    const mStyleCtl = pCtl('<span>Estilo</span>');
    mStyleCtl.append(chipGroup(MOTION_MODES, m.mode, (id) => {
      Store.state.motion.mode = id;
      Motion.readState();
      Store.save();
      this.render();
    }));
    mGroup.append(mStyleCtl);
    mGroup.append(sliderRow('Intensidade', 0, 100, m.intensity, v => v + '%', v => {
      Store.state.motion.intensity = v;
      Motion.readState();
      Store.save();
    }));
    mGroup.append(sliderRow('Suavidade', 0, 100, m.smoothness, v => v + '%', v => {
      Store.state.motion.smoothness = v;
      Motion.readState();
      Store.save();
    }));
    sec.append(mGroup);
    sec.append(el('p', 'panel-note', 'Todos os estilos reagem ao mouse. Deslizar, Profundidade, Inclinação, Balanço e Deriva mudam como o fundo acompanha o ponteiro.'));

    sec.append(pSub('Partículas'));
    sec.append(switchRow('Partículas ativadas', p.enabled, (on) => {
      Store.state.particles.enabled = on;
      Motion.readState();
      Store.save();
      this.render();
    }));
    const pGroupBox = pGroup(globalOff || !p.enabled);
    const pStyleCtl = pCtl('<span>Estilo</span>');
    pStyleCtl.append(chipGroup(PARTICLE_STYLES, p.style, (id) => {
      Store.state.particles.style = id;
      Motion.readState();
      Store.save();
      this.render();
    }));
    pGroupBox.append(pStyleCtl);
    pGroupBox.append(sliderRow('Quantidade', 0, 100, p.amount, v => v + '%', v => {
      Store.state.particles.amount = v;
      Motion.readState();
      Store.save();
    }));
    pGroupBox.append(switchRow('Interagir com o mouse', p.interactive, (on) => {
      Store.state.particles.interactive = on;
      Motion.readState();
      Store.save();
    }));
    sec.append(pGroupBox);
    sec.append(el('p', 'panel-note', 'Chuva cai e desvia de leve do mouse; Onda cria ondas circulares; Poeira flutua; Tela molhada escorre; Neve deriva; Teclas faz teclas subirem e destaca as teclas que você digitar.'));
    return sec;
  },

  /* ================= 4. música e atmosfera ================= */
  musicSection() {
    const m = Store.state.music || {};
    const fx = Store.state.effects || { level: 'full' };
    const globalOff = fx.level === 'off';
    const sec = pSection('music', 'Música e atmosfera');
    const tracks = typeof CUSTOM_THEMATIC_TRACKS !== 'undefined' ? CUSTOM_THEMATIC_TRACKS : [];

    sec.append(pSub('Músicas temáticas', 'Testes'));
    sec.append(el('p', 'panel-note', 'Cada música temática transforma a paleta do aplicativo conforme a capa e ativa efeitos sutis enquanto toca.'));

    const grid = el('div', 'music-cover-grid');
    tracks.forEach(tr => {
      const isSelected = m.track === tr.id;
      const isPlaying = isSelected && typeof Sound !== 'undefined' && Sound.playing;
      const coverSrc = tr.coverSrc || (typeof buildTrackCoverSvgDataUrl === 'function' ? buildTrackCoverSvgDataUrl(tr.id) : '');

      const tile = el('button', 'music-cover-tile' + (isSelected ? ' active' : '') + (isPlaying ? ' playing' : ''));
      tile.type = 'button';
      tile.dataset.trackId = tr.id;
      tile.title = isPlaying ? 'Pausar ' + tr.title : 'Tocar ' + tr.title;
      tile.setAttribute('aria-label', isPlaying ? 'Pausar ' + tr.title : 'Tocar ' + tr.title);
      tile.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');

      if (coverSrc) {
        const img = el('img');
        img.src = coverSrc;
        img.alt = 'Capa de ' + tr.title;
        img.loading = 'lazy';
        tile.append(img);
      }

      const overlay = el('span', 'music-cover-overlay');
      overlay.setAttribute('aria-hidden', 'true');
      overlay.append(el('span', 'music-cover-play-badge', svgIcon(isPlaying ? 'pause' : 'play')));
      tile.append(overlay);

      tile.addEventListener('click', () => {
        if (Store.state.music.track === tr.id && Sound.playing) Sound.stop();
        else Sound.play(tr.id);
        this.render();
      });

      grid.append(tile);
    });
    sec.append(grid);

    sec.append(pSub('Trilhas de estudo e volume'));
    const hasCustomAudio = typeof Sound !== 'undefined' && !!Sound.customSrc;
    const opts = [
      { id: 'none',      label: 'Sem música' },
      { id: 'rain',      label: 'Chuva' },
      { id: 'ocean',     label: 'Oceano' },
      { id: 'pad',       label: 'Ambiente' },
      { id: 'fireplace', label: 'Lareira' },
      { id: 'night',     label: 'Noite calma' },
      { id: 'typing',    label: 'Teclado' },
      { id: 'writing',   label: 'Escrita' }
    ];
    if (hasCustomAudio) opts.push({ id: 'custom', label: 'Sua música' });

    const musicCtl = pCtl('<span>Trilha ambiente</span>');
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

    sec.append(sliderRow('Volume', 0, 100, Math.round((m.volume == null ? 0.35 : m.volume) * 100), v => v + '%', v => Sound.setVolume(v / 100)));

    const musicBtns = [uploadBtn(hasCustomAudio ? 'Trocar áudio' : 'Enviar áudio', 'audio/*', async (file) => {
      if (!file.type.startsWith('audio/')) { toast('Escolha um arquivo de áudio', 'close'); return; }
      if (file.size > 12 * 1024 * 1024) { toast('Áudio muito grande (máx. 12 MB)', 'close'); return; }
      try {
        const url = await readFileAsDataURL(file);
        await Files.put('customMusic', url);
        Sound.setCustomSource(url);
        Store.state.music.track = 'custom';
        Store.save();
        Sound.play('custom');
        this.render();
        toast('Áudio carregado', 'music');
      } catch (e) { toast('Não foi possível salvar o áudio', 'close'); }
    })];
    if (hasCustomAudio) {
      const rmMusic = el('button', 'chip', 'Remover áudio');
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
        toast('Áudio removido', 'trash');
      });
      musicBtns.push(rmMusic);
    }
    sec.append(actionRow(musicBtns));

    sec.append(pSub('Tema e animações da música'));
    if (globalOff) {
      const hint = el('div', 'panel-hint-box', '<span>Os efeitos globais estão desligados.</span>');
      const goBtn = el('button', 'panel-hint-link', 'Configurar');
      goBtn.type = 'button';
      goBtn.addEventListener('click', () => this.openDrawer('effects'));
      hint.append(goBtn);
      sec.append(hint);
    }
    sec.append(switchRow('Aplicar tema da capa enquanto toca', m.dynamicTheme !== false, (on) => {
      Store.state.music.dynamicTheme = on;
      Store.save();
      Sound.syncVisuals();
    }));
    sec.append(switchRow('Animações visuais da música', m.visualEffects !== false, (on) => {
      Store.state.music.visualEffects = on;
      Store.save();
      Sound.syncVisuals();
      this.render();
    }));

    const visGroup = pGroup(globalOff || m.visualEffects === false);
    visGroup.append(switchRow('Elementos no fundo (ramos e cercas)', m.sceneElements !== false, (on) => {
      Store.state.music.sceneElements = on;
      Store.save();
      Sound.syncVisuals();
    }));
    visGroup.append(switchRow('Partículas musicais (pétalas e brasas)', m.sceneParticles !== false, (on) => {
      Store.state.music.sceneParticles = on;
      Store.save();
      Sound.syncVisuals();
    }));
    visGroup.append(switchRow('Interação com o mouse', m.sceneInteractive !== false, (on) => {
      Store.state.music.sceneInteractive = on;
      Store.save();
      Sound.syncVisuals();
    }));
    visGroup.append(sliderRow('Intensidade das animações', 0, 100, m.sceneIntensity == null ? 65 : m.sceneIntensity, v => v + '%', v => {
      Store.state.music.sceneIntensity = v;
      Store.save();
      if (typeof Motion !== 'undefined') Motion.readState();
    }));
    sec.append(visGroup);
    sec.append(el('p', 'panel-note', 'Flowers traz ramos e rosas na base com pétalas que desviam do mouse; March traz cercas de trincheira e brasas subindo com o ponteiro.'));
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
      tile.title = isPlaying ? 'Pausar ' + title : 'Tocar ' + title;
      tile.setAttribute('aria-label', isPlaying ? 'Pausar ' + title : 'Tocar ' + title);
      tile.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
      const badge = tile.querySelector('.music-cover-play-badge');
      if (badge) badge.innerHTML = svgIcon(isPlaying ? 'pause' : 'play');
    });
  },

  /* ---- botão que abre o editor direto na página ---- */
  editOnScreen(page) {
    const b = el('button', 'chip', svgIcon('grip') + '<span>Editar na tela</span>');
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
      const row = el('div', 'drag-row' + (item.locked ? ' locked' : '') + (item.on ? '' : ' off'));
      row.draggable = !item.locked;
      row.dataset.id = item.id;
      row.append(el('span', 'drag-handle', item.locked ? svgIcon('lock') : svgIcon('grip')));
      row.append(el('span', 'drag-label', def.label));

      if (item.locked) {
        row.append(el('span', 'drag-fixed', 'fixo'));
      } else {
        if (renderExtra) {
          const extra = renderExtra(item, row, () => persist(items));
          if (extra) row.append(extra);
        }

        const sw = el('button', 'switch' + (item.on ? ' on' : ''));
        sw.type = 'button';
        sw.setAttribute('role', 'switch');
        sw.setAttribute('aria-checked', item.on ? 'true' : 'false');
        sw.setAttribute('aria-label', (item.on ? 'Ocultar ' : 'Mostrar ') + def.label);
        sw.title = item.on ? 'Ocultar' : 'Mostrar';
        sw.addEventListener('click', (e) => {
          e.stopPropagation();
          item.on = !item.on;
          sw.classList.toggle('on', item.on);
          sw.setAttribute('aria-checked', item.on ? 'true' : 'false');
          sw.setAttribute('aria-label', (item.on ? 'Ocultar ' : 'Mostrar ') + def.label);
          row.classList.toggle('off', !item.on);
          persist(items);
        });
        row.append(sw);

        const canUp = idx > 0 && !items[idx - 1].locked;
        const canDown = idx < items.length - 1 && !items[idx + 1].locked;

        const up = el('button', 'drag-move', svgIcon('chevU'));
        up.type = 'button';
        up.disabled = !canUp;
        up.title = 'Mover para cima';
        up.setAttribute('aria-label', 'Mover ' + def.label + ' para cima');
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
        down.title = 'Mover para baixo';
        down.setAttribute('aria-label', 'Mover ' + def.label + ' para baixo');
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
  idleSwitchList(sec, noteText, items) {
    sec.append(pSub('Durante a inatividade'));
    sec.append(el('p', 'panel-note', noteText));
    const idleTimeout = Store.state.idle ? Number(Store.state.idle.timeout) : 60;
    if (!idleTimeout) {
      const hint = el('div', 'panel-hint-box', '<span>O modo calmo está desligado.</span>');
      const goBtn = el('button', 'panel-hint-link', 'Configurar');
      goBtn.type = 'button';
      goBtn.addEventListener('click', () => this.openDrawer('general'));
      hint.append(goBtn);
      sec.append(hint);
    }
    items.forEach(item => {
      sec.append(switchRow(item.label, item.checked, item.onChange, { locked: item.locked }));
    });
  },

  /* ================= 4. página: início (inclui atalhos) ================= */
  homeSection() {
    const sec = pSection('home', 'Início');

    sec.append(pSub('Elementos da página'));
    sec.append(el('p', 'panel-note', 'Arraste para reordenar ou use os interruptores para mostrar e ocultar. O relógio é fixo.'));
    const items = HomePage.layout();
    sec.append(this.dragEditor(items, HOME_LAYOUT, (arr) => {
      Store.state.home.layout = arr;
      Store.save();
      HomePage.applyLayout();
      this.render();
    }));

    const resetLayout = el('button', 'chip', svgIcon('reset') + '<span>Restaurar padrão</span>');
    resetLayout.type = 'button';
    resetLayout.addEventListener('click', () => {
      Store.state.home.layout = Store.defaults().home.layout;
      Store.save();
      HomePage.applyLayout();
      this.render();
    });
    sec.append(actionRow([this.editOnScreen('home'), resetLayout]));

    sec.append(pSub('Atalhos da tela inicial'));
    sec.append(el('p', 'panel-note', 'Escolha quais atalhos aparecem abaixo da data e a ordem de exibição.'));
    const chipsItems = HomePage.chipsLayout();
    sec.append(this.dragEditor(chipsItems, HOME_CHIP_DEFS, (arr) => {
      Store.state.home.chips = arr;
      Store.save();
      HomePage.renderChips();
      this.render();
    }));

    const resetChips = el('button', 'chip', svgIcon('reset') + '<span>Restaurar padrão</span>');
    resetChips.type = 'button';
    resetChips.addEventListener('click', () => {
      Store.state.home.chips = Store.defaults().home.chips;
      Store.save();
      HomePage.renderChips();
      this.render();
    });
    sec.append(actionRow([resetChips]));

    this.idleSwitchList(
      sec,
      'O relógio permanece sempre visível; escolha quais elementos continuam aparecendo no modo calmo.',
      HomePage.layout().map(item => {
        const def = HOME_LAYOUT.find(d => d.id === item.id) || { label: item.id };
        return {
          label: def.label,
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

  /* ================= 5. página: cronômetro ================= */
  timerSection() {
    const t = Store.state.timer;
    const sec = pSection('timer', 'Cronômetro');
    const apply = (sync) => {
      TimerPage.applyConfig();
      if (sync) TimerPage.syncUI();
      Store.save();
    };

    sec.append(pSub('Estilo da página'));
    const viewCtl = pCtl();
    viewCtl.append(chipGroup([
      { id: 'classic', label: 'Clássica' },
      { id: 'focus',   label: 'Minimalista' }
    ], t.view || 'classic', (id) => {
      Store.state.timer.view = id;
      apply(true);
      this.render();
    }));
    sec.append(viewCtl);
    sec.append(el('p', 'panel-note', 'Na versão minimalista fica apenas o relógio. Pressione e arraste: cima inicia/pausa, direita reinicia, baixo troca o preset e esquerda alterna o modo.'));

    sec.append(pSub('Número e dígitos'));
    const fontCtl = pCtl('<span>Fonte</span>');
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

    sec.append(sliderRow('Tamanho', 48, 160, t.size, v => v + 'px', v => {
      Store.state.timer.size = v;
      apply();
    }));
    sec.append(sliderRow('Peso da fonte', 200, 800, t.weight, v => String(v), v => {
      Store.state.timer.weight = v;
      apply();
    }, 100));
    sec.append(sliderRow('Espaçamento', 0, 20, t.tracking, v => (v / 100).toFixed(2) + 'em', v => {
      Store.state.timer.tracking = v;
      apply();
    }));

    sec.append(accentColorControl('Cor do número', t.tint || '', (val) => {
      Store.state.timer.tint = val;
      apply();
    }));

    const animCtl = pCtl('<span>Animação dos dígitos</span>');
    animCtl.append(chipGroup([
      { id: 'none', label: 'Nenhuma' },
      { id: 'flip', label: 'Flip' }
    ], t.digitAnim || 'none', (id) => {
      Store.state.timer.digitAnim = id;
      apply();
      this.render();
    }));
    sec.append(animCtl);
    sec.append(switchRow('Dois-pontos piscando', t.blink, (on) => {
      Store.state.timer.blink = on;
      apply();
    }));
    sec.append(switchRow('Mostrar rótulo do preset', t.label, (on) => {
      Store.state.timer.label = on;
      apply();
    }));

    sec.append(pSub('Efeitos do número'));
    sec.append(switchRow('Brilho / neon', t.effectGlow, (on) => {
      Store.state.timer.effectGlow = on;
      apply();
      this.render();
    }));
    const glowGroup = pGroup(!t.effectGlow);
    glowGroup.append(sliderRow('Intensidade do brilho', 0, 100, t.glow, v => v === 0 ? 'desligado' : v + '%', v => {
      Store.state.timer.glow = v;
      apply();
    }));
    sec.append(glowGroup);
    sec.append(switchRow('Sombra projetada', t.effectShadow, (on) => {
      Store.state.timer.effectShadow = on;
      apply();
    }));
    sec.append(switchRow('Contorno vazado', t.effectOutline, (on) => {
      Store.state.timer.effectOutline = on;
      apply();
    }));
    sec.append(switchRow('Pulsação suave', t.effectPulse, (on) => {
      Store.state.timer.effectPulse = on;
      apply();
    }));

    sec.append(pSub('Anel e fundo do relógio'));
    sec.append(switchRow('Anel de progresso', t.ring, (on) => {
      Store.state.timer.ring = on;
      apply();
      this.render();
    }));
    const ringGroup = pGroup(!t.ring);
    ringGroup.append(sliderRow('Espessura do anel', 1, 12, t.ringWidth, v => v + 'px', v => {
      Store.state.timer.ringWidth = v;
      apply();
    }));
    const ringCtl = pCtl('<span>Estilo do anel</span>');
    ringCtl.append(chipGroup([
      { id: 'solid',    label: 'Sólido' },
      { id: 'gradient', label: 'Gradiente' },
      { id: 'dashed',   label: 'Tracejado' }
    ], t.ringStyle || 'solid', (id) => {
      Store.state.timer.ringStyle = id;
      apply();
      this.render();
    }));
    ringGroup.append(ringCtl);
    sec.append(ringGroup);

    const backCtl = pCtl('<span>Atrás do número</span>');
    backCtl.append(chipGroup([
      { id: 'none',  label: 'Nenhum' },
      { id: 'glass', label: 'Vidro' },
      { id: 'solid', label: 'Cartão' },
      { id: 'halo',  label: 'Halo' }
    ], t.backdrop || 'none', (id) => {
      Store.state.timer.backdrop = id;
      apply();
      this.render();
    }));
    sec.append(backCtl);

    sec.append(pSub('Sessões e durações'));
    const durCtl = pCtl('<span>Durações (min)</span>');
    const durGrid = el('div', 'num-grid');
    durGrid.append(numRow('Foco', t.durations.focus, 1, 180, v => {
      Store.state.timer.durations.focus = v;
      apply(true);
    }, true));
    durGrid.append(numRow('Pausa curta', t.durations.short, 1, 60, v => {
      Store.state.timer.durations.short = v;
      apply(true);
    }, true));
    durGrid.append(numRow('Pausa longa', t.durations.long, 1, 90, v => {
      Store.state.timer.durations.long = v;
      apply(true);
    }, true));
    durGrid.append(numRow('Personalizado', t.durations.custom, 1, 180, v => {
      Store.state.timer.durations.custom = v;
      apply(true);
    }, true));
    durCtl.append(durGrid);
    sec.append(durCtl);

    sec.append(switchRow('Ciclo automático', t.autoCycle, (on) => {
      Store.state.timer.autoCycle = on;
      apply(true);
      this.render();
    }));
    const cycleGroup = pGroup(!t.autoCycle);
    cycleGroup.append(numRow('Focos antes da pausa longa', t.cycle, 2, 12, v => {
      Store.state.timer.cycle = v;
      apply(true);
    }));
    sec.append(cycleGroup);

    sec.append(switchRow('Som ao finalizar', t.sound, (on) => {
      Store.state.timer.sound = on;
      Store.save();
    }));

    sec.append(pSub('Fundo durante o foco'));
    sec.append(sliderRow('Escurecimento do fundo', 0, 100, t.dim, v => v + '%', v => {
      Store.state.timer.dim = v;
      apply();
    }));
    sec.append(switchRow('Desfocar o fundo', t.blur, (on) => {
      Store.state.timer.blur = on;
      apply();
    }));

    const idleDefs = [
      { id: 'ring',     label: 'Anel ao redor' },
      { id: 'label',    label: 'Rótulo do preset' },
      { id: 'tabs',     label: 'Abas temporizador/cronômetro' },
      { id: 'presets',  label: 'Botões de preset' },
      { id: 'sessions', label: 'Sessões de hoje' },
      { id: 'controls', label: 'Controles' },
      { id: 'hint',     label: 'Dica de atalhos' }
    ];
    t.idle = t.idle || {};
    this.idleSwitchList(
      sec,
      'O relógio permanece sempre visível; na versão minimalista apenas ele é exibido.',
      [
        { label: 'Relógio', locked: true, checked: true },
        ...idleDefs.map(d => ({
          label: d.label,
          checked: t.idle[d.id] !== false,
          onChange: (on) => {
            Store.state.timer.idle[d.id] = on;
            TimerPage.applyConfig();
            Store.save();
          }
        }))
      ]
    );

    return sec;
  },

  /* ================= 6. página: progresso ================= */
  trackerSection() {
    const tr = Store.state.tracker;
    const sec = pSection('chart', 'Progresso');

    sec.append(pSub('Elementos da página'));
    sec.append(el('p', 'panel-note', 'Arraste para reordenar e use os interruptores para mostrar ou ocultar cada bloco.'));
    const items = TrackerPage.layout();
    sec.append(this.dragEditor(items, TRACKER_LAYOUT, (arr) => {
      Store.state.tracker.layout = arr;
      Store.save();
      TrackerPage.applyLayout();
      this.render();
    }));

    const resetLayout = el('button', 'chip', svgIcon('reset') + '<span>Restaurar padrão</span>');
    resetLayout.type = 'button';
    resetLayout.addEventListener('click', () => {
      Store.state.tracker.layout = Store.defaults().tracker.layout;
      Store.save();
      TrackerPage.applyLayout();
      TrackerPage.renderControls();
      this.render();
    });
    sec.append(actionRow([this.editOnScreen('tracker'), resetLayout]));

    sec.append(pSub('Cartões de resumo (até 8)'));
    sec.append(el('p', 'panel-note', 'Arraste para reordenar, escolha quais exibir e alterne entre tamanho 1x (quadrado) e 2x (largo).'));
    const widgets = TrackerPage.widgets();
    sec.append(this.dragEditor(widgets, TRACKER_WIDGET_DEFS, (arr) => {
      Store.state.tracker.widgets = arr;
      Store.save();
      TrackerPage.render();
      this.render();
    }, {
      renderExtra: (item, row, persist) => {
        const def = TRACKER_WIDGET_DEFS.find(d => d.id === item.id) || { label: item.id };
        const sizeBtn = el('button', 'drag-size' + (item.size === '2x' ? ' active' : ''), item.size === '2x' ? '2x' : '1x');
        sizeBtn.type = 'button';
        sizeBtn.title = 'Alternar tamanho: 1x (quadrado) ou 2x (largo)';
        sizeBtn.setAttribute('aria-label', 'Tamanho do cartão ' + def.label + ': ' + (item.size === '2x' ? '2x' : '1x'));
        sizeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          item.size = item.size === '2x' ? '1x' : '2x';
          sizeBtn.textContent = item.size;
          sizeBtn.classList.toggle('active', item.size === '2x');
          sizeBtn.setAttribute('aria-label', 'Tamanho do cartão ' + def.label + ': ' + item.size);
          persist();
        });
        return sizeBtn;
      }
    }));

    const resetWidgets = el('button', 'chip', svgIcon('reset') + '<span>Restaurar padrão</span>');
    resetWidgets.type = 'button';
    resetWidgets.addEventListener('click', () => {
      Store.state.tracker.widgets = Store.defaults().tracker.widgets;
      Store.save();
      TrackerPage.render();
      this.render();
    });
    sec.append(actionRow([resetWidgets]));

    sec.append(pSub('Gráfico principal'));
    sec.append(el('p', 'panel-note', 'Métrica: horas de uso diárias.'));
    const typeCtl = pCtl('<span>Visual</span>');
    typeCtl.append(chipGroup(
      TRACKER_TYPES.map(t => ({ id: t.id, label: t.label })),
      tr.chart,
      (id) => {
        Store.state.tracker.chart = id;
        Store.save();
        TrackerPage.renderControls();
        TrackerPage.renderChart();
        this.render();
      }
    ));
    sec.append(typeCtl);

    const periodCtl = pCtl('<span>Período</span>');
    periodCtl.append(chipGroup(
      TRACKER_PERIODS.map(p => ({ id: String(p), label: p === 365 ? '1 ano' : p + ' dias' })),
      String(tr.period),
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

    sec.append(pSub('Segundo gráfico'));
    const c2 = tr.chart2 = tr.chart2 || { on: false, chart: 'ring', period: 365, yearOffset: 0, metric: 'focus' };
    c2.on = TrackerPage.chart2On();
    sec.append(switchRow('Exibir segundo gráfico', c2.on, (on) => {
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
      const metricCtl = pCtl('<span>Métrica</span>');
      metricCtl.append(chipGroup([
        { id: 'focus', label: 'Sessões de foco' },
        { id: 'hours', label: 'Horas de uso' }
      ], c2.metric || 'focus', (id) => {
        c2.metric = id;
        Store.save();
        TrackerPage.renderControls();
        TrackerPage.renderChart2();
        this.render();
      }));
      sec.append(metricCtl);

      const typeCtl2 = pCtl('<span>Visual</span>');
      typeCtl2.append(chipGroup(
        TRACKER_TYPES.map(t => ({ id: t.id, label: t.label })),
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

      const periodCtl2 = pCtl('<span>Período</span>');
      periodCtl2.append(chipGroup(
        TRACKER_PERIODS.map(p => ({ id: String(p), label: p === 365 ? '1 ano' : p + ' dias' })),
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

    sec.append(pSub('Heatmaps'));
    sec.append(sliderRow('Tamanho das células', 10, 34, tr.heatCell || 18, v => v + 'px', v => {
      Store.state.tracker.heatCell = v;
      Store.save();
      TrackerPage.renderChart();
      if (c2.on) TrackerPage.renderChart2();
    }));
    sec.append(el('p', 'panel-note', 'Aplica-se aos dois gráficos quando estiverem em grade ou circular. A cor acompanha a intensidade de cada dia.'));

    sec.append(pSub('Meta diária'));
    const goalStyleCtl = pCtl('<span>Estilo da meta</span>');
    goalStyleCtl.append(chipGroup([
      { id: 'bar',        label: 'Barra contínua' },
      { id: 'ring',       label: 'Medidor circular' },
      { id: 'milestones', label: 'Com marcos (25%-100%)' }
    ], tr.goalStyle || 'bar', (id) => {
      Store.state.tracker.goalStyle = id;
      Store.save();
      TrackerPage.render();
      this.render();
    }));
    sec.append(goalStyleCtl);
    sec.append(numRow('Horas por dia', tr.goal, 0, 16, v => {
      Store.state.tracker.goal = v;
      Store.save();
      TrackerPage.render();
    }));

    return sec;
  },

  /* ================= 7. página: tarefas ================= */
  tasksSection() {
    const cfg = Store.state.tasks;
    const sec = pSection('tasks', 'Tarefas');

    const applyTasks = (resetCompose) => {
      Store.save();
      TasksPage.applyConfig();
      if (resetCompose) TasksPage.resetComposeDefaults();
      TasksPage.render();
    };

    sec.append(pSub('Aparência'));
    sec.append(accentColorControl('Cor de destaque', cfg.accent || '', (val) => {
      Store.state.tasks.accent = val;
      applyTasks();
    }));

    const styleCtl = pCtl('<span>Estilo dos cartões</span>');
    styleCtl.append(chipGroup([
      { id: 'glass',   label: 'Vidro' },
      { id: 'solid',   label: 'Sólido' },
      { id: 'minimal', label: 'Minimalista' }
    ], cfg.cardStyle || 'glass', (id) => {
      Store.state.tasks.cardStyle = id;
      applyTasks();
      this.render();
    }));
    sec.append(styleCtl);

    const densityCtl = pCtl('<span>Densidade da lista</span>');
    densityCtl.append(chipGroup([
      { id: 'comfortable', label: 'Confortável' },
      { id: 'compact',     label: 'Compacta' }
    ], cfg.density || 'comfortable', (id) => {
      Store.state.tasks.density = id;
      applyTasks();
      this.render();
    }));
    sec.append(densityCtl);

    const checkCtl = pCtl('<span>Caixa de seleção</span>');
    checkCtl.append(chipGroup([
      { id: 'rounded', label: 'Arredondada' },
      { id: 'circle',  label: 'Circular' },
      { id: 'square',  label: 'Quadrada' }
    ], cfg.checkShape || 'rounded', (id) => {
      Store.state.tasks.checkShape = id;
      applyTasks();
      this.render();
    }));
    sec.append(checkCtl);

    const animCtl = pCtl('<span>Animação ao adicionar</span>');
    animCtl.append(chipGroup([
      { id: 'slide', label: 'Deslizar' },
      { id: 'fade',  label: 'Suave' },
      { id: 'pop',   label: 'Pop' }
    ], cfg.anim || 'slide', (id) => {
      Store.state.tasks.anim = id;
      applyTasks();
      this.render();
    }));
    sec.append(animCtl);

    sec.append(pSub('Elementos visíveis'));
    sec.append(switchRow('Barra de busca', cfg.showSearch !== false, (on) => {
      Store.state.tasks.showSearch = on;
      applyTasks();
    }));
    sec.append(switchRow('Opções rápidas ao criar (prazo, prioridade, categoria)', cfg.showComposeOpts !== false, (on) => {
      Store.state.tasks.showComposeOpts = on;
      applyTasks();
    }));
    sec.append(switchRow('Filtros de prazo, categoria e ordenação', cfg.showExtraControls !== false, (on) => {
      Store.state.tasks.showExtraControls = on;
      applyTasks();
    }));
    sec.append(switchRow('Barra de resumo e progresso', !!cfg.showProgress, (on) => {
      Store.state.tasks.showProgress = on;
      applyTasks();
    }));
    sec.append(switchRow('Prazo, prioridade e categoria na linha', cfg.showMeta !== false, (on) => {
      Store.state.tasks.showMeta = on;
      applyTasks();
    }));
    sec.append(switchRow('Data de criação na linha', !!cfg.showCreated, (on) => {
      Store.state.tasks.showCreated = on;
      applyTasks();
    }));
    sec.append(switchRow('Destacar tarefas atrasadas', cfg.highlightOverdue !== false, (on) => {
      Store.state.tasks.highlightOverdue = on;
      applyTasks();
    }));

    sec.append(pSub('Lista e comportamento'));
    const sortCtl = pCtl('<span>Ordenação</span>');
    sortCtl.append(chipGroup([
      { id: 'recent',   label: 'Recentes' },
      { id: 'due',      label: 'Vencimento' },
      { id: 'priority', label: 'Prioridade' },
      { id: 'oldest',   label: 'Antigas' },
      { id: 'alpha',    label: 'A–Z' }
    ], cfg.sort || 'recent', (id) => {
      Store.state.tasks.sort = id;
      applyTasks();
      this.render();
    }));
    sec.append(sortCtl);

    const defPrioCtl = pCtl('<span>Prioridade padrão ao criar</span>');
    defPrioCtl.append(chipGroup([
      { id: 'none',   label: 'Nenhuma' },
      { id: 'low',    label: 'Baixa' },
      { id: 'medium', label: 'Média' },
      { id: 'high',   label: 'Alta' }
    ], cfg.defaultPriority || 'none', (id) => {
      Store.state.tasks.defaultPriority = id;
      applyTasks(true);
      this.render();
    }));
    sec.append(defPrioCtl);

    const defDueCtl = pCtl('<span>Vencimento padrão ao criar</span>');
    defDueCtl.append(chipGroup([
      { id: 'none',     label: 'Sem data' },
      { id: 'today',    label: 'Hoje' },
      { id: 'tomorrow', label: 'Amanhã' }
    ], cfg.defaultDue || 'none', (id) => {
      Store.state.tasks.defaultDue = id;
      applyTasks(true);
      this.render();
    }));
    sec.append(defDueCtl);

    sec.append(switchRow('Concluídas ao final da lista', cfg.doneLast !== false, (on) => {
      Store.state.tasks.doneLast = on;
      applyTasks();
    }));
    sec.append(switchRow('Som ao concluir', cfg.popSound !== false, (on) => {
      Store.state.tasks.popSound = on;
      Store.save();
    }));

    cfg.idle = cfg.idle || {};
    this.idleSwitchList(
      sec,
      'Escolha o que permanece visível na página de tarefas quando o modo calmo estiver ativo.',
      [
        {
          label: 'Barra de resumo e progresso',
          checked: cfg.idle.summary !== false,
          onChange: (on) => {
            Store.state.tasks.idle.summary = on;
            TasksPage.applyIdleConfig();
            Store.save();
          }
        },
        {
          label: 'Caixa de criação',
          checked: !!cfg.idle.composer,
          onChange: (on) => {
            Store.state.tasks.idle.composer = on;
            TasksPage.applyIdleConfig();
            Store.save();
          }
        },
        {
          label: 'Busca e filtros',
          checked: !!cfg.idle.controls,
          onChange: (on) => {
            Store.state.tasks.idle.controls = on;
            TasksPage.applyIdleConfig();
            Store.save();
          }
        }
      ]
    );

    const resetTasks = el('button', 'chip', svgIcon('reset') + '<span>Restaurar aparência padrão</span>');
    resetTasks.type = 'button';
    resetTasks.addEventListener('click', () => {
      const preservedItems = Array.isArray(Store.state.tasks.items) ? Store.state.tasks.items.slice() : [];
      Store.state.tasks = Object.assign(Store.defaults().tasks, { items: preservedItems });
      applyTasks(true);
      this.render();
      toast('Ajustes de tarefas restaurados', 'reset');
    });
    sec.append(actionRow([resetTasks]));
    sec.append(el('p', 'panel-note', 'Dica: pressione / ou Ctrl+F na tela de tarefas para buscar; dê duplo clique no texto para renomear.'));
    return sec;
  },

  /* ================= 8. sistema: geral ================= */
  generalSection() {
    const sec = pSection('sliders', 'Geral');

    sec.append(pSub('Modo calmo'));
    sec.append(el('p', 'panel-note', 'Depois de um tempo sem atividade, os detalhes somem. Você pode escolher o que permanece visível em Início e Cronômetro.'));
    const idleCtl = pCtl('<span>Esconder detalhes após</span>');
    idleCtl.append(chipGroup([
      { id: '30',  label: '30s' },
      { id: '60',  label: '1min' },
      { id: '120', label: '2min' },
      { id: '300', label: '5min' },
      { id: '0',   label: 'Desligado' }
    ], String(Store.state.idle.timeout), (id) => {
      Store.state.idle.timeout = +id;
      Store.save();
      Idle.apply();
      this.render();
    }));
    sec.append(idleCtl);

    sec.append(pSub('Bolinha de navegação'));
    sec.append(switchRow('Expandir ao passar o mouse', !!(Store.state.dock && Store.state.dock.hover), (on) => {
      Store.state.dock.hover = on;
      Store.save();
      if (!on && Router.hovering) {
        Router.hovering = false;
        Router.toggleDock(false);
      }
    }));
    sec.append(el('p', 'panel-note', 'Arraste a bolinha para 8 posições na tela. Perto das bordas direitas, o painel abre pela esquerda.'));

    const musicShortcut = el('div', 'panel-hint-box', '<span>Músicas temáticas, trilhas e capas ficam em Aparência.</span>');
    const goMusic = el('button', 'panel-hint-link', 'Abrir música');
    goMusic.type = 'button';
    goMusic.addEventListener('click', () => this.openDrawer('music'));
    musicShortcut.append(goMusic);
    sec.append(musicShortcut);

    sec.append(pSub('Dados e backup'));
    sec.append(el('p', 'panel-note',
      Usage.daysUsed() + ' dias · ' + fmtHours(Usage.totalSeconds()) + ' de uso · ' +
      Store.state.tracker.tasksCompleted + ' tarefas realizadas.'));
    const exportBtn = el('button', 'chip', svgIcon('download') + '<span>Exportar dados (JSON)</span>');
    exportBtn.type = 'button';
    exportBtn.addEventListener('click', () => TrackerPage.exportData());
    sec.append(actionRow([exportBtn]));

    if (!this.confirmingReset) {
      const btn = el('button', 'danger-btn', 'Apagar todos os dados');
      btn.type = 'button';
      btn.style.marginTop = '14px';
      btn.addEventListener('click', () => {
        this.confirmingReset = true;
        this.render();
      });
      sec.append(btn);
    } else {
      const confirmBox = el('div', 'panel-hint-box', '<span>Apagar tarefas, progresso, quadro e ajustes?</span>');
      confirmBox.style.marginTop = '14px';
      const cancelBtn = el('button', 'chip', 'Cancelar');
      cancelBtn.type = 'button';
      cancelBtn.addEventListener('click', () => {
        this.confirmingReset = false;
        this.render();
      });
      const yesBtn = el('button', 'danger-btn', 'Confirmar exclusão');
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
        .filter(k => k.startsWith('fluxo-file-') || k.startsWith('fluxo-ws-'))
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
