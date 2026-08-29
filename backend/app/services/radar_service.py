from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload
from rapidfuzz.fuzz import token_set_ratio

from backend.app.collectors.base import Collector, CollectorResult
from backend.app.models import Source, Story, StoryScore
from backend.app.processing import deduplicate_stories, normalize_collected_item
from backend.app.schemas.story import CollectorStatus, ScanResponse, StoryRead
from backend.app.scoring import score_story


class RadarService:
    def __init__(self, *, collectors: list[Collector], dedupe_threshold: int) -> None:
        self.collectors = collectors
        self.dedupe_threshold = dedupe_threshold

    async def scan(self, session: Session, *, top_limit: int = 10) -> ScanResponse:
        scanned_at = datetime.now(timezone.utc)
        results = await asyncio.gather(*(collector.collect() for collector in self.collectors))
        self._update_source_health(session, results, scanned_at)

        normalized = [
            normalize_collected_item(item)
            for result in results
            if result.status == "online"
            for item in result.items
        ]
        clusters = deduplicate_stories(normalized, threshold=self.dedupe_threshold)
        recent_stories = list(
            session.scalars(
                select(Story)
                .options(selectinload(Story.score))
                .where(Story.fetched_at >= scanned_at - timedelta(days=14))
            ).all()
        )
        new_stories = 0
        updated_stories = 0

        for cluster in clusters:
            primary = cluster.primary
            canonical_urls = [member.canonical_url for member in cluster.members]
            existing = session.scalar(
                select(Story)
                .options(selectinload(Story.score))
                .where(
                    or_(
                        Story.canonical_url.in_(canonical_urls),
                        Story.normalized_title == primary.normalized_title,
                    )
                )
                .limit(1)
            )
            if existing is None:
                existing = self._find_fuzzy_existing(primary, recent_stories)
            score_values = score_story(cluster)

            if existing is None:
                story = Story(
                    title=primary.title,
                    normalized_title=primary.normalized_title,
                    summary=primary.summary,
                    description=primary.description,
                    source_name=primary.source_name,
                    source_type=primary.source_type,
                    url=primary.url,
                    canonical_url=primary.canonical_url,
                    published_at=primary.published_at,
                    fetched_at=primary.fetched_at,
                    author=primary.author,
                    tags=primary.tags,
                    entities=primary.entities,
                    sources=cluster.sources,
                    source_count=len(cluster.sources),
                    status="ranked",
                    cluster_key=primary.cluster_key,
                    raw_data={"references": [member.raw_reference for member in cluster.members]},
                )
                story.score = StoryScore(
                    **{key: value for key, value in score_values.to_dict().items() if key != "rationale"},
                    scoring_version="heuristic-v0.1",
                    rationale=score_values.rationale,
                )
                session.add(story)
                recent_stories.append(story)
                new_stories += 1
            else:
                existing_sources = {item.get("key"): item for item in (existing.sources or [])}
                for source in cluster.sources:
                    existing_sources[source["key"]] = source
                existing.sources = list(existing_sources.values())
                existing.source_count = len(existing.sources)
                existing.fetched_at = primary.fetched_at
                if not existing.summary and primary.summary:
                    existing.summary = primary.summary
                existing.tags = sorted(set((existing.tags or []) + primary.tags))
                existing.entities = sorted(set((existing.entities or []) + primary.entities))
                if existing.score is None:
                    existing.score = StoryScore(
                        **{key: value for key, value in score_values.to_dict().items() if key != "rationale"},
                        scoring_version="heuristic-v0.1",
                        rationale=score_values.rationale,
                    )
                else:
                    for key, value in score_values.to_dict().items():
                        if key != "rationale":
                            setattr(existing.score, key, value)
                    existing.score.rationale = score_values.rationale
                updated_stories += 1

        session.commit()
        top_stories = list(
            session.scalars(
                select(Story)
                .join(StoryScore)
                .options(selectinload(Story.score))
                .order_by(StoryScore.total_score.desc(), Story.published_at.desc())
                .limit(top_limit)
            ).all()
        )
        statuses = [
            CollectorStatus(
                source=result.source_name,
                status=result.status,
                item_count=len(result.items),
                duration_ms=result.duration_ms,
                error_code=result.error_code,
            )
            for result in results
        ]
        return ScanResponse(
            scan_id=str(uuid.uuid4()),
            scanned_at=scanned_at,
            sources_total=len(results),
            sources_succeeded=sum(result.status == "online" for result in results),
            sources_failed=sum(result.status != "online" for result in results),
            raw_items=sum(len(result.items) for result in results),
            unique_clusters=len(clusters),
            new_stories=new_stories,
            updated_stories=updated_stories,
            collector_statuses=statuses,
            stories=[StoryRead.model_validate(story) for story in top_stories],
        )

    def _find_fuzzy_existing(self, incoming, candidates: list[Story]) -> Story | None:
        best: Story | None = None
        best_similarity = 0.0
        for candidate in candidates:
            if not self._within_event_window(incoming.published_at, candidate.published_at):
                continue
            similarity = token_set_ratio(incoming.normalized_title, candidate.normalized_title)
            if similarity >= self.dedupe_threshold and similarity > best_similarity:
                best = candidate
                best_similarity = similarity
        return best

    @staticmethod
    def _within_event_window(left: datetime | None, right: datetime | None) -> bool:
        if left is None or right is None:
            return True
        if left.tzinfo is None:
            left = left.replace(tzinfo=timezone.utc)
        if right.tzinfo is None:
            right = right.replace(tzinfo=timezone.utc)
        return abs((left - right).total_seconds()) <= 7 * 24 * 3600

    def _update_source_health(
        self, session: Session, results: list[CollectorResult], scanned_at: datetime
    ) -> None:
        for result in results:
            collector_source = next(
                collector.definition
                for collector in self.collectors
                if collector.definition.key == result.source_key
            )
            source = session.scalar(select(Source).where(Source.key == result.source_key))
            if source is None:
                source = Source(
                    key=collector_source.key,
                    name=collector_source.name,
                    source_type=collector_source.source_type,
                    feed_url=str(collector_source.feed_url),
                    homepage_url=str(collector_source.homepage_url),
                )
                session.add(source)
            if result.status == "online":
                source.last_success_at = scanned_at
                source.last_error_code = None
            else:
                source.last_error_at = scanned_at
                source.last_error_code = result.error_code
