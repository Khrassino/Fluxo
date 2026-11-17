'use strict';
/* ============ storage.js — estado + persistência ============ */
const STORE_KEY = 'fluxo-state-v1';

const Store = {
  state: null,

  defaults() {
    return {
      v: 1,
      lang: 'en',                    // en | pt  (padrão: inglês; quem escolheu 'pt' mantém)
      route: 'home',
      appearance: {
        theme: 'aurora',
        wallpaper: 'aurora',         // id do preset | 'custom' | 'nenhum'
        uiFont: 'inter',             // fonte da interface
        custom: {                    // tema personalizado
          bg: '#0a0e1e',
          accent: '#8fa2ff',
          accent2: '#5fe3c4',
          text: '#edf1ff',
          glass: 55                  // opacidade do vidro (0-100)
        }
      },
      dock: {
        anchor: 'bc',                // bc | bl | br | ml | mr | tc | tl | tr
        hover: false                 // expandir ao passar o mouse
      },
      idle: {
        timeout: 60                  // segundos sem atividade | 0 = desligado
      },
      music: {
        track: 'none',               // none | flowers | march | rain | ocean | pad | fireplace | night | typing | keys | writing | custom
        volume: 0.35,
        dynamicTheme: true,          // aplica paleta da capa enquanto toca
        visualEffects: true,         // animações visuais da música
        sceneElements: true,         // ramos/flores (Flowers) e cercas de trincheira (March)
        sceneParticles: true,        // pétalas / partículas de fogo
        sceneInteractive: true,      // interação com o mouse
        sceneIntensity: 65           // 0-100
      },
      motion: {
        enabled: true,
        mode: 'depth',               // shift | depth | tilt | sway | drift
        intensity: 55,               // 0-100
        smoothness: 65               // 0-100
      },
      effects: {
        level: 'full'                // full | reduced | off
      },
      particles: {
        enabled: true,
        style: 'dust',               // dust | rain (gotas) | waves (ondas) | wet | snow | keys
        amount: 55,                  // 0-100
        interactive: true            // reage ao mouse e teclado
      },
      timer: {
        tab: 'countdown',            // countdown | stopwatch
        view: 'classic',             // classic | focus (só o relógio)
        preset: 'focus',             // focus | short | long | custom
        durations: { focus: 25, short: 5, long: 15, custom: 10 },
        font: 'inter',
        size: 84,
        weight: 300,                 // 200-800
        tracking: 2,                 // espaçamento em centésimos de em
        tint: '',                    // cor própria ('' = cor do tema)
        effectGlow: true,            // neon / brilho
        glow: 45,                    // 0 = sem brilho
        effectShadow: false,         // sombra projetada
        effectOutline: false,        // contorno vazado
        effectPulse: false,          // pulsação suave
        ring: true,
        ringWidth: 5,
        ringStyle: 'solid',          // solid | gradient | dashed
        backdrop: 'none',            // none | glass | solid | halo
        digitAnim: 'none',           // none | flip
        blink: true,
        label: true,
        autoCycle: false,            // alterna foco / pausa automaticamente
        cycle: 4,                    // focos antes da pausa longa
        cycleCount: 0,
        dim: 60,                     // % de escurecimento do fundo
        blur: true,
        sound: true,
        running: false,
        endsAt: null,                // p/ contagem regressiva em execução
        remaining: null,             // segundos restantes quando pausado
        startedAt: null,             // p/ cronômetro em execução
        baseElapsed: 0,              // segundos acumulados do cronômetro
        idle: {                      // o que continua visível no modo calmo
          ring: true,
          label: false,
          tabs: false,
          presets: false,
          sessions: false,
          controls: false,
          hint: false
        }
      },
      home: {
        layout: [                    // ordem dos elementos da tela inicial
          { id: 'greet', on: true, idle: false },
          { id: 'clock', on: true, locked: true, idle: true }, // relógio é fixo
          { id: 'date',  on: true, idle: false },
          { id: 'chips', on: true, idle: false }
        ],
        chips: [                     // atalhos personalizáveis da tela inicial
          { id: 'focus',     on: true },
          { id: 'summary',   on: true },
          { id: 'tasks',     on: true },
          { id: 'streak',    on: true },
          { id: 'music',     on: true },
          { id: 'stopwatch', on: false },
          { id: 'newTask',   on: false },
          { id: 'tracker',   on: false },
          { id: 'panel',     on: false }
        ]
      },
      tasks: {
        accent: '',                  // '' = usar cor do tema
        cardStyle: 'glass',          // glass | solid | minimal
        density: 'comfortable',      // comfortable | compact
        checkShape: 'rounded',       // rounded | circle | square
        anim: 'slide',               // slide | fade | pop
        sort: 'recent',              // recent | oldest | due | priority | alpha
        doneLast: true,
        popSound: true,
        showProgress: false,
        showSearch: true,
        showComposeOpts: true,
        showExtraControls: true,
        showMeta: true,
        showCreated: false,
        highlightOverdue: true,
        defaultPriority: 'none',
        defaultDue: 'none',
        idle: {
          summary: true,
          composer: false,
          controls: false
        },
        items: []                    // { id, text, done, createdAt, doneAt, dueDate, priority, tag, notes, subtasks }
      },
      tracker: {
        usageByDay: {},              // 'YYYY-MM-DD' -> segundos
        focusByDay: {},              // 'YYYY-MM-DD' -> sessões de foco
        tasksCompleted: 0,
        chart: 'bars',               // bars | line | squares | ring
        heatCell: 18,                // tamanho das células dos heatmaps (px)
        period: 7,                   // 7 | 14 | 30 | 90 | 365 dias
        yearOffset: 0,               // 0 = ano atual (usado no período de 1 ano)
        chart2: {                    // segundo gráfico personalizável
          on: false,
          chart: 'ring',
          period: 365,
          yearOffset: 0,
          metric: 'focus'            // focus | hours
        },
        goal: 2,                     // meta diária em horas
        goalStyle: 'bar',            // bar | ring | milestones
        widgets: [                   // cartões de estatísticas (até 8)
          { id: 'days',    on: true,  size: '1x' },
          { id: 'hours',   on: true,  size: '1x' },
          { id: 'tasks',   on: true,  size: '1x' },
          { id: 'focus',   on: true,  size: '1x' },
          { id: 'goal',    on: true,  size: '1x' },
          { id: 'avg',     on: false, size: '1x' },
          { id: 'pending', on: false, size: '1x' },
          { id: 'best',    on: false, size: '1x' }
        ],
        layout: [                    // ordem dos blocos da página
          { id: 'header', on: true },
          { id: 'stats',  on: true },
          { id: 'chart',  on: true },
          { id: 'chart2', on: false },
          { id: 'goal',   on: true }
        ]
      },
      meta: { firstDay: null, seenTip: false }
    };
  },

  load() {
    let raw = null;
    try { raw = localStorage.getItem(STORE_KEY); } catch (e) { /* ignora */ }
    this.fresh = !raw;
    const base = this.defaults();
    if (raw) {
      try {
        const data = JSON.parse(raw);
        this.state = deepMerge(base, data);
      } catch (e) { this.state = base; }
    } else {
      this.state = base;
    }
    // migrações / preenchimentos retrocompatíveis
    if (this.state) {
      if (!Array.isArray(this.state.home.chips)) this.state.home.chips = base.home.chips.slice();
      if (!Array.isArray(this.state.tracker.widgets)) this.state.tracker.widgets = base.tracker.widgets.slice();
      if (!this.state.tracker.chart2) this.state.tracker.chart2 = Object.assign({}, base.tracker.chart2);
      if (!this.state.tracker.goalStyle) this.state.tracker.goalStyle = 'bar';
      if (Array.isArray(this.state.tracker.layout) && !this.state.tracker.layout.some(x => x.id === 'chart2')) {
        const at = this.state.tracker.layout.findIndex(x => x.id === 'chart');
        if (at >= 0) this.state.tracker.layout.splice(at + 1, 0, { id: 'chart2', on: false });
        else this.state.tracker.layout.push({ id: 'chart2', on: false });
      }
      // o layout é a fonte de verdade para a presença do segundo gráfico
      if (Array.isArray(this.state.tracker.layout)) {
        const c2Item = this.state.tracker.layout.find(x => x.id === 'chart2');
        if (c2Item) this.state.tracker.chart2.on = c2Item.on !== false;
      }
      // estilos de partículas: o antigo "rain" (ondas) virou "waves" e o novo "rain" são gotas.
      // A conversão roda UMA vez (marca meta.fxStyleV); depois disso o usuário pode escolher Chuva.
      if (!this.state.meta) this.state.meta = { firstDay: null, seenTip: false };
      let migrated = false;
      if (this.fresh) {
        this.state.meta.fxStyleV = 1;
      } else if ((this.state.meta.fxStyleV || 0) < 1) {
        if (this.state.particles && this.state.particles.style === 'rain') this.state.particles.style = 'waves';
        this.state.meta.fxStyleV = 1;
        migrated = true;
      }
      const aliases = { water: 'wet', bubbles: 'waves', lake: 'waves', ripples: 'waves', drizzle: 'rain' };
      if (this.state.particles && aliases[this.state.particles.style]) {
        this.state.particles.style = aliases[this.state.particles.style];
      }
      const validStyles = ['dust', 'rain', 'waves', 'wet', 'snow', 'keys'];
      if (this.state.particles && !validStyles.includes(this.state.particles.style)) {
        this.state.particles.style = 'dust';
      }
      if (!this.state.music || typeof this.state.music !== 'object') {
        this.state.music = Object.assign({}, base.music);
      } else {
        if (this.state.music.track === 'lofi') {
          this.state.music.track = 'none';
          migrated = true;
        }
        this.state.music.dynamicTheme = this.state.music.dynamicTheme !== false;
        this.state.music.visualEffects = this.state.music.visualEffects !== false;
        this.state.music.sceneElements = this.state.music.sceneElements !== false;
        this.state.music.sceneParticles = this.state.music.sceneParticles !== false;
        this.state.music.sceneInteractive = this.state.music.sceneInteractive !== false;
        const scInt = Number(this.state.music.sceneIntensity);
        this.state.music.sceneIntensity = Number.isFinite(scInt) ? clamp(Math.round(scInt), 0, 100) : 65;
        const vol = Number(this.state.music.volume);
        this.state.music.volume = Number.isFinite(vol) ? clamp(vol, 0, 1) : 0.35;
      }
      if (!this.state.effects || !['full', 'reduced', 'off'].includes(this.state.effects.level)) {
        this.state.effects = { level: 'full' };
      }
      this.state.lang = this.state.lang === 'pt' ? 'pt' : 'en';
      if (!Number.isFinite(+this.state.tracker.heatCell)) this.state.tracker.heatCell = 18;
      this.state.tracker.heatCell = clamp(+this.state.tracker.heatCell, 10, 34);
      // ids antigos dos gráficos continuam válidos
      if (!['bars', 'line', 'squares', 'ring'].includes(this.state.tracker.chart)) {
        this.state.tracker.chart = 'bars';
      }
      if (typeof normalizeTasksConfig === 'function') {
        this.state.tasks = normalizeTasksConfig(this.state.tasks);
      }
      if (migrated) this.save();
    }
    return this.state;
  },

  save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(this.state)); }
    catch (e) {
      const msg = typeof tr === 'function' ? tr('storage.saveErr', 'Não foi possível salvar as configurações') : 'Não foi possível salvar as configurações';
      toast(msg, 'close');
    }
  }
};

function deepMerge(base, over) {
  if (over === null || over === undefined) return base;
  if (typeof base !== 'object' || Array.isArray(base) || base === null) return over;
  const out = {};
  for (const k of Object.keys(base)) out[k] = deepMerge(base[k], over[k]);
  for (const k of Object.keys(over)) if (!(k in out)) out[k] = over[k];
  return out;
}

/* ============ arquivos grandes (IndexedDB com fallback p/ localStorage) ============ */
const Files = {
  db: null,
  useIdb: false,

  init() {
    return new Promise((resolve) => {
      let req;
      try {
        req = indexedDB.open('fluxo-files', 1);
      } catch (e) { this.useIdb = false; return resolve(); }
      if (!req) { this.useIdb = false; return resolve(); }
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('files')) db.createObjectStore('files');
      };
      req.onsuccess = () => { this.db = req.result; this.useIdb = true; resolve(); };
      req.onerror = () => { this.useIdb = false; resolve(); };
      setTimeout(() => resolve(), 1500); // segurança
    });
  },

  put(key, dataUrl) {
    if (this.useIdb) {
      return new Promise((resolve, reject) => {
        try {
          const tx = this.db.transaction('files', 'readwrite');
          tx.objectStore('files').put(dataUrl, key);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(new Error('idb'));
        } catch (e) { reject(e); }
      });
    }
    // fallback: localStorage (com verificação de tamanho)
    return new Promise((resolve, reject) => {
      try {
        const k = 'fluxo-file-' + key;
        if ((dataUrl.length * 1.37) > 4200000) return reject(new Error('grande'));
        localStorage.setItem(k, dataUrl);
        resolve();
      } catch (e) { reject(e); }
    });
  },

  get(key) {
    if (this.useIdb) {
      return new Promise((resolve) => {
        try {
          const tx = this.db.transaction('files', 'readonly');
          const rq = tx.objectStore('files').get(key);
          rq.onsuccess = () => resolve(rq.result || null);
          rq.onerror = () => resolve(null);
        } catch (e) { resolve(null); }
      });
    }
    try { return Promise.resolve(localStorage.getItem('fluxo-file-' + key)); }
    catch (e) { return Promise.resolve(null); }
  },

  del(key) {
    if (this.useIdb) {
      try {
        const tx = this.db.transaction('files', 'readwrite');
        tx.objectStore('files').delete(key);
      } catch (e) { /* ignora */ }
    }
    try { localStorage.removeItem('fluxo-file-' + key); } catch (e) { /* ignora */ }
    return Promise.resolve();
  }
};

/* lê um File e devolve dataURL */
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
