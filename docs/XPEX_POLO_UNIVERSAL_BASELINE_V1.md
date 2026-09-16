# XPeX Polo Universal Baseline V1

Status: FROZEN REFERENCE BASELINE

Baseline source commit: `47553c803d2dcb1bb468ff0886cc78f4fa6df0b0`

## Purpose

This document freezes the validated Kelle Digital Lab Polo implementation as the first reference baseline for the reusable XPeX Polo architecture.

"Universal" here means reusable architecture and operating contract. It does **not** mean copying Kelle-specific branding to every deployment and it does **not** imply absolute security.

The reusable architecture is:

`XPeX Core -> Organization/Polo -> Branding -> Admin Operations -> Courses -> Students -> Content -> Reports`

A new Polo should reuse the architecture, authorization boundaries and operating flows while replacing tenant-specific identity such as name, logo, colors, copy and media.

## Frozen enterprise contract

The following behaviors are part of the baseline and should not be casually changed by cosmetic work:

- Polo and student/admin surfaces remain role-aware.
- Student passwords are never created or changed by the Polo student operations console.
- Student onboarding follows secure account ownership by the student.
- Group membership is an authorization/access concept and does not replace academic enrollment.
- Academic enrollment is the source of truth for the learner journey and "Meus Cursos".
- Course/catalog states must remain truthful. Do not fabricate metrics, enrollments, progress, availability or analytics.
- Kelle Digital Lab is tenant branding; XPeX remains the underlying platform technology.
- Empty, loading, unavailable and permission-denied states must be explicit instead of silently failing.
- Core navigation must not expose dead links. Capabilities not yet ready should render an honest unavailable/preparation state.

## Validated production flow

The reference implementation has been manually validated in production for the following chain:

1. Polo login/session
2. Student invitation and account creation
3. Student authentication
4. Student appears in organization context
5. Professor/admin performs academic enrollment from the Student Operations Console
6. Enrolled course appears in the learner dashboard
7. Course opens in the student area
8. Lesson opens
9. Uploaded video streams through the lesson player

This chain is the minimum regression contract for future Polo templates.

## Reference routes

Operational Polo:

- `/xpex/polo`
- `/xpex/polo/alunos`
- `/xpex/polo/turmas`
- `/xpex/polo/cursos`
- `/xpex/polo/conteudos`
- `/xpex/polo/relatorios`
- `/xpex/polo/configuracoes`

Student foundation:

- `/xpex/aluno`
- `/xpex/courses`
- `/xpex/activities`
- `/xpex/trails`
- `/xpex/ai-lab`
- `/xpex/community`
- `/xpex/certificates`
- `/xpex/notifications`

## Production evidence captured before freeze

The observed production run showed:

- core Polo routes returning successful responses;
- student dashboard/session/profile routes returning successful responses;
- course and lesson navigation working;
- uploaded video returning HTTP `206 Partial Content`, consistent with streaming/range requests;
- organization usage endpoint returning `200` during the validated navigation;
- no observed HTTP `5xx` in the audited navigation interval.

Known residuals are intentionally **not** promoted into the universal contract. They belong to follow-up hardening work, including stale/missing media assets, auxiliary route cleanup, contextual authorization responses, session-expiry polish and remaining tenant-branding cleanup.

## Security statement

This baseline is considered stabilized under the current evidence and tested authorization flows. It must never be described as "unhackable", "100% secure" or "security total".

Enterprise hardening means layered controls, least privilege, secure session handling, authorization checks, auditability, dependency hygiene, monitoring, backups, incident readiness and recurring security review.

## Change control

Any future change to the frozen Polo baseline must satisfy all of the following:

1. Scoped pull request with a clear reason.
2. No unrelated redesign or architecture drift.
3. Existing authorization and enrollment semantics preserved unless the PR explicitly changes and tests that contract.
4. CI green on the exact PR head.
5. Production smoke validation after deployment for changed critical routes.
6. No regressions in invitation, enrollment, course visibility or lesson access.
7. Tenant-specific branding must not leak into the reusable core contract.

## Next program phase

After this baseline freeze, the primary product focus moves to **XPeX Student Enterprise**:

- refine AI Lab;
- refine professional Trails;
- harden Community navigation;
- refine Activities and Certificates;
- remove dead student links and stale branding;
- preserve the same truthful-state and role-aware principles used in the Polo.

Content expansion and monetization should begin through controlled pilot courses only after the specific offered course has validated enrollment, access, lesson rendering and support readiness.
