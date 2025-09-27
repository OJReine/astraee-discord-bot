@echo off
REM Astraee Bot Setup Script for Windows
REM This script helps automate the initial setup process

echo ✦ Astraee Bot Setup Script ✦
echo ================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo Visit: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js found
node --version

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ npm found
npm --version

REM Install dependencies
echo.
echo 📦 Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Check if .env file exists
if not exist ".env" (
    echo.
    echo ⚠️  .env file not found
    echo 📝 Creating .env file from template...
    
    if exist "env.example" (
        copy env.example .env >nul
        echo ✅ .env file created from template
        echo.
        echo 🔧 Please edit .env file with your actual values:
        echo    - DISCORD_TOKEN: Your Discord bot token
        echo    - DATABASE_URL: Your PostgreSQL connection string
        echo.
        echo After editing .env, run: npm run db:push
    ) else (
        echo ❌ env.example file not found
        pause
        exit /b 1
    )
) else (
    echo ✅ .env file found
)

echo.
echo 📋 Next Steps:
echo 1. Edit .env file with your actual Discord token and database URL
echo 2. Run: npm run db:push (to create database tables)
echo 3. Run: npm start (to start the bot)
echo.
echo 📖 For detailed instructions, see SETUP_GUIDE.md
echo.
echo ✦ Setup script completed! ✦
pause

