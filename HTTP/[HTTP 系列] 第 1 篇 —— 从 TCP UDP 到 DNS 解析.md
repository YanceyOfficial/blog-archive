# [HTTP 系列] 第 1 篇 —— 从 TCP/UDP 到 DNS 解析

> 这里是《写给前端工程师的 HTTP 系列》, 记得有位大佬曾经说过: **大厂前端面试对 HTTP 的要求比 CSS 还要高**, 由此可见 HTTP 的重要程度不可小视. 文章写作计划如下, 视情况可能有一定的删减, 本篇是该系列的第 1 篇 —— 《从 TCP/UDP 到 DNS 解析》.

- [\[HTTP 系列\] 第 1 篇 —— 从 TCP/UDP 到 DNS 解析](https://www.yanceyleo.com/post/3a9d3d47-9977-4579-a756-4bf5af4a3fd4)
- [\[HTTP 系列\] 第 2 篇 —— HTTP 协议那些事](https://www.yanceyleo.com/post/efd566e9-4ee3-4ee2-8448-628414659480)
- [\[HTTP 系列\] 第 3 篇 —— HTTP 缓存那些事](https://www.yanceyleo.com/post/89731d8e-5510-4094-8962-462b127ed5d0)
- [\[HTTP 系列\] 第 4 篇 —— HTTPS](https://www.yanceyleo.com/post/f976717f-9e40-4849-a73f-86c63c0c45e1)
- [\[HTTP 系列\] 第 5 篇 —— 网络安全](https://www.yanceyleo.com/post/953ccf20-7f3b-4d3f-816e-b6e98b26a4da)
- [\[HTTP 系列\] 第 6 篇 —— 从输入 URL 回车到页面呈现](https://www.yanceyleo.com/post/05daeef2-2caf-4ebe-89f0-2ad9cae286c4)

## TCP/IP 通信传输流

### TCP/IP 五层协议

在讲解 TCP/IP 通信传输流之前, 首先复习一下 TCP/IP 的五层协议.

**应用层**: 决定向用户提供应用服务时通信的活动. TCP/IP 协议族内预存了各类通用的应用服务. 比如: FTP, DNS, HTTP 协议.

**传输层**: 传输层对上层应用层, 提供处于网络连接中的两台计算机之间的数据传输. 在传输层有两个性质不同的协议, 分别是 TCP (Transmission Control Protocol, 传输控制协议) 和 UDP (User Data Protocol, 用户数据报协议)

**网络层**: 网络层用来处理在网络上流动的数据包. 数据包是网络传输的最小数据单位. 该层规定了通过怎样的路径到达对方计算机, 并把数据包传送给对方. 与对方计算机通过多台计算机或网络设备进行传输时, 网络层所起的作用就是在众多的选项内选择一条传输路线.

**数据链路层**: 在物理层提供比特流服务的基础上, 建立相邻结点之间的数据链路, 通过差错控制提供数据帧 (Frame)在信道上无差错的传输, 并进行各电路上的动作系列. 数据的单位称为帧 (frame)

**物理层**: 物理层建立在物理通信介质的基础上, 作为系统和通信介质的接口, 用来实现数据链路实体间透明的比特 (bit) 流传输. 只有该层为真实物理通信, 其它各层为虚拟通信.

### TCP/IP 数据传输流程

IP 协议是**Internet Protocol**的缩写, 主要目的是解决寻址和路由问题, 以及如何在两点间传送数据包. TCP 协议是**Transmission Control Protocol**的缩写, 意思是**传输控制协议**, 它位于 IP 协议之上, 基于 IP 协议提供可靠的, 字节流形式的通信, 是 HTTP 协议得以实现的基础. **可靠**是指保证数据不丢失, **字节流**是指保证数据完整, 所以在 TCP 协议的两端可以如同操作文件一样访问传输的数据, 就像是读写在一个密闭的管道里**流动**的字节.

客户端在应用层 (HTTP 协议) 发出一个 HTTP 请求. 为了方便传输, 在传输层 (TCP 协议) 把从应用层处收到的数据 (HTTP 请求报文) 进行分割, 并在各个报文上打上标记序号及端口号后转发给网络层. 在网络层 (IP 协议), 增加作为通信目的地的 MAC 地址后转发给数据链路层. 这样, 发送给服务端的请求就准备齐全了. 当服务端在链路层接收到数据时, 按序往上层发送, 一直到应用层. **当传输到应用层时, 才算真正的接收到由客户端发送过来的请求**.

你可以把 HTTP 利用 TCP/IP 协议栈传输数据想象成一个发快递的过程.

假设你想把一件毛绒玩具送给朋友, 但你要先拿个塑料袋套一下, 这件玩具就相当于 HTTP 协议里要传输的内容, 比如 HTML, 然后 HTTP 协议为它加一个 HTTP 专用附加数据.

你把玩具交给快递小哥, 为了保护货物, 他又加了层包装再贴了个标签, 相当于在 TCP 层给数据再次打包, 加上了 TCP 头.

接着快递小哥下楼, 把包裹放进了三轮车里, 运到集散点, 然后再装进更大的卡车里, 相当于在 IP 层, MAC 层对 TCP 数据包加上了 IP 头, MAC 头.

之后经过漫长的运输, 包裹到达目的地, 要卸货再放进另一位快递员的三轮车, 就是在 IP 层, MAC 层传输后拆包.

快递员到了你朋友的家门口, 撕掉标签, 去除了 TCP 层的头, 你朋友再拆掉塑料袋包装, 也就是 HTTP 头, 最后就拿到了玩具, 也就是真正的 HTML 页面.

![TCP/IP 传输](https://edge.yancey.app/beg/Jietu20190422-142841%402x.jpg)

### TCP/IP 网络分层模型和 OSI 网络分层模型

对于 TCP/IP 网络分层模型和 OSI 网络分层模型, 以及它俩的对应关系如下图所示: 由于 OSI 的分层模型在四层以上分的太细, 而 TCP/IP 实际应用时的会话管理, 编码转换, 压缩等和具体应用经常联系的很紧密, 很难分开. 所谓的四层负载均衡就是指工作在传输层上, 基于 TCP/IP 协议的特性, 例如 IP 地址, 端口号等实现对后端服务器的负载均衡. 所谓的七层负载均衡就是指工作在应用层上, 看到的是 HTTP 协议, 解析 HTTP 报文里的 URI, 主机名, 资源类型等数据, 再用适当的策略转发给后端服务器.

![TCP/IP 网络分层模型和 OSI 网络分层模型](https://edge.yancey.app/beg/yr22v7wu-1646658092682.webp)

对于 TCP/IP 网络分层模型:

第一层叫**链接层**(link layer), 负责在以太网, WiFi 这样的底层网络上发送原始数据包, 工作在网卡这个层次, 使用 MAC 地址来标记网络上的设备, 所以有时候也叫 MAC 层.

第二层叫**网际层**或者**网络互连层**(internet layer), IP 协议就处在这一层. 因为 IP 协议定义了**IP 地址**的概念, 所以就可以在**链接层**的基础上, 用 IP 地址取代 MAC 地址, 把许许多多的局域网, 广域网连接成一个虚拟的巨大网络, 在这个网络里找设备时只要把 IP 地址再**翻译**成 MAC 地址就可以了.

第三层叫**传输层**(transport layer), 这个层次协议的职责是保证数据在 IP 地址标记的两点之间**可靠**地传输, 是 TCP 协议工作的层次, 另外还有它的一个**小伙伴**UDP. TCP 是一个有状态的协议, 需要先与对方建立连接然后才能发送数据, 而且保证数据不丢失不重复. 而 UDP 则比较简单, 它无状态, 不用事先建立连接就可以任意发送数据, 但不保证数据一定会发到对方. 两个协议的另一个重要区别在于数据的形式. TCP 的数据是连续的**字节流**, 有先后顺序, 而 UDP 则是分散的小数据包, 是顺序发, 乱序收.

协议栈的第四层叫**应用层**(application layer), 由于下面的三层把基础打得非常好, 所以在这一层就**百花齐放**了, 有各种面向具体应用的协议. 例如 Telnet, SSH, FTP, SMTP 等等, 当然还有我们的 HTTP.

MAC 层的传输单位是帧(frame), IP 层的传输单位是包(packet), TCP 层的传输单位是段(segment), HTTP 的传输单位则是消息或报文(message). 但这些名词并没有什么本质的区分, 可以统称为数据包.

对于 OSI 网络分层模型, OSI 全称是开放式系统互联通信参考模型(Open System Interconnection Reference Model).

- 第一层: 物理层, 网络的物理形式, 例如电缆, 光纤, 网卡, 集线器等等;
- 第二层: 数据链路层, 它基本相当于 TCP/IP 的链接层;
- 第三层: 网络层, 相当于 TCP/IP 里的网际层;
- 第四层: 传输层, 相当于 TCP/IP 里的传输层;
- 第五层: 会话层, 维护网络中的连接状态, 即保持会话和同步;
- 第六层: 表示层, 把数据转换为合适, 可理解的语法和语义;
- 第七层: 应用层, 面向具体的应用传输数据.

## 扩展: 二层转发和三层路由

二层转发: 设备工作在链路层, 帧在经过交换机设备时, 检查帧的头部信息, 拿到目标 mac 地址, 进行本地转发和广播.

三层路由: 设备工作在 ip 层, 报文经过有路由功能的设备时, 设备分析报文中的头部信息, 拿到 ip 地址, 根据网段范围, 进行本地转发或选择下一个网关.

## DNS

在 TCP/IP 协议中使用 IP 地址来标识计算机, 数字形式的地址对于计算机来说是方便了, 但对于人类来说却既难以记忆又难以输入. 于是**域名系统**(Domain Name System)出现了, 用有意义的名字来作为 IP 地址的等价替代. 在 DNS 中, **域名**(Domain Name)又称为**主机名**(Host).

### DNS 报文格式

请求报文和 DNS 服务器返回的应答报文都是统一的格式:

![dns-protocol-format.png](https://edge.yancey.app/beg/dns-protocol-format.png)

- **会话标识 (2 字节)**: 它是 DNS 报文的 ID 标识, 对于请求报文和其对应的应答报文, 这个字段是相同的, 通过它可以区分 DNS 应答报文是哪个请求的响应.

- **标志 (2 字节)**: 它有 8 个部分, 如下图所示:

  ![dns-header-flags.png](https://edge.yancey.app/beg/dns-header-flags.png)

  | 字段          | 说明                                                                                                                              |
  | ------------- | --------------------------------------------------------------------------------------------------------------------------------- |
  | QR (1bit)     | 查询/响应标志, 0 为查询报文, 1 为响应报文                                                                                         |
  | opcode (4bit) | 0 表示标准查询, 1 表示反向查询, 2 表示服务器状态请求, 3-15 是保留值                                                               |
  | AA (1bit)     | 表示授权回答, 该字段在应答的时候才有意义, 指出给出应答的服务器是查询域名的授权解析服务器;                                         |
  | TC (1bit)     | 表示可截断的, 用来指出报文比允许的长度还要长, 导致被截断                                                                          |
  | RD (1bit)     | 表示期望递归, 该字段被请求设置, 应答的时候使用的相同的值返回. 如果设置了 RD, 就建议域名服务器进行递归解析, 递归查询的支持是可选的 |
  | RA (1bit)     | 表示可用递归, 该字段在应答中设置或取消, 用来代表服务器是否支持递归查询                                                            |
  | RCODE (4bit)  | 应答码, 0 表示没有差错, 3 表示名字差错, 2 表示服务器错误                                                                          |
  | Z             | 保留值                                                                                                                            |

- Questions 查询字段

  - **QNAME** 无符号 8bit 为单位长度不限表示查询名.

  - **QTYPE** 无符号 16bit 整数表示查询的协议类型.

  - **QCLASS** 无符号 16bit 整数表示查询的类.

- Answer/Authority/Additional

  三者的格式相同, 如下所示:

  - **NAME** 资源记录包含的域名.

  - **TYPE** 表示 DNS 协议的类型.

  - **CLASS** 表示 RDATA 的类.

  - **TTL** 表示资源记录可以缓存的时间. 0 代表只能被传输, 但是不能被缓存.

  - **RDLENGTH** 表示 RDATA 的长度.

  - **RDATA** 不定长字符串来表示记录, 格式根 TYPE 和 CLASS 有关. 比如, TYPE 是 A, CLASS 是 IN, 那么 RDATA 就是一个 4 个字节的 ARPA 网络地址.

### DNS 解析记录

折腾过搭建网站的小伙伴们一定对 DNS 解析记录不会陌生, 下面通过表格复习一下.

| 类型 | 助记词 | 说明                        |
| ---- | ------ | --------------------------- |
| 1    | A      | 由域名获得 IPv4 地址 (常用) |
| 2    | NS     | 查询域名服务器 (常用)       |
| 5    | CNAME  | 设置域名别名 (常用)         |
| 6    | SOA    | 开始授权                    |
| 11   | WKS    | 熟知服务                    |
| 12   | PTR    | 把 IP 地址转换成域名        |
| 13   | HINFO  | 主机信息                    |
| 15   | MX     | 邮件交换 (常用)             |
| 28   | AAAA   | 由域名获得 IPv6 地址 (常用) |
| 252  | AXFR   | 传送整个区的请求            |
| 255  | ANY    | 对所用记录的请求            |

### 域名解析过程

- 系统会检查浏览器缓存中有没有这个域名对应的解析过的 IP 地址, 如果缓存中有, 这个解析过程就将结束. 浏览器缓存是受这个域名的失效时间和缓存的空间大小控制的.

- 如果用户的浏览器缓存中没有, 浏览器会查找操作系统缓存中即为本地的 Host 文件.

- 路由器也可能会有缓存.

- 如果前几步都没有找到, 就会到运营商 LDNS (Local DNS) 中查找, 大部分情况下域名都会在这里得到解析.

- 如果在 LDNS 没有找到, 那就要去 Root Server 域名服务器请求解析了. 根域名服务器返回给本地域名服务器一个 `查询主域名服务器(gTLD Server)地址`. gTLD 是国际顶级域名服务器, 如.com, .cn, .org 等, 全球只有 13 台左右.

- 本地域名服务器会向 gTLD Server 地址发送请求, 它会返回一个 Name Server(又叫 Top-level DNS, 顶级域名服务器) 域名服务器的地址, 这个 Name Server 通常就是你注册域名的厂家, 比如 NameCheap, 狗爹, 万网等等.

- Name Server 域名服务器会查询存储域名和 IP 的关系映射表, 正常情况下都可以根据域名得到目标 IP 记录, 并连同一个 TTL 返回给本地域名服务器.

- 本地域名服务器根据 TTL 缓存这个 IP, 并将解析结果返回给客户端, 客户端再根据 TTL 将 IP 信息缓存到本地系统缓存里. 至此, 域名解析过程结束.

![域名解析过程](https://edge.yancey.app/beg/faff9bb6a46a8114d87de846342e3e9c.jpg)

上面说到 Root DNS Server 只有 13 台左右, 为了防止拥挤就有了各种缓存策略, 比如域名厂商都有自己的 DNS 解析服务器, 作为用户 DNS 查询的代理, 代替用户访问核心 DNS 系统, 这称为**非权威域名服务器**. 比较知名有 Google 的 `8.8.8.8`, CloudFare 的 `1.1.1.1` 等等. 当然上面也写到了浏览器, Host, 甚至路由器都会有缓存策略.

### 基于域名系统的负载均衡

第一种方式, 因为域名解析可以返回多个 IP 地址, 所以一个域名可以对应多台主机, 客户端收到多个 IP 地址后, 就可以自己使用轮询算法依次向服务器发起请求, 实现负载均衡.

第二种方式, 域名解析可以配置内部的策略, 返回离客户端最近的主机, 或者返回当前服务质量最好的主机, 这样在 DNS 端把请求分发到不同的服务器, 实现负载均衡.

## 区分 URI 和 URL

有了 TCP/IP 协议和 DNS 协议, 我们可以定位到一台主机, 但只定位到主机还没完, 需要定位到主机具体的资源才行. 所以就出现了 URI(Uniform Resource Identifier), 中文名称是统一资源标识符, 使用它就能够唯一地标记互联网上资源, 由**协议名 + 主机名 + 路径**构成. URI 另一个更常用的表现形式是 URL(Uniform Resource Locator), 统一资源定位符, 也就是我们俗称的**网址**, 它实际上是 URI 的一个子集.

URI 不完全等同于网址, 它包含有 URL 和 URN 两个部分, 在 HTTP 世界里用的网址实际上是 URL——统一资源定位符(Uniform Resource Locator).

### 多说一点 URI

如下图片是完整的 URI 元素, 分别由协议名, 身份信息, 主机, 端口, 路径, 查询参数, 片段标识符构成.

![URI 的完整格式](https://edge.yancey.app/beg/ep0ihyd9-1646738692748.webp)

此外, URI 中只可以使用 ASCII 码, 对于其他字符会被转义, 具体操作就是直接把非 ASCII 码或特殊字符转换成十六进制字节值, 然后前面再加上一个 `%`.

## 什么是 MAC 地址?

媒体访问控制地址 (Media Access Control Address), 也称为局域网地址
(LAN Address), 以太网地址 (Ethernet Address) 或物理地址 (Physical Address), 它是一个用来确认网上设备位置的地址. ARP (Address Resolution Protocol) 是一种用来解析地址的协议, 它可以根据 IP 地址反查出对应的 MAC 地址.

下图展示了一台电脑内网 IP 和 MAC 地址. 在终端 (MAC OS 环境) 输入 `ifconfig`, 找到 `en0`, 便可查找本地以太网的信息.

![内网IP / MAC地址](https://edge.yancey.app/beg/t3m4u7g7-1648001081671.jpg)

那么什么是 MAC 地址呢? 我们知道 IP 地址是可变的, 可以通过各种方式分配 IP 地址给一个设备, 比如 DHCP, PPP, 静态 IP 等. 而 MAC 地址一般来讲是不会变的, 设备在生产时就被**烙**上了 `唯一的标识`, 这个 `唯一的标识` 就是 MAC 地址.

逼乎上有个很有趣的例子: 你中午在公司点了份外卖, 收货地址一定是写公司的地址; 晚上回到家, 再点外卖时就得把地址写成家 (IP 是动态的). 但无论在哪儿点外卖, 订单上的姓名和手机号一定是你自己的 (MAC 地址).

中午外卖小哥把午餐送到公司门口, 但收外卖的人肯定不止你一个 (多台设备在同一个 broadcast 网络里), 因此他会通过手机号和姓名来找到你.

## UDP 协议

用户数据报协议 (User Datagram Protocol), 又称使用者资料包协议, 是一个简单的面向数据报的传输协议. 在 TCP/IP 模型中, UDP 为网络层以上和应用层以下提供了一个简单的接口. UDP 只提供数据的 `不可靠传递`, 它一旦把应用程序发给网络层的数据发送出去, 就不保留数据备份. UDP 在 IP 数据报的头部仅仅加入了复用和数据校验 (字段).

它的特点如下:

- UDP 缺乏可靠性. UDP 本身不提供确认序号, 序列号, 超时重传等机制. UDP 数据报可能在网络中被复制, 被重新排序. 即 UDP 不保证数据报会到达其最终目的地, 也不保证各个数据报的先后顺序, 也不保证每个数据报只到达一次.

- UDP 头部开销小, 它包含以下几个数据:

  - 两个十六位的端口号, 分别是源端口和目的端口.

  - 整个数据报文的长度.

  - 整个数据报文的校验和, 用于发现头部信息和数据中的错误

- UDP 是面向无连接的. UDP 客户端和服务器之前不必存在长期的关系. UDP 发送数据报之前也不需要经过握手创建连接的过程.

- UDP 不仅支持单播, 还支持多播和广播.

![UDP 头部](https://edge.yancey.app/beg/9dtjgkil-1648001170483.jpeg)

基于 UDP 协议的有:

- 域名系统 (DNS)

- 简单网络管理协议 (SNMP)

- 动态主机配置协议 (DHCP)

- 路由信息协议 (RIP)

- 自举协议 (BOOTP)

- 简单文件传输协议 (TFTP)

## TCP 协议

TCP (Transmission Control Protocol, 传输控制协议) 是一种面向连接的, 可靠的, 基于字节流服务的传输层通信协议, 由 IETF 的 RFC 793 定义. 其中字节流服务 (Byte Stream Service) 是指为了方便传输, 将大块数据分割成以报文段 (segment) 为单位的数据包进行管理.

- TCP 提供一种面向连接的, 可靠的字节流服务

- 在一个 TCP 连接中, 仅有两方进行彼此通信. 广播和多播不能用于 TCP

- TCP 使用校验和, 确认和重传机制来保证可靠传输

- TCP 给数据分节进行排序, 并使用累积确认保证数据的顺序不变和非重复

- TCP 使用滑动窗口机制来实现流量控制, 通过动态改变窗口的大小进行拥塞控制

### TCP 报文

![TCP 报文](https://edge.yancey.app/beg/20170227111849763-0000.jpg)

**端口号**: 包括源端口号和目的端口号, 用来标识同一台计算机的不同的应用进程. TCP 报头中的源端口号和目的端口号同 IP 数据报中的源 IP 与目的 IP 唯一确定一条 TCP 连接.

- **源端口号**: 源端口和 IP 地址的作用是标识报文的返回地址.

- **目的端口号**: 目的端口指明接收方计算机上的应用程序接口.

**序号**: 它是当前报文段发送的数据组的第一个字节的序号. 在 TCP 传送的流中, 每一个字节一个序号. 比如一个报文段的序号为 300, 此报文段的数据部分共有 100 字节, 则下一个报文段的序号为 400. **序号** 确保了 TCP 传输的有序性.

**确认号**: 即 ACK(acknowledgement), 指明下一个期待收到的字节序号, 表明该序号之前的所有数据已经正确无误的收到. 确认号只有当 ACK 标志为 1 时才有效. 比如建立连接时, SYN 报文的 ACK 标志位为 0.

**首部长度**: 由于首部可能含有可选项内容, 因此 TCP 报头的长度是不确定的, 报头不包含任何任选字段则长度为 20 字节, 4 位首部长度字段所能表示的最大值为 1111, 转化为 10 进制为 15, 15\*32/8 = 60, **故报头最大长度为 60 字节**. 首部长度也叫数据偏移, 是因为首部长度实际上指示了数据区在报文段中的起始偏移值.

**保留**: 为将来定义新的用途保留, 现在一般置 0.

| 控制位                | 说明                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| URG                   | 紧急指针标志, 为 1 时表示紧急指针有效, 为 0 则忽略紧急指针.                                                                           |
| ACK (acknowledgement) | 确认序号标志, 为 1 时表示确认号有效, 为 0 表示报文中不含确认信息, 忽略确认号字段.                                                     |
| PSH                   | push 标志, 为 1 表示是带有 push 标志的数据, 指示接收方在接收到该报文段以后, 应尽快将这个报文段交给应用程序, 而不是在缓冲区排队.       |
| RST                   | 重置连接标志, 用于重置由于主机崩溃或其他原因而出现错误的连接. 或者用于拒绝非法的报文段和拒绝连接请求.                                 |
| SYN (synchronize)     | 同步序号, 用于建立连接过程, 在连接请求中, SYN=1 和 ACK=0 表示该数据段没有使用捎带的确认域, 而连接应答捎带一个确认, 即 SYN=1 和 ACK=1. |
| FIN (Finish)          | finish 标志, 用于释放连接, 为 1 时表示发送方已经没有数据发送了, 即关闭本方数据流.                                                     |

**窗口**: 滑动窗口大小, 用来告知发送端接受端的缓存大小, 以此控制发送端发送数据的速率, 从而达到流量控制. 窗口大小是一个 16bit 字段, 因此窗口大小最大为 65535.

**校验和**: 奇偶校验, 此校验和是对整个的 TCP 报文段, 包括 TCP 头部和 TCP 数据, 以 16 位字进行计算所得. 由发送端计算和存储, 并由接收端进行验证.

**紧急指针**: 只有当 URG 标志置 1 时紧急指针才有效. 紧急指针是一个正的偏移量, 和顺序号字段中的值相加表示紧急数据最后一个字节的序号. TCP 的紧急方式是发送端向另一端发送紧急数据的一种方式.

**选项和填充**: 最常见的可选字段是最长报文大小, 又称为 MSS (Maximum Segment Size), 每个连接方通常都在通信的第一个报文段 (为建立连接而设置 SYN 标志为 1 的那个段)中指明这个选项, 它表示本端所能接受的最大报文段的长度. 选项长度不一定是 32 位的整数倍, 所以要加填充位, 即在这个字段中加入额外的零, 以保证 TCP 头是 32 的整数倍.

**数据部分**: TCP 报文段中的数据部分是可选的. 在一个连接建立和一个连接终止时, 双方交换的报文段仅有 TCP 首部. 如果一方没有数据要发送, 也使用没有任何数据的首部来确认收到的数据. 在处理超时的许多情况中, 也会发送不带任何数据的报文段.

### TCP 建立连接 (三次握手)

- 我可以连你嘛?
- 可以.
- 那我连了.

emmmmm, 单身久了, 看三次握手都那么眉清目秀.

![上帝请赐给我一个女孩吧, 我会好好爱她的！](https://edge.yancey.app/beg/images.jpeg)

所谓三次握手 (three-way handshaking) 是指建立一个 TCP 连接时, 需要客户端和服务端共发送三个包. 它的目的是连接服务器指定端口, 建立 TCP 连接, 并同步双方的 `序列号` 和 `确认号`, 交换 TCP 窗口大小信息. 在 socket 编程中, 当客户端执行 connect() 函数时, 将触发三次握手.

- 第一次握手

  客户端首先发送一个 SYN 为 1 的包给服务端, 指明客户端要连接服务端的哪个接口以及初始序号 x. 发送完毕后, 客户端进入 `SYN_SEND` 状态.

- 第二次握手

  服务端收到后, 回传一个带有 SYN/ACK 的确认包以示应答. 即 SYN=1, ACK=1. 服务端选择自己的 ISN 序列号, 放到 seq 中, 同时将确认序号 ack 设置为客户端的 ISN+1, 即 x+1. 发送完毕后, 服务端进入 `SYN_RCVD (同步收到)` 状态.

- 第三次握手

  客户端收到确认后, 再次发送一个带 ACK 标志的数据包. 即 ACK=1, ack=y+1, 并将自己的序列号 seq=x+1. 发送完毕后, 客户端和服务器双双进入 `ESTABLISHED` 状态. 至此, 三次握手结束.

![三次握手](https://edge.yancey.app/beg/20170607205709367.jpg)

### TCP 关闭连接 (四次挥手)

- 客户端: 我要睡了
- 服务端: 嗯, 睡吧, 晚安
- 服务端: 我也要睡了
- 客户端: 晚安, 好梦

TAT, 好虐.

![上帝请赐给我一个女孩吧, 我会好好爱她的！](https://edge.yancey.app/beg/images.jpeg)

- 第一次挥手

  客户端调用 close() 函数, 并发送一个 FIN (finish) 标志为 1 的数据包给服务端, 来表示本方的数据已经全部发送完毕, 此时客户端进入 `FIN-WAIT-1` 状态. TCP 规定, FIN 报文段即使不携带数据, 也要消耗一个序号.

- 第二次挥手

  服务端收到客户端的释放报文后, 发出确认报文, 其中 ACK=1, ack=u+1, 并且带上自己的序列号 seq=v. 表明自己接受到了客户端关闭连接的请求, 但还没准备好关闭连接 (半关闭状态), **也就是说客户端已经没有数据要发送了, 但服务端仍有可能会发送数据**. 发送完毕后, 服务端进入 `CLOSE_WAIT` 状态.

  当客户端收到该报文后, 客户端就进入 `FIN-WAIT-2` 状态, 等待服务器发送连接释放报文.

- 第三次挥手

  服务器端准备好关闭连接时, 会向客户端发送一个连接释放报文, 其中 FIN=1, ack=u+1. 由于在半关闭状态, 服务器很可能又发送了一些数据, 假定此时的序列号为 seq=w. 发送完毕后, 服务端便进入 `LAST-ACK`(最后确认) 状态.

- 第四次挥手

  客户端收到服务器的连接释放报文后, 需要发送一个确认包, 其中 ACK=1, ack=w+1, 而自己的序列号是 seq=u+1, 并进入了 `TIME-WAIT` (时间等待)状态, 等待过程可能出现的要求重传的 ACK 包.

  此时 TCP 连接还没有释放, 必须经过 2 \* MSL (Maximum Segment Lifetime, 最长报文段寿命) 时间后, 当客户端撤销相应的 TCB 后, 才会进入 `CLOSED` 状态.

  而服务器只要收到了客户端发出的确认, 立即进入 `CLOSED` 状态. 同样, 撤销 TCB 后, 就结束了这次的 TCP 连接. 因此, 服务器结束 TCP 连接的时间要比客户端早一些.

![四次挥手](https://edge.yancey.app/beg/20170606084851272.png)

## 短连接和长连接

在 HTTP 0.9 和 1.0 的时候, 因为客户端与服务器的整个连接过程很短暂, 不会与服务器保持长时间的连接状态, 所以就被称为**短连接**(short-lived connections). 早期的 HTTP 协议也被称为是**无连接**的协议.

短连接的缺点相当严重, 因为在 TCP 协议里, 建立连接和关闭连接都是非常**昂贵**的操作. TCP 建立连接要有**三次握手**, 发送 3 个数据包, 需要 1 个 RTT(round trip time, 往返时间, 实在第三次握手时客户端就可以发送数据了, 这种情况下是 1 个 RTT); 关闭连接是**四次挥手**, 4 个数据包需要 2 个 RTT. 所以说很大一部分时间浪费在协议确认上.

针对短连接暴露出的缺点, HTTP 协议就提出了**长连接**的通信方式, 也叫**持久连接**(persistent connections), **连接保活**(keep alive), **连接复用**(connection reuse). 其实解决办法也很简单, 用的就是**成本均摊**的思路, 既然 TCP 的连接和关闭非常耗时间, 那么就把这个时间成本由原来的一个**请求 - 应答**均摊到多个**请求 - 应答**上.

![短连接 vs 长连接](https://edge.yancey.app/beg/wwbl3aj2-1647246703723.webp)

### 连接相关的头字段

在 HTTP/1.1 中的连接都会默认启用长连接. 不需要用什么特殊的头字段指定, 只要向服务器发送了第一次请求, 后续的请求都会重复利用第一次打开的 TCP 连接, 也就是长连接, 在这个连接上收发数据. 当然你也也可在请求头中指定 **Connection: keep-alive**.

不过长连接一直不关闭也不好, 因为服务器必须在内存里保存它的状态, 这就占用了服务器的资源. 在客户端可手动通过 **Connection: close** 告诉服务端在这次通信后就关闭连接.

服务端通常不会主动关闭连接, 但 Nginx 有两种方式:

- 使用**keepalive_timeout**指令, 设置长连接的超时时间, 如果在一段时间内连接上没有任何数据收发就主动断开连接, 避免空闲连接占用系统资源.
- 使用**keepalive_requests**指令, 设置长连接上可发送的最大请求次数. 比如设置成 1000, 那么当 Nginx 在这个连接上处理了 1000 个请求后, 也会主动断开连接.

## 队头阻塞

**队头阻塞**与短连接和长连接无关, 而是由 HTTP 基本的**请求 - 应答**模型所导致的. 因为 HTTP 规定报文必须是**一发一收**, 这就形成了一个先进先出的**串行**队列. 队列里的请求没有轻重缓急的优先级, 只有入队的先后顺序, 排在最前面的请求被最优先处理.

如果队首的请求因为处理的太慢耽误了时间, 那么队列里后面的所有请求也不得不跟着一起等待, 结果就是其他的请求承担了不应有的时间成本. 换句话说, 一个数据因为网络故障或者其他原因而丢包了, 那么整个 TCP 的连接就会处于暂停状态, 需要等待丢失的数据包被重新传输过来.

我们就把在 TCP 传输过程中, 由于单个数据包的丢失而造成的阻塞称为 TCP 上的队头阻塞.

![队头阻塞](https://edge.yancey.app/beg/i5sc8fnw-1651046094657.webp)

### 优化队头阻塞

因为**请求-应答**的模型不能变, 所以只能通过数量来改善质量问题.

第一种方式是通过**并发连接(concurrent connections)**, 也就是同时对一个域名发起多个长连接, 但缺点是如果每个客户端都想自己快, 建立很多个连接, **用户数 \* 并发数**就会是个天文数字. 服务器的资源根本就扛不住. 因此 RFC2616 里明确限制每个客户端最多并发 2 个连接, 不过这个太小了, 后面浏览器把上限提高到 6 - 8.

第二种方式是域名分片, 比如让原本 www.yanceyleo.com 指向的服务器, 开通多个域名 如 1.yanceyleo.com, 2.yanceyleo.com... 都指向这个服务器, 那么每个域名都可以开启自己的长连接, 自然长连接数量就上了去了.

## TCP 和 UDP 的对比

|              | UDP                                        | TCP                                    |
| ------------ | ------------------------------------------ | -------------------------------------- |
| 是否连接     | 无连接                                     | 面向连接                               |
| 是否可靠     | 不可靠传输, 不使用流量控制和拥塞控制       | 可靠传输, 使用流量控制和拥塞控制       |
| 连接对象个数 | 支持一对一, 一对多, 多对一和多对多交互通信 | 只能是一对一通信                       |
| 传输方式     | 面向报文                                   | 面向字节流                             |
| 首部开销     | 首部开销小, 仅 8 字节                      | 首部最小 20 字节, 最大 60 字节         |
| 适用场景     | 适用于实时应用 (IP 电话, 视频会议, 直播等) | 适用于要求可靠传输的应用, 例如文件传输 |

## 浅谈 CDN

在谈 CDN 之前, 先谈一谈为什么要有网络加速.

首先, 虽然光速很快, 真空可达 30 万公里/秒, 但在光缆环境下会衰减到 20 万公里/秒, 北京到广东距离 2000 公里, 往返就有了 20 毫秒的消耗.

第二, 互联网从逻辑上看是一张大网, 但实际上是由许多小网络组成的, 这其中就有小网络**互连互通**的问题, 典型的就是各个电信运营商的网络, 比如国内的电信, 联通, 移动三大家. 这些小网络内部的沟通很顺畅, 但网络之间却只有很少的联通点. 因此跨运营商的带宽会很小, 进而减弱连接速度. 下面这个图片想必大家都很熟悉, 下载站会根据你的 IP 来建议你使用哪家运营商的下载节点.

![互连互通](https://edge.yancey.app/beg/2gycpxpv-1649108168484.jpg)

此外, 网络中还存在许多的路由器, 网关, 数据每经过一个节点, 都要停顿一下, 在二层, 三层解析转发, 这也会消耗一定的时间, 带来延迟. 把这些因素再放到全球来看, 地理距离, 运营商网络, 路由转发的影响就会成倍增加.

这个时候 CDN 就出现了, 它就是专门为解决**长距离**上网络访问速度慢而诞生的一种网络应用服务.

### 什么是 CDN

CDN 全称为内容分发网络 (Content Delivery Network), 它会同步源站点的内容并负责响应用户的访问请求, 并且实时地根据网络流量和各节点的连接, 负载状况以及到用户的距离和响应时间等综合信息将用户的请求重新导向离用户最近的服务节点上, 以提高用户访问网站的相应速度. 通俗来讲, 原本用户访问的资源是存放在你自己的服务器, 而现在访问的资源来自 CDN 缓存服务器. 在实际操作中, 我们只需要将域名的 DNS 解析指向 CDN 服务商提供的域名服务器即可.

为了用户更快地就近访问资源, 这需要 CDN 厂商在世界各地部署大量拥有高存储高带宽的节点, 构建了一个专用网络. 这个网络是跨运营商, 跨地域的, 虽然内部也划分成多个小网络, 但它们之间用高速专有线路连接, 是真正的**信息高速公路**, 基本上可以认为不存在网络拥堵.

有了这个高速的专用网之后, CDN 就要**分发**源站的**内容**, 通过**缓存代理**技术. 使用**推**或者**拉**的手段, 把源站的内容逐级缓存到网络的每一个节点上. 于是, 用户在上网的时候就不直接访问源站, 而是访问离他**最近的**一个 CDN 节点, 即**边缘节点**(edge node). 这些边缘节点就是缓存了源站内容的代理服务器, 这样一来就省去了**长途跋涉**的时间成本, 实现了**网络加速**.

当然, 只有静态资源才能够被缓存加速, 就近访问, 而动态资源只能由源站实时生成, 即使缓存了也没有意义. 不过, 如果动态资源指定了 **Cache-Control**, 允许缓存短暂的时间, 那它在这段时间里也就变成了**静态资源**, 可以被 CDN 缓存加速.

![CDN 流程](https://edge.yancey.app/beg/4edc00b0-dcb9-11e6-9663-ed19a3fa3182.png)

### CDN 的负载均衡系统

全局负载均衡(Global Sever Load Balance)一般简称为 GSLB, 主要的职责是当用户接入网络的时候在 CDN 专网中挑选出一个**最佳**节点提供服务, 解决的是用户如何找到**最近的**边缘节点, 对整个 CDN 网络进行**负载均衡**.

GSLB 最常见的实现方式是**DNS 负载均衡**. 原来没有 CDN 的时候, 权威 DNS 返回的是网站自己服务器的实际 IP 地址, 浏览器收到 DNS 解析结果后直连网站.

但加入 CDN 后就不一样了, 权威 DNS 返回的不是 IP 地址, 而是一个 CNAME( Canonical Name ) 别名记录, 指向的就是 CDN 的 GSLB. 它有点像是 HTTP/2 里 **Alt-Svc** 的意思, 告诉外面: **我这里暂时没法给你真正的地址, 你去另外一个地方再查查看吧.**

因为没拿到 IP 地址, 于是本地 DNS 就会向 GSLB 再发起请求, 这样就进入了 CDN 的全局负载均衡系统, 开始**智能调度**, 主要的依据有这么几个:

- 看用户的 IP 地址, 查表得知地理位置, 找相对最近的边缘节点;
- 看用户所在的运营商网络, 找相同网络的边缘节点;
- 检查边缘节点的负载情况, 找负载较轻的节点;
- 其他, 比如节点的**健康状况**, 服务能力, 带宽, 响应时间等.

GSLB 把这些因素综合起来, 找出一台**最合适**的边缘节点, 把这个节点的 IP 地址返回给用户, 用户就可以**就近**访问 CDN 的缓存代理了.

### CDN 的缓存代理

缓存系统是 CDN 的另一个关键组成部分, 它需要将源站的资源缓存起来, 以便用户可以从 CDN 的缓存代理中访问到. 这里就有两个 CDN 的关键概念: **命中**和**回源**. **命中**就是指用户访问的资源恰好在缓存系统里, 可以直接返回给用户; **回源**则正相反, 缓存里没有, 必须用代理的方式回源站取.

相应地, 也就有了两个衡量 CDN 服务质量的指标: **命中率**和**回源率**. 命中率就是命中次数与所有访问次数之比, 回源率是回源次数与所有访问次数之比. 显然, 好的 CDN 应该是命中率越高越好, 回源率越低越好. 现在的商业 CDN 命中率都在 90% 以上. 为了提高命中率就有了以下策略:

首先, 最基本的方式就是在存储系统上下功夫, 硬件用高速 CPU, 大内存, 万兆网卡, 再搭配 TB 级别的硬盘和快速的 SSD. 软件方面则不断**求新求变**, 各种新的存储软件都会拿来尝试, 比如 Memcache, Redis, Ceph, 尽可能地高效利用存储, 存下更多的内容.

其次, 缓存系统也可以划分出层次, 分成一级缓存节点和二级缓存节点. 一级缓存配置高一些, 直连源站, 二级缓存配置低一些, 直连用户. 回源的时候二级缓存只找一级缓存, 一级缓存没有才回源站, 这样最终**扇入度**就缩小了, 可以有效地减少真正的回源.

第三个就是使用高性能的缓存服务, 最常用的是专门的缓存代理软件 Squid, Varnish, 还有新兴的 ATS(Apache Traffic Server), 而 Nginx 和 OpenResty 作为 Web 服务器领域的**多面手**, 凭借着强大的反向代理能力和模块化, 易于扩展的优点, 也在 CDN 里占据了不少的份额.

### CDN 节点有缓存场景

HTTP 请求流程说明:

1, 用户在浏览器输入要访问的网站域名, 向本地 DNS 发起域名解析请求.

2, 域名解析的请求被发往网站授权 DNS 服务器.

3, 网站 DNS 服务器解析发现域名已经 CNAME 到了www.example.com.c.cdnhwc1.com.

4, 请求被指向 CDN 服务.

5, CDN 对域名进行智能解析, 将响应速度最快的 CDN 节点 IP 地址返回给本地 DNS.

6, 用户获取响应速度最快的 CDN 节点 IP 地址.

7, 浏览器在得到速度最快节点的 IP 地址以后, 向 CDN 节点发出访问请求.

8, CDN 节点将用户所需资源返回给用户.

![CDN 节点有缓存场景](https://edge.yancey.app/beg/1stjz9h17j-1625718576105)

### CDN 节点无缓存场景

HTTP 请求流程说明:

1, 用户在浏览器输入要访问的网站域名, 向本地 DNS 发起域名解析请求.

2, 域名解析的请求被发往网站授权 DNS 服务器.

3, 网站 DNS 服务器解析发现域名已经 CNAME 到了www.example.com.c.cdnhwc1.com.

4, 请求被指向 CDN 服务.

5, CDN 对域名进行智能解析, 将响应速度最快的 CDN 节点 IP 地址返回给本地 DNS.

6, 用户获取响应速度最快的 CDN 节点 IP 地址.

7, 浏览器在得到速度最快节点的 IP 地址以后, 向 CDN 节点发出访问请求.

8, CDN 节点回源站拉取用户所需资源.

9, 将回源拉取的资源缓存至节点.

10, 将用户所需资源返回给用户.

![CDN 节点无缓存场景](https://edge.yancey.app/beg/rdyzbar2ky-1625718616181)

## 几道面试题

### 三次握手和四次挥手详细介绍 (重点)

见上文.

### TCP 有哪些手段保证可靠交付

TCP 通过建立连接(三次握手), 传输数据和断开连接(四次挥手).

- 为了方便传输, TCP 协议将大块数据分割成以报文段为单位的数据块进行管理.

- 当 TCP 发出一个报文段时, 它会启动一个定时器, 等待目的端确认收到这个报文段. 如果不能及时收到一个确认, 就会认为丢失, 将重发这个报文段.

- 当收到来自另一端的数据时, 它会发送一个确认, 但该确认不是立即发送的, 之所以推迟, 是要对包做完整校验.

- TCP 通过检验 `校验和` 的方式来检测数据的准确性, 当检测到数据出错后, 会丢给客户端一个携带 ACK 标志的包, 当客户端收到后会重现发送一遍数据包.

- TCP 协议给每一个字节设置一个序号, 序号确保了 TCP 传输的有序性, 当报文段出现失序的问题, TCP 会根据序号重新排序.

- IP 数据报有可能会发生重复, TCP 接收端会丢弃重复的数据.

- TCP 提供流量控制. TCP 连接的每一方都有固定大小的缓冲空间, TCP 的接收端只允许另一端发送接收端缓冲区所能接纳的数据. TCP 使用的流量控制协议是可变大小的滑动窗口协议.

### 为什么是三次握手, 两次不行吗?

为了实现可靠数据传输, TCP 协议的通信双方, 都必须维护一个序列号, 以标识发送出去的数据包中, 哪些是已经被对方收到的. 三次握手的过程即是通信双方相互告知序列号起始值, 并确认对方已经收到了序列号起始值的必经步骤

如果只是两次握手, 至多只有连接发起方的起始序列号能被确认, 另一方选择的序列号则得不到确认.

### 如果已经建立了连接, 但是客户端突然出现故障了怎么办?

TCP 还设有一个保活计时器 (keep-alive), 如果客户端出现故障, 服务器不能一直等下去, 白白浪费资源. 服务器每收到一次客户端的请求后都会重新复位这个计时器, 时间通常是设置为 2 小时, 若两小时还没有收到客户端的任何数据, 服务器就会发送一个探测报文段, 以后每隔 75 秒发送一次. 若一连发送 10 个探测报文仍然没反应, 服务器就认为客户端出了故障, 接着就关闭连接.

### DNS 解析流程 (重点)

见上文.

## 最后

欢迎关注我的微信公众号: 进击的前端

![进击的前端](https://edge.yancey.app/beg/qrcode_for_gh_541158abcb21_344.jpg)

## 参考

《图解 HTTP》 -- 上野 宣

[TCP 和 UDP](https://juejin.im/post/583d2d6a67f356006bb7d535)

[有了 IP 地址, 为什么还要用 MAC 地址?](https://www.zhihu.com/question/21546408)

[[面试 ∙ 网络] TCP/IP (四): TCP 与 UDP 协议简介](https://juejin.im/post/5a2ff1f36fb9a04500030771)

[TCP 报文格式详解](https://blog.csdn.net/Mary19920410/article/details/58030147)

[TCP 和 UDP 比较](https://juejin.im/post/5c6fbf54f265da2db718216a)

[hit-alibaba TCP](https://hit-alibaba.github.io/interview/basic/network/TCP.html)

[TCP 的三次握手与四次挥手 (详解+动图)](https://blog.csdn.net/qzcsu/article/details/72861891)

[当我们谈网络时, 我们谈些什么 (4)-- TCP 和 UDP](https://segmentfault.com/a/1190000004138638)

[DNS 协议详解及报文格式分析](https://jocent.me/2017/06/18/dns-protocol-principle.html)

[DNS 请求报文详解](https://juejin.im/post/5ab719c151882577b45ef9d9)

[深入理解 Http 请求, DNS 劫持与解析.](https://juejin.im/post/59ba146c6fb9a00a4636d8b6)

[CDN 与 DNS 知识汇总](http://hpoenixf.com/DNS%E4%B8%8ECDN%E7%9F%A5%E8%AF%86%E6%B1%87%E6%80%BB.html)
