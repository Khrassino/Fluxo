import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function loadWorkspaceUndoContext() {
  const noop = () => {};
  const filesStore = new Map<string, any>();
  const fileOps: Array<{ op: string; key: string }> = [];

  const makeEl = (tag: string, cls?: string, html?: string) => {
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
      isContentEditable: false,
      style: { setProperty: noop, removeProperty: noop },
      dataset: {},
      children: [],
      _listeners: {} as Record<string, Array<(e: any) => void>>,
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
      addEventListener: (ev: string, fn: (e: any) => void) => {
        if (!node._listeners[ev]) node._listeners[ev] = [];
        node._listeners[ev].push(fn);
      },
      append: (...items: any[]) => items.forEach(i => node.children.push(i)),
      querySelector: () => null,
      querySelectorAll: () => [],
      closest: () => null,
      contains: () => false,
      focus: noop,
      blur: noop,
      select: noop,
      remove: noop,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 1200, height: 800 }),
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
      activeElement: null,
      documentElement: { dataset: {}, style: { setProperty: noop, removeProperty: noop } },
      body: { classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, dataset: {} },
      head: { appendChild: noop },
      createElement: (tag: string) => makeEl(tag),
      createElementNS: (_ns: string, tag: string) => makeEl(tag),
      querySelector: () => null,
      querySelectorAll: () => [],
      getElementById: () => null,
      addEventListener: noop,
    },
    window: { addEventListener: noop, devicePixelRatio: 1, getSelection: () => null },
    location: { hash: '#/quadro', reload: noop },
    indexedDB: { open: () => null, deleteDatabase: noop },
    Store: { state: { lang: 'pt', dock: { anchor: 'bc', hover: false } }, save: noop },
    Panel: { toggle: noop, render: noop },
    toast: noop,
    _filesStore: filesStore,
    _fileOps: fileOps,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  for (const rel of ['public/js/util.js', 'public/js/i18n.js', 'public/js/ink.js', 'public/js/ws-brain.js', 'public/js/workspace.js']) {
    const code = fs.readFileSync(path.resolve(process.cwd(), rel), 'utf8');
    vm.runInContext(code, sandbox, { filename: rel });
  }

  vm.runInContext(`(() => {
    WorkspaceDB.putFile = (key, data) => {
      _fileOps.push({ op: 'put', key: String(key) });
      _filesStore.set(String(key), data);
      return Promise.resolve();
    };
    WorkspaceDB.getFile = (key) => {
      _fileOps.push({ op: 'get', key: String(key) });
      return Promise.resolve(_filesStore.has(String(key)) ? _filesStore.get(String(key)) : null);
    };
    WorkspaceDB.delFile = (key) => {
      _fileOps.push({ op: 'del', key: String(key) });
      _filesStore.delete(String(key));
      return Promise.resolve();
    };
    toast = () => {};
  })()`, sandbox);

  return { sandbox, filesStore, fileOps };
}

function setupMockWorkspace(sandbox: any, initialBoard?: any) {
  vm.runInContext(`(() => {
    const undoTopBtn = { disabled: true };
    const redoTopBtn = { disabled: true };
    const inkUndoBtn = { disabled: true };
    const inkRedoBtn = { disabled: true };
    const worldChildren = [];

    Workspace.els = {
      shell: { dataset: {}, classList: { toggle: () => {}, add: () => {}, remove: () => {} }, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1200, height: 800 }), style: { setProperty: () => {} } },
      viewport: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1200, height: 800 }), classList: { toggle: () => {}, add: () => {}, remove: () => {} }, setPointerCapture: () => {}, releasePointerCapture: () => {} },
      world: { append: () => {}, querySelectorAll: () => worldChildren },
      arrowLayer: { innerHTML: '', append: () => {} },
      arrowTools: { hidden: true, innerHTML: '', addEventListener: () => {} },
      multiTools: { hidden: true, innerHTML: '' },
      selTools: { hidden: true, innerHTML: '' },
      empty: { hidden: true },
      topbar: {
        querySelector: (sel) => {
          if (sel === '[data-act="undo"]') return undoTopBtn;
          if (sel === '[data-act="redo"]') return redoTopBtn;
          return null;
        }
      },
      inkBar: {
        hidden: true,
        querySelector: (sel) => {
          if (sel === '[data-inkact="undo"]') return inkUndoBtn;
          if (sel === '[data-inkact="redo"]') return inkRedoBtn;
          return null;
        }
      },
      snapLayer: null,
      popovers: { innerHTML: '' }
    };
    globalThis._mockBtns = { undoTopBtn, redoTopBtn, inkUndoBtn, inkRedoBtn };
    Workspace.entered = true;
    Workspace.wsIndex = { activeId: 'ws_default', items: [{ id: 'ws_default', name: 'Principal' }] };
    Workspace.board = Workspace.normalize(${JSON.stringify(initialBoard || {})});
    Workspace.clearRuntimeCaches();
    Workspace.createCardEl = (card) => {
      Workspace.cardEls.set(card.id, {
        dataset: { id: card.id },
        style: { setProperty: () => {}, removeProperty: () => {}, transform: '' },
        classList: { toggle: () => {}, add: () => {}, remove: () => {}, contains: () => false },
        querySelector: () => null,
        querySelectorAll: () => [],
        remove: () => {}
      });
    };
    Workspace.createArrowEl = (a) => {
      const dummy = { classList: { toggle: () => {} }, setAttribute: () => {}, remove: () => {} };
      Workspace.arrowEls.set(a.id, { g: dummy, line: dummy, hit: dummy, labelGroup: dummy });
    };
    Workspace.updateArrow = () => {};
    Workspace.updateArrowSelection = () => {};
    Workspace.renderArrowTools = () => {};
    Workspace.renderInk = () => {};
    Workspace.renderInkBar = () => {
      inkUndoBtn.disabled = !Workspace.canUndo();
      inkRedoBtn.disabled = !Workspace.canRedo();
    };
    Workspace.syncSelectionClasses = () => {};
    Workspace.syncCardEditability = () => {};
    Workspace.syncDockClearance = () => {};
    Workspace.hideSnapOverlay = () => {};
    Workspace.hideSelectionTools = () => {};
    Workspace.clearNativeSelection = () => {};
    Workspace.updateEmpty = () => {};
    Workspace.scheduleSave = () => {};
    Workspace.flushSave = () => Promise.resolve();
    Workspace.refreshPdfs = () => {};
    Workspace.renderAll();
  })()`, sandbox);
}

test('pure ws-brain undo/redo helpers handle snapshots, dedup, cap, redo clear, and file IDs', () => {
  const { sandbox } = loadWorkspaceUndoContext();
  const res = JSON.parse(vm.runInContext(`(() => {
    const b1 = {
      view: { x: 120, y: -40, scale: 1.5 },
      bg: { color: '#111', pattern: 'dots' },
      timer: { visible: true, remaining: 300 },
      cards: [{ id: 'n1', type: 'note', x: 10, y: 20, w: 280, h: 170, text: 'hello' }],
      arrows: [],
      pdfs: [{ id: 'pdf1', name: 'A.pdf' }],
      images: [{ id: 'img1', name: 'B.png' }],
      strokes: []
    };
    const s1 = wsCloneBoardSnapshot(b1);
    b1.cards[0].text = 'mutated';
    const b1SameContentDifferentView = Object.assign({}, b1, {
      view: { x: 999, y: 999, scale: 2 },
      cards: [{ id: 'n1', type: 'note', x: 10, y: 20, w: 280, h: 170, text: 'hello' }]
    });
    const s1b = wsCloneBoardSnapshot(b1SameContentDifferentView);

    let undo = [];
    let redo = [{ key: 'stale', data: {} }];

    // Pushing when before === after should be ignored
    const noopPush = wsPushUndoState(undo, redo, s1, s1b, 60);

    // Push real change
    const b2 = { cards: [{ id: 'n1', type: 'note', x: 10, y: 20, w: 280, h: 170, text: 'world' }], arrows: [], pdfs: [], images: [], strokes: [] };
    const s2 = wsCloneBoardSnapshot(b2);
    const p1 = wsPushUndoState(undo, redo, s1, s2, 60);
    undo = p1.undoStack;
    redo = p1.redoStack;

    // Duplicate consecutive push ignored
    const pDup = wsPushUndoState(undo, redo, s1, null, 60);

    // Cap enforcement at limit=3
    let cappedUndo = [];
    let cappedRedo = [];
    for (let i = 0; i < 5; i++) {
      const snap = wsCloneBoardSnapshot({ cards: [{ id: 'c' + i }], arrows: [], pdfs: [], images: [], strokes: [] });
      const pr = wsPushUndoState(cappedUndo, cappedRedo, snap, null, 3);
      cappedUndo = pr.undoStack;
    }

    // Step undo & redo
    const stepU = wsStepUndoState(undo, redo, s2, 60);
    const stepR = wsStepRedoState(stepU.undoStack, stepU.redoStack, s1, 60);

    // Collect file IDs across board + stacks
    const refIds = Array.from(wsCollectReferencedFileIds(
      { cards: [{ id: 'c', pdfId: 'pdf_cur' }], pdfs: [{ id: 'pdf_cur' }], images: [] },
      [s1],
      [{ data: { cards: [], pdfs: [], images: [{ id: 'img_redo' }] } }]
    )).sort();

    return JSON.stringify({
      isolatedClone: s1.data.cards[0].text,
      hasViewInSnapshot: 'view' in s1.data,
      equalIgnoringView: wsSnapshotsEqual(s1, s1b),
      noopPushed: noopPush.pushed,
      p1Pushed: p1.pushed,
      p1ClearedRedo: redo.length === 0,
      dupPushed: pDup.pushed,
      cappedIds: cappedUndo.map(x => x.data.cards[0].id),
      undoOk: stepU.ok && stepU.snapshot.data.cards[0].text === 'hello',
      redoOk: stepR.ok && stepR.snapshot.data.cards[0].text === 'world',
      refIds
    });
  })()`, sandbox));

  assert.equal(res.isolatedClone, 'hello');
  assert.equal(res.hasViewInSnapshot, false);
  assert.equal(res.equalIgnoringView, true);
  assert.equal(res.noopPushed, false);
  assert.equal(res.p1Pushed, true);
  assert.equal(res.p1ClearedRedo, true);
  assert.equal(res.dupPushed, false);
  assert.deepEqual(res.cappedIds, ['c2', 'c3', 'c4']);
  assert.equal(res.undoOk, true);
  assert.equal(res.redoOk, true);
  assert.deepEqual(res.refIds, ['img1', 'img_redo', 'pdf1', 'pdf_cur']);
});

test('Workspace create, delete, group, and arrow mutations undo & redo chronologically without altering view', () => {
  const { sandbox } = loadWorkspaceUndoContext();
  setupMockWorkspace(sandbox, {
    view: { x: 250, y: 180, scale: 1.25 },
    bg: { color: '#121826', pattern: 'grid' },
    timer: { visible: true, min: false, x: 40, y: 60 }
  });

  const res = JSON.parse(vm.runInContext(`(() => {
    const initCanUndo = Workspace.canUndo();
    const initCanRedo = Workspace.canRedo();

    const n1 = Workspace.addNote({ x: 100, y: 100, text: 'Note 1', focus: false });
    const c1 = Workspace.addConcept({ x: 450, y: 100, title: 'Concept 1', focus: false });
    const k1 = Workspace.addChecklist({ x: 100, y: 360, title: 'Checklist 1', focus: false });
    const ar = Workspace.makeArrow(n1.id, c1.id, { kind: 'supports' });

    // Group n1 and c1
    Workspace.selectedIds = new Set([n1.id, c1.id]);
    const g1 = Workspace.groupSelected();
    const countAfterGroup = Workspace.board.cards.length;

    // Undo group -> restores 3 cards + arrow
    Workspace.undo();
    const afterUndoGroup = Workspace.board.cards.length;

    // Undo arrow -> arrow gone, 3 cards stay
    Workspace.undo();
    const arrowsAfterUndoArrow = Workspace.board.arrows.length;

    // Pan viewport (must NOT be reset by undo/redo)
    Workspace.board.view = { x: -420, y: 310, scale: 0.9 };

    // Undo all 3 card creations
    Workspace.undo(); // remove k1
    Workspace.undo(); // remove c1
    Workspace.undo(); // remove n1
    const afterUndoAll = Workspace.board.cards.length;
    const viewPreserved = JSON.stringify(Workspace.board.view);

    // Redo everything back to the group!
    Workspace.redo(); // n1
    Workspace.redo(); // c1
    Workspace.redo(); // k1
    Workspace.redo(); // arrow
    Workspace.redo(); // group

    // Multi-delete selected (n1 + arrow)
    Workspace.selectedIds = new Set([n1.id]);
    return JSON.stringify({
      initCanUndo,
      initCanRedo,
      countAfterGroup,
      afterUndoGroup,
      arrowsAfterUndoArrow,
      afterUndoAll,
      viewPreserved,
      afterRedoCards: Workspace.board.cards.length,
      afterRedoArrows: Workspace.board.arrows.length,
      topUndoDisabled: _mockBtns.undoTopBtn.disabled,
      topRedoDisabled: _mockBtns.redoTopBtn.disabled,
      g1ExistsAfterRedo: Workspace.board.cards.some(c => c.id === g1.id)
    });
  })()`, sandbox));

  assert.equal(res.initCanUndo, false);
  assert.equal(res.initCanRedo, false);
  assert.equal(res.countAfterGroup, 4);
  assert.equal(res.afterUndoGroup, 3);
  assert.equal(res.arrowsAfterUndoArrow, 0);
  assert.equal(res.afterUndoAll, 0);
  assert.equal(res.viewPreserved, JSON.stringify({ x: -420, y: 310, scale: 0.9 }));
  assert.equal(res.afterRedoCards, 4);
  assert.equal(res.afterRedoArrows, 1);
  assert.equal(res.topUndoDisabled, false);
  assert.equal(res.topRedoDisabled, true);
  assert.equal(res.g1ExistsAfterRedo, true);
});

test('Workspace drag and resize push one atomic undo step only when moved/resized, including group children and strokes', () => {
  const { sandbox } = loadWorkspaceUndoContext();
  setupMockWorkspace(sandbox, {
    cards: [
      { id: 'g1', type: 'group', x: 50, y: 50, w: 500, h: 400, title: 'G' },
      { id: 'n1', type: 'note', x: 100, y: 140, w: 280, h: 170, text: 'inside' }
    ],
    strokes: [
      { id: 's1', tool: 'pen', color: '#fff', size: 4, points: [{ x: 20, y: 20, p: 0.5 }, { x: 40, y: 40, p: 0.5 }] }
    ]
  });

  const res = JSON.parse(vm.runInContext(`(() => {
    const g1 = Workspace.board.cards.find(c => c.id === 'g1');
    const n1 = Workspace.board.cards.find(c => c.id === 'n1');
    const s1 = Workspace.board.strokes[0];

    // 1. Click without moving (>3px threshold never reached)
    Workspace.startCardDrag({ button: 0, clientX: 60, clientY: 60, pointerId: 1, preventDefault: () => {}, stopPropagation: () => {} }, g1);
    Workspace.onPointerMove({ clientX: 61, clientY: 61, pointerId: 1 });
    Workspace.onPointerUp({ clientX: 61, clientY: 61, pointerId: 1 });
    const stackAfterNoMove = Workspace.undoStack.length;

    // 2. Drag group (moves group + child n1 together)
    Workspace.startCardDrag({ button: 0, clientX: 60, clientY: 60, pointerId: 2, preventDefault: () => {}, stopPropagation: () => {} }, g1);
    Workspace.onPointerMove({ clientX: 180, clientY: 140, pointerId: 2 });
    Workspace.onPointerUp({ clientX: 180, clientY: 140, pointerId: 2 });
    const movedCoords = { gx: g1.x, gy: g1.y, nx: n1.x, ny: n1.y };
    const stackAfterDrag = Workspace.undoStack.length;

    // 3. Resize n1 without changing dimensions -> no push
    const n1Cur = Workspace.board.cards.find(c => c.id === 'n1');
    Workspace.startResize({ button: 0, clientX: 300, clientY: 300, pointerId: 3, preventDefault: () => {}, stopPropagation: () => {} }, n1Cur);
    Workspace.onPointerUp({ clientX: 300, clientY: 300, pointerId: 3 });
    const stackAfterNoResize = Workspace.undoStack.length;

    // 4. Resize n1 cleanly
    Workspace.startResize({ button: 0, clientX: 300, clientY: 300, pointerId: 4, preventDefault: () => {}, stopPropagation: () => {} }, n1Cur);
    Workspace.onPointerMove({ clientX: 390, clientY: 360, pointerId: 4 });
    Workspace.onPointerUp({ clientX: 390, clientY: 360, pointerId: 4 });
    const resizedDims = { w: n1Cur.w, h: n1Cur.h };

    // 5. Drag stroke s1
    Workspace.selectedStrokes = new Set(['s1']);
    Workspace.selectedIds = new Set();
    Workspace.startStrokeSelectionDrag({ button: 0, clientX: 25, clientY: 25, pointerId: 5, preventDefault: () => {}, stopPropagation: () => {} });
    Workspace.onPointerMove({ clientX: 75, clientY: 85, pointerId: 5 });
    Workspace.onPointerUp({ clientX: 75, clientY: 85, pointerId: 5 });
    const movedStrokeX = Workspace.board.strokes[0].points[0].x;

    // Undo stroke drag
    Workspace.undo();
    const undoneStrokeX = Workspace.board.strokes[0].points[0].x;

    // Undo resize
    Workspace.undo();
    const n1AfterUndoResize = Workspace.board.cards.find(c => c.id === 'n1');

    // Undo group drag
    Workspace.undo();
    const g1AfterUndoDrag = Workspace.board.cards.find(c => c.id === 'g1');
    const n1AfterUndoDrag = Workspace.board.cards.find(c => c.id === 'n1');

    // Redo group drag + resize
    Workspace.redo();
    Workspace.redo();
    const n1AfterRedo = Workspace.board.cards.find(c => c.id === 'n1');

    return JSON.stringify({
      stackAfterNoMove,
      movedCoords,
      stackAfterDrag,
      stackAfterNoResize,
      resizedDims,
      movedStrokeX,
      undoneStrokeX,
      undoneResizeW: n1AfterUndoResize.w,
      undoneGroupX: g1AfterUndoDrag.x,
      undoneChildX: n1AfterUndoDrag.x,
      redoneChildX: n1AfterRedo.x,
      redoneChildW: n1AfterRedo.w
    });
  })()`, sandbox));

  assert.equal(res.stackAfterNoMove, 0);
  assert.deepEqual(res.movedCoords, { gx: 170, gy: 130, nx: 220, ny: 220 });
  assert.equal(res.stackAfterDrag, 1);
  assert.equal(res.stackAfterNoResize, 1);
  assert.deepEqual(res.resizedDims, { w: 370, h: 230 });
  assert.equal(res.movedStrokeX, 70);
  assert.equal(res.undoneStrokeX, 20);
  assert.equal(res.undoneResizeW, 280);
  assert.equal(res.undoneGroupX, 50);
  assert.equal(res.undoneChildX, 100);
  assert.equal(res.redoneChildX, 220);
  assert.equal(res.redoneChildW, 370);
});

test('Workspace stashes deleted image and PDF files in undoFiles and restores them on undo', async () => {
  const { sandbox, filesStore } = loadWorkspaceUndoContext();
  filesStore.set('img_1', 'data:image/png;base64,AAAA');
  filesStore.set('pdf_1', new Uint8Array([1, 2, 3, 4]).buffer);

  setupMockWorkspace(sandbox, {
    cards: [
      { id: 'c_img', type: 'image', imgId: 'img_1', x: 0, y: 0, w: 300, h: 240, zoom: 1 },
      { id: 'c_pdf', type: 'pdf', pdfId: 'pdf_1', x: 350, y: 0, w: 400, h: 520, page: 1, zoom: 1 }
    ],
    pdfs: [{ id: 'pdf_1', name: 'Slides', size: 4, pages: 2, highlights: [] }],
    images: [{ id: 'img_1', name: 'Diagram', size: 16, natW: 300, natH: 200 }]
  });

  vm.runInContext(`(() => {
    Workspace.imgUrls.set('img_1', 'data:image/png;base64,AAAA');
    Workspace.selectedIds = new Set(['c_img', 'c_pdf']);
    Workspace.selectedStrokes = new Set();
    Workspace.openConfirm = () => Promise.resolve(true);
  })()`, sandbox);

  await vm.runInContext('Workspace.deleteSelected()', sandbox);
  // Wait microtasks for async getFile -> delFile
  await new Promise(r => setTimeout(r, 10));

  assert.equal(filesStore.has('img_1'), false);
  assert.equal(filesStore.has('pdf_1'), false);
  assert.equal(vm.runInContext('Workspace.board.cards.length', sandbox), 0);
  assert.equal(vm.runInContext('Workspace.undoFiles.has("img_1") && Workspace.undoFiles.has("pdf_1")', sandbox), true);

  vm.runInContext('Workspace.undo()', sandbox);
  await new Promise(r => setTimeout(r, 10));

  assert.equal(vm.runInContext('Workspace.board.cards.length', sandbox), 2);
  assert.equal(filesStore.get('img_1'), 'data:image/png;base64,AAAA');
  assert.equal(filesStore.has('pdf_1'), true);
  assert.equal(vm.runInContext('Workspace.imgUrls.get("img_1")', sandbox), 'data:image/png;base64,AAAA');
});

test('Workspace createLinkedNoteAt batches note + arrow into 1 undo step, and continuous text undo + Ctrl+Z keyboard routing work', () => {
  const { sandbox } = loadWorkspaceUndoContext();
  setupMockWorkspace(sandbox, {
    cards: [
      { id: 'pdf_card', type: 'pdf', pdfId: 'p1', x: 0, y: 0, w: 400, h: 500, page: 3 }
    ],
    pdfs: [{ id: 'p1', name: 'Book', size: 100, pages: 10, highlights: [] }]
  });

  const res = JSON.parse(vm.runInContext(`(() => {
    const pdfCard = Workspace.board.cards[0];
    const linked = Workspace.createLinkedNoteAt(pdfCard, 500, 200);
    const afterBatchCards = Workspace.board.cards.length;
    const afterBatchArrows = Workspace.board.arrows.length;

    // 1 undo removes BOTH linked note and arrow
    Workspace.undo();
    const afterSingleUndoCards = Workspace.board.cards.length;
    const afterSingleUndoArrows = Workspace.board.arrows.length;

    // Redo restores both
    Workspace.redo();
    const afterRedoCards = Workspace.board.cards.length;
    const afterRedoArrows = Workspace.board.arrows.length;

    // Simulate continuous text typing with _textUndo on the note
    const note = Workspace.board.cards.find(c => c.id === linked.id);
    const fakeCtrl = {
      tagName: 'DIV',
      isContentEditable: true,
      closest: (sel) => sel.includes('.ws-card') ? { dataset: { id: note.id } } : (sel.includes('.ws-note-body') ? fakeCtrl : null)
    };
    Workspace.selectedIds = new Set([note.id]);
    Workspace.beginTextUndo(fakeCtrl);
    note.text = 'First draft';
    Workspace.scheduleTextUndo(fakeCtrl);
    const canUndoMidTyping = Workspace.canUndo();

    // Commit via blurCardInputs / Ctrl+Z directly
    let prevented = false;
    Workspace.onKeyDown({
      ctrlKey: true,
      metaKey: false,
      altKey: false,
      shiftKey: false,
      key: 'z',
      target: fakeCtrl,
      preventDefault: () => { prevented = true; }
    });
    const textAfterCtrlZ = Workspace.board.cards.find(c => c.id === note.id).text;

    // Redo via Ctrl+Shift+Z
    Workspace.onKeyDown({
      ctrlKey: true,
      metaKey: false,
      altKey: false,
      shiftKey: true,
      key: 'Z',
      target: fakeCtrl,
      preventDefault: () => {}
    });
    const textAfterCtrlShiftZ = Workspace.board.cards.find(c => c.id === note.id).text;

    // Transient input (.ws-formula-input) MUST NOT preventDefault (keep native Ctrl+Z)
    let formulaPrevented = false;
    const formulaTarget = {
      tagName: 'TEXTAREA',
      isContentEditable: false,
      value: '\\\\frac{a}{b}',
      closest: (sel) => sel.includes('.ws-formula-input') || sel.includes('.ws-card') ? formulaTarget : null
    };
    Workspace.onKeyDown({
      ctrlKey: true,
      metaKey: false,
      altKey: false,
      shiftKey: false,
      key: 'z',
      target: formulaTarget,
      preventDefault: () => { formulaPrevented = true; }
    });

    // Non-empty .ws-check-add input MUST NOT trigger board Ctrl+Z
    let nonEmptyCheckAddPrevented = false;
    const nonEmptyCheckAdd = {
      tagName: 'INPUT',
      isContentEditable: false,
      value: 'draft item',
      closest: (sel) => (sel.includes('.ws-check-add input') || sel.includes('.ws-card')) ? nonEmptyCheckAdd : null
    };
    Workspace.onKeyDown({
      ctrlKey: true,
      metaKey: false,
      altKey: false,
      shiftKey: false,
      key: 'z',
      target: nonEmptyCheckAdd,
      preventDefault: () => { nonEmptyCheckAddPrevented = true; }
    });

    // Empty auto-focused .ws-check-add input SHOULD undo board action!
    let emptyCheckAddPrevented = false;
    const emptyCheckAdd = {
      tagName: 'INPUT',
      isContentEditable: false,
      value: '',
      closest: (sel) => (sel.includes('.ws-check-add input') || sel.includes('.ws-card')) ? emptyCheckAdd : null
    };
    Workspace.onKeyDown({
      ctrlKey: true,
      metaKey: false,
      altKey: false,
      shiftKey: false,
      key: 'z',
      target: emptyCheckAdd,
      preventDefault: () => { emptyCheckAddPrevented = true; }
    });

    // Interleaved ink undo/redo uses the same timeline
    Workspace.pushInkUndo();
    Workspace.board.strokes.push({ id: 'ink_1', tool: 'pen', color: '#fff', size: 4, points: [{ x: 0, y: 0, p: 0.5 }] });
    Workspace.undoInk();
    const strokesAfterUndoInk = Workspace.board.strokes.length;
    Workspace.redoInk();
    const strokesAfterRedoInk = Workspace.board.strokes.length;

    return JSON.stringify({
      afterBatchCards,
      afterBatchArrows,
      afterSingleUndoCards,
      afterSingleUndoArrows,
      afterRedoCards,
      afterRedoArrows,
      canUndoMidTyping,
      prevented,
      textAfterCtrlZ,
      textAfterCtrlShiftZ,
      formulaPrevented,
      nonEmptyCheckAddPrevented,
      emptyCheckAddPrevented,
      strokesAfterUndoInk,
      strokesAfterRedoInk
    });
  })()`, sandbox));

  assert.equal(res.afterBatchCards, 2);
  assert.equal(res.afterBatchArrows, 1);
  assert.equal(res.afterSingleUndoCards, 1);
  assert.equal(res.afterSingleUndoArrows, 0);
  assert.equal(res.afterRedoCards, 2);
  assert.equal(res.afterRedoArrows, 1);
  assert.equal(res.canUndoMidTyping, true);
  assert.equal(res.prevented, true);
  assert.equal(res.textAfterCtrlZ, '');
  assert.equal(res.textAfterCtrlShiftZ, 'First draft');
  assert.equal(res.formulaPrevented, false);
  assert.equal(res.nonEmptyCheckAddPrevented, false);
  assert.equal(res.emptyCheckAddPrevented, true);
  assert.equal(res.strokesAfterUndoInk, 0);
  assert.equal(res.strokesAfterRedoInk, 1);
});
