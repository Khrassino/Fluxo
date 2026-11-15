'use strict';
/* ============ audio.js — trilhas calmas e som regulado (Web Audio) ============ */
const TRACK_LABELS = {
  none: '—',
  rain: 'Chuva',
  ocean: 'Oceano',
  pad: 'Ambiente',
  lofi: 'Lo-fi',
  fireplace: 'Lareira',
  night: 'Noite calma',
  custom: 'Sua música'
};

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
  bgm: null,
  nodes: [],
  timers: [],
  intervals: [],
  pinkBuf: null,
  brownBuf: null,
  playing: false,

  init() {
    this.bgm = typeof $ === 'function' ? $('#bgm') : null;
    if (this.bgm) this.bgm.volume = audioHtmlVolume(Store.state.music.volume);
  },

  ensureCtx() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!this.ctx) {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = audioGainCurve(Store.state.music.volume);

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -24;
      this.compressor.knee.value = 18;
      this.compressor.ratio.value = 4;
      this.compressor.attack.value = 0.04;
      this.compressor.release.value = 0.25;

      this.warmBus = this.ctx.createBiquadFilter();
      this.warmBus.type = 'lowpass';
      this.warmBus.frequency.value = 4200;
      this.warmBus.Q.value = 0.45;

      this.warmBus.connect(this.compressor);
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

  setCustomSource(url) { if (this.bgm) this.bgm.src = url; },

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
    if (!track || track === 'none') { Store.save(); this.updateUI(); return; }

    if (track === 'custom') {
      if (!this.bgm || !this.bgm.src) { toast('Envie um arquivo de música no painel', 'music'); this.updateUI(); return; }
      this.bgm.volume = audioHtmlVolume(Store.state.music.volume);
      this.bgm.play().catch(() => {});
      this.playing = true;
      Store.save(); this.updateUI();
      return;
    }

    const ctx = this.ensureCtx();
    if (!ctx) { toast('Áudio não suportado neste navegador', 'close'); return; }
    try {
      if (track === 'rain') this.buildRain(1.0);
      else if (track === 'ocean') this.buildOcean();
      else if (track === 'pad') this.buildPad();
      else if (track === 'lofi') this.buildLofi();
      else if (track === 'fireplace') this.buildFireplace();
      else if (track === 'night') this.buildNight();
      else this.buildRain(1.0);
      this.playing = true;
    } catch (e) { /* falha silenciosa */ }
    Store.save();
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
    if (this.bgm) this.bgm.pause();
    if (!silent) {
      this.playing = false;
      this.updateUI();
    }
  },

  toggle() {
    if (this.playing) this.stop();
    else if (Store.state.music.track === 'none') this.play('lofi');
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

  buildLofi(opts) {
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
    this.buildLofi({ noVinyl: true });
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

  updateUI() {
    if (typeof HomePage !== 'undefined') HomePage.updateMusicChip();
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TRACK_LABELS, audioGainCurve, audioHtmlVolume };
}
