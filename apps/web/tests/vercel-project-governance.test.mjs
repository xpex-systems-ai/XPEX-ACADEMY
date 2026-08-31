import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const WEB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REPO_ROOT = resolve(WEB_ROOT, '../..')
const OFFICIAL_PROJECT_ID = 'prj_EvLi9wcPcy2p7op1ChdvI8kPksKV'
const QUARANTINED_PROJECT_IDS = [
  'prj_EjFGUFVEUm6adcZhhjN4ujtIEj9y',
  'prj_lusVrpATbArDHBafb4VQAvh14TyE',
  'prj_XCgo9X30sb5L4Pu2aEQBnQILXlix',
  'prj_llFFgrz69J0emeMgZhVeZdAMlz8Z',
]

const configPaths = [
  join(REPO_ROOT, 'vercel.json'),
  join(REPO_ROOT, 'apps/vercel.json'),
  join(WEB_ROOT, 'vercel.json'),
]

const readIgnoreCommand = path => {
  const config = JSON.parse(readFileSync(path, 'utf8'))
  expect(typeof config.ignoreCommand).toBe('string')
  return config.ignoreCommand
}

const commandStatus = (command, projectId) => spawnSync('sh', ['-c', command], {
  env: { ...process.env, VERCEL_PROJECT_ID: projectId },
}).status

describe('Vercel project governance', () => {
  test('keeps the same canonical allowlist in every supported root directory', () => {
    const commands = configPaths.map(readIgnoreCommand)
    expect(new Set(commands).size).toBe(1)
    expect(commands[0]).toContain(OFFICIAL_PROJECT_ID)
  })

  test('builds only the official project', () => {
    for (const path of configPaths) {
      const command = readIgnoreCommand(path)
      expect(commandStatus(command, OFFICIAL_PROJECT_ID)).toBe(1)
      for (const projectId of QUARANTINED_PROJECT_IDS) {
        expect(commandStatus(command, projectId)).toBe(0)
      }
      expect(commandStatus(command, 'prj_future_duplicate')).toBe(0)
    }
  })
})
