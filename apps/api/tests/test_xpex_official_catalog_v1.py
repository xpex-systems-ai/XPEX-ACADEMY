from uuid import uuid5

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlmodel import SQLModel, select
from src.db.xpex_catalog import XPeXCourse
from src.services.xpex.official_catalog import (
    CATALOG_KEY,
    CATALOG_NAMESPACE,
    OFFICIAL_COURSES,
    OFFICIAL_SCHOOLS,
    seed_official_catalog,
    validate_official_catalog,
)


def test_official_catalog_has_exact_approved_shape() -> None:
    validate_official_catalog()
    assert len(OFFICIAL_SCHOOLS) == 9
    assert len(OFFICIAL_COURSES) == 156
    assert [len(school.courses) for school in OFFICIAL_SCHOOLS] == [10, 12, 20, 18, 18, 20, 18, 20, 20]
    assert [school.school_key for school in OFFICIAL_SCHOOLS] == [f"XPEX-S{i:02d}" for i in range(1, 10)]


def test_course_identifiers_are_unique_and_stable() -> None:
    keys = [course.course_key for course in OFFICIAL_COURSES]
    slugs = [course.slug for course in OFFICIAL_COURSES]
    uuids = [uuid5(CATALOG_NAMESPACE, key) for key in keys]
    assert len(keys) == len(set(keys))
    assert len(slugs) == len(set(slugs))
    assert len(uuids) == len(set(uuids))
    assert keys[0] == "XPEX-S01-C01"
    assert keys[-1] == "XPEX-S09-C20"


def test_seed_contract_is_private_and_does_not_generate_learning_content() -> None:
    source = __import__("inspect").getsource(__import__("src.services.xpex.official_catalog", fromlist=["seed_official_catalog"]).seed_official_catalog)
    assert CATALOG_KEY == "XPEX_OFFICIAL_CATALOG_V1"
    assert XPeXCourse.model_fields["lifecycle_status"].default == "CATALOG_REGISTERED"
    assert XPeXCourse.model_fields["publication_status"].default == "PRIVATE"
    assert '"CATALOG_REGISTERED", "PRIVATE"' in source
    assert "XPeXModule(" not in source
    assert "XPeXLesson(" not in source


@pytest.mark.asyncio
async def test_seed_is_idempotent_and_keeps_every_course_private() -> None:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(SQLModel.metadata.create_all)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        assert await seed_official_catalog(session) == {
            "catalog_key": CATALOG_KEY,
            "schools": 9,
            "courses": 156,
        }
        await seed_official_catalog(session)
        courses = (await session.execute(select(XPeXCourse))).scalars().all()
        assert len(courses) == 156
        assert {course.publication_status for course in courses} == {"PRIVATE"}
        assert {course.lifecycle_status for course in courses} == {"CATALOG_REGISTERED"}
    await engine.dispose()
