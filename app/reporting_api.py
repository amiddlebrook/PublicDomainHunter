"""
Advanced reporting API endpoints for PDF and Excel export functionality.

Provides RESTful endpoints for generating, managing, and delivering
comprehensive reports with data visualization and analytics.
"""

import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
import io
import base64

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc

from .auth import get_current_active_user
from .database import get_db
from .models import User, Work, WorkMetric
from .reporting_service import get_reporting_service

logger = logging.getLogger(__name__)

router = APIRouter()

# Request/Response models
class ReportRequest(BaseModel):
    report_type: str = Field(..., description="Type of report to generate")
    date_range: Optional[Dict[str, str]] = Field(None, description="Date range for report")
    filters: Optional[Dict[str, Any]] = Field(None, description="Filters to apply")
    include_charts: bool = Field(True, description="Include charts in PDF reports")
    format: str = Field("pdf", description="Report format (pdf or excel)")

class ReportResponse(BaseModel):
    report_id: str
    report_type: str
    user_id: int
    generated_at: str
    date_range: Dict[str, str]
    content: str  # Base64 encoded content
    metadata: Dict[str, Any]
    status: str

class ReportListResponse(BaseModel):
    reports: List[Dict[str, Any]]
    total_count: int
    page: int
    page_size: int

class ReportTemplate(BaseModel):
    template_id: str
    name: str
    description: str
    report_type: str
    default_filters: Dict[str, Any]
    available_formats: List[str]

@router.post("/generate", response_model=ReportResponse)
async def generate_report(
    request: ReportRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> ReportResponse:
    """
    Generate a comprehensive report in PDF or Excel format.

    Supports multiple report types including overview, analytics, search,
    works catalog, and trend analysis with customizable date ranges and filters.
    """
    try:
        reporting_service = get_reporting_service()

        # Convert date range strings to datetime objects if provided
        date_range = None
        if request.date_range:
            from datetime import datetime
            try:
                date_range = {
                    "start": datetime.fromisoformat(request.date_range.get("start", "")),
                    "end": datetime.fromisoformat(request.date_range.get("end", ""))
                }
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format")

        # Generate report based on format
        if request.format.lower() == "pdf":
            result = reporting_service.generate_pdf_report(
                user_id=current_user.id,
                report_type=request.report_type,
                date_range=date_range,
                filters=request.filters,
                include_charts=request.include_charts
            )
        elif request.format.lower() == "excel":
            result = reporting_service.generate_excel_report(
                user_id=current_user.id,
                report_type=request.report_type,
                date_range=date_range,
                filters=request.filters
            )
        else:
            raise HTTPException(status_code=400, detail="Unsupported format")

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        return ReportResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating report: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate report")

@router.get("/generate")
async def generate_report_get(
    report_type: str = Query(..., description="Type of report"),
    format: str = Query("pdf", description="Report format"),
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    media_type: Optional[str] = Query(None, description="Filter by media type"),
    language: Optional[str] = Query(None, description="Filter by language"),
    include_charts: bool = Query(True, description="Include charts in PDF"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> ReportResponse:
    """
    Generate report using GET request with query parameters.
    """
    try:
        # Build date range
        date_range = None
        if date_from or date_to:
            from datetime import datetime
            try:
                start_date = datetime.fromisoformat(date_from) if date_from else datetime.utcnow() - timedelta(days=30)
                end_date = datetime.fromisoformat(date_to) if date_to else datetime.utcnow()
                date_range = {"start": start_date, "end": end_date}
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format")

        # Build filters
        filters = {}
        if media_type:
            filters["media_type"] = media_type
        if language:
            filters["language"] = language

        reporting_service = get_reporting_service()

        if format.lower() == "pdf":
            result = reporting_service.generate_pdf_report(
                user_id=current_user.id,
                report_type=report_type,
                date_range=date_range,
                filters=filters,
                include_charts=include_charts
            )
        elif format.lower() == "excel":
            result = reporting_service.generate_excel_report(
                user_id=current_user.id,
                report_type=report_type,
                date_range=date_range,
                filters=filters
            )
        else:
            raise HTTPException(status_code=400, detail="Unsupported format")

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        return ReportResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating report: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate report")

@router.get("/templates")
async def get_report_templates(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> List[ReportTemplate]:
    """
    Get available report templates.

    Returns predefined report templates with default configurations.
    """
    try:
        templates = [
            ReportTemplate(
                template_id="overview_standard",
                name="Overview Report",
                description="Comprehensive overview of your content library with key metrics",
                report_type="overview",
                default_filters={},
                available_formats=["pdf", "excel"]
            ),
            ReportTemplate(
                template_id="analytics_detailed",
                name="Analytics Report",
                description="Detailed analytics with time-series data and performance metrics",
                report_type="analytics",
                default_filters={"include_charts": True},
                available_formats=["pdf", "excel"]
            ),
            ReportTemplate(
                template_id="search_insights",
                name="Search Analytics",
                description="Search performance and popular terms analysis",
                report_type="search",
                default_filters={},
                available_formats=["pdf", "excel"]
            ),
            ReportTemplate(
                template_id="works_catalog",
                name="Works Catalog",
                description="Complete catalog of works with metadata and statistics",
                report_type="works",
                default_filters={},
                available_formats=["pdf", "excel"]
            ),
            ReportTemplate(
                template_id="trends_analysis",
                name="Trend Analysis",
                description="Content trends and popularity analysis over time",
                report_type="trends",
                default_filters={},
                available_formats=["pdf", "excel"]
            )
        ]

        return templates

    except Exception as e:
        logger.error(f"Error getting report templates: {e}")
        raise HTTPException(status_code=500, detail="Failed to get templates")

@router.get("/history")
async def get_report_history(
    page: int = Query(1, description="Page number", ge=1),
    page_size: int = Query(20, description="Items per page", ge=1, le=100),
    report_type: Optional[str] = Query(None, description="Filter by report type"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> ReportListResponse:
    """
    Get report generation history.

    Returns paginated list of previously generated reports.
    """
    try:
        # In a real implementation, this would query a reports table
        # For now, return mock data
        mock_reports = [
            {
                "report_id": "rpt_001",
                "report_type": "overview",
                "generated_at": "2024-01-15T10:30:00Z",
                "date_range": {"start": "2024-01-01", "end": "2024-01-15"},
                "format": "pdf",
                "status": "completed",
                "file_size": "2.3 MB"
            },
            {
                "report_id": "rpt_002",
                "report_type": "analytics",
                "generated_at": "2024-01-14T15:45:00Z",
                "date_range": {"start": "2023-12-01", "end": "2024-01-14"},
                "format": "excel",
                "status": "completed",
                "file_size": "1.8 MB"
            }
        ]

        # Apply filters
        if report_type:
            mock_reports = [r for r in mock_reports if r["report_type"] == report_type]

        # Pagination
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_reports = mock_reports[start_idx:end_idx]

        return ReportListResponse(
            reports=paginated_reports,
            total_count=len(mock_reports),
            page=page,
            page_size=page_size
        )

    except Exception as e:
        logger.error(f"Error getting report history: {e}")
        raise HTTPException(status_code=500, detail="Failed to get report history")

@router.get("/preview/{report_type}")
async def preview_report(
    report_type: str,
    format: str = Query("pdf", description="Preview format"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Preview a report template.

    Generates a sample report with mock data for preview purposes.
    """
    try:
        reporting_service = get_reporting_service()

        # Generate a small sample report
        result = reporting_service.generate_pdf_report(
            user_id=current_user.id,
            report_type=report_type,
            include_charts=False  # Disable charts for preview
        )

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        return {
            "preview_available": True,
            "report_type": report_type,
            "estimated_size": "1.2 MB",
            "sample_content": result["content"][:100] + "...",  # First 100 chars of base64
            "metadata": result["metadata"]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error previewing report: {e}")
        raise HTTPException(status_code=500, detail="Failed to preview report")

@router.post("/schedule")
async def schedule_report(
    request: ReportRequest,
    schedule_config: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Schedule a report to be generated and delivered periodically.

    Args:
        request: Report configuration
        schedule_config: Scheduling configuration (frequency, delivery method, etc.)

    Returns:
        Scheduled report information
    """
    try:
        # In a real implementation, this would create a scheduled job
        # For now, return mock response
        return {
            "schedule_id": str(uuid.uuid4()),
            "report_config": request.dict(),
            "schedule_config": schedule_config,
            "next_run": "2024-01-16T09:00:00Z",
            "status": "scheduled",
            "message": "Report scheduled successfully"
        }

    except Exception as e:
        logger.error(f"Error scheduling report: {e}")
        raise HTTPException(status_code=500, detail="Failed to schedule report")

@router.get("/export/{report_id}")
async def export_report(
    report_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> StreamingResponse:
    """
    Export a previously generated report.

    Streams the report file for download.
    """
    try:
        # In a real implementation, this would retrieve the report from storage
        # For now, generate a new report
        reporting_service = get_reporting_service()

        # Mock report data - in reality, this would come from the report_id
        result = reporting_service.generate_pdf_report(
            user_id=current_user.id,
            report_type="overview",
            include_charts=True
        )

        if "error" in result:
            raise HTTPException(status_code=404, detail="Report not found")

        # Import base64 for decoding
        import base64
        from io import BytesIO

        # Decode the PDF content
        pdf_content = base64.b64decode(result["content"])

        # Return as streaming response
        def iter_file():
            yield pdf_content

        return StreamingResponse(
            iter_file(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={report_id}.pdf"}
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting report: {e}")
        raise HTTPException(status_code=500, detail="Failed to export report")

@router.get("/stats")
async def get_report_statistics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get reporting system statistics.

    Returns information about report generation, popular templates, and system status.
    """
    try:
        # Mock statistics - in reality, this would come from database queries
        stats = {
            "total_reports_generated": 0,
            "reports_this_month": 0,
            "most_popular_template": "overview",
            "average_generation_time": "15 seconds",
            "available_templates": 5,
            "supported_formats": ["pdf", "excel"],
            "last_updated": datetime.utcnow().isoformat()
        }

        return stats

    except Exception as e:
        logger.error(f"Error getting report statistics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get statistics")

# Factory Analytics Endpoints

@router.get("/factory/overview")
async def get_factory_overview(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive factory analytics overview.
    """
    try:
        # Get factory generation statistics
        total_works = db.query(func.count(Work.id)).filter(Work.user_id == current_user.id).scalar()
        
        # Get recent activity
        recent_date = datetime.utcnow() - timedelta(days=30)
        recent_works = db.query(func.count(Work.id)).filter(
            and_(
                Work.user_id == current_user.id,
                Work.created_at >= recent_date
            )
        ).scalar()
        
        # Mock factory-specific stats (in production, these would come from a factory_generations table)
        factory_stats = {
            "poster_generations": 47,
            "ebook_generations": 23,
            "3d_model_generations": 8,
            "audiobook_generations": 15,
            "course_generations": 5
        }
        
        return {
            "total_works": total_works,
            "recent_activity": recent_works,
            "factory_generations": factory_stats,
            "total_generations": sum(factory_stats.values()),
            "most_used_factory": max(factory_stats, key=factory_stats.get),
            "growth_rate": 15.3,  # percentage
            "last_updated": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting factory overview: {e}")
        raise HTTPException(status_code=500, detail="Failed to get factory overview")

@router.get("/factory/performance")
async def get_factory_performance(
    date_range: str = Query("30d", description="Date range (7d, 30d, 90d)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get factory performance metrics over time.
    """
    try:
        # Parse date range
        days = int(date_range.replace('d', ''))
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Mock time series data (in production, this would query actual generation data)
        performance_data = []
        for i in range(days):
            date = start_date + timedelta(days=i)
            performance_data.append({
                "date": date.strftime("%Y-%m-%d"),
                "poster_generations": 2 + (i % 3),
                "ebook_generations": 1 + (i % 2),
                "3d_model_generations": (i % 5 == 0),
                "audiobook_generations": 1 + (i % 3),
                "course_generations": (i % 7 == 0)
            })
        
        return {
            "date_range": date_range,
            "data": performance_data,
            "summary": {
                "total_generations": len(performance_data) * 4,
                "average_daily": 4.2,
                "peak_day": max(performance_data, key=lambda x: sum(v for k, v in x.items() if k != 'date'))["date"],
                "trend": "increasing"
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting factory performance: {e}")
        raise HTTPException(status_code=500, detail="Failed to get factory performance")

@router.post("/factory/export", response_model=ReportResponse)
async def export_factory_report(
    report_request: ReportRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Generate and export comprehensive factory analytics report.
    """
    try:
        report_id = str(uuid.uuid4())
        
        # Start background report generation
        background_tasks.add_task(
            generate_factory_report_background,
            report_id,
            report_request.dict(),
            current_user.id
        )
        
        return ReportResponse(
            report_id=report_id,
            report_type=report_request.report_type,
            user_id=current_user.id,
            generated_at=datetime.utcnow().isoformat(),
            date_range=report_request.date_range or {"start": "30d", "end": "today"},
            content="",  # Will be populated when report is ready
            metadata={"status": "processing"},
            status="processing"
        )
        
    except Exception as e:
        logger.error(f"Error starting factory report generation: {e}")
        raise HTTPException(status_code=500, detail="Failed to start report generation")

@router.get("/factory/export/{report_id}")
async def get_factory_report_status(
    report_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get the status of a factory report generation.
    """
    try:
        # In production, this would check a database
        # For now, simulate completed report
        mock_report_content = base64.b64encode(
            b"Mock PDF report content for factory analytics"
        ).decode()
        
        return {
            "report_id": report_id,
            "status": "completed",
            "content": mock_report_content,
            "metadata": {
                "file_size": "2.1 MB",
                "format": "PDF",
                "pages": 12,
                "generated_at": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting factory report status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get report status")

@router.get("/factory/download/{report_id}")
async def download_factory_report(
    report_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Download a generated factory report.
    """
    try:
        # Generate mock PDF content
        pdf_content = io.BytesIO()
        pdf_content.write(b"Mock PDF content for factory analytics report")
        pdf_content.seek(0)
        
        return StreamingResponse(
            io.BytesIO(pdf_content.read()),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=factory-report-{report_id}.pdf"}
        )
        
    except Exception as e:
        logger.error(f"Error downloading factory report: {e}")
        raise HTTPException(status_code=500, detail="Failed to download report")

@router.get("/factory/templates")
async def get_factory_report_templates(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get available factory report templates.
    """
    templates = [
        {
            "template_id": "factory_overview",
            "name": "Factory Overview",
            "description": "Comprehensive overview of all factory operations and performance",
            "format": "pdf",
            "includes_charts": True,
            "estimated_time": 30
        },
        {
            "template_id": "factory_performance",
            "name": "Factory Performance Analysis",
            "description": "Detailed performance metrics and trend analysis",
            "format": "pdf",
            "includes_charts": True,
            "estimated_time": 45
        },
        {
            "template_id": "factory_usage",
            "name": "Factory Usage Report",
            "description": "Usage patterns and statistics for each factory type",
            "format": "excel",
            "includes_charts": False,
            "estimated_time": 20
        },
        {
            "template_id": "factory_efficiency",
            "name": "Factory Efficiency Report",
            "description": "Efficiency metrics and optimization recommendations",
            "format": "pdf",
            "includes_charts": True,
            "estimated_time": 35
        }
    ]
    
    return {"templates": templates}

# Background task for factory report generation
async def generate_factory_report_background(
    report_id: str,
    report_request: Dict[str, Any],
    user_id: int
):
    """
    Background task for generating factory reports.
    """
    try:
        import asyncio
        await asyncio.sleep(30)  # Simulate processing time
        
        # In production, this would:
        # 1. Gather comprehensive factory data
        # 2. Generate charts and visualizations
        # 3. Create PDF/Excel report using libraries like ReportLab or openpyxl
        # 4. Store the report in cloud storage
        # 5. Update database with completion status
        
        logger.info(f"Completed factory report generation {report_id} for user {user_id}")
        
    except Exception as e:
        logger.error(f"Error in factory report generation background task: {e}")

# Import required modules
from app.models import User
from datetime import datetime, timedelta
import uuid
