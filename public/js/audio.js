'use strict';
/* ============ audio.js — trilhas calmas e som regulado (Web Audio) ============ */
const CUSTOM_THEMATIC_TRACKS = [
  {
    id: 'flowers',
    title: 'Flowers',
    subtitle: 'Paz, amor e romance',
    src: 'assets/aistudio/Flowers_cc092a54.mp3',
    particleStyle: 'petals',
    sceneId: 'flowers',
    defaultPalette: {
      bg: '#150c12',
      accent: '#f4a5b8',
      accent2: '#8ec49e',
      text: '#fdf3f6',
      glass: 62,
      isLight: false,
      wpBg: 'radial-gradient(80% 62% at 22% 84%, rgba(244,165,184,.24), transparent 64%), radial-gradient(70% 58% at 80% 18%, rgba(142,196,158,.16), transparent 62%), radial-gradient(90% 70% at 50% 45%, rgba(190,104,138,.14), transparent 66%), linear-gradient(180deg, #1b0f17 0%, #0d070b 100%)'
    },
    coverSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><radialGradient id="fg" cx="50%" cy="44%" r="58%"><stop offset="0%" stop-color="#f4a5b8" stop-opacity="0.34"/><stop offset="60%" stop-color="#8ec49e" stop-opacity="0.10"/><stop offset="100%" stop-color="#150c12" stop-opacity="0"/></radialGradient></defs><rect width="120" height="120" rx="18" fill="#150c12"/><rect width="120" height="120" rx="18" fill="url(#fg)"/><path d="M60 104 C59 84 61 68 60 52" fill="none" stroke="#8ec49e" stroke-width="2.2" stroke-linecap="round"/><path d="M60 80 C47 76 41 68 42 58 C51 59 58 67 60 80 Z" fill="#8ec49e" fill-opacity="0.45" stroke="#8ec49e" stroke-width="1.3"/><path d="M60 72 C73 68 80 60 79 50 C70 51 63 59 60 72 Z" fill="#8ec49e" fill-opacity="0.35" stroke="#8ec49e" stroke-width="1.3"/><circle cx="60" cy="43" r="17" fill="#f4a5b8" fill-opacity="0.22" stroke="#f4a5b8" stroke-width="1.5"/><path d="M48 45 C47 32 60 25 69 32 C74 37 72 49 60 51 C52 52 48 47 48 45 Z" fill="#f4a5b8" fill-opacity="0.42" stroke="#fdf3f6" stroke-width="1.3"/><path d="M54 42 C54 36 62 34 65 39 C67 44 61 48 56 45" fill="none" stroke="#fdf3f6" stroke-width="1.4" stroke-linecap="round"/></svg>'
  },
  {
    id: 'march',
    title: 'March',
    subtitle: 'Trincheira, brasa e contraste',
    src: 'assets/aistudio/March_564a9b39.mp3',
    particleStyle: 'embers',
    sceneId: 'march',
    defaultPalette: {
      bg: '#0c0a09',
      accent: '#f59e0b',
      accent2: '#ef4444',
      text: '#f6efe8',
      glass: 66,
      isLight: false,
      wpBg: 'radial-gradient(85% 52% at 50% 100%, rgba(239,68,68,.24), transparent 64%), radial-gradient(70% 50% at 24% 82%, rgba(245,158,11,.18), transparent 62%), radial-gradient(75% 60% at 76% 18%, rgba(120,90,72,.14), transparent 62%), linear-gradient(180deg, #14100e 0%, #080605 100%)'
    },
    coverSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><radialGradient id="mg" cx="50%" cy="88%" r="68%"><stop offset="0%" stop-color="#ef4444" stop-opacity="0.42"/><stop offset="48%" stop-color="#f59e0b" stop-opacity="0.18"/><stop offset="100%" stop-color="#0c0a09" stop-opacity="0"/></radialGradient></defs><rect width="120" height="120" rx="18" fill="#0c0a09"/><rect width="120" height="120" rx="18" fill="url(#mg)"/><path d="M12 96 L108 96" stroke="#7e7065" stroke-width="1.6" stroke-linecap="round"/><path d="M26 98 L44 52 M44 98 L26 52 M76 98 L94 52 M94 98 L76 52 M56 98 L64 46" stroke="#baa99d" stroke-width="2.1" stroke-linecap="round"/><path d="M10 74 Q36 82 60 74 T110 76" fill="none" stroke="#f59e0b" stroke-opacity="0.6" stroke-width="1.4"/><circle cx="48" cy="36" r="2.2" fill="#f59e0b"/><circle cx="71" cy="28" r="1.7" fill="#ef4444"/><circle cx="62" cy="54" r="1.5" fill="#fde68a"/></svg>'
  }
];

function getThematicTrack(id) {
  return CUSTOM_THEMATIC_TRACKS.find(t => t.id === id) || null;
}

function isThematicTrack(id) {
  return !!getThematicTrack(id);
}

function buildTrackCoverSvgDataUrl(id) {
  const meta = getThematicTrack(id);
  if (!meta || !meta.coverSvg) return '';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(meta.coverSvg);
}

const TRACK_LABELS = {
  none: '—',
  flowers: 'Flowers',
  march: 'March',
  rain: 'Chuva',
  ocean: 'Oceano',
  pad: 'Ambiente',
  fireplace: 'Lareira',
  night: 'Noite calma',
  typing: 'Toques',
  keys: 'Teclas',
  writing: 'Escrita',
  custom: 'Sua música'
};

function getTrackLabel(id) {
  const key = id || 'none';
  const fallback = TRACK_LABELS[key] || key;
  if (typeof t === 'function') return t('track.' + key, null, fallback);
  return fallback;
}

/* Curva perceptual suave: evita que 35%-50% soe agressivo e limita o teto */
function audioGainCurve(vol) {
  const n = Number(vol);
  if (!Number.isFinite(n) || n <= 0) return 0;
  const clamped = Math.min(1, Math.max(0, n));
  return Math.round(Math.pow(clamped, 1.85) * 0.34 * 10000) / 10000;
}

function audioHtmlVolume(vol) {
  const n = Number(vol);
  if (!Number.isFinite(n) || n <= 0) return 0;
  const clamped = Math.min(1, Math.max(0, n));
  return Math.round(Math.pow(clamped, 1.65) * 0.55 * 10000) / 10000;
}

const Sound = {
  ctx: null,
  master: null,
  compressor: null,
  warmBus: null,
  presenceBus: null,
  bgm: null,
  customSrc: null,
  nodes: [],
  timers: [],
  intervals: [],
  pinkBuf: null,
  brownBuf: null,
  playing: false,
  _ignoreBgmEvents: false,

  init() {
    this.bgm = typeof $ === 'function' ? $('#bgm') : null;
    if (this.bgm) {
      this.bgm.volume = audioHtmlVolume(Store.state.music.volume);
      this.bgm.addEventListener('pause', () => {
        if (this._ignoreBgmEvents) return;
        const t = Store.state && Store.state.music && Store.state.music.track;
        if (this.playing && (t === 'custom' || isThematicTrack(t)) && !this.bgm.ended) {
          this.playing = false;
          this.syncVisuals();
          this.updateUI();
        }
      });
      this.bgm.addEventListener('error', () => {
        if (this._ignoreBgmEvents) return;
        const t = Store.state && Store.state.music && Store.state.music.track;
        if (this.playing && (t === 'custom' || isThematicTrack(t))) {
          this.playing = false;
          this.syncVisuals();
          this.updateUI();
        }
      });
    }
  },

  ensureCtx() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!this.ctx) {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = audioGainCurve(Store.state.music.volume);

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -18;
      this.compressor.knee.value = 18;
      this.compressor.ratio.value = 3.5;
      this.compressor.attack.value = 0.025;
      this.compressor.release.value = 0.22;

      this.warmBus = this.ctx.createBiquadFilter();
      this.warmBus.type = 'lowpass';
      this.warmBus.frequency.value = 4200;
      this.warmBus.Q.value = 0.45;

      this.presenceBus = this.ctx.createBiquadFilter();
      this.presenceBus.type = 'lowpass';
      this.presenceBus.frequency.value = 7600;
      this.presenceBus.Q.value = 0.4;

      this.warmBus.connect(this.compressor);
      this.presenceBus.connect(this.compressor);
      this.compressor.connect(this.master);
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },

  setVolume(v) {
    const clean = Math.min(1, Math.max(0, Number(v) || 0));
    Store.state.music.volume = clean;
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(audioGainCurve(clean), this.ctx.currentTime, 0.06);
    }
    if (this.bgm) this.bgm.volume = audioHtmlVolume(clean);
    Store.save();
  },

  setCustomSource(url) {
    this.customSrc = url || null;
    if (this.bgm && Store.state && Store.state.music && Store.state.music.track === 'custom') {
      if (url) this.bgm.src = url;
      else this.bgm.removeAttribute('src');
    }
  },

  /* Ruído rosa (quente, -3 dB/oitava) para chuva suave e espuma */
  pinkNoise() {
    if (this.pinkBuf) return this.pinkBuf;
    const ctx = this.ctx;
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const out = buf.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.045;
        b6 = white * 0.115926;
      }
    }
    this.pinkBuf = buf;
    return buf;
  },

  /* Ruído marrom (-6 dB/oitava) acolhedor, sem chiado estridente */
  brownNoise() {
    if (this.brownBuf) return this.brownBuf;
    const ctx = this.ctx;
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const out = buf.getChannelData(ch);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        out[i] = Math.max(-0.9, Math.min(0.9, last * 2.2));
      }
    }
    this.brownBuf = buf;
    return buf;
  },

  play(track) {
    track = track || Store.state.music.track;
    Store.state.music.track = track;
    this.stop(true);
    if (!track || track === 'none') {
      this.playing = false;
      Store.save();
      this.syncVisuals();
      this.updateUI();
      return;
    }

    const thematic = getThematicTrack(track);
    if (thematic) {
      if (!this.bgm) {
        toast(typeof tr === 'function' ? tr('audio.unavailable', 'Reprodutor de áudio indisponível') : 'Reprodutor de áudio indisponível', 'close');
        this.playing = false;
        this.syncVisuals();
        this.updateUI();
        return;
      }
      this._ignoreBgmEvents = true;
      this.bgm.loop = true;
      if (this.bgm.getAttribute('src') !== thematic.src) {
        this.bgm.src = thematic.src;
      }
      this.bgm.currentTime = 0;
      this.bgm.volume = audioHtmlVolume(Store.state.music.volume);
      this._ignoreBgmEvents = false;
      this.bgm.play().catch(() => {});
      this.playing = true;
      Store.save();
      this.syncVisuals();
      this.updateUI();
      return;
    }

    if (track === 'custom') {
      if (!this.bgm || !this.customSrc) {
        toast(typeof tr === 'function' ? tr('audio.sendFirst', 'Envie um arquivo de áudio nas configurações') : 'Envie um arquivo de áudio nas configurações', 'music');
        this.playing = false;
        this.syncVisuals();
        this.updateUI();
        return;
      }
      this._ignoreBgmEvents = true;
      this.bgm.loop = true;
      if (this.bgm.src !== this.customSrc) this.bgm.src = this.customSrc;
      this.bgm.volume = audioHtmlVolume(Store.state.music.volume);
      this._ignoreBgmEvents = false;
      this.bgm.play().catch(() => {});
      this.playing = true;
      Store.save();
      this.syncVisuals();
      this.updateUI();
      return;
    }

    const ctx = this.ensureCtx();
    if (!ctx) {
      toast(typeof tr === 'function' ? tr('audio.unsupported', 'Áudio não suportado neste navegador') : 'Áudio não suportado neste navegador', 'close');
      return;
    }
    try {
      if (track === 'rain') this.buildRain(1.0);
      else if (track === 'ocean') this.buildOcean();
      else if (track === 'pad') this.buildPad();
      else if (track === 'fireplace') this.buildFireplace();
      else if (track === 'night') this.buildNight();
      else if (track === 'typing') this.buildTyping();
      else if (track === 'keys') this.buildMechanicalKeys();
      else if (track === 'writing') this.buildWriting();
      else this.buildRain(1.0);
      this.playing = true;
    } catch (e) { /* falha silenciosa */ }
    Store.save();
    this.syncVisuals();
    this.updateUI();
  },

  stop(silent) {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.intervals.forEach(clearInterval);
    this.intervals = [];
    this.nodes.forEach(n => {
      try { if (n.stop) n.stop(); } catch (e) {}
      try { n.disconnect(); } catch (e) {}
    });
    this.nodes = [];
    if (this.bgm) {
      this._ignoreBgmEvents = true;
      try { this.bgm.pause(); } catch (e) {}
      this._ignoreBgmEvents = false;
    }
    if (!silent) {
      this.playing = false;
      this.syncVisuals();
      this.updateUI();
    }
  },

  toggle() {
    if (this.playing) this.stop();
    else if (Store.state.music.track === 'none') this.play('night');
    else this.play();
  },

  /* ---------- trilhas calmas e aconchegantes ---------- */
  buildRain(level) {
    const ctx = this.ctx;
    const mult = level == null ? 1.0 : level;

    // chuva fina em ruído rosa com corte quente (sem agudo estridente)
    const rainSrc = ctx.createBufferSource();
    rainSrc.buffer = this.pinkNoise();
    rainSrc.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1150;
    lp.Q.value = 0.4;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 180;
    const g = ctx.createGain();
    g.gain.value = 0.36 * mult;
    rainSrc.connect(hp);
    hp.connect(lp);
    lp.connect(g);
    g.connect(this.warmBus);

    // oscilação lenta orgânica na textura da chuva
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lg = ctx.createGain();
    lg.gain.value = 180;
    lfo.connect(lg);
    lg.connect(lp.frequency);

    // base grave abafada (chuva no telhado)
    const bodySrc = ctx.createBufferSource();
    bodySrc.buffer = this.brownNoise();
    bodySrc.loop = true;
    const bodyLp = ctx.createBiquadFilter();
    bodyLp.type = 'lowpass';
    bodyLp.frequency.value = 260;
    const g2 = ctx.createGain();
    g2.gain.value = 0.24 * mult;
    bodySrc.connect(bodyLp);
    bodyLp.connect(g2);
    g2.connect(this.warmBus);

    rainSrc.start();
    bodySrc.start();
    lfo.start();
    this.nodes.push(rainSrc, bodySrc, lfo, hp, lp, bodyLp, g, g2, lg);
  },

  buildOcean() {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.brownNoise();
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 340;
    lp.Q.value = 0.6;
    const g = ctx.createGain();
    g.gain.value = 0.0;
    src.connect(lp);
    lp.connect(g);
    g.connect(this.warmBus);

    if (ctx.createConstantSource) {
      const off = ctx.createConstantSource();
      off.offset.value = 0.26;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.048;
      const lg = ctx.createGain();
      lg.gain.value = 0.20;
      off.connect(g.gain);
      lfo.connect(lg);
      lg.connect(g.gain);

      const filterBase = ctx.createOscillator();
      filterBase.frequency.value = 0.048;
      const fGain = ctx.createGain();
      fGain.gain.value = 140;
      filterBase.connect(fGain);
      fGain.connect(lp.frequency);

      off.start();
      lfo.start();
      filterBase.start();
      this.nodes.push(off, lfo, lg, filterBase, fGain);
    } else {
      g.gain.value = 0.26;
    }

    // espuma suave longe da costa
    const foam = ctx.createBufferSource();
    foam.buffer = this.pinkNoise();
    foam.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 620;
    bp.Q.value = 0.5;
    const gf = ctx.createGain();
    gf.gain.value = 0.045;
    foam.connect(bp);
    bp.connect(gf);
    gf.connect(this.warmBus);

    src.start();
    foam.start();
    this.nodes.push(src, foam, lp, bp, g, gf);
  },

  /* Voz suave de feltro / piano elétrico (Rhodes abafado) */
  playFeltNote(freq, when, dur, gainVal, dest) {
    const ctx = this.ctx;
    const body = ctx.createOscillator();
    body.type = 'sine';
    body.frequency.setValueAtTime(freq, when);

    const warmth = ctx.createOscillator();
    warmth.type = 'triangle';
    warmth.frequency.setValueAtTime(freq, when);
    warmth.detune.setValueAtTime((Math.random() - 0.5) * 6, when);

    // toque sutil de martelo macio no oitavo acima
    const bell = ctx.createOscillator();
    bell.type = 'sine';
    bell.frequency.setValueAtTime(freq * 2, when);

    const gBody = ctx.createGain();
    gBody.gain.setValueAtTime(0.0001, when);
    gBody.gain.linearRampToValueAtTime(gainVal, when + 0.06);
    gBody.gain.exponentialRampToValueAtTime(Math.max(0.0001, gainVal * 0.45), when + dur * 0.45);
    gBody.gain.exponentialRampToValueAtTime(0.0001, when + dur);

    const gWarm = ctx.createGain();
    gWarm.gain.setValueAtTime(0.0001, when);
    gWarm.gain.linearRampToValueAtTime(gainVal * 0.32, when + 0.14);
    gWarm.gain.exponentialRampToValueAtTime(0.0001, when + dur * 0.92);

    const gBell = ctx.createGain();
    gBell.gain.setValueAtTime(0.0001, when);
    gBell.gain.linearRampToValueAtTime(gainVal * 0.12, when + 0.02);
    gBell.gain.exponentialRampToValueAtTime(0.0001, when + Math.min(0.65, dur * 0.25));

    body.connect(gBody); gBody.connect(dest);
    warmth.connect(gWarm); gWarm.connect(dest);
    bell.connect(gBell); gBell.connect(dest);

    body.start(when); body.stop(when + dur + 0.05);
    warmth.start(when); warmth.stop(when + dur + 0.05);
    bell.start(when); bell.stop(when + Math.min(0.75, dur));

    this.timers.push(setTimeout(() => {
      try {
        body.disconnect(); warmth.disconnect(); bell.disconnect();
        gBody.disconnect(); gWarm.disconnect(); gBell.disconnect();
      } catch (e) {}
    }, (dur + 0.4) * 1000));
  },

  playPadChord(freqs, when, dur, gainVal, dest) {
    const ctx = this.ctx;
    freqs.forEach((f, idx) => {
      const o1 = ctx.createOscillator();
      o1.type = 'sine';
      o1.frequency.setValueAtTime(f, when);
      o1.detune.setValueAtTime((idx - 1.5) * 3.5, when);

      const o2 = ctx.createOscillator();
      o2.type = 'triangle';
      o2.frequency.setValueAtTime(f, when);
      o2.detune.setValueAtTime((1.5 - idx) * 4, when);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, when);
      g.gain.linearRampToValueAtTime(gainVal, when + dur * 0.34);
      g.gain.setValueAtTime(gainVal * 0.92, when + dur * 0.62);
      g.gain.linearRampToValueAtTime(0.0001, when + dur * 1.15);

      const g2 = ctx.createGain();
      g2.gain.value = 0.28;

      o1.connect(g);
      o2.connect(g2); g2.connect(g);
      g.connect(dest);

      o1.start(when); o1.stop(when + dur * 1.2);
      o2.start(when); o2.stop(when + dur * 1.2);

      this.timers.push(setTimeout(() => {
        try { o1.disconnect(); o2.disconnect(); g.disconnect(); g2.disconnect(); } catch (e) {}
      }, (dur * 1.25) * 1000 + 250));
    });
  },

  buildPad() {
    const ctx = this.ctx;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 920;
    lp.Q.value = 0.5;
    lp.connect(this.warmBus);

    // LFO muito lento no filtro para respiração quente
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.04;
    const lg = ctx.createGain();
    lg.gain.value = 180;
    lfo.connect(lg);
    lg.connect(lp.frequency);
    lfo.start();
    this.nodes.push(lp, lfo, lg);

    // Fmaj9 -> Dm9 -> Bbmaj7 -> C6sus4 (voicings abertos e calmos)
    const chords = [
      [174.61, 220.00, 261.63, 329.63, 392.00],
      [146.83, 220.00, 261.63, 329.63, 349.23],
      [116.54, 174.61, 220.00, 293.66, 349.23],
      [130.81, 196.00, 220.00, 293.66, 329.63]
    ];
    let i = 0;
    const intervalMs = 9600;
    const dur = intervalMs / 1000;
    const step = () => {
      if (!this.playing) return;
      this.playPadChord(chords[i % chords.length], ctx.currentTime + 0.05, dur, 0.048, lp);
      i++;
    };
    step();
    this.intervals.push(setInterval(step, intervalMs));
  },

  buildNightChords(opts) {
    opts = opts || {};
    const ctx = this.ctx;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1050;
    lp.Q.value = 0.6;
    lp.connect(this.warmBus);
    this.nodes.push(lp);

    // Acordes Rhodes aconchegantes (Fmaj9 -> Em7 -> Dm9 -> Cmaj9)
    const prog = [
      { bass: 87.31,  notes: [174.61, 220.00, 261.63, 329.63, 392.00], melody: [523.25, 440.00, 392.00] },
      { bass: 82.41,  notes: [164.81, 196.00, 246.94, 293.66, 392.00], melody: [493.88, 392.00, 329.63] },
      { bass: 73.42,  notes: [146.83, 220.00, 261.63, 329.63, 349.23], melody: [440.00, 349.23, 329.63] },
      { bass: 65.41,  notes: [130.81, 196.00, 246.94, 293.66, 329.63], melody: [392.00, 329.63, 293.66] }
    ];

    let stepIdx = 0;
    const barMs = 6800;
    const barSec = barMs / 1000;

    const scheduleBar = () => {
      if (!this.playing) return;
      const bar = prog[stepIdx % prog.length];
      const t0 = ctx.currentTime + 0.06;

      // grave quentinho de sub-baixo macio
      const sub = ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(bar.bass, t0);
      const sg = ctx.createGain();
      sg.gain.setValueAtTime(0.0001, t0);
      sg.gain.linearRampToValueAtTime(0.095, t0 + 0.14);
      sg.gain.exponentialRampToValueAtTime(0.0001, t0 + barSec * 0.92);
      sub.connect(sg);
      sg.connect(lp);
      sub.start(t0);
      sub.stop(t0 + barSec);
      this.timers.push(setTimeout(() => { try { sub.disconnect(); sg.disconnect(); } catch (e) {} }, barMs + 300));

      // arpejo dedilhado suave estilo piano de feltro (strum leve de 45ms por nota)
      bar.notes.forEach((freq, nIdx) => {
        this.playFeltNote(freq, t0 + nIdx * 0.055, barSec * 0.88, 0.044, lp);
      });

      // 2 notas melódicas esparsas e calmas no segundo tempo do compasso
      const m1 = bar.melody[stepIdx % bar.melody.length];
      const m2 = bar.melody[(stepIdx + 1) % bar.melody.length];
      this.playFeltNote(m1, t0 + barSec * 0.42, 2.2, 0.022, lp);
      if (stepIdx % 2 === 0) {
        this.playFeltNote(m2, t0 + barSec * 0.72, 1.9, 0.018, lp);
      }

      stepIdx++;
    };
    scheduleBar();
    this.intervals.push(setInterval(scheduleBar, barMs));

    if (!opts.noVinyl) {
      // poeira de vinil quentinha e discreta (bandpass 1250Hz, nunca agudo irritante)
      const vinylBed = ctx.createBufferSource();
      vinylBed.buffer = this.pinkNoise();
      vinylBed.loop = true;
      const vLp = ctx.createBiquadFilter();
      vLp.type = 'bandpass';
      vLp.frequency.value = 1100;
      vLp.Q.value = 0.7;
      const vGain = ctx.createGain();
      vGain.gain.value = 0.018;
      vinylBed.connect(vLp);
      vLp.connect(vGain);
      vGain.connect(this.warmBus);
      vinylBed.start();
      this.nodes.push(vinylBed, vLp, vGain);

      const dustTick = () => {
        if (!this.playing) return;
        try {
          const src = ctx.createBufferSource();
          src.buffer = this.pinkNoise();
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.value = 1200 + Math.random() * 650;
          bp.Q.value = 1.4;
          const g = ctx.createGain();
          g.gain.value = 0.008 + Math.random() * 0.014;
          src.connect(bp);
          bp.connect(g);
          g.connect(this.warmBus);
          src.start(ctx.currentTime, Math.random() * 2.5, 0.022);
          this.timers.push(setTimeout(() => { try { src.disconnect(); bp.disconnect(); g.disconnect(); } catch (e) {} }, 250));
        } catch (e) {}
        this.timers.push(setTimeout(dustTick, 240 + Math.random() * 650));
      };
      dustTick();
    }
  },

  buildFireplace() {
    const ctx = this.ctx;
    // brasa grave acolhedora
    const bed = ctx.createBufferSource();
    bed.buffer = this.brownNoise();
    bed.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 240;
    const g = ctx.createGain();
    g.gain.value = 0.32;
    bed.connect(lp);
    lp.connect(g);
    g.connect(this.warmBus);

    // vento baixo na lareira
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.11;
    const lg = ctx.createGain();
    lg.gain.value = 45;
    lfo.connect(lg);
    lg.connect(lp.frequency);

    bed.start();
    lfo.start();
    this.nodes.push(bed, lp, g, lfo, lg);

    // estalidos macios de madeira
    const crackle = () => {
      if (!this.playing) return;
      try {
        const src = ctx.createBufferSource();
        src.buffer = this.pinkNoise();
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 850 + Math.random() * 1100;
        bp.Q.value = 2.0;
        const cg = ctx.createGain();
        const peak = 0.03 + Math.random() * 0.055;
        const t = ctx.currentTime;
        cg.gain.setValueAtTime(0.0001, t);
        cg.gain.linearRampToValueAtTime(peak, t + 0.004);
        cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.045 + Math.random() * 0.04);
        src.connect(bp);
        bp.connect(cg);
        cg.connect(this.warmBus);
        src.start(t, Math.random() * 2.5, 0.11);
        this.timers.push(setTimeout(() => { try { src.disconnect(); bp.disconnect(); cg.disconnect(); } catch (e) {} }, 320));
      } catch (e) {}
      this.timers.push(setTimeout(crackle, 140 + Math.random() * 720));
    };
    crackle();
  },

  buildNight() {
    this.buildRain(0.55);
    this.buildNightChords({ noVinyl: true });
  },

  /* Toques macios dos dedos em ritmo humano (ganho equilibrado com Chuva/Oceano) */
  buildTyping() {
    const ctx = this.ctx;
    const bus = this.presenceBus || this.warmBus;
    const room = ctx.createBufferSource();
    room.buffer = this.brownNoise();
    room.loop = true;
    const roomLp = ctx.createBiquadFilter();
    roomLp.type = 'lowpass';
    roomLp.frequency.value = 210;
    const roomG = ctx.createGain();
    roomG.gain.value = 0.032;
    room.connect(roomLp);
    roomLp.connect(roomG);
    roomG.connect(this.warmBus);
    room.start();
    this.nodes.push(room, roomLp, roomG);

    const triggerTap = (kind) => {
      if (!this.playing) return;
      try {
        const t = ctx.currentTime + 0.005;
        const isSpace = kind === 'space';
        const isEnter = kind === 'enter';

        // 1. Batida macia da polpa do dedo / feltro
        const osc = ctx.createOscillator();
        osc.type = isSpace ? 'sine' : 'triangle';
        const startHz = isSpace ? 138 + Math.random() * 14 : (isEnter ? 156 + Math.random() * 18 : 185 + Math.random() * 48);
        const endHz = isSpace ? 56 : (isEnter ? 66 : 82 + Math.random() * 16);
        osc.frequency.setValueAtTime(startHz, t);
        osc.frequency.exponentialRampToValueAtTime(endHz, t + 0.026);

        const og = ctx.createGain();
        const thockGain = isSpace ? 0.28 : (isEnter ? 0.25 : 0.17 + Math.random() * 0.08);
        og.gain.setValueAtTime(0.0001, t);
        og.gain.linearRampToValueAtTime(thockGain, t + 0.003);
        og.gain.exponentialRampToValueAtTime(0.0001, t + (isSpace ? 0.056 : 0.044));
        osc.connect(og);
        og.connect(bus);
        osc.start(t);
        osc.stop(t + 0.07);

        // 2. Contato tátil suave
        const clickSrc = ctx.createBufferSource();
        clickSrc.buffer = this.pinkNoise();
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = isSpace ? 1150 + Math.random() * 280 : (1650 + Math.random() * 820);
        bp.Q.value = 1.4;
        const cg = ctx.createGain();
        const clickPeak = isSpace ? 0.17 : 0.13 + Math.random() * 0.08;
        cg.gain.setValueAtTime(0.0001, t);
        cg.gain.linearRampToValueAtTime(clickPeak, t + 0.002);
        cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.022);
        clickSrc.connect(bp);
        bp.connect(cg);
        cg.connect(bus);
        clickSrc.start(t, Math.random() * 2.5, 0.036);

        this.timers.push(setTimeout(() => {
          try {
            osc.disconnect(); og.disconnect();
            clickSrc.disconnect(); bp.disconnect(); cg.disconnect();
          } catch (e) {}
        }, 170));
      } catch (e) {}
    };

    let burstLeft = 5 + Math.floor(Math.random() * 8);
    let sinceSpace = 0;

    const scheduleNext = () => {
      if (!this.playing) return;
      let delayMs = 95 + Math.random() * 105;
      let kind = 'char';

      if (burstLeft <= 0) {
        kind = Math.random() < 0.28 ? 'enter' : 'space';
        burstLeft = 4 + Math.floor(Math.random() * 10);
        sinceSpace = 0;
        delayMs = 340 + Math.random() * 780;
      } else {
        sinceSpace++;
        burstLeft--;
        if (sinceSpace >= 4 && Math.random() < 0.24) {
          kind = 'space';
          sinceSpace = 0;
          delayMs = 130 + Math.random() * 120;
        }
      }

      triggerTap(kind);
      this.timers.push(setTimeout(scheduleNext, delayMs));
    };
    this.timers.push(setTimeout(scheduleNext, 110));
  },

  /* Teclas mecânicas nítidas (switch click + bottom-out + retorno da tecla) */
  buildMechanicalKeys() {
    const ctx = this.ctx;
    const bus = this.presenceBus || this.warmBus;

    const room = ctx.createBufferSource();
    room.buffer = this.brownNoise();
    room.loop = true;
    const roomLp = ctx.createBiquadFilter();
    roomLp.type = 'lowpass';
    roomLp.frequency.value = 190;
    const roomG = ctx.createGain();
    roomG.gain.value = 0.024;
    room.connect(roomLp);
    roomLp.connect(roomG);
    roomG.connect(this.warmBus);
    room.start();
    this.nodes.push(room, roomLp, roomG);

    const triggerMechKey = (kind) => {
      if (!this.playing) return;
      try {
        const t = ctx.currentTime + 0.005;
        const isSpace = kind === 'space';
        const isEnter = kind === 'enter';

        // 1. Clique nítido do switch mecânico na descida
        const clickSrc = ctx.createBufferSource();
        clickSrc.buffer = this.pinkNoise();
        const hp = ctx.createBiquadFilter();
        hp.type = 'bandpass';
        hp.frequency.value = isSpace ? 2100 + Math.random() * 450 : (2900 + Math.random() * 1100);
        hp.Q.value = 1.9;
        const cg = ctx.createGain();
        const clickPeak = isSpace ? 0.22 : (isEnter ? 0.24 : 0.20 + Math.random() * 0.09);
        cg.gain.setValueAtTime(0.0001, t);
        cg.gain.linearRampToValueAtTime(clickPeak, t + 0.0014);
        cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.015);
        clickSrc.connect(hp);
        hp.connect(cg);
        cg.connect(bus);
        clickSrc.start(t, Math.random() * 2.5, 0.028);

        // 2. Impacto da keycap no plate ("clack / thock" definido)
        const osc = ctx.createOscillator();
        osc.type = isSpace ? 'triangle' : 'square';
        const startHz = isSpace ? 155 + Math.random() * 20 : (isEnter ? 210 + Math.random() * 30 : 285 + Math.random() * 85);
        const endHz = isSpace ? 68 : (isEnter ? 86 : 118 + Math.random() * 28);
        osc.frequency.setValueAtTime(startHz, t + 0.004);
        osc.frequency.exponentialRampToValueAtTime(endHz, t + 0.022);

        const bodyLp = ctx.createBiquadFilter();
        bodyLp.type = 'lowpass';
        bodyLp.frequency.value = isSpace ? 680 : 1280;
        const og = ctx.createGain();
        const bodyPeak = isSpace ? 0.22 : (isEnter ? 0.20 : 0.14 + Math.random() * 0.06);
        og.gain.setValueAtTime(0.0001, t + 0.003);
        og.gain.linearRampToValueAtTime(bodyPeak, t + 0.006);
        og.gain.exponentialRampToValueAtTime(0.0001, t + (isSpace ? 0.048 : 0.032));
        osc.connect(bodyLp);
        bodyLp.connect(og);
        og.connect(bus);
        osc.start(t + 0.003);
        osc.stop(t + 0.06);

        // 3. Retorno sutil da mola (upstroke) ~35-55ms depois
        const upDelay = 0.036 + Math.random() * 0.022;
        const upSrc = ctx.createBufferSource();
        upSrc.buffer = this.pinkNoise();
        const upBp = ctx.createBiquadFilter();
        upBp.type = 'bandpass';
        upBp.frequency.value = isSpace ? 1750 : 2450 + Math.random() * 700;
        upBp.Q.value = 1.6;
        const ug = ctx.createGain();
        const upPeak = isSpace ? 0.10 : 0.085 + Math.random() * 0.04;
        ug.gain.setValueAtTime(0.0001, t + upDelay);
        ug.gain.linearRampToValueAtTime(upPeak, t + upDelay + 0.0018);
        ug.gain.exponentialRampToValueAtTime(0.0001, t + upDelay + 0.014);
        upSrc.connect(upBp);
        upBp.connect(ug);
        ug.connect(bus);
        upSrc.start(t + upDelay, Math.random() * 2.5, 0.024);

        this.timers.push(setTimeout(() => {
          try {
            clickSrc.disconnect(); hp.disconnect(); cg.disconnect();
            osc.disconnect(); bodyLp.disconnect(); og.disconnect();
            upSrc.disconnect(); upBp.disconnect(); ug.disconnect();
          } catch (e) {}
        }, 210));
      } catch (e) {}
    };

    let burstLeft = 6 + Math.floor(Math.random() * 9);
    let sinceSpace = 0;

    const scheduleNext = () => {
      if (!this.playing) return;
      let delayMs = 82 + Math.random() * 92;
      let kind = 'char';

      if (burstLeft <= 0) {
        kind = Math.random() < 0.32 ? 'enter' : 'space';
        burstLeft = 5 + Math.floor(Math.random() * 10);
        sinceSpace = 0;
        delayMs = 280 + Math.random() * 640;
      } else {
        sinceSpace++;
        burstLeft--;
        if (sinceSpace >= 4 && Math.random() < 0.25) {
          kind = 'space';
          sinceSpace = 0;
          delayMs = 115 + Math.random() * 105;
        }
      }

      triggerMechKey(kind);
      this.timers.push(setTimeout(scheduleNext, delayMs));
    };
    this.timers.push(setTimeout(scheduleNext, 100));
  },

  /* Escrita no papel (traços de lápis/caneta + farfalhar, volume presente e nítido) */
  buildWriting() {
    const ctx = this.ctx;
    const bus = this.presenceBus || this.warmBus;
    const desk = ctx.createBufferSource();
    desk.buffer = this.brownNoise();
    desk.loop = true;
    const deskLp = ctx.createBiquadFilter();
    deskLp.type = 'lowpass';
    deskLp.frequency.value = 300;
    const deskG = ctx.createGain();
    deskG.gain.value = 0.048;
    desk.connect(deskLp);
    deskLp.connect(deskG);
    deskG.connect(this.warmBus);
    desk.start();
    this.nodes.push(desk, deskLp, deskG);

    const triggerStroke = (kind) => {
      if (!this.playing) return;
      try {
        const t = ctx.currentTime + 0.008;
        const isRustle = kind === 'rustle';
        const isSweep = kind === 'sweep';
        const dur = isRustle ? 0.36 : (isSweep ? 0.16 + Math.random() * 0.11 : 0.055 + Math.random() * 0.08);

        const src = ctx.createBufferSource();
        src.buffer = this.pinkNoise();

        // Grão principal do grafite/caneta no papel
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = isRustle
          ? 920 + Math.random() * 280
          : (1850 + Math.random() * 980);
        bp.Q.value = isRustle ? 0.85 : (1.35 + Math.random() * 0.85);

        // Corpo amadeirado da mesa durante o traço
        const lpBody = ctx.createBiquadFilter();
        lpBody.type = 'lowpass';
        lpBody.frequency.value = 520;

        const gMain = ctx.createGain();
        const peak = isRustle ? 0.16 : (isSweep ? 0.24 : 0.18 + Math.random() * 0.11);
        gMain.gain.setValueAtTime(0.0001, t);
        gMain.gain.linearRampToValueAtTime(peak, t + dur * 0.26);
        gMain.gain.linearRampToValueAtTime(peak * 0.72, t + dur * 0.7);
        gMain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

        const gBody = ctx.createGain();
        gBody.gain.setValueAtTime(0.0001, t);
        gBody.gain.linearRampToValueAtTime(peak * 0.42, t + dur * 0.32);
        gBody.gain.exponentialRampToValueAtTime(0.0001, t + dur);

        src.connect(bp);
        bp.connect(gMain);
        gMain.connect(bus);

        src.connect(lpBody);
        lpBody.connect(gBody);
        gBody.connect(this.warmBus);

        src.start(t, Math.random() * 2.4, dur + 0.03);

        this.timers.push(setTimeout(() => {
          try {
            src.disconnect(); bp.disconnect(); lpBody.disconnect();
            gMain.disconnect(); gBody.disconnect();
          } catch (e) {}
        }, Math.round((dur + 0.18) * 1000)));
      } catch (e) {}
    };

    let strokesLeft = 4 + Math.floor(Math.random() * 6);
    let wordsDone = 0;

    const scheduleNext = () => {
      if (!this.playing) return;
      let delayMs = 78 + Math.random() * 82;
      let kind = 'stroke';

      if (strokesLeft <= 0) {
        wordsDone++;
        strokesLeft = 3 + Math.floor(Math.random() * 7);
        if (wordsDone % 7 === 0) {
          kind = 'rustle';
          delayMs = 680 + Math.random() * 720;
        } else {
          kind = Math.random() < 0.25 ? 'sweep' : 'stroke';
          delayMs = 220 + Math.random() * 320;
        }
      } else {
        strokesLeft--;
        if (Math.random() < 0.16) kind = 'sweep';
      }

      triggerStroke(kind);
      this.timers.push(setTimeout(scheduleNext, delayMs));
    };
    this.timers.push(setTimeout(scheduleNext, 130));
  },

  /* ---------- efeitos pontuais suavizados ---------- */
  chime() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const base = audioGainCurve(Store.state.music.volume);
    const vol = Math.min(0.28, Math.max(0.05, base * 1.35));
    [523.25, 659.25].forEach((f, i) => {
      const t = ctx.currentTime + i * 0.22;
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.05);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + 1.15);
      setTimeout(() => { try { o.disconnect(); g.disconnect(); } catch (e) {} }, 1400);
    });
  },

  pop() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const base = audioGainCurve(Store.state.music.volume);
    const vol = Math.min(0.13, Math.max(0.035, base * 0.75));
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(480, t);
    o.frequency.exponentialRampToValueAtTime(690, t + 0.08);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.18);
    setTimeout(() => { try { o.disconnect(); g.disconnect(); } catch (e) {} }, 380);
  },

  syncVisuals() {
    if (typeof Themes !== 'undefined' && typeof Themes.apply === 'function') Themes.apply({ fade: true });
    if (typeof Motion !== 'undefined' && typeof Motion.readState === 'function') Motion.readState();
  },

  updateUI() {
    if (typeof HomePage !== 'undefined') HomePage.updateMusicChip();
    if (typeof Panel !== 'undefined' && typeof Panel.syncMusicUI === 'function') Panel.syncMusicUI();
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CUSTOM_THEMATIC_TRACKS,
    TRACK_LABELS,
    getTrackLabel,
    getThematicTrack,
    isThematicTrack,
    buildTrackCoverSvgDataUrl,
    audioGainCurve,
    audioHtmlVolume
  };
}
