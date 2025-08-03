#!/usr/bin/env pwsh
# Frontend starter script with proper PowerShell syntax

Write-Host "🎨 Starting Job Portal Frontend..." -ForegroundColor Cyan

# Get the correct paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$FrontendDir = $ScriptDir

Write-Host "📍 Frontend directory: $FrontendDir" -ForegroundColor Yellow

# Change to frontend directory
try {
    Set-Location $FrontendDir
    Write-Host "✅ Changed to frontend directory" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to change directory: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Check if package.json exists
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found in current directory!" -ForegroundColor Red
    Write-Host "Current location: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    try {
        npm install
        Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to install dependencies: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Start the development server
Write-Host "🚀 Starting Next.js development server..." -ForegroundColor Cyan
Write-Host "📝 Running: npm run dev" -ForegroundColor Yellow

try {
    # Use Invoke-Expression instead of problematic operators
    npm run dev
}
catch {
    Write-Host "❌ Failed to start development server: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
