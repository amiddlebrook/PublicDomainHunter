# 🚀 Simple Deployment Guide (100% Cloudflare Native)

This is a **completely self-contained** Cloudflare Workers + D1 solution.
**NO external backend needed!**

## ✅ What Changed

- ✅ Removed ALL external backend dependencies
- ✅ Worker handles authentication directly with D1
- ✅ Clean, minimal codebase
- ✅ Uses Web Crypto API for password hashing (Cloudflare native)

## 📋 Deploy Commands (Windows PowerShell)

You already created the database! Now just:

### 1. Initialize Database Tables

```powershell
npx wrangler d1 execute publicdomainhunter_db --file=./schema.sql
```

### 2. Build Frontend

```powershell
cd frontend
npm install
npm run build
cd ..
```

### 3. Deploy!

```powershell
npx wrangler deploy
```

## ✅ Test It

After deployment:

1. **Health Check**: https://publicdomainhunter.averymiddlebrook2014.workers.dev/health

   Should return:
   ```json
   {
     "status": "ok",
     "d1_database": "connected"
   }
   ```

2. **Register**: https://publicdomainhunter.averymiddlebrook2014.workers.dev/register

   Try creating an account with:
   - Email: test@example.com
   - Username: testuser
   - Password: Test123!@# (must have uppercase, lowercase, digit, special char)

## 🎯 What This Does

- `POST /api/auth/register` - Creates new user in D1 database
- `POST /api/auth/login` - Authenticates user
- `GET /health` - Health check
- All other paths - Serves Next.js frontend

## 🗄️ Database

View users:
```powershell
npx wrangler d1 execute publicdomainhunter_db --command="SELECT id, email, username, created_at FROM users"
```

## 💡 Architecture

```
User Browser
    ↓
Cloudflare Worker (worker-d1.ts)
    ├─→ D1 Database (users table)
    └─→ Static Assets (Next.js frontend)
```

**That's it! Everything runs on Cloudflare.**
