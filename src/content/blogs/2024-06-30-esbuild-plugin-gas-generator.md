---
title: ESModuleをGASで実行できるようにする
description: esbuildを用いてESModuleをGAS環境で実行できるようにするプラグインを作成しました。
category: tech
author: miyaji
tags: [node, esbuild, javascript, gas]
---

GAS開発ではnpmライブラリを使うためにバンドルを行う必要があります。加えて、GASでエントリーポイントとして認識されるためには`function`を使って定義されている必要があります。

そこで、exportした関数のエントリーポイントを自動で生成するesbuildプラグイン **esbuild-plugin-gas-generator** を作成しました。

ESModuleとタイトルに書きましたがESModuleをバンドルできるというだけで、`import.meta`や Top Level Await は使えません。ご了承ください。

https://github.com/miyaji255/esbuild-plugin-gas-generator

https://www.npmjs.com/package/esbuild-plugin-gas-generator

## 使い方

build.jsに以下のように記述することで使用できます。プラグインの都合上bundleとformatは`true`と`'iife'`であることが必須です。

出力ファイルはoutfileかオプションのtargetsで指定する。

```js
const esbuild = require('esbuild');
const GasPlugin = require('esbuild-plugin-gas-generator');

esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    format: 'iife',    
    outfile: 'dist/bundle.js',
    plugins: [GasPlugin()],

    plugins: [
        GasPlugin({
            // appsscript.json のパスを指定する
            appsscript: "appsscript.json",
            // appsscript.json の内容を直接指定する
            appsscript: {
                timeZone: "Asia/Tokyo",
                dependencies: {},
                exceptionLogging: "STACKDRIVER",
                runtimeVersion: "V8"
            }
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

`export`されたシンボルを収集するためにv2ではesbuildのmetafileという機能を使いました。これはbuild結果からimport/exportの情報を取得できる機能です。

つまり、build中にもう一度buildしているということです。他のプラグインも2度ビルドしている場合、競合する可能性があるので`excludePlugins`で除外することができます。

こうして作成したメタデータから次のようなコードを生成します。

```javascript
function hello() {}
"use strict";
var _exports = (()=>{
    function hello() {
        console.log("hello")
    }
    return {hello}
})();
Object.assign(globalThis, _exports);
```

<details>
<summary>v1の実装</summary>

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

</details>
