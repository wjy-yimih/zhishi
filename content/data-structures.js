(() => {
  const modules = [...(window.DS_CHAPTERS || [])].sort((a,b)=>a.order-b.order);
  const mod = n => modules.find(m=>m.order===n)?.lessons || [];
  const recursive = l => /递归|回溯/.test(l.title);
  const searchTree = l => /搜索树|排序树|AVL|红黑|B\+|B 树|B树/.test(l.title);
  const union = l => /并查集/.test(l.title);
  const selection = l => /选型|选择数据结构|结构选择/.test(l.title);
  const linearComposite = l => /链表|线性表|有序表/.test(l.title);
  const groups = [
    ['ds-introduction','绪论',[...mod(1),...mod(12).filter(selection)]],
    ['ds-linear','线性表',[...mod(2),...mod(12).filter(linearComposite)]],
    ['ds-stack-queue','栈和队列',[...mod(3),...mod(5).filter(recursive)]],
    ['ds-strings-arrays','串、数组和广义表',[...mod(4),...mod(5).filter(l=>!recursive(l))]],
    ['ds-trees','树和二叉树',[...mod(6),...mod(7).filter(l=>!searchTree(l))]],
    ['ds-graphs','图',[...mod(8),...mod(9),...mod(12).filter(union)]],
    ['ds-search','查找',[...mod(10),...mod(7).filter(searchTree)]],
    ['ds-sorting','排序',[...mod(11),...mod(12).filter(l=>!union(l)&&!selection(l)&&!linearComposite(l))]]
  ];
  window.COURSES.push({
    id:'ds',title:'数据结构',en:'Data Structures',icon:'network',color:'#8c9b64',
    subtitle:'《数据结构（C语言版）》第2版 · 从直觉到代码',
    description:'按你提供的人民邮电出版社《数据结构（C语言版）》第2版的八章主题组织原创伴读。先用日常语言解释问题，再展开定义、一步步例题和自测；关键 C 示例支持逐行中文点读，零基础可先从“代码入门”开始。平衡树、外部排序等内容按核心概念或拓展介绍，结合教材原文与习题使用。',
    edition:'严蔚敏 · 李冬梅 · 吴伟民 / 人民邮电出版社',
    chapters:groups.map(([id,title,lessons])=>({id,title,lessons})),
    sources:[
      {title:'人民邮电出版社 · 人邮教育数据结构教材',url:'https://www.ryjiaoyu.com/wlsz/2020jsjhxk-wlsz'},
      {title:'OpenDSA · Huffman 与树结构',url:'https://opendsa-server.cs.vt.edu/ODSA/Books/Catalog/html/Huffman.html'},
      {title:'Princeton Algorithms · 算法公开教材',url:'https://algs4.cs.princeton.edu/home/'},
      {title:'MIT 6.006 · Introduction to Algorithms',url:'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/'},
      {title:'OpenDSA · KMP 字符串匹配',url:'https://opendsa-server.cs.vt.edu/ODSA/StandaloneModules/20190805145934/html/StringSearchKMP.html'},
      {title:'LAPACK · 矩阵压缩存储（原文采用按列约定）',url:'https://www.netlib.org/lapack/lug/node123.html'},
      {title:'OpenDSA · 一般树',url:'https://opendsax.cs.vt.edu/OpenDSA/Books/CS3/html/GenTreeIntro.html'},
      {title:'OpenDSA · 外部排序',url:'https://opendsa-server.cs.vt.edu/ODSA/Books/mcc/cs113/spring-2026/Online_1/html/ExternalSort.html'}
    ],
    routes:[
      {title:'零基础：先画图，再读代码',description:'先打开“代码入门”，再从线性表、栈队列开始。每次只看一段中文思路，自己画出元素或指针怎样改变。',chapterNumbers:[1,2,3]},
      {title:'把结构连起来',description:'从串和数组走向树与图；每次先标清元素、关系和操作，再手动走一遍。',chapterNumbers:[4,5,6]},
      {title:'把算法的条件说清楚',description:'比较查找与排序：数据是否有序、是否允许额外空间、需不需要稳定性，这些条件共同决定选择。',chapterNumbers:[7,8]},
      {title:'按教材顺读',description:'沿教材八章主题检查理解。本站将相近小节合并成伴读，并提供部分拓展；具体小节编号以你手里的教材目录为准。',chapterNumbers:[1,2,3,4,5,6,7,8]}
    ]
  });
})();
