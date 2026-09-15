import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const WEB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (...parts) => readFileSync(join(WEB_ROOT, ...parts), 'utf8')

const adminStatus = read('components/Hooks/useAdminStatus.tsx')
const adminAuthorization = read('components/Security/AdminAuthorization.tsx')
const libraryClient = read('app/orgs/[orgslug]/dash/library/client.tsx')
const analytics = read('app/orgs/[orgslug]/dash/analytics/page.tsx')
const safeImage = read('components/Objects/SafeImage.tsx')
const recentCourses = read('components/Dashboard/Home/RecentCourses.tsx')
const primitives = read('components/Xpex/XpexPrimitives.tsx')
const podcast = read('components/Objects/Thumbnails/PodcastThumbnail.tsx')
const nativeCss = read('app/orgs/[orgslug]/dash/xpex-native-v7-2.css')
const poloHero = read('components/Xpex/experiences/PoloIdentityHero.tsx')
const poloPage = read('app/xpex/polo/page.tsx')
const learningCss = read('app/orgs/[orgslug]/(withmenu)/xpex-learning-shell.css')

describe('XPeX Polo Enterprise V7.2 stabilization contract', () => {
  test('treats unresolved organization context as loading instead of unauthorized', () => {
    expect(adminStatus).toContain("isAuthenticated && !orgId")
    expect(adminAuthorization).toContain('const orgPending = isUserAuthenticated && !org?.slug')
    expect(adminAuthorization).toContain("org?.slug ? getUriWithOrg(org.slug, '/login') : '/login'")
    expect(adminAuthorization).toContain('Carregando acesso administrativo')
  })

  test('separates library loading, error and true empty states', () => {
    expect(libraryClient).toContain("function LibraryState({ kind }: { kind: 'loading' | 'error' })")
    expect(libraryClient).toContain('const libraryLoading')
    expect(libraryClient).toContain('const libraryError')
    expect(libraryClient).toContain('<LibraryState kind="loading" />')
    expect(libraryClient).toContain('<LibraryState kind="error" />')
  })

  test('does not expose analytics provider secrets or environment variable instructions', () => {
    expect(analytics).toContain('Análises indisponíveis no momento')
    expect(analytics).not.toContain('LEARNHOUSE_TINYBIRD')
    expect(analytics).not.toContain('INGEST_TOKEN')
    expect(analytics).not.toContain('READ_TOKEN')
  })

  test('provides resilient course artwork fallback behavior', () => {
    expect(safeImage).toContain('fallback?: React.ReactNode')
    expect(safeImage).toContain('setFailed(true)')
    expect(recentCourses).toContain('fallback={fallbackArtwork}')
    expect(recentCourses).toContain('pt-BR')
  })

  test('locks quick-action and native form contrast to the enterprise dark grammar', () => {
    expect(primitives).toContain('className="!text-white"')
    expect(primitives).toContain('className="!text-orange-400"')
    expect(nativeCss).toContain('.xpex-native-admin .bg-background')
    expect(nativeCss).toContain('background-color: #0a111c !important')
    expect(nativeCss).toContain('focus-within')
  })

  test('uses destination-accurate administrative CTAs and Portuguese podcast plurality', () => {
    expect(nativeCss).toContain('content: "Editar curso"')
    expect(podcast).toContain("isDashboard ? 'Configurar podcast'")
    expect(podcast).toContain("episodeCount === 1 ? 'episódio' : 'episódios'")
  })

  test('restores page semantics and stable metadata without changing the official hero artwork', () => {
    expect(poloHero).toContain('<h1 className="sr-only">{branding.organization_name}</h1>')
    expect(poloPage).toContain("title: 'Visão Geral do Polo — XPeX Academy'")
    expect(poloPage).toContain('robots: { index: false, follow: false }')
  })

  test('keeps Kelle visually primary on the learning-course shell while XPeX remains technology attribution', () => {
    expect(learningCss).toContain('[aria-label*="KELLE DIGITAL LAB"]')
    expect(learningCss).toContain('Kelle is the deployment identity')
    expect(learningCss).toContain('.course_metadata_right > div')
  })
})
