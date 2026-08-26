import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const page = read('app/xpex/trails/page.tsx')
const providers = read('lib/xpex/external-learning-providers.ts')

describe('XPeX federated trails catalog', () => {
  test('exposes verified official learning destinations', () => {
    for (const provider of [
      'OpenAI Academy',
      'Microsoft Learn',
      'AWS Skill Builder',
      'Grow with Google',
      'GitHub Learn',
      'Vercel Academy',
      'Notion Academy',
      'Canva Design School',
    ]) expect(providers).toContain(provider)

    for (const origin of [
      'https://academy.openai.com/',
      'https://learn.microsoft.com/',
      'https://aws.amazon.com/',
      'https://grow.google/',
      'https://skills.github.com/',
      'https://vercel.com/academy',
      'https://www.notion.com/',
      'https://www.canva.com/',
    ]) expect(providers).toContain(origin)
  })

  test('keeps external learning honest and separate from XPeX progress', () => {
    expect(page).toContain('Modo Trilha Real')
    expect(page).toContain('não marca conclusão sem integração oficial de progresso')
    expect(page).toContain('integração autenticada de provedor')
    expect(page).toContain('target="_blank"')
    expect(page).toContain('rel="noopener noreferrer"')
  })

  test('keeps real XPeX progress bound to authorized learning data', () => {
    expect(page).toContain("getAuthorizedStudentLearning('/xpex/trails')")
    expect(page).toContain('learning.data.courses')
    expect(page).toContain('completed_lessons')
    expect(page).toContain('total_lessons')
    expect(page).not.toContain('18.6K')
    expect(page).not.toContain('5.342')
    expect(page).not.toContain('1.254h')
  })
})
