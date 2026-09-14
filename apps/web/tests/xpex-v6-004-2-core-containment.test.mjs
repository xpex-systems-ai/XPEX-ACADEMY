import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const WEB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (...parts) => readFileSync(join(WEB_ROOT, ...parts), 'utf8')

const nativeLayout = read('app/orgs/[orgslug]/dash/ClientAdminLayout.tsx')
const nativeRouteLayout = read('app/orgs/[orgslug]/dash/layout.tsx')
const nativeMenu = read('app/orgs/[orgslug]/dash/XpexNativeAdminMenu.tsx')
const nativeTheme = read('app/orgs/[orgslug]/dash/xpex-native-admin.css')
const importSelector = read('components/Objects/Modals/Course/Import/ImportTypeSelector.tsx')
const studentCourse = read('app/xpex/courses/[courseId]/page.tsx')
const poloSections = read('components/Xpex/experiences/XpexPoloSection.tsx')
const poloDashboard = read('components/Xpex/experiences/AuthenticatedDashboard.tsx')
const poloPage = read('app/xpex/polo/page.tsx')
const access = read('lib/xpex/access.ts')

describe('XPEX V6-004.2 Learning Core containment', () => {
  test('replaces legacy dashboard chrome without weakening auth or headless tracking', () => {
    expect(nativeLayout).toContain('SessionGate')
    expect(nativeLayout).toContain('AdminAuthorization authorizationMode="page"')
    expect(nativeLayout).toContain('CommandPaletteProvider')
    expect(nativeLayout).toContain('XpexNativeAdminMenu')
    expect(nativeLayout).toContain('OnboardingTracker')
    expect(nativeLayout).not.toContain('DashLeftMenu')
    expect(nativeLayout).not.toContain('DashMobileMenu')
    expect(nativeLayout).not.toContain('WelcomeModal')
  })

  test('brands the native academic shell as XpeX and removes legacy dashboard title', () => {
    expect(nativeRouteLayout).toContain('XpeX Academy · Operação Acadêmica')
    expect(nativeRouteLayout).not.toContain('LearnHouse Dashboard')
    expect(nativeMenu).toContain('Navegação acadêmica XpeX')
    expect(nativeMenu).toContain('XpeX Academy')
    expect(nativeMenu).toContain('Tecnologia educacional')
    expect(nativeMenu).not.toContain('lrn-dash.svg')
    expect(nativeMenu).not.toMatch(/LearnHouse|Learnhouse/)
    expect(nativeTheme).toContain('.xpex-native-admin')
    expect(nativeTheme).toContain('img[src$="/lrn-dash.svg"]')
    expect(nativeTheme).not.toContain('alt*="LearnHouse"')
  })

  test('keeps real academic destinations inside the selected organization shell', () => {
    for (const route of ['/dash/users/settings/usergroups', '/dash/courses', '/dash/users/settings/users', '/dash/library', '/dash/analytics', '/dash/org/settings/general']) {
      expect(nativeMenu).toContain(route)
    }
    expect(nativeMenu).toContain('org=${encodeURIComponent(org.slug)}')
    expect(poloPage).toContain('organizationSlugOverride')
    expect(access).toContain('resolveXpexOrganizationBySlug')
    for (const route of ['/dash/users/settings/usergroups', '/dash/courses', '/dash/library', '/dash/analytics', '/dash/org/settings/general']) {
      expect(poloSections).toContain(route)
    }
    expect(poloDashboard).toContain("native('/dash/users/settings/users')")
    expect(poloDashboard).not.toContain("native('/dash/users')")
  })

  test('keeps native course package import functional without visible legacy branding', () => {
    expect(importSelector).toContain('FileArchive')
    expect(importSelector).toContain("onSelectType('learnhouse')")
    expect(importSelector).toContain('Pacote de curso')
    expect(importSelector).not.toContain('courses.import.learnhouse_courses')
    expect(importSelector).not.toContain('courses.import.learnhouse_description')
    expect(importSelector).not.toMatch(/LearnHouse|Learnhouse/)
  })

  test('removes visible legacy platform branding from student and polo surfaces', () => {
    expect(studentCourse).not.toMatch(/LearnHouse|Learnhouse/)
    expect(poloSections).not.toContain('motor acadêmico')
    expect(poloSections).not.toContain('Abrir Analytics')
    expect(poloDashboard).not.toContain('<strong>Abrir ${courses[0].title}</strong>')
  })

  test('darkens pastel surfaces before lifting gray foreground contrast', () => {
    expect(nativeTheme).toContain('bg-blue-50')
    expect(nativeTheme).toContain('bg-amber-50')
    expect(nativeTheme).toContain('bg-indigo-50')
    expect(nativeTheme).toContain('background-color: var(--xpex-native-surface-2) !important')
  })
})