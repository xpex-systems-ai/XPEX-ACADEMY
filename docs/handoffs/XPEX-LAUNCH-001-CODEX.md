# XPEX-LAUNCH-001 — CODEX HANDOFF

## Mission
Turn the current XPeX Academy into a production-ready learning experience where real students can log in, find the first official course, study, practice, use GX, progress, and complete a real learning journey.

Primary launch course:

**Inteligência Artificial — do Básico ao Avançado**

This is not a mock/demo mission. The final golden path must be real and evidence-backed:

`LOGIN -> DASHBOARD -> COURSE -> ENROLLMENT -> LESSON -> PRACTICE -> PROGRESS -> GX -> ACTIVITIES -> COMMUNITY -> COMPLETION -> CERTIFICATE`

Valid verdicts: `PASS`, `FAIL`, `BLOCKED`. Never claim PASS without runtime evidence.

---

## Starting state already validated

`dev` already includes:

- authenticated XPeX shell;
- real-data learner dashboard and honest empty states;
- native learner routes:
  - `/xpex/aluno`
  - `/xpex/courses`
  - `/xpex/activities`
  - `/xpex/ai-lab`
  - `/xpex/community`
  - `/xpex/certificates`
  - `/xpex/search`
  - `/xpex/notifications`
- study routes:
  - `/xpex/courses/[courseId]`
  - `/xpex/courses/[courseId]/learn`
  - `/xpex/courses/[courseId]/learn/[activityId]`
- GX AI Lab reusing the existing Copilot/RAG stack;
- exact learner targeting by UUID for guarded enrollment operations;
- Railway production successfully deploying from `dev`.

Critical production fact: the latest guarded bootstrap resolved the exact student successfully but returned `PUBLISHED_COURSES count=0`. The zero-course dashboard is therefore honest. The next missing business object is the first published course.

---

# Required delivery

## 1. Create the first real course

Create/publish in the real LearnHouse/XPeX domain model:

**Inteligência Artificial — do Básico ao Avançado**

Suggested canonical slug: `ia-do-basico-ao-avancado`.

Do not hardcode a fake frontend card. The course must be persisted in the backend/database and visible through the official course authorization model.

Use an idempotent and auditable method: official API, guarded script, seed, or data migration. Avoid duplicate creation across deploys.

## 2. Course structure

Create a launch-ready real curriculum with at least these modules:

1. Fundamentos de Inteligência Artificial
2. Como funcionam LLMs e IA generativa
3. Prompt Engineering
4. Ferramentas de IA para produtividade
5. Automação com IA
6. APIs e integrações
7. RAG e conhecimento privado
8. Agentes de IA
9. Construção de projetos reais
10. IA aplicada a negócios e carreira
11. Projeto final

For launch, rich text lessons, exercises, mini-projects, links, and practical activities are acceptable. It is not necessary to manufacture dozens of hours of video. What matters is a real scalable learning structure and a functioning learner journey.

Each module must have real persisted lessons/activities, not static presentation-only UI.

## 3. Enrollment / access

Make the pilot learner able to access the course using the existing authorization model.

If explicit enrollment is required, use the guarded enrollment mechanism and exact UUID targeting. If organization/course access already grants the course naturally, use that canonical path instead.

Do not weaken ACLs, bypass authorization, or create a parallel access system.

## 4. Learner dashboard

After course publication/access, `/xpex/aluno` must show backend-derived values for:

- enrolled courses;
- active courses;
- completed lessons;
- available lessons;
- progress;
- `continue_learning`;
- current course;
- next actions.

No fictional numbers.

## 5. My Courses

`/xpex/courses` must show only authorized courses with real:

- title;
- short description;
- progress;
- state;
- CTA (`Começar`, `Continuar`, `Revisar`, etc.);
- working XPeX destination.

No learner-facing link should fall back to broken `/beta`, old LearnHouse admin areas, or 404 when an XPeX equivalent exists.

## 6. Course and lesson player

The course/study routes must provide a usable learning experience:

- course title;
- current module/lesson;
- lesson content;
- previous/next navigation;
- real progress;
- completion/progress action using the existing backend domain logic;
- return to course/dashboard;
- mobile responsiveness;
- loading/error/empty states;
- basic keyboard/semantic accessibility.

Do not duplicate backend business rules in the frontend if existing services already own them.

## 7. GX AI Lab

`/xpex/ai-lab` must be functional and use the existing Copilot/RAG architecture.

Learner use cases should include:

- explain a lesson;
- summarize content;
- create examples;
- generate practice questions;
- review answers;
- build a study plan;
- assist with projects.

When safe and architecturally appropriate, pass current course/lesson context to GX while preserving user isolation and authorization.

Never expose secrets or another user's private data.

## 8. Activities / practice

`/xpex/activities` must derive from real learner/course state.

The first course must contain enough practice to prove at least:

- short exercise;
- practical task;
- mini project;
- final project.

Reuse existing LearnHouse activity/assignment primitives where available.

## 9. Community

`/xpex/community` must resolve a real community or a functional honest empty state.

If the current backend naturally supports a course community, create/configure one for this course. The learner must at minimum be able to open the experience without 404/500.

Preserve existing permissions for reading/posting/moderation.

## 10. Search

`/xpex/search` must search useful authorized Academy content, prioritizing courses, lessons, and activities. Results should point to functional XPeX destinations.

## 11. Certificates

`/xpex/certificates` must remain honest.

Before completion: correct empty/not-earned state.

After real completion, if the backend already supports certificates, expose them according to the canonical rules.

Do not create a fake visual certificate detached from real completion data.

## 12. Notifications

`/xpex/notifications` may remain an honest empty state if no real notification backend exists yet, but it must not break or invent alerts/counts.

## 13. Navigation audit

Verify every learner-facing destination from sidebar/topbar:

- Início
- Meus Cursos
- Atividades
- Laboratório de IA
- Comunidade
- Certificados
- Busca
- Notificações
- logout/profile flows where applicable

Every clickable destination must:

1. exist;
2. preserve authentication;
3. respect authorization;
4. render coherent XPeX UX;
5. avoid 404.

Unavailable features should be disabled/honest rather than broken links.

## 14. Security and session behavior

Validate:

- anonymous user;
- valid learner;
- authorized course;
- unauthorized course;
- unauthorized activity;
- cross-user isolation;
- logout;
- expired session.

Do not relax ACLs to make the flow pass.

## 15. Runtime configuration / Railway

Investigate and resolve the recent build-time message:

`Invalid NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL: missing`

Determine whether it is harmless build-time SSR behavior or an actual runtime configuration defect. Fix it appropriately without hardcoding an unsafe production URL.

Do not reveal secret values in logs, commits, or PR text.

## 16. Tests and gates

Add/update regression coverage proving:

- all learner routes exist;
- sidebar does not point to missing routes;
- published course appears to authorized learner;
- unauthorized course does not appear;
- dashboard metrics are real-data derived;
- `continue_learning` works;
- valid course/lesson player opens;
- invalid IDs fail safely;
- progress persists;
- certificates are not fabricated;
- empty states remain truthful;
- GX AI Lab resolves without 404.

Run all applicable repository gates, including:

- Web Lint
- API Lint
- API Tests
- staging build
- staging preflight
- targeted tests added by this mission

Do not disable gates or downgrade failures just to get green.

## 17. Visual/runtime proof

Validate desktop and mobile.

Provide evidence for at least:

1. learner dashboard showing the real course;
2. My Courses;
3. course page;
4. lesson/player;
5. Activities;
6. GX AI Lab;
7. Community;
8. Certificates correct state.

Inspect browser console, hydration, unexpected 4xx/5xx, redirect loops, broken assets, overflow/layout, and keyboard/focus basics.

## 18. Do not do

- No mocks presented as production truth.
- No fake progress/certificate/enrollment.
- No permanent hardcoded course UUID in UI.
- No ACL bypass.
- No disabled lint/tests to force green.
- No masking 404/500 with fake UI.
- No second learning platform parallel to LearnHouse when the core already exists.
- Preserve AGPL/source attribution already present.
- No destructive production data operations without a controlled, reversible plan.

## 19. Architecture principle

Keep the product direction:

`XPeX UX Layer -> LearnHouse Domain/Core -> PostgreSQL/Redis -> GX/Copilot/RAG`

XPeX is the premium experience layer. LearnHouse remains the learning/domain engine where it already provides the needed primitives.

## 20. Engineering workflow

Create a dedicated implementation branch from the latest `dev`, preferably:

`feat/xpex-launch-first-ai-course`

Do not implement directly on this handoff branch unless there is a clear reason.

Open a PR to `dev` containing:

- architecture summary;
- data creation/seed approach;
- routes validated;
- enrollment/progress proof;
- test/CI results;
- visual evidence;
- remaining risks;
- rollback plan for any production data mutation.

## 21. PASS criteria

Only declare `PASS` when a real learner can prove the complete loop:

1. authenticate;
2. open `/xpex/aluno`;
3. find **Inteligência Artificial — do Básico ao Avançado**;
4. start/continue it;
5. open at least one lesson;
6. complete/progress at least one activity;
7. return to dashboard and see persisted state update;
8. open GX AI Lab;
9. open Activities;
10. open Community;
11. open Certificates with correct state;
12. navigate the sidebar without 404;
13. refresh/relogin without losing persisted progress.

Additionally:

- relevant build/lint/tests green;
- no critical browser/runtime errors;
- no fictional metrics;
- no weakened authorization;
- staging/production healthy.

If an external permission, credential, secret, or unavailable service prevents completion, return `BLOCKED` with concrete evidence and the smallest exact human intervention required.

---

# Codex final report format

Return:

- `VERDICT: PASS | FAIL | BLOCKED`
- branch
- commit(s)
- PR
- files changed
- database/data operations performed
- exact test/gate results
- runtime URLs/environment validated
- screenshots/evidence
- remaining risks
- rollback instructions

Never report success from code inspection alone. This mission ends only with proof of a real student learning flow.