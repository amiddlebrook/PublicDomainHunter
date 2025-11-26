// cloudflare/services/market-signal.service.ts
// Service for calculating market signals and trends

import { Work } from './db/work.service';

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
    calculateMetrics(work: Work): MarketMetrics {
        const currentYear = new Date().getFullYear();
        const pdYear = work.public_domain_year || 1900;

        // 1. Trend Score (0-100)
        // Works entering PD recently are hotter.
        // Works from the future (entering soon) are also hot.
        let trendScore = 50;

        if (pdYear > currentYear) {
            // Future PD: High anticipation
            const yearsUntil = pdYear - currentYear;
            trendScore = Math.max(0, 100 - (yearsUntil * 10));
        } else {
            // Past PD: Newer is better
            const yearsSince = currentYear - pdYear;
            trendScore = Math.max(20, 90 - (yearsSince * 2));
        }

        // Add some randomness to simulate market fluctuations
        trendScore += (Math.random() * 20) - 10;
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
        const baseVolume = 1000;
        const searchVolume = Math.floor(baseVolume * (demandScore / 10));

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
