import json
from typing import ClassVar

import httpx
import pytest
from src.services.xpex.video_factory import ReviewSeverity, VideoModelRegistry
from src.services.xpex.video_providers import (
    ProviderBinary,
    VideoProviderError,
    VideoProviderNotConfigured,
    generate_image,
    generate_video_clip,
    review_multimodal_draft,
    synthesize_narration,
    transcribe_audio,
)

REGISTRY = VideoModelRegistry(
    video_model="Wan-AI/Wan2.2-TI2V-5B",
    video_provider="fal-ai",
    video_provider_model="fal-ai/wan/v2.2-5b/text-to-video",
    image_model="org/image-model",
    tts_model="org/tts-model",
    stt_model="org/stt-model",
    multimodal_review_model="org/vision-review-model",
)


class FakeResponse:
    def __init__(self, *, status_code=200, content=b"media", headers=None, json_body=None):
        self.status_code = status_code
        self.content = content
        self.headers = headers or {"content-type": "application/octet-stream"}
        self._json_body = json_body

    def json(self):
        if self._json_body is None:
            raise ValueError("no json")
        return self._json_body


class FakeClient:
    response = FakeResponse()
    get_responses: ClassVar[list[FakeResponse]] = []
    calls: ClassVar[list[tuple[str, str, dict]]] = []

    def __init__(self, *args, **kwargs):
        self.args = args
        self.kwargs = kwargs

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return False

    async def post(self, url, **kwargs):
        self.__class__.calls.append(("POST", url, kwargs))
        return self.__class__.response

    async def get(self, url, **kwargs):
        self.__class__.calls.append(("GET", url, kwargs))
        if self.__class__.get_responses:
            return self.__class__.get_responses.pop(0)
        return self.__class__.response


@pytest.fixture(autouse=True)
def provider_env(monkeypatch):
    monkeypatch.setenv("HF_TOKEN", "server-only-test-token")
    FakeClient.calls = []
    FakeClient.get_responses = []
    FakeClient.response = FakeResponse()
    monkeypatch.setattr(httpx, "AsyncClient", FakeClient)


@pytest.mark.asyncio
async def test_binary_adapters_use_server_side_models_and_return_media():
    FakeClient.response = FakeResponse(
        content=b"image-bytes",
        headers={"content-type": "image/png; charset=binary"},
    )
    image = await generate_image("thumbnail", REGISTRY)
    assert image.data == b"image-bytes"
    assert image.mime_type == "image/png"
    assert image.model == "org/image-model"
    assert FakeClient.calls[-1][1].endswith("/org/image-model")
    assert FakeClient.calls[-1][2]["headers"]["Authorization"] == "Bearer server-only-test-token"

    FakeClient.response = FakeResponse(
        content=b"audio-bytes",
        headers={"content-type": "audio/wav"},
    )
    narration = await synthesize_narration("Olá aula", REGISTRY)
    assert narration.mime_type == "audio/wav"
    assert FakeClient.calls[-1][1].endswith("/org/tts-model")


@pytest.mark.asyncio
async def test_video_uses_hf_routed_fal_queue_and_downloads_result(monkeypatch):
    monkeypatch.setattr("src.services.xpex.video_providers.asyncio.sleep", lambda _seconds: _noop())
    FakeClient.response = FakeResponse(
        content=b"{}",
        headers={"content-type": "application/json"},
        json_body={
            "request_id": "req-1",
            "response_url": (
                "https://queue.fal.run/fal-ai/wan/v2.2-5b/text-to-video/requests/req-1"
            ),
        },
    )
    FakeClient.get_responses = [
        FakeResponse(
            content=b"{}",
            headers={"content-type": "application/json"},
            json_body={"status": "COMPLETED", "request_id": "req-1"},
        ),
        FakeResponse(
            content=b"{}",
            headers={"content-type": "application/json"},
            json_body={"video": {"url": "https://media.example/video.mp4"}},
        ),
        FakeResponse(content=b"video-bytes", headers={"content-type": "video/mp4"}),
    ]

    clip = await generate_video_clip("browser animation", REGISTRY)

    assert clip.data == b"video-bytes"
    assert clip.mime_type == "video/mp4"
    assert clip.model == "Wan-AI/Wan2.2-TI2V-5B"
    method, submit_url, kwargs = FakeClient.calls[0]
    assert method == "POST"
    assert submit_url == (
        "https://router.huggingface.co/fal-ai/"
        "fal-ai/wan/v2.2-5b/text-to-video?_subdomain=queue"
    )
    assert kwargs["json"] == {"prompt": "browser animation"}
    assert kwargs["headers"]["Authorization"] == "Bearer server-only-test-token"
    assert FakeClient.calls[-1][1] == "https://media.example/video.mp4"


async def _noop():
    return None


@pytest.mark.asyncio
async def test_missing_capability_model_fails_closed():
    with pytest.raises(VideoProviderNotConfigured, match="image model"):
        await generate_image("x", VideoModelRegistry())


@pytest.mark.asyncio
async def test_video_rejects_unsupported_provider():
    registry = REGISTRY.model_copy(update={"video_provider": "hf-inference"})
    with pytest.raises(VideoProviderNotConfigured, match="Only the audited Fal AI"):
        await generate_video_clip("x", registry)


@pytest.mark.asyncio
async def test_binary_json_error_is_rejected():
    FakeClient.response = FakeResponse(
        content=b'{"error":"provider failed"}',
        headers={"content-type": "application/json"},
    )
    with pytest.raises(VideoProviderError, match="JSON"):
        await generate_image("x", REGISTRY)


@pytest.mark.asyncio
async def test_stt_returns_transcript():
    FakeClient.response = FakeResponse(
        content=b"{}",
        headers={"content-type": "application/json"},
        json_body={"text": "  Olá, mundo.  "},
    )
    transcript = await transcribe_audio(b"audio", "audio/mpeg", REGISTRY)
    assert transcript.text == "Olá, mundo."
    assert transcript.model == "org/stt-model"
    _, _, kwargs = FakeClient.calls[-1]
    assert kwargs["content"] == b"audio"
    assert kwargs["headers"]["Content-Type"] == "audio/mpeg"


@pytest.mark.asyncio
async def test_multimodal_review_normalizes_blocker_and_embeds_frame():
    payload = {
        "notes": [
            {
                "severity": "BLOCKER",
                "code": "TRANSCRIPT_MISMATCH",
                "message": "A narração diverge do roteiro aprovado.",
            }
        ]
    }
    FakeClient.response = FakeResponse(
        content=b"{}",
        headers={"content-type": "application/json"},
        json_body={
            "choices": [
                {
                    "message": {
                        "content": json.dumps(payload),
                    }
                }
            ]
        },
    )

    review = await review_multimodal_draft(
        registry=REGISTRY,
        lesson_title="HTML",
        learning_objective="Criar uma página válida",
        narration_text="Abra o editor",
        transcript="Abra outro programa",
        frame_samples=[ProviderBinary(b"png", "image/png", "org/image-model")],
    )
    assert review.has_blocker is True
    assert review.notes[0].severity == ReviewSeverity.BLOCKER
    _, _, kwargs = FakeClient.calls[-1]
    user_content = kwargs["json"]["messages"][1]["content"]
    assert user_content[1]["type"] == "image_url"
    assert user_content[1]["image_url"]["url"].startswith("data:image/png;base64,")


@pytest.mark.asyncio
async def test_provider_http_error_does_not_leak_body():
    FakeClient.response = FakeResponse(status_code=503, content=b"secret upstream body")
    with pytest.raises(VideoProviderError, match="HTTP 503") as exc:
        await generate_video_clip("x", REGISTRY)
    assert "secret upstream body" not in str(exc.value)
