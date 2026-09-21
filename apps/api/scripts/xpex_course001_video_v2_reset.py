"""Re-open exactly the first Course 001 video job as premium revision V2.

This one-shot is intentionally narrow: it preserves the native course/activity mapping,
clears prior media approval/publication state, increments revision, and queues only
m01-l01 for regeneration. It never publishes anything.
"""

from __future__ import annotations

import argparse
import asyncio
from datetime import datetime, timezone

from config.config import get_learnhouse_config
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.db.users import User  # noqa: F401  # registers FK target metadata
from src.db.xpex_video import XPeXVideoJob
from src.services.xpex.video_factory import LessonVideoManifest, VideoJobState

BATCH_ID = "xpvb-course001-ia-r1"
LESSON_ID = "m01-l01"


def _to_async_url(url: str) -> str:
    if "+asyncpg" in url:
        return url
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


async def run(execute: bool) -> int:
    cfg = get_learnhouse_config()
    engine = create_async_engine(
        _to_async_url(str(cfg.database_config.sql_connection_string)),
        pool_pre_ping=True,
    )
    try:
        async with AsyncSession(engine, expire_on_commit=False) as session:
            rows = list(
                (
                    await session.execute(
                        select(XPeXVideoJob).where(
                            XPeXVideoJob.batch_id == BATCH_ID,
                            XPeXVideoJob.lesson_id == LESSON_ID,
                        )
                    )
                ).scalars().all()
            )
            if len(rows) != 1:
                print(f"COURSE001_VIDEO_V2_RESET BLOCKED job_count={len(rows)}")
                return 2
            row = rows[0]
            next_revision = max(int(row.revision or 1) + 1, 2)
            print(
                "COURSE001_VIDEO_V2_RESET AUDIT "
                f"job_id={row.job_id} old_state={row.state} "
                f"old_revision={row.revision} next_revision={next_revision} "
                f"activity={row.native_activity_uuid or 'none'}"
            )
            if not execute:
                return 0

            manifest = LessonVideoManifest(
                lesson_id=LESSON_ID,
                revision=next_revision,
                state=VideoJobState.QUEUED,
            )
            row.revision = next_revision
            row.state = VideoJobState.QUEUED.value
            row.resume_state = None
            row.manifest_json = manifest.model_dump(mode="json")
            row.attempt_count = 0
            row.lease_id = None
            row.lease_expires_at = None
            row.last_error = None
            row.approved_by_user_id = None
            row.approved_at = None
            row.attached_at = None
            row.published_at = None
            row.updated_at = datetime.now(timezone.utc).isoformat()
            session.add(row)
            await session.commit()
            print(
                "COURSE001_VIDEO_V2_RESET PASS "
                f"state={row.state} revision={row.revision} "
                "auto_published=false"
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
