# 📖 Python Audio Analyzer NPM Scripts ガイド

## 🚀 開発・起動

### 環境変数セットアップ（初回のみ）
```bash
# ルートディレクトリで実行
npm run setup:env

# 生成されたテンプレートファイルをコピー
cp .env.template .env

# .env を編集して実際の値を設定
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_KEY
# - REDIS_URL（Docker使用時は自動設定）
```

### 基本コマンド
```bash
npm run python:dev       # 開発サーバー起動（Uvicorn使用）
npm run python:install   # Python依存関係インストール
npm run python:test      # Pytest テスト実行
```

### 詳細説明
- **`npm run python:dev`**: Uvicornを使用してFastAPI開発サーバーを起動（ポート8000）
- **`npm run python:install`**: Python仮想環境作成と依存関係インストール
- **`npm run python:test`**: Pytestを使用してテストスイートを実行

## 🔧 コード品質

### リント・フォーマット
```bash
npm run python:lint      # Ruff + MyPy リント・型チェック
npm run python:format    # Ruff フォーマット
```

### 詳細説明
- **`npm run python:lint`**: Ruffでリント、MyPyで型チェックを実行
- **`npm run python:format`**: Ruffを使用してコードを自動フォーマット

## 🐳 Docker関連

### Docker コマンド
```bash
npm run python:build     # Dockerイメージビルド
docker-compose up        # 本番環境起動
docker-compose -f docker-compose.dev.yml up  # 開発環境起動
```

### 詳細説明
- **`npm run python:build`**: Dockerイメージをビルド
- **`docker-compose up`**: 本番環境でコンテナを起動
- **`docker-compose -f docker-compose.dev.yml up`**: 開発環境でコンテナを起動

## 🪟 Windows専用

### Windows コマンド
```bash
npm run win:install      # Windows依存関係インストール
npm run win:dev          # Windows開発サーバー起動
npm run win:setup        # Windows初期セットアップ
npm run win:debug        # Windows デバッグ
```

### 詳細説明
- **`npm run win:install`**: Windows環境での依存関係インストール
- **`npm run win:dev`**: Windows環境での開発サーバー起動
- **`npm run win:setup`**: Windows初期セットアップ（環境変数設定含む）
- **`npm run win:debug`**: Windows環境のデバッグ情報表示

## 💡 使用例

### 開発環境起動
```bash
# 初回セットアップ
npm run setup:env
cp .env.template .env
# .env を編集して環境変数を設定

# Python環境セットアップ
npm run python:install

# 開発サーバー起動
npm run python:dev

# 音声分析テスト
curl -X POST http://localhost:8000/analyze \
  -F "audio=@test_audio.wav" \
  -F "top_k=5"
```

### Python環境確認
```bash
# Python・依存関係確認
python --version
pip list | grep tensorflow
pip list | grep fastapi

# YAMNetモデル確認
python -c "import tensorflow_hub as hub; print('YAMNet model loading...'); hub.load('https://tfhub.dev/google/yamnet/1')"
```

### Docker環境での起動
```bash
# 開発環境（ホットリロード有効）
docker-compose -f docker-compose.dev.yml up

# 本番環境
docker-compose up

# イメージ再ビルド
docker-compose build --no-cache
```

## 🔄 開発ワークフロー

### 日常的な開発手順
```bash
# 1. 環境変数確認（初回のみ）
# .env ファイルが存在することを確認

# 2. Python環境確認
source .venv/bin/activate  # Linux/Mac
# または
.venv\Scripts\activate     # Windows

# 3. 開発サーバー起動
npm run python:dev

# 4. コード変更...

# 5. テスト実行
npm run python:test

# 6. コード品質チェック
npm run python:lint
npm run python:format
```

### CI/CD向けワークフロー
```bash
# 1. 依存関係インストール
npm run python:install

# 2. リント・型チェック
npm run python:lint

# 3. テスト実行
npm run python:test

# 4. Dockerイメージビルド
npm run python:build
```

## 🚨 トラブルシューティング

### よくある問題と解決方法

#### Python環境エラー
```bash
# 仮想環境リセット
rm -rf .venv
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows
pip install -e .[dev]
```

#### TensorFlowエラー
```bash
# TensorFlowバージョン確認
python -c "import tensorflow as tf; print(tf.__version__)"

# YAMNetモデル再ダウンロード
rm -rf tf_hub_cache/
python -c "import tensorflow_hub as hub; hub.load('https://tfhub.dev/google/yamnet/1')"
```

#### Windows固有の問題
```bash
# Windows環境セットアップ
npm run win:setup

# 環境変数確認
npm run win:debug

# 日本語ユーザー名問題
# PowerShellで実行
.\setup-windows.ps1
```

#### Docker関連エラー
```bash
# コンテナ・イメージクリーンアップ
docker-compose down
docker system prune -f

# イメージ再ビルド
docker-compose build --no-cache

# ログ確認
docker-compose logs python-audio-analyzer
```

## 📊 パフォーマンス最適化

### 開発時の高速化
```bash
# ホットリロード開発
npm run python:dev

# 並列実行
npm run python:dev       # ターミナル1（Python API）
cd ../api && npm run dev # ターミナル2（Gateway API）
cd ../web && npm run dev # ターミナル3（フロントエンド）
```

### モデル最適化
```bash
# YAMNetモデル事前ダウンロード
python -c "import tensorflow_hub as hub; hub.load('https://tfhub.dev/google/yamnet/1')"

# キャッシュディレクトリ確認
ls -la tf_hub_cache/
```

## 🤖 AI分析機能

### YAMNet分析テスト
```bash
# 開発サーバー起動
npm run python:dev

# 音声分析テスト（curl）
curl -X POST http://localhost:8000/analyze \
  -F "audio=@sample.wav" \
  -F "top_k=10"

# 音声分析テスト（Python）
python -c "
import requests
files = {'audio': open('sample.wav', 'rb')}
response = requests.post('http://localhost:8000/analyze', files=files)
print(response.json())
"
```

### 分析結果の確認
```bash
# ヘルスチェック
curl http://localhost:8000/health

# モデル情報取得
curl http://localhost:8000/models/info

# 分析結果例
# {
#   "classifications": [
#     {"label": "Speech", "confidence": 0.85, "class_id": 0},
#     {"label": "Music", "confidence": 0.12, "class_id": 137}
#   ],
#   "environment": {
#     "primary_type": "indoor",
#     "confidence": 0.78
#   }
# }
```

## 🧪 テスト・デバッグ

### テスト実行
```bash
# 全テスト実行
npm run python:test

# カバレッジ付きテスト
python -m pytest --cov=src --cov-report=html

# 特定テストファイル実行
python -m pytest tests/test_analyzer.py -v

# テスト監視モード
python -m pytest --watch
```

### デバッグ
```bash
# デバッグモードで起動
PYTHONPATH=src python -m debugpy --listen 5678 --wait-for-client src/main.py

# ログレベル設定
LOG_LEVEL=debug npm run python:dev

# 詳細ログ出力
TF_CPP_MIN_LOG_LEVEL=0 npm run python:dev
```

## 🔧 環境設定

### 環境変数設定
```bash
# 環境変数テンプレート生成（ルートディレクトリで実行）
npm run setup:env

# テンプレートファイルをコピー
cp .env.template .env

# .env ファイルを編集して実際の値を設定
# - SUPABASE_URL=https://your-project.supabase.co
# - SUPABASE_ANON_KEY=your_supabase_anon_key
# - SUPABASE_SERVICE_KEY=your_supabase_service_key
# - REDIS_URL=redis://localhost:6379 (Docker使用時は自動設定)
```

### Python仮想環境管理
```bash
# 仮想環境作成
python -m venv .venv

# 仮想環境有効化
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows

# 依存関係インストール
pip install -e .[dev]

# 依存関係確認
pip list
pip freeze > requirements-freeze.txt
``` 