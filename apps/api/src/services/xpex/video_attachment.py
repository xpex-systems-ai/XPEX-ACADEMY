"""Guarded LearnHouse attachment contract for XPeX generated video lessons.

The LearnHouse hosted-video player derives playback from activity identifiers plus
``content.filename``. Creating the activity is intentionally separate from media
upload and from publication; this helper always returns ``published=False``.
"""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator

from src.db.courses.activities import (
    ActivityCreate,
    ActivityLockType,
    ActivitySubTypeEnum,
    ActivityTypeEnum,
)


class HostedVideoAttachment(BaseModel):
    chapter_id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=300)
    filename: str = Field(min_length=1, max_length=500)
    start_time: int = Field(default=0, ge=0)
    end_time: int | None = Field(default=None, ge=0)
    autoplay: bool = False
    muted: bool = False
    lock_type: ActivityLockType = ActivityLockType.AUTHENTICATED
    extra_metadata: dict | None = None

    @field_validator("filename")
    @classmethod
    def filename_must_be_plain_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned or cleaned in {".", ".."}:
            raise ValueError("filename is required")
        if "/" in cleaned or "\\" in cleaned:
            raise ValueError("filename must not contain a path")
        return cleaned

    def to_unpublished_activity(self) -> ActivityCreate:
        return ActivityCreate(
            chapter_id=self.chapter_id,
            name=self.name.strip(),
            activity_type=ActivityTypeEnum.TYPE_VIDEO,
            activity_sub_type=ActivitySubTypeEnum.SUBTYPE_VIDEO_HOSTED,
            content={"filename": self.filename},
            details={
                "startTime": self.start_time,
                "endTime": self.end_time,
                "autoplay": self.autoplay,
                "muted": self.muted,
            },
            published=False,
            lock_type=self.lock_type,
            extra_metadata=self.extra_metadata,
        )
