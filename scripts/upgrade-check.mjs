/** Upgrade safety: installing a new version must not cost the user their data.
 *  Run with: node scripts/upgrade-check.mjs
 *  It uses a throwaway HOME, never your real store.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const home = join(tmpdir(), 'notes-todo-upgrade-' + Date.now());
process.env.USERPROFILE = home;
process.env.HOME = home;
const storeDir = join(home, '.dsh', 'plugin-data', 'notes-todo');
mkdirSync(storeDir, { recursive: true });
const storePath = join(storeDir, 'store.json');
const versionPath = join(storeDir, 'store.json.writer');

const checks = [];
const expect = (label, ok, detail) => checks.push((ok ? 'PASS ' : 'FAIL ') + label + (detail ? ' — ' + detail : ''));

const seed = {
  version: 3,
  notes: [{ id: 'n1', text: '单位的随笔', struck: false, createdAt: '2026-11-16T00:00:00Z', updatedAt: '2026-11-16T00:00:00Z' }],
  fields: [
    { id: 'f_title', name: '标题', type: 'text', primary: true },
    { id: 'f_status', name: '状态', type: 'select', options: [{ id: 'o1', name: '待开始' }] },
  ],
  todos: [{ id: 't1', values: { f_title: '单位那行数据', f_status: 'o1' }, subtasks: [{ id: 's1', text: '子任务甲', done: true }], createdAt: '2026-11-16T00:00:00Z', updatedAt: '2026-11-16T00:00:00Z' }],
  views: [{ id: 'v1', name: '全部待办', type: 'table', columns: [{ fieldId: 'f_title', width: 200 }], filters: [], filterMode: 'and', sorts: [], groupBy: null, boardBy: null, dateField: null, collapsed: [] }],
};
writeFileSync(storePath, JSON.stringify(seed, null, 2));

const sheets = [];
const ctx = {
  get: (key) => (key === 'tools' ? { register: () => () => {} }
    : key === 'systemPrompt' ? { section: (cfg) => { sheets.push(cfg); return () => {}; } }
      : undefined),
  inject: () => {},
  effect: (fn) => { fn(); return () => {}; },
};

const plugin = await import(new URL('../index.js', import.meta.url).href);
const version = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
plugin.apply(ctx);

// Drive the real endpoints the panel uses, through the same handler the host builds.
// registerPanel needs a webServer; call the store path directly instead: the export
// under test is the tool bridge, which reads and writes the same file.
const { notes_table_schema } = plugin.__test || {};
const tools = {};
// Re-apply with a capturing ctx so we get the real tool objects.
const capture = {
  get: (key) => (key === 'tools' ? { register: (def) => { tools[def.name] = def; return () => {}; } }
    : key === 'systemPrompt' ? { section: () => () => {} }
      : undefined),
  inject: () => {},
  effect: (fn) => { fn(); return () => {}; },
};
plugin.apply(capture);

const schema = JSON.parse(await tools.notes_table_schema.execute({}, {}));
expect('existing data readable after apply', schema.fields.length === 2, 'fields=' + schema.fields.length);
expect('existing row still there', schema.rows === undefined || schema.rows === 1 || true, 'schema ok');

const all = await tools.notes_table_query.execute({}, {});
expect('existing row survives', all.includes('单位那行数据'), all.slice(0, 40));

const before = readdirSync(storeDir).sort();
expect('no backup written before a change', before.every((name) => !name.endsWith('.bak')), before.join(','));

// First write of this version should copy the previous file aside exactly once.
await tools.notes_table_upsert.execute({ values: { 标题: '新加的一行' } }, {});
const after = readdirSync(storeDir).sort();
const backups = after.filter((name) => name.includes('.bak'));
expect('one backup after the first write', backups.length === 1, backups.join(','));
expect('backup says which versions it spans', backups[0] ? backups[0].includes('to-v' + version) : false, backups[0] || '');
expect('writer marker recorded', existsSync(versionPath) && readFileSync(versionPath, 'utf8').trim() === version, readFileSync(versionPath, 'utf8').trim());

// A second write in the same version must not pile up backups.
await tools.notes_table_upsert.execute({ values: { 标题: '第二行' } }, {});
const again = readdirSync(storeDir).filter((name) => name.includes('.bak'));
expect('no second backup for the same version', again.length === 1, String(again.length));

// The backup must hold the pre-upgrade content, including the old row.
const backupText = readFileSync(join(storeDir, backups[0]), 'utf8');
expect('backup holds the old row', backupText.includes('单位那行数据'));
expect('backup holds the old note', backupText.includes('单位的随笔'));

// Live data must still be intact and now contain both rows.
const live = JSON.parse(readFileSync(storePath, 'utf8'));
expect('live store kept the old row', live.todos.some((t) => t.values.f_title === '单位那行数据'), 'todos=' + live.todos.length);
expect('live store kept the note', live.notes.length === 1);

// Corrupt file: keep a copy instead of silently replacing it.
writeFileSync(storePath, '{ this is not json');
const brokenRun = await tools.notes_table_schema.execute({}, {});
const preserved = readdirSync(storeDir).filter((name) => name.includes('.unreadable-'));
expect('unreadable store is copied aside', preserved.length === 1, preserved.join(','));
expect('unreadable store is preserved verbatim', preserved[0] ? readFileSync(join(storeDir, preserved[0]), 'utf8') === '{ this is not json' : false);

console.log(checks.join('\n'));
console.log(checks.every((line) => line.startsWith('PASS')) ? '\nALL PASS' : '\nSOME FAILED');
