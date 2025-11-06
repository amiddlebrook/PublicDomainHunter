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

import {
  authenticateUser,
  createUser,
  getUserByEmail,
  getUserByUsername,
  validatePassword,
  type User,
} from './user-auth';

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

async function handleRegister(request: Request, env: Env): Promise<Response> {
  if (!env.AUTH_STORE) {
    return jsonResponse({
      detail: 'Authentication not configured. Please set up the AUTH_STORE KV namespace in your Cloudflare Pages settings. See wrangler.toml for instructions.'
    }, 503);
  }

  try {
    const body = await request.json() as {
      email: string;
      username: string;
      password: string;
      full_name?: string;
    };

    const { email, username, password, full_name } = body;

    if (!email || !username || !password) {
      return jsonResponse({ detail: 'Email, username, and password are required' }, 400);
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return jsonResponse({ detail: passwordValidation.message }, 400);
    }

    // Check if user already exists
    const existingUserByEmail = await getUserByEmail(env.AUTH_STORE, email);
    if (existingUserByEmail) {
      return jsonResponse({ detail: 'Email already registered' }, 400);
    }

    const existingUserByUsername = await getUserByUsername(env.AUTH_STORE, username);
    if (existingUserByUsername) {
      return jsonResponse({ detail: 'Username already taken' }, 400);
    }

    // Create user
    const user = await createUser(env.AUTH_STORE, email, username, password, full_name);

    // Return user (without password hash)
    return jsonResponse({
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.fullName,
      is_active: user.isActive,
      is_superuser: user.isSuperuser,
      created_at: new Date(user.createdAt).toISOString(),
      updated_at: new Date(user.updatedAt).toISOString(),
    }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return jsonResponse({ detail: 'Registration failed' }, 500);
  }
}

async function handleLogin(request: Request, env: Env): Promise<Response> {
  if (!env.AUTH_STORE) {
    return jsonResponse({
      detail: 'Authentication not configured. Please set up the AUTH_STORE KV namespace in your Cloudflare Pages settings. See wrangler.toml for instructions.'
    }, 503);
  }

  try {
    const body = await request.json() as {
      username: string;
      password: string;
    };

    const { username, password } = body;

    if (!username || !password) {
      return jsonResponse({ detail: 'Username and password are required' }, 400);
    }

    // Authenticate user
    const user = await authenticateUser(env.AUTH_STORE, username, password);
    if (!user) {
      return jsonResponse({ detail: 'Incorrect username or password' }, 401);
    }

    if (!user.isActive) {
      return jsonResponse({ detail: 'Account is inactive' }, 400);
    }

    // Create session
    const sessionId = await createSession(
      env.AUTH_STORE,
      user.id,
      user.email,
      user.username,
      'password'
    );

    // Create session cookie
    const url = new URL(request.url);
    const cookie = createSessionCookie(sessionId, url.hostname, url.protocol === 'https:');

    return jsonResponse(
      { access_token: sessionId, token_type: 'bearer' },
      200,
      { 'Set-Cookie': cookie }
    );
  } catch (error) {
    console.error('Login error:', error);
    return jsonResponse({ detail: 'Login failed' }, 500);
  }
}

async function handleGetMe(request: Request, env: Env): Promise<Response> {
  if (!env.AUTH_STORE) {
    return jsonResponse({ detail: 'Authentication not configured' }, 503);
  }

  const session = await validateSession(request, env.AUTH_STORE);

  if (!session) {
    return jsonResponse({ detail: 'Not authenticated' }, 401);
  }

  return jsonResponse({
    id: session.userId,
    email: session.email,
    username: session.username,
    is_active: true,
    provider: session.provider,
  });
}

async function handleApiRequest(request: Request, env: Env, url: URL): Promise<Response> {
  // Handle auth endpoints locally
  if (url.pathname === '/api/auth/register' && request.method === 'POST') {
    return handleRegister(request, env);
  }

  if (url.pathname === '/api/auth/login' && request.method === 'POST') {
    return handleLogin(request, env);
  }

  if (url.pathname === '/api/auth/me' && request.method === 'GET') {
    return handleGetMe(request, env);
  }

  if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
    return handleLogout(request, env);
  }

  // Proxy other requests to backend if configured
  if (!env.BACKEND_URL) {
    return jsonResponse({ error: "Backend not configured for this endpoint" }, 501);
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

  // If there's a session, validate it and add user info to request
  const session = await validateSession(request, env.AUTH_STORE);
  if (session) {
    init.headers.set('X-User-Id', session.userId);
    init.headers.set('X-User-Email', session.email);
    init.headers.set('X-User-Username', session.username);
  }

  if (HTTP_METHODS_WITH_BODY.has(request.method)) {
    const cloned = request.clone();
    init.body = await cloned.arrayBuffer();
  }

  return fetch(backendUrl.toString(), init);
}

async function handleOAuthLogin(
  provider: 'google' | 'github',
  request: Request,
  env: Env
): Promise<Response> {
  if (!env.AUTH_STORE) {
    return jsonResponse({
      error: 'OAuth not available',
      message: 'KV namespace not configured. Please see QUICK_START.md for setup instructions.'
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
  await storeOAuthState(env.AUTH_STORE, state);

  // Build OAuth URL
  const authUrl = buildOAuthUrl(provider, clientId, redirectUri, state);

  return Response.redirect(authUrl, 302);
}

async function handleOAuthCallback(
  provider: 'google' | 'github',
  request: Request,
  env: Env
): Promise<Response> {
  if (!env.AUTH_STORE) {
    return Response.redirect(`/?error=${encodeURIComponent('OAuth not configured')}`, 302);
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
  const isValidState = await verifyOAuthState(env.AUTH_STORE, state);
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
      env.AUTH_STORE,
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
  if (!env.AUTH_STORE) {
    return jsonResponse({ authenticated: false }, 401);
  }

  const session = await validateSession(request, env.AUTH_STORE);

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
  if (env.AUTH_STORE) {
    const sessionId = getSessionIdFromRequest(request);
    if (sessionId) {
      await deleteSession(env.AUTH_STORE, sessionId);
    }
  }

  return jsonResponse(
    { message: 'Logged out successfully' },
    200,
    { 'Set-Cookie': clearSessionCookie() }
  );
}

async function handleAuthRequest(request: Request, env: Env, url: URL): Promise<Response> {
  const path = url.pathname.replace(AUTH_PREFIX, '');

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
  BACKEND_URL?: string;
  ASSETS: AssetFetcher;
  AUTH_STORE?: KVNamespace;  // Optional - enables authentication when configured
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
