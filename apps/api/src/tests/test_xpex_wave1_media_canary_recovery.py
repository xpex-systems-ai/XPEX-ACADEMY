import hashlib
from pathlib import Path
import pytest
from scripts import xpex_wave1_media_canary_recovery_038 as recovery
from src.services.xpex.video_factory import (
    CaptionAsset,
    LessonVideoManifest,
    MultimodalReview,
    NarrationAsset,
    VideoAsset,
)


def _checksum(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


@pytest.mark.asyncio
async def test_media_qa_recomputes_video_and_caption_checksums(tmp_path, monkeypatch):
    video_bytes = b"real composed video"
    caption_bytes = b"WEBVTT\n\n00:00.000 --> 00:01.000\nOla\n"
    sources = {
        "video-key": video_bytes,
        "caption-key": caption_bytes,
    }

    def materialize(uri: str, destination: str) -> str:
        Path(destination).write_bytes(sources[uri])
        return destination

    monkeypatch.setattr(recovery, "materialize_storage_key", materialize)
    monkeypatch.setattr(recovery, "probe_duration_seconds", lambda _path: 1.0)
    monkeypatch.setattr(recovery, "_run_probe", lambda *_args, **_kwargs: True)
    manifest = LessonVideoManifest(
        lesson_id=recovery.CANARY_LESSON_KEY,
        narration=NarrationAsset(
            uri="narration-key",
            checksum_sha256="0" * 64,
            mime_type="audio/wav",
            duration_seconds=1,
        ),
        video_draft=VideoAsset(
            uri="video-key",
            checksum_sha256=_checksum(video_bytes),
            mime_type="video/mp4",
            duration_seconds=1,
        ),
        captions=[
            CaptionAsset(
                uri="caption-key",
                checksum_sha256=_checksum(caption_bytes),
                mime_type="text/vtt",
                format="vtt",
            )
        ],
        review=MultimodalReview(model="review-model", notes=[]),
    )

    qa = await recovery._media_qa(manifest)

    assert qa["checksum_valid"] is True
    assert qa["captions_checksum_valid"] is True
    assert qa["checksum_sha256"] == _checksum(video_bytes)
    assert qa["captions_checksum_sha256"] == _checksum(caption_bytes)
    assert recovery._qa_passed(qa) is True


@pytest.mark.asyncio
async def test_media_qa_rejects_tampered_persisted_artifacts(tmp_path, monkeypatch):
    def materialize(uri: str, destination: str) -> str:
        data = b"tampered video" if uri == "video-key" else b"WEBVTT\n\n00:00.000 --> 00:01.000\nTampered\n"
        Path(destination).write_bytes(data)
        return destination

    monkeypatch.setattr(recovery, "materialize_storage_key", materialize)
    monkeypatch.setattr(recovery, "probe_duration_seconds", lambda _path: 1.0)
    monkeypatch.setattr(recovery, "_run_probe", lambda *_args, **_kwargs: True)
    manifest = LessonVideoManifest(
        lesson_id=recovery.CANARY_LESSON_KEY,
        narration=NarrationAsset(
            uri="narration-key",
            checksum_sha256="0" * 64,
            mime_type="audio/wav",
            duration_seconds=1,
        ),
        video_draft=VideoAsset(
            uri="video-key",
            checksum_sha256="1" * 64,
            mime_type="video/mp4",
            duration_seconds=1,
        ),
        captions=[
            CaptionAsset(
                uri="caption-key",
                checksum_sha256="2" * 64,
                mime_type="text/vtt",
                format="vtt",
            )
        ],
        review=MultimodalReview(model="review-model", notes=[]),
    )

    qa = await recovery._media_qa(manifest)

    assert qa["checksum_valid"] is False
    assert qa["captions_checksum_valid"] is False
    assert recovery._qa_passed(qa) is False


def test_recovery_state_contract_includes_owned_downstream_checkpoints():
    assert recovery.RESUMABLE_STATES == {
        "AVATAR_OR_VISUAL_RENDER",
        "COMPOSITION",
        "CAPTIONS",
        "MEDIA_QA",
    }
    assert recovery.FINAL_STATE == "AWAITING_HUMAN_APPROVAL"
    assert recovery.AUTHORIZED_JOB_ID == "xpw1_a9b0b936e85b51dc846a3613372b3b46"
