"""Server-authoritative composition of the XpeX teacher dashboard."""

from collections import defaultdict

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.db.courses.activities import Activity
from src.db.courses.courses import Course
from src.db.organizations import Organization
from src.db.resource_authors import (
    ResourceAuthor,
    ResourceAuthorshipStatusEnum,
)
from src.db.roles import Role
from src.db.trail_runs import StatusEnum, TrailRun
from src.db.trail_steps import TrailStep
from src.db.user_organizations import UserOrganization
from src.db.users import PublicUser


TEACHER_ROLE_UUID = "role_global_instructor"


async def get_teacher_dashboard(
    user: PublicUser, organization_slug: str, db_session: AsyncSession
) -> dict | None:
    """Return aggregate-only data for courses actively authored by this teacher."""
    membership = (
        await db_session.execute(
            select(Organization)
            .join(UserOrganization, UserOrganization.org_id == Organization.id)
            .join(Role, Role.id == UserOrganization.role_id)
            .where(
                Organization.slug == organization_slug,
                UserOrganization.user_id == user.id,
                Role.role_uuid == TEACHER_ROLE_UUID,
            )
        )
    ).scalars().first()
    if not membership:
        return None

    authored_resource_uuids = list(
        (
            await db_session.execute(
                select(ResourceAuthor.resource_uuid).where(
                    ResourceAuthor.user_id == user.id,
                    ResourceAuthor.authorship_status
                    == ResourceAuthorshipStatusEnum.ACTIVE,
                )
            )
        ).scalars().all()
    )
    if not authored_resource_uuids:
        return _empty_dashboard(membership.name)

    courses = list(
        (
            await db_session.execute(
                select(Course).where(
                    Course.org_id == membership.id,
                    Course.course_uuid.in_(authored_resource_uuids),
                    Course.published == True,
                )
            )
        ).scalars().all()
    )
    if not courses:
        return _empty_dashboard(membership.name)

    course_ids = [course.id for course in courses if course.id is not None]
    runs = list(
        (
            await db_session.execute(
                select(TrailRun).where(
                    TrailRun.org_id == membership.id,
                    TrailRun.course_id.in_(course_ids),
                    TrailRun.status != StatusEnum.STATUS_CANCELLED,
                )
            )
        ).scalars().all()
    )
    published_activities = list(
        (
            await db_session.execute(
                select(Activity).where(
                    Activity.org_id == membership.id,
                    Activity.course_id.in_(course_ids),
                    Activity.published == True,
                )
            )
        ).scalars().all()
    )
    completed_steps = list(
        (
            await db_session.execute(
                select(TrailStep).where(
                    TrailStep.org_id == membership.id,
                    TrailStep.course_id.in_(course_ids),
                    TrailStep.complete == True,
                )
            )
        ).scalars().all()
    )

    runs_by_course: dict[int, list[TrailRun]] = defaultdict(list)
    for run in runs:
        runs_by_course[run.course_id].append(run)

    published_activity_ids_by_course: dict[int, set[int]] = defaultdict(set)
    for activity in published_activities:
        if activity.id is not None:
            published_activity_ids_by_course[activity.course_id].add(activity.id)

    completed_activity_ids_by_course_user: dict[tuple[int, int], set[int]] = defaultdict(
        set
    )
    for step in completed_steps:
        completed_activity_ids_by_course_user[(step.course_id, step.user_id)].add(
            step.activity_id
        )

    def is_run_completed(run: TrailRun) -> bool:
        if run.status == StatusEnum.STATUS_COMPLETED:
            return True
        required = published_activity_ids_by_course.get(run.course_id, set())
        completed = completed_activity_ids_by_course_user.get(
            (run.course_id, run.user_id), set()
        )
        return bool(required) and required.issubset(completed)

    cards: list[dict] = []
    for course in sorted(courses, key=lambda item: item.name.lower()):
        course_runs = runs_by_course.get(course.id, [])
        unique_students = {run.user_id for run in course_runs}
        completed_students = {
            run.user_id for run in course_runs if is_run_completed(run)
        }
        active_students = {
            run.user_id
            for run in course_runs
            if run.status == StatusEnum.STATUS_IN_PROGRESS
            and run.user_id not in completed_students
        }
        paused_students = {
            run.user_id
            for run in course_runs
            if run.status == StatusEnum.STATUS_PAUSED
            and run.user_id not in completed_students
        }
        cards.append(
            {
                "course_id": course.course_uuid,
                "title": course.name,
                "description": course.description,
                "enrolled_students": len(unique_students),
                "active_students": len(active_students),
                "completed_students": len(completed_students),
                "paused_students": len(paused_students),
                "target_href": (
                    f"/orgs/{organization_slug}/course/{course.course_uuid}"
                ),
            }
        )

    all_students = {run.user_id for run in runs}
    completed_students = {run.user_id for run in runs if is_run_completed(run)}
    active_students = {
        run.user_id
        for run in runs
        if run.status == StatusEnum.STATUS_IN_PROGRESS
        and run.user_id not in completed_students
    }

    return {
        "organization": membership.name,
        "summary": {
            "published_courses": len(cards),
            "enrolled_students": len(all_students),
            "active_students": len(active_students),
            "completed_students": len(completed_students),
        },
        "courses": cards,
    }


def _empty_dashboard(organization: str) -> dict:
    return {
        "organization": organization,
        "summary": {
            "published_courses": 0,
            "enrolled_students": 0,
            "active_students": 0,
            "completed_students": 0,
        },
        "courses": [],
    }
