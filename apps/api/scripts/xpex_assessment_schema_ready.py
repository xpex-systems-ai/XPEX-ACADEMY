"""Fail-closed, idempotent schema readiness for the XPeX assessment flow.

Production historically predates some Alembic bookkeeping, so a global `upgrade head`
can attempt unrelated historical migrations. This repair is deliberately scoped to the
single column required by the native Module-1 assessment. It never touches credentials,
users, courses, submissions, payments, or unrelated tables.
"""

import asyncio

from config.config import get_learnhouse_config
from scripts.xpex_launch_course import _to_async_url
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


async def run() -> int:
    config = get_learnhouse_config()
    sql_url = config.database_config.sql_connection_string  # type: ignore[attr-defined]
    engine = create_async_engine(_to_async_url(sql_url), pool_pre_ping=True)
    try:
        async with engine.begin() as connection:
            column_exists = bool(
                (
                    await connection.execute(
                        text(
                            """
                            SELECT 1
                            FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'assignment'
                              AND column_name = 'passing_score'
                            """
                        )
                    )
                ).scalar_one_or_none()
            )
            if not column_exists:
                await connection.execute(
                    text(
                        "ALTER TABLE assignment "
                        "ADD COLUMN passing_score INTEGER NOT NULL DEFAULT 50"
                    )
                )
                print("XPEX_DB_MIGRATION column=assignment.passing_score action=created")
            else:
                print("XPEX_DB_MIGRATION column=assignment.passing_score action=exists")

            constraint_exists = bool(
                (
                    await connection.execute(
                        text(
                            """
                            SELECT 1
                            FROM pg_constraint c
                            JOIN pg_class t ON t.oid = c.conrelid
                            JOIN pg_namespace n ON n.oid = t.relnamespace
                            WHERE n.nspname = current_schema()
                              AND t.relname = 'assignment'
                              AND c.conname = 'ck_assignment_passing_score'
                            """
                        )
                    )
                ).scalar_one_or_none()
            )
            if not constraint_exists:
                await connection.execute(
                    text(
                        "ALTER TABLE assignment "
                        "ADD CONSTRAINT ck_assignment_passing_score "
                        "CHECK (passing_score >= 0 AND passing_score <= 100)"
                    )
                )
                print("XPEX_DB_MIGRATION constraint=ck_assignment_passing_score action=created")
            else:
                print("XPEX_DB_MIGRATION constraint=ck_assignment_passing_score action=exists")

            verified = bool(
                (
                    await connection.execute(
                        text(
                            """
                            SELECT 1
                            FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'assignment'
                              AND column_name = 'passing_score'
                              AND is_nullable = 'NO'
                            """
                        )
                    )
                ).scalar_one_or_none()
            )
            if not verified:
                print("XPEX_DB_MIGRATION BLOCKED passing_score_verification=false")
                return 2

        print("XPEX_DB_MIGRATION PASS assessment_schema_ready=true")
        return 0
    finally:
        await engine.dispose()


if __name__ == "__main__":
    raise SystemExit(asyncio.run(run()))
