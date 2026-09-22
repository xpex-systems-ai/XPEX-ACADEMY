from __future__ import annotations

from typing import Any

from config.config import get_learnhouse_config
from src.services.ai.llm.tiers import model_for_tier


def get_ai_gateway_capabilities() -> dict[str, Any]:
    """Return a secret-free snapshot of the configured XPeX AI capability layer."""
    cfg = get_learnhouse_config().ai_config

    provider = (cfg.provider or "google").strip().lower()
    enabled = bool(cfg.is_ai_enabled)

    capabilities = {
        "reasoning": enabled,
        "chat": enabled,
        "rag": enabled,
        "course_planning": enabled,
        "quiz_generation": enabled,
        "image_generation": bool(cfg.image_model or cfg.gemini_api_key or (provider in {"google", "google-gla", "gemini"} and cfg.api_key)),
        "voice_audio": bool(cfg.tts_model or cfg.gemini_api_key or (provider in {"google", "google-gla", "gemini"} and cfg.api_key)),
        "video_generation": False,
    }

    return {
        "status": "ready" if enabled else "disabled",
        "gateway": "gxeon-ai",
        "provider": provider,
        "models": {
            "fast": model_for_tier("fast"),
            "standard": model_for_tier("standard"),
            "pro": model_for_tier("pro"),
        },
        "capabilities": capabilities,
        "security": {
            "server_side_credentials": True,
            "secrets_exposed": False,
        },
        "notes": {
            "video_generation": "Managed through XPeX asynchronous video jobs/providers, not synchronous LLM routes.",
            "consumer_google_ai_pro": "Consumer subscription is not treated as production API quota.",
        },
    }
