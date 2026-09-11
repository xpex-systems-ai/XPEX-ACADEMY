import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const WEB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const shellSource = readFileSync(join(WEB_ROOT, 'components/Xpex/XpexAuthenticatedShell.tsx'), 'utf8')
const heroSource = readFileSync(join(WEB_ROOT, 'components/Xpex/experiences/PoloIdentityHero.tsx'), 'utf8')
const brandingSource = readFileSync(join(WEB_ROOT, 'lib/xpex/polo-branding.ts'), 'utf8')
const presetSource = readFileSync(join(WEB_ROOT, 'lib/xpex/polo-branding-presets.ts'), 'utf8')

describe('XPEX V6-003 persisted Polo identity', () => {
  test('keeps Kelle identity out of runtime source-code conditionals', () => {
    expect(`${shellSource}\n${heroSource}\n${brandingSource}`.toLowerCase()).not.toContain('kelle digital lab')
    expect(`${shellSource}\n${heroSource}\n${brandingSource}`.toLowerCase()).not.toContain('professora kelle')
  })

  test('renders approved hero and teacher identity only from branding', () => {
    expect(heroSource).toContain('branding.hero_image')
    expect(heroSource).toContain('branding.teacher_photo')
    expect(heroSource).toContain('branding.coordinator_name')
    expect(heroSource).toContain('branding.location')
    expect(heroSource).toContain('branding.tagline')
    expect(heroSource).not.toContain('Coordenação:')
  })

  test('registers the approved Kelle hero asset in the declarative preset', () => {
    expect(presetSource).toContain("hero_image: '/xpex/polos/kelle-digital-lab/hero-kelle.png'")
    expect(presetSource).toContain("coordinator_name: 'Professora Kelle'")
    expect(presetSource).toContain("location: 'Campos Lindos/Marajó-GO'")
  })

  test('applies organization colors only to the Polo shell', () => {
    expect(shellSource).toContain("role === 'polo' && !adminNavigation ? getPoloThemeStyle(poloBranding) : undefined")
    expect(shellSource).toContain("--xpex-color-brand-secondary")
    expect(shellSource).toContain("--xpex-color-background-base")
  })

  test('preserves Super Admin branding path', () => {
    expect(shellSource).toContain("adminNavigation ? '/xpex/admin' : `/xpex/${role}`")
    expect(shellSource).toContain('adminNavigation={adminNavigation}')
  })
})
