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

### 3. Environment Variables

Create a `.env` file in the `apps/python-audio-analyzer/` directory:

```env
ENVIRONMENT=development
LOG_LEVEL=debug
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
REDIS_URL=redis://localhost:6379
```

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

### Debug Mode

Enable debug logging:
```env
LOG_LEVEL=debug
ENVIRONMENT=development
```

## 📚 Additional Resources

- [YAMNet Documentation](https://tfhub.dev/google/yamnet/1)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [TensorFlow Hub](https://tfhub.dev/)

## 🤝 Contributing

This service is part of the Sonory monorepo. Please follow the established development workflows and coding standards. 