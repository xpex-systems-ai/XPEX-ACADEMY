import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import test, { describe } from 'node:test'
import { fileURLToPath } from 'node:url'

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const HOBBY_MAX_DURATION = 300
const MAX_DURATION_EXPORT = /export\s+const\s+maxDuration\s*=\s*([^\n;]+)/g

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? sourceFiles(path) : [path]
  }))
  return files.flat().filter(path => /\.(?:js|jsx|mjs|ts|tsx)$/.test(path))
}

describe('Vercel Hobby function durations', () => {
  test('every Next.js maxDuration export is an integer from 1 through 300', async () => {
    const declarations = []

    for (const path of await sourceFiles(join(WEB_ROOT, 'app'))) {
      const source = await readFile(path, 'utf8')
      for (const match of source.matchAll(MAX_DURATION_EXPORT)) {
        declarations.push({ path, value: match[1].trim() })
      }
    }

    assert.ok(declarations.length > 0, 'Should find maxDuration declarations')
    for (const declaration of declarations) {
      assert.match(
        declaration.value,
        /^\d+$/,
        `${declaration.path} must use a numeric maxDuration literal`,
      )

      const duration = Number(declaration.value)
      assert.equal(
        Number.isInteger(duration) && duration >= 1 && duration <= HOBBY_MAX_DURATION,
        true,
        `${declaration.path} has Hobby-incompatible maxDuration ${declaration.value}`,
      )
    }
  })

  test('vercel.json function durations stay within the Hobby limit', async () => {
    const configPath = join(WEB_ROOT, 'vercel.json')
    let configSource
    try {
      configSource = await readFile(configPath, 'utf8')
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return
      throw error
    }

    const config = JSON.parse(configSource)
    for (const [pattern, functionConfig] of Object.entries(config.functions ?? {})) {
      if (!Object.hasOwn(functionConfig, 'maxDuration')) continue
      const duration = functionConfig.maxDuration
      assert.equal(
        Number.isInteger(duration) && duration >= 1 && duration <= HOBBY_MAX_DURATION,
        true,
        `vercel.json functions[${pattern}] has Hobby-incompatible maxDuration ${duration}`,
      )
    }
  })
})
