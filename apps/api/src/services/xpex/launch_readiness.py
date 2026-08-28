"""Server-authoritative launch readiness snapshot for one organization."""

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.db.courses.activities import Activity
from src.db.courses.courses import Course
from src.db.organizations import Organization
from src.db.roles import Role
from src.db.trail_runs import StatusEnum, TrailRun
from src.db.trail_steps import TrailStep
from src.db.user_organizations import UserOrganization
from src.db.users import PublicUser
from src.services.courses.locks import is_org_admin


TEACHER_ROLE_UUID = "role_global_instructor"


async def get_launch_readiness(
    user: PublicUser,
    organization_slug: str,
    db_session: AsyncSession,
) -> dict | None:
    """Return a factual launch snapshot for an authorized organization operator."""
    organization = (
        await db_session.execute(
            select(Organization).where(Organization.slug == organization_slug)
        )
    ).scalars().first()
    if organization is None or organization.id is None:
        return None

    if not await is_org_admin(user.id, organization.id, db_session):
        return None

    published_course_ids = list(
        (
            await db_session.execute(
                select(Course.id).where(
                    Course.org_id == organization.id,
                    Course.published == True,
                )
            )
        ).scalars().all()
    )

    published_activity_ids: list[int] = []
    if published_course_ids:
        published_activity_ids = list(
            (
                await db_session.execute(
                    select(Activity.id).where(
                        Activity.org_id == organization.id,
                        Activity.course_id.in_(published_course_ids),
                        Activity.published == True,
                    )
                )
            ).scalars().all()
        )

    runs = list(
        (
            await db_session.execute(
                select(TrailRun).where(
                    TrailRun.org_id == organization.id,
                    TrailRun.status != StatusEnum.STATUS_CANCELLED,
                )
            )
        ).scalars().all()
    )
    enrolled_students = {run.user_id for run in runs}
    active_students = {
        run.user_id for run in runs if run.status == StatusEnum.STATUS_IN_PROGRESS
    }
    completed_students = {
        run.user_id for run in runs if run.status == StatusEnum.STATUS_COMPLETED
    }

    completed_steps = list(
        (
            await db_session.execute(
                select(TrailStep.id).where(
                    TrailStep.org_id == organization.id,
                    TrailStep.complete == True,
                )
            )
        ).scalars().all()
    )

    teacher_ids = set(
        (
            await db_session.execute(
                select(UserOrganization.user_id)
                .join(Role, Role.id == UserOrganization.role_id)
                .where(
                    UserOrganization.org_id == organization.id,
                    Role.role_uuid == TEACHER_ROLE_UUID,
                )
            )
        ).scalars().all()
    )

    gates = {
        "admin_access": True,
        "published_course": bool(published_course_ids),
        "published_activity": bool(published_activity_ids),
        "pilot_enrollment": bool(enrolled_students),
        "progress_verified": bool(completed_steps),
        "teacher_assigned": bool(teacher_ids),
    }
    ready_for_controlled_pilot = (
        gates["admin_access"]
        and gates["published_course"]
        and gates["published_activity"]
    )
    ready_for_official_intake = (
        ready_for_controlled_pilot
        and gates["pilot_enrollment"]
        and gates["progress_verified"]
        and gates["teacher_assigned"]
    )

    return {
        "organization": {
            "name": organization.name,
            "slug": organization.slug,
        },
        "metrics": {
            "published_courses": len(published_course_ids),
            "published_activities": len(published_activity_ids),
            "enrolled_students": len(enrolled_students),
            "active_students": len(active_students),
            "completed_students": len(completed_students),
            "completed_activities": len(completed_steps),
            "teachers": len(teacher_ids),
        },
        "gates": gates,
        "ready_for_controlled_pilot": ready_for_controlled_pilot,
        "ready_for_official_intake": ready_for_official_intake,
    }
