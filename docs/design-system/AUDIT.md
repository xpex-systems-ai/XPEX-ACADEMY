# Frontend audit — XPeX Design OS V1

## Route map

- Public/auth: `/`, `/home`, `/auth/login`, signup/reset/callback, and `/redirect_from_auth`.
- XPeX: `/xpex`, role dashboards, courses/learning, activities, trails, AI Lab, notifications, polo students, and admin.
- Tenant platform: `/orgs/[orgslug]/**` learning surfaces and `/orgs/[orgslug]/dash/**` management surfaces.
- Canonical superadmin: `/admin/**` with independent authorization wrappers.

## Authority and tenancy map

Canonical session membership is resolved in `AuthenticatedXpexExperience`; requested roles are checked against resolved membership roles. Polo access is derived from authorized organization membership, and unauthorized roles render denial. Admin and superadmin routes retain their existing server/API gates. No authority code is changed by Design OS V1.

## Visual map and findings

- XPeX already has a scoped root, primitives, responsive authenticated shell, focus styles, reduced-motion handling, and real course data connections.
- Brand values and compatibility aliases were concentrated in minified `xpex.css`; semantic token names were missing.
- Platform-wide UI exists under `components/ui` and domain components under `Dashboard`, `Pages`, and `Objects`; wholesale replacement would duplicate real behavior.
- The safe V1 foundation is a semantic token layer plus an explicit adoption/inventory contract. Page alignment remains incremental and must preserve loaders, API services, and authorization.

## Initial visual-validation matrix

| Surface | Actual route | Gate | V1 status |
| --- | --- | --- | --- |
| Login | `/auth/login` (legacy aliases may redirect) | public | inventory complete; alignment pending |
| Student home | `/xpex/aluno` | session + membership | token-ready |
| Admin | `/xpex/admin` and canonical `/admin` | explicit admin/superadmin | boundary documented |
| Polo | `/xpex/polo` | authorized tenant role | token-ready |
| Course | `/xpex/courses/[courseId]` | enrollment/publication | primitives mapped |
| Course Studio | `/orgs/[orgslug]/course-studio` and dashboard course routes | tenant management role | inventory complete; incremental alignment pending |

No Figma source or approved baseline screenshots exist in the repository, so design-versus-implementation comparison is not claimable in V1. Preview visual QA is required before merge.
