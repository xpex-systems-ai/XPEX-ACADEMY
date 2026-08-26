import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const page = read('app/xpex/courses/page.tsx')

describe('XPeX authorized course vitrine', () => {
  test('uses the established server-authoritative learning query', () => {
    expect(page).toContain("getAuthorizedStudentLearning('/xpex/courses')")
    expect(page).toContain('learning.data')
    expect(page).not.toContain('fetch(')
  })

  test('renders cards only from authorized courses without enrollment mutations', () => {
    expect(page).toContain('remainingCourses.map')
    expect(page).toContain('courses.filter')
    expect(page).not.toMatch(/enroll|matricular/i)
  })

  test('has honest empty, progress, completion and continue-learning states', () => {
    expect(page).toContain('Nenhum curso disponível agora')
    expect(page).toContain('continue_learning')
    expect(page).toContain('Curso concluído')
    expect(page).toContain('Em andamento')
  })

  test('links the authorized course to the existing native course route', () => {
    expect(page).toContain('/xpex/courses/${course.course_id.replace')
  })
})
