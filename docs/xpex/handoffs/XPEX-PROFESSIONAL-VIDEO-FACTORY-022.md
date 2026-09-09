# XPEX-PROFESSIONAL-VIDEO-FACTORY-022 — execution record

## Outcome

`XPEX-PROFESSIONAL-VIDEO-FACTORY-022 = NOT READY — production access is blocked before factory invocation; no job_id exists yet for module-level reporting. Evidence: the execution environment has no authenticated administrative session, no Railway CLI, no GitHub CLI authentication, and its HTTPS proxy rejects the canonical Railway host with HTTP 403. Next safe action: provide an already-authorized administrative session and production network/CLI access, then resume at phase 0 without changing credentials.`

This record deliberately does **not** claim generation, review, approval, attachment,
publication, or player certification. No production mutation was attempted after the
required access checks failed.

## Snapshot

| Field | Observed value |
| --- | --- |
| Snapshot time (UTC) | 2026-09-09 01:31:49 UTC |
| Initial repository SHA | `0c03bf2c02294aea03d300c8487705bc6543b5fc` |
| Working branch | `work` |
| Expected deployment ID | `34a055e6-1b7e-4efe-8964-e5753d9784f0` (handoff value; not independently verified) |
| Production URL | `https://xpex-academy-ai.up.railway.app` |
| Factory endpoint in source | `POST /api/v1/xpex/course-factory/flagship-ai` |
| Factory invocation timestamp | Not available — invocation was not authorized or attempted |
| Draft ID | Not available |
| Course UUID | Not available |
| Course publication status | Not independently queried; no publish mutation attempted |

The source endpoint remains protected by the existing authenticated-user dependency
and organization-admin authorization. The source implementation also keeps the native
course private while video work is incomplete and stops rendered jobs at the explicit
human approval boundary.

## Access checks and blockers

1. `git rev-parse HEAD` returned the certified SHA from the handoff.
2. `curl --max-time 30 https://xpex-academy-ai.up.railway.app/` was rejected by the
   environment's CONNECT proxy with HTTP 403 before reaching the application.
3. Probes of `/api/health`, `/health`, `/api/v1/health`, `/api/openapi.json`, and the
   factory path failed at the same proxy boundary; they are not application HTTP
   results and therefore cannot be used as production health evidence.
4. `railway` is not installed, so deployment ID, status, variables, logs, and exact
   deployed SHA cannot be independently inspected from this environment.
5. `gh auth status` reports no authenticated GitHub host. This does not affect the
   source snapshot but prevents independent remote PR/deployment corroboration.
6. No administrative browser cookie, session token, or production credential is
   available in the environment. In accordance with the mission constraints, none was
   invented, requested through a password reset, replaced, or printed.
7. The handoff expects factory key `XPEX-AI-COURSE-FACTORY-020`, while the certified
   source currently declares `XPEX-AI-COURSE-FACTORY-021`. This must be reconciled by
   the production operator before treating a future response as acceptance evidence;
   no code was changed based solely on the conflicting handoff.

These conditions trigger the declared stop conditions: invoking the factory without
the pre-authorized administrative session would require a credential change or an
authorization bypass, while retrying through a proxy that rejects the host cannot
produce trustworthy application evidence.

## Video evidence inventory

No factory response was received and consequently there are no safely attributable
`draft_id`, job IDs, module mappings, provider results, media assets, review results,
approvals, activity IDs, or player results to report. The required inventory remains:

| Modules | Jobs generated | Jobs regenerated | Jobs failed | Real media validated | Multimodal reviews | Human approvals | Attachments | Player tests |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 11 required / 0 verified | 0 observed | 0 | 0 observed | 0 | 0 | 0 | 0 | 0 |

“0 observed” is not evidence that production contains zero jobs or failures; it means
production state could not be queried. No per-module status is fabricated.

## Safe resume procedure

1. Run the phase-0 checks from an environment that can reach the canonical Railway
   service and inspect deployment `34a055e6-1b7e-4efe-8964-e5753d9784f0`.
2. Supply an existing, authorized organization-admin/superadmin browser session without
   exposing or rotating its secrets.
3. Confirm the organization scope, then invoke the factory exactly once and preserve
   the redacted response and invocation timestamp.
4. Inventory the resulting jobs before any retry. Resume only durable jobs whose state
   and provider error make retry safe; never delete or duplicate them.
5. Validate every real media asset and multimodal result. Stop at
   `AWAITING_HUMAN_APPROVAL` and have an authorized human inspect each preview in Course
   Studio.
6. Attach and publish only individually approved jobs. Keep the course private unless
   all 11 required videos pass every release gate.
7. Run one player test per module and retain network evidence proving no unexpected
   4xx/5xx responses before issuing the exact `CERTIFIED` status.

## Protected areas

No secrets, credentials, users, passwords, e-mail addresses, enrollments,
certificates, payment configuration, Mercado Pago integration, database data,
migrations, legacy courses, jobs, media assets, or production settings were changed.
The professional course was not published and the human approval gate was not
bypassed.
