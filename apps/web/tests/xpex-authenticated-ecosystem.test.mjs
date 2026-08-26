import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const shell = read('components/Xpex/XpexAuthenticatedShell.tsx')
const dashboard = read('components/Xpex/experiences/AuthenticatedDashboard.tsx')
const futuristicDashboard = read('components/Xpex/experiences/FuturisticStudentDashboard.tsx')
const primitives = read('components/Xpex/XpexPrimitives.tsx')
const trails = read('app/xpex/trails/page.tsx')
const testsDirectory = dirname(fileURLToPath(import.meta.url))

describe('authenticated XPeX ecosystem', () => {
  test('provides the shared authenticated shell and accessible landmarks', () => {
    for (const component of ['XpexAuthenticatedShell', 'XpexSidebar', 'XpexTopbar', 'XpexRoleNavigation', 'XpexLegalAttribution']) {
      expect(shell).toContain(`function ${component}`)
    }
    expect(shell).toContain('Pular para o conteúdo')
    expect(shell).toContain('usePathname()')
    expect(shell).toContain('aria-label="Menu principal XpeX"')
  })

  test('routes every student destination through native authenticated pages', () => {
    const destinations = {
      'Início': '/xpex/aluno',
      'Meus Cursos': '/xpex/courses',
      'Trilhas': '/xpex/trails',
      'Atividades': '/xpex/activities',
      'Laboratório de IA': '/xpex/ai-lab',
      'Comunidade': '/xpex/community',
      'Certificados': '/xpex/certificates',
    }

    for (const [label, href] of Object.entries(destinations)) {
      expect(shell).toContain(`label: '${label}'`)
      expect(shell).toContain(`href: '${href}'`)
    }

    for (const route of ['trails', 'ai-lab', 'community', 'certificates', 'search', 'notifications']) {
      expect(existsSync(join(testsDirectory, '..', 'app', 'xpex', route, 'page.tsx'))).toBe(true)
    }

    expect(shell).toContain('/xpex/search?q=')
    expect(shell).toContain('href="/xpex/notifications"')
    expect(shell).toContain('href="/xpex/ai-lab"')
  })

  test('keeps futuristic dashboard actions inside the native XPeX student shell', () => {
    for (const href of ['/xpex/courses', '/xpex/activities', '/xpex/ai-lab', '/xpex/community', '/xpex/certificates']) {
      expect(futuristicDashboard).toContain(`href="${href}"`)
    }
    expect(futuristicDashboard).not.toContain('/orgs/${organizationSlug}/courses')
    expect(futuristicDashboard).not.toContain('/orgs/${organizationSlug}/copilot')
    expect(futuristicDashboard).not.toContain('/orgs/${organizationSlug}/communities')
    expect(futuristicDashboard).not.toContain('/orgs/${organizationSlug}/certificates')
  })

  test('keeps trails grounded in authorized learner data', () => {
    expect(trails).toContain("getAuthorizedStudentLearning('/xpex/trails')")
    expect(trails).toContain('learning.data.courses')
    expect(trails).toContain('course.completed_lessons')
    expect(trails).toContain('course.total_lessons')
    expect(trails).toContain('course.progress_percent')
    expect(trails).toContain('Em breve')
    expect(trails).not.toContain('18.6K')
    expect(trails).not.toContain('5.342')
    expect(trails).not.toContain('1.254h')
  })

  test('uses real learner data and honest empty states without fixed metrics', () => {
    expect(dashboard).toContain('data.summary.active_courses')
    expect(dashboard).toContain('Nenhum curso disponível ainda')
    expect(dashboard).toContain('Nenhuma turma disponível')
    expect(dashboard).toContain('Operação ainda sem dados')
    expect(dashboard).not.toMatch(/value="(?:[1-9]\d*|[1-9]\d*%)"/)
  })

  test('exposes shared status and dashboard primitives', () => {
    for (const component of ['XpexRoleHero', 'XpexKpiGrid', 'XpexMetricCard', 'XpexProgressCard', 'XpexCourseCard', 'XpexActivityList', 'XpexQuickAction', 'XpexAnnouncementCard', 'XpexEmptyState', 'XpexLoadingState', 'XpexErrorState', 'XpexComingSoon']) {
      expect(primitives).toContain(component)
    }
    expect(primitives).toContain('aria-live="polite"')
    expect(primitives).toContain('aria-live="assertive"')
    expect(primitives).toContain('role="progressbar"')
  })

  test('preserves source, license, and modified-version attribution', () => {
    expect(shell).toContain('Versão modificada')
    expect(shell).toContain('Licença AGPL-3.0')
    expect(shell).toContain('Código-fonte correspondente')
  })
})
