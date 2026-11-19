'use strict';
/* ============ Fluxo Desktop — processo principal (Electron) ============
 *
 * Os arquivos do app (HTML/CSS/JS) são servidos por um protocolo interno
 * "app://fluxo/", em vez de file://. Isso evita problemas com o worker do
 * leitor de PDF e com requisições de áudio, e dá ao app uma "origem" estável.
 *
 * ATENÇÃO: os dados do usuário (localStorage e IndexedDB) ficam ligados a essa
 * origem. NUNCA mude o esquema ("app") nem o host ("fluxo") abaixo, senão o app
 * passa a abrir "vazio" e os dados antigos ficam inacessíveis.
 */
const { app, BrowserWindow, Menu, protocol, net, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');
const { pathToFileURL } = require('url');

const SCHEME = 'app';
const HOST = 'fluxo';
const WEB_ROOT = path.join(__dirname, 'web');
const IS_DEV = process.argv.includes('--dev');
const IS_SMOKE = process.env.FLUXO_SMOKE === '1';

app.setName('Fluxo');

// só para o teste automático: usa uma pasta de dados isolada
if (IS_SMOKE && process.env.FLUXO_USERDATA) {
  app.setPath('userData', process.env.FLUXO_USERDATA);
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
]);

let mainWindow = null;

const MEDIA_MIME = {
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.flac': 'audio/flac',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

// Resposta parcial (HTTP 206) feita à mão: o player de áudio do Chromium só consegue
// pular trechos e repetir a faixa se o servidor responder a "Range" corretamente.
async function serveRange(filePath, rangeHeader) {
  let stat;
  try { stat = await fs.promises.stat(filePath); } catch (e) { return new Response('Not found', { status: 404 }); }
  const size = stat.size;
  const m = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  let start;
  let end;
  if (m && (m[1] !== '' || m[2] !== '')) {
    if (m[1] === '') {                     // "últimos N bytes"
      const n = parseInt(m[2], 10);
      start = Math.max(0, size - n);
      end = size - 1;
    } else {
      start = parseInt(m[1], 10);
      end = m[2] === '' ? size - 1 : Math.min(parseInt(m[2], 10), size - 1);
    }
  }
  if (start === undefined || start >= size || end < start) {
    return new Response('Range Not Satisfiable', { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
  }
  const type = MEDIA_MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  return new Response(Readable.toWeb(fs.createReadStream(filePath, { start, end })), {
    status: 206,
    headers: {
      'Content-Type': type,
      'Content-Length': String(end - start + 1),
      'Content-Range': 'bytes ' + start + '-' + end + '/' + size,
      'Accept-Ranges': 'bytes'
    }
  });
}

async function handleAppProtocol(request) {
  const url = new URL(request.url);
  if (url.hostname !== HOST) {
    return new Response('Not found', { status: 404 });
  }
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/' || rel === '') rel = '/index.html';

  const filePath = path.normalize(path.join(WEB_ROOT, rel));
  // impede sair da pasta do app (path traversal)
  if (filePath !== WEB_ROOT && !filePath.startsWith(WEB_ROOT + path.sep)) {
    return new Response('Forbidden', { status: 403 });
  }

  const range = request.headers.get('range');
  if (range) return serveRange(filePath, range);

  // net.fetch cuida do tipo MIME; "Accept-Ranges" avisa o player que pode pedir trechos
  const res = await net.fetch(pathToFileURL(filePath).toString());
  const headers = new Headers(res.headers);
  headers.set('Accept-Ranges', 'bytes');
  return new Response(res.body, { status: res.status, headers });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    backgroundColor: '#0a0e1e',
    title: 'Fluxo',
    icon: path.join(__dirname, 'build', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      // o cronômetro e o registro de uso precisam continuar com a janela minimizada
      backgroundThrottling: false,
      // permite que a música de fundo toque sem exigir um clique antes
      autoplayPolicy: 'no-user-gesture-required',
      devTools: IS_DEV || IS_SMOKE
    }
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });

  // links externos abrem no navegador padrão; o app nunca navega para fora
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(SCHEME + '://' + HOST + '/')) {
      event.preventDefault();
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    }
  });

  // nenhuma permissão extra (câmera, microfone, localização...) é concedida
  mainWindow.webContents.session.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));

  mainWindow.loadURL(SCHEME + '://' + HOST + '/index.html');
  if (IS_DEV) mainWindow.webContents.openDevTools({ mode: 'detach' });

  return mainWindow;
}

function buildMenu() {
  // Menu enxuto, escondido (aparece ao apertar Alt). Sem atalho de recarregar,
  // para não conflitar com os atalhos do próprio Fluxo.
  const template = [
    {
      label: 'Exibir',
      submenu: [
        { role: 'resetZoom', label: 'Tamanho original' },
        { role: 'zoomIn', label: 'Aumentar' },
        { role: 'zoomOut', label: 'Diminuir' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tela cheia' },
        ...(IS_DEV ? [{ type: 'separator' }, { role: 'toggleDevTools' }, { role: 'reload' }] : [])
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

const gotLock = IS_SMOKE ? true : app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    protocol.handle(SCHEME, handleAppProtocol);
    buildMenu();
    const win = createWindow();
    if (IS_SMOKE) {
      // teste automático de fumaça (só roda com FLUXO_SMOKE=1)
      require('./scripts/smoke')(win, app);
    }
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    app.quit();
  });
}
