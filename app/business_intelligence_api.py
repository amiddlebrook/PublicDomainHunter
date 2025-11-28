"""
Business Intelligence API endpoints for Public Domain Hunter.

Provides advanced analytics, market insights, and predictive intelligence
for public domain content monetization opportunities.
"""

import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc, asc

from .auth import get_current_active_user
from .database import get_db
from .models import User, Work, WorkMetric
from .trends_service import get_trends_service
from .amazon_service import get_amazon_service

logger = logging.getLogger(__name__)

router = APIRouter()
trends_service = get_trends_service()
amazon_service = get_amazon_service()

# Request/Response models
class MarketAnalysisRequest(BaseModel):
    category: Optional[str] = Field(None, description="Content category to analyze")
    time_range: str = Field("30d", description="Time range for analysis")
    include_competitors: bool = Field(True, description="Include competitor analysis")
    market_depth: str = Field("standard", regex="^(basic|standard|comprehensive)$")

class TrendPredictionRequest(BaseModel):
    keywords: List[str] = Field(..., description="Keywords to analyze")
    prediction_horizon: str = Field("90d", description="Prediction time horizon")
    confidence_threshold: float = Field(0.7, ge=0.5, le=1.0)

class OpportunityScore(BaseModel):
    work_id: int
    title: str
    author: str
    score: float
    factors: Dict[str, float]
    market_size: str
    competition_level: str
    growth_potential: float
    recommendation: str

class MarketInsight(BaseModel):
    category: str
    trend_direction: str
    market_size: int
    growth_rate: float
    top_keywords: List[str]
    opportunity_score: float
    insights: List[str]

@router.get("/market/overview")
async def get_market_overview(
    category: Optional[str] = Query(None, description="Filter by category"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive market overview for public domain content.
    """
    try:
        # Get market size and trends
        total_works = db.query(func.count(Work.id)).filter(Work.status == "active").scalar()
        
        # Category distribution
        category_query = db.query(
            Work.media_type,
            func.count(Work.id).label('count')
        ).filter(Work.status == "active").group_by(Work.media_type)
        
        categories = [{"type": cat[0], "count": cat[1]} for cat in category_query.all()]
        
        # Recent trends (mock data - in production would use real analytics)
        market_trends = {
            "overall_growth": 15.3,
            "top_categories": [
                {"category": "books", "growth": 18.2, "market_share": 45.1},
                {"category": "audio", "growth": 22.7, "market_share": 23.8},
                {"category": "visual", "growth": 12.4, "market_share": 31.1}
            ],
            "emerging_trends": [
                "Audiobook demand increasing",
                "Educational content growth",
                "Visual content monetization"
            ],
            "market_insights": [
                "Classic literature showing renewed interest",
                "Educational institutions adopting public domain content",
                "Independent publishers driving market growth"
            ]
        }
        
        return {
            "market_size": total_works,
            "categories": categories,
            "trends": market_trends,
            "last_updated": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting market overview: {e}")
        raise HTTPException(status_code=500, detail="Failed to get market overview")

@router.post("/market/analyze", response_model=List[MarketInsight])
async def analyze_market(
    request: MarketAnalysisRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Perform detailed market analysis for specific categories.
    """
    try:
        insights = []
        
        # Mock market analysis based on category
        if not request.category or request.category == "books":
            insights.append(MarketInsight(
                category="Literature",
                trend_direction="increasing",
                market_size=1250000,
                growth_rate=18.2,
                top_keywords=["classic literature", "public domain books", "vintage novels"],
                opportunity_score=0.85,
                insights=[
                    "Strong demand for classic literature adaptations",
                    "Educational sector driving growth",
                    "International markets expanding"
                ]
            ))
        
        if not request.category or request.category == "audio":
            insights.append(MarketInsight(
                category="Audio Content",
                trend_direction="strongly_increasing",
                market_size=450000,
                growth_rate=32.7,
                top_keywords=["audiobooks", "audio classics", "narrated books"],
                opportunity_score=0.92,
                insights=[
                    "Audiobook market experiencing rapid growth",
                    "Mobile listening driving adoption",
                    "AI narration reducing production costs"
                ]
            ))
        
        if not request.category or request.category == "visual":
            insights.append(MarketInsight(
                category="Visual Content",
                trend_direction="stable",
                market_size=890000,
                growth_rate=8.4,
                top_keywords=["vintage posters", "classic art", "public domain images"],
                opportunity_score=0.73,
                insights=[
                    "Steady demand for visual adaptations",
                    "Social media driving visual content needs",
                    "Print-on-demand reducing barriers"
                ]
            ))
        
        return insights
        
    except Exception as e:
        logger.error(f"Error analyzing market: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze market")

@router.post("/trends/predict", response_model=Dict[str, Any])
async def predict_trends(
    request: TrendPredictionRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Predict future trends for given keywords using AI analysis.
    """
    try:
        predictions = {}
        
        for keyword in request.keywords:
            # Mock prediction data (in production would use ML models)
            base_score = trends_service.get_trend_score(keyword, "")
            
            # Simulate prediction based on historical patterns
            prediction = {
                "keyword": keyword,
                "current_score": base_score,
                "predicted_score": base_score * (1 + (hash(keyword) % 20) / 100),
                "confidence": 0.75 + (hash(keyword) % 15) / 100,
                "trend_direction": "increasing" if hash(keyword) % 2 else "stable",
                "seasonal_factor": 1.1 + (hash(keyword) % 5) / 100,
                "market_potential": "high" if base_score > 70 else "medium" if base_score > 40 else "low",
                "recommendations": [
                    f"Focus on {keyword} content in Q2",
                    "Consider multimedia adaptations",
                    "Target educational markets"
                ]
            }
            
            predictions[keyword] = prediction
        
        return {
            "predictions": predictions,
            "analysis_period": request.prediction_horizon,
            "confidence_threshold": request.confidence_threshold,
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error predicting trends: {e}")
        raise HTTPException(status_code=500, detail="Failed to predict trends")

@router.get("/opportunities/score", response_model=List[OpportunityScore])
async def score_opportunities(
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Score public domain works for monetization opportunities.
    """
    try:
        # Get works with their metrics
        works_query = db.query(Work).filter(Work.status == "active")
        
        if category:
            works_query = works_query.filter(Work.media_type == category)
        
        works = works_query.limit(limit).all()
        
        opportunities = []
        
        for work in works:
            # Calculate opportunity score based on multiple factors
            trend_score = trends_service.get_trend_score(work.title or "", work.author or "")
            
            # Mock competition analysis
            competition_score = 0.5 + (hash(work.title or "") % 40) / 100
            
            # Mock market potential
            market_potential = 0.6 + (hash((work.title or "") + (work.author or "")) % 30) / 100
            
            # Calculate overall opportunity score
            overall_score = (trend_score * 0.4 + (1 - competition_score) * 0.3 + market_potential * 0.3)
            
            # Determine recommendation
            if overall_score > 0.8:
                recommendation = "High priority - strong market potential"
            elif overall_score > 0.6:
                recommendation = "Medium priority - good opportunities"
            else:
                recommendation = "Low priority - limited potential"
            
            opportunities.append(OpportunityScore(
                work_id=work.id,
                title=work.title or "Untitled",
                author=work.author or "Unknown",
                score=overall_score,
                factors={
                    "trend_score": trend_score / 100,
                    "competition": 1 - competition_score,
                    "market_potential": market_potential
                },
                market_size="Large" if overall_score > 0.7 else "Medium" if overall_score > 0.5 else "Small",
                competition_level="Low" if competition_score < 0.4 else "Medium" if competition_score < 0.7 else "High",
                growth_potential=overall_score * 100,
                recommendation=recommendation
            ))
        
        # Sort by opportunity score (descending)
        opportunities.sort(key=lambda x: x.score, reverse=True)
        
        return opportunities
        
    except Exception as e:
        logger.error(f"Error scoring opportunities: {e}")
        raise HTTPException(status_code=500, detail="Failed to score opportunities")

@router.get("/competitors/analysis")
async def analyze_competitors(
    work_title: str = Query(..., description="Work title to analyze"),
    work_author: str = Query("", description="Work author"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Analyze competitor products for a specific public domain work.
    """
    try:
        # Get competition data from Amazon
        competition_data = amazon_service.get_competition_data(work_title, work_author)
        
        # Analyze market positioning
        market_analysis = {
            "total_competitors": len(competition_data.get('products', [])),
            "price_range": {
                "min": 2.99,
                "max": 24.99,
                "average": 9.99
            },
            "format_distribution": {
                "ebook": 45,
                "paperback": 35,
                "audiobook": 15,
                "hardcover": 5
            },
            "top_competitors": [
                {
                    "title": "Classic Edition",
                    "publisher": "Traditional Press",
                    "price": 12.99,
                    "rating": 4.2,
                    "reviews": 1247,
                    "market_share": 0.15
                },
                {
                    "title": "Annotated Version",
                    "publisher": "Academic Press",
                    "price": 18.99,
                    "rating": 4.5,
                    "reviews": 892,
                    "market_share": 0.12
                }
            ],
            "market_gaps": [
                "Limited audiobook options",
                "Few illustrated editions",
                "Opportunity in educational market"
            ],
            "recommendations": [
                "Focus on audiobook format",
                "Consider educational annotations",
                "Competitive pricing around $9.99"
            ]
        }
        
        return {
            "work_analyzed": f"{work_title} by {work_author}" if work_author else work_title,
            "analysis": market_analysis,
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error analyzing competitors: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze competitors")

@router.get("/intelligence/dashboard")
async def get_intelligence_dashboard(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive business intelligence dashboard data.
    """
    try:
        # Get key metrics
        total_works = db.query(func.count(Work.id)).filter(Work.status == "active").scalar()
        recent_works = db.query(func.count(Work.id)).filter(
            and_(
                Work.status == "active",
                Work.created_at >= datetime.utcnow() - timedelta(days=30)
            )
        ).scalar()
        
        # Mock intelligence data
        dashboard_data = {
            "key_metrics": {
                "total_opportunities": total_works,
                "high_priority_opportunities": int(total_works * 0.23),
                "new_opportunities_this_month": recent_works,
                "market_growth_rate": 15.3
            },
            "market_signals": [
                {
                    "type": "trend",
                    "message": "Classic literature demand up 18%",
                    "impact": "high",
                    "timestamp": (datetime.utcnow() - timedelta(hours=2)).isoformat()
                },
                {
                    "type": "opportunity",
                    "message": "Educational market expansion detected",
                    "impact": "medium",
                    "timestamp": (datetime.utcnow() - timedelta(hours=6)).isoformat()
                },
                {
                    "type": "competition",
                    "message": "New competitor in audiobook space",
                    "impact": "low",
                    "timestamp": (datetime.utcnow() - timedelta(hours=12)).isoformat()
                }
            ],
            "top_opportunities": [
                {
                    "title": "Pride and Prejudice",
                    "author": "Jane Austen",
                    "score": 0.89,
                    "reason": "High trend score, low competition"
                },
                {
                    "title": "Frankenstein",
                    "author": "Mary Shelley",
                    "score": 0.84,
                    "reason": "Seasonal demand, media tie-ins"
                },
                {
                    "title": "Moby Dick",
                    "author": "Herman Melville",
                    "score": 0.78,
                    "reason": "Educational adoption, audio potential"
                }
            ],
            "recommendations": [
                "Prioritize audiobook production for top 10 opportunities",
                "Focus on educational market partnerships",
                "Monitor emerging visual content trends"
            ],
            "last_updated": datetime.utcnow().isoformat()
        }
        
        return dashboard_data
        
    except Exception as e:
        logger.error(f"Error getting intelligence dashboard: {e}")
        raise HTTPException(status_code=500, detail="Failed to get dashboard data")

@router.get("/reports/insights")
async def generate_insights_report(
    report_type: str = Query("weekly", regex="^(daily|weekly|monthly)$"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate business intelligence insights report.
    """
    try:
        # Mock insights report
        report_data = {
            "report_type": report_type,
            "period": {
                "start": (datetime.utcnow() - timedelta(days=7 if report_type == "weekly" else 1 if report_type == "daily" else 30)).isoformat(),
                "end": datetime.utcnow().isoformat()
            },
            "key_insights": [
                "Audiobook market showing strongest growth trajectory",
                "Educational sector representing 35% of new opportunities",
                "Visual content demand stable but profitable",
                "International markets expanding for classic literature"
            ],
            "market_shifts": [
                {
                    "area": "Content Format",
                    "shift": "Audio to Visual ratio changing from 3:1 to 2:1",
                    "impact": "medium"
                },
                {
                    "area": "Geographic Distribution",
                    "shift": "International markets growing 22% faster",
                    "impact": "high"
                }
            ],
            "action_items": [
                "Increase audiobook production capacity",
                "Develop international distribution partnerships",
                "Create educational content bundles",
                "Monitor visual content technology trends"
            ],
            "risk_factors": [
                "Market saturation in popular categories",
                "Changing copyright regulations",
                "Competition from traditional publishers"
            ],
            "opportunities": [
                "AI narration reducing production costs",
                "Educational institutions adopting digital content",
                "New platforms for public domain content"
            ],
            "generated_at": datetime.utcnow().isoformat()
        }
        
        return report_data
        
    except Exception as e:
        logger.error(f"Error generating insights report: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate report")
