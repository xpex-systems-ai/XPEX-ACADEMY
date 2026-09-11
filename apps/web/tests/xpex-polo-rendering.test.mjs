import { afterAll, describe, expect, mock, test } from 'bun:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { resolveXpexPoloAccess } from '../lib/xpex/access.ts'

const originalNavigation = { ...await import('next/navigation') }
const originalAuth = { ...await import('../components/Contexts/AuthContext') }
afterAll(() => {
  mock.module('next/navigation', () => originalNavigation)
  mock.module('../components/Contexts/AuthContext', () => originalAuth)
})
mock.module('next/navigation', () => ({ usePathname: () => '/xpex/polo', useRouter: () => ({ push() {} }) }))
mock.module('../components/Contexts/AuthContext', () => ({ signOut() {} }))
const { AuthenticatedDashboard } = await import('../components/Xpex/experiences/AuthenticatedDashboard.tsx')
const { XpexRoleNavigation, XpexSidebar } = await import('../components/Xpex/XpexAuthenticatedShell.tsx')
const { XpexPoloSection } = await import('../components/Xpex/experiences/XpexPoloSection.tsx')
const access = role => resolveXpexPoloAccess([{ role: { role_uuid: role }, org: { slug: 'org-a' } }], 'org-a')
const render = (Component, props) => renderToStaticMarkup(createElement(Component, props))
const props = { role: 'polo', displayName: 'Test', organizationSlug: 'org-a', organizationName: 'Organization A' }

describe('Polo factual rendering and navigation', () => {
  test('missing snapshots do not turn into zero metrics or false empty collections', () => {
    const html = render(AuthenticatedDashboard, { ...props, poloAccess: access('role_global_admin') })
    expect(html).toContain('Prontidão ainda sem dados')
    expect(html).not.toContain('0 alunos ativos')
    expect(html).not.toContain('0 atividades concluídas')
    expect(html).not.toContain('Nenhuma turma disponível')
    expect(html).toContain('Resumo de turmas em breve')
  })
  test('missing teacher data does not become a zero-filled KPI grid', () => {
    const html = render(AuthenticatedDashboard, { ...props, poloAccess: access('role_global_instructor') })
    expect(html).toContain('Não foi possível carregar sua visão pedagógica')
    expect(html).not.toContain('Alunos matriculados')
  })
  test('shows exact supplied metrics, including a real zero', () => {
    const launchReadiness = { metrics: { published_courses: 2, published_activities: 7, enrolled_students: 3, active_students: 3, teachers: 1, completed_activities: 4, completed_students: 0 }, gates: {}, ready_for_controlled_pilot: false, ready_for_official_intake: false }
    const html = render(AuthenticatedDashboard, { ...props, poloAccess: access('role_global_admin'), launchReadiness })
    expect(html).toContain('3 alunos ativos')
    expect(html).toContain('4 atividades concluídas')
    expect(html).toContain('0 alunos concluídos')
  })
  test('the reduced teacher navigation exposes only the overview and authored-course panel', () => {
    const html = render(XpexRoleNavigation, { ...props, poloAccess: access('role_global_instructor') })
    expect(html).toContain('href="/xpex/polo#cursos"')
    expect(html).not.toContain('/xpex/polo/alunos')
    expect(html).not.toContain('/xpex/polo/configuracoes')
    expect(html).not.toContain('/xpex/admin')
  })
  test('does not expose unintegrated launch destinations', () => {
    const html = render(XpexRoleNavigation, { ...props, poloAccess: access('role_global_admin') })
    expect(html).toContain('/xpex/polo/alunos')
    for (const section of ['trilhas', 'mentorias', 'eventos', 'certificados', 'recursos']) {
      expect(html).not.toContain(`/xpex/polo/${section}`)
      expect(render(XpexPoloSection, { section, organizationSlug: 'org-a' })).toContain('Em breve')
    }
  })
  test('keeps the platform admin navigation and brand independent of Polo props', () => {
    const html = render(XpexSidebar, { ...props, adminNavigation: true, adminAccess: true, open: false, close() {}, poloBranding: { organization_name: 'Tenant branding' } })
    expect(html).toContain('/xpex/admin/alunos')
    expect(html).toContain('XPeX')
    expect(html).not.toContain('Tenant branding')
    expect(html).not.toContain('/xpex/polo/alunos')
  })
})
