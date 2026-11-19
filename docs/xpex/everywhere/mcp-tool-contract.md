# XPeX Academy Everywhere — MCP Tool Contract (v0.1 draft)

This is a **design contract**, not a deployed MCP server or a published ChatGPT app.

## Public read-only tools
- `academy_get_capabilities`: fetch `GET /api/xpex/everywhere` and display only actual capability statuses.
- `academy_list_published_courses`: future tenant-scoped API. Do not return private or unpublished courses; fail closed if the Academy API is offline.
- `academy_get_course_outline`: future public published-course syllabus only; do not expose private lessons or paid media.

## Authenticated tools (future)
- `academy_get_my_progress`: delegated OAuth token; validate learner identity, audience, scopes and organization on the backend.
- `academy_get_my_certificates`: same checks; issued records only.
- `academy_enroll_me`: state-changing; explicit user confirmation, idempotency key, audit trail and payment/eligibility checks when applicable.

## Security and release gates
1. MCP uses Academy backend as the single source of truth. No mock student accounts or invented course listings in production.
2. OAuth 2.1 authorization-code flow with PKCE, scoped delegated access and protected-resource metadata as required by the target host.
3. Never trust client-supplied tenant IDs or user IDs; enforce membership on the server. No cross-Polo data leakage.
4. Rate limiting, structured audit logs, privacy policy, deletion/export process and incident response.
5. Before listing publicly, test ChatGPT app review requirements and UI behavior, including video player fallback to Academy web.
6. Keep all learner information private by default; return sanitized error messages to MCP clients.

## Current dependency
The Vercel preview of the new capability endpoint is still awaiting a successful deployment. The FastAPI API and Polo Kelle authorization must be validated before implementing authenticated tools.
