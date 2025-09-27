#!/bin/bash

# Astraee Bot Setup Script
# This script helps automate the initial setup process

echo "✦ Astraee Bot Setup Script ✦"
echo "================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm found: $(npm --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo ""
    echo "⚠️  .env file not found"
    echo "📝 Creating .env file from template..."
    
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "✅ .env file created from template"
        echo ""
        echo "🔧 Please edit .env file with your actual values:"
        echo "   - DISCORD_TOKEN: Your Discord bot token"
        echo "   - DATABASE_URL: Your PostgreSQL connection string"
        echo ""
        echo "After editing .env, run: npm run db:push"
    else
        echo "❌ env.example file not found"
        exit 1
    fi
else
    echo "✅ .env file found"
fi

# Check if environment variables are set
echo ""
echo "🔍 Checking environment variables..."

if [ -f ".env" ]; then
    source .env
    
    if [ -z "$DISCORD_TOKEN" ] || [ "$DISCORD_TOKEN" = "your_discord_bot_token_here" ]; then
        echo "⚠️  DISCORD_TOKEN not set in .env file"
    else
        echo "✅ DISCORD_TOKEN is set"
    fi
    
    if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" = "your_postgresql_connection_string_here" ]; then
        echo "⚠️  DATABASE_URL not set in .env file"
    else
        echo "✅ DATABASE_URL is set"
    fi
fi

echo ""
echo "📋 Next Steps:"
echo "1. Edit .env file with your actual Discord token and database URL"
echo "2. Run: npm run db:push (to create database tables)"
echo "3. Run: npm start (to start the bot)"
echo ""
echo "📖 For detailed instructions, see SETUP_GUIDE.md"
echo ""
echo "✦ Setup script completed! ✦"

