"""Lock-based access checks for chapters and activities.

Mirrors the Playground access-type pattern but keyed on chapter_uuid /
activity_uuid in ``usergroupresource``. Lock tiers:

- ``public``:        anyone, including anonymous, can read
- ``authenticated``: must be signed in
- ``restricted``:    must be in an assigned usergroup (or an org admin)

Batch helpers are provided for TOC-style reads where many resources need
to be checked at once without N+1 queries.
"""

from collections.abc import Iterable

from pydantic import ValidationError
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from src.db.roles import Rights, Role, RoleTypeEnum
from src.db.user_organizations import UserOrganization
from src.db.usergroup_resources import UserGroupResource
from src.db.usergroup_user import UserGroupUser
from src.db.users import AnonymousUser, APITokenUser, PublicUser, User
from src.security.auth import resolve_acting_user_id
from src.security.rbac.constants import ADMIN_OR_MAINTAINER_ROLE_IDS


def _role_has_editor_access(role: Role | None, org_id: int) -> bool:
    """Recognize only organization-scoped custom roles as editor-equivalent.

    Global roles such as Instructor must never become organization-admin bypasses
    merely because their capabilities include dashboard access and course creation.
    Capability-based elevation is accepted only when the Role row is explicitly
    scoped to the requested organization. Malformed/incomplete rights fail closed.
    """
    if (
        role is None
        or role.role_type != RoleTypeEnum.TYPE_ORGANIZATION
        or role.org_id != org_id
        or not role.rights
    ):
        return False
    try:
        rights = role.rights if isinstance(role.rights, Rights) else Rights.model_validate(role.rights)
    except ValidationError:
        return False
    return bool(rights.dashboard.action_access and rights.courses.action_create)


async def is_org_admin(user_id: int, org_id: int, db_session: AsyncSession) -> bool:
    """True for platform superadmins, seeded org admins/maintainers, or scoped editors.

    A platform superadmin is intentionally an organization-independent authority.
    This matters for the XPeX control plane because the same authenticated
    superadmin may legitimately carry an ordinary learner membership in the org.
    Global instructor/member roles are still never elevated by capability alone.
    """
    user = (
        await db_session.execute(select(User).where(User.id == user_id))
    ).scalars().first()
    if user is not None and user.is_superadmin is True:
        return True

    uo = (
        await db_session.execute(
            select(UserOrganization).where(
                UserOrganization.user_id == user_id,
                UserOrganization.org_id == org_id,
            )
        )
    ).scalars().first()
    if not uo:
        return False
    if uo.role_id in ADMIN_OR_MAINTAINER_ROLE_IDS:
        return True

    role = (
        await db_session.execute(select(Role).where(Role.id == uo.role_id))
    ).scalars().first()
    return _role_has_editor_access(role if isinstance(role, Role) else None, org_id)


async def batch_accessible_restricted_uuids(
    user_id: int,
    resource_uuids: Iterable[str],
    db_session: AsyncSession,
) -> set[str]:
    """Return the subset of resource_uuids the user can access via usergroup."""
    uuids = [u for u in resource_uuids if u]
    if not uuids:
        return set()

    ugrs = (await db_session.execute(
        select(
            UserGroupResource.resource_uuid,
            UserGroupResource.usergroup_id,
        ).where(UserGroupResource.resource_uuid.in_(uuids))
    )).all()
    if not ugrs:
        return set()

    ug_ids = list({row[1] for row in ugrs})
    member_ug_ids = set(
        (await db_session.execute(
            select(UserGroupUser.usergroup_id).where(
                UserGroupUser.usergroup_id.in_(ug_ids),
                UserGroupUser.user_id == user_id,
            )
        )).scalars().all()
    )
    return {resource_uuid for resource_uuid, ug_id in ugrs if ug_id in member_ug_ids}


async def is_locked_for_user(
    lock_type: str | None,
    resource_uuid: str,
    org_id: int,
    current_user: PublicUser | AnonymousUser | APITokenUser,
    db_session: AsyncSession,
    *,
    accessible_restricted_uuids: set[str] | None = None,
    is_admin: bool | None = None,
) -> bool:
    """True if the resource should be hidden from current_user.

    ``accessible_restricted_uuids`` and ``is_admin`` are pre-computed escape
    hatches for batch callers -- they avoid repeating the same queries for
    every row. When absent, this function resolves them on its own.
    """
    lt = (lock_type or "public").lower()
    if lt == "public":
        return False

    is_anon = isinstance(current_user, AnonymousUser)
    if lt == "authenticated":
        return is_anon

    if lt != "restricted":
        # Unknown value -- fail safe (treat as public to avoid accidentally
        # locking people out after a rename/migration mishap).
        return False

    if is_anon:
        return True

    acting_user_id = resolve_acting_user_id(current_user)
    admin = is_admin if is_admin is not None else await is_org_admin(acting_user_id, org_id, db_session)
    if admin:
        return False

    if accessible_restricted_uuids is not None:
        return resource_uuid not in accessible_restricted_uuids

    accessible = await batch_accessible_restricted_uuids(
        acting_user_id, [resource_uuid], db_session
    )
    return resource_uuid not in accessible
