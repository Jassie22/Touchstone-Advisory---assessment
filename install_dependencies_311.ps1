<#
.SYNOPSIS
Installs backend and frontend dependencies using Python 3.11 (for local use).

.DESCRIPTION
This script is meant for your local setup only and can be deleted before
pushing/sharing the repo. It explicitly uses `py -3.11` so everything
installs against Python 3.11 instead of whatever `python` points to.

Run from the project root:
  powershell -ExecutionPolicy Bypass -File .\install_dependencies_311.ps1
#>

param ()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "==> Installing dependencies for Black-Scholes Calculator (Python 3.11)" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# --- Backend (Python 3.11 via launcher) ---
Write-Host "`n[1/2] Installing backend (Python 3.11) dependencies..." -ForegroundColor Yellow

if (-not (Test-Path "backend\requirements.txt")) {
    Write-Error "backend\requirements.txt not found. Are you in the project root?"
    exit 1
}

try {
    $py311Version = & py -3.11 --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "py -3.11 failed"
    }
    Write-Host "Using: $py311Version" -ForegroundColor Gray
} catch {
    Write-Error "Could not run 'py -3.11'. Make sure Python 3.11 is installed and the launcher is available."
    Write-Host "Test with: py -3.11 --version" -ForegroundColor Yellow
    exit 1
}

Write-Host "Upgrading pip/setuptools/wheel for Python 3.11..." -ForegroundColor Gray
py -3.11 -m pip install --upgrade pip setuptools wheel --quiet

Write-Host "Installing backend packages (this may take a few minutes)..." -ForegroundColor Gray
py -3.11 -m pip install --prefer-binary -r "backend\requirements.txt"

Write-Host "Backend dependencies installed with Python 3.11." -ForegroundColor Green

# --- Frontend (Node) ---
Write-Host "`n[2/2] Installing frontend (Node) dependencies..." -ForegroundColor Yellow

if (-not (Test-Path "frontend\package.json")) {
    Write-Error "frontend\package.json not found. Are you in the project root?"
    exit 1
}

Set-Location "frontend"
npm install
Set-Location $ScriptDir

Write-Host "`nAll dependencies installed successfully (backend: Python 3.11)." -ForegroundColor Green

