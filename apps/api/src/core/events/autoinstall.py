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
from src.core.redis import get_redis_client
from src.security.rbac.constants import ADMIN_ROLE_ID
from src.security.security import security_hash_password
from src.services.setup.setup import (
    install_create_organization,
    install_create_organization_user,
    install_default_elements,
)

logger = logging.getLogger(__name__)


def _invalidate_user_session_cache(user_id: int | None) -> None:
    """Discard role/profile data cached before bootstrap reconciliation."""
    if user_id is None:
        return
    try:
        redis_client = get_redis_client()
        if redis_client is not None:
            redis_client.delete(f"session:{user_id}")
    except Exception:
        logger.debug(
            "Session cache invalidation failed for reconciled user %s",
            user_id,
            exc_info=True,
        )


def _to_async_url(url: str) -> str:
    for prefix in ("postgresql+psycopg2://", "postgresql://", "postgres://"):
        if url.startswith(prefix):
            return url.replace(prefix, "postgresql+asyncpg://", 1)
    return url


async def _ensure_org(db_session: AsyncSession, org_slug: str, org_name: str) -> Organization:
    organizations = (await db_session.execute(select(Organization))).scalars().all()
    org = next((item for item in organizations if item.slug == org_slug), None)
    if org is not None:
        return org
    return await install_create_organization(
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


async def _ensure_admin_membership(
    db_session: AsyncSession, user: User, org: Organization
) -> None:
    membership = (
        await db_session.execute(
            select(UserOrganization).where(
                UserOrganization.user_id == user.id,
                UserOrganization.org_id == org.id,
            )
        )
    ).scalars().first()
    now = str(datetime.now(UTC))
    if membership is None:
        db_session.add(
            UserOrganization(
                user_id=user.id or 0,
                org_id=org.id or 0,
                role_id=ADMIN_ROLE_ID,
                creation_date=now,
                update_date=now,
            )
        )
    elif membership.role_id != ADMIN_ROLE_ID:
        membership.role_id = ADMIN_ROLE_ID
        membership.update_date = now
        db_session.add(membership)


async def _reconcile_requested_admin_credentials(db_session: AsyncSession) -> bool:
    """Explicitly reconcile the canonical superadmin from Railway variables."""
    enabled = os.environ.get("XPEX_ADMIN_PASSWORD_SYNC_ENABLED", "").strip().lower() == "true"
    if not enabled:
        return False

    email = (os.environ.get("LEARNHOUSE_INITIAL_ADMIN_EMAIL") or "").strip().lower()
    password = os.environ.get("LEARNHOUSE_INITIAL_ADMIN_PASSWORD") or ""
    org_name = os.environ.get("LEARNHOUSE_INITIAL_ORG_NAME", "Kelle Digital Lab")
    org_slug = os.environ.get("LEARNHOUSE_INITIAL_ORG_SLUG", "kelle-digital-lab").strip().lower()
    if not email or not password:
        raise RuntimeError("Admin credential sync requested without email/password")

    await install_default_elements(db_session)
    org = await _ensure_org(db_session, org_slug, org_name)

    user = (await db_session.execute(select(User).where(User.email == email))).scalars().first()
    if user is None:
        user = (await db_session.execute(select(User).where(User.username == "admin"))).scalars().first()

    if user is None:
        created = await install_create_organization_user(
            UserCreate(username="admin", email=email, password=password),
            org_slug,
            db_session,
            is_superadmin=True,
        )
        user = (await db_session.execute(select(User).where(User.id == created.id))).scalars().one()
    else:
        user.email = email
        user.username = "admin"
        user.password = security_hash_password(password)
        user.is_superadmin = True
        user.email_verified = True
        user.email_verified_at = str(datetime.now(UTC))
        user.failed_login_attempts = 0
        user.locked_until = None
        user.password_changed_at = datetime.now()
        user.update_date = str(datetime.now(UTC))
        db_session.add(user)

    await _ensure_admin_membership(db_session, user, org)
    await db_session.commit()
    _invalidate_user_session_cache(user.id)
    logger.warning("Canonical administrator credentials reconciled for email=%s", email)
    return True


async def _reconcile_requested_polo_credentials(db_session: AsyncSession) -> bool:
    """Reconcile the canonical Kelle polo administrator without exposing secrets.

    The password is intentionally read only from Railway through
    LEARNHOUSE_INITIAL_TEACHER_PASSWORD. If the feature is enabled but that secret
    has not been configured yet, startup remains healthy and reconciliation is
    skipped with a warning.
    """
    enabled = (
        os.environ.get("LEARNHOUSE_TEACHER_BOOTSTRAP_ENABLED", "")
        .strip()
        .lower()
        == "true"
    )
    if not enabled:
        return False

    email = (os.environ.get("LEARNHOUSE_INITIAL_TEACHER_EMAIL") or "").strip().lower()
    password = os.environ.get("LEARNHOUSE_INITIAL_TEACHER_PASSWORD") or ""
    previous_email = (os.environ.get("LEARNHOUSE_PREVIOUS_TEACHER_EMAIL") or "").strip().lower()
    org_slug = (
        os.environ.get("LEARNHOUSE_INITIAL_TEACHER_ORG_SLUG")
        or os.environ.get("LEARNHOUSE_INITIAL_ORG_SLUG")
        or "kelle-digital-lab"
    ).strip().lower()
    org_name = os.environ.get("LEARNHOUSE_INITIAL_ORG_NAME", "Kelle Digital Lab")

    if not email:
        logger.warning("Polo credential sync enabled without canonical email; skipping")
        return False
    if not password:
        logger.warning(
            "Polo credential sync pending for email=%s because password secret is not configured",
            email,
        )
        return False

    await install_default_elements(db_session)
    org = await _ensure_org(db_session, org_slug, org_name)

    user = (await db_session.execute(select(User).where(User.email == email))).scalars().first()
    if user is None and previous_email:
        user = (
            await db_session.execute(select(User).where(User.email == previous_email))
        ).scalars().first()

    if user is None:
        # Use a unique username so a historical admin/teacher username cannot block startup.
        username = "kelle-polo-admin"
        existing_username = (
            await db_session.execute(select(User).where(User.username == username))
        ).scalars().first()
        if existing_username is not None:
            user = existing_username
        else:
            created = await install_create_organization_user(
                UserCreate(username=username, email=email, password=password),
                org_slug,
                db_session,
                is_superadmin=False,
            )
            user = (
                await db_session.execute(select(User).where(User.id == created.id))
            ).scalars().one()

    user.email = email
    user.username = "kelle-polo-admin"
    user.password = security_hash_password(password)
    user.is_superadmin = False
    user.email_verified = True
    user.email_verified_at = str(datetime.now(UTC))
    user.failed_login_attempts = 0
    user.locked_until = None
    user.password_changed_at = datetime.now()
    user.update_date = str(datetime.now(UTC))
    db_session.add(user)

    await _ensure_admin_membership(db_session, user, org)
    await db_session.commit()
    _invalidate_user_session_cache(user.id)
    logger.warning("Canonical polo administrator credentials reconciled for email=%s", email)
    return True


async def reconcile_initial_install(db_session: AsyncSession) -> None:
    admin_reconciled = await _reconcile_requested_admin_credentials(db_session)
    polo_reconciled = await _reconcile_requested_polo_credentials(db_session)
    if admin_reconciled or polo_reconciled:
        return

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
    else:
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

    user = (await db_session.execute(select(User).where(User.email == email))).scalars().first()
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
        user = (await db_session.execute(select(User).where(User.id == created.id))).scalars().one()
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
