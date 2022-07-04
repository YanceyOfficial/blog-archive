# Vite 源码解析(3) - 插件篇

> 第一篇文章我们讲了在配置中, 通过 `resolvePlugins` 来聚合和解析一票插件, 留了一个未展开讲的函数 `createPluginContainer`, 我们知道 vite 插件扩展了设计出色的 rollup 接口, 因此为了和 rollup 插件打通, vite 搞了个 `createPluginContainer` 函数, 其实这个函数来自 [wmr](https://github.com/preactjs/wmr/blob/main/packages/wmr/src/lib/rollup-plugin-container.js), 是 preact 打通 rollup 的包, vite 拿这个重新卷了一下.

这篇文章我们先来学习一下 `createPluginContainer` 的源码, 然后通过 `@rollup/plugin-alias`, `plugins/esbuild` 这两个库, 来看一看 `createPluginContainer` 是怎样与 rollup hooks 打通的.

## createPluginContainer

整体来讲, `createPluginContainer` 可以划分为 `前置逻辑`, `Context`, `TransformContext`, `container` 和, 其中我们重点讲的是后三个. 当 vite 在构建到某个阶段时, 会调用 `container` 中的钩子函数, 这些钩子函数会遍历你所有的插件, 如果你的某些插件在这个钩子中要做些什么, 那就执行它, 否则就跳过它, 而这些钩子函数是和 roullup 插件体系打通的. 而 `Context` 和 `TransformContext` 相当于一个工厂, 将 vite 的插件转换成 rollup 可用的.

### 前置代码

```ts
const isDebug = process.env.DEBUG;

const seenResolves: Record<string, true | undefined> = {};
const debugResolve = createDebugger("vite:resolve");
const debugPluginResolve = createDebugger("vite:plugin-resolve", {
  onlyWhenFocused: "vite:plugin",
});
const debugPluginTransform = createDebugger("vite:plugin-transform", {
  onlyWhenFocused: "vite:plugin",
});
const debugSourcemapCombineFlag = "vite:sourcemap-combine";
const isDebugSourcemapCombineFocused = process.env.DEBUG?.includes(
  debugSourcemapCombineFlag
);
const debugSourcemapCombineFilter =
  process.env.DEBUG_VITE_SOURCEMAP_COMBINE_FILTER;
const debugSourcemapCombine = createDebugger("vite:sourcemap-combine", {
  onlyWhenFocused: true,
});

// ---------------------------------------------------------------------------

const watchFiles = new Set<string>();

// TODO: use import()
// createRequire 上次说了, 用来加载 cjs 文件
const _require = createRequire(import.meta.url);

// get rollup version
// 先拿到 node_modules/rollup/package,json
const rollupPkgPath = resolve(_require.resolve("rollup"), "../../package.json");
// 我们看到主要是取当前 rollup 的版本信息
const minimalContext: MinimalPluginContext = {
  meta: {
    rollupVersion: JSON.parse(fs.readFileSync(rollupPkgPath, "utf-8")).version,
    watchMode: true,
  },
};

// 不兼容的插件暴露 warning.
function warnIncompatibleMethod(method: string, plugin: string) {
  logger.warn(
    colors.cyan(`[plugin:${plugin}] `) +
      colors.yellow(
        `context method ${colors.bold(
          `${method}()`
        )} is not supported in serve mode. This plugin is likely not vite-compatible.`
      )
  );
}

// throw when an unsupported ModuleInfo property is accessed,
// so that incompatible plugins fail in a non-cryptic way.
// 这里很优雅的用到了 Proxy 和 Reflect, 用于拦截 module.info 的 getter
// 配合下面 getModuleInfo 这个函数看
const ModuleInfoProxy: ProxyHandler<ModuleInfo> = {
  get(info: any, key: string) {
    if (key in info) {
      return info[key];
    }
    throw Error(`[vite] The "${key}" property of ModuleInfo is not supported.`);
  },
};

// same default value of "moduleInfo.meta" as in Rollup
const EMPTY_OBJECT = Object.freeze({});

function getModuleInfo(id: string) {
  const module = moduleGraph?.getModuleById(id);
  if (!module) {
    return null;
  }
  // 如果没有 module.info, 就给 module.info 加上代理, 且
  // module.info 只有 id, meta 两个字段
  // 一旦你访问非 id, meta 字段, 比如 module.info.xxx 就会报错
  if (!module.info) {
    module.info = new Proxy(
      { id, meta: module.meta || EMPTY_OBJECT } as ModuleInfo,
      ModuleInfoProxy
    );
  }
  return module.info;
}

// 更新模块的 meta 信息
function updateModuleInfo(id: string, { meta }: { meta?: object | null }) {
  if (meta) {
    const moduleInfo = getModuleInfo(id);
    if (moduleInfo) {
      moduleInfo.meta = { ...moduleInfo.meta, ...meta };
    }
  }
}
```

### Context

关于 Context 和 TransformContext 我们简单说, 它实现了 rollup 的 PluginContext 接口, 可以把它理解为一个工厂, 是将 vite 的插件转换成 rollup 可用的.

```ts
// we should create a new context for each async hook pipeline so that the
// active plugin in that pipeline can be tracked in a concurrency-safe manner.
// using a class to make creating new contexts more efficient
class Context implements PluginContext {
  meta = minimalContext.meta;
  ssr = false;
  _scan = false;
  _activePlugin: Plugin | null;
  _activeId: string | null = null;
  _activeCode: string | null = null;
  _resolveSkips?: Set<Plugin>;
  _addedImports: Set<string> | null = null;

  constructor(initialPlugin?: Plugin) {
    this._activePlugin = initialPlugin || null;
  }

  // 这里用到了 acorn 这个库, 用来将代码字符串转换为 AST
  // rollup, webpack 都用这个
  parse(code: string, opts: any = {}) {
    return parser.parse(code, {
      sourceType: "module",
      ecmaVersion: "latest",
      locations: true,
      ...opts,
    });
  }

  // 解析路径
  // src/container/Home.tsx -> /User/xxxx/vite-example/src/container/Home.tsx
  async resolve(
    id: string,
    importer?: string,
    options?: { skipSelf?: boolean }
  ) {
    // 收集需要跳过的插件
    let skip: Set<Plugin> | undefined;
    if (options?.skipSelf && this._activePlugin) {
      skip = new Set(this._resolveSkips);
      skip.add(this._activePlugin);
    }
    // 关于 resolveId 下面会讲到
    // 它就是获取当前模块在文件系统的绝对路径
    // 我们会跳过 skip 包含的插件
    let out = await container.resolveId(id, importer, {
      skip,
      ssr: this.ssr,
      scan: this._scan,
    });
    // 如果没有找到, 或者被跳过, 就返回 null
    // 否则返回路径
    if (typeof out === "string") out = { id: out };
    return out as ResolvedId | null;
  }

  // 获取模块信息
  getModuleInfo(id: string) {
    return getModuleInfo(id);
  }

  // 获取所有模块路径
  getModuleIds() {
    return moduleGraph
      ? moduleGraph.idToModuleMap.keys()
      : Array.prototype[Symbol.iterator]();
  }

  addWatchFile(id: string) {
    watchFiles.add(id);
    (this._addedImports || (this._addedImports = new Set())).add(id);
    if (watcher) ensureWatchedFile(watcher, id, root);
  }

  getWatchFiles() {
    return [...watchFiles];
  }

  // 未实现
  emitFile(assetOrFile: EmittedFile) {
    warnIncompatibleMethod(`emitFile`, this._activePlugin!.name);
    return "";
  }

  // 未实现
  setAssetSource() {
    warnIncompatibleMethod(`setAssetSource`, this._activePlugin!.name);
  }

  // 未实现
  getFileName() {
    warnIncompatibleMethod(`getFileName`, this._activePlugin!.name);
    return "";
  }

  warn(
    e: string | RollupError,
    position?: number | { column: number; line: number }
  ) {
    const err = formatError(e, position, this);
    const msg = buildErrorMessage(
      err,
      [colors.yellow(`warning: ${err.message}`)],
      false
    );
    logger.warn(msg, {
      clear: true,
      timestamp: true,
    });
  }

  error(
    e: string | RollupError,
    position?: number | { column: number; line: number }
  ): never {
    // error thrown here is caught by the transform middleware and passed on
    // the the error middleware.
    throw formatError(e, position, this);
  }
}
```

### TransformContext

TransformContext 在 Context 的基础上加上了对 sourcemap 的处理. 具体可以看下面的 transform 部分.

```ts
class TransformContext extends Context {
  filename: string;
  originalCode: string;
  originalSourcemap: SourceMap | null = null;
  sourcemapChain: NonNullable<SourceDescription["map"]>[] = [];
  combinedMap: SourceMap | null = null;

  constructor(filename: string, code: string, inMap?: SourceMap | string) {
    super();
    this.filename = filename;
    this.originalCode = code;
    if (inMap) {
      this.sourcemapChain.push(inMap);
    }
  }

  _getCombinedSourcemap(createIfNull = false) {
    if (
      debugSourcemapCombineFilter &&
      this.filename.includes(debugSourcemapCombineFilter)
    ) {
      debugSourcemapCombine("----------", this.filename);
      debugSourcemapCombine(this.combinedMap);
      debugSourcemapCombine(this.sourcemapChain);
      debugSourcemapCombine("----------");
    }

    let combinedMap = this.combinedMap;
    for (let m of this.sourcemapChain) {
      if (typeof m === "string") m = JSON.parse(m);
      if (!("version" in (m as SourceMap))) {
        // empty, nullified source map
        combinedMap = this.combinedMap = null;
        this.sourcemapChain.length = 0;
        break;
      }
      if (!combinedMap) {
        combinedMap = m as SourceMap;
      } else {
        combinedMap = combineSourcemaps(cleanUrl(this.filename), [
          {
            ...(m as RawSourceMap),
            sourcesContent: combinedMap.sourcesContent,
          },
          combinedMap as RawSourceMap,
        ]) as SourceMap;
      }
    }
    if (!combinedMap) {
      return createIfNull
        ? new MagicString(this.originalCode).generateMap({
            includeContent: true,
            hires: true,
            source: cleanUrl(this.filename),
          })
        : null;
    }
    if (combinedMap !== this.combinedMap) {
      this.combinedMap = combinedMap;
      this.sourcemapChain.length = 0;
    }
    return this.combinedMap;
  }

  getCombinedSourcemap() {
    return this._getCombinedSourcemap(true) as SourceMap;
  }
}
```

### container

```ts
const container: PluginContainer = {
  options: await(async () => {})(),

  // 从依赖图中取得模块信息, 上面介绍了
  getModuleInfo,

  async buildStart() {},

  async resolveId(rawId, importer = join(root, "index.html"), options) {},

  async load(id, ssr) {},

  async transform(code, id, inMap, ssr) {},

  watchChange(id, event = "update") {},

  async close() {},
};

return container;
```

上面我们讲到 rollup 的钩子, 而 vite 用到了如下几个:

- options
- buildStart
- resolveId
- load
- transform

下面我们依次看他们做了些什么.

#### options

options 是一个立即执行函数, 也是构建过程中执行的第一个钩子. 它会遍历执行所有插件的 options 方法, 最终返回合并后的 options.

```ts
const container: PluginContainer = {
  options: await(async () => {
    // 在 vite 配置文件中可以配置 build.rollupOptions
    // https://rollupjs.org/guide/en/#big-list-of-options
    let options = rollupOptions;
    for (const plugin of plugins) {
      if (!plugin.options) continue;
      options = (await plugin.options.call(minimalContext, options)) || options;
    }
    // 扩展 Acorn 的 Parser, 比如:
    // rollupOptions: {
    //  acornInjectPlugins: [ importAssertions ],
    // }
    if (options.acornInjectPlugins) {
      parser = acorn.Parser.extend(
        ...(arraify(options.acornInjectPlugins) as any)
      );
    }
    return {
      acorn,
      acornInjectPlugins: [],
      ...options,
    };
  })(),
};
```

#### buildStart

它的作用是就是开始构建之前获取上面 options 钩子的配置项, 用于其他钩子函数使用. 因为用了 Promise.all, 一个凉了就全部失败.

```ts
const container: PluginContainer = {
  async buildStart() {
    await Promise.all(
      plugins.map((plugin) => {
        if (plugin.buildStart) {
          return plugin.buildStart.call(
            new Context(plugin) as any,
            container.options as NormalizedInputOptions
          );
        }
      })
    );
  },
};
```

#### resolveId

下一章我们会讲到 transformMiddleware 这个中间件, 它用于拦截并处理模块请求, 其中就包含调用 resolveId 钩子函数, 我们在代码中会直接引用 node_modules 中的库, 也会相对引用其他模块的源码, 也会使用 alias 等等. 因此, 这个钩子就是用于解析文件路径, 变成绝对路径.

```ts
/**
 * @param rawId 代码中使用的路径, 比如 import { foo } from '../bar.js', 那 rawId 就是 '../bar.js'
 * @param importer 导入模块的位置, 默认是 index.html 那一级的路径
 * @param options 配置
 * @returns  Promise<PartialResolvedId | null>
 */
const container: PluginContainer = {
  async resolveId(rawId, importer = join(root, "index.html"), options) {
    const skip = options?.skip; // Set<Plugin> | undefined
    const ssr = options?.ssr;
    const scan = !!options?.scan;
    const ctx = new Context();
    ctx.ssr = !!ssr; // 是否为服务端渲染
    ctx._scan = scan; // 是否需要扫描
    ctx._resolveSkips = skip; // 需要跳过的模块集合
    const resolveStart = isDebug ? performance.now() : 0;

    let id: string | null = null;
    const partial: Partial<PartialResolvedId> = {};
    for (const plugin of plugins) {
      if (!plugin.resolveId) continue; // 没有 resolveId 钩子就跳过
      if (skip?.has(plugin)) continue; // 如果需要跳过, 就跳过

      // 此时这个插件就是当前正在执行 resolveId 钩子函数的
      ctx._activePlugin = plugin;

      const pluginResolveStart = isDebug ? performance.now() : 0;

      // 调用 resolveId 钩子函数
      const result = await plugin.resolveId.call(ctx as any, rawId, importer, {
        ssr,
        scan,
      });

      // 如果没有返回值继续调用剩余插件的 resolveId 钩子函数
      if (!result) continue;

      if (typeof result === "string") {
        id = result;
      } else {
        id = result.id;
        Object.assign(partial, result);
      }

      isDebug &&
        debugPluginResolve(
          timeFrom(pluginResolveStart),
          plugin.name,
          prettifyUrl(id, root)
        );

      // resolveId() is hookFirst - first non-null result is returned.
      // 拿到 id 后, 就可以终止 resolveId 钩子函数了
      // 也就是说只要有一个插件的 resolveId 方法返回有效值, 就终止循环
      break;
    }

    if (isDebug && rawId !== id && !rawId.startsWith(FS_PREFIX)) {
      const key = rawId + id;
      // avoid spamming
      if (!seenResolves[key]) {
        seenResolves[key] = true;
        debugResolve(
          `${timeFrom(resolveStart)} ${colors.cyan(rawId)} -> ${colors.dim(id)}`
        );
      }
    }

    // 最终返回一个对象, 对象内有一个属性 id, 值是解析后的绝对路径
    // external 是指引用的外部 url, 比如像 react, react-dom 走了 CDN
    if (id) {
      partial.id = isExternalUrl(id) ? id : normalizePath(id);
      return partial as PartialResolvedId;
    } else {
      return null;
    }
  },
};
```

#### load

在 resolveId 钩子结束后, 我们就拿到了当前文件的绝对路径, 接下来就是调用 load 钩子函数, 可以获取到文件的内容. 在 rollup 中, 如果你执行了 load 函数, 返回 null, 说明你没有对源码进行改变; 否则返回 `SourceDescription` 类型. 因此在下面的代码中, 我们也看到如果 result 是 Object 类型, 那么需要执行 `updateModuleInfo` 函数.

和 resolveId 类似, 只要有一个插件的 load 方法返回了 `SourceDescription` 类型的 result 就终止遍历.

```ts
const container: PluginContainer = {
  async load(id, options) {
    const ssr = options?.ssr;
    const ctx = new Context();
    ctx.ssr = !!ssr;
    for (const plugin of plugins) {
      if (!plugin.load) continue;
      ctx._activePlugin = plugin;
      const result = await plugin.load.call(ctx as any, id, { ssr });
      if (result != null) {
        if (isObject(result)) {
          updateModuleInfo(id, result);
        }
        return result;
      }
    }
    return null;
  },
};
```

#### transform

transform 似乎是我们最常用的钩子, 它用于转换源码, 像 JSON, YAML, 图片等非 JavaScript 文件都需要在这里进行转换. 前段时间写了个插件, 叫做 [rollup-plugin-toml](https://github.com/YanceyOfficial/rollup-plugin-toml), 它可以将 toml 文件转换为 ESM 模块.

```ts
export interface SourceDescription extends Partial<PartialNull<ModuleOptions>> {
  ast?: AcornNode;
  code: string;
  map?: SourceMapInput;
}

const container: PluginContainer = {
  /**
   * @param code 文件源码
   * @param id 文件路径
   * @param options sourcemap 相关
   * @returns {SourceDescription | null}
   */
  async transform(code, id, options) {
    const inMap = options?.inMap;
    const ssr = options?.ssr;
    const ctx = new TransformContext(id, code, inMap as SourceMap);
    ctx.ssr = !!ssr;
    for (const plugin of plugins) {
      if (!plugin.transform) continue;
      ctx._activePlugin = plugin; // 当前正在使用的插件
      ctx._activeId = id; // 当前正在处理的模块路径
      ctx._activeCode = code; // 当前正在处理的源码字符串
      const start = isDebug ? performance.now() : 0;
      let result: TransformResult | string | undefined;
      try {
        // 调用插件的 transform 方法
        result = await plugin.transform.call(ctx as any, code, id, { ssr });
      } catch (e) {
        ctx.error(e);
      }
      if (!result) continue;
      isDebug &&
        debugPluginTransform(
          timeFrom(start),
          plugin.name,
          prettifyUrl(id, root)
        );
      if (isObject(result)) {
        // 说明源码发生了变动
        if (result.code !== undefined) {
          // 复写源码
          code = result.code;
          if (result.map) {
            if (isDebugSourcemapCombineFocused) {
              // @ts-expect-error inject plugin name for debug purpose
              result.map.name = plugin.name;
            }
            ctx.sourcemapChain.push(result.map);
          }
        }
        // 由于结果变了, 需要更新模块信息
        updateModuleInfo(id, result);
      } else {
        // 由于 transform 也可以返回字符串, 那么这个 result 就是 transform 之后的源码.
        code = result;
      }
    }
    // 返回新的 code 和 map 供下个插件使用
    return {
      code,
      map: ctx._getCombinedSourcemap(),
    };
  },
};
```

#### close

不多说, 我们直接摘抄 rollup 的原话: the last one is always `buildEnd`. If there is a build error, `closeBundle` will be called after that. 翻译一下就是在 build 最后会调用 `buildEnd` 钩子, 如果发生了构建错误, 最后还会额外调用 `closeBundle` 钩子.

```ts
const container: PluginContainer = {
  async close() {
    if (closed) return;
    const ctx = new Context();
    await Promise.all(
      plugins.map((p) => p.buildEnd && p.buildEnd.call(ctx as any))
    );
    await Promise.all(
      plugins.map((p) => p.closeBundle && p.closeBundle.call(ctx as any))
    );
    closed = true;
  },
};
```

## @rollup/plugin-alias

最后我们看两个插件, 作为对 `createPluginContainer` 的一个复习. 首先看一下 `@rollup/plugin-alias`.

我们在平时开发中, 为了防止 `../../../xxx.js` 这种路径引用, 一般都会配置 `alias` 配置, 比如:

```ts
module.exports = {
  plugins: [
    alias({
      entries: [
        { find: 'utils', replacement: '../../../utils' },
        { find: 'batman-1.0.0', replacement: './joker-1.5.0' }
        { find:/^i18n\!(.*)/, replacement: '$1.js' }
      ]
    }),
    alias({
      entries: {
        '@': path.resolve(__dirname, 'src')
      }
    });
  ]
};
```

这样的好处是, 当我们引用 `../../../xxx.js` 时, 可以写成 `@/xxx.js`, 代码会非常的干净. 想必大家也能猜出, 这个插件最重要地方的是对 resolveId 这个钩子的处理, 我们来学习下这块.

```ts
function alias(options = {}) {
  // 获取别名列表
  const entries = getEntries(options);
  if (entries.length === 0) {
    return {
      name: "alias",
      resolveId: () => null,
    };
  }
  return {
    name: "alias",
    async buildStart(inputOptions) {
      await Promise.all(
        [
          ...(Array.isArray(options.entries) ? options.entries : []),
          options,
        ].map(
          ({ customResolver }) =>
            customResolver &&
            typeof customResolver === "object" &&
            typeof customResolver.buildStart === "function" &&
            customResolver.buildStart.call(this, inputOptions)
        )
      );
    },
    resolveId(importee, importer, resolveOptions) {
      if (!importer) {
        return null;
      }
      // First match is supposed to be the correct one
      // 找到第一个匹配的配置
      const matchedEntry = entries.find((entry) =>
        matches(entry.find, importee)
      );
      if (!matchedEntry) {
        return null;
      }
      // @containers/Home.tsx -> src/containers/Home.tsx
      const updatedId = importee.replace(
        matchedEntry.find,
        matchedEntry.replacement
      );
      // 如果提供了自定义的 resolve 算法, 那就用自定义的
      if (matchedEntry.resolverFunction) {
        return matchedEntry.resolverFunction.call(
          this,
          updatedId,
          importer,
          resolveOptions
        );
      }

      // 否则用默认的 resolve 方法, 这个上面讲 Context 的时候说到了
      return this.resolve(
        updatedId,
        importer,
        // 当然上面有一点没说明的就是 skipSelf: true
        // 这句话的意思是这个 id 已经将要被解析成绝对路径了
        // 如果后面有插件还想解析这个 id, 直接用现成了, 跳过就好
        Object.assign({ skipSelf: true }, resolveOptions)
      ).then((resolved) => resolved || { id: updatedId });
    },
  };
}
```

## vite:esbuild

上面我们讲到了一个使用 resolveId 的实例. 这次我们讲下 vite 内置的 `vite:esbuild`. 我们知道 vite 快的一个根本原因就是用了 esbuild. esbuild 在 vite 开发环境体现在以下三个阶段:

- 依赖预构建: 这也是 vite 冷启为什么快的原因, 我们在第六章会讲到
- ESM 请求源码: 也就是我们一会儿要讲到了, 在前端请求源码时, 会受到 transformMiddleware 的拦截, 我们知道源码是无法被浏览器直接使用的, 所以这里就会通过 rollup 进行构建, 而在开发环境, vite 在 rollup 中使用了 esbuild 插件
- HMR: 和上一条类似, 都是使用 esbuild 加速构建过程

`vite:esbuild` 中最核心的就是 transform 钩子, 它调用了 esbuild 的 transform 函数, 该函数用于转换单个文件, 可以用来压缩 JavaScript, 把 ts/tsx 转换成 JavaScript, 或者把高版本 ECMAScript 转成低版本. 它返回一个 Promise, 当 Promise 被 resolve 时, 返回一个 `TransformResult` 类型的对象; 如果被 reject, 就返回一个 `TransformFailure` 类型的对象.

> This function transforms a single JavaScript file. It can be used to minify JavaScript, convert TypeScript/JSX to JavaScript, or convert newer JavaScript to older JavaScript. It returns a promise that is either resolved with a "TransformResult" object or rejected with a "TransformFailure" object.

我们简单过一下代码, 了解一下一般我们会在 transform 钩子做什么. 至于 esbuild 的 transform 函数怎么运作的, 超纲了...

```ts
export async function transformWithEsbuild(
  code: string,
  filename: string,
  options?: TransformOptions,
  inMap?: object
): Promise<ESBuildTransformResult> {
  let loader = options?.loader;

  // loader 是 esbuild Transform API 中的一个参数, 它一般就是文件的扩展名, 比如 .js, .css, .tsx 等等
  // 它用于告知 esbuild 用什么 loader 来处理指定格式的文件
  if (!loader) {
    // if the id ends with a valid ext, use it (e.g. vue blocks)
    // otherwise, cleanup the query before checking the ext
    const ext = path
      .extname(/\.\w+$/.test(filename) ? filename : cleanUrl(filename))
      .slice(1);

    if (ext === "cjs" || ext === "mjs") {
      loader = "js";
    } else {
      loader = ext as Loader;
    }
  }

  // tsconfigRaw 也是 esbuild Transform API 中的一个参数, 它以字符串的形式传入 tsconfig.json 的配置
  // https://esbuild.github.io/api/#tsconfig-raw
  // 如果你传入了这个参数, 那么 esbuild 就不会去读取 tsconfig.json 文件了
  let tsconfigRaw = options?.tsconfigRaw;

  // if options provide tsconfigraw in string, it takes highest precedence
  if (typeof tsconfigRaw !== "string") {
    // these fields would affect the compilation result
    // https://esbuild.github.io/content-types/#tsconfig-json
    const meaningfulFields: Array<keyof TSCompilerOptions> = [
      "target",
      "jsxFactory",
      "jsxFragmentFactory",
      "useDefineForClassFields",
      "importsNotUsedAsValues",
      "preserveValueImports",
    ];

    // 如果是 ts 或者 tsx, 就找 tsconfig.json 的配置
    // 如果有 meaningfulFields 的这六个, 就把它缓存到 compilerOptionsForFile 对象中
    const compilerOptionsForFile: TSCompilerOptions = {};
    if (loader === "ts" || loader === "tsx") {
      const loadedTsconfig = await loadTsconfigJsonForFile(filename);
      const loadedCompilerOptions = loadedTsconfig.compilerOptions ?? {};

      for (const field of meaningfulFields) {
        if (field in loadedCompilerOptions) {
          // @ts-ignore TypeScript can't tell they are of the same type
          compilerOptionsForFile[field] = loadedCompilerOptions[field];
        }
      }
    }

    // 最终合并成一个新的 tsconfigRaw
    tsconfigRaw = {
      ...tsconfigRaw,
      compilerOptions: {
        ...compilerOptionsForFile,
        ...tsconfigRaw?.compilerOptions,
      },
    };
  }

  const resolvedOptions = {
    sourcemap: true,
    // ensure source file name contains full query
    sourcefile: filename,
    ...options,
    loader,
    tsconfigRaw,
  } as ESBuildOptions;

  delete resolvedOptions.include;
  delete resolvedOptions.exclude;
  delete resolvedOptions.jsxInject;

  try {
    // 这里就是 esbuild 真正转换文件的核心了, 有兴趣可以去看 esbuild 的源码
    // 对于绝大多数 transfrom 钩子的实现, 我们大多都是读取文件内容, 然后通过三方库来转换, 然后再写入文件
    // 比如我写的 [rollup-plugin-toml](https://github.com/YanceyOfficial/rollup-plugin-toml)
    // 实际用到的转换器是 @iarna/toml 这个库
    const result = await transform(code, resolvedOptions);
    let map: SourceMap;
    if (inMap && resolvedOptions.sourcemap) {
      const nextMap = JSON.parse(result.map);
      nextMap.sourcesContent = [];
      map = combineSourcemaps(filename, [
        nextMap as RawSourceMap,
        inMap as RawSourceMap,
      ]) as SourceMap;
    } else {
      map = resolvedOptions.sourcemap
        ? JSON.parse(result.map)
        : { mappings: "" };
    }
    if (Array.isArray(map.sources)) {
      map.sources = map.sources.map((it) => toUpperCaseDriveLetter(it));
    }
    return {
      ...result,
      map,
    };
  } catch (e: any) {
    debug(`esbuild error with options used: `, resolvedOptions);
    // patch error information
    if (e.errors) {
      e.frame = "";
      e.errors.forEach((m: Message) => {
        e.frame += `\n` + prettifyMessage(m, code);
      });
      e.loc = e.errors[0].location;
    }
    throw e;
  }
}
```

## 总结

这一章我们了解了 vite 的插件机制, vite 的插件本质需要在 rollup 体系下执行, 因此 vite 封装了 createPluginContainer 函数, 通过它, vite 插件才得以在 rollup 的各个 hooks 中被调用.

此外, 我们还通过两个例子, 来了解插件是如何实现钩子函数的. 通过 vite:esbuild 这个例子, 我们知道了 vite 快的原因之一, 就是源码是按需编译的, 且编译使用了 esbuild.

下一章我们将重点学习 vite 的开发 server 是如何搭建的, 以及中间件机制是怎样运行的. 中间件在拦截请求后会调用这一章学到的插件机制, 来进行源码的转化. 敬请期待~
