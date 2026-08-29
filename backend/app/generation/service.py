from __future__ import annotations

import json
import logging
from dataclasses import dataclass

from openai import AsyncOpenAI

from backend.app.config import Settings
from backend.app.models import Story
from backend.app.schemas.content import (
    ClaimCheck,
    ContentPackage,
    ContentScores,
    ReelScene,
    ValidationStatus,
)


logger = logging.getLogger(__name__)


@dataclass(slots=True)
class GenerationOutcome:
    package: ContentPackage
    provider: str
    model: str
    warning: str | None = None


class GenerationService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def generate(self, story: Story) -> GenerationOutcome:
        if self.settings.openai_api_key:
            try:
                return await self._generate_with_openai(story)
            except Exception:
                logger.exception("Structured model generation failed; using grounded local provider")
                return GenerationOutcome(
                    package=self._generate_locally(story),
                    provider="local-grounded-fallback",
                    model="deterministic-v0.1",
                    warning="The model provider was unavailable. A source-grounded local draft was created.",
                )

        return GenerationOutcome(
            package=self._generate_locally(story),
            provider="local-grounded",
            model="deterministic-v0.1",
            warning="Local grounded mode is active. Connect a model provider for enhanced creative quality.",
        )

    async def _generate_with_openai(self, story: Story) -> GenerationOutcome:
        api_key = self.settings.openai_api_key.get_secret_value()
        client = AsyncOpenAI(api_key=api_key, timeout=45.0, max_retries=1)
        maximum_validation = (
            ValidationStatus.VERIFIED.value
            if story.source_type == "primary"
            else ValidationStatus.CONCEPT.value
        )
        story_payload = {
            "title": story.title,
            "summary": story.summary,
            "description": story.description[:3000],
            "source": story.source_name,
            "source_type": story.source_type,
            "url": story.url,
            "published_at": story.published_at.isoformat() if story.published_at else None,
            "entities": story.entities,
            "tags": story.tags,
            "story_scores": {
                "novelty": story.score.novelty,
                "wow_factor": story.score.wow_factor,
                "practical_utility": story.score.practical_utility,
                "share_potential": story.score.share_potential,
                "save_potential": story.score.save_potential,
                "audience_fit": story.score.audience_fit,
                "visual_demonstrability": story.score.visual_demonstrability,
            },
            "maximum_validation_status": maximum_validation,
        }
        completion = await client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are the ALPHA CREATOR content engine for an English Instagram channel named "
                        "AI That Actually Works. Return one complete JSON object matching the supplied schema. "
                        "Use only facts present in the story payload. Never invent product functions, integrations, "
                        "prices, benchmarks, time savings, financial outcomes or tests. Use cautious language for "
                        "anything unverified. Do not exceed maximum_validation_status. Create a smartphone-first "
                        "20–35 second reel with high sends/reach potential, practical utility and no hype. Exactly "
                        "five unique hashtags. The pre-publish score is a heuristic content score, never a probability."
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        {
                            "story": story_payload,
                            "output_schema": ContentPackage.model_json_schema(),
                        },
                        ensure_ascii=False,
                    ),
                },
            ],
            response_format={"type": "json_object"},
        )
        raw = completion.choices[0].message.content
        if not raw:
            raise ValueError("empty model response")
        package = ContentPackage.model_validate_json(raw)
        package = package.model_copy(
            update={
                "validation_status": ValidationStatus(maximum_validation),
                "claim_check": package.claim_check.model_copy(
                    update={
                        "source_basis": [story.url],
                        "prohibited_claims_removed": True,
                    }
                ),
            }
        )
        return GenerationOutcome(
            package=package,
            provider="openai",
            model=self.settings.openai_model,
        )

    def _generate_locally(self, story: Story) -> ContentPackage:
        title = story.title.strip()
        short_title = title if len(title) <= 92 else f"{title[:89].rstrip()}…"
        summary = (story.summary or story.description or "The source published a new AI update.").strip()
        if len(summary) > 560:
            summary = f"{summary[:557].rstrip()}…"
        tool = story.entities[0] if story.entities else story.source_name
        practical = story.score.practical_utility
        visual = story.score.visual_demonstrability
        validation = (
            ValidationStatus.VERIFIED
            if story.source_type == "primary"
            else ValidationStatus.CONCEPT
        )
        if practical >= 68 and visual >= 58:
            pillar = "AI Tools & Practical Workflows"
            template = "TEMPLATE A — DEMO"
        elif story.score.wow_factor >= 72:
            pillar = "Real-world AI Experiments"
            template = "TEMPLATE B — RESULT"
        else:
            pillar = "AI Intelligence & Agents"
            template = "TEMPLATE C — INTELLIGENCE"

        hook = (
            f"Most people will read ‘{short_title}’ as news. The useful part is what you can actually test."
        )
        first_frame = "THE NEWS ISN'T THE USEFUL PART"
        core_idea = (
            f"Explain what {story.source_name} announced, show the source, and translate the update into one "
            "practical question the audience can test without overstating what is proven."
        )
        scene_plan = [
            ReelScene(
                scene=1,
                duration_seconds=3,
                visual="Fast crop of the official headline with the source clearly visible.",
                voiceover=hook,
                on_screen_text="DON'T SCROLL PAST THIS",
            ),
            ReelScene(
                scene=2,
                duration_seconds=7,
                visual="Highlight the exact announcement and one concrete phrase from the source page.",
                voiceover=f"{story.source_name} published this: {short_title}",
                on_screen_text="WHAT CHANGED",
            ),
            ReelScene(
                scene=3,
                duration_seconds=8,
                visual="Simple three-node workflow: input, AI action, useful output. Label unverified steps as tests.",
                voiceover=f"The useful question is not whether it sounds impressive. It is where {tool} could remove a real manual step.",
                on_screen_text="WHERE IS THE UTILITY?",
            ),
            ReelScene(
                scene=4,
                duration_seconds=7,
                visual="Show a controlled test card with expected input, observable output and pass/fail criteria.",
                voiceover="Test one narrow workflow, record the output, and verify the result before you trust it.",
                on_screen_text="TEST → VERIFY → USE",
            ),
            ReelScene(
                scene=5,
                duration_seconds=4,
                visual="Return to the source card and end on the channel's clean cyan brand frame.",
                voiceover="Send this to the person who still does that step manually.",
                on_screen_text="AI THAT ACTUALLY WORKS",
            ),
        ]
        reel_script = "\n\n".join(scene.voiceover for scene in scene_plan)
        cta = "Send this to someone who should test the workflow before the hype catches up."
        hashtags = ["#ArtificialIntelligence", "#AITools", "#AIAutomation", "#AIWorkflow", "#FutureOfWork"]
        caption = (
            f"{hook}\n\n{title}\n\n{summary}\n\n"
            f"The practical next step: define one narrow task, compare the AI output with the current process, "
            f"and keep the result only if it can be verified.\n\n"
            f"Source: {story.source_name}\nValidation: {validation.value}\n\n{cta}\n\n"
            + " ".join(hashtags)
        )
        content_scores = ContentScores(
            hook_strength=min(100, story.score.viral_potential + 7),
            wow_factor=story.score.wow_factor,
            utility=story.score.practical_utility,
            share_potential=min(100, story.score.share_potential + 5),
            save_potential=story.score.save_potential,
            visual_demonstrability=story.score.visual_demonstrability,
            novelty=story.score.novelty,
            audience_fit=story.score.audience_fit,
            comment_potential=min(100, story.score.viral_potential * 0.78 + 12),
            follow_conversion=min(
                100,
                story.score.audience_fit * 0.72 + story.score.practical_utility * 0.18,
            ),
        )
        pre_publish = round(
            content_scores.hook_strength * 0.18
            + content_scores.utility * 0.18
            + content_scores.share_potential * 0.18
            + content_scores.save_potential * 0.12
            + content_scores.visual_demonstrability * 0.12
            + content_scores.novelty * 0.10
            + content_scores.audience_fit * 0.12,
            1,
        )
        return ContentPackage(
            content_type="Instagram Reel",
            content_pillar=pillar,
            target_audience="English-speaking creators, operators and AI-curious professionals",
            content_goal="Turn a current AI signal into a useful, verifiable and shareable workflow idea",
            hook_family="Curiosity gap + practical proof",
            primary_viral_trigger="Useful surprise",
            hook=hook,
            first_frame=first_frame,
            core_idea=core_idea,
            reel_script=reel_script,
            scene_plan=scene_plan,
            on_screen_text=[scene.on_screen_text for scene in scene_plan],
            demo_proof=(
                f"Open the original {story.source_name} source, show the relevant statement, then run a bounded "
                "input/output test. Do not claim a result until the recorded output supports it."
            ),
            technology_tool=tool,
            validation_status=validation,
            reel_template=template,
            caption=caption,
            cta=cta,
            hashtags=hashtags,
            thumbnail_text="WHAT CAN YOU ACTUALLY TEST?",
            scores=content_scores,
            pre_publish_viral_score=pre_publish,
            why_it_could_work=(
                "It combines a current signal with a concrete test, a visible source and a send-focused CTA instead "
                "of repeating generic AI news."
            ),
            what_is_being_tested=(
                "Whether a source-first curiosity hook plus a practical verification workflow increases sends, "
                "completion and profile visits from non-followers."
            ),
            primary_success_signal="Sends / Reach",
            claim_check=ClaimCheck(
                source_basis=[story.url],
                claims_to_verify=[
                    "Any observed time saving, quality improvement or workflow replacement shown in the final reel"
                ],
                prohibited_claims_removed=True,
                notes="The draft is grounded in the collected source. Demonstration outcomes must be recorded before publication.",
            ),
        )
