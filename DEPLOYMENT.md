# 🚀 Public Domain Hunter - Production Deployment Guide

This guide will help you deploy Public Domain Hunter to production using Docker Compose and various cloud providers.

## 📋 Prerequisites

- Docker and Docker Compose installed
- A domain name (for SSL certificates)
- API keys for external services (Google Trends, Amazon, Stripe, etc.)

## 🔧 Quick Start (Local Production Setup)

1. **Clone and setup:**
   ```bash
   git clone https://github.com/amiddlebrook/PublicDomainHunter.git
   cd PublicDomainHunter
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.production
   # Edit .env.production with your actual values
   ```

3. **Deploy:**
   ```bash
   ./deploy.sh production
   ```

## 🌐 Domain and SSL Setup

### Option 1: Let's Encrypt (Recommended)

1. Install certbot:
   ```bash
   # Ubuntu/Debian
   sudo apt install certbot

   # Or use Docker
   docker run -it --rm -v /etc/letsencrypt:/etc/letsencrypt certbot/certbot certonly --standalone -d yourdomain.com
   ```

2. Update nginx configuration with real certificates:
   ```nginx
   ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
   ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
   ```

### Option 2: Self-Signed (Development Only)
The deployment script generates self-signed certificates for testing.

## ☁️ Cloud Deployment Options

### Option A: DigitalOcean Droplet

1. Create a droplet with Docker pre-installed
2. Point your domain's A record to the droplet IP
3. Deploy using the provided script

### Option B: AWS ECS (Elastic Container Service)

1. Create an ECS cluster
2. Build and push images to Amazon ECR
3. Update docker-compose.prod.yml for ECS
4. Deploy using AWS CLI or Console

### Option C: Railway/Heroku

For simpler deployments, consider using platforms like Railway or Heroku that handle much of the infrastructure for you.

### Option D: Cloudflare Workers + Pages Assets

The repository includes a Cloudflare Worker configuration that serves the statically exported Next.js frontend directly from Cloudflare's edge while proxying `/api` requests to your FastAPI backend.

1. **Configure environment**
   ```bash
   cp wrangler.toml wrangler.local.toml # optional local override
   # Edit wrangler.toml (or wrangler.local.toml) and set BACKEND_URL to your FastAPI deployment
   ```

2. **Build the frontend for static hosting**
   ```bash
   npm --prefix frontend install
   npm --prefix frontend run cf:build
   ```

3. **Deploy to Cloudflare**
   ```bash
   npx wrangler deploy
   ```

The Worker defined in `cloudflare/worker.ts` handles asset serving (with SPA fallbacks) and forwards API traffic to the backend specified by `BACKEND_URL`. Update the environment variable in Cloudflare after deploying to ensure runtime requests hit the correct backend origin.

## 🔑 Required API Keys

### Google Trends API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google Trends API
3. Create credentials (API Key)
4. Add to `GOOGLE_TRENDS_API_KEY`

### Amazon Product Advertising API
1. Sign up for Amazon Associates
2. Apply for Product Advertising API access
3. Create API credentials
4. Add `AMAZON_API_KEY`, `AMAZON_SECRET_KEY`, and `AMAZON_ASSOCIATE_TAG`

### Stripe (for payments)
1. Create a [Stripe account](https://stripe.com)
2. Get your publishable and secret keys
3. Add webhook endpoint for payment events

## 📊 Monitoring and Logging

### Application Monitoring
```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Monitor specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Health Checks
- Backend: `https://yourdomain.com/api/health`
- Frontend: `https://yourdomain.com/health`

## 🛠️ Maintenance

### Database Backups
```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres public_domain_hunter > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres public_domain_hunter < backup.sql
```

### Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild and deploy
./deploy.sh production
```

## 🔒 Security Checklist

- [ ] Change all default passwords
- [ ] Use strong SECRET_KEY (32+ characters)
- [ ] Set up proper SSL certificates
- [ ] Configure firewall (ufw, security groups)
- [ ] Set up fail2ban for SSH protection
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity

## 📞 Support

For issues and questions:
- Check the logs: `docker-compose logs`
- Review the application logs in the `logs/` directory
- Open an issue on GitHub

## 🎯 Production Checklist

- [ ] Domain name configured
- [ ] SSL certificate installed
- [ ] All API keys configured
- [ ] Database backed up
- [ ] Monitoring set up
- [ ] Email notifications working
- [ ] Payment processing tested
- [ ] Application tested in production environment

---

**Happy Deploying! 🎉**
