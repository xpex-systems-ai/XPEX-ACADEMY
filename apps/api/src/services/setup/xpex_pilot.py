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
ALLOWED_BOOTSTRAP_ENVIRONMENTS = {
    "dev",
    "development",
    "local",
    "staging",
    "test",
    "testing",
}
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
    return {
        name: "ready" if env.get(name, "").strip() else "missing"
        for name in REQUIRED_ENV
    }


def assert_bootstrap_allowed(environ: dict[str, str] | None = None) -> None:
    """Fail closed unless the gate and a recognized non-production environment are present."""
    env = environ if environ is not None else os.environ
    if env.get("ALLOW_PILOT_BOOTSTRAP", "").strip().lower() != "true":
        raise RuntimeError("Pilot bootstrap requires ALLOW_PILOT_BOOTSTRAP=true")

    environment = env.get("LEARNHOUSE_ENV", "").strip().lower()
    if environment not in ALLOWED_BOOTSTRAP_ENVIRONMENTS:
        raise RuntimeError(
            "Pilot bootstrap requires a recognized non-production LEARNHOUSE_ENV"
        )


def validate_pilot_accounts(accounts: list[PilotAccount]) -> None:
    """Validate the complete requested account set before any pilot mutation."""
    if len(accounts) != len(ROLE_IDS) or {account.role for account in accounts} != set(
        ROLE_IDS
    ):
        raise ValueError(
            "Exactly one administrator, teacher and student test account is required"
        )

    usernames = [account.username.strip() for account in accounts]
    emails = [account.email.strip().lower() for account in accounts]
    if any(not username for username in usernames) or any(not email for email in emails):
        raise ValueError("Pilot usernames and emails must not be blank")
    if len(set(usernames)) != len(usernames):
        raise ValueError("Pilot usernames must be unique")
    if len(set(emails)) != len(emails):
        raise ValueError("Pilot emails must be unique")

    for account in accounts:
        validation = validate_password_complexity(account.password)
        if not validation.is_valid:
            raise ValueError(f"Weak password refused for {account.role}")


async def bootstrap_pilot(
    db: AsyncSession, accounts: list[PilotAccount]
) -> dict[str, str]:
    assert_bootstrap_allowed()
    validate_pilot_accounts(accounts)

    await install_default_elements(db)

    roles: dict[str, Role] = {}
    for role_name, role_id in ROLE_IDS.items():
        role = await db.get(Role, role_id)
        if not role:
            raise RuntimeError(f"LearnHouse role {role_id} was not installed")
        roles[role_name] = role

    org = (
        await db.execute(select(Organization).where(Organization.slug == PILOT_SLUG))
    ).scalars().first()

    existing_users: dict[str, User | None] = {}
    existing_memberships: dict[str, UserOrganization | None] = {}

    # Complete conflict preflight. No pilot account or membership is written
    # until every requested identity and existing membership has been checked.
    for account in accounts:
        email = account.email.strip().lower()
        username = account.username.strip()
        user_by_email = (
            await db.execute(select(User).where(User.email == email))
        ).scalars().first()
        user_by_username = (
            await db.execute(select(User).where(User.username == username))
        ).scalars().first()

        if user_by_email and user_by_username and user_by_email.id != user_by_username.id:
            raise ValueError(
                f"Existing email and username belong to different users for role {account.role}"
            )
        if user_by_email and user_by_email.username != username:
            raise ValueError(
                f"Existing account conflict for role {account.role}; nothing was overwritten"
            )
        if user_by_username and user_by_username.email.lower() != email:
            raise ValueError(
                f"Existing username conflict for role {account.role}; nothing was overwritten"
            )

        user = user_by_email or user_by_username
        existing_users[account.role] = user
        membership = None
        if user and org:
            membership = (
                await db.execute(
                    select(UserOrganization).where(
                        UserOrganization.user_id == user.id,
                        UserOrganization.org_id == org.id,
                    )
                )
            ).scalars().first()
            if membership and membership.role_id != ROLE_IDS[account.role]:
                raise ValueError(
                    f"Existing membership conflict for role {account.role}; "
                    "nothing was overwritten"
                )
        existing_memberships[account.role] = membership

    now = datetime.now(timezone.utc).isoformat()
    try:
        if not org:
            org = await install_create_organization(
                OrganizationCreate(
                    name="Polo Kelle Digital Lab",
                    slug=PILOT_SLUG,
                    description="Polo piloto XpeX Academy — Marajó",
                    email="",
                ),
                db,
            )

        for account in accounts:
            email = account.email.strip().lower()
            username = account.username.strip()
            user = existing_users[account.role]
            if not user:
                user = User.model_validate(
                    UserCreate(
                        username=username,
                        email=email,
                        password=account.password,
                        first_name="Conta",
                        last_name="Teste",
                    )
                )
                user.user_uuid = f"user_{uuid4()}"
                user.password = security_hash_password(account.password)
                user.email_verified = True
                user.email_verified_at = now
                user.signup_method = "pilot_bootstrap"
                user.creation_date = now
                user.update_date = now
                db.add(user)
                await db.flush()

            if not existing_memberships[account.role]:
                db.add(
                    UserOrganization(
                        user_id=user.id,
                        org_id=org.id,
                        role_id=roles[account.role].id,
                        creation_date=now,
                        update_date=now,
                    )
                )

        await db.commit()
    except Exception:
        await db.rollback()
        raise

    return {"organization": "ready", **{role: "ready" for role in ROLE_IDS}}
