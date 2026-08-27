"""Production stage handlers for one XPeX AI video lesson.

The handlers transform an approved editorial lesson into durable draft artifacts. Every
artifact is stored under the XPeX draft namespace. Nothing in this module creates a
LearnHouse activity, approves a video, or publishes student-visible content.
"""

from __future__ import annotations

import hashlib
import tempfile
from dataclasses import dataclass
from pathlib import Path

from src.services.xpex.content_studio import LessonDraft
from src.services.xpex.video_factory import (
    LessonVideoManifest,
    MediaRef,
    NarrationAsset,
    StoryboardScene,
    VideoModelRegistry,
    VideoScript,
)
from src.services.xpex.video_media import (
    compose_lesson_video,
    draft_artifact_key,
    extract_review_frame,
    materialize_storage_key,
    persist_local_or_s3,
    probe_duration_seconds,
    write_caption_artifact,
)
from src.services.xpex.video_providers import (
    ProviderBinary,
    generate_image,
    review_multimodal_draft,
    synthesize_narration,
    transcribe_audio,
)
from src.services.xpex.video_worker import VideoStageHandlers


@dataclass(frozen=True)
class VideoLessonSource:
    batch_id: str
    lesson: LessonDraft
    registry: VideoModelRegistry


def _extension(mime_type: str, fallback: str) -> str:
    return {
        "audio/wav": ".wav",
        "audio/mpeg": ".mp3",
        "image/png": ".png",
        "image/jpeg": ".jpg",
    }.get(mime_type, fallback)


def _write_provider_binary(binary: ProviderBinary, directory: str, stem: str, fallback: str) -> str:
    path = Path(directory) / f"{stem}{_extension(binary.mime_type, fallback)}"
    path.write_bytes(binary.data)
    return str(path)


def _stored_ref(local_path: str, key: str) -> MediaRef:
    stored = persist_local_or_s3(local_path, key)
    return MediaRef(
        uri=stored.key,
        checksum_sha256=stored.checksum_sha256,
        mime_type=stored.mime_type,
    )


def _narration_text(lesson: LessonDraft) -> str:
    return (
        f"{lesson.title}. {lesson.objective} "
        f"{lesson.explanation} Agora pratique: {lesson.practice} "
        f"Para demonstrar aprendizagem: {lesson.assessment}"
    )


def _duration_from_text(text: str) -> int:
    words = max(len(text.split()), 1)
    return max(30, min(round(words / 2.2), 3600))


def build_video_stage_handlers(source: VideoLessonSource) -> VideoStageHandlers:
    async def scripting(manifest: LessonVideoManifest) -> LessonVideoManifest:
        narration = _narration_text(source.lesson)
        manifest.video_script = VideoScript(
            title=source.lesson.title,
            learning_objective=source.lesson.objective,
            narration_text=narration,
            estimated_duration_seconds=_duration_from_text(narration),
        )
        return manifest

    async def storyboarding(manifest: LessonVideoManifest) -> LessonVideoManifest:
        if manifest.video_script is None:
            raise ValueError("video script is required before storyboarding")
        manifest.storyboard = [
            StoryboardScene(
                order=1,
                narration=source.lesson.objective,
                visual_direction=(
                    "XPeX branded educational title card. Show only verified concepts from the lesson."
                ),
            ),
            StoryboardScene(
                order=2,
                narration=source.lesson.explanation,
                visual_direction=(
                    "Clear educational diagram or interface-neutral illustration explaining the concept."
                ),
            ),
            StoryboardScene(
                order=3,
                narration=source.lesson.practice,
                visual_direction=(
                    "Practical visual summary. Do not fabricate screenshots, credentials, metrics or UI state."
                ),
                deterministic_capture=True,
            ),
        ]
        return manifest

    async def narrating(manifest: LessonVideoManifest) -> LessonVideoManifest:
        if manifest.video_script is None:
            raise ValueError("video script is required before narration")
        audio = await synthesize_narration(
            manifest.video_script.narration_text,
            source.registry,
        )
        with tempfile.TemporaryDirectory(prefix="xpex-narration-") as directory:
            local_audio = _write_provider_binary(audio, directory, "narration", ".wav")
            duration = probe_duration_seconds(local_audio)
            key = draft_artifact_key(
                batch_id=source.batch_id,
                lesson_id=manifest.lesson_id,
                revision=manifest.revision,
                filename=Path(local_audio).name,
            )
            stored = persist_local_or_s3(local_audio, key)
        manifest.narration = NarrationAsset(
            uri=stored.key,
            checksum_sha256=stored.checksum_sha256,
            mime_type=stored.mime_type,
            language="pt-BR",
            duration_seconds=duration,
        )
        return manifest

    async def asset_generation(manifest: LessonVideoManifest) -> LessonVideoManifest:
        if not manifest.storyboard:
            raise ValueError("storyboard is required before asset generation")
        prompt = (
            "Professional 16:9 educational illustration for XPeX Academy. "
            f"Lesson: {source.lesson.title}. Objective: {source.lesson.objective}. "
            "Clean modern composition, no logos from third parties, no fake browser UI, no credentials, "
            "no text except simple generic labels."
        )
        image = await generate_image(prompt, source.registry)
        with tempfile.TemporaryDirectory(prefix="xpex-assets-") as directory:
            local_image = _write_provider_binary(image, directory, "lesson-visual", ".png")
            key = draft_artifact_key(
                batch_id=source.batch_id,
                lesson_id=manifest.lesson_id,
                revision=manifest.revision,
                filename=Path(local_image).name,
            )
            ref = _stored_ref(local_image, key)
        manifest.thumbnails = [ref]
        manifest.assets = [ref]
        return manifest

    async def rendering(manifest: LessonVideoManifest) -> LessonVideoManifest:
        if manifest.narration is None or not manifest.assets:
            raise ValueError("narration and visual asset are required before rendering")
        with tempfile.TemporaryDirectory(prefix="xpex-render-") as directory:
            image_path = materialize_storage_key(
                manifest.assets[0].uri,
                str(Path(directory) / "visual.png"),
            )
            narration_suffix = _extension(manifest.narration.mime_type, ".wav")
            narration_path = materialize_storage_key(
                manifest.narration.uri,
                str(Path(directory) / f"narration{narration_suffix}"),
            )
            output_path = str(Path(directory) / "lesson-draft.mp4")
            rendered = compose_lesson_video(
                image_path=image_path,
                narration_path=narration_path,
                output_path=output_path,
            )
            key = draft_artifact_key(
                batch_id=source.batch_id,
                lesson_id=manifest.lesson_id,
                revision=manifest.revision,
                filename="lesson-draft.mp4",
            )
            stored = persist_local_or_s3(rendered.uri, key)
        rendered.uri = stored.key
        rendered.checksum_sha256 = stored.checksum_sha256
        manifest.video_draft = rendered
        return manifest

    async def reviewing(manifest: LessonVideoManifest) -> LessonVideoManifest:
        if manifest.video_script is None or manifest.narration is None or manifest.video_draft is None:
            raise ValueError("script, narration and video draft are required before review")
        with tempfile.TemporaryDirectory(prefix="xpex-review-") as directory:
            narration_suffix = _extension(manifest.narration.mime_type, ".wav")
            narration_path = materialize_storage_key(
                manifest.narration.uri,
                str(Path(directory) / f"narration{narration_suffix}"),
            )
            audio_bytes = Path(narration_path).read_bytes()
            transcript = await transcribe_audio(
                audio_bytes,
                manifest.narration.mime_type,
                source.registry,
            )
            video_path = materialize_storage_key(
                manifest.video_draft.uri,
                str(Path(directory) / "lesson-draft.mp4"),
            )
            frame = extract_review_frame(video_path, str(Path(directory) / "review-frame.png"))
            frame_bytes = Path(frame.uri).read_bytes()
            review = await review_multimodal_draft(
                registry=source.registry,
                lesson_title=manifest.video_script.title,
                learning_objective=manifest.video_script.learning_objective,
                narration_text=manifest.video_script.narration_text,
                transcript=transcript.text,
                frame_samples=[ProviderBinary(frame_bytes, frame.mime_type, "ffmpeg-frame")],
            )
            caption_path = str(Path(directory) / "captions.pt-BR.vtt")
            caption = write_caption_artifact(
                transcript=transcript.text,
                duration_seconds=manifest.video_draft.duration_seconds,
                output_path=caption_path,
            )
            caption_key = draft_artifact_key(
                batch_id=source.batch_id,
                lesson_id=manifest.lesson_id,
                revision=manifest.revision,
                filename="captions.pt-BR.vtt",
            )
            stored_caption = persist_local_or_s3(caption.uri, caption_key)
        caption.uri = stored_caption.key
        caption.checksum_sha256 = stored_caption.checksum_sha256
        manifest.captions = [caption]
        manifest.review = review
        return manifest

    return VideoStageHandlers(
        scripting=scripting,
        storyboarding=storyboarding,
        narrating=narrating,
        asset_generation=asset_generation,
        rendering=rendering,
        reviewing=reviewing,
    )


def manifest_evidence_hash(manifest: LessonVideoManifest) -> str:
    """Small helper for audit logs without persisting provider media or prompts."""
    return hashlib.sha256(manifest.content_hash().encode()).hexdigest()
