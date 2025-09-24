"""
API routes for Public Domain Hunter.

Contains all the REST API endpoints for the application.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from datetime import datetime
import logging

from app.database import get_db
from app.models import Work, WorkMetric, User, Alert
from app.schemas import (
    WorkCreate, WorkResponse, WorkUpdate,
    WorkMetricResponse, SearchResponse,
    AlertCreate, AlertResponse
)

logger = logging.getLogger(__name__)

router = APIRouter()

# Works endpoints
@router.get("/works", response_model=List[WorkResponse])
async def get_works(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    media_type: Optional[str] = None,
    author: Optional[str] = None,
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get all public domain works with optional filtering."""
    query = db.query(Work).filter(Work.status == "active")

    if media_type:
        query = query.filter(Work.media_type == media_type)
    if author:
        query = query.filter(Work.author.ilike(f"%{author}%"))
    if year_from:
        query = query.filter(Work.public_domain_year >= year_from)
    if year_to:
        query = query.filter(Work.public_domain_year <= year_to)

    works = query.order_by(desc(Work.created_at)).offset(skip).limit(limit).all()
    return works

@router.get("/works/{work_id}", response_model=WorkResponse)
async def get_work(work_id: int, db: Session = Depends(get_db)):
    """Get a specific work by ID."""
    work = db.query(Work).filter(Work.id == work_id, Work.status == "active").first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    return work

@router.post("/works", response_model=WorkResponse, status_code=status.HTTP_201_CREATED)
async def create_work(work: WorkCreate, db: Session = Depends(get_db)):
    """Create a new public domain work."""
    # Check if work already exists
    existing = db.query(Work).filter(
        Work.title == work.title,
        Work.author == work.author
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Work already exists")

    db_work = Work(**work.dict())
    db.add(db_work)
    db.commit()
    db.refresh(db_work)

    logger.info(f"Created new work: {db_work.title}")
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

# Search endpoint
@router.get("/search", response_model=SearchResponse)
async def search_works(
    query: str = Query(..., min_length=1),
    media_type: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Search for public domain works."""
    search_query = db.query(Work).filter(Work.status == "active")

    # Simple text search on title and author
    search_query = search_query.filter(
        (Work.title.ilike(f"%{query}%")) |
        (Work.author.ilike(f"%{query}%")) |
        (Work.description.ilike(f"%{query}%"))
    )

    if media_type:
        search_query = search_query.filter(Work.media_type == media_type)

    works = search_query.limit(limit).all()
    total = len(works)

    return SearchResponse(
        query=query,
        total_results=total,
        works=works
    )

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

# Alerts endpoints
@router.post("/alerts", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(alert: AlertCreate, db: Session = Depends(get_db)):
    """Create a new alert for a user."""
    # TODO: Add user authentication
    # For now, create alert without user association

    db_alert = Alert(**alert.dict())
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)

    logger.info(f"Created new alert for work {alert.work_id}")
    return db_alert

@router.get("/alerts", response_model=List[AlertResponse])
async def get_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get all alerts."""
    alerts = db.query(Alert).filter(Alert.is_active == True).offset(skip).limit(limit).all()
    return alerts
