import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'

const root = process.cwd()
const coursePage = fs.readFileSync(path.join(root, 'app/xpex/courses/[courseId]/page.tsx'), 'utf8')
const player = fs.readFileSync(path.join(root, 'app/xpex/courses/[courseId]/learn/[activityId]/Player.tsx'), 'utf8')

test('course experience stays backed by authorized LearnHouse learner data', () => {
  assert.match(coursePage, /getAuthorizedStudentLearning/)
  assert.match(coursePage, /Progresso real/)
  assert.match(coursePage, /Fonte de verdade/)
  assert.match(coursePage, /infraestrutura LearnHouse autorizada/)
})

test('course continuation never relabels a fully completed course as continue-learning', () => {
  assert.match(coursePage, /const nextIncomplete = course\.activities\.find\(activity => !activity\.complete\)/)
  assert.match(coursePage, /Revisar curso/)
  assert.doesNotMatch(coursePage, /find\(activity => !activity\.complete\) \?\? course\.activities\[0\]/)
})

test('native player preserves supported LearnHouse renderers and progress semantics', () => {
  for (const renderer of ['VideoActivity', 'PDFActivity', 'MarkdownActivity', 'EmbedActivity', 'ResourceActivity', 'DynamicCanva']) {
    assert.match(player, new RegExp(renderer))
  }
  assert.match(player, /completeXpexActivity/)
  assert.match(player, /Progresso salvo/)
  assert.match(player, /TYPE_ASSIGNMENT/)
  assert.match(player, /Nenhuma conclusão será registrada aqui/)
})

test('course experience does not introduce fabricated engagement or compute metrics', () => {
  for (const forbidden of ['XP', 'horas assistidas', 'custo de GPU', 'tokens consumidos', 'experimentos executados']) {
    assert.doesNotMatch(coursePage, new RegExp(forbidden, 'i'))
    assert.doesNotMatch(player, new RegExp(forbidden, 'i'))
  }
})
