import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlmodel import SQLModel, select
from src.db.xpex_catalog import XPeXAssessment, XPeXCourse, XPeXLesson, XPeXModule, XPeXWaveMediaJob
from src.services.xpex.official_catalog import seed_official_catalog
from src.services.xpex.wave1_courses import (
    CANARY_LESSON_KEY,
    WAVE1_COURSES,
    create_controlled_video_job,
    next_media_status,
    seed_wave1_courses,
    submit_assessment,
    verify_wave1_preflight,
)


@pytest.fixture
async def session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    names = (
        "xpex_catalog_versions", "xpex_schools", "xpex_tracks", "xpex_courses",
        "xpex_modules", "xpex_lessons", "xpex_assessments", "xpex_assessment_attempts", "xpex_wave_media_jobs",
    )
    async with engine.begin() as connection:
        await connection.run_sync(lambda conn: SQLModel.metadata.create_all(conn, tables=[SQLModel.metadata.tables[name] for name in names]))
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as value:
        yield value
    await engine.dispose()


@pytest.mark.asyncio
async def test_wave1_factory_persists_complete_private_curricula(session) -> None:
    await seed_official_catalog(session)
    assert await verify_wave1_preflight(session) == {"schools": 9, "courses": 156}
    first = await seed_wave1_courses(session)
    second = await seed_wave1_courses(session)
    assert first == second
    assert len(WAVE1_COURSES) == 10
    modules = (await session.execute(select(XPeXModule))).scalars().all()
    lessons = (await session.execute(select(XPeXLesson))).scalars().all()
    assessments = (await session.execute(select(XPeXAssessment))).scalars().all()
    wave_keys = {spec.key for spec in WAVE1_COURSES}
    courses = (await session.execute(select(XPeXCourse).where(XPeXCourse.course_key.in_(wave_keys)))).scalars().all()
    assert (len(modules), len(lessons), len(assessments)) == (40, 160, 50)
    assert all(course.publication_status == "PRIVATE" for course in courses)
    assert all(course.qa_status == "AWAITING_HUMAN_APPROVAL" for course in courses)
    assert all(lesson.learning_objective and lesson.lesson_script and lesson.summary for lesson in lessons)
    assert all(lesson.exercise_json and lesson.practical_activity_json and lesson.completion_criteria_json for lesson in lessons)
    assert all(assessment.questions_json and assessment.passing_score == 70 for assessment in assessments)


@pytest.mark.asyncio
async def test_preflight_stops_if_any_official_course_is_not_private(session) -> None:
    await seed_official_catalog(session)
    course = (await session.execute(select(XPeXCourse).limit(1))).scalars().one()
    course.publication_status = "PUBLISHED"
    await session.commit()
    with pytest.raises(RuntimeError, match="not PRIVATE"):
        await verify_wave1_preflight(session)


@pytest.mark.asyncio
async def test_exactly_one_canary_is_created_for_ai_zero(session) -> None:
    await seed_official_catalog(session)
    await seed_wave1_courses(session)
    first = await create_controlled_video_job(session, "open-source-provider")
    second = await create_controlled_video_job(session, "different-provider")
    assert first.id == second.id
    assert first.status == "SCRIPT_READY"
    jobs = (await session.execute(select(XPeXWaveMediaJob))).scalars().all()
    lesson = (await session.execute(select(XPeXLesson).where(XPeXLesson.id == first.lesson_id))).scalars().one()
    assert len(jobs) == 1
    assert lesson.lesson_key == CANARY_LESSON_KEY


@pytest.mark.asyncio
async def test_assessment_scores_are_persisted_and_retries_are_bounded(session) -> None:
    await seed_official_catalog(session)
    await seed_wave1_courses(session)
    first = await submit_assessment(session, assessment_key="XPEX-S02-C01-A-FINAL", learner_key="test-learner", answers=[0, 0, 0, 0])
    assert first.score == 100 and first.passed is True and first.attempt_number == 1
    await submit_assessment(session, assessment_key="XPEX-S02-C01-A-FINAL", learner_key="test-learner", answers=[1, 1, 1, 1])
    await submit_assessment(session, assessment_key="XPEX-S02-C01-A-FINAL", learner_key="test-learner", answers=[1, 1, 1, 1])
    with pytest.raises(PermissionError, match="retry limit"):
        await submit_assessment(session, assessment_key="XPEX-S02-C01-A-FINAL", learner_key="test-learner", answers=[0, 0, 0, 0])


def test_media_pipeline_requires_complete_qa_and_stops_at_human_gate() -> None:
    artifact = {"uri": "private/canary.mp4", "checksum_sha256": "a" * 64, "mime_type": "video/mp4", "duration_seconds": 90, "captions_uri": "private/canary.vtt"}
    qa = {"file_valid": True, "audio_valid": True, "duration_valid": True, "playback_valid": True, "captions_valid": True}
    assert next_media_status("MEDIA_QA", "AWAITING_HUMAN_APPROVAL", artifact=artifact, qa=qa) == "AWAITING_HUMAN_APPROVAL"
    with pytest.raises(PermissionError, match="SUPER_ADMIN"):
        next_media_status("AWAITING_HUMAN_APPROVAL", "APPROVED")
    with pytest.raises(ValueError, match="media QA"):
        next_media_status("MEDIA_QA", "AWAITING_HUMAN_APPROVAL", artifact=artifact, qa={**qa, "audio_valid": False})
