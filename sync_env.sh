#!/bin/bash
set -e

# Configuration
SERVER_IP="178.128.98.3"
USER="deploy"
REMOTE_HOST="$USER@$SERVER_IP"
LOCAL_ENV="backend/.env"
REMOTE_ENV="~/app/.env"

if [ ! -f "$LOCAL_ENV" ]; then
    echo "❌ Error: $LOCAL_ENV not found!"
    exit 1
fi

echo "🔐 Uploading .env to $REMOTE_HOST..."
scp "$LOCAL_ENV" "$REMOTE_HOST:$REMOTE_ENV"

echo "🛡️ Securing .env file..."
ssh "$REMOTE_HOST" "chmod 600 $REMOTE_ENV"

echo "🔄 Restarting backend service..."
ssh "$REMOTE_HOST" "cd ~/app && docker compose -f docker-compose.prod.yml restart backend"

echo "✅ Environment variables synced and secured!"
