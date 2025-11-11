// cloudflare/services/llm.service.ts
// LLM Service for integrating multiple AI providers on Cloudflare Workers
// Supports OpenAI, Claude, Gemini, and OpenRouter models

export enum AIProvider {
  OPENAI = 'openai',
  CLAUDE = 'claude',
  GEMINI = 'gemini',
  OPENROUTER_QWEN3_CODER = 'openrouter_qwen3_coder',
  OPENROUTER_DEEPSEEK_R1T2 = 'openrouter_deepseek_r1t2',
  OPENROUTER_DEEPSEEK_CHAT = 'openrouter_deepseek_chat',
  OPENROUTER_MINIMAX_M2 = 'openrouter_minimax_m2',
  OPENROUTER_GLM_45_AIR = 'openrouter_glm_45_air',
  OPENROUTER_QWEN3_235B = 'openrouter_qwen3_235b',
}

export interface ProviderConfig {
  provider: AIProvider;
  model: string;
  apiKeyEnv: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  provider: AIProvider;
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LLMServiceConfig {
  enabledProviders: AIProvider[];
  defaultProvider: AIProvider;
  mixProviders: boolean;
  temperature?: number;
  maxTokens?: number;
}

// Provider configurations
export const PROVIDER_CONFIGS: Record<AIProvider, ProviderConfig> = {
  [AIProvider.OPENAI]: {
    provider: AIProvider.OPENAI,
    model: 'gpt-4-turbo-preview',
    apiKeyEnv: 'OPENAI_API_KEY',
    baseUrl: 'https://api.openai.com/v1',
  },
  [AIProvider.CLAUDE]: {
    provider: AIProvider.CLAUDE,
    model: 'claude-3-5-sonnet-20241022',
    apiKeyEnv: 'CLAUDE_API_KEY',
    baseUrl: 'https://api.anthropic.com/v1',
  },
  [AIProvider.GEMINI]: {
    provider: AIProvider.GEMINI,
    model: 'gemini-pro',
    apiKeyEnv: 'GEMINI_API_KEY',
    baseUrl: 'https://generativelanguage.googleapis.com/v1',
  },
  [AIProvider.OPENROUTER_QWEN3_CODER]: {
    provider: AIProvider.OPENROUTER_QWEN3_CODER,
    model: 'qwen/qwen-2.5-coder-32b-instruct',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  [AIProvider.OPENROUTER_DEEPSEEK_R1T2]: {
    provider: AIProvider.OPENROUTER_DEEPSEEK_R1T2,
    model: 'deepseek/deepseek-r1-distill-qwen-32b',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  [AIProvider.OPENROUTER_DEEPSEEK_CHAT]: {
    provider: AIProvider.OPENROUTER_DEEPSEEK_CHAT,
    model: 'deepseek/deepseek-chat',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  [AIProvider.OPENROUTER_MINIMAX_M2]: {
    provider: AIProvider.OPENROUTER_MINIMAX_M2,
    model: 'minimax/minimax-01',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  [AIProvider.OPENROUTER_GLM_45_AIR]: {
    provider: AIProvider.OPENROUTER_GLM_45_AIR,
    model: 'zhipuai/glm-4-plus',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  [AIProvider.OPENROUTER_QWEN3_235B]: {
    provider: AIProvider.OPENROUTER_QWEN3_235B,
    model: 'qwen/qwq-32b-preview',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
};

export class LLMService {
  constructor(private env: any) {}

  /**
   * Generate a completion using the specified provider
   */
  async generate(
    messages: Message[],
    provider: AIProvider = AIProvider.OPENAI,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<LLMResponse> {
    const config = PROVIDER_CONFIGS[provider];
    const apiKey = this.env[config.apiKeyEnv];

    if (!apiKey) {
      throw new Error(`API key not found for provider: ${provider}`);
    }

    const temperature = options?.temperature || config.temperature || 0.7;
    const maxTokens = options?.maxTokens || config.maxTokens || 4000;

    switch (provider) {
      case AIProvider.OPENAI:
        return await this.callOpenAI(messages, config, apiKey, temperature, maxTokens);
      case AIProvider.CLAUDE:
        return await this.callClaude(messages, config, apiKey, temperature, maxTokens);
      case AIProvider.GEMINI:
        return await this.callGemini(messages, config, apiKey, temperature, maxTokens);
      default:
        // All OpenRouter models use the same API format
        return await this.callOpenRouter(messages, config, apiKey, temperature, maxTokens);
    }
  }

  /**
   * Generate mixed responses from multiple providers
   */
  async generateMixed(
    messages: Message[],
    providers: AIProvider[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<LLMResponse[]> {
    const promises = providers.map(provider =>
      this.generate(messages, provider, options)
    );

    return await Promise.all(promises);
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(
    messages: Message[],
    config: ProviderConfig,
    apiKey: string,
    temperature: number,
    maxTokens: number
  ): Promise<LLMResponse> {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data: any = await response.json();

    return {
      provider: AIProvider.OPENAI,
      content: data.choices[0].message.content,
      usage: data.usage,
    };
  }

  /**
   * Call Claude API
   */
  private async callClaude(
    messages: Message[],
    config: ProviderConfig,
    apiKey: string,
    temperature: number,
    maxTokens: number
  ): Promise<LLMResponse> {
    // Extract system message if present
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch(`${config.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: maxTokens,
        temperature,
        system: systemMessage?.content,
        messages: conversationMessages,
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data: any = await response.json();

    return {
      provider: AIProvider.CLAUDE,
      content: data.content[0].text,
      usage: data.usage,
    };
  }

  /**
   * Call Gemini API
   */
  private async callGemini(
    messages: Message[],
    config: ProviderConfig,
    apiKey: string,
    temperature: number,
    maxTokens: number
  ): Promise<LLMResponse> {
    // Convert messages to Gemini format
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await fetch(
      `${config.baseUrl}/models/${config.model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data: any = await response.json();

    return {
      provider: AIProvider.GEMINI,
      content: data.candidates[0].content.parts[0].text,
    };
  }

  /**
   * Call OpenRouter API (for all OpenRouter models)
   */
  private async callOpenRouter(
    messages: Message[],
    config: ProviderConfig,
    apiKey: string,
    temperature: number,
    maxTokens: number
  ): Promise<LLMResponse> {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://publicdomainhunter.com',
        'X-Title': 'Public Domain Hunter',
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data: any = await response.json();

    return {
      provider: config.provider,
      content: data.choices[0].message.content,
      usage: data.usage,
    };
  }

  /**
   * Analyze public domain work with AI
   */
  async analyzeWork(
    title: string,
    author: string,
    description?: string,
    provider: AIProvider = AIProvider.OPENAI
  ): Promise<string> {
    const messages: Message[] = [
      {
        role: 'system',
        content: 'You are an expert in analyzing public domain works for monetization potential, market trends, and commercial opportunities.',
      },
      {
        role: 'user',
        content: `Analyze this public domain work for monetization potential:
Title: ${title}
Author: ${author}
Description: ${description || 'N/A'}

Please provide:
1. Potential modern adaptations or formats
2. Target audience analysis
3. Market trends and demand
4. Monetization strategies
5. Competition analysis`,
      },
    ];

    const response = await this.generate(messages, provider);
    return response.content;
  }

  /**
   * Generate marketing content for a work
   */
  async generateMarketingContent(
    title: string,
    author: string,
    contentType: 'description' | 'ad' | 'social' = 'description',
    provider: AIProvider = AIProvider.OPENAI
  ): Promise<string> {
    const messages: Message[] = [
      {
        role: 'system',
        content: 'You are an expert copywriter specializing in marketing public domain works.',
      },
      {
        role: 'user',
        content: `Generate a compelling ${contentType} for:
Title: ${title}
Author: ${author}`,
      },
    ];

    const response = await this.generate(messages, provider);
    return response.content;
  }
}
