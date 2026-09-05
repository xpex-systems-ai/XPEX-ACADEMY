from src.services.xpex.video_factory import VideoModelRegistry
from src.services.xpex.video_providers import _fal_poll_urls, _fal_routed_url


def test_fal_routed_url_normalizes_official_provider_mapping() -> None:
    assert (
        _fal_routed_url("fal-ai/wan/v2.2-5b/text-to-video")
        == "https://router.huggingface.co/fal-ai/wan/v2.2-5b/text-to-video?_subdomain=queue"
    )


def test_fal_poll_urls_keep_hugging_face_router_namespace() -> None:
    submit_url = _fal_routed_url("fal-ai/wan/v2.2-5b/text-to-video")
    status_url, result_url = _fal_poll_urls(
        submit_url,
        "https://router.huggingface.co/wan/v2.2-5b/text-to-video/requests/req-123",
    )
    assert status_url == (
        "https://router.huggingface.co/fal-ai/wan/v2.2-5b/text-to-video/requests/req-123/status"
        "?_subdomain=queue"
    )
    assert result_url == (
        "https://router.huggingface.co/fal-ai/wan/v2.2-5b/text-to-video/requests/req-123"
        "?_subdomain=queue"
    )


def test_xpex_full_video_pipeline_requires_motion_provider() -> None:
    registry = VideoModelRegistry(
        image_model="image-model",
        tts_model="tts-model",
        stt_model="stt-model",
        multimodal_review_model="review-model",
    )
    assert registry.configured_for_full_pipeline() is False

    registry.video_model = "Wan-AI/Wan2.2-TI2V-5B"
    registry.video_provider = "fal-ai"
    registry.video_provider_model = "fal-ai/wan/v2.2-5b/text-to-video"
    assert registry.configured_for_full_pipeline() is True
