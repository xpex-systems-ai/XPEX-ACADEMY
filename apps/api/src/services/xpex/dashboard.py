"""Server-authoritative composition of the XPeX learner dashboard."""

from collections import defaultdict

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.db.courses.activities import Activity
from src.db.courses.chapter_activities import ChapterActivity
from src.db.courses.chapters import Chapter
from src.db.courses.course_chapters import CourseChapter
from src.db.courses.courses import Course
from src.db.organizations import Organization
from src.db.trail_runs import StatusEnum, TrailRun
from src.db.trail_steps import TrailStep
from src.db.user_organizations import UserOrganization
from src.db.users import PublicUser
from src.services.courses.locks import (
    batch_accessible_restricted_uuids,
    is_locked_for_user,
    is_org_admin,
)


def progress_percent(completed: int, total: int) -> int | None:
    """Return a stable display percentage only for a meaningful scope."""
    if total <= 0:
        return None
    return round(min(completed, total) / total * 100)


def _lock_name(lock_type: object | None) -> str:
    """Normalize str-backed lock enums without relying on Enum.__str__."""
    value = getattr(lock_type, "value", lock_type) or "public"
    return str(value).lower()


async def get_student_dashboard(
    user: PublicUser, organization_slug: str, db_session: AsyncSession
) -> dict | None:
    """Return only this user's accessible enrollments inside the membership."""
    membership = (
        await db_session.execute(
            select(Organization)
            .join(UserOrganization, UserOrganization.org_id == Organization.id)
            .where(
                Organization.slug == organization_slug,
                UserOrganization.user_id == user.id,
            )
        )
    ).scalars().first()
    if not membership:
        return None

    runs = list(
        (
            await db_session.execute(
                select(TrailRun).where(
                    TrailRun.user_id == user.id,
                    TrailRun.org_id == membership.id,
                )
            )
        ).scalars().all()
    )
    if not runs:
        return _empty_dashboard(membership.name)

    course_ids = list({run.course_id for run in runs})
    courses = list(
        (
            await db_session.execute(
                select(Course).where(
                    Course.id.in_(course_ids),
                    Course.org_id == membership.id,
                    Course.published == True,  # noqa: E712
                )
            )
        ).scalars().all()
    )
    course_map = {course.id: course for course in courses}
    runs = [
        run
        for run in runs
        if run.course_id in course_map and run.status != StatusEnum.STATUS_CANCELLED
    ]
    if not runs:
        return _empty_dashboard(membership.name)

    active_ids = list({run.course_id for run in runs})

    # Build the canonical course scope once, then apply the same lock semantics used
    # by course reads. Progress and continue-learning must never count or target
    # content this learner cannot access.
    ordered_scope = (
        await db_session.execute(
            select(
                ChapterActivity.course_id,
                ChapterActivity.activity_id,
                Activity.activity_uuid,
                Activity.lock_type,
                Chapter.chapter_uuid,
                Chapter.lock_type,
            )
            .join(Activity, Activity.id == ChapterActivity.activity_id)
            .join(Chapter, Chapter.id == ChapterActivity.chapter_id)
            .join(
                CourseChapter,
                (CourseChapter.chapter_id == ChapterActivity.chapter_id)
                & (CourseChapter.course_id == ChapterActivity.course_id),
            )
            .where(
                ChapterActivity.course_id.in_(active_ids),
                ChapterActivity.org_id == membership.id,
                Activity.org_id == membership.id,
                Chapter.org_id == membership.id,
                Activity.published == True,  # noqa: E712
            )
            .order_by(
                ChapterActivity.course_id,
                CourseChapter.order,
                ChapterActivity.order,
            )
        )
    ).all()

    restricted_uuids = {
        resource_uuid
        for row in ordered_scope
        for lock_type, resource_uuid in ((row[3], row[2]), (row[5], row[4]))
        if _lock_name(lock_type) == "restricted" and resource_uuid
    }
    admin = await is_org_admin(user.id, membership.id, db_session)
    accessible_restricted = await batch_accessible_restricted_uuids(
        user.id, restricted_uuids, db_session
    )

    accessible_by_course: dict[int, list[tuple[int, str]]] = defaultdict(list)
    accessible_ids_by_course: dict[int, set[int]] = defaultdict(set)
    for (
        course_id,
        activity_id,
        activity_uuid,
        activity_lock_type,
        chapter_uuid,
        chapter_lock_type,
    ) in ordered_scope:
        chapter_locked = await is_locked_for_user(
            chapter_lock_type,
            chapter_uuid,
            membership.id,
            user,
            db_session,
            accessible_restricted_uuids=accessible_restricted,
            is_admin=admin,
        )
        activity_locked = await is_locked_for_user(
            activity_lock_type,
            activity_uuid,
            membership.id,
            user,
            db_session,
            accessible_restricted_uuids=accessible_restricted,
            is_admin=admin,
        )
        if chapter_locked or activity_locked:
            continue
        if activity_id in accessible_ids_by_course[course_id]:
            continue
        accessible_ids_by_course[course_id].add(activity_id)
        accessible_by_course[course_id].append((activity_id, activity_uuid))

    # TrailStep is the persisted learning activity record. Read rows once so course
    # recency, completion counts, and resume targets are all based on the same
    # learner-accessible activity scope. Sets deliberately deduplicate legacy or
    # concurrent duplicate completion rows.
    steps = (
        await db_session.execute(
            select(
                TrailStep.course_id,
                TrailStep.activity_id,
                TrailStep.complete,
                TrailStep.update_date,
            ).where(
                TrailStep.user_id == user.id,
                TrailStep.org_id == membership.id,
                TrailStep.course_id.in_(active_ids),
            )
        )
    ).all()

    completed_by_course: dict[int, set[int]] = defaultdict(set)
    latest_step_at: dict[int, str] = {}
    for course_id, activity_id, complete, update_date in steps:
        if activity_id not in accessible_ids_by_course.get(course_id, set()):
            continue
        if complete:
            completed_by_course[course_id].add(activity_id)
        if update_date and (
            course_id not in latest_step_at or update_date > latest_step_at[course_id]
        ):
            latest_step_at[course_id] = update_date

    first_incomplete: dict[int, str] = {}
    for course_id, activities in accessible_by_course.items():
        completed_ids = completed_by_course.get(course_id, set())
        for activity_id, activity_uuid in activities:
            if activity_id not in completed_ids:
                first_incomplete[course_id] = activity_uuid.removeprefix("activity_")
                break

    cards = []
    for run in runs:
        course = course_map[run.course_id]
        course_uuid = course.course_uuid.removeprefix("course_")
        target = f"/orgs/{organization_slug}/course/{course_uuid}"
        if run.course_id in first_incomplete:
            target += f"/activity/{first_incomplete[run.course_id]}"
        total = len(accessible_ids_by_course.get(run.course_id, set()))
        done = len(completed_by_course.get(run.course_id, set()))
        last_step = latest_step_at.get(run.course_id)
        cards.append(
            {
                "course_id": course.course_uuid,
                "title": course.name,
                "image_url": course.thumbnail_image or None,
                "enrollment_state": run.status.value,
                "completed_lessons": done,
                "total_lessons": total,
                "progress_percent": progress_percent(done, total),
                "target_href": target,
                "last_activity_at": last_step,
                "_fallback_enrollment_at": run.update_date or run.creation_date or "",
            }
        )

    # Actual TrailStep recency wins. A never-started enrollment is only a fallback,
    # so a newly enrolled untouched course cannot displace a course the learner has
    # actually resumed.
    cards.sort(
        key=lambda card: (
            card["last_activity_at"] is not None,
            card["last_activity_at"] or card["_fallback_enrollment_at"],
        ),
        reverse=True,
    )
    for card in cards:
        card.pop("_fallback_enrollment_at", None)

    return {
        "organization": membership.name,
        "summary": _summary(cards),
        "courses": cards,
        "continue_learning": cards[0] if cards else None,
    }


def _empty_dashboard(organization: str) -> dict:
    return {
        "organization": organization,
        "summary": _summary([]),
        "courses": [],
        "continue_learning": None,
    }


def _summary(cards: list[dict]) -> dict:
    completed = sum(card["completed_lessons"] for card in cards)
    total = sum(card["total_lessons"] for card in cards)
    return {
        "active_courses": len(cards),
        "completed_lessons": completed,
        "total_lessons": total,
        "overall_progress_percent": progress_percent(completed, total),
    }
