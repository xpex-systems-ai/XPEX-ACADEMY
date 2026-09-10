# XPEX-V6-002 — Polo foundation

Base: `dev`, `e6eea2deba79dbde2885f51588a46b4dba4a86ba`.

## Identity contract

The existing `OrganizationConfig.config` JSON stores the contract at
`customization.landing.xpex_polo_branding` for config version 2.0, or
`landing.xpex_polo_branding` for version 1.x. The existing native landing update
preserves a dictionary, so no schema change, migration, duplicate organization,
new API, CMS, or database write is required by this implementation. No real
organization configuration is modified by this mission.

Fields: `organization_name`, `logo`, `teacher_photo`, `primary_color`,
`accent_color`, `background`, `hero_image`, `location`, `coordinator_name`,
`tagline`, `footer_credit`. No additional metadata fields.

Name falls back to the authenticated organization's name; primary color and
footer credit can use existing general configuration. Logo can use the existing
organization media helper. Other missing fields remain absent. Background and
colors accept hex values only; media accepts HTTPS or a local absolute path.
The frontend does not fetch remote media on the server. Organization slug must
match before consuming branding. Text is rendered as React text, never HTML.
The legal LearnHouse/AGPL attribution remains intact.

Kelle is not a resolver condition. Its full approved identity and actual
configuration population belong to V6-003.

## Authorization and containment

Session-derived capabilities determine candidate access. For ordinary managers,
the overview and all administrative section routes also call the existing
`GET /xpex/launch/courses` endpoint before rendering. Its existing
`_authorized_org` resolves the organization and checks the live admin/maintainer
membership with `is_org_admin`. Rejection or unavailability fails closed.
No success is cached. This adds one read to administrative renders.

The student administration page and both server actions repeat the same guard;
the authorized organization is chosen from session membership, never FormData.
Native invite/enrollment endpoints independently authorize each mutation.
Their existing queries constrain course and student membership to the
authorized organization. Enrollment/progress/authentication implementations are
unchanged. Errors sent back through the URL use generic messages rather than
raw backend details.

Teachers retain the reduced overview and their authored-course panel; all
administrative section URLs are denied. A manager role in another organization
does not authorize the teacher organization. Students have no Polo access.
The platform Super Admin route, authority and navigation remain unchanged.

| Surface | Classification | Launch behavior |
| --- | --- | --- |
| Overview metrics and readiness | REAL | Supplied persisted snapshot only; missing data is unavailable |
| Students: invite, courses, enrollment | REAL | Live administrative guard on page and both actions |
| Classes | NATIVE_BRIDGE | Authorized native usergroups route; dashboard summary explicitly unintegrated |
| Courses | NATIVE_BRIDGE | Authorized native course manager |
| Content | NATIVE_BRIDGE | Authorized native library |
| Reports | NATIVE_BRIDGE | Authorized native analytics; actual availability remains the Core's responsibility |
| Settings | NATIVE_BRIDGE | Authorized native organization settings |
| Trails, mentoring, events, certificates, resources | COMING_SOON / REMOVE_FROM_LAUNCH_NAV | Hidden in launch navigation; direct authorized route says “Em breve” |
| Recent operational activity | COMING_SOON | Explicitly unavailable pending a persisted source |

Missing snapshots no longer generate zero-valued metrics. Actual supplied zero
values remain valid. No product fixture, invented image, URL, location, review,
counter or metric was added. All test fixtures are isolated from application
content and external services.

## Verification boundaries and rollback

Focused tests cover policy, tenant boundaries, revocation, organization branding,
server rendering, action reauthorization, navigation, missing/real data, and
Super Admin navigation preservation. Server tests mock all service boundaries
and execute no database, email or provider operation. Runtime production login,
session, logout, enrollment, progress, readiness and native bridges require GX
certification; local mocks do not prove production behavior.

Rollback: revert this mission's single commit through normal review, restoring
the prior experience. There is no database migration or infrastructure change
to undo. No rollback command is executed by the mission.

NO_PRODUCTION_DEPLOY
NO_SUPER_ADMIN_CHANGE
NO_INFRA_CHANGE

## Local verification record

- Focused Polo suites: 43/43 assertions passed (17 policy/branding, 5 operating
  contract, 15 server guards/actions, 6 rendering/navigation).
- Expanded selection: 79/82 passed. Three existing source-text tests expect
  obsolete home routing, Super Admin copy, and sidebar-label capitalization.
  Each failing text assertion was also checked against the certified baseline
  and fails there. Those unrelated expectations and frozen surfaces were not
  changed. The ecosystem test's Polo empty-state expectation was updated to
  the intentional factual copy change.
- Strict ESLint passed for all changed JavaScript/TypeScript files.
- Full `tsc --noEmit --incremental false` reports 28 diagnostics: missing image
  declarations and pre-existing test globals. A TypeScript CompilerHost check
  over the same installed dependencies, substituting the six original TSX
  files from the certified commit and excluding the three new TS files,
  produced the identical sorted diagnostic list: current 28, baseline 28,
  introduced 0. Global typecheck remains FAIL; no unrelated code was repaired.
- Native Bun could not initialize on this Windows host. Tests ran through a
  temporary Vitest 3.2.4 adapter on Node 24: `bun:test` imports mapped to Vitest,
  `mock.module` mapped to `vi.doMock`, and aliases matched the existing tsconfig.
  The committed tests retain the project's Bun format; native Bun execution is
  NOT_VERIFIED. No runner dependency or lockfile change is committed.
- Full build and production runtime checks are NOT_VERIFIED. No build,
  deployment, provider call or database operation was executed.

The commit uses `[skip ci]` because the existing `notify-infra.yaml` dispatches
to infrastructure on same-repository pull requests. This preserves the freeze
without editing workflows. GitHub documents that this skips `push` and
`pull_request` workflows and can leave required checks pending:
[Skipping workflow runs](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs).
GX must separately authorize any subsequent CI/infrastructure activity.
