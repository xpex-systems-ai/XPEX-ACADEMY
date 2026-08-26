import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'

const root = process.cwd()
const player = fs.readFileSync(path.join(root, 'app/xpex/courses/[courseId]/learn/[activityId]/Player.tsx'), 'utf8')
const video = fs.readFileSync(path.join(root, 'components/Objects/Activities/Video/Video.tsx'), 'utf8')
const guide = fs.readFileSync(path.join(root, 'components/Xpex/GXModuleGuide.tsx'), 'utf8')
const guideData = fs.readFileSync(path.join(root, 'lib/xpex/module-guides.ts'), 'utf8')

test('TYPE_VIDEO continues to use the native LearnHouse video renderer', () => {
  assert.match(player, /activity\.activity_type === 'TYPE_VIDEO'/)
  assert.match(player, /<VideoActivity/)
  assert.match(video, /SUBTYPE_VIDEO_HOSTED/)
  assert.match(video, /SUBTYPE_VIDEO_YOUTUBE/)
  assert.match(video, /<LearnHousePlayer/)
  assert.match(video, /<YouTube/)
})

test('missing video media is explicit instead of rendering a blank stage', () => {
  assert.match(video, /Player de vídeo pronto/)
  assert.match(video, /arquivo de mídia publicado/)
  assert.match(video, /link ainda não foi configurado/)
  assert.match(video, /Nenhum vídeo fictício é exibido/)
})

test('all official modules have an explanatory GX guide', () => {
  for (let module = 1; module <= 11; module += 1) {
    assert.match(guideData, new RegExp(`module: ${module},`))
  }
  assert.match(player, /getXpexModuleGuide/)
  assert.match(player, /<GXModuleGuide/)
  assert.match(guide, /Ouvir explicação GX/)
  assert.match(guide, /speechSynthesis/)
  assert.match(guide, /não é apresentada como um vídeo gravado/)
})

test('player keeps progression and native non-video renderers', () => {
  for (const renderer of ['DocumentPdfActivity', 'MarkdownActivity', 'EmbedActivity', 'ResourceActivity', 'DynamicCanva']) {
    assert.match(player, new RegExp(renderer))
  }
  assert.match(player, /Marcar como concluída/)
  assert.match(player, /← Anterior/)
  assert.match(player, /Próxima →/)
})

test('course player does not hardcode fake video providers or media URLs', () => {
  assert.doesNotMatch(video, /youtube\.com\/watch\?v=[A-Za-z0-9_-]+/)
  assert.doesNotMatch(video, /youtu\.be\/[A-Za-z0-9_-]+/)
  assert.doesNotMatch(video, /\.mp4['"]/)
})
