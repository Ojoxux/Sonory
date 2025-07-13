# Sonory API

Cloudflare Workers + Honoで構築されたSonoryのバックエンドAPIです。

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`を参考に`.env`ファイルを作成してください。

```bash
cp .env.example .env
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

## 📁 ディレクトリ構造

```
src/
├── routes/         # APIルート定義
├── services/       # ビジネスロジック
├── middleware/     # ミドルウェア
├── utils/          # ユーティリティ
├── types/          # 型定義
└── index.ts        # エントリーポイント
```

## 🔧 利用可能なコマンド

基本的な開発コマンド：
```bash
npm run dev              # 開発サーバー起動
npm run build            # ビルド
npm run deploy           # Cloudflare Workersへデプロイ
```

詳細なコマンドについては [NPM_SCRIPT_GUIDE.md](./NPM_SCRIPT_GUIDE.md) を参照してください。

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

- **Cloudflare Workers** - エッジコンピューティング環境
- **Hono** - 軽量Webフレームワーク
- **TypeScript** - 型安全な開発
- **Supabase** - データベース・ストレージ
- **Python Audio Analyzer (YAMNet)** - AI音声分類 