'use strict';
/* ============ welcome.js — cartões de boas-vindas por página ============ */

const WELCOME_PAGES = ['home', 'timer', 'tracker', 'tasks', 'workspace'];

function normalizeWelcomeSeen(raw) {
  const out = {};
  const src = raw && typeof raw === 'object' ? raw : {};
  for (let i = 0; i < WELCOME_PAGES.length; i++) {
    const p = WELCOME_PAGES[i];
    out[p] = !!src[p];
  }
  return out;
}

function shouldShowWelcome(route, seenPages) {
  if (!WELCOME_PAGES.includes(route)) return false;
  const norm = normalizeWelcomeSeen(seenPages);
  return !norm[route];
}

function markWelcomeSeen(seenPages, route) {
  const next = normalizeWelcomeSeen(seenPages);
  if (WELCOME_PAGES.includes(route)) next[route] = true;
  return next;
}

function markAllWelcomeSeen() {
  const next = {};
  for (let i = 0; i < WELCOME_PAGES.length; i++) next[WELCOME_PAGES[i]] = true;
  return next;
}

function resetWelcomeSeen() {
  const next = {};
  for (let i = 0; i < WELCOME_PAGES.length; i++) next[WELCOME_PAGES[i]] = false;
  return next;
}

function computeWelcomeAnchor(route, dockAnchor, isMobile) {
  const anchor = dockAnchor || 'bc';
  if (isMobile) {
    if (route === 'workspace') return 'mobile-top';
    if (anchor === 'bc' || anchor === 'bl' || anchor === 'br') return 'mobile-bottom';
    return 'mobile-bottom-low';
  }
  if (route === 'workspace') {
    if (anchor === 'tr') return 'top-left';
    return 'top-right';
  }
  if (anchor === 'br' || anchor === 'mr') return 'bottom-left';
  return 'bottom-right';
}

function welcomeTr(key, fallback, vars) {
  if (typeof tr === 'function') return tr(key, fallback, vars);
  return fallback;
}

function welcomeEsc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function welcomeIllustrationSvg(route) {
  switch (route) {
    case 'home':
      return (
        '<svg class="welcome-svg" viewBox="0 0 280 88" fill="none" aria-hidden="true">' +
          '<defs>' +
            '<radialGradient id="wgHome" cx="50%" cy="38%" r="52%">' +
              '<stop offset="0%" stop-color="var(--accent)" stop-opacity="0.26"/>' +
              '<stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>' +
            '</radialGradient>' +
          '</defs>' +
          '<rect x="0" y="0" width="280" height="88" fill="url(#wgHome)"/>' +
          /* relógio minimalista no centro */
          '<rect x="93" y="12" width="18" height="23" rx="5" stroke="var(--text)" stroke-opacity="0.72" stroke-width="1.6"/>' +
          '<rect x="115" y="12" width="18" height="23" rx="5" stroke="var(--accent)" stroke-width="1.6"/>' +
          '<circle cx="140" cy="20" r="1.5" fill="var(--accent)"/>' +
          '<circle cx="140" cy="27" r="1.5" fill="var(--accent)"/>' +
          '<rect x="147" y="12" width="18" height="23" rx="5" stroke="var(--text)" stroke-opacity="0.72" stroke-width="1.6"/>' +
          '<rect x="169" y="12" width="18" height="23" rx="5" stroke="var(--text)" stroke-opacity="0.48" stroke-width="1.6"/>' +
          /* atalhos rápidos */
          '<rect x="64" y="45" width="44" height="12" rx="6" fill="var(--accent-soft)" stroke="var(--accent)" stroke-opacity="0.55" stroke-width="1.1"/>' +
          '<rect x="114" y="45" width="52" height="12" rx="6" fill="var(--surface-2)" stroke="var(--border)" stroke-width="1.1"/>' +
          '<rect x="172" y="45" width="44" height="12" rx="6" fill="var(--surface-2)" stroke="var(--border)" stroke-width="1.1"/>' +
          /* bolinha de navegação inferior */
          '<path d="M104 71h72" stroke="var(--border)" stroke-width="1.2" stroke-linecap="round"/>' +
          '<circle cx="140" cy="71" r="9.5" fill="var(--glass-strong)" stroke="var(--accent)" stroke-width="1.5"/>' +
          '<circle cx="140" cy="71" r="3" fill="var(--accent-2)"/>' +
          '<circle cx="116" cy="71" r="3" fill="var(--text-faint)" fill-opacity="0.45"/>' +
          '<circle cx="164" cy="71" r="3" fill="var(--text-faint)" fill-opacity="0.45"/>' +
        '</svg>'
      );

    case 'timer':
      return (
        '<svg class="welcome-svg" viewBox="0 0 280 88" fill="none" aria-hidden="true">' +
          '<defs>' +
            '<linearGradient id="wgRing" x1="0" y1="0" x2="1" y2="1">' +
              '<stop offset="0%" stop-color="var(--accent)"/>' +
              '<stop offset="100%" stop-color="var(--accent-2)"/>' +
            '</linearGradient>' +
          '</defs>' +
          /* anel de progresso */
          '<circle cx="140" cy="40" r="27" stroke="var(--surface-2)" stroke-width="4.5"/>' +
          '<circle cx="140" cy="40" r="27" stroke="url(#wgRing)" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="122 170" transform="rotate(-90 140 40)"/>' +
          /* mostrador central */
          '<rect x="126" y="34" width="28" height="6" rx="3" fill="var(--text)" fill-opacity="0.82"/>' +
          '<rect x="131" y="44" width="18" height="3.5" rx="1.75" fill="var(--accent-2)" fill-opacity="0.85"/>' +
          /* controles laterais e inferiores */
          '<circle cx="88" cy="40" r="9" fill="var(--surface-2)" stroke="var(--border)" stroke-width="1.1"/>' +
          '<path d="M85 40h6" stroke="var(--text-dim)" stroke-width="1.4" stroke-linecap="round"/>' +
          '<circle cx="192" cy="40" r="9" fill="var(--surface-2)" stroke="var(--border)" stroke-width="1.1"/>' +
          '<path d="M190 36.5l5 3.5-5 3.5v-7z" fill="var(--accent)"/>' +
          '<rect x="108" y="75" width="64" height="5" rx="2.5" fill="var(--surface-2)"/>' +
          '<rect x="122" y="75" width="24" height="5" rx="2.5" fill="var(--accent)" fill-opacity="0.75"/>' +
        '</svg>'
      );

    case 'tracker':
      return (
        '<svg class="welcome-svg" viewBox="0 0 280 88" fill="none" aria-hidden="true">' +
          /* gráfico em barras à esquerda */
          '<path d="M44 68h92" stroke="var(--border)" stroke-width="1.2" stroke-linecap="round"/>' +
          '<rect x="50" y="46" width="10" height="22" rx="3" fill="var(--surface-2)" stroke="var(--border)" stroke-width="1"/>' +
          '<rect x="66" y="35" width="10" height="33" rx="3" fill="var(--accent)" fill-opacity="0.55"/>' +
          '<rect x="82" y="42" width="10" height="26" rx="3" fill="var(--accent)" fill-opacity="0.75"/>' +
          '<rect x="98" y="21" width="10" height="47" rx="3" fill="var(--accent)"/>' +
          '<rect x="114" y="29" width="10" height="39" rx="3" fill="var(--accent-2)" fill-opacity="0.85"/>' +
          /* mini heatmap à direita */
          '<rect x="156" y="20" width="12" height="12" rx="3" fill="var(--surface-2)"/>' +
          '<rect x="172" y="20" width="12" height="12" rx="3" fill="var(--accent)" fill-opacity="0.35"/>' +
          '<rect x="188" y="20" width="12" height="12" rx="3" fill="var(--accent)" fill-opacity="0.78"/>' +
          '<rect x="204" y="20" width="12" height="12" rx="3" fill="var(--accent-2)" fill-opacity="0.65"/>' +
          '<rect x="220" y="20" width="12" height="12" rx="3" fill="var(--surface-2)"/>' +
          '<rect x="156" y="36" width="12" height="12" rx="3" fill="var(--accent)" fill-opacity="0.55"/>' +
          '<rect x="172" y="36" width="12" height="12" rx="3" fill="var(--accent)" fill-opacity="0.9"/>' +
          '<rect x="188" y="36" width="12" height="12" rx="3" fill="var(--surface-2)"/>' +
          '<rect x="204" y="36" width="12" height="12" rx="3" fill="var(--accent)" fill-opacity="0.45"/>' +
          '<rect x="220" y="36" width="12" height="12" rx="3" fill="var(--accent-2)"/>' +
          /* barra de meta diária */
          '<rect x="156" y="59" width="76" height="7" rx="3.5" fill="var(--surface-2)"/>' +
          '<rect x="156" y="59" width="54" height="7" rx="3.5" fill="var(--accent-2)"/>' +
        '</svg>'
      );

    case 'tasks':
      return (
        '<svg class="welcome-svg" viewBox="0 0 280 88" fill="none" aria-hidden="true">' +
          /* linha 1 (concluída) */
          '<rect x="52" y="13" width="176" height="18" rx="7" fill="var(--surface-2)" fill-opacity="0.72" stroke="var(--border)" stroke-width="1"/>' +
          '<rect x="60" y="18" width="9" height="9" rx="3" fill="var(--accent-2)"/>' +
          '<path d="M62.3 22.5l1.7 1.7 3-3.4" stroke="var(--accent-contrast)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<rect x="76" y="20.5" width="76" height="4" rx="2" fill="var(--text-dim)" fill-opacity="0.45"/>' +
          '<rect x="196" y="19.5" width="22" height="6" rx="3" fill="var(--accent-2)" fill-opacity="0.28"/>' +
          /* linha 2 (ativa com destaque) */
          '<rect x="52" y="36" width="176" height="19" rx="7" fill="var(--glass-strong)" stroke="var(--accent)" stroke-opacity="0.75" stroke-width="1.2"/>' +
          '<rect x="60" y="41" width="9" height="9" rx="3" stroke="var(--accent)" stroke-width="1.4"/>' +
          '<rect x="76" y="43.5" width="94" height="4.5" rx="2.2" fill="var(--text)" fill-opacity="0.82"/>' +
          '<rect x="194" y="42.5" width="24" height="6" rx="3" fill="var(--accent-soft)"/>' +
          /* linha 3 (com subtarefa) */
          '<rect x="52" y="60" width="176" height="17" rx="7" fill="var(--surface-2)" fill-opacity="0.55" stroke="var(--border)" stroke-width="1"/>' +
          '<rect x="60" y="64.5" width="8.5" height="8.5" rx="3" stroke="var(--text-faint)" stroke-width="1.3"/>' +
          '<rect x="76" y="67" width="64" height="4" rx="2" fill="var(--text-dim)" fill-opacity="0.65"/>' +
        '</svg>'
      );

    case 'workspace':
    default:
      return (
        '<svg class="welcome-svg" viewBox="0 0 280 88" fill="none" aria-hidden="true">' +
          /* pontos sutis do quadro infinito */
          '<circle cx="44" cy="20" r="1" fill="var(--text-faint)" fill-opacity="0.45"/>' +
          '<circle cx="72" cy="20" r="1" fill="var(--text-faint)" fill-opacity="0.45"/>' +
          '<circle cx="140" cy="20" r="1" fill="var(--text-faint)" fill-opacity="0.45"/>' +
          '<circle cx="210" cy="20" r="1" fill="var(--text-faint)" fill-opacity="0.45"/>' +
          '<circle cx="44" cy="68" r="1" fill="var(--text-faint)" fill-opacity="0.45"/>' +
          '<circle cx="140" cy="68" r="1" fill="var(--text-faint)" fill-opacity="0.45"/>' +
          '<circle cx="236" cy="68" r="1" fill="var(--text-faint)" fill-opacity="0.45"/>' +
          /* cartão esquerda */
          '<rect x="44" y="16" width="74" height="48" rx="9" fill="var(--glass-strong)" stroke="var(--border)" stroke-width="1.2"/>' +
          '<path d="M45 27h72" stroke="var(--border)" stroke-width="1"/>' +
          '<rect x="52" y="20" width="28" height="3.5" rx="1.75" fill="var(--accent)"/>' +
          '<rect x="52" y="34" width="52" height="4" rx="2" fill="var(--text)" fill-opacity="0.72"/>' +
          '<rect x="52" y="43" width="40" height="4" rx="2" fill="var(--text-dim)" fill-opacity="0.55"/>' +
          /* ligação curva */
          '<path d="M118 40c18 0 22 6 40 6" stroke="var(--accent)" stroke-width="1.7" stroke-linecap="round"/>' +
          '<path d="M153 42.5l5.5 3.5-5.5 3.5" stroke="var(--accent)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>' +
          /* cartão direita */
          '<rect x="162" y="22" width="76" height="46" rx="9" fill="var(--glass-strong)" stroke="var(--accent)" stroke-opacity="0.65" stroke-width="1.2"/>' +
          '<rect x="170" y="31" width="38" height="4" rx="2" fill="var(--accent-2)"/>' +
          '<rect x="170" y="40" width="56" height="4" rx="2" fill="var(--text)" fill-opacity="0.68"/>' +
          '<rect x="170" y="49" width="44" height="4" rx="2" fill="var(--text-dim)" fill-opacity="0.48"/>' +
          /* traço livre sutil */
          '<path d="M84 74c18-8 34 6 52-4" stroke="var(--accent-2)" stroke-width="1.8" stroke-linecap="round" stroke-opacity="0.8"/>' +
        '</svg>'
      );
  }
}

function getWelcomeContent(route) {
  const map = {
    home: {
      kicker: welcomeTr('welcome.home.kicker', 'Primeiros passos · Início'),
      title: welcomeTr('welcome.home.title', 'Seu ponto de partida calmo'),
      desc: welcomeTr('welcome.home.desc', 'Aqui ficam as horas, uma citação opcional e atalhos diretos para começar o seu foco.'),
      tips: [
        { icon: 'logo', text: welcomeTr('welcome.home.tip1', 'Toque ou arraste a bolinha inferior para navegar entre páginas.') },
        { icon: 'sliders', text: welcomeTr('welcome.home.tip2', 'Em Personalizar, ajuste tema, fonte, música e citações.') },
        { icon: 'play', text: welcomeTr('welcome.home.tip3', 'Use os atalhos abaixo do relógio para iniciar foco ou tarefas.') }
      ]
    },
    timer: {
      kicker: welcomeTr('welcome.timer.kicker', 'Primeiros passos · Tempo'),
      title: welcomeTr('welcome.timer.title', 'Foque sem distrações'),
      desc: welcomeTr('welcome.timer.desc', 'Alterne entre temporizador por blocos e cronômetro livre no seu ritmo.'),
      tips: [
        { icon: 'timer', text: welcomeTr('welcome.timer.tip1', 'Escolha Foco, Pausa, Descanso ou personalize suas durações.') },
        { icon: 'bolt', text: welcomeTr('welcome.timer.tip2', 'Pressione Espaço para iniciar/pausar, R reinicia e S alterna.') },
        { icon: 'target', text: welcomeTr('welcome.timer.tip3', 'No modo minimalista, segure o círculo central para ações rápidas.') }
      ]
    },
    tracker: {
      kicker: welcomeTr('welcome.tracker.kicker', 'Primeiros passos · Progresso'),
      title: welcomeTr('welcome.tracker.title', 'Acompanhe sua consistência'),
      desc: welcomeTr('welcome.tracker.desc', 'Veja horas de uso, sessões de foco e tarefas concluídas ao longo dos dias.'),
      tips: [
        { icon: 'chart', text: welcomeTr('welcome.tracker.tip1', 'Troque entre barras, linha, grade e anel nos controles do gráfico.') },
        { icon: 'grid', text: welcomeTr('welcome.tracker.tip2', 'Ative cartões extras ou um segundo gráfico em Personalizar.') },
        { icon: 'download', text: welcomeTr('welcome.tracker.tip3', 'Exporte seus dados ou faça backup completo quando quiser.') }
      ]
    },
    tasks: {
      kicker: welcomeTr('welcome.tasks.kicker', 'Primeiros passos · Tarefas'),
      title: welcomeTr('welcome.tasks.title', 'Organize o essencial'),
      desc: welcomeTr('welcome.tasks.desc', 'Anote pendências rápidas com prazo, prioridade, tags e subtarefas internas.'),
      tips: [
        { icon: 'plus', text: welcomeTr('welcome.tasks.tip1', 'Digite e pressione Enter para criar; defina prazo, prioridade e #tag.') },
        { icon: 'search', text: welcomeTr('welcome.tasks.tip2', 'Pressione / para buscar ou dê duplo clique no texto para editar.') },
        { icon: 'checklist', text: welcomeTr('welcome.tasks.tip3', 'Clique em uma tarefa para abrir notas e subtarefas.') }
      ]
    },
    workspace: {
      kicker: welcomeTr('welcome.workspace.kicker', 'Primeiros passos · Área de Trabalho'),
      title: welcomeTr('welcome.workspace.title', 'Quadro infinito de ideias'),
      desc: welcomeTr('welcome.workspace.desc', 'Reúna notas, conceitos, checklists, PDFs, imagens e desenhos num espaço livre.'),
      tips: [
        { icon: 'pencil', text: welcomeTr('welcome.workspace.tip1', 'Dê duplo clique no fundo ou use + Novo para criar cartões.') },
        { icon: 'arrow', text: welcomeTr('welcome.workspace.tip2', 'Ligue cartões com setas, agrupe seleções e desenhe com D.') },
        { icon: 'undo', text: welcomeTr('welcome.workspace.tip3', 'Ctrl+V cola imagens · Ctrl+Z desfaz · crie até 5 quadros.') }
      ]
    }
  };
  return map[route] || map.home;
}

const Welcome = {
  el: null,
  activeRoute: null,
  hideTimer: null,

  init() {
    this.ensureNode();
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!this.el || this.el.hidden) return;
      if (document.body.classList.contains('panel-open')) return;
      if (typeof Workspace !== 'undefined') {
        if (Workspace.confirmOpen) return;
        if (typeof Router !== 'undefined' && Router.route === 'workspace' &&
            (Workspace.inkSettingsOpen || Workspace.drawMode || Workspace.selectMode || Workspace.popover || Workspace.linkFrom)) {
          return;
        }
      }
      this.dismiss(this.activeRoute);
    });
    window.addEventListener('resize', () => this.syncPlacement(), { passive: true });
  },

  ensureNode() {
    if (this.el && this.el.isConnected) return this.el;
    let card = document.getElementById('welcome-card');
    if (!card) {
      card = document.createElement('aside');
      card.id = 'welcome-card';
      card.className = 'welcome-card';
      card.setAttribute('role', 'region');
      card.setAttribute('aria-label', welcomeTr('welcome.ariaLabel', 'Guia inicial da página'));
      card.hidden = true;
      document.body.append(card);
    }
    this.el = card;
    return card;
  },

  seenMap() {
    const meta = (typeof Store !== 'undefined' && Store.state && Store.state.meta) ? Store.state.meta : null;
    const norm = normalizeWelcomeSeen(meta && meta.seenPages);
    if (meta && !meta.seenPages) meta.seenPages = Object.assign({}, norm);
    return norm;
  },

  onRoute(route) {
    const r = WELCOME_PAGES.includes(route) ? route : (typeof Router !== 'undefined' ? Router.route : 'home');
    const card = this.ensureNode();
    clearTimeout(this.hideTimer);
    this.hideTimer = null;

    if (!shouldShowWelcome(r, this.seenMap())) {
      this.activeRoute = null;
      card.classList.remove('is-leaving');
      card.hidden = true;
      if (typeof document !== 'undefined' && document.body && document.body.dataset) {
        delete document.body.dataset.welcomePos;
      }
      return;
    }

    this.activeRoute = r;
    this.render();
    card.classList.remove('is-leaving');
    card.hidden = false;
    this.syncPlacement();
  },

  syncPlacement() {
    const card = this.el;
    if (!card) return;
    const route = this.activeRoute || (typeof Router !== 'undefined' ? Router.route : 'home');
    const dockAnchor = (typeof Router !== 'undefined' && Router.anchor)
      || (typeof Store !== 'undefined' && Store.state && Store.state.dock && Store.state.dock.anchor)
      || 'bc';
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 720;
    const pos = computeWelcomeAnchor(route, dockAnchor, isMobile);
    card.dataset.pos = pos;
    card.dataset.route = route;

    if (pos === 'mobile-top' && typeof document !== 'undefined' && typeof document.getElementById === 'function') {
      const topbar = document.getElementById('ws-topbar');
      const rect = topbar && typeof topbar.getBoundingClientRect === 'function' ? topbar.getBoundingClientRect() : null;
      if (rect && rect.height > 0 && card.style && typeof card.style.setProperty === 'function') {
        card.style.setProperty('--welcome-top', Math.ceil(rect.bottom + 10) + 'px');
      } else if (card.style && typeof card.style.removeProperty === 'function') {
        card.style.removeProperty('--welcome-top');
      }
    } else if (card.style && typeof card.style.removeProperty === 'function') {
      card.style.removeProperty('--welcome-top');
    }

    if (typeof document !== 'undefined' && document.body && document.body.dataset) {
      if (card.hidden || !this.activeRoute) delete document.body.dataset.welcomePos;
      else document.body.dataset.welcomePos = pos;
    }
  },

  syncLanguage() {
    if (!this.el || this.el.hidden || !this.activeRoute) return;
    this.el.setAttribute('aria-label', welcomeTr('welcome.ariaLabel', 'Guia inicial da página'));
    this.render();
  },

  render() {
    const card = this.ensureNode();
    const route = this.activeRoute;
    if (!route) return;
    const c = getWelcomeContent(route);
    const tipsHtml = c.tips.map(tip =>
      '<li class="welcome-tip">' +
        '<span class="welcome-tip-ico">' + svgIcon(tip.icon) + '</span>' +
        '<span>' + welcomeEsc(tip.text) + '</span>' +
      '</li>'
    ).join('');

    card.innerHTML =
      '<div class="welcome-top">' +
        '<span class="welcome-kicker">' + welcomeEsc(c.kicker) + '</span>' +
        '<button type="button" class="welcome-close" data-wact="close" title="' + welcomeEsc(welcomeTr('welcome.closeAria', 'Fechar guia')) + '" aria-label="' + welcomeEsc(welcomeTr('welcome.closeAria', 'Fechar guia')) + '">' +
          svgIcon('close') +
        '</button>' +
      '</div>' +
      '<div class="welcome-illo">' + welcomeIllustrationSvg(route) + '</div>' +
      '<h3 class="welcome-title">' + welcomeEsc(c.title) + '</h3>' +
      '<p class="welcome-desc">' + welcomeEsc(c.desc) + '</p>' +
      '<ul class="welcome-tips">' + tipsHtml + '</ul>' +
      '<div class="welcome-actions">' +
        '<button type="button" class="welcome-skip" data-wact="skip">' + welcomeEsc(welcomeTr('welcome.skipAll', 'Ocultar todos')) + '</button>' +
        '<button type="button" class="welcome-done" data-wact="done">' + welcomeEsc(welcomeTr('welcome.gotIt', 'Entendi')) + '</button>' +
      '</div>';

    const closeBtn = card.querySelector('[data-wact="close"]');
    const doneBtn = card.querySelector('[data-wact="done"]');
    const skipBtn = card.querySelector('[data-wact="skip"]');
    if (closeBtn) closeBtn.addEventListener('click', () => this.dismiss(route));
    if (doneBtn) doneBtn.addEventListener('click', () => this.dismiss(route));
    if (skipBtn) skipBtn.addEventListener('click', () => this.dismissAll());
  },

  dismiss(route) {
    const r = route || this.activeRoute;
    if (typeof Store !== 'undefined' && Store.state) {
      if (!Store.state.meta) Store.state.meta = { firstDay: null, seenTip: false, seenPages: {} };
      Store.state.meta.seenPages = markWelcomeSeen(Store.state.meta.seenPages, r);
      Store.save();
    }
    this.hideAnimated();
  },

  dismissAll() {
    if (typeof Store !== 'undefined' && Store.state) {
      if (!Store.state.meta) Store.state.meta = { firstDay: null, seenTip: false, seenPages: {} };
      Store.state.meta.seenPages = markAllWelcomeSeen();
      Store.save();
    }
    this.hideAnimated();
  },

  hideAnimated() {
    const card = this.el;
    this.activeRoute = null;
    if (typeof document !== 'undefined' && document.body && document.body.dataset) {
      delete document.body.dataset.welcomePos;
    }
    if (!card || card.hidden) return;
    clearTimeout(this.hideTimer);
    card.classList.add('is-leaving');
    this.hideTimer = setTimeout(() => {
      card.hidden = true;
      card.classList.remove('is-leaving');
      this.hideTimer = null;
    }, 180);
  },

  replayAll() {
    if (typeof Store !== 'undefined' && Store.state) {
      if (!Store.state.meta) Store.state.meta = { firstDay: null, seenTip: false, seenPages: {} };
      Store.state.meta.seenPages = resetWelcomeSeen();
      Store.save();
    }
    const route = (typeof Router !== 'undefined' && Router.route) ? Router.route : 'home';
    this.onRoute(route);
  }
};
