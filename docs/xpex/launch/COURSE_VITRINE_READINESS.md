# XPeX Course Vitrine — readiness evidence

**Mission:** XPEX-VITRINE-001  
**PR:** #94 (`codex/xpex-course-vitrine` → `dev`)  
**Audit date:** 2026-08-26  
**Audited baseline:** `4984c768fbe988e39f2da1642a002bc55151ff73`

## Decision

**BLOCKED** for production release. The implementation and focused contract tests are ready for human review, but this workspace has no Git remote, GitHub authentication, Vercel/Railway credentials, test-user credentials, or usable dependency registry access. Therefore CI, provider state, production data, deployment SHA, and the authenticated end-to-end runtime cannot be truthfully certified here.

## Architecture and authorization

The vitrine is a React Server Component under the authenticated XPeX shell. It calls the existing `getAuthorizedStudentLearning('/xpex/courses')`, which obtains the server session, resolves the student organization and role, requires an access token, and asks the canonical learning-dashboard endpoint for the tenant slug. A failed role, organization, or token check returns the denied state; an absent session redirects to login.

The UI renders only `learning.data.courses`. It does not fetch a public catalog, create an enrollment, infer authorization from browser state, or add placeholder courses. Category pills are explicitly non-interactive visual taxonomy. Course links retain the existing authorized course and activity lookups, native player route, activity renderer, and progress server action.

## Vitrine states

- Loading and backend-error states remain supplied by the `/xpex` route boundary, including retry.
- No-session behavior remains the canonical login redirect.
- Invalid membership/access remains fail-closed through `XpexStudentDenied`.
- Empty enrollment renders an honest empty catalog and no course card.
- Available, in-progress, and complete courses derive labels, counts, progress, image, and CTA from API data.
- `continue_learning` is preferred for the featured course; it is never synthesized.
- Responsive layouts cover single-column mobile, two-column tablet, and three-column desktop cards; focus styling is inherited from the XPeX shell.

## Player and audiovisual

The mission does not replace the LearnHouse player. The existing player continues to authorize the course/activity against the dashboard, fetch protected activity content through the canonical authenticated activity read, and render native video, document, markdown, embed, resource, and dynamic components. Completion remains the existing server action and assignments remain guarded from generic completion.

`GXMotionLesson` remains additive for recognized XPeX module guides. Its contract identifies it honestly as browser-generated/narrated audiovisual, while native `TYPE_VIDEO` remains first-class. No media URL or placeholder video was added.

## Evidence produced

| Check | Result |
|---|---|
| Mandatory local Git audit | Baseline clean on local branch `work`; SHA matched the previously known `dev` SHA. |
| PR/GitHub inspection | **BLOCKED:** `gh` has no authentication and the checkout has no remote. PR #94/known commit could not be retrieved. |
| Focused vitrine/native-player/audiovisual tests | **PASS:** 13 tests, 0 failures. |
| Strict web lint | **BLOCKED / MISSING_DEPENDENCY:** `eslint-plugin-unused-imports` is absent. |
| Frozen dependency install | **BLOCKED / INFRA_FAILURE:** registry returned HTTP 403 for required packages. |
| Web typecheck/build | **BLOCKED / MISSING_DEPENDENCY:** typecheck cannot resolve React/Next packages and `next build` cannot find the Next binary after the registry failure; not reported as pass. |
| Focused API learning tests | **PASS:** 12 tests, 0 failures. |
| Authenticated E2E | **BLOCKED:** no test-user secrets or confirmed runtime were provided. |
| Visual screenshots | **BLOCKED:** runnable web dependencies and authenticated fixture were unavailable. |

## Vercel

Repository governance names `xpex-academy-ai` as canonical and `dev` as its public-production branch, while quarantining duplicate projects. Provider verification is **BLOCKED**: no Vercel CLI/session is present. Deployment ID, deployed SHA, domain health, and runtime behavior remain unverified; no deploy or provider mutation was attempted.

## Railway

Provider verification for `learnhouse-web`, `learnhouse-api`, and `learnhouse-collab` is **BLOCKED**: no Railway CLI/session or canonical service identifiers are available. Deployment IDs, SHAs, logs, health/readiness, and production learning data remain unverified; no variables, secrets, services, or deployments were changed.

## Security and tenant isolation

- Authorization remains server-authoritative and fail-closed.
- The existing organization slug and bearer token are used only in the server-side dashboard request.
- No token, cookie, JWT, API key, credential, enrollment mutation, membership mutation, or client-side role assertion was introduced.
- Course IDs shown in the vitrine originate exclusively in the authorized tenant response; downstream pages re-check them against that response.

## Residual risks and release gate

Before changing the verdict to **PASS**, an authorized operator must: (1) confirm PR #94 diff/mergeability/checks; (2) run frozen install, strict lint, typecheck, build, API tests, and E2E in CI; (3) validate visitor/login/membership/enrollment/non-authorized-course/logout paths; (4) exercise activity completion, refresh persistence, and Continue Learning with a controlled user; (5) capture desktop/mobile visual evidence; and (6) match the approved commit to healthy canonical Vercel and Railway deployments. The historical claim of an 11-activity AI course is deliberately not certified without current production-data evidence.
