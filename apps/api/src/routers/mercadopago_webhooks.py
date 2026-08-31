import os

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel.ext.asyncio.session import AsyncSession

from src.core.events.database import get_db_session
from src.services.xpex.mercadopago_gateway import process_verified_webhook, verify_webhook_signature

router = APIRouter()


@router.post("/mercadopago")
async def mercadopago_webhook(request: Request, db_session: AsyncSession = Depends(get_db_session)):
    secret = os.getenv("MERCADOPAGO_WEBHOOK_SECRET", "").strip()
    if not secret:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Mercado Pago webhook is not configured")

    x_signature = request.headers.get("x-signature", "")
    x_request_id = request.headers.get("x-request-id", "")
    data_id = request.query_params.get("data.id", "") or request.query_params.get("data_id", "")
    if not verify_webhook_signature(x_signature, x_request_id, data_id, secret):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Mercado Pago webhook signature")

    try:
        payload = await request.json()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid webhook JSON") from None
    if not data_id:
        data_id = str((payload.get("data") or {}).get("id") or "")
    return await process_verified_webhook(payload, data_id, db_session)
