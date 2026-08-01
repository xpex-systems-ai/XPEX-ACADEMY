import { describe, expect, test } from 'bun:test'
import {
  isPublicRootRequest,
  isProxyLocalhost,
  isVercelPreviewHost,
  normalizeProxyHost,
} from '../lib/proxyHosts.ts'
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
      'xpex-academy-isnyr3at9-gxeon.vercel.app',
      [],
    )).toBe(true)
  })

  test('normalizes protocol, port, trailing slash and letter case', () => {
    expect(normalizeProxyHost('HTTPS://XPEX-ACADEMY-AI.VERCEL.APP:443/'))
      .toBe('xpex-academy-ai.vercel.app')
    expect(isPublicRootRequest(
      '/',
      'HTTPS://XPEX-ACADEMY-AI.VERCEL.APP:443/',
      [],
    )).toBe(true)
  })

  test('keeps localhost and the configured apex public', () => {
    for (const host of [
      'localhost',
      'localhost:3000',
      '127.0.0.1',
      '127.0.0.1:3000',
      '[::1]',
      '[::1]:3000',
      '::1',
    ]) {
      expect(isProxyLocalhost(host)).toBe(true)
      expect(isPublicRootRequest('/', host, [])).toBe(true)
    }
    expect(isPublicRootRequest('/', 'academy.example.com', ['academy.example.com']))
      .toBe(true)
  })

  test('rejects non-loopback IPv6 and malicious localhost lookalikes', () => {
    expect(isProxyLocalhost('[2001:db8::1]:3000')).toBe(false)
    expect(isProxyLocalhost('2001:db8::1')).toBe(false)
    expect(isProxyLocalhost('localhost.evil.com')).toBe(false)
    expect(isProxyLocalhost('127.0.0.1.evil.com')).toBe(false)
  })

  test('rejects the Vercel apex and lookalike suffixes', () => {
    expect(isVercelPreviewHost('vercel.app')).toBe(false)
    expect(isVercelPreviewHost('vercel.app.evil.com')).toBe(false)
    expect(isVercelPreviewHost('fakevercel.app')).toBe(false)
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
