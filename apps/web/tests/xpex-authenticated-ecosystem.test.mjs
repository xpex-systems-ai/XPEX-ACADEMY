import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const shell = read('components/Xpex/XpexAuthenticatedShell.tsx')
const dashboard = read('components/Xpex/experiences/AuthenticatedDashboard.tsx')
const primitives = read('components/Xpex/XpexPrimitives.tsx')
const navigation = read('components/Xpex/xpex-navigation.ts')

describe('PR-02 authenticated ecosystem', () => {
  test('provides the shared authenticated shell and accessible landmarks', () => {
    for (const component of ['XpexAuthenticatedShell', 'XpexSidebar', 'XpexTopbar', 'XpexRoleNavigation', 'XpexLegalAttribution']) expect(shell).toContain(`function ${component}`)
    expect(shell).toContain('Pular para o conteúdo')
    expect(shell).toContain('aria-current={index === 0 ? \'page\' : undefined}')
    expect(shell).toContain('aria-label="Menu principal XpeX"')
  })
  test('keeps student navigation limited to functional destinations', () => {
    for (const label of ['Início', 'Meus Cursos', 'Atividades']) expect(navigation).toContain(`label: '${label}'`)
    for (const label of ['Laboratório de IA', 'Comunidade', 'Certificados']) expect(navigation).not.toContain(`label: '${label}'`)
    expect(shell).toContain("const isFunctional = index === 0 || role === 'aluno'")
    expect(shell).toContain('href={index === 0 ? `/xpex/${role}` : href}')
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
