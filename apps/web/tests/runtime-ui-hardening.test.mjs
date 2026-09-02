import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dir, '..')

const read = (path) => readFileSync(resolve(root, path), 'utf8')

describe('runtime UI hardening', () => {
  test('SaaS hub links require both multi tenancy and SaaS deployment mode', () => {
    const source = read('components/Security/HeaderProfileBox.tsx')

    expect(source).toContain('getDeploymentMode')
    expect(source).toContain("const hubAvailable = multiOrg && deploymentMode !== 'oss' && deploymentMode !== 'ee'")
    expect(source).toContain('{hubAvailable && (')
    expect(source).not.toContain('{multiOrg && (')
  })

  test('failed avatar URLs are reused as the placeholder across remounts', () => {
    const source = read('components/Objects/UserAvatar.tsx')

    expect(source).toContain('const failedAvatarUrls = new Set<string>()')
    expect(source).toContain('failedAvatarUrls.has(resolvedAvatarUrl)')
    expect(source).toContain('failedAvatarUrls.add(resolvedAvatarUrl)')
    expect(source).toContain('src={hasError ? emptyAvatarUrl : resolvedAvatarUrl}')
  })
})
