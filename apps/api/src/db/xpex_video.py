from __future__ import annotations

from sqlalchemy import JSON, Column, ForeignKey, Index, Integer, UniqueConstraint
from sqlmodel import Field, SQLModel


class XPeXVideoJob(SQLModel, table=True):
    __tablename__ = "xpex_video_job"
    __table_args__ = (
        UniqueConstraint("job_id", name="uq_xpex_video_job_job_id"),
        UniqueConstraint("batch_id", "lesson_id", name="uq_xpex_video_job_batch_lesson"),
        Index("ix_xpex_video_org_state", "org_id", "state"),
        Index("ix_xpex_video_batch_state", "batch_id", "state"),
    )

    id: int | None = Field(default=None, primary_key=True)
    job_id: str = Field(index=True, max_length=80)
    batch_id: str = Field(max_length=80)
    lesson_id: str = Field(max_length=160)
    org_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("organization.id", ondelete="CASCADE"),
            nullable=False,
        )
    )
    created_by_user_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("user.id", ondelete="RESTRICT"),
            nullable=False,
        )
    )
    editorial_draft_id: str | None = Field(default=None, max_length=80)
    native_course_uuid: str | None = Field(default=None, max_length=100)
    native_activity_uuid: str | None = Field(default=None, max_length=100)
    state: str = Field(default="QUEUED", max_length=40)
    resume_state: str | None = Field(default=None, max_length=40)
    revision: int = Field(default=1, ge=1)
    content_hash: str = Field(default="", max_length=64)
    manifest_json: dict = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    attempt_count: int = Field(default=0, ge=0)
    lease_id: str | None = Field(default=None, max_length=120)
    lease_expires_at: str | None = Field(default=None, max_length=64)
    last_error: str | None = Field(default=None, max_length=1000)
    approved_by_user_id: int | None = Field(
        default=None,
        sa_column=Column(
            Integer,
            ForeignKey("user.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    approved_at: str | None = Field(default=None, max_length=64)
    attached_at: str | None = Field(default=None, max_length=64)
    published_at: str | None = Field(default=None, max_length=64)
    created_at: str = Field(max_length=64)
    updated_at: str = Field(max_length=64)
