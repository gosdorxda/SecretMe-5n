# Panduan Lengkap Install SecretMe di VPS Ubuntu 22

## Table of Contents
1. [Persiapan Awal](#persiapan-awal)
2. [Step 1: Setup Server](#step-1-setup-server)
3. [Step 2: Install Dependencies](#step-2-install-dependencies)
4. [Step 3: Clone Repository](#step-3-clone-repository)
5. [Step 4: Setup Environment](#step-4-setup-environment)
6. [Step 5: Build & Start](#step-5-build--start)
7. [Step 6: Setup Nginx](#step-6-setup-nginx)
8. [Step 7: Setup SSL](#step-7-setup-ssl)
9. [Troubleshooting](#troubleshooting)
10. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Persiapan Awal

### Yang Anda Butuhkan:
- VPS Ubuntu 22.04 LTS (minimal 2GB RAM, 2 Core)
- Domain name (untuk SSL)
- Database Supabase atau PostgreSQL
- SSH client (PuTTY, Terminal, etc)
- API keys & environment variables

### Info VPS Anda:
```
IP Address: ________________
Username: ________________
Password: ________________
Domain: ________________
```

---

## STEP 1: Setup Server

### 1.1 Koneksi ke VPS
```bash
ssh root@your_vps_ip
# atau
ssh username@your_vps_ip
```

### 1.2 Update Sistem
```bash
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y
```

Output yang diharapkan:
```
Reading package lists... Done
Processing triggers for man-db (2.10.2-1) ... Done
```

### 1.3 Set Timezone
```bash
sudo timedatectl set-timezone Asia/Jakarta
timedatectl
```

---

## STEP 2: Install Dependencies

### 2.1 Install Node.js 20 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verifikasi:
```bash
node --version
npm --version
```

Output:
```
v20.x.x
10.x.x
```

### 2.2 Install Build Tools
```bash
sudo apt install -y build-essential python3 git curl wget
```

### 2.3 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
pm2 --version
```

Output:
```
5.3.x
```

### 2.4 Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

Verifikasi:
```bash
sudo systemctl status nginx
```

---

## STEP 3: Clone Repository

### 3.1 Buat Direktori Project
```bash
sudo mkdir -p /var/www
cd /var/www
```

### 3.2 Clone Repository
```bash
sudo git clone https://github.com/yourusername/SecretMe-5n.git
cd SecretMe-5n
```

### 3.3 Set Permissions
```bash
sudo chown -R $USER:$USER /var/www/SecretMe-5n
chmod -R 755 /var/www/SecretMe-5n
```

Verifikasi:
```bash
ls -la
# Seharusnya melihat package.json, app/, components/, etc
```

---

## STEP 4: Setup Environment

### 4.1 Buat File .env.local
```bash
nano .env.local
```

### 4.2 Copy-Paste Environment Variables
```
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
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NODE_ENV="production"

# Payment Gateway (pilih salah satu)
ACTIVE_PAYMENT_GATEWAY="tripay"
TRIPAY_MERCHANT_CODE="your_merchant"
TRIPAY_API_KEY="your_key"
TRIPAY_PRIVATE_KEY="your_private_key"
TRIPAY_USE_PRODUCTION="true"

# SMS/Notifikasi
FONNTE_API_KEY="your_key"
FONNTE_DEVICE_ID="your_device"
TELEGRAM_BOT_TOKEN="your_token"

# API Keys
RESEND_API_KEY="your_key"
CRON_SECRET="your_secret"
```

Tekan: `Ctrl + X`, `Y`, `Enter` untuk save

### 4.3 Verifikasi File
```bash
cat .env.local
```

---

## STEP 5: Build & Start

### 5.1 Install Dependencies
```bash
npm install
```

Wait for completion... (3-5 minutes)

### 5.2 Build Project
```bash
npm run build
```

Expected output:
```
> secretme@1.0.0 build
> next build

  ✓ Created optimize bundle
  ✓ Compiled successfully
```

### 5.3 Test Start Lokal
```bash
npm start
```

Output:
```
> secretme@1.0.0 start
> next start

  ▲ Next.js 15.x
  - ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

Tekan `Ctrl + C` untuk stop

### 5.4 Setup dengan PM2
```bash
pm2 start npm --name "secretme" -- start
pm2 startup
pm2 save
```

Verifikasi:
```bash
pm2 list
pm2 logs secretme
```

---

## STEP 6: Setup Nginx

### 6.1 Buat Nginx Config
```bash
sudo nano /etc/nginx/sites-available/secretme
```

### 6.2 Copy-Paste Config
```nginx
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
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/javascript application/json;
}
```

Tekan: `Ctrl + X`, `Y`, `Enter` untuk save

### 6.3 Enable Config
```bash
sudo ln -s /etc/nginx/sites-available/secretme /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
```

### 6.4 Test Nginx
```bash
sudo nginx -t
```

Output:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 6.5 Restart Nginx
```bash
sudo systemctl restart nginx
sudo systemctl status nginx
```

---

## STEP 7: Setup SSL

### 7.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 7.2 Generate SSL Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Ikuti instruksi:
1. Enter email: `your_email@example.com`
2. Agree to Terms: `y`
3. Share email: `n`

### 7.3 Verifikasi SSL
```bash
sudo certbot certificates
```

Output:
```
Certificate Name: yourdomain.com
  Serial Number: 0x...
  Key Type: EC
  Domains: yourdomain.com, www.yourdomain.com
  Expiry Date: 2025-05-...
```

### 7.4 Auto Renewal
```bash
sudo certbot renew --dry-run
```

---

## Troubleshooting

### Error: Port 3000 sudah terpakai
```bash
# Cari proses yang menggunakan port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 PID

# Atau ubah port di PM2
pm2 delete secretme
PORT=3001 pm2 start npm --name "secretme" -- start
```

### Error: Module not found
```bash
cd /var/www/SecretMe-5n
rm -rf node_modules
npm cache clean --force
npm install
npm run build
pm2 restart secretme
```

### Error: ENOSPC (disk space)
```bash
# Check disk space
df -h

# Check inode
df -i

# Increase file watchers
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Error: Out of Memory saat build
```bash
# Add swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify
free -h
```

### Nginx tidak me-redirect ke HTTPS
```bash
sudo certbot --nginx --force-renewal -d yourdomain.com
sudo systemctl restart nginx
```

### Aplikasi tidak bisa connect ke database
```bash
# Test connection
psql -h your_host -U your_user -d your_db

# Check .env.local
cat .env.local

# Check logs
pm2 logs secretme
```

---

## Monitoring & Maintenance

### Daily Commands
```bash
# Check status aplikasi
pm2 status

# Monitor real-time
pm2 monit

# View logs
pm2 logs secretme

# Check nginx
sudo systemctl status nginx

# Check disk
df -h

# Check memory
free -h
```

### Weekly Tasks
```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Check certificate expiry
sudo certbot certificates

# Backup .env.local
cp /var/www/SecretMe-5n/.env.local /backup/.env.local.bak
```

### Monthly Tasks
```bash
# Clean npm cache
npm cache clean --force

# Update dependencies
npm update

# Rebuild
npm run build

# Restart aplikasi
pm2 restart secretme
```

### Backup Database
```bash
# Backup PostgreSQL
pg_dump -h your_host -U your_user your_db > backup_$(date +%Y%m%d).sql

# Backup file
tar -czf secretme_backup_$(date +%Y%m%d).tar.gz /var/www/SecretMe-5n/.env.local
```

---

## Useful Commands Reference

```bash
# Check status
pm2 list
pm2 status
pm2 describe secretme

# Restart/Stop/Delete
pm2 restart secretme
pm2 stop secretme
pm2 delete secretme

# View logs
pm2 logs secretme
pm2 logs secretme --lines 100
pm2 flush

# Nginx
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl status nginx

# Certbot
sudo certbot renew
sudo certbot certificates
sudo certbot delete --cert-name yourdomain.com

# Git pull (update)
cd /var/www/SecretMe-5n
git pull origin main
npm install
npm run build
pm2 restart secretme
```

---

## Security Best Practices

### 1. Setup Firewall
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

### 2. Create Non-Root User
```bash
sudo useradd -m -s /bin/bash secretme_user
sudo usermod -aG sudo secretme_user
sudo passwd secretme_user
```

### 3. Setup SSH Key
```bash
ssh-keygen -t ed25519
ssh-copy-id -i ~/.ssh/id_ed25519.pub secretme_user@your_vps_ip
```

### 4. Disable Root Login
```bash
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart ssh
```

---

## Checklist Sebelum Production

- [ ] Node.js 20.x installed
- [ ] PM2 setup dan auto-restart
- [ ] Nginx configured
- [ ] SSL certificate valid
- [ ] .env.local configured
- [ ] Database connected
- [ ] Build success tanpa error
- [ ] Aplikasi berjalan di port 3000
- [ ] Nginx reverse proxy working
- [ ] HTTPS accessible
- [ ] Firewall configured
- [ ] Backup system ready
- [ ] Monitoring setup
- [ ] Email/notification working
- [ ] Payment gateway tested

---

## Support & Debugging

Jika ada error, share:
```bash
pm2 logs secretme
sudo tail -f /var/log/nginx/error.log
cat .env.local | grep -v "PASSWORD\|KEY\|SECRET"
```

Good luck! 🚀
