---
title: "Cloudflare Pagesでinternal errorが出たときの対処法"
description: "Cloudflare Pagesのデプロイで Failed: an internal error occurred. が出たときに行った対処法です。"
category: tech
author: miyaji
tags:
  - javascript
  - cloudflare
---

Cloudflare Pagesでデプロイを行うと以下のようなエラーが出ました。

```
Failed: an internal error occurred.
```

## 原因と解決法

_routes.jsonが正しいスキーマで書いていなかったためでした。

以下のように`exclude`を忘れていました。

```json
{
  "version": 1,
  "includes": ["/*"]
}
```

正しくは以下のように`exclude`を追加する必要があります。

```json
{
  "version": 1,
  "includes": ["/*"],
  "exclude": []
}
```

internal errorが出るということはCloudflareはJSONのスキーマを検証していないようです。

## まとめ

JSONのは正しいスキーマで書こう
