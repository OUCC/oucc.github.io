# ブログの投稿に関して

OUCC BLOG の仕様について記載しています。何もわからない場合はサーバー係に投稿したい Markdown ファイルを渡してください。

ブログの投稿を行う際はブランチ名が `blog/` で始まるブランチを作成し作業してください。このブランチではブログの投稿に関する作業以外は禁止されていますが、後述するようにCIによる支援が得られます。

ブログに関して作業することを明示しつつこの制約を受けたくない場合は、ブランチ名が `blog/admin/` で始まるブランチで作業してください。

## 記事の投稿

`src/content/blogs` に Markdown ファイルを追加することで新しい記事を投稿できます。以下のように Markdown のフロントマッターに情報を書くことで投稿者やタグなどを設定できます。著者とタグは下のように JSON で設定したファイルのファイル名を指定できます。

```md
---
title: タイトル
description: 説明
author: 著者
tags:
  - タグ1
  - タグ2
  - タグ3
---
```

画像ファイルは `src/content/blogs` に新しいディレクトリを作成してそこに配置するか、または外部においてURLで指定してください。

※ ファイル名には `#` を含めることができません。

## 記事のメタ情報

記事のメタ情報には投稿日時と更新日時が含まれています。これは `blog/` から始まるブランチで Pull Request を出すと自動的に更新されます。

以下のようにコマンドを使うことで手動で更新することもできます。

```bash
$ npm run update-blogmeta -- src/content/blogs/NEW-POST1.md src/content/blogs/NEW-POST2.md
```

## 著者

`src/content/authors` に JSON ファイルを追加することで新しいタグを作ることができます。ファイル名は記事の `author` で指定する際の値となるのでわかりやすい名前にすることをおすすめします。
著者のスキーマは以下のとおりです。`name` 以外のプロパティは省略可能です。

- name : 著者の表示名
- description : 著者の説明
- github : GitHub アカウントの ID (image を指定しなかった場合、こちらで指定したアカウントのアイコンが使用されます。)
- image : 著者のアイコン
  - `svg` は `src/assets/icons/blog` に入っているsvgファイルを指定できます。`name` には拡張子を除いたファイル名を指定してください。
  - `external-url` は外部の画像を指定できます。

```ts
interface Author {
  name: string
  description?: string
  github?: string
  image?:
    | {
        type: 'svg'
        name: string
      }
    | {
        type: 'external-url'
        url: string
      }
}
```

## タグ

`src/content/tags` に JSON ファイルを追加することで新しいタグを作ることができます。ファイル名は記事の `tags` で指定する際の値となるのでわかりやすい名前にすることをおすすめします。
タグのスキーマは以下のとおりです。 `name` 以外のプロパティは省略可能です。

- name : タグの表示名
- description : タグの説明
- image : タグのアイコン
  - `svg` は `src/assets/icons/blog` に入っているsvgファイルを指定できます。`name` には拡張子を除いたファイル名を指定してください。
  - `external-url` は外部の画像を指定できます。
- site : 公式サイト
  - url : 公式サイトのURL
  - text : リンクの表示名 (指定のない場合 `タグ名 - 公式サイト` となります)
- document : 公式ドキュメント
  - url : 公式ドキュメントのURL
  - text : リンクの表示名 (指定のない場合 `タグ名 - 公式ドキュメント` となります)
- github : GitHubのリポジトリ
  - url : GitHubのリポジトリのURL
  - text : リンクの表示名 (指定のない場合 `タグ名 - GitHub` となります)

```ts
interface Tag {
  name: string
  description?: string
  image?:
    | {
        type: 'svg'
        name: string
      }
    | {
        type: 'external-url'
        url: string
      }
  site?: {
    url: string
    text?: string
  }
  document?: {
    url: string
    text?: string
  }
  github?: {
    url: string
    text?: string
  }
}
```
