@echo off
REM Fly.io Quick Setup Script for Astraee Discord Bot (Windows)

echo ✦ Astraee Discord Bot - Fly.io Setup Script ✦
echo ==============================================

REM Check if fly CLI is installed
fly version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Fly.io CLI is not installed!
    echo Please install it first:
    echo Run in PowerShell: iwr https://fly.io/install.ps1 -useb ^| iex
    pause
    exit /b 1
)

echo ✅ Fly.io CLI is installed

REM Check if user is logged in
fly auth whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Not logged in to Fly.io
    echo Please run: fly auth login
    pause
    exit /b 1
)

echo ✅ Logged in to Fly.io

REM Check if fly.toml exists
if not exist "fly.toml" (
    echo ❌ fly.toml not found!
    echo Please run: fly launch --no-deploy
    pause
    exit /b 1
)

echo ✅ fly.toml found

REM Check if Dockerfile exists
if not exist "Dockerfile" (
    echo ❌ Dockerfile not found!
    echo Please create Dockerfile first
    pause
    exit /b 1
)

echo ✅ Dockerfile found

REM Get environment variables
echo.
echo 🔧 Setting up environment variables...
set /p DISCORD_TOKEN="DISCORD_TOKEN: "
set /p DATABASE_URL="DATABASE_URL: "

REM Set secrets
echo Setting secrets...
fly secrets set DISCORD_TOKEN=%DISCORD_TOKEN%
fly secrets set DATABASE_URL=%DATABASE_URL%
fly secrets set NODE_ENV=production
fly secrets set PORT=3000

echo ✅ Environment variables set

REM Deploy
echo.
echo 🚀 Deploying to Fly.io...
fly deploy

REM Check deployment status
echo.
echo 📊 Checking deployment status...
fly status

echo.
echo 🎉 Setup complete!
echo Your bot should be running at: https://astraee-discord-bot.fly.dev
echo.
echo Next steps:
echo 1. Run 'fly ssh console' to access your app
echo 2. Run 'npm run db:setup' to set up the database
echo 3. Test your bot in Discord!
echo.
echo Useful commands:
echo - fly logs          # View logs
echo - fly status        # Check status
echo - fly dashboard     # Open web dashboard
echo - fly ssh console   # Access shell
echo.
pause
