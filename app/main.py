"""FastAPI application entrypoint for Public Domain Hunter."""

import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .alert_processor import get_alert_processor
from .ai_config_api import router as ai_config_router
from .ai_insights_api import router as ai_insights_router
from .analytics_api import router as analytics_router
from .api import router as api_router
from .auth_api import router as auth_router
from .business_intelligence_api import router as bi_router
from .database import create_tables
from .factory_api import router as factory_router
from .file_api import router as file_router
from .real_time_service import get_real_time_service
from .reporting_api import router as reporting_router
from .search_api import router as search_router
from .websocket_api import router as websocket_router


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""

    logger.info("Starting Public Domain Hunter API...")
    create_tables()

    alert_processor = get_alert_processor()
    await alert_processor.start()

    real_time_service = get_real_time_service()
    await real_time_service.start()

    try:
        yield
    finally:
        logger.info("Shutting down Public Domain Hunter API...")
        await alert_processor.stop()
        await real_time_service.stop()


app = FastAPI(
    title="Public Domain Hunter API",
    description="A SaaS platform for monitoring newly released public domain works",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["authentication"])
app.include_router(api_router, prefix="/api/v1", tags=["works"])
app.include_router(factory_router, prefix="/api/factory", tags=["factory"])
app.include_router(bi_router, prefix="/api/bi", tags=["business-intelligence"])
app.include_router(file_router, prefix="/api/files", tags=["files"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["analytics"])
app.include_router(websocket_router, prefix="/api/ws", tags=["websockets"])
app.include_router(search_router, prefix="/api/search", tags=["search"])
app.include_router(ai_insights_router, prefix="/api/ai", tags=["ai-insights"])
app.include_router(ai_config_router, prefix="/api/ai/config", tags=["ai-configuration"])
app.include_router(reporting_router, prefix="/api/reports", tags=["reporting"])


@app.get("/")
async def root():
    """Root endpoint."""

    return {
        "message": "Welcome to Public Domain Hunter API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""

    return {"status": "healthy", "service": "Public Domain Hunter API"}


def main() -> None:
    """Run the API using Uvicorn."""

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )


if __name__ == "__main__":
    main()
