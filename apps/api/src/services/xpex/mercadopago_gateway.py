"""Mercado Pago boundary for XPeX.

Credentials are read only from server-side environment variables. Payment events
are evidence; they never mutate LearnHouse progress directly.
"""

from __future__ import annotations

import hashlib
import hmac
import os
from datetime import UTC, datetime
from uuid import uuid4

import httpx
from fastapi import HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from src.db.courses.courses import Course
from src.db.organizations import Organization
from src.db.users import PublicUser
from src.db.xpex_mercadopago import XPeXMercadoPagoCheckout, XPeXMercadoPagoEvent
from src.services.courses.locks import is_org_admin

MP_API_BASE = "https://api.mercadopago.com"


class MercadoPagoNotConfigured(RuntimeError):
    pass


class MercadoPagoProviderError(RuntimeError):
    pass


class CheckoutRequest(BaseModel):
    organization_slug: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=3, max_length=220)
    unit_price: float = Field(gt=0)
    quantity: int = Field(default=1, ge=1, le=100)
    course_uuid: str | None = Field(default=None, max_length=100)
    success_url: str | None = Field(default=None, max_length=1000)
    pending_url: str | None = Field(default=None, max_length=1000)
    failure_url: str | None = Field(default=None, max_length=1000)


class CheckoutResponse(BaseModel):
    checkout_id: str
    preference_id: str
    status: str
    init_point: str | None
    sandbox_init_point: str | None
    external_reference: str


def _now() -> str:
    return datetime.now(UTC).isoformat()


def _required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise MercadoPagoNotConfigured(f"{name} is not configured")
    return value


def _headers(*, idempotency_key: str | None = None) -> dict[str, str]:
    headers = {
        "Authorization": f"Bearer {_required_env('MERCADOPAGO_ACCESS_TOKEN')}",
        "Content-Type": "application/json",
    }
    if idempotency_key:
        headers["X-Idempotency-Key"] = idempotency_key
    return headers


def verify_webhook_signature(
    x_signature: str,
    x_request_id: str,
    data_id: str,
    secret: str,
) -> bool:
    parts: dict[str, str] = {}
    for item in (x_signature or "").split(","):
        key, sep, value = item.strip().partition("=")
        if sep and key and value:
            parts[key] = value
    ts = parts.get("ts")
    supplied = parts.get("v1")
    if not ts or not supplied or not secret:
        return False
    normalized_data_id = (data_id or "").lower()
    manifest_parts = []
    if normalized_data_id:
        manifest_parts.append(f"id:{normalized_data_id};")
    if x_request_id:
        manifest_parts.append(f"request-id:{x_request_id};")
    manifest_parts.append(f"ts:{ts};")
    expected = hmac.new(
        secret.encode(),
        "".join(manifest_parts).encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, supplied)


async def _authorized_org(
    slug: str,
    user: PublicUser,
    db_session: AsyncSession,
) -> Organization:
    result = await db_session.execute(select(Organization).where(Organization.slug == slug))
    org = result.scalars().first()
    if not org or org.id is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    if not await is_org_admin(user.id, org.id, db_session):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization administrator access required",
        )
    return org


async def create_checkout(
    payload: CheckoutRequest,
    user: PublicUser,
    db_session: AsyncSession,
) -> CheckoutResponse:
    org = await _authorized_org(payload.organization_slug, user, db_session)
    if payload.course_uuid:
        statement = select(Course).where(
            Course.course_uuid == payload.course_uuid,
            Course.org_id == org.id,
            Course.published == True,
        )
        course = (await db_session.execute(statement)).scalars().first()
        if not course:
            raise HTTPException(status_code=404, detail="Published course not found")

    checkout_id = f"xpmc_{uuid4()}"
    external_reference = f"xpex:{org.id}:{checkout_id}"
    body: dict = {
        "items": [
            {
                "id": payload.course_uuid or checkout_id,
                "title": payload.title,
                "quantity": payload.quantity,
                "currency_id": "BRL",
                "unit_price": payload.unit_price,
            }
        ],
        "external_reference": external_reference,
        "metadata": {
            "xpex_checkout_id": checkout_id,
            "xpex_org_id": org.id,
            "course_uuid": payload.course_uuid,
        },
    }
    integrator_id = os.getenv("MERCADOPAGO_INTEGRATOR_ID", "").strip()
    if integrator_id:
        body["integrator_id"] = integrator_id
    notification_url = os.getenv("MERCADOPAGO_NOTIFICATION_URL", "").strip()
    if notification_url:
        body["notification_url"] = notification_url
    back_urls = {
        key: value
        for key, value in {
            "success": payload.success_url,
            "pending": payload.pending_url,
            "failure": payload.failure_url,
        }.items()
        if value
    }
    if back_urls:
        body["back_urls"] = back_urls
        if "success" in back_urls:
            body["auto_return"] = "approved"

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                f"{MP_API_BASE}/checkout/preferences",
                headers=_headers(idempotency_key=checkout_id),
                json=body,
            )
    except httpx.HTTPError:
        raise MercadoPagoProviderError(
            "Mercado Pago checkout transport request failed"
        ) from None
    if response.status_code >= 400:
        raise MercadoPagoProviderError(
            f"Mercado Pago checkout failed with HTTP {response.status_code}"
        )
    data = response.json()
    preference_id = str(data.get("id") or "")
    if not preference_id:
        raise MercadoPagoProviderError(
            "Mercado Pago checkout response did not include preference id"
        )

    now = _now()
    record = XPeXMercadoPagoCheckout(
        checkout_id=checkout_id,
        preference_id=preference_id,
        org_id=int(org.id),
        created_by_user_id=user.id,
        course_uuid=payload.course_uuid,
        title=payload.title,
        quantity=payload.quantity,
        unit_price=payload.unit_price,
        currency="BRL",
        status="PENDING",
        external_reference=external_reference,
        init_point=data.get("init_point"),
        sandbox_init_point=data.get("sandbox_init_point"),
        provider_metadata={"collector_id": data.get("collector_id")},
        created_at=now,
        updated_at=now,
    )
    db_session.add(record)
    await db_session.commit()
    return CheckoutResponse(
        checkout_id=checkout_id,
        preference_id=preference_id,
        status=record.status,
        init_point=record.init_point,
        sandbox_init_point=record.sandbox_init_point,
        external_reference=external_reference,
    )


async def _fetch_payment(payment_id: str) -> dict:
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(
                f"{MP_API_BASE}/v1/payments/{payment_id}",
                headers=_headers(),
            )
    except httpx.HTTPError:
        raise MercadoPagoProviderError(
            "Mercado Pago payment verification transport request failed"
        ) from None
    if response.status_code >= 400:
        raise MercadoPagoProviderError(
            f"Mercado Pago payment verification failed with HTTP {response.status_code}"
        )
    return response.json()


async def process_verified_webhook(
    payload: dict,
    data_id: str,
    db_session: AsyncSession,
) -> dict:
    notification_id = str(payload.get("id") or "")
    action = str(payload.get("action") or "")
    resource_type = str(payload.get("type") or "")
    event_key = (
        f"{notification_id}:{action}:{data_id}"
        if notification_id
        else f"{action}:{data_id}"
    )
    statement = select(XPeXMercadoPagoEvent).where(
        XPeXMercadoPagoEvent.event_key == event_key
    )
    existing = (await db_session.execute(statement)).scalars().first()
    if existing:
        return {"status": "duplicate", "event_key": event_key}

    snapshot: dict = {}
    normalized_status = None
    external_reference = None
    if resource_type == "payment" and data_id:
        snapshot = await _fetch_payment(data_id)
        normalized_status = str(snapshot.get("status") or "").upper() or None
        external_reference = snapshot.get("external_reference")

    now = _now()
    event = XPeXMercadoPagoEvent(
        event_key=event_key,
        notification_id=notification_id or None,
        action=action,
        resource_type=resource_type,
        resource_id=data_id,
        live_mode=bool(payload.get("live_mode")),
        verified=True,
        processing_state="VERIFIED",
        normalized_status=normalized_status,
        external_reference=external_reference,
        provider_snapshot={
            "id": snapshot.get("id"),
            "status": snapshot.get("status"),
            "status_detail": snapshot.get("status_detail"),
            "payment_type_id": snapshot.get("payment_type_id"),
        },
        created_at=now,
        updated_at=now,
    )
    db_session.add(event)

    if external_reference:
        checkout_statement = select(XPeXMercadoPagoCheckout).where(
            XPeXMercadoPagoCheckout.external_reference == external_reference
        )
        checkout = (await db_session.execute(checkout_statement)).scalars().first()
        if checkout:
            checkout.status = normalized_status or checkout.status
            checkout.updated_at = now
            db_session.add(checkout)
    await db_session.commit()
    return {
        "status": "processed",
        "event_key": event_key,
        "payment_status": normalized_status,
    }
