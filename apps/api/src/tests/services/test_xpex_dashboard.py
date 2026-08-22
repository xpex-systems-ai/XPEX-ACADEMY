from src.db.courses.activities import ActivitySubTypeEnum
from src.services.xpex.dashboard import (
    _activity_sub_type_value,
    progress_percent,
)


def test_progress_percent_uses_canonical_counts():
    assert progress_percent(1, 4) == 25
    assert progress_percent(4, 4) == 100


def test_progress_percent_is_unknown_without_lessons():
    assert progress_percent(0, 0) is None
    assert progress_percent(3, 0) is None


def test_progress_percent_never_exceeds_one_hundred():
    assert progress_percent(5, 4) == 100


def test_nullable_activity_subtype_serialization():
    """Legacy/imported activities without a subtype serialize as JSON null."""
    assert _activity_sub_type_value(None) is None
    assert (
        _activity_sub_type_value(ActivitySubTypeEnum.SUBTYPE_DYNAMIC_PAGE)
        == "SUBTYPE_DYNAMIC_PAGE"
    )
