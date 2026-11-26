import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function loadWorkspaceContext() {
  const noop = () => {};
  const makeEl = (tag: string, cls?: string, html?: string) => {
    const children: any[] = [];
    const classes = new Set((cls || '').split(/\s+/).filter(Boolean));
    const attrs: Record<string, string> = {};
    const node: any = {
      tagName: tag.toUpperCase(),
      className: cls || '',
      innerHTML: html || '',
      textContent: '',
      value: '',
      disabled: false,
      hidden: false,
      scrollTop: 0,
      scrollLeft: 0,
      style: { setProperty: noop, removeProperty: noop },
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
      setAttribute: (k: string, v: string) => { attrs[k] = String(v); },
      getAttribute: (k: string) => attrs[k] ?? null,
      addEventListener: noop,
      append: (...items: any[]) => items.forEach(i => children.push(i)),
      querySelector: () => null,
      querySelectorAll: () => [],
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
    encodeURIComponent,
    setTimeout,
    clearTimeout,
    setInterval: () => 1,
    clearInterval: noop,
    requestAnimationFrame: noop,
    localStorage: {
      getItem: () => null,
      setItem: noop,
      removeItem: noop,
    },
    document: {
      documentElement: { dataset: {}, style: { setProperty: noop, removeProperty: noop } },
      body: { classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, dataset: {} },
      head: { appendChild: noop },
      createElement: (tag: string) => makeEl(tag),
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: noop,
    },
    window: { addEventListener: noop, devicePixelRatio: 1 },
    location: { hash: '#/area-de-trabalho', reload: noop },
    indexedDB: { open: () => null, deleteDatabase: noop },
    Store: { state: { dock: { anchor: 'bc', hover: false } }, save: noop },
    Panel: { toggle: noop, render: noop },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  for (const rel of ['public/js/util.js', 'public/js/workspace.js', 'public/js/router.js']) {
    const code = fs.readFileSync(path.resolve(process.cwd(), rel), 'utf8');
    vm.runInContext(code, sandbox, { filename: rel });
  }

  return sandbox;
}

test('Workspace dock icon uses clean two-card diagram and Router maps workspace to board', () => {
  const ctx = loadWorkspaceContext();
  const iconName = vm.runInContext('Router.icons.workspace', ctx);
  const svgPath = vm.runInContext('ICON_PATHS.board', ctx) as string;

  assert.equal(iconName, 'board');
  assert.ok(svgPath.includes('<rect x="3.5" y="4" width="8.5" height="7" rx="2"/>'));
  assert.ok(svgPath.includes('<rect x="12" y="13" width="8.5" height="7" rx="2"/>'));
});

test('Workspace cursor is standardized to 24px SVG hand/pointer adapted by interaction context', () => {
  const ctx = loadWorkspaceContext();
  assert.equal(vm.runInContext('wsNormCursor("dot-m")', ctx), 'hand');
  assert.equal(vm.runInContext('wsNormCursor("prec-l")', ctx), 'hand');

  const openCss = vm.runInContext('wsHandCursorCss(false)', ctx) as string;
  const closedCss = vm.runInContext('wsHandCursorCss(true)', ctx) as string;
  const pointerCss = vm.runInContext('wsPointerCursorCss()', ctx) as string;
  assert.ok(openCss.startsWith('url("data:image/svg+xml,'));
  assert.ok(openCss.endsWith('11 11, grab'));
  assert.ok(closedCss.endsWith('11 11, grabbing'));
  assert.ok(pointerCss.endsWith('9 4, pointer'));

  const decodedOpen = decodeURIComponent(openCss);
  const decodedPointer = decodeURIComponent(pointerCss);
  assert.ok(decodedOpen.includes('width="24" height="24"'));
  assert.ok(decodedPointer.includes('width="24" height="24"'));
  assert.notEqual(decodedOpen, decodedPointer);
});

test('Workspace.normalize clamps extended zoom range, PDF edit/mode/rotation, and image cards', () => {
  const ctx = loadWorkspaceContext();
  const normalized = JSON.parse(vm.runInContext(`JSON.stringify(Workspace.normalize({
    cursor: 'prec-m',
    view: { x: 10, y: 20, scale: 3.8 },
    pdfs: [{ id: 'p1', name: 'Artigo', size: 1000, pages: 12, highlights: [] }],
    images: [{ id: 'i1', name: 'Print', size: 2048, natW: 1280, natH: 720 }],
    cards: [
      { id: 'c1', type: 'pdf', pdfId: 'p1', x: 0, y: 0, page: 3, zoom: 5, editMode: true, pdfMode: 'pan', rotation: 90, hlColor: '#7cc4ff' },
      { id: 'c2', type: 'image', imgId: 'i1', x: 100, y: 80, w: 460, h: 320, zoom: 1.5 }
    ]
  }))`, ctx));

  assert.equal(normalized.cursor, 'hand');
  assert.equal(normalized.view.scale, 3.8);
  assert.equal(normalized.pdfs.length, 1);
  assert.equal(normalized.images.length, 1);
  assert.equal(normalized.images[0].natW, 1280);
  assert.equal(normalized.images[0].natH, 720);
  assert.equal(normalized.cards[0].w, 540);
  assert.equal(normalized.cards[0].h, 700);
  assert.equal(normalized.cards[0].zoom, 3.5);
  assert.equal(normalized.cards[0].editMode, true);
  assert.equal(normalized.cards[0].pdfMode, 'pan');
  assert.equal(normalized.cards[0].rotation, 90);
  assert.equal(normalized.cards[0].hlColor, '#7cc4ff');
  assert.equal(normalized.cards[1].type, 'image');
  assert.equal(normalized.cards[1].imgId, 'i1');
  assert.equal(normalized.cards[1].zoom, 1.5);
});

test('PDF bidirectional pagination clamps within [1, totalPages]', () => {
  const ctx = loadWorkspaceContext();
  vm.runInContext(`
    Workspace.board = Workspace.normalize({
      pdfs: [{ id: 'p1', name: 'Guia', size: 500, pages: 4, highlights: [] }],
      cards: [{ id: 'c1', type: 'pdf', pdfId: 'p1', x: 0, y: 0, page: 1, zoom: 1 }]
    });
    Workspace.renderPdfCard = () => Promise.resolve();
    Workspace.hideSelectionTools = () => {};
    Workspace.clearNativeSelection = () => {};
  `, ctx);

  vm.runInContext('Workspace.prevPdfPage(Workspace.board.cards[0])', ctx);
  assert.equal(vm.runInContext('Workspace.board.cards[0].page', ctx), 1);

  vm.runInContext('Workspace.nextPdfPage(Workspace.board.cards[0])', ctx);
  assert.equal(vm.runInContext('Workspace.board.cards[0].page', ctx), 2);

  vm.runInContext('Workspace.goPdfPage(Workspace.board.cards[0], 99)', ctx);
  assert.equal(vm.runInContext('Workspace.board.cards[0].page', ctx), 4);

  vm.runInContext('Workspace.prevPdfPage(Workspace.board.cards[0])', ctx);
  assert.equal(vm.runInContext('Workspace.board.cards[0].page', ctx), 3);
});

test('Workspace avoids native window.confirm so PDF and card deletion works inside iframes', () => {
  const code = fs.readFileSync(path.resolve(process.cwd(), 'public/js/workspace.js'), 'utf8');
  assert.equal(/\b(window\.)?confirm\s*\(/.test(code), false);
  assert.ok(code.includes('openConfirm('));
  assert.ok(code.includes('requestRemoveCard('));
});

test('WS_BG_SWATCHES exposes 14 unique options formatted in a 7x2 background grid with distinct light tones', () => {
  const ctx = loadWorkspaceContext();
  const swatches = JSON.parse(vm.runInContext('JSON.stringify(WS_BG_SWATCHES)', ctx)) as string[];
  assert.equal(swatches.length, 14);
  assert.equal(new Set(swatches).size, 14);
  assert.equal(swatches[0], '');
  swatches.slice(1).forEach((hex) => {
    assert.match(hex, /^#[0-9a-f]{6}$/i);
  });

  const parseRgb = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const lightSwatches = swatches.slice(7);
  assert.equal(lightSwatches.length, 7);
  for (let i = 0; i < lightSwatches.length; i++) {
    const a = parseRgb(lightSwatches[i]);
    const lum = (0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]) / 255;
    assert.ok(lum > 0.72, `expected light swatch ${lightSwatches[i]} to stay bright`);
    for (let j = i + 1; j < lightSwatches.length; j++) {
      const b = parseRgb(lightSwatches[j]);
      const dist = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      assert.ok(dist >= 25, `expected light swatches ${lightSwatches[i]} and ${lightSwatches[j]} to be clearly distinct (dist=${dist.toFixed(1)})`);
    }
  }

  const css = fs.readFileSync(path.resolve(process.cwd(), 'public/css/workspace.css'), 'utf8');
  assert.match(css, /\.ws-bg-color-grid\s*\{[^}]*grid-template-columns:\s*repeat\(7,\s*minmax\(0,\s*1fr\)\)/);
});

test('Pressing viewport in selectMode toggles marqueeing cursor class until pointer release', () => {
  const ctx = loadWorkspaceContext();
  const result = JSON.parse(vm.runInContext(`(() => {
    const cls = new Set();
    const vp = {
      classList: {
        add: (c) => cls.add(c),
        remove: (c) => cls.delete(c),
        toggle: (c, f) => (f ? cls.add(c) : cls.delete(c)),
        contains: (c) => cls.has(c)
      },
      setPointerCapture: () => {},
      releasePointerCapture: () => {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 1200, height: 800 })
    };
    Workspace.entered = true;
    Workspace.selectMode = true;
    Workspace.selectSpacePan = false;
    Workspace.board = Workspace.normalize({});
    Workspace.els = {
      viewport: vp,
      marquee: { hidden: true },
      shell: { classList: { toggle: () => {}, add: () => {}, remove: () => {} } },
      timerSettings: { hidden: true },
      selTools: { hidden: true },
      multiTools: { hidden: true },
      arrowTools: { hidden: true },
      popovers: { innerHTML: '' }
    };
    Workspace.closePopover = () => {};
    Workspace.closeTimerSettings = () => {};
    Workspace.hideSelectionTools = () => {};
    Workspace.cancelLink = () => {};
    Workspace.renderMultiTools = () => {};
    Workspace.renderArrows = () => {};
    Workspace.renderArrowTools = () => {};
    Workspace.renderInk = () => {};
    Workspace.hideSnapOverlay = () => {};
    Workspace.syncSelectionClasses = () => {};
    Workspace.onViewportPointerDown({
      button: 0,
      pointerId: 1,
      clientX: 100,
      clientY: 120,
      shiftKey: false,
      target: { closest: () => null },
      preventDefault: () => {}
    });
    const whilePressed = cls.has('marqueeing');
    Workspace.finishMarquee(true);
    const afterRelease = cls.has('marqueeing');
    return JSON.stringify({ whilePressed, afterRelease });
  })()`, ctx));

  assert.equal(result.whilePressed, true);
  assert.equal(result.afterRelease, false);
});

