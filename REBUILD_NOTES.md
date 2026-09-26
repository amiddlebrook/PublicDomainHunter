# Public Domain Hunter v2 rebuild notes

## Product decision

PDH is now a research-priority engine, not a universal monetization oracle. The MVP is optimized around one job:

> Surface reusable source material that deserves deeper commercial research and show exactly why it surfaced.

## Removed from the v2 execution path

- FastAPI proxy dependency
- PostgreSQL/Redis requirement
- fake JWT authentication
- random Amazon sales ranks
- hardcoded market sizes
- unsupported retailer/adaptation counts
- legacy static `/works/[id]` generation against the retired API
- v1 route clutter in the active Next.js application

Legacy frontend routes were moved to `legacy-v1/frontend-app/` for reference.

## Added

- `cloudflare/services/opportunity-engine.service.ts`
  - evidence model
  - research-priority score
  - confidence and coverage
  - explicit missing signals
  - product-angle heuristics
- `cloudflare/services/sources/gutendex.source.ts`
  - live Project Gutenberg metadata through Gutendex
  - U.S. public-domain filter
- `cloudflare/services/sources/internet-archive.source.ts`
  - broad candidate research
  - rights uncertainty handling
- Cloudflare-native `/api/opportunities`
- `/api/methodology`
- `/api/health`
- New Opportunity Radar UI
- expandable score evidence
- local research portfolio
- methodology page
- patent connector placeholder that refuses to invent unavailable data

## Score philosophy

1. Evidence must have provenance.
2. Missing data must remain missing.
3. Heuristics are labeled heuristics.
4. Rights uncertainty must lower confidence/rank.
5. The score prioritizes research; it does not forecast revenue.

## Build verification performed in this environment

- TypeScript syntax transpilation check passed for all new Worker and frontend files.
- Opportunity scoring service compiled independently with TypeScript and executed in Node.
- Sample scoring output verified nullable competition data rather than generating a fake value.

Full `npm install` / Next.js production build could not be completed in this execution environment because the container did not have DNS access to the npm registry. Dependency lockfiles were intentionally removed after the runtime modernization because this environment could not regenerate them against npm. Run `npm install` once in a normal networked environment to create a fresh workspace lockfile.

## Next implementation milestone

The next valuable work is not more UI. It is evidence enrichment:

1. authenticated USPTO Open Data Portal ingestion
2. retailer/search/adaptation competition connectors
3. trend history snapshots
4. server-side portfolio only once multi-device accounts matter
5. an enrichment job that records every external observation with source + timestamp

## Runtime modernization

The active v2 workspace was moved to the September 2026 supported line: Next.js 16, React 19, Wrangler 4, Hono 4, and current Cloudflare Worker types. The root package now uses npm workspaces so one `npm install` installs both Worker and frontend dependencies.
