# SecretMe - Fresh Install Setup untuk Ubuntu 22 VPS

Panduan lengkap untuk setup fresh installation SecretMe di Ubuntu 22 VPS.

---

## 📋 Pre-requisites

- VPS dengan Ubuntu 22.04 LTS
- Root atau sudo access
- Domain (optional untuk development, required untuk production)
- Database yang sudah siap (Supabase atau PostgreSQL)
- SSH access ke VPS

---

## 🚀 Cara 1: Automatic Setup (Rekomendasi)

### Step 1: Download & Run Setup Script

```bash
# SSH ke VPS Anda
ssh root@your_vps_ip

# Navigate ke home directory
cd ~

# Download setup script
wget https://raw.githubusercontent.com/yourusername/SecretMe-5n/main/setup-ubuntu-22.sh

# Atau jika pakai curl
curl -O https://raw.githubusercontent.com/yourusername/SecretMe-5n/main/setup-ubuntu-22.sh

# Make script executable
chmod +x setup-ubuntu-22.sh

# Run setup script
./setup-ubuntu-22.sh
```

### Step 2: Configure Environment Variables

```bash
nano /var/www/SecretMe-5n/.env.local
```

Edit dengan nilai yang sesuai:
- Database credentials
- Supabase URL & keys
- Payment gateway credentials
- API keys (Telegram, Resend, etc)
- Domain Anda

### Step 3: Update Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/secretme
```

Ganti `yourdomain.com` dengan domain Anda

### Step 4: Setup SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Step 5: Restart Services

```bash
pm2 restart secretme
sudo systemctl restart nginx
```

---

## 🛠️ Cara 2: Manual Setup (Untuk troubleshooting)

### 1. System Update

```bash
sudo apt update && sudo apt upgrade -y
sudo apt autoremove -y
```

### 2. Install Node.js 20 LTS

```bash
# Remove old nodejs (if exists)
sudo apt remove nodejs npm -y 2>/dev/null || true

# Install Node.js 20 from NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should be v20.x.x
npm --version   # Should be 10.x.x
```

### 3. Install Build Tools

```bash
sudo apt install -y build-essential python3 git curl wget
sudo npm install -g pm2
```

### 4. Clone Repository

```bash
cd /var/www
sudo git clone https://github.com/yourusername/SecretMe-5n.git
cd SecretMe-5n
sudo chown -R $USER:$USER .
```

### 5. Setup Node Project

```bash
# Clean old dependencies
rm -rf node_modules package-lock.json
npm cache clean --force

# Install dependencies
npm install

# If error dengan peer dependencies
npm install --legacy-peer-deps
```

### 6. Create Environment File

```bash
cp .env.example .env.local
nano .env.local
```

Isi dengan nilai Anda:
```env
POSTGRES_URL=postgresql://user:password@host:5432/dbname
SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
# ... env vars lainnya
```

### 7. Build Project

```bash
npm run build

# If error, try:
rm -rf .next
npm run build
```

### 8. Test Run Aplikasi

```bash
npm start

# Di browser atau terminal lain
curl http://localhost:3000
```

Jika berhasil, ctrl+c untuk stop.

### 9. Setup PM2

```bash
pm2 start npm --name "secretme" -- start
pm2 startup
pm2 save

# Verify
pm2 status
pm2 logs secretme
```

### 10. Setup Nginx

```bash
sudo apt install -y nginx

# Create configuration
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

# Enable config
sudo ln -sf /etc/nginx/sites-available/secretme /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test & restart
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 11. Setup SSL with Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 12. Setup Firewall

```bash
sudo apt install -y ufw

sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable -y

# Verify
sudo ufw status
```

---

## ✅ Verification Checklist

- [ ] SSH access ke VPS
- [ ] Node.js 20.x installed (`node --version`)
- [ ] npm 10.x installed (`npm --version`)
- [ ] PM2 global installed (`pm2 --version`)
- [ ] Project cloned di `/var/www/SecretMe-5n`
- [ ] `.env.local` sudah dibuat dan dikonfigurasi
- [ ] `npm run build` berhasil
- [ ] `npm start` bisa dijalankan
- [ ] PM2 running (`pm2 status`)
- [ ] Nginx configured dan running
- [ ] SSL certificate installed (jika production)
- [ ] Firewall rules enabled
- [ ] Domain pointing ke VPS IP

---

## 🔍 Troubleshooting

### Error: Build failed - Out of memory

```bash
# Increase swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Verify
free -h
```

### Error: gyp ERR! build error

```bash
sudo apt install -y python3-dev
npm install --build-from-source
```

### Error: Port 3000 already in use

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 PID

# Or change port
PORT=3001 npm start
```

### Error: ENOSPC (file watcher limit)

```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Nginx: Bad Gateway

```bash
# Check if PM2 app is running
pm2 status
pm2 logs secretme

# Restart
pm2 restart secretme

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Database Connection Error

```bash
# Test connection
psql -h your_db_host -U your_db_user -d your_db -c "SELECT 1"

# Verify .env.local
cat /var/www/SecretMe-5n/.env.local

# Restart with logs
pm2 restart secretme
pm2 logs secretme
```

---

## 📊 Monitoring & Maintenance

### Check Application Status

```bash
# PM2 status
pm2 status

# PM2 monitoring
pm2 monit

# View logs
pm2 logs secretme

# View specific app log
pm2 logs secretme --lines 100
```

### Check Nginx Status

```bash
# Status
sudo systemctl status nginx

# Logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### System Resources

```bash
# CPU & Memory usage
top

# Disk usage
df -h

# Memory usage
free -h
```

### Update Application

```bash
cd /var/www/SecretMe-5n
git pull origin main
npm install
npm run build
pm2 restart secretme
```

### SSL Certificate Renewal

```bash
# Auto-renewal (cek status)
sudo certbot renew --dry-run

# Manual renewal
sudo certbot renew
```

---

## 🔒 Security Tips

### SSH Security

```bash
# Disable root login
sudo sed -i 's/^#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

### Fail2Ban (Optional)

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
```

### Regular Updates

```bash
# Setup cron for auto-updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 📱 Useful Commands

```bash
# Restart all services
pm2 restart secretme && sudo systemctl restart nginx

# Stop application
pm2 stop secretme

# Start application
pm2 start secretme

# View live logs
pm2 logs secretme --follow

# Reload application (graceful)
pm2 reload secretme

# Delete app from PM2
pm2 delete secretme

# Save PM2 process
pm2 save

# Resurrect saved processes
pm2 resurrect
```

---

## 🆘 Support & Help

Jika ada error, cek:

1. **Logs aplikasi**: `pm2 logs secretme`
2. **Logs Nginx**: `sudo tail -f /var/log/nginx/error.log`
3. **Environment variables**: `cat .env.local`
4. **System resources**: `free -h && df -h`

---

## 📞 Next Steps

1. ✅ Setup selesai
2. 🔗 Test akses aplikasi via domain/IP
3. 📧 Setup backup database
4. 📊 Monitor performance
5. 🔄 Setup auto-update/deployment

Selamat! 🎉
