"""Durable editorial AI workflow and explicit LearnHouse publisher for XPeX.

Generate, Review, Edit and Approve only touch editorial staging. Native LearnHouse
Course/Chapter/Activity rows are created only by an explicit authorized Publish.
"""

from __future__ import annotations

import hashlib
import json
import logging
from datetime import UTC, datetime
from uuid import uuid4

from fastapi import HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from src.db.courses.activities import (
    ActivityCreate,
    ActivitySubTypeEnum,
    ActivityTypeEnum,
    ActivityUpdate,
)
from src.db.courses.chapters import ChapterCreate, LockType
from src.db.courses.courses import CourseCreate, CourseUpdate
from src.db.organizations import Organization
from src.db.users import PublicUser
from src.db.xpex_editorial import XPeXEditorialDraft
from src.services.courses.activities.activities import create_activity, update_activity
from src.services.courses.chapters import create_chapter
from src.services.courses.courses import create_course, delete_course, update_course
from src.services.courses.locks import is_org_admin
from src.services.xpex.content_studio import (
    CourseDraft,
    CourseDraftReview,
    CourseStudioNotConfigured,
    CourseStudioProviderError,
    generate_course_draft,
    review_course_draft,
)

logger = logging.getLogger(__name__)


class EditorialGenerateRequest(BaseModel):
    organization_slug: str = Field(min_length=1, max_length=120)
    topic: str = Field(min_length=3, max_length=300)
    audience: str = Field(min_length=10, max_length=800)
    module_count: int = Field(default=1, ge=1, le=12)


class EditorialEditRequest(BaseModel):
    expected_revision: int = Field(ge=1)
    draft: CourseDraft


class EditorialMutationRequest(BaseModel):
    expected_revision: int = Field(ge=1)


class EditorialDraftResponse(BaseModel):
    draft_id: str
    organization_slug: str
    status: str
    publication_state: str
    revision: int
    content_hash: str
    schema_version: str
    topic: str
    audience: str
    module_count: int
    draft: CourseDraft
    review: CourseDraftReview | None
    generated_by: str
    reviewed_by: str | None
    reviewed_revision: int | None
    reviewed_content_hash: str | None
    approved_by_user_id: int | None
    approved_revision: int | None
    approved_content_hash: str | None
    native_course_id: int | None
    native_course_uuid: str | None
    native_mapping: dict | None
    created_at: str
    updated_at: str


class PublishResult(BaseModel):
    draft: EditorialDraftResponse
    course_id: int
    course_uuid: str
    canonical_path: str
    idempotent_replay: bool = False


def _now() -> str:
    return datetime.now(UTC).isoformat()


def draft_content_hash(draft: CourseDraft) -> str:
    payload = draft.model_dump(mode="json")
    encoded = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def review_has_blocker(review: CourseDraftReview | None) -> bool:
    return bool(review and any(note.severity == "BLOCKER" for note in review.notes))


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
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="XPeX Course Studio requires organization admin or maintainer access",
        )
    return org


async def _draft_for_actor(
    draft_id: str,
    current_user: PublicUser,
    db_session: AsyncSession,
    *,
    for_update: bool = False,
) -> tuple[XPeXEditorialDraft, Organization]:
    statement = select(XPeXEditorialDraft).where(XPeXEditorialDraft.draft_id == draft_id)
    if for_update:
        statement = statement.with_for_update()
    record = (await db_session.execute(statement)).scalars().first()
    if not record:
        raise HTTPException(status_code=404, detail="Editorial draft not found")
    org = (
        await db_session.execute(select(Organization).where(Organization.id == record.org_id))
    ).scalars().first()
    if not org or org.id is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    if not await is_org_admin(current_user.id, org.id, db_session):
        raise HTTPException(
            status_code=403,
            detail="Editorial draft is outside your authorized organization",
        )
    return record, org


def _as_response(record: XPeXEditorialDraft, org: Organization) -> EditorialDraftResponse:
    return EditorialDraftResponse(
        draft_id=record.draft_id,
        organization_slug=org.slug,
        status=record.status,
        publication_state=record.publication_state,
        revision=record.revision,
        content_hash=record.content_hash,
        schema_version=record.schema_version,
        topic=record.topic,
        audience=record.audience,
        module_count=record.module_count,
        draft=CourseDraft.model_validate(record.draft_json),
        review=CourseDraftReview.model_validate(record.review_json) if record.review_json else None,
        generated_by=record.generated_by,
        reviewed_by=record.reviewed_by,
        reviewed_revision=record.reviewed_revision,
        reviewed_content_hash=record.reviewed_content_hash,
        approved_by_user_id=record.approved_by_user_id,
        approved_revision=record.approved_revision,
        approved_content_hash=record.approved_content_hash,
        native_course_id=record.native_course_id,
        native_course_uuid=record.native_course_uuid,
        native_mapping=record.native_mapping,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


def _clear_review_and_approval(record: XPeXEditorialDraft) -> None:
    record.review_json = None
    record.reviewed_by = None
    record.reviewed_revision = None
    record.reviewed_content_hash = None
    record.reviewed_at = None
    record.approved_by_user_id = None
    record.approved_revision = None
    record.approved_content_hash = None
    record.approved_at = None
    record.status = "DRAFT"


async def generate_editorial_draft(
    payload: EditorialGenerateRequest,
    current_user: PublicUser,
    db_session: AsyncSession,
) -> EditorialDraftResponse:
    org = await _authorized_org(payload.organization_slug, current_user, db_session)
    try:
        draft = await generate_course_draft(payload.topic, payload.audience, payload.module_count)
    except (CourseStudioNotConfigured, CourseStudioProviderError, ValueError) as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from None

    now = _now()
    record = XPeXEditorialDraft(
        draft_id=f"xped_{uuid4()}",
        org_id=int(org.id),
        created_by_user_id=current_user.id,
        status="DRAFT",
        publication_state="IDLE",
        revision=1,
        content_hash=draft_content_hash(draft),
        topic=payload.topic.strip(),
        audience=payload.audience.strip(),
        module_count=payload.module_count,
        draft_json=draft.model_dump(mode="json"),
        generated_by="openrouter",
        created_at=now,
        updated_at=now,
    )
    db_session.add(record)
    await db_session.commit()
    await db_session.refresh(record)
    logger.info(
        "XPeX editorial transition draft=%s org=%s transition=GENERATE->DRAFT actor=%s",
        record.draft_id,
        org.id,
        current_user.user_uuid,
    )
    return _as_response(record, org)


async def get_editorial_draft(
    draft_id: str,
    current_user: PublicUser,
    db_session: AsyncSession,
) -> EditorialDraftResponse:
    record, org = await _draft_for_actor(draft_id, current_user, db_session)
    return _as_response(record, org)


async def list_editorial_drafts(
    organization_slug: str,
    current_user: PublicUser,
    db_session: AsyncSession,
    limit: int = 25,
) -> list[EditorialDraftResponse]:
    org = await _authorized_org(organization_slug, current_user, db_session)
    rows = (
        await db_session.execute(
            select(XPeXEditorialDraft)
            .where(XPeXEditorialDraft.org_id == org.id)
            .order_by(XPeXEditorialDraft.id.desc())
            .limit(min(max(limit, 1), 100))
        )
    ).scalars().all()
    return [_as_response(row, org) for row in rows]


async def edit_editorial_draft(
    draft_id: str,
    payload: EditorialEditRequest,
    current_user: PublicUser,
    db_session: AsyncSession,
) -> EditorialDraftResponse:
    record, org = await _draft_for_actor(draft_id, current_user, db_session, for_update=True)
    if record.status == "PUBLISHED":
        raise HTTPException(status_code=409, detail="Published editorial revisions are immutable")
    if record.revision != payload.expected_revision:
        raise HTTPException(status_code=409, detail="Stale editorial revision")
    new_hash = draft_content_hash(payload.draft)
    if new_hash != record.content_hash:
        record.revision += 1
        record.content_hash = new_hash
        record.draft_json = payload.draft.model_dump(mode="json")
        record.module_count = len(payload.draft.modules)
        _clear_review_and_approval(record)
    record.updated_at = _now()
    db_session.add(record)
    await db_session.commit()
    await db_session.refresh(record)
    return _as_response(record, org)


async def review_editorial_draft(
    draft_id: str,
    payload: EditorialMutationRequest,
    current_user: PublicUser,
    db_session: AsyncSession,
) -> EditorialDraftResponse:
    record, org = await _draft_for_actor(draft_id, current_user, db_session, for_update=True)
    if record.revision != payload.expected_revision:
        raise HTTPException(status_code=409, detail="Stale editorial revision")
    if record.status == "PUBLISHED":
        raise HTTPException(status_code=409, detail="Published editorial revisions are immutable")
    draft = CourseDraft.model_validate(record.draft_json)
    try:
        review = await review_course_draft(draft)
    except (CourseStudioNotConfigured, CourseStudioProviderError) as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from None
    record.review_json = review.model_dump(mode="json")
    record.reviewed_by = "huggingface"
    record.reviewed_revision = record.revision
    record.reviewed_content_hash = record.content_hash
    record.reviewed_at = _now()
    record.approved_by_user_id = None
    record.approved_revision = None
    record.approved_content_hash = None
    record.approved_at = None
    record.status = "REVIEWED"
    record.updated_at = _now()
    db_session.add(record)
    await db_session.commit()
    await db_session.refresh(record)
    logger.info(
        "XPeX editorial transition draft=%s transition=DRAFT->REVIEWED actor=%s",
        record.draft_id,
        current_user.user_uuid,
    )
    return _as_response(record, org)


async def approve_editorial_draft(
    draft_id: str,
    payload: EditorialMutationRequest,
    current_user: PublicUser,
    db_session: AsyncSession,
) -> EditorialDraftResponse:
    record, org = await _draft_for_actor(draft_id, current_user, db_session, for_update=True)
    if record.revision != payload.expected_revision:
        raise HTTPException(status_code=409, detail="Stale editorial revision")
    if record.status != "REVIEWED":
        raise HTTPException(status_code=409, detail="Only a reviewed draft can be approved")
    if record.reviewed_revision != record.revision or record.reviewed_content_hash != record.content_hash:
        raise HTTPException(status_code=409, detail="Review evidence is stale")
    review = CourseDraftReview.model_validate(record.review_json) if record.review_json else None
    if review_has_blocker(review):
        raise HTTPException(
            status_code=409,
            detail="Unresolved BLOCKER review notes prevent approval",
        )
    record.approved_by_user_id = current_user.id
    record.approved_revision = record.revision
    record.approved_content_hash = record.content_hash
    record.approved_at = _now()
    record.status = "APPROVED"
    record.updated_at = _now()
    db_session.add(record)
    await db_session.commit()
    await db_session.refresh(record)
    logger.info(
        "XPeX editorial transition draft=%s transition=REVIEWED->APPROVED actor=%s",
        record.draft_id,
        current_user.user_uuid,
    )
    return _as_response(record, org)


def _lesson_document(lesson: object) -> dict:
    data = lesson.model_dump()  # type: ignore[attr-defined]
    blocks: list[dict] = []
    for heading, text in (
        ("Objetivo", data["objective"]),
        ("Explicação", data["explanation"]),
        ("Prática", data["practice"]),
        ("Avaliação", data["assessment"]),
    ):
        blocks.append(
            {
                "type": "heading",
                "attrs": {"level": 2},
                "content": [{"type": "text", "text": heading}],
            }
        )
        blocks.append({"type": "paragraph", "content": [{"type": "text", "text": text}]})
    if data.get("resource_suggestions"):
        blocks.append(
            {
                "type": "heading",
                "attrs": {"level": 2},
                "content": [{"type": "text", "text": "Recursos sugeridos"}],
            }
        )
        for item in data["resource_suggestions"]:
            blocks.append(
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": f"• {item}"}],
                }
            )
    return {"type": "doc", "content": blocks}


async def _compensate_failed_publish(
    request: Request,
    record: XPeXEditorialDraft,
    course_uuid: str | None,
    current_user: PublicUser,
    db_session: AsyncSession,
) -> None:
    if course_uuid:
        try:
            await delete_course(request, course_uuid, current_user, db_session)
        except Exception:
            logger.exception("XPeX editorial compensation failed draft=%s", record.draft_id)
    record.native_course_id = None
    record.native_course_uuid = None
    record.native_mapping = None
    record.publication_state = "FAILED"
    record.updated_at = _now()
    db_session.add(record)
    await db_session.commit()


async def publish_editorial_draft(
    request: Request,
    draft_id: str,
    payload: EditorialMutationRequest,
    current_user: PublicUser,
    db_session: AsyncSession,
) -> PublishResult:
    record, org = await _draft_for_actor(draft_id, current_user, db_session, for_update=True)
    if record.status == "PUBLISHED" and record.native_course_id and record.native_course_uuid:
        return PublishResult(
            draft=_as_response(record, org),
            course_id=record.native_course_id,
            course_uuid=record.native_course_uuid,
            canonical_path=f"/orgs/{org.slug}/course/{record.native_course_uuid}",
            idempotent_replay=True,
        )
    if record.revision != payload.expected_revision:
        raise HTTPException(status_code=409, detail="Stale editorial revision")
    if record.status != "APPROVED":
        raise HTTPException(
            status_code=409,
            detail="Explicit approval is required before publication",
        )
    if record.approved_revision != record.revision or record.approved_content_hash != record.content_hash:
        raise HTTPException(status_code=409, detail="Approval evidence is stale")
    if record.publication_state == "PUBLISHING":
        raise HTTPException(status_code=409, detail="Publication is already in progress")

    review = CourseDraftReview.model_validate(record.review_json) if record.review_json else None
    if review_has_blocker(review):
        raise HTTPException(status_code=409, detail="BLOCKER review notes prevent publication")
    draft = CourseDraft.model_validate(record.draft_json)

    record.publication_state = "PUBLISHING"
    record.publication_error = None
    record.updated_at = _now()
    db_session.add(record)
    await db_session.commit()

    course_id: int | None = None
    course_uuid: str | None = None
    activity_uuids: list[str] = []
    mapping: dict = {
        "draft_id": record.draft_id,
        "revision": record.revision,
        "content_hash": record.content_hash,
        "chapters": [],
    }

    try:
        course = await create_course(
            request,
            int(org.id),
            CourseCreate(
                org_id=int(org.id),
                name=draft.title,
                description=draft.description,
                about=draft.final_project,
                learnings="\n".join(draft.learning_outcomes),
                tags="XPeX AI Course Studio",
                public=False,
                published=False,
                open_to_contributors=False,
                extra_metadata={
                    "xpex_editorial_draft_id": record.draft_id,
                    "xpex_editorial_revision": record.revision,
                    "xpex_editorial_hash": record.content_hash,
                },
            ),
            current_user,
            db_session,
        )
        if course.id is None:
            raise RuntimeError("Native course creation returned no id")
        course_id = course.id
        course_uuid = course.course_uuid
        record.native_course_id = course_id
        record.native_course_uuid = course_uuid
        record.native_mapping = {
            **mapping,
            "course_id": course_id,
            "course_uuid": course_uuid,
        }
        db_session.add(record)
        await db_session.commit()

        for module in draft.modules:
            chapter = await create_chapter(
                request,
                ChapterCreate(
                    name=module.title,
                    description=module.outcome,
                    thumbnail_image="",
                    lock_type=LockType.AUTHENTICATED,
                    org_id=int(org.id),
                    course_id=course_id,
                    extra_metadata={"xpex_editorial_draft_id": record.draft_id},
                ),
                current_user,
                db_session,
            )
            chapter_map = {
                "chapter_id": chapter.id,
                "chapter_uuid": chapter.chapter_uuid,
                "activities": [],
            }
            for lesson in module.lessons:
                activity = await create_activity(
                    request,
                    ActivityCreate(
                        chapter_id=chapter.id,
                        name=lesson.title,
                        activity_type=ActivityTypeEnum.TYPE_DYNAMIC,
                        activity_sub_type=ActivitySubTypeEnum.SUBTYPE_DYNAMIC_PAGE,
                        content=_lesson_document(lesson),
                        details={"xpex_ai_objective": lesson.objective},
                        published=False,
                        extra_metadata={"xpex_editorial_draft_id": record.draft_id},
                    ),
                    current_user,
                    db_session,
                )
                activity_uuids.append(activity.activity_uuid)
                chapter_map["activities"].append(
                    {
                        "activity_id": activity.id,
                        "activity_uuid": activity.activity_uuid,
                    }
                )
            mapping["chapters"].append(chapter_map)
            record.native_mapping = {
                **mapping,
                "course_id": course_id,
                "course_uuid": course_uuid,
            }
            db_session.add(record)
            await db_session.commit()

        for activity_uuid in activity_uuids:
            await update_activity(
                request,
                ActivityUpdate(published=True),
                activity_uuid,
                current_user,
                db_session,
            )

        await update_course(
            request,
            CourseUpdate(public=True, published=True),
            course_uuid,
            current_user,
            db_session,
        )

        record.status = "PUBLISHED"
        record.publication_state = "SUCCEEDED"
        record.native_mapping = {
            **mapping,
            "course_id": course_id,
            "course_uuid": course_uuid,
        }
        record.published_at = _now()
        record.updated_at = _now()
        db_session.add(record)
        await db_session.commit()
        await db_session.refresh(record)
        logger.info(
            "XPeX editorial publish success draft=%s actor=%s course=%s",
            record.draft_id,
            current_user.user_uuid,
            course_uuid,
        )
        return PublishResult(
            draft=_as_response(record, org),
            course_id=course_id,
            course_uuid=course_uuid,
            canonical_path=f"/orgs/{org.slug}/course/{course_uuid}",
        )
    except Exception as exc:
        logger.exception("XPeX editorial publish failed draft=%s", record.draft_id)
        record.publication_error = type(exc).__name__
        await _compensate_failed_publish(
            request,
            record,
            course_uuid,
            current_user,
            db_session,
        )
        raise HTTPException(
            status_code=500,
            detail="Native publication failed safely; course was not published",
        ) from None
