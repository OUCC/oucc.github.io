# [oucc.org](https://oucc.org/)

OUCC のウェブサイトです。静的サイトジェネレータ Astro を使って構築されています。

このプロジェクトでは Prettier によってコードのフォーマットを統一しています。ファイルの保存時に自動的に Prettier でフォーマットするようエディタを設定してください。

## ディレクトリ構成

Astroで慣習的に使われるディレクトリ構成を採用しています。

cf. [ディレクトリ構成 🚀 Astroドキュメント](https://docs.astro.build/ja/core-concepts/project-structure/)

```
/
├── public/             # https://oucc.org/ の直下に置くファイル
│   └── favicon.webp
├── src/
│   ├── assets/         # 画像やアイコンなどの静的ファイル
│   ├── pages/          # ページ
│   ├── layouts/        # 各ページのレイアウト
│   ├── content/        # ブログの投稿に関するコンテンツ
│   └── components/     # 各ページで使うコンポーネント
│        ├── common/    # 全体で共通して使うもの
│        ├── layout/    # レイアウトで使うもの
│        ├── activity/  # 活動紹介ページで使うもの
│        ├── index/     # トップページで使うもの
│        ├── ...
└── package.json
```

## コマンド

| Command                   | Action                                                       |
| :------------------------ | :----------------------------------------------------------- |
| `npm install`             | 開発に必要なパッケージをインストールする                     |
| `npm run dev`             | 開発サーバーを起動する                                       |
| `npm run build`           | 本番ビルドを `./dist/` に書き出す                            |
| `npm run preview`         | 書き出した本番ビルドをプレビューする                         |
| `npm run typecheck`       | 型チェックを実行する                                         |
| `npm run lint`            | コードのフォーマットが正しいかチェックする                   |
| `npm run format`          | コードのフォーマットを自動で修正する                         |
| `npm run validate-blog`   | 指定したファイルがブログの更新の際に変更して良いか判定します |
| `npm run update-blogmeta` | 指定したファイルに対応するブログのメタ情報を更新します       |

## ブログ

ブログの投稿を行う際は `blog/` から始まるブランチで作業してください。CIによる支援が得られます。
`src/content/blogs` に Markdown ファイルを追加することで新しい記事を投稿できます。

ブログの投稿に関する詳細な情報は [README_BLOG.md](./README_BLOG.md) を参照してください
