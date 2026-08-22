import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

describe('XPEX-BETA-006B live brand completion and environment governance', () => {
  const layout = read('app/layout.tsx')
  const loginPage = read('app/auth/login/page.tsx')
  const orgGateway = read('components/Objects/StyledElements/Error/OrgNotFound.tsx')
  const authPanel = read('components/Auth/AuthBrandingPanel.tsx')
  const mobileHeader = read('components/Auth/AuthMobileHeader.tsx')
  const notFound = read('app/not-found.tsx')
  const primitives = read('components/Xpex/XpexPrimitives.tsx')
  const student = read('components/Xpex/experiences/StudentExperience.tsx')
  const teacher = read('components/Xpex/experiences/TeacherExperience.tsx')
  const pole = read('components/Xpex/experiences/PoleExperience.tsx')
  const governance = read('../../docs/xpex/environment-governance.md')

  test('declares Brazilian Portuguese and avoids a global nested main landmark', () => {
    expect(layout).toContain('lang="pt-BR"')
    expect(layout).toContain('<div className="animate-fade-in">')
    expect(layout).not.toContain('<main className="animate-fade-in">')
  })

  test('brands the live access surfaces as XpeX Academy', () => {
    for (const source of [loginPage, orgGateway, authPanel, mobileHeader]) {
      expect(source).toContain('XpeX Academy')
    }
    expect(loginPage).not.toContain('Login — LearnHouse')
    expect(orgGateway).not.toContain('Enter Your Organization')
    expect(orgGateway).not.toContain('your-organization')
    expect(orgGateway).toContain('O roteamento institucional ainda não está ativo neste ambiente Beta')
  })

  test('replaces the legacy 404 with a Portuguese XpeX route', () => {
    expect(notFound).toContain('Esta rota saiu da trilha.')
    expect(notFound).toContain('XpeX')
    expect(notFound).not.toContain('black_logo.png')
    expect(notFound).not.toContain('We are very sorry')
  })

  test('keeps the org chooser and auth metadata within XpeX branding', () => {
    const home = read('app/home/home.tsx')
    const signup = read('app/auth/signup/page.tsx')
    const forgot = read('app/auth/forgot/page.tsx')
    const reset = read('app/auth/reset/page.tsx')
    const verify = read('app/auth/verify-email/page.tsx')

    for (const source of [home, signup, forgot, reset, verify]) {
      expect(source).not.toContain('LearnHouse')
    }
    expect(home).toContain('XpeX Academy')
    expect(signup).toContain('Cadastro —')
  })

  test('makes non-persistent actions explicit instead of pretending to work', () => {
    expect(primitives).toContain('export function XpexDemoButton')
    expect(primitives).toContain('disabled aria-disabled="true"')
    expect(primitives).toContain('Ação demonstrativa — sem persistência')
    expect(primitives).toContain('return <article className="xpex-card w-full')
    expect(student).toContain('<XpexDemoButton>Continuar aprendizagem</XpexDemoButton>')
    expect(teacher).toContain('<XpexDemoButton>Abrir fila demonstrativa</XpexDemoButton>')
  })

  test('removes aging relative and fixed dates from beta experiences', () => {
    const experiences = student + teacher + pole
    for (const stale of ['amanhã, 19h', '05 AGO', '07 AGO', '12 AGO', '19 AGO']) {
      expect(experiences).not.toContain(stale)
    }
    expect(experiences).toContain('agenda configurável')
    expect(experiences).toContain('Data demonstrativa')
  })

  test('documents temporary beta policy, promotion and rollback', () => {
    for (const phrase of [
      'Política temporária da Beta pública',
      'A branch `dev` está conectada ao target público de produção da Vercel',
      'Criar a branch `production`',
      'Rollback',
      'Não corrigir regressão criando outro projeto Vercel',
    ]) {
      expect(governance).toContain(phrase)
    }
  })
})
