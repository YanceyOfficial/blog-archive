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

```ts
// timerQueue 根据 startTime 排序
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

var expirationTime = startTime + timeout;
```

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
