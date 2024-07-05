---
title: 最強のGAS開発環境を構築する
description: esbuildとTypeScriptを使用して快適なGAS開発環境を構築します。
category: tech
author: miyaji
tags: [node, esbuild, javascript, typescript, gas]
---

## はじめに

GASは標準ではウェブエディタを使用して開発することができますが、開発環境が貧弱であるため、開発効率が悪いです。そこで、以下の要件を満たすGAS開発環境を構築します。

- ローカルで開発する
- TypeScriptで型検査する
- npmパッケージを使用できる
- ファイルを変更すると自動的にウェブに反映される

## TL;DR

以降の設定を全てまとめたテンプレートを作成しました。以下のリポジトリからダウンロードして使用してください。

https://github.com/miyaji255/gas-app-template

## claspだけではだめなのか

GASの開発環境をローカルで構築するためには、一般的にclaspを使用します。claspはGASの開発をローカルで行うためのツールです。`.clasp.json`を設定したディレクトリで`clasp push`を実行することで、GASのスクリプトをウェブに反映することができます。

claspはTypeScriptもサポートしていますが、import/export構文を使用することができません。つまり、npmパッケージも使用できません。

そのため、claspで`push`する前に、TypeScriptをJavaScriptにコンパイルしてバンドルする必要があります。

## esbuildを使用する

esbuildは高速なJavaScriptバンドラーです。ただし、esbuildでバンドルしただけではGASにエントリーポイントが認識されません。これを解消するためにesbuild-plugin-gas-generatorを作成しました。

https://oucc.org/blog/articles/2024-06-30-esbuild-plugin-gas-generator/

これを使ってビルドスクリプトを作成すると次のようになります。

```ts
import { build } from 'esbuild'
import GasGeneratorPlugin from 'esbuild-plugin-gas-generator'

build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: "esm",
  outfile: 'dist/index.js',
  plugins: [GasGeneratorPlugin()],
}).catch((e) => {
    console.error(e)
    process.exit(1)
})
```

さらに、`appsscript.json`を自動でコピーするように次のようなプラグインを足します。

```ts
const copyAppsScriptPlugin = {
  name: "copy-appsscript",
  setup(build) {
    build.onEnd(async () => {
      await copyFile('appsscript.json', 'dist/appsscript.json')
    })
  }
}
```

esbuildには標準でwatchモードがあります。これを使うとファイルを変更すると自動的にビルドされます。引数で分岐してbuildとwatchを切り替えることができるようにした、最終的なビルドスクリプトは次のようになります。

```ts
import GasGeneratorPlugin from "esbuild-plugin-gas-generator"
import { build, context, type BuildOptions } from "esbuild"
import { copyFile } from "fs/promises"

async function main() {
  const options = {
    entryPoints: ["src/index.ts"],
    bundle: true,
    outfile: "dist/index.js",
    format: "esm",
    plugins: [
      GasGeneratorPlugin(),
      {
        name: "copy-appsscript",
        setup(build) {
          build.onEnd(async () => {
            await copyFile("appsscript.json", "dist/appsscript.json")
          })
        }
      }
    ],
  } as const satisfies BuildOptions

  switch (process.argv[2]) {
    case "watch": {
      const ctx = await context({ ...options, logLevel: "info" })
      await ctx.watch();
      break;
    }
    case "build": {
      await build(options);
      break;
    }
    default: {
      console.error(`Unknown command: ${process.argv[2]}`);
      process.exit(1);
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
});
```

[tsx](https://github.com/privatenumber/tsx) を使用すると次のようなコマンドでビルドできます。

```sh
# ビルド
npx tsx esbuild.ts build
# ファイルを変更すると自動的にビルドされる
npx tsx esbuild.ts watch
```

## claspと組み合わせる

claspの設定は`.clasp.json`に記述します。distディレクトリにビルドされたファイルがあることを認識させるために、`rootDir`を設定します。

```json
{
  "scriptId": "YOUR_SCRIPT_ID",
  "rootDir": "dist"
}
```

claspにもwatchモードがあります。これを使うとファイルを変更すると自動的にウェブに反映されます。

```sh
npx tsx esbuild.ts watch
npx clasp push -f -w
```

ただし、どちらもwatchモードでは制御が戻ってこないので、別々のターミナルで実行する必要があります。

## おわりに

以上で最強のGAS開発環境を構築することができました。最終的な結果は以下のテンプレートにまとめてありますので、ぜひご利用ください。

https://github.com/miyaji255/gas-app-template
