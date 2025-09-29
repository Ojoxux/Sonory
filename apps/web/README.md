# Sonory Web App

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
cd apps/web && npm install
```

### 2. 環境変数の設定

`.env`ファイルを作成して必要な環境変数を設定してください。

```bash
cp .env.example .env
```

### 3. 開発環境の起動

```bash

# webサービス単体起動
task sonory:web:up

# プロジェクトルートから
task sonory:up         # 全サービス起動
task sonory:logs:web   # Webアプリログ確認
task sonory:down       # 停止
```

## 🔧 利用可能なコマンド

Docker環境での開発コマンドは以下のコマンドで確認できます。
```bash
task --list
```

## 📱 PWA機能

- オフライン対応
- ホーム画面追加
- プッシュ通知
- バックグラウンド同期

## 🏗️ 技術スタック

- **Next.js 15** - App Router + TypeScript（Docker環境対応）
- **Tailwind CSS v4** - ユーティリティファーストCSS
- **PWA** - next-pwa によるサービスワーカー
- **Map** - Mapbox GL JS による地図表示
- **Audio** - Web Audio API による音声録音・再生
- **Realtime** - Supabase Realtime による同期
- **Docker** - コンテナ化開発環境

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
Dockerfile                # Docker設定
docker-entrypoint-dev.sh  # Docker開発環境用エントリーポイント
```

## 🎯 主要機能

- **音声録音**: MediaRecorder API による10秒録音
- **地図表示**: Mapbox GL JS による音声ピン表示
- **リアルタイム同期**: Supabase Realtime
- **PWA対応**: オフライン機能・ホーム画面追加
- **レスポンシブデザイン**: モバイルファースト設計 