#!/bin/bash

# Cloudflare DNS Manager Bot Startup Script

echo "🤖 Starting Cloudflare DNS Manager Bot..."

# Check if BOT_TOKEN is set
if [ -z "$BOT_TOKEN" ]; then
    echo "❌ Error: BOT_TOKEN environment variable is not set!"
    echo "Please set your bot token:"
    echo "export BOT_TOKEN='your_bot_token_here'"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the bot
echo "🚀 Starting bot..."
npm start