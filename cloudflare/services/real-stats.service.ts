/**
 * Real Stats Service
 * Fetches REAL data from external public domain APIs
 */

interface StatsResult {
    count: number;
    display: string;
    sources?: {
        database?: number;
        gutenberg?: number;
        archive?: number;
    };
}

export class RealStatsService {
    constructor(
        private db?: any,
        private cache?: any
    ) { }

    /**
     * Get total works count - REAL API calls
     */
    async getTotalWorks(): Promise<StatsResult> {
        try {
            // Check cache first (6-hour TTL since external APIs are slow)
            const cacheKey = 'stats:realtime:total';
            const cached = await this.cache?.get(cacheKey);

            if (cached) {
                const data = JSON.parse(cached);
                if (Date.now() - data.timestamp < 21600000) { // 6 hours
                    return {
                        count: data.count,
                        display: data.display,
                        sources: data.sources
                    };
                }
            }

            // Get counts in parallel
            const [dbCount, gutenbergCount, archiveCount] = await Promise.all([
                this.getDBCount(),
                this.getGutenbergCount(),
                this.getArchiveCount()
            ]);

            const totalCount = dbCount + gutenbergCount + archiveCount;
            const display = this.formatCount(totalCount);

            const result = {
                count: totalCount,
                display,
                sources: {
                    database: dbCount,
                    gutenberg: gutenbergCount,
                    archive: archiveCount
                }
            };

            // Cache for 6 hours
            await this.cache?.put(cacheKey, JSON.stringify({
                ...result,
                timestamp: Date.now()
            }), { expirationTtl: 21600 });

            return result;
        } catch (error) {
            console.error('Failed to get total works:', error);
            throw error;
        }
    }

    /**
     * Get new works added in last 24 hours - REAL data
     */
    async getNewWorksToday(): Promise<{ count: number; sources: { database: number; gutenberg: number } }> {
        try {
            const [dbNew, gutenbergNew] = await Promise.all([
                this.getDBNewWorks(),
                this.getGutenbergNewWorks()
            ]);

            return {
                count: dbNew + gutenbergNew,
                sources: {
                    database: dbNew,
                    gutenberg: gutenbergNew
                }
            };
        } catch (error) {
            console.error('Failed to get new works:', error);
            throw error;
        }
    }

    /**
     * Private helpers
     */
    private async getDBCount(): Promise<number> {
        if (!this.db) return 0;

        try {
            const result = await this.db.prepare('SELECT COUNT(*) as count FROM works').first();
            return Number(result?.count) || 0;
        } catch (error) {
            console.warn('DB count error:', error);
            return 0;
        }
    }

    private async getGutenbergCount(): Promise<number> {
        try {
            const response = await fetch('https://gutendex.com/books/');
            const data = await response.json();
            return data.count || 0;
        } catch (error) {
            console.warn('Gutenberg API error:', error);
            return 70000; // Last known count as fallback
        }
    }

    private async getArchiveCount(): Promise<number> {
        try {
            const response = await fetch(
                'https://archive.org/advancedsearch.php?q=mediatype:(texts)+AND+publicdate:[* TO 1928-12-31]&fl=identifier&rows=0&output=json'
            );
            const data = await response.json();
            return data.response?.numFound || 0;
        } catch (error) {
            console.warn('Archive.org API error:', error);
            return 4000000; // Last known count as fallback
        }
    }

    private async getDBNewWorks(): Promise<number> {
        if (!this.db) return 0;

        try {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const result = await this.db.prepare(
                'SELECT COUNT(*) as count FROM works WHERE created_at > ?'
            ).bind(yesterday).first();
            return Number(result?.count) || 0;
        } catch (error) {
            console.warn('DB new works error:', error);
            return 0;
        }
    }

    private async getGutenbergNewWorks(): Promise<number> {
        try {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const dateStr = yesterday.toISOString().split('T')[0];

            const response = await fetch(
                `https://gutendex.com/books/?created_start=${dateStr}`
            );
            const data = await response.json();
            return data.count || 0;
        } catch (error) {
            console.warn('Gutenberg new works error:', error);
            return 0;
        }
    }

    private formatCount(count: number): string {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M+`;
        } else if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K+`;
        }
        return count.toString();
    }
}
