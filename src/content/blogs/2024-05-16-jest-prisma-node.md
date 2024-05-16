---
title: jest-prismaをNodeで使う
description: jest-prismaをNodeで使うときにハマったポイントを備忘録的に残しておきます。
category: tech
author: miyaji
tags: [node, jest, prisma, javascript]
---

jest-prisma はテストケースごとにDBをリセットするライブラリです。

https://github.com/Quramy/jest-prisma

READMEには`@quramy/jest-prisma`を入れるように書いていますが、これはjsdomのenvironmentで実装されています。替わりに`@quramy/jest-prisma-node`を使用することでNodeのenvironmentでテストできます。

```bash
$ npm install -D @quramy/jest-prisma-node
```

また、`jest.config.js`などの設定では`@quramy/jest-prisma`を`@quramy/jest-prisma-node`に置き換えることで正常に動作します。
