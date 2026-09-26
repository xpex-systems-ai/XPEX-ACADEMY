# XPEX ACADEMY — LIVE SOURCE FABRIC MANIFESTO & ARCHITECTURE
**MISSION ID:** `XPEX-PULSE-LIVE-SOURCES-002`  
**PROGRAM:** XPeX Academy — AI-Native Learning, Intelligence & Creation Platform  
**PRODUCT:** XPeX Pulse  
**AUTHORITY:** XPeX Core / GXEON Engine  
**STATUS:** PRODUCTION-GRADE / MERGE-READY LIVE SOURCE FABRIC

---

## 1. Executive Summary & Vision

XPeX Pulse transforms student discovery from a static video feed into the **official live intelligence layer** of XPeX Academy. By combining server-side live source adapters, hybrid caching (process-local L1 + pluggable distributed L2), source provenance tracking, and authenticated GXEON contextual routing, Pulse provides students with continuous access to verified AI technologies, news, trends, and learning opportunities without compromising performance, privacy, or truthfulness.

```
+-------------------------------------------------------------------------+
|                           EXTERNAL ECOSYSTEM                            |
|  [YouTube API v3]   [Official AI RSS/Atom]   [Institutional News]       |
+-------------------------------------------------------------------------+
                                    │ (Server-Side Ingestion)
                                    ▼
+-------------------------------------------------------------------------+
|                     XPEX LIVE SOURCE FABRIC                             |
|  - YouTubeLiveSource (Approved Channels Registry / No scraping)         |
|  - NewsFeedLiveSource (XML/Atom Parser / Strict Provenance)             |
|  - Normalization Engine (Provider Schema -> XPeX Domain Model)          |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                     HYBRID CACHE ARCHITECTURE                           |
|  - L1 MemoryPulseCache (Process-local, resilient against cold starts)    |
|  - L2 SharedPulseCache (Pluggable Redis/KV distributed driver)           |
|  - Freshness Inspector (Calculates age & stale-while-revalidate state)  |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                     PULSE SOURCE REGISTRY                               |
|  Deterministic Priority Chain:                                          |
|  1. LIVE (if enabled & healthy -> labeled 'Atualizado')                 |
|  2. FRESH CACHE (if within valid TTL window -> labeled 'Em cache')      |
|  3. STALE CACHE (stale fallback -> labeled 'Em cache')                  |
|  4. CURATED FALLBACK (Manual curation baseline -> labeled 'Curado')     |
|  5. EMPTY / UNAVAILABLE (Graceful degradation -> labeled 'Indisponível') |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                     XPEX PULSE UI (CLIENT)                              |
|  - PulseMainPlayer & VideoQueue (Dynamic live block labels)             |
|  - PulseNewsBlock & TrendsBlock & TechBlock                             |
|  - Radar XPeX Sonar Visualizer                                          |
|  - Real-time search across active dataset (searchPulseItems)            |
|  - XARA Copilot Bridge -> Railway /xpex/ai-gateway                      |
+-------------------------------------------------------------------------+
```

---

## 2. Invariant Security & Truthfulness Rules

1. **Zero Client Secrets:** No `YOUTUBE_API_KEY`, AI provider tokens, or internal database secrets are ever shipped to browser bundles.
2. **Server-Side Ingestion Only:** External API calls and feed parsers execute strictly server-side.
3. **Official YouTube Embeds:** No video streaming proxies or media re-hosting. All video embeds use `https://www.youtube-nocookie.com/embed/...` with strict referrer policies.
4. **YouTube Trust Registry:** Matches discovered items against `APPROVED_YOUTUBE_CHANNELS` to classify provenance as `official`, `institutional`, or `curated`.
5. **Verified Metadata Only:** No fabricated dates or synthetic `"Hoje"` tags. Unverified dates remain `null`, and estimated read times are clearly defined as estimates.
6. **Honest Label Taxonomy:**
   - **`Curado`**: Hand-curated by XPeX editorial team.
   - **`Atualizado`**: Freshly fetched from upstream within active TTL.
   - **`Em cache`**: Served from valid local cache or stale fallback.
   - **`Indisponível`**: Upstream unreachable and fallback not applicable.
   - **`Em preparação`**: Upcoming feature / pipeline in training.
   - **`Ao Vivo`**: Reserved exclusively for active live streams.
7. **No Fabricated Metrics:** No fake percentage growth (e.g. `+240%`) without verified telemetry; qualitative signals (`Forte tração`, `Em alta`, `Emergindo`) and interest scores are used.

---

## 3. Cache Architecture & Fallback Flow

The `HybridPulseCache` orchestrates L1 and optional L2 caching:
- **Videos**: 3600s (1 hour) TTL.
- **News Feeds**: 900s (15 minutes) TTL.
- **Trends & Technologies**: 7200s (2 hours) TTL.
- **L1 Cache**: Process-local memory cache (`MemoryPulseCache`). In serverless/SSR environments, this operates safely as best-effort per instance and is fully resilient against cold starts.
- **L2 Cache**: Pluggable distributed shared cache (`SharedPulseCache`) for multi-replica fleets (Redis/KV).
- **Stale Fallback**: When upstream live feeds are unreachable or disabled, the registry inspects fresh cache, then stale cache, and finally curated fallback, ensuring 100% uptime for students with truthful labeling.

---

## 4. XARA & GXEON Pedagogical Bridge

When a student interacts with content on Pulse (e.g., clicking *"Resumir com XARA"* or asking a follow-up question):
1. Client packages safe metadata (`feature: 'pulse_live_sources_v1'`, `videoTitle`).
2. Request is dispatched to `/xpex/ai-gateway` on Railway.
3. GXEON orchestrator executes context-grounded reasoning without exposing AI provider endpoints to the browser.
4. XARA responds with pedagogical action suggestions linked to official XPeX courses and trails.

---

## 5. Firebase Fabric Feature Flags & Telemetry

### Feature Flags (Remote Config)
- `pulse_enabled` (default: `true`)
- `pulse_live_sources_enabled` (default: `false` — staged activation)
- `pulse_youtube_api_enabled` (default: `false` — staged activation)
- `pulse_news_enabled` (default: `true`)
- `pulse_trends_enabled` (default: `true`)
- `pulse_xara_enabled` (default: `true`)
- `pulse_cache_enabled` (default: `true`)

### Telemetry (Zero PII)
- `pulse_opened`
- `pulse_search`
- `pulse_filter_selected`
- `pulse_content_started`
- `pulse_content_saved`
- `pulse_source_opened`
- `pulse_xara_action`
- `pulse_source_loaded`
- `pulse_video_selected`
- `pulse_news_opened`
- `pulse_technology_opened`
- `pulse_creator_opened`
- `pulse_search_result_selected`

---

## 6. Cost Boundaries

All components are designed to run within the existing free/staged resource tiers. No paid Vertex AI, BigQuery exports, or Cloud Run paid instances are enabled.
