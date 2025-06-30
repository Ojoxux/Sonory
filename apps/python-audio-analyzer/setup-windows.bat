@echo off
echo === Sonory Python Audio Analyzer - Windows Setup ===
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.11+ from https://python.org
    pause
    exit /b 1
)

echo Python found: 
python --version

REM Create virtual environment
echo.
echo Creating virtual environment...
if not exist .venv (
    python -m venv .venv
    echo Virtual environment created successfully
) else (
    echo Virtual environment already exists
)

REM Activate virtual environment
echo.
echo Activating virtual environment...
call .venv\Scripts\activate.bat

REM Upgrade pip
echo.
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install dependencies
echo.
echo Installing dependencies...
pip install -e .

REM Check installations
echo.
echo Checking installations...
python -c "import tensorflow as tf; print('TensorFlow:', tf.__version__)" 2>nul
if %errorlevel% neq 0 (
    echo WARNING: TensorFlow installation may have issues
)

python -c "import librosa; print('librosa: OK')" 2>nul
if %errorlevel% neq 0 (
    echo WARNING: librosa installation may have issues
)

REM Check FFmpeg
echo.
echo Checking FFmpeg...
ffmpeg -version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: FFmpeg not found
    echo Install with: choco install ffmpeg
    echo Or download from: https://ffmpeg.org/download.html
) else (
    echo FFmpeg found
)

REM Create .env file if it doesn't exist
echo.
echo Checking .env file...
if not exist .env (
    echo Creating default .env file...
    echo ENVIRONMENT=development > .env
    echo LOG_LEVEL=debug >> .env
    echo SUPABASE_URL=your_supabase_url >> .env
    echo SUPABASE_SERVICE_KEY=your_service_key >> .env
    echo REDIS_URL=redis://localhost:6379 >> .env
    echo.
    echo Please edit .env file with your actual values
) else (
    echo .env file already exists
)

echo.
echo === Setup Complete ===
echo.
echo To start the service:
echo 1. Activate virtual environment: .venv\Scripts\activate
echo 2. Start service: uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
echo.
echo To debug issues: .\debug-windows.ps1
echo.
pause 