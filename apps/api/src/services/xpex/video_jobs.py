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
from src.services.xpex.video_factory import (
    LessonVideoManifest,
    VideoBatchPlan,
    VideoJobState,
)

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
            resume_state=VideoJobState.SCRIPTING.value,
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


def _resume_manifest(row: XPeXVideoJob) -> LessonVideoManifest:
    manifest = LessonVideoManifest.model_validate(row.manifest_json)
    try:
        resume_state = VideoJobState(row.resume_state or VideoJobState.SCRIPTING.value)
    except ValueError:
        resume_state = VideoJobState.SCRIPTING
    if resume_state not in ACTIVE_STATES:
        resume_state = VideoJobState.SCRIPTING
    manifest.state = resume_state
    return manifest


async def _claim_row(
    db_session: AsyncSession,
    row: XPeXVideoJob,
    *,
    worker_id: str,
    lease_seconds: int,
) -> XPeXVideoJob:
    manifest = _resume_manifest(row)
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
    Failed jobs resume from their last durable stage instead of starting over.
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
    return await _claim_row(
        db_session,
        row,
        worker_id=worker_id,
        lease_seconds=lease_seconds,
    )


async def claim_job(
    db_session: AsyncSession,
    *,
    job_id: str,
    worker_id: str,
    org_id: int,
    lease_seconds: int = 1800,
    max_attempts: int = 5,
) -> XPeXVideoJob | None:
    """Claim one explicitly selected job under the same lease/retry rules."""
    lease_seconds = max(30, min(lease_seconds, 3600))
    row = (
        await db_session.execute(
            select(XPeXVideoJob)
            .where(
                XPeXVideoJob.job_id == job_id,
                XPeXVideoJob.org_id == org_id,
                XPeXVideoJob.state.in_([VideoJobState.QUEUED.value, VideoJobState.FAILED.value]),
                XPeXVideoJob.attempt_count < max_attempts,
            )
            .with_for_update(skip_locked=True)
        )
    ).scalars().first()
    if row is None:
        await db_session.rollback()
        return None
    return await _claim_row(
        db_session,
        row,
        worker_id=worker_id,
        lease_seconds=lease_seconds,
    )


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
    statement = select(XPeXVideoJob).where(XPeXVideoJob.job_id == job_id).with_for_update()
    row = (await db_session.execute(statement)).scalars().first()
    if row is None:
        raise ValueError("video job not found")
    _require_live_lease(row, lease_id)

    manifest.state = next_state
    row.state = next_state.value
    row.resume_state = next_state.value if next_state in ACTIVE_STATES else None
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


async def save_human_transition(
    db_session: AsyncSession,
    *,
    row: XPeXVideoJob,
    manifest: LessonVideoManifest,
    actor_user_id: int,
) -> XPeXVideoJob:
    """Persist an approval/attachment/publication transition after domain validation."""
    row.state = manifest.state.value
    row.resume_state = None
    row.revision = manifest.revision
    row.content_hash = manifest.content_hash()
    row.manifest_json = manifest.model_dump(mode="json")
    row.native_activity_uuid = manifest.learnhouse_activity_uuid
    row.updated_at = _iso(_now())
    if manifest.state == VideoJobState.APPROVED:
        row.approved_by_user_id = actor_user_id
        row.approved_at = row.updated_at
    elif manifest.state == VideoJobState.ATTACHED:
        row.attached_at = row.updated_at
    elif manifest.state == VideoJobState.PUBLISHED:
        row.published_at = row.updated_at
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
    """Release a failed job for bounded retry at its last durable stage."""
    row = (
        await db_session.execute(
            select(XPeXVideoJob).where(XPeXVideoJob.job_id == job_id).with_for_update()
        )
    ).scalars().first()
    if row is None:
        raise ValueError("video job not found")
    _require_live_lease(row, lease_id)

    try:
        current = VideoJobState(row.state)
    except ValueError:
        current = VideoJobState.SCRIPTING
    row.resume_state = current.value if current in ACTIVE_STATES else VideoJobState.SCRIPTING.value

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
