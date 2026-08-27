from __future__ import annotations

from pathlib import Path

import pytest
from src.services.xpex.video_media import (
    VideoMediaError,
    activity_artifact_key,
    build_caption_text,
    draft_artifact_key,
    persist_local_or_s3,
    write_caption_artifact,
)


def test_draft_and_activity_keys_are_scoped_and_path_safe():
    assert draft_artifact_key(
        batch_id="course-1",
        lesson_id="lesson-01",
        revision=2,
        filename="draft.mp4",
    ) == "content/xpex-video-drafts/course-1/lesson-01/r2/draft.mp4"
    assert activity_artifact_key(
        org_uuid="org_1",
        course_uuid="course_1",
        activity_uuid="activity_1",
        filename="lesson.mp4",
    ) == "content/orgs/org_1/courses/course_1/activities/activity_1/lesson.mp4"

    with pytest.raises(VideoMediaError, match="plain filename"):
        activity_artifact_key(
            org_uuid="org_1",
            course_uuid="course_1",
            activity_uuid="activity_1",
            filename="../lesson.mp4",
        )


def test_caption_builder_emits_vtt_and_srt():
    vtt = build_caption_text("  Olá   mundo  ", 5, format="vtt")
    assert vtt.startswith("WEBVTT\n\n00:00:00.000 --> 00:00:05.000")
    assert "Olá mundo" in vtt

    srt = build_caption_text("Olá mundo", 5, format="srt")
    assert srt.startswith("1\n00:00:00,000 --> 00:00:05,000")

    with pytest.raises(VideoMediaError, match="empty"):
        build_caption_text("   ", 5, format="vtt")


def test_write_caption_artifact_has_checksum(tmp_path: Path):
    target = tmp_path / "lesson.vtt"
    asset = write_caption_artifact(
        transcript="Aprenda HTML sem inventar a interface.",
        duration_seconds=30,
        output_path=str(target),
    )
    assert target.exists()
    assert asset.format == "vtt"
    assert asset.mime_type == "text/vtt"
    assert len(asset.checksum_sha256) == 64


def test_persist_local_filesystem_is_atomic(monkeypatch, tmp_path: Path):
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(
        "src.services.xpex.video_media.get_content_delivery_type",
        lambda: "filesystem",
    )
    source = tmp_path / "source.mp4"
    source.write_bytes(b"video-bytes")
    stored = persist_local_or_s3(
        str(source),
        "content/xpex-video-drafts/batch/lesson/r1/final.mp4",
    )
    assert stored.local_path is not None
    assert Path(stored.local_path).read_bytes() == b"video-bytes"
    assert len(stored.checksum_sha256) == 64
    assert stored.mime_type == "video/mp4"


def test_persist_s3_failure_fails_closed(monkeypatch, tmp_path: Path):
    source = tmp_path / "source.mp4"
    source.write_bytes(b"video")
    monkeypatch.setattr(
        "src.services.xpex.video_media.get_content_delivery_type",
        lambda: "s3api",
    )
    monkeypatch.setattr(
        "src.services.xpex.video_media.upload_file_to_s3",
        lambda *_args, **_kwargs: False,
    )
    with pytest.raises(VideoMediaError, match="upload failed"):
        persist_local_or_s3(str(source), "content/test.mp4")
