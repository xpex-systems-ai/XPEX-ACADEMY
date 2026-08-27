"""Media storage, rendering and caption primitives for XPeX video lessons.

Draft artifacts live outside LearnHouse activity directories. Only after explicit human
approval may callers copy the approved render/captions into the native activity path.
This module never creates activities and never changes ``published`` state.
"""

from __future__ import annotations

import hashlib
import os
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path

from src.services.courses.transfer.storage_utils import (
    get_content_delivery_type,
    upload_file_to_s3,
)
from src.services.xpex.video_factory import CaptionAsset, MediaRef, VideoAsset

_SAFE_COMPONENT = re.compile(r"[^A-Za-z0-9._-]+")


class VideoMediaError(RuntimeError):
    """Raised when a media artifact cannot be persisted or rendered safely."""


@dataclass(frozen=True)
class StoredArtifact:
    key: str
    local_path: str | None
    checksum_sha256: str
    mime_type: str


def _safe_component(value: str, label: str) -> str:
    cleaned = _SAFE_COMPONENT.sub("-", value.strip()).strip(".-")
    if not cleaned:
        raise VideoMediaError(f"{label} is empty after sanitization")
    return cleaned[:180]


def _sha256_file(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _mime_for_suffix(suffix: str) -> str:
    return {
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".wav": "audio/wav",
        ".mp3": "audio/mpeg",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".vtt": "text/vtt",
        ".srt": "application/x-subrip",
    }.get(suffix.lower(), "application/octet-stream")


def draft_artifact_key(
    *,
    batch_id: str,
    lesson_id: str,
    revision: int,
    filename: str,
) -> str:
    """Return a storage key isolated from student-facing activity content."""
    safe_name = Path(filename).name
    if safe_name != filename or safe_name in {"", ".", ".."}:
        raise VideoMediaError("artifact filename must be a plain filename")
    return (
        "content/xpex-video-drafts/"
        f"{_safe_component(batch_id, 'batch_id')}/"
        f"{_safe_component(lesson_id, 'lesson_id')}/"
        f"r{revision}/{_safe_component(safe_name, 'filename')}"
    )


def activity_artifact_key(
    *,
    org_uuid: str,
    course_uuid: str,
    activity_uuid: str,
    filename: str,
) -> str:
    """Build the exact native LearnHouse activity-content storage key."""
    safe_name = Path(filename).name
    if safe_name != filename or safe_name in {"", ".", ".."}:
        raise VideoMediaError("activity filename must be a plain filename")
    return (
        "content/orgs/"
        f"{_safe_component(org_uuid, 'org_uuid')}/courses/"
        f"{_safe_component(course_uuid, 'course_uuid')}/activities/"
        f"{_safe_component(activity_uuid, 'activity_uuid')}/"
        f"{_safe_component(safe_name, 'filename')}"
    )


def persist_local_or_s3(local_path: str, storage_key: str) -> StoredArtifact:
    """Persist a completed artifact without loading large video bytes into memory."""
    source = Path(local_path)
    if not source.is_file():
        raise VideoMediaError("media artifact does not exist")
    checksum = _sha256_file(str(source))
    mime = _mime_for_suffix(source.suffix)

    if get_content_delivery_type() == "s3api":
        if not upload_file_to_s3(storage_key, str(source)):
            raise VideoMediaError("media artifact upload failed")
        return StoredArtifact(storage_key, None, checksum, mime)

    target = Path(storage_key)
    target.parent.mkdir(parents=True, exist_ok=True)
    if source.resolve() != target.resolve():
        temp_target = target.with_suffix(target.suffix + ".tmp")
        with open(source, "rb") as src, open(temp_target, "wb") as dst:
            dst.writelines(iter(lambda: src.read(1024 * 1024), b""))
        os.replace(temp_target, target)
    return StoredArtifact(storage_key, str(target), checksum, mime)


def _run_ffmpeg(command: list[str], *, timeout_seconds: int = 900) -> None:
    try:
        result = subprocess.run(
            command,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            check=False,
            timeout=timeout_seconds,
            text=True,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise VideoMediaError("ffmpeg execution failed") from exc
    if result.returncode != 0:
        raise VideoMediaError("ffmpeg render failed")


def compose_lesson_video(
    *,
    image_path: str,
    narration_path: str,
    output_path: str,
    width: int = 1280,
    height: int = 720,
) -> VideoAsset:
    """Create a deterministic H.264/AAC lesson draft from a reviewed image and narration."""
    if not Path(image_path).is_file() or not Path(narration_path).is_file():
        raise VideoMediaError("render input is missing")
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    _run_ffmpeg(
        [
            "ffmpeg",
            "-y",
            "-loop",
            "1",
            "-i",
            image_path,
            "-i",
            narration_path,
            "-vf",
            f"scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "160k",
            "-shortest",
            "-movflags",
            "+faststart",
            str(output),
        ]
    )
    if not output.is_file() or output.stat().st_size == 0:
        raise VideoMediaError("ffmpeg produced no video")
    duration = probe_duration_seconds(str(output))
    checksum = _sha256_file(str(output))
    return VideoAsset(
        uri=str(output),
        checksum_sha256=checksum,
        mime_type="video/mp4",
        duration_seconds=max(duration, 1),
    )


def probe_duration_seconds(path: str) -> int:
    """Read media duration with ffprobe; no provider metadata is trusted for final QA."""
    try:
        result = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                path,
            ],
            capture_output=True,
            text=True,
            check=False,
            timeout=30,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise VideoMediaError("ffprobe execution failed") from exc
    if result.returncode != 0:
        raise VideoMediaError("ffprobe could not inspect media")
    try:
        return max(1, round(float(result.stdout.strip())))
    except ValueError as exc:
        raise VideoMediaError("ffprobe returned invalid duration") from exc


def _timestamp(seconds: float, *, srt: bool) -> str:
    millis = max(0, round(seconds * 1000))
    hours, remainder = divmod(millis, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    secs, ms = divmod(remainder, 1000)
    separator = "," if srt else "."
    return f"{hours:02}:{minutes:02}:{secs:02}{separator}{ms:03}"


def build_caption_text(transcript: str, duration_seconds: int, *, format: str) -> str:
    """Build a deterministic caption artifact from a reviewed transcript.

    The first production version uses one safe cue spanning the narration. Timestamped
    STT can replace this later without changing the persisted caption contract.
    """
    text = " ".join(transcript.split()).strip()
    if not text:
        raise VideoMediaError("caption transcript is empty")
    if format not in {"vtt", "srt"}:
        raise VideoMediaError("caption format must be vtt or srt")
    end = _timestamp(max(duration_seconds, 1), srt=format == "srt")
    start = _timestamp(0, srt=format == "srt")
    if format == "vtt":
        return f"WEBVTT\n\n{start} --> {end}\n{text}\n"
    return f"1\n{start} --> {end}\n{text}\n"


def write_caption_artifact(
    *,
    transcript: str,
    duration_seconds: int,
    output_path: str,
    language: str = "pt-BR",
) -> CaptionAsset:
    output = Path(output_path)
    suffix = output.suffix.lower().lstrip(".")
    if suffix not in {"vtt", "srt"}:
        raise VideoMediaError("caption output must end in .vtt or .srt")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        build_caption_text(transcript, duration_seconds, format=suffix),
        encoding="utf-8",
    )
    return CaptionAsset(
        uri=str(output),
        checksum_sha256=_sha256_file(str(output)),
        mime_type=_mime_for_suffix(output.suffix),
        format=suffix,
        language=language,
    )


def stored_media_ref(artifact: StoredArtifact) -> MediaRef:
    return MediaRef(
        uri=artifact.key,
        checksum_sha256=artifact.checksum_sha256,
        mime_type=artifact.mime_type,
    )
