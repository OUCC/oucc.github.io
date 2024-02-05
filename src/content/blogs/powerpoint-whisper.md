---
title: PowerPointの音声ファイルをWhisperで文字起こししてみた
description: PowerPointの音声ファイルをWhisperで文字起こししてみた
tags: [advent-calendar, csharp, whisper, open-xml, power-point, transcribe]
category: tech
author: aiueo-1234
---
これは、[OUCCアドベントカレンダー](https://adventar.org/calendars/9315)の22日目の記事です。Qiitaにもマルチ投稿しています。

# なんで文字起こしするのか
自分は大学生なのですが、時々授業が動画ではなく音声付Power Pointになることがあります。この時に何が困るかっていうと倍速再生ができないのでまともに授業を受けるととても時間がかかるのです。  
というわけで、文字起こしして音声聞かずに済ませることで時間短縮を狙ったのが今回の動機です。  



# どうやってやるのか
今回はC#のライブラリである[Open-XML-SDK](https://github.com/dotnet/Open-XML-SDK)の`DocumentFormat.OpenXml`ライブラリを用いてPower Pointから音声データとタイミングを取得して、文字起こしで有名な[whisper](https://openai.com/research/whisper)を使って文字起こしをしてtxtファイルにまとめてみました。  
本来はPower Pointのノート部分に文字起こしした分を書き込もうかと思ったのですが断念しました。  



# Power Pointから音声データと音声の再生順を取ってくる  
まず初めに、知っておいた方が分かりやすいと思うのでPower Pointがどのような構造になっているかを書きたいと思います。また、自分もすべてを理解したわけではないので間違いがあるかもしれません。    


## Power Pointの構造  
現在のPower Pointは`Open XML`という規格に標準化されていて、これさえ理解することができればPower PointはともかくWordやExcelも操作することができます。(なんならWord、Excelを操作する方がメイン説はありますが…）  
Power Pointの中身はZipファイルで、ここに音声ファイルやXMLで記述されたスライドなどが格納されています。Zipファイルの中のディレクトリはこんな感じになってます。  
```
(Power PointのZipファイル)
　├─docProps
　├─ppt
　│  ├─media
　│  ├─notesMasters
　│  │  └─_rels
　│  ├─notesSlides
　│  │  └─_rels
　│  ├─slideLayouts
　│  │  └─_rels
　│  ├─slideMasters
　│  │  └─_rels
　│  ├─slides
　│  │  └─_rels
　│  ├─theme
　│  └─_rels
　└─_rels
```  
まずZipファイル直下には`[Content_Types].xml`というファイルがありここにすべてのxmlファイルのありかが書かれています。次に`docProps`ディレクトリにはパワポのサムネや詳細情報が書かれた`.xml`ファイルが存在します。そして`ppt`ディレクトリにはスライドに関するファイル全般が格納されています。あと`_rels`ディレクトリには`<RelationShip>`(後述)が記されたファイルが格納されています。  

ここからは肝心の`ppt`ディレクトリ（と一部ファイル）についてもう少し詳しく見ていきましょう。  

- `media`ディレクトリ：プレゼンテーション内の画像、音声、動画が **ファイル名を変更されて** 格納されています。  
- `motesMasters`ディレクトリ：プレゼンテーションのノート部分の書式設定などが書かれた`.xml`ファイルが格納されています。  
- `noteSlides`ディレクトリ：プレゼンテーションのノート本体の`.xml`ファイルが格納されています。  
  - `_rels`ディレクトリ：各ノートそれぞれにつき`<RelationShips>`が書かれたファイルが格納されています。  
- `slideLayouts`ディレクトリ：複数のスライドテンプレートの`.xml'ファイルが格納されています。  
- `_rels`ディレクトリ：各テンプレートそれぞれにつき`<RelationShips>`が書かれたファイルが格納されています。  
- `slideMasters`ディレクトリ：プレゼンテーションのスライド部分の書式設定などが書かれた`.xml`ファイルが格納されています。  
- `slides`ディレクトリ：プレゼンテーションのスライドの`.xml`ファイルが格納されています。  
  - `_rels`ディレクトリ：各スライドそれぞれにつき`<Relationships>`が書かれたファイルが格納されています。ここに各スライドに対応するノートの`<Relationship>を埋め込むことでノートとスライドを関係づけていそうです。  
- `theme`ディレクトリ：プレゼンテーションのテーマの`.xml`ファイルが格納されています。  
- `presentation.xml`ファイル：ここにスライドやノートなどの情報がまとめられています。  


## \<Relationship>について
こいつが今回の主役その1です。これについて説明する前に実物を見た方がすぐにわかると思います。
<!-- ```xml:slides/_rels/slide2.xml.rels -->
```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId3" Type="http://schemas.microsoft.com/office/2007/relationships/media"
        Target="../media/media2.mp3" />
    <Relationship Id="rId2"
        Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/audio"
        Target="../media/media1.mp3" />
    <Relationship Id="rId1" Type="http://schemas.microsoft.com/office/2007/relationships/media"
        Target="../media/media1.mp3" />
    <Relationship Id="rId6"
        Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"
        Target="../media/image1.png" />
    <Relationship Id="rId5"
        Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout"
        Target="../slideLayouts/slideLayout2.xml" />
    <Relationship Id="rId4"
        Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/audio"
        Target="../media/media2.mp3" />
</Relationships>
```  
これはあるスライドの`<Relationships>`のファイルですが、こんな感じでそのスライドが参照しているものをすべて列挙したものになります。この`rId`というのはそれぞれの`<Relationships>`につき一意になっています。（つまり別の`<Relationships>`ではかぶるということです。ちなみにですが、この`<Relationships>`は各`.xml`ファイルにつき基本一つ存在します。）この`<Relationship>`ひとつひとつをたどることで音声ファイルを入手することができます。  


## Power Pointの開き方
ここではそもそもPower PointをどうやってC#で扱うのかついて見ていきます。  
Power Pointを扱うには、初めにも述べましたが[Open XML SDK](https://github.com/dotnet/Open-XML-SDK)の`DocumentFormat.OpenXml`ライブラリを用います。ちなみにライブラリを選んだのは何といっても最新の.Net 8で動作できるからです。  
このライブラリは、NuGetで配布されているので下のコマンドかVisual Studioで「NuGetパッケージの管理」からプロジェクトに追加してください。  
```bash
dotnet add package DocumentFormat.OpenXml --version 3.0.0
```
Open XML SDKではPower Pointを[`PresentationDocument`](https://learn.microsoft.com/ja-jp/dotnet/api/documentformat.openxml.packaging.presentationdocument?view=openxml-2.8.1)クラスで管理しており、Power Pointを読み込むコードは下の通りです。
```cs
using DocumentFormat.OpenXml.Presentation;

using var pre = PresentationDocument.Open("test.pptx", false);
```
第一引数にPower Pointのファイルパスを指定し、第二引数で編集可能にするかどうかを選択します。今回は読み取るだけなので`false`にしてあります。  
以下この`pre`に対して操作をしていくことでPower Pointを操作していきます。


## Power Pointのスライド
ここではPower Pointのスライドについて見ていきます。Power Pointの構造ですこし述べましたが、スライドは`slides`のファイルと`_rels`の`<Relationships>`のファイルからなり、Open XML SDKでは各スライドごとにこの2つを`SlidePart`というクラスにまとめて管理されています。　　

https://learn.microsoft.com/ja-jp/dotnet/api/documentformat.openxml.packaging.slidepart?view=openxml-2.8.1

また、スライドのXMLを操作するには`SlidePart.Slide`で得られる`Slide`クラスを使います。

https://learn.microsoft.com/ja-jp/dotnet/api/documentformat.openxml.presentation.slide?view=openxml-2.8.1

またスライドのXMLはおおまかには下のような感じになっており`Slide`クラスは`<sld>`ノードに対応します。  
```xml
<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <!--スライドのテキストや図形など-->
  <p:cSld>
    <p:spTree>
      <p:pic>
        図形についてのxml(Power Point の図形を参照)
      </p:pic>
    </p:spTree>
  </p:cSld>
  <!--スライドのアニメーション-->
  <p:timing>
    <p:tnLst>
      <p:par>
        <p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot">
          <p:childTnLst>
            アニメーションのxml（Child Time Node Listを参照）
          </p:childTnLst>
        </p:cTn>
      </p:par>
    </p:tnLst>
  </p:timing>
</p:sld>
```


## Power Pointのアニメーション  
音声ファイルへのとっかかりは`<Relationships>`のところで述べましたが、今度は音声ファイルの再生順を調べなくてはなりません。  
アニメーションのXML構造は`<p:timing>`ノードに格納されています。ぱっと見ではわからないノード名が多かったり親子関係が循環していたりして理解がかなり難しくなっています。実際自分もまだよくわかってないところがありますが、わかっている分は書きたいと思います。  

### \<p:timing>ノード  
これは上で述べたようにアニメーションの構造を格納する一番上の階層のノードです。これは3つの子要素を持ちますが、ここではそのうちの一つである`<tnLst>`についてしか述べません。

https://learn.microsoft.com/ja-jp/dotnet/api/documentformat.openxml.presentation.timing?view=openxml-2.8.1

### \<p:tnLst>(Time Node List)ノード  
子要素に`<par>`を持つこと以外は大切じゃないので流します。

https://learn.microsoft.com/ja-jp/dotnet/api/documentformat.openxml.presentation.timenodelist?view=openxml-2.8.1

### \<p:par>(Parallel Time Node)ノード  
これも同じく子要素に`<cTn>`を持つこと以外は大切じゃないので流します。

https://learn.microsoft.com/ja-jp/dotnet/api/documentformat.openxml.presentation.paralleltimenode?view=openxml-2.8.1

### \<p:cTn>(Common Time Node)ノード  
アニメーション一つ一つを表したり、一連のアニメーション全体を表したりとまさに`common`なノードです。`nodeType`属性によってどんな役割を持つかが定義され、`presetClass`属性が`mediacall`のものが音声・動画のアニメーションを表します。またこれの`id`属性の順番にアニメーションが再生されていそうです。子要素には`<childTnLst>`,`<stCondLst>`などを持ちます。  

https://learn.microsoft.com/ja-jp/dotnet/api/documentformat.openxml.presentation.commontimenode?view=openxml-2.8.1

### \<p:seq>(Sequence Time Node)ノード  
ひとまとまりのアニメーションを表します。子要素には`<cTn>`などを持ちます。

https://learn.microsoft.com/ja-jp/dotnet/api/documentformat.openxml.presentation.sequencetimenode?view=openxml-2.8.1

### \<p:childTnLst>(Child Time Node List)ノード  
これは`<par>`,`<cTn>`ノードとともにノードの「まとまり」を表します。例えば、フェードイン、音声再生、フェードアウトのアニメーションがあったとするとこんな感じになります。  
```xml
<childTnLst>
  <seq>
    <cTn nodeType="mainSeq">
      <childTnLst>
        <!--アニメーション1-->
        <par><cTn><childTnLst>
          <par><cTn><childTnLst>
            <par><cTn presetClass="entr" nodeType="clickEffect"><childTnLst>
                フェードイン
            </childTnLst></cTn></par>
          </childTnLst></cTn></par>
        </childTnLst></cTn></par>
        <!--アニメーション2-->
        <par><cTn><childTnLst>
          <par><cTn><childTnLst>
            <par><cTn presetClass="mediacall" nodeType="clickEffect"><childTnLst>
                音声再生(cmdノードが埋め込まれる)
            </childTnLst></cTn></par>
          </childTnLst></cTn></par>
        </childTnLst></cTn></par>
        <!--アニメーション3-->
        <par><cTn><childTnLst>
          <par><cTn><childTnLst>
            <par><cTn presetClass="entr" nodeType="clickEffect"><childTnLst>
                フェードアウト
            </childTnLst></cTn></par>
          </childTnLst></cTn></par>
        </childTnLst></cTn></par>
      </childTnLst>
    </cTn>
  </seq>
</childTnList>
```  
これを見てわかるように子要素に`<par>`,`<seq>`,`<cmd>`ノードなどを持ちます。  

https://learn.microsoft.com/ja-jp/dotnet/api/documentformat.openxml.presentation.childtimenodelist?view=openxml-2.8.1

### \<p:cBhvr>(Common Behavior)ノード  
`<cTn>`と組み合わせてアニメーションを定義するノードです。子要素に`<cTn>`,`<tgtEl>`などを持ちます。  

https://learn.microsoft.com/ja-jp/dotnet/api/documentformat.openxml.presentation.commonbehavior?view=openxml-2.8.1

### \<p:tgtEl>(Target Element)ノード  
このノードでは、子要素でアニメーションが適用される対象を指定します。子要素に`<spTgt>`などを持ちます。  

https://learn.microsoft.com/ja-jp/dotnet/api/documentformat.openxml.presentation.targetelement?view=openxml-2.8.1

### \<p:spTgt>(Shape Target)ノード  
このノードでは、アニメーションが適用される図形を`spid`属性で指定します。また、`DocumentFormat.OpenXml`ではなぜか図形のidは`uint`なのに、これは`string`でとってくるので`uint`に変換する必要があります。  

https://learn.microsoft.com/ja-jp/dotnet/api/documentformat.openxml.presentation.shapetarget?view=openxml-2.8.1

### \<p:cmd>(Command Node)ノード  
これは「音声や動画を再生する」(playForm)などのコマンドを打つためのノードで、`<cBhvr>`,`<cTn>`,`<tgtEl>`,`<spTgt>`などを組み合わせて表現されます。  

https://learn.microsoft.com/ja-jp/dotnet/api/documentformat.openxml.presentation.command?view=openxml-2.8.1

ちなみに音声が再生される`<cmd>`ノードとその子要素のxmlは大まかには以下のような感じになります。
```xml
<p:cmd type="call" cmd="playFrom(0.0)">
  <p:cBhvr>
    <p:cTn dur="99240"/>
    <p:tgtEl>
      <p:spTgt spid="5" />
    </p:tgtEl>
  </p:cBhvr>
</p:cmd>
```
[`<spTgt>`ノード](#psptgtshape-targetノード)で述べましたが、この`spid`で指定されている図形にアニメーションが適応されます。つまり、Power Pointでは音声が図形として埋め込まれていることを示唆していて（そして実際にそうですが）、この **`spid`の先の図形をたどることで音声を取得できる** ことが分かります。


## Power Point の図形  
ここまでの話から、以下の順番でアニメーション順に音声のある図形（画像）のidを取得できることが分かります。  
1. `<cTn>`のうち`presetClass="mediacall"`なものを取ってきて、`id`の順番にする  
2. 上で取れた`<cTn>`から`<cmd>`->`<cBhvr>`->`<tgtEl>`->`<spTgt>`の順で取ってくる  
3. 上で取れた`<spTgt>`の`spid`属性の値を取得する  
  
ということで、今度は図形を取得しなければいけないので図形を表すxmlが格納されている<cSld>について見ていきましょう。  
アニメーションのところとと同じく分かってないところがありますが、わかっている分については書いていきます。  

### \<p:cSld>(Common Slide Data)ノード  
これがスライドの図形やテキストボックスなどを表すxmlの一番上の要素です。またアニメーションの親玉だった`<timing>`ノードとは同階層にあります。子要素には`<spTree>`ノードなどを持ちます。  

https://learn.microsoft.com/ja-jp/dotnet/api/documentformat.openxml.presentation.commonslidedata?view=openxml-2.8.1

### \<p:spTree>(Shape Tree)ノード  
このノードの下に実際の図形やテキストボックスのxmlが格納されています。子要素には`<pic>`ノードなどを持ちます。

https://learn.microsoft.com/ja-jp/dotnet/api/documentformat.openxml.presentation.shapetree?view=openxml-2.8.1

### \<p:pic>(Picture)ノード
これは画像一つ一つを表します。音声は画像と結びついているので、このノードを取ってこれれば音声を取ってこれます。子要素には`<nvPicPr>`ノードなどを持ちます。  

https://learn.microsoft.com/ja-jp/dotnet/api/documentformat.openxml.presentation.picture?view=openxml-2.8.1

### \<p:nvPicPr>(Non Visual Picture Properties)ノード
ここには画像以外の情報つまり音声や動画の情報が格納されています。子要素には`<cNvPr>`,`<nvPr>`ノードなどを持ちます。  

https://learn.microsoft.com/ja-jp/dotnet/api/documentformat.openxml.presentation.nonvisualpictureproperties?view=openxml-2.8.1

### \<p:cNvPr>(Non Visual Drawing Properties)ノード
これの`id`属性の値が`<spTgt>`で指定されるidになります。また`name`属性に音声ファイルの名前が入ります。

https://learn.microsoft.com/ja-jp/dotnet/api/documentformat.openxml.presentation.nonvisualdrawingproperties?view=openxml-2.8.1

### \<p:nvPr>(Application Non Visual Drawing Properties)ノード
これはどういったファイルが埋め込まれるかを表すノードをまとめるノードです。子要素に`<audioFile>`ノードなどを持ちます。  

https://learn.microsoft.com/ja-jp/dotnet/api/documentformat.openxml.presentation.applicationnonvisualdrawingproperties?view=openxml-2.8.1

### \<p:audioFile>(Audio From File)ノード
これは`link`属性にwav以外の音声ファイルへの`<Relationship>`の`rid`を持ちます。これを取得することで音声データにアクセスできるようになります。  

https://learn.microsoft.com/ja-jp/dotnet/api/documentformat.openxml.drawing.audiofromfile?view=openxml-2.8.1

画像（音声付）のところで音声にかかわるxmlををまとめると次のようになります。  
```xml
<p:pic>
  <p:nvPicPr>
    <p:cNvPr id="4" name="week01-1"></p:cNvPr>
    <p:nvPr>
      <a:audioFile r:link="rId2" />
    </p:nvPr>
  </p:nvPicPr>
</p:pic>
```  
つまり、音声を取得するには各スライドごとに`<pic>`ノードを取得して  
- `<cNvPr>`ノードの`id`属性  
- `<audioFile>`ノードの`link`属性  

を取得する必要があることがわかりました。


## 音声を取ってくるまでのコード  
ここからはこれまでの内容を踏まえたうえで、実際のコードを見ていくことにします。  

### `<Relationship>`から音声データ（`DataPart`)を取る  
[Power Pointのアニメーション](#power-pointのアニメーション)と[Power Point の図形](#Power-Point-の図形)から、音声の存在する図形のid(`spid`)を介して音声の`rId`とアニメーション順をつなげられることが分かりました。では今度は`rId`から音声データ（`DataPart`)を取る方法を見ていきます。  

[`DataPart`クラス](https://learn.microsoft.com/ja-jp/dotnet/api/documentformat.openxml.packaging.datapart?view=openxml-2.8.1)というのは音声などの`media`フォルダに埋め込まれたファイルへの参照を取ってきたものです。例えば音声データの`<Relationship>`の`rId`が'rId1`の場合は以下のようになります。  
```cs
using var pre = PresentationDocument.Open(file.FullName, false);
var dataPart = pre.PresentationPart?.SlideParts[0].DataPartReferenceRelationships
                      .Where(x => x.Id == "rId1").First().DataPart;
```
ここで注意が必要なのは`<Relationship>`を取る際に[`GetReferenceRelationship(String) メソッド`](https://learn.microsoft.com/ja-jp/dotnet/api/documentformat.openxml.packaging.openxmlpartcontainer.getreferencerelationship?view=openxml-2.8.1)を使わないことです。いかにも取ってこれそうなやつですがこれだと目当ての`DataPart`を取ることができません。


### スライドから音声ファイルを含む画像`spid`とその音声ファイルの`DataPart`を取得する
[前の節](#relationshipから音声データdatapartを取る)で述べたように図形のId(`spid`)を介すことで音声の`rId`とアニメーション順を紐づけることができます。  

ここでは、あるスライドの図形の`spid`と音声ファイルの`rId`を取得したうえで、`spid`と`DataPart`の`IEnumerable<uint, DataPart>`を返すメソッドのコードを示します。  
```cs
internal static IEnumerable<(uint shapeId, DataPart audioData)> GetShapeIdAndAudioReference(SlidePart slidePart)
{
    foreach (var nvPicPr in slidePart.Slide.CommonSlideData?.ShapeTree?.Descendants<Picture>().Select(pi => pi.NonVisualPictureProperties) ?? [])
    {
        uint? shapeId = (nvPicPr?.NonVisualDrawingProperties?.Id?.HasValue ?? false) ? nvPicPr.NonVisualDrawingProperties.Id.Value : null;
        if (shapeId is null)
            continue;
        foreach (var audioFile in nvPicPr?.ApplicationNonVisualDrawingProperties?.Descendants<DocumentFormat.OpenXml.Drawing.AudioFromFile>() ?? [])
        {
            var rId = (audioFile.Link?.HasValue ?? false) ? audioFile.Link.Value : null;
            if (rId is not null)
            {
                yield return (shapeId.Value, slidePart.DataPartReferenceRelationships.Where(x => x.Id == rId).First().DataPart);
            }
            else
            {
                continue;
            }
        }
    }
}
```
このコードは`<pic>`ノードから`<nvPicPr>`ノードを取得して、その子要素である
- `<cNvPr>`ノードの`id`属性(`spid`)  
- `<audioFile>`ノードの`link`属性 (`rId`) -> DataPartReferenceRelationships -> `DataPart`

という流れを抑えていればそれほど難しくないと思います。  


### 音声の図形の`spid`とアニメーション順を取得する  
[Power Pointのアニメーション](#power-pointのアニメーション)から、アニメーションの順で音声の`spid`を取ってくるには  
1. `presetClass`属性が`mediacall`の`cTn`ノードを取ってくる＆`id`属性の順番で並び替える
1. それぞれについて`spTgt`ノードの`spid`属性を取得

をすることで得られます。  
以下のコードは一例です。各`SlidePart`に対してこれらの動作を実行しています。
```cs
foreach (var slidePart in pre.PresentationPart?.SlideParts ?? [])
{
    // 条件を満たすcTnノードを取ってくる
    var ctnList = slidePart.Slide.Timing?.Descendants<CommonTimeNode>()
        .Where(ctn => (ctn.PresetClass?.HasValue ?? false) && ctn.PresetClass.Value == TimeNodePresetClassValues.MediaCall)
        .OrderBy(ctn => ctn.Id!.Value);

    if (ctnList != null && ctnList.Any())
    {
        foreach (var ctn in ctnList)
        {
            // spTgtノードを取ってくる
            var shapeTarget = ctn.ChildTimeNodeList?.Descendants<ShapeTarget>().FirstOrDefault();
            var shapeId = (shapeTarget?.ShapeId?.HasValue ?? false) ? shapeTarget.ShapeId.Value : null;
            if (uint.TryParse(shapeId, out var id))
            {
                // ここのidがspidになっているので、ここで音声の文字起こししたものと組み合わせる
            }
        }
    }
}
```
ここで便利メソッドである[`Decendants<T>()`](https://learn.microsoft.com/ja-jp/dotnet/api/documentformat.openxml.openxmlelement.descendants?view=openxml-2.8.1#documentformat-openxml-openxmlelement-descendants-1)を紹介しておくと、このメソッドは`<T>`に検索したいxmlに対応するクラスを指定することで子要素に存在する`<T>`を`IEnumerable`で返してくれます。  
このコードと上で例として出した`GetShapeIdAndAudioReference()`を組み合わせることで音声データをアニメーション順で処理することができます。

# whisperで文字起こし  
今回は文字起こしに[whisper](https://openai.com/research/whisper)を使っていきます。whisperの呼び出しには[Betalgo.OpenAI](https://github.com/betalgo/openai)ライブラリを使います。  
  
まずはOpenAIのAPIキーを取得しましょう。初めての方は以下のサイトを参考にしてみてください。

https://auto-worker.com/blog/?p=6988

取得できたらコードには直書きしなくて済むように環境変数に入れたり、UserSecretを使ったりしてAPIキーを保存します。（今回は環境変数に入れたとして話を進めます）  

[githubにある例](https://github.com/betalgo/openai?tab=readme-ov-file#sample-usages)を参考にして`OpenAIService`を初期化します。   
```cs
var openApi = new OpenAIService(new OpenAiOptions()
{
    ApiKey = Environment.GetEnvironmentVariable("OpenAiApiKey")!
});
```
ここまで来たら、実際にwhisperを使って音声を文字起こしする準備ができました。[チュートリアルコード](https://github.com/betalgo/openai/wiki/Whisper)があるのでこれを参考にすると、このようなコードになります。
```cs
internal static async Task<string> Transcript(DataPart audio, OpenAIService openApi, CancellationToken ct)
{
    ct.ThrowIfCancellationRequested();
    // DaraPartから音声ファイルのStreamを取ってくる
    using var audioStream = audio.GetStream();
    // ここで実際にwhisperを叩く
    var audioResult = await openApi.Audio.CreateTranscription(new OpenAI.ObjectModels.RequestModels.AudioCreateTranscriptionRequest
    {
        FileName = Path.GetFileName(audio.Uri.ToString()),
        Model = Models.WhisperV1,
        FileStream = audioStream
    }, ct);
    if (audioResult.Successful)
    {
        return audioResult.Text;
    }
    else
    {
        return "";
    }
}
```
これで音声データ(`DataPart`)から実際に文字起こしをすることができるようになりました。  
あとwhisperに限らずですがOpenAIのAPIを叩くのには制限（50回/分）があるので短めのファイルを大量に連続でかけると引っかかる恐れがあるので注意しましょう。

# まとめ
ここまでの流れをおおざっぱにまとめると、
1. アニメーション順に`spid`を取る ([参照](#音声の図形のspidとアニメーション順を取得する))
1. その`spid`先の図形から音声への`rId`(`<RelationShips>`)を取る ([参照](#スライドから音声ファイルを含む画像spidとその音声ファイルのDataPartを取得する))
1. 音声の`rId`から音声の`DataPart`を取る ([参照](#relationshipから音声データdatapartを取る))
1. 音声の`DataPart`から`Stream`を取ってwhisperに投げて文字起こし ([参照](#whisperで文字起こし))

といった流れになっています。
ここまでの話を組み合わせることでPower Pointの文字起こしができるようになっています。皆さんも試してみてください。  
参考までに自分が書いたコードも載せておきます。

<details><summary>Program.cs</summary>

```cs:Program.cs
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Presentation;
using OpenAI;
using OpenAI.Managers;
using System.CommandLine;
using System.Diagnostics;
using System.Text;
using static PowerPointTranscript.Helper;

var rootCommand = new RootCommand()
{
    Description = "powerpointの文字を起こしたファイルを出力します。"
};
var filenameArgument = new Argument<FileInfo>("filename");
rootCommand.AddArgument(filenameArgument);
var outDirOption = new Option<DirectoryInfo>(["--outDir", "-o"]);
rootCommand.AddOption(outDirOption);
rootCommand.SetHandler(async (file, outDir) =>
{
    outDir ??= new DirectoryInfo(Environment.CurrentDirectory);
    if (!outDir.Exists)
    {
        outDir.Create();
    }

    if (!file.Exists)
        return;

    // スライド番号と文字起こししたデータ
    Dictionary<int, string> data = [];
    // スライド番号と図形idとそこから文字起こししたやつのリスト
    List<(uint slideId, uint shapeId, string transscript)> transcriptList = [];

    var openApi = new OpenAIService(new OpenAiOptions()
    {
        ApiKey = Environment.GetEnvironmentVariable("OpenAiApiKey")!
    });

    using var cts = new CancellationTokenSource();

    using var pre = PresentationDocument.Open(file.FullName, false);

    // さきに音声を処理しておく + レート制限対策
    var audioListBy45 = pre.PresentationPart?.SlideParts.SelectMany(slidePart =>
    {
        var slideId = uint.Parse(GetSlideName(slidePart.Uri).Replace("slide", ""));
        return GetShapeIdAndAudioReference(slidePart).Select(x => (slideId, x.shapeId, x.audioData));
    }).Chunk(45).ToArray() ?? [];
    for (int i = 0; i < audioListBy45.Length; i++)
    {
        (uint slideId, uint shapeId, DataPart audioData)[]? chunk = audioListBy45[i] ?? [];
        var tasks = chunk.Select(async x => (x.slideId, x.shapeId, await Transcript(x.audioData, openApi, cts.Token)));
        // ほんとはTask.WhenAll()をやりたかったがうまくできなかったのでforeach
        foreach (var task in tasks)
        {
            transcriptList.Add(await task);
        }
        await Task.Delay(TimeSpan.FromMinutes(1), cts.Token);
    }

    foreach (var slidePart in pre.PresentationPart?.SlideParts ?? [])
    {
        var ctnList = slidePart.Slide.Timing?.Descendants<CommonTimeNode>()
            .Where(ctn => (ctn.PresetClass?.HasValue ?? false) && ctn.PresetClass.Value == TimeNodePresetClassValues.MediaCall)
            .OrderBy(ctn => ctn.Id!.Value);
        var slideId = int.Parse(GetSlideName(slidePart.Uri).Replace("slide", ""));

        if (ctnList != null && ctnList.Any())
        {
            var builder = new StringBuilder();
            builder.AppendLine(slidePart.Uri.ToString());
            foreach (var ctn in ctnList)
            {
                var shapeTarget = ctn.ChildTimeNodeList?.Descendants<ShapeTarget>().FirstOrDefault();
                var shapeId = (shapeTarget?.ShapeId?.HasValue ?? false) ? shapeTarget.ShapeId.Value : null;
                if (uint.TryParse(shapeId, out var id))
                {
                    Debug.WriteLine($"{id}, {slidePart.Uri}");
                    var trans = transcriptList.Where(x => x.slideId == slideId && x.shapeId == id);
                    if (trans.Any())
                    {
                        builder.AppendLine(trans.First().transscript);
                    }
                    else
                    {
                        string message = $"{slidePart.Slide.CommonSlideData!.ShapeTree!.Descendants<Picture>().Select(pi => pi.NonVisualPictureProperties!.NonVisualDrawingProperties).Where(p => p!.Id!.Value == id).First()!.Name!.Value} is not an audio file.";
                        Console.WriteLine($"{message} (in slide{slideId})");
                        builder.AppendLine($"[Warning: {message}]");
                    }
                }
            }
            data.Add(slideId, builder.ToString());
        }
    }

    // txtに書き込み
    if (data.Count > 0)
    {
        using var stream = File.Create(Path.Combine(outDir.FullName, $"{Path.GetFileNameWithoutExtension(file.Name)}.txt"));
        using var writer = new StreamWriter(stream);
        foreach (var val in data.OrderBy(x => x.Key).Select(x => x.Value))
        {
            writer.WriteLine($"{val}\n");
        }
        writer.Flush();
    }

}, filenameArgument, outDirOption);

return await rootCommand.InvokeAsync(args);
```

</details>

<details><summary>Healper.cs</summary>

```cs:Helper.cs
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Presentation;
using OpenAI.Managers;
using OpenAI.ObjectModels;

namespace PowerPointTranscript;

internal static class Helper
{
    internal static IEnumerable<(uint shapeId, DataPart audioData)> GetShapeIdAndAudioReference(SlidePart slidePart)
    {
        foreach (var nvPicPr in slidePart.Slide.CommonSlideData?.ShapeTree?.Descendants<Picture>().Select(pi => pi.NonVisualPictureProperties) ?? [])
        {
            uint? shapeId = (nvPicPr?.NonVisualDrawingProperties?.Id?.HasValue ?? false) ? nvPicPr.NonVisualDrawingProperties.Id.Value : null;
            if (shapeId is null)
                continue;
            foreach (var audioFile in nvPicPr?.ApplicationNonVisualDrawingProperties?.Descendants<DocumentFormat.OpenXml.Drawing.AudioFromFile>() ?? [])
            {
                var rId = (audioFile.Link?.HasValue ?? false) ? audioFile.Link.Value : null;
                if (rId is not null)
                {
                    yield return (shapeId.Value, slidePart.DataPartReferenceRelationships.Where(x => x.Id == rId).First().DataPart);
                }
                else
                {
                    continue;
                }
            }
        }
    }

    internal static async Task<string> Transcript(DataPart audio, OpenAIService openApi, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        using var audioStream = audio.GetStream();
        var audioResult = await openApi.Audio.CreateTranscription(new OpenAI.ObjectModels.RequestModels.AudioCreateTranscriptionRequest
        {
            FileName = Path.GetFileName(audio.Uri.ToString()),
            Model = Models.WhisperV1,
            FileStream = audioStream
        }, ct);
        if (audioResult.Successful)
        {
            return audioResult.Text;
        }
        else
        {
            Console.WriteLine($"Data:{Path.GetFileName(audio.Uri.ToString())}");
            if (audioResult.Error == null)
            {
                throw new Exception("Unknown Error");
            }
            Console.WriteLine($"{audioResult.Error.Code}: {audioResult.Error.Message}");
            return "unknown";
        }
    }

    internal static string GetSlideName(Uri uri)
    {
        return Path.GetFileNameWithoutExtension(uri.ToString());
    }
}
```

</details>

今後の課題としては、音声処理を`Task.WhenAll()`でやろうとすると`Stream`の取得がうまくいかない事象の改善に取り組みたいです。（何かわかる方がいたらコメントで教えていただけると嬉しいです）  

長文になり読みにくかったかと思いますが、ここまで読んでくださった皆さんありがとうございました。  


# 環境など
- .NET 8 (Version 8.0.100)
- Visual Studio 2022 Community (Version 17.8.3)
- Power Point (Version 2311)
- Betalgo.OpenAI (Version 7.4.3)
- DocumentFormat.OpenXml (Version 3.0.0)
- DocumentFormat.OpenXml.Linq (Version 3.0.0)
- System.CommandLine (Version 2.0.0-beta4.22272.1)
