from __future__ import annotations

import copy
import json
from pathlib import Path

from src.security.role_policy_validator import validate_role_policy

POLICY_PATH = Path(__file__).resolve().parents[5] / "config" / "role-policies" / "kelle-pilot-teacher.json"


def load_policy() -> dict:
    with POLICY_PATH.open(encoding="utf-8") as handle:
        return json.load(handle)


def test_candidate_policy_valid() -> None:
    result = validate_role_policy(load_policy())

    assert result.valid is True
    assert result.errors == []
    assert result.forbidden_grants == []
    assert "dashboard.action_access" in result.summary["true_grants"]


def test_unknown_bucket_fails() -> None:
    policy = load_policy()
    policy["role"]["rights"]["billing"] = {"action_read": True}

    result = validate_role_policy(policy)

    assert result.valid is False
    assert result.unknown_buckets == ["billing"]


def test_unknown_action_fails() -> None:
    policy = load_policy()
    policy["role"]["rights"]["courses"]["action_manage"] = True

    result = validate_role_policy(policy)

    assert result.valid is False
    assert result.unknown_actions["courses"] == ["action_manage"]


def test_invalid_boolean_fails() -> None:
    policy = load_policy()
    policy["role"]["rights"]["courses"]["action_read"] = "yes"

    result = validate_role_policy(policy)

    assert result.valid is False
    assert "courses.action_read must be a boolean" in result.errors


def test_organization_update_enabled_fails() -> None:
    policy = load_policy()
    policy["role"]["rights"]["organizations"]["action_update"] = True

    result = validate_role_policy(policy)

    assert result.valid is False
    assert any(
        grant.bucket == "organizations" and grant.action == "action_update"
        for grant in result.forbidden_grants
    )


def test_role_creation_enabled_fails() -> None:
    policy = load_policy()
    policy["role"]["rights"]["roles"]["action_create"] = True

    result = validate_role_policy(policy)

    assert result.valid is False
    assert any(grant.bucket == "roles" and grant.action == "action_create" for grant in result.forbidden_grants)


def test_delete_enabled_fails() -> None:
    policy = load_policy()
    policy["role"]["rights"]["activities"]["action_delete"] = True

    result = validate_role_policy(policy)

    assert result.valid is False
    assert any(grant.bucket == "activities" and grant.action == "action_delete" for grant in result.forbidden_grants)


def test_own_action_in_wrong_bucket_fails() -> None:
    policy = load_policy()
    policy["role"]["rights"]["users"]["action_read_own"] = True

    result = validate_role_policy(policy)

    assert result.valid is False
    assert result.unknown_actions["users"] == ["action_read_own"]


def test_dashboard_wrong_action_fails() -> None:
    policy = load_policy()
    policy["role"]["rights"]["dashboard"]["action_read"] = True

    result = validate_role_policy(policy)

    assert result.valid is False
    assert result.unknown_actions["dashboard"] == ["action_read"]


def test_missing_bucket_is_denied_by_default_warning_not_grant() -> None:
    policy = load_policy()
    del policy["role"]["rights"]["communities"]

    result = validate_role_policy(policy)

    assert result.valid is True
    assert any("communities" in warning for warning in result.warnings)
    assert "communities" in result.summary["omitted_buckets_denied"]


def test_users_bucket_missing_standard_actions_fails() -> None:
    policy = load_policy()
    policy["role"]["rights"]["users"] = {"action_read": True}

    result = validate_role_policy(policy)

    assert result.valid is False
    assert any("Missing actions for bucket 'users'" in error for error in result.errors)
    assert any("action_create" in error and "action_update" in error and "action_delete" in error for error in result.errors)


def test_courses_bucket_missing_own_delete_action_fails() -> None:
    policy = load_policy()
    del policy["role"]["rights"]["courses"]["action_delete_own"]

    result = validate_role_policy(policy)

    assert result.valid is False
    assert "Missing actions for bucket 'courses': action_delete_own" in result.errors


def test_dashboard_bucket_missing_access_action_fails() -> None:
    policy = load_policy()
    policy["role"]["rights"]["dashboard"] = {}

    result = validate_role_policy(policy)

    assert result.valid is False
    assert "Missing actions for bucket 'dashboard': action_access" in result.errors


def test_complete_schema_bucket_is_valid() -> None:
    policy = load_policy()
    policy["role"]["rights"] = {
        "users": {
            "action_create": False,
            "action_read": True,
            "action_update": False,
            "action_delete": False,
        }
    }

    result = validate_role_policy(policy)

    assert result.valid is True
    assert result.errors == []
    assert result.summary["true_grants"] == ["users.action_read"]


def test_omitted_bucket_is_not_required_when_deny_by_default() -> None:
    policy = load_policy()
    policy["role"]["rights"] = {
        "dashboard": {"action_access": True},
    }

    result = validate_role_policy(policy)

    assert result.valid is True
    assert "users" in result.summary["omitted_buckets_denied"]
    assert all(not grant.startswith("users.") for grant in result.summary["true_grants"])


def test_maintainer_like_policy_fails_with_multiple_forbidden_grants() -> None:
    policy = load_policy()
    policy["role"]["rights"]["organizations"].update(
        {"action_create": True, "action_update": True, "action_delete": True}
    )
    policy["role"]["rights"]["roles"].update(
        {"action_create": True, "action_update": True, "action_delete": True}
    )
    policy["role"]["rights"]["courses"]["action_delete"] = True

    result = validate_role_policy(policy)

    assert result.valid is False
    assert len(result.forbidden_grants) >= 7


def test_validation_does_not_mutate_input() -> None:
    policy = load_policy()
    before = copy.deepcopy(policy)

    validate_role_policy(policy)

    assert policy == before
