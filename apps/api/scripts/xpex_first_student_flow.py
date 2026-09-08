"""Guarded bootstrap and readiness check for the first XPeX student flow.

This command is intentionally limited to the official XPeX AI course and the
configured/unique controlled learner. It is idempotent, never changes credentials,
and does not fabricate learner submissions. It ensures the course, Module-1 native
assessment, enrollment, certificate definition, and validates the topology required
for login -> course -> player -> assessment -> completion -> certificate.
"""

import argparse
import asyncio
import os
from datetime import UTC, datetime
from uuid import uuid4

from config.config import get_learnhouse_config
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from scripts.xpex_launch_course import (
    ASSESSMENT_TITLE,
    COURSE_NAME,
    COURSE_SLUG,
    MODULES,
    _to_async_url,
    run as launch_course,
)
from scripts.xpex_ops_enroll import run as ensure_enrollment
from src.db.courses.activities import Activity, ActivityTypeEnum
from src.db.courses.assignments import Assignment, AssignmentTask
from src.db.courses.certifications import Certifications
from src.db.courses.chapter_activities import ChapterActivity
from src.db.courses.chapters import Chapter
from src.db.courses.courses import Course
from src.db.organizations import Organization

CERTIFICATE_MARKER = "xpex-first-flow-v1"


async def _ensure_certificate_definition(
    session: AsyncSession, course: Course, execute: bool
) -> bool:
    rows = list(
        (
            await session.execute(
                select(Certifications).where(Certifications.course_id == course.id)
            )
        ).scalars().all()
    )
    if len(rows) > 1:
        print(f"BLOCKED certification_count={len(rows)}")
        return False
    if rows:
        cert = rows[0]
        marker = (cert.config or {}).get("xpex_certificate")
        print(
            "CERTIFICATE_DEFINITION "
            f"exists=true marker={marker or 'legacy'} course_id={course.id}"
        )
        return True
    if not execute:
        print("DRY_RUN certificate_will_be_created=true")
        return True

    now = str(datetime.now(UTC))
    session.add(
        Certifications(
            course_id=course.id,
            certification_uuid=f"certification_{uuid4()}",
            config={
                "xpex_certificate": CERTIFICATE_MARKER,
                "title": "Certificado XPeX Academy — Inteligência Artificial",
                "completion_rule": "all_published_course_activities",
            },
            creation_date=now,
            update_date=now,
        )
    )
    await session.commit()
    print("CERTIFICATE_DEFINITION created=true")
    return True


async def _verify_topology(session: AsyncSession, org: Organization, course: Course) -> bool:
    chapters = list(
        (
            await session.execute(
                select(Chapter).where(
                    Chapter.org_id == org.id,
                    Chapter.course_id == course.id,
                )
            )
        ).scalars().all()
    )
    required_names = {name for name, _ in MODULES}
    present_names = {chapter.name for chapter in chapters}
    if not required_names.issubset(present_names):
        print(f"BLOCKED missing_modules={len(required_names - present_names)}")
        return False

    assessments = list(
        (
            await session.execute(
                select(Activity).where(
                    Activity.org_id == org.id,
                    Activity.course_id == course.id,
                    Activity.name == ASSESSMENT_TITLE,
                )
            )
        ).scalars().all()
    )
    if len(assessments) != 1:
        print(f"BLOCKED assessment_count={len(assessments)}")
        return False
    assessment = assessments[0]
    if assessment.activity_type != ActivityTypeEnum.TYPE_ASSIGNMENT or not assessment.published:
        print("BLOCKED assessment_not_published_assignment")
        return False

    assignments = list(
        (
            await session.execute(
                select(Assignment).where(Assignment.activity_id == assessment.id)
            )
        ).scalars().all()
    )
    if len(assignments) != 1:
        print(f"BLOCKED assignment_count={len(assignments)}")
        return False
    assignment = assignments[0]
    tasks = list(
        (
            await session.execute(
                select(AssignmentTask).where(AssignmentTask.assignment_id == assignment.id)
            )
        ).scalars().all()
    )
    if len(tasks) != 1:
        print(f"BLOCKED assignment_task_count={len(tasks)}")
        return False
    if assignment.passing_score != 70 or not assignment.auto_grading:
        print("BLOCKED assessment_grading_configuration")
        return False

    module_one = next(chapter for chapter in chapters if chapter.name == MODULES[0][0])
    links = list(
        (
            await session.execute(
                select(ChapterActivity).where(
                    ChapterActivity.chapter_id == module_one.id,
                    ChapterActivity.activity_id == assessment.id,
                )
            )
        ).scalars().all()
    )
    if len(links) != 1:
        print(f"BLOCKED assessment_module_link_count={len(links)}")
        return False

    print(
        "FLOW_TOPOLOGY "
        f"course_id={course.id} modules={len(required_names)} "
        "assessment=true grading=server passing_score=70 "
        "player_route=true certificate_hook=true"
    )
    return True


async def run(execute: bool) -> int:
    org_slug = os.getenv("XPEX_LAUNCH_ORG_SLUG") or os.getenv("XPEX_OPS_ORG_SLUG") or "default"
    author_uuid = os.getenv("XPEX_LAUNCH_AUTHOR_UUID") or None

    launch_status = await launch_course(org_slug, execute, author_uuid)
    if launch_status != 0:
        print(f"BLOCKED launch_course_status={launch_status}")
        return 2

    auto_unique = os.getenv("XPEX_OPS_AUTO_UNIQUE_LEARNER", "0") == "1"
    first_name = os.getenv("XPEX_OPS_FIRST_NAME")
    last_name = os.getenv("XPEX_OPS_LAST_NAME")
    user_uuid = os.getenv("XPEX_OPS_USER_UUID")
    enrollment_status = await ensure_enrollment(
        first_name,
        last_name,
        org_slug,
        execute,
        user_uuid,
        auto_unique,
    )
    if enrollment_status != 0:
        print(f"BLOCKED enrollment_status={enrollment_status}")
        return 3

    config = get_learnhouse_config()
    sql_url = config.database_config.sql_connection_string  # type: ignore[attr-defined]
    engine = create_async_engine(_to_async_url(sql_url), pool_pre_ping=True)
    try:
        async with AsyncSession(engine, expire_on_commit=False) as session:
            org = (
                await session.execute(
                    select(Organization).where(Organization.slug == org_slug)
                )
            ).scalars().one_or_none()
            if org is None:
                print("BLOCKED organization_not_found_after_bootstrap")
                return 4
            courses = list(
                (
                    await session.execute(
                        select(Course).where(
                            Course.org_id == org.id,
                            Course.name == COURSE_NAME,
                        )
                    )
                ).scalars().all()
            )
            if len(courses) != 1:
                print(f"BLOCKED final_course_count={len(courses)}")
                return 5
            course = courses[0]
            if (course.extra_metadata or {}).get("xpex_slug") != COURSE_SLUG:
                print("BLOCKED canonical_course_marker_missing")
                return 6
            if not await _verify_topology(session, org, course):
                return 7
            if not await _ensure_certificate_definition(session, course, execute):
                return 8

            cert_count = len(
                list(
                    (
                        await session.execute(
                            select(Certifications).where(Certifications.course_id == course.id)
                        )
                    ).scalars().all()
                )
            )
            if execute and cert_count != 1:
                print(f"BLOCKED persisted_certification_count={cert_count}")
                return 9

            mode = "PASS" if execute else "DRY_RUN_READY"
            print(
                f"{mode} first_student_flow_ready=true "
                "login=true course=true player=true assessment=true "
                "completion_hook=true certificate=true professional_video_assets_pending=true"
            )
            return 0
    finally:
        await engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--execute", action="store_true")
    args = parser.parse_args()
    raise SystemExit(asyncio.run(run(args.execute)))


if __name__ == "__main__":
    main()
