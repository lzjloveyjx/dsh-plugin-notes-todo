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

globalThis.__clientSource = readFileSync(process.argv[2], 'utf8');
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

// ---- assertions --------------------------------------------------------
const checks = [];
const expect = (label, ok, detail) => checks.push((ok ? 'PASS ' : 'FAIL ') + label + (detail ? ' — ' + detail : ''));

function walk(node, visit) {
  if (node === null || node === undefined) return;
  if (Array.isArray(node)) { node.forEach((child) => walk(child, visit)); return; }
  visit(node);
  if (node.children) walk(node.children, visit);
  if (node.rendered) walk(node.rendered, visit);
}
function findText(root, text) {
  let hit = null;
  walk(root, (node) => {
    if (node.text === text) hit = node;
  });
  return hit;
}
function findButton(root, label) {
  let hit = null;
  walk(root, (node) => {
    if (node.type === 'button' && node.props && node.props.children && node.props.children[0] === label) hit = node;
  });
  return hit;
}

function itemByLabel(root, label) {
  let hit = null;
  walk(root, (node) => {
    if (node.type === 'button' && node.props && Array.isArray(node.props.children)) {
      const kids = node.props.children;
      if (kids.some((kid) => kid && kid.props && Array.isArray(kid.props.children) && kid.props.children[0] === label)) hit = node;
    }
  });
  return hit;
}

expect('panel renders', tree !== null);

// --- notes tab: the only export is Markdown ---------------------------------
expect('export button present', findButton(tree, '导出 ▾') !== null);
findButton(tree, '导出 ▾').props.onClick();
tree = await paint();
expect('notes menu offers md', itemByLabel(tree, 'Markdown（.md）') !== null);
expect('notes menu hides png', itemByLabel(tree, '图片（.png）') === null);
const mdItem = itemByLabel(tree, 'Markdown（.md）');
if (mdItem !== null) mdItem.props.onClick();
expect('md download fired', downloads.some((name) => name && name.endsWith('.md')), downloads.join(','));
tree = await paint();
expect('menu closes after export', itemByLabel(tree, 'Markdown（.md）') === null);

// --- table tab: png + xlsx --------------------------------------------------
findButton(tree, '全部待办').props.onClick();
tree = await paint();
expect('switched to table tab', findText(tree, '子任务') !== null || findText(tree, '预计结束') !== null);
findButton(tree, '导出 ▾').props.onClick();
tree = await paint();
expect('table menu offers png', itemByLabel(tree, '图片（.png）') !== null);
const xlsxItem = itemByLabel(tree, 'Excel（.xlsx）');
expect('table menu offers xlsx', xlsxItem !== null);
const hints = [];
walk(tree, (node) => {
  if (typeof node.text === 'string' && node.text.indexOf('条，保留划线') >= 0) hints.push(node.text);
  if (typeof node.text === 'string' && node.text.indexOf('行，可继续编辑') >= 0) hints.push(node.text);
});
expect('hints carry counts', hints.length >= 1, hints.join(' / '));
// Keep the bytes so the sheet itself can be inspected, not just the filename.
let lastBlob = null;
const originalCreate = globalThis.URL.createObjectURL;
globalThis.URL.createObjectURL = (blob) => {
  lastBlob = blob;
  return originalCreate(blob);
};
if (xlsxItem !== null) xlsxItem.props.onClick();
expect('xlsx download fired', downloads.some((name) => name && name.endsWith('.xlsx')), downloads.join(','));

const bytes = lastBlob === null ? Buffer.alloc(0) : Buffer.from(await lastBlob.arrayBuffer());
expect('xlsx is a real zip', bytes.slice(0, 2).toString('latin1') === 'PK', bytes.length + ' bytes');

// --- table borders: the three bugs that made the rules look torn -------------
const borderChecks = [];
const borderOk = (label, ok, detail) => borderChecks.push((ok ? 'PASS ' : 'FAIL ') + label + (detail ? ' — ' + detail : ''));

// 1. Data rows must stretch, or a short cell's right border stops mid-row.
const gridStyles = [];
walk(tree, (node) => {
  if (!node.props || !node.props.style) return;
  const style = node.props.style;
  if (style.display === 'grid' && String(style.gridTemplateColumns || '').indexOf('minmax') >= 0) {
    gridStyles.push(style);
  }
});
// Unset alignItems already means stretch; only an explicit 'start' shrinks a
// cell to its content and cuts that cell's right border short.
borderOk(
  'no table grid opts into start alignment',
  gridStyles.every((style) => style.alignItems !== 'start'),
  gridStyles.map((style) => String(style.alignItems)).join(',') || 'no grids',
);

// 2. No header cell may draw a second hairline next to its own border.
const headerSpans = [];
walk(tree, (node) => {
  if (node.type === 'span' && node.props && node.props.style && node.props.style.position === 'absolute') {
    headerSpans.push(node.props.style);
  }
});
borderOk(
  'no extra absolute hairline in header cells',
  !headerSpans.some((style) => style.pointerEvents === 'none' && style.width === 1),
  headerSpans.length + ' absolute spans',
);

// 3. The last header cell must suppress its border, same as the data cells do.
const source = globalThis.__clientSource || '';
borderOk(
  'last header cell clears its right border',
  source.indexOf("S.headCell, S.cellLast") >= 0 || source.indexOf("S.headCell, S.cellLast,") >= 0,
  source === '' ? 'source not loaded' : '',
);
checks.push(...borderChecks);
// The zip stores entries uncompressed, so the XML is raw UTF-8 inside it.
const sheetText = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
expect('sheet carries subtask text', sheetText.indexOf('子任务甲') >= 0, 'looked for 子任务甲');
console.log('DOWNLOADS:', downloads.join(', '));
console.log(checks.join('\n'));
const failed = checks.filter((line) => line.indexOf('FAIL') === 0).length;
console.log(failed === 0 ? 'ALL PASS' : failed + ' FAILED');
process.exit(failed === 0 ? 0 : 1);