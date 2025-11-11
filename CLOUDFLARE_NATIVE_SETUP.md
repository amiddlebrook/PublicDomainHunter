# Cloudflare-Native Architecture Setup

This document describes the fully Cloudflare-native architecture for Public Domain Hunter.

## Architecture Overview

Public Domain Hunter is now a 100% Cloudflare-native application using:

- **Cloudflare Pages** - Frontend hosting (Next.js 14)
- **Cloudflare Workers** - Backend API (TypeScript/Hono)
- **Cloudflare D1** - SQLite database
- **Cloudflare KV** - Session storage & caching
- **Cloudflare R2** - File storage (EPUB, PDF uploads)
- **Cloudflare Queues** - Background job processing
- **Cloudflare Analytics Engine** - Event tracking (optional)

## Infrastructure Setup

### 1. Create D1 Database

```bash
# Create the D1 database
wrangler d1 create publicdomainhunter_db

# Note the database ID returned, update it in wrangler.toml
# It should already be set to: Igxqh5q9hvRTXvSu6NGxJ1yVu_KMblakHlMlRSJ3

# Initialize the database schema
wrangler d1 execute publicdomainhunter_db --file=schema.sql
```

### 2. Create KV Namespaces

```bash
# Sessions namespace (already configured)
# ID: 25c5b93996de4bce81e0b336471b4141

# Create cache namespace
wrangler kv:namespace create "CACHE"
wrangler kv:namespace create "CACHE" --preview

# Update the IDs in wrangler.toml under [[kv_namespaces]] for CACHE
```

### 3. Create R2 Bucket

```bash
# Create R2 bucket for file storage
wrangler r2 bucket create publicdomainhunter-files

# For preview environment (optional)
wrangler r2 bucket create publicdomainhunter-files-preview
```

### 4. Create Cloudflare Queue

```bash
# Create queue for background jobs
wrangler queues create publicdomainhunter-jobs

# Create dead letter queue
wrangler queues create publicdomainhunter-jobs-dlq
```

### 5. Set Environment Variables & Secrets

```bash
# Required: JWT secret for authentication
wrangler secret put JWT_SECRET
# Enter a strong random string (min 32 characters)

# Optional: AI/LLM API keys
wrangler secret put OPENAI_API_KEY
wrangler secret put CLAUDE_API_KEY
wrangler secret put GEMINI_API_KEY
wrangler secret put OPENROUTER_API_KEY

# Optional: Other service API keys
wrangler secret put AMAZON_API_KEY
wrangler secret put AMAZON_SECRET_KEY
wrangler secret put AMAZON_ASSOCIATE_TAG
```

### 6. Configure Cron Triggers (Optional)

Add to `wrangler.toml`:

```toml
[triggers]
crons = ["0 0 * * *"]  # Run metrics updates daily at midnight
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login (returns JWT)
- `GET /api/auth/me` - Get current user (requires JWT)

### Works

- `GET /api/works` - List works with pagination & filters
- `GET /api/works/:id` - Get single work
- `POST /api/works` - Create new work (authenticated)

### Search

- `GET /api/search?q=query` - Search works (local + external)
- `GET /api/search/trending` - Get trending works
- `GET /api/search/opportunities` - Get top monetization opportunities

### Alerts

- `POST /api/alerts` - Create alert (authenticated)
- `GET /api/alerts` - Get user's alerts (authenticated)
- `DELETE /api/alerts/:id` - Delete alert (authenticated)

### AI/LLM

- `POST /api/ai/analyze` - Analyze work with AI (authenticated)
- `POST /api/ai/marketing` - Generate marketing content (authenticated)

### Analytics

- `GET /api/analytics/works/:id` - Get work analytics
- `GET /api/analytics/user/stats` - Get user statistics (authenticated)
- `GET /api/analytics/popular` - Get popular works

### Files

- `POST /api/files/upload` - Upload file to R2 (authenticated)
- `GET /api/files/:key` - Download file from R2

### External Sources

- `POST /api/external/import` - Import work from external source (authenticated)

## Background Job Types

The queue system processes these job types:

1. **alert_check** - Check if alerts should trigger based on metrics
2. **metrics_update** - Update work metrics (trends, search volume, etc.)
3. **email_send** - Send email notifications
4. **work_import** - Import works from external sources (Gutenberg, Archive.org)

## Service Architecture

### Core Services

Located in `cloudflare/services/`:

#### Database Services (`db/`)

- `user.service.ts` - User CRUD operations
- `work.service.ts` - Work CRUD operations
- `metrics.service.ts` - Work metrics operations
- `alert.service.ts` - Alert management

#### Business Logic Services

- `search.service.ts` - Search across local DB and external sources
- `analytics.service.ts` - Track events and generate analytics
- `llm.service.ts` - AI/LLM integrations (OpenAI, Claude, Gemini, OpenRouter)
- `public-domain.service.ts` - External API integrations (Gutenberg, Internet Archive)
- `storage.service.ts` - R2 file storage operations

#### Utilities (`utils/`)

- `crypto.ts` - Password hashing/verification (PBKDF2)
- `jwt.ts` - JWT token generation/verification (HS256)

## External Data Sources

### Project Gutenberg (via Gutendex API)

- URL: https://gutendex.com
- No API key required
- Searches public domain books in English

### Internet Archive

- URL: https://archive.org
- No API key required
- Searches across texts, images, audio, video

## Security Features

### Password Security

- PBKDF2 hashing with random salt
- 100,000 iterations
- SHA-256 hash function
- Minimum requirements:
  - 8 characters minimum
  - Must contain uppercase, lowercase, and number

### JWT Authentication

- HS256 algorithm
- 24-hour expiration
- Includes user ID, email, username in payload

### API Authentication

- Bearer token authentication
- `Authorization: Bearer <jwt-token>`
- Invalid/expired tokens return 401 Unauthorized

## Deployment

### Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# This runs: wrangler dev
```

### Production Deployment

```bash
# Build and deploy
npm run deploy

# Or deploy with wrangler directly
wrangler deploy
```

### Database Migrations

```bash
# Run migrations on production D1
wrangler d1 execute publicdomainhunter_db --file=schema.sql

# Query the database
wrangler d1 execute publicdomainhunter_db --command "SELECT * FROM User LIMIT 5"
```

## Monitoring & Debugging

### View Logs

```bash
# Tail production logs
wrangler tail

# Filter by specific log level
wrangler tail --format pretty
```

### Queue Metrics

```bash
# View queue statistics
wrangler queues list
```

### D1 Metrics

```bash
# View database metrics in Cloudflare Dashboard
# Navigate to: Workers & Pages → D1 → publicdomainhunter_db → Metrics
```

## Cost Optimization

### Free Tier Limits

- **Workers**: 100,000 requests/day
- **D1**: 5 GB storage, 5M reads/day, 100K writes/day
- **KV**: 100,000 reads/day, 1,000 writes/day, 1 GB storage
- **R2**: 10 GB storage, 1M Class A operations/month
- **Queues**: 1M operations/month

### Cost-Saving Tips

1. **Enable caching** - Use CACHE KV namespace to reduce D1 reads
2. **Batch operations** - Queue jobs are processed in batches
3. **Optimize queries** - Use indexes, LIMIT clauses
4. **CDN everything** - Static assets served from Cloudflare edge

## Migration from Python Backend

The original Python/FastAPI backend has been fully replaced:

| Python Component | Cloudflare Replacement |
|------------------|------------------------|
| PostgreSQL | D1 (SQLite) |
| Redis | KV Namespaces |
| Local file storage | R2 Buckets |
| Celery/Background tasks | Queues + Scheduled Workers |
| SQLAlchemy ORM | Direct SQL with D1 |
| FastAPI | Hono framework |
| Python HTTP clients | Web Fetch API |

## Next Steps

1. ✅ Infrastructure is configured
2. ✅ All services are implemented
3. ✅ API endpoints are ready
4. ⏳ Initialize D1 database with schema
5. ⏳ Set environment variables/secrets
6. ⏳ Deploy to Cloudflare Pages
7. ⏳ Test all endpoints
8. ⏳ Set up monitoring/alerts

## Troubleshooting

### Common Issues

**Issue**: `Error: D1 database not found`
**Solution**: Run `wrangler d1 create publicdomainhunter_db` and update the ID in wrangler.toml

**Issue**: `Error: KV namespace not found`
**Solution**: Create KV namespace and update binding IDs in wrangler.toml

**Issue**: `Error: JWT secret not configured`
**Solution**: Run `wrangler secret put JWT_SECRET` and enter a strong secret

**Issue**: Queue messages not processing
**Solution**: Check queue consumer is deployed: `wrangler queues consumer list publicdomainhunter-jobs`

## Support

For issues or questions:
- Check Cloudflare documentation: https://developers.cloudflare.com
- Review Worker logs: `wrangler tail`
- Check D1 status: Cloudflare Dashboard → Workers & Pages → D1
