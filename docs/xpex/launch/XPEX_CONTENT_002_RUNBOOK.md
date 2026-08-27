# XPEX-CONTENT-002 — Editorial AI Course Studio

## Purpose

XPeX Course Studio adds a human-gated editorial workflow on top of the native LearnHouse course engine:

`Generate -> Edit -> Review -> Approve -> Publish`

OpenRouter generates a validated `CourseDraft`; Hugging Face performs an independent review. LearnHouse remains the source of truth only after the final explicit Publish action.

## Hard safety boundary

- Generate, Edit, Review and Approve write only `xpex_editorial_draft` staging records.
- They must never create Course, Chapter or Activity rows.
- Approval never implies publication.
- Publish requires a fresh server-side ADMIN/MAINTAINER authorization check.
- Publish requires current revision/hash to match both review and approval evidence.
- A `BLOCKER` review note prevents approval and publication.
- Provider keys remain server-side (`OPENROUTER_API_KEY`, `HF_TOKEN`).
- The publisher never writes enrollment, learner progress, completion or certification state.

## Persistence and concurrency

Each editorial draft has a stable `draft_id`, organization scope, monotonically increasing revision and SHA-256 content hash. Content-bearing edits increment the revision and invalidate prior review/approval evidence. Mutating operations lock the draft row and reject stale `expected_revision` values.

The native LearnHouse create services commit independently. Publication therefore deliberately keeps the native Course `public=false` and `published=false` while its Chapter/Activity tree is assembled. On assembly failure, the publisher compensates by deleting only the newly created native course tree. It never targets unrelated/pre-existing courses.

A successfully published draft stores authoritative native IDs and returns an idempotent replay response if Publish is retried for the already-published revision.

## API

All endpoints are under `/api/v1/xpex/course-studio` and require authenticated native LearnHouse user context plus organization ADMIN/MAINTAINER access.

- `POST /drafts` — generate server-side DRAFT with OpenRouter.
- `GET /drafts?organization_slug=...` — list organization-scoped editorial drafts.
- `GET /drafts/{draft_id}` — retrieve one authorized draft.
- `PUT /drafts/{draft_id}` — edit with `expected_revision`; meaningful edits invalidate review/approval.
- `POST /drafts/{draft_id}/review` — independent Hugging Face review for exact revision/hash.
- `POST /drafts/{draft_id}/approve` — explicit human approval; rejects blockers/stale review.
- `POST /drafts/{draft_id}/publish` — explicit second human action; creates native LearnHouse tree and finalizes publication.

## UI

Authenticated organization staff can open `/orgs/{orgslug}/course-studio`. The UI exposes generation inputs, durable draft history, title/description editing, revision/hash visibility, review notes with severity, approval gating and a separate Publish action. After success it links to the authoritative native LearnHouse course.

## Deployment

Migration `s6t7u8v9w0x1_xpex_editorial_drafts.py` creates `xpex_editorial_draft`. Run the repository migration dry-run before merge. Production deployment must use the normal `dev` Railway pipeline only after core API/Web CI is green and PR review gates are resolved.

## Production smoke

Use one clearly named one-module test artifact. Verify, in order:

1. Generate with OpenRouter -> state DRAFT; zero native course created by generation.
2. Review with Hugging Face -> state REVIEWED; zero native course created by review.
3. Make a meaningful edit and prove review/approval are invalidated; review again.
4. Approve explicitly as authorized human -> APPROVED; still zero native course created by approval.
5. Publish explicitly -> exactly one native Course plus expected Chapter/Activity tree; Course becomes public/published only after assembly.
6. Retry Publish for the same published revision -> same native IDs, no duplicate course.
7. Verify enrollment/progress/completion/certification state is unchanged.
8. Capture only sanitized provider/model/status evidence. Never print token values or Authorization headers.
9. Remove the smoke artifact through the authorized native delete path unless it is intentionally retained as a clearly identified fixture.

## Rollback

Before merge: revert the feature branch/PR. After deploy: roll back application revision normally. If the migration must be reversed, first ensure there are no editorial records requiring retention, then downgrade the Alembic revision. Native courses already explicitly published are LearnHouse source-of-truth records and must not be silently removed by an application rollback.
