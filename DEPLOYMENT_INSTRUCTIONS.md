# 🚀 Cloudflare Workers Deployment - Complete Guide

## ⚠️ Important: Deploy from Your LOCAL Machine

Due to proxy restrictions in the Claude Code environment, **you need to run the deployment from your local machine** where you have:
- Node.js and npm installed
- Direct internet access (no interfering proxy)
- Your Cloudflare API token

---

## 🎯 Quick Deploy (Automated Script)

### Step 1: Clone or Pull Latest Changes

On your local machine:

```bash
git clone https://github.com/amiddlebrook/PublicDomainHunter.git
cd PublicDomainHunter

# Or if already cloned:
git pull origin claude/account-registration-011CV2biaDJLVN2HZ51fUuXm
```

### Step 2: Run the Deployment Script

```bash
# Make the script executable
chmod +x deploy-cloudflare.sh

# Set your API token
export CLOUDFLARE_API_TOKEN='Igxqh5q9hvRTXvSu6NGxJ1yVu_KMblakHlMlRSJ3'

# Run the deployment
./deploy-cloudflare.sh
```

The script will automatically:
1. ✅ Create the D1 database
2. ✅ Update wrangler.toml with database ID
3. ✅ Create all database tables
4. ✅ Build the frontend
5. ✅ Deploy to Cloudflare Workers

---

## 📖 Manual Deployment (Step by Step)

If you prefer to run commands manually:

### Step 1: Create D1 Database

```bash
npx wrangler d1 create publicdomainhunter_db
```

**Output will look like:**
```
✅ Successfully created D1 database publicdomainhunter_db
[[d1_databases]]
binding = "DB"
database_name = "publicdomainhunter_db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Copy the `database_id`!**

### Step 2: Update wrangler.toml

Open `wrangler.toml` and find the `[[d1_databases]]` section. Replace `PLACEHOLDER_DB_ID` with your actual database_id:

```toml
[[d1_databases]]
binding = "DB"
database_name = "publicdomainhunter_db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ← PASTE YOUR ID HERE
```

Save the file.

### Step 3: Create Database Tables

```bash
npx wrangler d1 execute publicdomainhunter_db --file=./schema.sql
```

This creates all the necessary tables (users, works, alerts, etc.)

### Step 4: Build Frontend

```bash
cd frontend
npm install
npm run cf:build
cd ..
```

### Step 5: Deploy

```bash
npx wrangler deploy
```

---

## ✅ Verify Deployment

After deployment completes, test your site:

### 1. Homepage
```bash
curl https://publicdomainhunter.averymiddlebrook2014.workers.dev/
```
Should return HTML (not "Access denied")

### 2. Health Check
```bash
curl https://publicdomainhunter.averymiddlebrook2014.workers.dev/auth/health
```

**Expected response:**
```json
{
  "status": "ok",
  "cloudflare_worker": "running",
  "backend_configured": true,
  "backend_url": "https://your-backend.example.com",
  "backend_status": "reachable",
  "kv_configured": false
}
```

### 3. Registration Page

Visit: https://publicdomainhunter.averymiddlebrook2014.workers.dev/register

Should show the registration form!

---

## 🔧 Post-Deployment Configuration

### Option A: Using D1 Database (Current Setup)

The current deployment uses Cloudflare D1 (SQLite) as the database. The worker is configured to use the `DB` binding.

**This works out of the box - no additional backend needed!**

### Option B: Using External Backend

If you want to use the FastAPI backend instead:

1. Set `BACKEND_URL` environment variable in Cloudflare Dashboard:
   - Go to: Workers & Pages → publicdomainhunter → Settings → Variables
   - Add: `BACKEND_URL` = your backend URL (e.g., Railway/Render deployment)

2. Deploy your FastAPI backend separately:
   ```bash
   # Example for Railway
   railway up

   # Example for Render
   # Connect GitHub repo and deploy from dashboard
   ```

### Configure OAuth (Optional)

For Google/GitHub login, add these in Cloudflare Dashboard → Settings → Variables:

```
GOOGLE_CLIENT_ID = your-google-client-id
GOOGLE_CLIENT_SECRET = your-secret (mark as encrypted)
GITHUB_CLIENT_ID = your-github-client-id
GITHUB_CLIENT_SECRET = your-secret (mark as encrypted)
```

See `CLOUDFLARE_AUTH_SETUP.md` for detailed OAuth setup.

### Configure KV Namespace (Optional - for sessions)

For persistent sessions with OAuth:

1. Create KV namespace: Dashboard → Workers & Pages → KV → Create "SESSIONS"
2. Bind to worker: Settings → Variables → KV Namespace Bindings
   - Variable name: `SESSIONS`
   - Select your namespace

---

## 🐛 Troubleshooting

### Issue: "database_id not found"

**Solution**: Make sure you updated `wrangler.toml` with the actual database_id from Step 1.

### Issue: "Tables already exist"

**Solution**: This is fine! It means the database was already initialized. You can skip the schema step.

### Issue: "Frontend not building"

**Solution**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run cf:build
```

### Issue: "Access denied" error

**Causes**:
1. API token expired - create a new one
2. Wrong token permissions - needs: Workers Scripts Edit, D1 Edit, Account Settings Read
3. Proxy interference - make sure you're running from your local machine, not a remote environment

**Solution**: Verify token:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.cloudflare.com/client/v4/user/tokens/verify
```

Should return `{"success":true,...}`

### Issue: Registration returns error

Check the D1 database:
```bash
npx wrangler d1 execute publicdomainhunter_db --command="SELECT * FROM users"
```

---

## 📊 Database Management

### View all users:
```bash
npx wrangler d1 execute publicdomainhunter_db --command="SELECT id, email, username, created_at FROM users"
```

### Reset database (WARNING: Deletes all data):
```bash
npx wrangler d1 execute publicdomainhunter_db --command="DELETE FROM users"
```

### Backup database:
```bash
npx wrangler d1 export publicdomainhunter_db --output=backup.sql
```

### Restore from backup:
```bash
npx wrangler d1 execute publicdomainhunter_db --file=backup.sql
```

---

## 🔄 Updates and Redeployment

After making code changes:

```bash
# Pull latest changes
git pull origin claude/account-registration-011CV2biaDJLVN2HZ51fUuXm

# Rebuild frontend
cd frontend && npm run cf:build && cd ..

# Deploy
npx wrangler deploy
```

Or use the automated script:
```bash
./deploy-cloudflare.sh
```

---

## 📋 What Gets Deployed

### Worker Code
- `cloudflare/worker.ts` - Main worker routing
- `cloudflare/auth.ts` - OAuth and authentication logic

### Frontend
- Built from `frontend/` directory
- Statically exported Next.js app
- Served from `frontend/out/`

### Database
- D1 (SQLite) database with all tables
- Bound as `DB` in worker
- Schema defined in `schema.sql`

---

## 🆘 Need Help?

### Check deployment logs:
```bash
npx wrangler tail publicdomainhunter
```

### View worker logs in real-time:
1. Go to Cloudflare Dashboard
2. Workers & Pages → publicdomainhunter
3. Logs tab → Real-time logs

### Test endpoints:
```bash
# Health check
curl https://publicdomainhunter.averymiddlebrook2014.workers.dev/auth/health

# Test registration (should fail without valid data but show it's working)
curl -X POST https://publicdomainhunter.averymiddlebrook2014.workers.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"Test123!@#"}'
```

---

## ✨ Summary

**Files Created/Updated:**
- ✅ `schema.sql` - D1 database schema
- ✅ `deploy-cloudflare.sh` - Automated deployment script
- ✅ `wrangler.toml` - Added D1 database configuration
- ✅ This guide - Complete deployment instructions

**Next Steps:**
1. Run `./deploy-cloudflare.sh` from your local machine
2. Test the deployed site
3. Try registering an account!

**Your Token:**
```
CLOUDFLARE_API_TOKEN=Igxqh5q9hvRTXvSu6NGxJ1yVu_KMblakHlMlRSJ3
```

This token has all required permissions:
- ✅ Workers Scripts: Edit
- ✅ D1: Edit
- ✅ Account Settings: Read
- ✅ Cloudflare Pages: Edit
- ✅ Workers KV Storage: Edit

---

**Good luck with the deployment! 🚀**
