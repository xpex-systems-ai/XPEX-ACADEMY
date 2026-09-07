import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

describe('XPeX student certificate integrity', () => {
  test('lists only certificates awarded by the native LearnHouse engine', () => {
    const page = read('app/xpex/certificates/page.tsx')
    const source = read('lib/xpex/certificates.ts')
    expect(page).toContain('getXpexStudentCertificates')
    expect(page).not.toContain('progress_percent ?? 0')
    expect(source).toContain('/api/v1/certifications/user/all')
    expect(source).toContain('Authorization: `Bearer ${accessToken}`')
    expect(source).toContain("cache: 'no-store'")
  })

  test('tenant-scopes awarded certificates to dashboard-authorized courses', () => {
    const page = read('app/xpex/certificates/page.tsx')
    const source = read('lib/xpex/certificates.ts')
    expect(page).toContain('new Set(learning.data.courses.map')
    expect(source).toContain('authorizedCourseUuids.has(courseUuid)')
    expect(source).toContain('organizationId')
  })

  test('links each persisted identifier to the canonical verification page', () => {
    const page = read('app/xpex/certificates/page.tsx')
    expect(page).toContain('certificate.certificateId')
    expect(page).toContain('/certificates/${encodeURIComponent(certificate.certificateId)}/verify')
    expect(page).toContain('Certificado emitido')
  })
})
