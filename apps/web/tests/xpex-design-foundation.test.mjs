import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../components/Xpex/xpex.css', import.meta.url), 'utf8')
const shell = readFileSync(new URL('../components/Xpex/XpexAppShell.tsx', import.meta.url), 'utf8')
const landing = readFileSync(new URL('../components/Landings/XpexAcademy/XpexAcademyLanding.tsx', import.meta.url), 'utf8')

describe('XpeX official design foundation', () => {
  test('declares the official palette on the scoped root', () => {
    for (const token of [
      '--xpex-background-primary:#05080d', '--xpex-background-secondary:#0b1220',
      '--xpex-surface:#101a2b', '--xpex-surface-elevated:#142238', '--xpex-orange:#ff7a00',
      '--xpex-cyan:#00d4ff', '--xpex-deep-blue:#0b1d3a', '--xpex-purple:#8b5cf6',
      '--xpex-white:#fff', '--xpex-text-secondary:#b8c4d6', '--xpex-border:#223550',
      '--xpex-success:#22c55e',
    ]) expect(css).toContain(token)
    expect(css).toContain('--xpex-heading-font:"Exo 2"')
    expect(css).not.toMatch(/(^|})\s*:root\b/)
    expect(css).not.toMatch(/(^|})\s*body\b/)
  })

  test('limits reduced motion and keeps accessible foundation controls', () => {
    const motionRule = css.match(/@media\(prefers-reduced-motion:reduce\)\{([^}]*)/s)?.[1] ?? ''
    expect(motionRule).toContain('.xpex-root')
    expect(motionRule).not.toMatch(/(^|,)\s*\*/) 
    expect(shell).toContain('className="xpex-skip"')
    expect(shell).toContain('Em breve')
  })

  test('shares primitives and exposes attribution, license and source', () => {
    expect(landing).toContain('XpexSectionHeader')
    for (const source of [shell, landing]) {
      expect(source).toContain('LearnHouse')
      expect(source).toContain('Licença AGPL-3.0')
      expect(source).toContain('Código-fonte correspondente')
      expect(source).toContain('xpex-systems-ai')
      expect(source).toContain('XPEX-ACADEMY')
    }
  })
})
