# Quick Start - Install SecretMe di Ubuntu 22 VPS (5 Menit)

## Method 1: Automatic Installation (Termudah - Recommended ⭐)

### 1. SSH ke VPS
```bash
ssh root@your_vps_ip
```

### 2. Download & Run Script
```bash
cd /tmp
wget https://raw.githubusercontent.com/yourusername/SecretMe-5n/main/install-secretme.sh
chmod +x install-secretme.sh
sudo bash install-secretme.sh
```

### 3. Follow Prompts
Script akan bertanya:
- GitHub repository URL
- Domain name
- Email untuk SSL

### 4. Edit Environment Variables
```bash
nano /var/www/SecretMe-5n/.env.local
```

Isi semua nilai yang diperlukan (database, API keys, etc)

### 5. Restart Aplikasi
```bash
pm2 restart secretme
```

### Done! ✓
Akses: `https://yourdomain.com`

---

## Method 2: Manual Installation (Jika script ada error)

```bash
# 1. Update sistem
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential python3 git

# 3. Install PM2
sudo npm install -g pm2

# 4. Clone repository
cd /var/www
sudo git clone https://github.com/yourusername/SecretMe-5n.git
cd SecretMe-5n
sudo chown -R $USER:$USER .

# 5. Setup environment
nano .env.local
# Copy-paste semua environment variables Anda

# 6. Install & Build
npm install
npm run build

# 7. Start dengan PM2
pm2 start npm --name "secretme" -- start
pm2 startup
pm2 save

# 8. Setup Nginx
sudo apt install -y nginx
# (copy nginx config ke /etc/nginx/sites-available/secretme)

# 9. Setup SSL
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com

# Done!
```

---

## Verifikasi Installation

```bash
# Check aplikasi running
pm2 list

# Check logs
pm2 logs secretme

# Check domain accessible
curl https://yourdomain.com

# Check database connection (di app logs)
pm2 logs secretme --lines 50
```

---

## Environment Variables Template

Save ke `.env.local`:

```env
# Database
POSTGRES_URL="postgresql://user:pass@host:5432/db"
POSTGRES_PRISMA_URL="postgresql://user:pass@host:5432/db"
POSTGRES_URL_NON_POOLING="postgresql://user:pass@host:5432/db"
POSTGRES_USER="username"
POSTGRES_PASSWORD="password"
POSTGRES_DATABASE="database_name"
POSTGRES_HOST="host.com"

# Supabase
SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="eyJ..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
SUPABASE_JWT_SECRET="xxx"

# App Config
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NODE_ENV="production"

# Payment (Tripay)
ACTIVE_PAYMENT_GATEWAY="tripay"
TRIPAY_MERCHANT_CODE="xxx"
TRIPAY_API_KEY="xxx"
TRIPAY_PRIVATE_KEY="xxx"
TRIPAY_USE_PRODUCTION="true"

# Notifications
FONNTE_API_KEY="xxx"
FONNTE_DEVICE_ID="xxx"
TELEGRAM_BOT_TOKEN="xxx"

# Email
RESEND_API_KEY="xxx"

# Cron
CRON_SECRET="xxx"
```

---

## Common Issues & Solutions

### Port 3000 sudah terpakai
```bash
sudo lsof -i :3000
sudo kill -9 PID
pm2 restart secretme
```

### Build gagal / Module error
```bash
cd /var/www/SecretMe-5n
rm -rf node_modules
npm cache clean --force
npm install
npm run build
pm2 restart secretme
```

### Database tidak connect
```bash
# Check .env.local
cat .env.local

# Test connection
psql -h host -U user -d database

# Check logs
pm2 logs secretme
```

### SSL error
```bash
# Renew certificate
sudo certbot renew --force-renewal -d yourdomain.com

# Restart nginx
sudo systemctl restart nginx
```

### Out of memory saat build
```bash
# Add 4GB swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Retry build
npm run build
```

---

## Monitoring Commands

```bash
# Status
pm2 status
pm2 list

# Real-time monitor
pm2 monit

# Logs
pm2 logs secretme
pm2 logs secretme --lines 100

# Restart
pm2 restart secretme
pm2 stop secretme
pm2 delete secretme

# Nginx
sudo systemctl restart nginx
sudo systemctl status nginx
```

---

## Update Aplikasi

```bash
cd /var/www/SecretMe-5n

# Pull latest code
git pull origin main

# Reinstall dependencies (if package.json changed)
npm install

# Rebuild
npm run build

# Restart
pm2 restart secretme
```

---

## Security Quick Setup

```bash
# Firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Check SSL
sudo certbot certificates

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Troubleshooting

### Aplikasi tidak accessible
1. Check PM2: `pm2 logs secretme`
2. Check Nginx: `sudo tail -f /var/log/nginx/error.log`
3. Check firewall: `sudo ufw status`
4. Check DNS: `nslookup yourdomain.com`

### Database connection error
1. Verify .env.local credentials
2. Test: `psql -h $host -U $user -d $db`
3. Check logs: `pm2 logs secretme`

### Slow loading
1. Check disk space: `df -h`
2. Check memory: `free -h`
3. Check nginx: `ps aux | grep nginx`
4. Restart: `pm2 restart secretme`

---

## Where to Find Help

- Logs: `pm2 logs secretme`
- Nginx error: `sudo tail -f /var/log/nginx/error.log`
- System: `systemctl status service_name`
- Documentation: `/var/www/SecretMe-5n/PANDUAN-INSTALL-VPS-UBUNTU22.md`

---

## Next Steps

1. ✓ Verify aplikasi berjalan: `https://yourdomain.com`
2. ✓ Setup backup database
3. ✓ Configure monitoring alerts
4. ✓ Setup automated deployment
5. ✓ Monitor logs regularly

**Selamat! Installation selesai! 🚀**
