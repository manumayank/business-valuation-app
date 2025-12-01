@echo off
REM Business Valuation App - Docker Start Script for Windows

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║   Business Valuation & Improvement App - Docker Launcher    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not in PATH
    echo.
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed
    echo.
    echo Please install Docker Compose from: https://docs.docker.com/compose/install/
    echo.
    pause
    exit /b 1
)

echo ✅ Docker is installed
echo ✅ Docker Compose is installed
echo.

REM Check if Docker daemon is running
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker daemon is not running
    echo.
    echo Please start Docker Desktop
    echo.
    pause
    exit /b 1
)

echo ✅ Docker daemon is running
echo.

echo 🔨 Building and starting services...
echo.

REM Start Docker Compose
docker-compose up --build

pause
