"""Rehydrate the single Wave 1 canary and execute exactly one real video-provider attempt.

Mission XPEX-WAVE1-MEDIA-CANARY-REHYDRATE-042 exists because production evidence proved
that recovery 039 failed before the Fal provider was submitted: the persisted narration
URI pointed at ephemeral container storage and `materialize_storage_key` raised
`VideoMediaError: media artifact is missing`. This runner regenerates only the missing
pre-provider narration from canonical lesson data, then consumes exactly one *real*
video-provider attempt and remains resumable after durable DB checkpoints. It never
approves, attaches, publishes, creates a second job, or changes credentials/secrets.
"""

from __future__ import annotations

import argparse
import asyncio
import tempfile
from pathlib import Path
from typing import Any

from config.config import get_learnhouse_config
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from src.db.xpex_catalog import XPeXLesson, XPeXWaveMediaJob
from src.services.xpex.video_factory import LessonVideoManifest, MediaRef, VideoModelRegistry
from src.services.xpex.video_media import (
    draft_artifact_key,
    materialize_storage_key,
    persist_local_or_s3,
)
from src.services.xpex.video_motion import compose_motion_lesson_video
from src.services.xpex.video_pipeline import (
    VideoLessonSource,
    _motion_prompt,
    build_video_stage_handlers,
    manifest_evidence_hash,
)
from src.services.xpex.video_providers import generate_video_clip
from src.services.xpex.wave1_courses import CANARY_LESSON_KEY, WAVE_KEY

from scripts.xpex_wave1_media_canary_recovery_038 import (
    _lesson_draft,
    _media_qa,
    _qa_passed,
    _to_async_url,
)

MISSION_ID = "XPEX-WAVE1-MEDIA-CANARY-REHYDRATE-042"
AUTHORIZED_JOB_ID = "xpw1_a9b0b936e85b51dc846a3613372b3b46"
FINAL_STATE = "AWAITING_HUMAN_APPROVAL"
RESUMABLE_STATES = {"AVATAR_OR_VISUAL_RENDER", "COMPOSITION", "CAPTIONS", "MEDIA_QA"}
PRE_PROVIDER_ERROR = "media artifact is missing"


def _extension(mime_type: str, fallback: str) -> str:
    return {
        "audio/wav": ".wav",
        "audio/mpeg": ".mp3",
        "video/mp4": ".mp4",
        "video/webm": ".webm",
    }.get(mime_type, fallback)


async def _checkpoint(
    session: AsyncSession,
    *,
    job: XPeXWaveMediaJob,
    lesson: XPeXLesson,
    manifest: LessonVideoManifest,
    status: str,
    qa: dict[str, Any] | None = None,
) -> None:
    artifact_json = dict(job.artifact_json or {})
    artifact_json.update(
        {
            "manifest": manifest.model_dump(mode="json"),
            "evidence_hash": manifest_evidence_hash(manifest),
            "mission_id": MISSION_ID,
        }
    )
    job.artifact_json = artifact_json
    job.status = status
    merged_qa = {
        **(job.qa_json or {}),
        "execution_state": "COMPLETE" if status == FINAL_STATE else "RUNNING",
        "mission_id": MISSION_ID,
    }
    if qa is not None:
        merged_qa.update(qa)
    job.qa_json = merged_qa

    media = dict(lesson.media_json or {})
    media.update({"video_job_id": job.job_id, "video_status": status})
    if manifest.video_draft is not None:
        media["video_draft"] = manifest.video_draft.model_dump(mode="json")
    if manifest.captions:
        media["captions"] = [item.model_dump(mode="json") for item in manifest.captions]
    lesson.media_json = media
    session.add(job)
    session.add(lesson)
    await session.commit()


async def _claim(session: AsyncSession) -> tuple[XPeXWaveMediaJob, XPeXLesson] | None:
    lesson = (
        await session.execute(select(XPeXLesson).where(XPeXLesson.lesson_key == CANARY_LESSON_KEY))
    ).scalars().first()
    if lesson is None:
        raise RuntimeError("STOP: Wave 1 canary lesson is missing")

    jobs = (await session.execute(select(XPeXWaveMediaJob).with_for_update())).scalars().all()
    if len(jobs) != 1:
        raise RuntimeError("STOP: mission requires exactly one Wave 1 canary job")
    job = jobs[0]
    if job.job_id != AUTHORIZED_JOB_ID or job.lesson_id != lesson.id:
        raise RuntimeError("STOP: authorized canary identity mismatch")
    if job.status not in RESUMABLE_STATES:
        raise RuntimeError(f"STOP: unsupported recovery checkpoint {job.status}")

    qa = dict(job.qa_json or {})
    artifact = dict(job.artifact_json or {})
    manifest = artifact.get("manifest")
    if job.status == "AVATAR_OR_VISUAL_RENDER":
        # Production diagnostic 041 proved the previous attempt never reached Fal:
        # VideoMediaError/media artifact is missing + provider_request_id=null.
        if qa.get("error_class") != "VideoMediaError":
            raise RuntimeError("STOP: current failure is not the certified pre-provider media error")
        if PRE_PROVIDER_ERROR not in str(qa.get("safe_original_error_message") or job.original_error or ""):
            raise RuntimeError("STOP: current failure does not match certified missing-media evidence")
        if qa.get("provider_request_id"):
            raise RuntimeError("STOP: provider request already exists; no additional provider attempt allowed")
        if int(qa.get("real_provider_attempt_count", 0)) >= 1:
            print(f"{MISSION_ID} BLOCKED job_id={job.job_id} real_provider_attempt_exhausted=true")
            return None
    elif artifact.get("mission_id") != MISSION_ID or not manifest:
        raise RuntimeError("STOP: downstream checkpoint lacks mission-owned evidence")

    job.qa_json = {
        **qa,
        "execution_state": "CLAIMED",
        "mission_id": MISSION_ID,
        "historical_recovery_attempt_count": int(qa.get("recovery_attempt_count", 0)),
    }
    session.add(job)
    await session.commit()
    return job, lesson


async def _rehydrate_narration(
    session: AsyncSession,
    *,
    job: XPeXWaveMediaJob,
    lesson: XPeXLesson,
    manifest: LessonVideoManifest,
    handlers: Any,
) -> LessonVideoManifest:
    if manifest.video_script is None or not manifest.storyboard or not manifest.assets:
        raise RuntimeError("STOP: canonical pre-provider manifest is incomplete")

    # Re-synthesize only narration. No Fal/video-provider function is called here.
    manifest = await handlers.narrating(manifest)
    job.original_error = None
    await _checkpoint(
        session,
        job=job,
        lesson=lesson,
        manifest=manifest,
        status="AVATAR_OR_VISUAL_RENDER",
        qa={
            "narration_rehydrated": True,
            "pre_provider_failure_reclassified": True,
            "real_provider_attempt_count": 0,
            "provider_request_id": None,
            "execution_state": "NARRATION_REHYDRATED",
        },
    )
    print(f"{MISSION_ID} CHECKPOINT narration_rehydrated=true provider_call=false")
    return manifest


async def _render_once(
    session: AsyncSession,
    *,
    job: XPeXWaveMediaJob,
    source: VideoLessonSource,
    manifest: LessonVideoManifest,
) -> LessonVideoManifest:
    if manifest.narration is None or not manifest.assets or not manifest.storyboard:
        raise RuntimeError("STOP: narration/storyboard/assets required before provider submit")
    registry = source.registry
    if not (
        registry.video_model
        and registry.video_provider_model
        and registry.video_provider == "fal-ai"
    ):
        raise RuntimeError("STOP: production Fal video configuration is incomplete")

    with tempfile.TemporaryDirectory(prefix="xpex-wave1-render-042-") as directory:
        narration_suffix = _extension(manifest.narration.mime_type, ".wav")
        narration_path = await asyncio.to_thread(
            materialize_storage_key,
            manifest.narration.uri,
            str(Path(directory) / f"narration{narration_suffix}"),
        )

        # Only now, after every local prerequisite has materialized successfully, consume
        # the single real provider attempt immediately before the Fal submit call.
        job.qa_json = {
            **(job.qa_json or {}),
            "execution_state": "PROVIDER_SUBMITTING",
            "mission_id": MISSION_ID,
            "real_provider_attempt_count": 1,
        }
        session.add(job)
        await session.commit()

        motion = await generate_video_clip(
            _motion_prompt(source, manifest),
            registry,
            duration_seconds=5,
        )
        motion_suffix = _extension(motion.mime_type, ".mp4")
        motion_path = Path(directory) / f"motion-source{motion_suffix}"
        motion_path.write_bytes(motion.data)
        if not motion_path.is_file() or motion_path.stat().st_size == 0:
            raise RuntimeError("STOP: provider returned an empty motion artifact")

        motion_key = draft_artifact_key(
            batch_id=WAVE_KEY,
            lesson_id=manifest.lesson_id,
            revision=manifest.revision,
            filename=motion_path.name,
        )
        stored_motion = await asyncio.to_thread(persist_local_or_s3, str(motion_path), motion_key)
        manifest.assets.append(
            MediaRef(
                uri=stored_motion.key,
                checksum_sha256=stored_motion.checksum_sha256,
                mime_type=stored_motion.mime_type,
            )
        )

        output_path = str(Path(directory) / "lesson-draft.mp4")
        rendered = await asyncio.to_thread(
            compose_motion_lesson_video,
            clip_path=str(motion_path),
            narration_path=narration_path,
            output_path=output_path,
        )
        video_key = draft_artifact_key(
            batch_id=WAVE_KEY,
            lesson_id=manifest.lesson_id,
            revision=manifest.revision,
            filename="lesson-draft.mp4",
        )
        stored_video = await asyncio.to_thread(persist_local_or_s3, rendered.uri, video_key)
        rendered.uri = stored_video.key
        rendered.checksum_sha256 = stored_video.checksum_sha256
        manifest.video_draft = rendered
    return manifest


async def run(*, execute: bool) -> int:
    config = get_learnhouse_config()
    sql_url = str(config.database_config.sql_connection_string)  # type: ignore[attr-defined]
    engine = create_async_engine(_to_async_url(sql_url), pool_pre_ping=True)
    try:
        async with AsyncSession(engine, expire_on_commit=False) as session:
            claimed = await _claim(session)
            if claimed is None:
                return 2
            job, lesson = claimed
            if not execute:
                print(f"{MISSION_ID} DRY_RUN job_id={job.job_id} status={job.status} provider_call=false")
                return 0

            registry = VideoModelRegistry.from_environment()
            required_models = {
                "AVATAR_OR_VISUAL_RENDER": (
                    ("XPEX_HF_VIDEO_MODEL", registry.video_model),
                    ("XPEX_HF_VIDEO_PROVIDER_MODEL", registry.video_provider_model),
                ),
                "COMPOSITION": (
                    ("XPEX_HF_STT_MODEL", registry.stt_model),
                    ("XPEX_HF_MULTIMODAL_REVIEW_MODEL", registry.multimodal_review_model),
                ),
                "CAPTIONS": (),
                "MEDIA_QA": (),
            }
            missing = [name for name, value in required_models[job.status] if not value]
            if job.status == "AVATAR_OR_VISUAL_RENDER" and registry.video_provider != "fal-ai":
                missing.append("XPEX_HF_VIDEO_PROVIDER=fal-ai")
            if missing:
                job.qa_json = {
                    **(job.qa_json or {}),
                    "execution_state": "CONFIGURATION_BLOCKED",
                    "failed_stage": job.status,
                    "error_class": "VideoProviderNotConfigured",
                    "safe_original_error_message": "canary configuration incomplete",
                    "missing": missing,
                    "real_provider_attempt_count": 0,
                }
                session.add(job)
                await session.commit()
                print(f"{MISSION_ID} BLOCKED missing={','.join(missing)} provider_call=false")
                return 3

            source = VideoLessonSource(
                batch_id=WAVE_KEY,
                lesson=_lesson_draft(lesson),
                registry=registry,
            )
            handlers = build_video_stage_handlers(source)
            stored_manifest = (job.artifact_json or {}).get("manifest")
            if not stored_manifest:
                raise RuntimeError("STOP: certified canary manifest is missing")
            manifest = LessonVideoManifest.model_validate(stored_manifest)
            stage = job.status

            try:
                if stage == "AVATAR_OR_VISUAL_RENDER":
                    manifest = await _rehydrate_narration(
                        session,
                        job=job,
                        lesson=lesson,
                        manifest=manifest,
                        handlers=handlers,
                    )
                    manifest = await _render_once(
                        session,
                        job=job,
                        source=source,
                        manifest=manifest,
                    )
                    await _checkpoint(
                        session,
                        job=job,
                        lesson=lesson,
                        manifest=manifest,
                        status="COMPOSITION",
                    )
                    stage = "COMPOSITION"
                    print(f"{MISSION_ID} CHECKPOINT status=COMPOSITION rendered=true")

                if stage == "COMPOSITION":
                    manifest = await handlers.reviewing(manifest)
                    await _checkpoint(
                        session,
                        job=job,
                        lesson=lesson,
                        manifest=manifest,
                        status="CAPTIONS",
                    )
                    stage = "CAPTIONS"
                    print(f"{MISSION_ID} CHECKPOINT status=CAPTIONS captions=true")

                if stage == "CAPTIONS":
                    await _checkpoint(
                        session,
                        job=job,
                        lesson=lesson,
                        manifest=manifest,
                        status="MEDIA_QA",
                    )
                    stage = "MEDIA_QA"

                if stage == "MEDIA_QA":
                    qa = await _media_qa(manifest)
                    if not _qa_passed(qa):
                        job.qa_json = {
                            **(job.qa_json or {}),
                            **qa,
                            "execution_state": "BLOCKED",
                            "mission_id": MISSION_ID,
                        }
                        job.original_error = "VideoMediaQAError: media QA failed"
                        session.add(job)
                        await session.commit()
                        print(f"{MISSION_ID} BLOCKED stage=MEDIA_QA qa_passed=false")
                        return 4
                    await _checkpoint(
                        session,
                        job=job,
                        lesson=lesson,
                        manifest=manifest,
                        status=FINAL_STATE,
                        qa=qa,
                    )
                    print(
                        f"{MISSION_ID} PASS job_id={job.job_id} lesson_key={CANARY_LESSON_KEY} "
                        "status=AWAITING_HUMAN_APPROVAL rendered=true media_qa=true "
                        "auto_approved=false auto_published=false"
                    )
                    return 0
            except Exception as exc:  # noqa: BLE001
                safe_error = " ".join(str(exc).split())[:2000]
                job.original_error = f"{type(exc).__name__}: {safe_error}"
                job.qa_json = {
                    **(job.qa_json or {}),
                    "execution_state": "BLOCKED",
                    "mission_id": MISSION_ID,
                    "failed_stage": stage,
                    "error_class": type(exc).__name__,
                    "safe_original_error_message": safe_error,
                    "provider": registry.video_provider,
                    "provider_model": registry.video_provider_model,
                    "video_model": registry.video_model,
                    "http_status": getattr(exc, "http_status", None),
                    "provider_request_id": getattr(exc, "request_id", None),
                    "queue_state": getattr(exc, "queue_state", None),
                    "submit_endpoint_category": getattr(exc, "endpoint_category", None),
                    "sanitized_response": getattr(exc, "sanitized_response", None),
                }
                session.add(job)
                await session.commit()
                print(
                    f"{MISSION_ID} FAILED job_id={job.job_id} stage={stage} "
                    f"error_class={type(exc).__name__} status={job.status}"
                )
                return 5

            raise RuntimeError(f"STOP: canary execution ended in unexpected stage {stage}")
    finally:
        await engine.dispose()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--execute", action="store_true")
    args = parser.parse_args()
    return asyncio.run(run(execute=args.execute))


if __name__ == "__main__":
    raise SystemExit(main())
