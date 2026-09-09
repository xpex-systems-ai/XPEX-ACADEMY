"""Production-safe runtime certification for XPeX Wave 1.

Dry-run by default. With --execute, it verifies the canonical 9-school/156-course
catalog, idempotently seeds the ten private Wave 1 courses, proves exact runtime
counts, and creates at most one media canary for XPEX-S02-C01-M01-L01 when a
real provider name is already configured. It never approves or publishes media.
"""

from __future__ import annotations

import argparse
import asyncio
import os

from config.config import get_learnhouse_config
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from src.db.xpex_catalog import (
    XPeXAssessment,
    XPeXCourse,
    XPeXLesson,
    XPeXModule,
    XPeXWaveMediaJob,
)
from src.services.xpex.wave1_courses import (
    WAVE1_COURSES,
    create_controlled_video_job,
    seed_wave1_courses,
    verify_wave1_preflight,
)


def _to_async_url(url: str) -> str:
    if "+asyncpg" in url:
        return url
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


async def _counts(session: AsyncSession) -> dict[str, int | bool | str]:
    wave_keys = {spec.key for spec in WAVE1_COURSES}
    courses = (
        await session.execute(select(XPeXCourse).where(XPeXCourse.course_key.in_(wave_keys)))
    ).scalars().all()
    course_ids = [int(course.id) for course in courses if course.id is not None]

    modules = []
    lessons = []
    assessments = []
    if course_ids:
        modules = (
            await session.execute(select(XPeXModule).where(XPeXModule.course_id.in_(course_ids)))
        ).scalars().all()
        module_ids = [int(module.id) for module in modules if module.id is not None]
        if module_ids:
            lessons = (
                await session.execute(select(XPeXLesson).where(XPeXLesson.module_id.in_(module_ids)))
            ).scalars().all()
        assessments = (
            await session.execute(
                select(XPeXAssessment).where(XPeXAssessment.course_id.in_(course_ids))
            )
        ).scalars().all()

    all_private = len(courses) == 10 and all(
        course.publication_status == "PRIVATE" for course in courses
    )
    all_qa = len(courses) == 10 and all(
        course.qa_status == "AWAITING_HUMAN_APPROVAL" for course in courses
    )
    return {
        "courses": len(courses),
        "modules": len(modules),
        "lessons": len(lessons),
        "assessments": len(assessments),
        "all_private": all_private,
        "qa_status": "AWAITING_HUMAN_APPROVAL" if all_qa else "MIXED",
    }


async def run(execute: bool) -> int:
    config = get_learnhouse_config()
    sql_url = config.database_config.sql_connection_string  # type: ignore[attr-defined]
    engine = create_async_engine(_to_async_url(str(sql_url)), pool_pre_ping=True)
    try:
        async with AsyncSession(engine, expire_on_commit=False) as session:
            preflight = await verify_wave1_preflight(session)
            print(
                "XPEX_WAVE1_PREFLIGHT PASS "
                f"schools={preflight['schools']} courses={preflight['courses']}"
            )
            if not execute:
                print("XPEX_WAVE1_CERTIFICATION DRY_RUN no_mutation=true")
                return 0

            await seed_wave1_courses(session)
            counts = await _counts(session)
            print(
                "XPEX_WAVE1_COUNTS "
                f"courses={counts['courses']} modules={counts['modules']} "
                f"lessons={counts['lessons']} assessments={counts['assessments']} "
                f"all_private={str(counts['all_private']).lower()} "
                f"qa_status={counts['qa_status']}"
            )
            expected = (10, 40, 160, 50)
            actual = (
                counts["courses"],
                counts["modules"],
                counts["lessons"],
                counts["assessments"],
            )
            if actual != expected or counts["all_private"] is not True:
                raise RuntimeError(
                    "STOP: Wave 1 runtime counts/private gate mismatch "
                    f"expected={expected} actual={actual} all_private={counts['all_private']}"
                )

            # Prove seed idempotency without changing totals.
            await seed_wave1_courses(session)
            second = await _counts(session)
            second_actual = (
                second["courses"],
                second["modules"],
                second["lessons"],
                second["assessments"],
            )
            if second_actual != expected:
                raise RuntimeError(
                    "STOP: Wave 1 idempotency failed "
                    f"expected={expected} actual={second_actual}"
                )
            print("XPEX_WAVE1_IDEMPOTENCY PASS totals=10/40/160/50")

            provider = (os.environ.get("XPEX_HF_VIDEO_PROVIDER") or "").strip()
            jobs = (await session.execute(select(XPeXWaveMediaJob))).scalars().all()
            if not provider:
                print(
                    "XPEX_WAVE1_CANARY BLOCKED provider_unconfigured=true "
                    f"existing_jobs={len(jobs)} status=SCRIPT_READY"
                )
                return 2

            job = await create_controlled_video_job(session, provider)
            print(
                "XPEX_WAVE1_CANARY PASS "
                f"job_id={job.job_id} lesson_key=XPEX-S02-C01-M01-L01 "
                f"provider={job.provider} provider_job_id={job.provider_job_id or 'none'} "
                f"status={job.status} rendered=false auto_approved=false auto_published=false"
            )
            if job.status != "SCRIPT_READY":
                raise RuntimeError(
                    f"STOP: canary must remain SCRIPT_READY, got {job.status}"
                )
            return 0
    finally:
        await engine.dispose()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--execute", action="store_true")
    args = parser.parse_args()
    return asyncio.run(run(args.execute))


if __name__ == "__main__":
    raise SystemExit(main())
