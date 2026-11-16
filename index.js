/** Host half of the 「随手记 · 待办」 plugin.
 *
 * One JSON store backs every tab of the panel:
 *  - notes: free-form text
 *  - fields: the user-defined column table (text / datetime / select /
 *    multiselect / checkbox); fields can be added, renamed and deleted
 *  - todos: rows over that table, with an optional subtask checklist
 *  - views: named tabs, each with its own column order and widths, filters,
 *    sorts, grouping, and a type (table / board / calendar)
 * The Client half reaches it through the `/dsh-notes-todo` channel over
 * `connection.rpc`, and keeps a browser-local mirror of the same store.
 *
 * The package is link-installed from the workspace, so it imports only Node
 * builtins: Harness packages resolve inside the profile, not from here.
 */

import { randomUUID } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** Panel channel prefix; the Client half calls `rpc.call(CHANNEL, endpoint, payload)`. */
const CHANNEL = '/dsh-notes-todo';
const MAX_BODY_BYTES = 8 * 1024 * 1024;
const DATA_DIR = join(homedir(), '.dsh', 'plugin-data', 'notes-todo');
const DATA_FILE = join(DATA_DIR, 'store.json');
/** Which plugin version last wrote the store. A sidecar, so the store schema stays clean. */
const VERSION_FILE = join(DATA_DIR, 'store.json.writer');

/** Read from package.json so the marker cannot drift away from the shipped version. */
const PLUGIN_VERSION = (() => {
  try {
    return JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version || 'unknown';
  } catch {
    return 'unknown';
  }
})();

const FIELD_TYPES = new Set(['text', 'datetime', 'select', 'multiselect', 'checkbox', 'person']);
const VIEW_TYPES = new Set(['table', 'board', 'calendar']);
const FILTER_OPS = new Set([
  'contains',
  'is',
  'empty',
  'notEmpty',
  'beforeToday',
  'afterToday',
  'onToday',
  'isTrue',
  'isFalse',
]);
const SORT_DIRS = new Set(['asc', 'desc']);

export const name = 'notes-todo';
export const inject = [];

/** Coerce one field: strings are capped so a single record cannot bloat the file. */
function text(value, max) {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

function clampNumber(value, low, high, fallback) {
  const number = typeof value === 'number' ? value : Number.parseFloat(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(high, Math.max(low, Math.round(number)));
}

function emptyStore() {
  return { version: 3, notes: [], fields: [], todos: [], views: [] };
}

function normalizeOptions(raw) {
  const options = [];
  const seen = new Set();
  for (const option of Array.isArray(raw) ? raw : []) {
    if (option === null || typeof option !== 'object') continue;
    const id = text(option.id, 64);
    const name = text(option.name, 40).trim();
    if (id === '' || name === '' || seen.has(id)) continue;
    seen.add(id);
    options.push({ id, name });
  }
  return options;
}

function normalizeField(raw) {
  if (raw === null || typeof raw !== 'object') return null;
  const id = text(raw.id, 64);
  const name = text(raw.name, 40).trim();
  if (id === '' || name === '') return null;
  const type = FIELD_TYPES.has(raw.type) ? raw.type : 'text';
  const field = { id, name, type };
  if (raw.primary === true) field.primary = true;
  if (type === 'select' || type === 'multiselect' || type === 'person') field.options = normalizeOptions(raw.options);
  return field;
}

function normalizeNote(raw) {
  if (raw === null || typeof raw !== 'object') return null;
  const id = text(raw.id, 64);
  if (id === '') return null;
  return {
    id,
    text: text(raw.text, 20000),
    struck: raw.struck === true,
    createdAt: text(raw.createdAt, 32),
    updatedAt: text(raw.updatedAt, 32),
  };
}

function normalizeSubtasks(raw) {
  const subtasks = [];
  for (const entry of Array.isArray(raw) ? raw : []) {
    if (entry === null || typeof entry !== 'object') continue;
    const id = text(entry.id, 64);
    if (id === '') continue;
    subtasks.push({ id, text: text(entry.text, 500), done: entry.done === true });
  }
  return subtasks;
}

/** Keep only values the current field table can represent. */
function normalizeTodo(raw, fields) {
  if (raw === null || typeof raw !== 'object') return null;
  const id = text(raw.id, 64);
  if (id === '') return null;
  const source = raw.values !== null && typeof raw.values === 'object' ? raw.values : {};
  const values = {};
  for (const field of fields) {
    const value = source[field.id];
    if (field.type === 'checkbox') {
      values[field.id] = value === true;
    } else if (field.type === 'multiselect') {
      const known = new Set((field.options || []).map((option) => option.id));
      const picked = Array.isArray(value) ? value : [];
      values[field.id] = picked.filter((entry) => typeof entry === 'string' && known.has(entry));
    } else if (field.type === 'select' || field.type === 'person') {
      const known = (field.options || []).some((option) => option.id === value);
      values[field.id] = known ? text(value, 64) : '';
    } else {
      values[field.id] = text(value, field.type === 'text' ? 4000 : 32);
    }
  }
  return {
    id,
    values,
    subtasks: normalizeSubtasks(raw.subtasks),
    createdAt: text(raw.createdAt, 32),
    updatedAt: text(raw.updatedAt, 32),
  };
}

function normalizeView(raw, fieldIds, fields) {
  if (raw === null || typeof raw !== 'object') return null;
  const id = text(raw.id, 64);
  const name = text(raw.name, 40).trim();
  if (id === '' || name === '') return null;

  const columns = [];
  const seen = new Set();
  for (const entry of Array.isArray(raw.columns) ? raw.columns : []) {
    if (entry === null || typeof entry !== 'object') continue;
    const fieldId = text(entry.fieldId, 64);
    if (!fieldIds.has(fieldId) || seen.has(fieldId)) continue;
    seen.add(fieldId);
    columns.push({ fieldId, width: clampNumber(entry.width, 60, 640, 120) });
  }
  // A v2 view kept a flat `fieldIds` list; read it so an older store round-trips
  // through the host without losing which columns the user had chosen.
  if (columns.length === 0) {
    for (const entry of Array.isArray(raw.fieldIds) ? raw.fieldIds : []) {
      if (typeof entry !== 'string' || !fieldIds.has(entry) || seen.has(entry)) continue;
      seen.add(entry);
      columns.push({ fieldId: entry, width: columns.length === 0 ? 200 : 116 });
    }
  }

  const filters = [];
  for (const entry of Array.isArray(raw.filters) ? raw.filters : []) {
    if (entry === null || typeof entry !== 'object') continue;
    const fieldId = text(entry.fieldId, 64);
    const op = text(entry.op, 24);
    if (!fieldIds.has(fieldId) || !FILTER_OPS.has(op)) continue;
    filters.push({ fieldId, op, value: text(entry.value, 400) });
  }
  // Same for the single-filter shape.
  if (filters.length === 0 && raw.filter !== null && typeof raw.filter === 'object') {
    const fieldId = text(raw.filter.fieldId, 64);
    const op = text(raw.filter.op, 24);
    if (fieldIds.has(fieldId) && FILTER_OPS.has(op)) {
      filters.push({ fieldId, op, value: text(raw.filter.value, 400) });
    }
  }

  const sorts = [];
  for (const entry of Array.isArray(raw.sorts) ? raw.sorts : []) {
    if (entry === null || typeof entry !== 'object') continue;
    const fieldId = text(entry.fieldId, 64);
    const dir = text(entry.dir, 8);
    if (!fieldIds.has(fieldId) || !SORT_DIRS.has(dir)) continue;
    sorts.push({ fieldId, dir });
  }

  const pickField = (value, allowed) => {
    const fieldId = text(value, 64);
    if (!fieldIds.has(fieldId)) return null;
    if (allowed === null) return fieldId;
    const field = fields.find((entry) => entry.id === fieldId);
    return field && allowed.has(field.type) ? fieldId : null;
  };

  return {
    id,
    name,
    type: VIEW_TYPES.has(raw.type) ? raw.type : 'table',
    columns,
    filters,
    filterMode: raw.filterMode === 'or' ? 'or' : 'and',
    sorts,
    groupBy: pickField(raw.groupBy, new Set(['select', 'person', 'multiselect', 'checkbox'])),
    boardBy: pickField(raw.boardBy, new Set(['select', 'person', 'checkbox'])),
    dateField: pickField(raw.dateField, new Set(['datetime'])),
    collapsed: (Array.isArray(raw.collapsed) ? raw.collapsed : []).filter((entry) => typeof entry === 'string'),
  };
}

/** Accept whatever the Client sends, keeping only well-formed records. */
function normalizeStore(raw) {
  if (raw === null || typeof raw !== 'object') return emptyStore();

  const fields = [];
  for (const entry of Array.isArray(raw.fields) ? raw.fields : []) {
    const field = normalizeField(entry);
    if (field !== null) fields.push(field);
  }
  const fieldIds = new Set(fields.map((field) => field.id));

  const todos = [];
  for (const entry of Array.isArray(raw.todos) ? raw.todos : []) {
    const todo = normalizeTodo(entry, fields);
    if (todo !== null) todos.push(todo);
  }

  const views = [];
  for (const entry of Array.isArray(raw.views) ? raw.views : []) {
    const view = normalizeView(entry, fieldIds, fields);
    if (view !== null) views.push(view);
  }

  const notes = [];
  for (const entry of Array.isArray(raw.notes) ? raw.notes : []) {
    const note = normalizeNote(entry);
    if (note !== null) notes.push(note);
  }

  return { version: 3, fields, notes, todos, views };
}

/**
 * Keep a copy of a store we cannot parse. Without this, one bad byte becomes an
 * empty store in memory, and the next save writes that emptiness over the file.
 */
function preserveUnreadable() {
  try {
    if (!existsSync(DATA_FILE)) return '';
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const target = DATA_FILE + '.unreadable-' + stamp + '.bak';
    copyFileSync(DATA_FILE, target);
    return target;
  } catch {
    return '';
  }
}

function readStore() {
  try {
    return normalizeStore(JSON.parse(readFileSync(DATA_FILE, 'utf8')));
  } catch {
    preserveUnreadable();
    return emptyStore();
  }
}

/**
 * A new plugin version must never cost the user their data. The store lives
 * outside the plugin folder, so installing does not touch it; on the first write
 * of a newly installed version the previous file is also copied aside once.
 */
function backupForUpgrade() {
  try {
    const previous = existsSync(VERSION_FILE) ? readFileSync(VERSION_FILE, 'utf8').trim() : '';
    if (previous !== '' && previous === PLUGIN_VERSION) return '';
    let target = '';
    if (existsSync(DATA_FILE)) {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      target = DATA_FILE + '.v' + (previous || 'legacy') + '-to-v' + PLUGIN_VERSION + '.' + stamp + '.bak';
      copyFileSync(DATA_FILE, target);
    }
    writeFileSync(VERSION_FILE, PLUGIN_VERSION, 'utf8');
    return target;
  } catch {
    // A failed backup must never block a save the user is waiting on.
    return '';
  }
}

/** Write through a temporary file so a crash cannot leave half a store behind. */
function writeStore(store) {
  mkdirSync(DATA_DIR, { recursive: true });
  backupForUpgrade();
  const temporary = DATA_FILE + '.tmp';
  writeFileSync(temporary, JSON.stringify(store, null, 2), 'utf8');
  renameSync(temporary, DATA_FILE);
}

const endpoints = {
  state() {
    return { store: readStore(), dataFile: DATA_FILE };
  },
  save(payload) {
    const store = normalizeStore(payload.store);
    writeStore(store);
    signalStoreChanged(store);
    return { store, dataFile: DATA_FILE, savedAt: new Date().toISOString() };
  },
};

export function apply(ctx) {
  registerPanel(ctx);
  registerAgentBridge(ctx);
}

/** HTTP channel backing the panel. Degrades silently without webServer. */
function registerPanel(ctx) {
  const serviceOf = (key) => {
    try {
      return ctx.get(key);
    } catch {
      return undefined;
    }
  };

  const reply = (response, status, payload) => {
    response.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    });
    response.end(JSON.stringify(payload));
  };

  const fail = (message) => ({ ok: false, error: { code: 'internal', message, details: {} } });

  const readBody = async (request) => {
    const chunks = [];
    let size = 0;
    for await (const chunk of request) {
      const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      size += buffer.length;
      if (size > MAX_BODY_BYTES) throw new Error('请求体过大');
      chunks.push(buffer);
    }
    return Buffer.concat(chunks).toString('utf8');
  };

  const sameOrigin = (request) => {
    const origin = request.headers.origin;
    if (typeof origin !== 'string' || origin === '') return true;
    try {
      return new URL(origin).host === (request.headers.host ?? '');
    } catch {
      return false;
    }
  };

  const handler = async (request, response) => {
    try {
      const rejection = serviceOf('connection')?.requestRejection?.(request);
      if (rejection !== undefined) {
        response.writeHead(rejection);
        response.end(rejection === 401 ? 'unauthorized' : 'forbidden');
        return;
      }
      if (!sameOrigin(request)) {
        response.writeHead(403);
        response.end('cross-origin request refused');
        return;
      }
      if (request.method !== 'POST') {
        response.writeHead(405);
        response.end('method not allowed');
        return;
      }

      const pathname = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;
      const endpoint = pathname.startsWith(`${CHANNEL}/`)
        ? decodeURIComponent(pathname.slice(CHANNEL.length + 1))
        : '';
      const entry = endpoints[endpoint];
      if (entry === undefined) {
        reply(response, 404, {
          type: 'server-response',
          rpcId: '',
          result: fail(`未知端点 ${endpoint}`),
        });
        return;
      }

      let message = {};
      try {
        const raw = await readBody(request);
        message = raw === '' ? {} : JSON.parse(raw);
      } catch {
        reply(response, 400, {
          type: 'server-response',
          rpcId: '',
          result: fail('请求体不是 JSON'),
        });
        return;
      }

      const rpcId = typeof message.rpcId === 'string' ? message.rpcId : '';
      if (message.type !== 'client-request' || message.method !== endpoint) {
        reply(response, 400, { type: 'server-response', rpcId, result: fail('请求信封非法') });
        return;
      }
      const payload =
        message.payload !== null && typeof message.payload === 'object' ? message.payload : {};

      let result;
      try {
        result = { ok: true, value: await entry(payload) };
      } catch (error) {
        result = fail(error instanceof Error ? error.message : String(error));
      }
      reply(response, 200, { type: 'server-response', rpcId, result });
    } catch {
      try {
        response.writeHead(500);
        response.end('handler failure');
      } catch {
        /* response already closed */
      }
    }
  };

  const attach = (webServer) => {
    if (webServer === undefined || typeof webServer.register !== 'function') return;
    try {
      const disposing = webServer.register({ kind: 'prefix', path: CHANNEL, handler });
      ctx.effect(() => () => {
        try {
          void disposing();
        } catch {
          /* unload-time cleanup must not fail the other plugins */
        }
      }, 'notes-todo: panel rpc');
    } catch {
      /* a route conflict leaves the store on disk readable */
    }
  };

  const existing = serviceOf('webServer');
  if (existing !== undefined) {
    attach(existing);
    return;
  }
  try {
    ctx.inject(['webServer'], (scope) => attach(scope.webServer));
  } catch {
    /* no webServer in this profile: the panel falls back to browser-local data */
  }
}

/* ---------------------------------------------------------------------------
 * Agent bridge: the table the model may read and write.
 *
 * Three tools plus one prompt section. The store is the same store.json the
 * panel edits, so a row the model writes shows up in the panel on its next
 * refresh. No network, no second source of truth.
 * ------------------------------------------------------------------------- */

const TOOL_PROMPT_ORDER = 6100;
const PROMPT_FIELD_LIMIT = 24;
const QUERY_DEFAULT_LIMIT = 20;
const QUERY_MAX_LIMIT = 100;

/** Set once the agent bridge is registered; endpoints.save calls through it. */
let onStoreChanged = null;

function signalStoreChanged(store) {
  if (typeof onStoreChanged !== 'function') return;
  try {
    onStoreChanged(store);
  } catch {
    /* a stale prompt section must never break a save */
  }
}

function displayValue(field, raw) {
  if (field.type === 'checkbox') return raw === true ? '是' : '';
  if (field.type === 'multiselect') {
    const picked = Array.isArray(raw) ? raw : [];
    return (field.options || [])
      .filter((option) => picked.includes(option.id))
      .map((option) => option.name)
      .join('、');
  }
  if (field.type === 'select' || field.type === 'person') {
    const hit = (field.options || []).find((option) => option.id === raw);
    return hit === undefined ? '' : hit.name;
  }
  return typeof raw === 'string' ? raw : '';
}

function rowView(store, todo) {
  const values = {};
  for (const field of store.fields) {
    const shown = displayValue(field, todo.values[field.id]);
    if (shown !== '') values[field.name] = shown;
  }
  const row = { id: todo.id, values };
  if (todo.subtasks.length > 0) {
    row.subtasks = todo.subtasks.map((entry) => (entry.done ? '[x] ' : '[ ] ') + entry.text);
  }
  return row;
}

function findField(store, key) {
  const needle = text(key, 64).trim();
  if (needle === '') return null;
  return (
    store.fields.find((field) => field.id === needle) ||
    store.fields.find((field) => field.name === needle) ||
    null
  );
}

function findView(store, key) {
  const needle = text(key, 64).trim();
  if (needle === '') return null;
  return (
    store.views.find((view) => view.id === needle) ||
    store.views.find((view) => view.name === needle) ||
    null
  );
}

function dayOf(value) {
  return typeof value === 'string' ? value.slice(0, 10) : '';
}

function todayOf() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
}

function matchesFilter(field, todo, filter) {
  const shown = displayValue(field, todo.values[field.id]);
  const day = dayOf(todo.values[field.id]);
  const wanted = text(filter.value, 400).trim();
  switch (filter.op) {
    case 'contains':
      return wanted === '' ? true : shown.includes(wanted);
    case 'is':
      return shown.trim() === wanted;
    case 'empty':
      return shown === '';
    case 'notEmpty':
      return shown !== '';
    case 'beforeToday':
      return day !== '' && day < todayOf();
    case 'afterToday':
      return day !== '' && day > todayOf();
    case 'onToday':
      return day === todayOf();
    case 'isTrue':
      return todo.values[field.id] === true;
    case 'isFalse':
      return todo.values[field.id] !== true;
    default:
      return true;
  }
}

/** Rows of one view (or all rows when view is null), filtered, sorted, searched. */
function viewRows(store, view, query) {
  const needle = text(query, 200).trim().toLowerCase();
  const filters = view === null ? [] : view.filters.filter((filter) => findField(store, filter.fieldId) !== null);
  let rows = store.todos.filter((todo) => {
    if (filters.length > 0) {
      const hits = filters.map((filter) => matchesFilter(findField(store, filter.fieldId), todo, filter));
      const pass = view.filterMode === 'or' ? hits.some(Boolean) : hits.every(Boolean);
      if (!pass) return false;
    }
    if (needle === '') return true;
    const haystack =
      store.fields.map((field) => displayValue(field, todo.values[field.id])).join(' ') +
      ' ' +
      todo.subtasks.map((entry) => entry.text).join(' ');
    return haystack.toLowerCase().includes(needle);
  });
  if (view !== null && view.sorts.length > 0) {
    rows = rows.slice().sort((left, right) => {
      for (const sort of view.sorts) {
        const field = findField(store, sort.fieldId);
        if (field === null) continue;
        const a = displayValue(field, left.values[field.id]);
        const b = displayValue(field, right.values[field.id]);
        if (a === b) continue;
        const result = a < b ? -1 : 1;
        return sort.dir === 'desc' ? -result : result;
      }
      return 0;
    });
  }
  return rows;
}

/** Turn one model-supplied value into what the store keeps for that field. */
function coerceValue(field, raw) {
  if (field.type === 'checkbox') {
    if (raw === true || raw === 'true' || raw === '是' || raw === '1' || raw === 1) return { value: true };
    if (raw === undefined || raw === null || raw === '' || raw === false || raw === 'false' || raw === '否' || raw === '0' || raw === 0) {
      return { value: false };
    }
    return { error: '勾选字段 ' + field.name + ' 只接受是 / 否' };
  }
  if (field.type === 'multiselect') {
    const options = field.options || [];
    const list = Array.isArray(raw)
      ? raw
      : String(raw === undefined || raw === null ? '' : raw).split(/[,，、;；\s]+/).filter((entry) => entry !== '');
    const picked = [];
    for (const entry of list) {
      const wanted = String(entry).trim();
      const option = options.find((item) => item.name === wanted || item.id === wanted);
      if (option === undefined) {
        return { error: '多选字段 ' + field.name + ' 没有选项「' + wanted + '」，可选：' + options.map((item) => item.name).join('/') };
      }
      if (!picked.includes(option.id)) picked.push(option.id);
    }
    return { value: picked };
  }
  if (field.type === 'select' || field.type === 'person') {
    const wanted = String(raw === undefined || raw === null ? '' : raw).trim();
    if (wanted === '') return { value: '' };
    const options = field.options || [];
    const option = options.find((item) => item.name === wanted || item.id === wanted);
    if (option === undefined) {
      const kind = field.type === 'person' ? '人员字段 ' : '单选字段 ';
      return { error: kind + field.name + ' 没有选项「' + wanted + '」，可选：' + options.map((item) => item.name).join('/') };
    }
    return { value: option.id };
  }
  if (field.type === 'datetime') {
    const wanted = String(raw === undefined || raw === null ? '' : raw).trim().replace(' ', 'T');
    if (wanted === '') return { value: '' };
    if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/.test(wanted)) {
      return { error: '时间字段 ' + field.name + ' 需要 YYYY-MM-DD 或 YYYY-MM-DDTHH:mm，收到「' + wanted + '」' };
    }
    return { value: wanted.slice(0, 32) };
  }
  const plain = raw === undefined || raw === null ? '' : String(raw);
  return { value: plain.slice(0, 4000) };
}

function textOutput() {
  return { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: value }] };
}

/** The three tool specs, in the concise form defineTool() takes. */
function agentTools() {
  return [
    {
      name: 'notes_table_schema',
      description:
        "Read the shape of the user's personal table inside the notes-todo panel: fields (name, type, options), saved views, and row counts. 读取用户在「笔记 / 表」面板里那张表的字段与视图结构；写行之前先看它。",
      parameters: {},
      output: textOutput(),
      async execute() {
        const store = readStore();
        return JSON.stringify(
          {
            fields: store.fields.map((field) => ({
              name: field.name,
              id: field.id,
              type: field.type,
              options: (field.options || []).map((option) => option.name),
            })),
            views: store.views.map((view) => ({ name: view.name, id: view.id, type: view.type })),
            rows: store.todos.length,
            notes: store.notes.length,
            dataFile: DATA_FILE,
          },
          null,
          2,
        );
      },
    },
    {
      name: 'notes_table_query',
      description:
        "Read rows from the user's personal table (notes-todo panel). Applies one saved view's filters and sorts, plus an optional keyword. 读取用户那张表里的行。",
      parameters: {
        view: { type: 'string', description: '视图名或 id；留空 = 第一张视图的筛选与排序不生效，直接看全部行。' },
        search: { type: 'string', description: '在整行文字（含子任务）里模糊搜索的关键词，可留空。' },
        limit: { type: 'string', description: '最多返回几行，默认 20，上限 100。' },
      },
      output: textOutput(),
      async execute(args) {
        const store = readStore();
        const view = findView(store, args?.view);
        const asked = Number.parseInt(String(args?.limit === undefined ? '' : args.limit), 10);
        const limit = Number.isFinite(asked)
          ? Math.min(QUERY_MAX_LIMIT, Math.max(1, asked))
          : QUERY_DEFAULT_LIMIT;
        const rows = viewRows(store, view, args?.search);
        const head = view === null ? '全部行' : '视图「' + view.name + '」';
        const slice = rows.slice(0, limit).map((todo) => rowView(store, todo));
        return (
          head + ' 共 ' + rows.length + ' 行，返回 ' + slice.length + ' 行：\n' + JSON.stringify(slice, null, 2)
        );
      },
    },
    {
      name: 'notes_table_upsert',
      description:
        "Create or update one row in the user's personal table (notes-todo panel). Keys are field names; select fields take the option name. 往用户那张表里新建或更新一行。",
      parameters: {
        values: {
          type: 'json',
          required: true,
          description: '对象：字段名 → 值。例如 {"项目":"官网","状态":"进行中","截止":"2026-12-01"}。新建时不用给 id。',
        },
        rowId: { type: 'string', description: '要更新的行 id（先用 notes_table_query 查）；留空 = 新建一行。' },
      },
      output: textOutput(),
      async execute(args) {
        const store = readStore();
        if (store.fields.length === 0) return '这张表还没有字段：先在面板里加字段，再来写行。';
        const raw = args?.values;
        if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
          return 'values 必须是一个对象：字段名 → 值。';
        }
        const values = {};
        const problems = [];
        for (const [key, value] of Object.entries(raw)) {
          const field = findField(store, key);
          if (field === null) {
            problems.push('没有字段「' + key + '」');
            continue;
          }
          const coerced = coerceValue(field, value);
          if (coerced.error !== undefined) {
            problems.push(coerced.error);
            continue;
          }
          values[field.id] = coerced.value;
        }
        if (problems.length > 0) {
          return '没写入：' + problems.join('；') + '。当前字段：' + store.fields.map((field) => field.name).join(' / ');
        }
        if (Object.keys(values).length === 0) return '没写入：values 是空的。';
        const stamp = new Date().toISOString();
        const wantedId = text(args?.rowId, 64).trim();
        const existing = wantedId === '' ? undefined : store.todos.find((todo) => todo.id === wantedId);
        if (wantedId !== '' && existing === undefined) {
          return '没写入：找不到行 ' + wantedId + '。先用 notes_table_query 查 id。';
        }
        let saved;
        if (existing === undefined) {
          saved = {
            id: 't_' + randomUUID().slice(0, 8),
            values,
            subtasks: [],
            createdAt: stamp,
            updatedAt: stamp,
          };
          store.todos = [saved].concat(store.todos);
        } else {
          saved = {
            id: existing.id,
            values: Object.assign({}, existing.values, values),
            subtasks: existing.subtasks,
            createdAt: existing.createdAt,
            updatedAt: stamp,
          };
          store.todos = store.todos.map((todo) => (todo.id === existing.id ? saved : todo));
        }
        const next = normalizeStore(store);
        writeStore(next);
        signalStoreChanged(next);
        const kept = next.todos.find((todo) => todo.id === saved.id);
        return (existing === undefined ? '已新建一行：' : '已更新一行：') + JSON.stringify(rowView(next, kept), null, 2);
      },
    },
  ];
}

/** What the model is told about the table, kept short so it costs little. */
function buildPromptText(store) {
  if (store.fields.length === 0) return '';
  const fields = store.fields
    .slice(0, PROMPT_FIELD_LIMIT)
    .map((field) => {
      const options = field.options && field.options.length > 0
        ? '[' + field.options.map((option) => option.name).join('/') + ']'
        : '';
      return field.name + '(' + field.type + options + ')';
    })
    .join('、');
  const views = store.views.length === 0 ? '无' : store.views.map((view) => view.name).join('、');
  return [
    '用户在「笔记 / 表」面板（插件 notes-todo）里维护着一张自己定义结构的表。',
    '字段：' + fields + '。',
    '视图：' + views + '；现有 ' + store.todos.length + ' 行、' + store.notes.length + ' 条随笔。',
    '涉及这张表的问题先调 notes_table_schema 或 notes_table_query 再回答，不要凭记忆猜；',
    '用户说「记进表里 / 加一行 / 更新那条」时调 notes_table_upsert，键用上面的中文字段名，单选多选写选项名，时间写 YYYY-MM-DD 或 YYYY-MM-DDTHH:mm。',
  ].join('');
}

/** Stand-in for defineTool() when the host package cannot be resolved. */
function fallbackTool(spec) {
  const properties = {};
  const required = [];
  for (const [key, value] of Object.entries(spec.parameters || {})) {
    const node = value === null || typeof value !== 'object' ? {} : value;
    if (node.type === 'json') {
      properties[key] = {};
    } else {
      properties[key] = { type: node.type === 'number' ? 'number' : 'string' };
      if (typeof node.description === 'string') properties[key].description = node.description;
    }
    if (node.required === true) required.push(key);
  }
  return {
    name: spec.name,
    description: spec.description,
    parameters: required.length > 0
      ? { type: 'object', properties, required }
      : { type: 'object', properties },
    output: { schema: spec.output.schema, render: spec.output.render },
    execute: spec.execute,
  };
}

function resolveDefineTool() {
  try {
    const require = createRequire(import.meta.url);
    const mod = require('@deepseek-ai/dsh-tools');
    return typeof mod.defineTool === 'function' ? mod.defineTool : null;
  } catch {
    return null;
  }
}

function registerAgentBridge(ctx) {
  const serviceOf = (key) => {
    try {
      return ctx.get(key);
    } catch {
      return undefined;
    }
  };

  const defineTool = resolveDefineTool();
  const makeTool = (spec) => (defineTool === null ? fallbackTool(spec) : defineTool(spec));

  let promptService = null;
  let sectionDispose = null;

  const refreshPrompt = () => {
    if (promptService === null || typeof promptService.section !== 'function') return;
    if (typeof sectionDispose === 'function') {
      try {
        sectionDispose();
      } catch {
        /* the host may already have dropped the section */
      }
    }
    sectionDispose = null;
    const content = buildPromptText(readStore());
    if (content === '') return;
    try {
      sectionDispose = promptService.section({
        name: 'plugin:notes-todo',
        order: TOOL_PROMPT_ORDER,
        text: content,
        interpolate: false,
      });
    } catch {
      sectionDispose = null;
    }
  };

  const attachTools = (tools) => {
    if (tools === null || typeof tools !== 'object' || typeof tools.register !== 'function') return;
    for (const spec of agentTools()) {
      try {
        ctx.effect(() => tools.register(makeTool(spec)), 'notes-todo: tool ' + spec.name);
      } catch {
        /* one tool failing must not take the panel down */
      }
    }
  };

  const attachPrompt = (service) => {
    promptService = service;
    refreshPrompt();
  };

  onStoreChanged = () => refreshPrompt();

  const tools = serviceOf('tools');
  if (tools !== undefined) attachTools(tools);
  else {
    try {
      ctx.inject(['tools'], (scope) => attachTools(scope.tools));
    } catch {
      /* profile without a tool registry: the panel still works */
    }
  }

  const sections = serviceOf('systemPrompt');
  if (sections !== undefined) attachPrompt(sections);
  else {
    try {
      ctx.inject(['systemPrompt'], (scope) => attachPrompt(scope.systemPrompt));
    } catch {
      /* profile without prompt sections: the tools still work */
    }
  }
}
