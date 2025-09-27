#!/bin/bash
# Fly.io Quick Setup Script for Astraee Discord Bot

echo "✦ Astraee Discord Bot - Fly.io Setup Script ✦"
echo "=============================================="

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Fly.io CLI is not installed!"
    echo "Please install it first:"
    echo "Windows: iwr https://fly.io/install.ps1 -useb | iex"
    echo "macOS/Linux: curl -L https://fly.io/install.sh | sh"
    exit 1
fi

echo "✅ Fly.io CLI is installed"

# Check if user is logged in
if ! fly auth whoami &> /dev/null; then
    echo "❌ Not logged in to Fly.io"
    echo "Please run: fly auth login"
    exit 1
fi

echo "✅ Logged in to Fly.io"

# Check if fly.toml exists
if [ ! -f "fly.toml" ]; then
    echo "❌ fly.toml not found!"
    echo "Please run: fly launch --no-deploy"
    exit 1
fi

echo "✅ fly.toml found"

# Check if Dockerfile exists
if [ ! -f "Dockerfile" ]; then
    echo "❌ Dockerfile not found!"
    echo "Please create Dockerfile first"
    exit 1
fi

echo "✅ Dockerfile found"

# Check environment variables
echo ""
echo "🔧 Setting up environment variables..."
echo "Please provide your Discord bot token:"
read -p "DISCORD_TOKEN: " DISCORD_TOKEN

echo "Please provide your database URL:"
read -p "DATABASE_URL: " DATABASE_URL

# Set secrets
echo "Setting secrets..."
fly secrets set DISCORD_TOKEN="$DISCORD_TOKEN"
fly secrets set DATABASE_URL="$DATABASE_URL"
fly secrets set NODE_ENV="production"
fly secrets set PORT="3000"

echo "✅ Environment variables set"

# Deploy
echo ""
echo "🚀 Deploying to Fly.io..."
fly deploy

# Check deployment status
echo ""
echo "📊 Checking deployment status..."
fly status

echo ""
echo "🎉 Setup complete!"
echo "Your bot should be running at: https://astraee-discord-bot.fly.dev"
echo ""
echo "Next steps:"
echo "1. Run 'fly ssh console' to access your app"
echo "2. Run 'npm run db:setup' to set up the database"
echo "3. Test your bot in Discord!"
echo ""
echo "Useful commands:"
echo "- fly logs          # View logs"
echo "- fly status        # Check status"
echo "- fly dashboard     # Open web dashboard"
echo "- fly ssh console   # Access shell"
