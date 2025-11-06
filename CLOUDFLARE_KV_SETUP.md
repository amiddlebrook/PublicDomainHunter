# Cloudflare KV Setup for Authentication

This guide will help you enable authentication features by setting up a KV namespace in Cloudflare Pages.

## Why is this needed?

Your application uses Cloudflare KV (Key-Value storage) to store user accounts and session data. This is a Cloudflare-native solution that runs entirely on Cloudflare's edge network without needing external databases.

## Setup Steps (5 minutes)

### Option 1: Cloudflare Dashboard (Recommended)

1. **Create the KV Namespace**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to **Workers & Pages** → **KV**
   - Click **Create namespace**
   - Name it: `AUTH_STORE`
   - Click **Add**

2. **Bind KV to your Pages Project**
   - Go to **Workers & Pages**
   - Click on your **PublicDomainHunter** project
   - Go to **Settings** → **Functions**
   - Scroll down to **KV namespace bindings**
   - Click **Add binding**
   - Set **Variable name**: `AUTH_STORE`
   - Select **KV namespace**: `AUTH_STORE` (the one you just created)
   - Click **Save**

3. **Deploy**
   - Make a new commit and push to trigger a deployment
   - OR go to **Deployments** and click **Retry deployment**

That's it! Authentication will now work.

### Option 2: Using Wrangler CLI

If you prefer using the command line:

```bash
# Create KV namespace
npx wrangler kv namespace create "AUTH_STORE"

# This will output something like:
# id = "abc123..."
# Copy the ID

# Update wrangler.toml (uncomment and add the ID)
[[kv_namespaces]]
binding = "AUTH_STORE"
id = "your-kv-namespace-id-here"
preview_id = "your-preview-id-here"

# Deploy
git add wrangler.toml
git commit -m "Add KV namespace for authentication"
git push
```

## What happens after setup?

Once the KV namespace is configured:

- ✅ Users can register new accounts
- ✅ Users can login with username/email and password
- ✅ Sessions are stored securely in KV
- ✅ OAuth login (Google/GitHub) can be enabled (requires additional setup)
- ✅ All user data is stored in Cloudflare KV (no external database needed)

## Verifying it works

After setup, try to register a new account:

1. Go to your app's `/register` page
2. Fill in the registration form
3. If you get "Authentication not configured" error, the KV binding wasn't set up correctly
4. If registration succeeds, you're all set! 🎉

## Cost

Cloudflare KV is included in the Workers free tier:
- **100,000 reads/day** - free
- **1,000 writes/day** - free
- **1 GB storage** - free

This is more than enough for most applications. See [Cloudflare KV pricing](https://developers.cloudflare.com/kv/platform/pricing/) for details.

## Troubleshooting

**Error: "Authentication not configured"**
- Make sure you completed step 2 (binding KV to Pages project)
- Try redeploying your application

**Error: "KV namespace not found"**
- Make sure the namespace name is exactly `AUTH_STORE`
- Check that the binding variable name is also `AUTH_STORE`

**Still having issues?**
- Check your Pages project settings under **Functions** → **KV namespace bindings**
- Make sure the namespace exists in **Workers & Pages** → **KV**
- Try creating a new deployment

## Security Notes

- Passwords are hashed using SHA-256 before storage
- Sessions expire after 7 days
- Session cookies are HttpOnly (can't be accessed by JavaScript)
- All authentication happens on Cloudflare's edge network
