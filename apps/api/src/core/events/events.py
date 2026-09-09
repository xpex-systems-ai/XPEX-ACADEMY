import asyncio
import logging
from collections.abc import Callable

from config.config import LearnHouseConfig, get_learnhouse_config
from fastapi import FastAPI
from src.core.ee_hooks import run_ee_startup
from src.core.events.autoinstall import auto_install
from src.core.events.content import check_content_directory
from src.core.events.database import close_database, connect_to_db
from src.core.events.logs import create_logs_dir

logger = logging.getLogger(__name__)

_cleanup_task = None
_xpex_launch002_task = None
_xpex_wave1_media_task = None


async def _periodic_migration_cleanup():
    """Run migration temp cleanup every 10 minutes."""
    from src.services.courses.migration.migration_service import (
        cleanup_old_temp_migrations,
    )

    while True:
        await asyncio.sleep(600)  # 10 minutes
        try:
            cleanup_old_temp_migrations()
        except Exception as e:  # noqa: BLE001
            logger.warning("Periodic migration cleanup failed: %s", e)


async def _reconcile_packs():
    """Reconcile Redis pack credits with DB state on startup."""
    try:
        from src.core.events.database import _async_session_factory
        from src.services.packs.packs import reconcile_pack_credits

        async with _async_session_factory() as db_session:
            result = await reconcile_pack_credits(db_session)
            logger.info("Pack reconciliation on startup: %s", result)
    except Exception as e:  # noqa: BLE001
        logger.warning("Pack reconciliation skipped (non-fatal): %s", e)


async def _ensure_xpex_wave1_schema() -> bool:
    """Repair only the Wave 1 schema equivalent when Alembic tracking is absent."""
    try:
        from scripts.xpex_wave1_schema_ready import run

        result = await run()
        if result != 0:
            logger.error("XPeX Wave 1 schema readiness blocked: exit_code=%s", result)
            return False
        logger.info("XPeX Wave 1 schema readiness: ready=true")
        return True
    except Exception:
        logger.exception("XPeX Wave 1 schema readiness failed")
        return False


async def _reconcile_xpex_official_catalog() -> None:
    """Idempotently register the private canonical catalog after migrations run."""
    try:
        from src.core.events.database import _async_session_factory
        from src.services.xpex.official_catalog import seed_official_catalog

        async with _async_session_factory() as db_session:
            result = await seed_official_catalog(db_session)
            logger.info("XPeX official catalog reconciliation: %s", result)
    except Exception:
        # A failed catalog seed must not prevent auth, payments, or existing student
        # flows from starting. The exception remains visible with its root traceback.
        logger.exception("XPeX official catalog reconciliation failed")


async def _reconcile_xpex_wave1() -> None:
    """Seed/certify the private Wave 1 and create at most one SCRIPT_READY canary."""
    try:
        from scripts.xpex_wave1_runtime_certify import run

        result = await run(execute=True)
        if result == 2:
            logger.warning(
                "XPeX Wave 1 runtime certified but media canary blocked: provider_unconfigured=true"
            )
            return
        if result != 0:
            logger.error("XPeX Wave 1 runtime certification blocked: exit_code=%s", result)
            return
        logger.info("XPeX Wave 1 runtime certification: ready=true")
    except Exception:
        # Keep auth/payments/student access available while making the exact
        # Wave 1 failure visible in runtime logs for controlled recovery.
        logger.exception("XPeX Wave 1 runtime certification failed")


async def _run_xpex_wave1_media_canary() -> None:
    """Advance only the certified Wave 1 canary to the human media gate."""
    try:
        from scripts.xpex_wave1_media_canary_037 import run

        result = await run(execute=True)
        if result != 0:
            logger.warning("XPeX Wave 1 media canary stopped safely: exit_code=%s", result)
            return
        logger.info("XPeX Wave 1 media canary reached human gate")
    except asyncio.CancelledError:
        raise
    except Exception:
        # Media production is never allowed to take down auth/student runtime.
        logger.exception("XPeX Wave 1 media canary failed")


def startup_app(app: FastAPI) -> Callable:
    async def start_app() -> None:
        learnhouse_config: LearnHouseConfig = get_learnhouse_config()
        app.learnhouse_config = learnhouse_config  # type: ignore
        await connect_to_db(app)
        await create_logs_dir()
        await check_content_directory()
        await auto_install()
        wave1_schema_ready = await _ensure_xpex_wave1_schema()
        await _reconcile_packs()
        await _reconcile_xpex_official_catalog()
        if wave1_schema_ready:
            await _reconcile_xpex_wave1()
            global _xpex_wave1_media_task
            _xpex_wave1_media_task = asyncio.create_task(_run_xpex_wave1_media_canary())

        from src.services.courses.migration.migration_service import (
            cleanup_old_temp_migrations,
        )

        cleanup_old_temp_migrations()
        global _cleanup_task
        _cleanup_task = asyncio.create_task(_periodic_migration_cleanup())

        from src.services.utils.hls_jobs import start_consumer

        start_consumer()

        from src.services.utils.caption_jobs import (
            start_consumer as start_captions_consumer,
        )

        start_captions_consumer()

        from src.services.xpex.launch002_v2 import start_launch002_v2

        global _xpex_launch002_task
        _xpex_launch002_task = start_launch002_v2()

        run_ee_startup(app)

    return start_app


def shutdown_app(app: FastAPI) -> Callable:
    async def close_app() -> None:
        if _xpex_launch002_task:
            _xpex_launch002_task.cancel()
            try:
                await _xpex_launch002_task
            except asyncio.CancelledError:
                pass
            except Exception:
                logger.exception("XPEX-LAUNCH-002 task failed before shutdown; continuing cleanup")
        if _xpex_wave1_media_task:
            _xpex_wave1_media_task.cancel()
            try:
                await _xpex_wave1_media_task
            except asyncio.CancelledError:
                pass
            except Exception:
                logger.exception("XPeX Wave 1 media task failed before shutdown; continuing cleanup")
        if _cleanup_task:
            _cleanup_task.cancel()
            try:
                await _cleanup_task
            except asyncio.CancelledError:
                pass

        from src.services.utils.hls_jobs import stop_consumer

        await stop_consumer()
        from src.services.utils.caption_jobs import (
            stop_consumer as stop_captions_consumer,
        )

        await stop_captions_consumer()
        from src.services.webhooks.dispatch import _background_tasks as _webhook_tasks
        from src.services.webhooks.dispatch import close_webhook_client

        if _webhook_tasks:  # pragma: no cover
            await asyncio.gather(*list(_webhook_tasks), return_exceptions=True)
        await close_webhook_client()
        await close_database(app)

    return close_app
