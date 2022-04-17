# 从 JavaScript 编译原理到作用域(链)及闭包

> 虽然作用域的相关知识是 JavaScript 的基础, 但要彻底理解必须要从原理入手. 从面试角度来讲, 词法/动态作用域, 作用域(链), 变量/函数提升, 闭包, 垃圾回收 实属一类题目, 打通这几个概念并熟练掌握, 面试基本就不用担心这一块了. 这篇文章是对《JavaScript 高级程序设计 (第三版)》第四章, 同样也是 《你不知道的 JavaScript (上卷)》第一部分的学习和总结.

## 编译原理

对于大部分编程语言, 编译大致有三个步骤.

- 分词/词法分析 (Tokenizing/Lexing)此过程将源代码分解成 `词法单元 (token)`, 如代码 `const firstName = 'Yancey'` 会被分解成 `const`, `firstName`, `=`, `'Yancey'`, 空格是否会被当成词法单元, 取决于空格对这门语言的意义. 这里推荐一个网站 [Parser](http://esprima.org/demo/parse.html#) 可以用来解析 JavaScript 的源代码. 对于这个例子, 分词结构如下.

```js
[
  {
    type: "Keyword",
    value: "const",
  },
  {
    type: "Identifier",
    value: "firstName",
  },
  {
    type: "Punctuator",
    value: "=",
  },
  {
    type: "String",
    value: "'Yancey'",
  },
];
```

- 解析/语法分析 (Parsing)这个过程将词法单元流转换成一棵 **抽象语法树** (Abstract Syntax Tree, AST). 语法分析会根据 ECMAScript 的标准来解析成 AST, 比如你写了 `const new = 'Yancey'`, 就会报错 **Uncaught SyntaxError: Unexpected token new**.对于上面那个例子, 生成的 AST 如下图所示, 其中 `Identifier` 代表着变量名, `Literal` 代表着变量的值.

![AST](https://edge.yancey.app/beg/Jietu20190405-233819%402x.jpg)

- 代码生成这个阶段就是将 AST 转换为可执行代码, 像 V8 引擎会将 JavaScript 字符串编译成二进制代码(创建变量, 分配内存, 将一个值存储到变量里...)

除上面三个阶段之外, JavaScript 引擎还对 **语法分析**, **代码生成**, **编译过程** 进行一些优化, 这一块估计得看 v8 源码了, 先留个坑. 有个库叫做 [Acorn](https://github.com/acornjs/acorn), 用来解析 JavaScript 代码, 像 webpack, eslint 都有用到, 有时间可以玩一玩.

总的来讲, 先是生成字节码, 然后解释器可以直接执行字节码, 输出结果. 但是通常 Javascript 还有个编译器, 会把那些频繁执行的字节码编译为二进制, 这样那些经常被运行的函数就可以快速执行了, 通常又把这种解释器和编译器混合使用的技术称为 JIT.

## 词法作用域和动态作用域

作用域有两种模型, 一种是 **词法作用域(Lexical Scope)**, 另一种是 **动态作用域 (Dynamic Scope)**.

词法作用域是定义在词法阶段的作用域, 换句话说就是你写代码时将变量和块作用域写在哪里决定的. JavaScript 可以通过 `eval` 和 `with` 来改变词法作用域, 但这两种会导致引擎无法在编译时对作用域查找进行优化, 因此不要使用它们.

而动态作用域是在运行时定义的, 最典型的就是 this 了.

## 作用域

作用域是指在程序中定义变量的区域, 该位置决定了变量的生命周期. 通俗地理解, 作用域就是变量与函数的可访问范围, 即作用域控制着变量和函数的可见性和生命周期. 在 ES6 之前, ES 的作用域只有两种: 全局作用域和函数作用域.

不管是编译阶段还是运行时, 都离不开 **引擎**, **编译器**, **作用域**.

- 引擎用来负责 JavaScript 程序的编译和执行.

- 编译器负责语法分析, 代码生成等工作.

- 作用域用来收集并维护所有变量访问规则.

以代码 `const firstName = 'Yancey'` 为例, 首先编译器遇到 `const firstName`, 会询问 **作用域** 是否已经有一个同名变量在当前作用域集合, 如果有编译器则忽略该声明, 否则它会在当前作用域的集合中声明一个新的变量并命名为 `firstName`.

接着编译器会为引擎生成运行时所需的代码, 用于处理 `firstName = 'Yancey'` 这个赋值操作. 引擎会先询问作用域, 在当前作用域集合中是否有个变量叫 `firstName`. 如果有, 引擎就会使用这个变量, 否则继续往上查找.

引擎在作用域中查找元素时有两种方式: `LHS` 和 `RHS`. 一般来讲, `LHS` 是赋值阶段的查找, 而 `RHS` 就是纯粹查找某个变量.

看下面这个例子.

```js
function foo(a) {
  var b = a;
  return a + b;
}

var c = foo(2);
```

1. `var c = foo(2);` 引擎会在作用域里找是否有 `foo` 这个函数, 这是一次 RHS 查找, 找到之后将其赋值给变量 `c`, 这是一次 LHS 查找.

2. `function foo(a) {` 这里将实参 `2` 赋值给形参 `a`, 所以这是一次 LHS 查找.

3. `var b = a;` 这里要先找到变量 `a`, 所以这是一次 RHS 查找. 接着将变量 `a` 赋值给 `b`, 这是一次 LHS 查找.

4. `return a + b;` 查找 `a` 和 `b`, 所以是两次 RHS 查找.

### 全局作用域

以浏览器环境为例:

- **最外层函数**和**在最外层函数外面**定义的变量拥有全局作用域

- 所有末定义直接赋值的变量自动声明为拥有全局作用域

- 所有 window 对象的属性拥有全局作用域

```js
const a = 1; // 全局变量

// 全局函数
function foo() {
  b = 2; // 未定义却赋初值被认为是全局变量

  const name = "yancey"; // 局部变量

  // 局部函数
  function bar() {
    console.log(name);
  }
}

window.navigator; // window 对象的属性拥有全局作用域
```

全局作用域的缺点很明显, 就是会污染全局命名空间, 因此很多库的源码都会使用 `(function(){....})()`. 此外, 模块化 (ES6, commonjs 等等) 的广泛使用也为防止污染全局命名空间提供了更好的解决方案.

### 函数作用域

函数作用域指属于这个函数的全部变量都可以在整个函数范围内使用及复用.

```js
function foo() {
  const name = "Yancey";
  function sayName() {
    console.log(`Hello, ${name}`);
  }
  sayName();
}

foo(); // 'Hello, Yancey'

console.log(name); // 外部无法访问到内部变量
sayName(); // 外部无法访问到内部函数
```

值得注意的是, if, switch, while, for 这些条件语句或者循环语句不会创建新的作用域, 虽然它也有一对 `{}` 包裹. 能不能访问的到内部变量取决于声明方式(var 还是 let/const). 这是因为在 ES6 之前, 没有了块级作用域, 再把作用域内部的变量统一提升无疑是最快速、最简单的设计, 不过这也直接导致了函数中的变量无论是在哪里声明的, 在编译阶段都会被提取到执行上下文的变量环境中, 所以这些变量在整个函数体内部的任何地方都是能被访问的, 这也就是 JavaScript 中的变量提升.

```js
if (true) {
  var name = "yancey";
  const age = 18;
}

console.log(name); // 'yancey'

console.log(age); // 报错
```

### 块级作用域

我们知道 let 和 const 的出现改变了 JavaScript 没有块级作用域的情况(具体可以看高程三的第 76 页, 那个时候还没有块级作用域的概念). 关于 let 和 const 不去细说, 这两个再不懂的话... 不过后面会介绍到**临时死区**的概念.

此外, `try/catch` 的 `catch` 分句也会创建一个块级作用域, 看下面一个例子:

```js
try {
  noThisFunction(); // 创造一个异常
} catch (e) {
  console.log(e); // 可以捕获到异常
}

console.log(e); // 报错, 外部无法拿到 e
```

## 作用域链

```ts
function bar() {
  console.log(myName);
}
function foo() {
  let myName = "A";
  bar();
}
let myName = "B";

foo(); // B
```

在每个执行上下文的变量环境中, 都包含了一个外部引用, 用来指向外部的执行上下文, 我们把这个外部引用称为 outer. 当一段代码使用了一个变量时, JavaScript 引擎首先会在“当前的执行上下文”中查找该变量. 比如上面那段代码在查找 myName 变量时, 如果在当前的变量环境中没有查找到, 那么 JavaScript 引擎会继续在 outer 所指向的执行上下文中查找.

![带有外部引用的调用栈](https://edge.yancey.app/beg/jgfo7t4j-1650220837330.webp)

从图中可以看出, bar 函数和 foo 函数的 outer 都是指向全局上下文的, 这也就意味着如果在 bar 函数或者 foo 函数中使用了外部变量, 那么 JavaScript 引擎会去全局执行上下文中查找. 我们把这个查找的链条就称为作用域链.

不过还有一个疑问没有解开, foo 函数调用的 bar 函数, 那为什么 bar 函数的外部引用是全局执行上下文, 而不是 foo 函数的执行上下文? 要回答这个问题, 你还需要知道什么是词法作用域. 这是因为在 JavaScript 执行过程中, **其作用域链是由词法作用域决定的**.

词法作用域上面有介绍, 词法作用域就是指作用域是由代码中函数声明的位置来决定的, 所以词法作用域是静态的作用域, 通过它就能够预测代码在执行过程中如何查找标识符. 上面这个例子中, foo 和 bar 的上级作用域都是全局作用域, 所以如果 foo 或者 bar 函数使用了一个它们没有定义的变量, 那么它们会到全局作用域去查找. 也就是说, 词法作用域是代码编译阶段就决定好的, 和函数是怎么调用的没有关系.

## 提升

在 ES6 之前的"蛮荒时代", 变量提升在面试中经常被问到, 而 let 和 const 的出现解决了变量提升问题. 但函数提升一直是存在的, 这里我们从原理入手来分析一下提升. 以下面这段代码为例:

```ts
showName();
console.log(myname);
var myname = "极客时间";
function showName() {
  console.log("函数showName被执行");
}
```

之所以有变量提升和函数提升, 这是因为一段 JavaScript 代码在执行之前需要被 JavaScript 引擎编译. 变量和函数声明在代码里的位置是不会改变的, 而且是在编译阶段被 JavaScript 引擎放入内存中, 编译完成之后, 才会进入执行阶段.

在编译阶段, 会生成两部分内容: 执行上下文(Execution context)和可执行代码. 执行上下文是 JavaScript 执行一段代码时的运行环境, 比如调用一个函数, 就会进入这个函数的执行上下文, 确定该函数在执行期间用到的诸如 this, 变量, 对象以及函数等. 在执行上下文中存在一个变量环境的对象(Viriable Environment), 该对象中保存了变量提升的内容.

![JavaScript 执行流程细化图](https://edge.yancey.app/beg/nhchchfs-1650013133355.webp)

比如上面代码中的变量 myname 和函数 showName, 都保存在该对象中.

```ts
VariableEnvironment:
  myname -> undefined,
  showName -> function: { console.log(myname) }
```

让我们一步一步来看上面的代码是怎样提升的:

```ts
showName();
console.log(myname);
var myname = "极客时间";
function showName() {
  console.log("函数showName被执行");
}
```

- 第 1 行和第 2 行, 由于这两行代码不是声明操作, 所以 JavaScript 引擎不会做任何处理;
- 第 3 行, 由于这行是经过 var 声明的, 因此 JavaScript 引擎将在环境对象中创建一个名为 myname 的属性, 并使用 undefined 对其初始化;
- 第 4 行, JavaScript 引擎发现了一个通过 function 定义的函数, 所以它将函数定义存储到堆(HEAP)中, 并在环境对象中创建一个 showName 的属性, 然后将该属性值指向堆中函数的位置.

这样就生成了变量环境对象. 接下来 JavaScript 引擎会把声明以外的代码编译为字节码, 此时, 现在有了执行上下文和可执行代码了, 那么接下来就到了执行阶段了. 执行阶段 JavaScript 引擎便开始在变量环境对象中查找这些变量或函数. 此外, 一段代码如果定义了两个相同名字的函数, 那么最终生效的是最后一个函数. 如果变量和函数同名, 那么在编译阶段, 变量的声明会被忽略.

### 变量提升

我们回忆一下关于编译器的内容, 引擎会在解释 JavaScript 代码之前首先对其进行编译, 编译阶段的一部分工作就是找到所有的声明, 并且使用合适的作用域将它们串联起来. 换句话说, 变量和函数在内的所有声明都会在代码执行前被处理.

因此, 对于代码 `var i = 2;` 而言, JavaScript 实际上会将这句代码看作 `var i;` 和 `i = 2`, 其中第一个是在编译阶段, 第二个赋值操作会原地等待执行阶段. 换句话说, 这个过程将会把变量和函数声明放到其作用域的顶部, 这个过程就叫做提升.

可能你会有疑问, 为什么 let 和 const 不存在变量提升呢？这是因为在编译阶段, 当遇到变量声明时, 编译器要么将它提升至作用域顶部(var 声明), 要么将它放到 **临时死区(temporal dead zone, TDZ)**, 也就是用 let 或 const 声明的变量. **访问 TDZ 中的变量会触发运行时的错误**, 只有执行过变量声明语句后, 变量才会从 TDZ 中移出, 这时才可访问.

下面这个例子你能不能全部答对.

```js
typeof null; // 'object'

typeof []; // 'object'

typeof someStr; // 'undefined'

typeof str; // Uncaught ReferenceError: str is not defined
const str = "Yancey";
```

第一个, 因为 `null` 根本上是一个指针, 所以会返回 `'object'`. 深层次一点, 不同的对象在底层都表示为二进制, 在 Javascript 中二进制前三位都为 0 的会被判断为 Object 类型, null 的二进制全为 0, 自然前三位也是 0, 所以执行 typeof 时会返回 `'object'`.

第二个想强调的是, typeof 判断一个引用类型的变量, 拿到的都是 `'object'`, 因此该操作符无法正确辨别具体的类型, 如 Array 还是 RegExp.

第三个, 当 typeof 一个 **未声明** 的变量, 不会报错, 而是返回 'undefined'

第四个, `str` 先是存在于 TDZ, 上面说到访问 TDZ 中的变量会触发运行时的错误, 所以这段代码直接报错.

### 函数提升

函数声明和变量声明都会被提升, 但值得注意的是, 函数首先被提升, 然后才是变量.

```js
test();

function test() {
  foo();
  bar();
  var foo = function () {
    console.log("this won't run!");
  };
  function bar() {
    console.log("this will run!");
  }
}
```

上面的代码会变成下面的形式: 内部的 `bar` 函数会被提升到顶部, 所以可以被执行到;接下来变量 `foo` 会被提升到顶部, 但变量无法执行, 因此执行 `foo()` 会报错.

```js
function test() {
  var foo;
  function bar() {
    console.log("this will run!");
  }
  foo();
  bar();
  foo = function () {
    console.log("this won't run!");
  };
}
test();
```

### 提升带来的缺点

**变量容易在不被察觉的情况下被覆盖掉**. 下面这段代码, 在 showName 函数中, 由于 myname 是用 var 声明的, 所以不是块级作用域, 所以 myname 在 showName 函数中会被提升到顶部, 所以两个 log 都会打印出 undefined.

```ts
var myname = "极客时间";
function showName() {
  console.log(myname);
  if (0) {
    var myname = "极客邦";
  }
  console.log(myname);
}
showName();
```

**本应销毁的变量没有被销毁**. 下面这段代码, 离开了 for 循环之后 i 并没有被销毁.

```ts
function foo() {
  for (var i = 0; i < 7; i++) {}
  console.log(i);
}
foo();
```

### 编译器是怎么即支持 var, 又支持 let, const 的

```ts
function foo() {
  var a = 1;
  let b = 2;
  {
    let b = 3;
    var c = 4;
    let d = 5;
    console.log(a);
    console.log(b);
  }
  console.log(b);
  console.log(c);
  console.log(d);
}
foo();
```

对于 var, 会发生变量提升, 也就是在一个变量赋值前就能访问它. 因此, 自 ECMAScript 5 开始约定, ECMAScript 的执行上下文将有两个环境, 一个称为词法环境(Lexical Environment), 另一个就称为变量环境(Variable Environment), 所有传统风格的 var 声明和函数声明通过变量环境来管理. 所有 let, const 的使用词法环境管理. 而在内核上, 全局上下文的词法环境和变量环境指向是一样的. 也就意味着词法变量和 var 变量共用一个名字表, 因此你声明了 var 变量, 那么就不能声明同名的 let/const 变量.

当进入函数的作用域块时, 作用域块中通过 let 声明的变量, 会被存放在词法环境的一个单独的区域中, 这个区域中的变量并不影响作用域块外面的变量.

在词法环境内部, 维护了一个小型栈结构, 栈底是函数最外层的变量, 进入一个作用域块后, 就会把该作用域块内部的变量压到栈顶; 当作用域执行完成之后, 该作用域的信息就会从栈顶弹出.

当执行到作用域块中的 `console.log(a)` 这行代码时, 就需要在词法环境和变量环境中查找变量 a 的值了, 具体查找方式是: 沿着词法环境的栈顶向下查询, 如果在词法环境中的某个块中查找到了, 就直接返回给 JavaScript 引擎, 如果没有查找到, 那么继续在变量环境中查找.

## 执行上下文

上下文指的是一个外部的, 内部的或由全局 / 模块入口映射成的函数. JavaScript 的执行系统由一个执行栈和一个执行队列构成. 在执行队列中保存的是待执行的任务, 称为 Job. 每一个执行上下文都需要关联到一个对照表. 这个对照表, 就称为**词法环境(Lexical Environment)**.

**模块入口**是所有模块的顶层代码的顺序组合, 它们被封装为一个称为顶层模块执行(TopLevelModule Evaluation Job)的函数中来作为模块加载的第一个执行上下文创建. 一般 **.js 文件**也会创建一个脚本执行(Script Evaluation Job) 的函数, 这也是文件加载中所有全局代码块被称为 script 块的原因. **eval** 也是会开启一个执行上下文, JavaScript 为 eval() 所分配的这个执行上下文, 与调用 eval() 时的函数上下文享有同一个环境(包括词法环境和变量环境等等), 并在退出 eval() 时释放它的引用, 以确保同一个环境中同时只有一个逻辑在执行.

对于普通函数被调用, 它也会形成执行上下文, 但它是**被**调用的, 所以它会创建一个 caller(调用者), 由于栈是先入后出的, 因此总是立即执行这个 callee 函数的上下文. 因此所有其他上下文都在执行栈上, 而生成器的上下文(多数时间是)在栈的外面.

## 调用栈

调用栈就是用来管理函数调用关系的一种数据结构, 在执行上下文创建好后, JavaScript 引擎会将执行上下文压入栈中, 通常把这种用来管理执行上下文的栈称为**执行上下文栈**, 又称**调用栈**. 以下面这段代码为例.

```ts
var a = 2;
function add() {
  var b = 10;
  return a + b;
}
add();
```

在执行到函数 add() 之前, JavaScript 引擎会为上面这段代码创建全局执行上下文, 包含了声明的函数和变量.

![全局执行上下文](https://edge.yancey.app/beg/yrwofq1f-1650203945435.webp)

执行上下文准备好之后, 便开始执行全局代码, 当执行到 add 这儿时, JavaScript 判断这是一个函数调用, 那么将执行以下操作:

- 首先, 从**全局执行上下文**中, 取出 add 函数代码.
- 其次, 对 add 函数的这段代码进行编译, 并创建该函数的**执行上下文**和**可执行代码**.
- 最后, 执行代码, 输出结果.

![函数调用过程](https://edge.yancey.app/beg/gjros498-1650203937037.webp)

再换个复杂的例子:

```ts
var a = 2;
function add(b, c) {
  return b + c;
}
function addAll(b, c) {
  var d = 10;
  result = add(b, c);
  return a + result + d;
}
addAll(3, 6);
```

1. 首先创建全局上下文, 并将其压入栈底. 此时全局上下文的 a, add, adAll 被保存到变量环境对象中.
2. 全局执行上下文压入到调用栈后, JavaScript 引擎便开始执行全局代码了. 首先会执行 `a = 2` 的赋值操作, 执行该语句会将全局上下文变量环境中 a 的值设置为 2.
3. 接着调用 addAll 函数. 当调用该函数时, JavaScript 引擎会编译该函数, 并为其创建一个执行上下文, 最后还将该函数的执行上下文压入栈中.
4. addAll 函数的执行上下文创建好之后, 便进入了函数代码的执行阶段了, 这里先执行的是 d=10 的赋值操作, 执行语句会将 addAll 函数执行上下文中的 d 由 undefined 变成了 10.
5. 当执行到 add 函数调用语句时, 同样会为其创建执行上下文, 并将其压入调用栈, 当 add 函数返回时, 该函数的执行上下文就会从栈顶弹出, 并将 result 的值设置为 add 函数的返回值, 也就是 9
6. 紧接着 addAll 执行最后一个相加操作后并返回, addAll 的执行上下文也会从栈顶部弹出, 此时调用栈中就只剩下全局上下文了, 整个 JavaScript 流程执行结束了

![执行图](https://edge.yancey.app/beg/vuiuq6ua-1650205890104.jpeg)

### 利用调用栈调试指南

通过在 Source 中打断点, 这时可以通过右边“ `call stack` 来查看当前的调用栈的情况, 如下图:

![Source 断点](https://edge.yancey.app/beg/oq4xknmu-1650206989381.webp)

除了通过断点来查看调用栈, 你还可以使用 `console.trace()` 来输出当前的函数调用关系, 如下图:

![console.trace()](https://edge.yancey.app/beg/rep90r1f-1650206979053.webp)

### 栈溢出

现在你知道了调用栈是一种用来管理执行上下文的数据结构, 符合后进先出的规则. 不过还有一点你要注意, 调用栈是有大小的, 当入栈的执行上下文超过一定数目, JavaScript 引擎就会报错, 我们把这种错误叫做栈溢出. 这是因为这个函数是递归的, 并且没有任何终止条件, 所以它会一直创建新的函数执行上下文, 并反复将其压入栈中, 但栈是有容量限制的, 超过最大数量后就会出现栈溢出的错误. 除了对代码做出改进, 目前引擎都实现了尾递归优化, 可以利用这一点来避免爆栈 333333333333333333333333.

![栈溢出](https://edge.yancey.app/beg/tgfm7a8f-1650210260724.jpg)

## 闭包

> 闭包是指那些能够访问独立(自由)变量的函数(变量在本地使用, 但定义在一个封闭的作用域中). 换句话说, 这些函数可以「记忆」它被创建时候的环境. -- MDN
>
> 闭包是有权访问另一个函数作用域的函数. -- 《JavaScript 高级程序设计(第 3 版)》
>
> 函数对象可以通过作用域链相互关联起来, 函数体内部的变量都可以保存在函数作用域内, 这种特性在计算机科学文献中称为闭包. -- 《JavaScript 权威指南(第 6 版)》
>
> 当函数可以记住并访问所在的词法作用域时, 就产生了闭包, 即使函数是在当前词法作用域之外执行. -- 《你不知道的 JavaScript(上卷)》

似乎最后一个解释更容易理解, 所以我们从"记住并访问"来学习闭包.

### 何为"记住"

在 JavaScript 中, 如果函数被调用过了, 并且以后不会被用到, 那么垃圾回收机制(后面会说到)就会销毁由函数创建的作用域. 我们知道, 引用类型的变量只是一个指针, 并不会把真正的值拷贝给变量, 而是把对象所在的**位置**传递给变量. 因此, 当函数被传递到一个还未销毁的作用域的某个变量时, 由于变量存在, 所以函数会存在, 又因为函数的存在依赖于函数所在的词法作用域, 所以函数所在的词法作用域也会存在, 这样一来, 就"记住"了该词法作用域.

看下面这个例子. 在执行 `apple` 函数时, 将 `output` 的引用作为参数传递给了 `fruit` 函数的 `arg`, 因此在 `fruit` 函数执行期间, `arg` 是存在的, 所以 `output` 也是存在的, 而 `output` 依赖的 `apple` 函数产生的局部作用域也是存在. 这也就是 `output` 函数"记住"了 `apple` 函数作用域的原因.

```js
function apple() {
  var count = 0;
  function output() {
    console.log(count);
  }
  fruit(output);
}
function fruit(arg) {
  console.log("fruit");
}
apple(); // fruit
```

### "记住" 并 "访问"

但上面的例子并不是完整的"闭包", 因为只是"记住"了作用域, 但没有去"访问"这个作用域. 我们稍微改造一下上面这个例子, 在 `fruit` 函数中执行 `arg` 函数, 实际就是执行 `output`, 并且还访问了 `apple` 函数中的 `count` 变量.

```js
function apple() {
  var count = 0;
  function output() {
    console.log(count);
  }
  fruit(output);
}

function fruit(arg) {
  arg();
}

apple(); // 0
```

### 循环和闭包

下面是一道经典的面试题. 我们希望代码输出 0 ～ 4, 每秒一次, 每次一个. 但实际上, 这段代码在运行时会以每秒一次的频率输出五次 5.

```js
for (var i = 0; i < 5; i++) {
  setTimeout(function timer() {
    console.log(i);
  }, i * 1000);
}
```

因为 setTimeout 是异步执行的, 1000 毫秒后向任务队列里添加一个任务, 只有主线程上的任务全部执行完毕才会执行任务队列里的任务, 所以当主线程 for 循环执行完之后 i 的值为 5, 而用这个时候再去任务队列中执行任务, 因此 i 全部为 5. 又因为在 for 循环中使用 `var` 声明的 `i` 是在全局作用域中, 因此 `timer` 函数中打印出来的 `i` 自然是都是 5.

我们可以通过在迭代内使用 IIFE 来给每个迭代都生成一个新的作用域, 使得延迟函数的回调可以将新的作用域封闭在每个迭代内部, 每个迭代中都会含有一个具有正确值的变量供我们访问.
代码如下所示.

```js
for (var i = 0; i < 5; i++) {
  (function (j) {
    setTimeout(function timer() {
      console.log(j);
    }, j * 1000);
  })(i);
}
```

如果你 API 看得仔细的话, 还可以写成下面的形式:

```js
for (var i = 0; i < 5; i++) {
  setTimeout(
    function (j) {
      console.log(j);
    },
    i * 1000,
    i
  );
}
```

当然最好的方式是使用 let 声明 i, 这时候变量 i 就能作用于这个循环块, 每个迭代都会使用上一个迭代结束的值来初始化这个变量.

```js
for (let i = 0; i < 5; i++) {
  setTimeout(function timer() {
    console.log(i);
  }, i * 1000);
}
```

### 从词法作用域的角度理解闭包

```ts
function foo() {
  var myName = "极客时间";
  let test1 = 1;
  var innerBar = {
    getName: function () {
      console.log(test1);
      return myName;
    },
    setName: function (newName) {
      myName = newName;
    },
  };
  return innerBar;
}
var bar = foo();
bar.setName("极客邦");
bar.getName(); // 1
console.log(bar.getName()); // 1 极客邦
```

根据词法作用域的规则, 内部函数 getName 和 setName 总是可以访问它们的外部函数 foo 中的变量, 所以当 innerBar 对象返回给全局变量 bar 时, 虽然 foo 函数已经执行结束, 但是 getName 和 setName 函数依然可以使用 foo 函数中的变量 myName 和 test1.

foo 函数执行完成之后, 其执行上下文从栈顶弹出了, 但是由于返回的 setName 和 getName 方法中使用了 foo 函数内部的变量 myName 和 test1, 所以这两个变量依然保存在内存中. 这像极了 setName 和 getName 方法背的一个**专属背包**, 无论在哪里调用了 setName 和 getName 方法, 它们都会背着这个 foo 函数的专属背包.

之所以是**专属背包**, 是因为除了 setName 和 getName 函数之外, 其他任何地方都是无法访问该背包的, 我们就可以把这个背包称为 foo 函数的**闭包**.

在 JavaScript 中, 根据词法作用域的规则, 内部函数总是可以访问其外部函数中声明的变量, 当通过调用一个外部函数返回一个内部函数后, 即使该外部函数已经执行结束了, 但是内部函数引用外部函数的变量依然保存在内存中, 我们就把这些变量的集合称为闭包. 比如外部函数是 foo, 那么这些变量的集合就称为 foo 函数的闭包.

那这些闭包是如何使用的呢? 当执行到 `bar.setName` 方法中的 `myName = "极客邦"` 这句代码时, JavaScript 引擎会沿着 **当前执行上下文 –> foo 函数闭包 –> 全局执行上下文** 的顺序来查找 myName 变量. 同样的流程, 当调用 bar.getName 的时候, 所访问的变量 myName 也是位于 foo 函数闭包中的.

![闭包](https://edge.yancey.app/beg/lgr3ye21-1650222691372.webp)

你可以通过打断点来了解闭包. 从图中可以看出来, 当调用 bar.getName 的时候, 右边 Scope 项就体现出了作用域链的情况: Local 就是当前的 getName 函数的作用域, Closure(foo) 是指 foo 函数的闭包, 最下面的 Global 就是指全局作用域, 从 **Local–>Closure(foo)–>Global** 就是一个完整的作用域链.

### 闭包回收

如果引用闭包的函数是一个全局变量, 那么闭包会一直存在直到页面关闭; 但如果这个闭包以后不再使用的话, 就会造成内存泄漏. 如果引用闭包的函数是个局部变量, 等函数销毁后, 在下次 JavaScript 引擎执行垃圾回收时, 判断闭包这块内容如果已经不再被使用了, 那么 JavaScript 引擎的垃圾回收器就会回收这块内存.

所以在使用闭包的时候, 如果该闭包会一直使用, 那么它可以作为全局变量而存在; 但如果使用频率不高, 而且占用内存又比较大的话, 那就尽量让它成为一个局部变量.

## 垃圾回收

上面提到, 函数被调用过了, 并且以后不会被用到, 那么垃圾回收机制就会销毁由函数创建的作用域. JavaScript 有两种垃圾回收机制, 即 **标记清除** 和 **引用计数**, 对于现代浏览器, 绝大多数都会采用 **标记清除**.

### 标记清除

垃圾收集器在运行的时候会给存储在内存中的所有变量加上标记, 然后它会去掉环境中变量以及被环境中的变量引用的变量的标记. 而在此之后再被加上标记的变量将被视为准备删除的变量, 原因是环境中的变量已经无法访问到这些变量了. 最后, 垃圾收集器完成内存清除工作, 销毁那些带标记的值并且回收它们所占用的内存空间.

### 引用计数

引用计数是跟踪记录每个值被引用的次数. 当声明了一个变量并将一个引用类型值赋给该变量时, 这个值得引用次数就是 1;相反, 如果包含对这个值引用的变量又取得了另外一个值, 则这个值得引用次数减 1;下次运行垃圾回收器时就可以释放那些引用次数为 0 的值所占用的内存. 缺点: **循环引用**会导致引用次数永远不为 0.

## 总结

Q: 什么是作用域？

A: 作用域是根据名称查找变量的一套规则.

Q: 什么是作用域链？

A: 当一个块或函数嵌套在另一个块或另一个函数中时, 就发生了作用域嵌套. 因此, 在当前作用域下找不到某个变量时, 会往外层嵌套的作用域继续查找, 直到找到该变量或抵达全局作用域, 如果在全局作用域中还没找到就会报错. 这种逐级向上查找的模式就是作用域链.

Q: 什么是闭包？

A: 当函数可以记住并访问所在的词法作用域时, 就产生了闭包, 即使函数是在当前词法作用域之外执行.

## 最后

导致这篇文章写这么长的根本原因就是 ~~面试~~ 该死的 `var` 关键字! 它就是一个设计错误！不要去用它!

![卑微](https://edge.yancey.app/beg/me8Sqe9R.jpg)

以一道笔试题收尾: 写一个函数, 第一次调用返回 0, 之后每次调用返回比之前大 1. 这道题不难, 主要是在考察闭包和立即执行函数. 我写的答案如下, 如果你有更好的方案请在评论区分享.

```js
const add = (() => {
  let num = 0;
  return () => num++;
})();
```

## 参考

《JavaScript 高级程序设计 (第三版)》 —— Nicholas C. Zakas

《深入理解 ES6》 —— Nicholas C. Zakas

《你不知道的 JavaScript (上卷)》—— Kyle Simpson

[javascript 的词法作用域](https://js8.in/2011/08/15/javascript%E7%9A%84%E8%AF%8D%E6%B3%95%E4%BD%9C%E7%94%A8%E5%9F%9F/)

[《JavaScript 闯关记》之作用域和闭包](https://juejin.im/post/58500a02128fe10069319d83)

[深入理解 JavaScript 作用域和作用域链](https://juejin.im/post/5c8290455188257e5d0ec64)

[JavaScript 编译原理, 编译器, 引擎及作用域](https://www.jianshu.com/p/5ebf2ad6def2)

[作用域闭包, 你真的懂了吗？](https://i-solar.github.io/2016/11/05/%E4%BD%9C%E7%94%A8%E5%9F%9F%E9%97%AD%E5%8C%85%EF%BC%8C%E4%BD%A0%E7%9C%9F%E7%9A%84%E6%87%82%E4%BA%86%E5%90%97%EF%BC%9F-JavaScript/)

---

欢迎关注我的公众号: 进击的前端

![Yancey_FE](https://edge.yancey.app/beg/qrcode_for_gh_541158abcb21_344.jpg)
