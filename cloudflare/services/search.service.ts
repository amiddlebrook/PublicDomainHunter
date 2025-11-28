// cloudflare/services/search.service.ts
// Search Service for Public Domain Hunter

import { D1Database, KVNamespace } from '@cloudflare/workers-types';
import { WorkService, Work } from './db/work.service';
import { PublicDomainService } from './public-domain.service';

export interface SearchFilters {
  author?: string;
  media_type?: string | string[];
  language?: string;
  min_year?: number;
  max_year?: number;
  min_score?: number;
  max_saturation?: number;
  source?: 'gutenberg' | 'archive' | 'all';
}

export interface SearchResult {
  works: Work[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export class SearchService {
  private workService: WorkService;
  private pdService: PublicDomainService;

  constructor(private db: D1Database, private cache?: KVNamespace) {
    this.workService = new WorkService(db);
    this.pdService = new PublicDomainService(cache);
  }

  /**
   * Search local database
   */
  async searchLocal(
    query: string,
    page: number = 1,
    limit: number = 20,
    filters?: SearchFilters
  ): Promise<SearchResult> {
    const offset = (page - 1) * limit;
    const params: any[] = [];

    let sql = `
      SELECT 
        w.*,
        wm.master_monetization_score as monetization_score,
        wm.market_saturation_index as saturation_index
      FROM Work w
      LEFT JOIN (
        SELECT work_id, master_monetization_score, market_saturation_index, MAX(metric_date)
        FROM WorkMetric
        GROUP BY work_id
      ) wm ON w.id = wm.work_id
      WHERE 1=1
    `;

    // Text search
    if (query) {
      sql += ' AND (w.title LIKE ? OR w.author LIKE ? OR w.description LIKE ?)';
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Filters
    if (filters?.author) {
      sql += ' AND w.author LIKE ?';
      params.push(`%${filters.author}%`);
    }

    if (filters?.media_type) {
      if (Array.isArray(filters.media_type)) {
        if (filters.media_type.length > 0) {
          const placeholders = filters.media_type.map(() => '?').join(',');
          sql += ` AND w.media_type IN (${placeholders})`;
          params.push(...filters.media_type);
        }
      } else {
        sql += ' AND w.media_type = ?';
        params.push(filters.media_type);
      }
    }

    if (filters?.language) {
      sql += ' AND w.language = ?';
      params.push(filters.language);
    }

    if (filters?.min_year) {
      sql += ' AND w.original_publication_year >= ?';
      params.push(filters.min_year);
    }

    if (filters?.max_year) {
      sql += ' AND w.original_publication_year <= ?';
      params.push(filters.max_year);
    }

    if (filters?.min_score) {
      sql += ' AND wm.master_monetization_score >= ?';
      params.push(filters.min_score);
    }

    if (filters?.max_saturation) {
      sql += ' AND wm.market_saturation_index <= ?';
      params.push(filters.max_saturation);
    }

    // Count total
    const countSql = `SELECT COUNT(*) as count FROM (${sql})`;
    const countResult = await this.db.prepare(countSql).bind(...params).first<{ count: number }>();
    const total = countResult?.count || 0;

    // Get paginated results
    sql += ' ORDER BY w.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { results } = await this.db.prepare(sql).bind(...params).all<Work>();

    return {
      works: results || [],
      total,
      page,
      limit,
      hasMore: offset + (results?.length || 0) < total,
    };
  }

  /**
   * Search external sources with timeout
   */
  async searchExternal(
    query: string,
    source: 'gutenberg' | 'archive' | 'all' = 'all',
    limit: number = 20  // Reduced from 50 to 20 for faster responses
  ) {
    const cacheKey = `search:external:${source}:${query}:${limit}`;

    // Check cache
    if (this.cache) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    try {
      // Add timeout to prevent hanging (10 seconds max)
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Search timeout')), 10000)
      );

      const searchPromise = this.pdService.search(query, source, limit);

      const results = await Promise.race([searchPromise, timeout]) as any[];

      // Cache results for 1 hour
      if (this.cache && results) {
        await this.cache.put(cacheKey, JSON.stringify(results), {
          expirationTtl: 3600,
        });
      }

      return results || [];
    } catch (error) {
      console.error('External search error:', error);
      return [];
    }
  }

  /**
   * Combined search (local + external)
   */
  async searchCombined(
    query: string,
    page: number = 1,
    limit: number = 20,
    filters?: SearchFilters
  ) {
    // Search local database
    const localResults = await this.searchLocal(query, page, limit, filters);

    // If we don't have enough results, search external sources
    let externalResults: any[] = [];
    // Only search external if on first page and not restricted to local
    if (page === 1 && (!filters?.source || filters.source !== 'local')) {
      try {
        externalResults = await this.searchExternal(
          query,
          filters?.source || 'all',
          limit
        );
      } catch (e) {
        console.error('External search failed', e);
      }
    }

    return {
      local: localResults.works,
      external: externalResults,
      total: localResults.total + externalResults.length,
    };
  }

  /**
   * Get top monetization opportunities
   */
  async getTopOpportunities(limit: number = 20) {
    const cacheKey = `opportunities:${limit}`;

    // Check cache
    if (this.cache) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const { results } = await this.db.prepare(`
      SELECT
        w.id, w.title, w.author, w.media_type, w.description,
        wm.monetization_potential, wm.trend_score, wm.demand_score, wm.competition_score
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

    // Cache for 5 minutes
    if (this.cache) {
      await this.cache.put(cacheKey, JSON.stringify(results), {
        expirationTtl: 300,
      });
    }

    return results;
  }

  /**
   * Advanced search with multiple filters
   */
  async advancedSearch(
    query: string,
    filters: SearchFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<SearchResult> {
    let sql = 'SELECT * FROM Work WHERE 1=1';
    const params: any[] = [];

    // Text search
    if (query) {
      sql += ' AND (title LIKE ? OR author LIKE ? OR description LIKE ?)';
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Filters
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

    if (filters.min_year) {
      sql += ' AND original_publication_year >= ?';
      params.push(filters.min_year);
    }

    if (filters.max_year) {
      sql += ' AND original_publication_year <= ?';
      params.push(filters.max_year);
    }

    // Count total
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
    const countResult = await this.db.prepare(countSql).bind(...params).first<{ count: number }>();
    const total = countResult?.count || 0;

    // Get paginated results
    const offset = (page - 1) * limit;
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { results } = await this.db.prepare(sql).bind(...params).all<Work>();

    return {
      works: results || [],
      total,
      page,
      limit,
      hasMore: offset + (results?.length || 0) < total,
    };
  }
}
