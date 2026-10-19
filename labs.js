/* Four dependency-free CSAPP concept laboratories. All state stays in this closure. */
(() => {
  'use strict';

  const labels = { twos: '补码与位模式', cache: 'Cache 地址拆分', vm: '虚拟地址翻译', amdahl: 'Amdahl 加速定律' };
  const initial = {
    twos: { value: '-42' },
    cache: { address: '0x1234', block: '16', sets: '8', ways: '2' },
    vm: { address: '0x1234' },
    amdahl: { p: '80', speed: '4' }
  };
  const state = Object.fromEntries(Object.entries(initial).map(([id, values]) => [id, { ...values }]));
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hex = (value, digits = 4) => '0x' + value.toString(16).toUpperCase().padStart(digits, '0');
  const bin = (value, digits) => value.toString(2).padStart(digits, '0');
  const number = value => Number(value.toFixed(3)).toLocaleString('zh-CN', { maximumFractionDigits: 3 });
  const preset = (action, value, text) => `<button type="button" class="btn secondary" data-action="${action}" data-value="${esc(value)}">${text}</button>`;
  const error = message => `<div class="lab-display"><p class="lab-output" role="status">${esc(message)}</p><p>输入修正后，结果会立即重新计算。</p></div>`;

  function integer(raw, min, max, name) {
    const text = String(raw).trim();
    if (!/^[+-]?\d+$/.test(text)) return { error: `请为${name}输入一个完整的十进制整数。` };
    const value = Number(text);
    if (!Number.isSafeInteger(value) || value < min || value > max) return { error: `${name}须在 ${min} 到 ${max} 之间。` };
    return { value };
  }

  function address(raw) {
    const text = String(raw).trim();
    if (!/^(?:0x[0-9a-f]+|\d+)$/i.test(text)) return { error: '请输入 0x 开头的十六进制地址，或十进制整数，例如 0x1234、4660。' };
    const value = Number(text);
    if (!Number.isSafeInteger(value) || value < 0 || value > 65535) return { error: '本实验使用 16 位地址，请输入 0x0000～0xFFFF（十进制 0～65535）。' };
    return { value };
  }

  function decimal(raw, min, max, name) {
    const text = String(raw).trim();
    if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return { error: `请为${name}输入 ${min}～${max} 之间的数字。` };
    const value = Number(text);
    return !Number.isFinite(value) || value < min || value > max
      ? { error: `${name}须在 ${min}～${max} 之间。` }
      : { value };
  }

  function control(id, key, label, options = {}) {
    const { type = 'number', min, max, step = '1', hint = '', inputmode } = options;
    const field = `${id}-${key}`;
    return `<label for="${field}">${label}<input id="${field}" type="${type}" value="${esc(state[id][key])}" data-lab-input="${field}"${min !== undefined ? ` min="${min}"` : ''}${max !== undefined ? ` max="${max}"` : ''}${type === 'number' ? ` step="${step}"` : ''}${inputmode ? ` inputmode="${inputmode}"` : ''} aria-describedby="${id}-help" autocomplete="off" spellcheck="false">${hint ? `<small>${hint}</small>` : ''}</label>`;
  }

  function twosResult() {
    const parsed = integer(state.twos.value, -128, 127, '有符号数');
    if (parsed.error) return error(parsed.error);
    const value = parsed.value;
    const unsigned = ((value % 256) + 256) % 256;
    const bits = bin(unsigned, 8);
    const weights = [-128, 64, 32, 16, 8, 4, 2, 1];
    const terms = weights.filter((_, index) => bits[index] === '1');
    const expression = terms.length ? terms.join(' + ').replace('+ -', '− ') : '0';
    const inverted = 255 - unsigned;
    const opposite = (inverted + 1) % 256;
    const oppositeSigned = opposite >= 128 ? opposite - 256 : opposite;
    const construction = value < 0
      ? `<p>反过来构造 ${value}：先把绝对值 ${-value} 写成 ${bin(-value, 8)}，取反得 ${bin(255 + value, 8)}，加 1 得 <strong>${bits}</strong>。这里操作的是固定 8 位模式；第 9 位进位丢弃。</p>`
      : `<p>非负数直接用普通二进制表示，最高位为 0。若想得到它的相反数，可对这 8 位取反再加 1；0 的相反数仍是 0。</p>`;
    return `<div class="lab-display">
      <p style="text-align:center;margin-top:0">同一串位，换一种解释，数值就可能改变。点击任意一位也可以试验。</p>
      <div class="bits-row" aria-label="${value} 的 8 位补码 ${bits}" style="margin-bottom:22px">${[...bits].map((bit, index) => `<button type="button" class="bit${bit === '1' ? ' on' : ''}${index === 0 ? ' sign' : ''}" data-action="lab-twos-bit" data-bit="${7 - index}" aria-label="翻转第 ${7 - index} 位，当前 ${bit}，有符号权重 ${weights[index]}" aria-pressed="${bit === '1'}">${bit}<small>b${7 - index} · ${weights[index]}</small></button>`).join('')}</div>
      <div class="lab-output"><strong>有符号：</strong>${expression} = <strong>${value}</strong><br><strong>无符号：</strong>${unsigned}　｜　十六进制：<strong>${hex(unsigned, 2)}</strong></div>
      <p>补码解释的公式是 −b₇ × 128 + b₆ × 64 + … + b₀ × 1。无符号解释只需把最高位的权重改为 +128；其余各位完全相同。</p>
    </div>
    <div class="lab-output"><strong>对当前模式取反加一：</strong><br>${bits} → 取反 ${bin(inverted, 8)} → 加 1 ${bin(opposite, 8)} → 有符号值 ${oppositeSigned}。</div>
    ${construction}
    <p class="lab-insight">${value === -128 ? '<strong>你碰到了边界：</strong>−128 的位模式是 10000000，取反加一仍是 10000000。数学上的 +128 超出 8 位有符号范围，所以这里发生了有符号溢出；这不代表 −(−128) 在数学上等于 −128。' : '为什么范围不对称？最高位权重是 −128，低 7 位最大只能凑出 127，所以范围是 −128～127。−128 的相反数无法用相同的 8 位有符号格式表示。'} 本实验明确模拟固定位数的模 256 运算；不能据此认为 C 语言的有符号整数溢出一定回绕。</p>`;
  }

  function cacheValues() {
    const specs = [
      ['address', address(state.cache.address)],
      ['block', integer(state.cache.block, 1, 65536, '块大小 B')],
      ['sets', integer(state.cache.sets, 1, 65536, '组数 S')],
      ['ways', integer(state.cache.ways, 1, 16, '路数 E')]
    ];
    const invalid = specs.find(([, result]) => result.error);
    if (invalid) return { error: invalid[1].error };
    const values = Object.fromEntries(specs.map(([key, result]) => [key, result.value]));
    const b = Math.log2(values.block);
    const s = Math.log2(values.sets);
    if (!Number.isInteger(b) || !Number.isInteger(s)) return { error: '块大小 B 和组数 S 必须是 2 的幂，例如 1、2、4、8、16。路数 E 不要求是 2 的幂。' };
    if (b + s > 16) return { error: `偏移位 b=${b} 与组索引位 s=${s} 共 ${b + s} 位，超过 16 位地址。请减小块大小或组数。` };
    return { ...values, b, s, t: 16 - b - s };
  }

  function cacheResult() {
    const v = cacheValues();
    if (v.error) return error(v.error);
    const offset = v.address % v.block;
    const blockNumber = Math.floor(v.address / v.block);
    const set = blockNumber % v.sets;
    const tag = Math.floor(blockNumber / v.sets);
    const bits = bin(v.address, 16);
    const bitPart = (text, label, color) => `<div style="padding:15px 12px;border:1px solid ${color};border-radius:6px;flex:${Math.max(text.length, 2)};min-width:95px;text-align:center;background:#fff"><small>${label}</small><div style="font:20px monospace;letter-spacing:2px;margin-top:10px;overflow-wrap:anywhere">${text || '∅'}</div></div>`;
    return `<div class="lab-display">
      <p><strong>${hex(v.address)}</strong> = ${v.address}（十进制）= ${bits}（二进制）</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${bitPart(bits.slice(0, v.t), `标记 tag · ${v.t} 位`, '#c5d6af')}${bitPart(bits.slice(v.t, v.t + v.s), `组索引 set · ${v.s} 位`, '#bccfda')}${bitPart(bits.slice(v.t + v.s), `块内偏移 offset · ${v.b} 位`, '#dccaaf')}</div>
      <p class="lab-output" style="margin-top:20px">标记 <strong>${tag}</strong>（${hex(tag, 1)}）　→　第 <strong>${set}</strong> 组　→　块内第 <strong>${offset}</strong> 字节</p>
      <p>b = log₂ B = ${v.b}，s = log₂ S = ${v.s}，t = 16 − s − b = ${v.t}。${v.t === 0 ? '此配置没有标记位：tag 数值记作 0。' : ''}${v.s === 0 ? ' 只有一组，不需要组索引位。' : ''}${v.b === 0 ? ' 每块仅 1 字节，不需要偏移位。' : ''}</p>
    </div>
    <div class="lab-output">① 整除 B 去掉块内偏移：⌊${v.address} / ${v.block}⌋ = ${blockNumber}（内存块号）。<br>② 内存块号对 S 取余：${blockNumber} mod ${v.sets} = ${set}（组索引）。<br>③ 再整除 S：⌊${blockNumber} / ${v.sets}⌋ = ${tag}（标记）。<br>④ 地址对 B 取余：${v.address} mod ${v.block} = ${offset}（字节偏移）。</div>
    <p>选中第 ${set} 组后，在组内并行检查这 ${v.ways} 路的有效位与标记：</p>
    <div style="display:flex;flex-wrap:wrap;gap:8px">${Array.from({ length: v.ways }, (_, i) => `<div style="background:#f0f4e9;border:1px solid #dce4d1;padding:10px;border-radius:5px"><strong>路 ${i}</strong><br><small>比较 valid 与 tag=${tag}</small></div>`).join('')}</div>
    <p class="lab-insight"><strong>E 不参与地址位拆分。</strong>它表示选中组里可放多少条缓存行。数据区容量 C = S × E × B = ${number(v.sets * v.ways * v.block)} 字节，不含标记、有效位等开销。本实验假设字节编址、常规组相联映射，仅展示定位；未提供缓存原有内容，不能仅凭地址判断命中或未命中。</p>`;
  }

  // Every virtual page is assumed allocated and permitted in this teaching model.
  // Missing entries below are nonresident, not invalid virtual addresses.
  const pages = new Map([[0x00, 0x09], [0x01, 0x04], [0x02, null], [0x03, 0x11], [0x12, 0x2B], [0x2A, null], [0x7F, 0x08], [0xFE, null]]);

  function vmResult() {
    const parsed = address(state.vm.address);
    if (parsed.error) return error(parsed.error);
    const va = parsed.value;
    const vpn = Math.floor(va / 256);
    const offset = va % 256;
    const pfn = pages.get(vpn);
    const present = pfn !== null && pfn !== undefined;
    const rows = [...pages.entries()];
    if (!pages.has(vpn)) rows.push([vpn, null]);
    rows.sort((a, b) => a[0] - b[0]);
    return `<div class="lab-display">
      <p>虚拟地址 <strong>${hex(va)}</strong> = ${bin(va, 16)}</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <div style="background:#e5eddc;border-radius:6px;padding:18px;flex:1;min-width:150px"><small>高 8 位 · 虚拟页号 VPN</small><p style="font:24px monospace;margin:12px 0 0">${bin(vpn, 8)} <small>= ${hex(vpn, 2)}</small></p></div>
        <div style="background:#f0eadb;border-radius:6px;padding:18px;flex:1;min-width:150px"><small>低 8 位 · 页内偏移 offset</small><p style="font:24px monospace;margin:12px 0 0">${bin(offset, 8)} <small>= ${hex(offset, 2)}</small></p></div>
      </div>
      <div class="lab-output" style="margin-top:20px">${present ? `查页表：VPN ${hex(vpn, 2)} → present = 1 → 物理页框号 PFN ${hex(pfn, 2)}。<br>物理地址 = PFN × 256 + offset = ${pfn} × 256 + ${offset} = <strong>${hex(pfn * 256 + offset)}</strong>。` : `查页表：VPN ${hex(vpn, 2)} → present = 0 → <strong>发生缺页，当前无法给出物理地址</strong>。<br>本页已分配但不在内存，操作系统可载入后备页，更新页表，再重试本次访问。`}</div>
    </div>
    <h3>这台示意机器的固定页表</h3>
    <p>页大小 256 = 2⁸ 字节；虚拟地址 16 位，物理地址也示意为 16 位。下表列出部分 PTE；其余 VPN 的 present 统一为 0。高亮行是本次查找。</p>
    <div style="overflow-x:auto"><table class="truth-table"><caption style="text-align:left;padding:8px 0;font-size:12px">PTE：Page Table Entry（页表项）</caption><thead><tr><th scope="col">虚拟页号 VPN</th><th scope="col">present</th><th scope="col">物理页框 PFN</th><th scope="col">当前状态</th></tr></thead><tbody>${rows.map(([page, frame]) => `<tr${page === vpn ? ' class="highlight"' : ''}><th scope="row">${hex(page, 2)}${page === vpn ? ' ←' : ''}</th><td>${frame === null ? '0' : '1'}</td><td>${frame === null ? '—' : hex(frame, 2)}</td><td>${frame === null ? '已分配，未驻留' : '已驻留'}</td></tr>`).join('')}</tbody></table></div>
    <p class="lab-insight"><strong>换页只替换页号，页内偏移保持不变。</strong>本实验假设所有 VPN 均已分配且访问权限允许，并省略 TLB 与多级页表。present 表示驻留；缺页不等于地址非法。真实系统还要检查映射和权限，非法访问可能导致异常终止，不能一概当作可恢复的调页。</p>`;
  }

  function amdahlResult() {
    const pValue = decimal(state.amdahl.p, 0, 100, '可加速比例');
    const sValue = decimal(state.amdahl.speed, 1, 32, '局部加速倍数');
    if (pValue.error || sValue.error) return error(pValue.error || sValue.error);
    const p = pValue.value / 100;
    const speed = sValue.value;
    const remaining = 1 - p;
    const optimized = p / speed;
    const total = remaining + optimized;
    const overall = 1 / total;
    const limit = p === 1 ? '∞（此模型中无有限上限）' : number(1 / remaining);
    const segment = (width, color, label) => width > 0 ? `<span style="display:block;width:${width}%;background:${color};height:28px" title="${label}"></span>` : '';
    const bar = (name, first, second, label) => `<div style="margin:18px 0"><div style="display:flex;justify-content:space-between;gap:12px;font-size:12px;margin-bottom:7px"><span>${name}</span><span>${label}</span></div><div style="display:flex;height:28px;background:#edf0e7;border-radius:4px;overflow:hidden" aria-label="${esc(name + '：' + label)}">${segment(first, '#b4c3a5', '未加速部分')}${segment(second, '#65894c', '可加速部分')}</div></div>`;
    return `<div class="lab-display">
      <div style="display:flex;gap:35px;flex-wrap:wrap"><div><small>整段程序加速</small><p style="font:42px Georgia,serif;margin:9px 0"><strong>${number(overall)}×</strong></p></div><div><small>局部无限快时的理论上限</small><p style="font:24px Georgia,serif;margin:17px 0">${limit}${p === 1 ? '' : '×'}</p></div></div>
      ${bar('原运行时间 T = 1', remaining * 100, p * 100, '100%')}
      ${bar('优化后时间 T′（与上方同一比例尺）', remaining * 100, optimized * 100, `${number(total * 100)}%`)}
      <p style="font-size:12px">浅绿：未加速部分 ${number(remaining * 100)}%　｜　深绿：可加速部分，优化后用时 ${number(optimized * 100)}%</p>
    </div>
    <div class="lab-output">T′ = (1 − p) + p / s = ${number(remaining)} + ${number(p)} / ${number(speed)} = <strong>${number(total)}</strong><br>整体加速比 = T / T′ = 1 / [(1 − p) + p / s] = <strong>${number(overall)} 倍</strong>。<br>原本耗时 100 秒的任务，按此模型将用时 <strong>${number(total * 100)} 秒</strong>。</div>
    <p class="lab-insight">${p === 1 ? '当 p = 100% 时，没有未加速部分，整体加速比恰好等于 s；让 s 趋于无穷时，理论加速比也趋于无穷。' : p === 0 ? '当 p = 0% 时，你加速的部分从未占用原运行时间；无论 s 多大，整体加速比都为 1。' : `即使把可优化部分变成瞬间完成，仍要等待剩下的 ${number(remaining * 100)}%。所以 s → ∞ 时，整体加速上限为 1 / (1 − p) = ${limit} 倍。`} 前提是任务规模相同、p 按优化前运行时间计量，且优化不改变其他部分的耗时；这里未计通信、调度等新增开销。</p>`;
  }

  const experiments = {
    twos: {
      subtitle: '把二进制从“符号”变成你能算清的数。',
      description: '一个字节只保存 8 个 0/1。它本身没有“正负”；是解释规则赋予它数值。补码把最高位赋予负权重，让整数加法可以共用同一套位运算。',
      help: '输入 −128～127 的十进制整数，或点击下方的位。最高位用金色边框标记。',
      controls: () => control('twos', 'value', '8 位有符号整数', { min: -128, max: 127, inputmode: 'numeric' }),
      buttons: () => preset('lab-twos-preset', '-1', '试试 −1') + preset('lab-twos-preset', '-128', '观察 −128 边界') + preset('lab-twos-preset', '127', '最大正数 127'),
      result: twosResult,
      question: '先预测再操作：把 −1 的最高位从 1 改为 0，其他位不变，会得到什么？提示：被移除的是 −128 这一项。'
    },
    cache: {
      subtitle: '一个内存地址，如何找到缓存里的位置？',
      description: '先用组索引选择唯一的一组，再在该组的 E 路里比较标记，命中后用块内偏移取出目标字节。练习时把地址想成“楼栋—房间—抽屉”的定位信息。',
      help: '地址可用 0x 前缀的十六进制或十进制。B、S 必须为 2 的幂，且 b + s ≤ 16；本实验 E 范围为 1～16。',
      controls: () => control('cache', 'address', '16 位地址', { type: 'text' }) + control('cache', 'block', '块大小 B（字节）', { min: 1, max: 65536 }) + control('cache', 'sets', '组数 S', { min: 1, max: 65536 }) + control('cache', 'ways', '每组路数 E', { min: 1, max: 16 }),
      buttons: () => preset('lab-cache-preset', '0x1234', '地址 0x1234') + preset('lab-cache-preset', '0x123F', '同一块末尾') + preset('lab-cache-preset', '0x1240', '跨到下一块'),
      result: cacheResult,
      question: '保持默认 B = 16、S = 8，把 E 从 2 改为 4：地址字段会变吗？再从 0x123F 走到 0x1240，观察哪个字段先变化。'
    },
    vm: {
      subtitle: '页号要翻译，页内偏移原样保留。',
      description: '把虚拟地址分成“第几页”和“页里第几个字节”。查页表只负责把虚拟页号 VPN 换成物理页框号 PFN，然后接上原偏移；地址不是直接整体相加一个固定差值。',
      help: '页大小固定 256 字节；请输入 0x0000～0xFFFF。下方页表公开可见，方便你先手算再核对。',
      controls: () => control('vm', 'address', '16 位虚拟地址', { type: 'text' }),
      buttons: () => preset('lab-vm-preset', '0x1234', '已驻留：0x1234') + preset('lab-vm-preset', '0x0234', '未驻留：0x0234') + preset('lab-vm-preset', '0x12FF', '同页最后一字节'),
      result: vmResult,
      question: '比较 0x1200 与 0x12FF：VPN 和 PFN 应怎样变化？再输入 0x0234，想一想：程序用的地址格式合法，为什么仍不能立刻得到物理地址？'
    },
    amdahl: {
      subtitle: '局部快了 4 倍，整段程序也会快 4 倍吗？',
      description: '把原运行时间归一化为 1。占比 p 的部分被加速 s 倍，其耗时变为 p/s；剩下的 1−p 仍然需要等待。把两段时间加起来，再用原时间除以它。',
      help: '拖动滑块即时观察。p 是优化前可加速部分的时间占比；s 是这部分自身的加速倍数。',
      controls: () => `<label for="amdahl-p">可加速比例 p <output data-lab-value="p">${esc(state.amdahl.p)}%</output><input id="amdahl-p" type="range" min="0" max="100" step="1" value="${esc(state.amdahl.p)}" data-lab-input="amdahl-p" aria-describedby="amdahl-help"></label><label for="amdahl-speed">局部加速 s <output data-lab-value="speed">${esc(state.amdahl.speed)} 倍</output><input id="amdahl-speed" type="range" min="1" max="32" step="0.5" value="${esc(state.amdahl.speed)}" data-lab-input="amdahl-speed" aria-describedby="amdahl-help"></label>`,
      buttons: () => preset('lab-amdahl-preset', '80,4', '80% 部分加速 4 倍') + preset('lab-amdahl-preset', '50,32', '一半已经很快') + preset('lab-amdahl-preset', '100,4', '全部都能加速'),
      result: amdahlResult,
      question: '若 90% 的时间能优化，要让整体加速达到 5 倍，局部至少应加速多少倍？先列出 0.1 + 0.9/s ≤ 0.2，再用滑块核对。'
    }
  };

  function panelFor(element) {
    return element && typeof element.closest === 'function'
      ? element.closest('[data-study-lab]')
      : document.querySelector('[data-study-lab]');
  }

  function refresh(panel, syncControls = false) {
    if (!panel) return;
    const id = panel.dataset.studyLab;
    if (!experiments[id]) return;
    if (syncControls) {
      panel.querySelectorAll('[data-lab-input]').forEach(input => {
        const key = input.dataset.labInput.slice(id.length + 1);
        if (Object.prototype.hasOwnProperty.call(state[id], key)) input.value = state[id][key];
      });
    }
    panel.querySelectorAll('[data-lab-value]').forEach(output => {
      const key = output.dataset.labValue;
      if (key === 'p') output.textContent = state.amdahl.p + '%';
      if (key === 'speed') output.textContent = state.amdahl.speed + ' 倍';
    });
    const target = panel.querySelector('[data-lab-result]');
    if (target) target.innerHTML = experiments[id].result();
  }

  function render(requestedId) {
    const id = Object.prototype.hasOwnProperty.call(experiments, requestedId) ? requestedId : 'twos';
    const experiment = experiments[id];
    return `<div class="eyebrow"><span class="tiny-dot"></span> UNDERSTAND BY DOING</div>
      <h1 class="page-title">动手，才会真的懂。</h1>
      <p class="page-description">四个可直接操作的计算机系统实验。先做一个预测，改一个参数，再解释结果为什么改变。</p>
      <nav class="tabs" aria-label="选择互动实验">${Object.entries(labels).map(([key, title]) => `<a href="#/lab/${key}" class="tab${key === id ? ' active' : ''}"${key === id ? ' aria-current="page"' : ''}>${title}</a>`).join('')}</nav>
      <div class="lab-container"><section class="lab-panel" data-study-lab="${id}" aria-labelledby="lab-title">
        <h2 id="lab-title">${labels[id]}</h2>
        <p class="lab-description"><strong>${experiment.subtitle}</strong><br>${experiment.description}</p>
        <p id="${id}-help" class="lab-description">${experiment.help}</p>
        <div class="lab-controls">${experiment.controls()}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin:16px 0">${experiment.buttons()}<button type="button" class="btn secondary" data-action="lab-reset">恢复默认</button></div>
        <div data-lab-result aria-live="polite" aria-atomic="false">${experiment.result()}</div>
        <p class="lab-insight"><strong>想一想，再验证：</strong>${experiment.question}</p>
        <div class="lab-links"><a href="#/course/systems">回到 CSAPP 课程</a><a href="#/path">查看学习路线</a></div>
      </section></div>`;
  }

  function handleInput(element) {
    if (!element || !element.dataset || !element.dataset.labInput) return false;
    const match = /^(twos|cache|vm|amdahl)-([a-z]+)$/.exec(element.dataset.labInput);
    if (!match) return false;
    const [, id, key] = match;
    if (!Object.prototype.hasOwnProperty.call(state[id], key)) return false;
    state[id][key] = String(element.value);
    refresh(panelFor(element));
    return true;
  }

  function handleAction(action, element) {
    if (!action || !action.startsWith('lab-')) return false;
    const panel = panelFor(element);
    if (!panel || !experiments[panel.dataset.studyLab]) return false;
    const id = panel.dataset.studyLab;
    const value = element && element.dataset ? element.dataset.value : undefined;
    let restoreBitFocus = null;
    if (action === 'lab-reset') {
      state[id] = { ...initial[id] };
    } else if (action === 'lab-twos-bit' && id === 'twos') {
      const bit = integer(element.dataset.bit, 0, 7, '位索引');
      const parsed = integer(state.twos.value, -128, 127, '有符号数');
      if (bit.error || parsed.error) return false;
      if (document.activeElement === element) restoreBitFocus = bit.value;
      const unsigned = ((parsed.value + 256) % 256) ^ (1 << bit.value);
      state.twos.value = String(unsigned >= 128 ? unsigned - 256 : unsigned);
    } else if (action === `lab-${id}-preset` && value !== undefined) {
      if (id === 'twos') state.twos.value = value;
      else if (id === 'cache' || id === 'vm') state[id].address = value;
      else if (id === 'amdahl') {
        const values = value.split(',');
        if (values.length !== 2) return false;
        state.amdahl.p = values[0];
        state.amdahl.speed = values[1];
      }
    } else return false;
    refresh(panel, true);
    if (restoreBitFocus !== null) {
      const replacement = panel.querySelector(`[data-action="lab-twos-bit"][data-bit="${restoreBitFocus}"]`);
      if (replacement) replacement.focus({ preventScroll: true });
    }
    return true;
  }

  // The parent application owns delegation. Do not bind duplicate document listeners.
  function afterRender() {
    document.querySelectorAll('[data-study-lab]').forEach(panel => refresh(panel));
  }

  window.StudyLabs = { render, handleAction, handleInput, afterRender };
})();
