from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ValidationStatus(StrEnum):
    VERIFIED = "VERIFIED / DEMONSTRABLE"
    CONCEPT = "CONCEPT TO VERIFY"
    EXPERIMENTAL = "EXPERIMENTAL"


class ReelScene(BaseModel):
    scene: int = Field(ge=1, le=12)
    duration_seconds: int = Field(ge=1, le=30)
    visual: str = Field(min_length=3, max_length=500)
    voiceover: str = Field(min_length=3, max_length=800)
    on_screen_text: str = Field(min_length=1, max_length=120)


class ContentScores(BaseModel):
    hook_strength: float = Field(ge=0, le=100)
    wow_factor: float = Field(ge=0, le=100)
    utility: float = Field(ge=0, le=100)
    share_potential: float = Field(ge=0, le=100)
    save_potential: float = Field(ge=0, le=100)
    visual_demonstrability: float = Field(ge=0, le=100)
    novelty: float = Field(ge=0, le=100)
    audience_fit: float = Field(ge=0, le=100)
    comment_potential: float = Field(ge=0, le=100)
    follow_conversion: float = Field(ge=0, le=100)


class ClaimCheck(BaseModel):
    source_basis: list[str] = Field(min_length=1)
    claims_to_verify: list[str] = Field(default_factory=list)
    prohibited_claims_removed: bool = True
    notes: str = Field(min_length=3, max_length=1000)


class ContentPackage(BaseModel):
    content_type: str = Field(min_length=3, max_length=80)
    content_pillar: str = Field(min_length=3, max_length=80)
    target_audience: str = Field(min_length=3, max_length=240)
    content_goal: str = Field(min_length=3, max_length=240)
    hook_family: str = Field(min_length=3, max_length=120)
    primary_viral_trigger: str = Field(min_length=3, max_length=120)
    hook: str = Field(min_length=8, max_length=280)
    first_frame: str = Field(min_length=3, max_length=280)
    core_idea: str = Field(min_length=8, max_length=1000)
    reel_script: str = Field(min_length=40, max_length=5000)
    scene_plan: list[ReelScene] = Field(min_length=3, max_length=12)
    on_screen_text: list[str] = Field(min_length=3, max_length=12)
    demo_proof: str = Field(min_length=8, max_length=1000)
    technology_tool: str = Field(min_length=2, max_length=180)
    validation_status: ValidationStatus
    reel_template: Literal["TEMPLATE A — DEMO", "TEMPLATE B — RESULT", "TEMPLATE C — INTELLIGENCE"]
    caption: str = Field(min_length=40, max_length=5000)
    cta: str = Field(min_length=5, max_length=300)
    hashtags: list[str] = Field(min_length=5, max_length=5)
    thumbnail_text: str = Field(min_length=2, max_length=48)
    scores: ContentScores
    pre_publish_viral_score: float = Field(ge=0, le=100)
    why_it_could_work: str = Field(min_length=8, max_length=1000)
    what_is_being_tested: str = Field(min_length=8, max_length=1000)
    primary_success_signal: str = Field(min_length=3, max_length=120)
    claim_check: ClaimCheck

    @field_validator("hashtags")
    @classmethod
    def validate_hashtags(cls, value: list[str]) -> list[str]:
        cleaned = []
        for hashtag in value:
            tag = hashtag.strip().replace(" ", "")
            if not tag.startswith("#"):
                tag = f"#{tag}"
            cleaned.append(tag)
        if len(set(item.lower() for item in cleaned)) != 5:
            raise ValueError("hashtags must be unique")
        return cleaned


class GenerationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    provider: str
    model: str
    warning: str | None
    created_at: datetime


class ContentItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    story_id: str
    generation_id: str
    status: str
    content_type: str
    content_pillar: str
    hook: str
    caption: str
    validation_status: str
    pre_publish_viral_score: float
    payload: dict[str, Any]
    created_at: datetime
    updated_at: datetime
    generation: GenerationRead | None = None
    latest_decision: dict[str, Any] | None = None


class DecisionInput(BaseModel):
    decision: Literal["approved", "rejected"]
    reason: str | None = Field(default=None, max_length=1000)
