// cloudflare/services/db/user.service.ts
// User database service layer for Cloudflare D1

import { D1Database } from '@cloudflare/workers-types';

export interface User {
  id: number;
  email: string;
  username: string;
  hashed_password: string;
  full_name?: string;
  is_active: number;
  is_superuser: number;
  created_at: string;
  updated_at: string;
}

export interface CreateUserInput {
  email: string;
  username: string;
  hashed_password: string;
  full_name?: string;
}

export interface UpdateUserInput {
  email?: string;
  username?: string;
  full_name?: string;
  is_active?: number;
}

export class UserService {
  constructor(private db: D1Database) {}

  /**
   * Create a new user
   */
  async create(input: CreateUserInput): Promise<User | null> {
    const { email, username, hashed_password, full_name } = input;

    const result = await this.db.prepare(`
      INSERT INTO User (email, username, hashed_password, full_name)
      VALUES (?, ?, ?, ?)
      RETURNING *
    `).bind(email, username, hashed_password, full_name || null).first<User>();

    return result;
  }

  /**
   * Find user by ID
   */
  async findById(id: number): Promise<User | null> {
    return await this.db.prepare('SELECT * FROM User WHERE id = ?')
      .bind(id)
      .first<User>();
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.db.prepare('SELECT * FROM User WHERE email = ?')
      .bind(email)
      .first<User>();
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    return await this.db.prepare('SELECT * FROM User WHERE username = ?')
      .bind(username)
      .first<User>();
  }

  /**
   * Find user by email or username
   */
  async findByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
    return await this.db.prepare(
      'SELECT * FROM User WHERE email = ? OR username = ?'
    ).bind(emailOrUsername, emailOrUsername).first<User>();
  }

  /**
   * Update user
   */
  async update(id: number, input: UpdateUserInput): Promise<User | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (input.email !== undefined) {
      updates.push('email = ?');
      values.push(input.email);
    }
    if (input.username !== undefined) {
      updates.push('username = ?');
      values.push(input.username);
    }
    if (input.full_name !== undefined) {
      updates.push('full_name = ?');
      values.push(input.full_name);
    }
    if (input.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(input.is_active);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const sql = `UPDATE User SET ${updates.join(', ')} WHERE id = ? RETURNING *`;
    return await this.db.prepare(sql).bind(...values).first<User>();
  }

  /**
   * Delete user (soft delete by setting is_active = 0)
   */
  async softDelete(id: number): Promise<boolean> {
    const result = await this.db.prepare(
      'UPDATE User SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(id).run();

    return result.success;
  }

  /**
   * Permanently delete user
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM User WHERE id = ?')
      .bind(id)
      .run();

    return result.success;
  }

  /**
   * List users with pagination
   */
  async list(limit: number = 50, offset: number = 0): Promise<User[]> {
    const { results } = await this.db.prepare(
      'SELECT * FROM User WHERE is_active = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind(limit, offset).all<User>();

    return results || [];
  }

  /**
   * Count total active users
   */
  async count(): Promise<number> {
    const result = await this.db.prepare(
      'SELECT COUNT(*) as count FROM User WHERE is_active = 1'
    ).first<{ count: number }>();

    return result?.count || 0;
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const result = await this.db.prepare(
      'SELECT 1 FROM User WHERE email = ? LIMIT 1'
    ).bind(email).first();

    return result !== null;
  }

  /**
   * Check if username exists
   */
  async usernameExists(username: string): Promise<boolean> {
    const result = await this.db.prepare(
      'SELECT 1 FROM User WHERE username = ? LIMIT 1'
    ).bind(username).first();

    return result !== null;
  }
}
