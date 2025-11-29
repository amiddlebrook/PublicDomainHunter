# Market Signals - Real API Requirements

**STATUS: ⚠️ NOT CONFIGURED - All market signals are currently FAKE heuristic calculations**

## Problem

The current "market signals" feature displays calculated estimates, NOT real external data. Users expect actual market intelligence from real APIs.

## Required External APIs for REAL Market Data

### 1. **Search Volume** (Currently: Fake calculations based on publication year)

Choose ONE of these options:

#### Option A: SEMrush API ⭐ RECOMMENDED
- **Cost:** $119.95/month minimum
- **Data:** Real monthly search volume, keyword difficulty, CPC, competitive analysis
- **Setup:** https://www.semrush.com/api-analytics/
- **Rate Limits:** 10,000 API units/day
- **Environment Variable:** `SEMRUSH_API_KEY`

#### Option B: Ahrefs API
- **Cost:** $99/month minimum
- **Data:** Search volume, keyword difficulty, click metrics
- **Setup:** https://ahrefs.com/api
- **Environment Variable:** `AHREFS_API_KEY`

#### Option C: SerpAPI (Budget Option)
- **Cost:** $50/month for 5,000 searches
- **Data:** Google search results scraping, search volume estimates
- **Setup:** https://serpapi.com/
- **Environment Variable:** `SERPAPI_KEY`

#### Option D: Google Ads Keyword Planner API
- **Cost:** FREE (requires active Google Ads account with running campaigns)
- **Data:** Official Google search volume, competition levels, bid estimates
- **Setup:** https://ads.google.com/home/tools/keyword-planner/
- **Environment Variable:** `GOOGLE_ADS_API_KEY`

---

### 2. **Competition/Saturation** (Currently: Fake calculations)

#### Amazon Product Advertising API ✅ REQUIRED
- **Cost:** FREE (need Amazon Associates account)
- **Data:** Product listing counts, best seller ranks, pricing, reviews
- **Setup:** https://affiliate-program.amazon.com/assoc_credentials/home
- **Rate Limits:** 1 request/second, 8,640/day
- **Environment Variables:**
  - `AMAZON_ACCESS_KEY`
  - `AMAZON_SECRET_KEY`
  - `AMAZON_ASSOCIATE_TAG`

#### Etsy API
- **Cost:** FREE
- **Data:** Listing counts by search term, pricing data, shop statistics
- **Setup:** https://www.etsy.com/developers/documentation
- **Rate Limits:** 10,000/day
- **Environment Variable:** `ETSY_API_KEY`

#### Redbubble (No Official API)
- **Cost:** FREE
- **Implementation:** Custom web scraper needed
- **Data:** Product counts, pricing ranges
- **Note:** Must implement polite scraping with rate limiting

---

### 3. **Trend Score** (Partially Real)

**Currently Working:**
- ✅ Wikipedia Pageviews API (already integrated, FREE, REAL data)

**Missing:**

#### Google Trends API (Unofficial)
- **Cost:** FREE
- **Data:** Interest over time, regional interest, related queries
- **Library:** https://github.com/GeneralMills/pytrends
- **Rate Limits:** ~400 requests/hour (soft limit)
- **Note:** Already coded in `external-apis.service.ts`, just needs activation

---

### 4. **Monetization Potential** (Currently: Fake calculations)

#### Jungle Scout API
- **Cost:** $29/month minimum
- **Data:** Estimated monthly sales, revenue estimates, profit calculator
- **Setup:** https://www.junglescout.com/
- **Environment Variable:** `JUNGLE_SCOUT_API_KEY`

#### Print-on-Demand Platform APIs

**Printful API**
- **Cost:** FREE
- **Data:** Product pricing, manufacturing costs, shipping estimates
- **Setup:** https://www.printful.com/docs
- **Environment Variable:** `PRINTFUL_API_KEY`

**Printify API**
- **Cost:** FREE
- **Data:** Product catalog, pricing tiers, supplier availability
- **Setup:** https://developers.printify.com/
- **Environment Variable:** `PRINTIFY_API_KEY`

---

## Recommended Configuration Tiers

### 🥉 Tier 1: Minimal Budget ($50/month)
**⚠️ RECOMMENDATION: Hide market signals until configured**

Required APIs:
- ✅ Wikipedia Pageviews (already configured, FREE)
- Amazon Product Advertising API (FREE)
- Google Trends API (FREE, unofficial)
- Etsy API (FREE)
- SerpAPI ($50/month)

**Total Cost:** $50/month  
**Data Quality:** Basic but REAL

---

### 🥈 Tier 2: Standard ($200/month)
Everything from Tier 1, plus:
- SEMrush API ($119.95/month) OR Ahrefs ($99/month)
- Jungle Scout API ($29/month)
- TMDb API (FREE, for film/TV adaptations)

**Total Cost:** $198.95/month  
**Data Quality:** Professional-grade

---

### 🥇 Tier 3: Premium ($300+/month)
Everything from Tier 2, plus:
- Both SEMrush AND Ahrefs (cross-validation)
- Multiple print-on-demand integrations
- Custom web scrapers for additional platforms

**Total Cost:** $300+/month  
**Data Quality:** Enterprise-grade

---

## Implementation Phases

### Phase 1: IMMEDIATE - Remove Fake Data
1. ❌ **Hide market signals from UI** entirely
2. Add warning banner: "Market Intelligence Pending API Configuration"
3. Update documentation to clarify current status

### Phase 2: Week 1 - Free APIs
1. Configure Amazon Product Advertising API
2. Activate Google Trends integration (already coded)
3. Add Etsy API integration
4. Test with subset of works

### Phase 3: Week 2+ - Paid APIs
1. Choose primary search API (SEMrush/Ahrefs/SerpAPI)
2. Configure Jungle Scout API
3. Add print-on-demand platform APIs
4. Re-enable market signals with REAL data
5. Add data source attribution to UI

---

## Current Status

| Metric | Current Source | Status | Real API Needed |
|--------|----------------|--------|-----------------|
| Search Volume | Heuristic calculation | ❌ FAKE | SEMrush/Ahrefs/SerpAPI |
| Competition Score | Publication age calc | ❌ FAKE | Amazon/Etsy APIs |
| Trend Score | Wikipedia + heuristics | ⚠️ PARTIAL | Google Trends |
| Demand Score | Derived from trend | ❌ FAKE | Search Volume APIs |
| Monetization Potential | Formula-based | ❌ FAKE | Jungle Scout/POD APIs |

---

## Next Steps

**Choose one:**

1. **Budget Option ($50/month):**
   - Get Amazon Associates approved
   - Subscribe to SerpAPI
   - Configure Etsy API
   - Activate Google Trends

2. **Professional Option ($200/month):**
   - All budget APIs
   - Subscribe to SEMrush OR Ahrefs  
   - Subscribe to Jungle Scout
   - Configure TMDb API

3. **Remove Feature Until Configured:**
   - Hide market signals from UI
   - Add "Coming Soon" placeholder
   - Configure APIs before re-enabling

**Recommendation:** Option 3 (remove until configured) - Don't show fake data to users.
