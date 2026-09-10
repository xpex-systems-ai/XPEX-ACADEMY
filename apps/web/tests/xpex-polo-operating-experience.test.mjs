import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = path => readFileSync(join(root, path), 'utf8')

describe('Multi-polo operating experience', () => {
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

  test('renders only configured identity without tenant-specific rules', () => {
    const hero = read('components/Xpex/experiences/PoloIdentityHero.tsx')
    expect(hero).not.toMatch(/kelle|planaltina|normalizeTenantName/i)
    for (const field of ['organization_name', 'location', 'coordinator_name', 'tagline']) expect(hero).toContain(`branding.${field}`)
    expect(hero).not.toMatch(/248|1\.250|3\.800|4\.9/)
  })

  test('uses neutral section copy instead of claiming persisted collections are empty', () => {
    const section = read('components/Xpex/experiences/XpexPoloSection.tsx')
    expect(section).toContain('Catálogo acadêmico da organização')
    expect(section).toContain('Abra a área nativa para consultar os cursos publicados e rascunhos reais desta organização.')
    expect(section).not.toContain('Nenhum curso publicado ainda.')
    expect(section).not.toContain('Nenhuma turma criada ainda.')
  })

  test('renders section-only routes before dashboard-only data fetches', () => {
    const access = read('components/Xpex/AuthenticatedXpexExperience.tsx')
    const sectionBranch = access.indexOf("if (role === 'polo' && poloSection)")
    const readinessFetch = access.indexOf('getXpexLaunchReadiness(session.tokens.access_token, organizationSlug)')
    expect(sectionBranch).toBeGreaterThan(-1)
    expect(readinessFetch).toBeGreaterThan(sectionBranch)
  })
})
