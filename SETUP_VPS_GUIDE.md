# 📚 Panduan Setup SecretMe di VPS

## Daftar Isi
1. [Persiapan Awal](#persiapan-awal)
2. [Instalasi Dependensi](#instalasi-dependensi)
3. [Konfigurasi Aplikasi](#konfigurasi-aplikasi)
4. [Build & Deploy](#build--deploy)
5. [Setup Nginx](#setup-nginx)
6. [Setup SSL](#setup-ssl)
7. [Maintenance & Troubleshooting](#maintenance--troubleshooting)

---

## 🚀 Persiapan Awal

### 1. SSH ke VPS
```bash
ssh root@your_vps_ip
# atau dengan port custom
ssh -p 22 root@your_vps_ip
```

### 2. Update Sistem
```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Install Essential Tools
```bash
sudo apt install -y curl wget git build-essential
```

---

## 📦 Instalasi Dependensi

### 1. Install Node.js (v20 Recommended)
```bash
# Download setup script NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js dan npm
sudo apt-get install -y nodejs

# Verifikasi instalasi
node -v
npm -v
```

### 2. Install PM2 (Process Manager)
```bash
sudo npm install -g pm2

# Verifikasi
pm2 -v
```

### 3. Install Nginx
```bash
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verifikasi
sudo systemctl status nginx
```

### 4. Install Certbot (SSL)
```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

## ⚙️ Konfigurasi Aplikasi

### 1. Clone Repository
```bash
# Pilih lokasi (biasanya /var/www)
cd /var/www

# Clone project
git clone https://github.com/username/secretme.git
cd secretme

# Jika ingin branch tertentu
git checkout branch-name
```

### 2. Install Dependencies Project
```bash
# Bersihkan cache npm (opsional tapi recommended)
npm cache clean --force

# Install dependencies
npm install

# Verifikasi
npm list | head -20
```

### 3. Buat File `.env.local`
```bash
nano .env.local
```

**Isi file dengan variabel dari sidebar Vars di v0:**
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# App Configuration
NEXT_PUBLIC_APP_URL=https://secretme.com

# Payment & Services
NEXT_PUBLIC_PREMIUM_PRICE=99000
NEXT_PUBLIC_PREMIUM_DURATION_DAYS=30
NEXT_PUBLIC_PREMIUM_VOUCHER_CODE=SECRETME2025

# Payment Gateways (pilih salah satu sesuai kebutuhan)
ACTIVE_PAYMENT_GATEWAY=tripay
TRIPAY_MERCHANT_CODE=your_code
TRIPAY_API_KEY=your_api_key
TRIPAY_PRIVATE_KEY=your_private_key

# Telegram Bot (opsional)
TELEGRAM_BOT_TOKEN=your_bot_token
FONNTE_API_KEY=your_fonnte_key

# Security
CRON_SECRET=your_random_secret_key
```

**Cara menyimpan:**
- Tekan `CTRL + X`
- Tekan `Y` untuk Yes
- Tekan `Enter` untuk confirm

### 4. Tambah Swap File (Untuk VPS dengan RAM rendah)
```bash
# Buat swap 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Permanent swap (agar tetap setelah restart)
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verifikasi
free -h
```

---

## 🔨 Build & Deploy

### 1. Build Next.js
```bash
# Batasi RAM usage jika VPS kecil
NODE_OPTIONS="--max-old-space-size=2048" npm run build

# Atau tanpa batasan jika VPS besar
npm run build
```

**Jika ada error:**
```bash
# Cek apakah ada proses node yang jalan
ps aux | grep node

# Kill semua proses node
pkill -9 node

# Coba build lagi
npm run build
```

### 2. Test Jalankan Manual (Optional)
```bash
# Jalankan di foreground untuk test
npm run start

# Akses via browser: http://your_vps_ip:3000
# Tekan CTRL + C untuk stop
```

### 3. Setup dengan PM2
```bash
# Start aplikasi dengan PM2
pm2 start npm --name "secretme" -- start

# Lihat status
pm2 status

# Lihat log
pm2 logs secretme

# Setup PM2 untuk auto-start saat reboot
pm2 startup
pm2 save
```

---

## 🌐 Setup Nginx

### 1. Hapus Konfigurasi Default Nginx
```bash
sudo rm /etc/nginx/sites-enabled/default
```

### 2. Buat Konfigurasi Baru untuk SecretMe
```bash
sudo nano /etc/nginx/sites-available/secretme
```

**Paste konfigurasi berikut:**
```nginx
server {
    listen 80;
    server_name secretme.com www.secretme.com;
    
    # Redirect HTTP ke HTTPS (nanti setelah SSL setup)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name secretme.com www.secretme.com;

    # SSL certificates (akan dibuat dengan Certbot)
    ssl_certificate /etc/letsencrypt/live/secretme.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/secretme.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Performance
    client_max_body_size 20M;
    
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
```

### 3. Enable Konfigurasi Nginx
```bash
# Buat symlink
sudo ln -s /etc/nginx/sites-available/secretme /etc/nginx/sites-enabled/

# Test konfigurasi
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🔒 Setup SSL (HTTPS)

### 1. Setup SSL dengan Certbot
```bash
# Jalankan certbot
sudo certbot --nginx -d secretme.com -d www.secretme.com

# Ikuti instruksi di layar
# Pilih opsi untuk redirect HTTP ke HTTPS
```

### 2. Auto Renewal SSL
```bash
# Certbot sudah setup auto-renewal secara otomatis
# Verifikasi:
sudo systemctl status certbot.timer

# Test renewal (dry run):
sudo certbot renew --dry-run
```

---

## 📊 Monitoring & Maintenance

### 1. Monitor Aplikasi
```bash
# Lihat semua proses PM2
pm2 list

# Monitor real-time
pm2 monit

# Lihat log aplikasi
pm2 logs secretme

# Lihat log dengan tail (last 100 lines)
pm2 logs secretme --lines 100
```

### 2. Restart Aplikasi
```bash
# Restart aplikasi
pm2 restart secretme

# Restart setelah update kode
git pull origin main
npm install --omit=dev
pm2 restart secretme
```

### 3. Cek Status Server
```bash
# Penggunaan RAM
free -h

# Penggunaan Disk
df -h

# Penggunaan CPU
top -b -n 1 | head -20

# Atau gunakan htop
htop
```

### 4. View Error Logs
```bash
# Nginx error log
sudo tail -f /var/log/nginx/error.log

# Nginx access log
sudo tail -f /var/log/nginx/access.log
```

---

## 🔧 Troubleshooting

### Error: "npm: not found" atau "node: not found"
```bash
# Install Node.js ulang
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Atau gunakan nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
```

### Error: "Port 3000 already in use"
```bash
# Cari proses yang menggunakan port 3000
sudo lsof -i :3000

# Kill proses (ganti PID dengan ID proses)
sudo kill -9 PID

# Atau langsung kill semua node
pkill -9 node
```

### Error: "Build worker exited with code: 1"
```bash
# Biasanya karena kehabisan RAM
# Tambah Swap (lihat bagian Swap File di atas)

# Atau batasi memory saat build
NODE_OPTIONS="--max-old-space-size=2048" npm run build
```

### Error: "Cannot find module"
```bash
# Hapus node_modules dan install ulang
rm -rf node_modules package-lock.json
npm install

# Coba build lagi
npm run build
```

### Aplikasi Mati Sendiri
```bash
# Lihat status PM2
pm2 status

# Restart aplikasi
pm2 restart secretme

# Lihat log untuk error
pm2 logs secretme
```

---

## 🔄 Update & Deployment Workflow

### 1. Pull Update Terbaru
```bash
cd /var/www/secretme
git pull origin main
```

### 2. Install Dependencies Baru (Jika Ada)
```bash
npm install --omit=dev
```

### 3. Build & Restart
```bash
NODE_OPTIONS="--max-old-space-size=2048" npm run build
pm2 restart secretme
```

### 4. Verifikasi
```bash
pm2 status
pm2 logs secretme
```

---

## 📋 Checklist Setup Lengkap

- [ ] SSH ke VPS berhasil
- [ ] Node.js v20+ terinstall
- [ ] PM2 terinstall secara global
- [ ] Nginx terinstall
- [ ] Repository di-clone
- [ ] Dependencies di-install
- [ ] File `.env.local` dibuat dengan konfigurasi lengkap
- [ ] Swap file ditambahkan (untuk VPS RAM kecil)
- [ ] Aplikasi berhasil di-build
- [ ] Aplikasi berjalan di PM2
- [ ] Nginx dikonfigurasi dengan benar
- [ ] SSL/HTTPS aktif dengan Certbot
- [ ] Domain mengarah ke VPS (DNS A record)
- [ ] Akses aplikasi via HTTPS berhasil

---

## 📞 Informasi Tambahan

**Port Default:**
- Aplikasi: 3000
- Nginx (HTTP): 80
- Nginx (HTTPS): 443

**Path Penting:**
- Aplikasi: `/var/www/secretme`
- Nginx config: `/etc/nginx/sites-available/secretme`
- SSL certificates: `/etc/letsencrypt/live/secretme.com/`
- PM2 logs: `~/.pm2/logs/`

**Commands Penting PM2:**
```bash
pm2 start npm --name "secretme" -- start    # Start
pm2 stop secretme                            # Stop
pm2 restart secretme                         # Restart
pm2 delete secretme                          # Delete
pm2 logs secretme                            # View logs
pm2 status                                   # View status
pm2 save                                     # Save state
pm2 startup                                  # Auto start on reboot
```

---

Semoga panduan ini membantu! Jika ada pertanyaan, silakan tanyakan. 🚀
