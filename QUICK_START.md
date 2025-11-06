# 🚀 Quick Start Guide - Public Domain Hunter

## Why is the Works Page Empty?

The database is initialized but contains **zero works**. You need to import public domain content from external APIs.

## Prerequisites

Make sure you have Python dependencies installed:

```bash
pip install -r requirements.txt
```

## Option 1: Quick Start (No API Keys Required) ⚡

Import 100 works from Project Gutenberg and Internet Archive (both are free, no keys needed):

```bash
# Make the script executable
chmod +x scripts/import_initial_data.py

# Import 100 works from all free sources
python scripts/import_initial_data.py --count 100

# Or import specific content
python scripts/import_initial_data.py --search "shakespeare" --count 50
```

**This will take 2-5 minutes and give you instant content to browse!**

## Option 2: With API Keys (Recommended for Production) 🔑

Get free API keys for richer content:

### 1. Europeana (50M+ European Cultural Items)
- **Sign up**: https://pro.europeana.eu/page/get-api
- **Free tier**: 10,000 requests/day
- **Get key in**: ~5 minutes (instant approval)

### 2. DPLA (40M+ US Library Items)
- **Sign up**: https://pro.dp.la/developers/api-key-form
- **Free tier**: Unlimited
- **Get key in**: ~1 hour (email approval)

### 3. Use Your API Keys

```bash
# Set environment variables
export EUROPEANA_API_KEY="your_key_here"
export DPLA_API_KEY="your_key_here"

# Import from all sources (including API-based ones)
python scripts/import_initial_data.py --source all --count 200
```

Or pass keys directly:

```bash
python scripts/import_initial_data.py \
    --europeana-key "your_key" \
    --dpla-key "your_key" \
    --count 200
```

## Import Script Usage

### Basic Usage

```bash
# Import 50 works (default)
python scripts/import_initial_data.py

# Import 200 works
python scripts/import_initial_data.py --count 200

# Search for specific content
python scripts/import_initial_data.py --search "science fiction" --count 100
```

### Source-Specific Imports

```bash
# Import only from Project Gutenberg
python scripts/import_initial_data.py --source gutenberg --count 100

# Import only from Internet Archive
python scripts/import_initial_data.py --source archive --count 100

# Import from Europeana (requires API key)
python scripts/import_initial_data.py --source europeana --europeana-key "KEY" --count 50

# Import from DPLA (requires API key)
python scripts/import_initial_data.py --source dpla --dpla-key "KEY" --count 50

# Import from all sources
python scripts/import_initial_data.py --source all --count 200
```

## What Gets Imported?

Each work includes:
- ✅ Title and Author
- ✅ Publication year
- ✅ Public domain calculation
- ✅ Description/summary
- ✅ Source URL (for downloading)
- ✅ Media type (book, audio, video, etc.)
- ✅ Language
- ✅ Original source metadata

After import, the background analysis system will automatically:
- 📈 Calculate Google Trends scores
- 🏆 Fetch Amazon competition data
- 💰 Compute monetization potential
- 📊 Generate market insights

## Database Setup

### Initialize Database (First Time Only)

If you haven't set up the database yet:

```bash
# PostgreSQL
psql -U postgres -d publicdomainhunter -f n8n-workflows/init-db.sql

# Run migrations
python app/migrations/run_migration.py

# Or just start the app (auto-creates tables)
uvicorn app:app --reload
```

### Environment Variables

Create a `.env` file:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/publicdomainhunter

# Optional API Keys (for richer data)
EUROPEANA_API_KEY=your_key_here
DPLA_API_KEY=your_key_here
GOOGLE_TRENDS_API_KEY=your_key_here  # Optional
AMAZON_API_KEY=your_key_here          # Optional
AMAZON_SECRET_KEY=your_secret_here    # Optional

# Email (for password resets)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Frontend
FRONTEND_URL=http://localhost:3000
```

## Troubleshooting

### "No admin user found"
The script will automatically create an admin user with:
- Username: `admin`
- Email: `admin@publicdomainhunter.com`
- Password: `admin123`

**⚠️ Change this password in production!**

### "Database connection error"
Make sure PostgreSQL is running:
```bash
# Check if PostgreSQL is running
systemctl status postgresql

# Or for Docker
docker ps | grep postgres
```

### "API rate limit exceeded"
Reduce the `--count` parameter or wait a few minutes between imports.

### "Duplicate works skipped"
This is normal! The script prevents importing the same work twice.

## Advanced: Automated Imports with N8N

For automatic daily imports, use the included N8N workflows:

```bash
# Start N8N
docker-compose up n8n

# Access N8N at http://localhost:5678
# Import workflows from n8n-workflows/ directory
```

The `workflow-1-content-discovery.json` runs hourly and automatically discovers new public domain works.

## Next Steps

1. **Import initial data** (you are here)
2. **Browse works** at http://localhost:3000/works
3. **Search** at http://localhost:3000/search
4. **View analytics** at http://localhost:3000/analytics
5. **Set up alerts** at http://localhost:3000/alerts

## Support

- 📚 Full API docs: http://localhost:8000/docs
- 🐛 Issues: https://github.com/amiddlebrook/PublicDomainHunter/issues
- 📖 API documentation: See `API_SOURCES.md`

## Free Data Sources (No Keys Needed)

| Source | Items | Quality | Speed |
|--------|-------|---------|-------|
| Project Gutenberg | 70,000+ books | ⭐⭐⭐⭐⭐ | Fast |
| Internet Archive | 35M+ items | ⭐⭐⭐⭐ | Medium |

## Paid/API Key Sources

| Source | Items | Quality | Free Tier | Speed |
|--------|-------|---------|-----------|-------|
| Europeana | 50M+ items | ⭐⭐⭐⭐⭐ | 10k/day | Fast |
| DPLA | 40M+ items | ⭐⭐⭐⭐⭐ | Unlimited | Medium |
| HathiTrust | 17M+ volumes | ⭐⭐⭐⭐⭐ | Limited | Slow |

---

**🎉 Ready to Go!**

Start with the quick import and explore the platform:

```bash
python scripts/import_initial_data.py --count 100
```

Then visit http://localhost:3000/works to see your public domain library!
