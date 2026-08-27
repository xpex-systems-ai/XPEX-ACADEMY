"""Transactional repository primitives for XPeX video jobs.

Workers claim rows with ``FOR UPDATE SKIP LOCKED`` so multiple replicas can process
one batch without double execution. Every checkpoint is lease-bound and persists the
full manifest; human approval/attachment/publication remain outside the worker.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import uuid4

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.db.xpex_video import XPeXVideoJob
from src.services.xpex.video_factory import LessonVideoManifest, VideoBatchPlan, VideoJobState


ACTIVE_STATES = {
    VideoJobState.SCRIPTING,
    VideoJobState.STORYBOARDING,
    VideoJobState.NARRATING,
    VideoJobState.ASSET_GENERATION,
    VideoJobState.RENDERING,
    VideoJobState.REVIEWING,
}
WORKER_TERMINAL_STATES = {
    VideoJobState.AWAITING_HUMAN_APPROVAL,
    VideoJobState.APPROVED,
    VideoJobState.ATTACHED,
    VideoJobState.PUBLISHED,
    VideoJobState.CANCELLED,
}


def _now() -> datetime:
    return datetime.now(UTC)


def _iso(value: datetime) -> str:
    return value.astimezone(UTC).isoformat()


async def ensure_batch_jobs(
    db_session: AsyncSession,
    *,
    plan: VideoBatchPlan,
    org_id: int,
    created_by_user_id: int,
    editorial_draft_id: str | None = None,
    native_course_uuid: str | None = None,
) -> list[XPeXVideoJob]:
    """Idempotently materialize one durable row per lesson in the batch."""
    existing = (
        await db_session.execute(
            select(XPeXVideoJob).where(
                XPeXVideoJob.batch_id == plan.course_id,
                XPeXVideoJob.org_id == org_id,
            )
        )
    ).scalars().all()
    by_lesson = {row.lesson_id: row for row in existing}
    now = _iso(_now())

    for manifest in plan.manifests():
        if manifest.lesson_id in by_lesson:
            continue
        row = XPeXVideoJob(
            job_id=f"xpvj_{uuid4()}",
            batch_id=plan.course_id,
            lesson_id=manifest.lesson_id,
            org_id=org_id,
            created_by_user_id=created_by_user_id,
            editorial_draft_id=editorial_draft_id,
            native_course_uuid=native_course_uuid,
            state=VideoJobState.QUEUED.value,
            revision=manifest.revision,
            content_hash=manifest.content_hash(),
            manifest_json=manifest.model_dump(mode="json"),
            created_at=now,
            updated_at=now,
        )
        db_session.add(row)
        by_lesson[manifest.lesson_id] = row

    await db_session.commit()
    return [by_lesson[lesson_id] for lesson_id in plan.lesson_ids]


async def claim_next_job(
    db_session: AsyncSession,
    *,
    worker_id: str,
    org_id: int | None = None,
    lease_seconds: int = 300,
    max_attempts: int = 5,
) -> XPeXVideoJob | None:
    """Atomically claim one queued/retryable job for a worker replica.

    ``SKIP LOCKED`` is the duplicate-execution guard across concurrent workers.
    Failed jobs are retryable only below ``max_attempts``. A fresh claim always
    restarts from the durable manifest and moves to SCRIPTING.
    """
    lease_seconds = max(30, min(lease_seconds, 3600))
    statement = (
        select(XPeXVideoJob)
        .where(
            XPeXVideoJob.state.in_([VideoJobState.QUEUED.value, VideoJobState.FAILED.value]),
            XPeXVideoJob.attempt_count < max_attempts,
        )
        .order_by(XPeXVideoJob.id.asc())
        .limit(1)
        .with_for_update(skip_locked=True)
    )
    if org_id is not None:
        statement = statement.where(XPeXVideoJob.org_id == org_id)

    row = (await db_session.execute(statement)).scalars().first()
    if row is None:
        await db_session.rollback()
        return None

    manifest = LessonVideoManifest.model_validate(row.manifest_json)
    manifest.state = VideoJobState.SCRIPTING
    lease_id = f"{worker_id}:{uuid4()}"
    now = _now()
    row.state = manifest.state.value
    row.manifest_json = manifest.model_dump(mode="json")
    row.revision = manifest.revision
    row.content_hash = manifest.content_hash()
    row.attempt_count += 1
    row.lease_id = lease_id
    row.lease_expires_at = _iso(now + timedelta(seconds=lease_seconds))
    row.last_error = None
    row.updated_at = _iso(now)
    db_session.add(row)
    await db_session.commit()
    await db_session.refresh(row)
    return row


def _require_live_lease(row: XPeXVideoJob, lease_id: str) -> None:
    if not row.lease_id or row.lease_id != lease_id:
        raise ValueError("video job lease does not belong to this worker")
    if row.lease_expires_at:
        expires = datetime.fromisoformat(row.lease_expires_at)
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=UTC)
        if expires <= _now():
            raise ValueError("video job lease expired")


async def save_worker_checkpoint(
    db_session: AsyncSession,
    *,
    job_id: str,
    lease_id: str,
    manifest: LessonVideoManifest,
    next_state: VideoJobState,
    lease_seconds: int = 300,
) -> XPeXVideoJob:
    """Persist one resumable stage checkpoint under the worker lease."""
    if next_state in {VideoJobState.APPROVED, VideoJobState.ATTACHED, VideoJobState.PUBLISHED}:
        raise ValueError("worker cannot cross a human approval/publication gate")
    statement = (
        select(XPeXVideoJob)
        .where(XPeXVideoJob.job_id == job_id)
        .with_for_update()
    )
    row = (await db_session.execute(statement)).scalars().first()
    if row is None:
        raise ValueError("video job not found")
    _require_live_lease(row, lease_id)

    manifest.state = next_state
    row.state = next_state.value
    row.revision = manifest.revision
    row.content_hash = manifest.content_hash()
    row.manifest_json = manifest.model_dump(mode="json")
    row.updated_at = _iso(_now())

    if next_state in WORKER_TERMINAL_STATES:
        row.lease_id = None
        row.lease_expires_at = None
    else:
        lease_seconds = max(30, min(lease_seconds, 3600))
        row.lease_expires_at = _iso(_now() + timedelta(seconds=lease_seconds))

    db_session.add(row)
    await db_session.commit()
    await db_session.refresh(row)
    return row


async def mark_job_failed(
    db_session: AsyncSession,
    *,
    job_id: str,
    lease_id: str,
    safe_error: str,
) -> XPeXVideoJob:
    """Release a failed job for bounded retry without persisting provider bodies."""
    row = (
        await db_session.execute(
            select(XPeXVideoJob).where(XPeXVideoJob.job_id == job_id).with_for_update()
        )
    ).scalars().first()
    if row is None:
        raise ValueError("video job not found")
    _require_live_lease(row, lease_id)
    manifest = LessonVideoManifest.model_validate(row.manifest_json)
    manifest.state = VideoJobState.FAILED
    row.state = VideoJobState.FAILED.value
    row.manifest_json = manifest.model_dump(mode="json")
    row.last_error = safe_error.strip()[:1000] or "video worker failed"
    row.lease_id = None
    row.lease_expires_at = None
    row.updated_at = _iso(_now())
    db_session.add(row)
    await db_session.commit()
    await db_session.refresh(row)
    return row
