# Sonory Python Audio Analyzer - Windows Issue Fixer
# このスクリプトはWindows環境での500エラーを解決します

Write-Host "=== Sonory Python Audio Analyzer - Windows Issue Fixer ===" -ForegroundColor Green
Write-Host ""

# 管理者権限チェック
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "WARNING: 管理者権限で実行することを推奨します" -ForegroundColor Yellow
    Write-Host ""
}

# 1. Python環境のアクティベート
Write-Host "1. Python仮想環境をチェック..." -ForegroundColor Yellow
if (Test-Path .venv\Scripts\activate.ps1) {
    Write-Host "仮想環境が存在します" -ForegroundColor Green
    & .venv\Scripts\activate.ps1
} else {
    Write-Host "仮想環境を作成します..." -ForegroundColor Yellow
    python -m venv .venv
    & .venv\Scripts\activate.ps1
}

# 2. 依存関係の再インストール
Write-Host ""
Write-Host "2. 依存関係を再インストール..." -ForegroundColor Yellow
pip install --upgrade pip
pip install -e . --force-reinstall

# 3. ffmpegのチェックとインストール
Write-Host ""
Write-Host "3. FFmpegをチェック..." -ForegroundColor Yellow
try {
    $ffmpegVersion = ffmpeg -version 2>&1 | Select-String "version"
    Write-Host "FFmpeg found: $($ffmpegVersion.Line)" -ForegroundColor Green
} catch {
    Write-Host "FFmpegが見つかりません。インストールを試みます..." -ForegroundColor Red
    
    # Chocolateyがインストールされているかチェック
    if (Get-Command choco -ErrorAction SilentlyContinue) {
        Write-Host "Chocolateyを使用してFFmpegをインストール..." -ForegroundColor Yellow
        choco install ffmpeg -y
    } else {
        Write-Host "Chocolateyがインストールされていません。" -ForegroundColor Red
        Write-Host "以下のいずれかの方法でFFmpegをインストールしてください：" -ForegroundColor Yellow
        Write-Host "1. https://ffmpeg.org/download.html からダウンロード"
        Write-Host "2. Chocolateyをインストール後: choco install ffmpeg"
        Write-Host ""
    }
}

# 4. Visual C++ Redistributableのチェック
Write-Host ""
Write-Host "4. Visual C++ Redistributableをチェック..." -ForegroundColor Yellow
$vcRedistPath = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2019\*\VC\Redist\MSVC\*\x64\Microsoft.VC*.CRT\msvcp140.dll"
if (Test-Path $vcRedistPath) {
    Write-Host "Visual C++ Redistributable: インストール済み" -ForegroundColor Green
} else {
    Write-Host "Visual C++ Redistributableが見つかりません" -ForegroundColor Yellow
    Write-Host "https://aka.ms/vs/17/release/vc_redist.x64.exe からダウンロードしてインストールしてください"
}

# 5. TensorFlowの動作確認
Write-Host ""
Write-Host "5. TensorFlowの動作確認..." -ForegroundColor Yellow
$tfTest = python -c "
try:
    import tensorflow as tf
    print(f'TensorFlow {tf.__version__}: OK')
    # GPU確認
    gpus = tf.config.list_physical_devices('GPU')
    if gpus:
        print(f'GPU available: {len(gpus)} device(s)')
    else:
        print('GPU not available (CPU mode)')
except Exception as e:
    print(f'TensorFlow Error: {e}')
" 2>&1

Write-Host $tfTest

# 6. 環境変数の設定
Write-Host ""
Write-Host "6. 環境変数を設定..." -ForegroundColor Yellow
if (-not (Test-Path .env)) {
    Write-Host ".envファイルを作成..." -ForegroundColor Yellow
    @"
ENVIRONMENT=development
LOG_LEVEL=debug
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
REDIS_URL=redis://localhost:6379
PYTHON_AUDIO_ANALYZER_URL=http://localhost:8000
"@ | Out-File -FilePath .env -Encoding UTF8
    Write-Host ".envファイルを作成しました。実際の値で更新してください。" -ForegroundColor Yellow
}

# 7. サービスのテスト起動
Write-Host ""
Write-Host "7. サービスのテスト起動..." -ForegroundColor Yellow
Write-Host "以下のコマンドでサービスを起動してください：" -ForegroundColor Green
Write-Host "uvicorn src.main:app --reload --host 0.0.0.0 --port 8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "起動後、以下でヘルスチェック：" -ForegroundColor Green
Write-Host "curl http://localhost:8000/health" -ForegroundColor Cyan

Write-Host ""
Write-Host "=== 修正完了 ===" -ForegroundColor Green
Write-Host ""
Write-Host "問題が解決しない場合の追加オプション：" -ForegroundColor Yellow
Write-Host "1. WSL2を使用してLinux環境で実行"
Write-Host "2. Docker Desktopを使用してコンテナで実行"
Write-Host "3. ログファイルを確認: LOG_LEVEL=debug" 