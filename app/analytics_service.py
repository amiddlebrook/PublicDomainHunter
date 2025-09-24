"""
Analytics service for generating charts and insights.

Provides data processing and aggregation for analytics dashboards,
including trend analysis, market insights, and performance metrics.
"""

import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_, case
from collections import defaultdict
import calendar

from app.database import get_db
from app.models import Work, User, Alert, WorkMetric

logger = logging.getLogger(__name__)

class AnalyticsService:
    """
    Service for generating analytics data and insights.

    Processes database queries and generates chart data for dashboards.
    """

    def __init__(self):
        """Initialize analytics service."""
        self.db = next(get_db())

    def get_dashboard_analytics(self, user_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Get comprehensive dashboard analytics.

        Args:
            user_id: Optional user ID to filter data for specific user

        Returns:
            Dictionary containing all dashboard metrics and charts
        """
        try:
            # Basic metrics
            total_works = self._get_total_works(user_id)
            total_users = self._get_total_users() if user_id is None else 1
            active_alerts = self._get_active_alerts(user_id)
            avg_trend_score = self._get_avg_trend_score(user_id)

            # Time series data
            works_over_time = self._get_works_over_time(user_id)
            trend_scores_over_time = self._get_trend_scores_over_time(user_id)

            # Category breakdowns
            media_types_breakdown = self._get_media_types_breakdown(user_id)
            publication_years_breakdown = self._get_publication_years_breakdown(user_id)
            languages_breakdown = self._get_languages_breakdown(user_id)

            # Top performers
            top_trending_works = self._get_top_trending_works(user_id, limit=10)
            top_authors = self._get_top_authors(user_id, limit=10)
            top_categories = self._get_top_categories(user_id, limit=10)

            # Market insights
            market_opportunities = self._get_market_opportunities(user_id)
            competition_analysis = self._get_competition_analysis(user_id)

            return {
                "overview": {
                    "total_works": total_works,
                    "total_users": total_users,
                    "active_alerts": active_alerts,
                    "avg_trend_score": round(avg_trend_score, 1) if avg_trend_score else 0,
                    "last_updated": datetime.utcnow().isoformat()
                },
                "time_series": {
                    "works_over_time": works_over_time,
                    "trend_scores_over_time": trend_scores_over_time
                },
                "breakdowns": {
                    "media_types": media_types_breakdown,
                    "publication_years": publication_years_breakdown,
                    "languages": languages_breakdown
                },
                "top_performers": {
                    "trending_works": top_trending_works,
                    "authors": top_authors,
                    "categories": top_categories
                },
                "market_insights": {
                    "opportunities": market_opportunities,
                    "competition": competition_analysis
                }
            }

        except Exception as e:
            logger.error(f"Error generating dashboard analytics: {e}")
            return {"error": "Failed to generate analytics"}

    def _get_total_works(self, user_id: Optional[int] = None) -> int:
        """Get total number of works."""
        query = self.db.query(func.count(Work.id))

        if user_id:
            query = query.filter(Work.user_id == user_id)

        return query.scalar() or 0

    def _get_total_users(self) -> int:
        """Get total number of users."""
        return self.db.query(func.count(User.id)).scalar() or 0

    def _get_active_alerts(self, user_id: Optional[int] = None) -> int:
        """Get number of active alerts."""
        query = self.db.query(func.count(Alert.id)).filter(Alert.is_active == True)

        if user_id:
            query = query.filter(Alert.user_id == user_id)

        return query.scalar() or 0

    def _get_avg_trend_score(self, user_id: Optional[int] = None) -> float:
        """Get average trend score."""
        query = self.db.query(func.avg(Work.metadata['trend_score'].as_float()))

        if user_id:
            query = query.filter(Work.user_id == user_id)

        result = query.scalar()
        return float(result) if result else 0.0

    def _get_works_over_time(self, user_id: Optional[int] = None, days: int = 30) -> List[Dict[str, Any]]:
        """
        Get works created over time.

        Args:
            user_id: Optional user ID filter
            days: Number of days to look back

        Returns:
            List of daily work counts
        """
        start_date = datetime.utcnow() - timedelta(days=days)

        # Create date range
        date_range = []
        current_date = start_date
        while current_date <= datetime.utcnow():
            date_range.append(current_date.date())
            current_date += timedelta(days=1)

        # Query daily counts
        query = self.db.query(
            func.date(Work.created_at).label('date'),
            func.count(Work.id).label('count')
        ).filter(Work.created_at >= start_date)

        if user_id:
            query = query.filter(Work.user_id == user_id)

        daily_counts = dict(query.group_by(func.date(Work.created_at)).all())

        # Format result
        result = []
        for date in date_range:
            count = daily_counts.get(date, 0)
            result.append({
                "date": date.isoformat(),
                "count": count,
                "cumulative": sum(r["count"] for r in result) + count
            })

        return result

    def _get_trend_scores_over_time(self, user_id: Optional[int] = None, days: int = 30) -> List[Dict[str, Any]]:
        """
        Get average trend scores over time.

        Args:
            user_id: Optional user ID filter
            days: Number of days to look back

        Returns:
            List of daily average trend scores
        """
        start_date = datetime.utcnow() - timedelta(days=days)

        query = self.db.query(
            func.date(Work.created_at).label('date'),
            func.avg(Work.metadata['trend_score'].as_float()).label('avg_score')
        ).filter(
            and_(
                Work.created_at >= start_date,
                Work.metadata.has_key('trend_score')
            )
        )

        if user_id:
            query = query.filter(Work.user_id == user_id)

        daily_scores = dict(query.group_by(func.date(Work.created_at)).all())

        # Format result
        result = []
        current_date = start_date
        while current_date <= datetime.utcnow():
            date_str = current_date.date().isoformat()
            avg_score = daily_scores.get(date_str, 0)
            result.append({
                "date": date_str,
                "avg_score": round(float(avg_score), 1) if avg_score else 0,
                "trend": "up" if len(result) > 1 and avg_score > result[-2]["avg_score"] else "down" if len(result) > 1 else "stable"
            })
            current_date += timedelta(days=1)

        return result

    def _get_media_types_breakdown(self, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get breakdown by media types."""
        query = self.db.query(
            Work.media_type,
            func.count(Work.id).label('count')
        )

        if user_id:
            query = query.filter(Work.user_id == user_id)

        results = query.group_by(Work.media_type).all()

        media_type_colors = {
            'book': '#3b82f6',
            'article': '#10b981',
            'document': '#f59e0b',
            'image': '#8b5cf6',
            'audio': '#ef4444',
            'video': '#06b6d4'
        }

        return [
            {
                "type": media_type or 'unknown',
                "count": count,
                "percentage": 0,  # Will be calculated on frontend
                "color": media_type_colors.get(media_type, '#6b7280')
            }
            for media_type, count in results
        ]

    def _get_publication_years_breakdown(self, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get breakdown by publication years."""
        query = self.db.query(
            Work.public_domain_year,
            func.count(Work.id).label('count')
        ).filter(Work.public_domain_year.isnot(None))

        if user_id:
            query = query.filter(Work.user_id == user_id)

        results = query.group_by(Work.public_domain_year).order_by(Work.public_domain_year).all()

        return [
            {
                "year": int(year),
                "count": count,
                "decade": f"{(int(year) // 10) * 10}s"
            }
            for year, count in results
        ]

    def _get_languages_breakdown(self, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get breakdown by languages."""
        query = self.db.query(
            Work.language,
            func.count(Work.id).label('count')
        ).filter(Work.language.isnot(None))

        if user_id:
            query = query.filter(Work.user_id == user_id)

        results = query.group_by(Work.language).all()

        language_names = {
            'en': 'English',
            'fr': 'French',
            'de': 'German',
            'es': 'Spanish',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'ja': 'Japanese',
            'zh': 'Chinese',
            'ar': 'Arabic'
        }

        return [
            {
                "code": language,
                "name": language_names.get(language, language.upper()),
                "count": count
            }
            for language, count in results
        ]

    def _get_top_trending_works(self, user_id: Optional[int] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top trending works."""
        query = self.db.query(Work).filter(
            Work.metadata.has_key('trend_score')
        ).order_by(desc(Work.metadata['trend_score'].as_float()))

        if user_id:
            query = query.filter(Work.user_id == user_id)

        works = query.limit(limit).all()

        return [
            {
                "id": work.id,
                "title": work.title,
                "author": work.author,
                "trend_score": work.metadata.get('trend_score', 0) if work.metadata else 0,
                "media_type": work.media_type,
                "created_at": work.created_at.isoformat()
            }
            for work in works
        ]

    def _get_top_authors(self, user_id: Optional[int] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top authors by work count."""
        query = self.db.query(
            Work.author,
            func.count(Work.id).label('work_count')
        ).filter(Work.author.isnot(None))

        if user_id:
            query = query.filter(Work.user_id == user_id)

        results = query.group_by(Work.author).order_by(desc('work_count')).limit(limit).all()

        return [
            {
                "author": author,
                "work_count": count,
                "percentage": 0  # Will be calculated on frontend
            }
            for author, count in results
        ]

    def _get_top_categories(self, user_id: Optional[int] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top content categories."""
        # This is a simplified version - in a real system you'd have a categories table
        query = self.db.query(
            func.coalesce(Work.metadata['content_type'].as_string(), 'unknown').label('category'),
            func.count(Work.id).label('count')
        )

        if user_id:
            query = query.filter(Work.user_id == user_id)

        results = query.group_by('category').order_by(desc('count')).limit(limit).all()

        return [
            {
                "category": category,
                "count": count
            }
            for category, count in results
        ]

    def _get_market_opportunities(self, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get market opportunity insights."""
        # Find works with high trend scores but low competition
        query = self.db.query(Work).filter(
            and_(
                Work.metadata.has_key('trend_score'),
                Work.metadata['trend_score'].as_float() >= 70  # High trend
            )
        )

        if user_id:
            query = query.filter(Work.user_id == user_id)

        works = query.all()

        opportunities = []
        for work in works:
            # Mock competition analysis - in real system this would query external APIs
            competition_score = 30  # Low competition
            monetization_potential = work.metadata.get('trend_score', 0) if work.metadata else 0

            if competition_score < 50:  # Low competition threshold
                opportunities.append({
                    "work_id": work.id,
                    "title": work.title,
                    "author": work.author,
                    "trend_score": work.metadata.get('trend_score', 0) if work.metadata else 0,
                    "competition_score": competition_score,
                    "monetization_potential": monetization_potential,
                    "opportunity_level": "high" if monetization_potential > 80 else "medium"
                })

        return sorted(opportunities, key=lambda x: x['monetization_potential'], reverse=True)[:10]

    def _get_competition_analysis(self, user_id: Optional[int] = None) -> Dict[str, Any]:
        """Get competition analysis data."""
        # Mock competition data - in real system this would analyze market data
        return {
            "total_market_size": "Large",
            "competition_level": "Medium",
            "market_trends": "Growing",
            "top_competitors": [
                {"name": "Project Gutenberg", "market_share": 45},
                {"name": "Internet Archive", "market_share": 30},
                {"name": "HathiTrust", "market_share": 15},
                {"name": "Others", "market_share": 10}
            ],
            "recommendations": [
                "Focus on niche categories with low competition",
                "Leverage unique metadata for better discoverability",
                "Consider partnerships with existing platforms"
            ]
        }

    def get_user_analytics(self, user_id: int) -> Dict[str, Any]:
        """
        Get user-specific analytics.

        Args:
            user_id: User ID

        Returns:
            User analytics data
        """
        try:
            # User activity metrics
            total_works = self._get_total_works(user_id)
            active_alerts = self._get_active_alerts(user_id)
            works_this_month = self._get_works_this_month(user_id)
            avg_trend_score = self._get_avg_trend_score(user_id)

            # User engagement trends
            activity_over_time = self._get_user_activity_over_time(user_id)
            alert_triggers = self._get_user_alert_triggers(user_id)

            # Content analysis
            user_content_types = self._get_media_types_breakdown(user_id)
            user_languages = self._get_languages_breakdown(user_id)

            return {
                "user_metrics": {
                    "total_works": total_works,
                    "active_alerts": active_alerts,
                    "works_this_month": works_this_month,
                    "avg_trend_score": round(avg_trend_score, 1) if avg_trend_score else 0,
                    "account_age_days": self._get_account_age(user_id)
                },
                "activity_trends": {
                    "activity_over_time": activity_over_time,
                    "alert_triggers": alert_triggers
                },
                "content_analysis": {
                    "content_types": user_content_types,
                    "languages": user_languages
                }
            }

        except Exception as e:
            logger.error(f"Error generating user analytics: {e}")
            return {"error": "Failed to generate user analytics"}

    def _get_works_this_month(self, user_id: int) -> int:
        """Get works created this month by user."""
        start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        return self.db.query(func.count(Work.id)).filter(
            and_(
                Work.user_id == user_id,
                Work.created_at >= start_of_month
            )
        ).scalar() or 0

    def _get_account_age(self, user_id: int) -> int:
        """Get account age in days."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return 0

        return (datetime.utcnow() - user.created_at).days

    def _get_user_activity_over_time(self, user_id: int, days: int = 90) -> List[Dict[str, Any]]:
        """Get user activity over time."""
        start_date = datetime.utcnow() - timedelta(days=days)

        # Get daily activity
        daily_works = self.db.query(
            func.date(Work.created_at).label('date'),
            func.count(Work.id).label('works_created')
        ).filter(
            and_(
                Work.user_id == user_id,
                Work.created_at >= start_date
            )
        ).group_by(func.date(Work.created_at)).all()

        daily_alerts = self.db.query(
            func.date(Alert.created_at).label('date'),
            func.count(Alert.id).label('alerts_created')
        ).filter(
            and_(
                Alert.user_id == user_id,
                Alert.created_at >= start_date
            )
        ).group_by(func.date(Alert.created_at)).all()

        # Combine data
        activity_dict = {}
        for date, works in daily_works:
            if date not in activity_dict:
                activity_dict[date] = {'works': 0, 'alerts': 0}
            activity_dict[date]['works'] = works

        for date, alerts in daily_alerts:
            if date not in activity_dict:
                activity_dict[date] = {'works': 0, 'alerts': 0}
            activity_dict[date]['alerts'] = alerts

        # Format result
        result = []
        current_date = start_date
        while current_date <= datetime.utcnow():
            date_str = current_date.date().isoformat()
            activity = activity_dict.get(date_str, {'works': 0, 'alerts': 0})

            result.append({
                "date": date_str,
                "works_created": activity['works'],
                "alerts_created": activity['alerts'],
                "total_activity": activity['works'] + activity['alerts']
            })
            current_date += timedelta(days=1)

        return result

    def _get_user_alert_triggers(self, user_id: int) -> List[Dict[str, Any]]:
        """Get user's alert trigger history."""
        # Mock data - in real system this would query alert trigger logs
        return [
            {"date": "2024-01-15", "alert_type": "trend_change", "count": 3},
            {"date": "2024-01-10", "alert_type": "new_work", "count": 1},
            {"date": "2024-01-05", "alert_type": "competition_change", "count": 2}
        ]

# Global analytics service instance
_analytics_service = None

def get_analytics_service() -> AnalyticsService:
    """
    Get or create analytics service instance.

    Returns:
        AnalyticsService instance
    """
    global _analytics_service
    if _analytics_service is None:
        _analytics_service = AnalyticsService()
    return _analytics_service
