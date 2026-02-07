#!/bin/bash
set -e

# Configuration
SERVER_IP="178.128.98.3"
USER="deploy"
APP_DIR="~/app"
LOCAL_DIR="$(pwd)"
REMOTE_HOST="$USER@$SERVER_IP"

echo "Deploying to $REMOTE_HOST..."

# 1. Archive files
echo "📦 Archiving local files..."
tar -czf splitrx-deploy.tar.gz --exclude=node_modules --exclude=.git --exclude=dist --exclude=.next --exclude=.env backend frontend nginx database docker-compose.prod.yml

# 2. Transfer archive
echo "🚀 Transferring archive to server..."
scp splitrx-deploy.tar.gz $REMOTE_HOST:~/

# 3. Execute remote commands
echo "🔧 Executing remote commands (Backup -> Clean -> Deploy -> Start)..."
ssh $REMOTE_HOST << 'EOF'
    set -e
    
    # Check if app dir exists and backup env
    if [ -d "app" ]; then
        echo "   Running backup..."
        if [ -f "app/.env" ]; then
            cp app/.env .env.bak
            chmod 600 .env.bak
            echo "   ✅ .env backed up."
        else
            echo "   ⚠️ No .env file found in existing deployment."
        fi
        
        echo "   🛑 Stopping containers..."
        docker stop $(docker ps -aq) 2>/dev/null || true
        
        echo "   🧹 Removing old files..."
        rm -rf app
    else
        echo "   ✨ No existing deployment found."
    fi

    # Setup new deployment
    echo "   📂 Creating directories..."
    mkdir -p app
    
    echo "   📦 Extracting files..."
    tar -xzf splitrx-deploy.tar.gz -C app
    
    # Restore env
    if [ -f ".env.bak" ]; then
        cp .env.bak app/.env
        echo "   ✅ .env restored."
    else
        echo "   ⚠️ No environment backup found. You may need to create app/.env manually."
    fi

    if [ -f "app/.env" ]; then
        chmod 600 app/.env
    fi

    # Start services
    echo "   🚀 Starting services..."
    cd app
    docker compose -f docker-compose.prod.yml up -d --build --remove-orphans
    
    echo "   🧹 Cleaning up..."
    cd ~
    rm splitrx-deploy.tar.gz
EOF

echo "✅ Deployment complete!"
echo "running containers:"
ssh $REMOTE_HOST "docker ps"
echo "🌐 Verify at https://splitrx.kvinda.qzz.io"


