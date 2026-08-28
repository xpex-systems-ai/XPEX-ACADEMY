"""Explicit, one-shot provisioning for an already existing platform operator."""

import logging
import os
from datetime import UTC, datetime

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from src.db.organizations import Organization
from src.db.user_organizations import UserOrganization
from src.db.users import User
from src.security.rbac.constants import ADMIN_ROLE_ID

logger = logging.getLogger(__name__)


class AdminProvisioningRefused(RuntimeError):
    pass


async def provision_configured_admin(db_session: AsyncSession) -> str:
    """Grant native authority to one pre-existing, explicitly configured user.

    This operation is deliberately absent from application startup. It requires
    an operator-controlled enable flag, never creates an identity or password,
    and is idempotent so an interrupted run can be safely retried.
    """
    if os.environ.get("LEARNHOUSE_ADMIN_BOOTSTRAP_ENABLED", "").lower() != "true":
        raise AdminProvisioningRefused("LEARNHOUSE_ADMIN_BOOTSTRAP_ENABLED is not true")

    email = os.environ.get("LEARNHOUSE_INITIAL_ADMIN_EMAIL", "").strip()
    org_slug = os.environ.get("LEARNHOUSE_INITIAL_ORG_SLUG", "default").strip().lower()
    if not email or not org_slug:
        raise AdminProvisioningRefused("configured administrator email and organization slug are required")

    user = (await db_session.execute(select(User).where(User.email == email))).scalars().first()
    org = (
        await db_session.execute(select(Organization).where(Organization.slug == org_slug))
    ).scalars().first()
    if user is None or org is None or user.id is None or org.id is None:
        raise AdminProvisioningRefused("configured user and organization must already exist")

    membership = (
        await db_session.execute(
            select(UserOrganization).where(
                UserOrganization.user_id == user.id,
                UserOrganization.org_id == org.id,
            )
        )
    ).scalars().first()
    changed = False
    now = str(datetime.now(UTC))
    if user.is_superadmin is not True:
        user.is_superadmin = True
        user.update_date = now
        db_session.add(user)
        changed = True
    if membership is None:
        db_session.add(UserOrganization(
            user_id=user.id,
            org_id=org.id,
            role_id=ADMIN_ROLE_ID,
            creation_date=now,
            update_date=now,
        ))
        changed = True
    elif membership.role_id != ADMIN_ROLE_ID:
        membership.role_id = ADMIN_ROLE_ID
        membership.update_date = now
        db_session.add(membership)
        changed = True

    if changed:
        await db_session.commit()
    logger.warning(
        "Admin provisioning audit actor=deployment-operator user_id=%s org_id=%s changed=%s",
        user.id,
        org.id,
        changed,
    )
    return "provisioned" if changed else "already-provisioned"
