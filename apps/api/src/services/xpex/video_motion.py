"""Motion-video composition primitives for the XPeX AI Course Factory.

Unlike the original deterministic still-image renderer, this module accepts a real
text-to-video provider clip and safely turns it into a full lesson visual bed while
preserving the authoritative narration audio. The short provider clip is looped only
as a visual layer; final duration always follows the reviewed narration.
"""

from __future__ import annotations

import hashlib
from pathlib import Path

from src.services.xpex.video_factory import VideoAsset
from src.services.xpex.video_media import (
    VideoMediaError,
    _run_ffmpeg,
    probe_duration_seconds,
)


def compose_motion_lesson_video(
    *,
    clip_path: str,
    narration_path: str,
    output_path: str,
    width: int = 1280,
    height: int = 720,
) -> VideoAsset:
    """Mux/loop a generated motion clip under narration into H.264/AAC MP4.

    The visual provider is never trusted for final duration or encoding. ffmpeg
    normalizes the clip to a browser-safe MP4 and `-shortest` follows narration.
    """
    clip = Path(clip_path)
    narration = Path(narration_path)
    if not clip.is_file() or clip.stat().st_size == 0:
        raise VideoMediaError("generated motion clip is missing")
    if not narration.is_file() or narration.stat().st_size == 0:
        raise VideoMediaError("narration input is missing")

    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    _run_ffmpeg(
        [
            "ffmpeg",
            "-y",
            "-stream_loop",
            "-1",
            "-i",
            str(clip),
            "-i",
            str(narration),
            "-map",
            "0:v:0",
            "-map",
            "1:a:0",
            "-vf",
            (
                f"scale={width}:{height}:force_original_aspect_ratio=increase,"
                f"crop={width}:{height},fps=30"
            ),
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
        ],
        timeout_seconds=1200,
    )
    if not output.is_file() or output.stat().st_size == 0:
        raise VideoMediaError("motion lesson render produced no video")

    duration = probe_duration_seconds(str(output))
    # The caller persists the artifact and overwrites checksum/URI using durable storage.
    # A temporary checksum placeholder is intentionally deterministic and valid until then.
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    return VideoAsset(
        uri=str(output),
        checksum_sha256=digest,
        mime_type="video/mp4",
        duration_seconds=max(duration, 1),
    )
