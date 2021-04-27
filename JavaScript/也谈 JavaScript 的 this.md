# 也谈 JavaScript 的 this

> 最近颇有些不宁静，时代的风吹得太猛烈，想到这一年已经过去四分之一，也差不多要准备未来的事情了。关于 this 的文章网上不胜枚举，这篇也无非是拾人牙慧，权当给自己留份资料，也希望能帮助到他人。从原理到用法到面试题，洋洋洒洒一万多字，基本上是够用了。

## 从一道面试题说起

这是一位京东小姐姐出的面试题，不出意外这道题代表了大厂对于 this 的考察要求。浏览器执行下面的代码，会输出什么呢？

``` js
var number = 5;
var obj = {
  number: 3,
  fn: (function() {
    var number;
    this.number *= 2;
    number = number * 2;
    number = 3;
    return function() {
      var num = this.number;
      this.number *= 2;
      console.log(num);
      number *= 3;
      console.log(number);
    };
  })(),
};
var fn = obj.fn;
fn.call(null);
obj.fn();
console.log(window.number);

```

## 什么是 this

this 是 JavaScript 中的一个关键字。它一般用于函数体内，依赖函数**调用时**的上下文条件。

所以 this 是在运行时绑定的，而非在编写代码的过程。随着函数使用场合的不同，this 的指向也会发生变化。但是有一个总的原则：**那就是 this 总会指向调用函数的那个对象**。

_*本文只考虑浏览器非严格模式环境。_

## 为什么会有 this

JavaScript 之所以有 this ，跟内存的数据结构有关，这里直接引用阮一峰老师的例子。

``` js
const obj = { foo: 5 };

```

上述代码将一个对象赋值给变量 obj，JS 引擎会在内存里生成一个对象 `{ foo: 5}`，然后把这个对象的内存地址赋值给变量 obj. 因此，变量 obj 只是个地址（指针），如果要读取 `obj.foo`，则需要 JS 引擎从 `obj` 中拿到内存地址，然后再从该地址读出原始的对象。我们知道对象里的每个属性都对应着一个属性描述符对象，因此上面的 foo 就是以下图方式保存的。

![普通对象保存到堆](https://static.yancey.app/bg2018061802.png)

关于属性描述符可以参照我的一篇文章 [Object\.defineProperty\\\(\\\) \| JavaScript 全解析系列](https://js.yanceyleo.com/ECMAScript/Object/Object.defineProperty.html)。

但当属性的属性值是一个**函数**时，将不会按照上述方式来保存了。

``` js
const obj = { foo: function() {} };

```

JavaScript 引擎会将函数单独保存到内存中，然后将函数的内存地址赋值给 `foo` 属性的 `value` 属性，这也就说明了函数在内存中是个独立的个体，调用它的方式不同，结果也会不同。

![函数保存到单独内存](https://static.yancey.app/bg2018061803.png)

## this 的绑定规则

this 的绑定规则有四种，分别是：

* 默认绑定
* 隐式绑定
* 硬绑定
* new 绑定

### 默认绑定

默认绑定是在不使用其他绑定规则时的规则，通常是独立函数的调用。

``` js
function greeting() {
  console.log(`Hello, ${this.name}`);
}

var name = 'Yancey';

greeting(); // Hello, Yancey

```

### 隐式绑定

隐式绑定指的是在一个对象上调用函数。

在此示例中，通过 obj 调用 greeting 方法，this 就指向了 obj

``` js
function greeting() {
  console.log(`Hello, ${this.name}`);
}

var name = 'Sayaka';

var obj = {
  name: 'Yancey',
  greeting,
};
obj.greeting(); // Hello, Yancey

```

下面的代码中，将 obj.greeting 赋给了一个全局的变量 otherGreeting，所以在执行 otherGreeting 时，this 会指向 window.

``` js
function greeting() {
  return `Hello, ${this.name}`;
}

var name = 'Sayaka';

var obj = {
  name: 'Yancey',
  greeting,
};

var otherGreeting = obj.greeting;

otherGreeting(); // Hello, Sayaka

```

如果涉及到回调函数（异步操作），就要小心隐式绑定的丢失问题。看下面这个例子。

第一次调用，因为涉及到异步，所以 this 指向了 window，此时 this.name 就是 Mitsuha

第二次调用，可以理解为将 `obj2.greeting` 赋值给一个新的变量，所以此时 this 也是指向了 window

第三次调用则是隐式绑定，此时 this 指向 obj2

``` js
function greeting() {
  console.log(`Hello, ${this.name}`);
}
var obj1 = {
  name: 'Yancey',
  greeting() {
    setTimeout(function() {
      console.log(`Hello, ${this.name}`);
    });
  },
};
var obj2 = {
  name: 'Sayaka',
  greeting,
};
var name = 'Mitsuha';

obj1.greeting(); // Hello, Mitsuha

setTimeout(obj2.greeting, 100); // Hello, Mitsuha


setTimeout(function() {
  obj2.greeting(); // Hello, Sayaka
}, 200);

```

### 显式绑定

显示绑定就是通过 call, apply, bind 来显式地指定 this 的绑定对象。三者的第一个参数都是传递 `this 指向的对象`，call 与 apply 的区别是前者从第二个参数起传递一个参数序列，后者传递一个数组，call, apply 和 bind 的区别是前两个都会立即执行对应的函数，而 bind 方法不会。

所以我们通过 call 显式绑定 this 指向的对象来解决隐式绑定丢失的问题。

``` js
function greeting() {
  console.log(`Hello, ${this.name}`);
}

var obj = {
  name: 'Sayaka',
  greeting,
};

var name = 'Mitsuha';

var otherGreeting = obj.greeting;

// 强制将 this 绑定到 obj
otherGreeting.call(obj); // Hello, Sayaka

setTimeout(obj.greeting.call(obj), 100); // Hello, Sayaka

```

但是显式绑定不一定保证能完全解决隐式绑定丢失的问题。下面这个例子中，虽然将 this 显式的指向了 obj，但在执行 fn() 时，相当于将 `obj.greeting` 赋值给了 fn，所以此时又发生了隐式绑定丢失。

``` js
function greeting() {
  console.log('Hello,', this.name);
}
var obj = {
  name: 'Yancey',
  greeting,
};
var name = 'Sayaka';
var otherGreeting = function(fn) {
  fn();
};

otherGreeting.call(obj, obj.greeting); // Hello, Sayaka

// 我们可以直接传递函数的调用给 fn
otherGreeting.call(obj, obj.greeting()); // Hello, Yancey

```

除了直接传递函数的调用，我们也可以给 fn() 也加上显式绑定，看下面这个例子。因为 otherGreeting 的 this 指向了 obj，在调用时，`fn.call(this);` 等价于 `obj.greeting.call(this)`， 显然此时 this 指向的就是 obj.

``` js
function greeting() {
  console.log('Hello,', this.name);
}
var obj = {
  name: 'Yancey',
  greeting,
};
var name = 'Sayaka';
var otherGreeting = function(fn) {
  fn.call(this);
};

otherGreeting.call(obj, obj.greeting); // Hello, Yancey

```

在使用显式绑定时，如果将 **null**, **undefined** 作为第一个参数传入 call, apply 或者 bind，实际应用的是默认绑定。

``` js
function greeting() {
  console.log('Hello,', this.name);
}
var obj = {
  name: 'Yancey',
  greeting,
};
var name = 'Sayaka';

var otherGreeting = obj.greeting;

// this 仍然指向 window
otherGreeting.call(null); // Hello, Sayaka

```

### new 绑定

首先来回忆一下 new 做了什么：

* 首先创建一个空对象

* 将构造函数的 prototype 赋值给此对象的 \_\_proto\_\_

* 将构造函数的 this 指向此对象

* 返回此对象

``` js
function pollfillNew(Con, ...args) {
  let obj = {};
  Object.setPrototypeOf(obj, Con.prototype);
  let result = Con.apply(obj, args);
  return result instanceof Object ? result : obj;
}

```

在使用 new 创建实例时，示例就会绑定到这个构造函数的 this.

``` js
function Dog(name) {
  this.name = name;
}

const husky = new Dog('Lolita');

husky.name; // Lolita

```

### 绑定优先级

new 绑定 > 显式绑定 > 隐式绑定 > 默认绑定

### 箭头函数

箭头函数的使用不必多说，这里只贴一下其注意事项。

1. 函数体内的 this 对象，继承的是外层代码块的 this。

2. 不可以当作构造函数，也就是说，不可以使用 new 命令，否则会抛出一个错误。

3. 不可以使用 arguments 对象，该对象在函数体内不存在。如果要用，可以用 rest 参数代替。

4. 不可以使用 yield 命令，因此箭头函数不能用作 Generator 函数。

5. 箭头函数没有自己的 this，因此不能使用 call()、apply()、bind()等方法改变 this 的指向。

``` js
var obj = {
  hi: function() {
    console.log(this);
    return () => {
      console.log(this);
    };
  },
  sayHi: function() {
    return function() {
      console.log(this);
      return () => {
        console.log(this);
      };
    };
  },
  say: () => {
    console.log(this);
  },
};

let hi = obj.hi(); // 输出 obj 对象
hi(); // 输出 obj 对象
let sayHi = obj.sayHi();
let fun1 = sayHi(); // 输出 window
fun1(); // 输出 window
obj.say(); // 输出 window

```

1.第一步是隐式绑定，此时 this 指向 obj，所以打印出 obj 对象

2.第二步执行 hi() 方法，虽然看着像闭包，但这是一个箭头函数，它会继承上一层的 this，也就是 obj，所以打印出 obj 对象

3.因为 obj.sayHi() 返回一个闭包，所以 this 指向 window，因此打印出 window 对象

4.同样箭头函数继承上一层的 this，所以 this 指向 window，因此打印出 window 对象

5.最后一次输出，因为 obj 中不存在 this，因此按作用域链找到全局的 this，也就是 window，所以打印出 window 对象

我们可以用箭头函数来解决上文的一个问题，这里虽然 setTimeout 会将 this 指向全局，但箭头函数继承上一层的 this，也就是 obj.greeting() 的 this，因为这是一个隐式绑定，所以 this 指向 obj，所以箭头函数的 this 也会指向 obj.

``` js
function greeting() {
  console.log(`Hello, ${this.name}`);
}
var obj = {
  name: 'Yancey',
  greeting() {
    setTimeout(() => {
      console.log(`Hello, ${this.name}`);
    });
  },
};

var name = 'Sayaka';

obj.greeting(); // Hello, Yancey

```

## 总结

* 函数是否在 new 中调用(new 绑定)，如果是，那么 this 绑定的是新创建的对象。

* 函数是否通过 call,apply 调用，或者使用了 bind(即硬绑定)，如果是，那么 this 绑定的就是指定的对象。

* 函数是否在某个上下文对象中调用(隐式绑定)，如果是的话，this 绑定的是那个上下文对象。一般是 obj.foo()

* 如果以上都不是，那么使用默认绑定。如果在严格模式下，则绑定到 undefined，否则绑定到全局对象。

* 如果把 Null 或者 undefined 作为 this 的绑定对象传入 call、apply 或者 bind，这些值在调用时会被忽略，实际应用的是默认绑定规则。

* 如果是箭头函数，箭头函数的 this 继承的是外层代码块的 this。

## 面试题解析

我们逐句分析一下开篇那道面试题。

因为 `obj.fn` 是一个立即执行函数（this 会指向 window），所以在 obj 创建时就会执行一次，并返回闭包函数。

``` js
var number; // 创建了一个私有变量 number 但未赋初值
this.number *= 2; // this.number 指向的是全局那个 number，所以 window.number = 10
number = number * 2; // 因为私有变量 number 未赋初值，所以乘以 2 会变为 NaN
number = 3; // 此时私有变量 number 变为 3

```

接着执行下面两句：

``` js
var fn = obj.fn;
fn.call(null);

```

因为将 `obj.fn` 赋值给一个全局变量 fn，所以此时 this 指向 window。接着，当 call 的第一个参数是 null 或者 undefined 时，调用的是默认绑定，因此 this 仍然指向 window.

``` js
var num = this.number; // 因为 window.number = 10，所以 num 也就是 10
this.number *= 2; // window.number 变成了 20
console.log(num); // 打印出 10
number *= 3; // 因为是闭包函数，有权访问父函数的私有变量，所以此时 number 为 9
console.log(number); // 打印出 9

```

当执行 `obj.fn();` 时，此时的 this 指向的是 obj:

``` js
var num = this.number; // 因为 obj.number = 3，所以 num 也就为 3
this.number *= 2; // obj.number 变为 6
console.log(num); // 打印出 3
number *= 3; // 上一轮私有变量为变成了 9，所以这里变成 27
console.log(number); // 打印出 27

```

最后打印出 `window.number` 就是 20

```
最终结果：
10
9
3
27
20

```

## 再来两个例子练练手

``` js
var length = 10;

function fn() {
  console.log(this.length);
}

var obj = {
  length: 5,
  method: function(fn) {
    fn();
    arguments[0]();
  },
};

obj.method(fn, 1);

```

传入了 fn 而非 fn()，相当于把 fn 函数赋值给 method 里的 fn 执行，所以这里是默认绑定，此时 this 指向 window，所以执行 fn() 时会打印出 10

arguments\[0\]\(\)，就相当于执行 fn\(\)，所以是隐式绑定，此时 this 指向 arguments，所以 `this.length` 就相当于 `arguments.length`，因为我们传递了两个参数，因此返回 2

``` js
window.val = 1;

var obj = {
  val: 2,
  dbl: function() {
    this.val *= 2;
    val *= 2;
    console.log('val:', val);
    console.log('this.val:', this.val);
  },
};

obj.dbl();
var func = obj.dbl;
func();

```

第一次调用是隐式调用，因此 this 指向 obj，所以 this.val 也就是 obj.val 变成了 4，但是 dbl 方法中没有定义 val，所以会沿着作用域链找到 window.val，所以会依次打印出 2，4

第二次是默认调用，this 指向 window，window.val 会经历两次乘 2 变成 8，所以会依次打印出 8，8

## 参考

[嗨，你真的懂 this 吗？](https://juejin.im/post/5c96d0c751882511c832ff7b)

[「前端面试题系列 4」this 的原理以及用法](https://juejin.im/post/5c428ce0f265da612b13dca7)

[JavaScript 的 this 原理](http://www.ruanyifeng.com/blog/2018/06/javascript-this.html)
