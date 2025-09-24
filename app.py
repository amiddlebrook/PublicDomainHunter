"""
Public Domain Hunter - FastAPI Backend

A SaaS platform for monitoring and managing public domain content.
Backend API server built with FastAPI.
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn
from typing import List, Optional
import logging
import asyncio

from app.database import create_tables
from app.api import router as api_router
from app.auth_api import router as auth_router
from app.file_api import router as file_router
from app.analytics_api import router as analytics_router
from app.websocket_api import router as websocket_router
from app.alert_processor import get_alert_processor
from app.real_time_service import get_real_time_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer(auto_error=False)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting Public Domain Hunter API...")

    # Create database tables
    create_tables()

    # Start alert processor
    alert_processor = get_alert_processor()
    await alert_processor.start()

    # Start real-time service
    real_time_service = get_real_time_service()
    await real_time_service.start()

    yield

    # Shutdown
    logger.info("Shutting down Public Domain Hunter API...")
    await alert_processor.stop()
    await real_time_service.stop()

# Create FastAPI app
app = FastAPI(
    title="Public Domain Hunter API",
    description="A SaaS platform for monitoring newly released public domain works",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(auth_router, prefix="/api/auth", tags=["authentication"])
app.include_router(api_router, prefix="/api/v1", tags=["works"])
app.include_router(file_router, prefix="/api/files", tags=["files"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["analytics"])
app.include_router(websocket_router, prefix="/api/ws", tags=["websockets"])

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Public Domain Hunter API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "Public Domain Hunter API"}

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
