from __future__ import annotations

import os

from config.config import get_learnhouse_config
from pydantic import BaseModel
from src.services.ai.llm.tiers import model_for_tier

# ---------------------------------------------------------------------------
# Provider readiness constants
# ---------------------------------------------------------------------------

_GOOGLE_ALIASES = {"google", "google-gla", "gemini"}
_NO_KEY_PROVIDERS = {"ollama", "bedrock"}
_SUPPORTED_PROVIDERS = (
    _GOOGLE_ALIASES
    | _NO_KEY_PROVIDERS
    | {
        "openai",
        "openai-compatible",
        "azure",
        "together",
        "openrouter",
        "anthropic",
        "deepseek",
        "moonshot",
        "moonshotai",
        "kimi",
        "mistral",
    }
)


def _has_credential(val: object) -> bool:
    """Return True if val is a non-empty, non-whitespace string."""
    return bool(val and str(val).strip())


def is_provider_configured(provider: str, cfg: object) -> bool:
    """Check whether the configured AI provider has usable credentials.

    Provider-specific rules:
    - Ollama: local runtime, requires no key.
    - Bedrock: uses standard AWS credential chain, api_key is optional.
    - OpenRouter: accepts LEARNHOUSE_AI_API_KEY or OPENROUTER_API_KEY env var.
    - Google / Gemini: accepts api_key or legacy gemini_api_key.
    - Other providers: require api_key.
    """
    provider_id = (provider or "google").strip().lower()
    api_key = getattr(cfg, "api_key", None)

    if provider_id in _NO_KEY_PROVIDERS:
        return True

    if provider_id in _GOOGLE_ALIASES:
        gemini_key = getattr(cfg, "gemini_api_key", None)
        return _has_credential(api_key) or _has_credential(gemini_key)

    if provider_id == "openrouter":
        return _has_credential(api_key) or _has_credential(
            os.getenv("OPENROUTER_API_KEY")
        )

    if provider_id in _SUPPORTED_PROVIDERS:
        return _has_credential(api_key)

    return False


# ---------------------------------------------------------------------------
# Typed response schema — stable contract for the XPeX AI gateway health API.
# ---------------------------------------------------------------------------


class AIGatewayCapabilities(BaseModel):
    """Capability flags reported by the gateway.

    All values are derived from *configuration presence only* — no provider
    credential is called, and no secret value is included in this model.
    ``video_generation`` is always ``False``; video is managed through the
    XPeX asynchronous job pipeline, not through synchronous LLM routes.
    """

    reasoning: bool
    chat: bool
    rag: bool
    course_planning: bool
    quiz_generation: bool
    image_generation: bool
    voice_audio: bool
    video_generation: bool


class AIGatewayModels(BaseModel):
    """Resolved model names per tier (strings only, no credentials)."""

    fast: str
    standard: str
    pro: str


class AIGatewaySecurity(BaseModel):
    """Security attestation fields included in the health snapshot."""

    server_side_credentials: bool
    secrets_exposed: bool


class AIGatewayNotes(BaseModel):
    """Informational notes for integrators."""

    video_generation: str
    consumer_google_ai_pro: str


class AIGatewayHealth(BaseModel):
    """Full secret-free health/capability snapshot for the GXEON AI Gateway.

    This is the response model for ``GET /xpex/ai-gateway/health``.
    No field in this model may ever contain an API key, token, password or
    any other credential.  The ``security.secrets_exposed`` field is a static
    attestation — it is not derived from scanning; it reflects the design
    invariant that the service layer strips credentials before constructing
    this object.
    """

    status: str
    gateway: str
    provider: str
    models: AIGatewayModels
    capabilities: AIGatewayCapabilities
    security: AIGatewaySecurity
    notes: AIGatewayNotes


# ---------------------------------------------------------------------------
# Service function
# ---------------------------------------------------------------------------


def get_ai_gateway_capabilities() -> AIGatewayHealth:
    """Return a secret-free snapshot of the configured XPeX AI capability layer.

    Reads *only* the presence/absence of configuration values.  No live
    provider call is made.  No credential value is included in the response.

    Status semantics:
    - "disabled": AI is explicitly disabled in configuration.
    - "unconfigured": AI is enabled but the configured provider lacks credentials.
    - "ready": AI is enabled and the configured provider has usable credentials.
    """
    cfg = get_learnhouse_config().ai_config

    provider = (cfg.provider or "google").strip().lower()
    enabled = bool(cfg.is_ai_enabled)
    configured = is_provider_configured(provider, cfg)

    if not enabled:
        status = "disabled"
    elif not configured:
        status = "unconfigured"
    else:
        status = "ready"

    is_ready = status == "ready"

    # Capability flags: core text & reasoning capabilities require the gateway
    # to be fully ready (enabled and provider configured).
    _google_provider = provider in _GOOGLE_ALIASES
    api_key = getattr(cfg, "api_key", None)
    gemini_key = getattr(cfg, "gemini_api_key", None)
    _google_key_configured = _has_credential(gemini_key) or (
        _google_provider and _has_credential(api_key)
    )

    capabilities = AIGatewayCapabilities(
        reasoning=is_ready,
        chat=is_ready,
        rag=is_ready,
        course_planning=is_ready,
        quiz_generation=is_ready,
        image_generation=bool(cfg.image_model or _google_key_configured),
        voice_audio=bool(cfg.tts_model or _google_key_configured),
        # video_generation is always False: video is handled through the XPeX
        # asynchronous video-job pipeline (VideoJob / VideoFactory), not through
        # synchronous LLM routes.  This is an architecture invariant, not a
        # missing feature.
        video_generation=False,
    )

    return AIGatewayHealth(
        status=status,
        gateway="gxeon-ai",
        provider=provider,
        models=AIGatewayModels(
            fast=model_for_tier("fast"),
            standard=model_for_tier("standard"),
            pro=model_for_tier("pro"),
        ),
        capabilities=capabilities,
        security=AIGatewaySecurity(
            server_side_credentials=True,
            secrets_exposed=False,
        ),
        notes=AIGatewayNotes(
            video_generation=(
                "Managed through XPeX asynchronous video jobs/providers, "
                "not synchronous LLM routes."
            ),
            consumer_google_ai_pro=(
                "Consumer subscription is not treated as production API quota."
            ),
        ),
    )
