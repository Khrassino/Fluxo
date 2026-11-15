import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function loadFullWorkspaceContext() {
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

  let rafQueue: Array<() => void> = [];
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
    requestAnimationFrame: (cb: () => void) => {
      rafQueue.push(cb);
      return rafQueue.length;
    },
    cancelAnimationFrame: noop,
    flushRafSteps(steps: number) {
      for (let i = 0; i < steps && rafQueue.length; i++) {
        const next = rafQueue.splice(0, rafQueue.length);
        for (const fn of next) fn();
      }
    },
    localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
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

  for (const rel of ['public/js/util.js', 'public/js/ink.js', 'public/js/workspace.js', 'public/js/router.js']) {
    const code = fs.readFileSync(path.resolve(process.cwd(), rel), 'utf8');
    vm.runInContext(code, sandbox, { filename: rel });
  }

  return sandbox;
}

test('calcElasticTarget elongates outer orb and counter-stretches + lags lighter inner sphere', () => {
  const ctx = loadFullWorkspaceContext();
  const rest = JSON.parse(vm.runInContext('JSON.stringify(calcElasticTarget(0, 0, 16))', ctx));
  assert.equal(rest.sx, 1);
  assert.equal(rest.sy, 1);
  assert.equal(rest.innerSx, 1);
  assert.equal(rest.innerSy, 1);
  assert.equal(rest.lagX, 0);

  const fast = JSON.parse(vm.runInContext('JSON.stringify(calcElasticTarget(28, 0, 16))', ctx));
  assert.ok(fast.sx > 1.3, `expected outer sx > 1.3, got ${fast.sx}`);
  assert.ok(fast.sy < 0.8, `expected outer sy < 0.8, got ${fast.sy}`);
  assert.ok(fast.innerSx < 0.92, `expected inner counter-squash innerSx < 0.92, got ${fast.innerSx}`);
  assert.ok(fast.innerSy > 1.15, `expected inner plump innerSy > 1.15, got ${fast.innerSy}`);
  assert.ok(fast.lagX < -5, `expected trailing lagX < -5, got ${fast.lagX}`);
});

test('createElasticSpring oscillates and settles both outer shell and inner sphere cleanly', () => {
  const ctx = loadFullWorkspaceContext();
  const states = JSON.parse(vm.runInContext(`(() => {
    const history = [];
    let settled = false;
    const spring = createElasticSpring((s) => history.push(s));
    spring.impulse(24, 6, 16);
    flushRafSteps(6);
    const mid = history[history.length - 1];
    spring.release(() => { settled = true; });
    flushRafSteps(90);
    const end = history[history.length - 1];
    return JSON.stringify({ mid, end, settled });
  })()`, ctx));

  assert.ok(states.mid.sx > 1.1, 'spring outer sx should stretch during drag impulse');
  assert.ok(states.mid.ix < -1, 'spring inner sphere should lag negatively behind outer drag');
  assert.ok(states.mid.isy > 1.05, 'spring inner sphere should counter-expand perpendicularly');
  assert.equal(states.settled, true);
  assert.equal(states.end.sx, 1);
  assert.equal(states.end.sy, 1);
  assert.equal(states.end.ix, 0);
});

test('inkEffectivePressure supports graphics tablet stylus pressure and mouse velocity modulation', () => {
  const ctx = loadFullWorkspaceContext();
  const lightPen = vm.runInContext('inkEffectivePressure(0.12, "pen", 0)', ctx) as number;
  const heavyPen = vm.runInContext('inkEffectivePressure(0.96, "pen", 0)', ctx) as number;
  assert.ok(heavyPen > lightPen + 0.5, `stylus pressure should scale stroke weight (${lightPen} -> ${heavyPen})`);

  const slowMouse = vm.runInContext('inkEffectivePressure(0.5, "mouse", 0.2)', ctx) as number;
  const fastMouse = vm.runInContext('inkEffectivePressure(0.5, "mouse", 2.8)', ctx) as number;
  assert.ok(slowMouse > fastMouse, `faster mouse motion should taper weight (${slowMouse} > ${fastMouse})`);
});

test('normalizeInkStrokes filters invalid entries and preserves strokes inside Workspace.normalize', () => {
  const ctx = loadFullWorkspaceContext();
  const res = JSON.parse(vm.runInContext(`JSON.stringify(Workspace.normalize({
    strokes: [
      { id: 's1', tool: 'pen', color: '#5fe3c4', size: 4.5, points: [{ x: 10.123, y: 20.456, p: 0.9 }, { x: 40, y: 50, p: 0.4 }] },
      { id: 'bad', tool: 'pen', points: [] }
    ]
  }))`, ctx));

  assert.equal(res.strokes.length, 1);
  assert.equal(res.strokes[0].id, 's1');
  assert.equal(res.strokes[0].color, '#5fe3c4');
  assert.equal(res.strokes[0].points.length, 2);
});

test('eraseInkAtSegment splits intersected stroke into sub-strokes cleanly without harming others', () => {
  const ctx = loadFullWorkspaceContext();
  const out = JSON.parse(vm.runInContext(`(() => {
    const strokes = [
      {
        id: 'line1',
        tool: 'pen',
        color: '#edf1ff',
        size: 4,
        points: [
          { x: 0, y: 0, p: 0.8 },
          { x: 20, y: 0, p: 0.8 },
          { x: 40, y: 0, p: 0.8 },
          { x: 60, y: 0, p: 0.8 },
          { x: 80, y: 0, p: 0.8 }
        ]
      },
      {
        id: 'line2',
        tool: 'marker',
        color: '#ffd166',
        size: 6,
        points: [
          { x: 0, y: 120, p: 0.8 },
          { x: 50, y: 120, p: 0.8 }
        ]
      }
    ];
    return JSON.stringify(eraseInkAtSegment(strokes, 40, -10, 40, 10, 8));
  })()`, ctx));

  assert.equal(out.changed, true);
  assert.equal(out.nextStrokes.length, 3);
  assert.deepEqual(out.nextStrokes[0].points.map((p: any) => p.x), [0, 20]);
  assert.deepEqual(out.nextStrokes[1].points.map((p: any) => p.x), [60, 80]);
  assert.equal(out.nextStrokes[2].id, 'line2');
});

test('wsInkCursorCss produces 24px dot and crosshair cursors per tool and custom shape override', () => {
  const ctx = loadFullWorkspaceContext();
  const penAuto = vm.runInContext('wsInkCursorCss("pen", "#8fa2ff", 4.5)', ctx) as string;
  const eraserAuto = vm.runInContext('wsInkCursorCss("eraser", "#8fa2ff", 4.5)', ctx) as string;
  const penCross = vm.runInContext('wsInkCursorCss("pen", "#8fa2ff", 4.5, "cross")', ctx) as string;

  assert.ok(penAuto.endsWith('12 12, crosshair'));
  assert.ok(decodeURIComponent(penAuto).includes('fill="#8fa2ff"'));
  assert.ok(decodeURIComponent(penAuto).includes('width="24" height="24"'));
  assert.ok(decodeURIComponent(eraserAuto).includes('stroke-dasharray="2.4 2"'));
  assert.ok(decodeURIComponent(penCross).includes('<path d="M12 '));
  assert.notEqual(penAuto, penCross);
});

test('inkEffectivePressure respects pressureVar from 0% uniform to 100% expressive', () => {
  const ctx = loadFullWorkspaceContext();
  const zeroLow = vm.runInContext('inkEffectivePressure(0.1, "pen", 0, 0)', ctx);
  const zeroHigh = vm.runInContext('inkEffectivePressure(0.95, "pen", 0, 0)', ctx);
  assert.equal(zeroLow, 1);
  assert.equal(zeroHigh, 1);

  const fullLow = vm.runInContext('inkEffectivePressure(0.1, "pen", 0, 100)', ctx) as number;
  const fullHigh = vm.runInContext('inkEffectivePressure(0.95, "pen", 0, 100)', ctx) as number;
  assert.ok(fullHigh - fullLow > 1.0, `100% pressureVar should yield wide dynamic range (${fullLow}..${fullHigh})`);
});

test('inkSmoothPoints preserves endpoints and reduces jitter monotonically with smoothing', () => {
  const ctx = loadFullWorkspaceContext();
  const res = JSON.parse(vm.runInContext(`(() => {
    const raw = [
      { x: 0, y: 0, p: 0.8 },
      { x: 10, y: 12, p: 0.8 },
      { x: 20, y: -12, p: 0.8 },
      { x: 30, y: 12, p: 0.8 },
      { x: 40, y: 0, p: 0.8 }
    ];
    const crisp = inkSmoothPoints(raw, 0);
    const smooth = inkSmoothPoints(raw, 90);
    return JSON.stringify({ raw, crisp, smooth });
  })()`, ctx));

  assert.deepEqual(res.crisp, res.raw);
  assert.equal(res.smooth[0].x, 0);
  assert.equal(res.smooth[res.smooth.length - 1].x, 40);
  assert.ok(Math.abs(res.smooth[1].y) < Math.abs(res.raw[1].y), 'smoothing should attenuate vertical spikes');
  assert.ok(Math.abs(res.smooth[2].y) < Math.abs(res.raw[2].y), 'smoothing should attenuate trough spikes');
});

test('normalizeInkConfig, nib cursors, and Workspace.normalize preserve nibs and ink bar disposition', () => {
  const ctx = loadFullWorkspaceContext();
  const board = JSON.parse(vm.runInContext(`JSON.stringify(Workspace.normalize({
    ink: {
      tool: 'pen',
      color: '#5fe3c4',
      size: 8.5,
      nib: 'fountain',
      smoothing: 80,
      pressureVar: 90,
      cursorShape: 'cross',
      orientation: 'vertical',
      position: 'left',
      freeX: 120,
      freeY: 220,
      collapsed: true
    },
    strokes: [
      { id: 'f1', tool: 'pen', nib: 'chisel', color: '#ffd166', size: 6, points: [{ x: 0, y: 0, p: 1 }, { x: 20, y: 10, p: 1 }] }
    ]
  }))`, ctx));

  assert.equal(board.ink.nib, 'fountain');
  assert.equal(board.ink.smoothing, 80);
  assert.equal(board.ink.pressureVar, 90);
  assert.equal(board.ink.cursorShape, 'cross');
  assert.equal(board.ink.orientation, 'vertical');
  assert.equal(board.ink.position, 'left');
  assert.equal(board.ink.collapsed, true);
  assert.equal(board.strokes[0].nib, 'chisel');

  const chiselSvg = vm.runInContext('wsInkCursorSvg("pen", "#ffd166", 4.5, "dot", "chisel")', ctx) as string;
  const fountainSvg = vm.runInContext('wsInkCursorSvg("pen", "#ffd166", 4.5, "dot", "fountain")', ctx) as string;
  assert.notEqual(chiselSvg, fountainSvg);
  assert.ok(fountainSvg.includes('<polygon'));
});

test('calcInkBarPlacement places top, bottom, left, right, and clamped free positions cleanly', () => {
  const ctx = loadFullWorkspaceContext();
  const placements = JSON.parse(vm.runInContext(`(() => {
    const base = {
      shellW: 1440, shellH: 900, barW: 360, barH: 44,
      brandBottom: 62, actionsBottom: 58, dockTop: 828, dockAnchor: 'bc'
    };
    return JSON.stringify({
      top: calcInkBarPlacement({ ...base, position: 'top' }),
      bottom: calcInkBarPlacement({ ...base, position: 'bottom' }),
      left: calcInkBarPlacement({ ...base, position: 'left', barW: 54, barH: 380 }),
      right: calcInkBarPlacement({ ...base, position: 'right', barW: 54, barH: 380 }),
      freeClamped: calcInkBarPlacement({ ...base, position: 'free', freeX: 9999, freeY: -50 })
    });
  })()`, ctx));

  assert.ok(placements.top.top >= 72);
  assert.ok(placements.bottom.top + 44 < 828);
  assert.equal(placements.left.left, 14);
  assert.equal(placements.right.left, 1440 - 54 - 14);
  assert.equal(placements.freeClamped.left, 1440 - 360 - 14);
  assert.equal(placements.freeClamped.top, 14);
});
