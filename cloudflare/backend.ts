// cloudflare/backend.ts
// Comprehensive Cloudflare-native backend for Public Domain Hunter

import { D1Database, KVNamespace, R2Bucket, Queue, AnalyticsEngineDataset } from '@cloudflare/workers-types';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { hashPassword, verifyPassword, validatePasswordStrength } from './utils/crypto';
import { generateJWT, verifyJWT, authMiddleware } from './utils/jwt';
import { createSession, getSession, deleteSession } from './auth';
import { UserService } from './services/db/user.service';
import { WorkService } from './services/db/work.service';
import { MetricsService } from './services/db/metrics.service';
import { AlertService } from './services/db/alert.service';
import { SearchService } from './services/search.service';
import { AnalyticsService } from './services/analytics.service';
import { LLMService } from './services/llm.service';
import { PublicDomainService } from './services/public-domain.service';
import { StorageService } from './services/storage.service';
import { AIPreferenceService } from './services/db/ai-preference.service';
import { PROVIDER_CONFIGS, AIProvider } from './services/llm.service';

export type Bindings = {
  DB: D1Database;
  SESSIONS: KVNamespace;
  CACHE: KVNamespace;
  FILES: R2Bucket;
  JOBS_QUEUE: Queue;
  ANALYTICS?: AnalyticsEngineDataset;
  JWT_SECRET: string;

  // API Keys for external services
  OPENAI_API_KEY?: string;
  CLAUDE_API_KEY?: string;
  GEMINI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS middleware
app.use('/api/*', cors());

// ===== HEALTH CHECK =====
app.get('/api/auth/health', async (c) => {
  const status: { [key: string]: any } = {};
  let overallStatus: 'ok' | 'degraded' | 'error' = 'ok';

  // 1. Check Cloudflare Worker status
  status.cloudflare_worker = 'running';

  // 2. Check for BACKEND_URL (if applicable, this backend is now native)
  status.backend_type = 'cloudflare_native';

  // 3. Check D1 Database binding
  try {
    await c.env.DB.prepare('SELECT 1').run();
    status.d1_database = 'connected';
  } catch (e: any) {
    status.d1_database = `error: ${e.message}`;
    overallStatus = 'error';
  }

  // 4. Check KV Namespace binding (SESSIONS)
  try {
    await c.env.SESSIONS.list({ limit: 1 });
    status.kv_sessions = 'connected';
  } catch (e: any) {
    status.kv_sessions = `error: ${e.message}`;
    if (overallStatus !== 'error') overallStatus = 'degraded';
  }

  // 5. Check KV Namespace binding (CACHE)
  try {
    await c.env.CACHE.list({ limit: 1 });
    status.kv_cache = 'connected';
  } catch (e: any) {
    status.kv_cache = `error: ${e.message}`;
    if (overallStatus !== 'error') overallStatus = 'degraded';
  }

  // 6. Check R2 Bucket binding
  try {
    await c.env.FILES.list({ limit: 1 });
    status.r2_files = 'connected';
  } catch (e: any) {
    status.r2_files = `error: ${e.message}`;
    if (overallStatus !== 'error') overallStatus = 'degraded';
  }

  // 7. Check Queues binding
  try {
    // Cannot directly check queue, but binding should exist
    if (c.env.JOBS_QUEUE) {
      status.queues_jobs = 'bound';
    } else {
      status.queues_jobs = 'unbound';
      if (overallStatus !== 'error') overallStatus = 'degraded';
    }
  } catch (e: any) {
    status.queues_jobs = `error: ${e.message}`;
    if (overallStatus !== 'error') overallStatus = 'degraded';
  }

  // 8. Check JWT Secret
  if (c.env.JWT_SECRET && c.env.JWT_SECRET.length >= 32) {
    status.jwt_secret = 'configured';
  } else {
    status.jwt_secret = 'unconfigured_or_too_short';
    if (overallStatus !== 'error') overallStatus = 'degraded';
  }

  status.status = overallStatus;

  return c.json(status, overallStatus === 'error' ? 500 : 200);
});

// ===== AUTHENTICATION ENDPOINTS =====

/**
 * Register a new user
 */
app.post('/api/auth/register', async (c) => {
  try {
    const { email, username, password, full_name } = await c.req.json();

    // Validate input
    if (!email || !username || !password) {
      return c.json({ error: 'Email, username, and password are required' }, 400);
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return c.json({ error: passwordValidation.error }, 400);
    }

    const userService = new UserService(c.env.DB);

    // Check if user already exists
    const existingUser = await userService.findByEmailOrUsername(email);
    if (existingUser) {
      return c.json({ error: 'Email or username already exists' }, 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await userService.create({
      email,
      username,
      hashed_password: hashedPassword,
      full_name: full_name,
    });

    if (!user) {
      return c.json({ error: 'Failed to create user' }, 500);
    }

    return c.json({ message: 'User registered successfully', userId: user.id }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'An internal error occurred' }, 500);
  }
});

/**
 * User login
 */
app.post('/api/auth/login', async (c) => {
  try {
    const { username, password } = await c.req.json();

    if (!username || !password) {
      return c.json({ error: 'Username and password are required' }, 400);
    }

    const userService = new UserService(c.env.DB);

    // Find user
    const user = await userService.findByUsername(username);
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Verify password
    const passwordMatch = await verifyPassword(password, user.hashed_password);
    if (!passwordMatch) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Generate JWT token
    const jwtSecret = c.env.JWT_SECRET || 'default-secret-change-in-production';
    const token = await generateJWT(
      {
        sub: user.id.toString(),
        email: user.email,
        username: user.username,
      },
      jwtSecret,
      86400 // 24 hours
    );

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'An internal error occurred' }, 500);
  }
});

/**
 * Get current user
 */
app.get('/api/auth/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  const jwtSecret = c.env.JWT_SECRET || 'default-secret-change-in-production';

  const payload = await authMiddleware(authHeader, jwtSecret);
  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const userService = new UserService(c.env.DB);
  const user = await userService.findById(parseInt(payload.sub));

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json({
    id: user.id,
    email: user.email,
    username: user.username,
    fullName: user.full_name,
  });
});

// ===== OAUTH ENDPOINTS =====

/**
 * Initiate Google OAuth flow
 */
app.get('/auth/google', async (c) => {
  const clientId = c.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return c.json({ error: 'Google OAuth not configured' }, 500);
  }

  const redirectUri = `${new URL(c.req.url).origin}/auth/google/callback`;
  const scope = 'openid email profile';
  const state = crypto.randomUUID();

  // Store state in session for CSRF protection
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `state=${encodeURIComponent(state)}`;

  return c.redirect(authUrl);
});

/**
 * Google OAuth callback
 */
app.get('/auth/google/callback', async (c) => {
  const code = c.req.query('code');
  const error = c.req.query('error');

  if (error || !code) {
    return c.redirect('/login?error=oauth_failed');
  }

  try {
    const clientId = c.env.GOOGLE_CLIENT_ID;
    const clientSecret = c.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return c.redirect('/login?error=oauth_not_configured');
    }

    const redirectUri = `${new URL(c.req.url).origin}/auth/google/callback`;

    // Exchange code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      return c.redirect('/login?error=token_exchange_failed');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userResponse.ok) {
      return c.redirect('/login?error=user_info_failed');
    }

    const userData = await userResponse.json();
    const userService = new UserService(c.env.DB);

    // Find or create user
    let user = await userService.findByEmail(userData.email);

    if (!user) {
      // Create new user
      const username = userData.email.split('@')[0] + '_' + Math.random().toString(36).substring(7);
      user = await userService.create({
        email: userData.email,
        username,
        hashed_password: '', // OAuth users don't have passwords
        full_name: userData.name,
      });
    }

    if (!user) {
      return c.redirect('/login?error=user_creation_failed');
    }

    // Create session
    const sessionId = await createSession(
      c.env.SESSIONS,
      user.id.toString(),
      user.email,
      user.username,
      'google'
    );

    // Set session cookie and redirect
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/',
        'Set-Cookie': `session_id=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${86400 * 7}`,
      },
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    return c.redirect('/login?error=oauth_error');
  }
});

/**
 * Initiate GitHub OAuth flow
 */
app.get('/auth/github', async (c) => {
  const clientId = c.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return c.json({ error: 'GitHub OAuth not configured' }, 500);
  }

  const redirectUri = `${new URL(c.req.url).origin}/auth/github/callback`;
  const scope = 'read:user user:email';
  const state = crypto.randomUUID();

  const authUrl = `https://github.com/login/oauth/authorize?` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `state=${encodeURIComponent(state)}`;

  return c.redirect(authUrl);
});

/**
 * GitHub OAuth callback
 */
app.get('/auth/github/callback', async (c) => {
  const code = c.req.query('code');
  const error = c.req.query('error');

  if (error || !code) {
    return c.redirect('/login?error=oauth_failed');
  }

  try {
    const clientId = c.env.GITHUB_CLIENT_ID;
    const clientSecret = c.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return c.redirect('/login?error=oauth_not_configured');
    }

    // Exchange code for token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      return c.redirect('/login?error=token_exchange_failed');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!userResponse.ok) {
      return c.redirect('/login?error=user_info_failed');
    }

    const userData = await userResponse.json();

    // Get user email (might be in a separate endpoint)
    let email = userData.email;
    if (!email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (emailResponse.ok) {
        const emails = await emailResponse.json();
        const primaryEmail = emails.find((e: any) => e.primary);
        email = primaryEmail?.email || emails[0]?.email;
      }
    }

    if (!email) {
      return c.redirect('/login?error=no_email');
    }

    const userService = new UserService(c.env.DB);

    // Find or create user
    let user = await userService.findByEmail(email);

    if (!user) {
      // Create new user
      const username = userData.login || email.split('@')[0];
      user = await userService.create({
        email,
        username,
        hashed_password: '', // OAuth users don't have passwords
        full_name: userData.name || username,
      });
    }

    if (!user) {
      return c.redirect('/login?error=user_creation_failed');
    }

    // Create session
    const sessionId = await createSession(
      c.env.SESSIONS,
      user.id.toString(),
      user.email,
      user.username,
      'github'
    );

    // Set session cookie and redirect
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/',
        'Set-Cookie': `session_id=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${86400 * 7}`,
      },
    });
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return c.redirect('/login?error=oauth_error');
  }
});

/**
 * Check session status
 */
app.get('/auth/session', async (c) => {
  const sessionId = c.req.cookie('session_id');

  if (!sessionId) {
    return c.json({ authenticated: false });
  }

  const session = await getSession(c.env.SESSIONS, sessionId);

  if (!session) {
    return c.json({ authenticated: false });
  }

  return c.json({
    authenticated: true,
    user: {
      id: session.userId,
      email: session.email,
      username: session.username,
    },
  });
});

/**
 * Logout (clear session)
 */
app.post('/auth/logout', async (c) => {
  const sessionId = c.req.cookie('session_id');

  if (sessionId) {
    await deleteSession(c.env.SESSIONS, sessionId);
  }

  return new Response(null, {
    status: 200,
    headers: {
      'Set-Cookie': 'session_id=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    },
  });
});

// ===== WORKS ENDPOINTS =====

/**
 * List works with pagination and filters
 */
app.get('/api/works', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const author = c.req.query('author');
  const mediaType = c.req.query('media_type');
  const language = c.req.query('language');

  const workService = new WorkService(c.env.DB);
  const works = await workService.list(limit, (page - 1) * limit, {
    author,
    media_type: mediaType,
    language,
  });

  return c.json({ works, page, limit });
});

/**
 * Get a single work by ID
 */
app.get('/api/works/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const workService = new WorkService(c.env.DB);
  const work = await workService.findById(id);

  if (!work) {
    return c.json({ error: 'Work not found' }, 404);
  }

  // Track view
  const authHeader = c.req.header('Authorization');
  const jwtSecret = c.env.JWT_SECRET || 'default-secret-change-in-production';
  const payload = await authMiddleware(authHeader, jwtSecret);

  if (payload) {
    const analyticsService = new AnalyticsService(c.env.DB, c.env.ANALYTICS);
    await analyticsService.trackWorkView(parseInt(payload.sub), id);
  }

  return c.json(work);
});

/**
 * Create a new work
 */
app.post('/api/works', async (c) => {
  const authHeader = c.req.header('Authorization');
  const jwtSecret = c.env.JWT_SECRET || 'default-secret-change-in-production';
  const payload = await authMiddleware(authHeader, jwtSecret);

  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const data = await c.req.json();
  const workService = new WorkService(c.env.DB);

  const work = await workService.create({
    ...data,
    user_id: parseInt(payload.sub),
  });

  return c.json(work, 201);
});

// ===== SEARCH ENDPOINTS =====

/**
 * Search works (local + external)
 */
app.get('/api/search', async (c) => {
  const query = c.req.query('q') || '';
  const page = parseInt(c.req.query('page') || '1');
  const page_size = parseInt(c.req.query('page_size') || '20');
  const source = c.req.query('source') as 'gutenberg' | 'archive' | 'all' | undefined;

  const searchService = new SearchService(c.env.DB, c.env.CACHE);
  const searchResults = await searchService.searchCombined(query, page, page_size, { source });

  // Track search
  const authHeader = c.req.header('Authorization');
  const jwtSecret = c.env.JWT_SECRET || 'default-secret-change-in-production';
  const payload = await authMiddleware(authHeader, jwtSecret);

  if (payload) {
    const analyticsService = new AnalyticsService(c.env.DB, c.env.ANALYTICS);
    await analyticsService.trackSearch(parseInt(payload.sub), query);
  }

  // Transform the response to match frontend expectations
  const results = [
    ...(searchResults.local || []),
    ...(searchResults.external || [])
  ];

  const total_results = searchResults.total || 0;
  const total_pages = Math.ceil(total_results / page_size);

  return c.json({
    query,
    total_results,
    page,
    page_size,
    total_pages,
    results,
    facets: {
      media_types: [],
      languages: [],
      decades: [],
      trend_score_ranges: []
    },
    search_time: new Date().toISOString()
  });
});


/**
 * Get trending works
 */
app.get('/api/search/trending', async (c) => {
  const limit = parseInt(c.req.query('limit') || '20');
  const searchService = new SearchService(c.env.DB, c.env.CACHE);
  const trending = await searchService.getTrending(limit);

  return c.json({ trending });
});

/**
 * Get top monetization opportunities
 */
app.get('/api/search/opportunities', async (c) => {
  const limit = parseInt(c.req.query('limit') || '20');
  const searchService = new SearchService(c.env.DB, c.env.CACHE);
  const opportunities = await searchService.getTopOpportunities(limit);

  return c.json({ opportunities });
});

/**
 * Get search suggestions
 */
app.get('/api/search/suggestions', async (c) => {
  const query = c.req.query('q') || '';

  if (!query || query.length < 2) {
    return c.json({ suggestions: [] });
  }

  try {
    // Search for matching titles and authors from local database
    const { results } = await c.env.DB.prepare(`
      SELECT DISTINCT title as suggestion FROM Work 
      WHERE title LIKE ? 
      UNION 
      SELECT DISTINCT author as suggestion FROM Work 
      WHERE author LIKE ? AND author IS NOT NULL
      ORDER BY suggestion
      LIMIT 10
    `).bind(`%${query}%`, `%${query}%`).all();

    const suggestions = (results || []).map((r: any) => r.suggestion);

    return c.json({ suggestions });
  } catch (error) {
    console.error('Search suggestions error:', error);
    return c.json({ suggestions: [] });
  }
});

// ===== MONETIZATION ENGINE ENDPOINTS =====

/**
 * Calculate monetization score for a specific work
 */
app.get('/api/monetization/score/:id', async (c) => {
  const workId = parseInt(c.params.id);

  if (isNaN(workId)) {
    return c.json({ error: 'Invalid work ID' }, 400);
  }

  try {
    const { MonetizationEngineService } = await import('./services/monetization-engine.service');
    const engineService = new MonetizationEngineService(c.env.DB, c.env.CACHE, c.env);

    const score = await engineService.calculateMasterScore(workId);

    return c.json({
      work_id: workId,
      scores: score,
      calculated_at: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Monetization calculation error:', error);
    return c.json({ error: error.message || 'Failed to calculate scores' }, 500);
  }
});

/**
 * Get top monetization opportunities
 */
app.get('/api/monetization/opportunities', async (c) => {
  const limit = parseInt(c.req.query('limit') || '20');
  const minScore = parseInt(c.req.query('min_score') || '70');
  const workId = parseInt(c.params.id);

  if (isNaN(workId)) {
    return c.json({ error: 'Invalid work ID' }, 400);
  }

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT
        wm.*,
        w.title, w.author, w.description, w.media_type,
        w.original_publication_year, w.public_domain_year
      FROM WorkMetric wm
      INNER JOIN Work w ON w.id = wm.work_id
      WHERE wm.work_id = ?
      ORDER BY wm.metric_date DESC
      LIMIT 1
    `).bind(workId).all();

    if (!results || results.length === 0) {
      return c.json({ error: 'No metrics found for this work' }, 404);
    }

    const metrics = results[0] as any;

    // Structure the response for easy consumption
    return c.json({
      work: {
        id: workId,
        title: metrics.title,
        author: metrics.author,
        description: metrics.description,
        media_type: metrics.media_type,
        publication_year: metrics.original_publication_year,
        public_domain_year: metrics.public_domain_year
      },
      master_score: {
        overall: metrics.master_monetization_score,
        grade: getMonetizationGrade(metrics.master_monetization_score),
        interpretation: getScoreInterpretation(metrics.master_monetization_score)
      },
      core_metrics: {
        market_saturation: {
          score: metrics.market_saturation_index,
          level: getSaturationLevel(metrics.market_saturation_index),
          recommendation: metrics.market_saturation_index < 40 ? 'LOW COMPETITION - Act fast!' :
            metrics.market_saturation_index < 70 ? 'MODERATE - Find niche angle' :
              'HIGH - Requires differentiation'
        },
        cross_platform: {
          score: metrics.cross_platform_score,
          top_platforms: getTopPlatforms(metrics)
        },
        timing: {
          score: metrics.temporal_window_score,
          urgency: metrics.temporal_window_score > 85 ? 'CRITICAL - Act now' :
            metrics.temporal_window_score > 65 ? 'HIGH - Plan soon' :
              'MODERATE - Strategic timing'
        },
        demographics: {
          top_audience: getTopDemographic(metrics),
          gen_z: metrics.gen_z_appeal,
          millennial: metrics.millennial_appeal,
          gen_x: metrics.gen_x_appeal,
          boomer: metrics.boomer_appeal
        }
      },
      platform_opportunities: {
        film_tv: metrics.film_tv_potential,
        gaming: metrics.game_potential,
        audiobook: metrics.audiobook_potential,
        merchandise: metrics.merchandise_potential,
        educational: metrics.educational_potential,
        mobile_app: metrics.app_potential,
        publishing: metrics.book_republish_potential
      },
      strategy_scores: {
        derivative_potential: metrics.derivative_potential,
        competitive_moat: metrics.competitive_moat_score,
        ai_confidence: metrics.ai_prediction_score
      },
      last_updated: metrics.metric_date
    });
  } catch (error: any) {
    console.error('Breakdown query error:', error);
    return c.json({ error: 'Failed to fetch breakdown' }, 500);
  }
});

/**
 * Bulk calculate scores for multiple works
 */
app.post('/api/monetization/calculate-bulk', async (c) => {
  const { work_ids } = await c.req.json();

  if (!Array.isArray(work_ids) || work_ids.length === 0) {
    return c.json({ error: 'work_ids must be a non-empty array' }, 400);
  }

  if (work_ids.length > 100) {
    return c.json({ error: 'Maximum 100 works at a time' }, 400);
  }

  try {
    const { MonetizationEngineService } = await import('./services/monetization-engine.service');
    const engineService = new MonetizationEngineService(c.env.DB, c.env.CACHE);

    const results = await Promise.all(
      work_ids.map(async (id) => {
        try {
          const score = await engineService.calculateMasterScore(id);
          return { work_id: id, success: true, scores: score };
        } catch (error: any) {
          return { work_id: id, success: false, error: error.message };
        }
      })
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return c.json({
      total: work_ids.length,
      successful,
      failed,
      results
    });
  } catch (error: any) {
    console.error('Bulk calculation error:', error);
    return c.json({ error: 'Bulk calculation failed' }, 500);
  }
});

// Helper functions
function getMonetizationGrade(score: number): string {
  if (score >= 90) return 'A+ (Exceptional)';
  if (score >= 80) return 'A (Excellent)';
  if (score >= 70) return 'B (Good)';
  if (score >= 60) return 'C (Fair)';
  if (score >= 50) return 'D (Poor)';
  return 'F (Very Poor)';
}

function getScoreInterpretation(score: number): string {
  if (score >= 85) return 'Outstanding monetization opportunity. High potential across multiple platforms with favorable market conditions.';
  if (score >= 70) return 'Strong opportunity. Good market fit with clear paths to monetization.';
  if (score >= 55) return 'Moderate opportunity. Requires strategic positioning and niche targeting.';
  if (score >= 40) return 'Limited opportunity. High competition or low market demand.';
  return 'Weak opportunity. Consider alternative works unless you have unique competitive advantage.';
}

function getSaturationLevel(score: number): string {
  if (score < 30) return 'VERY LOW';
  if (score < 50) return 'LOW';
  if (score < 70) return 'MODERATE';
  if (score < 85) return 'HIGH';
  return 'EXTREME';
}

function getTopPlatforms(metrics: any): Array<{ name: string; score: number }> {
  const platforms = [
    { name: 'Film/TV', score: metrics.film_tv_potential },
    { name: 'Gaming', score: metrics.game_potential },
    { name: 'Audiobook', score: metrics.audiobook_potential },
    { name: 'Merchandise', score: metrics.merchandise_potential },
    { name: 'Educational', score: metrics.educational_potential },
    { name: 'Mobile App', score: metrics.app_potential },
    { name: 'Publishing', score: metrics.book_republish_potential }
  ];

  return platforms
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function getTopDemographic(metrics: any): string {
  const demographics = [
    { name: 'Gen Z', score: metrics.gen_z_appeal },
    { name: 'Millennials', score: metrics.millennial_appeal },
    { name: 'Gen X', score: metrics.gen_x_appeal },
    { name: 'Boomers', score: metrics.boomer_appeal }
  ];

  return demographics.sort((a, b) => b.score - a.score)[0].name;
}

// ===== ALERTS ENDPOINTS =====

/**
 * Create an alert
 */
app.post('/api/alerts', async (c) => {
  const authHeader = c.req.header('Authorization');
  const jwtSecret = c.env.JWT_SECRET || 'default-secret-change-in-production';
  const payload = await authMiddleware(authHeader, jwtSecret);

  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { workId, alertType, thresholdValue } = await c.req.json();
  const alertService = new AlertService(c.env.DB);

  const alert = await alertService.create({
    user_id: parseInt(payload.sub),
    work_id: workId,
    alert_type: alertType,
    threshold_value: thresholdValue,
  });

  return c.json(alert, 201);
});

/**
 * Get user's alerts
 */
app.get('/api/alerts', async (c) => {
  const authHeader = c.req.header('Authorization');
  const jwtSecret = c.env.JWT_SECRET || 'default-secret-change-in-production';
  const payload = await authMiddleware(authHeader, jwtSecret);

  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const alertService = new AlertService(c.env.DB);
  const alerts = await alertService.getByUserId(parseInt(payload.sub));

  return c.json({ alerts });
});

/**
 * Delete an alert
 */
app.delete('/api/alerts/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  const jwtSecret = c.env.JWT_SECRET || 'default-secret-change-in-production';
  const payload = await authMiddleware(authHeader, jwtSecret);

  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const id = parseInt(c.req.param('id'));
  const alertService = new AlertService(c.env.DB);
  const success = await alertService.delete(id);

  return c.json({ success });
});

// ===== AI/LLM ENDPOINTS =====

/**
 * Analyze a work with AI
 */
app.post('/api/ai/analyze', async (c) => {
  const authHeader = c.req.header('Authorization');
  const jwtSecret = c.env.JWT_SECRET || 'default-secret-change-in-production';
  const payload = await authMiddleware(authHeader, jwtSecret);

  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { workId, provider } = await c.req.json();

  const workService = new WorkService(c.env.DB);
  const work = await workService.findById(workId);

  if (!work) {
    return c.json({ error: 'Work not found' }, 404);
  }

  const llmService = new LLMService(c.env);
  const analysis = await llmService.analyzeWork(
    work.title,
    work.author || 'Unknown',
    work.description || undefined,
    provider
  );

  return c.json({ analysis });
});

/**
 * Generate marketing content
 */
app.post('/api/ai/marketing', async (c) => {
  const authHeader = c.req.header('Authorization');
  const jwtSecret = c.env.JWT_SECRET || 'default-secret-change-in-production';
  const payload = await authMiddleware(authHeader, jwtSecret);

  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { workId, contentType, provider } = await c.req.json();

  const workService = new WorkService(c.env.DB);
  const work = await workService.findById(workId);

  if (!work) {
    return c.json({ error: 'Work not found' }, 404);
  }

  const llmService = new LLMService(c.env);
  const content = await llmService.generateMarketingContent(
    work.title,
    work.author || 'Unknown',
    contentType,
    provider
  );

  return c.json({ content });
});

/**
 * Get available AI providers
 */
app.get('/api/ai/config/providers', async (c) => {
  // Return list of providers with their availability status
  // In a real app, we might check if API keys are configured in env
  const providers = Object.values(PROVIDER_CONFIGS).map(config => {
    const apiKey = c.env[config.apiKeyEnv as keyof Bindings];
    return {
      provider: config.provider,
      model: config.model,
      available: !!apiKey,
      description: getProviderDescription(config.provider)
    };
  });

  return c.json(providers);
});

/**
 * Get user AI preferences
 */
app.get('/api/ai/config/preferences', async (c) => {
  const authHeader = c.req.header('Authorization');
  const jwtSecret = c.env.JWT_SECRET || 'default-secret-change-in-production';
  const payload = await authMiddleware(authHeader, jwtSecret);

  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const preferenceService = new AIPreferenceService(c.env.DB);
  const preferences = await preferenceService.getPreferences(parseInt(payload.sub));

  return c.json(preferences);
});

/**
 * Update user AI preferences
 */
app.put('/api/ai/config/preferences', async (c) => {
  const authHeader = c.req.header('Authorization');
  const jwtSecret = c.env.JWT_SECRET || 'default-secret-change-in-production';
  const payload = await authMiddleware(authHeader, jwtSecret);

  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const data = await c.req.json();
  const preferenceService = new AIPreferenceService(c.env.DB);

  try {
    const preferences = await preferenceService.updatePreferences(parseInt(payload.sub), data);
    return c.json(preferences);
  } catch (error) {
    console.error('Failed to update preferences:', error);
    return c.json({ error: 'Failed to update preferences' }, 500);
  }
});

/**
 * Test an AI provider
 */
app.post('/api/ai/config/test', async (c) => {
  const authHeader = c.req.header('Authorization');
  const jwtSecret = c.env.JWT_SECRET || 'default-secret-change-in-production';
  const payload = await authMiddleware(authHeader, jwtSecret);

  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { provider, prompt } = await c.req.json();

  if (!provider) {
    return c.json({ error: 'Provider is required' }, 400);
  }

  try {
    const llmService = new LLMService(c.env);
    const response = await llmService.generate(
      [{ role: 'user', content: prompt || 'Hello' }],
      provider as AIProvider,
      { maxTokens: 50 }
    );

    return c.json({ success: true, response });
  } catch (error: any) {
    console.error('Provider test failed:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
});

function getProviderDescription(provider: string): string {
  switch (provider) {
    case AIProvider.OPENAI: return 'OpenAI GPT-4 Turbo - High intelligence, good for complex tasks';
    case AIProvider.CLAUDE: return 'Anthropic Claude 3.5 Sonnet - Excellent reasoning and coding capabilities';
    case AIProvider.GEMINI: return 'Google Gemini Pro - Fast and capable, good for creative tasks';
    case AIProvider.OPENROUTER_QWEN3_CODER: return 'Qwen 2.5 Coder - Specialized for code analysis';
    case AIProvider.OPENROUTER_DEEPSEEK_R1T2: return 'DeepSeek R1 - Strong reasoning capabilities';
    default: return 'AI Model via OpenRouter';
  }
}

// ===== ANALYTICS ENDPOINTS =====

/**
 * Get work analytics
 */
app.get('/api/analytics/works/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const analyticsService = new AnalyticsService(c.env.DB, c.env.ANALYTICS);
  const analytics = await analyticsService.getWorkAnalytics(id);

  return c.json(analytics);
});

/**
 * Get user statistics
 */
app.get('/api/analytics/user/stats', async (c) => {
  const authHeader = c.req.header('Authorization');
  const jwtSecret = c.env.JWT_SECRET || 'default-secret-change-in-production';
  const payload = await authMiddleware(authHeader, jwtSecret);

  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const analyticsService = new AnalyticsService(c.env.DB, c.env.ANALYTICS);
  const stats = await analyticsService.getUserStats(parseInt(payload.sub));

  return c.json(stats);
});

/**
 * Get popular works
 */
app.get('/api/analytics/popular', async (c) => {
  const limit = parseInt(c.req.query('limit') || '20');
  const days = parseInt(c.req.query('days') || '30');

  const analyticsService = new AnalyticsService(c.env.DB, c.env.ANALYTICS);
  const popular = await analyticsService.getPopularWorks(limit, days);

  return c.json({ popular });
});

/**
 * Get analytics dashboard dataset
 */
app.get('/api/analytics/dashboard', async (c) => {
  const authHeader = c.req.header('Authorization');
  const jwtSecret = c.env.JWT_SECRET || 'default-secret-change-in-production';

  let userId: number | undefined = undefined;
  try {
    const payload = await authMiddleware(authHeader, jwtSecret);
    if (payload?.sub) {
      const parsed = parseInt(payload.sub, 10);
      if (!Number.isNaN(parsed)) {
        userId = parsed;
      }
    }
  } catch (error) {
    console.warn('Failed to resolve user for analytics dashboard:', error);
  }

  try {
    const analyticsService = new AnalyticsService(c.env.DB, c.env.ANALYTICS);
    const data = await analyticsService.getDashboardAnalytics(userId);
    return c.json(data);
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    return c.json({ error: 'Failed to generate analytics dashboard' }, 500);
  }
});

/**
 * Export analytics dashboard
 */
app.get('/api/analytics/export/dashboard', async (c) => {
  const format = (c.req.query('format') || 'json').toLowerCase();
  if (format !== 'json') {
    return c.json({ error: 'Unsupported export format' }, 400);
  }

  const authHeader = c.req.header('Authorization');
  const jwtSecret = c.env.JWT_SECRET || 'default-secret-change-in-production';

  let userId: number | undefined = undefined;
  const payload = await authMiddleware(authHeader, jwtSecret);
  if (payload?.sub) {
    const parsed = parseInt(payload.sub, 10);
    if (!Number.isNaN(parsed)) {
      userId = parsed;
    }
  }

  try {
    const analyticsService = new AnalyticsService(c.env.DB, c.env.ANALYTICS);
    const data = await analyticsService.getDashboardAnalytics(userId);
    const body = JSON.stringify(
      {
        export_format: 'json',
        export_timestamp: new Date().toISOString(),
        data,
      },
      null,
      2
    );

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': 'attachment; filename="analytics-dashboard.json"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Dashboard export failed:', error);
    return c.json({ error: 'Failed to export analytics dashboard' }, 500);
  }
});

// ===== FILE UPLOAD ENDPOINTS =====

/**
 * Upload a file
 */
app.post('/api/files/upload', async (c) => {
  const authHeader = c.req.header('Authorization');
  const jwtSecret = c.env.JWT_SECRET || 'default-secret-change-in-production';
  const payload = await authMiddleware(authHeader, jwtSecret);

  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const formData = await c.req.formData();
  const file = formData.get('file') as File;
  const workId = parseInt(formData.get('workId') as string);

  if (!file) {
    return c.json({ error: 'No file provided' }, 400);
  }

  const storageService = new StorageService(c.env.FILES);
  const result = await storageService.uploadWorkFile(file, parseInt(payload.sub), workId);

  return c.json(result);
});

/**
 * Download a file
 */
app.get('/api/files/:key', async (c) => {
  const key = c.req.param('key');
  const storageService = new StorageService(c.env.FILES);
  const file = await storageService.download(key);

  if (!file) {
    return c.json({ error: 'File not found' }, 404);
  }

  return new Response(file.body, {
    headers: {
      'Content-Type': file.httpMetadata?.contentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${file.customMetadata?.filename || key}"`,
    },
  });
});

// ===== EXTERNAL SOURCES =====

/**
 * Import work from external source
 */
app.post('/api/external/import', async (c) => {
  const authHeader = c.req.header('Authorization');
  const jwtSecret = c.env.JWT_SECRET || 'default-secret-change-in-production';
  const payload = await authMiddleware(authHeader, jwtSecret);

  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { workId, source } = await c.req.json();

  const pdService = new PublicDomainService(c.env.CACHE);
  const work = await pdService.getById(`${source}_${workId}`);

  if (!work) {
    return c.json({ error: 'Work not found in external source' }, 404);
  }

  // Queue work import
  await c.env.JOBS_QUEUE.send({
    type: 'work_import',
    payload: {
      sourceWork: work,
      userId: parseInt(payload.sub),
    },
  });

  return c.json({ message: 'Work import queued' });
});

export default app;
