# Sonory API

Cloudflare Workers上で動作するHono製APIサーバー

## 🎯 技術スタック

- **ランタイム**: Cloudflare Workers
- **フレームワーク**: Hono v4.9.9
- **言語**: TypeScript 5
- **開発ツール**: Wrangler v4.40.0
- **バリデーション**: Zod v3.25.28
- **データベース**: Supabase (PostgreSQL + PostGIS)
- **リンター/フォーマッター**: Biome 1.9.4

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
cd apps/api
npm install
npm run generate-types  # Cloudflare Workers用の型定義を生成
```

### 2. 環境変数の設定

APIサービスは2つの環境で動作します：

#### ローカル環境（Wrangler開発サーバー）
```bash
# .dev.vars.exampleを参考に.dev.varsファイルを作成
cp .dev.vars.example .dev.vars
# 実際のSupabaseキーを設定してください
```

#### Cloudflare Workers（ステージング・本番環境）
```bash
# ステージング環境
wrangler secret put SUPABASE_URL --env staging
wrangler secret put SUPABASE_ANON_KEY --env staging
wrangler secret put SUPABASE_SERVICE_KEY --env staging

# 本番環境
wrangler secret put SUPABASE_URL --env production
wrangler secret put SUPABASE_ANON_KEY --env production
wrangler secret put SUPABASE_SERVICE_KEY --env production
```

### 3. 開発環境の起動

#### 方法A: 一括起動（推奨）
```bash
# プロジェクトルートから
task sonory:up            # または task up
# → Web + Python + API が全て起動します（Ctrl+Cで停止）

# 別ターミナルでサービス状態確認
task status

# 全サービス停止
task down
```

#### 方法B: 個別起動
```bash
# ターミナル1: Docker Composeサービス起動
task sonory:web:up        # Next.js起動（ポート3000）
task sonory:python:up     # Python Audio Analyzer起動（ポート8000）

# ターミナル2: APIサーバー起動
task sonory:api:dev       # Wrangler起動（ポート8787）
# または直接実行
cd apps/api && npm run dev
```

## 📁 ディレクトリ構造

```
src/
├── config/         # 設定ファイル（シークレット管理）
├── routes/         # APIルート定義
├── services/       # ビジネスロジック
├── middleware/     # ミドルウェア
├── repositories/   # データアクセス層
├── utils/          # ユーティリティ
├── types/          # 型定義
└── index.ts        # エントリーポイント
wrangler.toml       # Cloudflare Workers設定
tsconfig-paths.json # TSパスエイリアス設定
```

## 🔧 利用可能なコマンド

### 開発用コマンド
`apps/api`ディレクトリで以下のコマンドを実行できます：

```bash
npm run dev              # Wrangler開発サーバー起動（ポート8787）
npm run generate-types   # Cloudflare Workers用型定義生成
npm run build            # ビルド（型生成込み）
npm run lint             # リント実行
npm run type-check       # 型チェック（型生成込み）
npm run validate         # リント + 型チェック
npm run test             # テスト実行
```

### デプロイコマンド
```bash
# APIをCloudflare Workersにデプロイ
npm run deploy:production    # 本番環境
npm run deploy:staging       # ステージング環境

# または Taskfileから
task sonory:deploy:api           # 本番環境
task sonory:deploy:api:staging   # ステージング環境

# 全サービス一括デプロイ（プロジェクトルートから）
task sonory:deploy           # Web + Python + API（本番）
task sonory:deploy:staging   # Web + Python + API（ステージング）
```

### その他の便利なTaskコマンド
```bash
task sonory:install      # 全サービスの依存関係インストール
task sonory:build        # 全サービスをビルド
task sonory:lint         # 全サービスのLint実行
task sonory:type-check   # 全サービスの型チェック実行
task sonory:clean        # Dockerリソースのクリーンアップ

# 利用可能な全コマンドを確認
task --list
```

## 🌐 APIエンドポイント

### ヘルスチェック
- `GET /api/health` - 基本的なヘルスチェック
- `GET /api/health/detailed` - 詳細なヘルスチェック

### 音声関連
- `POST /api/audio/upload` - 音声ファイルアップロード
- `DELETE /api/audio/:audioId` - 音声削除
- `GET /api/audio/:audioId/metadata` - 音声メタデータ取得
- `POST /api/audio/:audioId/analyze` - AI分析実行（Python YAMNet）

### ピン関連
- `POST /api/pins` - ピン作成
- `POST /api/pins/upload` - 音声アップロード付きピン作成
- `GET /api/pins/nearby` - 範囲内ピン取得
- `GET /api/pins/search` - 条件検索
- `GET /api/pins/user/:userId` - ユーザー専用ピン取得
- `POST /api/pins/batch` - 複数ピン一括作成
- `GET /api/pins/:id` - ピン詳細取得
- `PUT /api/pins/:id` - ピン更新
- `DELETE /api/pins/:id` - ピン削除
- `POST /api/pins/:id/report` - 不適切コンテンツ報告