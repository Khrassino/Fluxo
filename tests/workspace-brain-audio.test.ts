import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function loadBrainAndAudioContext() {
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
    Panel: { toggle: noop, render: noop },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  const files = [
    'public/js/util.js',
    'public/js/storage.js',
    'public/js/audio.js',
    'public/js/ink.js',
    'public/js/ws-store.js',
    'public/js/ws-brain.js',
    'public/js/workspace.js',
  ];

  for (const rel of files) {
    const code = fs.readFileSync(path.resolve(process.cwd(), rel), 'utf8');
    vm.runInContext(code, sandbox, { filename: rel });
  }
  return sandbox;
}

test('Audio volume curve stays soft and bounded while supporting all cozy tracks', () => {
  const ctx = loadBrainAndAudioContext();
  const out = JSON.parse(vm.runInContext(`JSON.stringify({
    defVol: Store.defaults().music.volume,
    labels: TRACK_LABELS,
    g0: audioGainCurve(0),
    g35: audioGainCurve(0.35),
    g50: audioGainCurve(0.5),
    g100: audioGainCurve(1),
    h0: audioHtmlVolume(0),
    h50: audioHtmlVolume(0.5),
    h100: audioHtmlVolume(1)
  })`, ctx));

  assert.equal(out.defVol, 0.35);
  assert.equal(out.labels.rain, 'Chuva');
  assert.equal(out.labels.ocean, 'Oceano');
  assert.equal(out.labels.pad, 'Ambiente');
  assert.equal(out.labels.lofi, 'Lo-fi');
  assert.equal(out.labels.fireplace, 'Lareira');
  assert.equal(out.labels.night, 'Noite calma');

  assert.equal(out.g0, 0);
  assert.ok(out.g35 > 0.02 && out.g35 < 0.08);
  assert.ok(out.g50 > out.g35 && out.g50 < 0.12);
  assert.ok(out.g100 > out.g50 && out.g100 <= 0.35);
  assert.equal(out.h0, 0);
  assert.ok(out.h50 > 0.1 && out.h50 < 0.25);
  assert.ok(out.h100 > out.h50 && out.h100 <= 0.56);
});

test('ws-brain normalizes tags, checklists, arrows and computes group enclosure + connections', () => {
  const ctx = loadBrainAndAudioContext();
  const out = JSON.parse(vm.runInContext(`(() => {
    const tags = wsNormalizeTags('#Física, #termodinâmica; Energia energia #entropia!');
    const tagsLine = wsFormatTagsLine(tags);
    const items = wsNormalizeChecklistItems([
      { text: 'Revisar leis', done: true },
      { id: 'i2', text: 'Resolver lista', done: false }
    ], () => 'gen_1');
    const arrow = wsNormalizeArrow({
      id: 'a1',
      from: 'c1',
      to: 'c2',
      kind: 'contrast',
      dir: 'both',
      label: '  oposto   de ',
      color: '#ff8fa3'
    });
    const board = Workspace.normalize({
      cards: [
        { id: 'g1', type: 'group', x: 0, y: 0, w: 500, h: 400, title: 'Bloco A', accent: 'blue' },
        { id: 'c1', type: 'concept', x: 40, y: 60, w: 200, h: 150, title: 'Entropia', tags: ['fisica', 'calor'], text: 'Desordem', accent: 'mint' },
        { id: 'c2', type: 'checklist', x: 260, y: 80, w: 220, h: 160, title: 'Revisão', items, accent: 'amber' },
        { id: 'c3', type: 'note', x: 700, y: 80, w: 240, h: 160, text: 'Nota distante' }
      ],
      arrows: [arrow, { id: 'a2', from: 'c3', to: 'c1', kind: 'supports', dir: 'forward', label: 'comprova' }]
    });
    const childIds = wsGroupChildIds(board.cards, board.cards[0]);
    const conns = wsGetCardConnections(board, 'c1');
    return JSON.stringify({ tags, tagsLine, items, arrow, board, childIds, conns });
  })()`, ctx));

  assert.deepEqual(out.tags, ['física', 'termodinâmica', 'energia', 'entropia']);
  assert.equal(out.tagsLine, '#física · #termodinâmica · #energia · #entropia');
  assert.equal(out.items[0].id, 'gen_1');
  assert.equal(out.arrow.kind, 'contrast');
  assert.equal(out.arrow.dir, 'both');
  assert.equal(out.arrow.label, 'oposto de');
  assert.equal(out.board.cards.length, 4);
  assert.deepEqual(out.childIds, ['c1', 'c2']);
  assert.equal(out.conns.total, 2);
  assert.equal(out.conns.outgoing.length, 1);
  assert.equal(out.conns.incoming.length, 2);
});

test('wsSearchBoard finds across accents, #tags, checklists, PDFs, highlights and arrows', () => {
  const ctx = loadBrainAndAudioContext();
  const out = JSON.parse(vm.runInContext(`(() => {
    const board = {
      pdfs: [{ id: 'p1', name: 'Termodinâmica Aplicada', pages: 12, highlights: [{ id: 'h1', page: 5, color: '#ffd84d', text: 'Segunda lei da termodinâmica e entropia' }] }],
      images: [{ id: 'im1', name: 'Diagrama Carnot' }],
      cards: [
        { id: 'c1', type: 'concept', title: 'Ciclo de Carnot', tags: ['máquina', 'rendimento'], text: 'Eficiência máxima teórica' },
        { id: 'c2', type: 'checklist', title: 'Simulado Física', items: [{ id: '1', text: 'Fórmulas de gás ideal', done: false }] },
        { id: 'c3', type: 'pdf', pdfId: 'p1', page: 1 },
        { id: 'c4', type: 'image', imgId: 'im1' }
      ],
      arrows: [
        { id: 'a1', from: 'c3', to: 'c1', kind: 'supports', dir: 'forward', label: 'fundamenta' }
      ]
    };
    return JSON.stringify({
      accentSearch: wsSearchBoard(board, 'termodinamica'),
      tagSearch: wsSearchBoard(board, '#maquina'),
      arrowSearch: wsSearchBoard(board, 'fundamenta', { scope: 'links' }),
      pdfOnly: wsSearchBoard(board, 'entropia', { scope: 'pdfs' }),
      checkHit: wsSearchBoard(board, 'gas ideal', { scope: 'cards' })
    });
  })()`, ctx));

  assert.ok(out.accentSearch.some((h: any) => h.kind === 'pdf' && h.title === 'Termodinâmica Aplicada'));
  assert.ok(out.accentSearch.some((h: any) => h.kind === 'highlight' && h.page === 5));
  assert.equal(out.tagSearch[0].cardId, 'c1');
  assert.equal(out.arrowSearch.length, 1);
  assert.equal(out.arrowSearch[0].arrowId, 'a1');
  assert.equal(out.pdfOnly.length, 1);
  assert.equal(out.pdfOnly[0].page, 5);
  assert.equal(out.checkHit[0].cardId, 'c2');
});

test('wsSearchPdfPages indexes multi-page occurrences in page order with occOnPage counters', () => {
  const ctx = loadBrainAndAudioContext();
  const matches = JSON.parse(vm.runInContext(`JSON.stringify(wsSearchPdfPages([
    { page: 1, text: 'Introdução sobre energia térmica.' },
    { page: 2, text: 'A entropia cresce. Logo, entropia define a seta do tempo.' },
    { page: 3, text: 'Revisão final de ENTROPIA.' }
  ], 'entropia'))`, ctx));

  assert.equal(matches.length, 3);
  assert.deepEqual(
    matches.map((m: any) => ({ page: m.page, occ: m.occOnPage })),
    [
      { page: 2, occ: 0 },
      { page: 2, occ: 1 },
      { page: 3, occ: 0 }
    ]
  );
});

test('remapWorkspaceBundle preserves Second Brain cards and rich arrow metadata on .fluxo import', () => {
  const ctx = loadBrainAndAudioContext();
  const out = JSON.parse(vm.runInContext(`(() => {
    const board = Workspace.normalize({
      cards: [
        { id: 'c_con', type: 'concept', x: 20, y: 20, w: 300, h: 220, title: 'Sinapse', tags: ['neuro', 'memória'], text: 'Conexão neural', accent: 'violet' },
        { id: 'c_chk', type: 'checklist', x: 360, y: 20, w: 280, h: 220, title: 'Prática', items: [{ id: 'it1', text: 'Flashcards', done: true }], accent: 'mint' },
        { id: 'c_grp', type: 'group', x: 0, y: 0, w: 680, h: 320, title: 'Neurociência', accent: 'blue' }
      ],
      arrows: [
        { id: 'ar1', from: 'c_con', to: 'c_chk', kind: 'sequence', dir: 'both', label: 'próximo passo', color: '#5fe3c4' }
      ]
    });
    const bundle = buildWorkspaceExportBundle({ name: 'Cérebro', board });
    const parsed = parseWorkspaceImportBundle(JSON.stringify(bundle));
    let n = 0;
    const remapped = remapWorkspaceBundle(parsed, () => 'id_' + (++n));
    const norm = Workspace.normalize(remapped.board);
    return JSON.stringify(norm);
  })()`, ctx));

  assert.equal(out.cards.length, 3);
  assert.equal(out.cards[0].type, 'concept');
  assert.deepEqual(out.cards[0].tags, ['neuro', 'memória']);
  assert.equal(out.cards[1].type, 'checklist');
  assert.equal(out.cards[1].items[0].done, true);
  assert.equal(out.cards[2].type, 'group');
  assert.equal(out.arrows.length, 1);
  assert.equal(out.arrows[0].kind, 'sequence');
  assert.equal(out.arrows[0].dir, 'both');
  assert.equal(out.arrows[0].label, 'próximo passo');
  assert.equal(out.arrows[0].color, '#5fe3c4');
  assert.equal(out.arrows[0].from, out.cards[0].id);
  assert.equal(out.arrows[0].to, out.cards[1].id);
});

test('ws-brain computes marquee box intersections, stroke bounds, and batch stroke translation', () => {
  const ctx = loadBrainAndAudioContext();
  const out = JSON.parse(vm.runInContext(`(() => {
    const board = {
      cards: [
        { id: 'c1', type: 'note', x: 100, y: 100, w: 180, h: 120 },
        { id: 'c2', type: 'concept', x: 340, y: 110, w: 200, h: 140 },
        { id: 'c3', type: 'note', x: 900, y: 800, w: 180, h: 120 }
      ],
      strokes: [
        { id: 's1', tool: 'pen', size: 4, points: [{ x: 120, y: 260 }, { x: 240, y: 290 }] },
        { id: 's2', tool: 'marker', size: 8, points: [{ x: 820, y: 760 }, { x: 860, y: 780 }] }
      ]
    };
    const hitForward = wsFindItemsInBox(board, { x: 90, y: 90, w: 300, h: 220 });
    const hitReversed = wsFindItemsInBox(board, { x: 390, y: 310, w: -300, h: -220 });
    const sb1 = wsStrokeBounds(board.strokes[0]);
    const combined = wsStrokesBounds(board.strokes);
    wsMoveStrokePoints(board.strokes[0], 25, -15);
    return JSON.stringify({
      hitForward,
      hitReversed,
      sb1,
      combined,
      movedStart: board.strokes[0].points[0],
      intersects: wsRectsIntersect({ x: 0, y: 0, w: 50, h: 50 }, { x: 50, y: 50, w: 10, h: 10 }),
      disjoint: wsRectsIntersect({ x: 0, y: 0, w: 40, h: 40 }, { x: 41, y: 0, w: 20, h: 20 })
    });
  })()`, ctx));

  assert.deepEqual(out.hitForward.cardIds, ['c1', 'c2']);
  assert.deepEqual(out.hitForward.strokeIds, ['s1']);
  assert.deepEqual(out.hitReversed, out.hitForward);
  assert.ok(out.sb1.x < 120 && out.sb1.w >= 120);
  assert.ok(out.combined.x < 120 && out.combined.x + out.combined.w > 860);
  assert.deepEqual(out.movedStart, { x: 145, y: 245 });
  assert.equal(out.intersects, true);
  assert.equal(out.disjoint, false);
});

