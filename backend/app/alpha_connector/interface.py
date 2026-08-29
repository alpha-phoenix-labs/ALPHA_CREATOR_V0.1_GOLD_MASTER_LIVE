from __future__ import annotations

from datetime import datetime
from typing import Any, Protocol

from pydantic import BaseModel, Field


class AlphaEvent(BaseModel):
    event_type: str
    occurred_at: datetime
    source_module: str = "alpha-creator"
    correlation_id: str
    payload: dict[str, Any] = Field(default_factory=dict)


class AlphaConnector(Protocol):
    async def publish(self, event: AlphaEvent) -> None: ...

    async def health(self) -> dict[str, str]: ...

