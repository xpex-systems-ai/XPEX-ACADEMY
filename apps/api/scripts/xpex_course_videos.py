"""Audit or provision real video lessons for the official XPeX AI course.

Dry-run is the default. With --execute, the script creates/repairs one TYPE_VIDEO
lesson per configured module and places it before the existing Markdown lesson.

Two explicit source modes are supported:
- YouTube URLs supplied through XPEX_COURSE_VIDEO_URLS_JSON;
- the immutable XPeX MP4 bundle baked into the production container image.

No video URL is invented from learner data and no enrollment/progress row is changed.
"""

import argparse
import asyncio
import json
import os
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from uuid import uuid4

from config.config import get_learnhouse_config
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from src.db.courses.activities import Activity, ActivityLockType, ActivitySubTypeEnum, ActivityTypeEnum
from src.db.courses.chapter_activities import ChapterActivity
from src.db.courses.chapters import Chapter
from src.db.courses.courses import Course
from src.db.organizations import Organization

COURSE_NAME = "Inteligência Artificial — do Básico ao Avançado"
STATIC_VIDEO_DIR = "/app/xpex-static-videos"
MODULE_NAMES = {
    1: "Fundamentos de Inteligência Artificial",
    2: "Como funcionam LLMs e IA generativa",
    3: "Prompt Engineering",
    4: "Ferramentas de IA para produtividade",
    5: "Automação com IA",
    6: "APIs e integrações",
    7: "RAG e conhecimento privado",
    8: "Agentes de IA",
    9: "Construção de projetos reais",
    10: "IA aplicada a negócios e carreira",
    11: "Projeto final",
}


def _to_async_url(url: str) -> str:
    if "+asyncpg" in url:
        return url
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


def _youtube_id(value: str) -> str | None:
    try:
        parsed = urlparse(value)
    except ValueError:
        return None
    host = (parsed.hostname or "").lower()
    if host in {"youtu.be", "www.youtu.be"}:
        candidate = parsed.path.strip("/").split("/")[0]
    elif host in {"youtube.com", "www.youtube.com", "m.youtube.com"}:
        if parsed.path == "/watch":
            candidate = parse_qs(parsed.query).get("v", [""])[0]
        elif parsed.path.startswith("/embed/"):
            candidate = parsed.path.split("/embed/", 1)[1].split("/", 1)[0]
        else:
            candidate = ""
    else:
        return None
    return candidate if 6 <= len(candidate) <= 32 and all(c.isalnum() or c in "-_" for c in candidate) else None


def _load_video_map(raw: str | None) -> dict[int, str]:
    if not raw:
        return {}
    payload = json.loads(raw)
    if not isinstance(payload, dict):
        raise ValueError("video map must be a JSON object")
    result: dict[int, str] = {}
    for key, value in payload.items():
        module = int(key)
        if module not in MODULE_NAMES or not isinstance(value, str) or not _youtube_id(value):
            raise ValueError(f"invalid YouTube video mapping for module {key}")
        result[module] = value
    return result


def _static_video_sources(base_url: str, directory: str) -> dict[int, dict[str, str]]:
    base = base_url.strip().rstrip("/")
    if not base.startswith(("https://", "http://")):
        raise ValueError("static MP4 base URL must be absolute HTTP(S)")
    root = Path(directory)
    sources: dict[int, dict[str, str]] = {}
    for module in MODULE_NAMES:
        filename = f"module-{module:02d}.mp4"
        path = root / filename
        if not path.is_file() or path.stat().st_size <= 0:
            raise ValueError(f"static MP4 artifact missing for module {module}")
        sources[module] = {
            "filename": filename,
            "uri": f"{base}/{filename}",
        }
    return sources


async def run(
    org_slug: str,
    execute: bool,
    raw_map: str | None,
    *,
    static_bundle: bool = False,
    static_base_url: str | None = None,
    static_dir: str = STATIC_VIDEO_DIR,
) -> int:
    source_kind = "static" if static_bundle else "youtube"
    try:
        if static_bundle:
            static_sources = _static_video_sources(static_base_url or "", static_dir)
            video_map: dict[int, str] = {}
        else:
            static_sources = {}
            video_map = _load_video_map(raw_map)
    except (ValueError, TypeError, json.JSONDecodeError) as exc:
        print(f"BLOCKED invalid_video_source type={type(exc).__name__} source={source_kind}")
        return 2

    config = get_learnhouse_config()
    engine = create_async_engine(_to_async_url(config.database_config.sql_connection_string), pool_pre_ping=True)  # type: ignore[attr-defined]
    try:
        async with AsyncSession(engine, expire_on_commit=False) as session:
            org = (await session.execute(select(Organization).where(Organization.slug == org_slug))).scalars().one_or_none()
            if org is None:
                print(f"BLOCKED organization_not_found slug={org_slug}")
                return 3
            courses = list((await session.execute(select(Course).where(Course.org_id == org.id, Course.name == COURSE_NAME))).scalars().all())
            if len(courses) != 1:
                print(f"BLOCKED course_match_count={len(courses)}")
                return 4
            course = courses[0]
            chapters = list((await session.execute(select(Chapter).where(Chapter.org_id == org.id, Chapter.course_id == course.id))).scalars().all())
            by_name = {chapter.name: chapter for chapter in chapters}

            configured = 0
            missing = 0
            existing = 0
            for module, module_name in MODULE_NAMES.items():
                chapter = by_name.get(module_name)
                if chapter is None:
                    print(f"BLOCKED missing_chapter module={module}")
                    return 5
                lesson_name = f"Módulo {module}: Aula em vídeo — {module_name}"
                matches = list((await session.execute(select(Activity).where(Activity.org_id == org.id, Activity.course_id == course.id, Activity.name == lesson_name))).scalars().all())
                if len(matches) > 1:
                    print(f"BLOCKED ambiguous_video_activity module={module} count={len(matches)}")
                    return 6

                if static_bundle:
                    source = static_sources[module]
                    content = {"filename": source["filename"], "uri": source["uri"]}
                    subtype = ActivitySubTypeEnum.SUBTYPE_VIDEO_HOSTED
                else:
                    url = video_map.get(module)
                    if not url:
                        missing += 1
                        print(f"VIDEO_MISSING module={module} configured=false")
                        continue
                    content = {"uri": url}
                    subtype = ActivitySubTypeEnum.SUBTYPE_VIDEO_YOUTUBE

                configured += 1
                now = str(datetime.now(UTC))
                metadata = {
                    "xpex_video": True,
                    "xpex_module": module,
                    "xpex_video_source": source_kind,
                    "xpex_static_mp4": static_bundle,
                }
                if matches:
                    activity = matches[0]
                    existing += 1
                    if execute:
                        activity.activity_type = ActivityTypeEnum.TYPE_VIDEO
                        activity.activity_sub_type = subtype
                        activity.content = content
                        activity.details = {"xpex_module": module, "autoplay": False, "muted": False}
                        activity.extra_metadata = {**(activity.extra_metadata or {}), **metadata}
                        activity.published = True
                        activity.lock_type = ActivityLockType.AUTHENTICATED
                        activity.update_date = now
                        session.add(activity)
                elif execute:
                    activity = Activity(
                        name=lesson_name,
                        activity_type=ActivityTypeEnum.TYPE_VIDEO,
                        activity_sub_type=subtype,
                        content=content,
                        details={"xpex_module": module, "autoplay": False, "muted": False},
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
                else:
                    activity = None

                if execute and activity is not None:
                    link = (await session.execute(select(ChapterActivity).where(ChapterActivity.chapter_id == chapter.id, ChapterActivity.activity_id == activity.id))).scalars().one_or_none()
                    if link is None:
                        session.add(ChapterActivity(order=1, chapter_id=chapter.id, activity_id=activity.id, course_id=course.id, org_id=org.id, creation_date=now, update_date=now))
                    else:
                        link.order = 1
                        link.update_date = now
                        session.add(link)
                    other_links = list((await session.execute(select(ChapterActivity).where(ChapterActivity.chapter_id == chapter.id, ChapterActivity.activity_id != activity.id))).scalars().all())
                    for other in other_links:
                        if other.order <= 1:
                            other.order = 2
                            other.update_date = now
                            session.add(other)
                    print(
                        "VIDEO_READY "
                        f"module={module} activity_uuid={activity.activity_uuid} source={source_kind}"
                    )

            if execute:
                await session.commit()
            mode = "EXECUTE" if execute else "DRY_RUN"
            print(f"{mode} video_lessons configured={configured} existing={existing} missing={missing} total_modules={len(MODULE_NAMES)} source={source_kind}")
            if missing:
                print("BLOCKED video_assets_missing=true supply=XPEX_COURSE_VIDEO_URLS_JSON")
                return 7
            print(f"PASS video_lessons_ready=true source={source_kind} total={configured}")
            return 0
    finally:
        await engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--org-slug", default=os.getenv("XPEX_LAUNCH_ORG_SLUG", "default"))
    parser.add_argument("--video-map", default=os.getenv("XPEX_COURSE_VIDEO_URLS_JSON"))
    parser.add_argument("--static-bundle", action="store_true")
    parser.add_argument("--static-base-url", default=os.getenv("XPEX_MEDIA_BASE_URL"))
    parser.add_argument("--static-dir", default=os.getenv("XPEX_STATIC_VIDEO_DIR", STATIC_VIDEO_DIR))
    parser.add_argument("--execute", action="store_true")
    args = parser.parse_args()
    raise SystemExit(
        asyncio.run(
            run(
                args.org_slug,
                args.execute,
                args.video_map,
                static_bundle=args.static_bundle,
                static_base_url=args.static_base_url,
                static_dir=args.static_dir,
            )
        )
    )


if __name__ == "__main__":
    main()
