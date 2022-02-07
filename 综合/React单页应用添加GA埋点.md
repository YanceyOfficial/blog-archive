# React 单页应用添加 GA 埋点

![logo](https://static.yancey.app/google_analytics.png)

> Blog2.0 已经上线一个多月了，突然想起还没把 GA 从 1.0 迁移过来，但 2.0 是一个 SPA 应用，不能跟以前那样简单引一段 JS 代码。折腾了一小会儿搞了出来，这里做个记录。

## 概览

单页应用 (SPA) 指的是在首次加载网页时加载浏览整个网站所需所有资源的网络应用或网站。当用户点击链接并与网页互动时，系统将以动态方式加载后续内容。应用会经常更新地址栏中的网址来模仿传统的网页导航，但始终不会再发出整个网页加载请求。

在传统网站上运行默认的 JavaScript 跟踪代码段没有任何问题，因为该代码段在用户每次加载新页面时都会运行。但是，对于单页应用，网站以动态方式加载新的网页内容，而不采用整个网页加载方式，因此 analytics.js 代码段仅运行一次。也就是说，当有新内容加载时，必须通过人工方式跟踪后续的（虚拟）网页浏览。

—— 节(cou)选(zi)自(shu)Google 原文

## 前提

这里基于 react-router-4.x，需要用到`history`模式。

首先你的 src 目录下要有一个`history.js`,内容如下：

```
import createHistory from 'history/createBrowserHistory';

export default createHistory();

```

## 安装依赖

```
 yarn add react-ga

```

## 使用

我是在`App.js`import `history`和`react-ga`这两个包；

然后写如下这个方法：

```
 reactGA() {
    ReactGA.initialize('YOUR_GA_KEY');
    history.listen((location, action) => {
      ReactGA.pageview(window.location.pathname + window.location.search);
    });
  }

```

让这个方法放在`componentWillMount`钩子下执行即可，打开 GA，发现能监测到路由的变化了。
