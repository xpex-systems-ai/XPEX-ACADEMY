import pytest
from src.db.courses.activities import (
    ActivityLockType,
    ActivitySubTypeEnum,
    ActivityTypeEnum,
)
from src.services.xpex.video_attachment import HostedVideoAttachment


def test_hosted_video_attachment_is_native_and_unpublished():
    activity = HostedVideoAttachment(
        chapter_id=7,
        name="Flexbox na prática",
        filename="lesson-07.mp4",
    ).to_unpublished_activity()

    assert activity.activity_type == ActivityTypeEnum.TYPE_VIDEO
    assert activity.activity_sub_type == ActivitySubTypeEnum.SUBTYPE_VIDEO_HOSTED
    assert activity.content == {"filename": "lesson-07.mp4"}
    assert activity.published is False
    assert activity.lock_type == ActivityLockType.AUTHENTICATED


def test_hosted_video_attachment_rejects_path_in_filename():
    with pytest.raises(ValueError, match="path"):
        HostedVideoAttachment(
            chapter_id=7,
            name="Aula",
            filename="private/lesson.mp4",
        )
