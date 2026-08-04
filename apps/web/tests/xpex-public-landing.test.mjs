import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

describe('XpeX public premium landing', () => {
  const landing = read('components/Landings/XpexAcademy/XpexAcademyLanding.tsx')
  const brand = read('lib/xpex-brand.ts')
  const metadata = read('app/page.tsx')
  const styles = read('components/Xpex/xpex.css')

  test('links public journey to all beta experiences and student hero CTA', () => {
    for (const route of ['/beta/aluno', '/beta/professora', '/beta/polo']) expect(landing).toContain(route)
    expect(landing).toContain('Explorar área do aluno')
    expect(landing).toContain('href="/beta/aluno"')
  })

  test('renders required public anchors', () => {
    for (const id of ['experiencias', 'ecossistema', 'como-funciona', 'transparencia']) expect(landing).toContain(`id="${id}"`)
  })

  test('represents official premium orange, blue and cyan identity', () => {
    for (const color of ['#FF6A00', '#FF8A2A', '#087CFF', '#16D9FF']) expect(landing + brand).toContain(color)
  })

  test('loads the shared visual foundation and reduced-motion policy', () => {
    expect(landing).toContain("import '../../Xpex/xpex.css'")
    expect(landing).toContain('className="xpex-root')
    expect(styles).toContain('prefers-reduced-motion')
  })

  test('removes legacy yellow and gold public actions', () => {
    for (const legacy of ['yellow-200', 'yellow-300', 'yellow-400']) expect(landing).not.toContain(legacy)
    expect(brand).not.toContain('#FACC15')
  })

  test('does not introduce backend calls, remote assets or fake functional forms', () => {
    expect(landing + brand).not.toContain('fetch(')
    expect(landing + brand).not.toMatch(/https?:\/\//)
    expect(landing).not.toMatch(/<form\b/)
    expect(landing).not.toMatch(/<input\b/)
  })

  test('keeps beta, fictitious data, roadmap and attribution transparent', () => {
    for (const phrase of ['Preview Beta', 'dados fictícios', 'Roadmap', 'LearnHouse', 'AGPL-3.0']) expect(landing + brand).toContain(phrase)
  })

  test('public metadata avoids unverified global operation claims', () => {
    expect(metadata).toContain('Aprendizagem, Criação e Inteligência Artificial')
    expect(metadata).toContain('aprender, praticar, desenvolver projetos')
    expect(metadata).not.toContain('Plataforma Global')
  })
})
