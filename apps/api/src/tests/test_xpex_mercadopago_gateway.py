import hashlib
import hmac
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from src.services.xpex import mercadopago_gateway as gateway
from src.services.xpex.mercadopago_gateway import (
    MercadoPagoNotConfigured,
    _headers,
    process_verified_webhook,
    verify_webhook_signature,
)


def _signature(secret: str, data_id: str, request_id: str, ts: str) -> str:
    manifest = f"id:{data_id.lower()};request-id:{request_id};ts:{ts};"
    digest = hmac.new(secret.encode(), manifest.encode(), hashlib.sha256).hexdigest()
    return f"ts={ts},v1={digest}"


def test_webhook_signature_accepts_valid_hmac():
    secret = "test-webhook-secret"
    data_id = "ABC123"
    request_id = "request-1"
    signature = _signature(secret, data_id, request_id, "1742505638683")
    assert verify_webhook_signature(signature, request_id, data_id, secret) is True


def test_webhook_signature_rejects_tampering():
    secret = "test-webhook-secret"
    signature = _signature(secret, "123", "request-1", "1742505638683")
    assert verify_webhook_signature(signature, "request-1", "999", secret) is False


def test_access_token_is_required_server_side(monkeypatch):
    monkeypatch.delenv("MERCADOPAGO_ACCESS_TOKEN", raising=False)
    with pytest.raises(MercadoPagoNotConfigured):
        _headers()


def test_access_token_never_appears_in_error(monkeypatch):
    monkeypatch.setenv("MERCADOPAGO_ACCESS_TOKEN", "APP_USR_super-secret")
    headers = _headers(idempotency_key="safe-id")
    assert headers["Authorization"].startswith("Bearer ")
    assert headers["X-Idempotency-Key"] == "safe-id"


class _ScalarResult:
    def __init__(self, value):
        self.value = value

    def scalars(self):
        return self

    def first(self):
        return self.value


class _Session:
    def __init__(self, execute_results):
        self._execute_results = iter(execute_results)
        self.added = []
        self.commit = AsyncMock()

    async def execute(self, _statement):
        return _ScalarResult(next(self._execute_results))

    def add(self, value):
        self.added.append(value)


@pytest.mark.asyncio
async def test_payment_webhook_refetches_provider_updates_checkout_and_commits(monkeypatch):
    checkout = SimpleNamespace(status="PENDING", updated_at=None)
    session = _Session([None, checkout])
    provider_payment = {
        "id": 987654,
        "status": "approved",
        "status_detail": "accredited",
        "payment_type_id": "credit_card",
        "external_reference": "xpex:7:xpmc_123",
    }
    fetch_payment = AsyncMock(return_value=provider_payment)
    monkeypatch.setattr(gateway, "_fetch_payment", fetch_payment)

    payload = {
        "id": "notif-1",
        "action": "payment.updated",
        "type": "payment",
        "live_mode": False,
        "data": {"id": "987654"},
    }

    result = await process_verified_webhook(payload, "987654", session)

    assert result["status"] == "processed"
    assert result["payment_status"] == "APPROVED"
    assert checkout.status == "APPROVED"
    fetch_payment.assert_awaited_once_with("987654")
    session.commit.assert_awaited_once()
    assert len(session.added) == 2
    event = session.added[0]
    assert event.verified is True
    assert event.normalized_status == "APPROVED"
    assert event.external_reference == "xpex:7:xpmc_123"


@pytest.mark.asyncio
async def test_duplicate_webhook_is_idempotent_and_skips_provider_refetch(monkeypatch):
    existing = SimpleNamespace(event_key="notif-1:payment.updated:987654")
    session = _Session([existing])
    fetch_payment = AsyncMock()
    monkeypatch.setattr(gateway, "_fetch_payment", fetch_payment)

    payload = {
        "id": "notif-1",
        "action": "payment.updated",
        "type": "payment",
        "live_mode": False,
        "data": {"id": "987654"},
    }

    result = await process_verified_webhook(payload, "987654", session)

    assert result == {
        "status": "duplicate",
        "event_key": "notif-1:payment.updated:987654",
    }
    fetch_payment.assert_not_awaited()
    session.commit.assert_not_awaited()
    assert session.added == []


@pytest.mark.asyncio
async def test_order_webhook_is_recorded_without_payment_refetch(monkeypatch):
    session = _Session([None])
    fetch_payment = AsyncMock()
    monkeypatch.setattr(gateway, "_fetch_payment", fetch_payment)

    payload = {
        "id": "order-notif-1",
        "action": "order.processed",
        "type": "order",
        "live_mode": True,
        "data": {"id": "123456"},
    }

    result = await process_verified_webhook(payload, "123456", session)

    assert result["status"] == "processed"
    assert result["payment_status"] is None
    fetch_payment.assert_not_awaited()
    session.commit.assert_awaited_once()
    assert len(session.added) == 1
    event = session.added[0]
    assert event.resource_type == "order"
    assert event.resource_id == "123456"
    assert event.verified is True
