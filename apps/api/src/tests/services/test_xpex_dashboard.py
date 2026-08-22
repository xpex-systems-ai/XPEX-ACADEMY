from datetime import UTC, datetime

import pytest
from src.db.trail_runs import StatusEnum, TrailRun
from src.services.xpex.dashboard import get_student_dashboard, progress_percent


def test_progress_percent_uses_canonical_counts():
    assert progress_percent(1, 4) == 25
    assert progress_percent(4, 4) == 100


def test_progress_percent_is_unknown_without_lessons():
    assert progress_percent(0, 0) is None
    assert progress_percent(3, 0) is None


def test_progress_percent_never_exceeds_one_hundred():
    assert progress_percent(5, 4) == 100


@pytest.mark.asyncio
async def test_student_dashboard_serializes_nullable_activity_subtype(
    db, org, course, activity, regular_user
):
    """Published legacy activities without a subtype remain safely accessible."""
    activity.activity_sub_type = None
    now = datetime.now(UTC).isoformat()
    db.add(activity)
    db.add(
        TrailRun(
            data={},
            status=StatusEnum.STATUS_IN_PROGRESS,
            trail_id=1,
            course_id=course.id,
            org_id=org.id,
            user_id=regular_user.id,
            creation_date=now,
            update_date=now,
        )
    )
    await db.commit()

    result = await get_student_dashboard(regular_user, org.slug, db)

    assert result is not None
    assert result["organization"] == org.name
    assert result["summary"] == {
        "active_courses": 1,
        "completed_lessons": 0,
        "total_lessons": 1,
        "overall_progress_percent": 0,
    }
    [course_data] = result["courses"]
    assert course_data["course_id"] == course.course_uuid
    assert course_data["target_href"] == "/xpex/courses/test/learn/test"
    [activity_data] = course_data["activities"]
    assert activity_data["activity_uuid"] == activity.activity_uuid
    assert activity_data["activity_sub_type"] is None
    assert activity_data["complete"] is False
