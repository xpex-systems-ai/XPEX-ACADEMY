import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const shell = read('components/Xpex/XpexAuthenticatedShell.tsx')
const dashboard = read('components/Xpex/experiences/AuthenticatedDashboard.tsx')
const primitives = read('components/Xpex/XpexPrimitives.tsx')
const here = dirname(fileURLToPath(import.meta.url))

describe('authenticated XPeX ecosystem', () => {
  test('provides the shared authenticated shell and accessible landmarks', () => {
    for (const component of ['XpexAuthenticatedShell', 'XpexSidebar', 'XpexTopbar', 'XpexRoleNavigation', 'XpexLegalAttribution']) expect(shell).toContain(`function ${component}`)
    expect(shell).toContain('Pular para o conteúdo')
    expect(shell).toContain('aria-label="Menu principal XpeX"')
  })

  test('routes every student sidebar destination through native authenticated XPeX pages', () => {
    const destinations = {
      'Início': '/xpex/aluno',
      'Meus Cursos': '/xpex/courses',
      'Atividades': '/xpex/activities',
      'Laboratório de IA': '/xpex/ai-lab',
      'Comunidade': '/xpex/community',
      'Certificados': '/xpex/certificates',
    }
    for (const [label, href] of Object.entries(destinations)) {
      expect(shell).toContain(`label: '${label}'`)
      expect(shell).toContain(`href: '${href}'`)
    }
    for (const route of ['ai-lab', 'community', 'certificates', 'search', 'notifications']) {
      expect(existsSync(join(here, '..', 'app', 'xpex', route, 'page.tsx'))).toBe(true)
    }
    expect(shell).toContain("/xpex/search?q=")
    expect(shell).toContain('href="/xpex/notifications"')
    expect(shell).toContain('href="/xpex/ai-lab"')
  })

  test('uses real learner data and honest empty states without fixed metrics', () => {
    expect(dashboard).toContain('data.summary.active_courses')
    expect(dashboard).toContain('Nenhum curso disponível ainda')
    expect(dashboard).toContain('Nenhuma turma disponível')
    expect(dashboard).toContain('Operação ainda sem dados')
    expect(dashboard).not.toMatch(/value="(?:[1-9]\d*|[1-9]\d*%)"/)
  })

  test('exposes shared status and dashboard primitives', () => {
    for (const component of ['XpexRoleHero', 'XpexKpiGrid', 'XpexMetricCard', 'XpexProgressCard', 'XpexCourseCard', 'XpexActivityList', 'XpexQuickAction', 'XpexAnnouncementCard', 'XpexEmptyState', 'XpexLoadingState', 'XpexErrorState', 'XpexComingSoon']) expect(primitives).toContain(component)
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
