import logging
import os
from datetime import UTC, datetime

from config.config import get_learnhouse_config
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlmodel import SQLModel, select
from sqlmodel.ext.asyncio.session import AsyncSession
from src.db.organizations import Organization, OrganizationCreate
from src.db.user_organizations import UserOrganization
from src.db.users import User, UserCreate
from src.security.rbac.constants import ADMIN_ROLE_ID
from src.services.setup.setup import (
    install_create_organization,
    install_create_organization_user,
    install_default_elements,
)

logger = logging.getLogger(__name__)


def _to_async_url(url: str) -> str:
    """Convert supported synchronous PostgreSQL URLs for asyncpg."""
    for prefix in ("postgresql+psycopg2://", "postgresql://", "postgres://"):
        if url.startswith(prefix):
            return url.replace(prefix, "postgresql+asyncpg://", 1)
    return url


async def reconcile_initial_install(db_session: AsyncSession) -> None:
    """Reconcile bootstrap state without changing established installations.

    Bootstrap is opt-in once any data exists. This lets a partially installed
    deployment finish when its initial admin email is still configured, while a
    mature deployment whose one-time bootstrap variables were removed only gets
    the idempotent global-role refresh.
    """
    await install_default_elements(db_session)

    organizations = (await db_session.execute(select(Organization))).scalars().all()
    users = (await db_session.execute(select(User))).scalars().all()
    email = os.environ.get("LEARNHOUSE_INITIAL_ADMIN_EMAIL")
    password = os.environ.get("LEARNHOUSE_INITIAL_ADMIN_PASSWORD")
    org_name = os.environ.get("LEARNHOUSE_INITIAL_ORG_NAME", "Default Organization")
    org_slug = os.environ.get("LEARNHOUSE_INITIAL_ORG_SLUG", "default").lower()

    empty_install = not organizations and not users
    org = next((item for item in organizations if item.slug == org_slug), None)

    if empty_install:
        if not email or not password:
            logger.info("Empty installation has no complete bootstrap configuration; skipping seed data")
            return
    elif org is None or not email:
        logger.info("Established installation detected; initial seed reconciliation skipped")
        return

    if org is None:
        org = await install_create_organization(
            OrganizationCreate(
                name=org_name,
                description=org_name,
                slug=org_slug,
                email="",
                logo_image="",
                thumbnail_image="",
                about="",
                label="",
            ),
            db_session,
        )
        logger.info("Initial organization created (slug=%s)", org_slug)

    user = (
        await db_session.execute(select(User).where(User.email == email))
    ).scalars().first()
    if user is None:
        if not password:
            logger.warning(
                "Initial administrator is absent but bootstrap password is not configured; skipping creation"
            )
            return
        created = await install_create_organization_user(
            UserCreate(username="admin", email=email, password=password),
            org_slug,
            db_session,
            is_superadmin=True,
        )
        user = (
            await db_session.execute(select(User).where(User.id == created.id))
        ).scalars().one()
        logger.info("Initial administrator created (email=%s)", email)

    changed = False
    if not user.is_superadmin:
        user.is_superadmin = True
        user.update_date = str(datetime.now(UTC))
        db_session.add(user)
        changed = True

    membership = (
        await db_session.execute(
            select(UserOrganization).where(
                UserOrganization.user_id == user.id,
                UserOrganization.org_id == org.id,
            )
        )
    ).scalars().first()
    if membership is None:
        now = str(datetime.now(UTC))
        db_session.add(
            UserOrganization(
                user_id=user.id or 0,
                org_id=org.id or 0,
                role_id=ADMIN_ROLE_ID,
                creation_date=now,
                update_date=now,
            )
        )
        changed = True
    elif membership.role_id != ADMIN_ROLE_ID:
        membership.role_id = ADMIN_ROLE_ID
        membership.update_date = str(datetime.now(UTC))
        db_session.add(membership)
        changed = True

    if changed:
        await db_session.commit()
    logger.info("Initial installation reconciled")


async def auto_install() -> None:
    learnhouse_config = get_learnhouse_config()
    sync_connection_string = learnhouse_config.database_config.sql_connection_string  # type: ignore
    engine = create_engine(sync_connection_string, echo=False, pool_pre_ping=True)
    try:
        SQLModel.metadata.create_all(engine)
    finally:
        engine.dispose()

    async_engine = create_async_engine(
        _to_async_url(str(sync_connection_string)),
        echo=False,
        pool_pre_ping=True,
        connect_args={
            "statement_cache_size": 0,
            "prepared_statement_name_func": lambda: "",
            "prepared_statement_cache_size": 0,
        },
    )
    factory = async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)
    try:
        async with factory() as session:
            await reconcile_initial_install(session)
    finally:
        await async_engine.dispose()
