// cloudflare/worker.ts
// Main Cloudflare Worker entry point

import { D1Database, KVNamespace, R2Bucket, Queue, AnalyticsEngineDataset, Fetcher } from '@cloudflare/workers-types';
import backend from './backend';
import { handleQueue } from './queue-consumer';

// Define the bindings expected from the environment
export interface Env {
  ASSETS?: Fetcher;
  DB: D1Database;
  SESSIONS: KVNamespace;
  CACHE: KVNamespace;
  FILES: R2Bucket;
  JOBS_QUEUE: Queue;
  ANALYTICS?: AnalyticsEngineDataset;

  // Secrets
  JWT_SECRET: string;

  // API Keys for external services
  OPENAI_API_KEY?: string;
  CLAUDE_API_KEY?: string;
  GEMINI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
}

export default {
  /**
   * HTTP Request Handler
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // API routes are handled by the backend
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) {
      const response = await backend.fetch(request, env, ctx);
      response.headers.set('X-Debug-Version', 'v1');
      return response;
    }

    // All other requests are static assets
    try {
      if (!env.ASSETS) {
        return new Response(
          JSON.stringify({
            message: 'Public Domain Hunter worker is running in API-only mode',
            nextSteps: 'Bind the ASSETS fetcher by deploying through Cloudflare Pages to serve the frontend.',
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json; charset=utf-8',
              'cache-control': 'no-store',
            },
          }
        );
      }

      const response = await env.ASSETS.fetch(request);

      // For SPA routing, serve index.html on 404
      if (response.status === 404) {
        const notFoundRequest = new Request(new URL('/index.html', request.url), request);
        const notFoundResponse = await env.ASSETS.fetch(notFoundRequest);
        if (notFoundResponse.status === 200) {
          return notFoundResponse;
        }
      }

      return response;
    } catch (e) {
      console.error('Failed to fetch asset:', e);
      return new Response('An unexpected error occurred', { status: 500 });
    }
  },

  /**
   * Queue Consumer Handler
   * Processes background jobs from Cloudflare Queues
   */
  async queue(batch: MessageBatch, env: Env, ctx: ExecutionContext): Promise<void> {
    await handleQueue(batch, env);
  },

  /**
   * Scheduled Handler (Cron Triggers)
   * Runs periodic background tasks
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    // Example: Run metrics updates daily
    console.log('Running scheduled task:', event.cron);

    // Queue metrics updates for all active works
    const { results } = await env.DB.prepare(
      'SELECT id FROM Work WHERE status = ? LIMIT 100'
    ).bind('active').all();

    for (const work of results || []) {
      await env.JOBS_QUEUE.send({
        type: 'metrics_update',
        payload: { workId: (work as any).id },
      });
    }

    console.log(`Queued metrics updates for ${results?.length || 0} works`);
  },
};
