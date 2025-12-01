---
title: 自宅サーバーをAnsible Pullを使ってGitHubから構成管理する
description: "自宅サーバー(Raspberry Pi 5)をAnsible Pullでコード管理する「Pull型」デプロイ環境の構築録。BunやDockerを活用した自動ロールバック・事前テスト機構の実装についても解説します。"
category: tech
author: miyaji
tags: [advent-calendar, ansible]
---

この記事は [OUCC Advent Calendar 2025](https://adventar.org/calendars/12077) の1日目の記事です。
本日は自宅サーバー（Raspberry Pi 5）を、Ansible Pull を活用して GitHub 起点で構成管理した話をします。

## TL;DR

* **構成管理**: 自宅サーバーの構成管理に Ansible Pull を採用
* **デプロイ**: GitHub App + GitHub Actions で「CI が通ったコミットだけ」を反映
* **技術選定**: ラッパー実装に Bun Shell を活用し、シェル操作とロジック記述を両立
* **安全性**: Docker 上に「擬似ラズパイ環境」を立ち上げ、ファイアウォールと SSH 疎通を事前検証
* **拡張**: ラッパーを TypeScript で実装し、自前のロールバック機能を追加

## はじめに

先日 Raspberry Pi 5 を購入し、自宅サーバーとしてセットアップしました。OS は Raspberry Pi OS Lite を採用し、IP アドレスはローカルネットワーク内で固定しています。

サーバー構築において最も避けたかったのは、設定内容が「私の記憶」の中にしか存在しない状態になることです。SDカードが破損しても、OS を入れ直して数コマンド叩けば即座に復旧できる状態が理想です。また、SSH やファイアウォールといった「設定をミスすると物理的にコンソールを繋ぐまで復旧不能になる部分」こそ、コードベースで安全に管理したいと考えました。

そこで今回は Ansible を採用しましたが、通常の管理サーバーからプッシュする構成ではなく、各ノードがリポジトリを見に行く **「Pull 型」** の構成をとりました。

### 今回の構成のこだわり

今回のシステムには、いくつかのこだわりポイント（要件）があります。

まず、**自宅回線の事情に合わせた Pull 型であること**です。グローバル IP を固定していないため、外部からの Push は困難です。Cloudflare Tunnel を使う手もありましたが、認証周りの設計コストとシンプルさを天秤にかけ、Raspberry Pi 側から GitHub を見に行く方式にしました。これなら再起動後も勝手に最新の状態に収束してくれます。

次に、**Docker によるネットワークテストの導入**です。ファイアウォールの設定ミスによる締め出し事故を防ぐため、本番適用の前に Docker 上で「systemd と SSH が動く仮想環境」を立ち上げ、そこに同じ Playbook を適用して疎通確認を行う仕組みを作りました。

また、**独自のロールバックとステータス通知**も実装しました。Ansible 自体には自動ロールバック機能がないため、TypeScript でラッパーを作成し、「最後に成功したコミット」への自動復旧を行えるようにしています。さらに、GitHub Check API と連携させることで、Pull Request の画面から「ラズパイへの反映が成功したか」を一目で確認できるようにしました。

## 初期設定（Bootstrap）

Ansible を動かすための下準備を行います。
初期ユーザー `pi` はデフォルトでパスワードなし sudo が可能ですが、セキュリティ上好ましくないため設定を変更します。

### sudo と不要機能の無効化

まず `NOPASSWD` を無効化し、パスワードを要求するように変更します。まだ Ansible 導入前なので、ここは手動（またはシェルスクリプト）で行う最低限の作業です。

```bash
sudo cp /etc/sudoers.d/010_pi-nopasswd /root/010_pi-nopasswd.bak
sudo visudo -f /etc/sudoers.d/010_pi-nopasswd
# pi ALL=(ALL) NOPASSWD: ALL → pi ALL=(ALL) ALL に変更
````

また、今回は有線接続で運用するため、オンボードの Wi-Fi と Bluetooth は無効化しておきます。トラブルシューティング時に「余計な変数」を減らすためです。

```bash
# /boot/firmware/config.txt に以下を追記
# dtoverlay=disable-wifi
# dtoverlay=disable-bt

sudo reboot
```

## Ansible Pull のセットアップ

ここからが本題です。まずはツール一式をインストールします。

```bash
sudo apt update
sudo apt install -y ansible git python3 unzip
# Bun のインストールなどもここで行います
```

### systemd による定期実行

cron ではなく systemd の timer を使用して `ansible-pull` を定期実行します。systemd を選んだ理由は、`OnBootSec`（起動時実行）や `OnUnitActiveSec`（前回完了からの経過時間）といった制御が容易で、かつログ管理も journald に統一できるためです。

構成としては、実行用の `.service` と、スケジュール用の `.timer` をペアで作成します。

```ini:my-server-ansible-pull.service
[Unit]
Description=CI 成功コミットのみ反映する ansible-pull デプロイ

[Service]
Type=oneshot
# 実際にはここで自作のラッパースクリプトを呼び出します
ExecStart=/root/.bun/bin/bun /usr/local/bin/deploy-wrapper.ts
User=root
Group=root
```

```ini:my-server-ansible-pull.timer
[Unit]
Description=定期デプロイチェック (my-server)

[Timer]
OnBootSec=2min
OnUnitActiveSec=5min
Unit=my-server-ansible-pull.service

[Install]
WantedBy=timers.target
```

この Service では直接 `ansible-pull` を叩かず、後述する TypeScript 製のラッパーを経由させることで、デプロイ対象のコミット選定やロールバックのロジックを制御しています。

## 自作ラッパースクリプトの役割

「どのコミットをデプロイすべきか」「失敗時にどう戻すか」というロジックは Ansible の外側で持つべきだと判断し、Bun + TypeScript でラッパースクリプトを作成しました。

### なぜ Bash ではなく TypeScript (Bun) なのか

当初はシェルスクリプトで書くことも考えましたが、GitHub API を叩いて JSON をパースしたり、複雑な分岐処理を書くのは保守性の面で辛さがあります。そこで、普段から書き慣れている TypeScript を選択しました。

また、ランタイムに Node.js ではなく Bun を採用したのは、Bun Shell が使えるからです。Bun Shell を使うと、外部コマンドの呼び出しが非常にシンプルに書けます。

```typescript
import { $ } from "bun";

// シェルスクリプトのように直感的に書ける
await $`ansible-pull -U ${REPO_URL} -C ${commitSha} -d ${DEST_DIR} -i localhost`;
```

Node.js の `child_process` だと記述が冗長になりがちな外部コマンド呼び出しも、Bun Shell ならシェルスクリプトに近い感覚で書くことができます。「ロジックは TypeScript で型安全に、コマンド実行は Shell 感覚で」という良いとこ取りができました。

### ラッパーの処理フロー

このスクリプトは主に以下のフローで動作します。

1.  **GitHub API 連携**: GitHub App のトークンを取得し、CI (GitHub Actions) がすべて成功しているコミットを特定します。
2.  **実行**: 対象コミットをチェックアウトし、`ansible-pull` を実行します。この際、GitHub Check API を叩いてステータスを `in_progress` にします。
3.  **結果判定**:
      * 成功時: そのコミットハッシュを「成功履歴」としてファイルに保存し、Check を `success` に更新します。
      * 失敗時: 保存しておいた「最後に成功したコミット」のハッシュを読み出し、即座にそのバージョンで再実行（ロールバック）をかけます。

これにより、万が一設定を誤っても、自動的に前回の正常な状態に戻る仕組みを実現しました。

## Docker によるネットワークテスト

ファイアウォール設定をいきなり実機に適用するのはリスクが高いため、Docker Compose で検証環境を構築しました。

構成はシンプルで、Server コンテナ（systemd が動く擬似ラズパイ）と Client コンテナ（攻撃・確認役）を用意し、専用のブリッジネットワークで接続します。

### systemd を PID 1 にする苦しみ

実は、この検証環境を作る上で一番ハマったのが 「Docker コンテナ内で systemd を正しく動かす」 ことでした。

Ansible の Playbook は `service` モジュールを使って systemd 経由でサービスを管理する前提で書いています。しかし、通常の Docker コンテナは PID 1 でアプリケーションを直接動かすため、そのまま Playbook を流すと `System is not booted with systemd` と怒られてしまいます。

これを回避するために、コンテナの起動コマンドを `/sbin/init` に設定し、cgroup をマウントし、特権モード（`privileged: true`）を与える……といった「Docker のお作法から外れた設定」を組み込むのに随分と時間を溶かしました。「なぜテストを通すためだけにここまで……」と思いましたが、これを乗り越えたおかげで本番とほぼ同じ挙動を再現できています。

### テストの流れ

苦労して構築したテストは以下の流れで動作します。

1.  Server コンテナ内で本番と同じ Ansible ラッパーを実行し、設定を適用。
2.  Server 側から外向きの HTTP 通信ができるかチェック（apt 等のため）。
3.  Client コンテナから Server へ ping が通るか、SSH（鍵認証・パスワード認証）でログインできるかを検証。

これにより、「設定変更したら SSH が繋がらなくなった」という事故を未然に防げるようになりました。

## まとめ

以上の仕組みにより、以下のサイクルを実現できました。

1.  GitHub にコードを Push する。
2.  CI でテストが走り、Docker 環境での疎通確認が行われる。
3.  CI が通ったコミットのみを、Raspberry Pi が自動で Pull して適用する。
4.  失敗しても自動でロールバックされ、結果は GitHub の Check ステータスで確認できる。

「OS レベルで宣言的かつロールバック可能な仕組み」としては NixOS が有名ですが、現時点では NixOS が Raspberry Pi 5 を正式にサポートしていないため、今回は採用を見送りました。

そのため、しばらくはこの Ansible Pull + 自作ラッパーの構成を育てていくつもりです。手作りの楽しさと実用性のバランスが良く、今のところとても気に入っています。

