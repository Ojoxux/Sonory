# 📖 Web App NPM Scripts ガイド

## 🚀 開発・起動

### 環境変数セットアップ（初回のみ）
```bash
# ルートディレクトリで実行
npm run setup:env

# 生成されたテンプレートファイルをコピー
cp .env.local.template .env.local

# .env.local を編集して実際の値を設定
# - NEXT_PUBLIC_MAPBOX_TOKEN
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY

```

### 基本コマンド
```bash
npm run dev              # 開発サーバー起動（Turbopack使用）
npm run build            # 本番ビルド
npm run start            # 本番サーバー起動
```

### 詳細説明
- **`npm run dev`**: Next.js開発サーバーをTurbopackで起動（ポート3000）
- **`npm run build`**: 本番用にアプリケーションをビルド（PWA対応）
- **`npm run start`**: ビルド済みアプリケーションを本番モードで起動

## 🔧 コード品質

### リント・フォーマット
```bash
npm run lint             # Biomeリント実行
npm run lint:fix         # リント自動修正
npm run format           # Biomeフォーマット実行
npm run format:fix       # フォーマット自動修正
npm run type-check       # TypeScript型チェック
```

### 詳細説明
- **`npm run lint`**: Biomeを使用してコードの品質をチェック
- **`npm run lint:fix`**: 自動修正可能なリント問題を修正
- **`npm run format`**: Biomeを使用してコードフォーマットをチェック
- **`npm run format:fix`**: コードを自動フォーマット
- **`npm run type-check`**: TypeScriptの型チェックを実行

## ✅ バリデーション・プリコミット

### 統合コマンド
```bash
npm run validate         # リント + 型チェック
npm run precommit        # リント修正 + フォーマット修正
```

### 詳細説明
- **`npm run validate`**: リントと型チェックを同時実行（CI用）
- **`npm run precommit`**: コミット前に実行する修正コマンド（Husky用）

## 📱 PWA・本番確認

### PWA関連
```bash
npm run build            # PWAビルド
npm run start            # 本番サーバー起動
```

### PWA機能確認手順
```bash
# 1. PWAビルド
npm run build

# 2. 本番サーバー起動
npm run start

# 3. ブラウザで確認
# http://localhost:3000 でアクセス
# デベロッパーツール > Application > Service Workers 確認
# PWAインストールプロンプトの動作確認
```

## 🗂️ メンテナンス

### クリーンアップ
```bash
npm run clean            # Next.jsキャッシュクリア
```

### 詳細説明
- **`npm run clean`**: `.next`ディレクトリとキャッシュを削除

## 💡 使用例

### 開発環境起動
```bash
# 初回セットアップ
npm run setup:env
cp .env.local.template .env.local
# .env.local を編集して環境変数を設定

# 開発サーバー起動
npm run dev

# ブラウザで確認
# http://localhost:3000 でアクセス
# ホットリロード機能で即座に反映
```

### PWA機能確認
```bash
# PWAビルド・起動
npm run build && npm run start

# 確認項目
# - オフライン動作
# - ホーム画面追加
# - プッシュ通知
# - サービスワーカー登録
```

### コミット前チェック
```bash
# 自動修正付きチェック
npm run precommit

# 手動チェック
npm run validate
```

## 🔄 開発ワークフロー

### 日常的な開発手順
```bash
# 1. 開発サーバー起動
npm run dev

# 2. コンポーネント開発...

# 3. コミット前チェック
npm run precommit

# 4. PWA機能確認（必要に応じて）
npm run build && npm run start
```

### CI/CD向けワークフロー
```bash
# 1. 依存関係インストール
npm install

# 2. 共有パッケージビルド
npm run build --workspace=@sonory/shared-types

# 3. バリデーション
npm run validate

# 4. ビルド
npm run build
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

# 共有パッケージ再ビルド
cd ../../packages/shared-types
npm run build
cd ../../apps/web
```

#### 型エラー
```bash
# 型チェック実行
npm run type-check

# 共有パッケージ確認
cd ../../packages/shared-types
npm run build
cd ../../apps/web
```

#### リント・フォーマットエラー
```bash
# 自動修正
npm run precommit

# 個別修正
npm run lint:fix
npm run format:fix
```

#### PWA関連エラー
```bash
# サービスワーカー確認
npm run build
npm run start

# ブラウザのデベロッパーツールで確認
# Application > Service Workers
# Network > Offline にチェックして動作確認
```

## 📊 パフォーマンス最適化

### 開発時の高速化
```bash
# Turbopackによる高速開発
npm run dev  # 既にTurbopack使用

# 並列実行
npm run dev          # ターミナル1（フロントエンド）
cd ../api && npm run dev  # ターミナル2（API）
```

### ビルド最適化
```bash
# 本番ビルド
npm run build

# ビルド分析（必要に応じて）
npm run build -- --analyze
```

## 🎯 開発のコツ

### コンポーネント開発
```bash
# 開発サーバー起動
npm run dev

# Atomic Design構造を活用
# src/components/atoms/     - 基本コンポーネント
# src/components/molecules/ - 複合コンポーネント  
# src/components/organisms/ - 複雑なコンポーネント
```

### 状態管理（Zustand）
```bash
# 状態ストア確認
# src/store/ 以下でZustandストアを管理
# 開発中はRedux DevToolsで状態確認可能
```

### レスポンシブデザイン
```bash
# 開発時のレスポンシブ確認
npm run dev
# ブラウザのデベロッパーツールでデバイスエミュレーション
``` 