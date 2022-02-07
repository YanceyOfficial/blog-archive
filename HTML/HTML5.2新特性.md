# HTML5.2 新特性

![logo](https://static.yancey.app/fe55649c-8fcf-4655-8a2f-0a0fff41435e.png)

> 平成 29 年 12 月 14 日，W3C 发布 HTML 规范 5.2 更新版本，并官方建议用户使用。此次更新增加了 dialog 标签等新功能、弃用了一些其他功能，比如废除了 keygen 标签。并对 iframe 增加了支付请求 API、演示 API 等。支付请求 API 啊卧槽！！！！

### 说明

本文翻译自国外某大触的文章，原文戳[这里](https://bitsofco.de/whats-new-in-html-5-2/?utm_source=tuicool&utm_medium=referral)。第一次翻译别人文章，想想还有点儿小激动呢。乌干达乡下的えいご水平，见谅见谅。

### HTML 5.2 中有什么新玩意儿？

不到一个月前，HTML 5.2 成为正式的 W3C 推荐标准（REC）。当一个规范到达 REC 阶段时，这意味着它已经得到了 W3C 成员和指导者的正式认可，并且 W3C 正式推荐它由用户代理部署，并且由网页作者执行。

在 REC 阶段，任何新的应该至少有 2 个独立的实现。这对于我们作为网页开发人员来说是开始实施任何新功能的好时机。

在 HTML 5.2 中，有一些增加和删除，所有这些都可以在官方的 HTML 5.2 Changes 页面上看到。在本文中，我将介绍一些我认为会影响我的发展的变化。

#### 一个原生的 dialog 标签

在所有的 HTML5.2 新特性中，最令我~~高潮~~兴奋的就是\<dialog>标签了，这货在网页中炒鸡常见，然而每个实现在某种程度上是不同的，对话框也很难以可访问的方式进行，导致网页上的大多数对话框对于以不可视方式浏览网页的用户是不可用的。

新的\<dialog>元素旨在改变这一点，它提供了一个简单的方式来包含一个模态框，而不必担心很多缺陷。我将写一篇关于这个元素如何工作的单独的，详细的文章，但这里有一些基础知识。

```
<dialog>
  <h2>Dialog Title</h2>
  <p>Dialog content and other stuff will go here</p>
</dialog>




```

默认这货是关闭的，除非给 dialog 标签增加一个**open**属性

```
<dialog open>




```

open 属性可以通过调用 show（）和 close（）方法来切换，任何 HTMLDialogElement 都可以使用这个方法。

```
<button id="open">Open Dialog</button>
<button id="close">Close Dialog</button>

<dialog id="dialog">
  <h2>Dialog Title</h2>
  <p>Dialog content and other stuff will go here</p>
</dialog>

<script>
const dialog = document.getElementById("dialog");

document.getElementById("open").addEventListener("click", () => {
  dialog.show();
});

document.getElementById("close").addEventListener("click", () => {
  dialog.close();
});
</script>




```

\<dialog>标签已经被 Chrome 支持（Chrome 大法好！！！），火狐也立了梗马上要支持了。

![Data on support for the dialog feature across the major browsers](https://static.yancey.app/caniuse-dialog.png)

_注：鄙人在 2 月 8 号测试时，火狐以及火狐开发者版本都木有支持 dialog 标签_

_再注：🤮🤮🤮 都 9102 年了，FF 和 Safari 还没支持，而且如果用了 dialog，Safari 没眼看了_

#### 在 iframe 中使用 Payment Request API

Payment Request API 是 checkout 表单的一种原生替代方案，它旨在通过将检索支付信息的处理移动到浏览器，而不是在每个网站上的使用单独的 checkout 表单，以此来提供用户在网络上进行支付的标准化和一致的方法。

在 HTML 5.2 之前，这些支付请求不能通过嵌入在文档中的 iframe 来完成。这使得第三方嵌入式支付解决方案（例如 Stripe，Paystack）基本上不可能利用这个 API，因为他们的支付接口通常是在 iframe 中处理的。

HTML 5.2 引入了 allowpaymentrequest 属性，该属性应用于 iframe 时，将允许它在用户处于托管网页时使用 Payment Request API.

```
<iframe allowpaymentrequest>




```

#### 苹果设备的图标尺寸

_注：这里就不全翻译了，简单写_

远古时期，声明 Apple 图标尺寸是酱婶儿的~

```
<link href="images/57x57.png" rel="apple-touch-icon-precomposed" sizes="57x57"/>
<link href="images/72x72.png" rel="apple-touch-icon-precomposed" sizes="72x72"/>




```

而如今。嗯，就是这么傲娇：

```
<link href="images/57x57.png" rel="icon" sizes="57x57"/>
<link href="images/72x72.png" rel="icon" sizes="72x72"/>




```

### 最新的有效做法

#### 支持多 main 标签

```
<!--表示一脸懵逼，真心没用过这个-->
<main>...</main>
<main hidden>...</main>
<main hidden>...</main>




```

_注：当页面中有多个 main 标签，只能有一个是显示的，其他的都必须用**hidden**属性给隐藏掉，并且**只能用 hidden 属性**，像**display: none; or visibility: hidden; **是不允许的_。

妈的，好傲娇。

#### style 可以写在 body 里

```
<body>
    <p>I’m cornflowerblue!</p>
    <style>
        p { color: cornflowerblue; }
    </style>
    <p>I’m cornflowerblue!</p>
</body>




```

私以为，这样不太好吧...

#### legend 标签里可以嵌套 header 标签

```
<fieldset>
    <legend><h2>Basic Information</h2></legend>
    <!-- Form fields for basic information -->
</fieldset>
<fieldset>
    <legend><h2>Contact Information</h2></legend>
    <!-- Form fields for contact information -->
</fieldset>




```

### 移除的功能

\<keygen> \<menu> \<menuitem>这三个标签已扑街。

### 最新的无效做法

#### p 标签不应嵌套内联、浮动、块级子元素

在 HTML 5.2 中，p 标签唯一有效子元素应该是措辞内容。这意味着以下类型的元素不应该嵌套在一个段落中：

- Inline blocks

- Inline tables

- Floated and positioned positioned blocks

#### 废除严格文本类型

```
<!--下面两条文本类型声明已死，有事烧纸。ヾ(￣▽￣)Bye~Bye~-->

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">




```

### 最后

谷歌翻译真心不错，嗯，真心不错。

以上、よろしく。
