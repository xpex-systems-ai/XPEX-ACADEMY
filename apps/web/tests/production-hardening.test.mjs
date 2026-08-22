import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { buildAnalyticsEventPayload } from '../services/analytics/analyticsPayload.ts'
import { safeAuthReturnPath } from '../lib/proxyPaths.ts'

describe('PR-04 idempotent logout', () => {
  const gateway = readFileSync(new URL('../app/api/auth/[...path]/route.ts', import.meta.url), 'utf8')
  const authContext = readFileSync(new URL('../components/Contexts/AuthContext.tsx', import.meta.url), 'utf8')

  test('treats an expired backend session as complete and always clears gateway cookies', () => {
    expect(gateway).toContain('logoutRes.ok || logoutRes.status === 401')
    expect(gateway).toContain('appendClearAuthCookies(response, request)')
    expect(gateway).toContain("{ ok: false, error: 'Backend logout unavailable' }")
  })

  test('clears local session state independently of the backend result', () => {
    expect(authContext).toContain('// Clear local state regardless of backend response')
    expect(authContext).toContain('setSession(null)')
    expect(authContext).toContain("setStatus('unauthenticated')")
  })
})

describe('PR-04 backend analytics payload', () => {
  test('builds the payload accepted by the real API schema', () => {
    expect(buildAnalyticsEventPayload('page_view', 42, 'session-1', { surface: 'xpex' })).toEqual({
      event_name: 'page_view',
      org_id: 42,
      session_id: 'session-1',
      properties: { surface: 'xpex' },
    })
  })

  test('does not produce malformed or non-whitelisted backend events', () => {
    expect(buildAnalyticsEventPayload('onboarding_started', 42, 'session-1', {})).toBeNull()
    expect(buildAnalyticsEventPayload('page_view', 0, 'session-1', {})).toBeNull()
    expect(buildAnalyticsEventPayload('page_view', 42, '', {})).toBeNull()
  })
})

describe('PR-04 navigation regression', () => {
  const home = readFileSync(new URL('../app/home/home.tsx', import.meta.url), 'utf8')

  test('sends create-organization navigation to the main-domain /new route', () => {
    expect(home).toContain("const newOrganizationUrl = getMainDomainUri('/new')")
    expect(home).toContain('router.replace(newOrganizationUrl)')
    expect(home).toContain('href={newOrganizationUrl}')
  })

  test('preserves /xpex and /login?next=/xpex routing', () => {
    expect(safeAuthReturnPath('/xpex')).toBe('/xpex')
    expect(safeAuthReturnPath('/xpex?from=login')).toBe('/xpex?from=login')
  })
})
