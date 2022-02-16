# JavaScript 核心原理解析

## 引子

它是一门多范型语言,也称为混合范型语言, 它既有 OOP 的特性, 也有函数式的特性. JavaScript 的简单来自于此,复杂也来自于此; 生存能力来自于此, 抨击诟病也来自于此. JavaScript 主要包括 5 个方面的语言特性: 结构化编程, 面向对象编程, 动态语言, 函数式语言和并行语言.

### 谈一谈 delete

我们使用 delete 最多的场景就是删除对象中的某个 key, 这是操作的一个引用类型. 其实仔细想想, `delete 0` 相当于删除一个基本类型, 甚至你还可以删除全局对象的某个 key, 比如在浏览器环境中, 你可以 `delete scrollX`. 因此, `delete x`, x 可以是引用类型, 也可以是基本类型, 也可以是全局对象(当然它也是引用类型).

首先看 `delete 0`, 0 是一个具体的字面量值, 是不可能删除掉的, 但 `delete 0` 仍然会返回 true, 这只表明执行过程中没有异常, 但实际的执行行为是"什么也没发生". 你显然不可能真的将 0 从执行系统中清理出去.

那么接下来, 就还剩下删除变量和删除属性, 由于全局变量实际上是通过全局对象的属性来实现的, 因此删除变量也就存在识别这两种行为的必要性. 出于 JavaScript 是动态语言这项特性, 从根本上来说, 我们是没有办法在语法分析期来判断 x 的性质的, 需要有一种方法在运行期来标识 x 的性质, 以便进一步地处理它.

对于一门编译型语言来说, 0 可以是原始类型 0, 也可以是数值类型 `Number(0)`. 但在编译之前, 也就是语法分析的阶段, 0 仅仅是一个 Token. 一个记号是没有语义的, 记号既可以是语言能识别的, 也可以是语言不能识别的. 唯有把这二者同时纳入语言范畴, 那么这个语言才能识别所谓的"语法错误". 因此, 这个语法实际起作用的是一个对象的属性, 也就是"删除对象的成员". **是删除 x 这个成员, 而不是删除 x 这个值**.

表达式的值, 在 ECMAScript 的规范中, 称为**引用**. 对于 delete 0, 实际上是在说: JavaScript 将 0 视为一个表达式, 并尝试删除它的求值结果.

- 如果它是值, 则按照传统的 JavaScript 的约定返回 true;
- 如果它是一个引用, 那么对该引用进行分析, 以决定如何操作.

ECMAScript 约定: 任何表达式计算的结果(Result)要么是一个值, 要么是一个引用. delete {} 这个对象字面量 , 当它被作为表达式执行的时候, 结果也是一个值.

所有赋值操作的含义, 是将右边的**值**, 赋给左边用于包含该值的**引用**. 如果 x 放在左边作为 lhs, 那么它是引用; 如果放在右边作为 rhs, 那么就是值. 所以 `x = x` 的语义并不是**x 赋给 x**, 而是**把值 x 赋给引用 x**.

而对于 `obj.x()`, 如果 obj.x 只是值, 或者它作为右手端, 那么它就不能**携带**obj 这个对象, 也就完成不了后续的方法调用操作.

所以, **delete x**归根到底, 是在删除一个表达式的、引用类型的结果(Result), 而不是在删除 x 表达式, 或者这个删除表达式的值(Value).

- delete 运算符尝试删除值数据时, 会返回 true, 用于表示没有错误(Error).
- delete 0 的本质是删除一个表达式的值(Result).
- delete x 与上述的区别只在于 Result 是一个引用(Reference)
- delete 其实只能删除一种引用, 即对象的成员(Property)

因此, 在 JavaScript 中. 引用类型, 也就是 Obeject, Fuction 这些, 归因于它们存在于堆內存; 而基础类型, 如 Number, String, Boolean, null, undefined, 归因于它们存在于栈内存. 但注意的是引用和引用类型是不同的概念.

最后写几个例子:

```ts
let x = 1;
delete x; // false

delete unexistingVariable; // true

const o = {};
Object.defineProperty(o, "name", {
  value: "yancey",
  configurable: false,
});
delete o.name; // false
```

## 谈一谈声明语句

至今为止, 除标签声明之外, JavaScript 中一共只有六条声明用的语句: let, const, var, function, import, class. 此外还有两个不太严格的声明语句, 分别是 `for(var|let|const x ...)` 和 `try...catch`. 比如 `var a = 1`, var a 就是一个声明, 后面是一个赋值运算.

除上述的语法, 用户是没有其它方式来在当前的代码上下文中声明出一个标识符来的, 因为所有的声明都有以下两个特征:

- 意味着 JavaScript 将可以通过**静态**语法分析发现那些声明的标识符
- 标识符对应的变量 / 常量**一定**会在用户代码执行前就已经被创建在作用域中.

下面这个例子, 正是由于 var y 所声明的那个标识符在函数 f() 创建(它自己的闭包)时就已经存在, 所以才阻止了 console.log(y)访问全局环境中的 y. 类似的, let x 所声明的那个 x 其实也已经存在 f() 函数的上下文环境中. 访问它之所以会抛出异常(Exception), 不是因为它不存在, 而是因为这个标识符被拒绝访问了(临时死区).

```ts

var y = "outer";
function f() {
  console.log(y); // undefined
  console.log(x); // throw a Exception
  let x = 100;
  var y = 100;
  ...
}
```

### 变量提升

JavaScript 是允许访问还没有绑定值的 var 所声明的标识符的, 这种标识符后来统一约定称为变量声明(VarDelcs); 而 let/const 则称为词法声明(LexicalDecls). JavaScript 环境在创建一个 var 变量名后, 会初始化绑定一个 undefined 值. 而 let/const 则会初始化绑定一个 undefined, 而 let/const 没这个待遇, 它们在缺省情况下就是"还没有绑定值"的标识符, 且 const 必须赋初值.

回到上面六条声明用的语句, 函数是按 varDecls 的规则声明的; 类 1 的内部是严格模式, 名字按 let 处理; import 按照 const 的规则处理. 因此所有的声明本质上只有三种处理模式: var 变量声明, let 变量声明和 const 常量声明.

补充, import 语句会发生变量提升的效果, 这是因为 ESModule 根据 import 构建依赖树, 所以在代码运行前名字就是已经存在于上下文, 然后在运行模块最顶层代码, 给名字绑定值, 就出现了变量提升的效果.

### 赋值

将右操作数(的值)赋给左操作数(的引用), 一个赋值表达式的左边和右边其实都是表达式.

```ts
LeftHandSideExpression < = | AssignmentOperator > AssignmentExpression
```

### 向一个不存在的变量赋值

现在的 JavaScript 环境仍然是通过将全局对象初始化为一个全局闭包来实现的. 但是为了得到一个尽可能与其它变量环境相似的声明效果(varDecls), ECMAScript 规定在这个全局对象之外再维护一个变量名列表(varNames), 所有在静态语法分析期或在 eval() 中使用 var 声明的变量名就被放在这个列表中. 然后约定, 这个变量名列表中的变量是"直接声明的变量", 不能使用 delete 删除.

当然 let, const 是不存在这种事情的, 它们不会被挂在 global 下.

```ts
// 这两个都挂在了全局对象上, 可以通过 global. 获取
// 不同的是, a 是不可删除的, b 是可删除的
// 是否能够被删除可通过 configurable 属性符来判断
var a = 100;
x = 200;

Object.getOwnPropertyDescriptor(global, "a");
// { value: 100, writable: true, enumerable: true, configurable: false }

Object.getOwnPropertyDescriptor(global, "x");
// { value: 200, writable: true, enumerable: true, configurable: true }
```

因此回到今天讨论的这行代码 `var x = y = 100`, 在这行代码中, 等号的右边是一个表达式 y = 100, 它发生了一次**向不存在的变量赋值**, 所以它隐式地声明了一个全局变量 y, 并赋值为 100. x 和 y 是两个不同的东西, 前者是声明的名字, 后者是一个赋值过程可能创建的变量名.

var 关键字所声明的, 事实上有且仅有 x 一个变量名, 变量 y 会因为赋值操作而导致 JavaScript 引擎**意外**创建一个全局变量, 去除掉`var x` 之后剩下的部分, 并不是一个严格意义上的**赋值运算**, 而是被称为**初始器(Initializer)**的语法组件. 因此, x 只是一个表达名字的, 静态语法分析期作为标识符来理解的字面文本, 而不是一个表达式.

```ts
Initializer: = AssignmentExpression
```

而对于 `x = y = 0`, x 是一个表达式了, 它被严格地称为**赋值表达式的左手端(lhs)操作数**.

## `a.x = a = { n: 2}` 经典问题

```ts
var a = { n: 1 },
  ref = a;
a.x = a = { n: 2 };
console.log(a.x); // undefined
console.log(ref.x); // { n: 2 }
```

首先, 对于第一行, 声明一个 a 变量, 赋值为 `{ n: 1 }`. 对于第二行, **因为 js 操作是从左往右**, a.x 先执行, 给 a 这个引用里面添加一个 x 属性, x 属性是什么呢? 看等号右边, 为一个赋值表达式(可以把连续赋值看作一个嵌套函数, 等号左边都是引用, 右边都是值, 执行是从前往后, 但赋值是从后往前), 那么要做的就是求赋值表达式的值; 即 `a = { n: 2 }`, 这是第一次赋值, 这时候 a 这个变量的引用已经发生了变化, 指向了另一块地址, 这时候过去的 a 的引用地址就找不到了. 那么对于第三行, 当你再打印 a.x 时, 这里面的 a 其实是新的引用地址, 打印出来自然是 undefined,

![拆解](https://edge.yancey.app/beg/nl5r8o6z-1644745550550.jpg)

## 谈一谈 export

ECMAScript 6 模块是静态装配的, 而传统的 Node.js 模块却是动态加载的.

```ts
// 导出"声明的(名字)"
export <let/const/var> x ...;
export function x() ...
export class x ...
export {x, y, z, ...};

// 导出"重命名的(名字)"
export { x as y, ...};
export { x as default, ... };

// 导出"其它模块的(名字)"
export ... from ...;

// 导出"值"
export default <expression
```

`export default` 虽然简单, 却是对导出名字的非常必要的补充. 这样一来, 用户既可以导出那些有名字的数据, 也可以导出那些没有名字的数据, 即一个模块中所有的数据都可以被导出了.

以 `export var x = 100;` 为例, 在导出的时候. 就是在某个名字表登记上一个名字 x 而已, 这也是 JavaScript 在模块装载之前对 export 所做的全部工作; 而从 import 角度考虑, 比如 `import { x } from 'xxx'`, 它是按照语法在当前模块中声明名字, 添加一个当前模块对目标模块的依赖项. 通过这种方式, JavaScript 就可以依据所有它能在静态文本中发现的 import 语句来形成模块依赖树, 最后就可以找到这个模块依赖树最顶端的根模块, 并尝试加载之.

export 事实上就只能导出**名字和值**. 然而一旦它能导出**名字和值**, 也就意味着它能导出一个模块中的**全部内容**. 在导入导出的过程中, 没有任何一行用户的 JavaScript 代码是被执行过的, 源代码只被理解为静态的, 没有逻辑的代码文本. 这意味着, **在处理 export/import 语句的全程, 没有表达式被执行.**

在看下面的例子, 如同 `var x = 100;` 在执行阶段需要有一个将值 100 绑定给变量 x 的过程, export default 也应当有类似的过程来将结果绑定到 default 这个名字上. 在静态装配阶段, 名字 default 只是被初始化为一个**单次绑定的, 未初始化的标识符**. 因此后续找到并遍历模块依赖树的所有模块, 执行这些模块最顶层的代码. 这意味着, **所谓模块的装配过程, 就是执行一次顶层代码而已.**

```ts
export var x = 100;
export default function() {}
export var default = function() {}
```

### 对于匿名函数的 export

**它并不是导出了一个匿名函数表达式, 而是导出了一个匿名函数定义(Anonymous Function Definition)**. 下面这个例子, 如果默认导出一个匿名函数, 它会被默认导出到一个名字为 default 的名字空间中.

```ts
// b.js
export default function () {}

// a.js
import B from "./b.js";
B.name; // 'default'
```

如果是个具名函数, 导出后就还会用到这个名字. 其实这种写法在 React 的函数组件中是很常见的做法.

```ts
// b.js
export default function b() {}

// a.js
import B from "./b.js";
B.name; // 'b'
```

### 其他

- `export var x = ''` 就意味着在当前模块环境中创建的是一个变量, 并可以修改等等. 但是当它被导入时, 在 import 语句所在的模块中却是一个常量, 因此总是不可写的
- 由于 `export default` 没有显式地约定名字 default 应该按 let/const/var 的哪一种来创建, 因此 JavaScript 缺省将它创建成一个普通的变量(var), 但即使是在当前模块环境中, 它事实上也是不可写的, 因为你无法访问一个命名为"default"的变量, 因此它是一个关键字.
- 所谓匿名函数, 仅仅是当它直接作为操作数时, 才是真正匿名的, 如 `function(){}.name; // ''`.
- 由于类表达式, 在本质上就是函数, 它的表现形式和上述一致(参考 React 类组件).
- 导出项(的名字)总是作为词法声明被声明在当前模块作用域中的, 这意味着它不可删除, 且不可重复导出.
- 对于 export 来说是模块的导出表, 对于 import 来说就是名字空间, 如果用户代码不使用 `import * as ...` 的语法来创建这个名字空间, 那么该名字表就只存在于 JavaScript 的词法分析过程中, 而不会(或并不必要)创建它在运行期的实例

## 一个偏门的概念 - for 循环的代价

先复习一下, 在 ECMAScript 6 之后, JavaScript 实现了块级作用域. 然而, 绝大多数 JavaScript 语句都并没有自己的块级作用域. 从语言设计的原则上来看, 越少作用域的执行环境调度效率也就越高, 执行时的性能也就越好. 像 switch, try...catch 是块级作用域, 而 if, for, while 等都不是块级作用域.

在 JavaScript 的具体执行过程中, 作用域是被作为环境的上下文来创建的. 如果将 for 语句的块级作用域称为 forEnv, 并将上述为循环体增加的作用域称为 loopEnv, 那么 loopEnv 它的外部环境就指向 forEnv. 于是在 loopEnv 看来, 变量 i 其实是登记在父级作用域 forEnv 中, 并且 loopEnv 只能使用它作为名字 i 的一个引用. 更准确地说, 在 loopEnv 中访问变量 i, 在本质上就是通过环境链回溯来查找标识符(Resolve identifier, or Get Identifier Reference).

下面这个例子创建了一些定时器. 当定时器被触发时, 函数会通过它的闭包(这些闭包处于 loopEnv 的子级环境中)来回溯, 并试图再次找到那个标识符 i. 然而, 当定时器触发时, 整个 for 迭代有可能都已经结束了. 这其实就是几百年前那个经典的面试题 —— **for 循环为 var 遇上 setTimeout 的问题.** ES6 之前的解法是通过闭包, 当然之后换成 let 即可, 但换成 let 其实是会有代价的.

因为要想使用 let 的方式符合预期, 这个 loopEnv 就必须是**随每次迭代变化的**. 也就是说, 需要为每次迭代都创建一个新的作用域副本, 这称为迭代环境(iterationEnv), 因此, 每次迭代在实际上都并不是运行在 loopEnv 中, 而是运行在该次迭代自有的 iterationEnv 中. 也就是说, 在语法上这里只需要两个块级作用域, 而实际运行时却需要为其中的第二个块级作用域创建无数个副本. 这就是 for 语句中使用 let/const 这种块级作用域声明所需要付出的代价. 这个循环体越大, 支持的层次越多, 那么这个环境的创建也就越频繁, 代价越高昂. 再加上可以使用函数闭包将环境传递出去, 或交给别的上下文引用, 这里的负担就更是雪上加霜了. 有个说法是**循环与函数递归在语义上等价**, 其实不然, 像上面这种当时, 循环带来的代价并不小.

```ts
for (let i in [1, 2, 3]) {
  setTimeout(() => console.log(i), 1000);
}
```
