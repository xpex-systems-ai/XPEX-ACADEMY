import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test, { describe } from 'node:test'

const root = process.cwd()
const repoRoot = path.resolve(root, '../..')

const rootVercelJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'vercel.json'), 'utf8'))
const appsVercelJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'apps/vercel.json'), 'utf8'))
const webVercelJson = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'))

describe('Mission XPEX-LEGACY-VERCEL-DECOMMISSION-001 Contract Tests', () => {
  test('all three vercel.json configurations enforce exit 0 to cancel builds immediately', () => {
    const configs = [rootVercelJson, appsVercelJson, webVercelJson]
    for (const cfg of configs) {
      assert.ok(cfg.ignoreCommand, 'ignoreCommand must be defined')
      assert.match(cfg.ignoreCommand, /exit 0/, 'Must exit 0 to ignore/skip build on Vercel')
      assert.match(cfg.ignoreCommand, /decommissioned/i, 'Must state decommission rationale')
      assert.doesNotMatch(cfg.ignoreCommand, /exit 1/, 'Must never exit 1 (build trigger) for any project')
    }
  })

  test('autoJobCancelation is enabled across all vercel.json scopes', () => {
    assert.equal(rootVercelJson.github?.autoJobCancelation, true)
    assert.equal(appsVercelJson.github?.autoJobCancelation, true)
    assert.equal(webVercelJson.github?.autoJobCancelation, true)
  })

  test('no legacy or duplicate project ID is given build clearance', () => {
    const allProjectIds = [
      'prj_EvLi9wcPcy2p7op1ChdvI8kPksKV', // xpex-academy-ai
      'prj_EjFGUFVEUm6adcZhhjN4ujtIEj9y', // xpex-academy
      'prj_lusVrpATbArDHBafb4VQAvh14TyE', // xpex-academy-536s
      'prj_XCgo9X30sb5L4Pu2aEQBnQILXlix', // xpex-academy-3rb4
      'prj_llFFgrz69J0emeMgZhVeZdAMlz8Z', // xpex-academy-sfh6
    ]

    const allConfigs = [rootVercelJson, appsVercelJson, webVercelJson]
    for (const cfg of allConfigs) {
      for (const id of allProjectIds) {
        assert.doesNotMatch(cfg.ignoreCommand, new RegExp(id), `Project ${id} must not be allowlisted to build`)
      }
    }
  })

  test('canonical infrastructure documentation is present in repository', () => {
    const infraDocPath = path.join(repoRoot, 'docs/architecture/XPEX_CANONICAL_INFRASTRUCTURE_V1.md')
    const auditDocPath = path.join(repoRoot, 'docs/audits/XPEX_VERCEL_LEGACY_AUDIT_V1.md')

    assert.ok(fs.existsSync(infraDocPath), 'XPEX_CANONICAL_INFRASTRUCTURE_V1.md must exist')
    assert.ok(fs.existsSync(auditDocPath), 'XPEX_VERCEL_LEGACY_AUDIT_V1.md must exist')

    const infraContent = fs.readFileSync(infraDocPath, 'utf8')
    assert.match(infraContent, /GITHUB/)
    assert.match(infraContent, /FIREBASE/)
    assert.match(infraContent, /RAILWAY/)
    assert.match(infraContent, /VERCEL.*LEGACY/i)

    const auditContent = fs.readFileSync(auditDocPath, 'utf8')
    assert.match(auditContent, /xpex-academy-ai/)
    assert.match(auditContent, /LEGACY/)
    assert.match(auditContent, /DUPLICATE/)
  })
})
