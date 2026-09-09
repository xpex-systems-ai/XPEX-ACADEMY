"""Read-only production diagnostic for the single authorized Wave 1 media canary.

Mission XPEX-WAVE1-MEDIA-CANARY-DIAGNOSTIC-041 never calls providers and never mutates
state. It exposes only a bounded, redacted subset of the already-persisted recovery
evidence so operators can diagnose a consumed canary retry safely.
"""

from __future__ import annotations

import asyncio
import json
import re
from typing import Any

from config.config import get_learnhouse_config
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from src.db.xpex_catalog import XPeXLesson, XPeXWaveMediaJob
from src.services.xpex.wave1_courses import CANARY_LESSON_KEY

MISSION_ID = "XPEX-WAVE1-MEDIA-CANARY-DIAGNOSTIC-041"
AUTHORIZED_JOB_ID = "xpw1_a9b0b936e85b51dc846a3613372b3b46"
_SECRET_KEY = re.compile(r"(?i)(authorization|hf_token|token|cookie|password|secret|credential)")
_HF_TOKEN_VALUE = re.compile(r"(?i)\bhf_[a-z0-9_-]+\b")
_BEARER_VALUE = re.compile(r"(?i)\bbearer\s+[^\s,;}]+")
_AUTH_LINE = re.compile(r"(?im)(authorization\s*[:=]\s*)[^\r\n]+")


def _to_async_url(url: str) -> str:
    if "+asyncpg" in url:
        return url
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


def _redact(value: Any) -> Any:
    if isinstance(value, dict):
        return {
            str(key): "[REDACTED]" if _SECRET_KEY.search(str(key)) else _redact(item)
            for key, item in value.items()
        }
    if isinstance(value, list):
        return [_redact(item) for item in value]
    if isinstance(value, str):
        text = value[:4000]
        text = _AUTH_LINE.sub(r"\1[REDACTED]", text)
        text = _BEARER_VALUE.sub("Bearer [REDACTED]", text)
        return _HF_TOKEN_VALUE.sub("[REDACTED]", text)
    return value


async def run() -> int:
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
            if lesson is None:
                print(f"{MISSION_ID} BLOCKED reason=canary_lesson_missing")
                return 2

            jobs = (await session.execute(select(XPeXWaveMediaJob))).scalars().all()
            if len(jobs) != 1:
                print(f"{MISSION_ID} BLOCKED reason=canary_job_count count={len(jobs)}")
                return 3
            job = jobs[0]
            if job.job_id != AUTHORIZED_JOB_ID or job.lesson_id != lesson.id:
                print(f"{MISSION_ID} BLOCKED reason=canary_identity_mismatch")
                return 4

            qa = dict(job.qa_json or {})
            artifact = dict(job.artifact_json or {})
            manifest = artifact.get("manifest") if isinstance(artifact.get("manifest"), dict) else {}
            diagnostics = {
                "mission_id": MISSION_ID,
                "read_only": True,
                "provider_call": False,
                "job_id": job.job_id,
                "lesson_key": lesson.lesson_key,
                "status": job.status,
                "original_error": job.original_error,
                "recovery_attempt_count": qa.get("recovery_attempt_count"),
                "execution_state": qa.get("execution_state"),
                "failed_stage": qa.get("failed_stage"),
                "error_class": qa.get("error_class"),
                "safe_original_error_message": qa.get("safe_original_error_message"),
                "provider": qa.get("provider") or job.provider,
                "provider_model": qa.get("provider_model"),
                "video_model": qa.get("video_model"),
                "http_status": qa.get("http_status"),
                "provider_request_id": qa.get("provider_request_id"),
                "queue_state": qa.get("queue_state"),
                "endpoint_category": qa.get("submit_endpoint_category"),
                "sanitized_response": qa.get("sanitized_response"),
                "artifact_mission_id": artifact.get("mission_id"),
                "manifest_present": bool(manifest),
                "video_draft_present": bool(manifest.get("video_draft")) if manifest else False,
                "captions_count": len(manifest.get("captions") or []) if manifest else 0,
                "auto_approved": False,
                "auto_published": False,
            }
            safe = _redact(diagnostics)
            print(f"{MISSION_ID} EVIDENCE {json.dumps(safe, ensure_ascii=False, sort_keys=True)}")
            return 0
    finally:
        await engine.dispose()


if __name__ == "__main__":
    raise SystemExit(asyncio.run(run()))
