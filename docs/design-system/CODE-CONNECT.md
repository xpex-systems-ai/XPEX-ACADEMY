# Code Connect map

| Figma component | Code component | Primary properties |
| --- | --- | --- |
| XPeX/Button | existing `components/ui` button (visual adapter pending audit) | variant, size, disabled, loading |
| XPeX/Badge | `XpexBadge` | tone |
| XPeX/Card/Course | `XpexCourseCard` | featured, status, progress |
| XPeX/Progress/Bar | `XpexProgressBar` | value, label |
| XPeX/Feedback/Empty | `XpexEmptyState` | title, description, compact |
| XPeX/Feedback/Loading | `XpexLoadingState` | static live state |
| XPeX/Feedback/Error | `XpexErrorState` | title, description |
| XPeX/Layout/Shell | `XpexAuthenticatedShell` | role, authorized roles, organization |

Bindings are documentation until a Figma file/key and Code Connect tooling are approved. Auth and tenant props are supplied by server-authorized routes and must not be interactive Figma controls.
