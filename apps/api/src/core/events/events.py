import asyncio
import logging
import os
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


async def _provision_configured_admin_once() -> None:
    """Run the explicit admin repair only when the operator enable flag is set."""
    if os.environ.get("LEARNHOUSE_ADMIN_BOOTSTRAP_ENABLED", "").lower() != "true":
        return

    from src.core.events.database import _async_session_factory
    from src.services.setup.admin_provisioning import provision_configured_admin

    async with _async_session_factory() as db_session:
        result = await provision_configured_admin(db_session)
    logger.warning("XPEX startup admin provisioning result=%s", result)


def startup_app(app: FastAPI) -> Callable:
    async def start_app() -> None:
        learnhouse_config: LearnHouseConfig = get_learnhouse_config()
        app.learnhouse_config = learnhouse_config  # type: ignore
        await connect_to_db(app)
        await create_logs_dir()
        await check_content_directory()
        await auto_install()
        await _reconcile_packs()
        await _provision_configured_admin_once()

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
