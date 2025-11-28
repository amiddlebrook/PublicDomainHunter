// cloudflare/services/external-apis.service.ts
// Service to fetch real-world data from external APIs

import { KVNamespace } from '@cloudflare/workers-types';

export class ExternalAPIService {
    constructor(
        private env: any, // Bindings
        private cache?: KVNamespace
    ) { }

    /**
     * Search Wikipedia for the best matching title
     */
    async searchWikipediaTitle(query: string): Promise<string | null> {
        const cacheKey = `wiki:search:${query}`;
        if (this.cache) {
            const cached = await this.cache.get(cacheKey);
            if (cached) return cached;
        }

        try {
            const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
            const response = await fetch(url);
            const data: any = await response.json();

            if (data.query && data.query.search && data.query.search.length > 0) {
                const bestMatch = data.query.search[0].title;
                // Cache for 7 days
                if (this.cache) {
                    await this.cache.put(cacheKey, bestMatch, { expirationTtl: 604800 });
                }
                return bestMatch;
            }
            return null;
        } catch (error) {
            console.error('Wikipedia search error:', error);
            return null;
        }
    }

    /**
     * Get Wikipedia pageviews for the last 30 days
     * Acts as a proxy for "Trend Score"
     */
    async getWikipediaPageviews(title: string): Promise<number> {
        if (!title) return 0;

        // Try to find the correct Wikipedia title first
        const wikiTitle = await this.searchWikipediaTitle(title) || title;
        const slug = wikiTitle.replace(/\s+/g, '_');

        const cacheKey = `wiki:views:${slug}`;

        if (this.cache) {
            const cached = await this.cache.get(cacheKey);
            if (cached) return parseInt(cached);
        }

        try {
            // Get dates for last 30 days
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - 30);

            const startStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
            const endStr = endDate.toISOString().split('T')[0].replace(/-/g, '');

            const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/${encodeURIComponent(slug)}/daily/${startStr}/${endStr}`;

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'PublicDomainHunter/1.0 (mailto:admin@publicdomainhunter.com)'
                }
            });

            if (!response.ok) {
                return 0;
            }

            const data: any = await response.json();
            let totalViews = 0;

            if (data.items) {
                for (const item of data.items) {
                    totalViews += item.views;
                }
            }

            // Cache for 24 hours
            if (this.cache) {
                await this.cache.put(cacheKey, totalViews.toString(), { expirationTtl: 86400 });
            }

            return totalViews;
        } catch (error) {
            console.error(`Error fetching Wikipedia views for ${title}:`, error);
            return 0;
        }
    }

    /**
     * Get TMDb data for Film/TV potential
     * Requires TMDB_API_KEY
     */
    async getTMDbData(title: string): Promise<any> {
        const apiKey = this.env.TMDB_API_KEY;
        if (!apiKey) return null;

        const cacheKey = `tmdb:search:${title}`;
        if (this.cache) {
            const cached = await this.cache.get(cacheKey);
            if (cached) return JSON.parse(cached);
        }

        try {
            const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(title)}`;
            const response = await fetch(url);

            if (!response.ok) return null;

            const data = await response.json();

            // Cache for 7 days
            if (this.cache) {
                await this.cache.put(cacheKey, JSON.stringify(data), { expirationTtl: 604800 });
            }

            return data;
        } catch (error) {
            console.error('TMDb API error:', error);
            return null;
        }
    }
}
