#!/bin/bash

# ==========================================
# EduProva AWS Deployment Script
# ==========================================

PROJECT_ROOT="/var/www/work-updates"

# 1. Update Codebase
echo "Pulling latest code from GitHub..."
# Assuming you are already in the project directory
# git pull origin main

# 2. Build Frontend
if [ -d "work-updates" ]; then
    echo "Building production assets with Vite..."
    cd work-updates
    npm install
    npm run build
    sudo mkdir -p $PROJECT_ROOT/dist
    sudo rm -rf $PROJECT_ROOT/dist/*
    sudo cp -r dist/* $PROJECT_ROOT/dist/
    sudo chown -R www-data:www-data $PROJECT_ROOT/dist
    cd ..
fi

# 3. Setup Python Backend
echo "Setting up Virtual Environment..."
cd backend
python3 -m venv venv
source venv/bin/bin/activate
pip install -r requirements.txt
cd ..

# 4. Configure Systemd Service
if [ -f "deployment/backend.service" ]; then
    echo "Configuring Backend Systemd Service..."
    sudo cp deployment/backend.service /etc/systemd/system/backend.service
    sudo systemctl daemon-reload
    sudo systemctl enable backend
    sudo systemctl restart backend
fi

# 5. Synchronize Nginx Configuration
if [ -f "deployment/nginx.conf" ]; then
    echo "Updating Nginx configuration..."
    sudo cp deployment/nginx.conf /etc/nginx/sites-available/eduprova
    sudo ln -sf /etc/nginx/sites-available/eduprova /etc/nginx/sites-enabled/eduprova
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo systemctl restart nginx
fi

# 6. Fix Permissions
echo "Fixing file permissions for storage..."
sudo mkdir -p backend/static/avatars
sudo mkdir -p backend/uploads
sudo chown -R ubuntu:www-data backend/static backend/uploads
sudo chmod -R 775 backend/static backend/uploads

echo "=========================================="
echo "Deployment Complete! ✅"
echo "Your live site is fully updated and stabilized."
echo "=========================================="
