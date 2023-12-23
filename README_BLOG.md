# ブログの投稿に関して

OUCC BLOG の仕様について記載しています。何もわからない場合はサーバー係に投稿したい Markdown ファイルを渡してください。

ブログの投稿を行う際はブランチ名が `blog/` で始まるブランチを作成し作業してください。このブランチではブログの投稿に関する作業以外は禁止されていますが、後述するように投稿日時や更新日時が自動で生成されます。

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

これは記事本文です。Markdownで文章を書くことができます。
```

画像ファイルは `src/content/blogs` に新しいディレクトリを作成してそこに配置するか、または外部においてURLで指定してください。

※ ファイル名には `#` を含めることができません。

## 記事のメタ情報

`src/content/blog-metas`にある記事のメタ情報には投稿日時と更新日時が含まれています。これは `blog/` から始まるブランチで Pull Request を出すと自動的に作成・更新されます。

以下のようにコマンドを使うことで手動で更新することもできます。

```bash
$ npm run update-blogmeta -- src/content/blogs/NEW-POST1.md src/content/blogs/NEW-POST2.md
```

## 著者の追加

`src/content/authors` に JSON ファイルを追加することで著者ページを作ることができます。ファイル名は記事の `author` で指定する際の値となるので自身のIDなどわかりやすい名前にしてください。

著者のスキーマは以下のとおりです。`name` 以外のプロパティは省略可能です。

- name : 著者の表示名（必須）
- description : 著者の説明
- github : GitHub アカウントの ID
- image : アイコンの画像ファイル（詳細は後述）

Example: `src/content/authors/octocat.json`

```json
{
  "name": "Octocat",
  "description": "八本足の猫です。",
  "github": "octocat",
  "image": "./octocat.svg"
}
```

### 著者のアイコン（任意）

`src/content/authors`に画像ファイルを置き、JSONでファイル名を指定することでアイコンを変更できます。ファイル名はJSONと同じものにしてください。画像フォーマットにはSVG, PNG, JPEG等が使用できます。

例えばJSONが`octocat.json`の場合、アイコンのファイル名は`octocat.svg`とし、JSONでは`"image": "./octocat.svg"`と指定してください。

なお、画像を指定しなかった場合はGitHubのアイコンが使用されます。

## タグの追加

`src/content/tags` に JSON ファイルを追加することで新しいタグを作ることができます。ファイル名は記事の `tags` で指定する際の値となるのでわかりやすい名前にすることをおすすめします。

タグのスキーマは以下のとおりです。 `name` 以外のプロパティは省略可能です。

- name : タグの表示名（必須）
- description : タグの説明
- image : アイコンの画像ファイル（詳細は後述）
- fullSizeImage : 背景全てに色がついている場合にしてください。アイコンとして表示されるときに円形に切り取られます。
- links : 関連リンクの配列です。GitHubや公式ドキュメントなどを追加してください。
  - URL
  - リンクの表示テキスト

※ 詳細すぎるタグは追加しないでください

Example: `src/content/tags/dotnet.json`

```json
{
  "name": ".NET",
  "description": ".NET は C#, F#, VB.NET などが実行可能な仮想マシンです。(JVM に似ています) クラスプラットフォームであるためどんな環境でも同じコードで実行できます。",
  "image": "./dotnet.svg",
  "fullSizeImage": true,
  "links": [
    {
      "url": "https://learn.microsoft.com/ja-jp/dotnet/core/introduction",
      "text": ".NET とは何ですか? 概要 - Microsoft 公式ドキュメント"
    },
    {
      "url": "https://learn.microsoft.com/ja-jp/dotnet/",
      "text": "Microsoft 公式ドキュメント"
    },
    {
      "url": "https://github.com/dotnet",
      "text": ".NET Platform - GitHub Organization"
    }
  ]
}
```

### タグのアイコン（任意）

`src/content/tags`に画像ファイルを置き、JSONでファイル名を指定することでアイコンを変更できます。ファイル名はJSONと同じものにしてください。画像フォーマットにはSVG, PNG, JPEG等が使用できます。

例えばJSONが`csharp.json`の場合、アイコンのファイル名は`csharp.png`とし、JSONでは`"image": "./csharp.png"`と指定してください。
