# Public Domain Hunter - Architecture Analysis & Strategic Expansion Plan

**Date:** January 2026
**Purpose:** Comprehensive analysis and roadmap to transform from "Etsy-like" books/posters platform to a comprehensive Public Domain IP discovery engine.

---

## Executive Summary

Public Domain Hunter has solid technical foundations but is currently limited in scope - focusing primarily on books, posters, and consumer merchandise. The platform's true potential lies in becoming **the definitive discovery engine for ALL public domain intellectual property** - a massive, untapped market that includes:

- **Patents** (20M+ expired US patents alone)
- **Trademarks** (abandoned/expired marks)
- **Scientific Research** (open access papers, datasets)
- **Industrial Designs**
- **Music & Audio** (scores, recordings)
- **Film & Video** (silent films, newsreels, documentaries)
- **Art & Images** (museum collections, historical photographs)
- **Software** (public domain codebases)
- **Databases & Datasets** (government data, research datasets)

This document provides a complete architecture review and strategic expansion plan.

---

## Part 1: Current Architecture Overview

### 1.1 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14 + React 18 + TypeScript | SPA with SSR capabilities |
| **UI** | Tailwind CSS + Radix UI | Dark-themed, accessible UI |
| **State** | Zustand | Lightweight state management |
| **Backend (Primary)** | FastAPI (Python 3.11+) | REST API with async support |
| **Backend (Edge)** | Cloudflare Workers + Hono | Serverless edge computing |
| **Database** | PostgreSQL / Cloudflare D1 | Relational data storage |
| **Cache** | Redis / Cloudflare KV | Session & response caching |
| **File Storage** | S3 / Cloudflare R2 | EPUB/PDF uploads |
| **Search** | Custom implementation | Full-text search |
| **AI/LLM** | OpenAI, Claude, Gemini | Content analysis & recommendations |
| **Payments** | Stripe | Subscription management |

### 1.2 Current Data Model

```
┌─────────────────────────────────────────────────────────────────┐
│                         CURRENT SCHEMA                          │
├─────────────────────────────────────────────────────────────────┤
│  User                                                           │
│  ├── id, email, username, hashed_password                       │
│  ├── full_name, is_active, is_superuser                         │
│  └── Relationships: works[], alerts[], subscriptions[]          │
│                                                                 │
│  Work  ← THE PROBLEM: TOO GENERIC, BOOK-CENTRIC                │
│  ├── id, title, author                                         │
│  ├── original_publication_year, public_domain_year             │
│  ├── media_type: book | document | image | audio | video       │
│  ├── description, source_url, download_url                     │
│  └── additional_metadata (JSON blob - unstructured)            │
│                                                                 │
│  WorkMetric                                                     │
│  ├── Basic: search_volume, trend_score, competition_score      │
│  ├── Platform: film_tv, game, audiobook, merchandise, etc.     │
│  └── patent_invention_score (EXISTS BUT UNUSED!)               │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Current Data Sources (Books-Heavy)

| Source | Content | Status |
|--------|---------|--------|
| Project Gutenberg | 70K books | ✅ Integrated |
| Internet Archive | 35M items (mostly texts) | ✅ Integrated |
| Europeana | Cultural heritage | ⚠️ Coded, needs API key |
| DPLA | US library content | ⚠️ Coded, needs API key |

**What's Missing:** Patents, trademarks, scientific papers, music scores, industrial designs, etc.

### 1.4 Frontend Focus (The "Etsy Problem")

Current Factory features in `frontend/src/app/factory/`:
- `/posters` - "Turn vintage illustrations into wall art"
- `/ebooks` - "Format classic texts for Kindle"
- `/3d-models` - "Convert patent drawings into 3D printable files"

The messaging is heavily consumer/craft oriented. The real opportunity is B2B and enterprise use cases.

---

## Part 2: The Public Domain IP Landscape

### 2.1 IP Categories & Market Size

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    PUBLIC DOMAIN IP UNIVERSE                               │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  LITERARY WORKS (Current Focus)          ~200M items                       │
│  ├── Books, manuscripts, journals                                          │
│  ├── Newspapers, magazines                                                 │
│  └── Letters, diaries, correspondence                                      │
│                                                                            │
│  PATENTS (MASSIVE OPPORTUNITY)           ~20M expired US patents           │
│  ├── Utility patents (20-year term)                                        │
│  ├── Design patents (15-year term)                                         │
│  ├── Plant patents                                                         │
│  └── International: EPO, WIPO, JPO, CNIPA                                  │
│                                                                            │
│  TRADEMARKS (ABANDONED/EXPIRED)          ~3M US marks                      │
│  ├── Word marks                                                            │
│  ├── Design marks                                                          │
│  └── Trade dress                                                           │
│                                                                            │
│  SCIENTIFIC RESEARCH                     ~50M papers                       │
│  ├── Open access journals                                                  │
│  ├── Government research                                                   │
│  ├── Pre-1978 publications                                                 │
│  └── NIH/NSF funded research                                               │
│                                                                            │
│  MUSIC & AUDIO                           ~5M items                         │
│  ├── Sheet music & scores (IMSLP: 150K+)                                   │
│  ├── Pre-1928 recordings                                                   │
│  ├── Government recordings                                                 │
│  └── Classical compositions                                                │
│                                                                            │
│  FILM & VIDEO                            ~500K items                       │
│  ├── Silent films (pre-1928)                                               │
│  ├── Government films                                                      │
│  ├── Newsreels & documentaries                                             │
│  └── Educational films                                                     │
│                                                                            │
│  ART & IMAGES                            ~100M items                       │
│  ├── Museum collections (Met, Smithsonian, etc.)                           │
│  ├── Historical photographs                                                │
│  ├── Maps & diagrams                                                       │
│  └── Illustrations & engravings                                            │
│                                                                            │
│  SOFTWARE & DATA                         Growing                           │
│  ├── Public domain codebases                                               │
│  ├── Government datasets                                                   │
│  ├── Expired database protections                                          │
│  └── APIs & specifications                                                 │
│                                                                            │
│  INDUSTRIAL DESIGNS                      ~1M items                         │
│  ├── Expired design registrations                                          │
│  ├── Unregistered designs (15+ years)                                      │
│  └── Semiconductor topographies                                            │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Why Patents Are the Biggest Opportunity

Patents represent an **enormous, underexplored goldmine**:

1. **Volume**: 20M+ expired US patents, 100M+ globally
2. **Actionable**: Direct manufacturing/implementation pathways
3. **High Value**: Each patent represents validated, unique innovation
4. **B2B Demand**: Manufacturers, startups, R&D departments actively seek this
5. **Searchability**: Structured data (claims, classifications, drawings)
6. **Monetization**: Licensing, manufacturing, consulting services

**Current Patent Support in Codebase:**
```typescript
// monetization-engine.service.ts:560-567
private async calculatePatentInventionScore(work: Work): Promise<number> {
    // Only applicable to patents and technical works
    if (work.media_type !== 'patent' && work.media_type !== 'technical') {
        return 0;  // ← ALWAYS RETURNS 0 FOR NON-PATENTS
    }
    // TODO: Implement patent-specific scoring
    return 50; // Placeholder
}
```

The infrastructure acknowledges patents but **does nothing with them**.

---

## Part 3: Recommended Architecture Changes

### 3.1 New Data Model (IP-Type Polymorphism)

Replace the monolithic `Work` model with a polymorphic IP model:

```sql
-- Base IP Asset (common fields)
CREATE TABLE ip_assets (
    id UUID PRIMARY KEY,
    asset_type ENUM('patent', 'trademark', 'copyright_work', 'design',
                    'scientific_work', 'music', 'film', 'image', 'software', 'dataset'),
    title VARCHAR(500) NOT NULL,
    description TEXT,

    -- Public Domain Status
    pd_status ENUM('public_domain', 'pending', 'uncertain', 'copyrighted'),
    pd_date DATE,
    pd_jurisdiction VARCHAR(50)[],  -- Can be PD in some countries but not others
    pd_reason VARCHAR(100),          -- 'expired', 'government_work', 'dedicated', etc.

    -- Discovery Metadata
    source VARCHAR(100),
    source_id VARCHAR(255),
    source_url VARCHAR(500),
    discovered_at TIMESTAMP,
    last_verified TIMESTAMP,

    -- Common Metrics
    popularity_score FLOAT,
    monetization_score FLOAT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- Patent-specific extension
CREATE TABLE patents (
    id UUID PRIMARY KEY REFERENCES ip_assets(id),
    patent_number VARCHAR(50) NOT NULL,
    patent_type ENUM('utility', 'design', 'plant', 'reissue'),
    filing_date DATE,
    grant_date DATE,
    expiration_date DATE,

    -- Inventors & Assignees
    inventors JSONB,           -- [{name, city, country}]
    original_assignee VARCHAR(255),
    current_assignees JSONB,

    -- Classification
    cpc_codes VARCHAR(20)[],   -- Cooperative Patent Classification
    ipc_codes VARCHAR(20)[],   -- International Patent Classification
    uspc_codes VARCHAR(20)[],  -- US Patent Classification

    -- Content
    abstract TEXT,
    claims TEXT[],
    claims_count INTEGER,
    independent_claims_count INTEGER,

    -- References
    cited_patents VARCHAR(50)[],
    cited_by_patents VARCHAR(50)[],
    citation_count INTEGER,

    -- Assets
    drawing_count INTEGER,
    drawing_urls TEXT[],

    -- Calculated Fields
    technology_sector VARCHAR(100),
    implementation_difficulty ENUM('simple', 'moderate', 'complex', 'expert'),
    manufacturing_viability FLOAT,
    market_relevance_score FLOAT
);

-- Trademark-specific extension
CREATE TABLE trademarks (
    id UUID PRIMARY KEY REFERENCES ip_assets(id),
    registration_number VARCHAR(50),
    serial_number VARCHAR(50),
    mark_type ENUM('word', 'design', 'combined', 'sound', 'color'),

    status ENUM('live', 'dead', 'cancelled', 'expired', 'abandoned'),
    abandonment_date DATE,
    cancellation_date DATE,

    word_mark VARCHAR(500),
    design_description TEXT,
    design_image_url VARCHAR(500),

    nice_classes INTEGER[],  -- International trademark classes
    goods_services TEXT[],

    owner_name VARCHAR(255),
    owner_type ENUM('individual', 'corporation', 'llc', 'partnership', 'other'),

    -- Reuse Potential
    distinctiveness_score FLOAT,
    market_value_estimate FLOAT,
    conflict_risk_score FLOAT
);

-- Scientific Work extension
CREATE TABLE scientific_works (
    id UUID PRIMARY KEY REFERENCES ip_assets(id),
    doi VARCHAR(100),
    pmid VARCHAR(20),
    arxiv_id VARCHAR(50),

    authors JSONB,
    journal VARCHAR(255),
    publication_date DATE,
    volume VARCHAR(20),
    issue VARCHAR(20),
    pages VARCHAR(50),

    abstract TEXT,
    keywords VARCHAR(100)[],
    mesh_terms VARCHAR(100)[],

    -- Open Access
    oa_status ENUM('gold', 'green', 'bronze', 'hybrid', 'closed'),
    license VARCHAR(50),
    full_text_url VARCHAR(500),

    -- Metrics
    citation_count INTEGER,
    altmetric_score FLOAT,

    -- Research Type
    study_type VARCHAR(100),
    methodology VARCHAR(100),
    has_data_available BOOLEAN,
    data_url VARCHAR(500)
);

-- Music/Audio extension
CREATE TABLE music_works (
    id UUID PRIMARY KEY REFERENCES ip_assets(id),

    composer VARCHAR(255),
    lyricist VARCHAR(255),
    arranger VARCHAR(255),

    composition_date DATE,
    first_publication_date DATE,
    first_performance_date DATE,

    work_type ENUM('symphony', 'concerto', 'opera', 'chamber', 'solo',
                   'choral', 'song', 'dance', 'other'),
    instrumentation TEXT[],
    duration_seconds INTEGER,

    opus_number VARCHAR(50),
    catalog_number VARCHAR(50),  -- e.g., BWV, K., Op.

    -- Scores
    score_available BOOLEAN,
    score_urls JSONB,
    parts_available BOOLEAN,

    -- Recordings
    recordings JSONB  -- [{performer, year, label, url}]
);
```

### 3.2 New API Sources to Integrate

```yaml
# Priority 1: Patents (Highest Value)
USPTO_BULK_DATA:
  url: https://bulkdata.uspto.gov/
  content: Full US patent database
  format: XML, JSON
  cost: Free
  notes: Weekly updates, full historical archive

GOOGLE_PATENTS:
  url: https://patents.google.com/
  content: Global patent search
  api: BigQuery Public Datasets
  cost: Free (BigQuery usage fees)

EPO_OPS:
  url: https://ops.epo.org/
  content: European patents
  api: REST API
  cost: Free (registration required)
  rate_limit: 30 req/min

LENS_ORG:
  url: https://www.lens.org/
  content: 130M patents + scholarly works
  api: REST API
  cost: Free for research

# Priority 2: Trademarks
USPTO_TSDR:
  url: https://tsdr.uspto.gov/
  content: US trademark status
  api: REST API
  cost: Free

TMDB_TRADEMARK:
  url: https://www.tmdn.org/
  content: EU trademarks
  api: REST API
  cost: Free

# Priority 3: Scientific Research
PUBMED_CENTRAL:
  url: https://www.ncbi.nlm.nih.gov/pmc/
  content: 8M+ open access papers
  api: E-utilities API
  cost: Free

ARXIV:
  url: https://arxiv.org/
  content: 2M+ preprints
  api: REST API
  cost: Free

CORE:
  url: https://core.ac.uk/
  content: 200M+ research outputs
  api: REST API
  cost: Free

SEMANTIC_SCHOLAR:
  url: https://www.semanticscholar.org/
  content: 200M+ papers
  api: REST API
  cost: Free

# Priority 4: Music
IMSLP:
  url: https://imslp.org/
  content: 600K+ scores
  api: MediaWiki API
  cost: Free

MUSOPEN:
  url: https://musopen.org/
  content: PD recordings
  api: REST API
  cost: Free

# Priority 5: Art & Images
MET_OPEN_ACCESS:
  url: https://www.metmuseum.org/art/collection
  content: 470K+ artworks
  api: REST API
  cost: Free

SMITHSONIAN_OPEN_ACCESS:
  url: https://www.si.edu/openaccess
  content: 3M+ images
  api: REST API
  cost: Free

WIKIMEDIA_COMMONS:
  url: https://commons.wikimedia.org/
  content: 90M+ media files
  api: MediaWiki API
  cost: Free

# Priority 6: Government & Data
DATA_GOV:
  url: https://data.gov/
  content: Government datasets
  api: CKAN API
  cost: Free

CONGRESS_GOV:
  url: https://www.congress.gov/
  content: Legislative data
  api: REST API
  cost: Free
```

### 3.3 Enhanced Monetization Engine

```typescript
// New Patent-Specific Scoring
interface PatentMonetizationScore extends MasterScore {
    // Patent-Specific Metrics
    manufacturing_complexity: number;      // How hard to manufacture
    component_availability: number;        // Can you buy the parts?
    tooling_requirements: number;          // Special tools needed?
    regulatory_barriers: number;           // FDA, EPA, etc. approval?
    market_demand_signal: number;          // Search volume for this solution

    // Competitive Landscape
    active_manufacturers: number;          // Who's making this already?
    improvement_patents: number;           // Patents that build on this
    workaround_complexity: number;         // How easy to design around?

    // Commercial Pathways
    licensing_potential: number;           // Can you license this?
    direct_manufacturing: number;          // Can you make it yourself?
    service_business: number;              // Can you offer as a service?
    educational_content: number;           // Can you teach it?

    // Technology Assessment
    technology_readiness_level: number;    // TRL 1-9
    dependency_on_other_patents: number;   // Freedom to operate
    standards_relevance: number;           // Part of any standards?
}

// Trademark Revival Scoring
interface TrademarkOpportunityScore {
    mark_strength: 'generic' | 'descriptive' | 'suggestive' | 'arbitrary' | 'fanciful';
    abandonment_reason: string;
    revival_risk: number;           // Risk original owner contests
    market_relevance: number;       // Is the mark still valuable?
    domain_availability: number;    // Can you get the .com?
    social_handle_availability: number;
    similar_active_marks: number;   // Conflict potential
    estimated_registration_cost: number;
    estimated_market_value: number;
}

// Scientific Work Commercialization
interface ResearchCommercializationScore {
    practical_applications: string[];
    implementation_readiness: number;
    required_expertise_level: string;
    capital_requirements: string;
    time_to_market: string;
    regulatory_pathway: string;
    competing_solutions: number;
    citation_momentum: number;       // Is interest growing?
}
```

### 3.4 New Frontend Sections

Replace the "Etsy" factory with professional IP discovery tools:

```
/patents
  /search          - Patent search with CPC/IPC classification filters
  /expiring        - Patents expiring soon (opportunity alerts)
  /by-technology   - Browse by technology sector
  /manufacturing   - Patents with high manufacturing viability
  /[patent-number] - Detailed patent view with drawings, claims analysis

/trademarks
  /abandoned       - Recently abandoned marks
  /expiring        - Marks at risk of cancellation
  /by-class        - Browse by Nice classification
  /[serial-number] - Detailed trademark analysis

/research
  /open-access     - Freely available research papers
  /data-available  - Studies with downloadable datasets
  /by-field        - Browse by research area
  /trending        - High-citation recent publications

/music
  /scores          - Sheet music and arrangements
  /recordings      - Public domain recordings
  /by-composer     - Browse by composer
  /arrangements    - Available arrangements

/studio (replaces /factory)
  /analyze-patent  - AI analysis of patent viability
  /trademark-check - Check trademark availability
  /prior-art       - Prior art search tool
  /freedom-to-operate - FTO analysis helper
  /product-ideation - AI product ideas from patents
```

---

## Part 4: Implementation Roadmap

### Phase 1: Foundation (4-6 weeks)

1. **Database Migration**
   - Create new polymorphic IP schema
   - Migrate existing `works` data to `ip_assets` + `copyright_works`
   - Add proper indexing for search

2. **Patent Data Ingestion**
   - USPTO bulk data download pipeline
   - Patent parsing and normalization
   - Initial load of 20M+ US patents

3. **Basic Patent UI**
   - Patent search page
   - Patent detail page
   - Classification browser

### Phase 2: Intelligence Layer (4-6 weeks)

4. **Patent Scoring Engine**
   - Manufacturing viability scoring
   - Market demand signals (Google Trends integration)
   - Technology sector classification
   - Expiration timeline tracking

5. **Trademark Module**
   - USPTO TSDR integration
   - Abandonment tracking
   - Revival risk assessment

6. **Enhanced Search**
   - Semantic patent search
   - Prior art discovery
   - Similar patent recommendations

### Phase 3: Professional Tools (6-8 weeks)

7. **Freedom-to-Operate Assistant**
   - AI-powered FTO analysis
   - Claim dependency mapping
   - Risk assessment reports

8. **Product Ideation Engine**
   - Patent-to-product AI suggestions
   - Manufacturing pathway analysis
   - Cost estimation integration

9. **Portfolio Management**
   - Save patents/trademarks
   - Alert on related filings
   - Export for legal review

### Phase 4: Enterprise Features (8-12 weeks)

10. **Team Collaboration**
    - Shared workspaces
    - Annotation and notes
    - Approval workflows

11. **API Access**
    - REST API for integrations
    - Bulk export capabilities
    - Webhook notifications

12. **Custom Reports**
    - Technology landscape reports
    - Competitive intelligence
    - White-label reports

---

## Part 5: Revenue Model Evolution

### Current Model (Consumer/Hobbyist)
```
Free    → Basic search, limited results
$9/mo   → Full search, save portfolio
$29/mo  → AI insights, factory tools
```

### Proposed Model (Professional/Enterprise)

```
INDIVIDUAL TIERS
─────────────────────────────────────────────────
Free        → 100 searches/mo, basic filters
$19/mo      → Unlimited search, patent alerts, portfolio (100 items)
$49/mo      → AI analysis, FTO helper, export, portfolio (1000 items)

TEAM TIERS
─────────────────────────────────────────────────
$199/mo     → 5 seats, shared workspace, API access (1000 calls/mo)
$499/mo     → 20 seats, custom reports, priority support, API (10K calls/mo)

ENTERPRISE
─────────────────────────────────────────────────
Custom      → Unlimited seats, on-premise option, SLA, dedicated support
            → Bulk data licensing, white-label reports
            → Integration with internal systems

API-ONLY PRICING
─────────────────────────────────────────────────
$0.01/query     → Basic patent lookup
$0.05/query     → Full analysis with AI scoring
$0.25/report    → Generated PDF report
```

### Target Customer Segments

1. **Patent Attorneys & IP Lawyers**
   - Prior art searches
   - Freedom-to-operate analysis
   - Portfolio management

2. **Product Development Teams**
   - Technology scouting
   - Competitive intelligence
   - Design inspiration

3. **Manufacturers & Engineers**
   - Manufacturing-ready patents
   - Process improvements
   - Cost reduction opportunities

4. **Startups & Entrepreneurs**
   - Validate ideas against prior art
   - Find expired patents to commercialize
   - Trademark availability checks

5. **Academic Researchers**
   - Literature reviews
   - Research data discovery
   - Collaboration opportunities

6. **Content Creators**
   - Public domain music for productions
   - Historical images for projects
   - Story/character inspiration

---

## Part 6: Technical Debt & Quick Wins

### Current Issues to Address

1. **Search is Basic**
   - No semantic understanding
   - No faceted navigation
   - Recommendation: Integrate Elasticsearch or Typesense

2. **Authentication is Fragmented**
   - JWT in FastAPI, sessions in Cloudflare
   - OAuth configured but not working
   - Recommendation: Consolidate on one auth provider

3. **API Rate Limiting**
   - Inconsistent across endpoints
   - Recommendation: Centralized rate limiting middleware

4. **Caching Strategy**
   - Redis in FastAPI, KV in Cloudflare
   - No cache invalidation strategy
   - Recommendation: Unified caching layer

5. **Error Handling**
   - Inconsistent error responses
   - Recommendation: Standardized error format

### Quick Wins (1-2 weeks each)

1. **Add Patent Type to Work Model**
   - Add `media_type: 'patent'` support
   - Basic patent search via Internet Archive patents collection

2. **Integrate Google Patents Link-Out**
   - For any search, show "Search Google Patents" link
   - Zero API cost, immediate value

3. **Add "Entering Public Domain" Feed**
   - Show works/patents entering PD this year
   - High interest content, easy to curate

4. **USPTO Patent Assignment Search**
   - Who owns what patents?
   - Free API, valuable for due diligence

5. **Improve Factory Messaging**
   - Reframe from "crafts" to "commercialization"
   - Same features, professional positioning

---

## Part 7: Competitive Landscape

### Direct Competitors

| Platform | Focus | Pricing | Strengths | Weaknesses |
|----------|-------|---------|-----------|------------|
| Google Patents | Patent search | Free | Comprehensive, fast | No scoring, no alerts |
| Lens.org | Patents + research | Free | Great for academia | Complex UI |
| PatSnap | Enterprise IP | $$$$ | Full-featured | Very expensive |
| Espacenet | EPO patents | Free | Official source | Basic interface |
| Trademark.io | Trademarks | $49/mo | Good UX | Limited to trademarks |

### Our Differentiation

1. **Unified IP Search** - One platform for patents, trademarks, research, creative works
2. **Monetization Focus** - Scored by commercial viability, not just relevance
3. **AI-Powered Analysis** - Natural language queries, automated insights
4. **Action-Oriented** - From discovery to commercialization pathway
5. **Accessible Pricing** - Professional tools at indie prices

---

## Part 8: Success Metrics

### Phase 1 KPIs
- [ ] Patent database ingested (target: 10M+ patents)
- [ ] Patent search latency < 500ms
- [ ] User signups for patent feature (target: 1000)

### Phase 2 KPIs
- [ ] Paid conversions from patent users (target: 5%)
- [ ] AI analysis usage (target: 1000 analyses/month)
- [ ] User retention at 30 days (target: 40%)

### Phase 3 KPIs
- [ ] Team/enterprise accounts (target: 50)
- [ ] API revenue (target: $5K MRR)
- [ ] NPS score (target: 50+)

---

## Conclusion

Public Domain Hunter has the technical foundation to become much more than an "Etsy for public domain books." By expanding into patents, trademarks, and other IP types - and pivoting the messaging toward professional users - the platform can tap into a vastly larger market with higher willingness to pay.

The infrastructure is largely in place. The monetization engine already has hooks for patents. The key changes needed are:

1. **Data** - Ingest patent and trademark databases
2. **Schema** - Expand the data model for IP type diversity
3. **Scoring** - Build out patent/trademark-specific intelligence
4. **UI** - Add professional IP discovery tools
5. **Positioning** - Pivot marketing from hobbyist to professional

This represents a transformation from a ~$10M TAM (hobbyist content creators) to a ~$10B TAM (IP professionals, manufacturers, researchers, and enterprises).

---

*Document generated as part of architecture analysis session.*
