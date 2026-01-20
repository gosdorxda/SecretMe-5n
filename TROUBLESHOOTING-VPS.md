# Troubleshooting Guide - SecretMe VPS Installation

## Diagnostic Commands

### 1. Check Application Status
```bash
# Is app running?
pm2 list
pm2 describe secretme

# View real-time logs
pm2 logs secretme

# View last 100 lines
pm2 logs secretme --lines 100

# Monitor
pm2 monit
```

### 2. Check Nginx
```bash
# Status
sudo systemctl status nginx

# Error log
sudo tail -f /var/log/nginx/error.log

# Access log
sudo tail -f /var/log/nginx/access.log

# Config test
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx
```

### 3. Check System Resources
```bash
# Disk space
df -h

# Memory
free -h

# CPU
top
ps aux | grep -i secretme
ps aux | grep -i node

# Network
netstat -tuln | grep 3000
netstat -tuln | grep 80
netstat -tuln | grep 443
```

### 4. Check Database Connection
```bash
# Test connection
psql -h your_host -U your_user -d your_database

# View current connections
psql -h your_host -U your_user -d your_database -c "SELECT * FROM pg_stat_activity;"

# In app logs
pm2 logs secretme | grep -i "database\|connection\|error"
```

---

## Common Problems & Solutions

### Problem 1: Application Not Running (Port 3000 Error)

**Symptoms:**
- `pm2 list` shows app crashed
- `EADDRINUSE` error
- Cannot access https://yourdomain.com

**Solution:**

```bash
# Check what's using port 3000
sudo lsof -i :3000
sudo netstat -tulpn | grep 3000

# Kill process
sudo kill -9 PID

# Restart PM2
pm2 restart secretme

# If still error, check logs
pm2 logs secretme --lines 50
```

### Problem 2: Database Connection Failed

**Symptoms:**
- 500 Error on website
- Logs show "Connection refused"
- "ECONNREFUSED"

**Solution:**

```bash
# 1. Verify .env.local
cat /var/www/SecretMe-5n/.env.local | grep POSTGRES

# 2. Test database connection
psql -h your_host -U your_user -d your_db
# or
PGPASSWORD="your_password" psql -h your_host -U your_user -d your_db

# 3. Check if database is running
ping your_db_host

# 4. Check firewall (if using VPS cloud)
# - Allow port 5432 from your VPS IP

# 5. Verify credentials are correct
echo $POSTGRES_URL  # Should show connection string

# 6. Restart app
pm2 restart secretme
```

### Problem 3: NGINX 502 Bad Gateway

**Symptoms:**
- Shows "502 Bad Gateway"
- Nginx logs show "upstream timed out"
- App runs but nginx can't reach it

**Solution:**

```bash
# 1. Check if app is running on port 3000
curl http://localhost:3000

# 2. If not, start it
pm2 start npm --name "secretme" -- start

# 3. Check nginx config
sudo nano /etc/nginx/sites-available/secretme
# Ensure proxy_pass is http://localhost:3000

# 4. Increase timeout
sudo nano /etc/nginx/sites-available/secretme
# Add:
# proxy_read_timeout 60s;
# proxy_connect_timeout 60s;

# 5. Restart nginx
sudo systemctl restart nginx

# 6. Test
curl https://yourdomain.com
```

### Problem 4: SSL Certificate Not Working

**Symptoms:**
- Browser shows "Not Secure"
- SSL error in logs
- Certificate expired message

**Solution:**

```bash
# 1. Check certificate status
sudo certbot certificates

# 2. Renew certificate
sudo certbot renew --force-renewal -d yourdomain.com

# 3. Check nginx SSL config
sudo nano /etc/nginx/sites-available/secretme
# Should have ssl_certificate paths

# 4. Verify DNS points to VPS
nslookup yourdomain.com
dig yourdomain.com

# 5. If new domain, wait 24-48 hours for DNS propagation

# 6. Force HTTPS
sudo certbot --nginx -d yourdomain.com --redirect

# 7. Restart
sudo systemctl restart nginx
```

### Problem 5: Out of Memory / Build Failed

**Symptoms:**
- "FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed"
- Build process stops
- `npm run build` fails

**Solution:**

```bash
# 1. Check current memory
free -h

# 2. Create swap if memory < 2GB
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 3. Verify swap
free -h

# 4. Make it permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 5. Increase Node memory
export NODE_OPTIONS=--max-old-space-size=2048
npm run build

# 6. Restart app
pm2 restart secretme
```

### Problem 6: npm install / build very slow

**Symptoms:**
- Installation takes 30+ minutes
- Build seems stuck
- Network timeout

**Solution:**

```bash
# 1. Clear cache
npm cache clean --force

# 2. Use different registry
npm config set registry https://registry.npmjs.org/

# 3. Increase timeout
npm config set fetch-timeout 120000

# 4. Install with verbose logging
npm install --verbose

# 5. Or use yarn (faster)
sudo npm install -g yarn
yarn install
yarn build

# 6. If git clone is slow
git config --global http.postBuffer 524288000
```

### Problem 7: Disk Space Full

**Symptoms:**
- "No space left on device"
- Build fails
- Cannot create files

**Solution:**

```bash
# 1. Check disk usage
df -h

# 2. Find large directories
du -sh /* | sort -rh

# 3. Clean node_modules
cd /var/www/SecretMe-5n
rm -rf node_modules

# 4. Clean npm cache
npm cache clean --force

# 5. Clean old logs
pm2 flush

# 6. Remove old backups
rm -rf /var/backups/old_*

# 7. Clean temporary files
sudo apt clean
sudo apt autoclean

# 8. Check again
df -h
```

### Problem 8: Changes not taking effect

**Symptoms:**
- Modified .env.local but app still old values
- Updated database but changes not reflected
- Restarted but still same error

**Solution:**

```bash
# 1. Verify file was actually changed
cat /var/www/SecretMe-5n/.env.local

# 2. Delete PM2 and restart
pm2 delete secretme
pm2 start npm --name "secretme" -- start

# 3. Clear Node cache
rm -rf /var/www/SecretMe-5n/.next

# 4. Full rebuild
cd /var/www/SecretMe-5n
npm run build

# 5. Restart
pm2 restart secretme

# 6. Clear browser cache (Ctrl+Shift+Delete)
```

### Problem 9: High CPU / Memory Usage

**Symptoms:**
- Server very slow
- CPU at 100%
- Memory usage high

**Solution:**

```bash
# 1. Check what's using resources
top
ps aux | sort -nrk 3,3 | head -5

# 2. View app logs for errors
pm2 logs secretme | grep -i error

# 3. Check for infinite loops / memory leaks
pm2 monit

# 4. Restart app
pm2 restart secretme

# 5. If still high, check database queries
# - Look for slow queries
# - Check active connections

# 6. Increase resources
# - Add more swap
# - Upgrade VPS plan
# - Optimize application code

# 7. Set PM2 memory limit
pm2 delete secretme
pm2 start npm --name "secretme" -- start --max-memory-restart 500M
```

### Problem 10: Cannot access via domain

**Symptoms:**
- Can access via IP but not domain
- Domain not resolving
- "Connection refused"

**Solution:**

```bash
# 1. Check DNS resolution
nslookup yourdomain.com
dig yourdomain.com

# 2. Check DNS propagation
# Use: https://www.whatsmydns.net/

# 3. Verify A record points to your VPS IP
# - Login to domain registrar
# - Check A record points to VPS IP

# 4. Test connection to IP
curl http://your_vps_ip

# 5. Check firewall allows 80/443
sudo ufw status

# 6. Verify nginx is listening
sudo netstat -tulpn | grep nginx

# 7. Test nginx config
sudo nginx -t

# 8. Restart services
sudo systemctl restart nginx
pm2 restart secretme

# 9. Wait 24-48 hours for DNS propagation
```

---

## Debug Log Collection

### Gather Information
```bash
# Create debug info
mkdir -p ~/debug_info

# System info
uname -a > ~/debug_info/system.txt
free -h >> ~/debug_info/system.txt
df -h >> ~/debug_info/system.txt

# Node/npm versions
node --version > ~/debug_info/versions.txt
npm --version >> ~/debug_info/versions.txt

# App logs
pm2 logs secretme --lines 200 > ~/debug_info/app_logs.txt

# Nginx logs
sudo tail -f /var/log/nginx/error.log -n 100 > ~/debug_info/nginx_error.txt

# PM2 status
pm2 describe secretme > ~/debug_info/pm2_status.txt

# Process info
ps aux | grep secretme > ~/debug_info/processes.txt

# Environment (sanitized)
cat /var/www/SecretMe-5n/.env.local | grep -v "PASSWORD\|KEY\|SECRET\|TOKEN" > ~/debug_info/env.txt

# Nginx config
sudo cat /etc/nginx/sites-available/secretme > ~/debug_info/nginx_config.txt

# Zip everything
tar -czf debug_info.tar.gz ~/debug_info

echo "Debug info saved to: ~/debug_info.tar.gz"
```

---

## Prevention Tips

### 1. Regular Monitoring
```bash
# Daily
pm2 list
pm2 logs secretme --lines 50
df -h

# Weekly
sudo systemctl status nginx
sudo certbot certificates
git log --oneline -5
```

### 2. Backups
```bash
# Daily backup
#!/bin/bash
BACKUP_DIR="/backups/secretme"
mkdir -p $BACKUP_DIR
cp /var/www/SecretMe-5n/.env.local $BACKUP_DIR/.env.local.$(date +%Y%m%d)

# Add to crontab
crontab -e
# Add: 0 2 * * * /path/to/backup_script.sh
```

### 3. Log Rotation
```bash
# PM2 auto logs rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 10
```

### 4. Update Regularly
```bash
# Weekly updates
sudo apt update && sudo apt upgrade -y
npm update
```

---

## Getting Help

When asking for help, provide:

```bash
# 1. System info
uname -a
free -h
df -h

# 2. App status
pm2 list
pm2 logs secretme --lines 100

# 3. Error messages
# (copy full error message)

# 4. What you tried
# (describe steps already taken)

# 5. Relevant config
# (cat .env.local - sanitized)
# (cat /etc/nginx/sites-available/secretme)
```

---

## Emergency Procedures

### If App Crashes on Startup
```bash
pm2 delete secretme
pm2 start npm --name "secretme" -- start
pm2 logs secretme
```

### If Database Connection Breaks
```bash
# 1. Verify connection string
echo $POSTGRES_URL

# 2. Test connection
psql -h host -U user -d database

# 3. Restart app
pm2 restart secretme
```

### If Nginx Not Working
```bash
# 1. Check config
sudo nginx -t

# 2. Fix config if error
sudo nano /etc/nginx/sites-available/secretme

# 3. Restart
sudo systemctl restart nginx

# 4. Test
curl https://yourdomain.com
```

### If Disk Full
```bash
# 1. Find large files
du -sh /* | sort -rh

# 2. Clean up
rm -rf /var/www/SecretMe-5n/node_modules
npm cache clean --force

# 3. Verify
df -h
```

Good luck! Stay calm and check logs first! 🚀
