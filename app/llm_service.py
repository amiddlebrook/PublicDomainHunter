"""
LLM Service for integrating multiple AI providers.

Supports OpenAI, Claude, Gemini, and various OpenRouter models.
Allows users to toggle between providers or mix responses from multiple providers.
"""

import os
import logging
import asyncio
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass
from enum import Enum
import json

import httpx
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic

logger = logging.getLogger(__name__)


class AIProvider(str, Enum):
    """Supported AI providers."""
    OPENAI = "openai"
    CLAUDE = "claude"
    GEMINI = "gemini"
    OPENROUTER_QWEN3_CODER = "openrouter_qwen3_coder"
    OPENROUTER_DEEPSEEK_R1T2 = "openrouter_deepseek_r1t2"
    OPENROUTER_DEEPSEEK_CHAT = "openrouter_deepseek_chat"
    OPENROUTER_MINIMAX_M2 = "openrouter_minimax_m2"
    OPENROUTER_GLM_45_AIR = "openrouter_glm_45_air"
    OPENROUTER_QWEN3_235B = "openrouter_qwen3_235b"


@dataclass
class ProviderConfig:
    """Configuration for an AI provider."""
    provider: AIProvider
    model: str
    api_key_env: str
    base_url: Optional[str] = None
    max_tokens: int = 4000
    temperature: float = 0.7


# Provider configurations
PROVIDER_CONFIGS = {
    AIProvider.OPENAI: ProviderConfig(
        provider=AIProvider.OPENAI,
        model="gpt-4-turbo-preview",
        api_key_env="OPENAI_API_KEY",
    ),
    AIProvider.CLAUDE: ProviderConfig(
        provider=AIProvider.CLAUDE,
        model="claude-3-5-sonnet-20241022",
        api_key_env="CLAUDE_API_KEY",
    ),
    AIProvider.GEMINI: ProviderConfig(
        provider=AIProvider.GEMINI,
        model="gemini-pro",
        api_key_env="GEMINI_API_KEY",
    ),
    AIProvider.OPENROUTER_QWEN3_CODER: ProviderConfig(
        provider=AIProvider.OPENROUTER_QWEN3_CODER,
        model="qwen/qwen-2.5-coder-32b-instruct",
        api_key_env="OPENROUTER_QWEN3_CODER_API_KEY",
        base_url="https://openrouter.ai/api/v1",
    ),
    AIProvider.OPENROUTER_DEEPSEEK_R1T2: ProviderConfig(
        provider=AIProvider.OPENROUTER_DEEPSEEK_R1T2,
        model="deepseek/deepseek-r1-distill-qwen-32b",
        api_key_env="OPENROUTER_DEEPSEEK_R1T2_API_KEY",
        base_url="https://openrouter.ai/api/v1",
    ),
    AIProvider.OPENROUTER_DEEPSEEK_CHAT: ProviderConfig(
        provider=AIProvider.OPENROUTER_DEEPSEEK_CHAT,
        model="deepseek/deepseek-chat",
        api_key_env="OPENROUTER_DEEPSEEK_CHAT_API_KEY",
        base_url="https://openrouter.ai/api/v1",
    ),
    AIProvider.OPENROUTER_MINIMAX_M2: ProviderConfig(
        provider=AIProvider.OPENROUTER_MINIMAX_M2,
        model="minimax/minimax-01",
        api_key_env="OPENROUTER_MINIMAX_M2_API_KEY",
        base_url="https://openrouter.ai/api/v1",
    ),
    AIProvider.OPENROUTER_GLM_45_AIR: ProviderConfig(
        provider=AIProvider.OPENROUTER_GLM_45_AIR,
        model="zhipuai/glm-4-plus",
        api_key_env="OPENROUTER_GLM_45_AIR_API_KEY",
        base_url="https://openrouter.ai/api/v1",
    ),
    AIProvider.OPENROUTER_QWEN3_235B: ProviderConfig(
        provider=AIProvider.OPENROUTER_QWEN3_235B,
        model="qwen/qwq-32b-preview",
        api_key_env="OPENROUTER_QWEN3_235B_API_KEY",
        base_url="https://openrouter.ai/api/v1",
    ),
}


@dataclass
class LLMResponse:
    """Response from an LLM provider."""
    provider: AIProvider
    content: str
    model: str
    tokens_used: Optional[int] = None
    finish_reason: Optional[str] = None
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class LLMService:
    """
    Service for interacting with multiple LLM providers.

    Supports:
    - OpenAI GPT models
    - Claude (Anthropic)
    - Gemini (Google)
    - Various OpenRouter models

    Can use a single provider or mix responses from multiple providers.
    """

    def __init__(self, env: Optional[Dict[str, str]] = None):
        """
        Initialize LLM service.

        Args:
            env: Optional environment dict for API keys (defaults to os.environ)
        """
        self.env = env or os.environ
        self._clients = {}
        self._initialize_clients()

    def _initialize_clients(self):
        """Initialize API clients for available providers."""
        # OpenAI client
        if self.env.get("OPENAI_API_KEY"):
            self._clients[AIProvider.OPENAI] = AsyncOpenAI(
                api_key=self.env["OPENAI_API_KEY"]
            )
            logger.info("Initialized OpenAI client")

        # Claude client
        if self.env.get("CLAUDE_API_KEY"):
            self._clients[AIProvider.CLAUDE] = AsyncAnthropic(
                api_key=self.env["CLAUDE_API_KEY"]
            )
            logger.info("Initialized Claude client")

        # OpenRouter clients (all use OpenAI-compatible API)
        openrouter_providers = [
            AIProvider.OPENROUTER_QWEN3_CODER,
            AIProvider.OPENROUTER_DEEPSEEK_R1T2,
            AIProvider.OPENROUTER_DEEPSEEK_CHAT,
            AIProvider.OPENROUTER_MINIMAX_M2,
            AIProvider.OPENROUTER_GLM_45_AIR,
            AIProvider.OPENROUTER_QWEN3_235B,
        ]

        for provider in openrouter_providers:
            config = PROVIDER_CONFIGS[provider]
            api_key = self.env.get(config.api_key_env)
            if api_key:
                self._clients[provider] = AsyncOpenAI(
                    api_key=api_key,
                    base_url=config.base_url
                )
                logger.info(f"Initialized {provider.value} client")

    def get_available_providers(self) -> List[AIProvider]:
        """
        Get list of available providers (those with API keys configured).

        Returns:
            List of available AI providers
        """
        available = []

        for provider, config in PROVIDER_CONFIGS.items():
            if self.env.get(config.api_key_env):
                available.append(provider)

        return available

    async def generate(
        self,
        prompt: str,
        providers: Optional[List[AIProvider]] = None,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        mix_responses: bool = False
    ) -> Union[LLMResponse, List[LLMResponse]]:
        """
        Generate text using one or more LLM providers.

        Args:
            prompt: The user prompt
            providers: List of providers to use (defaults to first available)
            system_prompt: Optional system prompt
            temperature: Temperature for generation (0.0-2.0)
            max_tokens: Maximum tokens to generate
            mix_responses: If True with multiple providers, return all responses

        Returns:
            Single LLMResponse or list of LLMResponse if mix_responses=True
        """
        if not providers:
            available = self.get_available_providers()
            if not available:
                raise ValueError("No AI providers configured")
            providers = [available[0]]

        # Validate providers
        for provider in providers:
            if provider not in self._clients:
                logger.warning(f"Provider {provider.value} not configured, skipping")
                providers.remove(provider)

        if not providers:
            raise ValueError("None of the requested providers are available")

        # Generate from all requested providers
        tasks = []
        for provider in providers:
            task = self._generate_single(
                provider=provider,
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=temperature,
                max_tokens=max_tokens
            )
            tasks.append(task)

        responses = await asyncio.gather(*tasks, return_exceptions=True)

        # Process responses
        valid_responses = []
        for i, response in enumerate(responses):
            if isinstance(response, Exception):
                logger.error(f"Error from provider {providers[i].value}: {response}")
                valid_responses.append(LLMResponse(
                    provider=providers[i],
                    content="",
                    model=PROVIDER_CONFIGS[providers[i]].model,
                    error=str(response)
                ))
            else:
                valid_responses.append(response)

        if mix_responses or len(providers) > 1:
            return valid_responses
        else:
            return valid_responses[0] if valid_responses else None

    async def _generate_single(
        self,
        provider: AIProvider,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> LLMResponse:
        """Generate text from a single provider."""
        config = PROVIDER_CONFIGS[provider]
        temp = temperature if temperature is not None else config.temperature
        tokens = max_tokens if max_tokens is not None else config.max_tokens

        try:
            if provider == AIProvider.OPENAI:
                return await self._generate_openai(prompt, system_prompt, temp, tokens, config)
            elif provider == AIProvider.CLAUDE:
                return await self._generate_claude(prompt, system_prompt, temp, tokens, config)
            elif provider == AIProvider.GEMINI:
                return await self._generate_gemini(prompt, system_prompt, temp, tokens, config)
            elif provider.value.startswith("openrouter_"):
                return await self._generate_openrouter(provider, prompt, system_prompt, temp, tokens, config)
            else:
                raise ValueError(f"Unsupported provider: {provider}")

        except Exception as e:
            logger.error(f"Error generating from {provider.value}: {e}")
            return LLMResponse(
                provider=provider,
                content="",
                model=config.model,
                error=str(e)
            )

    async def _generate_openai(
        self,
        prompt: str,
        system_prompt: Optional[str],
        temperature: float,
        max_tokens: int,
        config: ProviderConfig
    ) -> LLMResponse:
        """Generate using OpenAI API."""
        client = self._clients[AIProvider.OPENAI]

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = await client.chat.completions.create(
            model=config.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )

        return LLMResponse(
            provider=AIProvider.OPENAI,
            content=response.choices[0].message.content,
            model=response.model,
            tokens_used=response.usage.total_tokens if response.usage else None,
            finish_reason=response.choices[0].finish_reason,
            metadata={
                "id": response.id,
                "created": response.created
            }
        )

    async def _generate_claude(
        self,
        prompt: str,
        system_prompt: Optional[str],
        temperature: float,
        max_tokens: int,
        config: ProviderConfig
    ) -> LLMResponse:
        """Generate using Claude API."""
        client = self._clients[AIProvider.CLAUDE]

        kwargs = {
            "model": config.model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": [{"role": "user", "content": prompt}]
        }

        if system_prompt:
            kwargs["system"] = system_prompt

        response = await client.messages.create(**kwargs)

        return LLMResponse(
            provider=AIProvider.CLAUDE,
            content=response.content[0].text,
            model=response.model,
            tokens_used=response.usage.input_tokens + response.usage.output_tokens,
            finish_reason=response.stop_reason,
            metadata={
                "id": response.id,
                "type": response.type
            }
        )

    async def _generate_gemini(
        self,
        prompt: str,
        system_prompt: Optional[str],
        temperature: float,
        max_tokens: int,
        config: ProviderConfig
    ) -> LLMResponse:
        """Generate using Gemini API."""
        api_key = self.env.get("GEMINI_API_KEY")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{config.model}:generateContent?key={api_key}"

        # Combine system prompt and user prompt if needed
        full_prompt = prompt
        if system_prompt:
            full_prompt = f"{system_prompt}\n\n{prompt}"

        payload = {
            "contents": [{
                "parts": [{"text": full_prompt}]
            }],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            }
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=60.0)
            response.raise_for_status()
            data = response.json()

        content = ""
        if "candidates" in data and len(data["candidates"]) > 0:
            candidate = data["candidates"][0]
            if "content" in candidate and "parts" in candidate["content"]:
                parts = candidate["content"]["parts"]
                content = "".join(part.get("text", "") for part in parts)

        return LLMResponse(
            provider=AIProvider.GEMINI,
            content=content,
            model=config.model,
            finish_reason=data.get("candidates", [{}])[0].get("finishReason"),
            metadata=data.get("usageMetadata", {})
        )

    async def _generate_openrouter(
        self,
        provider: AIProvider,
        prompt: str,
        system_prompt: Optional[str],
        temperature: float,
        max_tokens: int,
        config: ProviderConfig
    ) -> LLMResponse:
        """Generate using OpenRouter API (OpenAI-compatible)."""
        client = self._clients[provider]

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = await client.chat.completions.create(
            model=config.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            extra_headers={
                "HTTP-Referer": "https://publicdomainhunter.com",
                "X-Title": "Public Domain Hunter"
            }
        )

        return LLMResponse(
            provider=provider,
            content=response.choices[0].message.content,
            model=response.model,
            tokens_used=response.usage.total_tokens if response.usage else None,
            finish_reason=response.choices[0].finish_reason,
            metadata={
                "id": response.id,
                "created": response.created
            }
        )

    async def analyze_content(
        self,
        content: str,
        analysis_type: str = "general",
        providers: Optional[List[AIProvider]] = None
    ) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
        """
        Analyze content using LLM(s).

        Args:
            content: The content to analyze
            analysis_type: Type of analysis (general, sentiment, topics, etc.)
            providers: List of providers to use

        Returns:
            Analysis results from one or all providers
        """
        system_prompts = {
            "general": "You are an expert content analyst. Provide detailed analysis of the given content.",
            "sentiment": "Analyze the sentiment of the following content. Classify as positive, negative, or neutral and explain why.",
            "topics": "Extract the main topics and themes from the following content. List them clearly.",
            "summary": "Provide a concise summary of the following content.",
            "quality": "Evaluate the quality and readability of the following content."
        }

        system_prompt = system_prompts.get(analysis_type, system_prompts["general"])

        prompt = f"Please analyze the following content:\n\n{content[:5000]}"  # Limit content length

        responses = await self.generate(
            prompt=prompt,
            providers=providers,
            system_prompt=system_prompt,
            mix_responses=bool(providers and len(providers) > 1)
        )

        # Parse responses into structured format
        if isinstance(responses, list):
            return [self._parse_analysis_response(r, analysis_type) for r in responses]
        else:
            return self._parse_analysis_response(responses, analysis_type)

    def _parse_analysis_response(self, response: LLMResponse, analysis_type: str) -> Dict[str, Any]:
        """Parse LLM response into structured analysis."""
        return {
            "provider": response.provider.value,
            "model": response.model,
            "analysis_type": analysis_type,
            "result": response.content,
            "tokens_used": response.tokens_used,
            "error": response.error
        }

    async def generate_recommendations(
        self,
        user_preferences: Dict[str, Any],
        available_content: List[Dict[str, Any]],
        providers: Optional[List[AIProvider]] = None,
        count: int = 10
    ) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
        """
        Generate content recommendations using LLM(s).

        Args:
            user_preferences: User's preferences and history
            available_content: List of available content to recommend from
            providers: List of providers to use
            count: Number of recommendations to generate

        Returns:
            Recommendations from one or all providers
        """
        system_prompt = """You are an expert recommendation system for public domain content.
        Based on user preferences and available content, recommend the most relevant items.
        Return recommendations as a JSON array with work_id, score, and reason."""

        prompt = f"""User preferences: {json.dumps(user_preferences, indent=2)}

Available content (sample): {json.dumps(available_content[:20], indent=2)}

Please recommend {count} pieces of content that best match the user's preferences.
Format your response as JSON."""

        responses = await self.generate(
            prompt=prompt,
            providers=providers,
            system_prompt=system_prompt,
            temperature=0.3,  # Lower temperature for more focused recommendations
            mix_responses=bool(providers and len(providers) > 1)
        )

        if isinstance(responses, list):
            return [self._parse_recommendations(r) for r in responses]
        else:
            return self._parse_recommendations(responses)

    def _parse_recommendations(self, response: LLMResponse) -> Dict[str, Any]:
        """Parse LLM response into structured recommendations."""
        try:
            # Try to parse as JSON
            recommendations = json.loads(response.content)
        except json.JSONDecodeError:
            # If not valid JSON, return raw content
            recommendations = {"raw_response": response.content}

        return {
            "provider": response.provider.value,
            "model": response.model,
            "recommendations": recommendations,
            "tokens_used": response.tokens_used,
            "error": response.error
        }


# Global service instance
_llm_service = None


def get_llm_service(env: Optional[Dict[str, str]] = None) -> LLMService:
    """
    Get or create LLM service instance.

    Args:
        env: Optional environment dict for API keys

    Returns:
        LLMService instance
    """
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService(env=env)
    return _llm_service
