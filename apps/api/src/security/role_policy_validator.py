"""Reusable dry-run validator for candidate Role.rights policies.

The validator is intentionally detached from persistence and runtime RBAC. It
imports only the Role.rights schema models so candidate policies can be checked
before any organization role is created.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from pydantic import BaseModel, Field

from src.db.roles import DashboardPermission, Permission, PermissionsWithOwn, Rights


class ForbiddenGrant(BaseModel):
    bucket: str
    action: str
    reason: str


class RolePolicyValidationResult(BaseModel):
    valid: bool
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    unknown_buckets: list[str] = Field(default_factory=list)
    unknown_actions: dict[str, list[str]] = Field(default_factory=dict)
    forbidden_grants: list[ForbiddenGrant] = Field(default_factory=list)
    summary: dict[str, Any] = Field(default_factory=dict)


@dataclass(frozen=True)
class SchemaBucket:
    name: str
    model: type[BaseModel]
    actions: frozenset[str]


PERMISSION_ACTIONS = frozenset(
    {"action_create", "action_read", "action_update", "action_delete"}
)
PERMISSIONS_WITH_OWN_ACTIONS = frozenset(
    {
        "action_create",
        "action_read",
        "action_read_own",
        "action_update",
        "action_update_own",
        "action_delete",
        "action_delete_own",
    }
)
DASHBOARD_ACTIONS = frozenset({"action_access"})


FORBIDDEN_TRUE_GRANTS: dict[str, dict[str, str]] = {
    "organizations": {
        "action_create": "organization administration is reserved for operators",
        "action_update": "organization administration is reserved for operators",
        "action_delete": "organization administration is reserved for operators",
    },
    "roles": {
        "action_create": "role management is outside the teacher policy scope",
        "action_update": "role management is outside the teacher policy scope",
        "action_delete": "role management is outside the teacher policy scope",
    },
    "users": {
        "action_create": "student account management is reserved for operators",
        "action_update": "student account management is reserved for operators",
        "action_delete": "destructive grants are forbidden in the initial teacher policy",
    },
    "usergroups": {
        "action_create": "cohort management is reserved for operators",
        "action_update": "cohort management is reserved for operators",
        "action_delete": "destructive grants are forbidden in the initial teacher policy",
    },
}
DENIED_MVP_BUCKETS = {"communities", "podcasts", "boards", "playgrounds"}


APPROVED_TRUE_GRANTS = frozenset(
    {
        ("dashboard", "action_access"),
        ("courses", "action_read"),
        ("courses", "action_read_own"),
        ("courses", "action_update_own"),
        ("users", "action_read"),
        ("usergroups", "action_read"),
        ("folders", "action_read"),
        ("media", "action_read"),
        ("organizations", "action_read"),
        ("coursechapters", "action_read"),
        ("coursechapters", "action_update"),
        ("activities", "action_read"),
        ("activities", "action_update"),
        ("assignments", "action_read"),
        ("assignments", "action_update"),
        ("discussions", "action_read"),
        ("discussions", "action_read_own"),
    }
)


def _model_fields(model: type[BaseModel]) -> dict[str, Any]:
    return getattr(model, "model_fields", getattr(model, "__fields__", {}))


def _rights_schema() -> dict[str, SchemaBucket]:
    buckets: dict[str, SchemaBucket] = {}
    for bucket_name, field_info in _model_fields(Rights).items():
        annotation = getattr(field_info, "annotation", None) or getattr(field_info, "type_", None)
        if annotation is Permission:
            actions = PERMISSION_ACTIONS
        elif annotation is PermissionsWithOwn:
            actions = PERMISSIONS_WITH_OWN_ACTIONS
        elif annotation is DashboardPermission:
            actions = DASHBOARD_ACTIONS
        else:
            raise TypeError(f"Unsupported Rights bucket type for {bucket_name}: {annotation!r}")
        buckets[bucket_name] = SchemaBucket(bucket_name, annotation, actions)
    return buckets


def validate_role_policy(policy: dict[str, Any]) -> RolePolicyValidationResult:
    """Validate a candidate policy without database, network, or side effects."""

    errors: list[str] = []
    warnings: list[str] = []
    unknown_buckets: list[str] = []
    unknown_actions: dict[str, list[str]] = {}
    forbidden_grants: list[ForbiddenGrant] = []

    for section in ("metadata", "role", "constraints"):
        if section not in policy:
            errors.append(f"Missing required section: {section}")

    metadata = policy.get("metadata", {})
    role = policy.get("role", {})
    constraints = policy.get("constraints", {})
    rights = role.get("rights", {}) if isinstance(role, dict) else {}

    if not isinstance(metadata, dict):
        errors.append("metadata must be an object")
        metadata = {}
    if not isinstance(role, dict):
        errors.append("role must be an object")
        role = {}
    if not isinstance(constraints, dict):
        errors.append("constraints must be an object")
        constraints = {}
    if not isinstance(rights, dict):
        errors.append("role.rights must be an object")
        rights = {}

    if metadata.get("contains_real_data") is not False:
        errors.append("metadata.contains_real_data must be false")
    if metadata.get("deny_by_default") is not True:
        errors.append("metadata.deny_by_default must be true")
    if metadata.get("scope") != "organization":
        errors.append("metadata.scope must be organization")
    if role.get("role_type") in {"TYPE_GLOBAL", "Maintainer", "Admin"}:
        errors.append("teacher candidate policies must not be global/Admin/Maintainer policies")

    schema = _rights_schema()
    unknown_buckets = sorted(set(rights) - set(schema))
    for bucket in unknown_buckets:
        errors.append(f"Unknown rights bucket: {bucket}")

    omitted = sorted(set(schema) - set(rights))
    if omitted and metadata.get("deny_by_default") is True:
        warnings.append("Omitted buckets are denied by default: " + ", ".join(omitted))

    denied_buckets = set(constraints.get("denied_buckets", []))
    forbidden_map = _forbidden_map_from_constraints(constraints)

    for bucket_name, action_values in rights.items():
        if bucket_name not in schema or not isinstance(action_values, dict):
            if bucket_name in schema:
                errors.append(f"Rights bucket '{bucket_name}' must be an object")
            continue

        allowed_actions = schema[bucket_name].actions
        provided_actions = set(action_values)
        missing_actions = sorted(allowed_actions - provided_actions)
        if missing_actions:
            errors.append(
                f"Missing actions for bucket '{bucket_name}': {', '.join(missing_actions)}"
            )

        bucket_unknown = sorted(provided_actions - allowed_actions)
        if bucket_unknown:
            unknown_actions[bucket_name] = bucket_unknown
            errors.append(
                f"Unknown actions for bucket '{bucket_name}': {', '.join(bucket_unknown)}"
            )

        for action, value in action_values.items():
            if action not in allowed_actions:
                continue
            if not isinstance(value, bool):
                errors.append(f"{bucket_name}.{action} must be a boolean")
                continue
            if value is not True:
                continue
            reason = _forbidden_reason(bucket_name, action, denied_buckets, forbidden_map)
            if reason is None and (bucket_name, action) not in APPROVED_TRUE_GRANTS:
                reason = "grant is not in the explicitly approved teacher candidate allowlist"
            if reason is not None:
                forbidden_grants.append(
                    ForbiddenGrant(bucket=bucket_name, action=action, reason=reason)
                )

    errors.extend(
        f"Forbidden grant: {grant.bucket}.{grant.action} — {grant.reason}"
        for grant in forbidden_grants
    )

    summary = {
        "policy_id": metadata.get("policy_id"),
        "version": metadata.get("version"),
        "status": metadata.get("status"),
        "schema_buckets": len(schema),
        "provided_buckets": len(rights),
        "omitted_buckets_denied": omitted,
        "true_grants": sorted(
            f"{bucket}.{action}"
            for bucket, actions in rights.items()
            if isinstance(actions, dict)
            for action, value in actions.items()
            if value is True
        ),
    }

    return RolePolicyValidationResult(
        valid=not errors,
        errors=errors,
        warnings=warnings,
        unknown_buckets=unknown_buckets,
        unknown_actions=unknown_actions,
        forbidden_grants=forbidden_grants,
        summary=summary,
    )


def _forbidden_map_from_constraints(constraints: dict[str, Any]) -> dict[str, dict[str, str]]:
    forbidden = {bucket: actions.copy() for bucket, actions in FORBIDDEN_TRUE_GRANTS.items()}
    for item in constraints.get("forbidden_grants", []):
        if not isinstance(item, dict):
            continue
        bucket = item.get("bucket")
        actions = item.get("actions", [])
        reason = item.get("reason", "grant is forbidden by policy constraints")
        if not isinstance(bucket, str) or not isinstance(actions, list):
            continue
        forbidden.setdefault(bucket, {})
        for action in actions:
            if isinstance(action, str):
                forbidden[bucket][action] = reason
    return forbidden


def _forbidden_reason(
    bucket: str,
    action: str,
    denied_buckets: set[str],
    forbidden_map: dict[str, dict[str, str]],
) -> str | None:
    if action in {"action_delete", "action_delete_own"}:
        return "destructive grants are forbidden in the initial teacher policy"
    if bucket in denied_buckets or bucket in DENIED_MVP_BUCKETS:
        return "bucket is denied for the initial MVP teacher policy"
    return forbidden_map.get(bucket, {}).get(action) or forbidden_map.get("*", {}).get(action)
