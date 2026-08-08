"""Idempotent, explicitly gated bootstrap for the XpeX test pilot.

This module reuses LearnHouse Organization, User, Role and UserOrganization
tables. It intentionally contains no alternative identity model.
"""
from dataclasses import dataclass
from datetime import datetime, timezone
import os
from uuid import uuid4

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.db.organizations import Organization, OrganizationCreate
from src.db.roles import Role
from src.db.user_organizations import UserOrganization
from src.db.users import User, UserCreate
from src.security.security import security_hash_password
from src.services.security.password_validation import validate_password_complexity
from src.services.setup.setup import install_create_organization, install_default_elements

PILOT_SLUG = "kelle-digital-lab"
ROLE_IDS = {"administrator": 1, "teacher": 3, "student": 4}
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
    if env.get("LEARNHOUSE_ENV", "").lower() in {"prod", "production"}:
        raise RuntimeError("Pilot bootstrap is forbidden in production")


async def bootstrap_pilot(db: AsyncSession, accounts: list[PilotAccount]) -> dict[str, str]:
    assert_bootstrap_allowed()
    if {account.role for account in accounts} != set(ROLE_IDS):
        raise ValueError("Exactly one administrator, teacher and student test account is required")
    for account in accounts:
        validation = validate_password_complexity(account.password)
        if not validation.is_valid:
            raise ValueError(f"Weak password refused for {account.role}")

    await install_default_elements(db)
    org = (await db.execute(select(Organization).where(Organization.slug == PILOT_SLUG))).scalars().first()
    if not org:
        org = await install_create_organization(OrganizationCreate(
            name="Polo Kelle Digital Lab", slug=PILOT_SLUG,
            description="Polo piloto XpeX Academy — Marajó", email="",
        ), db)

    now = datetime.now(timezone.utc).isoformat()
    for account in accounts:
        user = (await db.execute(select(User).where(User.email == account.email))).scalars().first()
        if user and user.username != account.username:
            raise ValueError(f"Existing account conflict for role {account.role}; nothing was overwritten")
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
            await db.commit()
            await db.refresh(user)

        role_id = ROLE_IDS[account.role]
        if not await db.get(Role, role_id):
            raise RuntimeError(f"LearnHouse role {role_id} was not installed")
        membership = (await db.execute(select(UserOrganization).where(
            UserOrganization.user_id == user.id,
            UserOrganization.org_id == org.id,
        ))).scalars().first()
        if membership and membership.role_id != role_id:
            raise ValueError(f"Existing membership conflict for role {account.role}; nothing was overwritten")
        if not membership:
            db.add(UserOrganization(user_id=user.id, org_id=org.id, role_id=role_id,
                                    creation_date=now, update_date=now))
            await db.commit()
    return {"organization": "ready", **{role: "ready" for role in ROLE_IDS}}
