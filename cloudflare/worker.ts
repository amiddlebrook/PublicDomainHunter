// cloudflare/worker.ts

import { D1Database, KVNamespace, Fetcher } from '@cloudflare/workers-types';
import nativeBackend from './native-backend';

// Define the bindings expected from the environment
export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  SESSIONS: KVNamespace;
  // Add other secrets and environment variables here as needed
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // If the request is for an API route, let the native backend handle it.
    // The native backend is a Hono app that will handle its own routing.
    if (url.pathname.startsWith('/api/')) {
      return nativeBackend.fetch(request, env, ctx);
    }

    // For all other requests, assume it's a static asset.
    // The ASSETS binding is configured in wrangler.toml to point to the frontend build output.
    try {
      // Let the ASSETS fetcher handle the request
      const response = await env.ASSETS.fetch(request);

      // If the asset is not found (e.g., for SPA routing),
      // try fetching the root index.html.
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
};
