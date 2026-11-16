import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function loadMusicThemeContext(initialState?: Record<string, any>) {
  const cssVars = new Map<string, string>();
  const wpStyle: Record<string, string> = {};
  const rootDataset: Record<string, string> = {};
  const noop = () => {};

  const metaEl = {
    attrs: {} as Record<string, string>,
    setAttribute(k: string, v: string) { this.attrs[k] = String(v); },
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
    Uint8ClampedArray,
    encodeURIComponent,
    setTimeout,
    clearTimeout,
    setInterval: () => 1,
    clearInterval: noop,
    requestAnimationFrame: noop,
    cancelAnimationFrame: noop,
    getComputedStyle: () => ({
      getPropertyValue: (k: string) => cssVars.get(k) || '',
    }),
    localStorage: {
      getItem: () => (initialState ? JSON.stringify(initialState) : null),
      setItem: noop,
      removeItem: noop,
    },
    document: {
      documentElement: {
        dataset: rootDataset,
        style: {
          colorScheme: '',
          setProperty: (k: string, v: string) => cssVars.set(k, String(v)),
          removeProperty: (k: string) => cssVars.delete(k),
        },
      },
      body: {
        classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
        dataset: {},
      },
      head: { appendChild: noop },
      createElement: () => ({
        tagName: 'DIV',
        style: { setProperty: noop, removeProperty: noop },
        dataset: {},
        classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
        setAttribute: noop,
        addEventListener: noop,
        append: noop,
      }),
      querySelector: (sel: string) => {
        if (sel === '#wallpaper') return { style: wpStyle };
        if (sel === 'meta[name="theme-color"]') return metaEl;
        return null;
      },
      querySelectorAll: () => [],
      addEventListener: noop,
    },
    window: { addEventListener: noop, devicePixelRatio: 1 },
    location: { hash: '#/inicio', reload: noop },
    indexedDB: { open: () => null, deleteDatabase: noop },
    Motion: { syncColors: noop, readState: noop },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  const files = [
    'public/js/util.js',
    'public/js/storage.js',
    'public/js/themes.js',
    'public/js/audio.js',
    'public/js/motion.js',
  ];
  for (const rel of files) {
    const code = fs.readFileSync(path.resolve(process.cwd(), rel), 'utf8');
    vm.runInContext(code, sandbox, { filename: rel });
  }
  vm.runInContext('Store.load()', sandbox);

  return { sandbox, cssVars, wpStyle, rootDataset, metaEl };
}

test('Thematic tracks Flowers and March point to existing assets and generate valid SVG cover data URLs', () => {
  const { sandbox } = loadMusicThemeContext();
  const data = JSON.parse(vm.runInContext(`JSON.stringify({
    tracks: CUSTOM_THEMATIC_TRACKS.map(t => ({
      id: t.id,
      title: t.title,
      src: t.src,
      particleStyle: t.particleStyle,
      sceneId: t.sceneId,
      cover: buildTrackCoverSvgDataUrl(t.id)
    })),
    labels: TRACK_LABELS
  })`, sandbox));

  assert.equal(data.tracks.length, 2);
  assert.equal(data.tracks[0].id, 'flowers');
  assert.equal(data.tracks[0].particleStyle, 'petals');
  assert.equal(data.tracks[1].id, 'march');
  assert.equal(data.tracks[1].particleStyle, 'embers');
  assert.equal(data.labels.flowers, 'Flowers');
  assert.equal(data.labels.march, 'March');

  for (const tr of data.tracks) {
    assert.ok(tr.cover.startsWith('data:image/svg+xml;charset=utf-8,'));
    const assetPath = path.resolve(process.cwd(), 'public', tr.src);
    assert.equal(fs.existsSync(assetPath), true, `Expected audio file to exist: ${assetPath}`);
  }
});

test('extractCoverPaletteFromPixels derives readable contrast palettes from dark and light covers', () => {
  const { sandbox } = loadMusicThemeContext();

  const out = JSON.parse(vm.runInContext(`(() => {
    // 1. Dark ember cover pixels (charcoal + warm amber + crimson)
    const darkPixels = new Uint8ClampedArray(60 * 4);
    for (let i = 0; i < 60; i++) {
      const o = i * 4;
      if (i < 42) { darkPixels[o] = 24; darkPixels[o+1] = 18; darkPixels[o+2] = 16; darkPixels[o+3] = 255; }
      else if (i < 54) { darkPixels[o] = 240; darkPixels[o+1] = 148; darkPixels[o+2] = 24; darkPixels[o+3] = 255; }
      else { darkPixels[o] = 220; darkPixels[o+1] = 48; darkPixels[o+2] = 42; darkPixels[o+3] = 255; }
    }
    const darkPal = extractCoverPaletteFromPixels(darkPixels, CUSTOM_THEMATIC_TRACKS[1].defaultPalette);

    // 2. Light floral pastel cover pixels (ivory + blush pink + sage leaf)
    const lightPixels = new Uint8ClampedArray(60 * 4);
    for (let i = 0; i < 60; i++) {
      const o = i * 4;
      if (i < 42) { lightPixels[o] = 246; lightPixels[o+1] = 236; lightPixels[o+2] = 240; lightPixels[o+3] = 255; }
      else if (i < 54) { lightPixels[o] = 225; lightPixels[o+1] = 120; lightPixels[o+2] = 150; lightPixels[o+3] = 255; }
      else { lightPixels[o] = 92; lightPixels[o+1] = 158; lightPixels[o+2] = 114; lightPixels[o+3] = 255; }
    }
    const lightPal = extractCoverPaletteFromPixels(lightPixels, CUSTOM_THEMATIC_TRACKS[0].defaultPalette);

    return JSON.stringify({
      darkPal,
      darkTextRatio: themeContrastRatio(darkPal.bg, darkPal.text),
      darkAccentRatio: themeContrastRatio(darkPal.bg, darkPal.accent),
      lightPal,
      lightTextRatio: themeContrastRatio(lightPal.bg, lightPal.text),
      lightAccentRatio: themeContrastRatio(lightPal.bg, lightPal.accent),
    });
  })()`, sandbox));

  assert.equal(out.darkPal.isLight, false);
  assert.ok(out.darkTextRatio >= 7, `Dark cover text contrast too low: ${out.darkTextRatio}`);
  assert.ok(out.darkAccentRatio >= 3.5, `Dark cover accent contrast too low: ${out.darkAccentRatio}`);

  assert.equal(out.lightPal.isLight, true);
  assert.ok(out.lightTextRatio >= 7, `Light cover text contrast too low: ${out.lightTextRatio}`);
  assert.ok(out.lightAccentRatio >= 3.5, `Light cover accent contrast too low: ${out.lightAccentRatio}`);
});

test('Themes.apply switches whole-app palette while playing Flowers/March and restores user theme on stop', () => {
  const { sandbox, cssVars, rootDataset, wpStyle } = loadMusicThemeContext({
    appearance: { theme: 'aurora', wallpaper: 'aurora', uiFont: 'inter' },
    music: { track: 'flowers', dynamicTheme: true },
  });

  // Stopped initially -> user's theme active
  vm.runInContext('Sound.playing = false; Themes.apply();', sandbox);
  assert.equal(rootDataset.musicTheme, undefined);
  assert.equal(rootDataset.theme, 'aurora');
  assert.equal(cssVars.get('--bg'), undefined);

  // Playing Flowers -> Flowers cover palette active
  vm.runInContext('Sound.playing = true; Themes.apply();', sandbox);
  assert.equal(rootDataset.musicTheme, 'flowers');
  assert.equal(cssVars.get('--bg'), '#150c12');
  assert.equal(cssVars.get('--accent'), '#f4a5b8');
  assert.ok(wpStyle.background.includes('244,165,184'));

  // Switch to March while playing -> March ember palette active
  vm.runInContext('Store.state.music.track = "march"; Themes.apply();', sandbox);
  assert.equal(rootDataset.musicTheme, 'march');
  assert.equal(cssVars.get('--bg'), '#0c0a09');
  assert.equal(cssVars.get('--accent'), '#f59e0b');
  assert.ok(wpStyle.background.includes('239,68,68'));

  // Disable dynamicTheme -> restores user theme immediately even while music plays
  vm.runInContext('Store.state.music.dynamicTheme = false; Themes.apply();', sandbox);
  assert.equal(rootDataset.musicTheme, undefined);
  assert.equal(cssVars.get('--bg'), undefined);

  // Re-enable dynamicTheme then stop music -> restores user theme cleanly
  vm.runInContext('Store.state.music.dynamicTheme = true; Themes.apply();', sandbox);
  assert.equal(rootDataset.musicTheme, 'march');
  vm.runInContext('Sound.playing = false; Themes.apply();', sandbox);
  assert.equal(rootDataset.musicTheme, undefined);
  assert.equal(cssVars.get('--bg'), undefined);
});

test('resolveMusicVisualState respects scene toggles without overwriting user saved particle style', () => {
  const { sandbox } = loadMusicThemeContext({
    particles: { enabled: true, style: 'dust', amount: 45, interactive: false },
    music: {
      track: 'flowers',
      visualEffects: true,
      sceneElements: true,
      sceneParticles: true,
      sceneInteractive: true,
      sceneIntensity: 80,
    },
  });

  const out = JSON.parse(vm.runInContext(`(() => {
    const flowersMeta = getThematicTrack('flowers');
    const marchMeta = getThematicTrack('march');

    const flowersPlaying = resolveMusicVisualState(Store.state, true, flowersMeta);
    const marchPlaying = resolveMusicVisualState(Store.state, true, marchMeta);

    Store.state.music.sceneElements = false;
    const onlyPetals = resolveMusicVisualState(Store.state, true, flowersMeta);

    Store.state.music.sceneElements = true;
    Store.state.music.visualEffects = false;
    const visualOff = resolveMusicVisualState(Store.state, true, flowersMeta);

    Store.state.music.visualEffects = true;
    Store.state.effects.level = 'off';
    const globalOff = resolveMusicVisualState(Store.state, true, marchMeta);

    return JSON.stringify({
      savedStyle: Store.state.particles.style,
      flowersPlaying,
      marchPlaying,
      onlyPetals,
      visualOff,
      globalOff
    });
  })()`, sandbox));

  assert.equal(out.savedStyle, 'dust');
  assert.equal(out.flowersPlaying.sceneId, 'flowers');
  assert.equal(out.flowersPlaying.activeParticleStyle, 'petals');
  assert.equal(out.flowersPlaying.activeParticleInteractive, true);

  assert.equal(out.marchPlaying.sceneId, 'march');
  assert.equal(out.marchPlaying.activeParticleStyle, 'embers');

  assert.equal(out.onlyPetals.sceneId, null);
  assert.equal(out.onlyPetals.activeParticleStyle, 'petals');

  assert.equal(out.visualOff.musicActive, false);
  assert.equal(out.visualOff.sceneId, null);
  assert.equal(out.visualOff.activeParticleStyle, 'dust');
  assert.equal(out.visualOff.activeParticleInteractive, false);

  assert.equal(out.globalOff.musicActive, false);
  assert.equal(out.globalOff.sceneId, null);
  assert.equal(out.globalOff.activeParticleStyle, null);
});

test('THEMES and WALLPAPERS expose standalone Flowers and March models and interpolateThemePalette blends smoothly', () => {
  const { sandbox } = loadMusicThemeContext();
  const out = JSON.parse(vm.runInContext(`(() => {
    const flowersTheme = THEMES.find(t => t.id === 'flowers');
    const marchTheme = THEMES.find(t => t.id === 'march');
    const flowersWp = WALLPAPERS.find(w => w.id === 'flowers');
    const marchWp = WALLPAPERS.find(w => w.id === 'march');

    const start = { bg: '#0a0e1e', accent: '#8fa2ff', accent2: '#5fe3c4', text: '#edf1ff', glass: 60 };
    const end = { bg: '#150c12', accent: '#f4a5b8', accent2: '#8ec49e', text: '#fdf3f6', glass: 62 };
    const mid = interpolateThemePalette(end, start, 0.5);
    const done = interpolateThemePalette(end, start, 1);

    return JSON.stringify({ flowersTheme, marchTheme, flowersWp, marchWp, mid, done });
  })()`, sandbox));

  assert.equal(out.flowersTheme.label, 'Flowers');
  assert.equal(out.flowersTheme.accent, '#f4a5b8');
  assert.equal(out.marchTheme.label, 'March');
  assert.equal(out.marchTheme.accent, '#f59e0b');
  assert.ok(out.flowersWp && out.flowersWp.bg.includes('244,165,184'));
  assert.ok(out.marchWp && out.marchWp.bg.includes('239,68,68'));
  assert.notEqual(out.mid.bg, '#150c12');
  assert.notEqual(out.mid.bg, '#0a0e1e');
  assert.equal(out.done.bg, '#0a0e1e');
  assert.equal(out.done.accent, '#8fa2ff');
});

test('Teclas particle style is registered, formatKeycapLabel normalizes keys, and legacy lofi track migrates to none', () => {
  const { sandbox } = loadMusicThemeContext({
    particles: { enabled: true, style: 'keys', amount: 55, interactive: true },
    music: { track: 'lofi' },
  });

  const out = JSON.parse(vm.runInContext(`(() => {
    const hasKeysStyle = PARTICLE_STYLES.some(s => s.id === 'keys' && s.label === 'Teclas');
    const labels = {
      space: formatKeycapLabel(' '),
      enter: formatKeycapLabel('Enter'),
      backspace: formatKeycapLabel('Backspace'),
      arrowUp: formatKeycapLabel('ArrowUp'),
      meta: formatKeycapLabel('Meta'),
      letter: formatKeycapLabel('f'),
      empty: formatKeycapLabel(null),
    };
    const visual = resolveMusicVisualState(Store.state, false, null);
    return JSON.stringify({
      hasKeysStyle,
      labels,
      storedStyle: Store.state.particles.style,
      migratedTrack: Store.state.music.track,
      visualStyle: visual.activeParticleStyle,
    });
  })()`, sandbox));

  assert.equal(out.hasKeysStyle, true);
  assert.equal(out.labels.space, 'SPACE');
  assert.equal(out.labels.enter, '↵');
  assert.equal(out.labels.backspace, '⌫');
  assert.equal(out.labels.arrowUp, '↑');
  assert.equal(out.labels.meta, '⌘');
  assert.equal(out.labels.letter, 'F');
  assert.equal(out.labels.empty, '·');
  assert.equal(out.storedStyle, 'keys');
  assert.equal(out.migratedTrack, 'none');
  assert.equal(out.visualStyle, 'keys');
});

test('Motion.buildMarchSceneHtml builds asymmetric organic coiled barbed-wire tangles with back and front layers', () => {
  const { sandbox } = loadMusicThemeContext();
  const out = JSON.parse(vm.runInContext(`(() => {
    const html = Motion.buildMarchSceneHtml();
    const leftMatch = html.match(/<svg class="ms-cluster-l"[\\s\\S]*?<\\/svg>/);
    const rightMatch = html.match(/<svg class="ms-cluster-r"[\\s\\S]*?<\\/svg>/);
    const leftSvg = leftMatch ? leftMatch[0] : '';
    const rightSvg = rightMatch ? rightMatch[0] : '';
    const wireSample = buildMarchWireGroup({
      loops: [{ cx: 100, cy: 100, rx: 40, ry: 25, rotDeg: 10, seed: 1, steps: 18, barbEvery: 6 }],
      strands: [{ pts: [[0, 140], [60, 130], [120, 140]], barbs: [1] }]
    });
    return JSON.stringify({
      hasBack: html.includes('ms-layer-back'),
      hasFront: html.includes('ms-layer-front'),
      hasLeft: !!leftSvg,
      hasRight: !!rightSvg,
      asymmetric: leftSvg !== rightSvg,
      hasCurvedPaths: leftSvg.includes(' Q') && rightSvg.includes(' Q'),
      hasNoLineBars: !leftSvg.includes('<line') && !rightSvg.includes('<line'),
      wirePathCount: (wireSample.match(/<path /g) || []).length,
    });
  })()`, sandbox));

  assert.equal(out.hasBack, true);
  assert.equal(out.hasFront, true);
  assert.equal(out.hasLeft, true);
  assert.equal(out.hasRight, true);
  assert.equal(out.asymmetric, true);
  assert.equal(out.hasCurvedPaths, true);
  assert.equal(out.hasNoLineBars, true);
  assert.ok(out.wirePathCount >= 3);
});


