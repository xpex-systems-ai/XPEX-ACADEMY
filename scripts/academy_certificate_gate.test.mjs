import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Non-invasive release gate: certification is explicitly unavailable in the pilot.
const page = readFileSync(new URL('../apps/web/app/academia/page.tsx', import.meta.url), 'utf8')
const api = readFileSync(new URL('../apps/web/app/api/academia/route.ts', import.meta.url), 'utf8')

test('pilot UI must explicitly disclose that certificate issuance is blocked', () => {
  assert.match(page, /emiss[aã]o de certificados[^<]*continuam bloqueadas/i)
})

test('pilot API must not expose a certificate issuance action', () => {
  assert.doesNotMatch(api, /body\.action\s*===?\s*['\"](?:issue_certificate|create_certificate|generate_certificate)['\"]/)
})
