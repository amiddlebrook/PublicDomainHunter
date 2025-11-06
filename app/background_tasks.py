"""
Background tasks for Public Domain Hunter.

Handles asynchronous processing of work analysis, metrics refresh,
and other long-running operations.
"""

import logging
from datetime import datetime
from sqlalchemy.orm import Session

from app.models import Work, WorkMetric
from app.trends_service import get_trends_service
from app.amazon_service import get_amazon_service

logger = logging.getLogger(__name__)


def analyze_work_background(work_id: int, db: Session) -> None:
    """
    Analyze a work in the background to calculate trend score and competition metrics.

    This task runs after a work is created to populate initial metrics:
    - Google Trends interest score
    - Amazon sales rank and competition data
    - Overall trend score calculation

    Args:
        work_id: ID of the work to analyze
        db: Database session
    """
    try:
        logger.info(f"Starting background analysis for work {work_id}")

        # Get the work
        work = db.query(Work).filter(Work.id == work_id).first()
        if not work:
            logger.error(f"Work {work_id} not found for background analysis")
            return

        # Get services
        trends_service = get_trends_service()
        amazon_service = get_amazon_service()

        # Calculate trend score from Google Trends
        trend_score = trends_service.get_trend_score(work.title, work.author or "")
        logger.info(f"Calculated trend score for '{work.title}': {trend_score}")

        # Get Amazon sales rank
        sales_rank = amazon_service.get_sales_rank(work.title, work.author or "")
        if sales_rank:
            logger.info(f"Found Amazon sales rank for '{work.title}': {sales_rank}")

        # Get competition data
        competition_data = amazon_service.get_competition_data(work.title, work.author or "")
        competition_score = 100 - (competition_data.get('total_competitors', 0) * 5)  # Simple scoring
        competition_score = max(0, min(100, competition_score))  # Clamp between 0-100

        # Calculate search volume estimate (based on trend score)
        search_volume = int(trend_score * 1000)  # Scale trend score to search volume estimate

        # Calculate demand score (composite of trend and sales rank)
        demand_score = trend_score
        if sales_rank and sales_rank < 100000:  # Good sales rank boosts demand
            demand_score = min(100, demand_score * 1.2)

        # Calculate monetization potential
        monetization_potential = (demand_score + competition_score) / 2

        # Update work metadata
        if not work.metadata:
            work.metadata = {}
        work.metadata['trend_score'] = round(trend_score, 2)
        work.metadata['last_analysis'] = datetime.utcnow().isoformat()
        work.metadata['analyzed'] = True

        # Create work metric record
        metric = WorkMetric(
            work_id=work.id,
            metric_date=datetime.utcnow(),
            search_volume=search_volume,
            trend_score=trend_score,
            competition_score=competition_score,
            demand_score=demand_score,
            monetization_potential=monetization_potential,
            amazon_sales_rank=sales_rank,
            google_trends_interest=trend_score,
            metadata={
                'competitors': competition_data.get('total_competitors', 0),
                'average_competitor_sales_rank': competition_data.get('average_sales_rank'),
                'market_saturation': competition_data.get('market_saturation', 'unknown')
            }
        )

        db.add(metric)
        db.commit()

        logger.info(f"Completed background analysis for work {work_id}: "
                   f"trend={trend_score}, demand={demand_score}, competition={competition_score}")

    except Exception as e:
        logger.error(f"Error in background analysis for work {work_id}: {e}", exc_info=True)
        db.rollback()


def refresh_metrics_background(work_id: int, db: Session) -> None:
    """
    Refresh metrics for an existing work in the background.

    Updates trend data, competition analysis, and other time-sensitive metrics.
    Creates a new WorkMetric record with current data.

    Args:
        work_id: ID of the work to refresh metrics for
        db: Database session
    """
    try:
        logger.info(f"Starting metrics refresh for work {work_id}")

        # Get the work
        work = db.query(Work).filter(Work.id == work_id).first()
        if not work:
            logger.error(f"Work {work_id} not found for metrics refresh")
            return

        # Get the most recent metric to compare
        latest_metric = db.query(WorkMetric).filter(
            WorkMetric.work_id == work_id
        ).order_by(WorkMetric.metric_date.desc()).first()

        # Get services
        trends_service = get_trends_service()
        amazon_service = get_amazon_service()

        # Fetch fresh data
        trend_score = trends_service.get_trend_score(work.title, work.author or "")
        sales_rank = amazon_service.get_sales_rank(work.title, work.author or "")
        competition_data = amazon_service.get_competition_data(work.title, work.author or "")

        # Calculate metrics
        competition_score = 100 - (competition_data.get('total_competitors', 0) * 5)
        competition_score = max(0, min(100, competition_score))

        search_volume = int(trend_score * 1000)

        demand_score = trend_score
        if sales_rank and sales_rank < 100000:
            demand_score = min(100, demand_score * 1.2)

        monetization_potential = (demand_score + competition_score) / 2

        # Create new metric record
        new_metric = WorkMetric(
            work_id=work.id,
            metric_date=datetime.utcnow(),
            search_volume=search_volume,
            trend_score=trend_score,
            competition_score=competition_score,
            demand_score=demand_score,
            monetization_potential=monetization_potential,
            amazon_sales_rank=sales_rank,
            google_trends_interest=trend_score,
            metadata={
                'competitors': competition_data.get('total_competitors', 0),
                'average_competitor_sales_rank': competition_data.get('average_sales_rank'),
                'market_saturation': competition_data.get('market_saturation', 'unknown'),
                'refresh_type': 'manual'
            }
        )

        db.add(new_metric)

        # Update work metadata
        if not work.metadata:
            work.metadata = {}
        work.metadata['trend_score'] = round(trend_score, 2)
        work.metadata['last_refresh'] = datetime.utcnow().isoformat()

        # Log changes if there was a previous metric
        if latest_metric:
            trend_change = trend_score - latest_metric.trend_score
            logger.info(f"Metrics refreshed for work {work_id}: "
                       f"trend changed by {trend_change:+.2f} "
                       f"(was {latest_metric.trend_score}, now {trend_score})")
        else:
            logger.info(f"Created first metric record for work {work_id}: trend={trend_score}")

        db.commit()

        logger.info(f"Completed metrics refresh for work {work_id}")

    except Exception as e:
        logger.error(f"Error refreshing metrics for work {work_id}: {e}", exc_info=True)
        db.rollback()
