import { describe, expect, test } from 'bun:test'
import { resolveXpexPoloAccess } from '../lib/xpex/access.ts'
import { authorizePoloManager, canAccessPoloSection, canNavigatePolo, poloSectionPolicy } from '../lib/xpex/polo-policy.ts'
import { resolvePoloBranding, safePoloImage } from '../lib/xpex/polo-branding.ts'

// Isolated test fixtures; never written to a database or used as product content.
const membership = (role, slug = 'org-a') => ({ role: { role_uuid: role }, org: { slug } })
const session = role => ({ user: {}, roles: [membership(role)], tokens: { access_token: 'test-only' } })
const manager = resolveXpexPoloAccess(session('role_global_admin').roles, 'org-a')
const teacher = resolveXpexPoloAccess(session('role_global_instructor').roles, 'org-a')

describe('Polo authorization and navigation', () => {
  test.each(['role_global_admin', 'role_global_maintainer'])('validates %s against the live Core before granting administration', async role => {
    const calls = []
    const result = await authorizePoloManager(session(role), 'org-a', async (...args) => { calls.push(args); return [] })
    expect(result).toEqual([])
    expect(calls).toEqual([['test-only', 'org-a']])
  })
  test.each([
    ['teacher', session('role_global_instructor'), 'org-a'],
    ['student', session('role_global_user'), 'org-a'],
    ['no session', null, 'org-a'],
    ['no organization', { ...session('role_global_admin'), roles: [] }, 'org-a'],
    ['no token', { ...session('role_global_admin'), tokens: {} }, 'org-a'],
    ['cross tenant', session('role_global_admin'), 'org-b'],
    ['custom role', session('custom_admin'), 'org-a'],
  ])('denies %s before calling the Core', async (_label, principal, slug) => {
    let calls = 0
    await expect(authorizePoloManager(principal, slug, async () => { calls++; return [] })).rejects.toThrow()
    expect(calls).toBe(0)
  })
  test('does not cache authorization or trust stale manager claims', async () => {
    let authorized = true
    const verify = async () => { if (!authorized) throw Error('403'); return [] }
    await authorizePoloManager(session('role_global_admin'), 'org-a', verify)
    authorized = false
    await expect(authorizePoloManager(session('role_global_admin'), 'org-a', verify)).rejects.toThrow('403')
  })
  test('keeps an admin in another organization from managing the teacher organization', async () => {
    const principal = { ...session('role_global_instructor'), roles: [membership('role_global_instructor'), membership('role_global_admin', 'org-b')] }
    await expect(authorizePoloManager(principal, 'org-a', async () => [])).rejects.toThrow()
  })
  test('contains unimplemented modules and denies teacher administrative sections', () => {
    for (const [section, policy] of Object.entries(poloSectionPolicy)) {
      expect(canAccessPoloSection(teacher, section)).toBe(false)
      expect(canAccessPoloSection(manager, section)).toBe(true)
      expect(canNavigatePolo(manager, `/xpex/polo/${section}`)).toBe(policy.status === 'NATIVE_BRIDGE')
      expect(canNavigatePolo(teacher, `/xpex/polo/${section}`)).toBe(false)
      expect(canNavigatePolo(null, `/xpex/polo/${section}`)).toBe(false)
    }
    expect(canNavigatePolo(teacher, '/xpex/polo#cursos')).toBe(true)
    expect(canNavigatePolo(teacher, '/xpex/polo/alunos')).toBe(false)
    expect(canNavigatePolo(manager, '/xpex/polo/alunos')).toBe(true)
    expect(canAccessPoloSection(manager, '__proto__')).toBe(false)
    expect(canNavigatePolo({ ...manager, capabilities: [] }, '/xpex/polo/alunos')).toBe(false)
  })
})

describe('Organization branding contract', () => {
  const branding = { organization_name: 'Organization A', logo: '/logo.png', teacher_photo: '/teacher.png', primary_color: '#123456', accent_color: '#abc', background: '#12345678', hero_image: '/hero.png', location: 'Test location', coordinator_name: 'Test coordinator', tagline: 'Test tagline', footer_credit: 'Test credit' }
  test.each(['1.4', '2.0'])('resolves all fields from persisted landing JSON v%s', version => {
    const landing = { xpex_polo_branding: branding }
    const config = version === '2.0' ? { config_version: version, customization: { landing } } : { config_version: version, landing }
    expect(resolvePoloBranding({ slug: 'org-a', config: { config } }, 'org-a')).toEqual(branding)
  })
  test('does not transfer identity between organizations', () => {
    expect(resolvePoloBranding({ slug: 'org-b', config: { landing: { xpex_polo_branding: branding } } }, 'org-a', 'Organization A')).toEqual({ organization_name: 'Organization A' })
  })
  test('uses factual fallbacks without inventing location or coordinator', () => {
    const result = resolvePoloBranding({ slug: 'org-a', name: 'Kelle Digital Lab', config: { general: { color: '#abc', footer_text: 'Persisted credit' } } }, 'org-a')
    expect(result.organization_name).toBe('Kelle Digital Lab')
    expect(result.location).toBeUndefined()
    expect(result.coordinator_name).toBeUndefined()
    expect(result.primary_color).toBe('#abc')
    expect(result.footer_credit).toBe('Persisted credit')
    expect(resolvePoloBranding(null, 'org-a')).toEqual({ organization_name: 'Organização atual' })
  })
  test('rejects malformed configuration and unsafe media or CSS', () => {
    for (const value of ['javascript:alert(1)', 'data:text/html,hi', '//host/image', '/\\host/image', 'https://user:password@host/image']) expect(safePoloImage(value)).toBeUndefined()
    const result = resolvePoloBranding({ slug: 'org-a', config: { landing: { xpex_polo_branding: { primary_color: 'url(https://host)', coordinator_name: {}, logo: '//host/image' } } } }, 'org-a')
    expect(result.primary_color).toBeUndefined()
    expect(result.coordinator_name).toBeUndefined()
    expect(result.logo).toBeUndefined()
    expect(resolvePoloBranding({ slug: 'org-a', config: [] }, 'org-a').organization_name).toBe('Organização atual')
  })
})
