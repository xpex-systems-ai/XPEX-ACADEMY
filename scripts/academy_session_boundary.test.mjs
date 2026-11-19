import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Static contract tests: no network, secrets, or learner records.
const file = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
const pilot = file('apps/web/app/api/academia/route.ts')
const legacy = file('apps/web/lib/auth/server.ts')
const polo = file('apps/web/components/Xpex/AuthenticatedXpexExperience.tsx')

test('pilot auth cookies are isolated to pilot API and are HttpOnly', () => {
  assert.match(pilot, /const ACCESS_COOKIE = 'xpex_pilot_access'/)
  assert.match(pilot, /const REFRESH_COOKIE = 'xpex_pilot_refresh'/)
  assert.match(pilot, /const COOKIE_PATH = '\/api\/academia'/)
  assert.match(pilot, /httpOnly:\s*true/)
  assert.match(pilot, /sameSite:\s*'lax'/)
})

test('canonical server session uses LearnHouse tokens, not pilot cookies', () => {
  assert.match(legacy, /const ACCESS_TOKEN_COOKIE = 'LH_access'/)
  assert.match(legacy, /const REFRESH_TOKEN_COOKIE = 'LH_refresh'/)
  assert.doesNotMatch(legacy, /xpex_pilot_(?:access|refresh)/)
  assert.match(legacy, /readSessionFromBackend/)
})

test('Polo access requires canonical session and scoped membership', () => {
  assert.match(polo, /const session = await getServerSession\(\)/)
  assert.match(polo, /if \(!session\?\.user\) redirect\(/)
  assert.match(polo, /resolveXpexPoloAccess\(/)
  assert.match(polo, /if \(!role \|\| \(role === 'polo' \? !poloAccess/)
})
