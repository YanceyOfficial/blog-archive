# Vite 源码解析(6) - HMR 原理

> xxx

## 前端做了什么

## getShortName

我们知道在 moduleGraph 中会存储各种 Map, 比如 dToModuleMap, 它们的 key 是文件的**绝对路径**. 而 getShortName 函数就是把绝对路径路径变成相对路径. 比如说: `/Users/XXXXXX/code/learn-frame/learn-react/src/index.css` 变成 `src/index.css`.

```ts
export function getShortName(file: string, root: string): string {
  return file.startsWith(root + "/") ? path.posix.relative(root, file) : file;
}
```

## handleHMRUpdate

在 createServer 函数中, 当 chokidar 监听到变化时, 首先会更新模块依赖图. 接下来就是执行 handleHMRUpdate 函数, 来保证 Hot Module Replacement.

```ts
watcher.on("change", async (file) => {
  file = normalizePath$3(file);
  if (file.endsWith("/package.json")) {
    return invalidatePackageData(packageCache, file);
  }
  // invalidate module graph cache on file change
  moduleGraph.onFileChange(file);

  if (serverConfig.hmr !== false) {
    try {
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

handleHMRUpdate 函数主要根据不同的文件进行不同的热更新策略, 比如 vite.config.js, env 的更新直接重启后端服务. index.html 文件的更新就直接刷新页面, 其他文件的变更就要执行 updateModules 函数.

```ts
export async function handleHMRUpdate(
  file: string,
  server: ViteDevServer
): Promise<void> {
  const { ws, config, moduleGraph } = server;

  // 上面说了, getShortName 用来获取相对路径
  const shortFile = getShortName(file, config.root);

  // 可以理解为获取文件名, 比如:
  // /Users/XXXXXX/code/learn-frame/learn-react/src/index.css -> index.css
  const fileName = path.basename(file);

  // configFile: '/Users/XXXXXX/code/learn-frame/learn-react/vite.config.ts',
  // configFileDependencies: [ '/Users/XXXXXX/code/learn-frame/learn-react/vite.config.ts' ],
  const isConfig = file === config.configFile;
  const isConfigDependency = config.configFileDependencies.some(
    (name) => file === name
  );

  // 是否为 env 文件
  const isEnv =
    config.inlineConfig.envFile !== false &&
    (fileName === ".env" || fileName.startsWith(".env."));

  // 如果是 vite 的配置文件或者 env 文件
  // 直接重启服务
  if (isConfig || isConfigDependency || isEnv) {
    // auto restart server
    debugHmr(`[config change] ${colors.dim(shortFile)}`);
    config.logger.info(
      colors.green(
        `${path.relative(process.cwd(), file)} changed, restarting server...`
      ),
      { clear: true, timestamp: true }
    );
    try {
      await server.restart();
    } catch (e) {
      config.logger.error(colors.red(e));
    }
    return;
  }

  debugHmr(`[file change] ${colors.dim(shortFile)}`);

  // (dev only) the client itself cannot be hot updated.
  // 我们知道 vite 在 client 会注入 /vite/dist/client/env.mjs 这个脚本, 用于跟后端进行 ws 交互等操作.
  // 下面这段代码就是如果改了这个文件, 就完整刷新页面
  // 当然这个只针对于 Vite 开发环境, 写业务不用关心这个, 因为也动不了
  if (file.startsWith(normalizedClientDir)) {
    ws.send({
      type: "full-reload",
      path: "*",
    });
    return;
  }

  // 复习下 fileToModulesMap
  // fileToModulesMap 的 key 为模块的绝对路径(不带 hash 和 query), value 为 ModuleNode 的集合
  const mods = moduleGraph.getModulesByFile(file);

  // check if any plugin wants to perform custom HMR handling
  const timestamp = Date.now();
  const hmrContext: HmrContext = {
    file,
    timestamp,
    modules: mods ? [...mods] : [],
    // readModifiedFile 函数下面说, 总之就是读取文件内容的字符串
    read: () => readModifiedFile(file),
    server,
  };

  // 过一下所有的 plugin, 如果你的 plugin 带了 handleHotUpdate
  // 就用 plugin 处理一波
  for (const plugin of config.plugins) {
    if (plugin.handleHotUpdate) {
      const filteredModules = await plugin.handleHotUpdate(hmrContext);
      if (filteredModules) {
        hmrContext.modules = filteredModules;
      }
    }
  }

  // 如果当前改动的文件没有对应的模块依赖
  if (!hmrContext.modules.length) {
    // html file cannot be hot updated
    // 它有可能是 index.html 文件, 此时直接 full-reload 一把梭即可
    if (file.endsWith(".html")) {
      config.logger.info(colors.green(`page reload `) + colors.dim(shortFile), {
        clear: true,
        timestamp: true,
      });
      ws.send({
        type: "full-reload",
        path: config.server.middlewareMode
          ? "*"
          : "/" + normalizePath(path.relative(config.root, file)),
      });
    } else {
      // loaded but not in the module graph, probably not js
      debugHmr(`[no modules matched] ${colors.dim(shortFile)}`);
    }
    return;
  }

  // 对于不是 vite.config.js(ts, mjs) 的, 也不是 env, 或者 index.html 的
  // 就要更新它的模块依赖, 下面这个函数
  updateModules(shortFile, hmrContext.modules, timestamp, server);
}
```

## updateModules

updateModules 根据被修改文件的路径清空对应的 ModuleNode 中缓存的源码

```ts
export function updateModules(
  file: string,
  modules: ModuleNode[],
  timestamp: number,
  { config, ws }: ViteDevServer
): void {
  const updates: Update[] = [];
  const invalidatedModules = new Set<ModuleNode>();
  let needFullReload = false;

  for (const mod of modules) {
    // 由于当前文件对应的代码发生了变化, 所以在 ModuleGraph 层面,
    // 需要使前文件对应的模块们失效, 这个函数下面说.
    invalidate(mod, timestamp, invalidatedModules);

    // 如果 needFullReload, 就跳过本次循环
    if (needFullReload) {
      continue;
    }

    const boundaries = new Set<{
      boundary: ModuleNode;
      acceptedVia: ModuleNode;
    }>();
    const hasDeadEnd = propagateUpdate(mod, boundaries);
    if (hasDeadEnd) {
      needFullReload = true;
      continue;
    }

    updates.push(
      ...[...boundaries].map(({ boundary, acceptedVia }) => ({
        type: `${boundary.type}-update` as Update["type"], // 有 js-update 和 css-update 两种
        timestamp,
        path: boundary.url,
        acceptedPath: acceptedVia.url,
      }))
    );
  }

  if (needFullReload) {
    config.logger.info(colors.green(`page reload `) + colors.dim(file), {
      clear: true,
      timestamp: true,
    });
    ws.send({
      type: "full-reload",
    });
  } else {
    config.logger.info(
      updates
        .map(({ path }) => colors.green(`hmr update `) + colors.dim(path))
        .join("\n"),
      { clear: true, timestamp: true }
    );
    ws.send({
      type: "update",
      updates,
    });
  }
}
```

## propagateUpdate

```ts
function propagateUpdate(
  node: ModuleNode,
  boundaries: Set<{
    boundary: ModuleNode;
    acceptedVia: ModuleNode;
  }>,
  currentChain: ModuleNode[] = [node]
): boolean /* hasDeadEnd */ {
  // #7561
  // if the imports of `node` have not been analyzed, then `node` has not
  // been loaded in the browser and we should stop propagation.
  if (node.id && node.isSelfAccepting === undefined) {
    return false;
  }

  if (node.isSelfAccepting) {
    boundaries.add({
      boundary: node,
      acceptedVia: node,
    });

    // additionally check for CSS importers, since a PostCSS plugin like
    // Tailwind JIT may register any file as a dependency to a CSS file.
    for (const importer of node.importers) {
      if (isCSSRequest(importer.url) && !currentChain.includes(importer)) {
        propagateUpdate(importer, boundaries, currentChain.concat(importer));
      }
    }

    return false;
  }

  if (!node.importers.size) {
    return true;
  }

  // #3716, #3913
  // For a non-CSS file, if all of its importers are CSS files (registered via
  // PostCSS plugins) it should be considered a dead end and force full reload.
  if (
    !isCSSRequest(node.url) &&
    [...node.importers].every((i) => isCSSRequest(i.url))
  ) {
    return true;
  }

  for (const importer of node.importers) {
    const subChain = currentChain.concat(importer);
    if (importer.acceptedHmrDeps.has(node)) {
      boundaries.add({
        boundary: importer,
        acceptedVia: node,
      });
      continue;
    }

    if (currentChain.includes(importer)) {
      // circular deps is considered dead end
      return true;
    }

    if (propagateUpdate(importer, boundaries, subChain)) {
      return true;
    }
  }
  return false;
}
```

## invalidate

如果你看过 ModuleGraph 的那篇, 模块依赖图里面也有个 invalidate 方法, 下面这个函数也大差不差. 但需要注意的是最后这一段:

```ts
mod.importers.forEach((importer) => {
  if (!importer.acceptedHmrDeps.has(mod)) {
    invalidate(importer, timestamp, seen);
  }
});
```

这段代码遍历了当前 mod 的 importers, 也就是引用了该模块的父模块. 然后找到**父模块中不依赖该模块热更新的模块**, 把它们失效掉. 这样做的目的是, 对于上层模块来说, 如果没有监听子模块更新, 当子模块更新时, 这些上层模块也需要重新加载, 否则它们引用的就是旧的 mod 了.

```ts
function invalidate(mod: ModuleNode, timestamp: number, seen: Set<ModuleNode>) {
  // 当前模块已经 invalidate 过了, 跳过.
  if (seen.has(mod)) {
    return;
  }
  seen.add(mod);

  // lastInvalidationTimestamp 是最后失效的时间, 如果你的模块时间戳超过它, 说明就过期了
  mod.lastHMRTimestamp = timestamp;

  // 把经过插件转换后的结果失效掉
  mod.transformResult = null;

  // ssr 相关
  mod.ssrModule = null;
  mod.ssrError = null;
  mod.ssrTransformResult = null;

  // 由于当前模块失效了, 遍历引用了当前模块的上层模块们,
  // 如果上层模块不接受当前模块的热更新
  // 也直接失效掉.
  mod.importers.forEach((importer) => {
    if (!importer.acceptedHmrDeps.has(mod)) {
      invalidate(importer, timestamp, seen);
    }
  });
}
```

## readModifiedFile

```ts
const Stats = {
  dev: 16777220,
  mode: 33188,
  nlink: 1,
  uid: 502,
  gid: 20,
  rdev: 0,
  blksize: 4096,
  ino: 55877411,
  size: 8366,
  blocks: 24,
  atimeMs: 1655982536691.7463,
  mtimeMs: 1655869817954.8062,
  ctimeMs: 1655869817954.8062,
  birthtimeMs: 1655693116465.197,
  atime: new Date("2022-06-23T11:08:56.692Z"),
  mtime: new Date("2022-06-22T03:50:17.955Z"),
  ctime: new Date("2022-06-22T03:50:17.955Z"),
  birthtime: new Date("2022-06-20T02:45:16.465"),
};
```
