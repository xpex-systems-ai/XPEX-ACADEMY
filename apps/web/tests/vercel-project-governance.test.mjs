import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import test, { describe } from 'node:test'
import { fileURLToPath } from 'node:url'

const WEB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REPO_ROOT = resolve(WEB_ROOT, '../..')

const configPaths = [
  join(REPO_ROOT, 'vercel.json'),
  join(REPO_ROOT, 'apps/vercel.json'),
  join(WEB_ROOT, 'vercel.json'),
]

const readConfig = path => {
  return JSON.parse(readFileSync(path, 'utf8'))
}

describe('Vercel project governance: Legacy Decommission', () => {
  test('keeps the decommission ignoreCommand synchronized across all root configurations', () => {
    const commands = configPaths.map(p => readConfig(p).ignoreCommand)
    assert.equal(new Set(commands).size, 1, 'All vercel.json ignoreCommands must match')
    assert.match(commands[0], /exit 0/, 'ignoreCommand must exit with 0 to skip all Vercel builds')
    assert.match(commands[0], /Vercel legacy decommissioned/, 'ignoreCommand must state decommission rationale')
  })

  test('enforces autoJobCancelation across all Vercel configuration files', () => {
    for (const path of configPaths) {
      const config = readConfig(path)
      assert.equal(config.github?.autoJobCancelation, true, `${path} must have autoJobCancelation enabled`)
    }
  })

  test('confirms no active Vercel project ID is allowed to build', () => {
    const quarantinedProjects = [
      'prj_EvLi9wcPcy2p7op1ChdvI8kPksKV', // xpex-academy-ai (legacy)
      'prj_EjFGUFVEUm6adcZhhjN4ujtIEj9y', // xpex-academy (duplicate)
      'prj_lusVrpATbArDHBafb4VQAvh14TyE', // xpex-academy-536s (duplicate)
      'prj_XCgo9X30sb5L4Pu2aEQBnQILXlix', // xpex-academy-3rb4 (duplicate)
      'prj_llFFgrz69J0emeMgZhVeZdAMlz8Z', // xpex-academy-sfh6 (duplicate)
    ]

    for (const path of configPaths) {
      const command = readConfig(path).ignoreCommand
      // Ensure the command unconditionally exits with 0 regardless of project ID
      assert.doesNotMatch(command, /exit 1/, `${path} must not exit 1 for any project ID`)
      for (const projectId of quarantinedProjects) {
        assert.doesNotMatch(command, new RegExp(projectId), `${path} should not allowlist ${projectId}`)
      }
    }
  })
})
