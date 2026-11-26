import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function loadTimerContext() {
  const noop = () => {};
  const sandbox: any = {
    console,
    Math,
    Date,
    Number,
    String,
    Array,
    Object,
    JSON,
    Infinity,
    setTimeout,
    clearTimeout,
    setInterval: () => 1,
    clearInterval: noop,
    clamp: (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v)),
    tr: (_k: string, fb: string) => fb,
    svgIcon: (name: string) => `<svg data-ico="${name}"></svg>`,
    el: (tag: string, cls?: string, html?: string) => ({
      tagName: tag.toUpperCase(),
      className: cls || '',
      dataset: {} as Record<string, string>,
      innerHTML: html || '',
      append: noop,
      addEventListener: noop,
    }),
    $: () => null,
    $$: () => [],
    Router: { route: 'timer', routeLabel: () => 'Tempo' },
    Store: {
      state: {
        timer: {
          tab: 'countdown',
          preset: 'focus',
          running: false,
          durations: { focus: 25, short: 5, long: 15, custom: 45 },
          view: 'focus',
          dim: 60,
        },
        tracker: { focusByDay: {} },
      },
      save: noop,
    },
    Sound: { chime: noop },
    toast: noop,
    todayKey: () => '2026-11-26',
    fmtClock: (s: number) => String(s),
    document: {
      documentElement: { style: { setProperty: noop } },
      body: { classList: { add: noop, remove: noop, toggle: noop }, dataset: {} },
      addEventListener: noop,
      removeEventListener: noop,
    },
    window: { addEventListener: noop, removeEventListener: noop },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  const src = fs.readFileSync(path.join(process.cwd(), 'public/js/pages/timer.js'), 'utf8');
  vm.runInContext(`${src}\nthis.__exports = { resolveHaloGesture, getHaloActionDetail, TIMER_PRESETS };`, sandbox);
  return sandbox.__exports;
}

test('resolveHaloGesture handles deadzone, four cardinals, and bounded tether coordinates', () => {
  const { resolveHaloGesture } = loadTimerContext();

  const center = resolveHaloGesture(0, 0);
  assert.equal(center.action, null);
  assert.equal(center.dir, null);
  assert.equal(center.snapDeg, null);
  assert.equal(center.tipX, 100);
  assert.equal(center.tipY, 100);

  const insideDeadzone = resolveHaloGesture(14, -14);
  assert.equal(insideDeadzone.action, null);
  assert.ok(insideDeadzone.dist < 24);

  const up = resolveHaloGesture(2, -68);
  assert.equal(up.action, 'toggle');
  assert.equal(up.dir, 'up');
  assert.equal(up.snapDeg, -90);
  assert.ok(up.tipY < 100);

  const right = resolveHaloGesture(90, 5);
  assert.equal(right.action, 'reset');
  assert.equal(right.dir, 'right');
  assert.equal(right.snapDeg, 0);
  assert.ok(right.tipX > 100);

  const down = resolveHaloGesture(-4, 82);
  assert.equal(down.action, 'preset');
  assert.equal(down.dir, 'down');
  assert.equal(down.snapDeg, 90);
  assert.ok(down.tipY > 100);

  const left = resolveHaloGesture(-110, -8);
  assert.equal(left.action, 'mode');
  assert.equal(left.dir, 'left');
  assert.equal(left.snapDeg, 180);
  assert.ok(left.tipX < 100);

  // Extreme drags stay bounded within the orbital SVG tether radius (54 units around 100)
  const far = resolveHaloGesture(900, 0, 24, 140);
  assert.equal(far.reach, 1);
  assert.equal(far.tipX, 154);
  assert.equal(far.tipY, 100);
});

test('getHaloActionDetail resolves contextual labels for toggle, reset, preset cycle, and mode switch', () => {
  const { getHaloActionDetail, TIMER_PRESETS } = loadTimerContext();

  assert.equal(
    getHaloActionDetail('toggle', { running: false, preset: 'focus', tab: 'countdown' }, TIMER_PRESETS),
    'Iniciar'
  );
  assert.equal(
    getHaloActionDetail('toggle', { running: true, preset: 'focus', tab: 'countdown' }, TIMER_PRESETS),
    'Pausar'
  );
  assert.equal(
    getHaloActionDetail('reset', { running: false, preset: 'focus', tab: 'countdown' }, TIMER_PRESETS),
    'Reiniciar'
  );
  assert.equal(
    getHaloActionDetail('preset', { running: false, preset: 'focus', tab: 'countdown' }, TIMER_PRESETS),
    'Pausa'
  );
  assert.equal(
    getHaloActionDetail('preset', { running: false, preset: 'custom', tab: 'countdown' }, TIMER_PRESETS),
    'Foco'
  );
  assert.equal(
    getHaloActionDetail('mode', { running: false, preset: 'focus', tab: 'countdown' }, TIMER_PRESETS),
    'Cronômetro'
  );
  assert.equal(
    getHaloActionDetail('mode', { running: false, preset: 'focus', tab: 'stopwatch' }, TIMER_PRESETS),
    'Temporizador'
  );
});

test('minimalist timer halo has light background darkening, gentle timer blur, radial fade, and reduced-motion rules', () => {
  const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(process.cwd(), 'public/css/timer.css'), 'utf8');

  assert.match(html, /id="halo-backdrop"/);
  assert.match(css, /#halo-backdrop\s*\{[\s\S]*radial-gradient\([\s\S]*\.44/);
  assert.match(css, /body\.halo-open\s+#halo-backdrop\s*\{[\s\S]*opacity:\s*1;/);
  assert.match(css, /body\.halo-open\s+#app\s*\{\s*z-index:\s*26;/);
  assert.match(css, /body\.halo-open\s+\.timer-stage\s+\.ring\s*\{[\s\S]*filter:\s*blur\(3\.5px\)/);
  assert.match(css, /body\.halo-open\s+\.timer-stage\s+\.timer-display\s*\{[\s\S]*opacity:\s*\.36;[\s\S]*filter:\s*blur\(5px\)/);
  assert.match(css, /\.timer-halo::before\s*\{[\s\S]*radial-gradient/);
  assert.match(css, /@keyframes\s+haloRipple/);
  assert.match(css, /@keyframes\s+haloCommitRing/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});
