import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'

const root = process.cwd()
const labPath = path.join(root, 'app/xpex/ai-lab/page.tsx')
const projectsPath = path.join(root, 'app/xpex/ai-lab/projects/page.tsx')

const lab = fs.readFileSync(labPath, 'utf8')
const projects = fs.readFileSync(projectsPath, 'utf8')

test('AI Lab keeps LearnHouse as the source-of-truth foundation', () => {
  assert.match(lab, /getAuthorizedStudentLearning/)
  assert.match(lab, /Course \+ Trail \+ TrailRun/)
  assert.match(lab, /Boards \+ Library/)
  assert.match(lab, /Copilot\/RAG/)
})

test('AI Lab exposes the real project workspace and honest execution boundary', () => {
  assert.match(lab, /\/xpex\/ai-lab\/projects/)
  assert.match(projects, /Sem bypass de ACL/)
  assert.match(projects, /Execução isolada de código, modelos e datasets privados continua fora/)
})

test('AI Lab does not fabricate Netflix-like engagement metrics', () => {
  for (const forbidden of ['18.6K', '1.254h', '5.342', '128 experimentos', '24 laboratórios']) {
    assert.doesNotMatch(lab, new RegExp(forbidden.replace('.', '\\.')))
  }
})
