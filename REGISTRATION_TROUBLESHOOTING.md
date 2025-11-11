# Account Registration Troubleshooting Guide

## Quick Diagnosis

Visit the health check endpoint to diagnose the issue:
- **Production**: `https://your-site.pages.dev/auth/health`
- **Local**: `http://localhost:8787/auth/health`

The health check will show:
- ✅ Cloudflare Worker status
- ✅ Backend URL configuration
- ✅ Backend connectivity status
- ✅ KV namespace status

---

## Common Issues and Solutions

### Issue 1: "Backend not configured" Error

**Symptoms:**
- Registration fails immediately
- Error message: "BACKEND_URL environment variable is not set"

**Solution:**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → Your project
3. Go to **Settings** → **Environment variables**
4. Add a new variable:
   - **Name**: `BACKEND_URL`
   - **Value**: Your backend API URL (e.g., `https://api.yourdomain.com`)
   - **Environment**: Production (and Preview if needed)
5. Click **Save**
6. Redeploy your site (push a new commit or click "Retry deployment")

**Note:** Make sure the URL includes the protocol (`https://`) and does NOT have a trailing slash.

---

### Issue 2: "Failed to connect to backend" Error

**Symptoms:**
- Registration hangs then fails
- Error message: "Could not reach backend"
- Health check shows `backend_status: unreachable`

**Root Cause:** Your backend API is not deployed or not accessible from the internet.

**Solution Options:**

#### Option A: Backend Not Deployed Yet

If you haven't deployed your backend, you need to deploy the FastAPI application first:

**Deploy to Railway (Easiest):**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize and deploy
railway init
railway up

# Get your backend URL
railway domain
```

**Deploy to Render:**
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `publicdomainhunter-api`
   - **Environment**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `SECRET_KEY`: A secure random string
6. Click **Create Web Service**
7. Copy the deployment URL and use it as `BACKEND_URL`

**Deploy to Fly.io:**
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login and launch
fly auth login
fly launch

# Deploy
fly deploy

# Get your backend URL
fly info
```

#### Option B: Backend Behind Firewall

If your backend is deployed but not accessible:
1. Check firewall rules - ensure port 80/443 are open
2. Check security groups (AWS) or firewall rules (GCP/Azure)
3. Verify your backend has a public IP or domain
4. Test manually: `curl https://your-backend-url/health`

#### Option C: CORS Issues

If the backend is reachable but registration still fails, check CORS settings in your backend:

File: `app/main.py`
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### Issue 3: Database Connection Errors

**Symptoms:**
- Registration fails with "Database error"
- Backend logs show connection errors

**Solution:**
1. Verify your database is running and accessible
2. Check the `DATABASE_URL` environment variable in your backend
3. Format: `postgresql://user:password@host:port/database`
4. Ensure the database has been initialized:
   ```bash
   # Run migrations
   alembic upgrade head
   ```

---

### Issue 4: Password Validation Errors

**Symptoms:**
- Registration fails with password requirements message

**Solution:**
Make sure your password meets ALL requirements:
- ✅ At least 8 characters long
- ✅ Contains at least one uppercase letter (A-Z)
- ✅ Contains at least one lowercase letter (a-z)
- ✅ Contains at least one digit (0-9)
- ✅ Contains at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)

**Example valid password:** `MyPass123!`

---

### Issue 5: "Email already registered" or "Username already taken"

**Symptoms:**
- Registration fails with these specific error messages

**Solution:**
- Try a different email address or username
- If you forgot your password, use the "Forgot Password" feature (if implemented)
- Contact admin to reset your account if needed

---

## Testing Registration Locally

To test the full stack locally:

### 1. Start Backend
```bash
cd /path/to/PublicDomainHunter

# Start with Docker Compose (recommended)
docker-compose up -d

# OR start manually
cd app
uvicorn main:app --reload --port 8000
```

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Test Registration
Visit `http://localhost:3000/register` and try creating an account.

---

## Verifying Backend is Working

Test your backend directly:

### 1. Check Health Endpoint
```bash
curl https://your-backend-url/health
# Should return: {"status": "ok"}
```

### 2. Test Registration Endpoint Directly
```bash
curl -X POST https://your-backend-url/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPass123!",
    "full_name": "Test User"
  }'
```

**Expected Response:**
```json
{
  "id": 1,
  "email": "test@example.com",
  "username": "testuser",
  "full_name": "Test User",
  "is_active": true,
  "is_superuser": false,
  "created_at": "2024-01-15T12:00:00Z"
}
```

---

## Architecture Overview

Understanding how registration works:

```
┌──────────────────┐
│   User Browser   │
└────────┬─────────┘
         │ POST /api/auth/register
         │ (email, username, password)
         ↓
┌────────────────────────────┐
│  Cloudflare Pages Worker   │
│  (cloudflare/worker.ts)    │
└────────┬───────────────────┘
         │ Proxies to
         ↓
┌────────────────────────────┐
│   FastAPI Backend          │
│   (app/auth_api.py)        │
└────────┬───────────────────┘
         │ Writes to
         ↓
┌────────────────────────────┐
│   PostgreSQL Database      │
└────────────────────────────┘
```

**Key Points:**
- The frontend sends registration requests to `/api/auth/register`
- Cloudflare Worker proxies the request to your backend
- Backend validates data and creates user in database
- Response flows back through Worker to frontend

---

## Debugging Checklist

Use this checklist to diagnose registration issues:

- [ ] Visit `/auth/health` - does it show all services as healthy?
- [ ] Is `BACKEND_URL` set in Cloudflare Pages environment variables?
- [ ] Can you access your backend URL directly in a browser?
- [ ] Does your backend `/health` endpoint return 200 OK?
- [ ] Is your database running and accessible?
- [ ] Are your password requirements met?
- [ ] Check browser console for JavaScript errors
- [ ] Check Cloudflare Pages logs for errors
- [ ] Check backend logs for errors

---

## Getting More Help

### 1. Check Cloudflare Pages Logs
1. Go to Cloudflare Dashboard
2. Navigate to your Pages project
3. Click on **Functions** tab
4. View **Real-time logs**

### 2. Check Browser Console
1. Open your site
2. Press F12 (or Cmd+Option+I on Mac)
3. Go to **Console** tab
4. Try registering and look for errors

### 3. Test with Curl
```bash
# Test health check
curl -v https://your-site.pages.dev/auth/health

# Test registration
curl -v -X POST https://your-site.pages.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPass123!",
    "full_name": "Test User"
  }'
```

---

## Quick Fix Summary

**Most Common Solution:**
```bash
# 1. Deploy your backend (e.g., to Railway)
railway login
railway init
railway up
BACKEND_URL=$(railway domain)

# 2. Set BACKEND_URL in Cloudflare
# Go to: Cloudflare Dashboard > Your Project > Settings > Environment Variables
# Add: BACKEND_URL = https://your-backend-url.railway.app

# 3. Redeploy frontend
git commit --allow-empty -m "Trigger redeploy with backend URL"
git push
```

---

## Still Having Issues?

1. **Check the health endpoint**: `/auth/health`
2. **Review backend logs**: Look for connection or database errors
3. **Test backend directly**: Use curl to test the API
4. **Verify environment variables**: Double-check all required vars are set
5. **Check CORS settings**: Ensure backend allows requests from your domain

For more help:
- See `CLOUDFLARE_PAGES_SETUP.md` for deployment instructions
- See `CLOUDFLARE_AUTH_SETUP.md` for OAuth configuration
- Check GitHub Issues for known problems
