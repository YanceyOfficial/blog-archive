# 详解 React Scheduler 的调度原理

> summarysummarysummarysummarysummarysummary

## 什么是 Scheduler

[Scheduler](https://github.com/facebook/react/tree/master/packages/scheduler) 是内置于 React 项目下的一个包, 你只需要将任务以及任务的优先级交给它, 它就可以帮你进行任务的协调调度. 目前 Scheduler 只被用于 React, 但团队的愿景是希望它能够更通用化.

## Scheduler 用来做什么

对于多个任务, Scheduler 根据优先级来安排执行顺序; 而对于单个任务, 需要被"有节制"的执行. 什么是"有节制"呢? 我们知道 JavaScript 是单线程的, 如果一个同步任务占用时间很长, 就会导致掉帧和卡顿. 因此需要把一个耗时的任务及时中断掉, 去执行更重要的任务(比如用户交互), 后续再接着执行该耗时任务, 如此往复. Scheduler 就是用这样的模式, 将任务细粒度切分, 来避免一直占用有限的资源执行耗时较长的任务, 实现更快的响应.

## 原理综述

为了实现**多个任务的管理** 和 **单个任务的控制**, Scheduler 引入了两个概念: **任务优先级**, **时间片**. 任务优先级让任务按照自身的紧急程度排序, 这样可以让优先级最高的任务最先被执行到. 时间片规定的是单个任务在这一帧内最大的执行时间(`yieldInterval = 5ms`), 任务一旦执行时间超过时间片, 则会被打断, 转而去执行更高优的任务, 这样可以保证页面不会因为任务执行时间过长而产生掉帧或者影响用户交互.

### 多个任务的管理

在 Scheduler 中, 任务被分成了两种: **未过期的任务**和**已过期的任务**, 分别存在 `timerQueue` 和 `taskQueue` 两个队列中.

#### 如何区分两种任务

通过任务的**开始时间(startTime)** 和 **当前时间(currentTime)** 比较:

- 当 `startTime > currentTime`, 说明未过期, 存到 `timerQueue`
- 当 `startTime <= currentTime`, 说明已过期, 存到 `taskQueue`

#### 入队的任务如何排序

即便是区分了 `timerQueue` 和 `taskQueue`, 但每个队列中的任务也是有不同优先级的, 因此在入队时需要根据**紧急程度**将紧急的任务排在前面. 老版本的 React Scheduler 使用循环链表来串联, 代码比较难懂, 这里不展开.

目前源码中使用[**小顶堆**](https://algorithm.yanceyleo.com/data-structure/tree/binary-heap)这个数据结构实现, 堆是[优先队列](https://algorithm.yanceyleo.com/data-structure/queue/priority-queue)的底层实现, 它在插入或者删除元素的时候, 通过"上浮"和"下沉"操作来使元素自动排序(优先队列经常用来解决算法中的 [topK](https://algorithm.yanceyleo.com/leetcode/lcof/40-get-least-numbers) 问题). 回到源码, 这意味着 `timerQueue` 和 `taskQueue` 里的元素是从小到大排序的.

![优先队列](https://static.yancey.app/cer2n7v558-1622000665011)

- timerQueue 中, 依据任务的开始时间(startTime)排序, 开始时间越早, 说明会越早开始, 开始时间小的排在前面. 任务进来的时候, 开始时间默认是当前时间, 如果进入调度的时候传了延迟时间, 开始时间则是当前时间与延迟时间的和.
- taskQueue 中, 依据任务的过期时间(expirationTime)排序, 过期时间越早, 说明越紧急, 过期时间小的排在前面. 过期时间根据任务优先级计算得出, 优先级越高, 过期时间越早.

#### 任务的执行

- 对于 `taskQueue`, 因为里面的任务已经过期了, 需要在 workLoop 中循环执行完这些任务
- 对于 `timerQueue`, 它里面的任务都不会立即执行, 但在 workLoop 方法中会通过 `advanceTimers` 方法来检测第一个任务是否过期, 如果过期了, 就放到 `taskQueue` 中.

相较于单个任务的执行(马上会说到), 任务队列的管理属于宏观层面的范畴. 从 react-reconciler 计算的 Lane, 会被转化成 Scheduler 可识别的**任务优先级**, 然后通过它去管理任务队列中的任务顺序. 总之来讲, **就是越紧急的任务, 它就需要被优先处理**.

### 单个任务的中断及恢复

其实将任务挂起与恢复并不是一个新潮的概念, 它有一个名词叫做[**协程**](https://en.wikipedia.org/wiki/Coroutine), ES6 之后的生成器, 就可以用 yield 关键字来.

## requestIdelCallback

## requestAnimationFrame

## MessageChannel

## 扩展: 协程

---

## 源码解析

以上就是 Scheduler 的核心原理, 不过真正想要搞懂, 还是得深入源码才行. 读完下面的内容, 还可以参考 GitHub 上更详细的[源码解读](https://github.com/learn-frame/react/blob/feature/learn-react/packages/scheduler/src/forks/SchedulerDOM.js), 想必会有更整体的认识.

### React 和 Scheduler 优先级的转换

我们知道 React 的优先级采用的是 Lane 模型, 而 Scheduler 是一个独立的包, 有自己的一套优先级机制, 因此需要做一个转换. 这里摘录 `react-reconciler/src/ReactFiberWorkLoop.old(new).js` 中的一部分.

```ts
let newCallbackNode;
// 同步
if (newCallbackPriority === SyncLane) {
  // 执行 scheduleSyncCallback 方法
  // 只不过要区分下 legacy 模式还是 concurrent 模式
  // scheduleSyncCallback 自己有个 syncQueue, 用来承载同步任务
  // 并交由 flushSyncCallbacks 处理这些同步任务后, 再交由下面 scheduleCallback
  // 以最高优先级让 Scheduler 调度
  if (root.tag === LegacyRoot) {
    scheduleLegacySyncCallback(performSyncWorkOnRoot.bind(null, root));
  } else {
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
  }

  // 这里我们只谈 scheduleCallback, 即以最高优先级
  // ImmediateSchedulerPriority 来执行同步任务
  if (supportsMicrotasks) {
    scheduleMicrotask(flushSyncCallbacks);
  } else {
    scheduleCallback(ImmediateSchedulerPriority, flushSyncCallbacks);
  }
  newCallbackNode = null;
} else {
  // 异步
  let schedulerPriorityLevel;
  // 需要将 lane 转换为 Scheduler 可识别的优先级
  switch (lanesToEventPriority(nextLanes)) {
    case DiscreteEventPriority:
      schedulerPriorityLevel = ImmediateSchedulerPriority;
      break;
    case ContinuousEventPriority:
      schedulerPriorityLevel = UserBlockingSchedulerPriority;
      break;
    case DefaultEventPriority:
      schedulerPriorityLevel = NormalSchedulerPriority;
      break;
    case IdleEventPriority:
      schedulerPriorityLevel = IdleSchedulerPriority;
      break;
    default:
      schedulerPriorityLevel = NormalSchedulerPriority;
      break;
  }
  // 通过 scheduleCallback 将任务及其优先级传入到 Scheduler 中
  newCallbackNode = scheduleCallback(
    schedulerPriorityLevel,
    performConcurrentWorkOnRoot.bind(null, root)
  );
}
```

### Scheduler 中的优先级

Scheduler 自身维护 6 种优先级, 不过翻了一遍源码 `NoPriority` 没被用过. 它们是计算 expirationTime 的重要依据, 而我们知道 expirationTime 事关 taskQueue 的排序. 该文件位于 `scheduler/src/SchedulerPriorities.js`.

```ts
export const NoPriority = 0; // 没有任何优先级
export const ImmediatePriority = 1; // 立即执行的优先级, 级别最高
export const UserBlockingPriority = 2; // 用户阻塞级别的优先级, 比如用户输入, 拖拽这些
export const NormalPriority = 3; // 正常的优先级
export const LowPriority = 4; // 低优先级
export const IdlePriority = 5; // 最低阶的优先级, 可以被闲置的那种
```

### scheduleCallback

通过上面的介绍, 我们知道 Scheduler 的主入口是 `scheduleCallback`, 它**负责生成调度任务, 根据任务是否过期将任务放入 timerQueue 或 taskQueue, 然后触发调度行为, 让任务进入调度.** 注意: `enableProfiling` 用来做一些审计和 debugger, 本文不去涉及.

1. 首先计算 `startTime`, 它被用作 `timerQueue` 排序的依据, `getCurrentTime()` 用来获取当前时间, 下面会讲到.
2. 接着计算 `expirationTime`, 它被用作 `taskQueue` 排序的依据, 过期时间通过传入的优先级确定.
3. `newTask` 是 Scheduler 中任务单元的数据结构, 注释写的很清楚, 其中 `sortIndex` 是优先队列(小顶堆)中排序的依据.
4. 根据上面三步的铺垫, 这一步就是根据 `startTime` 和 `currentTime` 的关系将任务放到 timerQueue 或 taskQueue 之中, 然后触发调度行为.

```ts
function unstable_scheduleCallback(priorityLevel, callback, options) {
  /*
   * (1
   */
  var currentTime = getCurrentTime();

  // timerQueue 根据 startTime 排序
  // 任务进来的时候, 开始时间默认是当前时间, 如果进入调度的时候传了延迟时间
  // 开始时间则是当前时间与延迟时间的和
  var startTime;
  if (typeof options === "object" && options !== null) {
    var delay = options.delay;
    if (typeof delay === "number" && delay > 0) {
      startTime = currentTime + delay;
    } else {
      startTime = currentTime;
    }
  } else {
    startTime = currentTime;
  }

  /*
   * (2
   */
  // taskQueue 根据 expirationTime 排序
  var timeout;
  switch (priorityLevel) {
    case ImmediatePriority:
      timeout = IMMEDIATE_PRIORITY_TIMEOUT; // -1
      break;
    case UserBlockingPriority:
      timeout = USER_BLOCKING_PRIORITY_TIMEOUT; // 250
      break;
    case IdlePriority:
      timeout = IDLE_PRIORITY_TIMEOUT; // 1073741823 (2^30 - 1)
      break;
    case LowPriority:
      timeout = LOW_PRIORITY_TIMEOUT; // 10000
      break;
    case NormalPriority:
    default:
      timeout = NORMAL_PRIORITY_TIMEOUT; // 5000
      break;
  }

  // 计算任务的过期时间, 任务开始时间 + timeout
  // 若是立即执行的优先级(IMMEDIATE_PRIORITY_TIMEOUT(-1))
  // 它的过期时间是 startTime - 1, 意味着立刻就过期
  var expirationTime = startTime + timeout;

  /*
   * (3
   */
  // 创建调度任务
  var newTask = {
    id: taskIdCounter++,
    callback, // 调度的任务
    priorityLevel, // 任务优先级
    startTime, // 任务开始的时间, 表示任务何时才能执行
    expirationTime, // 任务的过期时间
    sortIndex: -1, // 在小顶堆队列中排序的依据
  };

  if (enableProfiling) {
    newTask.isQueued = false;
  }

  /*
   * (4
   */
  // startTime > currentTime 说明任务无需立刻执行
  // 故放到 timerQueue 中
  if (startTime > currentTime) {
    // timerQueue 是通过 startTime 判断优先级的,
    // 故将 startTime 设为 sortIndex 作为优先级依据
    newTask.sortIndex = startTime;
    push(timerQueue, newTask);

    // 如果 taskQueue 是空的, 并且当前任务优先级最高
    // 那么这个任务就应该优先被设为 isHostTimeoutScheduled
    if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
      // 如果超时调度已经在执行了, 就取消掉
      // 因为当前这个任务是最高优的, 需要先处理当前这个任务
      if (isHostTimeoutScheduled) {
        cancelHostTimeout();
      } else {
        isHostTimeoutScheduled = true;
      }
      // Schedule a timeout.
      requestHostTimeout(handleTimeout, startTime - currentTime);
    }
  } else {
    // startTime <= currentTime 说明任务已过期
    // 需将任务放到 taskQueue
    newTask.sortIndex = expirationTime;
    push(taskQueue, newTask);

    if (enableProfiling) {
      markTaskStart(newTask, currentTime);
      newTask.isQueued = true;
    }

    // 如果目前正在对某个过期任务进行调度,
    // 当前任务需要等待下次时间片让出时才能执行
    if (!isHostCallbackScheduled && !isPerformingWork) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    }
  }

  return newTask;
}
```

#### getCurrentTime

顾名思义, getCurrentTime 用来获取当前时间, 它优先使用 [`performance.now()`](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now), 否则使用 `Date.now()`. 提起 performance 我们并不陌生, 它主要被用来收集性能指标. `performance.now()` 返回一个精确到毫秒的 `DOMHighResTimeStamp`(emmm, 一看到 HighRes 就想起大法).

![Sony Hi-Res](https://static.yancey.app/rc3v7cruxx-1622531131004)

```ts
let getCurrentTime;
const hasPerformanceNow =
  typeof performance === "object" && typeof performance.now === "function";

if (hasPerformanceNow) {
  const localPerformance = performance;
  getCurrentTime = () => localPerformance.now();
} else {
  const localDate = Date;
  const initialTime = localDate.now();
  getCurrentTime = () => localDate.now() - initialTime;
}
```

稍微看了下 [chromium 源码](https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/timing/performance.cc;l=1107;drc=28684b63b1e1ece5396dc0e4c03118855710a75f;bpv=1;bpt=1)(反正也看不懂啦),
大抵就是说 `performance.now()` 是个单调递增的时间(`monotonic_time`), 这保证了两个调用之间的差永远不会是负的;
此外还看到通过 `time_lower_digits` 和 `time_upper_digits` 来做了一些降噪处理, 保证计算结果不会太突兀. 此外还有什么[粗化时间算法(coarsen time algorithm)](https://w3c.github.io/hr-time/#dfn-coarsen-time)就更尼玛看不懂了.

```c++
DOMHighResTimeStamp Performance::now() const {
  return MonotonicTimeToDOMHighResTimeStamp(tick_clock_->NowTicks());
}
```

#### requestHostTimeout 和 cancelHostTimeout

显然这是一对相爱相杀的好基友. 为了让一个**未过期**的任务能够到达**恰好过期**的状态, 那么需要延迟 `startTime - currentTime` 毫秒就可以了(其实它俩的差就是 XXX_PRIORITY_TIMEOUT), `requestHostTimeout` 就是来做这件事的, 而 `cancelHostTimeout` 就是用来取消这个超时函数的.

```ts
function requestHostTimeout(callback, ms) {
  taskTimeoutID = setTimeout(() => {
    callback(getCurrentTime());
  }, ms);
}

function cancelHostTimeout() {
  clearTimeout(taskTimeoutID);
  taskTimeoutID = -1;
}
```

#### handleTimeout

`requestHostTimeout` 的第一个参数就是 `handleTimeout`, 让我们来看看它是来做什么的. 首先将

```ts
function handleTimeout(currentTime) {
  // 因为要递归的
  isHostTimeoutScheduled = false;
  // 更新 timerQueue 和 taskQueue 两个序列
  advanceTimers(currentTime);

  // 检查是否已经开始调度, 如果正在调度
  // 就什么都不做
  if (!isHostCallbackScheduled) {
    // 如果 taskQueue 中有任务, 那就先去执行已过期的任务
    if (peek(taskQueue) !== null) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    } else {
      // 如果没有过期任务, 那就接着对最高优的第一个未过期的任务
      // 继续重复这个过程, 直到它可以被放置到 taskQueue
      const firstTimer = peek(timerQueue);
      if (firstTimer !== null) {
        requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
      }
    }
  }
}
```
