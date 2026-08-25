import { describe, expect, test } from 'bun:test'

/**
 * Public, non-destructive portion of XPEX-LAUNCH-001.
 *
 * Set XPEX_LAUNCH_BASE_URL to the operator-confirmed canonical HTTPS origin.
 * Authenticated, tenant-isolation, progress, and mailbox checks deliberately
 * remain manual: this test must never create users or embed production secrets.
 */
const configuredBaseUrl = process.env.XPEX_LAUNCH_BASE_URL?.trim()
const liveTest = configuredBaseUrl ? test : test.skip

function canonicalOrigin(value) {
  const url = new URL(value)
  expect(url.protocol).toBe('https:')
  expect(url.username).toBe('')
  expect(url.password).toBe('')
  expect(url.pathname).toBe('/')
  expect(url.search).toBe('')
  expect(url.hash).toBe('')
  expect(['localhost', '127.0.0.1', '::1']).not.toContain(url.hostname)
  return url.origin
}

describe('Production student launch gate: public smoke', () => {
  test('requires an explicit canonical URL for live checks', () => {
    if (configuredBaseUrl) expect(canonicalOrigin(configuredBaseUrl)).toBe(configuredBaseUrl.replace(/\/$/, ''))
    else expect(configuredBaseUrl).toBeUndefined()
  })

  for (const path of ['/', '/login', '/forgot']) {
    liveTest(`loads ${path} without a server error`, async () => {
      const origin = canonicalOrigin(configuredBaseUrl)
      const response = await fetch(`${origin}${path}`, { redirect: 'follow' })
      expect(response.status).toBeGreaterThanOrEqual(200)
      expect(response.status).toBeLessThan(400)
      expect(response.url.startsWith(`${origin}/`)).toBe(true)
    })
  }

  liveTest('an anonymous /xpex request preserves its destination', async () => {
    const origin = canonicalOrigin(configuredBaseUrl)
    const response = await fetch(`${origin}/xpex`, { redirect: 'manual' })
    expect([301, 302, 303, 307, 308]).toContain(response.status)

    const location = new URL(response.headers.get('location'), origin)
    expect(location.origin).toBe(origin)
    expect(location.pathname).toBe('/login')
    expect(location.searchParams.get('next')).toBe('/xpex')
  })
})
