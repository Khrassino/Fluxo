'use strict';
/* ============ main.js — inicialização ============ */
async function boot() {
  Store.load();

  // respeita a preferência do sistema por menos movimento
  if (Store.fresh && window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    Store.state.motion.enabled = false;
    Store.save();
  }

  Sound.init();
  Themes.apply();

  await Files.init();
  await Themes.loadCustomFiles();

  Motion.init();

  HomePage.init();
  TimerPage.init();
  TrackerPage.init();
  TasksPage.init();

  Usage.start();
  Router.init();
  Panel.init();
  Idle.init();

  // rota inicial
  if (!location.hash) {
    try { history.replaceState(null, '', '#/inicio'); } catch (e) { location.hash = '#/inicio'; }
    Router.go();
  }

  // bloqueia Ctrl+A / Cmd+A na interface geral e direciona seleção para elementos da Área de Trabalho
  document.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.key.toLowerCase() !== 'a') return;
    const t = e.target;
    const tag = (t && t.tagName ? t.tagName : '').toUpperCase();
    const inputType = tag === 'INPUT' ? String(t.type || 'text').toLowerCase() : '';
    const isTextEditable =
      tag === 'TEXTAREA' ||
      (t && t.isContentEditable) ||
      (tag === 'INPUT' && ['text', 'search', 'email', 'url', 'tel', 'password', 'number', ''].includes(inputType));
    if (isTextEditable) return;

    e.preventDefault();
    if (typeof Router !== 'undefined' && Router.route === 'workspace' &&
        typeof Workspace !== 'undefined' && Workspace.entered && !Workspace.confirmOpen &&
        !document.body.classList.contains('panel-open')) {
      Workspace.selectAll();
    }
  });

  // dica de primeira visita
  if (!Store.state.meta.seenTip) {
    Store.state.meta.seenTip = true;
    Store.save();
    setTimeout(() => toast('Toque na bolinha para navegar, arraste para movê-la e personalizar tudo', 'sparkle'), 1400);
  }
}

boot();
