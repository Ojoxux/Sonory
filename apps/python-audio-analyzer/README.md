# Python Audio Analyzer

YAMNet（TensorFlow Hub）を使用したSonoryの音声分析APIです。

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Python環境のセットアップ

```bash
# Python仮想環境作成・有効化
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# または
.venv\Scripts\activate     # Windows

# Python依存関係インストール
pip install -e .[dev]
```

### 3. 開発サーバーの起動

```bash
npm run python:dev
```

## 🔧 利用可能なコマンド

基本的な開発コマンド：
```bash
npm run python:dev       # 開発サーバー起動
npm run python:install   # Python依存関係インストール
npm run python:test      # テスト実行
```

詳細なコマンドについては [NPM_SCRIPT_GUIDE.md](./NPM_SCRIPT_GUIDE.md) を参照してください。

## 🤖 AI分析機能

### YAMNetによる音響分類
- **521種類の音響イベント**を分類
- **環境音の特徴分析**（屋内・屋外・交通・自然音など）
- **信頼度スコア**付きの分類結果

### 分析結果例
```json
{
  "classifications": [
    {
      "label": "Speech",
      "confidence": 0.85,
      "class_id": 0
    },
    {
      "label": "Music",
      "confidence": 0.12,
      "class_id": 137
    }
  ],
  "environment": {
    "primary_type": "indoor",
    "confidence": 0.78,
    "details": {
      "indoor_probability": 0.78,
      "outdoor_probability": 0.22
    }
  }
}
```

## 🏗️ 技術スタック

- **FastAPI** - 高性能なPython WebAPI
- **TensorFlow Hub** - YAMNetモデル
- **Uvicorn** - ASGIサーバー
- **Docker** - コンテナ化
- **Pytest** - テストフレームワーク
- **Ruff** - 高速リンター・フォーマッター

## 📁 ディレクトリ構造

```
src/
├── main.py              # FastAPIアプリケーション
├── api/
│   └── routes.py        # APIルート定義
├── models/
│   └── yamnet_wrapper.py # YAMNetモデルラッパー
└── services/
    ├── analyzer.py      # 音声分析サービス
    └── audio_processor.py # 音声処理
```

## 🌐 APIエンドポイント

- `POST /analyze` - 音声ファイル分析
- `GET /health` - ヘルスチェック
- `GET /models/info` - モデル情報取得

## 🐳 Docker利用

```bash
# 開発環境
docker-compose -f docker-compose.dev.yml up

# 本番環境
docker-compose up

# イメージ再ビルド
docker-compose build --no-cache
```

## 🧪 テスト

```bash
# テスト実行
npm run python:test

# カバレッジ付きテスト
python -m pytest --cov=src

# 特定テストファイル実行
python -m pytest tests/test_analyzer.py -v
```

## 🔧 トラブルシューティング

### TensorFlowエラー
```bash
# TensorFlowバージョン確認
python -c "import tensorflow as tf; print(tf.__version__)"

# YAMNetモデル再ダウンロード
rm -rf tf_hub_cache/
python -c "import tensorflow_hub as hub; hub.load('https://tfhub.dev/google/yamnet/1')"
```

### Python環境エラー
```bash
# 仮想環境リセット
rm -rf .venv
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
```

## 📚 追加リソース

- [YAMNet ドキュメント](https://tfhub.dev/google/yamnet/1)
- [FastAPI ドキュメント](https://fastapi.tiangolo.com/)
- [TensorFlow Hub](https://tfhub.dev/)

## 🤝 コントリビューション

このサービスはSonoryモノレポの一部です。確立された開発ワークフローとコーディング標準に従ってください。