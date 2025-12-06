<div align=center>
   <img src="apps/web/public/Sonory-App-Icon-PNG.png" width="360" alt="Sonory Logo">
</div>
<div align=center>
   <a href="https://deepwiki.com/Ojoxux/Sonory"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki" />
</div>
<h1>Sonory</h1>
  
<p>
   Sonoryは、あなたの周りの環境音を10秒間録音し、AIが自動分類してスタンプ化、地図上に記録するPWA対応のウェブアプリケーションです。<br>
   日常の一瞬を音で残します。
</p>

## Getting Started

### 環境構築

1. **リポジトリのクローン**

```bash
git clone https://github.com/Ojoxux/Sonory.git
cd Sonory
```

2. **Docker環境のセットアップ**

```bash
# BuildKitを有効化（セキュアビルドのため）
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# シークレットファイルの設定（実行権限付与が必要な場合）
chmod +x scripts/setup-secrets.sh
./scripts/setup-secrets.sh

# Docker用環境変数ファイルの作成
cp .env.example .env
# 必要な環境変数を設定してください

# API用環境変数の設定（Wrangler開発サーバー用）
cd apps/api
cp .dev.vars.example .dev.vars
# Supabase設定を.dev.varsに記入してください
cd ../..
```

3. **開発環境の起動**

Sonoryは4つのサービスで構成されています：
- **Web (Next.js)**: Docker Compose
- **API (Hono + Wrangler)**: ローカルプロセス
- **Python Audio Analyzer (FastAPI + YAMNet)**: Docker Compose
- **Redis**: Docker Compose（キャッシュ用）

**推奨: 一括起動**
```bash
# プロジェクトルートから（初回のみ依存関係インストール）
npm install
# ワークスペース設定により、全サービスの依存関係が自動でインストールされます

# 全サービス起動
task sonory:up        # または task up
# → Web + Python + API が全て起動します（Ctrl+Cで停止）
```

開発環境が起動したら、以下にアクセスできます：
- **Web**: [http://localhost:3000](http://localhost:3000)
- **API**: [http://localhost:8787](http://localhost:8787)
- **Redis**: 127.0.0.1:6379（内部ネットワーク用、直接アクセス不要）

**注意**: Python Audio Analyzerは内部ネットワーク専用で、ホストから直接アクセスできません（ポート公開なし）。
APIサービス経由でのみ利用可能です。

## Development Tools

### よく使うコマンド

```bash
# サービス管理
task sonory:up           # 全サービス起動（または task up）
task sonory:dev          # 開発モードでサービスを起動（Docker フォアグラウンド + API）
task sonory:down         # 全サービス停止（または task down）
task sonory:status       # ステータス確認（または task status）
task sonory:rebuild      # 再ビルド

# 個別サービス管理
task sonory:web:up       # Webのみ起動
task sonory:python:up    # Python Audio Analyzerのみ起動
task sonory:api:up      # APIのみ起動（wranglerを直接起動）

# ログ確認
task sonory:logs         # Docker Composeサービスログ（Web + Python）
task sonory:logs:web     # Webログ
task sonory:logs:python  # Python APIログ
# 💡 APIログは task sonory:dev で統合表示、または起動ターミナルで確認

# 開発ツール
task sonory:install      # 依存関係インストール
task sonory:build        # 全サービスビルド
task sonory:lint         # 全サービスLint実行
task sonory:type-check   # 全サービス型チェック

# メンテナンス
task sonory:clean        # クリーンアップ

# 利用可能な全コマンドを確認
task --list
```

## 🏗 Build and Deploy

### デプロイコマンド

```bash
# 全サービスをデプロイ（Web + Python + API）
task sonory:deploy           # 本番環境
task sonory:deploy:staging   # ステージング環境

# APIのみをデプロイ
task sonory:deploy:api       # 本番環境
task sonory:deploy:api:staging  # ステージング環境

# Docker Composeサービスのみ起動（Web + Python）
task sonory:prod

# テスト環境起動（軽量版）
task sonory:test

# リビルド・クリーンアップ
task sonory:rebuild          # Docker Composeサービスを再ビルド
task sonory:clean            # 全体クリーンアップ
```
