from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from backend.app.generation import GenerationService
from backend.app.models import ApprovalDecision, ContentItem, Generation, Story
from backend.app.schemas.content import ContentItemRead, DecisionInput


class ContentService:
    def __init__(self, generation_service: GenerationService) -> None:
        self.generation_service = generation_service

    async def generate(self, session: Session, story_id: str) -> ContentItemRead | None:
        story = session.scalar(
            select(Story).options(selectinload(Story.score)).where(Story.id == story_id)
        )
        if story is None:
            return None
        outcome = await self.generation_service.generate(story)
        payload = outcome.package.model_dump(mode="json")
        generation = Generation(
            story_id=story.id,
            provider=outcome.provider,
            model=outcome.model,
            prompt_version="content-v0.1",
            status="completed",
            request_payload={"story_id": story.id, "source_url": story.url},
            response_payload=payload,
            warning=outcome.warning,
        )
        session.add(generation)
        session.flush()
        content = ContentItem(
            story_id=story.id,
            generation_id=generation.id,
            status="review",
            content_type=outcome.package.content_type,
            content_pillar=outcome.package.content_pillar,
            hook=outcome.package.hook,
            caption=outcome.package.caption,
            validation_status=outcome.package.validation_status.value,
            pre_publish_viral_score=outcome.package.pre_publish_viral_score,
            payload=payload,
        )
        story.status = "generated"
        session.add(content)
        session.commit()
        session.refresh(content)
        content.generation = generation
        return self._to_read(content)

    @staticmethod
    def decide(
        session: Session, content_id: str, decision_input: DecisionInput
    ) -> ContentItemRead | None:
        content = session.scalar(
            select(ContentItem)
            .options(
                selectinload(ContentItem.generation),
                selectinload(ContentItem.decisions),
                selectinload(ContentItem.story),
            )
            .where(ContentItem.id == content_id)
        )
        if content is None:
            return None
        content.status = decision_input.decision
        decision = ApprovalDecision(
            content_item_id=content.id,
            decision=decision_input.decision,
            reason=decision_input.reason,
            decided_at=datetime.now(timezone.utc),
        )
        content.decisions.append(decision)
        content.story.status = "approved" if decision_input.decision == "approved" else "rejected"
        session.commit()
        return ContentService._to_read(content)

    @staticmethod
    def _to_read(content: ContentItem) -> ContentItemRead:
        latest = None
        if content.decisions:
            decision = sorted(content.decisions, key=lambda item: item.decided_at)[-1]
            latest = {
                "decision": decision.decision,
                "reason": decision.reason,
                "decided_at": decision.decided_at.isoformat(),
            }
        return ContentItemRead(
            id=content.id,
            story_id=content.story_id,
            generation_id=content.generation_id,
            status=content.status,
            content_type=content.content_type,
            content_pillar=content.content_pillar,
            hook=content.hook,
            caption=content.caption,
            validation_status=content.validation_status,
            pre_publish_viral_score=content.pre_publish_viral_score,
            payload=content.payload,
            created_at=content.created_at,
            updated_at=content.updated_at,
            generation=content.generation,
            latest_decision=latest,
        )
