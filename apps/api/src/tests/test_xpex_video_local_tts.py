from pathlib import Path

import pytest
from src.services.xpex.video_local_tts import synthesize_local_narration
from src.services.xpex.video_providers import VideoProviderError


@pytest.mark.asyncio
async def test_local_tts_uses_edge_neural_voice_and_returns_mp3(monkeypatch):
    captured = {}

    class FakeCommunicate:
        def __init__(self, text, voice, **kwargs):
            captured.update(text=text, voice=voice, kwargs=kwargs)

        async def save(self, output):
            Path(output).write_bytes(b"ID3-test-mp3")

    monkeypatch.setattr(
        "src.services.xpex.video_local_tts.edge_tts.Communicate",
        FakeCommunicate,
    )

    result = await synthesize_local_narration("  Olá   turma XPeX  ")

    assert captured["text"] == "Olá turma XPeX"
    assert captured["voice"] == "pt-BR-AntonioNeural"
    assert result.mime_type == "audio/mpeg"
    assert result.model == "edge-tts/pt-BR-AntonioNeural"
    assert result.data == b"ID3-test-mp3"


@pytest.mark.asyncio
async def test_local_tts_rejects_empty_text():
    with pytest.raises(VideoProviderError, match="empty"):
        await synthesize_local_narration("   ")


@pytest.mark.asyncio
async def test_local_tts_fails_closed_when_neural_provider_fails(monkeypatch):
    class FailedCommunicate:
        def __init__(self, *_args, **_kwargs):
            pass

        async def save(self, _output):
            raise RuntimeError("provider-specific diagnostic")

    monkeypatch.setattr(
        "src.services.xpex.video_local_tts.edge_tts.Communicate",
        FailedCommunicate,
    )

    with pytest.raises(VideoProviderError, match="Neural TTS failed") as exc:
        await synthesize_local_narration("conteúdo")
    assert "provider-specific diagnostic" not in str(exc.value)
