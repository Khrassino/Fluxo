import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function loadTasksContext(initialStorage: Record<string, string> = {}) {
  const storageMap = new Map<string, string>(Object.entries(initialStorage));
  const noop = () => {};

  const sandbox: any = {
    console,
    Math,
    Date,
    Number,
    String,
    Array,
    Object,
    JSON,
    Promise,
    Set,
    Map,
    Intl,
    setTimeout,
    clearTimeout,
    setInterval: () => 1,
    clearInterval: noop,
    localStorage: {
      getItem: (k: string) => storageMap.get(k) ?? null,
      setItem: (k: string, v: string) => storageMap.set(k, String(v)),
      removeItem: (k: string) => storageMap.delete(k),
    },
    indexedDB: { open: () => null, deleteDatabase: noop },
    document: {
      documentElement: { dataset: {}, style: { setProperty: noop, removeProperty: noop } },
      body: { classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, dataset: {} },
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: noop,
    },
    window: {},
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  for (const rel of ['public/js/util.js', 'public/js/tasks-core.js', 'public/js/storage.js']) {
    const code = fs.readFileSync(path.resolve(process.cwd(), rel), 'utf8');
    vm.runInContext(code, sandbox, { filename: rel });
  }
  return sandbox;
}

test('normalizeTaskItem upgrades legacy task objects and normalizes tags/priorities/dates', () => {
  const ctx = loadTasksContext();
  const item = JSON.parse(vm.runInContext(`JSON.stringify(normalizeTaskItem({
    id: 'legacy-1',
    text: '  Estudar Cálculo II  ',
    done: false,
    createdAt: '2026-11-10T10:00:00.000Z',
    dueDate: '2026-11-15',
    priority: 'HIGH',
    tag: '#Estudos  Avançados',
    subtasks: [{ id: 's1', text: 'Capítulo 4', done: true }, { text: '   ' }]
  }))`, ctx));

  assert.equal(item.id, 'legacy-1');
  assert.equal(item.text, 'Estudar Cálculo II');
  assert.equal(item.dueDate, '2026-11-15');
  assert.equal(item.priority, 'high');
  assert.equal(item.tag, 'Estudos Avançados');
  assert.equal(item.notes, '');
  assert.deepEqual(item.subtasks, [{ id: 's1', text: 'Capítulo 4', done: true }]);
});

test('getDueInfo computes overdue, today, tomorrow, upcoming, and completed states accurately', () => {
  const ctx = loadTasksContext();
  const today = '2026-11-15';
  const res = JSON.parse(vm.runInContext(`JSON.stringify({
    overdue3: getDueInfo('2026-11-12', false, '${today}'),
    yesterday: getDueInfo('2026-11-14', false, '${today}'),
    today: getDueInfo('2026-11-15', false, '${today}'),
    tomorrow: getDueInfo('2026-11-16', false, '${today}'),
    upcoming: getDueInfo('2026-11-22', false, '${today}'),
    doneLate: getDueInfo('2026-11-10', true, '${today}')
  })`, ctx));

  assert.equal(res.overdue3.status, 'overdue');
  assert.equal(res.overdue3.label, 'Atrasada · 3d');
  assert.equal(res.yesterday.status, 'overdue');
  assert.equal(res.yesterday.label, 'Venceu ontem');
  assert.equal(res.today.status, 'today');
  assert.equal(res.today.label, 'Vence hoje');
  assert.equal(res.tomorrow.status, 'tomorrow');
  assert.equal(res.tomorrow.label, 'Amanhã');
  assert.equal(res.upcoming.status, 'upcoming');
  assert.equal(res.upcoming.label, '22 nov');
  assert.equal(res.doneLate.status, 'done');
});

test('filterAndSortTasks supports accent-insensitive search, status filters, category filter, and due/priority sorting', () => {
  const ctx = loadTasksContext();
  const today = '2026-11-15';
  vm.runInContext(`
    globalThis.__sample = [
      normalizeTaskItem({ id: '1', text: 'Revisão de Termodinâmica', done: false, createdAt: '2026-11-10T09:00:00Z', dueDate: '2026-11-18', priority: 'low', tag: 'Física', notes: 'Entropia e Carnot' }),
      normalizeTaskItem({ id: '2', text: 'Entregar relatório', done: false, createdAt: '2026-11-11T09:00:00Z', dueDate: '2026-11-13', priority: 'high', tag: 'Trabalho' }),
      normalizeTaskItem({ id: '3', text: 'Ler capítulo 3', done: false, createdAt: '2026-11-12T09:00:00Z', dueDate: '2026-11-15', priority: 'medium', tag: 'Física', subtasks: [{ id: 'a', text: 'Fazer resumo', done: false }] }),
      normalizeTaskItem({ id: '4', text: 'Pagar boleto', done: true, createdAt: '2026-11-09T09:00:00Z', dueDate: '2026-11-12', priority: 'high', tag: 'Pessoal' })
    ];
  `, ctx);

  const bySearch = JSON.parse(vm.runInContext(`JSON.stringify(filterAndSortTasks(__sample, { query: 'termodinamica carnot' }, '${today}').map(x => x.id))`, ctx));
  assert.deepEqual(bySearch, ['1']);

  const bySubtaskSearch = JSON.parse(vm.runInContext(`JSON.stringify(filterAndSortTasks(__sample, { query: 'resumo' }, '${today}').map(x => x.id))`, ctx));
  assert.deepEqual(bySubtaskSearch, ['3']);

  const overdueOnly = JSON.parse(vm.runInContext(`JSON.stringify(filterAndSortTasks(__sample, { filter: 'overdue' }, '${today}').map(x => x.id))`, ctx));
  assert.deepEqual(overdueOnly, ['2']);

  const todayOnly = JSON.parse(vm.runInContext(`JSON.stringify(filterAndSortTasks(__sample, { filter: 'today' }, '${today}').map(x => x.id))`, ctx));
  assert.deepEqual(todayOnly, ['3']);

  const sortedByDue = JSON.parse(vm.runInContext(`JSON.stringify(filterAndSortTasks(__sample, { sort: 'due', doneLast: true }, '${today}').map(x => x.id))`, ctx));
  assert.deepEqual(sortedByDue, ['2', '3', '1', '4']);

  const sortedByPriority = JSON.parse(vm.runInContext(`JSON.stringify(filterAndSortTasks(__sample, { sort: 'priority', doneLast: true }, '${today}').map(x => x.id))`, ctx));
  assert.deepEqual(sortedByPriority, ['2', '3', '1', '4']);

  const stats = JSON.parse(vm.runInContext(`JSON.stringify(computeTaskStats(__sample, '${today}'))`, ctx));
  assert.equal(stats.total, 4);
  assert.equal(stats.done, 1);
  assert.equal(stats.pending, 3);
  assert.equal(stats.overdue, 1);
  assert.equal(stats.dueToday, 1);
  assert.equal(stats.percent, 25);
  assert.deepEqual(stats.tags, ['Física', 'Pessoal', 'Trabalho']);
});

test('Store.load migrates legacy tasks state and preserves valid customization options', () => {
  const legacy = {
    tasks: {
      accent: '#4ecb9d',
      cardStyle: 'minimal',
      density: 'compact',
      checkShape: 'circle',
      sort: 'due',
      items: [
        { id: 'old-1', text: 'Tarefa antiga', done: false, createdAt: '2026-10-01T12:00:00Z', doneAt: null }
      ]
    }
  };
  const ctx = loadTasksContext({ 'fluxo-state-v1': JSON.stringify(legacy) });
  const loaded = JSON.parse(vm.runInContext('JSON.stringify(Store.load().tasks)', ctx));

  assert.equal(loaded.accent, '#4ecb9d');
  assert.equal(loaded.cardStyle, 'minimal');
  assert.equal(loaded.density, 'compact');
  assert.equal(loaded.checkShape, 'circle');
  assert.equal(loaded.sort, 'due');
  assert.equal(loaded.showProgress, false);
  assert.equal(loaded.showSearch, true);
  assert.equal(loaded.showComposeOpts, true);
  assert.equal(loaded.showExtraControls, true);
  assert.equal(loaded.items.length, 1);
  assert.equal(loaded.items[0].priority, 'none');
  assert.equal(loaded.items[0].dueDate, null);
  assert.deepEqual(loaded.items[0].subtasks, []);
});

test('normalizeTasksConfig respects custom visibility toggles for minimalist tasks UI', () => {
  const ctx = loadTasksContext({
    'fluxo-state-v1': JSON.stringify({
      tasks: {
        showProgress: true,
        showSearch: false,
        showComposeOpts: false,
        showExtraControls: false,
        showMeta: false,
        showCreated: true,
        highlightOverdue: false
      }
    })
  });
  const loaded = JSON.parse(vm.runInContext('JSON.stringify(Store.load().tasks)', ctx));
  assert.equal(loaded.showProgress, true);
  assert.equal(loaded.showSearch, false);
  assert.equal(loaded.showComposeOpts, false);
  assert.equal(loaded.showExtraControls, false);
  assert.equal(loaded.showMeta, false);
  assert.equal(loaded.showCreated, true);
  assert.equal(loaded.highlightOverdue, false);
});

