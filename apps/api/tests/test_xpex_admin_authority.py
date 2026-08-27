from types import SimpleNamespace

import pytest

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
