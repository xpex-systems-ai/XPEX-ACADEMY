import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { resolveXpexAccess, resolveXpexOrganization, resolveXpexPoloAccess, safeLoginNext, xpexRoleForMembership } from '../lib/xpex/access.ts'
import { safeAuthReturnPath } from '../lib/proxyPaths.ts'

const membership = (role_uuid, slug = 'kelle-digital-lab', name) => ({ role: { name, role_uuid }, org: { slug } })

describe('XpeX server-authoritative role mapping', () => {
  test('maps existing LearnHouse roles without accepting a requested UI role', () => {
    expect(xpexRoleForMembership(membership('role_global_admin'))).toBe('polo')
    expect(xpexRoleForMembership(membership('role_global_instructor'))).toBe('professora')
    expect(xpexRoleForMembership(membership('role_global_user'))).toBe('aluno')
    expect(xpexRoleForMembership(membership('custom_role', 'kelle-digital-lab', 'Admin'))).toBeNull()
  })

  test('scopes roles to the pilot organization and never elevates unknown roles', () => {
    expect(resolveXpexAccess([membership('role_global_user'), membership('role_global_admin', 'other-org')], 'kelle-digital-lab')).toEqual(['aluno'])
    expect(resolveXpexAccess([membership('role_unknown')], 'kelle-digital-lab')).toEqual([])
  })

  test('resolves an authorized organization without trusting a requested slug', () => {
    expect(resolveXpexOrganization([membership('role_global_user', 'academy-one')])).toEqual({ slug: 'academy-one' })
    expect(resolveXpexOrganization([membership('role_unknown', 'academy-two'), membership('role_global_user', 'academy-three')])).toEqual({ slug: 'academy-three' })
    expect(resolveXpexOrganization([])).toBeNull()
  })

  test('selects an organization that actually authorizes the requested experience', () => {
    const memberships = [
      membership('role_global_instructor', 'academy-teachers'),
      membership('role_global_user', 'academy-students'),
    ]
    expect(resolveXpexOrganization(memberships, 'aluno')).toEqual({ slug: 'academy-students' })
    expect(resolveXpexOrganization(memberships, 'professora')).toEqual({ slug: 'academy-teachers' })
    expect(resolveXpexOrganization(memberships, 'polo')).toBeNull()
  })

  test('allows multiple experiences only when memberships really provide them', () => {
    expect(resolveXpexAccess([membership('role_global_instructor'), membership('role_global_user')], 'kelle-digital-lab')).toEqual(['professora', 'aluno'])
  })

  test('authorizes each canonical membership only for its own experience', () => {
    expect(resolveXpexAccess([membership('role_global_user')], 'kelle-digital-lab')).toEqual(['aluno'])
    expect(resolveXpexAccess([membership('role_global_instructor')], 'kelle-digital-lab')).toEqual(['professora'])
    expect(resolveXpexAccess([membership('role_global_admin')], 'kelle-digital-lab')).toEqual(['polo'])
  })

  test('unifies manager and teacher capabilities without elevating a teacher-only account', () => {
    const managerTeacher = resolveXpexPoloAccess([
      membership('role_global_admin'),
      membership('role_global_instructor'),
    ], 'kelle-digital-lab')
    expect(managerTeacher?.experience).toBe('polo_unificado')
    expect(managerTeacher?.isManager).toBe(true)
    expect(managerTeacher?.isTeacher).toBe(true)
    expect(managerTeacher?.capabilities).toContain('manage_students')

    const teacher = resolveXpexPoloAccess([membership('role_global_instructor')], 'kelle-digital-lab')
    expect(teacher?.experience).toBe('polo_unificado_reduced')
    expect(teacher?.isManager).toBe(false)
    expect(teacher?.capabilities).not.toContain('manage_students')
    expect(resolveXpexPoloAccess([membership('role_global_user')], 'kelle-digital-lab')).toBeNull()
  })
})

describe('safe login return path', () => {
  test('accepts local paths and rejects external or protocol-relative targets', () => {
    expect(safeLoginNext('/xpex/aluno')).toBe('/xpex/aluno')
    expect(safeLoginNext('//evil.example')).toBe('/xpex')
    expect(safeLoginNext('https://evil.example')).toBe('/xpex')
    expect(safeLoginNext('/\\evil.example')).toBe('/xpex')
  })

  test('auth bridge consumes a validated next path instead of forwarding it as a query', () => {
    expect(safeAuthReturnPath('/xpex')).toBe('/xpex')
    expect(safeAuthReturnPath('/xpex/professora?tab=turma')).toBe('/xpex/professora?tab=turma')
    expect(safeAuthReturnPath(null)).toBe('/home')
    expect(safeAuthReturnPath('//evil.example')).toBe('/home')
    expect(safeAuthReturnPath('https://evil.example/xpex')).toBe('/home')
    expect(safeAuthReturnPath('http://evil.example/xpex')).toBe('/home')
    expect(safeAuthReturnPath('javascript:alert(1)')).toBe('/home')
    expect(safeAuthReturnPath('data:text/html,evil')).toBe('/home')
    expect(safeAuthReturnPath('/\\evil.example')).toBe('/home')
    expect(safeAuthReturnPath('/%2f%2fevil.example')).toBe('/home')
    expect(safeAuthReturnPath('/%5cevil.example')).toBe('/home')
    expect(safeAuthReturnPath('/xpex%00/evil')).toBe('/home')
    expect(safeAuthReturnPath('/xpex%0a/evil')).toBe('/home')
    expect(safeAuthReturnPath('/%E0%A4%A')).toBe('/home')
  })
})

describe('server-authoritative XpeX routes', () => {
  const boundary = readFileSync(new URL('../components/Xpex/AuthenticatedXpexExperience.tsx', import.meta.url), 'utf8')
  const rolePage = readFileSync(new URL('../app/xpex/[role]/page.tsx', import.meta.url), 'utf8')
  const authenticatedDashboard = readFileSync(new URL('../components/Xpex/experiences/AuthenticatedDashboard.tsx', import.meta.url), 'utf8')

  test('resolves the LearnHouse server session before selecting an experience', () => {
    expect(boundary).toContain("import { getServerSession } from '@/lib/auth/server'")
    expect(boundary).toContain('const session = await getServerSession()')
    expect(boundary).toContain('resolveOperationalOrganization(memberships, isSuperadmin)')
    expect(boundary).toContain('resolveXpexOrganization(memberships, isSuperadmin ? undefined : requestedRole)')
    expect(boundary).toContain('noOrganization={!hasOrganizationMembership}')
    expect(boundary).not.toContain("'use client'")
  })

  test('normalizes teacher and manager operational entry without granting manager capabilities', () => {
    expect(boundary).toContain("requestedRole === 'polo' || requestedRole === 'professora'")
    expect(boundary).toContain('shouldUseUnifiedPolo')
    expect(boundary).toContain("? 'polo'")
    expect(boundary).toContain("canonicalRoles.filter(item => item !== 'polo' && item !== 'professora')")
    expect(boundary).toContain('poloAccess?.isTeacher')
    expect(boundary).toContain('poloAccess?.isManager')
  })

  test('redirects unauthenticated requests and denies missing, unsupported, or tampered roles', () => {
    expect(boundary).toContain('if (!session?.user) redirect(')
    expect(boundary).toContain('`/login?next=${encodeURIComponent(returnPath)}`')
    expect(boundary).toContain("role === 'polo' ? !poloAccess : !roles.includes(role)")
    expect(rolePage).toContain('requestedRole={role as XpexExperienceRole}')
  })

  test('keeps authenticated dashboards separate from fictitious beta indicators', () => {
    expect(boundary).toContain('<AuthenticatedDashboard')
    expect(boundary).toContain('role={role}')
    expect(boundary).toContain('displayName={displayName}')
    expect(boundary).not.toContain('StudentExperience')
    expect(authenticatedDashboard).toContain('dados disponíveis')
    expect(authenticatedDashboard).not.toMatch(/value="(?:\d+|\d+%)"/)
  })

  test('does not probe Course Studio to infer administrative access', () => {
    expect(boundary).not.toContain('listCourseStudioDrafts')
    expect(boundary).toContain('resolveXpexPoloAccess')
  })
})

describe('production-aligned Academy authentication', () => {
  const serverAuth = readFileSync(new URL('../lib/auth/server.ts', import.meta.url), 'utf8')
  const learningDashboard = readFileSync(new URL('../lib/xpex/learning-dashboard.ts', import.meta.url), 'utf8')
  const authService = readFileSync(new URL('../services/auth/auth.ts', import.meta.url), 'utf8')

  test('resolves backend URLs through runtime configuration on server requests', () => {
    expect(serverAuth).toContain("import { getBackendUrl } from '@services/config/config'")
    expect(serverAuth).not.toContain('process.env.NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL')
    expect(learningDashboard).toContain('getBackendUrl()')
    expect(learningDashboard).not.toContain('process.env.NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL')
  })

  test('keeps login, refresh, and logout on the same-origin auth gateway', () => {
    expect(authService).toContain("fetch('/api/auth/login'")
    expect(authService).toContain("fetch('/api/auth/refresh'")
    expect(authService).toContain("fetch('/api/auth/logout'")
  })
})

describe('PR-03 conditional authenticated entry', () => {
  const homePage = readFileSync(new URL('../app/home/page.tsx', import.meta.url), 'utf8')
  const login = readFileSync(new URL('../app/auth/login/login.tsx', import.meta.url), 'utf8')
  const proxy = readFileSync(new URL('../proxy.ts', import.meta.url), 'utf8')
  const boundary = readFileSync(new URL('../components/Xpex/AuthenticatedXpexExperience.tsx', import.meta.url), 'utf8')
  const shell = readFileSync(new URL('../components/Xpex/XpexAuthenticatedShell.tsx', import.meta.url), 'utf8')
  const dashboard = readFileSync(new URL('../components/Xpex/experiences/AuthenticatedDashboard.tsx', import.meta.url), 'utf8')
  const betaStudent = readFileSync(new URL('../app/beta/aluno/page.tsx', import.meta.url), 'utf8')

  test('preserves next=/xpex, falls back to home, and lets stale sessions reach login', () => {
    expect(safeAuthReturnPath('/xpex')).toBe('/xpex')
    expect(safeAuthReturnPath(null)).toBe('/home')
    expect(login).toContain("safeAuthReturnPath(params.get('next') ?? params.get('redirect'))")

    const authPagesStart = proxy.indexOf("const authPaths =")
    const authCallbacksStart = proxy.indexOf("// 4. Auth callbacks")
    const authPagesBlock = proxy.slice(authPagesStart, authCallbacksStart)
    expect(authPagesStart).toBeGreaterThan(-1)
    expect(authCallbacksStart).toBeGreaterThan(authPagesStart)
    expect(authPagesBlock).not.toContain("req.cookies.get('LH_session')")
    expect(authPagesBlock).not.toContain('NextResponse.redirect')
    expect(authPagesBlock).toContain('new URL(`/auth${pathname}${search}`')
    expect(login).not.toContain("const isAuthenticated = session?.status === 'authenticated'")
    expect(login).not.toContain('router.replace(safeAuthReturnPath')
    expect(login).toContain("window.location.href = callbackUrl")
  })

  test('redirects only an authenticated pilot member from home to XpeX without a loop', () => {
    expect(homePage).toContain('resolveXpexOrganization(session?.roles)?.slug')
    expect(homePage).toContain("redirect('/xpex')")
    expect(homePage).toContain('<HomeClient/>')
    expect(boundary).not.toContain("redirect('/home')")
  })

  test('uses real authenticated identity and never presents the showroom visitor', () => {
    expect(boundary).toContain('session.user.last_name')
    expect(boundary).toContain('organizationName={organizationName}')
    expect(`${boundary}\n${shell}\n${dashboard}`).not.toContain('Visitante')
  })

  test('keeps authenticated components isolated from public Beta data and fixed metrics', () => {
    for (const source of [boundary, shell, dashboard]) {
      expect(source).not.toMatch(/(?:from|import\()\s*['"][^'"]*(?:\/beta\/|StudentExperience|TeacherExperience|PoleExperience)/)
    }
    expect(dashboard).not.toMatch(/value="(?:[1-9]\d*|[1-9]\d*%)"/)
    expect(betaStudent).toContain('<BetaShell role="aluno" />')
    expect(proxy).toContain("if (isPublicBetaPath(pathname))")
  })

  test('leaves unrelated LearnHouse routing and the organization selector in place', () => {
    expect(proxy).toContain("const HUB_ROOT_PATHS = ['/home', '/organizations', '/account', '/billing', '/subscriptions', '/new']")
    expect(proxy).toContain('tenantScopedPath(resolved.slug, pathname)')
    expect(homePage).toContain("import HomeClient from './home'")
  })
})
