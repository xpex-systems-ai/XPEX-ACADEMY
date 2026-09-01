import { describe, expect, test } from 'bun:test'

import { mergeAuthoritativeSessionUser } from '@/lib/auth/server-session'

describe('XPeX superadmin authority', () => {
  test('canonical session false cannot be elevated by stale profile data', () => {
    expect(
      mergeAuthoritativeSessionUser(
        { username: 'kelle-polo-admin', is_superadmin: false },
        { username: 'kelle-polo-admin', is_superadmin: true },
      )?.is_superadmin,
    ).toBe(false)
  })

  test('canonical session true remains superadmin if profile is stale', () => {
    expect(
      mergeAuthoritativeSessionUser(
        { username: 'admin', is_superadmin: true },
        { username: 'admin', is_superadmin: false },
      )?.is_superadmin,
    ).toBe(true)
  })
})
