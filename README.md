# Public Domain Hunter 2.0

Public Domain Hunter is an **evidence-first opportunity radar** for discovering public-domain and openly reusable source material with commercial adaptation potential.

The v2 rebuild intentionally removes the old architecture's biggest weaknesses:

- no required FastAPI/Postgres/Redis backend
- no fake Amazon rankings, fake market sizes, or randomly generated demand metrics
- no opaque “AI says 87/100” master score
- no account requirement for the MVP
- no legal claim that a source item is safe to commercialize outside the rights evidence actually available

## What works now

- Live Project Gutenberg search through Gutendex
- Broad Internet Archive candidate search
- Evidence-first opportunity scoring
- Explicit rights-status handling and penalties
- Expandable evidence/provenance for every score
- Product-angle suggestions derived from source metadata
- Missing-evidence checklist instead of fabricated numbers
- Local research portfolio (browser storage)
- Cloudflare Worker + static Next.js architecture

## Architecture

```text
Browser
  -> Cloudflare Worker /api/*
      -> Gutendex (Project Gutenberg metadata)
      -> Internet Archive Advanced Search
  -> Static Next.js app (Cloudflare Assets)
```

There is no required database in the MVP. A Cloudflare KV namespace can optionally be bound as `CACHE` for API caching.

## Run locally

```bash
npm install
npm run typecheck
npm run build
npx wrangler dev
```

For frontend-only development:

```bash
npm run dev:frontend
```

Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8787` when running the frontend separately from Wrangler.

## Deploy

```bash
npm install
npm run typecheck
npm run build
npx wrangler deploy
```

## API

### Search opportunities

```http
GET /api/opportunities?q=fairy+tales&source=gutenberg&limit=20&min_score=55
```

Sources:

- `gutenberg` — prioritizes works explicitly marked `copyright=false` by Gutendex.
- `archive` — broader research candidates; items without sufficiently clear license metadata are marked `verify_rights` and penalized.

### Methodology

```http
GET /api/methodology
```

### Health

```http
GET /api/health
```

## Current score

The v2 research-priority score uses only auditable inputs:

| Signal | Weight | Current evidence |
|---|---:|---|
| Observed demand | 35% | Source-reported downloads when available |
| Rights clarity | 30% | Source rights/copyright metadata |
| Derivative fit | 20% | Transparent subject/format heuristic |
| Metadata quality | 15% | Creator, subject, language, year, format completeness |
| Competition | Not scored yet | Requires a real connector |

Unknown data remains unknown. The score is a **research-priority score**, not a revenue forecast, valuation, freedom-to-operate opinion, or legal opinion.

## Patent Radar

Patent analysis is deliberately staged for a proper USPTO Open Data Portal connector. The previous keyword-only manufacturing and market-size scoring has not been carried forward. Patent expiration alone does not establish freedom to operate because later patents and other rights may still matter.

## Next build targets

1. USPTO Open Data Portal connector with authenticated access.
2. Competition evidence from marketplaces/search/adaptation catalogs.
3. Search-trend signal with historical snapshots.
4. Server-side portfolios and saved research once accounts are actually needed.
5. Opportunity research jobs that enrich a candidate with auditable evidence over time.

## Production source note

The public Gutendex endpoint is appropriate for MVP development, but Gutendex recommends running your own server for long-term use. Before scaling PDH, deploy/self-host the Gutendex dataset or replace it with a first-party Project Gutenberg ingestion job so source availability and rate limits are under your control.
