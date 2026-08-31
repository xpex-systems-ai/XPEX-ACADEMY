from datetime import UTC, datetime

import pytest
from sqlmodel import select

from src.db.organizations import Organization
from src.db.roles import Role, RoleTypeEnum
from src.db.user_organizations import UserOrganization
from src.db.users import User
from src.services.setup import teacher_provisioning
from src.services.setup.teacher_provisioning import (
    TeacherProvisioningRefused,
    provision_configured_teacher,
)


def _now() -> str:
    return str(datetime.now(UTC))


async def _seed_transfer(db, *, new_superadmin: bool = False):
    org = Organization(
        name="XPeX",
        slug="default",
        email="",
        org_uuid="org_default",
        creation_date=_now(),
        update_date=_now(),
    )
    teacher_role = Role(
        id=3,
        name="Instructor",
        role_uuid="role_global_instructor",
        role_type=RoleTypeEnum.TYPE_GLOBAL,
        creation_date=_now(),
        update_date=_now(),
    )
    student_role = Role(
        id=4,
        name="User",
        role_uuid="role_global_user",
        role_type=RoleTypeEnum.TYPE_GLOBAL,
        creation_date=_now(),
        update_date=_now(),
    )
    old_user = User(
        username="old-teacher",
        first_name="Old",
        last_name="Teacher",
        email="kelledigital@outlook.com",
        password="already-hashed",
        user_uuid="old_teacher_uuid",
        is_superadmin=False,
        creation_date=_now(),
        update_date=_now(),
    )
    new_user = User(
        username="new-teacher",
        first_name="New",
        last_name="Teacher",
        email="XPeXOS@gmail.com",
        password="already-hashed",
        user_uuid="new_teacher_uuid",
        is_superadmin=new_superadmin,
        creation_date=_now(),
        update_date=_now(),
    )
    db.add_all([org, teacher_role, student_role, old_user, new_user])
    await db.commit()
    for item in (org, old_user, new_user):
        await db.refresh(item)
    db.add_all(
        [
            UserOrganization(
                user_id=old_user.id,
                org_id=org.id,
                role_id=teacher_role.id,
                creation_date=_now(),
                update_date=_now(),
            ),
            UserOrganization(
                user_id=new_user.id,
                org_id=org.id,
                role_id=student_role.id,
                creation_date=_now(),
                update_date=_now(),
            ),
        ]
    )
    await db.commit()
    return old_user, new_user


def _configure(monkeypatch):
    monkeypatch.setenv("LEARNHOUSE_TEACHER_BOOTSTRAP_ENABLED", "true")
    monkeypatch.setenv("LEARNHOUSE_INITIAL_TEACHER_EMAIL", "xpexos@gmail.com")
    monkeypatch.setenv("LEARNHOUSE_PREVIOUS_TEACHER_EMAIL", "kelledigital@outlook.com")
    monkeypatch.setenv("LEARNHOUSE_INITIAL_TEACHER_ORG_SLUG", "default")


async def test_transfers_teacher_role_case_insensitively_and_is_idempotent(db, monkeypatch):
    old_user, new_user = await _seed_transfer(db)
    _configure(monkeypatch)
    revoked = []
    monkeypatch.setattr(teacher_provisioning, "revoke_user_sessions_before", revoked.append)

    assert await provision_configured_teacher(db) == "transferred"
    assert await provision_configured_teacher(db) == "already-transferred"

    memberships = {
        item.user_id: item
        for item in (await db.execute(select(UserOrganization))).scalars().all()
    }
    assert memberships[old_user.id].role_id == 4
    assert memberships[new_user.id].role_id == 3
    assert revoked == [new_user.id, old_user.id]


async def test_transfer_refuses_superadmin_target_without_changing_roles(db, monkeypatch):
    old_user, new_user = await _seed_transfer(db, new_superadmin=True)
    _configure(monkeypatch)

    with pytest.raises(TeacherProvisioningRefused, match="must not be a superadmin"):
        await provision_configured_teacher(db)

    memberships = {
        item.user_id: item
        for item in (await db.execute(select(UserOrganization))).scalars().all()
    }
    assert memberships[old_user.id].role_id == 3
    assert memberships[new_user.id].role_id == 4
