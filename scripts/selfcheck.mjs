/** Headless check for the agent bridge: fake ctx, fake host services, real tools.
 *  Run with: node scripts/selfcheck.mjs
 *  It writes to a throwaway HOME, never to your real store.
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const home = join(tmpdir(), 'notes-todo-selfcheck-' + Date.now());
process.env.USERPROFILE = home;
process.env.HOME = home;
const storeDir = join(home, '.dsh', 'plugin-data', 'notes-todo');
mkdirSync(storeDir, { recursive: true });

const seed = {
  version: 3,
  notes: [{ id: 'n1', text: '客户说要加导出', struck: false, createdAt: '2026-11-16T00:00:00Z', updatedAt: '2026-11-16T00:00:00Z' }],
  fields: [
    { id: 'f_title', name: '标题', type: 'text', primary: true },
    { id: 'f_status', name: '状态', type: 'select', options: [{ id: 'o1', name: '待办' }, { id: 'o2', name: '进行中' }, { id: 'o3', name: '完成' }] },
    { id: 'f_tags', name: '标签', type: 'multiselect', options: [{ id: 'g1', name: '前端' }, { id: 'g2', name: '后端' }] },
    { id: 'f_due', name: '截止', type: 'datetime' },
    { id: 'f_done', name: '已完成', type: 'checkbox' },
  ],
  todos: [{ id: 't_seed', values: { f_title: '旧的一行', f_status: 'o1', f_tags: ['g1'], f_due: '2026-12-01', f_done: false }, subtasks: [{ id: 's1', text: '子任务甲', done: false }], createdAt: '2026-11-16T00:00:00Z', updatedAt: '2026-11-16T00:00:00Z' }],
  views: [{ id: 'v1', name: '总表', type: 'table', columns: [{ fieldId: 'f_title', width: 200 }], filters: [{ fieldId: 'f_status', op: 'is', value: '进行中' }], filterMode: 'and', sorts: [], groupBy: null, boardBy: null, dateField: null, collapsed: [] }],
};
writeFileSync(join(storeDir, 'store.json'), JSON.stringify(seed, null, 2));

const registered = {};
const sections = [];
const ctx = {
  get: (key) => (key === 'tools' ? { register: (def) => { registered[def.name] = def; return () => {}; } }
    : key === 'systemPrompt' ? { section: (cfg) => { sections.push(cfg); return () => {}; } }
      : undefined),
  inject: () => {},
  effect: (fn) => { fn(); return () => {}; },
};

const plugin = await import(new URL('../index.js', import.meta.url).href);
plugin.apply(ctx);

const checks = [];
const expect = (label, ok, detail) => checks.push((ok ? 'PASS ' : 'FAIL ') + label + (detail ? ' — ' + detail : ''));

expect('three tools registered', Object.keys(registered).length === 3, Object.keys(registered).join(', '));
expect('prompt section injected', sections.length > 0 && sections[0].text.includes('标题'));

const schema = JSON.parse(await registered.notes_table_schema.execute({}, {}));
expect('schema lists 5 fields', schema.fields.length === 5);

const wrote = await registered.notes_table_upsert.execute({ values: { 标题: '官网改版', 状态: '进行中', 标签: ['前端', '后端'], 截止: '2026-12-20', 已完成: '是' } }, {});
expect('upsert creates a row', wrote.startsWith('已新建一行'), wrote.slice(0, 32));

const badOption = await registered.notes_table_upsert.execute({ values: { 状态: '不存在的选项' } }, {});
expect('bad option rejected with options listed', badOption.includes('可选：待办/进行中/完成'));

const badKey = await registered.notes_table_upsert.execute({ values: { 没有这个字段: 1 } }, {});
expect('unknown field rejected', badKey.includes('没有字段'));

const all = await registered.notes_table_query.execute({}, {});
expect('query sees both rows', all.includes('共 2 行'));

const view = await registered.notes_table_query.execute({ view: '总表' }, {});
expect('view filter applied', view.includes('共 1 行'));

const search = await registered.notes_table_query.execute({ search: '子任务甲' }, {});
expect('subtask search works', search.includes('共 1 行'));

const disk = JSON.parse(readFileSync(join(storeDir, 'store.json'), 'utf8'));
expect('row persisted with option ids', disk.todos.length === 2 && disk.todos[0].values.f_status === 'o2');
expect('prompt section refreshed after write', sections.length >= 2);

console.log(checks.join('\n'));
console.log(checks.every((line) => line.startsWith('PASS')) ? '\nALL PASS' : '\nSOME FAILED');
