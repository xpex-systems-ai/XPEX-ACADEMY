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
    assert clip.request_id == "req-1"
    method, submit_url, kwargs = FakeClient.calls[0]
    assert method == "POST"
    assert submit_url == (
        "https://router.huggingface.co/fal-ai/"
        "wan/v2.2-5b/text-to-video?_subdomain=queue"
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


@pytest.mark.asyncio
async def test_provider_http_error_exposes_sanitized_diagnostics():
    FakeClient.response = FakeResponse(
        status_code=429,
        content=b'{"error":"quota exceeded","Authorization":"Bearer forbidden"}',
        headers={"content-type": "application/json", "x-request-id": "req-limit"},
    )

    with pytest.raises(VideoProviderError, match="HTTP 429") as caught:
        await generate_video_clip("x", REGISTRY)

    error = caught.value
    assert error.http_status == 429
    assert error.request_id == "req-limit"
    assert error.endpoint_category == "submit"
    assert "quota exceeded" in (error.sanitized_response or "")
    assert "Bearer forbidden" not in (error.sanitized_response or "")
    assert "server-only-test-token" not in (error.sanitized_response or "")


@pytest.mark.asyncio
async def test_provider_queue_failure_preserves_safe_upstream_cause(monkeypatch):
    monkeypatch.setattr("src.services.xpex.video_providers.asyncio.sleep", lambda _seconds: _noop())
    FakeClient.response = FakeResponse(
        content=b"{}",
        headers={"content-type": "application/json"},
        json_body={
            "request_id": "req-failed",
            "response_url": "https://queue.fal.run/fal-ai/model/requests/req-failed",
        },
    )
    FakeClient.get_responses = [
        FakeResponse(
            content=b'{"status":"COMPLETED","error":"model mapping unavailable"}',
            headers={"content-type": "application/json"},
            json_body={"status": "COMPLETED", "error": "model mapping unavailable"},
        )
    ]

    with pytest.raises(VideoProviderError, match="generation failed") as caught:
        await generate_video_clip("x", REGISTRY)

    error = caught.value
    assert error.request_id == "req-failed"
    assert error.queue_state == "COMPLETED"
    assert error.endpoint_category == "status"
    assert "model mapping unavailable" in (error.sanitized_response or "")


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
@pytest.mark.parametrize("failure_point", ["status", "result"])
async def test_queue_request_id_survives_later_http_errors(failure_point):
    FakeClient.response = FakeResponse(
        content=b"{}",
        headers={"content-type": "application/json"},
        json_body={
            "request_id": "req-123",
            "response_url": "https://queue.fal.run/fal-ai/model/requests/req-123",
        },
    )
    completed = FakeResponse(
        content=b"{}",
        headers={"content-type": "application/json"},
        json_body={"status": "COMPLETED"},
    )
    failure = FakeResponse(
        status_code=429,
        content=b"Authorization: Bearer hf_secret\nquota exceeded",
        headers={"content-type": "text/plain"},
    )
    FakeClient.get_responses = [failure] if failure_point == "status" else [completed, failure]

    with pytest.raises(VideoProviderError, match="HTTP 429") as caught:
        await generate_video_clip("x", REGISTRY)

    assert caught.value.request_id == "req-123"
    assert caught.value.endpoint_category == failure_point
    assert "hf_secret" not in (caught.value.sanitized_response or "")
