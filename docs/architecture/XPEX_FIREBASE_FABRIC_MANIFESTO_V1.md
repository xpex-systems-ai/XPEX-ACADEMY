# XPeX Academy — Firebase Fabric Manifesto V1

**Mission ID:** `XPEX-FIREBASE-FABRIC-001`  
**Program:** XPeX Academy AI-Native Platform  
**Owner:** Junior Sena  
**Architecture / Audit:** GX / GXEON  
**Primary Executor:** Google Antigravity  
**Canonical Repository:** `xpex-systems-ai/XPEX-ACADEMY`  
**Baseline Branch:** `dev`  
**Status:** ARCHITECTURE LOCKED — EXECUTION READY  
**Date:** 2026-09-24

---

## 0. Executive Declaration

XPeX Academy is no longer to be treated as a collection of isolated pages, experiments, builders, prototypes, or independent AI tools.

From this manifesto forward, the target product is:

> **XPeX Academy = an AI-native learning, creation, project, community and opportunity platform, delivered through one coherent product surface, one identity system, one multi-tenant architecture and one observable production fabric.**

The system must support:

- XPeX Academy Global;
- private educational poles;
- branded partner environments;
- enterprise training environments;
- students, instructors, mentors, operators and admins;
- XARA as the student-facing intelligence layer;
- GXEON as the internal orchestration/core intelligence layer;
- web first, followed by production mobile applications;
- controlled integration with Firebase capabilities where they materially improve security, delivery, telemetry, configuration, messaging, AI, reliability or developer velocity.

Firebase is not a replacement for every existing XPeX service.

Firebase becomes the **experience, edge, observability and mobile application fabric** around the existing XPeX Core.

The rule is:

> **PRESERVE WHAT WORKS. INTEGRATE SAFELY. PROVE EACH LAYER. MIGRATE ONLY WITH EVIDENCE.**

---

# 1. Product Identity

## 1.1 Official product definition

**XPeX Academy** is the canonical global product.

Its student experience is organized around these product modules:

1. Home Hub
2. Course Hub
3. TrailMap
4. Activity Hub
5. XARA AI
6. XPeX Pulse
7. XPeX AI Lab
8. XPeX ToolHub
9. XPeX Project Vault
10. XPeX Vision Studio
11. XPeX SoundLab
12. Community Hub
13. Certificate Hub
14. XPeX Launchpad
15. Profile Hub

These modules must look and behave as one product.

No module may ship as an unrelated microsite inside the student experience.

---

# 2. Intelligence Architecture

## 2.1 Public-facing intelligence

**XARA AI** is the official user-facing intelligence of the XPeX Academy experience.

XARA may:

- explain course content;
- retrieve grounded academic context;
- recommend learning paths;
- help students create projects;
- assist with research;
- guide the use of tools;
- summarize content;
- support project execution;
- recommend next steps;
- assist with portfolio building;
- connect learning progress to opportunities;
- support polo/admin workflows when explicitly authorized.

XARA must never imply capabilities that are not actually enabled.

---

## 2.2 Internal intelligence

**GXEON** is the internal orchestration and intelligence core.

GXEON is responsible for architecture such as:

- provider routing;
- model orchestration;
- RAG;
- tool invocation;
- policy and feature routing;
- project context;
- observability context;
- tenant-aware AI execution;
- future agent workflows.

Public product copy should prefer XARA where the student is interacting with the assistant.

GXEON may remain visible only where technically or strategically appropriate.

---

# 3. Target Platform Architecture

```text
                         XPeX ACADEMY
                              │
                   ┌──────────┴──────────┐
                   │                     │
             PRODUCT EXPERIENCE      CONTROL PLANE
                   │                     │
              Web / Mobile           Super Admin
                   │                     │
                XARA AI             Tenant Admins
                   │
             GXEON CORE
                   │
     ┌─────────────┼─────────────────────┐
     │             │                     │
 FIREBASE FABRIC  XPeX APIs         EXISTING RUNTIME
     │             │                     │
 Hosting          FastAPI             Railway
 Auth Bridge      RAG                 LearnHouse
 App Check        Learning APIs       Current DB
 Analytics        Project APIs        Existing ACL
 Remote Config    Tenant APIs
 Messaging
 Performance
 Crash Reporting
 AI Logic
 Storage*
 App Distribution
```

`*` Storage usage is enabled only when technically justified and plan/billing requirements are understood.

---

# 4. Multi-Tenant Principle

The platform must support multiple branded environments without cloning the whole codebase.

Examples:

- XPeX Academy Global
- Kelle Digital Lab
- Polo Planaltina
- Enterprise Client A
- Enterprise Client B

Canonical concept:

```text
ONE PLATFORM
ONE CODEBASE
ONE ACCOUNT IDENTITY
MANY TENANTS
ISOLATED DATA
CONFIGURABLE BRANDING
CONFIGURABLE MODULES
```

Every tenant-aware object must be designed to carry an explicit tenant/organization context where applicable.

Examples:

- user memberships;
- courses;
- enrollments;
- projects;
- chats;
- files;
- certificates;
- events;
- analytics context;
- AI retrieval scope;
- feature flags.

Tenant isolation is a security invariant, not a visual preference.

---

# 5. Role Model

Target role hierarchy:

```text
SUPER ADMIN
   │
   ├── PLATFORM OPERATOR
   │
   ├── TENANT / POLO ADMIN
   │       ├── PROFESSOR
   │       ├── MENTOR
   │       └── STAFF
   │
   └── STUDENT
```

Super Admin capability includes platform governance, but must not imply unrestricted silent access to private tenant data.

Sensitive actions must be:

- authorized;
- auditable;
- logged;
- least-privilege by default.

---

# 6. Firebase Fabric Scope

The Firebase integration must be incremental.

## 6.1 Foundation capabilities

The first Firebase Fabric release targets:

- Firebase Web SDK integration;
- Analytics;
- App Check;
- Remote Config;
- Performance Monitoring;
- Cloud Messaging foundation;
- safe AI Logic foundation;
- controlled Authentication bridge planning;
- environment separation;
- feature flags;
- event taxonomy;
- tenant-aware telemetry.

---

## 6.2 Firebase capabilities to evaluate and adopt when appropriate

The program may later use, where technically justified:

- Firebase Hosting;
- Authentication;
- App Check;
- Analytics;
- Remote Config;
- Cloud Messaging;
- Performance Monitoring;
- Crashlytics;
- App Distribution;
- AI Logic;
- Genkit;
- Storage;
- Cloud Functions;
- Firestore;
- SQL Connect;
- Cloud Logging integrations;
- BigQuery export/integration;
- enterprise identity features;
- additional Google Cloud services.

Not every Firebase product is mandatory.

Each capability must pass:

1. product fit;
2. security review;
3. billing review;
4. data ownership review;
5. operational review;
6. rollback review.

---

# 7. Non-Destructive Migration Rule

The current XPeX runtime must not be replaced simply because Firebase offers an equivalent feature.

Existing systems remain canonical until a replacement is proven.

Examples:

- current authentication remains authoritative until identity migration is explicitly approved;
- current database remains authoritative until data migration is explicitly approved;
- Railway remains operational until runtime migration is explicitly approved;
- current RAG remains operational until any new retrieval layer demonstrates parity or improvement.

No “big bang migration”.

---

# 8. Design System Rule

All product modules must consume one XPeX design system.

Canonical design principles:

- dark premium;
- `#0B1220` family backgrounds;
- XPeX orange;
- XPeX cyan;
- white typography;
- controlled neon glow;
- accessible contrast;
- responsive layout;
- reusable spacing and typography tokens;
- one sidebar language;
- one header language;
- one card language;
- one loading/error/empty-state language.

The visual reference images define **direction**, not fake functionality.

No visual element may imply a working capability unless the corresponding backend, permissions, state and telemetry exist.

---

# 9. Official Student Shell

Before mass-building modules, create the canonical shell.

The shell must provide:

- global sidebar;
- responsive navigation;
- current tenant context;
- current user context;
- XARA entry point;
- notification surface;
- feature flag resolution;
- consistent breadcrumbs;
- route authorization;
- analytics bootstrap;
- App Check bootstrap;
- error boundary;
- performance hooks;
- loading states;
- mobile navigation.

This shell is the foundation all modules inherit.

---

# 10. Execution Order

The canonical implementation sequence is:

## Phase 0 — Architecture & Safety
- confirm Firebase project;
- confirm environments;
- inventory current runtime;
- establish no-destruction constraints;
- establish secrets policy;
- establish billing safety gates.

## Phase 1 — Firebase Fabric Foundation
- initialize SDK;
- Analytics;
- App Check;
- Remote Config;
- Performance;
- event taxonomy;
- feature flags;
- environment configuration;
- smoke tests.

## Phase 2 — Official Student Shell
- sidebar;
- header;
- tenant context;
- user context;
- responsive shell;
- feature-gated navigation;
- standard states.

## Phase 3 — XARA Foundation
- rename public assistant experience from legacy GXEON-facing copy where appropriate;
- preserve GXEON core internally;
- health semantics;
- RAG integration;
- SSE/streaming;
- context injection;
- safe provider indication;
- observability.

## Phase 4 — Core Learning
1. Course Hub
2. TrailMap
3. Activity Hub

## Phase 5 — Intelligence & Discovery
1. XPeX Pulse
2. XPeX ToolHub
3. XPeX AI Lab

## Phase 6 — Creation
1. XPeX Project Vault
2. XPeX Vision Studio
3. XPeX SoundLab

## Phase 7 — Community & Proof
1. Community Hub
2. Certificate Hub
3. Profile Hub

## Phase 8 — Opportunities
1. XPeX Launchpad
2. portfolio bridge
3. opportunity matching foundation

## Phase 9 — Tenant / Polo Productization
- tenant admin;
- branding;
- module entitlements;
- course assignment;
- reporting;
- Kelle Digital Lab standardization;
- tenant-specific XARA context.

## Phase 10 — Super Admin Control Plane
- tenant creation;
- role management;
- module control;
- catalog control;
- usage analytics;
- AI governance;
- platform health;
- security/audit logs;
- billing/license visibility.

## Phase 11 — Mobile Application
- choose canonical mobile stack;
- shared design tokens;
- authentication;
- tenant selection;
- student home;
- XARA;
- courses;
- Pulse;
- notifications;
- offline/resume strategy where relevant;
- telemetry;
- crash reporting;
- beta distribution.

## Phase 12 — Store Release
- internal testing;
- Firebase App Distribution;
- Android release candidate;
- iOS release candidate;
- privacy disclosures;
- store assets;
- screenshots;
- support URLs;
- terms/privacy URLs;
- Google Play submission;
- Apple App Store submission;
- review remediation;
- production rollout.

Firebase assists with mobile infrastructure and beta distribution.

**Google Play and Apple App Store publication are external release gates and are not completed by Firebase automatically.**

---

# 11. Per-Module Engineering Contract

Every module must be delivered with the same engineering contract.

## Required inputs

1. official reference image;
2. product specification;
3. route;
4. user roles;
5. tenant behavior;
6. data sources;
7. Firebase services used;
8. AI services used;
9. analytics events;
10. security rules;
11. mobile behavior;
12. error/empty/loading states.

## Required outputs

1. isolated feature branch;
2. implementation;
3. tests;
4. screenshots;
5. build evidence;
6. security evidence;
7. data-truth evidence;
8. rollback notes;
9. PR;
10. GX architectural audit.

---

# 12. PR Discipline

Every implementation follows:

```text
PRESERVE
   ↓
AUDIT
   ↓
IMPLEMENT
   ↓
TEST
   ↓
VERIFY
   ↓
PR
   ↓
GX REVIEW
   ↓
CANARY
   ↓
MERGE
```

Rules:

- no direct unreviewed production mutation;
- no giant all-in-one PR;
- one meaningful capability per PR where practical;
- no fake metrics;
- no fake providers;
- no fake “online” states;
- no secret keys in browser bundles;
- no merge when checks are red;
- no merge when tenant isolation is uncertain;
- no merge when rollback is undefined.

---

# 13. Analytics Contract

Create an official XPeX event taxonomy.

Initial event families:

## Identity
- `student_login`
- `tenant_selected`
- `profile_updated`

## Learning
- `course_started`
- `lesson_started`
- `lesson_completed`
- `activity_started`
- `activity_submitted`
- `trail_started`
- `certificate_earned`

## XARA
- `xara_opened`
- `xara_question_sent`
- `xara_response_completed`
- `xara_grounded_response`
- `xara_source_opened`

## Pulse
- `pulse_opened`
- `pulse_search`
- `pulse_content_started`
- `pulse_content_saved`

## Creation
- `project_created`
- `vision_job_started`
- `sound_project_created`
- `vault_asset_saved`

## Opportunity
- `launchpad_opened`
- `opportunity_opened`
- `portfolio_shared`

Event payloads must avoid collecting unnecessary sensitive data.

---

# 14. Remote Config Contract

Remote Config becomes the operational control surface for safe, non-secret runtime flags.

Candidate flags:

```text
xara_enabled
xara_model
xara_rag_enabled
pulse_enabled
toolhub_enabled
project_vault_enabled
vision_studio_enabled
soundlab_enabled
launchpad_enabled
community_enabled
certificates_enabled
maintenance_mode
beta_features
mobile_experiments
```

Secrets must never be stored as frontend-readable Remote Config values.

---

# 15. App Check Contract

App Check is part of the production security baseline.

Target:

- protect Firebase-backed surfaces;
- protect eligible custom backend endpoints;
- enforce only after observability confirms legitimate traffic is not being blocked;
- use development/test tokens only in non-production environments;
- document rollout and rollback.

---

# 16. Authentication Strategy

Do not create a second uncontrolled identity system.

The target is **one user identity with memberships in one or more tenants**.

Transition must be phased:

1. document current LearnHouse identity model;
2. map user IDs and memberships;
3. decide whether Firebase Auth becomes primary, secondary or bridge;
4. prototype;
5. validate password/login migration constraints;
6. validate ACL;
7. validate tenant isolation;
8. only then approve migration.

Until then, existing authentication remains authoritative.

---

# 17. XARA Context Contract

XARA requests must carry only authorized context.

Potential context:

- user ID;
- tenant ID;
- role;
- active course;
- active lesson;
- current project;
- authorized RAG scope;
- feature entitlements.

XARA must not retrieve content from another tenant.

---

# 18. Project Vault Integration

XPeX Project Vault is the canonical future inventory for:

- internal systems;
- templates;
- student projects;
- screenshots;
- code references;
- prompts;
- project versions;
- documentation;
- reusable assets;
- product candidates.

Future creation flows should be able to save outputs into the Vault where appropriate.

---

# 19. Polo / White-Label Model

A tenant may override:

- logo;
- tenant name;
- colors within approved token boundaries;
- banner;
- domain;
- course catalog;
- enabled modules;
- admin users;
- XARA tenant context.

The core navigation and product semantics remain XPeX.

Example:

```text
Kelle Digital Lab
Powered by XPeX Academy
```

White-label must not create a forked codebase per customer.

---

# 20. Enterprise Model

Enterprise tenants may later support:

- internal training;
- private course catalog;
- corporate XARA context;
- private RAG;
- employee progress;
- reporting;
- certificate issuance;
- role-based access;
- enterprise identity integration;
- auditability.

Enterprise data must remain tenant-isolated.

---

# 21. Mobile Product Definition

The target mobile app is not a simple WebView wrapper.

The production app must provide a deliberate mobile experience.

Minimum product surface:

- login;
- tenant selection where needed;
- Home;
- XARA;
- My Courses;
- lesson playback/content;
- TrailMap;
- Activities;
- Pulse;
- notifications;
- profile;
- certificate access;
- deep links.

Later releases may include:

- AI Lab;
- Project Vault;
- ToolHub;
- Community;
- Launchpad;
- creation studios.

---

# 22. Mobile Release Quality Gates

No public store release until:

- authentication is stable;
- crash reporting is integrated;
- privacy policy is published;
- terms are published;
- support contact is valid;
- analytics is verified;
- notification permission UX is correct;
- App Check/security controls are validated;
- deep links are tested;
- session persistence is tested;
- tenant isolation is tested;
- mobile accessibility baseline passes;
- core flows work on physical devices;
- no secrets are embedded in the binary;
- production backend URLs are intentional;
- store metadata is complete.

---

# 23. Environment Model

Minimum environments:

```text
LOCAL
DEV
STAGING
PRODUCTION
```

Firebase projects/environments must be isolated enough to prevent staging tests from polluting production data.

Never assume a project is safe to use merely because its name looks appropriate.

Audit project ID, billing, resources and ownership before mutation.

---

# 24. Billing Safety

Any capability requiring billing must stop at a billing gate unless already explicitly approved.

Every paid-resource activation must report:

- service;
- expected pricing model;
- free tier if applicable;
- quota;
- budget alert;
- rollback;
- owner approval.

No hidden cost escalation.

---

# 25. Secrets Policy

Never expose:

- provider secret API keys;
- service-account private keys;
- database passwords;
- admin tokens;
- webhook signing secrets.

Frontend Firebase configuration values that are designed to be public identifiers must still be paired with security controls such as App Check, Auth, backend authorization and rules.

---

# 26. Data Truth Policy

The UI must not manufacture business data.

Examples prohibited in production:

- fake students;
- fake revenue;
- fake progress;
- fake online status;
- fake AI provider;
- fake project counts;
- fake certificates.

Reference/mock data is allowed only in explicitly isolated development/demo fixtures.

---

# 27. Observability

Every production-grade module should expose enough evidence to answer:

- is it up?
- is it slow?
- is it erroring?
- how many users use it?
- what failed?
- which release introduced the failure?
- which tenant is affected?
- which provider is affected?
- can we roll it back?

Target observability sources may include:

- Firebase Analytics;
- Performance Monitoring;
- Crashlytics;
- application logs;
- backend logs;
- AI gateway telemetry;
- provider usage metrics;
- future BigQuery/warehouse analytics.

---

# 28. Definition of “Live”

A module is not “live” because the page renders.

It is live only when:

1. route works;
2. authorization works;
3. real data works;
4. primary user action works;
5. telemetry works;
6. error state works;
7. mobile layout works;
8. security controls work;
9. staging evidence exists;
10. production deployment is verified.

---

# 29. Definition of “XARA Live”

XARA is “live” only when a real canary proves:

```text
authenticated student
→ real course
→ real lesson
→ open XARA
→ real contextual question
→ authorized context
→ real AI provider
→ streaming response
→ grounded answer where required
→ telemetry/log evidence
→ PASS
```

Configured is not the same as live.

---

# 30. Definition of “Mobile Ready”

Mobile Ready means:

- production build;
- real backend;
- real auth;
- telemetry;
- push notification infrastructure;
- crash monitoring;
- physical-device testing;
- distribution to testers.

It does not mean merely responsive web.

---

# 31. Definition of “Store Ready”

Store Ready means all release requirements are satisfied for the target store.

For Apple and Google this includes external account, policy, review and publishing requirements beyond Firebase.

---

# 32. Release Train

Target release train:

```text
R0  Firebase Fabric Foundation
R1  Official Student Shell
R2  XARA Core Experience
R3  Learning Core
R4  Pulse + ToolHub
R5  AI Lab + Project Vault
R6  Vision + Sound
R7  Community + Certificates + Profile
R8  Launchpad
R9  Tenant / Polo Platform
R10 Super Admin
R11 Mobile Beta
R12 Store Release Candidate
R13 Public Mobile Release
```

This ordering may change only with documented architectural reason.

---

# 33. Antigravity Operating Instructions

For each mission, Antigravity must:

1. sync `dev`;
2. inspect current architecture before editing;
3. create a dedicated feature branch;
4. preserve unrelated systems;
5. implement only approved scope;
6. avoid installing packages without reason and evidence;
7. run targeted tests;
8. run typecheck/lint where relevant;
9. run production build where relevant;
10. capture browser evidence;
11. report changed files;
12. report commit SHA;
13. open Draft PR;
14. stop;
15. wait for GX architecture audit.

Antigravity must not self-declare a feature production-ready based only on successful compilation.

---

# 34. GX Audit Contract

GX review must inspect:

- actual diff;
- architecture;
- security;
- data truth;
- tenant isolation;
- provider truth;
- test coverage;
- error states;
- responsive behavior;
- regressions;
- CI status;
- deploy evidence.

Only after this review may a merge be approved.

---

# 35. First Mission After This Manifesto

The first implementation mission is:

## `XPEX-FIREBASE-FABRIC-FOUNDATION-001`

Objective:

> Integrate the existing XPeX Academy web application with the existing Firebase project in a non-destructive, observable, feature-flagged foundation while preserving current authentication, database, Railway runtime and learning workflows.

Initial target scope:

- repository/environment audit;
- Firebase project audit;
- Firebase client initialization;
- Analytics baseline;
- App Check integration in staged mode;
- Remote Config bootstrap;
- Performance Monitoring bootstrap;
- XPeX event naming contract;
- XPeX feature-flag contract;
- tests;
- staging evidence;
- Draft PR.

Explicitly out of scope for Mission 001:

- authentication migration;
- database migration;
- production data migration;
- Cloud Run migration;
- rewriting RAG;
- shipping every sidebar module;
- creating paid infrastructure without approval;
- App Store/Play production release.

---

# 36. End State

This program is complete when a real student can:

```text
download XPeX Academy
→ install
→ create/sign into account
→ enter authorized tenant/polo
→ see personalized Home
→ open course
→ complete lesson
→ use XARA contextually
→ receive notifications
→ discover content in Pulse
→ build projects
→ save work
→ earn certificates
→ build profile/portfolio
→ discover opportunities
```

while operators can:

```text
monitor
→ configure
→ audit
→ support
→ scale tenants
→ control modules
→ observe health
→ protect data
→ release safely
```

and the platform remains:

- secure;
- observable;
- multi-tenant;
- mobile-ready;
- reversible;
- truthful;
- scalable.

---

# 37. Final Engineering Principle

> **XARA in front. GXEON underneath. Firebase around it. XPeX as the product.**

And:

> **One identity. One platform. Many learning environments.**

---

## Approval State

This manifesto records the intended execution architecture and becomes the reference contract for the XPeX Firebase transformation program.

**Do not treat this document as authorization for paid-resource creation, destructive migration, store submission, production secrets changes, or irreversible infrastructure mutation. Those actions require their own mission gates and explicit approval.**
