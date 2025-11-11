# Backend Deployment Guide

This guide will help you deploy the Public Domain Hunter backend API to a cloud platform so that account registration and other features work properly.

## Prerequisites

- Git repository with your code
- GitHub account (for connecting to deployment platforms)

---

## Option 1: Railway (Recommended - Fastest)

Railway is the easiest and fastest option. Free tier available.

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway

```bash
railway login
```

This will open a browser window for authentication.

### Step 3: Deploy

```bash
cd /home/user/PublicDomainHunter

# Initialize Railway project
railway init

# Deploy the backend
railway up

# Add PostgreSQL database
railway add --database postgres

# Set environment variables
railway variables set SECRET_KEY=$(openssl rand -hex 32)
railway variables set ENVIRONMENT=production

# Generate a public domain
railway domain
```

### Step 4: Get Your Backend URL

After `railway domain`, you'll get a URL like:
```
https://publicdomainhunter-production.up.railway.app
```

### Step 5: Update Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → Your project
3. Go to **Settings** → **Environment variables**
4. Update `BACKEND_URL` to your Railway URL:
   ```
   https://publicdomainhunter-production.up.railway.app
   ```
5. Click **Save**
6. Redeploy your site

### Verify Deployment

```bash
# Check if backend is running
curl https://your-railway-url.up.railway.app/health

# Expected response:
# {"status":"healthy","service":"Public Domain Hunter API"}
```

---

## Option 2: Render

Render offers a free tier with automatic HTTPS.

### Step 1: Create Render Account

Go to [dashboard.render.com](https://dashboard.render.com/) and sign up.

### Step 2: Deploy from Dashboard

1. Click **New** → **Blueprint**
2. Connect your GitHub repository
3. Render will detect `render.yaml` and configure everything automatically
4. Click **Apply**
5. Wait 5-10 minutes for deployment

**OR** deploy manually:

1. Click **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `publicdomainhunter-api`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free
4. Add environment variables:
   - `SECRET_KEY`: Click "Generate" for a random value
   - `ENVIRONMENT`: `production`
5. Click **Create Web Service**

### Step 3: Add PostgreSQL Database

1. In Render Dashboard, click **New** → **PostgreSQL**
2. Name: `publicdomainhunter-db`
3. Plan: Free
4. Click **Create Database**
5. Copy the **Internal Database URL**
6. Go back to your Web Service → **Environment**
7. Add variable:
   - `DATABASE_URL`: paste the database URL

### Step 4: Get Your Backend URL

Your backend will be available at:
```
https://publicdomainhunter-api.onrender.com
```

### Step 5: Update Cloudflare Pages

Follow the same steps as Railway Option 1, Step 5.

---

## Option 3: Fly.io

Fly.io offers excellent performance with a generous free tier.

### Step 1: Install Fly CLI

```bash
curl -L https://fly.io/install.sh | sh
```

### Step 2: Login

```bash
fly auth login
```

### Step 3: Launch App

```bash
cd /home/user/PublicDomainHunter

# Create fly.toml configuration
fly launch --dockerfile Dockerfile.backend --no-deploy

# Add PostgreSQL
fly postgres create

# Connect database to app
fly postgres attach <postgres-app-name>

# Set environment variables
fly secrets set SECRET_KEY=$(openssl rand -hex 32)
fly secrets set ENVIRONMENT=production

# Deploy
fly deploy
```

### Step 4: Get Your Backend URL

```bash
fly info
```

Look for the hostname, it will be something like:
```
https://publicdomainhunter.fly.dev
```

### Step 5: Update Cloudflare Pages

Follow the same steps as Railway Option 1, Step 5.

---

## Option 4: Docker on VPS (Advanced)

If you have your own VPS (DigitalOcean, AWS EC2, etc.):

### Step 1: Install Docker

```bash
# On Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### Step 2: Deploy with Docker Compose

```bash
# Clone your repo
git clone https://github.com/yourusername/PublicDomainHunter.git
cd PublicDomainHunter

# Create .env file
cat > .env <<EOF
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/public_domain_hunter
SECRET_KEY=$(openssl rand -hex 32)
ENVIRONMENT=production
EOF

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

### Step 3: Configure Nginx (for HTTPS)

Install Certbot and configure SSL:

```bash
# Install Nginx and Certbot
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx

# Configure Nginx
sudo nano /etc/nginx/sites-available/publicdomainhunter

# Add this configuration:
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/publicdomainhunter /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com
```

Your backend will be available at:
```
https://api.yourdomain.com
```

---

## After Deployment - Update Cloudflare Pages

**For ALL deployment options above:**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → Your Pages project
3. Click **Settings** → **Environment variables**
4. Find `BACKEND_URL` and update it to your deployed backend URL
5. Click **Save**
6. Go to **Deployments** tab
7. Click **Retry deployment** on the latest deployment

**Important**: Make sure the URL:
- ✅ Includes `https://`
- ✅ Does NOT have a trailing slash
- ✅ Is accessible from the internet

---

## Verify Everything is Working

### 1. Test Backend Health

```bash
curl https://your-backend-url/health
```

Expected response:
```json
{"status":"healthy","service":"Public Domain Hunter API"}
```

### 2. Test Cloudflare Worker Health

Visit in browser:
```
https://your-site.pages.dev/auth/health
```

Expected response:
```json
{
  "status": "ok",
  "cloudflare_worker": "running",
  "backend_configured": true,
  "backend_url": "https://your-backend-url",
  "backend_status": "reachable",
  "backend_http_status": 200
}
```

### 3. Test Registration

1. Visit `https://your-site.pages.dev/register`
2. Fill in the registration form:
   - Email: `test@example.com`
   - Username: `testuser`
   - Password: `TestPass123!` (must meet requirements)
   - Full Name: `Test User`
3. Click **Create account**
4. Should redirect to login page successfully

---

## Troubleshooting

### Issue: "Backend not reachable"

**Check backend logs:**

**Railway:**
```bash
railway logs
```

**Render:**
Go to Dashboard → Your Service → Logs

**Fly.io:**
```bash
fly logs
```

### Issue: Database connection errors

Make sure `DATABASE_URL` environment variable is set correctly.

**Format:**
```
postgresql://username:password@host:port/database
```

**Railway/Render:** Should be auto-configured if you added the database through their dashboard.

### Issue: "Module not found" errors

Make sure all dependencies are in `requirements.txt` and the build completed successfully.

### Issue: Port binding errors

Make sure your start command uses `$PORT` environment variable:
```bash
uvicorn app:app --host 0.0.0.0 --port $PORT
```

---

## Environment Variables Reference

Required environment variables for production:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SECRET_KEY` | Secret key for JWT tokens | `your-secret-key` (generate with `openssl rand -hex 32`) |
| `ENVIRONMENT` | Environment name | `production` |

Optional environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT token expiry | `30` |
| `REDIS_URL` | Redis connection (for caching) | None |

---

## Cost Comparison

| Platform | Free Tier | Pros | Cons |
|----------|-----------|------|------|
| **Railway** | $5 credit/month | Easiest setup, auto-scaling | Paid after credit |
| **Render** | 750 hours/month | Free tier, auto-SSL | Slower cold starts |
| **Fly.io** | 3 VMs free | Fast, great DX | Learning curve |
| **VPS** | Varies | Full control | Requires DevOps knowledge |

---

## Quick Reference Commands

### Railway
```bash
railway login
railway init
railway up
railway add --database postgres
railway domain
railway logs
```

### Render
- Use web dashboard at dashboard.render.com
- Or use Render CLI: `npm install -g render-cli`

### Fly.io
```bash
fly auth login
fly launch
fly postgres create
fly deploy
fly logs
fly info
```

---

## Next Steps After Deployment

1. ✅ Backend deployed and running
2. ✅ Database created and connected
3. ✅ `BACKEND_URL` updated in Cloudflare Pages
4. ✅ Test `/auth/health` endpoint
5. ✅ Test user registration
6. 🔐 Set up OAuth (optional - see `CLOUDFLARE_AUTH_SETUP.md`)
7. 📧 Configure email service (optional - for password reset)
8. 📊 Set up monitoring and alerts

---

## Support

If you encounter issues:

1. Check the health endpoints:
   - Backend: `https://your-backend/health`
   - Cloudflare: `https://your-site/auth/health`

2. Review logs on your deployment platform

3. See `REGISTRATION_TROUBLESHOOTING.md` for registration-specific issues

4. Check GitHub Issues for known problems
