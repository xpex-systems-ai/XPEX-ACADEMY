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

  test('links each persisted identifier through the canonical tenant-aware verification route', () => {
    const page = read('app/xpex/certificates/page.tsx')
    expect(page).toContain("import { getUriWithOrg } from '@services/config/config'")
    expect(page).toContain('getUriWithOrg(')
    expect(page).toContain('/certificates/${encodeURIComponent(certificate.certificateId)}/verify')
    expect(page).not.toContain('href={`/orgs/${learning.organization.slug}/certificates/')
    expect(page).toContain('Certificado emitido')
  })

  test('degrades plan-denied certification access to an empty state', () => {
    const source = read('lib/xpex/certificates.ts')
    expect(source).toContain('if (response.status === 403) return []')
    expect(source).toContain('if (!response.ok) throw new Error')
  })
})
