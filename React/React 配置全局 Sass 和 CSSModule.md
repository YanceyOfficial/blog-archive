# React 配置全局 Sass 和 CSS Module

![logo](https://edge.yancey.app/beg/Cover.93953ad376e749309a483c8b11b40106.jpg)

> 接下来的业余时间要做个人博客 Wap 端，这次打算尝试一下 TypeScript、持续集成、自动化等以前没有实践过的技术栈...当然大前提还是要把架子搭好，上次记录了一下 Vue 配置全局 Sass 变量的方法，这次把 React 的配置方法记录一下，显然比 Vue-cli 麻烦了一些。

## 前提

一开始本来打算用微软的[TypeScript-React-Starter](https://github.com/Microsoft/TypeScript-React-Starter)来创建脚手架，正好省了初始化`TypeScript`那一套，但是这个 CLI 貌似对`CSS Mudule`配置不是支持得很好，看了社区一些 hack 方法感觉也不太好用。遂还是用`create-react-app`创建一个 React 工程，然后把`TypeScript-React-Starter`的配置拷了过来。

以前用`React-app-rewired`去给 webpack 添加配置，但总有种隔靴搔痒的感觉，这次决定`yarn eject`这个工程。

在`src`目录下创建`assets`文件夹，然后在`assets`文件夹里创建一个`styles`文件夹，添加一个 sass 文件叫`_color.scss`，里面先简单加几个颜色变量，以备测试：

```scss
$white: #fff;
$black: #000;
$gray: #666;
```

下面先说怎么做 CSS Module，然后再往全局 Sass 迁移。

## CSS Module

### 安装配置

首先安装依赖:

```js
yarn add node-sass
```

使用`create-react-app`默认会创建一个`App.js`和`App.css`，我们需要将`App.css`**重命名为**`App.module.css`，

**这点非常关键，只要想做`CSS Module`，css 文件必须要改成`*.module.css`的形式。**

然后打开`App.js`文件，引入`App.module.css`，可以发现引入 css 的方式也和以前不一样了，下面的`styles`名字随便起，看你个人喜好了：

```js
import styles from "./App.module.css";
```

这里我建议在 class 命名的时候，要以下划线的形式连接每个单词，比如`App_common_logo`，这也是[鹅厂 aotu 实验室推荐的的命名方式](https://guide.aotu.io/docs/name/classname.html)，其实这样对使用 CSS Module 也有好处，一会儿会说到。

![CSS Module使用图例](https://edge.yancey.app/beg/Jietu20181201-212344%402x.jpg)

### 使用方法

关于使用方法，这里直接上图吧，实际上就是把以前的`className="App_intro"`变成了`className={styles.App_intro}`。

我们回到上面 class 命名那个话题，如果你的类名叫做`App-intro`，那你就得写成`className={styles['App-intro']}`，写多了项目也不清晰了。

我们再看一下 Dev Tool 的渲染情况：

![渲染出来的类名](https://edge.yancey.app/beg/Jietu20181201-213207.jpg)

这是 Webpack 的默认配置，默认就是`模块名_类名__5位hash`，好处一目了然，不会用重复的 class 了，我个人决定在开发环境直接使用 Webpack 的默认配置，在生产环境再做一些改变，打开`config/webpack.config.prod.js`文件，搜索关键字`getLocalIndent`，我个人打算 build 之后的类名直接是`6位hash`，所以配置如下图：

![修改Webpack配置](https://edge.yancey.app/beg/Jietu20181201-214147%402x.jpg)

### 题外话

在使用 CSS Module 的过程中相信你一定会遇到其他的问题，比如一个标签如果有多个 class，以前可以写成`className="App_icon App_select"`，但是 CSS Module 是不允许的，所以需要安装依赖`yarn add classnames`，使用方式如下：

```js
import cs from 'classnames';

className={cs(styles.social_media_motto, styles.no_user_select)}
```

此外，如果你的模块里不得不操作 DOM，如果继续用`className={styles.App_intro}`的方式，`document.querySelector('.App_intro')`将不会如你所愿，因为此时的 App_intro 已经被被 hash 所“污染，因此你还是需要命名为`className="App_intro"这种形式`。

但是新的问题来了，你在`App.mudule.css`中给`App_intro`定义的任何样式将不会起作用，所以需要在 css 里做写文章：

```scss
:global(.App_intro) {
  outline: none;
  border-radius: 50%;
}
```

## Sass 全局变量、函数、Mixin

如果定义了一个关于颜色变量的 Sass 文件，按以前的做法，那就得在每个模块的 Sass 文件中`@import '../assets/styles/_color.scss'`，显然这种方式很不(e)科(xin)学。尤其在写移动端的时候，肯定得定义一些全局的函数，要是每个文件都要引一次，天啦噜...

首先安装依赖`yarn add sass-resources-loader --dev`，然后打开`config/webpack.config.dev.js`，注意是开发环境的 Webpack 配置文件。

检索关键词`sass-loader`，看下图：

![配置全局Sass](https://edge.yancey.app/beg/Jietu20181201-221430.jpg)

下面把代码贴出来，注意一定是`../src/assets/styles/_colors.scss'`，网上教程坑得一逼，全给写成`./src/assets/styles/_colors.scss'`，结果一直报错。

```js
use: [{
  loader: require.resolve('style-loader'),
},
{
  loader: require.resolve('css-loader'),
  options: {
    importLoaders: 2
  },
},
{
  loader: require.resolve('sass-loader'),
},
{
  loader: require.resolve('sass-resources-loader'),
  options: {
    resources: [path.resolve(__dirname, '../src/assets/styles/_colors.scss'), path.resolve(__dirname, '../src/assets/styles/_function.scss')],
  }
}],
```

因为我们做了 CSS Module，所以我们也要为 CSS Module 支持引入全局 Sass 变量。

![为CSS Module配置全局Sass](https://edge.yancey.app/beg/Jietu20181201-222133%402x.jpg)

这时我们将上面的`App.mudule.css`重命名为`App.mudule.scss`，然后随便找个 class 添加个颜色，发现生效了：

```scss
.App_header {
  display: flex;
  align-items: center;
  justify-content: center;
  color: $gray;
}
```

## 最后

在前几个月写 PC 端的博客前台时，已经用上了 CSS Module，但没去考虑全局 Sass 变量，这次也算是一次温故和知新吧。计划 Wap 端会用上 TypeScript，同构个 PWA 什么的，然后尝试用 Trvis 做持续集成和自动化部署，任重道远啊。

明天又要苦逼的加班去了，日了。

以上、よろしく。
