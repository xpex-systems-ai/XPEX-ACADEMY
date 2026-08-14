import { describe, expect, test } from 'bun:test'
import { resolveXpexAccess, safeLoginNext, xpexRoleForMembership } from '../lib/xpex/access.ts'
import { safeAuthReturnPath } from '../lib/proxyPaths.ts'

const membership = (name, slug = 'kelle-digital-lab', role_uuid) => ({ role: { name, role_uuid }, org: { slug } })

describe('XpeX server-authoritative role mapping', () => {
  test('maps existing LearnHouse roles without accepting a requested UI role', () => {
    expect(xpexRoleForMembership(membership('Admin'))).toBe('polo')
    expect(xpexRoleForMembership(membership('Instructor'))).toBe('professora')
    expect(xpexRoleForMembership(membership('Member'))).toBe('aluno')
    expect(xpexRoleForMembership(membership(undefined, 'kelle-digital-lab', 'role_global_user'))).toBe('aluno')
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

  test('auth bridge consumes a validated next path instead of forwarding it as a query', () => {
    expect(safeAuthReturnPath('/xpex')).toBe('/xpex')
    expect(safeAuthReturnPath('/xpex/professora?tab=turma')).toBe('/xpex/professora?tab=turma')
    expect(safeAuthReturnPath('//evil.example')).toBe('/xpex')
    expect(safeAuthReturnPath('https://evil.example/xpex')).toBe('/xpex')
    expect(safeAuthReturnPath('http://evil.example/xpex')).toBe('/xpex')
    expect(safeAuthReturnPath('javascript:alert(1)')).toBe('/xpex')
    expect(safeAuthReturnPath('data:text/html,evil')).toBe('/xpex')
    expect(safeAuthReturnPath('/\\evil.example')).toBe('/xpex')
  })
})
