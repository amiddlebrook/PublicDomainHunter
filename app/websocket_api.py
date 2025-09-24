"""
WebSocket API endpoints for real-time updates.

Handles WebSocket connections for live notifications, analytics updates,
and real-time data streaming.
"""

import logging
from typing import Dict, Any
from datetime import datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_active_user
from app.real_time_service import get_real_time_service, connection_manager
from app.analytics_service import get_analytics_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for real-time updates.

    Establishes a WebSocket connection for a specific user to receive
    live notifications and updates.
    """
    try:
        # Verify user exists and is active
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            await websocket.close(code=4001, reason="User not found")
            return

        if not user.is_active:
            await websocket.close(code=4002, reason="User account is inactive")
            return

        # Connect to WebSocket
        connection_id = await connection_manager.connect(websocket, user_id)

        # Send welcome message
        welcome_message = {
            "type": "connection_established",
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "connection_id": connection_id,
                "user_id": user_id,
                "message": "Connected to Public Domain Hunter real-time updates"
            }
        }

        await websocket.send_text(json.dumps(welcome_message))

        # Send current analytics summary
        try:
            analytics_service = get_analytics_service()
            analytics_data = analytics_service.get_dashboard_analytics(user_id)
            overview = analytics_data.get("overview", {})

            summary_message = {
                "type": "analytics_summary",
                "timestamp": datetime.utcnow().isoformat(),
                "data": {
                    "total_works": overview.get("total_works", 0),
                    "active_alerts": overview.get("active_alerts", 0),
                    "avg_trend_score": overview.get("avg_trend_score", 0),
                    "connected_users": connection_manager.get_user_count()
                }
            }

            await websocket.send_text(json.dumps(summary_message))

        except Exception as e:
            logger.error(f"Error sending analytics summary: {e}")

        # Handle messages
        while True:
            try:
                data = await websocket.receive_text()

                # Handle ping/pong for connection health
                if data == "ping":
                    await websocket.send_text(json.dumps({
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat()
                    }))
                    continue

                # Handle other message types as needed
                message_data = json.loads(data)

                # Echo back for now - can be extended for specific message handling
                response = {
                    "type": "message_echo",
                    "timestamp": datetime.utcnow().isoformat(),
                    "data": message_data
                }

                await websocket.send_text(json.dumps(response))

            except json.JSONDecodeError:
                # Invalid JSON - send error
                error_message = {
                    "type": "error",
                    "timestamp": datetime.utcnow().isoformat(),
                    "data": {
                        "error": "Invalid JSON format"
                    }
                }
                await websocket.send_text(json.dumps(error_message))

    except WebSocketDisconnect:
        # Normal disconnection
        await connection_manager.disconnect(connection_id)
        logger.info(f"WebSocket disconnected normally: {connection_id}")

    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        try:
            await connection_manager.disconnect(connection_id)
        except:
            pass

@router.get("/ws/status")
async def get_websocket_status(
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Get WebSocket connection status.

    Returns information about the current user's WebSocket connections
    and overall system status.
    """
    try:
        real_time_service = get_real_time_service()
        stats = real_time_service.get_connection_stats()

        user_connections = []
        if current_user.id in connection_manager.user_connections:
            user_connections = list(connection_manager.user_connections[current_user.id])

        return {
            "connected": len(user_connections) > 0,
            "connection_count": len(user_connections),
            "connection_ids": user_connections,
            "total_system_connections": stats["total_connections"],
            "total_users_connected": stats["unique_users"],
            "service_running": stats["service_running"]
        }

    except Exception as e:
        logger.error(f"Error getting WebSocket status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get connection status")

@router.post("/ws/test-notification/{user_id}")
async def send_test_notification(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Send a test notification to a user (admin function).

    Args:
        user_id: User ID to send test notification to
        current_user: Admin user making the request
        db: Database session

    Returns:
        Test notification status
    """
    try:
        # Verify target user exists
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="Target user not found")

        # Send test notification
        real_time_service = get_real_time_service()
        await real_time_service.send_system_alert(
            f"Test notification from admin user {current_user.username}",
            "info"
        )

        return {
            "message": "Test notification sent",
            "target_user": target_user.username,
            "notification_type": "system_alert"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending test notification: {e}")
        raise HTTPException(status_code=500, detail="Failed to send test notification")

@router.get("/ws/connections")
async def get_all_connections(
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Get all WebSocket connections (admin function).

    Returns information about all active WebSocket connections.
    """
    try:
        real_time_service = get_real_time_service()
        stats = real_time_service.get_connection_stats()

        connections = []
        for connection_id, user_id in connection_manager.connection_users.items():
            user = db.query(User).filter(User.id == user_id).first()
            connections.append({
                "connection_id": connection_id,
                "user_id": user_id,
                "username": user.username if user else "Unknown",
                "connected_at": datetime.utcnow().isoformat()  # Would track actual time in real implementation
            })

        return {
            "total_connections": stats["total_connections"],
            "unique_users": stats["unique_users"],
            "service_running": stats["service_running"],
            "connections": connections
        }

    except Exception as e:
        logger.error(f"Error getting connections: {e}")
        raise HTTPException(status_code=500, detail="Failed to get connections")

# Import required modules
import json
