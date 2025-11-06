# Quick Start: Getting Login to Work

Your Cloudflare-native authentication is almost ready! The deployment failed because you need to create a KV namespace first. Here's how to fix it:

## Step 1: Create KV Namespace (Required)

### Option A: Using Cloudflare Dashboard (Easiest)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your account
3. Click **Workers & Pages** in the left sidebar
4. Click **KV** tab
5. Click **Create namespace**
6. Name it: `SESSIONS`
7. Click **Add**
8. **Copy the Namespace ID** (looks like: `abc123def456...`)

### Option B: Using Wrangler CLI (Local)

```bash
# Make sure you're logged in
npx wrangler login

# Create production namespace
npx wrangler kv namespace create "SESSIONS"

# Create preview namespace (for development)
npx wrangler kv namespace create "SESSIONS" --preview
```

This will output something like:
```
{ binding = "SESSIONS", id = "abc123def456..." }
{ binding = "SESSIONS", preview_id = "xyz789abc123..." }
```

## Step 2: Update wrangler.toml

Open `wrangler.toml` and replace the placeholder IDs (around line 28-29):

```toml
[[kv_namespaces]]
binding = "SESSIONS"
id = "abc123def456..."  # <-- Paste your production namespace ID here
preview_id = "xyz789abc123..."  # <-- Paste your preview namespace ID here
```

## Step 3: Update Backend URL (Required)

In `wrangler.toml` line 7, replace with your actual backend URL:

```toml
BACKEND_URL = "https://your-actual-backend-url.com"
```

## Step 4: Redeploy

```bash
git add wrangler.toml
git commit -m "Configure KV namespace for sessions"
git push
```

Or manually trigger a deployment in the Cloudflare dashboard.

## Step 5: Configure OAuth (Optional)

If you want Google/GitHub login to work, you also need to:

### For Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID
3. Add redirect URI: `https://your-domain.com/auth/callback/google`
4. In Cloudflare dashboard, go to **Workers & Pages** > Your Worker > **Settings** > **Variables**
5. Add secrets:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

### For GitHub OAuth:
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create New OAuth App
3. Add callback URL: `https://your-domain.com/auth/callback/github`
4. In Cloudflare dashboard, add secrets:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`

## What Works Now

Once you complete Steps 1-4:
- ✅ Username/password login (existing functionality)
- ✅ Session storage at the edge
- ✅ Session validation in Worker
- ❌ OAuth login (requires Step 5)

## Testing

After deployment:
1. Visit your site
2. Go to `/login`
3. Try logging in with username/password
4. You should see OAuth buttons (they'll work once you complete Step 5)

## Troubleshooting

**Still getting KV namespace error?**
- Make sure you updated BOTH `id` and `preview_id` in wrangler.toml
- Check that you saved the file
- Commit and push the changes

**OAuth buttons not working?**
- Check that you added the OAuth secrets in Cloudflare dashboard
- Verify redirect URIs match exactly (no trailing slashes)
- Check browser console for errors

**Backend not receiving user info?**
- Verify `BACKEND_URL` is correct in wrangler.toml
- Check that backend has the `/api/auth/oauth` endpoint

## Need More Help?

See the comprehensive guide: [CLOUDFLARE_AUTH_SETUP.md](./CLOUDFLARE_AUTH_SETUP.md)
