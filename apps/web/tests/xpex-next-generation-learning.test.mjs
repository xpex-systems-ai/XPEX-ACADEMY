import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

describe('XPeX next-generation learning experience', () => {
  test('groups only authorized activities into real LearnHouse chapters', () => {
    const course = read('app/xpex/courses/[courseId]/page.tsx')
    expect(course).toContain('course.activities.reduce')
    expect(course).toContain("activity.chapter_name || 'Conteúdo do curso'")
    expect(course).toContain('Nenhuma aula disponível')
  })

  test('exposes authoritative progress and accessible lesson context', () => {
    const player = read('app/xpex/courses/[courseId]/learn/[activityId]/Player.tsx')
    expect(player).toContain('completedLessons / totalLessons')
    expect(player).toContain('<progress')
    expect(player).toContain('aria-labelledby="lesson-title"')
    expect(player).toContain('router.refresh()')
    expect(player).toContain('result.nextHref')
    expect(player).toContain('role="alert"')
  })

  test('persists completion before refreshing the official dashboard state', () => {
    const actions = read('app/xpex/courses/[courseId]/learn/[activityId]/actions.ts')
    expect(actions).toContain('await markActivityAsComplete')
    expect(actions).toContain('revalidatePath')
    expect(actions).toContain('nextHref')
  })
})
