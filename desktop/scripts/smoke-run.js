'use strict';
/* Executa o teste de fumaça duas vezes com a MESMA pasta de dados:
 * 1ª grava marcadores; 2ª confere se sobreviveram ao reiniciar o app. */
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const electronBin = require('electron'); // caminho do executável
const desktopDir = path.resolve(__dirname, '..');
const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'fluxo-userdata-'));
const shots = process.env.FLUXO_SMOKE_SHOTS || '';

function runOnce(mode) {
  const env = { ...process.env, FLUXO_SMOKE: '1', FLUXO_SMOKE_MODE: mode, FLUXO_USERDATA: userData };
  if (shots) env.FLUXO_SMOKE_SHOTS = shots;
  let cmd = electronBin;
  let args = [desktopDir];
  if (process.platform === 'linux') {
    // em containers/CI: sem sandbox do Chromium, sem GPU e com tela virtual
    args.push('--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage');
    args = [cmd, ...args];
    cmd = 'xvfb-run';
    args = ['-a', ...args];
  }
  const r = spawnSync(cmd, args, { env, encoding: 'utf8', timeout: 120000 });
  const line = (r.stdout || '').split('\n').find((l) => l.startsWith('SMOKE_RESULT '));
  if (!line) {
    console.error('Sem resultado do teste (' + mode + ').\nstdout:\n' + (r.stdout || '') + '\nstderr:\n' + (r.stderr || '').slice(-2000));
    return null;
  }
  return JSON.parse(line.slice('SMOKE_RESULT '.length));
}

let failed = false;
for (const mode of ['write', 'read']) {
  const res = runOnce(mode);
  if (!res) { failed = true; continue; }
  console.log('\n=== execução "' + mode + '" ===');
  for (const [name, c] of Object.entries(res.checks || {})) {
    console.log((c.ok ? '  OK   ' : '  FALHA') + ' ' + name + (c.ok ? '' : '  -> ' + JSON.stringify(c.detail)));
  }
  if (res.consoleIssues && res.consoleIssues.length) {
    console.log('  avisos/erros no console:');
    res.consoleIssues.forEach((m) => console.log('    - ' + m));
  }
  if (res.badRequests && res.badRequests.length) {
    console.log('  requisições com falha:');
    [...new Set(res.badRequests)].forEach((m) => console.log('    - ' + m));
  }
  if (!res.ok) failed = true;
}
console.log(failed ? '\nRESULTADO: FALHOU' : '\nRESULTADO: TUDO OK');
process.exit(failed ? 1 : 0);
