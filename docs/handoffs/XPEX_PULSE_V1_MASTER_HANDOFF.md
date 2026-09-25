# XPeX Pulse V1 — Master Execution Handoff

**MISSION_ID:** `XPEX-PULSE-V1-001`  
**PROGRAM:** XPeX Academy — Student Intelligence & Media Hub  
**REPOSITORY:** `xpex-systems-ai/XPEX-ACADEMY`  
**BASE_BRANCH:** `dev`  
**EXECUTION_BRANCH:** `feat/xpex-pulse-v1`  
**BASELINE:** `a633fff12c49c6e9ccaa2ad2a246552f41f31e38`  
**EXECUTOR:** Google Antigravity  
**ARCHITECT / AUDITOR:** GX / GXEON  
**OWNER:** Junior Sena  
**REFERENCE:** User-approved XPeX Pulse concept artwork supplied in current conversation  
**MODE:** PRODUCT BLOCK IMPLEMENTATION  
**DO_NOT_MERGE:** true

---

## 1. Product Definition

XPeX Pulse is the student-facing intelligence and media hub inside XPeX Academy.

It is not a generic news reader.

It must organize high-value learning signals around AI, technology, digital markets, Web3/crypto where appropriate, creator/developer ecosystems, emerging tools, productivity, and practical opportunities.

The product promise is:

> Learn. Discover. Track what is changing. Turn information into action.

Primary visual/product blocks from the approved concept:
- Curated Videos
- Real-Time News
- Market Trends
- Emerging Technologies
- XPeX Radar
- Learn with XARA
- Intelligent Search
- Integrated Player
- Curated Channels
- Personalized Trails

The concept image is a visual direction, not proof of implemented data, providers, live news, recommendations, or real-time capability.

---

## 2. Official Student Journey

```
Student
  ↓
XPeX Pulse Home
  ↓
Discover signal
  ↓
Open video / article / trend / technology
  ↓
Consume inside integrated experience where legally/technically supported
  ↓
Ask XARA about the content
  ↓
Save / follow / add to trail
  ↓
Continue in Course Hub / TrailMap / Project Vault / ToolHub
```

Pulse must connect discovery to learning, not become an isolated content feed.

---

## 3. Scope for V1

Implement the first production-ready Pulse block with:

1. Pulse Home route and shell
2. Curated Videos section
3. News / Updates section
4. Market Trends section
5. Emerging Technologies section
6. XPeX Radar section
7. XARA contextual action
8. Search foundation
9. Save/bookmark foundation if existing backend support is available
10. Feature-flag integration with `pulse_enabled`
11. Firebase Analytics events
12. Loading / empty / error / offline-safe states
13. Responsive behavior
14. Tenant-aware rendering
15. Truthful provider/status semantics

Do NOT build a massive crawler or autonomous scraping network in V1.

---

## 4. Architecture Rules

Canonical stack:

- GitHub = source + CI
- Firebase = frontend fabric / analytics / App Check / Remote Config / performance
- Railway = backend runtime / FastAPI / GXEON / RAG / learning APIs

Vercel is legacy and must not be reintroduced as a dependency.

Preserve existing auth and database authority.

Pulse should consume data through safe server-side APIs or approved provider adapters.

Do not place private provider API keys in the browser.

---

## 5. Data Strategy

Before adding any external provider, inspect existing repository services and APIs.

Preferred V1 data order:

1. Existing XPeX-curated/static editorial records already in repository/backend
2. Existing internal APIs
3. Public/approved feeds or APIs with documented terms
4. YouTube embeds/API only where allowed and configured
5. News/RSS/API only if terms permit and server-side normalization is implemented

Never claim:
- real-time news when data is cached/static;
- AI recommendations when only sorted lists are shown;
- market trend analysis when only raw links exist;
- live provider status without liveness verification.

Use truthful labels such as:
- Curated
- Updated
- Available
- Cached
- Unavailable
- Coming soon

---

## 6. Proposed Pulse Domain Model

Prefer an adapter layer rather than coupling UI to providers.

Canonical item model:

```
PulseItem
  id
  type
  title
  summary
  sourceName
  sourceUrl
  thumbnailUrl
  publishedAt
  tags[]
  category
  tenantId?
  language
  durationSeconds?
  author?
  channel?
  trustLevel?
  isCurated
  isFeatured
  createdAt
  updatedAt
```

Types:
- video
- news
- trend
- technology
- radar
- learning-resource

Do not invent provider fields that are not available.

---

## 7. Route

Prefer existing routing conventions.

Target conceptual route:

`/xpex/pulse`

If route already exists, audit it first and preserve compatible work.

Do not create parallel duplicate Pulse routes.

---

## 8. UI Structure

Match the XPeX Academy dark premium visual system.

Recommended structure:

### Header
- XPeX Pulse identity
- short value proposition
- intelligent search
- optional category chips

### Hero / Featured Intelligence
- one featured item
- source
- category
- timestamp/update metadata
- CTA
- XARA contextual action

### Section A — Curated Videos
Cards with:
- thumbnail
- title
- channel/source
- duration if available
- topic
- open/play action

### Section B — News / Updates
Cards/list with:
- headline
- source
- published time
- summary
- external/open action

### Section C — Market Trends
Trend cards with:
- topic
- evidence/source count if real
- summary
- linked sources
- never fabricate numeric momentum

### Section D — Emerging Technologies
Technology cards with:
- name
- short explanation
- category
- learn-more action
- related XPeX resources when available

### Section E — XPeX Radar
A curated/high-signal section focused on:
- what is gaining relevance
- why it matters
- source attribution
- related learning route

### XARA Integration
Each item can expose:
- “Perguntar à XARA”
- “Explique isso”
- “Como isso se conecta aos meus estudos?”

No fake personalized answer if context is unavailable.

---

## 9. Integrated Player

For V1:

- support safe embedding only for providers that permit it;
- YouTube should use official embed behavior;
- do not bypass ads, player controls, age gates, regional restrictions, or provider terms;
- unsupported sources should open externally;
- no downloading/rehosting third-party media without rights.

Player states:
- loading
- ready
- unavailable
- external-only
- blocked-by-provider

---

## 10. XARA Context Bridge

Pulse must not call raw provider models directly from UI.

Target:

```
Pulse Item
  ↓
XARA action
  ↓
GXEON AI Gateway
  ↓
authorized item context
  ↓
RAG / model routing
  ↓
response
```

Context passed should contain only:
- item ID
- title
- summary
- source metadata
- authorized extracted context if available
- tenant/user role as required by backend

Do not pass secrets or full copyrighted article bodies unless licensed/authorized.

---

## 11. Search

V1 search can be local/server-filtered if no search service exists.

Must search safely across available Pulse items.

Search dimensions:
- title
- category
- tags
- source
- technology/topic

Do not claim semantic/AI search unless an actual semantic backend exists.

---

## 12. Personalization

V1 may use deterministic personalization based on:
- current course/trail
- selected interests
- saved topics
- tenant
- role

Only if these signals exist in current data.

If not:
show curated recommendations and label them as curated, not personalized.

---

## 13. Firebase Fabric Integration

Consume the Firebase foundation merged by PR #248.

Feature flag:
- `pulse_enabled`

Initial analytics events:
- `pulse_opened`
- `pulse_search`
- `pulse_content_started`
- `pulse_content_saved`

Add only real events where the user actually performs the action.

Do not send:
- email
- full name
- private course content
- query text if it may contain sensitive information unless explicitly approved

Performance:
- add at most one meaningful Pulse trace if justified.

---

## 14. Tenant Awareness

Pulse must respect current tenant/org context.

Potential future differences:
- tenant-specific featured content
- tenant-specific curated channels
- tenant-specific learning resources
- tenant-specific XARA grounding

V1 may fall back to global content if tenant-specific content is unavailable.

Never cross tenant-private content.

---

## 15. States

Every main module must support:

- loading
- populated
- empty
- error
- unavailable provider

No fake cards in production.

Demo/mock content is allowed only when explicitly marked development/demo fixture and excluded from production truth metrics.

---

## 16. Mobile / Responsive

Verify at:
- 360px
- 390px
- 768px
- 1440px

Requirements:
- no horizontal overflow
- cards remain readable
- player responsive
- search usable
- navigation touch-friendly
- XARA action reachable
- source attribution visible

---

## 17. Accessibility

Minimum:
- semantic headings
- keyboard navigation
- focus states
- alt text
- aria labels where needed
- sufficient contrast
- no essential information encoded by color alone

---

## 18. Security

Do not expose:
- provider secrets
- service account credentials
- admin tokens
- Railway secrets
- database URLs with credentials

External URLs:
- validate protocols
- avoid unsafe javascript/data navigation
- use safe rel attributes where required

All tenant/private content authorization remains server-side.

---

## 19. Implementation Sequence

Execute in this order:

1. Sync `dev`
2. Checkout `feat/xpex-pulse-v1`
3. Audit existing Pulse/search/media/news/tooling code
4. Audit current student shell/sidebar route contract
5. Define typed Pulse domain model
6. Build provider-neutral data adapter
7. Build Pulse Home
8. Add Curated Videos
9. Add News / Updates
10. Add Trends
11. Add Emerging Technologies
12. Add XPeX Radar
13. Add XARA contextual action
14. Add search
15. Connect Firebase feature flag + events
16. Add states
17. Responsive/accessibility pass
18. Tests
19. Production build
20. Browser evidence
21. Push
22. Draft PR
23. STOP

---

## 20. Tests Required

At minimum:

- Pulse route contract
- feature flag behavior
- no production mock content
- source attribution
- safe external URL handling
- XARA action uses GXEON gateway contract
- no client provider secrets
- tenant context preservation
- loading/empty/error states
- responsive structural contract if repo uses such tests
- existing navigation tests
- existing GXEON tests
- Firebase Fabric contract tests

Run:
- targeted Node contract tests
- TypeScript
- ESLint touched files
- production build

---

## 21. Definition of Done

Mission passes only if:

- Pulse route exists and is reachable from official student navigation when enabled
- no existing student flow regresses
- feature flag works
- at least one real/approved content source path works OR truthful empty/curated state is used
- video/news/trend/technology/radar modules render truthfully
- XARA contextual handoff works without provider secrets
- analytics events are wired
- loading/empty/error states work
- responsive gate passes
- tests pass
- build passes
- Draft PR exists
- no merge performed

---

## 22. Required Final Report

Return:

```
MISSION_STATUS:
BRANCH:
HEAD_SHA:
PR_URL:

PULSE_ROUTE:

DATA_SOURCES:
  videos:
  news:
  trends:
  technologies:
  radar:

XARA_CONTEXT:
SEARCH_MODE:
PERSONALIZATION_MODE:

FIREBASE:
  pulse_enabled:
  analytics:
  performance:

AUTH_CHANGED:
DATABASE_CHANGED:
RAILWAY_CHANGED:
PAID_RESOURCES_CREATED:

TESTS:
  pulse_contract:
  navigation:
  gxeon:
  firebase:
  typescript:
  lint:
  build:

BROWSER:
  360:
  390:
  768:
  1440:

MOCK_DATA_IN_PRODUCTION:
SECRETS_EXPOSED:
KNOWN_LIMITATIONS:
ROLLBACK_READY:
MERGE_PERFORMED: false
STOP_CONDITION:
```

---

## 23. Stop Condition

After implementation, evidence, push and Draft PR creation:

STOP.

DO NOT MERGE.

GX performs diff, security, truthfulness, data-source, tenant, UX and CI audit before merge.

---

## Final Directive

Build Pulse as the student's intelligence radar, not as decorative screens.

No fake news.
No fake real-time status.
No fake personalization.
No fake AI.
No hidden provider secrets.

Curate what matters.
Connect it to learning.
Let XARA explain it.
Let GXEON orchestrate it.
Keep the platform truthful.

BEGIN:

`XPEX-PULSE-V1-001`
