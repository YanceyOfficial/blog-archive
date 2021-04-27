# Grid 布局

> Grid布局应该是迄今为止最全面最强大的布局方式。从九宫格到圣杯布局、再到响应式设计，Grid提供了一套完美的解决方案。效果说起来很诱人，但学起来还是需要点儿时间，因为属性超级多，而且每个都有新花样，需要慢慢消化。ps: 多图预警，长篇预警，高能预警。

## Introduction

用过BootStrap之类的应该对Grid不陌生，BootStrap3划分栅格主要使用`百分比`，顺便去看了一下第四代，发现使用的是弹性布局了。

不知道大家看到一个小细节没，打开Chrome开发者工具，选择查看元素，将鼠标移动到html页面，发现浏览器自动给栅格标上了虚线，看下图。

![Chrome开发者工具自动标注栅格线](https://static.yancey.app/6ec00c5f-cb40-4d56-9835-fd57d4c7805b.jpg)

既然是写CSS3相关的属性，按惯例先去[Can I Use](https://caniuse.com/#search=grid)了解一下浏览器的支持情况，发现主流浏览器都能完美使用了。

![Can i use Grid?](https://static.yancey.app/5dbd661e-b8d9-4691-a429-ce976c7c74db.jpg)

## Terminology

和`弹性布局`一样，Grid布局也有一些独特的术语，这些务必要理解清楚。

### Grid Container

栅格容器是栅格项(Grid Items)的父级元素，也就是那个需要定义`display: grid;`的那个元素。看下面这个例子，class为`grid-container`的那个div就是一个栅格容器。

```
<div class="grid-container">
	<div class="grid-item grid-item-1"></div>
	<div class="grid-item grid-item-2"></div>
	<div class="grid-item grid-item-3">
		<p>我不是grid-container的直接子元素</p>	
	</div>
</div>



```

### Grid Item

栅格项是栅格容器的`直接子元素`，注意`直接`这两个字，因此上面代码示例中class为`grid-item`的元素是栅格项，而里面的`p`标签则不是。

### Grid Line

栅格线是构成网格结构的分界线：垂直的叫做`列栅格线(column grid lines)`，水平的叫做`行栅格线(row grid lines)`，栅格线的概念很重要，后面定义`grid-column`和`grid-row`都会直接用到栅格线的概念，如下图黄线即为一条栅格线。

![Grid Line](https://static.yancey.app/8d19574c-3a92-4caa-8bb5-c8a9db29af42.png)

### Grid Track

栅格轨道是由两条`相邻`网格线构成的一个`单行`或`单列`的区域。注意`相邻`这个概念，从词法来说，`轨道`一般都是单条的，如下黄色区域则为一条栅格轨道。

![Grid Track](https://static.yancey.app/54636927-1746-4529-8401-6933d20a2cba.png)

### Grid Cell

要注意和`Grid Item`的区别，一个Grid Cell包含其对应的Grid Item和Grid Item里面的内容，如下图黄色区域即为一个栅格元。

![Grid Cell](https://static.yancey.app/c145158d-8aa5-46c8-a106-d0f0cb89eb70.png)

### Grid Area

最后一个术语则是栅格区域，可以说栅格轨道和栅格区域是包含和被包含的关系，如下图的黄色区域就是行栅格线1和3与列栅格线1和3之间圈出来的网格区域。

![Grid Area](https://static.yancey.app/8273252d-9714-4029-8572-65eaa719a446.png)

## List of Grid Attributes

### List of Grid Container Attributes

* display
* grid-template-columns
* grid-template-rows
* grid-template-areas
* grid-template
* grid-column-gap
* grid-row-gap
* grid-gap
* justify-items
* align-items
* justify-content
* align-content
* grid-auto-columns
* grid-auto-rows
* grid-auto-flow
* grid

### List of Grid Item Attributes

* grid-column-start
* grid-column-end
* grid-row-start
* grid-row-end
* grid-column
* grid-row
* grid-area
* justify-self
* align-self

似曾相识吧，如`justify-items`、`align-items`在弹性布局中都是核心概念，所以Grid布局则是一个更加全面的布局模式。

ps: 看到这么多属性头都大了，突然想到某考研名师的名言：

![やめてよ！！！](https://static.yancey.app/6ea92be3-bd18-4886-9985-db6d9a53f539.jpeg)

BUT! 考虑到梦想、~~钱~~(大误)前途。

嗯，真香...（手动王境泽.jpg）

## Grid Container Attributes

首先一一介绍栅格容器的各个属性。

### display

```
display: grid | inline-grid



```

[CSS Grid 布局完全指南\(图解 Grid 详细教程\)](http://www.css88.com/archives/8510#prop-grid-template-areas)还讲到有一个`subgrid`的属性值，是在Grid布局里嵌套Grid布局，不过我的WebStorm提示没有这个属性值，那就忽略好了，感觉也没什么卵用。

当容器定义了grid布局之后，**容器元素**上定义的`column`，`float`，`clear`， `vertical-align`将失效，注意是**容器元素**，这些属性不会影响Grid Cell, 亲测，嗯。

### grid-template-columns / grid-template-rows

这个属性定义Grid Item的大小，有两个属性值：一个是`track-size`，另一个是`line-name`。

```
.grid-container {
	grid-template-columns: <track-size> ... | <line-name> <track-size> ...;
	grid-template-rows: <track-size> ... | <line-name> <track-size> ...;
}



```

#### track-size

`track-size`单位很自由，可以是px、em、rem、vw、vh、百分数、auto等等，特别注意这个`auto`，看下面这个代码,假设`grid-container`外面还包着一层`grid-wrapper`，宽度是500px，那么`grid-template-columns`属性的`auto`就会被计算成500-300-100=100px

```
.grid-wrapper {
  width: 500px;
  .grid-container {
    display: grid;
    grid-template-columns: 300px auto 100px;
  }
}



```

还有一种情况是`grid-container`的总宽或总高大于了`grid-wrapper`的总宽或总高，看下面代码。

```
.grid-wrapper {
  width: 500px;
  .grid-container {
    display: grid;
    grid-template-columns: 300px 200px 100px;
  }
}



```

这里的解释是个人的想法，留个坑，看下图。

![当grid-container的总宽或总高大于grid-wrapper的总宽或总高](https://static.yancey.app/970aea7f-40b7-4f7b-9e99-3b65c744187c.jpg)

#### line-name

这个属性值就比较骚气了，可以定义Grid Line的名称，注意要用`中括号`包起来，第一次见。可以看一个综合示例。

```
.grid-container {
  display: grid;
  grid-template-columns: [first] 40px [line2] 50px [line3] auto [col4-start] 50px [five] 40px [end];
  grid-template-rows: [row1-start] 25% [row1-end] 100px [third-line] auto [last-line];
}



```

![一个综合例子](https://static.yancey.app/dd956aaf-cdc2-4749-aabd-bd5f328d3aa3.png)

更骚气的是，一条Grid Line还可以有多个名称，看代码，这里的第二条row-grid-line将会有两个名字，分别是`row1-end`和`row2-start`。

```
.grid-container {
  display: grid;
  grid-template-rows: [row1-start] 25% [row1-end row2-start] 25%;
}



```

BUT! 还没骚完...还有一个repeat语法，看下面的代码。

```
.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 33.33333vw [col]);
  grid-template-rows: repeat(3, 33.33333vh [row]);
}






```

卧槽，什么概念，三句话搞了一个视口九宫格！想想用传统方式写个九宫格，甚至用弹性布局写个九宫格，而如今...

![感动ing...](https://static.yancey.app/57005890-f4bc-44ed-a9c9-85453da6b098.jpeg)

最后... 还有一个单位... 叫fr...

fr允许你用等分网格容器剩余可用空间来设置Grid Track的大小，看代码。

总宽度是500px，分了三列，其中第一列占了100px，所以后两列占400px，后两列一共是4fr,因此1fr是100px，所以下面的例子等价于`grid-template-columns: 100px 300px 100px;`

```
.grid-wrapper {
  width: 500px;
  .grid-container {
    display: grid;
    grid-template-columns: 100px 3fr 1fr;
    grid-template-rows: repeat(3, 100px [row]);
  }
}



```

蛤？你以为这样就完了？

Naive！

下面要讲到一个属性叫`grid-column-gap / grid-row-gap`，这个东西很流弊，它用来设置每个Grid Item的间距。

设个间距有什么流弊的？`margin`不就得了？

但是考虑一个常见的场景，看代码。这是一个常见的navbar，要使用`margin-right`分隔的话，需要把最后一个`li`的`margin-right`设为`0`.

```
<nav>
    <ul>
        <li>home</li>
        <li>blog</li>
        <li>music</li>
        <li>photo</li>
        <li>about</li>
    </ul>
</nav>

li {
  list-style-type: none;
  display: inline-block;
  margin-right: 10px;
  &:last-child {
    margin-right: 0;
  }
}



```

BUT！`grid-column-gap / grid-row-gap`只会在 列/行 之间创建间距，两侧不会有这个间距。看代码。

```
ul {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-column-gap: 10px;
  li {
    list-style-type: none;
    display: inline-block;
  }
}



```

当然这个例子不太好，目前实在也想不出太好的例子来，总之就是`grid-column-gap / grid-row-gap`可以避免左右边界也给创建间隔。

那`grid-column-gap / grid-row-gap`跟`fr`有毛线关系？看下面这个例子。假设总宽度为500px，现在列分成了5份，每份占20%.

当没有间隔时，正好每个Grid Item的宽为`100px`；

但有了10px的列间隔后，看下面的图，会发现每个Grid Item的宽仍为`100px`，但右边溢出了一部分。

```
.grid-wrapper {
  width: 500px;
  .grid-container {
    display: grid;
    grid-template-columns: repeat(5, 20%);
    grid-template-rows: repeat(2, 100px [row]);
    grid-column-gap: 10px;
}



```

![右边溢出了一部分](https://static.yancey.app/f41d6d46-64da-4e31-845a-c07a6ed95d7c.jpg)

当然你可以考虑使用计算属性，看代码。

```
.grid-wrapper {
  width: 500px;
  .grid-container {
    display: grid;
    grid-template-columns: repeat(5, calc((500px - 10px * 4) / 5));
    grid-template-rows: repeat(2, 100px [row]);
    grid-column-gap: 10px;
}



```

但是还是很麻烦，所以fr就派上了用场（卧槽前面居然这么多铺垫），以列这个方向为例，fr是总宽度减去固定Grid Track的宽度，如果有间隔，再减去间隔的总宽度，最后再去平分剩余宽度，看代码。完美解决。

```
.grid-wrapper {
  width: 500px;
  .grid-container {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: repeat(2, 100px [row]);
    grid-column-gap: 10px;
}



```

### grid-template-areas

这是用来定义模版区域的一个属性，有三个属性值，分别是：

* \<grid-area-name>：由网格项的 grid-area 指定的网格区域名称
* .（点号） ：代表一个空的网格单元
* none：不定义网格区域

还是直接看例子。

```
.grid-item-1 {
  grid-area: header;
}
.grid-item-2 {
  grid-area: main;
}
.grid-item-3 {
  grid-area: aside;
}
.grid-item-4 {
  grid-area: footer;
}
.grid-container {
  display: grid;
  grid-template-columns: 50px 50px 50px 50px;
  grid-template-rows: auto;
  grid-template-areas:
          "header header header header"
          "main main . aside"
          "footer footer footer footer";
}



```

整个栅格系统分了四列，每列宽50px，第一行四个全被定义成了`header`；第二行从左右到右，`main`占了列，第三列`未定义`名称，所以用`.`来占位，最后一个则被定义为`aside`；最后一行则被`footer`所占据。

![grid-template-areas示例示意图](https://static.yancey.app/a9e15001-8241-4acb-ae90-764e4bdbab98.png)

看到这里，就有种`模块化的味道了`，比如在class为`grid-item-1`的部分去定义`header`的相关属性；在class为`grid-item-4`的部分去定义`footer`的相关属性。

放一个我写的例子。

### grid-template

这个属性是`grid-template-rows` ，`grid-template-columns`，`grid-template-areas`的合体版。

私以为本来就很复杂了，合起来更麻烦了，而且`grid-template`不会重置`隐式`栅格属性，即`grid-auto-column`、 `grid-auto-rows`、`grid-auto-flow`，而且`auto`又很常见，所以少用为妙，而且下面还有跟好用的办法。

### grid-column-gap / grid-row-gap

不多说，上面已经介绍到了。这里重复一下，`grid-column-gap / grid-row-gap`只会在 列/行 之间创建间距，两侧不会有这个间距。

### grid-gap

这是`grid-column-gap`和`grid-row-gap`的合体写法，具体语法如下：

```
.grid-container {
	grid-gap: <grid-row-gap> <grid-column-gap>;
}



```

看一个特殊情况：

```
 .grid-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 100px [row]);
    grid-gap: 10px;
}



```

当`grid-gap`只写了一个值，这个值会被认作是`grid-column-gap`的属性值，这个时候相当于`grid-row-gap`没有定义，因此`grid-row-gap`也会被赋给这个值，相当于`grid-gap: 10px 10px;`.

因此，如果只想要列间距，就写成`grid-gap: 0 10px;`即可。

### justify-items

_注：这个属性的细节，包括下面的`align-items`就不详细写了，这一块和我以前写过的一篇文章[弹性布局](https://www.yanceyleo.com/blog/CSS/flexible-box/)一模一样，那里对每个属性值都做了分析，这里只是简单贴一下介绍和属性值list._

justify-items为沿着行轴线(row axis) 对齐网格项(grid items) 内的内容。

* start：将内容对齐到网格区域(grid area)的左侧
* end：将内容对齐到网格区域的右侧
* center：将内容对齐到网格区域的中间（水平居中）
* stretch：填满网格区域宽度（默认值）

### align-items

align-items为沿着列轴线(column axis) 对齐网格项(grid items) 内的内容。

* tart：将内容对齐到网格区域(grid area)的顶部
* end：将内容对齐到网格区域的底部
* center：将内容对齐到网格区域的中间（垂直居中）
* stretch：填满网格区域高度（默认值）

### justify-content

此属性沿着行轴线(row axis) 对齐网格。

* start：将网格对齐到 网格容器(grid container) 的左边
* end：将网格对齐到 网格容器 的右边
* center：将网格对齐到 网格容器 的中间（水平居中）
* stretch：调整 网格项(grid items) 的宽度，允许该网格填充满整个 网格容器 的宽度
* space-around：在每个网格项之间放置一个均匀的空间，左右两端放置一半的空间
* space-between：在每个网格项之间放置一个均匀的空间，左右两端没有空间
* space-evenly：在每个栅格项目之间放置一个均匀的空间，左右两端放置一个均匀的空间

### align-content

此属性沿着列轴线(column axis) 对齐网格。

* start：将网格对齐到 网格容器(grid container) 的顶部
* end：将网格对齐到 网格容器 的底部
* center：将网格对齐到 网格容器 的中间（垂直居中）
* stretch：调整 网格项(grid items) 的高度，允许该网格填充满整个 网格容器 的高度
* space-around：在每个网格项之间放置一个均匀的空间，上下两端放置一半的空间
* space-between：在每个网格项之间放置一个均匀的空间，上下两端没有空间
* space-evenly：在每个栅格项目之间放置一个均匀的空间，上下两端放置一个均匀的空间

### grid-auto-columns / grid-auto-rows

此属性用于自动生成**非**`grid-template-rows`或 `grid-template-columns`创建的Grid Track。

有些绕，看例子，很显然会生成下图这样一个栅格系统。

```
.grid-container {
	display: grid;
	grid-template-columns: 60px 60px;
	grid-template-rows: 90px 90px;
}



```

![显式栅格](https://static.yancey.app/01347098-a600-4585-9593-f952ffe540f0.png)

这里暂时用一下Grid Items的语法`grid-column`和`grid-row`，以区域2为例，它在垂直方向由`第一根线`和`第二根线`围成；在水平方向由`第二根线`和`第三根线`围成。因此区域2可以用一下代码表示：

```
.area-2{
	grid-column: 1 / 2;
	grid-row: 2 / 3;
}



```

![提前了解一下grid-column和grid-row](https://static.yancey.app/4331b23b-52b0-4d6d-8d23-5ff85782dac1.png)

回到正题，看下面代码，`item-a`是在真正的栅格系统里，而`item-b`不再原栅格系统。

```
.item-a {
	grid-column: 1 / 2;
	grid-row: 2 / 3;
}
.item-b {
	grid-column: 5 / 6;
	grid-row: 2 / 3;
}



```

![item-b不在正常的栅格系统里](https://static.yancey.app/5d47a3a7-b70c-4693-8511-97f124a57b02.png)

因此就可以用`grid-auto-columns`和`grid-auto-rows`来定义隐式创建的Grid Track的大小。私以为这种出格的事情，还是不要去做的好。

### grid

`grid`是在一个声明中设置所有以下属性的简写：`grid-template-rows`, `grid-template-columns`, `grid-template-areas`, `grid-auto-rows`, `grid-auto-columns`, 和 `grid-auto-flow` 。

合起来写还是有些头大，我还是分开写（手动债见.jpg）

## Grid Items Attributes

呼～终于把Grid Container的属性全写完了，下面再写Grid Item的。

### grid-column-start / grid-column-end / grid-row-start / grid-row-end

上面有简单介绍过`grid-column`和`grid-row`，其实这四个属性就是这两种分开写的形式。因为合着写要方便很多，所以这里一笔带过，直接看语法。

```
.grid-item {
	grid-column-start: <number> | <name> | span <number> | span <name> | auto
	grid-column-end: <number> | <name> | span <number> | span <name> | auto
	grid-row-start: <number> | <name> | span <number> | span <name> | auto
	grid-row-end: <number> | <name> | span <number> | span <name> | auto
}



```

### grid-column/ grid-row

这里还是要单拎出来再次解释一下，因为有一些好玩的东西。

```
<div class="grid-wrapper">
  <main class="grid-container">
    <section class="grid-item grid-item-1">1</section>
    <section class="grid-item grid-item-2">2</section>
    <section class="grid-item grid-item-3">3</section>
    <section class="grid-item grid-item-4">4</section>
    <section class="grid-item grid-item-5">5</section>
    <section class="grid-item grid-item-6">6</section>
    <section class="grid-item grid-item-7">7</section>
    <section class="grid-item grid-item-8">8</section>
    <section class="grid-item grid-item-9">9</section>
  </main>
</div>

.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: [row-1] 100px [row-2] 100px [row-3] 100px;
  .grid-item-1 {
    grid-column: 1 / span 2;
    grid-row: row-2 / 4;
  }
}



```

先看`grid-column`，`span`就是该网格项将跨越所提供的网格轨道数量，所以这句等价于`grid-column: 1 / 3;`

再看`grid-row`，我们在上面定义的第二条row的名称就叫做`row-2`，因此`row-2`就指代`2`，所以这句等价于`grid-row: 2 / 4;` 所以这就是定义`Grid Line`的名称的意义。

比起`grid-template-areas`的写法，我觉得这个更加方便，因为在HTML中已经做了语义化，再用`grid-template-areas`定义一遍语义不见得是最好的选择。

在线代码在下面：

### grid-area

`grid-area`为网格项提供一个名称，以便可以被使用网格容器`grid-template-areas`属性创建的模板进行引用。 另外，这个属性可以用作`grid-row-start` + `grid-column-start` + `grid-row-end` + `grid-column-end`的缩写。

这里就说一下缩写好了，看代码和图片。

```
.grid-item-d {
	grid-area: 1 / col4-start / last-line / 6
}



```

![grid-area](https://static.yancey.app/364db01f-48f2-4101-9f73-cff0a7e5baf1.png)

### justify-self

`justify-self`是沿着行轴线(row axis) 对齐网格项内的内容。

这又回到了和弹性布局类似的地方，照例写一下所有属性值：

* start：将内容对齐到网格区域的左侧
* end：将内容对齐到网格区域的右侧
* center：将内容对齐到网格区域的中间（水平居中）
* stretch：填充整个网格区域的宽度（这是默认值）

### align-self

`align-self`是沿着列轴线(column axis) 对齐网格项内的内容。

* start：将内容对齐到网格区域的顶部
* end：将内容对齐到网格区域的底部
* center：将内容对齐到网格区域的中间（垂直居中）
* stretch：填充整个网格区域的高度（这是默认值）

## References

[CSS Grid 布局完全指南\(图解 Grid 详细教程\)](http://www.css88.com/archives/8510#prop-grid-column-row)

[CSS 新的长度单位 fr 你知道么？
](https://zhuanlan.zhihu.com/p/27502596)

_注：文章很多图片来自[CSS Grid 布局完全指南\(图解 Grid 详细教程\)](http://www.css88.com/archives/8510#prop-grid-template-areas)，如有侵权，将于联系后删除。_

## Summarize

终于写完了，个人觉得Grid布局更像是一种全局性质的布局方案，一些小的部件如果用的话反倒可能会像Table系的布局一样被限制住。

当然优点显而易见，比如让`grid-template-columns`和`grid-template-rows`使用百分比或视口单位，做响应式开发可谓是方便了太多。

以上、よろしく。
