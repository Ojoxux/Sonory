# Sonory Web App

Next.js + Chakra UIで構築されたSonoryのフロントエンドアプリケーションです。

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成して必要な環境変数を設定してください。

```bash
cp .env.example .env.local
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

## 🔧 利用可能なコマンド

基本的な開発コマンド：
```bash
npm run dev              # 開発サーバー起動
npm run build            # 本番ビルド
npm run start            # 本番サーバー起動
```

詳細なコマンドについては [NPM_SCRIPT_GUIDE.md](./NPM_SCRIPT_GUIDE.md) を参照してください。

## 📱 PWA機能

- オフライン対応
- ホーム画面追加
- プッシュ通知
- バックグラウンド同期

## 🏗️ 技術スタック

- **Next.js 14** - App Router + TypeScript
- **Chakra UI** - アクセシブルなUIコンポーネント
- **PWA** - next-pwa によるサービスワーカー
- **Map** - Mapbox GL JS による地図表示
- **Audio** - Web Audio API による音声録音・再生
- **Realtime** - Supabase Realtime による同期

## 📁 ディレクトリ構造

```
src/
├── app/                 # Next.js App Router
│   ├── page.tsx        # メインページ
│   └── layout.tsx      # レイアウト
├── components/         # UIコンポーネント（Atomic Design）
│   ├── atoms/          # 基本コンポーネント
│   ├── molecules/      # 複合コンポーネント
│   └── organisms/      # 複雑なコンポーネント
├── hooks/              # カスタムフック
├── store/              # Zustand状態管理
├── types/              # TypeScript型定義
└── utils/              # ユーティリティ関数
```

## 🎯 主要機能

- **音声録音**: MediaRecorder API による10秒録音
- **地図表示**: Mapbox GL JS による音声ピン表示
- **リアルタイム同期**: Supabase Realtime
- **PWA対応**: オフライン機能・ホーム画面追加
- **レスポンシブデザイン**: モバイルファースト設計 