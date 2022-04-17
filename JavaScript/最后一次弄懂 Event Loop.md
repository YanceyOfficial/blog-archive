# 最后一次弄懂 Event Loop

> Event Loop 是 JavaScript 异步编程的核心思想，也是前端进阶必须跨越的一关。同时，它又是面试的必考点，特别是在 Promise 出现之后，各种各样的面试题层出不穷，花样百出。这篇文章从现实生活中的例子入手，让你彻底理解 Event Loop 的原理和机制，并能游刃有余的解决此类面试题。

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

## 为什么 JavaScript 是单线程的？

我们都知道 JavaScript 是一门 `单线程` 语言，也就是说同一时间只能做一件事。这是因为 JavaScript 生来作为浏览器脚本语言，主要用来处理与用户的交互、网络以及操作 DOM。这就决定了它只能是单线程的，否则会带来很复杂的同步问题。

假设 JavaScript 有两个线程，一个线程在某个 DOM 节点上添加内容，另一个线程删除了这个节点，这时浏览器应该以哪个线程为准？

既然 Javascript 是单线程的，它就像是只有一个窗口的银行，客户不得不排队一个一个的等待办理。同理 JavaScript 的任务也要一个接一个的执行，如果某个任务（比如加载高清图片）是个耗时任务，那浏览器岂不得一直卡着？为了防止主线程的阻塞，JavaScript 有了 `同步` 和 `异步` 的概念。

## 同步和异步

### 同步

如果在一个函数返回的时候，调用者就能够得到预期结果，那么这个函数就是同步的。也就是说同步方法调用一旦开始，调用者必须等到该函数调用返回后，才能继续后续的行为。下面这段段代码首先会弹出 alert 框，如果你不点击 `确定` 按钮，所有的页面交互都被锁死，并且后续的 `console` 语句不会被打印出来。

```js
alert("Yancey");
console.log("is");
console.log("the");
console.log("best");
```

### 异步

如果在函数返回的时候，调用者还不能够得到预期结果，而是需要在将来通过一定的手段得到，那么这个函数就是异步的。比如说发一个网络请求，我们告诉主程序等到接收到数据后再通知我，然后我们就可以去做其他的事情了。当异步完成后，会通知到我们，但是此时可能程序正在做其他的事情，所以即使异步完成了也需要在一旁等待，等到程序空闲下来才有时间去看哪些异步已经完成了，再去执行。

这也就是定时器并不能精确在指定时间后输出回调函数结果的原因。

```js
setTimeout(() => {
  console.log("yancey");
}, 1000);

for (let i = 0; i < 100000000; i += 1) {
  // todo
}
```

## 执行栈和任务队列

### 复习下数据结构吧

- 栈 (stack): 栈是遵循后进先出 (LIFO) 原则的有序集合，新添加或待删除的元素都保存在同一端，称为栈顶，另一端叫做栈底。在栈里，新元素都靠近栈顶，旧元素都接近栈底。栈在编程语言的编译器和内存中存储基本数据类型和对象的指针、方法调用等.

- 队列 (queue): 队列是遵循先进先出 (FIFO) 原则的有序集合，队列在尾部添加新元素，并在顶部移除元素，最新添加的元素必须排在队列的末尾。在计算机科学中，最常见的例子就是打印队列。

- 堆 (heap): 堆是基于树抽象数据类型的一种特殊的数据结构。

![栈/队列](https://user-gold-cdn.xitu.io/2019/4/21/16a3e8964d42e54e?w=601&h=527&f=webp&s=18862)

如上图所示，JavaScript 中的内存分为 `堆内存` 和 `栈内存`,

JavaScript 中引用类型值的大小是不固定的，因此它们会被存储到 `堆内存` 中，由系统自动分配存储空间。JavaScript 不允许直接访问堆内存中的位置，因此我们不能直接操作对象的堆内存空间，而是操作 `对象的引用`。

而 JavaScript 中的基础数据类型都有固定的大小，因此它们被存储到 `栈内存` 中。我们可以直接操作保存在栈内存空间的值，因此基础数据类型都是 `按值访问`。此外，栈内存还会存储 `对象的引用 (指针)` 以及 `函数执行时的运行空间`。

下面比较一下两种存储方式的不同。

| 栈内存                 | 堆内存                       |
| ---------------------- | ---------------------------- |
| 存储基础数据类型       | 存储引用数据类型             |
| 按值访问               | 按引用访问                   |
| 存储的值大小固定       | 存储的值大小不定，可动态调整 |
| 由系统自动分配内存空间 | 由程序员通过代码进行分配     |
| 主要用来执行程序       | 主要用来存放对象             |
| 空间小，运行效率高     | 空间大，但是运行效率相对较低 |
| 先进后出，后进先出     | 无序存储，可根据引用直接获取 |

### 执行栈

当我们调用一个方法的时候，JavaScript 会生成一个与这个方法对应的执行环境，又叫执行上下文(context)。这个执行环境中保存着该方法的私有作用域、上层作用域(作用域链)、方法的参数，以及这个作用域中定义的变量和 this 的指向，而当一系列方法被依次调用的时候。由于 JavaScript 是单线程的，这些方法就会按顺序被排列在一个单独的地方，这个地方就是所谓执行栈。

### 任务队列

事件队列是一个存储着 `异步任务` 的队列，其中的任务严格按照时间先后顺序执行，排在队头的任务将会率先执行，而排在队尾的任务会最后执行。事件队列每次仅执行一个任务，在该任务执行完毕之后，再执行下一个任务。执行栈则是一个类似于函数调用栈的运行容器，当执行栈为空时，JS 引擎便检查事件队列，如果事件队列不为空的话，事件队列便将第一个任务压入执行栈中运行。

## 事件循环

我们注意到，在异步代码完成后仍有可能要在一旁等待，因为此时程序可能在做其他的事情，等到程序空闲下来才有时间去看哪些异步已经完成了。所以 JavaScript 有一套机制去处理同步和异步操作，那就是事件循环 (Event Loop)。

下面就是事件循环的示意图。

![事件循环示意图](https://user-gold-cdn.xitu.io/2019/4/21/16a3e8964d1e54ce?w=394&h=449&f=webp&s=8670)

用文字描述的话，大致是这样的:

- 所有同步任务都在主线程上执行，形成一个执行栈 (Execution Context Stack)。

- 而异步任务会被放置到 Task Table，也就是上图中的异步处理模块，当异步任务有了运行结果，就将该函数移入任务队列。

- 一旦执行栈中的所有同步任务执行完毕，引擎就会读取任务队列，然后将任务队列中的第一个任务压入执行栈中运行。

主线程不断重复第三步，也就是 `只要主线程空了，就会去读取任务队列`，该过程不断重复，这就是所谓的 `事件循环`。

## 宏任务和微任务

[微任务、宏任务与 Event-Loop](https://juejin.im/post/5b73d7a6518825610072b42b#heading-5) 这篇文章用了很有趣的例子来解释宏任务和微任务，下面 copy 一下。

还是以去银行办业务为例，当 5 号窗口柜员处理完当前客户后，开始叫号来接待下一位客户，我们将每个客户比作 `宏任务`，`接待下一位客户` 的过程也就是让下一个 `宏任务` 进入到执行栈。

所以该窗口所有的客户都被放入了一个 `任务队列` 中。任务队列中的都是 `已经完成的异步操作的`，而不是注册一个异步任务就会被放在这个任务队列中（它会被放到 Task Table 中）。就像在银行中排号，如果叫到你的时候你不在，那么你当前的号牌就作废了，柜员会选择直接跳过进行下一个客户的业务处理，等你回来以后还需要重新取号。

在执行宏任务时，是可以穿插一些微任务进去。比如你大爷在办完业务之后，顺便问了下柜员：“最近 P2P 暴雷很严重啊，有没有其他稳妥的投资方式”。柜员暗爽：“又有傻子上钩了”，然后叽里咕噜说了一堆。

我们分析一下这个过程，虽然大爷已经办完正常的业务，但又咨询了一下理财信息，这时候柜员肯定不能说：“您再上后边取个号去，重新排队”。所以只要是柜员能够处理的，都会在响应下一个宏任务之前来做，我们可以把这些任务理解成是 `微任务`。

大爷听罢，扬起 45 度微笑，说：“我就问问。”

柜员 OS：“艹...”

这个例子就说明了：~~你大爷永远是你大爷~~ `在当前微任务没有执行完成时，是不会执行下一个宏任务的！`

总结一下，异步任务分为 `宏任务(macrotask)` 与 `微任务 (microtask)`。宏任务会进入一个队列，而微任务会进入到另一个不同的队列，且微任务要优于宏任务执行。

### 常见的宏任务和微任务

宏任务：script(整体代码)、setTimeout、setInterval、I/O、事件、postMessage、 MessageChannel、setImmediate (Node.js)

微任务：Promise.then、 MutaionObserver、process.nextTick (Node.js)

### 来做几道题

看看下面这道题你能不能做出来。

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

- 第一个 `setTimeout` 放到宏任务队列，此时宏任务队列为 ['A']

- 接着执行 obj 的 func 方法，将 `setTimeout` 放到宏任务队列，此时宏任务队列为 ['A', 'B']

- 函数返回一个 Promise，因为这是一个同步操作，所以先打印出 `'C'`

- 接着将 `then` 放到微任务队列，此时微任务队列为 ['D']

- 接着执行同步任务 `console.log('E');`，打印出 `'E'`

- 因为微任务优先执行，所以先输出 `'D'`

- 最后依次输出 `'A'` 和 `'B'`

再来看一道阮一峰老师出的题目，其实也不难。

```js
let p = new Promise((resolve) => {
  resolve(1);
  Promise.resolve().then(() => console.log(2));
  console.log(4);
}).then((t) => console.log(t));
console.log(3);
```

- 首先将 `Promise.resolve()` 的 then() 方法放到微任务队列，此时微任务队列为 ['2']

- 然后打印出同步任务 `4`

- 接着将 `p` 的 then() 方法放到微任务队列，此时微任务队列为 ['2', '1']

- 打印出同步任务 `3`

- 最后依次打印微任务 `2` 和 `1`

## 当 Event Loop 遇到 async/await

我们知道，async/await 仅仅是生成器的语法糖，所以不要怕，只要把它转换成 Promise 的形式即可。下面这段代码是 async/await 函数的经典形式。

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

其中 `await 前面的代码` 是同步的，调用此函数时会直接执行；而 `await bar();` 这句可以被转换成 `Promise.resolve(bar())`；`await 后面的代码` 则会被放到 Promise 的 then() 方法里。因此上面的代码可以被转换成如下形式，这样是不是就很清晰了？

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

回到开篇宇宙条那道烂大街的题目，我们"重构"一下代码，再做解析，是不是很轻松了？

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

- 接着将 `settimeout` 添加到宏任务队列，此时宏任务队列为 `['settimeout']`

- 然后执行函数 `async1`，先打印出 `async1 start`，又因为 `Promise.resolve(async2())` 是同步任务，所以打印出 `async2`，接着将 `async1 end` 添加到微任务队列，，此时微任务队列为 ['async1 end']

- 接着打印出 `promise1`，将 `promise2` 添加到微任务队列，，此时微任务队列为 `['async1 end', promise2]`

- 打印出 `script end`

- 因为微任务优先级高于宏任务，所以先依次打印出 `async1 end` 和 `promise2`

- 最后打印出宏任务 `settimeout`

> 关于这道题的争议：文章发表了大概有两天的时间，陆陆续续收到了小伙伴的评论。大多都是 `async1 end` 和 `promise2` 的顺序问题。我在 `Chrome 73.0.3683.103 for MAC` 和 `Node.js v8.15.1` 测试是 `async1 end` 先于 `promise2`，在 `FireFox 66.0.3 for MAC` 测试是 `async1 end` 后于 `promise2`。

## Node.js 与 浏览器环境下事件循环的区别

Node.js 在升级到 11.x 后，Event Loop 运行原理发生了变化，一旦执行一个阶段里的一个宏任务(setTimeout,setInterval 和 setImmediate) 就立刻执行微任务队列，这点就跟浏览器端一致。

关于 11.x 版本之前 Node.js 与 浏览器环境下事件循环的区别，可以参考 [@浪里行舟](https://juejin.im/user/5a9a9cdcf265da238b7d771c) 大佬的 [《浏览器与 Node 的事件循环(Event Loop)有何区别?》](https://juejin.im/post/5c337ae06fb9a049bc4cd218)，这里就不多废话了。

## 浅谈 Web Workers

需要强调的是，Worker 是浏览器 (即宿主环境) 的功能，实际上和 JavaScript 语言本身几乎没有什么关系。也就是说，JavaScript 当前并没有任何支持多线程执行的功能。

所以，JavaScript 是一门单线程的语言！JavaScript 是一门单线程的语言！JavaScript 是一门单线程的语言！

浏览器可以提供多个 `JavaScript 引擎实例`，各自运行在自己的线程上，这样你可以在每个线程上运行不同的程序。程序中每一个这样的的独立的多线程部分被称为一个 Worker。这种类型的并行化被称为 `任务并行`，因为其重点在于把程序划分为多个块来并发运行。下面是 Worker 的运作流图。

![Web Worker 机制](https://user-gold-cdn.xitu.io/2019/4/21/16a3e8964d3a7ae8?w=893&h=383&f=webp&s=21496)

### Web Worker 实例

下面用一个阶乘的例子浅谈 Worker 的用法。

![计算阶乘的实例](https://user-gold-cdn.xitu.io/2019/4/21/16a3e8964d2d4242?w=744&h=290&f=jpeg&s=24802)

首先新建一个 `index.html` ，直接上代码：

```html
<body>
  <fieldset>
    <legend>计算阶乘</legend>
    <input id="input" type="number" placeholder="请输入一个正整数" />
    <button id="btn">计算</button>
    <p>计算结果：<span id="result"></span></p>
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

在同目录下新建一个 `work.js`，内容如下：

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

## 以两道题收尾

下面的两道题来自 [@小美娜娜](https://juejin.im/user/5aa23691518825556d0db27e) 的文章 [Eventloop 不可怕，可怕的是遇上 Promise](https://juejin.im/post/5c9a43175188252d876e5903)。抄一下不会打我吧，嗯。

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

- 接着将 `then11`，`promise2` 添加到微任务队列，此时微任务队列为 `['then11', 'promise2']`

- 打印出 `promise3`，将 `then31` 添加到微任务队列，此时微任务队列为 `['then11', 'promise2', 'then31']`

- 依次打印出 `then11`，`promise2`，`then31`，此时微任务队列为空

- 将 `then21` 和 `then12` 添加到微任务队列，此时微任务队列为 `['then21', 'then12']`

- 依次打印出 `then21`，`then12`，此时微任务队列为空

- 将 `then23` 添加到微任务队列，此时微任务队列为 `['then23']`

- 打印出 `then23`

### 第二道题

这道题实际在考察 Promise 的用法，当在 then() 方法中返回一个 Promise，p1 的第二个完成处理函数就会挂在返回的这个 Promise 的 then() 方法下，因此输出顺序如下。

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

## 最后

欢迎关注我的微信公众号：进击的前端

![进击的前端](https://user-gold-cdn.xitu.io/2019/4/21/16a3e8964d43486c?w=344&h=344&f=jpeg&s=8175)

## 参考

《你不知道的 JavaScript (中卷)》—— Kyle Simpson

[这一次，彻底弄懂 JavaScript 执行机制](https://juejin.im/post/59e85eebf265da430d571f89)

[从一道题浅说 JavaScript 的事件循环](https://github.com/dwqs/blog/issues/61)

[微任务、宏任务与 Event-Loop](https://juejin.im/post/5b73d7a6518825610072b42b)

[前端基础进阶：详细图解 JavaScript 内存空间](https://juejin.im/entry/589c29a9b123db16a3c18adf)

[详解 JavaScript 中的 Event Loop（事件循环）机制](https://zhuanlan.zhihu.com/p/33058983)

[Eventloop 不可怕，可怕的是遇上 Promise](https://juejin.im/post/5c9a43175188252d876e5903)

[图解搞懂 JavaScript 引擎 Event Loop](https://juejin.im/post/5a6309f76fb9a01cab2858b1)

[JavaScript 线程机制与事件机制](https://juejin.im/post/5bb05494e51d450e7428da59)
