import inspect

import pytest
from fastapi import HTTPException
from src.services.xpex import video_studio
from src.services.xpex.video_factory import VideoModelRegistry
from src.services.xpex.video_media import VideoMediaError


def _registry(*, tts_model: str | None = "org/real-tts") -> VideoModelRegistry:
    return VideoModelRegistry(
        video_model="Wan-AI/Wan2.2-TI2V-5B",
        video_provider="fal-ai",
        video_provider_model="fal-ai/wan/v2.2-5b/text-to-video",
        image_model="black-forest-labs/FLUX.1-schnell",
        tts_model=tts_model,
        stt_model="openai/whisper-large-v3-turbo",
        multimodal_review_model="Qwen/Qwen2.5-VL-7B-Instruct",
    )


def test_real_only_preflight_accepts_complete_real_configuration(monkeypatch) -> None:
    monkeypatch.setenv("HF_TOKEN", "test-token-never-logged")
    monkeypatch.setattr(
        video_studio,
        "require_durable_media_storage",
        lambda: "DURABLE_OBJECT_STORAGE",
    )

    assert video_studio._require_real_pipeline_ready(_registry()) == "DURABLE_OBJECT_STORAGE"


def test_real_only_preflight_blocks_missing_external_prerequisites(monkeypatch) -> None:
    monkeypatch.delenv("HF_TOKEN", raising=False)
    monkeypatch.setattr(
        video_studio,
        "require_durable_media_storage",
        lambda: "DURABLE_OBJECT_STORAGE",
    )
    registry = VideoModelRegistry(
        video_provider="huggingface-inference",
        image_model="image/model",
        tts_model="tts/model",
        stt_model="stt/model",
        multimodal_review_model="review/model",
    )

    with pytest.raises(HTTPException) as exc_info:
        video_studio._require_real_pipeline_ready(registry)

    assert exc_info.value.status_code == 503
    detail = str(exc_info.value.detail)
    assert "REAL_ONLY" in detail
    assert "HF_TOKEN" in detail
    assert "XPEX_HF_VIDEO_PROVIDER=fal-ai" in detail
    assert "XPEX_HF_VIDEO_MODEL" in detail
    assert "XPEX_HF_VIDEO_PROVIDER_MODEL" in detail


def test_real_only_preflight_blocks_ephemeral_storage(monkeypatch) -> None:
    monkeypatch.setenv("HF_TOKEN", "test-token-never-logged")

    def fail_storage() -> str:
        raise VideoMediaError("durable media storage is not configured")

    monkeypatch.setattr(video_studio, "require_durable_media_storage", fail_storage)

    with pytest.raises(HTTPException) as exc_info:
        video_studio._require_real_pipeline_ready(_registry())

    assert exc_info.value.status_code == 503
    assert "durable media storage" in str(exc_info.value.detail)
    assert "test-token-never-logged" not in str(exc_info.value.detail)


def test_real_local_tts_is_allowed_when_explicit_engine_exists(monkeypatch) -> None:
    monkeypatch.setenv("HF_TOKEN", "test-token-never-logged")
    monkeypatch.setattr(
        video_studio,
        "require_durable_media_storage",
        lambda: "DURABLE_VOLUME",
    )
    monkeypatch.setattr(video_studio.shutil, "which", lambda name: "/usr/bin/espeak-ng")

    assert video_studio._require_real_pipeline_ready(_registry(tts_model=None)) == "DURABLE_VOLUME"


def test_real_only_preflight_blocks_when_no_tts_engine_exists(monkeypatch) -> None:
    monkeypatch.setenv("HF_TOKEN", "test-token-never-logged")
    monkeypatch.setattr(
        video_studio,
        "require_durable_media_storage",
        lambda: "DURABLE_VOLUME",
    )
    monkeypatch.setattr(video_studio.shutil, "which", lambda name: None)

    with pytest.raises(HTTPException) as exc_info:
        video_studio._require_real_pipeline_ready(_registry(tts_model=None))

    assert exc_info.value.status_code == 503
    assert "XPEX_HF_TTS_MODEL or espeak-ng" in str(exc_info.value.detail)


def test_real_only_gate_runs_before_job_claim() -> None:
    source = inspect.getsource(video_studio.process_video_job)
    assert source.index("_require_real_pipeline_ready(registry)") < source.index(
        "claimed = await claim_job"
    )
