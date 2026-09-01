from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from src.core.events.database import get_db_session
from src.db.users import PublicUser
from src.security.auth import get_current_user
from src.services.xpex.mercadopago_gateway import (
    CheckoutRequest,
    CheckoutResponse,
    MercadoPagoNotConfigured,
    MercadoPagoProviderError,
    create_checkout,
)

router = APIRouter()


@router.post("/checkout", response_model=CheckoutResponse)
async def mercadopago_checkout(
    payload: CheckoutRequest,
    current_user: Annotated[PublicUser, Depends(get_current_user)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
):
    try:
        return await create_checkout(payload, current_user, db_session)
    except MercadoPagoNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from None
    except MercadoPagoProviderError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from None
