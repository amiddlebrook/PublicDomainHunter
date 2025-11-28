// cloudflare/services/db/work.service.ts
// Work (Public Domain Content) database service layer for Cloudflare D1

import { D1Database } from '@cloudflare/workers-types';

export interface Work {
  id: number;
  title: string;
  author?: string;
  original_publication_year?: number;
  public_domain_year?: number;
  description?: string;
  source_url?: string;
  download_url?: string;
  media_type?: string;
  language: string;
  page_count?: number;
  file_size?: number;
  metadata?: any; // Changed from string to any to support parsed JSON
  status: string;
  created_at: string;
  updated_at: string;
  user_id?: number;
}

export interface CreateWorkInput {
  title: string;
  author?: string;
  original_publication_year?: number;
  public_domain_year?: number;
  description?: string;
  source_url?: string;
  download_url?: string;
  media_type?: string;
  language?: string;
  page_count?: number;
  file_size?: number;
  metadata?: object;
  user_id?: number;
}

export interface UpdateWorkInput {
  title?: string;
  author?: string;
  description?: string;
  status?: string;
  metadata?: object;
}

export interface WorkSearchFilters {
  author?: string;
  media_type?: string;
  language?: string;
  status?: string;
  user_id?: number;
  search_query?: string;
}

export class WorkService {
  constructor(private db: D1Database) { }

  /**
   * Create a new work
   */
  async create(input: CreateWorkInput): Promise<Work | null> {
    const metadataJson = input.metadata ? JSON.stringify(input.metadata) : null;

    const result = await this.db.prepare(`
      INSERT INTO Work (
        title, author, original_publication_year, public_domain_year,
        description, source_url, download_url, media_type, language,
        page_count, file_size, metadata, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `).bind(
      input.title,
      input.author || null,
      input.original_publication_year || null,
      input.public_domain_year || null,
      input.description || null,
      input.source_url || null,
      input.download_url || null,
      input.media_type || null,
      input.language || 'en',
      input.page_count || null,
      input.file_size || null,
      metadataJson,
      input.user_id || null
    ).first<Work>();

    return result;
  }

  /**
   * Find work by ID with metrics merged into metadata
   */
  async findById(id: number): Promise<Work | null> {
    const work = await this.db.prepare('SELECT * FROM Work WHERE id = ?')
      .bind(id)
      .first<Work>();

    if (!work) return null;

    // Parse metadata if it's a string
    if (typeof work.metadata === 'string') {
      try {
        work.metadata = JSON.parse(work.metadata);
      } catch (e) {
        work.metadata = {};
      }
    } else if (!work.metadata) {
      work.metadata = {};
    }

    // Fetch latest metrics
    try {
      const metrics = await this.db.prepare(`
        SELECT * FROM WorkMetric 
        WHERE work_id = ? 
        ORDER BY metric_date DESC 
        LIMIT 1
      `).bind(id).first<any>();

      if (metrics) {
        work.metadata = {
          ...work.metadata,
          monetization_score: metrics.master_monetization_score,
          saturation_index: metrics.market_saturation_index,
          competition_score: metrics.market_saturation_index, // Map saturation to competition
          search_volume: metrics.temporal_window_score, // Proxy search volume with temporal score for now
          // Add other metrics as needed
          metrics: metrics // Include full metrics object
        };
      }
    } catch (e) {
      console.warn('Failed to fetch metrics for work', id, e);
    }

    return work;
  }

  /**
   * Update work
   */
  async update(id: number, input: UpdateWorkInput): Promise<Work | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (input.title !== undefined) {
      updates.push('title = ?');
      values.push(input.title);
    }
    if (input.author !== undefined) {
      updates.push('author = ?');
      values.push(input.author);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      values.push(input.description);
    }
    if (input.status !== undefined) {
      updates.push('status = ?');
      values.push(input.status);
    }
    if (input.metadata !== undefined) {
      updates.push('metadata = ?');
      values.push(JSON.stringify(input.metadata));
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const sql = `UPDATE Work SET ${updates.join(', ')} WHERE id = ? RETURNING *`;
    return await this.db.prepare(sql).bind(...values).first<Work>();
  }

  /**
   * Delete work
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM Work WHERE id = ?')
      .bind(id)
      .run();

    return result.success;
  }

  /**
   * List works with pagination and filters
   */
  async list(
    limit: number = 50,
    offset: number = 0,
    filters?: WorkSearchFilters
  ): Promise<Work[]> {
    let sql = 'SELECT * FROM Work WHERE 1=1';
    const params: any[] = [];

    if (filters) {
      if (filters.author) {
        sql += ' AND author LIKE ?';
        params.push(`%${filters.author}%`);
      }
      if (filters.media_type) {
        sql += ' AND media_type = ?';
        params.push(filters.media_type);
      }
      if (filters.language) {
        sql += ' AND language = ?';
        params.push(filters.language);
      }
      if (filters.status) {
        sql += ' AND status = ?';
        params.push(filters.status);
      }
      if (filters.user_id) {
        sql += ' AND user_id = ?';
        params.push(filters.user_id);
      }
      if (filters.search_query) {
        sql += ' AND (title LIKE ? OR author LIKE ? OR description LIKE ?)';
        const searchTerm = `%${filters.search_query}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { results } = await this.db.prepare(sql).bind(...params).all<Work>();
    return results || [];
  }

  /**
   * Search works by title or author
   */
  async search(query: string, limit: number = 50): Promise<Work[]> {
    const { results } = await this.db.prepare(`
      SELECT * FROM Work
      WHERE title LIKE ? OR author LIKE ? OR description LIKE ?
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(`%${query}%`, `%${query}%`, `%${query}%`, limit).all<Work>();

    return results || [];
  }

  /**
   * Get works by media type
   */
  async getByMediaType(mediaType: string, limit: number = 50): Promise<Work[]> {
    const { results } = await this.db.prepare(
      'SELECT * FROM Work WHERE media_type = ? ORDER BY created_at DESC LIMIT ?'
    ).bind(mediaType, limit).all<Work>();

    return results || [];
  }

  /**
   * Get works by author
   */
  async getByAuthor(author: string, limit: number = 50): Promise<Work[]> {
    const { results } = await this.db.prepare(
      'SELECT * FROM Work WHERE author LIKE ? ORDER BY created_at DESC LIMIT ?'
    ).bind(`%${author}%`, limit).all<Work>();

    return results || [];
  }

  /**
   * Get recent works
   */
  async getRecent(limit: number = 20): Promise<Work[]> {
    const { results } = await this.db.prepare(
      'SELECT * FROM Work WHERE status = ? ORDER BY created_at DESC LIMIT ?'
    ).bind('active', limit).all<Work>();

    return results || [];
  }

  /**
   * Count works with filters
   */
  async count(filters?: WorkSearchFilters): Promise<number> {
    let sql = 'SELECT COUNT(*) as count FROM Work WHERE 1=1';
    const params: any[] = [];

    if (filters) {
      if (filters.author) {
        sql += ' AND author LIKE ?';
        params.push(`%${filters.author}%`);
      }
      if (filters.media_type) {
        sql += ' AND media_type = ?';
        params.push(filters.media_type);
      }
      if (filters.status) {
        sql += ' AND status = ?';
        params.push(filters.status);
      }
    }

    const result = await this.db.prepare(sql).bind(...params).first<{ count: number }>();
    return result?.count || 0;
  }
}
