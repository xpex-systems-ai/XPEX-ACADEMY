"""Tests for the XPeX AI Gateway health endpoint — XPEX-GEMINI-CORE-001.

Covers the 7 required security and contract scenarios:
  TEST 1 — unauthenticated request is rejected (HTTP 401)
  TEST 2 — authenticated request receives a valid capability response
  TEST 3 — response payload contains no secret fields
  TEST 4 — AI disabled returns a safe disabled state
  TEST 5 — Google/Gemini aliases resolve through the existing provider model
  TEST 6 — health endpoint makes no external paid provider call
  TEST 7 — existing unrelated AI routes remain compatible (no regression)

CI requirements:
  - No real GEMINI_API_KEY needed — all AI config is injected via patched config.
  - Tests are hermetically isolated via function-scoped patches.
  - The FastAPI app dependency override pattern is used to inject auth state.
"""

from __future__ import annotations

import os
import sys

# ---------------------------------------------------------------------------
# Path bootstrap (must be before any app imports)
# ---------------------------------------------------------------------------
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

os.environ.setdefault("TESTING", "true")
os.environ.setdefault(
    "LEARNHOUSE_AUTH_JWT_SECRET_KEY",
    "test-secret-key-for-unit-tests-32chars!",
)

# ---------------------------------------------------------------------------
# Standard imports
# ---------------------------------------------------------------------------
from typing import Any
from unittest.mock import MagicMock, patch

import pytest

from src.db.users import AnonymousUser, PublicUser
from src.services.xpex.ai_gateway import (
    AIGatewayCapabilities,
    AIGatewayHealth,
    AIGatewayModels,
    AIGatewayNotes,
    AIGatewaySecurity,
    get_ai_gateway_capabilities,
)

# ---------------------------------------------------------------------------
# Helpers — build a minimal fake AIConfig
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
# Field names that superficially look like secrets but are safe attestation
# booleans present in the response by design.
_SAFE_FIELD_NAMES = {
    "secrets_exposed",          # AIGatewaySecurity — boolean, not a credential
    "server_side_credentials",  # AIGatewaySecurity — boolean, not a credential
}


def _has_secret_field(obj: Any, path: str = "") -> bool:
    """Recursively check whether ``obj`` (dict/model) contains any secret field name.

    Fields in ``_SAFE_FIELD_NAMES`` are explicitly excluded — they are boolean
    attestation flags that contain the substring 'secret' or 'credential' in
    their key names by design but carry no credential value.
    """
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
    """Return a minimal fake AIConfig to drive `get_ai_gateway_capabilities()`."""
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
    """Context manager that patches get_learnhouse_config() with the given ai_config."""
    lh_cfg = MagicMock()
    lh_cfg.ai_config = ai_cfg
    return patch(
        "src.services.xpex.ai_gateway.get_learnhouse_config",
        return_value=lh_cfg,
    )


def _patched_tiers(ai_cfg: MagicMock):
    """Context manager that patches get_learnhouse_config() inside tiers.py as well."""
    lh_cfg = MagicMock()
    lh_cfg.ai_config = ai_cfg
    return patch(
        "src.services.ai.llm.tiers.get_learnhouse_config",
        return_value=lh_cfg,
    )


# ---------------------------------------------------------------------------
# TEST 1 — Unauthenticated request is rejected
# ---------------------------------------------------------------------------


def test_health_endpoint_rejects_anonymous_user():
    """TEST 1: The auth dependency must block AnonymousUser with 401.

    We verify the guard directly against the ``non_public_endpoint`` function
    that ``get_authenticated_user`` delegates to when it resolves an AnonymousUser.
    Uses asyncio.run() (Python 3.10+ / 3.14-safe) instead of get_event_loop().
    """
    import asyncio
    from fastapi import HTTPException
    from src.security.auth import non_public_endpoint

    anonymous = AnonymousUser()

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(non_public_endpoint(anonymous))

    assert exc_info.value.status_code == 401, (
        "Anonymous users must receive HTTP 401 — got "
        f"{exc_info.value.status_code}"
    )


# ---------------------------------------------------------------------------
# TEST 2 — Authenticated request receives a valid capability response
# ---------------------------------------------------------------------------


def test_health_returns_valid_capability_response_when_enabled():
    """TEST 2: A properly authenticated user sees a valid AIGatewayHealth response."""
    ai_cfg = _make_ai_config(
        is_ai_enabled=True,
        provider="google",
        api_key="fake-key-not-real",
    )
    with _patched_config(ai_cfg), _patched_tiers(ai_cfg):
        result = get_ai_gateway_capabilities()

    assert isinstance(result, AIGatewayHealth), (
        f"Expected AIGatewayHealth, got {type(result)}"
    )
    assert result.status == "ready"
    assert result.gateway == "gxeon-ai"
    assert result.provider == "google"

    # All core text/reasoning caps must be enabled
    assert result.capabilities.reasoning is True
    assert result.capabilities.chat is True
    assert result.capabilities.rag is True
    assert result.capabilities.course_planning is True
    assert result.capabilities.quiz_generation is True

    # video_generation MUST always be False (async job pipeline)
    assert result.capabilities.video_generation is False

    # Models must be non-empty strings
    assert isinstance(result.models.fast, str) and result.models.fast
    assert isinstance(result.models.standard, str) and result.models.standard
    assert isinstance(result.models.pro, str) and result.models.pro

    # Security attestation
    assert result.security.server_side_credentials is True
    assert result.security.secrets_exposed is False


# ---------------------------------------------------------------------------
# TEST 3 — Response payload contains no secret fields
# ---------------------------------------------------------------------------


def test_health_response_contains_no_secrets():
    """TEST 3: The serialized response must not include any field that could be a secret.

    We intentionally inject a fake API key into config and verify it DOES NOT
    appear in the serialized response — neither as a field name nor as a value.
    """
    fake_api_key = "sk-xpex-test-super-secret-key-123456"
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

    # The secret value must never appear in the serialized output
    assert fake_api_key not in payload_str, (
        "API key value leaked into the health response payload!"
    )

    # No secret field names must appear in the payload dict keys (recursive)
    assert not _has_secret_field(payload), (
        "A field with a secret-like name was found in the health response payload."
    )


# ---------------------------------------------------------------------------
# TEST 4 — AI disabled returns a safe disabled state
# ---------------------------------------------------------------------------


def test_health_returns_disabled_state_when_ai_off():
    """TEST 4: When is_ai_enabled=False, all capability flags are False and status is 'disabled'."""
    ai_cfg = _make_ai_config(
        is_ai_enabled=False,
        provider="google",
        api_key=None,
        gemini_api_key=None,
    )
    with _patched_config(ai_cfg), _patched_tiers(ai_cfg):
        result = get_ai_gateway_capabilities()

    assert result.status == "disabled"
    assert result.capabilities.reasoning is False
    assert result.capabilities.chat is False
    assert result.capabilities.rag is False
    assert result.capabilities.course_planning is False
    assert result.capabilities.quiz_generation is False
    assert result.capabilities.video_generation is False
    # image/voice may still reflect key presence even when AI is disabled;
    # the important contract is status="disabled" and core caps=False.


# ---------------------------------------------------------------------------
# TEST 5 — Google/Gemini aliases resolve through the existing provider model
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("alias", ["google", "google-gla", "gemini"])
def test_google_aliases_resolve_through_provider_model(alias: str):
    """TEST 5: All Google/Gemini aliases are treated identically by the service layer.

    The provider field in the response must be the normalized lowercase alias.
    Image and voice capabilities must be True when a Gemini key is present.
    """
    ai_cfg = _make_ai_config(
        is_ai_enabled=True,
        provider=alias,
        api_key="fake-google-key",
    )
    with _patched_config(ai_cfg), _patched_tiers(ai_cfg):
        result = get_ai_gateway_capabilities()

    assert result.provider == alias.lower(), (
        f"Provider '{alias}' was not preserved as-is in the response"
    )
    # All aliases with api_key should expose image + voice capabilities
    assert result.capabilities.image_generation is True, (
        f"image_generation should be True for provider '{alias}' with a key set"
    )
    assert result.capabilities.voice_audio is True, (
        f"voice_audio should be True for provider '{alias}' with a key set"
    )


# ---------------------------------------------------------------------------
# TEST 6 — Health endpoint makes no external paid provider call
# ---------------------------------------------------------------------------


def test_health_makes_no_external_provider_call():
    """TEST 6: ``get_ai_gateway_capabilities()`` must never call a live provider.

    We patch the Pydantic AI Google model/provider constructors which are the
    actual call path used by build_model().  If the health function were to
    accidentally call build_model() or a provider SDK, the patched constructors
    would raise AssertionError and the test would fail.

    Note: google.generativeai is not patched here because it is not installed
    in the local test environment (image/TTS use the Google GenAI SDK only
    at call time, not at import time).  The pydantic_ai patches are sufficient
    to prove the synchronous health path makes no provider call.
    """
    ai_cfg = _make_ai_config(
        is_ai_enabled=True,
        provider="google",
        api_key="fake-key",
    )

    with (
        _patched_config(ai_cfg),
        _patched_tiers(ai_cfg),
        patch("pydantic_ai.models.google.GoogleModel", side_effect=AssertionError("GoogleModel was instantiated — provider was called!")),
        patch("pydantic_ai.providers.google.GoogleProvider", side_effect=AssertionError("GoogleProvider was instantiated — provider was called!")),
    ):
        # Must NOT raise — if it does, a provider constructor was invoked
        result = get_ai_gateway_capabilities()

    assert isinstance(result, AIGatewayHealth)


# ---------------------------------------------------------------------------
# TEST 7 — Existing unrelated AI routes remain compatible (smoke check)
# ---------------------------------------------------------------------------


def test_existing_ai_service_imports_are_unbroken():
    """TEST 7: Core AI service modules affected by the refactor still import correctly.

    We verify the provider/tiers/ai_gateway modules export their primary symbols
    and that model_for_tier() still works correctly — without importing the full
    xpex router (which pulls in video_local_tts → edge_tts, an optional dep
    not installed in the unit-test environment).

    The router's changed import (AIGatewayHealth) is exercised indirectly by
    importing ai_gateway directly and confirming the symbol is exported.
    """
    # Verify the provider module still exports its primary symbols
    from src.services.ai.llm.provider import build_model, AINotConfiguredError  # noqa: F401

    # Verify the tiers module still exports its primary symbols
    from src.services.ai.llm.tiers import model_for_tier, resolve_model_for_org  # noqa: F401

    # Verify the ai_gateway module (the changed file) exports all expected symbols
    from src.services.xpex.ai_gateway import (  # noqa: F401
        AIGatewayCapabilities,
        AIGatewayHealth,
        AIGatewayModels,
        AIGatewayNotes,
        AIGatewaySecurity,
        get_ai_gateway_capabilities,
    )

    # Verify auth module exports the dependency used in the router fix
    from src.security.auth import get_authenticated_user, non_public_endpoint  # noqa: F401

    # Verify model_for_tier still works with the standard tier names
    ai_cfg = _make_ai_config(
        is_ai_enabled=True,
        provider="google",
        model_fast="gemini-3.1-flash-lite",
        model_standard="gemini-3.5-flash",
        model_pro="gemini-3.1-pro-preview",
    )
    lh_cfg = MagicMock()
    lh_cfg.ai_config = ai_cfg
    with patch("src.services.ai.llm.tiers.get_learnhouse_config", return_value=lh_cfg):
        assert model_for_tier("fast") == "gemini-3.1-flash-lite"
        assert model_for_tier("standard") == "gemini-3.5-flash"
        assert model_for_tier("pro") == "gemini-3.1-pro-preview"


# ---------------------------------------------------------------------------
# Bonus: Typed model structure tests
# ---------------------------------------------------------------------------


def test_ai_gateway_health_model_structure():
    """The AIGatewayHealth model must serialise cleanly to/from JSON."""
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

    # Round-trip: from dict back to model
    reconstructed = AIGatewayHealth.model_validate(data)
    assert reconstructed == health


def test_video_generation_is_always_false():
    """Architecture invariant: video_generation must always be False in the health response.

    This test verifies that even if someone accidentally sets a video-related
    config key, the sync gateway still reports video_generation=False.
    """
    ai_cfg = _make_ai_config(
        is_ai_enabled=True,
        provider="google",
        api_key="fake",
    )
    # Inject a fake video_model attribute to stress-test the invariant
    ai_cfg.video_model = "some-video-model"

    with _patched_config(ai_cfg), _patched_tiers(ai_cfg):
        result = get_ai_gateway_capabilities()

    assert result.capabilities.video_generation is False, (
        "video_generation must ALWAYS be False — "
        "video is managed through async XPeX job pipeline, not sync LLM routes."
    )
