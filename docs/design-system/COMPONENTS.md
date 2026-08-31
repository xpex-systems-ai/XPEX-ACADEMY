# Component inventory and contracts

`AUTH` and `TENANT` describe consumption constraints, not authorization implemented by the component.

| Component | Path | Used by | Variants / states | Dependencies | Auth | Tenant | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| XpexAppShell | `components/Xpex/XpexAppShell.tsx` | beta previews | demo/authenticated, mobile drawer | Next Link, auth context | optional | no | migrate tokens |
| XpexAuthenticatedShell | `components/Xpex/XpexAuthenticatedShell.tsx` | `/xpex/**` | student/teacher/polo, mobile/desktop | canonical session passed by server | required | required | adopted |
| XpexBadge / StatusBadge | `components/Xpex/XpexPrimitives.tsx` | dashboards, courses | orange/blue | React | no | no | adopted |
| XpexHero / SectionHeader | same | role dashboards | responsive | React | no | no | adopted |
| XpexPanel / FeatureCard | same | dashboards, landing | cyan/orange | Lucide | no | no | adopted |
| XpexCourseCard | same | learning dashboards | featured, progress unavailable | SafeImage, Link | consumer | consumer | adopted |
| XpexProgressBar | same | courses, dashboards | 0–100, labelled | ARIA progressbar | no | no | adopted |
| Empty/Loading/ErrorState | same | async route surfaces | compact, live/alert semantics | Lucide | no | no | adopted |
| AuthLayout | `components/Auth/AuthLayout.tsx` | login/signup/reset | desktop/mobile | auth branding | no | no | existing |
| Button/Input/Dialog/etc. | `components/ui/**` | platform-wide | component-specific | Radix/CVA | consumer | consumer | reuse, audit before migration |
| Course management | `components/Dashboard/Courses/**` | course studio | editor states | API services | required | required | existing; incremental alignment |

## Required state contract

Interactive primitives implement applicable default, hover, focus-visible, active, disabled, loading, error, success, mobile, and dark states. Inapplicable states must not become cosmetic props. Every new primitive needs an accessible name, keyboard behavior, a 44px touch target where applicable, and reduced-motion behavior.

## No duplication rule

Search `components/ui`, `components/Objects`, and `components/Xpex` before creating a primitive. Wrap an existing real component when a XPeX visual adapter is needed; never replace data-connected components with mockups.
