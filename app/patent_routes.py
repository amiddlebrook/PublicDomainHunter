"""
Patent API Routes

REST API endpoints for patent search, discovery, and analysis.
Implements pay-per-use pricing model via API credits.
"""

from fastapi import APIRouter, HTTPException, Query, Depends, Header
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
import logging

from .patent_api import PatentAggregator, CPC_SECTIONS
from .auth import get_current_active_user
from .models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/patents", tags=["patents"])

# Global patent aggregator instance
_aggregator: Optional[PatentAggregator] = None


def get_patent_aggregator() -> PatentAggregator:
    """Get or create patent aggregator instance."""
    global _aggregator
    if _aggregator is None:
        _aggregator = PatentAggregator(
            uspto_enabled=True,
            google_enabled=False,  # Enable when configured
            lens_api_key=None,  # Set from environment
        )
    return _aggregator


# ============================================================================
# Request/Response Models
# ============================================================================

class PatentSearchRequest(BaseModel):
    query: str = Field(..., min_length=2, description="Search query")
    expired_only: bool = Field(True, description="Only return expired/public domain patents")
    limit: int = Field(50, ge=1, le=500, description="Max results to return")
    offset: int = Field(0, ge=0, description="Pagination offset")
    cpc_section: Optional[str] = Field(None, description="Filter by CPC section (A-H, Y)")
    year_start: Optional[int] = Field(None, description="Grant year range start")
    year_end: Optional[int] = Field(None, description="Grant year range end")


class PatentResponse(BaseModel):
    patent_number: str
    title: str
    abstract: Optional[str]
    patent_type: str
    status: str
    filing_date: Optional[str]
    grant_date: Optional[str]
    expiration_date: Optional[str]
    inventors: List[dict]
    assignee: Optional[str]
    cpc_codes: List[str]
    claims_count: int
    cited_by_count: int
    source: str
    source_url: Optional[str]


class PatentSearchResponse(BaseModel):
    results: List[PatentResponse]
    total: int
    query: str
    sources_queried: List[str]
    errors: List[dict]
    api_credits_used: int = 1


class CPCSectionInfo(BaseModel):
    code: str
    name: str
    description: str


class ExpiringPatentsResponse(BaseModel):
    results: List[PatentResponse]
    total: int
    period_months: int
    api_credits_used: int = 1


# ============================================================================
# API Endpoints
# ============================================================================

@router.get("/search", response_model=PatentSearchResponse)
async def search_patents(
    q: str = Query(..., min_length=2, description="Search query"),
    expired_only: bool = Query(True, description="Only expired/public domain patents"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    cpc_section: Optional[str] = Query(None, regex="^[A-HY]$"),
    year_start: Optional[int] = Query(None, ge=1790, le=2030),
    year_end: Optional[int] = Query(None, ge=1790, le=2030),
    # current_user: User = Depends(get_current_active_user),  # Enable for auth
):
    """
    Search for patents across USPTO and other sources.

    **API Credits:** 1 credit per search

    Returns expired/public domain patents by default. Set `expired_only=false`
    to include active patents (useful for competitive analysis).

    **CPC Sections:**
    - A: Human Necessities (Agriculture, Food, Health)
    - B: Performing Operations; Transporting
    - C: Chemistry; Metallurgy
    - D: Textiles; Paper
    - E: Fixed Constructions
    - F: Mechanical Engineering
    - G: Physics (Computing, Instruments)
    - H: Electricity
    """
    aggregator = get_patent_aggregator()

    try:
        results = await aggregator.search(
            query=q,
            expired_only=expired_only,
            limit=limit,
            sources=["uspto"],  # Can expand to multiple sources
        )

        return PatentSearchResponse(
            results=results["results"],
            total=results["total"],
            query=q,
            sources_queried=results["sources_queried"],
            errors=results.get("errors", []),
            api_credits_used=1,
        )

    except Exception as e:
        logger.error(f"Patent search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/expiring", response_model=ExpiringPatentsResponse)
async def get_expiring_patents(
    months: int = Query(12, ge=1, le=36, description="Months until expiration"),
    limit: int = Query(100, ge=1, le=500),
    cpc_section: Optional[str] = Query(None, regex="^[A-HY]$"),
):
    """
    Get patents expiring soon (entering public domain).

    **API Credits:** 1 credit

    These patents are about to become free to use - a goldmine for
    entrepreneurs and manufacturers.

    **Use Cases:**
    - Find technologies about to become freely available
    - Plan product launches around patent expirations
    - Identify manufacturing opportunities
    """
    aggregator = get_patent_aggregator()

    try:
        results = await aggregator.get_expiring_patents(months=months, limit=limit)

        return ExpiringPatentsResponse(
            results=results["results"],
            total=results["total"],
            period_months=months,
            api_credits_used=1,
        )

    except Exception as e:
        logger.error(f"Expiring patents error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/by-classification/{cpc_code}")
async def get_patents_by_classification(
    cpc_code: str,
    expired_only: bool = Query(True),
    limit: int = Query(50, ge=1, le=500),
):
    """
    Get patents by CPC (Cooperative Patent Classification) code.

    **API Credits:** 1 credit

    **Example CPC Codes:**
    - A47J: Kitchen equipment (coffee makers, cookware)
    - B60K: Vehicle propulsion
    - G06F: Digital computing
    - H01L: Semiconductor devices

    The CPC hierarchy: Section > Class > Subclass > Group > Subgroup
    Example: H01L21/67 = H (Electricity) > 01 (Basic Electric Elements) > L (Semiconductors) > 21 (Processes) > 67 (Apparatus)
    """
    aggregator = get_patent_aggregator()

    try:
        results = await aggregator.get_by_classification(
            cpc_code=cpc_code.upper(),
            expired_only=expired_only,
            limit=limit,
        )

        return {
            **results,
            "api_credits_used": 1,
        }

    except Exception as e:
        logger.error(f"Classification search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/patent/{patent_number}")
async def get_patent_details(patent_number: str):
    """
    Get detailed information about a specific patent.

    **API Credits:** 1 credit

    Returns full patent details including:
    - Title, abstract, and description
    - Claims (independent and dependent)
    - Inventors and assignees
    - Citations (cited and cited-by)
    - CPC/IPC classifications
    - Drawing URLs
    """
    aggregator = get_patent_aggregator()

    try:
        # Search for the specific patent
        results = await aggregator.search(
            query=patent_number,
            expired_only=False,
            limit=1,
        )

        if not results["results"]:
            raise HTTPException(status_code=404, detail=f"Patent {patent_number} not found")

        return {
            "patent": results["results"][0],
            "api_credits_used": 1,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Patent details error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/classifications")
async def get_cpc_classifications():
    """
    Get CPC classification sections.

    **API Credits:** 0 (free)

    Returns the top-level CPC sections for browsing patents by technology area.
    """
    return {
        "sections": [
            CPCSectionInfo(code=code, name=name.split("(")[0].strip(), description=name)
            for code, name in CPC_SECTIONS.items()
        ],
        "api_credits_used": 0,
    }


@router.get("/entering-public-domain/{year}")
async def get_entering_public_domain(
    year: int,
    limit: int = Query(100, ge=1, le=500),
):
    """
    Get patents entering public domain in a specific year.

    **API Credits:** 1 credit

    **How it works:**
    - Utility patents expire 20 years from filing date
    - Design patents expire 15 years from grant date
    - Patents granted in year X-20 enter public domain in year X

    **Example:**
    - `/entering-public-domain/2026` returns patents filed around 2006
    """
    aggregator = get_patent_aggregator()

    # Calculate approximate filing year
    filing_year = year - 20

    try:
        results = await aggregator.search(
            query="*",  # All patents
            expired_only=False,
            limit=limit,
        )

        # Filter to patents entering PD in target year
        filtered_results = []
        for patent in results["results"]:
            exp_date = patent.get("expiration_date")
            if exp_date:
                exp_year = int(exp_date[:4])
                if exp_year == year:
                    filtered_results.append(patent)

        return {
            "results": filtered_results[:limit],
            "total": len(filtered_results),
            "year": year,
            "filing_year_approx": filing_year,
            "api_credits_used": 1,
        }

    except Exception as e:
        logger.error(f"Public domain entry error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze")
async def analyze_patent(
    patent_number: str,
    include_similar: bool = Query(True),
    include_citations: bool = Query(True),
):
    """
    AI-powered patent analysis for monetization potential.

    **API Credits:** 5 credits

    Returns:
    - Manufacturing viability score
    - Market demand signals
    - Similar/related patents
    - Suggested commercialization strategies
    - Technology readiness level (TRL)
    """
    # TODO: Implement AI analysis integration
    return {
        "patent_number": patent_number,
        "analysis": {
            "manufacturing_viability": 72,
            "market_demand_score": 65,
            "technology_readiness_level": 7,
            "competitive_landscape": "moderate",
            "suggested_strategies": [
                "Direct manufacturing for niche market",
                "License to existing manufacturers",
                "Create educational content",
            ],
            "risks": [
                "May require specialized tooling",
                "Some dependent patents may still be active",
            ],
        },
        "api_credits_used": 5,
        "note": "Full AI analysis coming soon",
    }


@router.get("/stats")
async def get_patent_stats():
    """
    Get patent database statistics.

    **API Credits:** 0 (free)
    """
    return {
        "total_patents_indexed": "20,000,000+",
        "expired_patents": "18,000,000+",
        "expiring_this_year": "~400,000",
        "data_sources": ["USPTO PatentsView", "Google Patents (coming soon)", "Lens.org (coming soon)"],
        "last_updated": datetime.now().isoformat(),
        "coverage": {
            "start_year": 1976,
            "end_year": datetime.now().year,
            "jurisdictions": ["US"],
            "planned_jurisdictions": ["EP", "WO", "CN", "JP"],
        },
        "api_credits_used": 0,
    }


# ============================================================================
# API Pricing Info
# ============================================================================

@router.get("/pricing")
async def get_api_pricing():
    """
    Get API pricing information.

    **Pay-per-use model - no subscriptions!**
    """
    return {
        "model": "pay-per-use",
        "currency": "USD",
        "credit_packs": [
            {"credits": 100, "price": 5.00, "per_credit": 0.05},
            {"credits": 500, "price": 20.00, "per_credit": 0.04},
            {"credits": 2000, "price": 60.00, "per_credit": 0.03},
            {"credits": 10000, "price": 200.00, "per_credit": 0.02},
        ],
        "endpoint_costs": {
            "/search": 1,
            "/expiring": 1,
            "/by-classification": 1,
            "/patent/{number}": 1,
            "/entering-public-domain": 1,
            "/analyze": 5,
            "/classifications": 0,
            "/stats": 0,
            "/pricing": 0,
        },
        "free_tier": {
            "credits_per_month": 50,
            "description": "Get 50 free credits every month to try the API",
        },
        "bulk_access": {
            "description": "Need bulk data access? Contact us for custom pricing.",
            "contact": "api@publicdomainhunter.com",
        },
    }
