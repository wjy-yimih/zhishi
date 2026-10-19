/* Offline, authored C reading guides. No compiler, eval, or arbitrary-code execution. */
(() => {
  'use strict';

  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const blocks = new Map();
  const blockIds = new Map();
  const tracePositions = Object.create(null);
  let blockCounter = 0;
  let dictionaryQuery = '';

  function example(rows, explanation) {
    return { language: 'C11 完整示例', source: rows.map(row => row[0]).join('\n'), explanation, lines: rows.map((row, i) => ({ line: i + 1, text: row[1] })) };
  }
  const frame = (line, text, values = [], output = '', pointer = null) => ({ line, text, values, output, pointer });
  const variable = (name, value, note) => ({ name, value, note });

  const topics = {
    variables: {
      title: '变量、赋值与 printf', short: '变量与输出',
      goal: '看懂“先取旧值算一算，再把结果存回去”，并分清计算和显示。',
      paragraphs: ['把变量先想成有名字的小格子。int count = 2; 建立一个存整数的对象，名字是 count，初值为 2。以后读到 count，通常就是读取这个对象当前保存的值。', 'count = count + 3; 先读取右边的旧值 2，算出 5，再把 5 存回左边。这里的 = 是赋值，不是数学上的“左右永远相等”。printf 才负责把指定内容显示出来；单纯赋值不会自动打印。'],
      caution: '分号 ; 通常结束一条语句。printf 的 "%d\\n" 中，%d 表示显示一个 int，\\n 表示换行；引号本身不会显示。return 0; 是向运行环境报告正常结束，不是在屏幕上打印 0。',
      code: example([
        ['#include <stdio.h>', '引入标准输入输出声明，让下面可以正确调用 printf。此行在编译前处理，不是运行时先执行一次。'],
        ['int main(void) {', '程序从 main 函数进入。int 表示它返回整数；(void) 表示这里不接收参数；{ 开始函数体。'],
        ['  int count = 2;', '创建整数变量 count，并给它初值 2。'],
        ['  count = count + 3;', '先读取旧 count=2，计算 2+3，再把结果 5 存回 count。'],
        ['  printf("%d\\n", count);', '按 %d 的要求显示 count 的整数值 5，然后换行。'],
        ['  return 0;', '结束 main，并返回状态码 0；这句不向屏幕输出文字。'],
        ['}', '函数体结束。大括号成对出现，把属于这个函数的语句包起来。']
      ], '固定示例不接收输入。所有整数都很小，不涉及溢出；这里讨论普通 int 变量。'),
      trace: [
        frame(null, '进入固定示例前，count 还没有建立；输出区为空。'),
        frame(3, '创建 count，并初始化为 2。', [variable('count', '2', '刚得到初值')]),
        frame(4, '右边先算 2+3，再把 5 存回 count。', [variable('count', '5', '旧值 2 已被覆盖')]),
        frame(5, 'printf 读取 count；变量不变，输出区增加一行 5。', [variable('count', '5', '显示数值不会改掉它')], '5\n'),
        frame(6, 'main 返回 0，程序正常结束。输出没有再多出一个 0。', [variable('count', '5（结束前）', '函数结束后局部对象的生命周期结束')], '5\n')
      ]
    },
    conditions: {
      title: 'if 条件：= 和 == 完全不同', short: 'if 与条件',
      goal: '把“满足条件就做 A，否则做 B”翻译为清楚的分支。',
      paragraphs: ['if 后面的括号放条件。对这里的整数条件而言，0 代表假，非 0 代表真。score >= 60 的结果是真，于是进入第一个大括号；else 后面的语句会跳过，两个分支不会都执行。', 'score = 60 是把 60 写进 score；score == 60 是比较当前值是否等于 60。C 允许把某些赋值表达式写在条件里，所以写错一个等号可能仍能编译，却改变了程序。初学时请把“更新”和“比较”分开写。'],
      caution: '比较结果通常用 0 或 1 表示。&& 是“并且”，|| 是“或者”；单个 & 是另一回事。这里固定 score=70，输出只会是 pass。',
      result: 'pass\n',
      code: example([
        ['#include <stdio.h>', '准备 printf 的函数声明。'],
        ['int main(void) {', '从 main 开始执行这个固定示例。'],
        ['  int score = 70;', '把整数 70 存入 score。'],
        ['  if (score >= 60) {', '判断 70 是否大于或等于 60：成立，所以进入这个分支。'],
        ['    printf("pass\\n");', '显示 pass 并换行；本示例会执行这一句。'],
        ['  } else {', '否则进入另一个分支；因为上面的条件成立，本例会跳过它。'],
        ['    printf("retry\\n");', '只有条件不成立时才显示 retry；本例不会执行此行。'],
        ['  }', '整个 if/else 分支结束，后面的语句恢复共同执行。'],
        ['  return 0;', '正常结束程序。'],
        ['}', 'main 的函数体结束。']
      ], '固定分数为 70。要判断相等用 ==；本例的 >= 表示“大于或等于”。')
    },
    loops: {
      title: 'for 与 i++：循环不是把每行读一遍', short: 'for 循环',
      goal: '按“初始化一次 → 判断 → 循环体 → 更新 → 再判断”追踪每一轮。',
      paragraphs: ['for (int i = 0; i < 3; i++) 的三个区域分别是起点、继续条件和每轮结束后的更新。i 从 0 开始，只有条件成立才进入循环体；因此本例循环体里见到的 i 依次为 0、1、2。', 'i++ 单独用在这里，表示把 i 增加 1。sum = sum + i 每轮读取当前 sum 和 i，再把新结果存回 sum。最后一次更新让 i 变为 3，条件 3<3 为假，循环停止；不会再把 3 加进去。'],
      caution: 'for 中声明的 i 只在这个 for 的作用域内可用，循环结束后不能在外面直接读取它。下面“执行演示”会多次回到同一行；“逐行阅读”的下一行只是在读源码。',
      code: example([
        ['#include <stdio.h>', '引入 printf 的声明。'],
        ['int main(void) {', '程序入口。'],
        ['  int sum = 0;', '先准备累计值 sum，初始为 0。'],
        ['  for (int i = 0; i < 3; i++) {', '第一次设置 i=0；每轮开始前检查 i<3，每轮结束后执行 i++。'],
        ['    sum = sum + i;', '把本轮 i 的值加到已有的 sum 上，再写回 sum。'],
        ['  }', '本轮循环体结束，回到 for 的更新和条件检查，不是直接离开整个循环。'],
        ['  printf("%d\\n", sum);', '循环已经结束，现在只显示一次总和。'],
        ['  return 0;', '正常结束程序。'],
        ['}', 'main 函数体结束。']
      ], '只计算 0+1+2。i++ 在这里的旧值没有被使用；别把它和某些复杂表达式混在一起。'),
      trace: [
        frame(null, '准备进入 main，尚无变量或输出。'),
        frame(3, '创建 sum=0。', [variable('sum', '0', '累计器')]),
        frame(4, '初始化 i=0；检查 0<3，成立。', [variable('sum', '0', '尚未累加'), variable('i', '0', '第一轮')]),
        frame(5, '第一轮：sum = 0+0 = 0。', [variable('sum', '0', '加上本轮 i'), variable('i', '0', '本轮仍为 0')]),
        frame(4, '执行 i++ 得到 1；检查 1<3，成立。', [variable('sum', '0', '保留上轮结果'), variable('i', '1', '第二轮')]),
        frame(5, '第二轮：sum = 0+1 = 1。', [variable('sum', '1', '累计到 1'), variable('i', '1', '本轮仍为 1')]),
        frame(4, '执行 i++ 得到 2；检查 2<3，成立。', [variable('sum', '1', '保留上轮结果'), variable('i', '2', '第三轮')]),
        frame(5, '第三轮：sum = 1+2 = 3。', [variable('sum', '3', '累计到 3'), variable('i', '2', '本轮仍为 2')]),
        frame(4, '执行 i++ 得到 3；3<3 不成立，离开循环。', [variable('sum', '3', '最终累计值'), variable('i', '3（退出判断时）', '随后离开 for 作用域')]),
        frame(7, '只打印一次 sum；i 此时已不在可见作用域里。', [variable('sum', '3', '供 printf 读取'), variable('i', '作用域已结束', '不能在 for 外直接使用')], '3\n'),
        frame(8, '正常结束。输出只有一行 3。', [variable('sum', '3（结束前）', 'main 随后结束')], '3\n')
      ]
    },
    arrays: {
      title: '数组：长度是 3，最后下标却是 2', short: '数组与下标',
      goal: '分清数组长度、下标、某个元素的值，避免访问不存在的格子。',
      paragraphs: ['int a[3] 建立的是三个 int 元素，下标为 0、1、2。声明里的 [3] 表示元素数量；表达式 a[1] 则表示取出下标 1 的那一个元素，也就是人习惯说的“第二个”。', 'int x = a[0]; 会把第一个元素的当前值复制给 x。随后 a[1] = x+1; 只改第二个元素，不会改变 x 或第三个元素。a[3] 不在这个数组里，C 不保证替你报错；越界访问会产生未定义行为。'],
      caution: '这里的 a 是实际数组，不是数组参数。常见循环边界应写 i < 3，不能写 i <= 3。数组起始下标 0 是规则，不是说第一个元素的值必须为 0。',
      code: example([
        ['#include <stdio.h>', '引入 printf 的声明。'],
        ['int main(void) {', '程序入口。'],
        ['  int a[3] = {4, 7, 9};', '创建 3 个整数元素：a[0]=4，a[1]=7，a[2]=9。'],
        ['  int x = a[0];', '读取下标 0 的值 4，复制给新变量 x。'],
        ['  a[1] = x + 1;', '用 4+1=5 覆盖 a[1]；a[0]、a[2] 与 x 都不变。'],
        ['  printf("%d %d\\n", a[1], a[2]);', '依次显示第二、第三个元素，中间一个空格，然后换行。'],
        ['  return 0;', '正常结束。'],
        ['}', 'main 结束。']
      ], '数组长度固定为 3；只使用合法下标 0、1、2。输出中的顺序由 printf 的参数位置决定。'),
      trace: [
        frame(null, '开始前还没有 a 或 x。'),
        frame(3, '建立并初始化数组；三个下标分别对应三个值。', [variable('a[0]', '4', '第 1 个元素'), variable('a[1]', '7', '第 2 个元素'), variable('a[2]', '9', '第 3 个元素')]),
        frame(4, '读取 a[0]，得到 4，复制给 x。', [variable('a', '[4, 7, 9]', '读取不会改变数组'), variable('x', '4', '独立保存这份整数值')]),
        frame(5, '把 x+1 的结果 5 写入 a[1]。', [variable('a', '[4, 5, 9]', '只有下标 1 被修改'), variable('x', '4', '没有被赋新值')]),
        frame(6, '读取 a[1] 和 a[2]，输出 5 9。', [variable('a', '[4, 5, 9]', '打印不改变元素'), variable('x', '4', '不变')], '5 9\n'),
        frame(7, '正常结束，没有访问 a[3]。', [variable('a', '[4, 5, 9]（结束前）', '局部数组随后结束生命周期')], '5 9\n')
      ]
    },
    functions: {
      title: '函数：带着参数进去，带着返回值出来', short: '函数与 return',
      goal: '分清调用者的变量、函数自己的参数，以及 return 送回的结果。',
      paragraphs: ['plus_one 是我们自己起的函数名。int x 是形式参数，相当于函数收到的那份局部整数。调用 plus_one(a) 时，a 当前的值 4 被复制给 x；普通 int 参数不会自动变成调用者变量的别名。', 'return x+1; 算出 5，把它交回调用点，并立刻结束这一次 plus_one。int b = plus_one(a); 再把收到的 5 存入 b。return 不负责打印；屏幕上的内容仍由后面的 printf 产生。'],
      caution: '定义函数不等于立刻执行它。虽然 plus_one 写在 main 前面，运行仍先进入 main，再在调用处进入 plus_one。这里返回 int，所以每条实际到达的返回路径都应提供合适的整数。',
      result: '4 5\n',
      code: example([
        ['#include <stdio.h>', '准备 printf 声明。'],
        ['int plus_one(int x) {', '定义函数：接收一个 int 参数 x，并返回一个 int。此时只是定义，不是调用。'],
        ['  return x + 1;', '把本次 x 加 1，返回结果并结束本次函数调用。'],
        ['}', 'plus_one 的函数体结束。'],
        ['int main(void) {', '真正运行时，先进入 main。'],
        ['  int a = 4;', '建立调用者的变量 a=4。'],
        ['  int b = plus_one(a);', '把 4 交给参数 x，等 plus_one 返回 5，再把 5 存进 b。'],
        ['  printf("%d %d\\n", a, b);', '显示 a=4、b=5；a 没有因为传参而自动增加。'],
        ['  return 0;', '结束 main，报告正常结束。'],
        ['}', 'main 函数体结束。']
      ], '只传递普通整数值。想让函数修改调用者的对象，需要另外学习指针；C++ 还提供引用。')
    },
    pointers: {
      title: '指针：& 取地址，* 找到那个对象', short: '指针与 NULL',
      goal: '看到 int *p、&value、*p 时，能分别说清“声明”“取地址”“间接访问”。',
      paragraphs: ['value 里存整数；p 里存指向某个 int 对象的指针值。int *p = &value; 中，&value 取得 value 的地址，声明里的 * 表示 p 是指针变量，并不是执行乘法。', '表达式 *p 表示 p 当前指向的那个对象。只要 p 确实指向仍然存在、可写的 value，*p=9; 就是在修改 value。p=NULL; 只让 p 不再指向该对象，不会把 value 清零。'],
      caution: '图中的“地址 A”只是帮助理解的标签，不是真实机器地址。不能解引用 NULL、未初始化指针或已释放/已失效对象的指针。本例 value 是局部变量，不应对 &value 调用 free。',
      code: example([
        ['#include <stdio.h>', '准备 printf 声明。'],
        ['#include <stddef.h>', '明确引入 NULL 的定义。'],
        ['int main(void) {', '程序入口。'],
        ['  int value = 4;', '建立普通整数对象 value，初值为 4。'],
        ['  int *p = &value;', '声明 int 指针 p，并把 value 的地址存入 p；p 指向 value。'],
        ['  *p = 9;', '沿着 p 找到 value，把那个对象改为 9。这里的 * 是间接访问。'],
        ['  printf("%d\\n", value);', '显示 value 的新值 9，说明经由指针修改的正是同一对象。'],
        ['  p = NULL;', '把 p 设为空指针；value 仍为 9，后面不能再用 *p 读写。'],
        ['  return 0;', '正常结束；没有动态申请内存，所以不需要 free。'],
        ['}', 'main 结束，局部对象生命周期结束。']
      ], 'p 只在指向有效的局部 int 对象时被解引用；本例未使用真实地址数值或指针算术。'),
      trace: [
        frame(null, '还没有创建 value 或 p。'),
        frame(4, '建立 value=4；把它的示意位置叫作“地址 A”。', [variable('value', '4', '示意位置 A')]),
        frame(5, 'p 保存 &value，指向地址 A 的 value。p 与 value 是两个不同对象。', [variable('value', '4', '存整数'), variable('p', '&value（示意地址 A）', '存指向 value 的指针值')], '', { p: '指向 value', value: '4' }),
        frame(6, '*p 找到 value 并把它写成 9；p 保存的指向关系不变。', [variable('value', '9', '通过 *p 被修改'), variable('p', '&value（示意地址 A）', '仍指向原对象')], '', { p: '指向 value', value: '9' }),
        frame(7, 'printf 读取 value=9，输出一行 9。', [variable('value', '9', '已被间接写入'), variable('p', '&value（示意地址 A）', '指向不变')], '9\n', { p: '指向 value', value: '9' }),
        frame(8, 'p=NULL 后，不再沿 p 访问。value 本身仍保存 9。', [variable('value', '9', '没有被清零'), variable('p', 'NULL', '不指向任何对象')], '9\n', { p: 'NULL', value: '9' }),
        frame(9, '正常结束；局部 value 与 p 随 main 结束生命周期。', [variable('value', '9（结束前）', '局部对象'), variable('p', 'NULL（结束前）', '空指针')], '9\n')
      ]
    },
    structs: {
      title: 'struct：把有关的数据放在一起', short: 'struct 与 ->',
      goal: '看到 node.data 和 p->data 时，知道是在访问对象还是经由指针访问对象。',
      paragraphs: ['struct Node 描述一种组合类型：每个节点有 data 字段和 next 字段。定义类型只是规定“每个这种对象有哪些成员”；到 struct Node node = ... 时才真正建立一个对象。', 'node 是结构体对象，用 node.data 访问成员；p 是指向该对象的指针，用 p->data。只要 p 有效，p->data 就等价于 (*p).data；括号不能随意省略。next=NULL 表示暂时没有指向下一个节点。'],
      caution: '成员 next 是“指向 struct Node 的指针”，不是把完整的下一个节点无限嵌入。p 和 node 不是两份节点：本例 p 指向 node，所以两种访问得到同一个 data。',
      result: '7 7\n',
      code: example([
        ['#include <stdio.h>', '准备 printf，也能获得本例使用的 NULL 定义。'],
        ['struct Node {', '开始定义一种名为 struct Node 的结构体类型。'],
        ['  int data;', '每个该类型对象都有一个整数成员 data。'],
        ['  struct Node *next;', '每个对象还有一个指向同类节点的指针成员 next。'],
        ['};', '结束类型定义；结构体定义后面的分号不可少。'],
        ['int main(void) {', '程序入口。'],
        ['  struct Node node = {7, NULL};', '创建一个节点对象：data=7，next 为空。'],
        ['  struct Node *p = &node;', 'p 保存 node 的地址，指向这个已存在的节点。'],
        ['  printf("%d %d\\n", node.data, p->data);', '用对象的 . 与指针的 -> 读取同一 data，显示 7 7。'],
        ['  return 0;', '正常结束。'],
        ['}', 'main 结束。']
      ], 'p 始终指向仍存活的 node。这里只创建一个节点，不构造完整链表。')
    },
    memory: {
      title: 'malloc 与 free：申请的空间要有去有回', short: '动态内存',
      goal: '看懂申请字节数、检查失败、使用空间和释放空间的完整顺序。',
      paragraphs: ['malloc 接收的是字节数。3 * sizeof *p 表示“容纳 3 个 p 所指类型的对象”；这里 *p 的类型是 int，sizeof 不会在本例中真的沿 p 读取对象。C 中 malloc 返回的 void* 可以转换为对象指针，不需要强制类型转换。', '申请成功不表示元素都已清零；先写过的元素才能按确定的值读取。用完后 free(p) 释放这块动态空间，随后不再访问它。p=NULL 是清理这个指针变量，不是 free 的替代品，也不会自动清掉所有指向同一块空间的其他指针。'],
      caution: '本例只读写 p[0]，没有读取尚未初始化的 p[1]、p[2]。申请失败走 return 1，没有屏幕输出；成功才显示 7。不能对局部变量地址 free，也不能对同一块空间重复释放。',
      result: '申请成功：7\n申请失败：无输出，返回状态 1。',
      code: example([
        ['#include <stdio.h>', '准备 printf。'],
        ['#include <stdlib.h>', '准备 malloc 与 free 的声明，不能省略。'],
        ['int main(void) {', '程序入口。'],
        ['  int *p = malloc(3 * sizeof *p);', '申请足以容纳 3 个 int 的动态空间；返回结果存进指针 p。'],
        ['  if (p == NULL) return 1;', '先检查是否失败；若为空，立即结束，不解引用这个指针。'],
        ['  p[0] = 7;', '成功后，向第一个 int 位置写入 7。'],
        ['  printf("%d\\n", p[0]);', '只读取刚刚写入过的第一个元素，显示 7。'],
        ['  free(p);', '归还 malloc 申请的空间；从这里起不再读写那块空间。'],
        ['  p = NULL;', '把这个指针变量设为空，避免后续误用；不是再次释放。'],
        ['  return 0;', '成功路径正常结束。'],
        ['}', 'main 结束。']
      ], '固定申请量很小，仍保留失败检查。这里的 sizeof *p 针对普通 int，不涉及变长数组。')
    },
    recursion: {
      title: '递归：先找到停下来的那一层', short: '递归基例',
      goal: '把一个问题交给更小的同类问题，同时明确什么情况下直接返回。',
      paragraphs: ['sum_to(3) 需要 3 + sum_to(2)，后者需要 2 + sum_to(1)。每次调用都有自己的参数 n；上一层暂停等待下一层返回，不是所有层共用一个 n。', 'n==0 时直接返回 0，这叫基例。随后结果逐层回来：sum_to(1)=1，sum_to(2)=3，sum_to(3)=6。递归需要同时满足“能停”和“每次更接近停止条件”，不能只写一个看起来相似的自我调用。'],
      caution: '本例只调用 n=3；一般使用时应保证 n 非负、结果不溢出且递归深度可承受。负数不断 n−1 不会到 0。源码从上到下阅读一次，不等于理解了调用栈。',
      result: '6\n',
      code: example([
        ['#include <stdio.h>', '准备 printf。'],
        ['int sum_to(int n) {', '定义求和函数，每次调用有自己的局部参数 n。'],
        ['  if (n == 0) return 0;', '基例：到 0 直接返回，不再继续调用自己。'],
        ['  return n + sum_to(n - 1);', '先等更小问题返回，再加上本层 n，把结果交回上一层。'],
        ['}', '函数定义结束。'],
        ['int main(void) {', '程序先进入 main。'],
        ['  printf("%d\\n", sum_to(3));', '求出 sum_to(3)=6，再由 printf 显示；内层没有自动打印。'],
        ['  return 0;', '正常结束。'],
        ['}', 'main 结束。']
      ], '只演示 3→2→1→0→返回的固定小例子；不将其当作任意整数都安全的通用实现。')
    },
    textbook: {
      title: '把教材类 C 写法翻译成真正的 C', short: '读懂教材类 C',
      goal: '读《数据结构 C语言版 第2版》时，先区分算法约定、类型别名和实际语言语法。',
      paragraphs: ['教材里的类 C 主要服务于算法表达。Status、ElemType、SqList、OK 不是 C 自动认识的单词，必须先看作者如何定义。这里 typedef int ElemType; 只是给 int 取别名；typedef int Status; 也不自动规定哪一个整数代表成功。', '尤其注意形参 SqList &L：在 C++ 声明里，这个 & 表示引用，让 L 成为调用者对象的别名；它不是 C 表达式 &list 那个“取地址”的动作。纯 C11 没有这种引用形参。下面用 SqList *L 接收指针，在调用处写 &list，成员访问相应改用 L->length。'],
      caution: '下面全部是原创对照，不是教材逐字摘录。即使书名写“C 语言版”，类 C 算法也未必能原封不动交给 C 编译器；还要补类型、常量、头文件和完整调用。本例约定 1 成功、0 失败，和 main 返回 0 正常结束是不同层面的约定。',
      result: '1 0\n',
      contrast: { source: 'Status InitList(SqList &L) {\n  L.length = 0;\n  return OK;\n}', explanation: '这是含 C++ 引用语法的类 C 对照片段，不是 C11。若作为 C++ 编译，还须预先定义 SqList、Status、OK；调用时可传对象本身。下方完整例子才采用纯 C11 指针写法。' },
      code: example([
        ['#include <stdio.h>', '准备 printf，以及这里使用的 NULL。'],
        ['typedef int ElemType;', '给 int 取一个类型别名 ElemType；这里每个数据元素就是整数。'],
        ['typedef int Status;', '给 int 取别名 Status；它本身没有内置成功/失败含义。'],
        ['typedef struct {', '开始定义匿名结构体，随后给这个类型取名。'],
        ['  ElemType data[3];', '准备容纳 3 个元素的数组；本例暂时不读取其中内容。'],
        ['  int length;', '记录当前实际元素个数。'],
        ['} SqList;', '把这个结构体类型取名为 SqList。'],
        ['Status InitList(SqList *L) {', '纯 C 写法：接收指向 SqList 的指针，返回 Status（即 int）。'],
        ['  if (L == NULL) return 0;', '如果没有有效的对象地址，按本例约定返回失败 0。'],
        ['  L->length = 0;', '通过指针修改调用者那一个表对象，把实际长度置为 0。'],
        ['  return 1;', '按本例约定返回成功 1，不向屏幕打印。'],
        ['}', 'InitList 函数体结束。'],
        ['int main(void) {', '程序入口。'],
        ['  SqList list;', '创建一个实际表对象，成员此刻尚未初始化。'],
        ['  Status ok = InitList(&list);', '在调用处取 list 的地址交给函数，收到成功状态 1 存入 ok。'],
        ['  printf("%d %d\\n", ok, list.length);', '此调用必有有效地址，函数已写好 length，显示状态 1 与长度 0。'],
        ['  return 0;', 'main 正常结束，返回运行环境约定的状态 0。'],
        ['}', '程序结束；没有读取未初始化的 data 元素。']
      ], '本例用容量为 3 的固定数组突出语法转换，不声称复现教材完整顺序表实现。Status 的约定须逐个接口确认。')
    }
  };

  const dictionary = [
    { symbol: 'int', name: '整数类型', sample: 'int count = 2;', text: '建立一个存整数的对象；类型不是变量名。int 的字节数由实现决定，不要把它一律认作 4 字节。', terms: '变量 声明 整数 类型' },
    { symbol: 'void', name: '没有返回值 / 没有参数', sample: 'void show(void);', text: '返回类型 void 表示函数不返回数值；参数位置的 (void) 表示不接收参数。void * 则是可转换的通用对象指针，不能直接解引用。', terms: '函数 参数 返回值' },
    { symbol: 'return', name: '结束当前函数', sample: 'return x + 1;', text: '算出结果交给调用者，并结束本次函数调用；不会自动显示。main 的 return 0 通常报告正常结束。', terms: '返回 函数' },
    { symbol: 'if', name: '条件分支', sample: 'if (size > 0) { ... }', text: '条件成立才进入语句块；对这些整数表达式，0 为假、非 0 为真。后面的 else 是另一条路径。', terms: '条件 判断 else 分支' },
    { symbol: 'for', name: '按规则重复', sample: 'for (int i = 0; i < n; i++)', text: '初始化一次；每轮先判断条件，执行循环体，然后更新，再判断。这里 i 只在这个 for 的作用域内。', terms: '循环 初始化 条件 更新' },
    { symbol: 'while', name: '条件成立就继续', sample: 'while (p != NULL) { ... }', text: '每一轮都先检查条件，可能一轮也不执行。循环体应改变有关状态，使循环能走向结束。', terms: '循环 条件' },
    { symbol: '*', name: '声明指针 / 间接访问 / 乘法', sample: 'int *p;   *p = 9;   a * b', text: '声明中的 * 表示指针；表达式里的 *p 访问 p 指向的对象，前提是指向有效；两个数之间的 * 表示乘法。必须看语境。', terms: '星号 指针 解引用 乘法' },
    { symbol: '&', name: '取地址 / 按位与', sample: 'p = &value;   flags & mask', text: '单个对象前的 &value 取得地址；两个整数间的 a & b 是按位与，不是逻辑“并且”。C++ 声明中的 & 还可能表示引用，见“& 引用”条目。', terms: '地址 指针 按位 引用' },
    { symbol: '->', name: '经由结构体指针找成员', sample: 'p->next', text: 'p 必须指向有效结构体对象。p->next 等价于 (*p).next；它不表示自动“走到下一个节点”，只是读取或写入 next 成员。', terms: '箭头 结构体 指针 成员' },
    { symbol: '.', name: '在结构体对象上找成员', sample: 'node.data', text: 'node 是结构体对象，. 后面写成员名。若手里是指针，通常应使用 ->，而不是直接 p.data。', terms: '点 结构体 对象 成员' },
    { symbol: '[]', name: '数组长度 / 元素下标', sample: 'int a[3];   a[0] = 4;', text: '声明 a[3] 表示三个元素；使用 a[0] 表示第一个元素。下标从 0 开始，长度 n 的有效下标为 0～n−1，越界不是一种正常取值。', terms: '方括号 数组 下标 长度' },
    { symbol: '++', name: '增加 1', sample: 'i++;', text: '单独写 i++ 会把 i 增加 1。后缀 i++ 的表达式值是增加前的值，前缀 ++i 是增加后的值；for 更新处通常不使用这个表达式值。', terms: '自增 循环 更新' },
    { symbol: '=', name: '赋值', sample: 'count = count + 1;', text: '先计算右边，再把结果写进左边的对象。不是判断相等；右边的 count 读取旧值。声明时的 int x = 1 则同时在做初始化。', terms: '赋值 等号 更新 初始化' },
    { symbol: '==', name: '判断是否相等', sample: 'if (count == 0)', text: '比较两个值，相等得到 1，否则得到 0；不会把 0 写进 count。请和单个等号 = 分清。', terms: '双等号 比较 条件' },
    { symbol: '!=', name: '判断是否不相等', sample: 'p != NULL', text: '不相等得到 1，相等得到 0。p 非空并不自动保证它一定有效；还要保证它没有悬空或失效。', terms: '不等于 条件 比较' },
    { symbol: '&&', name: '逻辑并且，带短路', sample: 'p != NULL && p->data > 0', text: '左边为假就不计算右边。示例先挡住空指针，再访问成员；前提仍是非空 p 确实指向有效对象。不能用单个 & 替代。', terms: '且 并且 短路 条件' },
    { symbol: '||', name: '逻辑或者，带短路', sample: 'x < 0 || x >= n', text: '左边为真就不计算右边；有一项为真，整体即为真。这里可检查下标落在合法范围以外。', terms: '或 或者 短路 条件' },
    { symbol: '%', name: '整数余数', sample: 'rear = (rear + 1) % 5;', text: '非负整数除以 5 的余数为 0～4，可帮助循环下标回绕。除数不能为 0；C 中负数余数不总等同数学上的非负模。printf 引号里的 %d 则是格式标记。', terms: '余数 取模 循环队列 格式' },
    { symbol: 'NULL', name: '空指针常量宏', sample: 'struct Node *p = NULL;', text: '表示此指针不指向对象，不能沿它访问数据。它不是一个空节点，也不表示内存中的所有字节一定都是 0。使用前应引入定义它的标准头文件。', terms: '空指针 空 链表' },
    { symbol: 'typedef', name: '给类型取别名', sample: 'typedef int ElemType;', text: '以后 ElemType 可作为 int 的另一个名字；这句没有创建元素变量，也没有申请运行时空间。Status 等教材名字要先看它的定义。', terms: '别名 Status ElemType 类型' },
    { symbol: 'struct', name: '组合类型', sample: 'struct Node { int data; };', text: '把有关成员组合成一种类型。定义类型不等于创建对象；struct Node node; 才声明一个该类型对象。成员 next 常保存指向同类节点的指针。', terms: '结构体 结点 节点 成员' },
    { symbol: 'malloc', name: '动态申请空间', sample: 'int *p = malloc(3 * sizeof *p);', text: '参数按字节计；返回空间初值未定，失败返回空指针。引入 <stdlib.h>，检查结果后再使用。C 中此处不需要把 void* 强制转换为 int*。', terms: '内存 分配 动态 申请' },
    { symbol: 'free', name: '归还动态空间', sample: 'free(p); p = NULL;', text: '只释放合适的动态分配结果或空指针；释放后不再访问那块空间，也不重复释放。设空只改变 p，不能自动消除其他别名留下的悬空指针。', terms: '释放 内存 悬空 指针' },
    { symbol: 'sizeof', name: '对象或类型的字节数', sample: 'sizeof *p', text: '返回 size_t 类型的字节数。本例 p 是 int*，sizeof *p 看 int 的大小，不实际解引用 p；变长数组有额外规则。数组参数常已是指针，不能用它求原数组长度。', terms: '大小 字节 长度 size_t' },
    { symbol: '& 引用', name: 'C++ 声明语法，不是 C11', sample: 'void InitList(SqList &L);', text: '这里 L 是调用者对象的别名，在函数内改 L 可改到原对象。声明中的 & 不是执行取地址。纯 C11 要用 SqList *L，在调用处传 &list，并用 L->成员。', terms: '&引用 C++ reference SqList 类C 形参' },
    { symbol: 'printf', name: '按格式显示', sample: 'printf("%d\\n", count);', text: '需要 <stdio.h>。%d 对应 int 参数，\\n 换行；引号之外的逗号分开参数。赋值和 return 不会自动帮你输出。', terms: '打印 输出 显示 %d 换行' },
    { symbol: ';', name: '结束一条语句', sample: 'int x = 0;', text: '声明和大部分表达式语句后需要分号。结构体类型定义末尾也要有；if 或 for 后误加一个分号则可能产生空语句，改变原本意图。', terms: '分号 语句' },
    { symbol: '{}', name: '语句块 / 初始化列表', sample: 'if (ok) { work(); }', text: '函数体或条件后的大括号把多条语句组成块；数组声明里的 {4, 7, 9} 则是初始化列表。相同符号也要结合位置理解。', terms: '大括号 语句块 初始化' }
  ];

  function normaliseCode(code) {
    const object = typeof code === 'string' ? { source: code } : code && typeof code === 'object' ? code : {};
    const source = typeof object.source === 'string' ? object.source.replace(/\r\n?/g, '\n') : '';
    const sourceLines = source ? source.split('\n') : [];
    const annotations = Object.create(null);
    if (Array.isArray(object.lines)) object.lines.forEach(item => {
      if (!item || typeof item.text !== 'string') return;
      const line = Number(item.line);
      if (Number.isInteger(line) && line >= 1 && line <= sourceLines.length) annotations[line] = item.text;
    });
    return { source, sourceLines, annotations, language: typeof object.language === 'string' ? object.language : '代码片段', explanation: typeof object.explanation === 'string' ? object.explanation : '先结合本节学习目标阅读；此片段未单独列出前提。' };
  }

  function ensureBlock(code, requestedId) {
    const normalised = normaliseCode(code);
    const externalId = requestedId === undefined || requestedId === null ? `auto-${++blockCounter}` : String(requestedId);
    let key = blockIds.get(externalId);
    if (!key) { key = `ct-block-${++blockCounter}`; blockIds.set(externalId, key); }
    const signature = JSON.stringify(normalised);
    let block = blocks.get(key);
    if (!block || block.signature !== signature) {
      block = { key, externalId, signature, ...normalised, selected: 0, expanded: false, executingLine: null };
      blocks.set(key, block);
    }
    return block;
  }

  function lineExplanation(block, index) {
    if (!block.sourceLines.length) return '此片段暂无源码。';
    if (Object.prototype.hasOwnProperty.call(block.annotations, index + 1)) return block.annotations[index + 1];
    return Object.keys(block.annotations).length ? '此行暂未附单独讲解，请结合上方整体说明阅读。' : '此段只附整体说明，暂未提供逐行讲解。请先阅读上方的前提。';
  }

  function allExplanations(block) {
    return block.sourceLines.length ? `<ol class="ct-all-list">${block.sourceLines.map((_, index) => `<li><span>第 ${index + 1} 行</span><p>${escape(lineExplanation(block, index))}</p></li>`).join('')}</ol>` : '<p>暂无可展开的源码。</p>';
  }

  function renderSnippet(code, blockId) {
    const block = ensureBlock(code, blockId);
    const selected = block.selected;
    return `<section class="ct-snippet" id="${block.key}" data-code-block="${block.key}">
      <div class="ct-snippet-heading"><span class="ct-kicker">逐行阅读</span><span class="ct-language">${escape(block.language)}</span></div>
      <p class="ct-precondition"><strong>先看前提：</strong>${escape(block.explanation)}</p><p class="ct-reading-note">点任意一行，看它的中文意思。这里按源码顺序阅读；它不是程序的执行顺序。</p>
      <div class="ct-source" role="group" aria-label="可点击逐行阅读的源码">${block.sourceLines.length ? block.sourceLines.map((line, index) => `<button type="button" class="ct-line${index === selected ? ' is-selected' : ''}${index + 1 === block.executingLine ? ' is-executing' : ''}" data-action="code-line" data-code-line="${index}" data-code-focus="line-${index}" aria-pressed="${index === selected}" aria-label="第 ${index + 1} 行：${escape(line || '空行')}" aria-describedby="${block.key}-help"><span class="ct-line-number" aria-hidden="true">${index + 1}</span><code>${escape(line || ' ')}</code></button>`).join('') : '<p class="ct-empty">此片段暂无源码。</p>'}</div>
      <div class="ct-reading-controls"><button type="button" class="btn secondary" data-action="code-line-prev" data-code-focus="line-prev"${!selected ? ' disabled' : ''}>← 上一行</button><button type="button" class="btn primary" data-action="code-line-next" data-code-focus="line-next"${selected >= block.sourceLines.length - 1 ? ' disabled' : ''}>下一行 →</button><span data-code-line-count>第 ${block.sourceLines.length ? selected + 1 : 0} / ${block.sourceLines.length} 行</span></div>
      <div class="ct-line-help" id="${block.key}-help" data-code-line-help aria-live="polite"><strong>这行读成中文</strong><p>${escape(lineExplanation(block, selected))}</p></div>
      <button type="button" class="ct-expand" data-action="code-line-all" data-code-focus="line-all" aria-expanded="${block.expanded}" aria-controls="${block.key}-all">${block.expanded ? '收起全部逐行解释 ↑' : '展开全部逐行解释 ↓'}</button><div id="${block.key}-all" data-code-all${block.expanded ? '' : ' hidden'}>${allExplanations(block)}</div>
      <div class="ct-snippet-links">${/^R(?:\s|$)/.test(block.language)?'<a href="#/course/probability/chapter-11">回到 R 软件章节</a><a href="#/prob-guide">概率与统计符号入门</a>':'<a href="#/code-guide/variables">从零学习这些语法</a><a href="#/code-guide/textbook">教材中的类 C 怎么读？</a>'}</div>
    </section>`;
  }

  function focusAfterChange(root, before, fallbackSelector) {
    if (!before || !before.dataset || !before.dataset.codeFocus || before.closest('[data-code-block], [data-code-trace]') !== root) return;
    const same = root.querySelector(`[data-code-focus="${before.dataset.codeFocus}"]`);
    const next = same && !same.disabled ? same : root.querySelector(fallbackSelector);
    if (next && typeof next.focus === 'function') next.focus({ preventScroll: true });
  }

  function refreshBlock(root) {
    if (!root) return;
    const block = blocks.get(root.dataset.codeBlock);
    if (!block) return;
    const before = (root.ownerDocument || document).activeElement;
    root.querySelectorAll('[data-code-line]').forEach(line => {
      const index = Number(line.dataset.codeLine);
      line.classList.toggle('is-selected', index === block.selected);
      line.classList.toggle('is-executing', index + 1 === block.executingLine);
      line.setAttribute('aria-pressed', String(index === block.selected));
    });
    const help = root.querySelector('[data-code-line-help]');
    if (help) help.innerHTML = `<strong>这行读成中文</strong><p>${escape(lineExplanation(block, block.selected))}</p>`;
    const count = root.querySelector('[data-code-line-count]');
    if (count) count.textContent = `第 ${block.sourceLines.length ? block.selected + 1 : 0} / ${block.sourceLines.length} 行`;
    const previous = root.querySelector('[data-action="code-line-prev"]');
    const next = root.querySelector('[data-action="code-line-next"]');
    if (previous) previous.disabled = !block.sourceLines.length || block.selected === 0;
    if (next) next.disabled = !block.sourceLines.length || block.selected >= block.sourceLines.length - 1;
    const toggle = root.querySelector('[data-action="code-line-all"]');
    const all = root.querySelector('[data-code-all]');
    if (toggle) { toggle.textContent = block.expanded ? '收起全部逐行解释 ↑' : '展开全部逐行解释 ↓'; toggle.setAttribute('aria-expanded', String(block.expanded)); }
    if (all) all.hidden = !block.expanded;
    focusAfterChange(root, before, '[data-code-line][aria-pressed="true"]');
  }

  function traceBody(topic, cursor) {
    const f = topic.trace[cursor];
    return `<p class="ct-trace-explanation"><strong>${f.line ? `示例此时走到源码第 ${f.line} 行` : '尚未开始'}</strong><br>${escape(f.text)}</p>
      <div class="ct-state-grid"><div class="ct-variable-state"><h3>此时变量里有什么？</h3>${f.values.length ? `<table class="ct-variable-table"><thead><tr><th scope="col">名字</th><th scope="col">当前值</th><th scope="col">白话说明</th></tr></thead><tbody>${f.values.map(v => `<tr><th scope="row"><code>${escape(v.name)}</code></th><td>${escape(v.value)}</td><td>${escape(v.note)}</td></tr>`).join('')}</tbody></table>` : '<p class="ct-empty">还没有创建这些局部变量。</p>'}</div><div class="ct-output-state"><h3>屏幕输出</h3><pre${f.output ? '' : ' class="ct-output-empty"'}>${escape(f.output || '（尚无输出）')}</pre><small>只有显示语句产生输出；表中数值不会自动打印。</small></div></div>
      ${f.pointer ? `<div class="ct-pointer-picture"><div><small>指针变量 p</small><strong>${escape(f.pointer.p)}</strong></div><span aria-hidden="true">${f.pointer.p === 'NULL' ? '∅' : '→'}</span><div><small>整数对象 value · 示意地址 A</small><strong>${escape(f.pointer.value)}</strong></div></div>` : ''}`;
  }

  function renderTrace(id) {
    const topic = topics[id];
    const cursor = tracePositions[id] || 0;
    return `<section class="ct-trace" data-code-trace="${id}" aria-labelledby="ct-trace-title"><div class="ct-section-heading"><span class="ct-kicker">执行演示 · 固定示例</span><h2 id="ct-trace-title">看变量和输出怎样变化。</h2></div><p class="ct-muted">使用固定示例和预先核对的执行状态，观察变量与输出。金色左线标执行行，浅绿背景标出你点读的行。</p>
      <div data-code-trace-body aria-live="polite">${traceBody(topic, cursor)}</div>
      <div class="ct-trace-controls"><button type="button" class="btn secondary" data-action="code-trace-prev" data-code-focus="trace-prev"${cursor === 0 ? ' disabled' : ''}>← 上一步执行</button><button type="button" class="btn primary" data-action="code-trace-next" data-code-focus="trace-next"${cursor === topic.trace.length - 1 ? ' disabled' : ''}>执行下一步 →</button><button type="button" class="btn secondary" data-action="code-trace-reset" data-code-focus="trace-reset"${cursor === 0 ? ' disabled' : ''}>重新演示</button><span data-code-trace-count>状态 ${cursor} / ${topic.trace.length - 1}</span></div>
    </section>`;
  }

  function refreshTrace(root) {
    if (!root) return;
    const id = root.dataset.codeTrace;
    const topic = topics[id];
    if (!topic || !topic.trace) return;
    const before = (root.ownerDocument || document).activeElement;
    const cursor = tracePositions[id] || 0;
    const body = root.querySelector('[data-code-trace-body]');
    if (body) body.innerHTML = traceBody(topic, cursor);
    const previous = root.querySelector('[data-action="code-trace-prev"]');
    const next = root.querySelector('[data-action="code-trace-next"]');
    const reset = root.querySelector('[data-action="code-trace-reset"]');
    if (previous) previous.disabled = cursor === 0;
    if (next) next.disabled = cursor === topic.trace.length - 1;
    if (reset) reset.disabled = cursor === 0;
    const count = root.querySelector('[data-code-trace-count]');
    if (count) count.textContent = `状态 ${cursor} / ${topic.trace.length - 1}${cursor === topic.trace.length - 1 ? ' · 演示结束' : ''}`;
    const guide = root.closest('[data-code-guide]');
    const snippet = guide && guide.querySelector('[data-code-block]');
    if (snippet) {
      const block = blocks.get(snippet.dataset.codeBlock);
      if (block) { block.executingLine = topic.trace[cursor].line; refreshBlock(snippet); }
    }
    focusAfterChange(root, before, '[data-action="code-trace-prev"]:not(:disabled), [data-action="code-trace-next"]:not(:disabled)');
  }

  function filteredDictionary() {
    const query = dictionaryQuery.trim().toLowerCase();
    return query ? dictionary.filter(entry => `${entry.symbol} ${entry.name} ${entry.sample} ${entry.text} ${entry.terms}`.toLowerCase().includes(query)) : dictionary;
  }
  function dictionaryItems() {
    const matches = filteredDictionary();
    return matches.length ? matches.map(entry => `<article class="ct-symbol-card"><div><code>${escape(entry.symbol)}</code><h3>${escape(entry.name)}</h3></div><pre><code>${escape(entry.sample)}</code></pre><p>${escape(entry.text)}</p></article>`).join('') : `<p class="ct-empty">没有找到“${escape(dictionaryQuery)}”。可以试试“指针”“循环”“&amp;引用”或一个具体符号。</p>`;
  }
  function renderDictionary() {
    return `<section class="ct-dictionary" data-code-dictionary aria-labelledby="ct-dictionary-title"><div class="ct-section-heading"><span class="ct-kicker">随时查，不用硬背</span><h2 id="ct-dictionary-title">符号小字典</h2><p class="ct-muted">同一个符号换个位置，意思可能改变。查一查它在声明、表达式和函数里的常见用法。</p></div><div class="ct-dictionary-search"><label for="ct-dictionary-query">搜索符号或中文意思</label><div><input id="ct-dictionary-query" type="search" data-code-input="dictionary" value="${escape(dictionaryQuery)}" placeholder="试试 int、指针、->、&引用…" autocomplete="off"><button type="button" class="btn secondary" data-action="code-dictionary-clear">清空</button></div><small data-code-dictionary-count>找到 ${filteredDictionary().length} 个条目</small></div><div class="ct-symbol-grid" data-code-dictionary-results aria-live="polite">${dictionaryItems()}</div></section>`;
  }

  function render(requestedId) {
    const id = Object.prototype.hasOwnProperty.call(topics, requestedId) ? requestedId : 'variables';
    const topic = topics[id];
    return `<div class="ct-guide" data-code-guide="${id}"><div class="eyebrow"><span class="tiny-dot"></span> READ THE CODE · ONE SMALL STEP</div><h1 class="page-title">先把代码，读成中文。</h1><p class="page-description">零基础也可以从这里开始。先看中文目标，再点读源码；需要时跟着固定示例观察变量变化。</p>
      <nav class="ct-topic-tabs" aria-label="代码入门主题">${Object.entries(topics).map(([key, value], index) => `<a href="#/code-guide/${key}"${key === id ? ' class="is-active" aria-current="page"' : ''}><span>${String(index + 1).padStart(2, '0')}</span>${value.short}</a>`).join('')}</nav>
      <article class="ct-topic"><div class="ct-topic-title"><span class="ct-kicker">今天先看懂这一件事</span><h2>${topic.title}</h2></div><div class="ct-goal"><strong>中文目标</strong><p>${topic.goal}</p></div><div class="ct-plain-explanation">${topic.paragraphs.map(p => `<p>${escape(p)}</p>`).join('')}</div><p class="ct-caution">${escape(topic.caution)}</p>
        ${topic.contrast ? `<aside class="ct-contrast"><strong>先辨认这一种写法</strong><pre><code>${escape(topic.contrast.source)}</code></pre><p>${escape(topic.contrast.explanation)}</p></aside>` : ''}
        ${renderSnippet(topic.code, `guide-${id}`)}
        ${topic.trace ? renderTrace(id) : `<div class="ct-fixed-result"><strong>这个固定示例的结果</strong><pre>${escape(topic.result)}</pre><p>结合上方固定输入和前提，核对你手算的结果。</p></div>`}
        <div class="ct-environment-note"><strong>想在自己电脑真正运行？</strong><p>完整示例按 C11 书写，实际编译运行需要本地 C 编译器。这里可离线点读源码、查看预设执行状态；教材类 C 对照片段另有明确标注。</p></div>
      </article>${renderDictionary()}
      <div class="ct-guide-footer"><a class="btn primary" href="#/course/ds">回到数据结构课程 →</a><div><span>语法核对资料</span><a href="https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf" target="_blank" rel="noopener noreferrer">WG14 N1570 · C11 委员会草案</a><a href="https://isocpp.org/wiki/faq/references" target="_blank" rel="noopener noreferrer">Standard C++ FAQ · 引用</a></div></div>
    </div>`;
  }

  function handleAction(action, element) {
    if (typeof action !== 'string' || !action.startsWith('code-') || !element || typeof element.closest !== 'function') return false;
    if (['code-line', 'code-line-prev', 'code-line-next', 'code-line-all'].includes(action)) {
      const root = element.closest('[data-code-block]');
      const block = root && blocks.get(root.dataset.codeBlock);
      if (!block) return false;
      if (action === 'code-line') {
        const index = Number(element.dataset.codeLine);
        if (!Number.isInteger(index) || index < 0 || index >= block.sourceLines.length) return false;
        block.selected = index;
      } else if (action === 'code-line-all') block.expanded = !block.expanded;
      else block.selected = Math.max(0, Math.min(block.sourceLines.length - 1, block.selected + (action === 'code-line-next' ? 1 : -1)));
      refreshBlock(root);
      return true;
    }
    if (['code-trace-prev', 'code-trace-next', 'code-trace-reset'].includes(action)) {
      const root = element.closest('[data-code-trace]');
      const id = root && root.dataset.codeTrace;
      if (!topics[id] || !topics[id].trace) return false;
      const current = tracePositions[id] || 0;
      tracePositions[id] = action === 'code-trace-reset' ? 0 : Math.max(0, Math.min(topics[id].trace.length - 1, current + (action === 'code-trace-next' ? 1 : -1)));
      refreshTrace(root);
      return true;
    }
    if (action === 'code-dictionary-clear') {
      const root = element.closest('[data-code-dictionary]');
      if (!root) return false;
      dictionaryQuery = '';
      const field = root.querySelector('[data-code-input="dictionary"]');
      if (field) field.value = '';
      refreshDictionary(root);
      if (field) field.focus({ preventScroll: true });
      return true;
    }
    return false;
  }

  function refreshDictionary(root) {
    if (!root) return;
    const results = root.querySelector('[data-code-dictionary-results]');
    const count = root.querySelector('[data-code-dictionary-count]');
    if (results) results.innerHTML = dictionaryItems();
    if (count) count.textContent = `找到 ${filteredDictionary().length} 个条目`;
  }

  function handleInput(element) {
    if (!element || !element.dataset || element.dataset.codeInput !== 'dictionary') return false;
    dictionaryQuery = String(element.value);
    refreshDictionary(element.closest('[data-code-dictionary]'));
    return true;
  }

  function afterRender() {
    document.querySelectorAll('[data-code-block]').forEach(refreshBlock);
    document.querySelectorAll('[data-code-trace]').forEach(refreshTrace);
  }

  window.CodeTutor = { render, renderSnippet, handleAction, handleInput, afterRender };
})();
