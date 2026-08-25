import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const dashboard = read('components/Xpex/experiences/AuthenticatedDashboard.tsx')
const shell = read('components/Xpex/XpexAuthenticatedShell.tsx')
const primitives = read('components/Xpex/XpexPrimitives.tsx')
const access = read('lib/xpex/student.ts')
const loading = read('app/xpex/loading.tsx')
const error = read('app/xpex/error.tsx')
const css = read('components/Xpex/xpex.css')

describe('XPEX-UI-001 student area', () => {
  test('renders only server-authorized tenant learning data', () => {
    expect(access).toContain("resolveXpexOrganization(session.roles, 'aluno')")
    expect(access).toContain('getXpexLearningDashboard(accessToken, authorizedOrganization.slug)')
    expect(dashboard).toContain('data?.courses ?? []')
  })
  test('derives every metric and destination from the learning response', () => {
    for (const value of ['summary.active_courses', 'summary.completed_lessons', 'summary.overall_progress_percent', 'current.target_href', 'course.target_href']) expect(dashboard).toContain(value)
    for (const invented of ['XP', 'ranking', 'streak', 'horas estudadas']) expect(dashboard).not.toContain(invented)
  })
  test('covers loading, empty, recoverable error and missing imagery', () => {
    expect(loading).toContain('XpexLoadingState')
    expect(error).toContain('Tentar novamente')
    expect(dashboard).toContain('Nenhum curso disponível ainda')
    expect(primitives).toContain('<SafeImage')
    expect(primitives).toContain('aria-hidden="true">X</span>')
    expect(dashboard).toContain('getCourseThumbnailMediaDirectory(course.org_uuid, course.course_id, course.image_url)')
  })
  test('keeps student controls accessible and excludes administration', () => {
    expect(shell).toContain("event.key === 'Escape'")
    expect(shell).toContain('aria-expanded={menuOpen}')
    expect(shell).toContain("usePathname()")
    expect(shell).not.toContain('Administrador')
    expect(css).toContain('@media(prefers-reduced-motion:reduce)')
  })
  test('honors paused and completed enrollment states without false resume copy', () => {
    expect(dashboard).toContain("course.enrollment_state === 'STATUS_PAUSED'")
    expect(dashboard).toContain("course.enrollment_state === 'STATUS_COMPLETED'")
    expect(dashboard).toContain("return 'Pausado'")
    expect(dashboard).toContain('Curso concluído. Revise o conteúdo quando quiser.')
    expect(dashboard).toContain('currentCompleted ? `Revisar ${current.title}`')
  })
})
