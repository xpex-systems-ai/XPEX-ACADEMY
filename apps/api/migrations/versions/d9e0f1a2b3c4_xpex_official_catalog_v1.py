"""Add versioned XPeX official catalog hierarchy.

Revision ID: d9e0f1a2b3c4
Revises: c8d9e0f1a2b3
Create Date: 2026-09-09 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "d9e0f1a2b3c4"
down_revision: str | None = "c8d9e0f1a2b3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "xpex_catalog_versions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("catalog_key", sa.String(80), nullable=False),
        sa.Column("version", sa.String(20), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="ACTIVE"),
        sa.Column("course_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.String(64), nullable=False),
        sa.CheckConstraint("course_count >= 0", name="ck_xpex_catalog_course_count"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("catalog_key", name="uq_xpex_catalog_key"),
    )
    op.create_index("ix_xpex_catalog_versions_catalog_key", "xpex_catalog_versions", ["catalog_key"])
    op.create_table(
        "xpex_schools",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("school_key", sa.String(20), nullable=False),
        sa.Column("catalog_version_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(220), nullable=False),
        sa.Column("description", sa.String(1000), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("theme", sa.String(80), nullable=False, server_default="dark_neon_premium"),
        sa.Column("status", sa.String(30), nullable=False, server_default="ACTIVE"),
        sa.CheckConstraint("display_order >= 1", name="ck_xpex_school_display_order"),
        sa.ForeignKeyConstraint(["catalog_version_id"], ["xpex_catalog_versions.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("school_key", name="uq_xpex_school_key"),
        sa.UniqueConstraint("catalog_version_id", "slug", name="uq_xpex_school_catalog_slug"),
    )
    op.create_index("ix_xpex_schools_school_key", "xpex_schools", ["school_key"])
    op.create_index("ix_xpex_school_catalog_order", "xpex_schools", ["catalog_version_id", "display_order"])
    op.create_table(
        "xpex_tracks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("track_key", sa.String(40), nullable=False),
        sa.Column("school_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(220), nullable=False),
        sa.Column("description", sa.String(1000), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="ACTIVE"),
        sa.CheckConstraint("display_order >= 1", name="ck_xpex_track_display_order"),
        sa.ForeignKeyConstraint(["school_id"], ["xpex_schools.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("track_key", name="uq_xpex_track_key"),
        sa.UniqueConstraint("school_id", "slug", name="uq_xpex_track_school_slug"),
    )
    op.create_index("ix_xpex_tracks_track_key", "xpex_tracks", ["track_key"])
    op.create_table(
        "xpex_courses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("course_uuid", sa.Uuid(), nullable=False),
        sa.Column("course_key", sa.String(30), nullable=False),
        sa.Column("school_id", sa.Integer(), nullable=False),
        sa.Column("track_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("slug", sa.String(320), nullable=False),
        sa.Column("short_description", sa.String(1000), nullable=True),
        sa.Column("level", sa.String(30), nullable=True),
        sa.Column("course_type", sa.String(30), nullable=True),
        sa.Column("thumbnail_url", sa.String(1000), nullable=True),
        sa.Column("hero_url", sa.String(1000), nullable=True),
        sa.Column("lifecycle_status", sa.String(50), nullable=False, server_default="CATALOG_REGISTERED"),
        sa.Column("publication_status", sa.String(30), nullable=False, server_default="PRIVATE"),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("catalog_version", sa.String(80), nullable=False),
        sa.CheckConstraint("display_order >= 1", name="ck_xpex_course_display_order"),
        sa.ForeignKeyConstraint(["school_id"], ["xpex_schools.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["track_id"], ["xpex_tracks.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("course_uuid", name="uq_xpex_course_uuid"),
        sa.UniqueConstraint("course_key", name="uq_xpex_course_key"),
        sa.UniqueConstraint("catalog_version", "slug", name="uq_xpex_course_catalog_slug"),
    )
    op.create_index("ix_xpex_courses_course_uuid", "xpex_courses", ["course_uuid"])
    op.create_index("ix_xpex_courses_course_key", "xpex_courses", ["course_key"])
    op.create_index("ix_xpex_course_school_order", "xpex_courses", ["school_id", "display_order"])
    op.create_index("ix_xpex_course_publication", "xpex_courses", ["catalog_version", "publication_status"])
    op.create_table(
        "xpex_modules",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("module_key", sa.String(50), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="DRAFT"),
        sa.CheckConstraint("display_order >= 1", name="ck_xpex_module_display_order"),
        sa.ForeignKeyConstraint(["course_id"], ["xpex_courses.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("module_key", name="uq_xpex_module_key"),
        sa.UniqueConstraint("course_id", "display_order", name="uq_xpex_module_course_order"),
    )
    op.create_index("ix_xpex_modules_module_key", "xpex_modules", ["module_key"])
    op.create_table(
        "xpex_lessons",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("lesson_key", sa.String(70), nullable=False),
        sa.Column("module_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("lesson_type", sa.String(30), nullable=False, server_default="VIDEO"),
        sa.Column("status", sa.String(30), nullable=False, server_default="DRAFT"),
        sa.CheckConstraint("display_order >= 1", name="ck_xpex_lesson_display_order"),
        sa.ForeignKeyConstraint(["module_id"], ["xpex_modules.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("lesson_key", name="uq_xpex_lesson_key"),
        sa.UniqueConstraint("module_id", "display_order", name="uq_xpex_lesson_module_order"),
    )
    op.create_index("ix_xpex_lessons_lesson_key", "xpex_lessons", ["lesson_key"])


def downgrade() -> None:
    for table in ("xpex_lessons", "xpex_modules", "xpex_courses", "xpex_tracks", "xpex_schools", "xpex_catalog_versions"):
        op.drop_table(table)
