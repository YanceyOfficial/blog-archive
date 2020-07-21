# WebP 全方位能力检测

> WebP 作为当今性价比最高的图片格式之一, 广泛应用于 Web 应用, 无论是电商网站还是图片流网站, 都能看到它的身影. 但它仍不被某些浏览器所支持, 这篇文章通过三种方案, 帮你全方位扫清 WebP 能力检测.

## 什么是 WebP

WebP 是 Google 开发一种同时采用有损和无损压缩的图像格式,于 2010 年 9 月 30 日首次发布, 可用于网页上大量摄影, 半透明和图形图像. WebP 有损压缩的程度是可调的, 因此用户可以在文件大小和图像质量之间自由权衡. WebP 通常平均比 JPEG 和 JPEG 2000 多压缩 30%, 而且不会损失图像质量. 关于 WebP 格式的压缩实验, 可参考 [WebP 相对于 PNG、JPG 有什么优势？ - Hahn 的回答 - 知乎](https://www.zhihu.com/question/27201061/answer/35637827) 的回答, 这篇文章不做赘述.

WebP 除了有损和无损形式, 它还支持 Alpha 通道(图像可能具有透明度), 也支持 Animation(即动图, 可类比 GIF). 目前 Youtube 在支持 WebP 格式的浏览器中, 将**视频预览**的图像格式全部转换为 WebP; 而不支持 WebP 的浏览器如 Safari, Youtube 干脆就取消了**视频预览**的特性.

![Youtube 预览使用 WebP 格式](https://static.yancey.app/Jietu20200721-135252.jpg)

WebP 已诞生 10 年之久, 并且对于图片性能的提升肉眼可见, 但部分浏览器仍不支持. 下面是 [caniuse](https://caniuse.com/#search=WebP) 给出的数据, 可见 ~~IE~~ 和苹果系的浏览器仍不支持, 这里可能是一些技术原因, 但更多是商业因素. 因此这篇文章教你 360° 无死角 WebP 的能力检测.

![Can I use WebP?](https://static.yancey.app/Jietu20200720-202312.jpg)

## 方案一

方案一通过 JavaScript 脚本进行检测, 这里用到了 [Modernizr](https://modernizr.com/), 该库提供了大量浏览器能力检测的脚本. 我已经把 WebP 能力检测的脚本放到了 gist, 你可访问 [WebP 能力检测.js](https://gist.github.com/YanceyOfficial/5951b17d7a64906248ecb7a8074791c1) 下载.

在浏览器中执行这段脚本, 最新版的 Chrome 浏览器给 html 标签增加了 `webp`, `webp-alpha`, `webp-aniamtion`, `webp-lossless` 的类; 而 Safari 浏览器增加了 `no-webp` 的类, 因此我们在 css 中, 只要写出形如下的代码就可以了.

![支持 WebP](https://static.yancey.app/Jietu20200721-112534.jpg)

![不支持 WebP](https://static.yancey.app/Jietu20200721-112156.jpg)

```css
.no-webp .cover {
  background-image: url("image.jpg");
}

.webp .cover {
  background-image: url("image.webp");
}
```

当然如果用到 img 标签上, 你还可以这么写.

```jsx
const [supportWebP, setSupportWebP] = useState(
  document.documentElement.classList.contains("webp")
);

return <img src={supportWebP ? "image.webp" : "image.jpg"} alt="img" />;
```

Modernizr 给出的脚本做了较多的兼容, minify 后也有 1.2kb 的大小, 下面这段代码比较精简, 根据实际情况可以考虑使用. 它返回一个 Boolean 类型, 你可以把结果存到 Store 或者 LocalStorage 中, 也可以跟 Modernizr 一样, 给 html 的 class 增加一个 webp 标识. 这段代码收集到了我的工具集 [yancey-js-util](https://www.npmjs.com/package/yancey-js-util), 有兴趣也可使用 `yarn add yancey-js-util` 安装使用.

```ts
export const checkWebp = () => {
  return (
    document
      .createElement("canvas")
      .toDataURL("image/webp")
      .indexOf("data:image/webp") === 0
  );
};
```

## 方案二

第二种方式是使用 HTML5 新增的 **picture** 标签. 与 **audio**, **video** 标签类似, 它们都可以包含 **source** 标签, 用于让浏览器自行选择最优的格式来呈现. 这种方案无需 js 代码, 性能会更好一些, 但它的缺点显而易见, 即无法应用于 css 的 background-image.

```html
<picture>
  <source srcset="img/image.webp" type="image/webp" />
  <source srcset="img/image.jpg" type="image/jpeg" />
  <img src="img/image.jpg" alt="img" />
</picture>
```

## 方案三

方案一可以应用于 **backgroud-image** 和 **img** 标签两种场景, 似乎是一种万全之策, 但它毕竟依托于 JavaScript. 如果用户阻止浏览器使用 JS 脚本, 或者说在 SSR 服务端渲染阶段(因为这些检测脚本涉及到了 DOM 操作, 而服务端是无法操作 DOM 的), 方案一就不 ok 了.

第一种情况比较极端, 我们可以一开始就给 html 标记上 `no-js` 的 class, 当 DOM 加载完成后执行如下脚本, 如果 no-js 被移除了, 那证明 JS 没有被阻止; 否则降级处理, 代码如下所示.

```html
<style>
  .no-js .elementWithBackgroundImage {
    background-image: url("image.jpg");
  }
</style>

<script>
  document.documentElement.classList.remove("no-js");
</script>
```

对于 SSR 场景下, 方案二可保证所有的 img 标签都能展示最优结果, 但对于 background-image 就无能为力了. 这种情况下, 我们依然可以借助后端之力. 在 HTTP 请求头中的 accept 字段中, 我们发现了 `image/webp` 的字样, 后端接收到这个请求, 只要判断存在 `image/webp`, 就证明该浏览器支持 WebP 格式, 后端将**你的浏览器支持 WebP** 再告诉给前端, 那这个问题就迎刃而解了.

![HTTP 请求头中记录浏览器是否支持 WebP](https://static.yancey.app/Jietu20200721-153247.jpg)

下面这段代码是[我的博客](https://yanceyleo.com)中的真实案例, 项目使用了 [Next.js](https://nextjs.org) 做服务端渲染, 通过 `getServerSideProps` 方法将 `isSupportWebp` 返回给前端, 进而前端判断是否有能力展示 WebP 格式的图片.

```tsx
import React, { FC } from "react";
import { GetServerSidePropsContext } from "next";
import Layout from "src/containers/Layout/Layout";
import HomeContainer from "src/containers/Home/Home";

interface Props {
  isSupportWebp: boolean;
}

// 前端以 props 的形式获取该浏览器是否支持 WebP
const Index: FC<Props> = ({ isSupportWebp }) => {
  return (
    <Layout>
      <HomeContainer isSupportWebp={isSupportWebp} />
    </Layout>
  );
};

// 后端判断该浏览器是否支持 WebP
export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  return {
    props: {
      isSupportWebp: ctx.req.headers.accept?.includes("image/webp"),
    },
  };
};

export default Index;
```

## 小结

Emmmm, 没啥可小结的, 还是希望各位浏览器大大们早日统一吧.

## 参考

- [Using WebP Images](https://css-tricks.com/using-webp-images/)

- [WebP 相对于 PNG、JPG 有什么优势？](https://www.zhihu.com/question/27201061)

- [探究 WebP 一些事儿](https://aotu.io/notes/2016/06/23/explore-something-of-webp/index.html)
