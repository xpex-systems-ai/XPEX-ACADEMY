import json
from typing import ClassVar

import httpx
import pytest
from src.services.xpex.video_factory import ReviewSeverity, VideoModelRegistry
from src.services.xpex.video_providers import (
    ProviderBinary,
    VideoProviderError,
    VideoProviderNotConfigured,
    _safe_response,
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


class FakeInferenceClient:
    video = b"video-bytes"
    failure: Exception | None = None
    instances: ClassVar[list["FakeInferenceClient"]] = []

    def __init__(self, *args, **kwargs):
        self.args = args
        self.kwargs = kwargs
        self.calls: list[tuple[str, str]] = []
        self.__class__.instances.append(self)

    async def text_to_video(self, prompt, *, model):
        self.calls.append((prompt, model))
        if self.__class__.failure is not None:
            raise self.__class__.failure
        return self.__class__.video


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
    FakeInferenceClient.video = b"video-bytes"
    FakeInferenceClient.failure = None
    FakeInferenceClient.instances = []
    monkeypatch.setattr(httpx, "AsyncClient", FakeClient)
    monkeypatch.setattr(
        "src.services.xpex.video_providers.AsyncInferenceClient",
        FakeInferenceClient,
    )


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
async def test_video_uses_official_hf_fal_client_with_server_side_credentials():
    clip = await generate_video_clip("browser animation", REGISTRY)

    assert clip.data == b"video-bytes"
    assert clip.mime_type == "video/mp4"
    assert clip.model == "Wan-AI/Wan2.2-TI2V-5B"
    assert clip.request_id is None

    assert len(FakeInferenceClient.instances) == 1
    client = FakeInferenceClient.instances[0]
    assert client.kwargs["provider"] == "fal-ai"
    assert client.kwargs["api_key"] == "server-only-test-token"
    assert client.calls == [("browser animation", "Wan-AI/Wan2.2-TI2V-5B")]


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
async def test_official_client_failure_redacts_hf_tokens():
    FakeInferenceClient.failure = RuntimeError(
        "provider rejected credential hf_super_secret and request"
    )

    with pytest.raises(VideoProviderError, match="official client failed") as caught:
        await generate_video_clip("x", REGISTRY)

    error = caught.value
    assert error.endpoint_category == "official-client"
    assert "hf_super_secret" not in str(error)
    assert "[REDACTED]" in str(error)


@pytest.mark.asyncio
async def test_official_client_empty_video_fails_closed():
    FakeInferenceClient.video = b""

    with pytest.raises(VideoProviderError, match="empty video") as caught:
        await generate_video_clip("x", REGISTRY)

    assert caught.value.endpoint_category == "official-client"


@pytest.mark.parametrize(
    ("body", "forbidden"),
    [
        (b"Authorization: Bearer hf_secret\nerror: denied", "hf_secret"),
        (b"Authorization: Basic abc123\nerror: denied", "abc123"),
        (b"HF_TOKEN=hf_private\nerror: denied", "hf_private"),
        (b"error: accidentally echoed hf_unscoped_secret", "hf_unscoped_secret"),
        (b"Cookie: session=credential-value\nerror: denied", "credential-value"),
    ],
)
def test_plaintext_upstream_credentials_are_fully_redacted(body, forbidden):
    sanitized = _safe_response(FakeResponse(content=body))
    assert forbidden not in (sanitized or "")
    assert "[REDACTED]" in (sanitized or "")


@pytest.mark.asyncio
async def test_official_client_uses_configured_model_mapping_contract():
    await generate_video_clip("lesson visual", REGISTRY)
    client = FakeInferenceClient.instances[0]
    assert client.kwargs["provider"] == "fal-ai"
    assert client.calls[0][1] == REGISTRY.video_model
