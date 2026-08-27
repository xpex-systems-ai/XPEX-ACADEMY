"""Preview-only AI course drafting for XPeX.

This module deliberately does not write Course/Chapter/Activity rows. It produces a
validated CourseDraft that must be reviewed and explicitly published through the
existing LearnHouse course APIs in a later, separate step.
"""

from __future__ import annotations

import json
import os
from typing import Literal

import httpx
from pydantic import BaseModel, Field, ValidationError


class CourseStudioNotConfigured(RuntimeError):
    """Raised when a provider is requested without its server-side credential."""


class CourseStudioProviderError(RuntimeError):
    """Raised when an upstream provider returns an invalid or unsuccessful response."""


class LessonDraft(BaseModel):
    title: str = Field(min_length=3, max_length=140)
    objective: str = Field(min_length=12, max_length=600)
    explanation: str = Field(min_length=40, max_length=6000)
    practice: str = Field(min_length=20, max_length=2500)
    assessment: str = Field(min_length=20, max_length=2500)
    resource_suggestions: list[str] = Field(default_factory=list, max_length=8)


class ModuleDraft(BaseModel):
    title: str = Field(min_length=3, max_length=140)
    outcome: str = Field(min_length=12, max_length=700)
    lessons: list[LessonDraft] = Field(min_length=1, max_length=8)
    lab: str = Field(min_length=30, max_length=4000)
    evidence: str = Field(min_length=20, max_length=2500)


class CourseDraft(BaseModel):
    title: str = Field(min_length=3, max_length=160)
    description: str = Field(min_length=40, max_length=1600)
    audience: str = Field(min_length=10, max_length=800)
    prerequisites: list[str] = Field(default_factory=list, max_length=12)
    learning_outcomes: list[str] = Field(min_length=3, max_length=12)
    modules: list[ModuleDraft] = Field(min_length=1, max_length=12)
    final_project: str = Field(min_length=40, max_length=4000)
    publication_status: Literal["DRAFT"] = "DRAFT"


class ReviewNote(BaseModel):
    severity: Literal["INFO", "WARNING", "BLOCKER"]
    area: str = Field(min_length=2, max_length=80)
    note: str = Field(min_length=10, max_length=1000)


class CourseDraftReview(BaseModel):
    provider: Literal["huggingface"] = "huggingface"
    notes: list[ReviewNote] = Field(default_factory=list, max_length=20)


class CourseStudioResult(BaseModel):
    draft: CourseDraft
    review: CourseDraftReview | None = None
    generated_by: str
    reviewed_by: str | None = None


def _openrouter_key() -> str:
    key = os.getenv("OPENROUTER_API_KEY", "").strip()
    if not key:
        raise CourseStudioNotConfigured("OPENROUTER_API_KEY is not configured")
    return key


def _hf_key() -> str:
    key = os.getenv("HF_TOKEN", "").strip()
    if not key:
        raise CourseStudioNotConfigured("HF_TOKEN is not configured")
    return key


def _openrouter_model() -> str:
    return os.getenv("XPEX_OPENROUTER_COURSE_MODEL", "openrouter/auto").strip() or "openrouter/auto"


def _hf_review_model() -> str:
    return os.getenv("XPEX_HF_REVIEW_MODEL", "openai/gpt-oss-120b:cheapest").strip() or "openai/gpt-oss-120b:cheapest"


def _course_prompt(topic: str, audience: str, module_count: int) -> str:
    return f"""You are the curriculum architect for XPeX Academy.
Create a professional, practical course draft in Brazilian Portuguese.

Topic: {topic}
Audience: {audience}
Requested modules: {module_count}

Requirements:
- Progress from foundations to real-world application.
- Each module must have concrete learning outcomes, lessons, a lab, and evidence.
- Each lesson must include objective, explanation, practice, assessment, and useful resource suggestions.
- Avoid unverifiable claims, fake certifications, fake metrics, and invented partnerships.
- Do not imply publication. publication_status must remain DRAFT.
- The final project must require a demonstrable artifact and evidence.
- Keep LearnHouse concepts compatible: course -> modules/chapters -> activities/lessons.
"""


async def generate_course_draft(
    topic: str,
    audience: str,
    module_count: int = 1,
    *,
    timeout_seconds: float = 90.0,
) -> CourseDraft:
    """Generate one validated draft using OpenRouter structured output."""
    if not 1 <= module_count <= 12:
        raise ValueError("module_count must be between 1 and 12")
    schema = CourseDraft.model_json_schema()
    payload = {
        "model": _openrouter_model(),
        "messages": [
            {
                "role": "system",
                "content": "Return only content that conforms to the supplied JSON schema.",
            },
            {"role": "user", "content": _course_prompt(topic, audience, module_count)},
        ],
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "xpex_course_draft",
                "strict": True,
                "schema": schema,
            },
        },
        "provider": {"require_parameters": True},
    }
    headers = {
        "Authorization": f"Bearer {_openrouter_key()}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://xpex.academy",
        "X-Title": "XPeX Academy Content Studio",
    }
    async with httpx.AsyncClient(timeout=timeout_seconds) as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
        )
    if response.status_code >= 400:
        raise CourseStudioProviderError(f"OpenRouter request failed with HTTP {response.status_code}")
    try:
        body = response.json()
        raw_content = body["choices"][0]["message"]["content"]
        if isinstance(raw_content, list):
            raw_content = "".join(part.get("text", "") for part in raw_content if isinstance(part, dict))
        return CourseDraft.model_validate_json(raw_content)
    except (KeyError, IndexError, TypeError, ValidationError, json.JSONDecodeError) as exc:
        raise CourseStudioProviderError("OpenRouter returned an invalid CourseDraft") from exc


def _review_prompt(draft: CourseDraft) -> str:
    return f"""Review this XPeX Academy course draft for pedagogical quality, safety, sequencing, factual-risk, and practical value.
Return JSON only with a `notes` array. Each note must contain severity (INFO, WARNING, or BLOCKER), area, and note.
Do not rewrite or publish the course. Do not invent partnerships, accreditations, certifications, or metrics.

COURSE DRAFT:
{draft.model_dump_json(indent=2)}
"""


async def review_course_draft(
    draft: CourseDraft,
    *,
    timeout_seconds: float = 90.0,
) -> CourseDraftReview:
    """Use Hugging Face Inference Providers chat routing as an independent reviewer."""
    payload = {
        "model": _hf_review_model(),
        "messages": [
            {"role": "system", "content": "You are an independent course quality reviewer. Return strict JSON only."},
            {"role": "user", "content": _review_prompt(draft)},
        ],
        "stream": False,
        "response_format": {"type": "json_object"},
    }
    headers = {
        "Authorization": f"Bearer {_hf_key()}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=timeout_seconds) as client:
        response = await client.post(
            "https://router.huggingface.co/v1/chat/completions",
            headers=headers,
            json=payload,
        )
    if response.status_code >= 400:
        raise CourseStudioProviderError(f"Hugging Face request failed with HTTP {response.status_code}")
    try:
        body = response.json()
        raw_content = body["choices"][0]["message"]["content"]
        parsed = json.loads(raw_content)
        return CourseDraftReview.model_validate({"provider": "huggingface", **parsed})
    except (KeyError, IndexError, TypeError, ValidationError, json.JSONDecodeError) as exc:
        raise CourseStudioProviderError("Hugging Face returned an invalid course review") from exc


async def generate_and_review_course_draft(
    topic: str,
    audience: str,
    module_count: int = 1,
    *,
    review_with_hf: bool = True,
) -> CourseStudioResult:
    draft = await generate_course_draft(topic, audience, module_count)
    review = await review_course_draft(draft) if review_with_hf else None
    return CourseStudioResult(
        draft=draft,
        review=review,
        generated_by=f"openrouter:{_openrouter_model()}",
        reviewed_by=f"huggingface:{_hf_review_model()}" if review else None,
    )
