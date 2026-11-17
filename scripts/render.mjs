/** Render the panel to HTML for screenshotting.
 *  node scripts/render.mjs < client.js> <out.html> <width> <scale> <store.json|-> <tab>
 */

// Minimal React stand-in + headless DOM, enough to render the panel and click it.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const downloads = [];
let dirty = false;

// ---- hooks -------------------------------------------------------------
const hookStore = new Map();
let renderingPath = '';
const effects = [];

const React = {
  Fragment: Symbol('Fragment'),
  createElement(type, props, ...children) {
    const merged = Object.assign({}, props || {});
    const flat = [];
    for (const child of children) {
      if (Array.isArray(child)) flat.push(...child);
      else if (child !== null && child !== undefined && child !== false) flat.push(child);
    }
    if (flat.length > 0) merged.children = flat;
    return { type, props: merged };
  },
};
const slots = new Map();
const key = () => renderingPath + '#' + (slots.get(renderingPath) || 0);
React.useState = (init) => {
  const id = key();
  slots.set(renderingPath, (slots.get(renderingPath) || 0) + 1);
  if (!hookStore.has(id)) hookStore.set(id, typeof init === 'function' ? init() : init);
  const set = (next) => {
    const value = typeof next === 'function' ? next(hookStore.get(id)) : next;
    if (value !== hookStore.get(id)) {
      hookStore.set(id, value);
      dirty = true;
    }
  };
  return [hookStore.get(id), set];
};
React.useRef = (init) => {
  const id = 'ref' + key();
  slots.set(renderingPath, (slots.get(renderingPath) || 0) + 1);
  if (!hookStore.has(id)) hookStore.set(id, { current: init });
  return hookStore.get(id);
};
React.useEffect = (fn) => {
  const id = 'fx' + key();
  slots.set(renderingPath, (slots.get(renderingPath) || 0) + 1);
  if (!effects.some((entry) => entry.id === id)) effects.push({ id, fn });
};
React.useMemo = (fn) => fn();
React.useCallback = (fn) => fn;

// ---- dom / window ------------------------------------------------------
const store = {
  version: 3,
  notes: [
    { id: 'n1', text: '导出要能选格式', struck: false, createdAt: '2026-11-16T09:00:00Z', updatedAt: '2026-11-16T09:00:00Z' },
    { id: 'n2', text: '~~这条划掉了~~', struck: false, createdAt: '2026-11-15T09:00:00Z', updatedAt: '2026-11-15T09:00:00Z' },
  ],
  fields: [
    { id: 'f_title', name: '标题', type: 'text', primary: true },
    { id: 'f_status', name: '状态', type: 'select', options: [{ id: 'o1', name: '待开始' }, { id: 'o2', name: '进行中' }] },
    { id: 'f_due', name: '预计结束', type: 'datetime' },
  ],
  todos: [
    { id: 't1', values: { f_title: '写导出菜单', f_status: 'o2', f_due: '2026-11-20T18:00' }, subtasks: [{ id: 's1', text: '子任务甲', done: true }, { id: 's2', text: '子任务乙', done: false }], createdAt: '2026-11-16T08:00:00Z', updatedAt: '2026-11-16T08:00:00Z' },
  ],
  views: [{ id: 'v1', name: '全部待办', type: 'table', columns: [{ fieldId: 'f_title', width: 220 }, { fieldId: 'f_status', width: 116 }, { fieldId: 'f_due', width: 140 }], filters: [], filterMode: 'and', sorts: [], groupBy: null, boardBy: null, dateField: null, collapsed: [] }],
};

const localStorage = {
  getItem: (k) => (k === 'dsh.notes-todo.store.v3' ? JSON.stringify(store) : null),
  setItem: () => {},
  removeItem: () => {},
};

globalThis.window = {
  localStorage,
  innerWidth: 1734,
  innerHeight: 1000,
  setInterval: () => 0,
  clearInterval: () => {},
  setTimeout: (fn) => { if (typeof fn === 'function') fn(); return 0; },
  clearTimeout: () => {},
  requestAnimationFrame: (fn) => { fn(); return 0; },
};
globalThis.document = {
  documentElement: {},
  body: { appendChild: () => {} },
  hidden: false,
  createElement: () => ({ style: {}, click() {}, remove() {}, setAttribute() {} }),
  getComputedStyle: () => ({ backgroundColor: 'rgb(20,27,37)', color: 'rgb(231,238,248)', getPropertyValue: () => '' }),
};
globalThis.URL.createObjectURL = () => 'blob:test';
globalThis.URL.revokeObjectURL = () => {};
try { Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'node' }, configurable: true }); } catch { /* node has its own */ }
// Capture what the panel tries to save.
const realCreate = globalThis.document.createElement;
globalThis.document.createElement = (tag) => {
  const node = realCreate(tag);
  if (tag === 'a') {
    node.click = () => downloads.push(node.download);
  }
  return node;
};

// ---- module load -------------------------------------------------------
let registered = null;
globalThis.window.__ModuleLoader__ = {
  load({ factory }) {
    const exports = factory((name) => {
      if (name === 'react') return React;
      throw new Error('unexpected require ' + name);
    });
    registered = exports;
  },
};

const ctx = {
  slots: {
    register: (meta, component) => {
      if (meta.name === 'main') registered.main = component;
      return () => {};
    },
    inject: (slot, fn) => { fn(); return () => {}; },
  },
  layout: { selectPanel: () => {} },
  get: () => undefined,
  inject: () => {},
  effect: (fn) => { fn(); return () => {}; },
};

const modulePath = process.argv[2];
await import(pathToFileURL(modulePath).href);
registered.apply(ctx);

// ---- renderer ----------------------------------------------------------
function render(node, path) {
  if (node === null || node === undefined || node === false) return null;
  if (typeof node === 'string' || typeof node === 'number') return { text: String(node), path };
  if (Array.isArray(node)) return node.map((child, index) => render(child, path + '/' + index));
  const type = node.type;
  if (typeof type === 'function') {
    const saved = renderingPath;
    renderingPath = path;
    slots.set(path, 0);
    let out;
    try {
      out = type(node.props);
    } finally {
      renderingPath = saved;
    }
    return { type: type.name || 'anon', path, rendered: render(out, path + '>') };
  }
  return {
    type: typeof type === 'symbol' ? 'fragment' : type,
    path,
    props: node.props,
    children: node.props && node.props.children ? render(node.props.children, path + '.') : [],
  };
}

async function paint() {
  let tree = null;
  for (let pass = 0; pass < 60; pass += 1) {
    dirty = false;
    tree = render(React.createElement(registered.main, {}), 'root');
    // Run any newly mounted effect, then let its awaits settle.
    let ran = false;
    for (const effect of effects) {
      if (effect.ran) continue;
      effect.ran = true;
      effect.fn();
      ran = true;
    }
    if (ran) {
      await new Promise((resolve) => setImmediate(resolve));
      continue;
    }
    if (!dirty) break;
  }
  return tree;
}

import { writeFileSync } from 'node:fs';
// Swap in a real store before painting: the panel reads localStorage at mount.
const storePath = process.argv[6] && process.argv[6] !== '-' ? process.argv[6] : '';
if (storePath) {
  const live = JSON.parse(readFileSync(storePath, 'utf8'));
  for (const key of Object.keys(store)) delete store[key];
  Object.assign(store, live);
}
let tree = await paint();

const VOID = new Set(['input', 'img', 'br', 'hr', 'meta', 'link']);
const kebab = (key) => key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
function styleText(style) {
  if (!style) return '';
  const parts = [];
  for (const [key, value] of Object.entries(style)) {
    if (value === null || value === undefined || value === false) continue;
    if (key.startsWith('--')) { parts.push(key + ':' + value); continue; }
    parts.push(kebab(key) + ':' + value);
  }
  return parts.join(';');
}
function escapeHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function toHtml(node) {
  if (node === null || node === undefined) return '';
  if (Array.isArray(node)) return node.map(toHtml).join('');
  if (typeof node.text === 'string') return escapeHtml(node.text);
  if (node.rendered !== undefined) return toHtml(node.rendered);
  const type = node.type === 'fragment' ? null : node.type;
  const props = node.props || {};
  const inner = toHtml(node.children || []);
  const attrs = [];
  const style = styleText(props.style);
  if (style !== '') attrs.push('style="' + style + '"');
  if (props.title) attrs.push('title="' + escapeHtml(props.title) + '"');
  if (props.placeholder !== undefined) attrs.push('placeholder="' + escapeHtml(props.placeholder) + '"');
  if (props.value !== undefined && typeof props.value === 'string') attrs.push('value="' + escapeHtml(props.value) + '"');
  if (type === 'input') { if (props.checked) attrs.push('checked'); attrs.push('type="' + (props.type || 'text') + '"'); }
  if (type === null) return inner;
  const open = '<' + type + (attrs.length ? ' ' + attrs.join(' ') : '') + '>';
  if (VOID.has(type)) return open;
  return open + inner + '</' + type + '>';
}
const width = Number(process.argv[4] || 1180);
const scale = Number(process.argv[5] || 1.2);
const tabLabel = process.argv[7] || 'table';
function walkTree(node, visit) {
  if (node === null || node === undefined) return;
  if (Array.isArray(node)) { node.forEach((child) => walkTree(child, visit)); return; }
  visit(node);
  if (node.children) walkTree(node.children, visit);
  if (node.rendered) walkTree(node.rendered, visit);
}

/** Every clickable button's rendered text, so a scene can name what it wants. */
function buttonText(node) {
  if (!node.props || !Array.isArray(node.props.children)) return '';
  return node.props.children.filter((child) => typeof child === 'string').join('');
}
function findByPrefix(prefix) {
  let hit = null;
  walkTree(tree, (node) => {
    if (hit) return;
    if (node.type !== 'button' || typeof node.props.onClick !== 'function') return;
    const text = buttonText(node);
    if (text.startsWith(prefix) || text.indexOf(prefix) >= 0) hit = node;
  });
  return hit;
}
async function clickSeq(names) {
  for (const name of names) {
    const hit = findByPrefix(name);
    if (!hit) continue;
    hit.props.onClick();
    tree = await paint();
  }
}

// A scene is a comma-separated list of things to click, in order.
// `table` / `notes` keep their old meaning; anything else is matched by label.
const SCENES = {
  table: ['全部待办'],
  notes: [],
  board: ['全部待办', '待办状态分类'],
  fields: ['全部待办', '字段管理'],
  viewsettings: ['全部待办', '视图设置'],
  export: ['全部待办', '导出 ▾'],
  addtodo: ['全部待办', '添加待办'],
  templates: [],
};
if (tabLabel !== 'notes') {
  const scene = SCENES[tabLabel] || [tabLabel];
  await clickSeq(scene);
}
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  :root {
    --dsw-alias-label-primary: #e7eef8;
    --dsw-alias-label-secondary: #8ea2bb;
    --dsw-alias-border-l1: #2a3644;
    --dsw-alias-border-l2: #36465a;
    --dsw-alias-bg-layer-1: #131b25;
    --dsw-alias-bg-layer-2: #1b2532;
    --dsw-alias-state-error-primary: #e5484d;
    --nt-scale: ${scale};
  }
  html, body { margin: 0; background: #0d141c; color: #e7eef8;
    font-family: -apple-system, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif; }
  #stage { width: ${width}px; }
  button { font: inherit; }
  /* A native select renders its first option; keep it legible on dark. */
  select { color: #e7eef8; background: #1b2532; }
  select option { background: #1b2532; color: #e7eef8; }
  input::placeholder, textarea::placeholder { color: #6b7f97; }
</style></head><body><div id="stage">${toHtml(tree)}</div></body></html>`;
writeFileSync(process.argv[3] || 'preview.html', html, 'utf8');
console.log('wrote', process.argv[3], html.length);
