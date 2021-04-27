# [HTTP 系列] 第 2 篇 —— HTTP 协议那些事

> 这里是《写给前端工程师的 HTTP 系列》，记得有位大佬曾经说过：“大厂前端面试对 HTTP 的要求比 CSS 还要高”，由此可见 HTTP 的重要程度不可小视。文章写作计划如下，视情况可能有一定的删减，本篇是该系列的第 2 篇 —— 《HTTP 协议那些事》。这篇文章会涉及到 HTTP 协议，cookie 和 session，HTTP 首部/方法/状态码等。

更多文章可关注我的 [interview 系列](https://github.com/YanceyOfficial/interview)。

## 写作计划

- [从 TCP/UDP 到 DNS 解析](https://github.com/YanceyOfficial/interview/blob/master/HTTP%26Browser/%5BHTTP%20%E7%B3%BB%E5%88%97%5D%20%E7%AC%AC%201%20%E7%AF%87%20%E2%80%94%E2%80%94%20%E4%BB%8E%20TCP%20UDP%20%E5%88%B0%20DNS%20%E8%A7%A3%E6%9E%90.md)

- [HTTP 协议那些事](https://github.com/YanceyOfficial/interview/blob/master/HTTP%26Browser/%5BHTTP%20%E7%B3%BB%E5%88%97%5D%20%E7%AC%AC%202%20%E7%AF%87%20%E2%80%94%E2%80%94%20HTTP%20%E5%8D%8F%E8%AE%AE%E9%82%A3%E4%BA%9B%E4%BA%8B.md)

- [从 HTTP 缓存机制探索前端工程发布](https://github.com/YanceyOfficial/interview/blob/master/HTTP/%5BHTTP%20%E7%B3%BB%E5%88%97%5D%20%E7%AC%AC%203%20%E7%AF%87%20%E2%80%94%E2%80%94%20%E6%B7%B1%E5%85%A5%E7%90%86%E8%A7%A3%20HTTP%20%E7%9A%84%E7%BC%93%E5%AD%98%E6%9C%BA%E5%88%B6.md)

- HTTPS / SPDY / HTTP/2 / Websocket

- JWT

- 网络安全

- 跨域

- 浏览器原理

- 终章：从输入 url 到页面呈现发生了什么

## HTTP 协议

超文本传输协议（HyperText Transfer Protocol）是基于 TCP/IP 协议，用于分布式、协作式和超媒体信息系统的应用层协议。HTTP 是万维网的数据通信的基础，它是 `无状态` 的协议，默认端口为 80。HTTP 在 TCP 的基础上，规定了 Request-Response 的模式，这个模式决定了通讯必定由浏览器首先发起。

抛去一些复杂的层面，浏览器开发者只需要一个 TCP 库就可以搞定浏览器的网络通讯部分。我们可以用 `telnet` 来做个实验。

首先连接到 `yanceyleo.com` 的主机。

```http
telnet yanceyleo.com 80
```

此时，三次握手完成，TCP 连接已经建立。输入下面内容，并 **双击回车**，就可以得到服务端响应的内容。下面的报文中，第一行的开头 `GET` 为请求访问服务器的类型，称为 `方法 (method)`；后面的 `/` 指明了请求访问的资源对象，也叫做请求 URI (request-URI)；最后为 HTTP 版本号，用来表示客户端使用的 HTTP 版本。第二行则是请求的主机名。

```http
GET / HTTP/1.1
Host: yanceyleo.com
```

![telnet 下的请求和响应](https://static.yancey.app/Jietu20190428-191318%402x.jpg)

### HTTP 是无连接、无状态协议

HTTP 是无状态 (stateless) 协议，它不会对请求和响应之间通信状态进行保存，也就是说 HTTP 协议不会对发送过的请求或响应做持久化处理。使用 HTTP 协议，每当有新的请求发送时，就会有对应的新响应产生。协议本身并不保留之前一切的请求或响应报文信息。这是为了更快地处理大量事务，确保协议的可伸缩性。

- 无连接

  每次连接只处理一个请求，服务端处理完客户端一次请求，等到客户端作出回应之后便断开连接。

- 无状态

  是指服务端对于客户端每次发送的请求都认为它是一个新的请求，上一次会话和下一次会话没有联系。

## cookie

### cookie 原理

何为 cookie 呢？我们在上面了解到 HTTP 是无状态的，但随着 Web 的不断发展，这种 **无状态** 的特性出现了弊端。当你登录到一家购物网站，在跳转到该站的其他页面时也应该继续保持登录状态。但是因为 HTTP 是无状态的，所以必须得在浏览器端存储一些信息来标识当前用户，因此 cookie 应运而生，它一种浏览器管理状态的文件。

![cookie 原理](https://static.yancey.app/07ecb36c4820a66de90013f303cac8c0.jpg)

浏览器第一次发出请求，服务器会将 cookie 放入到响应请求中，在浏览器第二次发请求的时候，会把 cookie 带过去，于是服务端就会辨别用户身份。注意：单个 cookie 保存的数据不能超过 4K，很多浏览器都限制一个站点最多保存 20 个 cookie。

cookie 在请求头中有一个 `cookie` 字段，在响应头里有一个 `set-cookie` 字段。

### cookie 是不可跨域的

cookie 本身就是用来保存一些隐私性的字段，基于安全性的考量，必须要保证它是 **不可跨域的**。我们可以做个实验：先打开 `https://google.com`，然后在开发者工具中输入以下代码：

```js
document.cookie = 'hello=world;path=/;domain=.baidu.com';

document.cookie = 'world=hello;path=/;domain=.google.com';
```

打开 Application 选项卡，在侧边栏找到 Cookies，可以发现只有 domain 为 `.google.com` 的被成功添加。

![cookie 是不可跨域的](https://static.yancey.app/Jietu20190429-123624.jpg)

### cookie 的属性

我们通过一个登录的小例子来了解服务端设置 cookie。首先通过 express application generator 生成一个 Express 工程。**本示例的源码请访问 [express-cookies](https://github.com/YanceyOfficial/express-cookies)。**

接着在 index.html 文件中输入以下代码，我们创建一个输入用户名和密码的界面，在点击按钮的时候，通过 fetch 将输入的值发送给后端。

```html
<fieldset>
  <legend>Login</legend>
  <input id="userName" type="text" placeholder="请输入用户名" />
  <input id="userPwd" type="password" placeholder="请输入密码" />
  <button id="loginBtn">登录</button>
</fieldset>

<p>登录状态: <span id="result"></span></p>
<script>
  const userName = document.getElementById('userName');
  const userPwd = document.getElementById('userPwd');
  const loginBtn = document.getElementById('loginBtn');
  const result = document.getElementById('result');

  loginBtn.addEventListener('click', function() {
    const data = {
      userName: userName.value,
      userPwd: userPwd.value
    };

    fetch('/login', {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(data)
    })
      .then(res => {
        return res.json();
      })
      .then(json => {
        result.innerHTML = json.msg;
      });
  });
</script>
```

当用户名和密码匹配时 (假设用户名和密码都是 `yancey`)，返回给客户端一个 cookie 以及登录成功的 json；否则返回登录失败的 json。下面是模拟服务端登录的接口。

```js
router.post('/login', (req, res, next) => {
  const body = req.body;
  if (body.userName === 'yancey' && body.userPwd === 'yancey') {
    // 设置 cookie
    res.cookie('yancey', 'success');
    res.json({
      success: true,
      msg: '登录成功'
    });
  } else {
    res.status(401).json({
      success: false,
      msg: '用户名或密码错误'
    });
  }
});
```

通过这个例子可以看到，在 express 中，setCookie 的方式为：第一个参数传递 `name`，第二个参数传递 `value`，**注意浏览器会将元字符和语义字符之外的字符进行转义**。打开 Chrome 的开发者工具，就可以看到该 cookie 被添加到浏览器上了。或者你在控制台输入 `document.cookie`，同样可以看到 cookie 字符串。

这只是一个设置 cookie 的简单例子，cookie 有 7 种属性可供使用，我们一一来了解。

![cookie 的属性](https://static.yancey.app/2340002414-566cde733b2cd_articlex.png)

#### domain

该属性给 cookie 设置 `域名`，默认为当前网站的域名，下面的例子将 domain 设为 **yanceyleo.com**，由于前端页面是 `127.0.0.1`，根据同源策略，该条 cookie 不会生效。

```js
res.cookie('domain', 'domian', { domain: 'yanceyleo.com' });
```

#### expires / maxAge

这两个属性都是设置 cookie 的 `过期时间`。不同的是，`expires` 接收一个 Date 格式的时间，而 `maxAge` 接收一个 `毫秒时间戳`。因为后者更加直观和简便，所以建议使用 `maxAge`。

两个属性都可以传递一个 `负值` 或者 `0`，如果浏览器已存在同名 cookie，则会清除此 cookie，否则该条 cookie 不会被创建。

下面这个例子是创建一条 cookie，并将该 cookie 的过期时间设为一天后。

```js
res.cookie('expires', 'expires', {
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
});
```

![设置过期时间](https://static.yancey.app/Jietu20190430-095753.jpg)

接着给该条 cookie 设置一个 “负数”，那么这条 cookie 就被清除了。

```js
res.cookie('expires', 'expires', {
  expires: new Date(Date.now() - 8 * 60 * 60 * 1000)
});
```

maxAge 的用法同理，它直接传递一个 `过期时间` 的毫秒数即可。下面的例子是将该条 cookie 的过期时间设为 7 天后。

```js
res.cookie('maxAge', 'maxAge', {
  maxAge: 7 * 24 * 60 * 60 * 1000
});
```

那么不设置过期时间的 cookie 会怎样呢？当你关闭该网站的时候，这些没有被设置过期时间的 cookie 就死翘翘了 (这种情况的 cookie 就好像是 session)。

#### httpOnly

当该属性设为 true 时，`document.cookie` 将无法获取该条 cookie，但服务端可以照常获得。该属性可以有效的避免跨站脚本攻击 (XSS)。关于网络安全方面的话题，后面会专门写一篇文章去讲。

```js
res.cookie('httpOnly', 'httpOnly', {
  // 只能被 web server 访问到，也就是说在浏览器输入 document.cookie 无法取到该条 cookie，目的是防止 xss
  httpOnly: true
});
```

#### path

该属性给 `指定的路径` 添加此 cookie，默认为 `/`。如下代码就是给 `users` 这个路由设置 cookie (即便在服务端该路径不存在也会被添加上)。

```js
res.cookie('path', 'path', {
  path: '/users'
});
```

![path 属性](https://static.yancey.app/Jietu20190430-145804.jpg)

#### secure

只有当连接是 HTTPS 协议，该 cookie 才会被添加。该属性默认为 fasle。因为我本地的 express 是 HTTP 协议，因此该条 cookie 不会生效。

```js
res.cookie('secure', 'secure', {
  secure: true
});
```

#### signed (防篡改签名)

该属性是给浏览器发送一个加密的 cookie，该属性默认为 false。在 express 中，我们可以使用 `cookie-parser` 插件来创建一个加密后的 cookie。服务端通过该 cookie 的内容和签名来检验它是否 `被篡改`

首先给 `cookieParser` 传入一个 secret。

```js
app.use(cookieParser('forcabarca'));
```

然后返回一个 sign 后的 cookie。

```js
res.cookie('signed', 'signed', {
  signed: true
});
```

![sign 属性](https://static.yancey.app/Jietu20190430-160532.jpg)

在 express 中，我们可以使用 `req.cookies` 来获得 `未加密` 的 cookie 对象，可以通过 `req.signedCookies` 来获得 `已加密` 的 cookie 对象。

```js
console.log(req.cookies); // { httpOnly: 'httpOnly' }
console.log(req.signedCookies); // { signed: 'signed' }
```

### `document.cookie` 字符串转对象的函数

关于 cookie 就说这么多，最后附赠一个 `document.cookie` 字符串转对象的函数，如果你有更好的实现方式，请在下面留言。

```js
const formatCookie = cookies => {
  const o = {};
  cookies
    .split(';')
    .forEach(value => (o[value.split('=')[0]] = value.split('=')[1]));
  return o;
};
```

## session

session 是服务端使用的一种记录客户端状态的机制，与 cookie 不同的是，session 保存在 服务端。当客户端初次发送请求时 (比如登录成功)，服务端会将用户信息以某种形式保存在服务端，当再次访问时只需从该 session 中找到该客户的状态即可。

因此，cookie 机制就是通过检查客户身上的 “通行证” 来确定客户身份，而 session 则是通过检查服务器上的 “客户明细表” 来确认客户身份。session 相当于程序在服务器上建立的一份客户档案，客户来访的时候只需要查询客户档案表就可以了。

因为 HTTP 是无状态的，所以单纯的 session 仍不能判断是否为到底是哪个用户。因此服务端仍要向客户端发送一个 maxAge 为 `-1` 的 cookie 来作为不同用户的唯一标识。

当然你也可以不使用 cookie，你可以通过重写 URL 地址的方式来实现。它的原理是将用户的 seesion id 写入到 URL 中，当浏览器解析新的 URL 时就可以定位到是哪位用户。

万变不离其宗，两种方式都是要保证用户信息以某种形式保存到客户端。更先进的 localStorage，sessionStorage，IndexedDB 也是同样的道理，这里不去细说。

## HTTP 报文

用于 HTTP 协议交互的信息被称为 HTTP 报文。客户端的报文叫做请求报文，服务端的报文叫做响应报文。HTTP 报文本身是有多行数据构成的字符串文本。

### 报文格式

![160c90cb78e72587.jpg](https://static.yancey.app/160c90cb78e72587.jpg)

上面这张图清晰地展示了请求报文和响应报文的格式，用文字描述大致如下。

> CR (Carriage Return，回车符：16 进制 0x0d)
>
> LF (Line Feed，换行符：16 进制 0x0a)

```xml
<!--请求报文-->
<method>空格<request-url>空格<version>
<headers>
空行 (CR + LF)
<entity-body>

<!--响应报文-->
<version>空格<status>空格<reason-phrase>
<headers>
空行 (CR + LF)
<entity-body>
```

### 压缩报文

HTTP 协议中有一种被称为 `内容编码` 的功能，可以有效的压缩报文的体积。内容编码指明应用在实体内容上的编码格式，并保持实体信息原样压缩。内容编码后的实体由客户端接收并负责解码。常见的内容编码有以下几种：

- identity (不做压缩)

- compress (UNIX 系统的标准压缩)

- gzip (GNU zip, 最常见)

- deflate (zlib)

- brotli (Google 出品，必属精品。比 gzip 的压缩率还要高 37%+，我的网站已使用 brotli，看下图)

![压缩报文](https://static.yancey.app/Jietu20190501-212843.jpg)

### 分割发送的分块传输编码

从 HTTP 请求回来，就产生了流式的数据，后续的 DOM 树构建、CSS 计算、渲染、合成、绘制，都是尽可能地流式处理前一步的产出：即不需要等到上一步骤完全结束，就开始处理上一步的输出，这样我们在浏览网页时，才会看到逐步出现的页面。

本质上来说，在 HTTP 通信过程中，请求的编码实体资源尚未全部传输完成之前，浏览器无法显示请求页面。在传输大容量数据时，通过把数据分割成多块，能让浏览器逐步显示页面。这种把实体主体分块的功能称为分块传输编码 (Chunked Transfer Code)。

分块传输编码会将实体主体分为多个块，每个块都会使用十六进制来标记大小，而实体主体的最后一块会使用 `0 (CR+LF)` 来标记。使用分块传输编码的实体主体会由接收的客户端负责解码，恢复到编码前的实体主体。

## HTTP 报文首部

上面的章节我们说到了 HTTP 的报文，它由三部分组成，分别是：`报文首部`、`空行`、`报文主体`。

对于请求报文，它的首部由方法、URL、HTTP 版本、HTTP 首部字段等部分构成。

![Jietu20190501-224131@2x.jpg](https://static.yancey.app/Jietu20190501-224131%402x.jpg)

对于响应报文，它的首部分别由 HTTP 版本、状态码、HTTP 首部字段等部分构成。

![Jietu20190501-224131@2x.jpg](https://static.yancey.app/Jietu20190501-224131%402x.jpg)

### 首部字段类型

- **通用首部字段 (General Header Field)** 请求报文和响应报文两方都会使用的首部。

- **请求首部字段 (Request Header Field)** 从客户端向服务端发送请求报文时使用的首部。补充了请求的附加内容、客户端信息、响应内容相关优先级等信息。

- **响应首部字段 (Response Header Field)** 从服务端向客户端返回响应报文时使用的首部。补充了响应的附加内容，也会要求客户端附加额外的内容信息。

- **实体首部字段 (Entity Header Field)** 针对请求报文和响应报文的实体部分使用的首部。补充了资源内容更新时间等与实体有关的信息。

### End-to-end 首部 和 Hop-by-hop 首部

HTTP 首部字段将定义成缓存代理和非缓存代理的行为，分成 `端到端首部` 和 `逐条首部`。

分到 `端到端首部` 的首部会转发给请求/响应对应的最终接收目标，且必须保存在由缓存生成的响应中，并且它必须被转发。

分到 `逐跳首部` 的首部只对单次转发有效，会因通过缓存或代理而不再转发。在 HTTP/1.1 之后的版本，如果使用逐跳首部，则需要提供 Connection 首部字段。其中 Connection、Keep-Alive、Proxy-Authenticate、、Proxy-Authorization、Trailer、TE、Transfer-Encoding、Upgrade 这 8 个为逐跳首部，其余都为端到端首部。

### 通用首部字段

#### Cache-Control

该字段用于控制缓存的工作机制，它接受多个参数，中间用逗号隔开。

| 指令             | 参数                 | 类型                | 说明                                                                                                      |
| ---------------- | -------------------- | ------------------- | --------------------------------------------------------------------------------------------------------- |
| no-cache         | 无                   | 请求/响应都有该字段 | 若请求中包含该字段，则表示客户端不接受缓存；若服务端包含该字段，缓存前必须先确认其有效性                  |
| no-store         | 无                   | 请求/响应都有该字段 | 不缓存请求或相应的任何内容。no-cache 响应实际上是可以存储到本地缓存区中的，而 no-store 才是本地彻底不缓存 |
| max-age          | 单位为秒，必需       | 请求/响应都有该字段 | 当缓存时间小于该值时，客户端接受缓存的资源，否则请求源服务器，该指令的优先级高于 Expires                  |
| max-state        | 单位为秒，可省略参数 | 只有请求拥有该字段  | 只要有该字段，客户端就可以接受过期的缓存                                                                  |
| min-fresh        | 单位为秒，必需       | 只有请求拥有该字段  | 该指令要求缓存服务器返回至少还未过指定时间的缓存资源                                                      |
| no-transform     | 无                   | 请求/响应都有该字段 | 无论在请求还是响应中，都不允许缓存改变实体主体的媒体类型                                                  |
| only-if-cached   | 无                   | 只有请求拥有该字段  | 表示客户端仅在缓存服务器本地缓存目标资源的情况下才会要求去返回                                            |
| cache-extension  | -                    | 请求/响应都有该字段 | 新指令扩展                                                                                                |
| public           | 无                   | 只有响应拥有该字段  | 可向任意客户端提供相应的缓存                                                                              |
| private          | 可省略               | 只有响应拥有该字段  | 仅向特定用户返回响应                                                                                      |
| must-revalidate  | 无                   | 只有响应拥有该字段  | 可缓存，但必须再向源服务器进行一次验证                                                                    |
| proxy-revalidate | 无                   | 只有响应拥有该字段  | 要求中间缓存服务器对缓存的响应有效性再进行确认                                                            |
| s-maxage         | 单位为秒，必需       | 只有响应拥有该字段  | 与 max-age 相比，该指令仅适用于公共服务器                                                                 |

#### Connection

Connection 用于控制不再转发给代理的首部字段，还可以管理持久连接。HTTP/1.1 默认是持久连接，当服务端明确表示断开连接时，则将 Connection 设为 `Close`。

#### Date

Date 表示创建报文的日期和时间，它的格式如下。

```http
date: Sun, 05 May 2019 02:05:37 GMT
```

#### Trailer

该字段会事先说明在报文主体后记录了哪些首部字段，可应用于 HTTP/1.1 分块传输编码。

#### Transfer-Encoding

该字段规定了传输报文主体时采用的编码方式，HTTP/1.1 的传输编码方式仅对分块传输编码有效。

#### Upgrade

该字段用于检测 HTTP 协议或者其他协议是否可以使用更高的版本通信，该字段要和 Connection 字段一起使用。下面的例子是询问是否可以使用 TLS/1.0 协议。对于附有 Upgrade 字段的请求，服务端可返回 101 的状态码。

```http
connection: upgrade
upgrade: TLS/1.0
```

#### Via

该字段用于追踪客户端与服务器之间请求和响应报文的传输路径。

### 请求首部字段

#### Accept

该字段通知服务器，用户代理能够处理的媒体类型及媒体类型的相对优先级。其中用 q 表示权重。下面的例子表示客户端可以接受纯文本类型或者 HTML 类型，并且接收纯文本类型的意愿 (权重)为 0.3。

```http
Accept: text/plain; q=0.3, text/html
```

#### Accept-Charset

该字段通知服务器，用户代理支持的字符集及字符集的相对优先级。该字段应用于内容协商机制的服务器驱动协商。如果服务器不能提供该字段的任何字符集，会报 406 错误，因此尽量不去使用该字段 (我试验了几个网站，都没有此字段)。下面的例子表示客户端支持 utf-8 和 iso-8859-1，且优先使用 utf-8。

```http
Accept-Charset: utf-8, iso-8859-1;q=0.5
```

#### Accept-Encoding

该字段告知服务端，客户端可使用的头部压缩算法。上面 `压缩报文` 已经介绍了几种压缩方式，这里不在赘述。

```http
Accept-Encoding: gzip, deflate, br
```

#### Authorization

该字段用于告知服务器，用户代理的认证信息。下面是我博客后台管理系统的一个场景，在请求一个需要认证的接口时，需要在请求头上附带认证信息。

```http
Authorization: Bearer JWT_TOKEN
```

#### Expect

客户端使用 Expect 来告知服务器，期望出现的某种特定行为。当服务器无法理解客户端的期望而发生错误时，会返回 417 状态码。

该字段跟状态码 100 息息相关，等待状态码 100 响应的客户端在发生请求时，需要指定 `Expext: 100-continue`。该状态码的用途主要是允许客户端发送带请求体的请求前，判断服务器是否愿意接收请求。

```http
Expect: 100-continue
```

#### From

该字段用来告知服务器使用用户代理的用户的 Email。

#### Host

当以单台服务器分配多个域名的虚拟主机时，Host 字段就可以用来确定相应的主机。

```http
Host: www.abc.com
```

#### If-Match

形如 `If-xxx` 的请求字段都可称为条件请求。服务器在收到该类请求后，只有判断条件为真时才会执行请求。

服务器会比对 If-Match 的字段值和资源的 ETag 值，仅当两者一致时，才会执行请求，否则返回 412 状态码。当 If-Match 的字段值为 `*` 时，服务器会忽略 ETag 值，只要资源存在就处理请求。

```http
If-Match: W/"pqxe5g29m4"
```

#### If-None-Match

与 If-Match 相反，服务器会比对 If-None-Match 的字段值和资源的 ETag 值，仅当两者 `不一致` 时，才会执行请求。在 GET 和 HEAD 方法中使用该字段会获取最新资源。

#### If-Modified-Since

如果在 If-Modified-Since 字段指定的日期时间后，资源发生了更新，服务器会接受请求。如果资源没更新过，则返回 304 状态码。

该字段值和响应首部字段的 Last-Modifie 字段做比较，下面的例子中显然最后修改时间要新于 If-Modified-Since 的时间，因此会响应新的资源。

```http
// 请求首部字段
If-Modified-Since: Fri, 01 May 2019 11:20:04 GMT

// 响应首部字段
Last-Modified: Fri, 03 May 2019 11:20:04 GMT
```

#### If-Unmodified-Since

如果在 If-Modified-Since 字段指定的日期时间后，资源 `未发生` 更新，服务器才会接受请求。如果资源在此之后发生了更新，则报 412 错误。

#### If-Range

该字段值跟 相应头中的 ETag 或 Date 进行比较，若一致，就作为范围请求处理，并返回状态码 206，否则直接返回全部资源。

#### Range

对于只需获取部分资源的范围请求，包含首部字段 Range 即可告知服务器资源的指定范围。接收到附带 Range 字段的请求的服务器，会在处理请求之后返回状态码为 206 的响应。当无法处理该范围请求时，返回 200 状态码及全部资源。

```http
Range: bytes=5001-10000
```

#### Proxy-Authorization

该字段用于告知代理服务器，用户代理的认证信息。

#### Referer

告知服务器请求的 URI 是从哪儿发起的。比如在我的博客 www.yanceyleo.com 请求了 AliOSS 上的一张图片，那么请求 AliOSS 服务器的那个请求头就会附上：

```http
Referer: https://www.yanceyleo.com
```

当然该单词正确的拼写应该是 `referrer`，但 `referer` 却沿用至今。想起一句歌词：“在漫天风沙里，望着你远去，我竟悲伤的不能自己 (已)。”

#### TE

该字段会告知服务端，客户端能够处理响应的传输编码方式及相对优先级。它类似于 Accept-Encoding，但用于传输编码。除了指定传输编码，还可以指定伴随 trailer 字段的分块传输编码方式。

```http
TE: gzip, delate;q=0.5

TE: trailers
```

#### User-Agent

这个字段再不认识直接回炉重造吧，这里不去赘述，直接看例子。

```http
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36
```

### 响应首部字段

#### Accept-Ranges

该字段用于告知客户端，服务器是否能处理范围请求，可处理时指定为 `bytes`，否则为 `none`。

```http
Accept-Ranges: bytes
```

#### Age

该字段用于告知客户端，源服务器在多久前创建了响应，字段值的单位为秒。若创建该响应的服务器是缓存服务器，Age 值指的是缓存后的响应再次发起认证到认证完成的时间值 (CDN)。

```http
Age: 500
```

#### ETag

ETag 是将资源以字符串的形式做唯一性标识，服务器会为每份资源分配对应的 ETag 值。当资源更新时，ETag 值也需要更新。

ETag 有 `强 Etag 值` 和 `弱 Etag 值` 之分。前者是指无论实体发生多么细微的变化都会改变其值。而弱 ETag 只用于提示资源是否相同。只有资源发生了根本变化，产生差异时才会改变 ETag 值，弱 ETag 字段值前面会有 `W` 标识。前者就好比使用了 `{deep: true}` 一样。

下面的代码是一张图片的 ETag，显然一张图片改变意味着资源的彻底改变，因此使用了强 ETag。

```http
ETag: "F8F155B13C6DA43723EEDE3EDBBB4D28"
```

下面的代码是请求一个数据接口的 ETag，大多数情况不会发生根本性的改变，因此使用弱 ETag。

```http
etag: W/"300af-7JrdwEcHHeXMqn/UCrMO0zsO0SY"
```

#### Location

Location 字段可以将响应接收方引导至某个与请求 URI 位置不同的资源，该字段一般会配合 3xx 的状态码使用。

```http
Location: https://yanceyleo.com
```

#### Proxy-Authenticate

该字段会把由代理服务器所要求的认证信息发送给客户端。

#### Retry-After

该字段告知客户端应该在多久之后再次发送请求。当服务器出错报 503 时，如果服务端知道什么时候可以恢复，那么就应该通过该字段告知客户端。该字段的字段值可以是具体的日期时间，也可以是创建响应后的秒数。

```http
Retry-After: Sat, 04 May 2019 11:26:52 GMT
```

#### Server

该字段也是一个常见字段，用于告知客户端，Web 服务器的名称。比如我使用了 cloudflare 的 CDN，因此服务器如下所示。

```http
server: cloudflare
```

#### Vary

该字段可用于对缓存进行控制，它的字段值接收一系列其他首部字段名。

```http
vary: Accept-Encoding,Cookie
```

上面这个例子中，源服务器向代理服务器发送了 vary 字段，代理服务器若要进行缓存，只能对 Accept-Encoding 和 Cookie 进行缓存。

#### WWW-Authenticate

该字段告知客户端适用于访问请求 URI 所指定资源的认证方案和带参数提示的质询。

### 实体首部字段

#### Allow

该字段会告知客户端所支持的所有 HTTP 请求方法，当服务端接收到不支持的 HTTP 方法时，会返回 405 状态码，并将所有能支持的 HTTP 方法写入首部字段。

```http
Allow: GET, PUT
```

#### Content-Encoding

告知客户端服务器使用的内容编码方式。

```http
content-encoding: br
```

#### Content-Language

告知客户端实体主体使用的自然语言。

```http
content-language: zh-CN
```

#### Content-Length

该字段表明了实体主体部分的大小，单位是字节。

```http
Content-Length: 4871261
```

#### Content-MD5

该字段用于检查报文主体在传输过程中是否保持完整性，以及确认传输到达。服务端对报文主体执行 MD5 算法，获取一个 128 位的二进制数，再通过 base64 编码后将结果写入 Content-MD5 字段值。因为 HTTP 首部无法记录二进制值，因此需要通过 Base64 进行处理。客户端在接收到响应后再对报文主体执行一次相同的 MD5 算法。将计算值于该字段值比较，即可判断出报文主体的准确性。

```http
Content-MD5: +PFVsTxtpDcj7t4+27tNKA==
```

#### Content-Range

该字段告知客户端作为响应返回的实体的哪个部分符合范围请求，字段值以字节为单位。

#### Content-Type

非常常见的字段，用来说明实体主体内对象的媒体类型。

```http
content-type: application/json; charset=utf-8
```

#### Expires

该字段将资源失败的日期告诉客户端，在 Expires 指定的时间之前，响应的副本会一直被保存。当超过指定的时间后，缓存服务器在请求发送过来时，转向源服务器请求资源。当首部字段 Cache-Control 有指定的 max-age 时，会优先处理 max-age。

关于缓存机制下一章会详细去讲。

#### Last-Modified

该字段指明资源的最终修改时间，一般来讲，该值就是 Request-URI 指定资源的被修改的时间。

## HTTP 方法

| 方法名  | 描述                                                                                                                                                                                                                                                                                                                                           |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET     | GET 请求会显示请求指定的资源。一般来说 GET 方法应该只用于数据的读取，而不应当用于会产生副作用的非幂等的操作中。它期望的应该是而且应该是安全的和幂等的。这里的安全指的是，请求不会影响到资源的状态。                                                                                                                                            |
| HEAD    | HEAD 方法与 GET 方法一样，都是向服务器发出指定资源的请求。但是，服务器在响应 HEAD 请求时不会回传资源的内容部分，即：响应主体。这样，我们可以不传输全部内容的情况下，就可以获取服务器的响应头信息。HEAD 方法常被用于客户端查看服务器的性能。                                                                                                    |
| PUT     | PUT 请求会身向指定资源位置上传其最新内容，PUT 方法是幂等的方法。通过该方法客户端可以将指定资源的最新数据传送给服务器取代指定的资源的内容。                                                                                                                                                                                                     |
| POST    | POST 请求会 向指定资源提交数据，请求服务器进行处理，如：表单数据提交、文件上传等，请求数据会被包含在请求体中。POST 方法是非幂等的方法，因为这个请求可能会创建新的资源或/和修改现有资源。                                                                                                                                                       |
| TRACE   | TRACE 请求服务器回显其收到的请求信息，该方法主要用于 HTTP 请求的测试或诊断。                                                                                                                                                                                                                                                                   |
| OPTIONS | OPTIONS 请求与 HEAD 类似，一般也是用于客户端查看服务器的性能。 这个方法会请求服务器返回该资源所支持的所有 HTTP 请求方法，该方法会用'\*'来代替资源名称，向服务器发送 OPTIONS 请求，可以测试服务器功能是否正常。JavaScript 的 XMLHttpRequest 对象进行 CORS 跨域资源共享时，就是使用 OPTIONS 方法发送嗅探请求，以判断是否有对指定资源的访问权限。 |
| DELETE  | DELETE 请求用于请求服务器删除所请求 URI（统一资源标识符，Uniform Resource Identifier）所标识的资源。DELETE 请求后指定资源会被删除，DELETE 方法也是幂等的。                                                                                                                                                                                     |
| PATCH   | PATCH 方法出现的较晚，它在 2010 年的 RFC 5789 标准中被定义。PATCH 请求与 PUT 请求类似，同样用于资源的更新。二者有以下两点不同：1.PATCH 一般用于资源的部分更新，而 PUT 一般用于资源的整体更新。2.当资源不存在时，PATCH 会创建一个新的资源，而 PUT 只会对已在资源进行更新。                                                                      |
| CONNECT | CONNECT 方法是 HTTP/1.1 协议预留的，能够将连接改为管道方式的代理服务器。通常用于 SSL 加密服务器的链接与非加密的 HTTP 代理服务器的通信。                                                                                                                                                                                                        |

GET，HEAD，PUT 和 DELETE 是幂等方法，而 POST 不是幂等的。

## HTTP 状态码

HTTP 状态码负责表示客户端 HTTP 请求的返回结果、标记服务器端的处理是否正常、通知出现的错误等工作。

### 1xx 信息类状态码

| 状态码 | 状态码英文名称      | 描述                                     |
| ------ | ------------------- | ---------------------------------------- |
| 100    | Continue            | 服务器收到请求的初始部分，请客户端继续。 |
| 101    | Switching Protocols | 服务器根据客户端请求切换协议             |

1xx 的状态码表示一个临时的响应，仅由状态行和可选头构成，由空行结尾。对该类状态码，不需要头部。该类状态码在 HTTP/1.1 引入，因此服务器禁止向 HTTP1.0 的客户端响应 1xx 状态码。

对于 100 (Continue) 状态码，客户端应该继续它的请求。这个过渡的响应用于告知客户端，请求的初始部分已经被服务器收到，并且没有被服务器拒绝。客户端应该继续发送剩余的请求，如果请求已经完成，就忽略这个响应。服务器必须在请求完成后发送一个最终的响应。

100 状态码的用途主要是，允许客户端发送带请求体的请求前，判断服务器是否愿意接收请求 (通过请求头)。在某些情况下，如果服务器在不看请求体的情况下就拒绝请求时，客户端仍然发送请求体是不恰当的或低效的。

### 2xx 成功状态码

| 状态码 | 状态码英文名称                | 描述                                                                                                                                                                 |
| ------ | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 200    | OK                            | 请求成功，响应主体包含了具体的数据。最常见，一般 GET 和 POST 请求会返回此状态码。                                                                                    |
| 201    | Created                       | 已创建，一般 PUT 请求会返回此状态码。                                                                                                                                |
| 202    | Accepted                      | 服务器已接收到请求，但还未处理完成。                                                                                                                                 |
| 203    | Non-Authoritative Information | 非授权信息。请求成功，但元信息不在原始服务器上，而是资源的一个副本。若中间节点上有一份资源副本，但无法或没有对它发出的与资源有关的元信息进行验证，就会出现这种情况。 |
| 204    | No Content                    | 响应报文中无主体部分。一般 DELETE 请求会返回此状态码。                                                                                                               |
| 205    | Reset Content                 | 负责告知浏览器清除当前页面中所有 HTML 元素。                                                                                                                         |
| 206    | Partial Content               | 成功执行一个部分或 Range 请求。客户端可以在首部中指定请求某个范围内的文件。该状态响应头部必须包含 Content-Range、Date、以及 ETag 或 Content-Location。               |

206 状态码一般是在下载大文件时会遇到，它表示请求已成功，并且主体包含所请求的数据区间，该数据区间是在请求的 Range 首部指定。下图中，我的博客在获取音频文件时返回了 206 状态码。

![206 状态码](https://static.yancey.app/Jietu20190503-223321.jpg)

### 3xx 重定向状态码

| 状态码 | 状态码英文名称     | 描述                                                                                                                       |
| ------ | ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| 300    | Multiple Choices   | 客户端请求实际指向多个资源的 URL。客户端可以在响应中找到资源列表。                                                         |
| 301    | Moved Permanently  | 请求的 URL 已被移除。响应的 Location 首部包含现在所处的位置。                                                              |
| 302    | Found              | 与 301 类似，客户端本次应使用响应中的临时 URL，将来的请求任使用以前的 URL。                                                |
| 303    | See Other          | 告知客户端使用另一个 URL 来获取资源。其主要目的是，允许 POST 请求的响应将客户端定向的某一个资源上去。                      |
| 304    | Not Modified       | 若客户端发起一个有条件的 GET 请求，而资源未被修改，可以使用该状态码说明资源未被修改。                                      |
| 305    | Use Proxy          | 必须通过代理来访问这一资源，代理有 Location 首部给出。需要知道的是，客户端接收到这一状态时，不应该假定所有请求都经过代理。 |
| 307    | Temporary Redirect | 和 302 相同。                                                                                                              |

### 4xx 客户端错误状态码

| 状态码 | 状态码英文名称                                   | 描述                                                                              |
| ------ | ------------------------------------------------ | --------------------------------------------------------------------------------- |
| 400    | Bad Request                                      | 告知客户端它发送了一个错误的请求。                                                |
| 401    | Unauthorized                                     | 与适当首部一同返回，告知客户端在请求之前先进行认证。                              |
| 403    | Forbidden                                        | 请求被拒绝。                                                                      |
| 404    | Not Found                                        | 服务器无法找到请求的 URL。                                                        |
| 405    | Method Not Allowed                               | 客户端使用不支持的方法请求 URL。应该在首部使用 Allow 告知客户端正确的方法。       |
| 406    | Not Acceptable                                   | 服务器端无法提供与 Accept-Charset 以及 Accept-Language 消息头指定的值相匹配的响应 |
| 407    | Proxy Authentication Required                    | 代理服务器要求客户端验证。                                                        |
| 408    | Request Timeout                                  | 客户端完成请求时间过长，服务器可以关闭链接。                                      |
| 409    | Conflict                                         | 服务器认为该请求可能引起冲突。响应主体中应包含冲突的主体的描述。                  |
| 410    | Gone                                             | 与 404 类似，只是服务器曾经拥有此资源，后来被移除。                               |
| 411    | Length Required                                  | 服务器要求请求报文中包含 Content-Length 首部。                                    |
| 412    | Precondition Failed                              | 客户端发起条件请求，其中有条件失败。                                              |
| 413    | Request Entity Too LargeRequest Entity Too Large | 客户端发送的主体部分比服务器能够活希望处理的要大。                                |
| 414    | Request URI Too Long                             | URL 过长。                                                                        |
| 415    | Unsupported Media Type                           | 服务器无法理解或无法支持客户端发送的内容类型。                                    |
| 416    | Requested Range Not Satisfiable                  | 请求范围无效或无法满足。                                                          |
| 417    | Expectation Failed                               | 请求首部包含 Expect 期望，但服务器无法满足。                                      |
| 429    | Too Many Requests                                | 短时间内发送了太多请求                                                            |
| 431    | Request Header Fields Too Large                  | 请求头太大                                                                        |

### 5xx 服务端错误状态码

| 状态码 | 状态码英文名称           | 描述                                                                                                |
| ------ | ------------------------ | --------------------------------------------------------------------------------------------------- |
| 500    | Internal Server Error    | 服务器遇到一个妨碍它提供服务的错误。                                                                |
| 501    | Not Implemented          | 客户端发起的请求超出服务器能力范围，如使用了不支持的方法。                                          |
| 502    | Bad Gateway              | 无效网关。通常不是这上游服务器关闭，而是使用了上游服务器不同意协议交换数据。                        |
| 503    | Service Unavailable      | 服务器暂时无法提供服务。若服务器知道服务什么时间可以使用，可以在响应头中加入 Retry-After 首部说明。 |
| 504    | Gateway Timeout          | 于 408 类似，只是这里的响应来自一个网关或代理，它们在等待另一个服务器响应对其请求响应时超时。       |
| 505    | HTTP Version Not Support | 服务器收到的请求使用了它无法支持的协议版本。                                                        |
|        |

## 总结

这一篇文章主要探讨了 HTTP 协议以及它的 `无连接、无状态` 性，从而引出了 cookie 和 session。接着介绍了 HTTP 的头部、方法、状态码。下一篇会着重讲解 HTTP 协议的缓存，敬请期待。

欢迎关注我的微信公众号：进击的前端

![进击的前端](https://static.yancey.app/qrcode_for_gh_541158abcb21_344.jpg)

## 参考

《图解 HTTP》 -- 上野 宣

[express 中 cookie 的使用和 cookie-parser 的解读](https://segmentfault.com/a/1190000004139342)

[谈谈 cookie](http://barryliu1995.studio/2017/10/11/谈谈cookie)

[把 cookie 聊清楚](https://juejin.im/post/59d1f59bf265da06700b0934)

[[读] 这一次,让我们再深入一点 - HTTP 报文](https://juejin.im/post/5a4f782c5188257326469d7c)

[HTTP 状态码详解之 100](https://blog.lyz810.com/article/2016/11/http-statuscode-100-continue/)

[你所知道的 3xx 状态码](https://aotu.io/notes/2016/01/28/3xx-of-http-status/index.html)
