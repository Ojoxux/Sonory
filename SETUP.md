# 🚀 Sonory 初回セットアップガイド

このガイドでは、Sonoryプロジェクトを新規環境でセットアップする手順を説明します。

## 📋 前提条件

- Node.js 20.0.0以上
- npm 10.0.0以上
- Git

## 🛠 セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/Ojoxux/Sonory.git
cd Sonory
```

### 2. 簡単セットアップ（推奨）

```bash
# すべての依存関係のインストールとビルドを一度に実行
npm run setup

# 環境変数テンプレートファイルの作成（任意）
npm run setup:env
```

> **注意**: 初回実行時は数分かかる場合があります。`npm run setup:env`を実行すると、各アプリケーションの環境変数テンプレートファイルが自動作成されます。

### 3. 環境変数の設定

各アプリケーションごとに環境変数を設定します：

> **💡 ヒント**: `npm run setup:env` を実行すると、環境変数テンプレートファイルが自動作成され、設定手順が表示されます。

#### **フロントエンド (apps/web)**
```bash
# apps/web/.env.local を作成
cd apps/web
cp .env.local.template .env.local  # または手動で作成
```

必要な環境変数：
- `NEXT_PUBLIC_MAPBOX_TOKEN`: Mapboxのアクセストークン
- `NEXT_PUBLIC_APP_NAME`: アプリケーション名（通常 "Sonory"）

#### **API (apps/api)**
```bash
# apps/api/.dev.vars を編集（すでに存在）
cd ../../apps/api
# .dev.vars ファイルを確認・編集
```

必要な環境変数：
- `CORS_ORIGIN`: フロントエンドのURL（通常 `http://localhost:3000`）
- `SUPABASE_URL`: SupabaseプロジェクトのURL
- `SUPABASE_ANON_KEY`: Supabaseの匿名キー
- `SUPABASE_SERVICE_KEY`: Supabaseのサービスキー（管理者権限）
- `PYTHON_AUDIO_ANALYZER_URL`: Python音声分析サービスのURL
- `PYTHON_AUDIO_ANALYZER_TIMEOUT`: Python音声分析のタイムアウト（ミリ秒）

#### **Python音声分析 (apps/python-audio-analyzer)**
```bash
# apps/python-audio-analyzer/.env を作成
cd ../python-audio-analyzer
cp .env.template .env
```

必要な環境変数：
- `ENVIRONMENT`: 環境設定（development/production）
- `LOG_LEVEL`: ログレベル（info/debug/warning/error）
- `SUPABASE_URL`: SupabaseプロジェクトのURL
- `SUPABASE_ANON_KEY`: Supabaseの匿名キー（フロントエンドからのアクセス用）
- `SUPABASE_SERVICE_KEY`: Supabaseのサービスキー（管理者権限）
- `REDIS_URL`: RedisサーバーのURL（例: `redis://localhost:6379`）

> **💡 重要な注意点：**
> - **アーキテクチャ**: フロントエンドはAPIサーバー経由でSupabaseにアクセスします
> - **Supabase設定**: APIとPython音声分析サービスで同じSupabaseプロジェクトを共有します
> - **CORS設定**: フロントエンドとAPIは異なるポートで起動するため、CORS_ORIGINの設定が重要です
> - **Redis**: Python音声分析サービスでRedisを使用する場合は事前に起動してください（`docker run -d -p 6379:6379 redis:alpine`）

#### **環境変数テンプレート**

各アプリケーションの環境変数テンプレートの例：

**apps/web/.env.local:**
```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
NEXT_PUBLIC_APP_NAME=Sonory
```

**apps/python-audio-analyzer/.env:**
```env
ENVIRONMENT=development
LOG_LEVEL=info
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here
REDIS_URL=redis://localhost:6379
```

**apps/api/.dev.vars:**
```env
ENVIRONMENT=development
CORS_ORIGIN=http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here
PYTHON_AUDIO_ANALYZER_URL=http://localhost:8000
PYTHON_AUDIO_ANALYZER_TIMEOUT=30000
```

### 4. 開発サーバーの起動

```bash
# フロントエンドのみ起動
npm run dev:web

# APIサーバーのみ起動
npm run dev:api

# すべてのサービスを起動
npm run start:all
```

## 🚨 トラブルシューティング

### "Could not resolve @sonory/shared-types" エラー

このエラーは、内部パッケージがビルドされていない場合に発生します。

**解決方法:**
```bash
# プロジェクトルートで実行
npm run build
```

### パッケージのインストールエラー

```bash
# node_modulesをクリーンアップして再インストール
rm -rf node_modules packages/*/node_modules apps/*/node_modules
rm package-lock.json
npm install
npm run build
```

### ポートが使用中のエラー

```bash
# 使用中のポートを確認
lsof -i :3000,8787,8000

# プロセスを停止
npm run stop:all
```

## 📦 パッケージ構成

このプロジェクトはTurborepoを使用したモノレポ構成です：

- `apps/web`: Next.jsフロントエンド
- `apps/api`: Cloudflare Workers API
- `apps/python-audio-analyzer`: Python音声分析サービス
- `packages/shared-types`: 共有型定義
- `packages/utils`: 共有ユーティリティ
- `packages/config`: 共有設定

## 🔄 更新時の注意

プロジェクトを更新（pull）した後は、依存関係が変更されている可能性があるため：

```bash
npm install
npm run build
```

を実行することをお勧めします。 