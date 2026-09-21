"""Repair the native playback path for the first attached Course 001 XPeX video.

Idempotently copies the already-rendered draft artifact into the exact LearnHouse
hosted-video stream layout. It does not generate, approve, attach, or publish media.
"""

import argparse
import asyncio
from pathlib import Path
from tempfile import TemporaryDirectory

from config.config import get_learnhouse_config
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.db.courses.activities import Activity
from src.db.organizations import Organization
from src.db.xpex_video import XPeXVideoJob
from src.services.xpex.video_factory import LessonVideoManifest
from src.services.xpex.video_media import (
    activity_artifact_key,
    activity_caption_artifact_key,
    materialize_storage_key,
    persist_local_or_s3,
)


def _to_async_url(url: str) -> str:
    if "+asyncpg" in url:
        return url
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


async def run(execute: bool) -> int:
    cfg = get_learnhouse_config()
    engine = create_async_engine(
        _to_async_url(cfg.database_config.sql_connection_string),
        pool_pre_ping=True,
    )
    try:
        async with AsyncSession(engine, expire_on_commit=False) as session:
            rows = list(
                (
                    await session.execute(
                        select(XPeXVideoJob)
                        .where(
                            XPeXVideoJob.lesson_id == "m01-l01",
                            XPeXVideoJob.native_activity_uuid.is_not(None),
                        )
                        .order_by(XPeXVideoJob.id.asc())
                    )
                ).scalars().all()
            )
            if len(rows) != 1:
                print(f"COURSE001_MEDIA_REPAIR BLOCKED job_count={len(rows)}")
                return 2
            row = rows[0]
            if not row.native_course_uuid or not row.native_activity_uuid:
                print("COURSE001_MEDIA_REPAIR BLOCKED native_mapping_missing=true")
                return 3
            activity = (
                await session.execute(
                    select(Activity).where(Activity.activity_uuid == row.native_activity_uuid)
                )
            ).scalars().one_or_none()
            if activity is None:
                print("COURSE001_MEDIA_REPAIR BLOCKED activity_missing=true")
                return 4
            org = (
                await session.execute(select(Organization).where(Organization.id == row.org_id))
            ).scalars().one_or_none()
            if org is None:
                print("COURSE001_MEDIA_REPAIR BLOCKED org_missing=true")
                return 5

            manifest = LessonVideoManifest.model_validate(row.manifest_json)
            if manifest.video_draft is None:
                print("COURSE001_MEDIA_REPAIR BLOCKED draft_video_missing=true")
                return 6
            filename = str((activity.content or {}).get("filename") or "").strip()
            if not filename:
                print("COURSE001_MEDIA_REPAIR BLOCKED filename_missing=true")
                return 7

            video_key = activity_artifact_key(
                org_uuid=org.org_uuid,
                course_uuid=row.native_course_uuid,
                activity_uuid=row.native_activity_uuid,
                filename=filename,
            )
            caption_key = activity_caption_artifact_key(
                org_uuid=org.org_uuid,
                course_uuid=row.native_course_uuid,
                activity_uuid=row.native_activity_uuid,
                language="pt-BR",
            )

            print(
                "COURSE001_MEDIA_REPAIR AUDIT "
                f"job_id={row.job_id} activity={row.native_activity_uuid} "
                f"video_target={video_key} captions={bool(manifest.captions)}"
            )
            if not execute:
                return 0

            with TemporaryDirectory(prefix="xpex-course001-repair-") as directory:
                video_local = materialize_storage_key(
                    manifest.video_draft.uri,
                    str(Path(directory) / filename),
                )
                video_artifact = persist_local_or_s3(video_local, video_key)

                caption_size = 0
                if manifest.captions:
                    caption_local = materialize_storage_key(
                        manifest.captions[0].uri,
                        str(Path(directory) / "pt-BR.vtt"),
                    )
                    caption_artifact = persist_local_or_s3(caption_local, caption_key)
                    caption_size = caption_artifact.byte_size

            print(
                "COURSE001_MEDIA_REPAIR PASS "
                f"video_bytes={video_artifact.byte_size} caption_bytes={caption_size}"
            )
            return 0
    finally:
        await engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--execute", action="store_true")
    args = parser.parse_args()
    raise SystemExit(asyncio.run(run(args.execute)))


if __name__ == "__main__":
    main()
