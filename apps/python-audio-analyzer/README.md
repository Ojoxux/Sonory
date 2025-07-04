# Sonory Audio Analyzer - Python Service

YAMNet-based audio classification service for environmental sound analysis.

## 🎯 Overview

This service provides reliable audio classification using Google's YAMNet model running in a Python environment. It offers better stability and performance compared to browser-based TensorFlow.js implementations.

## 🏗️ Architecture

```
Frontend (Next.js) → API Gateway (Cloudflare Workers) → Python Audio Analyzer
                                                       ↓
                                                   YAMNet Model
                                                   TensorFlow
```

## 🚀 Features

- **YAMNet Audio Classification**: 521-class environmental sound classification
- **FastAPI**: High-performance async API framework
- **Docker Support**: Containerized deployment
- **Type Safety**: Generated Python types from TypeScript shared types
- **Caching**: Redis-based result caching
- **Monitoring**: Structured logging and health checks

## 📋 Requirements

- Python 3.11+
- Docker & Docker Compose (for containerized deployment)
- Redis (for caching)

## 🛠️ Development Setup

### 1. Install Dependencies

From the monorepo root:

```bash
# Install Python dependencies
npm run python:install

# Generate Python types from TypeScript
npm run generate-types
```

### 2. Local Development

```bash
# Start development server
npm run python:dev

# Or with Docker Compose
cd apps/python-audio-analyzer
docker-compose -f docker-compose.dev.yml up
```

### 2.1. Windows-specific Setup

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

**PowerShell/Command Prompt:**
```powershell
# Navigate to Python analyzer directory
cd apps\python-audio-analyzer

# Create virtual environment
python -m venv .venv

# Activate virtual environment
.venv\Scripts\activate

# Install dependencies
pip install -e .

# Start development server
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

**Git Bash (推奨):**
```bash
# Navigate to Python analyzer directory
cd apps/python-audio-analyzer

# Create virtual environment
python -m venv .venv

# Activate virtual environment
source .venv/Scripts/activate

# Install dependencies
pip install -e .

# Start development server
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

**Windows環境のトラブルシューティング:**
- 日本語を含むユーザー名でエラーが発生する場合は、`.\setup-windows.ps1` を実行
- 仮想環境がアクティブでない場合は、`.venv\Scripts\activate` を実行
- Git Bashを使用することでUnix系コマンドが利用可能

### 3. Environment Variables

Create a `.env` file in the `apps/python-audio-analyzer/` directory:

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

### 4. Visual C++ Runtime不足:
```powershell
# Microsoft Visual C++ Redistributableをインストール
# https://aka.ms/vs/17/release/vc_redist.x64.exe
```

### 5. 日本語ユーザー名によるパス問題:
```
ERROR: C:\Users\中村のPC\AppData\Local\Temp is not a directory
```

**解決方法:**
```powershell
# Windows環境セットアップスクリプトを実行
.\setup-windows.ps1
```

## 📚 Additional Resources

- [YAMNet Documentation](https://tfhub.dev/google/yamnet/1)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [TensorFlow Hub](https://tfhub.dev/)

## 🤝 Contributing

This service is part of the Sonory monorepo. Please follow the established development workflows and coding standards.

## 📊 API Endpoints

### Health Check
```http
GET /health
```

### Audio Analysis
```http
POST /api/v1/analyze/audio
Content-Type: application/json

{
  "audio_url": "https://storage.supabase.co/...",
  "audio_format": "webm",
  "duration": 10
}
```

Response:
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

## 🧪 Testing

```bash
# Run tests
npm run python:test

# With coverage
npm run python:test -- --cov=src --cov-report=html
```

## 📝 Code Quality

```bash
# Lint code
npm run python:lint

# Format code
npm run python:format
```

## 🐳 Docker Deployment

### Development
```bash
docker-compose -f docker-compose.dev.yml up
```

### Production
```bash
# Build production image
npm run python:build

# Run production container
docker run -p 8000:8000 \
  -e SUPABASE_URL=your_url \
  -e SUPABASE_SERVICE_KEY=your_key \
  sonory-audio-analyzer
```

## 🔄 Integration with Main API

The Python service integrates with the existing Cloudflare Workers API:

1. **Audio Upload**: Files are uploaded to Supabase Storage via Cloudflare Workers
2. **Analysis Request**: Workers proxy analysis requests to Python service
3. **Result Storage**: Analysis results are stored in Supabase database
4. **Caching**: Frequently accessed results are cached in Redis

## 🎛️ Configuration

### YAMNet Model Configuration

The service automatically downloads and caches the YAMNet model on first startup. Model files are stored in the container for subsequent runs.

### Classification Mapping

Audio classifications are mapped from English AudioSet classes to Japanese labels for the Sonory application.

## 📈 Monitoring

- **Health Checks**: Available at `/health` endpoint
- **Structured Logging**: JSON logs with request tracing
- **Metrics**: Processing time and error rate tracking

## 🔧 Troubleshooting

### Common Issues

1. **Model Download Fails**
   - Check internet connectivity
   - Verify TensorFlow Hub access

2. **Audio Processing Errors**
   - Ensure audio file format is supported (webm, mp3, wav)
   - Check file size limits (10MB max)

3. **Memory Issues**
   - Increase Docker memory allocation
   - Consider model quantization for resource-constrained environments

### Windows-specific Issues

4. **Python Service "internal error" on Windows (500エラー)**
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
   
   **自動修正スクリプト:**
   ```powershell
   # Windows環境の問題を自動診断・修正
   .\fix-windows-issues.ps1
   ```
   
   **診断コマンド:**
   ```powershell
   # サービスの起動確認
   curl http://localhost:8000/health
   
   # Python環境の確認
   python -c "import tensorflow as tf; print(tf.__version__)"
   python -c "import librosa; print('librosa OK')"
   python -c "import numpy; print('numpy OK')"
   ```

### 詳細なWindows環境対応

Windows環境での開発で問題が発生した場合は、詳細なセットアップガイドを参照してください：

📖 **[Windows開発環境セットアップガイド](./WINDOWS_SETUP.md)**

このガイドには以下の内容が含まれています：
- 日本語パス問題の詳細な解決方法
- 環境変数の設定方法
- トラブルシューティングの詳細
- Docker環境での実行方法
- パフォーマンス最適化のコツ