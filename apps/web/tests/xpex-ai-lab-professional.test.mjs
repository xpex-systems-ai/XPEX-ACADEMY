import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const page = read('app/xpex/ai-lab/page.tsx')

describe('XPeX professional AI laboratory', () => {
  test('reuses LearnHouse authoritative domains instead of inventing a second LMS', () => {
    expect(page).toContain("getAuthorizedStudentLearning('/xpex/ai-lab')")
    expect(page).toContain('Course + Trail + TrailRun')
    expect(page).toContain('Boards + Library')
    expect(page).toContain('<Copilot orgslug={learning.organization.slug} />')
    expect(page).toContain(`/orgs/${'${learning.organization.slug}'}`)
  })

  test('derives laboratory indicators only from authorized learning data', () => {
    expect(page).toContain('learning.data.courses')
    expect(page).toContain('total_lessons')
    expect(page).toContain('completed_lessons')
    expect(page).toContain('progress_percent')
    expect(page).not.toContain('128')
    expect(page).not.toContain('142h')
    expect(page).not.toContain('1.250 XP')
  })

  test('keeps unsafe runtimes honest until isolation exists', () => {
    expect(page).toContain('Roadmap seguro')
    expect(page).toContain('Sem laboratório fictício.')
    expect(page).toContain('isolamento, persistência, autorização, quota e observabilidade reais')
  })
})
