#!/bin/bash
set -e

echo "=== NimeCore Backend Deployment Script ==="

echo "Updating system..."
sudo apt update && sudo apt upgrade -y

echo "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

echo "Installing required packages..."
sudo apt install -y nginx postgresql postgresql-contrib redis-server ufw fail2ban

echo "Installing PM2..."
sudo npm install -g pm2

echo "Setting up firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 2222/tcp
sudo ufw allow 5000/tcp
sudo ufw allow 8000/tcp
sudo ufw enable

echo "Setting up PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE nimecore;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER nimecore_user WITH PASSWORD 'strongpassword';" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE nimecore TO nimecore_user;" 2>/dev/null || true

echo "Enabling services..."
sudo systemctl enable nginx postgresql redis-server
sudo systemctl start nginx postgresql redis-server

echo "Installing backend dependencies..."
cd /var/www/nimecore-backend || (mkdir -p /var/www/nimecore-backend && cd /var/www/nimecore-backend)
npm install

echo "Running migrations..."
npm run migrate

echo "Starting PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "Setting up Nginx..."
sudo cp nginx-nimecore-api /etc/nginx/sites-available/nimecore-api
sudo ln -sf /etc/nginx/sites-available/nimecore-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

echo "=== Backend deployment complete ==="
echo "Test with: curl http://103.59.160.54:5000/health"
