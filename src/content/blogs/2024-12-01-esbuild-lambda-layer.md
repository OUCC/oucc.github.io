---
title: esbuildで効率の良いLambda Layerを作る
description: "esbuildを使ってLambdaとLambda Layer用のバンドル方法をCDKを交えて説明します。"
category: tech
author: miyaji
tags: ["esbuild", "javascript", "aws", "aws-lambda", "aws-cdk"]
---

CDKでLambdaには`NodejsFunction`というバンドルとminifyを行うConstructがあるものの、Lambda Layerにはそのようなものがありません。そこで、esbuildを使ってLambdaとLambda Layerの両方のバンドルを行なっていきます。

## esbuildのCode Splitting

esbuildはCode Splittingという複数のエントリーポイント間で共有されるコードを別の共有ファイルに分割する機能があります。具体的には以下のようなファイルが有るとき次のようにバンドルされます。

**バンドル前**
```javascript
// a.js
import { shared1 } from './shared1.js';
import { shared2 } from './shared2.js';

export function a() {
  console.log('a');
  shared1();
  shared2();
}

// b.js
import { shared1 } from './shared1.js';
import { shared2 } from './shared2.js';

export function b() {
  console.log('b');
  shared1();
  shared2();
}

// shared1.js
export function shared1() {
  console.log('shared1');
}

// shared2.js
export function shared2() {
  console.log('shared2');
}
```

**バンドル後**
```javascript
// a.js
import { shared1, shared2 } from './chunk-1.js';
function a() {
  console.log('a');
  shared1();
  shared2();
}

// b.js
import { shared1, shared2 } from './chunk-1.js';
function b() {
  console.log('b');
  shared1();
  shared2();
}

// chunk-1.js
export function shared1() {
  console.log('shared1');
}

export function shared2() {
  console.log('shared2');
}
```

この機能を使って共有部分を切り出してLambda Layerを作ります。


## パッケージ化する

LambdaとLambda Layerは次のような位置に配置されます

- Lambda: `/var/task`
- Lambda Layer: `/opt`

また、`NODE_PATH`環境変数には次のような値が含まれます。

- `/opt/nodejs/node_modules`
- `/opt/nodejs/node16/node_modules`
- `/opt/nodejs/node18/node_modules`
- `/opt/nodejs/node20/node_modules`

したがって、Lambda Layerには`/opt/nodejs/node_modules`にパッケージを配置する必要があります。
Lambda Layerを参照する際はパッケージ名を用いることを前提とした設計になっていますが、esbuildのCode Splittingは相対パスで出力されるため、インポートパスをビルド後に書き換えることで対応します。

## ビルドスクリプトの作成

以上をまとめてビルドスクリプトを作成します。処理としては以下の通りです。

1. ビルドする
2. インポートパスを書き換える
3. Lambda Layer用のpackage.jsonを作成する

```javascript
import { build } from 'esbuild';
import { readdir, writeFile, readFile } from 'node:fs/promises';

// ビルドする
await build({
  entryPoints: ["src/lambda/handler1.js", "src/lambda/handler2.js"],
  bundle: true,
  splitting: true,
  minify: true,
  format: "esm",
  platform: "node",
  target: "node20",
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
  entryNames: "handlers/[name]",
  chunkNames: "layers/nodejs/node_modules/layers/[name]-[hash]",
});

// Lambda Layerに対するimport pathを書き換える
const chunks = await readdir("dist/layers/nodejs/node_modules/layers");
const searchValue = new RegExp(
  `(?<=from\\s*")(\\./|\\.\\./)*layers/nodejs/node_modules/layers(?=/(${chunks.map((f) => f.replaceAll(".", "\\.")).join("|")})")`,
  "g"
);

const handlers = await readdir("dist/handlers");
await Promise.all(
  handlers.map(async (handler) => {
    const content = await readFile(`dist/handlers/${handler}`, "utf-8");
    await writeFile(
      `dist/handlers/${handler}`,
      content.replaceAll(searchValue, "layers")
    );
  })
);

// Lambda Layer用のpackage.jsonを作成する
await writeFile(
  "dist/layers/nodejs/node_modules/layers/package.json",
  JSON.stringify({
    name: "layers",
    version: "1.0.0",
    type: "module",
  })
);
```

## 更に効率化する

ここまでで十分な効率化が行えますが、更に効率化するためには以下のような手法があります。

### aws-sdkの除外

Node.jsのLambdaにはaws-sdkが含まれているため、バンドル結果に含める必要はありません。esbuildの`external`オプションを使って除外します。

```diff
  await build({
    entryPoints: ["src/lambda/handler1.js", "src/lambda/handler2.js"],
    bundle: true,
    splitting: true,
    minify: true,
    format: "esm",
    platform: "node",
    target: "node20",
    outdir: "dist",
    outExtension: { ".js": ".mjs" },
    entryNames: "handlers/[name]",
    chunkNames: "layers/nodejs/node_modules/layers/[name]-[hash]",
+   external: ["@aws-sdk/*"],
  });
```

### `node_modules`をsourcemapから除外

エラー出力をわかりやすくするためにsourcemapを含めることがありますが、sourcemapは非常に大きいです。`node_modules`を除外することでsourcemapのサイズを削減します。

```diff
+ /** @type {import("esbuild").Plugin} */
+ const excludeNodeModulesFromSourceMapPlugin = {
+   name: "excludeNodeModulesFromSourceMapPlugin",
+   setup(build) {
+     const emptySourceMapAsBase64 = Buffer.from(JSON.stringify({ version: 3, sources: [""], mappings: "A" })).toString(
+       "base64"
+     );
+     build.onLoad({ filter: /node_modules.+\.(js|mjs|cjs|ts|mts|cts)$/ }, async (args) => {
+       return {
+         contents: `${await readFile(args.path, "utf8")}\n//# sourceMappingURL=data:application/json;base64,${emptySourceMapAsBase64}`,
+         loader: "default",
+       };
+     });
+   },
+ };

  await build({
    entryPoints: ["src/lambda/handler1.js", "src/lambda/handler2.js"],
    bundle: true,
    splitting: true,
    minify: true,
    format: "esm",
    platform: "node",
    target: "node20",
    outdir: "dist",
    outExtension: { ".js": ".mjs" },
    entryNames: "handlers/[name]",
    chunkNames: "layers/nodejs/node_modules/layers/[name]-[hash]",
    external: ["@aws-sdk/*"],
+   sourcemap: "inline",
+   sourceContent: false,
+   plugins: [excludeNodeModulesFromSourceMapPlugin],
  });
```

ここで使用した`excludeNodeModulesFromSourceMapPlugin`はesbuildのissueのコメントにあるものを使用させていただきました。
https://github.com/evanw/esbuild/issues/1685#issuecomment-944928069

### defineを使って環境変数を埋め込む

esbuildでは`define`を使ってシンボルに値を埋め込むことができます。これにより、falseであると確定されたif分岐は削除されます。

```diff
  await build({
    entryPoints: ["src/lambda/handler1.js", "src/lambda/handler2.js"],
    bundle: true,
    splitting: true,
    minify: true,
    format: "esm",
    platform: "node",
    target: "node20",
    outdir: "dist",
    outExtension: { ".js": ".mjs" },
    entryNames: "handlers/[name]",
    chunkNames: "layers/nodejs/node_modules/layers/[name]-[hash]",
    external: ["@aws-sdk/*"],
    sourcemap: "inline",
    sourceContent: false,
    plugins: [excludeNodeModulesFromSourceMapPlugin],
+   define: {
+     "process.env.NODE_ENV": '"production"',
+   },
  });
```

他にもesbuildには最適化のオプションがありますので、必要に応じて使ってみてください。
https://esbuild.github.io/api/#optimization

## CDK

以上のビルドスクリプトで作成したファイルをCode AssetとしてCDKでLambdaとLambda Layerを作成します。

ポイントとしてはassetから指定したhandler以外を除外することです。これにより、Lambdaには必要なファイルのみが含まれるため、Lambdaのサイズを小さくすることができます。

```typescript
const lambdaLayer = new lambda.LayerVersion(this, "LambdaLayer", {
  code: lambda.Code.fromAsset("dist/layers"),
  compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
});

const handlers = readdirSync("dist/handlers");

const handler1 = new lambda.NodejsFunction(this, "Handler1", {
  handler: "handler1.handler",
  code: lambda.Code.fromAsset("dist/handlers", {
    exclude: handlers.filter((handler) => handler !== "handler1.mjs").map(handler => `**/${handler}`),
  }),
  layers: [lambdaLayer],
  runtime: lambda.Runtime.NODEJS_20_X,
});

const handler2 = new lambda.NodejsFunction(this, "Handler2", {
  handler: "handler2.handler",
  code: lambda.Code.fromAsset("dist/handlers", {
    exclude: handlers.filter((handler) => handler !== "handler2.mjs").map(handler => `**/${handler}`),
  }),
  layers: [lambdaLayer],
  runtime: lambda.Runtime.NODEJS_20_X,
});
```

## まとめ

これで効率の良いLambda Layerを作成することができました。

最後に完成したビルドスクリプトをまとめておきます。

<details>
<summary>ビルドスクリプト</summary>

```javascript
import { build } from 'esbuild';
import { readdir, writeFile, readFile } from 'node:fs/promises';

import { build } from 'esbuild';
import { readdir, writeFile, readFile } from 'node:fs/promises';

/** @type {import("esbuild").Plugin} */
const excludeNodeModulesFromSourceMapPlugin = {
  name: "excludeNodeModulesFromSourceMapPlugin",
  setup(build) {
    const emptySourceMapAsBase64 = Buffer.from(JSON.stringify({ version: 3, sources: [""], mappings: "A" })).toString(
      "base64"
    );
    build.onLoad({ filter: /node_modules.+\.(js|mjs|cjs|ts|mts|cts)$/ }, async (args) => {
      return {
        contents: `${await readFile(args.path, "utf8")}\n//# sourceMappingURL=data:application/json;base64,${emptySourceMapAsBase64}`,
        loader: "default",
      };
    });
  },
};


// ビルドする
await build({
  entryPoints: ["src/lambda/handler1.js", "src/lambda/handler2.js"],
  bundle: true,
  splitting: true,
  minify: true,
  format: "esm",
  platform: "node",
  target: "node20",
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
  entryNames: "handlers/[name]",
  chunkNames: "layers/nodejs/node_modules/layers/[name]-[hash]",    external: ["@aws-sdk/*"],
  sourcemap: "inline",
  sourceContent: false,
  plugins: [excludeNodeModulesFromSourceMapPlugin],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});

// Lambda Layerに対するimport pathを書き換える
const chunks = await readdir("dist/layers/nodejs/node_modules/layers");
const searchValue = new RegExp(
  `(?<=from\\s*")(\\./|\\.\\./)*layers/nodejs/node_modules/layers(?=/(${chunks.map((f) => f.replaceAll(".", "\\.")).join("|")})")`,
  "g"
);

const handlers = await readdir("dist/handlers");
await Promise.all(
  handlers.map(async (handler) => {
    const content = await readFile(`dist/handlers/${handler}`, "utf-8");
    await writeFile(
      `dist/handlers/${handler}`,
      content.replaceAll(searchValue, "layers")
    );
  })
);

// Lambda Layer用のpackage.jsonを作成する
await writeFile(
  "dist/layers/nodejs/node_modules/layers/package.json",
  JSON.stringify({
    name: "layers",
    version: "1.0.0",
    type: "module",
  })
);
```

</details>

## 参考資料

- esbuild 最適化芸人 (TATUSNO Yasuhiro) - Speaker Deck
  https://speakerdeck.com/exoego/esbuild-zui-shi-hua-yun-ren
- Node.jsのLambdaコールドスタートで熱を上げる方法 (Matt Straathof) - Momento
  https://www.gomomento.com/jp/resources/blog-jp/how-we-turned-up-the-heat-on-node-js-lambda-cold-starts/
- `excludeNodeModulesFromSourceMapPlugin`の元ネタ
  https://github.com/evanw/esbuild/issues/1685#issuecomment-944928069