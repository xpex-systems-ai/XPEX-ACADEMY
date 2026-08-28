from types import SimpleNamespace

import pytest

from src.security.rbac.constants import ADMIN_ROLE_ID
from src.services.courses.locks import is_org_admin


class FakeResult:
    def __init__(self, value):
        self.value = value

    def scalars(self):
        return self

    def first(self):
        return self.value


class FakeSession:
    def __init__(self, *values):
        self.values = iter(values)

    async def execute(self, _statement):
        return FakeResult(next(self.values))


@pytest.mark.asyncio
async def test_platform_superadmin_is_org_admin_without_org_membership():
    user = SimpleNamespace(is_superadmin=True)
    session = FakeSession(user)

    assert await is_org_admin(42, 9001, session) is True


@pytest.mark.asyncio
async def test_ordinary_user_without_org_membership_is_not_org_admin():
    user = SimpleNamespace(is_superadmin=False)
    session = FakeSession(user, None)

    assert await is_org_admin(42, 9001, session) is False


@pytest.mark.asyncio
async def test_organization_admin_is_authorized_only_when_membership_query_matches_tenant():
    user = SimpleNamespace(is_superadmin=False)
    matching_membership = SimpleNamespace(role_id=ADMIN_ROLE_ID)

    organization_a = FakeSession(user, matching_membership)
    organization_b = FakeSession(user, None)

    assert await is_org_admin(42, 1001, organization_a) is True
    assert await is_org_admin(42, 2002, organization_b) is False


@pytest.mark.asyncio
@pytest.mark.parametrize("role_id", [3, 4])
async def test_student_and_teacher_memberships_do_not_grant_admin(role_id):
    user = SimpleNamespace(is_superadmin=False)
    ordinary_membership = SimpleNamespace(role_id=role_id)
    session = FakeSession(user, ordinary_membership, None)

    assert await is_org_admin(42, 1001, session) is False
