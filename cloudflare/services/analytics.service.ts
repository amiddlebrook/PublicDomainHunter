// cloudflare/services/analytics.service.ts
// Analytics Service for Public Domain Hunter

import { D1Database, AnalyticsEngineDataset } from '@cloudflare/workers-types';

interface DashboardOverview {
  total_works: number;
  total_users: number;
  active_alerts: number;
  avg_trend_score: number;
  last_updated: string;
}

interface WorksOverTimeEntry {
  date: string;
  count: number;
  cumulative: number;
}

interface TrendScoresOverTimeEntry {
  date: string;
  avg_score: number;
  trend: string;
}

interface MediaTypeBreakdownEntry {
  type: string;
  count: number;
  percentage: number;
  color: string;
}

interface PublicationYearBreakdownEntry {
  year: number;
  count: number;
  decade: string;
}

interface LanguageBreakdownEntry {
  code: string;
  name: string;
  count: number;
}

interface TrendingWorkEntry {
  id: number;
  title: string;
  author: string;
  trend_score: number;
  media_type: string;
  created_at: string;
}

interface TopAuthorEntry {
  author: string;
  work_count: number;
  percentage: number;
}

interface TopCategoryEntry {
  category: string;
  count: number;
}

interface OpportunityEntry {
  work_id: number;
  title: string;
  author: string;
  trend_score: number;
  competition_score: number;
  monetization_potential: number;
  opportunity_level: string;
}

interface CompetitionInsight {
  total_market_size: string;
  competition_level: string;
  market_trends: string;
  top_competitors: Array<{ name: string; market_share: number }>;
  recommendations: string[];
}

interface DashboardAnalytics {
  overview: DashboardOverview;
  time_series: {
    works_over_time: WorksOverTimeEntry[];
    trend_scores_over_time: TrendScoresOverTimeEntry[];
  };
  breakdowns: {
    media_types: MediaTypeBreakdownEntry[];
    publication_years: PublicationYearBreakdownEntry[];
    languages: LanguageBreakdownEntry[];
  };
  top_performers: {
    trending_works: TrendingWorkEntry[];
    authors: TopAuthorEntry[];
    categories: TopCategoryEntry[];
  };
  market_insights: {
    opportunities: OpportunityEntry[];
    competition: CompetitionInsight;
  };
}

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

  /**
   * Build the dashboard analytics payload used by the frontend
   */
  async getDashboardAnalytics(userId?: number): Promise<DashboardAnalytics> {
    const [overview, worksOverTime, trendScoresOverTime, mediaTypes, years, languages, trendingWorks, authors, categories, opportunities, competition] = await Promise.all([
      this.getOverview(userId),
      this.getWorksOverTime(userId),
      this.getTrendScoresOverTime(userId),
      this.getMediaTypeBreakdown(userId),
      this.getPublicationYearBreakdown(userId),
      this.getLanguageBreakdown(userId),
      this.getTrendingWorks(userId),
      this.getTopAuthors(userId),
      this.getTopCategories(userId),
      this.getOpportunities(userId),
      this.getCompetitionInsights(userId),
    ]);

    return {
      overview,
      time_series: {
        works_over_time: worksOverTime,
        trend_scores_over_time: trendScoresOverTime,
      },
      breakdowns: {
        media_types: mediaTypes,
        publication_years: years,
        languages,
      },
      top_performers: {
        trending_works: trendingWorks,
        authors,
        categories,
      },
      market_insights: {
        opportunities,
        competition,
      },
    };
  }

  private async getOverview(userId?: number): Promise<DashboardOverview> {
    const now = new Date().toISOString();

    const totalWorksResult = userId
      ? await this.db
          .prepare('SELECT COUNT(*) as count FROM Work WHERE status = "active" AND user_id = ?')
          .bind(userId)
          .first<{ count: number }>()
      : await this.db
          .prepare('SELECT COUNT(*) as count FROM Work WHERE status = "active"')
          .first<{ count: number }>();

    const totalUsersResult = userId
      ? { count: 1 }
      : await this.db.prepare('SELECT COUNT(*) as count FROM User').first<{ count: number }>();

    const activeAlertsResult = userId
      ? await this.db
          .prepare('SELECT COUNT(*) as count FROM Alert WHERE is_active = 1 AND user_id = ?')
          .bind(userId)
          .first<{ count: number }>()
      : await this.db
          .prepare('SELECT COUNT(*) as count FROM Alert WHERE is_active = 1')
          .first<{ count: number }>();

    const avgTrendScoreResult = userId
      ? await this.db
          .prepare(
            `SELECT AVG(CAST(json_extract(metadata, '$.trend_score') AS REAL)) as avg_score
             FROM Work
             WHERE status = 'active'
               AND metadata IS NOT NULL
               AND json_extract(metadata, '$.trend_score') IS NOT NULL
               AND user_id = ?`
          )
          .bind(userId)
          .first<{ avg_score: number }>()
      : await this.db
          .prepare(
            `SELECT AVG(CAST(json_extract(metadata, '$.trend_score') AS REAL)) as avg_score
             FROM Work
             WHERE status = 'active'
               AND metadata IS NOT NULL
               AND json_extract(metadata, '$.trend_score') IS NOT NULL`
          )
          .first<{ avg_score: number }>();

    const totalWorks = totalWorksResult?.count || 0;
    const avgTrendScore = avgTrendScoreResult?.avg_score ? Number(avgTrendScoreResult.avg_score.toFixed(1)) : 0;

    return {
      total_works: totalWorks,
      total_users: totalUsersResult?.count || 0,
      active_alerts: activeAlertsResult?.count || 0,
      avg_trend_score: avgTrendScore,
      last_updated: now,
    };
  }

  private async getWorksOverTime(userId?: number, days: number = 30): Promise<WorksOverTimeEntry[]> {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - (days - 1));

    const params: Array<string | number> = [start.toISOString()];
    const userClause = userId ? ' AND user_id = ?' : '';
    if (userId) {
      params.push(userId);
    }

    const { results } = await this.db
      .prepare(
        `SELECT DATE(created_at) as date, COUNT(*) as count
         FROM Work
         WHERE status = 'active' AND created_at >= ?${userClause}
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at)`
      )
      .bind(...params)
      .all<{ date: string; count: number }>();

    const countMap = new Map<string, number>();
    for (const row of results || []) {
      countMap.set(row.date, row.count || 0);
    }

    const entries: WorksOverTimeEntry[] = [];
    let cumulative = 0;
    for (let i = 0; i < days; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const key = current.toISOString().slice(0, 10);
      const dailyCount = countMap.get(key) || 0;
      cumulative += dailyCount;
      entries.push({ date: key, count: dailyCount, cumulative });
    }

    return entries;
  }

  private async getTrendScoresOverTime(userId?: number, days: number = 30): Promise<TrendScoresOverTimeEntry[]> {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - (days - 1));

    const params: Array<string | number> = [start.toISOString()];
    const userClause = userId ? ' AND user_id = ?' : '';
    if (userId) {
      params.push(userId);
    }

    const { results } = await this.db
      .prepare(
        `SELECT DATE(created_at) as date,
                AVG(CAST(json_extract(metadata, '$.trend_score') AS REAL)) as avg_score
         FROM Work
         WHERE status = 'active'
           AND created_at >= ?${userClause}
           AND metadata IS NOT NULL
           AND json_extract(metadata, '$.trend_score') IS NOT NULL
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at)`
      )
      .bind(...params)
      .all<{ date: string; avg_score: number }>();

    const scoreMap = new Map<string, number>();
    for (const row of results || []) {
      if (row.avg_score !== null && row.avg_score !== undefined) {
        scoreMap.set(row.date, Number(row.avg_score));
      }
    }

    const entries: TrendScoresOverTimeEntry[] = [];
    let previous = 0;
    for (let i = 0; i < days; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const key = current.toISOString().slice(0, 10);
      const rawScore = scoreMap.get(key) ?? null;
      const avgScore = rawScore !== null ? Number(rawScore.toFixed(2)) : 0;
      let trend = 'steady';
      if (avgScore > previous + 5) {
        trend = 'rising';
      } else if (avgScore < previous - 5) {
        trend = 'declining';
      }
      previous = avgScore;
      entries.push({ date: key, avg_score: avgScore, trend });
    }

    return entries;
  }

  private async getMediaTypeBreakdown(userId?: number): Promise<MediaTypeBreakdownEntry[]> {
    const params: Array<number> = [];
    const userClause = userId ? ' AND user_id = ?' : '';
    if (userId) {
      params.push(userId);
    }

    const { results } = await this.db
      .prepare(
        `SELECT COALESCE(media_type, 'Unspecified') as media_type, COUNT(*) as count
         FROM Work
         WHERE status = 'active'${userClause}
         GROUP BY COALESCE(media_type, 'Unspecified')
         ORDER BY count DESC`
      )
      .bind(...params)
      .all<{ media_type: string; count: number }>();

    const total = (results || []).reduce((sum, row) => sum + (row.count || 0), 0);
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#f97316'];

    return (results || []).map((row, index) => ({
      type: row.media_type || 'Unspecified',
      count: row.count || 0,
      percentage: total ? Number(((row.count || 0) / total * 100).toFixed(1)) : 0,
      color: colors[index % colors.length],
    }));
  }

  private async getPublicationYearBreakdown(userId?: number): Promise<PublicationYearBreakdownEntry[]> {
    const params: Array<number> = [];
    const userClause = userId ? ' AND user_id = ?' : '';
    if (userId) {
      params.push(userId);
    }

    const { results } = await this.db
      .prepare(
        `SELECT public_domain_year as year, COUNT(*) as count
         FROM Work
         WHERE status = 'active'
           AND public_domain_year IS NOT NULL${userClause}
         GROUP BY public_domain_year
         ORDER BY public_domain_year DESC
         LIMIT 25`
      )
      .bind(...params)
      .all<{ year: number; count: number }>();

    return (results || []).map((row) => {
      const decadeStart = row.year ? Math.floor(row.year / 10) * 10 : 0;
      const decade = decadeStart ? `${decadeStart}s` : 'Unknown';
      return {
        year: row.year || 0,
        count: row.count || 0,
        decade,
      };
    });
  }

  private async getLanguageBreakdown(userId?: number): Promise<LanguageBreakdownEntry[]> {
    const params: Array<number> = [];
    const userClause = userId ? ' AND user_id = ?' : '';
    if (userId) {
      params.push(userId);
    }

    const { results } = await this.db
      .prepare(
        `SELECT COALESCE(language, 'en') as language, COUNT(*) as count
         FROM Work
         WHERE status = 'active'${userClause}
         GROUP BY COALESCE(language, 'en')
         ORDER BY count DESC`
      )
      .bind(...params)
      .all<{ language: string; count: number }>();

    const languageNames: Record<string, string> = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      zh: 'Chinese',
      ja: 'Japanese',
    };

    return (results || []).map((row) => ({
      code: row.language || 'en',
      name: languageNames[row.language] || row.language || 'Unknown',
      count: row.count || 0,
    }));
  }

  private async getTrendingWorks(userId?: number): Promise<TrendingWorkEntry[]> {
    const params: Array<number> = [];
    const userClause = userId ? ' AND w.user_id = ?' : '';
    if (userId) {
      params.push(userId);
    }

    const { results } = await this.db
      .prepare(
        `SELECT
           w.id,
           w.title,
           COALESCE(w.author, 'Unknown') as author,
           COALESCE(w.media_type, 'Unspecified') as media_type,
           w.created_at,
           wm.trend_score,
           wm.competition_score,
           wm.monetization_potential
         FROM Work w
         LEFT JOIN (
           SELECT wm1.*
           FROM WorkMetric wm1
           INNER JOIN (
             SELECT work_id, MAX(metric_date) as latest_date
             FROM WorkMetric
             GROUP BY work_id
           ) latest ON wm1.work_id = latest.work_id AND wm1.metric_date = latest.latest_date
         ) wm ON w.id = wm.work_id
         WHERE w.status = 'active'${userClause}
         ORDER BY
           CASE WHEN wm.trend_score IS NULL THEN 1 ELSE 0 END,
           wm.trend_score DESC,
           w.created_at DESC
         LIMIT 10`
      )
      .bind(...params)
      .all<{
        id: number;
        title: string;
        author: string;
        media_type: string;
        created_at: string;
        trend_score: number;
      }>();

    return (results || []).map((row) => ({
      id: row.id,
      title: row.title,
      author: row.author,
      media_type: row.media_type,
      created_at: row.created_at,
      trend_score: row.trend_score ? Number(row.trend_score.toFixed(1)) : 0,
    }));
  }

  private async getTopAuthors(userId?: number): Promise<TopAuthorEntry[]> {
    const params: Array<number> = [];
    const userClause = userId ? ' AND user_id = ?' : '';
    if (userId) {
      params.push(userId);
    }

    const { results } = await this.db
      .prepare(
        `SELECT COALESCE(author, 'Unknown') as author, COUNT(*) as count
         FROM Work
         WHERE status = 'active'${userClause}
           AND author IS NOT NULL AND TRIM(author) != ''
         GROUP BY COALESCE(author, 'Unknown')
         ORDER BY count DESC
         LIMIT 10`
      )
      .bind(...params)
      .all<{ author: string; count: number }>();

    const total = (results || []).reduce((sum, row) => sum + (row.count || 0), 0) || 1;

    return (results || []).map((row) => ({
      author: row.author || 'Unknown',
      work_count: row.count || 0,
      percentage: Number(((row.count || 0) / total * 100).toFixed(1)),
    }));
  }

  private async getTopCategories(userId?: number): Promise<TopCategoryEntry[]> {
    const params: Array<number> = [];
    const userClause = userId ? ' AND user_id = ?' : '';
    if (userId) {
      params.push(userId);
    }

    const { results } = await this.db
      .prepare(
        `SELECT
           COALESCE(
             NULLIF(json_extract(metadata, '$.primary_category'), ''),
             NULLIF(json_extract(metadata, '$.category'), ''),
             COALESCE(media_type, 'General')
           ) as category,
           COUNT(*) as count
         FROM Work
         WHERE status = 'active'${userClause}
         GROUP BY category
         ORDER BY count DESC
         LIMIT 10`
      )
      .bind(...params)
      .all<{ category: string; count: number }>();

    return (results || []).map((row) => ({
      category: row.category || 'General',
      count: row.count || 0,
    }));
  }

  private async getOpportunities(userId?: number): Promise<OpportunityEntry[]> {
    const params: Array<number> = [];
    const userClause = userId ? ' AND w.user_id = ?' : '';
    if (userId) {
      params.push(userId);
    }

    const { results } = await this.db
      .prepare(
        `SELECT
           w.id,
           w.title,
           COALESCE(w.author, 'Unknown') as author,
           wm.trend_score,
           wm.competition_score,
           wm.monetization_potential
         FROM Work w
         INNER JOIN (
           SELECT wm1.*
           FROM WorkMetric wm1
           INNER JOIN (
             SELECT work_id, MAX(metric_date) as latest_date
             FROM WorkMetric
             GROUP BY work_id
           ) latest ON wm1.work_id = latest.work_id AND wm1.metric_date = latest.latest_date
         ) wm ON w.id = wm.work_id
         WHERE w.status = 'active'${userClause}
         ORDER BY wm.monetization_potential DESC
         LIMIT 8`
      )
      .bind(...params)
      .all<{
        id: number;
        title: string;
        author: string;
        trend_score: number;
        competition_score: number;
        monetization_potential: number;
      }>();

    return (results || []).map((row) => {
      const monetization = row.monetization_potential || 0;
      let opportunity_level = 'emerging';
      if (monetization >= 80) {
        opportunity_level = 'high';
      } else if (monetization >= 50) {
        opportunity_level = 'medium';
      }

      return {
        work_id: row.id,
        title: row.title,
        author: row.author,
        trend_score: row.trend_score ? Number(row.trend_score.toFixed(1)) : 0,
        competition_score: row.competition_score ? Number(row.competition_score.toFixed(1)) : 0,
        monetization_potential: Number(monetization.toFixed(1)),
        opportunity_level,
      };
    });
  }

  private async getCompetitionInsights(userId?: number): Promise<CompetitionInsight> {
    const totalInteractionsQuery = this.db.prepare(
      `SELECT COUNT(*) as total, COUNT(DISTINCT user_id) as unique_users
       FROM UserActivity${userId ? ' WHERE user_id = ?' : ''}`
    );

    const activityResult = userId
      ? await totalInteractionsQuery.bind(userId).first<{ total: number; unique_users: number }>()
      : await totalInteractionsQuery.first<{ total: number; unique_users: number }>();

    const total = activityResult?.total || 0;
    const uniqueUsers = activityResult?.unique_users || 0;

    let competitionLevel = 'Moderate';
    if (total > 500) {
      competitionLevel = 'High';
    } else if (total < 100) {
      competitionLevel = 'Low';
    }

    const marketTrends =
      total > 300
        ? 'Rising interest in public domain adaptations.'
        : total > 100
        ? 'Steady engagement across key media types.'
        : 'Early growth stage with emerging opportunities.';

    const topCompetitors: Array<{ name: string; market_share: number }> = [];
    if (uniqueUsers > 0) {
      const { results } = await this.db
        .prepare(
          `SELECT COALESCE(media_type, 'General') as media_type, COUNT(*) as count
           FROM Work
           WHERE status = 'active'${userId ? ' AND user_id = ?' : ''}
           GROUP BY COALESCE(media_type, 'General')
           ORDER BY count DESC
           LIMIT 5`
        )
        .bind(...(userId ? [userId] : []))
        .all<{ media_type: string; count: number }>();

      const totalWorks = (results || []).reduce((sum, row) => sum + (row.count || 0), 0) || 1;
      for (const row of results || []) {
        topCompetitors.push({
          name: row.media_type || 'General',
          market_share: Number(((row.count || 0) / totalWorks * 100).toFixed(1)),
        });
      }
    }

    return {
      total_market_size: `${total.toLocaleString()} interactions`,
      competition_level: competitionLevel,
      market_trends: marketTrends,
      top_competitors: topCompetitors,
      recommendations: [
        'Focus on high-trend works with low competition scores.',
        'Expand monitoring into underrepresented languages and media types.',
        'Leverage alerts to capture emerging interest early.',
      ],
    };
  }
}
