# AI Provider Integration Guide

This document describes how to configure and use multiple AI providers with Public Domain Hunter.

## Overview

Public Domain Hunter now supports multiple AI language model providers for advanced content analysis, recommendations, and insights. You can:

- Use any combination of available providers
- Toggle providers on/off individually
- Mix responses from multiple providers for comparison
- Configure provider-specific settings
- Test provider connections

## Supported Providers

### Direct API Providers

1. **OpenAI GPT-4**
   - Provider: `openai`
   - Model: `gpt-4-turbo-preview`
   - API Key: `OPENAI_API_KEY`
   - Features: Advanced language understanding, content analysis, recommendations

2. **Anthropic Claude**
   - Provider: `claude`
   - Model: `claude-3-5-sonnet-20241022`
   - API Key: `CLAUDE_API_KEY`
   - Features: Helpful and harmless AI, content safety, detailed analysis

3. **Google Gemini**
   - Provider: `gemini`
   - Model: `gemini-pro`
   - API Key: `GEMINI_API_KEY`
   - Features: Multimodal capabilities, strong reasoning

### OpenRouter Models

4. **Qwen 2.5 Coder**
   - Provider: `openrouter_qwen3_coder`
   - Model: `qwen/qwen-2.5-coder-32b-instruct`
   - API Key: `OPENROUTER_QWEN3_CODER_API_KEY`
   - Features: Specialized for coding and technical content

5. **DeepSeek R1 Distilled**
   - Provider: `openrouter_deepseek_r1t2`
   - Model: `deepseek/deepseek-r1-distill-qwen-32b`
   - API Key: `OPENROUTER_DEEPSEEK_R1T2_API_KEY`
   - Features: Advanced reasoning capabilities

6. **DeepSeek Chat**
   - Provider: `openrouter_deepseek_chat`
   - Model: `deepseek/deepseek-chat`
   - API Key: `OPENROUTER_DEEPSEEK_CHAT_API_KEY`
   - Features: General-purpose conversational AI

7. **MiniMax M2**
   - Provider: `openrouter_minimax_m2`
   - Model: `minimax/minimax-01`
   - API Key: `OPENROUTER_MINIMAX_M2_API_KEY`
   - Features: High-quality Chinese and English support

8. **GLM-4 Plus**
   - Provider: `openrouter_glm_45_air`
   - Model: `zhipuai/glm-4-plus`
   - API Key: `OPENROUTER_GLM_45_AIR_API_KEY`
   - Features: Efficient bilingual model

9. **Qwen QwQ 32B**
   - Provider: `openrouter_qwen3_235b`
   - Model: `qwen/qwq-32b-preview`
   - API Key: `OPENROUTER_QWEN3_235B_API_KEY`
   - Features: Large-scale reasoning model

## Configuration

### Setting Up API Keys

Add your API keys to your Cloudflare Worker secrets:

```bash
# Using Wrangler CLI
wrangler secret put OPENAI_API_KEY
wrangler secret put CLAUDE_API_KEY
wrangler secret put GEMINI_API_KEY
wrangler secret put OPENROUTER_QWEN3_CODER_API_KEY
wrangler secret put OPENROUTER_DEEPSEEK_R1T2_API_KEY
wrangler secret put OPENROUTER_DEEPSEEK_CHAT_API_KEY
wrangler secret put OPENROUTER_MINIMAX_M2_API_KEY
wrangler secret put OPENROUTER_GLM_45_AIR_API_KEY
wrangler secret put OPENROUTER_QWEN3_235B_API_KEY
```

Or add them in the Cloudflare Dashboard:
1. Go to your Worker settings
2. Navigate to "Settings" > "Variables"
3. Add encrypted environment variables for each API key

### Database Migration

Run the database migration to create the necessary tables:

```bash
# Using Python
python app/migrations/run_migration.py
```

Or run the SQL migration directly:

```bash
psql -U your_user -d your_database -f app/migrations/001_add_ai_preferences.sql
```

### Installing Dependencies

Install the required Python packages:

```bash
pip install -r requirements.txt
```

This will install:
- `openai>=1.12.0` - OpenAI API client
- `anthropic>=0.18.0` - Anthropic Claude API client
- `google-generativeai>=0.3.0` - Google Gemini API client

## Using the AI Provider UI

### Configuration Tab

1. Navigate to the **AI Insights** page
2. Click on the **Configure** tab
3. You'll see all available AI providers

For each provider:
- **Toggle Switch**: Enable/disable the provider
- **Available Badge**: Shows if the API key is configured
- **Default Button**: Set as your default provider
- **Test Button**: Test the provider connection

### Provider Settings

Configure generation settings:
- **Mix Multiple Providers**: Get responses from all enabled providers
- **Temperature**: Control randomness (0.0 = focused, 2.0 = creative)
- **Max Tokens**: Maximum length of responses

## API Endpoints

### Provider Configuration

#### Get Available Providers
```http
GET /api/ai/config/providers
```

Response:
```json
[
  {
    "provider": "openai",
    "model": "gpt-4-turbo-preview",
    "available": true,
    "description": "OpenAI GPT-4 - Advanced language model"
  }
]
```

#### Get User Preferences
```http
GET /api/ai/config/preferences
```

Response:
```json
{
  "user_id": 1,
  "enabled_providers": ["openai", "claude"],
  "default_provider": "openai",
  "mix_providers": false,
  "temperature": 0.7,
  "max_tokens": 4000
}
```

#### Update Preferences
```http
PUT /api/ai/config/preferences
Content-Type: application/json

{
  "enabled_providers": ["openai", "claude", "gemini"],
  "default_provider": "claude",
  "mix_providers": true,
  "temperature": 0.8,
  "max_tokens": 8000
}
```

#### Test Provider
```http
POST /api/ai/config/test
Content-Type: application/json

{
  "provider": "openai",
  "prompt": "Hello, are you working?"
}
```

### LLM-Powered Analysis

#### Analyze Content
```http
POST /api/ai/llm/analyze
Content-Type: application/json

{
  "work_id": 123,
  "analysis_type": "sentiment",
  "providers": ["openai", "claude"]
}
```

Analysis types:
- `general` - General content analysis
- `sentiment` - Sentiment analysis
- `topics` - Topic extraction
- `summary` - Content summarization
- `quality` - Quality assessment

#### Get LLM Recommendations
```http
POST /api/ai/llm/recommendations
Content-Type: application/json

{
  "limit": 10,
  "providers": ["claude"],
  "context": "Looking for classic literature"
}
```

#### Get Comprehensive Insights
```http
GET /api/ai/llm/insights/123?providers=openai,claude
```

This endpoint runs multiple analyses in parallel:
- Summary
- Sentiment analysis
- Topic extraction
- Quality assessment

## Usage Examples

### Python Client Example

```python
import httpx
import asyncio

async def analyze_work():
    async with httpx.AsyncClient() as client:
        # Analyze content with multiple providers
        response = await client.post(
            "https://your-app.workers.dev/api/ai/llm/analyze",
            json={
                "work_id": 123,
                "analysis_type": "sentiment",
                "providers": ["openai", "claude", "gemini"]
            },
            headers={"Authorization": "Bearer YOUR_TOKEN"}
        )

        data = response.json()
        print(f"Analysis from {len(data['analysis'])} providers:")
        for analysis in data['analysis']:
            print(f"\n{analysis['provider']}:")
            print(analysis['result'])

asyncio.run(analyze_work())
```

### JavaScript/TypeScript Example

```typescript
async function getRecommendations() {
  const response = await fetch('/api/ai/llm/recommendations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: JSON.stringify({
      limit: 10,
      providers: ['openai', 'claude'],
      context: 'Science fiction novels'
    })
  })

  const data = await response.json()
  console.log('Recommendations:', data.recommendations)
}
```

## Features

### Single Provider Mode
Use one AI provider for consistent results:
1. Enable only one provider
2. Set it as default
3. All requests will use this provider

### Multi-Provider Comparison
Compare responses from multiple providers:
1. Enable multiple providers
2. Toggle "Mix Multiple Providers" ON
3. Requests will return results from all enabled providers

### Provider-Specific Settings
Configure different settings for different providers:
```json
{
  "provider_settings": {
    "openai": {
      "temperature": 0.7,
      "max_tokens": 4000
    },
    "claude": {
      "temperature": 0.5,
      "max_tokens": 8000
    }
  }
}
```

## Best Practices

1. **API Key Security**: Always store API keys as encrypted secrets in Cloudflare
2. **Rate Limiting**: Be aware of rate limits for each provider
3. **Cost Management**: Monitor usage across providers
4. **Provider Selection**: Choose providers based on task requirements
5. **Temperature Settings**:
   - Low (0.0-0.3): Factual, deterministic tasks
   - Medium (0.4-0.9): Balanced creativity
   - High (1.0-2.0): Creative, diverse outputs

## Troubleshooting

### Provider Not Available
- Verify API key is set in Cloudflare secrets
- Check API key is valid
- Test the provider using the Test button

### Request Errors
- Check your API key has sufficient credits
- Verify you're not hitting rate limits
- Ensure the provider supports your requested model

### Slow Responses
- Reduce max_tokens for faster responses
- Use single provider mode instead of mixing
- Consider using faster models (e.g., GPT-3.5 instead of GPT-4)

## Database Schema

### ai_preferences Table
```sql
CREATE TABLE ai_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    enabled_providers JSON DEFAULT '[]'::json,
    default_provider VARCHAR(50),
    mix_providers BOOLEAN DEFAULT FALSE,
    provider_settings JSON DEFAULT '{}'::json,
    temperature REAL DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 4000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

### user_activities Table
```sql
CREATE TABLE user_activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    work_id INTEGER NOT NULL REFERENCES works(id),
    activity_type VARCHAR(50),
    metadata JSON,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Support

For issues or questions:
1. Check this documentation
2. Review API endpoint documentation at `/docs`
3. Open an issue on GitHub
4. Contact support

## Future Enhancements

Planned features:
- Custom model selection per provider
- Provider cost tracking
- Response caching
- Batch processing
- Streaming responses
- Fine-tuned models support
