"""
Advanced reporting service for generating PDF and Excel reports.

Provides comprehensive reporting capabilities including data visualization,
custom report templates, scheduled reports, and export functionality.
"""

import logging
import json
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from io import BytesIO
import uuid
import base64

from sqlalchemy.orm import Session
from sqlalchemy import func, text, desc, and_, or_, case
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.platypus.flowables import KeepTogether
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.linecharts import LineChart
from reportlab.graphics.charts.piecharts import Pie
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.chart import BarChart, LineChart, PieChart as ExcelPieChart, Reference
from openpyxl.utils import get_column_letter

from app.database import get_db
from app.models import Work, User, WorkMetric, UserActivity
from app.analytics_service import get_analytics_service

logger = logging.getLogger(__name__)

class ReportingService:
    """
    Service for advanced reporting and data export.

    Provides capabilities for:
    - PDF report generation with charts and visualizations
    - Excel export with multiple sheets and formatting
    - Custom report templates
    - Scheduled report generation
    - Data visualization and analytics
    """

    def __init__(self):
        """Initialize reporting service."""
        self.db = next(get_db())
        self.analytics_service = get_analytics_service()

        # Configure matplotlib for server-side plotting
        plt.style.use('default')
        sns.set_palette("husl")

    def generate_pdf_report(
        self,
        user_id: int,
        report_type: str,
        date_range: Optional[Dict[str, datetime]] = None,
        filters: Optional[Dict[str, Any]] = None,
        include_charts: bool = True
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive PDF report.

        Args:
            user_id: User ID for the report
            report_type: Type of report (overview, analytics, search, works, trends)
            date_range: Optional date range for the report
            filters: Optional filters to apply
            include_charts: Whether to include data visualizations

        Returns:
            Report data including PDF content and metadata
        """
        if not REPORTLAB_AVAILABLE:
            logger.warning("ReportLab is not installed; PDF report generation disabled")
            return {"error": "PDF report generation is currently unavailable"}

        try:
            # Get user information
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                return {"error": "User not found"}

            # Set default date range (last 30 days)
            if not date_range:
                end_date = datetime.utcnow()
                start_date = end_date - timedelta(days=30)
                date_range = {"start": start_date, "end": end_date}

            # Generate report content based on type
            report_data = self._generate_report_content(report_type, user_id, date_range, filters)

            # Create PDF document
            pdf_buffer = BytesIO()
            doc = SimpleDocTemplate(
                pdf_buffer,
                pagesize=letter,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=18
            )

            # Build PDF content
            elements = []

            # Add header
            elements.extend(self._create_report_header(user, report_type, date_range))

            # Add summary
            elements.extend(self._create_report_summary(report_data))

            # Add charts if requested
            if include_charts:
                elements.extend(self._create_report_charts(report_data, report_type))

            # Add detailed data tables
            elements.extend(self._create_report_tables(report_data, report_type))

            # Build PDF
            doc.build(elements)

            # Get PDF content
            pdf_content = pdf_buffer.getvalue()
            pdf_base64 = base64.b64encode(pdf_content).decode('utf-8')

            return {
                "report_id": str(uuid.uuid4()),
                "report_type": report_type,
                "user_id": user_id,
                "generated_at": datetime.utcnow().isoformat(),
                "date_range": date_range,
                "filters": filters,
                "content": pdf_base64,
                "metadata": report_data.get("metadata", {}),
                "summary": report_data.get("summary", {}),
                "status": "completed"
            }

        except Exception as e:
            logger.error(f"Error generating PDF report: {e}")
            return {"error": "Failed to generate PDF report"}

    def _generate_report_content(
        self,
        report_type: str,
        user_id: int,
        date_range: Dict[str, datetime],
        filters: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate content for different report types."""
        try:
            if report_type == "overview":
                return self._generate_overview_report(user_id, date_range, filters)
            elif report_type == "analytics":
                return self._generate_analytics_report(user_id, date_range, filters)
            elif report_type == "search":
                return self._generate_search_report(user_id, date_range, filters)
            elif report_type == "works":
                return self._generate_works_report(user_id, date_range, filters)
            elif report_type == "trends":
                return self._generate_trends_report(user_id, date_range, filters)
            else:
                return self._generate_custom_report(user_id, report_type, date_range, filters)

        except Exception as e:
            logger.error(f"Error generating report content: {e}")
            return {"error": "Failed to generate report content"}

    def _generate_overview_report(
        self,
        user_id: int,
        date_range: Dict[str, datetime],
        filters: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate overview report with key metrics."""
        try:
            # Get basic statistics
            total_works = self.db.query(func.count(Work.id)).filter(
                Work.user_id == user_id
            ).scalar() or 0

            works_with_content = self.db.query(func.count(Work.id)).filter(
                Work.user_id == user_id,
                Work.metadata.has_key('content')
            ).scalar() or 0

            # Get works created in date range
            works_in_range = self.db.query(func.count(Work.id)).filter(
                Work.user_id == user_id,
                Work.created_at >= date_range['start'],
                Work.created_at <= date_range['end']
            ).scalar() or 0

            # Get media type distribution
            media_types = self.db.query(
                Work.media_type,
                func.count(Work.id).label('count')
            ).filter(
                Work.user_id == user_id,
                Work.media_type.isnot(None)
            ).group_by(Work.media_type).all()

            # Get language distribution
            languages = self.db.query(
                Work.language,
                func.count(Work.id).label('count')
            ).filter(
                Work.user_id == user_id,
                Work.language.isnot(None)
            ).group_by(Work.language).all()

            # Get recent activity
            recent_works = self.db.query(Work).filter(
                Work.user_id == user_id
            ).order_by(desc(Work.created_at)).limit(10).all()

            return {
                "metadata": {
                    "report_type": "overview",
                    "total_works": total_works,
                    "works_with_content": works_with_content,
                    "works_in_range": works_in_range
                },
                "summary": {
                    "total_works": total_works,
                    "works_with_content": works_with_content,
                    "works_in_range": works_in_range,
                    "content_coverage": round((works_with_content / max(total_works, 1)) * 100, 1)
                },
                "data": {
                    "media_types": [{"type": mt, "count": count} for mt, count in media_types],
                    "languages": [{"language": lang, "count": count} for lang, count in languages],
                    "recent_works": [
                        {
                            "id": work.id,
                            "title": work.title,
                            "author": work.author,
                            "media_type": work.media_type,
                            "created_at": work.created_at.isoformat()
                        } for work in recent_works
                    ]
                }
            }

        except Exception as e:
            logger.error(f"Error generating overview report: {e}")
            return {}

    def _generate_analytics_report(
        self,
        user_id: int,
        date_range: Dict[str, datetime],
        filters: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate analytics report with detailed metrics."""
        try:
            # Use analytics service to get comprehensive data
            analytics_data = self.analytics_service.get_comprehensive_dashboard(user_id)

            # Get time-series data for the date range
            time_series = self._get_time_series_data(user_id, date_range)

            # Get top performing works
            top_works = self._get_top_performing_works(user_id, limit=10)

            # Get search analytics
            search_analytics = self._get_search_analytics(user_id, date_range)

            return {
                "metadata": {
                    "report_type": "analytics",
                    "date_range": date_range,
                    "data_points": len(time_series.get("data", []))
                },
                "summary": {
                    "total_views": analytics_data.get("overview", {}).get("total_views", 0),
                    "total_searches": search_analytics.get("total_searches", 0),
                    "top_work": top_works[0]["title"] if top_works else "N/A",
                    "avg_trend_score": analytics_data.get("overview", {}).get("avg_trend_score", 0)
                },
                "data": {
                    "overview": analytics_data.get("overview", {}),
                    "time_series": time_series,
                    "top_works": top_works,
                    "search_analytics": search_analytics,
                    "breakdowns": analytics_data.get("breakdowns", {})
                }
            }

        except Exception as e:
            logger.error(f"Error generating analytics report: {e}")
            return {}

    def _generate_search_report(
        self,
        user_id: int,
        date_range: Dict[str, datetime],
        filters: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate search analytics report."""
        try:
            # Get search statistics
            search_stats = self._get_search_analytics(user_id, date_range)

            # Get popular search terms
            popular_terms = self._get_popular_search_terms(user_id, limit=20)

            # Get search trends over time
            search_trends = self._get_search_trends(user_id, date_range)

            # Get search performance metrics
            performance_metrics = self._get_search_performance_metrics(user_id, date_range)

            return {
                "metadata": {
                    "report_type": "search",
                    "total_searches": search_stats.get("total_searches", 0),
                    "unique_terms": len(popular_terms)
                },
                "summary": {
                    "total_searches": search_stats.get("total_searches", 0),
                    "avg_results_per_search": search_stats.get("avg_results", 0),
                    "most_popular_term": popular_terms[0]["term"] if popular_terms else "N/A",
                    "search_coverage": search_stats.get("search_coverage", 0)
                },
                "data": {
                    "search_stats": search_stats,
                    "popular_terms": popular_terms,
                    "search_trends": search_trends,
                    "performance_metrics": performance_metrics
                }
            }

        except Exception as e:
            logger.error(f"Error generating search report: {e}")
            return {}

    def _generate_works_report(
        self,
        user_id: int,
        date_range: Dict[str, datetime],
        filters: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate works catalog report."""
        try:
            # Get all works with filtering
            query = self.db.query(Work).filter(Work.user_id == user_id)

            if filters:
                if filters.get("media_type"):
                    query = query.filter(Work.media_type == filters["media_type"])
                if filters.get("language"):
                    query = query.filter(Work.language == filters["language"])
                if filters.get("has_content"):
                    query = query.filter(Work.metadata.has_key('content'))

            works = query.order_by(desc(Work.created_at)).all()

            # Group works by media type
            works_by_type = {}
            for work in works:
                media_type = work.media_type or "unknown"
                if media_type not in works_by_type:
                    works_by_type[media_type] = []
                works_by_type[media_type].append(work)

            # Get content statistics
            content_stats = {
                "total_works": len(works),
                "works_with_content": len([w for w in works if w.metadata and 'content' in w.metadata]),
                "works_with_descriptions": len([w for w in works if w.metadata and 'description' in w.metadata]),
                "avg_content_length": 0,
                "total_content_length": 0
            }

            content_lengths = []
            for work in works:
                if work.metadata and 'content' in work.metadata:
                    content_length = len(work.metadata['content'])
                    content_lengths.append(content_length)
                    content_stats["total_content_length"] += content_length

            if content_lengths:
                content_stats["avg_content_length"] = sum(content_lengths) / len(content_lengths)

            return {
                "metadata": {
                    "report_type": "works",
                    "total_works": len(works),
                    "filters_applied": filters or {}
                },
                "summary": content_stats,
                "data": {
                    "works_by_type": works_by_type,
                    "content_stats": content_stats,
                    "recent_works": [
                        {
                            "id": work.id,
                            "title": work.title,
                            "author": work.author,
                            "media_type": work.media_type,
                            "language": work.language,
                            "public_domain_year": work.public_domain_year,
                            "created_at": work.created_at.isoformat(),
                            "has_content": bool(work.metadata and 'content' in work.metadata)
                        } for work in works[:50]  # Limit to prevent huge reports
                    ]
                }
            }

        except Exception as e:
            logger.error(f"Error generating works report: {e}")
            return {}

    def _generate_trends_report(
        self,
        user_id: int,
        date_range: Dict[str, datetime],
        filters: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate trends analysis report."""
        try:
            # Get trend data
            trend_data = self._get_trend_data(user_id, date_range)

            # Get content trends by media type
            media_trends = self._get_media_type_trends(user_id, date_range)

            # Get author trends
            author_trends = self._get_author_trends(user_id, date_range)

            # Get topic trends (if available)
            topic_trends = self._get_topic_trends(user_id, date_range)

            return {
                "metadata": {
                    "report_type": "trends",
                    "date_range": date_range,
                    "trend_points": len(trend_data.get("data", []))
                },
                "summary": {
                    "total_trend_points": len(trend_data.get("data", [])),
                    "media_types_tracked": len(media_trends),
                    "top_author": author_trends[0]["author"] if author_trends else "N/A",
                    "trend_direction": self._calculate_trend_direction(trend_data)
                },
                "data": {
                    "trend_data": trend_data,
                    "media_trends": media_trends,
                    "author_trends": author_trends,
                    "topic_trends": topic_trends
                }
            }

        except Exception as e:
            logger.error(f"Error generating trends report: {e}")
            return {}

    def _create_report_header(self, user: User, report_type: str, date_range: Dict[str, datetime]) -> List:
        """Create report header elements."""
        styles = getSampleStyleSheet()

        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=1  # Center alignment
        )

        subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=20,
            textColor=colors.gray
        )

        elements = [
            Paragraph(f"Public Domain Hunter - {report_type.title()} Report", title_style),
            Paragraph(f"Generated for: {user.username}", subtitle_style),
            Paragraph(f"Report Period: {date_range['start'].strftime('%B %d, %Y')} - {date_range['end'].strftime('%B %d, %Y')}", subtitle_style),
            Paragraph(f"Generated on: {datetime.utcnow().strftime('%B %d, %Y at %I:%M %p')}", subtitle_style),
            Spacer(1, 0.5 * inch)
        ]

        return elements

    def _create_report_summary(self, report_data: Dict[str, Any]) -> List:
        """Create report summary section."""
        if "error" in report_data:
            return [Paragraph("Error generating report summary", getSampleStyleSheet()['Normal'])]

        summary = report_data.get("summary", {})
        elements = []

        # Summary table
        if summary:
            summary_data = [["Metric", "Value"]]
            for key, value in summary.items():
                if isinstance(value, (int, float)):
                    if isinstance(value, float):
                        value = f"{value:.1f}"
                    else:
                        value = f"{value}"
                summary_data.append([key.replace("_", " ").title(), str(value)])

            summary_table = Table(summary_data, colWidths=[3*inch, 3*inch])
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 14),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))

            elements.extend([
                Paragraph("Executive Summary", getSampleStyleSheet()['Heading2']),
                summary_table,
                Spacer(1, 0.3 * inch)
            ])

        return elements

    def _create_report_charts(self, report_data: Dict[str, Any], report_type: str) -> List:
        """Create charts for the report."""
        elements = []

        try:
            if report_type == "overview":
                elements.extend(self._create_overview_charts(report_data))
            elif report_type == "analytics":
                elements.extend(self._create_analytics_charts(report_data))
            elif report_type == "search":
                elements.extend(self._create_search_charts(report_data))
            elif report_type == "trends":
                elements.extend(self._create_trends_charts(report_data))

        except Exception as e:
            logger.error(f"Error creating charts: {e}")
            elements.append(Paragraph("Charts could not be generated", getSampleStyleSheet()['Normal']))

        return elements

    def _create_overview_charts(self, report_data: Dict[str, Any]) -> List:
        """Create charts for overview report."""
        elements = []

        # Media type distribution pie chart
        media_types = report_data.get("data", {}).get("media_types", [])
        if media_types:
            drawing = Drawing(400, 300)

            pie = Pie()
            pie.x = 150
            pie.y = 50
            pie.width = 200
            pie.height = 200

            data = [mt["count"] for mt in media_types]
            labels = [mt["type"] for mt in media_types]

            pie.data = data
            pie.labels = labels

            drawing.add(pie)
            elements.extend([
                Paragraph("Content Distribution by Media Type", getSampleStyleSheet()['Heading3']),
                drawing,
                Spacer(1, 0.3 * inch)
            ])

        return elements

    def _create_analytics_charts(self, report_data: Dict[str, Any]) -> List:
        """Create charts for analytics report."""
        elements = []

        # Time series line chart
        time_series = report_data.get("data", {}).get("time_series", {})
        if time_series.get("data"):
            drawing = Drawing(500, 300)

            line_chart = LineChart()
            line_chart.x = 50
            line_chart.y = 50
            line_chart.width = 400
            line_chart.height = 200

            # Prepare data
            data = time_series["data"]
            if data:
                dates = [item["date"] for item in data]
                values = [item["value"] for item in data]

                line_chart.data = [values]
                line_chart.categoryAxis.categoryNames = dates
                line_chart.categoryAxis.labels.angle = 45

                drawing.add(line_chart)
                elements.extend([
                    Paragraph(f"{time_series['metric'].replace('_', ' ').title()} Over Time", getSampleStyleSheet()['Heading3']),
                    drawing,
                    Spacer(1, 0.3 * inch)
                ])

        return elements

    def _create_search_charts(self, report_data: Dict[str, Any]) -> List:
        """Create charts for search report."""
        elements = []

        # Popular terms bar chart
        popular_terms = report_data.get("data", {}).get("popular_terms", [])
        if popular_terms:
            drawing = Drawing(500, 300)

            bar_chart = VerticalBarChart()
            bar_chart.x = 50
            bar_chart.y = 50
            bar_chart.width = 400
            bar_chart.height = 200

            # Prepare data (limit to top 10)
            top_terms = popular_terms[:10]
            data = [term["count"] for term in top_terms]
            labels = [term["term"][:20] + "..." if len(term["term"]) > 20 else term["term"] for term in top_terms]

            bar_chart.data = [data]
            bar_chart.categoryAxis.categoryNames = labels
            bar_chart.categoryAxis.labels.angle = 45

            drawing.add(bar_chart)
            elements.extend([
                Paragraph("Most Popular Search Terms", getSampleStyleSheet()['Heading3']),
                drawing,
                Spacer(1, 0.3 * inch)
            ])

        return elements

    def _create_trends_charts(self, report_data: Dict[str, Any]) -> List:
        """Create charts for trends report."""
        elements = []

        # Media type trends
        media_trends = report_data.get("data", {}).get("media_trends", [])
        if media_trends:
            drawing = Drawing(500, 300)

            bar_chart = VerticalBarChart()
            bar_chart.x = 50
            bar_chart.y = 50
            bar_chart.width = 400
            bar_chart.height = 200

            data = [trend["avg_score"] for trend in media_trends]
            labels = [trend["media_type"] for trend in media_trends]

            bar_chart.data = [data]
            bar_chart.categoryAxis.categoryNames = labels

            drawing.add(bar_chart)
            elements.extend([
                Paragraph("Average Trend Scores by Media Type", getSampleStyleSheet()['Heading3']),
                drawing,
                Spacer(1, 0.3 * inch)
            ])

        return elements

    def _create_report_tables(self, report_data: Dict[str, Any], report_type: str) -> List:
        """Create detailed data tables for the report."""
        elements = []

        try:
            if report_type == "overview":
                elements.extend(self._create_overview_tables(report_data))
            elif report_type == "analytics":
                elements.extend(self._create_analytics_tables(report_data))
            elif report_type == "search":
                elements.extend(self._create_search_tables(report_data))
            elif report_type == "works":
                elements.extend(self._create_works_tables(report_data))
            elif report_type == "trends":
                elements.extend(self._create_trends_tables(report_data))

        except Exception as e:
            logger.error(f"Error creating tables: {e}")
            elements.append(Paragraph("Data tables could not be generated", getSampleStyleSheet()['Normal']))

        return elements

    def _create_overview_tables(self, report_data: Dict[str, Any]) -> List:
        """Create tables for overview report."""
        elements = []

        # Recent works table
        recent_works = report_data.get("data", {}).get("recent_works", [])
        if recent_works:
            elements.append(Paragraph("Recent Works", getSampleStyleSheet()['Heading3']))

            table_data = [["Title", "Author", "Media Type", "Language", "Added"]]
            for work in recent_works:
                table_data.append([
                    work["title"][:30] + "..." if len(work["title"]) > 30 else work["title"],
                    work["author"] or "Unknown",
                    work["media_type"] or "Unknown",
                    work["language"] or "Unknown",
                    work["created_at"].split("T")[0]
                ])

            table = Table(table_data, colWidths=[2*inch, 1.5*inch, 1*inch, 1*inch, 1*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))

            elements.extend([table, Spacer(1, 0.3 * inch)])

        return elements

    def _create_analytics_tables(self, report_data: Dict[str, Any]) -> List:
        """Create tables for analytics report."""
        elements = []

        # Top works table
        top_works = report_data.get("data", {}).get("top_works", [])
        if top_works:
            elements.append(Paragraph("Top Performing Works", getSampleStyleSheet()['Heading3']))

            table_data = [["Title", "Author", "Views", "Trend Score", "Media Type"]]
            for work in top_works:
                table_data.append([
                    work["title"][:25] + "..." if len(work["title"]) > 25 else work["title"],
                    work["author"] or "Unknown",
                    str(work.get("views", 0)),
                    str(work.get("trend_score", 0)),
                    work.get("media_type", "Unknown")
                ])

            table = Table(table_data, colWidths=[2*inch, 1.5*inch, 0.8*inch, 0.8*inch, 1*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))

            elements.extend([table, Spacer(1, 0.3 * inch)])

        return elements

    def _create_search_tables(self, report_data: Dict[str, Any]) -> List:
        """Create tables for search report."""
        elements = []

        # Popular terms table
        popular_terms = report_data.get("data", {}).get("popular_terms", [])
        if popular_terms:
            elements.append(Paragraph("Popular Search Terms", getSampleStyleSheet()['Heading3']))

            table_data = [["Search Term", "Count", "Type"]]
            for term in popular_terms[:20]:  # Limit to top 20
                table_data.append([
                    term["term"],
                    str(term["count"]),
                    term.get("type", "general")
                ])

            table = Table(table_data, colWidths=[3*inch, 1*inch, 1*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))

            elements.extend([table, Spacer(1, 0.3 * inch)])

        return elements

    def _create_works_tables(self, report_data: Dict[str, Any]) -> List:
        """Create tables for works report."""
        elements = []

        # Works by media type
        works_by_type = report_data.get("data", {}).get("works_by_type", {})
        for media_type, works in works_by_type.items():
            elements.append(Paragraph(f"{media_type.title()} Works", getSampleStyleSheet()['Heading3']))

            table_data = [["Title", "Author", "Language", "Year", "Has Content"]]
            for work in works[:15]:  # Limit to prevent huge tables
                table_data.append([
                    work.title[:30] + "..." if len(work.title) > 30 else work.title,
                    work.author or "Unknown",
                    work.language or "Unknown",
                    str(work.public_domain_year or "Unknown"),
                    "Yes" if work.metadata and 'content' in work.metadata else "No"
                ])

            table = Table(table_data, colWidths=[2.5*inch, 1.5*inch, 0.8*inch, 0.8*inch, 0.8*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))

            elements.extend([table, Spacer(1, 0.3 * inch)])

        return elements

    def _create_trends_tables(self, report_data: Dict[str, Any]) -> List:
        """Create tables for trends report."""
        elements = []

        # Media type trends
        media_trends = report_data.get("data", {}).get("media_trends", [])
        if media_trends:
            elements.append(Paragraph("Media Type Trends", getSampleStyleSheet()['Heading3']))

            table_data = [["Media Type", "Average Score", "Trend Direction", "Sample Size"]]
            for trend in media_trends:
                table_data.append([
                    trend["media_type"],
                    f"{trend['avg_score']:.1f}",
                    trend.get("direction", "stable"),
                    str(trend.get("sample_size", 0))
                ])

            table = Table(table_data, colWidths=[1.5*inch, 1.2*inch, 1.2*inch, 1*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))

            elements.extend([table, Spacer(1, 0.3 * inch)])

        return elements

    def generate_excel_report(
        self,
        user_id: int,
        report_type: str,
        date_range: Optional[Dict[str, datetime]] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate an Excel report with multiple sheets.

        Args:
            user_id: User ID for the report
            report_type: Type of report
            date_range: Optional date range
            filters: Optional filters

        Returns:
            Excel file content and metadata
        """
        if not OPENPYXL_AVAILABLE:
            logger.warning("openpyxl is not installed; Excel report generation disabled")
            return {"error": "Excel report generation is currently unavailable"}

        try:
            # Set default date range
            if not date_range:
                end_date = datetime.utcnow()
                start_date = end_date - timedelta(days=30)
                date_range = {"start": start_date, "end": end_date}

            # Generate report content
            report_data = self._generate_report_content(report_type, user_id, date_range, filters)

            # Create Excel workbook
            wb = Workbook()

            # Remove default sheet
            wb.remove(wb.active)

            # Create summary sheet
            self._create_excel_summary_sheet(wb, report_data, user_id, report_type, date_range)

            # Create data sheets based on report type
            if report_type == "overview":
                self._create_excel_overview_sheets(wb, report_data)
            elif report_type == "analytics":
                self._create_excel_analytics_sheets(wb, report_data)
            elif report_type == "search":
                self._create_excel_search_sheets(wb, report_data)
            elif report_type == "works":
                self._create_excel_works_sheets(wb, report_data)
            elif report_type == "trends":
                self._create_excel_trends_sheets(wb, report_data)

            # Save to buffer
            excel_buffer = BytesIO()
            wb.save(excel_buffer)
            excel_content = excel_buffer.getvalue()
            excel_base64 = base64.b64encode(excel_content).decode('utf-8')

            return {
                "report_id": str(uuid.uuid4()),
                "report_type": report_type,
                "user_id": user_id,
                "generated_at": datetime.utcnow().isoformat(),
                "date_range": date_range,
                "content": excel_base64,
                "metadata": report_data.get("metadata", {}),
                "status": "completed"
            }

        except Exception as e:
            logger.error(f"Error generating Excel report: {e}")
            return {"error": "Failed to generate Excel report"}

    def _create_excel_summary_sheet(self, wb: Workbook, report_data: Dict[str, Any], user_id: int, report_type: str, date_range: Dict[str, datetime]):
        """Create the summary sheet for Excel report."""
        ws = wb.create_sheet("Summary")

        # Title
        ws['A1'] = f"Public Domain Hunter - {report_type.title()} Report"
        ws['A1'].font = Font(bold=True, size=16)

        # Metadata
        ws['A3'] = f"Generated for User ID: {user_id}"
        ws['A4'] = f"Report Period: {date_range['start'].strftime('%Y-%m-%d')} to {date_range['end'].strftime('%Y-%m-%d')}"
        ws['A5'] = f"Generated on: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}"

        # Summary data
        summary = report_data.get("summary", {})
        if summary:
            ws['A7'] = "Summary Metrics"
            ws['A7'].font = Font(bold=True, size=12)

            row = 8
            for key, value in summary.items():
                ws[f'A{row}'] = key.replace("_", " ").title()
                ws[f'B{row}'] = value
                row += 1

        # Style the header
        for cell in ['A1', 'A7']:
            ws[cell].fill = PatternFill(start_color="CCCCCC", end_color="CCCCCC", fill_type="solid")

    def _create_excel_overview_sheets(self, wb: Workbook, report_data: Dict[str, Any]):
        """Create sheets for overview report."""
        # Media types sheet
        if report_data.get("data", {}).get("media_types"):
            ws = wb.create_sheet("Media Types")
            ws['A1'] = "Media Type Distribution"
            ws['A1'].font = Font(bold=True, size=12)

            media_types = report_data["data"]["media_types"]
            ws['A3'] = "Type"
            ws['B3'] = "Count"
            ws['A3'].font = Font(bold=True)
            ws['B3'].font = Font(bold=True)

            for i, mt in enumerate(media_types, 4):
                ws[f'A{i}'] = mt["type"]
                ws[f'B{i}'] = mt["count"]

        # Languages sheet
        if report_data.get("data", {}).get("languages"):
            ws = wb.create_sheet("Languages")
            ws['A1'] = "Language Distribution"
            ws['A1'].font = Font(bold=True, size=12)

            languages = report_data["data"]["languages"]
            ws['A3'] = "Language"
            ws['B3'] = "Count"
            ws['A3'].font = Font(bold=True)
            ws['B3'].font = Font(bold=True)

            for i, lang in enumerate(languages, 4):
                ws[f'A{i}'] = lang["language"]
                ws[f'B{i}'] = lang["count"]

    def _create_excel_analytics_sheets(self, wb: Workbook, report_data: Dict[str, Any]):
        """Create sheets for analytics report."""
        # Time series data
        time_series = report_data.get("data", {}).get("time_series", {})
        if time_series.get("data"):
            ws = wb.create_sheet("Time Series")
            ws['A1'] = f"{time_series['metric'].replace('_', ' ').title()} Over Time"
            ws['A1'].font = Font(bold=True, size=12)

            ws['A3'] = "Date"
            ws['B3'] = "Value"
            ws['A3'].font = Font(bold=True)
            ws['B3'].font = Font(bold=True)

            for i, data_point in enumerate(time_series["data"], 4):
                ws[f'A{i}'] = data_point["date"]
                ws[f'B{i}'] = data_point["value"]

        # Top works
        top_works = report_data.get("data", {}).get("top_works", [])
        if top_works:
            ws = wb.create_sheet("Top Works")
            ws['A1'] = "Top Performing Works"
            ws['A1'].font = Font(bold=True, size=12)

            headers = ["Title", "Author", "Views", "Trend Score", "Media Type"]
            for col, header in enumerate(headers, 1):
                ws[f'{get_column_letter(col)}3'] = header
                ws[f'{get_column_letter(col)}3'].font = Font(bold=True)

            for row, work in enumerate(top_works, 4):
                ws[f'A{row}'] = work.get("title", "")
                ws[f'B{row}'] = work.get("author", "")
                ws[f'C{row}'] = work.get("views", 0)
                ws[f'D{row}'] = work.get("trend_score", 0)
                ws[f'E{row}'] = work.get("media_type", "")

    def _create_excel_search_sheets(self, wb: Workbook, report_data: Dict[str, Any]):
        """Create sheets for search report."""
        # Popular terms
        popular_terms = report_data.get("data", {}).get("popular_terms", [])
        if popular_terms:
            ws = wb.create_sheet("Popular Terms")
            ws['A1'] = "Popular Search Terms"
            ws['A1'].font = Font(bold=True, size=12)

            headers = ["Search Term", "Count", "Type"]
            for col, header in enumerate(headers, 1):
                ws[f'{get_column_letter(col)}3'] = header
                ws[f'{get_column_letter(col)}3'].font = Font(bold=True)

            for row, term in enumerate(popular_terms, 4):
                ws[f'A{row}'] = term.get("term", "")
                ws[f'B{row}'] = term.get("count", 0)
                ws[f'C{row}'] = term.get("type", "general")

    def _create_excel_works_sheets(self, wb: Workbook, report_data: Dict[str, Any]):
        """Create sheets for works report."""
        # Works data
        recent_works = report_data.get("data", {}).get("recent_works", [])
        if recent_works:
            ws = wb.create_sheet("Works Catalog")
            ws['A1'] = "Works Catalog"
            ws['A1'].font = Font(bold=True, size=12)

            headers = ["Title", "Author", "Media Type", "Language", "Year", "Has Content", "Added"]
            for col, header in enumerate(headers, 1):
                ws[f'{get_column_letter(col)}3'] = header
                ws[f'{get_column_letter(col)}3'].font = Font(bold=True)

            for row, work in enumerate(recent_works, 4):
                ws[f'A{row}'] = work.get("title", "")
                ws[f'B{row}'] = work.get("author", "")
                ws[f'C{row}'] = work.get("media_type", "")
                ws[f'D{row}'] = work.get("language", "")
                ws[f'E{row}'] = work.get("public_domain_year", "")
                ws[f'F{row}'] = "Yes" if work.get("has_content") else "No"
                ws[f'G{row}'] = work.get("created_at", "").split("T")[0]

    def _create_excel_trends_sheets(self, wb: Workbook, report_data: Dict[str, Any]):
        """Create sheets for trends report."""
        # Media trends
        media_trends = report_data.get("data", {}).get("media_trends", [])
        if media_trends:
            ws = wb.create_sheet("Media Trends")
            ws['A1'] = "Media Type Trends"
            ws['A1'].font = Font(bold=True, size=12)

            headers = ["Media Type", "Average Score", "Trend Direction", "Sample Size"]
            for col, header in enumerate(headers, 1):
                ws[f'{get_column_letter(col)}3'] = header
                ws[f'{get_column_letter(col)}3'].font = Font(bold=True)

            for row, trend in enumerate(media_trends, 4):
                ws[f'A{row}'] = trend.get("media_type", "")
                ws[f'B{row}'] = trend.get("avg_score", 0)
                ws[f'C{row}'] = trend.get("direction", "stable")
                ws[f'D{row}'] = trend.get("sample_size", 0)

    # Helper methods for data gathering
    def _get_time_series_data(self, user_id: int, date_range: Dict[str, datetime]) -> Dict[str, Any]:
        """Get time series data for analytics."""
        try:
            # Simple time series - works created over time
            works = self.db.query(
                func.date(Work.created_at).label('date'),
                func.count(Work.id).label('count')
            ).filter(
                Work.user_id == user_id,
                Work.created_at >= date_range['start'],
                Work.created_at <= date_range['end']
            ).group_by(func.date(Work.created_at)).order_by(func.date(Work.created_at)).all()

            data = [{"date": str(date), "value": count} for date, count in works]

            return {
                "metric": "works_created",
                "data": data,
                "period": "daily"
            }

        except Exception as e:
            logger.error(f"Error getting time series data: {e}")
            return {"metric": "works_created", "data": [], "period": "daily"}

    def _get_top_performing_works(self, user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top performing works based on trend scores."""
        try:
            works = self.db.query(Work).filter(
                Work.user_id == user_id,
                Work.metadata.has_key('trend_score')
            ).order_by(
                text("CAST(metadata->>'trend_score' AS FLOAT) DESC")
            ).limit(limit).all()

            return [
                {
                    "title": work.title,
                    "author": work.author,
                    "trend_score": float(work.metadata.get('trend_score', 0)),
                    "media_type": work.media_type,
                    "views": 0  # Placeholder - would come from analytics
                } for work in works
            ]

        except Exception as e:
            logger.error(f"Error getting top works: {e}")
            return []

    def _get_search_analytics(self, user_id: int, date_range: Dict[str, datetime]) -> Dict[str, Any]:
        """Get search analytics data."""
        try:
            # This would typically come from a search analytics table
            # For now, return mock data
            return {
                "total_searches": 0,
                "avg_results": 0,
                "search_coverage": 0,
                "top_search_terms": []
            }

        except Exception as e:
            logger.error(f"Error getting search analytics: {e}")
            return {}

    def _get_popular_search_terms(self, user_id: int, limit: int = 20) -> List[Dict[str, Any]]:
        """Get popular search terms."""
        try:
            # This would typically come from search logs
            # For now, return mock data based on work titles
            works = self.db.query(Work.title).filter(
                Work.user_id == user_id,
                Work.title.isnot(None)
            ).limit(limit * 2).all()

            terms = []
            for (title,) in works:
                words = title.lower().split()
                for word in words:
                    if len(word) >= 4:
                        terms.append(word)

            from collections import Counter
            term_counts = Counter(terms).most_common(limit)

            return [{"term": term, "count": count, "type": "title"} for term, count in term_counts]

        except Exception as e:
            logger.error(f"Error getting popular search terms: {e}")
            return []

    def _get_search_trends(self, user_id: int, date_range: Dict[str, datetime]) -> List[Dict[str, Any]]:
        """Get search trends over time."""
        try:
            # Mock data for now
            return []

        except Exception as e:
            logger.error(f"Error getting search trends: {e}")
            return []

    def _get_search_performance_metrics(self, user_id: int, date_range: Dict[str, datetime]) -> Dict[str, Any]:
        """Get search performance metrics."""
        try:
            return {
                "avg_response_time": 0,
                "success_rate": 100,
                "total_searches": 0,
                "failed_searches": 0
            }

        except Exception as e:
            logger.error(f"Error getting search performance metrics: {e}")
            return {}

    def _get_trend_data(self, user_id: int, date_range: Dict[str, datetime]) -> Dict[str, Any]:
        """Get trend data over time."""
        try:
            # Get average trend scores over time
            trend_data = self.db.query(
                func.date(Work.created_at).label('date'),
                func.avg(text("CAST(COALESCE(metadata->>'trend_score', '0') AS FLOAT)")).label('avg_score')
            ).filter(
                Work.user_id == user_id,
                Work.created_at >= date_range['start'],
                Work.created_at <= date_range['end'],
                Work.metadata.has_key('trend_score')
            ).group_by(func.date(Work.created_at)).order_by(func.date(Work.created_at)).all()

            data = [{"date": str(date), "value": float(avg_score) if avg_score else 0} for date, avg_score in trend_data]

            return {
                "metric": "average_trend_score",
                "data": data,
                "period": "daily"
            }

        except Exception as e:
            logger.error(f"Error getting trend data: {e}")
            return {"metric": "average_trend_score", "data": [], "period": "daily"}

    def _get_media_type_trends(self, user_id: int, date_range: Dict[str, datetime]) -> List[Dict[str, Any]]:
        """Get trends by media type."""
        try:
            trends = self.db.query(
                Work.media_type,
                func.avg(text("CAST(COALESCE(metadata->>'trend_score', '0') AS FLOAT)")).label('avg_score'),
                func.count(Work.id).label('sample_size')
            ).filter(
                Work.user_id == user_id,
                Work.media_type.isnot(None),
                Work.metadata.has_key('trend_score')
            ).group_by(Work.media_type).all()

            return [
                {
                    "media_type": media_type,
                    "avg_score": float(avg_score) if avg_score else 0,
                    "sample_size": sample_size
                } for media_type, avg_score, sample_size in trends
            ]

        except Exception as e:
            logger.error(f"Error getting media type trends: {e}")
            return []

    def _get_author_trends(self, user_id: int, date_range: Dict[str, datetime]) -> List[Dict[str, Any]]:
        """Get trends by author."""
        try:
            trends = self.db.query(
                Work.author,
                func.avg(text("CAST(COALESCE(metadata->>'trend_score', '0') AS FLOAT)")).label('avg_score'),
                func.count(Work.id).label('sample_size')
            ).filter(
                Work.user_id == user_id,
                Work.author.isnot(None),
                Work.metadata.has_key('trend_score')
            ).group_by(Work.author).order_by(desc('avg_score')).limit(10).all()

            return [
                {
                    "author": author,
                    "avg_score": float(avg_score) if avg_score else 0,
                    "sample_size": sample_size
                } for author, avg_score, sample_size in trends
            ]

        except Exception as e:
            logger.error(f"Error getting author trends: {e}")
            return []

    def _get_topic_trends(self, user_id: int, date_range: Dict[str, datetime]) -> List[Dict[str, Any]]:
        """Get trends by topic (mock data for now)."""
        try:
            # This would use the AI service topic modeling
            return []

        except Exception as e:
            logger.error(f"Error getting topic trends: {e}")
            return []

    def _calculate_trend_direction(self, trend_data: Dict[str, Any]) -> str:
        """Calculate overall trend direction."""
        try:
            data = trend_data.get("data", [])
            if not data:
                return "stable"

            # Simple trend calculation - compare first and last values
            if len(data) >= 2:
                first_value = data[0]["value"]
                last_value = data[-1]["value"]

                if last_value > first_value * 1.1:
                    return "rising"
                elif last_value < first_value * 0.9:
                    return "declining"
                else:
                    return "stable"
            else:
                return "stable"

        except Exception as e:
            logger.error(f"Error calculating trend direction: {e}")
            return "stable"

# Global reporting service instance
_reporting_service = None

def get_reporting_service() -> ReportingService:
    """
    Get or create reporting service instance.

    Returns:
        ReportingService instance
    """
    global _reporting_service
    if _reporting_service is None:
        _reporting_service = ReportingService()
    return _reporting_service
