"""Lease-bound stage orchestration for the XPeX AI Video Lesson Factory.

The orchestrator is deliberately provider/storage agnostic. Production adapters are
injected per stage, while this module owns resumability, checkpoint ordering and the
hard stop at AWAITING_HUMAN_APPROVAL.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import dataclass

from sqlmodel.ext.asyncio.session import AsyncSession
from src.db.xpex_video import XPeXVideoJob
from src.services.xpex.video_factory import LessonVideoManifest, VideoJobState
from src.services.xpex.video_jobs import mark_job_failed, save_worker_checkpoint

StageHandler = Callable[[LessonVideoManifest], Awaitable[LessonVideoManifest]]


@dataclass(frozen=True)
class VideoStageHandlers:
    scripting: StageHandler
    storyboarding: StageHandler
    narrating: StageHandler
    asset_generation: StageHandler
    rendering: StageHandler
    reviewing: StageHandler


PIPELINE_NEXT: dict[VideoJobState, VideoJobState] = {
    VideoJobState.SCRIPTING: VideoJobState.STORYBOARDING,
    VideoJobState.STORYBOARDING: VideoJobState.NARRATING,
    VideoJobState.NARRATING: VideoJobState.ASSET_GENERATION,
    VideoJobState.ASSET_GENERATION: VideoJobState.RENDERING,
    VideoJobState.RENDERING: VideoJobState.REVIEWING,
    VideoJobState.REVIEWING: VideoJobState.AWAITING_HUMAN_APPROVAL,
}


def _handler_for(state: VideoJobState, handlers: VideoStageHandlers) -> StageHandler:
    mapping = {
        VideoJobState.SCRIPTING: handlers.scripting,
        VideoJobState.STORYBOARDING: handlers.storyboarding,
        VideoJobState.NARRATING: handlers.narrating,
        VideoJobState.ASSET_GENERATION: handlers.asset_generation,
        VideoJobState.RENDERING: handlers.rendering,
        VideoJobState.REVIEWING: handlers.reviewing,
    }
    try:
        return mapping[state]
    except KeyError:
        raise ValueError(f"video worker cannot execute state {state.value}") from None


async def run_claimed_job(
    db_session: AsyncSession,
    *,
    job: XPeXVideoJob,
    handlers: VideoStageHandlers,
) -> XPeXVideoJob:
    """Run/restart a claimed job until it reaches the human approval boundary.

    Each successful stage is committed before the next one starts. A worker crash can
    therefore resume from ``resume_state`` without regenerating previously checkpointed
    stages. Any failure releases the lease and records only a sanitized error category.
    """
    if not job.lease_id:
        raise ValueError("claimed video job requires an active lease")
    lease_id = job.lease_id
    try:
        state = VideoJobState(job.state)
    except ValueError:
        raise ValueError("claimed video job has an invalid state") from None

    manifest = LessonVideoManifest.model_validate(job.manifest_json)

    try:
        while state in PIPELINE_NEXT:
            handler = _handler_for(state, handlers)
            manifest.state = state
            manifest = await handler(manifest)
            next_state = PIPELINE_NEXT[state]
            job = await save_worker_checkpoint(
                db_session,
                job_id=job.job_id,
                lease_id=lease_id,
                manifest=manifest,
                next_state=next_state,
            )
            state = next_state
            if state == VideoJobState.AWAITING_HUMAN_APPROVAL:
                return job
        raise ValueError(f"video worker cannot continue state {state.value}")
    except Exception as exc:  # noqa: BLE001
        # Handler failures may originate from provider/storage adapters. Persist only
        # the exception category, never upstream bodies, prompts, media or credentials.
        safe_error = f"{type(exc).__name__}: stage execution failed"
        return await mark_job_failed(
            db_session,
            job_id=job.job_id,
            lease_id=lease_id,
            safe_error=safe_error,
        )
