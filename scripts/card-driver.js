(async () => {
  // Seed the same store the Node harness uses, so the card has real rows.
  const seed = {
    version: 3,
    notes: [],
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
  try { window.localStorage.setItem('dsh.notes-todo.store.v3', JSON.stringify(seed)); } catch { /* ignore */ }

  window.__exports.apply(ctx);

  async function paint() {
    let tree = null;
    for (let pass = 0; pass < 80; pass += 1) {
      dirty = false;
      tree = render(React.createElement(window.__exports.main, {}), 'root');
      let ran = false;
      for (const effect of effects) {
        if (effect.ran) continue;
        effect.ran = true;
        effect.fn();
        ran = true;
      }
      if (ran) {
        await new Promise((resolve) => setTimeout(resolve, 0));
        continue;
      }
      if (!dirty) break;
    }
    return tree;
  }

  function walk(node, visit) {
    if (!node) return;
    if (Array.isArray(node)) { node.forEach((child) => walk(child, visit)); return; }
    visit(node);
    if (node.children) walk(node.children, visit);
    if (node.rendered) walk(node.rendered, visit);
  }

  function button(label) {
    let hit = null;
    walk(tree, (node) => {
      if (hit || node.type !== 'button' || !node.props || !Array.isArray(node.props.children)) return;
      if (node.props.children.filter((kid) => typeof kid === 'string').join('') === label) hit = node;
    });
    return hit;
  }

  function item(label) {
    let hit = null;
    walk(tree, (node) => {
      if (hit || node.type !== 'button' || !node.props || !Array.isArray(node.props.children)) return;
      const kids = node.props.children;
      if (kids.some((kid) => kid && kid.props && Array.isArray(kid.props.children) && kid.props.children[0] === label)) hit = node;
    });
    return hit;
  }

  let tree = await paint();
  const tab = button('全部待办');
  if (tab) { tab.props.onClick(); tree = await paint(); }
  const opener = button('导出 ▾');
  if (!opener) { document.title = 'NO_OPENER'; return; }
  opener.props.onClick();
  tree = await paint();
  const png = item('图片（.png）');
  if (!png) { document.title = 'NO_PNG'; return; }

  const create = URL.createObjectURL.bind(URL);
  URL.createObjectURL = (blob) => {
    const url = create(blob);
    const img = document.createElement('img');
    img.src = url;
    img.style.width = '1180px';
    img.style.display = 'block';
    const box = document.createElement('div');
    box.style.padding = '16px';
    box.style.background = '#0d141c';
    box.appendChild(img);
    document.body.innerHTML = '';
    document.body.appendChild(box);
    document.title = 'CARD_READY';
    return url;
  };
  png.props.onClick();
})();
