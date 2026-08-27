from pathlib import Path

import pytest
from src.services.xpex.video_local_tts import synthesize_local_narration
from src.services.xpex.video_providers import VideoProviderError


class _Result:
    returncode = 0
    stderr = ""


@pytest.mark.asyncio
async def test_local_tts_uses_stdin_and_returns_wav(monkeypatch):
    def fake_run(command, **kwargs):
        assert command[0] == "espeak-ng"
        assert "--stdin" in command
        assert kwargs["input"] == "Olá turma XPeX"
        output = Path(command[command.index("-w") + 1])
        output.write_bytes(b"RIFF-test-wav")
        return _Result()

    monkeypatch.setattr("src.services.xpex.video_local_tts.subprocess.run", fake_run)

    result = await synthesize_local_narration("  Olá   turma XPeX  ")

    assert result.mime_type == "audio/wav"
    assert result.model == "local/espeak-ng:pt-br"
    assert result.data == b"RIFF-test-wav"


@pytest.mark.asyncio
async def test_local_tts_rejects_empty_text():
    with pytest.raises(VideoProviderError, match="empty"):
        await synthesize_local_narration("   ")


@pytest.mark.asyncio
async def test_local_tts_fails_closed_when_binary_fails(monkeypatch):
    class Failed:
        returncode = 1
        stderr = "provider-specific diagnostic"

    monkeypatch.setattr(
        "src.services.xpex.video_local_tts.subprocess.run",
        lambda *args, **kwargs: Failed(),
    )

    with pytest.raises(VideoProviderError, match="produced no narration") as exc:
        await synthesize_local_narration("conteúdo")
    assert "provider-specific diagnostic" not in str(exc.value)
