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

describe('Vercel runtime-config.js route', () => {
  test('publishes only the explicit public allowlist and escapes script-breaking input', async () => {
    const { buildRuntimeConfigScript, getPublicRuntimeConfig } = await import('../app/runtime-config.js/route.ts')
    const env = {
      NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL: 'https://api.example.com/',
      NEXT_PUBLIC_LEARNHOUSE_DOMAIN: 'academy.example.com',
      NEXT_PUBLIC_POSTHOG_KEY: '</script><script>alert(1)</script>',
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'public-turnstile-site-key',
      TURNSTILE_SECRET_KEY: 'must-never-be-public',
      LEARNHOUSE_BREVO_API_KEY: 'must-never-be-public',
      LEARNHOUSE_AUTH_JWT_SECRET_KEY: 'must-never-be-public',
      DATABASE_URL: 'must-never-be-public',
    }

    expect(getPublicRuntimeConfig(env)).toEqual({
      NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL: 'https://api.example.com/',
      NEXT_PUBLIC_LEARNHOUSE_DOMAIN: 'academy.example.com',
      NEXT_PUBLIC_POSTHOG_KEY: '</script><script>alert(1)</script>',
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'public-turnstile-site-key',
    })

    const script = buildRuntimeConfigScript(env)
    expect(script).toContain('NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL')
    expect(script).toContain('\\u003c/script>')
    expect(script).not.toContain('</script>')
    expect(script).not.toContain('must-never-be-public')
    expect(script).toContain('NEXT_PUBLIC_TURNSTILE_SITE_KEY')
    expect(script).toContain('public-turnstile-site-key')
    expect(script).not.toContain('TURNSTILE_SECRET_KEY')
    expect(script).not.toContain('LEARNHOUSE_BREVO_API_KEY')
    expect(script).not.toContain('LEARNHOUSE_AUTH_JWT_SECRET_KEY')
    expect(script).not.toContain('DATABASE_URL')
  })

  test('serves JavaScript dynamically without cache or MIME sniffing', async () => {
    const { GET } = await import('../app/runtime-config.js/route.ts')
    const response = await GET()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/javascript; charset=utf-8')
    expect(response.headers.get('cache-control')).toBe('private, no-store, max-age=0')
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(await response.text()).toContain('window.__RUNTIME_CONFIG__')
  })
})
