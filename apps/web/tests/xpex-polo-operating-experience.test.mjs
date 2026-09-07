import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const read = path => readFileSync(join(root, path), 'utf8')

describe('Kelle Digital Lab polo operating experience', () => {
  test('publishes every required authenticated sidebar destination', () => {
    const shell = read('components/Xpex/XpexAuthenticatedShell.tsx')
    for (const route of ['turmas', 'cursos', 'trilhas', 'mentorias', 'eventos', 'conteudos', 'relatorios', 'certificados', 'recursos', 'configuracoes']) expect(shell).toContain(`'/xpex/polo/${route}'`)
    expect(existsSync(join(root, 'app/xpex/polo/[section]/page.tsx'))).toBe(true)
  })
  test('keeps organization pages behind server-side access resolution', () => {
    const page = read('app/xpex/polo/[section]/page.tsx')
    const access = read('components/Xpex/AuthenticatedXpexExperience.tsx')
    expect(page).toContain('requestedRole="polo"')
    expect(access).toContain('resolveXpexPoloAccess')
    expect(access).toContain('encodeURIComponent(returnPath)')
  })
  test('shows tenant identity without fabricated operational metrics', () => {
    const dashboard = read('components/Xpex/experiences/PoloIdentityHero.tsx')
    for (const text of ['Educação que inspira, tecnologia que transforma.', 'Planaltina DF, Brasil', 'Professora Kelle']) expect(dashboard).toContain(text)
    expect(dashboard).not.toMatch(/248|1\.250|3\.800|4\.9/)
  })
})
