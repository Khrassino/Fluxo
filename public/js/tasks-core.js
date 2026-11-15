'use strict';
/* ============ tasks-core.js — lógica pura da página de tarefas ============ */

const TASK_PRIORITIES = [
  { id: 'none',   label: 'Sem prioridade', short: '' },
  { id: 'low',    label: 'Baixa',          short: 'Baixa' },
  { id: 'medium', label: 'Média',          short: 'Média' },
  { id: 'high',   label: 'Alta',           short: 'Alta' }
];

const TASK_PRIORITY_RANK = {
  high: 3,
  medium: 2,
  low: 1,
  none: 0
};

const TASK_DEFAULT_TAGS = ['Estudos', 'Trabalho', 'Pessoal', 'Revisão'];

const TASK_CARD_STYLES = ['glass', 'solid', 'minimal'];
const TASK_DENSITIES = ['comfortable', 'compact'];
const TASK_CHECK_SHAPES = ['rounded', 'circle', 'square'];
const TASK_ANIMS = ['slide', 'fade', 'pop'];
const TASK_SORTS = ['recent', 'oldest', 'due', 'priority', 'alpha'];
const TASK_DEFAULT_DUES = ['none', 'today', 'tomorrow'];

function taskNormalizeText(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function taskLocalDateKey(d) {
  const dt = d instanceof Date ? d : new Date();
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function taskParseDateKey(key) {
  if (typeof key !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
}

function taskAddDaysKey(baseKey, deltaDays) {
  const base = taskParseDateKey(baseKey) || new Date();
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + (Number(deltaDays) || 0));
  return taskLocalDateKey(d);
}

function normalizeDueDate(val) {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  return taskParseDateKey(trimmed) ? trimmed : null;
}

function normalizeTaskPriority(val) {
  const s = String(val || 'none').toLowerCase();
  return Object.prototype.hasOwnProperty.call(TASK_PRIORITY_RANK, s) ? s : 'none';
}

function normalizeTaskTag(val) {
  return String(val || '')
    .replace(/^#+/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 32);
}

function normalizeSubtasks(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (let i = 0; i < raw.length; i++) {
    const it = raw[i];
    if (!it || typeof it !== 'object') continue;
    const text = String(it.text || '').trim().slice(0, 200);
    if (!text) continue;
    out.push({
      id: it.id ? String(it.id) : ('st_' + i + '_' + Math.random().toString(36).slice(2, 7)),
      text,
      done: !!it.done
    });
  }
  return out;
}

function normalizeTaskItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const text = String(raw.text || '').trim().slice(0, 200);
  if (!text) return null;
  const done = !!raw.done;
  return {
    id: raw.id ? String(raw.id) : ('t_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6)),
    text,
    done,
    createdAt: typeof raw.createdAt === 'string' && raw.createdAt ? raw.createdAt : new Date().toISOString(),
    doneAt: done ? (typeof raw.doneAt === 'string' && raw.doneAt ? raw.doneAt : new Date().toISOString()) : null,
    dueDate: normalizeDueDate(raw.dueDate),
    priority: normalizeTaskPriority(raw.priority),
    tag: normalizeTaskTag(raw.tag),
    notes: typeof raw.notes === 'string' ? raw.notes.slice(0, 1000) : '',
    subtasks: normalizeSubtasks(raw.subtasks)
  };
}

function normalizeTasksConfig(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const idleSrc = src.idle && typeof src.idle === 'object' ? src.idle : {};
  const items = Array.isArray(src.items)
    ? src.items.map(normalizeTaskItem).filter(Boolean)
    : [];
  return {
    accent: typeof src.accent === 'string' ? src.accent.trim() : '',
    cardStyle: TASK_CARD_STYLES.includes(src.cardStyle) ? src.cardStyle : 'glass',
    density: TASK_DENSITIES.includes(src.density) ? src.density : 'comfortable',
    checkShape: TASK_CHECK_SHAPES.includes(src.checkShape) ? src.checkShape : 'rounded',
    anim: TASK_ANIMS.includes(src.anim) ? src.anim : 'slide',
    sort: TASK_SORTS.includes(src.sort) ? src.sort : 'recent',
    doneLast: src.doneLast !== false,
    popSound: src.popSound !== false,
    showProgress: !!src.showProgress,
    showSearch: src.showSearch !== false,
    showComposeOpts: src.showComposeOpts !== false,
    showExtraControls: src.showExtraControls !== false,
    showMeta: src.showMeta !== false,
    showCreated: !!src.showCreated,
    highlightOverdue: src.highlightOverdue !== false,
    defaultPriority: normalizeTaskPriority(src.defaultPriority),
    defaultDue: TASK_DEFAULT_DUES.includes(src.defaultDue) ? src.defaultDue : 'none',
    idle: {
      summary: idleSrc.summary !== false,
      composer: !!idleSrc.composer,
      controls: !!idleSrc.controls
    },
    items
  };
}

const TASK_MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function formatShortDatePt(dateKey, todayKeyStr) {
  const dt = taskParseDateKey(dateKey);
  if (!dt) return '';
  const todayDt = taskParseDateKey(todayKeyStr || taskLocalDateKey());
  const sameYear = todayDt ? dt.getFullYear() === todayDt.getFullYear() : true;
  const base = dt.getDate() + ' ' + TASK_MONTHS_SHORT[dt.getMonth()];
  return sameYear ? base : (base + ' ' + String(dt.getFullYear()).slice(-2));
}

function getDueInfo(dueDate, done, todayKeyStr) {
  const key = normalizeDueDate(dueDate);
  if (!key) return { status: 'none', label: '', diffDays: null, dateStr: null };

  const dueDt = taskParseDateKey(key);
  const todayStr = normalizeDueDate(todayKeyStr) || taskLocalDateKey();
  const todayDt = taskParseDateKey(todayStr);
  const diffDays = Math.round((dueDt.getTime() - todayDt.getTime()) / 86400000);
  const shortDate = formatShortDatePt(key, todayStr);

  if (done) {
    return {
      status: 'done',
      label: diffDays === 0 ? 'Para hoje' : shortDate,
      diffDays,
      dateStr: key
    };
  }
  if (diffDays < 0) {
    const late = Math.abs(diffDays);
    return {
      status: 'overdue',
      label: late === 1 ? 'Venceu ontem' : ('Atrasada · ' + late + 'd'),
      diffDays,
      dateStr: key
    };
  }
  if (diffDays === 0) {
    return { status: 'today', label: 'Vence hoje', diffDays: 0, dateStr: key };
  }
  if (diffDays === 1) {
    return { status: 'tomorrow', label: 'Amanhã', diffDays: 1, dateStr: key };
  }
  return { status: 'upcoming', label: shortDate, diffDays, dateStr: key };
}

function computeTaskStats(items, todayKeyStr) {
  const list = Array.isArray(items) ? items : [];
  const todayStr = normalizeDueDate(todayKeyStr) || taskLocalDateKey();
  let done = 0;
  let pending = 0;
  let overdue = 0;
  let dueToday = 0;
  const tagMap = new Map();

  for (let i = 0; i < list.length; i++) {
    const it = list[i];
    if (!it) continue;
    if (it.done) {
      done++;
    } else {
      pending++;
      const due = getDueInfo(it.dueDate, false, todayStr);
      if (due.status === 'overdue') overdue++;
      else if (due.status === 'today') dueToday++;
    }
    const cleanTag = normalizeTaskTag(it.tag);
    if (cleanTag) {
      const k = taskNormalizeText(cleanTag);
      if (!tagMap.has(k)) tagMap.set(k, cleanTag);
    }
  }

  const total = list.length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const tags = Array.from(tagMap.values()).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  return { total, done, pending, overdue, dueToday, percent, tags };
}

function filterAndSortTasks(items, opts, todayKeyStr) {
  const list = Array.isArray(items) ? items.slice() : [];
  const o = opts && typeof opts === 'object' ? opts : {};
  const todayStr = normalizeDueDate(todayKeyStr) || taskLocalDateKey();
  const statusFilter = o.filter || 'all';
  const tagFilter = o.tag ? taskNormalizeText(o.tag) : '';
  const q = taskNormalizeText(o.query || '');
  const sort = TASK_SORTS.includes(o.sort) ? o.sort : 'recent';
  const doneLast = o.doneLast !== false;

  const filtered = list.filter((it) => {
    if (!it) return false;
    const due = getDueInfo(it.dueDate, it.done, todayStr);
    if (statusFilter === 'pending' && it.done) return false;
    if (statusFilter === 'done' && !it.done) return false;
    if (statusFilter === 'today' && (it.done || due.status !== 'today')) return false;
    if (statusFilter === 'overdue' && (it.done || due.status !== 'overdue')) return false;

    if (tagFilter && tagFilter !== 'all') {
      if (taskNormalizeText(it.tag) !== tagFilter) return false;
    }

    if (q) {
      const pLabel = (TASK_PRIORITIES.find(p => p.id === (it.priority || 'none')) || {}).label || '';
      const subTxt = Array.isArray(it.subtasks) ? it.subtasks.map(s => s && s.text ? s.text : '').join(' ') : '';
      const hay = taskNormalizeText([
        it.text,
        it.notes,
        it.tag,
        pLabel,
        due.label,
        it.dueDate || '',
        subTxt
      ].join(' '));
      const tokens = q.split(/\s+/).filter(Boolean);
      for (let i = 0; i < tokens.length; i++) {
        if (!hay.includes(tokens[i])) return false;
      }
    }
    return true;
  });

  filtered.sort((a, b) => {
    if (doneLast && !!a.done !== !!b.done) return a.done ? 1 : -1;

    if (sort === 'due') {
      const da = a.dueDate || '9999-12-31';
      const db = b.dueDate || '9999-12-31';
      if (da !== db) return da.localeCompare(db);
      const pa = TASK_PRIORITY_RANK[a.priority || 'none'] || 0;
      const pb = TASK_PRIORITY_RANK[b.priority || 'none'] || 0;
      if (pa !== pb) return pb - pa;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    }

    if (sort === 'priority') {
      const pa = TASK_PRIORITY_RANK[a.priority || 'none'] || 0;
      const pb = TASK_PRIORITY_RANK[b.priority || 'none'] || 0;
      if (pa !== pb) return pb - pa;
      const da = a.dueDate || '9999-12-31';
      const db = b.dueDate || '9999-12-31';
      if (da !== db) return da.localeCompare(db);
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    }

    if (sort === 'alpha') {
      return (a.text || '').localeCompare(b.text || '', 'pt-BR');
    }

    if (sort === 'oldest') {
      return (a.createdAt || '').localeCompare(b.createdAt || '');
    }

    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  return filtered;
}
