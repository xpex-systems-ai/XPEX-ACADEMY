"""Idempotent, explicitly gated bootstrap for the XpeX test pilot.

This module reuses LearnHouse Organization, User, Role and UserOrganization
tables. It intentionally contains no alternative identity model.
"""
import os
from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import uuid4

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.db.organization_config import OrganizationConfig, OrganizationConfigV2Base
from src.db.organizations import Organization
from src.db.roles import Role
from src.db.user_organizations import UserOrganization
from src.db.users import User, UserCreate
from src.security.security import security_hash_password
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
)


@dataclass(frozen=True)
class PilotAccount:
    role: str
    username: str
    email: str
    password: str


def readiness_environment(environ: dict[str, str] | None = None) -> dict[str, str]:
    """Report names and states only; values and connection strings never leave this function."""
    env = environ if environ is not None else os.environ
    return {name: "ready" if env.get(name, "").strip() else "missing" for name in REQUIRED_ENV}


def assert_bootstrap_allowed(environ: dict[str, str] | None = None) -> None:
    env = environ if environ is not None else os.environ
    if env.get("ALLOW_PILOT_BOOTSTRAP") != "true":
        raise RuntimeError("Pilot bootstrap requires ALLOW_PILOT_BOOTSTRAP=true")
    environment = env.get("LEARNHOUSE_ENV", "")
    if environment != environment.strip() or environment.lower() not in ALLOWED_BOOTSTRAP_ENVS:
        raise RuntimeError("Pilot bootstrap requires an explicitly allowed non-production environment")


async def bootstrap_pilot(db: AsyncSession, accounts: list[PilotAccount]) -> dict[str, str]:
    assert_bootstrap_allowed()
    if {account.role for account in accounts} != set(ROLE_IDS):
        raise ValueError("Exactly one administrator, teacher and student test account is required")
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
        by_email = (await db.execute(select(User).where(User.email == account.email))).scalars().first()
        by_username = (await db.execute(select(User).where(User.username == account.username))).scalars().first()
        if by_email and by_email.username != account.username:
            raise ValueError(f"Existing account conflict for role {account.role}; nothing was overwritten")
        if by_username and by_username.email != account.email:
            raise ValueError(f"Existing username conflict for role {account.role}; nothing was overwritten")
        user = by_email or by_username
        users_by_role[account.role] = user
        if user and org:
            membership = (await db.execute(select(UserOrganization).where(
                UserOrganization.user_id == user.id,
                UserOrganization.org_id == org.id,
            ))).scalars().first()
            if membership and membership.role_id != ROLE_IDS[account.role]:
                raise ValueError(f"Existing membership conflict for role {account.role}; nothing was overwritten")

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
