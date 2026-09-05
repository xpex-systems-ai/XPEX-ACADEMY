from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel.ext.asyncio.session import AsyncSession
from src.core.events.database import get_db_session
from src.db.users import PublicUser
from src.security.auth import get_current_user
from src.services.xpex.course_factory import (
    FactoryRunResponse,
    run_flagship_course_factory,
)
from src.services.xpex.dashboard import get_student_dashboard
from src.services.xpex.editorial_listing import list_editorial_drafts_page
from src.services.xpex.editorial_studio import (
    EditorialDraftResponse,
    EditorialEditRequest,
    EditorialGenerateRequest,
    EditorialMutationRequest,
    PublishResult,
    approve_editorial_draft,
    edit_editorial_draft,
    generate_editorial_draft,
    get_editorial_draft,
    publish_editorial_draft,
    review_editorial_draft,
)
from src.services.xpex.launch_ops import (
    StudentEnrollmentRequest,
    StudentInviteRequest,
    enroll_launch_student,
    invite_launch_student,
    list_launch_courses,
)
from src.services.xpex.launch_readiness import get_launch_readiness
from src.services.xpex.teacher_dashboard import get_teacher_dashboard
from src.services.xpex.video_studio import (
    VideoBatchResponse,
    VideoJobResponse,
    approve_video_job,
    attach_video_job,
    create_video_batch,
    list_video_jobs,
    process_video_job,
    publish_video_job,
)

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


@router.get("/teacher-dashboard")
async def teacher_dashboard(
    organization_slug: str,
    current_user: Annotated[PublicUser, Depends(get_current_user)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
):
    dashboard = await get_teacher_dashboard(current_user, organization_slug, db_session)
    if dashboard is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher membership required",
        )
    return dashboard


@router.get("/launch-readiness")
async def launch_readiness(
    organization_slug: str,
    current_user: Annotated[PublicUser, Depends(get_current_user)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
):
    readiness = await get_launch_readiness(current_user, organization_slug, db_session)
    if readiness is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization administrator access required",
        )
    return readiness


@router.get("/launch/courses")
async def launch_courses(
    organization_slug: str,
    current_user: Annotated[PublicUser, Depends(get_current_user)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
):
    return await list_launch_courses(organization_slug, current_user, db_session)


@router.post("/launch/students/invite")
async def launch_student_invite(
    request: Request,
    payload: StudentInviteRequest,
    current_user: Annotated[PublicUser, Depends(get_current_user)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
):
    return await invite_launch_student(request, payload, current_user, db_session)


@router.post("/launch/students/enroll")
async def launch_student_enroll(
    payload: StudentEnrollmentRequest,
    current_user: Annotated[PublicUser, Depends(get_current_user)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
):
    return await enroll_launch_student(payload, current_user, db_session)


@router.post("/course-factory/flagship-ai", response_model=FactoryRunResponse)
async def course_factory_flagship_ai(
    request: Request,
    organization_slug: str,
    current_user: Annotated[PublicUser, Depends(get_current_user)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Run/resume XPEX-AI-COURSE-FACTORY-001 for an authorized organization admin."""
    return await run_flagship_course_factory(
        request,
        organization_slug,
        current_user,
        db_session,
    )


@router.post("/course-studio/drafts", response_model=EditorialDraftResponse)
async def course_studio_generate(
    payload: EditorialGenerateRequest,
    current_user: Annotated[PublicUser, Depends(get_current_user)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
):
    return await generate_editorial_draft(payload, current_user, db_session)


@router.get("/course-studio/drafts", response_model=list[EditorialDraftResponse])
async def course_studio_list(
    organization_slug: str,
    current_user: Annotated[PublicUser, Depends(get_current_user)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
    limit: int = 25,
    offset: int = 0,
):
    return await list_editorial_drafts_page(
        organization_slug,
        current_user,
        db_session,
        limit,
        offset,
    )


@router.get("/course-studio/drafts/{draft_id}", response_model=EditorialDraftResponse)
async def course_studio_get(
    draft_id: str,
    current_user: Annotated[PublicUser, Depends(get_current_user)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
):
    return await get_editorial_draft(draft_id, current_user, db_session)


@router.put("/course-studio/drafts/{draft_id}", response_model=EditorialDraftResponse)
async def course_studio_edit(
    draft_id: str,
    payload: EditorialEditRequest,
    current_user: Annotated[PublicUser, Depends(get_current_user)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
):
    return await edit_editorial_draft(draft_id, payload, current_user, db_session)


@router.post("/course-studio/drafts/{draft_id}/review", response_model=EditorialDraftResponse)
async def course_studio_review(
    draft_id: str,
    payload: EditorialMutationRequest,
    current_user: Annotated[PublicUser, Depends(get_current_user)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
):
    return await review_editorial_draft(draft_id, payload, current_user, db_session)


@router.post("/course-studio/drafts/{draft_id}/approve", response_model=EditorialDraftResponse)
async def course_studio_approve(
    draft_id: str,
    payload: EditorialMutationRequest,
    current_user: Annotated[PublicUser, Depends(get_current_user)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
):
    return await approve_editorial_draft(draft_id, payload, current_user, db_session)


@router.post("/course-studio/drafts/{draft_id}/publish", response_model=PublishResult)
async def course_studio_publish(
    request: Request,
    draft_id: str,
    payload: EditorialMutationRequest,
    current_user: Annotated[PublicUser, Depends(get_current_user)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
):
    return await publish_editorial_draft(request, draft_id, payload, current_user, db_session)


@router.post("/course-studio/drafts/{draft_id}/videos", response_model=VideoBatchResponse)
async def video_studio_create_batch(
    draft_id: str,
    current_user: Annotated[PublicUser, Depends(get_current_user)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
):
    return await create_video_batch(draft_id, current_user, db_session)


@router.get("/course-studio/drafts/{draft_id}/videos", response_model=list[VideoJobResponse])
async def video_studio_list_jobs(
    draft_id: str,
    current_user: Annotated[PublicUser, Depends(get_current_user)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
):
    return await list_video_jobs(draft_id, current_user, db_session)


@router.post("/video-studio/jobs/{job_id}/process", response_model=VideoJobResponse)
async def video_studio_process_job(
    job_id: str,
    current_user: Annotated[PublicUser, Depends(get_current_user)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
):
    return await process_video_job(job_id, current_user, db_session)


@router.post("/video-studio/jobs/{job_id}/approve", response_model=VideoJobResponse)
async def video_studio_approve_job(
    job_id: str,
    current_user: Annotated[PublicUser, Depends(get_current_user)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
):
    return await approve_video_job(job_id, current_user, db_session)


@router.post("/video-studio/jobs/{job_id}/attach", response_model=VideoJobResponse)
async def video_studio_attach_job(
    request: Request,
    job_id: str,
    current_user: Annotated[PublicUser, Depends(get_current_user)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
):
    return await attach_video_job(request, job_id, current_user, db_session)


@router.post("/video-studio/jobs/{job_id}/publish", response_model=VideoJobResponse)
async def video_studio_publish_job(
    request: Request,
    job_id: str,
    current_user: Annotated[PublicUser, Depends(get_current_user)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
):
    return await publish_video_job(request, job_id, current_user, db_session)
