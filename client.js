// Client half: the 「随手记 · 待办」 panel, opened from the left sidebar.
// Notes on one tab, and a task table the user shapes: their own fields, their
// own named views (table / board / calendar), each with columns, widths,
// multi-condition filters, sorts and grouping.
window.__ModuleLoader__.load({
  id: 'dsh-plugin-notes-todo',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const CHANNEL = '/dsh-notes-todo';
    const PANEL = 'notes-todo';
    const STORAGE_KEY = 'dsh.notes-todo.store.v3';

    const S_RAW = {
      root: {
        display: 'flex',
        flexDirection: 'column',
        flex: '1 1 auto',
        height: '100%',
        minWidth: 0,
        minHeight: 0,
        boxSizing: 'border-box',
        color: 'var(--dsw-alias-label-primary)',
        fontSize: 13,
        fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
      },
      head: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px 0',
        flexShrink: 0,
        flexWrap: 'wrap',
      },
      title: { fontSize: 15, fontWeight: 600 },
      meta: { color: 'var(--dsw-alias-label-secondary)', fontSize: 12, lineHeight: 1.5 },
      hint: { color: 'var(--dsw-alias-label-secondary)', fontSize: 11, lineHeight: 1.5 },
      tabs: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        gap: 4,
        padding: '10px 16px 0',
        flexShrink: 0,
        borderBottom: '1px solid var(--dsw-alias-border-l1)',
      },
      tab: {
        border: '1px solid transparent',
        borderBottom: 'none',
        background: 'transparent',
        color: 'var(--dsw-alias-label-secondary)',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        padding: '6px 12px',
        fontSize: 13,
        fontFamily: 'inherit',
        cursor: 'pointer',
        maxWidth: 200,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      tabActive: {
        border: '1px solid var(--dsw-alias-border-l1)',
        borderBottom: 'none',
        background: 'var(--dsw-alias-bg-layer-1)',
        color: 'var(--dsw-alias-label-primary)',
        fontWeight: 600,
        marginBottom: -1,
      },
      tabAdd: {
        border: '1px dashed var(--dsw-alias-border-l2)',
        background: 'transparent',
        color: 'var(--dsw-alias-label-secondary)',
        borderRadius: 8,
        padding: '4px 10px',
        fontSize: 12,
        fontFamily: 'inherit',
        cursor: 'pointer',
        marginBottom: 4,
      },
      body: {
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      },
      foot: { padding: '6px 16px 10px', flexShrink: 0, borderTop: '1px solid var(--dsw-alias-border-l1)' },
      button: {
        border: '1px solid var(--dsw-alias-border-l2)',
        background: 'var(--dsw-alias-bg-layer-1)',
        color: 'var(--dsw-alias-label-primary)',
        borderRadius: 8,
        padding: '6px 12px',
        fontSize: 13,
        fontFamily: 'inherit',
        cursor: 'pointer',
      },
      buttonGhost: {
        border: '1px solid transparent',
        background: 'transparent',
        color: 'var(--dsw-alias-label-secondary)',
        borderRadius: 8,
        padding: '4px 8px',
        fontSize: 12,
        fontFamily: 'inherit',
        cursor: 'pointer',
      },
      buttonDanger: { color: 'var(--dsw-alias-state-error-primary)' },
      input: {
        border: '1px solid var(--dsw-alias-border-l2)',
        background: 'var(--dsw-alias-bg-layer-1)',
        color: 'var(--dsw-alias-label-primary)',
        borderRadius: 8,
        padding: '6px 10px',
        fontSize: 13,
        fontFamily: 'inherit',
        minWidth: 0,
        boxSizing: 'border-box',
      },
      textarea: {
        border: '1px solid var(--dsw-alias-border-l2)',
        background: 'var(--dsw-alias-bg-layer-1)',
        color: 'var(--dsw-alias-label-primary)',
        borderRadius: 8,
        padding: '8px 10px',
        fontSize: 13,
        fontFamily: 'inherit',
        lineHeight: 1.6,
        resize: 'vertical',
        minHeight: 72,
        width: '100%',
        boxSizing: 'border-box',
      },
      card: {
        border: '1px solid var(--dsw-alias-border-l1)',
        background: 'var(--dsw-alias-bg-layer-1)',
        borderRadius: 10,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      },
      editor: {
        border: '1px solid var(--dsw-alias-border-l2)',
        background: 'var(--dsw-alias-bg-layer-1)',
        borderRadius: 10,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      },
      noteText: { whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.7, fontSize: 13 },
      row: { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
      fieldRow: { display: 'flex', flexWrap: 'wrap', gap: '10px 12px', alignItems: 'flex-end' },
      field: { display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 172px', minWidth: 152, maxWidth: '100%' },
      label: { color: 'var(--dsw-alias-label-secondary)', fontSize: 11 },
      error: {
        margin: '10px 16px 0',
        borderLeft: '3px solid var(--dsw-alias-state-error-primary)',
        background: 'var(--dsw-alias-bg-layer-2)',
        borderRadius: 8,
        padding: '8px 10px',
        fontSize: 12,
        color: 'var(--dsw-alias-state-error-primary)',
        whiteSpace: 'pre-wrap',
      },
      empty: { color: 'var(--dsw-alias-label-secondary)', fontSize: 12, padding: '18px 0', textAlign: 'center' },
      chip: {
        display: 'inline-block',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 999,
        padding: '1px 8px',
        fontSize: 11,
        color: 'var(--dsw-alias-label-secondary)',
        background: 'var(--dsw-alias-bg-layer-2)',
        whiteSpace: 'nowrap',
      },
      overflow: { overflowX: 'auto' },
      search: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        border: '1px solid var(--dsw-alias-border-l2)',
        background: 'var(--dsw-alias-bg-layer-1)',
        borderRadius: 8,
        padding: '2px 4px 2px 8px',
        height: 28,
        boxSizing: 'border-box',
      },
      searchInput: {
        border: 'none',
        outline: 'none',
        background: 'transparent',
        color: 'var(--dsw-alias-label-primary)',
        fontSize: 12,
        fontFamily: 'inherit',
        width: 140,
        minWidth: 0,
      },
      gridHead: {
        color: 'var(--dsw-alias-label-secondary)',
        fontSize: 11,
        padding: '0 4px',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        cursor: 'pointer',
        userSelect: 'none',
        minWidth: 0,
      },
      gridTitle: { wordBreak: 'break-word', lineHeight: 1.5, minWidth: 0 },
      gridCell: { fontSize: 12, color: 'var(--dsw-alias-label-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
      strike: { textDecoration: 'line-through', opacity: 0.6 },
      divider: { height: 1, background: 'var(--dsw-alias-border-l1)', margin: '2px 0' },
      // One data row: a hairline above it only. No zebra tint — the reference
      // keeps rows white and separates them with rules alone.
      tableRow: {
        borderTop: '1px solid var(--dsw-alias-border-l1)',
        boxSizing: 'border-box',
      },
      tableRowAlt: null,
      // A subtask row keeps the same rules and the same background; hierarchy
      // comes from the indent and the twisty, not from a different fill.
      subRow: {},
      // Subtask cells are shorter than record cells: the empty ones carry no
      // padding, so the row height follows the single line of text only.
      // Same rule colour as the record cells above it: a subtask row with a
      // lighter line made the column edge look broken at every subtask.
      subCellBox: {
        position: 'relative',
        borderRight: '1px solid var(--dsw-alias-border-l2)',
        padding: '3px 8px',
        minWidth: 0,
        boxSizing: 'border-box',
        lineHeight: 1.35,
        fontSize: 12,
        display: 'flex',
        alignItems: 'center',
      },
      subCellBoxLast: { borderRight: 'none', padding: 0 },
      // Indent inside the title cell, aligned past the twisty + gap.
      subCell: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        paddingLeft: 24,
        fontSize: 12,
        lineHeight: 1.35,
        minWidth: 0,
        cursor: 'pointer',
        color: 'var(--dsw-alias-label-secondary)',
      },
      fieldItem: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        alignItems: 'center',
        padding: '5px 0',
        borderTop: '1px solid var(--dsw-alias-border-l1)',
      },
      grip: {
        position: 'absolute',
        right: -4,
        top: 0,
        bottom: 0,
        width: 9,
        cursor: 'col-resize',
        background: 'transparent',
        zIndex: 3,
      },
      // No second hairline here: the cell's own borderRight already marks the
      // column edge. Drawing one at right:3 put two parallel lines 3px apart on
      // every header cell, which read as a doubled, misaligned divider.
      // Excel-like cell: every cell carries its own right border and padding.
      cell: {
        position: 'relative',
        borderRight: '1px solid var(--dsw-alias-border-l2)',
        padding: '6px 8px',
        minWidth: 0,
        boxSizing: 'border-box',
      },
      cellLast: { borderRight: 'none' },
      headCell: {
        position: 'relative',
        borderRight: '1px solid var(--dsw-alias-border-l2)',
        padding: '6px 8px',
        color: 'var(--dsw-alias-label-secondary)',
        fontSize: 11,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        cursor: 'pointer',
        userSelect: 'none',
        minWidth: 0,
        boxSizing: 'border-box',
        background: 'var(--dsw-alias-bg-layer-2)',
      },
      // The table frame itself: outer border plus header underline.
      tableFrame: {
        border: '1px solid var(--dsw-alias-border-l2)',
        borderRadius: 8,
        overflow: 'hidden',
        background: 'var(--dsw-alias-bg-layer-1)',
      },
      // No bottom border: every data row draws its own top rule, and two
      // lines on one boundary read as a seam.
      tableHeadRow: {
        display: 'grid',
        gap: 0,
        boxSizing: 'border-box',
      },
      groupHead: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 4px',
        cursor: 'pointer',
        borderTop: '1px solid var(--dsw-alias-border-l1)',
        fontWeight: 600,
        fontSize: 12,
      },
      board: { display: 'flex', gap: 10, alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 8 },
      boardCol: {
        flex: '0 0 220px',
        minWidth: 220,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: 'var(--dsw-alias-bg-layer-2)',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 10,
        padding: 10,
        boxSizing: 'border-box',
      },
      boardCard: {
        border: '1px solid var(--dsw-alias-border-l1)',
        background: 'var(--dsw-alias-bg-layer-1)',
        borderRadius: 8,
        padding: '8px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        cursor: 'grab',
      },
      calGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, minmax(90px, 1fr))', gap: 6 },
      calHead: { color: 'var(--dsw-alias-label-secondary)', fontSize: 11, textAlign: 'center', paddingBottom: 2 },
      calCell: {
        border: '1px solid var(--dsw-alias-border-l1)',
        background: 'var(--dsw-alias-bg-layer-1)',
        borderRadius: 8,
        minHeight: 88,
        padding: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        boxSizing: 'border-box',
        minWidth: 0,
      },
      calDay: { fontSize: 11, color: 'var(--dsw-alias-label-secondary)' },
      calItem: {
        fontSize: 11,
        background: 'var(--dsw-alias-bg-layer-2)',
        borderRadius: 5,
        padding: '2px 5px',
        cursor: 'pointer',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      subItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 },
      // Subtasks sit under the whole row, indented so they read as that row's
      // children, with a guide line tying them to the parent.
      rowSubs: {
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        margin: '5px 0 1px 22px',
        paddingLeft: 10,
        borderLeft: '2px solid var(--dsw-alias-border-l2)',
      },
      rowSub: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, lineHeight: 1.5, minWidth: 0 },
      rowSubText: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
      // Expander sits before the title and rotates when open.
      twisty: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 16,
        height: 16,
        flex: '0 0 16px',
        marginRight: 2,
        border: 'none',
        background: 'transparent',
        color: 'var(--dsw-alias-label-secondary)',
        fontSize: 10,
        lineHeight: 1,
        padding: 0,
        cursor: 'pointer',
        verticalAlign: 'middle',
      },
      titleLine: { display: 'flex', alignItems: 'flex-start', gap: 2, minWidth: 0 },
      twistySpacer: { width: 16, flex: '0 0 16px', marginRight: 2 },
      modalMask: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 2000,
        boxSizing: 'border-box',
      },
      modal: {
        background: 'var(--dsw-alias-bg-layer-1)',
        border: '1px solid var(--dsw-alias-border-l2)',
        borderRadius: 12,
        padding: 16,
        width: 'min(680px, 100%)',
        maxHeight: '86vh',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxSizing: 'border-box',
        boxShadow: '0 18px 48px rgba(0,0,0,0.32)',
      },
      modalHead: { display: 'flex', alignItems: 'center', gap: 8 },
      modalTitle: { fontSize: 14, fontWeight: 600 },
      // One bordered control: the date itself, the time (once asked for), and
      // the toggle that adds it — all inside a single box that stays one line.
      dateBox: {
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        width: '100%',
        height: 32,
        border: '1px solid var(--dsw-alias-border-l2)',
        background: 'var(--dsw-alias-bg-layer-1)',
        borderRadius: 8,
        padding: '0 8px',
        fontSize: 13,
        lineHeight: '30px',
        fontFamily: 'inherit',
        color: 'var(--dsw-alias-label-primary)',
        cursor: 'pointer',
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      },
      // The visible date text; never wraps, ellipsizes instead.
      dateText: {
        flex: '1 1 auto',
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      // Covers the box invisibly so showPicker() has a rendered anchor.
      dateGhost: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        opacity: 0,
        pointerEvents: 'none',
        border: 0,
        padding: 0,
        margin: 0,
      },
      dateTime: {
        flex: '0 0 auto',
        border: 'none',
        background: 'transparent',
        color: 'var(--dsw-alias-label-primary)',
        fontFamily: 'inherit',
        fontSize: 13,
        padding: 0,
        width: 62,
        height: 26,
        lineHeight: '26px',
        cursor: 'pointer',
        outline: 'none',
      },
      dateToggle: {
        flex: '0 0 auto',
        border: 'none',
        background: 'transparent',
        color: 'var(--dsw-alias-label-secondary)',
        fontFamily: 'inherit',
        fontSize: 11,
        lineHeight: '26px',
        padding: '0 2px',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      },
      exportWrap: { position: 'relative', display: 'inline-flex', alignItems: 'center' },
      exportMenu: {
        position: 'absolute',
        right: 0,
        top: 'calc(100% + 4px)',
        zIndex: 40,
        minWidth: 186,
        padding: 4,
        borderRadius: 8,
        border: '1px solid var(--dsw-alias-border-l2)',
        background: 'var(--dsw-alias-bg-layer-1)',
        boxShadow: '0 12px 28px rgba(0, 0, 0, 0.28)',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      },
      exportItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 2,
        width: '100%',
        padding: '6px 9px',
        border: 'none',
        borderRadius: 6,
        background: 'transparent',
        color: 'var(--dsw-alias-label-primary)',
        fontFamily: 'inherit',
        fontSize: 12,
        lineHeight: 1.4,
        textAlign: 'left',
        cursor: 'pointer',
      },
      exportItemHot: { background: 'var(--dsw-alias-bg-layer-2)' },
      exportItemLabel: { fontSize: 12, color: 'var(--dsw-alias-label-primary)' },
      exportItemHint: { fontSize: 11, color: 'var(--dsw-alias-label-secondary)' },
    };

    /** Numeric UI sizes become CSS calc()s, so one variable rescales the panel. */
    const SIZE_KEYS = new Set([
      'fontSize', 'gap', 'rowGap', 'columnGap',
      'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
      'minHeight', 'minWidth', 'borderRadius',
    ]);
    const scaleFactorOf = (value) => 'calc(' + value + 'px * var(--nt-scale, 1))';
    function scaleLength(value) {
      if (typeof value === 'number') return scaleFactorOf(value);
      if (typeof value !== 'string') return value;
      const tokens = value.trim().split(/\s+/);
      if (tokens.length === 0) return value;
      if (!tokens.every((token) => /^-?\d+(\.\d+)?(px)?$/.test(token))) return value;
      return tokens.map((token) => (token === '0' || token === '0px' ? '0' : scaleFactorOf(Number.parseFloat(token)))).join(' ');
    }
    function buildStyleSheet(raw) {
      const out = {};
      for (const [key, style] of Object.entries(raw)) {
        // A couple of slots are deliberately null ("no style"), keep them as-is.
        if (style === null || typeof style !== 'object') {
          out[key] = style;
          continue;
        }
        const next = {};
        for (const [prop, value] of Object.entries(style)) {
          next[prop] = SIZE_KEYS.has(prop) ? scaleLength(value) : value;
        }
        out[key] = next;
      }
      return out;
    }
    const S = buildStyleSheet(S_RAW);

    /** Saved size, or one guessed from the window: wide screens were getting 13px. */
    const SCALE_KEY = 'dsh.notes-todo.uiScale';
    function autoScale() {
      const width = window.innerWidth || 1440;
      const raw = width / 1440;
      return Math.round(Math.max(1, Math.min(1.45, raw)) * 20) / 20;
    }
    function storedScale() {
      try {
        const value = Number.parseFloat(window.localStorage.getItem(SCALE_KEY) || '');
        if (Number.isFinite(value) && value >= 0.85 && value <= 1.6) return value;
      } catch {
        /* private mode: fall through to the guess */
      }
      return autoScale();
    }
    function rememberScale(value) {
      try {
        window.localStorage.setItem(SCALE_KEY, String(value));
      } catch {
        /* private mode: the size still applies for this session */
      }
    }
    const FIELD_TYPE_LABEL = { text: '文本', datetime: '时间', select: '单选', multiselect: '多选', checkbox: '勾选', person: '人员' };
    /** Parsed from storage — keeps old checkbox/person fields readable. */
    const FIELD_TYPES = ['text', 'datetime', 'select', 'multiselect', 'checkbox', 'person'];
    /** Offered when adding a field. */
    const NEW_FIELD_TYPES = ['text', 'datetime', 'select', 'multiselect', 'checkbox', 'person'];
    const VIEW_TYPE_LABEL = { table: '表格', board: '看板', calendar: '日历' };

    /** Types whose value is one option id from `options`. */
    const OPTION_TYPES = { select: true, person: true };
    /** Types that can drive a board column or a group. */
    const GROUP_TYPES = { select: true, person: true, multiselect: true, checkbox: true };

    const FILTER_OP_LABEL = {
      contains: '包含',
      is: '等于',
      empty: '为空',
      notEmpty: '不为空',
      beforeToday: '早于今天',
      afterToday: '晚于今天',
      onToday: '就是今天',
      isTrue: '已勾选',
      isFalse: '未勾选',
    };
    const FILTER_OPS = ['contains', 'is', 'empty', 'notEmpty', 'beforeToday', 'afterToday', 'onToday', 'isTrue', 'isFalse'];

    function pad2(value) {
      return value < 10 ? `0${value}` : String(value);
    }

    function nowLocal() {
      const date = new Date();
      return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
    }

    function todayLocal() {
      const date = new Date();
      return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
    }

    function nowIso() {
      return new Date().toISOString();
    }

    function shortTime(value) {
      if (typeof value !== 'string' || value === '') return '—';
      const full = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(value);
      if (full !== null) return `${full[2]}-${full[3]} ${full[4]}:${full[5]}`;
      const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
      if (dateOnly !== null) return `${dateOnly[2]}-${dateOnly[3]}`;
      return value;
    }

    function shortClock(value) {
      const date = value ? new Date(value) : new Date();
      const moment = Number.isNaN(date.getTime()) ? new Date() : date;
      return `${pad2(moment.getHours())}:${pad2(moment.getMinutes())}:${pad2(moment.getSeconds())}`;
    }

    function makeId(prefix) {
      return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    }

    function defaultFields() {
      return [
        { id: 'f_title', name: '标题', type: 'text', primary: true },
        { id: 'f_status', name: '状态', type: 'select', options: [
          { id: 'o_todo', name: '待开始' },
          { id: 'o_doing', name: '进行中' },
          { id: 'o_done', name: '已完成' },
        ] },
        { id: 'f_prio', name: '优先级', type: 'select', options: [
          { id: 'o_high', name: '高' },
          { id: 'o_mid', name: '中' },
          { id: 'o_low', name: '低' },
        ] },
        { id: 'f_cat', name: '任务分类', type: 'select', options: [
          { id: 'o_work', name: '工作' },
          { id: 'o_life', name: '生活' },
          { id: 'o_study', name: '学习' },
        ] },
        { id: 'f_tags', name: '标签', type: 'multiselect', options: [] },
        { id: 'f_start', name: '开始时间', type: 'datetime' },
        { id: 'f_due', name: '预计结束', type: 'datetime' },
        { id: 'f_done', name: '实际完成', type: 'datetime' },
      ];
    }

    function defaultColumns(fields) {
      return fields.map((field, index) => ({ fieldId: field.id, width: index === 0 ? 200 : 116 }));
    }

    function defaultViews(fields) {
      const columns = defaultColumns(fields);
      return [
        { id: 'v_all', name: '全部待办', type: 'table', columns, filters: [], filterMode: 'and', sorts: [], groupBy: null, boardBy: null, dateField: null, collapsed: [] },
        { id: 'v_board', name: '看板', type: 'board', columns, filters: [], filterMode: 'and', sorts: [], groupBy: null, boardBy: 'f_cat', dateField: null, collapsed: [] },
        { id: 'v_cal', name: '日历', type: 'calendar', columns, filters: [], filterMode: 'and', sorts: [], groupBy: null, boardBy: null, dateField: 'f_due', collapsed: [] },
      ];
    }

    function coerceField(raw) {
      if (!raw || typeof raw !== 'object') return null;
      const id = typeof raw.id === 'string' ? raw.id : '';
      const name = typeof raw.name === 'string' ? raw.name.trim() : '';
      if (id === '' || name === '') return null;
      const type = FIELD_TYPES.indexOf(raw.type) >= 0 ? raw.type : 'text';
      const field = { id, name, type };
      if (raw.primary === true) field.primary = true;
      if (OPTION_TYPES[type] || type === 'multiselect') {
        const options = [];
        const seen = {};
        for (const option of Array.isArray(raw.options) ? raw.options : []) {
          if (!option || typeof option !== 'object') continue;
          const optionId = typeof option.id === 'string' ? option.id : '';
          const optionName = typeof option.name === 'string' ? option.name.trim() : '';
          if (optionId === '' || optionName === '' || seen[optionId]) continue;
          seen[optionId] = true;
          options.push({ id: optionId, name: optionName });
        }
        field.options = options;
      }
      return field;
    }

    /** Bring any stored shape (v1 flat records, v2 fieldIds views) up to v3. */
    function migrate(raw) {
      if (!raw || typeof raw !== 'object') {
        const fields = defaultFields();
        return { version: 3, notes: [], fields, todos: [], views: defaultViews(fields) };
      }

      const notes = [];
      for (const note of Array.isArray(raw.notes) ? raw.notes : []) {
        if (!note || typeof note !== 'object') continue;
        const id = typeof note.id === 'string' ? note.id : '';
        if (id === '') continue;
        notes.push({
          id,
          text: typeof note.text === 'string' ? note.text : '',
          struck: note.struck === true,
          createdAt: typeof note.createdAt === 'string' ? note.createdAt : '',
          updatedAt: typeof note.updatedAt === 'string' ? note.updatedAt : '',
        });
      }

      let fields = [];
      const legacyCategories = Array.isArray(raw.categories) ? raw.categories : [];
      if (Array.isArray(raw.fields) && raw.fields.length > 0) {
        for (const entry of raw.fields) {
          const field = coerceField(entry);
          if (field) fields.push(field);
        }
      } else {
        fields = defaultFields();
        if (legacyCategories.length > 0) {
          const catField = fields.find((field) => field.id === 'f_cat');
          if (catField) {
            catField.options = legacyCategories
              .filter((entry) => entry && typeof entry.id === 'string' && typeof entry.name === 'string')
              .map((entry) => ({ id: entry.id, name: entry.name }));
          }
        }
      }
      if (fields.length === 0) fields = defaultFields();

      const fieldIds = {};
      for (const field of fields) fieldIds[field.id] = field;
      const primary = fields.find((field) => field.primary === true) || fields[0];

      const todos = [];
      for (const entry of Array.isArray(raw.todos) ? raw.todos : []) {
        if (!entry || typeof entry !== 'object') continue;
        const id = typeof entry.id === 'string' ? entry.id : '';
        if (id === '') continue;

        let values = {};
        if (entry.values && typeof entry.values === 'object') {
          values = entry.values;
        } else {
          values = {
            f_title: typeof entry.title === 'string' ? entry.title : '',
            f_start: typeof entry.start === 'string' ? entry.start : '',
            f_due: typeof entry.due === 'string' ? entry.due : '',
            f_done: typeof entry.doneAt === 'string' ? entry.doneAt : '',
            f_cat: typeof entry.categoryId === 'string' ? entry.categoryId : '',
          };
        }

        const clean = {};
        for (const fieldId of Object.keys(fieldIds)) {
          const field = fieldIds[fieldId];
          const value = values[fieldId];
          if (field.type === 'checkbox') clean[fieldId] = value === true;
          else if (field.type === 'multiselect') {
            const known = {};
            for (const option of field.options || []) known[option.id] = true;
            clean[fieldId] = (Array.isArray(value) ? value : []).filter((item) => known[item]);
          } else clean[fieldId] = typeof value === 'string' ? value : '';
        }

        const subtasks = [];
        for (const sub of Array.isArray(entry.subtasks) ? entry.subtasks : []) {
          if (!sub || typeof sub !== 'object') continue;
          const subId = typeof sub.id === 'string' ? sub.id : '';
          if (subId === '') continue;
          subtasks.push({ id: subId, text: typeof sub.text === 'string' ? sub.text : '', done: sub.done === true });
        }

        todos.push({
          id,
          values: clean,
          subtasks,
          createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : '',
          updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : '',
        });
      }
      if (primary && todos.length > 0) {
        // no-op: kept for clarity that primary drives the add form
      }

      const views = [];
      for (const entry of Array.isArray(raw.views) ? raw.views : []) {
        if (!entry || typeof entry !== 'object') continue;
        const id = typeof entry.id === 'string' ? entry.id : '';
        const name = typeof entry.name === 'string' ? entry.name.trim() : '';
        if (id === '' || name === '') continue;

        // v2 kept a flat fieldIds list; v3 keeps ordered columns with widths.
        const columns = [];
        const seenIds = {};
        for (const column of Array.isArray(entry.columns) ? entry.columns : []) {
          if (!column || typeof column !== 'object') continue;
          const fieldId = column.fieldId;
          if (fieldIds[fieldId] === undefined || seenIds[fieldId]) continue;
          seenIds[fieldId] = true;
          const width = typeof column.width === 'number' && column.width >= 60 && column.width <= 640 ? Math.round(column.width) : 116;
          columns.push({ fieldId, width });
        }
        if (columns.length === 0) {
          for (const fieldId of Array.isArray(entry.fieldIds) ? entry.fieldIds : []) {
            if (fieldIds[fieldId] === undefined || seenIds[fieldId]) continue;
            seenIds[fieldId] = true;
            columns.push({ fieldId, width: columns.length === 0 ? 200 : 116 });
          }
        }
        if (columns.length === 0) {
          for (const field of fields) columns.push({ fieldId: field.id, width: columns.length === 0 ? 200 : 116 });
        }

        const filters = [];
        for (const item of Array.isArray(entry.filters) ? entry.filters : []) {
          if (!item || typeof item !== 'object') continue;
          if (fieldIds[item.fieldId] === undefined || FILTER_OPS.indexOf(item.op) < 0) continue;
          filters.push({ fieldId: item.fieldId, op: item.op, value: typeof item.value === 'string' ? item.value : '' });
        }
        if (filters.length === 0 && entry.filter && typeof entry.filter === 'object') {
          const single = entry.filter;
          if (fieldIds[single.fieldId] !== undefined && FILTER_OPS.indexOf(single.op) >= 0) {
            filters.push({ fieldId: single.fieldId, op: single.op, value: typeof single.value === 'string' ? single.value : '' });
          }
        }

        const sorts = [];
        for (const item of Array.isArray(entry.sorts) ? entry.sorts : []) {
          if (!item || typeof item !== 'object') continue;
          if (fieldIds[item.fieldId] === undefined) continue;
          sorts.push({ fieldId: item.fieldId, dir: item.dir === 'desc' ? 'desc' : 'asc' });
        }

        views.push({
          id,
          name,
          type: ['table', 'board', 'calendar'].indexOf(entry.type) >= 0 ? entry.type : 'table',
          columns,
          filters,
          filterMode: entry.filterMode === 'or' ? 'or' : 'and',
          sorts,
          groupBy: typeof entry.groupBy === 'string' && fieldIds[entry.groupBy] ? entry.groupBy : null,
          boardBy: typeof entry.boardBy === 'string' && fieldIds[entry.boardBy] ? entry.boardBy : null,
          dateField: typeof entry.dateField === 'string' && fieldIds[entry.dateField] ? entry.dateField : null,
          collapsed: (Array.isArray(entry.collapsed) ? entry.collapsed : []).filter((item) => typeof item === 'string'),
        });
      }

      if (views.length === 0) views.push(...defaultViews(fields));

      return { version: 3, notes, fields, todos, views };
    }

    function renderNote(text) {
      const parts = [];
      const pattern = /~~([\s\S]+?)~~/g;
      let cursor = 0;
      let key = 0;
      let match = pattern.exec(text);
      while (match !== null) {
        if (match.index > cursor) parts.push(h('span', { key: `t${key++}` }, text.slice(cursor, match.index)));
        parts.push(h('span', { key: `s${key++}`, style: S.strike }, match[1]));
        cursor = match.index + match[0].length;
        match = pattern.exec(text);
      }
      if (cursor < text.length) parts.push(h('span', { key: `t${key++}` }, text.slice(cursor)));
      return parts;
    }

    function optionName(field, id) {
      const found = (field.options || []).find((entry) => entry.id === id);
      return found ? found.name : '';
    }

    function cellText(field, value) {
      if (field.type === 'checkbox') return value === true ? '是' : '';
      if (field.type === 'datetime') return shortTime(value);
      if (OPTION_TYPES[field.type]) return optionName(field, value) || '—';
      if (field.type === 'multiselect') {
        const names = (Array.isArray(value) ? value : []).map((id) => optionName(field, id)).filter(Boolean);
        return names.length > 0 ? names.join('、') : '—';
      }
      return value === '' || value === undefined ? '—' : String(value);
    }

    /** The text a filter or sort compares against. */
    function comparable(field, value) {
      if (field.type === 'checkbox') return value === true ? '1' : '0';
      if (OPTION_TYPES[field.type]) return optionName(field, value);
      if (field.type === 'multiselect') {
        return (Array.isArray(value) ? value : []).map((id) => optionName(field, id)).join('、');
      }
      return typeof value === 'string' ? value : '';
    }

    /** Stable tint for one option, so a status column reads at a glance. */
    function optionTone(field, optionId) {
      const list = field.options || [];
      const index = list.findIndex((entry) => entry.id === optionId);
      if (index < 0) return null;
      // Hues spread across the circle; the same option always gets the same one.
      const hue = (index * 47 + 8) % 360;
      return {
        borderColor: `hsl(${hue} 45% 48% / 0.45)`,
        background: `hsl(${hue} 45% 48% / 0.14)`,
        color: 'var(--dsw-alias-label-primary)',
      };
    }

    function matchesFilter(todo, filter, field) {
      if (!field) return true;
      const value = todo.values ? todo.values[filter.fieldId] : undefined;
      const raw = comparable(field, value);
      switch (filter.op) {
        case 'contains': {
          // "contains" is multi-valued: any one of the picked words matches.
          const words = String(filter.value || '')
            .split('|')
            .map((entry) => entry.trim().toLowerCase())
            .filter(Boolean);
          if (words.length === 0) return true;
          const haystack = raw.toLowerCase();
          return words.some((word) => haystack.indexOf(word) >= 0);
        }
        case 'is':
          return raw === (filter.value || '');
        case 'empty':
          return raw === '' || value === undefined || (Array.isArray(value) && value.length === 0);
        case 'notEmpty':
          return raw !== '' && value !== undefined && !(Array.isArray(value) && value.length === 0);
        case 'beforeToday':
          return raw !== '' && raw.slice(0, 10) < todayLocal();
        case 'afterToday':
          return raw !== '' && raw.slice(0, 10) > todayLocal();
        case 'onToday':
          return raw.slice(0, 10) === todayLocal();
        case 'isTrue':
          return value === true;
        case 'isFalse':
          return value !== true;
        default:
          return true;
      }
    }

    function filterNeedsValue(op) {
      return op === 'contains' || op === 'is';
    }

    /** A query splits on spaces; every word has to hit somewhere. */
    function queryWords(query) {
      return String(query || '')
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
    }

    function hitWords(haystack, words) {
      if (words.length === 0) return true;
      const text = String(haystack || '').toLowerCase();
      return words.every((word) => text.indexOf(word) >= 0);
    }

    /** Fuzzy search over a note body (~~ strike markers included, harmlessly). */
    function noteMatchesQuery(note, query) {
      return hitWords(note.text, queryWords(query));
    }

    /** Fuzzy search over every field value on a record, plus its subtasks. */
    function todoMatchesQuery(todo, store, query) {
      const words = queryWords(query);
      if (words.length === 0) return true;
      const parts = store.fields.map((field) => cellText(field, todo.values[field.id]));
      for (const sub of todo.subtasks || []) parts.push(sub.text);
      return hitWords(parts.join(' '), words);
    }

    /** Rows that survive this view's filters, search and sorts. */
    function selectRows(store, view, query) {
      const fieldsById = {};
      for (const field of store.fields) fieldsById[field.id] = field;

      const matched = store.todos.filter((todo) => {
        if (!todoMatchesQuery(todo, store, query)) return false;
        if (view.filters.length === 0) return true;
        const results = view.filters.map((filter) => matchesFilter(todo, filter, fieldsById[filter.fieldId]));
        return view.filterMode === 'or' ? results.some(Boolean) : results.every(Boolean);
      });

      const rows = matched.slice();
      rows.sort((left, right) => {
        for (const sort of view.sorts) {
          const field = fieldsById[sort.fieldId];
          if (!field) continue;
          const a = comparable(field, left.values[sort.fieldId]);
          const b = comparable(field, right.values[sort.fieldId]);
          if (a === b) continue;
          if (a === '') return 1;
          if (b === '') return -1;
          const order = a < b ? -1 : 1;
          return sort.dir === 'desc' ? -order : order;
        }
        // No explicit sort: soonest date first, then creation order.
        const dateField = store.fields.find((field) => field.type === 'datetime');
        if (dateField) {
          const a = String(left.values[dateField.id] || '');
          const b = String(right.values[dateField.id] || '');
          if (a !== b) {
            if (a === '') return 1;
            if (b === '') return -1;
            return a < b ? -1 : 1;
          }
        }
        return String(left.createdAt) < String(right.createdAt) ? -1 : 1;
      });
      return rows;
    }

    function subtaskProgress(todo) {
      const list = todo.subtasks || [];
      if (list.length === 0) return '';
      const done = list.filter((entry) => entry.done).length;
      return `${done}/${list.length}`;
    }

    function apply(ctx) {
      function readLocal() {
        try {
          const raw = window.localStorage.getItem(STORAGE_KEY);
          if (raw) return migrate(JSON.parse(raw));
          // Carry a v2 copy over rather than starting empty.
          const older = window.localStorage.getItem('dsh.notes-todo.store.v2');
          if (older) return migrate(JSON.parse(older));
          return null;
        } catch {
          return null;
        }
      }

      function writeLocal(store) {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
          return true;
        } catch {
          return false;
        }
      }

      /** Debounced local write: keystrokes must not serialize the store each time. */
      let localTimer = null;
      let localPending = null;
      function writeLocalSoon(store) {
        localPending = store;
        if (localTimer !== null) return true;
        localTimer = window.setTimeout(() => {
          localTimer = null;
          if (localPending !== null) writeLocal(localPending);
          localPending = null;
        }, 250);
        return true;
      }

      /** Files land in the browser's download folder; the name is the view name. */
      function safeName(raw) {
        const clean = String(raw || '').replace(/[\\/:*?"<>|]+/g, '-').trim();
        return clean === '' ? 'notes-todo' : clean.slice(0, 40);
      }

      function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.style.display = 'none';
        document.body.appendChild(anchor);
        anchor.click();
        window.setTimeout(() => {
          URL.revokeObjectURL(url);
          anchor.remove();
        }, 400);
      }

      // ---------------------------------------------------------------------
      // Excel export: a real .xlsx (a zip of five small XML parts) so it opens
      // without the "different format" warning that CSV or SpreadsheetML cause.
      // Everything is written as an inline string: dates and options are shown
      // exactly as the table shows them, no re-interpretation by Excel.
      // ---------------------------------------------------------------------
      const CRC_TABLE = (function () {
        const table = new Uint32Array(256);
        for (let index = 0; index < 256; index += 1) {
          let value = index;
          for (let step = 0; step < 8; step += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
          table[index] = value >>> 0;
        }
        return table;
      })();

      function crc32(bytes) {
        let crc = 0xffffffff;
        for (let index = 0; index < bytes.length; index += 1) {
          crc = CRC_TABLE[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
        }
        return (crc ^ 0xffffffff) >>> 0;
      }

      /** Stored (uncompressed) zip; xlsx allows it and it keeps this code small. */
      function zipStore(entries) {
        const encoder = new TextEncoder();
        const body = [];
        const index = [];
        let offset = 0;
        for (const entry of entries) {
          const nameBytes = encoder.encode(entry.name);
          const data = encoder.encode(entry.text);
          const crc = crc32(data);
          const local = new Uint8Array(30 + nameBytes.length);
          const head = new DataView(local.buffer);
          head.setUint32(0, 0x04034b50, true);
          head.setUint16(4, 20, true);
          head.setUint16(6, 0x0800, true);
          head.setUint16(8, 0, true);
          head.setUint16(10, 0, true);
          head.setUint16(12, 0x21, true);
          head.setUint32(14, crc, true);
          head.setUint32(18, data.length, true);
          head.setUint32(22, data.length, true);
          head.setUint16(26, nameBytes.length, true);
          head.setUint16(28, 0, true);
          local.set(nameBytes, 30);
          body.push(local, data);
          index.push({ nameBytes: nameBytes, crc: crc, size: data.length, offset: offset });
          offset += local.length + data.length;
        }
        const central = [];
        let centralSize = 0;
        for (const entry of index) {
          const head = new Uint8Array(46 + entry.nameBytes.length);
          const view = new DataView(head.buffer);
          view.setUint32(0, 0x02014b50, true);
          view.setUint16(4, 20, true);
          view.setUint16(6, 20, true);
          view.setUint16(8, 0x0800, true);
          view.setUint16(10, 0, true);
          view.setUint16(12, 0, true);
          view.setUint16(14, 0x21, true);
          view.setUint32(16, entry.crc, true);
          view.setUint32(20, entry.size, true);
          view.setUint32(24, entry.size, true);
          view.setUint16(28, entry.nameBytes.length, true);
          view.setUint16(30, 0, true);
          view.setUint16(32, 0, true);
          view.setUint16(34, 0, true);
          view.setUint16(36, 0, true);
          view.setUint32(38, 0, true);
          view.setUint32(42, entry.offset, true);
          head.set(entry.nameBytes, 46);
          central.push(head);
          centralSize += head.length;
        }
        const end = new Uint8Array(22);
        const tail = new DataView(end.buffer);
        tail.setUint32(0, 0x06054b50, true);
        tail.setUint16(8, index.length, true);
        tail.setUint16(10, index.length, true);
        tail.setUint32(12, centralSize, true);
        tail.setUint32(16, offset, true);
        return new Blob(body.concat(central, [end]), {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
      }

      function xmlEscape(value) {
        return String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      }

      /** Strip what Excel refuses in a sheet name, and cap at 31 characters. */
      function sheetName(raw) {
        const clean = String(raw || '').replace(/[\\/:*?\[\]]+/g, ' ').trim();
        const safe = clean === '' ? '表' : clean;
        return safe.slice(0, 31);
      }

      function columnLetter(index) {
        let value = index + 1;
        let label = '';
        while (value > 0) {
          const rest = (value - 1) % 26;
          label = String.fromCharCode(65 + rest) + label;
          value = Math.floor((value - 1) / 26);
        }
        return label;
      }

      /** Header row plus one row per record; subtask progress is appended. */
      function viewXlsxBlob(store, view, rows) {
        const fieldsById = {};
        for (const field of store.fields) fieldsById[field.id] = field;
        const fields = view.columns.map((column) => fieldsById[column.fieldId]).filter((field) => field !== undefined);
        const matrix = [fields.map((field) => field.name).concat(['子任务'])];
        for (const todo of rows) {
          const line = fields.map((field) => cellText(field, todo.values[field.id]));
          // The whole subtask list, not just 1/2: the sheet is what people take
          // away from the panel, and the items are the part they need.
          const subs = todo.subtasks || [];
          line.push(subs.length === 0 ? '' : subtaskProgress(todo) + '：' + subs.map((sub) => (sub.done ? '✓ ' : '· ') + sub.text).join('；'));
          matrix.push(line);
        }
        const cells = matrix
          .map((line, rowIndex) => {
            const inner = line
              .map((value, columnIndex) => {
                if (value === '' || value === '—') return '';
                const ref = columnLetter(columnIndex) + String(rowIndex + 1);
                return '<c r="' + ref + '" t="inlineStr"><is><t xml:space="preserve">' + xmlEscape(value) + '</t></is></c>';
              })
              .join('');
            return '<row r="' + String(rowIndex + 1) + '">' + inner + '</row>';
          })
          .join('');
        const sheet =
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
          '<sheetData>' + cells + '</sheetData></worksheet>';
        const workbook =
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
          'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
          '<sheets><sheet name="' + xmlEscape(sheetName(view.name)) + '" sheetId="1" r:id="rId1"/></sheets></workbook>';
        return zipStore([
          {
            name: '[Content_Types].xml',
            text:
              '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
              '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
              '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
              '<Default Extension="xml" ContentType="application/xml"/>' +
              '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
              '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
              '</Types>',
          },
          {
            name: '_rels/.rels',
            text:
              '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
              '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
              '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
              '</Relationships>',
          },
          { name: 'xl/workbook.xml', text: workbook },
          {
            name: 'xl/_rels/workbook.xml.rels',
            text:
              '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
              '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
              '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
              '</Relationships>',
          },
          { name: 'xl/worksheets/sheet1.xml', text: sheet },
        ]);
      }

      /** Notes travel as Markdown; a struck-out note stays struck out. */
      function notesMarkdown(notes) {
        const sorted = notes.slice().sort(function (left, right) {
          const a = String(right.updatedAt || right.createdAt);
          const b = String(left.updatedAt || left.createdAt);
          return a.localeCompare(b);
        });
        const lines = ['# 随笔', '', '共 ' + String(sorted.length) + ' 条 · 导出于 ' + new Date().toLocaleString('zh-CN'), ''];
        for (const note of sorted) {
          const when = shortTime(note.updatedAt || note.createdAt);
          const body = String(note.text || '').trim();
          lines.push('### ' + when, '', note.struck ? '~~' + body + '~~' : body, '');
        }
        if (sorted.length === 0) lines.push('（还没有随笔）', '');
        return lines.join('\n');
      }

      /** Resolve a theme variable at export time so the image follows the theme. */
      function colorOr(variable, fallback) {
        try {
          const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
          return value === '' ? fallback : value;
        } catch {
          return fallback;
        }
      }

      /** The panel paints on whatever the app has behind it; sample the nearest opaque one. */
      function cardPalette(element) {
        const fallback = { bg: '#141b25', text: '#e7eef8', muted: '#8ea2bb', border: 'rgba(150,178,214,0.28)' };
        if (!element) return fallback;
        let node = element;
        let background = '';
        while (node && node !== document.documentElement) {
          const color = getComputedStyle(node).backgroundColor;
          if (color && color !== 'transparent' && color.indexOf('rgba(0, 0, 0, 0)') < 0) {
            background = color;
            break;
          }
          node = node.parentElement;
        }
        if (background === '' || background.indexOf('rgba') >= 0) background = fallback.bg;
        return {
          bg: background,
          text: getComputedStyle(element).color || fallback.text,
          muted: colorOr('--dsw-alias-label-secondary', fallback.muted),
          border: colorOr('--dsw-alias-border-light', fallback.border),
        };
      }

      function isDarkColor(color) {
        const hex = /^#([0-9a-f]{6})$/i.exec(String(color).trim());
        if (hex !== null) {
          const value = Number.parseInt(hex[1], 16);
          const r = (value >> 16) & 255;
          const g = (value >> 8) & 255;
          const b = value & 255;
          return (r * 299 + g * 587 + b * 114) / 1000 < 140;
        }
        const rgb = /rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/.exec(String(color));
        if (rgb !== null) {
          return (Number(rgb[1]) * 299 + Number(rgb[2]) * 587 + Number(rgb[3]) * 114) / 1000 < 140;
        }
        return true;
      }

      function drawRounded(paint, x, y, width, height, radius) {
        const r = Math.min(radius, height / 2, width / 2);
        paint.beginPath();
        paint.moveTo(x + r, y);
        paint.lineTo(x + width - r, y);
        paint.quadraticCurveTo(x + width, y, x + width, y + r);
        paint.lineTo(x + width, y + height - r);
        paint.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        paint.lineTo(x + r, y + height);
        paint.quadraticCurveTo(x, y + height, x, y + height - r);
        paint.lineTo(x, y + r);
        paint.quadraticCurveTo(x, y, x + r, y);
        paint.closePath();
      }

      function fitText(paint, value, max) {
        if (paint.measureText(value).width <= max) return value;
        let cut = value;
        while (cut.length > 1 && paint.measureText(cut + '…').width > max) cut = cut.slice(0, -1);
        return cut + '…';
      }

      /** Draw the view as a share card in the panel's own colours and chips. */
      function viewPngBlob(store, view, rows, scale, element, done) {
        const fieldsById = {};
        for (const field of store.fields) fieldsById[field.id] = field;
        const columns = view.columns
          .map((column) => ({ field: fieldsById[column.fieldId], width: column.width }))
          .filter((entry) => entry.field !== undefined)
          .slice(0, 8);
        if (columns.length === 0) {
          done(null);
          return;
        }
        const unit = Number.isFinite(scale) && scale > 0 ? scale : 1;
        const palette = cardPalette(element);
        const dark = isDarkColor(palette.bg);
        const ratio = 2;
        const width = 1180;
        const pad = Math.round(28 * unit);
        const titleSize = Math.round(19 * unit);
        const metaSize = Math.round(12 * unit);
        const headSize = Math.round(12 * unit);
        const cellSize = Math.round(13 * unit);
        const subSize = Math.round(11 * unit);
        const rowHeight = Math.round(42 * unit);
        const subHeight = Math.round(21 * unit);
        const headerHeight = Math.round(38 * unit);
        const titleBlock = Math.round(46 * unit);
        const visible = rows.slice(0, 20);
        const bodyHeight = visible.reduce((sum, todo) => sum + rowHeight + (todo.subtasks || []).length * subHeight, 0);
        const height = titleBlock + Math.round(52 * unit) + headerHeight + bodyHeight + Math.round(46 * unit);
        const canvas = document.createElement('canvas');
        canvas.width = width * ratio;
        canvas.height = Math.round(height * ratio);
        const paint = canvas.getContext('2d');
        if (paint === null) {
          done(null);
          return;
        }
        paint.scale(ratio, ratio);
        const family = '"PingFang SC", "Microsoft YaHei", -apple-system, system-ui, sans-serif';
        paint.fillStyle = palette.bg;
        paint.fillRect(0, 0, width, height);
        paint.strokeStyle = palette.border;
        paint.lineWidth = 1;
        paint.strokeRect(0.5, 0.5, width - 1, height - 1);
        paint.textBaseline = 'middle';
        paint.fillStyle = palette.text;
        paint.font = '600 ' + titleSize + 'px ' + family;
        paint.fillText(view.name, pad, pad + titleSize / 2);
        paint.fillStyle = palette.muted;
        paint.font = metaSize + 'px ' + family;
        paint.fillText(rows.length + ' 行 · ' + new Date().toLocaleDateString('zh-CN') + ' · 随手记 · 待办', pad, pad + titleSize + Math.round(16 * unit));
        const usable = width - pad * 2;
        const rawWidths = columns.map((entry) => entry.width || 120);
        const weight = rawWidths.reduce((sum, value) => sum + value, 0);
        const widths = rawWidths.map((value) => Math.max(Math.round(64 * unit), Math.round((value / weight) * usable)));
        const shrink = usable / widths.reduce((sum, value) => sum + value, 0);
        for (let index = 0; index < widths.length; index += 1) widths[index] = Math.floor(widths[index] * shrink);
        // Rounding down leaves a few pixels over; give them to the last column
        // so the rules and the header band stop exactly at the card edge.
        const leftover = usable - widths.reduce((sum, value) => sum + value, 0);
        if (leftover > 0) widths[widths.length - 1] += leftover;
        const tableTop = titleBlock + Math.round(52 * unit);
        paint.fillStyle = dark ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.035)';
        paint.fillRect(pad, tableTop, usable, headerHeight);
        paint.textBaseline = 'middle';
        let headX = pad;
        for (let index = 0; index < columns.length; index += 1) {
          paint.save();
          paint.beginPath();
          paint.rect(headX + 10, tableTop, widths[index] - 20, headerHeight);
          paint.clip();
          paint.fillStyle = palette.muted;
          paint.font = '600 ' + headSize + 'px ' + family;
          paint.fillText(columns[index].field.name, headX + 10, tableTop + headerHeight / 2);
          paint.restore();
          headX += widths[index];
        }
        let y = tableTop + headerHeight;
        const chip = (hue, x, y0, label, maxWidth) => {
          paint.font = '600 ' + Math.round(11 * unit) + 'px ' + family;
          const text = fitText(paint, label, Math.max(20, maxWidth - Math.round(16 * unit)));
          const boxWidth = Math.min(maxWidth, paint.measureText(text).width + Math.round(16 * unit));
          drawRounded(paint, x, y0, boxWidth, Math.round(21 * unit), Math.round(6 * unit));
          paint.fillStyle = 'hsla(' + hue + ', 52%, 55%, 0.18)';
          paint.fill();
          paint.strokeStyle = 'hsla(' + hue + ', 52%, 55%, 0.5)';
          paint.lineWidth = 1;
          paint.stroke();
          paint.fillStyle = palette.text;
          paint.fillText(text, x + Math.round(8 * unit), y0 + Math.round(21 * unit) / 2);
          return boxWidth;
        };
        for (let rowIndex = 0; rowIndex < visible.length; rowIndex += 1) {
          const todo = visible[rowIndex];
          if (rowIndex % 2 === 1) {
            paint.fillStyle = dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)';
            paint.fillRect(pad, y, usable, rowHeight);
          }
          let cellX = pad;
          for (let index = 0; index < columns.length; index += 1) {
            const field = columns[index].field;
            const value = todo.values[field.id];
            const maxWidth = widths[index] - Math.round(20 * unit);
            paint.save();
            paint.beginPath();
            paint.rect(cellX + 10, y, widths[index] - 20, rowHeight);
            paint.clip();
            if ((field.type === 'select' || field.type === 'person') && value) {
              const optionIndex = (field.options || []).findIndex((option) => option.id === value);
              const label = optionName(field, value);
              if (label !== '') {
                chip((Math.max(0, optionIndex) * 47 + 8) % 360, cellX + 10, y + (rowHeight - Math.round(21 * unit)) / 2, label, maxWidth);
              }
            } else if (field.type === 'multiselect' && Array.isArray(value) && value.length > 0) {
              let chipX = cellX + 10;
              for (let pick = 0; pick < Math.min(value.length, 2); pick += 1) {
                const optionIndex = (field.options || []).findIndex((option) => option.id === value[pick]);
                const label = optionName(field, value[pick]);
                if (label === '') continue;
                const room = Math.max(30, cellX + 10 + maxWidth - chipX);
                chipX += chip((Math.max(0, optionIndex) * 47 + 8) % 360, chipX, y + (rowHeight - Math.round(21 * unit)) / 2, label, room) + Math.round(6 * unit);
              }
            } else if (field.type === 'checkbox') {
              paint.fillStyle = value === true ? palette.text : palette.muted;
              paint.font = cellSize + 'px ' + family;
              paint.fillText(value === true ? '✓' : '—', cellX + 10, y + rowHeight / 2);
            } else {
              const shown = cellText(field, value);
              paint.fillStyle = shown === '—' ? palette.muted : palette.text;
              paint.font = cellSize + 'px ' + family;
              paint.fillText(fitText(paint, String(shown), maxWidth), cellX + 10, y + rowHeight / 2);
            }
            paint.restore();
            cellX += widths[index];
          }
          // A 1px band, not a stroked hairline: a 0.6px stroke lands between
          // device pixels and renders as a broken, dashed-looking rule.
          paint.fillStyle = palette.border;
          paint.fillRect(pad, y + rowHeight, usable, 1);
          y += rowHeight;
          for (const sub of todo.subtasks || []) {
            const boxSize = Math.round(11 * unit);
            const boxX = pad + Math.round(18 * unit);
            const boxY = y + Math.round((subHeight - boxSize) / 2);
            drawRounded(paint, boxX, boxY, boxSize, boxSize, Math.round(3 * unit));
            paint.fillStyle = sub.done ? palette.text : 'transparent';
            if (sub.done) {
              paint.fill();
            } else {
              paint.strokeStyle = palette.muted;
              paint.lineWidth = 1;
              paint.stroke();
            }
            if (sub.done) {
              paint.strokeStyle = palette.bg;
              paint.lineWidth = Math.max(1, Math.round(1.4 * unit));
              paint.beginPath();
              paint.moveTo(boxX + boxSize * 0.26, boxY + boxSize * 0.52);
              paint.lineTo(boxX + boxSize * 0.44, boxY + boxSize * 0.7);
              paint.lineTo(boxX + boxSize * 0.76, boxY + boxSize * 0.32);
              paint.stroke();
            }
            paint.fillStyle = palette.muted;
            paint.font = subSize + 'px ' + family;
            paint.fillText(
              fitText(paint, sub.text, usable - Math.round(48 * unit)),
              boxX + boxSize + Math.round(6 * unit),
              y + subHeight / 2,
            );
            y += subHeight;
          }
        }
        if (rows.length > visible.length) {
          paint.fillStyle = palette.muted;
          paint.font = subSize + 'px ' + family;
          paint.fillText('还有 ' + (rows.length - visible.length) + ' 行没画进来', pad, y + Math.round(14 * unit));
        }
        paint.fillStyle = palette.muted;
        paint.font = subSize + 'px ' + family;
        paint.fillText('notes-todo · 我在 DSH 里那张表', pad, height - Math.round(22 * unit));
        canvas.toBlob((blob) => done(blob), 'image/png');
      }


      /** Cheap fingerprint of what is on screen, used to notice a host-side write. */
      function storeSignature(store) {
        if (!store) return '';
        const stamp = (list) =>
          list.reduce((last, item) => {
            const value = String(item.updatedAt || '');
            return value > last ? value : last;
          }, '');
        return [
          store.fields.map((field) => field.id).join(','),
          store.views.map((view) => view.id).join(','),
          store.todos.length,
          store.notes.length,
          stamp(store.todos),
          stamp(store.notes),
        ].join('|');
      }

      async function hostCall(endpoint, payload) {
        let connection;
        try {
          connection = ctx.get('connection');
        } catch {
          return null;
        }
        const rpc = connection && connection.rpc;
        if (!rpc || typeof rpc.call !== 'function') return null;
        const result = await rpc.call(CHANNEL, endpoint, payload || {});
        if (!result || result.ok !== true) {
          throw new Error((result && result.error && result.error.message) || `调用 ${endpoint} 失败`);
        }
        return result.value;
      }

      function NoteEditor(props) {
        const [value, setValue] = React.useState(props.note.text);
        const area = React.useRef(null);

        const strike = () => {
          const element = area.current;
          if (!element) {
            setValue(`~~${value}~~`);
            return;
          }
          const start = element.selectionStart;
          const end = element.selectionEnd;
          if (start === end) {
            setValue(`~~${value}~~`);
            return;
          }
          setValue(`${value.slice(0, start)}~~${value.slice(start, end)}~~${value.slice(end)}`);
          window.requestAnimationFrame(() => {
            try {
              element.focus();
              element.setSelectionRange(start + 2, end + 2);
            } catch {
              /* the textarea may already be gone */
            }
          });
        };

        return h(
          'div',
          { style: S.editor },
          h('textarea', {
            ref: area,
            style: S.textarea,
            value,
            placeholder: '随手写点什么…',
            onChange: (event) => setValue(event.target.value),
            onKeyDown: (event) => {
              if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') props.onSave(value);
            },
          }),
          h(
            'div',
            { style: S.row },
            h('button', { type: 'button', style: S.button, onClick: () => props.onSave(value) }, '保存'),
            h('button', { type: 'button', style: S.buttonGhost, onClick: props.onCancel }, '取消'),
            h('button', { type: 'button', style: S.buttonGhost, onClick: strike }, '划线选中'),
            h('span', { style: S.hint }, '选中文字点「划线选中」只划这几句；不选文字直接点则划掉整条。划线用 ~~ 标记。'),
          ),
        );
      }

      /** One search box, used by both tabs; Escape clears it. */
      function SearchBox(props) {
        return h(
          'div',
          { style: S.search },
          h('span', { style: { color: 'var(--dsw-alias-label-secondary)', fontSize: 'calc(12px * var(--nt-scale, 1))', flex: '0 0 auto' } }, '⌕'),
          h('input', {
            style: S.searchInput,
            value: props.value,
            placeholder: props.placeholder || '搜索',
            onChange: (event) => props.onChange(event.target.value),
            onKeyDown: (event) => {
              if (event.key === 'Escape') props.onChange('');
            },
          }),
          props.value !== ''
            ? h(
                'button',
                {
                  type: 'button',
                  style: Object.assign({}, S.buttonGhost, { padding: '0 6px', flex: '0 0 auto' }),
                  onClick: () => props.onChange(''),
                  title: '清空搜索',
                },
                '×',
              )
            : null,
        );
      }

      function NotesTab(props) {
        const store = props.store;
        const commit = props.commit;
        const [draft, setDraft] = React.useState('');
        const [editing, setEditing] = React.useState('');
        const [confirmId, setConfirmId] = React.useState('');
        const query = props.query || '';

        const add = () => {
          if (draft.trim() === '') return;
          const when = nowIso();
          const note = { id: makeId('n'), text: draft, struck: false, createdAt: when, updatedAt: when };
          commit((current) => Object.assign({}, current, { notes: [note].concat(current.notes) }));
          setDraft('');
        };

        const update = (id, patch) => {
          commit((current) =>
            Object.assign({}, current, {
              notes: current.notes.map((note) => (note.id === id ? Object.assign({}, note, patch) : note)),
            }),
          );
        };

        const remove = (id) => {
          commit((current) => Object.assign({}, current, { notes: current.notes.filter((note) => note.id !== id) }));
        };

        const askDelete = (id) => {
          if (confirmId === id) {
            setConfirmId('');
            remove(id);
            return;
          }
          setConfirmId(id);
          window.setTimeout(() => {
            setConfirmId((current) => (current === id ? '' : current));
          }, 4000);
        };

        const shown = store.notes.filter((note) => noteMatchesQuery(note, query));

        const list = shown.map((note) => {
          if (editing === note.id) {
            return h(NoteEditor, {
              key: note.id,
              note,
              onSave: (text) => {
                update(note.id, { text, updatedAt: nowIso() });
                setEditing('');
              },
              onCancel: () => setEditing(''),
            });
          }
          return h(
            'div',
            { key: note.id, style: S.card },
            h('div', { style: Object.assign({}, S.noteText, note.struck ? S.strike : null) }, renderNote(note.text)),
            h(
              'div',
              { style: S.row },
              h('button', { type: 'button', style: S.buttonGhost, onClick: () => setEditing(note.id) }, '编辑'),
              h(
                'button',
                {
                  type: 'button',
                  style: S.buttonGhost,
                  onClick: () => update(note.id, { struck: !note.struck, updatedAt: nowIso() }),
                },
                note.struck ? '取消整条划线' : '整条划线',
              ),
              h(
                'button',
                {
                  type: 'button',
                  style: Object.assign({}, S.buttonGhost, S.buttonDanger),
                  onClick: () => askDelete(note.id),
                },
                confirmId === note.id ? '再点一次删除' : '删除',
              ),
              h('span', { style: S.meta }, shortTime(note.updatedAt || note.createdAt)),
            ),
          );
        });

        return h(
          'div',
          { style: S.body },
          h(
            'div',
            { style: S.editor },
            h('textarea', {
              style: S.textarea,
              value: draft,
              placeholder: '随手记一条：想法、要查的事、一段摘录…（Ctrl+Enter 直接添加）',
              onChange: (event) => setDraft(event.target.value),
              onKeyDown: (event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') add();
              },
            }),
            h(
              'div',
              { style: S.row },
              h('button', { type: 'button', style: S.button, onClick: add }, '添加随笔'),
              h(
                'span',
                { style: S.meta },
                query.trim() === ''
                  ? `共 ${store.notes.length} 条`
                  : `找到 ${shown.length} 条 / 共 ${store.notes.length} 条`,
              ),
            ),
          ),
          store.notes.length === 0
            ? h('div', { style: S.empty }, '还没有随笔。上面写一条，点「添加随笔」。')
            : shown.length === 0
              ? h('div', { style: S.empty }, `没有匹配「${query.trim()}」的随笔。`)
              : list,
        );
      }

      function FieldRow(props) {
        const field = props.field;
        const [name, setName] = React.useState(field.name);
        const [optionDraft, setOptionDraft] = React.useState('');
        const [confirmDelete, setConfirmDelete] = React.useState(false);

        React.useEffect(() => {
          setName(field.name);
        }, [field.name]);

        const rename = () => {
          const clean = name.trim();
          if (clean === '' || clean === field.name) {
            setName(field.name);
            return;
          }
          props.onRename(field.id, clean);
        };

        const askDelete = () => {
          if (confirmDelete) {
            props.onDelete(field.id);
            return;
          }
          setConfirmDelete(true);
          window.setTimeout(() => setConfirmDelete(false), 4000);
        };

        const hasOptions = OPTION_TYPES[field.type] || field.type === 'multiselect';

        return h(
          'div',
          { style: S.fieldItem },
          h('input', {
            style: Object.assign({}, S.input, { width: 110 }),
            value: name,
            onChange: (event) => setName(event.target.value),
            onBlur: rename,
            onKeyDown: (event) => {
              if (event.key === 'Enter') rename();
              if (event.key === 'Escape') setName(field.name);
            },
          }),
          h('span', { style: S.chip }, FIELD_TYPE_LABEL[field.type] || field.type),
          field.primary ? h('span', { style: S.chip }, '主字段') : null,
          hasOptions
            ? h(
                'span',
                { style: S.row },
                (field.options || []).map((option) =>
                  h(
                    'span',
                    { key: option.id, style: S.row },
                    h('span', { style: S.chip }, option.name),
                    h(
                      'button',
                      {
                        type: 'button',
                        style: Object.assign({}, S.buttonGhost, S.buttonDanger),
                        onClick: () => props.onRemoveOption(field.id, option.id),
                        title: '删除这个选项',
                      },
                      '×',
                    ),
                  ),
                ),
                h('input', {
                  style: Object.assign({}, S.input, { width: 88 }),
                  value: optionDraft,
                  placeholder: '新选项',
                  onChange: (event) => setOptionDraft(event.target.value),
                  onKeyDown: (event) => {
                    if (event.key === 'Enter' && optionDraft.trim() !== '') {
                      props.onAddOption(field.id, optionDraft.trim());
                      setOptionDraft('');
                    }
                  },
                }),
                h(
                  'button',
                  {
                    type: 'button',
                    style: S.buttonGhost,
                    onClick: () => {
                      if (optionDraft.trim() === '') return;
                      props.onAddOption(field.id, optionDraft.trim());
                      setOptionDraft('');
                    },
                  },
                  '加选项',
                ),
              )
            : null,
          h('span', { style: { flex: 1 } }),
          h(
            'button',
            {
              type: 'button',
              style: Object.assign({}, S.buttonGhost, S.buttonDanger),
              onClick: askDelete,
              disabled: field.primary === true,
              title: field.primary === true ? '主字段不能删除' : '删除这个字段',
            },
            field.primary === true ? '主字段' : confirmDelete ? '再点一次删除' : '删除字段',
          ),
        );
      }

      function FieldManager(props) {
        const store = props.store;
        const commit = props.commit;
        const [name, setName] = React.useState('');
        const [type, setType] = React.useState('text');

        const addField = () => {
          const clean = name.trim();
          if (clean === '') return;
          const field = { id: makeId('f'), name: clean, type };
          if (OPTION_TYPES[type] || type === 'multiselect') field.options = [];
          commit((current) =>
            Object.assign({}, current, {
              fields: current.fields.concat([field]),
              views: current.views.map((view) =>
                Object.assign({}, view, {
                  columns: view.columns.concat([{ fieldId: field.id, width: 116 }]),
                }),
              ),
            }),
          );
          setName('');
          setType('text');
        };

        const rename = (id, clean) => {
          commit((current) =>
            Object.assign({}, current, {
              fields: current.fields.map((field) =>
                field.id === id ? Object.assign({}, field, { name: clean }) : field,
              ),
            }),
          );
        };

        const removeField = (id) => {
          commit((current) =>
            Object.assign({}, current, {
              fields: current.fields.filter((field) => field.id !== id),
              todos: current.todos.map((todo) => {
                const values = Object.assign({}, todo.values);
                delete values[id];
                return Object.assign({}, todo, { values });
              }),
              views: current.views.map((view) =>
                Object.assign({}, view, {
                  columns: view.columns.filter((column) => column.fieldId !== id),
                  filters: view.filters.filter((filter) => filter.fieldId !== id),
                  sorts: view.sorts.filter((sort) => sort.fieldId !== id),
                  groupBy: view.groupBy === id ? null : view.groupBy,
                  boardBy: view.boardBy === id ? null : view.boardBy,
                  dateField: view.dateField === id ? null : view.dateField,
                }),
              ),
            }),
          );
        };

        const addOption = (fieldId, optionName) => {
          commit((current) =>
            Object.assign({}, current, {
              fields: current.fields.map((field) =>
                field.id === fieldId
                  ? Object.assign({}, field, {
                      options: (field.options || []).concat([{ id: makeId('o'), name: optionName }]),
                    })
                  : field,
              ),
            }),
          );
        };

        const removeOption = (fieldId, optionId) => {
          commit((current) =>
            Object.assign({}, current, {
              fields: current.fields.map((field) =>
                field.id === fieldId
                  ? Object.assign({}, field, {
                      options: (field.options || []).filter((option) => option.id !== optionId),
                    })
                  : field,
              ),
              todos: current.todos.map((todo) => {
                const value = todo.values[fieldId];
                if (Array.isArray(value)) {
                  if (value.indexOf(optionId) < 0) return todo;
                  const values = Object.assign({}, todo.values);
                  values[fieldId] = value.filter((entry) => entry !== optionId);
                  return Object.assign({}, todo, { values });
                }
                if (value !== optionId) return todo;
                const values = Object.assign({}, todo.values);
                values[fieldId] = '';
                return Object.assign({}, todo, { values });
              }),
            }),
          );
        };

        return h(
          'div',
          { style: S.card },
          h('div', { style: S.meta }, '字段可以自己加、改名、删掉；删字段时这份数据里对应的值也一起清掉。新字段会自动加进所有视图。'),
          store.fields.length === 0
            ? h('div', { style: S.empty }, '还没有字段')
            : store.fields.map((field) =>
                h(FieldRow, {
                  key: field.id,
                  field,
                  onRename: rename,
                  onDelete: removeField,
                  onAddOption: addOption,
                  onRemoveOption: removeOption,
                }),
              ),
          h('div', { style: S.divider }),
          h(
            'div',
            { style: S.row },
            h('input', {
              style: Object.assign({}, S.input, { width: 140 }),
              value: name,
              placeholder: '新字段名称',
              onChange: (event) => setName(event.target.value),
              onKeyDown: (event) => {
                if (event.key === 'Enter') addField();
              },
            }),
            h(
              'select',
              { style: S.input, value: type, onChange: (event) => setType(event.target.value) },
              NEW_FIELD_TYPES.map((entry) => h('option', { key: entry, value: entry }, FIELD_TYPE_LABEL[entry])),
            ),
            h('button', { type: 'button', style: S.button, onClick: addField }, '添加字段'),
          ),
        );
      }

      function SubtaskList(props) {
        const [draft, setDraft] = React.useState('');
        const subtasks = props.subtasks;

        return h(
          'div',
          { style: { display: 'flex', flexDirection: 'column', gap: 5 } },
          h('span', { style: S.label }, `子任务（${subtasks.filter((entry) => entry.done).length}/${subtasks.length}）`),
          subtasks.map((subtask) =>
            h(
              'div',
              { key: subtask.id, style: S.subItem },
              h('input', {
                type: 'checkbox',
                checked: subtask.done,
                onChange: () => props.onToggle(subtask.id),
                style: { margin: 0, cursor: 'pointer' },
              }),
              h(
                'span',
                {
                  style: Object.assign({ flex: 1, wordBreak: 'break-word' }, subtask.done ? S.strike : null),
                },
                subtask.text,
              ),
              h(
                'button',
                {
                  type: 'button',
                  style: Object.assign({}, S.buttonGhost, S.buttonDanger),
                  onClick: () => props.onRemove(subtask.id),
                },
                '×',
              ),
            ),
          ),
          h(
            'div',
            { style: S.row },
            h('input', {
              style: Object.assign({}, S.input, { flex: '1 1 140px' }),
              value: draft,
              placeholder: '加一个子任务，回车添加',
              onChange: (event) => setDraft(event.target.value),
              onKeyDown: (event) => {
                if (event.key === 'Enter' && draft.trim() !== '') {
                  props.onAdd(draft.trim());
                  setDraft('');
                }
              },
            }),
            h(
              'button',
              {
                type: 'button',
                style: S.buttonGhost,
                onClick: () => {
                  if (draft.trim() === '') return;
                  props.onAdd(draft.trim());
                  setDraft('');
                },
              },
              '添加子任务',
            ),
          ),
        );
      }

      /** One bordered control: click anywhere to pick a date, time optional. */
      function DateField(props) {
        const value = typeof props.value === 'string' ? props.value : '';
        const datePart = value.slice(0, 10);
        const timePart = value.length >= 16 ? value.slice(11, 16) : '';
        const [showTime, setShowTime] = React.useState(timePart !== '');
        const dateRef = React.useRef(null);

        const emit = (nextDate, nextTime) => {
          if (nextDate === '') {
            props.onChange('');
            return;
          }
          props.onChange(nextTime ? `${nextDate}T${nextTime}` : nextDate);
        };

        // Open the native picker from the whole box, not just a small icon.
        const openPicker = () => {
          const input = dateRef.current;
          if (!input) return;
          try {
            if (typeof input.showPicker === 'function') {
              input.showPicker();
              return;
            }
          } catch {
            /* some browsers refuse showPicker without a direct gesture */
          }
          try {
            input.focus();
            input.click();
          } catch {
            /* nothing else to try */
          }
        };

        const label =
          datePart === ''
            ? '选择日期'
            : timePart !== ''
              ? `${datePart} ${timePart}`
              : datePart;

        return h(
          'span',
          {
            style: Object.assign({}, S.dateBox, datePart === '' ? { color: 'var(--dsw-alias-label-secondary)' } : null),
            onClick: (event) => {
              // Let the inner inputs and the toggle handle their own clicks.
              if (event.target && event.target.dataset && event.target.dataset.own === '1') return;
              openPicker();
            },
            title: datePart === '' ? '点这一格选择日期' : `${label}（点击修改）`,
          },
          h('span', { style: S.dateText }, label),
          showTime
            ? h('input', {
                type: 'time',
                'data-own': '1',
                style: S.dateTime,
                value: timePart,
                onClick: (event) => event.stopPropagation(),
                onChange: (event) => emit(datePart, event.target.value),
              })
            : null,
          h(
            'button',
            {
              type: 'button',
              'data-own': '1',
              style: S.dateToggle,
              title: showTime ? '去掉时间，只留日期' : '这条要具体到几点',
              onClick: (event) => {
                event.stopPropagation();
                if (showTime) {
                  setShowTime(false);
                  emit(datePart, '');
                  return;
                }
                if (datePart === '') {
                  openPicker();
                  return;
                }
                setShowTime(true);
              },
            },
            showTime ? '×时间' : '＋时间',
          ),
          h('input', {
            ref: dateRef,
            type: 'date',
            style: S.dateGhost,
            value: datePart,
            tabIndex: -1,
            'aria-hidden': 'true',
            onChange: (event) => emit(event.target.value, showTime ? timePart : ''),
          }),
        );
      }

      function RecordEditor(props) {
        const fields = props.fields;
        const [values, setValues] = React.useState(() => Object.assign({}, props.initial));
        const [subtasks, setSubtasks] = React.useState(() => (props.initialSubtasks || []).slice());
        const [confirmDelete, setConfirmDelete] = React.useState(false);
        const primary = fields.find((field) => field.primary === true) || fields[0];

        const setValue = (id, value) => {
          setValues((current) => Object.assign({}, current, { [id]: value }));
        };

        const submit = () => {
          const key = primary ? String(values[primary.id] || '').trim() : '';
          if (key === '') return;
          const clean = Object.assign({}, values);
          if (primary) clean[primary.id] = key;
          props.onSubmit(clean, subtasks);
        };

        const control = (field) => {
          if (field.type === 'checkbox') {
            return h('input', {
              type: 'checkbox',
              checked: values[field.id] === true,
              onChange: (event) => setValue(field.id, event.target.checked),
              style: { cursor: 'pointer', margin: '6px 0' },
            });
          }
          if (field.type === 'datetime') {
            return h(DateField, {
              key: field.id,
              value: values[field.id] || '',
              onChange: (next) => setValue(field.id, next),
            });
          }
          if (OPTION_TYPES[field.type]) {
            return h(
              'select',
              {
                style: S.input,
                value: values[field.id] || '',
                onChange: (event) => setValue(field.id, event.target.value),
              },
              h('option', { value: '' }, '未选'),
              (field.options || []).map((option) =>
                h('option', { key: option.id, value: option.id }, option.name),
              ),
            );
          }
          if (field.type === 'multiselect') {
            const picked = Array.isArray(values[field.id]) ? values[field.id] : [];
            return h(
              'span',
              { style: S.row },
              (field.options || []).length === 0
                ? h('span', { style: S.hint }, '没有可选项，先去「字段管理」添加')
                : (field.options || []).map((option) => {
                    const on = picked.indexOf(option.id) >= 0;
                    return h(
                      'label',
                      {
                        key: option.id,
                        style: Object.assign({}, S.chip, { cursor: 'pointer', display: 'inline-flex', gap: 4 }),
                      },
                      h('input', {
                        type: 'checkbox',
                        checked: on,
                        onChange: () =>
                          setValue(
                            field.id,
                            on ? picked.filter((id) => id !== option.id) : picked.concat([option.id]),
                          ),
                        style: { margin: 0, cursor: 'pointer' },
                      }),
                      option.name,
                    );
                  }),
            );
          }
          return h('input', {
            style: S.input,
            value: values[field.id] || '',
            placeholder: field.primary ? '要做什么' : '',
            onChange: (event) => setValue(field.id, event.target.value),
            onKeyDown: (event) => {
              if (event.key === 'Enter') submit();
            },
          });
        };

        return h(
          'div',
          { style: S.editor },
          h(
            'div',
            { style: S.fieldRow },
            fields.map((field) =>
              h('label', { key: field.id, style: S.field }, h('span', { style: S.label }, field.name), control(field)),
            ),
          ),
          h(SubtaskList, {
            subtasks,
            onAdd: (text) => setSubtasks((current) => current.concat([{ id: makeId('s'), text, done: false }])),
            onToggle: (id) =>
              setSubtasks((current) =>
                current.map((entry) => (entry.id === id ? Object.assign({}, entry, { done: !entry.done }) : entry)),
              ),
            onRemove: (id) => setSubtasks((current) => current.filter((entry) => entry.id !== id)),
          }),
          h(
            'div',
            { style: S.row },
            h('button', { type: 'button', style: S.button, onClick: submit }, props.submitLabel),
            props.onCancel ? h('button', { type: 'button', style: S.buttonGhost, onClick: props.onCancel }, '取消') : null,
            props.onPrefillNow
              ? h(
                  'button',
                  { type: 'button', style: S.buttonGhost, onClick: () => props.onPrefillNow(setValues) },
                  '填此刻',
                )
              : null,
            props.onDelete
              ? h(
                  'button',
                  {
                    type: 'button',
                    style: Object.assign({}, S.buttonGhost, S.buttonDanger),
                    onClick: () => {
                      if (confirmDelete) {
                        props.onDelete();
                        return;
                      }
                      setConfirmDelete(true);
                      window.setTimeout(() => setConfirmDelete(false), 4000);
                    },
                  },
                  confirmDelete ? '再点一次删除' : '删除这条',
                )
              : null,
          ),
        );
      }

      function ViewSettings(props) {
        const store = props.store;
        const commit = props.commit;
        const view = props.view;
        const [name, setName] = React.useState(view.name);
        const [confirmDelete, setConfirmDelete] = React.useState(false);

        React.useEffect(() => {
          setName(view.name);
        }, [view.name]);

        const patchView = (mutate) => {
          commit((current) =>
            Object.assign({}, current, {
              views: current.views.map((entry) => (entry.id === view.id ? mutate(entry) : entry)),
            }),
          );
        };

        const rename = () => {
          const clean = name.trim();
          if (clean === '' || clean === view.name) {
            setName(view.name);
            return;
          }
          patchView((entry) => Object.assign({}, entry, { name: clean }));
        };

        const toggleColumn = (fieldId) => {
          patchView((entry) => {
            const has = entry.columns.some((column) => column.fieldId === fieldId);
            return Object.assign({}, entry, {
              columns: has
                ? entry.columns.filter((column) => column.fieldId !== fieldId)
                : entry.columns.concat([{ fieldId, width: 116 }]),
            });
          });
        };

        const moveColumn = (index, delta) => {
          patchView((entry) => {
            const columns = entry.columns.slice();
            const target = index + delta;
            if (target < 0 || target >= columns.length) return entry;
            const moved = columns.splice(index, 1)[0];
            columns.splice(target, 0, moved);
            return Object.assign({}, entry, { columns });
          });
        };

        const setWidth = (index, width) => {
          patchView((entry) => Object.assign({}, entry, {
            columns: entry.columns.map((column, position) =>
              position === index ? Object.assign({}, column, { width }) : column,
            ),
          }));
        };

        const addFilter = () => {
          const first = store.fields[0];
          if (!first) return;
          patchView((entry) => Object.assign({}, entry, {
            filters: entry.filters.concat([{ fieldId: first.id, op: 'contains', value: '' }]),
          }));
        };

        const patchFilter = (index, patch) => {
          patchView((entry) => Object.assign({}, entry, {
            filters: entry.filters.map((filter, position) =>
              position === index ? Object.assign({}, filter, patch) : filter,
            ),
          }));
        };

        const removeFilter = (index) => {
          patchView((entry) => Object.assign({}, entry, {
            filters: entry.filters.filter((filter, position) => position !== index),
          }));
        };

        const toggleSort = (fieldId) => {
          patchView((entry) => {
            const existing = entry.sorts.find((sort) => sort.fieldId === fieldId);
            if (!existing) return Object.assign({}, entry, { sorts: [{ fieldId, dir: 'asc' }] });
            if (existing.dir === 'asc') {
              return Object.assign({}, entry, {
                sorts: entry.sorts.map((sort) => (sort.fieldId === fieldId ? { fieldId, dir: 'desc' } : sort)),
              });
            }
            return Object.assign({}, entry, { sorts: entry.sorts.filter((sort) => sort.fieldId !== fieldId) });
          });
        };

        const fieldsById = {};
        for (const field of store.fields) fieldsById[field.id] = field;

        const selectOptions = store.fields.filter((field) => GROUP_TYPES[field.type]);
        const dateOptions = store.fields.filter((field) => field.type === 'datetime');

        return h(
          'div',
          { style: S.card },
          h(
            'div',
            { style: S.row },
            h('span', { style: S.label }, '标签页名称'),
            h('input', {
              style: Object.assign({}, S.input, { width: 150 }),
              value: name,
              onChange: (event) => setName(event.target.value),
              onBlur: rename,
              onKeyDown: (event) => {
                if (event.key === 'Enter') rename();
                if (event.key === 'Escape') setName(view.name);
              },
            }),
            h('span', { style: S.chip }, VIEW_TYPE_LABEL[view.type] || view.type),
          ),
          h('div', { style: S.label }, '显示哪些字段（勾选即显示，表格里也能拖表头换顺序、拖列边改宽度）'),
          h(
            'div',
            { style: S.row },
            store.fields.length === 0
              ? h('span', { style: S.hint }, '还没有字段，先去「字段管理」加一个。')
              : store.fields.map((field) => {
                  const on = view.columns.some((column) => column.fieldId === field.id);
                  return h(
                    'label',
                    { key: field.id, style: Object.assign({}, S.chip, { cursor: 'pointer', display: 'inline-flex', gap: 5 }) },
                    h('input', {
                      type: 'checkbox',
                      checked: on,
                      onChange: () => toggleColumn(field.id),
                      style: { margin: 0, cursor: 'pointer' },
                    }),
                    field.name,
                  );
                }),
          ),
          view.columns.length > 0
            ? h(
                'div',
                { style: { display: 'flex', flexDirection: 'column', gap: 4 } },
                h('span', { style: S.label }, '列顺序与宽度'),
                view.columns.map((column, index) =>
                  h(
                    'div',
                    { key: column.fieldId, style: S.row },
                    h('span', { style: S.chip }, (fieldsById[column.fieldId] || { name: '?' }).name),
                    h(
                      'button',
                      { type: 'button', style: S.buttonGhost, onClick: () => moveColumn(index, -1), disabled: index === 0 },
                      '↑',
                    ),
                    h(
                      'button',
                      { type: 'button', style: S.buttonGhost, onClick: () => moveColumn(index, 1), disabled: index === view.columns.length - 1 },
                      '↓',
                    ),
                    h('input', {
                      type: 'number',
                      style: Object.assign({}, S.input, { width: 74 }),
                      value: column.width,
                      min: 60,
                      max: 640,
                      onChange: (event) => setWidth(index, Math.max(60, Math.min(640, Number(event.target.value) || 116))),
                    }),
                    h('span', { style: S.hint }, 'px'),
                  ),
                ),
              )
            : null,
          h('div', { style: S.divider }),
          h(
            'div',
            { style: S.row },
            h('span', { style: S.label }, '筛选'),
            view.filters.length > 1
              ? h(
                  'select',
                  {
                    style: S.input,
                    value: view.filterMode,
                    onChange: (event) =>
                      patchView((entry) => Object.assign({}, entry, { filterMode: event.target.value })),
                  },
                  h('option', { value: 'and' }, '全部满足（且）'),
                  h('option', { value: 'or' }, '任一满足（或）'),
                )
              : null,
            h('button', { type: 'button', style: S.buttonGhost, onClick: addFilter }, '＋ 添加条件'),
            view.filters.length > 0
              ? h(
                  'button',
                  {
                    type: 'button',
                    style: S.buttonGhost,
                    onClick: () => patchView((entry) => Object.assign({}, entry, { filters: [] })),
                  },
                  '清空条件',
                )
              : null,
          ),
          view.filters.length === 0
            ? h('span', { style: S.hint }, '没有筛选条件，显示全部待办。')
            : view.filters.map((filter, index) =>
                h(
                  'div',
                  { key: `f${index}`, style: S.row },
                  h(
                    'select',
                    {
                      style: S.input,
                      value: filter.fieldId,
                      onChange: (event) => patchFilter(index, { fieldId: event.target.value }),
                    },
                    store.fields.map((field) => h('option', { key: field.id, value: field.id }, field.name)),
                  ),
                  h(
                    'select',
                    {
                      style: S.input,
                      value: filter.op,
                      onChange: (event) => patchFilter(index, { op: event.target.value }),
                    },
                    FILTER_OPS.map((op) => h('option', { key: op, value: op }, FILTER_OP_LABEL[op])),
                  ),
                  filterNeedsValue(filter.op)
                    ? (() => {
                        const field = fieldsById[filter.fieldId];
                        const picked = String(filter.value || '')
                          .split('|')
                          .filter(Boolean);
                        const isMulti = filter.op === 'contains';

                        // Text field, or no options to pick from: free text.
                        if (!field || !(OPTION_TYPES[field.type] || field.type === 'multiselect')) {
                          return h('input', {
                            style: Object.assign({}, S.input, { width: 130 }),
                            value: filter.value,
                            placeholder: isMulti ? '多个词用 | 分隔' : '筛选值',
                            onChange: (event) => patchFilter(index, { value: event.target.value }),
                          });
                        }

                        if (isMulti) {
                          // "contains" takes several values: toggle any number.
                          return h(
                            'span',
                            { style: S.row },
                            (field.options || []).length === 0
                              ? h('span', { style: S.hint }, '这个字段还没有选项')
                              : (field.options || []).map((option) => {
                                  const on = picked.indexOf(option.name) >= 0;
                                  return h(
                                    'label',
                                    {
                                      key: option.id,
                                      style: Object.assign({}, S.chip, {
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        gap: 4,
                                        borderColor: on ? 'var(--dsw-alias-label-primary)' : undefined,
                                      }),
                                    },
                                    h('input', {
                                      type: 'checkbox',
                                      checked: on,
                                      style: { margin: 0, cursor: 'pointer' },
                                      onChange: () => {
                                        const next = on
                                          ? picked.filter((name) => name !== option.name)
                                          : picked.concat([option.name]);
                                        patchFilter(index, { value: next.join('|') });
                                      },
                                    }),
                                    option.name,
                                  );
                                }),
                          );
                        }

                        // "is" is single-valued.
                        return h(
                          'select',
                          {
                            style: S.input,
                            value: picked[0] || '',
                            onChange: (event) => patchFilter(index, { value: event.target.value }),
                          },
                          h('option', { value: '' }, '（空）'),
                          (field.options || []).map((option) =>
                            h('option', { key: option.id, value: option.name }, option.name),
                          ),
                        );
                      })()
                    : null,
                  h(
                    'button',
                    {
                      type: 'button',
                      style: Object.assign({}, S.buttonGhost, S.buttonDanger),
                      onClick: () => removeFilter(index),
                    },
                    '移除',
                  ),
                ),
              ),
          h('div', { style: S.divider }),
          h('div', { style: S.label }, '排序（点表格表头也能切：升序→降序→无）'),
          h(
            'div',
            { style: S.row },
            store.fields.map((field) => {
              const sort = view.sorts.find((entry) => entry.fieldId === field.id);
              return h(
                'button',
                {
                  key: field.id,
                  type: 'button',
                  style: Object.assign({}, S.chip, {
                    cursor: 'pointer',
                    borderColor: sort ? 'var(--dsw-alias-label-primary)' : 'var(--dsw-alias-border-l1)',
                  }),
                  onClick: () => toggleSort(field.id),
                },
                `${field.name}${sort ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''}`,
              );
            }),
          ),
          h('div', { style: S.divider }),
          h(
            'div',
            { style: S.row },
            h('span', { style: S.label }, '分组（表格视图）'),
            h(
              'select',
              {
                style: S.input,
                value: view.groupBy || '',
                onChange: (event) =>
                  patchView((entry) =>
                    Object.assign({}, entry, { groupBy: event.target.value === '' ? null : event.target.value }),
                  ),
              },
              h('option', { value: '' }, '不分组'),
              selectOptions.map((field) => h('option', { key: field.id, value: field.id }, field.name)),
            ),
            h('span', { style: S.label }, '看板分栏字段'),
            h(
              'select',
              {
                style: S.input,
                value: view.boardBy || '',
                onChange: (event) =>
                  patchView((entry) =>
                    Object.assign({}, entry, { boardBy: event.target.value === '' ? null : event.target.value }),
                  ),
              },
              h('option', { value: '' }, '按任务分类之外的字段…'),
              selectOptions.map((field) => h('option', { key: field.id, value: field.id }, field.name)),
            ),
            h('span', { style: S.label }, '日历日期字段'),
            h(
              'select',
              {
                style: S.input,
                value: view.dateField || '',
                onChange: (event) =>
                  patchView((entry) =>
                    Object.assign({}, entry, { dateField: event.target.value === '' ? null : event.target.value }),
                  ),
              },
              h('option', { value: '' }, '未选'),
              dateOptions.map((field) => h('option', { key: field.id, value: field.id }, field.name)),
            ),
          ),
          h('div', { style: S.divider }),
          h(
            'div',
            { style: S.row },
            h(
              'button',
              {
                type: 'button',
                style: Object.assign({}, S.buttonGhost, S.buttonDanger),
                onClick: () => {
                  if (confirmDelete) {
                    props.onDelete(view.id);
                    return;
                  }
                  setConfirmDelete(true);
                  window.setTimeout(() => setConfirmDelete(false), 4000);
                },
                disabled: store.views.length <= 1,
                title: store.views.length <= 1 ? '至少保留一个视图' : '删除这个视图',
              },
              confirmDelete ? '再点一次删除视图' : '删除这个视图',
            ),
            h('span', { style: S.hint }, '删除视图不会删掉里面的待办数据。'),
          ),
        );
      }

      /** Modal shell: mask click and Escape both close it. */
      function Modal(props) {
        React.useEffect(() => {
          const onKey = (event) => {
            if (event.key === 'Escape') props.onClose();
          };
          window.addEventListener('keydown', onKey);
          return () => window.removeEventListener('keydown', onKey);
        }, [props.onClose]);

        return h(
          'div',
          {
            style: S.modalMask,
            onMouseDown: (event) => {
              if (event.target === event.currentTarget) props.onClose();
            },
          },
          h(
            'div',
            { style: S.modal, onMouseDown: (event) => event.stopPropagation() },
            h(
              'div',
              { style: S.modalHead },
              h('span', { style: S.modalTitle }, props.title),
              h('span', { style: { flex: 1 } }),
              h(
                'button',
                { type: 'button', style: S.buttonGhost, onClick: props.onClose, title: '关闭（Esc）' },
                '关闭',
              ),
            ),
            props.children,
          ),
        );
      }

      /** Shared record mutations for the three view bodies. */
      function useRecordActions(store, commit) {
        const addRecord = (values, subtasks) => {
          const when = nowIso();
          const todo = { id: makeId('t'), values, subtasks: subtasks || [], createdAt: when, updatedAt: when };
          commit((current) => Object.assign({}, current, { todos: [todo].concat(current.todos) }));
        };

        const updateRecord = (id, values, subtasks) => {
          commit((current) =>
            Object.assign({}, current, {
              todos: current.todos.map((todo) =>
                todo.id === id
                  ? Object.assign({}, todo, {
                      values,
                      subtasks: subtasks === undefined ? todo.subtasks : subtasks,
                      updatedAt: nowIso(),
                    })
                  : todo,
              ),
            }),
          );
        };

        const patchRecord = (id, mutate) => {
          commit((current) =>
            Object.assign({}, current, {
              todos: current.todos.map((todo) =>
                todo.id === id ? Object.assign({}, mutate(todo), { updatedAt: nowIso() }) : todo,
              ),
            }),
          );
        };

        const removeRecord = (id) => {
          commit((current) =>
            Object.assign({}, current, { todos: current.todos.filter((todo) => todo.id !== id) }),
          );
        };

        const prefillNow = (setValues) => {
          const patch = {};
          for (const field of store.fields) {
            if (field.type === 'datetime') patch[field.id] = todayLocal();
          }
          setValues((current) => Object.assign({}, current, patch));
        };

        return { addRecord, updateRecord, patchRecord, removeRecord, prefillNow };
      }

      function TableView(props) {
        const store = props.store;
        const commit = props.commit;
        const view = props.view;
        const actions = props.actions;
        const [editingId, setEditingId] = React.useState('');
        const [adding, setAdding] = React.useState(false);
        // Per-row subtask disclosure; absent means open.
        const [expanded, setExpanded] = React.useState({});
        const [dragField, setDragField] = React.useState('');
        const [resizing, setResizing] = React.useState(null);
        const [liveWidth, setLiveWidth] = React.useState({});
        // Read the newest drag width from a ref: the pointerup listener must
        // not close over a stale render's state.
        const liveWidthRef = React.useRef({});
        liveWidthRef.current = liveWidth;
        const rows = selectRows(store, view, props.query);

        /** Flip one row's subtask disclosure; a missing key counts as open. */
        const toggleExpanded = (id) => {
          setExpanded((current) => {
            const next = Object.assign({}, current);
            const isOpen = current[id] !== false;
            next[id] = !isOpen;
            return next;
          });
        };

        const fieldsById = {};
        for (const field of store.fields) fieldsById[field.id] = field;

        const columns = view.columns.map((column, index) => ({
          column,
          field: fieldsById[column.fieldId],
          index,
        })).filter((entry) => entry.field !== undefined);

        // Column resize: track the pointer while dragging, commit on release.
        React.useEffect(() => {
          if (!resizing) return;
          const onMove = (event) => {
            const width = Math.max(60, Math.min(640, resizing.startWidth + (event.clientX - resizing.startX)));
            setLiveWidth((current) => Object.assign({}, current, { [resizing.fieldId]: width }));
          };
          const onUp = () => {
            const width = liveWidthRef.current[resizing.fieldId];
            if (typeof width === 'number') {
              commit((current) => ({
                ...current,
                views: current.views.map((entry) =>
                  entry.id === view.id
                    ? {
                        ...entry,
                        columns: entry.columns.map((column) =>
                          column.fieldId === resizing.fieldId ? Object.assign({}, column, { width }) : column,
                        ),
                      }
                    : entry,
                ),
              }));
            }
            setLiveWidth({});
            setResizing(null);
          };
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
          return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
          };
        }, [resizing, commit, view.id]);

        const widthOf = (column) =>
          typeof liveWidth[column.fieldId] === 'number' ? liveWidth[column.fieldId] : column.width;

        // Every track is minmax(width, <width>fr): the set width is the floor and
        // leftover space is shared proportionally, so the row rules always reach
        // the right edge instead of stopping short and looking chopped. Using a
        // single 1fr for the last column would instead blow 操作 up to half the
        // table on a wide panel.
        const track = (width) => `minmax(${width}px, ${width}fr)`;
        const template = columns
          .map((entry) => track(widthOf(entry.column)))
          .concat([track(92)])
          .join(' ');
        const minWidth = columns.reduce((sum, entry) => sum + widthOf(entry.column), 92) + 20;

        const reorder = (fromId, toId) => {
          if (fromId === toId) return;
          commit((current) => ({
            ...current,
            views: current.views.map((entry) => {
              if (entry.id !== view.id) return entry;
              const list = entry.columns.slice();
              const from = list.findIndex((column) => column.fieldId === fromId);
              const to = list.findIndex((column) => column.fieldId === toId);
              if (from < 0 || to < 0) return entry;
              const moved = list.splice(from, 1)[0];
              list.splice(to, 0, moved);
              return Object.assign({}, entry, { columns: list });
            }),
          }));
        };

        const sortBy = (fieldId) => {
          commit((current) => ({
            ...current,
            views: current.views.map((entry) => {
              if (entry.id !== view.id) return entry;
              const existing = entry.sorts.find((sort) => sort.fieldId === fieldId);
              if (!existing) return Object.assign({}, entry, { sorts: [{ fieldId, dir: 'asc' }] });
              if (existing.dir === 'asc') {
                return Object.assign({}, entry, {
                  sorts: entry.sorts.map((sort) => (sort.fieldId === fieldId ? { fieldId, dir: 'desc' } : sort)),
                });
              }
              return Object.assign({}, entry, { sorts: entry.sorts.filter((sort) => sort.fieldId !== fieldId) });
            }),
          }));
        };

        const header = h(
          'div',
          {
            style: Object.assign({}, S.tableHeadRow, {
              gridTemplateColumns: template,
              minWidth,
            }),
          },
          columns.map((entry, position) =>
            h(
              'div',
              {
                key: entry.field.id,
                style: Object.assign(
                  {},
                  S.headCell,
                  position === columns.length - 1 ? S.cellLast : null,
                ),
                draggable: true,
                onDragStart: () => setDragField(entry.field.id),
                onDragEnd: () => setDragField(''),
                onDragOver: (event) => event.preventDefault(),
                onDrop: () => {
                  reorder(dragField, entry.field.id);
                  setDragField('');
                },
                onClick: () => sortBy(entry.field.id),
                title: '点击排序 · 拖动换位置 · 拖右边缘改宽度',
              },
              h('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis', flex: '1 1 auto' } }, entry.field.name),
              (() => {
                const sort = view.sorts.find((item) => item.fieldId === entry.field.id);
                return sort ? h('span', { style: { flex: '0 0 auto' } }, sort.dir === 'asc' ? '↑' : '↓') : null;
              })(),
              // One wide invisible handle: the cell border is the visual edge.
              h('span', {
                style: S.grip,
                title: '拖动改列宽',
                onMouseDown: (event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setResizing({ fieldId: entry.field.id, startX: event.clientX, startWidth: widthOf(entry.column) });
                },
                onClick: (event) => event.stopPropagation(),
                onDragStart: (event) => event.preventDefault(),
              }),
            ),
          ),
          // cellLast, or this border doubles up with the table frame's own
          // border and the right edge reads as a 2px double line.
          h(
            'div',
            { style: Object.assign({}, S.headCell, S.cellLast, { cursor: 'default' }) },
            '操作',
          ),
        );

        const rowNode = (todo, rowIndex) => {
          if (editingId === todo.id) {
            return h(RecordEditor, {
              key: `edit-${todo.id}`,
              fields: store.fields,
              initial: todo.values,
              initialSubtasks: todo.subtasks,
              submitLabel: '保存修改',
              onSubmit: (values, subtasks) => {
                actions.updateRecord(todo.id, values, subtasks);
                setEditingId('');
              },
              onCancel: () => setEditingId(''),
              onDelete: () => {
                actions.removeRecord(todo.id);
                setEditingId('');
              },
              onPrefillNow: actions.prefillNow,
            });
          }

          const progress = subtaskProgress(todo);
          const subs = todo.subtasks || [];
          const open = expanded[todo.id] !== false; // open by default

          // Each subtask is its own table row using the same grid template as
          // the record rows, so every column rule lines up with its parent.
          const subRows =
            subs.length > 0 && open
              ? subs.map((sub) =>
                  h(
                    'div',
                    {
                      key: `${todo.id}:${sub.id}`,
                      style: Object.assign({}, S.tableRow, S.subRow),
                    },
                    h(
                      'div',
                      {
                        style: {
                          display: 'grid',
                          gridTemplateColumns: template,
                          gap: 0,
                          alignItems: 'stretch',
                        },
                      },
                      columns.map((entry, index) => {
                        const cellStyle = Object.assign(
                          {},
                          S.subCellBox,
                          index === columns.length - 1 ? S.subCellBoxLast : null,
                        );
                        if (index === 0) {
                          return h(
                            'div',
                            { key: entry.field.id, style: cellStyle },
                            h(
                              'label',
                              { style: S.subCell, title: sub.text },
                              h('input', {
                                type: 'checkbox',
                                checked: sub.done === true,
                                style: { margin: 0, cursor: 'pointer', flex: '0 0 auto' },
                                onChange: () =>
                                  actions.patchRecord(todo.id, (current) => {
                                    const subtasks = (current.subtasks || []).map((item) =>
                                      item.id === sub.id ? Object.assign({}, item, { done: !item.done }) : item,
                                    );
                                    return Object.assign({}, current, { subtasks });
                                  }),
                              }),
                              h(
                                'span',
                                {
                                  style: Object.assign(
                                    { minWidth: 0, wordBreak: 'break-word' },
                                    sub.done ? S.strike : null,
                                  ),
                                },
                                sub.text,
                              ),
                            ),
                          );
                        }
                        // Remaining cells are present but empty, keeping the
                        // column rules running the full width at no extra height.
                        return h('div', { key: entry.field.id, style: cellStyle });
                      }),
                      h('div', { style: Object.assign({}, S.subCellBox, S.subCellBoxLast) }),
                    ),
                  ),
                )
              : null;

          return h(
            'div',
            { key: todo.id },
            h(
              'div',
              { style: S.tableRow },
              h(
                'div',
                {
                  style: {
                    display: 'grid',
                    gridTemplateColumns: template,
                    gap: 0,
                    // stretch, not start: a cell only paints its right border
                    // as tall as itself, so a short cell (an empty 标签 column
                    // next to a 标签 chip) cut the column rule mid-row and the
                    // table looked torn along every vertical line.
                    alignItems: 'stretch',
                  },
                },
                columns.map((entry, index) => {
                  const value = todo.values[entry.field.id];
                  const inner =
                    OPTION_TYPES[entry.field.type]
                      ? h(
                          'span',
                          { style: Object.assign({}, S.chip, optionTone(entry.field, value)) },
                          cellText(entry.field, value),
                        )
                      : entry.field.type === 'multiselect'
                        ? (Array.isArray(value) ? value : []).map((id) =>
                            h('span', { key: id, style: Object.assign({}, S.chip, { marginRight: 3 }) }, optionName(entry.field, id)),
                          )
                        : entry.field.type === 'checkbox'
                          ? value === true
                            ? '✓'
                            : ''
                          : cellText(entry.field, value);

                  const cellStyle = Object.assign(
                    {},
                    S.cell,
                    index === columns.length - 1 ? S.cellLast : null,
                  );

                  // The first cell carries the expander plus the title, so the
                  // twisty sits in front of the row it belongs to.
                  if (index === 0) {
                    return h(
                      'div',
                      {
                        key: entry.field.id,
                        style: cellStyle,
                        title: cellText(entry.field, value),
                      },
                      h(
                        'span',
                        { style: S.titleLine },
                        subs.length > 0
                          ? h(
                              'button',
                              {
                                type: 'button',
                                style: S.twisty,
                                title: open ? '收起子任务' : '展开子任务',
                                onClick: () => toggleExpanded(todo.id),
                              },
                              open ? '▾' : '▸',
                            )
                          : h('span', { style: S.twistySpacer }),
                        h('span', { style: { minWidth: 0, wordBreak: 'break-word' } }, inner),
                        progress !== ''
                          ? h('span', { style: Object.assign({}, S.chip, { marginLeft: 6, flex: '0 0 auto' }) }, progress)
                          : null,
                      ),
                    );
                  }

                  return h(
                    'div',
                    {
                      key: entry.field.id,
                      style: cellStyle,
                      title: cellText(entry.field, value),
                    },
                    h('span', { style: S.gridCell }, inner),
                  );
                }),
                h(
                  'div',
                  { style: Object.assign({}, S.cell, S.cellLast) },
                  h('button', { type: 'button', style: S.buttonGhost, onClick: () => setEditingId(todo.id) }, '编辑'),
                ),
              ),
            ),
            subRows,
          );
        };

        // Grouping turns the flat list into collapsible sections.
        let body;
        if (columns.length === 0) {
          body = h('div', { style: S.empty }, '这个视图还没勾选字段。点「视图设置」，勾几个要显示的字段。');
        } else if (rows.length === 0) {
          body = h(
            'div',
            { style: S.empty },
            String(props.query || '').trim() !== ''
              ? `没有匹配「${String(props.query).trim()}」的待办。`
              : '这个视图还没有符合条件的待办。上面填一条，点「添加待办」。',
          );
        } else if (view.groupBy) {
          const groupField = fieldsById[view.groupBy];
          const buckets = [];
          const index = {};
          for (const todo of rows) {
            const value = todo.values[view.groupBy];
            const key = Array.isArray(value) ? value.join(',') : String(value || '');
            if (index[key] === undefined) {
              index[key] = buckets.length;
              buckets.push({ key, label: cellText(groupField, value), rows: [] });
            }
            buckets[index[key]].rows.push(todo);
          }
          body = h(
            'div',
            { style: { minWidth } },
            buckets.map((bucket) => {
              const collapsed = view.collapsed.indexOf(bucket.key) >= 0;
              return h(
                'div',
                { key: bucket.key },
                h(
                  'div',
                  {
                    style: S.groupHead,
                    onClick: () =>
                      commit((current) => ({
                        ...current,
                        views: current.views.map((entry) => {
                          if (entry.id !== view.id) return entry;
                          const has = entry.collapsed.indexOf(bucket.key) >= 0;
                          return Object.assign({}, entry, {
                            collapsed: has
                              ? entry.collapsed.filter((item) => item !== bucket.key)
                              : entry.collapsed.concat([bucket.key]),
                          });
                        }),
                      })),
                  },
                  h('span', null, collapsed ? '▸' : '▾'),
                  h('span', null, bucket.label === '—' ? '未分组' : bucket.label),
                  h('span', { style: S.meta }, `${bucket.rows.length}`),
                ),
                collapsed ? null : bucket.rows.map((todo, position) => rowNode(todo, position)),
              );
            }),
          );
        } else {
          body = h('div', { style: { minWidth } }, rows.map((todo, position) => rowNode(todo, position)));
        }

        return h(
          'div',
          { style: S.body },
          h(
            'div',
            { style: S.row },
            h('button', { type: 'button', style: S.button, onClick: () => setAdding(true) }, '＋ 添加待办'),
            h(
              'span',
              { style: S.meta },
              `${rows.length} 条${
                view.filters.length > 0 || String(props.query || '').trim() !== ''
                  ? '（已筛选/搜索）'
                  : ''
              } · 共 ${store.todos.length} 条`,
            ),
            h('span', { style: S.hint }, '所有视图看的是同一批待办，改一处各视图都变。'),
            dragField !== '' ? h('span', { style: S.hint }, '松手放到目标列即可换顺序') : null,
          ),
          columns.length === 0
            ? body
            : h(
                'div',
                { style: S.overflow },
                h('div', { style: S.tableFrame }, header, body),
              ),
          adding
            ? h(
                Modal,
                { title: '添加待办', onClose: () => setAdding(false) },
                h(RecordEditor, {
                  fields: store.fields.filter(
                    (field) => field.primary === true || columns.some((entry) => entry.field.id === field.id),
                  ),
                  initial: {},
                  initialSubtasks: [],
                  submitLabel: '添加待办',
                  onSubmit: (values, subtasks) => {
                    actions.addRecord(values, subtasks);
                    // Closing the dialog is the receipt that it was added; the
                    // next open starts from a blank form.
                    setAdding(false);
                  },
                  onCancel: () => setAdding(false),
                  onPrefillNow: actions.prefillNow,
                }),
              )
            : null,
        );
      }

      function BoardView(props) {
        const store = props.store;
        const commit = props.commit;
        const view = props.view;
        const actions = props.actions;
        const [editingId, setEditingId] = React.useState('');
        const [adding, setAdding] = React.useState(false);
        const [expanded, setExpanded] = React.useState({});
        const rows = selectRows(store, view, props.query);

        /** Flip one card's subtask disclosure; a missing key counts as open. */
        const toggleExpanded = (id) => {
          setExpanded((current) => {
            const next = Object.assign({}, current);
            next[id] = current[id] === false;
            return next;
          });
        };

        const fieldsById = {};
        for (const field of store.fields) fieldsById[field.id] = field;

        const boardField =
          fieldsById[view.boardBy] ||
          store.fields.find((field) => field.type === 'select') ||
          store.fields.find((field) => field.type === 'person') ||
          store.fields.find((field) => field.type === 'checkbox');
        const primary = store.fields.find((field) => field.primary === true) || store.fields[0];
        const progressFields = store.fields.filter((field) => field.type === 'datetime').slice(0, 2);

        if (!boardField) {
          return h(
            'div',
            { style: S.body },
            h('div', { style: S.empty }, '看板需要一个「单选」字段当分栏依据。先在「字段管理」里加一个，再到「视图设置」选它。'),
          );
        }

        const options =
          boardField.type === 'checkbox'
            ? [{ id: '__true', name: '已勾选' }, { id: '__false', name: '未勾选' }]
            : (boardField.options || []);

        const valueOf = (todo) => {
          const value = todo.values[boardField.id];
          if (boardField.type === 'checkbox') return value === true ? '__true' : '__false';
          return String(value || '');
        };

        const moveTo = (todo, columnId) => {
          const nextValue = boardField.type === 'checkbox' ? columnId === '__true' : columnId;
          actions.updateRecord(
            todo.id,
            Object.assign({}, todo.values, { [boardField.id]: nextValue }),
            todo.subtasks,
          );
        };

        const card = (todo) => {
          if (editingId === todo.id) {
            return h(RecordEditor, {
              key: `edit-${todo.id}`,
              fields: store.fields,
              initial: todo.values,
              initialSubtasks: todo.subtasks,
              submitLabel: '保存修改',
              onSubmit: (values, subtasks) => {
                actions.updateRecord(todo.id, values, subtasks);
                setEditingId('');
              },
              onCancel: () => setEditingId(''),
              onDelete: () => {
                actions.removeRecord(todo.id);
                setEditingId('');
              },
              onPrefillNow: actions.prefillNow,
            });
          }

          const progress = subtaskProgress(todo);
          // Show whatever multi-select fields this store actually has, rather
          // than assuming fixed field ids.
          const tagFields = store.fields.filter((field) => field.type === 'multiselect');
          const subs = todo.subtasks || [];
          const open = expanded[todo.id] !== false;
          return h(
            'div',
            {
              key: todo.id,
              style: S.boardCard,
              draggable: true,
              onDragStart: (event) => {
                event.dataTransfer.setData('text/plain', todo.id);
              },
              onClick: () => setEditingId(todo.id),
              title: '点开编辑 · 拖动可换栏',
            },
            h(
              'span',
              { style: S.titleLine },
              subs.length > 0
                ? h(
                    'button',
                    {
                      type: 'button',
                      style: S.twisty,
                      title: open ? '收起子任务' : '展开子任务',
                      onClick: (event) => {
                        event.stopPropagation();
                        toggleExpanded(todo.id);
                      },
                    },
                    open ? '▾' : '▸',
                  )
                : h('span', { style: S.twistySpacer }),
              h(
                'span',
                { style: { minWidth: 0, wordBreak: 'break-word' } },
                String(todo.values[primary.id] || '(未填标题)'),
              ),
            ),
            subs.length > 0 && open
              ? h(
                  'div',
                  { style: S.rowSubs, onClick: (event) => event.stopPropagation() },
                  subs.map((sub) =>
                    h(
                      'label',
                      { key: sub.id, style: S.rowSub, title: sub.text },
                      h('input', {
                        type: 'checkbox',
                        checked: sub.done === true,
                        style: { margin: 0, cursor: 'pointer', flex: '0 0 auto' },
                        onChange: () =>
                          actions.patchRecord(todo.id, (current) => {
                            const subtasks = (current.subtasks || []).map((entry) =>
                              entry.id === sub.id ? Object.assign({}, entry, { done: !entry.done }) : entry,
                            );
                            return Object.assign({}, current, { subtasks });
                          }),
                      }),
                      h('span', { style: Object.assign({}, S.rowSubText, sub.done ? S.strike : null) }, sub.text),
                    ),
                  ),
                )
              : null,
            h(
              'div',
              { style: S.row },
              progress !== '' ? h('span', { style: S.chip }, progress) : null,
              tagFields.map((field) =>
                (Array.isArray(todo.values[field.id]) ? todo.values[field.id] : []).map((id) =>
                  h('span', { key: `${field.id}-${id}`, style: S.chip }, optionName(field, id)),
                ),
              ),
            ),
            progressFields.length > 0
              ? h(
                  'span',
                  { style: S.hint },
                  progressFields
                    .map((field) => `${field.name} ${shortTime(todo.values[field.id])}`)
                    .join(' · '),
                )
              : null,
          );
        };

        const columns = options.map((option) => ({
          option,
          rows: rows.filter((todo) => valueOf(todo) === option.id),
        }));

        return h(
          'div',
          { style: S.body },
          h(
            'div',
            { style: S.row },
            h('button', { type: 'button', style: S.button, onClick: () => setAdding(true) }, '＋ 添加待办'),
            h('span', { style: S.meta }, `分栏字段：${boardField.name} · 共 ${rows.length} 条`),
            h('span', { style: S.hint }, '拖动卡片到别的栏即可改这个字段的值。'),
          ),
          h(
            'div',
            { style: S.board },
            columns.map((column) =>
              h(
                'div',
                {
                  key: column.option.id,
                  style: S.boardCol,
                  onDragOver: (event) => event.preventDefault(),
                  onDrop: (event) => {
                    event.preventDefault();
                    const id = event.dataTransfer.getData('text/plain');
                    const todo = store.todos.find((entry) => entry.id === id);
                    if (todo) moveTo(todo, column.option.id);
                  },
                },
                h(
                  'div',
                  { style: S.row },
                  h(
                    'span',
                    { style: Object.assign({}, S.chip, optionTone(boardField, column.option.id)) },
                    column.option.name,
                  ),
                  h('span', { style: S.meta }, `${column.rows.length}`),
                ),
                column.rows.length === 0
                  ? h('span', { style: S.hint }, '把卡片拖到这里')
                  : column.rows.map(card),
              ),
            ),
          ),
          adding
            ? h(
                Modal,
                { title: '添加待办', onClose: () => setAdding(false) },
                h(RecordEditor, {
                  fields: store.fields,
                  initial: {},
                  initialSubtasks: [],
                  submitLabel: '添加待办',
                  onSubmit: (values, subtasks) => {
                    actions.addRecord(values, subtasks);
                    setAdding(false);
                  },
                  onCancel: () => setAdding(false),
                  onPrefillNow: actions.prefillNow,
                }),
              )
            : null,
        );
      }

      function CalendarView(props) {
        const store = props.store;
        const view = props.view;
        const actions = props.actions;
        const [cursor, setCursor] = React.useState(() => {
          const date = new Date();
          return { year: date.getFullYear(), month: date.getMonth() };
        });
        const [openId, setOpenId] = React.useState('');
        const [adding, setAdding] = React.useState(false);

        const fieldsById = {};
        for (const field of store.fields) fieldsById[field.id] = field;
        const dateField = fieldsById[view.dateField] || store.fields.find((field) => field.type === 'datetime');
        const primary = store.fields.find((field) => field.primary === true) || store.fields[0];

        if (!dateField) {
          return h(
            'div',
            { style: S.body },
            h('div', { style: S.empty }, '日历需要先选一个「时间」字段作为日期依据。到「视图设置」里选一下。'),
          );
        }

        const rows = selectRows(store, view, props.query);
        const byDay = {};
        for (const todo of rows) {
          const value = String(todo.values[dateField.id] || '');
          const key = value.slice(0, 10);
          if (key.length !== 10) continue;
          if (byDay[key] === undefined) byDay[key] = [];
          byDay[key].push(todo);
        }

        const first = new Date(cursor.year, cursor.month, 1);
        const startWeekday = first.getDay();
        const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < startWeekday; i += 1) cells.push(null);
        for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
        while (cells.length % 7 !== 0) cells.push(null);

        const move = (delta) => {
          setCursor((current) => {
            const next = new Date(current.year, current.month + delta, 1);
            return { year: next.getFullYear(), month: next.getMonth() };
          });
        };

        const openTodo = openId === '' ? null : store.todos.find((todo) => todo.id === openId);

        return h(
          'div',
          { style: S.body },
          h(
            'div',
            { style: S.row },
            h('button', { type: 'button', style: S.button, onClick: () => setAdding(true) }, '＋ 添加待办'),
            h('button', { type: 'button', style: S.buttonGhost, onClick: () => move(-1) }, '‹ 上月'),
            h('span', { style: S.title }, `${cursor.year} 年 ${cursor.month + 1} 月`),
            h('button', { type: 'button', style: S.buttonGhost, onClick: () => move(1) }, '下月 ›'),
            h(
              'button',
              {
                type: 'button',
                style: S.buttonGhost,
                onClick: () => {
                  const date = new Date();
                  setCursor({ year: date.getFullYear(), month: date.getMonth() });
                },
              },
              '回到本月',
            ),
            h('span', { style: S.hint }, `按「${dateField.name}」摆放`),
          ),
          openTodo
            ? h(RecordEditor, {
                key: openTodo.id,
                fields: store.fields,
                initial: openTodo.values,
                initialSubtasks: openTodo.subtasks,
                submitLabel: '保存修改',
                onSubmit: (values, subtasks) => {
                  actions.updateRecord(openTodo.id, values, subtasks);
                  setOpenId('');
                },
                onCancel: () => setOpenId(''),
                onDelete: () => {
                  actions.removeRecord(openTodo.id);
                  setOpenId('');
                },
                onPrefillNow: actions.prefillNow,
              })
            : null,
          h(
            'div',
            { style: S.calGrid },
            ['日', '一', '二', '三', '四', '五', '六'].map((label, index) =>
              h('div', { key: `head${index}`, style: S.calHead }, label),
            ),
            cells.map((day, index) => {
              if (day === null) return h('div', { key: `empty${index}`, style: S.calCell });
              const key = `${cursor.year}-${pad2(cursor.month + 1)}-${pad2(day)}`;
              const items = byDay[key] || [];
              const isToday = key === todayLocal();
              return h(
                'div',
                {
                  key,
                  style: Object.assign({}, S.calCell, isToday ? { borderColor: 'var(--dsw-alias-label-primary)' } : null),
                },
                h('span', { style: S.calDay }, `${day}${isToday ? ' · 今天' : ''}`),
                items.slice(0, 4).map((todo) =>
                  h(
                    'span',
                    {
                      key: todo.id,
                      style: S.calItem,
                      onClick: () => setOpenId(todo.id),
                      title: String(todo.values[primary.id] || ''),
                    },
                    String(todo.values[primary.id] || '(未填标题)'),
                  ),
                ),
                items.length > 4 ? h('span', { style: S.hint }, `还有 ${items.length - 4} 条`) : null,
              );
            }),
          ),
          adding
            ? h(
                Modal,
                { title: '添加待办', onClose: () => setAdding(false) },
                h(RecordEditor, {
                  fields: store.fields,
                  initial: {},
                  initialSubtasks: [],
                  submitLabel: '添加待办',
                  onSubmit: (values, subtasks) => {
                    actions.addRecord(values, subtasks);
                    setAdding(false);
                  },
                  onCancel: () => setAdding(false),
                  onPrefillNow: actions.prefillNow,
                }),
              )
            : null,
        );
      }

      function ViewBody(props) {
        const store = props.store;
        const commit = props.commit;
        const view = props.view;
        const [showSettings, setShowSettings] = React.useState(false);
        const [showFields, setShowFields] = React.useState(false);
        const actions = useRecordActions(store, commit);
        const query = props.query || '';

        const inner =
          view.type === 'board'
            ? h(BoardView, { store, commit, view, actions, query })
            : view.type === 'calendar'
              ? h(CalendarView, { store, commit, view, actions, query })
              : h(TableView, { store, commit, view, actions, query });

        return h(
          'div',
          { style: { display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 } },
          h(
            'div',
            { style: S.row, padding: '8px 16px 0' },
            h(
              'button',
              { type: 'button', style: S.buttonGhost, onClick: () => setShowSettings(!showSettings) },
              showSettings ? '收起视图设置' : '视图设置',
            ),
            h(
              'button',
              { type: 'button', style: S.buttonGhost, onClick: () => setShowFields(!showFields) },
              showFields ? '收起字段管理' : '字段管理',
            ),
            h('span', { style: S.hint }, `当前：${VIEW_TYPE_LABEL[view.type] || view.type}`),
          ),
          showSettings
            ? h(
                'div',
                { style: { padding: '8px 16px 0' } },
                h(ViewSettings, {
                  store,
                  commit,
                  view,
                  onDelete: (id) => {
                    let remaining = 0;
                    commit((current) => {
                      const views = current.views.filter((entry) => entry.id !== id);
                      const next = views.length > 0 ? views : defaultViews(current.fields);
                      remaining = next.length;
                      return Object.assign({}, current, { views: next });
                    });
                    if (remaining === 0) props.onViewDeleted();
                  },
                }),
              )
            : null,
          showFields ? h('div', { style: { padding: '8px 16px 0' } }, h(FieldManager, { store, commit })) : null,
          inner,
        );
      }

      /** Three starting tables, so a first open is never an empty spreadsheet. */
      const TEMPLATE_PRESETS = {
        weekly: {
          label: '周报',
          fields: [
            { name: '事项', type: 'text', primary: true },
            { name: '状态', type: 'select', options: ['待办', '进行中', '完成'] },
            { name: '本周重点', type: 'checkbox' },
            { name: '截止', type: 'datetime' },
            { name: '备注', type: 'text' },
          ],
          views: [
            { name: '本周', type: 'table', columns: ['事项', '状态', '本周重点', '截止'], boardBy: null },
            { name: '看板', type: 'board', columns: ['事项', '截止'], boardBy: '状态' },
          ],
          rows: [
            { 事项: '把插件写进 README', 状态: '进行中', 本周重点: true, 截止: '2026-11-20', 备注: '加两张截图' },
            { 事项: '补三个工具的测试', 状态: '完成', 本周重点: false },
            { 事项: '拍 3 秒 demo', 状态: '待办', 本周重点: true, 截止: '2026-11-22' },
          ],
        },
        ideas: {
          label: '选题库',
          fields: [
            { name: '选题', type: 'text', primary: true },
            { name: '类型', type: 'select', options: ['插件', '教程', '整活'] },
            { name: '状态', type: 'select', options: ['草稿', '已拍', '已发'] },
            { name: '平台', type: 'multiselect', options: ['B站', '抖音', '小红书'] },
            { name: '开拍', type: 'checkbox' },
          ],
          views: [
            { name: '选题库', type: 'table', columns: ['选题', '类型', '状态', '平台'], boardBy: null },
            { name: '状态看板', type: 'board', columns: ['选题', '类型'], boardBy: '状态' },
          ],
          rows: [
            { 选题: '在单位电脑上让 AI 写插件', 类型: '整活', 状态: '草稿', 平台: ['B站'], 开拍: true },
            { 选题: 'AI 写 3900 行我要怎么审', 类型: '教程', 状态: '草稿', 平台: ['B站', '抖音'], 开拍: false },
            { 选题: '插件赛道的 24 个对手', 类型: '插件', 状态: '已发', 平台: ['B站'] },
          ],
        },
        watch: {
          label: '追番',
          fields: [
            { name: '片名', type: 'text', primary: true },
            { name: '状态', type: 'select', options: ['想看', '在看', '看完'] },
            { name: '评分', type: 'text' },
            { name: '看完', type: 'datetime' },
          ],
          views: [{ name: '追番', type: 'table', columns: ['片名', '状态', '评分', '看完'], boardBy: null }],
          rows: [
            { 片名: '示例：一部新番', 状态: '在看', 评分: '8.5' },
            { 片名: '示例：另一部', 状态: '想看' },
          ],
        },
      };

      /** Turn a preset into fresh ids, so loading one twice cannot collide. */
      function buildTemplate(preset) {
        const fieldIds = {};
        const optionIds = {};
        const fields = preset.fields.map((entry) => {
          const id = makeId('f');
          fieldIds[entry.name] = id;
          const field = { id, name: entry.name, type: entry.type };
          if (entry.primary === true) field.primary = true;
          if (entry.options) {
            field.options = entry.options.map((name) => {
              const optionId = makeId('o');
              optionIds[entry.name + '/' + name] = optionId;
              return { id: optionId, name };
            });
          }
          return field;
        });
        const views = preset.views.map((entry) => ({
          id: makeId('v'),
          name: entry.name,
          type: entry.type,
          columns: (entry.columns || preset.fields.map((field) => field.name)).map((name, index) => ({
            fieldId: fieldIds[name],
            width: index === 0 ? 220 : 120,
          })).filter((column) => column.fieldId !== undefined),
          filters: [],
          filterMode: 'and',
          sorts: [],
          groupBy: null,
          boardBy: entry.boardBy ? fieldIds[entry.boardBy] || null : null,
          dateField: null,
          collapsed: [],
        }));
        const todos = preset.rows.map((row, index) => {
          const values = {};
          for (const field of fields) {
            const raw = row[field.name];
            if (raw === undefined) continue;
            if (field.type === 'multiselect') {
              values[field.id] = (Array.isArray(raw) ? raw : [])
                .map((name) => optionIds[field.name + '/' + name])
                .filter((value) => value !== undefined);
            } else if (field.type === 'select' || field.type === 'person') {
              values[field.id] = optionIds[field.name + '/' + raw] || '';
            } else if (field.type === 'checkbox') {
              values[field.id] = raw === true;
            } else {
              values[field.id] = String(raw);
            }
          }
          const stamp = new Date(Date.now() - index * 1000).toISOString();
          return { id: makeId('t'), values, subtasks: [], createdAt: stamp, updatedAt: stamp };
        });
        return { fields, views, todos };
      }
      function Panel() {
        const [store, setStore] = React.useState(null);
        const [dataFile, setDataFile] = React.useState('');
        const [tab, setTab] = React.useState('notes');
        // One search box per tab; switching tabs starts from a clean search.
        const [query, setQuery] = React.useState('');
        const switchTab = (id) => {
          setTab(id);
          setQuery('');
        };
        const [error, setError] = React.useState('');
        const [saving, setSaving] = React.useState(false);
        const [savedAt, setSavedAt] = React.useState('');
        // Which kind of view the "add" menu is offering, or '' when closed.
        const [newType, setNewType] = React.useState('');
        const rootRef = React.useRef(null);
        const [uiScale, setUiScale] = React.useState(storedScale);
        // The 导出 button opens a two-line menu; any outside click closes it.
        const [exportOpen, setExportOpen] = React.useState(false);
        // Switching tabs changes what can be exported, so the menu must not survive.
        React.useEffect(() => {
          setExportOpen(false);
        }, [tab]);
        const storeRef = React.useRef(null);
        // True while a save is in flight; the poll below stands down meanwhile.
        const savingRef = React.useRef(false);

        React.useEffect(() => {
          let alive = true;

          // Paint immediately from the local copy: the panel must never block
          // on a host round-trip just to show what the user already had.
          const local = readLocal();
          if (local) {
            storeRef.current = local;
            setStore(local);
          }

          (async () => {
            let remote = null;
            let remoteFile = '';
            try {
              const value = await hostCall('state');
              if (value && value.store) {
                remote = migrate(value.store);
                remoteFile = value.dataFile || '';
              }
            } catch (failure) {
              if (alive) {
                setError(`宿主数据读取失败，先用浏览器本地副本：${String((failure && failure.message) || failure)}`);
              }
            }
            if (!alive) return;

            if (remote === null) {
              // No host: keep whatever local gave us (or start fresh).
              if (storeRef.current === null) {
                const empty = migrate(null);
                storeRef.current = empty;
                setStore(empty);
              }
              return;
            }

            if (remoteFile) setDataFile(remoteFile);

            const localCount = local ? local.notes.length + local.todos.length : -1;
            const remoteCount = remote.notes.length + remote.todos.length;
            if (remoteCount < localCount) {
              // Local holds more: keep showing it, and push it up so the two
              // sides converge instead of silently dropping the user's work.
              return;
            }
            storeRef.current = remote;
            setStore(remote);
          })();
          return () => {
            alive = false;
          };
        }, []);

        const seq = React.useRef(0);
        const queue = React.useRef(Promise.resolve());

        const commit = React.useCallback(async (next) => {
          const base = storeRef.current;
          const target = typeof next === 'function' ? next(base) : next;
          if (!target || target === base) return;
          const mine = seq.current + 1;
          seq.current = mine;
          const previous = base;
          storeRef.current = target;
          setStore(target);
          savingRef.current = true;
          setSaving(true);
          setError('');
          const localOk = writeLocalSoon(target);
          // Coalesce host writes: a burst of edits (typing a title) should send
          // one payload, not one per keystroke.
          const run = queue.current.then(async () => {
            await new Promise((resolve) => window.setTimeout(resolve, 180));
            const latest = storeRef.current;
            try {
              return await hostCall('save', { store: latest });
            } catch (failure) {
              return { failed: true, message: String((failure && failure.message) || failure) };
            }
          });
          queue.current = run.then(
            () => undefined,
            () => undefined,
          );
          try {
            const result = await run;
            if (seq.current !== mine) return;
            if (result === null) {
              setSavedAt(shortClock());
              return;
            }
            if (result && result.failed) {
              if (localOk) {
                setError(`已存入浏览器本地，但本机 JSON 文件没写成：${result.message}`);
                setSavedAt(shortClock());
                return;
              }
              storeRef.current = previous;
              setStore(previous);
              setError(`保存失败，已退回上一次保存的内容：${result.message}`);
              return;
            }
            if (result && result.store) {
              const normalized = migrate(result.store);
              storeRef.current = normalized;
              setStore(normalized);
            }
            if (result && result.dataFile) setDataFile(result.dataFile);
            setSavedAt(shortClock(result && result.savedAt));
          } catch (failure) {
            if (seq.current !== mine) return;
            if (localOk) {
              setError(`已存入浏览器本地，但本机 JSON 文件没写成：${String((failure && failure.message) || failure)}`);
              setSavedAt(shortClock());
              return;
            }
            storeRef.current = previous;
            setStore(previous);
            setError(`保存失败，已退回上一次保存的内容：${String((failure && failure.message) || failure)}`);
          } finally {
            if (seq.current === mine) {
              savingRef.current = false;
              setSaving(false);
            }
          }
        }, []);

        // The model writes rows through its tools, so the panel polls the host
        // and adopts anything new. It never trades away local rows, and stands
        // down while a save is in flight or the tab is hidden.
        React.useEffect(() => {
          let alive = true;
          const tick = async () => {
            if (!alive || document.hidden || savingRef.current) return;
            let value = null;
            try {
              value = await hostCall('state');
            } catch {
              return;
            }
            if (!alive || !value || !value.store) return;
            const mine = storeRef.current;
            if (mine === null) return;
            const remote = migrate(value.store);
            if (storeSignature(remote) === storeSignature(mine)) return;
            if (remote.notes.length + remote.todos.length < mine.notes.length + mine.todos.length) return;
            storeRef.current = remote;
            setStore(remote);
            writeLocalSoon(remote);
            if (value.dataFile) setDataFile(value.dataFile);
          };
          const timer = window.setInterval(tick, 4000);
          return () => {
            alive = false;
            window.clearInterval(timer);
          };
        }, []);

        const back = () => {
          try {
            ctx.layout.selectPanel(null);
          } catch {
            /* the layout service is optional */
          }
        };

        const views = store ? store.views : [];
        const activeView = views.find((view) => view.id === tab) || null;
        const activeKey = tab === 'notes' ? 'notes' : activeView ? tab : views.length > 0 ? views[0].id : 'notes';

        const exportPng = () => {
          if (!store || !activeView) return;
          const rows = selectRows(store, activeView, query);
          viewPngBlob(store, activeView, rows, uiScale, rootRef.current, (blob) => {
            if (blob !== null) downloadBlob(blob, safeName(activeView.name) + '.png');
          });
        };

        const exportXlsx = () => {
          if (!store || !activeView) return;
          const rows = selectRows(store, activeView, query);
          downloadBlob(viewXlsxBlob(store, activeView, rows), safeName(activeView.name) + '.xlsx');
        };

        const exportMd = () => {
          if (!store) return;
          const notes = store.notes.filter((note) => noteMatchesQuery(note, query));
          const blob = new Blob([notesMarkdown(notes)], { type: 'text/markdown;charset=utf-8' });
          downloadBlob(blob, '随笔-' + new Date().toISOString().slice(0, 10) + '.md');
        };

        // One 导出 button, a short menu: the format depends on what is on screen.
        // Built only while the menu is open, so filtering never runs per render.
        const exportOptions = () => {
          if (store === null) return [];
          if (activeKey === 'notes') {
            const count = store.notes.filter((note) => noteMatchesQuery(note, query)).length;
            return [{ key: 'md', label: 'Markdown（.md）', hint: String(count) + ' 条，保留划线', run: exportMd }];
          }
          if (!activeView) return [];
          const count = selectRows(store, activeView, query).length;
          return [
            { key: 'png', label: '图片（.png）', hint: '跟面板同色，前 20 行', run: exportPng },
            { key: 'xlsx', label: 'Excel（.xlsx）', hint: '全部 ' + String(count) + ' 行，可继续编辑', run: exportXlsx },
          ];
        };

        /** Two buttons instead of a settings page: the size is a personal thing. */
        const changeScale = (delta) => {
          const next = Math.round(Math.max(0.85, Math.min(1.6, uiScale + delta)) * 20) / 20;
          rememberScale(next);
          setUiScale(next);
        };


        const addView = (type) => {
          const id = makeId('v');
          const label = VIEW_TYPE_LABEL[type] || '表格';
          commit((current) => {
            const base = current.views[0];
            const view = {
              id,
              name: `${label} ${current.views.length + 1}`,
              type,
              columns: base ? base.columns.map((column) => Object.assign({}, column)) : defaultColumns(current.fields),
              filters: [],
              filterMode: 'and',
              sorts: [],
              groupBy: null,
              boardBy: null,
              dateField: null,
              collapsed: [],
            };
            return Object.assign({}, current, { views: current.views.concat([view]) });
          });
          switchTab(id);
        };

        const tabButton = (id, label, kind) =>
          h(
            'button',
            {
              type: 'button',
              style: id === activeKey ? Object.assign({}, S.tab, S.tabActive) : S.tab,
              onClick: () => switchTab(id),
              title: kind ? `${label}（${VIEW_TYPE_LABEL[kind]}）` : label,
            },
            kind === 'board' ? `▤ ${label}` : kind === 'calendar' ? `▦ ${label}` : label,
          );

        return h(
          'div',
          { ref: rootRef, style: Object.assign({}, S.root, { '--nt-scale': String(uiScale) }) },
          h(
            'div',
            { style: S.head },
            h('span', { style: S.title }, '随手记 · 待办'),
            h('span', { style: S.meta }, saving ? '保存中…' : savedAt ? `已保存 ${savedAt}` : ''),
            h('span', { style: { flex: 1 } }),
            store
              ? h(SearchBox, {
                  value: query,
                  onChange: setQuery,
                  placeholder: activeKey === 'notes' ? '搜索随笔…' : '搜索待办…',
                })
              : null,
            h('button', { type: 'button', style: S.buttonGhost, title: '字号调小', onClick: () => changeScale(-0.1) }, 'A−'),
            h('button', { type: 'button', style: S.buttonGhost, title: '字号调大', onClick: () => changeScale(0.1) }, 'A+'),
            store === null
              ? null
              : h(
                  'div',
                  { style: S.exportWrap },
                  h(
                    'button',
                    {
                      type: 'button',
                      style: S.buttonGhost,
                      title: activeKey === 'notes' ? '导出随笔为 Markdown' : '导出当前视图',
                      onClick: () => setExportOpen(!exportOpen),
                    },
                    '导出 ▾',
                  ),
                  exportOpen
                    ? h(
                        React.Fragment,
                        null,
                        h('div', {
                          style: { position: 'fixed', inset: 0, zIndex: 30 },
                          onClick: () => setExportOpen(false),
                        }),
                        h(
                          'div',
                          { style: S.exportMenu },
                          exportOptions().map((option) =>
                            h(
                              'button',
                              {
                                key: option.key,
                                type: 'button',
                                style: S.exportItem,
                                onClick: () => {
                                  setExportOpen(false);
                                  option.run();
                                },
                              },
                              h('span', { style: S.exportItemLabel }, option.label),
                              h('span', { style: S.exportItemHint }, option.hint),
                            ),
                          ),
                        ),
                      )
                    : null,
                ),
            h('button', { type: 'button', style: S.buttonGhost, onClick: back }, '返回会话'),
          ),
          h(
            'div',
            { style: S.tabs },
            tabButton('notes', store ? `随笔 ${store.notes.length}` : '随笔', null),
            views.map((view) => tabButton(view.id, view.name, view.type)),
            store
              ? newType !== ''
                ? h(
                    'span',
                    { style: Object.assign({}, S.row, { marginBottom: 4 }) },
                    h('span', { style: S.hint }, '新建哪种：'),
                    ['table', 'board', 'calendar'].map((kind) =>
                      h(
                        'button',
                        {
                          key: kind,
                          type: 'button',
                          style: S.tabAdd,
                          onClick: () => {
                            setNewType('');
                            addView(kind);
                          },
                        },
                        VIEW_TYPE_LABEL[kind],
                      ),
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        style: S.buttonGhost,
                        onClick: () => setNewType(''),
                      },
                      '取消',
                    ),
                  )
                : h(
                    'button',
                    {
                      type: 'button',
                      style: S.tabAdd,
                      onClick: () => setNewType('pick'),
                      title: '在现有待办上换一种看法：只改显示方式，不新建一份数据',
                    },
                    '＋ 新建看法',
                  )
              : null,
          ),
          store && store.views.length === 0
            ? h(
                'div',
                { style: { padding: '10px 16px 0' } },
                h('div', { style: S.empty }, '还没有待办视图。先载入一张模板表，或者点上方「＋ 新建看法」自己搭：'),
                h(
                  'div',
                  { style: Object.assign({}, S.row, { justifyContent: 'center' }) },
                  Object.keys(TEMPLATE_PRESETS).map((key) =>
                    h(
                      'button',
                      {
                        key,
                        type: 'button',
                        style: S.button,
                        onClick: () =>
                          commit((current) =>
                            Object.assign({}, current, buildTemplate(TEMPLATE_PRESETS[key])),
                          ),
                      },
                      TEMPLATE_PRESETS[key].label,
                    ),
                  ),
                ),
              )
            : null,
          error ? h('div', { style: S.error }, error) : null,
          store === null
            ? h('div', { style: S.body }, h('span', { style: S.meta }, error ? '读取失败' : '正在读取…'))
            : activeKey === 'notes'
              ? h(NotesTab, { store, commit, query })
              : activeView
                ? h(ViewBody, {
                    key: activeView.id,
                    store,
                    commit,
                    view: activeView,
                    query,
                    onViewDeleted: () => setTab('notes'),
                  })
                : h(
                    'div',
                    { style: S.body },
                    h('div', { style: S.empty }, '还没有待办视图。点上方「＋ 新建看法」，或者先载入一张模板表：'),
                    h(
                      'div',
                      { style: Object.assign({}, S.row, { justifyContent: 'center' }) },
                      Object.keys(TEMPLATE_PRESETS).map((key) =>
                        h(
                          'button',
                          {
                            key,
                            type: 'button',
                            style: S.button,
                            onClick: () =>
                              commit((current) =>
                                Object.assign({}, current, buildTemplate(TEMPLATE_PRESETS[key])),
                              ),
                          },
                          TEMPLATE_PRESETS[key].label,
                        ),
                      ),
                    ),
                  ),
          h('div', { style: S.foot }, h('span', { style: S.meta }, dataFile ? `已存到：${dataFile}` : '已存到浏览器本地副本')),
        );
      }

      function Icon(props) {
        const size = (props && props.size) || 16;
        return h(
          'svg',
          {
            width: size,
            height: size,
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 1.6,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          },
          h('path', { d: 'M6 3.5h12a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z' }),
          h('path', { d: 'M8.5 8h7' }),
          h('path', { d: 'M8.5 12h7' }),
          h('path', { d: 'M8.5 16h4' }),
        );
      }

      ctx.slots.inject('sidebar.panellist', () =>
        ctx.slots.register({ name: 'sidebar.panellist', id: PANEL, order: 25, label: () => '随手记 · 待办' }, Icon),
      );

      ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL }, Panel));
    }

    return { inject: ['slots', 'layout'], apply };
  },
});
