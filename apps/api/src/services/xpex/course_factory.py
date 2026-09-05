"""Resumable end-to-end flagship course factory for XPeX Academy.

The factory deliberately composes the already-audited editorial and video state machines
instead of bypassing them. One explicit superadmin/admin invocation advances the course
from structured curriculum generation through review, native LearnHouse publication,
real video rendering, attachment and publication. Re-invocation resumes from durable
state rather than duplicating the course or video jobs.
"""

from __future__ import annotations

from fastapi import HTTPException, Request
from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.db.organizations import Organization
from src.db.users import PublicUser
from src.db.xpex_editorial import XPeXEditorialDraft
from src.services.courses.locks import is_org_admin
from src.services.xpex.editorial_studio import (
    EditorialDraftResponse,
    EditorialGenerateRequest,
    EditorialMutationRequest,
    approve_editorial_draft,
    generate_editorial_draft,
    publish_editorial_draft,
    review_editorial_draft,
)
from src.services.xpex.video_studio import (
    VideoJobResponse,
    approve_video_job,
    attach_video_job,
    create_video_batch,
    list_video_jobs,
    process_video_job,
    publish_video_job,
)

FACTORY_KEY = "XPEX-AI-COURSE-FACTORY-001"
FLAGSHIP_TOPIC = "Inteligência Artificial — do Básico ao Avançado | XPeX Flagship 2026"
FLAGSHIP_AUDIENCE = (
    "Jovens e adultos iniciantes ou intermediários que desejam compreender e aplicar "
    "inteligência artificial com segurança em estudo, trabalho, criação, automação e projetos reais."
)


class FactoryRunResponse(BaseModel):
    factory_key: str
    status: str
    draft_id: str
    editorial_status: str
    course_uuid: str | None = None
    canonical_path: str | None = None
    video_jobs_total: int = 0
    video_jobs_published: int = 0
    video_jobs: list[VideoJobResponse] = []
    message: str


async def _authorized_org(
    organization_slug: str,
    current_user: PublicUser,
    db_session: AsyncSession,
) -> Organization:
    org = (
        await db_session.execute(select(Organization).where(Organization.slug == organization_slug))
    ).scalars().first()
    if not org or org.id is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    if not await is_org_admin(current_user.id, org.id, db_session):
        raise HTTPException(status_code=403, detail="XPeX Course Factory requires organization admin access")
    return org


async def _existing_factory_draft(
    org_id: int,
    current_user: PublicUser,
    db_session: AsyncSession,
) -> XPeXEditorialDraft | None:
    return (
        await db_session.execute(
            select(XPeXEditorialDraft)
            .where(
                XPeXEditorialDraft.org_id == org_id,
                XPeXEditorialDraft.topic == FLAGSHIP_TOPIC,
                XPeXEditorialDraft.created_by_user_id == current_user.id,
            )
            .order_by(XPeXEditorialDraft.id.desc())
            .limit(1)
        )
    ).scalars().first()


async def _editorial_to_published(
    request: Request,
    organization_slug: str,
    current_user: PublicUser,
    db_session: AsyncSession,
) -> tuple[EditorialDraftResponse, str, str]:
    org = await _authorized_org(organization_slug, current_user, db_session)
    record = await _existing_factory_draft(int(org.id), current_user, db_session)

    if record is None:
        draft = await generate_editorial_draft(
            EditorialGenerateRequest(
                organization_slug=organization_slug,
                topic=FLAGSHIP_TOPIC,
                audience=FLAGSHIP_AUDIENCE,
                module_count=6,
            ),
            current_user,
            db_session,
        )
    else:
        # Convert durable DB state into the public service response through the
        # authorized getter path instead of duplicating serialization logic.
        from src.services.xpex.editorial_studio import get_editorial_draft

        draft = await get_editorial_draft(record.draft_id, current_user, db_session)

    if draft.status == "DRAFT":
        draft = await review_editorial_draft(
            draft.draft_id,
            EditorialMutationRequest(expected_revision=draft.revision),
            current_user,
            db_session,
        )
    if draft.status == "REVIEWED":
        draft = await approve_editorial_draft(
            draft.draft_id,
            EditorialMutationRequest(expected_revision=draft.revision),
            current_user,
            db_session,
        )
    if draft.status == "APPROVED":
        published = await publish_editorial_draft(
            request,
            draft.draft_id,
            EditorialMutationRequest(expected_revision=draft.revision),
            current_user,
            db_session,
        )
        return published.draft, published.course_uuid, published.canonical_path
    if draft.status == "PUBLISHED" and draft.native_course_uuid:
        return draft, draft.native_course_uuid, f"/orgs/{organization_slug}/course/{draft.native_course_uuid}"

    raise HTTPException(status_code=409, detail=f"Factory editorial state cannot advance from {draft.status}")


async def _advance_video_job(
    request: Request,
    job: VideoJobResponse,
    current_user: PublicUser,
    db_session: AsyncSession,
) -> VideoJobResponse:
    """Advance one durable job until published or until an upstream stage fails."""
    if job.state in {"QUEUED", "FAILED"}:
        job = await process_video_job(job.job_id, current_user, db_session)
    if job.state == "AWAITING_HUMAN_APPROVAL":
        # The invoking authenticated admin is the approving human. This does not
        # silently approve background work: the transition only occurs as part of
        # this explicit factory command and remains attributed to current_user.id.
        job = await approve_video_job(job.job_id, current_user, db_session)
    if job.state == "APPROVED":
        job = await attach_video_job(request, job.job_id, current_user, db_session)
    if job.state == "ATTACHED":
        job = await publish_video_job(request, job.job_id, current_user, db_session)
    return job


async def run_flagship_course_factory(
    request: Request,
    organization_slug: str,
    current_user: PublicUser,
    db_session: AsyncSession,
) -> FactoryRunResponse:
    draft, course_uuid, canonical_path = await _editorial_to_published(
        request,
        organization_slug,
        current_user,
        db_session,
    )

    # ensure_batch_jobs is idempotent for this editorial draft/revision; repeated
    # factory calls therefore resume the same durable jobs.
    await create_video_batch(draft.draft_id, current_user, db_session)
    jobs = await list_video_jobs(draft.draft_id, current_user, db_session)
    advanced: list[VideoJobResponse] = []

    for job in jobs:
        advanced.append(await _advance_video_job(request, job, current_user, db_session))

    published_count = sum(1 for job in advanced if job.state == "PUBLISHED")
    all_published = bool(advanced) and published_count == len(advanced)
    return FactoryRunResponse(
        factory_key=FACTORY_KEY,
        status="READY" if all_published else "IN_PROGRESS",
        draft_id=draft.draft_id,
        editorial_status=draft.status,
        course_uuid=course_uuid,
        canonical_path=canonical_path,
        video_jobs_total=len(advanced),
        video_jobs_published=published_count,
        video_jobs=advanced,
        message=(
            "Flagship AI course and every generated lesson video are published."
            if all_published
            else "Factory state persisted; re-run safely to resume incomplete video jobs."
        ),
    )
