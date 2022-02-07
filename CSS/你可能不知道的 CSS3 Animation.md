# 你可能不知道的 CSS3 Animation

> 过段时间要帮女孩做一些计算机视觉的东西，所以研究下动画这一块。前端创建动画有三种，分别是 **定时器**, **requestAnimationFrame** 以及 **CSS3 Animation**，而 requestAnimationFrame 的出现基本秒杀了定时器。虽然 Animation 暂无法处理如三次方缓动、指数衰减正弦曲线缓动等需要高级数学运算的动画（貌似 CSS3 要支持三角函数了），但在绝大多数情况下依旧可以做出非常优秀的动画效果，这里对 Animation 各属性做个总结。

## 属性一览

目前 animation 有下面 9 种属性，其中第一个是后面属性的简写形式。

| 属性                      | 描述                                          |
| ------------------------- | --------------------------------------------- |
| animation                 | 下面各属性的简写（除了 animation-play-state） |
| animation-name            | 指定 @keyframes 动画的名称                    |
| animation-duration        | 动画完成一个周期的时间，默认为 0s             |
| animation-timing-function | 动画运行的'节奏'，默认是 ease                 |
| animation-delay           | 动画开始播放的延迟时间，默认是 0              |
| animation-iteration-count | 动画播放的次数，默认是 1                      |
| animation-direction       | 规定动画是否在下一个周期逆向播放              |
| animation-fill-mode       | 规定动画的填充模式                            |
| animation-play-state      | 控制动画的运行或暂停，默认是 running          |

## animation-name

该属性用于指定 @keyframes 动画的名称。定义关键帧需要使用 `@keyframes` 规则。样式块语句中可以使用 **from...to** 结构，也可以使用**百分比**来定义。

如下面这段代码，它在动画开始运行时将元素放大 1.1 倍，在动画运行到一半时将元素缩小为 0.8 倍，在动画结束时将元素再放大为 1.1 倍，配合上后面要讲到的 infinite 和贝塞尔曲线，就可以模拟出不错的心跳动画效果。

```css
.heart {
  animation: heartbeat cubic-bezier(0.2, 0.73, 0.71, 0.44) infinite;
}

@keyframes heartbeat {
  0% {
    transform: scale(1.1);
  }
  50% {
    transform: scale(0.8);
  }
  100% {
    transform: scale(1.1);
  }
}
```

![HEART BEAT](https://user-gold-cdn.xitu.io/2019/4/4/169e6d3fb65af29d?w=419&h=104&f=gif&s=1154633)

## animation-duration

该属性定义一个动画周期的时长。

- 默认值为 0s，表示无动画

- 单位为秒或者毫秒，无单位值无效

## animation-timing-function

该属性用于定义动画的'节奏'，默认值为 ease.

| 属性值      | 描述                       |
| ----------- | -------------------------- |
| ease        | 缓慢开始，缓慢结束         |
| ease-in     | 先慢后快                   |
| ease-out    | 先快后慢                   |
| ease-in-out | 以慢速开始和结束的过渡效果 |
| linear      | 平滑效果   |
| step-start  | 步进，忽略第一帧           |
| step-end    | 步进，忽略最后一帧         |
| step-middle | 步进，从第一帧到最后一帧   |

不管是在 Animation 还是 Transition 里，前 5 个应该很常见，我们可以直接在 Chrome Dev 中查看具体的函数图像（其实这五个就是贝塞尔曲线的几种特殊形式）。

![Jietu20190404-000307@2x.jpg](https://user-gold-cdn.xitu.io/2019/4/4/169e6d3fb6658dac?w=544&h=750&f=jpeg&s=34291)

step-start, step-end 和 step-middle 表示步进动画。

其中 step-start 会忽略相应 @keyframs 规则的第一帧，而 step-end 会忽略最后一帧, step-middle 在一个周期内会从**第一帧一直步进到最后一帧**。

看下面这个例子，当使用 `step-start` 时，元素的初始状态就是 1.2 倍（对应着 25%），一个周期内步进执行 25% -> 50% -> 75% -> 100%

当使用 `step-end` 时，元素的初始状态是 1.1 倍（对应着 0%），一个周期内步进执行 0% -> 25% -> 50% -> 75%

当使用 `step-middle` 时，元素的初始状态就是元素的初始状态，一个周期内步进执行 0% -> 25% -> 50% -> 75% -> 100%

```css
@keyframes someEffect {
  0% {
    transform: scale(1.1);
  }
  25% {
    transform: scale(1.2);
  }

  50% {
    transform: scale(1.3);
  }

  75% {
    transform: scale(1.4);
  }

  100% {
    transform: scale(1.5);
  }
}
```

此外该属性还有三个内置函数，分别是 cubic-bezier(), steps() 以及 frames()。

这里简单谈一谈 steps()。如果你用过 Twitter，你应该知道它的点赞效果很酷，可以看下图。这个效果完全可以用 steps() 模拟出来，我的博客中点赞模块也有这个效果，不过是用的 box-shadow，你可以看源码 [Like Component](https://github.com/Yancey-Blog/BLOG_FE/tree/master/src/components/Post/Like)

![1_HJHfcRwn33XU4omMogi6PQ (1).gif](<https://user-gold-cdn.xitu.io/2019/4/4/169e6d3fb696cfa6?w=1000&h=500&f=gif&s=211993>)

首先你要下载下面这张图片，可以看到它是一张 **未点赞状态 -> 生成礼花 -> 礼花消失 -> 点赞状态** 的雪碧图。

![1_MTZW1G1mE7LSX1CnhTYeHA.png](https://static.yancey.app/169e6d3fb6a474b2.png)

在初始化时，我们通过 `background-position: left` 和 `background-size: 2900%` 将初始背景定位到上图中第一个灰色的 icon.

接着我们创建一个 @keyframes，用于在一个动画周期内将上面的图片从左到右一次性走完。

为了每一帧都会“跳”到下一个 icon，而不是平滑的移动。我们使用 steps() 函数，因为共有 29 张小 icon，其中默认是第一个，所以传递参数 28.

在点击背景图片时，将 `is_animating` 添加到 heart 元素上，即可实现点赞礼花效果。

```html
<div class="heart"></div>
```

```css
.heart {
  cursor: pointer;
  height: 50px;
  width: 50px;
  background-image: url('heart-locus.png');
  background-position: left;
  background-repeat: no-repeat;
  background-size: 2900%;
}

.is_animating {
  animation-name: heart-burst;
  animation-duration: 800ms;
  animation-timing-function: steps(28);
  animation-iteration-count: 1;
}

@keyframes heart-burst {
  from {
    background-position: left;
  }
  to {
    background-position: right;
  }
}
```

```js
const heartDOM = document.querySelector('.heart');

heartDOM.addEventListener('click', function() {
  this.classList.toggle('is_animating');
});

heartDOM.addEventListener('animationend', function() {
  this.classList.toggle('is_animating');
});
```

## animation-delay

该属性用于将动画延迟执行，默认值为 0s。当该属性的属性值为负值会出现一些好玩的事情，我们直接看 MDN 上的定义。

> 定义一个负值会让动画立即开始。但是动画会从它的动画序列中某位置开始。例如，如果设定值为-1s，动画会从它的动画序列的第 1 秒位置处立即开始。
> 如果为动画延迟指定了一个负值，但起始值是隐藏的，则从动画应用于元素的那一刻起就获取起始值。

我们看下面这个例子：

```css
.cube {
  margin-bottom: 10px;
  width: 100px;
  height: 100px;
  background: #ccc;
  animation: colorChange 10s linear;
}

.has-delay {
  animation-delay: 2s;
}

.has-ng-delay {
  animation-delay: -2s;
}

@keyframes colorChange {
  20% {
    background-color: #f8e81c;
  }

  40% {
    background-color: #d0011b;
  }

  60% {
    background-color: #7ed321;
  }

  80% {
    background-color: #509ce3;
  }

  100% {
    background-color: #ccc;
  }
}
```

html 结构如下：

```html
<div class="cube"></div>
<div class="cube has-ng-delay"></div>
<div class="cube has-delay"></div>
```

这个例子中，我们将 cube 的动画总时长设为 10s，且初始颜色都是灰色。不同的是，第一个 cube 正常执行，第二个 cube "延迟" -2s 执行，第三个 cube 延迟 2s 执行。

根据下面这张图可以看出，第二个 cube 虽然是负数，但从动画一开始就会执行，只不过它是从第二帧开始的。

这是因为定义在 @keyframes 中的动画需要执行 animation-time 时间长度。animation-delay 为正数的时候，动画就要要延迟开始，animation-time 都还没有开始计算，正数的 delay 不会被计算到 animation-time 中，因此我们看到的动画就是从第一帧开始的；animation-delay 为负数的时候，意味着动画是提前开始的，animation-time 已经开始计算了，负数的 delay 是被算入 animation-time 中的，所以我们看到的动画是从某一帧开始的。

![xx](https://user-gold-cdn.xitu.io/2019/4/4/169e6d3fb6beadce?w=720&h=255&f=jpeg&s=28307)

所以我们可以尝试写个 loading 组件出来。源码贴在下面。

```css
.loader-container {
  width: 210px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  grid-row-gap: 10px;
  grid-column-gap: 10px;
}

.cube {
  width: 100px;
  height: 100px;
  background: #ccc;
  animation: colorChange 5s linear infinite;
}

.delay-neg-1 {
  animation-delay: -1s;
}

.delay-neg-2 {
  animation-delay: -2s;
}

.delay-neg-3 {
  animation-delay: -3s;
}

.delay-neg-4 {
  animation-delay: -4s;
}
```

下面是 HTML

```html
<div class="loading-container">
  <div class="cube delay-neg-1"></div>
  <div class="cube delay-neg-2"></div>
  <div class="cube delay-neg-3"></div>
  <div class="cube delay-neg-4"></div>
</div>
```

![a757cbe5b9bc4490ffd445175913401f.gif](https://user-gold-cdn.xitu.io/2019/4/4/169e6d3fb6ab4253?w=347&h=355&f=gif&s=372741)

## animation-iteration-count

该属性定义循环播放动画的次数，默认值为 1

- 不可以为负数

- infinite 表示无限循环

- 可以为小数，比如 0.5 代表播放动画的一半即结束

## animation-direction

该属性表示动画是否反向播放，共有 4 个值：

- normal: 每次从 @keyframes 0% 执行到 100%，一个周期结束后立即回到 0% 的位置

- alternate: 假设 `animation-iteration-count: infinite`，从 @keyframes 0% 执行到 100%后，再从 100% 的位置 回到 0%，周而复始

- reverse: 每次从 @keyframes 100% 执行到 0%，，一个周期结束后立即回到 100% 的位置

- alternate-reverse: 假设 `animation-iteration-count: infinite`，从 @keyframes 100% 执行到 0%后，再从 0% 的位置 回到 100%，周而复始

## animation-fill-mode

用于设定动画时间外的属性，也就是说一个动画周期开始之前或结束之后，元素的状态应该是什么样的。该属性有四个属性值，分别是 none, forwards, backwards, both.

- none 是默认值，表示动画播放完成后，恢复到初始的状态。

- forwards 表示动画播放完成后，保持 @keyframes 里最后一帧的样式。

- backwards 表示开始播放动画之前，元素的样式将设置为动画第一帧的样式

- both 相当于同时配置了 forwards 和 backwards。也就是说，动画开始前，元素样式将设置为动画第一帧的样式；而在动画线束状态，元素样式将设置为动画最后一帧样式。

## animation-play-state

该属性用于让一个动画的暂停与启动，有两个属性值，分别是 running 和 pause，当设置为 pause 时，动画会立即会停在当前位置，当取消暂停后会在**停住的位置**继续执行，而不会回到原点（或终点）重新执行。

## animation

最后说一下 animation 属性，它是上述属性的简写形式，animation 属性暂时还没有收录 `animation-play-state`，如若使用需要单独来写，语法如下。

```css
animation: name duration timing-function delay iteration-count direction fill-mode;
```

## 多动画

上面我们看到了每个属性都可以添加多个属性值，他们之间用逗号隔开，其实就是给一个元素添加多个动画。

## 参考

[CSS3 动画实践](https://aotu.io/notes/2016/01/04/css3-animation/index.html)

[CSS 动画简介](http://www.ruanyifeng.com/blog/2014/02/css_transition_and_animation.html)

[复习 animation-delay 负值以及 delay 正值在 iOS 上的坑](https://zhuanlan.zhihu.com/p/23982450)

[前端 Talkking CSS 系列 —— 一步一步带你认识 animation 动画效果](https://juejin.im/post/5a50bc24518825734859c597)

[CSS3 animation 属性中的 steps 功能符深入介绍](https://www.zhangxinxu.com/wordpress/2018/06/css3-animation-steps-step-start-end/)

[你所不知道的 animation-fill-mode 细节](https://www.w3cplus.com/css3/css-animation-fill-mode-property.html)
