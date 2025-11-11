import {
  buildOAuthUrl,
  createSession,
  createSessionCookie,
  clearSessionCookie,
  deleteSession,
  exchangeOAuthCode,
  generateOAuthState,
  getOAuthUserInfo,
  getSessionIdFromRequest,
  storeOAuthState,
  validateSession,
  verifyOAuthState,
} from './auth';

const API_PREFIX = "/api";
const AUTH_PREFIX = "/auth";
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

function jsonResponse(data: any, status: number = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
  });
}

async function handleApiRequest(request: Request, env: Env, url: URL): Promise<Response> {
  if (!env.BACKEND_URL) {
    console.error('BACKEND_URL is not configured');
    return jsonResponse({
      error: "Backend not configured",
      message: "BACKEND_URL environment variable is not set. Please configure it in Cloudflare Pages settings.",
      details: "Go to: Pages > Settings > Environment Variables and add BACKEND_URL"
    }, 500);
  }

  try {
    const backendUrl = new URL(env.BACKEND_URL);
    backendUrl.pathname = joinPaths(backendUrl.pathname, url.pathname);
    backendUrl.search = url.search;

    console.log(`Proxying ${request.method} ${url.pathname} to ${backendUrl.toString()}`);

    const init: RequestInit = {
      method: request.method,
      headers: new Headers(request.headers),
      redirect: request.redirect,
    };

    init.headers.delete("host");

    // If there's a session, validate it and add user info to request
    const session = await validateSession(request, env.SESSIONS);
    if (session) {
      init.headers.set('X-User-Id', session.userId);
      init.headers.set('X-User-Email', session.email);
      init.headers.set('X-User-Username', session.username);
    }

    if (HTTP_METHODS_WITH_BODY.has(request.method)) {
      const cloned = request.clone();
      init.body = await cloned.arrayBuffer();
    }

    const response = await fetch(backendUrl.toString(), init);

    // Log errors for debugging
    if (!response.ok) {
      const responseText = await response.text();
      console.error(`Backend request failed: ${response.status} ${response.statusText}`, responseText);

      // Try to parse as JSON and return, otherwise return text
      try {
        const errorData = JSON.parse(responseText);
        return jsonResponse(errorData, response.status);
      } catch {
        return jsonResponse({
          error: `Backend error: ${response.status}`,
          message: responseText || response.statusText,
          details: `Request to ${url.pathname} failed`
        }, response.status);
      }
    }

    return response;
  } catch (error) {
    console.error('Error proxying to backend:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return jsonResponse({
      error: "Failed to connect to backend",
      message: errorMessage,
      details: `Could not reach backend at ${env.BACKEND_URL}. Please check that the backend is deployed and accessible.`,
      backend_url: env.BACKEND_URL
    }, 502);
  }
}

async function handleOAuthLogin(
  provider: 'google' | 'github',
  request: Request,
  env: Env
): Promise<Response> {
  if (!env.SESSIONS) {
    return jsonResponse({
      error: 'Authentication not configured',
      message: 'Please configure the SESSIONS KV namespace binding in Cloudflare Dashboard. See CLOUDFLARE_PAGES_SETUP.md for instructions.'
    }, 503);
  }

  const clientIdKey = provider === 'google' ? 'GOOGLE_CLIENT_ID' : 'GITHUB_CLIENT_ID';
  const clientId = env[clientIdKey];

  if (!clientId) {
    return jsonResponse({ error: `${provider} OAuth not configured` }, 500);
  }

  const url = new URL(request.url);
  const redirectUri = `${url.protocol}//${url.host}${AUTH_PREFIX}/callback/${provider}`;

  // Generate and store state for CSRF protection
  const state = await generateOAuthState();
  await storeOAuthState(env.SESSIONS, state);

  // Build OAuth URL
  const authUrl = buildOAuthUrl(provider, clientId, redirectUri, state);

  return Response.redirect(authUrl, 302);
}

async function handleOAuthCallback(
  provider: 'google' | 'github',
  request: Request,
  env: Env
): Promise<Response> {
  if (!env.SESSIONS) {
    return Response.redirect(`/?error=${encodeURIComponent('Authentication not configured')}`, 302);
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    return Response.redirect(`/?error=${encodeURIComponent(error)}`, 302);
  }

  if (!code || !state) {
    return jsonResponse({ error: 'Missing code or state parameter' }, 400);
  }

  // Verify state to prevent CSRF
  const isValidState = await verifyOAuthState(env.SESSIONS, state);
  if (!isValidState) {
    return jsonResponse({ error: 'Invalid state parameter' }, 400);
  }

  try {
    const clientIdKey = provider === 'google' ? 'GOOGLE_CLIENT_ID' : 'GITHUB_CLIENT_ID';
    const clientSecretKey = provider === 'google' ? 'GOOGLE_CLIENT_SECRET' : 'GITHUB_CLIENT_SECRET';
    const clientId = env[clientIdKey];
    const clientSecret = env[clientSecretKey];

    if (!clientId || !clientSecret) {
      return jsonResponse({ error: `${provider} OAuth not configured` }, 500);
    }

    const redirectUri = `${url.protocol}//${url.host}${AUTH_PREFIX}/callback/${provider}`;

    // Exchange code for access token
    const accessToken = await exchangeOAuthCode(provider, code, clientId, clientSecret, redirectUri);

    // Get user info from provider
    const userInfo = await getOAuthUserInfo(provider, accessToken);

    if (!userInfo.email) {
      return jsonResponse({ error: 'Failed to get user email from provider' }, 400);
    }

    // Create or update user in backend
    const backendResponse = await fetch(`${env.BACKEND_URL}/api/auth/oauth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider,
        provider_user_id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
      }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ detail: 'Unknown error' }));
      return jsonResponse({ error: errorData.detail || 'Failed to create/update user' }, backendResponse.status);
    }

    const userData = await backendResponse.json();

    // Create session
    const sessionId = await createSession(
      env.SESSIONS,
      userData.id.toString(),
      userData.email,
      userData.username,
      provider
    );

    // Set session cookie and redirect to home
    const cookie = createSessionCookie(sessionId, url.hostname, url.protocol === 'https:');

    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/',
        'Set-Cookie': cookie,
      },
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return Response.redirect(`/?error=${encodeURIComponent('Authentication failed')}`, 302);
  }
}

async function handleGetSession(request: Request, env: Env): Promise<Response> {
  const session = await validateSession(request, env.SESSIONS);

  if (!session) {
    return jsonResponse({ authenticated: false }, 401);
  }

  return jsonResponse({
    authenticated: true,
    user: {
      userId: session.userId,
      email: session.email,
      username: session.username,
      provider: session.provider,
    },
  });
}

async function handleLogout(request: Request, env: Env): Promise<Response> {
  const sessionId = getSessionIdFromRequest(request);

  if (sessionId) {
    await deleteSession(env.SESSIONS, sessionId);
  }

  return jsonResponse(
    { message: 'Logged out successfully' },
    200,
    { 'Set-Cookie': clearSessionCookie() }
  );
}

async function handleHealthCheck(env: Env): Promise<Response> {
  const health: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    cloudflare_worker: 'running',
    backend_configured: !!env.BACKEND_URL,
    backend_url: env.BACKEND_URL || 'NOT_SET',
    kv_configured: !!env.SESSIONS,
  };

  // Test backend connectivity if configured
  if (env.BACKEND_URL) {
    try {
      const backendHealth = await fetch(`${env.BACKEND_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      health.backend_status = backendHealth.ok ? 'reachable' : 'error';
      health.backend_http_status = backendHealth.status;

      if (!backendHealth.ok) {
        health.status = 'degraded';
        health.backend_error = await backendHealth.text();
      }
    } catch (error) {
      health.status = 'degraded';
      health.backend_status = 'unreachable';
      health.backend_error = error instanceof Error ? error.message : 'Unknown error';
    }
  } else {
    health.status = 'degraded';
    health.warning = 'BACKEND_URL not configured';
  }

  return jsonResponse(health, health.status === 'ok' ? 200 : 503);
}

async function handleAuthRequest(request: Request, env: Env, url: URL): Promise<Response> {
  const path = url.pathname.replace(AUTH_PREFIX, '');

  // Health check endpoint
  if (path === '/health' && request.method === 'GET') {
    return handleHealthCheck(env);
  }

  // OAuth login endpoints
  if (path === '/google' && request.method === 'GET') {
    return handleOAuthLogin('google', request, env);
  }

  if (path === '/github' && request.method === 'GET') {
    return handleOAuthLogin('github', request, env);
  }

  // OAuth callback endpoints
  if (path === '/callback/google' && request.method === 'GET') {
    return handleOAuthCallback('google', request, env);
  }

  if (path === '/callback/github' && request.method === 'GET') {
    return handleOAuthCallback('github', request, env);
  }

  // Session management endpoints
  if (path === '/session' && request.method === 'GET') {
    return handleGetSession(request, env);
  }

  if (path === '/logout' && request.method === 'POST') {
    return handleLogout(request, env);
  }

  return jsonResponse({ error: 'Not found' }, 404);
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
  SESSIONS?: KVNamespace; // Optional - configured via Dashboard for Pages deployment
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle authentication routes
    if (url.pathname.startsWith(AUTH_PREFIX)) {
      return handleAuthRequest(request, env, url);
    }

    // Handle API requests (with session validation)
    if (url.pathname.startsWith(API_PREFIX)) {
      return handleApiRequest(request, env, url);
    }

    // Handle static assets
    return handleAssetRequest(request, env, url);
  },
};
