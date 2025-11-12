// cloudflare/backend.ts
// Comprehensive Cloudflare-native backend for Public Domain Hunter

import { D1Database, KVNamespace, R2Bucket, Queue, AnalyticsEngineDataset } from '@cloudflare/workers-types';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { hashPassword, verifyPassword, validatePasswordStrength } from './utils/crypto';
import { generateJWT, verifyJWT, authMiddleware } from './utils/jwt';
import { UserService } from './services/db/user.service';
import { WorkService } from './services/db/work.service';
import { MetricsService } from './services/db/metrics.service';
import { AlertService } from './services/db/alert.service';
import { SearchService } from './services/search.service';
import { AnalyticsService } from './services/analytics.service';
import { LLMService } from './services/llm.service';
import { PublicDomainService } from './services/public-domain.service';
import { StorageService } from './services/storage.service';

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

    // Check if email already exists
    const existingEmail = await userService.findByEmail(email);
    if (existingEmail) {
      return c.json({ error: 'Email already exists' }, 409);
    }

    // Check if username already exists
    const existingUsername = await userService.findByUsername(username);
    if (existingUsername) {
      return c.json({ error: 'Username already exists' }, 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await userService.create({
      email,
      username,
      hashed_password: hashedPassword,
      full_name,
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
  const limit = parseInt(c.req.query('limit') || '20');
  const source = c.req.query('source') as 'gutenberg' | 'archive' | 'all' | undefined;

  const searchService = new SearchService(c.env.DB, c.env.CACHE);
  const results = await searchService.searchCombined(query, page, limit, { source });

  // Track search
  const authHeader = c.req.header('Authorization');
  const jwtSecret = c.env.JWT_SECRET || 'default-secret-change-in-production';
  const payload = await authMiddleware(authHeader, jwtSecret);

  if (payload) {
    const analyticsService = new AnalyticsService(c.env.DB, c.env.ANALYTICS);
    await analyticsService.trackSearch(parseInt(payload.sub), query);
  }

  return c.json(results);
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
