"""Server-authoritative composition of the XPeX learner dashboard."""

from sqlalchemy import func
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.db.courses.activities import Activity
from src.db.courses.chapter_activities import ChapterActivity
from src.db.courses.course_chapters import CourseChapter
from src.db.courses.courses import Course
from src.db.organizations import Organization
from src.db.trail_runs import StatusEnum, TrailRun
from src.db.trail_steps import TrailStep
from src.db.user_organizations import UserOrganization
from src.db.users import PublicUser


def progress_percent(completed: int, total: int) -> int | None:
    """Return a stable display percentage only for a meaningful scope."""
    if total <= 0:
        return None
    return round(min(completed, total) / total * 100)


async def get_student_dashboard(
    user: PublicUser, organization_slug: str, db_session: AsyncSession
) -> dict | None:
    """Return only this user's enrollments inside the requested membership."""
    membership = (await db_session.execute(
        select(Organization)
        .join(UserOrganization, UserOrganization.org_id == Organization.id)
        .where(Organization.slug == organization_slug, UserOrganization.user_id == user.id)
    )).scalars().first()
    if not membership:
        return None

    runs = list((await db_session.execute(
        select(TrailRun)
        .where(TrailRun.user_id == user.id, TrailRun.org_id == membership.id)
        .order_by(TrailRun.update_date.desc())
    )).scalars().all())
    if not runs:
        return {"organization": membership.name, "summary": _summary([]), "courses": [], "continue_learning": None}

    course_ids = list({run.course_id for run in runs})
    courses = list((await db_session.execute(
        select(Course).where(
            Course.id.in_(course_ids), Course.org_id == membership.id, Course.published == True  # noqa: E712
        )
    )).scalars().all())
    course_map = {course.id: course for course in courses}
    runs = [run for run in runs if run.course_id in course_map and run.status != StatusEnum.STATUS_CANCELLED]
    if not runs:
        return {"organization": membership.name, "summary": _summary([]), "courses": [], "continue_learning": None}

    active_ids = [run.course_id for run in runs]
    totals = (await db_session.execute(
        select(ChapterActivity.course_id, func.count(ChapterActivity.id))
        .join(Activity, Activity.id == ChapterActivity.activity_id)
        .where(ChapterActivity.course_id.in_(active_ids), Activity.published == True)  # noqa: E712
        .group_by(ChapterActivity.course_id)
    )).all()
    total_map = dict(totals)
    completed = (await db_session.execute(
        select(TrailStep.course_id, func.count(TrailStep.id))
        .join(Activity, Activity.id == TrailStep.activity_id)
        .where(
            TrailStep.user_id == user.id,
            TrailStep.org_id == membership.id,
            TrailStep.course_id.in_(active_ids),
            TrailStep.complete == True,  # noqa: E712
            Activity.published == True,  # noqa: E712
        ).group_by(TrailStep.course_id)
    )).all()
    completed_map = dict(completed)
    completed_activity_ids = set((await db_session.execute(
        select(TrailStep.activity_id).join(Activity, Activity.id == TrailStep.activity_id).where(
            TrailStep.user_id == user.id, TrailStep.org_id == membership.id,
            TrailStep.course_id.in_(active_ids), TrailStep.complete == True,  # noqa: E712
            Activity.published == True,  # noqa: E712
        )
    )).scalars().all())
    first_incomplete: dict[int, str] = {}
    # Fetch ids with UUIDs once, preserving canonical chapter/activity ordering.
    ordered_with_ids = (await db_session.execute(
        select(ChapterActivity.course_id, ChapterActivity.activity_id, Activity.activity_uuid)
        .join(Activity, Activity.id == ChapterActivity.activity_id)
        .join(CourseChapter, (CourseChapter.chapter_id == ChapterActivity.chapter_id) & (CourseChapter.course_id == ChapterActivity.course_id))
        .where(ChapterActivity.course_id.in_(active_ids), Activity.published == True)  # noqa: E712
        .order_by(ChapterActivity.course_id, CourseChapter.order, ChapterActivity.order)
    )).all()
    for course_id, activity_id, activity_uuid in ordered_with_ids:
        if course_id not in first_incomplete and activity_id not in completed_activity_ids:
            first_incomplete[course_id] = activity_uuid.removeprefix("activity_")

    cards = []
    for run in runs:
        course = course_map[run.course_id]
        course_uuid = course.course_uuid.removeprefix("course_")
        target = f"/orgs/{organization_slug}/course/{course_uuid}"
        if run.course_id in first_incomplete:
            target += f"/activity/{first_incomplete[run.course_id]}"
        total = total_map.get(run.course_id, 0)
        done = completed_map.get(run.course_id, 0)
        cards.append({
            "course_id": course.course_uuid, "title": course.name,
            "image_url": course.thumbnail_image or None, "enrollment_state": run.status.value,
            "completed_lessons": done, "total_lessons": total,
            "progress_percent": progress_percent(done, total), "target_href": target,
            "last_activity_at": run.update_date or None,
        })
    return {
        "organization": membership.name,
        "summary": _summary(cards),
        "courses": cards,
        "continue_learning": cards[0] if cards else None,
    }


def _summary(cards: list[dict]) -> dict:
    completed = sum(card["completed_lessons"] for card in cards)
    total = sum(card["total_lessons"] for card in cards)
    return {"active_courses": len(cards), "completed_lessons": completed, "total_lessons": total,
            "overall_progress_percent": progress_percent(completed, total)}
