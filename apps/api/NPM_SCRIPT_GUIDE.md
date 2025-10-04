# 📖 API NPM Scripts ガイド

## 🚀 開発・起動

### 環境変数セットアップ（初回のみ）
```bash
# .dev.vars.example をコピー
cp .dev.vars.example .dev.vars

# .dev.vars を編集して実際の値を設定してください
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_KEY
```

### 基本コマンド
```bash
npm run dev              # 開発サーバー起動（Wrangler使用）
npm run build            # TypeScriptビルド
npm run deploy           # Cloudflare Workersへデプロイ
```

### 詳細説明
- **`npm run dev`**: Wranglerを使用してローカル開発サーバーを起動します（ポート8787）
- **`npm run build`**: TypeScriptコードをJavaScriptにコンパイルします
- **`npm run deploy`**: Cloudflare Workersに本番デプロイします

## 🔧 コード品質

### リント・フォーマット
```bash
npm run lint             # Biomeリント実行
npm run lint:check       # リントチェック（修正なし）
npm run format           # Biomeフォーマット（自動修正）
npm run type-check       # TypeScript型チェック
```

### 詳細説明
- **`npm run lint`**: Biomeを使用してコードの品質をチェックし、自動修正可能な問題を修正
- **`npm run lint:check`**: 修正は行わず、問題の報告のみ
- **`npm run format`**: Biomeを使用してコードを自動フォーマット
- **`npm run type-check`**: TypeScriptの型チェックを実行

## 🧪 テスト

### テストコマンド
```bash
npm run test             # Vitestテスト実行
npm run test:watch       # テスト監視モード
```

### 詳細説明
- **`npm run test`**: Vitestを使用してテストスイートを実行
- **`npm run test:watch`**: ファイル変更を監視してテストを自動実行

## 🗂️ メンテナンス

### クリーンアップ
```bash
npm run clean            # ビルド成果物削除（dist, .wrangler）
```

### 詳細説明
- **`npm run clean`**: ビルド成果物とキャッシュを削除してクリーンな状態に戻す

## 💡 使用例

### 開発環境起動
```bash
# 初回セットアップ（上記の環境変数セットアップ参照）
# .dev.vars を作成して環境変数を設定

# 開発サーバー起動
npm run dev

# APIエンドポイント確認
curl http://localhost:8787/api/health
curl "http://localhost:8787/api/pins/nearby?north=35.7&south=35.6&east=139.8&west=139.7&limit=10"
```

### 本番デプロイ前チェック
```bash
# 全チェック実行
npm run lint && npm run type-check && npm run build

# 問題があれば修正
npm run format  # フォーマット修正
npm run lint    # リント修正
```

### テスト実行
```bash
# 一回だけテスト実行
npm run test

# 開発中の監視モード
npm run test:watch
```

## 🔄 開発ワークフロー

### 日常的な開発手順
```bash
# 1. 開発サーバー起動
npm run dev

# 2. コード変更...

# 3. コミット前チェック
npm run lint
npm run type-check
npm run test

# 4. 問題があれば修正
npm run format
npm run lint

# 5. 本番デプロイ
npm run build
npm run deploy
```

## 🚨 トラブルシューティング

### よくある問題と解決方法

#### ビルドエラー
```bash
# キャッシュクリア
npm run clean

# 依存関係再インストール
rm -rf node_modules package-lock.json
npm install

# 再ビルド
npm run build
```

#### 型エラー
```bash
# 型チェック実行
npm run type-check

# 共有パッケージ再ビルド
cd ../../packages/shared-types
npm run build
cd ../../apps/api
```

#### リントエラー
```bash
# 自動修正
npm run lint

# フォーマット修正
npm run format
```

## 📊 パフォーマンス最適化

### 高速化のコツ
```bash
# 並列実行（複数ターミナル）
npm run dev          # ターミナル1
npm run test:watch   # ターミナル2

# ビルド高速化
npm run build -- --minify=false  # 開発時のみ
``` 