from __future__ import annotations

from uuid import UUID, uuid4

from sqlalchemy import JSON, Column, ForeignKey, Index, Integer, UniqueConstraint
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
    blueprint_json: dict = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    qa_status: str = Field(default="NOT_STARTED", max_length=40)


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
    learning_objective: str = Field(default="", max_length=1000)
    prerequisites_json: list = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    lesson_script: str = Field(default="")
    summary: str = Field(default="")
    exercise_json: dict = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    practical_activity_json: dict = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    completion_criteria_json: list = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    media_json: dict = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    optional_resources_json: dict = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))


class XPeXAssessment(SQLModel, table=True):
    __tablename__ = "xpex_assessments"
    __table_args__ = (
        UniqueConstraint("assessment_key", name="uq_xpex_assessment_key"),
        Index("ix_xpex_assessment_course", "course_id", "display_order"),
    )

    id: int | None = Field(default=None, primary_key=True)
    assessment_key: str = Field(index=True, max_length=80)
    course_id: int = Field(sa_column=Column(Integer, ForeignKey("xpex_courses.id", ondelete="RESTRICT"), nullable=False))
    module_id: int | None = Field(default=None, sa_column=Column(Integer, ForeignKey("xpex_modules.id", ondelete="RESTRICT"), nullable=True))
    assessment_type: str = Field(max_length=30)
    display_order: int = Field(ge=1)
    objective_keys_json: list = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    questions_json: list = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    passing_score: int = Field(default=70, ge=0, le=100)
    max_attempts: int = Field(default=3, ge=1)
    status: str = Field(default="DRAFT", max_length=30)


class XPeXAssessmentAttempt(SQLModel, table=True):
    __tablename__ = "xpex_assessment_attempts"
    __table_args__ = (UniqueConstraint("assessment_id", "learner_key", "attempt_number", name="uq_xpex_assessment_attempt"),)

    id: int | None = Field(default=None, primary_key=True)
    assessment_id: int = Field(sa_column=Column(Integer, ForeignKey("xpex_assessments.id", ondelete="RESTRICT"), nullable=False))
    learner_key: str = Field(max_length=160)
    attempt_number: int = Field(ge=1)
    answers_json: list = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    score: int = Field(ge=0, le=100)
    passed: bool = Field(default=False)
    submitted_at: str = Field(max_length=64)


class XPeXWaveMediaJob(SQLModel, table=True):
    __tablename__ = "xpex_wave_media_jobs"
    __table_args__ = (UniqueConstraint("lesson_id", name="uq_xpex_wave_media_lesson"),)

    id: int | None = Field(default=None, primary_key=True)
    job_id: str = Field(index=True, max_length=80)
    lesson_id: int = Field(sa_column=Column(Integer, ForeignKey("xpex_lessons.id", ondelete="RESTRICT"), nullable=False))
    provider: str = Field(max_length=80)
    provider_job_id: str | None = Field(default=None, max_length=160)
    video_type: str = Field(default="XPEX_EXPLAINER", max_length=40)
    status: str = Field(default="SCRIPT_READY", max_length=40)
    artifact_json: dict = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    qa_json: dict = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    original_error: str | None = Field(default=None)
