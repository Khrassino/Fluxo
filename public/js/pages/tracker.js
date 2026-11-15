'use strict';
/* ============ pages/tracker.js — progresso ============ */
const TRACKER_TYPES = [
  { id: 'bars',    label: 'Barras',            short: 'Barras' },
  { id: 'line',    label: 'Linha',             short: 'Linha' },
  { id: 'squares', label: 'Heatmap em grade',  short: 'Grade' },
  { id: 'ring',    label: 'Heatmap circular',  short: 'Circular' }
];
const TRACKER_PERIODS = [7, 14, 30, 90, 365];

const TRACKER_LAYOUT = [
  { id: 'header', label: 'Cabeçalho' },
  { id: 'stats',  label: 'Cartões de resumo' },
  { id: 'chart',  label: 'Gráfico principal' },
  { id: 'chart2', label: 'Segundo gráfico' },
  { id: 'goal',   label: 'Meta diária' }
];

const TRACKER_WIDGET_DEFS = [
  { id: 'days',    label: 'Dias de uso',        icon: 'calendar' },
  { id: 'hours',   label: 'Horas de uso',       icon: 'clock' },
  { id: 'tasks',   label: 'Tarefas realizadas', icon: 'checkc' },
  { id: 'focus',   label: 'Sessões de foco',    icon: 'target' },
  { id: 'goal',    label: 'Meta de hoje',       icon: 'flame' },
  { id: 'avg',     label: 'Média diária',       icon: 'chart' },
  { id: 'pending', label: 'Tarefas pendentes',  icon: 'tasks' },
  { id: 'best',    label: 'Melhor dia',         icon: 'sparkle' }
];

const TrackerPage = {
  init() {
    $('#chart-export').innerHTML = svgIcon('download');
    $('#chart-export').addEventListener('click', () => this.exportData());
    const ghost = $('#ghost-tracker');
    if (ghost) ghost.innerHTML = svgIcon('chart');
    this.applyLayout();
    this.renderControls();
    this.render();
  },

  /* -------- cartões de estatísticas personalizáveis -------- */
  widgets() {
    const saved = Array.isArray(Store.state.tracker && Store.state.tracker.widgets) ? Store.state.tracker.widgets : [];
    const out = saved
      .filter(x => TRACKER_WIDGET_DEFS.some(d => d.id === x.id))
      .map(x => ({ id: x.id, on: x.on !== false, size: x.size === '2x' ? '2x' : '1x' }));
    TRACKER_WIDGET_DEFS.forEach(d => {
      if (!out.some(x => x.id === d.id)) {
        const defOn = ['days', 'hours', 'tasks', 'focus', 'goal'].includes(d.id);
        out.push({ id: d.id, on: defOn, size: '1x' });
      }
    });
    return out;
  },

  /* -------- layout arrastável -------- */
  chart2On() {
    const item = this.layout().find(x => x.id === 'chart2');
    return !!(item && item.on);
  },

  layout() {
    const saved = Array.isArray(Store.state.tracker.layout) ? Store.state.tracker.layout : [];
    const out = saved
      .filter(x => TRACKER_LAYOUT.some(d => d.id === x.id))
      .map(x => ({ id: x.id, on: x.on !== false }));
    const c2 = Store.state.tracker.chart2 || {};
    TRACKER_LAYOUT.forEach(d => {
      if (!out.some(x => x.id === d.id)) {
        out.push({ id: d.id, on: d.id === 'chart2' ? !!c2.on : true });
      }
    });
    return out;
  },

  applyLayout() {
    const wrap = $('#tracker-wrap');
    if (!wrap) return;
    const nodes = {
      header: $('#tracker-header'),
      stats:  $('#stats-grid'),
      chart:  $('#chart-card'),
      chart2: $('#chart2-card'),
      goal:   $('#goal-card')
    };
    const seen = {};
    let chart2Visible = false;
    this.layout().forEach(item => {
      const node = nodes[item.id];
      if (!node) return;
      seen[item.id] = true;
      node.hidden = !item.on;
      if (item.id === 'chart2') chart2Visible = item.on;
      wrap.append(node);
    });
    Object.keys(nodes).forEach(id => {
      if (seen[id]) return;
      nodes[id].hidden = false;
      wrap.append(nodes[id]);
    });

    // o segundo gráfico tem uma opção própria no painel; mantém os dois em sincronia
    const tr = Store.state.tracker;
    tr.chart2 = tr.chart2 || { on: false, chart: 'ring', period: 365, yearOffset: 0, metric: 'focus' };
    tr.chart2.on = chart2Visible;
    if (chart2Visible) {
      this.renderChart2Controls();
      this.renderChart2();
    }
  },

  /* -------- controles do gráfico -------- */
  renderControls() {
    const tr = Store.state.tracker;
    const types = $('#chart-types');
    types.innerHTML = '';
    TRACKER_TYPES.forEach(tp => {
      const b = el('button', 'chart-btn' + (tr.chart === tp.id ? ' active' : ''), tp.short || tp.label);
      b.title = 'Gráfico de ' + tp.label.toLowerCase();
      b.setAttribute('aria-label', tp.label);
      b.addEventListener('click', () => {
        Store.state.tracker.chart = tp.id;
        Store.save();
        this.renderControls();
        this.renderChart();
      });
      types.append(b);
    });

    const periods = $('#chart-periods');
    periods.innerHTML = '';
    TRACKER_PERIODS.forEach(p => {
      const b = el('button', 'chart-btn' + (+tr.period === p ? ' active' : ''), p === 365 ? '1 ano' : p + 'd');
      b.title = p === 365 ? 'Ano completo (inclui dias futuros)' : 'Últimos ' + p + ' dias';
      b.addEventListener('click', () => {
        Store.state.tracker.period = p;
        if (p !== 365) Store.state.tracker.yearOffset = 0;
        Store.save();
        this.renderControls();
        this.renderChart();
      });
      periods.append(b);
    });

    const nav = $('#chart-yearnav');
    nav.innerHTML = '';
    const showYear = +tr.period === 365;
    nav.hidden = !showYear;
    if (showYear) {
      const currentYear = new Date().getFullYear();
      const year = currentYear + (Number(tr.yearOffset) || 0);
      const prev = el('button', 'chart-btn year-btn', svgIcon('chevL'));
      prev.title = 'Ano anterior';
      prev.addEventListener('click', () => {
        Store.state.tracker.yearOffset = (Number(tr.yearOffset) || 0) - 1;
        Store.save();
        this.renderControls();
        this.renderChart();
      });
      const next = el('button', 'chart-btn year-btn', svgIcon('chevR'));
      next.title = 'Próximo ano';
      next.disabled = year >= currentYear;
      next.addEventListener('click', () => {
        if (year >= currentYear) return;
        Store.state.tracker.yearOffset = Math.min(0, (Number(tr.yearOffset) || 0) + 1);
        Store.save();
        this.renderControls();
        this.renderChart();
      });
      nav.append(prev, el('span', 'year-label', String(year)), next);
    }

    // Controles do segundo gráfico
    this.renderChart2Controls();
  },

  renderChart2Controls() {
    const tr = Store.state.tracker;
    const c2 = tr.chart2 = tr.chart2 || { on: false, chart: 'ring', period: 365, yearOffset: 0, metric: 'focus' };
    const types = $('#chart2-types');
    if (!types) return;
    types.innerHTML = '';
    TRACKER_TYPES.forEach(tp => {
      const b = el('button', 'chart-btn' + (c2.chart === tp.id ? ' active' : ''), tp.short || tp.label);
      b.title = 'Gráfico de ' + tp.label.toLowerCase();
      b.setAttribute('aria-label', tp.label);
      b.addEventListener('click', () => {
        c2.chart = tp.id;
        Store.save();
        this.renderChart2Controls();
        this.renderChart2();
      });
      types.append(b);
    });

    const periods = $('#chart2-periods');
    if (periods) {
      periods.innerHTML = '';
      TRACKER_PERIODS.forEach(p => {
        const b = el('button', 'chart-btn' + (+c2.period === p ? ' active' : ''), p === 365 ? '1 ano' : p + 'd');
        b.title = p === 365 ? 'Ano completo' : 'Últimos ' + p + ' dias';
        b.addEventListener('click', () => {
          c2.period = p;
          if (p !== 365) c2.yearOffset = 0;
          Store.save();
          this.renderChart2Controls();
          this.renderChart2();
        });
        periods.append(b);
      });
    }

    const nav = $('#chart2-yearnav');
    if (nav) {
      nav.innerHTML = '';
      const showYear = +c2.period === 365;
      nav.hidden = !showYear;
      if (showYear) {
        const currentYear = new Date().getFullYear();
        const year = currentYear + (Number(c2.yearOffset) || 0);
        const prev = el('button', 'chart-btn year-btn', svgIcon('chevL'));
        prev.title = 'Ano anterior';
        prev.addEventListener('click', () => {
          c2.yearOffset = (Number(c2.yearOffset) || 0) - 1;
          Store.save();
          this.renderChart2Controls();
          this.renderChart2();
        });
        const next = el('button', 'chart-btn year-btn', svgIcon('chevR'));
        next.title = 'Próximo ano';
        next.disabled = year >= currentYear;
        next.addEventListener('click', () => {
          if (year >= currentYear) return;
          c2.yearOffset = Math.min(0, (Number(c2.yearOffset) || 0) + 1);
          Store.save();
          this.renderChart2Controls();
          this.renderChart2();
        });
        nav.append(prev, el('span', 'year-label', String(year)), next);
      }
    }
  },

  /* -------- conteúdo -------- */
  render() {
    const tr = Store.state.tracker;
    const streak = Usage.streak();

    if (Store.state.meta.firstDay) {
      const d = new Date(Store.state.meta.firstDay + 'T12:00:00');
      $('#tracker-since').textContent = 'acompanhando desde ' +
        new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
    }

    const today = todayKey();
    const tasksToday = Store.state.tasks.items.filter(i => i.done && (i.doneAt || '').startsWith(today)).length;
    const focusTotal = Object.keys(tr.focusByDay).reduce((s, k) => s + tr.focusByDay[k], 0);
    const focusToday = tr.focusByDay[today] || 0;
    const goalPct = tr.goal > 0 ? Math.round(clamp(Usage.todaySeconds() / (tr.goal * 3600), 0, 1) * 100) : 0;
    const daysUsed = Usage.daysUsed();
    const totalSec = Usage.totalSeconds();
    const avgSec = daysUsed > 0 ? Math.round(totalSec / daysUsed) : 0;
    const pendingTasks = Store.state.tasks.items.filter(i => !i.done).length;
    const totalTasks = Store.state.tasks.items.length;

    // Localiza o melhor dia de foco histórico
    let bestKey = null, bestSec = 0;
    Object.keys(tr.usageByDay || {}).forEach(k => {
      if (tr.usageByDay[k] > bestSec) {
        bestSec = tr.usageByDay[k];
        bestKey = k;
      }
    });
    let bestSub = 'registre seu foco';
    if (bestKey && bestSec > 0) {
      const bd = new Date(bestKey + 'T12:00:00');
      bestSub = 'recorde em ' + new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(bd);
    }

    // Catálogo com dados calculados para os 8 possíveis cartões
    const cardsMap = {
      days: {
        icon: 'calendar', label: 'Dias de uso', value: daysUsed,
        sub: streak > 0 ? ('🔥 sequência de ' + streak + (streak === 1 ? ' dia' : ' dias')) : 'comece hoje sua sequência'
      },
      hours: {
        icon: 'clock', label: 'Horas de uso', raw: totalSec,
        sub: 'hoje: ' + fmtHours(Usage.todaySeconds())
      },
      tasks: {
        icon: 'checkc', label: 'Tarefas realizadas', value: tr.tasksCompleted,
        sub: tasksToday > 0 ? ('+ ' + tasksToday + ' hoje') : 'nenhuma hoje ainda'
      },
      focus: {
        icon: 'target', label: 'Sessões de foco', value: focusTotal,
        sub: focusToday > 0 ? (focusToday + ' hoje') : 'nenhuma hoje ainda'
      },
      goal: {
        icon: 'flame', label: 'Meta de hoje', value: goalPct + '%',
        sub: tr.goal > 0 ? (fmtHours(Usage.todaySeconds()) + ' de ' + tr.goal + 'h') : 'defina uma meta no painel'
      },
      avg: {
        icon: 'chart', label: 'Média diária', raw: avgSec,
        sub: 'por dia ativo'
      },
      pending: {
        icon: 'tasks', label: 'Tarefas pendentes', value: pendingTasks,
        sub: totalTasks ? ('de ' + totalTasks + ' no total') : 'nenhuma pendente'
      },
      best: {
        icon: 'sparkle', label: 'Melhor dia', raw: bestSec,
        sub: bestSub
      }
    };

    const grid = $('#stats-grid');
    grid.innerHTML = '';

    const activeWidgets = this.widgets().filter(w => w.on);
    activeWidgets.forEach(w => {
      const c = cardsMap[w.id];
      if (!c) return;
      const card = el('div', 'stat-card size-' + (w.size || '1x'));
      card.dataset.statId = w.id;
      card.innerHTML =
        '<div class="stat-top"><span class="stat-label">' + c.label + '</span>' + svgIcon(c.icon) + '</div>' +
        '<div class="stat-value"></div><div class="stat-sub"></div>';

      // Ferramentas de edição na tela (visíveis em layout-editing)
      const tools = el('div', 'stat-edit-tools');
      const sizeBtn = el('button', 'stat-edit-btn', w.size === '2x' ? '2x' : '1x');
      sizeBtn.title = 'Alternar tamanho (1x ou 2x)';
      sizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const allW = this.widgets();
        const target = allW.find(x => x.id === w.id);
        if (target) {
          target.size = target.size === '2x' ? '1x' : '2x';
          Store.state.tracker.widgets = allW;
          Store.save();
          this.render();
          if (typeof LayoutEdit !== 'undefined' && LayoutEdit.active) LayoutEdit.decorate();
        }
      });
      const rmBtn = el('button', 'stat-remove-btn', '×');
      rmBtn.title = 'Remover cartão';
      rmBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const allW = this.widgets();
        const target = allW.find(x => x.id === w.id);
        if (target) {
          target.on = false;
          Store.state.tracker.widgets = allW;
          Store.save();
          this.render();
          if (typeof LayoutEdit !== 'undefined' && LayoutEdit.active) LayoutEdit.decorate();
          toast('Cartão removido · recupere na barra inferior', 'eyeoff');
        }
      });
      tools.append(sizeBtn, rmBtn);
      card.append(tools);

      const valEl = $('.stat-value', card);
      if (c.raw != null) { valEl.textContent = fmtHours(c.raw); animateHours(valEl, c.raw); }
      else { valEl.textContent = '0'; this.countUp(valEl, c.value); }
      $('.stat-sub', card).textContent = c.sub;
      grid.append(card);
    });

    const data = this.chartDays();
    this.renderChart(data);
    this.renderChart2();
    this.renderGoal(data);
  },

  countUp(elx, target) {
    const str = String(target);
    const num = parseFloat(str.replace(',', '.')) || 0;
    const suffix = str.replace(/^[\d.,\s-]+/, '');
    if (!num) { elx.textContent = '0' + suffix; return; }
    const t0 = performance.now();
    const dur = 550;
    const step = (now) => {
      const p = clamp((now - t0) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      elx.textContent = Math.round(num * eased).toLocaleString('pt-BR') + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },

  chartDaysFor(period, yearOffset, metric = 'hours') {
    const tr = Store.state.tracker;
    period = TRACKER_PERIODS.includes(+period) ? +period : 7;
    const map = metric === 'focus' ? (tr.focusByDay || {}) : (tr.usageByDay || {});
    const days = [];
    let year = null;
    const now = new Date();
    const todayK = todayKey();

    if (period === 365) {
      year = now.getFullYear() + (Number(yearOffset) || 0);
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = todayKey(d);
        const future = d.getTime() > now.getTime() && key !== todayK;
        const val = map[key] || 0;
        days.push({ d: new Date(d), key: key, sec: val, val: val, today: key === todayK, future: future });
      }
    } else {
      for (let i = period - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = todayKey(d);
        const val = map[key] || 0;
        days.push({ d: d, key: key, sec: val, val: val, today: i === 0, future: false });
      }
    }

    return {
      days: days,
      period: period,
      year: year,
      goalSec: Math.max(0, +tr.goal || 0) * 3600
    };
  },

  chartDays() {
    return this.chartDaysFor(Store.state.tracker.period, Store.state.tracker.yearOffset, 'hours');
  },

  renderChart(data) {
    data = data || this.chartDays();
    const tr = Store.state.tracker;
    const type = TRACKER_TYPES.some(t => t.id === tr.chart) ? tr.chart : 'bars';
    $('#chart-period-label').textContent = data.year
      ? 'Ano de ' + data.year
      : 'Últimos ' + data.period + ' dias';
    const chart = $('#usage-chart');
    chart.innerHTML = '';
    chart.className = 'chart chart-' + type;
    this.paintChart(chart, data, type, true);
  },

  renderChart2() {
    const tr = Store.state.tracker;
    const c2 = tr.chart2 = tr.chart2 || { on: false, chart: 'ring', period: 365, yearOffset: 0, metric: 'focus' };
    const chartCard = $('#chart2-card');
    const chart = $('#usage-chart2');
    if (!chartCard || !chart) return;

    const isHours = c2.metric === 'hours';
    const data = this.chartDaysFor(c2.period, c2.yearOffset, isHours ? 'hours' : 'focus');
    const type = TRACKER_TYPES.some(t => t.id === c2.chart) ? c2.chart : 'ring';

    const pLab = $('#chart2-period-label');
    if (pLab) pLab.textContent = data.year ? 'Ano de ' + data.year : 'Últimos ' + data.period + ' dias';
    const uLab = $('#chart2-unit');
    if (uLab) uLab.textContent = isHours ? 'horas de uso' : 'sessões de foco';

    chart.innerHTML = '';
    chart.className = 'chart chart-' + type;
    this.paintChart(chart, data, type, isHours);
  },

  /* -------- motor dos gráficos -------- */
  paintChart(chart, data, type, isHours) {
    const days = data.days || [];
    const values = days.map(x => isHours ? x.sec : x.val);
    const rawPeak = Math.max(0, ...values);
    const floor = isHours ? 3600 : 1;
    const axisMax = this.niceMax(Math.max(rawPeak, floor), isHours);
    const goal = isHours ? data.goalSec : 0;
    if (type === 'line') this.renderLine(chart, days, axisMax, goal, data.period, isHours);
    else if (type === 'squares') this.renderSquares(chart, days, axisMax, goal, data.period, isHours);
    else if (type === 'ring') this.renderRing(chart, data, axisMax, isHours);
    else this.renderBars(chart, days, axisMax, goal, data.period, isHours);
  },

  niceMax(raw, isHours) {
    if (!Number.isFinite(raw) || raw <= 0) return 1;
    if (isHours) {
      const minutes = raw / 60;
      const steps = [1, 2, 5, 10, 15, 30, 45, 60, 90, 120, 180, 240, 360, 480, 720, 1440];
      const step = steps.find(s => s * 4 >= minutes) || 1440;
      return step * 4 * 60;
    }
    const rough = raw / 4;
    const step = Math.max(1, Math.ceil(rough));
    return step * 4;
  },

  axisLabel(v, isHours) {
    if (!isHours) return String(Math.round(v));
    if (v <= 0) return '0';
    if (v >= 3600) {
      const h = v / 3600;
      return (h % 1 === 0 ? h.toFixed(0) : h.toFixed(1).replace('.', ',')) + 'h';
    }
    return Math.round(v / 60) + 'min';
  },

  levelFor(val, peak) {
    if (!val || val <= 0) return 0;
    const ratio = clamp(val / Math.max(peak || 0, 1), 0, 1);
    return clamp(Math.ceil(ratio * 4), 1, 4);
  },

  svgText(x, y, text, cls, anchor) {
    return '<text class="' + (cls || 'axis-label') + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) +
      '" text-anchor="' + (anchor || 'middle') + '">' + text + '</text>';
  },

  xTickIndexes(days, period) {
    const n = days.length;
    const out = [];
    if (period === 365) {
      days.forEach((x, i) => {
        if (i === 0 || x.d.getDate() === 1) out.push(i);
      });
      return out;
    }
    if (n <= 14) {
      days.forEach((x, i) => out.push(i));
      return out;
    }
    const step = n <= 30 ? 5 : n <= 90 ? 15 : 30;
    for (let i = 0; i < n; i += step) out.push(i);
    if (out[out.length - 1] !== n - 1) out.push(n - 1);
    return out;
  },

  xTickLabel(day, period) {
    if (period === 365) {
      return new Intl.DateTimeFormat('pt-BR', { month: 'short' })
        .format(day.d).replace('.', '').replace(' de ', ' ');
    }
    if (period <= 14) {
      return new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(day.d).replace('.', '');
    }
    return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })
      .format(day.d).replace('.', '').replace(' de ', ' ');
  },

  renderBars(chart, days, axisMax, goalSec, period, isHours) {
    const W = 760, H = 262;
    const ml = 54, mr = 18, mt = 18, mb = 38;
    const pw = W - ml - mr, ph = H - mt - mb;
    const n = Math.max(1, days.length);
    const band = pw / n;
    const thick = clamp(band * 0.62, n > 180 ? 0.8 : n > 90 ? 1.4 : 3, 34);
    const yAt = v => mt + ph - clamp(v / axisMax, 0, 1) * ph;
    let svg = '<svg class="chart-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Gráfico de barras">';

    // eixos e grade
    for (let i = 0; i <= 4; i++) {
      const v = axisMax * i / 4;
      const y = yAt(v);
      svg += '<line class="axis-grid' + (i === 0 ? ' axis-base' : '') + '" x1="' + ml + '" y1="' + y.toFixed(1) +
        '" x2="' + (W - mr) + '" y2="' + y.toFixed(1) + '"/>';
      svg += this.svgText(ml - 9, y + 3.5, this.axisLabel(v, isHours), 'axis-label', 'end');
    }

    if (goalSec > 0 && isHours) {
      const gy = yAt(goalSec);
      svg += '<line class="goal-line-svg" x1="' + ml + '" y1="' + gy.toFixed(1) + '" x2="' + (W - mr) +
        '" y2="' + gy.toFixed(1) + '"/><text class="goal-line-label" x="' + (W - mr) + '" y="' +
        (gy - 5).toFixed(1) + '" text-anchor="end">meta</text>';
    }

    days.forEach((x, i) => {
      const val = isHours ? x.sec : x.val;
      const h = val > 0 ? Math.max(1.8, (val / axisMax) * ph) : (x.future ? 0 : 2);
      const x0 = ml + i * band + (band - thick) / 2;
      const y0 = mt + ph - h;
      const cls = 'cbar' + (x.today ? ' today' : '') + (x.future ? ' future' : '') +
        (goalSec > 0 && val >= goalSec ? ' hit' : '');
      const op = val > 0 ? (0.32 + (val / axisMax) * 0.58).toFixed(2) : '';
      svg += '<rect class="' + cls + '" x="' + x0.toFixed(1) + '" y="' + y0.toFixed(1) + '" width="' +
        Math.max(thick, 0.7).toFixed(1) + '" height="' + h.toFixed(1) + '" rx="' + clamp(thick * 0.28, 0.6, 6).toFixed(1) + '"' +
        (op ? ' style="--bar-op:' + op + '"' : '') + '><title>' + this.dayTitle(x, isHours) + '</title></rect>';
    });

    this.xTickIndexes(days, period).forEach(i => {
      const day = days[i];
      if (!day) return;
      const cx = ml + (i + 0.5) * band;
      svg += this.svgText(cx, H - 14, this.xTickLabel(day, period), 'axis-label axis-x' + (day.today ? ' today' : ''));
    });

    svg += '</svg>';
    chart.append(el('div', 'chart-canvas', svg));
    if (goalSec > 0 && isHours) {
      chart.append(el('p', 'chart-caption', '<i class="legend-dash"></i> linha tracejada: meta de ' + fmtHours(goalSec) + ' por dia'));
    }
  },

  renderLine(chart, days, axisMax, goalSec, period, isHours) {
    const W = 760, H = 262;
    const ml = 54, mr = 18, mt = 18, mb = 38;
    const pw = W - ml - mr, ph = H - mt - mb;
    const n = Math.max(1, days.length);
    const xAt = i => ml + (n === 1 ? pw / 2 : (i / (n - 1)) * pw);
    const yAt = v => mt + ph - clamp(v / axisMax, 0, 1) * ph;
    const gradId = 'chart-grad-' + Math.random().toString(36).slice(2, 8);
    let svg = '<svg class="chart-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Gráfico de linha">' +
      '<defs><linearGradient id="' + gradId + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="var(--accent)" stop-opacity="0.28"/>' +
      '<stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>';

    for (let i = 0; i <= 4; i++) {
      const v = axisMax * i / 4;
      const y = yAt(v);
      svg += '<line class="axis-grid' + (i === 0 ? ' axis-base' : '') + '" x1="' + ml + '" y1="' + y.toFixed(1) +
        '" x2="' + (W - mr) + '" y2="' + y.toFixed(1) + '"/>';
      svg += this.svgText(ml - 9, y + 3.5, this.axisLabel(v, isHours), 'axis-label', 'end');
    }

    if (goalSec > 0 && isHours) {
      const gy = yAt(goalSec);
      svg += '<line class="goal-line-svg" x1="' + ml + '" y1="' + gy.toFixed(1) + '" x2="' + (W - mr) +
        '" y2="' + gy.toFixed(1) + '"/><text class="goal-line-label" x="' + (W - mr) + '" y="' +
        (gy - 5).toFixed(1) + '" text-anchor="end">meta</text>';
    }

    let line = '', area = 'M ' + xAt(0).toFixed(1) + ' ' + (mt + ph).toFixed(1);
    days.forEach((x, i) => {
      const val = isHours ? x.sec : x.val;
      const px = xAt(i), py = yAt(val);
      line += (i === 0 ? 'M ' : ' L ') + px.toFixed(1) + ' ' + py.toFixed(1);
      area += ' L ' + px.toFixed(1) + ' ' + py.toFixed(1);
    });
    area += ' L ' + xAt(n - 1).toFixed(1) + ' ' + (mt + ph).toFixed(1) + ' Z';

    svg += '<path class="line-area" d="' + area + '" fill="url(#' + gradId + ')"/>';
    svg += '<path class="line-path" d="' + line + '"/>';

    const dotEvery = period <= 14 ? 1 : period <= 30 ? 2 : period <= 90 ? 7 : 0;
    days.forEach((x, i) => {
      const val = isHours ? x.sec : x.val;
      const show = x.today || (dotEvery > 0 && i % dotEvery === 0 && val > 0);
      if (!show) return;
      svg += '<circle class="line-dot' + (x.today ? ' today' : '') + '" cx="' + xAt(i).toFixed(1) +
        '" cy="' + yAt(val).toFixed(1) + '" r="' + (x.today ? 4.2 : 2.6) + '"><title>' +
        this.dayTitle(x, isHours) + '</title></circle>';
    });

    // marcador do dia de hoje quando não há valor
    const today = days.find(x => x.today);
    if (today) {
      const i = days.indexOf(today);
      const val = isHours ? today.sec : today.val;
      if (!val) {
        svg += '<circle class="line-dot today empty" cx="' + xAt(i).toFixed(1) + '" cy="' + yAt(0).toFixed(1) + '" r="3.4"/>';
      }
    }

    this.xTickIndexes(days, period).forEach(i => {
      const day = days[i];
      if (!day) return;
      svg += this.svgText(xAt(i), H - 14, this.xTickLabel(day, period), 'axis-label axis-x' + (day.today ? ' today' : ''));
    });

    svg += '</svg>';
    chart.append(el('div', 'chart-canvas', svg));

    const total = days.reduce((s, x) => s + (isHours ? x.sec : x.val), 0);
    const peak = days.reduce((m, x) => Math.max(m, isHours ? x.sec : x.val), 0);
    chart.append(el('div', 'chart-legend',
      '<span><i class="legend-line"></i>tempo diário</span>' +
      '<span><i class="legend-dash"></i>' + (goalSec > 0 && isHours ? 'meta ' + fmtHours(goalSec) : 'sem meta definida') + '</span>' +
      '<span class="legend-spacer"></span>' +
      '<span>total ' + (isHours ? fmtHours(total) : total) + '</span>' +
      '<span>pico ' + (isHours ? fmtHours(peak) : peak) + '</span>'));
  },

  /* heatmap em grade — calendário estilo Anki */
  renderSquares(chart, days, axisMax, goalSec, period, isHours) {
    const cell = clamp(+Store.state.tracker.heatCell || 18, 10, 34);
    const gap = clamp(Math.round(cell * 0.2), 2, 5);
    const n = days.length;
    const compact = n <= 31;
    const wrap = el('div', 'heat-wrap');
    wrap.style.setProperty('--cell', cell + 'px');
    wrap.style.setProperty('--gap', gap + 'px');
    const unit = isHours ? 'uso' : 'focos';
    let grid, months;

    if (compact) {
      // mês em formato de calendário: 7 colunas (seg-dom) e uma linha por semana
      const first = days[0].d;
      const lead = (first.getDay() + 6) % 7; // segunda = 0
      const cells = [];
      for (let i = 0; i < lead; i++) cells.push(null);
      days.forEach(d => cells.push(d));
      const rows = Math.ceil(cells.length / 7);
      months = el('div', 'heat-month-row');
      months.append(el('span', 'heat-month-name',
        new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(first)));
      const weekdays = el('div', 'heat-weekdays');
      ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'].forEach(w => weekdays.append(el('span', null, w)));
      grid = el('div', 'heat-grid heat-compact');
      grid.style.setProperty('--cell', cell + 'px');
      grid.style.setProperty('--gap', gap + 'px');
      grid.style.gridTemplateColumns = 'repeat(7, var(--cell))';
      cells.forEach((day, i) => {
        if (!day) { grid.append(el('i', 'heat-cell blank')); return; }
        grid.append(this.heatCellNode(day, axisMax, goalSec, isHours, cell, i % 7 === 0));
      });
      wrap.append(months);
      const bodyWrap = el('div', 'heat-calendar');
      bodyWrap.append(weekdays, grid);
      wrap.append(bodyWrap);
      if (rows * (cell + gap) > 0) grid.style.gridTemplateRows = 'repeat(' + rows + ', var(--cell))';
    } else {
      // semanas em colunas, dias da semana em linhas
      const first = days[0].d;
      const lead = (first.getDay() + 6) % 7;
      const total = lead + n;
      const weeks = Math.ceil(total / 7);
      grid = el('div', 'heat-grid heat-weeks');
      grid.style.setProperty('--cell', cell + 'px');
      grid.style.setProperty('--gap', gap + 'px');
      grid.style.gridTemplateColumns = 'repeat(' + weeks + ', var(--cell))';
      grid.style.gridTemplateRows = 'repeat(7, var(--cell))';

      // meses alinhados às colunas
      months = el('div', 'heat-months');
      months.style.gridTemplateColumns = 'repeat(' + weeks + ', var(--cell))';
      months.style.setProperty('--gap', gap + 'px');
      let lastMonth = -1;
      days.forEach((day, i) => {
        const col = Math.floor((lead + i) / 7) + 1;
        const m = day.d.getMonth();
        if (m !== lastMonth) {
          lastMonth = m;
          const lab = el('span', 'heat-month', new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(day.d).replace('.', ''));
          lab.style.gridColumn = col;
          months.append(lab);
        }
      });

      const weekdays = el('div', 'heat-weekdays heat-weekdays-col');
      ['seg', '', 'qua', '', 'sex', '', 'dom'].forEach(w => weekdays.append(el('span', null, w)));

      days.forEach((day, i) => {
        const slot = lead + i;
        const col = Math.floor(slot / 7) + 1;
        const row = (slot % 7) + 1;
        const node = this.heatCellNode(day, axisMax, goalSec, isHours, cell, false);
        node.style.gridColumn = col;
        node.style.gridRow = row;
        grid.append(node);
      });
      wrap.append(months);
      const bodyWrap = el('div', 'heat-calendar');
      bodyWrap.append(weekdays, grid);
      wrap.append(bodyWrap);
    }

    const scroller = el('div', 'heat-scroll');
    scroller.append(wrap);
    chart.append(scroller);
    chart.append(this.heatLegend(days, isHours, unit, goalSec));
  },

  heatCellNode(day, axisMax, goalSec, isHours, cell, showDay) {
    const val = isHours ? day.sec : day.val;
    const level = this.levelFor(val, axisMax);
    const node = el('i', 'heat-cell l' + level + (day.today ? ' today' : '') + (day.future ? ' future' : ''));
    node.title = this.dayTitle(day, isHours);
    if (showDay && cell >= 17) node.textContent = String(day.d.getDate());
    return node;
  },

  heatLegend(days, isHours, unit, goalSec) {
    const total = days.reduce((s, x) => s + (isHours ? x.sec : x.val), 0);
    const active = days.filter(x => (isHours ? x.sec : x.val) > 0).length;
    const peak = days.reduce((m, x) => Math.max(m, isHours ? x.sec : x.val), 0);
    const legend = el('div', 'chart-legend heat-legend');
    const scale = el('span', 'heat-scale', '<span>menos</span>');
    for (let i = 0; i <= 4; i++) scale.append(el('i', 'heat-swatch l' + i));
    scale.append(el('span', null, 'mais'));
    legend.append(scale);
    legend.append(el('span', 'legend-spacer'));
    legend.append(el('span', 'legend-stat', '<b>' + (isHours ? fmtHours(total) : total) + '</b> total'));
    legend.append(el('span', 'legend-stat', '<b>' + (isHours ? fmtHours(peak) : peak) + '</b> pico'));
    legend.append(el('span', 'legend-stat', '<b>' + active + '</b> dias'));
    if (isHours && goalSec > 0) legend.append(el('span', 'legend-stat', '<b>' + fmtHours(goalSec) + '</b> meta'));
    return legend;
  },

  /* heatmap circular — espiral compacta de quadradinhos */
  renderRing(chart, data, axisMax, isHours) {
    const days = data.days;
    const n = Math.max(1, days.length);
    const goalSec = isHours ? data.goalSec : 0;
    const cell = clamp(+Store.state.tracker.heatCell || 18, 10, 34);
    const W = 320, H = 320, cx = 160, cy = 160;
    const turns = n <= 14 ? 1.35 : n <= 31 ? 2.0 : n <= 90 ? 3.4 : 5.6;
    const maxR = 136;
    const circumference = 2 * Math.PI * (maxR * 0.56) * turns;
    const size = clamp((circumference / n) * 0.7, 2.2, 9.5) * clamp(cell / 18, 0.74, 1.35);
    const angular = turns * Math.PI * 2;

    let svg = '<svg class="ring-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Heatmap circular">';
    days.forEach((day, i) => {
      const t = n === 1 ? 0 : i / (n - 1);
      const ang = -Math.PI / 2 + t * angular;
      const r = 20 + t * (maxR - 20);
      const x = cx + Math.cos(ang) * r;
      const y = cy + Math.sin(ang) * r;
      const val = isHours ? day.sec : day.val;
      const level = this.levelFor(val, axisMax);
      const deg = (ang * 180 / Math.PI) + 90;
      svg += '<rect class="hm-sq l' + level + (day.today ? ' today' : '') + (day.future ? ' future' : '') +
        '" x="' + (x - size / 2).toFixed(2) + '" y="' + (y - size / 2).toFixed(2) +
        '" width="' + size.toFixed(2) + '" height="' + size.toFixed(2) +
        '" rx="' + clamp(size * 0.24, 0.5, 2.2).toFixed(2) +
        '" transform="rotate(' + deg.toFixed(1) + ' ' + x.toFixed(2) + ' ' + y.toFixed(2) + ')">' +
        '<title>' + this.dayTitle(day, isHours) + '</title></rect>';
    });
    svg += '</svg>';

    const total = days.reduce((s, x) => s + (isHours ? x.sec : x.val), 0);
    const avg = total / Math.max(1, n);
    const active = days.filter(x => (isHours ? x.sec : x.val) > 0).length;
    const today = days.find(x => x.today) || days[days.length - 1];
    const todayVal = isHours ? today.sec : today.val;
    const pct = goalSec > 0 ? clamp(todayVal / goalSec, 0, 1) : clamp(todayVal / Math.max(axisMax, 1), 0, 1);
    const fmtV = v => isHours ? fmtHours(v) : (v + (v === 1 ? ' foco' : ' focos'));

    const wrap = el('div', 'ring-chart');
    wrap.innerHTML = svg +
      '<div class="ring-center">' +
        '<b>' + Math.round(pct * 100) + '%</b>' +
        '<span>' + (goalSec > 0 ? 'da meta de hoje' : 'do maior dia') + '</span>' +
        '<small>' + (isHours ? fmtHours(todayVal) : todayVal + ' hoje') + '</small>' +
      '</div>';
    chart.append(wrap);

    const info = el('div', 'ring-info');
    info.append(
      el('div', 'habit-badge', '<span>total</span><b>' + fmtV(total) + '</b>'),
      el('div', 'habit-badge', '<span>média</span><b>' + fmtV(avg) + '</b>'),
      el('div', 'habit-badge', '<span>dias ativos</span><b>' + active + '</b>')
    );
    chart.append(info);

    const legend = el('div', 'chart-legend heat-legend ring-legend');
    const scale = el('span', 'heat-scale', '<span>menos</span>');
    for (let i = 0; i <= 4; i++) scale.append(el('i', 'heat-swatch l' + i));
    scale.append(el('span', null, 'mais'));
    legend.append(scale);
    chart.append(legend);
  },

  renderGoal(data) {
    data = data || this.chartDays();
    const tr = Store.state.tracker;
    const goalSec = data.goalSec;
    const days = data.days;
    const total = days.reduce((s, x) => s + x.sec, 0);
    const avg = total / Math.max(1, days.length);
    const entry = days.find(x => x.today) || days[days.length - 1];
    const isPastYear = data.year && data.year !== new Date().getFullYear();
    const refSec = isPastYear ? avg : entry.sec;
    const pct = goalSec > 0 ? clamp(refSec / goalSec, 0, 1) : 0;
    const style = tr.goalStyle || 'bar';

    const card = $('#goal-card');
    if (!card) return;
    // preserva o botão de variação criado pelo editor em tela
    const keepVar = card.querySelector('.goal-var-btn');
    card.innerHTML = '';
    card.className = 'goal-card style-' + style;

    const avgStr = 'média: ' + fmtHours(avg);
    const todayStr = isPastYear
      ? 'total: ' + fmtHours(total)
      : 'hoje: ' + fmtHours(entry.sec) + (goalSec > 0 ? ' (' + Math.round(pct * 100) + '%)' : '');
    const goalValStr = goalSec > 0 ? fmtHours(goalSec) + '/dia' : 'sem meta';

    if (style === 'ring') {
      const circ = 2 * Math.PI * 34;
      const offset = circ * (1 - pct);
      card.innerHTML =
        '<div class="goal-ring-layout">' +
          '<div class="goal-ring-box">' +
            '<svg class="goal-ring-svg" viewBox="0 0 80 80">' +
              '<circle class="goal-ring-bg" cx="40" cy="40" r="34"></circle>' +
              '<circle class="goal-ring-fg" cx="40" cy="40" r="34" stroke-dasharray="' + circ.toFixed(1) + '" stroke-dashoffset="' + offset.toFixed(1) + '"></circle>' +
            '</svg>' +
            '<div class="goal-ring-center">' +
              '<span style="color: var(--accent);">' + Math.round(pct * 100) + '%</span>' +
            '</div>' +
          '</div>' +
          '<div class="goal-ring-info">' +
            '<div class="goal-head">' +
              '<span class="goal-title">Meta diária</span>' +
              '<b class="goal-value">' + goalValStr + '</b>' +
            '</div>' +
            '<p class="chart-goal"><span>' + avgStr + '</span><span class="goal-today">' + todayStr + '</span></p>' +
          '</div>' +
        '</div>';
    } else if (style === 'milestones') {
      const stepPcts = [
        clamp(pct / 0.25, 0, 1) * 100,
        clamp((pct - 0.25) / 0.25, 0, 1) * 100,
        clamp((pct - 0.50) / 0.25, 0, 1) * 100,
        clamp((pct - 0.75) / 0.25, 0, 1) * 100
      ];
      card.innerHTML =
        '<div class="goal-head">' +
          '<span class="goal-title">Meta diária (marcos)</span>' +
          '<b class="goal-value">' + goalValStr + '</b>' +
        '</div>' +
        '<div class="goal-milestones-track">' +
          '<div class="goal-step"><span class="goal-step-fill" style="width:' + stepPcts[0].toFixed(1) + '%"></span></div>' +
          '<div class="goal-step"><span class="goal-step-fill" style="width:' + stepPcts[1].toFixed(1) + '%"></span></div>' +
          '<div class="goal-step"><span class="goal-step-fill" style="width:' + stepPcts[2].toFixed(1) + '%"></span></div>' +
          '<div class="goal-step"><span class="goal-step-fill" style="width:' + stepPcts[3].toFixed(1) + '%"></span></div>' +
        '</div>' +
        '<div class="goal-step-labels">' +
          '<span>25%</span><span>50%</span><span>75%</span><span>100%</span>' +
        '</div>' +
        '<p class="chart-goal"><span>' + avgStr + '</span><span class="goal-today">' + todayStr + '</span></p>';
    } else {
      card.innerHTML =
        '<div class="goal-head">' +
          '<span class="goal-title">Meta diária</span>' +
          '<b class="goal-value">' + goalValStr + '</b>' +
        '</div>' +
        '<div class="goal-meter"><span class="goal-meter-fill" style="width:' + (pct * 100).toFixed(1) + '%"></span></div>' +
        '<p class="chart-goal"><span>' + avgStr + '</span><span class="goal-today">' + todayStr + '</span></p>';
    }
    if (keepVar) card.append(keepVar);
  },

  dayTitle(x, isHours = true) {
    const fmt = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
    const formatted = isHours
      ? (x.sec ? fmtHours(x.sec) : (x.future ? 'ainda por vir' : 'sem uso'))
      : (x.val ? (x.val + (x.val === 1 ? ' foco' : ' focos')) : (x.future ? 'ainda por vir' : 'sem foco'));
    return fmt.format(x.d) + ' · ' + formatted;
  },

  exportData() {
    try {
      const payload = {
        app: 'Fluxo',
        version: 1,
        exportedAt: new Date().toISOString(),
        state: Store.state
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fluxo-backup-' + todayKey() + '.json';
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1200);
      toast('Dados exportados em JSON', 'download');
    } catch (e) {
      toast('Não foi possível exportar os dados', 'close');
    }
  },

  /* atualização leve durante o uso */
  softRefresh() {
    if (Router.route !== 'tracker') return;
    const hoursCard = $('#stats-grid .stat-card[data-stat-id="hours"]');
    if (hoursCard) {
      const valEl = $('.stat-value', hoursCard);
      const subEl = $('.stat-sub', hoursCard);
      if (valEl) valEl.textContent = fmtHours(Usage.totalSeconds());
      if (subEl) subEl.textContent = 'hoje: ' + fmtHours(Usage.todaySeconds());
    }
    const goalCard = $('#stats-grid .stat-card[data-stat-id="goal"]');
    if (goalCard) {
      const tr = Store.state.tracker;
      const goalVal = $('.stat-value', goalCard);
      const goalSub = $('.stat-sub', goalCard);
      const pct = tr.goal > 0 ? Math.round(clamp(Usage.todaySeconds() / (tr.goal * 3600), 0, 1) * 100) : 0;
      if (goalVal) goalVal.textContent = pct + '%';
      if (goalSub) goalSub.textContent = tr.goal > 0
        ? (fmtHours(Usage.todaySeconds()) + ' de ' + tr.goal + 'h')
        : 'defina uma meta no painel';
    }

    const data = this.chartDays();
    const now = Date.now();
    const heavy = data.period > 30;
    if (!heavy || now - (this._chartAt || 0) > 12000) {
      this._chartAt = now;
      this.renderChart(data);
      this.renderChart2();
    }
    this.renderGoal(data);
  }
};

function animateHours(elx, totalSec) {
  // anima de 0 até o total em segundos formatado
  const t0 = performance.now();
  const dur = 550;
  const step = (now) => {
    const p = clamp((now - t0) / dur, 0, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    elx.textContent = fmtHours(totalSec * eased);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
