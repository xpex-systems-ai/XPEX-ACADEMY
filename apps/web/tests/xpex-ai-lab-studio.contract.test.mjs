import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'

const root = process.cwd()
const lab = fs.readFileSync(path.join(root, 'app/xpex/ai-lab/page.tsx'), 'utf8')
const projects = fs.readFileSync(path.join(root, 'app/xpex/ai-lab/projects/page.tsx'), 'utf8')

test('AI Lab Studio keeps LearnHouse as the source-of-truth foundation', () => {
  assert.match(lab, /getAuthorizedStudentLearning/)
  assert.match(lab, /Course \+ Trail \+ TrailRun/)
  assert.match(lab, /Boards \+ Library/)
  assert.match(lab, /Copilot\/RAG/)
})

test('AI Lab Studio exposes real continuation, projects and GX entry points', () => {
  assert.match(lab, /continue_learning/)
  assert.match(lab, /\/xpex\/ai-lab\/projects/)
  assert.match(lab, /gx-copilot/)
  assert.match(projects, /Sem bypass de ACL/)
})

test('AI Lab Studio preserves honest execution boundaries and avoids fake engagement metrics', () => {
  assert.match(lab, /Sem laboratório fictício/)
  assert.match(lab, /isolamento, persistência, autorização, quota e observabilidade reais/)
  for (const forbidden of ['18.6K', '1.254h', '5.342', '128 experimentos', '24 laboratórios']) {
    assert.doesNotMatch(lab, new RegExp(forbidden.replace('.', '\\.')))
  }
})
