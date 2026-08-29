from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.database.base import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_id() -> str:
    return str(uuid.uuid4())


class Source(Base):
    __tablename__ = "sources"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    key: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    source_type: Mapped[str] = mapped_column(String(40), index=True)
    feed_url: Mapped[str] = mapped_column(Text)
    homepage_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_success_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error_code: Mapped[str | None] = mapped_column(String(80), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class Story(Base):
    __tablename__ = "stories"
    __table_args__ = (UniqueConstraint("canonical_url", name="uq_story_canonical_url"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    title: Mapped[str] = mapped_column(Text)
    normalized_title: Mapped[str] = mapped_column(Text, index=True)
    summary: Mapped[str] = mapped_column(Text, default="")
    description: Mapped[str] = mapped_column(Text, default="")
    source_name: Mapped[str] = mapped_column(String(160), index=True)
    source_type: Mapped[str] = mapped_column(String(40), index=True)
    url: Mapped[str] = mapped_column(Text)
    canonical_url: Mapped[str] = mapped_column(Text)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    author: Mapped[str | None] = mapped_column(String(240), nullable=True)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    entities: Mapped[list[str]] = mapped_column(JSON, default=list)
    sources: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    source_count: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(40), default="ranked", index=True)
    cluster_key: Mapped[str] = mapped_column(String(64), index=True)
    raw_data: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    score: Mapped["StoryScore"] = relationship(
        back_populates="story", cascade="all, delete-orphan", uselist=False
    )
    generations: Mapped[list["Generation"]] = relationship(back_populates="story")
    content_items: Mapped[list["ContentItem"]] = relationship(back_populates="story")


class StoryScore(Base):
    __tablename__ = "story_scores"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    story_id: Mapped[str] = mapped_column(ForeignKey("stories.id", ondelete="CASCADE"), unique=True)
    novelty: Mapped[float] = mapped_column(Float)
    viral_potential: Mapped[float] = mapped_column(Float)
    wow_factor: Mapped[float] = mapped_column(Float)
    practical_utility: Mapped[float] = mapped_column(Float)
    topic_momentum: Mapped[float] = mapped_column(Float)
    visual_demonstrability: Mapped[float] = mapped_column(Float)
    audience_fit: Mapped[float] = mapped_column(Float)
    originality: Mapped[float] = mapped_column(Float)
    share_potential: Mapped[float] = mapped_column(Float)
    save_potential: Mapped[float] = mapped_column(Float)
    alpha_relevance: Mapped[float] = mapped_column(Float)
    total_score: Mapped[float] = mapped_column(Float, index=True)
    scoring_version: Mapped[str] = mapped_column(String(32), default="heuristic-v0.1")
    rationale: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    story: Mapped[Story] = relationship(back_populates="score")


class Generation(Base):
    __tablename__ = "generations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    story_id: Mapped[str] = mapped_column(ForeignKey("stories.id", ondelete="CASCADE"), index=True)
    provider: Mapped[str] = mapped_column(String(80))
    model: Mapped[str] = mapped_column(String(120))
    prompt_version: Mapped[str] = mapped_column(String(40), default="content-v0.1")
    status: Mapped[str] = mapped_column(String(40), default="completed")
    request_payload: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    response_payload: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    warning: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    story: Mapped[Story] = relationship(back_populates="generations")
    content_item: Mapped["ContentItem"] = relationship(back_populates="generation", uselist=False)


class ContentItem(Base):
    __tablename__ = "content_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    story_id: Mapped[str] = mapped_column(ForeignKey("stories.id", ondelete="CASCADE"), index=True)
    generation_id: Mapped[str] = mapped_column(
        ForeignKey("generations.id", ondelete="CASCADE"), unique=True
    )
    status: Mapped[str] = mapped_column(String(40), default="review", index=True)
    content_type: Mapped[str] = mapped_column(String(80))
    content_pillar: Mapped[str] = mapped_column(String(80), index=True)
    hook: Mapped[str] = mapped_column(Text)
    caption: Mapped[str] = mapped_column(Text)
    validation_status: Mapped[str] = mapped_column(String(60), index=True)
    pre_publish_viral_score: Mapped[float] = mapped_column(Float)
    payload: Mapped[dict[str, Any]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    story: Mapped[Story] = relationship(back_populates="content_items")
    generation: Mapped[Generation] = relationship(back_populates="content_item")
    decisions: Mapped[list["ApprovalDecision"]] = relationship(
        back_populates="content_item", cascade="all, delete-orphan"
    )


class ApprovalDecision(Base):
    __tablename__ = "approval_decisions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    content_item_id: Mapped[str] = mapped_column(
        ForeignKey("content_items.id", ondelete="CASCADE"), index=True
    )
    decision: Mapped[str] = mapped_column(String(24), index=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    decided_by: Mapped[str] = mapped_column(String(80), default="local-user")
    decided_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    content_item: Mapped[ContentItem] = relationship(back_populates="decisions")

