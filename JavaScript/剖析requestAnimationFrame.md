# 剖析 requestAnimationFrame

![logo](https://edge.yancey.app/beg/IMG_20171127_161530-1024x576.jpg)

> 得益于 CSS3 的发展，大部分动效不再依赖传统的定时器编写。然而 CSS3 无法处理一些需要数学计算的效果，如三次方缓动、指数衰减的正弦曲线缓动等等。requestAnimationFrame 作为一个新兴的 API（其实也不新了），既比定时器动效温柔，又比 CSS 动效广泛，下面其聊一聊其正确打开姿势。

## 定时器动画存在的问题

「JavaScript 高级程序（第三版）」这么说：IE9 将定时器精度提高到 4ms, Chrome 也是 4ms, FF 和 Safari 是 10ms，但此精度对动画并不够明确。而且浏览器显示后台标签页和不活动标签页的计时器。

第二点还是深有体会，比如写了一个倒计时的组件，运行之后最小化浏览器，过一会儿再打开，发现时间还定格在一个过去的时间，然后会快速的滚到实际的时间。

## requestAnimationFrame 原理

大多数电脑显示器刷新频率是 60HZ，也就是说每秒重绘次，因此，最平滑动画的最佳循环间隔是 1000ms/60≈17ms

所以有疑问了，那把`setTimeOut()`或者`setInterval()`间隔时间设为 17ms 不就得了？

肯定不行，如果这两个方法之前有其他正在执行的任务，那这两段代码也无法立即执行。

## requestAnimationFrame 语法

书上还保留着`mozRequestAnimationFrame`和`msRequestAnimationFrame`，但用 WebStorm 语法提示发现这两个已经没有了，所以下面就不对这两个进行兼容了。

直接看 W3C 的一个例子，这个例子是将元素向右滑动移动 200px：

```ts
var start = null;
var element = document.getElementById("SomeElementYouWantToAnimate");
element.style.position = "absolute";

function step(timestamp) {
  if (!start) start = timestamp;
  var progress = timestamp - start;
  element.style.left = Math.min(progress / 10, 200) + "px";
  if (progress < 2000) {
    window.requestAnimationFrame(step);
  }
}

window.requestAnimationFrame(step);
ionFrame(step);
```

window.requestAnimationFrame(callback),里面需要传一个函数，并且每次调用它会给这个函数传一个`DOMHighResTimeStamp`，指示 requestAnimationFrame() 开始触发回调函数的当前时间。

而每次传入的这个`DOMHighResTimeStamp`的增量, 大约就是 17ms，为了佐证，我专门将`timestamp`追加到数组，然后放在`Chart.js`做了简单的数据可视化，如图下：

![DOMHighResTimeStamp变化曲线](https://edge.yancey.app/beg/b4ca9cf3-35db-4f27-9143-73b54cca26ee.jpg)

分析这张图，因为程序启动或多或少受到一些干扰，因此横坐标并不是从 0 开始的；

但是从程序开始到程序结束的`截距`可以大致看出是`2000ms`;

然后函数接近于一条线性函数，`斜率`可以计算一下大约为`17`;

## requestAnimationFrame 在缓动效果的用法

上面说到，CSS3 还无法处理一些缓动效果，而定时器效果又不好，因此 requestAnimationFrame 是个不错的选择，直接看例子：

```ts
let t = 0,
  b = 0,
  c = 100,
  d = 100;

const easeOut = (t, b, c, d) => {
  if ((t /= d) < 1 / 2.75) {
    return c * (7.5625 * t * t) + b;
  } else if (t < 2 / 2.75) {
    return c * (7.5625 * (t -= 1.5 / 2.75) * t + 0.75) + b;
  } else if (t < 2.5 / 2.75) {
    return c * (7.5625 * (t -= 2.25 / 2.75) * t + 0.9375) + b;
  } else {
    return c * (7.5625 * (t -= 2.625 / 2.75) * t + 0.984375) + b;
  }
};

const step = () => {
  const _width = easeOut(t, b, c, d);
  t++;
  document.querySelector("#SomeElementYouWantToAnimate").style.width =
    100 + _width + "px";
  if (t <= d) {
    window.requestAnimationFrame(step);
  } else {
    window.cancelAnimationFrame(step);
  }
};

step();
```

代码和效果全都放在了上面，其中`easeOut`是一个缓动函数，直接从张鑫旭大大那边抄来了，戳 => [GitHub Repo](https://github.com/zhangxinxu/Tween)

## requestAnimationFrame 的一些问题

W3C 原文这么说：

Also note that multiple calls to requestAnimationFrame with the same callback (before callbacks are invoked and the list is cleared) will result in multiple entries being in the list with that same callback, and thus will result in that callback being invoked more than once for the animation frame.

也就是 requestAnimationFrame 不管理回调，因此有可能出现在同一帧多次调用的问题。

下面我同样去调用文章第一个函数，但这次在函数运行过程中我会`切换选项卡`，然后再看一下渲染出来的图表：

![当我在程序运行中切换选项卡](https://edge.yancey.app/beg/77bab955-9126-4260-89e9-a89b45970fbe.jpg)

由图可见，横坐标不再是 120 份，渲染出来的也不是近似一条直线。因此，在 requestAnimationFrame 运行过程中如果触发到`resize`、`visibilitychange`、`scroll`、`touch`这种高频事件，requestAnimationFrame 可能就会造成紊乱。

## 解决方法

看到这类方法，有经验的同学肯定一下子就能想到`防抖`和`节流`，但不见得有什么卵用，<mark>因为`防抖`和`节流`是基于时间管理队列的，而 requestAnimationFrame 的触发时间是不固定的，在高刷新频率的显示屏上时间会小于 16.67ms，页面如果被推入后台，时间可能大于 16.67ms。</mark>

但是每次调用 requestAnimationFrame 时，它自身知道自己的调用时间，所以可以加个 flag 来判断：

```ts
let ticking = false; //raf触发锁

function onScroll() {
  if (!ticking) {
    requestAnimationFrame(step);
    ticking = true;
  }
}

window.addEventListener("resize", onScroll, false);
```

然后在`step`把`ticking`置为`false`。

最后把整个 demo 贴在这里，包括 chart.js 渲染：

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>requestAnimationFrame</title>
    <style>
      #SomeElementYouWantToAnimate {
        width: 100px;
        height: 100px;
        background: #7fffd4;
      }
    </style>
  </head>
  <body>
    <div style="height: 10000px;"></div>
    <div id="SomeElementYouWantToAnimate"></div>
    <canvas id="myChart" width="400" height="400"></canvas>
    <script src="./Chart.min.js"></script>
    <script>
      // record data
      const arr = [];
      const indexList = [];

      let ticking = false; //raf触发锁

      function onScroll() {
        if (!ticking) {
          requestAnimationFrame(step);
          ticking = true;
        }
      }

      window.addEventListener("resize", onScroll, false);

      let start = null;
      function step(timestamp) {
        ticking = false;

        arr.push(timestamp);

        if (!start) start = timestamp;
        const progress = timestamp - start;
        document.querySelector("#SomeElementYouWantToAnimate").style.width =
          100 + Math.min(progress / 10, 200) + "px";
        if (progress <= 2000) {
          window.requestAnimationFrame(step);
        } else {
          window.cancelAnimationFrame(step);
          for (let i = 0; i < arr.length; i++) {
            indexList.push(i);
          }
          new Chart(document.getElementById("myChart"), {
            type: "line",
            data: {
              labels: indexList,
              datasets: [
                {
                  label: "Chart for requestAnimationFrame API",
                  data: arr,
                  fill: false,
                  borderColor: "rgba(75, 192, 192)",
                  lineTension: 0.1,
                },
              ],
            },
          });
        }
      }

      window.requestAnimationFrame(step);
    </script>
  </body>
</html>
```

## 参考文章

[张鑫旭 - CSS3 动画那么强，requestAnimationFrame 还有毛线用？](https://www.zhangxinxu.com/wordpress/2013/09/css3-animation-requestanimationframe-tween-%E5%8A%A8%E7%94%BB%E7%AE%97%E6%B3%95/)

[requestAnimationFrame 方法你真的用对了吗？](https://segmentfault.com/a/1190000010229232)

以上、よろしく。
