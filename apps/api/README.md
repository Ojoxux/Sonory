# Sonory API

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
cd apps/api && npm install
```

### 2. 環境変数の設定

APIサービスは2つの環境で動作します：

#### Docker環境（開発環境）
```bash
# env.exampleを参考に.envファイルを作成
cp env.example .env
# 実際のSupabaseキーを設定してください
```

#### Cloudflare Workers（本番環境）
```bash
# .dev.varsファイルが既に存在します
# 本番環境ではCloudflare Workersの環境変数として設定
```

### 3. 開発環境の起動

```bash
# プロジェクトルートから
task sonory:up        # 全サービス起動
task sonory:logs:api  # APIログ確認
task sonory:down      # 停止
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
Dockerfile          # Docker設定
tsconfig-paths.json # TSパスエイリアス設定
```

## 🔧 利用可能なコマンド

Docker環境での開発コマンド：
```bash
# 全サービス起動
task sonory:up           # 全サービス起動
task sonory:rebuild      # リビルド

# APIサービス単体
task sonory:api:up       # APIサービスのみ起動

# ログ・監視
task sonory:logs:api     # APIログ確認
task sonory:status       # 全サービス状況確認

# 開発ツール（サービス内で実行）
npm run lint             # リント実行
npm run lint:fix         # リント自動修正
npm run type-check       # 型チェック実行
npm run validate         # リント + 型チェック
npm run test             # テスト実行
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

## 🏗️ 技術スタック

- **Node.js** - サーバーランタイム（Docker環境）
- **Cloudflare Workers** - 本番環境ランタイム
- **Hono** - 軽量Webフレームワーク
- **TypeScript** - 型安全な開発
- **Supabase** - データベース・ストレージ
- **Docker** - コンテナ化環境（開発用）
- **Python Audio Analyzer (YAMNet)** - AI音声分類（マイクロサービス） 