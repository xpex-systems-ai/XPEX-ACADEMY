from datetime import UTC, datetime, timedelta

from src.db.xpex_video import XPeXVideoJob
from src.services.xpex.launch002_v2 import _parse_datetime


def test_parse_datetime_normalizes_naive_and_aware_values():
    naive = _parse_datetime("2026-08-27T12:00:00")
    aware = _parse_datetime("2026-08-27T12:00:00+00:00")

    assert naive is not None
    assert aware is not None
    assert naive.tzinfo is UTC
    assert aware.tzinfo is UTC


def test_expired_lease_shape_is_recoverable():
    now = datetime.now(UTC)
    row = XPeXVideoJob(
        job_id="job-test",
        batch_id="batch-test",
        lesson_id="m01-l01",
        org_id=1,
        created_by_user_id=1,
        state="RENDERING",
        resume_state="RENDERING",
        revision=1,
        content_hash="0" * 64,
        manifest_json={},
        attempt_count=1,
        lease_id="worker:test",
        lease_expires_at=(now - timedelta(minutes=1)).isoformat(),
        created_at=now.isoformat(),
        updated_at=now.isoformat(),
    )

    expires = _parse_datetime(row.lease_expires_at)
    assert expires is not None
    assert expires < now
