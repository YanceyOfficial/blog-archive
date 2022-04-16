# Natsuha - 用 Taro 写个天气微信小程序

![logo](https://edge.yancey.app/beg/917824-weather-wallpaper.jpg)

> 去年年底 o2 开源了 Taro，一直手痒痒没去玩。考虑到 wx 的审核制度，所以决定写个工具类小程序。赶在 Taro 喜提第 2000 个 issues 之际 😂，Natsuha 终于上线了 🥳。源码全部释出（除涉及私钥部分，GitHub 有说明），文章后面会贴出一些仍需优化的点，欢迎大家一起讨论。

## 前言

[源码看这里](https://github.com/YanceyOfficial/Natsuha-Weather)

![Scan the QR Code by WeChat](https://edge.yancey.app/beg/natsuha_344.jpg)

![效果图](https://edge.yancey.app/beg/barcelona.jpg)

项目的技术栈是 `Taro + mobx + TypeScript`，接口来自 [Yahoo Weather API](https://developer.yahoo.com/weather/documentation.html)，当然设计也是参 (chao) 考 (xi) 的 [Yahoo Weather](https://www.yahoo.com/news/weather/china/beijing/beijing-2151330)

## 功能

- 下拉刷新
- 华氏温度、摄氏温度切换
- 分时展示一天的天气预报
- 展示未来 10 天的天气预报
- 展示当前风向、风速
- 展示日出日落、月相等信息
- 展示一天内的降水预报
- 城市天气检索

## TODO

- 国际化
- 性能优化
- 图片加载优化
- Jest 搞起来（初始化已搭好）
- Travis CI 搞起来（初始化已搭好）
- 将搜索模块放到一个新页面（强行加个路由 😂）

## 踩坑

### 小程序篇

#### 云开发解决 Bei An 问题

由于众所周知的原因，wx 小程序无法调用未 **bei an** 的接口，哪怕是在开发环境。所以我们用[云开发](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)的**云函数**来 “反代” 接口，下面通过一个例子说一下技术要点。

首先在根目录的 `project.config.json` 文件里添加 `"cloudfunctionRoot": "functions/"`，然后在根目录创建文件夹 `functions`. 并点击右键创建一个新的云函数，比如我们叫 `getRegion`。

![云函数开发](https://edge.yancey.app/beg/Jietu20190309-114128%402x.jpg)

因为我们的目标是**通过云函数请求一个未 bei an 的接口**，所以为了更方便的处理异步请求，我们引入 `request-promise` 这个库。

通过`硬盘打开`进入到这个云函数的文件夹，然后安装依赖：

```
yarn add request request-promise

```

接下来我们在 `index.js` 中写逻辑，直接上代码。云函数通过 `event` 对象来获取前端传过来的参数，然后通过 Promise 对象将结果返回。这个例子中我们需要拿到`region`，

```
// 云函数入口文件
const cloud = require('wx-server-sdk')
const rp = require('request-promise')

cloud.init()

exports.main = async (event, context) => {
  const region = event.region;
  const res = await rp({
    method: 'get',
    uri: `https://www.yahoo.com/news/_tdnews/api/resource/WeatherSearch;text=${region}`,
    json: true
  }).then((body) => {
    return {
      regionList: body
    }
  }).catch(err => {
    return err;
  })
  return res;
}

```

接下来是前端发请求了，注意这里不能再用 `Taro.request()`, 而是云函数独有的 `wx.cloud.callFunction()`, 因为我现在的 Taro 版本尚未实现 `Taro.cloud.callFunction()`，所以直接用 `wx` 打头即可。

首先封装一下 `wx.cloud.callFunction()`，其实感觉什么卵用 🤪：

```
export const httpClient = (url: string, data: any) => new Promise((resolve, reject): void => {
  wx.cloud.callFunction({
    name: url,
    data,
  }).then(res => {
    resolve(res.result);
  }).catch(e => {
    reject(e)
  });
});

```

然后我们在 store 里面写逻辑，这样基本上就解决了数据请求的坑。

```
  public getRegion = (text: string) => {
    httpClient('getRegion', {
        region: encodeURI(text),
      })
      .then((res: any) => {
        runInAction(() => {
          if (res.regionList) {
            this.regionList = res.regionList;
          }
        });
      })
      .catch(() => {
        setToast(toastTxt.cityFail);
      });
  };

```

🔔 题外话：因为当前版本尚未实现 `Taro.cloud.callFunction()`，所以 lint 会报错，虽然不影响使用，大家有什么好的方法，可以说一下。

#### 地理信息授权问题

在这个项目里，我们需要通过小程序拿到的**经纬度**来反查城市信息，而小程序获取**经纬度**需要用户授权。这里有个坑，**当用户拒绝授权后，小程序默认询问授权的 dialog 在一段时间内不会重复弹出**，所以我们必须手动将用户引导到授权页面。

以前小程序有个接口叫做 `wx.openSetting()`，但 tx 把它废掉了，现在只能让用户点击一个特定的按钮。

为此我做了一个 modal，这里贴出关键代码。

```
<Button openType='openSetting' onOpenSetting={() => this.onOpenSetting()}>
  OK
</Button>

```

首先我们必须给按钮声明 `openType='openSetting'`，这样当用户点击了之后就会跳转到设置页面。

其次，我们需要在用户**离开**授权页面时，也就是点击了左上角那个返回按钮时，再次去检查一下用户的授权情况。所以我们要添加
`onOpenSetting={() => this.onOpenSetting()`，不得不吐槽这个事件命名，明明应该叫做 `onLeaveSetting`才合理。

在 `onOpenSetting()` 方法中我们再次执行**判断用户是否授权**的方法，未授权的话接着弹 modal，否则放行请求相应的数据接口。

文字有些累，直接看图。

![授权图解](https://edge.yancey.app/beg/%E6%9C%AA%E5%91%BD%E5%90%8D_meitu_1.jpg)

#### 无法用传统方式清空文本框文字

当用户关闭`搜索` dialog 时，文本框的文字应当被清空，所以一开始写成了这样。本计划在 d 点击关闭按钮时触发 hideSearchDialog(), 里面将 `inputValue = ''` 完事，发现不行。

```
<Input
  type='text'
  value={inputValue}
  placeholder='Enter City or ZIP code'
  onInput={e => handleInputTextChange(e)}
/>

<Button onClick={() => hideSearchDialog()}>Close</Button>

```

查了一下官方文档，必须将 `Input` 和 `Button` 包裹在一个 `Form` 下，且要给关闭按钮加上 `formType='reset'`，最后给 `Form` 添加 `onReset` 事件指向关闭 dialog 的方法。

```
<Form onReset={() => hideSearchDialog()}>
  <Input
    className={styles.input}
    type='text'
    placeholder='Enter City or ZIP code'
    onInput={e => handleInputTextChange(e)}
  />
  <Button formType='reset'>Close</Button>
</Form>;

```

### Taro 篇

大多是编译问题和它 webpack 配的问题，相应的我都提了 issue，有兴趣的话可以跟进。

#### Taro 编译会忽略模版两个之间的空格

举个例子，`<Text>day - night</Text>`，可以正常编译，页面可以正常看到 `day - night`，但是假如是变量，就会被编译成 `day- night`，注意，空格被吃掉了。

```
const day = 'day'
const night = 'night'

<Text>{day} - {night}</Text>

```

我提了个 issue [#2261](https://github.com/NervJS/taro/issues/2261)，然并没人鸟我，有兴趣可以跟进一下。

#### ts 不能识别`wx`

因为用到了云开发，而 Taro 现阶段还没有`Taro.cloud(...)`,所以在使用原生的`wx.cloud(...)`时,
ts 肯定会报错。

#### css module 等静态文件 找不到路径

一开始用的`import`来引入静态文件，但报“找不到路径”，可以看下图（但不影响使用）。提了个 issue [#2213](https://github.com/NervJS/taro/issues/2213),
按照大佬的回复修改也没解决问题，实在受不了一片红，索性改成了`commonJS`.

![找不到模块](https://edge.yancey.app/beg/Jietu20190219-142504@2x.jpg)

## Problem

下面是项目中存在的一些问题，有兴趣的话欢迎大家一起讨论。

### 图片加载不友好

接口图片的 url 来自`aws`，因为众所周知的原因，图片经常会挂掉，
所以有必要在图片挂掉的时候触发`onError`事件，然后给用户一个提示。

因为小程序不支持`new Image()`，所以只能用官方提供的`Image`组件，幸好这个
组件支持`onLoad`和`onError`事件。

加载失败的问题解决了，但因为`aws`的速度太慢，所以正常加载时也很不友好（可以自行体会）

做了一些尝试，比如先加载缩略图，再展示完整图片，但接口提供的最小尺寸的图片也已经达到了
70 多 k，并且该死的 Yahoo 恰好将图片 url 控制大小的那段用了加密，所以这个方式 pass 掉了。

### 搜索输入框加个节流

现在的做法是在 store 的 构造器加个节流，但不知道这样合不合理。

```
  construtor() {
    this.getRegion = _.debounce(this.getRegion, 150);
  }

```

## 最后

![老子再也不写小程序了！](https://edge.yancey.app/beg/FD200112FC037CDE3AC366B45288EA61.jpg)
