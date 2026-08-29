import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const tokens = read('components/Xpex/xpex-tokens.css')
const primitives = read('components/Xpex/XpexPrimitives.tsx')
const authenticatedShell = read('components/Xpex/XpexAuthenticatedShell.tsx')
const previewShell = read('components/Xpex/XpexAppShell.tsx')

describe('XPeX Design OS contract', () => {
  test('publishes the official palette through semantic tokens', () => {
    const expected = {
      '--xpex-color-brand-primary': '#0b1220',
      '--xpex-color-brand-secondary': '#ff7a00',
      '--xpex-color-brand-accent': '#00d4ff',
      '--xpex-color-brand-on-primary': '#ffffff',
    }
    for (const [name, value] of Object.entries(expected)) {
      expect(tokens).toContain(`${name}: ${value}`)
    }
  })

  test('covers semantic system categories and remains scoped', () => {
    for (const category of ['background', 'text', 'status']) {
      expect(tokens).toContain(`--xpex-color-${category}-`)
    }
    for (const category of ['spacing', 'radius', 'shadow', 'font', 'motion', 'breakpoint']) {
      expect(tokens).toContain(`--xpex-${category}-`)
    }
    expect(tokens).toMatch(/^\/\*[\s\S]*\.xpex-root\s*\{/)
    expect(tokens).not.toMatch(/(^|})\s*:root\b/)
  })

  test('loads tokens before component styles in both XPeX shells', () => {
    for (const shell of [authenticatedShell, previewShell]) {
      expect(shell.indexOf("import './xpex-tokens.css'")).toBeGreaterThan(-1)
      expect(shell.indexOf("import './xpex-tokens.css'")).toBeLessThan(shell.indexOf("import './xpex.css'"))
    }
  })

  test('uses tokens for the course progress brand gradient', () => {
    expect(primitives).toContain('xpex-progress-fill')
    expect(primitives).not.toMatch(/from-\[#(?:0B1220|00D4FF|FF7A00)\]/i)
  })
})
