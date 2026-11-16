/** Record every canvas call the PNG export makes, so the card can be checked
 *  without a browser. Run with: node scripts/png-check.mjs client.js
 */
const ops = [];
const state = { fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, font: '', textBaseline: 'middle' };

function makeContext() {
  const ctx2d = {};
  for (const key of ['fillStyle', 'strokeStyle', 'lineWidth', 'font', 'textBaseline']) {
    Object.defineProperty(ctx2d, key, {
      get: () => state[key],
      set: (value) => { state[key] = value; },
    });
  }
  const record = (name, args) => ops.push({ name, args, lineWidth: state.lineWidth, font: state.font });
  for (const name of ['beginPath', 'closePath', 'fill', 'stroke', 'save', 'restore', 'clip', 'scale']) {
    ctx2d[name] = (...args) => record(name, args);
  }
  ctx2d.moveTo = (x, y) => record('moveTo', [x, y]);
  ctx2d.lineTo = (x, y) => record('lineTo', [x, y]);
  ctx2d.rect = (x, y, w, h) => record('rect', [x, y, w, h]);
  ctx2d.fillRect = (x, y, w, h) => record('fillRect', [x, y, w, h]);
  ctx2d.strokeRect = (x, y, w, h) => record('strokeRect', [x, y, w, h]);
  ctx2d.quadraticCurveTo = (...args) => record('quadraticCurveTo', args);
  ctx2d.fillText = (text, x, y) => record('fillText', [text, x, y]);
  ctx2d.measureText = (text) => ({ width: String(text).length * 7 });
  return ctx2d;
}

const fakeCanvas = {
  width: 0,
  height: 0,
  getContext: () => makeContext(),
  toBlob: (callback) => callback(null),
};
/** Headless click-through for the client half: renders the real Panel with a
 *  tiny React stand-in, opens the 导出 menu on both tabs and asserts the files.
 *  Run with: node scripts/client-check.mjs
 *  Nothing here touches a real store or a real browser.
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
    { id: 't2', values: { f_title: '拆分表格线', f_status: 'o1', f_due: '2026-11-21T09:00' }, subtasks: [], createdAt: '2026-11-16T07:00:00Z', updatedAt: '2026-11-16T07:00:00Z' },
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
let tree = await paint();


// ---- drive the export ---------------------------------------------------
const factoryCreate = globalThis.document.createElement;
globalThis.document.createElement = (tag) => (tag === 'canvas' ? fakeCanvas : factoryCreate(tag));

function walkTree(node, visit) {
  if (node === null || node === undefined) return;
  if (Array.isArray(node)) { node.forEach((child) => walkTree(child, visit)); return; }
  visit(node);
  if (node.children) walkTree(node.children, visit);
  if (node.rendered) walkTree(node.rendered, visit);
}

function clickButton(label) {
  let hit = null;
  walkTree(tree, (node) => {
    if (hit !== null) return;
    if (node.type === 'button' && node.props && Array.isArray(node.props.children)) {
      if (node.props.children.filter((kid) => typeof kid === 'string').join('') === label) hit = node;
    }
  });
  return hit;
}

function clickExportItem(label) {
  let hit = null;
  walkTree(tree, (node) => {
    if (hit !== null) return;
    if (node.type === 'button' && node.props && Array.isArray(node.props.children)) {
      const kids = node.props.children;
      if (kids.some((kid) => kid && kid.props && Array.isArray(kid.props.children) && kid.props.children[0] === label)) hit = node;
    }
  });
  return hit;
}

const tab = clickButton('全部待办');
if (tab !== null) { tab.props.onClick(); tree = await paint(); }
clickButton('导出 ▾').props.onClick();
tree = await paint();
clickExportItem('图片（.png）').props.onClick();

// ---- assertions --------------------------------------------------------
const checks = [];
const expect = (label, ok, detail) => checks.push((ok ? 'PASS ' : 'FAIL ') + label + (detail ? ' — ' + detail : ''));

const texts = ops.filter((op) => op.name === 'fillText').map((op) => String(op.args[0]));
expect('card has a title', texts.indexOf('全部待办') >= 0, texts.slice(0, 6).join(' / '));
expect('subtask text drawn', texts.some((t) => t.indexOf('子任务甲') >= 0), texts.filter((t) => t.indexOf('子') >= 0).join(' / '));

// Horizontal rules: every moveTo must be followed by a lineTo on the same y.
// Row rules are 1px-tall full-width bands. Anything taller is a fill (zebra
// stripe, header band), so the height filters those out.
const rules = [];
for (const op of ops) {
  if (op.name !== 'fillRect') continue;
  const [x, y, w, h] = op.args;
  if (h !== 1 || w < 100) continue;
  rules.push({ y, x0: x, x1: x + w });
}
const bodyRules = rules.filter((rule) => rule.x0 > 20);
expect('row rules present', bodyRules.length >= 2, bodyRules.length + ' rules');
if (bodyRules.length > 0) {
  const widths = bodyRules.map((rule) => Math.round(rule.x1 - rule.x0));
  const same = widths.every((width) => width === widths[0]);
  expect('row rules share one width', same, widths.join(','));
}
const rects = ops.filter((op) => op.name === 'fillRect').map((op) => op.args);
expect('header band drawn', rects.length > 1, rects.map((r) => Math.round(r[2])).join(','));
if (rects.length > 1) {
  const band = rects[1];
  const rule = bodyRules[0];
  if (rule) {
    expect(
      'header band and row rules end together',
      Math.round(band[0] + band[2]) === Math.round(rule.x1),
      'band ends ' + Math.round(band[0] + band[2]) + ', rule ends ' + Math.round(rule.x1),
    );
  }
}
console.log('TEXTS:', JSON.stringify(texts));
console.log(checks.join('\n'));
const failed = checks.filter((line) => line.startsWith('FAIL')).length;
console.log(failed === 0 ? 'ALL PASS' : failed + ' FAILED');
process.exit(failed === 0 ? 0 : 1);
