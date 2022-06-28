# Vite 源码解析(1) - 启动篇

## 什么是 Vite

balabala

## 项目结构

整体来讲, Vite 有两大部分组成, 分别是 client 和 node. 而 node 是重头戏, 负责优化(optimizer), 插件(plugins), 服务端渲染(ssr), 服务(server).

其中服务模块是我们要讲到的重点, 它提供了后端服务, 基于 WebSocket 通信的 HMR 系统, 依赖图构建, 中间件等功能.

## 从 cli 开始

我们进入 `vite/src/cli.ts` 文件, 找到 `vite dev` 对应的指令, 可以看到它最主要是调用了 `vite/src/node/server.ts` 文件中的 `createServer` 函数. 不难看出开发环境最重要的是要起一个后端服务.

```ts
const { createServer } = await import("./server");

const server = await createServer({
  root,
  base: options.base,
  mode: options.mode,
  configFile: options.config,
  logLevel: options.logLevel,
  clearScreen: options.clearScreen,
  server: cleanOptions(options),
});

if (!server.httpServer) {
  throw new Error("HTTP server not available");
}

await server.listen();
```

## createServer 做了什么

- 获取 config 配置
- 创建 http 服务器 httpServer
- 创建 WebSocket 服务器 ws
- 通过 chokidar 创建监听器 watcher
- 创建一个兼容 rollup 钩子函数的对象 container
- 创建模块图谱实例 moduleGraph
- 声明 server 对象
- 注册 watcher 回调
- 执行插件中的 configureServer 钩子函数(注册用户定义的前置中间件)并收集用户定义的后置中间件
- 注册中间件
- 注册用户定义的后置中间件
- 注册转换 html 文件的中间件和未找到文件的 404 中间件
- 重写 httpServer.listen
- 返回 server 对象
