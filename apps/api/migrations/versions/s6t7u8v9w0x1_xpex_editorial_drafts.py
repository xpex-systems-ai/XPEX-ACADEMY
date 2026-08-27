"""Add durable XPeX editorial drafts.

Revision ID: s6t7u8v9w0x1
Revises: r5s6t7u8v9w0
Create Date: 2026-08-27 05:20:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "s6t7u8v9w0x1"
down_revision: Union[str, None] = "r5s6t7u8v9w0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "xpex_editorial_draft",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("draft_id", sa.String(length=80), nullable=False),
        sa.Column("org_id", sa.Integer(), nullable=False),
        sa.Column("created_by_user_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="DRAFT"),
        sa.Column("publication_state", sa.String(length=20), nullable=False, server_default="IDLE"),
        sa.Column("revision", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("content_hash", sa.String(length=64), nullable=False),
        sa.Column("schema_version", sa.String(length=64), nullable=False, server_default="xpex-course-draft-v1"),
        sa.Column("topic", sa.String(length=300), nullable=False),
        sa.Column("audience", sa.String(length=800), nullable=False),
        sa.Column("module_count", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("draft_json", sa.JSON(), nullable=False),
        sa.Column("review_json", sa.JSON(), nullable=True),
        sa.Column("generated_by", sa.String(length=200), nullable=False, server_default=""),
        sa.Column("reviewed_by", sa.String(length=200), nullable=True),
        sa.Column("reviewed_revision", sa.Integer(), nullable=True),
        sa.Column("reviewed_content_hash", sa.String(length=64), nullable=True),
        sa.Column("reviewed_at", sa.String(length=64), nullable=True),
        sa.Column("approved_by_user_id", sa.Integer(), nullable=True),
        sa.Column("approved_revision", sa.Integer(), nullable=True),
        sa.Column("approved_content_hash", sa.String(length=64), nullable=True),
        sa.Column("approved_at", sa.String(length=64), nullable=True),
        sa.Column("native_course_id", sa.Integer(), nullable=True),
        sa.Column("native_course_uuid", sa.String(length=100), nullable=True),
        sa.Column("native_mapping", sa.JSON(), nullable=True),
        sa.Column("published_at", sa.String(length=64), nullable=True),
        sa.Column("publication_error", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.String(length=64), nullable=False),
        sa.Column("updated_at", sa.String(length=64), nullable=False),
        sa.ForeignKeyConstraint(["approved_by_user_id"], ["user.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["user.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["native_course_id"], ["course.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["org_id"], ["organization.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("draft_id", name="uq_xpex_editorial_draft_draft_id"),
    )
    op.create_index("ix_xpex_editorial_draft_draft_id", "xpex_editorial_draft", ["draft_id"], unique=False)
    op.create_index("ix_xpex_editorial_org_status", "xpex_editorial_draft", ["org_id", "status"], unique=False)
    op.create_index("ix_xpex_editorial_org_updated", "xpex_editorial_draft", ["org_id", "updated_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_xpex_editorial_org_updated", table_name="xpex_editorial_draft")
    op.drop_index("ix_xpex_editorial_org_status", table_name="xpex_editorial_draft")
    op.drop_index("ix_xpex_editorial_draft_draft_id", table_name="xpex_editorial_draft")
    op.drop_table("xpex_editorial_draft")
