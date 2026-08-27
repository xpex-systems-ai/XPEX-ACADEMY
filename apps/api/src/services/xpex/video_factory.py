"""Domain foundation for XPeX AI Video Lesson Factory.

This module intentionally contains no provider invocation and no publication side effect.
It defines the durable state machine, revision/hash evidence and batch planning contract
that later provider/storage adapters must obey.
"""

from __future__ import annotations

import hashlib
import json
import os
from enum import StrEnum

from pydantic import BaseModel, Field, model_validator


class VideoJobState(StrEnum):
    QUEUED = "QUEUED"
    SCRIPTING = "SCRIPTING"
    STORYBOARDING = "STORYBOARDING"
    NARRATING = "NARRATING"
    ASSET_GENERATION = "ASSET_GENERATION"
    RENDERING = "RENDERING"
    REVIEWING = "REVIEWING"
    AWAITING_HUMAN_APPROVAL = "AWAITING_HUMAN_APPROVAL"
    APPROVED = "APPROVED"
    ATTACHED = "ATTACHED"
    PUBLISHED = "PUBLISHED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class ReviewSeverity(StrEnum):
    INFO = "INFO"
    WARNING = "WARNING"
    BLOCKER = "BLOCKER"


class VideoReviewNote(BaseModel):
    severity: ReviewSeverity
    code: str = Field(min_length=1, max_length=80)
    message: str = Field(min_length=1, max_length=1000)


class VideoScript(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    learning_objective: str = Field(min_length=1, max_length=1000)
    narration_text: str = Field(min_length=1)
    estimated_duration_seconds: int = Field(ge=30, le=3600)


class StoryboardScene(BaseModel):
    order: int = Field(ge=1)
    narration: str = Field(min_length=1)
    visual_direction: str = Field(min_length=1)
    deterministic_capture: bool = False


class MediaRef(BaseModel):
    uri: str = Field(min_length=1)
    checksum_sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    mime_type: str = Field(min_length=1)


class NarrationAsset(MediaRef):
    language: str = "pt-BR"
    duration_seconds: int = Field(gt=0)


class VideoAsset(MediaRef):
    duration_seconds: int = Field(gt=0)


class CaptionAsset(MediaRef):
    format: str = Field(pattern=r"^(vtt|srt)$")
    language: str = "pt-BR"


class MultimodalReview(BaseModel):
    model: str = Field(min_length=1)
    notes: list[VideoReviewNote] = Field(default_factory=list)

    @property
    def has_blocker(self) -> bool:
        return any(note.severity == ReviewSeverity.BLOCKER for note in self.notes)


class LessonVideoManifest(BaseModel):
    lesson_id: str = Field(min_length=1)
    revision: int = Field(default=1, ge=1)
    state: VideoJobState = VideoJobState.QUEUED
    video_script: VideoScript | None = None
    storyboard: list[StoryboardScene] = Field(default_factory=list)
    narration: NarrationAsset | None = None
    thumbnails: list[MediaRef] = Field(default_factory=list)
    assets: list[MediaRef] = Field(default_factory=list)
    captions: list[CaptionAsset] = Field(default_factory=list)
    video_draft: VideoAsset | None = None
    review: MultimodalReview | None = None
    approved_revision: int | None = None
    approved_content_hash: str | None = None
    approved_by_user_id: int | None = None
    learnhouse_activity_uuid: str | None = None
    attached_unpublished: bool = False
    published: bool = False

    @model_validator(mode="after")
    def enforce_publication_invariants(self) -> "LessonVideoManifest":
        if self.published and not self.learnhouse_activity_uuid:
            raise ValueError("published video requires a LearnHouse activity")
        if self.published and not self.attached_unpublished:
            raise ValueError("video must pass through unpublished attachment before publish")
        if self.state in {VideoJobState.APPROVED, VideoJobState.ATTACHED, VideoJobState.PUBLISHED}:
            if self.approved_revision != self.revision or not self.approved_content_hash:
                raise ValueError("approved states require revision-bound approval evidence")
        return self

    def content_hash(self) -> str:
        payload = {
            "lesson_id": self.lesson_id,
            "revision": self.revision,
            "video_script": self.video_script.model_dump(mode="json") if self.video_script else None,
            "storyboard": [scene.model_dump(mode="json") for scene in self.storyboard],
            "narration": self.narration.model_dump(mode="json") if self.narration else None,
            "thumbnails": [asset.model_dump(mode="json") for asset in self.thumbnails],
            "assets": [asset.model_dump(mode="json") for asset in self.assets],
            "captions": [asset.model_dump(mode="json") for asset in self.captions],
            "video_draft": self.video_draft.model_dump(mode="json") if self.video_draft else None,
        }
        encoded = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(encoded.encode()).hexdigest()

    def invalidate_approval(self) -> None:
        self.revision += 1
        self.approved_revision = None
        self.approved_content_hash = None
        self.approved_by_user_id = None
        self.learnhouse_activity_uuid = None
        self.attached_unpublished = False
        self.published = False
        self.state = VideoJobState.QUEUED

    def approve(self, user_id: int) -> None:
        if self.state != VideoJobState.AWAITING_HUMAN_APPROVAL:
            raise ValueError("video is not awaiting human approval")
        if not self.review:
            raise ValueError("multimodal review is required")
        if self.review.has_blocker:
            raise ValueError("BLOCKER review notes prevent approval")
        if not self.video_draft:
            raise ValueError("video draft is required")
        self.approved_revision = self.revision
        self.approved_content_hash = self.content_hash()
        self.approved_by_user_id = user_id
        self.state = VideoJobState.APPROVED

    def mark_attached_unpublished(self, activity_uuid: str) -> None:
        if self.state != VideoJobState.APPROVED:
            raise ValueError("only an approved video can be attached")
        if self.approved_revision != self.revision or self.approved_content_hash != self.content_hash():
            raise ValueError("approval evidence is stale")
        self.learnhouse_activity_uuid = activity_uuid
        self.attached_unpublished = True
        self.state = VideoJobState.ATTACHED

    def mark_published(self) -> None:
        if self.state != VideoJobState.ATTACHED or not self.attached_unpublished:
            raise ValueError("explicit unpublished attachment is required before publish")
        self.published = True
        self.state = VideoJobState.PUBLISHED


class VideoBatchPlan(BaseModel):
    course_id: str = Field(min_length=1)
    lesson_ids: list[str] = Field(min_length=1, max_length=100)
    concurrency: int = Field(default=3, ge=1, le=8)

    @model_validator(mode="after")
    def unique_lessons(self) -> "VideoBatchPlan":
        if len(set(self.lesson_ids)) != len(self.lesson_ids):
            raise ValueError("lesson_ids must be unique")
        return self

    def manifests(self) -> list[LessonVideoManifest]:
        return [LessonVideoManifest(lesson_id=lesson_id) for lesson_id in self.lesson_ids]


class VideoModelRegistry(BaseModel):
    video_model: str | None = None
    image_model: str | None = None
    tts_model: str | None = None
    stt_model: str | None = None
    multimodal_review_model: str | None = None

    @classmethod
    def from_environment(cls) -> "VideoModelRegistry":
        return cls(
            video_model=os.getenv("XPEX_HF_VIDEO_MODEL"),
            image_model=os.getenv("XPEX_HF_IMAGE_MODEL"),
            tts_model=os.getenv("XPEX_HF_TTS_MODEL"),
            stt_model=os.getenv("XPEX_HF_STT_MODEL"),
            multimodal_review_model=os.getenv("XPEX_HF_MULTIMODAL_REVIEW_MODEL"),
        )

    def configured_for_full_pipeline(self) -> bool:
        return all(
            [
                self.video_model,
                self.image_model,
                self.tts_model,
                self.stt_model,
                self.multimodal_review_model,
            ]
        )
