# 前端性能面面观

> 前端性能面面观

## 用户对性能的感知

- 当用户请求一个网站时, 如果在 1 秒内看不到关键内容, 用户会产生任务被中断的感觉.
- 当用户点击某些按钮时, 如果 100ms 内无法响应, 用户会感受到延迟.
- 如果 Web 中的动画没有达到 60fps, 用户会感受到动画的卡顿.

## Chrome 开发者工具

工欲善其事, 必先利其器. 要想对网页的性能状况有系统的认知, 首先要求我们能够熟练使用 Chrome 开发者工具, Chrome 开发者工具为我们提供了通过界面访问或者编辑 DOM 和 CSSOM 的能力, 还提供了强大的调试功能和查看性能指标的能力. 它一共包含了 10 个功能面板, 包括了 Elements, Console, Sources, NetWork, Performance, Memory, Application, Security, Audits 和 Layers. 下图是这十个 Tab 的具体功能. 我们在本篇文章中着重讲 NetWork 和 Performance.

![十个 Tab 的具体功能](https://edge.yancey.app/beg/96hc3cmj-1650732264469.webp)

## 网络面板

网络面板由控制器, 过滤器, 抓图信息, 时间线, 详细列表和下载信息概要这 6 个区域构成.

![网络面板](https://edge.yancey.app/beg/9vqt2trv-1650736950606.webp)

### 控制器

- 红色圆点的按钮, 表示**开始 / 暂停抓包**.
- **全局搜索**按钮, 这个功能就非常重要了, 可以在所有下载资源中搜索相关内容, 还可以快速定位到某几个你想要的文件上.
- Disable cache, 即**禁止从 Cache 中加载资源**的功能, 它在调试 Web 应用的时候非常有用, 因为开启了 Cache 会影响到网络性能测试的结果.
- Online 按钮, 是**模拟 2G/3G**功能, 它可以限制带宽, 模拟弱网情况下页面的展现情况, 然后你就可以根据实际展示情况来动态调整策略, 以便让 Web 应用更加适用于这些弱网.

![控制器](https://edge.yancey.app/beg/6t6zeyao-1650737030718.webp)

### 过滤器

网络面板中的过滤器, 主要就是起过滤功能. 因为有时候一个页面有太多内容在详细列表区域中展示了, 而你可能只想查看 JavaScript 文件或者 CSS 文件, 这时候就可以通过过滤器模块来筛选你想要的文件类型.

### 抓图信息

抓图信息区域可以用来分析用户等待页面加载时间内所看到的内容, 分析用户实际的体验情况. 比如, 如果页面加载 1 秒多之后屏幕截图还是白屏状态, 这时候就需要分析是网络还是代码的问题了. (勾选面板上的 **Capture screenshots** 即可启用屏幕截图)

#### 时间线

时间线主要用来展示 HTTP, HTTPS, WebSocket 加载的状态和时间的一个关系, 用于直观感受页面的加载过程. 如果是多条竖线堆叠在一起, 那说明这些资源被同时被加载. 至于具体到每个文件的加载信息, 还需要用到下面要讲的详细列表.

### 详细列表

这个区域是最重要的, 它详细记录了每个资源从发起请求到完成请求这中间所有过程的状态, 以及最终请求完成的数据信息. 通过该列表, 你就能很容易地去诊断一些网络问题.

#### 列表的属性

列表的属性包括 Name, Status, Type, Initiator 等等, 支持拖拽排序.

![列表的属性](https://edge.yancey.app/beg/ydzsjlto-1650737426441.webp)

#### 详细信息

### 下载信息概要

一般关注 DOMContentLoaded 和 Load 两个事件.

- DOMContentLoaded 这个事件发生后, 说明页面已经构建好 DOM 了, 这意味着构建 DOM 所需要的 HTML 文件, JavaScript 文件, CSS 文件都已经下载完成了.
- Load 事件说明浏览器已经加载了所有的资源(图像, 样式表等）.

## 性能指标

- FP(First Paint) 首次绘制

- FCP(First Contentful Paint) 首次绘制内容

- FMP(First Meaningful Paint) 首次有意义的绘制

- TBT(Total Blocking Time) 第一次有内容的绘制(FCP)和交互(TTI)之间的总时间

- TTI(Time To Interactive) 可交互时间: 应用在视觉上都已渲染出了, 完全可以响应用户的输入

- FCI(First CPU Idle) 首次 CPU 空闲时间: 代表着一个网页已经满足了最小程度的与用户发生交互行为的时刻

- FPS(Frames Per Second) 每秒帧率

- TTFB(Time to first byte) 发出页面请求到接收到应答数据第一个字节所花费的毫秒数

- LCP(Largest Contentful Paint) 最大内容绘制, 应小于 2.5s

- FID(First Input Delay) 首次输入延迟

- CLS(Cumulative Layout Shift) CLS 度量在页面的整个生命周期中发生的每个意外布局更改的所有单独布局更改得分的总和

## performance.timing

```ts
let times = {};
let t = window.performance.timing;

// 重定向时间
times.redirectTime = t.redirectEnd - t.redirectStart;

// DNS 查询耗时
times.dnsTime = t.domainLookupEnd - t.domainLookupStart;

// TTFB 读取页面第一个字节的时间
times.ttfbTime = t.responseStart - t.navigationStart;

// DNS 缓存时间
times.appcacheTime = t.domainLookupStart - t.fetchStart;

// 卸载页面的时间
times.unloadTime = t.unloadEventEnd - t.unloadEventStart;

// TCP 连接耗时
times.tcpTime = t.connectEnd - t.connectStart;

// request 请求耗时
times.reqTime = t.responseEnd - t.responseStart;

// 解析 DOM 树耗时
times.analysisTime = t.domComplete - t.domInteractive;

// 白屏时间
times.blankTime = t.domLoading - t.navigationStart;

// domReadyTime
times.domReadyTime = t.domContentLoadedEventEnd - t.fetchStart;
```

## JavaScript 篇

- 提升单次脚本的执行速度, 避免 JavaScript 的长任务霸占主线程, 这样可以使得页面快速响应交互;
- 避免大的内联脚本, 因为在解析 HTML 的过程中, 解析和编译也会占用主线程;
- 减少 JavaScript 文件的容量, 因为更小的文件会提升下载速度, 并且占用更低的内存.

## PWA

普通网页的缺陷:

- 首先, Web 应用缺少离线使用能力, 在离线或者在弱网环境下基本上是无法使用的. 而用户需要的是沉浸式的体验, 在离线或者弱网环境下能够流畅地使用是用户对一个应用的基本要求.
- 其次, Web 应用还缺少了消息推送的能力, 因为作为一个 App 厂商, 需要有将消息送达到应用的能力.
- 最后, Web 应用缺少一级入口, 也就是将 Web 应用安装到桌面, 在需要的时候直接从桌面打开 Web 应用, 而不是每次都需要通过浏览器来打开.

针对以上 Web 缺陷, PWA 提出了两种解决方案：通过引入 Service Worker 来试着解决离线存储和消息推送的问题, 通过引入 manifest.json 来解决一级入口的问题.

Service Worker 的主要思想是在页面和网络之间增加一个拦截器, 用来缓存和拦截请求. 在没有安装 Service Worker 之前, WebApp 都是直接通过网络模块来请求资源的. 安装了 Service Worker 模块之后, WebApp 请求资源时, 会先通过 Service Worker, 让它判断是返回 Service Worker 缓存的资源还是重新去网络请求资源. 一切的控制权都交由 Service Worker 来处理.

我们知道 JavaScript 和页面渲染流水线的任务都是在页面主线程上执行的, 如果一段 JavaScript 执行时间过久, 那么就会阻塞主线程, 使得渲染一帧的时间变长, 从而让用户产生卡顿的感觉.

为了避免 JavaScript 过多占用页面主线程时长的情况, 浏览器实现了 Web Worker 的功能. Web Worker 的目的是让 JavaScript 能够运行在页面主线程之外, 不过由于 Web Worker 中是没有当前页面的 DOM 环境的, 所以在 Web Worker 中只能执行一些和 DOM 无关的 JavaScript 脚本, 并通过 postMessage 方法将执行的结果返回给主线程. 所以说在 Chrome 中, Web Worker 其实就是在渲染进程中开启的一个新线程, 它的生命周期是和页面关联的.

不过 Web Worker 是临时的, 每次 JavaScript 脚本执行完成之后都会退出, 执行结果也不能保存下来, 如果下次还有同样的操作, 就还得重新来一遍. 所以 Service Worker 需要在 Web Worker 的基础之上加上储存功能.

另外, 由于 Service Worker 还需要会为多个页面提供服务, 所以还不能把 Service Worker 和单个页面绑定起来. 在目前的 Chrome 架构中, Service Worker 是运行在浏览器进程中的, 因为浏览器进程生命周期是最长的, 所以在浏览器的生命周期内, 能够为所有的页面提供服务.

![PWA](https://edge.yancey.app/beg/z3o4jq6k-1650722871655.webp)

## 总结

![前端性能优化](https://edge.yancey.app/beg/quaky10q-1650778952349.png)
