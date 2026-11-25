import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function loadWorkspaceEditContext() {
  const noop = () => {};
  let activeEl: any = null;
  let selectionClearedCount = 0;
  let currentSelection: any = null;

  const makeEl = (tag: string, cls?: string, html?: string) => {
    const children: any[] = [];
    const classes = new Set((cls || '').split(/\s+/).filter(Boolean));
    const attrs: Record<string, string> = {};
    const listeners: Record<string, Array<{ fn: Function; capture: boolean }>> = {};

    const node: any = {
      tagName: tag.toUpperCase(),
      get className() {
        return Array.from(classes).join(' ');
      },
      set className(val: string) {
        classes.clear();
        String(val || '').split(/\s+/).filter(Boolean).forEach((c) => classes.add(c));
      },
      _innerHTML: html || '',
      get innerHTML() {
        return this._innerHTML;
      },
      set innerHTML(val: string) {
        this._innerHTML = String(val || '');
        children.length = 0;
        const tagRe = /<(div|span|button|textarea|input|label)\b([^>]*)>/gi;
        let m: RegExpExecArray | null;
        while ((m = tagRe.exec(this._innerHTML))) {
          const tName = m[1];
          const attrStr = m[2] || '';
          const clsMatch = attrStr.match(/\bclass\s*=\s*"([^"]*)"/i);
          const child = makeEl(tName, clsMatch ? clsMatch[1] : '');
          const dataMatches = attrStr.matchAll(/\bdata-([a-z0-9_-]+)(?:\s*=\s*"([^"]*)")?/gi);
          for (const dm of dataMatches) {
            const key = dm[1].replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
            child.dataset[key] = dm[2] ?? '';
          }
          child.parentNode = node;
          child.parentElement = node;
          children.push(child);
        }
      },
      textContent: '',
      innerText: '',
      value: '',
      type: '',
      disabled: false,
      hidden: false,
      readOnly: false,
      contentEditable: 'inherit',
      tabIndex: -1,
      scrollTop: 0,
      scrollLeft: 0,
      style: { setProperty: noop, removeProperty: noop },
      dataset: {},
      parentElement: null as any,
      parentNode: null as any,
      children,
      classList: {
        add: (...c: string[]) => c.forEach((x) => classes.add(x)),
        remove: (...c: string[]) => c.forEach((x) => classes.delete(x)),
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
      addEventListener: (ev: string, fn: Function, opts?: any) => {
        const capture = typeof opts === 'boolean' ? opts : !!(opts && opts.capture);
        if (!listeners[ev]) listeners[ev] = [];
        listeners[ev].push({ fn, capture });
      },
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 1200, height: 800, right: 1200, bottom: 800 }),
      _emit: (ev: string, eventObj: any, capturePhase?: boolean) => {
        const list = listeners[ev] || [];
        for (const entry of list) {
          if (capturePhase !== undefined && entry.capture !== capturePhase) continue;
          entry.fn(eventObj);
        }
      },
      append: (...items: any[]) => {
        items.forEach((item) => {
          if (item && typeof item === 'object') {
            item.parentNode = node;
            item.parentElement = node;
            children.push(item);
          }
        });
      },
      remove: () => {
        if (node.parentNode && Array.isArray(node.parentNode.children)) {
          node.parentNode.children = node.parentNode.children.filter((c: any) => c !== node);
        }
        node.parentNode = null;
        node.parentElement = null;
      },
      focus: () => {
        activeEl = node;
      },
      blur: () => {
        if (activeEl === node) activeEl = null;
      },
      select: noop,
      contains: (target: any): boolean => {
        if (!target) return false;
        if (target === node) return true;
        return children.some((c) => (c.contains ? c.contains(target) : c === target));
      },
      closest: (selector: string): any => {
        const parts = selector.split(',').map((s) => s.trim()).filter(Boolean);
        let cur: any = node;
        while (cur) {
          for (const sel of parts) {
            const mTag = sel.match(/^([a-z0-9]+)?(\.[a-z0-9_-]+)?$/i);
            if (mTag) {
              const reqTag = mTag[1] ? mTag[1].toUpperCase() : null;
              const reqCls = mTag[2] ? mTag[2].slice(1) : null;
              const tagOk = !reqTag || cur.tagName === reqTag;
              const clsOk = !reqCls || (cur.classList && cur.classList.contains(reqCls));
              if (tagOk && clsOk) return cur;
            }
          }
          cur = cur.parentElement;
        }
        return null;
      },
      querySelector: (sel: string): any => {
        const all = node.querySelectorAll(sel);
        return all[0] || null;
      },
      querySelectorAll: (sel: string): any[] => {
        const selectors = sel.split(',').map((s) => s.trim()).filter(Boolean);
        const out: any[] = [];
        const matches = (elNode: any, s: string): boolean => {
          if (!elNode || !elNode.tagName) return false;
          if (s.includes(' ')) {
            const [parentSel, childSel] = s.split(/\s+/);
            return matches(elNode, childSel) && !!elNode.parentElement?.closest?.(parentSel);
          }
          const attrMatch = s.match(/^\[([a-z0-9_-]+)(?:="([^"]*)")?\]$/i);
          if (attrMatch) {
            const attrName = attrMatch[1];
            if (attrName.startsWith('data-')) {
              const dKey = attrName.slice(5).replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
              if (!(dKey in (elNode.dataset || {}))) return false;
              return attrMatch[2] === undefined || elNode.dataset[dKey] === attrMatch[2];
            }
            const val = elNode.getAttribute(attrName);
            return val !== null && (attrMatch[2] === undefined || val === attrMatch[2]);
          }
          const m = s.match(/^([a-z0-9_-]+)?(\.[a-z0-9_-]+)?$/i);
          if (!m) return false;
          const reqTag = m[1] ? m[1].toUpperCase() : null;
          const reqCls = m[2] ? m[2].slice(1) : null;
          if (reqTag && elNode.tagName !== reqTag) return false;
          if (reqCls && !(elNode.classList && elNode.classList.contains(reqCls))) return false;
          return true;
        };
        const walk = (cur: any) => {
          for (const ch of cur.children || []) {
            if (selectors.some((s) => matches(ch, s))) out.push(ch);
            walk(ch);
          }
        };
        walk(node);
        return out;
      },
    };
    return node;
  };

  const docListeners: Record<string, Array<{ fn: Function; capture: boolean }>> = {};
  const worldEl = makeEl('div', 'ws-world');
  const viewportEl = makeEl('div', 'ws-viewport');
  viewportEl.append(worldEl);

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
    setTimeout: () => 0,
    clearTimeout: noop,
    setInterval: () => 1,
    clearInterval: noop,
    requestAnimationFrame: noop,
    localStorage: {
      getItem: () => null,
      setItem: noop,
      removeItem: noop,
    },
    getSelection: () => currentSelection,
    document: {
      get activeElement() {
        return activeEl;
      },
      documentElement: { dataset: {}, style: { setProperty: noop, removeProperty: noop } },
      body: { classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, dataset: {} },
      head: { appendChild: noop },
      createElement: (tag: string) => makeEl(tag),
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: (ev: string, fn: Function, opts?: any) => {
        const capture = typeof opts === 'boolean' ? opts : !!(opts && opts.capture);
        if (!docListeners[ev]) docListeners[ev] = [];
        docListeners[ev].push({ fn, capture });
      },
    },
    window: { addEventListener: noop, devicePixelRatio: 1 },
    location: { hash: '#/area-de-trabalho', reload: noop },
    indexedDB: { open: () => null, deleteDatabase: noop },
    Store: { state: { dock: { anchor: 'bc', hover: false } }, save: noop },
    Panel: { toggle: noop, render: noop },
  };
  sandbox.window = sandbox;
  sandbox.addEventListener = noop;
  sandbox.removeEventListener = noop;
  sandbox.window.getSelection = () => currentSelection;
  vm.createContext(sandbox);

  for (const rel of ['public/js/util.js', 'public/js/ws-brain.js', 'public/js/workspace.js']) {
    const code = fs.readFileSync(path.resolve(process.cwd(), rel), 'utf8');
    vm.runInContext(code, sandbox, { filename: rel });
  }

  vm.runInContext('toast = () => {};', sandbox);
  const Workspace = vm.runInContext('Workspace', sandbox);

  return {
    sandbox,
    Workspace,
    worldEl,
    viewportEl,
    docListeners,
    setActiveEl: (el: any) => { activeEl = el; },
    getActiveEl: () => activeEl,
    setSelectionOn: (anchorNode: any) => {
      currentSelection = {
        rangeCount: 1,
        anchorNode,
        focusNode: anchorNode,
        isCollapsed: false,
        removeAllRanges: () => {
          selectionClearedCount += 1;
          currentSelection = { rangeCount: 0, anchorNode: null, focusNode: null, removeAllRanges: noop };
        },
        toString: () => 'selected',
      };
    },
    getSelectionClearedCount: () => selectionClearedCount,
  };
}

test('wsCanEditCard only allows editing a uniquely selected card when no board tool mode is active', () => {
  const { sandbox } = loadWorkspaceEditContext();
  const wsCanEditCard = vm.runInContext('wsCanEditCard', sandbox) as Function;

  const one = new Set(['c1']);
  const two = new Set(['c1', 'c2']);
  const empty = new Set();

  assert.equal(wsCanEditCard({ cardId: 'c1', selectedIds: one, drawMode: false, selectMode: false, linkFrom: null }), true);
  assert.equal(wsCanEditCard({ cardId: 'c2', selectedIds: one, drawMode: false, selectMode: false, linkFrom: null }), false);
  assert.equal(wsCanEditCard({ cardId: 'c1', selectedIds: empty, drawMode: false, selectMode: false, linkFrom: null }), false);
  assert.equal(wsCanEditCard({ cardId: 'c1', selectedIds: two, drawMode: false, selectMode: false, linkFrom: null }), false);
  assert.equal(wsCanEditCard({ cardId: 'c1', selectedIds: one, drawMode: true, selectMode: false, linkFrom: null }), false);
  assert.equal(wsCanEditCard({ cardId: 'c1', selectedIds: one, drawMode: false, selectMode: true, linkFrom: null }), false);
  assert.equal(wsCanEditCard({ cardId: 'c1', selectedIds: one, drawMode: false, selectMode: false, linkFrom: 'c1' }), false);
});

test('Note, Concept, Checklist, and Group cards toggle editable/readOnly state cleanly on selection and deselection', () => {
  const { sandbox, Workspace, worldEl, viewportEl, docListeners, setActiveEl, getActiveEl, setSelectionOn, getSelectionClearedCount } = loadWorkspaceEditContext();

  Workspace.board = Workspace.normalize({
    cards: [
      { id: 'n1', type: 'note', x: 0, y: 0, w: 280, h: 170, text: 'Nota um' },
      { id: 'c1', type: 'concept', x: 320, y: 0, w: 300, h: 200, title: 'Conceito', tags: [], text: '' },
      { id: 'k1', type: 'checklist', x: 0, y: 220, w: 280, h: 220, title: 'Lista', items: [{ id: 'i1', text: 'Item 1', done: false }] },
      { id: 'g1', type: 'group', x: 320, y: 220, w: 360, h: 240, title: 'Grupo' },
    ],
  });
  Workspace.entered = true;
  const fallbackEl = sandbox.document.createElement('div');
  Workspace.els = new Proxy({
    world: worldEl,
    viewport: viewportEl,
    selTools: { hidden: true, addEventListener: () => {} },
    arrowTools: { hidden: true, addEventListener: () => {} },
    multiTools: { hidden: true, addEventListener: () => {} },
    timerSettings: { hidden: true },
    topbar: null,
    hint: null,
  } as any, {
    get: (target, prop) => (prop in target ? target[prop] : fallbackEl),
  });
  Workspace.updateTopbar = () => {};
  Workspace.updateHint = () => {};
  Workspace.renderMultiTools = () => {};
  Workspace.renderArrows = () => {};
  Workspace.renderArrowTools = () => {};
  Workspace.renderInk = () => {};
  Workspace.hideSnapOverlay = () => {};
  Workspace.updateEmpty = () => {};

  const noteCard = Workspace.board.cards[0];
  const conceptCard = Workspace.board.cards[1];
  const checkCard = Workspace.board.cards[2];
  const groupCard = Workspace.board.cards[3];

  const noteEl = Workspace.createCardEl(noteCard);
  const conceptEl = Workspace.createCardEl(conceptCard);
  const checkEl = Workspace.createCardEl(checkCard);
  const groupEl = Workspace.createCardEl(groupCard);

  const noteBody = noteEl.querySelector('.ws-note-body');
  const conceptTitle = conceptEl.querySelector('.ws-concept-title');
  const conceptTagsInp = conceptEl.querySelector('.ws-concept-tags-inp');
  const checkTitle = checkEl.querySelector('.ws-check-title');
  const groupTitle = groupEl.querySelector('.ws-group-title');

  // Initially unselected -> all locked
  assert.equal(noteBody.contentEditable, 'false');
  assert.equal(noteEl.classList.contains('is-editable'), false);
  assert.equal(conceptTitle.readOnly, true);
  assert.equal(conceptTagsInp.readOnly, true);
  assert.equal(checkTitle.readOnly, true);
  assert.equal(groupTitle.readOnly, true);

  // Select note exclusively -> editable; focus and active selection inside note
  Workspace.select('n1');
  assert.equal(noteEl.classList.contains('is-editable'), true);
  assert.equal(noteBody.contentEditable, 'true');
  assert.equal(noteBody.tabIndex, 0);
  noteBody.focus();
  setSelectionOn(noteBody);
  assert.equal(getActiveEl(), noteBody);

  // Clicking empty space (deselect) removes focus, clears selection, and locks noteBody
  Workspace.select(null);
  assert.equal(noteEl.classList.contains('is-editable'), false);
  assert.equal(noteBody.contentEditable, 'false');
  assert.equal(noteBody.tabIndex, -1);
  assert.equal(getActiveEl(), null);
  assert.equal(getSelectionClearedCount(), 1);

  // Re-select note and focus, then switch to concept card -> note blurs & locks, concept unlocks
  Workspace.select('n1');
  noteBody.focus();
  setSelectionOn(noteBody);
  Workspace.select('c1');
  assert.equal(noteBody.contentEditable, 'false');
  assert.equal(noteEl.classList.contains('is-editable'), false);
  assert.equal(getActiveEl(), null);
  assert.equal(conceptEl.classList.contains('is-editable'), true);
  assert.equal(conceptTitle.readOnly, false);

  // Multi-select disables editing on both
  Workspace.select('n1', { toggle: true });
  assert.equal(noteBody.contentEditable, 'false');
  assert.equal(conceptTitle.readOnly, true);
  assert.equal(conceptEl.classList.contains('is-editable'), false);

  // Select checklist solely, then enable draw mode -> clears selection & locks checklist
  Workspace.select('k1');
  assert.equal(checkTitle.readOnly, false);
  Workspace.setDrawMode(true);
  assert.equal(checkTitle.readOnly, true);
  assert.equal(Workspace.selectedIds.size, 0);
  Workspace.setDrawMode(false);
  assert.equal(checkTitle.readOnly, true);

  // Select checklist solely again, then toggle selectMode and beginLink -> locks and restores
  Workspace.select('k1');
  assert.equal(checkTitle.readOnly, false);
  Workspace.setSelectMode(true);
  assert.equal(checkTitle.readOnly, true);
  Workspace.setSelectMode(false);
  assert.equal(checkTitle.readOnly, false);
  Workspace.beginLink('k1');
  assert.equal(checkTitle.readOnly, true);
  Workspace.cancelLink();
  assert.equal(checkTitle.readOnly, false);

  // Select group solely, click outside card (on topbar button) -> blurs group title immediately
  Workspace.select('g1');
  assert.equal(groupTitle.readOnly, false);
  setActiveEl(groupTitle);
  const topBtn = sandbox.document.createElement('button');
  topBtn.className = 'ws-tool-btn';
  topBtn.classList.add('ws-tool-btn');
  Workspace.onDocPointerDown({ target: topBtn });
  assert.equal(getActiveEl(), null);
});

test('Capture world guards prevent accidental typing or pasting into unselected cards', () => {
  const { sandbox, Workspace, worldEl, docListeners, setActiveEl, getActiveEl } = loadWorkspaceEditContext();

  // Wire only the world input guards from bindEvents via a minimal mock workspace setup
  const listeners: Record<string, Function[]> = {};
  const mockWorld: any = {
    addEventListener: (ev: string, fn: Function) => {
      if (!listeners[ev]) listeners[ev] = [];
      listeners[ev].push(fn);
    },
  };
  const mockEl: any = {
    addEventListener: () => {},
    hidden: true,
    classList: { toggle: () => {}, add: () => {}, remove: () => {}, contains: () => false },
    querySelector: () => null,
    querySelectorAll: () => [],
  };
  Workspace.els = new Proxy({ viewport: mockEl, world: mockWorld } as any, {
    get: (target, prop) => (prop in target ? target[prop] : mockEl),
  });
  Workspace.bindEvents();

  const cardNode = worldEl;
  const noteCard = sandbox.document.createElement('article');
  noteCard.className = 'ws-card ws-note';
  noteCard.classList.add('ws-card', 'ws-note');
  noteCard.dataset.id = 'n_unselected';
  const body = sandbox.document.createElement('div');
  body.className = 'ws-note-body';
  body.classList.add('ws-note-body');
  noteCard.append(body);
  cardNode.append(noteCard);

  Workspace.selectedIds.clear();

  let prevented = false;
  let stopped = false;
  let blurred = false;
  const origBlur = body.blur;
  body.blur = () => { blurred = true; origBlur(); };

  listeners.beforeinput[0]({
    target: body,
    preventDefault: () => { prevented = true; },
    stopPropagation: () => { stopped = true; },
  });
  assert.equal(prevented, true);
  assert.equal(stopped, true);
  assert.equal(blurred, true);

  let pastePrevented = false;
  listeners.paste[0]({
    target: body,
    preventDefault: () => { pastePrevented = true; },
    stopPropagation: () => {},
  });
  assert.equal(pastePrevented, true);

  let keyPrevented = false;
  listeners.keydown[0]({
    key: 'a',
    target: body,
    preventDefault: () => { keyPrevented = true; },
    stopPropagation: () => {},
  });
  assert.equal(keyPrevented, true);

  // Also verify capture document pointerdown blurs any active card element when clicking outside .ws-card
  const captureDocPd = (docListeners.pointerdown || []).find((entry: any) => entry.capture);
  assert.ok(captureDocPd);
  Workspace.entered = true;
  setActiveEl(body);
  const outsideEl = sandbox.document.createElement('button');
  captureDocPd.fn({ target: outsideEl });
  assert.equal(getActiveEl(), null);
});
