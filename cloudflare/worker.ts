const API_PREFIX = "/api";
const HTTP_METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function joinPaths(base: string, addition: string): string {
  if (!base.endsWith("/")) {
    base += "/";
  }
  if (addition.startsWith("/")) {
    addition = addition.slice(1);
  }
  return (base + addition).replace(/\/+/g, "/");
}

function isHtmlRequest(request: Request, url: URL): boolean {
  if (request.method !== "GET") {
    return false;
  }
  if (url.pathname.includes(".")) {
    return false;
  }
  const acceptHeader = request.headers.get("accept") || "";
  return acceptHeader.includes("text/html");
}

async function handleApiRequest(request: Request, env: Env, url: URL): Promise<Response> {
  if (!env.BACKEND_URL) {
    return new Response(
      JSON.stringify({ error: "BACKEND_URL environment variable is not configured" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }

  const backendUrl = new URL(env.BACKEND_URL);
  backendUrl.pathname = joinPaths(backendUrl.pathname, url.pathname);
  backendUrl.search = url.search;

  const init: RequestInit = {
    method: request.method,
    headers: new Headers(request.headers),
    redirect: request.redirect,
  };

  init.headers.delete("host");

  if (HTTP_METHODS_WITH_BODY.has(request.method)) {
    const cloned = request.clone();
    init.body = await cloned.arrayBuffer();
  }

  return fetch(backendUrl.toString(), init);
}

interface AssetFetcher {
  fetch: typeof fetch
}

async function handleAssetRequest(request: Request, env: Env, url: URL): Promise<Response> {
  const assetResponse = await env.ASSETS.fetch(request);
  if (assetResponse.status !== 404) {
    return assetResponse;
  }

  if (isHtmlRequest(request, url)) {
    const rootRequest = new Request(new URL("/index.html", request.url), request);
    const rootResponse = await env.ASSETS.fetch(rootRequest);
    if (rootResponse.status >= 200 && rootResponse.status < 400) {
      return rootResponse;
    }
  }

  return assetResponse;
}

export interface Env {
  BACKEND_URL: string;
  ASSETS: AssetFetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith(API_PREFIX)) {
      return handleApiRequest(request, env, url);
    }

    return handleAssetRequest(request, env, url);
  },
};
