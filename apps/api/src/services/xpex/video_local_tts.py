"""Deterministic local narration fallback for the XPeX video factory.

Hugging Face Inference Providers currently do not expose a general text-to-speech
provider contract. This adapter keeps the production pipeline runnable without adding a
browser credential or silently selecting an unaudited third-party service. It executes
``espeak-ng`` without a shell and returns WAV bytes for the existing media pipeline.
"""

from __future__ import annotations

import asyncio
import subprocess
import tempfile
from pathlib import Path

from src.services.xpex.video_providers import ProviderBinary, VideoProviderError


def _synthesize_sync(
    narration: str,
    *,
    voice: str,
    words_per_minute: int,
) -> bytes:
    rate = max(80, min(words_per_minute, 260))
    with tempfile.TemporaryDirectory(prefix="xpex-local-tts-") as directory:
        output = Path(directory) / "narration.wav"
        try:
            result = subprocess.run(
                [
                    "espeak-ng",
                    "-v",
                    voice,
                    "-s",
                    str(rate),
                    "-w",
                    str(output),
                    "--stdin",
                ],
                input=narration,
                text=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
                check=False,
                timeout=120,
            )
        except (OSError, subprocess.TimeoutExpired) as exc:
            raise VideoProviderError("Local TTS execution failed") from exc
        if result.returncode != 0 or not output.is_file() or output.stat().st_size == 0:
            raise VideoProviderError("Local TTS produced no narration")
        return output.read_bytes()


async def synthesize_local_narration(
    text: str,
    *,
    voice: str = "pt-br",
    words_per_minute: int = 155,
) -> ProviderBinary:
    narration = " ".join(text.split()).strip()
    if not narration:
        raise VideoProviderError("Local TTS narration is empty")
    if len(narration) > 20000:
        raise VideoProviderError("Local TTS narration exceeds the safe limit")
    audio = await asyncio.to_thread(
        _synthesize_sync,
        narration,
        voice=voice,
        words_per_minute=words_per_minute,
    )
    return ProviderBinary(data=audio, mime_type="audio/wav", model="local/espeak-ng:pt-br")
