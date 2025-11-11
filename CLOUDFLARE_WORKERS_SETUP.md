# Cloudflare Workers Registration Fix

Your site is deployed at: `https://publicdomainhunter.averymiddlebrook2014.workers.dev/`

Registration is failing because the backend API isn't deployed yet. Here's how to fix it.

---

## Quick Fix (10 minutes)

### Option 1: Automated Script

```bash
cd /home/user/PublicDomainHunter
./fix-workers-registration.sh
```

This script will:
1. Deploy your backend to Railway
2. Update your configuration
3. Redeploy your worker

### Option 2: Manual Steps

#### Step 1: Deploy Backend

**Railway (Fastest):**
```bash
./deploy-railway.sh
```

Copy the URL you get (e.g., `https://publicdomainhunter-production.up.railway.app`)

**Render (Free tier):**
1. Go to [dashboard.render.com](https://dashboard.render.com/)
2. Click **New** → **Blueprint**
3. Connect your GitHub repo
4. Click **Apply**
5. Copy your URL when ready

#### Step 2: Update BACKEND_URL

**Option A: Via Cloudflare Dashboard**

1. Go to https://dash.cloudflare.com/
2. Navigate to: **Workers & Pages** → **publicdomainhunter**
3. Click: **Settings** → **Variables and Secrets**
4. Add/Update:
   - **Variable name**: `BACKEND_URL`
   - **Value**: Your backend URL (e.g., `https://publicdomainhunter-production.up.railway.app`)
5. Click **Save and Deploy**

**Option B: Via wrangler.toml**

Edit `wrangler.toml` line 18:
```toml
BACKEND_URL = "https://publicdomainhunter-production.up.railway.app"
```

Then redeploy:
```bash
wrangler deploy
```

---

## Verify It's Working

### 1. Check Backend Health

```bash
curl https://your-backend-url/health
```

**Expected:**
```json
{"status":"healthy","service":"Public Domain Hunter API"}
```

### 2. Check Worker Health

```bash
curl https://publicdomainhunter.averymiddlebrook2014.workers.dev/auth/health
```

**Expected:**
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

Visit: https://publicdomainhunter.averymiddlebrook2014.workers.dev/register

Fill in:
- **Email**: `test@example.com`
- **Username**: `testuser`
- **Password**: `TestPass123!` (must have uppercase, lowercase, number, special char)
- **Full Name**: `Test User`

Click **Create account** - should work! ✅

---

## Current Issue

When you visit `/auth/health`, you see:
```json
{
  "status": "degraded",
  "backend_url": "https://your-backend.example.com",
  "backend_status": "error",
  "backend_http_status": 530
}
```

This means:
- ❌ `BACKEND_URL` points to a fake domain
- ❌ Backend isn't deployed
- ❌ Registration can't work without a real backend

---

## Why This Happens

Your Cloudflare Worker is a proxy/frontend layer that needs to communicate with a FastAPI backend:

```
User Browser
    ↓
Cloudflare Worker (https://publicdomainhunter.averymiddlebrook2014.workers.dev)
    ↓ proxies /api/* requests to
FastAPI Backend (needs to be deployed!)
    ↓
PostgreSQL Database
```

The Worker is deployed ✅
The Backend is NOT deployed ❌ ← This is the problem

---

## Deployment Platforms Comparison

| Platform | Setup Time | Free Tier | Best For |
|----------|-----------|-----------|----------|
| **Railway** | 5 min | $5 credit/month | Fastest setup |
| **Render** | 10 min | 750 hours/month | Free hosting |
| **Fly.io** | 10 min | 3 VMs free | Performance |

All three work great - Railway is fastest.

---

## Environment Variables Reference

Your backend needs these environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | Auto-set by Railway/Render |
| `SECRET_KEY` | JWT secret | Auto-generated |
| `ENVIRONMENT` | Deployment environment | `production` |

These are automatically configured when using Railway or Render blueprint.

---

## Troubleshooting

### "Module 'wrangler' not found"

```bash
npm install -g wrangler
wrangler login
```

### "Railway command not found"

```bash
npm install -g @railway/cli
railway login
```

### Backend deployed but registration still fails

Check your Worker's environment variables:

```bash
wrangler tail
```

Then try registering and look for error messages.

Or check via dashboard:
1. Go to https://dash.cloudflare.com/
2. Workers & Pages → publicdomainhunter
3. Settings → Variables and Secrets
4. Verify `BACKEND_URL` is set correctly

### Registration works but login fails

Make sure `SECRET_KEY` is the same on your backend and hasn't changed between deployments.

---

## Next Steps After Registration Works

1. ✅ **Test login** - Make sure you can log in with your new account
2. ✅ **Test API endpoints** - Try accessing protected routes
3. 🔐 **Set up OAuth** (optional) - See `CLOUDFLARE_AUTH_SETUP.md`
4. 📧 **Configure email** (optional) - For password reset
5. 📊 **Set up monitoring** - Track errors and performance

---

## Quick Command Reference

```bash
# Deploy backend to Railway
./deploy-railway.sh

# Update wrangler.toml BACKEND_URL
sed -i 's|BACKEND_URL = ".*"|BACKEND_URL = "https://your-url"|' wrangler.toml

# Deploy to Cloudflare Workers
wrangler deploy

# View Worker logs
wrangler tail

# Test backend
curl https://your-backend-url/health

# Test Worker
curl https://publicdomainhunter.averymiddlebrook2014.workers.dev/auth/health

# Test registration
curl -X POST https://publicdomainhunter.averymiddlebrook2014.workers.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPass123!",
    "full_name": "Test User"
  }'
```

---

## Support

If you're still having issues:

1. Check `/auth/health` endpoint - what does it show?
2. Run `wrangler tail` and try registering - what errors appear?
3. Check backend logs on Railway/Render
4. See `REGISTRATION_TROUBLESHOOTING.md` for detailed debugging
5. See `DEPLOYMENT_GUIDE.md` for alternative deployment methods

---

## Summary

**Problem**: Registration fails because `BACKEND_URL` points to a fake domain

**Solution**:
1. Deploy backend with `./deploy-railway.sh`
2. Update `BACKEND_URL` in Cloudflare Dashboard or `wrangler.toml`
3. Redeploy worker
4. Test registration - it will work! ✅
