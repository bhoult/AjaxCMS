#!/bin/bash
# Remote deployment script for AjaxCMS
# Commits and pushes local changes, then deploys to ajaxcms.org

set -e

# Check for local changes and commit/push if any
if [ -n "$(git status --porcelain)" ]; then
    echo "Local changes detected, committing..."
    git add -A
    git commit -m "Deploy updates"
    git push
    echo "Local changes pushed."
else
    echo "No local changes to commit."
fi

echo "Deploying to ajaxcms.org..."
# Run deploy.sh on the server so it pulls AND restarts the service.
# A restart is required for greenlock to discover newly added site domains
# and provision their Let's Encrypt certificates; a bare "git pull" leaves
# new sites unreachable over HTTPS until the next manual restart.
# -t allocates a tty so the restart can prompt for sudo (server runs as root).
ssh -t ajaxcms.org "cd AjaxCMS && ./deploy.sh"
echo "Deployment complete."
