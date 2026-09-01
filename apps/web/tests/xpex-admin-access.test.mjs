import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const source = relativePath => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

describe('native OSS administration entry', () => {
  const legacyAdminPage = source('../app/admin/(dashboard)/page.tsx')
  const nativeAdminPage = source('../app/xpex/admin/page.tsx')
  const serverAuth = source('../lib/auth/server.ts')
  const sessionMerge = source('../lib/auth/server-session.ts')
  const experience = source('../components/Xpex/AuthenticatedXpexExperience.tsx')
  const shell = source('../components/Xpex/XpexAuthenticatedShell.tsx')
  const proxy = source('../proxy.ts')
  const authRedirect = source('../app/redirect_from_auth/route.ts')

  test('keeps the legacy admin entry separate from the native OSS workspace', () => {
    expect(legacyAdminPage).toContain("redirect('/xpex/admin')")
    expect(proxy).toContain("if (pathname === '/admin')")
    expect(proxy).toContain('NextResponse.redirect(new URL(`/xpex/admin${search}`, req.url), 307)')
    expect(nativeAdminPage).toContain('Área administrativa nativa da XPeX Academy')
    expect(nativeAdminPage).not.toContain('Not Available in OSS Mode')
  })

  test('does not redirect nested platform-superadmin routes into organization administration', () => {
    expect(proxy).toContain("if (pathname === '/admin' || pathname.startsWith('/admin/'))")
    expect(proxy.indexOf("if (pathname === '/admin')")).toBeLessThan(
      proxy.indexOf("if (pathname === '/admin' || pathname.startsWith('/admin/'))"),
    )
  })

  test('requires a real session and explicit canonical superadmin state', () => {
    expect(nativeAdminPage).toContain('const session = await getServerSession()')
    expect(nativeAdminPage).toContain("if (!session?.user) redirect('/login?next=%2Fxpex%2Fadmin')")
    expect(nativeAdminPage).toContain('const isSuperadmin = session.user.is_superadmin === true')
    expect(nativeAdminPage).toContain("if (!isSuperadmin) redirect('/xpex?admin=forbidden')")
    expect(nativeAdminPage).not.toContain('capabilityAdmin')
    expect(nativeAdminPage).not.toMatch(/xpeacademy@outlook\.com/i)
  })

  test('never lets stale profile/token claims elevate platform superadmin access', () => {
    expect(serverAuth).toContain('mergeAuthoritativeSessionUser(')
    expect(sessionMerge).toContain('is_superadmin: canonicalSessionUser.is_superadmin === true')
    expect(sessionMerge).not.toContain('canonicalSessionUser.is_superadmin === true ||')
    expect(sessionMerge).not.toContain('profileUser.is_superadmin === true')
  })

  test('keeps the auth handoff deterministic and leaves authority at the destination', () => {
    expect(authRedirect).toContain('safeAuthReturnPath(')
    expect(authRedirect).toContain('Authorization stays at the destination itself')
    expect(authRedirect).toContain('NextResponse.redirect(new URL(requested, request.nextUrl.origin))')
    expect(authRedirect).not.toMatch(/xpeacademy@outlook\.com/i)
    expect(proxy).not.toContain("if (pathname === '/redirect_from_auth')")
  })

  test('does not reveal platform-admin navigation to organization managers', () => {
    expect(experience).toContain('resolveXpexPoloAccess(memberships, organizationSlug, isSuperadmin)')
    expect(experience).toContain('const adminAccess = isSuperadmin')
    expect(experience).toContain('adminAccess={adminAccess}')
    expect(shell).toContain('{adminAccess && <AdminEntry')
    expect(shell).toContain('href="/xpex/admin"')
  })

  test('builds management links only from the organization in the authenticated membership', () => {
    expect(nativeAdminPage).toContain('const organization = resolveXpexOrganization(memberships)')
    expect(nativeAdminPage).toContain('xpexCourseStudioRoute(organization.slug)')
    expect(nativeAdminPage).toContain('xpexPoloCoursesRoute(organization.slug)')
    expect(nativeAdminPage).not.toContain('/course-studio`}')
    expect(nativeAdminPage).not.toContain('/courses`}')
  })
})
