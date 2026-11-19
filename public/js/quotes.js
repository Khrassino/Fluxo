'use strict';
/* ============ quotes.js — apresentação e integração com a página inicial ============ */

const QuotesUI = {
  _activeQuote: null,
  _inited: false,

  init() {
    QuotesStore.load();
    this.syncLayoutEnabledFlag();
    this.refreshSelection('boot');
    this.render();
    this._inited = true;

    // Atualiza o cache externo apenas em segundo plano e respeitando o TTL (nunca bloqueia a abertura)
    if (QuotesStore.state.sources && QuotesStore.state.sources.api) {
      QuotesStore.refreshApiCache().then((res) => {
        if (res && res.ok && !res.skipped) {
          if (!this._activeQuote) {
            this.refreshSelection('sync');
            this.render();
            if (typeof HomePage !== 'undefined') HomePage.applyLayout();
          }
        }
      });
    }
  },

  syncLayoutEnabledFlag() {
    if (typeof Store === 'undefined' || !Store.state || !Store.state.home || !Array.isArray(Store.state.home.layout)) return;
    const item = Store.state.home.layout.find(x => x.id === 'quote');
    if (item && item.on !== QuotesStore.isEnabled()) {
      item.on = QuotesStore.isEnabled();
      Store.save();
    }
  },

  hasRenderableQuote() {
    return !!(QuotesStore.isEnabled() && this._activeQuote && this._activeQuote.text);
  },

  refreshSelection(trigger) {
    const res = QuotesStore.resolve(trigger || 'sync');
    this._activeQuote = res.activeQuote;
    return res;
  },

  onLanguageChange() {
    this.refreshSelection('lang');
    this.render();
    if (typeof HomePage !== 'undefined') HomePage.applyLayout();
  },

  resolveFontFamily(fontId) {
    if (typeof FONTS !== 'undefined' && Array.isArray(FONTS)) {
      const f = FONTS.find(x => x.id === fontId);
      if (f && f.family) return f.family;
    }
    return 'var(--font-ui)';
  },

  render() {
    const wrap = $('#home-quote');
    const textEl = $('#home-quote-text');
    const authorEl = $('#home-quote-author');
    if (!wrap || !textEl || !authorEl) return;

    const st = QuotesStore.state || defaultQuotesState();
    const style = st.style || {};

    wrap.style.setProperty('--quote-size', (style.size || 15) + 'px');
    wrap.style.setProperty('--quote-font', this.resolveFontFamily(style.font));
    wrap.dataset.align = style.align || 'center';

    if (typeof Themes !== 'undefined' && typeof Themes.ensureFonts === 'function' && style.font) {
      Themes.ensureFonts([style.font]);
    }

    const q = this._activeQuote;
    if (!st.enabled || !q || !q.text) {
      textEl.textContent = '';
      authorEl.textContent = '';
      authorEl.hidden = true;
      wrap.hidden = true;
      return;
    }

    textEl.textContent = q.text;
    const showAuthor = style.showAuthor !== false && !!q.author;
    authorEl.textContent = showAuthor ? q.author : '';
    authorEl.hidden = !showAuthor;

    const layoutOn = typeof HomePage !== 'undefined'
      ? (HomePage.layout().find(x => x.id === 'quote')?.on !== false)
      : true;
    wrap.hidden = !layoutOn;
  },

  setEnabled(on) {
    QuotesStore.state.enabled = !!on;
    QuotesStore.save();
    if (typeof Store !== 'undefined' && Store.state && Store.state.home && Array.isArray(Store.state.home.layout)) {
      const item = Store.state.home.layout.find(x => x.id === 'quote');
      if (item) item.on = !!on;
      else Store.state.home.layout.push({ id: 'quote', on: !!on, idle: false });
      Store.save();
    }
    this.refreshSelection('sync');
    this.render();
    if (typeof HomePage !== 'undefined') HomePage.applyLayout();
  },

  setFrequency(freq) {
    if (!['daily', 'open', 'manual'].includes(freq)) return;
    QuotesStore.state.frequency = freq;
    QuotesStore.save();
    this.refreshSelection('sync');
    this.render();
    if (typeof HomePage !== 'undefined') HomePage.applyLayout();
  },

  nextQuote() {
    this.refreshSelection('manual');
    this.render();
    if (typeof HomePage !== 'undefined') HomePage.applyLayout();
  },

  setSource(sourceKey, on) {
    if (!['internal', 'custom', 'api'].includes(sourceKey)) return;
    QuotesStore.state.sources[sourceKey] = !!on;
    QuotesStore.save();
    this.refreshSelection('sync');
    this.render();
    if (typeof HomePage !== 'undefined') HomePage.applyLayout();

    if (sourceKey === 'api' && on) {
      QuotesStore.refreshApiCache().then((res) => {
        if (res && res.ok && !res.skipped) {
          if (!this._activeQuote) {
            this.refreshSelection('sync');
          }
          this.render();
          if (typeof HomePage !== 'undefined') HomePage.applyLayout();
          if (typeof Panel !== 'undefined' && Panel.openId === 'home' && document.body.classList.contains('panel-open')) {
            Panel.render();
          }
        }
      });
    }
  },

  async refreshExternalNow() {
    const res = await QuotesStore.refreshApiCache({ force: true });
    if (res && res.ok) {
      if (!this._activeQuote) this.refreshSelection('sync');
      this.render();
      if (typeof HomePage !== 'undefined') HomePage.applyLayout();
      if (typeof toast === 'function') {
        toast(tr('panel.quotes.apiRefreshed', 'Citações externas atualizadas'), 'sparkle');
      }
    } else {
      if (typeof toast === 'function') {
        toast(tr('panel.quotes.apiOfflineFallback', 'Sem conexão agora · usando citações salvas'), 'close');
      }
    }
    return res;
  },

  setStyle(patch) {
    QuotesStore.state.style = Object.assign({}, QuotesStore.state.style, patch || {});
    QuotesStore.state = normalizeQuotesState(QuotesStore.state);
    QuotesStore.save();
    this.render();
  },

  addCustom(text, author) {
    const added = QuotesStore.addCustomQuote(text, author);
    if (!added) return null;
    if (QuotesStore.state.sources && QuotesStore.state.sources.custom) {
      if (!this._activeQuote) this.refreshSelection('sync');
      this.render();
      if (typeof HomePage !== 'undefined') HomePage.applyLayout();
    }
    return added;
  },

  updateCustom(id, text, author) {
    const updated = QuotesStore.updateCustomQuote(id, text, author);
    if (!updated) return null;
    this.refreshSelection('sync');
    this.render();
    if (typeof HomePage !== 'undefined') HomePage.applyLayout();
    return updated;
  },

  deleteCustom(id) {
    const ok = QuotesStore.deleteCustomQuote(id);
    if (!ok) return false;
    this.refreshSelection('sync');
    this.render();
    if (typeof HomePage !== 'undefined') HomePage.applyLayout();
    return true;
  }
};
