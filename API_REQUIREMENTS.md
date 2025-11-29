# API Requirements - Complete Reference

**Single Source of Truth for ALL API Integrations**

This document lists every external API required for the Public Domain Hunter application to function with real data.

---

## 📋 Quick Status Overview

| Category | APIs Needed | Status | Priority |
|----------|-------------|--------|----------|
| **Authentication** | Google OAuth, GitHub OAuth | ⚠️ Coded but not configured | HIGH |
| **Market Data** | SEMrush/Ahrefs, Amazon, Etsy | ❌ Not configured - showing fake data | HIGH |
| **Content Sources** | Gutenberg, Internet Archive | ✅ Partially working | MEDIUM |
| **AI/LLM** | OpenAI, Claude, Gemini | ⚠️ Coded but optional | LOW |
| **Media Metadata** | TMDb, Wikipedia | ⚠️ Partial (Wikipedia works) | MEDIUM |

---

## 🔐 Section 1: Authentication APIs

### Google OAuth (Sign in with Google)
- **Status:** ❌ NOT CONFIGURED - showing "Google OAuth not configured" error
- **Purpose:** User authentication via Google account
- **Cost:** FREE
- **Required Environment Variables:**
  - `GOOGLE_CLIENT_ID` - Get from Google Cloud Console
  - `GOOGLE_CLIENT_SECRET` - Get from Google Cloud Console
- **Setup Instructions:**
  1. Go to https://console.cloud.google.com/
  2. Create a new project or select existing
  3. Enable Google+ API
  4. Create OAuth 2.0 credentials
  5. Add authorized redirect URI: `https://publicdomainhunter.com/auth/google/callback`
  6. Copy Client ID and Client Secret
  7. Add to Cloudflare environment variables
- **Documentation:** https://developers.google.com/identity/protocols/oauth2

### GitHub OAuth (Sign in with GitHub)
- **Status:** ⚠️ Coded but not configured
- **Purpose:** User authentication via GitHub account
- **Cost:** FREE
- **Required Environment Variables:**
  - `GITHUB_CLIENT_ID` - Get from GitHub Settings
  - `GITHUB_CLIENT_SECRET` - Get from GitHub Settings
- **Setup Instructions:**
  1. Go to https://github.com/settings/developers
  2. Click "New OAuth App"
  3. Set callback URL: `https://publicdomainhunter.com/auth/github/callback`
  4. Copy Client ID and Client Secret
  5. Add to Cloudflare environment variables
- **Documentation:** https://docs.github.com/en/developers/apps/building-oauth-apps

---

## 📊 Section 2: Market Intelligence APIs

**⚠️ CRITICAL: All market signals currently use FAKE calculated data. Configure these APIs for REAL data.**

### Search Volume API (Choose ONE)

#### Option A: SEMrush API ⭐ RECOMMENDED
- **Cost:** $119.95/month minimum
- **Provides:** Real monthly search volume, keyword difficulty, CPC, competitive analysis
- **Setup:** https://www.semrush.com/api-analytics/
- **Rate Limits:** 10,000 API units/day
- **Environment Variable:** `SEMRUSH_API_KEY`

#### Option B: Ahrefs API
- **Cost:** $99/month minimum
- **Provides:** Search volume, keyword difficulty, click metrics
- **Setup:** https://ahrefs.com/api
- **Environment Variable:** `AHREFS_API_KEY`

#### Option C: SerpAPI (Budget Option)
- **Cost:** $50/month for 5,000 searches
- **Provides:** Google search results scraping, search volume estimates
- **Setup:** https://serpapi.com/
- **Environment Variable:** `SERPAPI_KEY`

### Competition & Saturation APIs

#### Amazon Product Advertising API (REQUIRED)
- **Cost:** FREE (need Amazon Associates account)
- **Provides:** Product listing counts, best seller ranks, pricing, reviews
- **Setup:** https://affiliate-program.amazon.com/assoc_credentials/home
- **Rate Limits:** 1 request/second, 8,640/day
- **Environment Variables:**
  - `AMAZON_ACCESS_KEY`
  - `AMAZON_SECRET_KEY`
  - `AMAZON_ASSOCIATE_TAG`

#### Etsy API
- **Cost:** FREE
- **Provides:** Listing counts by search term, pricing data
- **Setup:** https://www.etsy.com/developers/documentation
- **Rate Limits:** 10,000/day
- **Environment Variable:** `ETSY_API_KEY`

### Trend Data APIs

#### Wikipedia Pageviews API
- **Status:** ✅ CONFIGURED - currently working
- **Cost:** FREE
- **Provides:** Real 30-day pageview data
- **No configuration needed** - public API

#### Google Trends API (Unofficial)
- **Status:** ⚠️ Coded but not active
- **Cost:** FREE
- **Provides:** Interest over time, regional interest
- **Library:** pytrends or unofficial API
- **Rate Limits:** ~400 requests/hour
- **No API key needed** - just activate in code

### Monetization Intelligence APIs

#### Jungle Scout API
- **Cost:** $29/month minimum
- **Provides:** Estimated monthly sales, revenue estimates
- **Setup:** https://www.junglescout.com/
- **Environment Variable:** `JUNGLE_SCOUT_API_KEY`

#### Printful API
- **Cost:** FREE
- **Provides:** Product pricing, manufacturing costs
- **Setup:** https://www.printful.com/docs
- **Environment Variable:** `PRINTFUL_API_KEY`

#### Printify API
- **Cost:** FREE
- **Provides:** Product catalog, pricing tiers
- **Setup:** https://developers.printify.com/
- **Environment Variable:** `PRINTIFY_API_KEY`

---

## 📚 Section 3: Content Source APIs

### Project Gutenberg API
- **Status:** ✅ Working via Gutendex
- **Cost:** FREE
- **URL:** https://gutendex.com/books/
- **Provides:** 70,000+ public domain books
- **No API key required**

### Internet Archive API
- **Status:** ⚠️ Partial integration
- **Cost:** FREE (higher limits with API key)
- **URL:** https://archive.org/advancedsearch.php
- **Provides:** 35+ million items
- **Environment Variable (optional):** `INTERNET_ARCHIVE_API_KEY`
- **Rate Limits:** 1,500/hour with key, 150/hour without

### Europeana API
- **Status:** ❌ Not integrated
- **Cost:** FREE (registration required)
- **URL:** https://api.europeana.eu/
- **Provides:** 50+ million European cultural items
- **Environment Variable:** `EUROPEANA_API_KEY`
- **Rate Limits:** 10,000/day

---

## 🤖 Section 4: AI & LLM APIs

All AI APIs are **optional** - the app works without them but provides enhanced features when configured.

### OpenAI API
- **Status:** ⚠️ Coded but not configured
- **Purpose:** GPT models for content analysis, recommendations
- **Cost:** Pay-per-use ($0.03-$0.06 per 1K tokens)
- **Setup:** https://platform.openai.com/api-keys
- **Environment Variable:** `OPENAI_API_KEY`

### Anthropic Claude API
- **Status:** ⚠️ Coded but not configured
- **Purpose:** Claude models for analysis
- **Cost:** Pay-per-use
- **Setup:** https://console.anthropic.com/
- **Environment Variable:** `CLAUDE_API_KEY`

### Google Gemini API
- **Status:** ⚠️ Coded but not configured
- **Purpose:** Gemini models for analysis
- **Cost:** FREE tier available
- **Setup:** https://ai.google.dev/
- **Environment Variable:** `GEMINI_API_KEY`

### OpenRouter API
- **Status:** ⚠️ Coded but not configured
- **Purpose:** Access multiple AI models through one API
- **Cost:** Varies by model
- **Setup:** https://openrouter.ai/
- **Environment Variables:**
  - `OPENROUTER_API_KEY`
  - `OPENROUTER_DEEPSEEK_R1T2_API_KEY`
  - `OPENROUTER_QWEN3_235B_API_KEY`
  - `OPENROUTER_QWEN3_CODER_API_KEY`

---

## 🎬 Section 5: Media Metadata APIs

### TMDb (The Movie Database) API
- **Status:** ⚠️ Coded but not configured
- **Purpose:** Film/TV adaptation data for public domain works
- **Cost:** FREE (API key required)
- **Setup:** https://www.themoviedb.org/settings/api
- **Environment Variable:** `TMDB_API_KEY`
- **Rate Limits:** 40 requests per 10 seconds

---

## 💰 Cost Summary

### Minimum Budget Configuration ($50/month)
To get REAL market data with minimal cost:
- ✅ Google OAuth: FREE
- ✅ GitHub OAuth: FREE
- ✅ Wikipedia: FREE
- ✅ Amazon Product Advertising: FREE
- ✅ Etsy API: FREE
- ✅ Google Trends: FREE
- 💰 SerpAPI: $50/month

**Total: $50/month**

### Professional Configuration ($200/month)
For comprehensive real data:
- Everything from Minimum Budget
- 💰 SEMrush OR Ahrefs: $100-120/month
- 💰 Jungle Scout: $29/month
- ✅ TMDb: FREE
- ✅ Printful/Printify: FREE

**Total: $179-199/month**

### Enterprise Configuration ($300+/month)
For maximum data quality:
- Everything from Professional
- 💰 Both SEMrush AND Ahrefs: $219/month
- AI APIs (pay-per-use, estimate $50-100/month)

**Total: $300-400/month**

---

## 🚀 Setup Priority Order

### Phase 1: CRITICAL (Do First)
1. **Google OAuth** - Users can't sign in
2. **GitHub OAuth** - Alternative auth method
3. **Hide market signals** - Don't show fake data

### Phase 2: FREE APIs (Week 1)
1. Amazon Product Advertising API
2. Etsy API
3. Google Trends activation
4. TMDb API

### Phase 3: Paid APIs (Week 2+)
1. Choose search volume API (SEMrush/Ahrefs/SerpAPI)
2. Jungle Scout for sales estimates
3. Re-enable market signals with real data

### Phase 4: OPTIONAL (When Budget Allows)
1. AI/LLM APIs for enhanced features
2. Internet Archive API key (higher limits)
3. Additional content source APIs

---

## ⚙️ Configuration Instructions

### For Cloudflare Pages Deployment

1. **Go to Cloudflare Dashboard**
   - Pages → publicdomainhunter → Settings → Environment Variables

2. **Add Production Variables:**
   ```
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   AMAZON_ACCESS_KEY=your_amazon_access_key
   AMAZON_SECRET_KEY=your_amazon_secret_key
   AMAZON_ASSOCIATE_TAG=your_associate_tag
   SEMRUSH_API_KEY=your_semrush_key (or AHREFS_API_KEY or SERPAPI_KEY)
   ETSY_API_KEY=your_etsy_key
   TMDB_API_KEY=your_tmdb_key
   ```

3. **Mark Secrets as Encrypted:**
   - All `_SECRET` and `_KEY` variables should be encrypted

4. **Redeploy:**
   - Changes take effect on next deployment
   - Push to GitHub or manually trigger deployment

---

## 📖 Additional Documentation

- **OAuth Setup:** See `CLOUDFLARE_AUTH_SETUP.md`
- **Content Sources:** See `API_SOURCES.md` for detailed content API docs
- **Deployment:** See `CLOUDFLARE_PAGES_SETUP.md`

---

## ❓ FAQ

**Q: Why is market data showing fake numbers?**  
A: Market intelligence APIs are not configured. The app currently calculates estimates. Configure SEMrush/Ahrefs + Amazon API for real data.

**Q: Which APIs are absolutely required?**  
A: Only Google OAuth and GitHub OAuth for user auth. Everything else is optional but recommended.

**Q: What's the minimum cost to get real market data?**  
A: $50/month with SerpAPI + free Amazon + Etsy APIs.

**Q: Can I use the app without any paid APIs?**  
A: Yes, but you'll only have content from free sources and calculated (not real) market data.

**Q: How do I know if APIs are configured correctly?**  
A: Check Cloudflare environment variables and test each feature (login, market signals, etc.)
