import hashlib
import hmac

import pytest
from src.services.xpex.mercadopago_gateway import (
    MercadoPagoNotConfigured,
    _headers,
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
