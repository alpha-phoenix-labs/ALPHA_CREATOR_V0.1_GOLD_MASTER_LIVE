from __future__ import annotations

import hashlib
import html
import re
import unicodedata
from dataclasses import dataclass
from datetime import datetime
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from backend.app.collectors.base import CollectedItem


HTML_TAGS = re.compile(r"<[^>]+>")
WHITESPACE = re.compile(r"\s+")
NON_WORD = re.compile(r"[^a-z0-9\s-]")
TRACKING_QUERY_KEYS = {
    "fbclid",
    "gclid",
    "mc_cid",
    "mc_eid",
    "ref",
    "source",
    "utm_campaign",
    "utm_content",
    "utm_medium",
    "utm_source",
    "utm_term",
}

KNOWN_ENTITIES = {
    "openai": "OpenAI",
    "chatgpt": "ChatGPT",
    "google": "Google",
    "deepmind": "Google DeepMind",
    "gemini": "Gemini",
    "anthropic": "Anthropic",
    "claude": "Claude",
    "hugging face": "Hugging Face",
    "meta": "Meta",
    "llama": "Llama",
    "mistral": "Mistral AI",
    "nvidia": "NVIDIA",
    "microsoft": "Microsoft",
    "github": "GitHub",
}


@dataclass(slots=True)
class NormalizedStory:
    title: str
    normalized_title: str
    summary: str
    description: str
    source_key: str
    source_name: str
    source_type: str
    url: str
    canonical_url: str
    published_at: datetime | None
    fetched_at: datetime
    author: str | None
    tags: list[str]
    entities: list[str]
    raw_reference: dict[str, str]

    @property
    def cluster_key(self) -> str:
        return hashlib.sha256(self.normalized_title.encode("utf-8")).hexdigest()[:24]


def clean_text(value: str, *, limit: int = 5000) -> str:
    without_tags = HTML_TAGS.sub(" ", html.unescape(value or ""))
    return WHITESPACE.sub(" ", without_tags).strip()[:limit]


def normalize_title(value: str) -> str:
    text = unicodedata.normalize("NFKD", html.unescape(value)).encode("ascii", "ignore").decode()
    text = NON_WORD.sub(" ", text.lower())
    return WHITESPACE.sub(" ", text).strip()


def canonicalize_url(value: str) -> str:
    parts = urlsplit(value.strip())
    filtered_query = [
        (key, item)
        for key, item in parse_qsl(parts.query, keep_blank_values=False)
        if key.lower() not in TRACKING_QUERY_KEYS and not key.lower().startswith("utm_")
    ]
    path = parts.path.rstrip("/") or "/"
    return urlunsplit((parts.scheme.lower(), parts.netloc.lower(), path, urlencode(filtered_query), ""))


def extract_entities(text: str) -> list[str]:
    haystack = text.lower()
    return sorted({display for needle, display in KNOWN_ENTITIES.items() if needle in haystack})


def normalize_collected_item(item: CollectedItem) -> NormalizedStory:
    title = clean_text(item.title, limit=500)
    summary = clean_text(item.summary, limit=2000)
    description = clean_text(item.description, limit=5000)
    combined = f"{title} {summary} {description}"
    return NormalizedStory(
        title=title,
        normalized_title=normalize_title(title),
        summary=summary or description[:500],
        description=description or summary,
        source_key=item.source_key,
        source_name=item.source_name,
        source_type=item.source_type,
        url=item.url,
        canonical_url=canonicalize_url(item.url),
        published_at=item.published_at,
        fetched_at=item.fetched_at,
        author=item.author,
        tags=sorted({clean_text(tag, limit=80) for tag in item.tags if clean_text(tag, limit=80)}),
        entities=extract_entities(combined),
        raw_reference=item.raw_reference,
    )

