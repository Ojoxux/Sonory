"""
Sonory Audio Analyzer - YAMNet-based audio classification service

Main FastAPI application entry point.
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

try:
    # Relative imports for package mode
    from .api.routes import router as api_router, http_exception_handler
    from .models.yamnet_wrapper import YAMNetManager
    from .services.analyzer import AudioAnalyzer
except ImportError:
    # Absolute imports for direct execution
    from api.routes import router as api_router, http_exception_handler
    from models.yamnet_wrapper import YAMNetManager
    from services.analyzer import AudioAnalyzer


# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application lifecycle."""
    logger.info("Starting Sonory Audio Analyzer service")
    
    # Initialize YAMNet model on startup
    try:
        yamnet_manager = YAMNetManager()
        await yamnet_manager.initialize()
        app.state.yamnet_manager = yamnet_manager
        
        # Initialize audio analyzer
        app.state.audio_analyzer = AudioAnalyzer(yamnet_manager)
        
        logger.info("YAMNet model initialized successfully")
    except Exception as e:
        logger.error("Failed to initialize YAMNet model", error=str(e))
        raise
    
    yield
    
    # Cleanup on shutdown
    logger.info("Shutting down Sonory Audio Analyzer service")
    if hasattr(app.state, 'yamnet_manager'):
        await app.state.yamnet_manager.cleanup()


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title="Sonory Audio Analyzer",
        description="YAMNet-based audio classification service for environmental sound analysis",
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )
    
    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure appropriately for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include API routes
    app.include_router(api_router, prefix="/api/v1")
    
    # Add exception handlers
    app.add_exception_handler(HTTPException, http_exception_handler)
    
    return app


# Create the app instance
app = create_app()


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "sonory-audio-analyzer",
        "version": "0.1.0"
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_config=None,  # Use structlog configuration
    ) 