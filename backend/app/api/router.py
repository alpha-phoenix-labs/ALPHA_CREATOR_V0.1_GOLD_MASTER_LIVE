from __future__ import annotations

from datetime import datetime, timedelta, timezone
import secrets
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from backend.app.collectors import source_definitions
from backend.app.models import ContentItem, Source, Story, StoryScore
from backend.app.schemas.content import ContentItemRead, DecisionInput
from backend.app.schemas.story import DashboardStats, ScanResponse, StoryRead
from backend.app.services import ContentService, RadarService


api_router = APIRouter()


def get_session(request: Request):
    session = request.app.state.session_factory()
    try:
        yield session
    finally:
        session.close()


DatabaseSession = Annotated[Session, Depends(get_session)]


def require_write_access(
    request: Request,
    authorization: Annotated[str | None, Header()] = None,
) -> None:
    settings = request.app.state.settings

    if not settings.is_production:
        return

    configured_token = settings.alpha_api_token
    if configured_token is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Production write access is not configured",
        )

    expected = configured_token.get_secret_value()

    if authorization is None or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
            headers={"WWW-Authenticate": "Bearer"},
        )

    supplied = authorization[len("Bearer "):]

    if not secrets.compare_digest(supplied, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
            headers={"WWW-Authenticate": "Bearer"},
        )


WriteAccess = Annotated[None, Depends(require_write_access)]


@api_router.post("/radar/scan", response_model=ScanResponse)
async def scan_radar(
    request: Request,
    session: DatabaseSession,
    _write_access: WriteAccess,
) -> ScanResponse:
    settings = request.app.state.settings
    service = RadarService(
        collectors=request.app.state.collector_factory(),
        dedupe_threshold=settings.dedupe_threshold,
    )
    return await service.scan(session, top_limit=10)


@api_router.get("/stories", response_model=list[StoryRead])
def list_stories(
    session: DatabaseSession,
    limit: Annotated[int, Query(ge=1, le=50)] = 10,
) -> list[StoryRead]:
    stories = session.scalars(
        select(Story)
        .join(StoryScore)
        .options(selectinload(Story.score))
        .order_by(StoryScore.total_score.desc(), Story.published_at.desc())
        .limit(limit)
    ).all()
    return [StoryRead.model_validate(story) for story in stories]


@api_router.get("/stories/{story_id}", response_model=StoryRead)
def get_story(story_id: str, session: DatabaseSession) -> StoryRead:
    story = session.scalar(
        select(Story).options(selectinload(Story.score)).where(Story.id == story_id)
    )
    if story is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found")
    return StoryRead.model_validate(story)


@api_router.post("/stories/{story_id}/generate", response_model=ContentItemRead)
async def generate_content(
    story_id: str,
    request: Request,
    session: DatabaseSession,
    _write_access: WriteAccess,
) -> ContentItemRead:
    service = ContentService(request.app.state.generation_factory())
    content = await service.generate(session, story_id)
    if content is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found")
    return content


@api_router.get("/content", response_model=list[ContentItemRead])
def list_content(
    session: DatabaseSession,
    content_status: Annotated[str | None, Query(alias="status")] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 30,
) -> list[ContentItemRead]:
    statement = (
        select(ContentItem)
        .options(selectinload(ContentItem.generation), selectinload(ContentItem.decisions))
        .order_by(ContentItem.updated_at.desc())
        .limit(limit)
    )
    if content_status is not None:
        if content_status not in {"review", "approved", "rejected"}:
            raise HTTPException(status_code=422, detail="Invalid content status")
        statement = statement.where(ContentItem.status == content_status)
    items = session.scalars(statement).all()
    return [ContentService._to_read(item) for item in items]


@api_router.get("/content/{content_id}", response_model=ContentItemRead)
def get_content(content_id: str, session: DatabaseSession) -> ContentItemRead:
    item = session.scalar(
        select(ContentItem)
        .options(selectinload(ContentItem.generation), selectinload(ContentItem.decisions))
        .where(ContentItem.id == content_id)
    )
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")
    return ContentService._to_read(item)


@api_router.post("/content/{content_id}/decision", response_model=ContentItemRead)
def decide_content(
    content_id: str,
    decision_input: DecisionInput,
    session: DatabaseSession,
    _write_access: WriteAccess,
) -> ContentItemRead:
    item = ContentService.decide(session, content_id, decision_input)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")
    return item


@api_router.get("/dashboard/stats", response_model=DashboardStats)
def dashboard_stats(request: Request, session: DatabaseSession) -> DashboardStats:
    since = datetime.now(timezone.utc) - timedelta(hours=24)
    sources = list(session.scalars(select(Source)).all())
    sources_online = sum(
        source.last_success_at is not None
        and (source.last_error_at is None or source.last_success_at >= source.last_error_at)
        for source in sources
    )
    return DashboardStats(
        sources_configured=len(source_definitions),
        sources_online=sources_online,
        stories_total=session.scalar(select(func.count()).select_from(Story)) or 0,
        stories_last_24h=(
            session.scalar(select(func.count()).select_from(Story).where(Story.fetched_at >= since)) or 0
        ),
        content_in_review=(
            session.scalar(
                select(func.count()).select_from(ContentItem).where(ContentItem.status == "review")
            )
            or 0
        ),
        content_approved=(
            session.scalar(
                select(func.count()).select_from(ContentItem).where(ContentItem.status == "approved")
            )
            or 0
        ),
        generation_mode=(
            "OpenAI structured"
            if request.app.state.settings.openai_api_key
            else "Local grounded"
        ),
    )

