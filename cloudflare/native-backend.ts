// cloudflare/native-backend.ts

import { D1Database } from '@cloudflare/workers-types';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { hashPassword, verifyPassword, validatePasswordStrength } from './utils/crypto';

// Define the bindings expected from the environment
export type Bindings = {
  DB: D1Database;
};

// Create a new Hono router
const app = new Hono<{ Bindings: Bindings }>();

// Add CORS middleware
app.use('/api/*', cors());

// --- AUTHENTICATION ENDPOINTS ---

/**
 * Handles user registration.
 * Expects a JSON body with email, username, password, and full_name.
 */
app.post('/api/auth/register', async (c) => {
  try {
    const { email, username, password, fullName } = await c.req.json();

    // Basic validation
    if (!email || !username || !password) {
      return c.json({ error: 'Email, username, and password are required' }, 400);
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return c.json({ error: passwordValidation.error }, 400);
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    const db = c.env.DB;

    // Check if user already exists
    const existingUser = await db.prepare(
      'SELECT id FROM User WHERE email = ? OR username = ?'
    ).bind(email, username).first();

    if (existingUser) {
      return c.json({ error: 'Email or username already exists' }, 409);
    }

    // Insert new user into the database
    const { success } = await db.prepare(
      'INSERT INTO User (email, username, hashed_password, full_name) VALUES (?, ?, ?, ?)'
    ).bind(email, username, hashedPassword, fullName).run();

    if (!success) {
      return c.json({ error: 'Failed to create user' }, 500);
    }

    return c.json({ message: 'User registered successfully' }, 201);

  } catch (e) {
    console.error(e);
    return c.json({ error: 'An internal error occurred' }, 500);
  }
});

/**
 * Handles user login.
 * Expects a JSON body with username and password.
 */
app.post('/api/auth/login', async (c) => {
    try {
        const { username, password } = await c.req.json();

        if (!username || !password) {
          return c.json({ error: 'Username and password are required' }, 400);
        }

        const db = c.env.DB;

        // Find the user by username
        const user = await db.prepare(
          'SELECT * FROM User WHERE username = ?'
        ).bind(username).first();

        if (!user) {
          return c.json({ error: 'Invalid credentials' }, 401);
        }

        // Verify the password using the hashed password
        const passwordMatch = await verifyPassword(password, user.hashed_password as string);

        if (!passwordMatch) {
          return c.json({ error: 'Invalid credentials' }, 401);
        }

        // TODO: Implement JWT token generation
        const token = 'fake-jwt-token';

        return c.json({ token });

    } catch (e) {
        console.error(e);
        return c.json({ error: 'An internal error occurred' }, 500);
    }
});

// --- "WORKS" API ENDPOINTS ---

/**
 * Fetches a list of public domain works.
 */
app.get('/api/works', async (c) => {
    const db = c.env.DB;
    const { results } = await db.prepare('SELECT * FROM Work LIMIT 50').all();
    return c.json(results);
});

/**
 * Fetches a single work by its ID.
 */
app.get('/api/works/:id', async (c) => {
    const { id } = c.req.param();
    const db = c.env.DB;
    const work = await db.prepare('SELECT * FROM Work WHERE id = ?').bind(id).first();

    if (!work) {
      return c.json({ error: 'Work not found' }, 404);
    }

    return c.json(work);
  });

export default app;
