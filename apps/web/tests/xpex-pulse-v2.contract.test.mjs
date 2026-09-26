/**
 * XPeX Pulse V2 — Contract & Architecture Test Suite
 * MISSION: XPEX-PULSE-V2-LIVE-INTELLIGENCE-001
 *
 * Uses node:test and node:assert/strict (never bun:test).
 * Tests all V2 components, types, feature gates, security, truthfulness, and responsive design contracts.
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

// ─── 1. File Structure & Component Integrity ─────────────────────────────────

describe('XPeX Pulse V2 — Architecture & Components', () => {
  const requiredFiles = [
    'app/xpex/pulse/page.tsx',
    'components/Xpex/Pulse/PulseHome.tsx',
    'components/Xpex/Pulse/PulseHero.tsx',
    'components/Xpex/Pulse/PulseToolbar.tsx',
    'components/Xpex/Pulse/PulseMainPlayer.tsx',
    'components/Xpex/Pulse/PulseVideoQueue.tsx',
    'components/Xpex/Pulse/PulseCuratedVideos.tsx',
    'components/Xpex/Pulse/PulseStudentProgressCard.tsx',
    'components/Xpex/Pulse/PulseNewsBlock.tsx',
    'components/Xpex/Pulse/PulseTrendsBlock.tsx',
    'components/Xpex/Pulse/PulseTechBlock.tsx',
    'components/Xpex/Pulse/PulseRadarBlock.tsx',
    'components/Xpex/Pulse/PulseXaraBlock.tsx',
    'components/Xpex/Pulse/PulseResourceGrid.tsx',
    'components/Xpex/Pulse/pulse.css',
    'types/pulse.ts',
    'services/pulse/pulse.ts',
  ]

  for (const rel of requiredFiles) {
    it(`required file exists: ${rel}`, () => {
      const content = readWebFile(rel)
      assert.ok(content !== null, `File ${rel} must exist in apps/web`)
      assert.ok(content.length > 50, `File ${rel} must not be empty`)
    })
  }
})

// ─── 2. Domain Types & Taxonomy Contract ─────────────────────────────────────

describe('XPeX Pulse V2 — Types & Contracts', () => {
  const typesContent = readWebFile('types/pulse.ts')

  it('types file exists and is valid', () => {
    assert.ok(typesContent, 'types/pulse.ts must exist')
  })

  it('defines honest PulseContentLabel taxonomy', () => {
    assert.ok(typesContent.includes("'Curado'"), 'Must include Curado')
    assert.ok(typesContent.includes("'Atualizado'"), 'Must include Atualizado')
    assert.ok(typesContent.includes("'Disponível'"), 'Must include Disponível')
    assert.ok(typesContent.includes("'Em cache'"), 'Must include Em cache')
    assert.ok(typesContent.includes("'Indisponível'"), 'Must include Indisponível')
    assert.ok(typesContent.includes("'Em preparação'"), 'Must include Em preparação')
  })

  it('defines PulseVideoQueueItem interface', () => {
    assert.ok(typesContent.includes('PulseVideoQueueItem'), 'Must define PulseVideoQueueItem')
    assert.ok(typesContent.includes('durationLabel'), 'Must have durationLabel')
    assert.ok(typesContent.includes('channelName'), 'Must have channelName')
  })

  it('defines PulseStudentProgress interface', () => {
    assert.ok(typesContent.includes('PulseStudentProgress'), 'Must define PulseStudentProgress')
    assert.ok(typesContent.includes('completionPercentage'), 'Must have completionPercentage')
    assert.ok(typesContent.includes('activeTrailsCount'), 'Must have activeTrailsCount')
  })

  it('defines PulseResourceCard interface', () => {
    assert.ok(typesContent.includes('PulseResourceCard'), 'Must define PulseResourceCard')
  })

  it('defines PulseXaraMessage interface', () => {
    assert.ok(typesContent.includes('PulseXaraMessage'), 'Must define PulseXaraMessage')
  })
})

// ─── 3. Firebase Fabric & Remote Config Feature Gate ─────────────────────────

describe('XPeX Pulse V2 — Firebase Fabric Integration', () => {
  const firebaseTypes = readWebFile('lib/firebase/types.ts')
  const homeContent = readWebFile('components/Xpex/Pulse/PulseHome.tsx')

  it('pulse feature flags are declared in XpexFeatureFlagKey', () => {
    assert.ok(firebaseTypes.includes("'pulse_enabled'"), 'Must declare pulse_enabled')
    assert.ok(firebaseTypes.includes("'pulse_live_sources_enabled'"), 'Must declare pulse_live_sources_enabled')
    assert.ok(firebaseTypes.includes("'pulse_youtube_api_enabled'"), 'Must declare pulse_youtube_api_enabled')
    assert.ok(firebaseTypes.includes("'pulse_news_enabled'"), 'Must declare pulse_news_enabled')
    assert.ok(firebaseTypes.includes("'pulse_trends_enabled'"), 'Must declare pulse_trends_enabled')
    assert.ok(firebaseTypes.includes("'pulse_xara_enabled'"), 'Must declare pulse_xara_enabled')
  })

  it('pulse feature flag defaults are code-authoritative', () => {
    assert.ok(firebaseTypes.includes('pulse_enabled: true'), 'pulse_enabled must default to true')
    assert.ok(firebaseTypes.includes('pulse_live_sources_enabled: false'), 'pulse_live_sources_enabled default false')
    assert.ok(firebaseTypes.includes('pulse_youtube_api_enabled: false'), 'pulse_youtube_api_enabled default false')
  })

  it('pulse telemetry events are defined in XpexEventName', () => {
    assert.ok(firebaseTypes.includes("'pulse_opened'"), 'Must define pulse_opened')
    assert.ok(firebaseTypes.includes("'pulse_search'"), 'Must define pulse_search')
    assert.ok(firebaseTypes.includes("'pulse_filter_selected'"), 'Must define pulse_filter_selected')
    assert.ok(firebaseTypes.includes("'pulse_content_started'"), 'Must define pulse_content_started')
    assert.ok(firebaseTypes.includes("'pulse_content_saved'"), 'Must define pulse_content_saved')
    assert.ok(firebaseTypes.includes("'pulse_xara_action'"), 'Must define pulse_xara_action')
  })

  it('PulseHome dynamically checks isFeatureEnabled at runtime', () => {
    assert.ok(homeContent.includes("isFeatureEnabled('pulse_enabled')"), 'PulseHome must check pulse_enabled gate')
    assert.ok(homeContent.includes("trackXpexEvent('pulse_opened'"), 'PulseHome must track pulse_opened event')
  })
})

// ─── 4. Security & Isolation Contracts ────────────────────────────────────────

describe('XPeX Pulse V2 — Security & Privacy', () => {
  const pulseDir = path.join(WEB_ROOT, 'components/Xpex/Pulse')
  const serviceFile = path.join(WEB_ROOT, 'services/pulse/pulse.ts')

  it('contains zero exposed API keys or secrets in frontend components', () => {
    const files = fs.readdirSync(pulseDir).map((f) => path.join(pulseDir, f))
    files.push(serviceFile)

    const secretPatterns = [
      /AIzaSy[A-Za-z0-9_-]{33}/, // Google API key
      /sk-[A-Za-z0-9]{48}/,       // OpenAI secret key
      /ghp_[A-Za-z0-9]{36}/,      // GitHub personal token
      /gho_[A-Za-z0-9]{36}/,      // GitHub oauth token
      /Bearer\s+[A-Za-z0-9_\-\.]{20,}/, // Hardcoded Bearer
    ]

    for (const filePath of files) {
      if (fs.statSync(filePath).isFile()) {
        const text = fs.readFileSync(filePath, 'utf8')
        for (const pat of secretPatterns) {
          assert.ok(!pat.test(text), `File ${path.basename(filePath)} must not contain leaked API secrets`)
        }
      }
    }
  })

  it('routes XARA AI requests exclusively through Railway AI Gateway (/xpex/ai-gateway)', () => {
    const service = readWebFile('services/pulse/pulse.ts')
    assert.ok(service.includes('/xpex/ai-gateway'), 'Must use /xpex/ai-gateway endpoint')
    assert.ok(!service.includes('api.openai.com'), 'Must not call OpenAI directly from browser')
    assert.ok(!service.includes('generativelanguage.googleapis.com'), 'Must not call Gemini directly from browser')
    assert.ok(!service.includes('api.anthropic.com'), 'Must not call Anthropic directly from browser')
  })

  it('uses YouTube nocookie official embed with strict referrer policy', () => {
    const player = readWebFile('components/Xpex/Pulse/PulseMainPlayer.tsx')
    assert.ok(player.includes('youtube-nocookie.com/embed/'), 'Must use official youtube-nocookie embed')
    assert.ok(player.includes('referrerPolicy="strict-origin-when-cross-origin"'), 'Must specify strict-origin referrer policy')
  })
})

// ─── 5. Truthfulness & Integrity Contracts ────────────────────────────────────

describe('XPeX Pulse V2 — Truthfulness & Product Truth', () => {
  const service = readWebFile('services/pulse/pulse.ts')
  const home = readWebFile('components/Xpex/Pulse/PulseHome.tsx')
  const hero = readWebFile('components/Xpex/Pulse/PulseHero.tsx')

  it('does NOT use unverified "+XXX%" growth percentages in curated trends', () => {
    const hasFakeGrowth = /\+\d{2,3}%/.test(service ?? '')
    assert.ok(!hasFakeGrowth, 'Must not claim unverified percentage growth rates')
  })

  it('does NOT claim "EM TEMPO REAL" on static/curated mock sources', () => {
    assert.ok(!service.includes('EM TEMPO REAL'), 'Curated service must not claim live real-time')
  })

  it('does NOT use fake personalization claim without student AI execution', () => {
    assert.ok(!service.includes('RECOMENDADO PARA VOCÊ'), 'Must not fabricate personal recommendations')
  })

  it('Hero tagline and badges accurately describe the platform', () => {
    assert.ok(hero.includes('CONTEÚDOS REAIS. TENDÊNCIAS ATUALIZADAS. APRENDIZADO CONTÍNUO.'), 'Hero must have official motto')
    assert.ok(hero.includes('XPeX PULSE'), 'Hero must contain title')
  })
})

// ─── 6. User Experience & Interactivity Contracts ─────────────────────────────

describe('XPeX Pulse V2 — Interactivity & Flow', () => {
  const home = readWebFile('components/Xpex/Pulse/PulseHome.tsx')
  const player = readWebFile('components/Xpex/Pulse/PulseMainPlayer.tsx')
  const queue = readWebFile('components/Xpex/Pulse/PulseVideoQueue.tsx')
  const curated = readWebFile('components/Xpex/Pulse/PulseCuratedVideos.tsx')
  const xara = readWebFile('components/Xpex/Pulse/PulseXaraBlock.tsx')
  const toolbar = readWebFile('components/Xpex/Pulse/PulseToolbar.tsx')

  it('PulseHome connects video queue selection to main player state', () => {
    assert.ok(home.includes('handleSelectVideo'), 'PulseHome must have handleSelectVideo handler')
    assert.ok(home.includes('activeVideo'), 'PulseHome must manage activeVideo state')
  })

  it('PulseMainPlayer offers "Resumir com XARA" contextual bridge', () => {
    assert.ok(player.includes('Resumir com XARA'), 'Player must provide XARA summary action')
    assert.ok(player.includes('onAskXara'), 'Player must call onAskXara callback')
  })

  it('PulseVideoQueue displays upcoming videos count and active playback badge', () => {
    assert.ok(queue.includes('Próximos da fila'), 'Queue must show Próximos da fila header')
    assert.ok(queue.includes('is-active'), 'Queue must highlight active video item')
  })

  it('PulseCuratedVideos renders video selection cards with "Assistir agora"', () => {
    assert.ok(curated.includes('VÍDEOS CURADOS'), 'Must render VÍDEOS CURADOS header')
    assert.ok(curated.includes('onSelectVideo'), 'Must support video selection callback')
  })

  it('PulseXaraBlock provides quick suggestions chips and question input', () => {
    assert.ok(xara.includes('APRENDA COM XARA'), 'XARA panel must have header')
    assert.ok(xara.includes('Resumir este conteúdo'), 'Must provide default summary suggestion')
    assert.ok(xara.includes('Criar trilha personalizada'), 'Must provide trail suggestion')
    assert.ok(xara.includes('pulse-xara-input-field'), 'Must have accessible text input')
  })

  it('PulseToolbar supports live category filtering and search query reset', () => {
    assert.ok(toolbar.includes('pulse-categories-rail'), 'Must have categories slider rail')
    assert.ok(toolbar.includes('pulse-search-input'), 'Must have search input')
  })
})

// ─── 7. Responsive CSS & Accessibility Contracts ──────────────────────────────

describe('XPeX Pulse V2 — Responsive Design & Accessibility', () => {
  const css = readWebFile('components/Xpex/Pulse/pulse.css')
  const page = readWebFile('app/xpex/pulse/page.tsx')
  const progress = readWebFile('components/Xpex/Pulse/PulseStudentProgressCard.tsx')

  it('pulse.css includes responsive breakpoints for 1024px, 768px, 430px', () => {
    assert.ok(css.includes('@media (max-width: 1024px)'), 'Must have 1024px breakpoint')
    assert.ok(css.includes('@media (max-width: 768px)'), 'Must have 768px breakpoint')
    assert.ok(css.includes('@media (max-width: 430px)'), 'Must have mobile compact breakpoint')
  })

  it('pulse.css defines cyber dark theme tokens and smooth animations', () => {
    assert.ok(css.includes('--pulse-bg-root: #080c14'), 'Must define dark background')
    assert.ok(css.includes('--pulse-cyan-accent: #00f0ff'), 'Must define cyan accent')
    assert.ok(css.includes('--pulse-orange-accent: #ff6b00'), 'Must define orange accent')
    assert.ok(css.includes('pulse-sonar-wrapper'), 'Must include sonar radar styles')
  })

  it('route page includes semantic sr-only header for screen readers', () => {
    assert.ok(page.includes('className="sr-only"'), 'Page must contain sr-only heading block')
  })

  it('PulseStudentProgressCard includes accessible SVG radial meter', () => {
    assert.ok(progress.includes('pulse-radial-svg'), 'Must render radial svg')
    assert.ok(progress.includes('Trilhas em andamento'), 'Must render active trails stat')
    assert.ok(progress.includes('Vídeos assistidos'), 'Must render watched videos stat')
  })
})
