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
  { id: 'nenhum',  label: 'Tema puro', bg: '' }
];

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

/* famílias pedidas sob demanda — a página só baixa Inter na abertura */
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

const CUSTOM_THEME_VARS = [
  '--bg', '--bg-soft', '--surface', '--surface-2', '--border',
  '--glass', '--glass-strong', '--text', '--text-dim', '--text-faint',
  '--accent', '--accent-2', '--accent-soft', '--accent-contrast',
  '--accent-glow', '--danger'
];

const Themes = {
  customWallpaperUrl: null,
  loadedFonts: { inter: true },

  ensureFonts(ids) {
    const pending = [];
    (ids || []).forEach(id => {
      if (!FONT_QUERY[id] || this.loadedFonts[id]) return;
      this.loadedFonts[id] = true;
      pending.push(id);
    });
    if (!pending.length) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' +
      pending.map(id => FONT_QUERY[id]).join('&family=') + '&display=swap';
    document.head.appendChild(link);
  },

  apply() {
    const a = Store.state.appearance;
    const wEl = $('#wallpaper');
    const root = document.documentElement;
    root.dataset.theme = a.theme;

    const ui = UI_FONTS.find(f => f.id === a.uiFont) || UI_FONTS[0];
    this.ensureFonts([ui.id]);
    root.style.setProperty('--font-ui', ui.family);

    this.applyCustomColors(a);

    if (a.wallpaper === 'custom' && this.customWallpaperUrl) {
      wEl.style.background = 'url("' + this.customWallpaperUrl + '") center / cover no-repeat';
    } else {
      const wp = WALLPAPERS.find(w => w.id === a.wallpaper) || WALLPAPERS[0];
      if (wp.id === 'nenhum') {
        wEl.style.background = 'var(--bg)';
      } else {
        wEl.style.background = wp.bg;
        wEl.style.backgroundSize = 'cover';
      }
    }

    // cor da barra do navegador acompanha o tema
    const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
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
    const c = a.custom || {};
    const bg = c.bg || '#0a0e1e';
    const ac = c.accent || '#8fa2ff';
    const ac2 = c.accent2 || '#5fe3c4';
    const tx = c.text || '#edf1ff';
    const glass = clamp(Number(c.glass == null ? 55 : c.glass), 0, 100) / 100;

    root.style.setProperty('--bg', bg);
    root.style.setProperty('--bg-soft', themeMix(bg, ac, 0.10));
    root.style.setProperty('--surface', themeRgba(ac, 0.10));
    root.style.setProperty('--surface-2', themeRgba(ac, 0.17));
    root.style.setProperty('--border', themeRgba(ac, 0.19));
    root.style.setProperty('--glass', themeRgba(bg, glass));
    root.style.setProperty('--glass-strong', themeRgba(bg, Math.min(1, glass + 0.32)));
    root.style.setProperty('--text', tx);
    root.style.setProperty('--text-dim', themeMix(tx, bg, 0.38));
    root.style.setProperty('--text-faint', themeMix(tx, bg, 0.58));
    root.style.setProperty('--accent', ac);
    root.style.setProperty('--accent-2', ac2);
    root.style.setProperty('--accent-soft', themeRgba(ac, 0.16));
    root.style.setProperty('--accent-contrast', themeLuma(ac) > 0.55 ? '#0a0e1e' : '#f8faff');
    root.style.setProperty('--accent-glow', themeRgba(ac, 0.35));
    root.style.setProperty('--danger', '#ff6b81');
    root.style.colorScheme = themeLuma(bg) > 0.55 ? 'light' : 'dark';
  },

  async loadCustomFiles() {
    const wp = await Files.get('customWallpaper');
    if (wp) {
      this.customWallpaperUrl = wp;
      if (Store.state.appearance.wallpaper === 'custom') this.apply();
    }
    const mus = await Files.get('customMusic');
    if (mus) Sound.setCustomSource(mus);
  }
};
