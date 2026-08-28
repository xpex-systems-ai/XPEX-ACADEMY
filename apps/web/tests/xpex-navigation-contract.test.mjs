import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  xpexAdminRoute,
  xpexControlCenterRoute,
  xpexCourseStudioRoute,
  xpexLearnerCoursesRoute,
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
      xpexControlCenterRoute(),
      xpexLearnerCoursesRoute(),
    ]

    for (const route of fixedRoutes) {
      const directPage = appRoute(route)
      const rolePage = route === '/xpex/aluno' || route === '/xpex/polo'
        ? join(webRoot, 'app/xpex/[role]/page.tsx')
        : directPage
      expect(existsSync(rolePage)).toBe(true)
    }
    expect(xpexCourseStudioRoute('authorized-polo')).toBe('/course-studio')
    expect(xpexPoloCoursesRoute('authorized-polo')).toBe('/dash/courses')
    expect(existsSync(join(webRoot, 'app/orgs/[orgslug]/dash/courses/page.tsx'))).toBe(true)
    expect(existsSync(join(webRoot, 'app/orgs/[orgslug]/(withmenu)/course-studio/page.tsx'))).toBe(true)
  })

  test('never generates the production dead routes', () => {
    const generated = [xpexCourseStudioRoute('non-default'), xpexPoloCoursesRoute('non-default')]
    expect(generated).not.toContain('/orgs/default/course-studio')
    expect(generated).not.toContain('/orgs/default/courses')
    expect(generated.every(route => !route.includes('/orgs/'))).toBe(true)
    expect(xpexCourseStudioRoute('non-default')).not.toBe(xpexControlCenterRoute())
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

    const english = JSON.parse(readFileSync(join(webRoot, 'locales/en.json'), 'utf8'))
    expect(catalog.auth.sign_in_with_google).toBe('Entrar com Google')
    expect(catalog.auth.sign_up).toBe('Cadastrar-se')
    expect(english.auth.sign_in_with_google).toBe('Sign in with Google')
    expect(english.auth.sign_up).toBe('Sign up')
    expect(login).toContain("t('auth.sign_in_with_google')")
    expect(login).toContain("t('auth.sign_up')")
    expect(login).not.toContain("t('auth.sign_in_with_google', { defaultValue:")
    expect(login).not.toContain("t('auth.sign_up', { defaultValue:")
  })
})
