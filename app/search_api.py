"""
Search API endpoints for full-text search functionality.

Provides comprehensive search capabilities with filtering, faceting,
highlighting, and advanced search features.
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .auth import get_current_active_user
from .database import get_db
from .models import User
from .search_service import get_search_service

logger = logging.getLogger(__name__)

router = APIRouter()

# Request/Response models
class SearchRequest(BaseModel):
    query: str = Field(..., description="Search query string")
    filters: Optional[Dict[str, Any]] = Field(None, description="Search filters")
    sort_by: str = Field("relevance", description="Sort field")
    sort_order: str = Field("desc", description="Sort order (asc/desc)")
    page: int = Field(1, description="Page number", ge=1)
    page_size: int = Field(20, description="Results per page", ge=1, le=100)
    include_facets: bool = Field(True, description="Include facet information")

class SearchResponse(BaseModel):
    query: str
    total_results: int
    page: int
    page_size: int
    total_pages: int
    results: List[Dict[str, Any]]
    facets: Dict[str, Any]
    search_time: str
    error: Optional[str] = None

class SuggestionResponse(BaseModel):
    suggestions: List[str]
    query: str

class PopularSearchesResponse(BaseModel):
    terms: List[Dict[str, Any]]

@router.post("/search", response_model=SearchResponse)
async def search_works(
    search_request: SearchRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> SearchResponse:
    """
    Perform advanced search across works.

    Supports full-text search with filtering, sorting, and faceting.
    """
    try:
        search_service = get_search_service()

        result = search_service.search_works(
            query=search_request.query,
            user_id=current_user.id,
            filters=search_request.filters,
            sort_by=search_request.sort_by,
            sort_order=search_request.sort_order,
            page=search_request.page,
            page_size=search_request.page_size,
            include_facets=search_request.include_facets
        )

        return SearchResponse(**result)

    except Exception as e:
        logger.error(f"Error performing search: {e}")
        raise HTTPException(status_code=500, detail="Search failed")

@router.get("/search")
async def search_works_get(
    q: str = Query(..., description="Search query"),
    media_type: Optional[str] = Query(None, description="Filter by media type"),
    language: Optional[str] = Query(None, description="Filter by language"),
    year_min: Optional[int] = Query(None, description="Minimum publication year"),
    year_max: Optional[int] = Query(None, description="Maximum publication year"),
    trend_score_min: Optional[float] = Query(None, description="Minimum trend score"),
    sort_by: str = Query("relevance", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order"),
    page: int = Query(1, description="Page number", ge=1),
    page_size: int = Query(20, description="Results per page", ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> SearchResponse:
    """
    Perform search using GET request (for simple queries).

    Supports basic search parameters via query string.
    """
    try:
        # Build filters
        filters = {}
        if media_type:
            filters["media_type"] = media_type
        if language:
            filters["language"] = language
        if year_min or year_max:
            filters["public_domain_year"] = {"min": year_min, "max": year_max}
        if trend_score_min:
            filters["trend_score"] = {"min": trend_score_min}

        search_service = get_search_service()

        result = search_service.search_works(
            query=q,
            user_id=current_user.id,
            filters=filters,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            page_size=page_size,
            include_facets=True
        )

        return SearchResponse(**result)

    except Exception as e:
        logger.error(f"Error performing GET search: {e}")
        raise HTTPException(status_code=500, detail="Search failed")

@router.get("/suggestions")
async def get_search_suggestions(
    q: str = Query(..., description="Search query prefix"),
    limit: int = Query(10, description="Maximum suggestions", ge=1, le=20),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> SuggestionResponse:
    """
    Get search suggestions based on query prefix.

    Returns autocomplete suggestions for search queries.
    """
    try:
        search_service = get_search_service()
        suggestions = search_service.get_search_suggestions(q, limit)

        return SuggestionResponse(suggestions=suggestions, query=q)

    except Exception as e:
        logger.error(f"Error getting search suggestions: {e}")
        raise HTTPException(status_code=500, detail="Failed to get suggestions")

@router.get("/popular")
async def get_popular_searches(
    limit: int = Query(10, description="Number of popular terms", ge=1, le=50),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> PopularSearchesResponse:
    """
    Get popular search terms.

    Returns trending and frequently searched terms.
    """
    try:
        search_service = get_search_service()
        terms = search_service.get_popular_searches(limit)

        return PopularSearchesResponse(terms=terms)

    except Exception as e:
        logger.error(f"Error getting popular searches: {e}")
        raise HTTPException(status_code=500, detail="Failed to get popular searches")

@router.post("/index/{work_id}")
async def index_work(
    work_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Index a specific work for search.

    Triggers re-indexing of a work's content and metadata.
    """
    try:
        search_service = get_search_service()
        success = search_service.index_work(work_id)

        if success:
            return {
                "message": "Work indexed successfully",
                "work_id": work_id,
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            raise HTTPException(status_code=404, detail="Work not found")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error indexing work {work_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to index work")

@router.post("/reindex")
async def reindex_all(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Reindex all works for search (admin function).

    Triggers complete re-indexing of all works in the system.
    """
    try:
        search_service = get_search_service()

        # Get all work IDs
        works = db.query(Work.id).filter(Work.user_id == current_user.id).all()
        work_ids = [work.id for work in works]

        # Index each work
        indexed_count = 0
        for work_id in work_ids:
            if search_service.index_work(work_id):
                indexed_count += 1

        return {
            "message": "Reindexing completed",
            "total_works": len(work_ids),
            "indexed_works": indexed_count,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error reindexing works: {e}")
        raise HTTPException(status_code=500, detail="Failed to reindex works")

@router.get("/stats")
async def get_search_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get search system statistics.

    Returns information about search index and performance.
    """
    try:
        # Get basic statistics
        total_works = db.query(func.count(Work.id)).scalar() or 0
        works_with_content = db.query(func.count(Work.id)).filter(
            Work.metadata.has_key('content')
        ).scalar() or 0

        works_with_descriptions = db.query(func.count(Work.id)).filter(
            Work.metadata.has_key('description')
        ).scalar() or 0

        # Get popular search terms
        search_service = get_search_service()
        popular_terms = search_service.get_popular_searches(5)

        return {
            "total_works": total_works,
            "searchable_works": works_with_content + works_with_descriptions,
            "works_with_content": works_with_content,
            "works_with_descriptions": works_with_descriptions,
            "search_coverage": round(
                ((works_with_content + works_with_descriptions) / max(total_works, 1)) * 100, 1
            ),
            "popular_search_terms": popular_terms,
            "last_updated": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error getting search stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get search statistics")

# Import required modules
from app.models import User, Work
import json
