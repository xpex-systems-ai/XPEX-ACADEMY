"""Guarded, idempotent bootstrap for the first official XPeX Academy course.

The command is dry-run by default. With --execute it creates or repairs exactly one
course in the target organization, 11 ordered chapters and one published Markdown
lesson per chapter. It refuses ambiguous course/author scope and never prints PII.
"""

import argparse
import asyncio
import os
from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from config.config import get_learnhouse_config
from src.db.courses.activities import (
    Activity,
    ActivityLockType,
    ActivitySubTypeEnum,
    ActivityTypeEnum,
)
from src.db.courses.chapter_activities import ChapterActivity
from src.db.courses.chapters import Chapter, LockType
from src.db.courses.course_chapters import CourseChapter
from src.db.courses.courses import Course, ThumbnailType
from src.db.organizations import Organization
from src.db.resource_authors import (
    ResourceAuthor,
    ResourceAuthorshipEnum,
    ResourceAuthorshipStatusEnum,
)
from src.db.user_organizations import UserOrganization
from src.db.users import User

COURSE_NAME = "Inteligência Artificial — do Básico ao Avançado"
COURSE_SLUG = "ia-do-basico-ao-avancado"
COURSE_DESCRIPTION = (
    "Formação prática em inteligência artificial, do fundamento à construção de "
    "automações, RAG, agentes e projetos aplicados a negócios e carreira."
)
RAW_BASE = (
    "https://raw.githubusercontent.com/xpex-systems-ai/XPEX-ACADEMY/dev/"
    "docs/courses/ia-do-basico-ao-avancado"
)

MODULES = [
    ("Fundamentos de Inteligência Artificial", "01-fundamentos.md"),
    ("Como funcionam LLMs e IA generativa", "02-llms-ia-generativa.md"),
    ("Prompt Engineering", "03-prompt-engineering.md"),
    ("Ferramentas de IA para produtividade", "04-produtividade.md"),
    ("Automação com IA", "05-automacao.md"),
    ("APIs e integrações", "06-apis-integracoes.md"),
    ("RAG e conhecimento privado", "07-rag.md"),
    ("Agentes de IA", "08-agentes.md"),
    ("Construção de projetos reais", "09-projetos-reais.md"),
    ("IA aplicada a negócios e carreira", "10-negocios-carreira.md"),
    ("Projeto final", "11-projeto-final.md"),
]


def _to_async_url(url: str) -> str:
    if "+asyncpg" in url:
        return url
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


async def _resolve_author(
    session: AsyncSession, org: Organization, explicit_uuid: str | None
) -> User | None:
    if explicit_uuid:
        return (
            await session.execute(
                select(User)
                .join(UserOrganization, UserOrganization.user_id == User.id)
                .where(
                    User.user_uuid == explicit_uuid,
                    UserOrganization.org_id == org.id,
                )
            )
        ).scalars().one_or_none()

    candidates = list(
        (
            await session.execute(
                select(User)
                .join(UserOrganization, UserOrganization.user_id == User.id)
                .where(UserOrganization.org_id == org.id, User.is_superadmin == True)
            )
        ).scalars().all()
    )
    unique = {user.id: user for user in candidates if user.id is not None}
    if len(unique) != 1:
        print(f"BLOCKED author_match_count={len(unique)} explicit_uuid=false")
        return None
    return next(iter(unique.values()))


async def _ensure_course(
    session: AsyncSession, org: Organization, author: User, execute: bool
) -> tuple[Course | None, bool]:
    courses = list(
        (
            await session.execute(
                select(Course).where(
                    Course.org_id == org.id,
                    Course.name == COURSE_NAME,
                )
            )
        ).scalars().all()
    )
    if len(courses) > 1:
        print(f"BLOCKED course_match_count={len(courses)}")
        return None, False

    if courses:
        course = courses[0]
        print(
            "COURSE_EXISTS "
            f"course_id={course.id} published={course.published} public={course.public}"
        )
        if not execute:
            return course, False
        course.description = COURSE_DESCRIPTION
        course.about = (
            "Aprenda os fundamentos e avance até aplicações profissionais com prática "
            "progressiva, projetos e uso responsável de IA."
        )
        course.learnings = (
            "LLMs; prompt engineering; produtividade; automação; APIs; RAG; agentes; "
            "projetos; estratégia e carreira"
        )
        course.tags = "inteligência artificial,IA,LLM,RAG,agentes,automação"
        course.public = False
        course.published = True
        course.open_to_contributors = False
        course.thumbnail_type = ThumbnailType.IMAGE
        course.extra_metadata = {
            **(course.extra_metadata or {}),
            "xpex_slug": COURSE_SLUG,
            "xpex_launch": "XPEX-LAUNCH-001",
        }
        course.update_date = str(datetime.now(UTC))
        session.add(course)
        return course, False

    if not execute:
        print("DRY_RUN course_will_be_created=true")
        return None, True

    now = str(datetime.now(UTC))
    course = Course(
        name=COURSE_NAME,
        description=COURSE_DESCRIPTION,
        about=(
            "Aprenda os fundamentos e avance até aplicações profissionais com prática "
            "progressiva, projetos e uso responsável de IA."
        ),
        learnings=(
            "LLMs; prompt engineering; produtividade; automação; APIs; RAG; agentes; "
            "projetos; estratégia e carreira"
        ),
        tags="inteligência artificial,IA,LLM,RAG,agentes,automação",
        thumbnail_type=ThumbnailType.IMAGE,
        thumbnail_image="",
        thumbnail_video="",
        public=False,
        published=True,
        open_to_contributors=False,
        org_id=org.id,
        course_uuid=f"course_{uuid4()}",
        creation_date=now,
        update_date=now,
        extra_metadata={
            "xpex_slug": COURSE_SLUG,
            "xpex_launch": "XPEX-LAUNCH-001",
        },
    )
    session.add(course)
    await session.flush()
    session.add(
        ResourceAuthor(
            resource_uuid=course.course_uuid,
            user_id=author.id,
            authorship=ResourceAuthorshipEnum.CREATOR,
            authorship_status=ResourceAuthorshipStatusEnum.ACTIVE,
            creation_date=now,
            update_date=now,
        )
    )
    print(f"COURSE_CREATED course_id={course.id} published=true")
    return course, True


async def _ensure_module(
    session: AsyncSession,
    org: Organization,
    course: Course,
    order: int,
    module_name: str,
    markdown_file: str,
) -> None:
    chapters = list(
        (
            await session.execute(
                select(Chapter).where(
                    Chapter.org_id == org.id,
                    Chapter.course_id == course.id,
                    Chapter.name == module_name,
                )
            )
        ).scalars().all()
    )
    if len(chapters) > 1:
        raise RuntimeError(f"ambiguous chapter scope order={order}")
    now = str(datetime.now(UTC))
    if chapters:
        chapter = chapters[0]
        chapter.description = f"Módulo {order} da formação oficial XPeX Academy."
        chapter.lock_type = LockType.AUTHENTICATED
        chapter.update_date = now
        session.add(chapter)
    else:
        chapter = Chapter(
            name=module_name,
            description=f"Módulo {order} da formação oficial XPeX Academy.",
            thumbnail_image="",
            lock_type=LockType.AUTHENTICATED,
            org_id=org.id,
            course_id=course.id,
            chapter_uuid=f"chapter_{uuid4()}",
            creation_date=now,
            update_date=now,
            extra_metadata={"xpex_module": order},
        )
        session.add(chapter)
        await session.flush()

    course_chapter = (
        await session.execute(
            select(CourseChapter).where(
                CourseChapter.course_id == course.id,
                CourseChapter.chapter_id == chapter.id,
            )
        )
    ).scalars().one_or_none()
    if course_chapter is None:
        session.add(
            CourseChapter(
                order=order,
                course_id=course.id,
                chapter_id=chapter.id,
                org_id=org.id,
                creation_date=now,
                update_date=now,
            )
        )
    else:
        course_chapter.order = order
        course_chapter.update_date = now
        session.add(course_chapter)

    lesson_name = f"Módulo {order}: {module_name}"
    activities = list(
        (
            await session.execute(
                select(Activity).where(
                    Activity.org_id == org.id,
                    Activity.course_id == course.id,
                    Activity.name == lesson_name,
                )
            )
        ).scalars().all()
    )
    if len(activities) > 1:
        raise RuntimeError(f"ambiguous activity scope order={order}")
    content = {"markdown_url": f"{RAW_BASE}/{markdown_file}"}
    if activities:
        activity = activities[0]
        activity.activity_type = ActivityTypeEnum.TYPE_DYNAMIC
        activity.activity_sub_type = ActivitySubTypeEnum.SUBTYPE_DYNAMIC_MARKDOWN
        activity.content = content
        activity.details = {"xpex_module": order}
        activity.published = True
        activity.lock_type = ActivityLockType.AUTHENTICATED
        activity.last_modified_by_id = author_id_for_activity(course)
        activity.update_date = now
        session.add(activity)
    else:
        activity = Activity(
            name=lesson_name,
            activity_type=ActivityTypeEnum.TYPE_DYNAMIC,
            activity_sub_type=ActivitySubTypeEnum.SUBTYPE_DYNAMIC_MARKDOWN,
            content=content,
            details={"xpex_module": order},
            published=True,
            lock_type=ActivityLockType.AUTHENTICATED,
            org_id=org.id,
            course_id=course.id,
            activity_uuid=f"activity_{uuid4()}",
            creation_date=now,
            update_date=now,
            extra_metadata={"xpex_module": order},
        )
        session.add(activity)
        await session.flush()

    chapter_activity = (
        await session.execute(
            select(ChapterActivity).where(
                ChapterActivity.chapter_id == chapter.id,
                ChapterActivity.activity_id == activity.id,
            )
        )
    ).scalars().one_or_none()
    if chapter_activity is None:
        session.add(
            ChapterActivity(
                order=1,
                chapter_id=chapter.id,
                activity_id=activity.id,
                course_id=course.id,
                org_id=org.id,
                creation_date=now,
                update_date=now,
            )
        )
    else:
        chapter_activity.order = 1
        chapter_activity.update_date = now
        session.add(chapter_activity)


def author_id_for_activity(course: Course) -> int | None:
    """Keep repair updates neutral; author provenance lives on ResourceAuthor."""
    return None


async def run(org_slug: str, execute: bool, author_uuid: str | None) -> int:
    config = get_learnhouse_config()
    sql_url = config.database_config.sql_connection_string  # type: ignore[attr-defined]
    engine = create_async_engine(_to_async_url(sql_url), pool_pre_ping=True)
    try:
        async with AsyncSession(engine, expire_on_commit=False) as session:
            org = (
                await session.execute(
                    select(Organization).where(Organization.slug == org_slug)
                )
            ).scalars().one_or_none()
            if org is None:
                print(f"BLOCKED organization_not_found slug={org_slug}")
                return 2

            author = await _resolve_author(session, org, author_uuid)
            if author is None:
                return 3
            print(
                "AUTHOR_RESOLVED "
                f"user_id={author.id} explicit_uuid={bool(author_uuid)} superadmin={author.is_superadmin}"
            )

            course, _created = await _ensure_course(session, org, author, execute)
            if course is None:
                if execute:
                    return 4
                print(f"DRY_RUN modules={len(MODULES)} publish=true")
                return 0
            if not execute:
                print(f"DRY_RUN existing_course_id={course.id} modules={len(MODULES)}")
                return 0

            try:
                for order, (module_name, markdown_file) in enumerate(MODULES, start=1):
                    await _ensure_module(
                        session, org, course, order, module_name, markdown_file
                    )
                await session.commit()
            except Exception as exc:
                await session.rollback()
                print(f"BLOCKED course_bootstrap_failed type={type(exc).__name__}")
                return 5

            chapter_count = len(
                (
                    await session.execute(
                        select(Chapter).where(
                            Chapter.org_id == org.id,
                            Chapter.course_id == course.id,
                        )
                    )
                ).scalars().all()
            )
            activity_count = len(
                (
                    await session.execute(
                        select(Activity).where(
                            Activity.org_id == org.id,
                            Activity.course_id == course.id,
                            Activity.published == True,
                        )
                    )
                ).scalars().all()
            )
            if chapter_count < len(MODULES) or activity_count < len(MODULES):
                print(
                    "BLOCKED verification_failed "
                    f"chapters={chapter_count} activities={activity_count}"
                )
                return 6
            print(
                "PASS first_ai_course_ready "
                f"course_id={course.id} published={course.published} "
                f"chapters={chapter_count} activities={activity_count}"
            )
            return 0
    finally:
        await engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--org-slug", default=os.getenv("XPEX_LAUNCH_ORG_SLUG", "default"))
    parser.add_argument("--author-uuid", default=os.getenv("XPEX_LAUNCH_AUTHOR_UUID"))
    parser.add_argument("--execute", action="store_true")
    args = parser.parse_args()
    raise SystemExit(asyncio.run(run(args.org_slug, args.execute, args.author_uuid)))


if __name__ == "__main__":
    main()
