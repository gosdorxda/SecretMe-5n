# SecretMe VPS - Quick Commands Reference

Simpan file ini dan reference saat butuh! Cukup copy-paste commands berikut.

## 🚀 Installation

```bash
# Download & run installation script
cd /tmp
wget https://raw.githubusercontent.com/yourusername/SecretMe-5n/main/install-secretme.sh
chmod +x install-secretme.sh
sudo bash install-secretme.sh
```

---

## 📋 Daily Commands

### Check Application Status
```bash
pm2 list                    # See all apps
pm2 status                  # Quick status
pm2 describe secretme       # Detailed info
pm2 monit                   # Real-time monitor
```

### View Logs
```bash
pm2 logs secretme           # Latest logs
pm2 logs secretme --lines 100  # Last 100 lines
pm2 flush                   # Clear all logs
```

### Restart Application
```bash
pm2 restart secretme        # Restart
pm2 stop secretme           # Stop
pm2 start npm --name "secretme" -- start  # Start
```

### Check System
```bash
free -h                     # Memory usage
df -h                       # Disk space
top                         # CPU usage
ps aux | grep node          # Node processes
```

---

## 🔧 Nginx Commands

### Status & Control
```bash
sudo systemctl status nginx     # Check status
sudo systemctl restart nginx    # Restart
sudo systemctl reload nginx     # Reload config
sudo systemctl start nginx      # Start
sudo systemctl stop nginx       # Stop
```

### Configuration
```bash
sudo nginx -t               # Test config
sudo nano /etc/nginx/sites-available/secretme  # Edit config
```

### Logs
```bash
sudo tail -f /var/log/nginx/error.log   # Error logs (live)
sudo tail -f /var/log/nginx/access.log  # Access logs (live)
tail -200 /var/log/nginx/error.log      # Last 200 lines
```

---

## 🔐 SSL/Certificate Commands

### Check Certificate
```bash
sudo certbot certificates      # List all certs
sudo certbot certificates --detail  # Detailed info
```

### Renew Certificate
```bash
sudo certbot renew             # Auto renew
sudo certbot renew --force-renewal -d yourdomain.com  # Force renew
sudo certbot renew --dry-run   # Test renewal
```

### Setup SSL for New Domain
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Cleanup SSL
```bash
sudo certbot delete --cert-name yourdomain.com
```

---

## 📦 Update & Deploy

### Update Code
```bash
cd /var/www/SecretMe-5n
git pull origin main           # Get latest code
npm install                    # Update dependencies
npm run build                  # Build
pm2 restart secretme           # Restart app
```

### Rollback (if update fails)
```bash
cd /var/www/SecretMe-5n
git log --oneline -5           # See recent commits
git revert HEAD                # Undo last commit
npm install
npm run build
pm2 restart secretme
```

---

## 🗄️ Database Commands

### Connect to Database
```bash
psql -h your_host -U your_user -d your_database
```

### Backup Database
```bash
pg_dump -h host -U user database > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database
```bash
psql -h host -U user -d database < backup_file.sql
```

### Check Connections
```bash
psql -h host -U user -d database -c "SELECT * FROM pg_stat_activity;"
```

---

## 📝 Configuration Files

### Edit Environment Variables
```bash
nano /var/www/SecretMe-5n/.env.local
```

### Edit Nginx Config
```bash
sudo nano /etc/nginx/sites-available/secretme
```

### View Environment Variables
```bash
cat /var/www/SecretMe-5n/.env.local
# Don't show secrets:
cat /var/www/SecretMe-5n/.env.local | grep -v "PASSWORD\|KEY\|SECRET\|TOKEN"
```

---

## 🚨 Emergency/Troubleshooting

### App Crashed
```bash
pm2 restart secretme
pm2 logs secretme              # Check error
```

### Port 3000 Already in Use
```bash
sudo lsof -i :3000            # Find process
sudo kill -9 PID              # Kill it
pm2 restart secretme          # Restart app
```

### Nginx Won't Start
```bash
sudo nginx -t                 # Find error
sudo nano /etc/nginx/sites-available/secretme  # Fix
sudo systemctl restart nginx  # Restart
```

### Out of Memory
```bash
free -h                       # Check memory
# Add swap:
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
free -h                       # Verify
```

### Can't Connect to Database
```bash
# Test connection:
psql -h host -U user -d database

# Check .env.local:
cat /var/www/SecretMe-5n/.env.local | grep POSTGRES

# View app logs:
pm2 logs secretme
```

### Build Failed
```bash
cd /var/www/SecretMe-5n
rm -rf node_modules
npm cache clean --force
npm install
npm run build
```

### SSL Error
```bash
sudo certbot renew --force-renewal -d yourdomain.com
sudo systemctl restart nginx
```

---

## 🔍 Debug & Logs

### Full Debug Info
```bash
# Create debug info
mkdir -p ~/debug
echo "=== SYSTEM ===" > ~/debug/info.txt
uname -a >> ~/debug/info.txt
free -h >> ~/debug/info.txt
df -h >> ~/debug/info.txt

echo -e "\n=== VERSIONS ===" >> ~/debug/info.txt
node --version >> ~/debug/info.txt
npm --version >> ~/debug/info.txt

echo -e "\n=== APP STATUS ===" >> ~/debug/info.txt
pm2 status >> ~/debug/info.txt

echo -e "\n=== APP LOGS ===" >> ~/debug/info.txt
pm2 logs secretme --lines 100 >> ~/debug/info.txt

# Show debug
cat ~/debug/info.txt
```

### Real-time Logs
```bash
# App logs (follow)
pm2 logs secretme --lines 50

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# System logs
sudo tail -f /var/log/syslog
```

---

## 🔒 Security Commands

### Firewall
```bash
sudo ufw status             # Check firewall
sudo ufw enable             # Enable
sudo ufw allow 22/tcp       # SSH
sudo ufw allow 80/tcp       # HTTP
sudo ufw allow 443/tcp      # HTTPS
sudo ufw reload             # Apply changes
```

### SSH Keys
```bash
ssh-keygen -t ed25519       # Generate key
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@host  # Copy key
```

### File Permissions
```bash
ls -la /var/www/SecretMe-5n  # Check perms
chmod -R 755 /var/www/SecretMe-5n  # Fix perms
```

---

## 📊 Monitoring

### Process Monitor
```bash
pm2 monit                   # Real-time
top -u $(whoami)            # Top processes
ps aux --sort=-%cpu | head  # CPU usage
ps aux --sort=-%mem | head  # Memory usage
```

### Disk Monitor
```bash
df -h                       # Space usage
du -sh /var/www/*           # Directory sizes
du -sh /var/log/*           # Log sizes
lsof +D /var/www            # Open files
```

### Network Monitor
```bash
netstat -tulpn | grep LISTEN  # Open ports
ss -tuln                      # Socket stats
lsof -i                       # Network connections
```

---

## 🧹 Maintenance

### Clean Up
```bash
npm cache clean --force              # NPM cache
sudo apt clean                       # Package cache
sudo apt autoclean                   # Auto-clean
pm2 flush                            # PM2 logs
rm -rf /var/www/SecretMe-5n/.next   # Next cache
```

### Updates
```bash
sudo apt update                # Check updates
sudo apt upgrade -y            # Install updates
npm update                     # Update packages
```

### Backups
```bash
# Backup app
tar -czf secretme_backup_$(date +%Y%m%d).tar.gz /var/www/SecretMe-5n

# Backup environment
cp /var/www/SecretMe-5n/.env.local ~/.env.local.bak

# Backup database
pg_dump -h host -U user db > db_backup_$(date +%Y%m%d).sql
```

---

## 📞 Get Help

### See Current Config
```bash
cat /var/www/SecretMe-5n/.env.local | grep -v "PASSWORD\|KEY\|SECRET"
cat /etc/nginx/sites-available/secretme
pm2 describe secretme
```

### Gather Debug Info (share when asking for help)
```bash
echo "=== APP LOGS ===" && pm2 logs secretme --lines 50
echo -e "\n=== SYSTEM ===" && free -h && df -h
echo -e "\n=== SERVICES ===" && pm2 status
```

---

## ⚡ Pro Tips

### One-Liner Restart Everything
```bash
pm2 restart secretme && sleep 2 && pm2 logs secretme
```

### Monitor Errors
```bash
pm2 logs secretme | grep -i error
sudo tail -f /var/log/nginx/error.log | grep -i error
```

### Quick Status Check
```bash
pm2 status && echo "---" && free -h && echo "---" && df -h | grep /dev/
```

### Auto-run on Reboot
```bash
pm2 startup
pm2 save
```

### Kill Port Usage
```bash
# Find and kill process on port 3000
sudo kill -9 $(sudo lsof -t -i :3000)
```

---

## 📱 Mobile-Friendly Version

**Copy to phone notes for quick access on-the-go:**

```
RESTART APP: pm2 restart secretme
VIEW LOGS: pm2 logs secretme
CHECK SPACE: df -h
CHECK MEMORY: free -h
NGINX RESTART: sudo systemctl restart nginx
CHECK STATUS: pm2 status
UPDATE APP: cd /var/www/SecretMe-5n && git pull && npm install && npm run build && pm2 restart secretme
```

---

**Last Updated**: 2024
**Keep This Bookmarked!** 🔖
