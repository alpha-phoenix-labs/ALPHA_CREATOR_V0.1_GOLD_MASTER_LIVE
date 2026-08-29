from datetime import datetime, timezone

from backend.app.collectors.base import CollectedItem
from backend.app.processing import deduplicate_stories, normalize_collected_item
from backend.app.scoring import score_story


def item(title: str, url: str, source_key: str = "source-a") -> CollectedItem:
    return CollectedItem(
        title=title,
        summary="A new AI agent automates a practical workflow with a visual demo.",
        source_key=source_key,
        source_name=source_key,
        source_type="primary",
        url=url,
        published_at=datetime.now(timezone.utc),
        fetched_at=datetime.now(timezone.utc),
        tags=["AI", "Automation"],
    )


def test_normalization_removes_markup_and_tracking_parameters() -> None:
    normalized = normalize_collected_item(
        item(
            "<b>OpenAI launches a new agent</b>",
            "https://example.com/story/?utm_source=test&id=42#fragment",
        )
    )
    assert normalized.title == "OpenAI launches a new agent"
    assert normalized.canonical_url == "https://example.com/story?id=42"
    assert "OpenAI" in normalized.entities


def test_deduplication_clusters_equivalent_urls_and_scores_story() -> None:
    normalized = [
        normalize_collected_item(
            item("OpenAI launches a new workflow agent", "https://example.com/launch?utm_source=a")
        ),
        normalize_collected_item(
            item(
                "OpenAI launches its new workflow agent",
                "https://example.com/launch?utm_medium=social",
                source_key="source-b",
            )
        ),
    ]
    clusters = deduplicate_stories(normalized, threshold=88)
    assert len(clusters) == 1
    assert len(clusters[0].sources) == 2

    result = score_story(clusters[0])
    assert 0 <= result.total_score <= 100
    assert result.practical_utility >= 50
    assert result.rationale["method"] == "heuristic_content_score_not_viral_probability"

