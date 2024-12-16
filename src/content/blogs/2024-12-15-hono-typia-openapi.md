---
title: Hono + Typia で OpenAPI ドキュメントを生成する
description: Hono + Typia で作成した Hono の型から OpenAPI ドキュメントを生成するライブラリを作りました。
category: tech
author: miyaji
tags: [advent-calendar, javascript, typescript, openapi, hono, typia, rest-api]
---

この記事は、[OUCC Advent Calendar 2024](https://adventar.org/calendars/10655) の 15 日目の記事です。昨日は watamario さんの [AtCoder Beginners Selection の Shift only を x86 の bsf 命令で解く](/blog/articles/2024-12-14-bsf/) でした。本日は、私が作成したHono + Typia で作成した Hono の型から OpenAPI ドキュメントを生成するライブラリについて説明します。

作成したライブラリはこちらです。

https://github.com/miyaji255/hono-typia-openapi

## 動機

Hono には [@honojs/zod-openapi](https://hono.dev/examples/zod-openapi) というライブラリがあり、これを利用することでOpenAPIドキュメントを生成することができます。

しかし、このライブラリはその名の通りZodにしか対応しておらず、書き方もHonoから大きく変えることになり使いづらいです。TypiaはZodよりも高速なので[^1]、できることならばTypiaを使いたいところです。そこで、Honoの持つSchemaの型からOpenAPIドキュメントを生成するライブラリを作成しました。

また、型から生成することにより完全なゼロランタイムでOpenAPIドキュメントを生成することができます。

ちなみに、同じように @honojs/zod-openapi が使いづらいということで [Hono OpenAPI](https://github.com/rhinobase/hono-openapi) というライブラリも作成されています。これは Zod の他にも Valibot, Ark, TypeBox に対応していますが、Typia には対応していません。

## 使い方

CLIとPluginの2つの使い方がありますが、基本的にPluginで使うことを想定しています。

### インストール

```bash
npm install hono-typia-openapi
```

### Plugin

unpluginを使用して作成しているのでunpluginがサポートするフレームワーク[^2]であれば利用することができます。ここではesbuildを使った簡単な例を示します。

```typescript
import { build } from 'esbuild';
import HonoTypiaOpenAPIPLugin from 'hono-typia-openapi/esbuild';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/index.js',
  plugins: [
    HonoTypiaOpenAPIPLugin({
      title: "My App",
      appFile: `${import.meta.dirname}/src/app.ts`,
    }),
  ],
})
```

APIでは`AppType`というHonoの型をエクスポートします。この型を使ってOpenAPIドキュメントを生成します。

```typescript
// src/app.ts
import { Hono } from 'hono';

const app = new Hono()
  .get('/hello', c => c.json({ message: 'Hello, World!' }));

export type AppType = typeof app;
export default app;
```

引数に取る設定は次のとおりです。

```typescript
interface HtoConfig {
  /**
   * APIのタイトル
   * Info Object の title に対応します。
   * https://spec.openapis.org/oas/v3.1.0#info-object
   */
  title: string;

  /**
   * OpenAPI のバージョンです。
   * @default "3.1"
   */
  openapi: "3.1" | "3.0";

  /**
   * APIの説明
   * Info Object の description に対応します。
   * https://spec.openapis.org/oas/v3.1.0#info-object
   */
  description: string;

  /**
   * APIのバージョン
   * Info Object の version に対応します。
   * https://spec.openapis.org/oas/v3.1.0#info-object
   * @default "1.0.0"
   */
  version: string;

  /**
   * Hono app のファイルパス
   * このファイルにある Hono app の型を使用して OpenAPI ドキュメントを生成します。
   */
  appFile: string;

  /**
   * Hono app の型名
   * appFile にある Hono app の型名です。
   * @default "AppType"
   */
  appType: string;

  /**
   * 出力先のファイルパス
   * @default "openapi.json"
   */
  output?: string;

  /**
   * tsconfig のファイルパス
   * デフォルトでは カレントディレクトリから親ディレクトリを探索して見つかった tsconfig.json を使用します。
   */
  tsconfig?: string;

  /**
   * watch モード
   * @default false
   */
  watchMode?: boolean;
}
```

### CLI

CLIでは`hto`コマンドを使用します。

```bash
npx hto --title "My App" --app-file src/app.ts
```

設定はPluginと同じで、それぞれ次のように対応しています。

|CLI オプション|Plugin オプション|
|---|---|
|`-t`, `--title`|`title`|
|`-O`, `--openapi`|`openapi`|
|`-d`, `--description`|`description`|
|`-V`, `--app-version`|`version`|
|`-a`, `--app-file`|`appFile`|
|`-n`, `--app-type`|`appType`|
|`-o`, `--output`|`output`|
|`--tsconfig`|`tsconfig`|
|`-h`, `--help`|使用方法を表示します|
|`-v`, `--version`|バージョンを表示します|

CLIを使用する場合は設定をファイルで指定することができます。
サポートしているファイル形式は`js`, `mjs`, `cjs`, `ts`, `json`, `yaml`, `yml`です。
また、`package.json`に`hto`フィールドを追加することで設定を指定することもできます。

```javascript
// hto.config.mjs
import { defineConfig } from 'hono-typia-openapi/config';

export default defineConfig({
  title: "My App",
  appFile: `${import.meta.dirname}/src/app.ts`,
});
```

### Hono app の作成方法

Hono app は`@honojs/typia-validator`を使用することで自動的に型が指定されます。

注意事項としてはメソッドチェーンの形式で書かないと型が正しく扱われないことです。これは Hono Client も同様なのですが、メソッドチェーンにしないと変数の型がスキーマを表す型にならないためです。

逆にこれを利用することでスキーマに出力しないエンドポイントを作ることもできます。

```typescript
import { Hono } from 'hono';
import { typiaValidator } from '@honojs/typia-validator/http';
import typia, { type tags } from 'typia';

interface User {
  id: number & tags.Type<'uint32'>;
  name: string & tags.MaxLength<255>;
  age: number & tags.Type<'uint32'> & tags.Maximum<150>;
}

const app = new Hono()
  .get(
    '/user',
    typiaValidator('query', typia.http.createValidateQuery<{ age_from?: User["age"], age_to?: User["age"] }>()),
    (c) => {
      const { age_from, age_to } = c.req.valid('query');
      return c.json({ age_from, age_to });
    }
  ).put(
    '/user/:id',
    typiaValidator('param', typia.createValidate<{ id: `${number}` }>()),
    typiaValidator('body', typia.createValidate<User>()),
    (c) => {
      const { id } = c.req.valid('param');
      const user = c.req.valid('body');
      if (id !== user.id) {
        return c.status(400).json({ message: 'id does not match' });
      }
      return c.json({ id, user });
    }
  )

export type AppType = typeof app;
export default app;
```

### Swagger UI での表示

生成した OpenAPI ドキュメントは [@hono/swagger-ui](https://hono.dev/examples/swagger-ui) で表示することができます。ここでメソッドチェーンで書かないことによってスキーマに出力せずに swagger UI のエンドポイントを追加できます。

if文で環境変数を見ているのは開発環境でのみ swagger UI を表示するためです。さらに、識別子置換と Dead Code Elimination をバンドラーで行うことで本番環境に一切依存するコードがない完全なゼロランタイムが実現できます。

```typescript
import { Hono } from 'hono';
import { typiaValidator } from '@honojs/typia-validator/http';
import typia, { type tags } from 'typia';

interface User {
  id: number & tags.Type<'uint32'>;
  name: string & tags.MaxLength<255>;
  age: number & tags.Type<'uint32'> & tags.Maximum<150>;
}

const app = new Hono()
  // エンドポイントを定義

if (process.env.NODE_ENV !== "production") {
  const openapi = await import('node:fs/promises')
    .then((fs) => fs.readFile('openapi.json', 'utf-8'))
    .then(JSON.parse);
  const { swaggerUI } = await import('@hono/swagger-ui');

  app.get('/docs/openapi.json', (c) => c.json(openapi));
  app.get('/docs', swaggerUI(openapi));
}

export type AppType = typeof app;
export default app;
```

## 今後の予定

今後は次のような機能を追加する予定です。

- Typia の JSON シリアライザを簡単に扱えるようにするヘルパーの作成
- Return Type を簡単に指定できるヘルパーの作成
- エラー表示をわかりやすくする
- Description の自動生成
- タグの指定

## まとめ

Hono + Typia で OpenAPI ドキュメントを生成するライブラリを作成しました。これにより、型から完全なゼロランタイムで OpenAPI ドキュメントを生成することができます。


[^1]: Typia 調べ
      https://typia.io/docs/validators/is/#performance
[^2]: Vite, Rollup, Webpack, esbuild, Rspack, Rolldown, Farm
