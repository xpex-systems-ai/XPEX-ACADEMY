import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Static regression guard for the isolated Supabase Academy pilot.
// No network calls, credentials, or student data are used.
const source = readFileSync(new URL('../apps/web/app/api/academia/route.ts', import.meta.url), 'utf8')

test('pilot OTP request must never create new Supabase users', () => {
  const start = source.indexOf("if (body.action === 'request_code')")
  assert.notEqual(start, -1, 'request_code action must exist')
  const end = source.indexOf('const code =', start)
  assert.ok(end > start, 'request_code branch must precede verify_code')
  const requestCode = source.slice(start, end)
  assert.match(requestCode, /authFetch\(base, '\/otp'/)
  assert.match(requestCode, /create_user:\s*false\b/)
  assert.doesNotMatch(requestCode, /create_user:\s*true\b/)
})

test('pilot OTP request remains restricted to allowed emails', () => {
  assert.match(source, /XPEX_PILOT_ALLOWED_EMAILS/)
  assert.match(source, /allowed\.includes\(email\)/)
})
