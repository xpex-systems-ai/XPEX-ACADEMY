import pytest

from src.services.setup.xpex_pilot import assert_bootstrap_allowed, readiness_environment


def test_readiness_reports_names_and_states_without_values():
    secret = "do-not-leak"
    result = readiness_environment({"LEARNHOUSE_AUTH_JWT_SECRET_KEY": secret})
    assert result["LEARNHOUSE_AUTH_JWT_SECRET_KEY"] == "ready"
    assert result["LEARNHOUSE_SQL_CONNECTION_STRING"] == "missing"
    assert secret not in repr(result)


def test_bootstrap_requires_explicit_gate():
    with pytest.raises(RuntimeError, match="ALLOW_PILOT_BOOTSTRAP"):
        assert_bootstrap_allowed({"LEARNHOUSE_ENV": "dev"})


def test_bootstrap_refuses_production_even_with_gate():
    with pytest.raises(RuntimeError, match="forbidden in production"):
        assert_bootstrap_allowed({"ALLOW_PILOT_BOOTSTRAP": "true", "LEARNHOUSE_ENV": "prod"})
