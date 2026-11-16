import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function loadWorkspaceNoteSnapContext() {
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

  for (const rel of ['public/js/util.js', 'public/js/ink.js', 'public/js/ws-brain.js', 'public/js/ws-store.js', 'public/js/workspace.js']) {
    const code = fs.readFileSync(path.resolve(process.cwd(), rel), 'utf8');
    vm.runInContext(code, sandbox, { filename: rel });
  }
  return sandbox;
}

test('wsComputeSnap snaps to 26px world grid with magnetic pull and progressive moldStrength', () => {
  const ctx = loadWorkspaceNoteSnapContext();
  const out = JSON.parse(vm.runInContext(`(() => {
    const locked = wsComputeSnap({ x: 56, y: 100, w: 280, h: 170 }, []);
    const pulled = wsComputeSnap({ x: 70, y: 124, w: 280, h: 170 }, []);
    const far    = wsComputeSnap({ x: 65, y: 117, w: 280, h: 170 }, []);
    return JSON.stringify({ locked, pulled, far });
  })()`, ctx));

  // 52 is 2*26 (dist 4 <= 11), 104 is 4*26 (dist 4 <= 11)
  assert.equal(out.locked.snappedX, true);
  assert.equal(out.locked.snappedY, true);
  assert.equal(out.locked.x, 52);
  assert.equal(out.locked.y, 104);
  assert.equal(out.locked.near, true);
  assert.equal(out.locked.moldStrength, 1);

  // 52 + 10 = 62 is 10px from grid line 52 (between snapDist=7 and pullDist=28)
  const pullCase = JSON.parse(vm.runInContext(`(() => {
    return JSON.stringify(wsComputeSnap({ x: 52 + 10, y: 104 + 10, w: 280, h: 170 }, []));
  })()`, ctx));
  assert.equal(pullCase.snappedX, false);
  assert.equal(pullCase.targetX, 52);
  assert.ok(pullCase.x < 62 && pullCase.x > 52, 'should magnetically pull toward target 52');
  assert.ok(pullCase.moldStrength > out.far.moldStrength, 'closer target should have higher moldStrength');
});

test('wsComputeSnap aligns edges, centers, and 26px sibling gaps with guides', () => {
  const ctx = loadWorkspaceNoteSnapContext();
  const out = JSON.parse(vm.runInContext(`(() => {
    const sibling = { x: 100, y: 200, w: 280, h: 170 };
    const edgeAlign = wsComputeSnap({ x: 106, y: 410, w: 280, h: 170 }, [sibling]);
    const gapAlign = wsComputeSnap({ x: 400, y: 203, w: 280, h: 170 }, [sibling]);
    return JSON.stringify({ edgeAlign, gapAlign });
  })()`, ctx));

  assert.equal(out.edgeAlign.snappedX, true);
  assert.equal(out.edgeAlign.x, 100);
  assert.ok(out.edgeAlign.guideX && out.edgeAlign.guideX.pos === 100);

  // sibling.x + sibling.w + 26 = 100 + 280 + 26 = 406 (dist 6 <= 13)
  assert.equal(out.gapAlign.snappedX, true);
  assert.equal(out.gapAlign.x, 406);
  assert.equal(out.gapAlign.snappedY, true);
  assert.equal(out.gapAlign.y, 200);
  assert.ok(out.gapAlign.guideX && out.gapAlign.guideX.pos === 406);
  assert.ok(out.gapAlign.guideY && out.gapAlign.guideY.pos === 200);
});

test('rich note HTML sanitizing, plain-text roundtrip, and typography normalization', () => {
  const ctx = loadWorkspaceNoteSnapContext();
  const out = JSON.parse(vm.runInContext(`(() => {
    const dirty = '<div><strong>Olá</strong> <em>mundo</em><script>alert(1)</script><u onclick="evil()">!</u></div><ul data-bullet="arrow" data-bad="x"><li style="color:red; text-align: center">Item 1</li></ul>';
    const clean = wsSanitizeNoteHtml(dirty);
    const plain = wsNoteHtmlToPlainText(clean);
    const rebuilt = wsPlainTextToNoteHtml('Linha 1\\n\\nLinha 3');
    return JSON.stringify({
      clean,
      plain,
      rebuilt,
      fontOk: wsNormalizeNoteFont('playfair'),
      fontBad: wsNormalizeNoteFont('comic-sans'),
      sizeClamped: wsNormalizeNoteSize(99),
      alignOk: wsNormalizeNoteAlign('JUSTIFY'),
      alignBad: wsNormalizeNoteAlign('diagonal')
    });
  })()`, ctx));

  assert.equal(out.clean.includes('<script'), false);
  assert.equal(out.clean.includes('onclick'), false);
  assert.equal(out.clean.includes('<b>Olá</b>'), true);
  assert.equal(out.clean.includes('<i>mundo</i>'), true);
  assert.equal(out.clean.includes('<ul data-bullet="arrow">'), true);
  assert.equal(out.clean.includes('style="text-align:center"'), true);
  assert.equal(out.plain, 'Olá mundo!\nItem 1');
  assert.equal(out.rebuilt, '<div>Linha 1</div><div><br></div><div>Linha 3</div>');
  assert.equal(out.fontOk, 'playfair');
  assert.equal(out.fontBad, 'inter');
  assert.equal(out.sizeClamped, 28);
  assert.equal(out.alignOk, 'justify');
  assert.equal(out.alignBad, 'left');
});

test('wsShouldWheelScrollNote detects overflow cleanly', () => {
  const ctx = loadWorkspaceNoteSnapContext();
  const out = JSON.parse(vm.runInContext(`(() => {
    return JSON.stringify({
      short: wsShouldWheelScrollNote({ scrollHeight: 110, clientHeight: 110 }),
      subpixel: wsShouldWheelScrollNote({ scrollHeight: 112, clientHeight: 110 }),
      overflowing: wsShouldWheelScrollNote({ scrollHeight: 240, clientHeight: 110 }),
      missing: wsShouldWheelScrollNote(null)
    });
  })()`, ctx));

  assert.equal(out.short, false);
  assert.equal(out.subpixel, false);
  assert.equal(out.overflowing, true);
  assert.equal(out.missing, false);
});

test('Workspace.normalize and remapWorkspaceBundle preserve note rich styling and tint', () => {
  const ctx = loadWorkspaceNoteSnapContext();
  const out = JSON.parse(vm.runInContext(`(() => {
    const board = Workspace.normalize({
      cards: [{
        id: 'n1',
        type: 'note',
        x: 52,
        y: 78,
        w: 280,
        h: 170,
        html: '<div><b>Título</b></div><ul data-bullet="dash"><li>Ponto</li></ul>',
        accent: 'mint',
        font: 'fraunces',
        fontSize: 18,
        align: 'center',
        editMode: true
      }]
    });
    const bundle = buildWorkspaceExportBundle({ name: 'Teste Nota', board });
    const parsed = parseWorkspaceImportBundle(JSON.stringify(bundle), 'Teste');
    let k = 0;
    const remapped = remapWorkspaceBundle(parsed, () => 'id_' + (++k));
    const renorm = Workspace.normalize(remapped.board);
    return JSON.stringify({ note: board.cards[0], renormNote: renorm.cards[0] });
  })()`, ctx));

  assert.equal(out.note.text, 'Título\nPonto');
  assert.equal(out.note.accent, 'mint');
  assert.equal(out.note.font, 'fraunces');
  assert.equal(out.note.fontSize, 18);
  assert.equal(out.note.align, 'center');
  assert.equal(out.note.editMode, true);
  assert.equal(out.renormNote.accent, 'mint');
  assert.equal(out.renormNote.font, 'fraunces');
  assert.equal(out.renormNote.fontSize, 18);
  assert.equal(out.renormNote.align, 'center');
  assert.equal(out.renormNote.html.includes('data-bullet="dash"'), true);
});

test('wsComputeSnap suppresses guides for distant cards and ramps gridOpacity gradually by proximity', () => {
  const ctx = loadWorkspaceNoteSnapContext();
  const out = JSON.parse(vm.runInContext(`(() => {
    const anchor = { x: 100, y: 100, w: 280, h: 170 };
    const farSameCol = wsComputeSnap({ x: 100, y: 700, w: 280, h: 170 }, [anchor]);
    const mid = wsComputeSnap({ x: 100, y: 390, w: 280, h: 170 }, [anchor]);
    const near = wsComputeSnap({ x: 100, y: 296, w: 280, h: 170 }, [anchor]);
    return JSON.stringify({ farSameCol, mid, near });
  })()`, ctx));

  assert.equal(out.farSameCol.guideX, null, 'distant aligned notes must not draw a long continuous line');
  assert.equal(out.farSameCol.proximity, 0);
  assert.ok(Math.abs(out.farSameCol.gridOpacity - 0.38) < 0.001);

  assert.ok(out.mid.proximity > 0 && out.mid.proximity < out.near.proximity);
  assert.ok(out.mid.gridOpacity > out.farSameCol.gridOpacity && out.mid.gridOpacity < out.near.gridOpacity);
  assert.ok(out.near.guideX && out.near.guideX.pos === 100, 'nearby note draws short local guide');
  assert.equal(out.near.locked, true);
});

test('WS_ARROW_KINDS marks supports distinctly from relates', () => {
  const ctx = loadWorkspaceNoteSnapContext();
  const out = JSON.parse(vm.runInContext(`(() => {
    return JSON.stringify({
      relates: wsArrowKindMeta('relates'),
      supports: wsArrowKindMeta('supports')
    });
  })()`, ctx));

  assert.equal(Boolean(out.relates.support), false);
  assert.equal(out.supports.support, true);
});

