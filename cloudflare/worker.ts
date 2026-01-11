// cloudflare/worker.ts
// Main Cloudflare Worker entry point

import { D1Database, KVNamespace, R2Bucket, Queue, AnalyticsEngineDataset, Fetcher } from '@cloudflare/workers-types';
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
  async fetch(_request: Request, _env: Env, _ctx: ExecutionContext): Promise<Response> {
    return new Response('Under construction', { status: 404 });
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
