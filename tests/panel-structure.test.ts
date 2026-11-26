import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function loadFluxoContext(initialStorage: Record<string, string> = {}) {
  const storageMap = new Map<string, string>(Object.entries(initialStorage));

  const noop = () => {};
  const makeEl = (tag: string, cls?: string, html?: string) => {
    const children: any[] = [];
    const classes = new Set((cls || '').split(/\s+/).filter(Boolean));
    const attrs: Record<string, string> = {};
    const listeners: Record<string, Function[]> = {};
    const node: any = {
      tagName: tag.toUpperCase(),
      className: cls || '',
      innerHTML: html || '',
      textContent: '',
      value: '',
      type: '',
      disabled: false,
      hidden: false,
      style: {
        setProperty: noop,
        removeProperty: noop,
      },
      dataset: {},
      children,
      classList: {
        add: (...c: string[]) => c.forEach(x => classes.add(x)),
        remove: (...c: string[]) => c.forEach(x => classes.delete(x)),
        toggle: (c: string, force?: boolean) => {
          const next = force === undefined ? !classes.has(c) : !!force;
          if (next) classes.add(c);
          else classes.delete(c);
          return next;
        },
        contains: (c: string) => classes.has(c),
      },
      setAttribute: (k: string, v: string) => {
        attrs[k] = String(v);
      },
      getAttribute: (k: string) => attrs[k] ?? null,
      addEventListener: (ev: string, fn: Function) => {
        listeners[ev] = listeners[ev] || [];
        listeners[ev].push(fn);
      },
      append: (...items: any[]) => {
        items.forEach(i => children.push(i));
      },
      querySelector: () => ({ textContent: '' }),
    };
    return node;
  };

  const sandbox: any = {
    console,
    Math,
    Date,
    Number,
    String,
    Array,
    Object,
    JSON,
    Promise,
    Set,
    Map,
    Intl,
    setTimeout,
    clearTimeout,
    setInterval: () => 1,
    clearInterval: noop,
    requestAnimationFrame: noop,
    localStorage: {
      getItem: (k: string) => storageMap.get(k) ?? null,
      setItem: (k: string, v: string) => storageMap.set(k, String(v)),
      removeItem: (k: string) => storageMap.delete(k),
    },
    document: {
      documentElement: {
        dataset: {},
        style: { setProperty: noop, removeProperty: noop, colorScheme: '' },
      },
      body: {
        classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
        dataset: {},
      },
      head: { appendChild: noop },
      createElement: (tag: string) => makeEl(tag),
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: noop,
    },
    window: {},
    location: { hash: '#/inicio', reload: noop },
    indexedDB: { open: () => null, deleteDatabase: noop },
    Sound: { bgm: null, stop: noop, play: noop, setVolume: noop, setCustomSource: noop },
    Motion: { readState: noop, syncColors: noop },
    Idle: { apply: noop, wake: noop },
    Usage: { daysUsed: () => 1, totalSeconds: () => 3600, streak: () => 1, todaySeconds: () => 600 },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  const files = [
    'public/js/util.js',
    'public/js/storage.js',
    'public/js/themes.js',
    'public/js/pages/home.js',
    'public/js/pages/tracker.js',
    'public/js/panel.js',
  ];

  for (const rel of files) {
    const code = fs.readFileSync(path.resolve(process.cwd(), rel), 'utf8');
    // Expose top-level const/let declarations onto sandbox by transforming only top-level const/let if needed,
    // or run directly and access via vm.runInContext.
    vm.runInContext(code, sandbox, { filename: rel });
  }

  return sandbox;
}

test('PANEL_DRAWERS follows logical groups and page navigation order', () => {
  const ctx = loadFluxoContext();
  const drawers = JSON.parse(vm.runInContext('JSON.stringify(PANEL_DRAWERS)', ctx)) as Array<{ id: string; label: string; group: string }>;

  assert.deepEqual(
    drawers.map(d => [d.group, d.id, d.label]),
    [
      ['Aparência', 'themes', 'Temas e cores'],
      ['Aparência', 'appearance', 'Papel de parede e fonte'],
      ['Aparência', 'effects', 'Efeitos'],
      ['Aparência', 'music', 'Música e atmosfera'],
      ['Páginas', 'home', 'Início'],
      ['Páginas', 'timer', 'Cronômetro'],
      ['Páginas', 'tracker', 'Progresso'],
      ['Páginas', 'tasks', 'Tarefas'],
      ['Sistema', 'general', 'Geral'],
    ]
  );
});

test('HomePage.layout locks clock visibility and idle visibility even from legacy state', () => {
  const legacy = {
    home: {
      layout: [
        { id: 'greet', on: true, idle: false },
        { id: 'clock', on: false, idle: false },
        { id: 'date', on: true, idle: false },
        { id: 'chips', on: true, idle: false },
      ],
    },
  };
  const ctx = loadFluxoContext({ 'fluxo-state-v1': JSON.stringify(legacy) });
  vm.runInContext('Store.load()', ctx);
  const layout = JSON.parse(vm.runInContext('JSON.stringify(HomePage.layout())', ctx)) as Array<{ id: string; on: boolean; idle: boolean; locked: boolean }>;
  const clock = layout.find(x => x.id === 'clock');

  assert.ok(clock);
  assert.equal(clock.on, true);
  assert.equal(clock.idle, true);
  assert.equal(clock.locked, true);
});

test('TrackerPage.widgets and layout maintain defaults and chart2 synchronization', () => {
  const saved = {
    tracker: {
      layout: [
        { id: 'header', on: true },
        { id: 'stats', on: true },
        { id: 'chart', on: true },
        { id: 'chart2', on: true },
        { id: 'goal', on: true },
      ],
      widgets: [
        { id: 'hours', on: true, size: '2x' },
        { id: 'days', on: false, size: '1x' },
      ],
    },
  };
  const ctx = loadFluxoContext({ 'fluxo-state-v1': JSON.stringify(saved) });
  vm.runInContext('Store.load()', ctx);
  const widgets = JSON.parse(vm.runInContext('JSON.stringify(TrackerPage.widgets())', ctx)) as Array<{ id: string; on: boolean; size: string }>;
  const chart2On = vm.runInContext('TrackerPage.chart2On()', ctx);

  assert.equal(chart2On, true);
  assert.equal(widgets.length, 8);
  assert.deepEqual(widgets[0], { id: 'hours', on: true, size: '2x' });
  assert.deepEqual(widgets[1], { id: 'days', on: false, size: '1x' });
});

test('ACCENT_PRESETS includes all standard accent swatches', () => {
  const ctx = loadFluxoContext();
  const presets = vm.runInContext('ACCENT_PRESETS', ctx) as Array<{ id: string; label: string }>;
  assert.equal(presets.length, 6);
  assert.ok(presets.every(p => p.id.startsWith('#') && p.label.length > 0));
});

test('THEMES and WALLPAPERS are organized by tone/group, include new lighter brisa wallpaper, and refine cosmos and poente', () => {
  const ctx = loadFluxoContext();
  vm.runInContext(fs.readFileSync(path.resolve(process.cwd(), 'public/js/i18n.js'), 'utf8'), ctx);
  vm.runInContext('Store.load()', ctx);

  const info = JSON.parse(vm.runInContext(`(() => {
    const themeSec = Panel.themesSection();
    const wpSec = Panel.appearanceSection();
    const collectClasses = (node, out = []) => {
      if (!node) return out;
      if (node.className) out.push(node.className);
      if (Array.isArray(node.children)) node.children.forEach(c => collectClasses(c, out));
      return out;
    };
    const countClass = (node, token) => collectClasses(node).filter(c => c.split(/\\s+/).includes(token)).length;

    const brisa = WALLPAPERS.find(w => w.id === 'brisa');
    const cosmos = WALLPAPERS.find(w => w.id === 'cosmos');
    const poente = WALLPAPERS.find(w => w.id === 'poente');

    return JSON.stringify({
      themeIds: THEMES.map(t => t.id),
      themeTones: THEMES.map(t => t.tone),
      wpIds: WALLPAPERS.map(w => w.id),
      wpGroups: WALLPAPERS.map(w => w.group),
      themeMiniLabels: countClass(themeSec, 'panel-mini-label'),
      themeCards: countClass(themeSec, 'theme-card'),
      themeCustomWrap: countClass(themeSec, 'theme-grid-custom'),
      wpMiniLabels: countClass(wpSec, 'panel-mini-label'),
      wpCards: countClass(wpSec, 'wall-card'),
      wpThumbs: countClass(wpSec, 'wall-thumb'),
      brisaBg: brisa ? brisa.bg : '',
      cosmosBg: cosmos ? cosmos.bg : '',
      poenteBg: poente ? poente.bg : '',
      ptBrisa: I18N_DICT.pt['wp.brisa'],
      enBrisa: I18N_DICT.en['wp.brisa'],
      ptDarkGroup: I18N_DICT.pt['panel.themes.darkGroup'],
      enDarkGroup: I18N_DICT.en['panel.themes.darkGroup'],
      ptAtmos: I18N_DICT.pt['panel.app.wpAtmos'],
      enMinimal: I18N_DICT.en['panel.app.wpMinimal'],
    });
  })()`, ctx));

  assert.equal(info.themeIds.length, 11);
  assert.deepEqual(info.themeTones.slice(0, 8), Array(8).fill('dark'));
  assert.deepEqual(info.themeTones.slice(8, 10), ['light', 'light']);
  assert.equal(info.themeTones[10], 'custom');

  assert.equal(info.wpIds[0], 'aurora');
  assert.ok(info.wpIds.includes('brisa'));
  assert.equal(info.wpGroups.filter((g: string) => g === 'atmosphere').length, 9);
  assert.equal(info.wpGroups.filter((g: string) => g === 'light').length, 5);

  assert.equal(info.themeMiniLabels, 2);
  assert.equal(info.themeCards, 11);
  assert.equal(info.themeCustomWrap, 1);

  assert.equal(info.wpMiniLabels, 2);
  assert.equal(info.wpCards, 15);
  assert.equal(info.wpThumbs, 15);

  assert.match(info.brisaBg, /#f8fbff/i);
  assert.match(info.cosmosBg, /#040712/i);
  assert.match(info.poenteBg, /#0b0a1b/i);
  assert.equal(info.ptBrisa, 'Brisa');
  assert.equal(info.enBrisa, 'Breeze');
  assert.equal(info.ptDarkGroup, 'Escuros');
  assert.equal(info.enDarkGroup, 'Dark');
  assert.equal(info.ptAtmos, 'Atmosféricos');
  assert.equal(info.enMinimal, 'Light & neutral');
});
