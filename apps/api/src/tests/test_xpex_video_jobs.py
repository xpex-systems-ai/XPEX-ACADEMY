from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import pytest
from src.db.xpex_video import XPeXVideoJob
from src.services.xpex.video_factory import (
    LessonVideoManifest,
    VideoBatchPlan,
    VideoJobState,
)
from src.services.xpex.video_jobs import (
    claim_next_job,
    ensure_batch_jobs,
    mark_job_failed,
    save_worker_checkpoint,
)


class FakeScalars:
    def __init__(self, rows: list[Any]):
        self.rows = rows

    def all(self):
        return self.rows

    def first(self):
        return self.rows[0] if self.rows else None


class FakeResult:
    def __init__(self, rows: list[Any]):
        self.rows = rows

    def scalars(self):
        return FakeScalars(self.rows)


@dataclass
class FakeSession:
    execute_rows: list[list[Any]]

    def __post_init__(self):
        self.added: list[Any] = []
        self.commits = 0
        self.rollbacks = 0
        self.refreshes = 0

    async def execute(self, _statement):
        rows = self.execute_rows.pop(0) if self.execute_rows else []
        return FakeResult(rows)

    def add(self, row):
        self.added.append(row)

    async def commit(self):
        self.commits += 1

    async def rollback(self):
        self.rollbacks += 1

    async def refresh(self, _row):
        self.refreshes += 1


def make_job(*, state: VideoJobState = VideoJobState.QUEUED) -> XPeXVideoJob:
    manifest = LessonVideoManifest(lesson_id="lesson-01", state=state)
    return XPeXVideoJob(
        id=1,
        job_id="xpvj_test",
        batch_id="course-batch",
        lesson_id="lesson-01",
        org_id=1,
        created_by_user_id=10,
        state=state.value,
        revision=manifest.revision,
        content_hash=manifest.content_hash(),
        manifest_json=manifest.model_dump(mode="json"),
        attempt_count=0,
        created_at="2026-08-27T10:00:00+00:00",
        updated_at="2026-08-27T10:00:00+00:00",
    )


@pytest.mark.asyncio
async def test_ensure_batch_jobs_is_idempotent_for_existing_lessons():
    existing = make_job()
    existing.lesson_id = "lesson-01"
    session = FakeSession(execute_rows=[[existing]])
    plan = VideoBatchPlan(
        course_id="course-batch",
        lesson_ids=["lesson-01", "lesson-02"],
        concurrency=2,
    )

    rows = await ensure_batch_jobs(
        session,  # type: ignore[arg-type]
        plan=plan,
        org_id=1,
        created_by_user_id=10,
    )

    assert len(rows) == 2
    assert rows[0] is existing
    assert rows[1].lesson_id == "lesson-02"
    assert len(session.added) == 1
    assert session.commits == 1


@pytest.mark.asyncio
async def test_claim_moves_job_to_scripting_and_sets_unique_lease():
    row = make_job()
    row.resume_state = VideoJobState.SCRIPTING.value
    session = FakeSession(execute_rows=[[row]])

    claimed = await claim_next_job(
        session,  # type: ignore[arg-type]
        worker_id="railway-worker-1",
        org_id=1,
    )

    assert claimed is row
    assert row.state == VideoJobState.SCRIPTING.value
    assert row.attempt_count == 1
    assert row.lease_id is not None and row.lease_id.startswith("railway-worker-1:")
    assert row.lease_expires_at
    assert session.commits == 1


@pytest.mark.asyncio
async def test_failed_job_claim_resumes_last_durable_stage():
    row = make_job(state=VideoJobState.FAILED)
    row.resume_state = VideoJobState.RENDERING.value
    session = FakeSession(execute_rows=[[row]])

    claimed = await claim_next_job(
        session,  # type: ignore[arg-type]
        worker_id="railway-worker-2",
    )

    assert claimed is row
    assert row.state == VideoJobState.RENDERING.value
    assert LessonVideoManifest.model_validate(row.manifest_json).state == VideoJobState.RENDERING


@pytest.mark.asyncio
async def test_claim_none_rolls_back_transaction():
    session = FakeSession(execute_rows=[[]])
    claimed = await claim_next_job(session, worker_id="worker")  # type: ignore[arg-type]
    assert claimed is None
    assert session.rollbacks == 1


@pytest.mark.asyncio
async def test_worker_checkpoint_cannot_cross_human_gate():
    row = make_job(state=VideoJobState.SCRIPTING)
    row.lease_id = "lease-1"
    row.lease_expires_at = "2999-01-01T00:00:00+00:00"
    session = FakeSession(execute_rows=[[row]])
    manifest = LessonVideoManifest.model_validate(row.manifest_json)

    with pytest.raises(ValueError, match="human approval"):
        await save_worker_checkpoint(
            session,  # type: ignore[arg-type]
            job_id=row.job_id,
            lease_id="lease-1",
            manifest=manifest,
            next_state=VideoJobState.APPROVED,
        )


@pytest.mark.asyncio
async def test_checkpoint_to_awaiting_human_approval_releases_lease():
    row = make_job(state=VideoJobState.REVIEWING)
    row.lease_id = "lease-1"
    row.lease_expires_at = "2999-01-01T00:00:00+00:00"
    session = FakeSession(execute_rows=[[row]])
    manifest = LessonVideoManifest.model_validate(row.manifest_json)

    saved = await save_worker_checkpoint(
        session,  # type: ignore[arg-type]
        job_id=row.job_id,
        lease_id="lease-1",
        manifest=manifest,
        next_state=VideoJobState.AWAITING_HUMAN_APPROVAL,
    )

    assert saved.state == VideoJobState.AWAITING_HUMAN_APPROVAL.value
    assert saved.lease_id is None
    assert saved.lease_expires_at is None


@pytest.mark.asyncio
async def test_failed_job_releases_lease_and_sanitizes_error_length():
    row = make_job(state=VideoJobState.RENDERING)
    row.lease_id = "lease-1"
    row.lease_expires_at = "2999-01-01T00:00:00+00:00"
    session = FakeSession(execute_rows=[[row]])

    saved = await mark_job_failed(
        session,  # type: ignore[arg-type]
        job_id=row.job_id,
        lease_id="lease-1",
        safe_error="x" * 1500,
    )

    assert saved.state == VideoJobState.FAILED.value
    assert saved.resume_state == VideoJobState.RENDERING.value
    assert saved.lease_id is None
    assert saved.lease_expires_at is None
    assert len(saved.last_error or "") == 1000
