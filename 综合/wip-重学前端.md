# 重学前端

## 目标

一是立足标准, 系统性总结和整理前端知识, 建立自己的认知和方法论; 二是放眼团队, 从业务和工程角度思考前端团队的价值和发展需要.

## 知识图谱

![知识图谱](https://edge.yancey.app/beg/vuskujcg-1641221332611.jpg)

对于任何计算机语言来说, 必定是**用规定的文法, 去表达特定语义, 最终操作运行时**的一个过程. 而 **程序 = 算法 + 数据结构**, 对运行时来说, 类型就是数据结构, 执行过程就是算法.

- 文法
  - 词法
  - 语法
- 语义
- 运行时
  - 类型
  - 执行过程

而对于 HTML, 大致分为以下几个部分:

1. 文档元信息: 通常是出现在 head 标签中的元素, 包含了描述文档自身的一些信息;
2. 语义相关: 扩展了纯文本, 表达文章结构、不同语言要素的标签;
3. 链接: 提供到文档内和文档外的链接;
4. 替换型标签: 引入声音、图片、视频等外部元素替换自身的一类标签;
5. 表单: 用于填写和提交信息的一类标签;
6. 表格: 表头、表尾、单元格等表格的结构.

## JavaScript

### Undefiend 和 void 0

undefiend 在 JavaScript 中是一个**变量**, 而非关键字, 因此执行 `let undefined = 1;` 是可以的, 为了防止这个问题, 就有了 `void 0` 来代替 undefined.

### String

String 有最大长度是 2^53 - 1, 即 9007199254740991, 其实和 `Number.MAX_SAFE_INTEGER` 相等. 这个所谓最大长度, 并不完全是你理解中的字符数, 因为 String 的意义并非"字符串", 而是字符串的 UTF16 编码, 我们字符串的操作 charAt、charCodeAt、length 等方法针对的都是 UTF16 编码. 所以, 字符串的最大长度, 实际上是受字符串的编码长度影响的.

### Number

JavaScript 中的 Number 类型基本符合 IEEE 754-2008 规定的双精度浮点数规则, 但是 JavaScript 为了表达几个额外的语言场景(比如不让除以 0 出错, 而引入了无穷大的概念), 规定了几个例外情况:

- NaN, 占用了 9007199254740990, 这原本是符合 IEEE 规则的数字
- Infinity, 无穷大
- Infinity, 负无穷大

```ts
console.log(NaN === NaN); // false
console.log(Object.is(NaN, NaN)); // true
console.log(+0 === -0); // true
console.log(Object.is(+0, -0)); // false
```

根据双精度浮点数的定义, Number 类型中有效的整数范围是 -0x1fffffffffffff 至 0x1fffffffffffff, 所以 Number 无法精确表示此范围外的整数, 这些应该使用 BigInt 来表示. 根据 IEEE 的定义, number 运算会被转换为二进制进行运算, 而后转换为十进制; 0.1 转换后会变成无限循环小数, 即浮点数运算精度问题. 这也是经典的 0.1 + 0.2 为什么不等于 0.3, 当然你可以用下面两种方式来解决, 或者每个数字都乘以 10 再比较.

```ts
Math.abs(0.1 + 0.2 - 0.3) <= Number.EPSILON;
```

### Symbol

symbol 用于创建一个独一无二的值, 可以用于做唯一标识, 也可以用于描述对象的属性(最重要的特性就是用语匿名属性).

```ts
const symbol = Symbol("an anonymous variable");
const symbol1 = Symbol("an anonymous1 variable");
const symbol2 = Symbol("an anonymous2 variable");

const o = {
  a: 1,
  symbol: 2,
};

// 需要注意的是, 只有手动往对象中添加 symbol 的 key,
// Object.getOwnPropertySymbols() 才能获取到的
// 初始化对象时添加的 symbol 的 key 是不能被 Object.getOwnPropertySymbols() 获取到的
o[symbol1] = 3;

Object.defineProperty(o, symbol2, {
  value: "hello",
});

const keys = Object.keys(o); // [ 'a', 'symbol' ] 注意这个 symbol 是个字符串字面量, 不是那个真实的 symbol
const values = Object.values(o); // [ 1, 2 ] 能拿到初始化时创建的 symbol 的值, 但不能获取后续手动添加的 symbol 的值
const keys2 = Object.getOwnPropertyNames(o); // [ 'a', 'symbol' ] 注意这个 symbol 是个字符串字面量, 不是那个真实的 symbol
const keys3 = Object.getOwnPropertySymbols(o); // [ Symbol(an anonymous1 variable), Symbol(an anonymous2 variable) ]
```

此外, 部署了 Symbol.iterator 的对象可以使用 for...of, 原本只有 Array, Map 等可以使用 for...of, 对象是不可以的.

```ts
var o = new Object();

o[Symbol.iterator] = function () {
  var v = 0;
  return {
    next: function () {
      return { value: v++, done: v > 10 };
    },
  };
};

for (var v of o) {
  console.log(v); // 0 1 2 3 ... 9
}
```

### Object

3 与 new Number(3) 是完全不同的值, 它们一个是 Number 类型, 一个是对象类型. Number, String 和 Boolean, 三个构造器是两用的, 当跟 new 搭配时, 它们产生对象, 当直接调用时, 它们表示强制类型转换. Symbol 函数比较特殊, 直接用 new 调用它会抛出错误, 但它仍然是 Symbol 对象的构造器.

![类型转换](https://edge.yancey.app/beg/3e4lm1zt-1641739086767.webp)

#### String2Number

有三种方式可以将字符串转换为数字, 分别是:

- Number
- parseInt
- parseFloat.

```ts
parseFloat("0.0314E+2"); // 3.14(可以正确处理科学计数法)
parseInt("314E+2"); // 314(对科学计数法不感冒)
Number("0.0314E+2"); // 3.14(可以正确处理科学计数法)

parseInt("0xff", 16); // 255(可以正确处理非十进制)
parseFloat("0xff"); // 0(无法正确处理非十进制)
Number("0xff"); // 255(可以正确处理非十进制)
```

可见 Number 更加的通用好使.

#### Number2String

注意一点就好, 较大的数字会被转成科学计数法.

```ts
String(10000000000000000000000); // '1e+22'
```

#### 装箱和拆箱

所谓装箱就是将基本类型转换为对象类型, 拆箱就是将对象类型转换为基本类型.

装箱分为显式装箱和隐式装箱. 显式装箱是指主动将基本类型转换为对象类型. 而隐式装箱是运行时自动完成的.
JavaScript 的字符串字面量原本是无法调用任何方法的, 只有字符串对象才能调用方法. 这就涉及到隐式装箱.

```ts
// 显式装箱
var a = new Number(1);

// 显式装箱
// 虽然 Symbol 没有 new, 但可以用如下操作获取 Symbol 对象
var symbolObject = function () {
  return this;
}.call(Symbol("a"));

// 显式装箱
// 如下操作也可以获取 Symbol 对象
Object(Symbol("a"));

// 隐式装箱
var num = 123;
num.toFixed(2);

// var c = new Number(123);
// c.toFixed(2);
// c = null;
```

每一类装箱对象皆有私有的 Class 属性, 这些属性可以用 Object.prototype.toString 获取, 这也是获取数据类型最准确的方式. 但需要注意的是, call 本身会产生装箱操作, 所以需要配合 typeof 来区分基本类型还是对象类型.

```ts
var symbolObject = Object(Symbol("a"));
console.log(Object.prototype.toString.call(symbolObject)); //[object Symbol]
```

在 JavaScript 标准中, 规定了 ToPrimitive 函数, 它是对象类型到基本类型的转换(即拆箱转换).

对象到 String 和 Number 的转换都遵循"先拆箱再转换"的规则. 通过拆箱转换, 把对象变成基本类型, 再从基本类型转换为对应的 String 或者 Number.

拆箱转换会尝试调用 valueOf 和 toString 来获得拆箱后的基本类型. 如果 valueOf 和 toString 都不存在, 或者没有返回基本类型, 则会产生类型错误 TypeError.

其中 Object2Number 是先执行 valueOf 再执行 toString.

```ts
var o = {
  valueOf: () => {
    console.log("valueOf");
    return {};
  },
  toString: () => {
    console.log("toString");
    return {};
  },
};

o * 2;
// valueOf
// toString
// TypeError
```

而 Object2String 是先执行 toString 再执行 valueOf.

```ts
var o = {
  valueOf: () => {
    console.log("valueOf");
    return {};
  },
  toString: () => {
    console.log("toString");
    return {};
  },
};

String(o);
// toString
// valueOf
// TypeError
```

在 ES6 后, 还可以使用 Symbol.toPrimitive 来覆盖 valueOf.

```ts
var o = {
  valueOf: () => {
    console.log("valueOf");
    return {};
  },
  toString: () => {
    console.log("toString");
    return {};
  },
};

o[Symbol.toPrimitive] = () => {
  console.log("toPrimitive");
  return "hello";
};

console.log(o + "");
// toPrimitive
// hello

console.log(o * 2);
// toPrimitive
// NaN
```

这里简单说下 valueOf, 它用来返回值为该对象的原始值, JavaScript 的许多内置对象都重写了该函数, 以实现更适合自身的功能需要:

| 对象    | 返回值                                                 |
| ------- | ------------------------------------------------------ |
| Array   | 返回数组对象本身                                       |
| Boolean | 布尔值                                                 |
| Date    | 存储的时间是从 1970 年 1 月 1 日午夜开始计的毫秒数 UTC |
| Number  | 数字值                                                 |
| Object  | 对象本身, 这是默认情况                                 |
| String  | 字符串值                                               |
|         | Math 和 Error 对象没有 valueOf 方法                    |

#### 规范类型

- List 和 Record: 用于描述函数传参过程.
- Set: 主要用于解释字符集等.
- Completion Record: 用于描述异常、跳出等语句执行过程.
- Reference: 用于描述对象属性访问、delete 等.
- Property Descriptor: 用于描述对象的属性.
- Lexical Environment 和 Environment Record: 用于描述变量和作用域.
- Data Block: 用于描述二进制数据.

#### typeof

尤其注意 `typeof null === "object"`, 因为 `null` 是一个对象. 此外还有 `typeof function(){} === "function"`

![typeof](https://edge.yancey.app/beg/qa48ri2i-1641831313173.webp)

#### JavaScript 对象的两类属性

[你可能不知道的 Object.defineProperty()](https://www.yanceyleo.com/post/9a055382-39a0-4c0b-9148-12d6da2852ed)

可以通过 Object.defineProperty() 来定义属性描述, 可以通过 Object.getOwnPropertyDescriptor() 来查看属性描述.

数据属性:

- value: 就是属性的值.
- writable: 决定属性能否被赋值.
- enumerable: 决定 for in 能否枚举该属性.
- configurable: 决定该属性能否被删除或者改变特征值.

访问器属性:

- getter: 函数或 undefined, 在取属性值时被调用.
- setter: 函数或 undefined, 在设置属性值时被调用.
- enumerable: 决定 for in 能否枚举该属性.
- configurable: 决定该属性能否被删除或者改变特征值.

```ts
var o = { a: 1 };
Object.defineProperty(o, "b", {
  value: 2,
  writable: false,
  enumerable: false,
  configurable: true,
});
Object.getOwnPropertyDescriptor(o, "a"); // {value: 1, writable: true, enumerable: true, configurable: true}
Object.getOwnPropertyDescriptor(o, "b"); // {value: 2, writable: false, enumerable: false, configurable: true}
o.b = 3; // 无法改变
console.log(o.b); // 2

// getter / setter
var o = {
  get a() {
    return 1;
  },
  set a(v) {
    this._a = v;
  },
};

console.log(o.a); // 1
o.a = 2;
console.log(o._a); // 2z
```

#### 通过 Symbol.toStringTag 来表示该对象的自定义类型标签

```ts
var o = { [Symbol.toStringTag]: "MyObject" };
o.toString(); // "[object MyObject]"

class ValidatorClass {
  get [Symbol.toStringTag]() {
    return "Validator";
  }
}

Object.prototype.toString.call(new ValidatorClass()); // "[object Validator]"
```

#### 复习下 new

- 以构造器的 prototype 属性为原型, 创建新对象
- 将 this 和调用参数传给构造器, 执行
- 如果构造器返回的是对象, 则返回, 否则返回第一步创建的对象

```ts
function myNew(Con, ...args) {
  var obj = Object.create(Con.prototype);
  var ret = Con.apply(obj, args);
  return typeof ret === "object" ? ret : obj;
}
```

#### 复习下 Object.create()

用于根据某个对象的原型来创建对象. 下面的 polyfill 无法做到与原生的 Object.create 一致, 一个是不支持第二个参数, 另一个是不支持 null 作为原型.

```ts
function myCreate(prototype) {
  var F = function () {};
  cls.prototype = prototype;
  return new F();
}
```

#### JavaScript 中的对象分类

- 宿主对象（host Objects）: 由 JavaScript 宿主环境提供的对象, 它们的行为完全由宿主环境决定.
- 内置对象（Built-in Objects）: 由 JavaScript 语言提供的对象.
  - 固有对象（Intrinsic Objects ）: 由标准规定, 随着 JavaScript 运行时创建而自动创建的对象实例.
  - 原生对象（Native Objects）: 可以由用户通过 Array、RegExp 等内置构造器或者特殊语法创建的对象.
  - 普通对象（Ordinary Objects）: 由对象字面量、Object 构造器或者 class 关键字定义类创建的对象, 它能够被原型继承.

#### 宿主对象

所谓宿主对象就是指除了 JS 内置对象, 浏览器或 Node.js 提供的那些对象. 像浏览器中, window 会挂载 JS 内置对象和 W3C 的各种标准中规定了 Window 对象的其它属性.

宿主对象也分为固有的和用户可创建的两种, 比如 document.createElement 就可以创建一些 DOM 对象. 宿主也会提供一些构造器, 比如我们可以使用 new Image 来创建 img 元素.

#### 内置对象 - 固有对象

[Well-Known Intrinsic Objects](https://262.ecma-international.org/9.0/#sec-well-known-intrinsic-objects)

#### 内置对象 - 原生对象

![6cb1df319bbc7c7f948acfdb9ffd99d0.webp](https://edge.yancey.app/beg/906y37ra-1642323397550.webp)

这些构造器创建的对象多数使用了私有字段, 例如, 这些字段使得原型继承方法无法正常工作.

- Error: [[ErrorData]]
- Boolean: [[BooleanData]]
- Number: [[NumberData]]
- Date: [[DateValue]]
- RegExp: [[RegExpMatcher]]
- Symbol: [[SymbolData]]
- Map: [[MapData]]

#### 函数对象

函数对象的定义是: 具有[[call]]私有字段的对象, 构造器对象的定义是: 具有私有字段[[construct]]的对象. 任何对象只需要实现[[call]], 它就是一个函数对象, 可以去作为函数被调用. 而如果它能实现[[construct]], 它就是一个构造器对象, 可以作为构造器被调用.

但对于宿主和内置对象来说, 它们实现[[call]]（作为函数被调用）和[[construct]]（作为构造器被调用）不总是一致的. 再比如基本类型（String、Number、Boolean）, 它们的构造器被当作函数调用, 则产生类型转换(装箱)的效果.

值得一提的是, 箭头函数不能被用做构造器.

```ts
console.log(typeof new Date()); // 'object'
console.log(typeof Date()); // 'string'
```

### 事件循环

- 首先我们分析有多少个宏任务；
- 在每个宏任务中, 分析有多少个微任务；
- 根据调用次序, 确定宏任务中的微任务执行次序；
- 据宏任务的触发规则和调用次序, 确定宏任务的执行次序；
- 确定整个顺序.

不论代码顺序如何, d 必定发生在 c 之后, 因为 Promise 产生的是 JavaScript 引擎内部的微任务, 而 setTimeout 是浏览器 API, 它产生宏任务.

```ts
var r = new Promise(function (resolve, reject) {
  console.log("a");
  resolve();
});
setTimeout(() => console.log("d"), 0);
r.then(() => console.log("c"));
console.log("b");
```

我们把宿主发起的任务称为宏观任务, 把 JavaScript 引擎发起的任务称为微观任务. 许多的微观任务的队列组成了宏观任务.

### 执行上下文

JavaScript 标准把一段代码（包括函数）, 执行所需的所有信息定义为: "执行上下文".

在 ES2018 中, 执行上下文又变成了这个样子, this 值被归入 lexical environment, 但是增加了不少内容.

- lexical environment: 词法环境, 当获取变量或者 this 值时使用.
- variable environment: 变量环境, 当声明变量时使用.
- code evaluation state: 用于恢复代码执行位置.
- Function: 执行的任务是函数时使用, 表示正在被执行的函数.
- ScriptOrModule: 执行的任务是脚本或者模块时使用, 表示正在被执行的代码.
- Realm: 使用的基础库和内置对象实例. 比如一个网页有它的 window 对象, 这个网页创建的 iframe 中也有自己的 window 对象
- Generator: 仅生成器上下文有这个属性, 表示当前生成器.

```ts
// 立即执行函数的推荐写法
void (function () {
  var a;
  //code
})();
```

### 函数种类

```ts
function foo() {}

const foo = () => {};

function* foo() {}

class C {
  foo() {}
}

class Foo {
  constructor() {}
}

async function foo() {}

const foo = async () => {}

async function foo*() {}
```

### this 关键字的行为

```ts
function showThis() {
  console.log(this);
}

var o = {
  showThis,
};

showThis(); // global(如果是严格模式, 这里为 undefined)
o.showThis(); // o
```

普通函数的 this 值由**调用它所使用的引用**决定. 当获取函数的表达式, 它实际上返回的并非函数本身, 而是一个 Reference 类型. Reference 类型由两部分组成: **一个对象和一个属性值**. 因此 o.showThis 产生的 Reference 类型, 即由对象 o 和属性 `showThis` 构成, 那么 this 就指向 o.

JavaScript 标准定义了 [[thisMode]] 私有属性, 它有三个取值:

- lexical: 表示从上下文中找 this, 这对应了箭头函数.
- global: 表示当 this 为 undefined 时, 取全局对象, 对应了普通函数.
- strict: 当严格模式时使用, this 严格按照调用时传入的值, 可能为 null 或者 undefined.

函数创建新的执行上下文中的词法环境记录时, 会根据[[thisMode]]来标记新纪录的[[ThisBindingStatus]]私有属性. 代码执行遇到 this 时, 会逐层检查当前词法环境记录中的[[ThisBindingStatus]], 当找到有 this 的环境记录时获取 this 的值. 箭头函数绑定最近的对象, 下面这个例子 this 都是 o.

```ts
var o = {};
o.foo = function foo() {
  console.log(this);
  return () => {
    console.log(this);
    return () => console.log(this);
  };
};

o.foo()()(); // o, o, o
```

### Completion 类型

下面这个例子, 即便 try 语句中 return 0, 仍然会执行到 finally.

```ts
function foo() {
  try {
    return 0;
  } catch (err) {
  } finally {
    console.log("a");
  }
}
```

而下面这个例子, finally 语句直接覆盖 try 里面的返回值.

```ts
function foo() {
  try {
    return 0;
  } catch (err) {
  } finally {
    return 1;
  }
}

console.log(foo()); // 1
```

这一机制的基础正是 JavaScript 语句执行的完成状态(Completion Record), 它用于**描述异常, 跳出等语句执行过程**. Completion Record 表示一个语句执行完之后的结果, 它有三个字段:

- [[type]] 表示完成的类型, 有 break continue return throw 和 normal 几种类型
- [[value]] 表示语句的返回值, 如果语句没有, 则是 empty
- [[target]] 表示语句的目标, 通常是一个 JavaScript 标签

![语句汇总](https://edge.yancey.app/beg/1zmu8848-1643010754700.webp)

### 普通语句

在 JavaScript 中. 我们把不带控制能力的语句称为普通语句. 普通语句执行后, 会得到 [[type]] 为 normal 的 Completion Record, JavaScript 引擎遇到这样的 Completion Record, 会继续执行下一条语句.

这些语句中, 只有表达式语句会产生 [[value]], 当然, 从引擎控制的角度, 这个 value 并没有什么用处.

如果你经常使用 Chrome 自带的调试工具, 可以知道, 输入一个表达式, 在控制台可以得到结果, 但是在前面加上 var, 就变成了 undefined. Chrome 控制台显示的正是语句的 Completion Record 的[[value]].

![Chrome 控制台](https://edge.yancey.app/beg/nfq2b40p-1643011105029.webp)

### 语句块

语句块就是拿大括号括起来的一组语句, 它是一种语句的复合结构, 可以嵌套. 我们需要注意的是语句块内部的语句的 Completion Record 的[[type]] 如果不为 normal, 会打断语句块后续的语句执行. 比如 [[type]] 为 return 或者 throw.

```ts
// 这里的normal, empty, empty 分别对应指的是[[type]], [[value]], [[target]]

// 下面语句块中的四句都是普通语句
{
  var i = 1; // normal, empty, empty
  i++; // normal, 1, empty
  console.log(i); //normal, undefined, empty
} // normal, undefined, empty

// 加了 return 之后的 Completion Record
{
  var i = 1; // normal, empty, empty
  return i; // return, 1, empty
  i++;
  console.log(i);
} // return, 1, empty
```

控制类语句分成两部分, 一类是对其内部造成影响, 如 if, switch, while/for, try. 另一类是对外部造成影响如 break, continue, return, throw, 这两类语句的配合, 会产生控制代码执行顺序和执行逻辑的效果.

![语句块组合](https://edge.yancey.app/beg/rqfio9x3-1643020117008.webp)

### 带标签的语句

任何 JavaScript 语句是可以加标签的, 在语句前加冒号即可. 大部分时候, 这个东西类似于注释, 没有任何用处. 唯一有作用的时候是: 与完成记录类型中的 target 相配合, 用于跳出多层循环.

break/continue 语句如果后跟了关键字, 会产生带 target 的完成记录. 一旦完成记录带了 target, 那么只有拥有对应 label 的循环语句会消费它.

```ts
outer: while (true) {
  inner: while (true) {
    break outer;
  }
}
console.log("finished");
```

像 rust 也有标签, 都是类似的功能.

```rust
// 嵌套循环
    let mut count = 0;
    // 给外层循环一个标签, 以便内部循环使用
    'counting_up: loop {
        println!("count = {}", count);
        let mut remaining = 10;

        loop {
            println!("remaining = {}", remaining);
            // 停掉内部循环
            if remaining == 9 {
                break;
            }

            // 停掉外部循环
            if count == 2 {
                break 'counting_up;
            }
            remaining -= 1;
        }

        count += 1;
    }
    println!("End count = {}", count); // 2
```

### 词法分析

词法分析技术上可以使用状态机或者正则表达式来进行.

- WhiteSpace(空白字符)
- LineTerminator(换行符)
- Comment(注释)
- Token
  - IdentifierName(标识符名称), 典型案例是我们使用的变量名, 注意这里关键字也包含在内了.
  - Punctuator(符号), 我们使用的运算符和大括号等符号. NumericLiteral 数字直接量, 就是我们写的数字.
  - StringLiteral(字符串直接量), 就是我们用单引号或者双引号引起来的直接量.
  - Template(符串模板), 用反引号 ` 括起来的直接量.

但上面的无法覆盖所有的场景, 比如 JavaScript 不但支持除法运算符 `/` 和 `/=`, 还支持用斜杠括起来的正则表达式 `/abc/`. 但是, 这时候对词法分析来说, 其实是没有办法处理的, 所以 JavaScript 的解决方案是定义两组词法, 然后靠语法分析传一个标志给词法分析器, 让它来决定使用哪一套词法.

再如模板字面量和正则都有 `}`, 标准中还不得不把除法, 正则表达式直接量和 `}` 从 token 中单独抽出来, 形成如下四种形式.

| expectRegex | expectTemplate | InputElement                     |
| ----------- | -------------- | -------------------------------- |
| false       | false          | InputElementDiv                  |
| false       | true           | InputElementTemplateTail         |
| true        | false          | InputElementRegExp               |
| true        | true           | InputElementRegExpOrTemplateTail |

### 空白符号 Whitespace

空白符号最常见的就是普通空格, 不过还有其他的:

- \<HT>(或称\<TAB>) 是 U+0009, 是缩进 TAB 符, 也就是字符串中写的 \t .
- \<VT>是 U+000B, 也就是垂直方向的 TAB 符 \v, 这个字符在键盘上很难打出来, 所以很少用到.
- \<FF>是 U+000C, Form Feed, 分页符, 字符串直接量中写作 \f , 现代已经很少有打印源程序的事情发生了, 所以这个字符在 JavaScript 源代码中很少用到.
- \<SP>是 U+0020, 就是最普通的空格了.
- \<NBSP>是 U+00A0, 非断行空格, 它是 SP 的一个变体, 在文字排版中, 可以避免因为空格在此处发生断行, 其它方面和普通空格完全一样. 多数的 JavaScript 编辑环境都会把它当做普通空格(因为一般源代码编辑环境根本就不会自动折行). HTML 中, 很多人喜欢用的 `&nbsp;` 最后生成的就是它了.
- \<ZWNBSP>(旧称\<BOM>) 是 U+FEFF, 这是 ES5 新加入的空白符, 是 Unicode 中的零宽非断行空格, 在以 UTF 格式编码的文件中, 常常在文件首插入一个额外的 U+FEFF, 解析 UTF 文件的程序可以根据 U+FEFF 的表示方法猜测文件采用哪种 UTF 编码方式. 这个字符也叫做"bit order mark"

![更多空白符号](https://edge.yancey.app/beg/2vy2zw95-1643027049011.webp)

### 换行符 LineTerminator

- \<LF> 是 U+000A, 就是最正常换行符, 在字符串中的\n.
- \<CR> 是 U+000D, 这个字符真正意义上的"回车", 在字符串中是\r, 在一部分 Windows 风格文本编辑器中, 换行是两个字符\r\n.
- \<LS> 是 U+2028, 是 Unicode 中的行分隔符.
- \<PS> 是 U+2029, 是 Unicode 中的段落分隔符.

大部分 LineTerminator 在被词法分析器扫描出之后, 会被语法分析器丢弃, 但是换行符会影响 JavaScript 的两个重要语法特性: 自动插入分号和 no line terminator 规则.

### 注释 Comment

```ts
/* MultiLineCommentChars */
// SingleLineCommentChars
```

### 标识符名称 IdentifierName

IdentifierName 可以以 $, \_ 或者 Unicode 字母开始, 除了开始字符以外, IdentifierName 中还可以使用 Unicode 中的连接标记, 数字, 以及连接符号.

### 符号 Punctuator

```ts
{ ( ) [ ] . ... ; , < > <= >= == != === !== + - * % ** ++ -- << >> >>> & | ^ ! ~ && || ? : = += -= *= %= **= <<= >>= >>>= &= |= ^= => / /= }
```

### 数字直接量 NumericLiteral

JavaScript 规范中规定的数字直接量可以支持四种写法: 十进制数, 二进制整数, 八进制整数和十六进制整数.

十进制的 Number 可以带小数, 小数点前后部分都可以省略, 但是不能同时省略. 比如 0.01, .01, 12, 12.01.

下面这个例子, 第一个就是错的, 因为编译器会把 `12.` 看成一个整体, 所以我们要想让点单独成为一个 token, 就要加入空格.

```ts
12.toString() // ❌
12 .toString() // ✅
```

### 字符串直接量 StringLiteral

JavaScript 中的 StringLiteral 支持单引号和双引号两种写法. 单双引号的区别仅仅在于写法, 在双引号字符串直接量中, 双引号必须转义, 在单引号字符串直接量中, 单引号必须转义. 有特别意义的字符包括有 SingleEscapeCharacter 所定义的 9 种.

![SingleEscapeCharacter](https://edge.yancey.app/beg/g7uzbfiu-1643029987546.webp)

### 正则表达式直接量 RegularExpressionLiteral

正则表达式由 Body 和 Flags 两部分组成, 其中 Body 部分至少有一个字符, 第一个字符不能是 \*(因为 /\* 跟多行注释有词法冲突).

### 字符串模板 Template

```bash
`a${b}c${d}e`;

`a${
  b
}c${
  d
}e`;
```

- `a${ 这个被称为模板头
- c${ 被称为模板中段
- }e` 被称为模板尾
- b 和 d 都是普通标识符

此外, 模板支持添加处理函数的写法:

```ts
function f() {
  console.log(arguments);
}

var a = "world";
f`Hello ${a}!`; // [["Hello ", "!"], world]
```

### 编译原理实战 -- 一个四则运算的解释器

- 定义四则运算: 产出四则运算的词法定义和语法定义.
- 词法分析: 把输入的字符串流变成 token.
- 语法分析: 把 token 变成抽象语法树 AST.
- 解释执行: 后序遍历 AST, 执行得出结果.

#### 定义四则运算

其实比较好理解, 就是诸如 `1 + 3 * 2` 这种.

#### 四则运算的词法分析

- Token
  - Number: 1 2 3 4 5 6 7 8 9 0 的组合
  - Operator: + 、-、 \*、 / 之一
- Whitespace: \<SP>
- LineTerminator: \<LF> \<CR>

#### 四则运算的语法分析

大多数语法分析都使用 BNF(Backus-Naur Form) 是描述编程语言的文法. 巴科斯范式是一种用于表示上下文无关文法的语言, 上下文无关文法描述了一类形式语言. 因为加减乘除有优先级, 所以我们可以认为加法是由若干个乘法再由加号或者减号连接成的.

```html
<Expression>
  ::=
  <AdditiveExpression
    ><EOF>
      <AdditiveExpression>
        ::=
        <MultiplicativeExpression>
          |<AdditiveExpression
            ><+><MultiplicativeExpression>
              |<AdditiveExpression
                ><-><MultiplicativeExpression
                ></MultiplicativeExpression></AdditiveExpression></MultiplicativeExpression></AdditiveExpression></MultiplicativeExpression></AdditiveExpression></EOF></AdditiveExpression
></Expression>
```

#### 词法分析 - 状态机

词法分析有两种方案: 一种是状态机, 一种是正则表达式.

```ts
let token = [];

const isNumberChar = (char) =>
  char === "1" ||
  char === "2" ||
  char === "3" ||
  char === "4" ||
  char === "5" ||
  char === "6" ||
  char === "7" ||
  char === "8" ||
  char === "9" ||
  char === "0";

const start = (char) => {
  if (isNumberChar(char)) {
    token.push(char);
    return inNumber;
  }

  if (char === "+" || char === "-" || char === "*" || char === "/") {
    emmitToken(char, char);
    return start;
  }

  if (char === " ") {
    return start;
  }

  if (char === "\r" || char === "\n") {
    return start;
  }
};

const inNumber = (char) => {
  if (isNumberChar(char)) {
    token.push(char);
    return inNumber;
  } else {
    emmitToken("Number", token.join(""));
    token = [];
    return start(char);
  }
};

const emmitToken = (type, value) => {
  console.log(value);
};

const input = "1024 + 2 * 256";

let state = start;

for (const c of input.split("")) {
  state = state(c);
}

state(Symbol("EOF"));
```

### 自动插入分号规则

- 要有换行符, 且下一个符号是不符合语法的, 那么就尝试插入分号.
- 有换行符, 且语法中规定此处不能有换行符, 那么就自动插入分号.
- 源代码结束处, 不能形成完整的脚本或者模块结构, 那么就自动插入分号.

下面这个例子中, `let a = 1` 后面没有分号, 但有一个换行符, 且如果连接且下一个符号 void 是不符合语法的, 因此引擎会尝试在 `let a = 1` 后面插入分号.

![引擎会尝试插入分号](https://edge.yancey.app/beg/wfjsjaw7-1644494497462.jpg)

JavaScript 中有一个 `[no LineTerminator here]` 的规则, 来约束下面几种场景不能有换行:

- 变量名 与 ++/-- 之间
- continue/break 与 label 之间
- async/return/throw/yield 后面
- 箭头函数参数括号和 => 之间

![no LineTerminator here 规则](https://edge.yancey.app/beg/mg7w2jim-1644494506671.jpg)

按照这个规则, 下面这个例子中, `a` 和下面的 `++` 不能有换行, 而这个 `++` 可以和 `b` 结合, 同理, `b` 后面的 ++ 可以和 `c` 结合. 最终表现如下面代码所示.

```ts
var a = 1,
  b = 1,
  c = 1;
a;
++b;
++c;
```

再如下面两个紧挨着的 IIFE, 第一个立即执行函数可以执行, 打印出 1, 第二个就直接报错了. 这段代码看似两个独立执行的函数表达式, 但是其实第三组括号被理解为传参, 导致抛出错误.

![IIFE](https://edge.yancey.app/beg/gdgsgqdv-1644495640642.jpg)

下面这个例子中, 根据 JavaScript 自动插入分号规则, 带换行符的注释也被认为是有换行符, 而恰好的是, return 也有 `[no LineTerminator here]` 规则的要求. 所以这里会自动插入分号.

![return](https://edge.yancey.app/beg/9kd1kxlv-1644495649563.jpg)

因此本意是返回 1, 但 return 后面自动加了分号, 就变成了 `return;`, 也就是 undefined.

```ts
function f() {
  return;
  /*
        This is a return value.
    */ 1;
}

f();
```

下面列举一些不写分号可能带来的坑:

![不写分号](https://edge.yancey.app/beg/l42bpvro-1644496466568.jpeg)

他们被卷成了下面的形式, 造成出错.

```ts
var a = [[]] /*这里没有被自动插入分号*/[(3, 2, 1, 0)]
  .forEach((e) => console.log(e));

var x = 1,
  g = { test: () => 0 },
  b = 1 /*这里没有被自动插入分号*/ / a / g.test("abc");
console.log(RegExp.$1);

var f = function () {
  return "";
};
var g = f/*这里没有被自动插入分号*/ `Template`.match(/(a)/);
console.log(RegExp.$1);
```

### 模块的引用

具体看这篇文章, [简析 AMD / CMD / UMD / CommonJS / ES Module](https://www.yanceyleo.com/post/7e95f2ef-adb3-4d1c-a0dc-1b910682dd65), 下面简单复习下.

下面这个例子, b 引用 a, 在 b 中调用方法来改变 a, 发现 a 也随之改变. 因为 esm 相当于是导出的是一个引用, 他们指向的都是同一个地址.

```ts
/* a.js */
export var a = 1;

export function modify() {
  a = 2;
}

/* b.js */

import { a, modify } from "./a.js";

console.log(a); // 1

modify();

console.log(a); // 2
```

### 函数提升

好吧, 以前只知道函数提升, 没考虑过判断语句中的提升. 在非严格模式下, 下面这句打出 undefined, 这意味着 foo 函数仍被提升, 只不过被提升成 undefined 了, 否则打印一个不存在的变量直接报错. 这说明 function 在预处理阶段仍然发生了作用, 在作用域中产生了变量, 没有产生赋值, 赋值行为发生在了执行阶段.

```ts
console.log(foo); // undefined
if (true) {
  function foo() {}
}
```

再看一下 class, class 是没有任何提升的, 如果在 `class A {}` 之前尝试获取 A, 直接报错, 以下两种都会报错.

```ts
console.log(c); // 报错
class c {}

var c = 1;
function foo() {
  console.log(c); // 报错
  class c {}
}
foo();
```

### 指令序言(Directive Prologs)

JavaScript 中唯一的指令序言就是 `"use strict";`, 设计指令序言的目的是, 留给 JavaScript 的引擎和实现者一些统一的表达方式, 在静态扫描时指定 JavaScript 代码的一些特性. 看下面这个例子:

```ts
"use strict";
function f() {
  console.log(this); // 如果不是严格模式, 则打印出 Global 或者 Window; 否则打印出 null
}
f.call(null);
```

## 语义化标签

- 语义类标签对开发者更为友好, 使用语义类标签增强了可读
- 文字表现力丰富, 更适合搜索引擎检索(SEO), 也可以让搜索引擎爬虫更好地获取到更多有效信息, 有效提升网页的搜索量, 并且语义类还可以支持读屏软件

```html
<hgroup>
  <h1>JavaScript对象</h1>
  <h2>我们需要模拟类吗？</h2>
</hgroup>
<p>balah balah</p>
......
```

section 标签不仅仅是一个"有语义的 div", 它会改变 h1-h6 的语义. section 的嵌套会使得其中的 h1-h6 下降一级, 因此, 在 HTML5 以后, 我们只需要 section 和 h1 就足以形成文档的树形结构:

```html
<section>
  <h1>HTML语义</h1>
  <p>balah balah balah balah</p>
  <section>
    <h1>弱语义</h1>
    <p>balah balah</p>
  </section>
  <section>
    <h1>结构性元素</h1>
    <p>balah balah</p>
  </section>
  ......
</section>
```

### abbr 标签表示缩写

```html
<abbr title="World Wide Web">WWW</abbr>
```

### hr

hr 标签 1 表示故事走向的转变或者话题的转变, 装饰性的分割线用 css 即可.

### 表示征引的标签

在 HTML 中, 有三个跟引述相关的标签 blockquote 表示段落级引述内容, q 表示行内的引述内容, cite 表示引述的作品名.在文章的结尾处, 有对应的 References 一节, 这一节中所有的作品名称也应该加入 cite 标签.

### 表示定义概念的标签 dfn

```html
<p>
  However, the two are not the same. The <dfn>Internet</dfn> is a global system
  of interconnected computer networks.
</p>
```

### nav, ol, ul

用于表达目录.

```html
<nav>
  <h2>Contents</h2>
  <ol>
    <li><a href="...">History</a></li>
    <li>
      <a href="...">Function</a>
      <ol>
        <li><a href="...">Linking</a></li>
        <li><a href="...">Dynamic updates of web pages</a></li>
        ...
      </ol>
    </li>
    ...
  </ol>
  `
</nav>
```

### pre, samp, code

使用了 pre 标签, 表示这部分内容是预先排版过的, 不需要浏览器进行排版. 又因为这是一段计算机程序的**示例**输出, 可以使用 samp 标签.

```html
<pre><samp>
GET /home.html HTTP/1.1
Host: www.example.org
</samp></pre>
```

![更多语义化标签](https://edge.yancey.app/beg/hhp6sls5-1643093245926.webp)

## css

CSS 的顶层样式表由两种规则组成的规则列表构成, 一种被称为 at-rule, 也就是 at 规则, 另一种是 qualified rule, 也就是普通规则. at-rule 由一个 @ 关键字和后续的一个区块组成, 如果没有区块, 则以分号结束.

### at-rule

#### @charset

@charset 用于提示 CSS 文件使用的字符编码方式, 它如果被使用, 必须出现在最前面. 这个规则只在给出语法解析阶段前使用, 并不影响页面上的展示效果.

```css
@charset "utf-8";
```

#### @import

@import 用于引入一个 CSS 文件, 除了 @charset 规则不会被引入, @import 可以引入另一个文件的全部内容.

```css
@import "mystyle.css";
@import url("mystyle.css");
```

#### @media

media 就是大名鼎鼎的 media query 使用的规则了, 它能够对设备的类型进行一些判断.在 media 的区块内, 是普通规则列表.

```css
@media print {
  body {
    font-size: 10pt;
  }
}
```

#### @page

page 用于分页媒体访问网页时的表现设置, 页面是一种特殊的盒模型结构, 除了页面本身, 还可以设置它周围的盒.

```css
@page {
  size: 8.5in 11in;
  margin: 10%;

  @top-left {
    content: "Hamlet";
  }
  @top-right {
    content: "Page " counter(page);
  }
}
```

#### @counter-style

counter-style 产生一种数据, 用于定义列表项的表现.

```css
@counter-style triangle {
  system: cyclic;
  symbols: ‣;
  suffix: " ";
}
```

#### @keyframes

keyframes 产生一种数据, 用于定义动画关键帧.

```css
@keyframes diagonal-slide {
  from {
    left: 0;
    top: 0;
  }

  to {
    left: 100px;
    top: 100px;
  }
}
```

#### @fontface

fontface 用于定义一种字体, icon font 技术就是利用这个特性来实现的.

```css
@font-face {
  font-family: Gentium;
  src: url(http://example.com/fonts/Gentium.woff);
}

p {
  font-family: Gentium, serif;
}
```

#### 其他

- @support: support 检查环境的特性, 它与 media 比较类似.
- @namespace: 用于跟 XML 命名空间配合的一个规则, 表示内部的 CSS 选择器全都带上特定命名空间.
- @viewport: 用于设置视口的一些特性, 不过兼容性目前不是很好, 多数时候被 HTML 的 meta 代替.
- @color-profile 是 SVG1.0 引入的 CSS 特性, 但是实现状况不怎么好.
- @document 还没讨论清楚, 被推迟到了 CSS4 中.
- @font-feature-values.

### qualified rule

#### 选择器

![选择器](https://edge.yancey.app/beg/rpcgkxtc-1643095994795.webp)

#### css variables

```css
:root {
  --main-color: #06c;
  --accent-color: #006;
}

#foo h1 {
  color: var(--main-color);
}
```

#### css values

- CSS 范围的关键字: initial, unset, inherit, 任何属性都可以的关键字.
- 字符串: 比如 content 属性.
- URL: 使用 url() 函数的 URL 值.
- 整数 / 实数: 比如 flex 属性.
- 维度: 单位的整数 / 实数, 比如 width 属性.
- 百分比: 大部分维度都支持.
- 颜色: 比如 background-color 属性.
- 图片: 比如 background-image 属性.
- 2D 位置: 比如 background-position 属性.
- 函数: 来自函数的值, 比如 transform 属性.
  - calc(): 基本的表达式计算, 它支持加减乘除四则运算
  - max(): 表示取两数中较大的一个
  - min(): 表示取两数之中较小的一个
  - clamp(): 给一个值限定一个范围, 超出范围外则使用范围的最大或者最小值
  - toggle(): 在规则选中多于一个元素时生效, 它会在几个值之间来回切换, 比如我们要让一个列表项的样式圆点和方点间隔出现
  - attr(): 允许 CSS 接受属性值的控制

### \<head> 标签

head 标签用于承载元信息, 其中有 \<title>, \<base>, \<meta> 标签, 这里着重说下 meta:

meta 标签是一组键值对, 它是一种通用的元信息表示标签. 在 head 中可以出现任意多个 meta 标签. 一般的 meta 标签由 name 和 content 两个属性来定义. name 表示元信息的名, content 则用于表示元信息的值.

- `<meta charset="UTF-8" >`, 描述了 HTML 文档自身的编码形式
- 具有 http-equiv 属性的 meta, 如 `<meta http-equiv="content-type" content="text/html; charset=UTF-8">`
  - content-type 添加了 content-type 这个 http 头, 并且指定了 http 编码方式.
  - content-language 指定内容的语言
  - default-style 指定默认样式表
  - refresh 刷新
  - set-cookie 模拟 http 头 set-cookie, 设置 cookie
  - x-ua-compatible 模拟 http 头 x-ua-compatible, 声明 ua 兼容性
  - content-security-policy 模拟 http 头 content-security-policy, 声明内容安全策略.
- name 为 viewport 的 meta, 如 `<meta name="viewport" content="width=500, initial-scale=1">`
  - width: 页面宽度, 可以取值具体的数字, 也可以是 device-width, 表示跟设备宽度相等.
  - height: 页面高度, 可以取值具体的数字, 也可以是 device-height, 表示跟设备高度相等.
  - initial-scale: 初始缩放比例.
  - minimum-scale: 最小缩放比例.
  - maximum-scale: 最大缩放比例.
  - user-scalable: 是否允许用户缩放.
- 预定义的 meta
  - author: 页面作者.
  - description: 页面描述, 这个属性可能被用于搜索引擎或者其它场合.
  - generator: 生成页面所使用的工具, 主要用于可视化编辑器, 如果是手写 HTML 的网页, 不需要加这个 meta.
  - keywords: 页面关键字, 对于 SEO 场景非常关键.
  - referrer: 跳转策略, 是一种安全考量.
  - theme-color: 页面风格颜色, 实际并不会影响页面, 但是浏览器可能据此调整页面之外的 UI(如窗口边框或者 tab 的颜色).

### css 选择器

![简单选择器](https://edge.yancey.app/beg/7xz6ssdf-1643098093472.webp)

#### 类型选择器和全体选择器

类型选择器最简单的就是选择一个 dom 标签, 但是 a 标签存在于 svg 中, 也有超链接的形式, 可以通过带命名空间的类型选择器来区分. 此外全体选择器就是 \* 了, 一般 reset-css 这种东西会用到.

```css
@namespace svg url(http://www.w3.org/2000/svg);
@namespace html url(http://www.w3.org/1999/xhtml);
svg|a {
  stroke: blue;
  stroke-width: 1;
}
html|a {
  font-size: 40px;
}
```

#### id 选择器和类选择器

不多说, 最重要的是能知晓 css 选择器优先级, 可以看 [关于 css 优先级](https://www.yanceyleo.com/post/a529f531-bd56-4809-b5ed-8d91ddfcbd02).

#### 属性选择器

| 选择器             | 描述                                                        |
| ------------------ | ----------------------------------------------------------- |
| [attribute]        | 用于选取带有指定属性的元素                                  |
| [attribute=value]  | 用于选取带有指定属性和值的元素                              |
| [attribute~=value] | 用于选取属性值中包含指定词汇的元素                          |
| [attribute=value]  | 用于选取带有以指定值开头的属性值的元素, 该值必须是整个单词. |
| [attribute^=value] | 匹配属性值以指定值开头的每个元素.                           |
| [attribute$=value] | 匹配属性值以指定值结尾的每个元素.                           |
| [attribute*=value] | 匹配属性值中包含指定值的每个元素.                           |

#### 伪类选择器

- :empty 伪类表示没有子节点的元素, 这里有个例外就是子节点为空白文本节点的情况
- :nth-child 和 :nth-last-child 这是两个函数型的伪类
- :nth-last-child 的区别仅仅是从后往前数.
- :first-child :last-child 分别表示第一个和最后一个元素.
- :only-child 按字面意思理解即可, 选中唯一一个子元素.
- :any-link 表示任意的链接, 包括 a, area 和 link 标签都可能匹配到这个伪类.
- :link 表示未访问过的链接, :visited 表示已经访问过的链接.
- :hover 表示鼠标悬停在上的元素.
- :active 表示用户正在激活这个元素, 如用户按下按钮, 鼠标还未抬起时, 这个按钮就处于激活状态.
- :focus 表示焦点落在这个元素之上.:target 用于选中浏览器 URL 的 hash 部分所指示的元素.
- :not 伪类

### 伪元素

- ::first-line
- ::first-letter
- ::before
- ::after

## HTML 链接

提到 HTML 链接能想到的有 a 标签, 其实还有下面这么多.

![链接.png](https://edge.yancey.app/beg/ykrk1lqy-1643187179882.png)

## area 类型

特别说一下 area 类型. area 是整个 html 规则中唯一支持非矩形热区的标签, 它的 shape 属性支持三种类型.

- 圆形: circle 或者 circ, coords 支持三个值, 分别表示中心点的 x,y 坐标和圆形半径 r.
- 矩形: rect 或者 rectangle, coords 支持两个值, 分别表示两个对角顶点 x1, y1 和 x2, y2.
- 多边形: poly 或者 polygon, coords 至少包括 6 个值, 表示多边形的各个顶点.

```html
<p>
  Please select a shape:
  <img
    src="shapes.png"
    usemap="#shapes"
    alt="Four shapes are available: a red hollow box, a green circle, a blue triangle, and a yellow four-pointed star."
  />
  <map name="shapes">
    <area shape="rect" coords="50,50,100,100" />
    <!-- the hole in the red box -->
    <area shape="rect" coords="25,25,125,125" href="red.html" alt="Red box." />
    <area
      shape="circle"
      coords="200,75,50"
      href="green.html"
      alt="Green circle."
    />
    <area
      shape="poly"
      coords="325,25,262,125,388,125"
      href="blue.html"
      alt="Blue triangle."
    />
    <area
      shape="poly"
      coords="450,25,435,60,400,75,435,90,450,125,465,90,500,75,465,60"
      href="yellow.html"
      alt="Yellow star."
    />
  </map>
</p>
```

## 文档流

在 CSS 标准中, 规定了如何排布每一个文字或者盒的算法, 这个算法依赖一个排版的"当前状态", CSS 把这个当前状态称为"格式化上下文(formatting context). `格式化上下文 + 盒 / 文字 = 位置 (formatting context + boxes/charater = positions)`.

复习下块级格式化上下文:

- 浮动元素;
- 绝对定位元素;
- 非块级但仍能包含块级元素的容器(如 inline-blocks, table-cells, table-captions);
- 块级的能包含块级元素的容器, 且属性 overflow 不为 visible

![vertical](https://edge.yancey.app/beg/1d5bukrs-1643265415239.webp)

## 替换元素

常见的替换元素: script, image, picture, audio, video, iframe. 他们可以通过 src 属性; srcset 属性; source 标签; srcdoc 属性传入资源.

从性能的角度考虑, 建议同时给出图片的宽高, 因为替换型元素加载完文件后, 如果尺寸发生变换, 会触发重排版.

### iframe 的安全性

iframe 标签能够嵌入一个完整的网页. 不过, 在移动端, iframe 受到了相当多的限制, 它无法指定大小, 里面的内容会被完全平铺到父级页面上. 同时很多网页也会通过 http 协议头禁止自己被放入 iframe 中. iframe 标签也是各种安全问题的重灾区. opener, window.name, 甚至 css 的 opacity 都是黑客可以利用的漏洞.

在新标准中, 为 iframe 加入了 sandbox 模式和 srcdoc 属性, 这样, 给 iframe 带来了一定的新场景. 这个例子中, 使用 srcdoc 属性创建了一个新的文档, 嵌入在 iframe 中展示, 并且使用了 sandbox 来隔离. 这样, 这个 iframe 就不涉及任何跨域问题.

```html
<iframe sandbox srcdoc="<p>Yeah, you can see it <a href="/gallery?mode=cover&amp;amp;page=1">in my gallery</a>."></iframe>
```

## 贝塞尔曲线

贝塞尔曲线是一种插值曲线, 它描述了两个点之间差值来形成连续的曲线形状的规则. 一个量(可以是任何矢量或者标量)从一个值到变化到另一个值, 如果我们希望它按照一定时间平滑地过渡, 就必须要对它进行插值. 它最大的特点就是"平滑". 时间曲线平滑, 意味着较少突兀的变化, 这是一般动画设计所追求的.

## HSL 颜色

颜色是从人类的视觉原理建模, 应该说是十分科学了. 但是, 人类对颜色的认识却并非来自自己的神经系统, 当我们把阳光散射, 可以得到七色光: 红橙黄绿蓝靛紫, 实际上, 阳光接近白光, 它包含了各种颜色的光, 它散射之后, 应该是个基本连续的. 这说明对人的感知来说, 颜色远远大于红, 绿, 蓝. 因此, HSL 这样的颜色模型被设计出来了, 它用一个值来表示人类认知中的颜色, 我们用专业的术语叫做色相(H). 加上颜色的纯度(S)和明度(L), 就构成了一种颜色的表示.

![ HSL 颜色](https://edge.yancey.app/beg/rmgvozli-1643271870854.webp)

## 考古: DTD

在 HTML 中, 规定了两种文本语法, 一种是普通的文本节点, 另一种是 CDATA 文本节点. 文本节点看似是普通的文本, 但是, 其中有两种字符是必须做转义的, 就是 < 和 &.如果我们从某处拷贝了一段文本, 里面包含了大量的 < 和 &, 那么我们就有麻烦了, 这时候, 就轮到我们的 CDATA 节点出场了.

DTD 的全称是 Document Type Definition, 也就是文档类型定义. 上个时代走过来的前端, 一定还记得 HTML4.01 有三种 DTD. 分别是严格模式, 过渡模式和 frameset 模式. 当然 h5 已经变成了 `<!DOCTYPE html>`.

## 浏览器过程

- 浏览器首先使用 HTTP 协议或者 HTTPS 协议, 向服务端请求页面;
- 把请求回来的 HTML 代码经过解析, 构建成 DOM 树;
- 计算 DOM 树上的 CSS 属性;
- 最后根据 CSS 属性对元素逐个进行渲染, 得到内存中的位图;
- 一个可选的步骤是对位图进行合成, 这会极大地增加后续绘制的速度;
- 合成之后, 再绘制到界面上.

从 HTTP 请求回来, 就产生了流式的数据, 后续的 DOM 树构建, CSS 计算, 渲染, 合成, 绘制, 都是尽可能地流式处理前一步的产出: 即不需要等到上一步骤完全结束, 就开始处理上一步的输出, 这样我们在浏览网页时, 才会看到逐步出现的页面.

HTTP 协议是基于 TCP 协议出现的, 对 TCP 协议来说, TCP 协议是一条双向的通讯通道, HTTP 在 TCP 的基础上, 规定了 Request-Response 的模式. 这个模式决定了通讯必定是由浏览器端首先发起.

## HTTPS

![https 过程](https://edge.yancey.app/beg/6dpuitzl-1643278529808.jpeg)

证书验证阶段

- 浏览器发起 HTTPS 请求
- 服务端返回 HTTPS 证书
- 客户端验证证书是否合法, 如果不合法则提示告警

数据传输阶段

- 当证书验证合法后, 在本地生成随机数
- 通过公钥加密随机数, 并把加密后的随机数传输到服务端
- 服务端通过私钥对随机数进行解密
- 服务端通过客户端传入的随机数构造对称加密算法, 对返回结果内容进行加密后传输

### 为什么数据传输是用对称加密?

首先, 非对称加密的加解密效率是非常低的, 而 http 的应用场景中通常端与端之间存在大量的交互, 非对称加密的效率是无法接受的; 另外, 在 HTTPS 的场景中只有服务端保存了私钥, 一对公私钥只能实现单向的加解密, 所以 HTTPS 中内容传输加密采取的是对称加密, 而不是非对称加密.

### 为什么需要 CA 认证机构颁发证书

HTTP 协议被认为不安全是因为传输过程容易被监听者勾线监听, 伪造服务器, 而 HTTPS 协议主要解决的便是网络传输的安全性问题. 首先我们假设不存在认证机构, 任何人都可以制作证书, 这带来的安全风险便是经典的"中间人攻击"问题. 由于缺少对证书的验证, 所以客户端虽然发起的是 HTTPS 请求, 但客户端完全不知道自己的网络已被拦截, 传输内容被中间人全部窃取.

![中间人攻击](https://edge.yancey.app/beg/t4gmqggv-1643278965188.jpeg)

1.本地请求被劫持(如 DNS 劫持等), 所有请求均发送到中间人的服务器

2.中间人服务器返回中间人自己的证书

3.客户端创建随机数, 通过中间人证书的公钥对随机数加密后传送给中间人, 然后凭随机数构造对称加密对传输内容进行加密传输

4.中间人因为拥有客户端的随机数, 可以通过对称加密算法进行内容解密

5.中间人以客户端的请求内容再向正规网站发起请求

6.因为中间人与服务器的通信过程是合法的, 正规网站通过建立的安全通道返回加密后的数据

7.中间人凭借与正规网站建立的对称加密算法对内容进行解密

8.中间人通过与客户端建立的对称加密算法对正规内容返回的数据进行加密传输

9.客户端通过与中间人建立的对称加密算法对返回结果数据进行解密

### 浏览器如何验证证书的合法性

浏览器发起 HTTPS 请求时, 服务器会返回网站的 SSL 证书, 浏览器需要对证书做以下验证:

1.验证域名, 有效期等信息是否正确. 证书上都有包含这些信息, 比较容易完成验证;

2.判断证书来源是否合法. 每份签发证书都可以根据验证链查找到对应的根证书, 操作系统, 浏览器会在本地存储权威机构的根证书, 利用本地根证书可以对对应机构签发证书完成来源验证;

3.判断证书是否被篡改. 需要与 CA 服务器进行校验;

4.判断证书是否已吊销. 通过 CRL(Certificate Revocation List 证书注销列表)和 OCSP(Online Certificate Status Protocol 在线证书状态协议)实现, 其中 OCSP 可用于第 3 步中以减少与 CA 服务器的交互, 提高验证效率

以上任意一步都满足的情况下浏览器才认为证书是合法的.

## 解析 HTML 代码, 构建 DOM 树

以 p 标签为例, HTML 的"第一个词"是 `<p`, 因为 `<p>` 太大了, p 标签里会有一些属性.

![token 分析](https://edge.yancey.app/beg/yn0k7f5k-1643364795993.webp)

在接受第一个字符之前, 我们完全无法判断这是哪一个词(token), 不过, 随着我们接受的字符越来越多, 拼出其他的内容可能性就越来越少.

比如, 我们接受了一个字符 "<", 就知道这不是一个文本节点. 之后我们再读一个字符, 比如就是 x, 那么我们一下子就知道这不是注释和 CDATA 了, 接下来我们就一直读, 直到遇到">"或者空格, 这样就得到了一个完整的词(token)了. 实际上, 我们每读入一个字符, 其实都要做一次决策, 而且这些决定是跟"当前状态"有关的. 这种解析的手段一般使用状态机来实现.

状态机的初始状态, 我们仅仅区分 "< "和 "非 <":

- 如果获得的是一个非 < 字符, 那么可以认为进入了一个文本节点;
- 如果获得的是一个 < 字符, 那么进入一个标签状态.

不过当我们在标签状态时, 则会面临着一些可能性.

- 比如下一个字符是"!", 那么很可能是进入了注释节点或者 CDATA 节点.
- 如果下一个字符是 "/", 那么可以确定进入了一个结束标签.
- 如果下一个字符是字母, 那么可以确定进入了一个开始标签.
- 如果我们要完整处理各种 HTML 标准中定义的东西, 那么还要考虑" ? ""% "等内容.

![词法解析](https://edge.yancey.app/beg/22tf7ee8-1643367220602.webp)

再通过分词的结果构建成 DOM tree 就可以供浏览器使用了.

## 解析 CSS

在构建 DOM 的过程, 从父到子, 从先到后, 一个一个节点构造. 并且挂载到 DOM 树上的, `在此过程中, 同步也会把 CSS 属性计算出来`. 一个 compound-selector 是检查一个元素的规则, 而一个复合型选择器, 则是由数个 compound-selector 通过前面讲的符号连接起来的. 复习一下所有的选择器.

- `空格`: 后代, 选中它的子节点和所有子节点的后代节点.
- `>`: 子代, 选中它的子节点.
- `+`: 直接后继选择器, 选中它的下一个相邻节点.
- `~`: 后继, 选中它之后所有的相邻节点.
- `||`: 列, 选中表格中的一列.

以后代选择器为例: 当我们找到了匹配 a#b 的元素时, 我们才会开始检查它所有的子代是否匹配 .cls, 除了前进一段的情况, 我们还需要处理后退的情况, 当遇到 `</a>` 时, 必须使得规则 a#b .cls 回退一步, 这样第三个 span 才不会被选中. 后代选择器的作用范围是父节点的所有子节点, 因此规则是在匹配到本标签的结束标签时回退.

```html
<style>
a#b .cls {
    width: 100px;
}
</style>


<a id=b>
    <span>1<span>
    <span class=cls>2<span>
</a>
<span class=cls>3<span>
```

## 小谈排版

浏览器又可以支持元素和文字的混排, 元素被定义为占据长方形的区域, 还允许边框、边距和留白, 这个就是所谓的盒模型. 在正常流的基础上, 浏览器还支持两类元素: 绝对定位元素和浮动元素. 绝对定位元素把自身从正常流抽出, 直接由 top 和 left 等属性确定自身的位置, 不参加排版计算, 也不影响其它元素. 绝对定位元素由 position 属性控制. 浮动元素则是使得自己在正常流的位置向左或者向右移动到边界, 并且占据一块排版空间. 浮动元素由 float 属性控制. 除了正常流, 浏览器还支持其它排版方式, 比如现在非常常用的 Flex 排版, 这些排版方式由外部元素的 display 属性来控制(注意, display 同时还控制元素在正常流中属于 inline 等级还是 block 等级).

## 渲染 & 合成 & 绘制

DOM 渲染到页面上指的是把模型变成位图的过程, 这里的位图就是在内存里建立一张二维表格, 把一张图片的每个像素对应的颜色保存进去(位图信息也是 DOM 树中占据浏览器内存最多的信息, 我们在做内存占用优化时, 主要就是考虑这一部分).

浏览器中渲染这个过程, 就是把每一个元素对应的盒变成位图. 这里的元素包括 HTML 元素和伪元素, 一个元素可能对应多个盒(比如 inline 元素, 可能会分成多行). 每一个盒对应着一张位图. 渲染可以分成图形和文字两大类.

盒的背景, 边框, SVG 元素, 阴影等特性, 都是需要绘制的图形类. 字形分为像素字形和矢量字形两种. 通常的字体, 会在 6px 8px 等小尺寸提供像素字形, 比较大的尺寸则提供矢量字形. 矢量字形本身就需要经过渲染才能继续渲染到元素的位图上去. 目前最常用的字体库是 Freetype, 这是一个 C++ 编写的开源的字体库.

当然像阴影这种, 它可能非常巨大, 或者渲染到非常遥远的位置, 所以为了优化, 浏览器实际的实现中会把阴影作为一个独立的盒来处理. 当父子元素的相对位置发生变化时, 可以保证渲染的结果能够最大程度被缓存, 减少重新渲染.

合成是一种优化策略, 合成的目标就是提高性能, 根据这个目标, 我们建立的原则就是最大限度减少绘制次数原则. 看两个极端例子, 假如所有的元素都合成, 那么一旦改变了任何一个 CSS 属性, 这个合成的位图就废了; 假如不做合成, 每次我们都必须要重新绘制所有的元素, 这显然是性能不好的. 因此, 好的合成策略是"猜测"可能变化的元素, 把它排除到合成之外. 典型的像 transform 这些会触发合成层. css3 还有一个属性 `will-change` 可以主动告知引擎进行合成.

绘制是把"位图最终绘制到屏幕上, 变成肉眼可见的图像"的过程. 我们已经得到了每个元素的位图, 并且对它们部分进行了合成, 那么绘制过程, 实际上就是按照 z-index 把它们依次绘制到屏幕上. 计算机图形学中, 使用的方案就是"脏矩形"算法, 也就是把屏幕均匀地分成若干矩形区域. 当鼠标移动、元素移动或者其它导致需要重绘的场景发生时, 我们只重新绘制它所影响到的几个矩形区域就够了. 比矩形区域更小的影响最多只会涉及 4 个矩形, 大型元素则覆盖多个矩形. 设置合适的矩形区域大小, 可以很好地控制绘制时的消耗. 设置过大的矩形会造成绘制面积增大, 而设置过小的矩形则会造成计算复杂.

TIPS: 重排涉及到排版; 重绘, 涉及到渲染合成绘制.

## DOM

DOM API 大致会包含 4 个部分:

- 节点: DOM 树形结构中的节点相关 API.
- 事件: 触发和监听事件相关 API.
- Range: 操作文字范围相关 API.
- 遍历: 遍历 DOM 需要的 API.

### Node 节点

![Node 节点](https://edge.yancey.app/beg/6x5dl7si-1643446819367.webp)

Node 是 DOM 树继承关系的根节点, 它定义了 DOM 节点在 DOM 树上的操作, 首先, Node 提供了一组属性, 来表示它在 DOM 树中的关系, 它们是:

- parentNode
- childNodes
- firstChild
- lastChild
- nextSibling
- previousSibling

Node 中也提供了操作 DOM 树的 API, 主要有下面几种:

- appendChild
- insertBefore
- removeChild
- replaceChild

除此之外, Node 还提供了一些高级 API:

- compareDocumentPosition 是一个用于比较两个节点中关系的函数
- contains 检查一个节点是否包含另一个节点的函数
- isEqualNode 检查两个节点是否完全相同
- isSameNode 检查两个节点是否是同一个节点, 实际上在 JavaScript 中可以用"==="
- cloneNode 复制一个节点, 如果传入参数 true, 则会连同子元素做深拷贝

DOM 标准规定了节点必须从文档的 create 方法创建出来, 不能够使用原生的 JavaScript 的 new 运算. 于是 document 对象有这些方法.

- createElement
- createTextNode
- createCDATASection
- createComment
- createProcessingInstruction
- createDocumentFragment
- createDocumentType

### Element 与 Attribute

Node 提供了树形结构上节点相关的操作, 而大部分时候, 我们比较关注的是元素. 元素对应了 HTML 中的标签, 它既有子节点, 又有属性. 所以 Element 子类中, 有一系列操作属性的方法. 首先, 我们可以把元素的 Attribute 当作字符串来看待, 也可以当作节点来看待.

- getAttribute
- setAttribute
- removeAttribute
- hasAttribute
- getAttributeNode
- setAttributeNode

当然查找元素就太熟悉不过了:

- querySelector
- querySelectorAll
- getElementById
- getElementsByName
- getElementsByTagName
- getElementsByClassName

通过 Node 的相关属性, 我们可以用 JavaScript 遍历整个树. 实际上, DOM API 中还提供了 NodeIterator 和 TreeWalker 来遍历树.

```ts
// NodeIterator
var iterator = document.createNodeIterator(
  document.body,
  NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT,
  null,
  false
);
var node;
while ((node = iterator.nextNode())) {
  console.log(node);
}

// TreeWalker
var walker = document.createTreeWalker(
  document.body,
  NodeFilter.SHOW_ELEMENT,
  null,
  false
);
var node;
while ((node = walker.nextNode())) {
  if (node.tagName === "p") node.nextSibling();
  console.log(node);
}
```

### Range

Range 一般用于富文本编辑类, 可以和 Selection API 配合, 挺有意思, 有空玩玩.

![Jietu20220129-180331.jpg](https://edge.yancey.app/beg/xy2kaecp-1643450623665.jpg)

```ts
var range = document.getSelection().getRangeAt(0);
range.startContainer.data.slice(22, 36); // 范围, 这个范围是以文字为最小
```

### 命名空间

在 HTML 场景中, 需要考虑命名空间的场景不多. 最主要的场景是 SVG. 创建元素和属性相关的 API 都有带命名空间的版本.

- document
  - createElementNS
  - createAttributeNS
- Element

  - getAttributeNS
  - setAttributeNS
  - getAttributeNodeNS
  - setAttributeNodeNS
  - removeAttributeNS
  - hasAttributeNS
  - attributes.setNamedItemNS
  - attributes.getNamedItemNS
  - attributes.removeNamedItemNS

若要创建 Document 或者 Doctype, 也必须要考虑命名空间问题. DOM 要求从 document.implementation 来创建.

- document.implementation.createDocument
- document.implementation.createDocumentType
- document.implementation.createHTMLDocument

## CSSOM & CSSOM View

document 的 styleSheets 属性表示文档中的所有样式表, 这是一个只读的列表, 我们可以用方括号运算符下标访问样式表, 也可以使用 item 方法来访问, 它有 length 属性表示文档中的样式表数量. 样式表只能使用 style 标签或者 link 标签创建, 不可通过 `document.styleSheets` 创建. 此外还有一个 `window.getComputedStyle(elt, pseudoElt);` 方法, 注意这个会造成重排.

```ts
document.styleSheets;

// 修改样式表里的数据
document.styleSheets[0].insertRule("p { color:pink; }", 0);
document.styleSheets[0].removeRule(0);

// 获取 at-rules
document.styleSheets[0].cssRules;
```

CSSOM View 这一部分的 API, 可以视为 DOM API 的扩展, 它在原本的 Element 接口上, 添加了显示相关的功能, 这些功能, 又可以分成三个部分: 窗口部分, 滚动部分和布局部分.

### 窗口 API

窗口 API 窗口 API 用于操作浏览器窗口的位置, 尺寸等. 通过这些属性和方法, 我们可以读取视口的滚动位置和操纵视口滚动.

- moveTo(x, y) 窗口移动到屏幕的特定坐标;
- moveBy(x, y) 窗口移动特定距离;
- resizeTo(x, y) 改变窗口大小到特定尺寸;
- resizeBy(x, y) 改变窗口大小特定尺寸.
- window.open() 打开新窗口

### 元素滚动 API

- scrollTop 元素的属性, 表示 Y 方向上的当前滚动距离.
- scrollLeft 元素的属性, 表示 X 方向上的当前滚动距离.
- scrollWidth 元素的属性, 表示元素内部的滚动内容的宽度, 一般来说会大于等于元素宽度.
- scrollHeight 元素的属性, 表示元素内部的滚动内容的高度, 一般来说会大于等于元素高度.
- scroll(x, y) 使得元素滚动到特定的位置, 有别名 scrollTo, 支持传入配置型参数 {top, left}.
- scrollBy(x, y) 使得元素滚动到特定的位置, 支持传入配置型参数 {top, left}.
- scrollIntoView(arg) 滚动元素所在的父元素, 使得元素滚动到可见区域, 可以通过 arg 来指定滚到中间、开始或者就近.

### 布局 API

![布局 API](https://edge.yancey.app/beg/rcojgefk-1643514426551.webp)

### 元素的布局 API

- `getClientRects()`: 返回一个列表, 里面包含元素对应的每一个盒所占据的客户端矩形区域, 这里每一个矩形区域可以用 x, y, width, height 来获取它的位置和尺寸
- `getBoundingClientRect()`: 这个 API 的设计更接近我们脑海中的元素盒的概念, 它返回元素对应的所有盒的包裹的矩形区域, 需要注意, 这个 API 获取的区域会包括当 overflow 为 visible 时的子元素区域

![元素的布局 API](https://edge.yancey.app/beg/xvz3mvl5-1643514672099.jpg)

### 捕获和冒泡

事件一般由键盘, 鼠标, 触摸屏. 这其中, 触摸屏和鼠标又有一定的共性, 它们被称作 pointer 设备, 所谓 pointer 设备, 是指它的输入最终会被抽象成屏幕上面的一个点. 那么, 把这个坐标转换为具体的元素上事件的过程, 就是捕获过程了. 而冒泡过程, 则是符合人类理解逻辑的: 当你按电视机开关时, 你也按到了电视机. 所以我们可以认为, 捕获是计算机处理事件的逻辑, 而冒泡是人类处理事件的逻辑.

在一个事件发生时, 捕获过程跟冒泡过程总是先后发生, 跟你是否监听毫无关联. 在我们实际监听事件时, 我建议这样使用冒泡和捕获机制: 默认使用冒泡模式, 当开发组件时, 遇到需要父元素控制子元素的行为, 可以使用捕获机制.

addEventListener 有三个参数:

- 事件名称;
- 事件处理函数;
- 捕获还是冒泡.

事件处理函数不一定是函数, 也可以是个 JavaScript 具有 handleEvent 方法的对象, 看下例子:

```ts
const o = {
  handleEvent: (event) => console.log(event),
};

document.body.addEventListener("keydown", o, false);
```

第三个参数不一定是 bool 值, 也可以是个对象, 它提供了更多选项.

- once: 只执行一次.
- passive: 承诺此事件监听不会调用 preventDefault, 这有助于性能.
- useCapture: 是否捕获, 否则冒泡

### 焦点

键盘事件是由焦点系统控制的, 焦点系统也是视障用户访问的重要入口. 焦点系统认为整个 UI 系统中, 有且仅有一个"聚焦"的元素, 所有的键盘事件的目标元素都是这个聚焦元素. Tab 键被用来切换到下一个可聚焦的元素, 焦点系统占用了 Tab 键, 但是可以用 JavaScript 来阻止这个行为. 浏览器 API 还提供了 API 来操作焦点.

```ts
document.body.focus();

document.body.blur();
```

### 自定义事件

除了来自输入设备的事件, 还可以自定义事件.

```ts
function registerHistoryEvent() {
  var _wr = function (type) {
    var orig = history[type];
    return function () {
      var rv = orig.apply(this, arguments);
      var e = new Event(type);
      e.arguments = arguments;
      window.dispatchEvent(e);
      return rv;
    };
  };
  history.pushState = _wr("pushState");
  history.replaceState = _wr("replaceState");
}
```
