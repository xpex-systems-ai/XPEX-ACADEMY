import pytest

from src.services.xpex.video_factory import (
    CaptionAsset,
    LessonVideoManifest,
    MediaRef,
    MultimodalReview,
    NarrationAsset,
    ReviewSeverity,
    StoryboardScene,
    VideoAsset,
    VideoBatchPlan,
    VideoJobState,
    VideoReviewNote,
    VideoScript,
)


SHA = "a" * 64


def ready_manifest() -> LessonVideoManifest:
    return LessonVideoManifest(
        lesson_id="lesson-1",
        state=VideoJobState.AWAITING_HUMAN_APPROVAL,
        video_script=VideoScript(
            title="HTML básico",
            learning_objective="Criar uma página HTML válida.",
            narration_text="Nesta aula vamos criar nossa primeira página.",
            estimated_duration_seconds=240,
        ),
        storyboard=[
            StoryboardScene(
                order=1,
                narration="Abra o editor.",
                visual_direction="Captura real do editor e navegador.",
                deterministic_capture=True,
            )
        ],
        narration=NarrationAsset(
            uri="s3://xpex/narration.mp3",
            checksum_sha256=SHA,
            mime_type="audio/mpeg",
            duration_seconds=240,
        ),
        thumbnails=[
            MediaRef(uri="s3://xpex/thumb.webp", checksum_sha256=SHA, mime_type="image/webp")
        ],
        captions=[
            CaptionAsset(
                uri="s3://xpex/captions.vtt",
                checksum_sha256=SHA,
                mime_type="text/vtt",
                format="vtt",
            )
        ],
        video_draft=VideoAsset(
            uri="s3://xpex/video.mp4",
            checksum_sha256=SHA,
            mime_type="video/mp4",
            duration_seconds=242,
        ),
        review=MultimodalReview(model="hf-review-model", notes=[]),
    )


def test_batch_plan_supports_24_unique_lessons():
    plan = VideoBatchPlan(
        course_id="course-1",
        lesson_ids=[f"lesson-{index}" for index in range(1, 25)],
        concurrency=3,
    )

    manifests = plan.manifests()

    assert len(manifests) == 24
    assert all(item.state == VideoJobState.QUEUED for item in manifests)
    assert all(item.published is False for item in manifests)


def test_duplicate_lessons_fail_closed():
    with pytest.raises(ValueError, match="unique"):
        VideoBatchPlan(course_id="course-1", lesson_ids=["lesson-1", "lesson-1"])


def test_blocker_review_prevents_human_approval():
    manifest = ready_manifest()
    manifest.review = MultimodalReview(
        model="hf-review-model",
        notes=[
            VideoReviewNote(
                severity=ReviewSeverity.BLOCKER,
                code="CODE_INCORRECT",
                message="The rendered code does not match the lesson.",
            )
        ],
    )

    with pytest.raises(ValueError, match="BLOCKER"):
        manifest.approve(user_id=9)


def test_approval_attachment_and_publish_are_three_distinct_actions():
    manifest = ready_manifest()

    manifest.approve(user_id=9)
    assert manifest.state == VideoJobState.APPROVED
    assert manifest.published is False
    assert manifest.learnhouse_activity_uuid is None

    manifest.mark_attached_unpublished("activity-video-1")
    assert manifest.state == VideoJobState.ATTACHED
    assert manifest.attached_unpublished is True
    assert manifest.published is False

    manifest.mark_published()
    assert manifest.state == VideoJobState.PUBLISHED
    assert manifest.published is True


def test_edit_invalidation_clears_approval_and_attachment():
    manifest = ready_manifest()
    manifest.approve(user_id=9)
    manifest.mark_attached_unpublished("activity-video-1")
    old_revision = manifest.revision

    manifest.invalidate_approval()

    assert manifest.revision == old_revision + 1
    assert manifest.approved_by_user_id is None
    assert manifest.approved_content_hash is None
    assert manifest.learnhouse_activity_uuid is None
    assert manifest.published is False
    assert manifest.state == VideoJobState.QUEUED


def test_publishing_without_attachment_is_rejected():
    manifest = ready_manifest()
    manifest.approve(user_id=9)

    with pytest.raises(ValueError, match="attachment"):
        manifest.mark_published()
