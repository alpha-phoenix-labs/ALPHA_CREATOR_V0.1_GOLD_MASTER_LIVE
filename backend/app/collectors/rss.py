from __future__ import annotations

import asyncio
import calendar
import logging
import time
from datetime import datetime, timezone
from urllib.parse import urlparse

import feedparser
import httpx

from backend.app.collectors.base import CollectedItem, CollectorResult, SourceDefinition


logger = logging.getLogger(__name__)
MAX_FEED_BYTES = 5_000_000


class RSSCollector:
    def __init__(
        self,
        definition: SourceDefinition,
        *,
        timeout_seconds: float,
        max_items: int,
        retries: int,
    ) -> None:
        self.definition = definition
        self.timeout_seconds = timeout_seconds
        self.max_items = max_items
        self.retries = retries

    async def collect(self) -> CollectorResult:
        started = time.perf_counter()
        try:
            content, final_url = await self._fetch()
            parsed = feedparser.parse(content)
            if getattr(parsed, "bozo", False) and not parsed.entries:
                raise ValueError("invalid_feed")
            items = [self._to_item(entry, final_url) for entry in parsed.entries[: self.max_items]]
            items = [item for item in items if item is not None]
            return CollectorResult(
                source_key=self.definition.key,
                source_name=self.definition.name,
                status="online",
                items=items,
                duration_ms=int((time.perf_counter() - started) * 1000),
            )
        except httpx.TimeoutException:
            error_code = "timeout"
        except httpx.HTTPStatusError:
            error_code = "http_error"
        except httpx.RequestError:
            error_code = "network_error"
        except ValueError as exc:
            error_code = (
                str(exc)
                if str(exc) in {"invalid_feed", "blocked_redirect", "feed_too_large"}
                else "parse_error"
            )
        except Exception:
            logger.exception("Collector failed for source=%s", self.definition.key)
            error_code = "collector_error"

        return CollectorResult(
            source_key=self.definition.key,
            source_name=self.definition.name,
            status="offline",
            duration_ms=int((time.perf_counter() - started) * 1000),
            error_code=error_code,
        )

    async def _fetch(self) -> tuple[bytes, str]:
        headers = {
            "User-Agent": "ALPHA-CREATOR/0.1 (+content-intelligence; RSS reader)",
            "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml",
        }
        last_error: Exception | None = None
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(self.timeout_seconds),
            follow_redirects=True,
            headers=headers,
        ) as client:
            for attempt in range(self.retries + 1):
                try:
                    response = await client.get(str(self.definition.feed_url))
                    response.raise_for_status()
                    final_host = (urlparse(str(response.url)).hostname or "").lower()
                    if final_host not in self.definition.allowed_hosts:
                        raise ValueError("blocked_redirect")
                    if len(response.content) > MAX_FEED_BYTES:
                        raise ValueError("feed_too_large")
                    return response.content, str(response.url)
                except (httpx.TimeoutException, httpx.RequestError, httpx.HTTPStatusError) as exc:
                    last_error = exc
                    if attempt < self.retries:
                        await asyncio.sleep(0.25 * (attempt + 1))
                        continue
                    raise
        assert last_error is not None
        raise last_error

    def _to_item(self, entry, feed_url: str) -> CollectedItem | None:
        title = str(entry.get("title", "")).strip()
        url = str(entry.get("link", "")).strip()
        parsed_url = urlparse(url)
        if not title or parsed_url.scheme not in {"http", "https"} or not parsed_url.hostname:
            return None
        published_at = self._parse_datetime(entry)
        tags = [str(tag.get("term", "")).strip() for tag in entry.get("tags", [])]
        tags = [tag for tag in tags if tag][:12]
        reference = str(entry.get("id") or url)
        return CollectedItem(
            title=title,
            summary=str(entry.get("summary", "")),
            description=str(entry.get("description", entry.get("summary", ""))),
            source_key=self.definition.key,
            source_name=self.definition.name,
            source_type=self.definition.source_type,
            url=url,
            published_at=published_at,
            fetched_at=datetime.now(timezone.utc),
            author=str(entry.get("author", "")).strip() or None,
            tags=tags,
            raw_reference={"entry_id": reference, "feed_url": feed_url},
        )

    @staticmethod
    def _parse_datetime(entry) -> datetime | None:
        parsed = entry.get("published_parsed") or entry.get("updated_parsed")
        if parsed:
            return datetime.fromtimestamp(calendar.timegm(parsed), tz=timezone.utc)
        return None
