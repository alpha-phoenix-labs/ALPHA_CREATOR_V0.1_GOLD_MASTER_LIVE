from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "ALPHA CREATOR"
    app_env: str = "development"
    app_debug: bool = False
    api_prefix: str = "/api/v1"
    database_url: str = "sqlite:///./backend/data/alpha_creator.db"
    openai_api_key: SecretStr | None = None
    alpha_api_token: SecretStr | None = None
    openai_model: str = "gpt-5-mini"
    collector_timeout_seconds: float = Field(default=10.0, ge=2.0, le=30.0)
    collector_max_items_per_source: int = Field(default=35, ge=5, le=100)
    collector_retries: int = Field(default=1, ge=0, le=2)
    dedupe_threshold: int = Field(default=88, ge=70, le=100)
    cors_origins: Annotated[list[str], NoDecode] = [
        "http://localhost:3000",
        "http://localhost:4173",
    ]

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_driver(cls, value: object) -> object:
        if isinstance(value, str) and value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+psycopg://", 1)
        if isinstance(value, str) and value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)
        return value

    @field_validator("openai_api_key", "alpha_api_token", mode="before")
    @classmethod
    def empty_secret_is_unset(cls, value: object) -> object:
        if isinstance(value, str) and not value.strip():
            return None
        return value

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
