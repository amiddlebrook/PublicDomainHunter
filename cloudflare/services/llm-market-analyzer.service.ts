// cloudflare/services/llm-market-analyzer.service.ts
// LLM-based market intelligence analyzer for public domain works

import { LLMService, AIProvider, Message } from './llm.service';
import { Work } from './db/work.service';
import { KVNamespace } from '@cloudflare/workers-types';

export interface LLMMarketAnalysis {
    analysis: {
        author_fame_score: number;
        work_recognition_score: number;
        cultural_relevance: string;
        existing_adaptations: string;
        market_gaps: string;
    };
    scores: {
        search_volume: number;
        competition: number;
        trend: number;
        demand: number;
        monetization: number;
    };
    justification: string;
}

/**
 * Service for analyzing market potential of public domain works using LLMs
 */
export class LLMMarketAnalyzer {
    private llmService: LLMService;
    private cache?: KVNamespace;

    constructor(env: any, cache?: KVNamespace) {
        this.llmService = new LLMService(env);
        this.cache = cache;
    }

    /**
     * Analyze a work's market potential using LLM
     * Results are cached for 30 days to avoid repeated API calls
     */
    async analyzeMarketPotential(work: Work | any): Promise<LLMMarketAnalysis | null> {
        // Check cache first
        const cacheKey = `llm-market:${work.id || work.title}`;

        if (this.cache) {
            try {
                const cached = await this.cache.get(cacheKey);
                if (cached) {
                    console.log(`Using cached LLM analysis for: ${work.title}`);
                    return JSON.parse(cached);
                }
            } catch (e) {
                console.warn('Cache read error:', e);
            }
        }

        // Generate new analysis
        try {
            const analysis = await this.generateAnalysis(work);

            // Cache the result for 30 days
            if (this.cache && analysis) {
                await this.cache.put(cacheKey, JSON.stringify(analysis), {
                    expirationTtl: 30 * 24 * 60 * 60 // 30 days
                });
            }

            return analysis;
        } catch (error) {
            console.error('LLM analysis error:', error);
            return null;
        }
    }

    /**
     * Generate comprehensive market analysis using LLM
     */
    private async generateAnalysis(work: Work | any): Promise<LLMMarketAnalysis | null> {
        const title = work.title || 'Unknown';
        const author = work.author || 'Unknown';
        const year = work.original_publication_year || work.publication_year || work.public_domain_year || 'Unknown';
        const description = work.description || 'No description available';

        const prompt = this.buildAnalysisPrompt(title, author, year, description);

        const messages: Message[] = [
            {
                role: 'system',
                content: 'You are a market intelligence analyst specializing in public domain works and their commercial potential. Provide detailed, evidence-based analysis with specific examples.'
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        // Try fast, cheap models first
        const providers = [
            AIProvider.OPENROUTER_QWEN3_CODER,  // Fast and cheap
            AIProvider.GEMINI,                   // Free tier
            AIProvider.OPENROUTER_DEEPSEEK_CHAT, // Good quality
            AIProvider.CLAUDE,                   // High quality fallback
        ];

        for (const provider of providers) {
            try {
                console.log(`Attempting LLM analysis with: ${provider}`);
                const response = await this.llmService.generate(messages, provider, {
                    temperature: 0.3, // Lower temp for more consistent, factual responses
                    maxTokens: 1500
                });

                // Parse and validate the JSON response
                const analysis = this.parseAnalysisResponse(response.content);
                if (analysis) {
                    console.log(`Successfully analyzed "${title}" with ${provider}`);
                    return analysis;
                }
            } catch (error) {
                console.warn(`${provider} failed:`, error);
                // Continue to next provider
            }
        }

        console.error(`All LLM providers failed for: ${title}`);
        return null;
    }

    /**
     * Build comprehensive analysis prompt
     */
    private buildAnalysisPrompt(title: string, author: string, year: string | number, description: string): string {
        return `Analyze this public domain work:

Title: "${title}"
Author: "${author}"
Publication Year: ${year}
Description: "${description}"

Perform a comprehensive market analysis by answering these questions:

1. AUTHOR ANALYSIS:
   - How famous is this author in modern culture? (cite specific evidence)
   - Are their works still taught in schools/universities?
   - How many film/TV adaptations exist of their works?

2. WORK RECOGNITION:
   - Is this a well-known classic or obscure work?
   - What is its cultural significance? (provide examples)
   - How often is it referenced in modern media?

3. SEARCH VOLUME ESTIMATE:
   - Based on author fame and work recognition, estimate monthly Google searches
   - Compare to similar works (e.g., if Austen: compare to "Pride and Prejudice")
   - Consider educational searches vs. commercial interest

4. MARKET SATURATION:
   - How many existing products/adaptations already exist?
   - Is the market oversaturated (e.g., Shakespeare) or underexplored?
   - What gaps or opportunities exist?

5. CURRENT TRENDS:
   - Is there renewed interest in this era/genre/author?
   - Recent adaptations or cultural references?
   - Social media presence and discussion?

6. MONETIZATION POTENTIAL:
   - What formats work best? (ebook, audiobook, merchandise, courses)
   - Target audience demographics
   - Pricing power and expected margins

Based on your analysis above, provide numeric scores (0-100) with BRIEF justification.

Return ONLY valid JSON in this exact format:
{
  "analysis": {
    "author_fame_score": 85,
    "work_recognition_score": 75,
    "cultural_relevance": "high - frequently adapted and referenced",
    "existing_adaptations": "multiple film/TV versions, stage plays",
    "market_gaps": "modern retellings, audio dramatizations"
  },
  "scores": {
    "search_volume": 80,
    "competition": 70,
    "trend": 75,
    "demand": 85,
    "monetization": 80
  },
  "justification": "Brief 2-3 sentence summary explaining the scores based on evidence"
}`;
    }

    /**
     * Parse and validate LLM response
     */
    private parseAnalysisResponse(content: string): LLMMarketAnalysis | null {
        try {
            // Clean up response - remove markdown code blocks if present
            let cleaned = content.trim();
            cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');

            const parsed = JSON.parse(cleaned);

            // Validate structure
            if (!parsed.analysis || !parsed.scores || !parsed.justification) {
                console.error('Invalid analysis structure');
                return null;
            }

            // Validate and clamp scores to 0-100
            const clampScore = (score: number) => Math.max(0, Math.min(100, score || 50));

            return {
                analysis: {
                    author_fame_score: clampScore(parsed.analysis.author_fame_score),
                    work_recognition_score: clampScore(parsed.analysis.work_recognition_score),
                    cultural_relevance: parsed.analysis.cultural_relevance || 'unknown',
                    existing_adaptations: parsed.analysis.existing_adaptations || 'unknown',
                    market_gaps: parsed.analysis.market_gaps || 'unknown'
                },
                scores: {
                    search_volume: clampScore(parsed.scores.search_volume),
                    competition: clampScore(parsed.scores.competition),
                    trend: clampScore(parsed.scores.trend),
                    demand: clampScore(parsed.scores.demand),
                    monetization: clampScore(parsed.scores.monetization)
                },
                justification: parsed.justification || 'No justification provided'
            };
        } catch (error) {
            console.error('Failed to parse LLM response:', error);
            console.error('Raw content:', content);
            return null;
        }
    }
}
