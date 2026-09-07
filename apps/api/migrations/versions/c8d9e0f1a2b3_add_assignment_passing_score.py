"""Add configurable server-side assignment passing score.

Revision ID: c8d9e0f1a2b3
Revises: z5a6b7c8d9e0
"""
from alembic import op
import sqlalchemy as sa

revision = "c8d9e0f1a2b3"
down_revision = ("a6b7c8d9e0f1", "t7u8v9w0x1y2")
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("assignment", sa.Column("passing_score", sa.Integer(), nullable=False, server_default="50"))
    op.create_check_constraint("ck_assignment_passing_score", "assignment", "passing_score >= 0 AND passing_score <= 100")


def downgrade() -> None:
    op.drop_constraint("ck_assignment_passing_score", "assignment", type_="check")
    op.drop_column("assignment", "passing_score")
