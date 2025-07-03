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

# Windows環境でのSonory Python Audio Analyzer問題修正スクリプト

Write-Host "Sonory Python Audio Analyzer - Windows環境問題修正スクリプト" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# 管理者権限の確認
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "警告: 管理者権限で実行することを推奨します" -ForegroundColor Yellow
}

# プロジェクトディレクトリの確認
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "プロジェクトディレクトリ: $projectDir" -ForegroundColor Cyan

# 1. TensorFlow Hubキャッシュディレクトリの設定
Write-Host "`n1. TensorFlow Hub キャッシュディレクトリの設定..." -ForegroundColor Yellow

# 安全なキャッシュディレクトリを作成
$cacheDir = Join-Path $projectDir "tf_hub_cache"
if (-not (Test-Path $cacheDir)) {
    New-Item -ItemType Directory -Path $cacheDir -Force | Out-Null
    Write-Host "キャッシュディレクトリを作成しました: $cacheDir" -ForegroundColor Green
}

# 環境変数を設定
$env:TFHUB_CACHE_DIR = $cacheDir
[System.Environment]::SetEnvironmentVariable("TFHUB_CACHE_DIR", $cacheDir, [System.EnvironmentVariableTarget]::User)
Write-Host "TFHUB_CACHE_DIR環境変数を設定しました: $cacheDir" -ForegroundColor Green

# 2. TensorFlow一時ディレクトリの設定
Write-Host "`n2. TensorFlow 一時ディレクトリの設定..." -ForegroundColor Yellow

$tfTempDir = Join-Path $cacheDir "tf_temp"
if (-not (Test-Path $tfTempDir)) {
    New-Item -ItemType Directory -Path $tfTempDir -Force | Out-Null
    Write-Host "TensorFlow一時ディレクトリを作成しました: $tfTempDir" -ForegroundColor Green
}

# 3. Python環境の確認
Write-Host "`n3. Python環境の確認..." -ForegroundColor Yellow

$pythonVersion = python --version 2>&1
Write-Host "Python バージョン: $pythonVersion" -ForegroundColor Cyan

# 仮想環境の確認
if ($env:VIRTUAL_ENV) {
    Write-Host "仮想環境: $env:VIRTUAL_ENV" -ForegroundColor Green
} else {
    Write-Host "警告: 仮想環境がアクティブではありません" -ForegroundColor Yellow
    Write-Host "仮想環境をアクティブにするには: .venv\Scripts\Activate.ps1" -ForegroundColor Cyan
}

# 4. 必要なパッケージの確認
Write-Host "`n4. 必要なパッケージの確認..." -ForegroundColor Yellow

$requiredPackages = @(
    "tensorflow",
    "tensorflow-hub", 
    "fastapi",
    "uvicorn",
    "numpy",
    "structlog"
)

foreach ($package in $requiredPackages) {
    $installed = pip show $package 2>$null
    if ($installed) {
        $version = ($installed | Select-String "Version:").Line.Split(":")[1].Trim()
        Write-Host "$package : $version" -ForegroundColor Green
    } else {
        Write-Host "$package : 未インストール" -ForegroundColor Red
    }
}

# 5. 環境変数のバックアップスクリプト作成
Write-Host "`n5. 環境変数設定スクリプトの作成..." -ForegroundColor Yellow

$envScript = @"
# Sonory Python Audio Analyzer - 環境変数設定スクリプト
# このスクリプトをuvicorn起動前に実行してください

`$env:TFHUB_CACHE_DIR = "$cacheDir"
`$env:TF_CPP_MIN_LOG_LEVEL = "1"
`$env:PYTHONPATH = "$projectDir\src"

Write-Host "環境変数設定完了" -ForegroundColor Green
Write-Host "TFHUB_CACHE_DIR: `$env:TFHUB_CACHE_DIR" -ForegroundColor Cyan
Write-Host "TF_CPP_MIN_LOG_LEVEL: `$env:TF_CPP_MIN_LOG_LEVEL" -ForegroundColor Cyan
Write-Host "PYTHONPATH: `$env:PYTHONPATH" -ForegroundColor Cyan
"@

$envScriptPath = Join-Path $projectDir "setup-env.ps1"
$envScript | Out-File -FilePath $envScriptPath -Encoding UTF8
Write-Host "環境変数設定スクリプトを作成しました: $envScriptPath" -ForegroundColor Green

# 6. 起動スクリプトの作成
Write-Host "`n6. 起動スクリプトの作成..." -ForegroundColor Yellow

$startScript = @"
# Sonory Python Audio Analyzer - 起動スクリプト
# Windows環境での問題を解決した起動スクリプト

Write-Host "Sonory Python Audio Analyzer 起動中..." -ForegroundColor Green

# 環境変数設定
`$env:TFHUB_CACHE_DIR = "$cacheDir"
`$env:TF_CPP_MIN_LOG_LEVEL = "1"
`$env:PYTHONPATH = "$projectDir\src"

# 仮想環境の確認
if (-not `$env:VIRTUAL_ENV) {
    Write-Host "仮想環境をアクティブにしています..." -ForegroundColor Yellow
    if (Test-Path ".venv\Scripts\Activate.ps1") {
        & ".venv\Scripts\Activate.ps1"
    } else {
        Write-Host "エラー: 仮想環境が見つかりません" -ForegroundColor Red
        exit 1
    }
}

# Uvicorn起動
Write-Host "Uvicorn起動中..." -ForegroundColor Cyan
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
"@

$startScriptPath = Join-Path $projectDir "start-server.ps1"
$startScript | Out-File -FilePath $startScriptPath -Encoding UTF8
Write-Host "起動スクリプトを作成しました: $startScriptPath" -ForegroundColor Green

# 7. 現在の環境変数表示
Write-Host "`n7. 現在の環境変数:" -ForegroundColor Yellow
Write-Host "TFHUB_CACHE_DIR: $env:TFHUB_CACHE_DIR" -ForegroundColor Cyan
Write-Host "TF_CPP_MIN_LOG_LEVEL: $env:TF_CPP_MIN_LOG_LEVEL" -ForegroundColor Cyan
Write-Host "PYTHONPATH: $env:PYTHONPATH" -ForegroundColor Cyan
Write-Host "VIRTUAL_ENV: $env:VIRTUAL_ENV" -ForegroundColor Cyan

# 8. 推奨事項の表示
Write-Host "`n推奨事項:" -ForegroundColor Green
Write-Host "1. PowerShell を管理者権限で再起動してください" -ForegroundColor White
Write-Host "2. 仮想環境をアクティブにしてください: .venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "3. 環境変数を設定してください: .\setup-env.ps1" -ForegroundColor White
Write-Host "4. サーバーを起動してください: .\start-server.ps1" -ForegroundColor White
Write-Host "   または: uvicorn src.main:app --reload --host 0.0.0.0 --port 8000" -ForegroundColor White

Write-Host "`n修正完了!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green 