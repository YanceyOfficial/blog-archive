# Vite 源码解析(2) - 模块依赖图

> 由于现代前端都是模块化开发, 因此各个模块之间会产生各种各样多对多的依赖关系. 为此, 各个打包器都要以 entry 作为起点, 去寻找整个 APP 的模块依赖图. vite 也不例外, 我们这篇文章就来学习下 vite 的 ModuleGraph 是如何实现的.

## ModuleGraph 实例

在 createServer 中, 我们看到会创建一个 ModuleGraph 实例, 并把它作为参数传递到 `createPluginContainer`(我们下一章重点来讲 vite 的插件机制) 函数中, 供一些插件使用. 此外, 该实例也会传递到 `devServer`(我们下下章重点来讲 vite 的开发服务及中间件机制) 对象中, 供后续的 HMR 等使用.

```ts
const moduleGraph: ModuleGraph = new ModuleGraph((url, ssr) =>
  container.resolveId(url, undefined, { ssr })
);

const container = await createPluginContainer(config, moduleGraph, watcher);

const server: ViteDevServer = {
  config,
  middlewares,
  httpServer,
  watcher,
  pluginContainer: container,
  ws,
  moduleGraph,
  // ...
};
```

## ModuleNode

ModuleNode 是每个模块节点的原子信息, vite 正是通过它将所有的模块关联起来, 形成模块依赖图. 下面我们来简单介绍下各个属性.

```ts
export class ModuleNode {
  url: string; // 以 / 开头的相对路径
  id: string | null = null; // 模块的绝对路径, 但可能带着 hash 和 query
  file: string | null = null; // 模块的绝对路径, 不带 hash 和 query
  type: "js" | "css"; // 如果路径上带着 &direct, 则为 css, 否则为 js
  info?: ModuleInfo; // 模块信息, 来自 rollup, 有 ast, 源码字符串等, 详情: https://rollupjs.org/guide/en/#thisgetmoduleinfo
  meta?: Record<string, any>; // 自定义的元信息
  importers = new Set<ModuleNode>(); // 导入当前模块的模块的集合
  importedModules = new Set<ModuleNode>(); // 当前模块的导入模块集合
  acceptedHmrDeps = new Set<ModuleNode>(); // 接收的热更新依赖的集合, 我们放在热更新那一章来讲
  isSelfAccepting?: boolean; // 是否为模块自更新
  transformResult: TransformResult | null = null; // 通过插件构建后的结果
  ssrTransformResult: TransformResult | null = null;
  ssrModule: Record<string, any> | null = null;
  ssrError: Error | null = null;
  lastHMRTimestamp = 0; // HMR 最后更新时间, 也就给给模块 url 上附上 &t=xxxxxxxxxxxxx 的那个时间戳
  lastInvalidationTimestamp = 0; // 最后失效的时间, 如果你的模块时间戳超过它, 说明就过期了

  constructor(url: string) {
    this.url = url;
    this.type = isDirectCSSRequest(url) ? "css" : "js"; // 判断是 js 还是 css, 注意这里的 css 也可能是 sass, less 等等
    // #7870
    // The `isSelfAccepting` value is set by importAnalysis, but some
    // assets don't go through importAnalysis.
    // 过滤掉 html 文件和不需要被导入分析的模块(json, sourcemap, direct css)
    // 这些模块不需要关注自更新
    if (isHTMLRequest(url) || canSkipImportAnalysis(url)) {
      this.isSelfAccepting = false;
    }
  }
}
```

## ModuleGraph 各个属性, 方法一览

```ts
export class ModuleGraph {
  urlToModuleMap: Map<string, ModuleNode>; //  key 为 url, value 为 ModuleNode 的集合
  idToModuleMap: Map<string, ModuleNode>; // key 为模块的绝对路径(但可能带着 hash 和 query), value 为 ModuleNode 的集合
  fileToModulesMap: Map<string, Set<ModuleNode>>; // key 为模块的绝对路径(不带 hash 和 query), value 为 ModuleNode 的集合
  safeModulesPath: Set<string>; // 哪些模块是允许

  constructor(
    private resolveId: (
      url: string,
      ssr: boolean
    ) => Promise<PartialResolvedId | null>
  );

  async getModuleByUrl(
    rawUrl: string,
    ssr?: boolean
  ): Promise<ModuleNode | undefined>;

  getModuleById(id: string): ModuleNode | undefined;

  getModulesByFile(file: string): Set<ModuleNode> | undefined;

  onFileChange(file: string): void;

  invalidateModule(
    mod: ModuleNode,
    seen?: Set<ModuleNode>,
    timestamp?: number
  ): void;

  invalidateAll(): void;

  async updateModuleInfo(
    mod: ModuleNode,
    importedModules: Set<string | ModuleNode>,
    acceptedModules: Set<string | ModuleNode>,
    isSelfAccepting: boolean,
    ssr?: boolean
  ): Promise<Set<ModuleNode> | undefined>;

  async ensureEntryFromUrl(rawUrl: string, ssr?: boolean): Promise<ModuleNode>;

  createFileOnlyEntry(file: string): ModuleNode;

  resolveUrl(url: string, ssr?: boolean): Promise<ResolvedUrl>;
}
```

## getModuleByUrl

根据一个 url 获取对应的 ModuleNode.

```ts
export class ModuleGraph {
  async getModuleByUrl(
    rawUrl: string,
    ssr?: boolean
  ): Promise<ModuleNode | undefined> {
    const [url] = await this.resolveUrl(rawUrl, ssr);
    return this.urlToModuleMap.get(url);
  }
}
```

## getModuleById

根据一个 id 获取对应的 ModuleNode. id 为模块的绝对路径(可能带着 hash 和 query)

```ts
export class ModuleGraph {
  getModuleById(id: string): ModuleNode | undefined {
    // 我们知道 vite 为了判断源码模块的新鲜度. 给 url 加了一个 ?t=xxxxxxxxxxxxx
    // removeTimestampQuery 就是把这个 query 去掉
    return this.idToModuleMap.get(removeTimestampQuery(id));
  }
}
```

## getModulesByFile

根据一个 file 获取对应的 ModuleNode 集合. file 为模块的绝对路径(不带 hash 和 query).

```ts
export class ModuleGraph {
  getModulesByFile(file: string): Set<ModuleNode> | undefined {
    return this.fileToModulesMap.get(file);
  }
}
```

## onFileChange

```ts
export class ModuleGraph {
  onFileChange(file: string): void {
    const mods = this.getModulesByFile(file);
    if (mods) {
      const seen = new Set<ModuleNode>();
      mods.forEach((mod) => {
        this.invalidateModule(mod, seen);
      });
    }
  }
}
```

## invalidateModule

```ts
export class ModuleGraph {
  invalidateModule(
    mod: ModuleNode,
    seen: Set<ModuleNode> = new Set(),
    timestamp: number = Date.now()
  ): void {
    // Save the timestamp for this invalidation, so we can avoid caching the result of possible already started
    // processing being done for this module
    // lastInvalidationTimestamp 上面说了, 是最后失效的时间, 如果你的模块时间戳超过它, 说明就过期了
    // 所以把当前模块时间戳赋值给 lastInvalidationTimestamp, 那这个模块就过期了
    mod.lastInvalidationTimestamp = timestamp;
    // Don't invalidate mod.info and mod.meta, as they are part of the processing pipeline
    // Invalidating the transform result is enough to ensure this module is re-processed next time it is requested
    // 把经过插件转换后的结果废弃掉
    mod.transformResult = null;
    mod.ssrTransformResult = null;
    invalidateSSRModule(mod, seen);
  }
}
```

## invalidateAll

没啥说的, 循环废掉当前 id 下的所有模块.

```ts
export class ModuleGraph {
  invalidateAll(): void {
    const timestamp = Date.now();
    const seen = new Set<ModuleNode>();
    this.idToModuleMap.forEach((mod) => {
      this.invalidateModule(mod, seen, timestamp);
    });
  }
}
```

## updateModuleInfo

```ts
export class ModuleGraph {
  /**
   * Update the module graph based on a module's updated imports information
   * If there are dependencies that no longer have any importers, they are
   * returned as a Set.
   */
  async updateModuleInfo(
    mod: ModuleNode,
    importedModules: Set<string | ModuleNode>,
    acceptedModules: Set<string | ModuleNode>,
    isSelfAccepting: boolean,
    ssr?: boolean
  ): Promise<Set<ModuleNode> | undefined> {
    mod.isSelfAccepting = isSelfAccepting;
    const prevImports = mod.importedModules;
    const nextImports = (mod.importedModules = new Set());
    let noLongerImported: Set<ModuleNode> | undefined;
    // update import graph
    for (const imported of importedModules) {
      const dep =
        typeof imported === "string"
          ? await this.ensureEntryFromUrl(imported, ssr)
          : imported;
      dep.importers.add(mod);
      nextImports.add(dep);
    }
    // remove the importer from deps that were imported but no longer are.
    prevImports.forEach((dep) => {
      if (!nextImports.has(dep)) {
        dep.importers.delete(mod);
        if (!dep.importers.size) {
          // dependency no longer imported
          (noLongerImported || (noLongerImported = new Set())).add(dep);
        }
      }
    });
    // update accepted hmr deps
    const deps = (mod.acceptedHmrDeps = new Set());
    for (const accepted of acceptedModules) {
      const dep =
        typeof accepted === "string"
          ? await this.ensureEntryFromUrl(accepted, ssr)
          : accepted;
      deps.add(dep);
    }
    return noLongerImported;
  }
}
```

## ensureEntryFromUrl

```ts
export class ModuleGraph {
  async ensureEntryFromUrl(rawUrl: string, ssr?: boolean): Promise<ModuleNode> {
    const [url, resolvedId, meta] = await this.resolveUrl(rawUrl, ssr);
    let mod = this.urlToModuleMap.get(url);
    if (!mod) {
      mod = new ModuleNode(url);
      if (meta) mod.meta = meta;
      this.urlToModuleMap.set(url, mod);
      mod.id = resolvedId;
      this.idToModuleMap.set(resolvedId, mod);
      const file = (mod.file = cleanUrl(resolvedId));
      let fileMappedModules = this.fileToModulesMap.get(file);
      if (!fileMappedModules) {
        fileMappedModules = new Set();
        this.fileToModulesMap.set(file, fileMappedModules);
      }
      fileMappedModules.add(mod);
    }
    return mod;
  }
}
```

## createFileOnlyEntry

```ts
export class ModuleGraph {
  // some deps, like a css file referenced via @import, don't have its own
  // url because they are inlined into the main css import. But they still
  // need to be represented in the module graph so that they can trigger
  // hmr in the importing css file.
  createFileOnlyEntry(file: string): ModuleNode {
    file = normalizePath(file);
    let fileMappedModules = this.fileToModulesMap.get(file);
    if (!fileMappedModules) {
      fileMappedModules = new Set();
      this.fileToModulesMap.set(file, fileMappedModules);
    }

    const url = `${FS_PREFIX}${file}`;
    for (const m of fileMappedModules) {
      if (m.url === url || m.id === file) {
        return m;
      }
    }

    const mod = new ModuleNode(url);
    mod.file = file;
    fileMappedModules.add(mod);
    return mod;
  }
}
```

## resolveUrl

```ts
export class ModuleGraph {
  // for incoming urls, it is important to:
  // 1. remove the HMR timestamp query (?t=xxxx)
  // 2. resolve its extension so that urls with or without extension all map to
  // the same module
  // 1. 去掉热更新带着的 import=xxxx 和 ?t=xxxxxx 参数
  // 2. 解析其扩展名，以便带有或不带有扩展名的 url 都映射到同一个模块
  async resolveUrl(url: string, ssr?: boolean): Promise<ResolvedUrl> {
    url = removeImportQuery(removeTimestampQuery(url));
    // resolveId 是 rollup 插件体系的, 它就是获取当前模块在文件系统的绝对路径, 下一章讲插件会说到
    const resolved = await this.resolveId(url, !!ssr);
    const resolvedId = resolved?.id || url;
    const ext = extname(cleanUrl(resolvedId));
    const { pathname, search, hash } = parseUrl(url);
    if (ext && !pathname!.endsWith(ext)) {
      url = pathname + ext + (search || "") + (hash || "");
    }
    return [url, resolvedId, resolved?.meta];
  }
}
```

## 总结

xxx
