/* Interactive native diagrams. Fixed teaching examples; no storage, network or code execution. */
(() => {
  'use strict';
  const states = new Map();
  const mappings = {};
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const map = (kind,ids)=>ids.split(' ').filter(Boolean).forEach(id=>{mappings[id]=kind;});
  map('array','ds-array-storage ds-sequential-edit ds-dynamic-array-growth sys-arrays');
  map('list','ds-sentinel-list ds-doubly-circular ds-list-reverse-merge');
  map('tree','ds-tree-terms-properties ds-tree-storage ds-tree-depth-traversals ds-tree-level-order ds-tree-reconstruction ds-threaded-tree dm-graph-rooted dm-graph-tree');
  map('logic','dm-proposition-connectives dm-implication dm-formula-truth-table dm-equivalence-models dm-inference-rules');
  map('relation','dm-binary-relation dm-relation-composition dm-reflexivity dm-symmetry dm-transitivity dm-relation-closures');
  map('clock','dm-binary-operation dm-operation-laws dm-identity-absorber dm-inverse-cancellation dm-algebraic-systems dm-group-definition dm-group-equations dm-generated-subgroup dm-cyclic-group');
  map('conditional','prob-events prob-conditional prob-conditional-discrete prob-joint-table prob-marginals prob-independence');
  map('density','prob-density prob-uniform-exponential prob-cdf');
  map('confidence','prob-random-sample prob-confidence-meaning prob-normal-mean-ci prob-sample-size');
  map('coulomb','em-coulomb em-field-definition em-field-point');
  map('flux','em-electric-flux em-magnetic-flux');
  map('lorentz','em-magnetic-b-definition em-magnetic-right-hand em-lorentz-force');
  map('induction','em-induction-flux-linkage em-induction-faraday-rate em-induction-lenz-direction');
  const defaults={
    array:()=>({index:0}),list:()=>({index:0}),tree:()=>({order:'pre',step:0}),
    logic:()=>({p:true,q:true}),relation:()=>({reflexive:false,symmetric:false,transitive:false}),
    clock:()=>({value:0,previous:0,delta:0}),conditional:()=>({blue:false}),density:()=>({width:1,half:false}),
    confidence:()=>({batch:0,n:25}),coulomb:()=>({distance:1,q:1}),flux:()=>({angle:0}),
    lorentz:()=>({q:1,v:1}),induction:()=>({change:1})
  };
  const getState = (id,kind)=>{if(!states.has(id))states.set(id,defaults[kind]());return states.get(id);};
  const num = (n,d=2)=>Number(n.toFixed(d)).toString();
  function text(x,y,value,cls='',anchor='middle'){return `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(value)}</text>`;}
  function arrow(uid,x1,y1,x2,y2,color='green',extra=''){return `<path d="M${x1} ${y1}L${x2} ${y2}" class="pp-line pp-${color}" marker-end="url(#${uid}-${color})" ${extra}/>`;}
  function svg(uid,body,label,height=200){return `<svg class="pp-svg" viewBox="0 0 360 ${height}" role="img" aria-label="${esc(label)}"><defs>${['green','orange','blue'].map(c=>`<marker id="${uid}-${c}" viewBox="0 0 8 8" markerWidth="6" markerHeight="6" refX="6" refY="4" orient="auto-start-reverse"><path d="M0 0L8 4L0 8Z" class="pp-fill-${c}"/></marker>`).join('')}</defs>${body}</svg>`;}
  function btn(action,value,label,pressed,disabled=false){return `<button type="button" class="pp-button" data-pp-action="${action}" data-pp-value="${esc(value)}"${typeof pressed==='boolean'?` aria-pressed="${pressed}"`:''}${disabled?' disabled':''}>${esc(label)}</button>`;}
  function shell({title,lead,picture,controls,result,note,source}){
    return `<div class="pp-heading"><span>动手看一眼</span><h3>${esc(title)}</h3><p>${esc(lead)}</p></div><div class="pp-picture">${picture}</div><div class="pp-controls" aria-label="改变图中的条件">${controls}</div><output class="pp-result" aria-live="polite" aria-atomic="true">${result}</output><p class="pp-note"><strong>这幅图的条件</strong> ${esc(note)}${source?` <a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a>`:''}</p>`;
  }
  const orders={pre:['A','B','D','E','C'],in:['D','B','E','A','C'],post:['D','E','B','C','A'],level:['A','B','C','D','E']};
  const orderNames={pre:'前序',in:'中序',post:'后序',level:'层序'};
  const persons=Array.from({length:10},(_,i)=>({id:i+1,blue:i<4,hat:[0,1,4,7].includes(i)}));
  const ciBatches=[[-.8,.5,1.3,-1.4,.2,2.3,-.4,.9,-2.1,.1],[-1.1,.2,.8,-.6,1.5,-1.9,.4,1.8,-.2,.1]];
  function relationEdges(s){
    const edges=new Set(['0,1','1,2']);let changed=true;
    while(changed){const old=edges.size;
      if(s.reflexive)for(let i=0;i<3;i++)edges.add(`${i},${i}`);
      if(s.symmetric)for(const e of [...edges]){const [a,b]=e.split(',');edges.add(`${b},${a}`);}
      if(s.transitive)for(let a=0;a<3;a++)for(let b=0;b<3;b++)for(let c=0;c<3;c++)if(edges.has(`${a},${b}`)&&edges.has(`${b},${c}`))edges.add(`${a},${c}`);
      changed=edges.size!==old;
    }return edges;
  }
  function relationProperties(edges){return {
    reflexive:[0,1,2].every(i=>edges.has(`${i},${i}`)),
    symmetric:[...edges].every(e=>{const [a,b]=e.split(',');return edges.has(`${b},${a}`);}),
    transitive:[0,1,2].every(a=>[0,1,2].every(b=>[0,1,2].every(c=>!edges.has(`${a},${b}`)||!edges.has(`${b},${c}`)||edges.has(`${a},${c}`))))
  };}
  const models={
    array(id,s,uid){
      const a=[6,2,9,4],address=1000+s.index*4;
      let pic='';for(let i=0;i<4;i++){const x=20+i*80;pic+=`<g class="${i===s.index?'pp-selected':''}"><rect x="${x}" y="48" width="68" height="62" rx="5" class="pp-cell"/>${text(x+34,30,`下标 ${i}`,'pp-small')}${text(x+34,87,a[i],'pp-value')}${text(x+34,135,1000+i*4,'pp-small')}</g>`;}
      pic+=text(180,163,'下方数字是每个元素的起始地址','pp-small');
      return shell({title:'点一个下标，看看它到底在哪里',lead:'这排四字节整数是 6、2、9、4。下标从 0 开始。',picture:svg(uid,pic,`数组下标${s.index}的值为${a[s.index]}，起始地址${address}`,180),controls:[0,1,2,3].map(i=>btn('array-index',i,`看下标 ${i}`,s.index===i)).join(''),result:`跨过 <strong>${s.index}</strong> 个元素 × 每个 4 字节。<br>地址：1000＋${s.index}×4＝<strong>${address}</strong>；该处的值是 <strong>${a[s.index]}</strong>。`,note:'地址 1000、每项四字节是本小例的假设。计算地址和读取该处的值是两件事；这里只允许访问四个合法下标。'});
    },
    list(id,s,uid){
      const a=[7,2,9],addresses=[1200,4800,2200];let pic='';
      for(let i=0;i<3;i++){const x=55+125*i;pic+=`<g class="${i===s.index?'pp-selected':''}"><rect x="${x-40}" y="43" width="80" height="82" rx="7" class="pp-cell"/><path d="M${x-40} 89H${x+40}" class="pp-divider"/>${text(x,75,a[i],'pp-value')}${text(x,112,i<2?`→ ${addresses[i+1]}`:'next＝空','pp-small')}${text(x,149,`地址 ${addresses[i]}`,'pp-small')}</g>`;if(i<2)pic+=arrow(uid,x+43,72,x+79,72);}
      pic+=arrow(uid,55+s.index*125,7,55+s.index*125,33,'orange');
      return shell({title:'沿箭头走，地址并没有按顺序排',lead:'上半格是数据，下半格记录下一节点地址。橙箭头指出当前节点。',picture:svg(uid,pic,`当前位于值为${a[s.index]}的节点，地址${addresses[s.index]}`,175),controls:btn('list-next','',s.index===2?'已到末尾':'沿 next 走一步',undefined,s.index===2)+btn('list-reset','','回到头节点'),result:`当前读到 <strong>${a[s.index]}</strong>，它在地址 <strong>${addresses[s.index]}</strong>。<br>${s.index<2?`下一步按记录跳到 <strong>${addresses[s.index+1]}</strong>，不是把当前地址简单加一。`:'next 为空，表示没有下一个数据节点。'}`,note:'这是不带头哨兵的三节点单链表；图上从左到右只为看清顺序，实际地址 1200→4800→2200 并不连续。'});
    },
    tree(id,s,uid){
      const positions={A:[180,32],B:[100,105],C:[270,105],D:[50,180],E:[150,180]},sequence=orders[s.order],current=sequence[s.step];let pic='';
      for(const [a,b] of [['A','B'],['A','C'],['B','D'],['B','E']]){const [x1,y1]=positions[a],[x2,y2]=positions[b];pic+=`<path d="M${x1} ${y1}L${x2} ${y2}" class="pp-tree-edge"/>`;}
      for(const [name,[x,y]] of Object.entries(positions)){const index=sequence.indexOf(name);pic+=`<g class="${name===current?'pp-selected':index<s.step?'pp-visited':''}"><circle cx="${x}" cy="${y}" r="20" class="pp-cell"/>${text(x,y+6,name,'pp-node-value')}</g>`;}
      return shell({title:'同一棵树，亲手切换读取顺序',lead:'A 的左孩子 B、右孩子 C；B 的左孩子 D、右孩子 E。',picture:svg(uid,pic,`${orderNames[s.order]}遍历，第${s.step+1}个访问${current}`,218),controls:Object.keys(orders).map(k=>btn('tree-order',k,orderNames[k],s.order===k)).join('')+btn('tree-next','','下一个节点',undefined,s.step===4)+btn('tree-reset','','从头看'),result:`${orderNames[s.order]}：${sequence.map((v,i)=>`<span class="pp-sequence ${i===s.step?'pp-current':''}">${v}</span>`).join(' → ')}<br>第 <strong>${s.step+1}</strong> 次正式访问的是 <strong>${current}</strong>。${s.order==='pre'?'根在左右子树之前。':s.order==='in'?'每棵子树先左边、再根、再右边。':s.order==='post'?'左右子树完成后再访问根。':'先读完较近的一层，再读下一层。'}`,note:'固定五节点有序二叉树，操作只改变访问次序，不改变父子连接。橙色是当前正式访问，浅色是已访问；不是机器执行的逐指令模拟。'});
    },
    logic(id,s,uid){
      const violation=s.p&&!s.q,ok=!violation;
      let pic=`<path d="M42 61C23 61 24 34 42 34C47 13 82 15 89 35C111 33 115 61 95 61Z" class="pp-cloud"/>`;
      if(s.p)for(const [x,y]of[[42,75],[64,80],[86,73],[53,100],[80,105]])pic+=`<path d="M${x} ${y}l-5 10" class="pp-rain"/>`;
      else pic+=`<circle cx="70" cy="86" r="15" class="pp-sun"/>`;
      pic+=text(69,151,s.p?'p：下雨':'p：没下雨','pp-medium');
      pic+=`<g transform="translate(213 35)"><circle cx="28" cy="40" r="14" class="pp-person-head"/><path d="M8 109V75Q28 55 48 75V109" class="pp-person-body"/>${s.q?'<path d="M-4 29Q28-9 60 29Z" class="pp-umbrella"/><path d="M28 28v50q0 13 10 7" class="pp-umbrella-stick"/>':''}</g>`;
      pic+=text(241,176,s.q?'q：带了伞':'q：没带伞','pp-medium');pic+=arrow(uid,121,91,192,91,violation?'orange':'green');
      return shell({title:'“如果下雨就带伞”，怎样才算违约？',lead:'p 表示下雨，q 表示带伞。试着切换两个事实，只检查这句承诺。',picture:svg(uid,pic,`下雨为${s.p?'真':'假'}，带伞为${s.q?'真':'假'}，p蕴含q为${ok?'真':'假'}`,200),controls:btn('logic-p','',s.p?'下雨：真（点此切换）':'下雨：假（点此切换）',s.p)+btn('logic-q','',s.q?'带伞：真（点此切换）':'带伞：假（点此切换）',s.q),result:`p → q 为 <strong>${ok?'真':'假'}</strong>。<br>${violation?'真的下雨，却没带伞：恰好违反承诺。':s.p?'下雨且带伞：没有违反承诺。':'没下雨时，这句承诺并未要求你必须怎样做，因此不能据此判违约。'}`,note:'这是经典命题逻辑的实质蕴含，不表达天气对带伞的因果关系，也不评价现实中的承诺礼貌。图只检查“p 真而 q 假”这一反例。'});
    },
    relation(id,s,uid){
      const edges=relationEdges(s),props=relationProperties(edges),pos=[[65,150],[180,60],[295,150]];let pic='';
      for(const e of edges){const [a,b]=e.split(',').map(Number),[x,y]=pos[a],[tx,ty]=pos[b],added=!['0,1','1,2'].includes(e),color=added?'orange':'green';
        if(a===b)pic+=`<path d="M${x-13} ${y-15}C${x-39} ${y-55} ${x+39} ${y-55} ${x+13} ${y-15}" class="pp-line pp-${color} ${added?'pp-added':''}" marker-end="url(#${uid}-${color})"/>`;
        else {const dx=tx-x,dy=ty-y,d=Math.hypot(dx,dy),sx=x+dx*23/d,sy=y+dy*23/d,ex=tx-dx*25/d,ey=ty-dy*25/d,curve=edges.has(`${b},${a}`)?18:0,cx=(x+tx)/2-dy*curve/d,cy=(y+ty)/2+dx*curve/d;pic+=`<path d="M${sx} ${sy}Q${cx} ${cy} ${ex} ${ey}" class="pp-line pp-${color} ${added?'pp-added':''}" marker-end="url(#${uid}-${color})"/>`;}}
      pos.forEach(([x,y],i)=>{pic+=`<circle cx="${x}" cy="${y}" r="20" class="pp-cell"/>${text(x,y+6,'ABC'[i],'pp-node-value')}`;});
      return shell({title:'补上规则逼出来的箭头',lead:'原关系只有 A→B、B→C。绿色保留原边，橙色虚线是补出的边；三种要求可以组合。',picture:svg(uid,pic,`三点关系现有${edges.size}条有向边，自反${props.reflexive?'满足':'不满足'}，对称${props.symmetric?'满足':'不满足'}，传递${props.transitive?'满足':'不满足'}`,210),controls:btn('relation-toggle','reflexive','要求自反',s.reflexive)+btn('relation-toggle','symmetric','要求对称',s.symmetric)+btn('relation-toggle','transitive','要求传递',s.transitive)+btn('relation-reset','','恢复原关系'),result:`现有 <strong>${edges.size}</strong> 条边。<br>自反：${props.reflexive?'✓ 满足':'尚不满足'}；对称：${props.symmetric?'✓ 满足':'尚不满足'}；传递：${props.transitive?'✓ 满足':'尚不满足'}。<br>${s.transitive?'A→B 与 B→C 已有，所以必须补 A→C。':'传递不是“看起来像有路”：两段关系存在时，还需直接关系。'}`,note:'有限集合 {A,B,C} 上的关系。每次从原边重新计算，对所选要求反复补边直到不再变化；这是满足这些要求的最小扩张，不删除任何原边。'});
    },
    clock(id,s,uid){
      let pic='<circle cx="180" cy="108" r="79" class="pp-clock-ring"/>';
      for(let i=0;i<5;i++){const a=-Math.PI/2+i*Math.PI*2/5,x=180+Math.cos(a)*79,y=108+Math.sin(a)*79;pic+=`<g class="${i===s.value?'pp-selected':''}"><circle cx="${x}" cy="${y}" r="18" class="pp-cell"/>${text(x,y+6,i,'pp-node-value')}</g>`;}
      const a=-Math.PI/2+s.value*Math.PI*2/5;pic+=arrow(uid,180,108,180+Math.cos(a)*52,108+Math.sin(a)*52,'orange')+'<circle cx="180" cy="108" r="6" class="pp-fill-orange"/>';
      return shell({title:'只走五个刻度：走完一圈就回到 0',lead:'这里的“加法”是先相加，再取除以 5 的余数。普通整数的 5 在此与 0 对应。',picture:svg(uid,pic,`模5钟面当前位于${s.value}`,212),controls:btn('clock-add',1,'＋1')+btn('clock-add',2,'＋2')+btn('clock-add',-1,'−1')+btn('clock-reset','','回到 0'),result:`${s.delta===0?'从 0 开始，按按钮沿刻度走。':`${s.previous}${s.delta>=0?'＋':'−'}${Math.abs(s.delta)}，按模 5 规则得到 <strong>${s.value}</strong>。`}<br>当前刻度 <strong>${s.value}</strong>；${s.value} 再加 0 仍是 ${s.value}。`,note:'固定集合 {0,1,2,3,4}，运算是模 5 加法。逆时针一步是加 −1 并换成非负余数，不是把模 5 的规则推广为所有算术。'});
    },
    conditional(id,s,uid){
      const chosen=persons.filter(p=>!s.blue||p.blue),hats=chosen.filter(p=>p.hat).length;let pic='';
      persons.forEach((p,i)=>{const x=40+(i%5)*70,y=35+Math.floor(i/5)*90,active=!s.blue||p.blue;pic+=`<g class="${active?'':'pp-faded'}"><circle cx="${x}" cy="${y}" r="9" class="pp-person-head"/><path d="M${x-14} ${y+35}V${y+17}Q${x} ${y+4} ${x+14} ${y+17}V${y+35}Z" class="${p.blue?'pp-blue-shirt':'pp-grey-shirt'}"/>${p.hat?`<path d="M${x-12} ${y-12}h24M${x-8} ${y-12}v-9h16v9" class="pp-hat"/>`:''}${text(x,y+55,p.id,'pp-small')}</g>`;});
      return shell({title:'条件变了，分母就跟着换了',lead:'固定 10 人：4 人穿蓝衣，其中 2 人戴帽。帽子是金色；先选定研究的那群人。',picture:svg(uid,pic,`当前${s.blue?'只看4位蓝衣者':'看全体10人'}，其中${hats}人戴帽`,195),controls:btn('conditional-group','all','看全体 10 人',!s.blue)+btn('conditional-group','blue','只看蓝衣 4 人',s.blue),result:`在当前 <strong>${chosen.length}</strong> 人中，戴帽者 <strong>${hats}</strong> 人。<br>${s.blue?'P（戴帽｜蓝衣）':'P（戴帽）'}＝${hats}÷${chosen.length}＝<strong>${num(hats/chosen.length)}</strong>。${s.blue?'灰掉的人已退出分母，不是又乘一次蓝衣概率。':''}`,note:'这是明示的固定人群，从当前选定人群中等可能抽一人。全体帽者为编号 1、2、5、8；蓝衣者为 1 至 4。例子只用于计数，不代表调查统计。'});
    },
    density(id,s,uid){
      const width=s.width,height=1/width,x=50,y=170,scaleX=110,scaleY=50,rectW=width*scaleX,rectH=height*scaleY;
      let pic=arrow(uid,40,170,330,170,'green')+arrow(uid,50,180,50,30,'green');
      pic+=`<rect x="${x}" y="${y-rectH}" width="${rectW}" height="${rectH}" class="pp-density"/>`;
      if(s.half)pic+=`<rect x="${x}" y="${y-rectH}" width="${rectW/2}" height="${rectH}" class="pp-density-half"/>`;
      pic+=text(50,193,'0','pp-small')+text(x+rectW,193,num(width),'pp-small')+text(32,y-rectH+5,num(height),'pp-small')+text(181,218,'横轴：取值　纵轴：概率密度','pp-small');
      return shell({title:'矩形变窄，为什么可以比 1 还高？',lead:'均匀分布在 0 到宽度 w 之间，每处密度相同。总概率是矩形面积，不是矩形高度。',picture:svg(uid,pic,`区间宽${width}，密度高${height}，面积为1${s.half?'，左半段面积为0.5':''}`,230),controls:[.5,1,2].map(w=>btn('density-width',w,`宽度 ${w}`,width===w)).join('')+btn('density-half','','突出左半段',s.half),result:`宽 <strong>${num(width)}</strong> × 高 <strong>${num(height)}</strong>＝总面积 <strong>1</strong>。<br>${s.half?`左半段宽 ${num(width/2)}，面积＝${num(width/2)}×${num(height)}＝<strong>0.5</strong>。`:height>1?'密度高度是 2，仍然合法；它不是某个单点的概率。':'按“区间内的面积”读取概率。'}`,note:'连续均匀分布 U(0,w)，w>0，区间外密度为零。密度可大于 1，单点概率仍为零；此图不把指数分布画成矩形。'});
    },
    confidence(id,s,uid){
      const mu=5,se=1/Math.sqrt(s.n),half=1.96*se,zs=ciBatches[s.batch],axis=v=>50+(v-4)*140;let pic=`<path d="M${axis(mu)} 17V226" class="pp-true-value"/>`,covered=0;
      zs.forEach((z,i)=>{const mean=mu+z*se,lo=mean-half,hi=mean+half,y=28+i*19,hit=lo<=mu&&hi>=mu;if(hit)covered++;pic+=text(25,y+4,i+1,'pp-mini')+`<path d="M${axis(lo)} ${y}H${axis(hi)} M${axis(lo)} ${y-4}V${y+4} M${axis(hi)} ${y-4}V${y+4}" class="pp-ci-line ${hit?'pp-green':'pp-orange'}"/><circle cx="${axis(mean)}" cy="${y}" r="3" class="pp-fill-${hit?'green':'orange'}"/>`;});
      pic+=`<path d="M50 232H330" class="pp-divider"/>`+[4,5,6].map(v=>text(axis(v),249,v,'pp-small')).join('');
      return shell({title:'真值不动，换来换去的是区间',lead:'竖虚线固定在总体均值 μ＝5；每一条横线来自另一份样本。橙线未盖住真值。',picture:svg(uid,pic,`固定真均值5，当前十条95%区间有${covered}条覆盖真值，每份样本量${s.n}`,262),controls:btn('confidence-batch','','换一组示意样本')+[25,100].map(n=>btn('confidence-n',n,`每份 n＝${n}`,s.n===n)).join(''),result:`本批有 <strong>${covered}/10</strong> 条盖住真值。每条区间＝样本均值 ± <strong>${num(half,3)}</strong>。<br>95% 说的是满足模型条件后，这种造区间的方法长期覆盖率约 95%，并不要求每十条恰有 9.5 条成功。`,note:'正态总体、已知总体标准差 σ＝1，用 Z 区间 x̄±1.96σ/√n。横线来自两组预设的标准化样本均值，仅作示意而非现场随机模拟。增大 n 保持同组标准化偏离，故本批命中数可能不变。',source:{title:'NIST：区间含义与公式',url:'https://www.itl.nist.gov/div898/handbook/prc/section1/prc14.htm'}});
    },
    coulomb(id,s,uid){
      const r=s.distance,x1=60,x2=60+85*r,len=35/(r*r),repel=s.q===1,sign1=repel?-1:1,sign2=-sign1;
      let pic=arrow(uid,x1,50,x1+sign1*len,50,'orange')+arrow(uid,x2,50,x2+sign2*len,50,'orange');
      pic+=`<path d="M${x1} 58V84M${x2} 58V84" class="pp-projection"/><circle cx="${x1}" cy="110" r="22" class="pp-charge-positive"/><circle cx="${x2}" cy="110" r="22" class="${s.q===1?'pp-charge-positive':'pp-charge-negative'}"/>${text(x1,117,'＋','pp-charge-sign')}${text(x2,117,s.q===1?'＋':'−','pp-charge-sign')}<path d="M${x1} 148v14M${x1} 155H${x2}M${x2} 148v14" class="pp-divider"/>${text((x1+x2)/2,181,`距离 r＝${r}`,'pp-small')}`;
      return shell({title:'改一个正负号，再把距离拉远',lead:'左边固定为正电荷，右边可以切换正负。上方橙箭头分别表示各自受到的电力。',picture:svg(uid,pic,`距离${r}，两电荷${repel?'同号相斥':'异号相吸'}，力大小相对r等于1时为${num(1/(r*r),3)}`,200),controls:btn('coulomb-sign',1,'右边是正电荷',s.q===1)+btn('coulomb-sign',-1,'右边是负电荷',s.q===-1)+[1,2,3].map(d=>btn('coulomb-distance',d,`距离 ${d}`,r===d)).join(''),result:`${repel?'同号，彼此推开。':'异号，彼此吸引。'} 两边受力<strong>大小相等，方向相反</strong>。<br>电荷量不变时，F/F₁＝1/r²＝<strong>${num(1/(r*r),3)}</strong>。${r===2?'距离两倍，力是四分之一。':r===3?'距离三倍，力是九分之一。':''}`,note:'静止点电荷、真空或同一均匀介质、两电荷量绝对值固定相同。r 与 F 以第一档作相对单位；箭头长度也按 1/r² 缩放，未混入万有引力。'});
    },
    flux(id,s,uid){
      const a=s.angle,rad=a*Math.PI/180,c=Math.abs(Math.cos(rad))<1e-12?0:Math.cos(rad);let pic='';
      for(const y of [50,100,150])pic+=arrow(uid,20,y,338,y,'blue');
      pic+=`<g transform="rotate(${-a} 180 100)"><rect x="172" y="35" width="16" height="130" rx="2" class="pp-surface"/>${arrow(uid,180,100,250,100,'orange')}</g>`;
      if(a>0)pic+=`<path d="M210 100A30 30 0 0 0 ${180+30*Math.cos(rad)} ${100-30*Math.sin(rad)}" class="pp-angle"/>`;
      pic+=text(180+82*Math.cos(rad),100-82*Math.sin(rad),'n','pp-medium')+text(297,29,'均匀场 →','pp-small')+text(180,188,`θ＝${a}°：场与法线的夹角`,'pp-small');
      return shell({title:'转动一扇有朝向的窗',lead:'蓝箭头为均匀场，绿色窄片代表平面，橙箭头 n 是面法线。θ 从法线量起。',picture:svg(uid,pic,`面法线与场夹角${a}度，归一化通量为${num(c,3)}`,210),controls:[0,30,60,90].map(d=>btn('flux-angle',d,`${d}°`,a===d)).join(''),result:`通量＝场强 × 面积 × cosθ。令场强×面积＝1，则通量为 <strong>${num(c,3)}</strong>。<br>${a===0?'法线顺着场：面正对箭头，通量最大。':a===90?'法线垂直场：箭头沿着面走，通量为零，但场本身并未消失。':'转动面以后，穿面的有效投影面积减小。'}`,note:'均匀静态场穿过一个平面，面积不变；θ 是场和法线夹角，不是场和面本身的夹角。电通量与磁通量形式相似但单位和场量不同；此图不是封闭面高斯定理。',source:{title:'OpenStax：磁通定义',url:'https://openstax.org/books/university-physics-volume-2/pages/13-1-faradays-law'}});
    },
    lorentz(id,s,uid){
      const force=s.q*s.v,up=force===1;let pic='';for(const [x,y]of[[50,45],[310,45],[50,175],[310,175]])pic+=`<path d="M${x-7} ${y-7}l14 14M${x-7} ${y+7}l14-14" class="pp-field-cross"/>`;
      pic+=arrow(uid,180+s.v*26,110,180+s.v*100,110,'blue')+arrow(uid,180,110+(up?-26:26),180,up?23:197,'orange');
      pic+=`<circle cx="180" cy="110" r="21" class="${s.q===1?'pp-charge-positive':'pp-charge-negative'}"/>${text(180,117,s.q===1?'＋':'−','pp-charge-sign')}${text(180+s.v*103,98,'v','pp-medium')}${text(203,up?30:197,'F','pp-medium')}${text(180,229,'× 表示 B 垂直屏幕向里','pp-small')}`;
      return shell({title:'先看 v×B，再检查电荷正负',lead:'磁场始终向屏幕里。蓝箭头是速度 v，橙箭头是这一个电荷受到的磁力 F。',picture:svg(uid,pic,`${s.q===1?'正':'负'}电荷向${s.v===1?'右':'左'}运动，磁场向里，磁力向${up?'上':'下'}`,245),controls:btn('lorentz-q',1,'正电荷',s.q===1)+btn('lorentz-q',-1,'负电荷',s.q===-1)+btn('lorentz-v',1,'速度向右',s.v===1)+btn('lorentz-v',-1,'速度向左',s.v===-1),result:`当前磁力向<strong>${up?'上':'下'}</strong>。<br>F＝q(v×B)：速度反向，力反向；电荷由正改负，力也反向。两项同时反向，力方向保持。`,note:'只画某一瞬间、只有匀强磁场、速度与 B 垂直。磁力始终垂直速度，不在这个理想模型中改变速率；后续轨迹需要随速度更新方向。'});
    },
    induction(id,s,uid){
      let pic='<circle cx="180" cy="109" r="59" class="pp-coil"/>';
      for(const [x,y]of[[159,88],[201,88],[159,130],[201,130]])pic+=`<circle cx="${x}" cy="${y}" r="7" class="pp-b-dot-ring"/><circle cx="${x}" cy="${y}" r="2.5" class="pp-fill-blue"/>`;
      if(s.change!==0){const direction=s.change===1?1:-1,points=[];for(let i=0;i<=36;i++){const a=-Math.PI/2+direction*(Math.PI*1.65)*(i/36);points.push(`${180+70*Math.cos(a)} ${109+70*Math.sin(a)}`);}pic+=`<path d="M${points.join('L')}" class="pp-current-arrow" marker-end="url(#${uid}-orange)"/>`;}
      pic+=text(180,211,s.change===1?'向外磁通正在增大':s.change===-1?'向外磁通正在减小':'向外磁通保持不变','pp-medium');
      return shell({title:'楞次定律反对的是变化',lead:'小圆点表示外磁场向屏幕外。保持回路面积与方向不变，只改变外磁场的强弱趋势。',picture:svg(uid,pic,`外磁通向外且${s.change===1?'增加，感应电流顺时针':s.change===-1?'减少，感应电流逆时针':'恒定，本模型感应电动势为零'}`,230),controls:btn('induction-change',1,'向外磁通增大',s.change===1)+btn('induction-change',-1,'向外磁通减小',s.change===-1)+btn('induction-change',0,'磁通保持不变',s.change===0),result:s.change===1?'外磁通向外增加，感应作用要抵抗增加：产生<strong>向里</strong>的感应磁场，因此感应电流<strong>顺时针</strong>。':s.change===-1?'外磁通向外减少，感应作用要抵抗减少：产生<strong>向外</strong>的感应磁场，因此感应电流<strong>逆时针</strong>。':'磁通不变，所以本图的<strong>法拉第感应电动势为零</strong>。外磁场仍然可以很强，不能据此说没有磁场。',note:'闭合电阻回路，忽略自感及其他电源；以当前视角判断顺逆时针，逆时针的法线向屏幕外。只展示缓慢变化时的感应趋势；磁通恒定不排除其他电源或初始储能产生的电流。',source:{title:'OpenStax：楞次定律',url:'https://openstax.org/books/university-physics-volume-2/pages/13-2-lenzs-law'}});
    }
  };
  function render(id){const kind=mappings[id];if(!kind)return '';return `<section class="pp-model" data-pp-id="${esc(id)}" data-pp-kind="${kind}" aria-label="可交互的具体图像">${models[kind](id,getState(id,kind),`pp-${id}`)}</section>`;}
  document.addEventListener('click',e=>{
    const control=e.target.closest?.('[data-pp-action]');if(!control||control.disabled)return;
    const root=control.closest('.pp-model');if(!root)return;
    const id=root.dataset.ppId,kind=mappings[id];if(!kind)return;
    const s=getState(id,kind),action=control.dataset.ppAction,value=control.dataset.ppValue;
    let changed=true;
    switch(action){
      case'array-index':if([0,1,2,3].includes(+value))s.index=+value;break;
      case'list-next':s.index=Math.min(2,s.index+1);break;
      case'list-reset':s.index=0;break;
      case'tree-order':if(orders[value]){s.order=value;s.step=0;}break;
      case'tree-next':s.step=Math.min(4,s.step+1);break;
      case'tree-reset':s.step=0;break;
      case'logic-p':s.p=!s.p;break;
      case'logic-q':s.q=!s.q;break;
      case'relation-toggle':if(['reflexive','symmetric','transitive'].includes(value))s[value]=!s[value];break;
      case'relation-reset':Object.assign(s,defaults.relation());break;
      case'clock-add':if([-1,1,2].includes(+value)){s.previous=s.value;s.delta=+value;s.value=((s.value+s.delta)%5+5)%5;}break;
      case'clock-reset':Object.assign(s,defaults.clock());break;
      case'conditional-group':s.blue=value==='blue';break;
      case'density-width':if([.5,1,2].includes(+value))s.width=+value;break;
      case'density-half':s.half=!s.half;break;
      case'confidence-batch':s.batch=(s.batch+1)%ciBatches.length;break;
      case'confidence-n':if([25,100].includes(+value))s.n=+value;break;
      case'coulomb-sign':if([-1,1].includes(+value))s.q=+value;break;
      case'coulomb-distance':if([1,2,3].includes(+value))s.distance=+value;break;
      case'flux-angle':if([0,30,60,90].includes(+value))s.angle=+value;break;
      case'lorentz-q':if([-1,1].includes(+value))s.q=+value;break;
      case'lorentz-v':if([-1,1].includes(+value))s.v=+value;break;
      case'induction-change':if([-1,0,1].includes(+value))s.change=+value;break;
      default:changed=false;
    }
    if(!changed)return;
    const hadFocus=document.activeElement===control;
    root.innerHTML=models[kind](id,s,`pp-${id}`);
    if(hadFocus){const replacement=[...root.querySelectorAll('[data-pp-action]')].find(b=>b.dataset.ppAction===action&&b.dataset.ppValue===value&&!b.disabled);if(replacement)replacement.focus({preventScroll:true});else root.querySelector('button:not(:disabled)')?.focus({preventScroll:true});}
  });
  window.PlainPictures=Object.freeze({render,supportedIds:Object.freeze(Object.keys(mappings)),count:Object.keys(models).length,supportedCount:Object.keys(mappings).length});
})();
