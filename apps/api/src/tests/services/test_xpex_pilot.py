from unittest.mock import AsyncMock, Mock, patch

import pytest

from src.db.organizations import Organization
from src.db.roles import Role
from src.db.users import User
from src.services.setup.xpex_pilot import (
    PilotAccount,
    assert_bootstrap_allowed,
    bootstrap_pilot,
    readiness_environment,
)


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
    with pytest.raises(RuntimeError, match="allowed non-production"):
        assert_bootstrap_allowed({"ALLOW_PILOT_BOOTSTRAP": "true", "LEARNHOUSE_ENV": "prod"})


@pytest.mark.parametrize("environment", ["", "sandbox", " dev ", "PRODUCTION"])
def test_bootstrap_fails_closed_for_unknown_or_malformed_environment(environment):
    with pytest.raises(RuntimeError, match="allowed non-production"):
        assert_bootstrap_allowed({"ALLOW_PILOT_BOOTSTRAP": "true", "LEARNHOUSE_ENV": environment})


def _result(value):
    result = Mock()
    result.scalars.return_value.first.return_value = value
    return result


def _accounts():
    return [
        PilotAccount("administrator", "admin-test", "admin-test@example.com", "Valid-Admin-Password-123!"),
        PilotAccount("teacher", "teacher-test", "teacher-test@example.com", "Valid-Teacher-Password-123!"),
        PilotAccount("student", "student-test", "student-test@example.com", "Valid-Student-Password-123!"),
    ]


@pytest.mark.asyncio
async def test_username_conflict_is_detected_before_any_mutation():
    db = Mock()
    db.get = AsyncMock(side_effect=[Role(id=1, name="Admin"), Role(id=3, name="Instructor"), Role(id=4, name="User")])
    existing = User(id=99, username="admin-test", email="someone-else@example.test")
    db.execute = AsyncMock(side_effect=[_result(Organization(id=1, name="Pilot", slug="kelle-digital-lab", email="")), _result(None), _result(existing)])

    with patch.dict("os.environ", {"ALLOW_PILOT_BOOTSTRAP": "true", "LEARNHOUSE_ENV": "test"}, clear=True):
        with pytest.raises(ValueError, match="username conflict"):
            await bootstrap_pilot(db, _accounts())

    db.add.assert_not_called()
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_intermediate_failure_rolls_back_without_commit():
    db = Mock()
    db.get = AsyncMock(side_effect=[Role(id=1, name="Admin"), Role(id=3, name="Instructor"), Role(id=4, name="User")])
    db.execute = AsyncMock(side_effect=[_result(None)] + [_result(None)] * 6)
    db.flush = AsyncMock(side_effect=[None, RuntimeError("simulated failure")])
    db.commit = AsyncMock()
    db.rollback = AsyncMock()

    with patch.dict("os.environ", {"ALLOW_PILOT_BOOTSTRAP": "true", "LEARNHOUSE_ENV": "test"}, clear=True):
        with pytest.raises(RuntimeError, match="simulated failure"):
            await bootstrap_pilot(db, _accounts())

    db.commit.assert_not_awaited()
    db.rollback.assert_awaited_once()
