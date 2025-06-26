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

- `npm run dev` - 開発サーバー起動
- `npm run build` - ビルド
- `npm run deploy` - Cloudflare Workersへデプロイ
- `npm run lint` - リント実行
- `npm run format` - コード整形
- `npm run type-check` - 型チェック
- `npm run test` - テスト実行

## 🌐 APIエンドポイント

### ヘルスチェック
- `GET /api/health` - 基本的なヘルスチェック
- `GET /api/health/detailed` - 詳細なヘルスチェック

### 音声関連（実装予定）
- `POST /api/audio/upload` - 音声ファイルアップロード
- `GET /api/audio/:id` - 音声ファイル取得
- `DELETE /api/audio/:id` - 音声削除
- `POST /api/audio/:id/analyze` - AI分析実行

### ピン関連（実装予定）
- `GET /api/pins/nearby` - 範囲内ピン取得
- `POST /api/pins` - ピン作成
- `GET /api/pins/:id` - ピン詳細取得
- `PUT /api/pins/:id` - ピン更新
- `DELETE /api/pins/:id` - ピン削除

## 🏗️ 技術スタック

- **Cloudflare Workers** - エッジコンピューティング環境
- **Hono** - 軽量Webフレームワーク
- **TypeScript** - 型安全な開発
- **Supabase** - データベース・ストレージ
- **Python Audio Analyzer (YAMNet)** - AI音声分類 