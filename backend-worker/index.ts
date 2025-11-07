/**
 * Cloudflare Worker Backend for Public Domain Hunter
 * Handles authentication and API endpoints
 */

interface Env {
  DB: D1Database;
  SECRET_KEY: string;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Password validation
function validatePasswordStrength(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one digit' };
  }
  if (!/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  return { valid: true, message: 'Password is strong' };
}

// Hash password using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify password
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Generate JWT token
async function generateToken(userId: number, username: string, env: Env): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: username,
    userId,
    exp: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header));
  const payloadB64 = btoa(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(env.SECRET_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

  return `${data}.${signatureB64}`;
}

// JSON response helper
function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

// Handle registration
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
      return jsonResponse({ detail: 'Missing required fields' }, 400);
    }

    // Validate password strength
    const passwordCheck = validatePasswordStrength(body.password);
    if (!passwordCheck.valid) {
      return jsonResponse({ detail: passwordCheck.message }, 400);
    }

    // Check if user already exists
    const existingUser = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ? OR username = ?'
    ).bind(body.email, body.username).first();

    if (existingUser) {
      return jsonResponse({ detail: 'Email or username already registered' }, 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(body.password);

    // Insert user
    const result = await env.DB.prepare(
      `INSERT INTO users (email, username, hashed_password, full_name, is_active, is_superuser, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      body.email,
      body.username,
      hashedPassword,
      body.full_name || null,
      1, // is_active
      0  // is_superuser
    ).run();

    if (!result.success) {
      return jsonResponse({ detail: 'Failed to create user account. Please try again later.' }, 500);
    }

    // Get the created user
    const user = await env.DB.prepare(
      'SELECT id, email, username, full_name, is_active, is_superuser, created_at, updated_at FROM users WHERE email = ?'
    ).bind(body.email).first();

    return jsonResponse(user, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return jsonResponse({ detail: 'Registration failed' }, 500);
  }
}

// Handle login
async function handleLogin(request: Request, env: Env): Promise<Response> {
  try {
    const formData = await request.formData();
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!username || !password) {
      return jsonResponse({ detail: 'Missing username or password' }, 400);
    }

    // Get user
    const user = await env.DB.prepare(
      'SELECT id, username, hashed_password, is_active FROM users WHERE username = ?'
    ).bind(username).first() as any;

    if (!user) {
      return jsonResponse({ detail: 'Incorrect username or password' }, 401);
    }

    if (!user.is_active) {
      return jsonResponse({ detail: 'Inactive user' }, 400);
    }

    // Verify password
    const validPassword = await verifyPassword(password, user.hashed_password);
    if (!validPassword) {
      return jsonResponse({ detail: 'Incorrect username or password' }, 401);
    }

    // Generate token
    const token = await generateToken(user.id, user.username, env);

    return jsonResponse({
      access_token: token,
      token_type: 'bearer',
    });
  } catch (error) {
    console.error('Login error:', error);
    return jsonResponse({ detail: 'Login failed' }, 500);
  }
}

// Handle OAuth registration/login
async function handleOAuth(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as {
      provider: string;
      provider_user_id: string;
      email: string;
      name: string;
    };

    // Check if user exists
    let user = await env.DB.prepare(
      'SELECT id, email, username, full_name, is_active, is_superuser, created_at, updated_at FROM users WHERE email = ?'
    ).bind(body.email).first() as any;

    if (user) {
      if (!user.is_active) {
        return jsonResponse({ detail: 'User account is inactive' }, 400);
      }

      // Update full_name if different
      if (body.name && user.full_name !== body.name) {
        await env.DB.prepare(
          'UPDATE users SET full_name = ?, updated_at = datetime(\'now\') WHERE id = ?'
        ).bind(body.name, user.id).run();
        user.full_name = body.name;
      }

      return jsonResponse(user);
    }

    // Create new user
    const baseUsername = body.email.split('@')[0].toLowerCase();
    let username = baseUsername;
    let counter = 1;

    // Ensure unique username
    while (true) {
      const existing = await env.DB.prepare(
        'SELECT id FROM users WHERE username = ?'
      ).bind(username).first();

      if (!existing) break;
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Insert user (no password for OAuth users)
    await env.DB.prepare(
      `INSERT INTO users (email, username, hashed_password, full_name, is_active, is_superuser, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(body.email, username, '', body.name, 1, 0).run();

    // Get created user
    user = await env.DB.prepare(
      'SELECT id, email, username, full_name, is_active, is_superuser, created_at, updated_at FROM users WHERE email = ?'
    ).bind(body.email).first();

    return jsonResponse(user);
  } catch (error) {
    console.error('OAuth error:', error);
    return jsonResponse({ detail: 'OAuth login failed' }, 500);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Route handling
    if (url.pathname === '/api/auth/register' && request.method === 'POST') {
      return handleRegister(request, env);
    }

    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      return handleLogin(request, env);
    }

    if (url.pathname === '/api/auth/oauth' && request.method === 'POST') {
      return handleOAuth(request, env);
    }

    if (url.pathname === '/api/auth/me' && request.method === 'GET') {
      // TODO: Implement JWT verification and return user info
      return jsonResponse({ detail: 'Not implemented' }, 501);
    }

    return jsonResponse({ detail: 'Not found' }, 404);
  },
};
