import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dir, '..')
const read = (path) => readFileSync(resolve(root, path), 'utf8')

describe('XPeX student authentication routing', () => {
  test('the whole XPeX route segment renders from the live request session', () => {
    const layout = read('app/xpex/layout.tsx')

    expect(layout).toContain("export const dynamic = 'force-dynamic'")
    expect(layout).toContain('export const revalidate = 0')
  })

  test('authenticated learners leave the generic hub for the student catalog', () => {
    const home = read('app/home/page.tsx')

    expect(home).toContain("export const dynamic = 'force-dynamic'")
    expect(home).toContain('export const revalidate = 0')
    expect(home).toContain("if (access.includes('aluno'))")
    expect(home).toContain("redirect('/xpex/courses')")
  })

  test('polo and teacher sessions are not redirected into the student experience', () => {
    const home = read('app/home/page.tsx')

    expect(home).toContain("if (access.includes('polo') || access.includes('professora'))")
    expect(home).toContain("redirect('/xpex/polo')")
  })

  test('student authorization still remains server-enforced', () => {
    const student = read('lib/xpex/student.ts')

    expect(student).toContain("resolveXpexOrganization(session.roles, 'aluno')")
    expect(student).toContain("resolveXpexAccess(session.roles, organization.slug).includes('aluno')")
  })
})
