from types import SimpleNamespace

from src.services.ai.llm import provider, tiers


def test_openrouter_uses_existing_xpex_secret_when_core_key_missing(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-openrouter-secret")
    cfg = SimpleNamespace(api_key=None)

    assert provider._resolve_api_key("openrouter", cfg) == "test-openrouter-secret"


def test_explicit_core_key_takes_precedence_over_openrouter_secret(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "fallback-secret")
    cfg = SimpleNamespace(api_key="explicit-core-secret")

    assert provider._resolve_api_key("openrouter", cfg) == "explicit-core-secret"


def test_non_openrouter_provider_does_not_consume_openrouter_secret(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "openrouter-only-secret")
    cfg = SimpleNamespace(api_key=None)

    assert provider._resolve_api_key("google", cfg) is None


def test_openrouter_uses_gateway_safe_model_default(monkeypatch):
    cfg = SimpleNamespace(
        provider="openrouter",
        model_fast=None,
        model_standard=None,
        model_pro=None,
    )
    monkeypatch.setattr(
        tiers,
        "get_learnhouse_config",
        lambda: SimpleNamespace(ai_config=cfg),
    )

    assert tiers.model_for_tier("fast") == "openrouter/auto"
    assert tiers.model_for_tier("standard") == "openrouter/auto"
    assert tiers.model_for_tier("pro") == "openrouter/auto"


def test_explicit_openrouter_model_still_wins(monkeypatch):
    cfg = SimpleNamespace(
        provider="openrouter",
        model_fast="openai/gpt-4o-mini",
        model_standard=None,
        model_pro=None,
    )
    monkeypatch.setattr(
        tiers,
        "get_learnhouse_config",
        lambda: SimpleNamespace(ai_config=cfg),
    )

    assert tiers.model_for_tier("fast") == "openai/gpt-4o-mini"
