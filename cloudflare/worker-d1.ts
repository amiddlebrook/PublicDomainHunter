/**
 * 100% Cloudflare Native Worker with D1 Database
 * Handles authentication directly - NO external backend needed
 */

interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  SESSIONS?: KVNamespace;
}

// ============================================================================
// Password Hashing (using Web Crypto API - native to Cloudflare Workers)
// ============================================================================

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// ============================================================================
// Password Validation
// ============================================================================

function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one digit' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }
  return { valid: true };
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================================================
// JSON Response Helper
// ============================================================================

function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// ============================================================================
// Registration Handler
// ============================================================================

async function handleRegister(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as {
      email: string;
      username: string;
      password: string;
      full_name?: string;
    };

    // Validate required fields
    if (!body.email || !body.username || !body.password) {
      return jsonResponse({
        detail: 'Email, username, and password are required'
      }, 400);
    }

    // Validate email
    if (!validateEmail(body.email)) {
      return jsonResponse({
        detail: 'Invalid email format'
      }, 400);
    }

    // Validate password
    const passwordCheck = validatePassword(body.password);
    if (!passwordCheck.valid) {
      return jsonResponse({
        detail: passwordCheck.error
      }, 400);
    }

    // Check if email already exists
    const existingEmail = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(body.email).first();

    if (existingEmail) {
      return jsonResponse({
        detail: 'Email already registered'
      }, 400);
    }

    // Check if username already exists
    const existingUsername = await env.DB.prepare(
      'SELECT id FROM users WHERE username = ?'
    ).bind(body.username).first();

    if (existingUsername) {
      return jsonResponse({
        detail: 'Username already taken'
      }, 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(body.password);

    // Insert new user
    const result = await env.DB.prepare(`
      INSERT INTO users (email, username, hashed_password, full_name, is_active, is_superuser)
      VALUES (?, ?, ?, ?, 1, 0)
    `).bind(
      body.email,
      body.username,
      hashedPassword,
      body.full_name || null
    ).run();

    // Get the created user
    const user = await env.DB.prepare(
      'SELECT id, email, username, full_name, created_at FROM users WHERE email = ?'
    ).bind(body.email).first();

    return jsonResponse({
      id: user!.id,
      email: user!.email,
      username: user!.username,
      full_name: user!.full_name,
      created_at: user!.created_at
    }, 201);

  } catch (error) {
    console.error('Registration error:', error);
    return jsonResponse({
      detail: 'Internal server error during registration'
    }, 500);
  }
}

// ============================================================================
// Login Handler
// ============================================================================

async function handleLogin(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as {
      username: string;
      password: string;
    };

    if (!body.username || !body.password) {
      return jsonResponse({
        detail: 'Username and password are required'
      }, 400);
    }

    // Get user by username
    const user = await env.DB.prepare(
      'SELECT id, email, username, hashed_password, full_name, is_active FROM users WHERE username = ?'
    ).bind(body.username).first();

    if (!user) {
      return jsonResponse({
        detail: 'Invalid username or password'
      }, 401);
    }

    if (!user.is_active) {
      return jsonResponse({
        detail: 'Account is inactive'
      }, 401);
    }

    // Verify password
    const isValid = await verifyPassword(body.password, user.hashed_password as string);
    if (!isValid) {
      return jsonResponse({
        detail: 'Invalid username or password'
      }, 401);
    }

    // Return user data (in production, you'd also generate a JWT token here)
    return jsonResponse({
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    return jsonResponse({
      detail: 'Internal server error during login'
    }, 500);
  }
}

// ============================================================================
// Health Check
// ============================================================================

async function handleHealthCheck(env: Env): Promise<Response> {
  try {
    // Test D1 connection
    const result = await env.DB.prepare('SELECT 1 as test').first();

    return jsonResponse({
      status: 'ok',
      timestamp: new Date().toISOString(),
      cloudflare_worker: 'running',
      d1_database: result ? 'connected' : 'disconnected',
      database_binding: 'DB'
    });
  } catch (error) {
    return jsonResponse({
      status: 'error',
      timestamp: new Date().toISOString(),
      cloudflare_worker: 'running',
      d1_database: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 503);
  }
}

// ============================================================================
// Asset Handler (for frontend)
// ============================================================================

async function handleAssets(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  // Try to serve the requested asset
  const assetResponse = await env.ASSETS.fetch(request);

  if (assetResponse.status === 404) {
    // For HTML requests (browser navigation), serve index.html (SPA fallback)
    const acceptHeader = request.headers.get('accept') || '';
    if (request.method === 'GET' && !url.pathname.includes('.') && acceptHeader.includes('text/html')) {
      const indexRequest = new Request(new URL('/index.html', request.url), request);
      return env.ASSETS.fetch(indexRequest);
    }
  }

  return assetResponse;
}

// ============================================================================
// Main Request Router
// ============================================================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // API Routes
    if (url.pathname === '/api/auth/register' && request.method === 'POST') {
      return handleRegister(request, env);
    }

    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      return handleLogin(request, env);
    }

    if (url.pathname === '/auth/health' && request.method === 'GET') {
      return handleHealthCheck(env);
    }

    if (url.pathname === '/health' && request.method === 'GET') {
      return handleHealthCheck(env);
    }

    // Serve static assets (frontend)
    return handleAssets(request, env);
  },
};
