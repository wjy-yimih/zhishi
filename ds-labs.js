/* Dependency-free data-structure laboratories. The application owns event delegation. */
(() => {
  'use strict';

  const CAPACITY = 5;
  const names = { binary: '二分查找', stack: '栈与循环队列', tree: '二叉树遍历', sort: '排序的每一步' };
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const copyItems = items => items.map(item => item === null ? null : { ...item });
  const range = (start, end) => Array.from({ length: Math.max(0, end - start) }, (_, index) => start + index);
  const defaults = { binaryArray: '1, 3, 5, 7, 9, 11, 13, 15', target: '9', sortArray: '7, 3, 5, 3, 2' };

  function integer(raw, min = -999, max = 999, name = '数值') {
    const text = String(raw).trim();
    if (!/^[+-]?\d+$/.test(text)) return { error: `${name}需要一个完整的十进制整数，例如 −3 请写作 -3；不接受小数或表达式。` };
    const value = Number(text);
    if (!Number.isSafeInteger(value) || value < min || value > max) return { error: `${name}须在 ${min}～${max} 之间。` };
    return { value };
  }

  function parseArray(raw, maximum, strictlyIncreasing = false) {
    const text = String(raw).trim();
    if (!text) return { error: '数组不能为空。请输入整数，用逗号或空格分隔。' };
    if (/^[,，]|[,，]$|[,，]\s*[,，]/.test(text)) return { error: '数组中有空项。请去掉首尾或连续的逗号，再试一次。' };
    const tokens = text.split(/[,，\s]+/);
    if (tokens.length > maximum) return { error: `本实验最多显示 ${maximum} 个元素，请缩短数组。` };
    const values = [];
    for (const token of tokens) {
      const parsed = integer(token, -99, 99, '数组元素');
      if (parsed.error) return { error: parsed.error };
      values.push(parsed.value);
    }
    if (strictlyIncreasing) {
      for (let i = 1; i < values.length; i++) {
        if (values[i] === values[i - 1]) return { error: `第 ${i - 1}、${i} 项重复为 ${values[i]}。本实验要求严格递增；请去重后输入。` };
        if (values[i] < values[i - 1]) return { error: `下标 ${i - 1} 的 ${values[i - 1]} 大于下标 ${i} 的 ${values[i]}。二分查找的前提是数组有序，本实验要求严格递增。` };
      }
    }
    return { values };
  }

  function binaryFrames(values, target) {
    const frames = [];
    let l = 0;
    let r = values.length - 1;
    let comparisons = 0;
    const push = (phase, message, mid = null) => frames.push({ l, r, mid, phase, message, comparisons });
    push('start', `从闭区间 [0, ${r}] 开始：两端都属于候选区域，暂时没有比较任何元素。`);
    while (l <= r) {
      const mid = l + Math.floor((r - l) / 2);
      comparisons++;
      push('compare', `mid = l + (r − l) / 2 向下取整 = ${mid}。比较 a[${mid}] = ${values[mid]} 与目标 ${target}。`, mid);
      if (values[mid] === target) {
        push('found', `相等，找到目标：a[${mid}] = ${target}，返回下标 ${mid}。共比较 ${comparisons} 次。`, mid);
        return frames;
      }
      if (values[mid] < target) {
        const oldL = l;
        l = mid + 1;
        push('shrink', `${values[mid]} < ${target}。递增数组中 [${oldL}, ${mid}] 的数都太小，令 l = mid + 1 = ${l}，保留闭区间 [${l}, ${r}]。`);
      } else {
        const oldR = r;
        r = mid - 1;
        push('shrink', `${values[mid]} > ${target}。递增数组中 [${mid}, ${oldR}] 的数都太大，令 r = mid − 1 = ${r}，保留闭区间 [${l}, ${r}]。`);
      }
    }
    push('missing', `l = ${l} > r = ${r}，候选区间为空。目标 ${target} 不存在，返回 −1；这不是越界访问。共比较 ${comparisons} 次。`);
    return frames;
  }

  const tree = {
    A: { x: 300, y: 43, left: 'B', right: 'C' },
    B: { x: 160, y: 130, left: 'D', right: 'E' },
    C: { x: 440, y: 130, left: 'F', right: 'G' },
    D: { x: 90, y: 225, left: null, right: null },
    E: { x: 230, y: 225, left: null, right: null },
    F: { x: 370, y: 225, left: null, right: null },
    G: { x: 510, y: 225, left: null, right: null }
  };
  const orders = { pre: '前序 · 根左右', in: '中序 · 左根右', post: '后序 · 左右根', level: '层序 · 从上到下' };

  function treeFrames(order) {
    const frames = [{ visited: [], current: null, queue: order === 'level' ? ['A'] : null, message: '从根 A 开始。一次“访问”指把该节点记入输出序列；沿边走到节点不一定立刻访问它。' }];
    const visited = [];
    function visit(id) {
      visited.push(id);
      const descriptions = {
        pre: `访问 ${id}：先记录根，再递归处理它的左子树、右子树。`,
        in: `访问 ${id}：它的左子树已经处理完；记录根后，接着处理右子树。`,
        post: `访问 ${id}：它的左右子树都已处理完，现在才记录根。`
      };
      frames.push({ visited: [...visited], current: id, queue: null, message: descriptions[order] });
    }
    function walk(id) {
      if (!id) return;
      if (order === 'pre') visit(id);
      walk(tree[id].left);
      if (order === 'in') visit(id);
      walk(tree[id].right);
      if (order === 'post') visit(id);
    }
    if (order === 'level') {
      const queue = ['A'];
      while (queue.length) {
        const id = queue.shift();
        visited.push(id);
        if (tree[id].left) queue.push(tree[id].left);
        if (tree[id].right) queue.push(tree[id].right);
        frames.push({ visited: [...visited], current: id, queue: [...queue], message: `从队首取出并访问 ${id}，再按左、右顺序把它的非空孩子入队。${queue.length ? `待处理队列：${queue.join(' → ')}。` : '队列为空，遍历结束。'}` });
      }
    } else walk('A');
    frames[frames.length - 1].message += ' 七个节点都已访问，遍历完成。';
    return frames;
  }

  const algorithms = {
    insertion: { name: '直接插入排序', summary: '像整理手里的扑克牌：每次暂存一个 key，把较大的前项右移，再把 key 放进空位。', complexity: '最坏 O(n²)，已排序时 O(n)；额外空间 O(1)。严格大于才右移，因此稳定。' },
    bubble: { name: '冒泡排序', summary: '从左到右比较相邻元素，前大后小时交换；每轮把当前最大值送到右端。无交换可提前结束。', complexity: '最坏 O(n²)，带“无交换”提前结束时最好 O(n)；额外空间 O(1)，稳定。' },
    selection: { name: '简单选择排序', summary: '在尚未确定的后缀里找最小值，再把它与后缀首位交换；每轮确认一个最终位置。', complexity: '比较次数总是 n(n−1)/2，因此最好、最坏均 O(n²)；额外空间 O(1)，通常不稳定。' }
  };

  function sortFrames(values, algorithm) {
    const items = values.map((value, id) => ({ value, id }));
    const frames = [];
    let comparisons = 0;
    let writes = 0;
    const push = (phase, message, active = [], sorted = [], extra = {}) => frames.push({ items: copyItems(items), comparisons, writes, phase, message, active: [...active], sorted: [...sorted], held: null, hole: null, candidate: null, ...extra });
    const n = items.length;
    push('start', `保留原始输入，在它的副本上执行${algorithms[algorithm].name}。点击“下一步”开始，重复元素的小标签表示它在原输入中的下标。`);
    if (algorithm === 'insertion') {
      for (let i = 1; i < n; i++) {
        const key = { ...items[i] };
        items[i] = null;
        push('pick', `暂存 a[${i}] = ${key.value} 为 key。前缀 [0, ${i - 1}] 已有序；从右向左寻找 key 的插入位置。`, [i], range(0, i), { held: key, hole: i });
        let j = i - 1;
        while (j >= 0) {
          comparisons++;
          const larger = items[j].value > key.value;
          push('compare', `比较 a[${j}] = ${items[j].value} 与 key = ${key.value}：${larger ? '前项更大，需要右移。' : '前项不大于 key，停止向左查找。相等时不移动，保留原有先后顺序。'}`, [j], [], { held: key, hole: j + 1 });
          if (!larger) break;
          const moved = items[j];
          items[j + 1] = moved;
          items[j] = null;
          writes++;
          push('move', `把 ${moved.value} 从下标 ${j} 右移到 ${j + 1}；待填位置向左移动一格。key 仍暂存在数组外。`, [j, j + 1], [], { held: key, hole: j });
          j--;
        }
        items[j + 1] = key;
        writes++;
        push('insert', `将 key = ${key.value} 写回 a[${j + 1}]。现在前缀 [0, ${i}] 有序；这不表示这些元素已在全局最终位置。`, [j + 1], range(0, i + 1));
      }
    } else if (algorithm === 'bubble') {
      for (let end = n - 1; end > 0; end--) {
        let swapped = false;
        for (let j = 0; j < end; j++) {
          comparisons++;
          const swap = items[j].value > items[j + 1].value;
          push('compare', `比较相邻的 a[${j}] = ${items[j].value} 与 a[${j + 1}] = ${items[j + 1].value}：${swap ? '顺序颠倒，下一步交换。' : '顺序正确，保持不动；相等元素也不交换。'}`, [j, j + 1], range(end + 1, n));
          if (swap) {
            [items[j], items[j + 1]] = [items[j + 1], items[j]];
            writes += 2;
            swapped = true;
            push('swap', `交换下标 ${j} 与 ${j + 1}：较大的值向右移动一格。这次交换向数组写入两个位置。`, [j, j + 1], range(end + 1, n));
          }
        }
        push('pass', `本轮结束，a[${end}] = ${items[end].value} 已处在最终位置。${swapped ? '下一轮只需检查它左边的部分。' : '整轮没有交换，说明整个数组已有序，可以提前结束。'}`, [end], range(end, n));
        if (!swapped) {
          push('done', '没有任何相邻逆序，排序提前完成。所有元素已按非降序排列。', [], range(0, n));
          return frames;
        }
      }
    } else {
      for (let i = 0; i < n - 1; i++) {
        let min = i;
        push('candidate', `在未确定后缀 [${i}, ${n - 1}] 寻找最小值。先暂定 min = ${i}，候选值为 ${items[i].value}。`, [i], range(0, i), { candidate: min });
        for (let j = i + 1; j < n; j++) {
          comparisons++;
          const smaller = items[j].value < items[min].value;
          push('compare', `比较 a[${j}] = ${items[j].value} 与当前最小候选 a[${min}] = ${items[min].value}：${smaller ? '发现更小值，下一步更新 min。' : '没有更小，保持 min 不变。'}`, [min, j], range(0, i), { candidate: min });
          if (smaller) {
            min = j;
            push('candidate', `更新 min = ${min}，新的最小候选是 ${items[min].value}；此时尚未移动数组元素。`, [min], range(0, i), { candidate: min });
          }
        }
        if (min !== i) {
          const selected = items[min].value;
          [items[i], items[min]] = [items[min], items[i]];
          writes += 2;
          push('swap', `后缀最小值 ${selected} 位于下标 ${min}；与 a[${i}] 交换，确认下标 ${i} 的最终位置。跨位置交换可能改变相等元素的先后次序。`, [i, min], range(0, i + 1));
        } else push('confirm', `最小值本来就在 a[${i}]，无需交换。确认下标 ${i} 的最终位置。`, [i], range(0, i + 1));
      }
    }
    push('done', `${n === 1 ? '只有一个元素，天然有序。' : '所有轮次完成。'}最终结果已按非降序排列，原始输入仍保持不变。`, [], range(0, n));
    return frames;
  }

  const state = {
    binary: { raw: defaults.binaryArray, target: defaults.target, values: [], frames: [], cursor: 0, error: '' },
    stack: { mode: 'stack', value: '8', items: [], buffer: Array(CAPACITY).fill(null), front: 0, rear: 0, size: 0, stackHistory: [], queueHistory: [], message: '选择一个结构，再输入数值并操作。容量均为 5，操作失败时内容不变。' },
    tree: { order: 'pre', frames: treeFrames('pre'), cursor: 0 },
    sort: { raw: defaults.sortArray, algorithm: 'insertion', values: [], frames: [], cursor: 0, error: '' }
  };

  function prepareBinary() {
    const s = state.binary;
    const array = parseArray(s.raw, 16, true);
    const target = integer(s.target, -999, 999, '目标值');
    s.cursor = 0;
    s.error = array.error || target.error || '';
    s.values = array.values || [];
    s.frames = s.error ? [] : binaryFrames(s.values, target.value);
  }

  function prepareSort() {
    const s = state.sort;
    const array = parseArray(s.raw, 10);
    s.cursor = 0;
    s.error = array.error || '';
    s.values = array.values || [];
    s.frames = s.error ? [] : sortFrames(s.values, s.algorithm);
  }
  prepareBinary();
  prepareSort();

  function input(id, key, label, value, hint = '', number = false) {
    const field = `ds-${id}-${key}`;
    return `<label for="${field}">${label}<input id="${field}" type="text"${number ? ' inputmode="numeric"' : ''} data-ds-lab-input="${id}-${key}" value="${escape(value)}" autocomplete="off" spellcheck="false" aria-describedby="ds-${id}-help">${hint ? `<small>${hint}</small>` : ''}</label>`;
  }
  function button(action, text, extra = '', primary = false) {
    return `<button type="button" class="btn ${primary ? 'primary' : 'secondary'}" data-action="dslab-${action}" data-ds-focus="${action}"${extra ? ' ' + extra : ''}>${text}</button>`;
  }
  function navigation(id) {
    return `<div class="ds-navigation">${button(`${id}-prev`, '← 上一步', 'data-ds-nav="prev"')}${button(`${id}-next`, '下一步 →', 'data-ds-nav="next"', true)}${button(`${id}-reset`, '回到初始步骤', 'data-ds-nav="reset"')}<span class="ds-step-count" data-ds-step-count></span></div>`;
  }
  function error(message) {
    return `<div class="lab-display ds-error"><strong>暂时无法开始</strong><p role="status">${escape(message)}</p><p>修正输入后，会自动回到新的初始状态。</p></div>`;
  }
  function numericCells(values, frame) {
    return `<div class="ds-array" role="list" aria-label="按下标显示的数组">${values.map((value, i) => {
      const inside = i >= frame.l && i <= frame.r;
      const markers = [i === frame.l ? 'l' : '', i === frame.r ? 'r' : '', i === frame.mid ? 'mid' : ''].filter(Boolean).join(' · ');
      return `<div class="ds-array-unit" role="listitem"><div class="ds-array-cell${inside ? '' : ' is-discarded'}${i === frame.mid ? ' is-active' : ''}${frame.phase === 'found' && i === frame.mid ? ' is-found' : ''}">${value}</div><small>下标 ${i}</small><strong class="ds-index-marker">${markers || '·'}</strong></div>`;
    }).join('')}</div>`;
  }

  function binaryResult() {
    const s = state.binary;
    if (s.error) return error(s.error);
    const f = s.frames[s.cursor];
    return `<div class="ds-metrics"><span>闭区间 <strong>[${f.l}, ${f.r}]</strong></span><span>mid <strong>${f.mid === null ? '尚未计算' : f.mid}</strong></span><span>比较 <strong>${f.comparisons} 次</strong></span></div>
      <div class="lab-display">${numericCells(s.values, f)}<p class="ds-legend">浅色：已排除　｜　深色：本次 mid　｜　绿色：找到目标</p></div>
      <div class="lab-output ds-explanation" role="status"><strong>${f.phase === 'found' ? '找到啦' : f.phase === 'missing' ? '查找结束' : '这一步为什么这样做'}</strong><p>${escape(f.message)}</p></div>
      <pre class="ds-code"><code>while (l &lt;= r) {
  int mid = l + (r - l) / 2;
  if (a[mid] == target) return mid;
  if (a[mid] &lt; target) l = mid + 1;
  else                 r = mid - 1;
}
return -1;</code></pre>
      <p class="lab-insight">前提：顺序存储、严格递增；本实验下标从 0 开始。循环不变式：若目标存在，它一定在当前闭区间 [l, r] 内。mid 已经比较过，因此更新必须越过它；每轮候选区间至少缩短一半，时间 O(log n)，额外空间 O(1)。</p>`;
  }

  function stackResult() {
    const s = state.stack;
    const stackMode = s.mode === 'stack';
    const count = stackMode ? s.items.length : s.size;
    const values = stackMode ? Array.from({ length: CAPACITY }, (_, i) => s.items[i] ?? null) : s.buffer;
    const inputStatus = integer(s.value, -99, 99, '待插入数值');
    const logical = stackMode ? [...s.items].reverse() : range(0, s.size).map(i => s.buffer[(s.front + i) % CAPACITY]);
    return `<div class="ds-metrics"><span>size <strong>${count} / ${CAPACITY}</strong></span>${stackMode ? `<span>top <strong>${s.items.length - 1}${s.items.length ? '' : '（空栈）'}</strong></span>` : `<span>front <strong>${s.front}</strong></span><span>rear <strong>${s.rear}</strong></span>`}<span><strong>${count === 0 ? '空' : count === CAPACITY ? '满' : '可继续插入'}</strong></span></div>
      <div class="lab-display"><p class="ds-small">${stackMode ? '顺序栈的物理下标从左到右递增；右端为栈顶。' : '循环队列的物理数组；rear 指向下一次写入的位置，front 指向下一次读取的位置。'}</p>
        <div class="ds-array ds-container-array" role="list" aria-label="${stackMode ? '栈' : '循环队列'}的五个物理槽位">${values.map((value, i) => {
          const markers = stackMode ? (i === s.items.length - 1 ? 'top ↑' : '') : [i === s.front ? 'front ↑' : '', i === s.rear ? 'rear ↑' : ''].filter(Boolean).join(' / ');
          return `<div class="ds-array-unit" role="listitem"><div class="ds-array-cell${value === null ? ' is-empty' : ' is-filled'}${markers ? ' is-marked' : ''}">${value === null ? '·' : value}</div><small>下标 ${i}</small><strong class="ds-index-marker">${markers || '·'}</strong></div>`;
        }).join('')}</div>
        <p class="ds-logical"><strong>${stackMode ? '出栈顺序（后进先出 LIFO）' : '出队顺序（先进先出 FIFO）'}</strong><br>${logical.length ? logical.join(' → ') : '当前为空，没有可取出的元素'}</p>
      </div>
      ${inputStatus.error ? `<p class="ds-input-error" role="status">${escape(inputStatus.error)} 取出操作仍可进行。</p>` : ''}
      <div class="lab-output ds-explanation" role="status"><p>${escape(s.message)}</p></div>
      <pre class="ds-code"><code>${stackMode ? '/* top 是末元素下标；空栈 top = -1 */\npush: a[++top] = x;     // 先检查 size &lt; 5\npop:  x = a[top--];     // 先检查 size &gt; 0\nsize = top + 1;' : '/* 另存 size，不牺牲一个槽位 */\nenqueue: a[rear] = x; rear = (rear + 1) % 5; size++;\ndequeue: x = a[front]; front = (front + 1) % 5; size--;\nempty: size == 0;     full: size == 5;'}</code></pre>
      <p class="lab-insight">${stackMode ? '入栈、出栈都只改动栈顶，时间 O(1)。满栈继续 push 是上溢，空栈继续 pop 是下溢；先检查边界，再读写数组。图中的空槽是教学标记，不是把 C 的整数数组元素写成 NULL。' : '队尾回绕不等于队列已满。这里同时维护 size，所以 front == rear 时，size=0 表示空、size=5 表示满；5 个槽位全部可用。另一种“牺牲一个槽位”的写法具有不同判满条件，不能混用。入队、出队均为 O(1)。'}</p>`;
  }

  function treeResult() {
    const s = state.tree;
    const f = s.frames[s.cursor];
    const edges = Object.entries(tree).flatMap(([id, node]) => [node.left, node.right].filter(Boolean).map(child => `<line x1="${node.x}" y1="${node.y}" x2="${tree[child].x}" y2="${tree[child].y}" class="ds-tree-edge"/>`)).join('');
    const nodes = Object.entries(tree).map(([id, node]) => `<g class="ds-tree-node${f.visited.includes(id) ? ' is-visited' : ''}${f.current === id ? ' is-current' : ''}"><circle cx="${node.x}" cy="${node.y}" r="24"/><text x="${node.x}" y="${node.y + 6}" text-anchor="middle">${id}</text>${f.current === id ? `<text x="${node.x}" y="${node.y + 45}" class="ds-tree-caption" text-anchor="middle">正在访问</text>` : ''}</g>`).join('');
    return `<div class="ds-metrics"><span>策略 <strong>${orders[s.order]}</strong></span><span>已访问 <strong>${f.visited.length} / 7</strong></span></div>
      <div class="lab-display"><svg class="ds-tree-svg" viewBox="0 0 600 280" role="img" aria-labelledby="ds-tree-title ds-tree-description"><title id="ds-tree-title">固定二叉树及当前访问节点</title><desc id="ds-tree-description">根 A 的左、右孩子为 B、C；B 的孩子为 D、E；C 的孩子为 F、G。${f.current ? `当前访问 ${f.current}。` : '尚未访问节点。'}</desc>${edges}${nodes}</svg><p class="ds-legend">深绿：当前访问　｜　浅绿：已经输出　｜　白色：尚未输出</p></div>
      <div class="ds-traversal-output"><strong>输出序列</strong><div class="ds-sequence" aria-label="访问序列">${f.visited.length ? f.visited.map((id, i) => `<span class="${i === f.visited.length - 1 ? 'is-last' : ''}">${id}</span>`).join('<i aria-hidden="true">→</i>') : '<small>等待第一次访问</small>'}</div>${f.queue ? `<p>待处理队列（左端为队首）：<strong>${f.queue.length ? f.queue.join(' → ') : '空'}</strong></p>` : ''}</div>
      <div class="lab-output ds-explanation" role="status"><p>${escape(f.message)}</p></div>
      <p class="lab-insight">“前、中、后”说的是根节点相对左右子树的访问时机。递归遇到空指针直接返回，不输出节点；每个非空节点恰好访问一次，时间 O(n)，递归栈 O(h)。层序使用 FIFO 队列，时间 O(n)，辅助队列最多占 O(w)，其中 w 为最大层宽。</p>`;
  }

  function sortResult() {
    const s = state.sort;
    if (s.error) return error(s.error);
    const f = s.frames[s.cursor];
    const a = algorithms[s.algorithm];
    return `<p class="ds-small">${a.summary}</p><div class="ds-metrics"><span>关键字比较 <strong>${f.comparisons} 次</strong></span><span>数组位置写入 <strong>${f.writes} 次</strong></span><span>阶段 <strong>${({ start: '初始', pick: '暂存 key', compare: '比较', move: '右移', insert: '插入', swap: '交换', pass: '一轮结束', candidate: '选择候选', confirm: '确认位置', done: '完成' })[f.phase]}</strong></span></div>
      <div class="lab-display"><p class="ds-original"><strong>原始输入：</strong>${s.values.join(', ')} <small>（始终保留）</small></p>
        <div class="ds-array" role="list" aria-label="排序工作副本">${f.items.map((item, i) => `<div class="ds-array-unit" role="listitem"><div class="ds-array-cell${f.active.includes(i) ? ' is-active' : ''}${f.sorted.includes(i) ? ' is-sorted' : ''}${f.hole === i ? ' is-hole' : ''}${f.candidate === i ? ' is-candidate' : ''}">${item === null ? '□' : item.value}${item === null ? '' : `<sub>原 ${item.id}</sub>`}</div><small>下标 ${i}</small><strong class="ds-index-marker">${f.hole === i ? '待填位置' : f.candidate === i ? 'min' : f.active.includes(i) ? '本步操作' : '·'}</strong></div>`).join('')}</div>
        ${f.held ? `<p class="ds-key"><strong>暂存变量 key：</strong>${f.held.value}<small>（原下标 ${f.held.id}）</small></p>` : ''}
        <p class="ds-legend">金色边框：本步比较/移动　｜　绿色：${s.algorithm === 'insertion' ? '当前有序前缀' : '已确认最终位置'}　｜　原 i：相等元素的原始身份</p>
      </div>
      <div class="lab-output ds-explanation" role="status"><p>${escape(f.message)}</p></div>
      <p class="lab-insight">${a.complexity} “写入次数”仅统计写数组位置，不统计局部临时变量，也不把可视化空位计作实际写入。${s.algorithm === 'insertion' ? '插入时的 □ 是逻辑待填位置：旧值已暂存或右移，C 实现不会为此额外写入 NULL。' : '可比较重复元素的原下标，观察它们是否保持先后顺序。'} 排序只改工作副本；本实验为看清每一步保存历史快照，教学工具自身的空间开销不代表算法的额外空间。</p>`;
  }

  const experiments = {
    binary: {
      title: '二分查找：每次舍弃一半候选',
      description: '不要先背模板，先跟着 l、r、mid 走一遍。每次点击只执行一个比较或区间更新，上一步可随时回看。',
      help: '输入 1～16 个严格递增整数，每项 −99～99；目标可为 −999～999。修改输入会重新开始，不会暗中替你排序。',
      controls: () => input('binary', 'array', '严格递增数组', state.binary.raw, '逗号、中文逗号或空格均可') + input('binary', 'target', '目标 target', state.binary.target, '', true),
      result: binaryResult,
      question: '把默认数组的目标改为 4，观察区间如何变空。为什么应写 l = mid + 1，而不是 l = mid？'
    },
    stack: {
      title: '栈与循环队列：同一批数据，不同出场顺序',
      description: '栈只在同一端存取，队列从队尾加入、队首取出。先连续加入 1、2、3，再预测下一个被取出的数。两个结构各自保存状态。',
      help: '容量固定为 5；每次输入一个 −99～99 的整数。你可以故意装满或取空，观察边界检查如何保护数组。',
      controls: () => `<div class="tabs ds-mode-tabs" aria-label="选择线性结构"><button type="button" class="tab${state.stack.mode === 'stack' ? ' active' : ''}" data-action="dslab-stack-mode" data-value="stack" data-ds-mode="stack" data-ds-focus="stack-mode-stack" aria-pressed="${state.stack.mode === 'stack'}">顺序栈 Stack</button><button type="button" class="tab${state.stack.mode === 'queue' ? ' active' : ''}" data-action="dslab-stack-mode" data-value="queue" data-ds-mode="queue" data-ds-focus="stack-mode-queue" aria-pressed="${state.stack.mode === 'queue'}">循环队列 Queue</button></div>${input('stack', 'value', '待插入数值', state.stack.value, '', true)}`,
      result: stackResult,
      question: '切到队列，装满 5 项，取出 2 项，再插入 2 项。rear 回绕后，为什么出队顺序仍保持先进先出？'
    },
    tree: {
      title: '二叉树遍历：访问时机决定输出顺序',
      description: '始终使用同一棵树，只改变遍历策略。一次点击访问一个节点；深绿显示本次访问，输出序列会逐项增长。',
      help: '左右位置具有意义：B 是 A 的左孩子，C 是右孩子。选择新的策略会从尚未访问的状态重新开始。',
      controls: () => `<label for="ds-tree-order">遍历策略<select id="ds-tree-order" data-ds-lab-input="tree-order" aria-describedby="ds-tree-help">${Object.entries(orders).map(([key, title]) => `<option value="${key}"${key === state.tree.order ? ' selected' : ''}>${title}</option>`).join('')}</select></label>`,
      result: treeResult,
      question: '前序中，B 比 D 更早输出；后序中谁先输出？再看中序的 A 为什么出现在第 4 个位置。'
    },
    sort: {
      title: '排序：把比较、移动和确认分开看',
      description: '小数组也能讲清算法。改变策略，逐步观察同一输入怎样变为有序；重复元素保留“原下标”标签，让稳定性变得可见。',
      help: '输入 1～10 个整数，每项 −99～99，允许重复。修改输入或切换算法会重新开始；操作过程中原始输入保持不变。',
      controls: () => input('sort', 'array', '待排序数组', state.sort.raw, '允许重复，例如 2, 2, 1') + `<label for="ds-sort-algorithm">排序算法<select id="ds-sort-algorithm" data-ds-lab-input="sort-algorithm" aria-describedby="ds-sort-help">${Object.entries(algorithms).map(([key, a]) => `<option value="${key}"${key === state.sort.algorithm ? ' selected' : ''}>${a.name}</option>`).join('')}</select></label>`,
      result: sortResult,
      question: '输入 2, 2, 1，分别运行三种算法。两个 2 的“原下标”是否保持先后顺序？再用已排好序的数组比较提前结束的机会。'
    }
  };

  function stackButtons() {
    return `<div class="ds-navigation">${button('stack-push', state.stack.mode === 'stack' ? '入栈 push' : '入队 enqueue', 'data-ds-operation="push"', true)}${button('stack-pop', state.stack.mode === 'stack' ? '出栈 pop' : '出队 dequeue', 'data-ds-operation="pop"')}${button('stack-undo', '撤销上次操作', 'data-ds-operation="undo"')}${button('stack-reset', '清空当前结构')}</div>`;
  }

  function render(requestedId) {
    const id = Object.prototype.hasOwnProperty.call(experiments, requestedId) ? requestedId : 'binary';
    const experiment = experiments[id];
    return `<div class="ds-labs" data-ds-lab="${id}"><div class="eyebrow"><span class="tiny-dot"></span> DATA STRUCTURES · LEARN BY DOING</div><h1 class="page-title">数据结构，动手理解。</h1><p class="page-description">先预测，再走一步。让边界、指针和每次操作都看得见。</p>
      <nav class="tabs" aria-label="数据结构实验">${Object.entries(names).map(([key, title]) => `<a class="tab${key === id ? ' active' : ''}" href="#/ds-lab/${key}"${key === id ? ' aria-current="page"' : ''}>${title}</a>`).join('')}</nav>
      <section class="lab-panel" aria-labelledby="ds-lab-title"><h2 id="ds-lab-title">${experiment.title}</h2><p class="lab-description">${experiment.description}</p><p class="lab-description" id="ds-${id}-help">${experiment.help}</p>
        <div class="lab-controls ds-controls">${experiment.controls()}</div>${id === 'stack' ? stackButtons() : ''}
        <div data-ds-result aria-live="polite" aria-atomic="false">${experiment.result()}</div>
        ${id === 'stack' ? '' : navigation(id)}<p class="lab-insight"><strong>先想一想：</strong>${experiment.question}</p><div class="lab-links"><a href="#/course/ds">回到数据结构课程</a><a href="#/path">查看学习路线</a></div>
      </section></div>`;
  }

  function panelFor(element) {
    return element && typeof element.closest === 'function' ? element.closest('[data-ds-lab]') : document.querySelector('[data-ds-lab]');
  }

  function refresh(panel) {
    if (!panel) return;
    const id = panel.dataset.dsLab;
    if (!experiments[id]) return;
    const doc = panel.ownerDocument || document;
    const previousFocus = doc.activeElement;
    const focusKey = previousFocus && previousFocus.dataset && previousFocus.closest && previousFocus.closest('[data-ds-lab]') === panel ? previousFocus.dataset.dsFocus : null;
    const output = panel.querySelector('[data-ds-result]');
    if (output) output.innerHTML = experiments[id].result();
    if (id === 'stack') {
      const s = state.stack;
      panel.querySelectorAll('[data-ds-mode]').forEach(button => {
        const active = button.dataset.dsMode === s.mode;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      const push = panel.querySelector('[data-ds-operation="push"]');
      const pop = panel.querySelector('[data-ds-operation="pop"]');
      const undo = panel.querySelector('[data-ds-operation="undo"]');
      if (push) push.textContent = s.mode === 'stack' ? '入栈 push' : '入队 enqueue';
      if (pop) pop.textContent = s.mode === 'stack' ? '出栈 pop' : '出队 dequeue';
      if (undo) undo.disabled = !(s.mode === 'stack' ? s.stackHistory.length : s.queueHistory.length);
    } else {
      const s = state[id];
      const valid = !s.error && s.frames.length > 0;
      panel.querySelectorAll('[data-ds-nav]').forEach(button => {
        const kind = button.dataset.dsNav;
        button.disabled = !valid || (kind === 'next' ? s.cursor >= s.frames.length - 1 : s.cursor === 0);
      });
      const count = panel.querySelector('[data-ds-step-count]');
      if (count) count.textContent = valid ? `步骤 ${s.cursor} / ${s.frames.length - 1}${s.cursor === s.frames.length - 1 ? ' · 已完成' : ''}` : '等待有效输入';
    }
    // Controls stay outside the redrawn output. If the focused control just became
    // disabled at a boundary, move to a usable neighbour instead of losing focus.
    if (focusKey) {
      const same = panel.querySelector(`[data-ds-focus="${focusKey}"]`);
      const fallback = panel.querySelector('[data-ds-nav="prev"]:not(:disabled)') || panel.querySelector('[data-ds-nav="next"]:not(:disabled)') || panel.querySelector('[data-ds-operation="push"]');
      const next = same && !same.disabled ? same : fallback;
      if (next && typeof next.focus === 'function') next.focus({ preventScroll: true });
    }
  }

  function rememberContainer() {
    const s = state.stack;
    if (s.mode === 'stack') s.stackHistory.push({ items: [...s.items], message: s.message });
    else s.queueHistory.push({ buffer: [...s.buffer], front: s.front, rear: s.rear, size: s.size, message: s.message });
    // Bounded UI history; this does not change the structure's capacity.
    const history = s.mode === 'stack' ? s.stackHistory : s.queueHistory;
    if (history.length > 100) history.shift();
  }

  function operateContainer(operation) {
    const s = state.stack;
    const stackMode = s.mode === 'stack';
    const size = stackMode ? s.items.length : s.size;
    if (operation === 'undo') {
      const history = stackMode ? s.stackHistory : s.queueHistory;
      const old = history.pop();
      if (old) Object.assign(s, old, { message: '已撤销上一次成功的插入或取出，恢复当时的内容与指针。' });
      return;
    }
    if (operation === 'reset') {
      if (stackMode) { s.items = []; s.stackHistory = []; }
      else { s.buffer = Array(CAPACITY).fill(null); s.front = 0; s.rear = 0; s.size = 0; s.queueHistory = []; }
      s.message = `已清空当前${stackMode ? '栈' : '队列'}，另一结构的内容保留。`;
      return;
    }
    if (operation === 'push') {
      const parsed = integer(s.value, -99, 99, '待插入数值');
      if (parsed.error) { s.message = parsed.error + ' 结构内容未改变。'; return; }
      if (size === CAPACITY) { s.message = `上溢：${stackMode ? '栈' : '队列'}已满（size = 5），拒绝插入 ${parsed.value}，未覆盖已有元素。`; return; }
      rememberContainer();
      if (stackMode) {
        s.items.push(parsed.value);
        s.message = `入栈 ${parsed.value}：top 由 ${size - 1} 变为 ${size}，写入 a[${size}]；size = ${s.items.length}。`;
      } else {
        const slot = s.rear;
        s.buffer[slot] = parsed.value;
        s.rear = (s.rear + 1) % CAPACITY;
        s.size++;
        s.message = `入队 ${parsed.value}：写入 a[${slot}]，rear = (${slot} + 1) % 5 = ${s.rear}；front 仍为 ${s.front}，size = ${s.size}。`;
      }
    } else if (operation === 'pop') {
      if (size === 0) { s.message = `下溢：${stackMode ? '栈' : '队列'}为空，拒绝取出；没有读取越界位置，也没有改变指针。`; return; }
      rememberContainer();
      if (stackMode) {
        const value = s.items.pop();
        s.message = `出栈得到 ${value}：读取旧 a[${size - 1}]，top 减为 ${s.items.length - 1}；size = ${s.items.length}。`;
      } else {
        const slot = s.front;
        const value = s.buffer[slot];
        s.buffer[slot] = null;
        s.front = (s.front + 1) % CAPACITY;
        s.size--;
        s.message = `出队得到 ${value}：读取 a[${slot}]，front = (${slot} + 1) % 5 = ${s.front}；rear 仍为 ${s.rear}，size = ${s.size}。`;
      }
    }
  }

  function handleInput(element) {
    if (!element || !element.dataset || !element.dataset.dsLabInput) return false;
    const field = element.dataset.dsLabInput;
    const value = String(element.value);
    if (field === 'binary-array') { state.binary.raw = value; prepareBinary(); }
    else if (field === 'binary-target') { state.binary.target = value; prepareBinary(); }
    else if (field === 'stack-value') state.stack.value = value;
    else if (field === 'tree-order' && Object.prototype.hasOwnProperty.call(orders, value)) {
      state.tree.order = value;
      state.tree.frames = treeFrames(value);
      state.tree.cursor = 0;
    } else if (field === 'sort-array') { state.sort.raw = value; prepareSort(); }
    else if (field === 'sort-algorithm' && Object.prototype.hasOwnProperty.call(algorithms, value)) { state.sort.algorithm = value; prepareSort(); }
    else return false;
    refresh(panelFor(element));
    return true;
  }

  function handleAction(action, element) {
    if (typeof action !== 'string' || !action.startsWith('dslab-')) return false;
    const panel = panelFor(element);
    if (!panel || !experiments[panel.dataset.dsLab]) return false;
    const id = panel.dataset.dsLab;
    const operation = action.slice(`dslab-${id}-`.length);
    if (!action.startsWith(`dslab-${id}-`)) return false;
    if (id === 'stack') {
      if (operation === 'mode') {
        const mode = element && element.dataset && element.dataset.value;
        if (mode !== 'stack' && mode !== 'queue') return false;
        state.stack.mode = mode;
        state.stack.message = `现在操作${mode === 'stack' ? '后进先出的顺序栈' : '先进先出的循环队列'}。切换模式不会清空任何一个结构。`;
      } else if (['push', 'pop', 'undo', 'reset'].includes(operation)) operateContainer(operation);
      else return false;
    } else {
      const s = state[id];
      if (!['next', 'prev', 'reset'].includes(operation)) return false;
      if (operation === 'reset') s.cursor = 0;
      else if (!s.error && s.frames.length) s.cursor = Math.max(0, Math.min(s.frames.length - 1, s.cursor + (operation === 'next' ? 1 : -1)));
    }
    refresh(panel);
    return true;
  }

  function afterRender() {
    document.querySelectorAll('[data-ds-lab]').forEach(refresh);
  }

  window.DataLabs = { render, handleAction, handleInput, afterRender };
})();
