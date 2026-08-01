import { describe, expect, test } from 'bun:test'
import { isPublicBetaPath, tenantScopedPath } from '../lib/proxyPaths.ts'

describe('public beta proxy routing', () => {
  test('/beta/aluno bypasses the tenant-scoped rewrite', () => {
    expect(isPublicBetaPath('/beta/aluno')).toBe(true)
  })

  test('/beta/professora bypasses the tenant-scoped rewrite', () => {
    expect(isPublicBetaPath('/beta/professora')).toBe(true)
  })

  test('the beta root and nested paths are public, without matching lookalikes', () => {
    expect(isPublicBetaPath('/beta')).toBe(true)
    expect(isPublicBetaPath('/beta/estado/vazio')).toBe(true)
    expect(isPublicBetaPath('/betamax')).toBe(false)
  })
})

describe('tenant-scoped proxy routing', () => {
  test('non-beta tenant routes keep the existing /orgs/{slug} rewrite', () => {
    expect(isPublicBetaPath('/course/curso-piloto')).toBe(false)
    expect(tenantScopedPath('turma-demo', '/course/curso-piloto'))
      .toBe('/orgs/turma-demo/course/curso-piloto')
  })

  test('the current rewrite preserves root and internal tenant paths', () => {
    expect(tenantScopedPath('turma-demo', '/')).toBe('/orgs/turma-demo/')
    expect(tenantScopedPath('turma-demo', '/account/general'))
      .toBe('/orgs/turma-demo/account/general')
  })
})
