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
    async calculateMetrics(work: Work | any): Promise<MarketMetrics> {
        const currentYear = new Date().getFullYear();
        
        // Better public domain year calculation - handle both Work and PublicDomainWork interfaces
        let pdYear = work.public_domain_year || work.original_publication_year || work.publication_year;
        if (!pdYear && work.author_death_year) {
            pdYear = work.author_death_year + 70;
        }
        pdYear = pdYear || currentYear; // Default to current year if nothing available
        
        console.log('Work data:', {
            title: work.title,
            pdYear: pdYear,
            mediaType: work.media_type,
            publicationYear: work.original_publication_year || work.publication_year,
            authorDeathYear: work.author_death_year,
            source: work.source
        });

        // Initialize External API Service
        let realTrendData = 0;
        if (this.env) {
            try {
                const { ExternalAPIService } = await import('./external-apis.service');
                const externalService = new ExternalAPIService(this.env, this.cache);
                realTrendData = await externalService.getWikipediaPageviews(work.title);
            } catch (e) {
                console.warn('Failed to load ExternalAPIService, using fallback calculations', e);
            }
        }

        // 1. Trend Score (0-100)
        // Combine heuristic (PD status) with REAL Wikipedia data
        let trendScore = 50; // Start with neutral baseline

        // Base heuristic calculation - more aggressive scoring
        if (pdYear > currentYear) {
            const yearsUntil = pdYear - currentYear;
            trendScore = Math.max(10, 100 - (yearsUntil * 8)); // Less aggressive penalty
        } else {
            const yearsSince = currentYear - pdYear;
            if (yearsSince <= 5) {
                trendScore = 85; // Recently entered PD - very high trend
            } else if (yearsSince <= 20) {
                trendScore = Math.max(60, 90 - (yearsSince * 1.5)); // Established classics
            } else {
                trendScore = Math.max(30, 80 - (yearsSince * 0.5)); // Timeless works
            }
        }

        // Boost with Real Data (Wikipedia Views)
        if (realTrendData > 0) {
            const wikiScore = Math.min(100, (realTrendData / 10000) * 100);
            // Weighted average: 70% Real Data, 30% Heuristic
            trendScore = (wikiScore * 0.7) + (trendScore * 0.3);
        } else {
            // Fallback: Use title-based scoring if no Wikipedia data
            const title = work.title || '';
            const titleLower = title.toLowerCase();
            
            // Boost for famous works/authors
            const famousKeywords = ['pride', 'prejudice', 'adventure', 'treasure', 'odyssey', 'divine', 'comedy', 'inferno', 'sherlock', 'holmes', 'alice', 'wonderland'];
            const famousAuthors = ['shakespeare', 'dickens', 'austen', 'twain', 'homer', 'dante', 'milton', 'tolkien', 'lovecraft', 'poe'];
            
            if (famousKeywords.some(keyword => titleLower.includes(keyword))) {
                trendScore += 25;
            }
            if (famousAuthors.some(author => titleLower.includes(author))) {
                trendScore += 30;
            }
            
            // Boost for classic indicators
            if (titleLower.includes('classic') || titleLower.includes('great') || titleLower.includes('complete')) {
                trendScore += 20;
            }
            
            // Boost for series indicators
            if (titleLower.includes('volume') || titleLower.includes('book') || titleLower.includes('chapter')) {
                trendScore += 15;
            }
        }

        trendScore = Math.min(100, Math.max(10, trendScore)); // Ensure minimum 10%

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
        // Popular items have high competition, but make it more realistic
        let competitionScore = demandScore * 0.6; // Base correlation with demand
        
        // Adjust based on public domain status
        if (pdYear < currentYear - 50) {
            competitionScore += 25; // Very old works = established competition
        } else if (pdYear < currentYear - 20) {
            competitionScore += 15; // Older works = moderate competition
        } else if (pdYear > currentYear) {
            competitionScore -= 20; // Future works = low competition
        }
        
        // Adjust based on title specificity
        const titleWords = (work.title || '').split(' ').length;
        if (titleWords <= 2) {
            competitionScore += 20; // Short titles = high competition
        } else if (titleWords >= 5) {
            competitionScore -= 15; // Long titles = lower competition
        }
        
        // Adjust based on author fame
        const titleLower = (work.title || '').toLowerCase();
        const famousAuthors = ['shakespeare', 'dickens', 'austen', 'twain', 'homer', 'dante', 'milton', 'tolkien'];
        if (famousAuthors.some(author => titleLower.includes(author))) {
            competitionScore += 30; // Famous authors = high competition
        }
        
        competitionScore = Math.min(95, Math.max(15, competitionScore)); // Realistic range

        // 4. Monetization Potential (0-100)
        // (Demand - Competition) + Intrinsic Value
        let monetizationPotential = (demandScore * 1.5) - (competitionScore * 0.5);
        monetizationPotential = Math.min(100, Math.max(0, monetizationPotential));

        // 5. Search Volume (Estimated monthly searches) - Return as percentage (0-100)
        let searchVolumePercentage;
        if (realTrendData > 0) {
            // Convert Wikipedia views to percentage (max 100% for >10,000 views)
            searchVolumePercentage = Math.min(100, (realTrendData / 10000) * 100);
        } else {
            // Fallback: Use trend score as percentage
            searchVolumePercentage = Math.min(100, trendScore);
        }

        // 6. Google Trends Interest (0-100)
        const googleTrendsInterest = Math.floor(trendScore);

        return {
            trend_score: parseFloat(trendScore.toFixed(1)),
            competition_score: parseFloat(competitionScore.toFixed(1)),
            demand_score: parseFloat(demandScore.toFixed(1)),
            monetization_potential: parseFloat(monetizationPotential.toFixed(1)),
            search_volume: searchVolumePercentage,
            google_trends_interest: googleTrendsInterest
        };
    }
}
