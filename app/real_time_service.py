"""
WebSocket service for real-time updates.

Handles WebSocket connections for live notifications, analytics updates,
and real-time data streaming.
"""

import asyncio
import json
import logging
from typing import Dict, List, Set, Any, Optional
from datetime import datetime
from enum import Enum
import uuid

from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import User, Work, Alert, WorkMetric
from app.analytics_service import get_analytics_service

logger = logging.getLogger(__name__)

class ConnectionManager:
    """
    Manages WebSocket connections for real-time updates.

    Handles connection lifecycle, message broadcasting, and user sessions.
    """

    def __init__(self):
        """Initialize connection manager."""
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_connections: Dict[int, Set[str]] = {}
        self.connection_users: Dict[str, int] = {}
        self.notification_queue: asyncio.Queue = asyncio.Queue()
        self.is_running = False

    async def connect(self, websocket: WebSocket, user_id: int) -> str:
        """
        Accept WebSocket connection and register user.

        Args:
            websocket: WebSocket connection
            user_id: User ID

        Returns:
            Connection ID
        """
        await websocket.accept()

        # Generate unique connection ID
        connection_id = str(uuid.uuid4())

        # Store connection
        self.active_connections[connection_id] = websocket
        self.connection_users[connection_id] = user_id

        # Register user's connection
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(connection_id)

        logger.info(f"WebSocket connected: {connection_id} for user {user_id}")
        return connection_id

    async def disconnect(self, connection_id: str):
        """
        Remove WebSocket connection.

        Args:
            connection_id: Connection ID to remove
        """
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]

        if connection_id in self.connection_users:
            user_id = self.connection_users[connection_id]
            del self.connection_users[connection_id]

            # Remove from user's connections
            if user_id in self.user_connections:
                self.user_connections[user_id].discard(connection_id)
                if not self.user_connections[user_id]:
                    del self.user_connections[user_id]

        logger.info(f"WebSocket disconnected: {connection_id}")

    async def send_personal_message(self, message: Dict[str, Any], user_id: int):
        """
        Send message to specific user.

        Args:
            message: Message to send
            user_id: Target user ID
        """
        if user_id not in self.user_connections:
            return

        message_data = json.dumps(message)

        disconnected_connections = []
        for connection_id in self.user_connections[user_id]:
            try:
                websocket = self.active_connections[connection_id]
                await websocket.send_text(message_data)
            except Exception as e:
                logger.error(f"Error sending message to {connection_id}: {e}")
                disconnected_connections.append(connection_id)

        # Clean up disconnected connections
        for connection_id in disconnected_connections:
            await self.disconnect(connection_id)

    async def broadcast_message(self, message: Dict[str, Any]):
        """
        Broadcast message to all connected users.

        Args:
            message: Message to broadcast
        """
        message_data = json.dumps(message)

        disconnected_connections = []
        for connection_id, websocket in self.active_connections.items():
            try:
                await websocket.send_text(message_data)
            except Exception as e:
                logger.error(f"Error broadcasting to {connection_id}: {e}")
                disconnected_connections.append(connection_id)

        # Clean up disconnected connections
        for connection_id in disconnected_connections:
            await self.disconnect(connection_id)

    async def send_to_room(self, message: Dict[str, Any], room: str):
        """
        Send message to users in a specific room.

        Args:
            message: Message to send
            room: Room identifier
        """
        # For now, just broadcast to all users
        # In a more complex system, you'd have room management
        await self.broadcast_message(message)

    def get_connection_count(self) -> int:
        """Get total number of active connections."""
        return len(self.active_connections)

    def get_user_count(self) -> int:
        """Get number of unique connected users."""
        return len(self.user_connections)

# Global connection manager
connection_manager = ConnectionManager()

class NotificationType(Enum):
    """Types of real-time notifications."""
    ALERT_TRIGGERED = "alert_triggered"
    NEW_WORK = "new_work"
    ANALYTICS_UPDATE = "analytics_update"
    SYSTEM_ALERT = "system_alert"
    USER_ACTIVITY = "user_activity"

class RealTimeService:
    """
    Service for managing real-time updates and notifications.

    Handles background tasks for live updates and notification broadcasting.
    """

    def __init__(self):
        """Initialize real-time service."""
        self.analytics_service = get_analytics_service()
        self.is_running = False
        self.update_tasks = set()

    async def start(self):
        """Start the real-time service."""
        if self.is_running:
            logger.warning("Real-time service is already running")
            return

        self.is_running = True
        logger.info("Starting real-time service")

        # Start background update tasks
        self.update_tasks.add(asyncio.create_task(self._analytics_update_loop()))
        self.update_tasks.add(asyncio.create_task(self._notification_processor()))

        # Start connection cleanup task
        self.update_tasks.add(asyncio.create_task(self._connection_cleanup_loop()))

    async def stop(self):
        """Stop the real-time service."""
        self.is_running = False
        logger.info("Stopping real-time service")

        # Cancel all tasks
        for task in self.update_tasks:
            task.cancel()

        self.update_tasks.clear()

    async def _analytics_update_loop(self):
        """Background task for sending periodic analytics updates."""
        while self.is_running:
            try:
                # Send real-time metrics every 30 seconds
                await self._broadcast_real_time_metrics()
                await asyncio.sleep(30)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in analytics update loop: {e}")
                await asyncio.sleep(60)  # Wait before retrying

    async def _notification_processor(self):
        """Background task for processing notification queue."""
        while self.is_running:
            try:
                # Process notification queue
                while not self.notification_queue.empty():
                    notification = await self.notification_queue.get()
                    await self._process_notification(notification)

                await asyncio.sleep(1)  # Small delay to prevent busy waiting
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in notification processor: {e}")
                await asyncio.sleep(5)

    async def _connection_cleanup_loop(self):
        """Background task for cleaning up stale connections."""
        while self.is_running:
            try:
                # Check for stale connections every 5 minutes
                await asyncio.sleep(300)

                stale_connections = []
                current_time = datetime.utcnow()

                for connection_id, websocket in connection_manager.active_connections.items():
                    try:
                        # Send ping to check if connection is alive
                        await websocket.ping()
                    except Exception:
                        stale_connections.append(connection_id)

                # Clean up stale connections
                for connection_id in stale_connections:
                    await connection_manager.disconnect(connection_id)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in connection cleanup: {e}")

    async def _broadcast_real_time_metrics(self):
        """Broadcast real-time metrics to all connected users."""
        try:
            # Get current metrics for all users
            db = next(get_db())

            # Get global metrics
            total_works = db.query(func.count(Work.id)).scalar() or 0
            active_alerts = db.query(func.count(Alert.id)).filter(Alert.is_active == True).scalar() or 0
            avg_trend_score = db.query(func.avg(Work.metadata['trend_score'].as_float())).scalar() or 0

            db.close()

            metrics_message = {
                "type": "real_time_metrics",
                "timestamp": datetime.utcnow().isoformat(),
                "data": {
                    "total_works": total_works,
                    "active_alerts": active_alerts,
                    "avg_trend_score": round(float(avg_trend_score), 1) if avg_trend_score else 0,
                    "connected_users": connection_manager.get_user_count()
                }
            }

            await connection_manager.broadcast_message(metrics_message)

        except Exception as e:
            logger.error(f"Error broadcasting real-time metrics: {e}")

    async def _process_notification(self, notification: Dict[str, Any]):
        """
        Process a single notification.

        Args:
            notification: Notification data
        """
        try:
            notification_type = notification.get("type")
            user_id = notification.get("user_id")
            data = notification.get("data", {})

            message = {
                "type": "notification",
                "notification_type": notification_type,
                "timestamp": datetime.utcnow().isoformat(),
                "data": data
            }

            if user_id:
                await connection_manager.send_personal_message(message, user_id)
            else:
                await connection_manager.broadcast_message(message)

        except Exception as e:
            logger.error(f"Error processing notification: {e}")

    async def send_alert_notification(self, user_id: int, alert_data: Dict[str, Any]):
        """
        Send real-time alert notification.

        Args:
            user_id: User ID to notify
            alert_data: Alert information
        """
        notification = {
            "type": NotificationType.ALERT_TRIGGERED.value,
            "user_id": user_id,
            "data": alert_data
        }

        await self.notification_queue.put(notification)

    async def send_new_work_notification(self, work_data: Dict[str, Any]):
        """
        Send new work notification to all users.

        Args:
            work_data: New work information
        """
        notification = {
            "type": NotificationType.NEW_WORK.value,
            "user_id": None,  # Broadcast to all
            "data": work_data
        }

        await self.notification_queue.put(notification)

    async def send_system_alert(self, message: str, level: str = "info"):
        """
        Send system-wide alert.

        Args:
            message: Alert message
            level: Alert level (info, warning, error)
        """
        notification = {
            "type": NotificationType.SYSTEM_ALERT.value,
            "user_id": None,
            "data": {
                "message": message,
                "level": level
            }
        }

        await self.notification_queue.put(notification)

    async def send_analytics_update(self, user_id: int, analytics_data: Dict[str, Any]):
        """
        Send analytics update to user.

        Args:
            user_id: User ID
            analytics_data: Updated analytics data
        """
        notification = {
            "type": NotificationType.ANALYTICS_UPDATE.value,
            "user_id": user_id,
            "data": analytics_data
        }

        await self.notification_queue.put(notification)

    def get_connection_stats(self) -> Dict[str, Any]:
        """Get connection statistics."""
        return {
            "total_connections": connection_manager.get_connection_count(),
            "unique_users": connection_manager.get_user_count(),
            "service_running": self.is_running
        }

# Global real-time service
_real_time_service = None

def get_real_time_service() -> RealTimeService:
    """
    Get or create real-time service instance.

    Returns:
        RealTimeService instance
    """
    global _real_time_service
    if _real_time_service is None:
        _real_time_service = RealTimeService()
    return _real_time_service
