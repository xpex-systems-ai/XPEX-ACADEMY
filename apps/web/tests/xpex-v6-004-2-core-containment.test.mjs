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

describe('XPEX V6-004.2 Learning Core containment', () => {
  test('replaces legacy dashboard chrome without weakening auth gates', () => {
    expect(nativeLayout).toContain('SessionGate')
    expect(nativeLayout).toContain('AdminAuthorization authorizationMode="page"')
    expect(nativeLayout).toContain('CommandPaletteProvider')
    expect(nativeLayout).toContain('XpexNativeAdminMenu')
    expect(nativeLayout).not.toContain('DashLeftMenu')
    expect(nativeLayout).not.toContain('DashMobileMenu')
    expect(nativeLayout).not.toContain('WelcomeModal')
    expect(nativeLayout).not.toContain('OnboardingTracker')
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
  })

  test('keeps real academic destinations but contains them behind the XpeX shell', () => {
    for (const route of ['/dash/users/settings/usergroups', '/dash/courses', '/dash/library', '/dash/analytics', '/dash/org/settings/general']) {
      expect(nativeMenu).toContain(route)
      expect(poloSections).toContain(route)
    }
    expect(nativeMenu).toContain('/xpex/polo/alunos')
    expect(nativeMenu).toContain('/xpex/polo')
  })

  test('removes visible legacy platform branding from student and import surfaces', () => {
    expect(studentCourse).not.toMatch(/LearnHouse|Learnhouse/)
    expect(importSelector).not.toContain('FileArchive')
    expect(importSelector).not.toContain("onSelectType('learnhouse')")
    expect(importSelector).not.toContain('courses.import.learnhouse_courses')
    expect(importSelector).not.toContain('courses.import.learnhouse_description')
    expect(poloSections).not.toContain('motor acadêmico')
    expect(poloSections).not.toContain('Abrir Analytics')
  })
})
