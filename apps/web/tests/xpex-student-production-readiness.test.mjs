import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

describe('XPeX student production readiness', () => {
  test('treats 100 percent learning as completed instead of active', () => {
    const dashboard = read('components/Xpex/experiences/FuturisticStudentDashboard.tsx')
    expect(dashboard).toContain('const isCourseComplete')
    expect(dashboard).toContain("course.progress_percent !== null && course.progress_percent >= 100")
    expect(dashboard).toContain('course.completed_lessons >= course.total_lessons')
    expect(dashboard).toContain('courses.filter(course => !isCourseComplete(course)')
    expect(dashboard).not.toContain('data?.continue_learning ?? courses[0]')
  })

  test('keeps the authenticated student shell on XPeX Academy AI identity', () => {
    const shell = read('components/Xpex/XpexAuthenticatedShell.tsx')
    expect(shell).toContain('XPeX Academy AI')
    for (const route of ['/xpex/aluno', '/xpex/courses', '/xpex/trails', '/xpex/activities', '/xpex/ai-lab', '/xpex/community', '/xpex/certificates']) {
      expect(shell).toContain(route)
    }
  })

  test('presents certificates and community using premium cards without inventing data', () => {
    const certificates = read('app/xpex/certificates/page.tsx')
    const community = read('app/xpex/community/page.tsx')
    expect(certificates).toContain('xpex-card xpex-feature xpex-feature-orange')
    expect(certificates).toContain('getXpexStudentCertificates')
    expect(certificates).toContain('Identificador verificável')
    expect(community).toContain('xpex-card xpex-feature xpex-feature-orange')
    expect(community).toContain('getCommunities')
  })
})
