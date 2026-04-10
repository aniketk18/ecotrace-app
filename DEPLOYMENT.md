# EcoTrace Deployment Guide

## Overview

This guide covers deploying EcoTrace to production environments. Choose the option that best fits your infrastructure.

## Prerequisites for All Options

- Node.js 18+ (for local builds)
- MongoDB Atlas account with connection string
- Google Gemini API key
- Git repository with the code

## Option 1: Vercel (Recommended - Easiest)

Vercel is the creator of Next.js and provides seamless deployment.

### Steps:

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/ecotrace.git
   git push -u origin main
   ```

2. **Connect Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Environment Variables**
   In Vercel Dashboard → Settings → Environment Variables:
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ecotrace?retryWrites=true&w=majority
   JWT_SECRET=your_random_secret_key_here_minimum_32_chars
   GEMINI_API_KEY=your_gemini_api_key
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for automatic build and deployment
   - Get your live URL

### Scaling Notes:
- Vercel automatically scales
- Free tier supports <100 concurrent connections
- Pro tier ($20/month) for production use

---

## Option 2: Heroku

### Prerequisites:
- Heroku account
- Heroku CLI installed

### Steps:

1. **Create Heroku app**
   ```bash
   heroku login
   heroku create ecotrace-app
   ```

2. **Add buildpacks**
   ```bash
   heroku buildpacks:set heroku/nodejs
   ```

3. **Set environment variables**
   ```bash
   heroku config:set MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/ecotrace"
   heroku config:set JWT_SECRET="your_secret_key"
   heroku config:set GEMINI_API_KEY="your_api_key"
   heroku config:set NEXT_PUBLIC_APP_URL="https://ecotrace-app.herokuapp.com"
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

5. **View logs**
   ```bash
   heroku logs --tail
   ```

### Pricing:
- Free tier: $0 but goes dormant
- Hobby tier: $7/month
- Standard tier: $50+/month for production

---

## Option 3: Docker + Cloud Run (Google Cloud)

### Prerequisites:
- Google Cloud Project
- Docker installed
- `gcloud` CLI configured

### Steps:

1. **Build Docker image**
   ```bash
   docker build -t ecotrace:latest .
   ```

2. **Test locally**
   ```bash
   docker run -e MONGODB_URI="your_uri" \
             -e JWT_SECRET="secret" \
             -e GEMINI_API_KEY="key" \
             -p 3000:3000 \
             ecotrace:latest
   ```

3. **Push to Container Registry**
   ```bash
   docker tag ecotrace:latest gcr.io/YOUR_PROJECT/ecotrace:latest
   docker push gcr.io/YOUR_PROJECT/ecotrace:latest
   ```

4. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy ecotrace \
     --image gcr.io/YOUR_PROJECT/ecotrace:latest \
     --platform managed \
     --region us-central1 \
     --set-env-vars MONGODB_URI="uri",JWT_SECRET="secret",GEMINI_API_KEY="key"
   ```

### Pricing:
- First 2M requests/month: Free
- Beyond: $0.40 per 1M requests
- Good for variable workloads

---

## Option 4: DigitalOcean App Platform

### Steps:

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Create app on DigitalOcean**
   - Visit [digitalocean.com](https://cloud.digitalocean.com)
   - Click "Create" → "App Platform"
   - Connect GitHub repository
   - Select branch to deploy

3. **Configure environment**
   - Add environment variables in App Platform dashboard
   - Set Node.js as builder

4. **Deploy**
   - Click "Deploy App"
   - Wait for deployment

### Pricing:
- Basic tier: $12/month
- Pro tier: $25+/month

---

## Option 5: Traditional VPS (DigitalOcean Droplet, AWS EC2, etc.)

### Prerequisites:
- VPS with Ubuntu 20.04+
- SSH access
- Domain name (optional, for custom URL)

### Steps:

1. **SSH into server**
   ```bash
   ssh root@your_server_ip
   ```

2. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install MongoDB**
   ```bash
   sudo apt-get install -y mongodb
   sudo systemctl start mongodb
   ```
   Or use MongoDB Atlas (recommended for production)

4. **Clone repository**
   ```bash
   git clone https://github.com/yourusername/ecotrace.git
   cd ecotrace-app
   npm install
   ```

5. **Create systemd service**
   ```bash
   sudo tee /etc/systemd/system/ecotrace.service > /dev/null <<EOF
   [Unit]
   Description=EcoTrace Application
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/home/ubuntu/ecotrace-app
   EnvironmentFile=/home/ubuntu/ecotrace-app/.env.local
   ExecStart=/usr/bin/npm start
   Restart=always
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   EOF
   ```

6. **Start service**
   ```bash
   sudo systemctl start ecotrace
   sudo systemctl enable ecotrace
   ```

7. **Install Nginx (reverse proxy)**
   ```bash
   sudo apt-get install -y nginx
   ```

   Configure Nginx:
   ```bash
   sudo tee /etc/nginx/sites-available/ecotrace > /dev/null <<EOF
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade \$http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host \$host;
           proxy_cache_bypass \$http_upgrade;
       }
   }
   EOF
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/ecotrace /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```

8. **Install SSL certificate (Let's Encrypt)**
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

### Pricing:
- DigitalOcean Basic Droplet: $6/month
- AWS EC2 t3.micro (free tier first year)

---

## Post-Deployment Checklist

- [ ] All environment variables are set
- [ ] MongoDB connection is working
- [ ] Gemini API key is configured
- [ ] Admin credentials are changed from default
- [ ] Database is seeded with initial questions
- [ ] SSL/HTTPS is enabled (for production)
- [ ] Backup strategy is in place
- [ ] Monitoring and error logging is configured
- [ ] Rate limiting is configured (optional but recommended)

---

## Monitoring & Maintenance

### View Application Logs
```bash
# Vercel/Cloud Run
See in respective dashboards

# Heroku
heroku logs --tail

# Traditional VPS
sudo journalctl -u ecotrace -f
```

### Database Backups
```bash
# MongoDB Atlas (Recommended)
Enable automatic backups in Atlas dashboard

# Manual backup
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net/ecotrace"
```

### Update Application
```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Rebuild
npm run build

# Restart (depends on your setup)
```

---

## Troubleshooting Deployment Issues

### Build Fails
```bash
# Check Node version
node --version  # Should be 18+

# Clear cache
npm cache clean --force
rm -rf .next
npm install
npm run build
```

### Database Connection Error
```
Error: connect ECONNREFUSED
```
- Verify MONGODB_URI is correct
- Check MongoDB Atlas whitelisted IPs
- Ensure jwt_secret is set

### Application Crashes
```bash
# Check logs
# Verify all environment variables are set
# Ensure Node version matches (18+)
```

### High Memory Usage
- Increase server resources
- Check for memory leaks in logs
- Enable compression in Nginx

---

## Performance Optimization

### Database
- Enable MongoDB Atlas compression
- Add database indexes
- Archive old responses

### Application
- Enable Next.js compression
- Use CDN for static assets
- Configure caching headers

### Monitoring
```bash
# Monitor uptime
Use tools like UptimeRobot, Pingdom
```

---

## Security Best Practices

1. **Change Default Credentials**
   ```
   Admin user: NOT admin/admin123
   ```

2. **Use Strong JWT Secret**
   ```bash
   Generate: openssl rand -base64 32
   ```

3. **Enable MongoDB IP Whitelist**
   - Only allow server IP in MongoDB Atlas

4. **Use HTTPS/SSL**
   - Required for production

5. **Set up regular backups**

6. **Monitor error logs**

---

## Support

If deployment issues occur:
1. Check application logs
2. Verify all environment variables
3. Test MongoDB connection
4. Check Node.js and npm versions
5. Consult platform-specific documentation

Good luck with your deployment! 🚀
