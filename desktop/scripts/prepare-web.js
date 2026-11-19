'use strict';
/* Copia o app web (index.html + public/) para desktop/web, ajustando o que
 * só faz sentido na Vercel. Os arquivos originais nunca são alterados. */
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const outDir = path.resolve(__dirname, '..', 'web');

function fail(msg) {
  console.error('[prepare-web] ERRO: ' + msg);
  process.exit(1);
}

const srcIndex = path.join(repoRoot, 'index.html');
const srcPublic = path.join(repoRoot, 'public');
if (!fs.existsSync(srcIndex)) fail('index.html não encontrado na raiz do repositório.');
if (!fs.existsSync(srcPublic)) fail('pasta public/ não encontrada na raiz do repositório.');

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

// 1) public/ -> web/  (sem o .zip esquecido e sem o favicon.ico, que não é usado no app)
fs.cpSync(srcPublic, outDir, {
  recursive: true,
  filter: (src) => {
    const base = path.basename(src).toLowerCase();
    if (base.endsWith('.zip')) return false;
    if (base === 'favicon.ico') return false;
    return true;
  }
});

// 2) index.html -> web/index.html, sem os scripts de análise da Vercel
let html = fs.readFileSync(srcIndex, 'utf8');
const before = html.length;

html = html
  // Web Analytics
  .replace(/[ \t]*<!--\s*Vercel Web Analytics\s*-->\s*/g, '')
  .replace(/[ \t]*<script>\s*window\.va\s*=[\s\S]*?<\/script>\s*/g, '')
  .replace(/[ \t]*<script[^>]*src=["']\/_vercel\/insights\/script\.js["'][^>]*><\/script>\s*/g, '')
  // Speed Insights
  .replace(/[ \t]*<!--\s*Vercel Speed Insights\s*-->\s*/g, '')
  .replace(/[ \t]*<script>\s*window\.si\s*=[\s\S]*?<\/script>\s*/g, '')
  .replace(/[ \t]*<script[^>]*src=["']\/_vercel\/speed-insights\/script\.js["'][^>]*><\/script>\s*/g, '');

if (/_vercel|window\.va\b|window\.si\b/.test(html)) {
  fail('sobrou referência à Vercel no index.html; o formato do arquivo mudou e o script precisa ser ajustado.');
}
if (html.length === before) {
  console.warn('[prepare-web] aviso: nenhum script da Vercel foi encontrado para remover.');
}
fs.writeFileSync(path.join(outDir, 'index.html'), html);

// 3) conferência: tudo que o index.html referencia por caminho relativo precisa existir
const refs = [...html.matchAll(/(?:src|href)=["']([^"':#]+?\.(?:js|css|ico|png|svg|mp3))["']/g)].map((m) => m[1]);
const missing = refs.filter((r) => !fs.existsSync(path.join(outDir, r)));
if (missing.length) fail('arquivos referenciados no index.html não encontrados: ' + missing.join(', '));

console.log('[prepare-web] ok — ' + refs.length + ' arquivos referenciados conferidos; saída em ' + outDir);
