import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const shell = readFileSync(new URL('../components/Xpex/XpexAuthenticatedShell.tsx', import.meta.url), 'utf8')

describe('XPeX production navigation', () => {
  test('uses public tenant-facing routes instead of double-scoping /orgs paths', () => {
    for (const route of ['/copilot', '/communities', '/certificates', '/search']) {
      expect(shell).toContain(route)
    }
    expect(shell).not.toContain('`/orgs/${organizationSlug}/copilot`')
    expect(shell).not.toContain('`/orgs/${organizationSlug}/communities`')
    expect(shell).not.toContain('`/orgs/${organizationSlug}/certificates`')
    expect(shell).not.toContain('`/orgs/${organizationSlug}/search')
  })
})
