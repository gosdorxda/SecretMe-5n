#!/bin/bash

###############################################
# SecretMe Installation Script for Ubuntu 22
# Usage: bash install-secretme.sh
###############################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Script must be run as root (use: sudo bash install-secretme.sh)"
    exit 1
fi

# Start installation
print_header "SecretMe Installation for Ubuntu 22"

# Get user info
read -p "Enter your GitHub repository URL: " GITHUB_URL
read -p "Enter your domain name: " DOMAIN
read -p "Enter your email for SSL: " EMAIL

print_info "Configuration:"
print_info "Repository: $GITHUB_URL"
print_info "Domain: $DOMAIN"
print_info "Email: $EMAIL"
echo ""

# Step 1: Update System
print_header "Step 1: Update System"
apt update
apt upgrade -y
apt autoremove -y
print_success "System updated"

# Step 2: Install Node.js
print_header "Step 2: Install Node.js 20 LTS"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
print_success "Node.js installed: $(node --version)"

# Step 3: Install Dependencies
print_header "Step 3: Install Dependencies"
apt install -y build-essential python3 git curl wget nginx certbot python3-certbot-nginx
print_success "Dependencies installed"

# Step 4: Install PM2
print_header "Step 4: Install PM2"
npm install -g pm2
pm2 startup
print_success "PM2 installed"

# Step 5: Create Project Directory
print_header "Step 5: Setup Project Directory"
mkdir -p /var/www
cd /var/www
print_success "Directory created"

# Step 6: Clone Repository
print_header "Step 6: Clone Repository"
if [ -d "SecretMe-5n" ]; then
    print_warning "Directory already exists, updating..."
    cd SecretMe-5n
    git pull origin main
else
    git clone $GITHUB_URL SecretMe-5n
    cd SecretMe-5n
fi
chown -R $(logname):$(logname) /var/www/SecretMe-5n
chmod -R 755 /var/www/SecretMe-5n
print_success "Repository cloned/updated"

# Step 7: Create Environment File
print_header "Step 7: Create Environment File"
if [ ! -f ".env.local" ]; then
    cat > .env.local << 'EOF'
# Database
POSTGRES_URL="postgresql://user:password@host:5432/database"
POSTGRES_PRISMA_URL="postgresql://user:password@host:5432/database"
POSTGRES_URL_NON_POOLING="postgresql://user:password@host:5432/database"
POSTGRES_USER="your_username"
POSTGRES_PASSWORD="your_password"
POSTGRES_DATABASE="your_db"
POSTGRES_HOST="your_host"

# Supabase
SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
SUPABASE_ANON_KEY="your_anon_key"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_key"
SUPABASE_JWT_SECRET="your_jwt_secret"

# App
NEXT_PUBLIC_APP_URL="https://your_domain_here"
NODE_ENV="production"

# Payment Gateway
ACTIVE_PAYMENT_GATEWAY="tripay"
TRIPAY_MERCHANT_CODE="your_merchant"
TRIPAY_API_KEY="your_key"
TRIPAY_PRIVATE_KEY="your_private_key"
TRIPAY_USE_PRODUCTION="true"

# Notifications
FONNTE_API_KEY="your_key"
FONNTE_DEVICE_ID="your_device"
TELEGRAM_BOT_TOKEN="your_token"

# API Keys
RESEND_API_KEY="your_key"
CRON_SECRET="your_secret"
EOF
    print_warning "Created .env.local - PLEASE EDIT AND ADD YOUR VALUES!"
    print_warning "Command: nano /var/www/SecretMe-5n/.env.local"
else
    print_success ".env.local already exists"
fi

# Step 8: Install Dependencies
print_header "Step 8: Install NPM Dependencies"
print_warning "This may take 3-5 minutes..."
rm -rf node_modules 2>/dev/null || true
npm cache clean --force
npm install
print_success "Dependencies installed"

# Step 9: Build Project
print_header "Step 9: Build Next.js Project"
npm run build
print_success "Project built successfully"

# Step 10: Setup PM2
print_header "Step 10: Setup PM2"
pm2 delete secretme 2>/dev/null || true
pm2 start npm --name "secretme" -- start
pm2 startup
pm2 save
print_success "PM2 configured"

# Step 11: Setup Nginx
print_header "Step 11: Setup Nginx"
cat > /etc/nginx/sites-available/secretme << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    gzip on;
    gzip_types text/plain text/css text/javascript application/javascript application/json;
}
EOF

ln -sf /etc/nginx/sites-available/secretme /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
print_success "Nginx configured"

# Step 12: Setup Firewall
print_header "Step 12: Setup Firewall"
ufw allow 22/tcp 2>/dev/null || true
ufw allow 80/tcp 2>/dev/null || true
ufw allow 443/tcp 2>/dev/null || true
ufw enable -y 2>/dev/null || true
print_success "Firewall configured"

# Step 13: Setup SSL
print_header "Step 13: Setup SSL Certificate"
print_warning "Setting up SSL for $DOMAIN..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL --redirect
print_success "SSL certificate installed"

# Final Status
print_header "Installation Complete!"
echo ""
print_success "SecretMe has been installed successfully"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your database credentials:"
echo "   ${BLUE}nano /var/www/SecretMe-5n/.env.local${NC}"
echo ""
echo "2. Restart the application:"
echo "   ${BLUE}pm2 restart secretme${NC}"
echo ""
echo "3. Access your application:"
echo "   ${BLUE}https://$DOMAIN${NC}"
echo ""
echo "Useful commands:"
echo "   ${BLUE}pm2 list${NC} - Check application status"
echo "   ${BLUE}pm2 logs secretme${NC} - View application logs"
echo "   ${BLUE}pm2 restart secretme${NC} - Restart application"
echo "   ${BLUE}sudo systemctl restart nginx${NC} - Restart Nginx"
echo ""
print_info "For more commands, check: /var/www/SecretMe-5n/PANDUAN-INSTALL-VPS-UBUNTU22.md"
