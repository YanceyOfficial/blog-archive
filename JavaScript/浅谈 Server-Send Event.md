# 浅谈 Server-Sent Events

> 前几天看到 Twitter 点赞区域蹦哒的很可爱, 于是乎想研究研究怎么实现的. 一开始下意识以为是 WebSocket, 但是在控制台死活没找到相关的信息, 去 stackoverflow 问了下原来是 Server-Sent Events, 本文对此做个介绍.

![Screen Shot 2021-03-21 at 10.45.19 PM.png](https://static.yancey.app/Screen%20Shot%202021-03-21%20at%2010.45.19%20PM.png)

## 什么是 Server-Sent Events

Server-Sent Events 是一种服务器推送技术, 使客户端可以通过 **HTTP 连接**从服务器自动接收更新. 每个通知以**文本流(文本应该为 utf-8)**的形式发送, 并以一对**换行符**结尾. 与 WebSocket 相比:

1. 它不是全双工的, 只能服务器向浏览器发送, 因为流信息本质上就是下载, 一旦连接后不能再次发送请求(否则就变成了一次新的连接)
2. WebSocket 使用的 ws 协议, 而 SSE 使用的仍然是 HTTP 协议.

## SSE 的特点

这里直接抄袭阮一峰聚聚的:

- SSE 使用 HTTP 协议, 现有的服务器软件都支持. WebSocket 是一个独立协议.
- SSE 属于轻量级, 使用简单；WebSocket 协议相对复杂.
- SSE 默认支持断线重连, WebSocket 需要自己实现.
- SSE 一般只用来传送文本, 二进制数据需要编码后传送, WebSocket 默认支持传送二进制数据.
- SSE 支持自定义发送的消息类型.

## 来个例子

无码言屌, 下面我们通过一个例子来演示怎么使用 SSE. 首先看客户端的代码, 通过 new 一个 EventSource 来创建 SSE 实例, 第一个参数为后端接口, 第二个 option 参数只有一个 `withCredentials`, 如果为 true, 在跨域的情况下, 可被允许发送 cookie.

```ts
const evtSource = new EventSource("http://localhost:3002/sse", {
  withCredentials: true,
});
```

EventSource 可以监听三种事件, 分别是 `onopen`, `onmessage`, `onerror`, 第一个和第三个不用多说, 分别是**建立连接成功**和**建立连接失败**(CORS 或者请求超时等等). 而 `onmessage` 最重要, 它用来监听每次推送的信息流.

因为 SSE 接收的只能是 utf-8 的纯文本, 因此最通用的做法是后端传递一个 **JSON 字符串**. 下面的代码中, 每次接收到新的推送, 就会打印出 like_count, 直到 like_count > 10, 客户端会主动要求服务端停止推送.

```ts
interface Data {
  payload: { like_count: number };
}

evtSource.addEventListener("message", (e: MessageEvent) => {
  const {
    payload: { like_count },
  }: Data = JSON.parse(e.data);

  console.log(like_count);

  if (like_count > 10) {
    evtSource.close();
  }
});
```

上面基本就是客户端要做的事情了, 很简单, 下面看下服务端的. 因为 nestjs 封装了对 SSE 的支持, 这里就用这个框架搞下.

事件流仅仅是一个简单的文本数据流, 文本应该使用 UTF-8 格式的编码. 每条消息后面都由一个空行作为分隔符. 每条消息是由多个字段组成的, 每个字段由**字段名, 一个冒号, 以及字段值组成**.

规范中支持四个字段, 分别是:

- event: 该字段为 onmessage 的子集, 也就是说你可以通过 `evtSource.addEventListener("customEvt", () => {}` 来细粒度监听指定 event 的推送.

- data: 也就是传递的实体, 如果该条消息包含多个 data 字段, 则客户端会用换行符把它们连接成一个字符串来作为字段值.

- id 可以给每次推送增加一个 id 标识, 比如是 tweetId, 这样就可以把实体中的 likeCount 跟 tweetId 一一映射.

- retry: 指定浏览器重新发起连接的时间间隔, 它是一个整数值, 指定了重新连接的时间(单位为毫秒), 如果不是正整数将被忽略

此外, 以冒号开头的行为注释行, 会被忽略, 注释行可以用来防止连接超时, 服务器可以定期发送一条消息注释行, 以保持连接不断.

```ts
: just a comment\n\n

id: 12345\n
event: addLikeCount\n
retry: 10000\n
data: {\n
data: "likeCount": 1,\n
data: }\n\n
```

下面直接看后端代码实现, 由于 nestjs 实现 SSE 必须用 rxjs, 所以得有点儿相关基础. 代码中每两秒吐出一次数据, 由于 nestjs 会将 data 转化为 SSE 想要的结构, data 直接写成对象即可.

```ts
import { Injectable } from "@nestjs/common";
import { interval } from "rxjs";
import { map } from "rxjs/operators";
import { randomSeries } from "yancey-js-util";

@Injectable()
export class SSEService {
  public sse() {
    let count = 1;
    return interval(2000).pipe(
      map((_) => ({
        id: randomSeries(6),
        type: "addLikeCount",
        data: { payload: { tweetId: randomSeries(6), likeCount: count++ } },
        retry: 10000,
      }))
    );
  }
}
```

如果没什么意外, 前端就可以看到 stream 了.

![Screen Shot 2021-03-21 at 11.36.29 PM.png](https://static.yancey.app/Screen%20Shot%202021-03-21%20at%2011.36.29%20PM.png)

分析下响应头, 很重要的两个标志是禁止了缓存, 并且 `Content-Type: text/event-stream`.

![Screen Shot 2021-03-21 at 11.37.55 PM.png](https://static.yancey.app/Screen%20Shot%202021-03-21%20at%2011.37.55%20PM.png)

## GraphQL 是否支持?

![Screen Shot 2021-03-21 at 11.49.43 PM.png](https://static.yancey.app/Screen%20Shot%202021-03-21%20at%2011.49.43%20PM.png)

Emmmm, 似乎不支持, 不过 GraphQL 本身已经有了强大的 Subscriptions 系统, 也没必要支持这些玩意儿了(毕竟去年 GraphQL 支持个上传还不利索, 逃).

## Can I use SSE?

Emmmm, 除了某浏览器, 都可以用.

![Screen Shot 2021-03-21 at 10.40.10 PM.png](https://static.yancey.app/Screen%20Shot%202021-03-21%20at%2010.40.10%20PM.png)

## 其他

突然想到, 我在后端配置了 rateLimit. 那么前端如此频繁的获取数据, 会触发 rateLimit 吗? 答案是不会的, 因为 SSE 始终只是一条 HTTP 请求, 而 rateLimit 限制的只是重复请求.

```ts
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);
```

## 奉上全部代码

```ts
// 前端部分

// SSE.tsx
import { FC, useState, useEffect } from "react";

interface CustomEvent extends Event {
  data: string;
}

interface Data {
  payload: {
    likeCount: number;
  };
}

const SSE: FC = () => {
  const [like, setLike] = useState(0);

  const initialSSE = () => {
    const evtSource = new EventSource("http://localhost:3002/sse", {
      withCredentials: true,
    });

    evtSource.addEventListener("open", () => {
      console.log("已开启");
    });

    // 这里使用的便是自定义事件
    evtSource.addEventListener("addLikeCount", ((e: CustomEvent) => {
      const {
        payload: { likeCount },
      }: Data = JSON.parse(e.data);

      setLike(likeCount);

      if (likeCount > 10) {
        evtSource.close();
      }
    }) as EventListener);

    evtSource.addEventListener("message", (e: MessageEvent) => {});

    evtSource.addEventListener("error", (err: Event) => {
      console.log(err);
    });
  };

  useEffect(() => {
    initialSSE();
  }, []);

  return <div>{like}</div>;
};

export default SSE;

// 后端部分

// sse.module.ts
import { Module } from "@nestjs/common";
import { SSEController } from "./sse.controller";
import { SSEService } from "./sse.service";

@Module({
  controllers: [SSEController],
  providers: [SSEService],
})
export class SSEModule {}

// sse.controller.ts
import { Controller, MessageEvent, Sse } from "@nestjs/common";
import { Observable } from "rxjs";
import { SSEService } from "./sse.service";

@Controller()
export class SSEController {
  constructor(private readonly sseService: SSEService) {
    this.sseService = sseService;
  }

  @Sse("sse")
  public sse(): Observable<MessageEvent> {
    return this.sseService.sse();
  }
}

// sse.service.ts
import { Injectable } from "@nestjs/common";
import { interval } from "rxjs";
import { map } from "rxjs/operators";
import { randomSeries } from "yancey-js-util";

@Injectable()
export class SSEService {
  public sse() {
    let count = 1;
    return interval(2000).pipe(
      map((_) => ({
        id: randomSeries(6),
        type: "addLikeCount",
        data: { payload: { tweetId: randomSeries(6), likeCount: count++ } },
        retry: 10000,
      }))
    );
  }
}
```

## 参考

- [Using server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#event_stream_format)
- [Server-Sent Events 教程](https://www.ruanyifeng.com/blog/2017/05/server-sent_events.html)
