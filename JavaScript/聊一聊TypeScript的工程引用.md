# 聊一聊 TypeScript 的工程引用

![logo](https://static.yancey.app/banner.png)

> 工程引用是 TypeScript 3.0 的新特性, 它支持将 TypeScript 程序的结构分割成更小的组成部分. 这样可以改善构建时间 (打开 composite 会自动开启增量编译), 强制在逻辑上对组件进行分离, 更好地组织你的代码.

## 不使用工程引用引发的痛点

考察下面的代码结构: 假设这是一个前后端未分离的项目, client 目录下存放的是**客户端**代码; server 目录下存放的**服务端**代码; common 存放的是一些**共用**代码, 比如一些 util 方法, `client/index.ts` 和 `server/index.ts` 会引用这里的代码.

\_\_test\_\_ 目录则存放的是一些单元测试的代码\, 它会分别引用 `src/client/index.ts` 和 `src/server/index.ts`.

并且整个工程只有一个 `tsconfig.json`, 它主要的配置是 `"outDir": "./dist"`, 也就是将编译后的文件存放到根目录的 dist 文件夹.

```ts
.
├── src
│   ├── client
│   │   ├── index.ts
│   ├── common
│   │   ├── index.ts
│   ├── server
│   │   ├── index.ts
├── __test__
│   ├── client.spec.ts
│   ├── server.spec.ts
├── package.json
├── tsconfig.json
└── yarn.lock
├── README.md

```

通过 `tsc` 命令进行编译, dist 文件下大致如下.

```ts
.
├── dist
│   ├── src
│   │   ├── client
│   │   ├── common
│   │   ├── server
│   ├── __test__

```

通过上面的 code structure, 可以罗列出几个痛点:

- 我们希望 src 下面的文件直接被编译到 dist 目录下\, 但由于 \_\_test\_\_ 的存在而达不到这样的效果\.

- 我们无法单独构建 client 端, 或者 server 端的代码.

- 我们不希望把 \_\_test\_\_ 构建到 dist 目录下\.

## 使用工程引用改造上面的项目

通过上面的代码, 我们能感受到仅仅一个 tsconfig.json 文件无法灵活的 hold 住个性化的编译配置, 因此尝试给每个目录都增加一个 tsconfig.json. (为了便于区分每个 tsconfig.json 文件, 下面将使用 ①②③④⑤ 序号代替)

```ts
.
├── src
│   ├── client
│   │   ├── index.ts
│   │   ├── tsconfig.json // ①
│   ├── common
│   │   ├── index.ts
│   │   ├── tsconfig.json // ②
│   ├── server
│   │   ├── index.ts
│   │   ├── tsconfig.json // ③
├── __test__
│   ├── client.spec.ts
│   ├── server.spec.ts
│   ├── tsconfig.json // ④
├── package.json
├── tsconfig.json // ⑤
└── yarn.lock
├── README.md

```

接下来改造一下根 tsconfig.json 文件, 也就是 ⑤.

```json
{
  "compilerOptions": {
    "target": "es5",
    "module": "commonjs",
    "strict": true,
    // "outDir": "./dist"  关闭 outDir 选项, 即不在根配置中指定输入目录

    "composite": true, // 使用 composite, 它意味着工程可以被引用, 并支持增量编译
    "declaration": true // 使用 composite 选项必须开启 declaration
  }
}
```

接下来改造 ①, 因为 ① 和 ③ 的配置大致相同, 这里不再赘述.

```json
{
  "extends": "../../tsconfig.json", // 首先导入 ⑤
  "compilerOptions": {
    "outDir": "../../dist/client" // 指定输入目录
  },
  "references": [{ "path": "../common" }] // 因为 client 引用了 common, 故需要将 common 引入进来
}
```

对于 ②, 因为它没有引用其他的模块, 因此只需要配置好 outDir 即可, 代码如下:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/common"
  }
}
```

对于 ④\, 为了不让测试文件被编译到 dist 目录下\, 就让编译后的文件也存放到 \_\_test\_\_ 好了\.

```json
{
  "extends": "../tsconfig.json",
  "references": [{ "path": "../src/client" }, { "path": "../src/server" }]
}
```

## 编译

既然配置写好了, 下面就可以愉快的编译了. 为了支持工程引用, TypeScript 使用了 `build` 的构建模式, 它可以构建单独的工程, 相关依赖也可以被自动构建, 下面我们构建 server 端的应用, 其中 -b 是 build 的简写, `verbose` 可以打印出一些构建信息.

```ts
tsc -b src/server --verbose

```

当 server 端被构建完毕后, server 文件夹和它所依赖的 common 文件夹就会被编译到 dist 目录下, 因此当你再编译 client 时, common 就不用被重复编译, 这样就提升了编译效率. 此外, 它会在每个目录下生成增量编译文件, 这样下次编译时就很快了.

此外, 你可以通过 `--clean` 参数来清除某个工程已构建的文件\, 下面是清理 \_\_test\_\_ 产生的文件\.

```ts
tsc -b __test__ --clean

```

## 总结

工程引用的优点如下:

- 解决了输出目录的结构问题

- 解决了单个工程的构建问题

- 通过增量编译提高了编译效率

其实 TypeScript 的[官方源码](https://github.com/microsoft/TypeScript)已经使用了工程引用技术, 在 src 目录下有一个根 tsconfig-base.json, 在其他的目录下, 如[server](https://github.com/microsoft/TypeScript/tree/master/src/server)目录下又有自己的 tsconfig.json, 摘录如下:

```json
{
  "extends": "../tsconfig-base",
  "compilerOptions": {
    "removeComments": false,
    "outFile": "../../built/local/server.js",
    "preserveConstEnums": true,
    "types": ["node"]
  },
  "references": [
    { "path": "../compiler" },
    { "path": "../jsTyping" },
    { "path": "../services" }
  ],
  "files": [
    "types.ts",
    "utilities.ts",
    "protocol.ts",
    "scriptInfo.ts",
    "typingsCache.ts",
    "project.ts",
    "editorServices.ts",
    "packageJsonCache.ts",
    "session.ts",
    "scriptVersionCache.ts"
  ]
}
```
