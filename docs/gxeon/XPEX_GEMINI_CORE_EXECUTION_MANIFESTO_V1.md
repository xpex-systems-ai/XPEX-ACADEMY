# XPeX Academy — Gemini Core Execution Manifesto V1

**Status:** Official execution protocol  
**Owner:** XPeX Academy / Junior Sena  
**Orchestrator:** GXEON  
**Engineering executor:** Antigravity  
**Source of truth:** GitHub  
**Production:** Railway  
**Primary working branch:** `dev`

---

## 1. Mission

Transform XPeX Academy from a course platform into an **AI-native Education Operating System** without destroying or replacing the working product.

The platform must evolve through small, auditable, reversible pull requests that preserve the current LMS, student experience, polo operations, course infrastructure, storage, permissions, and production reliability.

Core principle:

> **Preserve what works. Integrate without destroying. One capability per PR. Evidence before merge. Production only after tests.**

---

## 2. Product Vision

XPeX Academy becomes an ecosystem where a child, teenager, adult, creator, teacher, polo operator or older learner can enter with a goal and be guided from learning to real-world output.

Target journey:

```
LEARN → CREATE → PUBLISH → MONETIZE → OPPORTUNITIES
```

The user should not need to understand models, APIs, infrastructure or providers. XPeX handles complexity behind the scenes and exposes simple paths, courses, tools, projects and opportunities.

---

## 3. Core Architecture

```
XPEX ACADEMY
│
├── EXPERIENCE LAYER
│   ├── Student
│   ├── Teacher
│   ├── Polo / Admin
│   ├── Creator
│   ├── Community
│   └── AI Lab
│
├── GXEON AI GATEWAY
│   ├── Auth & Permissions
│   ├── Context Injection
│   ├── Prompt Routing
│   ├── Model Routing
│   ├── Tool Routing
│   ├── Usage / Quotas
│   ├── Cost Events
│   └── Audit / Observability
│
├── GEMINI CORE
│   ├── GX Tutor
│   ├── Course Intelligence
│   ├── Media Intelligence
│   ├── Analytics Intelligence
│   ├── Agent Intelligence
│   └── Multimodal Reasoning
│
├── KNOWLEDGE LAYER
│   ├── Courses
│   ├── Modules
│   ├── Lessons
│   ├── PDFs / Docs
│   ├── Assets
│   ├── Videos
│   └── Authorized RAG
│
├── AGENT LAYER
│   ├── Student Agent
│   ├── Tutor Agent
│   ├── Teacher Agent
│   ├── Course Architect
│   ├── Media Producer
│   ├── Asset Agent
│   ├── Polo Agent
│   └── Admin Agent
│
├── MEDIA LAYER
│   ├── Gemini planning / reasoning
│   ├── Cenara Academy Render Engine
│   ├── Image generation
│   ├── Voice / TTS
│   ├── Video / cinematic assets
│   └── Human Review Gate
│
└── DATA LAYER
    ├── Users
    ├── Roles
    ├── Enrollments
    ├── Progress
    ├── AI Usage
    ├── AI Jobs
    ├── AI Generations
    ├── Assets
    └── Audit Trails
```

---

## 4. Official Roles

### Junior Sena
Human operator, product owner and final strategic authority.

### GX / GXEON
System architect and orchestrator. Responsible for mission decomposition, handoffs, architecture validation, PR audit, acceptance criteria and production verification.

### Antigravity
Engineering executor. Responsible for repository audit, implementation, tests, documentation and opening/updating pull requests.

### GitHub
Source of truth for code, architecture history, PRs and execution evidence.

### Railway
Production runtime and post-merge verification environment.

---

## 5. Official Engineering Flow

```
JUNIOR
  ↓
MISSION
  ↓
GX / GXEON
  ↓
STRUCTURED HANDOFF
  ↓
ANTIGRAVITY
  ↓
AUDIT FIRST
  ↓
FEATURE BRANCH
  ↓
IMPLEMENTATION
  ↓
TESTS
  ↓
PULL REQUEST
  ↓
GX AUDIT
  ↓
CORRECTIONS ←→ ANTIGRAVITY
  ↓
ACCEPTANCE GATE
  ↓
MERGE TO DEV
  ↓
RAILWAY DEPLOY
  ↓
SMOKE TEST
  ↓
PRODUCTION EVIDENCE
```

No feature is considered complete because code exists. It is complete only when acceptance evidence exists.

---

## 6. Non-Negotiable Rules

1. Never rebuild XPeX from scratch when the capability can be integrated into the existing architecture.
2. Never push feature code directly to `dev` or production.
3. Every feature must use a dedicated branch and PR.
4. Every PR must have a narrow scope.
5. Every PR must include tests or a written reason why tests are not applicable.
6. Preserve current authentication, roles, tenancy/polo separation and authorization boundaries.
7. AI secrets and provider credentials remain server-side only.
8. No frontend may call privileged AI provider credentials directly.
9. Every AI capability must be auditable.
10. Every AI capability must have explicit failure behavior.
11. Generation does not equal publication.
12. Media must pass review gates before becoming student-facing.
13. External provider availability must not silently break core LMS functionality.
14. Feature flags are preferred for risky or staged capabilities.
15. Schema changes require safe migration and rollback planning.
16. Logs must not leak prompts containing sensitive user data, secrets, credentials or private documents.
17. Cost-bearing AI calls must be measurable.
18. Student-facing AI must respect course/org permissions and authorized context only.
19. Existing flows must have regression protection.
20. A PR is not merged while material correctness, security or UX blockers remain.

---

## 7. Golden Product Flows

### Golden Flow 01 — GX Tutor
```
Student opens lesson
→ clicks "Open GX"
→ XPeX resolves authorized lesson context
→ GXEON AI Gateway
→ Gemini
→ grounded answer
→ AI usage logged
```

### Golden Flow 02 — Course Creation
```
Teacher / Polo
→ define objective
→ Gemini creates structured course draft
→ human review
→ save modules / lessons / activities
→ publish
```

### Golden Flow 03 — Media Factory
```
Lesson
→ pedagogical script
→ storyboard
→ asset search/reuse
→ media generation when needed
→ Cenara composition
→ captions
→ human review
→ approve
→ attach
→ publish
```

### Golden Flow 04 — Intelligent Learning Path
```
User states objective
→ skills/level diagnosis
→ recommended path
→ XPeX courses + authorized external resources
→ progress tracking
→ projects
→ portfolio
```

### Golden Flow 05 — Polo Intelligence
```
Polo data
→ GXEON analysis
→ engagement / risk / progress insights
→ authorized human action
```

---

## 8. Official PR Roadmap

### PR 01 — Gemini Core Foundation
Create the server-side AI foundation: provider abstraction, Gemini adapter, feature flags, usage events, quotas, audit boundaries and health checks.

### PR 02 — GX Tutor Real
Connect the existing GX student experience to the AI Gateway with course/lesson context.

### PR 03 — Knowledge / RAG Foundation
Authorized ingestion, retrieval and grounding for course materials.

### PR 04 — Intelligent Learning Paths
Goal-to-learning-path discovery and recommendation layer.

### PR 05 — Agent Studio Foundation
Standard contracts for agents, tools, permissions, jobs and execution evidence.

### PR 06 — Course Studio + Gemini
Teacher/polo assisted course, lesson, exercise and assessment generation.

### PR 07 — Media Factory V2
Gemini as planner/director + Cenara as render engine + deterministic XPeX visuals + review gate.

### PR 08 — Polo Intelligence
Operational and pedagogical analytics for polo/admin.

### PR 09 — Community Intelligence
Discovery, onboarding, recommendations and community growth flows.

### PR 10 — XPeX AI Lab
Unified creation layer for sites, apps, agents, images, videos, music, ebooks and automations.

---

## 9. Data / Observability Baseline

The AI-native platform should converge on durable entities equivalent to:

- `ai_provider_config`
- `ai_feature_flags`
- `ai_usage`
- `ai_cost_events`
- `ai_generations`
- `ai_jobs`
- `ai_conversations`
- `ai_context_sources`
- `ai_audit_events`

Exact schema must follow existing repository conventions and should not be introduced all at once unless required by a specific PR.

---

## 10. Media Policy

The first video experiment proved the end-to-end LMS media pipeline but also demonstrated that generic text-to-video loops and fallback robotic TTS are not acceptable for official lessons.

Therefore:

- no 5-second generative clip may be looped as an entire official lesson;
- text visible to students must be rendered deterministically when correctness matters;
- official course voice must use an approved voice profile;
- generated visuals must be storyboard-driven;
- Cenara is the preferred composition/render layer;
- human approval remains mandatory before student publication.

---

## 11. External Platforms

External products such as Gemini, Google AI Studio, Flow, GitHub, Railway, Vercel, Canva, Suno, HeyGen and n8n may participate in the ecosystem.

Rules:

- consumer product access is not assumed to equal embeddable API access;
- provider capabilities must be verified before backend integration;
- billing and quotas must be modeled separately from consumer subscriptions;
- XPeX remains the product identity and orchestration layer;
- provider replacement must remain possible behind GXEON boundaries.

---

## 12. Definition of Ready for Every Mission

Before Antigravity edits code, the handoff must define:

- objective;
- current state;
- scope;
- non-goals;
- expected architecture;
- likely files/areas to inspect;
- security constraints;
- data constraints;
- UX requirements;
- acceptance criteria;
- required tests;
- production verification;
- rollback strategy.

---

## 13. Definition of Done for Every PR

A PR is done only when:

- implementation matches the handoff;
- tests pass;
- no secrets are exposed;
- authorization boundaries are preserved;
- failure behavior is safe;
- observability is adequate;
- migrations are safe;
- UX acceptance criteria pass;
- GX audit has no blocking findings;
- deployment succeeds;
- smoke test succeeds;
- evidence is recorded.

---

## 14. Execution Principle

XPeX Academy is not being replaced by Gemini.

**Gemini becomes intelligence infrastructure inside XPeX.**

GXEON remains the orchestration brain.  
XPeX remains the product, experience and identity.  
Antigravity remains the engineering executor.  
GitHub remains the source of truth.  
Humans remain in control of consequential publication and operational decisions.

---

## 15. North Star

> **Do not build AI beside XPeX. Make XPeX AI-native.**

The platform must remain simple for the learner and sophisticated behind the scenes.

**Learn. Create. Publish. Monetize. Build opportunities.**
