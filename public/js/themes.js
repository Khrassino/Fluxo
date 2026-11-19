'use strict';
/* ============ themes.js — temas, papéis de parede e fontes ============ */

const THEMES = [
  { id: 'aurora',    label: 'Aurora',         icon: 'sparkle', bg: '#0a0e1e', accent: '#8fa2ff', accent2: '#5fe3c4', ink: '#edf1ff' },
  { id: 'meianoite', label: 'Noite',          icon: 'moon',    bg: '#070b14', accent: '#38bdf8', accent2: '#818cf8', ink: '#f1f5f9' },
  { id: 'floresta',  label: 'Floresta',       icon: 'leaf',    bg: '#09120e', accent: '#34d399', accent2: '#a7f3d0', ink: '#eaf5ec' },
  { id: 'carvao',    label: 'Obsidiana',      icon: 'grid',    bg: '#0d0e11', accent: '#f4f4f5', accent2: '#a1a1aa', ink: '#f4f4f5' },
  { id: 'retro',     label: 'Carmesim',       icon: 'disc',    bg: '#0c0709', accent: '#f43f5e', accent2: '#fb923c', ink: '#fff1f2' },
  { id: 'neon',      label: 'Neon',           icon: 'bolt',    bg: '#08070d', accent: '#d946ef', accent2: '#06b6d4', ink: '#faf5ff' },
  { id: 'amanhecer', label: 'Alvorada',       icon: 'sun',     bg: '#faf6f0', accent: '#ea580c', accent2: '#f59e0b', ink: '#292524' },
  { id: 'neve',      label: 'Neve',           icon: 'snow',    bg: '#f8fafc', accent: '#2563eb', accent2: '#38bdf8', ink: '#0f172a' },
  { id: 'flowers',   label: 'Flowers',        icon: 'flower',  bg: '#150c12', accent: '#f4a5b8', accent2: '#8ec49e', ink: '#fdf3f6' },
  { id: 'march',     label: 'March',          icon: 'flame',   bg: '#0c0a09', accent: '#f59e0b', accent2: '#ef4444', ink: '#f6efe8' },
  { id: 'custom',    label: 'Personalizado',  icon: 'palette', bg: '#0a0e1e', accent: '#8fa2ff', accent2: '#5fe3c4', ink: '#edf1ff' }
];

const WALLPAPERS = [
  { id: 'aurora',  label: 'Aurora',   bg: 'radial-gradient(85% 70% at 15% 18%, rgba(92,150,255,.34), transparent 62%), radial-gradient(70% 60% at 82% 10%, rgba(148,96,240,.26), transparent 62%), radial-gradient(90% 80% at 58% 92%, rgba(52,214,188,.18), transparent 60%), linear-gradient(180deg, #0a0e1e 0%, #05070f 100%)' },
  { id: 'poente',  label: 'Poente',  bg: 'radial-gradient(75% 55% at 72% 80%, rgba(255,148,96,.40), transparent 64%), linear-gradient(195deg, #191031 0%, #3f1a4c 42%, #7d2b55 72%, #c0564f 100%)' },
  { id: 'oceano',  label: 'Oceano',  bg: 'radial-gradient(80% 60% at 24% 14%, rgba(64,178,216,.28), transparent 62%), radial-gradient(75% 65% at 82% 82%, rgba(32,102,176,.34), transparent 64%), linear-gradient(180deg, #04182e 0%, #020d1a 100%)' },
  { id: 'cosmos',  label: 'Cosmos',  bg: 'radial-gradient(1.4px 1.4px at 12% 25%, rgba(255,255,255,.85), transparent 100%), radial-gradient(1.2px 1.2px at 28% 68%, rgba(255,255,255,.70), transparent 100%), radial-gradient(1.3px 1.3px at 45% 18%, rgba(255,255,255,.80), transparent 100%), radial-gradient(1.1px 1.1px at 58% 42%, rgba(255,255,255,.62), transparent 100%), radial-gradient(1.3px 1.3px at 72% 75%, rgba(255,255,255,.72), transparent 100%), radial-gradient(1.2px 1.2px at 88% 30%, rgba(255,255,255,.78), transparent 100%), radial-gradient(80% 70% at 50% 108%, rgba(130,72,215,.34), transparent 65%), linear-gradient(180deg, #0a0416 0%, #060214 100%)' },
  { id: 'floresta', label: 'Floresta', bg: 'radial-gradient(80% 60% at 18% 82%, rgba(62,178,120,.20), transparent 64%), radial-gradient(70% 55% at 82% 12%, rgba(178,214,122,.14), transparent 62%), linear-gradient(180deg, #0b1712 0%, #061009 100%)' },
  { id: 'madrugada', label: 'Madrugada', bg: 'radial-gradient(85% 60% at 76% 18%, rgba(255,186,168,.42), transparent 64%), radial-gradient(70% 60% at 18% 88%, rgba(170,194,255,.40), transparent 64%), linear-gradient(180deg, #fbe8da 0%, #edf2ff 100%)' },
  { id: 'mono',    label: 'Mono',     bg: 'radial-gradient(90% 70% at 50% 24%, rgba(255,255,255,.06), transparent 62%), linear-gradient(180deg, #17181c 0%, #0e0f13 100%)' },
  { id: 'nevoa',   label: 'Névoa',    bg: 'radial-gradient(70% 60% at 22% 30%, rgba(176,196,214,.20), transparent 66%), radial-gradient(75% 65% at 78% 72%, rgba(120,140,168,.16), transparent 66%), linear-gradient(165deg, #12161c 0%, #0a0d11 100%)' },
  { id: 'areia',   label: 'Areia',    bg: 'radial-gradient(80% 60% at 28% 20%, rgba(232,196,146,.26), transparent 64%), radial-gradient(70% 60% at 82% 84%, rgba(150,110,78,.22), transparent 66%), linear-gradient(180deg, #19120c 0%, #0c0906 100%)' },
  { id: 'grafite', label: 'Grafite',  bg: 'linear-gradient(140deg, rgba(255,255,255,.055) 0%, transparent 42%), radial-gradient(65% 55% at 72% 18%, rgba(198,208,228,.10), transparent 62%), linear-gradient(180deg, #14161b 0%, #0b0c10 100%)' },
  { id: 'flowers', label: 'Flowers',  bg: 'radial-gradient(80% 62% at 22% 84%, rgba(244,165,184,.24), transparent 64%), radial-gradient(70% 58% at 80% 18%, rgba(142,196,158,.16), transparent 62%), radial-gradient(90% 70% at 50% 45%, rgba(190,104,138,.14), transparent 66%), linear-gradient(180deg, #1b0f17 0%, #0d070b 100%)' },
  { id: 'march',   label: 'March',    bg: 'radial-gradient(85% 52% at 50% 100%, rgba(239,68,68,.24), transparent 64%), radial-gradient(70% 50% at 24% 82%, rgba(245,158,11,.18), transparent 62%), radial-gradient(75% 60% at 76% 18%, rgba(120,90,72,.14), transparent 62%), linear-gradient(180deg, #14100e 0%, #080605 100%)' },
  { id: 'nenhum',  label: 'Tema puro', bg: '' }
];

function getThemeLabel(id) {
  const item = THEMES.find(x => x.id === id);
  const fb = item ? item.label : id;
  return typeof t === 'function' ? t('theme.' + id, null, fb) : fb;
}

function getWallpaperLabel(id) {
  const item = WALLPAPERS.find(x => x.id === id);
  const fb = item ? item.label : id;
  return typeof t === 'function' ? t('wp.' + id, null, fb) : fb;
}

/* fontes disponíveis para o cronômetro */
const FONTS = [
  { id: 'inter',     label: 'Inter',        family: "'Inter', sans-serif" },
  { id: 'orbitron',  label: 'Orbitron',     family: "'Orbitron', monospace" },
  { id: 'bebas',     label: 'Bebas Neue',   family: "'Bebas Neue', sans-serif" },
  { id: 'playfair',  label: 'Playfair',     family: "'Playfair Display', serif" },
  { id: 'jetbrains', label: 'JetBrains',    family: "'JetBrains Mono', monospace" },
  { id: 'share',     label: 'Share Tech',   family: "'Share Tech Mono', monospace" },
  { id: 'major',     label: 'Major Mono',   family: "'Major Mono Display', monospace" },
  { id: 'anton',     label: 'Anton',        family: "'Anton', sans-serif" },
  { id: 'audiowide', label: 'Audiowide',    family: "'Audiowide', sans-serif" },
  { id: 'bungee',    label: 'Bungee',       family: "'Bungee', sans-serif" },
  { id: 'chakra',    label: 'Chakra Petch', family: "'Chakra Petch', sans-serif" },
  { id: 'dmsans',    label: 'DM Sans',      family: "'DM Sans', sans-serif" },
  { id: 'fraunces',  label: 'Fraunces',     family: "'Fraunces', serif" },
  { id: 'manrope',   label: 'Manrope',      family: "'Manrope', sans-serif" },
  { id: 'monoton',   label: 'Monoton',      family: "'Monoton', cursive" },
  { id: 'outfit',    label: 'Outfit',       family: "'Outfit', sans-serif" },
  { id: 'pressstart',label: 'Press Start',  family: "'Press Start 2P', monospace" },
  { id: 'rubik',     label: 'Rubik',        family: "'Rubik', sans-serif" },
  { id: 'sora',      label: 'Sora',         family: "'Sora', sans-serif" },
  { id: 'space',     label: 'Space Grotesk',family: "'Space Grotesk', sans-serif" },
  { id: 'vt323',     label: 'VT323',        family: "'VT323', monospace" }
];

/* catálogo de fontes disponíveis localmente via css/fonts.css */
const FONT_QUERY = {
  inter: 'Inter:wght@200..800',
  orbitron: 'Orbitron:wght@500;700',
  bebas: 'Bebas+Neue',
  playfair: 'Playfair+Display:wght@400;600',
  jetbrains: 'JetBrains+Mono:wght@300;400;600',
  share: 'Share+Tech+Mono',
  major: 'Major+Mono+Display',
  anton: 'Anton',
  audiowide: 'Audiowide',
  bungee: 'Bungee',
  chakra: 'Chakra+Petch:wght@300;500;700',
  dmsans: 'DM+Sans:wght@300..700',
  fraunces: 'Fraunces:wght@300;400;600',
  manrope: 'Manrope:wght@300..700',
  monoton: 'Monoton',
  outfit: 'Outfit:wght@200..700',
  pressstart: 'Press+Start+2P',
  rubik: 'Rubik:wght@300..700',
  sora: 'Sora:wght@300..700',
  space: 'Space+Grotesk:wght@300..700',
  vt323: 'VT323'
};

/* fontes que funcionam bem na interface */
const UI_FONTS = [
  { id: 'inter',   label: 'Inter',        family: "'Inter', system-ui, sans-serif" },
  { id: 'dmsans',  label: 'DM Sans',      family: "'DM Sans', system-ui, sans-serif" },
  { id: 'manrope', label: 'Manrope',      family: "'Manrope', system-ui, sans-serif" },
  { id: 'outfit',  label: 'Outfit',       family: "'Outfit', system-ui, sans-serif" },
  { id: 'sora',    label: 'Sora',         family: "'Sora', system-ui, sans-serif" },
  { id: 'space',   label: 'Space Grotesk',family: "'Space Grotesk', system-ui, sans-serif" },
  { id: 'rubik',   label: 'Rubik',        family: "'Rubik', system-ui, sans-serif" },
  { id: 'chakra',  label: 'Chakra Petch', family: "'Chakra Petch', system-ui, sans-serif" },
  { id: 'jetbrains', label: 'JetBrains',  family: "'JetBrains Mono', monospace" },
  { id: 'playfair',label: 'Playfair',     family: "'Playfair Display', serif" }
];

/* ---- utilitários de cor (tema personalizado) ---- */
function themeHexToRgb(hex) {
  if (!hex || hex.charAt(0) !== '#') return { r: 143, g: 162, b: 255 };
  let h = hex.slice(1);
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function themeRgba(hex, a) {
  const c = themeHexToRgb(hex);
  return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')';
}
function themeMix(a, b, t) {
  const x = themeHexToRgb(a), y = themeHexToRgb(b);
  const r = Math.round(x.r + (y.r - x.r) * t);
  const g = Math.round(x.g + (y.g - x.g) * t);
  const bl = Math.round(x.b + (y.b - x.b) * t);
  return 'rgb(' + r + ',' + g + ',' + bl + ')';
}
function themeLuma(hex) {
  const c = themeHexToRgb(hex);
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}
function themeRgbToHex(r, g, b) {
  const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return '#' + toHex(r) + toHex(g) + toHex(b);
}
function themeContrastRatio(hexA, hexB) {
  const la = themeLuma(hexA), lb = themeLuma(hexB);
  const hi = Math.max(la, lb), lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}
function themeRgbDist(a, b) {
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
}
function themeAdjustLightness(rgb, factor, towardsLight) {
  if (towardsLight) {
    return {
      r: rgb.r + (255 - rgb.r) * factor,
      g: rgb.g + (255 - rgb.g) * factor,
      b: rgb.b + (255 - rgb.b) * factor
    };
  }
  return {
    r: rgb.r * (1 - factor),
    g: rgb.g * (1 - factor),
    b: rgb.b * (1 - factor)
  };
}
function ensureReadableAccent(bgHex, candidateHex) {
  const bgDark = themeLuma(bgHex) <= 0.45;
  let rgb = themeHexToRgb(candidateHex);
  let hex = themeRgbToHex(rgb.r, rgb.g, rgb.b);
  for (let step = 0; step < 8 && themeContrastRatio(bgHex, hex) < 3.6; step++) {
    rgb = themeAdjustLightness(rgb, 0.24, bgDark);
    hex = themeRgbToHex(rgb.r, rgb.g, rgb.b);
  }
  return hex;
}
function ensureReadableText(bgHex, candidateHex) {
  const bgDark = themeLuma(bgHex) <= 0.45;
  const fallback = bgDark ? '#f6f3f5' : '#161418';
  if (candidateHex && themeContrastRatio(bgHex, candidateHex) >= 7) return candidateHex;
  return fallback;
}
function extractCoverPaletteFromPixels(rgba, fallback) {
  const fb = Object.assign({
    bg: '#150c12',
    accent: '#f4a5b8',
    accent2: '#8ec49e',
    text: '#fdf3f6',
    glass: 62,
    isLight: false
  }, fallback || {});
  if (!rgba || rgba.length < 4) return fb;

  let sumR = 0, sumG = 0, sumB = 0, cnt = 0;
  let lumSum = 0;
  const buckets = new Map();

  for (let i = 0; i + 3 < rgba.length; i += 4) {
    const a = rgba[i + 3];
    if (a < 40) continue;
    const r = rgba[i], g = rgba[i + 1], b = rgba[i + 2];
    sumR += r; sumG += g; sumB += b; cnt++;
    lumSum += (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

    const qr = r >> 4, qg = g >> 4, qb = b >> 4;
    const key = (qr << 8) | (qg << 4) | qb;
    const entry = buckets.get(key) || { r: 0, g: 0, b: 0, n: 0, satSum: 0 };
    const maxC = Math.max(r, g, b), minC = Math.min(r, g, b);
    const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;
    entry.r += r; entry.g += g; entry.b += b;
    entry.n++;
    entry.satSum += sat;
    buckets.set(key, entry);
  }

  if (!cnt) return fb;

  const avgLum = lumSum / cnt;
  const avgR = sumR / cnt, avgG = sumG / cnt, avgB = sumB / cnt;
  const isLight = avgLum > 0.66;

  // Base background tinted from image dominant mood while staying deeply legible
  const bgRgb = isLight
    ? { r: 235 + (avgR - 235) * 0.16, g: 233 + (avgG - 233) * 0.16, b: 236 + (avgB - 236) * 0.16 }
    : { r: 10 + avgR * 0.14, g: 9 + avgG * 0.14, b: 12 + avgB * 0.14 };
  const bg = themeRgbToHex(bgRgb.r, bgRgb.g, bgRgb.b);

  const candidates = Array.from(buckets.values()).map(b => {
    const mr = b.r / b.n, mg = b.g / b.n, mb = b.b / b.n;
    const meanSat = b.satSum / b.n;
    const score = (b.n / cnt) * 0.55 + meanSat * 1.45;
    return { r: mr, g: mg, b: mb, score };
  }).sort((x, y) => y.score - x.score);

  const best1 = candidates[0] || themeHexToRgb(fb.accent);
  let accent = ensureReadableAccent(bg, themeRgbToHex(best1.r, best1.g, best1.b));

  let best2 = null;
  for (let i = 1; i < candidates.length; i++) {
    if (themeRgbDist(best1, candidates[i]) >= 58) { best2 = candidates[i]; break; }
  }
  if (!best2) best2 = themeHexToRgb(fb.accent2);
  let accent2 = ensureReadableAccent(bg, themeRgbToHex(best2.r, best2.g, best2.b));
  if (themeRgbDist(themeHexToRgb(accent), themeHexToRgb(accent2)) < 36) {
    accent2 = ensureReadableAccent(bg, fb.accent2);
  }

  const text = ensureReadableText(bg, fb.text);
  const wpBg =
    'radial-gradient(82% 62% at 22% 82%, ' + themeRgba(accent, isLight ? 0.22 : 0.24) + ', transparent 64%), ' +
    'radial-gradient(72% 58% at 80% 18%, ' + themeRgba(accent2, isLight ? 0.18 : 0.18) + ', transparent 62%), ' +
    'linear-gradient(180deg, ' + themeMix(bg, accent, isLight ? 0.08 : 0.09) + ' 0%, ' + bg + ' 100%)';

  return { bg, accent, accent2, text, glass: isLight ? 72 : 64, isLight, wpBg };
}

function themeMixHex(a, b, t) {
  const x = themeHexToRgb(a), y = themeHexToRgb(b);
  return themeRgbToHex(
    x.r + (y.r - x.r) * t,
    x.g + (y.g - x.g) * t,
    x.b + (y.b - x.b) * t
  );
}

function interpolateThemePalette(fromPal, toPal, t) {
  const k = clamp(Number(t) || 0, 0, 1);
  const f = fromPal || {};
  const d = toPal || {};
  const g0 = Number(f.glass == null ? 60 : f.glass);
  const g1 = Number(d.glass == null ? 60 : d.glass);
  return {
    bg: themeMixHex(f.bg || '#0a0e1e', d.bg || '#0a0e1e', k),
    accent: themeMixHex(f.accent || '#8fa2ff', d.accent || '#8fa2ff', k),
    accent2: themeMixHex(f.accent2 || '#5fe3c4', d.accent2 || '#5fe3c4', k),
    text: themeMixHex(f.text || '#edf1ff', d.text || '#edf1ff', k),
    glass: Math.round(g0 + (g1 - g0) * k)
  };
}

function resolveBaseAppearancePalette(a) {
  if (!a) return { bg: '#0a0e1e', accent: '#8fa2ff', accent2: '#5fe3c4', text: '#edf1ff', glass: 60 };
  if (a.theme === 'custom' && a.custom) {
    return {
      bg: a.custom.bg || '#0a0e1e',
      accent: a.custom.accent || '#8fa2ff',
      accent2: a.custom.accent2 || '#5fe3c4',
      text: a.custom.text || '#edf1ff',
      glass: a.custom.glass == null ? 55 : a.custom.glass
    };
  }
  const t = THEMES.find(x => x.id === a.theme) || THEMES[0];
  return {
    bg: t.bg,
    accent: t.accent,
    accent2: t.accent2,
    text: t.ink,
    glass: 62
  };
}

const CUSTOM_THEME_VARS = [
  '--bg', '--bg-soft', '--surface', '--surface-2', '--border',
  '--glass', '--glass-strong', '--text', '--text-dim', '--text-faint',
  '--accent', '--accent-2', '--accent-soft', '--accent-contrast',
  '--accent-glow', '--danger'
];

const Themes = {
  customWallpaperUrl: null,
  trackCovers: {},
  trackPalettes: {},
  loadedFonts: { inter: true },
  _hasAppliedOnce: false,
  _lastWasMusicTheme: false,
  _lastMusicThemeId: null,
  _currentPalette: null,
  _fadeRaf: null,
  _wpFadeTimer: null,
  _lastWpBg: '',

  ensureFonts() {
    /* todas as fontes já estão disponíveis localmente via css/fonts.css */
  },

  activeMusicTheme() {
    if (typeof Sound === 'undefined' || !Sound.playing) return null;
    if (typeof Store === 'undefined' || !Store.state || !Store.state.music) return null;
    if (Store.state.music.dynamicTheme === false) return null;
    if (typeof getThematicTrack !== 'function') return null;
    const meta = getThematicTrack(Store.state.music.track);
    if (!meta) return null;
    const palette = this.trackPalettes[meta.id] || meta.defaultPalette;
    return { id: meta.id, meta, palette };
  },

  applyPaletteVars(p) {
    const root = document.documentElement;
    const bg = p.bg || '#0a0e1e';
    const ac = p.accent || '#8fa2ff';
    const ac2 = p.accent2 || '#5fe3c4';
    const tx = p.text || '#edf1ff';
    const glass = clamp(Number(p.glass == null ? 55 : p.glass), 0, 100) / 100;

    root.style.setProperty('--bg', bg);
    root.style.setProperty('--bg-soft', themeMix(bg, ac, 0.10));
    root.style.setProperty('--surface', themeRgba(ac, 0.10));
    root.style.setProperty('--surface-2', themeRgba(ac, 0.17));
    root.style.setProperty('--border', themeRgba(ac, 0.20));
    root.style.setProperty('--glass', themeRgba(bg, glass));
    root.style.setProperty('--glass-strong', themeRgba(bg, Math.min(1, glass + 0.30)));
    root.style.setProperty('--text', tx);
    root.style.setProperty('--text-dim', themeMix(tx, bg, 0.36));
    root.style.setProperty('--text-faint', themeMix(tx, bg, 0.56));
    root.style.setProperty('--accent', ac);
    root.style.setProperty('--accent-2', ac2);
    root.style.setProperty('--accent-soft', themeRgba(ac, 0.16));
    root.style.setProperty('--accent-contrast', themeLuma(ac) > 0.55 ? '#0a0e1e' : '#f8faff');
    root.style.setProperty('--accent-glow', themeRgba(ac, 0.36));
    root.style.setProperty('--danger', '#ff6b81');
    root.style.colorScheme = themeLuma(bg) > 0.55 ? 'light' : 'dark';
    this._currentPalette = { bg, accent: ac, accent2: ac2, text: tx, glass: Math.round(glass * 100) };
  },

  _canAnimateFade() {
    if (typeof document === 'undefined' || !document.body || typeof document.body.getBoundingClientRect !== 'function') return false;
    if (typeof requestAnimationFrame !== 'function' || typeof performance === 'undefined') return false;
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    }
    return true;
  },

  _crossfadeWallpaper(wEl, prevBg, nextBg) {
    if (!wEl) return;
    const fadeEl = typeof $ === 'function' ? $('#wallpaper-fade') : null;
    if (!fadeEl || !prevBg || prevBg === nextBg || !this._canAnimateFade()) return;

    clearTimeout(this._wpFadeTimer);
    fadeEl.style.transition = 'none';
    fadeEl.style.background = prevBg;
    fadeEl.style.backgroundSize = 'cover';
    fadeEl.style.backgroundPosition = 'center';
    fadeEl.style.opacity = '1';
    void fadeEl.offsetWidth;

    requestAnimationFrame(() => {
      fadeEl.style.transition = 'opacity 1.35s cubic-bezier(.22, .61, .36, 1)';
      fadeEl.style.opacity = '0';
    });
    this._wpFadeTimer = setTimeout(() => {
      fadeEl.style.transition = 'none';
      fadeEl.style.background = '';
    }, 1450);
  },

  _animatePaletteTransition(fromPal, toPal, onDone) {
    if (this._fadeRaf && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this._fadeRaf);
      this._fadeRaf = null;
    }
    const start = performance.now();
    const duration = 1200;
    const step = (now) => {
      const raw = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - raw, 3);
      const cur = interpolateThemePalette(fromPal, toPal, eased);
      this.applyPaletteVars(cur);
      if (typeof Motion !== 'undefined' && typeof Motion.syncColors === 'function') Motion.syncColors();
      if (raw < 1) {
        this._fadeRaf = requestAnimationFrame(step);
      } else {
        this._fadeRaf = null;
        if (onDone) onDone();
      }
    };
    this._fadeRaf = requestAnimationFrame(step);
  },

  apply(opts) {
    const a = Store.state.appearance;
    const wEl = $('#wallpaper');
    const root = document.documentElement;
    root.dataset.theme = a.theme;

    const ui = UI_FONTS.find(f => f.id === a.uiFont) || UI_FONTS[0];
    this.ensureFonts([ui.id]);
    root.style.setProperty('--font-ui', ui.family);

    const activeMusic = this.activeMusicTheme();
    const isMusic = !!(activeMusic && activeMusic.palette);
    const prevWasMusic = this._lastWasMusicTheme;
    const prevMusicId = this._lastMusicThemeId;
    const musicTransition = (prevWasMusic !== isMusic) || (isMusic && prevMusicId !== activeMusic.id);
    const shouldFade = this._hasAppliedOnce && this._canAnimateFade() && !(opts && opts.immediate) && (musicTransition || (opts && opts.fade));

    const prevWpBg = this._lastWpBg || (wEl ? wEl.style.background : '');
    let nextWpBg = '';
    if (isMusic) {
      nextWpBg = activeMusic.palette.wpBg || activeMusic.palette.bg;
    } else if (a.wallpaper === 'custom' && this.customWallpaperUrl) {
      nextWpBg = 'url("' + this.customWallpaperUrl + '") center / cover no-repeat';
    } else {
      const wp = WALLPAPERS.find(w => w.id === a.wallpaper) || WALLPAPERS[0];
      nextWpBg = wp.id === 'nenhum' ? 'var(--bg)' : wp.bg;
    }

    if (shouldFade && wEl) {
      this._crossfadeWallpaper(wEl, prevWpBg, nextWpBg);
    }

    if (wEl) {
      wEl.style.background = nextWpBg;
      if (isMusic || !(a.wallpaper === 'custom' && this.customWallpaperUrl)) {
        wEl.style.backgroundSize = isMusic || nextWpBg !== 'var(--bg)' ? 'cover' : '';
      }
    }
    this._lastWpBg = nextWpBg;

    const targetPalette = isMusic ? activeMusic.palette : resolveBaseAppearancePalette(a);
    const startPalette = this._currentPalette ? Object.assign({}, this._currentPalette) : targetPalette;

    if (isMusic) {
      root.dataset.musicTheme = activeMusic.id;
    } else {
      delete root.dataset.musicTheme;
    }

    if (shouldFade && startPalette) {
      this._animatePaletteTransition(startPalette, targetPalette, () => {
        if (isMusic) {
          this.applyPaletteVars(targetPalette);
        } else {
          this.applyCustomColors(a);
          this._currentPalette = resolveBaseAppearancePalette(a);
        }
        if (typeof Motion !== 'undefined' && typeof Motion.syncColors === 'function') Motion.syncColors();
      });
    } else {
      if (this._fadeRaf && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(this._fadeRaf);
        this._fadeRaf = null;
      }
      if (isMusic) {
        this.applyPaletteVars(activeMusic.palette);
      } else {
        this.applyCustomColors(a);
        this._currentPalette = resolveBaseAppearancePalette(a);
      }
    }

    this._hasAppliedOnce = true;
    this._lastWasMusicTheme = isMusic;
    this._lastMusicThemeId = isMusic ? activeMusic.id : null;

    // cor da barra do navegador acompanha o tema
    let bg = targetPalette.bg || '';
    if (typeof getComputedStyle === 'function' && !shouldFade) {
      bg = (getComputedStyle(root).getPropertyValue('--bg') || '').trim() || bg;
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && bg) meta.setAttribute('content', bg);

    if (typeof Motion !== 'undefined') Motion.syncColors();
  },

  applyCustomColors(a) {
    const root = document.documentElement;
    if (a.theme !== 'custom') {
      CUSTOM_THEME_VARS.forEach(v => root.style.removeProperty(v));
      root.style.colorScheme = '';
      return;
    }
    this.applyPaletteVars(a.custom || {});
  },

  analyzeCoverDataUrl(dataUrl, fallback) {
    return new Promise((resolve) => {
      if (!dataUrl || typeof Image === 'undefined' || typeof document === 'undefined') {
        return resolve(fallback || null);
      }
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 48;
          canvas.height = 48;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, 48, 48);
          const data = ctx.getImageData(0, 0, 48, 48).data;
          resolve(extractCoverPaletteFromPixels(data, fallback));
        } catch (e) {
          resolve(fallback || null);
        }
      };
      img.onerror = () => resolve(fallback || null);
      img.src = dataUrl;
    });
  },

  async setTrackCover(id, dataUrl) {
    const meta = typeof getThematicTrack === 'function' ? getThematicTrack(id) : null;
    if (!meta || !dataUrl) return null;
    this.trackCovers[id] = dataUrl;
    const palette = await this.analyzeCoverDataUrl(dataUrl, meta.defaultPalette);
    if (palette) this.trackPalettes[id] = palette;
    if (typeof Sound !== 'undefined' && Sound.playing && Store.state.music.track === id) {
      this.apply();
    }
    return palette;
  },

  clearTrackCover(id) {
    delete this.trackCovers[id];
    delete this.trackPalettes[id];
    if (typeof Sound !== 'undefined' && Sound.playing && Store.state.music.track === id) {
      this.apply();
    }
  },

  async loadCustomFiles() {
    const wp = await Files.get('customWallpaper');
    if (wp) {
      this.customWallpaperUrl = wp;
      if (Store.state.appearance.wallpaper === 'custom') this.apply({ immediate: true });
    }
    const mus = await Files.get('customMusic');
    if (mus) Sound.setCustomSource(mus);
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    THEMES,
    WALLPAPERS,
    themeLuma,
    themeContrastRatio,
    ensureReadableText,
    extractCoverPaletteFromPixels,
    interpolateThemePalette,
    Themes
  };
}
