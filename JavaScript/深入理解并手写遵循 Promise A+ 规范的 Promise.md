# 深入理解并手写遵循 Promise/A+ 规范的 Promise

> 相比于回调函数，Promise 解决了 “回调地狱” 和 “信任问题” 等痛点，并且大大提高了代码的可读性。在现代前端开发中，Promise 几乎成了处理异步的首选（虽然还有更方便的 async/await，逃）。这篇文章从 Promise 的思想和运行机制入手，深入理解每个 API，最后手写一个遵循 Promise/A+ 规范的 Promise 来。

## 异步方式

JavaScript 异步方式共有有下面六种。

- 事件监听

- 回调函数

- 发布/订阅

- Promise

- 生成器

- async/await

## 回调函数

面试中被问到 `回调函数` 有什么缺点，相信你一定不假思索地回答 `回调地狱`。的确如此，当我们需要发送多个异步请求，并且每个请求之间需要相互依赖时，就会产生回调地狱。

前段时间写了一个天气微信小程序 [Natsuha](https://github.com/YanceyOfficial/Natsuha-Weather)，它获取天气的逻辑大致如下（当然真实场景复杂的多）。

- 首先要获取用户的经纬度 (接口 A)

- 根据经纬度反查城市 (接口 B)

- 根据城市拿到相应的天气信息 (接口 C)

按照回调的方式去处理这个逻辑，大致会写成下面的样子：

```js
ajax(A, () => {
  // 获取经纬度
  ajax(B, () => {
    // 根据经纬度反查城市
    ajax(C, () => {
      // 根据城市获取天气信息
    });
  });
});
```

看起来很丑陋不是吗？相信大家对回调函数的缺点大致都了解，这里就不展开，只做个总结。

- 代码逻辑书写顺序与执行顺序不一致，不利于阅读与维护。

- 异步操作的顺序变更时，需要大规模的代码重构。

- 回调函数基本都是匿名函数，bug 追踪困难。

- 回调函数是被第三方库代码（如上例中的 ajax ）而非自己的业务代码所调用的，造成了控制反转(IoC)。

简单谈一谈 `控制反转`，《你不知道的 JavaScript (中卷)》把回调函数的最大缺点归结为 `信任问题`。例子中 ajax 是一个三方的函数（你完全可以把它想象成 jQuery 的 $.ajax()），我们把自己的业务逻辑，也就是将回调函数 `交给了` ajax 去处理。但 ajax 对我们来说仅仅是一个黑盒，如果 ajax 本身有缺陷的话，我们的回调函数就处于危险之中，这也就是所谓的“信任问题”。

不过 Promise 的出现解决了这些缺点，它能够把控制反转再反转回来。这样的话，我们可以不把自己程序的传给第三方，而是让第三方给我们提供了解其任务何时结束的能力，进而由我们自己的代码来决定下一步做什么。

## 何为 Promise

《你不知道的 JavaScript (中卷)》举了一个例子：

我在快餐店点了一个汉堡，并支付了 1.07 美金。这意味着我对某个值(汉堡)发出了请求。

接着收银员给我一张 `取餐单据`，它保证了我最终会得到汉堡，因此 `取餐单据` 就是一个 `承诺`。

在等待取餐的过程中，我可以做点其他的事情，比如刷刷推特，看看 [996.icu](https://github.com/996icu/996.ICU) 今天又涨了多少 star。之所以我可做点儿其他的事情，是因为 `取餐单据` 代表了我 `未来的` 汉堡。它在某种意义上已经成了汉堡的 `占位符`。从本质上来讲，这个 `占位符` 使得这个值不再依赖时间，这是一个 `未来值`。

终于，我听到服务员在喊 `250号前来取餐`，我就可以拿着 `取餐单据` 换我的汉堡了。

但是可能还有另一种结果，在我去取餐时，服务员充满抱歉的告诉我汉堡已经售罄了，除了愤怒，我们还可以看到 `未来值` 可能成功，也可能失败。

## Promise 基础知识

### Promise 的生命周期

每个 Promise 都会经历一个短暂的生命周期：先是处于 `进行中 (pending)`，此时操作尚未完成，因此它也是 `未处理 (unsettled)` 的；一旦异步操作执行结束，Promise 变成 `已处理 (settled)` 状态，此时它会进入到以下两个状态中的其中一个：

- Fulfilled：Promise 异步操作成功完成

- Rejected：由于程序错误或其他原因，异步操作未能成功完成

### Promise 构造函数

Promise 本身是一个构造函数，它接收一个叫做 `executor` 的函数，该函数会被传递两个名为 `resolve()` 和 `reject()` 的函数作为参数。`resolve()` 函数在执行器成功时被调用，而 `reject()` 在执行器操作失败后被调用。看下面这个例子。

```js
const fs = require("fs");

const promise = (path) =>
  // 执行器接收 resolve() 和 reject() 作为参数
  new Promise((resolve, reject) => {
    fs.readFile(__dirname + "/" + path, "utf-8", (err, data) => {
      if (err) {
        // 失败时调用 reject()
        reject(err);
        return;
      }
      // 成功时时调用 resolve()
      resolve(data);
    });
  });
```

### Promise 的 then 方法

then() 方法接收两个函数作为参数，第一个作为 `完成` 时的回调，第二个作为 `拒绝` 时的回调。两个参数均为可选，因此你可以只监听 `完成`，或者只监听 `拒绝`。其中当第一个参数为 `null`，第二个参数为回调函数时，它意味着监听 `拒绝`。在实际应用中，`完成` 和 `拒绝` 都应当被监听。

```js
const promise = new Promise((resolve, reject) => {
  resolve("success");
});

// 监听完成和拒绝
promise.then(
  (res) => {
    // 完成
    console.log(res);
  },
  (e) => {
    // 拒绝
    console.log(e);
  }
);

// 只监听完成
promise.then((res) => {
  console.log(res);
});

// 第一个参数为 null 时意味着拒绝
promise.then(null, (res) => {
  // 完成
  console.log(res);
});
```

Promise 还有两个方法分别是 `catch()` 和 `finally()`，前者用于监听 `拒绝`，后者无论成功失败都会被执行到。链式调用显然可读性更高，所以我们推荐下面这种写法。

```js
promise
  .then((res) => {
    console.log(res);
  })
  .catch((e) => {
    console.log(e);
  })
  .finally(() => {
    console.log("无论成功失败都会执行这句");
  });
```

## Promise 链式调用

每次调用 then() 或 catch() 方法时都会 `创建并返回一个新的 Promise`，只有当前一个 Promise 完成或被拒绝后，下一个才会被解决。

看下面这个例子，p.then() 完成后返回第二个 Promise，接着又调用了它的 then() 方法，也就是说只有当第一个 Promise 被解决之后才会调用第二个 then() 方法的 `then()` 。

```js
let p = new Promise((resolve, reject) => {
  resolve(42);
});

p.then((value) => {
  console.log(value); // 42
}).then(() => {
  console.log("可以执行到"); // '可以执行到'
});
```

将上述示例拆开，看起来是这样的。调用 p1.then() 的结果被存储到 p2 中，p2.then() 被调用来添加最终的 `then()` 。

```js
let p1 = new Promise((resolve, reject) => {
  resolve(42);
});

let p2 = p1.then((value) => {
  console.log(value);
});

p2.then(() => {
  console.log("可以执行到");
});
```

我们通过一个实例来看一下链式调用。下面是获取城市天气的场景：我们首先需要调用 `getCity` 接口来获取 `城市id`，接着调用 `getWeatherById/城市id` 来获取城市的天气信息。首先用 Promise 封装一个原生 Ajax。(敲黑板，面试可能要求手写)

```js
const getJSON = function (url) {
  const promise = new Promise(function (resolve, reject) {
    const handler = function () {
      if (this.readyState !== 4) {
        return;
      }
      if (this.status === 200) {
        resolve(this.response);
      } else {
        reject(new Error(this.statusText));
      }
    };
    const client = new XMLHttpRequest();
    client.open("GET", url);
    client.onreadystatechange = handler;
    client.responseType = "json";
    client.setRequestHeader("Accept", "application/json");
    client.send();
  });

  return promise;
};

const baseUrl = "https://5cb322936ce9ce00145bf070.mockapi.io/api/v1";
```

通过链式调用来请求数据，最后别忘了捕获错误。

```js
getJSON(`${baseUrl}/getCity`)
  .then((value) => getJSON(`${baseUrl}/getWeatherById/${value.cityId}`))
  .then((value) => console.log(value))
  .catch((e) => {
    console.log(e);
  });
```

### 捕获错误

当 then() 方法或者 catch() 方法抛出错误时，链式调用的下一个 Promise 中的 catch() 方法可以通过 `catch()` 接收这个错误。侧面来讲，异常不一定只发生在 Promise 中，还有可能发生在 `then()` 或者 `catch()` 中。

```js
let p1 = new Promise((resolve, reject) => {
  resolve(42);
});

p1.then((value) => {
  throw new Error(" `then()` 错误");
}).catch((e) => {
  console.log(e.message); // ' `then()` 错误'
});
```

不仅 `then()` 可以抛出异常，`catch()` 也可以抛出的异常，且可以被下一个 `catch()` 捕获。因此，无论如何都应该在 Promise 链的末尾留一个 `catch()` ，以保证能够正确处理所有可能发生的错误。看下面这个例子。

```js
let p1 = new Promise((resolve, reject) => {
  throw new Error("执行器错误");
});

p1.catch((e) => {
  console.log(e.message); // '执行器错误'
  throw new Error(" `catch()` 错误");
}).catch((e) => {
  console.log(e.message); // ' `catch()` 错误'
});
```

### Promise 链的返回值

Promise 链的一个重要特性是能从一个 Promise 传递数据给下一个 Promise，通过完成处理函数的返回值，来将数据沿着一个链传递下去。我们看下面这个例子。

```js
function task() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve("task");
    }, 1000);
  });
}

task()
  .then((res) => {
    console.log(res);
    return "taskB";
  })
  .then((res) => {
    console.log(res);
    return "taskC";
  })
  .then((res) => {
    console.log(res);
    throw new Error();
  })
  .catch((e) => {
    console.log(e);
    return "taskD";
  })
  .then((res) => {
    console.log(res);
  });
```

![Jietu20190415-172853.jpg](https://edge.yancey.app/beg/Jietu20190415-172853.jpg)

运行结果如上图所示。我们知道，每次调用 then() 或者 catch() 都会返回一个新的 Promise 实例，通过指定处理函数的返回值，可以沿着一个链继续传递数据。

因此第一个 then() 将 'taskB' 作为下一个 then() 的参数传递下去，同样第二个 then() 将 'taskC' 作为第三个 then() 的参数传递下去。

而第三个 then() 里面抛出一个异常，上面说到处理函数中的抛出异常一定会被后面的拒绝处理函数捕获，所以 catch() 里能够打印出上一个 then() 的错误。

别忘了 catch() 返回 'taskD' 也可以被最后一个 then() 捕获。

## 其他构造方法

### Promise.resolve() 和 Promise.reject()

Promise.resolve() 和 Promise.reject() 类似于快捷方式，用来创建一个 `已完成` 或 `已被拒绝` 的 promise。此外，Promise.resolve() 还能接受非 Promise 的 `thenable` 的作为参数，也就是所谓 `拥有 then 方法的对象`。

```js
// p1 和 p2 等价
const p1 = new Promise((resolve, reject) => {
  reject("Oops");
});

const p2 = Promise.reject("Oops");

// p3 和 p4 等价
const p3 = new Promise((resolve, reject) => {
  resolve("Oops");
});

const p4 = Promise.resolve("Oops");
```

而对于 Promise.resolve()，它还能接收一个非 Promise 的 `thenable` 作为参数。它可以创建一个已完成的 Promise，也可以创建一个以拒绝的 Promise。

```js
let thenable1 = {
  then(resolve, reject) {
    resolve(1);
  },
};

let p1 = Promise.resolve(thenable1);

p1.then((value) => console.log(value)); // 1

let thenable2 = {
  then(resolve, reject) {
    reject(1);
  },
};

let p2 = Promise.resolve(thenable2);

p2.catch((reason) => console.log(reason)); // 1
```

### Promise.all()

该方法接收单个迭代对象（最常见的就是数组）作为参数，并返回一个 Promise。这个可迭代对象的元素都是 Promise，只有在它们都完成后，所返回的 Promise 才会被完成。

- 当所有的 Promise 均为完成态，将会返回一个包含所有结果的数组。

- 只要有一个被拒绝，就不会返回数组，只会返回最先被拒绝的那个 Promise 的原因

```js
let p1 = new Promise((resolve, reject) => {
  resolve(42);
});
let p2 = new Promise((resolve, reject) => {
  reject(43);
});
let p3 = new Promise((resolve, reject) => {
  reject(44);
});

let p4 = new Promise((resolve, reject) => {
  resolve(45);
});

// 全部完成，返回数组
let p5 = Promise.all([p1, p4]);
p5.then((value) => console.log(value)); // [42, 45]

// 只要有一个出错，就不会返回数组，且只会返回最先被拒绝的那个 Promise 的原因
let p6 = Promise.all([p1, p2, p3, p4]);
p6.catch((value) => console.log(value)); // 43
```

### Promise.race()

该方法同样接收单个迭代对象（最常见的就是数组）作为参数，不同的是，该方法只要检测到任意一个被解决，该方法就会做出响应。因此一个有趣的例子是把 `请求接口` 和一个 `setTimeout` 进行竞逐，如果 `setTimeout` 先做出响应，就证明这个接口请求超时。

```js
const p = Promise.race([
  fetch("/some-api"),
  new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error("请求超时")), 3000);
  }),
]);

p.then((value) => {
  console.log(value);
}).catch((reason) => {
  console.log(reason);
});
```

## Promise 的局限性

看起来 Promise 很美好，解决了回调函数的种种问题，但它也有自己的局限性。

- 一旦创建一个 Promise 并为其注册完成/拒绝处理函数，Promise 将无法被取消。

- 当处于 pending 状态时，你无法得知当前进展到哪一块

- 因为 Promise 只能被决议一次（完成或拒绝），如果某些事件不断发生，stream 模式会更合适。

- 如果不设置回调函数，Promise 内部抛出的错误，不会反应到外部。

## 手撕代码

手撕代码的之前可以参照一下后面的 Promise A+ 规范翻译，最好还是自己去官网翻译一遍，这样写起来才会得心应手。下面的代码几乎每句都加了注释，并且链接到每一条规范。

```js
const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

class Promise {
  constructor(executor) {
    // state 的初始状态为等待态
    this.state = PENDING;

    // 成功的值 (1.3)
    this.value = undefined;

    // 失败的原因 (1.5)
    this.reason = undefined;

    // 因为 then 在相同的 promise 可以被调用多次，所以需要将所有的 onFulfilled 存到数组 (2.2.6)
    this.onResolvedCallbacks = [];

    // 因为 then 在相同的 promise 可以被调用多次，所以需要将所有的 onRejected 存到数组 (2.2.6)
    this.onRejectedCallbacks = [];

    const resolve = (value) => {
      // 只有当前是 pending，才可能转换为 fulfilled
      // 并且不能再转换成其他任何状态，且必须拥有一个不可变的值
      if (this.state === PENDING) {
        this.state = FULFILLED;
        this.value = value;
        // onFulfilled 回调按原始调用顺序依次执行 (2.2.6.1)
        this.onResolvedCallbacks.forEach((fn) => fn());
      }
    };

    const reject = (reason) => {
      // 只有当前是 pending，才可能转换为 rejected
      // 并且不能再转换成其他任何状态，且必须拥有一个不可变的原因
      if (this.state === PENDING) {
        this.state = REJECTED;
        this.reason = reason;
        // onRejectec 回调按原始调用顺序依次执行 (2.2.6.1)
        this.onRejectedCallbacks.forEach((fn) => fn()); // (2.2.6.2)
      }
    };

    // 若 executor 报错，直接执行 reject()
    try {
      executor(resolve, reject);
    } catch (err) {
      reject(err);
    }
  }

  then(onFulfilled, onRejected) {
    // onFulfilled 和 onRejected 都是可选参数 (2.2.1)

    // 如果 onFulfilled 不是函数，则必须将它忽略 (2.2.1.1)
    onFulfilled =
      typeof onFulfilled === "function" ? onFulfilled : (value) => value;

    // 如果 onRejected 不是函数，则必须将它忽略 (2.2.1.2)
    onRejected =
      typeof onRejected === "function"
        ? onRejected
        : (err) => {
            throw err;
          };

    // 为了做到链式调用，规定每个 then 方法必须返回一个 promise，称为 promise2
    const promise2 = new Promise((resolve, reject) => {
      // 在 promise 完成后方可调用 onFulfilled (2.2.2)
      if (this.state === FULFILLED) {
        // onFulfilled/onRejected 必须被异步调用，因此我们用延时函数模拟 (2.2.4)
        setTimeout(() => {
          try {
            // value 作为完成函数的第一个参数 (2.2.2.1)
            // onFulfilled 函数被记做 x (2.2.7.1)
            const x = onFulfilled(this.value);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            // 如果 onFulfilled/onRejected 抛出异常，则 promise2 必须拒绝执行，并返回拒因 e (2.2.7.2)
            reject(e);
          }
        }, 0);
      }

      // 在 promise 被拒绝后方可调用 onRejected (2.2.3)
      if (this.state === REJECTED) {
        // onFulfilled/onRejected 必须被异步调用，因此我们用延时函数模拟 (2.2.4)
        setTimeout(() => {
          try {
            // reason 作为拒绝函数的第一个参数 (2.2.3.1)
            // onRejected 函数被记做 x (2.2.7.1)
            const x = onRejected(this.reason);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            // 如果 onFulfilled/onRejected 抛出异常，则 promise2 必须拒绝执行，并返回拒因 e (2.2.7.2)
            reject(e);
          }
        }, 0);
      }

      if (this.state === PENDING) {
        this.onResolvedCallbacks.push(() => {
          // onFulfilled/onRejected 必须被异步调用，因此我们用延时函数模拟 (2.2.4)
          setTimeout(() => {
            try {
              const x = onFulfilled(this.value);
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              // 如果 onFulfilled/onRejected 抛出异常，则 promise2 必须拒绝执行，并返回拒因 e (2.2.7.2)
              reject(e);
            }
          }, 0);
        });
        this.onRejectedCallbacks.push(() => {
          // onFulfilled/onRejected 必须被异步调用，因此我们用延时函数模拟 (2.2.4)
          setTimeout(() => {
            try {
              const x = onRejected(this.reason);
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              // 如果 onFulfilled/onRejected 抛出异常，则 promise2 必须拒绝执行，并返回拒因 e (2.2.7.2)
              reject(e);
            }
          }, 0);
        });
      }
    });

    // 返回 promise2 (2.2.7)
    return promise2;
  }

  // catch 实际是 then 的语法糖
  catch(fn) {
    return this.then(null, fn);
  }

  finally(fn) {
    return this.then(
      (value) => Promise.resolve(fn()).then(() => value),
      (reason) =>
        Promise.resolve(fn()).then(() => {
          throw reason;
        })
    );
  }
}

const resolvePromise = (promise2, x, resolve, reject) => {
  // 如果 promise 和 x 指向同一个对象，将以 TypeError 作为拒因拒绝执行 promise (2.3.1)
  if (x === promise2) {
    return reject(new TypeError("Chaining cycle detected for promise"));
  }

  // onFulfilled 和 onRejected 只能被调用一次，因此这里加一个 flag 作为判断 (2.2.2.3 & 2.2.3.3)
  let isCalled = false;

  // 如果 x 是一个对象或者是一个函数 (2.3.3)
  if (x !== null && (typeof x === "object" || typeof x === "function")) {
    try {
      // (2.3.3.1)
      const then = x.then;

      // 如果 then 是函数，就以 x 作为 this 调用它 (2.3.3.2 & 2.3.3.3)
      if (typeof then === "function") {
        // 后面接收两个回调，第一个是成功的回调，第二个是失败的回调 (2.3.3.3)
        then.call(
          x,
          (y) => {
            if (isCalled) return;
            isCalled = true;
            // 如果 resolvePromise 以 y 为参数被调用，执行 [[Resolve]](promise, y) (2.3.3.3.1)
            resolvePromise(promise2, y, resolve, reject);
          },
          (r) => {
            if (isCalled) return;
            isCalled = true;
            // 如果 rejectPromise 以 r 为原因被调用，则以拒因 r 拒绝 promise (2.3.3.3.2)
            reject(r);
          }
        );
      } else {
        // 如果 then 不是个函数，则以 x 为参数执行 promise (2.3.3.4)
        resolve(x);
      }
    } catch (e) {
      if (isCalled) return;
      isCalled = true;
      // 如果取 x.then 报错，则以 e 为拒因拒绝 `promise` (2.3.3.2)
      reject(e);
    }
  }
  // 如果 then 不是个函数或者对象，则以 x 为参数执行 promise (2.3.4)
  else {
    resolve(x);
  }
};

// Promise.resolve
Promise.resolve = function (promises) {
  if (promises instanceof Promise) {
    return promises;
  }
  return new Promise((resolve, reject) => {
    if (promises && promises.then && typeof promises.then === "function") {
      setTimeout(() => {
        promises.then(resolve, reject);
      });
    } else {
      resolve(promises);
    }
  });
};

// Promise.reject
Promise.reject = (reason) => new Promise((resolve, reject) => reject(reason));

// Promise.all
Promise.all = (promises) => {
  return new Promise((resolve, reject) => {
    let resolvedCounter = 0;
    let promiseNum = promises.length;
    let resolvedValues = new Array(promiseNum);
    for (let i = 0; i < promiseNum; i += 1) {
      ((i) => {
        Promise.resolve(promises[i]).then(
          (value) => {
            resolvedCounter++;
            resolvedValues[i] = value;
            if (resolvedCounter === promiseNum) {
              return resolve(resolvedValues);
            }
          },
          (reason) => {
            return reject(reason);
          }
        );
      })(i);
    }
  });
};

//race方法
Promise.race = (promises) => {
  return new Promise((resolve, reject) => {
    if (promises.length === 0) {
      return;
    } else {
      for (let i = 0, l = promises.length; i < l; i += 1) {
        Promise.resolve(promises[i]).then(
          (data) => {
            resolve(data);
            return;
          },
          (err) => {
            reject(err);
            return;
          }
        );
      }
    }
  });
};
```

最后全局安装 `yarn global add promises-aplus-tests`，插入下面这段代码，然后使用 `promises-aplus-tests 该文件的文件名` 来验证你手写的 Promise 是否符合 Promises A+ 规范。

```js
Promise.defer = Promise.deferred = function () {
  let dfd = {};
  dfd.promise = new Promise((resolve, reject) => {
    dfd.resolve = resolve;
    dfd.reject = reject;
  });
  return dfd;
};
module.exports = Promise;
```

## 附录：[全文翻译] Promises/A+ 规范

**一个开放、可靠且通用的 JavaScript Promise 标准。由开发者制定，供开发者参考。**

_promise_ 代表着一个异步操作的最终结果，与之交互的主要方式是它的 `then` 方法，该方法注册了两个回调函数，用于接收 promise 最终的值或者失败的原因。

该规范详细描述了 `then` 方法的行为，所有遵循 Promises/A+ 规范实现的 promise 均可以本标准作为参照基础来实施。因此，这份规范是很稳定的。虽然 Promises/A+ 组织偶尔会修订这份规范，但大多是为了处理一些特殊的边界情况。这些改动都是微小且向下兼容的。如果我们要进行大规模不兼容的更新，我们一定会在事先进行谨慎地考虑、详尽的探讨和严格的测试。

最后，核心的 Promises/A+ 规范不会提供如何创建、解决和拒绝 promise，而是专注于提供一个通用的 `then` 方法。上述对于 promises 的操作方法将来在其他规范中可能会提及。

## 1\. 术语

1.1. 'promise' 是一个拥有 `then` 方法的对象或者函数，且其行为符合此规范。

1.2. 'thenable' 是一个用来定义 `then` 方法的对象或者函数。

1.3. 'value' 是任何一个合法的 JavaScript 值 (包括 `undefined`，thenable 或者 promise)

1.4. 'exception' 是一个使用 throw 语句抛出的值

1.5. 'reason' 表明了一个 promise 为什么会被拒绝

## 2\. 要求

### 2.1. Promise 状态

promise 必须是三个状态之一：等待态(Pending)、执行态(Fulfilled)和拒绝态(Rejected)。

- 2.1.1. 当前状态为 pending 时，一个 promise：

  - 2.1.1.1 可以转换成 fulfilled 或者 rejected 状态

- 2.1.2. 当前状态为 fulfilled 时，一个 promise：

  - 2.1.2.1 不能再转换成其他任何状态

  - 2.1.2.2 必须拥有一个不可变的值

- 2.1.3. 当前状态为 rejected 时，一个 promise：

  - 2.1.3.1 不能再转换成其他任何状态

  - 2.1.3.2 必须拥有一个不可变的原因

这里的不可变指的是恒等(即可用 === 判断相等)，而不是意味着更深层次的不可变。(即当 value 或者 reason 为引用类型时，只要求引用地址相等即可，但属性值可以被修改)

### 2.2. `then` 方法

promise 必须提供一个 `then` 方法以访问它当前或最终的值或被拒绝的原因。

一个 promise 的 `then` 方法接收两个参数：

```js
promise.then(onFulfilled, onRejected);
```

- 2.2.1 `onFulfilled` 和 `onRejected` 都是可选参数。

  - 2.2.1.1 如果 `onFulfilled` 不是个函数，它将被忽略

  - 2.2.1.2 如果 `onRejected` 不是个函数，它将被忽略

- 2.2.2 如果 `onFulfilled` 是一个函数：

  - 2.2.2.1 它必须在 `promise` 完成式后被调用，并且以 `promise` 的值作为它的第一个参数。

  - 2.2.2.2 在 `promise` 未完成前不可调用

  - 2.2.2.3 此函数仅可调用一次

- 2.2.3 如果 `onRejected` 是一个函数：

  - 2.2.3.1 它必须在 `promise` 被拒绝后被调用，并且以 `promise` 的原因作为它的第一个参数。

  - 2.2.3.2 在 `promise` 未被拒绝前不可调用

  - 2.2.3.3 此函数仅可调用一次

- 2.2.4 `onFulfilled` 和 `onRejected` 只有在 [执行上下文](https://es5.github.io/#x10.3) 堆栈仅包含平台代码时才可被调用。[^3.1]

- 2.2.5 `onFulfilled` 和 `onRejected` 必须被作为函数调用 (即没有 this 值)。[^3.2]

- 2.2.6 `then` 在相同的 promise 可以被调用多次

  - 2.2.6.1 当 `promise` 是完成态， 所有相应的 `onFulfilled` 回调必须按其原始调用的顺序执行。

  - 2.2.6.2 当 `promise` 是拒绝态，所有相应的 `onRejected` 回调必须按其原始调用的顺序执行。

- 2.2.7 每个 `then` 方法必须返回一个 promise [^3.3]。

```js
promise2 = promise1.then(onFulfilled, onRejected);
```

- 2.2.7.1 如果 `onFulfilled` 或者 `onRejected` 返回一个值 `x` ，则运行下面的 Promise 解决过程：`[[Resolve]](promise2, x)`

  - 2.2.7.2 如果 `onFulfilled` 或者 `onRejected` 抛出一个异常 `e` ，则 `promise2` 必须拒绝执行，并返回拒因 `e`

  - 2.2.7.3 如果 `onFulfilled` 不是函数且 `promise1` 成功执行， `promise2` 必须成功执行并返回相同的值

  - 2.2.7.4 如果 `onRejected` 不是函数且 `promise1` 拒绝执行， `promise2` 必须拒绝执行并返回相同的拒因

### 2.3. Promise 解决过程

**Promise 解决过程**是一个抽象的操作，它接收一个 promise 和一个值，我们可以表示为 `[[Resolve]](promise, x)`，如果 `x` 是一个 thenable 的对象，解决程序将试图接受 `x` 的状态，否则用 `x` 的值来执行 `promise`。

这种对 thenales 的处理使得 promise 的实现更加有普适性，只要它暴露出一个兼容 Promises/A+ 规范的 `then` 方法。它还允许让遵循 Promise/A+ 规范的实现和不太规范但可用的实现良好共存。

为了运行 `[[Resolve]](promise, x)`，要执行下面的步骤：

- 2.3.1 如果 `promise` 和 `x` 指向同一个对象，将以 `TypeError` 作为拒因拒绝执行 `promise`。

- 2.3.2 如果 `x` 是一个 promise，那么将 promise 将接受它的状态 [^3.4]：

  - 2.3.2.1 如果 `x` 是等待态，`promise` 必须保留等待状态直到 `x` 被完成或者被拒绝。

  - 2.3.2.2 如果 `x` 是完成态，用相同的值执行 `promise`

  - 2.3.2.3 如果 `x` 是拒态，用相同的原因拒绝 `promise`

- 2.3.3 如果 `x` 是一个对象或者是一个函数，

  - 2.3.3.1 把 `x.then` 赋值给 `then`。[^3.5]

  - 2.3.3.2 如果取 `x.then` 的值时抛出错误 `e`，则以 `e` 为拒因拒绝 `promise`

  - 2.3.3.3 如果 `then` 是函数，将 `x` 作为函数的作用域 `this` 来调用它。传递两个回调函数作为参数，第一个参数叫做 `resolvePromise`，第二个参数叫做 `rejectPromise`:

    - 2.3.3.3.1 如果 `resolvePromise` 以 `y` 为参数被调用，执行 `[[Resolve]](promise, y)`

    - 2.3.3.3.2 如果 `rejectPromise` 以 `r` 为原因被调用，则以拒因 `r` 拒绝 promise

    - 2.3.3.3.3 如果 `resolvePromise` 和 `rejectPromise` 都被调用，或者被同一参数调用了多次，则优先采用首次调用并忽略剩下的调用。

    - 2.3.3.3.4 如果调用 `then` 抛出一个异常 `e`

      - 2.3.3.3.4.1 如果 `resolvePromise` 和 `rejectPromise` 都被调用，则忽略掉它

      - 2.3.3.3.4.2 否则，以 `e` 为拒因拒绝这个 `promise`

  - 2.3.3.4 如果 `then` 不是个函数，则以 `x` 为参数执行 `promise`

- 2.3.4 如果 `then` 不是个函数或者对象，则以 `x` 为参数执行 `promise`

如果一个 promise 被一个循环的 thenable 链中的对象解决，而 `[[Resolve]](promise, thenable)` 的递归性质又使得其被再次调用，根据上述的算法将会陷入无限递归之中。算法虽不强制要求，但也鼓励施者检测这样的递归是否存在，若检测到存在则以一个可识别的 TypeError 为拒因来拒绝 promise [^3.6]。

## 3\. 注释

\[^3\.1\]: 这里的“平台代码”意味着引擎，环境和 promise 实施代码，在实践中要确保 `onFulfilled` 和 `onRejected` 异步执行，且应该在 `then` 方法被调用的那一轮事件循环之后的新执行栈中执行。这个事件队列可以采用“宏任务（macro-task）”机制，类似于 `setTimeOut` 或者 `setImmediate`，也可以使用“微任务（micro-task）”机制来实现，类似于 `MutationObserver` 或 `process.nextTick`。因为 promise 实现被认为是平台代码，所以它本身可能包含一个任务调度队列或跳板，在其中调用处理程序。

\[^3\.2\]: 在严格模式下 `this` 为 `undefined`，而在非严格模式中，`this` 为全局对象。

\[^3\.3\]: 代码实现在满足所有要求的情况下可以允许 `promise2 === promise1` 。每个实现都要文档说明其是否允许以及在何种条件下允许 `promise2 === promise1` 。

\[^3\.4\]: 总体来说，如果 `x` 符合当前实现，我们才认为它是真正的 promise 。这一规则允许那些特例实现接受符合已知要求的 Promises 状态。

\[^3\.5\]: 这步我们先是存储了一个指向 `x.then` 的引用，然后测试并调用该引用，以避免多次访问 `x.then` 属性。这种预防措施确保了该属性的一致性，因为其值可能在检索调用时被改变。

\[^3\.6\]: 实现不应该对 thenable 链的深度设限，并假定超出本限制的递归就是无限循环。只有真正的循环递归才应能导致 `TypeError` 异常；如果一条无限长的链上 thenable 均不相同，那么递归下去永远是正确的行为。
