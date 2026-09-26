/**
 * XPeX Pulse V1 — Contract Test Suite
 * MISSION: XPEX-PULSE-V1-001
 *
 * Verifies structural contracts: routes, components, types, service adapter,
 * feature flags, truthfulness rules, and security rules.
 *
 * Run: node --test tests/xpex-pulse-v1.contract.test.mjs
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const WEB = resolve(__dirname, '..')

function readFile(relPath) {
  const full = join(WEB, relPath)
  if (!existsSync(full)) return null
  return readFileSync(full, 'utf8')
}

function fileExists(relPath) {
  return existsSync(join(WEB, relPath))
}

// ─── 1. Route & File Structure ─────────────────────────────────────────────────

describe('XPeX Pulse V1 — File Structure', () => {
  it('route page exists at app/xpex/pulse/page.tsx', () => {
    assert.ok(fileExists('app/xpex/pulse/page.tsx'), 'Route page must exist')
  })

  it('PulseHome component exists', () => {
    assert.ok(fileExists('components/Xpex/Pulse/PulseHome.tsx'), 'PulseHome must exist')
  })

  it('PulseHero component exists', () => {
    assert.ok(fileExists('components/Xpex/Pulse/PulseHero.tsx'), 'PulseHero must exist')
  })

  it('PulseVideoBlock component exists', () => {
    assert.ok(fileExists('components/Xpex/Pulse/PulseVideoBlock.tsx'), 'PulseVideoBlock must exist')
  })

  it('PulseNewsBlock component exists', () => {
    assert.ok(fileExists('components/Xpex/Pulse/PulseNewsBlock.tsx'), 'PulseNewsBlock must exist')
  })

  it('PulseTrendsBlock component exists', () => {
    assert.ok(fileExists('components/Xpex/Pulse/PulseTrendsBlock.tsx'), 'PulseTrendsBlock must exist')
  })

  it('PulseTechBlock component exists', () => {
    assert.ok(fileExists('components/Xpex/Pulse/PulseTechBlock.tsx'), 'PulseTechBlock must exist')
  })

  it('PulseRadarBlock component exists', () => {
    assert.ok(fileExists('components/Xpex/Pulse/PulseRadarBlock.tsx'), 'PulseRadarBlock must exist')
  })

  it('PulseXaraBlock component exists', () => {
    assert.ok(fileExists('components/Xpex/Pulse/PulseXaraBlock.tsx'), 'PulseXaraBlock must exist')
  })

  it('PulseToolbar component exists', () => {
    assert.ok(fileExists('components/Xpex/Pulse/PulseToolbar.tsx'), 'PulseToolbar must exist')
  })

  it('pulse.css stylesheet exists', () => {
    assert.ok(fileExists('components/Xpex/Pulse/pulse.css'), 'pulse.css must exist')
  })

  it('Pulse domain types exist', () => {
    assert.ok(fileExists('types/pulse.ts'), 'types/pulse.ts must exist')
  })

  it('Pulse service adapter exists', () => {
    assert.ok(fileExists('services/pulse/pulse.ts'), 'services/pulse/pulse.ts must exist')
  })
})

// ─── 2. Authentication & Authorization ────────────────────────────────────────

describe('XPeX Pulse V1 — Authentication Contract', () => {
  it('route page uses getAuthorizedStudentLearning', () => {
    const src = readFile('app/xpex/pulse/page.tsx')
    assert.ok(src, 'Route page must exist')
    assert.ok(
      src.includes('getAuthorizedStudentLearning'),
      'Must use server-side auth guard'
    )
  })

  it('route page renders XpexStudentDenied when not authorized', () => {
    const src = readFile('app/xpex/pulse/page.tsx')
    assert.ok(src?.includes('XpexStudentDenied'), 'Must handle unauthorized access')
  })

  it('route page wraps content in XpexAuthenticatedShell', () => {
    const src = readFile('app/xpex/pulse/page.tsx')
    assert.ok(src?.includes('XpexAuthenticatedShell'), 'Must use authenticated shell')
  })

  it('route page sets role="aluno"', () => {
    const src = readFile('app/xpex/pulse/page.tsx')
    assert.ok(src?.includes('role="aluno"'), 'Must declare aluno role')
  })
})

// ─── 3. Truthfulness Rules ────────────────────────────────────────────────────

describe('XPeX Pulse V1 — Truthfulness Contract (GX Rules)', () => {
  const serviceContent = readFile('services/pulse/pulse.ts')

  it('service adapter does NOT use "EM TEMPO REAL" claim', () => {
    assert.ok(serviceContent, 'Service must exist')
    assert.ok(
      !serviceContent.includes('EM TEMPO REAL'),
      'Must not claim real-time if data is not live'
    )
  })

  it('service adapter does NOT use fake percentage growth labels', () => {
    // Ensure no patterns like "+300%", "+150%" in the service
    const hasFakeGrowth = /\+\d+%/.test(serviceContent ?? '')
    assert.ok(!hasFakeGrowth, 'Must not use fake growth percentages')
  })

  it('service adapter does NOT use "RECOMENDADO PARA VOCÊ" without real personalization', () => {
    assert.ok(
      !serviceContent?.includes('RECOMENDADO PARA VOCÊ'),
      'Must not show personalization claim without real personalization'
    )
  })

  it('service adapter does NOT fake AI analysis claims', () => {
    assert.ok(
      !serviceContent?.includes('IA analisou'),
      'Must not claim AI analysis without real AI execution'
    )
  })

  it('service adapter uses honest label taxonomy', () => {
    const honestLabels = ['Curado', 'Atualizado', 'Disponível', 'Em cache', 'Indisponível', 'Em preparação']
    const hasAny = honestLabels.some(label => serviceContent?.includes(label))
    assert.ok(hasAny, 'Service must use at least one honest label')
  })

  it('PulseXaraBlock honest label — does not claim personalization without real AI', () => {
    const src = readFile('components/Xpex/Pulse/PulseXaraBlock.tsx')
    assert.ok(
      !src?.includes('RECOMENDADO PARA VOCÊ'),
      'XARA block must not fake personalization'
    )
  })
})

// ─── 4. Security Rules ─────────────────────────────────────────────────────────

describe('XPeX Pulse V1 — Security Contract', () => {
  const allFiles = [
    'components/Xpex/Pulse/PulseHome.tsx',
    'components/Xpex/Pulse/PulseXaraBlock.tsx',
    'components/Xpex/Pulse/PulseToolbar.tsx',
    'services/pulse/pulse.ts',
    'app/xpex/pulse/page.tsx',
  ]

  it('no API keys in Pulse frontend files', () => {
    for (const f of allFiles) {
      const src = readFile(f)
      if (!src) continue
      assert.ok(
        !src.match(/sk-[A-Za-z0-9]{20,}/),
        `${f} must not contain OpenAI-style API keys`
      )
      assert.ok(
        !src.match(/AIzaSy[A-Za-z0-9_-]{33}/),
        `${f} must not contain raw Google API keys (public config is allowed in firebase/config.ts only)`
      )
    }
  })

  it('XARA does NOT call AI provider directly from browser', () => {
    const src = readFile('components/Xpex/Pulse/PulseXaraBlock.tsx')
    assert.ok(src, 'PulseXaraBlock must exist')
    // Must not contain direct fetch to openai, anthropic, or google AI endpoints
    assert.ok(
      !src.includes('api.openai.com'),
      'Must not call OpenAI directly from browser'
    )
    assert.ok(
      !src.includes('generativelanguage.googleapis.com'),
      'Must not call Google AI directly from browser'
    )
    assert.ok(
      !src.includes('api.anthropic.com'),
      'Must not call Anthropic directly from browser'
    )
  })

  it('no Railway token in Pulse files', () => {
    for (const f of allFiles) {
      const src = readFile(f)
      if (!src) continue
      assert.ok(
        !src.includes('RAILWAY_TOKEN'),
        `${f} must not contain Railway token`
      )
    }
  })

  it('no admin tokens in Pulse files', () => {
    for (const f of allFiles) {
      const src = readFile(f)
      if (!src) continue
      assert.ok(
        !src.includes('ADMIN_TOKEN'),
        `${f} must not contain admin token`
      )
    }
  })
})

// ─── 5. Feature Flag ──────────────────────────────────────────────────────────

describe('XPeX Pulse V1 — Feature Flag Contract', () => {
  it('pulse_enabled is defined in XpexFeatureFlagKey', () => {
    const src = readFile('lib/firebase/types.ts')
    assert.ok(src?.includes("'pulse_enabled'"), "pulse_enabled key must be declared")
  })

  it('pulse_enabled default is true in V1', () => {
    const src = readFile('lib/firebase/types.ts')
    assert.ok(
      src?.includes('pulse_enabled: true'),
      'pulse_enabled must be true to activate Pulse V1'
    )
  })
})

// ─── 6. Sidebar Navigation ────────────────────────────────────────────────────

describe('XPeX Pulse V1 — Navigation Contract', () => {
  it('XPeX Pulse appears in student sidebar navigation', () => {
    const src = readFile('components/Xpex/XpexAuthenticatedShell.tsx')
    assert.ok(src, 'Shell must exist')
    assert.ok(
      src.includes("'/xpex/pulse'"),
      'Sidebar must contain /xpex/pulse route'
    )
    assert.ok(
      src.includes("'XPeX Pulse'"),
      'Sidebar must label the Pulse nav item'
    )
  })
})

// ─── 7. Content Source Safety ─────────────────────────────────────────────────

describe('XPeX Pulse V1 — Content Safety Contract', () => {
  it('YouTube embeds use official embed URL pattern only', () => {
    const src = readFile('components/Xpex/Pulse/PulseVideoBlock.tsx')
    assert.ok(src, 'PulseVideoBlock must exist')
    assert.ok(
      src.includes('youtube.com/embed/'),
      'Videos must use official YouTube embed URL'
    )
    // Must not attempt to download or circumvent via ytdl, youtube-dl or similar
    assert.ok(
      !src.includes('ytdl') && !src.includes('youtube-dl') && !src.includes('yt-dlp'),
      'Must not use download tools to re-host YouTube content'
    )
  })

  it('service adapter uses curated static content in V1 (no scraping)', () => {
    const src = readFile('services/pulse/pulse.ts')
    assert.ok(src, 'Service must exist')
    assert.ok(
      !src.includes('cheerio') && !src.includes('puppeteer') && !src.includes('playwright'),
      'V1 must not use browser scraping libraries'
    )
  })
})

// ─── 8. Accessibility Basics ──────────────────────────────────────────────────

describe('XPeX Pulse V1 — Accessibility Contract', () => {
  it('route page has sr-only heading', () => {
    const src = readFile('app/xpex/pulse/page.tsx')
    assert.ok(src?.includes('sr-only'), 'Must have screen-reader heading')
  })

  it('PulseVideoBlock sets aria-label on iframes via title', () => {
    const src = readFile('components/Xpex/Pulse/PulseVideoBlock.tsx')
    assert.ok(src?.includes('title={video.title}'), 'Video iframe must have title for accessibility')
  })

  it('PulseHero has a section nav with aria-label', () => {
    const src = readFile('components/Xpex/Pulse/PulseHero.tsx')
    assert.ok(src?.includes('aria-label'), 'Hero nav must have aria-label')
  })

  it('PulseNewsBlock uses article-level semantics or accessible links', () => {
    const src = readFile('components/Xpex/Pulse/PulseNewsBlock.tsx')
    assert.ok(src?.includes('aria-label'), 'News links must have aria-label')
  })
})
