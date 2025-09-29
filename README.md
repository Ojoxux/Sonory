<div align="center">
  <img src="apps/web/public/Sonory-App-Icon-PNG.png" width="360" alt="Sonory Logo">
  <h1>Sonory</h1>
  <p><strong>~ あなたの過ぎ去った10秒の軌跡を、地図に静かに印す ~</strong></p>
  
  <p>
    Sonoryは、あなたの周りの環境音を10秒間録音し、AIが自動分類してスタンプ化、地図上に記録するPWA対応のウェブアプリケーションです。<br>
    日常の一瞬を音で残します。
  </p>
</div>

## 🎵 Project Overview

### 主要機能
1. **環境音録音機能**
   - 10秒間の環境音を録音（MediaRecorder API使用）
   - 録音した音声の波形表示と再生（wavesurfer.js）

2. **AIによる音声分類**
   - TensorFlow.js（量子化YAMNet）によるオンデバイス音声分類
   - 録音した音に適切なラベルを自動付与

3. **スタンプ生成機能**
   - 音声ラベルに基づいた絵文字とカラーパレットの自動生成
   - 音の印象に合わせた視覚的なスタンプを作成

4. **地図へのスタンプ機能**
   - Mapbox v2 LTSを使用した地図表示
   - 録音した場所に自動生成されたスタンプを配置
   - スタンプのクラスタリング表示

5. **データ永続化機能**
   - Supabase Storageとstampsテーブルを使用
   - オフラインでも録音データを保持（IndexedDB）
   - 再接続時の自動同期（Background Sync API）

6. **コンテキスト情報の自動付与**
   - 時間帯（6時間区切り）の自動タグ付け
   - 天気情報の自動タグ付け（Open-Meteo API使用）

## 🚀 Getting Started

### 必要条件

- Docker 20.0.0以上
- Docker Compose v2以上
- [Task](https://taskfile.dev/) (推奨)
- Git

### 環境構築

1. **リポジトリのクローン**

```bash
git clone https://github.com/Ojoxux/Sonory.git
cd Sonory
```

2. **Docker環境のセットアップ**

```bash
# BuildKitを有効化（セキュアビルドのため）
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# シークレットファイルの設定
./setup-secrets.sh

# Docker用環境変数ファイルの作成
cp .env.example .env
# 必要な環境変数を設定してください
```

3. **開発環境の起動**

```bash
# 全サービス起動
task sonory:up

# 起動確認
task sonory:status
```

開発環境が起動したら、[http://localhost:3000](http://localhost:3000) でアクセスできます。

## 🛠 Development Tools

### よく使うコマンド

```bash
# サービス管理
task sonory:up           # 全サービス起動
task sonory:down         # 停止
task sonory:rebuild      # 再ビルド
task sonory:status       # ステータス確認
task sonory:logs         # ログ確認

# 開発ツール
task sonory:test         # 全サービステスト実行

# メンテナンス
task sonory:clean        # クリーンアップ
task sonory:install      # 依存関係インストール
```

### Docker設定ファイル

- `docker-compose.yml` - メイン設定
- `docker-compose.dev.yml` - 開発環境用オーバーライド
- `docker-compose.secrets.yml` - シークレット管理
- `docker-compose.prod.yml` - 本番環境用設定

#### よくある問題

**BuildKitエラーが発生する場合:**
```bash
# BuildKitが無効になっている可能性
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
```

**ビルドキャッシュをクリアしたい場合:**
```bash
# 全体的なクリーンアップ
task sonory:clean

# Docker システム全体のクリーンアップ
docker system prune -a
```

## 🗂 Project Structure

```
sonory/                               # プロジェクトルート（モノレポ）
├── apps/                            # アプリケーション
│   ├── web/                         # Next.js フロントエンド
│   │   ├── src/
│   │   │   ├── app/                 # Next.js App Router
│   │   │   ├── components/          # UIコンポーネント
│   │   │   │   ├── atoms/           # 最小単位のコンポーネント
│   │   │   │   ├── molecules/       # atomsの組み合わせ
│   │   │   │   └── organisms/       # 複雑な機能を持つコンポーネント
│   │   │   └── store/               # 状態管理（Zustand）
│   │   ├── public/                  # 静的ファイル（PWA用アイコンなど）
│   │   └── Dockerfile               # Next.js用Docker設定
│   ├── api/                         # Hono API (Node.js Runtime)
│   │   ├── src/
│   │   │   ├── config/              # 設定ファイル（シークレット管理）
│   │   │   ├── routes/              # APIルート
│   │   │   ├── services/            # ビジネスロジック
│   │   │   └── middleware/          # ミドルウェア
│   │   ├── Dockerfile               # API用Docker設定
│   │   └── tsconfig-paths.json      # TSパスエイリアス設定
│   └── python-audio-analyzer/       # Python音声分析サービス
│       ├── src/                     # FastAPI + YAMNet
│       └── Dockerfile               # Python用Docker設定
├── packages/                        # 共有パッケージ
│   ├── shared-types/                # 共有型定義
│   ├── utils/                       # 共有ユーティリティ
│   └── config/                      # 共有設定
├── secrets/                         # Docker Secrets（gitignore済み）
├── docker-compose.yml               # メインDocker Compose設定
├── docker-compose.*.yml             # 環境別設定ファイル
├── Taskfile.yml                     # Task自動化設定
└── turbo.json                       # Turborepo設定
```

## 💻 Technical Stack

- **フレームワーク**: Next.js 15.5.4 (Turbopack使用)
- **UI**: React 19 + Tailwind CSS v4
- **PWA**: next-pwa（サービスワーカー、オフライン対応）
- **音声処理**: MediaRecorder API + wavesurfer.js
- **AI推論**: TensorFlow.js + YAMNet（量子化モデル）
- **地図**: Mapbox GL JS v2
- **データ永続化**: Supabase + IndexedDB (idb)
- **状態管理**: Zustand 5.0.5
- **リンター/フォーマッター**: Biome 1.9.4
- **型システム**: TypeScript 5
- **コンテナ化**: Docker + Docker Compose
- **APIランタイム**: Hono (Node.js) + FastAPI (Python)
- **自動化**: Task (Taskfile) + Turborepo

### 個別サービス管理

```bash
# 個別サービス起動
task sonory:web:up       # Webサービスのみ
task sonory:api:up       # APIサービスのみ  
task sonory:python:up    # Python APIサービスのみ

# 個別ログ確認
task sonory:logs:web     # Webログ
task sonory:logs:api     # APIログ
task sonory:logs:python  # Python APIログ

```

### 個別アプリケーション詳細
- **フロントエンド**: [apps/web/README.md](apps/web/README.md)
- **API**: [apps/api/README.md](apps/api/README.md)  
- **Python音声分析**: [apps/python-audio-analyzer/README.md](apps/python-audio-analyzer/README.md)

## 🏗 Build and Deploy

```bash
# 本番環境起動
task sonory:prod

# テスト環境起動（軽量版）
task sonory:test

# 全体クリーンアップ
task sonory:clean
```

## 📝 Development Guidelines

### ブランチ命名規則

```
feature/i[issues番号]_hoge-fuga-hoge
```

例:
- `feature/i123_add-user-authentication`
- `feature/i456_fix-login-error`

### コミットメッセージ

- 英語、日本語どちらでも可
- プレフィックスを使用すること（feat, fix, chore, refactor など）
- スコープの記載は任意（必要に応じて括弧内に記載）
- 絵文字の使用も可（特に録音・音声関連は🎤、音楽関連は🎵を使用）

```
feat: チェックマークアイコンコンポーネントを作成
feat: 🎤 録音機能を強化し、一時停止・再開機能を追加
fix: 確認完了画面のアニメーション問題を修正
chore: next-pwaをdependenciesに追加
```

### プルリクエストタイトル記載ルール

- 日本語で記述すること
- プレフィックスを使用すること（feature, fix, chore, style など）
- スコープの記載は任意（必要に応じて括弧内に記載）
- Issue番号を含めること

```
feature/#[issues番号]: ほげほげ
fix/#[issues番号]: ほげほげ
style/#[issues番号]: ほげほげ
```

例:
- `feature/#123: チェックマークアイコンコンポーネントの実装`
- `feature/#124: RecordingInterface確認完了機能の追加`
- `fix/#456: 確認完了画面のアニメーション問題修正`
- `chore/#459: フォント設定の整理`

## 🤝 Contribution Flow

1. Issueの確認・作成
   - 作業前に対応するIssueが存在することを確認
   - 存在しない場合は新規Issueを作成

2. ブランチの作成
   - ブランチ命名規則に従ったブランチを作成
   - `git checkout -b 'feature/i123_add-new-feature'`

3. 開発作業
   - 小さな単位でコミット
   - コミットメッセージ規則に従う

4. プルリクエスト作成
   - プルリクエストタイトル規則に従って作成
   - 関連するIssue番号を記載
   - 変更内容の概要を記載

5. コードレビュー
   - レビュアーからのフィードバックに対応
   - 必要に応じて修正コミットを追加

6. マージ
   - 承認後、マージを実行
   - Issueをクローズ

## 🚨 トラブルシューティング

開発中に問題が発生した場合は、[TROUBLESHOOTING.md](./TROUBLESHOOTING.md) を参照してください。
