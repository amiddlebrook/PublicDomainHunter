# Deploy Backend to Fix Registration

## The Problem
Your `BACKEND_URL` is pointing to the frontend worker itself, creating an infinite loop.
This is why registration fails with "Registration failed. Please try again."

## The Solution
Deploy the backend worker to get a separate URL, then update the frontend to use it.

## Step-by-Step Deployment

### 1. Deploy Backend Worker

```bash
cd backend-worker

# Create D1 database
npx wrangler d1 create publicdomainhunter
```

You'll get output like:
```
✅ Successfully created DB 'publicdomainhunter'!

[[d1_databases]]
binding = "DB"
database_name = "publicdomainhunter"
database_id = "abc123-your-database-id-here-xyz789"
```

**Copy the `database_id`** from the output.

### 2. Update Backend Configuration

Edit `backend-worker/wrangler.toml` and replace line 19:
```toml
database_id = "abc123-your-database-id-here-xyz789"  # Use the ID from step 1
```

### 3. Initialize Database Schema

```bash
npx wrangler d1 execute publicdomainhunter --file=./schema.sql
```

### 4. Set Secret Key

```bash
npx wrangler secret put SECRET_KEY
```

When prompted, enter a random 32+ character string, like:
```
my-super-secret-jwt-signing-key-change-this-in-production-12345
```

### 5. Deploy Backend Worker

```bash
npx wrangler deploy
```

You'll get output like:
```
✨ Deployment complete! Take a peek over at
   https://publicdomainhunter-backend.YOUR-SUBDOMAIN.workers.dev
```

**Copy this URL** - this is your backend URL!

### 6. Update Frontend Configuration

Go back to the root directory and edit `wrangler.toml`:
```bash
cd ..
```

Edit line 7 in `wrangler.toml`:
```toml
BACKEND_URL = "https://publicdomainhunter-backend.YOUR-SUBDOMAIN.workers.dev"
```

### 7. Deploy Frontend

```bash
npx wrangler deploy
```

### 8. Test Registration

Now go to your registration page and try creating an account with a password like:
- `MyPass1!` (has uppercase, lowercase, digit, special character)

You should see specific error messages if anything is wrong, instead of the generic error!

## Troubleshooting

### If you get "database_id not set" error:
Make sure you updated `backend-worker/wrangler.toml` with the actual database ID from step 1.

### If you get "SECRET_KEY not set" error:
Make sure you ran `npx wrangler secret put SECRET_KEY` in step 4.

### If registration still fails:
1. Check browser console for errors
2. Make sure BACKEND_URL in main `wrangler.toml` points to the backend worker (not itself)
3. Check that the backend worker is deployed: visit `https://publicdomainhunter-backend.YOUR-SUBDOMAIN.workers.dev/api/auth/register` - should return 404 or method not allowed (not a network error)

## Quick Reference

Valid password requirements:
- ✅ 8+ characters
- ✅ At least 1 uppercase letter (A-Z)
- ✅ At least 1 lowercase letter (a-z)
- ✅ At least 1 digit (0-9)
- ✅ At least 1 special character (!@#$%^&*()_+-=[]{}|;:,.<>?)

Example valid passwords:
- `MyPass1!`
- `Secure@123`
- `Test$abc9`
