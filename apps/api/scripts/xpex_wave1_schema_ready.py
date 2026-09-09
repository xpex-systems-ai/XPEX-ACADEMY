"""Fail-closed, idempotent schema readiness for XPeX Wave 1.

Production predates reliable Alembic bookkeeping, so this intentionally applies
only the schema represented by revision e0f1a2b3c4d5. It does not create or stamp
alembic_version and it does not touch users, enrollments, payments, progress,
certificates, credentials, or legacy course tables.
"""

import asyncio

from config.config import get_learnhouse_config
from scripts.xpex_launch_course import _to_async_url
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

REVISION_EQUIVALENT = "e0f1a2b3c4d5"

COURSE_COLUMNS = (
    ("blueprint_json", "JSON NOT NULL DEFAULT '{}'::json"),
    ("qa_status", "VARCHAR(40) NOT NULL DEFAULT 'NOT_STARTED'"),
)

LESSON_COLUMNS = (
    ("learning_objective", "VARCHAR(1000) NOT NULL DEFAULT ''"),
    ("prerequisites_json", "JSON NOT NULL DEFAULT '[]'::json"),
    ("lesson_script", "TEXT NOT NULL DEFAULT ''"),
    ("summary", "TEXT NOT NULL DEFAULT ''"),
    ("exercise_json", "JSON NOT NULL DEFAULT '{}'::json"),
    ("practical_activity_json", "JSON NOT NULL DEFAULT '{}'::json"),
    ("completion_criteria_json", "JSON NOT NULL DEFAULT '[]'::json"),
    ("media_json", "JSON NOT NULL DEFAULT '{}'::json"),
    ("optional_resources_json", "JSON NOT NULL DEFAULT '{}'::json"),
)


async def _column_exists(connection, table: str, column: str) -> bool:
    return bool(
        (
            await connection.execute(
                text(
                    """
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = current_schema()
                      AND table_name = :table
                      AND column_name = :column
                    """
                ),
                {"table": table, "column": column},
            )
        ).scalar_one_or_none()
    )


async def _ensure_column(connection, table: str, column: str, ddl: str) -> None:
    if await _column_exists(connection, table, column):
        print(f"XPEX_WAVE1_SCHEMA column={table}.{column} action=exists")
        return
    await connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}"))
    print(f"XPEX_WAVE1_SCHEMA column={table}.{column} action=created")


async def run() -> int:
    config = get_learnhouse_config()
    sql_url = config.database_config.sql_connection_string  # type: ignore[attr-defined]
    engine = create_async_engine(_to_async_url(sql_url), pool_pre_ping=True)
    try:
        async with engine.begin() as connection:
            schools = int((await connection.execute(text("SELECT COUNT(*) FROM xpex_schools"))).scalar_one())
            courses = int(
                (
                    await connection.execute(
                        text(
                            "SELECT COUNT(*) FROM xpex_courses "
                            "WHERE catalog_version = 'XPEX_OFFICIAL_CATALOG_V1'"
                        )
                    )
                ).scalar_one()
            )
            if schools != 9 or courses != 156:
                print(f"XPEX_WAVE1_SCHEMA BLOCKED schools={schools} courses={courses}")
                return 2

            for column, ddl in COURSE_COLUMNS:
                await _ensure_column(connection, "xpex_courses", column, ddl)
            for column, ddl in LESSON_COLUMNS:
                await _ensure_column(connection, "xpex_lessons", column, ddl)

            await connection.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS xpex_assessments (
                        id SERIAL PRIMARY KEY,
                        assessment_key VARCHAR(80) NOT NULL UNIQUE,
                        course_id INTEGER NOT NULL REFERENCES xpex_courses(id) ON DELETE RESTRICT,
                        module_id INTEGER REFERENCES xpex_modules(id) ON DELETE RESTRICT,
                        assessment_type VARCHAR(30) NOT NULL,
                        display_order INTEGER NOT NULL,
                        objective_keys_json JSON NOT NULL,
                        questions_json JSON NOT NULL,
                        passing_score INTEGER NOT NULL DEFAULT 70,
                        max_attempts INTEGER NOT NULL DEFAULT 3,
                        status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
                        CONSTRAINT ck_xpex_assessment_passing_score CHECK (passing_score BETWEEN 0 AND 100),
                        CONSTRAINT ck_xpex_assessment_attempts CHECK (max_attempts >= 1)
                    )
                    """
                )
            )
            await connection.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_xpex_assessment_course "
                    "ON xpex_assessments(course_id, display_order)"
                )
            )
            await connection.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS xpex_assessment_attempts (
                        id SERIAL PRIMARY KEY,
                        assessment_id INTEGER NOT NULL REFERENCES xpex_assessments(id) ON DELETE RESTRICT,
                        learner_key VARCHAR(160) NOT NULL,
                        attempt_number INTEGER NOT NULL,
                        answers_json JSON NOT NULL,
                        score INTEGER NOT NULL,
                        passed BOOLEAN NOT NULL DEFAULT FALSE,
                        submitted_at VARCHAR(64) NOT NULL,
                        CONSTRAINT uq_xpex_assessment_attempt UNIQUE (assessment_id, learner_key, attempt_number),
                        CONSTRAINT ck_xpex_attempt_score CHECK (score BETWEEN 0 AND 100),
                        CONSTRAINT ck_xpex_attempt_number CHECK (attempt_number >= 1)
                    )
                    """
                )
            )
            await connection.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS xpex_wave_media_jobs (
                        id SERIAL PRIMARY KEY,
                        job_id VARCHAR(80) NOT NULL UNIQUE,
                        lesson_id INTEGER NOT NULL UNIQUE REFERENCES xpex_lessons(id) ON DELETE RESTRICT,
                        provider VARCHAR(80) NOT NULL,
                        provider_job_id VARCHAR(160),
                        video_type VARCHAR(40) NOT NULL DEFAULT 'XPEX_EXPLAINER',
                        status VARCHAR(40) NOT NULL DEFAULT 'SCRIPT_READY',
                        artifact_json JSON NOT NULL,
                        qa_json JSON NOT NULL,
                        original_error TEXT
                    )
                    """
                )
            )

            required_columns = [
                ("xpex_courses", "blueprint_json"),
                ("xpex_courses", "qa_status"),
                *( ("xpex_lessons", name) for name, _ in LESSON_COLUMNS ),
            ]
            missing = [
                f"{table}.{column}"
                for table, column in required_columns
                if not await _column_exists(connection, table, column)
            ]
            tables = (
                await connection.execute(
                    text(
                        """
                        SELECT table_name
                        FROM information_schema.tables
                        WHERE table_schema = current_schema()
                          AND table_name IN (
                            'xpex_assessments',
                            'xpex_assessment_attempts',
                            'xpex_wave_media_jobs'
                          )
                        """
                    )
                )
            ).scalars().all()
            expected_tables = {
                "xpex_assessments",
                "xpex_assessment_attempts",
                "xpex_wave_media_jobs",
            }
            missing_tables = sorted(expected_tables - set(tables))
            if missing or missing_tables:
                print(
                    "XPEX_WAVE1_SCHEMA BLOCKED "
                    f"missing_columns={missing} missing_tables={missing_tables}"
                )
                return 3

        print(
            "XPEX_WAVE1_SCHEMA PASS "
            f"revision_equivalent={REVISION_EQUIVALENT} alembic_stamped=false"
        )
        return 0
    finally:
        await engine.dispose()


if __name__ == "__main__":
    raise SystemExit(asyncio.run(run()))
