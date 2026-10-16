import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { KVNamespace } from '@cloudflare/workers-types';
import { scoreOpportunity } from './services/opportunity-engine.service';
import { getGutendexBook, searchGutendex } from './services/sources/gutendex.source';
import { searchInternetArchive } from './services/sources/internet-archive.source';

export interface Env {
  ASSETS?: { fetch(request: string): Promise<Response> };
  CACHE?: KVNamespace;
}

const app = new Hono<{ Bindings: Env }>();
app.use('/api/*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'] }));

app.get('/api/health', (c) => c.json({ ok: true, product: 'Public Domain Hunter', version: '2.0.0', architecture: 'cloudflare-native' }));

app.get('/api/opportunities', async (c) => {
  const query = c.req.query('q') || '';
  const source = c.req.query('source') || 'gutenberg';
  const limit = Math.max(1, Math.min(30, Number(c.req.query('limit') || 20)));
  const minScore = Math.max(0, Math.min(100, Number(c.req.query('min_score') || 0)));
  const cacheKey = `opp:v2:${source}:${query.toLowerCase()}:${limit}:${minScore}`;
  const cached = await c.env.CACHE?.get(cacheKey);
  if (cached) return c.json(JSON.parse(cached));

  try {
    const result = source === 'archive'
      ? await searchInternetArchive(query, limit)
      : await searchGutendex(query, limit);
    const opportunities = result.candidates
      .map(scoreOpportunity)
      .filter(o => o.score.overall >= minScore)
      .sort((a, b) => b.score.overall - a.score.overall || (b.downloads || 0) - (a.downloads || 0));

    const payload = {
      query, source, total_source_results: result.total, returned: opportunities.length,
      generated_at: new Date().toISOString(), methodology: 'evidence-first-v2', opportunities
    };
    await c.env.CACHE?.put(cacheKey, JSON.stringify(payload), { expirationTtl: 900 });
    return c.json(payload);
  } catch (error) {
    console.error('opportunity search failed', error);
    return c.json({ error: error instanceof Error ? error.message : 'Search failed' }, 502);
  }
});

app.get('/api/opportunities/gutenberg/:id', async (c) => {
  try {
    const candidate = await getGutendexBook(c.req.param('id'));
    if (!candidate) return c.json({ error: 'Opportunity not found' }, 404);
    return c.json(scoreOpportunity(candidate));
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Lookup failed' }, 502);
  }
});

app.get('/api/methodology', (c) => c.json({
  version: 'evidence-first-v2',
  principle: 'Unknown signals remain unknown; the system does not manufacture market data.',
  scoring: {
    observed_demand: '35% when source download counts are available',
    rights_clarity: '30%',
    derivative_fit: '20% transparent metadata heuristic',
    metadata_quality: '15%',
    competition: 'not scored until a real connector is available'
  },
  disclaimer: 'Scores rank research priority and are not revenue forecasts or legal opinions.'
}));

app.all('/api/*', (c) => c.json({ error: 'API route not found' }, 404));

app.all('*', async (c) => {
  if (!c.env.ASSETS) return c.text('Public Domain Hunter API is online.', 200);
  return c.env.ASSETS.fetch(c.req.url);
});

export default {
  fetch: app.fetch
};
