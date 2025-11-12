"""
AI Insights API endpoints for machine learning-powered content analysis and recommendations.

Provides RESTful endpoints for AI features including content recommendations,
topic analysis, content insights, and trend predictions.
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from .database import get_db
from .auth import get_current_active_user
from .ai_insights_service import get_ai_insights_service
from .models import User

logger = logging.getLogger(__name__)

router = APIRouter()

# Request/Response models
class RecommendationRequest(BaseModel):
    content_ids: Optional[List[int]] = Field(None, description="Content IDs to base recommendations on")
    limit: int = Field(10, description="Maximum recommendations", ge=1, le=50)
    include_metadata: bool = Field(True, description="Include detailed metadata")

class TopicAnalysisRequest(BaseModel):
    content_ids: Optional[List[int]] = Field(None, description="Specific content IDs to analyze")
    num_topics: int = Field(5, description="Number of topics to extract", ge=2, le=20)

class ContentInsightsRequest(BaseModel):
    work_id: int = Field(..., description="Work ID to analyze")

class TrendPredictionRequest(BaseModel):
    days_ahead: int = Field(30, description="Days ahead to predict", ge=1, le=365)

class RecommendationResponse(BaseModel):
    recommendations: List[Dict[str, Any]]
    total_found: int
    request_timestamp: str

class TopicAnalysisResponse(BaseModel):
    topics: List[Dict[str, Any]]
    work_topics: List[Dict[str, Any]]
    total_works: int
    analysis_timestamp: str
    error: Optional[str] = None

class ContentInsightsResponse(BaseModel):
    work_id: int
    title: str
    author: str
    basic_insights: Dict[str, Any]
    content_analysis: Dict[str, Any]
    recommendations: List[Dict[str, Any]]
    similar_works: List[Dict[str, Any]]
    error: Optional[str] = None

class TrendPredictionResponse(BaseModel):
    trend_predictions: Dict[str, Any]
    total_works_analyzed: int
    recent_works: int
    prediction_horizon_days: int
    analysis_timestamp: str
    error: Optional[str] = None

@router.post("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(
    request: RecommendationRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> RecommendationResponse:
    """
    Get AI-powered content recommendations for the user.

    Uses machine learning to recommend relevant content based on user preferences
    and content similarity.
    """
    try:
        ai_service = get_ai_insights_service()

        recommendations = ai_service.get_content_recommendations(
            user_id=current_user.id,
            content_ids=request.content_ids,
            limit=request.limit,
            include_metadata=request.include_metadata
        )

        return RecommendationResponse(
            recommendations=recommendations,
            total_found=len(recommendations),
            request_timestamp=datetime.utcnow().isoformat()
        )

    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        raise HTTPException(status_code=500, detail="Failed to get recommendations")

@router.get("/recommendations")
async def get_recommendations_get(
    content_ids: Optional[str] = Query(None, description="Comma-separated content IDs"),
    limit: int = Query(10, description="Maximum recommendations", ge=1, le=50),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> RecommendationResponse:
    """
    Get recommendations using GET request.

    Supports simple recommendation requests via query parameters.
    """
    try:
        # Parse content IDs if provided
        parsed_content_ids = None
        if content_ids:
            try:
                parsed_content_ids = [int(id.strip()) for id in content_ids.split(',')]
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid content IDs format")

        ai_service = get_ai_insights_service()

        recommendations = ai_service.get_content_recommendations(
            user_id=current_user.id,
            content_ids=parsed_content_ids,
            limit=limit,
            include_metadata=True
        )

        return RecommendationResponse(
            recommendations=recommendations,
            total_found=len(recommendations),
            request_timestamp=datetime.utcnow().isoformat()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        raise HTTPException(status_code=500, detail="Failed to get recommendations")

@router.post("/topics", response_model=TopicAnalysisResponse)
async def analyze_topics(
    request: TopicAnalysisRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> TopicAnalysisResponse:
    """
    Analyze content topics using topic modeling.

    Uses LDA (Latent Dirichlet Allocation) to extract topics from content.
    """
    try:
        ai_service = get_ai_insights_service()

        analysis = ai_service.analyze_content_topics(
            content_ids=request.content_ids,
            num_topics=request.num_topics
        )

        if "error" in analysis:
            raise HTTPException(status_code=400, detail=analysis["error"])

        return TopicAnalysisResponse(**analysis)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing topics: {e}")
        raise HTTPException(status_code=500, detail="Topic analysis failed")

@router.get("/topics")
async def analyze_topics_get(
    content_ids: Optional[str] = Query(None, description="Comma-separated content IDs"),
    num_topics: int = Query(5, description="Number of topics", ge=2, le=20),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> TopicAnalysisResponse:
    """
    Analyze topics using GET request.
    """
    try:
        # Parse content IDs if provided
        parsed_content_ids = None
        if content_ids:
            try:
                parsed_content_ids = [int(id.strip()) for id in content_ids.split(',')]
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid content IDs format")

        ai_service = get_ai_insights_service()

        analysis = ai_service.analyze_content_topics(
            content_ids=parsed_content_ids,
            num_topics=num_topics
        )

        if "error" in analysis:
            raise HTTPException(status_code=400, detail=analysis["error"])

        return TopicAnalysisResponse(**analysis)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing topics: {e}")
        raise HTTPException(status_code=500, detail="Topic analysis failed")

@router.post("/insights/{work_id}", response_model=ContentInsightsResponse)
async def get_content_insights(
    work_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> ContentInsightsResponse:
    """
    Get AI-powered insights for a specific work.

    Provides detailed analysis including content metrics, topic analysis,
    similar works, and recommendations.
    """
    try:
        ai_service = get_ai_insights_service()

        insights = ai_service.get_content_insights(work_id)

        if "error" in insights:
            raise HTTPException(status_code=404, detail=insights["error"])

        return ContentInsightsResponse(**insights)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting content insights: {e}")
        raise HTTPException(status_code=500, detail="Content analysis failed")

@router.post("/trends", response_model=TrendPredictionResponse)
async def get_trend_predictions(
    request: TrendPredictionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> TrendPredictionResponse:
    """
    Get trend predictions based on historical data.

    Uses machine learning to predict content trends and popularity patterns.
    """
    try:
        ai_service = get_ai_insights_service()

        predictions = ai_service.get_trend_predictions(
            days_ahead=request.days_ahead
        )

        if "error" in predictions:
            raise HTTPException(status_code=400, detail=predictions["error"])

        return TrendPredictionResponse(**predictions)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting trend predictions: {e}")
        raise HTTPException(status_code=500, detail="Trend prediction failed")

@router.get("/trends")
async def get_trend_predictions_get(
    days_ahead: int = Query(30, description="Days ahead to predict", ge=1, le=365),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> TrendPredictionResponse:
    """
    Get trend predictions using GET request.
    """
    try:
        ai_service = get_ai_insights_service()

        predictions = ai_service.get_trend_predictions(
            days_ahead=days_ahead
        )

        if "error" in predictions:
            raise HTTPException(status_code=400, detail=predictions["error"])

        return TrendPredictionResponse(**predictions)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting trend predictions: {e}")
        raise HTTPException(status_code=500, detail="Trend prediction failed")

@router.post("/train")
async def train_ai_models(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Train AI models on existing content (admin function).

    Triggers training of machine learning models for recommendations and analysis.
    """
    try:
        ai_service = get_ai_insights_service()

        success = ai_service.train_models()

        if success:
            return {
                "message": "AI models trained successfully",
                "timestamp": datetime.utcnow().isoformat(),
                "status": "success"
            }
        else:
            raise HTTPException(status_code=400, detail="Not enough content for training")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error training AI models: {e}")
        raise HTTPException(status_code=500, detail="Model training failed")

@router.get("/status")
async def get_ai_status(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get AI service status and capabilities.

    Returns information about AI model status, capabilities, and statistics.
    """
    try:
        ai_service = get_ai_insights_service()

        # Get basic statistics
        total_works = db.query(func.count(Work.id)).scalar() or 0
        works_with_content = db.query(func.count(Work.id)).filter(
            Work.metadata.has_key('content')
        ).scalar() or 0

        # Check model training status
        model_status = "trained" if ai_service.trained else "not_trained"

        capabilities = [
            "content_recommendations",
            "topic_modeling",
            "content_analysis",
            "similarity_detection",
            "trend_predictions"
        ]

        return {
            "service_status": "active",
            "model_status": model_status,
            "total_works": total_works,
            "trainable_works": works_with_content,
            "training_coverage": round((works_with_content / max(total_works, 1)) * 100, 1),
            "capabilities": capabilities,
            "supported_languages": ["en"],  # Currently English only
            "last_updated": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error getting AI status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get AI status")

# Import required modules
from app.models import User, Work, AIPreference
from app.llm_service import get_llm_service, AIProvider
from datetime import datetime
import json


# LLM-powered endpoints

class LLMAnalysisRequest(BaseModel):
    """Request model for LLM analysis."""
    work_id: int = Field(..., description="Work ID to analyze")
    analysis_type: str = Field("general", description="Type of analysis")
    providers: Optional[List[str]] = Field(None, description="Specific providers to use")


class LLMRecommendationRequest(BaseModel):
    """Request model for LLM recommendations."""
    limit: int = Field(10, description="Number of recommendations", ge=1, le=50)
    providers: Optional[List[str]] = Field(None, description="Specific providers to use")
    context: Optional[str] = Field(None, description="Additional context for recommendations")


@router.post("/llm/analyze")
async def llm_analyze_content(
    request: LLMAnalysisRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Analyze content using LLM providers.

    Uses configured LLM providers to provide AI-powered content analysis.
    """
    try:
        # Get work
        work = db.query(Work).filter(Work.id == request.work_id).first()
        if not work:
            raise HTTPException(status_code=404, detail="Work not found")

        # Get user preferences
        preferences = db.query(AIPreference).filter(
            AIPreference.user_id == current_user.id
        ).first()

        # Determine providers to use
        providers_to_use = None
        if request.providers:
            # User specified providers in request
            providers_to_use = [AIProvider(p) for p in request.providers]
        elif preferences and preferences.enabled_providers:
            # Use user's default providers
            if preferences.mix_providers:
                providers_to_use = [AIProvider(p) for p in preferences.enabled_providers]
            elif preferences.default_provider:
                providers_to_use = [AIProvider(preferences.default_provider)]

        # Get content to analyze
        metadata = work.metadata or {}
        content = metadata.get('content', '')
        if not content:
            content = f"Title: {work.title}\nAuthor: {work.author}\nDescription: {work.description or 'N/A'}"

        # Analyze with LLM
        llm_service = get_llm_service()
        analysis = await llm_service.analyze_content(
            content=content,
            analysis_type=request.analysis_type,
            providers=providers_to_use
        )

        return {
            "work_id": request.work_id,
            "title": work.title,
            "author": work.author,
            "analysis_type": request.analysis_type,
            "analysis": analysis,
            "timestamp": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in LLM content analysis: {e}")
        raise HTTPException(status_code=500, detail=f"LLM analysis failed: {str(e)}")


@router.post("/llm/recommendations")
async def llm_get_recommendations(
    request: LLMRecommendationRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get AI-powered recommendations using LLM providers.

    Uses LLMs to generate intelligent content recommendations.
    """
    try:
        # Get user preferences
        preferences = db.query(AIPreference).filter(
            AIPreference.user_id == current_user.id
        ).first()

        # Determine providers to use
        providers_to_use = None
        if request.providers:
            providers_to_use = [AIProvider(p) for p in request.providers]
        elif preferences and preferences.enabled_providers:
            if preferences.mix_providers:
                providers_to_use = [AIProvider(p) for p in preferences.enabled_providers]
            elif preferences.default_provider:
                providers_to_use = [AIProvider(preferences.default_provider)]

        # Get user's activity and preferences
        user_works = db.query(Work).filter(Work.user_id == current_user.id).limit(20).all()
        user_prefs = {
            "viewed_works": [
                {"id": w.id, "title": w.title, "author": w.author, "media_type": w.media_type}
                for w in user_works
            ],
            "context": request.context or "General content discovery"
        }

        # Get available content
        available_works = db.query(Work).filter(
            Work.status == "active"
        ).limit(100).all()

        available_content = [
            {
                "id": w.id,
                "title": w.title,
                "author": w.author,
                "media_type": w.media_type,
                "description": w.description,
                "public_domain_year": w.public_domain_year
            }
            for w in available_works
        ]

        # Get LLM recommendations
        llm_service = get_llm_service()
        recommendations = await llm_service.generate_recommendations(
            user_preferences=user_prefs,
            available_content=available_content,
            providers=providers_to_use,
            count=request.limit
        )

        return {
            "recommendations": recommendations,
            "user_id": current_user.id,
            "limit": request.limit,
            "timestamp": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in LLM recommendations: {e}")
        raise HTTPException(status_code=500, detail=f"LLM recommendations failed: {str(e)}")


@router.get("/llm/insights/{work_id}")
async def llm_get_work_insights(
    work_id: int,
    providers: Optional[str] = Query(None, description="Comma-separated provider names"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get comprehensive LLM-powered insights for a work.

    Combines multiple LLM analyses to provide deep insights.
    """
    try:
        # Parse providers
        provider_list = None
        if providers:
            provider_list = [AIProvider(p.strip()) for p in providers.split(',')]

        # Get work
        work = db.query(Work).filter(Work.id == work_id).first()
        if not work:
            raise HTTPException(status_code=404, detail="Work not found")

        # Get user preferences
        preferences = db.query(AIPreference).filter(
            AIPreference.user_id == current_user.id
        ).first()

        # Determine providers
        if not provider_list:
            if preferences and preferences.enabled_providers:
                if preferences.mix_providers:
                    provider_list = [AIProvider(p) for p in preferences.enabled_providers]
                elif preferences.default_provider:
                    provider_list = [AIProvider(preferences.default_provider)]

        # Get content
        metadata = work.metadata or {}
        content = metadata.get('content', '')
        if not content:
            content = f"Title: {work.title}\nAuthor: {work.author}\nDescription: {work.description or 'N/A'}"

        llm_service = get_llm_service()

        # Run multiple analyses in parallel
        import asyncio
        tasks = {
            "summary": llm_service.analyze_content(content, "summary", provider_list),
            "sentiment": llm_service.analyze_content(content, "sentiment", provider_list),
            "topics": llm_service.analyze_content(content, "topics", provider_list),
            "quality": llm_service.analyze_content(content, "quality", provider_list),
        }

        results = {}
        for name, task in tasks.items():
            try:
                results[name] = await task
            except Exception as e:
                logger.error(f"Error in {name} analysis: {e}")
                results[name] = {"error": str(e)}

        return {
            "work_id": work_id,
            "title": work.title,
            "author": work.author,
            "insights": results,
            "timestamp": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting LLM insights: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get insights: {str(e)}")
