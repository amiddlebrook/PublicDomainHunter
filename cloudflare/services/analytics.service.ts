// cloudflare/services/analytics.service.ts
// Analytics Service for Public Domain Hunter

import { D1Database, AnalyticsEngineDataset } from '@cloudflare/workers-types';

export interface AnalyticsEvent {
  event: string;
  userId?: number;
  workId?: number;
  metadata?: Record<string, any>;
}

export interface WorkAnalytics {
  work_id: number;
  views: number;
  searches: number;
  downloads: number;
  alerts_created: number;
  unique_users: number;
}

export class AnalyticsService {
  constructor(
    private db: D1Database,
    private analytics?: AnalyticsEngineDataset
  ) {}

  /**
   * Track an analytics event
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    // Store in Analytics Engine if available
    if (this.analytics) {
      this.analytics.writeDataPoint({
        indexes: [event.event],
        blobs: [
          event.userId?.toString() || '',
          event.workId?.toString() || '',
        ],
        doubles: [Date.now()],
      });
    }

    // Store in D1 for detailed tracking
    if (event.userId && event.workId) {
      await this.db.prepare(`
        INSERT INTO UserActivity (user_id, work_id, activity_type, metadata)
        VALUES (?, ?, ?, ?)
      `).bind(
        event.userId,
        event.workId,
        event.event,
        JSON.stringify(event.metadata || {})
      ).run();
    }
  }

  /**
   * Get work analytics
   */
  async getWorkAnalytics(workId: number): Promise<WorkAnalytics> {
    const { results } = await this.db.prepare(`
      SELECT
        work_id,
        COUNT(CASE WHEN activity_type = 'view' THEN 1 END) as views,
        COUNT(CASE WHEN activity_type = 'search' THEN 1 END) as searches,
        COUNT(CASE WHEN activity_type = 'download' THEN 1 END) as downloads,
        COUNT(DISTINCT user_id) as unique_users
      FROM UserActivity
      WHERE work_id = ?
      GROUP BY work_id
    `).bind(workId).all();

    const alertsResult = await this.db.prepare(`
      SELECT COUNT(*) as count FROM Alert WHERE work_id = ?
    `).bind(workId).first<{ count: number }>();

    const baseAnalytics = results?.[0] as any || {
      work_id: workId,
      views: 0,
      searches: 0,
      downloads: 0,
      unique_users: 0,
    };

    return {
      ...baseAnalytics,
      alerts_created: alertsResult?.count || 0,
    };
  }

  /**
   * Get user activity summary
   */
  async getUserActivity(userId: number, limit: number = 50) {
    const { results } = await this.db.prepare(`
      SELECT
        ua.id, ua.work_id, ua.activity_type, ua.created_at,
        w.title, w.author, w.media_type
      FROM UserActivity ua
      LEFT JOIN Work w ON ua.work_id = w.id
      WHERE ua.user_id = ?
      ORDER BY ua.created_at DESC
      LIMIT ?
    `).bind(userId, limit).all();

    return results || [];
  }

  /**
   * Get popular works
   */
  async getPopularWorks(limit: number = 20, days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { results } = await this.db.prepare(`
      SELECT
        w.id, w.title, w.author, w.media_type,
        COUNT(DISTINCT ua.user_id) as unique_users,
        COUNT(ua.id) as total_interactions,
        COUNT(CASE WHEN ua.activity_type = 'view' THEN 1 END) as views,
        COUNT(CASE WHEN ua.activity_type = 'download' THEN 1 END) as downloads
      FROM Work w
      INNER JOIN UserActivity ua ON w.id = ua.work_id
      WHERE ua.created_at >= ?
      GROUP BY w.id, w.title, w.author, w.media_type
      ORDER BY total_interactions DESC
      LIMIT ?
    `).bind(cutoffDate.toISOString(), limit).all();

    return results || [];
  }

  /**
   * Get trending searches
   */
  async getTrendingSearches(limit: number = 20, days: number = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { results } = await this.db.prepare(`
      SELECT
        json_extract(metadata, '$.query') as query,
        COUNT(*) as search_count,
        COUNT(DISTINCT user_id) as unique_users
      FROM UserActivity
      WHERE activity_type = 'search'
        AND created_at >= ?
        AND json_extract(metadata, '$.query') IS NOT NULL
      GROUP BY json_extract(metadata, '$.query')
      ORDER BY search_count DESC
      LIMIT ?
    `).bind(cutoffDate.toISOString(), limit).all();

    return results || [];
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: number) {
    const stats: any = {};

    // Total activities
    const totalResult = await this.db.prepare(`
      SELECT COUNT(*) as count FROM UserActivity WHERE user_id = ?
    `).bind(userId).first<{ count: number }>();
    stats.total_activities = totalResult?.count || 0;

    // Works viewed
    const viewsResult = await this.db.prepare(`
      SELECT COUNT(DISTINCT work_id) as count
      FROM UserActivity
      WHERE user_id = ? AND activity_type = 'view'
    `).bind(userId).first<{ count: number }>();
    stats.works_viewed = viewsResult?.count || 0;

    // Downloads
    const downloadsResult = await this.db.prepare(`
      SELECT COUNT(*) as count
      FROM UserActivity
      WHERE user_id = ? AND activity_type = 'download'
    `).bind(userId).first<{ count: number }>();
    stats.downloads = downloadsResult?.count || 0;

    // Active alerts
    const alertsResult = await this.db.prepare(`
      SELECT COUNT(*) as count FROM Alert WHERE user_id = ? AND is_active = 1
    `).bind(userId).first<{ count: number }>();
    stats.active_alerts = alertsResult?.count || 0;

    return stats;
  }

  /**
   * Track page view
   */
  async trackPageView(userId: number | undefined, page: string): Promise<void> {
    await this.trackEvent({
      event: 'page_view',
      userId,
      metadata: { page },
    });
  }

  /**
   * Track work view
   */
  async trackWorkView(userId: number, workId: number): Promise<void> {
    await this.trackEvent({
      event: 'view',
      userId,
      workId,
    });
  }

  /**
   * Track search
   */
  async trackSearch(userId: number | undefined, query: string): Promise<void> {
    await this.trackEvent({
      event: 'search',
      userId,
      metadata: { query },
    });
  }

  /**
   * Track download
   */
  async trackDownload(userId: number, workId: number): Promise<void> {
    await this.trackEvent({
      event: 'download',
      userId,
      workId,
    });
  }
}
