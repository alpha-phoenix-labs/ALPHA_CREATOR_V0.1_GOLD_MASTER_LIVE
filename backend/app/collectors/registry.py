from __future__ import annotations

from backend.app.collectors.base import SourceDefinition
from backend.app.collectors.rss import RSSCollector
from backend.app.config import Settings


source_definitions = [
    SourceDefinition(
        key="openai-news",
        name="OpenAI News",
        source_type="primary",
        feed_url="https://openai.com/news/rss.xml",
        homepage_url="https://openai.com/news/",
        allowed_hosts={"openai.com", "www.openai.com"},
    ),
    SourceDefinition(
        key="google-ai",
        name="Google AI",
        source_type="primary",
        feed_url="https://blog.google/innovation-and-ai/technology/ai/rss/",
        homepage_url="https://blog.google/innovation-and-ai/technology/ai/",
        allowed_hosts={"blog.google", "www.blog.google"},
    ),
    SourceDefinition(
        key="huggingface-blog",
        name="Hugging Face",
        source_type="primary",
        feed_url="https://huggingface.co/blog/feed.xml",
        homepage_url="https://huggingface.co/blog",
        allowed_hosts={"huggingface.co", "www.huggingface.co"},
    ),
    SourceDefinition(
        key="techcrunch-ai",
        name="TechCrunch AI",
        source_type="technology-news",
        feed_url="https://techcrunch.com/category/artificial-intelligence/feed/",
        homepage_url="https://techcrunch.com/category/artificial-intelligence/",
        allowed_hosts={"techcrunch.com", "www.techcrunch.com"},
    ),
    SourceDefinition(
        key="ars-ai",
        name="Ars Technica AI",
        source_type="technology-news",
        feed_url="https://feeds.arstechnica.com/arstechnica/technology-lab",
        homepage_url="https://arstechnica.com/ai/",
        allowed_hosts={"feeds.arstechnica.com", "arstechnica.com", "www.arstechnica.com"},
    ),
]


def build_collectors(settings: Settings) -> list[RSSCollector]:
    return [
        RSSCollector(
            definition,
            timeout_seconds=settings.collector_timeout_seconds,
            max_items=settings.collector_max_items_per_source,
            retries=settings.collector_retries,
        )
        for definition in source_definitions
    ]
