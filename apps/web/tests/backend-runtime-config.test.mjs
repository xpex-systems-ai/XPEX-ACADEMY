import { describe, expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { inspectBackendConfiguration } from '../services/config/config.ts'

describe('deployed backend runtime configuration', () => {
  test('rejects missing and localhost upstreams in deployed mode', () => {
    expect(inspectBackendConfiguration('', true)).toEqual({ configured: false, deployed: true, reason: 'missing' })
    expect(inspectBackendConfiguration('http://localhost:1338/', true).reason).toBe('https_required')
    for (const origin of [
      'https://localhost/',
      'https://127.0.0.1/',
      'https://127.10.20.30/',
      'https://[::1]/',
    ]) {
      expect(inspectBackendConfiguration(origin, true).reason).toBe('localhost_forbidden')
    }
  })

  test('requires an absolute HTTPS origin without an API path', () => {
    expect(inspectBackendConfiguration('https://api.example.com/api/v1', true).reason).toBe('origin_required')
    expect(inspectBackendConfiguration('https://api.example.com/', true)).toEqual({ configured: true, deployed: true, reason: 'ready' })
  })

  test('preserves the localhost contract for true local development', () => {
    expect(inspectBackendConfiguration('http://localhost:1338/', false)).toEqual({ configured: true, deployed: false, reason: 'ready' })
  })

  test('can import and inspect missing configuration in deployed mode without throwing', () => {
    const moduleUrl = new URL('../services/config/config.ts', import.meta.url).href
    const child = spawnSync(process.execPath, ['-e', `import { inspectBackendConfiguration } from '${moduleUrl}'; console.log(inspectBackendConfiguration().reason)`], {
      env: { ...process.env, VERCEL: '1', NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL: '' },
      encoding: 'utf8',
    })
    expect(child.status).toBe(0)
    expect(child.stdout.trim()).toBe('missing')
  })

  test('standalone production rejects missing and IPv6 loopback backend origins', () => {
    const wrapper = new URL('../server-wrapper.js', import.meta.url).pathname
    const run = (backendUrl) => spawnSync(process.execPath, [wrapper], {
      env: {
        ...process.env,
        NODE_ENV: 'production',
        NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL: backendUrl,
        VERCEL: '',
        VERCEL_ENV: '',
        LEARNHOUSE_DEPLOYED: '',
      },
      encoding: 'utf8',
    })

    expect(run('').stderr).toContain('must be an absolute HTTPS origin')
    expect(run('https://[::1]/').stderr).toContain('must be a public HTTPS origin')
  })
})
