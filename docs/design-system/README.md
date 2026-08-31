# XPeX Design OS V1

This directory is the code-first contract for XPeX Academy's shared visual language. V1 is deliberately additive and scoped to `.xpex-root`: it does not change authentication, RBAC, tenancy, database schemas, or server authority.

## Architecture

`Figma variables → xpex-tokens.css → XPeX primitives → real route components`

The canonical token source is `apps/web/components/Xpex/xpex-tokens.css`. Existing aliases in `xpex.css` remain temporarily for backwards compatibility. New XPeX work must use semantic tokens and reuse existing primitives before adding a component.

## Experience hierarchy

- **Student OS:** primary learning action, progress, next step, content, exploration.
- **Polo OS:** tenant-scoped students, teaching, courses, progress, and operations.
- **Admin OS:** explicitly authorized organization administration; superadmin remains a separate canonical authority.
- **Course Studio:** location, editing context, readiness, and publishing status.

## Safety boundaries

UI visibility is never authorization. Route loaders and API services remain authoritative. Design work must not infer a role from an email address, widen a membership, or accept an organization slug without server-side authorization.
