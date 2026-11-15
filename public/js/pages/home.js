'use strict';
/* ============ pages/home.js — página inicial ============ */
const HOME_LAYOUT = [
  { id: 'greet', label: 'Saudação', idle: false },
  { id: 'clock', label: 'Relógio', locked: true, idle: true },
  { id: 'date',  label: 'Data', idle: false },
  { id: 'chips', label: 'Atalhos', idle: false }
];

const HOME_CHIP_DEFS = [
  { id: 'focus',     label: 'Iniciar foco',      icon: 'play' },
  { id: 'summary',   label: 'Resumo do dia',     icon: 'clock' },
  { id: 'tasks',     label: 'Tarefas pendentes', icon: 'tasks' },
  { id: 'streak',    label: 'Sequência de dias', icon: 'flame' },
  { id: 'music',     label: 'Música de fundo',   icon: 'music' },
  { id: 'stopwatch', label: 'Cronômetro',        icon: 'timer' },
  { id: 'newTask',   label: 'Nova tarefa',       icon: 'plus' },
  { id: 'tracker',   label: 'Ver progresso',     icon: 'chart' },
  { id: 'panel',     label: 'Personalizar',      icon: 'sliders' }
];

const HomePage = {
  init() {
    this.applyLayout();
    this.renderChips();
    this.clockTick();
    setInterval(() => this.clockTick(), 1000);
  },

  layout() {
    const saved = Array.isArray(Store.state.home && Store.state.home.layout) ? Store.state.home.layout : [];
    const out = saved
      .filter(x => HOME_LAYOUT.some(d => d.id === x.id))
      .map(x => {
        const def = HOME_LAYOUT.find(d => d.id === x.id);
        const isClock = x.id === 'clock';
        return {
          id: x.id,
          on: isClock ? true : x.on !== false,
          idle: isClock ? true : (x.idle !== false && (x.idle != null || def.idle)),
          locked: isClock
        };
      });
    HOME_LAYOUT.forEach(d => {
      if (!out.some(x => x.id === d.id)) out.push({ id: d.id, on: true, idle: !!d.idle, locked: !!d.locked });
    });
    return out;
  },

  chipsLayout() {
    const saved = Array.isArray(Store.state.home && Store.state.home.chips) ? Store.state.home.chips : [];
    const out = saved
      .filter(x => HOME_CHIP_DEFS.some(d => d.id === x.id))
      .map(x => ({ id: x.id, on: x.on !== false }));
    HOME_CHIP_DEFS.forEach(d => {
      if (!out.some(x => x.id === d.id)) {
        const defOn = ['focus', 'summary', 'tasks', 'streak', 'music'].includes(d.id);
        out.push({ id: d.id, on: defOn });
      }
    });
    return out;
  },

  applyLayout() {
    const wrap = $('#home-wrap');
    if (!wrap) return;
    const nodes = {
      greet: $('#home-greet'),
      clock: $('#home-clock'),
      date:  $('#home-date'),
      chips: $('#home-chips')
    };
    const seen = {};
    this.layout().forEach(item => {
      const node = nodes[item.id];
      if (!node) return;
      seen[item.id] = true;
      node.hidden = item.id === 'clock' ? false : !item.on;
      node.classList.toggle('idle-hide', item.idle === false);
      wrap.append(node);
    });
    Object.keys(nodes).forEach(id => {
      if (seen[id]) return;
      nodes[id].hidden = false;
      wrap.append(nodes[id]);
    });
  },

  clockTick() {
    const d = new Date();
    const h = d.getHours();
    let greet = 'Boa noite';
    if (h < 5) greet = 'Boa madrugada';
    else if (h < 12) greet = 'Bom dia';
    else if (h < 18) greet = 'Boa tarde';
    $('#home-greet').textContent = greet;
    $('#home-clock').textContent =
      String(h).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    $('#home-date').textContent = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long'
    }).format(d);
  },

  renderChips() {
    const box = $('#home-chips');
    box.innerHTML = '';

    const list = this.chipsLayout().filter(c => c.on);
    const t = Store.state.timer;
    const today = todayKey();
    const todaySec = Usage.todaySeconds();
    const focusToday = Store.state.tracker.focusByDay[today] || 0;
    const pending = Store.state.tasks.items.filter(it => !it.done).length;
    const streak = Usage.streak();

    list.forEach(item => {
      let chip = null;
      switch (item.id) {
        case 'focus': {
          chip = el('button', 'home-chip home-chip-focus', svgIcon('play') + '<span></span>');
          chip.lastChild.textContent = 'iniciar foco · ' + (t.durations.focus || 25) + 'min';
          chip.addEventListener('click', () => {
            if (typeof TimerPage !== 'undefined') TimerPage.quickFocus();
          });
          break;
        }
        case 'summary': {
          chip = el('button', 'home-chip', svgIcon('clock') + '<span></span>');
          chip.lastChild.textContent = fmtHours(todaySec) + ' hoje' +
            (focusToday ? ' · ' + focusToday + (focusToday === 1 ? ' foco' : ' focos') : '');
          chip.addEventListener('click', () => { location.hash = '#/progresso'; });
          break;
        }
        case 'tasks': {
          chip = el('button', 'home-chip', svgIcon('tasks') + '<span></span>');
          chip.lastChild.textContent = pending === 0 ? 'nenhuma tarefa pendente' : (pending + (pending === 1 ? ' tarefa pendente' : ' tarefas pendentes'));
          chip.addEventListener('click', () => { location.hash = '#/tarefas'; });
          break;
        }
        case 'streak': {
          chip = el('button', 'home-chip', svgIcon('flame') + '<span></span>');
          chip.lastChild.textContent = streak > 0
            ? (streak + (streak === 1 ? ' dia seguido' : ' dias seguidos'))
            : 'iniciar sequência';
          chip.addEventListener('click', () => { location.hash = '#/progresso'; });
          break;
        }
        case 'music': {
          chip = el('button', 'home-chip',
            svgIcon('music') + '<span id="music-chip-label"></span><span class="mini" id="music-chip-toggle"></span>');
          chip.addEventListener('click', () => {
            if (Store.state.music.track === 'none') Sound.play('rain');
            else Sound.toggle();
          });
          break;
        }
        case 'stopwatch': {
          chip = el('button', 'home-chip', svgIcon('timer') + '<span></span>');
          chip.lastChild.textContent = 'cronômetro';
          chip.addEventListener('click', () => {
            if (typeof TimerPage !== 'undefined') TimerPage.setTab('stopwatch');
            location.hash = '#/cronometro';
          });
          break;
        }
        case 'newTask': {
          chip = el('button', 'home-chip', svgIcon('plus') + '<span></span>');
          chip.lastChild.textContent = 'nova tarefa';
          chip.addEventListener('click', () => {
            location.hash = '#/tarefas';
            setTimeout(() => { const inp = $('#tasks-input'); if (inp) inp.focus(); }, 260);
          });
          break;
        }
        case 'tracker': {
          chip = el('button', 'home-chip', svgIcon('chart') + '<span></span>');
          chip.lastChild.textContent = 'ver progresso';
          chip.addEventListener('click', () => { location.hash = '#/progresso'; });
          break;
        }
        case 'panel': {
          chip = el('button', 'home-chip', svgIcon('sliders') + '<span></span>');
          chip.lastChild.textContent = 'personalizar';
          chip.addEventListener('click', () => { Panel.open(); });
          break;
        }
      }
      if (chip) {
        chip.dataset.chipId = item.id;
        box.append(chip);
      }
    });

    this.updateMusicChip();
  },

  updateMusicChip() {
    const label = $('#music-chip-label');
    const toggle = $('#music-chip-toggle');
    if (!label || !toggle) return;
    const track = Store.state.music.track;
    if (track === 'none') {
      label.textContent = 'música de fundo';
      toggle.innerHTML = svgIcon('play');
    } else {
      label.textContent = TRACK_LABELS[track] || 'música';
      toggle.innerHTML = Sound.playing ? svgIcon('pause') : svgIcon('play');
    }
  }
};
