// cloudflare/services/db/metrics.service.ts
// Work Metrics database service layer for Cloudflare D1

import { D1Database } from '@cloudflare/workers-types';

export interface WorkMetric {
  id: number;
  work_id: number;
  metric_date: string;
  search_volume: number;
  trend_score: number;
  competition_score: number;
  demand_score: number;
  monetization_potential: number;
  amazon_sales_rank?: number;
  google_trends_interest: number;
  metadata?: string; // JSON string
  created_at: string;
}

export interface CreateMetricInput {
  work_id: number;
  search_volume?: number;
  trend_score?: number;
  competition_score?: number;
  demand_score?: number;
  monetization_potential?: number;
  amazon_sales_rank?: number;
  google_trends_interest?: number;
  metadata?: object;
}

export class MetricsService {
  constructor(private db: D1Database) {}

  /**
   * Create a new metric entry
   */
  async create(input: CreateMetricInput): Promise<WorkMetric | null> {
    const metadataJson = input.metadata ? JSON.stringify(input.metadata) : null;

    const result = await this.db.prepare(`
      INSERT INTO WorkMetric (
        work_id, search_volume, trend_score, competition_score,
        demand_score, monetization_potential, amazon_sales_rank,
        google_trends_interest, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `).bind(
      input.work_id,
      input.search_volume || 0,
      input.trend_score || 0.0,
      input.competition_score || 0.0,
      input.demand_score || 0.0,
      input.monetization_potential || 0.0,
      input.amazon_sales_rank || null,
      input.google_trends_interest || 0.0,
      metadataJson
    ).first<WorkMetric>();

    return result;
  }

  /**
   * Get metrics for a specific work
   */
  async getByWorkId(workId: number, limit: number = 30): Promise<WorkMetric[]> {
    const { results } = await this.db.prepare(`
      SELECT * FROM WorkMetric
      WHERE work_id = ?
      ORDER BY metric_date DESC
      LIMIT ?
    `).bind(workId, limit).all<WorkMetric>();

    return results || [];
  }

  /**
   * Get latest metric for a work
   */
  async getLatestByWorkId(workId: number): Promise<WorkMetric | null> {
    return await this.db.prepare(`
      SELECT * FROM WorkMetric
      WHERE work_id = ?
      ORDER BY metric_date DESC
      LIMIT 1
    `).bind(workId).first<WorkMetric>();
  }

  /**
   * Get top performing works by monetization potential
   */
  async getTopByMonetization(limit: number = 20): Promise<any[]> {
    const { results } = await this.db.prepare(`
      SELECT
        w.id, w.title, w.author, w.media_type,
        wm.monetization_potential, wm.trend_score, wm.demand_score
      FROM Work w
      INNER JOIN WorkMetric wm ON w.id = wm.work_id
      INNER JOIN (
        SELECT work_id, MAX(metric_date) as latest_date
        FROM WorkMetric
        GROUP BY work_id
      ) latest ON wm.work_id = latest.work_id AND wm.metric_date = latest.latest_date
      WHERE w.status = 'active'
      ORDER BY wm.monetization_potential DESC
      LIMIT ?
    `).bind(limit).all();

    return results || [];
  }

  /**
   * Get trending works
   */
  async getTrending(limit: number = 20): Promise<any[]> {
    const { results } = await this.db.prepare(`
      SELECT
        w.id, w.title, w.author, w.media_type,
        wm.trend_score, wm.google_trends_interest, wm.search_volume
      FROM Work w
      INNER JOIN WorkMetric wm ON w.id = wm.work_id
      INNER JOIN (
        SELECT work_id, MAX(metric_date) as latest_date
        FROM WorkMetric
        GROUP BY work_id
      ) latest ON wm.work_id = latest.work_id AND wm.metric_date = latest.latest_date
      WHERE w.status = 'active'
      ORDER BY wm.trend_score DESC
      LIMIT ?
    `).bind(limit).all();

    return results || [];
  }

  /**
   * Delete metrics for a work
   */
  async deleteByWorkId(workId: number): Promise<boolean> {
    const result = await this.db.prepare(
      'DELETE FROM WorkMetric WHERE work_id = ?'
    ).bind(workId).run();

    return result.success;
  }
}
