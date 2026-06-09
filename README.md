<div align=center>
   <img src="apps/web/public/Sonory-App-Icon-PNG.png" width="360" alt="Sonory Logo">
</div>
<div align=center>
   <a href="https://deepwiki.com/Ojoxux/Sonory"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki" />
</div>
<h1>Sonory</h1>
  
<p>
   Sonoryは、周囲の環境音を10秒間録音し、AIがその音を分類して地図上に記録します。<br>
   日常の一瞬を音で残します。
</p>

## Getting Started

### 環境構築

1. **リポジトリのクローン**

```bash
git clone https://github.com/Ojoxux/Sonory.git
cd Sonory
```

2. **環境変数のセットアップ**

```bash
# シークレットファイルの設定（実行権限付与が必要な場合）
chmod +x scripts/setup-secrets.sh
./scripts/setup-secrets.sh

# ルート環境変数の作成
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
# → DockerでPython/Redis、ホストでWeb/APIが起動する
```

開発環境が起動したら、以下にアクセスできます：
- **Web**: [http://localhost:3000](http://localhost:3000)
- **API**: [http://localhost:8787](http://localhost:8787)
- **Audio Analyzer**: [http://localhost:8000](http://localhost:8000)
- **Redis**: 127.0.0.1:6379

**注意**: WebはOpenNextでCloudflare Workersへデプロイする前提です。普段の開発は`next dev`、Workersランタイム確認は`cd apps/web && npm run preview`を使います。
