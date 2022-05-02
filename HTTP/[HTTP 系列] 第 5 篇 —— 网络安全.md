# [HTTP 系列] 第 5 篇 —— 网络安全

> 这里是《写给前端工程师的 HTTP 系列》, 记得有位大佬曾经说过: **大厂前端面试对 HTTP 的要求比 CSS 还要高**, 由此可见 HTTP 的重要程度不可小视. 文章写作计划如下, 视情况可能有一定的删减, 本篇是该系列的第 5 篇 —— 网络安全.

- [\[HTTP 系列\] 第 1 篇 —— 从 TCP/UDP 到 DNS 解析](https://www.yanceyleo.com/post/3a9d3d47-9977-4579-a756-4bf5af4a3fd4)
- [\[HTTP 系列\] 第 2 篇 —— HTTP 协议那些事](https://www.yanceyleo.com/post/efd566e9-4ee3-4ee2-8448-628414659480)
- [\[HTTP 系列\] 第 3 篇 —— HTTP 缓存那些事](https://www.yanceyleo.com/post/89731d8e-5510-4094-8962-462b127ed5d0)
- [\[HTTP 系列\] 第 4 篇 —— HTTPS](https://www.yanceyleo.com/post/f976717f-9e40-4849-a73f-86c63c0c45e1)
- [\[HTTP 系列\] 第 5 篇 —— 网络安全](https://www.yanceyleo.com/post/953ccf20-7f3b-4d3f-816e-b6e98b26a4da)
- [\[HTTP 系列\] 第 6 篇 —— 从输入 URL 回车到页面呈现](https://www.yanceyleo.com/post/05daeef2-2caf-4ebe-89f0-2ad9cae286c4)

## 同源策略

如果两个 URL 的协议, 域名和端口都相同, 我们就称这两个 URL 同源. 浏览器默认两个相同的源之间是可以相互访问资源和操作 DOM 的. 两个不同的源之间若想要相互访问资源或者操作 DOM, 那么会有一套基础的安全策略的制约, 我们把这称为同源策略. 具体来讲, 同源策略主要表现在 DOM, Web 数据和网络这三个层面.

同源策略限制了来自不同源的 JavaScript 脚本对当前 DOM 对象读和写的操作. 如果是同源的页面, 它们之间可以相互操作 DOM, 否则无法相互操作 DOM. 因为如果任何三方都可以插入一段脚本, 恶意篡改 DOM 和恶意操作 DOM, 那么就会导致网站的安全问题, 这也就是所谓的 XSS, 下面会讲到. 有时候我们经常需要两个不同源的 DOM 之间进行通信, 于是浏览器中又引入了跨文档消息机制, 可以通过 window.postMessage 的 JavaScript 接口来和不同源的 DOM 进行通信.

在数据层面, 同源策略限制了不同源的站点读取当前站点的 Cookie, IndexDB, LocalStorage 等数据. 由于同源策略, 我们依然无法通过第二个页面的 opener 来访问第一个页面中的 Cookie, IndexDB 或者 LocalStorage 等内容. 同样的, 如果不限制脚本的插入, 恶意脚本可以轻松的获取到 Cookie, IndexDB 或者 LocalStorage 等数据. 关于 cookie 的详细内容可以看 [\[HTTP 系列\] 第 2 篇 —— HTTP 协议那些事](https://www.yanceyleo.com/post/efd566e9-4ee3-4ee2-8448-628414659480) 这篇文章, 里面讲到了诸如 httpOnly, secure, signed, sameSite 等 cookie 的特性.

在网络层面, 同源策略限制了通过 XMLHttpRequest 等方式将站点的数据发送给不同源的站点.

## CORS

上面说到同源策略保证了在网络层面, 非同源 URL 不可以发送请求, 这也就是所谓的跨域. 跨域针对的是那些复杂请求, 首先我们来区分下简单请求和复杂请求.

简单请求的请求方法是以下三种方法之一:

- HEAD
- GET
- POST

并且 HTTP 的头信息不超出以下几种字段:

- Accept
- Accept-Language
- Content-Language
- Last-Event-ID
- Content-Type: 只限于三个值 application/x-www-form-urlencoded, multipart/form-data, text/plain

凡是不同时满足上面两个条件, 就属于非简单请求.

但现实情况下, 这大大限制了生产力, 比如我的网站的后端服务是 `https://api.yanceyleo.com`, 而前端网站是 `https://yanceyleo.com`, 这就造成了跨域. 为了解决这个问题, 你可以在后端配置 CORS, 以使用 nodejs 的中间件为例:

```ts
app.enableCors({
  origin: [/\.?yanceyleo\.com$/, /\.?yancey\.app$/],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  allowedHeaders: "*",
});
```

对于复杂请求, 浏览器会发送一个 OPTIONS 的预检请求, 如果服务器支持, 就会返回一个响应, 否则就会返回一个错误. OPTIONS 请求与 HEAD 类似, 一般也是用于客户端查看服务器的性能. 这个方法会请求服务器返回该资源所支持的所有 HTTP 请求方法, 该方法会用'\*'来代替资源名称, 向服务器发送 OPTIONS 请求, 可以测试服务器功能是否正常. JavaScript 的 XMLHttpRequest 对象进行 CORS 跨域资源共享时, 就是使用 OPTIONS 方法发送嗅探请求, 以判断是否有对指定资源的访问权限.

关于更多解决[跨域](https://mp.weixin.qq.com/s/OC9yEU6JasHxXH_M2b6bHA)问题的思路可以看这篇文章.

## HTTP 劫持

大多数情况是运营商 HTTP 劫持, 当我们使用 HTTP 请求请求一个网站页面的时候, 网络运营商会在正常的数据流中插入精心设计的网络数据报文, 让客户端(通常是浏览器)展示错误的数据, 通常是一些弹窗, 宣传性广告或者直接显示某网站的内容, 大家应该都有遇到过.

## DNS 劫持

DNS 劫持就是通过劫持了 DNS 服务器, 通过某些手段取得某域名的解析记录控制权, 进而修改此域名的解析结果, 导致对该域名的访问由原 IP 地址转入到修改后的指定 IP, 其结果就是对特定的网址不能访问或访问的是假网址, 从而实现窃取资料或者破坏原有正常服务的目的. DNS 劫持比之 HTTP 劫持更加过分, 简单说就是我们请求的是 `http: //www.a.com/index.html` , 直接被重定向了 `http: //www.b.com/index.html`.

## 跨站脚本攻击

XSS 全称是 Cross Site Scripting, 为了与 CSS 区分开来, 故简称 XSS. XSS 是一种常见的 web 安全漏洞, 它允许攻击者将恶意代码植入到提供给其它用户使用的页面中. 它可以造成如下几种危害:

- 可以窃取 Cookie 信息. 恶意 JavaScript 可以通过 **document.cookie** 获取 Cookie 信息, 然后通过 XMLHttpRequest 或者 Fetch 加上 CORS 功能将数据发送给恶意服务器; 恶意服务器拿到用户的 Cookie 信息之后, 就可以在其他电脑上模拟用户的登录, 然后进行转账等操作. 可以监听用户行为. 恶意 JavaScript
- 可以使用 **addEventListener** 接口来监听键盘事件, 比如可以获取用户输入的信用卡等信息, 将其发送到恶意服务器. 黑客掌握了这些信息之后, 又可以做很多违法的事情.
- 可以通过修改 DOM 伪造假的登录窗口, 用来欺骗用户输入用户名和密码等信息. 还可以在页面内生成浮窗广告, 这些广告会严重地影响用户体验.

### 跨站脚本攻击的形式

通常情况下, 主要有存储型 XSS 攻击、反射型 XSS 攻击和基于 DOM 的 XSS 攻击三种方式来注入恶意脚本.

- 存储型 XSS: 用户私信/网站评论里面用户输入了恶意代码, 被提交到了数据库, 在请求接口后渲染时造成 XSS

- 反射型 XSS: 用户将一段含有恶意代码的 URL 提交给 Web 服务器, Web 服务器接收到请求时, 又将恶意代码反射给了浏览器端

- DOM 型: 前端代码不严谨, 导致如使用 innerHTML 时插入了不安全的代码, 或者遭受了 HTTP 劫持 或者 DNS 劫持

### 如何防止跨站脚本攻击

- 服务器对输入脚本进行过滤或转码, 过滤特殊字符 `/["'&<>]/`
- 开启 httpOnly(很多 xss 的目的就是为了获取 cookies)
- 充分利用 CSP, 限制加载其他域下的资源文件, 禁止向第三方域提交数据, 禁止执行内联脚本和未授权的脚本

![httpOnly](https://edge.yancey.app/beg/rc99ktp0-1651441086509.jpg)

## CSRF 跨站请求伪造

CSRF 英文全称是 Cross-site request forgery, 是指黑客引诱用户打开黑客的网站, 在黑客的网站中, 利用用户的登录状态发起的跨站请求. 简单来讲, CSRF 攻击就是黑客利用了用户的登录状态, 并通过第三方的站点来做一些坏事, 和 XSS 不同的是, CSRF 攻击不需要将恶意代码注入用户的页面, 仅仅是利用服务器的漏洞和用户的登录状态来实施攻击. 它的攻击有两种形式.

### 跨站请求伪造的形式

第一种是通过 GET 请求的漏洞:

- 受害者登录合法网站 a.com, 并保留了登录凭证(Cookie).
- 攻击者引诱受害者访问了黑客网站 b.com.
- b.com 向 a.com 发送了一个请求: a.com/act=xx.浏览器会默认携带 a.com 的 Cookie.
- a.com 接收到请求后, 对请求进行验证, 并确认是受害者的凭证, 误以为是受害者自己发送的请求.
- a.com 以受害者的名义执行了 act=xx.
- 攻击完成, 攻击者在受害者不知情的情况下, 冒充受害者, 让 a.com 执行了自己定义的操作.

第二种是通过 POST 请求的漏洞, 也就是伪造表单:

```html
<!DOCTYPE html>
<html>
  <body>
    <h1>黑客的站点, CSRF攻击演示</h1>
    <form
      id="hacker-form"
      action="https://time.geekbang.org/sendcoin"
      method="POST"
    >
      <input type="hidden" name="user" value="hacker" />
      <input type="hidden" name="number" value="100" />
    </form>
    <script>
      document.getElementById("hacker-form").submit();
    </script>
  </body>
</html>
```

### 如何防止 CSRF 攻击

CSRF 攻击的根本原因是服务器的漏洞, 发起 CSRF 攻击有三大必要条件:

- 目标站点一定要有 CSRF 漏洞;
- 用户要登录过目标站点, 并且在浏览器上保持有该站点的登录状态;
- 需要引诱用户打开一个第三方站点, 可以是黑客的站点, 也可以是一些论坛.

第一个方案是充分利用好 Cookie 的 SameSite 属性, 我们知道黑客会利用用户的登录状态来发起 CSRF 攻击, 而 Cookie 正是浏览器和服务器之间维护登录状态的一个关键数据, SameSite 属性只允许同站点的 Cookie 访问, 即:

- 如果是从第三方站点发起的请求, 那么需要浏览器禁止发送某些关键 Cookie 数据到服务器;
- 如果是同一个站点发起的请求, 那么就需要保证 Cookie 数据正常发送.

SameSite 选项通常有 Strict、Lax 和 None 三个值:

- Strict 最为严格. 如果 SameSite 的值是 Strict, 那么浏览器会完全禁止第三方 Cookie. 简言之, 如果你从极客时间的页面中访问 InfoQ 的资源, 而 InfoQ 的某些 Cookie 设置了 SameSite = Strict 的话, 那么这些 Cookie 是不会被发送到 InfoQ 的服务器上的. 只有你从 InfoQ 的站点去请求 InfoQ 的资源时, 才会带上这些 Cookie.
- Lax 相对宽松一点. 在跨站点的情况下, 从第三方站点的链接打开和从第三方站点提交 Get 方式的表单这两种方式都会携带 Cookie. 但如果在第三方站点中使用 Post 方法, 或者通过 img、iframe 等标签加载的 URL, 这些场景都不会携带 Cookie
- 而如果使用 None 的话, 在任何情况下都会发送 Cookie 数据.

第二个方案是验证请求的来源站点, 也就是使用 HTTP 请求头中的 Referer 和 Origin 属性. Referer 是 HTTP 请求头中的一个字段, 记录了该 HTTP 请求的来源地址, 而 Origin 记录了该 HTTP 请求的来源站点的地址. 从下图可以看出, Origin 属性只包含了域名信息, 并没有包含具体的 URL 路径, 这是 Origin 和 Referer 的一个主要区别. 服务器的策略是优先判断 Origin, 如果请求头中没有包含 Origin 属性, 再根据实际情况判断是否使用 Referer 值.

![Referer 和 Origin](https://edge.yancey.app/beg/3gyli4sp-1651442617493.webp)

第三个方案是 CSRF Token, 这是针对上面 POST 请求漏洞的一个做法. 第一步在浏览器向服务器发起请求时, 服务器生成一个 CSRF Token. CSRF Token 其实就是服务器生成的字符串, 然后将该字符串植入到返回的页面中. 第二步, 在浏览器端如果要发起转账的请求, 那么需要带上页面中的 CSRF Token, 然后服务器会验证该 Token 是否合法. 如果是从第三方站点发出的请求, 那么将无法获取到 CSRF Token 的值, 所以即使发出了请求, 服务器也会因为 CSRF Token 不正确而拒绝请求.

以前年轻时写 Django 的时候它会自动给表单带上 CSRF Token, 不过这种做法只能针对服务端渲染的页面, SPA 就没办法了.

```ts
<!DOCTYPE html>
<html>
<body>
    <form action="https://time.geekbang.org/sendcoin" method="POST">
      <input type="hidden" name="csrf-token" value="nc98P987bcpncYhoadjoiydc9ajDlcn">
      <input type="text" name="user">
      <input type="text" name="number">
      <input type="submit">
    </form>
</body>
</html>
```

## 洪泛攻击

在三次握手过程中. 服务器发送 SYN-ACK 之后. 收到客户端的 ACK 之前的 TCP 连接称为半连接(half-open connect). 此时服务器处于 SYN_RCVD 状态. 当收到 ACK 后. 服务器才能转入 ESTABLISHED 状态.

所以在短时间内伪造大量的不存在的 IP. 向服务器不断发送 SYN 包. 由于源地址是不存在的. 服务器需要不断的向客户端重新发送 `SYN/ACK` 直到超时. 这些伪造的 SYN 包将长时间占用未连接队列. 而正常的 SYN 被丢弃. 因此洪泛攻击会导致服务器运行缓慢. 严重会引起网络堵塞甚至系统瘫痪. 洪泛攻击是一种典型的 DoS/DDoS 攻击. 当你的服务器出现大量的 `半连接`. 几乎就可以认为遭受到了洪泛攻击.

如何预防洪泛攻击呢? 完全阻止是不可能的. 毕竟敌人在暗处. 服务器在明处. 网上介绍了几种方式: **缩短 SYN 超时时间**. **增加最大半连接数**. **过滤网关防护**. **SYN cookies** 等. 不过我认为这些方法都没什么卵用. 还是老老实实买 DDoS 高防吧.

## 中间人攻击

中间人攻击(Man-in-the-MiddleAttack)是指攻击者与通讯的两端分别创建独立的联系, 并交换其所收到的数据, 使通讯的两端认为他们正在通过一个私密的连接与对方直接对话, 但事实上整个会话都被攻击者完全控制. 在中间人攻击中, 攻击者可以拦截通讯双方的通话并插入新的内容. 网络犯罪分子在信息发送者和信息接收者之间实质上是充当**中间人**, 因此被称为**中间人攻击**. 这些攻击非常常见, 尤其是在公共 WiFi 上. 由于公共 WiFi 通常不安全, 您无法知道谁在监控或截获 Web 流量, 因为任何人都可以登录.

- 客户端发送请求到服务端, 请求被中间人截获.

- 服务器向客户端发送公钥.

- 中间人截获公钥, 保留在自己手上. 然后自己生成一个**伪造的**公钥, 发给客户端.

- 客户端收到伪造的公钥后, 生成加密 hash 值发给服务器.

- 中间人获得加密 hash 值, 用自己的私钥解密获得真秘钥. 同时生成假的加密 hash 值, 发给服务器.

- 服务器用私钥解密获得假密钥. 然后加密数据传输给客户端.

### MITM 类型

#### 恶意接入点

恶意接入点是安装在合法网络上的无线接入点. 这使得网络犯罪分子能够截获或监控传入流量, 并通常将其全部重新路由至不同的网络, 以鼓励下载恶意软件或勒索用户.

#### ARP 欺骗

此攻击在局域网上使用虚假的 ARP 消息将攻击者的 MAC 地址与受害者的 IP 地址连接在一起. 受害者发送到局域网的任何数据都会被重新路由至网络犯罪分子的 MAC 地址, 从而允许网络犯罪分子随意截获和操纵数据.

#### HTTPS 欺骗

当用户连接到具有 https:// 前缀的安全网站时, 网络犯罪分子会向浏览器发送虚假的安全证书. 这**欺骗**了浏览器, 使其认为连接是安全的, 而事实上, 网络犯罪分子却在截获并可能重新路由数据.

#### 数据包注入

网络犯罪分子创建看似正常的数据包, 并将其注入已建立的网络, 以访问和监控流量或发起 DDoS 攻击.

#### SSL 欺骗

此方法涉及**欺骗**成安全站点地址, 以让受害者浏览至那里. 网络犯罪分子劫持受害者和他们想要访问的网站的 Web 服务器之间的通信, 将恶意网站伪装成合法网站的 URL.

#### SSL BEAST

网络犯罪分子通过恶意的 JavaScript 感染用户的电脑. 然后, 恶意软件会截获网站 Cookie 和身份验证令牌以进行解密, 使受害者的整个会话暴露在网络犯罪分子面前.

#### 嗅探

嗅探攻击通过监控流量来窃取信息. 嗅探通过应用或硬件执行, 并将受害者的 Web 流量暴露给网络犯罪分子.

#### IP 欺骗

此方法涉及修改 IP 地址以将流量重新路由至攻击者的网站. 攻击者通过改变数据包头将自己伪装成合法的应用或网站来**欺骗**地址.

#### DNS 欺骗

网络犯罪分子进入网站的 DNS 服务器并修改网站的网址记录. 修改后的 DNS 记录将传入流量改为路由至网络犯罪分子的网站.

#### 会话劫持

网络犯罪分子使用会话劫持来控制 Web 或应用会话. 劫持将合法用户逐出会话, 有效地将网络犯罪分子锁定在应用或网站帐户中, 直至其获得所需的信息.

#### SSL 剥离

网络犯罪分子会截获来自应用或网站的 TLS 信号, 并对其进行修改, 使网站以不安全的连接加载 HTTP 而非 HTTPS. 这使得网络犯罪分子可以查看用户的会话, 并暴露敏感信息.

#### 公共 WiFi

最常见的 MITM 攻击方法之一是通过公共 WiFi. 公共 WiFi 通常不安全, 因此网络犯罪分子可以从连接网络的任何设备中看到 Web 流量, 并根据需要获取信息.

#### SSL 窃取浏览器 Cookies

Cookie 是您访问的网站存储在您设备上的有用网站信息. 它们对于记住网络活动和登录名称非常有用, 但网络犯罪分子可以窃取它们以获取信息, 并用于恶意目的.

### 如何防范 MITM

中间人攻击是一个(缺乏)相互认证的攻击. 大多数的加密协议都专门加入了一些特殊的认证方法以阻止中间人攻击. 例如, SSL 协议可以验证参与通讯的一方或双方使用的证书是否是由权威的受信任的数字证书认证机构颁发, 并且能执行双向身份认证. 因此一定要使用 HTTPS.

如果你的浏览器告诉你正在访问的网站有问题, 相信它. 安全证书警告可能是将凭据授予攻击者和保持安全之间的区别.

留意网络浏览器的搜索栏或 URL 栏是否有奇怪的网址. DNS 劫持可能会对常见地址进行欺骗, 通常几乎没有明显的变化. 例如, 攻击者可能会将 **www.facebook.com** 替换为 **www.faceb00k.com**. 这种欺骗方法效果出奇的好, 我们大多数人未仔细观察就放过了简单的更改.

某些形式的 MITM 攻击会导致突然、意外的网络延迟或完全断开连接. 这些可能偶尔发生, 通常不伴有网络困境或其他明显状况. 如果您在网络上经常遇到连接断开或延迟, 最好仔细查看, 以确保这不仅仅是网络问题.

不要使用公共 Wi-Fi. 如果您必须使用公共 Wi-Fi 连接, 则应下载并安装 VPN, 为您的连接添加一些安全性.

## CSP

为了解决 XSS 攻击, 浏览器中引入了内容安全策略, 称为 CSP. CSP 的核心思想是让服务器决定浏览器能够加载哪些资源, 让服务器决定浏览器是否能够执行内联 JavaScript 代码. 一个 CSP 兼容的浏览器将会仅执行从白名单域获取到的脚本文件, 忽略所有的其他脚本 (包括内联脚本和 HTML 的事件处理属性).

你可以在 HTML 中加入 meta 属性:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; img-src https://*; child-src 'none';"
/>
```

也可以配置 Content-Security-Policy 响应头, 下面是我的网站某个接口提供的 CSP 策略, 具体配置细节可以看 [MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Content-Security-Policy) 中的相关文档. 值得注意的是, CSP 里面有个 report-uri 属性, 在浏览器检测到 CSP 政策错误时, 将会发送一个 POST 请求到这个地址. 你可以在这个地址接收到错误信息.

![Content-Security-Policy](https://edge.yancey.app/beg/ynnh5y12-1651332510814.jpg)

## 只允许使用 HTTPS

为防止数据包嗅探攻击, 除限制可以加载内容的域, 服务器还可指明哪种协议允许使用; 比如 (从理想化的安全角度来说), 服务器可指定所有内容必须通过 HTTPS 加载. 你可以在 cookie 上使用 secure 属性保证 cookie 只能被 HTTPS 协议的使用. 也可以加上 Strict-Transport-Security 响应头, 指定服务器只允许通过 HTTPS 协议访问.

```shell
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## WAF

传统**防火墙**工作在三层或者四层, 隔离了外网和内网, 使用预设的规则, 只允许某些特定 IP 地址和端口号的数据包通过, 拒绝不符合条件的数据流入或流出内网, 实质上是一种**网络数据过滤设备**. WAF(网络应用防火墙, Web Application Firewall) 也是一种**防火墙**, 但它工作在七层, 看到的不仅是 IP 地址和端口号, 还能看到整个 HTTP 报文, 所以就能够对报文内容做更深入细致的审核, 使用更复杂的条件, 规则来过滤数据. 换句话说, WAF 就是一种 **HTTP 入侵检测和防御系统**.

![WAF](https://edge.yancey.app/beg/lqnvac7f-1649102511012.webp)

WAF 一般应该具有以下功能:

- IP 黑名单和白名单, 拒绝黑名单上地址的访问, 或者只允许白名单上的用户访问;
- URI 黑名单和白名单, 与 IP 黑白名单类似, 允许或禁止对某些 URI 的访问;
- 防护 DDoS 攻击, 对特定的 IP 地址限连限速;
- 过滤请求报文, 防御**代码注入**攻击;
- 过滤响应报文, 防御敏感信息外泄;
- 审计日志, 记录所有检测到的入侵操作.

WAF 的基本原理就好像是平时编写程序时必须要做的函数入口参数检查, 拿到 HTTP 请求, 响应报文, 用字符串处理函数看看有没有关键字, 敏感词, 或者用正则表达式做一下模式匹配, 命中了规则就执行对应的动作, 比如返回 403/404. 比如下面的例子就是利用 **map** 指令在 Nginx 里实现 IP 地址黑名单.

```shell
map $remote_addr $blocked {
    default       0;
    "1.2.3.4"     1;
    "5.6.7.8"     1;
}


if ($blocked) {
    return 403 "you are blocked.";
}
```

[ModSecurity](https://github.com/SpiderLabs/ModSecurity) 是开源的 WAF 软件, 它有两个核心组件. 第一个是**规则引擎**, 它实现了自定义的**SecRule**语言, 有自己特定的语法. 但**SecRule**主要基于正则表达式, 还是不够灵活, 所以后来也引入了 Lua, 实现了脚本化配置. 只有引擎还不够, 要让引擎运转起来, 还需要完善的防御规则, 所以 ModSecurity 的第二个核心组件就是它的**规则集**.

基本的规则集之外, ModSecurity 还额外提供一个更完善的规则集, 为网站提供全面可靠的保护. 这个规则集的全名叫**OWASP ModSecurity 核心规则集**(Open Web Application Security Project ModSecurity Core Rule Set).

![CRS](https://edge.yancey.app/beg/k94eh2lq-1649102502087.webp)

另外, ModSecurity 还有强大的审计日志(Audit Log)功能, 记录任何可疑的数据, 供事后离线分析. 但在生产环境中会遇到大量的攻击, 日志会快速增长, 消耗磁盘空间, 而且写磁盘也会影响 Nginx 的性能, 所以一般建议把它关闭:

```shell
SecAuditEngine off  #RelevantOnly
SecAuditLog /var/log/modsec_audit.log
```

因此, WAF 实质上是模式匹配与数据过滤, 所以会消耗 CPU, 增加一些计算成本, 降低服务能力, 使用时需要在安全与性能之间找到一个**平衡点**.
