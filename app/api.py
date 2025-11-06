"""
API routes for Public Domain Hunter.

Contains all the REST API endpoints for the application.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, and_
from typing import List, Optional
from datetime import datetime, timedelta
import logging

from app.database import get_db
from app.models import Work, WorkMetric, User, Alert
from app.schemas import (
    WorkCreate, WorkResponse, WorkUpdate,
    WorkMetricResponse, SearchResponse,
    AlertCreate, AlertResponse, TrendData, CompetitionAnalysis
)
from app.auth import get_current_active_user, get_current_active_superuser
from app.trends_service import get_trends_service
from app.amazon_service import get_amazon_service
from app.background_tasks import analyze_work_background, refresh_metrics_background

logger = logging.getLogger(__name__)

router = APIRouter()

# Services
trends_service = get_trends_service()
amazon_service = get_amazon_service()

# Works endpoints
@router.get("/works", response_model=List[WorkResponse])
async def get_works(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    media_type: Optional[str] = None,
    author: Optional[str] = None,
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
    sort_by: str = Query("created_at", regex="^(created_at|title|author|public_domain_year)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all public domain works with optional filtering and sorting."""
    query = db.query(Work).filter(Work.status == "active")

    if media_type:
        query = query.filter(Work.media_type == media_type)
    if author:
        query = query.filter(Work.author.ilike(f"%{author}%"))
    if year_from:
        query = query.filter(Work.public_domain_year >= year_from)
    if year_to:
        query = query.filter(Work.public_domain_year <= year_to)

    # Sorting
    sort_column = getattr(Work, sort_by)
    if sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(sort_column)

    works = query.offset(skip).limit(limit).all()
    return works

@router.get("/works/{work_id}", response_model=WorkResponse)
async def get_work(work_id: int, db: Session = Depends(get_db)):
    """Get a specific work by ID with full details."""
    work = db.query(Work).filter(Work.id == work_id, Work.status == "active").first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    return work

@router.post("/works", response_model=WorkResponse, status_code=status.HTTP_201_CREATED)
async def create_work(
    work: WorkCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new public domain work with automatic trend analysis."""
    # Check if work already exists
    existing = db.query(Work).filter(
        and_(
            Work.title == work.title,
            Work.author == work.author
        )
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Work already exists")

    # Create the work
    db_work = Work(**work.dict(), user_id=current_user.id)
    db.add(db_work)
    db.commit()
    db.refresh(db_work)

    # Trigger background analysis
    try:
        analyze_work_background(db_work.id, db)
    except Exception as e:
        logger.error(f"Background analysis failed for work {db_work.id}: {e}")
        # Don't fail the request if background analysis fails

    logger.info(f"Created new work: {db_work.title} by user {current_user.username}")
    return db_work

@router.put("/works/{work_id}", response_model=WorkResponse)
async def update_work(work_id: int, work_update: WorkUpdate, db: Session = Depends(get_db)):
    """Update an existing work."""
    work = db.query(Work).filter(Work.id == work_id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")

    for field, value in work_update.dict(exclude_unset=True).items():
        setattr(work, field, value)

    work.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(work)

    logger.info(f"Updated work: {work.title}")
    return work

@router.delete("/works/{work_id}")
async def delete_work(work_id: int, db: Session = Depends(get_db)):
    """Soft delete a work."""
    work = db.query(Work).filter(Work.id == work_id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")

    work.status = "deleted"
    work.updated_at = datetime.utcnow()
    db.commit()

    logger.info(f"Deleted work: {work.title}")
    return {"message": "Work deleted successfully"}

# Search endpoint with enhanced functionality
@router.get("/search", response_model=SearchResponse)
async def search_works(
    query: str = Query(..., min_length=1),
    media_type: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    include_trends: bool = Query(True, description="Include trend analysis"),
    include_competition: bool = Query(False, description="Include competition analysis"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Advanced search for public domain works with optional analytics."""
    search_query = db.query(Work).filter(Work.status == "active")

    # Text search on title, author, and description
    search_filter = (
        (Work.title.ilike(f"%{query}%")) |
        (Work.author.ilike(f"%{query}%")) |
        (Work.description.ilike(f"%{query}%"))
    )
    search_query = search_query.filter(search_filter)

    if media_type:
        search_query = search_query.filter(Work.media_type == media_type)

    works = search_query.limit(limit).all()
    total = len(works)

    # Enhance results with trend data if requested
    if include_trends and works:
        for work in works:
            if work.title:
                # Get trend score
                trend_score = trends_service.get_trend_score(work.title, work.author or "")
                work.metadata = work.metadata or {}
                work.metadata['trend_score'] = trend_score

    return SearchResponse(
        query=query,
        total_results=total,
        works=works
    )

# Trend analysis endpoints
@router.get("/works/{work_id}/trends")
async def get_work_trends(
    work_id: int,
    timeframe: str = Query("today 12-m", description="Time frame for trend analysis"),
    db: Session = Depends(get_db)
):
    """Get trend analysis for a specific work."""
    work = db.query(Work).filter(Work.id == work_id, Work.status == "active").first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")

    # Get trend data
    keywords = [work.title]
    if work.author:
        keywords.append(f"{work.author} {work.title}")

    trend_data = trends_service.get_interest_over_time(keywords, timeframe)

    # Get related queries
    related_queries = trends_service.get_related_queries(work.title)

    return {
        "work_id": work_id,
        "work_title": work.title,
        "timeframe": timeframe,
        "trend_data": trend_data,
        "related_queries": related_queries,
        "trend_score": trends_service.get_trend_score(work.title, work.author)
    }

@router.get("/trends/analyze")
async def analyze_trends(
    keywords: str = Query(..., description="Keywords to analyze"),
    timeframe: str = Query("today 12-m")
):
    """Analyze trends for given keywords."""
    keyword_list = [k.strip() for k in keywords.split(",") if k.strip()]

    if not keyword_list:
        raise HTTPException(status_code=400, detail="At least one keyword required")

    trend_data = trends_service.get_interest_over_time(keyword_list, timeframe)
    related_queries = trends_service.get_related_queries(keyword_list[0])

    return {
        "keywords": keyword_list,
        "timeframe": timeframe,
        "trend_data": trend_data,
        "related_queries": related_queries
    }

# Competition analysis endpoints
@router.get("/works/{work_id}/competition")
async def get_work_competition(work_id: int, db: Session = Depends(get_db)):
    """Get competition analysis for a specific work."""
    work = db.query(Work).filter(Work.id == work_id, Work.status == "active").first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")

    competition_data = amazon_service.get_competition_data(work.title, work.author)

    return {
        "work_id": work_id,
        "work_title": work.title,
        "competition_analysis": competition_data
    }

@router.get("/competition/search")
async def search_competition(
    title: str = Query(..., description="Book title to search"),
    author: str = Query("", description="Book author")
):
    """Search for competing books on Amazon."""
    search_query = f"{author} {title}".strip() if author else title
    products = amazon_service.search_products(search_query, "Books")

    return {
        "search_query": search_query,
        "products": products,
        "total_results": len(products)
    }

# Metrics endpoints
@router.get("/works/{work_id}/metrics", response_model=List[WorkMetricResponse])
async def get_work_metrics(
    work_id: int,
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get metrics for a specific work."""
    work = db.query(Work).filter(Work.id == work_id, Work.status == "active").first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")

    metrics = db.query(WorkMetric).filter(
        WorkMetric.work_id == work_id
    ).order_by(desc(WorkMetric.metric_date)).limit(limit).all()

    return metrics

@router.post("/works/{work_id}/metrics/refresh")
async def refresh_work_metrics(work_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Trigger refresh of metrics for a work."""
    work = db.query(Work).filter(Work.id == work_id, Work.status == "active").first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")

    # Add background task to refresh metrics
    background_tasks.add_task(refresh_metrics_background, work_id, db)

    return {"message": "Metrics refresh initiated", "work_id": work_id}

# Alerts endpoints
@router.post("/alerts", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    alert: AlertCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new alert for a user."""
    work = db.query(Work).filter(Work.id == alert.work_id, Work.status == "active").first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")

    db_alert = Alert(**alert.dict(), user_id=current_user.id)
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)

    logger.info(f"Created new alert for work {alert.work_id} by user {current_user.username}")
    return db_alert

@router.get("/alerts", response_model=List[AlertResponse])
async def get_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all alerts for the current user."""
    alerts = db.query(Alert).filter(
        Alert.user_id == current_user.id,
        Alert.is_active == True
    ).offset(skip).limit(limit).all()
    return alerts

@router.delete("/alerts/{alert_id}")
async def delete_alert(
    alert_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete an alert."""
    alert = db.query(Alert).filter(
        Alert.id == alert_id,
        Alert.user_id == current_user.id
    ).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    db.delete(alert)
    db.commit()

    return {"message": "Alert deleted successfully"}

# Analytics dashboard endpoints
@router.get("/analytics/dashboard")
async def get_dashboard_analytics(db: Session = Depends(get_db)):
    """Get dashboard analytics data."""
    # Total works
    total_works = db.query(func.count(Work.id)).filter(Work.status == "active").scalar()

    # New works today
    today = datetime.now().date()
    new_works_today = db.query(func.count(Work.id)).filter(
        func.date(Work.created_at) == today,
        Work.status == "active"
    ).scalar()

    # Average trend score
    avg_trend = db.query(func.avg(WorkMetric.trend_score)).scalar() or 0

    # Top performing works
    top_works = db.query(Work).join(WorkMetric).filter(
        Work.status == "active"
    ).order_by(desc(WorkMetric.trend_score)).limit(5).all()

    return {
        "total_works": total_works,
        "new_works_today": new_works_today,
        "average_trend_score": float(avg_trend),
        "top_performing_works": top_works
    }
