#!/bin/bash
set -e

# Configuration
SERVER_IP="178.128.98.3"
USER="deploy"
REMOTE_HOST="$USER@$SERVER_IP"
LOCAL_ENV=".env.production"
REMOTE_ENV="~/app/.env"

if [ ! -f "$LOCAL_ENV" ]; then
    echo "❌ Error: $LOCAL_ENV not found!"
    exit 1
fi

echo "🔐 Syncing environment to $REMOTE_HOST..."
echo "   (You will be prompted for the SSH password once)"

# Use a single SSH connection to write the file and run commands
cat "$LOCAL_ENV" | ssh "$REMOTE_HOST" "
    set -e
    
    # 1. Write the .env file from stdin
    echo '   📦 Receiving .env file...'
    cat > ~/app/.env
    
    # 2. Secure permissions
    echo '   🛡️ Securing permissions...'
    chmod 600 ~/app/.env
    
    # 3. Recreate container to pick up new env vars
    echo '   🔄 Recreating backend container...'
    cd ~/app
    # ensure we are using up -d to apply env changes, force-recreate guarantees it
    docker compose -f docker-compose.prod.yml up -d --force-recreate backend
"

echo "✅ Environment variables synced and backend updated!"
