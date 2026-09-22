"""Tests for the XPeX AI Gateway health endpoint — XPEX-GEMINI-CORE-001.

Covers the security and contract requirements:
  - ROUTE AUTH: exercises actual FastAPI route GET /xpex/ai-gateway/health
    * anonymous -> 401
    * authenticated -> 200 + typed AIGatewayHealth payload
    * fails if Depends(get_authenticated_user) is removed
  - GATEWAY READINESS:
    * is_ai_enabled=True does NOT automatically mean status="ready"
    * enabled-but-unconfigured provider reports status="unconfigured"
    * Google/Gemini with no usable API key reports "unconfigured"
    * Ollama and Bedrock require no API key and report "ready"
    * OpenRouter uses OPENROUTER_API_KEY when available
    * AI disabled reports "disabled"
  - SECRETS: response payload contains no secret fields or values
  - NO LIVE CALLS: health inspection makes no paid/external provider call
"""

from __future__ import annotations

import inspect
import os
import sys
from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

# Ensure mocks exist in sys.modules for optional video-pipeline dependencies
# not required by the AI gateway (edge_tts, huggingface_hub).
for _mod in ("edge_tts", "huggingface_hub"):
    if _mod not in sys.modules:
        sys.modules[_mod] = MagicMock()

from src.db.users import PublicUser
from src.routers.xpex import router as xpex_router
from src.security.auth import get_authenticated_user
from src.services.xpex.ai_gateway import (
    AIGatewayCapabilities,
    AIGatewayHealth,
    AIGatewayModels,
    AIGatewayNotes,
    AIGatewaySecurity,
    get_ai_gateway_capabilities,
    is_provider_configured,
)

# ---------------------------------------------------------------------------
# Helpers — build minimal fake AIConfig and check secrets
# ---------------------------------------------------------------------------

_SECRET_FIELD_NAMES = {
    "api_key",
    "gemini_api_key",
    "auth_jwt_secret_key",
    "password",
    "credential",
    "bearer",
    "access_key",
    "private_key",
}

_SAFE_FIELD_NAMES = {
    "secrets_exposed",
    "server_side_credentials",
}


def _has_secret_field(obj: Any, path: str = "") -> bool:
    """Recursively check whether obj contains any secret field name."""
    if isinstance(obj, dict):
        for key, value in obj.items():
            if key in _SAFE_FIELD_NAMES:
                continue
            if any(s in key.lower() for s in _SECRET_FIELD_NAMES):
                return True
            if _has_secret_field(value, path=f"{path}.{key}"):
                return True
    elif hasattr(obj, "model_dump"):
        return _has_secret_field(obj.model_dump(), path=path)
    elif isinstance(obj, list):
        return any(_has_secret_field(item, path=path) for item in obj)
    return False


def _make_ai_config(
    *,
    is_ai_enabled: bool = True,
    provider: str = "google",
    api_key: str | None = None,
    gemini_api_key: str | None = None,
    image_model: str | None = None,
    tts_model: str | None = None,
    model_fast: str | None = None,
    model_standard: str | None = None,
    model_pro: str | None = None,
) -> MagicMock:
    """Return a minimal fake AIConfig for testing."""
    cfg = MagicMock()
    cfg.is_ai_enabled = is_ai_enabled
    cfg.provider = provider
    cfg.api_key = api_key
    cfg.gemini_api_key = gemini_api_key
    cfg.image_model = image_model
    cfg.tts_model = tts_model
    cfg.model_fast = model_fast
    cfg.model_standard = model_standard
    cfg.model_pro = model_pro
    return cfg


def _patched_config(ai_cfg: MagicMock):
    lh_cfg = MagicMock()
    lh_cfg.ai_config = ai_cfg
    return patch(
        "src.services.xpex.ai_gateway.get_learnhouse_config",
        return_value=lh_cfg,
    )


def _patched_tiers(ai_cfg: MagicMock):
    lh_cfg = MagicMock()
    lh_cfg.ai_config = ai_cfg
    return patch(
        "src.services.ai.llm.tiers.get_learnhouse_config",
        return_value=lh_cfg,
    )


@pytest.fixture
def xpex_app():
    """FastAPI test app mounting the real xpex.router at prefix '/xpex'."""
    app = FastAPI()
    app.include_router(xpex_router, prefix="/xpex")
    return app


@pytest.fixture
def mock_user():
    return PublicUser(
        id=1,
        username="test_student",
        first_name="Test",
        last_name="Student",
        email="student@xpex.com",
        user_uuid="user_student_uuid",
    )


# ---------------------------------------------------------------------------
# REAL ROUTE AUTH TESTS (GET /xpex/ai-gateway/health)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_route_health_anonymous_rejected_with_401(xpex_app):
    """Anonymous request to the actual route must receive HTTP 401."""
    async with AsyncClient(
        transport=ASGITransport(app=xpex_app), base_url="http://test"
    ) as client:
        response = await client.get("/xpex/ai-gateway/health")

    assert response.status_code == 401
    assert response.headers.get("www-authenticate") == "Bearer"


@pytest.mark.asyncio
async def test_route_health_authenticated_returns_200_and_typed_payload(
    xpex_app, mock_user
):
    """Authenticated request to the actual route returns 200 and valid AIGatewayHealth."""
    xpex_app.dependency_overrides[get_authenticated_user] = lambda: mock_user

    ai_cfg = _make_ai_config(
        is_ai_enabled=True,
        provider="google",
        api_key="valid-test-key",
    )
    try:
        with _patched_config(ai_cfg), _patched_tiers(ai_cfg):
            async with AsyncClient(
                transport=ASGITransport(app=xpex_app), base_url="http://test"
            ) as client:
                response = await client.get("/xpex/ai-gateway/health")

        assert response.status_code == 200
        data = response.json()
        health = AIGatewayHealth.model_validate(data)
        assert health.status == "ready"
        assert health.gateway == "gxeon-ai"
        assert health.provider == "google"
        assert health.capabilities.reasoning is True
        assert health.capabilities.video_generation is False
        assert health.security.secrets_exposed is False
    finally:
        xpex_app.dependency_overrides.clear()


def test_route_explicitly_declares_get_authenticated_user_dependency():
    """Verify that /ai-gateway/health directly declares Depends(get_authenticated_user).

    This ensures the test suite fails if someone removes Depends(get_authenticated_user).
    """
    target_route = None
    for route in xpex_router.routes:
        if getattr(route, "path", None) == "/ai-gateway/health":
            target_route = route
            break

    assert target_route is not None, "Route /ai-gateway/health must exist in xpex.router"

    sig = inspect.signature(target_route.endpoint)
    has_auth_dep = False
    for param in sig.parameters.values():
        if hasattr(param.annotation, "__metadata__"):
            for meta in param.annotation.__metadata__:
                if getattr(meta, "dependency", None) is get_authenticated_user:
                    has_auth_dep = True
                    break

    assert has_auth_dep, (
        "ai_gateway_health endpoint MUST declare Depends(get_authenticated_user)"
    )


# ---------------------------------------------------------------------------
# GATEWAY READINESS & CONFIGURATION SEMANTICS
# ---------------------------------------------------------------------------


def test_readiness_enabled_but_unconfigured_google_reports_unconfigured():
    """is_ai_enabled=True must NOT report 'ready' when Google has no usable key."""
    ai_cfg = _make_ai_config(
        is_ai_enabled=True,
        provider="google",
        api_key=None,
        gemini_api_key=None,
    )
    with _patched_config(ai_cfg), _patched_tiers(ai_cfg):
        result = get_ai_gateway_capabilities()

    assert result.status == "unconfigured"
    assert result.capabilities.reasoning is False
    assert result.capabilities.chat is False
    assert result.capabilities.rag is False
    assert result.capabilities.course_planning is False
    assert result.capabilities.quiz_generation is False


def test_readiness_enabled_but_whitespace_key_reports_unconfigured():
    """Whitespace-only API key must be treated as unconfigured."""
    ai_cfg = _make_ai_config(
        is_ai_enabled=True,
        provider="google",
        api_key="   ",
        gemini_api_key="",
    )
    with _patched_config(ai_cfg), _patched_tiers(ai_cfg):
        result = get_ai_gateway_capabilities()

    assert result.status == "unconfigured"
    assert result.capabilities.reasoning is False


@pytest.mark.parametrize("alias", ["google", "google-gla", "gemini"])
def test_readiness_gemini_aliases_without_keys_report_unconfigured(alias: str):
    """Google/Gemini aliases without usable keys must report unconfigured."""
    ai_cfg = _make_ai_config(
        is_ai_enabled=True,
        provider=alias,
        api_key=None,
        gemini_api_key=None,
    )
    with _patched_config(ai_cfg), _patched_tiers(ai_cfg):
        result = get_ai_gateway_capabilities()

    assert result.status == "unconfigured"
    assert result.capabilities.reasoning is False


def test_readiness_other_provider_without_key_reports_unconfigured():
    """Providers requiring an API key report unconfigured when key is absent."""
    ai_cfg = _make_ai_config(
        is_ai_enabled=True,
        provider="anthropic",
        api_key=None,
    )
    with _patched_config(ai_cfg), _patched_tiers(ai_cfg):
        result = get_ai_gateway_capabilities()

    assert result.status == "unconfigured"
    assert result.capabilities.reasoning is False


def test_readiness_ollama_requires_no_key_and_reports_ready():
    """Ollama is a local runtime and reports ready without an API key."""
    ai_cfg = _make_ai_config(
        is_ai_enabled=True,
        provider="ollama",
        api_key=None,
    )
    with _patched_config(ai_cfg), _patched_tiers(ai_cfg):
        result = get_ai_gateway_capabilities()

    assert result.status == "ready"
    assert result.capabilities.reasoning is True
    assert result.capabilities.chat is True


def test_readiness_bedrock_requires_no_key_and_reports_ready():
    """AWS Bedrock uses ambient IAM credentials and reports ready without an API key."""
    ai_cfg = _make_ai_config(
        is_ai_enabled=True,
        provider="bedrock",
        api_key=None,
    )
    with _patched_config(ai_cfg), _patched_tiers(ai_cfg):
        result = get_ai_gateway_capabilities()

    assert result.status == "ready"
    assert result.capabilities.reasoning is True


def test_readiness_openrouter_uses_env_key():
    """OpenRouter resolves OPENROUTER_API_KEY from the environment."""
    ai_cfg = _make_ai_config(
        is_ai_enabled=True,
        provider="openrouter",
        api_key=None,
    )
    with (
        _patched_config(ai_cfg),
        _patched_tiers(ai_cfg),
        patch.dict(os.environ, {"OPENROUTER_API_KEY": "sk-or-test-key"}),
    ):
        result = get_ai_gateway_capabilities()

    assert result.status == "ready"
    assert result.capabilities.reasoning is True


def test_readiness_openrouter_without_any_key_is_unconfigured():
    """OpenRouter reports unconfigured when neither config nor env has a key."""
    ai_cfg = _make_ai_config(
        is_ai_enabled=True,
        provider="openrouter",
        api_key=None,
    )
    with (
        _patched_config(ai_cfg),
        _patched_tiers(ai_cfg),
        patch.dict(os.environ, {}, clear=True),
    ):
        result = get_ai_gateway_capabilities()

    assert result.status == "unconfigured"
    assert result.capabilities.reasoning is False


def test_readiness_disabled_ai_always_reports_disabled():
    """When is_ai_enabled=False, status is 'disabled' regardless of credentials."""
    ai_cfg = _make_ai_config(
        is_ai_enabled=False,
        provider="google",
        api_key="some-key",
        gemini_api_key="some-gemini-key",
    )
    with _patched_config(ai_cfg), _patched_tiers(ai_cfg):
        result = get_ai_gateway_capabilities()

    assert result.status == "disabled"
    assert result.capabilities.reasoning is False
    assert result.capabilities.chat is False


def test_is_provider_configured_helper_semantics():
    """Unit tests for the is_provider_configured helper function."""
    cfg = MagicMock()
    cfg.api_key = None
    cfg.gemini_api_key = None

    # Google needs at least one key
    assert is_provider_configured("google", cfg) is False
    cfg.gemini_api_key = "test-gemini-key"
    assert is_provider_configured("google", cfg) is True
    cfg.gemini_api_key = None

    # Ollama and Bedrock need no keys
    assert is_provider_configured("ollama", cfg) is True
    assert is_provider_configured("bedrock", cfg) is True

    # Unknown provider
    assert is_provider_configured("unknown-provider-xyz", cfg) is False


# ---------------------------------------------------------------------------
# SECRETS & INTEGRATION INVARIANTS
# ---------------------------------------------------------------------------


def test_health_response_contains_no_secrets():
    """The serialized response must never expose secrets or credentials."""
    fake_api_key = "sk-xpex-super-secret-key-12345"
    ai_cfg = _make_ai_config(
        is_ai_enabled=True,
        provider="google",
        api_key=fake_api_key,
        gemini_api_key=fake_api_key,
    )
    with _patched_config(ai_cfg), _patched_tiers(ai_cfg):
        result = get_ai_gateway_capabilities()

    payload = result.model_dump(mode="json")
    payload_str = str(payload)

    assert fake_api_key not in payload_str
    assert not _has_secret_field(payload)


def test_health_makes_no_external_provider_call():
    """get_ai_gateway_capabilities() must never invoke a live provider SDK."""
    ai_cfg = _make_ai_config(
        is_ai_enabled=True,
        provider="google",
        api_key="fake-key",
    )
    with (
        _patched_config(ai_cfg),
        _patched_tiers(ai_cfg),
        patch(
            "pydantic_ai.models.google.GoogleModel",
            side_effect=AssertionError("GoogleModel instantiated"),
        ),
        patch(
            "pydantic_ai.providers.google.GoogleProvider",
            side_effect=AssertionError("GoogleProvider instantiated"),
        ),
    ):
        result = get_ai_gateway_capabilities()

    assert isinstance(result, AIGatewayHealth)


def test_video_generation_is_always_false():
    """Video generation is always False (managed by async pipeline)."""
    ai_cfg = _make_ai_config(
        is_ai_enabled=True,
        provider="google",
        api_key="fake-key",
    )
    with _patched_config(ai_cfg), _patched_tiers(ai_cfg):
        result = get_ai_gateway_capabilities()

    assert result.capabilities.video_generation is False


def test_ai_gateway_health_model_structure():
    """AIGatewayHealth serializes and deserializes cleanly."""
    health = AIGatewayHealth(
        status="ready",
        gateway="gxeon-ai",
        provider="google",
        models=AIGatewayModels(
            fast="gemini-3.1-flash-lite",
            standard="gemini-3.5-flash",
            pro="gemini-3.1-pro-preview",
        ),
        capabilities=AIGatewayCapabilities(
            reasoning=True,
            chat=True,
            rag=True,
            course_planning=True,
            quiz_generation=True,
            image_generation=True,
            voice_audio=True,
            video_generation=False,
        ),
        security=AIGatewaySecurity(
            server_side_credentials=True,
            secrets_exposed=False,
        ),
        notes=AIGatewayNotes(
            video_generation="async",
            consumer_google_ai_pro="separate",
        ),
    )

    data = health.model_dump(mode="json")
    assert data["status"] == "ready"
    assert data["capabilities"]["video_generation"] is False
    assert data["security"]["secrets_exposed"] is False

    reconstructed = AIGatewayHealth.model_validate(data)
    assert reconstructed == health
