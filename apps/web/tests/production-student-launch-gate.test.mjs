import { describe, expect, test } from 'bun:test'
import { isIP } from 'node:net'

/**
 * Public, non-destructive portion of XPEX-LAUNCH-001.
 *
 * Set XPEX_LAUNCH_BASE_URL to the operator-confirmed canonical HTTPS origin.
 * Authenticated, tenant-isolation, progress, and mailbox checks deliberately
 * remain manual: this test must never create users or embed production secrets.
 */
const configuredBaseUrl = process.env.XPEX_LAUNCH_BASE_URL?.trim()
const liveTest = configuredBaseUrl ? test : test.skip

function ipv6Words(hostname) {
  const address = hostname.replace(/^\[|\]$/g, '').toLowerCase()
  const [left = '', right = ''] = address.split('::')
  const leftWords = left ? left.split(':').map(part => Number.parseInt(part, 16)) : []
  const rightWords = right ? right.split(':').map(part => Number.parseInt(part, 16)) : []
  const omitted = 8 - leftWords.length - rightWords.length
  return address.includes('::')
    ? [...leftWords, ...Array(omitted).fill(0), ...rightWords]
    : leftWords
}

function isNonPublicIpv4Octets(octets) {
  return octets[0] === 0
    || octets[0] === 10
    || octets[0] === 127
    || (octets[0] === 169 && octets[1] === 254)
    || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
    || (octets[0] === 192 && octets[1] === 168)
}

function isNonPublicIp(hostname) {
  const host = hostname.replace(/^\[|\]$/g, '')
  const version = isIP(host)

  if (version === 4) {
    const octets = host.split('.').map(Number)
    return isNonPublicIpv4Octets(octets)
  }

  if (version === 6) {
    const words = ipv6Words(host)
    const unspecified = words.every(word => word === 0)
    const loopback = words.slice(0, 7).every(word => word === 0) && words[7] === 1
    const uniqueLocal = (words[0] & 0xfe00) === 0xfc00
    const linkLocal = (words[0] & 0xffc0) === 0xfe80
    const ipv4Mapped = words.slice(0, 5).every(word => word === 0) && words[5] === 0xffff
    const mappedOctets = [words[6] >> 8, words[6] & 0xff, words[7] >> 8, words[7] & 0xff]
    return unspecified || loopback || uniqueLocal || linkLocal
      || (ipv4Mapped && isNonPublicIpv4Octets(mappedOctets))
  }

  return false
}

function canonicalOrigin(value) {
  const url = new URL(value)
  expect(url.protocol).toBe('https:')
  expect(url.username).toBe('')
  expect(url.password).toBe('')
  expect(url.pathname).toBe('/')
  expect(url.search).toBe('')
  expect(url.hash).toBe('')
  expect(url.port).toBe('')

  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  expect(hostname === 'localhost' || hostname.endsWith('.localhost')).toBe(false)
  expect(isNonPublicIp(hostname)).toBe(false)
  if (isIP(hostname) === 0) {
    expect(hostname.includes('.')).toBe(true)
    const labels = hostname.split('.')
    expect(labels.every(label => label
      && /^[a-z0-9-]+$/.test(label)
      && !label.startsWith('-')
      && !label.endsWith('-'))).toBe(true)
    expect(['internal', 'intranet', 'lan', 'local', 'localhost', 'home', 'invalid', 'test'])
      .not.toContain(labels.at(-1))
  }
  return url.origin
}

function validatePublicRoute(expectedPath, response) {
  expect(response.status).toBeGreaterThanOrEqual(200)
  expect(response.status).toBeLessThan(400)
  expect(response.redirected).toBe(false)

  const finalUrl = new URL(response.url)
  expect(finalUrl.origin).toBe(response.expectedOrigin)
  expect(finalUrl.pathname).toBe(expectedPath)
  expect(finalUrl.search).toBe('')
  expect(finalUrl.hash).toBe('')
}

describe('Production student launch gate: deterministic validation', () => {
  test('accepts a public HTTPS origin and each exact public route', () => {
    expect(canonicalOrigin('https://academy.example.com')).toBe('https://academy.example.com')
    for (const path of ['/', '/login', '/forgot']) {
      expect(() => validatePublicRoute(path, {
        status: 200,
        redirected: false,
        url: `https://academy.example.com${path}`,
        expectedOrigin: 'https://academy.example.com',
      })).not.toThrow()
    }
  })

  test('rejects internal, ambiguous, credentialed, and malformed base destinations', () => {
    const rejected = [
      'http://academy.example.com',
      'https://user:password@academy.example.com',
      'https://academy.example.com:444',
      'https://academy.example.com/path',
      'https://academy.example.com?preview=true',
      'https://academy.example.com/#preview',
      'https://localhost',
      'https://academy.localhost',
      'https://internal',
      'https://academy.internal',
      'https://academy.local',
      'https://0.0.0.0',
      'https://127.0.0.2',
      'https://10.1.2.3',
      'https://172.16.0.1',
      'https://172.31.255.255',
      'https://192.168.1.1',
      'https://169.254.10.20',
      'https://[::]',
      'https://[::1]',
      'https://[fe80::1]',
      'https://[fc00::1]',
      'https://[fdff::1]',
      'https://[::ffff:127.0.0.1]',
      'https://[::ffff:10.0.0.1]',
    ]
    for (const destination of rejected) expect(() => canonicalOrigin(destination)).toThrow()
  })

  test('rejects redirects, route substitution, cross-origin results, query, and fragments', () => {
    const invalidResponses = [
      { expectedPath: '/login', url: 'https://academy.example.com/', redirected: true },
      { expectedPath: '/forgot', url: 'https://academy.example.com/', redirected: true },
      { expectedPath: '/login', url: 'https://identity.example.com/login', redirected: true },
      { expectedPath: '/login', url: 'https://academy.example.com/login?next=/', redirected: false },
      { expectedPath: '/forgot', url: 'https://academy.example.com/forgot#reset', redirected: false },
    ]
    for (const response of invalidResponses) {
      expect(() => validatePublicRoute(response.expectedPath, {
        status: 200,
        expectedOrigin: 'https://academy.example.com',
        ...response,
      })).toThrow()
    }
  })
})

describe('Production student launch gate: public smoke', () => {
  test('requires an explicit canonical URL for live checks', () => {
    if (configuredBaseUrl) expect(canonicalOrigin(configuredBaseUrl)).toBe(configuredBaseUrl.replace(/\/$/, ''))
    else expect(configuredBaseUrl).toBeUndefined()
  })

  for (const path of ['/', '/login', '/forgot']) {
    liveTest(`loads ${path} without a server error`, async () => {
      const origin = canonicalOrigin(configuredBaseUrl)
      const response = await fetch(`${origin}${path}`, { redirect: 'follow' })
      validatePublicRoute(path, {
        status: response.status,
        redirected: response.redirected,
        url: response.url,
        expectedOrigin: origin,
      })
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
    expect([...location.searchParams.keys()]).toEqual(['next'])
    expect(location.hash).toBe('')
  })
})
