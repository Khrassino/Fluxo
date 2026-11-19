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
    'public/js/i18n.js',
    'public/js/audio.js',
    'public/js/ink.js',
    'public/js/ws-store.js',
    'public/js/ws-brain.js',
    'public/js/ws-math.js',
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
  assert.equal(out.labels.lofi, undefined);
  assert.equal(out.labels.fireplace, 'Lareira');
  assert.equal(out.labels.night, 'Noite calma');
  assert.equal(out.labels.typing, 'Toques');
  assert.equal(out.labels.keys, 'Teclas');
  assert.equal(out.labels.writing, 'Escrita');

  assert.equal(out.g0, 0);
  assert.ok(out.g35 > 0.02 && out.g35 < 0.08);
  assert.ok(out.g50 > out.g35 && out.g50 < 0.12);
  assert.ok(out.g100 > out.g50 && out.g100 <= 0.35);
  assert.equal(out.h0, 0);
  assert.ok(out.h50 > 0.1 && out.h50 < 0.25);
  assert.ok(out.h100 > out.h50 && out.h100 <= 0.56);
});

test('Typing and Writing ambient study tracks synthesize nodes cleanly and stop without leaks', () => {
  const ctx = loadBrainAndAudioContext();
  const out = JSON.parse(vm.runInContext(`(() => {
    const makeParam = (init = 0) => ({
      value: init,
      setValueAtTime: () => {},
      linearRampToValueAtTime: () => {},
      exponentialRampToValueAtTime: () => {},
      setTargetAtTime: () => {},
    });
    const makeNode = (extra = {}) => Object.assign({
      connect: () => {},
      disconnect: () => {},
      start: () => {},
      stop: () => {},
    }, extra);
    window.AudioContext = function MockAudioContext() {
      this.sampleRate = 44100;
      this.currentTime = 1.0;
      this.state = 'running';
      this.destination = makeNode();
      this.resume = () => Promise.resolve();
      this.createGain = () => makeNode({ gain: makeParam(1) });
      this.createBiquadFilter = () => makeNode({ type: 'lowpass', frequency: makeParam(1000), Q: makeParam(1) });
      this.createDynamicsCompressor = () => makeNode({
        threshold: makeParam(-24), knee: makeParam(18), ratio: makeParam(4), attack: makeParam(0.04), release: makeParam(0.25)
      });
      this.createOscillator = () => makeNode({ type: 'sine', frequency: makeParam(440), detune: makeParam(0) });
      this.createBuffer = (_ch, len) => ({
        getChannelData: () => new Float32Array(len)
      });
      this.createBufferSource = () => makeNode({ buffer: null, loop: false });
    };

    Store.load();
    Sound.play('typing');
    const typingState = {
      playing: Sound.playing,
      track: Store.state.music.track,
      nodes: Sound.nodes.length,
      timers: Sound.timers.length,
    };
    Sound.play('writing');
    const writingState = {
      playing: Sound.playing,
      track: Store.state.music.track,
      nodes: Sound.nodes.length,
      timers: Sound.timers.length,
    };
    Sound.stop();
    const stoppedState = {
      playing: Sound.playing,
      nodes: Sound.nodes.length,
      timers: Sound.timers.length,
    };
    return JSON.stringify({ typingState, writingState, stoppedState });
  })()`, ctx));

  assert.equal(out.typingState.playing, true);
  assert.equal(out.typingState.track, 'typing');
  assert.ok(out.typingState.nodes >= 3);
  assert.ok(out.typingState.timers >= 1);

  assert.equal(out.writingState.playing, true);
  assert.equal(out.writingState.track, 'writing');
  assert.ok(out.writingState.nodes >= 3);
  assert.ok(out.writingState.timers >= 1);

  assert.equal(out.stoppedState.playing, false);
  assert.equal(out.stoppedState.nodes, 0);
  assert.equal(out.stoppedState.timers, 0);
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

test('ws-math detects delimiters, renders fractions/subscripts/Greek, preserves rich HTML formatting, and wraps selections', () => {
  const ctx = loadBrainAndAudioContext();
  const out = JSON.parse(vm.runInContext(`(() => {
    const hasInline = wsHasMathDelimiters('Energia $E = mc^2$ e momento');
    const hasDisplay = wsHasMathDelimiters('$$\\\\int_0^1 x^2 dx$$');
    const noPrice = wsHasMathDelimiters('Custa $10 ou $20');
    const rendered = wsRenderTextWithMath('Fração: $\\\\frac{\\\\alpha + x_i}{2}$');
    const noteHtml = wsRenderNoteDisplayHtml('<div><b>Lei:</b> $a^2 + b^2 = c^2$</div>');
    const wrappedEmpty = wsWrapMathSelection('Texto ', 6, 6, false);
    const wrappedSel = wsWrapMathSelection('Calcule x^2 agora', 8, 11, true);
    return JSON.stringify({ hasInline, hasDisplay, noPrice, rendered, noteHtml, wrappedEmpty, wrappedSel });
  })()`, ctx));

  assert.equal(out.hasInline, true);
  assert.equal(out.hasDisplay, true);
  assert.equal(out.noPrice, false);
  assert.ok(out.rendered.includes('ws-math-inline'));
  assert.ok(out.rendered.includes('ws-m-frac'));
  assert.ok(out.rendered.includes('α'));
  assert.ok(out.noteHtml.startsWith('<div><b>Lei:</b>'));
  assert.ok(out.noteHtml.includes('ws-m-sup'));
  assert.equal(out.wrappedEmpty.text, 'Texto $\\frac{a}{b}$');
  assert.equal(out.wrappedSel.text, 'Calcule $$x^2$$ agora');
});

test('ws-brain computes organic multi-lane arrow curves, Prompt #10 port caps, bg patterns, and Shift resize snapping', () => {
  const ctx = loadBrainAndAudioContext();
  const out = JSON.parse(vm.runInContext(`(() => {
    const g0 = wsArrowCurveGeometry({ x: 0, y: 0 }, { x: 240, y: 40 }, { x: 0, y: 0 }, { x: 240, y: 40 }, 0);
    const gLanePos = wsArrowCurveGeometry({ x: 0, y: 0 }, { x: 240, y: 40 }, { x: 0, y: 0 }, { x: 240, y: 40 }, 18);
    const gLaneNeg = wsArrowCurveGeometry({ x: 0, y: 0 }, { x: 240, y: 40 }, { x: 0, y: 0 }, { x: 240, y: 40 }, -18);

    const capsAutoForward = wsResolveArrowCaps({ dir: 'forward', kind: 'relates', startCap: 'auto', endCap: 'auto' });
    const capsAutoSupports = wsResolveArrowCaps({ dir: 'forward', kind: 'supports', startCap: 'auto', endCap: 'auto' });
    const capsAutoContrast = wsResolveArrowCaps({ dir: 'none', kind: 'contrast', startCap: 'auto', endCap: 'auto' });
    const capsSequence = wsResolveArrowCaps({ dir: 'forward', kind: 'sequence', startCap: 'auto', endCap: 'auto' });
    const capsCustom = wsResolveArrowCaps({ dir: 'both', kind: 'contrast', startCap: 'circle-open', endCap: 'diamond' });

    const normBoard = Workspace.normalize({
      bg: { pattern: 'lines', color: '#121826' },
      cards: [
        { id: 'c1', type: 'note', x: 0, y: 0, w: 200, h: 120 },
        { id: 'c2', type: 'note', x: 260, y: 0, w: 260, h: 180 }
      ],
      arrows: [
        { id: 'a1', from: 'c1', to: 'c2', kind: 'relates', dir: 'forward', startCap: 'circle', endCap: 'square-open' }
      ]
    });

    const gridSnap = wsComputeResizeSnap({ x: 0, y: 0, w: 211, h: 129 }, [], { minW: 190, minH: 96 });
    const edgeSnap = wsComputeResizeSnap(
      { x: 0, y: 0, w: 257, h: 177 },
      [{ id: 'c2', x: 0, y: 240, w: 260, h: 180 }],
      { minW: 190, minH: 96 }
    );

    return JSON.stringify({
      g0,
      gLanePos,
      gLaneNeg,
      capsAutoForward,
      capsAutoSupports,
      capsAutoContrast,
      capsSequence,
      capsCustom,
      normBgPattern: normBoard.bg.pattern,
      normArrow: normBoard.arrows[0],
      badBgPattern: wsNormalizeBgPattern('unknown'),
      gridSnap,
      edgeSnap
    });
  })()`, ctx));

  assert.ok(out.g0.d.startsWith('M'));
  assert.ok(out.g0.d.includes(' C'));
  assert.notEqual(out.gLanePos.d, out.gLaneNeg.d);
  assert.deepEqual(out.capsAutoForward, { startCap: 'circle-open', endCap: 'circle' });
  assert.deepEqual(out.capsAutoSupports, { startCap: 'diamond', endCap: 'diamond' });
  assert.deepEqual(out.capsAutoContrast, { startCap: 'square-open', endCap: 'square-open' });
  assert.deepEqual(out.capsSequence, { startCap: 'none', endCap: 'arrow' });
  assert.deepEqual(out.capsCustom, { startCap: 'circle-open', endCap: 'diamond' });
  assert.equal(out.normBgPattern, 'lines');
  assert.equal(out.badBgPattern, 'dots');
  assert.equal(out.normArrow.startCap, 'circle');
  assert.equal(out.normArrow.endCap, 'square-open');

  assert.equal(out.gridSnap.w, 208);
  assert.equal(out.gridSnap.h, 130);
  assert.equal(out.edgeSnap.snappedX, true);
  assert.equal(out.edgeSnap.w, 260);
});

test('wsResolveArrowEndpoints, wsBuildArrowGeometry, wsResolveArrowStyle, and pair index implement Prompt #10 link spec', () => {
  const ctx = loadBrainAndAudioContext();
  const out = JSON.parse(vm.runInContext(`(() => {
    const epRelates = wsResolveArrowEndpoints({ kind: 'relates', dir: 'none', startCap: 'auto', endCap: 'auto' });
    const epContrast = wsResolveArrowEndpoints({ kind: 'contrast', dir: 'none', startCap: 'auto', endCap: 'auto' });
    const epSupports = wsResolveArrowEndpoints({ kind: 'supports', dir: 'forward', startCap: 'auto', endCap: 'auto' });
    const epSupportsBoth = wsResolveArrowEndpoints({ kind: 'supports', dir: 'both', startCap: 'auto', endCap: 'auto' });
    const epSequence = wsResolveArrowEndpoints({ kind: 'sequence', dir: 'forward', startCap: 'auto', endCap: 'auto' });
    const epCustomLegacy = wsResolveArrowEndpoints({ kind: 'supports', dir: 'forward', startCap: 'circle-open', endCap: 'bar' });

    const r1 = { x: 100, y: 100, w: 200, h: 120 };
    const r2 = { x: 460, y: 100, w: 200, h: 120 };

    const gSCurve = wsBuildArrowGeometry(r1, r2, { routing: 's-curve', startOffset: 0, endOffset: 0, laneOffset: 0 });
    const gSeq = wsBuildArrowGeometry(r1, r2, { routing: 's-curve', startOffset: 0, endOffset: 2, laneOffset: 0 });
    const gStraight = wsBuildArrowGeometry(r1, r2, { routing: 'straight', startOffset: 0, endOffset: 0, laneOffset: 0 });
    const gOrtho = wsBuildArrowGeometry(r1, r2, { routing: 'orthogonal', startOffset: 0, endOffset: 0, laneOffset: 0 });
    const gOrganicLane = wsBuildArrowGeometry(r1, r2, { routing: 'organic', startOffset: 0, endOffset: 0, laneOffset: 20 });

    const defs = wsNormalizeLinkDefaults({
      routing: 'orthogonal',
      types: {
        supports: { cap: 'diamond', lineStyle: 'dashed', width: 2.5, color: '#5fe3c4' }
      }
    });
    const stInherited = wsResolveArrowStyle({ kind: 'supports', routing: 'auto', lineStyle: 'auto', width: 0, color: '' }, defs);
    const stOverride = wsResolveArrowStyle({ kind: 'supports', routing: 'straight', lineStyle: 'dotted', width: 3, color: '#ff8fa3' }, defs);

    const pairIdx = wsBuildArrowPairIndex([
      { id: 'a1', from: 'c1', to: 'c2' },
      { id: 'a2', from: 'c2', to: 'c1' },
      { id: 'a3', from: 'c1', to: 'c3' }
    ]);

    const board = Workspace.normalize({
      linkDefaults: defs,
      cards: [
        { id: 'c1', type: 'note', x: 0, y: 0, w: 200, h: 120 },
        { id: 'c2', type: 'note', x: 300, y: 0, w: 200, h: 120 }
      ],
      arrows: [{ id: 'a1', from: 'c1', to: 'c2', kind: 'supports', dir: 'forward', routing: 'orthogonal', lineStyle: 'dashed', width: 2.5 }]
    });
    const bundle = buildWorkspaceExportBundle({ name: 'TesteLinks', board });
    const parsed = parseWorkspaceImportBundle(JSON.stringify(bundle));
    let n = 0;
    const remapped = remapWorkspaceBundle(parsed, () => 'x_' + (++n));

    return JSON.stringify({
      epRelates, epContrast, epSupports, epSupportsBoth, epSequence, epCustomLegacy,
      gSCurve, gSeq, gStraight, gOrtho, gOrganicLane,
      stInherited, stOverride,
      pairCountC1C2: (pairIdx.get(wsArrowCardPairKey('c1', 'c2')) || []).length,
      pairCountC1C3: (pairIdx.get(wsArrowCardPairKey('c1', 'c3')) || []).length,
      roundtripDefs: remapped.board.linkDefaults,
      roundtripArrow: remapped.board.arrows[0]
    });
  })()`, ctx));

  assert.equal(out.epRelates.start.shape, 'circle');
  assert.equal(out.epRelates.start.mode, 'open');
  assert.equal(out.epRelates.end.shape, 'circle');
  assert.equal(out.epRelates.end.mode, 'open');

  assert.equal(out.epContrast.start.shape, 'square');
  assert.equal(out.epContrast.start.mode, 'open');
  assert.equal(out.epContrast.end.shape, 'square');
  assert.equal(out.epContrast.end.mode, 'open');

  assert.equal(out.epSupports.start.shape, 'diamond');
  assert.equal(out.epSupports.start.mode, 'open');
  assert.equal(out.epSupports.end.shape, 'diamond');
  assert.equal(out.epSupports.end.mode, 'core');

  assert.equal(out.epSupportsBoth.start.mode, 'core');
  assert.equal(out.epSupportsBoth.end.mode, 'core');

  assert.equal(out.epSequence.start.shape, 'none');
  assert.equal(out.epSequence.end.shape, 'arrow');
  assert.equal(out.epSequence.end.outsideOffset, 2);

  assert.equal(out.epCustomLegacy.start.shape, 'circle');
  assert.equal(out.epCustomLegacy.start.mode, 'open');
  assert.equal(out.epCustomLegacy.end.shape, 'bar');

  assert.equal(out.gSCurve.x1, 300);
  assert.equal(out.gSCurve.x2, 460);
  assert.equal(out.gSeq.x2, 458);
  assert.equal(out.gStraight.x1, 300);
  assert.ok(out.gStraight.d.includes(' L'));
  assert.ok(out.gOrtho.d.includes(' L'));
  assert.equal(out.gOrganicLane.x1, 300);
  assert.equal(out.gOrganicLane.x2, 460);
  assert.ok(out.gSCurve.ly < out.gSCurve.my);

  assert.equal(out.stInherited.routing, 'orthogonal');
  assert.equal(out.stInherited.lineStyle, 'dashed');
  assert.equal(out.stInherited.width, 2.5);
  assert.equal(out.stInherited.color, '#5fe3c4');
  assert.ok(out.stInherited.dashArray.length > 0);
  assert.equal(out.stOverride.routing, 'straight');
  assert.equal(out.stOverride.lineStyle, 'dotted');
  assert.equal(out.stOverride.width, 3);
  assert.equal(out.stOverride.color, '#ff8fa3');

  assert.equal(out.pairCountC1C2, 2);
  assert.equal(out.pairCountC1C3, 1);
  assert.equal(out.roundtripDefs.routing, 'orthogonal');
  assert.equal(out.roundtripDefs.types.supports.lineStyle, 'dashed');
  assert.equal(out.roundtripArrow.routing, 'orthogonal');
  assert.equal(out.roundtripArrow.lineStyle, 'dashed');
  assert.equal(out.roundtripArrow.width, 2.5);
});

test('ws-math handles escaped dollars, multi-line display math, aligned/array environments, and overset/xrightarrow', () => {
  const ctx = loadBrainAndAudioContext();
  const out = JSON.parse(vm.runInContext(`(() => {
    const escapedPrice = wsHasMathDelimiters('Preço \\\\$10 e \\\\$20');
    const escapedRender = wsRenderTextWithMath('Total \\\\$50 para $x \\\\leqslant y$');
    const multiDisplay = wsRenderTextWithMath('$$a = 1 \\\\\\\\ b = 2$$');
    const alignedEnv = wsRenderTextWithMath('$$\\\\begin{aligned} x &= 1 \\\\\\\\ y &= 2 \\\\\\\\end{aligned}$$');
    const arrayEnv = wsRenderTextWithMath('$$\\\\begin{array}{lc} A & 1 \\\\\\\\ B & 2 \\\\\\\\end{array}$$');
    const arrowsOps = wsRenderTextWithMath("$\\\\overset{def}{=} \\\\underset{x\\\\to 0}{\\\\lim} \\\\xrightarrow[baixo]{acima} f''(x)$");
    return JSON.stringify({ escapedPrice, escapedRender, multiDisplay, alignedEnv, arrayEnv, arrowsOps });
  })()`, ctx));

  assert.equal(out.escapedPrice, false);
  assert.ok(out.escapedRender.includes('$50'));
  assert.ok(out.escapedRender.includes('⩽'));
  assert.ok(out.multiDisplay.includes('ws-m-dline'));
  assert.ok(out.alignedEnv.includes('ws-m-aligned'));
  assert.ok(out.arrayEnv.includes('ws-m-col-l') && out.arrayEnv.includes('ws-m-col-c'));
  assert.ok(out.arrowsOps.includes('ws-m-limits') && out.arrowsOps.includes('ws-m-xarrow') && out.arrowsOps.includes('″'));
});

test('i18n supports switching to English across workspace, arrow caps, routings, link defaults, bg patterns, and audio tracks', () => {
  const ctx = loadBrainAndAudioContext();
  const out = JSON.parse(vm.runInContext(`(() => {
    Store.load();
    I18n.setLang('en');
    return JSON.stringify({
      lang: getLang(),
      brand: wsTr('ws.brand'),
      bgLines: wsTr('ws.bg.lines'),
      capCircle: wsTr('ws.arrow.capCircle'),
      seqLabel: wsTr('ws.arrow.sequence'),
      orthoLabel: wsTr('ws.arrow.routing.orthogonal'),
      advLabel: wsTr('ws.arrow.advanced'),
      linkDefsTitle: wsTr('ws.linkDefsPopTitle'),
      mathTitle: wsTr('ws.mathInsertTitle'),
      groupHint: wsTr('ws.groupHint'),
      typingLabel: getTrackLabel('typing'),
      keysLabel: getTrackLabel('keys'),
      writingLabel: getTrackLabel('writing')
    });
  })()`, ctx));

  assert.equal(out.lang, 'en');
  assert.equal(out.brand, 'Workspace');
  assert.equal(out.bgLines, 'Lines');
  assert.equal(out.capCircle, 'Circle');
  assert.equal(out.seqLabel, 'Sequence');
  assert.equal(out.orthoLabel, 'Orthogonal');
  assert.equal(out.advLabel, 'Advanced');
  assert.equal(out.linkDefsTitle, 'Link settings');
  assert.ok(out.mathTitle.includes('LaTeX'));
  assert.ok(out.groupHint.includes('Alt'));
  assert.equal(out.typingLabel, 'Taps');
  assert.equal(out.keysLabel, 'Keys');
  assert.equal(out.writingLabel, 'Writing');
});

test('ws-math validates syntax errors and preserves lastValidHtml fallback cleanly', () => {
  const ctx = loadBrainAndAudioContext();
  const out = JSON.parse(vm.runInContext(`(() => {
    const empty = wsValidateTex('   ');
    const badBraces = wsValidateTex('\\\\frac{a}{b');
    const badDelim = wsValidateTex('\\\\left( x + 1');
    const badEnv = wsValidateTex('\\\\begin{aligned} x &= 1');
    const badArg = wsValidateTex('\\\\frac{a}');
    const badScript = wsValidateTex('x^');
    const badCmd = wsValidateTex('x + \\\\');

    const okFrac = wsValidateTex('\\\\frac{\\\\alpha}{2} + x^2');
    const okAligned = wsValidateTex('\\\\begin{aligned} x &= 1 \\\\\\\\ y &= 2 \\\\end{aligned}');
    const okFence = wsValidateTex('\\\\left( x \\\\right.');

    const safeValid = wsRenderTexSafe('\\\\frac{a}{b}', false, '');
    const safeInvalidWithFallback = wsRenderTexSafe('\\\\frac{a}{', false, safeValid.innerHtml);
    const safeInvalidNoFallback = wsRenderTexSafe('\\\\frac{a}{', true, '');

    return JSON.stringify({
      empty, badBraces, badDelim, badEnv, badArg, badScript, badCmd,
      okFrac, okAligned, okFence,
      safeValid, safeInvalidWithFallback, safeInvalidNoFallback
    });
  })()`, ctx));

  assert.equal(out.empty.valid, false);
  assert.equal(out.empty.isEmpty, true);
  assert.equal(out.empty.code, 'empty');

  assert.equal(out.badBraces.valid, false);
  assert.equal(out.badBraces.code, 'braces');

  assert.equal(out.badDelim.valid, false);
  assert.equal(out.badDelim.code, 'delim');

  assert.equal(out.badEnv.valid, false);
  assert.equal(out.badEnv.code, 'env');

  assert.equal(out.badArg.valid, false);
  assert.equal(out.badArg.code, 'arg');

  assert.equal(out.badScript.valid, false);
  assert.equal(out.badScript.code, 'script');

  assert.equal(out.badCmd.valid, false);
  assert.equal(out.badCmd.code, 'cmd');

  assert.equal(out.okFrac.valid, true);
  assert.equal(out.okAligned.valid, true);
  assert.equal(out.okFence.valid, true);

  assert.equal(out.safeValid.valid, true);
  assert.equal(out.safeValid.usedFallback, false);
  assert.ok(out.safeValid.html.includes('data-tex="\\\\frac{a}{b}"') || out.safeValid.html.includes('data-tex="\\frac{a}{b}"'));
  assert.ok(out.safeValid.html.includes('data-display="0"'));
  assert.ok(out.safeValid.innerHtml.includes('ws-m-frac'));

  assert.equal(out.safeInvalidWithFallback.valid, false);
  assert.equal(out.safeInvalidWithFallback.usedFallback, true);
  assert.equal(out.safeInvalidWithFallback.code, 'arg');
  assert.equal(out.safeInvalidWithFallback.html, out.safeValid.innerHtml);

  assert.equal(out.safeInvalidNoFallback.valid, false);
  assert.equal(out.safeInvalidNoFallback.usedFallback, false);
  assert.equal(out.safeInvalidNoFallback.html, '');
});

test('ws-brain compacts, sanitizes, and extracts plain text from ws-math-slot spans cleanly', () => {
  const ctx = loadBrainAndAudioContext();
  const out = JSON.parse(vm.runInContext(`(() => {
    const inlineRich = '<div>Valor <span class="ws-math-slot ws-math-editing" contenteditable="false" data-tex="\\\\frac{a}{b}" data-display="0"><span class="ws-math-inline"><span class="ws-m-frac"><span class="ws-m-num">a</span><span class="ws-m-den">b</span></span></span></span> ok</div>';
    const blockRich = '<div><span class="ws-math-slot" contenteditable="false" data-tex="x^2 + y^2 = z^2" data-display="1"><div class="ws-math-display">x² + y² = z²</div></span></div><script>alert(1)</script>';
    const sanitizedInline = wsSanitizeNoteHtml(inlineRich);
    const sanitizedBlock = wsSanitizeNoteHtml(blockRich);
    const plainInline = wsNoteHtmlToPlainText(inlineRich);
    const plainBlock = wsNoteHtmlToPlainText(blockRich);
    return JSON.stringify({ sanitizedInline, sanitizedBlock, plainInline, plainBlock });
  })()`, ctx));

  assert.ok(!out.sanitizedInline.includes('ws-math-editing'));
  assert.ok(!out.sanitizedInline.includes('ws-m-frac'));
  assert.ok(out.sanitizedInline.includes('<span class="ws-math-slot" contenteditable="false" data-tex="\\frac{a}{b}" data-display="0">$\\frac{a}{b}$</span>'));

  assert.ok(!out.sanitizedBlock.includes('<script>'));
  assert.ok(out.sanitizedBlock.includes('<span class="ws-math-slot" contenteditable="false" data-tex="x^2 + y^2 = z^2" data-display="1">$$x^2 + y^2 = z^2$$</span>'));

  assert.equal(out.plainInline, 'Valor $\\frac{a}{b}$ ok');
  assert.equal(out.plainBlock, '$$x^2 + y^2 = z^2$$');
});

test('i18n includes PT and EN translations for live math widget and reorganized link settings', () => {
  const ctx = loadBrainAndAudioContext();
  const out = JSON.parse(vm.runInContext(`(() => {
    Store.load();
    I18n.setLang('pt');
    const pt = {
      mathBoxLabel: wsTr('ws.mathBoxLabel'),
      mathErrPrefix: wsTr('ws.mathErrPrefix'),
      mathErrBraces: wsTr('ws.mathErr.braces'),
      linkDefsSemanticTypes: wsTr('ws.linkDefsSemanticTypes'),
      seqCapsNote: wsTr('ws.arrow.seqCapsNote')
    };
    I18n.setLang('en');
    const en = {
      mathBoxLabel: wsTr('ws.mathBoxLabel'),
      mathErrPrefix: wsTr('ws.mathErrPrefix'),
      mathErrBraces: wsTr('ws.mathErr.braces'),
      linkDefsSemanticTypes: wsTr('ws.linkDefsSemanticTypes'),
      seqCapsNote: wsTr('ws.arrow.seqCapsNote')
    };
    return JSON.stringify({ pt, en });
  })()`, ctx));

  assert.equal(out.pt.mathBoxLabel, 'Fórmula');
  assert.ok(out.pt.mathErrPrefix.includes('Mantendo'));
  assert.ok(out.pt.mathErrBraces.includes('{ }'));
  assert.ok(out.pt.linkDefsSemanticTypes.includes('Pontas'));
  assert.ok(out.pt.seqCapsNote.includes('Sequência'));

  assert.equal(out.en.mathBoxLabel, 'Formula');
  assert.ok(out.en.mathErrPrefix.includes('Showing'));
  assert.ok(out.en.mathErrBraces.includes('{ }'));
  assert.ok(out.en.linkDefsSemanticTypes.includes('Configurable'));
  assert.ok(out.en.seqCapsNote.includes('Sequence'));
});

test('ws-brain supports stroke hit-testing, selection box hit check, and drift-free batch stroke offsets', () => {
  const ctx = loadBrainAndAudioContext();
  const out = JSON.parse(vm.runInContext(`(() => {
    const strokes = [
      { id: 's1', tool: 'pen', size: 4, points: [{ x: 100, y: 100 }, { x: 180, y: 100 }] },
      { id: 's2', tool: 'marker', size: 12, points: [{ x: 140, y: 80 }, { x: 140, y: 160 }] },
      { id: 's3', tool: 'pen', size: 3, points: [{ x: 400, y: 400 }, { x: 450, y: 430 }] }
    ];
    const hitMid = wsFindStrokeAtPoint(strokes, { x: 105, y: 102 }, 6);
    const hitOverlap = wsFindStrokeAtPoint(strokes, { x: 140, y: 100 }, 6);
    const hitMiss = wsFindStrokeAtPoint(strokes, { x: 260, y: 260 }, 6);

    const sel = new Set(['s1', 's2']);
    const inSel = wsIsPointInStrokeSelection(strokes, sel, { x: 160, y: 140 }, 6);
    const outSel = wsIsPointInStrokeSelection(strokes, sel, { x: 420, y: 410 }, 6);

    const items = [strokes[0], strokes[1]].map(st => ({
      stroke: st,
      origPoints: st.points.map(pt => ({ x: pt.x, y: pt.y }))
    }));
    wsApplyStrokeOffsets(items, 12.345, -7.2);
    wsApplyStrokeOffsets(items, 50, 25);

    return JSON.stringify({
      hitMidId: hitMid ? hitMid.id : null,
      hitOverlapId: hitOverlap ? hitOverlap.id : null,
      hitMiss: !!hitMiss,
      inSel,
      outSel,
      s1Pts: strokes[0].points,
      s2Pts: strokes[1].points,
      s3Pts: strokes[2].points
    });
  })()`, ctx));

  assert.equal(out.hitMidId, 's1');
  assert.equal(out.hitOverlapId, 's2');
  assert.equal(out.hitMiss, false);
  assert.equal(out.inSel, true);
  assert.equal(out.outSel, false);
  assert.deepEqual(out.s1Pts, [{ x: 150, y: 125 }, { x: 230, y: 125 }]);
  assert.deepEqual(out.s2Pts, [{ x: 190, y: 105 }, { x: 190, y: 185 }]);
  assert.deepEqual(out.s3Pts, [{ x: 400, y: 400 }, { x: 450, y: 430 }]);
});

test('Motion.stepAmbientRipples spawns waves slightly more frequently without overflowing cap', () => {
  const ctx = vm.createContext({
    console,
    Math,
    performance: { now: () => 1000 },
    window: { innerWidth: 1280, innerHeight: 720, addEventListener: () => {} },
    document: { addEventListener: () => {}, hidden: false },
    $: () => ({ getContext: () => ({}), style: {} }),
    clamp: (v: number, a: number, b: number) => Math.max(a, Math.min(b, v)),
    lerp: (a: number, b: number, t: number) => a + (b - a) * t
  });
  const motionSrc = fs.readFileSync(path.resolve(process.cwd(), 'public/js/motion.js'), 'utf8');
  vm.runInContext(motionSrc, ctx);

  const count = vm.runInContext(`(() => {
    Motion.level = 'full';
    Motion.pAmount = 0.55;
    Motion.intensity = 0.55;
    Motion.ambientClock = 0;
    Motion.ripples = [];
    for (let i = 0; i < 80; i++) {
      Motion.stepAmbientRipples(1280, 720);
    }
    return Motion.ripples.length;
  })()`, ctx);

  assert.ok(count >= 1 && count <= 12, 'expected spawned ripples within expected bounds, got ' + count);
});




