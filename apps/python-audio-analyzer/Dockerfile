# syntax=docker/dockerfile:1@sha256:ecfaec9ed6d810b56388c508f4121597bfbba70d41a6dfeee4d8cad5f295fc32
# Multi-stage build for Python audio analyzer
# Use specific version for security
FROM python:3.13-slim@sha256:8d9d0b8bcf6506481eae4907c18f5e3e7902e629f5f6d684f9e7c32e85e3ddf0 AS base

COPY --from=ghcr.io/astral-sh/uv:0.11.16@sha256:440fd6477af86a2f1b38080c539f1672cd22acb1b1a47e321dba5158ab08864d /uv /uvx /bin/

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    UV_PYTHON_DOWNLOADS=0 \
    UV_LINK_MODE=copy \
    NUMBA_CACHE_DIR=/tmp/numba_cache \
    LIBROSA_CACHE_DIR=/tmp/librosa_cache \
    TFHUB_CACHE_DIR=/app/tf_hub_cache

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN groupadd -r app && useradd -r -g app app

# Set work directory
WORKDIR /app

# Create cache directories with proper permissions
RUN mkdir -p /tmp/numba_cache /tmp/librosa_cache /app/tf_hub_cache && \
    chmod 777 /tmp/numba_cache /tmp/librosa_cache && \
    chmod 755 /app/tf_hub_cache

# Development stage
FROM base AS development

# Install development dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY pyproject.toml ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system -e .[dev]

# Copy source code
COPY . .

# Change ownership to app user
RUN chown -R app:app /app /tmp/numba_cache /tmp/librosa_cache
USER app

# Expose port
EXPOSE 8000

# Command for development
CMD ["uvicorn", "src.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]

# Production stage
FROM base AS production

# Copy requirements and install dependencies (production only)
COPY pyproject.toml ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system .

# Copy source code
COPY src/ ./src/

# Create non-root user and change ownership
RUN chown -R app:app /app /tmp/numba_cache /tmp/librosa_cache
USER app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Command for production
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
