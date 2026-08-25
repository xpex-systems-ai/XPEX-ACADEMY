from src.db.trail_runs import StatusEnum
from src.services.xpex.dashboard import _continue_learning_card, _is_completed_card


def card(*, state=StatusEnum.STATUS_IN_PROGRESS.value, completed=0, total=2, title="Course"):
    return {
        "title": title,
        "enrollment_state": state,
        "completed_lessons": completed,
        "total_lessons": total,
    }


def test_completed_card_detects_explicit_and_progress_completion():
    assert _is_completed_card(card(state=StatusEnum.STATUS_COMPLETED.value))
    assert _is_completed_card(card(completed=2, total=2))
    assert not _is_completed_card(card(completed=1, total=2))


def test_continue_learning_prefers_incomplete_over_newer_completed_course():
    completed = card(completed=2, total=2, title="Completed")
    resumable = card(completed=1, total=3, title="Resumable")
    assert _continue_learning_card([completed, resumable]) is resumable


def test_continue_learning_skips_paused_course_when_active_course_exists():
    paused = card(state=StatusEnum.STATUS_PAUSED.value, completed=1, total=3, title="Paused")
    active = card(completed=0, total=3, title="Active")
    assert _continue_learning_card([paused, active]) is active


def test_continue_learning_falls_back_honestly_when_all_courses_are_completed():
    latest_completed = card(completed=2, total=2, title="Latest")
    older_completed = card(state=StatusEnum.STATUS_COMPLETED.value, title="Older")
    assert _continue_learning_card([latest_completed, older_completed]) is latest_completed
