import pytest

from src.services.setup.xpex_pilot import (
    PilotAccount,
    assert_bootstrap_allowed,
    readiness_environment,
    validate_pilot_accounts,
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


@pytest.mark.parametrize("environment", ["prod", "production", "prod ", "", "prd"])
def test_bootstrap_fails_closed_for_unrecognized_environment(environment):
    with pytest.raises(RuntimeError, match="recognized non-production"):
        assert_bootstrap_allowed(
            {
                "ALLOW_PILOT_BOOTSTRAP": "true",
                "LEARNHOUSE_ENV": environment,
            }
        )


@pytest.mark.parametrize(
    "environment",
    ["dev", "development", "local", "staging", "test", "testing", " STAGING "],
)
def test_bootstrap_accepts_only_recognized_non_production_environments(environment):
    assert_bootstrap_allowed(
        {
            "ALLOW_PILOT_BOOTSTRAP": " TRUE ",
            "LEARNHOUSE_ENV": environment,
        }
    )


def valid_accounts():
    return [
        PilotAccount("administrator", "pilot-admin", "admin@example.test", "Strong!Pass123"),
        PilotAccount("teacher", "pilot-teacher", "teacher@example.test", "Strong!Pass123"),
        PilotAccount("student", "pilot-student", "student@example.test", "Strong!Pass123"),
    ]


def test_pilot_accounts_require_exactly_one_account_per_role():
    accounts = valid_accounts()
    accounts[2] = PilotAccount(
        "teacher",
        "second-teacher",
        "second-teacher@example.test",
        "Strong!Pass123",
    )
    with pytest.raises(ValueError, match="Exactly one administrator"):
        validate_pilot_accounts(accounts)


def test_pilot_accounts_reject_duplicate_usernames_before_mutation():
    accounts = valid_accounts()
    accounts[2] = PilotAccount(
        "student",
        "pilot-teacher",
        "student@example.test",
        "Strong!Pass123",
    )
    with pytest.raises(ValueError, match="usernames must be unique"):
        validate_pilot_accounts(accounts)


def test_pilot_accounts_reject_duplicate_emails_before_mutation():
    accounts = valid_accounts()
    accounts[2] = PilotAccount(
        "student",
        "pilot-student",
        "TEACHER@example.test",
        "Strong!Pass123",
    )
    with pytest.raises(ValueError, match="emails must be unique"):
        validate_pilot_accounts(accounts)
