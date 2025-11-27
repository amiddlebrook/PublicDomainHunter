/**
 * AI Insights Service
 * Multi-provider AI analysis for monetization scoring, saturation analysis, and market intelligence
 */

interface Work {
    id: number;
    title: string;
    author: string;
    media_type: string;
    public_domain_year: number;
    description?: string;
    language?: string;
    content?: string;
}

interface MonetizationReport {
    score: number; // 0-100
    products: Array<{
        type: string;
        potential: number;
        rationale: string;
    }>;
    demographics: string[];
    demand: 'low' | 'medium' | 'high';
    keySellingPoints: string[];
}

interface SaturationReport {
    index: number; // 0-100, 0 = untapped, 100 = oversaturated
    competitors: number;
    marketplaces: {
        amazon: number;
        etsy: number;
        redbubble: number;
    };
    trendDirection: 'rising' | 'stable' | 'declining';
    recommendation: string;
}

export class AIInsightsService {
    constructor(
        private env: any,
        private db?: any,
        private cache?: any
    ) { }

    /**
     * Call AI with smart model routing
     */
    private async callAI(
        prompt: string,
        options: {
            model?: 'deepseek-r1' | 'claude' | 'qwen-235b' | 'qwen-coder' | 'gpt4';
            temperature?: number;
            maxTokens?: number;
            json?: boolean;
        } = {}
    ): Promise<string> {
        const { model = 'claude', temperature = 0.7, maxTokens = 2000, json = false } = options;

        try {
            switch (model) {
                case 'deepseek-r1':
                    return await this.callDeepSeekR1(prompt, temperature, maxTokens);
                case 'claude':
                    return await this.callClaude(prompt, temperature, maxTokens, json);
                case 'qwen-235b':
                    return await this.callQwen235B(prompt, temperature, maxTokens);
                case 'qwen-coder':
                    return await this.callQwenCoder(prompt, temperature, maxTokens);
                case 'gpt4':
                    return await this.callGPT4(prompt, temperature, maxTokens, json);
                default:
                    throw new Error(`Unknown model: ${model}`);
            }
        } catch (error) {
            console.error(`AI call failed for ${model}:`, error);
            // Fallback chain: try Claude, then GPT-4
            if (model !== 'claude') {
                try {
                    return await this.callClaude(prompt, temperature, maxTokens, json);
                } catch (fallbackError) {
                    return await this.callGPT4(prompt, temperature, maxTokens, json);
                }
            }
            throw error;
        }
    }

    /**
     * DeepSeek R1T2 - Advanced reasoning model
     */
    private async callDeepSeekR1(prompt: string, temperature: number, maxTokens: number): Promise<string> {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.env.OPENROUTER_DEEPSEEK_R1T2_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://publicdomainhunter.com',
                'X-Title': 'Public Domain Hunter'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-r1-distill-qwen-32b',
                messages: [{ role: 'user', content: prompt }],
                temperature,
                max_tokens: maxTokens
            })
        });

        const data = await response.json();
        return data.choices[0].message.content;
    }

    /**
     * Claude 3.5 Sonnet - Best for structured analysis
     */
    private async callClaude(prompt: string, temperature: number, maxTokens: number, json: boolean): Promise<string> {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': this.env.CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: maxTokens,
                temperature,
                messages: [
                    {
                        role: 'user',
                        content: json
                            ? `${prompt}\n\nRespond ONLY with valid JSON, no markdown formatting.`
                            : prompt
                    }
                ]
            })
        });

        const data = await response.json();
        return data.content[0].text;
    }

    /**
     * Qwen3 235B - Large context model
     */
    private async callQwen235B(prompt: string, temperature: number, maxTokens: number): Promise<string> {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.env.OPENROUTER_QWEN3_235B_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://publicdomainhunter.com'
            },
            body: JSON.stringify({
                model: 'qwen/qwen-2.5-72b-instruct',
                messages: [{ role: 'user', content: prompt }],
                temperature,
                max_tokens: maxTokens
            })
        });

        const data = await response.json();
        return data.choices[0].message.content;
    }

    /**
     * Qwen3 Coder - Code generation specialist
     */
    private async callQwenCoder(prompt: string, temperature: number, maxTokens: number): Promise<string> {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.env.OPENROUTER_QWEN3_CODER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://publicdomainhunter.com'
            },
            body: JSON.stringify({
                model: 'qwen/qwq-32b-preview',
                messages: [{ role: 'user', content: prompt }],
                temperature,
                max_tokens: maxTokens
            })
        });

        const data = await response.json();
        return data.choices[0].message.content;
    }

    /**
     * GPT-4 - Reliable fallback
     */
    private async callGPT4(prompt: string, temperature: number, maxTokens: number, json: boolean): Promise<string> {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4-turbo-preview',
                messages: [{ role: 'user', content: prompt }],
                temperature,
                max_tokens: maxTokens,
                response_format: json ? { type: 'json_object' } : undefined
            })
        });

        const data = await response.json();
        return data.choices[0].message.content;
    }

    /**
     * Analyze monetization potential using DeepSeek R1 for reasoning
     */
    async analyzeMonetization(work: Work): Promise<MonetizationReport> {
        const prompt = `You are a market analyst expert. Analyze the monetization potential of this public domain work:

Title: "${work.title}"
Author: ${work.author}
Media Type: ${work.media_type}
Public Domain Year: ${work.public_domain_year}
Description: ${work.description?.slice(0, 800) || 'Not available'}
Language: ${work.language || 'Unknown'}

Provide a comprehensive monetization analysis with:
1. Overall monetization score (0-100)
2. Top 5 best product formats with potential scores
3. Target demographics (age, interests, etc.)
4. Estimated market demand (low/medium/high)
5. Key selling points

Return ONLY valid JSON in this exact format:
{
  "score": 75,
  "products": [
    {"type": "Art Prints/Posters", "potential": 85, "rationale": "..."},
    {"type": "Ebooks", "potential": 70, "rationale": "..."}
  ],
  "demographics": ["Art collectors", "History enthusiasts"],
  "demand": "high",
  "keySellingPoints": ["Unique historical significance", "Nostalgia appeal"]
}`;

        const response = await this.callAI(prompt, {
            model: 'deepseek-r1',
            temperature: 0.3,
            maxTokens: 2000,
            json: true
        });

        // Parse JSON response
        try {
            const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleaned);
        } catch (error) {
            console.error('Failed to parse JSON:', response);
            // Return default structure
            return {
                score: 50,
                products: [{ type: 'General Products', potential: 50, rationale: 'Analysis pending' }],
                demographics: ['General audience'],
                demand: 'medium',
                keySellingPoints: ['Public domain status']
            };
        }
    }

    /**
     * Analyze market saturation using web search + AI
     */
    async analyzeSaturation(work: Work): Promise<SaturationReport> {
        // Simplified saturation analysis (would integrate with Serper/SerpAPI in production)
        const searchTerm = `${work.title} ${work.author} poster print`;

        const prompt = `Estimate market saturation for "${work.title}" by ${work.author}.

Consider:
- This is a ${work.media_type} from ${work.public_domain_year}
- Common product types: posters, prints, ebooks, merchandise
- Competing modern works in similar genre/style

Estimate:
1. Saturation index (0-100, where 0=untapped blue ocean, 100=extremely saturated)
2. Approximate number of competitors
3. Trend direction (rising/stable/declining interest)
4. Strategic recommendation

Return ONLY valid JSON:
{
  "index": 35,
  "competitors": 150,
  "marketplaces": {"amazon": 50, "etsy": 75, "redbubble": 25},
  "trendDirection": "stable",
  "recommendation": "Moderate opportunity..."
}`;

        const response = await this.callAI(prompt, {
            model: 'claude',
            temperature: 0.2,
            maxTokens: 1000,
            json: true
        });

        try {
            const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleaned);
        } catch (error) {
            return {
                index: 50,
                competitors: 0,
                marketplaces: { amazon: 0, etsy: 0, redbubble: 0 },
                trendDirection: 'stable',
                recommendation: 'Analysis pending - manual research recommended'
            };
        }
    }

    /**
     * Batch rank works by monetization potential
     */
    async rankWorks(works: Work[]): Promise<Array<{ work: Work; score: number; rationale: string }>> {
        const worksList = works.map((w, i) =>
            `${i + 1}. "${w.title}" by ${w.author} (${w.media_type}, ${w.public_domain_year})`
        ).join('\n');

        const prompt = `Rank these ${works.length} public domain works by monetization potential (highest to lowest):

${worksList}

For each work, provide:
- Monetization score (0-100)
- Brief rationale (1-2 sentences)

Return ONLY valid JSON array:
[
  {"index": 1, "score": 85, "rationale": "..."},
  {"index": 5, "score": 72, "rationale": "..."}
]`;

        const response = await this.callAI(prompt, {
            model: 'deepseek-r1',
            temperature: 0.4,
            maxTokens: 2000,
            json: true
        });

        try {
            const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const rankings = JSON.parse(cleaned);

            return rankings.map((r: any) => ({
                work: works[r.index - 1],
                score: r.score,
                rationale: r.rationale
            }));
        } catch (error) {
            console.error('Failed to parse rankings:', error);
            return works.map(w => ({
                work: w,
                score: 50,
                rationale: 'Analysis pending'
            }));
        }
    }
}
