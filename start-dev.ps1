#!/usr/bin/env pwsh
# Quick development server starter for Job Portal
# Supports both Windows PowerShell and PowerShell Core

Write-Host "🎯 Job Portal Quick Start" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# Function to check if a port is in use
function Test-PortInUse {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("127.0.0.1", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "📍 Working directory: $ScriptDir" -ForegroundColor Yellow

# Check if backend is already running
if (Test-PortInUse -Port 5000) {
    Write-Host "✅ Backend already running on port 5000" -ForegroundColor Green
} else {
    Write-Host "🚀 Starting Backend Server..." -ForegroundColor Cyan
    try {
        # Use PowerShell job to run backend in background
        $BackendJob = Start-Job -ScriptBlock {
            param($scriptDir)
            Set-Location $scriptDir
            python backend_server.py
        } -ArgumentList $ScriptDir
        
        Write-Host "⏳ Waiting for backend to start..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
        
        if (Test-PortInUse -Port 5000) {
            Write-Host "✅ Backend started successfully on http://localhost:5000" -ForegroundColor Green
        } else {
            Write-Host "❌ Backend failed to start" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Error starting backend: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Check if frontend is already running
if (Test-PortInUse -Port 3000) {
    Write-Host "✅ Frontend already running on port 3000" -ForegroundColor Green
} else {
    Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Cyan
    
    $FrontendDir = Join-Path $ScriptDir "job-portal-frontend"
    
    if (Test-Path $FrontendDir) {
        try {
            # Use PowerShell job to run frontend in background
            $FrontendJob = Start-Job -ScriptBlock {
                param($frontendDir)
                Set-Location $frontendDir
                
                # Check if node_modules exists, install if not
                if (-not (Test-Path "node_modules")) {
                    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
                    npm install
                }
                
                # Start development server
                npm run dev
            } -ArgumentList $FrontendDir
            
            Write-Host "⏳ Waiting for frontend to start..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
            
            if (Test-PortInUse -Port 3000) {
                Write-Host "✅ Frontend started successfully on http://localhost:3000" -ForegroundColor Green
            } else {
                Write-Host "❌ Frontend failed to start" -ForegroundColor Red
            }
        }
        catch {
            Write-Host "❌ Error starting frontend: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Frontend directory not found: $FrontendDir" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🌐 Application URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "   API Info: http://localhost:5000/api/info" -ForegroundColor White
Write-Host ""
Write-Host "💡 To stop servers, use: .\manage.ps1 stop" -ForegroundColor Yellow
Write-Host "💡 To check status, use: .\manage.ps1 status" -ForegroundColor Yellow
