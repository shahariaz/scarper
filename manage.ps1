# Job Portal Management Script
# PowerShell script for managing the job portal application

param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "status", "setup", "backend", "frontend", "test", "help")]
    [string]$Command = "help",
    
    [switch]$Development = $false,
    [switch]$Production = $false,
    [switch]$Force = $false
)

# Colors for output
$ErrorColor = "Red"
$SuccessColor = "Green"
$InfoColor = "Cyan"
$WarningColor = "Yellow"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Test-ProcessRunning {
    param([string]$ProcessName)
    return (Get-Process -Name $ProcessName -ErrorAction SilentlyContinue) -ne $null
}

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

function Start-Backend {
    Write-ColorOutput "🚀 Starting Backend Server..." $InfoColor
    
    if (Test-PortInUse -Port 5000) {
        Write-ColorOutput "⚠️  Port 5000 is already in use!" $WarningColor
        if (-not $Force) {
            $response = Read-Host "Continue anyway? (y/N)"
            if ($response -ne "y" -and $response -ne "Y") {
                Write-ColorOutput "❌ Backend startup cancelled." $ErrorColor
                return
            }
        }
    }
    
    try {
        Push-Location $PSScriptRoot
        
        # Check if Python is available
        $pythonCmd = Get-Command python -ErrorAction SilentlyContinue
        if (-not $pythonCmd) {
            Write-ColorOutput "❌ Python not found in PATH!" $ErrorColor
            Write-ColorOutput "Please install Python or add it to your PATH." $ErrorColor
            return
        }
        
        Write-ColorOutput "Starting Python backend server..." $InfoColor
        Start-Process -FilePath "python" -ArgumentList "backend_server.py" -NoNewWindow
        
        # Wait a moment and check if the server started
        Start-Sleep -Seconds 3
        if (Test-PortInUse -Port 5000) {
            Write-ColorOutput "✅ Backend server started successfully on http://localhost:5000" $SuccessColor
        } else {
            Write-ColorOutput "❌ Backend server failed to start!" $ErrorColor
        }
    }
    catch {
        Write-ColorOutput "❌ Error starting backend: $($_.Exception.Message)" $ErrorColor
    }
    finally {
        Pop-Location
    }
}

function Start-Frontend {
    Write-ColorOutput "🎨 Starting Frontend Server..." $InfoColor
    
    if (Test-PortInUse -Port 3000) {
        Write-ColorOutput "⚠️  Port 3000 is already in use!" $WarningColor
        if (-not $Force) {
            $response = Read-Host "Continue anyway? (y/N)"
            if ($response -ne "y" -and $response -ne "Y") {
                Write-ColorOutput "❌ Frontend startup cancelled." $ErrorColor
                return
            }
        }
    }
    
    $frontendPath = Join-Path $PSScriptRoot "job-portal-frontend"
    
    if (-not (Test-Path $frontendPath)) {
        Write-ColorOutput "❌ Frontend directory not found: $frontendPath" $ErrorColor
        return
    }
    
    try {
        Push-Location $frontendPath
        
        # Check if npm is available
        $npmCmd = Get-Command npm -ErrorAction SilentlyContinue
        if (-not $npmCmd) {
            Write-ColorOutput "❌ npm not found in PATH!" $ErrorColor
            Write-ColorOutput "Please install Node.js and npm." $ErrorColor
            return
        }
        
        # Check if node_modules exists
        if (-not (Test-Path "node_modules")) {
            Write-ColorOutput "📦 Installing dependencies..." $InfoColor
            npm install
        }
        
        Write-ColorOutput "Starting Next.js development server..." $InfoColor
        Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow
        
        # Wait a moment and check if the server started
        Start-Sleep -Seconds 5
        if (Test-PortInUse -Port 3000) {
            Write-ColorOutput "✅ Frontend server started successfully on http://localhost:3000" $SuccessColor
        } else {
            Write-ColorOutput "❌ Frontend server failed to start!" $ErrorColor
        }
    }
    catch {
        Write-ColorOutput "❌ Error starting frontend: $($_.Exception.Message)" $ErrorColor
    }
    finally {
        Pop-Location
    }
}

function Stop-Servers {
    Write-ColorOutput "🛑 Stopping servers..." $InfoColor
    
    # Stop processes on specific ports
    $processes = @()
    
    # Find processes using port 5000 (backend)
    $backend = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    if ($backend) {
        $processes += $backend
        Write-ColorOutput "Found backend process on port 5000: PID $backend" $InfoColor
    }
    
    # Find processes using port 3000 (frontend)
    $frontend = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    if ($frontend) {
        $processes += $frontend
        Write-ColorOutput "Found frontend process on port 3000: PID $frontend" $InfoColor
    }
    
    # Stop the processes
    foreach ($pid in $processes) {
        try {
            Stop-Process -Id $pid -Force
            Write-ColorOutput "✅ Stopped process PID: $pid" $SuccessColor
        }
        catch {
            Write-ColorOutput "❌ Failed to stop process PID: $pid - $($_.Exception.Message)" $ErrorColor
        }
    }
    
    if ($processes.Count -eq 0) {
        Write-ColorOutput "ℹ️  No running servers found." $InfoColor
    }
}

function Get-ServerStatus {
    Write-ColorOutput "📊 Server Status:" $InfoColor
    Write-ColorOutput "==================" $InfoColor
    
    # Check backend
    if (Test-PortInUse -Port 5000) {
        Write-ColorOutput "✅ Backend (Port 5000): RUNNING" $SuccessColor
    } else {
        Write-ColorOutput "❌ Backend (Port 5000): STOPPED" $ErrorColor
    }
    
    # Check frontend
    if (Test-PortInUse -Port 3000) {
        Write-ColorOutput "✅ Frontend (Port 3000): RUNNING" $SuccessColor
    } else {
        Write-ColorOutput "❌ Frontend (Port 3000): STOPPED" $ErrorColor
    }
    
    Write-ColorOutput "" $InfoColor
    Write-ColorOutput "🌐 URLs:" $InfoColor
    Write-ColorOutput "Frontend: http://localhost:3000" $InfoColor
    Write-ColorOutput "Backend:  http://localhost:5000" $InfoColor
    Write-ColorOutput "API Docs: http://localhost:5000/api/info" $InfoColor
}

function Install-Dependencies {
    Write-ColorOutput "📦 Installing Dependencies..." $InfoColor
    
    # Backend dependencies
    Write-ColorOutput "Installing Python dependencies..." $InfoColor
    try {
        Push-Location $PSScriptRoot
        
        if (Test-Path "requirements.txt") {
            pip install -r requirements.txt
            Write-ColorOutput "✅ Python dependencies installed" $SuccessColor
        } else {
            Write-ColorOutput "⚠️  requirements.txt not found" $WarningColor
        }
    }
    catch {
        Write-ColorOutput "❌ Error installing Python dependencies: $($_.Exception.Message)" $ErrorColor
    }
    finally {
        Pop-Location
    }
    
    # Frontend dependencies
    Write-ColorOutput "Installing Node.js dependencies..." $InfoColor
    try {
        $frontendPath = Join-Path $PSScriptRoot "job-portal-frontend"
        Push-Location $frontendPath
        
        if (Test-Path "package.json") {
            npm install
            Write-ColorOutput "✅ Node.js dependencies installed" $SuccessColor
        } else {
            Write-ColorOutput "⚠️  package.json not found" $WarningColor
        }
    }
    catch {
        Write-ColorOutput "❌ Error installing Node.js dependencies: $($_.Exception.Message)" $ErrorColor
    }
    finally {
        Pop-Location
    }
}

function Test-Application {
    Write-ColorOutput "🧪 Testing Application..." $InfoColor
    
    # Test backend API
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET -TimeoutSec 10
        if ($response.success) {
            Write-ColorOutput "✅ Backend API: HEALTHY" $SuccessColor
        } else {
            Write-ColorOutput "❌ Backend API: UNHEALTHY" $ErrorColor
        }
    }
    catch {
        Write-ColorOutput "❌ Backend API: NOT RESPONDING" $ErrorColor
    }
    
    # Test frontend
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "✅ Frontend: ACCESSIBLE" $SuccessColor
        } else {
            Write-ColorOutput "❌ Frontend: NOT ACCESSIBLE" $ErrorColor
        }
    }
    catch {
        Write-ColorOutput "❌ Frontend: NOT RESPONDING" $ErrorColor
    }
}

function Show-Help {
    Write-ColorOutput "🔧 Job Portal Management Script" $InfoColor
    Write-ColorOutput "================================" $InfoColor
    Write-ColorOutput ""
    Write-ColorOutput "Usage: .\manage.ps1 [command] [options]" $InfoColor
    Write-ColorOutput ""
    Write-ColorOutput "Commands:" $InfoColor
    Write-ColorOutput "  start      Start both backend and frontend servers" $InfoColor
    Write-ColorOutput "  stop       Stop all running servers" $InfoColor
    Write-ColorOutput "  restart    Restart all servers" $InfoColor
    Write-ColorOutput "  status     Show server status" $InfoColor
    Write-ColorOutput "  backend    Start only the backend server" $InfoColor
    Write-ColorOutput "  frontend   Start only the frontend server" $InfoColor
    Write-ColorOutput "  setup      Install all dependencies" $InfoColor
    Write-ColorOutput "  test       Test application health" $InfoColor
    Write-ColorOutput "  help       Show this help message" $InfoColor
    Write-ColorOutput ""
    Write-ColorOutput "Options:" $InfoColor
    Write-ColorOutput "  -Force     Force operation without confirmation" $InfoColor
    Write-ColorOutput ""
    Write-ColorOutput "Examples:" $InfoColor
    Write-ColorOutput "  .\manage.ps1 start" $InfoColor
    Write-ColorOutput "  .\manage.ps1 backend" $InfoColor
    Write-ColorOutput "  .\manage.ps1 stop -Force" $InfoColor
    Write-ColorOutput "  .\manage.ps1 status" $InfoColor
}

# Main script logic
Write-ColorOutput "🎯 Job Portal Management Script" $InfoColor
Write-ColorOutput "===============================" $InfoColor

switch ($Command.ToLower()) {
    "start" {
        Write-ColorOutput "🚀 Starting all servers..." $InfoColor
        Start-Backend
        Start-Sleep -Seconds 2
        Start-Frontend
    }
    "stop" {
        Stop-Servers
    }
    "restart" {
        Write-ColorOutput "🔄 Restarting all servers..." $InfoColor
        Stop-Servers
        Start-Sleep -Seconds 3
        Start-Backend
        Start-Sleep -Seconds 2
        Start-Frontend
    }
    "status" {
        Get-ServerStatus
    }
    "backend" {
        Start-Backend
    }
    "frontend" {
        Start-Frontend
    }
    "setup" {
        Install-Dependencies
    }
    "test" {
        Test-Application
    }
    "help" {
        Show-Help
    }
    default {
        Write-ColorOutput "❌ Unknown command: $Command" $ErrorColor
        Write-ColorOutput "Use '.\manage.ps1 help' for available commands." $InfoColor
    }
}

Write-ColorOutput ""
Write-ColorOutput "✨ Script completed!" $InfoColor
