"""Admin-facing orchestration for the XPeX AI Video Lesson Factory.

This service is the human-control plane around the resumable worker primitives. It
creates/list jobs, lets an authorized operator run one selected lesson, and keeps the
three irreversible boundaries explicit: human approve -> unpublished native attach ->
separate human publish.
"""

from __future__ import annotations

import tempfile
from datetime import UTC, datetime
from pathlib import Path

from fastapi import HTTPException, Request, status
from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from src.db.courses.activities import ActivityUpdate
from src.db.organizations import Organization
from src.db.users import PublicUser
from src.db.xpex_editorial import XPeXEditorialDraft
from src.db.xpex_video import XPeXVideoJob
from src.services.courses.activities.activities import (
    create_activity,
    delete_activity,
    update_activity,
)
from src.services.courses.locks import is_org_admin
from src.services.xpex.content_studio import CourseDraft, LessonDraft
from src.services.xpex.video_attachment import HostedVideoAttachment
from src.services.xpex.video_factory import (
    LessonVideoManifest,
    VideoBatchPlan,
    VideoJobState,
    VideoModelRegistry,
)
from src.services.xpex.video_jobs import (
    claim_job,
    ensure_batch_jobs,
    save_human_transition,
)
from src.services.xpex.video_media import (
    activity_artifact_key,
    materialize_storage_key,
    persist_local_or_s3,
)
from src.services.xpex.video_pipeline import (
    VideoLessonSource,
    build_video_stage_handlers,
)
from src.services.xpex.video_worker import run_claimed_job


class VideoJobResponse(BaseModel):
    job_id: str
    batch_id: str
    lesson_id: str
    lesson_title: str
    state: str
    revision: int
    attempt_count: int
    last_error: str | None
    native_course_uuid: str | None
    native_activity_uuid: str | None
    manifest: LessonVideoManifest


class VideoBatchResponse(BaseModel):
    draft_id: str
    batch_id: str
    target_lessons: int
    jobs: list[VideoJobResponse]


def _now() -> str:
    return datetime.now(UTC).isoformat()


def _lesson_id(module_index: int, lesson_index: int) -> str:
    return f"m{module_index + 1:02d}-l{lesson_index + 1:02d}"


def _parse_lesson_id(value: str) -> tuple[int, int]:
    try:
        module_part, lesson_part = value.split("-", 1)
        module_index = int(module_part.removeprefix("m")) - 1
        lesson_index = int(lesson_part.removeprefix("l")) - 1
    except (ValueError, AttributeError):
        raise HTTPException(status_code=409, detail="Video job lesson mapping is invalid") from None
    if module_index < 0 or lesson_index < 0:
        raise HTTPException(status_code=409, detail="Video job lesson mapping is invalid")
    return module_index, lesson_index


def _course_lessons(draft: CourseDraft) -> list[tuple[str, str, LessonDraft]]:
    lessons: list[tuple[str, str, LessonDraft]] = []
    for module_index, module in enumerate(draft.modules):
        for lesson_index, lesson in enumerate(module.lessons):
            lessons.append((_lesson_id(module_index, lesson_index), lesson.title, lesson))
    return lessons[:24]


def _resolve_lesson(draft: CourseDraft, lesson_id: str) -> tuple[LessonDraft, int, int]:
    module_index, lesson_index = _parse_lesson_id(lesson_id)
    try:
        lesson = draft.modules[module_index].lessons[lesson_index]
    except IndexError:
        raise HTTPException(status_code=409, detail="Video job lesson no longer exists") from None
    return lesson, module_index, lesson_index


async def _draft_for_actor(
    draft_id: str,
    current_user: PublicUser,
    db_session: AsyncSession,
) -> tuple[XPeXEditorialDraft, Organization]:
    record = (
        await db_session.execute(select(XPeXEditorialDraft).where(XPeXEditorialDraft.draft_id == draft_id))
    ).scalars().first()
    if not record:
        raise HTTPException(status_code=404, detail="Editorial draft not found")
    org = (
        await db_session.execute(select(Organization).where(Organization.id == record.org_id))
    ).scalars().first()
    if not org or org.id is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    if not await is_org_admin(current_user.id, org.id, db_session):
        raise HTTPException(status_code=403, detail="Video Studio requires organization admin access")
    return record, org


async def _job_for_actor(
    job_id: str,
    current_user: PublicUser,
    db_session: AsyncSession,
    *,
    for_update: bool = False,
) -> tuple[XPeXVideoJob, Organization]:
    statement = select(XPeXVideoJob).where(XPeXVideoJob.job_id == job_id)
    if for_update:
        statement = statement.with_for_update()
    row = (await db_session.execute(statement)).scalars().first()
    if not row:
        raise HTTPException(status_code=404, detail="Video job not found")
    org = (
        await db_session.execute(select(Organization).where(Organization.id == row.org_id))
    ).scalars().first()
    if not org or org.id is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    if not await is_org_admin(current_user.id, org.id, db_session):
        raise HTTPException(status_code=403, detail="Video job is outside your authorized organization")
    return row, org


async def _response(
    row: XPeXVideoJob,
    db_session: AsyncSession,
) -> VideoJobResponse:
    title = row.lesson_id
    if row.editorial_draft_id:
        record = (
            await db_session.execute(
                select(XPeXEditorialDraft).where(XPeXEditorialDraft.draft_id == row.editorial_draft_id)
            )
        ).scalars().first()
        if record:
            draft = CourseDraft.model_validate(record.draft_json)
            try:
                lesson, _, _ = _resolve_lesson(draft, row.lesson_id)
                title = lesson.title
            except HTTPException:
                pass
    return VideoJobResponse(
        job_id=row.job_id,
        batch_id=row.batch_id,
        lesson_id=row.lesson_id,
        lesson_title=title,
        state=row.state,
        revision=row.revision,
        attempt_count=row.attempt_count,
        last_error=row.last_error,
        native_course_uuid=row.native_course_uuid,
        native_activity_uuid=row.native_activity_uuid,
        manifest=LessonVideoManifest.model_validate(row.manifest_json),
    )


async def create_video_batch(
    draft_id: str,
    current_user: PublicUser,
    db_session: AsyncSession,
) -> VideoBatchResponse:
    record, org = await _draft_for_actor(draft_id, current_user, db_session)
    if record.status != "PUBLISHED" or not record.native_course_uuid or not record.native_mapping:
        raise HTTPException(
            status_code=409,
            detail="Publish the approved editorial course before creating its video batch",
        )
    draft = CourseDraft.model_validate(record.draft_json)
    lessons = _course_lessons(draft)
    if not lessons:
        raise HTTPException(status_code=409, detail="Editorial course contains no lessons")
    batch_id = f"xpvb-{record.draft_id[:55]}-r{record.revision}"
    plan = VideoBatchPlan(
        course_id=batch_id,
        lesson_ids=[lesson_id for lesson_id, _, _ in lessons],
        concurrency=3,
    )
    rows = await ensure_batch_jobs(
        db_session,
        plan=plan,
        org_id=int(org.id),
        created_by_user_id=current_user.id,
        editorial_draft_id=record.draft_id,
        native_course_uuid=record.native_course_uuid,
    )
    return VideoBatchResponse(
        draft_id=record.draft_id,
        batch_id=batch_id,
        target_lessons=len(rows),
        jobs=[await _response(row, db_session) for row in rows],
    )


async def list_video_jobs(
    draft_id: str,
    current_user: PublicUser,
    db_session: AsyncSession,
) -> list[VideoJobResponse]:
    record, org = await _draft_for_actor(draft_id, current_user, db_session)
    rows = (
        await db_session.execute(
            select(XPeXVideoJob)
            .where(
                XPeXVideoJob.editorial_draft_id == record.draft_id,
                XPeXVideoJob.org_id == org.id,
            )
            .order_by(XPeXVideoJob.id.asc())
        )
    ).scalars().all()
    return [await _response(row, db_session) for row in rows]


def _require_mvp_registry(registry: VideoModelRegistry) -> None:
    missing: list[str] = []
    if not registry.image_model:
        missing.append("XPEX_HF_IMAGE_MODEL")
    if not registry.stt_model:
        missing.append("XPEX_HF_STT_MODEL")
    if not registry.multimodal_review_model:
        missing.append("XPEX_HF_MULTIMODAL_REVIEW_MODEL")
    if missing:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Video provider configuration missing: {', '.join(missing)}",
        )


async def process_video_job(
    job_id: str,
    current_user: PublicUser,
    db_session: AsyncSession,
) -> VideoJobResponse:
    row, org = await _job_for_actor(job_id, current_user, db_session)
    if row.state == VideoJobState.AWAITING_HUMAN_APPROVAL.value:
        return await _response(row, db_session)
    if row.state not in {VideoJobState.QUEUED.value, VideoJobState.FAILED.value}:
        raise HTTPException(status_code=409, detail=f"Video job cannot run from state {row.state}")
    if not row.editorial_draft_id:
        raise HTTPException(status_code=409, detail="Video job has no editorial source")
    record, _ = await _draft_for_actor(row.editorial_draft_id, current_user, db_session)
    draft = CourseDraft.model_validate(record.draft_json)
    lesson, _, _ = _resolve_lesson(draft, row.lesson_id)
    registry = VideoModelRegistry.from_environment()
    _require_mvp_registry(registry)

    claimed = await claim_job(
        db_session,
        job_id=row.job_id,
        worker_id=f"interactive:{current_user.id}",
        org_id=int(org.id),
        lease_seconds=3600,
    )
    if claimed is None:
        raise HTTPException(status_code=409, detail="Video job is already running or exhausted retries")
    handlers = build_video_stage_handlers(
        VideoLessonSource(
            batch_id=claimed.batch_id,
            lesson=lesson,
            registry=registry,
        )
    )
    completed = await run_claimed_job(db_session, job=claimed, handlers=handlers)
    return await _response(completed, db_session)


async def approve_video_job(
    job_id: str,
    current_user: PublicUser,
    db_session: AsyncSession,
) -> VideoJobResponse:
    row, _ = await _job_for_actor(job_id, current_user, db_session, for_update=True)
    manifest = LessonVideoManifest.model_validate(row.manifest_json)
    try:
        manifest.approve(current_user.id)
    except ValueError as exc:
        await db_session.rollback()
        raise HTTPException(status_code=409, detail=str(exc)) from None
    saved = await save_human_transition(
        db_session,
        row=row,
        manifest=manifest,
        actor_user_id=current_user.id,
    )
    return await _response(saved, db_session)


def _chapter_id_for_lesson(record: XPeXEditorialDraft, lesson_id: str) -> int:
    _, module_index, _ = _resolve_lesson(CourseDraft.model_validate(record.draft_json), lesson_id)
    mapping = record.native_mapping or {}
    try:
        chapter_id = int(mapping["chapters"][module_index]["chapter_id"])
    except (KeyError, IndexError, TypeError, ValueError):
        raise HTTPException(status_code=409, detail="Native chapter mapping is incomplete") from None
    if chapter_id <= 0:
        raise HTTPException(status_code=409, detail="Native chapter mapping is invalid")
    return chapter_id


async def attach_video_job(
    request: Request,
    job_id: str,
    current_user: PublicUser,
    db_session: AsyncSession,
) -> VideoJobResponse:
    row, org = await _job_for_actor(job_id, current_user, db_session, for_update=True)
    manifest = LessonVideoManifest.model_validate(row.manifest_json)
    if manifest.state in {VideoJobState.ATTACHED, VideoJobState.PUBLISHED} and row.native_activity_uuid:
        await db_session.rollback()
        return await _response(row, db_session)
    if manifest.state != VideoJobState.APPROVED or manifest.video_draft is None:
        await db_session.rollback()
        raise HTTPException(status_code=409, detail="Human approval is required before attachment")
    if not row.editorial_draft_id or not row.native_course_uuid:
        await db_session.rollback()
        raise HTTPException(status_code=409, detail="Video job lacks native course mapping")
    record, _ = await _draft_for_actor(row.editorial_draft_id, current_user, db_session)
    lesson, _, _ = _resolve_lesson(CourseDraft.model_validate(record.draft_json), row.lesson_id)
    chapter_id = _chapter_id_for_lesson(record, row.lesson_id)
    filename = f"xpex-{row.lesson_id}-r{manifest.revision}.mp4"
    caption_filename = f"xpex-{row.lesson_id}-r{manifest.revision}.pt-BR.vtt"

    activity = await create_activity(
        request,
        HostedVideoAttachment(
            chapter_id=chapter_id,
            name=f"Vídeo — {lesson.title}",
            filename=filename,
            extra_metadata={
                "xpex_video_job_id": row.job_id,
                "xpex_video_revision": manifest.revision,
                "xpex_video_content_hash": manifest.content_hash(),
                "xpex_caption_filename": caption_filename if manifest.captions else None,
            },
        ).to_unpublished_activity(),
        current_user,
        db_session,
    )

    try:
        with tempfile.TemporaryDirectory(prefix="xpex-native-video-") as directory:
            video_local = materialize_storage_key(
                manifest.video_draft.uri,
                str(Path(directory) / filename),
            )
            persist_local_or_s3(
                video_local,
                activity_artifact_key(
                    org_uuid=org.org_uuid,
                    course_uuid=row.native_course_uuid,
                    activity_uuid=activity.activity_uuid,
                    filename=filename,
                ),
            )
            if manifest.captions:
                caption_local = materialize_storage_key(
                    manifest.captions[0].uri,
                    str(Path(directory) / caption_filename),
                )
                persist_local_or_s3(
                    caption_local,
                    activity_artifact_key(
                        org_uuid=org.org_uuid,
                        course_uuid=row.native_course_uuid,
                        activity_uuid=activity.activity_uuid,
                        filename=caption_filename,
                    ),
                )
    except Exception:  # noqa: BLE001
        await delete_activity(request, activity.activity_uuid, current_user, db_session)
        raise HTTPException(
            status_code=500,
            detail="Native media attachment failed safely; unpublished activity was removed",
        ) from None

    manifest.mark_attached_unpublished(activity.activity_uuid)
    saved = await save_human_transition(
        db_session,
        row=row,
        manifest=manifest,
        actor_user_id=current_user.id,
    )
    return await _response(saved, db_session)


async def publish_video_job(
    request: Request,
    job_id: str,
    current_user: PublicUser,
    db_session: AsyncSession,
) -> VideoJobResponse:
    row, _ = await _job_for_actor(job_id, current_user, db_session, for_update=True)
    manifest = LessonVideoManifest.model_validate(row.manifest_json)
    if manifest.state == VideoJobState.PUBLISHED:
        await db_session.rollback()
        return await _response(row, db_session)
    if manifest.state != VideoJobState.ATTACHED or not row.native_activity_uuid:
        await db_session.rollback()
        raise HTTPException(status_code=409, detail="Unpublished native attachment is required first")

    await update_activity(
        request,
        ActivityUpdate(published=True),
        row.native_activity_uuid,
        current_user,
        db_session,
    )
    manifest.mark_published()
    saved = await save_human_transition(
        db_session,
        row=row,
        manifest=manifest,
        actor_user_id=current_user.id,
    )
    saved.published_at = _now()
    db_session.add(saved)
    await db_session.commit()
    await db_session.refresh(saved)
    return await _response(saved, db_session)
