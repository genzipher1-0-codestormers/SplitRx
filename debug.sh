#!/bin/bash
echo "🔍 Checking backend status..."
ssh deploy@178.128.98.3 << 'EOF'
    echo "=== Container Status ==="
    docker ps -a | grep splitrx
    
    echo ""
    echo "=== Backend Logs (last 50 lines) ==="
    docker logs splitrx_backend --tail 50
    
    echo ""
    echo "=== Environment File Check ==="
    ls -la ~/app/.env
    head -5 ~/app/.env
EOF
