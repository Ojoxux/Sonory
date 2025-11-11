<div align="center">
  <img src="apps/web/public/Sonory-App-Icon-PNG.png" width="360" alt="Sonory Logo">
  <h1>Sonory</h1>
  <p><strong>~ あなたの過ぎ去った10秒の軌跡を、地図に静かに印す ~</strong></p>
  
  <p>
    Sonoryは、あなたの周りの環境音を10秒間録音し、AIが自動分類してスタンプ化、地図上に記録するPWA対応のウェブアプリケーションです。<br>
    日常の一瞬を音で残します。
  </p>
</div>

## 🚀 Getting Started

### 必要条件

- Docker 20.0.0以上
- Docker Compose v2以上
- Node.js 18以上
- npm 9以上
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

# シークレットファイルの設定（実行権限付与が必要な場合）
chmod +x scripts/setup-secrets.sh
./scripts/setup-secrets.sh

# Docker用環境変数ファイルの作成
cp .env.example .env
# 必要な環境変数を設定してください

# API用環境変数の設定（Wrangler開発サーバー用）
cd apps/api
cp .dev.vars.example .dev.vars
# Supabase設定を.dev.varsに記入してください
cd ../..
```

3. **開発環境の起動**

Sonoryは4つのサービスで構成されています：
- **Web (Next.js)**: Docker Compose
- **API (Hono + Wrangler)**: ローカルプロセス
- **Python Audio Analyzer (FastAPI + YAMNet)**: Docker Compose
- **Redis**: Docker Compose（キャッシュ用）

**推奨: 一括起動**
```bash
# プロジェクトルートから（初回のみ依存関係インストール）
npm install
# ワークスペース設定により、全サービスの依存関係が自動でインストールされます

# 全サービス起動
task sonory:up        # または task up
# → Web + Python + API が全て起動します（Ctrl+Cで停止）
```

開発環境が起動したら、以下にアクセスできます：
- **Web**: [http://localhost:3000](http://localhost:3000)
- **API**: [http://localhost:8787](http://localhost:8787)
- **Redis**: 127.0.0.1:6379（内部ネットワーク用、直接アクセス不要）

**注意**: Python Audio Analyzerは内部ネットワーク専用で、ホストから直接アクセスできません（ポート公開なし）。
APIサービス経由でのみ利用可能です。

## 🛠 Development Tools

### よく使うコマンド

```bash
# サービス管理
task sonory:up           # 全サービス起動（または task up）
task sonory:dev          # 開発モードでサービスを起動（Docker フォアグラウンド + API）
task sonory:down         # 全サービス停止（または task down）
task sonory:status       # ステータス確認（または task status）
task sonory:rebuild      # 再ビルド

# 個別サービス管理
task sonory:web:up       # Webのみ起動
task sonory:python:up    # Python Audio Analyzerのみ起動
task sonory:api:up      # APIのみ起動（wranglerを直接起動）

# ログ確認
task sonory:logs         # Docker Composeサービスログ（Web + Python）
task sonory:logs:web     # Webログ
task sonory:logs:python  # Python APIログ
# 💡 APIログは task sonory:dev で統合表示、または起動ターミナルで確認

# 開発ツール
task sonory:install      # 依存関係インストール
task sonory:build        # 全サービスビルド
task sonory:lint         # 全サービスLint実行
task sonory:type-check   # 全サービス型チェック

# メンテナンス
task sonory:clean        # クリーンアップ

# 利用可能な全コマンドを確認
task --list
```

### Docker設定ファイル

- `docker-compose.yml` - メイン設定
- `docker-compose.override.yml` - ローカル開発用カスタマイズ
- `docker-compose.dev.yml` - 開発環境用オーバーライド
- `docker-compose.secrets.yml` - シークレット管理
- `docker-compose.prod.yml` - 本番環境用設定
- `docker-compose.networks.yml` - ネットワーク設定
- `docker-compose.test.yml` - テスト環境用設定

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
├── apps/                            # アプリケーション（4サービス）
│   ├── web/                         # 🌐 Next.js フロントエンド（Docker Compose）
│   │   ├── src/
│   │   │   ├── app/                 # Next.js App Router
│   │   │   ├── components/          # UIコンポーネント
│   │   │   │   ├── atoms/           # 最小単位のコンポーネント
│   │   │   │   ├── molecules/       # atomsの組み合わせ
│   │   │   │   └── organisms/       # 複雑な機能を持つコンポーネント
│   │   │   └── store/               # 状態管理（Zustand）
│   │   ├── public/                  # 静的ファイル（PWA用アイコンなど）
│   │   └── Dockerfile               # Next.js用Docker設定
│   ├── api/                         # 🔗 Hono API（ローカルプロセス - Wrangler）
│   │   ├── src/
│   │   │   ├── config/              # 設定ファイル（シークレット管理）
│   │   │   ├── routes/              # APIルート
│   │   │   ├── services/            # ビジネスロジック
│   │   │   └── middleware/          # ミドルウェア
│   │   ├── wrangler.toml            # Cloudflare Workers設定
│   │   ├── .dev.vars.example        # ローカル開発用環境変数テンプレート
│   │   ├── ENV_FILES_README.md      # 環境変数設定ガイド
│   │   └── tsconfig-paths.json      # TSパスエイリアス設定
│   └── python-audio-analyzer/       # 🐍 Python音声分析サービス（Docker Compose）
│       ├── src/                     # FastAPI + YAMNet
│       └── Dockerfile               # Python用Docker設定
├── packages/                        # 共有パッケージ
│   ├── shared-types/                # 共有型定義
│   ├── utils/                       # 共有ユーティリティ
│   └── config/                      # 共有設定
├── secrets/                         # Docker Secrets（gitignore済み）
├── docker-compose.yml               # メインDocker Compose設定（Web + Python + Redis）
├── docker-compose.*.yml             # 環境別設定ファイル
├── Taskfile.yml                     # Task自動化設定
└── turbo.json                       # Turborepo設定

💡 サービス構成:
  - Web（Next.js）: Docker Compose - ポート 3000
  - API（Hono）: ローカルプロセス（Wrangler） - ポート 8787
  - Python API（FastAPI + YAMNet）: Docker Compose - 内部ネットワークのみ
  - Redis: Docker Compose - ポート 6379（キャッシュ用）
```

## 💻 Technical Stack

- **フレームワーク**: Next.js 16.0.1 (Turbopack使用)
- **UI**: React 19.2 + Tailwind CSS v4.1
- **PWA**: next-pwa（サービスワーカー、オフライン対応）
- **音声処理**: MediaRecorder API + wavesurfer.js
- **AI推論**: TensorFlow.js + YAMNet（量子化モデル）
- **地図**: Mapbox GL JS v2
- **データ永続化**: Supabase + IndexedDB (idb)
- **状態管理**: Zustand 5.0.8
- **リンター/フォーマッター**: Biome 2.3.4
- **型システム**: TypeScript 5
- **コンテナ化**: Docker + Docker Compose
- **APIランタイム**: Hono (Cloudflare Workers) + FastAPI (Python)
- **自動化**: Task (Taskfile) + Turborepo

### シェルアクセス

```bash
# Dockerコンテナのシェルを開く
task sonory:shell:web       # Webコンテナ
task sonory:shell:python    # Python APIコンテナ

# APIはDockerを使わないローカルプロセスなので、シェルは不要
# 起動ターミナルで直接確認、または以下でディレクトリ移動:
cd apps/api
```

または`task sonory:dev`で開発モードでサービスを起動すると、全サービスのログが統合表示された状態で起動します。

### 個別アプリケーション詳細
- **フロントエンド**: [apps/web/README.md](apps/web/README.md)
- **API**: [apps/api/README.md](apps/api/README.md)  
- **Python音声分析**: [apps/python-audio-analyzer/README.md](apps/python-audio-analyzer/README.md)

## 🏗 Build and Deploy

### デプロイコマンド

```bash
# 全サービスをデプロイ（Web + Python + API）
task sonory:deploy           # 本番環境
task sonory:deploy:staging   # ステージング環境

# APIのみをデプロイ
task sonory:deploy:api       # 本番環境
task sonory:deploy:api:staging  # ステージング環境

# Docker Composeサービスのみ起動（Web + Python）
task sonory:prod

# テスト環境起動（軽量版）
task sonory:test

# リビルド・クリーンアップ
task sonory:rebuild          # Docker Composeサービスを再ビルド
task sonory:clean            # 全体クリーンアップ
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
