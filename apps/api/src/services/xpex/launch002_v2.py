"""Hardened orchestration for XPEX-LAUNCH-002.

This runner keeps the curated 6-module/24-lesson course from ``launch002`` but
hardens production execution around restarts, staging, task isolation and the
human video approval boundary.
"""

from __future__ import annotations

import asyncio
import logging
import os
from datetime import UTC, datetime

from fastapi import Request
from sqlmodel import select
from src.db.courses.activities import ActivityUpdate
from src.db.courses.courses import CourseUpdate
from src.db.organizations import Organization
from src.db.users import PublicUser, User
from src.db.xpex_editorial import XPeXEditorialDraft
from src.db.xpex_video import XPeXVideoJob
from src.services.courses.activities.activities import update_activity
from src.services.courses.courses import update_course
from src.services.xpex.editorial_studio import (
    EditorialMutationRequest,
    approve_editorial_draft,
    draft_content_hash,
    publish_editorial_draft,
    review_editorial_draft,
)
from src.services.xpex.launch002 import LAUNCH_DRAFT_ID, build_launch002_course
from src.services.xpex.video_factory import VideoJobState
from src.services.xpex.video_jobs import ACTIVE_STATES
from src.services.xpex.video_studio import create_video_batch, process_video_job

logger = logging.getLogger(__name__)


def _now() -> datetime:
    return datetime.now(UTC)


def _now_iso() -> str:
    return _now().isoformat()


def _request() -> Request:
    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/internal/xpex-launch-002",
            "headers": [],
        }
    )


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)


async def _resolve_actor(db_session) -> PublicUser | None:
    """Resolve a dedicated launch administrator, never the student ops target."""
    actor_uuid = os.getenv("XPEX_LAUNCH002_ACTOR_USER_UUID", "").strip()
    if actor_uuid:
        user = (
            await db_session.execute(select(User).where(User.user_uuid == actor_uuid))
        ).scalars().first()
    else:
        admin_email = os.getenv("LEARNHOUSE_INITIAL_ADMIN_EMAIL", "").strip().lower()
        if not admin_email:
            logger.error(
                "XPEX-LAUNCH-002 blocked: set XPEX_LAUNCH002_ACTOR_USER_UUID or LEARNHOUSE_INITIAL_ADMIN_EMAIL"
            )
            return None
        user = (
            await db_session.execute(select(User).where(User.email == admin_email))
        ).scalars().first()

    if not user or user.id is None:
        logger.error("XPEX-LAUNCH-002 blocked: launch administrator was not found")
        return None
    return PublicUser.model_validate(user)


async def _recover_expired_jobs(db_session, draft_id: str) -> int:
    """Release interrupted active jobs after their worker lease expires."""
    active_values = {state.value for state in ACTIVE_STATES}
    rows = (
        await db_session.execute(
            select(XPeXVideoJob).where(
                XPeXVideoJob.editorial_draft_id == draft_id,
                XPeXVideoJob.state.in_(active_values),
            )
        )
    ).scalars().all()
    recovered = 0
    now = _now()
    for row in rows:
        expires = _parse_datetime(row.lease_expires_at)
        if row.lease_id and expires is not None and expires > now:
            continue
        previous_state = row.state
        row.resume_state = row.resume_state or previous_state
        row.state = VideoJobState.FAILED.value
        row.lease_id = None
        row.lease_expires_at = None
        row.last_error = "Recovered after interrupted or expired launch worker lease"
        row.updated_at = now.isoformat()
        db_session.add(row)
        recovered += 1
    if recovered:
        await db_session.commit()
        logger.warning("XPEX-LAUNCH-002 recovered expired video jobs=%s", recovered)
    return recovered


async def _stage_native_course(
    record: XPeXEditorialDraft,
    actor: PublicUser,
    db_session,
) -> None:
    """Reconcile both textual activities and course to hidden staging on every restart."""
    if not record.native_course_uuid:
        return
    mapping = record.native_mapping or {}
    for chapter in mapping.get("chapters", []):
        for activity in chapter.get("activities", []):
            activity_uuid = activity.get("activity_uuid")
            if activity_uuid:
                await update_activity(
                    _request(),
                    ActivityUpdate(published=False),
                    activity_uuid,
                    actor,
                    db_session,
                )
    await update_course(
        _request(),
        CourseUpdate(public=False, published=False),
        record.native_course_uuid,
        actor,
        db_session,
    )
    logger.info("XPEX-LAUNCH-002 staging reconciled course=%s", record.native_course_uuid)


async def _process_one(job_id: str, actor: PublicUser, semaphore: asyncio.Semaphore) -> None:
    """Process one lesson in an isolated DB session so failures cannot poison siblings."""
    from src.core.events.database import _async_session_factory

    async with semaphore, _async_session_factory() as job_session:
        try:
            result = await process_video_job(job_id, actor, job_session)
            logger.info("XPEX-LAUNCH-002 video job=%s state=%s", job_id, result.state)
        except asyncio.CancelledError:
            await job_session.rollback()
            raise
        except Exception as exc:
            await job_session.rollback()
            logger.exception(
                "XPEX-LAUNCH-002 video job failed job=%s error=%s",
                job_id,
                type(exc).__name__,
            )


async def run_launch002_v2() -> None:
    if os.getenv("XPEX_LAUNCH002_ON_START", "").strip().lower() not in {"1", "true", "yes"}:
        return

    from src.core.events.database import _async_session_factory

    org_slug = os.getenv("XPEX_LAUNCH_ORG_SLUG", "default").strip() or "default"
    actor: PublicUser | None = None
    draft_id = LAUNCH_DRAFT_ID

    async with _async_session_factory() as db_session:
        org = (
            await db_session.execute(select(Organization).where(Organization.slug == org_slug))
        ).scalars().first()
        if not org or org.id is None:
            logger.error("XPEX-LAUNCH-002 blocked: launch organization was not found")
            return
        actor = await _resolve_actor(db_session)
        if actor is None:
            return

        record = (
            await db_session.execute(
                select(XPeXEditorialDraft).where(XPeXEditorialDraft.draft_id == draft_id)
            )
        ).scalars().first()

        if record is None:
            draft = build_launch002_course()
            now = _now_iso()
            record = XPeXEditorialDraft(
                draft_id=draft_id,
                org_id=int(org.id),
                created_by_user_id=actor.id,
                status="DRAFT",
                publication_state="IDLE",
                revision=1,
                content_hash=draft_content_hash(draft),
                topic=draft.title,
                audience=draft.audience,
                module_count=len(draft.modules),
                draft_json=draft.model_dump(mode="json"),
                generated_by="xpex-launch-002-curated",
                created_at=now,
                updated_at=now,
            )
            db_session.add(record)
            await db_session.commit()
            await db_session.refresh(record)
            logger.info("XPEX-LAUNCH-002 created curated editorial draft=%s", draft_id)

        if record.status == "DRAFT":
            await review_editorial_draft(
                draft_id,
                EditorialMutationRequest(expected_revision=record.revision),
                actor,
                db_session,
            )
            await db_session.refresh(record)
        if record.status == "REVIEWED":
            await approve_editorial_draft(
                draft_id,
                EditorialMutationRequest(expected_revision=record.revision),
                actor,
                db_session,
            )
            await db_session.refresh(record)
        if record.status == "APPROVED":
            await publish_editorial_draft(
                _request(),
                draft_id,
                EditorialMutationRequest(expected_revision=record.revision),
                actor,
                db_session,
            )
            await db_session.refresh(record)

        if record.status != "PUBLISHED" or not record.native_course_uuid:
            logger.error(
                "XPEX-LAUNCH-002 blocked before video production: editorial publication incomplete"
            )
            return

        await _stage_native_course(record, actor, db_session)
        await _recover_expired_jobs(db_session, draft_id)
        batch = await create_video_batch(draft_id, actor, db_session)
        logger.info("XPEX-LAUNCH-002 video batch=%s jobs=%s", batch.batch_id, len(batch.jobs))
        runnable = [
            job.job_id
            for job in batch.jobs
            if job.state in {VideoJobState.QUEUED.value, VideoJobState.FAILED.value}
            and job.attempt_count < 5
        ]

    semaphore = asyncio.Semaphore(2)
    await asyncio.gather(*(_process_one(job_id, actor, semaphore) for job_id in runnable))

    async with _async_session_factory() as db_session:
        refreshed = await create_video_batch(draft_id, actor, db_session)
        waiting = sum(
            job.state == VideoJobState.AWAITING_HUMAN_APPROVAL.value for job in refreshed.jobs
        )
        failed = sum(job.state == VideoJobState.FAILED.value for job in refreshed.jobs)
        logger.info(
            "XPEX-LAUNCH-002 checkpoint waiting_human=%s failed=%s total=%s",
            waiting,
            failed,
            len(refreshed.jobs),
        )


def start_launch002_v2() -> asyncio.Task | None:
    if os.getenv("XPEX_LAUNCH002_ON_START", "").strip().lower() not in {"1", "true", "yes"}:
        return None
    return asyncio.create_task(run_launch002_v2(), name="xpex-launch-002-v2")
