// cloudflare/services/db/alert.service.ts
// Alert database service layer for Cloudflare D1

import { D1Database } from '@cloudflare/workers-types';

export interface Alert {
  id: number;
  user_id: number;
  work_id: number;
  alert_type?: string;
  threshold_value?: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAlertInput {
  user_id: number;
  work_id: number;
  alert_type?: string;
  threshold_value?: number;
}

export interface UpdateAlertInput {
  alert_type?: string;
  threshold_value?: number;
  is_active?: number;
}

export class AlertService {
  constructor(private db: D1Database) {}

  /**
   * Create a new alert
   */
  async create(input: CreateAlertInput): Promise<Alert | null> {
    const result = await this.db.prepare(`
      INSERT INTO Alert (user_id, work_id, alert_type, threshold_value)
      VALUES (?, ?, ?, ?)
      RETURNING *
    `).bind(
      input.user_id,
      input.work_id,
      input.alert_type || null,
      input.threshold_value || null
    ).first<Alert>();

    return result;
  }

  /**
   * Get alerts for a user
   */
  async getByUserId(userId: number, activeOnly: boolean = true): Promise<Alert[]> {
    let sql = 'SELECT * FROM Alert WHERE user_id = ?';
    if (activeOnly) {
      sql += ' AND is_active = 1';
    }
    sql += ' ORDER BY created_at DESC';

    const { results } = await this.db.prepare(sql).bind(userId).all<Alert>();
    return results || [];
  }

  /**
   * Get alerts for a specific work
   */
  async getByWorkId(workId: number, activeOnly: boolean = true): Promise<Alert[]> {
    let sql = 'SELECT * FROM Alert WHERE work_id = ?';
    if (activeOnly) {
      sql += ' AND is_active = 1';
    }
    sql += ' ORDER BY created_at DESC';

    const { results } = await this.db.prepare(sql).bind(workId).all<Alert>();
    return results || [];
  }

  /**
   * Get all active alerts
   */
  async getAllActive(): Promise<Alert[]> {
    const { results } = await this.db.prepare(
      'SELECT * FROM Alert WHERE is_active = 1 ORDER BY created_at DESC'
    ).all<Alert>();

    return results || [];
  }

  /**
   * Update an alert
   */
  async update(id: number, input: UpdateAlertInput): Promise<Alert | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (input.alert_type !== undefined) {
      updates.push('alert_type = ?');
      values.push(input.alert_type);
    }
    if (input.threshold_value !== undefined) {
      updates.push('threshold_value = ?');
      values.push(input.threshold_value);
    }
    if (input.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(input.is_active);
    }

    if (updates.length === 0) {
      return await this.db.prepare('SELECT * FROM Alert WHERE id = ?')
        .bind(id)
        .first<Alert>();
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const sql = `UPDATE Alert SET ${updates.join(', ')} WHERE id = ? RETURNING *`;
    return await this.db.prepare(sql).bind(...values).first<Alert>();
  }

  /**
   * Delete an alert
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM Alert WHERE id = ?')
      .bind(id)
      .run();

    return result.success;
  }

  /**
   * Deactivate an alert
   */
  async deactivate(id: number): Promise<boolean> {
    const result = await this.db.prepare(
      'UPDATE Alert SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(id).run();

    return result.success;
  }
}
