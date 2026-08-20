from datetime import datetime

from sqlmodel import select

from src.core.events.autoinstall import reconcile_initial_install
from src.db.organizations import Organization, OrganizationCreate
from src.db.user_organizations import UserOrganization
from src.db.users import User
from src.security.rbac.constants import ADMIN_ROLE_ID
from src.services.setup.setup import install_create_organization


def _set_initial_admin(monkeypatch):
    monkeypatch.setenv("LEARNHOUSE_INITIAL_ORG_SLUG", "default")
    monkeypatch.setenv("LEARNHOUSE_INITIAL_ORG_NAME", "Default Organization")
    monkeypatch.setenv("LEARNHOUSE_INITIAL_ADMIN_EMAIL", "admin@school.dev")
    monkeypatch.setenv("LEARNHOUSE_INITIAL_ADMIN_PASSWORD", "test-bootstrap-password")


async def _counts(db):
    return (
        len((await db.execute(select(Organization))).scalars().all()),
        len((await db.execute(select(User))).scalars().all()),
        len((await db.execute(select(UserOrganization))).scalars().all()),
    )


async def test_reconcile_completely_empty_install(db, monkeypatch):
    _set_initial_admin(monkeypatch)

    await reconcile_initial_install(db)

    org = (await db.execute(select(Organization))).scalars().one()
    user = (await db.execute(select(User))).scalars().one()
    membership = (await db.execute(select(UserOrganization))).scalars().one()
    assert org.slug == "default"
    assert user.email == "admin@school.dev"
    assert user.is_superadmin is True
    assert membership.org_id == org.id
    assert membership.user_id == user.id
    assert membership.role_id == ADMIN_ROLE_ID


async def test_reconcile_existing_organization_creates_missing_admin(db, monkeypatch):
    _set_initial_admin(monkeypatch)
    org = await install_create_organization(
        OrganizationCreate(name="Existing", slug="default", email=""), db
    )

    await reconcile_initial_install(db)

    assert (await _counts(db)) == (1, 1, 1)
    membership = (await db.execute(select(UserOrganization))).scalars().one()
    assert membership.org_id == org.id
    assert membership.role_id == ADMIN_ROLE_ID


async def test_reconcile_repairs_existing_admin_and_membership(db, monkeypatch):
    _set_initial_admin(monkeypatch)
    org = await install_create_organization(
        OrganizationCreate(name="Existing", slug="default", email=""), db
    )
    user = User(
        username="administrator",
        first_name="",
        last_name="",
        email="admin@school.dev",
        password="already-hashed",
        user_uuid="user_existing",
        is_superadmin=False,
        creation_date=str(datetime.now()),
        update_date=str(datetime.now()),
    )
    db.add(user)
    await db.commit()

    await reconcile_initial_install(db)

    await db.refresh(user)
    membership = (await db.execute(select(UserOrganization))).scalars().one()
    assert user.is_superadmin is True
    assert membership.org_id == org.id
    assert membership.role_id == ADMIN_ROLE_ID


async def test_reconcile_repeated_startup_does_not_duplicate_records(db, monkeypatch):
    _set_initial_admin(monkeypatch)

    await reconcile_initial_install(db)
    first_counts = await _counts(db)
    await reconcile_initial_install(db)

    assert first_counts == (1, 1, 1)
    assert await _counts(db) == first_counts
