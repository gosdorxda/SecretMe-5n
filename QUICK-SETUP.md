# SecretMe - Quick Setup Reference

**Cara tercepat untuk setup fresh install di Ubuntu 22 VPS**

---

## ⚡ 5 Menit Setup

```bash
# 1. SSH ke VPS
ssh root@your_vps_ip

# 2. Download & run setup script
wget https://raw.githubusercontent.com/yourusername/SecretMe-5n/main/setup-ubuntu-22.sh
chmod +x setup-ubuntu-22.sh
./setup-ubuntu-22.sh

# 3. Edit environment variables
nano /var/www/SecretMe-5n/.env.local

# 4. Edit domain di Nginx
sudo nano /etc/nginx/sites-available/secretme

# 5. Setup SSL
sudo certbot --nginx -d yourdomain.com

# 6. Restart services
pm2 restart secretme
sudo systemctl restart nginx
```

**Done!** Aplikasi sudah live.

---

## 🆘 Troubleshooting Cepat

| Problem | Solution |
|---------|----------|
| Build gagal (out of memory) | `sudo fallocate -l 4G /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile` |
| Port 3000 error | `sudo lsof -i :3000` kemudian `sudo kill -9 PID` |
| Nginx bad gateway | `pm2 logs secretme` cek apakah app running |
| Database connection error | Cek `.env.local` dan database credentials |
| ENOSPC error | `echo fs.inotify.max_user_watches=524288 \| sudo tee -a /etc/sysctl.conf && sudo sysctl -p` |

---

## 📊 Monitoring Commands

```bash
# Check app status
pm2 status

# View logs
pm2 logs secretme

# Monitor real-time
pm2 monit

# Check nginx
sudo systemctl status nginx

# Check disk/memory
df -h && free -h
```

---

## 🔄 Update Application

```bash
cd /var/www/SecretMe-5n
git pull
npm install
npm run build
pm2 restart secretme
```

---

## 📝 Environment Variables Template

Minimal `.env.local` yang harus ada:

```env
# Database
POSTGRES_URL=postgresql://user:pass@host:5432/db

# Supabase
SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
SUPABASE_ANON_KEY=key
NEXT_PUBLIC_SUPABASE_ANON_KEY=key
SUPABASE_SERVICE_ROLE_KEY=key

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
TELEGRAM_BOT_TOKEN=token (jika ada)
```

---

## 🎯 File Penting

| File | Lokasi | Fungsi |
|------|--------|--------|
| Environment | `/var/www/SecretMe-5n/.env.local` | Config app |
| Nginx | `/etc/nginx/sites-available/secretme` | Web server config |
| PM2 | `pm2 list` | Process manager |
| Logs | `pm2 logs secretme` | Application logs |

---

## ✨ Tips

- **Backup .env.local** sebelum deploy
- **Save PM2 config**: `pm2 save`
- **Auto-update Node packages**: `npm update` (di staging dulu)
- **Monitor disk**: `df -h` (jaga agar >5GB free)
- **Auto-SSL renewal**: Certbot sudah auto-renew default

---

## 🚀 Testing

```bash
# Lokal test
curl http://localhost:3000

# Via domain
curl https://yourdomain.com

# Check SSL
curl -I https://yourdomain.com
```

---

**Need more details?** Baca `/SETUP-UBUNTU-22.md`
