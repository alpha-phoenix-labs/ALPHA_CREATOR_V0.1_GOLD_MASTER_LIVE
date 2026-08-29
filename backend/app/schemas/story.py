from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class StoryScoreRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    novelty: float = Field(ge=0, le=100)
    viral_potential: float = Field(ge=0, le=100)
    wow_factor: float = Field(ge=0, le=100)
    practical_utility: float = Field(ge=0, le=100)
    topic_momentum: float = Field(ge=0, le=100)
    visual_demonstrability: float = Field(ge=0, le=100)
    audience_fit: float = Field(ge=0, le=100)
    originality: float = Field(ge=0, le=100)
    share_potential: float = Field(ge=0, le=100)
    save_potential: float = Field(ge=0, le=100)
    alpha_relevance: float = Field(ge=0, le=100)
    total_score: float = Field(ge=0, le=100)
    scoring_version: str
    rationale: dict[str, Any] = Field(default_factory=dict)


class StoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    summary: str
    source_name: str
    source_type: str
    url: str
    published_at: datetime | None
    fetched_at: datetime
    author: str | None
    tags: list[str]
    entities: list[str]
    sources: list[dict[str, Any]]
    source_count: int
    status: str
    score: StoryScoreRead


class CollectorStatus(BaseModel):
    source: str
    status: str
    item_count: int = 0
    duration_ms: int = 0
    error_code: str | None = None


class ScanResponse(BaseModel):
    scan_id: str
    scanned_at: datetime
    sources_total: int
    sources_succeeded: int
    sources_failed: int
    raw_items: int
    unique_clusters: int
    new_stories: int
    updated_stories: int
    collector_statuses: list[CollectorStatus]
    stories: list[StoryRead]


class DashboardStats(BaseModel):
    sources_configured: int
    sources_online: int
    stories_total: int
    stories_last_24h: int
    content_in_review: int
    content_approved: int
    generation_mode: str

