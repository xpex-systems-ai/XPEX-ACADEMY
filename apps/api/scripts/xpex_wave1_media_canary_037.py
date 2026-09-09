"""Execute exactly one real Wave 1 media canary to the human approval gate.

Mission XPEX-WAVE1-MEDIA-CANARY-037 bridges the already-certified Wave 1 canary
row to the existing production XPeX video adapters. It is resumable at durable
Wave 1 checkpoints, claims the sole canary before calling providers, validates
real media with ffprobe/ffmpeg, and never approves, attaches, or publishes.

Recovery 038 permits exactly one continuation of the already-observed generic
VideoProviderError at AVATAR_OR_VISUAL_RENDER. It cannot create a second job and
persists the provider adapter's safe error message if the controlled retry fails.
"""

from __future__ import annotations

import argparse
import asyncio
import subprocess
import tempfile
from pathlib import Path
from typing import Any

from config.config import get_learnhouse_config
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from src.db.xpex_catalog import XPeXLesson, XPeXWaveMediaJob
from src.services.xpex.content_studio import LessonDraft
from src.services.xpex.video_factory import LessonVideoManifest, VideoModelRegistry
from src.services.xpex.video_media import (
    materialize_storage_key,
    probe_duration_seconds,
)
from src.services.xpex.video_pipeline import (
    VideoLessonSource,
    build_video_stage_handlers,
    manifest_evidence_hash,
)
from src.services.xpex.video_providers import (
    VideoProviderError,
    VideoProviderNotConfigured,
)
from src.services.xpex.wave1_courses import CANARY_LESSON_KEY, WAVE_KEY

MISSION_ID = "XPEX-WAVE1-MEDIA-CANARY-037"
RECOVERY_ID = "XPEX-WAVE1-MEDIA-CANARY-RECOVERY-038"
FINAL_STATE = "AWAITING_HUMAN_APPROVAL"
RECOVERABLE_ERROR = "VideoProviderError: stage execution failed"
RESUMABLE_STATES = (
    "SCRIPT_READY",
    "TTS_READY",
    "AVATAR_OR_VISUAL_RENDER",
    "COMPOSITION",
    "CAPTIONS",
    "MEDIA_QA",
)


def _to_async_url(url: str) -> str:
    if "+asyncpg" in url:
        return url
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


def _text(value: Any, fallback: str) -> str:
    rendered = " ".join(str(value or "").split()).strip()
    return rendered or fallback


def _lesson_draft(lesson: XPeXLesson) -> LessonDraft:
    exercise = lesson.exercise_json or {}
    practical = lesson.practical_activity_json or {}
    objective = _text(
        lesson.learning_objective,
        f"Compreender e aplicar com segurança o conteúdo da aula {lesson.title}.",
    )
    explanation = _text(
        lesson.lesson_script,
        f"Nesta aula, o estudante aprende {lesson.title} por meio de uma explicação guiada, "
        "uma demonstração verificável e uma aplicação prática responsável.",
    )
    practice = _text(
        practical.get("instructions"),
        f"Pratique {lesson.title} em um exemplo simples, registre as etapas executadas e revise o resultado.",
    )
    assessment = _text(
        exercise.get("prompt"),
        f"Explique como aplicaria {lesson.title} e indique critérios observáveis para validar o resultado.",
    )
    return LessonDraft(
        title=lesson.title,
        objective=objective,
        explanation=explanation,
        practice=practice,
        assessment=assessment,
        resource_suggestions=[],
    )


def _run_probe(command: list[str], *, timeout_seconds: int = 120) -> bool:
    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=False,
            timeout=timeout_seconds,
        )
    except (OSError, subprocess.TimeoutExpired):
        return False
    return result.returncode == 0


def _safe_error_detail(exc: Exception) -> str:
    if isinstance(exc, (VideoProviderError, VideoProviderNotConfigured)):
        return str(exc).strip() or "provider stage failed"
    return "stage execution failed"


async def _media_qa(manifest: LessonVideoManifest) -> dict[str, Any]:
    video = manifest.video_draft
    caption = manifest.captions[0] if manifest.captions else None
    if video is None or caption is None or manifest.narration is None:
        return {
            "file_valid": False,
            "audio_valid": False,
            "duration_valid": False,
            "playback_valid": False,
            "captions_valid": False,
            "review_blocker": True,
        }

    with tempfile.TemporaryDirectory(prefix="xpex-wave1-qa-") as directory:
        video_path = await asyncio.to_thread(
            materialize_storage_key,
            video.uri,
            str(Path(directory) / "canary.mp4"),
        )
        caption_path = await asyncio.to_thread(
            materialize_storage_key,
            caption.uri,
            str(Path(directory) / "captions.vtt"),
        )
        duration = await asyncio.to_thread(probe_duration_seconds, video_path)
        file_valid = Path(video_path).is_file() and Path(video_path).stat().st_size > 0
        audio_valid = await asyncio.to_thread(
            _run_probe,
            [
                "ffprobe",
                "-v",
                "error",
                "-select_streams",
                "a:0",
                "-show_entries",
                "stream=codec_type",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                video_path,
            ],
        )
        playback_valid = await asyncio.to_thread(
            _run_probe,
            ["ffmpeg", "-v", "error", "-i", video_path, "-f", "null", "-"],
            timeout_seconds=600,
        )
        captions_text = Path(caption_path).read_text(encoding="utf-8").strip()
        captions_valid = bool(captions_text.startswith("WEBVTT") and "-->" in captions_text)

    review_blocker = bool(manifest.review and manifest.review.has_blocker)
    return {
        "file_valid": file_valid,
        "audio_valid": audio_valid,
        "duration_valid": duration > 0 and video.duration_seconds > 0,
        "playback_valid": playback_valid,
        "captions_valid": captions_valid,
        "review_blocker": review_blocker,
        "mime_type": video.mime_type,
        "duration_seconds": duration,
        "checksum_sha256": video.checksum_sha256,
        "artifact_uri": video.uri,
        "captions_uri": caption.uri,
    }


def _qa_passed(qa: dict[str, Any]) -> bool:
    return bool(
        qa.get("file_valid")
        and qa.get("audio_valid")
        and qa.get("duration_valid")
        and qa.get("playback_valid")
        and qa.get("captions_valid")
        and not qa.get("review_blocker")
        and qa.get("mime_type") in {"video/mp4", "video/webm"}
        and qa.get("checksum_sha256")
        and qa.get("artifact_uri")
        and qa.get("captions_uri")
    )


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
    if qa is not None:
        job.qa_json = {
            **qa,
            "execution_state": "COMPLETE" if status == FINAL_STATE else "RUNNING",
            "mission_id": MISSION_ID,
        }
    else:
        job.qa_json = {
            **(job.qa_json or {}),
            "execution_state": "RUNNING",
            "mission_id": MISSION_ID,
        }
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

    jobs = (await session.execute(select(XPeXWaveMediaJob))).scalars().all()
    if len(jobs) != 1 or jobs[0].lesson_id != lesson.id:
        raise RuntimeError("STOP: mission requires exactly one Wave 1 canary job")
    job = jobs[0]
    if job.status == FINAL_STATE:
        return job, lesson
    if job.status not in RESUMABLE_STATES:
        raise RuntimeError(f"STOP: unsupported canary status {job.status}")

    qa = dict(job.qa_json or {})
    if job.original_error:
        recoverable = bool(
            job.status == "AVATAR_OR_VISUAL_RENDER"
            and job.original_error == RECOVERABLE_ERROR
            and qa.get("failed_stage") == "AVATAR_OR_VISUAL_RENDER"
            and qa.get("error_class") == "VideoProviderError"
            and not qa.get("recovery_attempt")
        )
        if not recoverable:
            print(
                f"{MISSION_ID} BLOCKED job_id={job.job_id} status={job.status} "
                "persistent_error=true"
            )
            return None
        job.original_error = None
        job.qa_json = {
            **qa,
            "execution_state": "RECOVERY_CLAIMED",
            "recovery_attempt": 1,
            "recovery_mission_id": RECOVERY_ID,
        }
        session.add(job)
        await session.commit()
        qa = dict(job.qa_json or {})
        print(
            f"{RECOVERY_ID} CLAIMED job_id={job.job_id} "
            "stage=AVATAR_OR_VISUAL_RENDER retry=1"
        )

    if qa.get("execution_state") == "RUNNING" and qa.get("mission_id") == MISSION_ID:
        print(f"{MISSION_ID} BLOCKED job_id={job.job_id} execution_already_claimed=true")
        return None
    job.qa_json = {
        **qa,
        "execution_state": "RUNNING",
        "mission_id": MISSION_ID,
    }
    session.add(job)
    await session.commit()
    return job, lesson


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
            if job.status == FINAL_STATE:
                print(
                    f"{MISSION_ID} PASS job_id={job.job_id} status={job.status} "
                    "idempotent=true auto_approved=false auto_published=false"
                )
                return 0
            if not execute:
                print(
                    f"{MISSION_ID} DRY_RUN job_id={job.job_id} status={job.status} "
                    "no_provider_call=true"
                )
                job.qa_json = {**(job.qa_json or {}), "execution_state": "DRY_RUN"}
                session.add(job)
                await session.commit()
                return 0

            registry = VideoModelRegistry.from_environment()
            missing = [
                name
                for name, value in (
                    ("XPEX_HF_VIDEO_MODEL", registry.video_model),
                    ("XPEX_HF_VIDEO_PROVIDER_MODEL", registry.video_provider_model),
                    ("XPEX_HF_IMAGE_MODEL", registry.image_model),
                    ("XPEX_HF_STT_MODEL", registry.stt_model),
                    ("XPEX_HF_MULTIMODAL_REVIEW_MODEL", registry.multimodal_review_model),
                )
                if not value
            ]
            if registry.video_provider != "fal-ai":
                missing.append("XPEX_HF_VIDEO_PROVIDER=fal-ai")
            if missing:
                job.original_error = "VideoProviderNotConfigured: canary configuration incomplete"
                job.qa_json = {
                    **(job.qa_json or {}),
                    "execution_state": "BLOCKED",
                    "missing": missing,
                }
                session.add(job)
                await session.commit()
                print(
                    f"{MISSION_ID} BLOCKED job_id={job.job_id} stage={job.status} "
                    f"missing={','.join(missing)}"
                )
                return 3

            source = VideoLessonSource(
                batch_id=WAVE_KEY,
                lesson=_lesson_draft(lesson),
                registry=registry,
            )
            handlers = build_video_stage_handlers(source)
            stored_manifest = (job.artifact_json or {}).get("manifest")
            manifest = (
                LessonVideoManifest.model_validate(stored_manifest)
                if stored_manifest
                else LessonVideoManifest(lesson_id=CANARY_LESSON_KEY)
            )
            stage = job.status
            try:
                if stage == "SCRIPT_READY":
                    manifest = await handlers.scripting(manifest)
                    manifest = await handlers.storyboarding(manifest)
                    manifest = await handlers.narrating(manifest)
                    await _checkpoint(
                        session,
                        job=job,
                        lesson=lesson,
                        manifest=manifest,
                        status="TTS_READY",
                    )
                    stage = "TTS_READY"
                    print(f"{MISSION_ID} CHECKPOINT status=TTS_READY tts=real")

                if stage == "TTS_READY":
                    manifest = await handlers.asset_generation(manifest)
                    await _checkpoint(
                        session,
                        job=job,
                        lesson=lesson,
                        manifest=manifest,
                        status="AVATAR_OR_VISUAL_RENDER",
                    )
                    stage = "AVATAR_OR_VISUAL_RENDER"
                    print(
                        f"{MISSION_ID} CHECKPOINT status=AVATAR_OR_VISUAL_RENDER "
                        "visual_mode=generated_image"
                    )

                if stage == "AVATAR_OR_VISUAL_RENDER":
                    manifest = await handlers.rendering(manifest)
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
                    qa_result = await _media_qa(manifest)
                    if not _qa_passed(qa_result):
                        job.qa_json = {
                            **qa_result,
                            "execution_state": "BLOCKED",
                            "mission_id": MISSION_ID,
                        }
                        job.original_error = "VideoMediaQAError: media QA failed"
                        session.add(job)
                        await session.commit()
                        print(
                            f"{MISSION_ID} BLOCKED job_id={job.job_id} stage=MEDIA_QA "
                            "qa_passed=false"
                        )
                        return 4
                    await _checkpoint(
                        session,
                        job=job,
                        lesson=lesson,
                        manifest=manifest,
                        status=FINAL_STATE,
                        qa=qa_result,
                    )
                    print(
                        f"{MISSION_ID} PASS job_id={job.job_id} lesson_key={CANARY_LESSON_KEY} "
                        f"provider={job.provider} provider_job_id={job.provider_job_id or 'none'} "
                        "status=AWAITING_HUMAN_APPROVAL rendered=true media_qa=true "
                        "auto_approved=false auto_published=false"
                    )
                    return 0
            except Exception as exc:  # noqa: BLE001
                detail = _safe_error_detail(exc)
                job.original_error = f"{type(exc).__name__}: {detail}"
                job.qa_json = {
                    **(job.qa_json or {}),
                    "execution_state": "BLOCKED",
                    "mission_id": MISSION_ID,
                    "failed_stage": stage,
                    "error_class": type(exc).__name__,
                    "error_detail": detail,
                }
                session.add(job)
                await session.commit()
                print(
                    f"{MISSION_ID} FAILED job_id={job.job_id} stage={stage} "
                    f"error_class={type(exc).__name__} error_detail={detail} status={job.status}"
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
