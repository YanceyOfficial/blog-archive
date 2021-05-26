# 聊一聊 React Scheduler 的前生今世

> ccc

## 多个任务的管理

在 Scheduler 中, 任务被分成了两种: **未过期的任务**和**已过期的任务**, 分别存在 `timerQueue` 和 `taskQueue` 两个队列中.

### 如何区分两种任务?

通过任务的**开始时间(startTime)** 和 **当前时间(currentTime)** 比较:

- 当 `startTime > currentTime`, 说明未过期, 存到 `timerQueue`
- 当 `startTime <= currentTime`, 说明已过期, 存到 `taskQueue`

### 入队的任务如何排序?

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

### 任务的执行

- 对于 `taskQueue`, 因为里面的任务已经过期了, 需要在 workLoop 中循环执行完这些任务
- 对于 `timerQueue`, 它里面的任务都不会立即执行, 但在 workLoop 方法中会通过 `advanceTimers` 方法来检测第一个任务是否过期, 如果过期了, 就放到 `taskQueue` 中.

## 单个任务的中断及恢复

## 五种优先级
