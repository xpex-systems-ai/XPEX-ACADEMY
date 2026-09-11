import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const WEB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (...parts) => readFileSync(join(WEB_ROOT, ...parts), 'utf8')
const dashboard = read('components/Xpex/experiences/AuthenticatedDashboard.tsx')
const hero = read('components/Xpex/experiences/PoloIdentityHero.tsx')
const shell = read('components/Xpex/XpexAuthenticatedShell.tsx')
const presets = read('lib/xpex/polo-branding-presets.ts')

describe('XPEX V6-004.1 Kelle production overview', () => {
  test('removes teacher-facing QA and promotional mock copy from the overview', () => {
    const overview = `${dashboard}\n${hero}\n${shell}`
    for (const copy of ['Pronto para piloto controlado', 'CHECK', 'Coordenação:', 'REVISAR', 'Dados demonstrativos', 'Quantidade fictícia']) {
      expect(overview).not.toContain(copy)
    }
  })

  test('provides Kelle identity and resilient logo and photo slots through branding', () => {
    expect(presets).toContain("organization_name: 'KELLE DIGITAL LAB'")
    expect(presets).toContain("location: 'Campos Lindos/Marajó-GO'")
    expect(presets).toContain("coordinator_name: 'Professora Kelle'")
    expect(hero).toContain('branding.logo')
    expect(hero).toContain('branding.teacher_photo')
    expect(hero).toContain('xpex-polo-logo-slot')
    expect(hero).toContain('xpex-teacher-photo-placeholder')
  })

  test('keeps KPIs tied to persisted launch-readiness metrics and overview links inside XpeX', () => {
    for (const metric of ['published_courses', 'published_activities', 'enrolled_students', 'teachers', 'active_students', 'completed_activities', 'completed_students']) {
      expect(dashboard).toContain(`data.metrics.${metric}`)
    }
    for (const href of ['/xpex/polo/turmas', '/xpex/polo/cursos', '/xpex/polo/alunos', '/xpex/polo/relatorios']) {
      expect(dashboard).toContain(`href="${href}"`)
    }
    expect(dashboard).not.toContain("'/dash/")
    expect(dashboard).not.toContain('xpexCourseStudioRoute')
  })

  test('keeps Super Admin navigation independent from Polo branding', () => {
    expect(shell).toContain("adminNavigation ? '/xpex/admin' : `/xpex/${role}`")
    expect(shell).toContain('!adminNavigation')
  })
})
