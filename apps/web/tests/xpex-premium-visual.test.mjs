import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

describe('XpeX premium visual foundation', () => {
  const student = read('components/Xpex/experiences/StudentExperience.tsx')
  const primitives = read('components/Xpex/XpexPrimitives.tsx')
  const styles = read('components/Xpex/xpex.css')
  test('extracts and composes the student experience', () => {
    for (const component of ['XpexHero', 'XpexSectionHeader', 'XpexFeatureCard', 'XpexProgressBar']) expect(student).toContain(component)
    for (const id of ['visao-geral','cursos','trilhas','projetos','eventos','comunidade','conquistas','acoes','avisos']) expect(student + primitives).toContain(`id="${id}"`)
  })
  test('offers typed reusable premium primitives', () => {
    for (const name of ['XpexHero','XpexSectionHeader','XpexPanel','XpexMetricCard','XpexActionCard','XpexProgressBar','XpexStatusBadge','XpexFeatureCard','XpexAmbientGlow']) expect(primitives).toMatch(new RegExp(`export (function|const) ${name}`))
  })
  test('defines premium tokens, focus, and reduced motion', () => {
    for (const token of ['--xpex-bg-0','--xpex-orange','--xpex-cyan','--xpex-radius-hero']) expect(styles).toContain(token)
    expect(styles).toContain('prefers-reduced-motion')
    expect(styles).toContain(':focus-visible')
  })
  test('introduces no remote data or imagery', () => {
    expect(student).not.toContain('fetch(')
    expect(student).not.toMatch(/https?:\/\//)
  })
})
