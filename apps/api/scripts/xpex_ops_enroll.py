"""Guarded one-shot enrollment utility for XPeX operations.

Dry-run by default. It refuses to act unless the organization, student and
published course each resolve unambiguously. It never prints PII or secrets.
"""

import argparse
import asyncio
from datetime import UTC, datetime
from uuid import uuid4

from config.config import get_learnhouse_config
from sqlalchemy import func
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from src.db.courses.courses import Course
from src.db.organizations import Organization
from src.db.resource_authors import ResourceAuthor, ResourceAuthorshipStatusEnum
from src.db.roles import Role
from src.db.trail_runs import StatusEnum, TrailRun
from src.db.trails import Trail
from src.db.user_organizations import UserOrganization
from src.db.users import PublicUser, User
from src.services.xpex.dashboard import get_student_dashboard

EXPECTED_STUDENT_ROLE_UUID = "role_global_user"


def _to_async_url(url: str) -> str:
    if "+asyncpg" in url:
        return url
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


async def _verify_dashboard(
    session: AsyncSession,
    user: User,
    org: Organization,
    course: Course,
) -> bool:
    dashboard = await get_student_dashboard(
        PublicUser.model_validate(user), org.slug, session
    )
    if dashboard is None:
        print("BLOCKED dashboard_membership_not_resolved")
        return False
    cards = dashboard.get("courses", [])
    card = next(
        (item for item in cards if item.get("course_id") == course.course_uuid),
        None,
    )
    if card is None:
        print("BLOCKED dashboard_course_not_visible")
        return False
    current = dashboard.get("continue_learning")
    print(
        "DASHBOARD_VERIFY "
        f"courses={len(cards)} course_visible=true "
        f"enrollment_state={card.get('enrollment_state')} "
        f"continue_learning={bool(current)} target_href={card.get('target_href')}"
    )
    return True


async def run(
    first_name: str,
    last_name: str,
    org_slug: str,
    execute: bool,
    user_uuid: str | None = None,
) -> int:
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
                print(f"BLOCKED organization_not_found slug={org_slug}")
                return 2

            student_query = (
                select(User, UserOrganization, Role)
                .join(UserOrganization, UserOrganization.user_id == User.id)
                .join(Role, Role.id == UserOrganization.role_id)
                .where(
                    UserOrganization.org_id == org.id,
                    func.lower(User.first_name) == first_name.strip().lower(),
                    func.lower(User.last_name) == last_name.strip().lower(),
                )
            )
            if user_uuid:
                student_query = student_query.where(User.user_uuid == user_uuid.strip())

            candidates = list((await session.execute(student_query)).all())
            if len(candidates) != 1:
                print(
                    f"BLOCKED student_match_count={len(candidates)} "
                    f"org_id={org.id} org_slug={org.slug} "
                    f"exact_uuid_filter={bool(user_uuid)}"
                )
                return 3

            user, _membership, role = candidates[0]
            print(
                "STUDENT "
                f"user_id={user.id} user_uuid={user.user_uuid} "
                f"org_id={org.id} org_slug={org.slug} role_uuid={role.role_uuid}"
            )
            if role.role_uuid != EXPECTED_STUDENT_ROLE_UUID:
                print(
                    "BLOCKED unexpected_role "
                    f"role_uuid={role.role_uuid} expected={EXPECTED_STUDENT_ROLE_UUID}"
                )
                return 6

            courses = list(
                (
                    await session.execute(
                        select(Course).where(
                            Course.org_id == org.id,
                            Course.published == True,
                        )
                    )
                ).scalars().all()
            )
            print(f"PUBLISHED_COURSES count={len(courses)}")
            for course in courses:
                active_authors = list(
                    (
                        await session.execute(
                            select(ResourceAuthor.user_id).where(
                                ResourceAuthor.resource_uuid == course.course_uuid,
                                ResourceAuthor.authorship_status
                                == ResourceAuthorshipStatusEnum.ACTIVE,
                            )
                        )
                    ).scalars().all()
                )
                print(
                    "COURSE "
                    f"course_id={course.id} course_uuid={course.course_uuid} "
                    f"name={course.name!r} active_author_count={len(set(active_authors))}"
                )

            if len(courses) != 1:
                print("BLOCKED ambiguous_published_course_scope")
                return 4

            course = courses[0]
            existing = (
                await session.execute(
                    select(TrailRun).where(
                        TrailRun.user_id == user.id,
                        TrailRun.org_id == org.id,
                        TrailRun.course_id == course.id,
                    )
                )
            ).scalars().first()
            if existing is not None:
                print(
                    "ENROLLMENT_EXISTS "
                    f"trail_run_id={existing.id} status={existing.status.value}"
                )
                if existing.status in {
                    StatusEnum.STATUS_IN_PROGRESS,
                    StatusEnum.STATUS_COMPLETED,
                }:
                    if not await _verify_dashboard(session, user, org, course):
                        return 7
                    print("PASS enrollment_already_valid_and_dashboard_visible")
                    return 0
                print("BLOCKED existing_enrollment_requires_manual_state_decision")
                return 5

            if not execute:
                print(
                    "DRY_RUN_READY "
                    f"user_id={user.id} course_uuid={course.course_uuid} org_slug={org.slug}"
                )
                return 0

            trail = (
                await session.execute(
                    select(Trail).where(Trail.org_id == org.id, Trail.user_id == user.id)
                )
            ).scalars().first()
            now = str(datetime.now(UTC))
            if trail is None:
                trail = Trail(
                    org_id=org.id,
                    user_id=user.id,
                    trail_uuid=f"trail_{uuid4()}",
                    creation_date=now,
                    update_date=now,
                )
                session.add(trail)
                await session.flush()

            run_row = TrailRun(
                trail_id=trail.id,
                course_id=course.id,
                org_id=org.id,
                user_id=user.id,
                status=StatusEnum.STATUS_IN_PROGRESS,
                creation_date=now,
                update_date=now,
            )
            session.add(run_row)
            await session.commit()
            await session.refresh(run_row)
            print(
                "ENROLLED "
                f"trail_run_id={run_row.id} user_id={user.id} "
                f"course_uuid={course.course_uuid} status={run_row.status.value}"
            )
            if not await _verify_dashboard(session, user, org, course):
                return 7
            print("PASS enrollment_created_and_dashboard_visible")
            return 0
    finally:
        await engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--first-name", required=True)
    parser.add_argument("--last-name", required=True)
    parser.add_argument("--org-slug", required=True)
    parser.add_argument("--user-uuid")
    parser.add_argument("--execute", action="store_true")
    args = parser.parse_args()
    raise SystemExit(
        asyncio.run(
            run(
                args.first_name,
                args.last_name,
                args.org_slug,
                args.execute,
                args.user_uuid,
            )
        )
    )


if __name__ == "__main__":
    main()
