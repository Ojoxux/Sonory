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

### 3. Environment Variables

Create a `.env` file in the `apps/python-audio-analyzer/` directory:

```env
ENVIRONMENT=development
LOG_LEVEL=debug
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
REDIS_URL=redis://localhost:6379
```

**Windows環境での注意事項:**
- パスの区切り文字は自動的に処理されますが、環境変数でパスを指定する場合は `\\` を使用
- PowerShellとCommand Promptでは環境変数の設定方法が異なります
- Git Bashを使用することでUnix系コマンドが利用可能

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

4. **Python Service "internal error" on Windows**
   ```
   Error: internal error; reference = 0t0kgpo5g5veed5r26i3luhv
   ```
   
   **原因と解決策:**
   - **仮想環境が未アクティブ:** `.venv\Scripts\activate` でPython仮想環境をアクティブ化
   - **依存関係の不足:** `pip install -e .` で全ての依存関係を再インストール
   - **ffmpeg不足:** `choco install ffmpeg` またはWindows用ffmpegをインストール
   - **Visual C++ Runtime不足:** Microsoft Visual C++ Redistributableをインストール
   
   **診断コマンド:**
   ```powershell
   # サービスの起動確認
   curl http://localhost:8000/health
   
   # Python環境の確認
   python -c "import tensorflow as tf; print(tf.__version__)"
   python -c "import librosa; print('librosa OK')"
   python -c "import numpy; print('numpy OK')"
   ```

5. **Path Separator Issues**
   - Windows: `\` vs Unix: `/`
   - 環境変数でパスを指定する場合は `\\` を使用
   - Python内では `pathlib.Path` を使用して自動処理

6. **Permission Errors**
   - 管理者権限でターミナルを起動
   - WSL2使用を検討（Linux互換環境）

7. **Port Conflicts**
   ```powershell
   # ポート8000の使用状況確認
   netstat -ano | findstr :8000
   
   # プロセス終了
   taskkill /PID <process_id> /F
   ```

8. **Environment Variables**
   ```powershell
   # PowerShellでの環境変数設定
   $env:PYTHON_AUDIO_ANALYZER_URL="http://localhost:8000"
   $env:LOG_LEVEL="debug"
   
   # 確認
   echo $env:PYTHON_AUDIO_ANALYZER_URL
   ```

### WSL2 Setup (推奨)

Windows環境でLinux互換性を高めるため、WSL2の使用を推奨します：

```bash
# WSL2でのセットアップ
wsl --install -d Ubuntu-22.04

# WSL2内での作業
cd /mnt/c/path/to/sonory/apps/python-audio-analyzer
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### Debug Mode

Enable debug logging:
```env
LOG_LEVEL=debug
ENVIRONMENT=development
```

**Windows用デバッグスクリプト:**
```powershell
# debug-windows.ps1
Write-Host "=== Sonory Python Audio Analyzer Debug ==="
Write-Host "Python Version:" (python --version)
Write-Host "Pip Version:" (pip --version)
Write-Host "Virtual Environment:" $env:VIRTUAL_ENV
Write-Host "Current Directory:" (Get-Location)

# 依存関係チェック
python -c "
try:
    import tensorflow as tf
    print(f'TensorFlow: {tf.__version__}')
except ImportError as e:
    print(f'TensorFlow Error: {e}')

try:
    import librosa
    print('librosa: OK')
except ImportError as e:
    print(f'librosa Error: {e}')

try:
    import uvicorn
    print('uvicorn: OK')
except ImportError as e:
    print(f'uvicorn Error: {e}')
"

# サービス起動テスト
Write-Host "Testing service startup..."
Start-Process -NoNewWindow -FilePath "python" -ArgumentList "-c", "from src.main import create_app; app = create_app(); print('App created successfully')"
```

## 📚 Additional Resources

- [YAMNet Documentation](https://tfhub.dev/google/yamnet/1)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [TensorFlow Hub](https://tfhub.dev/)

## 🤝 Contributing

This service is part of the Sonory monorepo. Please follow the established development workflows and coding standards. 