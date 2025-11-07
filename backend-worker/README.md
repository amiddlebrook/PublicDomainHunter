# Public Domain Hunter - Cloudflare Backend Worker

100% Cloudflare backend using Workers + D1 database.

## Quick Deploy

```bash
cd backend-worker

# 1. Install dependencies
npm install

# 2. Create D1 database
npx wrangler d1 create publicdomainhunter

# 3. Copy the database_id from output and update wrangler.toml
# Update line: database_id = "your-database-id-here"

# 4. Initialize database schema
npx wrangler d1 execute publicdomainhunter --file=./schema.sql

# 5. Set SECRET_KEY secret (for JWT signing)
npx wrangler secret put SECRET_KEY
# Enter a random 32+ character string

# 6. Deploy the worker
npx wrangler deploy
```

## After Deployment

You'll get a URL like: `https://publicdomainhunter-backend.YOUR-SUBDOMAIN.workers.dev`

Update the main `wrangler.toml` file with this URL:
```toml
BACKEND_URL = "https://publicdomainhunter-backend.YOUR-SUBDOMAIN.workers.dev"
```

Then deploy the frontend:
```bash
cd ..
npx wrangler deploy
```

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/oauth` - OAuth login/registration
- `GET /api/auth/me` - Get current user (requires JWT)

## Database Management

```bash
# Execute SQL queries
npx wrangler d1 execute publicdomainhunter --command="SELECT * FROM users"

# Run migrations
npx wrangler d1 execute publicdomainhunter --file=./schema.sql

# Backup database
npx wrangler d1 export publicdomainhunter --output=backup.sql
```

## Local Development

```bash
# Start local dev server
npm run dev

# Access at: http://localhost:8787
```

## Environment Variables

Set these as secrets (never commit them):

- `SECRET_KEY` - JWT signing key (32+ characters)

```bash
npx wrangler secret put SECRET_KEY
```
