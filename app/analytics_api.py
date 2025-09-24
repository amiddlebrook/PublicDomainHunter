"""
Advanced analytics API endpoints.

Provides comprehensive analytics data for dashboards, charts,
and business intelligence insights.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import logging

from app.database import get_db
from app.auth import get_current_active_user
from app.analytics_service import get_analytics_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_analytics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get comprehensive dashboard analytics.

    Returns all data needed for the main analytics dashboard including
    metrics, charts, and insights.
    """
    try:
        analytics_service = get_analytics_service()
        analytics_data = analytics_service.get_dashboard_analytics(current_user.id)

        if "error" in analytics_data:
            raise HTTPException(status_code=500, detail=analytics_data["error"])

        return analytics_data

    except Exception as e:
        logger.error(f"Error generating dashboard analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate analytics")

@router.get("/dashboard/overview")
async def get_dashboard_overview(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get dashboard overview metrics.

    Returns key performance indicators and summary statistics.
    """
    try:
        analytics_service = get_analytics_service()
        analytics_data = analytics_service.get_dashboard_analytics(current_user.id)

        return analytics_data.get("overview", {})

    except Exception as e:
        logger.error(f"Error generating dashboard overview: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate overview")

@router.get("/dashboard/charts/time-series")
async def get_time_series_data(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get time series chart data.

    Returns historical data for trend analysis and forecasting.
    """
    try:
        analytics_service = get_analytics_service()
        analytics_data = analytics_service.get_dashboard_analytics(current_user.id)

        return analytics_data.get("time_series", {})

    except Exception as e:
        logger.error(f"Error generating time series data: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate time series data")

@router.get("/dashboard/charts/breakdowns")
async def get_breakdown_data(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get breakdown chart data.

    Returns categorical breakdowns for media types, years, languages, etc.
    """
    try:
        analytics_service = get_analytics_service()
        analytics_data = analytics_service.get_dashboard_analytics(current_user.id)

        return analytics_data.get("breakdowns", {})

    except Exception as e:
        logger.error(f"Error generating breakdown data: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate breakdown data")

@router.get("/dashboard/top-performers")
async def get_top_performers(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get top performers data.

    Returns lists of top trending works, authors, and categories.
    """
    try:
        analytics_service = get_analytics_service()
        analytics_data = analytics_service.get_dashboard_analytics(current_user.id)

        return analytics_data.get("top_performers", {})

    except Exception as e:
        logger.error(f"Error generating top performers data: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate top performers data")

@router.get("/dashboard/market-insights")
async def get_market_insights(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get market insights data.

    Returns market analysis, opportunities, and competition data.
    """
    try:
        analytics_service = get_analytics_service()
        analytics_data = analytics_service.get_dashboard_analytics(current_user.id)

        return analytics_data.get("market_insights", {})

    except Exception as e:
        logger.error(f"Error generating market insights: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate market insights")

@router.get("/user-analytics")
async def get_user_analytics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get user-specific analytics.

    Returns personalized analytics for the authenticated user.
    """
    try:
        analytics_service = get_analytics_service()
        user_analytics = analytics_service.get_user_analytics(current_user.id)

        if "error" in user_analytics:
            raise HTTPException(status_code=500, detail=user_analytics["error"])

        return user_analytics

    except Exception as e:
        logger.error(f"Error generating user analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate user analytics")

@router.get("/export/dashboard")
async def export_dashboard_data(
    format: str = "json",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Export dashboard analytics data.

    Args:
        format: Export format (json, csv, pdf - json supported for now)
        current_user: Authenticated user
        db: Database session

    Returns:
        Exported analytics data
    """
    try:
        analytics_service = get_analytics_service()
        analytics_data = analytics_service.get_dashboard_analytics(current_user.id)

        if format.lower() == "json":
            return {
                "export_format": "json",
                "export_timestamp": datetime.utcnow().isoformat(),
                "data": analytics_data
            }
        else:
            raise HTTPException(status_code=400, detail="Unsupported export format")

    except Exception as e:
        logger.error(f"Error exporting dashboard data: {e}")
        raise HTTPException(status_code=500, detail="Failed to export data")

@router.get("/insights/market-opportunities")
async def get_market_opportunities(
    limit: int = 20,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Get detailed market opportunities.

    Args:
        limit: Maximum number of opportunities to return
        current_user: Authenticated user
        db: Database session

    Returns:
        List of market opportunities with detailed analysis
    """
    try:
        analytics_service = get_analytics_service()
        analytics_data = analytics_service.get_dashboard_analytics(current_user.id)

        opportunities = analytics_data.get("market_insights", {}).get("opportunities", [])

        return opportunities[:limit]

    except Exception as e:
        logger.error(f"Error generating market opportunities: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate market opportunities")

@router.get("/insights/competition-analysis")
async def get_competition_analysis(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get detailed competition analysis.

    Returns comprehensive competition analysis and recommendations.
    """
    try:
        analytics_service = get_analytics_service()
        analytics_data = analytics_service.get_dashboard_analytics(current_user.id)

        return analytics_data.get("market_insights", {}).get("competition", {})

    except Exception as e:
        logger.error(f"Error generating competition analysis: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate competition analysis")

@router.get("/real-time/metrics")
async def get_real_time_metrics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get real-time metrics for live updating dashboards.

    Returns current metrics that should be updated frequently.
    """
    try:
        analytics_service = get_analytics_service()

        # Get current counts (these change frequently)
        current_metrics = {
            "total_works": analytics_service._get_total_works(current_user.id),
            "active_alerts": analytics_service._get_active_alerts(current_user.id),
            "works_today": analytics_service._get_works_this_month(current_user.id),  # Simplified for demo
            "last_updated": datetime.utcnow().isoformat()
        }

        return current_metrics

    except Exception as e:
        logger.error(f"Error generating real-time metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate real-time metrics")

# Import required modules
from datetime import datetime
