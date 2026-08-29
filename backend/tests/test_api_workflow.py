from __future__ import annotations

from datetime import datetime, timezone

from fastapi.testclient import TestClient

from backend.app.collectors.base import CollectedItem, CollectorResult, SourceDefinition
from backend.app.config import Settings
from backend.app.main import create_app


class StaticCollector:
    def __init__(self, key: str, title: str, url: str) -> None:
        self.definition = SourceDefinition(
            key=key,
            name=f"Source {key}",
            source_type="primary",
            feed_url=f"https://{key}.example.com/feed.xml",
            homepage_url=f"https://{key}.example.com/",
            allowed_hosts={f"{key}.example.com"},
        )
        self.title = title
        self.url = url

    async def collect(self) -> CollectorResult:
        now = datetime.now(timezone.utc)
        return CollectorResult(
            source_key=self.definition.key,
            source_name=self.definition.name,
            status="online",
            duration_ms=2,
            items=[
                CollectedItem(
                    title=self.title,
                    summary=(
                        "An official AI agent update introduces a practical workflow and a visual demo."
                    ),
                    description="The source describes the feature and its intended use.",
                    source_key=self.definition.key,
                    source_name=self.definition.name,
                    source_type=self.definition.source_type,
                    url=self.url,
                    published_at=now,
                    fetched_at=now,
                    tags=["AI Agents", "Automation"],
                )
            ],
        )


def make_settings(database_url: str) -> Settings:
    return Settings(
        database_url=database_url,
        openai_api_key=None,
        cors_origins=["http://localhost:3000"],
    )


def test_complete_scan_generate_approve_reload_workflow(tmp_path) -> None:
    database_url = f"sqlite:///{tmp_path / 'workflow.db'}"
    settings = make_settings(database_url)
    app = create_app(settings)
    collectors = [
        StaticCollector(
            "official-a",
            "OpenAI launches a new workflow agent",
            "https://news.example.com/agent?utm_source=first",
        ),
        StaticCollector(
            "official-b",
            "OpenAI launches its new workflow agent",
            "https://news.example.com/agent?utm_medium=second",
        ),
    ]
    app.state.collector_factory = lambda: collectors

    with TestClient(app) as client:
        health = client.get("/health")
        assert health.status_code == 200
        assert health.json()["status"] == "online"

        scan = client.post("/api/v1/radar/scan")
        assert scan.status_code == 200, scan.text
        scan_payload = scan.json()
        assert scan_payload["raw_items"] == 2
        assert scan_payload["unique_clusters"] == 1
        assert scan_payload["new_stories"] == 1
        story_id = scan_payload["stories"][0]["id"]
        assert scan_payload["stories"][0]["source_count"] == 2

        app.state.collector_factory = lambda: [
            StaticCollector(
                "official-c",
                "OpenAI launches the new workflow agent",
                "https://another.example.com/openai-workflow-agent",
            )
        ]
        repeated_scan = client.post("/api/v1/radar/scan")
        assert repeated_scan.status_code == 200, repeated_scan.text
        assert repeated_scan.json()["new_stories"] == 0
        assert repeated_scan.json()["updated_stories"] == 1

        generated = client.post(f"/api/v1/stories/{story_id}/generate")
        assert generated.status_code == 200, generated.text
        content = generated.json()
        assert content["status"] == "review"
        assert content["payload"]["primary_success_signal"] == "Sends / Reach"
        assert len(content["payload"]["hashtags"]) == 5
        content_id = content["id"]

        approved = client.post(
            f"/api/v1/content/{content_id}/decision",
            json={"decision": "approved", "reason": "Source and claims reviewed"},
        )
        assert approved.status_code == 200, approved.text
        assert approved.json()["status"] == "approved"

    reloaded_app = create_app(settings)
    with TestClient(reloaded_app) as client:
        library = client.get("/api/v1/content?status=approved")
        assert library.status_code == 200
        assert len(library.json()) == 1
        assert library.json()[0]["id"] == content_id


def test_production_write_endpoints_require_api_token(tmp_path) -> None:
    database_url = f"sqlite:///{tmp_path / 'security.db'}"

    settings = Settings(
        app_env="production",
        database_url=database_url,
        openai_api_key=None,
        alpha_api_token="security-test-token",
        cors_origins=["https://creator.example"],
    )

    app = create_app(settings)

    app.state.collector_factory = lambda: [
        StaticCollector(
            "official-security",
            "OpenAI launches a secure workflow agent",
            "https://official-security.example.com/agent",
        )
    ]

    with TestClient(app) as client:
        assert client.post("/api/v1/radar/scan").status_code == 401

        scan = client.post(
            "/api/v1/radar/scan",
            headers={"Authorization": "Bearer security-test-token"},
        )
        assert scan.status_code == 200, scan.text

        story_id = scan.json()["stories"][0]["id"]

        assert client.post(
            f"/api/v1/stories/{story_id}/generate"
        ).status_code == 401

        generated = client.post(
            f"/api/v1/stories/{story_id}/generate",
            headers={"Authorization": "Bearer security-test-token"},
        )
        assert generated.status_code == 200, generated.text

        content_id = generated.json()["id"]

        unauthorized = client.post(
            f"/api/v1/content/{content_id}/decision",
            json={"decision": "approved", "reason": "Security test"},
        )
        assert unauthorized.status_code == 401

        approved = client.post(
            f"/api/v1/content/{content_id}/decision",
            headers={"Authorization": "Bearer security-test-token"},
            json={"decision": "approved", "reason": "Security test"},
        )
        assert approved.status_code == 200, approved.text
