(() => {
'use strict';
const chapters=[...(window.DISCRETE_CHAPTERS||[])].sort((a,b)=>a.order-b.order);
window.COURSES.push({id:'discrete',title:'离散数学',en:'Discrete Mathematics',icon:'discrete',color:'#9c8ba9',
subtitle:'张清华主编 · 从具体例子走进抽象结构',edition:'张清华主编 / 机械工业出版社《离散数学》',
description:'按你提供的七章、37个小节组织原创伴读。从一句话、一组对象、一次操作和一张连接图出发，先解释概念在解决什么问题，再拆开符号、推导条件、找反例。每篇配逐步例题、具体误区与自测；抽象处可回到符号与证明入门，或用交互实验验证小例子。',
chapters,sources:[
{title:'MIT · Mathematics for Computer Science（逻辑、证明、集合、关系与图）',url:'https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-spring-2015/'},
{title:'Cornell · 量词推理与变量的新名条件',url:'https://www.cs.cornell.edu/courses/cs312/2008sp/lectures/logic.html'},
{title:'University of Puget Sound · Abstract Algebra: Theory and Applications',url:'https://abstract.ups.edu/'},
{title:'University of South Carolina · Hamiltonian and Eulerian Graphs',url:'https://people.math.sc.edu/sumner/math575spring2009/handouts/HamiltonianandEulerianGraphs.pdf'}
],routes:[
{title:'先把数学语言读懂',description:'先到“符号与证明”逐字读一句公式，再读命题、量词和推理。一次只改变一个条件，主动寻找反例。',chapterNumbers:[1,2]},
{title:'给对象分类，给关系定规则',description:'从集合到关系、函数，把定义改写成“对谁检查、检查什么、怎样失败”。用小集合先算一遍。',chapterNumbers:[3,4]},
{title:'抽象代数：先操作，再看结构',description:'先看集合里有什么、运算如何做，再谈群、陪集、商群和同态。拿模运算和几何对称来回对照。',chapterNumbers:[5,6]},
{title:'在图里练习证明',description:'用握手、唯一通路、进出配对与面边界计数，理解图论结论的来由。再和数据结构中的遍历、生成树对照。',chapterNumbers:[7]}
]});
})();
