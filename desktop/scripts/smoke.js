'use strict';
/* Teste de fumaça: só é carregado quando FLUXO_SMOKE=1 (ver main.js).
 * Imprime uma linha "SMOKE_RESULT {json}" e encerra o app com código 0 (ok) ou 1 (falha). */
const fs = require('fs');
const os = require('os');
const path = require('path');

const MODE = process.env.FLUXO_SMOKE_MODE || 'write'; // write | read
const SHOTS = process.env.FLUXO_SMOKE_SHOTS || ''; // pasta para capturas de tela (opcional)

const MIN_PDF =
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
  '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
  '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\n' +
  'trailer<</Root 1 0 R>>\n%%EOF';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = function smoke(win, app) {
  const wc = win.webContents;
  const result = { mode: MODE, checks: {}, consoleIssues: [], badRequests: [], failures: [] };
  const check = (name, ok, detail) => {
    result.checks[name] = { ok: !!ok, detail };
    if (!ok) result.failures.push(name);
  };

  // --- console e requisições ---
  wc.on('console-message', (event, level, message, line, sourceId) => {
    const lvl = event && typeof event === 'object' && 'level' in event ? event.level : level;
    const msg = event && typeof event === 'object' && 'message' in event ? event.message : message;
    const src = event && typeof event === 'object' && 'sourceId' in event ? event.sourceId : sourceId;
    if (lvl === 'warning' || lvl === 'error' || lvl === 2 || lvl === 3) {
      result.consoleIssues.push(String(msg).slice(0, 220) + ' @' + String(src).slice(-60));
    }
  });
  const ses = wc.session;
  ses.webRequest.onCompleted((d) => {
    if (d.statusCode >= 400) result.badRequests.push(d.statusCode + ' ' + d.url);
  });
  ses.webRequest.onErrorOccurred((d) => {
    result.badRequests.push('ERR ' + d.error + ' ' + d.url);
  });

  // --- download (exportação de backup) ---
  const dlDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fluxo-dl-'));
  let downloaded = null;
  ses.on('will-download', (_e, item) => {
    const target = path.join(dlDir, item.getFilename());
    item.setSavePath(target);
    item.once('done', (_ev, state) => { downloaded = { state, target }; });
  });

  const run = (code) => wc.executeJavaScript(code, true);

  wc.once('did-finish-load', async () => {
    try {
      await sleep(1500); // tempo para o boot() assíncrono terminar

      const info = await run(`(async () => ({
        href: location.href,
        title: document.title,
        route: (typeof Router !== 'undefined') ? Router.route : null,
        hasStore: typeof Store !== 'undefined',
        hasWorkspace: typeof Workspace !== 'undefined',
        secure: window.isSecureContext,
        wsHidden: !!document.getElementById('ws-shell')
      }))()`);
      check('app carrega em app://fluxo/', /^app:\/\/fluxo\//.test(info.href) && info.hasStore && info.hasWorkspace, info);
      check('contexto seguro', info.secure === true, info.secure);

      // --- navegação por todas as páginas ---
      const routes = ['inicio', 'tempo', 'progresso', 'tarefas', 'quadro'];
      const nav = {};
      for (const r of routes) {
        await run(`location.hash = '#/${r}'`);
        await sleep(900);
        nav[r] = await run('Router.route');
        if (SHOTS) {
          try {
            fs.mkdirSync(SHOTS, { recursive: true });
            const img = await wc.capturePage();
            fs.writeFileSync(path.join(SHOTS, `${MODE}-${r}.png`), img.toPNG());
          } catch (e) { /* captura é opcional */ }
        }
      }
      const expected = { inicio: 'home', tempo: 'timer', progresso: 'tracker', tarefas: 'tasks', quadro: 'workspace' };
      check('navegação entre as 5 páginas', routes.every((r) => nav[r] === expected[r]), nav);

      // --- persistência entre execuções (localStorage + IndexedDB) ---
      if (MODE === 'write') {
        const w = await run(`(async () => {
          Store.save();
          localStorage.setItem('smoke-marker', 'persistiu');
          await new Promise((res, rej) => {
            const rq = indexedDB.open('smoke-db', 1);
            rq.onupgradeneeded = () => rq.result.createObjectStore('kv');
            rq.onsuccess = () => {
              const tx = rq.result.transaction('kv', 'readwrite');
              tx.objectStore('kv').put('persistiu', 'marker');
              tx.oncomplete = () => { rq.result.close(); res(); };
              tx.onerror = () => rej(tx.error);
            };
            rq.onerror = () => rej(rq.error);
          });
          return { state: (localStorage.getItem('fluxo-state-v1') || '').length };
        })()`);
        check('Fluxo salva o estado no localStorage', w.state > 50, w);
      } else {
        const r = await run(`(async () => {
          const ls = localStorage.getItem('smoke-marker');
          const idb = await new Promise((res) => {
            const rq = indexedDB.open('smoke-db', 1);
            rq.onsuccess = () => {
              const g = rq.result.transaction('kv').objectStore('kv').get('marker');
              g.onsuccess = () => { rq.result.close(); res(g.result || null); };
              g.onerror = () => res(null);
            };
            rq.onerror = () => res(null);
          });
          return { ls, idb, state: (localStorage.getItem('fluxo-state-v1') || '').length };
        })()`);
        check('localStorage sobrevive ao reiniciar', r.ls === 'persistiu', r);
        check('IndexedDB sobrevive ao reiniciar', r.idb === 'persistiu', r);
        check('estado do Fluxo sobrevive ao reiniciar', r.state > 50, r.state);
      }

      // --- leitor de PDF (worker real + documento de teste) ---
      const pdf = await run(`(async () => {
        const lib = await Workspace.loadPdfLib();
        const workerSrc = lib.GlobalWorkerOptions.workerSrc;
        // o pdf.js cai em um "worker falso" se o real falhar; por isso testamos o Worker à parte
        const workerOk = await new Promise((res) => {
          try {
            const w = new Worker(workerSrc);
            let done = false;
            w.onerror = (e) => { if (!done) { done = true; res('erro: ' + (e.message || 'desconhecido')); } };
            setTimeout(() => { if (!done) { done = true; w.terminate(); res('ok'); } }, 1200);
          } catch (e) { res('erro: ' + e.message); }
        });
        const bytes = new TextEncoder().encode(${JSON.stringify(MIN_PDF)});
        let pages = null, err = null;
        try {
          const doc = await lib.getDocument({ data: bytes }).promise;
          pages = doc.numPages;
        } catch (e) { err = String(e && e.message || e); }
        return { workerSrc, workerOk, pages, err };
      })()`);
      check('worker do PDF carrega em app://', pdf.workerOk === 'ok', pdf);
      check('pdf.js abre um PDF de teste', pdf.pages === 1, pdf);

      // --- áudio com requisição parcial (Range) ---
      const aud = await run(`(async () => {
        const r = await fetch('assets/aistudio/Flowers_cc092a54.mp3', { headers: { Range: 'bytes=0-1023' } });
        const b = await r.arrayBuffer();
        return { status: r.status, type: r.headers.get('content-type'), len: b.byteLength };
      })()`);
      check('mp3 responde com Range (206)', aud.status === 206 && aud.len === 1024, aud);

      // --- o player consegue pular para um ponto da faixa e repetir (usa Range por baixo) ---
      const seek = await run(`(async () => {
        const a = new Audio('assets/aistudio/March_564a9b39.mp3');
        a.preload = 'metadata';
        const t = (ev, ms) => new Promise((res, rej) => {
          const to = setTimeout(() => rej(new Error('timeout em ' + ev)), ms);
          a.addEventListener(ev, () => { clearTimeout(to); res(); }, { once: true });
          a.addEventListener('error', () => { clearTimeout(to); rej(new Error('erro de mídia ' + (a.error && a.error.code))); }, { once: true });
        });
        try {
          await t('loadedmetadata', 8000);
          const duration = a.duration;
          a.currentTime = Math.min(60, duration / 2);
          await t('seeked', 8000);
          return { ok: true, duration: Math.round(duration), at: Math.round(a.currentTime) };
        } catch (e) { return { ok: false, err: String(e.message || e) }; }
      })()`);
      check('player de áudio carrega e pula para um ponto', seek.ok === true, seek);

      // --- exportação de backup ---
      await run('TrackerPage.exportData()');
      for (let i = 0; i < 30 && !downloaded; i++) await sleep(200);
      let exportOk = false, exportDetail = downloaded;
      if (downloaded && downloaded.state === 'completed') {
        try {
          const j = JSON.parse(fs.readFileSync(downloaded.target, 'utf8'));
          exportOk = j.app === 'Fluxo' && !!j.state;
          exportDetail = { file: path.basename(downloaded.target), keys: Object.keys(j) };
        } catch (e) { exportDetail = String(e); }
      }
      check('exportar backup salva um JSON válido', exportOk, exportDetail);

      // --- scripts da Vercel não devem existir nesta versão ---
      const v = await run(`({
        vercelScripts: [...document.scripts].filter(s => /_vercel/.test(s.src)).length,
        va: typeof window.va, si: typeof window.si
      })`);
      check('sem scripts da Vercel', v.vercelScripts === 0 && v.va === 'undefined' && v.si === 'undefined', v);
    } catch (e) {
      check('execução do teste', false, String((e && e.stack) || e));
    }

    result.ok = result.failures.length === 0;
    console.log('SMOKE_RESULT ' + JSON.stringify(result));
    app.exit(result.ok ? 0 : 1);
  });

  setTimeout(() => {
    console.log('SMOKE_RESULT ' + JSON.stringify({ ok: false, failures: ['tempo esgotado'], partial: result }));
    app.exit(2);
  }, 90000);
};
