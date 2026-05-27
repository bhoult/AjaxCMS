#!/bin/bash

# AjaxCMS Development Server Startup Script
# This script starts the AjaxCMS server in development mode on port 3000 (HTTP only)

set -euo pipefail

# Configuration
PORT=3000
APP_NAME="ajaxcms-dev"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}AjaxCMS Development Server Startup Script${NC}"
echo "=========================================="
echo ""

# Preflight: pm2 must be installed
if ! command -v pm2 >/dev/null 2>&1; then
    echo -e "${RED}Error: pm2 is not installed or not on PATH${NC}" >&2
    echo "Install it with: sudo npm install -g pm2" >&2
    exit 1
fi

# Stop existing instance if running
echo "Checking for existing instances..."
if pm2 list | grep -q "$APP_NAME"; then
    echo -e "${YELLOW}Stopping existing instance...${NC}"
    pm2 stop $APP_NAME
    pm2 delete $APP_NAME
fi

# Start the server in development mode
echo -e "${GREEN}Starting AjaxCMS server in development mode...${NC}"
PORT=$PORT pm2 start server.js --name $APP_NAME

# Save pm2 configuration
echo "Saving pm2 configuration..."
pm2 save

# Verify the process is actually online
sleep 1
STATUS=$(pm2 jlist 2>/dev/null | node -e "
  let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{
    try{const p=JSON.parse(d).find(x=>x.name==='$APP_NAME');
      console.log(p?p.pm2_env.status:'missing');}catch(e){console.log('parse-error');}
  });" 2>/dev/null || echo "unknown")

if [ "$STATUS" != "online" ]; then
    echo -e "${RED}Error: pm2 process '$APP_NAME' is not online (status: $STATUS)${NC}" >&2
    echo "Check logs with: pm2 logs $APP_NAME" >&2
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Server started successfully!${NC}"
echo ""
echo "The server is now listening on:"
echo "  - HTTP: http://localhost:$PORT"
echo ""
echo "Development mode (no SSL)"
echo ""
echo "Useful commands:"
echo "  pm2 status            - Check server status"
echo "  pm2 logs $APP_NAME    - View server logs"
echo "  pm2 restart $APP_NAME - Restart server"
echo "  pm2 stop $APP_NAME    - Stop server"
echo ""
