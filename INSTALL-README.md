# SecretMe - VPS Installation & Deployment Guide

Panduan lengkap untuk install dan deploy SecretMe ke VPS Ubuntu 22.

## 📚 Dokumentasi Tersedia

### 1. **QUICK-START-VPS.md** ⚡ (Start Here!)
**Untuk yang terburu-buru** - Setup dalam 5 menit
- Automatic installation script (recommended)
- Manual installation (if script fails)
- Environment variables template
- Common issues & quick fixes

👉 **Use this if you want to get running ASAP**

### 2. **PANDUAN-INSTALL-VPS-UBUNTU22.md** 📖 (Most Complete)
**Panduan lengkap step-by-step** dengan penjelasan detail
- 7 langkah setup sistem
- Konfigurasi setiap komponen
- Monitoring & maintenance
- Security best practices
- Useful commands reference
- Full troubleshooting

👉 **Use this for detailed understanding**

### 3. **TROUBLESHOOTING-VPS.md** 🔧 (Problem Solver)
**Diagnostic & problem solving**
- 10+ common problems dengan solusi
- Diagnostic commands
- Debug log collection
- Prevention tips
- Emergency procedures

👉 **Use this when something goes wrong**

### 4. **install-secretme.sh** 🤖 (Automation Script)
**Automated installation script**
- Runs all installation steps automatically
- Creates environment file template
- Setups PM2, Nginx, SSL
- Color-coded output
- Interactive prompts

👉 **Run this for hands-off installation**

---

## 🚀 Quick Installation (Recommended)

### Step 1: Login to VPS
```bash
ssh root@your_vps_ip
```

### Step 2: Run Installation Script
```bash
cd /tmp
wget https://raw.githubusercontent.com/yourusername/SecretMe-5n/main/install-secretme.sh
chmod +x install-secretme.sh
sudo bash install-secretme.sh
```

### Step 3: Configure Environment
```bash
nano /var/www/SecretMe-5n/.env.local
# Edit database credentials, API keys, etc
```

### Step 4: Restart Application
```bash
pm2 restart secretme
```

### Step 5: Access Your Site
```
https://yourdomain.com
```

**Done in ~5 minutes! 🎉**

---

## 📋 Manual Installation (Alternative)

If you prefer step-by-step manual setup:

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 20
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
# Paste your environment variables

# 6. Install & Build
npm install
npm run build

# 7. Start app
pm2 start npm --name "secretme" -- start
pm2 startup
pm2 save

# 8. Setup web server
sudo apt install -y nginx
# Configure nginx (see PANDUAN-INSTALL-VPS-UBUNTU22.md)

# 9. Setup SSL
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com

# Done!
```

---

## ✅ Installation Checklist

- [ ] VPS Ubuntu 22 ready
- [ ] SSH access working
- [ ] Node.js 20 installed
- [ ] Repository cloned
- [ ] .env.local configured with database & API keys
- [ ] npm install completed
- [ ] npm run build succeeded
- [ ] PM2 running
- [ ] Nginx configured
- [ ] SSL certificate installed
- [ ] Application accessible via HTTPS
- [ ] Database connected (check logs)
- [ ] Email/notification services working

---

## 🔧 After Installation

### Monitor Application
```bash
pm2 list              # Check status
pm2 logs secretme     # View logs
pm2 monit             # Real-time monitor
```

### Update Application
```bash
cd /var/www/SecretMe-5n
git pull origin main
npm install
npm run build
pm2 restart secretme
```

### Backup Database
```bash
pg_dump -h host -U user db > backup_$(date +%Y%m%d).sql
```

### View Logs
```bash
pm2 logs secretme
sudo tail -f /var/log/nginx/error.log
```

---

## 🆘 Having Issues?

### Check These First:
1. **Application logs**: `pm2 logs secretme`
2. **Nginx logs**: `sudo tail -f /var/log/nginx/error.log`
3. **System resources**: `free -h` & `df -h`
4. **Database connection**: `psql -h host -U user -d db`

### Common Issues:
- **Application won't start**: Check logs → likely database connection issue
- **502 Bad Gateway**: App not running on port 3000 → `pm2 restart secretme`
- **SSL not working**: Certificate issue → `sudo certbot renew`
- **Slow response**: Check disk/memory → `df -h` & `free -h`

### Get Detailed Help:
👉 See **TROUBLESHOOTING-VPS.md** for 10+ detailed solutions

---

## 📖 Documentation Map

```
├── QUICK-START-VPS.md ...................... 5-minute setup
├── PANDUAN-INSTALL-VPS-UBUNTU22.md ........ Complete guide (IN BAHASA INDONESIA)
├── TROUBLESHOOTING-VPS.md ................. Problem solving
├── install-secretme.sh .................... Automation script
└── This file (INSTALL-README.md)
```

---

## 🎯 What Each File Does

| File | Purpose | Read Time | When to Use |
|------|---------|-----------|-----------|
| QUICK-START-VPS.md | Quick setup guide | 5 min | Want to install fast |
| PANDUAN-INSTALL-VPS-UBUNTU22.md | Detailed tutorial | 30 min | Want to understand everything |
| TROUBLESHOOTING-VPS.md | Problem solver | 10 min | Something is broken |
| install-secretme.sh | Automation script | 0 min | Want automatic setup |

---

## 🌟 Pro Tips

1. **Always keep .env.local backed up** - It has your secrets!
   ```bash
   cp /var/www/SecretMe-5n/.env.local ~/backup/.env.local.bak
   ```

2. **Enable automatic backups** - Add to crontab
   ```bash
   0 2 * * * pg_dump -h host -U user db > /backup/db_$(date +\%Y\%m\%d).sql
   ```

3. **Monitor regularly** - Set up alerts
   ```bash
   pm2 set pm2-logrotate:max_size 10M
   pm2 set pm2-logrotate:retain 10
   ```

4. **Keep your VPS updated** - Weekly
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

5. **Test SSL renewal** - Monthly
   ```bash
   sudo certbot renew --dry-run
   ```

---

## 📞 Support Resources

- **Docs**: See individual markdown files
- **Logs**: `pm2 logs secretme` & `/var/log/nginx/error.log`
- **Status**: `pm2 status` & `pm2 describe secretme`
- **Resources**: `free -h`, `df -h`, `top`

---

## 🔐 Security Reminders

- ✓ Use strong passwords for database
- ✓ Backup .env.local securely
- ✓ Enable firewall: `sudo ufw enable`
- ✓ Use HTTPS (SSL certificate)
- ✓ Keep system updated
- ✓ Disable root SSH login
- ✓ Use SSH keys instead of passwords

---

## 📝 Environment Variables Needed

Before installation, gather:
- [ ] Database credentials (host, user, password, name)
- [ ] Supabase URL & keys
- [ ] Payment gateway keys (Tripay, Duitku, etc)
- [ ] Email service API key (Resend)
- [ ] SMS API key (Fonnte)
- [ ] Telegram bot token
- [ ] Your domain name
- [ ] Email for SSL

---

## 🎓 Learning Resources

- Check individual markdown files for detailed explanations
- Run scripts with `-h` flag for help (if supported)
- Read PM2 documentation: `pm2 help`
- Nginx docs: https://nginx.org/en/docs/
- Next.js deployment: https://nextjs.org/docs/deployment

---

## Version Info

- **Node.js**: 20.x LTS
- **npm**: 10.x
- **Next.js**: 15.x
- **Ubuntu**: 22.04 LTS
- **PM2**: Latest
- **Nginx**: Latest

---

## Getting Started

**Choose your path:**

1. 🏃 **I want to install NOW** → Read: QUICK-START-VPS.md
2. 📚 **I want to understand** → Read: PANDUAN-INSTALL-VPS-UBUNTU22.md
3. 🤖 **I want automation** → Run: `bash install-secretme.sh`
4. 🔧 **Something broke** → Read: TROUBLESHOOTING-VPS.md

---

**Last Updated**: 2024  
**Maintained By**: SecretMe Development Team

---

# Ready to Deploy? 🚀

→ **Next Step**: Open **QUICK-START-VPS.md** or run **install-secretme.sh**
