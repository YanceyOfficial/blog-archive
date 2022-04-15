# 从 JavaScript 编译原理到作用域(链)及闭包

> 虽然作用域的相关知识是 JavaScript 的基础, 但要彻底理解必须要从原理入手. 从面试角度来讲, 词法/动态作用域, 作用域(链), 变量/函数提升, 闭包, 垃圾回收 实属一类题目, 打通这几个概念并熟练掌握, 面试基本就不用担心这一块了. 这篇文章是对《JavaScript 高级程序设计 (第三版)》第四章, 同样也是 《你不知道的 JavaScript (上卷)》第一部分的学习和总结.

## 编译原理

对于大部分编程语言, 编译大致有三个步骤.

* 分词/词法分析 (Tokenizing/Lexing)此过程将源代码分解成 `词法单元 (token)`, 如代码 `const firstName = 'Yancey'` 会被分解成 `const`, `firstName`, `=`, `'Yancey'`, 空格是否会被当成词法单元, 取决于空格对这门语言的意义. 这里推荐一个网站 [Parser](http://esprima.org/demo/parse.html#) 可以用来解析 JavaScript 的源代码. 对于这个例子, 分词结构如下.

``` js
[
  {
    type: 'Keyword',
    value: 'const',
  },
  {
    type: 'Identifier',
    value: 'firstName',
  },
  {
    type: 'Punctuator',
    value: '=',
  },
  {
    type: 'String',
    value: "'Yancey'",
  },
];

```

* 解析/语法分析 (Parsing)这个过程将词法单元流转换成一棵 **抽象语法树** (Abstract Syntax Tree, AST). 语法分析会根据 ECMAScript 的标准来解析成 AST, 比如你写了 `const new = 'Yancey'`, 就会报错 **Uncaught SyntaxError: Unexpected token new**.对于上面那个例子, 生成的 AST 如下图所示, 其中 `Identifier` 代表着变量名, `Literal` 代表着变量的值.

![AST](https://static.yancey.app/Jietu20190405-233819%402x.jpg)

* 代码生成这个阶段就是将 AST 转换为可执行代码, 像 V8 引擎会将 JavaScript 字符串编译成二进制代码(创建变量, 分配内存, 将一个值存储到变量里...)

除上面三个阶段之外, JavaScript 引擎还对 **语法分析**, **代码生成**, **编译过程** 进行一些优化, 这一块估计得看 v8 源码了, 先留个坑. 有个库叫做 [Acorn](https://github.com/acornjs/acorn), 用来解析 JavaScript 代码, 像 webpack, eslint 都有用到, 有时间可以玩一玩.

## 词法作用域和动态作用域

作用域有两种模型, 一种是 **词法作用域(Lexical Scope)**, 另一种是 **动态作用域 (Dynamic Scope)**.

词法作用域是定义在词法阶段的作用域, 换句话说就是你写代码时将变量和块作用域写在哪里决定的. JavaScript 可以通过 `eval` 和 `with` 来改变词法作用域, 但这两种会导致引擎无法在编译时对作用域查找进行优化, 因此不要使用它们.

而动态作用域是在运行时定义的, 最典型的就是 this 了.

## 作用域

不管是编译阶段还是运行时, 都离不开 **引擎**, **编译器**, **作用域**.

* 引擎用来负责 JavaScript 程序的编译和执行.

* 编译器负责语法分析, 代码生成等工作.

* 作用域用来收集并维护所有变量访问规则.

以代码 `const firstName = 'Yancey'` 为例, 首先编译器遇到 `const firstName`, 会询问 **作用域** 是否已经有一个同名变量在当前作用域集合, 如果有编译器则忽略该声明, 否则它会在当前作用域的集合中声明一个新的变量并命名为 `firstName`.

接着编译器会为引擎生成运行时所需的代码, 用于处理 `firstName = 'Yancey'` 这个赋值操作. 引擎会先询问作用域, 在当前作用域集合中是否有个变量叫 `firstName`. 如果有, 引擎就会使用这个变量, 否则继续往上查找.

引擎在作用域中查找元素时有两种方式: `LHS` 和 `RHS`. 一般来讲, `LHS` 是赋值阶段的查找, 而 `RHS` 就是纯粹查找某个变量.

看下面这个例子.

``` js
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

* **最外层函数**和**在最外层函数外面**定义的变量拥有全局作用域

* 所有末定义直接赋值的变量自动声明为拥有全局作用域

* 所有 window 对象的属性拥有全局作用域

``` js
const a = 1; // 全局变量

// 全局函数
function foo() {
  b = 2; // 未定义却赋初值被认为是全局变量

  const name = 'yancey'; // 局部变量

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

``` js
function foo() {
  const name = 'Yancey';
  function sayName() {
    console.log(`Hello, ${name}`);
  }
  sayName();
}

foo(); // 'Hello, Yancey'

console.log(name); // 外部无法访问到内部变量
sayName(); // 外部无法访问到内部函数

```

值得注意的是, if, switch, while, for 这些条件语句或者循环语句不会创建新的作用域, 虽然它也有一对 `{}` 包裹. 能不能访问的到内部变量取决于声明方式(var 还是 let/const)

``` js
if (true) {
  var name = 'yancey';
  const age = 18;
}

console.log(name); // 'yancey'

console.log(age); // 报错

```

### 块级作用域

我们知道 let 和 const 的出现改变了 JavaScript 没有块级作用域的情况(具体可以看高程三的第 76 页, 那个时候还没有块级作用域的概念). 关于 let 和 const 不去细说, 这两个再不懂的话... 不过后面会介绍到**临时死区**的概念.

此外, `try/catch` 的 `catch` 分句也会创建一个块级作用域, 看下面一个例子:

``` js
try {
  noThisFunction(); // 创造一个异常
} catch (e) {
  console.log(e); // 可以捕获到异常
}

console.log(e); // 报错, 外部无法拿到 e

```

## 提升

在 ES6 之前的"蛮荒时代", 变量提升在面试中经常被问到, 而 let 和 const 的出现解决了变量提升问题. 但函数提升一直是存在的, 这里我们从原理入手来分析一下提升.

### 变量提升

我们回忆一下关于编译器的内容, 引擎会在解释 JavaScript 代码之前首先对其进行编译, 编译阶段的一部分工作就是找到所有的声明, 并且使用合适的作用域将它们串联起来. 换句话说, 变量和函数在内的所有声明都会在代码执行前被处理.

因此, 对于代码 `var i = 2;` 而言, JavaScript 实际上会将这句代码看作 `var i;` 和 `i = 2`, 其中第一个是在编译阶段, 第二个赋值操作会原地等待执行阶段. 换句话说, 这个过程将会把变量和函数声明放到其作用域的顶部, 这个过程就叫做提升.

可能你会有疑问, 为什么 let 和 const 不存在变量提升呢？这是因为在编译阶段, 当遇到变量声明时, 编译器要么将它提升至作用域顶部(var 声明), 要么将它放到 **临时死区(temporal dead zone, TDZ)**, 也就是用 let 或 const 声明的变量. **访问 TDZ 中的变量会触发运行时的错误**, 只有执行过变量声明语句后, 变量才会从 TDZ 中移出, 这时才可访问.

下面这个例子你能不能全部答对.

``` js
typeof null; // 'object'

typeof []; // 'object'

typeof someStr; // 'undefined'

typeof str; // Uncaught ReferenceError: str is not defined
const str = 'Yancey';

```

第一个, 因为 `null` 根本上是一个指针, 所以会返回 `'object'`. 深层次一点, 不同的对象在底层都表示为二进制, 在 Javascript 中二进制前三位都为 0 的会被判断为 Object 类型, null 的二进制全为 0, 自然前三位也是 0, 所以执行 typeof 时会返回 `'object'`.

第二个想强调的是, typeof 判断一个引用类型的变量, 拿到的都是 `'object'`, 因此该操作符无法正确辨别具体的类型, 如 Array 还是 RegExp.

第三个, 当 typeof 一个 **未声明** 的变量, 不会报错, 而是返回 'undefined'

第四个, `str` 先是存在于 TDZ, 上面说到访问 TDZ 中的变量会触发运行时的错误, 所以这段代码直接报错.

### 函数提升

函数声明和变量声明都会被提升, 但值得注意的是, 函数首先被提升, 然后才是变量.

``` js
test();

function test() {
  foo();
  bar();
  var foo = function() {
    console.log("this won't run!");
  };
  function bar() {
    console.log('this will run!');
  }
}

```

上面的代码会变成下面的形式: 内部的 `bar` 函数会被提升到顶部, 所以可以被执行到;接下来变量 `foo` 会被提升到顶部, 但变量无法执行, 因此执行 `foo()` 会报错.

``` js
function test() {
  var foo;
  function bar() {
    console.log('this will run!');
  }
  foo();
  bar();
  foo = function() {
    console.log("this won't run!");
  };
}
test();

```

### 变量提升与 JavaScript 代码的执行流程

```ts
showName()
console.log(myname)
var myname = '极客时间'
function showName() {
    console.log('函数showName被执行');
}
```

之所以有变量提升和函数提升, 这跟 JavaScript 代码的执行流程有关. 变量和函数声明在代码里的位置是不会改变的, 而且是在编译阶段被 JavaScript 引擎放入内存中. 之所以有变量提升和函数提升, 一段 JavaScript 代码在执行之前需要被 JavaScript 引擎编译, 编译完成之后, 才会进入执行阶段.

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
showName()
console.log(myname)
var myname = '极客时间'
function showName() {
    console.log('函数showName被执行');
}
```

* 第 1 行和第 2 行, 由于这两行代码不是声明操作, 所以 JavaScript 引擎不会做任何处理;
* 第 3 行, 由于这行是经过 var 声明的, 因此 JavaScript 引擎将在环境对象中创建一个名为 myname 的属性, 并使用 undefined 对其初始化;
* 第 4 行, JavaScript 引擎发现了一个通过 function 定义的函数, 所以它将函数定义存储到堆(HEAP）中, 并在环境对象中创建一个 showName 的属性, 然后将该属性值指向堆中函数的位置.

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

``` js
function apple() {
  var count = 0;
  function output() {
    console.log(count);
  }
  fruit(output);
}
function fruit(arg) {
  console.log('fruit');
}
apple(); // fruit

```

### "记住" 并 "访问"

但上面的例子并不是完整的"闭包", 因为只是"记住"了作用域, 但没有去"访问"这个作用域. 我们稍微改造一下上面这个例子, 在 `fruit` 函数中执行 `arg` 函数, 实际就是执行 `output`, 并且还访问了 `apple` 函数中的 `count` 变量.

``` js
function apple() {
  var count = 0;
  function output() {
    console.log(count);
  }
  fruit(output);
}

function fruit(arg) {
  arg(); // 这就是闭包！
}

apple(); // 0

```

### 循环和闭包

下面是一道经典的面试题. 我们希望代码输出 0 ～ 4, 每秒一次, 每次一个. 但实际上, 这段代码在运行时会以每秒一次的频率输出五次 5.

``` js
for (var i = 0; i < 5; i++) {
  setTimeout(function timer() {
    console.log(i);
  }, i * 1000);
}

```

因为 setTimeout 是异步执行的, 1000 毫秒后向任务队列里添加一个任务, 只有主线程上的任务全部执行完毕才会执行任务队列里的任务, 所以当主线程 for 循环执行完之后 i 的值为 5, 而用这个时候再去任务队列中执行任务, 因此 i 全部为 5. 又因为在 for 循环中使用 `var` 声明的 `i` 是在全局作用域中, 因此 `timer` 函数中打印出来的 `i` 自然是都是 5.

我们可以通过在迭代内使用 IIFE 来给每个迭代都生成一个新的作用域, 使得延迟函数的回调可以将新的作用域封闭在每个迭代内部, 每个迭代中都会含有一个具有正确值的变量供我们访问.
代码如下所示.

``` js
for (var i = 0; i < 5; i++) {
  (function(j) {
    setTimeout(function timer() {
      console.log(j);
    }, j * 1000);
  })(i);
}

```

如果你 API 看得仔细的话, 还可以写成下面的形式:

``` js
for (var i = 0; i < 5; i++) {
    setTimeout(function(j) {
        console.log(j);
    }, i * 1000, i);
}

```

当然最好的方式是使用 let 声明 i, 这时候变量 i 就能作用于这个循环块, 每个迭代都会使用上一个迭代结束的值来初始化这个变量.

``` js
for (let i = 0; i < 5; i++) {
  setTimeout(function timer() {
    console.log(i);
  }, i * 1000);
}

```

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

![卑微](https://static.yancey.app/me8Sqe9R.jpg)

以一道笔试题收尾: 写一个函数, 第一次调用返回 0, 之后每次调用返回比之前大 1. 这道题不难, 主要是在考察闭包和立即执行函数. 我写的答案如下, 如果你有更好的方案请在评论区分享.

``` js
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

- - -

欢迎关注我的公众号: 进击的前端

![Yancey_FE](https://static.yancey.app/qrcode_for_gh_541158abcb21_344.jpg)
