# XPeX AI Integration Map

## North star

XPeX Academy becomes an AI-native Education Operating System without replacing its current application architecture.

## Map existing code to the target architecture

| Target capability | Existing implementation | Action |
|---|---|---|
| GXEON AI Gateway | `services/ai/llm/provider.py` + routers | Extend, do not replace |
| Model routing | `services/ai/llm/tiers.py` | Keep centralized |
| Gemini provider | already supported by provider abstraction | Configure server-side |
| OpenRouter bridge | already supported | Keep as fallback/alternate |
| RAG | `services/ai/rag/` | Connect to Tutor golden flow |
| AI usage/credits | org AI credits + plans | Extend telemetry/cost events |
| AI generations | durable Postgres history | Reuse for media outputs |
| Tutor | AI chat + RAG exists | Productize as contextual XPeX Tutor |
| Course Architect | courseplanning + course_factory | Integrate with teacher workflows |
| Creator Studio | editorial_studio + content_studio | Expand incrementally |
| Video Studio | XPeX video jobs/factory | Integrate supported async video providers |
| Image | Google image path exists | Expose through controlled Studio |
| Voice/audio | AI audio/TTS exists | Reuse |
| Media library | folders/media/storage | Add asset metadata/reuse policy |
| Enterprise governance | RBAC, orgs, plans, quotas | Preserve and extend |

## Google AI integration boundary

Google should be integrated behind the existing server-side provider abstraction.

Never expose API keys in the browser.

Consumer Google AI Pro benefits must not be treated as production API entitlement.

Production integrations require explicit API availability, quota, latency and billing checks.

## First golden flow

1. authenticated student opens a real lesson
2. frontend sends lesson/course context to XPeX Tutor
3. backend verifies membership + authorization
4. RAG retrieves only authorized course context
5. provider router selects the configured model
6. response streams to UI
7. usage is metered to organization/user
8. failures degrade safely
9. no private provider key reaches the client

## Media flow

Teacher/creator:

source → lesson plan → script → storyboard → visual prompts → assets → voice → video → quiz → review → publish

Video generation must be asynchronous. Do not hold a request open for long-running video jobs.
