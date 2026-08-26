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
