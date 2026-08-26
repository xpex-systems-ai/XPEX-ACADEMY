# XPeX Academy — Next Generation Learning Experience

## Implemented

The XPeX Academy remains an experience and product layer over LearnHouse. The authorized learning dashboard supplies enrolled courses, chapters, activities, completion totals and continuation. The protected activity endpoint supplies player content only after the course and activity identifiers have been matched against that dashboard.

The course page now presents published activities grouped by their real LearnHouse chapter, with module and lesson numbering, content type and official completion state. Empty courses render an explicit empty state rather than sample content.

The lesson page composes the existing `VideoActivity`, `DocumentPdfActivity`, `MarkdownActivity`, `EmbedActivity`, `ResourceActivity` and `DynamicCanva` renderers. XPeX owns the responsive frame, brand, lesson context, navigation and progress presentation; LearnHouse continues to own media, activity content and completion.

Completion follows this sequence:

1. Re-authorize the session, organization membership, course and activity on the server.
2. Reject generic completion for assignments and unsupported activity types.
3. Persist through LearnHouse's canonical completion service.
4. Revalidate the dashboard, catalog, course, current lesson and activity views.
5. Refresh the client from the server-authoritative state and retain the real previous/next links.

No course catalog, enrollment, player, authorization or progress store was introduced. Browser state is only immediate interaction feedback and is never used as evidence of authorization or persisted completion.

## Verified

- Static contracts cover native LearnHouse renderers, server authorization, chapter grouping, empty state, accessible progress and completion revalidation.
- Responsive rules collapse lesson metadata and controls on narrow screens; controls retain 44px targets, visible keyboard focus, semantic progress, status announcements and the existing reduced-motion policy.

## Blocked / not tested

- The authenticated end-to-end journey requires a controlled learner account and a reachable deployed LearnHouse API.
- Vercel project classification, production domains, runtime logs and SHA parity require provider access. No Vercel project was created or changed.
- Railway web/API/collab/Postgres/Redis health, readiness, logs and SHA parity require provider access. No Railway architecture was changed.
- Production screenshots require the same authenticated runtime data; fabricating a local catalog or bypassing authorization is intentionally prohibited.

## Risks and rollback

The principal risk is inconsistent chapter naming from existing content; unnamed chapters intentionally fall into “Conteúdo do curso”. Activity ordering remains exactly the authorized dashboard ordering. Completion errors leave the button available and do not claim success.

Rollback is a single revert of this mission commit. Because there are no migrations, new services or persisted XPeX state, rollback does not affect LearnHouse courses, enrollments, media or progress.

## XPEX-LEARNING-002 validation record

**Verdict: BLOCKED.** The local audit began from commit `d761a5820d9bd55d20a9c5f81f64822b1ddac0ef` on the supplied `work` branch. The repository snapshot has no Git remote, and the audited PR commit `c9ca1d6c15ba0964407fe9ef497341640e01037f` is not present locally, so PR #96 head identity cannot be independently reconciled from this workspace.

The unused completion contract was finalized: after LearnHouse confirms persistence, the player now consumes the action's server-authoritative `nextHref`. Failed persistence produces an accessible error and does not claim completion. The keyed player instance also prevents transient completion state from carrying into a different activity.

### Checks

| Gate | Result | Evidence |
| --- | --- | --- |
| Focused web contracts | PASS | 42 passed, 4 production smoke tests skipped because no canonical live URL was supplied |
| Related API tests | PASS | 8 passed for dashboard state integrity and XPeX course launch |
| Complete web suite | FAIL | 154 passed, 4 skipped, 20 failed; ten Golden Path failures require an API at `localhost:9000`, while the remaining failures are pre-existing contracts outside this focused diff |
| Dependency restore | BLOCKED | The package registry returned HTTP 403 for required packages during the app-level frozen install |
| Typecheck | BLOCKED | Dependencies and type declarations such as React/Next/Node could not be restored |
| Lint | BLOCKED | Required ESLint plugins could not be restored; the repository lint script also masks ESLint failure with `|| true`, so its shell exit alone is not accepted as proof |
| Build | BLOCKED | The root build invokes the blocked frozen dependency install before Next.js compilation |
| GitHub CI | BLOCKED | No remote or GitHub credentials are available in the workspace; check status could not be read |
| Railway / Vercel | BLOCKED | No provider CLI credentials or deployment metadata are available; no deploy was attempted |
| Golden Path / tenancy / persistence | BLOCKED | No running API, canonical authenticated runtime, or controlled learner accounts were available |

The deterministic native renderer, authorization, course, module, video-source and production launch contracts pass locally. This does not substitute for deployed video playback, cross-tenant denial, refresh/re-login persistence, or the real student journey.

### Exact unblock action

Restore registry access and provide read access to GitHub PR #96, the canonical Railway/Vercel projects, and two controlled cross-tenant learner accounts. Then run typecheck, strict lint, build and relevant CI at the exact PR head; deploy that same SHA once; verify runtime readiness and execute the authenticated Golden Path before changing the verdict to `READY_FOR_MERGE`.
