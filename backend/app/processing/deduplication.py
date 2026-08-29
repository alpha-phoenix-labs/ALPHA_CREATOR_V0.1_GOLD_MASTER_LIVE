from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone

from rapidfuzz.fuzz import token_set_ratio

from backend.app.processing.normalization import NormalizedStory


@dataclass(slots=True)
class StoryCluster:
    primary: NormalizedStory
    members: list[NormalizedStory] = field(default_factory=list)

    def __post_init__(self) -> None:
        if not self.members:
            self.members.append(self.primary)

    @property
    def sources(self) -> list[dict[str, str]]:
        seen: set[str] = set()
        result: list[dict[str, str]] = []
        for item in self.members:
            if item.source_key in seen:
                continue
            seen.add(item.source_key)
            result.append({"key": item.source_key, "name": item.source_name, "url": item.url})
        return result


def _timestamp(value: datetime | None) -> float:
    if value is None:
        return 0
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.timestamp()


def _within_event_window(left: datetime | None, right: datetime | None) -> bool:
    if left is None or right is None:
        return True
    if left.tzinfo is None:
        left = left.replace(tzinfo=timezone.utc)
    if right.tzinfo is None:
        right = right.replace(tzinfo=timezone.utc)
    return abs((left - right).total_seconds()) <= 7 * 24 * 3600


def deduplicate_stories(items: list[NormalizedStory], threshold: int = 88) -> list[StoryCluster]:
    ordered = sorted(items, key=lambda item: _timestamp(item.published_at), reverse=True)
    clusters: list[StoryCluster] = []
    urls: dict[str, StoryCluster] = {}

    for item in ordered:
        exact = urls.get(item.canonical_url)
        if exact is not None:
            exact.members.append(item)
            continue

        match: StoryCluster | None = None
        best_score = 0.0
        for cluster in clusters:
            if not _within_event_window(item.published_at, cluster.primary.published_at):
                continue
            similarity = token_set_ratio(item.normalized_title, cluster.primary.normalized_title)
            if similarity >= threshold and similarity > best_score:
                match = cluster
                best_score = similarity

        if match is None:
            match = StoryCluster(primary=item)
            clusters.append(match)
        else:
            match.members.append(item)
        urls[item.canonical_url] = match

    return clusters

