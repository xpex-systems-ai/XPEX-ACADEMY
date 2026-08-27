from __future__ import annotations

from typing import Optional

from sqlalchemy import JSON, Column, ForeignKey, Index, Integer, UniqueConstraint
from sqlmodel import Field, SQLModel


class XPeXEditorialDraft(SQLModel, table=True):
    __tablename__ = "xpex_editorial_draft"
    __table_args__ = (
        UniqueConstraint("draft_id", name="uq_xpex_editorial_draft_draft_id"),
        Index("ix_xpex_editorial_org_status", "org_id", "status"),
        Index("ix_xpex_editorial_org_updated", "org_id", "updated_at"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    draft_id: str = Field(index=True, max_length=80)
    org_id: int = Field(
        sa_column=Column(Integer, ForeignKey("organization.id", ondelete="CASCADE"), nullable=False)
    )
    created_by_user_id: int = Field(
        sa_column=Column(Integer, ForeignKey("user.id", ondelete="RESTRICT"), nullable=False)
    )

    status: str = Field(default="DRAFT", max_length=20)
    publication_state: str = Field(default="IDLE", max_length=20)
    revision: int = Field(default=1, ge=1)
    content_hash: str = Field(max_length=64)
    schema_version: str = Field(default="xpex-course-draft-v1", max_length=64)

    topic: str = Field(max_length=300)
    audience: str = Field(max_length=800)
    module_count: int = Field(default=1, ge=1, le=12)
    draft_json: dict = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))

    review_json: Optional[dict] = Field(default=None, sa_column=Column(JSON, nullable=True))
    generated_by: str = Field(default="", max_length=200)
    reviewed_by: Optional[str] = Field(default=None, max_length=200)
    reviewed_revision: Optional[int] = None
    reviewed_content_hash: Optional[str] = Field(default=None, max_length=64)
    reviewed_at: Optional[str] = Field(default=None, max_length=64)

    approved_by_user_id: Optional[int] = Field(
        default=None,
        sa_column=Column(Integer, ForeignKey("user.id", ondelete="SET NULL"), nullable=True),
    )
    approved_revision: Optional[int] = None
    approved_content_hash: Optional[str] = Field(default=None, max_length=64)
    approved_at: Optional[str] = Field(default=None, max_length=64)

    native_course_id: Optional[int] = Field(
        default=None,
        sa_column=Column(Integer, ForeignKey("course.id", ondelete="SET NULL"), nullable=True),
    )
    native_course_uuid: Optional[str] = Field(default=None, max_length=100)
    native_mapping: Optional[dict] = Field(default=None, sa_column=Column(JSON, nullable=True))
    published_at: Optional[str] = Field(default=None, max_length=64)
    publication_error: Optional[str] = Field(default=None, max_length=500)

    created_at: str = Field(max_length=64)
    updated_at: str = Field(max_length=64)
