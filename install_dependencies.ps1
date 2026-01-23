<#
Installs backend (Python) and frontend (Node) dependencies.
Run from the project root, e.g.:
  powershell -ExecutionPolicy Bypass -File .\install_dependencies.ps1
#>

param ()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "==> Installing dependencies for Black-Scholes Calculator" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

#
# Backend (Python)
#
Write-Host "`n[1/2] Installing backend (Python) dependencies..." -ForegroundColor Yellow

if (-not (Test-Path "backend\requirements.txt")) {
    Write-Error "backend\requirements.txt not found. Are you in the project root?"
    exit 1
}

try {
    $pythonVersion = python --version 2>&1
    Write-Host "Using Python: $pythonVersion" -ForegroundColor Gray

    $versionMatch = $pythonVersion -match "Python (\d+)\.(\d+)"
    if ($versionMatch) {
        $major = [int]$matches[1]
        $minor = [int]$matches[2]
        if ($major -eq 3 -and $minor -ge 14) {
            Write-Host "Warning: Python 3.14+ may not have wheels for scipy; Python 3.11/3.12 is recommended." -ForegroundColor Yellow
        }
    }
} catch {
    Write-Error "Python not found. Ensure 'python' is on PATH."
    exit 1
}

Write-Host "Upgrading pip/setuptools/wheel..." -ForegroundColor Gray
python -m pip install --upgrade pip setuptools wheel --quiet

Write-Host "Installing backend packages (this may take a few minutes)..." -ForegroundColor Gray
try {
    python -m pip install --prefer-binary -r "backend\requirements.txt"
    Write-Host "Backend dependencies installed." -ForegroundColor Green
} catch {
    Write-Host "Standard install failed, retrying scipy from wheels only..." -ForegroundColor Yellow
    try {
        python -m pip install scipy --only-binary :all: --quiet
        $requirements = Get-Content "backend\requirements.txt" | Where-Object { $_ -notmatch "^scipy" }
        $tempFile = [System.IO.Path]::GetTempFileName()
        $requirements | Set-Content $tempFile
        python -m pip install --prefer-binary -r $tempFile
        Remove-Item $tempFile
        Write-Host "Backend dependencies installed (with scipy wheel fallback)." -ForegroundColor Green
    } catch {
        Write-Error "Failed to install backend dependencies. Consider using Python 3.11 and installing scipy with --only-binary :all:."
        exit 1
    }
}

#
# Frontend (Node)
#
Write-Host "`n[2/2] Installing frontend (Node) dependencies..." -ForegroundColor Yellow

if (-not (Test-Path "frontend\package.json")) {
    Write-Error "frontend\package.json not found. Are you in the project root?"
    exit 1
}

Set-Location "frontend"
npm install
Set-Location $ScriptDir

Write-Host "`nAll dependencies installed successfully." -ForegroundColor Green

