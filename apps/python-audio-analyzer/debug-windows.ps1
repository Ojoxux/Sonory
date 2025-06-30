# Sonory Python Audio Analyzer - Windows Debug Script
# Run this script to diagnose common Windows environment issues

Write-Host "=== Sonory Python Audio Analyzer Debug ===" -ForegroundColor Green
Write-Host ""

# System Information
Write-Host "=== System Information ===" -ForegroundColor Yellow
Write-Host "OS:" (Get-WmiObject -Class Win32_OperatingSystem).Caption
Write-Host "PowerShell Version:" $PSVersionTable.PSVersion
Write-Host "Current Directory:" (Get-Location)
Write-Host ""

# Python Environment Check
Write-Host "=== Python Environment ===" -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Python Version:" $pythonVersion
} catch {
    Write-Host "Python not found in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.11+ and add to PATH"
    exit 1
}

try {
    $pipVersion = pip --version 2>&1
    Write-Host "Pip Version:" $pipVersion
} catch {
    Write-Host "Pip not found" -ForegroundColor Red
}

# Virtual Environment Check
Write-Host ""
Write-Host "=== Virtual Environment ===" -ForegroundColor Yellow
if ($env:VIRTUAL_ENV) {
    Write-Host "Virtual Environment Active:" $env:VIRTUAL_ENV -ForegroundColor Green
} else {
    Write-Host "Virtual Environment NOT Active" -ForegroundColor Red
    Write-Host "Please run: .venv\Scripts\activate"
}

# Dependencies Check
Write-Host ""
Write-Host "=== Dependencies Check ===" -ForegroundColor Yellow

$dependencies = @(
    @{name="tensorflow"; import="tensorflow as tf"; check="tf.__version__"},
    @{name="librosa"; import="librosa"; check="'OK'"},
    @{name="numpy"; import="numpy as np"; check="np.__version__"},
    @{name="fastapi"; import="fastapi"; check="fastapi.__version__"},
    @{name="uvicorn"; import="uvicorn"; check="uvicorn.__version__"},
    @{name="httpx"; import="httpx"; check="httpx.__version__"},
    @{name="structlog"; import="structlog"; check="'OK'"}
)

foreach ($dep in $dependencies) {
    try {
        $result = python -c "
try:
    import $($dep.import)
    print($($dep.check))
except ImportError as e:
    print('ImportError: ' + str(e))
except Exception as e:
    print('Error: ' + str(e))
" 2>&1
        
        if ($result -match "ImportError|Error") {
            Write-Host "$($dep.name): FAILED - $result" -ForegroundColor Red
        } else {
            Write-Host "$($dep.name): OK - $result" -ForegroundColor Green
        }
    } catch {
        Write-Host "$($dep.name): FAILED - Cannot execute Python" -ForegroundColor Red
    }
}

# FFmpeg Check
Write-Host ""
Write-Host "=== FFmpeg Check ===" -ForegroundColor Yellow
try {
    $ffmpegVersion = ffmpeg -version 2>&1 | Select-String "version"
    Write-Host "FFmpeg: OK - $($ffmpegVersion.Line)" -ForegroundColor Green
} catch {
    Write-Host "FFmpeg: NOT FOUND" -ForegroundColor Red
    Write-Host "Install with: choco install ffmpeg"
    Write-Host "Or download from: https://ffmpeg.org/download.html"
}

# Port Check
Write-Host ""
Write-Host "=== Port 8000 Check ===" -ForegroundColor Yellow
$portCheck = netstat -ano | Select-String ":8000"
if ($portCheck) {
    Write-Host "Port 8000 is in use:" -ForegroundColor Yellow
    $portCheck | ForEach-Object { Write-Host $_.Line }
} else {
    Write-Host "Port 8000 is available" -ForegroundColor Green
}

# Environment Variables
Write-Host ""
Write-Host "=== Environment Variables ===" -ForegroundColor Yellow
$envVars = @(
    "PYTHON_AUDIO_ANALYZER_URL",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_KEY",
    "LOG_LEVEL",
    "ENVIRONMENT"
)

foreach ($envVar in $envVars) {
    $value = [System.Environment]::GetEnvironmentVariable($envVar)
    if ($value) {
        if ($envVar -match "KEY|URL") {
            Write-Host "$envVar: SET (hidden for security)" -ForegroundColor Green
        } else {
            Write-Host "$envVar: $value" -ForegroundColor Green
        }
    } else {
        Write-Host "$envVar: NOT SET" -ForegroundColor Yellow
    }
}

# Service Test
Write-Host ""
Write-Host "=== Service Startup Test ===" -ForegroundColor Yellow
try {
    $testResult = python -c "
try:
    from src.main import create_app
    app = create_app()
    print('App creation: SUCCESS')
except ImportError as e:
    print('Import Error: ' + str(e))
except Exception as e:
    print('Creation Error: ' + str(e))
" 2>&1
    
    if ($testResult -match "SUCCESS") {
        Write-Host "Service startup test: PASSED" -ForegroundColor Green
    } else {
        Write-Host "Service startup test: FAILED - $testResult" -ForegroundColor Red
    }
} catch {
    Write-Host "Service startup test: FAILED - Cannot execute test" -ForegroundColor Red
}

# Recommendations
Write-Host ""
Write-Host "=== Recommendations ===" -ForegroundColor Green
Write-Host "1. Ensure virtual environment is activated: .venv\Scripts\activate"
Write-Host "2. Install dependencies: pip install -e ."
Write-Host "3. Install FFmpeg if missing"
Write-Host "4. Check environment variables in .env file"
Write-Host "5. Consider using WSL2 for better Linux compatibility"
Write-Host ""
Write-Host "=== Debug Complete ===" -ForegroundColor Green 