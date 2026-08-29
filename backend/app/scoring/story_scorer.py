from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone

from backend.app.processing.deduplication import StoryCluster


PRACTICAL_TERMS = {
    "agent", "agents", "automation", "workflow", "tool", "api", "code", "productivity",
    "open source", "launch", "available", "integrat", "create", "build", "generate", "research",
}
WOW_TERMS = {
    "first", "breakthrough", "real-time", "autonomous", "reasoning", "multimodal", "robot",
    "video", "voice", "million", "billion", "outperform", "new model", "release",
}
VISUAL_TERMS = {
    "video", "image", "demo", "interface", "app", "robot", "design", "browser", "screen",
    "chart", "workflow", "before", "after", "generate",
}
AUDIENCE_TERMS = {
    "ai", "agent", "automation", "tool", "workflow", "model", "productivity", "creator",
    "business", "research", "open source", "developer",
}
SAVE_TERMS = {"how", "guide", "workflow", "tool", "steps", "tutorial", "open source", "prompt", "api"}
SHARE_TERMS = {"first", "launch", "free", "replaces", "breakthrough", "warning", "secret", "changes"}


@dataclass(slots=True)
class StoryScoreValues:
    novelty: float
    viral_potential: float
    wow_factor: float
    practical_utility: float
    topic_momentum: float
    visual_demonstrability: float
    audience_fit: float
    originality: float
    share_potential: float
    save_potential: float
    alpha_relevance: float
    total_score: float
    rationale: dict[str, object]

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


def _term_score(text: str, terms: set[str], base: float, per_hit: float, ceiling: float) -> float:
    hits = sum(1 for term in terms if term in text)
    return min(ceiling, base + hits * per_hit)


def _freshness(published_at: datetime | None, now: datetime) -> tuple[float, float | None]:
    if published_at is None:
        return 48.0, None
    if published_at.tzinfo is None:
        published_at = published_at.replace(tzinfo=timezone.utc)
    hours = max(0.0, (now - published_at).total_seconds() / 3600)
    if hours <= 6:
        return 96.0, hours
    if hours <= 24:
        return 88.0, hours
    if hours <= 72:
        return 72.0, hours
    if hours <= 168:
        return 55.0, hours
    if hours <= 720:
        return 35.0, hours
    return 18.0, hours


def _clamp(value: float) -> float:
    return round(max(0.0, min(100.0, value)), 1)


def score_story(cluster: StoryCluster, now: datetime | None = None) -> StoryScoreValues:
    now = now or datetime.now(timezone.utc)
    story = cluster.primary
    text = f"{story.title} {story.summary} {' '.join(story.tags)}".lower()
    novelty, age_hours = _freshness(story.published_at, now)
    practical = _term_score(text, PRACTICAL_TERMS, 34, 8, 96)
    wow = _term_score(text, WOW_TERMS, 30, 9, 96)
    visual = _term_score(text, VISUAL_TERMS, 32, 8, 94)
    audience = _term_score(text, AUDIENCE_TERMS, 38, 7, 98)
    save = _term_score(text, SAVE_TERMS, 30, 9, 94)
    share = _term_score(text, SHARE_TERMS, 32, 9, 95)
    momentum = min(100.0, 42.0 + (len(cluster.sources) - 1) * 16.0)
    originality = max(42.0, 92.0 - (len(cluster.members) - 1) * 8.0)
    primary_bonus = 8.0 if story.source_type == "primary" else 0.0
    alpha = min(100.0, audience * 0.45 + practical * 0.35 + visual * 0.20 + primary_bonus)
    viral = min(100.0, share * 0.32 + wow * 0.25 + novelty * 0.23 + momentum * 0.20)

    values = {
        "novelty": novelty,
        "viral_potential": viral,
        "wow_factor": wow,
        "practical_utility": practical,
        "topic_momentum": momentum,
        "visual_demonstrability": visual,
        "audience_fit": audience,
        "originality": originality,
        "share_potential": share,
        "save_potential": save,
        "alpha_relevance": alpha,
    }
    weights = {
        "novelty": 0.12,
        "viral_potential": 0.12,
        "wow_factor": 0.09,
        "practical_utility": 0.14,
        "topic_momentum": 0.07,
        "visual_demonstrability": 0.10,
        "audience_fit": 0.12,
        "originality": 0.05,
        "share_potential": 0.09,
        "save_potential": 0.05,
        "alpha_relevance": 0.05,
    }
    total = sum(values[key] * weight for key, weight in weights.items())
    rounded = {key: _clamp(value) for key, value in values.items()}
    return StoryScoreValues(
        **rounded,
        total_score=_clamp(total),
        rationale={
            "method": "heuristic_content_score_not_viral_probability",
            "age_hours": round(age_hours, 1) if age_hours is not None else None,
            "source_count": len(cluster.sources),
            "primary_source": story.source_type == "primary",
            "matched_entities": story.entities,
        },
    )

