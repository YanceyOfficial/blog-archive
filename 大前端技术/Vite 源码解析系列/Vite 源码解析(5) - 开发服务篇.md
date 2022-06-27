# Vite 源码解析(5) - 开发服务篇

> 我们在解析完配置, 创建了插件容器之后, 要想运行一个开发环境, 并且持续的给客户端发送热更新 module, 开发服务是必不可少的, 本篇我们来讲一讲 vite 的开发 server 环境, 中间件机制, 以及如何监听文件的改动, 并通过 ws 发送给客户端的. 值得注意的是, 早期 vite 用的 koa 一把梭, 到了后面开始自己卷了个开发服务, 整体大同小异, 下面我们来逐一分析下.

## resolveHttpsConfig

```ts
// https 配置, 主要是证书
const httpsOptions = await resolveHttpsConfig(
  config.server.https,
  config.cacheDir
);
let { middlewareMode } = serverConfig;
if (middlewareMode === true) {
  middlewareMode = "ssr";
}
```

首先 vite 的开发环境是支持 https 的, 虽然绝大多数我们是用 localhost 的, 不过有些场景, 比如你依赖的三方服务, 必须使用 https, 否则没法调试, 那你就得支持 https 了.

该函数接收两个参数, 第一个 `ServerOptions` 是 node 标准库 https 的配置, 签名如下; 第二个是缓存文件的目录.

```ts
type ServerOptions = tls.SecureContextOptions &
  tls.TlsOptions &
  http.ServerOptions;
```

整个函数简单来讲就是你在配置里传了证书没, 没传就去缓存文件里找, 最后返回配置.

```ts
export async function resolveHttpsConfig(
  https: boolean | HttpsServerOptions | undefined,
  cacheDir: string
): Promise<HttpsServerOptions | undefined> {
  if (!https) return undefined;

  const httpsOption = isObject(https) ? { ...https } : {};

  const { ca, cert, key, pfx } = httpsOption;
  Object.assign(httpsOption, {
    ca: readFileIfExists(ca),
    cert: readFileIfExists(cert),
    key: readFileIfExists(key),
    pfx: readFileIfExists(pfx),
  });
  if (!httpsOption.key || !httpsOption.cert) {
    httpsOption.cert = httpsOption.key = await getCertificate(cacheDir);
  }
  return httpsOption;
}
```

`getCertificate` 就是用来获取缓存路径中的证书的, 如果没有, 就会调用 [`createCertificate`](https://github.com/jfromaniello/selfsigned/blob/da38146f8d02183c35f49f91659a744a243e8707/index.js) 生成一个新的自签名证书, 这个不多说了, 毕竟不咋会, 匿了匿了. 总之 vite 就是一条龙服务, 你有就用你的, 顺带帮你验证下证书过没过期, 如果你没提供证书, 还帮你搞个自签名, 老铁们给尤雨溪双击 666.

```ts
async function getCertificate(cacheDir: string) {
  const cachePath = path.join(cacheDir, "_cert.pem");

  try {
    const [stat, content] = await Promise.all([
      fsp.stat(cachePath),
      fsp.readFile(cachePath, "utf8"),
    ]);

    if (Date.now() - stat.ctime.valueOf() > 30 * 24 * 60 * 60 * 1000) {
      throw new Error("cache is outdated.");
    }

    return content;
  } catch {
    const content = (await import("./certificate")).createCertificate();
    fsp
      .mkdir(cacheDir, { recursive: true })
      .then(() => fsp.writeFile(cachePath, content))
      .catch(() => {});
    return content;
  }
}
```

## resolveHttpServer

```ts
// 一个三方库, 用于创建中间件
const middlewares = connect() as Connect.Server;
const httpServer = middlewareMode
  ? null
  : await resolveHttpServer(serverConfig, middlewares, httpsOptions);
```

下面是创建 http server, 如果是 http, 就直接用 `node:http` 的 `createServer`; 否则就是 https, 那么优先用 `node:http2`, 因为我们知道 http2 强制使用 https 的, 当然如果是代理, 就用 `node:https`. 看了一下 [issue](https://github.com/vitejs/vite/issues/484) 是这样解释的:

> http-proxy (The underlying module which vite uses for proxy) does not support http2. You cannot use https with proxy as vite is now using Http2.

```ts
export async function resolveHttpServer(
  { proxy }: CommonServerOptions,
  app: Connect.Server,
  httpsOptions?: HttpsServerOptions
): Promise<HttpServer> {
  if (!httpsOptions) {
    const { createServer } = await import("http");
    return createServer(app);
  }

  // #484 fallback to http1 when proxy is needed.
  if (proxy) {
    const { createServer } = await import("https");
    return createServer(httpsOptions, app);
  } else {
    const { createSecureServer } = await import("http2");
    return createSecureServer(
      {
        // Manually increase the session memory to prevent 502 ENHANCE_YOUR_CALM
        // errors on large numbers of requests
        maxSessionMemory: 1000,
        ...httpsOptions,
        allowHTTP1: true,
      },
      // @ts-expect-error TODO: is this correct?
      app
    ) as unknown as HttpServer;
  }
}
```

## createWebSocketServer

```ts
const ws = createWebSocketServer(httpServer, config, httpsOptions);
```

当我们改动源码时, chokidar 会监听到文件变化, 然后交给 rollup 去做编译, 当编译完成后就要通知到前端进行热更新, 那么我们就需要一个 websocket 的服务, vite 使用了 [ws](https://github.com/websockets/ws) 这个库, 而 `createWebSocketServer` 基本就是 ws 的封装.

当然要补充一个小知识, 就是 ws 的开启需要用 http 做为引导, http 返回 101 状态码后方可升级成 ws.

```ts
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
```

整个函数因为不复杂, 我们直接在源码上写注释.

```ts
export function createWebSocketServer(
  server: Server | null,
  config: ResolvedConfig,
  httpsOptions?: HttpsServerOptions
): WebSocketServer {
  let wss: WebSocketServerRaw;
  let httpsServer: Server | undefined = undefined;

  const hmr = isObject(config.server.hmr) && config.server.hmr;
  // 用户可以自行提供一个 server, 不过一般不会这么玩
  const hmrServer = hmr && hmr.server;
  const hmrPort = hmr && hmr.port;
  // TODO: the main server port may not have been chosen yet as it may use the next available
  const portsAreCompatible = !hmrPort || hmrPort === config.server.port;
  const wsServer = hmrServer || (portsAreCompatible && server);
  // 监听器, key 是事件名, value 是 WebSocketCustomListener 格式的集合
  const customListeners = new Map<string, Set<WebSocketCustomListener<any>>>();
  const clientsMap = new WeakMap<WebSocketRaw, WebSocketClient>();

  if (wsServer) {
    wss = new WebSocketServerRaw({ noServer: true });
    // 如果用户自行提供了 http server, 那么监听到 101 状态码, 就升级成 ws
    wsServer.on("upgrade", (req, socket, head) => {
      // 如果 sec-websocket-protocol 为 vite-hmr, 也就是 vite 的热更新协议, 那么就接受
      // 这块代码写的很严谨, 为了防止恰好命中了其他 http 过来的 101
      if (req.headers["sec-websocket-protocol"] === HMR_HEADER) {
        // 升级完协议后就正式连接到 ws 了
        wss.handleUpgrade(req, socket as Socket, head, (ws) => {
          wss.emit("connection", ws, req);
        });
      }
    });
  } else {
    const websocketServerOptions: ServerOptions = {};
    const port = hmrPort || 24678;
    const host = (hmr && hmr.host) || undefined;
    if (httpsOptions) {
      // if we're serving the middlewares over https, the ws library doesn't support automatically creating an https server, so we need to do it ourselves
      // create an inline https server and mount the websocket server to it
      // 因为 ws 没提供 https 的 server, 需要自己起一个
      httpsServer = createHttpsServer(httpsOptions, (req, res) => {
        // 426 Upgrade Required 表示服务器拒绝处理客户端使用当前协议发送的请求, 但是可以接受其使用升级后的协议发送的请求
        // 不过 STATUS_CODES[statusCode] 这个操作没搞懂, 我给提 pr 那哥们留了个 comment, 先留个 TODO:
        const statusCode = 426;
        const body = STATUS_CODES[statusCode];
        if (!body)
          throw new Error(
            `No body text found for the ${statusCode} status code`
          );

        res.writeHead(statusCode, {
          "Content-Length": body.length,
          "Content-Type": "text/plain",
        });
        res.end(body);
      });

      httpsServer.listen(port, host);
      websocketServerOptions.server = httpsServer;
    } else {
      // we don't need to serve over https, just let ws handle its own server
      websocketServerOptions.port = port;
      if (host) {
        websocketServerOptions.host = host;
      }
    }

    // vite dev server in middleware mode
    // 最终我们跑起了一个 WebSocket 的服务, 默认端口是 24678
    wss = new WebSocketServerRaw(websocketServerOptions);
  }

  // 接下来就是对 ws 的封装了
  wss.on("connection", (socket) => {
    // message 事件是 ws 接收到数据后触发的事件
    socket.on("message", (raw) => {
      // 如果没有事件监听器, 收到消息也处理不了, 直接 return
      if (!customListeners.size) return;

      // 拿到解析后的数据, 校验合法性
      // parsed 就是当源码改了, chokidar 通过 rollup 改完之后, 发送给 ws 的数据
      let parsed: any;
      try {
        parsed = JSON.parse(String(raw));
      } catch {}
      if (!parsed || parsed.type !== "custom" || !parsed.event) return;

      // 根据 event 名去事件监听器集合中查找相应的监听器集合
      const listeners = customListeners.get(parsed.event);

      // 如果监听器集合没有, 直接 return
      if (!listeners?.size) return;
      // getSocketClient 这个函数下面有解释, 就是给 client 封装一层, 保证发送数据的一致性
      const client = getSocketClient(socket);
      // 遍历监听器集合, 逐一调用
      listeners.forEach((listener) => listener(parsed.data, client));
    });
    socket.send(JSON.stringify({ type: "connected" }));
    if (bufferedError) {
      socket.send(JSON.stringify(bufferedError));
      bufferedError = null;
    }
  });

  // 监听失败事件
  wss.on("error", (e: Error & { code: string }) => {
    if (e.code === "EADDRINUSE") {
      config.logger.error(
        colors.red(`WebSocket server error: Port is already in use`),
        { error: e }
      );
    } else {
      config.logger.error(
        colors.red(`WebSocket server error:\n${e.stack || e.message}`),
        { error: e }
      );
    }
  });

  // Provide a wrapper to the ws client so we can send messages in JSON format
  // To be consistent with server.ws.send
  // 对 ws 客户端进行封装, 保证发送一致性的 json 格式的数据
  // 也就是说, 对于每个新进来的 ws 实例, 都对它的 send 方法(发送给客户端的 payload)进行了封装, 使其发送的数据格式一致
  function getSocketClient(socket: WebSocketRaw) {
    if (!clientsMap.has(socket)) {
      clientsMap.set(socket, {
        send: (...args) => {
          let payload: HMRPayload;
          if (typeof args[0] === "string") {
            payload = {
              type: "custom",
              event: args[0],
              data: args[1],
            };
          } else {
            payload = args[0];
          }
          socket.send(JSON.stringify(payload));
        },
        socket,
      });
    }
    return clientsMap.get(socket)!;
  }

  // On page reloads, if a file fails to compile and returns 500, the server
  // sends the error payload before the client connection is established.
  // If we have no open clients, buffer the error and send it to the next
  // connected client.
  let bufferedError: ErrorPayload | null = null;

  // 下面大家就太熟悉了, 一个典型的发布-订阅模型
  // 我们就不多说了
  return {
    on: ((event: string, fn: () => void) => {
      if (wsServerEvents.includes(event)) wss.on(event, fn);
      else {
        if (!customListeners.has(event)) {
          customListeners.set(event, new Set());
        }
        customListeners.get(event)!.add(fn);
      }
    }) as WebSocketServer["on"],
    off: ((event: string, fn: () => void) => {
      if (wsServerEvents.includes(event)) {
        wss.off(event, fn);
      } else {
        customListeners.get(event)?.delete(fn);
      }
    }) as WebSocketServer["off"],

    get clients() {
      return new Set(Array.from(wss.clients).map(getSocketClient));
    },

    send(...args: any[]) {
      let payload: HMRPayload;
      if (typeof args[0] === "string") {
        payload = {
          type: "custom",
          event: args[0],
          data: args[1],
        };
      } else {
        payload = args[0];
      }

      if (payload.type === "error" && !wss.clients.size) {
        bufferedError = payload;
        return;
      }

      const stringified = JSON.stringify(payload);
      wss.clients.forEach((client) => {
        // readyState 1 means the connection is open
        if (client.readyState === 1) {
          client.send(stringified);
        }
      });
    },

    close() {
      return new Promise((resolve, reject) => {
        wss.clients.forEach((client) => {
          client.terminate();
        });
        wss.close((err) => {
          if (err) {
            reject(err);
          } else {
            if (httpsServer) {
              httpsServer.close((err) => {
                if (err) {
                  reject(err);
                } else {
                  resolve();
                }
              });
            } else {
              resolve();
            }
          }
        });
      });
    },
  };
}
```

## c

```ts
const { ignored = [], ...watchOptions } = serverConfig.watch || {};
const watcher = chokidar.watch(path.resolve(root), {
  ignored: [
    "**/node_modules/**",
    "**/.git/**",
    ...(Array.isArray(ignored) ? ignored : [ignored]),
  ],
  ignoreInitial: true,
  ignorePermissionErrors: true,
  disableGlobbing: true,
  ...watchOptions,
}) as FSWatcher;
```
