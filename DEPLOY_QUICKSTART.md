# 🚀 Deployment Quick Start Guide

This is a quick reference guide for deploying Public Domain Hunter to Cloudflare. For detailed information, see [CLOUDFLARE_NATIVE_SETUP.md](CLOUDFLARE_NATIVE_SETUP.md).

## Prerequisites

- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed: `npm install -g wrangler`
- Cloudflare account with appropriate permissions
- Authenticated with Wrangler: `wrangler login`

## Quick Setup (Automated)

Use the interactive setup script to guide you through all steps:

```bash
./setup-cloudflare.sh
```

## Manual Setup (Step-by-Step)

Follow these steps in order for manual setup:

### 1. Create Infrastructure

#### Create CACHE KV Namespace
```bash
# Create production namespace
wrangler kv:namespace create "CACHE"

# Create preview namespace
wrangler kv:namespace create "CACHE" --preview
```

**📝 Important:** Copy the namespace IDs from the output and update `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_CACHE_KV_ID_HERE"          # Replace with production ID
preview_id = "YOUR_CACHE_KV_PREVIEW_ID_HERE"  # Replace with preview ID
```

#### Create R2 Bucket
```bash
# Create R2 bucket for file storage
wrangler r2 bucket create publicdomainhunter-files
```

#### Create Queue
```bash
# Create queue for background jobs
wrangler queues create publicdomainhunter-jobs
```

### 2. Set Secrets

#### Required Secret
```bash
# Set JWT secret (use a strong random string, min 32 characters)
wrangler secret put JWT_SECRET
```

**💡 Tip:** Generate a secure secret:
```bash
openssl rand -base64 32
```

#### Optional Secrets (for AI features)
```bash
# OpenAI API key (optional)
wrangler secret put OPENAI_API_KEY

# Claude API key (optional)
wrangler secret put CLAUDE_API_KEY
```

### 3. Initialize Database

```bash
# Initialize D1 database with schema
wrangler d1 execute publicdomainhunter_db --file=schema.sql
```

### 4. Deploy

```bash
# Deploy to Cloudflare
wrangler deploy
```

## Verification

After deployment, verify everything is working:

### Check Deployment Status
```bash
# View deployment logs
wrangler tail

# Check queue status
wrangler queues list

# Query database
wrangler d1 execute publicdomainhunter_db --command "SELECT COUNT(*) FROM User"
```

### Test Endpoints

Your application should now be live at `https://publicdomainhunter.pages.dev` (or your custom domain).

Test key endpoints:
- `GET /api/health` - Health check
- `POST /api/auth/register` - User registration
- `GET /api/works` - List works

## Common Issues

### Issue: Database not found
**Solution:** The database should already be created. If not, run:
```bash
wrangler d1 create publicdomainhunter_db
```
Then update the `database_id` in `wrangler.toml`.

### Issue: KV namespace not found
**Solution:** Make sure you've created both production and preview namespaces and updated the IDs in `wrangler.toml`.

### Issue: Queue not found
**Solution:** The queue should be created during setup. Verify with:
```bash
wrangler queues list
```

### Issue: Secrets not set
**Solution:** Secrets must be set before deployment. Re-run the secret commands.

## Next Steps After Deployment

1. **Set up custom domain** (optional)
   - Go to Cloudflare Dashboard → Pages → publicdomainhunter → Custom domains
   - Add your domain and configure DNS

2. **Configure monitoring**
   - Enable Analytics Engine in `wrangler.toml`
   - Set up Cloudflare Logpush for long-term log retention

3. **Set up cron triggers** (optional)
   - Add cron schedules in `wrangler.toml` for periodic tasks

4. **Test all features**
   - User registration and authentication
   - Work search and filtering
   - AI analysis (if API keys configured)
   - File uploads to R2

5. **Monitor usage**
   - Check Cloudflare Dashboard for usage metrics
   - Ensure you're within free tier limits (or upgrade as needed)

## Cost Estimation

### Free Tier Limits
- **Workers:** 100,000 requests/day
- **D1:** 5 GB storage, 5M reads/day, 100K writes/day
- **KV:** 100,000 reads/day, 1,000 writes/day, 1 GB storage
- **R2:** 10 GB storage, 1M Class A operations/month
- **Queues:** 1M operations/month

For most small-to-medium applications, the free tier should be sufficient.

### Paid Plans (if needed)
- **Workers Paid:** $5/month + $0.50 per million requests
- **D1:** $5/month + usage-based charges
- **KV:** $5/month + $0.50 per million reads
- **R2:** $0.015 per GB/month storage

For detailed cost analysis, see [COST_GUIDE.md](COST_GUIDE.md).

## Additional Resources

- [CLOUDFLARE_NATIVE_SETUP.md](CLOUDFLARE_NATIVE_SETUP.md) - Complete setup documentation
- [CLOUDFLARE_AUTH_SETUP.md](CLOUDFLARE_AUTH_SETUP.md) - OAuth configuration
- [DEPLOYMENT.md](DEPLOYMENT.md) - General deployment guide
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)

## Support

If you encounter issues:
1. Check the [Troubleshooting](#common-issues) section above
2. Review Cloudflare Dashboard for error messages
3. Check deployment logs: `wrangler tail`
4. Open an issue on GitHub with detailed error information

---

**Last Updated:** 2025-11-11  
**Maintainer:** Public Domain Hunter Team
