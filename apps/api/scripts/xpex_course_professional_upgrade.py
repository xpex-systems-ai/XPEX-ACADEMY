"""Guarded professional-content upgrade for the official XPeX AI course.

Dry-run is the default. With --execute, this script enriches the existing course
without deleting or replacing student progress: it adds one professional lab/challenge
Markdown activity to each of the 11 existing chapters and one specialization-track
chapter. It never creates fake video assets or certificates.
"""

import argparse
import asyncio
import os
from datetime import UTC, datetime
from uuid import uuid4

from config.config import get_learnhouse_config
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from src.db.courses.activities import Activity, ActivityLockType, ActivitySubTypeEnum, ActivityTypeEnum
from src.db.courses.chapter_activities import ChapterActivity
from src.db.courses.chapters import Chapter, LockType
from src.db.courses.course_chapters import CourseChapter
from src.db.courses.courses import Course
from src.db.organizations import Organization

COURSE_NAME = "Inteligência Artificial — do Básico ao Avançado"
RAW_BASE = "https://raw.githubusercontent.com/xpex-systems-ai/XPEX-ACADEMY/dev/docs/courses/ia-do-basico-ao-avancado"

MODULES = [
    (1, "Fundamentos de Inteligência Artificial", "pro/01-fundamentos-pro.md"),
    (2, "Como funcionam LLMs e IA generativa", "pro/02-llms-pro.md"),
    (3, "Prompt Engineering", "pro/03-prompts-pro.md"),
    (4, "Ferramentas de IA para produtividade", "pro/04-produtividade-criacao-pro.md"),
    (5, "Automação com IA", "pro/05-automacao-pro.md"),
    (6, "APIs e integrações", "pro/06-apis-pro.md"),
    (7, "RAG e conhecimento privado", "pro/07-rag-pro.md"),
    (8, "Agentes de IA", "pro/08-agentes-pro.md"),
    (9, "Construção de projetos reais", "pro/09-projetos-pro.md"),
    (10, "IA aplicada a negócios e carreira", "pro/10-negocios-carreira-pro.md"),
    (11, "Projeto final", "pro/11-projeto-final-pro.md"),
]


def _to_async_url(url: str) -> str:
    if "+asyncpg" in url:
        return url
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


async def _get_one(session: AsyncSession, statement, blocked: str):
    rows = list((await session.execute(statement)).scalars().all())
    if len(rows) != 1:
        raise RuntimeError(f"{blocked} count={len(rows)}")
    return rows[0]


async def _ensure_markdown_activity(
    session: AsyncSession,
    org: Organization,
    course: Course,
    chapter: Chapter,
    name: str,
    markdown_path: str,
    order: int,
    metadata: dict,
) -> tuple[Activity, bool]:
    activities = list((await session.execute(select(Activity).where(
        Activity.org_id == org.id,
        Activity.course_id == course.id,
        Activity.name == name,
    ))).scalars().all())
    if len(activities) > 1:
        raise RuntimeError(f"ambiguous_activity name={name}")
    now = str(datetime.now(UTC))
    created = False
    if activities:
        activity = activities[0]
        activity.activity_type = ActivityTypeEnum.TYPE_DYNAMIC
        activity.activity_sub_type = ActivitySubTypeEnum.SUBTYPE_DYNAMIC_MARKDOWN
        activity.content = {"markdown_url": f"{RAW_BASE}/{markdown_path}"}
        activity.details = metadata
        activity.extra_metadata = {**(activity.extra_metadata or {}), **metadata}
        activity.published = True
        activity.lock_type = ActivityLockType.AUTHENTICATED
        activity.update_date = now
        session.add(activity)
    else:
        created = True
        activity = Activity(
            name=name,
            activity_type=ActivityTypeEnum.TYPE_DYNAMIC,
            activity_sub_type=ActivitySubTypeEnum.SUBTYPE_DYNAMIC_MARKDOWN,
            content={"markdown_url": f"{RAW_BASE}/{markdown_path}"},
            details=metadata,
            published=True,
            lock_type=ActivityLockType.AUTHENTICATED,
            org_id=org.id,
            course_id=course.id,
            activity_uuid=f"activity_{uuid4()}",
            creation_date=now,
            update_date=now,
            extra_metadata=metadata,
        )
        session.add(activity)
        await session.flush()

    link = (await session.execute(select(ChapterActivity).where(
        ChapterActivity.chapter_id == chapter.id,
        ChapterActivity.activity_id == activity.id,
    ))).scalars().one_or_none()
    if link is None:
        session.add(ChapterActivity(
            order=order,
            chapter_id=chapter.id,
            activity_id=activity.id,
            course_id=course.id,
            org_id=org.id,
            creation_date=now,
            update_date=now,
        ))
    else:
        link.order = order
        link.update_date = now
        session.add(link)
    return activity, created


async def run(org_slug: str, execute: bool) -> int:
    config = get_learnhouse_config()
    engine = create_async_engine(_to_async_url(config.database_config.sql_connection_string), pool_pre_ping=True)  # type: ignore[attr-defined]
    try:
        async with AsyncSession(engine, expire_on_commit=False) as session:
            try:
                org = await _get_one(session, select(Organization).where(Organization.slug == org_slug), "organization_scope")
                course = await _get_one(session, select(Course).where(Course.org_id == org.id, Course.name == COURSE_NAME), "course_scope")
                chapters = list((await session.execute(select(Chapter).where(Chapter.org_id == org.id, Chapter.course_id == course.id))).scalars().all())
                by_name = {chapter.name: chapter for chapter in chapters}
                missing = [name for _, name, _ in MODULES if name not in by_name]
                if missing:
                    print(f"BLOCKED missing_required_chapters={len(missing)}")
                    return 3

                existing_labs = 0
                for module, module_name, _ in MODULES:
                    lab_name = f"Laboratório profissional — Módulo {module}: {module_name}"
                    matches = list((await session.execute(select(Activity).where(
                        Activity.org_id == org.id,
                        Activity.course_id == course.id,
                        Activity.name == lab_name,
                    ))).scalars().all())
                    if len(matches) > 1:
                        print(f"BLOCKED ambiguous_lab module={module}")
                        return 4
                    existing_labs += len(matches)

                mode = "EXECUTE" if execute else "DRY_RUN"
                print(f"{mode} course_id={course.id} existing_chapters={len(chapters)} existing_professional_labs={existing_labs}")
                if not execute:
                    print("DRY_RUN will_add_or_repair_labs=11 specialization_chapter=1 delete_existing=false")
                    return 0

                course.about = (
                    "Formação profissional de 8 semanas com prática orientada, laboratório de IA, "
                    "projetos, portfólio, Demo Day e trilhas de especialização."
                )
                course.learnings = (
                    "Fundamentos digitais; IA e LLMs; prompt engineering; criação digital; automação; "
                    "APIs; RAG; agentes; projetos; negócios e carreira; projeto final"
                )
                course.tags = "inteligência artificial,IA,criação digital,automação,RAG,agentes,projetos,carreira"
                course.extra_metadata = {
                    **(course.extra_metadata or {}),
                    "xpex_program_version": "professional-2026.1",
                    "xpex_duration_weeks": 8,
                    "xpex_sessions_per_week": 2,
                    "xpex_method": "aprender-praticar-criar-apresentar",
                    "xpex_specialization_tracks": 6,
                }
                course.update_date = str(datetime.now(UTC))
                session.add(course)

                created_labs = 0
                for module, module_name, markdown_path in MODULES:
                    _activity, created = await _ensure_markdown_activity(
                        session,
                        org,
                        course,
                        by_name[module_name],
                        f"Laboratório profissional — Módulo {module}: {module_name}",
                        markdown_path,
                        2,
                        {"xpex_module": module, "xpex_activity_kind": "lab_challenge", "xpex_program_version": "professional-2026.1"},
                    )
                    created_labs += int(created)

                now = str(datetime.now(UTC))
                track_chapters = list((await session.execute(select(Chapter).where(
                    Chapter.org_id == org.id,
                    Chapter.course_id == course.id,
                    Chapter.name == "Trilhas de Especialização",
                ))).scalars().all())
                if len(track_chapters) > 1:
                    raise RuntimeError("ambiguous_specialization_chapter")
                if track_chapters:
                    track_chapter = track_chapters[0]
                    track_chapter.description = "Caminhos complementares para aprofundamento profissional depois do núcleo principal."
                    track_chapter.lock_type = LockType.AUTHENTICATED
                    track_chapter.update_date = now
                    session.add(track_chapter)
                else:
                    track_chapter = Chapter(
                        name="Trilhas de Especialização",
                        description="Caminhos complementares para aprofundamento profissional depois do núcleo principal.",
                        thumbnail_image="",
                        lock_type=LockType.AUTHENTICATED,
                        org_id=org.id,
                        course_id=course.id,
                        chapter_uuid=f"chapter_{uuid4()}",
                        creation_date=now,
                        update_date=now,
                        extra_metadata={"xpex_program_version": "professional-2026.1", "xpex_track_hub": True},
                    )
                    session.add(track_chapter)
                    await session.flush()

                cc = (await session.execute(select(CourseChapter).where(
                    CourseChapter.course_id == course.id,
                    CourseChapter.chapter_id == track_chapter.id,
                ))).scalars().one_or_none()
                if cc is None:
                    session.add(CourseChapter(order=12, course_id=course.id, chapter_id=track_chapter.id, org_id=org.id, creation_date=now, update_date=now))
                else:
                    cc.order = 12
                    cc.update_date = now
                    session.add(cc)

                await _ensure_markdown_activity(
                    session,
                    org,
                    course,
                    track_chapter,
                    "Trilhas profissionais XPeX — escolha seu próximo projeto",
                    "TRILHAS-DE-ESPECIALIZACAO.md",
                    1,
                    {"xpex_activity_kind": "specialization_hub", "xpex_program_version": "professional-2026.1"},
                )

                await session.commit()

                final_chapters = len(list((await session.execute(select(Chapter).where(Chapter.org_id == org.id, Chapter.course_id == course.id))).scalars().all()))
                final_labs = len(list((await session.execute(select(Activity).where(
                    Activity.org_id == org.id,
                    Activity.course_id == course.id,
                    Activity.extra_metadata["xpex_program_version"].as_string() == "professional-2026.1",
                ))).scalars().all()))
                print(f"PASS professional_course_ready course_id={course.id} chapters={final_chapters} pro_activities={final_labs} newly_created_labs={created_labs}")
                return 0
            except RuntimeError as exc:
                await session.rollback()
                print(f"BLOCKED professional_upgrade_failed type={type(exc).__name__}")
                return 5
    finally:
        await engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--org-slug", default=os.getenv("XPEX_LAUNCH_ORG_SLUG", "default"))
    parser.add_argument("--execute", action="store_true")
    args = parser.parse_args()
    raise SystemExit(asyncio.run(run(args.org_slug, args.execute)))


if __name__ == "__main__":
    main()
