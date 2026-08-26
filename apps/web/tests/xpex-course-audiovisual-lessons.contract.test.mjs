import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'

const root = process.cwd()
const player = fs.readFileSync(path.join(root, 'app/xpex/courses/[courseId]/learn/[activityId]/Player.tsx'), 'utf8')
const motion = fs.readFileSync(path.join(root, 'components/Xpex/GXMotionLesson.tsx'), 'utf8')

test('every recognized official module receives the audiovisual motion lesson', () => {
  assert.match(player, /getXpexModuleGuide/)
  assert.match(player, /<GXMotionLesson guide=\{guide\}/)
})

test('motion lesson provides playback, narration, scenes, captions and speed controls', () => {
  assert.match(motion, /speechSynthesis/)
  assert.match(motion, /pt-BR/)
  assert.match(motion, /Assistir aula/)
  assert.match(motion, /Cena \{sceneIndex \+ 1\}/)
  assert.match(motion, /Velocidade/)
  assert.match(motion, /Audiovisual interativa/)
})

test('motion lesson is honest about generated browser audiovisual format', () => {
  assert.match(motion, /Formato audiovisual gerado e narrado no navegador/)
  assert.match(motion, /Não é apresentado como vídeo gravado por uma pessoa ou avatar/)
})

test('native LearnHouse activity player remains first-class', () => {
  assert.match(player, /<ActivityRenderer activity=\{activity\}/)
  assert.match(player, /TYPE_VIDEO/)
  assert.match(player, /VideoActivity/)
  assert.match(player, /MarkdownActivity/)
})
