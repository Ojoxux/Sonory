# Sonory Python Audio Analyzer - Windows環境セットアップスクリプト
# 使用方法: .\setup-windows.ps1

param(
    [switch]$StartServer = $false,
    [switch]$CheckHealth = $false
)

Write-Host "Sonory Python Audio Analyzer - Windows環境セットアップ" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# 1. 環境変数の設定（日本語パス問題を解決）
Write-Host "`n1. 環境変数を設定中..." -ForegroundColor Yellow
$env:TFHUB_CACHE_DIR = "$(Get-Location)\tf_hub_cache"
$env:TF_CPP_MIN_LOG_LEVEL = "1"
$env:PYTHONPATH = "$(Get-Location)\src"

# 2. キャッシュディレクトリを作成
Write-Host "2. キャッシュディレクトリを作成中..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "tf_hub_cache" -Force | Out-Null

# 3. 仮想環境の確認
Write-Host "3. 仮想環境を確認中..." -ForegroundColor Yellow
if ($env:VIRTUAL_ENV) {
    Write-Host "   ✓ 仮想環境がアクティブです: $env:VIRTUAL_ENV" -ForegroundColor Green
} else {
    Write-Host "   ⚠ 仮想環境がアクティブではありません" -ForegroundColor Yellow
    Write-Host "   実行してください: .venv\Scripts\activate" -ForegroundColor Cyan
}

# 4. 設定完了の表示
Write-Host "`n✅ 環境変数設定完了:" -ForegroundColor Green
Write-Host "   TFHUB_CACHE_DIR: $env:TFHUB_CACHE_DIR" -ForegroundColor Cyan
Write-Host "   TF_CPP_MIN_LOG_LEVEL: $env:TF_CPP_MIN_LOG_LEVEL" -ForegroundColor Cyan
Write-Host "   PYTHONPATH: $env:PYTHONPATH" -ForegroundColor Cyan

# 5. サーバー起動（オプション）
if ($StartServer) {
    Write-Host "`n5. サーバーを起動中..." -ForegroundColor Yellow
    uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
} else {
    Write-Host "`n次のステップ:" -ForegroundColor Yellow
    Write-Host "   サーバー起動: uvicorn src.main:app --reload --host 0.0.0.0 --port 8000" -ForegroundColor Cyan
    Write-Host "   または      : .\setup-windows.ps1 -StartServer" -ForegroundColor Cyan
}

# 6. ヘルスチェック（オプション）
if ($CheckHealth) {
    Write-Host "`n6. ヘルスチェック中..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 5
        Write-Host "   ✓ サーバーは正常に動作しています" -ForegroundColor Green
    }
    catch {
        Write-Host "   ⚠ サーバーが起動していません" -ForegroundColor Yellow
        Write-Host "   サーバーを先に起動してください" -ForegroundColor Cyan
    }
}

Write-Host "`n🎉 セットアップ完了！" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green 