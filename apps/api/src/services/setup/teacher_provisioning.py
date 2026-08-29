"""Explicit, one-shot provisioning for an already existing XPeX teacher."""

import asyncio
import logging
import os
from datetime import UTC, datetime

from config.config import get_learnhouse_config
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.db.organizations import Organization
from src.db.roles import Role
from src.db.user_organizations import UserOrganization
from src.db.users import User
from src.security.rbac.constants import ADMIN_ROLE_ID, MAINTAINER_ROLE_ID

logger = logging.getLogger(__name__)

TEACHER_ROLE_UUID = "role_global_instructor"


class TeacherProvisioningRefused(RuntimeError):
    pass


def _to_async_url(url: str) -> str:
    if "+asyncpg" in url:
        return url
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


async def provision_configured_teacher(db_session: AsyncSession) -> str:
    """Reconcile one pre-existing user to the canonical teacher role.

    This operation is opt-in, idempotent, tenant-scoped, and never creates an
    identity, password, session, or superadmin authority. Elevated memberships
    are never silently demoted.
    """
    if os.environ.get("LEARNHOUSE_TEACHER_BOOTSTRAP_ENABLED", "").lower() != "true":
        raise TeacherProvisioningRefused("LEARNHOUSE_TEACHER_BOOTSTRAP_ENABLED is not true")

    email = os.environ.get("LEARNHOUSE_INITIAL_TEACHER_EMAIL", "").strip()
    org_slug = os.environ.get("LEARNHOUSE_INITIAL_TEACHER_ORG_SLUG", "default").strip().lower()
    if not email or not org_slug:
        raise TeacherProvisioningRefused("configured teacher email and organization slug are required")

    user = (await db_session.execute(select(User).where(User.email == email))).scalars().first()
    org = (await db_session.execute(select(Organization).where(Organization.slug == org_slug))).scalars().first()
    if user is None or org is None or user.id is None or org.id is None:
        raise TeacherProvisioningRefused("configured user and organization must already exist")

    role = (
        await db_session.execute(
            select(Role).where(
                Role.role_uuid == TEACHER_ROLE_UUID,
                Role.org_id.is_(None),
            )
        )
    ).scalars().first()
    if role is None or role.id is None:
        raise TeacherProvisioningRefused("canonical global instructor role does not exist")

    membership = (
        await db_session.execute(
            select(UserOrganization).where(
                UserOrganization.user_id == user.id,
                UserOrganization.org_id == org.id,
            )
        )
    ).scalars().first()

    now = str(datetime.now(UTC))
    changed = False

    if membership is None:
        db_session.add(
            UserOrganization(
                user_id=user.id,
                org_id=org.id,
                role_id=role.id,
                creation_date=now,
                update_date=now,
            )
        )
        changed = True
    elif membership.role_id in {ADMIN_ROLE_ID, MAINTAINER_ROLE_ID}:
        raise TeacherProvisioningRefused("existing elevated membership will not be demoted")
    elif membership.role_id != role.id:
        membership.role_id = role.id
        membership.update_date = now
        db_session.add(membership)
        changed = True

    if changed:
        await db_session.commit()

    logger.warning(
        "Teacher provisioning audit actor=deployment-operator user_id=%s org_id=%s changed=%s",
        user.id,
        org.id,
        changed,
    )
    return "provisioned" if changed else "already-provisioned"


async def _run() -> None:
    config = get_learnhouse_config()
    engine = create_async_engine(
        _to_async_url(config.database_config.sql_connection_string),  # type: ignore
        pool_pre_ping=True,
    )
    try:
        async with AsyncSession(engine, expire_on_commit=False) as session:
            result = await provision_configured_teacher(session)
            print(f"Teacher provisioning: {result}")
    finally:
        await engine.dispose()


if __name__ == "__main__":
    try:
        asyncio.run(_run())
    except TeacherProvisioningRefused as exc:
        print(f"Teacher provisioning refused: {exc}")
        raise SystemExit(2) from None
