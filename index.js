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

import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** Panel channel prefix; the Client half calls `rpc.call(CHANNEL, endpoint, payload)`. */
const CHANNEL = '/dsh-notes-todo';
const MAX_BODY_BYTES = 8 * 1024 * 1024;
const DATA_DIR = join(homedir(), '.dsh', 'plugin-data', 'notes-todo');
const DATA_FILE = join(DATA_DIR, 'store.json');

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

function readStore() {
  try {
    return normalizeStore(JSON.parse(readFileSync(DATA_FILE, 'utf8')));
  } catch {
    return emptyStore();
  }
}

/** Write through a temporary file so a crash cannot leave half a store behind. */
function writeStore(store) {
  mkdirSync(DATA_DIR, { recursive: true });
  const temporary = `${DATA_FILE}.tmp`;
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
    return { store, dataFile: DATA_FILE, savedAt: new Date().toISOString() };
  },
};

export function apply(ctx) {
  registerPanel(ctx);
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
