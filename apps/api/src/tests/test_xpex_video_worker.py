from __future__ import annotations

import pytest
from src.db.xpex_video import XPeXVideoJob
from src.services.xpex.video_factory import LessonVideoManifest, VideoJobState
from src.services.xpex.video_worker import VideoStageHandlers, run_claimed_job


def make_claimed_job(state: VideoJobState = VideoJobState.SCRIPTING) -> XPeXVideoJob:
    manifest = LessonVideoManifest(lesson_id="lesson-01", state=state)
    return XPeXVideoJob(
        id=1,
        job_id="xpvj_worker",
        batch_id="batch",
        lesson_id="lesson-01",
        org_id=1,
        created_by_user_id=7,
        state=state.value,
        resume_state=state.value,
        revision=1,
        content_hash=manifest.content_hash(),
        manifest_json=manifest.model_dump(mode="json"),
        attempt_count=1,
        lease_id="lease-1",
        lease_expires_at="2999-01-01T00:00:00+00:00",
        created_at="2026-08-27T10:00:00+00:00",
        updated_at="2026-08-27T10:00:00+00:00",
    )


@pytest.mark.asyncio
async def test_worker_checkpoints_every_stage_and_stops_before_approval(monkeypatch):
    calls: list[VideoJobState] = []
    job = make_claimed_job()

    async def handler(manifest: LessonVideoManifest) -> LessonVideoManifest:
        calls.append(manifest.state)
        return manifest

    async def fake_checkpoint(_db, *, job_id, lease_id, manifest, next_state, **_kwargs):
        assert job_id == job.job_id
        assert lease_id == "lease-1"
        manifest.state = next_state
        job.state = next_state.value
        job.manifest_json = manifest.model_dump(mode="json")
        if next_state == VideoJobState.AWAITING_HUMAN_APPROVAL:
            job.lease_id = None
        return job

    async def fail_should_not_run(*_args, **_kwargs):
        raise AssertionError("failure path should not run")

    monkeypatch.setattr("src.services.xpex.video_worker.save_worker_checkpoint", fake_checkpoint)
    monkeypatch.setattr("src.services.xpex.video_worker.mark_job_failed", fail_should_not_run)

    handlers = VideoStageHandlers(
        scripting=handler,
        storyboarding=handler,
        narrating=handler,
        asset_generation=handler,
        rendering=handler,
        reviewing=handler,
    )

    result = await run_claimed_job(object(), job=job, handlers=handlers)  # type: ignore[arg-type]

    assert calls == [
        VideoJobState.SCRIPTING,
        VideoJobState.STORYBOARDING,
        VideoJobState.NARRATING,
        VideoJobState.ASSET_GENERATION,
        VideoJobState.RENDERING,
        VideoJobState.REVIEWING,
    ]
    assert result.state == VideoJobState.AWAITING_HUMAN_APPROVAL.value
    assert result.lease_id is None


@pytest.mark.asyncio
async def test_worker_failure_is_sanitized_and_released(monkeypatch):
    job = make_claimed_job(VideoJobState.RENDERING)
    captured: dict[str, str] = {}

    async def noop(manifest: LessonVideoManifest) -> LessonVideoManifest:
        return manifest

    async def render_failure(_manifest: LessonVideoManifest) -> LessonVideoManifest:
        raise RuntimeError("provider body with secret token")

    async def fake_failed(_db, *, job_id, lease_id, safe_error):
        captured["job_id"] = job_id
        captured["lease_id"] = lease_id
        captured["safe_error"] = safe_error
        job.state = VideoJobState.FAILED.value
        job.lease_id = None
        return job

    monkeypatch.setattr("src.services.xpex.video_worker.mark_job_failed", fake_failed)

    handlers = VideoStageHandlers(
        scripting=noop,
        storyboarding=noop,
        narrating=noop,
        asset_generation=noop,
        rendering=render_failure,
        reviewing=noop,
    )

    result = await run_claimed_job(object(), job=job, handlers=handlers)  # type: ignore[arg-type]

    assert result.state == VideoJobState.FAILED.value
    assert result.lease_id is None
    assert captured["safe_error"] == "RuntimeError: stage execution failed"
    assert "secret" not in captured["safe_error"]
