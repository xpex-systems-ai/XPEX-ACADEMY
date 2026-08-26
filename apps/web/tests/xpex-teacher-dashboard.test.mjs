import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const boundary = read('components/Xpex/AuthenticatedXpexExperience.tsx')
const dashboard = read('components/Xpex/experiences/AuthenticatedDashboard.tsx')
const client = read('lib/xpex/teacher-dashboard.ts')

describe('XPEX-UI-002 teacher dashboard', () => {
  test('loads teacher data only through the authenticated server boundary', () => {
    expect(boundary).toContain("role === 'professora'")
    expect(boundary).toContain('getXpexTeacherDashboard')
    expect(boundary).toContain('session.tokens.access_token')
  })

  test('uses a dedicated server-authoritative endpoint with no client cache', () => {
    expect(client).toContain('/api/v1/xpex/teacher-dashboard')
    expect(client).toContain("cache: 'no-store'")
    expect(client).toContain('Authorization: `Bearer ${accessToken}`')
  })

  test('renders aggregate enrollment states without student PII', () => {
    for (const field of ['published_courses', 'enrolled_students', 'active_students', 'completed_students', 'paused_students']) {
      expect(dashboard).toContain(field)
    }
    expect(dashboard).toContain('Visão agregada por padrão')
    expect(dashboard).not.toContain('student.email')
    expect(dashboard).not.toContain('student.username')
  })
})
