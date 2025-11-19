/**
 * Monetization Engine Service
 * 
 * Intelligent scoring and analysis system for public domain works
 * Calculates multi-dimensional metrics to identify high-value monetization opportunities
 */

import type { D1Database, KVNamespace } from '@cloudflare/workers-types';

// ===== TYPES =====

export interface Work {
    id: number;
    title: string;
    author?: string;
    original_publication_year?: number;
    public_domain_year?: number;
    description?: string;
    media_type?: string;
    language?: string;
    metadata?: any;
}

export interface MasterScore {
    work_id: number;
    master_monetization_score: number;
    market_saturation_index: number;
    cross_platform_score: number;
    demographic_match_score: number;
    temporal_window_score: number;
    derivative_potential: number;
    competitive_moat_score: number;
    ai_prediction_score: number;
    patent_invention_score: number;

    // Platform-specific
    film_tv_potential: number;
    game_potential: number;
    audiobook_potential: number;
    merchandise_potential: number;
    educational_potential: number;
    app_potential: number;
    book_republish_potential: number;

    // Demographics
    gen_z_appeal: number;
    millennial_appeal: number;
    gen_x_appeal: number;
    boomer_appeal: number;

    // Metadata
    saturation_data?: SaturationData;
    ai_analysis?: AIAnalysis;
    opportunity_angles?: RecommendedStrategy[];
    comparable_works?: ComparableWork[];
}

export interface SaturationData {
    amazon_listings: number;
    youtube_videos: number;
    tmdb_adaptations: number;
    active_trademarks: number;
    app_store_apps: number;
    total_existing_works: number;
    saturation_level: 'low' | 'moderate' | 'high' | 'extreme';
}

export interface AIAnalysis {
    openai_score?: number;
    claude_score?: number;
    gemini_score?: number;
    consensus_score: number;
    key_insights: string[];
    predicted_trends: string[];
    risk_factors: string[];
    opportunities: string[];
}

export interface RecommendedStrategy {
    priority: 'critical' | 'high' | 'medium' | 'low';
    angle: string;
    description: string;
    tactics: string[];
    timeline: string;
    investment_level: string;
    expected_roi: string;
    success_probability: number;
}

export interface ComparableWork {
    title: string;
    author?: string;
    adaptation_type: string;
    release_year: number;
    estimated_revenue: string;
    production_budget?: string;
    market_angle: string;
    success_factors: string[];
}

// ===== SERVICE =====

export class MonetizationEngineService {
    constructor(
        private db: D1Database,
        private cache?: KVNamespace
    ) { }

    /**
     * Calculate comprehensive monetization score for a work
     */
    async calculateMasterScore(workId: number): Promise<MasterScore> {
        const cacheKey = `monetization:score:${workId}`;

        // Check cache (1 hour TTL)
        if (this.cache) {
            const cached = await this.cache.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        }

        // Get work details
        const work = await this.getWork(workId);
        if (!work) {
            throw new Error(`Work ${workId} not found`);
        }

        // Calculate all metrics in parallel
        const [
            msi,
            cpps,
            adm,
            tmw,
            dwo,
            cma,
            aips,
            pims,
            platformScores,
            demographicScores
        ] = await Promise.all([
            this.calculateMarketSaturation(work),
            this.calculateCrossPlatformPotential(work),
            this.calculateDemographicMatch(work),
            this.calculateTemporalWindow(work),
            this.calculateDerivativeOpportunities(work),
            this.calculateCompetitiveMoat(work),
            this.calculateAIPrediction(work),
            this.calculatePatentInventionScore(work),
            this.calculatePlatformScores(work),
            this.calculateDemographicScores(work)
        ]);

        // Calculate weighted master score
        const rawMMS = this.computeMasterScore({
            msi,
            cpps,
            adm,
            tmw,
            dwo,
            cma,
            aips,
            pims
        });

        // Apply strategic adjustments
        let finalMMS = rawMMS;

        // Penalty for high saturation in high-potential markets
        if (rawMMS > 80 && msi > 70) {
            finalMMS *= 0.85;
        }

        // Bonus for perfect timing windows
        if (tmw > 85) {
            finalMMS *= 1.15;
        }

        // Cap at 100
        finalMMS = Math.min(finalMMS, 100);

        const masterScore: MasterScore = {
            work_id: workId,
            master_monetization_score: Math.round(finalMMS * 100) / 100,
            market_saturation_index: Math.round(msi * 100) / 100,
            cross_platform_score: Math.round(cpps * 100) / 100,
            demographic_match_score: Math.round(adm * 100) / 100,
            temporal_window_score: Math.round(tmw * 100) / 100,
            derivative_potential: Math.round(dwo * 100) / 100,
            competitive_moat_score: Math.round(cma * 100) / 100,
            ai_prediction_score: Math.round(aips * 100) / 100,
            patent_invention_score: Math.round(pims * 100) / 100,
            ...platformScores,
            ...demographicScores
        };

        // Save to database
        await this.saveMetrics(masterScore);

        // Cache result
        if (this.cache) {
            await this.cache.put(cacheKey, JSON.stringify(masterScore), {
                expirationTtl: 3600 // 1 hour
            });
        }

        return masterScore;
    }

    /**
     * Compute final weighted master score
     */
    private computeMasterScore(metrics: {
        msi: number;
        cpps: number;
        adm: number;
        tmw: number;
        dwo: number;
        cma: number;
        aips: number;
        pims: number;
    }): number {
        // Invert MSI (lower saturation is better)
        const adjustedMSI = 100 - metrics.msi;

        // Weighted average calculation
        return (
            (adjustedMSI * 0.15) +        // 15% - Market opportunity
            (metrics.cpps * 0.15) +        // 15% - Platform diversity
            (metrics.adm * 0.10) +         // 10% - Audience fit
            (metrics.tmw * 0.15) +         // 15% - Timing
            (metrics.dwo * 0.10) +         // 10% - Creative opportunities
            (metrics.cma * 0.15) +         // 15% - Defensibility
            (metrics.aips * 0.15) +        // 15% - AI intelligence
            (metrics.pims * 0.05)          // 5% - Tech/patent value
        );
    }

    /**
     * Calculate Market Saturation Index
     * Lower is better - indicates less competition
     */
    private async calculateMarketSaturation(work: Work): Promise<number> {
        // TODO: Integrate with external APIs
        // For now, use heuristic based on publication year and existing data

        const currentYear = new Date().getFullYear();
        const yearsSincePublication = work.original_publication_year
            ? currentYear - work.original_publication_year
            : 0;

        // Older works tend to have more adaptations
        let ageScore = Math.min(yearsSincePublication / 200 * 60, 60);

        // Popular authors have higher saturation
        const popularAuthors = ['shakespeare', 'dickens', 'austen', 'twain', 'wilde', 'doyle'];
        const authorBonus = work.author && popularAuthors.some(a =>
            work.author!.toLowerCase().includes(a)
        ) ? 30 : 0;

        // Media type affects saturation
        const mediaBonus = work.media_type === 'book' ? 10 : 0;

        const saturation = Math.min(ageScore + authorBonus + mediaBonus, 100);

        return saturation;
    }

    /**
     * Calculate Cross-Platform Potential
     * Higher is better - indicates multi-format opportunities
     */
    private async calculateCrossPlatformPotential(work: Work): Promise<number> {
        const scores: number[] = [];

        // Analyze based on genre and content type
        const description = (work.description || '').toLowerCase();
        const title = work.title.toLowerCase();
        const metadata = work.metadata || {};

        // Film/TV potential
        const hasNarrative = description.includes('story') || description.includes('novel');
        const hasCharacters = description.includes('character') || metadata.character_count > 3;
        scores.push(hasNarrative && hasCharacters ? 80 : 50);

        // Game potential
        const hasFantasy = description.includes('fantasy') || description.includes('adventure');
        const hasConflict = description.includes('battle') || description.includes('quest');
        scores.push(hasFantasy && hasConflict ? 85 : 45);

        // Audiobook potential - almost all books qualify
        scores.push(work.media_type === 'book' ? 90 : 30);

        // Merchandise potential
        const hasIconicElements = hasCharacters || description.includes('memorable');
        scores.push(hasIconicElements ? 70 : 40);

        // Educational potential
        const isClassic = metadata.is_classic || (work.original_publication_year && work.original_publication_year < 1950);
        scores.push(isClassic ? 75 : 55);

        // Calculate average
        return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }

    /**
     * Calculate Demographic Match Score
     * Based on spending power and content alignment
     */
    private async calculateDemographicMatch(work: Work): Promise<number> {
        const demographicScores = await this.calculateDemographicScores(work);

        // Weight by spending power
        const weights = {
            gen_z: 0.15,        // $360B spending power
            millennial: 0.35,   // $2.5T spending power
            gen_x: 0.30,        // $2.3T spending power
            boomer: 0.20        // $3.2T spending power (but lower digital engagement)
        };

        return (
            (demographicScores.gen_z_appeal * weights.gen_z) +
            (demographicScores.millennial_appeal * weights.millennial) +
            (demographicScores.gen_x_appeal * weights.gen_x) +
            (demographicScores.boomer_appeal * weights.boomer)
        );
    }

    /**
     * Calculate Temporal Market Window Score
     * Timing is everything - when to act
     */
    private async calculateTemporalWindow(work: Work): Promise<number> {
        const currentYear = new Date().getFullYear();
        let score = 0;

        // Public domain entry date
        if (work.public_domain_year) {
            const yearsSincePD = currentYear - work.public_domain_year;

            if (yearsSincePD <= 2) {
                score += 40; // GOLD RUSH
            } else if (yearsSincePD <= 5) {
                score += 25; // Recent
            } else if (yearsSincePD <= 10) {
                score += 10; // Mature
            } else {
                score += 5; // Old
            }
        } else {
            score += 20; // Not yet PD (speculative)
        }

        // Anniversary years boost
        if (work.original_publication_year) {
            const age = currentYear - work.original_publication_year;
            const isAnniversary = age % 25 === 0 || age % 50 === 0 || age % 100 === 0;
            if (isAnniversary) {
                score += 30;
            }
        }

        // TODO: Add trending analysis from Google Trends
        // For now, add baseline
        score += 20;

        return Math.min(score, 100);
    }

    /**
     * Calculate Derivative Work Opportunities
     * Potential for sequels, prequels, spinoffs
     */
    private async calculateDerivativeOpportunities(work: Work): Promise<number> {
        const description = (work.description || '').toLowerCase();
        const metadata = work.metadata || {};
        let score = 0;

        // Open-ended narratives
        if (description.includes('series') || metadata.is_series) {
            score += 30;
        }

        // Rich world-building
        if (description.includes('world') || description.includes('universe')) {
            score += 25;
        }

        // Strong characters
        if (metadata.character_count > 5 || description.includes('character')) {
            score += 20;
        }

        // Timeless themes
        const themes = ['love', 'adventure', 'mystery', 'justice', 'freedom'];
        if (themes.some(theme => description.includes(theme))) {
            score += 15;
        }

        // Modern adaptability
        if (work.original_publication_year && work.original_publication_year < 2000) {
            score += 10; // Classics are easier to modernize
        }

        return Math.min(score, 100);
    }

    /**
     * Calculate Competitive Moat Score
     * How defensible is your position
     */
    private async calculateCompetitiveMoat(work: Work): Promise<number> {
        let score = 0;

        // Niche positioning potential
        const isNiche = work.media_type !== 'book' || (work.language && work.language !== 'en');
        if (isNiche) {
            score += 25;
        }

        // First-mover opportunity (if low saturation)
        const saturation = await this.calculateMarketSaturation(work);
        if (saturation < 40) {
            score += 35; // Strong first-mover advantage
        } else if (saturation < 70) {
            score += 15;
        }

        // Quality barrier potential
        const isClassic = work.metadata?.is_classic;
        if (isClassic) {
            score += 20; // High-quality production can differentiate
        }

        // Base score for any work
        score += 20;

        return Math.min(score, 100);
    }

    /**
     * Calculate AI Prediction Score
     * Placeholder for LLM integration
     */
    private async calculateAIPrediction(work: Work): Promise<number> {
        // TODO: Integrate with OpenAI, Claude, Gemini
        // For now, return heuristic based on work attributes

        const hasDescription = !!work.description && work.description.length > 100;
        const hasAuthor = !!work.author;
        const hasYear = !!work.original_publication_year;

        let score = 50; // Base score

        if (hasDescription) score += 20;
        if (hasAuthor) score += 15;
        if (hasYear) score += 15;

        return Math.min(score, 100);
    }

    /**
     * Calculate Patent/Invention Score
     */
    private async calculatePatentInventionScore(work: Work): Promise<number> {
        // Only applicable to patents and technical works
        if (work.media_type !== 'patent' && work.media_type !== 'technical') {
            return 0;
        }

        // TODO: Implement patent-specific scoring
        return 50; // Placeholder
    }

    /**
     * Calculate platform-specific potential scores
     */
    private async calculatePlatformScores(work: Work): Promise<any> {
        const description = (work.description || '').toLowerCase();

        return {
            film_tv_potential: Math.round(this.scorePlatform(work, 'film') * 100) / 100,
            game_potential: Math.round(this.scorePlatform(work, 'game') * 100) / 100,
            audiobook_potential: Math.round(this.scorePlatform(work, 'audiobook') * 100) / 100,
            merchandise_potential: Math.round(this.scorePlatform(work, 'merchandise') * 100) / 100,
            educational_potential: Math.round(this.scorePlatform(work, 'educational') * 100) / 100,
            app_potential: Math.round(this.scorePlatform(work, 'app') * 100) / 100,
            book_republish_potential: Math.round(this.scorePlatform(work, 'book') * 100) / 100
        };
    }

    /**
     * Score individual platform potential
     */
    private scorePlatform(work: Work, platform: string): number {
        const description = (work.description || '').toLowerCase();
        const metadata = work.metadata || {};

        switch (platform) {
            case 'film':
                return description.includes('drama') || description.includes('story') ? 75 : 50;
            case 'game':
                return description.includes('adventure') || description.includes('fantasy') ? 80 : 40;
            case 'audiobook':
                return work.media_type === 'book' ? 90 : 20;
            case 'merchandise':
                return metadata.has_iconic_characters ? 85 : 45;
            case 'educational':
                return metadata.is_classic ? 80 : 50;
            case 'app':
                return description.includes('interactive') ? 70 : 35;
            case 'book':
                return work.media_type === 'book' ? 85 : 30;
            default:
                return 50;
        }
    }

    /**
     * Calculate demographic appeal scores
     */
    private async calculateDemographicScores(work: Work): Promise<any> {
        const description = (work.description || '').toLowerCase();
        const year = work.original_publication_year || 0;

        // Gen Z (18-27): Prefer YA, fantasy, diversity, social themes
        const genZKeywords = ['diverse', 'young', 'fantasy', 'dystopian', 'romance'];
        const genZScore = genZKeywords.some(kw => description.includes(kw)) ? 75 : 45;

        // Millennials (28-43): Nostalgia, quality, literary
        const millennialScore = (year >= 1920 && year <= 2000) ? 80 : 55;

        // Gen X (44-59): Classic literature, well-produced
        const genXScore = (year >= 1850 && year <= 1980) ? 75 : 50;

        // Boomers (60+): Historical, mystery, romance, traditional
        const boomerKeywords = ['historical', 'mystery', 'romance', 'classic'];
        const boomerScore = boomerKeywords.some(kw => description.includes(kw)) ? 80 : 60;

        return {
            gen_z_appeal: Math.round(genZScore * 100) / 100,
            millennial_appeal: Math.round(millennialScore * 100) / 100,
            gen_x_appeal: Math.round(genXScore * 100) / 100,
            boomer_appeal: Math.round(boomerScore * 100) / 100
        };
    }

    /**
     * Get work from database
     */
    private async getWork(workId: number): Promise<Work | null> {
        const result = await this.db.prepare(
            'SELECT * FROM Work WHERE id = ?'
        ).bind(workId).first<Work>();

        return result || null;
    }

    /**
     * Save metrics to database
     */
    private async saveMetrics(score: MasterScore): Promise<void> {
        await this.db.prepare(`
      INSERT INTO WorkMetric (
        work_id,
        master_monetization_score,
        market_saturation_index,
        cross_platform_score,
        demographic_match_score,
        temporal_window_score,
        derivative_potential,
        competitive_moat_score,
        ai_prediction_score,
        patent_invention_score,
        film_tv_potential,
        game_potential,
        audiobook_potential,
        merchandise_potential,
        educational_potential,
        app_potential,
        book_republish_potential,
        gen_z_appeal,
        millennial_appeal,
        gen_x_appeal,
        boomer_appeal,
        calculation_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'v1.0')
    `).bind(
            score.work_id,
            score.master_monetization_score,
            score.market_saturation_index,
            score.cross_platform_score,
            score.demographic_match_score,
            score.temporal_window_score,
            score.derivative_potential,
            score.competitive_moat_score,
            score.ai_prediction_score,
            score.patent_invention_score,
            score.film_tv_potential,
            score.game_potential,
            score.audiobook_potential,
            score.merchandise_potential,
            score.educational_potential,
            score.app_potential,
            score.book_republish_potential,
            score.gen_z_appeal,
            score.millennial_appeal,
            score.gen_x_appeal,
            score.boomer_appeal
        ).run();
    }

    /**
     * Get top monetization opportunities
     */
    async getTopOpportunities(limit: number = 20): Promise<any[]> {
        const { results } = await this.db.prepare(`
      SELECT
        w.id, w.title, w.author, w.media_type, w.description,
        wm.master_monetization_score,
        wm.market_saturation_index,
        wm.cross_platform_score,
        wm.temporal_window_score,
        wm.film_tv_potential,
        wm.game_potential
      FROM Work w
      INNER JOIN WorkMetric wm ON w.id = wm.work_id
      INNER JOIN (
        SELECT work_id, MAX(metric_date) as latest_date
        FROM WorkMetric
        GROUP BY work_id
      ) latest ON wm.work_id = latest.work_id AND wm.metric_date = latest.latest_date
      WHERE w.status = 'active'
        AND wm.master_monetization_score >= 70
        AND wm.market_saturation_index < 60
      ORDER BY wm.master_monetization_score DESC
      LIMIT ?
    `).bind(limit).all();

        return results || [];
    }
}
