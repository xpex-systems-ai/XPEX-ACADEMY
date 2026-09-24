import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const root = process.cwd()
const page = fs.readFileSync(path.join(root, 'app/xpex/gxeon/page.tsx'), 'utf8')
const commandCenter = fs.readFileSync(path.join(root, 'components/Xpex/Gxeon/GxeonCommandCenter.tsx'), 'utf8')
const hero = fs.readFileSync(path.join(root, 'components/Xpex/Gxeon/GxeonHero.tsx'), 'utf8')
const sidebar = fs.readFileSync(path.join(root, 'components/Xpex/Gxeon/GxeonConversationSidebar.tsx'), 'utf8')
const chatShell = fs.readFileSync(path.join(root, 'components/Xpex/Gxeon/GxeonChatShell.tsx'), 'utf8')
const metrics = fs.readFileSync(path.join(root, 'components/Xpex/Gxeon/GxeonMetricsRow.tsx'), 'utf8')
const resources = fs.readFileSync(path.join(root, 'components/Xpex/Gxeon/GxeonResourceGrid.tsx'), 'utf8')
const shell = fs.readFileSync(path.join(root, 'components/Xpex/XpexAuthenticatedShell.tsx'), 'utf8')
const aiClient = fs.readFileSync(path.join(root, 'services/ai/ai.ts'), 'utf8')

test('GXEON Command Center route binds to authorized student learning without bypass', () => {
  assert.match(page, /getAuthorizedStudentLearning\('\/xpex\/gxeon'\)/)
  assert.match(page, /XpexAuthenticatedShell/)
  assert.match(page, /role="aluno"/)
  assert.match(page, /<GxeonCommandCenter/)
})

test('XPeX Authenticated Shell includes canonical GXEON Copilot route', () => {
  assert.match(shell, /href:\s*'\/xpex\/gxeon'/)
  assert.match(shell, /label:\s*'GXEON Copilot'/)
  assert.match(shell, /icon:\s*BrainCircuit/)
})

test('GXEON Hero reproduces the visual centerpiece and orbital badges from official reference', () => {
  assert.match(hero, /XPeX ACADEMY/i)
  assert.match(hero, /GXEON/)
  assert.match(hero, /CONHECIMENTO EM AÇÃO/i)
  assert.match(hero, /PROJETOS REAIS/i)
  assert.match(hero, /APRENDIZADO PERSONALIZADO/i)
  assert.match(hero, /IA COM PROPÓSITO/i)
  assert.match(hero, /gxeon-center-x/)
})

test('GXEON Chat Shell enforces safe provider contract and prevents hardcoded Gemini badge', () => {
  // Safe badge must default to GXEON AI unless explicitly confirmed by safe provider capability
  assert.match(chatShell, /'GXEON AI'/)
  assert.match(chatShell, /gatewayHealth\?\.provider\?\.toLowerCase\(\) === 'google'/)
  assert.match(chatShell, /'Gemini'/)
  // Must reuse real Copilot streaming & RAG methods
  assert.match(commandCenter, /fetchRAGChatSessions/)
  assert.match(commandCenter, /startRAGChatStream/)
  assert.match(commandCenter, /sendRAGChatStream/)
  assert.match(commandCenter, /fetchAIGatewayHealth/)
})

test('AI Gateway client calls safe health endpoint without secret exposure', () => {
  assert.match(aiClient, /fetchAIGatewayHealth/)
  assert.match(aiClient, /xpex\/ai-gateway\/health/)
  assert.doesNotMatch(aiClient, /GEMINI_API_KEY/)
  assert.doesNotMatch(aiClient, /AI_GATEWAY_SECRET/)
})

test('GXEON Metrics row derives values exclusively from real courses data without fake counters', () => {
  assert.match(page, /courses\.length/)
  assert.match(page, /totalLessons/)
  assert.match(commandCenter, /enrolledCoursesCount/)
  assert.match(metrics, /enrolledCoursesCount/)
  assert.match(metrics, /availableLessonsCount/)
  assert.match(metrics, /overallProgress/)
  // Forbid fake/invented numbers
  for (const fakeNumber of ['128 experimentos', '142h', '1.250 XP', '18.6K']) {
    assert.doesNotMatch(metrics, new RegExp(fakeNumber))
  }
})

test('GXEON Resource Grid exposes official navigation tiles', () => {
  assert.match(resources, /Explore com o GXEON/)
  assert.match(resources, /Prompt Engineering/)
  assert.match(resources, /RAG e conhecimento privado/)
  assert.match(resources, /Workspace de Projetos GX/)
  assert.match(resources, /Boards/)
  assert.match(resources, /Library/)
  assert.match(resources, /Trilhas profissionais/)
  assert.match(resources, /Comunidade/)
})

test('GXEON Conversation Sidebar provides session switching and new session creation', () => {
  assert.match(sidebar, /Nova conversa/)
  assert.match(sidebar, /onSelectSession/)
  assert.match(sidebar, /onNewChat/)
})
