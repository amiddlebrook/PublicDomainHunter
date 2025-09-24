"""
Alert processing and notification service.

Handles background processing of alerts, monitoring for new works,
and triggering notifications when criteria are met.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc

from app.database import get_db
from app.models import Work, Alert, User, WorkMetric
from app.email_service import get_email_service
from app.trends_service import get_trends_service
from app.amazon_service import get_amazon_service

logger = logging.getLogger(__name__)

class AlertProcessor:
    """
    Background service for processing alerts and sending notifications.

    Monitors for new public domain works and triggers alerts based on user criteria.
    """

    def __init__(self):
        """Initialize alert processor."""
        self.email_service = get_email_service()
        self.trends_service = get_trends_service()
        self.amazon_service = get_amazon_service()
        self.is_running = False

    async def start(self):
        """Start the alert processing service."""
        if self.is_running:
            logger.warning("Alert processor is already running")
            return

        self.is_running = True
        logger.info("Starting alert processor service")

        # Start background processing loop
        asyncio.create_task(self._process_loop())

    async def stop(self):
        """Stop the alert processing service."""
        self.is_running = False
        logger.info("Alert processor service stopped")

    async def _process_loop(self):
        """Main processing loop for alerts."""
        while self.is_running:
            try:
                await self._process_alerts()
                # Wait 5 minutes between processing cycles
                await asyncio.sleep(300)
            except Exception as e:
                logger.error(f"Error in alert processing loop: {e}")
                await asyncio.sleep(60)  # Wait 1 minute on error

    async def _process_alerts(self):
        """Process all active alerts."""
        db = next(get_db())

        try:
            # Get all active alerts
            active_alerts = db.query(Alert).filter(
                Alert.is_active == True
            ).all()

            logger.info(f"Processing {len(active_alerts)} active alerts")

            for alert in active_alerts:
                try:
                    await self._process_single_alert(alert, db)
                except Exception as e:
                    logger.error(f"Error processing alert {alert.id}: {e}")

        finally:
            db.close()

    async def _process_single_alert(self, alert: Alert, db: Session):
        """
        Process a single alert.

        Args:
            alert: Alert to process
            db: Database session
        """
        # Get the associated user
        user = db.query(User).filter(User.id == alert.user_id).first()
        if not user or not user.is_active:
            logger.warning(f"Alert {alert.id} has inactive user, skipping")
            return

        # Get the associated work
        work = db.query(Work).filter(Work.id == alert.work_id).first()
        if not work or work.status != "active":
            logger.warning(f"Alert {alert.id} has inactive work, skipping")
            return

        # Check if alert should be triggered
        should_trigger = await self._should_trigger_alert(alert, work, db)

        if should_trigger:
            await self._trigger_alert(alert, work, user, db)

    async def _should_trigger_alert(self, alert: Alert, work: Work, db: Session) -> bool:
        """
        Check if an alert should be triggered.

        Args:
            alert: Alert configuration
            work: Associated work
            db: Database session

        Returns:
            True if alert should be triggered
        """
        alert_type = alert.alert_type

        if alert_type == "new_work":
            # Check if work was created recently (within last 24 hours)
            return (datetime.utcnow() - work.created_at) < timedelta(hours=24)

        elif alert_type == "trend_change":
            # Check if trend score has changed significantly
            if not alert.threshold_value:
                return False

            # Get latest metrics
            latest_metric = db.query(WorkMetric).filter(
                WorkMetric.work_id == work.id
            ).order_by(desc(WorkMetric.metric_date)).first()

            if not latest_metric:
                return False

            # Check if trend score exceeds threshold
            return latest_metric.trend_score >= float(alert.threshold_value)

        elif alert_type == "competition_change":
            # Check if competition level has changed
            if not alert.threshold_value:
                return False

            competition_data = self.amazon_service.get_competition_data(work.title, work.author)

            # Check if competition score meets threshold
            competition_score = competition_data.get('average_sales_rank', 100000)
            return competition_score <= float(alert.threshold_value)

        elif alert_type == "monetization_opportunity":
            # Check if monetization potential is high
            if not alert.threshold_value:
                return False

            # Get latest metrics
            latest_metric = db.query(WorkMetric).filter(
                WorkMetric.work_id == work.id
            ).order_by(desc(WorkMetric.metric_date)).first()

            if not latest_metric:
                return False

            # Check if monetization potential exceeds threshold
            return latest_metric.monetization_potential >= float(alert.threshold_value)

        return False

    async def _trigger_alert(self, alert: Alert, work: Work, user: User, db: Session):
        """
        Trigger an alert notification.

        Args:
            alert: Alert configuration
            work: Associated work
            user: Alert owner
            db: Database session
        """
        # Prepare alert data
        alert_data = {
            'alert_id': alert.id,
            'alert_type': alert.alert_type,
            'work': {
                'id': work.id,
                'title': work.title,
                'author': work.author,
                'public_domain_year': work.public_domain_year,
                'media_type': work.media_type,
                'metadata': work.metadata or {}
            },
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username
            },
            'timestamp': datetime.utcnow().isoformat()
        }

        # Send email notification
        if self.email_service.is_available():
            success = self.email_service.send_alert_notification(user.email, alert_data)
            if success:
                logger.info(f"Alert notification sent for alert {alert.id}")
            else:
                logger.error(f"Failed to send alert notification for alert {alert.id}")

        # Log the alert trigger
        logger.info(f"Alert {alert.id} triggered for user {user.username}: {alert.alert_type}")

        # TODO: Send in-app notification
        # TODO: Store notification history

    async def process_new_works(self):
        """Process newly added works for potential alerts."""
        db = next(get_db())

        try:
            # Get works added in the last 24 hours
            yesterday = datetime.utcnow() - timedelta(hours=24)
            new_works = db.query(Work).filter(
                Work.created_at >= yesterday,
                Work.status == "active"
            ).all()

            logger.info(f"Processing {len(new_works)} new works for alerts")

            for work in new_works:
                # Find all alerts that might be interested in this work
                potential_alerts = db.query(Alert).filter(
                    Alert.is_active == True,
                    Alert.alert_type == "new_work"
                ).all()

                for alert in potential_alerts:
                    # Get the user for this alert
                    user = db.query(User).filter(User.id == alert.user_id).first()
                    if user and user.is_active:
                        await self._trigger_alert(alert, work, user, db)

        finally:
            db.close()

    async def send_weekly_digest(self):
        """Send weekly digest emails to all active users."""
        db = next(get_db())

        try:
            # Get all active users
            active_users = db.query(User).filter(User.is_active == True).all()

            for user in active_users:
                try:
                    digest_data = await self._generate_weekly_digest(user, db)
                    if digest_data:
                        success = self.email_service.send_weekly_digest(user.email, digest_data)
                        if success:
                            logger.info(f"Weekly digest sent to {user.email}")
                except Exception as e:
                    logger.error(f"Error sending weekly digest to {user.email}: {e}")

        finally:
            db.close()

    async def _generate_weekly_digest(self, user: User, db: Session) -> Dict[str, Any]:
        """
        Generate weekly digest data for a user.

        Args:
            user: User to generate digest for
            db: Database session

        Returns:
            Digest data dictionary
        """
        # Get user's works
        user_works = db.query(Work).filter(
            Work.user_id == user.id,
            Work.status == "active"
        ).all()

        # Get user's alerts
        user_alerts = db.query(Alert).filter(
            Alert.user_id == user.id,
            Alert.is_active == True
        ).all()

        # Get recent works with high trend scores
        recent_works = db.query(Work).filter(
            Work.status == "active"
        ).order_by(desc(Work.created_at)).limit(10).all()

        top_trending = [work for work in recent_works if work.metadata and work.metadata.get('trend_score', 0) > 70]

        # Get market opportunities
        opportunities = []
        for work in user_works:
            competition_data = self.amazon_service.get_competition_data(work.title, work.author)
            if competition_data.get('average_sales_rank', 100000) < 50000:  # High opportunity
                opportunities.append({
                    'title': work.title,
                    'monetization_score': 85,  # Mock score
                    'competition_level': 'low' if competition_data.get('total_competitors', 0) < 10 else 'medium'
                })

        return {
            'user': {
                'username': user.username,
                'email': user.email
            },
            'new_works': len(recent_works),
            'top_trending': top_trending[:5],
            'market_opportunities': opportunities[:3],
            'user_stats': {
                'total_works': len(user_works),
                'active_alerts': len(user_alerts),
                'works_viewed': len(user_works),  # Mock data
                'alerts_created': len(user_alerts)  # Mock data
            },
            'dashboard_url': f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/dashboard"
        }

    async def check_trend_alerts(self):
        """Check and trigger trend-based alerts."""
        db = next(get_db())

        try:
            # Get all trend-based alerts
            trend_alerts = db.query(Alert).filter(
                and_(
                    Alert.is_active == True,
                    Alert.alert_type == "trend_change"
                )
            ).all()

            for alert in trend_alerts:
                work = db.query(Work).filter(Work.id == alert.work_id).first()
                user = db.query(User).filter(User.id == alert.user_id).first()

                if work and user:
                    should_trigger = await self._should_trigger_alert(alert, work, db)
                    if should_trigger:
                        await self._trigger_alert(alert, work, user, db)

        finally:
            db.close()

# Global alert processor instance
_alert_processor = None

def get_alert_processor() -> AlertProcessor:
    """
    Get or create alert processor instance.

    Returns:
        AlertProcessor instance
    """
    global _alert_processor
    if _alert_processor is None:
        _alert_processor = AlertProcessor()
    return _alert_processor

# Import required modules
import os
