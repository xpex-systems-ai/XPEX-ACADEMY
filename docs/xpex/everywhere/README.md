# XPeX Academy Everywhere — Learning OS

## Goal
Expose the same Academy identity, courses, lessons, enrollment, progress and certificates through Web, ChatGPT and Android. This is an integration architecture, **not** a claim of ChatGPT or Google Play publication.

## First committed endpoint
`GET /api/xpex/everywhere` provides a public, read-only capabilities document, reporting unimplemented channels and backend readiness explicitly. No learner records, API keys, credentials or fabricated courses are returned.

## MVP API contract (proposed, not yet implemented)
| Action | HTTP | Authentication | Result |
| --- | --- | --- | --- |
| Discover catalog | GET /api/xpex/everywhere/courses | public, tenant-scoped | only published courses |
| Course detail | GET /api/xpex/everywhere/courses/:id | public | syllabus and public preview lessons |
| Enrollment | POST /api/xpex/everywhere/enrollments | OAuth + explicit user confirmation | authenticated enrollment, idempotency key |
| My learning | GET /api/xpex/everywhere/me/learning | OAuth + scopes | only authenticated learner's progress |
| My certificates | GET /api/xpex/everywhere/me/certificates | OAuth + scopes | verifiable issued certificates only |

## Architecture and safeguards
1. Academy FastAPI/PostgreSQL remains source of truth. No duplicate student database in ChatGPT or Android.
2. OAuth/OIDC authorization code + PKCE, state, narrow scopes, tenant-aware access checks. No impersonation and no self-assigned manager roles.
3. MCP adapter calls server APIs using delegated tokens; never expose service-role credentials or raw student data to unauthenticated users.
4. App UI may show catalogs and previews, but media playback inside ChatGPT requires supported UI testing. Provide a web player fallback.
5. Never invent course availability, payment completion, certificates or student progress.
6. Review AGPL-3.0 obligations and data-protection requirements before commercial launch.
7. App submission, approval, discovery and Play Store release are separate milestones.

## Release gates
- Academy API and Polo Kelle login operational; PostgreSQL migrations, backup/restore and tenant isolation validated.
- Real catalog response, authenticated learner journey, and E2E tests.
- OAuth threat model, privacy policy, consent and rate limits.
- MCP protocol adapter and ChatGPT UI tested before submission.
- Android packaging, device testing and store compliance before publication.

Current status: discovery endpoint implemented in migration preview branch; remaining actions are planned, not delivered.
