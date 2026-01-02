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
ssh ajaxcms.org "cd AjaxCMS && git pull"
echo "Deployment complete."
