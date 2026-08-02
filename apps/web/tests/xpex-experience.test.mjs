import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

describe('XpeX presentation routes', () => {
  test.each(['aluno', 'professora', 'polo'])('provides /beta/%s', role => {
    const page = read(`app/beta/${role}/page.tsx`)
    expect(page).toContain(`role="${role}"`)
  })

  test('links the landing to every beta experience', () => {
    const landing = read('components/Landings/XpexAcademy/XpexAcademyLanding.tsx')
    for (const route of ['/beta/aluno', '/beta/professora', '/beta/polo']) expect(landing).toContain(route)
  })

  test('keeps demo dashboards isolated from APIs and transparent', () => {
    const dashboard = read('components/Beta/BetaShell.tsx')
    expect(dashboard).not.toContain('fetch(')
    expect(dashboard).not.toContain('getAPIUrl')
    expect(dashboard).toContain('Dados fictícios')
    expect(dashboard + read('components/Xpex/XpexAppShell.tsx')).toContain('não persistem')
  })
})
