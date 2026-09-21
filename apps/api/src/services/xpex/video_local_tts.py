"""Professional neural narration for the XPeX video factory.

Uses Edge neural voices for natural pt-BR speech. A robotic espeak fallback is
intentionally not used in production: if neural narration is unavailable, the
pipeline fails closed instead of publishing low-quality audio.
"""

from __future__ import annotations

import asyncio
import os
import tempfile
from pathlib import Path

import edge_tts

from src.services.xpex.video_providers import ProviderBinary, VideoProviderError


async def synthesize_local_narration(
    text: str,
    *,
    voice: str | None = None,
    words_per_minute: int = 150,
) -> ProviderBinary:
    narration = " ".join(text.split()).strip()
    if not narration:
        raise VideoProviderError("Neural TTS narration is empty", endpoint_category="tts")
    if len(narration) > 20000:
        raise VideoProviderError("Neural TTS narration exceeds the safe limit", endpoint_category="tts")

    selected_voice = (
        voice
        or os.getenv("XPEX_NEURAL_TTS_VOICE", "").strip()
        or "pt-BR-AntonioNeural"
    )
    # Around 150 wpm is a calm course pace. Edge accepts relative percentage.
    delta = max(-30, min(20, round((words_per_minute - 165) / 1.65)))
    rate = f"{delta:+d}%"

    try:
        with tempfile.TemporaryDirectory(prefix="xpex-neural-tts-") as directory:
            output = Path(directory) / "narration.mp3"
            communicate = edge_tts.Communicate(
                narration,
                selected_voice,
                rate=rate,
                pitch="+0Hz",
                volume="+0%",
            )
            await communicate.save(str(output))
            if not output.is_file() or output.stat().st_size == 0:
                raise VideoProviderError(
                    "Neural TTS produced no narration",
                    endpoint_category="tts",
                )
            data = await asyncio.to_thread(output.read_bytes)
    except VideoProviderError:
        raise
    except Exception as exc:  # noqa: BLE001
        raise VideoProviderError(
            f"Neural TTS failed ({type(exc).__name__})",
            endpoint_category="tts",
        ) from exc

    return ProviderBinary(
        data=data,
        mime_type="audio/mpeg",
        model=f"edge-tts/{selected_voice}",
    )
