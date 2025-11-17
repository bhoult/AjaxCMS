#!/bin/bash

# AjaxCMS SSL Server Startup Script
# This script starts the AjaxCMS server with SSL enabled on ports 80 and 443

# Configuration
MAINTAINER_EMAIL="your@email.com"  # Change this to your email address
APP_NAME="ajaxcms"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}AjaxCMS SSL Server Startup Script${NC}"
echo "===================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: This script must be run as root (ports 80 and 443 require root privileges)${NC}"
    echo "Please run: sudo ./start-ssl.sh"
    exit 1
fi

# Check if maintainer email is set
if [ "$MAINTAINER_EMAIL" = "your@email.com" ]; then
    echo -e "${YELLOW}Warning: Please edit this script and set MAINTAINER_EMAIL to your actual email address${NC}"
    echo "This email is required by Let's Encrypt for SSL certificates"
    exit 1
fi

# Stop existing instance if running
echo "Checking for existing instances..."
if pm2 list | grep -q "$APP_NAME"; then
    echo -e "${YELLOW}Stopping existing instance...${NC}"
    pm2 stop $APP_NAME
    pm2 delete $APP_NAME
fi

# Start the server with SSL
echo -e "${GREEN}Starting AjaxCMS server with SSL...${NC}"
ENABLE_SSL=true MAINTAINER_EMAIL=$MAINTAINER_EMAIL pm2 start server.js --name $APP_NAME

# Save pm2 configuration
echo "Saving pm2 configuration..."
pm2 save

# Setup pm2 to start on boot (only needs to be done once)
echo "Setting up pm2 to start on system boot..."
pm2 startup

echo ""
echo -e "${GREEN}✓ Server started successfully!${NC}"
echo ""
echo "The server is now listening on:"
echo "  - HTTP:  port 80 (redirects to HTTPS)"
echo "  - HTTPS: port 443"
echo ""
echo "SSL certificates will be automatically provisioned via Let's Encrypt"
echo "Maintainer email: $MAINTAINER_EMAIL"
echo ""
echo "Useful commands:"
echo "  pm2 status         - Check server status"
echo "  pm2 logs $APP_NAME - View server logs"
echo "  pm2 restart $APP_NAME - Restart server"
echo "  pm2 stop $APP_NAME - Stop server"
echo ""
