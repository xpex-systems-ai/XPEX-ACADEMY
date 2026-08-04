import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const shell = read('components/Beta/BetaShell.tsx')
const student = read('components/Xpex/experiences/StudentExperience.tsx')
const teacher = read('components/Xpex/experiences/TeacherExperience.tsx')
const pole = read('components/Xpex/experiences/PoleExperience.tsx')
const primitives = read('components/Xpex/XpexPrimitives.tsx')

describe('premium teacher and pole experiences', () => {
  test('extracts both roles and keeps BetaShell as a lightweight router', () => {
    for (const name of ['StudentExperience', 'TeacherExperience', 'PoleExperience']) {
      expect(shell).toContain(`import { ${name} }`)
      expect(shell).toContain(name)
    }
    expect(teacher).toContain('export function TeacherExperience()')
    expect(pole).toContain('export function PoleExperience()')
    expect(shell).not.toMatch(/function (Teacher|Pole)\(/)
    expect(shell.split('\n').length).toBeLessThan(25)
  })

  test.each([
    ['teacher', teacher, ['visao-geral', 'metricas', 'turma', 'participantes', 'conteudos', 'atividades', 'eventos', 'avisos']],
    ['pole', pole, ['visao-geral', 'metricas', 'turmas', 'eventos', 'atividades', 'avisos']],
  ])('renders every %s anchor in relevant content', (_, source, anchors) => {
    for (const id of anchors) expect(source + primitives).toContain(`id="${id}"`)
    for (const id of anchors) expect((source + primitives).match(new RegExp(`id="${id}"`, 'g'))).toHaveLength(1)
  })

  test.each([['teacher', teacher], ['pole', pole]])('composes %s from premium primitives', (_, source) => {
    for (const name of ['XpexHero', 'XpexSectionHeader', 'XpexPanel', 'XpexMetricCard', 'XpexActionCard', 'XpexProgressBar', 'XpexBadge']) expect(source).toContain(name)
  })

  test('keeps all experiences local and visibly demonstrative', () => {
    const experiences = teacher + pole
    expect(experiences).not.toContain('fetch(')
    expect(experiences).not.toContain('getAPIUrl')
    expect(experiences).not.toMatch(/https?:\/\//)
    expect(teacher).toMatch(/fictíci|demonstrativ/i)
    expect(pole).toMatch(/fictíci|demonstrativ/i)
    expect(pole).toContain('Não há dados financeiros, matrículas, dados pessoais ou chamadas ao backend.')
  })

  test('preserves the student wiring without moving its experience', () => {
    expect(shell).toContain('aluno: StudentExperience')
    expect(student).toContain('export function StudentExperience()')
  })
})
