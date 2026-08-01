import { describe, expect, test } from 'bun:test'
import { isPublicRootRequest, isVercelPreviewHost } from '../lib/proxyHosts.ts'
import { tenantScopedPath } from '../lib/proxyPaths.ts'

describe('public root host routing', () => {
  test('recognizes the official XpeX Vercel deployment', () => {
    expect(isVercelPreviewHost('xpex-academy-ai.vercel.app')).toBe(true)
    expect(isPublicRootRequest('/', 'xpex-academy-ai.vercel.app', ['localhost']))
      .toBe(true)
  })

  test('recognizes generated Vercel preview deployment hosts', () => {
    expect(isPublicRootRequest(
      '/',
      'xpex-academy-ai-git-fix-root-xpex.vercel.app',
      ['localhost'],
    )).toBe(true)
  })

  test('keeps localhost and the configured apex public', () => {
    expect(isPublicRootRequest('/', 'localhost:3000', ['localhost'])).toBe(true)
    expect(isPublicRootRequest('/', 'academy.example.com', ['academy.example.com']))
      .toBe(true)
  })

  test('rejects the Vercel apex and lookalike suffixes', () => {
    expect(isVercelPreviewHost('vercel.app')).toBe(false)
    expect(isVercelPreviewHost('vercel.app.evil.com')).toBe(false)
    expect(isVercelPreviewHost('preview.vercel.app.evil.com')).toBe(false)
  })

  test('does not make existing tenant routes public', () => {
    expect(isPublicRootRequest(
      '/course/curso-piloto',
      'xpex-academy-ai.vercel.app',
      ['localhost'],
    )).toBe(false)
    expect(tenantScopedPath('turma-demo', '/course/curso-piloto'))
      .toBe('/orgs/turma-demo/course/curso-piloto')
  })

  test('keeps tenant and custom-domain roots out of the public landing', () => {
    expect(isPublicRootRequest('/', 'turma.academy.example.com', ['academy.example.com']))
      .toBe(false)
    expect(isPublicRootRequest('/', 'courses.customer.example', ['academy.example.com']))
      .toBe(false)
  })
})
