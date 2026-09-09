"""Add private Wave 1 curriculum, assessment, and controlled-media storage.

Revision ID: e0f1a2b3c4d5
Revises: d9e0f1a2b3c4
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "e0f1a2b3c4d5"
down_revision: str | None = "d9e0f1a2b3c4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("xpex_courses", sa.Column("blueprint_json", sa.JSON(), nullable=False, server_default="{}"))
    op.add_column("xpex_courses", sa.Column("qa_status", sa.String(40), nullable=False, server_default="NOT_STARTED"))
    for name, column in (
        ("learning_objective", sa.Column("learning_objective", sa.String(1000), nullable=False, server_default="")),
        ("prerequisites_json", sa.Column("prerequisites_json", sa.JSON(), nullable=False, server_default="[]")),
        ("lesson_script", sa.Column("lesson_script", sa.Text(), nullable=False, server_default="")),
        ("summary", sa.Column("summary", sa.Text(), nullable=False, server_default="")),
        ("exercise_json", sa.Column("exercise_json", sa.JSON(), nullable=False, server_default="{}")),
        ("practical_activity_json", sa.Column("practical_activity_json", sa.JSON(), nullable=False, server_default="{}")),
        ("completion_criteria_json", sa.Column("completion_criteria_json", sa.JSON(), nullable=False, server_default="[]")),
        ("media_json", sa.Column("media_json", sa.JSON(), nullable=False, server_default="{}")),
        ("optional_resources_json", sa.Column("optional_resources_json", sa.JSON(), nullable=False, server_default="{}")),
    ):
        op.add_column("xpex_lessons", column)
    op.create_table(
        "xpex_assessments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("assessment_key", sa.String(80), nullable=False, unique=True),
        sa.Column("course_id", sa.Integer(), sa.ForeignKey("xpex_courses.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("module_id", sa.Integer(), sa.ForeignKey("xpex_modules.id", ondelete="RESTRICT")),
        sa.Column("assessment_type", sa.String(30), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("objective_keys_json", sa.JSON(), nullable=False),
        sa.Column("questions_json", sa.JSON(), nullable=False),
        sa.Column("passing_score", sa.Integer(), nullable=False, server_default="70"),
        sa.Column("max_attempts", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("status", sa.String(30), nullable=False, server_default="DRAFT"),
        sa.CheckConstraint("passing_score BETWEEN 0 AND 100", name="ck_xpex_assessment_passing_score"),
        sa.CheckConstraint("max_attempts >= 1", name="ck_xpex_assessment_attempts"),
    )
    op.create_index("ix_xpex_assessment_course", "xpex_assessments", ["course_id", "display_order"])
    op.create_table(
        "xpex_assessment_attempts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("assessment_id", sa.Integer(), sa.ForeignKey("xpex_assessments.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("learner_key", sa.String(160), nullable=False),
        sa.Column("attempt_number", sa.Integer(), nullable=False),
        sa.Column("answers_json", sa.JSON(), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("passed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("submitted_at", sa.String(64), nullable=False),
        sa.UniqueConstraint("assessment_id", "learner_key", "attempt_number", name="uq_xpex_assessment_attempt"),
        sa.CheckConstraint("score BETWEEN 0 AND 100", name="ck_xpex_attempt_score"),
        sa.CheckConstraint("attempt_number >= 1", name="ck_xpex_attempt_number"),
    )
    op.create_table(
        "xpex_wave_media_jobs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("job_id", sa.String(80), nullable=False, unique=True),
        sa.Column("lesson_id", sa.Integer(), sa.ForeignKey("xpex_lessons.id", ondelete="RESTRICT"), nullable=False, unique=True),
        sa.Column("provider", sa.String(80), nullable=False),
        sa.Column("provider_job_id", sa.String(160)),
        sa.Column("video_type", sa.String(40), nullable=False, server_default="XPEX_EXPLAINER"),
        sa.Column("status", sa.String(40), nullable=False, server_default="SCRIPT_READY"),
        sa.Column("artifact_json", sa.JSON(), nullable=False),
        sa.Column("qa_json", sa.JSON(), nullable=False),
        sa.Column("original_error", sa.Text()),
    )


def downgrade() -> None:
    op.drop_table("xpex_wave_media_jobs")
    op.drop_table("xpex_assessment_attempts")
    op.drop_index("ix_xpex_assessment_course", table_name="xpex_assessments")
    op.drop_table("xpex_assessments")
    for name in ("optional_resources_json", "media_json", "completion_criteria_json", "practical_activity_json", "exercise_json", "summary", "lesson_script", "prerequisites_json", "learning_objective"):
        op.drop_column("xpex_lessons", name)
    op.drop_column("xpex_courses", "qa_status")
    op.drop_column("xpex_courses", "blueprint_json")
