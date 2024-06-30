---
title: ESModuleをGASで実行できるようにする
description: esbuildを用いてESModuleをGAS環境で実行できるようにするプラグインを作成しました。
category: tech
author: miyaji
tags: [node, esbuild, javascript]
---

exportした関数のエントリーポイントを自動で生成するesbuildプラグイン **esbuild-plugin-gas-generator** を作成しました。

https://github.com/miyaji255/esbuild-plugin-gas-generator

https://www.npmjs.com/package/esbuild-plugin-gas-generator

## 使い方

build.jsに以下のように記述することで使用できます。プラグインの都合上bundleとformatは`true`と`'esm'`であることが必須です。

出力ファイルはoutfileかオプションのtargetsで指定する。

```js
const esbuild = require('esbuild');
const GasPlugin = require('esbuild-plugin-gas-generator');

esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    format: 'esm',    
    outfile: 'dist/bundle.js',
    plugins: [GasPlugin()],

    // targetsで指定する場合
    plugins: [
        GasPlugin({
            targets: ['dist/bundle.js']
        })
    ]
}).catch((e) => {
    console.error(e);
    process.exit(1);
});
```

エントリーポイントでexportすると自動でGAS用のエントリーポイントを生成します。

```typescript
export function hello() {
    console.log("hello")
}
```

## 実装

meriyahでパースしてexportした変数をすべて以下のように変換します

```javascript
function hello() {}
(()=>{
function hello() {
    console.log("hello")
}

globalThis.hello=hello;
})()
```
