#!/bin/bash
set -e

echo "=== NimeCore Worker Deployment Script ==="

echo "Installing dependencies..."
npm install

echo "Starting PM2..."
pm2 start worker.js --name nimecore-worker -i 2
pm2 save

echo "Setting up Nginx..."
sudo cp ../backend/nginx-worker /etc/nginx/sites-available/worker
sudo ln -sf /etc/nginx/sites-available/worker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

echo "=== Worker deployment complete ==="
echo "Test with: curl http://103.59.160.54:8000/health"
