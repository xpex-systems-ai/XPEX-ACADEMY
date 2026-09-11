import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const WEB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REPO_ROOT = resolve(WEB_ROOT, '../..')
const OFFICIAL_PROJECT_ID = 'prj_EvLi9wcPcy2p7op1ChdvI8kPksKV'
const AUDITED_PREVIEW_BRANCHES = [
  'feat/xpex-v6-002-polo-foundation',
  'feat/xpex-v6-003-kelle-digital-lab-v1',
]
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

const commandStatus = (command, projectId, { vercelEnv = 'production', gitRef = 'dev' } = {}) => spawnSync('sh', ['-c', command], {
  env: {
    ...process.env,
    VERCEL_PROJECT_ID: projectId,
    VERCEL_ENV: vercelEnv,
    VERCEL_GIT_COMMIT_REF: gitRef,
  },
}).status

describe('Vercel project governance', () => {
  test('keeps the same canonical allowlist in every supported root directory', () => {
    const commands = configPaths.map(readIgnoreCommand)
    expect(new Set(commands).size).toBe(1)
    expect(commands[0]).toContain(OFFICIAL_PROJECT_ID)
    expect(commands[0]).toContain('feat/xpex-v6-*')
  })

  test('builds the official project and quarantines duplicates by default', () => {
    for (const path of configPaths) {
      const command = readIgnoreCommand(path)
      expect(commandStatus(command, OFFICIAL_PROJECT_ID)).toBe(1)
      for (const projectId of QUARANTINED_PROJECT_IDS) {
        expect(commandStatus(command, projectId)).toBe(0)
      }
      expect(commandStatus(command, 'prj_future_duplicate')).toBe(0)
    }
  })

  test('allows audited XPeX V6 preview branches through quarantine only in preview', () => {
    for (const path of configPaths) {
      const command = readIgnoreCommand(path)
      for (const projectId of QUARANTINED_PROJECT_IDS) {
        for (const gitRef of AUDITED_PREVIEW_BRANCHES) {
          expect(commandStatus(command, projectId, { vercelEnv: 'preview', gitRef })).toBe(1)
          expect(commandStatus(command, projectId, { vercelEnv: 'production', gitRef })).toBe(0)
        }
        expect(commandStatus(command, projectId, { vercelEnv: 'preview', gitRef: 'feat/other-branch' })).toBe(0)
      }
    }
  })
})
