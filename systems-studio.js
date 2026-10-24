/* Original illustrated companions. All demonstrations are local teaching models. */
(() => {
'use strict';
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const course = window.COURSES.find(c=>c.id==='systems');
const content = {...window.SYSTEMS_BEGINNER,...window.PLAIN_BEGINNER};
const lessons = window.COURSES.flatMap(c=>c.chapters.flatMap(ch=>ch.lessons));
const steps = new Map(), checks = new Map(), demos = new Map();
// These layouts describe dependencies, not merely the order in which paragraphs are read.
const layouts={
 'sys-loop-optimization':'forkjoin','sys-amat':'forkjoin','sys-branch-optimization':'flow','sys-process':'flow','sys-tlb':'flow','sys-page-fault-mmap':'flow','sys-gc-memory':'flow','sys-file-sharing':'flow','sys-deadlock-safety':'flow',
 'ds-quicksort':'flow','ds-connectivity-scc':'flow','ds-aoe-critical-path':'merge','ds-tree-reconstruction':'merge','ds-forest-storage-conversion':'flow','ds-backtracking':'flow',
 'dm-proof-strategies':'flow','dm-graph-bipartite':'branches','dm-cosets':'compare','dm-power-set':'flow','dm-cartesian-product':'flow','dm-equivalence-classes':'flow',
 'prob-axioms':'compare','prob-conditional':'flow','prob-total-bayes':'merge','prob-random-variable':'compare','prob-transform-many':'merge','prob-markov-power':'merge','prob-timeseries-maarma':'shared','prob-multiple-regression':'flow','prob-two-normal-ci':'compare','prob-joint-density':'merge','prob-marginals':'merge','prob-sum-convolution':'merge','prob-product-ratio':'compare'
};
const find = id => content[id];
for (const lesson of lessons) {
  const guide = find(lesson.id); if (!guide) continue;
  lesson.systemsOriginal = {sections:lesson.sections,example:lesson.example,mistakes:lesson.mistakes,takeaway:lesson.takeaway,objective:lesson.objective,prereq:lesson.prereq};
  lesson.beginner = guide;
  lesson.sections = guide.steps.map(s=>({title:s.title,body:s.text}));
  lesson.objective = guide.goal;
  lesson.prereq = '不要求会 C 或汇编。先看图；遇到带虚线的词，点一下就有解释。';
  lesson.example = guide.example||lesson.example; lesson.mistakes = guide.mistakes||lesson.mistakes; lesson.takeaway = guide.recap||lesson.takeaway;
  if(!lesson.id.startsWith('sys-'))lesson.prereq='可先读情境和图解；深入部分需要 '+(Array.isArray(lesson.systemsOriginal.prereq)?lesson.systemsOriginal.prereq.join('、'):lesson.systemsOriginal.prereq||'本章前面的基础概念');
}
if(course) {
  course.subtitle='CSAPP 第三版 · 从零讲清楚，跟着图一步一步看';
  course.description='按《深入理解计算机系统》第三版的12章安排55课。每课从具体问题出发，用白话解释专业名词，配可逐步点读的原创图解、具体例题和入门小检查；关键概念还可改变输入观察结果。不要求先会C或汇编。原来的深入讲解与自测仍可展开阅读，教材编号、课程链接和学习计划保持兼容。';
}
function words(text,id) {
  const entries=(find(id)?.terms||[]).flatMap((t,i)=>{
    const aliases=[t.word,...t.word.split(/\s*[\/／]\s*/),t.word.replace(/（[^）]*）|\([^)]*\)/g,'').trim()];
    return [...new Set(aliases)].filter(Boolean).map(word=>({...t,word,index:i}));
  }).sort((a,b)=>b.word.length-a.word.length);
  if(!entries.length) return esc(text);
  const pattern=new RegExp(entries.map(t=>t.word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
  let last=0,out='',match;
  while((match=pattern.exec(String(text)))) {
    const term=entries.find(t=>t.word===match[0]);
    out+=esc(String(text).slice(last,match.index))+`<button class="sys-word" data-sys-action="term" data-sys-id="${esc(id)}" data-sys-value="${term.index}" aria-expanded="false">${esc(match[0])}<span aria-hidden="true">?</span></button>`;
    last=match.index+match[0].length;
  }
  return out+esc(String(text).slice(last));
}
const paragraphs=(text,id)=>String(text||'').split(/\n+/).filter(Boolean).map(p=>`<p>${words(p,id)}</p>`).join('');
function symbol(name) {
  const icons={
    cpu:'<rect x="10" y="10" width="28" height="28" rx="4"/><path d="M18 18h12v12H18M4 17h6M4 30h6M38 17h6M38 30h6M17 4v6M30 4v6M17 38v6M30 38v6"/>',
    memory:'<rect x="4" y="13" width="40" height="23" rx="3"/><path d="M10 19h6v9h-6zM21 19h6v9h-6zM32 19h6v9h-6zM12 36v6M20 36v6M28 36v6M36 36v6"/>',
    file:'<path d="M11 4h19l9 9v31H11zM30 4v10h9M18 23h14M18 30h14M18 37h8"/>',
    clock:'<circle cx="24" cy="24" r="18"/><path d="M24 12v13l9 5"/>',
    network:'<rect x="15" y="4" width="18" height="12" rx="2"/><rect x="2" y="31" width="16" height="12" rx="2"/><rect x="30" y="31" width="16" height="12" rx="2"/><path d="M24 16v9H10v6M24 25h14v6"/>',
    lock:'<rect x="10" y="21" width="28" height="23" rx="4"/><path d="M16 21v-9a8 8 0 0 1 16 0v9M24 29v7"/>',
    disk:'<path d="M10 6h28l6 33H4z"/><path d="M6 31h36"/><circle cx="34" cy="36" r="1.5"/>',
    bits:'<rect x="3" y="10" width="18" height="28" rx="4"/><rect x="27" y="10" width="18" height="28" rx="4"/><path d="M10 18h4v13M33 18h6v13h-6z"/>',
    arrow:'<path d="M5 24h38M31 12l12 12-12 12"/>',
    person:'<circle cx="24" cy="12" r="7"/><path d="M10 43v-8a14 14 0 0 1 28 0v8M18 34v10M30 34v10"/>',
    table:'<rect x="5" y="7" width="38" height="34" rx="3"/><path d="M5 18h38M5 29h38M21 7v34"/>'
  };
  return `<g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${icons[name]||icons.file}</g>`;
}
function iconFor(name,id,i) {
  if(/CPU|处理|计算|运算|寄存/.test(name))return 'cpu';
  if(/内存|缓存|字节|格子|块|堆|栈/.test(name))return 'memory';
  if(/锁|钥匙|保护/.test(name))return 'lock';
  if(/网络|连接|客户|服务|端口/.test(name))return 'network';
  if(/时|周期|等待/.test(name))return 'clock';
  if(/页表|表|映射/.test(name))return 'table';
  if(/磁盘|硬盘|保存/.test(name))return 'disk';
  if(/位|进制|数|开关/.test(name))return 'bits';
  if(/线程|进程|用户|工人/.test(name))return 'person';
  return /sys-overview/.test(id)?['file','memory','cpu','file','network'][i]:'file';
}
function svgTextWidth(text){return [...String(text)].reduce((n,c)=>n+(c.charCodeAt(0)>255?1:.57),0);}
function diagramSVG(data,id,active,compact=false) {
  const nodes=data.nodes,n=nodes.length,kind=layouts[id]||data.kind;
  const width=compact?320:760;
  const height=kind==='forkjoin'?(compact?460:350):['merge','shared'].includes(kind)?(compact?360:290):kind==='layers'?n*81+20:kind==='branches'?(compact?198+(n-2)*78:290):kind==='cycle'?(compact?n*105+18:340):compact?n*105+18:238;
  let positions=[];
  if(kind==='forkjoin')positions=compact?[{x:160,y:49,w:250,h:72},{x:175,y:157,w:236,h:80},{x:175,y:265,w:236,h:80},{x:160,y:403,w:250,h:72}]:[{x:380,y:49,w:270,h:72},{x:190,y:174,w:310,h:82},{x:570,y:174,w:310,h:82},{x:380,y:301,w:270,h:72}];
  else if(kind==='merge')positions=compact?[{x:165,y:51,w:250,h:80},{x:165,y:162,w:250,h:80},{x:160,y:299,w:250,h:72}]:[{x:190,y:65,w:310,h:88},{x:570,y:65,w:310,h:88},{x:380,y:229,w:310,h:88}];
  else if(kind==='shared')positions=compact?[{x:180,y:159,w:238,h:80},{x:180,y:267,w:238,h:80},{x:160,y:49,w:250,h:72}]:[{x:190,y:221,w:310,h:88},{x:570,y:221,w:310,h:88},{x:380,y:59,w:270,h:72}];
  else if(kind==='layers') positions=nodes.map((_,i)=>({x:width/2,y:51+i*81,w:Math.min(width-32,220+i*(width-252)/Math.max(1,n-1)),h:66}));
  else if(kind==='branches') positions=nodes.map((_,i)=>i===0?{x:width/2,y:62,w:compact?238:230,h:86}:{x:compact?180:((i-.5)*(width-20)/(n-1)+10),y:compact?148+(i-1)*78:218,w:compact?238:Math.min(174,(width-32)/(n-1)-12),h:compact?64:94});
  else if(kind==='cycle') positions=nodes.map((_,i)=>compact?{x:180,y:62+i*105,w:236,h:82}:{x:width/2+Math.cos(-Math.PI/2+i*2*Math.PI/n)*230,y:height/2+Math.sin(-Math.PI/2+i*2*Math.PI/n)*110,w:180,h:72});
  else positions=nodes.map((_,i)=>({x:compact?width/2:((i+.5)*width/n),y:compact?62+i*105:119,w:compact?260:width/n-16,h:compact?82:148}));
  let lines='';
  const arrow=(a,b,reverse=false)=>{
    const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;
    const s=Math.min(Math.abs(dx)>Math.abs(dy)?a.w/2+2:a.h/2+2,d*.43);
    const e=Math.min(Math.abs(dx)>Math.abs(dy)?b.w/2+7:b.h/2+7,d*.43);
    return `<path class="sys-svg-edge" d="M${a.x+dx/d*s} ${a.y+dy/d*s} L${b.x-dx/d*e} ${b.y-dy/d*e}" marker-end="url(#${esc(id)}-${compact?'m':'w'}-arrow)"/>`;
  };
  const elbow=(a,b,x)=>`<path class="sys-svg-edge" d="M${a.x+(x<a.x?-a.w/2:a.w/2)} ${a.y}H${x}V${b.y}H${b.x+(x<b.x?-b.w/2-7:b.w/2+7)}" marker-end="url(#${esc(id)}-m-arrow)"/>`;
  if(kind==='forkjoin')for(const [a,b]of [[0,1],[0,2],[1,3],[2,3]])lines+=compact?elbow(positions[a],positions[b],a===0?18:310):arrow(positions[a],positions[b]);
  else if(kind==='merge')for(const i of [0,1])lines+=compact?elbow(positions[i],positions[2],310):arrow(positions[i],positions[2]);
  else if(kind==='shared')for(const i of [0,1])lines+=compact?elbow(positions[2],positions[i],18):arrow(positions[2],positions[i]);
  else if(kind==='branches')for(let i=1;i<n;i++)lines+=compact?`<path class="sys-svg-edge" d="M41 62H18V${positions[i].y}H53" marker-end="url(#${esc(id)}-m-arrow)"/>`:arrow(positions[0],positions[i]);
  else if(kind!=='compare'&&kind!=='memory')for(let i=1;i<n;i++)lines+=arrow(positions[i-1],positions[i]);
  if(kind==='cycle')lines+=compact?`<path class="sys-svg-edge" d="M62 ${positions[n-1].y}H20V62H54" marker-end="url(#${esc(id)}-m-arrow)"/>`:arrow(positions[n-1],positions[0]);
  return `<svg class="sys-diagram-svg ${compact?'sys-svg-compact':'sys-svg-wide'}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(data.caption)}"><defs><marker id="${esc(id)}-${compact?'m':'w'}-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1 1l7 4-7 4" fill="none" stroke="#789584" stroke-width="1.6"/></marker></defs>${lines}${nodes.map((node,i)=>{
    const p=positions[i],small=p.h<95;
    const titleSize=Math.min(compact?16:15,(p.w-22)/Math.max(1,svgTextWidth(node.name)));
    const detailSize=Math.min(compact?12:11,(p.w-18)/Math.max(1,svgTextWidth(node.detail)));
    return `<g class="sys-svg-node ${i===active?'is-active':''}"><rect x="${p.x-p.w/2}" y="${p.y-p.h/2}" width="${p.w}" height="${p.h}" rx="${kind==='memory'?3:12}"/><text class="sys-svg-number" x="${p.x-p.w/2+12}" y="${p.y-p.h/2+19}">${String(i+1).padStart(2,'0')}</text>${small?'':`<g transform="translate(${p.x-22} ${p.y-54}) scale(.9)">${symbol(iconFor(node.name,id,i))}</g>`}<text class="sys-svg-title" style="font-size:${titleSize}px" x="${p.x}" y="${p.y+(small?-1:15)}" text-anchor="middle">${esc(node.name)}</text><text class="sys-svg-detail" style="font-size:${detailSize}px" x="${p.x}" y="${p.y+(small?19:40)}" text-anchor="middle">${esc(node.detail)}</text></g>`;
  }).join('')}</svg>`;
}
function button(action,text,id,value='',extra='') {const classMatch=extra.match(/class="([^"]*)"/);const classes=classMatch?classMatch[1]:'sys-control';extra=extra.replace(/class="[^"]*"/,'');return `<button type="button" class="${classes}" data-sys-action="${action}" data-sys-id="${esc(id)}" data-sys-value="${value}" ${extra}>${text}</button>`;}
function diagram(guide,id,index) {
  return `<figure class="sys-diagram">${diagramSVG(guide.diagram,id,index)}${diagramSVG(guide.diagram,id,index,true)}<figcaption>${esc(guide.diagram.caption)}</figcaption></figure>`;
}
function walkthrough(id) {
  const guide=find(id),index=steps.get(id)||0,current=guide.steps[index];
  return `${diagram(guide,id,index)}<div class="sys-step-tabs" role="group" aria-label="选择图解步骤">${guide.steps.map((s,i)=>button('step',`${String(i+1).padStart(2,'0')} <span>${esc(guide.diagram.nodes[i].name)}</span>`,id,i,`aria-pressed="${index===i}"`)).join('')}</div><div class="sys-step-copy" role="region" aria-live="polite" aria-label="当前步骤讲解"><span class="sys-kicker">第 ${index+1} / ${guide.steps.length} 步</span><h3>${esc(current.title)}</h3>${paragraphs(current.text,id)}</div><div class="sys-step-controls">${button('step','← 上一步',id,index-1,index===0?'disabled':'')}<span>${index+1} / ${guide.steps.length}</span>${button('step','下一步 →',id,index+1,index===guide.steps.length-1?'disabled':'')}</div><details class="sys-all-steps"><summary>想连起来读？展开全部步骤</summary>${guide.steps.map((s,i)=>`<section id="section-${i}"><h3>${i+1}. ${esc(s.title)}</h3>${paragraphs(s.text,id)}</section>`).join('')}</details>`;
}
function glossary(id,filter='') {
  const terms=(find(id)?.terms||[]).filter(t=>(t.word+t.meaning+t.example).toLowerCase().includes(filter.toLowerCase()));
  return terms.length?terms.map(t=>`<details class="sys-term-card"><summary><strong>${esc(t.word)}</strong><span>${esc(t.meaning)}</span></summary><p><span class="sys-kicker">放到例子里</span>${esc(t.example)}</p></details>`).join(''):'<p class="sys-muted">本课没有这个词。可以用页面顶部的搜索找相关课程。</p>';
}
function labKind(id){
  if(['sys-bits','sys-twos-complement','sys-bit-operations'].includes(id))return 'bits';
  if(id==='sys-integer-overflow')return 'counter';
  if(['sys-pointers','sys-byte-layout','sys-arrays'].includes(id))return 'pointer';
  if(['sys-cache-mapping','sys-locality','sys-cache-write','sys-amat'].includes(id))return 'cache';
  if(['sys-paging','sys-tlb','sys-page-fault-mmap'].includes(id))return 'paging';
  if(['sys-thread-races','sys-locks','sys-concurrency-models','sys-deadlock-safety'].includes(id))return 'race';
  if(['sys-stack-frame','sys-lifetime'].includes(id))return 'stack';
  return null;
}
function demoState(id) {if(!demos.has(id))demos.set(id,{bits:id==='sys-twos-complement'?253:11,signed:id==='sys-twos-complement',counter:14,pointer:42,read:0,address:13,race:0,locked:false,stack:0});return demos.get(id);}
function miniLab(id) {
  const kind=labKind(id),s=demoState(id);if(!kind)return '';
  let html='',note='',title='';
  if(kind==='bits') {
    title='亲手拨一下开关，看看数怎样变';
    const bits=s.bits.toString(2).padStart(8,'0').split('');
    const value=s.signed&&s.bits>=128?s.bits-256:s.bits;
    html=`<div class="sys-bits">${bits.map((b,i)=>`<div><small>${s.signed&&i===0?'−128':2**(7-i)}</small>${button('bit',b,id,7-i,`aria-pressed="${b==='1'}" aria-label="${2**(7-i)} 位置的开关，当前 ${b}"`)}<span>${b==='1'?'接通':'断开'}</span></div>`).join('')}</div><div class="sys-demo-result" aria-live="polite"><span>按${s.signed?'有符号补码':'无符号整数'}来读</span><strong>${value}</strong><p>${bits.map((b,i)=>b==='1'?(s.signed&&i===0?'(−128)':String(2**(7-i))):null).filter(Boolean).join(' + ')||'没有开关接通'} = ${value}</p></div><div class="sys-actions">${button('signed','按无符号读',id,'no',`aria-pressed="${!s.signed}"`)}${button('signed','按补码读',id,'yes',`aria-pressed="${s.signed}"`)}</div>`;
    note='上方小数是每个位置的分值。1 表示计入，0 表示不计入。切换读法不会改动开关，只会改变最左一位的分值。本演示固定用 8 位；不模拟 C 的类型提升或移位。';
  }
  if(kind==='counter') {
    title='只有四格，15 再加 1 会怎样？';
    html=`<div class="sys-counter-digits" aria-label="四位计数器">${s.counter.toString(2).padStart(4,'0').split('').map(b=>`<span>${b}</span>`).join('')}</div><div class="sys-demo-result" aria-live="polite"><span>四位无符号教学模型</span><strong>${s.counter}</strong><p>${s.counter===0&&s.wrapped?'刚才 15 + 1 = 16，需要第五位。这里只留四位，因此显示 0。':'范围是 0—15。先猜下一次数值，再点加 1。'}</p></div><div class="sys-actions">${button('count','加 1',id)}${button('reset','回到 14',id)}</div>`;
    note='这是固定位宽的无符号回绕模型，不是用 C 的 int 来计算溢出。C 中有符号整数溢出不能按这个演示推断。';
  }
  if(kind==='pointer') {
    title='地址是格子的编号，内容是格子里的数';
    html=`<svg class="sys-pointer-picture sys-svg-wide" viewBox="0 0 620 210" role="img" aria-label="指针 p 保存地址 100，箭头指向地址 100 中的整数 ${s.pointer}"><defs><marker id="${id}-ptr" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0l6 3.5-6 3.5" fill="none" stroke="#527660"/></marker></defs><rect x="20" y="58" width="178" height="98" rx="12"/><text x="109" y="37" text-anchor="middle">指针 p</text><text class="sys-number-large" x="109" y="105" text-anchor="middle">100</text><text class="sys-picture-small" x="109" y="136" text-anchor="middle">存的是编号</text><path class="sys-pointer-arrow" d="M210 107H374" marker-end="url(#${id}-ptr)"/><text class="sys-picture-small" x="294" y="88" text-anchor="middle">沿编号去找</text><rect x="392" y="58" width="207" height="98" rx="12"/><text x="496" y="37" text-anchor="middle">从地址 100 开始的整数</text><text class="sys-number-large" x="496" y="105" text-anchor="middle">${s.pointer}</text><text class="sys-picture-small" x="496" y="136" text-anchor="middle">存的是数值</text><text class="sys-picture-small" x="310" y="192" text-anchor="middle">写 *p：按 p 保存的地址，找到那里的对象</text></svg><svg class="sys-pointer-picture sys-svg-compact" viewBox="0 0 320 340" role="img" aria-label="指针保存地址100，沿编号找到值为${s.pointer}的整数"><rect x="35" y="35" width="250" height="90" rx="10"/><text x="160" y="22" text-anchor="middle">指针 p：存地址</text><text class="sys-number-large" x="160" y="87" text-anchor="middle">100</text><path class="sys-pointer-arrow" d="M160 135v55m-6-8 6 8 6-8"/><text class="sys-picture-small" x="177" y="162">沿编号找</text><rect x="35" y="220" width="250" height="90" rx="10"/><text x="160" y="207" text-anchor="middle">地址 100 开始的整数</text><text class="sys-number-large" x="160" y="274" text-anchor="middle">${s.pointer}</text><text class="sys-picture-small" x="160" y="333" text-anchor="middle">*p 表示沿 p 的地址找到对象</text></svg><div class="sys-actions">${button('pointer',s.pointer===42?'把 *p 改成 9':'把 *p 改回 42',id)}</div><p class="sys-demo-feedback" aria-live="polite">p 仍是 100；改变的是它指向的整数，现在为 ${s.pointer}。</p>`;
    note='图中右框代表一个完整整数对象，不是一个字节。常见平台一个 int 占 4 字节，此处省略内部字节与指针自身的存储位置。*p 在这里表示“沿地址找到对象”；* 在乘法中是另一种用法。';
  }
  if(kind==='cache') {
    title='桌上只有两个位置，还能不能少跑仓库？';
    const sequence=[0,1,0,2,0,1],slots=[null,null];let hits=0,last=null;
    for(let i=0;i<s.read;i++){const a=sequence[i],slot=a%2,hit=slots[slot]===a;if(hit)hits++;last={a,slot,hit,old:slots[slot]};slots[slot]=a;}
    html=`<div class="sys-read-sequence" aria-label="固定访问顺序">${sequence.map((a,i)=>`<span class="${i===s.read-1?'current':i<s.read?'past':''}">读 ${a}</span>`).join('')}</div><div class="sys-cache-table">${slots.map((a,i)=>`<div><span>缓存位置 ${i}</span><strong>${a===null?'空':`块 ${a}`}</strong><small>${a===null?'还没放东西':`标记 ${Math.floor(a/2)}`}</small></div>`).join('')}</div><p class="sys-demo-feedback" aria-live="polite">${last?`第 ${s.read} 次：读块 ${last.a}，去位置 ${last.slot}。${last.hit?'已经在桌上，命中，直接取。':`不在桌上，未命中，从主存搬来${last.old!==null?`并替换块 ${last.old}`:''}。`}`:'点击“读下一个”，从空缓存开始。'} 已命中 ${hits} 次 / 已读取 ${s.read} 次。</p><div class="sys-actions">${button('read','读下一个 →',id,'',s.read===6?'disabled':'')}${button('reset','清空重来',id)}</div>`;
    note='简化为两位置、每块一个字节、直接映射的读缓存：偶数块去位置 0，奇数块去位置 1。标记区分同一位置对应的不同块。这只演示读取和替换，不模拟写入策略、多级缓存或实际访问耗时。';
  }
  if(kind==='paging') {
    title='程序说的第 13 格，实际是哪一格？';
    const a=s.address,pageNo=Math.floor(a/4),offset=a%4,map=[2,0,null,1],frame=map[pageNo];
    html=`<label class="sys-range-label">程序使用的地址 <output>${a}</output><input data-sys-input="address" data-sys-id="${id}" aria-label="程序使用的虚拟地址" type="range" min="0" max="15" step="1" value="${a}"></label><div class="sys-page-map">${map.map((f,i)=>`<div class="${i===pageNo?'selected':''}"><span>程序页 ${i}</span><b aria-hidden="true">→</b><strong>${f===null?'尚未装入':`内存框 ${f}`}</strong></div>`).join('')}</div><p class="sys-demo-feedback" aria-live="polite">${a} ÷ 4：第 ${pageNo} 页，页内第 ${offset} 格。${frame===null?'这页当前不在内存中，先交给操作系统处理；当前不能直接读。':`查表得内存框 ${frame}，实际地址 = ${frame} × 4 + ${offset} = ${frame*4+offset}。`}</p>`;
    note='演示只用 16 个虚拟字节、每页 4 字节，编号从 0 开始。实际页通常大得多。此处假设读权限合法；“尚未装入”不一定意味着从磁盘读，也可能按需分配内存。';
  }
  if(kind==='race') {
    title='两个人各加一次，为什么有时只多了 1？';
    const actions=s.locked?[['甲','读',0],['甲','算',1],['甲','写',1],['乙','读',1],['乙','算',2],['乙','写',2]]:[['甲','读',0],['乙','读',0],['甲','算',1],['乙','算',1],['甲','写',1],['乙','写',1]];
    let a='—',b='—',total=0;
    for(let i=0;i<s.race;i++){const [who,act,n]=actions[i];if(who==='甲')a=n;else b=n;if(act==='写')total=n;}
    const current=s.race?actions[s.race-1]:null;
    html=`<div class="sys-actions">${button('lock','交错进行',id,'no',`aria-pressed="${!s.locked}"`)}${button('lock','轮流持锁',id,'yes',`aria-pressed="${s.locked}"`)}</div><div class="sys-race-desk"><div><span>甲的便签</span><strong>${a}</strong></div><div class="sys-shared"><span>共同的计数</span><strong>${total}</strong><small>${s.locked?'一次一人用钥匙':'两人都能碰'}</small></div><div><span>乙的便签</span><strong>${b}</strong></div></div><p class="sys-demo-feedback" aria-live="polite">${current?`第 ${s.race} 步：${current[0]}${current[1]==='读'?'把公共数字抄到自己便签':current[1]==='算'?'在自己的便签上加 1':'把自己便签的数写回公共位置'}，${current[1]==='写'?'公共数字':'便签数字'}变为 ${current[2]}。`:'每次加 1 拆成读、计算、写回三个动作。先猜最后是 1 还是 2。'}${s.race===6?(s.locked?' 两次更新都保留，结果是 2。':' 两人都根据旧的 0 计算，最后一次写回覆盖了前一次更新，结果是 1。'):''}</p><div class="sys-actions">${button('race','执行一步 →',id,'',s.race===6?'disabled':'')}${button('reset','从 0 开始',id)}</div>`;
    note='这是拆开读、算、写后的交错教学模型，不是实际执行多线程 C。普通 C 共享变量若发生未同步的数据竞争，属于未定义行为，不能据此预测唯一运行结果。持锁部分把三个动作放在同一次受保护操作中。';
  }
  if(kind==='stack') {
    title='函数一层层调用，回来时怎么找到路？';
    const stages=[['main'],['main','double(3)'],['main','double(3)','add(3,3)'],['main','double(3)'],['main']];
    const explanations=['主函数 main 正在运行。','main 暂停，调用 double(3)，记住稍后该回到 main 的哪一步。','double 暂停，调用 add(3,3)，再记住该回到 double 的哪一步。','add 算出 6，撤掉这一层工作区，把 6 交回 double。','double 返回 6，撤掉自己的工作区，main 接着执行。'];
    html=`<div class="sys-stack-desk">${[...stages[s.stack]].reverse().map((name,i)=>`<div class="${i===0?'active':''}"><span>${i===0?'当前正在执行':'暂停，等上层返回'}</span><strong>${esc(name)}</strong></div>`).join('')}</div><p class="sys-demo-feedback" aria-live="polite">${explanations[s.stack]}</p><div class="sys-actions">${button('stack','执行下一步 →',id,'',s.stack===4?'disabled':'')}${button('reset','重看调用过程',id)}</div>`;
    note='add(3,3) 读作“调用加法函数，给它两个 3”。示意的是调用关系与返回顺序，不表示精确内存布局；真实编译器可能内联函数，参数和局部变量也可能保存在寄存器里。';
  }
  return `<section class="sys-lab article-section" id="sys-lab"><div class="sys-section-heading"><span class="sys-kicker">换你动手</span><h2>${title}</h2></div><div data-sys-lab="${id}">${html}<p class="sys-model-note"><strong>这张图怎样简化了真实机器：</strong>${note}</p></div></section>`;
}
function renderLesson(lesson) {
  const id=lesson.id,g=find(id);if(!g)return '';
  const lead=String(g.story).split(/(?<=[。！？])/)[0];
  return `<div class="sys-reading" data-sys-lesson="${id}"><aside class="sys-definition" data-sys-definition hidden aria-live="polite"></aside><section class="sys-visual article-section" id="sys-visual"><div class="sys-section-heading"><span class="sys-kicker">先看见过程，再认识名字</span><h2>从这幅图开始，一次只看一步</h2><p class="sys-visual-lead">${words(lead,id)}</p></div><div data-sys-walkthrough="${id}">${walkthrough(id)}</div><p class="sys-word-hint">点图下的步骤，或按“下一步”。带虚线的词可以点开，立即看白话解释。</p></section><details class="sys-story article-section" id="sys-story"><summary>把这个具体情境，再讲细一点</summary><div class="sys-story-copy"><p><strong>本课想弄明白：</strong>${esc(g.goal)}</p>${paragraphs(g.story,id)}</div></details>${miniLab(id)}${window.PlainPictures?.render(id)||''}<section class="sys-glossary article-section" id="sys-terms"><div class="sys-section-heading"><span class="sys-kicker">词语不用猜</span><h2>本课的名词，翻译成白话</h2></div><label class="sys-term-search">找一个词<input type="search" data-sys-input="terms" data-sys-id="${id}" placeholder="试试本课的术语或缩写…"></label><div data-sys-glossary="${id}">${glossary(id)}</div></section><aside class="sys-boundary"><strong>类比说到哪里就该停？</strong><p>${esc(g.boundary)}</p></aside></div>`;
}

function renderVisual(lesson) {
  const id=lesson.id,g=find(id);if(!g)return '';
  return `<div class="sys-reading" data-sys-lesson="${id}"><aside class="sys-definition" data-sys-definition hidden aria-live="polite"></aside><div data-sys-walkthrough="${id}">${walkthrough(id)}</div>${miniLab(id)}${window.PlainPictures?.render(id)||''}</div>`;
}
function renderCheck(lesson) {
  const id=lesson.id,g=find(id),q=g?.quiz||lessons.find(l=>l.id===id)?.quiz;if(!q)return '';
  const selected=checks.get(id),answered=Number.isInteger(selected);
  return `<div class="sys-check" data-sys-check="${id}"><p class="sys-check-question">${esc(q.question)}</p><div class="sys-check-options">${q.options.map((option,i)=>button('check',`<b>${'ABCD'[i]}</b>${esc(option)}`,id,i,`class="sys-control ${answered&&i===q.answer?'sys-correct':answered&&i===selected?'sys-incorrect':''}" ${answered?'disabled':''} aria-pressed="${i===selected}"`)).join('')}</div>${answered?`<p class="sys-check-answer" role="status"><strong>${selected===q.answer?'对，你抓住了关键。':'先别急，回到图里再看一眼。'}</strong>${esc(q.explanation)}</p>${button('check-reset','再想一次',id)}`:'<p class="sys-muted">先用自己的话判断，不需要背专业术语。</p>'}</div>`;
}
function renderReference(lesson,originalQuiz) {
  const original=lesson.systemsOriginal;if(!original)return '';
  const symbols=lesson.course?.id==='em'?(window.EMStudio?.lessonAid(lesson,'intro')||'')+(window.EMStudio?.lessonAid(lesson,'formulas')||''):lesson.course?.id==='discrete'?window.MathStudio?.lessonSymbols(lesson.symbols)||'':lesson.course?.id==='probability'?window.ProbabilityStudio?.lessonSymbols(lesson.symbols)||'':'';
  return `<details class="sys-reference" id="sys-reference"><summary><span>看懂图以后，再读深入讲解</span><small>原课细节、适用条件与教材自测</small></summary><p class="sys-muted">这里保留原来的深入内容。第一遍先把上面的图和小例子弄清楚，再回来补充技术细节。</p><p class="sys-muted"><strong>深入部分的前置知识：</strong>${esc(Array.isArray(original.prereq)?original.prereq.join("、"):original.prereq||"本章前面的基础内容")}</p>${symbols}${original.sections.map(s=>`<section><h3>${esc(s.title)}</h3>${paragraphs(s.body,lesson.id)}</section>`).join('')}${find(lesson.id)?.example?`<section class="sys-original-example"><h3>原课例题：再走深一步</h3><p>${esc(original.example.question)}</p><ol>${original.example.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><p><strong>结果：</strong>${esc(original.example.answer)}</p><h3>原课的边界与误区</h3><ul>${original.mistakes.map(s=>`<li>${esc(s)}</li>`).join('')}</ul><p>${esc(original.takeaway)}</p></section>`:''}<h3>进一步检查：原课自测</h3>${originalQuiz}</details>`;
}
function toc(lesson) {return [['sys-story','从具体问题开始'],['sys-visual','一步一步看图'],...(labKind(lesson.id)?[['sys-lab','亲手改一改']]:[]),['sys-terms','名词白话词典']].map(([target,label])=>`<button data-action="scroll-to" data-target="${target}">${label}</button>`).join('');}
function renderGuide() {
  return `<div class="sys-guide"><div class="eyebrow">计算机系统 / 从零看图</div><h1 class="page-title">先看见它在做什么，<br>再认识它叫什么。</h1><p class="sys-guide-lead">不知道 CPU、内存、进程是什么，也可以从这里开始。每次只学一件事，跟着图走，再亲手试一下。</p><div class="sys-guide-hero"><svg viewBox="0 0 660 200" role="img" aria-label="文件放在硬盘里，运行前送进内存，再由处理器一步步执行"><path d="M170 94H268M396 94H492" class="sys-svg-edge"/><g transform="translate(55 32) scale(2)">${symbol('disk')}</g><g transform="translate(283 32) scale(2)">${symbol('memory')}</g><g transform="translate(510 32) scale(2)">${symbol('cpu')}</g><text x="104" y="157" text-anchor="middle">硬盘：长期保存</text><text x="332" y="157" text-anchor="middle">内存：运行时暂放</text><text x="557" y="157" text-anchor="middle">CPU：一步步做事</text></svg><p>先记这一幅图。三个部件各做一件不同的事，后面的课会慢慢展开。</p></div><h2>第一次学，先按这六站走</h2><div class="sys-guide-stops">${['sys-overview','sys-bits','sys-byte-layout','sys-toolchain','sys-pointers','sys-os-abstractions'].map((id,i)=>`<a href="#/lesson/${id}"><span>${String(i+1).padStart(2,'0')}</span><strong>${esc(find(id)?.plainTitle||id)}</strong><p>${esc(find(id)?.goal||'')}</p><small>打开图解 →</small></a>`).join('')}</div><div class="sys-guide-method"><h2>一课怎么学？</h2><ol><li><strong>先读情境。</strong>说清这课想解决什么问题。</li><li><strong>再跟着图走。</strong>先猜下一步，点按钮验证；陌生词可以随时点开。</li><li><strong>亲手算小例子。</strong>用自己的话解释结果，再看解析。</li><li><strong>最后补细节。</strong>展开深入讲解，了解简化图没画出的条件。</li></ol></div><a class="btn primary" href="#/course/systems">查看全部 55 课图解 →</a><a class="text-link" href="#/code-guide/variables">想从零认识 C 代码？打开代码入门 ↗</a></div>`;
}
function updateWalkthrough(id) {
  const root=document.querySelector(`[data-sys-walkthrough="${id}"]`);if(root)root.innerHTML=walkthrough(id);
}
document.addEventListener('click',event=>{
  const el=event.target.closest('[data-sys-action]');if(!el)return;
  const {sysAction:action,sysId:id,sysValue:value}=el.dataset,g=find(id);if(!g)return;
  if(action==='term') {
    const t=g.terms[Number(value)];if(!t)return;
    const scope=el.closest('.lesson-article')||document;
    let panel=scope.querySelector('[data-sys-definition]');
    if(!panel){panel=document.createElement('aside');panel.className='sys-definition';panel.dataset.sysDefinition='';panel.hidden=true;panel.setAttribute('aria-live','polite');scope.querySelector('.sys-reading')?.append(panel);}
    const same=panel.dataset.word===t.word&&!panel.hidden;
    scope.querySelectorAll('[data-sys-action="term"]').forEach(b=>b.setAttribute('aria-expanded','false'));
    if(same){panel.hidden=true;return;}
    panel.dataset.word=t.word;panel.hidden=false;
    panel.innerHTML=`<div><span class="sys-kicker">这个词，是什么意思</span><strong>${esc(t.word)}</strong></div><p>${esc(t.meaning)}</p><p><b>比如：</b>${esc(t.example)}</p>${button('close-term','收起解释',id)}`;
    const paragraph=el.closest('p');if(paragraph)paragraph.insertAdjacentElement('afterend',panel);
    el.setAttribute('aria-expanded','true');
  } else if(action==='close-term') {
    const root=el.closest('.lesson-article');el.closest('[data-sys-definition]').hidden=true;
    const trigger=root?.querySelector('[data-sys-action="term"][aria-expanded="true"]');if(trigger){trigger.setAttribute('aria-expanded','false');trigger.focus();}
  } else if(action==='step') {
    const next=Math.max(0,Math.min(g.steps.length-1,Number(value)));steps.set(id,next);updateWalkthrough(id);
    document.querySelector(`[data-sys-walkthrough="${id}"] .sys-step-tabs [data-sys-value="${next}"]`)?.focus({preventScroll:true});
  } else if(action==='check'||action==='check-reset') {
    if(action==='check'&&!checks.has(id))checks.set(id,Number(value));else if(action==='check-reset')checks.delete(id);
    const root=document.querySelector(`[data-sys-check="${id}"]`);if(root){root.outerHTML=renderCheck({id});document.querySelector(`[data-sys-check="${id}"] .sys-check-answer`)?.setAttribute('tabindex','-1');document.querySelector(`[data-sys-check="${id}"] .sys-check-answer`)?.focus({preventScroll:true});}
  } else {
    const s=demoState(id);
    if(action==='bit')s.bits^=1<<Number(value);
    else if(action==='signed')s.signed=value==='yes';
    else if(action==='count'){s.wrapped=s.counter===15;s.counter=(s.counter+1)%16;}
    else if(action==='pointer')s.pointer=s.pointer===42?9:42;
    else if(action==='read')s.read=Math.min(6,s.read+1);
    else if(action==='lock'){s.locked=value==='yes';s.race=0;}
    else if(action==='race')s.race=Math.min(6,s.race+1);
    else if(action==='stack')s.stack=Math.min(4,s.stack+1);
    else if(action==='reset'){const locked=s.locked;demos.delete(id);if(labKind(id)==='race')demoState(id).locked=locked;}
    else return;
    const root=document.querySelector(`[data-sys-lab="${id}"]`);if(root){root.closest('.sys-lab').outerHTML=miniLab(id);const target=document.querySelector(`[data-sys-lab="${id}"] [data-sys-action="${action}"][data-sys-value="${value}"]:not(:disabled)`);target?.focus({preventScroll:true});}
  }
});
document.addEventListener('input',event=>{
  const el=event.target,id=el.dataset.sysId;if(!id)return;
  if(el.dataset.sysInput==='terms')document.querySelector(`[data-sys-glossary="${id}"]`).innerHTML=glossary(id,el.value);
  if(el.dataset.sysInput==='address') {
    demoState(id).address=Math.max(0,Math.min(15,Math.floor(Number(el.value)||0)));
    const lab=document.querySelector(`[data-sys-lab="${id}"]`),temp=document.createElement('div');temp.innerHTML=miniLab(id);
    // Preserve the slider node while dragging or using the keyboard.
    lab.querySelector('output').textContent=demoState(id).address;
    lab.querySelector('.sys-page-map').outerHTML=temp.querySelector('.sys-page-map').outerHTML;
    lab.querySelector('.sys-demo-feedback').innerHTML=temp.querySelector('.sys-demo-feedback').innerHTML;
  }
});
window.SystemsStudio={renderLesson,renderVisual,renderCheck,renderReference,toc,renderGuide,coverage:()=>({lessons:lessons.length,illustrated:lessons.filter(l=>l.beginner).length,perCourse:Object.fromEntries(window.COURSES.map(c=>[c.id,{lessons:c.chapters.flatMap(ch=>ch.lessons).length,illustrated:c.chapters.flatMap(ch=>ch.lessons).filter(l=>l.beginner).length}]))})};
})();
