"""Add durable XPeX video jobs.

Revision ID: t7u8v9w0x1y2
Revises: s6t7u8v9w0x1
Create Date: 2026-08-27 07:55:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "t7u8v9w0x1y2"
down_revision: str | None = "s6t7u8v9w0x1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "xpex_video_job",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("job_id", sa.String(length=80), nullable=False),
        sa.Column("batch_id", sa.String(length=80), nullable=False),
        sa.Column("lesson_id", sa.String(length=160), nullable=False),
        sa.Column("org_id", sa.Integer(), nullable=False),
        sa.Column("created_by_user_id", sa.Integer(), nullable=False),
        sa.Column("editorial_draft_id", sa.String(length=80), nullable=True),
        sa.Column("native_course_uuid", sa.String(length=100), nullable=True),
        sa.Column("native_activity_uuid", sa.String(length=100), nullable=True),
        sa.Column("state", sa.String(length=40), nullable=False, server_default="QUEUED"),
        sa.Column("resume_state", sa.String(length=40), nullable=True),
        sa.Column("revision", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("content_hash", sa.String(length=64), nullable=False, server_default=""),
        sa.Column("manifest_json", sa.JSON(), nullable=False),
        sa.Column("attempt_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("lease_id", sa.String(length=120), nullable=True),
        sa.Column("lease_expires_at", sa.String(length=64), nullable=True),
        sa.Column("last_error", sa.String(length=1000), nullable=True),
        sa.Column("approved_by_user_id", sa.Integer(), nullable=True),
        sa.Column("approved_at", sa.String(length=64), nullable=True),
        sa.Column("attached_at", sa.String(length=64), nullable=True),
        sa.Column("published_at", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.String(length=64), nullable=False),
        sa.Column("updated_at", sa.String(length=64), nullable=False),
        sa.ForeignKeyConstraint(["approved_by_user_id"], ["user.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["user.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["org_id"], ["organization.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("batch_id", "lesson_id", name="uq_xpex_video_job_batch_lesson"),
        sa.UniqueConstraint("job_id", name="uq_xpex_video_job_job_id"),
    )
    op.create_index("ix_xpex_video_job_job_id", "xpex_video_job", ["job_id"], unique=False)
    op.create_index("ix_xpex_video_org_state", "xpex_video_job", ["org_id", "state"], unique=False)
    op.create_index("ix_xpex_video_batch_state", "xpex_video_job", ["batch_id", "state"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_xpex_video_batch_state", table_name="xpex_video_job")
    op.drop_index("ix_xpex_video_org_state", table_name="xpex_video_job")
    op.drop_index("ix_xpex_video_job_job_id", table_name="xpex_video_job")
    op.drop_table("xpex_video_job")
