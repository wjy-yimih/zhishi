/* Short default reading. Existing course IDs, quizzes and saved records stay intact. */
(() => {
  'use strict';
  const data=window.SIMPLE_LESSONS||{},opened=new Map();
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const inline=v=>esc(v).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  const prose=v=>String(v??'').split(/\n+/).filter(Boolean).map(s=>`<p>${inline(s)}</p>`).join('');
  const get=id=>data[id];
  const title=l=>data[l.id]?.title||l.title;
  const courseDescriptions={
    systems:'从程序怎么运行开始，学会数据表示、处理器、内存和网络。',
    ds:'理解数组、链表、树和图，再学查找、排序及算法效率。',
    discrete:'用具体例子理解逻辑、集合、关系、代数结构和图论。',
    probability:'从概率怎么算，学到用样本做估计、检验和预测。',
    em:'学清电场、磁场、电磁感应，以及公式怎么用、方向怎么判断。'
  };
  for(const c of window.COURSES){
    if(courseDescriptions[c.id])c.description=courseDescriptions[c.id];
    for(const ch of c.chapters)for(const l of ch.lessons){
      const d=data[l.id];if(!d)continue;
      l.simple=d;l.objective=d.intro;
      if(l.beginner)l.beginner.plainTitle=d.title;
    }
  }
  function detail(id,kind,label,body,initial=false){
    const key=id+':'+kind,open=opened.has(key)?opened.get(key):initial;
    return `<details class="brief-extra" id="brief-${kind}" data-brief-detail="${esc(key)}"${open?' open':''}><summary>${label}<span aria-hidden="true">＋</span></summary><div class="brief-extra-body">${body}</div></details>`;
  }
  document.addEventListener('toggle',event=>{
    const el=event.target;if(el?.dataset?.briefDetail&&el.isConnected)opened.set(el.dataset.briefDetail,el.open);
  },true);
  function full(l){
    const o=l.systemsOriginal||l;
    const symbols=l.course?.id==='em'?(window.EMStudio?.lessonAid(l,'intro')||'')+(window.EMStudio?.lessonAid(l,'formulas')||''):l.course?.id==='discrete'?window.MathStudio?.lessonSymbols(l.symbols)||'':l.course?.id==='probability'?window.ProbabilityStudio?.lessonSymbols(l.symbols)||'':'';
    return `<p class="brief-book-name">教材知识点：${esc(l.title)}</p>${symbols}${o.sections.map(s=>`<section><h3>${esc(s.title)}</h3>${prose(s.body)}</section>`).join('')}<section><h3>完整例题</h3><p>${inline(o.example.question)}</p><ol>${o.example.steps.map(s=>`<li>${inline(s)}</li>`).join('')}</ol><p>${inline(o.example.answer)}</p></section><section><h3>相关提醒</h3><ul>${o.mistakes.map(s=>`<li>${inline(s)}</li>`).join('')}</ul></section>${l.beginner?.terms?.length?`<section><h3>术语解释</h3><dl class="brief-terms">${l.beginner.terms.map(t=>`<dt>${esc(t.word)}</dt><dd>${esc(t.meaning)}<p>${esc(t.example)}</p></dd>`).join('')}</dl></section>`:''}`;
  }
  function render(l,ctx){
    const d=get(l.id),c=l.course,chapter=l.chapter.textbookNumber??l.chapterIndex+1;
    const rows=ctx.items,i=rows.findIndex(x=>x.id===l.id),prev=rows[i-1],next=rows[i+1];
    const visual=window.SystemsStudio?.renderVisual(l)||'';
    const code=l.code?(window.CodeTutor?.renderSnippet(l.code,l.id)||`<pre>${esc(l.code.source)}</pre>`):'';
    const note=ctx.notes[l.id]||'';
    return `<article class="brief-reader" data-brief-lesson="${esc(l.id)}"><header class="brief-header"><div class="lesson-breadcrumb"><a href="#/course/${c.id}">${esc(c.title)}</a><span>/</span><a href="#/course/${c.id}/chapter-${chapter}">第 ${chapter} 章</a></div><h1>${esc(d.title)}</h1><div class="brief-tools"><span>含练习约 ${l.minutes||15} 分钟${ctx.done?' · 已学过':''}</span><div><button class="icon-btn" data-action="font-smaller" aria-label="缩小正文">A−</button><button class="icon-btn" data-action="font-larger" aria-label="放大正文">A＋</button><button class="icon-btn ${ctx.bookmarked?'bookmarked':''}" data-action="bookmark" data-id="${l.id}" aria-label="${ctx.bookmarked?'取消收藏':'收藏本课'}" aria-pressed="${ctx.bookmarked}">${ctx.icon('bookmark')}</button></div></div></header><div class="brief-core" id="brief-core"><p class="brief-intro">${inline(d.intro)}</p><ul class="brief-points">${d.points.map(s=>`<li>${inline(s)}</li>`).join('')}</ul>${d.formula?`<div class="brief-formula"><p>${inline(d.formula.text)}</p><small>${inline(d.formula.note)}</small></div>`:''}<section class="brief-example" id="example"><h2>比如</h2><p class="brief-question">${inline(d.example.question)}</p><p>${inline(d.example.answer)}</p></section>${d.pitfall?`<p class="brief-pitfall"><strong>注意：</strong>${inline(d.pitfall)}</p>`:''}<p class="brief-remember">${inline(d.remember)}</p></div><div class="brief-extras">${visual?detail(l.id,'visual','看图或动手试试',visual):''}${code?detail(l.id,'code','代码及逐行解释',code):''}${detail(l.id,'full','完整讲解与推导',full(l))}${detail(l.id,'quiz','做一道自测',ctx.renderQuiz(l))}${detail(l.id,'notes','记笔记',`<label class="brief-note-label" for="lesson-note">我的笔记</label><textarea id="lesson-note" data-note-id="${l.id}" placeholder="记下要点或问题…">${esc(note)}</textarea><p class="note-hint" id="note-status">自动保存在当前浏览器，可导出备份。</p>`,Boolean(note))}</div><div class="brief-complete"><button class="btn ${ctx.done?'secondary':'primary'}" data-action="complete" data-id="${l.id}">${ctx.icon('check')}${ctx.done?'已学过 · 点击撤销':'标记为学过'}</button></div><nav class="brief-pagination" aria-label="相邻知识点">${prev?`<a href="#/lesson/${prev.id}"><small>← 上一篇</small>${esc(title(prev))}</a>`:'<span></span>'}${next?`<a href="#/lesson/${next.id}"><small>下一篇 →</small>${esc(title(next))}</a>`:`<a href="#/review/${c.id}"><small>本课程已到最后一篇</small>去自测 →</a>`}</nav></article>`;
  }
  const guidePoints={
    systems:['CPU 执行指令，内存暂放正在用的数据，硬盘长期保存文件。','程序先翻译、再运行；操作系统负责安排资源。','后面依次学习：数据表示 → 指令执行 → 内存 → 程序读写和通信。'],
    ds:['数据结构讲数据怎样存、怎样联系，以及怎样查找和修改。','先用几个数手算操作，想清楚后再读代码。','比较方法时，看时间、额外空间，以及它是否符合题目条件。'],
    discrete:['定义告诉你对象必须满足什么条件；举例和反例能帮助读懂它。','“所有”要求每个对象都满足；“存在”只需找到一个。量词顺序不能随便换。','先学逻辑和集合，再学关系、函数、代数结构和图。'],
    probability:['概率是按明确的试验规则，计算事件发生的可能性。条件改变，计算范围也可能改变。','分布描述一个随机量可能取什么值、各有多大机会；均值和方差概括它的位置与波动。','统计用样本推断总体。估计给出数或范围，检验判断数据是否与某个假设相容。'],
    em:['电场让电荷受力，磁场让运动电荷受力。先画方向，再代公式。','场强描述每一点的作用，通量合计穿过一个面的场，电势描述每单位电荷的势能。','每个公式都有条件：例如匀强场、足够对称、静电平衡。先确认题目是否满足。']
  };
  function guide(id,legacy){
    const c=window.COURSES.find(c=>c.id===id);if(!c)return legacy;
    const list=c.chapters.flatMap(ch=>ch.lessons);
    return `<div class="brief-guide"><h1>${esc(c.title)}，先看这几句</h1><ul>${guidePoints[id].map(s=>`<li>${esc(s)}</li>`).join('')}</ul><h2>从这里开始</h2><div class="brief-guide-links">${list.slice(0,6).map((l,i)=>`<a href="#/lesson/${l.id}"><span>${i+1}</span>${esc(title(l))}<b aria-hidden="true">→</b></a>`).join('')}</div><a class="btn secondary" href="#/course/${c.id}">全部知识点 →</a>${detail(id,'guide','更多基础说明',legacy)}</div>`;
  }
  window.SimpleReading=Object.freeze({get,title,render,guide,count:Object.keys(data).length});
})();
