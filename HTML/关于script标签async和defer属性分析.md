# 关于 script 标签 async 和 defer 属性分析

![logo](https://static.yancey.app/whats-the-difference-between-async-vs-defer-attributes.jpg)

> 折腾了半个来月的时间，终于把工作的事情稳定了下来。分析了一下现状，还是不要急着玩一些新鲜的东西。遂定了个计划，在工作之余重新学习 JavaScript 的基础，每周学一章高程，做好总结和笔记。頑張ります！

## 前言

async 和 defer 是高程第二章的两个概念，印象里没有主动用过这俩属性，特别是写 SPA 之后，更没什么合适机会操作 script 标签。

文字很难表述两者间的差异，至少我是这么认为，网上有张图很不错，可以用来解释这两个属性间的差异。

## 正文

![defer和async的差异](https://static.yancey.app/2151798436-59da4801c6772_articlex.png)

## 当不加 aysnc 和 defer 时

- 在解析 HTML 的过程中
- 如果遇到 script 标签
- 浏览器将暂停解析 HTML
- 开始`下载`script 标签里的内容
- 待`下载`完成后，立即执行 script 标签里的内容
- 执行完毕后，再去解析 HTML 标签

## 当使用 async 属性时

- 在解析 HTML 的过程中
- 如果遇到 script 标签
- 解析 HTML 将和`下载`script 标签的内容同时进行
- 当此 script 标签`下载`完成后
- **HTML 将停止解析，转而`执行`此 script 标签的内容**
- 执行完毕后，再去解析 HTML 标签

## 当使用 defer 属性时

- 在解析 HTML 的过程中
- 如果遇到 script 标签
- 解析 HTML 将和`下载`script 标签的内容同时进行
- 当 script 标签`下载`完成后
- **仍然等到 HTML 全部解析完毕**
- 再去执行此 script 标签的内容

## 思考

高程上说当多个 script 都有 defer 属性时，最后会按顺序执行，但实际上不一定；而 async 肯定不一定按顺序执行。

现实场景中可以说 100%都把 script 标签扔到 body 的最后，也就是最后下载，最后执行，在引入三方插件时倒是经常用到，比如：

- Twitter share button
- Google Analytics
- LiveRe / Disqus

这些的一个特点都是以动态创建 script 标签的形式来引入外部 js，类似于 JSONP，而内容上都是和项目整体关联不大的模块。

## 补充

平成 31 年 1 月 2 日做下补充，无论是 defer 还是 async，都只对外部脚本有效。

## 最后

以上、よろしく。
