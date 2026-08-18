from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession
from src.core.events.database import get_db_session
from src.db.users import PublicUser
from src.security.auth import get_current_user
from src.services.xpex.dashboard import get_student_dashboard

router = APIRouter()


@router.get("/learning-dashboard")
async def learning_dashboard(
    organization_slug: str,
    current_user: Annotated[PublicUser, Depends(get_current_user)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
):
    dashboard = await get_student_dashboard(current_user, organization_slug, db_session)
    if dashboard is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization membership required",
        )
    return dashboard
