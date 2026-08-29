from backend.app.config import Settings


def test_settings_normalize_postgres_and_csv_cors(monkeypatch) -> None:
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass@db.example/alpha")
    monkeypatch.setenv("CORS_ORIGINS", "https://creator.example,https://admin.example")
    monkeypatch.setenv("OPENAI_API_KEY", "")
    settings = Settings()
    assert settings.database_url == "postgresql+psycopg://user:pass@db.example/alpha"
    assert settings.cors_origins == ["https://creator.example", "https://admin.example"]
    assert settings.openai_api_key is None
