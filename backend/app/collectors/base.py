from __future__ import annotations

from datetime import datetime
from typing import Protocol

from pydantic import BaseModel, Field, HttpUrl


class SourceDefinition(BaseModel):
    key: str
    name: str
    source_type: str
    feed_url: HttpUrl
    homepage_url: HttpUrl
    allowed_hosts: set[str]


class CollectedItem(BaseModel):
    title: str = Field(min_length=2)
    summary: str = ""
    description: str = ""
    source_key: str
    source_name: str
    source_type: str
    url: str
    published_at: datetime | None = None
    fetched_at: datetime
    author: str | None = None
    tags: list[str] = Field(default_factory=list)
    raw_reference: dict[str, str] = Field(default_factory=dict)


class CollectorResult(BaseModel):
    source_key: str
    source_name: str
    status: str
    items: list[CollectedItem] = Field(default_factory=list)
    duration_ms: int = 0
    error_code: str | None = None


class Collector(Protocol):
    definition: SourceDefinition

    async def collect(self) -> CollectorResult: ...

