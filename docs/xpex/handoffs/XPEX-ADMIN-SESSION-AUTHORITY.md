# XPEX-ADMIN-SESSION-AUTHORITY

## Mission
Restore the XPeX administrative control plane for a platform superadmin whose authenticated LearnHouse membership may still be an ordinary learner membership.

## Root cause
The legacy `/admin` route names the platform-wide superadmin surface in LearnHouse; it is not the organization-administration route. In OSS, the supported XPeX entry is `/xpex/admin`, which links to organization-scoped LearnHouse management routes. The legacy landing page now redirects to that workspace without removing or weakening authorization on the remaining superadmin routes.

The XPeX web admin surface already recognized `session.user.is_superadmin`, but the native LearnHouse lock/access layer used by Course Studio only recognized organization membership roles. A platform superadmin carrying a learner membership could therefore pass the web-level superadmin check while still receiving `403` from the backend capability probe.

That made the UI appear to be learner-only even though the authenticated identity was a platform administrator.

## Fix
`is_org_admin()` now checks the canonical `User.is_superadmin` flag first. Platform superadmins are therefore authorized for organization-scoped administrative operations, while ordinary global instructor/member roles remain subject to the existing organization-scoped role/capability rules.

## Safety boundary
- No client-side role promotion.
- No email/name bypass.
- No changes to learner authorization.
- No weakening of custom-role checks.
- Global Instructor is still not elevated by `dashboard.action_access` + `courses.action_create` alone.
- The superadmin bypass is backed by the server-side canonical user row.

## Verification added
`apps/api/tests/test_xpex_admin_authority.py` covers:
- platform superadmin access without an organization membership row;
- ordinary user denial without organization membership.

`apps/web/tests/xpex-admin-access.test.mjs` additionally locks down:
- the `/admin` to `/xpex/admin` compatibility redirect;
- session and backend-capability enforcement;
- conditional administrative navigation;
- organization-derived, tenant-scoped management links;
- absence of an email-specific authorization bypass.

## Expected user flow
1. Authenticate normally.
2. Open `/xpex`.
3. Server validates the session.
4. Admin capability probe succeeds for a platform superadmin.
5. `Painel Admin` becomes visible in the XPeX navigation.
6. `/xpex/admin` and `/xpex/control-center` can use the authorized backend operations.
7. Course Studio uses the same canonical authorization and no longer rejects the superadmin merely because their org membership role is learner.

## Deployment gate
Do not declare production PASS from source inspection alone. After CI, validate the deployed login -> `/xpex` -> `Painel Admin` -> `/xpex/admin` -> Course Studio path against the canonical Railway deployment.
