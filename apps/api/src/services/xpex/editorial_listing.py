"""Paged editorial listing for the XPeX control plane."""

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from src.db.users import PublicUser
from src.db.xpex_editorial import XPeXEditorialDraft
from src.services.xpex.editorial_studio import (
    EditorialDraftResponse,
    _as_response,
    _authorized_org,
)


async def list_editorial_drafts_page(
    organization_slug: str,
    current_user: PublicUser,
    db_session: AsyncSession,
    limit: int = 25,
    offset: int = 0,
) -> list[EditorialDraftResponse]:
    org = await _authorized_org(organization_slug, current_user, db_session)
    rows = (
        await db_session.execute(
            select(XPeXEditorialDraft)
            .where(XPeXEditorialDraft.org_id == org.id)
            .order_by(XPeXEditorialDraft.id.desc())
            .offset(max(offset, 0))
            .limit(min(max(limit, 1), 100))
        )
    ).scalars().all()
    return [_as_response(row, org) for row in rows]
