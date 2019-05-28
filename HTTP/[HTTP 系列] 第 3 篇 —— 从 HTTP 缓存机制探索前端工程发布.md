# [HTTP 系列] 第 3 篇 —— 从 HTTP 缓存机制探索前端工程发布

> 这里是《写给前端工程师的 HTTP 系列》，记得有位大佬曾经说过：“大厂前端面试对 HTTP 的要求比 CSS 还要高”，由此可见 HTTP 的重要程度不可小视。文章写作计划如下，视情况可能有一定的删减，本篇是该系列的第 3 篇 —— 《深入理解 HTTP 的缓存机制》。

更多文章可关注我的 [interview 系列](https://github.com/YanceyOfficial/interview)。

## 写作计划

- [从 TCP/UDP 到 DNS 解析](https://github.com/YanceyOfficial/interview/blob/master/HTTP/%5BHTTP%20%E7%B3%BB%E5%88%97%5D%20%E7%AC%AC%201%20%E7%AF%87%20%E2%80%94%E2%80%94%20%E4%BB%8E%20TCP%20UDP%20%E5%88%B0%20DNS%20%E8%A7%A3%E6%9E%90.md)

- [HTTP 协议那些事](https://github.com/YanceyOfficial/interview/blob/master/HTTP/%5BHTTP%20%E7%B3%BB%E5%88%97%5D%20%E7%AC%AC%202%20%E7%AF%87%20%E2%80%94%E2%80%94%20HTTP%20%E5%8D%8F%E8%AE%AE%E9%82%A3%E4%BA%9B%E4%BA%8B.md)

- [从 HTTP 缓存机制探索前端工程发布](https://github.com/YanceyOfficial/interview/blob/master/HTTP/%5BHTTP%20%E7%B3%BB%E5%88%97%5D%20%E7%AC%AC%203%20%E7%AF%87%20%E2%80%94%E2%80%94%20%E6%B7%B1%E5%85%A5%E7%90%86%E8%A7%A3%20HTTP%20%E7%9A%84%E7%BC%93%E5%AD%98%E6%9C%BA%E5%88%B6.md)

- HTTPS / SPDY / HTTP/2 / Websocket

- JWT

- 网络安全

- 跨域

- 浏览器原理

- 终章：从输入 url 到页面呈现发生了什么

## 静态资源和动态资源

在谈 HTTP 的缓存机制之前，我们先区分一下静态资源和动态资源。

### 静态资源

静态资源是那种 `永远` 不会被修改的内容，比如 JS 文件、CSS 文件以及其他二进制文件 (图片、音频文件等)。

为什么说是 `永远` 呢？举个例子，当你修改了一张图片的尺寸，那么这张新生成的图片和旧图片就不再属于一个资源了。因此，我们通过 [数据摘要算法](https://en.wikipedia.org/wiki/MD5) 给静态文件生成一个独一无二的 hash 值来标识一个静态文件。

下面是一张图片的响应头，我们来简单复习一下。

![Jietu20190507-164837@2x.jpg](https://yancey-assets.oss-cn-beijing.aliyuncs.com/Jietu20190507-164837%402x.jpg)

- Accept-Ranges: 该字段告知客户端，服务器是否能处理范围请求，当可以处理时其值为 `bytes`，否则为 `none`。

- Connection: 该字段决定当前的事务完成后，是否会关闭网络连接。如果该值是 `keep-alive`，网络连接就是持久的，不会关闭，使得对同一个服务器的请求可以继续在该连接上完成。此外它还可以控制不再转发给代理的首部字段。

- Content-Length: 该字段表明实体主体的大小，单位是字节。

- Content-MD5: 该字段用于检查报文主体在传输过程中是否保持完整性，以及确认传输到达。服务端对报文主体执行 MD5 算法，获取一个 128 位的二进制数，再通过 base64 编码后将结果写入 Content-MD5 字段值。因为 HTTP 首部无法记录二进制值，因此需要通过 Base64 进行处理。客户端在接收到响应后再对报文主体执行一次相同的 MD5 算法。将计算值于该字段值比较，即可判断出报文主体的准确性。

- Content-Type: 报文主体的格式。

- Date: 表示创建报文的日期和时间。

- ETag: 该值是将资源以字符串的形式作唯一标识，服务器给每份资源分配对应的 ETag 值。当资源更新时，ETag 值也会更新。ETag 有 `强 ETag` 和 `弱 ETag` 之分，前者一般用于静态文件，后者的字段值起始会有 `W` 标志。

- Last-Modified: 该字段为服务器认定的资源做出修改的日期及时间，它的精度比 ETag 要低，也就是如果响应头中同时包含 ETag 和 Last-Modified 时，会以 ETag 为准。

### 动态资源

## 缓存分类

HTTP 缓存分为 `强缓存` 和 `协商缓存`。

### 强缓存

强缓存通过响应头中的 `Cache-Control` 和 `Expires` 控制的。如果两者都存在，且 `Cache-Control` 设置了 max-age 或者 s-max-age 指令，那么 `Expires` 头会被忽略。

两个字段的效果相似，都是告知客户端对比本地时间和服务器返回的生存时间来检测缓存是否可用，如果缓存没有超过它的生存时间，响应的副本会一直被保存。当超过指定的时间后，缓存服务器在请求发送过来时，转向源服务器请求资源。

#### Cache-Control

请求头中的 Cache-Control 可以有以下字段值：

| 指令             | 指令值 | 说明                                                                                                                                              |
| ---------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| max-age=[秒]     | 必填   | 设置缓存存储的最大周期，超过这个时间缓存被认为过期，该指令优先级高于 `Expires`，并且它传递的是一个相对时间，而 `Expires` 传递的是一个未来的时间。 |
| max-stale(=[秒]) | 选填   | 在这个已过期的时间段之内，客户端愿意接收一个已经过期的资源                                                                                        |
| min-fresh=[秒]   | 必填   | 表示客户端希望在指定的时间内获取最新的响应。                                                                                                      |
| no-cache         | 选填   | 表示客户端不会接收缓存过的响应，并且强制代理服务器将把客户端的请求转发给源服务器。                                                                |
| no-store         | 无     | 不缓存请求或响应中的任何内容。                                                                                                                    |
| no-transform     | 无     | 代理服务器不得对资源进行转换或转变，比如 Content-Encoding, Content-Range, Content-Type 等字段信息。                                               |
| only-if-cached   | 无     | 客户端只接受已缓存的响应，并且不要向原始服务器检查是否有更新的拷贝，若没有命中缓存，则返回 504 状态码 (Gateway Timeout)。                                                    |

## 缓存机制

![缓存机制](https://yancey-assets.oss-cn-beijing.aliyuncs.com/6.jpg)

## 参考

《图解 HTTP》 -- 上野 宣

[HTTP 协议知识点总结](https://ddduanlian.github.io/2018/06/22/http_note/)

[【前端词典】从输入 URL 到展现涉及哪些缓存环节(非常详细)](https://juejin.im/post/5c6e77da6fb9a049db73bb07)
