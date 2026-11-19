// Static source contracts only. This suite is NOT an OAuth E2E or authorization proof.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
const start = read('app/api/academia/oauth/google/route.ts')
const callback = read('app/api/academia/oauth/callback/route.ts')
const entry = read('app/academy/entry/page.tsx')
const academy = read('app/academia/page.tsx')
const api = read('app/api/academia/route.ts')
const landing = read('components/Landings/XpexAcademy/XpexAcademyLanding.tsx')

test('Google OAuth requires explicit pilot opt-in and PKCE S256', () => {
  assert.match(start, /XPEX_PILOT_GOOGLE_OAUTH_ENABLED/)
  assert.match(start, /code_challenge_method', 's256'/)
  assert.match(start, /createHash\('sha256'\)/)
  assert.match(start, /callback\.searchParams\.set\('state', state\)/)
  assert.match(start, /authorize\.searchParams\.set\('redirect_to', callback\.toString\(\)\)/)
  assert.doesNotMatch(start, /authorize\.searchParams\.set\('state', state\)/)
})

test('callback requires matching state, exchanges PKCE and restricts Academy cookies', () => {
  assert.match(callback, /state !== expectedState/)
  assert.match(callback, /grant_type=pkce/)
  assert.match(callback, /code_verifier: verifier/)
  assert.match(callback, /XPEX_PILOT_ALLOWED_EMAILS/)
  assert.match(callback, /SESSION_PATH = '\/api\/academia'/)
  assert.match(callback, /httpOnly: true/)
})

test('entry avoids pretending Supabase pilot is LearnHouse legacy SSO', () => {
  assert.match(entry, /\/academia\?section=polo/)
  assert.match(entry, /\/academia\?section=cursos/)
  assert.match(entry, /href="\/academia"/)
  assert.doesNotMatch(entry, /href=\{href\}[^\n]*\/xpex\//)
  assert.match(landing, /academyLoginHref = '\/academy\/entry'/)
  assert.match(academy, /canAccessPolo/)
})

test('pilot API keeps email fallback closed to unsolicited OTP account creation', () => {
  assert.match(api, /create_user: false/)
  assert.match(api, /XPEX_PILOT_ALLOWED_EMAILS/)
  assert.match(api, /COOKIE_PATH = '\/api\/academia'/)
  assert.match(api, /return result\(\{ authenticated: false \}, 401\)/)
})
