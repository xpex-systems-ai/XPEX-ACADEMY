"""Recover exactly the authorized real Wave 1 media canary to the human gate.

Mission XPEX-WAVE1-MEDIA-CANARY-RECOVERY-039 resumes the already-certified Wave 1 canary
row to the existing production XPeX video adapters.  It is resumable at durable
Wave 1 checkpoints, claims the sole canary before calling providers, validates
real media with ffprobe/ffmpeg, and never approves, attaches, or publishes.
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
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
from src.services.xpex.wave1_courses import CANARY_LESSON_KEY, WAVE_KEY

MISSION_ID = "XPEX-WAVE1-MEDIA-CANARY-RECOVERY-039"
AUTHORIZED_JOB_ID = "xpw1_a9b0b936e85b51dc846a3613372b3b46"
FINAL_STATE = "AWAITING_HUMAN_APPROVAL"
RESUMABLE_STATES = {"AVATAR_OR_VISUAL_RENDER", "COMPOSITION", "CAPTIONS", "MEDIA_QA"}


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


def _sha256_file(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


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
            "checksum_valid": False,
            "captions_checksum_valid": False,
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
        actual_checksum = _sha256_file(video_path)
        actual_captions_checksum = _sha256_file(caption_path)

    review_blocker = manifest.review is None or manifest.review.has_blocker
    return {
        "file_valid": file_valid,
        "audio_valid": audio_valid,
        "duration_valid": duration > 0 and video.duration_seconds > 0,
        "playback_valid": playback_valid,
        "captions_valid": captions_valid,
        "checksum_valid": actual_checksum == video.checksum_sha256,
        "captions_checksum_valid": actual_captions_checksum == caption.checksum_sha256,
        "review_blocker": review_blocker,
        "mime_type": video.mime_type,
        "duration_seconds": duration,
        "checksum_sha256": actual_checksum,
        "captions_checksum_sha256": actual_captions_checksum,
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
        and qa.get("checksum_valid")
        and qa.get("captions_checksum_valid")
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
            **(job.qa_json or {}),
            **qa,
            "execution_state": "COMPLETE" if status == FINAL_STATE else "RUNNING",
            "mission_id": MISSION_ID,
        }
    else:
        job.qa_json = {**(job.qa_json or {}), "execution_state": "RUNNING", "mission_id": MISSION_ID}
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
    attempts = int(qa.get("recovery_attempt_count", 0))
    artifact = dict(job.artifact_json or {})
    manifest = artifact.get("manifest")
    if job.status == "AVATAR_OR_VISUAL_RENDER":
        if not job.original_error or "VideoProviderError" not in job.original_error:
            raise RuntimeError("STOP: previous error is not the authorized VideoProviderError")
        if attempts >= 1:
            print(f"{MISSION_ID} BLOCKED job_id={job.job_id} retry_exhausted=true")
            return None
    elif artifact.get("mission_id") != MISSION_ID or not manifest:
        raise RuntimeError("STOP: downstream checkpoint lacks recovery-owned evidence")
    job.qa_json = {**qa, "execution_state": "CLAIMED", "mission_id": MISSION_ID}
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
            if not execute:
                print(f"{MISSION_ID} DRY_RUN job_id={job.job_id} status={job.status} no_provider_call=true")
                job.qa_json = {
                    **(job.qa_json or {}),
                    "execution_state": "DRY_RUN",
                    "recovery_attempt_count": 0,
                }
                session.add(job)
                await session.commit()
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
            missing = [
                name
                for name, value in required_models[job.status]
                if not value
            ]
            if job.status == "AVATAR_OR_VISUAL_RENDER" and registry.video_provider != "fal-ai":
                missing.append("XPEX_HF_VIDEO_PROVIDER=fal-ai")
            if missing:
                job.qa_json = {
                    **(job.qa_json or {}),
                    "execution_state": "CONFIGURATION_BLOCKED",
                    "failed_stage": job.status,
                    "error_class": "VideoProviderNotConfigured",
                    "safe_original_error_message": "canary configuration incomplete",
                    "provider": registry.video_provider,
                    "provider_model": registry.video_provider_model,
                    "video_model": registry.video_model,
                    "http_status": None,
                    "provider_request_id": None,
                    "sanitized_response": None,
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
                if stage == "AVATAR_OR_VISUAL_RENDER":
                    job.qa_json = {
                        **(job.qa_json or {}),
                        "execution_state": "RUNNING",
                        "recovery_attempt_count": int(
                            (job.qa_json or {}).get("recovery_attempt_count", 0)
                        )
                        + 1,
                    }
                    session.add(job)
                    await session.commit()
                    manifest = await handlers.rendering(manifest)
                    job.original_error = None
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
                        qa=qa,
                    )
                    print(
                        f"{MISSION_ID} PASS job_id={job.job_id} lesson_key={CANARY_LESSON_KEY} "
                        f"provider={job.provider} provider_job_id={job.provider_job_id or 'none'} "
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
