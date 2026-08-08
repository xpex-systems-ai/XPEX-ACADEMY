import { describe, expect, test } from 'bun:test'
import { resolveXpexAccess, safeLoginNext, xpexRoleForMembership } from '../lib/xpex/access.ts'

const membership = (name, slug = 'kelle-digital-lab', roleUuid) => ({
  role: { name, role_uuid: roleUuid },
  org: { slug },
})

describe('XpeX server-authoritative role mapping', () => {
  test('maps existing LearnHouse roles without accepting a requested UI role', () => {
    expect(xpexRoleForMembership(membership('Admin'))).toBe('polo')
    expect(xpexRoleForMembership(membership('Instructor'))).toBe('professora')
    expect(xpexRoleForMembership(membership('Member'))).toBe('aluno')
  })

  test('maps the seeded global User role to aluno', () => {
    expect(xpexRoleForMembership(membership('User', 'kelle-digital-lab', 'role_global_user'))).toBe('aluno')
    expect(xpexRoleForMembership(membership(undefined, 'kelle-digital-lab', 'role_global_user'))).toBe('aluno')
  })

  test('normalizes whitespace and role prefixes safely', () => {
    expect(xpexRoleForMembership(membership('  Teacher  '))).toBe('professora')
    expect(xpexRoleForMembership(membership(undefined, 'kelle-digital-lab', 'role_organization_admin'))).toBe('polo')
  })

  test('scopes roles to the pilot organization and never elevates unknown roles', () => {
    expect(resolveXpexAccess([membership('Member'), membership('Admin', 'other-org')], 'kelle-digital-lab')).toEqual(['aluno'])
    expect(resolveXpexAccess([membership('Owner')], 'kelle-digital-lab')).toEqual([])
  })

  test('allows multiple experiences only when memberships really provide them', () => {
    expect(resolveXpexAccess([membership('Instructor'), membership('Member')], 'kelle-digital-lab')).toEqual(['professora', 'aluno'])
  })
})

describe('safe login return path', () => {
  test('accepts local paths and rejects external or protocol-relative targets', () => {
    expect(safeLoginNext('/xpex/aluno')).toBe('/xpex/aluno')
    expect(safeLoginNext('//evil.example')).toBe('/xpex')
    expect(safeLoginNext('https://evil.example')).toBe('/xpex')
    expect(safeLoginNext('/\\evil.example')).toBe('/xpex')
  })
})
