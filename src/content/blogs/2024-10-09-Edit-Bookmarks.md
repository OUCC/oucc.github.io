---
title: ブックマーク(bookmarks.html)を編集してみる
description: ブラウザのブックマークをhtmlで出力し、xmlパーサーでパースできるようにして、編集しました。
category: tech
author: TaPet
tags:
  - browser
---

## bookmarks.htmlとは
ブラウザのブックマークをhtmlで出力したものです。
Microsoft Edgeでは、お気に入り.htmlだったり、出力した日時の情報が入っていたりしますが、ここでは、bookmarks.htmlと書くことにします。

## 動機
適当にブックマークをつけていった結果、重複しているものがあったり、中身を把握できなくなったりしていたので、整理したいと思いました。
ブラウザのブックマークマネージャでは、1フォルダごとでしか見れないなど、少々不便な上、テキストデータにしてしまえば、簡単に編集できます。

~~Microsoft Edgeに、重複を削除する機能があるのを記事作成中に知りました。~~

## bookmarks.htmlの構造
各ブラウザでの差異はありますが、共通する部分について書きます。
確認済みのブラウザは、
- Google Chrome
- Microsoft Edge
- Firefox
- Brave

です。


### ファイルの情報
ファイルの先頭にそのファイルの情報が書いてあります。
```html
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
```
Firefoxでは、以下のmetaタグがMETAタグとTITLEの開始タグの間に入るようです。
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'none'; img-src data: *; object-src 'none'">
```

### ブックマークの構造
ブックマークの内容とフォルダ構造が記述されている部分です。
```html
<H1>Bookmarks</H1>
<DL><p>
    <!-- ここに内容が書かれる -->
</DL><p>
```
H1タグがあり、その後にDL要素があります。DLの開始・終了タグの後には、開始タグだけのp要素(`<p>`)があります。

- H1の文字列は、"Bookmarks"以外でも良いようです。
- `</DL>`の後の`<p>`はなくても良いようです。

#### ブックマークの内容
ファイルを表す部分と、各ブックマークを表す部分とがあります。
##### ファイルを表す部分
```html
<DT>
    <H3 ADD_DATE="{UNIX時間}" LAST_MODIFIED="{UNIX時間}">{ファイル名}</H3>
    <DL>
        <p>
            <!-- ファイルの内容 -->
    </DL><p>
```
ブックマークバー(ブラウザの上部分に表示される部分)に表示されるファイルには、`PERSONAL_TOOLBAR_FOLDER="true"`をつける。
##### ブックマークを表す部分
```html 
<DT>
    <A HREF="{URL}" ADD_DATE="{UNIX時間}">{ブックマーク名}</A>
```
ブックマークの画像の情報も記述する場合は、`ICON="data:image/png;base64,{Base64でエンコードした画像のデータ}"`です。

## 編集
上記のようにbookmarks.htmlは、htmlで書かれているので終了タグがない要素があります。
htmlとして、パース・処理しようと思うと、bodyタグの省略があったり、属性が大文字であったりして面倒だったので、bookmarks.htmlにいろいろ書き足して、xmlとしてパースできるようにしました。こうすることで各ブラウザが独自で?(リサーチできてません)使っている属性も保持できます。

具体的には、以下の処理を行いました。空白文字、改行は無視しています。
bookmarks.html -> xml
1. 全ての`<p>`の直後に`</p>`をつける。
2. 全ての`</A>`の直後に`</DT>`をつける。(ブックマークを表すDT要素の終了タグを書く。)
3. 全ての`</DL><p></p>`の直後に`</DT>`をつける。(フォルダを表すDT要素の終了タグを書く。)ただし、ファイル末尾の`</DL><p></p>`については処理しない。(ブックマーク全体を表すDL要素であるため。)
4. 全ての`<META>`、`<meta>`の直後にそれぞれ、`</META>`または、`</meta>`をつける。
5. ドキュメントタイプ宣言以下を適当な要素で囲む。(xmlはルート要素が1つでないといけないため。)
6. xml 宣言を記述する。

bookmarks.html -> xml の変換は上記の逆の操作を行いました。

あとは、xmlパーサーで読み込んで、処理を行いました。

## 参考
- [javascript - bookmarks.html の仕様書 - スタック・オーバーフロー](https://ja.stackoverflow.com/questions/82986/bookmarks-html-%E3%81%AE%E4%BB%95%E6%A7%98%E6%9B%B8)
- [NETSCAPE-Bookmark-file-1](https://wiki.suikawiki.org/n/NETSCAPE-Bookmark-file-1$331#gsc.tab=0)
- [Netscape Bookmark File Format (Internet Explorer) | Microsoft Learn](https://learn.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/platform-apis/aa753582(v=vs.85)?redirectedfrom=MSDN)

