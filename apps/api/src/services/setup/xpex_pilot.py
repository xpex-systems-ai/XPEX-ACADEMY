"""Idempotent, explicitly gated bootstrap for the XpeX test pilot.

This module reuses LearnHouse Organization, User, Role and UserOrganization
tables. It intentionally contains no alternative identity model.
"""
import os
from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import uuid4

from pwdlib.exceptions import PwdlibError
from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy import func
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.db.organization_config import OrganizationConfig, OrganizationConfigV2Base
from src.db.organizations import Organization
from src.db.roles import Role
from src.db.user_organizations import UserOrganization
from src.db.users import User, UserCreate
from src.security.security import security_hash_password, security_verify_password
from src.services.security.password_validation import validate_password_complexity

PILOT_SLUG = "kelle-digital-lab"
ROLE_IDS = {"administrator": 1, "teacher": 3, "student": 4}
ALLOWED_BOOTSTRAP_ENVS = {"dev", "development", "local", "preview", "staging", "test", "testing"}
REQUIRED_ENV = (
    "LEARNHOUSE_AUTH_JWT_SECRET_KEY",
    "LEARNHOUSE_SQL_CONNECTION_STRING",
    "LEARNHOUSE_REDIS_CONNECTION_STRING",
    "LEARNHOUSE_SITE_NAME",
    "LEARNHOUSE_SITE_DESCRIPTION",
    "LEARNHOUSE_ENV",
    "LEARNHOUSE_DEVELOPMENT_MODE",
    "LEARNHOUSE_TENANCY",
    "LEARNHOUSE_EMAIL_PROVIDER",
    "LEARNHOUSE_SYSTEM_EMAIL_ADDRESS",
    "ALLOW_PILOT_BOOTSTRAP",
    "XPEX_PILOT_ADMIN_USERNAME",
    "XPEX_PILOT_ADMIN_EMAIL",
    "XPEX_PILOT_ADMIN_PASSWORD",
    "XPEX_PILOT_TEACHER_USERNAME",
    "XPEX_PILOT_TEACHER_EMAIL",
    "XPEX_PILOT_TEACHER_PASSWORD",
    "XPEX_PILOT_STUDENT_USERNAME",
    "XPEX_PILOT_STUDENT_EMAIL",
    "XPEX_PILOT_STUDENT_PASSWORD",
)
PILOT_ACCOUNT_ENV = {
    "administrator": "ADMIN",
    "teacher": "TEACHER",
    "student": "STUDENT",
}


class PilotConfigurationError(RuntimeError):
    """Controlled configuration error that never includes secret values."""


@dataclass(frozen=True)
class PilotAccount:
    role: str
    username: str
    email: str
    password: str


def readiness_environment(environ: dict[str, str] | None = None) -> dict[str, str]:
    """Report names and states only; values and connection strings never leave this function."""
    env = environ if environ is not None else os.environ
    states = {name: "ready" if env.get(name, "").strip() else "missing" for name in REQUIRED_ENV}
    gate = env.get("ALLOW_PILOT_BOOTSTRAP", "")
    if gate and gate != "true":
        states["ALLOW_PILOT_BOOTSTRAP"] = "invalid"
    environment = env.get("LEARNHOUSE_ENV", "")
    if environment and (environment != environment.strip() or environment.lower() not in ALLOWED_BOOTSTRAP_ENVS):
        states["LEARNHOUSE_ENV"] = "invalid"
    for prefix in PILOT_ACCOUNT_ENV.values():
        username_name = f"XPEX_PILOT_{prefix}_USERNAME"
        email_name = f"XPEX_PILOT_{prefix}_EMAIL"
        password_name = f"XPEX_PILOT_{prefix}_PASSWORD"
        username = env.get(username_name, "")
        email = env.get(email_name, "")
        password = env.get(password_name, "")
        if username and username != username.strip():
            states[username_name] = "invalid"
        if email:
            try:
                TypeAdapter(EmailStr).validate_python(email.strip().lower())
            except ValidationError:
                states[email_name] = "invalid"
        if password and not validate_password_complexity(password).is_valid:
            states[password_name] = "invalid"
    configuration_states = tuple(states.values())
    states["XPEX_PILOT_READINESS"] = (
        "invalid" if "invalid" in configuration_states
        else "pending" if "missing" in configuration_states
        else "ready"
    )
    return states


def pilot_accounts_from_environment(environ: dict[str, str] | None = None) -> list[PilotAccount]:
    """Load pilot identities without KeyError and without echoing configured values."""
    env = environ if environ is not None else os.environ
    missing: list[str] = []
    accounts: list[PilotAccount] = []
    for role, prefix in PILOT_ACCOUNT_ENV.items():
        names = [f"XPEX_PILOT_{prefix}_{field}" for field in ("USERNAME", "EMAIL", "PASSWORD")]
        values = [env.get(name, "") for name in names]
        missing.extend(name for name, value in zip(names, values, strict=True) if not value.strip())
        accounts.append(PilotAccount(role, values[0].strip(), values[1].strip().lower(), values[2]))
    if missing:
        raise PilotConfigurationError(f"Missing required pilot configuration names: {', '.join(missing)}")
    return accounts


def assert_bootstrap_allowed(environ: dict[str, str] | None = None) -> None:
    env = environ if environ is not None else os.environ
    if env.get("ALLOW_PILOT_BOOTSTRAP") != "true":
        raise RuntimeError("Pilot bootstrap requires ALLOW_PILOT_BOOTSTRAP=true")
    environment = env.get("LEARNHOUSE_ENV", "")
    if environment != environment.strip() or environment.lower() not in ALLOWED_BOOTSTRAP_ENVS:
        raise RuntimeError("Pilot bootstrap requires an explicitly allowed non-production environment")


def validate_distinct_accounts(accounts: list[PilotAccount]) -> list[PilotAccount]:
    """Normalize and prove that every configured role represents one identity."""
    normalized = [PilotAccount(a.role, a.username.strip(), a.email.strip().lower(), a.password) for a in accounts]
    for field in ("username", "email"):
        seen: dict[str, str] = {}
        for account in normalized:
            value = getattr(account, field)
            canonical = value.lower() if field == "email" else value
            if not canonical:
                raise PilotConfigurationError(f"Empty {field} for pilot role {account.role}")
            if canonical in seen:
                raise PilotConfigurationError(
                    f"Duplicate pilot {field} for roles {seen[canonical]} and {account.role}"
                )
            seen[canonical] = account.role
    return normalized


def _assert_existing_user_can_login(user: User, account: PilotAccount) -> None:
    if not user.email_verified:
        raise ValueError(f"Existing account for role {account.role} is not email-verified")
    if user.locked_until:
        try:
            locked_until = datetime.fromisoformat(str(user.locked_until))
            if locked_until.tzinfo is None:
                locked_until = locked_until.replace(tzinfo=UTC)
        except ValueError as exc:
            raise ValueError(f"Existing account for role {account.role} has an invalid lock state") from exc
        if locked_until > datetime.now(UTC):
            raise ValueError(f"Existing account for role {account.role} is locked")
    try:
        password_matches = bool(user.password) and security_verify_password(account.password, user.password)
    except (PwdlibError, TypeError, ValueError):
        password_matches = False
    if not password_matches:
        raise ValueError(
            f"Existing account credentials cannot be verified for role {account.role}; password was not changed"
        )


async def bootstrap_pilot(db: AsyncSession, accounts: list[PilotAccount]) -> dict[str, str]:
    assert_bootstrap_allowed()
    if {account.role for account in accounts} != set(ROLE_IDS):
        raise ValueError("Exactly one administrator, teacher and student test account is required")
    accounts = validate_distinct_accounts(accounts)
    for account in accounts:
        validation = validate_password_complexity(account.password)
        if not validation.is_valid:
            raise ValueError(f"Weak password refused for {account.role}")

    # Complete every conflict check before adding or changing a row. This keeps
    # a conflict in the final account from partially provisioning earlier ones.
    roles = {role_id: await db.get(Role, role_id) for role_id in ROLE_IDS.values()}
    missing_roles = [role_id for role_id, role in roles.items() if role is None]
    if missing_roles:
        raise RuntimeError(f"LearnHouse roles must be installed first: {missing_roles}")

    org = (await db.execute(select(Organization).where(Organization.slug == PILOT_SLUG))).scalars().first()
    users_by_role: dict[str, User | None] = {}
    for account in accounts:
        by_email = (await db.execute(select(User).where(func.lower(User.email) == account.email))).scalars().first()
        by_username = (await db.execute(select(User).where(User.username == account.username))).scalars().first()
        if by_email and by_email.username != account.username:
            raise ValueError(f"Existing account conflict for role {account.role}; nothing was overwritten")
        if by_username and by_username.email != account.email:
            raise ValueError(f"Existing username conflict for role {account.role}; nothing was overwritten")
        user = by_email or by_username
        if by_email and by_username and by_email.id != by_username.id:
            raise ValueError(f"Ambiguous existing identity for role {account.role}; nothing was overwritten")
        if user:
            _assert_existing_user_can_login(user, account)
        users_by_role[account.role] = user
        if user and org:
            membership = (await db.execute(select(UserOrganization).where(
                UserOrganization.user_id == user.id,
                UserOrganization.org_id == org.id,
            ))).scalars().first()
            if membership and membership.role_id != ROLE_IDS[account.role]:
                raise ValueError(f"Existing membership conflict for role {account.role}; nothing was overwritten")

    existing_user_ids = [user.id for user in users_by_role.values() if user]
    if len(existing_user_ids) != len(set(existing_user_ids)):
        raise ValueError("Two pilot roles resolve to the same existing user; nothing was overwritten")

    now = datetime.now(UTC).isoformat()
    try:
        if not org:
            org = Organization(
                name="Polo Kelle Digital Lab",
                slug=PILOT_SLUG,
                description="Polo piloto XpeX Academy — Marajó",
                email="",
                org_uuid=f"org_{uuid4()}",
                creation_date=now,
                update_date=now,
            )
            db.add(org)
            await db.flush()
            db.add(OrganizationConfig(
                org_id=org.id or 0,
                config=OrganizationConfigV2Base().model_dump(),
                creation_date=now,
                update_date=now,
            ))

        for account in accounts:
            user = users_by_role[account.role]
            if not user:
                user = User.model_validate(UserCreate(
                    username=account.username, email=account.email, password=account.password,
                    first_name="Conta", last_name="Teste",
                ))
                user.user_uuid = f"user_{uuid4()}"
                user.password = security_hash_password(account.password)
                user.email_verified = True
                user.email_verified_at = now
                user.signup_method = "pilot_bootstrap"
                user.creation_date = now
                user.update_date = now
                db.add(user)
                await db.flush()

            membership = (await db.execute(select(UserOrganization).where(
                UserOrganization.user_id == user.id,
                UserOrganization.org_id == org.id,
            ))).scalars().first()
            if not membership:
                db.add(UserOrganization(
                    user_id=user.id or 0,
                    org_id=org.id or 0,
                    role_id=ROLE_IDS[account.role],
                    creation_date=now,
                    update_date=now,
                ))
        await db.commit()
    except Exception:
        await db.rollback()
        raise
    return {"organization": "ready", **{role: "ready" for role in ROLE_IDS}}
