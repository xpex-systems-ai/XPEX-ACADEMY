import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { resolveXpexAccess, safeLoginNext, xpexRoleForMembership } from '../lib/xpex/access.ts'
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

  test('allows multiple experiences only when memberships really provide them', () => {
    expect(resolveXpexAccess([membership('role_global_instructor'), membership('role_global_user')], 'kelle-digital-lab')).toEqual(['professora', 'aluno'])
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
    expect(safeAuthReturnPath('//evil.example')).toBe('/xpex')
    expect(safeAuthReturnPath('https://evil.example/xpex')).toBe('/xpex')
    expect(safeAuthReturnPath('http://evil.example/xpex')).toBe('/xpex')
    expect(safeAuthReturnPath('javascript:alert(1)')).toBe('/xpex')
    expect(safeAuthReturnPath('data:text/html,evil')).toBe('/xpex')
    expect(safeAuthReturnPath('/\\evil.example')).toBe('/xpex')
    expect(safeAuthReturnPath('/%2f%2fevil.example')).toBe('/xpex')
    expect(safeAuthReturnPath('/%5cevil.example')).toBe('/xpex')
    expect(safeAuthReturnPath('/xpex%00/evil')).toBe('/xpex')
    expect(safeAuthReturnPath('/xpex%0a/evil')).toBe('/xpex')
    expect(safeAuthReturnPath('/%E0%A4%A')).toBe('/xpex')
  })
})

describe('server-authoritative XpeX routes', () => {
  const boundary = readFileSync(new URL('../components/Xpex/AuthenticatedXpexExperience.tsx', import.meta.url), 'utf8')
  const rolePage = readFileSync(new URL('../app/xpex/[role]/page.tsx', import.meta.url), 'utf8')
  const authenticatedDashboard = readFileSync(new URL('../components/Xpex/experiences/AuthenticatedDashboard.tsx', import.meta.url), 'utf8')

  test('resolves the LearnHouse server session before selecting an experience', () => {
    expect(boundary).toContain("import { getServerSession } from '@/lib/auth/server'")
    expect(boundary).toContain('const session = await getServerSession()')
    expect(boundary).toContain("resolveXpexAccess(memberships, PILOT_ORG_SLUG)")
    expect(boundary).not.toContain("'use client'")
  })

  test('redirects unauthenticated requests and denies missing, unsupported, or tampered roles', () => {
    expect(boundary).toContain('if (!session?.user) redirect(')
    expect(boundary).toContain('if (!role || !roles.includes(role)) return <AccessDenied />')
    expect(rolePage).toContain('requestedRole={role as XpexExperienceRole}')
  })

  test('keeps authenticated dashboards separate from fictitious beta indicators', () => {
    expect(boundary).toContain('<AuthenticatedDashboard role={role} displayName={displayName} />')
    expect(boundary).not.toContain('StudentExperience')
    expect(authenticatedDashboard).toContain('Dados reais, quando disponíveis')
    expect(authenticatedDashboard).not.toMatch(/value="(?:\d+|\d+%)"/)
  })
})
