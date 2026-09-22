from __future__ import annotations

from pydantic import BaseModel

from config.config import get_learnhouse_config
from src.services.ai.llm.tiers import model_for_tier


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
    """
    cfg = get_learnhouse_config().ai_config

    provider = (cfg.provider or "google").strip().lower()
    enabled = bool(cfg.is_ai_enabled)

    # Capability flags are derived from config *presence*, never from secret
    # values.  We check whether a key/model field is set (truthy), which tells
    # the caller that the capability is configured — the actual credential
    # never leaves the server.
    _google_provider = provider in {"google", "google-gla", "gemini"}
    _google_key_configured = bool(cfg.gemini_api_key or (_google_provider and cfg.api_key))

    capabilities = AIGatewayCapabilities(
        reasoning=enabled,
        chat=enabled,
        rag=enabled,
        course_planning=enabled,
        quiz_generation=enabled,
        image_generation=bool(cfg.image_model or _google_key_configured),
        voice_audio=bool(cfg.tts_model or _google_key_configured),
        # video_generation is always False: video is handled through the XPeX
        # asynchronous video-job pipeline (VideoJob / VideoFactory), not through
        # synchronous LLM routes.  This is an architecture invariant, not a
        # missing feature.
        video_generation=False,
    )

    return AIGatewayHealth(
        status="ready" if enabled else "disabled",
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
