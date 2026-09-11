import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test'

// Bun module mocks are process-wide. Restore copied exports to avoid leaking
// service doubles into other files when the full repository suite runs.
const originals = [
  ['../lib/auth/server', { ...await import('../lib/auth/server') }],
  ['next/navigation', { ...await import('next/navigation') }],
  ['../lib/xpex/launch-ops', { ...await import('../lib/xpex/launch-ops') }],
  ['../lib/xpex/polo-branding-server', { ...await import('../lib/xpex/polo-branding-server') }],
  ['../lib/xpex/learning-dashboard', { ...await import('../lib/xpex/learning-dashboard') }],
  ['../lib/xpex/teacher-dashboard', { ...await import('../lib/xpex/teacher-dashboard') }],
  ['../lib/xpex/launch-readiness', { ...await import('../lib/xpex/launch-readiness') }],
  ['../components/Xpex/XpexAuthenticatedShell', { ...await import('../components/Xpex/XpexAuthenticatedShell') }],
  ['../components/Xpex/experiences/AuthenticatedDashboard', { ...await import('../components/Xpex/experiences/AuthenticatedDashboard') }],
  ['../components/Xpex/experiences/FuturisticStudentDashboard', { ...await import('../components/Xpex/experiences/FuturisticStudentDashboard') }],
  ['../components/Xpex/experiences/XpexPoloSection', { ...await import('../components/Xpex/experiences/XpexPoloSection') }],
  ['../components/Xpex/XpexPrimitives', { ...await import('../components/Xpex/XpexPrimitives') }],
]
afterAll(() => { for (const [path, exports] of originals) mock.module(path, () => exports) })

let principal
let coreAllows
let mutations
let verifiedSlugs
const organization = { slug: 'org-a', name: 'Organization A' }
const makeSession = role => ({ user: { first_name: 'Test' }, roles: [{ org: organization, role: { role_uuid: role } }], tokens: { access_token: 'test-only' } })
mock.module('../lib/auth/server', () => ({ getServerSession: async () => principal }))
mock.module('next/navigation', () => ({ redirect: path => { throw Error(`REDIRECT:${path}`) } }))
mock.module('../lib/xpex/launch-ops', () => ({
  listXpexLaunchCourses: async (_token, slug) => { verifiedSlugs.push(slug); if (!coreAllows) throw Error('403'); return [{ course_uuid: 'course-test', name: 'Test course' }] },
  inviteXpexLaunchStudent: async (...args) => { mutations.push(['invite', ...args]); return {} },
  enrollXpexLaunchStudent: async (...args) => { mutations.push(['enroll', ...args]); return { status: 'enrolled' } },
}))
mock.module('../lib/xpex/polo-branding-server', () => ({ getPoloBranding: async () => ({ organization_name: 'Organization A' }) }))
mock.module('../lib/xpex/learning-dashboard', () => ({ getXpexLearningDashboard: async () => ({ courses: [] }) }))
mock.module('../lib/xpex/teacher-dashboard', () => ({ getXpexTeacherDashboard: async () => { throw Error('403') } }))
mock.module('../lib/xpex/launch-readiness', () => ({ getXpexLaunchReadiness: async () => null }))
mock.module('../components/Xpex/XpexAuthenticatedShell', () => ({ XpexAuthenticatedShell: () => null }))
mock.module('../components/Xpex/experiences/AuthenticatedDashboard', () => ({ AuthenticatedDashboard: () => null }))
mock.module('../components/Xpex/experiences/FuturisticStudentDashboard', () => ({ FuturisticStudentDashboard: () => null }))
mock.module('../components/Xpex/experiences/XpexPoloSection', () => ({ XpexPoloSection: () => null }))
mock.module('../components/Xpex/XpexPrimitives', () => ({ XpexErrorState: () => null }))

const { default: StudentsPage } = await import('../app/xpex/polo/alunos/page.tsx')
const { AuthenticatedXpexExperience } = await import('../components/Xpex/AuthenticatedXpexExperience.tsx')
function forms(tree) {
  if (!tree || typeof tree !== 'object') return []
  if (Array.isArray(tree)) return tree.flatMap(forms)
  return [...(tree.type === 'form' ? [tree.props.action] : []), ...forms(tree.props?.children)]
}
const renderStudents = () => StudentsPage({ searchParams: Promise.resolve({}) })
beforeEach(() => { principal = makeSession('role_global_admin'); coreAllows = true; mutations = []; verifiedSlugs = [] })

describe('Polo server renders and actions (all services mocked; no outbound traffic)', () => {
  test.each(['role_global_instructor', 'role_global_user'])('denies %s the student administration page', async role => {
    principal = makeSession(role)
    await expect(renderStudents()).rejects.toThrow('REDIRECT:/xpex/polo')
    expect(verifiedSlugs).toEqual([])
    expect(mutations).toEqual([])
  })
  test('redirects an anonymous request to login', async () => {
    principal = null
    await expect(renderStudents()).rejects.toThrow('REDIRECT:/login?next=')
  })
  test('denies a missing organization', async () => {
    principal.roles = []
    await expect(renderStudents()).rejects.toThrow('REDIRECT:/xpex/polo')
  })
  test('denies a manager rejected by the live Core', async () => {
    coreAllows = false
    await expect(renderStudents()).rejects.toThrow('REDIRECT:/xpex/polo')
    expect(mutations).toEqual([])
  })
  test('reauthorizes both submitted actions after the page was rendered', async () => {
    const actions = forms(await renderStudents())
    expect(actions).toHaveLength(2)
    coreAllows = false
    const data = new FormData()
    data.set('email', 'fixture@example.invalid')
    data.set('course_uuid', 'course-test')
    for (const action of actions) await expect(action(data)).rejects.toThrow('REDIRECT:/xpex/polo')
    expect(verifiedSlugs).toHaveLength(3)
    expect(mutations).toEqual([])
  })
  test('ignores a form-supplied organization and uses the authorized session organization', async () => {
    const actions = forms(await renderStudents())
    const data = new FormData()
    data.set('email', 'fixture@example.invalid')
    data.set('course_uuid', 'course-test')
    data.set('organization_slug', 'org-b')
    for (const action of actions) await expect(action(data)).rejects.toThrow('REDIRECT:/xpex/polo/alunos?status=')
    expect(mutations.map(item => item[2])).toEqual(['org-a', 'org-a'])
  })
  test.each(['cursos', 'turmas', 'conteudos', 'relatorios', 'configuracoes'])('denies teacher direct navigation to administrative section %s', async poloSection => {
    principal = makeSession('role_global_instructor')
    const tree = await AuthenticatedXpexExperience({ requestedRole: 'polo', returnPath: `/xpex/polo/${poloSection}`, poloSection })
    expect(tree.type.name).toBe('AccessDenied')
  })
  test('allows the reduced teacher overview and denies the student overview', async () => {
    principal = makeSession('role_global_instructor')
    expect((await AuthenticatedXpexExperience({ requestedRole: 'polo', returnPath: '/xpex/polo' })).props.poloAccess.isManager).toBe(false)
    principal = makeSession('role_global_user')
    expect((await AuthenticatedXpexExperience({ requestedRole: 'polo', returnPath: '/xpex/polo' })).type.name).toBe('AccessDenied')
  })
  test('gates manager sections on the live Core', async () => {
    const args = { requestedRole: 'polo', returnPath: '/xpex/polo/cursos', poloSection: 'cursos' }
    expect((await AuthenticatedXpexExperience(args)).props.poloAccess.isManager).toBe(true)
    coreAllows = false
    expect((await AuthenticatedXpexExperience(args)).type.name).toBe('AccessDenied')
  })
  test('preserves the platform administrator default redirect', async () => {
    principal.user.is_superadmin = true
    await expect(AuthenticatedXpexExperience({ returnPath: '/xpex' })).rejects.toThrow('REDIRECT:/xpex/admin')
  })
})
