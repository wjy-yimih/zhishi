(() => {
'use strict';
const chapters=[...(window.PROB_CHAPTERS||[])].sort((a,b)=>a.order-b.order);
window.COURSES.push({id:'probability',title:'概率论与数理统计',en:'Probability & Statistics',icon:'chart',color:'#b29762',
subtitle:'盛骤 · 谢式千 · 潘承毅 / 第五版',edition:'浙江大学 盛骤、谢式千、潘承毅 编 / 高等教育出版社《概率论与数理统计》第五版',
description:'按你提供的第五版完整十五章、65个小节组织原创伴读。从“筛选后重新算占比”理解条件概率，从“重复抽样时怎样变动”理解统计推断；先讲例子与直觉，再逐个拆符号、推公式、找反例。基础概率、统计推断、bootstrap、R、随机过程与时间序列都可按教材对照学习。带星内容标为进阶，先修要求写在每课开头。',
chapters,sources:[
{title:'MIT · Introduction to Probability and Statistics',url:'https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/'},
{title:'NIST · 统计方法公开手册',url:'https://www.itl.nist.gov/div898/handbook/'},
{title:'NIST · 均值置信区间及其频率含义',url:'https://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm'},
{title:'R Project · 官方手册',url:'https://cran.r-project.org/manuals.html'},
{title:'Penn State · 时间序列公开课程',url:'https://online.stat.psu.edu/stat510/'}
],routes:[
{title:'从零开始：先把概率读成人话',description:'先看“概率入门”，弄清每个概率是在谁里面数谁。由事件到变量，再到分布和数字特征，一次只换一层视角。',chapterNumbers:[1,2,3,4]},
{title:'从总体走向样本，再走回来',description:'用重复抽样理解大数定律、中心极限定理、抽样分布、估计和检验。先写参数是什么、什么在随机变化，再选择公式。',chapterNumbers:[5,6,7,8]},
{title:'数据分析：比较、解释和重抽样',description:'先看实验设计和模型条件，再看方差分析、回归与bootstrap。R 示例可逐行点读，网页不执行R。',chapterNumbers:[9,10,11]},
{title:'把一个随机数扩成一条随机轨道',description:'随机过程、马尔可夫链、平稳过程与时间序列依次展开。先分清轨道与时间切片，再讨论转移、相关和预测。',chapterNumbers:[12,13,14,15]}
]});
})();
