# Public Domain Hunter

**Evidence-first public-domain opportunity research.** Search live Project Gutenberg and Internet Archive metadata, prioritize promising work for further research, inspect score provenance, and save a local portfolio.

**Stack:** Cloudflare Workers (Hono API) + Cloudflare Workers Static Assets (statically exported Next.js) + GitHub Actions. No mandatory paid services, database, Docker Hub, hosted model, or account.

## Features

- Live Gutenberg/Gutendex and Internet Archive research
- Rights-aware scoring: observed downloads 35%, rights clarity 30%, derivative fit 20%, metadata quality 15%
- Explicitly missing competition, customer demand and economics evidence (no fictional sales figures)
- Creator, source, rights status, metrics, adaptation concepts, and expandable evidence on each result
- Locally saved research shortlist (browser localStorage, no sign-in)
- Patent Radar openly marked as **not connected**, rather than displaying unverified results
- Responsive dark UI, accessible search controls, informative errors and loading states

> **Important:** "Public domain" is jurisdiction-specific; metadata is not legal advice. Creative Commons NC / ND rights do not clear commercial adaptation. Scores prioritize investigation rather than predict profits.

## One-command local setup

Node 22+ required.

```bash
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

Then open http://localhost:8787. For frontend-only development run `npm run dev:frontend` and set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8787` in the frontend development environment if the separate frontend needs the Worker API.

## Deploy free with GitHub Actions

1. Use a Cloudflare **Free** account and enable the `workers.dev` subdomain.
2. Create a Cloudflare API token scoped to the target account with **Workers Scripts: Edit**; for static assets, also grant any necessary Workers Assets permission shown by Cloudflare.
3. In GitHub repository **Settings → Secrets and variables → Actions**, add repository secrets:
   - `CLOUDFLARE_API_TOKEN` — token used by Wrangler to publish the Worker.
   - `CLOUDFLARE_ACCOUNT_ID` — Cloudflare account ID (recommended; avoids account ambiguity).
4. Optionally add an Actions variable `PUBLIC_URL` set to the publicly reachable Worker URL, without a trailing slash. This enables the post-deploy health check.
5. Push to `main`. The single workflow validates TypeScript, unit tests, the Next.js export and the Wrangler bundle **before** deploying. Pull requests verify without publishing.

No Cloudflare login or paid add-on is needed for visitors. The free Worker plan has limits on requests and CPU time; upstream public APIs also have availability and rate limits.

The project is named `publicdomainhunter` in `wrangler.toml`. By default the live URL is `https://publicdomainhunter.<your-workers-subdomain>.workers.dev` if Workers previews/routes are enabled.

## API endpoints

| Endpoint | Description |
|---|---|
| `GET /api/health` | Lightweight health endpoint |
| `GET /api/opportunities?q=folklore&source=gutenberg&limit=20` | Ranked source candidates |
| `GET /api/opportunities?q=architecture&source=archive&limit=20` | Internet Archive candidate records |
| `GET /api/opportunities/gutenberg/:id` | Single Gutenberg record |
| `GET /api/methodology` | Score definitions |

Both the Next.js site and the API are served by the **same Worker hostname**, so the UI uses relative `/api/*` requests by default. Avoid hardcoding custom domains into frontend code.

## Project layout

```
cloudflare/worker.ts                     # Hono API and assets fallback
cloudflare/services/opportunity-engine.service.ts
cloudflare/services/sources/             # External-source adapters
frontend/src/app/                       # Static Next.js routes
frontend/src/components/opportunity/    # Search and evidence cards
.github/workflows/ci-cd.yml             # One validation/deployment workflow
tests/opportunity-v2.test.ts             # Source / rights / scoring tests
wrangler.toml                            # Cloudflare Worker + assets
```

## Status and limitations

The v2 runtime intentionally does **not** depend on the old Python, PostgreSQL, Redis, n8n, or Docker assets retained as historical source files. Patent analysis is awaiting a genuine connector. The browser-only portfolio does not sync across devices. Gutenberg's public metadata endpoint may limit usage; at scale migrate to a first-party ingestion pipeline.

No credential is ever required to explore opportunities; deployment credentials reside in GitHub Actions secrets and never in frontend bundles.
