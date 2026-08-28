import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  xpexAdminRoute,
  xpexCourseStudioRoute,
  xpexPoloCoursesRoute,
  xpexPoloRoute,
  xpexPoloStudentsRoute,
  xpexStudentRoute,
} from '../lib/xpexRouteMap.ts'

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const appRoute = path => join(webRoot, 'app', ...path.split('/').filter(Boolean), 'page.tsx')

describe('XPeX canonical navigation contract', () => {
  test('maps launch-critical destinations to real App Router pages', () => {
    const fixedRoutes = [
      xpexAdminRoute(),
      xpexPoloRoute(),
      xpexPoloStudentsRoute(),
      xpexStudentRoute(),
      xpexCourseStudioRoute('authorized-polo'),
    ]

    for (const route of fixedRoutes) {
      const directPage = appRoute(route)
      const rolePage = route === '/xpex/aluno' || route === '/xpex/polo'
        ? join(webRoot, 'app/xpex/[role]/page.tsx')
        : directPage
      expect(existsSync(rolePage)).toBe(true)
    }
    expect(xpexPoloCoursesRoute('authorized polo')).toBe('/orgs/authorized%20polo/dash/courses')
    expect(existsSync(join(webRoot, 'app/orgs/[orgslug]/dash/courses/page.tsx'))).toBe(true)
  })

  test('never generates the production dead routes', () => {
    const generated = [xpexCourseStudioRoute('default'), xpexPoloCoursesRoute('default')]
    expect(generated).not.toContain('/orgs/default/course-studio')
    expect(generated).not.toContain('/orgs/default/courses')
  })

  test('keeps active XPeX callers free from legacy course links', () => {
    const callers = [
      'app/xpex/admin/page.tsx',
      'app/xpex/control-center/page.tsx',
      'components/Xpex/experiences/AuthenticatedDashboard.tsx',
    ]
    const banned = /\/orgs\/\$\{[^}]+\}\/(?:course-studio|courses)(?:[?'"`]|$)/

    for (const caller of callers) expect(readFileSync(join(webRoot, caller), 'utf8')).not.toMatch(banned)
  })

  test('keeps student destinations isolated from administrative routes', () => {
    const shell = readFileSync(join(webRoot, 'components/Xpex/XpexAuthenticatedShell.tsx'), 'utf8')
    const studentBlock = shell.slice(shell.indexOf('function StudentNavigation'), shell.indexOf('export function XpexRoleNavigation'))
    expect(studentBlock).not.toContain('xpexCourseStudioRoute')
    expect(studentBlock).not.toContain('xpexPoloCoursesRoute')
    expect(studentBlock).not.toContain('/xpex/control-center')
  })
})

describe('pt-BR login copy', () => {
  test('renders human translations and supplies human fallbacks', () => {
    const catalog = JSON.parse(readFileSync(join(webRoot, 'locales/pt.json'), 'utf8'))
    const login = readFileSync(join(webRoot, 'app/auth/login/login.tsx'), 'utf8')

    expect(catalog.auth.login_with_google).toBe('Entrar com Google')
    expect(catalog.auth.signup).toBe('Criar conta')
    expect(login).toContain("defaultValue: 'Entrar com Google'")
    expect(login).toContain("defaultValue: 'Criar conta'")
  })
})
