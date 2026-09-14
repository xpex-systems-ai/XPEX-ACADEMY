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

describe('Kelle Digital Lab identity rollout', () => {
  test('pins the approved logo and hero to repository-backed assets', () => {
    expect(presets).toContain("logo: '/xpex/polos/kelle-digital-lab/logo-official.png'")
    expect(presets).toContain("hero_image: '/xpex/polos/kelle-digital-lab/hero-official-clean.jpg'")
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
  })
})
