import { KVNamespace } from '@cloudflare/workers-types';

/**
 * Cloudflare-native authentication utilities
 * Handles OAuth flows, session management, and edge validation
 */

export interface Session {
  userId: string;
  email: string;
  username: string;
  provider: 'password' | 'google' | 'github';
  createdAt: number;
  expiresAt: number;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
}

const OAUTH_PROVIDERS: Record<string, Omit<OAuthConfig, 'clientId' | 'clientSecret'>> = {
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scope: 'openid email profile',
  },
  github: {
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scope: 'read:user user:email',
  },
};

/**
 * Generate a secure random session ID
 */
export async function generateSessionId(): Promise<string> {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a new session and store it in KV
 */
export async function createSession(
  kv: KVNamespace | undefined,
  userId: string,
  email: string,
  username: string,
  provider: Session['provider'],
  expirationSeconds: number = 86400 * 7 // 7 days
): Promise<string> {
  if (!kv) {
    throw new Error('KV namespace not configured - sessions are not available');
  }
  const sessionId = await generateSessionId();
  const now = Date.now();

  const session: Session = {
    userId,
    email,
    username,
    provider,
    createdAt: now,
    expiresAt: now + (expirationSeconds * 1000),
  };

  // Store in KV with automatic expiration
  await kv.put(`session:${sessionId}`, JSON.stringify(session), {
    expirationTtl: expirationSeconds,
  });

  return sessionId;
}

/**
 * Get a session from KV
 */
export async function getSession(kv: KVNamespace | undefined, sessionId: string): Promise<Session | null> {
  if (!kv) {
    return null;
  }
  const sessionData = await kv.get(`session:${sessionId}`, 'text');

  if (!sessionData) {
    return null;
  }

  const session: Session = JSON.parse(sessionData);

  // Check if session is expired
  if (session.expiresAt < Date.now()) {
    await deleteSession(kv, sessionId);
    return null;
  }

  return session;
}

/**
 * Delete a session from KV
 */
export async function deleteSession(kv: KVNamespace | undefined, sessionId: string): Promise<void> {
  if (!kv) {
    return;
  }
  await kv.delete(`session:${sessionId}`);
}

/**
 * Extract session ID from request cookies
 */
export function getSessionIdFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith('session='));

  if (!sessionCookie) {
    return null;
  }

  return sessionCookie.split('=')[1];
}

/**
 * Create a session cookie header
 */
/**
 * Create a session cookie header
 */
export function createSessionCookie(
  sessionId: string,
  domain: string,
  secure: boolean = true
): string {
  const maxAge = 86400 * 7; // 7 days

  // Determine if we should set the Domain attribute
  // We generally want to set it for the root domain (e.g., .publicdomainhunter.com)
  // so it's shared between www, api, etc.
  // But for localhost, we shouldn't set it (or set it to empty)
  let domainAttr = '';
  if (domain && !domain.includes('localhost') && !domain.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
    // If it's a real domain, prefix with dot to make it a wildcard for subdomains
    const rootDomain = domain.startsWith('.') ? domain : `.${domain}`;
    domainAttr = `Domain=${rootDomain};`;
  }

  return [
    `session=${sessionId}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'HttpOnly',
    'SameSite=Lax',
    secure ? 'Secure' : '',
    domainAttr
  ]
    .filter(Boolean)
    .join('; ');
}

/**
 * Clear session cookie header
 * Returns an array of cookie strings to ensure we clear both host-only and domain cookies
 */
export function clearSessionCookie(domain?: string): string[] {
  const base = 'session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax';

  const cookies = [base];

  // Also try to clear domain-scoped cookie if a domain is provided
  if (domain && !domain.includes('localhost') && !domain.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
    const rootDomain = domain.startsWith('.') ? domain : `.${domain}`;
    cookies.push(`${base}; Domain=${rootDomain}`);
  }

  return cookies;
}

/**
 * Build OAuth authorization URL
 */
export function buildOAuthUrl(
  provider: keyof typeof OAUTH_PROVIDERS,
  clientId: string,
  redirectUri: string,
  state: string
): string {
  const config = OAUTH_PROVIDERS[provider];
  const url = new URL(config.authUrl);

  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', config.scope);
  url.searchParams.set('state', state);

  return url.toString();
}

/**
 * Exchange OAuth code for access token
 */
export async function exchangeOAuthCode(
  provider: keyof typeof OAUTH_PROVIDERS,
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<string> {
  const config = OAUTH_PROVIDERS[provider];

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    throw new Error(`OAuth token exchange failed: ${response.statusText}`);
  }

  const data = await response.json() as { access_token: string };
  return data.access_token;
}

/**
 * Get user info from OAuth provider
 */
export async function getOAuthUserInfo(
  provider: keyof typeof OAUTH_PROVIDERS,
  accessToken: string
): Promise<{ email: string; name: string; id: string }> {
  const config = OAUTH_PROVIDERS[provider];

  const response = await fetch(config.userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get user info: ${response.statusText}`);
  }

  const data = await response.json() as any;

  if (provider === 'google') {
    return {
      email: data.email,
      name: data.name,
      id: data.id,
    };
  } else if (provider === 'github') {
    // GitHub might need a separate call for email if it's private
    let email = data.email;

    if (!email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (emailResponse.ok) {
        const emails = await emailResponse.json() as Array<{ email: string; primary: boolean; verified: boolean }>;
        const primaryEmail = emails.find(e => e.primary && e.verified);
        email = primaryEmail?.email || emails[0]?.email;
      }
    }

    return {
      email: email || '',
      name: data.name || data.login,
      id: data.id.toString(),
    };
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

/**
 * Generate a random state parameter for OAuth
 */
export async function generateOAuthState(): Promise<string> {
  const buffer = new Uint8Array(16);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Store OAuth state in KV (to prevent CSRF)
 */
export async function storeOAuthState(kv: KVNamespace | undefined, state: string): Promise<void> {
  if (!kv) {
    throw new Error('KV namespace not configured - OAuth is not available');
  }
  await kv.put(`oauth_state:${state}`, 'valid', {
    expirationTtl: 600, // 10 minutes
  });
}

/**
 * Verify and consume OAuth state
 */
export async function verifyOAuthState(kv: KVNamespace | undefined, state: string): Promise<boolean> {
  if (!kv) {
    return false;
  }
  const value = await kv.get(`oauth_state:${state}`);

  if (value === 'valid') {
    await kv.delete(`oauth_state:${state}`);
    return true;
  }

  return false;
}

/**
 * Validate session and return user info
 */
export async function validateSession(
  request: Request,
  kv: KVNamespace | undefined
): Promise<Session | null> {
  // If KV namespace is not configured, sessions are not available
  if (!kv) {
    return null;
  }

  const sessionId = getSessionIdFromRequest(request);

  if (!sessionId) {
    return null;
  }

  return getSession(kv, sessionId);
}
