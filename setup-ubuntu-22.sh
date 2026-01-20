#!/bin/bash

# ============================================================
# SecretMe - Fresh Install Setup Script untuk Ubuntu 22 VPS
# ============================================================
# Usage: chmod +x setup-ubuntu-22.sh && ./setup-ubuntu-22.sh

set -e

echo "🚀 Starting SecretMe Fresh Install Setup for Ubuntu 22..."
echo ""

# ============================================================
# 1. SYSTEM UPDATE
# ============================================================
echo "📦 Step 1: Updating system packages..."
sudo apt update && sudo apt upgrade -y
sudo apt autoremove -y
echo "✅ System updated"
echo ""

# ============================================================
# 2. INSTALL NODEJS & NPM
# ============================================================
echo "📦 Step 2: Installing Node.js 20 LTS..."
# Remove old nodejs if exists
sudo apt remove nodejs npm -y 2>/dev/null || true

# Install from NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "✅ Node.js and npm installed"
echo ""

# ============================================================
# 3. INSTALL BUILD TOOLS & DEPENDENCIES
# ============================================================
echo "📦 Step 3: Installing build tools and dependencies..."
sudo apt install -y build-essential python3 git curl wget

# Install PM2 globally
sudo npm install -g pm2

echo "✅ Build tools installed"
echo ""

# ============================================================
# 4. CLONE REPOSITORY
# ============================================================
echo "📦 Step 4: Cloning SecretMe repository..."
cd /var/www

# Check if directory exists
if [ -d "SecretMe-5n" ]; then
  echo "Directory SecretMe-5n already exists. Removing..."
  sudo rm -rf SecretMe-5n
fi

# Clone repository
sudo git clone https://github.com/yourusername/SecretMe-5n.git
cd SecretMe-5n
sudo chown -R $USER:$USER .

echo "✅ Repository cloned"
echo ""

# ============================================================
# 5. SETUP NODEJS PROJECT
# ============================================================
echo "📦 Step 5: Setting up Node.js project..."

# Clean old dependencies
rm -rf node_modules package-lock.json 2>/dev/null || true
npm cache clean --force

# Install dependencies
echo "Installing npm packages (this may take a few minutes)..."
npm install

echo "✅ Dependencies installed"
echo ""

# ============================================================
# 6. CREATE ENVIRONMENT FILE
# ============================================================
echo "📦 Step 6: Creating environment file..."

if [ ! -f .env.local ]; then
  cat > .env.local << 'EOF'
# Database
POSTGRES_URL=your_postgres_url_here
POSTGRES_PRISMA_URL=your_postgres_prisma_url_here
POSTGRES_URL_NON_POOLING=your_postgres_url_non_pooling_here
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_HOST=your_db_host
POSTGRES_DATABASE=your_db_name

# Supabase
SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback

# Payment Gateway
ACTIVE_PAYMENT_GATEWAY=tripay
NEXT_PUBLIC_ACTIVE_PAYMENT_GATEWAY=tripay

# Tripay
TRIPAY_MERCHANT_CODE=your_tripay_merchant_code
TRIPAY_API_KEY=your_tripay_api_key
TRIPAY_PRIVATE_KEY=your_tripay_private_key
TRIPAY_USE_PRODUCTION=false

# Duitku
DUITKU_MERCHANT_CODE=your_duitku_merchant_code
DUITKU_API_KEY=your_duitku_api_key
DUITKU_USE_PRODUCTION=false

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id
PAYPAL_USE_PRODUCTION=false

# Notification Services
FONNTE_API_KEY=your_fonnte_api_key
FONNTE_DEVICE_ID=your_fonnte_device_id

TELEGRAM_BOT_TOKEN=your_telegram_bot_token

RESEND_API_KEY=your_resend_api_key

# Premium Configuration
NEXT_PUBLIC_PREMIUM_PRICE=99000
NEXT_PUBLIC_PREMIUM_DURATION_DAYS=30
NEXT_PUBLIC_PREMIUM_VOUCHER_CODE=SECRETME2025

# Security
CRON_SECRET=your_cron_secret_here
NEXT_PUBLIC_CRON_SECRET=your_cron_secret_here
COOKIE_DOMAIN=yourdomain.com

# Other Settings
FORCE_PRODUCTION_URLS=false
EOF

  echo "✅ .env.local created. IMPORTANT: Edit this file with your actual values!"
  echo "   nano .env.local"
else
  echo "⚠️  .env.local already exists, skipping creation"
fi
echo ""

# ============================================================
# 7. BUILD PROJECT
# ============================================================
echo "📦 Step 7: Building Next.js project..."
npm run build

echo "✅ Project built successfully"
echo ""

# ============================================================
# 8. SETUP PM2
# ============================================================
echo "📦 Step 8: Setting up PM2..."

pm2 start npm --name "secretme" -- start
pm2 startup
pm2 save

echo "✅ PM2 configured"
echo ""

# ============================================================
# 9. SETUP NGINX
# ============================================================
echo "📦 Step 9: Setting up Nginx..."
sudo apt install -y nginx

# Create nginx config
sudo tee /etc/nginx/sites-available/secretme > /dev/null << 'EOF'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable nginx config
sudo ln -sf /etc/nginx/sites-available/secretme /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "✅ Nginx configured"
echo ""

# ============================================================
# 10. SETUP SSL WITH CERTBOT
# ============================================================
echo "📦 Step 10: Setting up SSL certificate..."
sudo apt install -y certbot python3-certbot-nginx

echo "⚠️  IMPORTANT: Update your domain in /etc/nginx/sites-available/secretme first!"
echo "   Then run: sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com"
echo ""

# ============================================================
# 11. SETUP FIREWALL
# ============================================================
echo "📦 Step 11: Setting up firewall..."
sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable -y

echo "✅ Firewall configured"
echo ""

# ============================================================
# FINAL SUMMARY
# ============================================================
echo "========================================================"
echo "✅ Fresh Install Completed Successfully!"
echo "========================================================"
echo ""
echo "📝 NEXT STEPS:"
echo ""
echo "1. Edit environment file with your actual values:"
echo "   nano /var/www/SecretMe-5n/.env.local"
echo ""
echo "2. Update Nginx config with your domain:"
echo "   sudo nano /etc/nginx/sites-available/secretme"
echo ""
echo "3. Setup SSL certificate:"
echo "   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com"
echo ""
echo "4. Restart services:"
echo "   pm2 restart secretme"
echo "   sudo systemctl restart nginx"
echo ""
echo "5. Check application status:"
echo "   pm2 status"
echo "   pm2 logs secretme"
echo ""
echo "6. Access your application:"
echo "   http://yourdomain.com"
echo ""
echo "========================================================"
echo "🎉 Setup Complete!"
echo "========================================================"
