import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const WEB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (...parts) => readFileSync(join(WEB_ROOT, ...parts), 'utf8')

const section = read('components/Xpex/experiences/XpexPoloSection.tsx')
const studio = read('components/Xpex/experiences/XpexCourseStudio.tsx')
const routeMap = read('lib/xpexRouteMap.ts')
const shell = read('components/Xpex/XpexAuthenticatedShell.tsx')
const dashboard = read('components/Xpex/experiences/AuthenticatedDashboard.tsx')
const aiLab = read('app/xpex/ai-lab/page.tsx')
const community = read('app/xpex/community/page.tsx')

const rawPoloDestinations = [
  '/dash/users/settings/usergroups',
  '/dash/courses',
  '/dash/library',
  '/dash/analytics',
  '/dash/org/settings/general',
]

describe('XPEX V6-004.2 Learning Core containment', () => {
  test('keeps Polo section CTAs away from raw academic-engine dashboards', () => {
    for (const destination of rawPoloDestinations) expect(section).not.toContain(destination)
    expect(section).not.toContain('getUriWithOrg')
    expect(section).toContain("section === 'cursos'")
    expect(section).toContain('<XpexCourseStudio')
  })

  test('keeps overview operations on XPeX routes while preserving admin-only native helpers', () => {
    for (const href of ['/xpex/polo/turmas', '/xpex/polo/cursos', '/xpex/polo/alunos', '/xpex/polo/relatorios']) {
      expect(dashboard).toContain(`href="${href}"`)
    }
    expect(routeMap).toContain("getUriWithOrg(orgSlug, '/course-studio')")
    expect(routeMap).toContain("getUriWithOrg(orgSlug, '/dash/courses')")
  })

  test('course creation remains operational without visible LearnHouse branding', () => {
    for (const operation of [
      'generateCourseStudioDraft',
      'editCourseStudioDraft',
      'reviewCourseStudioDraft',
      'approveCourseStudioDraft',
      'publishCourseStudioDraft',
    ]) expect(studio).toContain(operation)
    expect(studio).not.toContain('LearnHouse')
    expect(studio).not.toContain('/orgs/')
    expect(studio).toContain('O motor acadêmico continua operando em segundo plano')
  })

  test('keeps student Lab and community routes inside XPeX', () => {
    expect(aiLab).not.toContain('LearnHouse')
    expect(aiLab).not.toContain('`/orgs/${organizationSlug}')
    expect(community).not.toContain('`/orgs/${learning.organization.slug}/community/')
    expect(community).toContain('`/xpex/community/${communityRouteId(community.community_uuid)}`')
  })

  test('keeps branded user identity inside XPeX while preserving Super Admin native controls', () => {
    expect(shell).toContain("const profileHref = adminNavigation ? getUriWithOrg(organizationSlug, '/account/profile') : null")
    expect(shell).toContain("'Turmas': getUriWithOrg(organizationSlug, '/dash/users/settings/usergroups')")
    expect(shell).toContain("'Cursos': getUriWithOrg(organizationSlug, '/dash/courses')")
    expect(shell).toContain('adminNavigation')
  })
})
