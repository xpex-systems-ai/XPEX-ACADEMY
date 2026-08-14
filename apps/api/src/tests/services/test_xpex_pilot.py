from unittest.mock import AsyncMock, Mock, patch

import pytest

from src.db.organizations import Organization
from src.db.roles import Role
from src.db.user_organizations import UserOrganization
from src.db.users import User
from src.security.security import security_hash_password
from src.services.setup.xpex_pilot import (
    PilotAccount,
    PilotConfigurationError,
    assert_bootstrap_allowed,
    bootstrap_pilot,
    pilot_accounts_from_environment,
    readiness_environment,
    validate_distinct_accounts,
)


def test_readiness_reports_names_and_states_without_values():
    secret = "do-not-leak"
    result = readiness_environment({"LEARNHOUSE_AUTH_JWT_SECRET_KEY": secret})
    assert result["LEARNHOUSE_AUTH_JWT_SECRET_KEY"] == "ready"
    assert result["LEARNHOUSE_SQL_CONNECTION_STRING"] == "missing"
    assert secret not in repr(result)


@pytest.mark.parametrize(
    "name",
    [
        "XPEX_PILOT_ADMIN_USERNAME",
        "XPEX_PILOT_ADMIN_PASSWORD",
        "XPEX_PILOT_TEACHER_EMAIL",
        "XPEX_PILOT_STUDENT_PASSWORD",
        "ALLOW_PILOT_BOOTSTRAP",
    ],
)
def test_readiness_reports_every_missing_pilot_variable(name):
    assert readiness_environment({})[name] == "missing"


def test_readiness_never_returns_password_values():
    password = "Never-Print-This-Password-123!"
    result = readiness_environment({"XPEX_PILOT_ADMIN_PASSWORD": password})
    assert result["XPEX_PILOT_ADMIN_PASSWORD"] == "ready"
    assert password not in repr(result)


def test_missing_account_environment_is_a_controlled_error_without_keyerror():
    with pytest.raises(PilotConfigurationError, match="XPEX_PILOT_ADMIN_USERNAME"):
        pilot_accounts_from_environment({})


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


class _Query:
    def __init__(self, model):
        self.model = model
        self.filters = {}

    def where(self, *criteria):
        for criterion in criteria:
            left = criterion.left
            key = left.key if getattr(left, "key", None) else next(iter(left.clauses)).key
            self.filters[key] = criterion.right.value
        return self


class _StatefulSession:
    def __init__(self):
        self.organizations = []
        self.users = []
        self.memberships = []
        self.commit_count = 0

    async def get(self, model, object_id):
        return Role(id=object_id, name=f"Role {object_id}") if model is Role else None

    async def execute(self, query):
        collection = {
            Organization: self.organizations,
            User: self.users,
            UserOrganization: self.memberships,
        }[query.model]
        value = next(
            (item for item in collection if all(getattr(item, key) == expected for key, expected in query.filters.items())),
            None,
        )
        return _result(value)

    def add(self, value):
        if isinstance(value, Organization):
            self.organizations.append(value)
        elif isinstance(value, User):
            self.users.append(value)
        elif isinstance(value, UserOrganization):
            self.memberships.append(value)

    async def flush(self):
        for index, org in enumerate(self.organizations, 1):
            org.id = org.id or index
        for index, user in enumerate(self.users, 1):
            user.id = user.id or index

    async def commit(self):
        self.commit_count += 1

    async def rollback(self):
        raise AssertionError("rollback should not run in successful idempotency test")


def _accounts():
    return [
        PilotAccount("administrator", "admin-test", "admin-test@example.com", "Valid-Admin-Password-123!"),
        PilotAccount("teacher", "teacher-test", "teacher-test@example.com", "Valid-Teacher-Password-123!"),
        PilotAccount("student", "student-test", "student-test@example.com", "Valid-Student-Password-123!"),
    ]


@pytest.mark.asyncio
async def test_three_bootstrap_runs_remain_idempotent():
    db = _StatefulSession()
    environment = {"ALLOW_PILOT_BOOTSTRAP": "true", "LEARNHOUSE_ENV": "test"}
    with patch("src.services.setup.xpex_pilot.select", side_effect=lambda model: _Query(model)):
        with patch.dict("os.environ", environment, clear=True):
            results = [await bootstrap_pilot(db, _accounts()) for _ in range(3)]

    assert all(result == {"organization": "ready", "administrator": "ready", "teacher": "ready", "student": "ready"} for result in results)
    assert len(db.organizations) == 1
    assert len(db.users) == 3
    assert len(db.memberships) == 3
    assert db.commit_count == 3


@pytest.mark.parametrize(
    ("left", "right", "field"),
    [
        (0, 1, "email"),
        (1, 2, "email"),
        (0, 2, "username"),
    ],
)
def test_pilot_roles_require_distinct_normalized_identities(left, right, field):
    accounts = _accounts()
    shared = getattr(accounts[left], field)
    replacement = PilotAccount(
        accounts[right].role,
        shared if field == "username" else accounts[right].username,
        f"  {shared.upper()}  " if field == "email" else accounts[right].email,
        accounts[right].password,
    )
    accounts[right] = replacement
    with pytest.raises(PilotConfigurationError, match=f"Duplicate pilot {field}"):
        validate_distinct_accounts(accounts)


def test_all_three_roles_cannot_share_one_identity():
    accounts = [
        PilotAccount(role, "same-user", "same@example.com", f"Valid-{role}-Password-123!")
        for role in ("administrator", "teacher", "student")
    ]
    with pytest.raises(PilotConfigurationError, match="Duplicate pilot username"):
        validate_distinct_accounts(accounts)


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
@pytest.mark.parametrize(
    ("verified", "locked_until", "password", "message"),
    [
        (False, None, "Valid-Admin-Password-123!", "not email-verified"),
        (True, "2999-01-01T00:00:00+00:00", "Valid-Admin-Password-123!", "is locked"),
        (True, None, "Different-Password-123!", "credentials cannot be verified"),
    ],
)
async def test_existing_unusable_account_is_refused_without_mutation(verified, locked_until, password, message):
    db = Mock()
    db.get = AsyncMock(side_effect=[Role(id=1, name="Admin"), Role(id=3, name="Instructor"), Role(id=4, name="User")])
    existing = User(
        id=99,
        username="admin-test",
        email="admin-test@example.com",
        password=security_hash_password(password),
        email_verified=verified,
        locked_until=locked_until,
    )
    db.execute = AsyncMock(side_effect=[_result(Organization(id=1, name="Pilot", slug="kelle-digital-lab", email="")), _result(existing), _result(existing)])

    with patch.dict("os.environ", {"ALLOW_PILOT_BOOTSTRAP": "true", "LEARNHOUSE_ENV": "test"}, clear=True):
        with pytest.raises(ValueError, match=message):
            await bootstrap_pilot(db, _accounts())

    db.add.assert_not_called()
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_existing_conflicting_membership_is_refused_before_mutation():
    db = Mock()
    db.get = AsyncMock(side_effect=[Role(id=1, name="Admin"), Role(id=3, name="Instructor"), Role(id=4, name="User")])
    existing = User(
        id=99,
        username="admin-test",
        email="admin-test@example.com",
        password=security_hash_password("Valid-Admin-Password-123!"),
        email_verified=True,
    )
    membership = UserOrganization(id=1, user_id=99, org_id=1, role_id=4, creation_date="", update_date="")
    db.execute = AsyncMock(side_effect=[
        _result(Organization(id=1, name="Pilot", slug="kelle-digital-lab", email="")),
        _result(existing),
        _result(existing),
        _result(membership),
    ])

    with patch.dict("os.environ", {"ALLOW_PILOT_BOOTSTRAP": "true", "LEARNHOUSE_ENV": "test"}, clear=True):
        with pytest.raises(ValueError, match="membership conflict"):
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


@pytest.mark.asyncio
async def test_membership_creation_failure_rolls_back_created_user():
    db = Mock()
    db.get = AsyncMock(side_effect=[Role(id=1, name="Admin"), Role(id=3, name="Instructor"), Role(id=4, name="User")])
    db.execute = AsyncMock(side_effect=[
        _result(Organization(id=1, name="Pilot", slug="kelle-digital-lab", email="")),
        *[_result(None) for _ in range(6)],
        _result(None),
    ])
    db.flush = AsyncMock()
    db.commit = AsyncMock()
    db.rollback = AsyncMock()

    def add(value):
        if isinstance(value, UserOrganization):
            raise RuntimeError("membership insert failed")

    db.add.side_effect = add
    with patch.dict("os.environ", {"ALLOW_PILOT_BOOTSTRAP": "true", "LEARNHOUSE_ENV": "test"}, clear=True):
        with pytest.raises(RuntimeError, match="membership insert failed"):
            await bootstrap_pilot(db, _accounts())

    db.commit.assert_not_awaited()
    db.rollback.assert_awaited_once()
