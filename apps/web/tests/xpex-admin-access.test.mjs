import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const source = relativePath => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

describe('native OSS administration entry', () => {
  const legacyAdminPage = source('../app/admin/(dashboard)/page.tsx')
  const nativeAdminPage = source('../app/xpex/admin/page.tsx')
  const experience = source('../components/Xpex/AuthenticatedXpexExperience.tsx')
  const shell = source('../components/Xpex/XpexAuthenticatedShell.tsx')

  test('keeps the legacy admin entry separate from the native OSS workspace', () => {
    expect(legacyAdminPage).toContain("redirect('/xpex/admin')")
    expect(nativeAdminPage).toContain('Área administrativa nativa da XPeX Academy')
    expect(nativeAdminPage).not.toContain('Not Available in OSS Mode')
  })

  test('requires a real session and a server-authoritative administrative capability', () => {
    expect(nativeAdminPage).toContain('const session = await getServerSession()')
    expect(nativeAdminPage).toContain("if (!session?.user) redirect('/login?next=%2Fxpex%2Fadmin')")
    expect(nativeAdminPage).toContain('await listCourseStudioDrafts(organization.slug, session.tokens.access_token')
    expect(nativeAdminPage).toContain("if (!isSuperadmin && !capabilityAdmin) redirect('/xpex?admin=forbidden')")
    expect(nativeAdminPage).not.toMatch(/xpeacademy@outlook\.com/i)
  })

  test('reveals navigation only after the backend capability probe succeeds', () => {
    expect(experience).toContain('let adminAccess = isSuperadmin')
    expect(experience).toContain('await listCourseStudioDrafts(organizationSlug, session.tokens.access_token)')
    expect(experience).toContain('adminAccess={adminAccess}')
    expect(shell).toContain('{adminAccess && <AdminEntry')
    expect(shell).toContain('href="/xpex/admin"')
  })

  test('builds management links only from the organization in the authenticated membership', () => {
    expect(nativeAdminPage).toContain('const organization = resolveXpexOrganization(memberships)')
    expect(nativeAdminPage).toContain('const orgPath = organization?.slug ? `/orgs/${encodeURIComponent(organization.slug)}` : null')
    expect(nativeAdminPage).toContain('href={`${orgPath}/course-studio`}')
    expect(nativeAdminPage).toContain('href={`${orgPath}/courses`}')
  })
})
