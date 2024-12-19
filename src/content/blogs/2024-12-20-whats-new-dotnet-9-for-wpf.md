---
title: .NET 9 での WPF新機能
description: .NET 9で導入されたWPFの新機能について
category: tech
author: aiueo-1234
tags: [advent-calendar, dotnet, csharp]
---

この記事は[OUCC Advent Calendar 2024](https://adventar.org/calendars/10655)の20日目の記事です。

# 祝 .NET 9
2024/11/13に .NET 9 がリリースされてから久しいですが、皆さんは使っているでしょうか？  
個人的にはC#的には細かい改善が入った感じがしていてとても良いと思っています。（まだプレビューですが`field`キーワードとか楽しいです）  

さて、最近アップデートが小さかったWPFですが、今回はかなり大きな変更が来ています。  
早速見ていきましょう！

# Fluent テーマ対応
なんとついにWindows 11のテーマに対応しました！  
個人的にはもう永遠にWindows 7のままかと思ってたのでびっくりです。  

導入方法はとても簡単で、App.xamlを編集するだけです！
```xml
<Application x:Class="ScreenCover.App"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:local="clr-namespace:ScreenCover"
             StartupUri="MainWindow.xaml"
             ThemeMode="System">　<!-- ←これ -->
    <Application.Resources>
<!-- ここから -->
        <ResourceDictionary>
            <ResourceDictionary.MergedDictionaries>
                <ResourceDictionary Source="pack://application:,,,/PresentationFramework.Fluent;component/Themes/Fluent.xaml" />
            </ResourceDictionary.MergedDictionaries>
        </ResourceDictionary>
    </Application.Resources>
<!-- ここまで -->
</Application>

```

ダークテーマやライトテーマしか使わないといった場合は以下のように`Source`を変えるだけです
```xml
<!-- ライトテーマ -->
<ResourceDictionary Source="pack://application:,,,/PresentationFramework.Fluent;component/Themes/Fluent.Light.xaml" />
<!-- ダークテーマ -->
<ResourceDictionary Source="pack://application:,,,/PresentationFramework.Fluent;component/Themes/Fluent.Dark.xaml" />
```

Material Design Toolkitと似たような感じになってますね。残念ながらまだまだデフォルトテーマというわけにはいかなさそうです。

## ライト・ダークテーマ対応
Fluent テーマ対応に合わせてライト・ダークテーマの対応も入っています。  
この機能を使うにはFluentテーマを使ったうえで、`App.xaml`の`Appication`要素の`ThemeMode`属性を編集すればよいです。指定する値はこんな感じになってます。  
- `ThemeMode`属性
  - Light：ライトモード
  - Dark：ダークモード
  - System：ユーザーが設定しているモード
また、`ResourceDictionary`要素で片方のテーマのリソースを入れてない場合は、`ThemeMode`に関係なくそのリソースのテーマが優先されるようです。

# アクセントカラー対応
Windowsにはライト・ダークテーマとは別にアクセントカラーを設定を設定できるのはご存じのとおりだとおもうのですが、ついに`StaticResource`で用意されました。
|色|カラー|カラーリソースキー|ブラシ|ブラシリソースキー|
|-|-|-|-|-|
|標準|AccentColor|AccentColorKey|AccentColorBrush|AccentColorBrushKey|
|ライト1|AccentColorLight1|AccentColorLight1Key|AccentColorLight1Brush|AccentColorLight1BrushKey|
|ライト2|AccentColorLight2|AccentColorLight2Key|AccentColorLight2Brush|AccentColorLight2BrushKey|
|ライト3|AccentColorLight3|AccentColorLight3Key|AccentColorLight3Brush|AccentColorLight3BrushKey|
|濃色1|AccentColorDark1|AccentColorDark1Key|AccentColorDark1Brush|AccentColorDark1BrushKey|
|濃色2|AccentColorDark2|AccentColorDark2Key|AccentColorDark2Brush|AccentColorDark2BrushKey|
|濃色3|AccentColorDark3|AccentColorDark3Key|AccentColorDark3Brush|AccentColorDark3BrushKey|

初めに紹介したようにFluentテーマを導入した場合は`{StaticResource 
 AccentColorBrush}`みたいな感じで簡単に使えるようになります。
 
まだ、この機能はFluentテーマを導入していなくても使えるらしく、その場合は`{DynamicResource {x:Static SystemColors.AccentColorLight3BrushKey}}`いった感じで`SystemColors.xxx`のようにすれば使えるみたいです。

# ハイフンベースの合字（リガチャ）のサポート
ちょっとインパクトが落ちますが、どうやら`->`みたいなやつを→みたいに合字で表示できなかったのができるになったみたいです。
当然ですが、合字に対応しているフォントでないと見れないのでそんなに関係なさそうです。


# まとめ
ダークモード対応などおおきめなアプデがやってきました。（さりげなくWinFormsでもダークモード導入がすすんでいるらしい）  
最近はWinUI 3が追い上げてきていますが、まだまだこちらも現役ですね。

それではよいWPFライフを！

# 参考資料

https://learn.microsoft.com/ja-jp/dotnet/desktop/wpf/whats-new/net90?view=netdesktop-9.0

https://github.com/dotnet/wpf/blob/add-fluent-usage-documentation/Documentation/docs/using-fluent.md