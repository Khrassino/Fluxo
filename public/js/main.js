'use strict';
/* ============ main.js — inicialização ============ */
async function boot() {
  Store.load();
  if (typeof I18n !== 'undefined' && typeof I18n.applyStaticDOM === 'function') {
    I18n.applyStaticDOM();
  }

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

  if (typeof QuotesUI !== 'undefined') QuotesUI.init();
  HomePage.init();
  TimerPage.init();
  TrackerPage.init();
  TasksPage.init();

  Usage.start();
  if (typeof Welcome !== 'undefined') Welcome.init();
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

  // dica de primeira visita (evita duplicidade/sobreposição com o guia da tela inicial)
  if (!Store.state.meta.seenTip) {
    Store.state.meta.seenTip = true;
    Store.save();
    if (Store.state.meta.seenPages && Store.state.meta.seenPages.home) {
      const tip = typeof getLang === 'function' && getLang() === 'en'
        ? 'Tap the bubble to navigate, drag to move it and customize everything'
        : 'Toque na bolinha para navegar, arraste para movê-la e personalizar tudo';
      setTimeout(() => toast(tip, 'sparkle'), 1400);
    }
  }
}

boot();
