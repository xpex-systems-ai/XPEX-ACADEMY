"""Create and publish the first professional XPeX Academy AI course.

The command is dry-run by default. With --execute it creates/repairs a distinct
professional course without mutating the controlled legacy course. The course stays
unpublished until all 11 real video URLs are supplied. Video URLs are never invented.
"""

import argparse
import asyncio
import json
import os
from datetime import UTC, datetime
from urllib.parse import urlparse
from uuid import uuid4

from config.config import get_learnhouse_config
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from src.db.courses.activities import (
    Activity,
    ActivityLockType,
    ActivitySubTypeEnum,
    ActivityTypeEnum,
)
from src.db.courses.chapter_activities import ChapterActivity
from src.db.courses.chapters import Chapter
from src.db.courses.certifications import Certifications
from src.db.courses.courses import Course, ThumbnailType
from src.db.organizations import Organization
from src.db.resource_authors import (
    ResourceAuthor,
    ResourceAuthorshipEnum,
    ResourceAuthorshipStatusEnum,
)
from src.db.users import User

from scripts.xpex_launch_course import (
    MODULES,
    _ensure_foundations_assessment,
    _ensure_module,
    _resolve_author,
    _to_async_url,
)

COURSE_NAME = "Inteligência Artificial Profissional — do Básico ao Avançado"
COURSE_SLUG = "inteligencia-artificial-profissional"
COURSE_DESCRIPTION = (
    "Formação profissional e prática em inteligência artificial com aulas em vídeo, "
    "materiais, avaliação, projetos e certificado verificável."
)
COURSE_MARKER = "XPEX-FIRST-PROFESSIONAL-COURSE-019"
VIDEO_MAP_ENV = "XPEX_PRO_COURSE_VIDEO_URLS_JSON"


def _valid_video_url(value: str) -> bool:
    try:
        parsed = urlparse(value)
    except ValueError:
        return False
    return parsed.scheme == "https" and bool(parsed.netloc)


def _is_youtube(value: str) -> bool:
    host = (urlparse(value).hostname or "").lower()
    return host in {"youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be"}


def _load_video_map(raw: str | None) -> dict[int, str]:
    if not raw:
        return {}
    payload = json.loads(raw)
    if not isinstance(payload, dict):
        raise ValueError("video map must be a JSON object")
    result: dict[int, str] = {}
    for key, value in payload.items():
        module = int(key)
        if module < 1 or module > len(MODULES):
            raise ValueError(f"invalid module {module}")
        if not isinstance(value, str) or not _valid_video_url(value):
            raise ValueError(f"invalid HTTPS video URL for module {module}")
        result[module] = value
    return result


async def _ensure_course(
    session: AsyncSession,
    org: Organization,
    author: User,
    execute: bool,
) -> Course | None:
    matches = list(
        (
            await session.execute(
                select(Course).where(
                    Course.org_id == org.id,
                    Course.name == COURSE_NAME,
                )
            )
        ).scalars().all()
    )
    if len(matches) > 1:
        raise RuntimeError("ambiguous professional course")
    if matches:
        course = matches[0]
        if execute:
            course.description = COURSE_DESCRIPTION
            course.about = (
                "Da base de IA generativa à automação, APIs, RAG, agentes e projeto final, "
                "com prática progressiva e uso responsável."
            )
            course.learnings = (
                "IA; LLMs; prompt engineering; produtividade; automação; APIs; RAG; "
                "agentes; projetos; negócios e carreira"
            )
            course.tags = "IA,inteligência artificial,LLM,RAG,agentes,automação,projetos"
            course.public = False
            course.open_to_contributors = False
            course.thumbnail_type = ThumbnailType.IMAGE
            course.extra_metadata = {
                **(course.extra_metadata or {}),
                "xpex_slug": COURSE_SLUG,
                "xpex_release": COURSE_MARKER,
            }
            course.update_date = str(datetime.now(UTC))
            session.add(course)
        return course

    if not execute:
        return None

    now = str(datetime.now(UTC))
    course = Course(
        name=COURSE_NAME,
        description=COURSE_DESCRIPTION,
        about=(
            "Da base de IA generativa à automação, APIs, RAG, agentes e projeto final, "
            "com prática progressiva e uso responsável."
        ),
        learnings=(
            "IA; LLMs; prompt engineering; produtividade; automação; APIs; RAG; "
            "agentes; projetos; negócios e carreira"
        ),
        tags="IA,inteligência artificial,LLM,RAG,agentes,automação,projetos",
        thumbnail_type=ThumbnailType.IMAGE,
        thumbnail_image="",
        thumbnail_video="",
        public=False,
        published=False,
        open_to_contributors=False,
        org_id=org.id,
        course_uuid=f"course_{uuid4()}",
        creation_date=now,
        update_date=now,
        extra_metadata={"xpex_slug": COURSE_SLUG, "xpex_release": COURSE_MARKER},
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
    return course


async def _ensure_video(
    session: AsyncSession,
    org: Organization,
    course: Course,
    module: int,
    url: str,
) -> None:
    module_name = MODULES[module - 1][0]
    chapter = (
        await session.execute(
            select(Chapter).where(
                Chapter.org_id == org.id,
                Chapter.course_id == course.id,
                Chapter.name == module_name,
            )
        )
    ).scalars().one()
    name = f"Módulo {module}: Aula em vídeo — {module_name}"
    matches = list(
        (
            await session.execute(
                select(Activity).where(
                    Activity.org_id == org.id,
                    Activity.course_id == course.id,
                    Activity.name == name,
                )
            )
        ).scalars().all()
    )
    if len(matches) > 1:
        raise RuntimeError(f"ambiguous video activity module={module}")
    now = str(datetime.now(UTC))
    subtype = (
        ActivitySubTypeEnum.SUBTYPE_VIDEO_YOUTUBE
        if _is_youtube(url)
        else ActivitySubTypeEnum.SUBTYPE_VIDEO_HOSTED
    )
    if matches:
        activity = matches[0]
        activity.activity_type = ActivityTypeEnum.TYPE_VIDEO
        activity.activity_sub_type = subtype
        activity.content = {"uri": url}
        activity.details = {"xpex_module": module, "autoplay": False, "muted": False}
        activity.published = True
        activity.lock_type = ActivityLockType.AUTHENTICATED
        activity.extra_metadata = {
            **(activity.extra_metadata or {}),
            "xpex_video": True,
            "xpex_module": module,
            "xpex_release": COURSE_MARKER,
        }
        activity.update_date = now
        session.add(activity)
    else:
        activity = Activity(
            name=name,
            activity_type=ActivityTypeEnum.TYPE_VIDEO,
            activity_sub_type=subtype,
            content={"uri": url},
            details={"xpex_module": module, "autoplay": False, "muted": False},
            published=True,
            lock_type=ActivityLockType.AUTHENTICATED,
            org_id=org.id,
            course_id=course.id,
            activity_uuid=f"activity_{uuid4()}",
            creation_date=now,
            update_date=now,
            extra_metadata={
                "xpex_video": True,
                "xpex_module": module,
                "xpex_release": COURSE_MARKER,
            },
        )
        session.add(activity)
        await session.flush()

    link = (
        await session.execute(
            select(ChapterActivity).where(
                ChapterActivity.chapter_id == chapter.id,
                ChapterActivity.activity_id == activity.id,
            )
        )
    ).scalars().one_or_none()
    if link is None:
        link = ChapterActivity(
            order=1,
            chapter_id=chapter.id,
            activity_id=activity.id,
            course_id=course.id,
            org_id=org.id,
            creation_date=now,
            update_date=now,
        )
        session.add(link)
    else:
        link.order = 1
        link.update_date = now
        session.add(link)

    other_links = list(
        (
            await session.execute(
                select(ChapterActivity)
                .where(
                    ChapterActivity.chapter_id == chapter.id,
                    ChapterActivity.activity_id != activity.id,
                )
                .order_by(ChapterActivity.order, ChapterActivity.id)
            )
        ).scalars().all()
    )
    for offset, other in enumerate(other_links, start=2):
        other.order = offset
        other.update_date = now
        session.add(other)


async def _ensure_certificate(
    session: AsyncSession,
    course: Course,
) -> None:
    existing = list(
        (
            await session.execute(
                select(Certifications).where(Certifications.course_id == course.id)
            )
        ).scalars().all()
    )
    if len(existing) > 1:
        raise RuntimeError("ambiguous certificate definition")
    if existing:
        return
    now = str(datetime.now(UTC))
    session.add(
        Certifications(
            course_id=course.id,
            certification_uuid=f"certification_{uuid4()}",
            config={
                "xpex_certificate": COURSE_MARKER,
                "title": "Certificado XPeX Academy AI — Inteligência Artificial Profissional",
                "completion_rule": "all_published_course_activities",
            },
            creation_date=now,
            update_date=now,
        )
    )


async def run(
    org_slug: str,
    execute: bool,
    author_uuid: str | None,
    raw_map: str | None,
) -> int:
    try:
        video_map = _load_video_map(raw_map)
    except (TypeError, ValueError, json.JSONDecodeError) as exc:
        print(f"BLOCKED invalid_video_map type={type(exc).__name__}")
        return 2

    config = get_learnhouse_config()
    engine = create_async_engine(
        _to_async_url(config.database_config.sql_connection_string),  # type: ignore[attr-defined]
        pool_pre_ping=True,
    )
    try:
        async with AsyncSession(engine, expire_on_commit=False) as session:
            org = (
                await session.execute(
                    select(Organization).where(Organization.slug == org_slug)
                )
            ).scalars().one_or_none()
            if org is None:
                print(f"BLOCKED organization_not_found slug={org_slug}")
                return 3
            author = await _resolve_author(session, org, author_uuid)
            if author is None:
                return 4

            course = await _ensure_course(session, org, author, execute)
            if not execute:
                print(
                    "DRY_RUN professional_course "
                    f"exists={course is not None} videos={len(video_map)}/{len(MODULES)}"
                )
                return 0
            if course is None:
                return 5

            try:
                for order, (module_name, markdown_file) in enumerate(MODULES, start=1):
                    await _ensure_module(
                        session,
                        org,
                        course,
                        order,
                        module_name,
                        markdown_file,
                    )
                await _ensure_foundations_assessment(session, org, course)
                for module, url in sorted(video_map.items()):
                    await _ensure_video(session, org, course, module, url)
                await _ensure_certificate(session, course)

                all_videos_ready = len(video_map) == len(MODULES)
                course.published = all_videos_ready
                course.extra_metadata = {
                    **(course.extra_metadata or {}),
                    "xpex_release_state": (
                        "PUBLISHED_PROFESSIONAL"
                        if all_videos_ready
                        else "DRAFT_VIDEO_PENDING"
                    ),
                    "xpex_video_count": len(video_map),
                }
                course.update_date = str(datetime.now(UTC))
                session.add(course)
                await session.commit()
            except RuntimeError as exc:
                await session.rollback()
                print(f"BLOCKED professional_course_bootstrap type={type(exc).__name__}")
                return 6

            if len(video_map) != len(MODULES):
                print(
                    "BLOCKED professional_video_assets_missing=true "
                    f"configured={len(video_map)} required={len(MODULES)} "
                    f"env={VIDEO_MAP_ENV} course_published=false"
                )
                return 7

            print(
                "PASS professional_course_ready=true "
                f"course_id={course.id} modules={len(MODULES)} videos={len(video_map)} "
                "assessment=true certificate=true published=true"
            )
            return 0
    finally:
        await engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--org-slug",
        default=os.getenv("XPEX_LAUNCH_ORG_SLUG", "default"),
    )
    parser.add_argument("--author-uuid", default=os.getenv("XPEX_LAUNCH_AUTHOR_UUID"))
    parser.add_argument("--video-map", default=os.getenv(VIDEO_MAP_ENV))
    parser.add_argument("--execute", action="store_true")
    args = parser.parse_args()
    raise SystemExit(
        asyncio.run(
            run(
                args.org_slug,
                args.execute,
                args.author_uuid,
                args.video_map,
            )
        )
    )


if __name__ == "__main__":
    main()
