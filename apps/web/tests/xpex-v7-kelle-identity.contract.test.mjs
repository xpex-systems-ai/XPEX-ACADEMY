import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const WEB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (...parts) => readFileSync(join(WEB_ROOT, ...parts), 'utf8')

const presets = read('lib/xpex/polo-branding-presets.ts')
const hero = read('components/Xpex/experiences/PoloIdentityHero.tsx')
const section = read('components/Xpex/experiences/XpexPoloSection.tsx')
const experience = read('components/Xpex/AuthenticatedXpexExperience.tsx')
const shell = read('components/Xpex/XpexAuthenticatedShell.tsx')
const students = read('app/xpex/polo/alunos/page.tsx')
const css = read('components/Xpex/xpex.css')
const legacyPole = read('components/Xpex/experiences/PoleExperience.tsx')
const authPanel = read('components/Auth/AuthBrandingPanel.tsx')
const authMobile = read('components/Auth/AuthMobileHeader.tsx')
const login = read('app/auth/login/login.tsx')
const legalFooter = read('components/Footers/LegalFooters.tsx')

describe('Kelle Digital Lab identity rollout', () => {
  test('pins the approved logo and hero to repository-backed assets', () => {
    expect(presets).toContain("logo: '/xpex/polos/kelle-digital-lab/logo-horizontal-v2.svg'")
    expect(presets).toContain("hero_image: '/xpex/polos/kelle-digital-lab/hero-background-v2.png'")
    expect(presets).toContain("footer_credit: 'Tecnologia XPeX'")
  })

  test('renders the official hero responsively and accessibly', () => {
    expect(hero).toContain('xpex-polo-hero-official')
    expect(hero).toContain('Faixa oficial')
    expect(hero).toContain('sizes="(min-width: 1024px) calc(100vw - 19rem), 100vw"')
    expect(css).toContain('aspect-ratio:1536/614')
    expect(css).toContain('object-fit:contain')
  })

  test('opens every polo section with the shared official identity', () => {
    expect(section).toContain('<PoloIdentityHero branding={branding}/>')
    expect(section).toContain('eyebrow={`${branding.organization_name} · ${content.title}`}')
    expect(experience).toContain('branding={poloBranding')
    expect(students).toContain('<PoloIdentityHero branding={poloBranding}/>')
  })

  test('uses the complete official logo in the polo sidebar', () => {
    expect(shell).toContain('xpex-polo-sidebar-logo')
    expect(shell).toContain('width={190}')
    expect(css).toContain('.xpex-polo-sidebar-logo')
  })

  test('keeps presentation surfaces factual and removes demo metrics', () => {
    expect(legacyPole).not.toContain('Quantidade fictícia')
    expect(legacyPole).not.toContain('Dados demonstrativos')
    expect(section).toContain('Ambiente conectado')
    expect(section).toContain('Dados e ações respeitam a organização atual')
    expect(legacyPole).toContain('Ambiente de demonstração')
    expect(legacyPole).toContain('Prévia sem dados operacionais')
    for (const anchor of ['metricas', 'turmas', 'eventos', 'avisos']) {
      expect(legacyPole).toContain(`id="${anchor}"`)
    }
  })

  test('uses the official Kelle hero across desktop and mobile login', () => {
    for (const surface of [authPanel, authMobile]) {
      expect(surface).toContain("identityKey.includes('kelle')")
      expect(surface).toContain('/xpex/polos/kelle-digital-lab/hero-background-v2.png')
      expect(surface).toContain("import Image from 'next/image'")
    }
    expect(authPanel).toContain('sizes="48vw"')
    expect(authMobile).toContain('sizes="100vw"')
    expect(login).toContain('rounded-[28px]')
    expect(login).toContain('-webkit-text-fill-color:white')
  })

  test('makes Kelle the primary login identity and moves XPeX to the footer', () => {
    expect(authPanel).toContain("'Bem-vindo à Kelle Digital Lab'")
    expect(authPanel).toContain('/xpex/polos/kelle-digital-lab/logo-horizontal-v2.svg')
    expect(authMobile).toContain('/xpex/polos/kelle-digital-lab/logo-horizontal-v2.svg')
    expect(login).toContain("title={isKelleDigitalLab ? 'Kelle Digital Lab' : 'XpeX Academy'}")
    expect(login).toContain('alt="Kelle Digital Lab"')
    expect(legalFooter).toContain('Tecnologia por')
    expect(legalFooter).toContain('XPeX Academy AI')
  })
})
