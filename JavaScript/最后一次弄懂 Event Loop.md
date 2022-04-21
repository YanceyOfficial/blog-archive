# 最后一次弄懂 Event Loop

> Event Loop 是 JavaScript 异步编程的核心思想, 也是前端进阶必须跨越的一关. 同时, 它又是面试的必考点, 特别是在 Promise 出现之后, 各种各样的面试题层出不穷, 花样百出. 这篇文章从现实生活中的例子入手, 让你彻底理解 Event Loop 的原理和机制, 并能游刃有余的解决此类面试题.

## 宇宙条那道烂大街的笔试题镇楼

```js
async function async1() {
  console.log("async1 start");
  await async2();
  console.log("async1 end");
}
async function async2() {
  console.log("async2");
}
console.log("script start");
setTimeout(function () {
  console.log("setTimeout");
}, 0);
async1();
new Promise(function (resolve) {
  console.log("promise1");
  resolve();
}).then(function () {
  console.log("promise2");
});
console.log("script end");
```

## 为什么 JavaScript 是单线程的?

我们都知道 JavaScript 是一门 `单线程` 语言, 也就是说同一时间只能做一件事. 这是因为 JavaScript 生来作为浏览器脚本语言, 主要用来处理与用户的交互, 网络以及操作 DOM. 这就决定了它只能是单线程的, 否则会带来很复杂的同步问题.

假设 JavaScript 有两个线程, 一个线程在某个 DOM 节点上添加内容, 另一个线程删除了这个节点, 这时浏览器应该以哪个线程为准?

既然 Javascript 是单线程的, 它就像是只有一个窗口的银行, 客户不得不排队一个一个的等待办理. 同理 JavaScript 的任务也要一个接一个的执行, 如果某个任务(比如加载高清图片)是个耗时任务, 那浏览器岂不得一直卡着? 为了防止主线程的阻塞, JavaScript 有了 `同步` 和 `异步` 的概念.

## 同步和异步

### 同步

如果在一个函数返回的时候, 调用者就能够得到预期结果, 那么这个函数就是同步的. 也就是说同步方法调用一旦开始, 调用者必须等到该函数调用返回后, 才能继续后续的行为. 下面这段段代码首先会弹出 alert 框, 如果你不点击 `确定` 按钮, 所有的页面交互都被锁死, 并且后续的 `console` 语句不会被打印出来.

```js
alert("Yancey");
console.log("is");
console.log("the");
console.log("best");
```

### 异步

如果在函数返回的时候, 调用者还不能够得到预期结果, 而是需要在将来通过一定的手段得到, 那么这个函数就是异步的. 比如说发一个网络请求, 我们告诉主程序等到接收到数据后再通知我, 然后我们就可以去做其他的事情了. 当异步完成后, 会通知到我们, 但是此时可能程序正在做其他的事情, 所以即使异步完成了也需要在一旁等待, 等到程序空闲下来才有时间去看哪些异步已经完成了, 再去执行.

这也就是定时器并不能精确在指定时间后输出回调函数结果的原因.

```js
setTimeout(() => {
  console.log("yancey");
}, 1000);

for (let i = 0; i < 100000000; i += 1) {
  // todo
}
```

## 执行栈和任务队列

- 栈 (stack): 栈是遵循后进先出 (LIFO) 原则的有序集合, 新添加或待删除的元素都保存在同一端, 称为栈顶, 另一端叫做栈底. 在栈里, 新元素都靠近栈顶, 旧元素都接近栈底. 栈在编程语言的编译器和内存中存储基本数据类型和对象的指针, 方法调用等.

- 队列 (queue): 队列是遵循先进先出 (FIFO) 原则的有序集合, 队列在尾部添加新元素, 并在顶部移除元素, 最新添加的元素必须排在队列的末尾. 在计算机科学中, 最常见的例子就是打印队列.

- 堆 (heap): 堆是基于树抽象数据类型的一种特殊的数据结构.

![栈/队列](https://edge.yancey.app/beg/16a3e8964d42e54e.png)

如上图所示, JavaScript 中的内存分为 `堆内存` 和 `栈内存`,

JavaScript 中引用类型值的大小是不固定的, 因此它们会被存储到 `堆内存` 中, 由系统自动分配存储空间. JavaScript 不允许直接访问堆内存中的位置, 因此我们不能直接操作对象的堆内存空间, 而是操作 `对象的引用`.

而 JavaScript 中的基础数据类型都有固定的大小, 因此它们被存储到 `栈内存` 中. 我们可以直接操作保存在栈内存空间的值, 因此基础数据类型都是 `按值访问`. 此外, 栈内存还会存储 `对象的引用 (指针)` 以及 `函数执行时的运行空间`.

下面比较一下两种存储方式的不同.

| 栈内存                 | 堆内存                       |
| ---------------------- | ---------------------------- |
| 存储基础数据类型       | 存储引用数据类型             |
| 按值访问               | 按引用访问                   |
| 存储的值大小固定       | 存储的值大小不定, 可动态调整 |
| 由系统自动分配内存空间 | 由程序员通过代码进行分配     |
| 主要用来执行程序       | 主要用来存放对象             |
| 空间小, 运行效率高     | 空间大, 但是运行效率相对较低 |
| 先进后出, 后进先出     | 无序存储, 可根据引用直接获取 |

### 执行栈

当我们调用一个方法的时候, JavaScript 会生成一个与这个方法对应的执行环境, 又叫执行上下文(context). 这个执行环境中保存着该方法的私有作用域, 上层作用域(作用域链), 方法的参数, 以及这个作用域中定义的变量和 this 的指向, 而当一系列方法被依次调用的时候. 由于 JavaScript 是单线程的, 这些方法就会按顺序被排列在一个单独的地方, 这个地方就是所谓执行栈.

### 任务队列

事件队列是一个存储着 `异步任务` 的队列, 其中的任务严格按照时间先后顺序执行, 排在队头的任务将会率先执行, 而排在队尾的任务会最后执行. 事件队列每次仅执行一个任务, 在该任务执行完毕之后, 再执行下一个任务. 执行栈则是一个类似于函数调用栈的运行容器, 当执行栈为空时, JS 引擎便检查事件队列, 如果事件队列不为空的话, 事件队列便将第一个任务压入执行栈中运行.

![任务队列](https://edge.yancey.app/beg/g1tyu1pj-1650445583033.webp)

## 页面使用单线程的缺点

我们知道页面线程所有执行的任务都来自于消息队列. 消息队列是先进先出的属性, 也就是说放入队列中的任务, 需要等待前面的任务被执行完, 才会被执行. 假设有一个耗时的任务, 它是同步的, 就会导致执行效率的下降. 如果它是异步的, 它将被添加到消息队列的尾部, 那么又会影响到实时性, 因为在添加到消息队列的过程中, 可能前面就有很多任务在排队了.

为了权衡效率和实时性, 微任务就应用而生了. 通常我们把消息队列中的任务称为宏任务, 每个宏任务中都包含了一个微任务队列. 在执行宏任务的过程中, 如果有一些微任务, 那么就会将该变化添加到微任务列表中, 这样就不会影响到宏任务的继续执行, 因此也就解决了执行效率的问题. 等宏任务中的主要功能都直接完成之后, 这时候, 渲染引擎并不着急去执行下一个宏任务, 而是执行当前宏任务中的微任务, 因为这些微任务的事件都保存在这些微任务队列中, 这样也就解决了实时性问题.

第二个是如何解决单个任务执行时长过久的问题. 因为所有的任务都是在单线程中执行的, 所以每次只能执行一个任务, 而其他任务就都处于等待状态. 如果其中一个任务执行时间过久, 那么下一个任务就要等待很长时间. 针对这种情况, JavaScript 可以通过回调功能来规避这种问题, 也就是让要执行的 JavaScript 任务滞后执行.

## 单线程处理任务的方法论

- 如果有一些确定好的任务, 可以使用一个单线程来按照顺序处理这些任务, 这是第一版线程模型.
- 要在线程执行过程中接收并处理新的任务, 就需要引入循环语句和事件系统, 这是第二版线程模型.
- 如果要接收其他线程发送过来的任务, 就需要引入消息队列, 这是第三版线程模型.
- 如果其他进程想要发送任务给页面主线程, 那么先通过 IPC 把任务发送给渲染进程的 IO 线程, IO 线程再把任务发送给页面主线程.
- 消息队列机制并不是太灵活, 为了适应效率和实时性, 引入了微任务.

## 事件循环

我们注意到, 在异步代码完成后仍有可能要在一旁等待, 因为此时程序可能在做其他的事情, 等到程序空闲下来才有时间去看哪些异步已经完成了. 所以 JavaScript 有一套机制去处理同步和异步操作, 那就是事件循环 (Event Loop).

下面就是事件循环的示意图.

![事件循环示意图](https://edge.yancey.app/beg/16a3e8964d1e54ce.png)

用文字描述的话, 大致是这样的:

异步任务的返回结果会被放到一个任务队列中, 根据异步事件的类型, 这个事件实际上会被放到对应的宏任务和微任务队列中去.

在当前执行栈为空时, 主线程会查看微任务队列是否有事件存在

- 存在, 依次执行队列中的事件对应的回调, 直到微任务队列为空, 然后去宏任务队列中取出最前面的事件, 把当前的回调加到当前指向栈.
- 如果不存在, 那么再去宏任务队列中取出一个事件并把对应的回到加入当前执行栈;
  当前执行栈执行完毕后时会立刻处理所有微任务队列中的事件, 然后再去宏任务队列中取出一个事件. 同一次事件循环中, 微任务永远在宏任务之前执行.

在事件循环中, 每进行一次循环操作称为 tick, 每一次 tick 的任务处理模型是比较复杂的, 但关键步骤如下:

- 执行一个宏任务(栈中没有就从事件队列中获取)
- 执行过程中如果遇到微任务, 就将它添加到微任务的任务队列中
- 宏任务执行完毕后, 立即执行当前微任务队列中的所有微任务(依次执行)
- 当前宏任务执行完毕, 开始检查渲染, 然后 GUI 线程接管渲染
- 渲染完毕后, JS 线程继续接管, 开始下一个宏任务(从事件队列中获取)

简单总结一下执行的顺序:

执行宏任务, 然后执行该宏任务产生的微任务, 若微任务在执行过程中产生了新的微任务, 则继续执行微任务, 微任务执行完毕后, 再回到宏任务中进行下一轮循环.

![事件循环流程图](https://edge.yancey.app/beg/7hev6i1qvz-1625658327597)

看一个例子:

```ts
console.log("start");

setTimeout(function () {
  console.log("setTimeout");
}, 0);

Promise.resolve()
  .then(function () {
    console.log("promise1");
  })
  .then(function () {
    console.log("promise2");
  });

console.log("end");
```

![1653721873-5adb68e2247cf.gif](https://edge.yancey.app/beg/1653721873-5adb68e2247cf.gif)

## 宏任务和微任务

异步任务分为 `宏任务(macrotask)` 与 `微任务 (microtask)`. 宏任务会进入一个队列, 而微任务会进入到另一个不同的队列, 且微任务要优于宏任务执行.

[微任务, 宏任务与 Event-Loop](https://juejin.im/post/5b73d7a6518825610072b42b#heading-5) 这篇文章用了很有趣的例子来解释宏任务和微任务, 下面 copy 一下.

还是以去银行办业务为例, 当 5 号窗口柜员处理完当前客户后, 开始叫号来接待下一位客户, 我们将每个客户比作 `宏任务`, `接待下一位客户` 的过程也就是让下一个 `宏任务` 进入到执行栈.

所以该窗口所有的客户都被放入了一个 `任务队列` 中. 任务队列中的都是 `已经完成的异步操作的`, 而不是注册一个异步任务就会被放在这个任务队列中(它会被放到 Task Table 中). 就像在银行中排号, 如果叫到你的时候你不在, 那么你当前的号牌就作废了, 柜员会选择直接跳过进行下一个客户的业务处理, 等你回来以后还需要重新取号.

在执行宏任务时, 是可以穿插一些微任务进去. 比如你大爷在办完业务之后, 顺便问了下柜员: “最近 P2P 暴雷很严重啊, 有没有其他稳妥的投资方式”. 柜员暗爽: “又有傻子上钩了”, 然后叽里咕噜说了一堆.

我们分析一下这个过程, 虽然大爷已经办完正常的业务, 但又咨询了一下理财信息, 这时候柜员肯定不能说: “您再上后边取个号去, 重新排队”. 所以只要是柜员能够处理的, 都会在响应下一个宏任务之前来做, 我们可以把这些任务理解成是 `微任务`.

大爷听罢, 扬起 45 度微笑, 说: “我就问问. ”

柜员 OS: “艹...”

这个例子就说明了: ~~你大爷永远是你大爷~~ `在当前微任务没有执行完成时, 是不会执行下一个宏任务的!`

### 宏任务

为了协调这些任务有条不紊地在主线程上执行, 页面进程引入了消息队列和事件循环机制, 渲染进程内部会维护多个消息队列, 比如延迟执行队列和普通的消息队列. 然后主线程采用一个 for 循环, 不断地从这些任务队列中取出任务并执行任务. 我们把这些消息队列中的任务称为宏任务.

宏任务可以满足我们大部分的日常需求, 不过如果有对时间精度要求较高的需求, 宏任务就难以胜任了. 这是因为页面的渲染事件, 各种 IO 的完成事件, 执行 JavaScript 脚本的事件, 用户交互的事件等都随时有可能被添加到消息队列中, 而且添加事件是由系统操作的, JavaScript 代码不能准确掌控任务要添加到队列中的位置, 控制不了任务在消息队列中的位置, 所以很难控制开始执行任务的时间.

```ts
function timerCallback2() {
  console.log(2);
}

function timerCallback() {
  console.log(1);
  setTimeout(timerCallback2, 0);
}

setTimeout(timerCallback, 0);
```

比如上面这段代码, 你调用 setTimeout 来设置回调任务的间隙, 但消息队列中就有可能被插入很多系统级的任务. 如果中间被插入的任务执行时间过久的话, 那么就会影响到后面任务的执行了. 所以说宏任务的时间粒度比较大, 执行的时间间隔是不能精确控制的, 对一些高实时性的需求就不太符合了.

![Performance 记录](https://edge.yancey.app/beg/rl44re8h-1650540528919.webp)

### 微任务

微任务是一个需要异步执行的函数, 执行时机是在主函数执行结束之后, 当前宏任务结束之前. 当 JavaScript 执行一段脚本的时候, V8 会为其创建一个全局执行上下文, 在创建全局执行上下文的同时, V8 引擎也会在内部创建一个微任务队列. 每个宏任务都关联了一个微任务队列.

在现代浏览器里面, 产生微任务有两种方式. 一个是 MutationObserver, 另一个是 Promise.then, Promise.resolve, Promise.reject 这些. 通过 DOM 节点变化产生的微任务或者使用 Promise 产生的微任务都会被 JavaScript 引擎按照顺序保存到微任务队列中.

通常情况下, 在当前宏任务中的 JavaScript 快执行完成时, 也就在 JavaScript 引擎准备退出全局执行上下文并清空调用栈的时候, JavaScript 引擎会检查全局执行上下文中的微任务队列, 然后按照顺序执行队列中的微任务. WHATWG 把执行微任务的时间点称为检查点.

如果在执行微任务的过程中, 产生了新的微任务, 同样会将该微任务添加到微任务队列中, V8 引擎一直循环执行微任务队列中的任务, 直到队列为空才算执行结束. 也就是说在执行微任务过程中产生的新的微任务并不会推迟到下个宏任务中执行, 而是在当前的宏任务中继续执行.

![微任务添加](https://edge.yancey.app/beg/hez6dg4s-1650540943549.webp)

![微任务执行](https://edge.yancey.app/beg/pb8nvxor-1650540920071.webp)

所以我们得出几个结论:

- 微任务和宏任务是绑定的, 每个宏任务在执行时, 会创建自己的微任务队列.
- 微任务的执行时长会影响到当前宏任务的时长. 比如一个宏任务在执行过程中, 产生了 100 个微任务, 执行每个微任务的时间是 10 毫秒, 那么执行这 100 个微任务的时间就是 1000 毫秒, 也可以说这 100 个微任务让宏任务的执行时间延长了 1000 毫秒.
- 在一个宏任务中, 分别创建一个用于回调的宏任务和微任务, 无论什么情况下, 微任务都早于宏任务执行.

### 常见的宏任务和微任务

宏任务: script(整体代码), setTimeout, setInterval, I/O, 事件, postMessage, MessageChannel, setImmediate (Node.js)

微任务: Promise.then, MutaionObserver, process.nextTick (Node.js)

### 来做几道题

看看下面这道题你能不能做出来.

```js
setTimeout(() => {
  console.log("A");
}, 0);
var obj = {
  func: function () {
    setTimeout(function () {
      console.log("B");
    }, 0);
    return new Promise(function (resolve) {
      console.log("C");
      resolve();
    });
  },
};
obj.func().then(function () {
  console.log("D");
});
console.log("E");
```

- 第一个 `setTimeout` 放到宏任务队列, 此时宏任务队列为 ['A']

- 接着执行 obj 的 func 方法, 将 `setTimeout` 放到宏任务队列, 此时宏任务队列为 ['A', 'B']

- 函数返回一个 Promise, 因为这是一个同步操作, 所以先打印出 `'C'`

- 接着将 `then` 放到微任务队列, 此时微任务队列为 ['D']

- 接着执行同步任务 `console.log('E');`, 打印出 `'E'`

- 因为微任务优先执行, 所以先输出 `'D'`

- 最后依次输出 `'A'` 和 `'B'`

再来看一道阮一峰老师出的题目, 其实也不难.

```js
let p = new Promise((resolve) => {
  resolve(1);
  Promise.resolve().then(() => console.log(2));
  console.log(4);
}).then((t) => console.log(t));
console.log(3);
```

- 首先将 `Promise.resolve()` 的 then() 方法放到微任务队列, 此时微任务队列为 ['2']

- 然后打印出同步任务 `4`

- 接着将 `p` 的 then() 方法放到微任务队列, 此时微任务队列为 ['2', '1']

- 打印出同步任务 `3`

- 最后依次打印微任务 `2` 和 `1`

## 当 Event Loop 遇到 async/await

我们知道, async/await 仅仅是生成器的语法糖, 所以不要怕, 只要把它转换成 Promise 的形式即可. 下面这段代码是 async/await 函数的经典形式.

```js
async function foo() {
  // await 前面的代码
  await bar();
  // await 后面的代码
}

async function bar() {
  // do something...
}

foo();
```

其中 `await 前面的代码` 是同步的, 调用此函数时会直接执行; 而 `await bar();` 这句可以被转换成 `Promise.resolve(bar())`; `await 后面的代码` 则会被放到 Promise 的 then() 方法里. 因此上面的代码可以被转换成如下形式, 这样是不是就很清晰了?

```js
function foo() {
  // await 前面的代码
  Promise.resolve(bar()).then(() => {
    // await 后面的代码
  });
}

function bar() {
  // do something...
}

foo();
```

回到开篇宇宙条那道烂大街的题目, 我们"重构"一下代码, 再做解析, 是不是很轻松了?

```js
function async1() {
  console.log("async1 start"); // 2

  Promise.resolve(async2()).then(() => {
    console.log("async1 end"); // 6
  });
}

function async2() {
  console.log("async2"); // 3
}

console.log("script start"); // 1

setTimeout(function () {
  console.log("settimeout"); // 8
}, 0);

async1();

new Promise(function (resolve) {
  console.log("promise1"); // 4
  resolve();
}).then(function () {
  console.log("promise2"); // 7
});
console.log("script end"); // 5
```

- 首先打印出 `script start`

- 接着将 `settimeout` 添加到宏任务队列, 此时宏任务队列为 `['settimeout']`

- 然后执行函数 `async1`, 先打印出 `async1 start`, 又因为 `Promise.resolve(async2())` 是同步任务, 所以打印出 `async2`, 接着将 `async1 end` 添加到微任务队列, , 此时微任务队列为 ['async1 end']

- 接着打印出 `promise1`, 将 `promise2` 添加到微任务队列, , 此时微任务队列为 `['async1 end', promise2]`

- 打印出 `script end`

- 因为微任务优先级高于宏任务, 所以先依次打印出 `async1 end` 和 `promise2`

- 最后打印出宏任务 `settimeout`

> 关于这道题的争议: 文章发表了大概有两天的时间, 陆陆续续收到了小伙伴的评论. 大多都是 `async1 end` 和 `promise2` 的顺序问题. 我在 `Chrome 73.0.3683.103 for MAC` 和 `Node.js v8.15.1` 测试是 `async1 end` 先于 `promise2`, 在 `FireFox 66.0.3 for MAC` 测试是 `async1 end` 后于 `promise2`.

## Node.js 的事件循环

浏览器中有事件循环, node 中也有, 事件循环是 node 处理非阻塞 I/O 操作的机制, node 中事件循环的实现是依靠的 libuv 引擎. 由于 node 11 之后, 事件循环的一些原理发生了变化, 这里就以新的标准去讲.

```ts
   ┌───────────────────────────┐
┌─>│           timers          │
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks     │
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │
│  └─────────────┬─────────────┘      ┌───────────────┐
│  ┌─────────────┴─────────────┐      │   incoming:   │
│  │           poll            │<─────┤  connections, │
│  └─────────────┬─────────────┘      │   data, etc.  │
│  ┌─────────────┴─────────────┐      └───────────────┘
│  │           check           │
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
└──┤      close callbacks      │
   └───────────────────────────┘
```

### Node.js 中的宏任务和微任务

macro-task 大概包括:

- setTimeout

- setInterval

- setImmediate

- script(整体代码)

- I/O 操作等.

micro-task 大概包括:

- process.nextTick(与普通微任务有区别, 在微任务队列执行之前执行)

- new Promise().then(回调)等.

图中的每个框被称为事件循环机制的一个阶段, 每个阶段都有一个 FIFO 队列来执行回调. 虽然每个阶段都是特殊的, 但通常情况下, 当事件循环进入给定的阶段时, 它将执行特定于该阶段的任何操作, 然后执行该阶段队列中的回调, 直到队列用尽或最大回调数已执行. 当该队列已用尽或达到回调限制, 事件循环将移动到下一阶段.

因此, 从上面这个简化图中, 我们可以分析出 node 的事件循环的阶段顺序为:

输入数据阶段(incoming data)->轮询阶段(poll)->检查阶段(check)->关闭事件回调阶段(close callback)->定时器检测阶段(timers)->I/O 事件回调阶段(I/O callbacks)->闲置阶段(idle, prepare)->轮询阶段...

- 定时器检测阶段(timers): 本阶段执行 timer 的回调, 即 setTimeout, setInterval 里面的回调函数.

- I/O 事件回调阶段(I/O callbacks): 执行延迟到下一个循环迭代的 I/O 回调, 即上一轮循环中未被执行的一些 I/O 回调.

- 闲置阶段(idle, prepare): 仅系统内部使用.

- 轮询阶段(poll): 检索新的 I/O 事件;执行与 I/O 相关的回调(几乎所有情况下, 除了关闭的回调函数, 那些由计时器和 setImmediate() 调度的之外), 其余情况 node 将在适当的时候在此阻塞.

- 检查阶段(check): setImmediate() 回调函数在这里执行

- 关闭事件回调阶段(close callback): 一些关闭的回调函数, 如: socket.on('close', ...).

## 浅谈 Web Workers

需要强调的是, Worker 是浏览器(即宿主环境)的功能, 实际上和 JavaScript 语言本身几乎没有什么关系. 也就是说, JavaScript 当前并没有任何支持多线程执行的功能.

所以, JavaScript 是一门单线程的语言! JavaScript 是一门单线程的语言! JavaScript 是一门单线程的语言!

浏览器可以提供多个 `JavaScript 引擎实例`, 各自运行在自己的线程上, 这样你可以在每个线程上运行不同的程序. 程序中每一个这样的的独立的多线程部分被称为一个 Worker. 这种类型的并行化被称为 `任务并行`, 因为其重点在于把程序划分为多个块来并发运行. 下面是 Worker 的运作流图.

![web worker](https://edge.yancey.app/beg/16a3e8964d3a7ae8.png)

### Web Worker 实例

下面用一个阶乘的例子浅谈 Worker 的用法.

![计算阶乘的实例](https://edge.yancey.app/beg/16a3e8964d2d4242.jpg)

首先新建一个 `index.html` , 直接上代码:

```html
<body>
  <fieldset>
    <legend>计算阶乘</legend>
    <input id="input" type="number" placeholder="请输入一个正整数" />
    <button id="btn">计算</button>
    <p>计算结果: <span id="result"></span></p>
  </fieldset>
  <legend></legend>

  <script>
    const input = document.getElementById("input");
    const btn = document.getElementById("btn");
    const result = document.getElementById("result");

    btn.addEventListener("click", () => {
      const worker = new Worker("./worker.js");

      // 向 Worker 发送消息
      worker.postMessage(input.value);

      // 接收来自 Worker 的消息
      worker.addEventListener("message", (e) => {
        result.innerHTML = e.data;

        // 使用完 Worker 后记得关闭
        worker.terminate();
      });
    });
  </script>
</body>
```

在同目录下新建一个 `work.js`, 内容如下:

```js
function memorize(f) {
  const cache = {};
  return function () {
    const key = Array.prototype.join.call(arguments, ",");
    if (key in cache) {
      return cache[key];
    } else {
      return (cache[key] = f.apply(this, arguments));
    }
  };
}

const factorial = memorize((n) => {
  return n <= 1 ? 1 : n * factorial(n - 1);
});

// 监听主线程发过来的消息
self.addEventListener(
  "message",
  function (e) {
    // 响应主线程
    self.postMessage(factorial(e.data));
  },
  false
);
```

## 谈一谈 setTimeout

上面我们说道宏任务会放在消息队列中, 但除此之外, 还有另外一个消息队列, 这个队列中维护了需要延迟执行的任务列表, 包括了定时器和 [Chromium 内部一些需要延迟执行的任务](https://source.chromium.org/chromium/chromium/src/+/main:base/task/sequence_manager/task_queue_impl.h;l=391;bpv=0;bpt=1). 所以当通过 JavaScript 创建一个定时器时, 渲染进程会将该定时器的回调任务添加到延迟队列中, 延迟队列的签名如下:

```c++
DelayedIncomingQueue delayed_incoming_queue;
```

当通过 JavaScript 调用 setTimeout 设置回调函数的时候, 渲染进程将会创建一个回调任务, 包含了回调函数 callBack, 当前发起时间, 延迟执行时间,

```c++
struct DelayTask {
  int64 id;
  CallBackFunction cbf;
  int start_time;
  int delay_time;
};
DelayTask timerTask;
timerTask.cbf = callBack;
timerTask.start_time = getCurrentTime(); //获取当前时间
timerTask.delay_time = 200;//设置延迟执行时间
```

创建好回调任务之后, 再将该任务添加到延迟执行队列中, 代码如下所示:

```c++
delayed_incoming_queue.push(timerTask);
```

我们添加了一个 ProcessDelayTask 函数, 该函数是专门用来处理延迟执行任务的, 它会在 delayed_incoming_queue 中取出已经到期的定时器任务依次执行.

这里我们要重点关注它的执行时机, 在上段代码中, 处理完消息队列中的一个任务之后, 就开始执行 ProcessDelayTask 函数. ProcessDelayTask 函数会根据发起时间和延迟时间计算出到期的任务, 然后依次执行这些到期的任务. 等到期的任务执行完成之后, 再继续下一个循环过程. 通过这样的方式, 一个完整的定时器就实现了.

```c++
void ProcessTimerTask() {
  // 从 delayed_incoming_queue 中取出已经到期的定时器任务
  // 依次执行这些任务
}

TaskQueue task_queue;
void ProcessTask();
bool keep_running = true;
void MainTherad() {
  for(;;){
    //执行消息队列中的任务
    Task task = task_queue.takeTask();
    ProcessTask(task);

    //执行延迟队列中的任务
    ProcessDelayTask()

    if(!keep_running) //如果设置了退出标志, 那么直接退出线程循环
        break;
  }
}
```

`clearTimeout(timer_id)` 的原理也很简单, 就是在 delayed_incoming_queue 把 timer_id 删掉即可.

### 使用 setTimeout 的一些注意事项

#### 如果当前任务执行时间过久, 会影响定时器任务的执行

这个很好理解, 要执行消息队列中的下个任务, 需要等待当前的任务执行完成, 所以当前任务很重的话, 势必会影响到下个任务的执行.

#### 如果 setTimeout 存在嵌套调用, 那么系统会设置最短时间间隔为 4 毫秒

![最短时间间隔为 4 毫秒](https://edge.yancey.app/beg/6j7l3o5c-1650464022544.webp)

上图中的竖线就是定时器的函数回调过程, 从图中可以看出, 前面五次调用的时间间隔比较小, 嵌套调用超过五次以上, 后面每次的调用最小时间间隔是 4 毫秒. 之所以出现这样的情况, 是因为在 Chrome 中, 定时器被嵌套调用 5 次以上, 系统会判断该函数方法被阻塞了, 如果定时器的调用时间间隔小于 4 毫秒, 那么浏览器会将每次调用的时间间隔设置为 4 毫秒.

```c++
static const int kMaxTimerNestingLevel = 5;

// Chromium uses a minimum timer interval of 4ms. We'd like to go
// lower; however, there are poorly coded websites out there which do
// create CPU-spinning loops.  Using 4ms prevents the CPU from
// spinning too busily and provides a balance between CPU spinning and
// the smallest possible interval timer.
static constexpr base::TimeDelta kMinimumInterval = base::TimeDelta::FromMilliseconds(4);


base::TimeDelta interval_milliseconds =
      std::max(base::TimeDelta::FromMilliseconds(1), interval);

  if (interval_milliseconds < kMinimumInterval &&
      nesting_level_ >= kMaxTimerNestingLevel)
    interval_milliseconds = kMinimumInterval;

  if (single_shot)
    StartOneShot(interval_milliseconds, FROM_HERE);
  else
    StartRepeating(interval_milliseconds, FROM_HERE);
```

#### 未激活的页面, setTimeout 执行最小间隔是 1000 毫秒

如果标签不是当前的激活标签, 那么定时器最小的时间间隔是 1000 毫秒, 目的是为了优化后台页面的加载损耗以及降低耗电量.

#### 延时执行时间有最大值

除了要了解定时器的回调函数时间比实际设定值要延后之外, 还有一点需要注意下, 那就是 Chrome, Safari, Firefox 都是以 32 个 bit 来存储延时值的, 32bit 最大只能存放的数字是 2147483647 毫秒, 这就意味着, 如果 setTimeout 设置的延迟值大于 2147483647 毫秒（大约 24.8 天）时就会溢出, 那么相当于延时值被设置为 0 了, 这导致定时器会被立即执行.

#### 小心 setTimeout 设置的回调函数中的 this

如下代码中 showName 的 this 指向的是 window, 为了解决这个问题, 你可以 bind 一下.

```ts
var name = 1;
var MyObj = {
  name: 2,
  showName: function () {
    console.log(this.name);
  },
};
setTimeout(MyObj.showName, 1000);
```

## 谈一谈 XMLHttpRequest

首先谈一谈同步回调和异步回调. 将一个函数作为参数传递给另外一个函数, 那作为参数的这个函数就是回调函数, 回调函数可以是同步或者异步的. 回调函数 callback 是在主函数返回之前执行的, 我们把这个回调过程称为同步回调. 回调函数 callback 并没有在主函数内部被调用, 我们把这种回调函数在主函数外部执行的过程称为异步回调.

```ts
// 同步回调
let callback = function () {
  console.log("i am do homework");
};
function doWork(cb) {
  console.log("start do work");
  cb();
  console.log("end do work");
}
doWork(callback);
```

```ts
// 异步回调
let callback = function () {
  console.log("i am do homework");
};
function doWork(cb) {
  console.log("start do work");
  setTimeout(cb, 1000);
  console.log("end do work");
}
doWork(callback);
```

我们知道消息队列和主线程循环机制保证了页面有条不紊地运行. 这里还需要补充一点, 那就是当循环系统在执行一个任务的时候, 都要为这个任务维护一个系统调用栈. 这个系统调用栈类似于 JavaScript 的调用栈, 只不过系统调用栈是 Chromium 的开发语言 C++ 来维护的.

![消息循环系统调用栈记录](https://edge.yancey.app/beg/3ftb0md5-1650528631114.webp)

这幅图记录了一个 Parse HTML 的任务执行过程, 其中黄色的条目表示执行 JavaScript 的过程, 其他颜色的条目表示浏览器内部系统的执行过程.

通过该图你可以看出来, Parse HTML 任务在执行过程中会遇到一系列的子过程, 比如在解析页面的过程中遇到了 JavaScript 脚本, 那么就暂停解析过程去执行该脚本, 等执行完成之后, 再恢复解析过程. 然后又遇到了样式表, 这时候又开始解析样式表... 直到整个任务执行完成.

需要说明的是, 整个 Parse HTML 是一个完整的任务, 在执行过程中的脚本解析, 样式表解析都是该任务的子过程, 其下拉的长条就是执行过程中调用栈的信息.

每个任务在执行过程中都有自己的调用栈, 那么同步回调就是在当前主函数的上下文中执行回调函数, 这个没有太多可讲的. 下面我们主要来看看异步回调过程, 异步回调是指回调函数在主函数之外执行, 一般有两种方式:

- 第一种是把异步函数做成一个任务, 添加到信息队列尾部;
- 第二种是把异步函数添加到微任务队列中, 这样就可以在当前任务的末尾处执行微任务了.

### XMLHttpRequest 运作机制

![XMLHttpRequest 运作机制](https://edge.yancey.app/beg/93zmowbx-1650530029418.webp)

这里仅仅说下 xhr.send 发生的事情. 对照上面那张请求流程图, 以看到: 渲染进程会将请求发送给网络进程, 然后网络进程负责资源的下载, 等网络进程接收到数据之后, 就会利用 IPC 来通知渲染进程; 渲染进程接收到消息之后, 会将 xhr 的回调函数封装成任务并添加到消息队列中, 等主线程循环系统执行到该任务的时候, 就会根据相关的状态来调用对应的回调函数.

### MutationObserver

MutationObserver API 可以用来监视 DOM 的变化, 包括属性的变化, 节点的增减, 内容的变化等.

它将响应函数改成异步调用, 可以不用在每次 DOM 变化都触发异步调用, 而是等多次 DOM 变化后, 一次触发异步调用, 并且还会使用一个数据结构来记录这期间所有的 DOM 变化. 这样即使频繁地操纵 DOM, 也不会对性能造成太大的影响.

和上面说到的一样, MutationObserver 通过微任务解决了实时性的问题.

## 以三道题收尾

下面的三道题来自 [@小美娜娜](https://juejin.im/user/5aa23691518825556d0db27e) 的文章 [Eventloop 不可怕, 可怕的是遇上 Promise](https://juejin.im/post/5c9a43175188252d876e5903). 抄一下不会打我吧, 嗯.

### 第一道题

```js
const p1 = new Promise((resolve, reject) => {
  console.log("promise1");
  resolve();
})
  .then(() => {
    console.log("then11");
    new Promise((resolve, reject) => {
      console.log("promise2");
      resolve();
    })
      .then(() => {
        console.log("then21");
      })
      .then(() => {
        console.log("then23");
      });
  })
  .then(() => {
    console.log("then12");
  });

const p2 = new Promise((resolve, reject) => {
  console.log("promise3");
  resolve();
}).then(() => {
  console.log("then31");
});
```

- 首先打印出 `promise1`

- 接着将 `then11`, `promise2` 添加到微任务队列, 此时微任务队列为 `['then11', 'promise2']`

- 打印出 `promise3`, 将 `then31` 添加到微任务队列, 此时微任务队列为 `['then11', 'promise2', 'then31']`

- 依次打印出 `then11`, `promise2`, `then31`, 此时微任务队列为空

- 将 `then21` 和 `then12` 添加到微任务队列, 此时微任务队列为 `['then21', 'then12']`

- 依次打印出 `then21`, `then12`, 此时微任务队列为空

- 将 `then23` 添加到微任务队列, 此时微任务队列为 `['then23']`

- 打印出 `then23`

### 第二道题

这道题实际在考察 Promise 的用法, 当在 then() 方法中返回一个 Promise, p1 的第二个完成处理函数就会挂在返回的这个 Promise 的 then() 方法下, 因此输出顺序如下.

```js
const p1 = new Promise((resolve, reject) => {
  console.log("promise1"); // 1
  resolve();
})
  .then(() => {
    console.log("then11"); // 2
    return new Promise((resolve, reject) => {
      console.log("promise2"); // 3
      resolve();
    })
      .then(() => {
        console.log("then21"); // 4
      })
      .then(() => {
        console.log("then23"); // 5
      });
  })
  .then(() => {
    console.log("then12"); //6
  });
```

### 第三道题

依次为 ['sync1', 'promise', 'sync2', 'pro_then', 'setTimeout1', 'setTimeoutPromise', 'last_setTimeout', 'pro_timeout'], 注意 last_setTimeout 和 pro_timeout 的位置.

```ts
console.log("sync1");

setTimeout(function () {
  console.log("setTimeout1");
}, 0);

var promise = new Promise(function (resolve, reject) {
  setTimeout(function () {
    console.log("setTimeoutPromise");
  }, 0);
  console.log("promise");
  resolve();
});

promise.then(() => {
  console.log("pro_then");
  setTimeout(() => {
    console.log("pro_timeout");
  }, 0);
});

setTimeout(function () {
  console.log("last_setTimeout");
}, 0);
console.log("sync2");
```

## 最后

欢迎关注我的微信公众号: 进击的前端

![进击的前端](https://edge.yancey.app/beg/16a3e8964d43486c.jpg)

## 参考

《你不知道的 JavaScript (中卷)》—— Kyle Simpson

[这一次, 彻底弄懂 JavaScript 执行机制](https://juejin.im/post/59e85eebf265da430d571f89)

[从一道题浅说 JavaScript 的事件循环](https://github.com/dwqs/blog/issues/61)

[微任务, 宏任务与 Event-Loop](https://juejin.im/post/5b73d7a6518825610072b42b)

[前端基础进阶: 详细图解 JavaScript 内存空间](https://juejin.im/entry/589c29a9b123db16a3c18adf)

[详解 JavaScript 中的 Event Loop(事件循环)机制](https://zhuanlan.zhihu.com/p/33058983)

[Eventloop 不可怕, 可怕的是遇上 Promise](https://juejin.im/post/5c9a43175188252d876e5903)

[图解搞懂 JavaScript 引擎 Event Loop](https://juejin.im/post/5a6309f76fb9a01cab2858b1)

[JavaScript 线程机制与事件机制](https://juejin.im/post/5bb05494e51d450e7428da59)
