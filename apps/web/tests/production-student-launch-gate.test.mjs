import { describe, expect, test } from 'bun:test'
import { lookup as dnsLookup } from 'node:dns/promises'
import { request as httpsRequest } from 'node:https'
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
  let address = hostname.replace(/^\[|\]$/g, '').toLowerCase()
  const finalColon = address.lastIndexOf(':')
  const ipv4Tail = address.slice(finalColon + 1)
  if (ipv4Tail.includes('.')) {
    const octets = ipv4Tail.split('.').map(Number)
    const high = ((octets[0] << 8) | octets[1]).toString(16)
    const low = ((octets[2] << 8) | octets[3]).toString(16)
    address = `${address.slice(0, finalColon)}:${high}:${low}`
  }
  const [left = '', right = ''] = address.split('::')
  const leftWords = left ? left.split(':').map(part => Number.parseInt(part, 16)) : []
  const rightWords = right ? right.split(':').map(part => Number.parseInt(part, 16)) : []
  const omitted = 8 - leftWords.length - rightWords.length
  return address.includes('::')
    ? [...leftWords, ...Array(omitted).fill(0), ...rightWords]
    : leftWords
}

function isNonPublicIpv4Octets(octets) {
  const [a, b, c, d] = octets
  const protocolAssignmentException = a === 192 && b === 0 && c === 0 && (d === 9 || d === 10)
  return a === 0
    || a === 10
    || a === 127
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 0 && c === 0 && !protocolAssignmentException)
    || (a === 192 && b === 0 && c === 2)
    || (a === 192 && b === 88 && c === 99)
    || (a === 192 && b === 168)
    || (a === 198 && (b === 18 || b === 19))
    || (a === 198 && b === 51 && c === 100)
    || (a === 203 && b === 0 && c === 113)
    || a >= 224
}

function ipv6Prefix(words, prefix, bits) {
  const completeWords = Math.floor(bits / 16)
  const remainingBits = bits % 16
  for (let index = 0; index < completeWords; index += 1) {
    if (words[index] !== prefix[index]) return false
  }
  if (!remainingBits) return true
  const mask = (0xffff << (16 - remainingBits)) & 0xffff
  return (words[completeWords] & mask) === (prefix[completeWords] & mask)
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
    const multicast = (words[0] & 0xff00) === 0xff00
    const ipv4Mapped = words.slice(0, 5).every(word => word === 0) && words[5] === 0xffff
    const mappedOctets = [words[6] >> 8, words[6] & 0xff, words[7] >> 8, words[7] & 0xff]
    const discardOnly = ipv6Prefix(words, [0x0100, 0, 0, 0, 0, 0, 0, 0], 64)
    const localTranslation = ipv6Prefix(words, [0x0064, 0xff9b, 0x0001, 0, 0, 0, 0, 0], 48)
    const ietfProtocolAssignments = ipv6Prefix(words, [0x2001, 0, 0, 0, 0, 0, 0, 0], 23)
    const protocolAnycast = words[0] === 0x2001 && words[1] === 0x0001
      && words.slice(2, 7).every(word => word === 0)
      && [0x0001, 0x0002, 0x0003].includes(words[7])
    const amt = ipv6Prefix(words, [0x2001, 0x0003, 0, 0, 0, 0, 0, 0], 32)
    const as112 = ipv6Prefix(words, [0x2001, 0x0004, 0x0112, 0, 0, 0, 0, 0], 48)
    const orchidV2 = ipv6Prefix(words, [0x2001, 0x0020, 0, 0, 0, 0, 0, 0], 28)
    const droneDet = ipv6Prefix(words, [0x2001, 0x0030, 0, 0, 0, 0, 0, 0], 28)
    const globallyReachableIetfException = protocolAnycast || amt || as112 || orchidV2 || droneDet
    const nonGlobalIetfAssignment = ietfProtocolAssignments && !globallyReachableIetfException
    const documentation = ipv6Prefix(words, [0x2001, 0x0db8, 0, 0, 0, 0, 0, 0], 32)
    const sixToFour = ipv6Prefix(words, [0x2002, 0, 0, 0, 0, 0, 0, 0], 16)
    const documentationV2 = ipv6Prefix(words, [0x3fff, 0, 0, 0, 0, 0, 0, 0], 20)
    const outsideGlobalUnicast = (words[0] & 0xe000) !== 0x2000
    return unspecified || loopback || uniqueLocal || linkLocal || multicast
      || discardOnly || localTranslation || nonGlobalIetfAssignment
      || documentation || sixToFour || documentationV2
      || (outsideGlobalUnicast && !ipv4Mapped)
      || (ipv4Mapped && isNonPublicIpv4Octets(mappedOctets))
  }

  return false
}

async function resolveAndPinOrigin(origin, resolver = dnsLookup) {
  const url = new URL(origin)
  const hostname = url.hostname.replace(/^\[|\]$/g, '')
  const literalFamily = isIP(hostname)
  const records = literalFamily
    ? [{ address: hostname, family: literalFamily }]
    : await resolver(hostname, { all: true, verbatim: true })

  if (!Array.isArray(records) || records.length === 0) throw new Error('Canonical hostname returned no DNS addresses')
  for (const record of records) {
    if (![4, 6].includes(record.family) || isIP(record.address) !== record.family) {
      throw new Error('Canonical hostname returned an invalid DNS address')
    }
    if (isNonPublicIp(record.address)) throw new Error('Canonical hostname resolved to a non-global address')
  }

  return { origin: url.origin, hostname, pinned: records[0] }
}

function pinnedHttpsGet(target, approved, transport = httpsRequest) {
  const url = new URL(target)
  if (url.origin !== approved.origin) return Promise.reject(new Error('Cross-origin request rejected'))

  return new Promise((resolve, reject) => {
    const options = {
      protocol: 'https:',
      hostname: approved.hostname,
      servername: approved.hostname,
      port: 443,
      path: `${url.pathname}${url.search}`,
      method: 'GET',
      rejectUnauthorized: true,
      lookup(requestedHostname, lookupOptions, callback) {
        if (requestedHostname !== approved.hostname) {
          callback(new Error('Unexpected hostname lookup rejected'))
          return
        }
        if (lookupOptions?.all) {
          callback(null, [{ address: approved.pinned.address, family: approved.pinned.family }])
          return
        }
        callback(null, approved.pinned.address, approved.pinned.family)
      },
    }
    const request = transport(options, (response) => {
      response.resume?.()
      resolve({
        status: response.statusCode,
        headers: response.headers,
        redirected: false,
        url: url.href,
      })
    })
    request.once('error', reject)
    request.end()
  })
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
  expect(response.status).toBeLessThan(300)
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

  test('classifies IANA non-global ranges, CGNAT boundaries, and adjacent global addresses', () => {
    const nonGlobal = [
      '0.0.0.0', '10.0.0.1', '100.64.0.0', '100.127.255.255', '127.255.255.255',
      '169.254.0.1', '172.16.0.0', '172.31.255.255', '192.0.0.1', '192.0.2.1',
      '192.88.99.1', '192.168.0.1', '198.18.0.0', '198.51.100.1', '203.0.113.1',
      '224.0.0.1', '240.0.0.1', '255.255.255.255', '::', '::1', '100::1',
      '64:ff9b:1::1', '2001::1', '2001:1::4', '2001:2::1', '2001:4::1',
      '2001:db8::1', '2001:10::1', '2002::1', '3fff::1', '3fff:fff::1',
      'fc00::1', 'fe80::1', 'ff02::1',
      '::ffff:100.64.0.0', '::ffff:100.64.0.1',
      '::ffff:100.127.255.255',
    ]
    const global = [
      '8.8.8.8', '100.63.255.255', '100.128.0.0', '192.0.0.9', '192.0.0.10',
      '2001:1::1', '2001:1::2', '2001:1::3', '2001:3::1', '2001:4:112::1',
      '2001:20::1', '2001:30::1', '2001:4860:4860::8888',
      '2606:4700:4700::1111', '::ffff:100.63.255.255', '::ffff:100.128.0.0',
    ]
    for (const address of nonGlobal) expect(isNonPublicIp(address)).toBe(true)
    for (const address of global) expect(isNonPublicIp(address)).toBe(false)
  })

  test('resolves once, accepts global IPv4 or IPv6, and rejects unsafe DNS answers', async () => {
    const resolve = records => async () => records
    await expect(resolveAndPinOrigin('https://academy.example.com', resolve([
      { address: '8.8.8.8', family: 4 },
    ]))).resolves.toMatchObject({ pinned: { address: '8.8.8.8', family: 4 } })
    await expect(resolveAndPinOrigin('https://academy.example.com', resolve([
      { address: '2606:4700:4700::1111', family: 6 },
    ]))).resolves.toMatchObject({ pinned: { family: 6 } })
    await expect(resolveAndPinOrigin('https://academy.example.com', resolve([
      { address: '10.0.0.1', family: 4 },
    ]))).rejects.toThrow('non-global')
    await expect(resolveAndPinOrigin('https://academy.example.com', resolve([
      { address: 'fe80::1', family: 6 },
    ]))).rejects.toThrow('non-global')
    await expect(resolveAndPinOrigin('https://academy.example.com', resolve([
      { address: '8.8.8.8', family: 4 }, { address: '127.0.0.1', family: 4 },
    ]))).rejects.toThrow('non-global')
    await expect(resolveAndPinOrigin('https://academy.example.com', resolve([]))).rejects.toThrow('no DNS')
    await expect(resolveAndPinOrigin('https://academy.example.com', async () => {
      throw new Error('resolver unavailable')
    })).rejects.toThrow('resolver unavailable')
  })

  test('pins the approved address while preserving hostname and TLS verification', async () => {
    let resolverCalls = 0
    const approved = await resolveAndPinOrigin('https://academy.example.com', async () => {
      resolverCalls += 1
      return [{ address: '8.8.8.8', family: 4 }]
    })
    let observedOptions
    const transport = (options, callback) => {
      observedOptions = options
      options.lookup('academy.example.com', {}, (error, address, family) => {
        expect(error).toBeNull()
        expect(address).toBe('8.8.8.8')
        expect(family).toBe(4)
      })
      options.lookup('changed.example.com', {}, (error) => {
        expect(error.message).toBe('Unexpected hostname lookup rejected')
      })
      options.lookup('academy.example.com', { all: true }, (error, records) => {
        expect(error).toBeNull()
        expect(records).toEqual([{ address: '8.8.8.8', family: 4 }])
      })
      queueMicrotask(() => callback({ statusCode: 200, headers: {}, resume() {} }))
      return { once() {}, end() {} }
    }
    await pinnedHttpsGet('https://academy.example.com/login', approved, transport)
    expect(observedOptions.hostname).toBe('academy.example.com')
    expect(observedOptions.servername).toBe('academy.example.com')
    expect(observedOptions.rejectUnauthorized).toBe(true)
    expect(resolverCalls).toBe(1)
  })

  test('propagates certificate errors and never falls back to unvalidated DNS', async () => {
    const approved = {
      origin: 'https://academy.example.com',
      hostname: 'academy.example.com',
      pinned: { address: '8.8.8.8', family: 4 },
    }
    const invalidCertificateTransport = (_options, _callback) => {
      let errorHandler
      return {
        once(_event, handler) { errorHandler = handler },
        end() { queueMicrotask(() => errorHandler(new Error('certificate verify failed'))) },
      }
    }
    await expect(pinnedHttpsGet(
      'https://academy.example.com/login', approved, invalidCertificateTransport,
    )).rejects.toThrow('certificate verify failed')
  })
})

const liveApprovedOrigin = configuredBaseUrl
  ? resolveAndPinOrigin(canonicalOrigin(configuredBaseUrl))
  : null

describe('Production student launch gate: public smoke', () => {
  test('requires an explicit canonical URL for live checks', () => {
    if (configuredBaseUrl) expect(canonicalOrigin(configuredBaseUrl)).toBe(configuredBaseUrl.replace(/\/$/, ''))
    else expect(configuredBaseUrl).toBeUndefined()
  })

  for (const path of ['/', '/login', '/forgot']) {
    liveTest(`loads ${path} without a server error`, async () => {
      const approved = await liveApprovedOrigin
      const response = await pinnedHttpsGet(`${approved.origin}${path}`, approved)
      validatePublicRoute(path, {
        status: response.status,
        redirected: response.redirected,
        url: response.url,
        expectedOrigin: approved.origin,
      })
    })
  }

  liveTest('an anonymous /xpex request preserves its destination', async () => {
    const approved = await liveApprovedOrigin
    const response = await pinnedHttpsGet(`${approved.origin}/xpex`, approved)
    expect([301, 302, 303, 307, 308]).toContain(response.status)

    const locationHeader = Array.isArray(response.headers.location)
      ? response.headers.location[0]
      : response.headers.location
    const location = new URL(locationHeader, approved.origin)
    expect(location.origin).toBe(approved.origin)
    expect(location.pathname).toBe('/login')
    expect(location.searchParams.get('next')).toBe('/xpex')
    expect([...location.searchParams.keys()]).toEqual(['next'])
    expect(location.hash).toBe('')
  })
})
