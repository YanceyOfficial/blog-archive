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
// 一个三方库,用于把中间件和 server 关联起来, 最基本的支持 req, res, next, use, handle 等等
const middlewares = connect() as Connect.Server;
const httpServer = middlewareMode
  ? null
  : await resolveHttpServer(serverConfig, middlewares, httpsOptions);
```

下面是创建 http server, 如果是 http, 就直接用 `node:http` 的 `createServer`; 否则就是 https, 那么优先用 `node:http2`, 因为我们知道 http2 强制使用 https 的; 当然如果是代理, 就得用 `node:https`. 看了一下 [issue](https://github.com/vitejs/vite/issues/484) 是这样解释的:

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
        // 不过 STATUS_CODES[statusCode] 这个操作没搞懂, 肯定不是 undefiend 啊? 我给提 pr 那哥们留了个 comment, 先留个 TODO:
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
      // 遍历监听器集合, 逐一执行
      listeners.forEach((listener) => listener(parsed.data, client));
    });
    socket.send(JSON.stringify({ type: "connected" }));
    // 如果编译出错了啥的, 也把错误暴露给前端
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

  // 下面大家就太熟悉了, 一个典型发布-订阅设计模式的事件监听器
  // 尤雨溪确实好这口, vue 源码里我记得也有个类似的东西, 我们就不多说了
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

## chokidar

在 server 搭建好后, 就需要使用 chokidar 监听文件变化, 来触发 hmr.

```ts
const { ignored = [], ...watchOptions } = serverConfig.watch || {};
// chokidar 实例
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

// 监听文件变化
watcher.on("change", async (file) => {
  file = normalizePath(file);
  // 如果是 package.json 的变化, 需要更新 packageCache 的数据
  if (file.endsWith("/package.json")) {
    return invalidatePackageData(packageCache, file);
  }
  // invalidate module graph cache on file change
  // 当有源码文件变化, 重塑模块依赖图
  moduleGraph.onFileChange(file);
  if (serverConfig.hmr !== false) {
    try {
      // 并进行 hmr, 这个我们下一章主讲
      await handleHMRUpdate(file, server);
    } catch (err) {
      ws.send({
        type: "error",
        err: prepareError(err),
      });
    }
  }
});
```

## server 实例

至此我们就跑起来一个服务, 下面是它最终的实例, 这里面的大部分方法都跟 hmr 有关, 我们只是简单贴一下, 下一章重点来讲 hmr. 至于 ssr, 由于官方还不稳定, 等稳定了后面再填坑.

```ts
const server: ViteDevServer = {
  config, // 配置
  middlewares, // 中间件
  httpServer, // http 服务
  watcher, // chokidar
  pluginContainer: container, // 插件容器
  ws, // ws 模块
  moduleGraph, // 模块依赖图
  ssrTransform(code: string, inMap: SourceMap | null, url: string) {
    return ssrTransform(code, inMap, url, {
      json: { stringify: server.config.json?.stringify },
    });
  },
  transformRequest(url, options) {
    // 当有 bundle 发生变化时, 转换成请求
    return transformRequest(url, server, options);
  },
  transformIndexHtml: null!, // to be immediately set
  async ssrLoadModule(url, opts?: { fixStacktrace?: boolean }) {
    await updateCjsSsrExternals(server);
    return ssrLoadModule(
      url,
      server,
      undefined,
      undefined,
      opts?.fixStacktrace
    );
  },
  ssrFixStacktrace(e) {
    if (e.stack) {
      const stacktrace = ssrRewriteStacktrace(e.stack, moduleGraph);
      rebindErrorStacktrace(e, stacktrace);
    }
  },
  ssrRewriteStacktrace(stack: string) {
    return ssrRewriteStacktrace(stack, moduleGraph);
  },
  listen(port?: number, isRestart?: boolean) {
    return startServer(server, port, isRestart);
  },
  async close() {
    if (!middlewareMode) {
      process.off("SIGTERM", exitProcess);
      if (process.env.CI !== "true") {
        process.stdin.off("end", exitProcess);
      }
    }

    await Promise.all([
      watcher.close(),
      ws.close(),
      container.close(),
      closeHttpServer(),
    ]);
  },
  printUrls() {
    if (httpServer) {
      printCommonServerUrls(httpServer, config.server, config);
    } else {
      throw new Error("cannot print server URLs in middleware mode.");
    }
  },
  async restart(forceOptimize?: boolean) {
    if (!server._restartPromise) {
      server._forceOptimizeOnRestart = !!forceOptimize;
      server._restartPromise = restartServer(server).finally(() => {
        server._restartPromise = null;
        server._forceOptimizeOnRestart = false;
      });
    }
    return server._restartPromise;
  },

  _ssrExternals: null,
  _restartPromise: null,
  _importGlobMap: new Map(),
  _forceOptimizeOnRestart: false,
  _pendingRequests: new Map(),
};
```

## configureServer

由于 vite 的插件系统提供了 `configureServer` 钩子, configureServer 钩子将在内部中间件被安装前调用, 所以自定义的中间件将会默认会比内部中间件早运行. 如果你想注入一个在内部中间件 之后 运行的中间件, 你可以从 configureServer 返回一个函数, 将会在内部中间件安装后被调用.

```ts
// apply server configuration hooks from plugins
const postHooks: ((() => void) | void)[] = [];
for (const plugin of config.plugins) {
  if (plugin.configureServer) {
    postHooks.push(await plugin.configureServer(server));
  }
}
```

## middleware 总览

解析来 vite 将执行一票内置中间件, 我们先看个概览, 下面逐一学习.

```ts
// Internal middlewares ------------------------------------------------------

// request timer
// 在 debug 模式统计一次请求耗费的时间
if (process.env.DEBUG) {
  middlewares.use(timeMiddleware(root));
}

// cors (enabled by default)
// 处理跨域
const { cors } = serverConfig;
if (cors !== false) {
  middlewares.use(corsMiddleware(typeof cors === "boolean" ? {} : cors));
}

// proxy
// 处理代理
const { proxy } = serverConfig;
if (proxy) {
  middlewares.use(proxyMiddleware(httpServer, proxy, config));
}

// base
// base 是开发或生产环境服务的公共基础路径, 默认是  '/', 如果用户设置了其他路径, 需要藉此进行调整
if (config.base !== "/") {
  middlewares.use(baseMiddleware(server));
}

// open in editor support
// 一般前端框架在报错的时候, 会在浏览器出个弹窗, 弹窗展示错误堆栈(行数, 列数, 路径)
// 你点击错误, 这个中间件帮助你打开编辑器, 并定位到那一行
// (其实挺鸡肋的)
middlewares.use("/__open-in-editor", launchEditorMiddleware());

// serve static files under /public
// this applies before the transform middleware so that these files are served
// as-is without transforms.
// 保护 public 文件夹下的文件不被编译到
if (config.publicDir) {
  middlewares.use(
    servePublicMiddleware(config.publicDir, config.server.headers)
  );
}

// main transform middleware
// 转换(src 下的)源码 / 资源
middlewares.use(transformMiddleware(server));

// serve static files
middlewares.use(serveRawFsMiddleware(server));
middlewares.use(serveStaticMiddleware(root, server));

const isMiddlewareMode = middlewareMode && middlewareMode !== "html";

// spa fallback
if (config.spa && !isMiddlewareMode) {
  middlewares.use(spaFallbackMiddleware(root));
}

// run post config hooks
// This is applied before the html middleware so that user middleware can
// serve custom content instead of index.html.
// 执行后置自定义 server 钩子
postHooks.forEach((fn) => fn && fn());

if (config.spa && !isMiddlewareMode) {
  // transform index.html
  middlewares.use(indexHtmlMiddleware(server));
}

if (!isMiddlewareMode) {
  // handle 404s
  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  middlewares.use(function vite404Middleware(_, res) {
    res.statusCode = 404;
    res.end();
  });
}

// error handler
middlewares.use(errorMiddleware(server, !!middlewareMode));
```

### spaFallbackMiddleware

这个中间件的重点是 [connect-history-api-fallback](https://github.com/bripkens/connect-history-api-fallback) 这个库. 我们知道对于单页应用, 路由实际都是假的, 因此你刷新一下页面, 就到 404 了, 而这个库的目的就是在刷新后, 重写路由到 index.html 上, 这样就不会导致资源丢失了.

```ts
import fs from "fs";
import path from "path";
import history from "connect-history-api-fallback";
import type { Connect } from "types/connect";
import { createDebugger } from "../../utils";

export function spaFallbackMiddleware(
  root: string
): Connect.NextHandleFunction {
  const historySpaFallbackMiddleware = history({
    logger: createDebugger("vite:spa-fallback"),
    // support /dir/ without explicit index.html
    rewrites: [
      {
        from: /\/$/,
        to({ parsedUrl }: any) {
          const rewritten =
            decodeURIComponent(parsedUrl.pathname) + "index.html";

          if (fs.existsSync(path.join(root, rewritten))) {
            return rewritten;
          } else {
            return `/index.html`;
          }
        },
      },
    ],
  });

  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function viteSpaFallbackMiddleware(req, res, next) {
    return historySpaFallbackMiddleware(req, res, next);
  };
}
```

顺便提一嘴, 在最终线上, 你也要在 nginx 配置好路由重写, 否则也会 404.

```shell
try_files {path} /index.html
```

### indexHtmlMiddleware

顾名思义, 这个就是处理 index.html 的. 上面我们在讲 spaFallbackMiddleware 时知道, 所有前端路由都被处理成 `/index.html`

```ts
export function indexHtmlMiddleware(
  server: ViteDevServer
): Connect.NextHandleFunction {
  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return async function viteIndexHtmlMiddleware(req, res, next) {
    if (res.writableEnded) {
      return next();
    }

    const url = req.url && cleanUrl(req.url);
    // spa-fallback always redirects to /index.html
    if (url?.endsWith(".html") && req.headers["sec-fetch-dest"] !== "script") {
      const filename = getHtmlFilename(url, server);
      if (fs.existsSync(filename)) {
        try {
          let html = fs.readFileSync(filename, "utf-8");
          html = await server.transformIndexHtml(url, html, req.originalUrl);
          return send(req, res, html, "html", {
            headers: server.config.server.headers,
          });
        } catch (e) {
          return next(e);
        }
      }
    }
    next();
  };
}
```
