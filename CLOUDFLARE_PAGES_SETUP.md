# Cloudflare Pages Deployment Setup Guide

## Issues to Fix

Your deployment is failing with:
```
KV namespace 'your-kv-namespace-id' is not valid. [code: 10042]
```

This happens because the `wrangler.toml` file contains placeholder values that need to be configured in the **Cloudflare Dashboard**.

## Quick Fix Steps

### 1. Create KV Namespace

1. Go to your [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **KV**
3. Click **Create a namespace**
4. Name it: `SESSIONS` (or any name you prefer)
5. Click **Add**
6. **Copy the Namespace ID** (looks like: `abc123def456...`)

### 2. Bind KV Namespace to Your Pages Project

1. In Cloudflare Dashboard, go to **Workers & Pages**
2. Select your **publicdomainhunter** project
3. Go to **Settings** → **Functions**
4. Scroll to **KV namespace bindings**
5. Click **Add binding**
6. Configure:
   - **Variable name**: `SESSIONS` (must match wrangler.toml)
   - **KV namespace**: Select the namespace you just created
7. Click **Save**

### 3. Set Environment Variables

Still in **Settings** → **Environment variables**:

1. Add **BACKEND_URL**:
   - **Variable name**: `BACKEND_URL`
   - **Value**: Your FastAPI backend URL (e.g., `https://api.yourdomain.com`)
   - **Environment**: Production (and Preview if needed)
   - Click **Save**

### 4. Deploy Your Backend (if not already deployed)

The Cloudflare Worker needs a backend to communicate with. You have several options:

**Option A: Deploy to a traditional server**
- Deploy the FastAPI backend to AWS, DigitalOcean, Heroku, etc.
- Use the public URL as your `BACKEND_URL`

**Option B: Use a service like Railway/Render**
- Push your backend code to these platforms
- They'll give you a public URL to use

**Option C: Temporary placeholder for testing**
- For now, you can use: `https://api.example.com` (won't work but will allow deployment)
- The frontend will deploy but API calls will fail until you deploy the backend

### 5. Optional: Set OAuth Secrets (for authentication)

If you want OAuth login to work:

In **Settings** → **Environment variables**, add:

1. `GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
2. `GOOGLE_CLIENT_SECRET` - Your Google OAuth Secret (mark as secret/encrypted)
3. `GITHUB_CLIENT_ID` - Your GitHub OAuth Client ID
4. `GITHUB_CLIENT_SECRET` - Your GitHub OAuth Secret (mark as secret/encrypted)

See `CLOUDFLARE_AUTH_SETUP.md` for details on getting these credentials.

### 6. Trigger a New Deployment

After configuring the above:

1. Go to **Deployments** tab in your Pages project
2. Click **Retry deployment** on the failed deployment
   OR
3. Push a new commit to trigger a new build:
   ```bash
   git commit --allow-empty -m "Trigger rebuild with KV binding"
   git push
   ```

## Architecture Overview

```
┌─────────────────┐
│  Cloudflare     │
│  Pages Worker   │  ← Serves Next.js frontend
│                 │  ← Handles OAuth /auth/*
│                 │  ← Proxies API calls /api/*
└────────┬────────┘
         │
         ├─→ Cloudflare KV (SESSIONS)
         │   └─ Stores user sessions
         │
         └─→ FastAPI Backend (BACKEND_URL)
             └─ Handles business logic, database
```

## Verifying Setup

After deployment succeeds:

1. **Visit your site**: `https://publicdomainhunter.pages.dev`
2. **Check health**: The frontend should load
3. **Test API**: API calls will fail until backend is deployed
4. **Test OAuth**: Auth will fail until OAuth credentials are set

## Common Issues

### Issue: "KV namespace not valid"
**Solution**: Make sure you:
1. Created the KV namespace in the dashboard
2. Bound it to your Pages project with variable name `SESSIONS`
3. Triggered a new deployment after binding

### Issue: "BACKEND_URL not configured"
**Solution**:
1. Set the `BACKEND_URL` environment variable in Pages settings
2. Ensure it includes the protocol: `https://`
3. Redeploy after setting the variable

### Issue: API calls return 500/502 errors
**Solution**: Your backend is either:
1. Not deployed yet - deploy it first
2. Not accessible - check firewall/CORS settings
3. Wrong URL - verify BACKEND_URL is correct

## Alternative: Use wrangler.toml with Real IDs

Instead of using Cloudflare Dashboard bindings, you can update `wrangler.toml` directly:

1. Create KV namespace locally:
   ```bash
   # Install wrangler if needed
   npm install -g wrangler

   # Login to Cloudflare
   wrangler login

   # Create KV namespace
   wrangler kv namespace create "SESSIONS"
   wrangler kv namespace create "SESSIONS" --preview
   ```

2. Update `wrangler.toml` with the IDs from the output:
   ```toml
   [[kv_namespaces]]
   binding = "SESSIONS"
   id = "abc123..." # Replace with your production ID
   preview_id = "xyz789..." # Replace with your preview ID
   ```

3. Update BACKEND_URL in `wrangler.toml`:
   ```toml
   [vars]
   BACKEND_URL = "https://your-actual-backend-url.com"
   ```

4. Commit and push:
   ```bash
   git add wrangler.toml
   git commit -m "Configure KV namespace and backend URL"
   git push
   ```

## Next Steps

1. ✅ Configure KV namespace binding in Cloudflare Dashboard
2. ✅ Set BACKEND_URL environment variable
3. ✅ Trigger new deployment
4. 🚀 Deploy your FastAPI backend separately
5. 🔐 Configure OAuth credentials (optional)
6. ✨ Test the full application

## Need Help?

- Check the build logs in Cloudflare Pages dashboard
- Review `CLOUDFLARE_AUTH_SETUP.md` for OAuth setup
- Review `SETUP.md` for backend deployment options
