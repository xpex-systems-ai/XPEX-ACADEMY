"""Safely re-arm the same Wave 1 canary after a rejected Fal model mapping.

Mission XPEX-WAVE1-PROVIDER-RECOVERY-051 permits exactly one replacement submit
for the already-authorized canary only when persisted evidence proves the prior
request was rejected before a provider render job was accepted. It never creates
a canary, changes lesson content, approves, attaches, publishes, or touches learner
state/payments.
"""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from typing import Any

from config.config import get_learnhouse_config
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from src.db.xpex_catalog import XPeXLesson, XPeXWaveMediaJob
from src.services.xpex.video_factory import VideoModelRegistry
from src.services.xpex.wave1_courses import CANARY_LESSON_KEY

MISSION_ID = "XPEX-WAVE1-PROVIDER-RECOVERY-051"
AUTHORIZED_JOB_ID = "xpw1_a9b0b936e85b51dc846a3613372b3b46"
AUTHORIZED_STAGE = "AVATAR_OR_VISUAL_RENDER"
EXPECTED_PROVIDER = "fal-ai"
EXPECTED_VIDEO_MODEL = "Wan-AI/Wan2.2-TI2V-5B"
EXPECTED_OLD_PROVIDER_MODEL = "fal-ai/wan/v2.2-5b/text-to-video"
EXPECTED_NEW_PROVIDER_MODEL = "Wan-AI/Wan2.2-TI2V-5B"
EXPECTED_ERROR_FRAGMENT = "Model not supported by provider fal-ai"


def _to_async_url(url: str) -> str:
    if "+asyncpg" in url:
        return url
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


def _text(value: Any) -> str:
    return " ".join(str(value or "").split()).strip()


async def run(*, execute: bool) -> int:
    config = get_learnhouse_config()
    sql_url = str(config.database_config.sql_connection_string)  # type: ignore[attr-defined]
    engine = create_async_engine(_to_async_url(sql_url), pool_pre_ping=True)
    try:
        async with AsyncSession(engine, expire_on_commit=False) as session:
            lesson = (
                await session.execute(
                    select(XPeXLesson).where(XPeXLesson.lesson_key == CANARY_LESSON_KEY)
                )
            ).scalars().first()
            jobs = (
                await session.execute(select(XPeXWaveMediaJob).with_for_update())
            ).scalars().all()

            if lesson is None or len(jobs) != 1:
                print(f"{MISSION_ID} BLOCKED identity_precondition=false")
                return 2

            job = jobs[0]
            if job.job_id != AUTHORIZED_JOB_ID or job.lesson_id != lesson.id:
                print(f"{MISSION_ID} BLOCKED authorized_canary_identity=false")
                return 3

            qa = dict(job.qa_json or {})
            artifact = dict(job.artifact_json or {})
            manifest = artifact.get("manifest") if isinstance(artifact.get("manifest"), dict) else {}
            persisted_response = _text(qa.get("sanitized_response"))
            persisted_error = _text(qa.get("safe_original_error_message"))
            registry = VideoModelRegistry.from_environment()

            if qa.get("provider_recovery_051_used"):
                print(
                    f"{MISSION_ID} NOOP job_id={job.job_id} "
                    "replacement_already_authorized=true"
                )
                return 0

            checks = {
                "status": job.status == AUTHORIZED_STAGE,
                "provider": (qa.get("provider") or job.provider) == EXPECTED_PROVIDER,
                "error_class": qa.get("error_class") == "VideoProviderError",
                "http_400": qa.get("http_status") == 400,
                "submit_endpoint": qa.get("submit_endpoint_category") == "submit",
                "unsupported_model_error": (
                    EXPECTED_ERROR_FRAGMENT in persisted_response
                    or EXPECTED_ERROR_FRAGMENT in persisted_error
                ),
                "provider_job_absent": not job.provider_job_id,
                "video_draft_absent": not bool(manifest.get("video_draft")),
                "submission_count_one": int(qa.get("provider_submission_count", -1)) == 1,
                "old_provider_model": qa.get("provider_model") == EXPECTED_OLD_PROVIDER_MODEL,
                "runtime_provider": registry.video_provider == EXPECTED_PROVIDER,
                "runtime_video_model": registry.video_model == EXPECTED_VIDEO_MODEL,
                "runtime_provider_model": registry.video_provider_model == EXPECTED_NEW_PROVIDER_MODEL,
            }
            failed = [name for name, ok in checks.items() if not ok]
            if failed:
                print(
                    f"{MISSION_ID} BLOCKED job_id={job.job_id} "
                    f"failed_checks={','.join(failed)}"
                )
                return 4

            if not execute:
                print(
                    f"{MISSION_ID} DRY_RUN job_id={job.job_id} "
                    "replacement_submit_eligible=true no_provider_call=true"
                )
                return 0

            # Mark the one-time recovery as consumed before Mission 043 is allowed
            # to submit again. If that corrected attempt fails, future starts remain
            # fail-closed and cannot silently re-arm another provider request.
            job.qa_json = {
                **qa,
                "provider_recovery_051_used": True,
                "provider_recovery_051_at": datetime.now(UTC).isoformat(),
                "provider_recovery_051_reason": "prior submit rejected unsupported provider model before provider job acceptance",
                "provider_recovery_051_old_model": EXPECTED_OLD_PROVIDER_MODEL,
                "provider_recovery_051_new_model": EXPECTED_NEW_PROVIDER_MODEL,
                "provider_submission_count": 0,
                "provider_request_id": None,
                "provider_call": False,
                "execution_state": "PROVIDER_RECOVERY_ARMED",
                "failed_stage": None,
                "error_class": None,
                "safe_original_error_message": None,
                "http_status": None,
                "queue_state": None,
                "submit_endpoint_category": None,
                "sanitized_response": None,
            }
            job.original_error = None
            session.add(job)
            await session.commit()
            print(
                f"{MISSION_ID} PASS job_id={job.job_id} lesson_key={CANARY_LESSON_KEY} "
                "same_canary=true replacement_submit_armed=true provider_job_id=none "
                "auto_approved=false auto_attached=false auto_published=false"
            )
            return 0
    finally:
        await engine.dispose()


if __name__ == "__main__":
    raise SystemExit(asyncio.run(run(execute=True)))
