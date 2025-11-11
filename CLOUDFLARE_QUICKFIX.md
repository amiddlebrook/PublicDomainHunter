# 🚨 Cloudflare Deployment - Quick Fix

## The Problem

Your deployment is failing with:
```
KV namespace 'your-kv-namespace-id' is not valid. [code: 10042]
```

## The Solution (5 minutes)

### Step 1: Create KV Namespace
1. Go to https://dash.cloudflare.com/
2. Click **Workers & Pages** → **KV**
3. Click **Create a namespace**
4. Name: `SESSIONS`
5. Click **Add**

### Step 2: Bind KV to Your Pages Project
1. Go to **Workers & Pages**
2. Select **publicdomainhunter** project
3. Go to **Settings** → **Functions**
4. Scroll to **KV namespace bindings**
5. Click **Add binding**
6. Set:
   - Variable name: `SESSIONS`
   - KV namespace: Select the namespace you created
7. Click **Save**

### Step 3: Set Backend URL
1. Still in Settings, go to **Environment variables**
2. Click **Add variables**
3. Set:
   - Variable name: `BACKEND_URL`
   - Value: Your backend URL (or `https://api.example.com` for testing)
   - Environment: **Production** (and Preview if needed)
4. Click **Save**

### Step 4: Redeploy
1. Go to **Deployments** tab
2. Click **Retry deployment** on the failed build
   OR
3. Push a new commit to trigger rebuild

## ✅ Done!

Your deployment should now succeed. The frontend will be live at:
```
https://publicdomainhunter.pages.dev
```

## What About the Backend?

The backend (FastAPI Python app) needs to be deployed separately since Cloudflare Workers don't support Python. Options:

1. **Railway**: Deploy in 5 minutes - https://railway.app
2. **Render**: Free tier available - https://render.com
3. **DigitalOcean**: $6/month droplet
4. **AWS/GCP**: Enterprise scale

Update the `BACKEND_URL` environment variable with your backend URL once deployed.

## What About OAuth Login?

To enable Google/GitHub login, add these environment variables in **Settings** → **Environment variables**:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET` (mark as encrypted)
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET` (mark as encrypted)

See [CLOUDFLARE_AUTH_SETUP.md](CLOUDFLARE_AUTH_SETUP.md) for getting OAuth credentials.

## Need More Help?

- **Detailed guide**: [CLOUDFLARE_PAGES_SETUP.md](CLOUDFLARE_PAGES_SETUP.md)
- **OAuth setup**: [CLOUDFLARE_AUTH_SETUP.md](CLOUDFLARE_AUTH_SETUP.md)
- **General setup**: [SETUP.md](SETUP.md)

---

**TL;DR**: Create KV namespace in Cloudflare Dashboard → Bind it to your Pages project → Set BACKEND_URL → Redeploy
