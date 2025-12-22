#!/bin/bash

# AjaxCMS Deploy Script
# Pulls latest changes and restarts the service

# Configuration
APP_NAME="ajaxcms"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}AjaxCMS Deploy Script${NC}"
echo "====================="
echo ""

# Change to script directory
cd "$SCRIPT_DIR" || exit 1

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}Warning: There are uncommitted changes in the working directory${NC}"
    git status --short
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborting deploy."
        exit 1
    fi
fi

# Pull latest changes
echo "Pulling latest changes from git..."
git pull
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: git pull failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Git pull successful${NC}"
echo ""

# Install dependencies if package.json changed
echo "Checking for dependency updates..."
npm install --production
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: npm install failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dependencies up to date${NC}"
echo ""

# Restart pm2 service
echo "Restarting service..."
if pm2 list 2>/dev/null | grep -q "$APP_NAME"; then
    pm2 restart $APP_NAME
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: pm2 restart failed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Service restarted${NC}"
else
    echo -e "${YELLOW}Warning: pm2 process '$APP_NAME' not found${NC}"
    echo "The service may not be running. Use start-ssl.sh to start it."
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Deploy complete!${NC}"
echo ""
echo "Check status with: pm2 status"
echo "View logs with:    pm2 logs $APP_NAME"
