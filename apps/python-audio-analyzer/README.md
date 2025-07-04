# Sonory オーディオアナライザー - Python サービス

環境音分析のためのYAMNetベースのオーディオ分類サービスです。

## 🎯 概要

このサービスはPython環境でGoogle YAMNetモデルを使用した信頼性の高いオーディオ分類を提供します。ブラウザベースのTensorFlow.js実装と比較して、より良い安定性とパフォーマンスを実現します。

## 🏗️ アーキテクチャ

```
フロントエンド (Next.js) → API ゲートウェイ (Cloudflare Workers) → Python オーディオアナライザー
                                                              ↓
                                                         YAMNet モデル
                                                         TensorFlow
```

## 🚀 機能

- **YAMNet オーディオ分類**: 521クラスの環境音分類
- **FastAPI**: 高性能非同期APIフレームワーク
- **Docker サポート**: コンテナ化されたデプロイメント
- **型安全性**: TypeScript共通型から生成されたPython型
- **キャッシング**: Redisベースの結果キャッシュ
- **モニタリング**: 構造化ログとヘルスチェック

## 📋 必要環境

- Python 3.11以上
- Docker & Docker Compose (コンテナ化デプロイメント用)
- Redis (キャッシング用)

## 🛠️ 開発環境セットアップ

### 1. 依存関係のインストール

モノレポのルートから：

```bash
# Python依存関係をインストール
npm run python:install

# TypeScriptからPython型を生成
npm run generate-types
```

### 2. ローカル開発

```bash
# 開発サーバーを起動
npm run python:dev

# またはDocker Composeを使用
cd apps/python-audio-analyzer
docker-compose -f docker-compose.dev.yml up
```

### 2.1. Windows環境での設定

**重要: Windows環境での既知の問題**

日本語ユーザー名を含むWindowsシステムでは、TensorFlow Hubのキャッシュディレクトリに関する問題が発生する場合があります。

**症状:**
```
ERROR: C:\Users\中村のPC\AppData\Local\Temp is not a directory
tensorflow.python.framework.errors_impl.FailedPreconditionError
```

**解決方法:**
以下のセットアップスクリプトを実行してください：

```powershell
# 環境設定のみ
.\setup-windows.ps1

# 環境設定 + サーバー起動
.\setup-windows.ps1 -StartServer

# 環境設定 + ヘルスチェック
.\setup-windows.ps1 -CheckHealth
```

**手動設定の場合:**
```powershell
$env:TFHUB_CACHE_DIR = "$(Get-Location)\tf_hub_cache"
$env:TF_CPP_MIN_LOG_LEVEL = "1"
$env:PYTHONPATH = "$(Get-Location)\src"
New-Item -ItemType Directory -Path "tf_hub_cache" -Force
```

**PowerShell/コマンドプロンプト:**
```powershell
# Python analyzerディレクトリに移動
cd apps\python-audio-analyzer

# 仮想環境を作成
python -m venv .venv

# 仮想環境をアクティベート
.venv\Scripts\activate

# 依存関係をインストール
pip install -e .

# 開発サーバーを起動
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

**Git Bash (推奨):**
```bash
# Python analyzerディレクトリに移動
cd apps/python-audio-analyzer

# 仮想環境を作成
python -m venv .venv

# 仮想環境をアクティベート
source .venv/Scripts/activate

# 依存関係をインストール
pip install -e .

# 開発サーバーを起動
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

**Windows環境のトラブルシューティング:**
- 日本語を含むユーザー名でエラーが発生する場合は、`.\setup-windows.ps1` を実行
- 仮想環境がアクティブでない場合は、`.venv\Scripts\activate` を実行
- Git Bashを使用することでUnix系コマンドが利用可能

### 3. 環境変数

`apps/python-audio-analyzer/` ディレクトリに `.env` ファイルを作成してください：

```env
ENVIRONMENT=development
LOG_LEVEL=debug
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
REDIS_URL=redis://localhost:6379
```

**Windows環境での追加設定:**
```env
# TensorFlow Hubキャッシュディレクトリ（自動設定されますが、必要に応じて指定）
TFHUB_CACHE_DIR=C:\path\to\sonory\apps\python-audio-analyzer\tf_hub_cache

# TensorFlowログレベル
TF_CPP_MIN_LOG_LEVEL=1
```

**Windows環境での注意事項:**
- パスの区切り文字は自動的に処理されますが、環境変数でパスを指定する場合は `\\` を使用
- PowerShellとCommand Promptでは環境変数の設定方法が異なります
- Git Bashを使用することでUnix系コマンドが利用可能

## 📊 API エンドポイント

### ヘルスチェック
```http
GET /health
```

### オーディオ分析
```http
POST /api/v1/analyze/audio
Content-Type: application/json

{
  "audio_url": "https://storage.supabase.co/...",
  "audio_format": "webm",
  "duration": 10
}
```

レスポンス:
```json
{
  "classifications": [
    {
      "label": "車の音",
      "confidence": 0.85,
      "category": "urban"
    }
  ],
  "environment": "urban",
  "processing_time_ms": 250
}
```

## 🧪 テスト

```bash
# テストを実行
npm run python:test

# カバレッジ付きで実行
npm run python:test -- --cov=src --cov-report=html
```

## 📝 コード品質

```bash
# コードを lint
npm run python:lint

# コードをフォーマット
npm run python:format
```

## 🐳 Docker デプロイメント

### 開発環境
```bash
docker-compose -f docker-compose.dev.yml up
```

### 本番環境
```bash
# 本番イメージをビルド
npm run python:build

# 本番コンテナを実行
docker run -p 8000:8000 \
  -e SUPABASE_URL=your_url \
  -e SUPABASE_SERVICE_KEY=your_key \
  sonory-audio-analyzer
```

## 🔄 メインAPIとの統合

Python サービスは既存の Cloudflare Workers API と統合されます：

1. **オーディオアップロード**: ファイルはCloudflare Workers経由でSupabase Storageにアップロード
2. **分析リクエスト**: WorkersがPythonサービスに分析リクエストをプロキシ
3. **結果保存**: 分析結果はSupabaseデータベースに保存
4. **キャッシング**: 頻繁にアクセスされる結果はRedisにキャッシュ

## 🎛️ 設定

### YAMNet モデル設定

サービスは初回起動時にYAMNetモデルを自動的にダウンロードしてキャッシュします。モデルファイルは後続の実行のためにコンテナに保存されます。

### 分類マッピング

オーディオ分類は、SonoryアプリケーションのためにAudioSetの英語クラスから日本語ラベルにマッピングされます。

## 📈 モニタリング

- **ヘルスチェック**: `/health` エンドポイントで利用可能
- **構造化ログ**: リクエスト追跡付きJSONログ
- **メトリクス**: 処理時間とエラー率の追跡

## 🔧 トラブルシューティング

### 一般的な問題

1. **モデルダウンロードの失敗**
   - インターネット接続を確認
   - TensorFlow Hubへのアクセスを確認

2. **オーディオ処理エラー**
   - サポートされているオーディオファイル形式を確認 (webm, mp3, wav)
   - ファイルサイズ制限を確認 (最大10MB)

3. **メモリ問題**
   - Dockerのメモリ割り当てを増やす
   - リソース制約環境でのモデル量子化を検討

### Windows固有の問題

4. **Windowsでの "internal error" (500エラー)**
   ```
   Error: internal error; reference = 0t0kgpo5g5veed5r26i3luhv
   ```
   
   **原因と解決策:**
   
   **1. ffmpeg-pythonの依存関係不足:**
   ```powershell
   # pyproject.tomlに追加済み、再インストール必要
   pip install -e . --force-reinstall
   ```
   
   **2. FFmpegバイナリの不足:**
   ```powershell
   # 方法1: Chocolatey使用（推奨）
   choco install ffmpeg
   
   # 方法2: 手動インストール
   # https://ffmpeg.org/download.html から Windows用をダウンロード
   # システム環境変数PATHに追加
   ```
   
   **3. Python仮想環境が未アクティブ:**
   ```powershell
   # PowerShell
   .venv\Scripts\activate
   
   # Git Bash
   source .venv/Scripts/activate
   ```
   
   **4. Visual C++ Runtime不足:**
   ```powershell
   # Microsoft Visual C++ Redistributableをインストール
   # https://aka.ms/vs/17/release/vc_redist.x64.exe
   ```
   
   **5. 日本語ユーザー名によるパス問題:**
   ```
   ERROR: C:\Users\中村のPC\AppData\Local\Temp is not a directory
   ```
   
   **解決方法:**
   ```powershell
   # Windows環境セットアップスクリプトを実行
   .\setup-windows.ps1
   ```

## 📚 追加リソース

- [YAMNet ドキュメント](https://tfhub.dev/google/yamnet/1)
- [FastAPI ドキュメント](https://fastapi.tiangolo.com/)
- [TensorFlow Hub](https://tfhub.dev/)

## 🤝 コントリビューション

このサービスはSonoryモノレポの一部です。確立された開発ワークフローとコーディング標準に従ってください。