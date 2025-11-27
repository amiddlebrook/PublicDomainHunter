// cloudflare/services/market-signal.service.ts
// Service for calculating market signals and trends

import { Work } from './db/work.service';
import { KVNamespace } from '@cloudflare/workers-types';

export interface MarketMetrics {
    trend_score: number;
    competition_score: number;
    demand_score: number;
    monetization_potential: number;
    search_volume: number;
    google_trends_interest: number;
}

export class MarketSignalService {
    /**
     * Calculate market metrics for a work based on available data
     */
    constructor(
        private env?: any,
        private cache?: KVNamespace
    ) { }

    /**
     * Calculate market metrics for a work based on available data
     */
    async calculateMetrics(work: Work): Promise<MarketMetrics> {
        const currentYear = new Date().getFullYear();
        const pdYear = work.public_domain_year || 1900;

        // Initialize External API Service
        let realTrendData = 0;
        if (this.env) {
            try {
                const { ExternalAPIService } = await import('./external-apis.service');
                const externalService = new ExternalAPIService(this.env, this.cache);
                realTrendData = await externalService.getWikipediaPageviews(work.title);
            } catch (e) {
                console.warn('Failed to load ExternalAPIService', e);
            }
        }

        // 1. Trend Score (0-100)
        // Combine heuristic (PD status) with REAL Wikipedia data
        let trendScore = 50;

        // Base heuristic
        if (pdYear > currentYear) {
            const yearsUntil = pdYear - currentYear;
            trendScore = Math.max(0, 100 - (yearsUntil * 10));
        } else {
            const yearsSince = currentYear - pdYear;
            trendScore = Math.max(20, 90 - (yearsSince * 2));
        }

        // Boost with Real Data (Wikipedia Views)
        // Assume > 10,000 monthly views is "Viral" (100)
        // < 100 views is "Obscure" (0 boost)
        if (realTrendData > 0) {
            const wikiScore = Math.min(100, (realTrendData / 10000) * 100);
            // Weighted average: 70% Real Data, 30% Heuristic
            trendScore = (wikiScore * 0.7) + (trendScore * 0.3);
        }

        trendScore = Math.min(100, Math.max(0, trendScore));

        // 2. Demand Score (0-100)
        // Correlated with trend, but influenced by media type
        let demandScore = trendScore;

        // Boost for high-demand media types
        switch (work.media_type?.toLowerCase()) {
            case 'video':
            case 'movie':
            case 'film':
                demandScore *= 1.2;
                break;
            case 'audio':
            case 'music':
                demandScore *= 1.1;
                break;
            case 'book':
            case 'text':
                demandScore *= 1.0;
                break;
            case 'image':
            case 'picture':
                demandScore *= 0.9;
                break;
        }
        demandScore = Math.min(100, Math.max(0, demandScore));

        // 3. Competition Score (0-100)
        // Popular items have high competition.
        let competitionScore = demandScore * 0.8;
        // Older PD works have more established competition
        if (pdYear < currentYear - 20) {
            competitionScore += 20;
        }
        competitionScore = Math.min(100, Math.max(0, competitionScore));

        // 4. Monetization Potential (0-100)
        // (Demand - Competition) + Intrinsic Value
        let monetizationPotential = (demandScore * 1.5) - (competitionScore * 0.5);
        monetizationPotential = Math.min(100, Math.max(0, monetizationPotential));

        // 5. Search Volume (Estimated monthly searches)
        // Use real Wikipedia views as a baseline if available
        let searchVolume = 1000;
        if (realTrendData > 0) {
            // Wikipedia views are a good proxy for search volume
            searchVolume = realTrendData;
        } else {
            const baseVolume = 1000;
            searchVolume = Math.floor(baseVolume * (demandScore / 10));
        }

        // 6. Google Trends Interest (0-100)
        const googleTrendsInterest = Math.floor(trendScore);

        return {
            trend_score: parseFloat(trendScore.toFixed(1)),
            competition_score: parseFloat(competitionScore.toFixed(1)),
            demand_score: parseFloat(demandScore.toFixed(1)),
            monetization_potential: parseFloat(monetizationPotential.toFixed(1)),
            search_volume: searchVolume,
            google_trends_interest: googleTrendsInterest
        };
    }
}
