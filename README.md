<div align=center>
   <img src="apps/web/public/Sonory-App-Icon-PNG.png" width="360" alt="Sonory Logo">
</div>
<div align=center>
   <a href="https://deepwiki.com/Ojoxux/Sonory"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki" />
</div>
<h1>Sonory</h1>
  
<p>
   Sonoryは、あなたの周りの環境音を10秒間録音し、AIが自動分類してスタンプ化、地図上に記録するPWA対応のWebアプリケーションです。<br>
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

# API用環境変数の設定（Wrangler開発サーバー用）
cd apps/api
cp .dev.vars.example .dev.vars
```

3. **開発環境の起動**

**推奨: 一括起動**
```bash
# プロジェクトルートから（初回のみ依存関係インストール）
npm install
# ワークスペース設定により、全サービスの依存関係が自動でインストールされる

# 全サービス起動
task sonory:up        # または task up
# → Web + Python + API が全て起動する
```

開発環境が起動したら、以下にアクセスできます：
- **Web**: [http://localhost:3000](http://localhost:3000)
- **API**: [http://localhost:8787](http://localhost:8787)
- **Redis**: 127.0.0.1:6379（内部ネットワーク用、直接アクセス不要）

**注意**: Python Audio Analyzerは内部ネットワーク専用で、ホストから直接アクセスできません（ポート公開なし）。
APIサービス経由でのみ利用可能です。
