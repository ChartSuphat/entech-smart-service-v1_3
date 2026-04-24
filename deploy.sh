#!/bin/bash
# deploy.sh — run this on the SERVER to deploy a new version
# Usage: bash deploy.sh
#
# Before running: make sure code is pushed to GitHub (origin/main)

set -e

APP_DIR=~/entech-smart-service-v1_3
BACKUP_DIR=~/backups

echo "===== ENTECH SMART DEPLOY ====="
date

# 1. Backup database
echo ""
echo "[1/4] Backing up database..."
mkdir -p "$BACKUP_DIR"
docker exec postgres pg_dump -U postgres entechSmart_db > "$BACKUP_DIR/pre_deploy_$(date +%Y-%m-%d_%H%M).sql"
echo "  Backup saved to $BACKUP_DIR"
ls -lh "$BACKUP_DIR" | tail -3

# 2. Pull latest code
echo ""
echo "[2/4] Pulling latest code from GitHub..."
cd "$APP_DIR"
git pull origin main

# 3. Run migrations (safe — skips already-applied ones)
echo ""
echo "[3/4] Running DB migrations..."
docker exec entechsmart_backend npx prisma migrate deploy
echo "  Migrations done"

# 4. Rebuild and restart containers
echo ""
echo "[4/4] Rebuilding and restarting containers..."
docker compose build --no-cache
docker compose up -d

echo ""
echo "===== DEPLOY COMPLETE ====="
docker ps --format "table {{.Names}}\t{{.Status}}" | grep entech
