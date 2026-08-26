import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const lab = fs.readFileSync(new URL('../app/xpex/ai-lab/page.tsx', import.meta.url), 'utf8')
const projects = fs.readFileSync(new URL('../app/xpex/ai-lab/projects/page.tsx', import.meta.url), 'utf8')

test('AI lab exposes the real project workspace', () => {
  assert.match(lab, /\/xpex\/ai-lab\/projects/)
  assert.match(lab, /Projetos GX/)
  assert.match(lab, /Boards \+ Library/)
})

test('LAB-002 preserves LearnHouse-native project boundaries', () => {
  assert.match(projects, /getAuthorizedStudentLearning\('\/xpex\/ai-lab\/projects'\)/)
  assert.match(projects, /\/orgs\/\$\{learning\.organization\.slug\}/)
  assert.match(projects, /Abrir Boards/)
  assert.match(projects, /Abrir Library/)
  assert.match(projects, /Sem bypass de ACL/)
  assert.match(projects, /Execução isolada de código, modelos e datasets privados continua fora deste bloco/)
})

test('project templates require evidence instead of fake completion', () => {
  assert.match(projects, /Engenharia de Prompts — Assistente especialista/)
  assert.match(projects, /RAG — Base de conhecimento confiável/)
  assert.match(projects, /Automação com IA — Fluxo orientado a tarefa/)
  assert.match(projects, /Projeto final — Solução de IA demonstrável/)
  assert.match(projects, /não inventa conclusão de projeto/)
  assert.match(projects, /Prompt de mentoria GX/)
})
