"""
AI Provider Configuration API endpoints.

Allows users to configure their AI provider preferences and test connections.
"""

import logging
from typing import Dict, Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.database import get_db
from app.auth import get_current_active_user
from app.models import User, AIPreference
from app.llm_service import get_llm_service, AIProvider, PROVIDER_CONFIGS

logger = logging.getLogger(__name__)

router = APIRouter()


# Request/Response models
class AIPreferenceUpdate(BaseModel):
    """Model for updating AI preferences."""
    enabled_providers: Optional[List[str]] = Field(None, description="List of enabled provider names")
    default_provider: Optional[str] = Field(None, description="Default provider to use")
    mix_providers: Optional[bool] = Field(None, description="Mix responses from multiple providers")
    provider_settings: Optional[Dict[str, Any]] = Field(None, description="Provider-specific settings")
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0, description="Generation temperature")
    max_tokens: Optional[int] = Field(None, ge=100, le=32000, description="Maximum tokens")


class AIPreferenceResponse(BaseModel):
    """Response model for AI preferences."""
    user_id: int
    enabled_providers: List[str]
    default_provider: Optional[str]
    mix_providers: bool
    provider_settings: Dict[str, Any]
    temperature: float
    max_tokens: int
    created_at: str
    updated_at: Optional[str]


class ProviderInfo(BaseModel):
    """Information about an AI provider."""
    provider: str
    model: str
    available: bool
    description: Optional[str]


class TestProviderRequest(BaseModel):
    """Request model for testing a provider."""
    provider: str = Field(..., description="Provider to test")
    prompt: str = Field("Hello, are you working?", description="Test prompt")


@router.get("/providers", response_model=List[ProviderInfo])
async def get_available_providers(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> List[ProviderInfo]:
    """
    Get list of all AI providers and their availability.

    Returns information about which providers are configured and available.
    """
    try:
        llm_service = get_llm_service()
        available_providers = llm_service.get_available_providers()

        provider_descriptions = {
            AIProvider.OPENAI: "OpenAI GPT-4 - Advanced language model with broad capabilities",
            AIProvider.CLAUDE: "Anthropic Claude - Helpful, harmless, and honest AI assistant",
            AIProvider.GEMINI: "Google Gemini - Multimodal AI with strong reasoning",
            AIProvider.OPENROUTER_QWEN3_CODER: "Qwen 2.5 Coder - Specialized coding assistant",
            AIProvider.OPENROUTER_DEEPSEEK_R1T2: "DeepSeek R1 - Advanced reasoning model",
            AIProvider.OPENROUTER_DEEPSEEK_CHAT: "DeepSeek Chat - General-purpose conversational AI",
            AIProvider.OPENROUTER_MINIMAX_M2: "MiniMax - High-quality Chinese and English model",
            AIProvider.OPENROUTER_GLM_45_AIR: "GLM-4 Plus - Efficient bilingual model",
            AIProvider.OPENROUTER_QWEN3_235B: "Qwen QwQ - Large-scale reasoning model",
        }

        providers_info = []
        for provider_enum in AIProvider:
            config = PROVIDER_CONFIGS[provider_enum]
            is_available = provider_enum in available_providers

            providers_info.append(ProviderInfo(
                provider=provider_enum.value,
                model=config.model,
                available=is_available,
                description=provider_descriptions.get(provider_enum, "")
            ))

        return providers_info

    except Exception as e:
        logger.error(f"Error getting available providers: {e}")
        raise HTTPException(status_code=500, detail="Failed to get providers")


@router.get("/preferences", response_model=AIPreferenceResponse)
async def get_ai_preferences(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> AIPreferenceResponse:
    """
    Get current user's AI provider preferences.

    Returns the user's configured preferences or defaults if not set.
    """
    try:
        # Get or create user preferences
        preferences = db.query(AIPreference).filter(
            AIPreference.user_id == current_user.id
        ).first()

        if not preferences:
            # Create default preferences
            llm_service = get_llm_service()
            available = llm_service.get_available_providers()
            default_provider = available[0].value if available else None

            preferences = AIPreference(
                user_id=current_user.id,
                enabled_providers=[p.value for p in available],
                default_provider=default_provider,
                mix_providers=False,
                provider_settings={},
                temperature=0.7,
                max_tokens=4000
            )
            db.add(preferences)
            db.commit()
            db.refresh(preferences)

        return AIPreferenceResponse(
            user_id=preferences.user_id,
            enabled_providers=preferences.enabled_providers or [],
            default_provider=preferences.default_provider,
            mix_providers=preferences.mix_providers or False,
            provider_settings=preferences.provider_settings or {},
            temperature=preferences.temperature or 0.7,
            max_tokens=preferences.max_tokens or 4000,
            created_at=preferences.created_at.isoformat(),
            updated_at=preferences.updated_at.isoformat() if preferences.updated_at else None
        )

    except Exception as e:
        logger.error(f"Error getting AI preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to get preferences")


@router.put("/preferences", response_model=AIPreferenceResponse)
async def update_ai_preferences(
    update: AIPreferenceUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> AIPreferenceResponse:
    """
    Update user's AI provider preferences.

    Allows users to configure which providers to use and their settings.
    """
    try:
        # Get or create preferences
        preferences = db.query(AIPreference).filter(
            AIPreference.user_id == current_user.id
        ).first()

        if not preferences:
            preferences = AIPreference(user_id=current_user.id)
            db.add(preferences)

        # Update fields if provided
        if update.enabled_providers is not None:
            # Validate providers
            valid_providers = [p.value for p in AIProvider]
            for provider in update.enabled_providers:
                if provider not in valid_providers:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid provider: {provider}"
                    )
            preferences.enabled_providers = update.enabled_providers

        if update.default_provider is not None:
            # Validate default provider
            valid_providers = [p.value for p in AIProvider]
            if update.default_provider not in valid_providers:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid default provider: {update.default_provider}"
                )
            preferences.default_provider = update.default_provider

        if update.mix_providers is not None:
            preferences.mix_providers = update.mix_providers

        if update.provider_settings is not None:
            preferences.provider_settings = update.provider_settings

        if update.temperature is not None:
            preferences.temperature = update.temperature

        if update.max_tokens is not None:
            preferences.max_tokens = update.max_tokens

        db.commit()
        db.refresh(preferences)

        return AIPreferenceResponse(
            user_id=preferences.user_id,
            enabled_providers=preferences.enabled_providers or [],
            default_provider=preferences.default_provider,
            mix_providers=preferences.mix_providers or False,
            provider_settings=preferences.provider_settings or {},
            temperature=preferences.temperature or 0.7,
            max_tokens=preferences.max_tokens or 4000,
            created_at=preferences.created_at.isoformat(),
            updated_at=preferences.updated_at.isoformat() if preferences.updated_at else None
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating AI preferences: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update preferences")


@router.post("/test")
async def test_provider(
    request: TestProviderRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Test an AI provider connection.

    Sends a test prompt to verify the provider is working correctly.
    """
    try:
        # Validate provider
        try:
            provider = AIProvider(request.provider)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid provider: {request.provider}"
            )

        llm_service = get_llm_service()

        # Check if provider is available
        available = llm_service.get_available_providers()
        if provider not in available:
            return {
                "success": False,
                "provider": request.provider,
                "error": "Provider not configured (missing API key)",
                "message": f"Please configure the API key for {request.provider}"
            }

        # Test the provider
        response = await llm_service.generate(
            prompt=request.prompt,
            providers=[provider],
            temperature=0.5,
            max_tokens=100
        )

        if response.error:
            return {
                "success": False,
                "provider": request.provider,
                "error": response.error,
                "message": f"Provider test failed: {response.error}"
            }

        return {
            "success": True,
            "provider": request.provider,
            "model": response.model,
            "response": response.content[:200] + "..." if len(response.content) > 200 else response.content,
            "tokens_used": response.tokens_used,
            "message": "Provider is working correctly"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error testing provider: {e}")
        raise HTTPException(status_code=500, detail=f"Provider test failed: {str(e)}")


@router.post("/reset")
async def reset_preferences(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Reset AI preferences to defaults.

    Restores user's AI settings to default values.
    """
    try:
        preferences = db.query(AIPreference).filter(
            AIPreference.user_id == current_user.id
        ).first()

        if preferences:
            # Get available providers
            llm_service = get_llm_service()
            available = llm_service.get_available_providers()

            # Reset to defaults
            preferences.enabled_providers = [p.value for p in available]
            preferences.default_provider = available[0].value if available else None
            preferences.mix_providers = False
            preferences.provider_settings = {}
            preferences.temperature = 0.7
            preferences.max_tokens = 4000

            db.commit()

        return {
            "success": True,
            "message": "AI preferences reset to defaults"
        }

    except Exception as e:
        logger.error(f"Error resetting preferences: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to reset preferences")
