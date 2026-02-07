#!/bin/bash
echo "Fixing server environment variables..."

# 32-byte hex string (64 chars) from local .env or generated
KEY="0000000000000000000000000000000000000000000000000000000000000000"

ssh deploy@178.128.98.3 "
    cd app
    if ! grep -q 'ENCRYPTION_MASTER_KEY' .env; then
        echo 'Adding ENCRYPTION_MASTER_KEY...'
        echo '' >> .env
        echo 'ENCRYPTION_MASTER_KEY=$KEY' >> .env
    else
        echo 'ENCRYPTION_MASTER_KEY already exists.'
    fi
    
    echo 'Restarting backend...'
    docker compose -f docker-compose.prod.yml restart backend
"
