(() => {
'use strict';
const chapters=[...(window.EM_CHAPTERS||[])].sort((a,b)=>a.order-b.order);
window.COURSES.push({
 id:'em',title:'大学物理 · 电磁学',en:'Electromagnetism',icon:'orbit',color:'#7c99a6',
 subtitle:'《物理学》第七版上册 / 第5—8章',
 edition:'按你提供的《物理学》第七版上册第5—8章目录编排 · 保留原章号及30个教材小节',
 description:'从“空间里的每一点怎样影响电荷”开始，依次理解静电场、导体与电介质、恒定磁场、电磁感应与麦克斯韦方程。先画对象和方向，再把公式读成中文、核对条件与单位；用原创逐步例题、易错反例和自测检查理解。带星号的拓展内容也有伴读，前置知识在课内注明。',
 chapters,
 sources:[
  {title:'OpenStax · 电场的定义与叠加',url:'https://openstax.org/books/university-physics-volume-2/pages/5-4-electric-field'},
  {title:'OpenStax · 高斯定理与对称性',url:'https://openstax.org/books/university-physics-volume-2/pages/6-3-applying-gausss-law'},
  {title:'OpenStax · 电介质与电容器',url:'https://openstax.org/books/university-physics-volume-2/pages/8-4-capacitor-with-a-dielectric'},
  {title:'OpenStax · RC充放电',url:'https://openstax.org/books/university-physics-volume-2/pages/10-5-rc-circuits'},
  {title:'OpenStax · 带电粒子的磁场运动',url:'https://openstax.org/books/university-physics-volume-2/pages/11-3-motion-of-a-charged-particle-in-a-magnetic-field'},
  {title:'OpenStax · 安培环路定理',url:'https://openstax.org/books/university-physics-volume-2/pages/12-5-amperes-law'},
  {title:'OpenStax · 法拉第定律',url:'https://openstax.org/books/university-physics-volume-2/pages/13-1-faradays-law'},
  {title:'OpenStax · 磁场能量',url:'https://openstax.org/books/university-physics-volume-2/pages/14-3-energy-in-a-magnetic-field'},
  {title:'Microchip · 电容触摸的自电容与互电容',url:'https://onlinedocs.microchip.com/oxy/GUID-7EC2A1B7-D9CD-4812-9F14-AE4A958E4C2F-en-US-8/GUID-2DE8250A-F32E-45BC-8AC7-0E5F4A752865.html'},
  {title:'费曼讲义 · 进阶：感应与电子感应加速器',url:'https://www.feynmanlectures.caltech.edu/II_17.html'},
  {title:'OpenStax · 麦克斯韦方程与电磁波',url:'https://openstax.org/books/university-physics-volume-2/pages/16-1-maxwells-equations-and-electromagnetic-waves'}
 ],
 routes:[
  {title:'从零开始：先读懂场和方向',description:'先打开“电磁入门”，把矢量、点乘、叉乘、通量与环流读成中文。先分清E和力、V和势能，再学习静电场定律。',chapterNumbers:[5]},
  {title:'把物质放进电场',description:'分别问自由电荷怎样移动、束缚电荷怎样极化。比较断开电源与保持连接，明确谁给系统提供能量。',chapterNumbers:[6]},
  {title:'先看电流，再判断磁力',description:'画电流方向和回路方向，区分B与H。用右手规则先做正电荷判断，再处理电子与能量来源。',chapterNumbers:[7]},
  {title:'从“有磁场”走向“磁通在变”',description:'先选法线与正向，再写磁通随时间怎样变化。由动生和感生走向自感、RL、位移电流和四条场方程。',chapterNumbers:[8]}
 ]
});
})();
