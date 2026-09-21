"""Render exactly one Course 001 video job to the human approval gate.

Guarded production canary for the first official XPeX Academy course. It processes
only lesson m01-l01 from batch xpvb-course001-ia-r1, persists durable artifacts,
runs multimodal review/captions, and stops at AWAITING_HUMAN_APPROVAL.

It never approves, attaches, publishes, enrolls, sends email, or performs payments.
"""

from __future__ import annotations

import argparse
import asyncio
import os

from config.config import get_learnhouse_config
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from src.db.organizations import Organization
from src.db.xpex_editorial import XPeXEditorialDraft
from src.db.xpex_video import XPeXVideoJob
from src.services.xpex.content_studio import CourseDraft
from src.services.xpex.video_factory import VideoJobState, VideoModelRegistry
from src.services.xpex.video_jobs import claim_job
from src.services.xpex.video_media import require_durable_media_storage
from src.services.xpex.video_pipeline import (
    VideoLessonSource,
    build_video_stage_handlers,
)
from src.services.xpex.video_worker import run_claimed_job

BATCH_ID = "xpvb-course001-ia-r1"
DRAFT_ID = "xped_course001_ia_video_v1"
LESSON_ID = "m01-l01"


def _to_async_url(url: str) -> str:
    if "+asyncpg" in url:
        return url
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


async def run(*, execute: bool) -> int:
    org_slug = os.getenv("XPEX_LAUNCH_ORG_SLUG", "kelle-digital-lab")
    config = get_learnhouse_config()
    sql_url = str(config.database_config.sql_connection_string)  # type: ignore[attr-defined]
    engine = create_async_engine(_to_async_url(sql_url), pool_pre_ping=True)
    try:
        async with AsyncSession(engine, expire_on_commit=False) as session:
            org = (
                await session.execute(select(Organization).where(Organization.slug == org_slug))
            ).scalars().one_or_none()
            if org is None or org.id is None:
                print("COURSE001_VIDEO_CANARY BLOCKED organization_not_found")
                return 2

            record = (
                await session.execute(
                    select(XPeXEditorialDraft).where(XPeXEditorialDraft.draft_id == DRAFT_ID)
                )
            ).scalars().one_or_none()
            if record is None or record.org_id != org.id:
                print("COURSE001_VIDEO_CANARY BLOCKED editorial_bridge_missing")
                return 3

            rows = list(
                (
                    await session.execute(
                        select(XPeXVideoJob).where(
                            XPeXVideoJob.org_id == org.id,
                            XPeXVideoJob.batch_id == BATCH_ID,
                            XPeXVideoJob.lesson_id == LESSON_ID,
                        )
                    )
                ).scalars().all()
            )
            if len(rows) != 1:
                print(f"COURSE001_VIDEO_CANARY BLOCKED job_match_count={len(rows)}")
                return 4

            row = rows[0]
            if row.state == VideoJobState.AWAITING_HUMAN_APPROVAL.value:
                print(
                    "COURSE001_VIDEO_CANARY PASS already_rendered=true "
                    "status=AWAITING_HUMAN_APPROVAL auto_approved=false auto_published=false"
                )
                return 0
            if row.state == VideoJobState.FAILED.value:
                print(
                    "COURSE001_VIDEO_CANARY RETRY_READY "
                    f"resume_state={row.resume_state or 'unknown'} "
                    f"attempt_count={row.attempt_count} "
                    f"last_error={row.last_error or 'unknown'}"
                )
            elif row.state != VideoJobState.QUEUED.value:
                print(f"COURSE001_VIDEO_CANARY BLOCKED state={row.state}")
                return 5

            draft = CourseDraft.model_validate(record.draft_json)
            lesson = draft.modules[0].lessons[0]
            registry = VideoModelRegistry.from_environment()

            missing = []
            if not os.getenv("HF_TOKEN", "").strip():
                missing.append("HF_TOKEN")
            if not registry.stt_model:
                missing.append("XPEX_HF_STT_MODEL")
            if not registry.multimodal_review_model:
                missing.append("XPEX_HF_MULTIMODAL_REVIEW_MODEL")
            try:
                require_durable_media_storage()
            except Exception:  # noqa: BLE001
                missing.append("durable media storage")

            if missing:
                print("COURSE001_VIDEO_CANARY BLOCKED missing=" + ",".join(missing))
                return 6

            if not execute:
                print(
                    "COURSE001_VIDEO_CANARY DRY_RUN ready=true provider_calls=0 "
                    "target=m01-l01"
                )
                return 0

            claimed = await claim_job(
                session,
                job_id=row.job_id,
                worker_id="course001-canary",
                org_id=int(org.id),
                lease_seconds=3600,
                max_attempts=12,
            )
            if claimed is None:
                print("COURSE001_VIDEO_CANARY BLOCKED claim_failed")
                return 7

            handlers = build_video_stage_handlers(
                VideoLessonSource(
                    batch_id=BATCH_ID,
                    lesson=lesson,
                    registry=registry,
                )
            )
            completed = await run_claimed_job(session, job=claimed, handlers=handlers)
            await session.refresh(completed)

            if completed.state != VideoJobState.AWAITING_HUMAN_APPROVAL.value:
                print(
                    "COURSE001_VIDEO_CANARY BLOCKED "
                    f"state={completed.state} "
                    f"resume_state={completed.resume_state or 'unknown'} "
                    f"attempt_count={completed.attempt_count} "
                    f"last_error={completed.last_error or 'unknown'}"
                )
                return 8

            manifest = completed.manifest_json or {}
            review = manifest.get("review") or {}
            notes = review.get("notes") or []
            blocker_count = sum(1 for note in notes if note.get("severity") == "BLOCKER")
            captions = manifest.get("captions") or []
            video_draft = manifest.get("video_draft")

            print(
                "COURSE001_VIDEO_CANARY PASS "
                "status=AWAITING_HUMAN_APPROVAL "
                f"video_present={bool(video_draft)} captions={len(captions)} "
                f"review_blockers={blocker_count} "
                "auto_approved=false auto_attached=false auto_published=false"
            )
            return 0
    finally:
        await engine.dispose()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--execute", action="store_true")
    args = parser.parse_args()
    return asyncio.run(run(execute=args.execute))


if __name__ == "__main__":
    raise SystemExit(main())
