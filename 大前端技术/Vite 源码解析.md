# Vite 源码解析

> Vite

## 什么是 Vite

balabala

## 项目结构

整体来讲, Vite 有两大部分组成, 分别是 client 和 node. 而 node 是重头戏, 负责优化(optimizer), 插件(plugins), 服务端渲染(ssr), 服务(server).

其中服务模块是我们要讲到的重点, 它提供了后端服务, 基于 WebSocket 通信的 HMR 系统, 依赖图构建, 中间件等功能.

## 从 cli 开始

我们进入 `vite/src/cli.ts` 文件, 找到 `vite dev` 对应的指令, 可以看到它最主要是调用了 `vite/src/node/server.ts` 文件中的 `createServer` 方法. 不难看出开发环境最重要的是要起一个后端服务.

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

我们粗略的看一下

- `resolveConfig`: 解析配置文件
- `resolveHttpsConfig`: 解析 https 配置(如果有)

## resolveConfig

```ts
const config = await resolveConfig(inlineConfig, "serve", "development");
```

`createServer` 中调用的第一个函数是 `resolveConfig`. 和其他的构建工具一样, vite 也提供 `vite.config.js` 来作为它的配置文件, 因此 vite 首要目标是要读取和解析配置文件. 此外 vite 还支持插件机制和 env 环境变量. 因此该函数就是为了在 vite server 跑起来之前, 加载和配置前置资源.

该函数第一个参数是 `inlineConfig`, 也就是我们在命令行中指定的配置; 第二个参数是指定的命令模式, 有 `serve` 和 `build` 两种, 开发环境显然是前者; 第三个参数是指定的环境.

### loadConfigFromFile

在 `resolveConfig` 函数中, 首先执行的方法是 `loadConfigFromFile`, 这个方法是用来加载配置文件的. 可以看到, 如果你不显式的将 `configFile` 设为 `false`, 它会执行 `loadConfigFromFile` 函数, 配置文件可能来自用户指定的文件, 也可能是缺省配置文件, 比如 `vite.config.js`.

```ts
let { configFile } = config;
if (configFile !== false) {
  const loadResult = await loadConfigFromFile(
    configEnv,
    configFile,
    config.root,
    config.logLevel
  );
  if (loadResult) {
    config = mergeConfig(loadResult.config, config);
    configFile = loadResult.path;
    configFileDependencies = loadResult.dependencies;
  }
}
```

#### 判断是否为 ESM

在 `loadConfigFromFile` 函数中, 它首先去寻找你工程根目录下的 `package.json` 文件, 如果配置了 `module` 属性, 说明你的项目支持 `.mjs`, 故把内部变量 `isESM` 设为 `true`.

```ts
try {
  const pkg = lookupFile(configRoot, ["package.json"]);
  if (pkg && JSON.parse(pkg).type === "module") {
    isESM = true;
  }
} catch (e) {}
```

#### 寻找配置文件的解析(绝对)路径

接下来, 在 `loadConfigFromFile` 函数中, 如果你手动提供了配置文件的(相对)路径, 则直接获取这个配置文件的绝对路径, 否则, 它会读取是否有缺省的配置文件路径, 比如 `vite.config.js`, `vite.config.mjs`, `vite.config.ts`, `vite.config.cjs`.

```ts
if (configFile) {
  // explicit config path is always resolved from cwd
  resolvedPath = path.resolve(configFile);
  isTS = configFile.endsWith(".ts");

  if (configFile.endsWith(".mjs")) {
    isESM = true;
  }
} else {
  // implicit config file loaded from inline root (if present)
  // otherwise from cwd
  const jsconfigFile = path.resolve(configRoot, "vite.config.js");
  if (fs.existsSync(jsconfigFile)) {
    resolvedPath = jsconfigFile;
  }

  if (!resolvedPath) {
    const mjsconfigFile = path.resolve(configRoot, "vite.config.mjs");
    if (fs.existsSync(mjsconfigFile)) {
      resolvedPath = mjsconfigFile;
      isESM = true;
    }
  }

  if (!resolvedPath) {
    const tsconfigFile = path.resolve(configRoot, "vite.config.ts");
    if (fs.existsSync(tsconfigFile)) {
      resolvedPath = tsconfigFile;
      isTS = true;
    }
  }

  if (!resolvedPath) {
    const cjsConfigFile = path.resolve(configRoot, "vite.config.cjs");
    if (fs.existsSync(cjsConfigFile)) {
      resolvedPath = cjsConfigFile;
      isESM = false;
    }
  }
}
```

#### 加载/解析配置文件

在读取到了配置文件的绝对路径之后就要开始解析了, 源码如下所示.

> isESM 和 isTS 这段代码没看懂啥意思, 总之就是 TypeScript 和 ESM 加持的配置文件正常加载有坑, 先 hack 了一下, 留个 TODO: 先. 我们先看 `pathToFileURL`, `bundleConfigFile`, `dynamicImport` 这几个函数.

```ts
try {
  let userConfig: UserConfigExport | undefined;

  if (isESM) {
    const fileUrl = pathToFileURL(resolvedPath); // 拿到 file:/// 的路径
    const bundled = await bundleConfigFile(resolvedPath, true); // 用 esbuild 解析配置文件, 如 vite.config.js
    dependencies = bundled.dependencies;
    if (isTS) {
      // 在我们无需用户自己使用 --experimental-loader 运行 node 的情况下注册加载器之前，
      // 我们必须在这里做一个 hack:
      // 先将代码用 esbuild 转换, 再写入磁盘, 再动态加载, 然后删除.

      // before we can register loaders without requiring users to run node
      // with --experimental-loader themselves, we have to do a hack here:
      // bundle the config file w/ ts transforms first, write it to disk,
      // load it with native Node ESM, then delete the file.
      fs.writeFileSync(resolvedPath + ".js", bundled.code); // 写入磁盘
      userConfig = (await dynamicImport(`${fileUrl}.js?t=${Date.now()}`))
        .default; // 加载
      fs.unlinkSync(resolvedPath + ".js"); // 删除
      debug(`TS + native esm config loaded in ${getTime()}`, fileUrl);
    } else {
      // 使用 Function 来避免被 TS/Rollup 编译掉附加一个查询，
      // 以便我们在服务器重启的情况下强制重新加载新配置

      // using Function to avoid this from being compiled away by TS/Rollup
      // append a query so that we force reload fresh config in case of
      // server restart
      userConfig = (await dynamicImport(`${fileUrl}?t=${Date.now()}`)).default;
      debug(`native esm config loaded in ${getTime()}`, fileUrl);
    }
  }

  if (!userConfig) {
    // Bundle config file and transpile it to cjs using esbuild.
    const bundled = await bundleConfigFile(resolvedPath);
    dependencies = bundled.dependencies;
    userConfig = await loadConfigFromBundledFile(resolvedPath, bundled.code);
    debug(`bundled config file loaded in ${getTime()}`);
  }

  const config = await(
    typeof userConfig === "function" ? userConfig(configEnv) : userConfig
  );
  if (!isObject(config)) {
    throw new Error(`config must export or return an object.`);
  }
  return {
    path: normalizePath(resolvedPath),
    config,
    dependencies,
  };
} catch (e) {
  createLogger(logLevel).error(
    colors.red(`failed to load config from ${resolvedPath}`),
    { error: e }
  );
  throw e;
}
```

#### 讲一讲 pathToFileURL

首先看 `pathToFileURL`, 它来自 `node:url` 中的原生方法, 用来转换路径为 `file:` 协议, 并且可以对路径进行 encode. 我们看下面这个例子:

```ts
import { pathToFileURL } from "url";

pathToFileURL("/hello/おはよう/🦙.txt");

// URL {
//   href: 'file:///hello/%E3%81%8A%E3%81%AF%E3%82%88%E3%81%86/%F0%9F%A6%99.txt',
//   origin: 'null',
//   protocol: 'file:',
//   username: '',
//   password: '',
//   host: '',
//   hostname: '',
//   port: '',
//   pathname: '/hello/%E3%81%8A%E3%81%AF%E3%82%88%E3%81%86/%F0%9F%A6%99.txt',
//   search: '',
//   searchParams: URLSearchParams {},
//   hash: ''
// }
```

可以看到, 它返回的是 URL 类型. 没错, 就是我们在浏览器中看到的那个 URL.

![URL](https://edge.yancey.app/beg/eoqtlli0-1655641710727.png)

当然 `node:url` 也有个 URL 构造函数, 但比起 `pathToFileURL`, 它无法对路径进行 encode, 这也大抵是 core team 不选择 URL 的原因. 我们看一下官方的例子:

```ts
import { pathToFileURL } from "node:url";

new URL("/foo#1", "file:"); // Incorrect: file:///foo#1
pathToFileURL("/foo#1"); // Correct:   file:///foo%231 (POSIX)

new URL("/some/path%.c", "file:"); // Incorrect: file:///some/path%.c
pathToFileURL("/some/path%.c"); // Correct:   file:///some/path%25.c (POSIX)
```

最后再说一点, `pathToFileURL` 的返回值是 URL 类型, 可以对它使用 `toString` 方法, 就能获得 URL 中的 href 属性. 因此, vite 源码中直接使用模板字面量, 也就是 `${fileUrl}.js?t=${Date.now()}`, 就把 `fileUrl` 转换成了字符串了.

#### 用 esbuild 解析配置文件

`bundleConfigFile` 使用 esbuild 来编译配置文件, 这需要你有一定的 esbuild 知识储备才行. 这块代码难度不大, 直接写在注释里, 具体代码如下:

```ts
async function bundleConfigFile(
  fileName: string,
  isESM = false
): Promise<{ code: string; dependencies: string[] }> {
  const importMetaUrlVarName = "__vite_injected_original_import_meta_url";
  const result = await build({
    absWorkingDir: process.cwd(), // 绝对根路径
    entryPoints: [fileName], // 配置文件的绝对路径
    outfile: "out.js", // 输出的文件名
    write: false, // 不写入到磁盘, 仅仅能拿到编译结果即可
    platform: "node", // 编译到的目标平台, 'browser' | 'node' | 'neutral', 这里显然是 node
    bundle: true, // 是否打包
    format: isESM ? "esm" : "cjs", // 通过上一步拿到的 isESM 判断打包成的形式
    sourcemap: "inline", // 内联 sourcemap
    metafile: true, // 元信息, 一般这个用做打包分析, 类似于 webpack 中的 `stats.json`
    define: {
      // import.meta 是原生 ESM 中的 API, 下面是一个例子
      // <script type="module" src="my-module.mjs"></script>
      // console.log(import.meta.url); // "file:///home/user/my-module.mjs"
      "import.meta.url": importMetaUrlVarName,
    },
    plugins: [
      {
        // 在解析时查找哪些是三方依赖, 标记上 external, 不把它们打包进来
        // 比如下面这段配置:

        /* 
        import { defineConfig } from 'vite'
        import react from '@vitejs/plugin-react'

        // https://vitejs.dev/config/
        export default defineConfig({
          plugins: [react()],
        })
        */

        // 就可以拿到以下三个依赖, 显然应该被打上 external 的是后两个
        // ./vite.config.js
        // vite
        // @vitejs/plugin-react
        name: "externalize-deps",
        setup(build) {
          build.onResolve({ filter: /.*/ }, (args) => {
            const id = args.path;
            if (id[0] !== "." && !path.isAbsolute(id)) {
              return {
                external: true,
              };
            }
          });
        },
      },
      {
        // 在加载时注入一些额外代码
        name: "inject-file-scope-variables",
        setup(build) {
          build.onLoad({ filter: /\.[jt]s$/ }, async (args) => {
            const contents = await fs.promises.readFile(args.path, "utf8");
            const injectValues =
              `const __dirname = ${JSON.stringify(path.dirname(args.path))};` +
              `const __filename = ${JSON.stringify(args.path)};` +
              `const ${importMetaUrlVarName} = ${JSON.stringify(
                pathToFileURL(args.path).href
              )};`;

            return {
              loader: args.path.endsWith(".ts") ? "ts" : "js",
              contents: injectValues + contents,
            };
          });
        },
      },
    ],
  });
  const { text } = result.outputFiles[0];
  return {
    code: text, // 被编译后的代码的文本
    dependencies: result.metafile ? Object.keys(result.metafile.inputs) : [], // 如果配置文件是 vite.config.js, 这里拿到的就是 ['vite.config.js']
  };
}
```

#### dynamicImport

接下来, 我们看到有一个 `dynamicImport` 函数, 比较有意思. 它的作用是动态加载代码, 并且返回一个 Promise, 这个 Promise 就是模块的加载结果.

```ts
export const dynamicImport = usingDynamicImport
  ? new Function("file", "return import(file)")
  : _require;
```

它有两种方式, 一个是原生 `node:module` 下的 `createRequire` 函数, 我写个例子如下. NodeJS 官网写 [Must be a file URL object, file URL string, or absolute path string.](https://nodejs.org/api/module.html#modulecreaterequirefilename), 不过我看着写相对路径也 OJBK.

```ts
import { createRequire } from "module";

const _require = createRequire(import.meta.url);
const siblingModule = _require("./hello.ts");

console.log(siblingModule); // 打印出 hello.ts 中的代码
```

第二种方式你可以看到在 `new Function` 的参数里面注入了代码字符串, 如果你不熟悉这种语法的话, 想必也能联想的 eval, 没错, `new Function` 执行代码字符串性能, 安全性要比 eval 高的高, 具体可以看 [never_use_eval](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#never_use_eval!) 这篇文章.

其实 vite 早期代码, 尤大也是用 eval 写的, 后来才改成了 Function. 具体 MR 可以看 [fix: use Function instead of eval to dynamically import config files (#5213)](https://github.com/vitejs/vite/pull/5213)

```ts
async function dynamicImport() {
  const _require = new Function("file", "return import(file)");
  await _require("./hello.js");
}

dynamicImport();
```

### mergeConfig

当配置解析完成后, 会通过 `mergeConfig` 方法将配置文件中的配置和 `inlineConfig` 合并, 最终为 vite 提供运行时的框架配置.

```ts
if (loadResult) {
  config = mergeConfig(loadResult.config, config);
  configFile = loadResult.path;
  configFileDependencies = loadResult.dependencies;
}
```
