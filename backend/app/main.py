from __future__ import annotations

import logging
import uuid
from collections import deque
from contextlib import asynccontextmanager
from threading import Lock

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from backend.app.api import api_router
from backend.app.collectors import build_collectors
from backend.app.config import Settings, get_settings
from backend.app.database.init_db import init_database
from backend.app.database.session import build_engine, build_session_factory
from backend.app.generation import GenerationService


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    engine = build_engine(settings.database_url)
    session_factory = build_session_factory(engine)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        init_database(engine)
        yield
        engine.dispose()

    application = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="Content Intelligence & Growth Engine",
        debug=settings.app_debug,
        lifespan=lifespan,
    )
    application.state.settings = settings
    application.state.engine = engine
    application.state.session_factory = session_factory
    application.state.collector_factory = lambda: build_collectors(settings)
    application.state.generation_factory = lambda: GenerationService(settings)
    application.state.generate_request_times = deque()
    application.state.generate_rate_lock = Lock()
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Accept"],
    )

    @application.middleware("http")
    async def request_id_middleware(request: Request, call_next):
        request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        response = await call_next(request)
        response.headers["x-request-id"] = request_id
        response.headers["x-content-type-options"] = "nosniff"
        return response

    @application.exception_handler(Exception)
    async def unhandled_exception(request: Request, exc: Exception):
        request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        logger.exception("Unhandled API error request_id=%s path=%s", request_id, request.url.path)
        return JSONResponse(
            status_code=500,
            content={"detail": "The request could not be completed.", "request_id": request_id},
        )

    @application.get("/health")
    def health() -> dict[str, str]:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {
            "status": "online",
            "service": "alpha-creator-api",
            "version": "0.1.0",
            "database": engine.dialect.name,
            "generation": "openai" if settings.openai_api_key else "local-grounded",
        }

    application.include_router(api_router, prefix=settings.api_prefix)
    return application


app = create_app()

