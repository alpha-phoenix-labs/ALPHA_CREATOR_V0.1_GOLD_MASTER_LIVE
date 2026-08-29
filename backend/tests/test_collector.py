from backend.app.collectors.base import SourceDefinition
from backend.app.collectors.rss import RSSCollector


RSS_FIXTURE = b"""<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<rss version=\"2.0\"><channel><title>AI Source</title>
<item><title>New practical AI workflow</title><link>https://example.com/ai-workflow</link>
<description>A grounded description.</description><pubDate>Fri, 29 Aug 2026 10:00:00 GMT</pubDate>
</item></channel></rss>"""


async def test_rss_collector_normalizes_feed_entries(monkeypatch) -> None:
    definition = SourceDefinition(
        key="fixture",
        name="Fixture Source",
        source_type="primary",
        feed_url="https://example.com/feed.xml",
        homepage_url="https://example.com/",
        allowed_hosts={"example.com"},
    )
    collector = RSSCollector(definition, timeout_seconds=3, max_items=10, retries=0)

    async def fake_fetch():
        return RSS_FIXTURE, "https://example.com/feed.xml"

    monkeypatch.setattr(collector, "_fetch", fake_fetch)
    result = await collector.collect()
    assert result.status == "online"
    assert len(result.items) == 1
    assert result.items[0].title == "New practical AI workflow"
    assert result.items[0].source_name == "Fixture Source"


def test_rss_collector_rejects_non_http_entry_links() -> None:
    definition = SourceDefinition(
        key="fixture",
        name="Fixture Source",
        source_type="primary",
        feed_url="https://example.com/feed.xml",
        homepage_url="https://example.com/",
        allowed_hosts={"example.com"},
    )
    collector = RSSCollector(definition, timeout_seconds=3, max_items=10, retries=0)
    entry = {
        "title": "Unsafe link",
        "link": "javascript:alert(1)",
        "summary": "This entry must be discarded.",
    }
    assert collector._to_item(entry, "https://example.com/feed.xml") is None
