import { describe, expect, test } from 'bun:test'
import { inspectBackendConfiguration } from '../services/config/config.ts'

describe('deployed backend runtime configuration', () => {
  test('rejects missing and localhost upstreams in deployed mode', () => {
    expect(inspectBackendConfiguration('', true)).toEqual({ configured: false, deployed: true, reason: 'missing' })
    expect(inspectBackendConfiguration('http://localhost:1338/', true).reason).toBe('https_required')
    expect(inspectBackendConfiguration('https://localhost/', true).reason).toBe('localhost_forbidden')
  })

  test('requires an absolute HTTPS origin without an API path', () => {
    expect(inspectBackendConfiguration('https://api.example.com/api/v1', true).reason).toBe('origin_required')
    expect(inspectBackendConfiguration('https://api.example.com/', true)).toEqual({ configured: true, deployed: true, reason: 'ready' })
  })

  test('preserves the localhost contract for true local development', () => {
    expect(inspectBackendConfiguration('http://localhost:1338/', false)).toEqual({ configured: true, deployed: false, reason: 'ready' })
  })
})
