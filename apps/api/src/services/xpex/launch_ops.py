"""Administrative launch operations for the first XPeX cohorts."""

from datetime import UTC, datetime
from uuid import uuid4

from fastapi import HTTPException, Request, status
from pydantic import BaseModel, EmailStr
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.db.courses.courses import Course
from src.db.organizations import Organization
from src.db.trail_runs import StatusEnum, TrailRun
from src.db.trails import Trail
from src.db.user_organizations import UserOrganization
from src.db.users import PublicUser, User
from src.security.org_auth import is_org_admin
from src.services.orgs.users import invite_batch_users


class StudentInviteRequest(BaseModel):
    organization_slug: str
    email: EmailStr


class StudentEnrollmentRequest(BaseModel):
    organization_slug: str
    email: EmailStr
    course_uuid: str


async def _authorized_org(
    user: PublicUser,
    organization_slug: str,
    db_session: AsyncSession,
) -> Organization:
    organization = (
        await db_session.execute(
            select(Organization).where(Organization.slug == organization_slug)
        )
    ).scalars().first()
    if organization is None or organization.id is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    if not await is_org_admin(user.id, organization.id, db_session):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization administrator access required",
        )
    return organization


async def invite_launch_student(
    request: Request,
    payload: StudentInviteRequest,
    current_user: PublicUser,
    db_session: AsyncSession,
):
    """Use the native invitation flow; never create or set a student password."""
    organization = await _authorized_org(
        current_user, payload.organization_slug, db_session
    )
    return await invite_batch_users(
        request,
        organization.id,
        str(payload.email),
        None,
        db_session,
        current_user,
    )


async def enroll_launch_student(
    payload: StudentEnrollmentRequest,
    current_user: PublicUser,
    db_session: AsyncSession,
) -> dict:
    """Enroll an existing organization member into one published course."""
    organization = await _authorized_org(
        current_user, payload.organization_slug, db_session
    )

    student = (
        await db_session.execute(select(User).where(User.email == str(payload.email)))
    ).scalars().first()
    if student is None or student.id is None:
        raise HTTPException(
            status_code=404,
            detail="Student account not found. Invite the student first.",
        )

    membership = (
        await db_session.execute(
            select(UserOrganization).where(
                UserOrganization.org_id == organization.id,
                UserOrganization.user_id == student.id,
            )
        )
    ).scalars().first()
    if membership is None:
        raise HTTPException(
            status_code=409,
            detail="Student must accept the organization invitation before enrollment.",
        )

    course = (
        await db_session.execute(
            select(Course).where(
                Course.course_uuid == payload.course_uuid,
                Course.org_id == organization.id,
                Course.published == True,
            )
        )
    ).scalars().first()
    if course is None or course.id is None:
        raise HTTPException(status_code=404, detail="Published course not found")

    trail = (
        await db_session.execute(
            select(Trail).where(
                Trail.org_id == organization.id,
                Trail.user_id == student.id,
            )
        )
    ).scalars().first()
    now = str(datetime.now(UTC))
    if trail is None:
        trail = Trail(
            org_id=organization.id,
            user_id=student.id,
            trail_uuid=f"trail_{uuid4()}",
            creation_date=now,
            update_date=now,
        )
        db_session.add(trail)
        await db_session.commit()
        await db_session.refresh(trail)

    existing_run = (
        await db_session.execute(
            select(TrailRun).where(
                TrailRun.trail_id == trail.id,
                TrailRun.course_id == course.id,
                TrailRun.user_id == student.id,
            )
        )
    ).scalars().first()
    if existing_run is not None:
        return {
            "status": "already_enrolled",
            "student": {"user_uuid": student.user_uuid, "email": student.email},
            "course": {"course_uuid": course.course_uuid, "name": course.name},
            "trailrun_id": existing_run.id,
        }

    trail_run = TrailRun(
        trail_id=trail.id or 0,
        course_id=course.id,
        org_id=organization.id,
        user_id=student.id,
        status=StatusEnum.STATUS_IN_PROGRESS,
        creation_date=now,
        update_date=now,
    )
    db_session.add(trail_run)
    await db_session.commit()
    await db_session.refresh(trail_run)

    return {
        "status": "enrolled",
        "student": {"user_uuid": student.user_uuid, "email": student.email},
        "course": {"course_uuid": course.course_uuid, "name": course.name},
        "trailrun_id": trail_run.id,
    }
