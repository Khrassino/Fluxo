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
          { id: 'quote', on: true, idle: false },
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

  _restoring: false,

  save() {
    if (this._restoring) return;
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

/* ============ backup completo (estado + área de trabalho + arquivos) ============ */
function backupIsPlainObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof ArrayBuffer) && !ArrayBuffer.isView(v);
}

function backupArrayBufferToBase64(buf) {
  if (!buf) return '';
  let bytes;
  if (buf instanceof ArrayBuffer) {
    bytes = new Uint8Array(buf);
  } else if (ArrayBuffer.isView(buf)) {
    bytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  } else {
    return '';
  }
  if (typeof btoa !== 'function') {
    if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
    return '';
  }
  const chunk = 0x8000;
  let bin = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function backupBase64ToArrayBuffer(b64) {
  const clean = String(b64 || '').trim();
  if (!clean) return new ArrayBuffer(0);
  if (typeof atob !== 'function') {
    if (typeof Buffer !== 'undefined') {
      const buf = Buffer.from(clean, 'base64');
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    }
    return new ArrayBuffer(0);
  }
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

function encodeBackupValue(val) {
  if (val instanceof ArrayBuffer || ArrayBuffer.isView(val)) {
    return { __fluxoType: 'arraybuffer', base64: backupArrayBufferToBase64(val) };
  }
  return val;
}

async function encodeBackupValueAsync(val) {
  if (val instanceof ArrayBuffer || ArrayBuffer.isView(val)) {
    return { __fluxoType: 'arraybuffer', base64: backupArrayBufferToBase64(val) };
  }
  if (typeof Blob !== 'undefined' && val instanceof Blob) {
    const ab = await val.arrayBuffer();
    return { __fluxoType: 'blob', type: val.type || '', base64: backupArrayBufferToBase64(ab) };
  }
  return val;
}

function decodeBackupValue(val) {
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    if (val.__fluxoType === 'arraybuffer' && typeof val.base64 === 'string') {
      return backupBase64ToArrayBuffer(val.base64);
    }
    if (val.__fluxoType === 'blob' && typeof val.base64 === 'string') {
      const ab = backupBase64ToArrayBuffer(val.base64);
      return typeof Blob !== 'undefined' ? new Blob([ab], { type: val.type || '' }) : ab;
    }
  }
  return val;
}

function encodeBackupMap(obj) {
  const out = {};
  if (!backupIsPlainObject(obj)) return out;
  for (const [k, v] of Object.entries(obj)) {
    out[k] = encodeBackupValue(v);
  }
  return out;
}

async function encodeBackupMapAsync(obj) {
  const out = {};
  if (!backupIsPlainObject(obj)) return out;
  for (const [k, v] of Object.entries(obj)) {
    out[k] = await encodeBackupValueAsync(v);
  }
  return out;
}

function buildFullBackupPayload(parts) {
  const p = parts || {};
  return {
    app: 'Fluxo',
    version: 2,
    exportedAt: p.exportedAt || new Date().toISOString(),
    state: p.state !== undefined ? p.state : null,
    workspace: {
      meta: backupIsPlainObject(p.wsMeta) ? p.wsMeta : {},
      files: encodeBackupMap(p.wsFiles),
      localStorage: backupIsPlainObject(p.wsLocalStorage) ? p.wsLocalStorage : {}
    },
    files: {
      idb: encodeBackupMap(p.fileIdb),
      localStorage: backupIsPlainObject(p.fileLocalStorage) ? p.fileLocalStorage : {}
    }
  };
}

function parseAndValidateBackup(rawTextOrObj) {
  let obj = rawTextOrObj;
  if (typeof rawTextOrObj === 'string') {
    try {
      obj = JSON.parse(rawTextOrObj);
    } catch (e) {
      return { ok: false, errorKey: 'panel.general.importInvalid' };
    }
  }
  if (!backupIsPlainObject(obj)) {
    return { ok: false, errorKey: 'panel.general.importInvalid' };
  }
  if (obj.app !== 'Fluxo') {
    return { ok: false, errorKey: 'panel.general.importNotFluxo' };
  }

  const hasState = obj.state !== undefined;
  const hasWorkspace = obj.workspace !== undefined;
  const hasFiles = obj.files !== undefined;
  if (!hasState && !hasWorkspace && !hasFiles) {
    return { ok: false, errorKey: 'panel.general.importInvalid' };
  }
  if (hasState && !backupIsPlainObject(obj.state)) {
    return { ok: false, errorKey: 'panel.general.importInvalid' };
  }
  if (hasWorkspace && !backupIsPlainObject(obj.workspace)) {
    return { ok: false, errorKey: 'panel.general.importInvalid' };
  }
  if (hasFiles && !backupIsPlainObject(obj.files)) {
    return { ok: false, errorKey: 'panel.general.importInvalid' };
  }

  let ws = null;
  if (hasWorkspace) {
    const w = obj.workspace;
    if ((w.meta !== undefined && !backupIsPlainObject(w.meta)) ||
        (w.files !== undefined && !backupIsPlainObject(w.files)) ||
        (w.localStorage !== undefined && !backupIsPlainObject(w.localStorage))) {
      return { ok: false, errorKey: 'panel.general.importInvalid' };
    }
    ws = {
      meta: w.meta || {},
      files: w.files || {},
      localStorage: w.localStorage || {}
    };
  }

  let files = null;
  if (hasFiles) {
    const f = obj.files;
    if ((f.idb !== undefined && !backupIsPlainObject(f.idb)) ||
        (f.localStorage !== undefined && !backupIsPlainObject(f.localStorage))) {
      return { ok: false, errorKey: 'panel.general.importInvalid' };
    }
    files = {
      idb: f.idb || {},
      localStorage: f.localStorage || {}
    };
  }

  const isLegacyStateOnly = hasState && !hasWorkspace && !hasFiles;
  return {
    ok: true,
    isLegacyStateOnly,
    version: Number(obj.version) || 1,
    exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : null,
    state: hasState ? obj.state : null,
    workspace: ws,
    files
  };
}

function backupOpenIdb(name, onUpgrade) {
  return new Promise((resolve) => {
    let req;
    try {
      req = indexedDB.open(name, 1);
    } catch (e) { return resolve(null); }
    if (!req) return resolve(null);
    let settled = false;
    const finish = (db) => {
      if (settled) return;
      settled = true;
      resolve(db);
    };
    req.onupgradeneeded = () => {
      if (typeof onUpgrade === 'function') onUpgrade(req.result);
    };
    req.onsuccess = () => finish(req.result);
    req.onerror = () => finish(null);
    setTimeout(() => finish(null), 1800);
  });
}

function backupDumpStore(db, storeName) {
  if (!db || !db.objectStoreNames || !db.objectStoreNames.contains(storeName)) {
    return Promise.resolve({});
  }
  return new Promise((resolve) => {
    try {
      const out = {};
      const tx = db.transaction(storeName, 'readonly');
      const rq = tx.objectStore(storeName).openCursor();
      rq.onsuccess = (ev) => {
        const cur = ev.target && ev.target.result;
        if (cur) {
          out[String(cur.key)] = cur.value;
          cur.continue();
        } else {
          resolve(out);
        }
      };
      rq.onerror = () => resolve(out);
    } catch (e) { resolve({}); }
  });
}

function backupReplaceStore(db, storeName, entriesObj, transformVal) {
  if (!db || !db.objectStoreNames || !db.objectStoreNames.contains(storeName)) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();
      if (backupIsPlainObject(entriesObj)) {
        for (const [k, v] of Object.entries(entriesObj)) {
          const val = transformVal ? transformVal(v) : v;
          if (val !== undefined) store.put(val, k);
        }
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('idb'));
      tx.onabort = () => reject(tx.error || new Error('idb-abort'));
    } catch (e) { reject(e); }
  });
}

function backupCollectLocalStorageByPrefix(prefix) {
  const out = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        const v = localStorage.getItem(k);
        if (v !== null) out[k] = v;
      }
    }
  } catch (e) { /* ignora */ }
  return out;
}

function backupReplaceLocalStorageByPrefix(prefix, entriesObj) {
  try {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) toRemove.push(k);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
    if (backupIsPlainObject(entriesObj)) {
      for (const [k, v] of Object.entries(entriesObj)) {
        if (k.startsWith(prefix) && typeof v === 'string') {
          localStorage.setItem(k, v);
        }
      }
    }
  } catch (e) { /* ignora */ }
}

const AppBackup = {
  async collect() {
    Store.save();
    if (typeof Workspace !== 'undefined' && Workspace.loaded && typeof Workspace.flushSave === 'function') {
      try { await Workspace.flushSave(); } catch (e) { /* ignora */ }
    }

    let state = Store.state;
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) state = JSON.parse(raw);
    } catch (e) { /* usa Store.state */ }

    if (!Files.db) await Files.init();
    const filesDb = Files.db || await backupOpenIdb('fluxo-files', (db) => {
      if (!db.objectStoreNames.contains('files')) db.createObjectStore('files');
    });

    const wsDb = typeof WorkspaceDB !== 'undefined'
      ? await WorkspaceDB.open()
      : await backupOpenIdb('fluxo-workspace', (db) => {
          if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
          if (!db.objectStoreNames.contains('files')) db.createObjectStore('files');
        });

    const [wsMeta, rawWsFiles, rawFileIdb] = await Promise.all([
      backupDumpStore(wsDb, 'meta'),
      backupDumpStore(wsDb, 'files'),
      backupDumpStore(filesDb, 'files')
    ]);

    const [wsFiles, fileIdb] = await Promise.all([
      encodeBackupMapAsync(rawWsFiles),
      encodeBackupMapAsync(rawFileIdb)
    ]);

    const wsLocalStorage = backupCollectLocalStorageByPrefix('fluxo-ws-');
    const fileLocalStorage = backupCollectLocalStorageByPrefix('fluxo-file-');

    return buildFullBackupPayload({
      state,
      wsMeta,
      wsFiles,
      wsLocalStorage,
      fileIdb,
      fileLocalStorage
    });
  },

  async restore(parsed) {
    if (!parsed || !parsed.ok) throw new Error('invalid-backup');

    if (parsed.isLegacyStateOnly) {
      if (typeof Workspace !== 'undefined' && Workspace.loaded && typeof Workspace.flushSave === 'function') {
        try { await Workspace.flushSave(); } catch (e) { /* ignora */ }
      }
      Store._restoring = true;
      if (typeof Usage !== 'undefined') Usage.dirty = false;
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(parsed.state));
      } catch (e) {
        Store._restoring = false;
        throw e;
      }
      return;
    }

    if (typeof Workspace !== 'undefined') {
      clearTimeout(Workspace.saveTimer);
      Workspace.saveTimer = null;
      Workspace.loaded = false;
    }
    Store._restoring = true;
    if (typeof Usage !== 'undefined') Usage.dirty = false;

    try {
      if (parsed.state) localStorage.setItem(STORE_KEY, JSON.stringify(parsed.state));
      else localStorage.removeItem(STORE_KEY);

      const wsData = parsed.workspace || { meta: {}, files: {}, localStorage: {} };
      const fileData = parsed.files || { idb: {}, localStorage: {} };

      backupReplaceLocalStorageByPrefix('fluxo-ws-', wsData.localStorage);
      backupReplaceLocalStorageByPrefix('fluxo-file-', fileData.localStorage);

      const wsDb = typeof WorkspaceDB !== 'undefined'
        ? await WorkspaceDB.open()
        : await backupOpenIdb('fluxo-workspace', (db) => {
            if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
            if (!db.objectStoreNames.contains('files')) db.createObjectStore('files');
          });
      if (wsDb) {
        await backupReplaceStore(wsDb, 'meta', wsData.meta || {});
        await backupReplaceStore(wsDb, 'files', wsData.files || {}, decodeBackupValue);
      }

      if (!Files.db) await Files.init();
      const filesDb = Files.db || await backupOpenIdb('fluxo-files', (db) => {
        if (!db.objectStoreNames.contains('files')) db.createObjectStore('files');
      });
      if (filesDb) {
        await backupReplaceStore(filesDb, 'files', fileData.idb || {}, decodeBackupValue);
      } else if (backupIsPlainObject(fileData.idb)) {
        for (const [k, v] of Object.entries(fileData.idb)) {
          const decoded = decodeBackupValue(v);
          if (typeof decoded === 'string') {
            try { localStorage.setItem('fluxo-file-' + k, decoded); } catch (e) { /* ignora */ }
          }
        }
      }
    } catch (e) {
      Store._restoring = false;
      throw e;
    }
  }
};
