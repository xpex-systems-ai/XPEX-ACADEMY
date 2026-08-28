from datetime import UTC, datetime

import pytest
from sqlmodel import select
from src.db.organizations import OrganizationCreate
from src.db.user_organizations import UserOrganization
from src.db.users import User
from src.security.rbac.constants import ADMIN_ROLE_ID
from src.services.setup.admin_provisioning import (
    AdminProvisioningRefused,
    provision_configured_admin,
)
from src.services.setup.setup import install_create_organization


async def _account(db, email="operator@example.com"):
    org = await install_create_organization(
        OrganizationCreate(name="Organization A", slug="organization-a", email=""), db
    )
    user = User(
        username="operator",
        first_name="",
        last_name="",
        email=email,
        password="already-hashed",
        user_uuid="operator_uuid",
        is_superadmin=False,
        creation_date=str(datetime.now(UTC)),
        update_date=str(datetime.now(UTC)),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user, org


async def test_provisioning_is_disabled_by_default(db, monkeypatch):
    await _account(db)
    monkeypatch.delenv("LEARNHOUSE_ADMIN_BOOTSTRAP_ENABLED", raising=False)

    with pytest.raises(AdminProvisioningRefused):
        await provision_configured_admin(db)


async def test_provisions_only_configured_existing_identity_and_tenant(db, monkeypatch):
    user, org = await _account(db)
    monkeypatch.setenv("LEARNHOUSE_ADMIN_BOOTSTRAP_ENABLED", "true")
    monkeypatch.setenv("LEARNHOUSE_INITIAL_ADMIN_EMAIL", user.email)
    monkeypatch.setenv("LEARNHOUSE_INITIAL_ORG_SLUG", org.slug)

    assert await provision_configured_admin(db) == "provisioned"
    assert await provision_configured_admin(db) == "already-provisioned"

    await db.refresh(user)
    membership = (await db.execute(select(UserOrganization))).scalars().one()
    assert user.is_superadmin is True
    assert membership.user_id == user.id
    assert membership.org_id == org.id
    assert membership.role_id == ADMIN_ROLE_ID


async def test_email_alone_cannot_create_or_authorize_an_identity(db, monkeypatch):
    await install_create_organization(
        OrganizationCreate(name="Organization A", slug="organization-a", email=""), db
    )
    monkeypatch.setenv("LEARNHOUSE_ADMIN_BOOTSTRAP_ENABLED", "true")
    monkeypatch.setenv("LEARNHOUSE_INITIAL_ADMIN_EMAIL", "missing@example.com")
    monkeypatch.setenv("LEARNHOUSE_INITIAL_ORG_SLUG", "organization-a")

    with pytest.raises(AdminProvisioningRefused):
        await provision_configured_admin(db)
    assert (await db.execute(select(User))).scalars().first() is None
