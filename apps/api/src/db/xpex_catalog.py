from __future__ import annotations

from uuid import UUID, uuid4

from sqlalchemy import Column, ForeignKey, Index, Integer, UniqueConstraint
from sqlmodel import Field, SQLModel


class XPeXCatalogVersion(SQLModel, table=True):
    __tablename__ = "xpex_catalog_versions"
    __table_args__ = (UniqueConstraint("catalog_key", name="uq_xpex_catalog_key"),)

    id: int | None = Field(default=None, primary_key=True)
    catalog_key: str = Field(index=True, max_length=80)
    version: str = Field(max_length=20)
    status: str = Field(default="ACTIVE", max_length=30)
    course_count: int = Field(default=0, ge=0)
    created_at: str = Field(max_length=64)


class XPeXSchool(SQLModel, table=True):
    __tablename__ = "xpex_schools"
    __table_args__ = (
        UniqueConstraint("school_key", name="uq_xpex_school_key"),
        UniqueConstraint("catalog_version_id", "slug", name="uq_xpex_school_catalog_slug"),
        Index("ix_xpex_school_catalog_order", "catalog_version_id", "display_order"),
    )

    id: int | None = Field(default=None, primary_key=True)
    school_key: str = Field(index=True, max_length=20)
    catalog_version_id: int = Field(
        sa_column=Column(Integer, ForeignKey("xpex_catalog_versions.id", ondelete="RESTRICT"), nullable=False)
    )
    name: str = Field(max_length=200)
    slug: str = Field(max_length=220)
    description: str | None = Field(default=None, max_length=1000)
    display_order: int = Field(ge=1)
    theme: str = Field(default="dark_neon_premium", max_length=80)
    status: str = Field(default="ACTIVE", max_length=30)


class XPeXTrack(SQLModel, table=True):
    __tablename__ = "xpex_tracks"
    __table_args__ = (
        UniqueConstraint("track_key", name="uq_xpex_track_key"),
        UniqueConstraint("school_id", "slug", name="uq_xpex_track_school_slug"),
    )

    id: int | None = Field(default=None, primary_key=True)
    track_key: str = Field(index=True, max_length=40)
    school_id: int = Field(
        sa_column=Column(Integer, ForeignKey("xpex_schools.id", ondelete="RESTRICT"), nullable=False)
    )
    name: str = Field(max_length=200)
    slug: str = Field(max_length=220)
    description: str | None = Field(default=None, max_length=1000)
    display_order: int = Field(ge=1)
    status: str = Field(default="ACTIVE", max_length=30)


class XPeXCourse(SQLModel, table=True):
    __tablename__ = "xpex_courses"
    __table_args__ = (
        UniqueConstraint("course_uuid", name="uq_xpex_course_uuid"),
        UniqueConstraint("course_key", name="uq_xpex_course_key"),
        UniqueConstraint("catalog_version", "slug", name="uq_xpex_course_catalog_slug"),
        Index("ix_xpex_course_school_order", "school_id", "display_order"),
        Index("ix_xpex_course_publication", "catalog_version", "publication_status"),
    )

    id: int | None = Field(default=None, primary_key=True)
    course_uuid: UUID = Field(default_factory=uuid4, index=True)
    course_key: str = Field(index=True, max_length=30)
    school_id: int = Field(
        sa_column=Column(Integer, ForeignKey("xpex_schools.id", ondelete="RESTRICT"), nullable=False)
    )
    track_id: int | None = Field(
        default=None,
        sa_column=Column(Integer, ForeignKey("xpex_tracks.id", ondelete="SET NULL"), nullable=True),
    )
    title: str = Field(max_length=300)
    slug: str = Field(max_length=320)
    short_description: str | None = Field(default=None, max_length=1000)
    level: str | None = Field(default=None, max_length=30)
    course_type: str | None = Field(default=None, max_length=30)
    thumbnail_url: str | None = Field(default=None, max_length=1000)
    hero_url: str | None = Field(default=None, max_length=1000)
    lifecycle_status: str = Field(default="CATALOG_REGISTERED", max_length=50)
    publication_status: str = Field(default="PRIVATE", max_length=30)
    display_order: int = Field(ge=1)
    catalog_version: str = Field(max_length=80)


class XPeXModule(SQLModel, table=True):
    __tablename__ = "xpex_modules"
    __table_args__ = (
        UniqueConstraint("module_key", name="uq_xpex_module_key"),
        UniqueConstraint("course_id", "display_order", name="uq_xpex_module_course_order"),
    )

    id: int | None = Field(default=None, primary_key=True)
    module_key: str = Field(index=True, max_length=50)
    course_id: int = Field(
        sa_column=Column(Integer, ForeignKey("xpex_courses.id", ondelete="RESTRICT"), nullable=False)
    )
    title: str = Field(max_length=300)
    display_order: int = Field(ge=1)
    status: str = Field(default="DRAFT", max_length=30)


class XPeXLesson(SQLModel, table=True):
    __tablename__ = "xpex_lessons"
    __table_args__ = (
        UniqueConstraint("lesson_key", name="uq_xpex_lesson_key"),
        UniqueConstraint("module_id", "display_order", name="uq_xpex_lesson_module_order"),
    )

    id: int | None = Field(default=None, primary_key=True)
    lesson_key: str = Field(index=True, max_length=70)
    module_id: int = Field(
        sa_column=Column(Integer, ForeignKey("xpex_modules.id", ondelete="RESTRICT"), nullable=False)
    )
    title: str = Field(max_length=300)
    display_order: int = Field(ge=1)
    lesson_type: str = Field(default="VIDEO", max_length=30)
    status: str = Field(default="DRAFT", max_length=30)
