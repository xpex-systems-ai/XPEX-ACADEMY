from datetime import UTC, datetime

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


def _clear_bootstrap(monkeypatch):
    for name in (
        "LEARNHOUSE_INITIAL_ORG_SLUG",
        "LEARNHOUSE_INITIAL_ORG_NAME",
        "LEARNHOUSE_INITIAL_ADMIN_EMAIL",
        "LEARNHOUSE_INITIAL_ADMIN_PASSWORD",
    ):
        monkeypatch.delenv(name, raising=False)


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


async def test_established_install_without_bootstrap_only_refreshes_roles(db, monkeypatch):
    _clear_bootstrap(monkeypatch)
    org = await install_create_organization(
        OrganizationCreate(name="Established", slug="school", email=""), db
    )
    user = User(
        username="owner",
        first_name="",
        last_name="",
        email="owner@example.com",
        password="already-hashed",
        user_uuid="user_owner",
        creation_date=str(datetime.now(UTC)),
        update_date=str(datetime.now(UTC)),
    )
    db.add(user)
    await db.commit()

    await reconcile_initial_install(db)

    assert await _counts(db) == (1, 1, 0)
    assert org.slug == "school"


async def test_explicit_non_default_admin_email_is_used(db, monkeypatch):
    _set_initial_admin(monkeypatch)
    monkeypatch.setenv("LEARNHOUSE_INITIAL_ADMIN_EMAIL", "founder@xpex.com.br")

    await reconcile_initial_install(db)

    user = (await db.execute(select(User))).scalars().one()
    assert user.email == "founder@xpex.com.br"
    assert user.is_superadmin is True


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
        creation_date=str(datetime.now(UTC)),
        update_date=str(datetime.now(UTC)),
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


async def test_missing_password_does_not_block_established_install(db, monkeypatch):
    _clear_bootstrap(monkeypatch)
    await install_create_organization(
        OrganizationCreate(name="Established", slug="school", email=""), db
    )
    user = User(
        username="member",
        first_name="",
        last_name="",
        email="member@example.com",
        password="already-hashed",
        user_uuid="user_member",
        creation_date=str(datetime.now(UTC)),
        update_date=str(datetime.now(UTC)),
    )
    db.add(user)
    await db.commit()

    await reconcile_initial_install(db)

    assert await _counts(db) == (1, 1, 0)


async def test_partial_install_without_password_does_not_block_boot(db, monkeypatch):
    _set_initial_admin(monkeypatch)
    monkeypatch.delenv("LEARNHOUSE_INITIAL_ADMIN_PASSWORD")
    await install_create_organization(
        OrganizationCreate(name="Partial", slug="default", email=""), db
    )

    await reconcile_initial_install(db)

    assert await _counts(db) == (1, 0, 0)
