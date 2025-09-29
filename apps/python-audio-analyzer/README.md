# Sonory AI Audio Analyzer(YAMNet, TensorFlow Hub)

## 🚀 セットアップ

### 1. 開発環境の起動

```bash
# AI音分類サービス単体起動
task sonory:python:up

# プロジェクトルートから
task sonory:up           # 全サービス起動
task sonory:logs:python  # Python APIログ確認
task sonory:down         # 停止
```

## 🔧 利用可能なコマンド

Docker環境での開発コマンドは以下のコマンドで確認できます。
```bash
task --list
```

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
- **Uvicorn** - ASGIサーバー（Docker環境）
- **Docker** - コンテナ化環境
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
Dockerfile               # Docker設定
```

## 🌐 APIエンドポイント

- `POST /analyze` - 音声ファイル分析
- `GET /health` - ヘルスチェック
- `GET /models/info` - モデル情報取得

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