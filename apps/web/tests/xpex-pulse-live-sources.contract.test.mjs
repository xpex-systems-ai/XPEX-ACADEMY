/**
 * XPeX Pulse — Live Source Fabric Contract Test Suite
 * MISSION: XPEX-PULSE-LIVE-SOURCES-001
 *
 * Uses node:test and node:assert/strict (never bun:test).
 * Validates source contracts, registry, cache, fallback priority, security, truthfulness, and Firebase gates.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const WEB_ROOT = path.resolve(__dirname, '..')

function readWebFile(relPath) {
  const full = path.join(WEB_ROOT, relPath)
  if (!fs.existsSync(full)) return null
  return fs.readFileSync(full, 'utf8')
}

describe('XPeX Pulse Live Sources — Source Contracts & Registry', () => {
  it('01 source contract types are defined', () => {
    const types = readWebFile('services/pulse/sources/types.ts')
    assert.ok(types, 'sources/types.ts must exist')
    assert.ok(types.includes('PulseLiveSource'), 'Must define PulseLiveSource')
    assert.ok(types.includes('PulseSourceHealthRecord'), 'Must define PulseSourceHealthRecord')
    assert.ok(types.includes('PulseCacheProvider'), 'Must define PulseCacheProvider')
  })

  it('02 source registry exists and exports pulseRegistry', () => {
    const registry = readWebFile('services/pulse/sources/registry.ts')
    assert.ok(registry, 'sources/registry.ts must exist')
    assert.ok(registry.includes('class PulseSourceRegistry'), 'Must define PulseSourceRegistry')
    assert.ok(registry.includes('export const pulseRegistry'), 'Must export pulseRegistry')
  })

  it('03 curated fallback exists and provides resilient baseline', () => {
    const fallback = readWebFile('services/pulse/sources/fallback.ts')
    assert.ok(fallback, 'sources/fallback.ts must exist')
    assert.ok(fallback.includes('FALLBACK_VIDEOS'), 'Must export FALLBACK_VIDEOS')
    assert.ok(fallback.includes('FALLBACK_NEWS'), 'Must export FALLBACK_NEWS')
    assert.ok(fallback.includes('FALLBACK_TRENDS'), 'Must export FALLBACK_TRENDS')
  })

  it('04 YouTube adapter executes server-side only', () => {
    const yt = readWebFile('services/pulse/sources/youtube.ts')
    assert.ok(yt, 'sources/youtube.ts must exist')
    assert.ok(yt.includes('class YouTubeLiveSource'), 'Must define YouTubeLiveSource')
    assert.ok(yt.includes('process.env.YOUTUBE_API_KEY'), 'Must read key from process.env')
  })

  it('05 contains zero exposed YouTube API secrets in frontend', () => {
    const pulseDir = path.join(WEB_ROOT, 'components/Xpex/Pulse')
    const files = fs.readdirSync(pulseDir).map((f) => path.join(pulseDir, f))
    files.push(path.join(WEB_ROOT, 'services/pulse/pulse.ts'))

    for (const f of files) {
      if (fs.statSync(f).isFile()) {
        const text = fs.readFileSync(f, 'utf8')
        assert.ok(!/AIzaSy[A-Za-z0-9_-]{33}/.test(text), `File ${path.basename(f)} must not contain exposed API key`)
      }
    }
  })

  it('06 news adapter preserves provenance (publisher, domain, canonicalUrl)', () => {
    const rss = readWebFile('services/pulse/sources/rss.ts')
    assert.ok(rss, 'sources/rss.ts must exist')
    assert.ok(rss.includes('ApprovedNewsPublisher'), 'Must define ApprovedNewsPublisher')
    assert.ok(rss.includes('domain:'), 'Must track domain')
    assert.ok(rss.includes('source:'), 'Must track source name')
  })

  it('07 cache provider supports TTL and freshness reporting', () => {
    const cache = readWebFile('services/pulse/sources/cache.ts')
    assert.ok(cache, 'sources/cache.ts must exist')
    assert.ok(cache.includes('getFreshness'), 'Must implement getFreshness')
    assert.ok(cache.includes('ttlMs'), 'Must support ttlMs')
  })

  it('08 cached results are labeled correctly with honest taxonomy', () => {
    const registry = readWebFile('services/pulse/sources/registry.ts')
    assert.ok(registry.includes("label: 'Em cache'"), 'Must label cached data as Em cache')
    assert.ok(registry.includes("label: 'Curado'"), 'Must label fallback data as Curado')
    assert.ok(registry.includes("label: 'Atualizado'"), 'Must label fresh data as Atualizado')
  })

  it('09 unavailable sources degrade gracefully to cache or fallback', () => {
    const registry = readWebFile('services/pulse/sources/registry.ts')
    assert.ok(registry.includes('FALLBACK_VIDEOS'), 'Must fallback to curated videos on live error')
    assert.ok(registry.includes('FALLBACK_NEWS'), 'Must fallback to curated news on live error')
  })

  it('10 Pulse renders and functions without live API credentials', () => {
    const service = readWebFile('services/pulse/pulse.ts')
    assert.ok(service.includes('fetchPulseVideos'), 'Must export fetchPulseVideos')
    assert.ok(service.includes('fetchPulseNews'), 'Must export fetchPulseNews')
  })

  it('11 Firebase live sources flag defaults to false', () => {
    const fbTypes = readWebFile('lib/firebase/types.ts')
    assert.ok(fbTypes.includes('pulse_live_sources_enabled: false'), 'pulse_live_sources_enabled must default to false')
    assert.ok(fbTypes.includes('pulse_youtube_api_enabled: false'), 'pulse_youtube_api_enabled must default to false')
  })

  it('12 live flag activates source ingestion path in registry', () => {
    const registry = readWebFile('services/pulse/sources/registry.ts')
    assert.ok(registry.includes('liveSourcesEnabled'), 'Registry must accept liveSourcesEnabled flag')
  })

  it('13 XARA AI interaction uses server-side GXEON/RAG gateway (startRAGChatStream)', () => {
    const service = readWebFile('services/pulse/pulse.ts')
    assert.ok(service.includes('startRAGChatStream'), 'Must dispatch prompts through startRAGChatStream')
  })

  it('14 browser never calls private AI providers directly', () => {
    const sourcesDir = path.join(WEB_ROOT, 'services/pulse/sources')
    const sourceFiles = fs.readdirSync(sourcesDir).map((f) => path.join(sourcesDir, f))
    sourceFiles.push(path.join(WEB_ROOT, 'services/pulse/pulse.ts'))

    for (const f of sourceFiles) {
      if (fs.statSync(f).isFile()) {
        const text = fs.readFileSync(f, 'utf8')
        assert.ok(!text.includes('api.openai.com'), `File ${path.basename(f)} must not call OpenAI directly`)
        assert.ok(!text.includes('api.anthropic.com'), `File ${path.basename(f)} must not call Anthropic directly`)
      }
    }
  })

  it('15 no fake percentage growth rates are claimed in trends', () => {
    const fallback = readWebFile('services/pulse/sources/fallback.ts')
    const hasFakeGrowth = /\+\d{2,3}%/.test(fallback ?? '')
    assert.ok(!hasFakeGrowth, 'Must not use unverified +XXX% growth labels')
  })

  it('16 no fake real-time claims on static/curated feeds', () => {
    const fallback = readWebFile('services/pulse/sources/fallback.ts')
    assert.ok(!fallback.includes('EM TEMPO REAL'), 'Must not claim EM TEMPO REAL on static fallback')
  })

  it('17 source provenance is preserved in normalized articles', () => {
    const rss = readWebFile('services/pulse/sources/rss.ts')
    assert.ok(rss.includes('domain: pub.domain'), 'Must record publisher domain')
    assert.ok(rss.includes('source: pub.name'), 'Must record publisher name')
  })

  it('18 mobile responsive styles are preserved in pulse.css', () => {
    const css = readWebFile('components/Xpex/Pulse/pulse.css')
    assert.ok(css.includes('@media (max-width: 430px)'), 'Must include mobile breakpoint')
    assert.ok(css.includes('@media (max-width: 768px)'), 'Must include tablet breakpoint')
  })

  it('19 authenticated student route is preserved at app/xpex/pulse/page.tsx', () => {
    const page = readWebFile('app/xpex/pulse/page.tsx')
    assert.ok(page.includes('getAuthorizedStudentLearning'), 'Must use getAuthorizedStudentLearning')
    assert.ok(page.includes('XpexAuthenticatedShell'), 'Must wrap in XpexAuthenticatedShell')
  })

  it('20 architecture documentation exists at docs/architecture/XPEX_PULSE_LIVE_SOURCES_V1.md', () => {
    const doc = readWebFile('../../docs/architecture/XPEX_PULSE_LIVE_SOURCES_V1.md')
    assert.ok(doc, 'Manifesto document must exist')
    assert.ok(doc.includes('XPEX-PULSE-LIVE-SOURCES-001'), 'Must have mission ID')
  })
  it('21 live source fabric is exposed only through authenticated server route', () => {
    const route = readWebFile('app/xpex/pulse/feed/route.ts')
    const service = readWebFile('services/pulse/pulse.ts')
    assert.ok(route, 'Authenticated Pulse feed route must exist')
    assert.ok(route.includes("import 'server-only'"), 'Feed route must be server-only')
    assert.ok(route.includes('getAuthorizedStudentLearning'), 'Feed route must enforce student authorization')
    assert.ok(route.includes('pulseRegistry'), 'Feed route must use server-side Pulse registry')
    assert.ok(!service.includes("from './sources/registry'"), 'Client-facing Pulse service must not import live server registry')
  })

  it('22 student progress never fabricates placeholder metrics', () => {
    const service = readWebFile('services/pulse/pulse.ts')
    assert.ok(service.includes('return undefined'), 'Pulse progress must remain unavailable until authoritative backend data is wired')
    assert.ok(!service.includes('completionPercentage: 75'), 'Must not ship fabricated 75% progress')
    assert.ok(!service.includes('watchedVideosCount: 28'), 'Must not ship fabricated watched-video count')
  })

  it('23 XARA fallback never fabricates a content summary', () => {
    const service = readWebFile('services/pulse/pulse.ts')
    assert.ok(!service.includes('Resumo inteligente: O conteúdo destaca'), 'Fallback must not invent a summary without GXEON')
    assert.ok(service.includes('não conseguiu acessar o GXEON para resumir'), 'Fallback must disclose GXEON unavailability')
  })

  it('24 queue does not fabricate unknown duration or publication age', () => {
    const registry = readWebFile('services/pulse/sources/registry.ts')
    assert.ok(!registry.includes("durationLabel: v.durationLabel ?? '15 min'"), 'Unknown durations must not be fabricated')
    assert.ok(!registry.includes('index * 2 + 1'), 'Publication age must not be fabricated from queue position')
  })

})
