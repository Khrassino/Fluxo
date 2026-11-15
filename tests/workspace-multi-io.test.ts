import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function loadWorkspaceStoreContext() {
  const noop = () => {};
  const makeEl = (tag: string, cls?: string, html?: string) => {
    const classes = new Set((cls || '').split(/\s+/).filter(Boolean));
    const attrs: Record<string, string> = {};
    return {
      tagName: tag.toUpperCase(),
      className: cls || '',
      innerHTML: html || '',
      textContent: '',
      value: '',
      disabled: false,
      hidden: false,
      style: { setProperty: noop, removeProperty: noop },
      dataset: {},
      children: [],
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
      append: noop,
      querySelector: () => null,
      querySelectorAll: () => [],
    };
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
    Uint8Array,
    ArrayBuffer,
    btoa: (str: string) => Buffer.from(str, 'binary').toString('base64'),
    atob: (b64: string) => Buffer.from(b64, 'base64').toString('binary'),
    encodeURIComponent,
    setTimeout,
    clearTimeout,
    setInterval: () => 1,
    clearInterval: noop,
    requestAnimationFrame: noop,
    cancelAnimationFrame: noop,
    localStorage: { getItem: () => null, setItem: noop, removeItem: noop, length: 0, key: () => null },
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

  for (const rel of ['public/js/util.js', 'public/js/ink.js', 'public/js/ws-store.js', 'public/js/workspace.js']) {
    const code = fs.readFileSync(path.resolve(process.cwd(), rel), 'utf8');
    vm.runInContext(code, sandbox, { filename: rel });
  }
  return sandbox;
}

test('multi-workspace registry creates, switches, renames, deletes and enforces 5-workspace limit', () => {
  const ctx = loadWorkspaceStoreContext();
  const res = JSON.parse(vm.runInContext(`(() => {
    let idx = wsDefaultIndex(1000);
    const created = [];
    for (let i = 2; i <= 6; i++) {
      const r = wsCreateWorkspaceEntry(idx, 'Estudo ' + i, 'ws_' + i, 1000 + i);
      created.push({ ok: r.ok, reason: r.reason || null, count: r.index.items.length });
      idx = r.index;
    }
    const ren = wsRenameWorkspaceEntry(idx, 'ws_3', 'Biologia', 2000);
    idx = ren.index;
    const sw = wsSwitchWorkspaceEntry(idx, 'ws_2');
    idx = sw.index;
    const del = wsDeleteWorkspaceEntry(idx, 'ws_2');
    idx = del.index;

    let single = wsDefaultIndex(1000);
    const delLast = wsDeleteWorkspaceEntry(single, single.activeId);
    return JSON.stringify({ created, idx, delNext: del.nextActiveId, delLastOk: delLast.ok, delLastReason: delLast.reason });
  })()`, ctx));

  assert.equal(res.created[0].ok, true);
  assert.equal(res.created[3].ok, true);
  assert.equal(res.created[3].count, 5);
  assert.equal(res.created[4].ok, false);
  assert.equal(res.created[4].reason, 'limit');
  assert.equal(res.idx.items.length, 4);
  assert.equal(res.idx.items.find((x: any) => x.id === 'ws_3').name, 'Biologia');
  assert.equal(res.delNext, 'ws_3');
  assert.equal(res.delLastOk, false);
  assert.equal(res.delLastReason, 'last');
});

test('wsArrayBufferToBase64 and wsBase64ToArrayBuffer roundtrip large binary buffers cleanly', () => {
  const ctx = loadWorkspaceStoreContext();
  const ok = vm.runInContext(`(() => {
    const len = 100000;
    const src = new Uint8Array(len);
    for (let i = 0; i < len; i++) src[i] = (i * 31 + 7) & 255;
    const b64 = wsArrayBufferToBase64(src.buffer);
    const out = new Uint8Array(wsBase64ToArrayBuffer(b64));
    if (out.length !== src.length) return false;
    for (let i = 0; i < len; i++) {
      if (out[i] !== src[i]) return false;
    }
    return true;
  })()`, ctx);

  assert.equal(ok, true);
});

test('buildWorkspaceExportBundle, parseWorkspaceImportBundle and remapWorkspaceBundle roundtrip full board & files with fresh IDs', () => {
  const ctx = loadWorkspaceStoreContext();
  const out = JSON.parse(vm.runInContext(`(() => {
    const pdfBytes = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52]).buffer;
    const board = Workspace.normalize({
      bg: { color: '#121826', image: true },
      view: { x: 240, y: 180, scale: 1.25 },
      pdfs: [{ id: 'pdf_old', name: 'Apostila', size: 8, pages: 3, highlights: [] }],
      images: [{ id: 'img_old', name: 'Print', size: 120, natW: 640, natH: 480 }],
      cards: [
        { id: 'c_note', type: 'note', x: 10, y: 20, w: 280, h: 170, text: 'Resumo', source: { pdfId: 'pdf_old', page: 2 } },
        { id: 'c_pdf', type: 'pdf', pdfId: 'pdf_old', x: 320, y: 20, w: 500, h: 660, page: 2, zoom: 1.5 },
        { id: 'c_img', type: 'image', imgId: 'img_old', x: 10, y: 240, w: 300, h: 240, zoom: 1 }
      ],
      arrows: [{ id: 'a_old', from: 'c_pdf', to: 'c_note' }],
      strokes: [{ id: 's_old', tool: 'pen', nib: 'fountain', color: '#5fe3c4', size: 4.5, points: [{ x: 0, y: 0, p: 0.8 }, { x: 40, y: 50, p: 0.9 }] }]
    });
    const bundle = buildWorkspaceExportBundle({
      name: 'Quadro Física',
      board,
      bgDataUrl: 'data:image/png;base64,AAAA',
      pdfBuffers: { pdf_old: pdfBytes },
      imageUrls: { img_old: 'data:image/png;base64,BBBB' },
      exportedAt: '2026-01-01T00:00:00.000Z'
    });
    const serialized = JSON.stringify(bundle);
    const parsed = parseWorkspaceImportBundle(serialized, 'fallback');
    let seq = 0;
    const remapped = remapWorkspaceBundle(parsed, () => 'new_' + (++seq));
    const norm = Workspace.normalize(remapped.board);
    const pdfOut = Array.from(new Uint8Array(remapped.pdfFiles[norm.pdfs[0].id]));
    const invalid = parseWorkspaceImportBundle('not-json', 'x');
    return JSON.stringify({
      ok: parsed.ok,
      name: remapped.name,
      norm,
      bgDataUrl: remapped.bgDataUrl,
      imgFile: remapped.imageFiles[norm.images[0].id],
      pdfOut,
      invalidOk: invalid.ok
    });
  })()`, ctx));

  assert.equal(out.ok, true);
  assert.equal(out.name, 'Quadro Física');
  assert.equal(out.norm.cards.length, 3);
  assert.equal(out.norm.arrows.length, 1);
  assert.equal(out.norm.strokes.length, 1);
  assert.notEqual(out.norm.pdfs[0].id, 'pdf_old');
  assert.notEqual(out.norm.images[0].id, 'img_old');
  assert.equal(out.norm.cards[0].source.pdfId, out.norm.pdfs[0].id);
  assert.equal(out.norm.cards[1].pdfId, out.norm.pdfs[0].id);
  assert.equal(out.norm.cards[2].imgId, out.norm.images[0].id);
  assert.equal(out.norm.arrows[0].from, out.norm.cards[1].id);
  assert.equal(out.norm.arrows[0].to, out.norm.cards[0].id);
  assert.equal(out.bgDataUrl, 'data:image/png;base64,AAAA');
  assert.equal(out.imgFile, 'data:image/png;base64,BBBB');
  assert.deepEqual(out.pdfOut, [37, 80, 68, 70, 45, 49, 46, 52]);
  assert.equal(out.invalidOk, false);
});

test('classifyWheelGesture distinguishes touchpad two-finger pan, pinch zoom, and mouse wheel zoom', () => {
  const ctx = loadWorkspaceStoreContext();
  const out = JSON.parse(vm.runInContext(`(() => {
    const s = { lastPanAt: 0 };
    return JSON.stringify({
      touchpadDiag: classifyWheelGesture({ deltaX: 12, deltaY: 18, deltaMode: 0, ctrlKey: false, timeStamp: 100 }, s),
      touchpadVertSmall: classifyWheelGesture({ deltaX: 0, deltaY: 16, deltaMode: 0, ctrlKey: false, timeStamp: 150 }, s),
      touchpadMomentumFast: classifyWheelGesture({ deltaX: 0, deltaY: 88, deltaMode: 0, ctrlKey: false, timeStamp: 220 }, s),
      touchpadPinch: classifyWheelGesture({ deltaX: 0, deltaY: -4, deltaMode: 0, ctrlKey: true, timeStamp: 240 }, s),
      mouseWheelNotch: classifyWheelGesture({ deltaX: 0, deltaY: -120, deltaMode: 0, ctrlKey: false, timeStamp: 900 }, s),
      shiftWheelPan: classifyWheelGesture({ deltaX: 0, deltaY: -120, deltaMode: 0, shiftKey: true, timeStamp: 1200 }, s)
    });
  })()`, ctx));

  assert.equal(out.touchpadDiag, 'pan');
  assert.equal(out.touchpadVertSmall, 'pan');
  assert.equal(out.touchpadMomentumFast, 'pan');
  assert.equal(out.touchpadPinch, 'zoom');
  assert.equal(out.mouseWheelNotch, 'zoom');
  assert.equal(out.shiftWheelPan, 'pan');
});
