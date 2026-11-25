import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function loadWorkspaceGroupContext() {
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
      tabIndex: -1,
      contentEditable: 'false',
      spellcheck: false,
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
      focus: noop,
      blur: noop,
      select: noop,
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
    Infinity,
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
    Store: { state: { lang: 'pt', dock: { anchor: 'bc', hover: false } }, save: noop },
    Panel: { toggle: noop, render: noop },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  for (const rel of ['public/js/util.js', 'public/js/i18n.js', 'public/js/ws-brain.js', 'public/js/workspace.js']) {
    const code = fs.readFileSync(path.resolve(process.cwd(), rel), 'utf8');
    vm.runInContext(code, sandbox, { filename: rel });
  }

  return sandbox;
}

test('wsComputeGroupBounds returns null when fewer than two non-group cards are selected', () => {
  const ctx = loadWorkspaceGroupContext();
  const res = JSON.parse(vm.runInContext(`(() => {
    const cards = [
      { id: 'n1', type: 'note', x: 100, y: 120, w: 280, h: 170 },
      { id: 'g1', type: 'group', x: 50, y: 50, w: 440, h: 320 }
    ];
    return JSON.stringify({
      empty: wsComputeGroupBounds(cards, new Set()),
      oneNote: wsComputeGroupBounds(cards, new Set(['n1'])),
      notePlusGroup: wsComputeGroupBounds(cards, new Set(['n1', 'g1'])),
      countNotePlusGroup: wsCountGroupableCards(cards, new Set(['n1', 'g1']))
    });
  })()`, ctx));

  assert.equal(res.empty, null);
  assert.equal(res.oneNote, null);
  assert.equal(res.notePlusGroup, null);
  assert.equal(res.countNotePlusGroup, 1);
});

test('wsComputeGroupBounds wraps mixed selected cards with clearance for header and bottom hint', () => {
  const ctx = loadWorkspaceGroupContext();
  const res = JSON.parse(vm.runInContext(`(() => {
    const cards = [
      { id: 'n1', type: 'note', x: 100, y: 200, w: 280, h: 170 },
      { id: 'c1', type: 'concept', x: 450, y: 120, w: 310, h: 230 },
      { id: 'k1', type: 'checklist', x: 240, y: 420, w: 300, h: 250 },
      { id: 'other', type: 'note', x: 1200, y: 900, w: 280, h: 170 }
    ];
    const bounds = wsComputeGroupBounds(cards, new Set(['n1', 'c1', 'k1']));
    const groupCard = Object.assign({ id: 'g-new', type: 'group' }, bounds);
    const children = wsGroupChildIds(cards.concat([groupCard]), groupCard);
    return JSON.stringify({ bounds, children });
  })()`, ctx));

  // minX=100, maxX=450+310=760 -> x=76, w=660+48=708
  // minY=120, maxY=420+250=670 -> y=56, h=550+64+46=660
  assert.equal(res.bounds.x, 76);
  assert.equal(res.bounds.y, 56);
  assert.equal(res.bounds.w, 708);
  assert.equal(res.bounds.h, 660);
  assert.deepEqual(res.bounds.childIds, ['n1', 'c1', 'k1']);
  assert.deepEqual(res.children, ['n1', 'c1', 'k1']);
});

test('Workspace.renderMultiTools shows Group button only when >= 2 groupable cards are selected', () => {
  const ctx = loadWorkspaceGroupContext();
  const res = JSON.parse(vm.runInContext(`(() => {
    const box = { hidden: true, innerHTML: '' };
    Workspace.els = { multiTools: box };
    Workspace.syncDockClearance = () => {};
    Workspace.board = Workspace.normalize({
      cards: [
        { id: 'n1', type: 'note', x: 0, y: 0, w: 280, h: 170 },
        { id: 'c1', type: 'concept', x: 340, y: 40, w: 310, h: 230 }
      ]
    });

    // Only strokes selected -> no Group button
    Workspace.selectedIds = new Set();
    Workspace.selectedStrokes = new Set(['s1']);
    Workspace.renderMultiTools();
    const strokesHtml = box.innerHTML;

    // 1 card + 1 stroke -> no Group button
    Workspace.selectedIds = new Set(['n1']);
    Workspace.selectedStrokes = new Set(['s1']);
    Workspace.renderMultiTools();
    const oneCardStrokeHtml = box.innerHTML;

    // 2 cards -> Group, Delete, Clear all present (PT)
    Workspace.selectedIds = new Set(['n1', 'c1']);
    Workspace.selectedStrokes = new Set();
    Workspace.renderMultiTools();
    const twoCardsPt = box.innerHTML;

    // English translation check
    Store.state.lang = 'en';
    Workspace.renderMultiTools();
    const twoCardsEn = box.innerHTML;

    return JSON.stringify({ strokesHtml, oneCardStrokeHtml, twoCardsPt, twoCardsEn });
  })()`, ctx));

  assert.equal(res.strokesHtml.includes('data-mact="group"'), false);
  assert.equal(res.strokesHtml.includes('data-mact="del"'), true);
  assert.equal(res.oneCardStrokeHtml.includes('data-mact="group"'), false);
  assert.equal(res.oneCardStrokeHtml.includes('data-mact="del"'), true);
  assert.equal(res.twoCardsPt.includes('data-mact="group"'), true);
  assert.equal(res.twoCardsPt.includes('Agrupar'), true);
  assert.equal(res.twoCardsPt.includes('Excluir'), true);
  assert.equal(res.twoCardsPt.includes('Limpar'), true);
  assert.equal(res.twoCardsEn.includes('Group'), true);
  assert.equal(res.twoCardsEn.includes('Delete'), true);
  assert.equal(res.twoCardsEn.includes('Clear'), true);
});

test('Workspace.groupSelected creates an enclosing group card, selects it, and preserves large bounds in normalize', () => {
  const ctx = loadWorkspaceGroupContext();
  const res = JSON.parse(vm.runInContext(`(() => {
    const multiBox = { hidden: false, innerHTML: 'x' };
    Workspace.els = {
      multiTools: multiBox,
      viewport: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1200, height: 800 }), classList: { remove: () => {} } },
      world: { append: () => {}, querySelectorAll: () => [] },
      empty: { hidden: true }
    };
    Workspace.board = Workspace.normalize({
      cards: [
        { id: 'n1', type: 'note', x: 100, y: 150, w: 280, h: 170 },
        { id: 'k1', type: 'checklist', x: 2600, y: 200, w: 300, h: 250 }
      ]
    });
    Workspace.selectedIds = new Set(['n1', 'k1']);
    Workspace.selectedStrokes = new Set();
    Workspace.createCardEl = (card) => { Workspace.cardEls.set(card.id, { classList: { toggle: () => {} }, querySelector: () => null }); };
    Workspace.syncSelectionClasses = () => {};
    Workspace.syncCardEditability = () => {};
    Workspace.updateArrowSelection = () => {};
    Workspace.renderArrowTools = () => {};
    Workspace.syncDockClearance = () => {};
    Workspace.renderInk = () => {};
    Workspace.hideSnapOverlay = () => {};
    Workspace.hideSelectionTools = () => {};
    Workspace.clearNativeSelection = () => {};
    Workspace.updateEmpty = () => {};
    Workspace.scheduleSave = () => {};

    const created = Workspace.groupSelected();
    const children = wsGroupChildIds(Workspace.board.cards, created);
    const reloaded = Workspace.normalize(Workspace.board);
    const reloadedGroup = reloaded.cards.find(c => c.id === created.id);

    return JSON.stringify({
      created,
      children,
      selectedAfter: Array.from(Workspace.selectedIds),
      multiHidden: multiBox.hidden,
      reloadedW: reloadedGroup && reloadedGroup.w
    });
  })()`, ctx));

  assert.equal(res.created.type, 'group');
  assert.ok(res.created.w > 2400);
  assert.equal(res.reloadedW, res.created.w);
  assert.deepEqual(res.children, ['n1', 'k1']);
  assert.deepEqual(res.selectedAfter, [res.created.id]);
  assert.equal(res.multiHidden, true);
});
