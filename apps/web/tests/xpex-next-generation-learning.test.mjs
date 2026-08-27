import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { resolveCompletionNavigation } from '../app/xpex/courses/[courseId]/learn/[activityId]/navigation.ts'

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
    expect(player).toContain('progressPercent ?? 0')
    expect(player).toContain('<progress')
    expect(player).toContain('aria-labelledby="lesson-title"')
    expect(player).toContain('router.refresh()')
    expect(player).toContain('result.nextHref')
    expect(player).toContain('role="alert"')
  })

  test('persists completion before refreshing the official dashboard state', () => {
    const actions = read('app/xpex/courses/[courseId]/learn/[activityId]/actions.ts')
    expect(actions).toContain('await markActivityAsComplete')
    expect(actions).toContain('item.complete')
    expect(actions).toContain('persistedCourse.target_href')
    expect(actions).toContain('revalidatePath')
    expect(actions).toContain('nextHref')
  })

  test('uses sequential navigation only before completion has resolved', () => {
    const lessonTwo = '/xpex/courses/ai/learn/lesson-2'
    expect(resolveCompletionNavigation(lessonTwo, undefined)).toBe(lessonTwo)
    expect(resolveCompletionNavigation(null, undefined)).toBeNull()
  })

  test('honors an authoritative target for normal and out-of-order completion', () => {
    const lessonTwo = '/xpex/courses/ai/learn/lesson-2'
    const sequentialLessonSix = '/xpex/courses/ai/learn/lesson-6'
    const authoritativeLessonThree = '/xpex/courses/ai/learn/lesson-3'
    expect(resolveCompletionNavigation(lessonTwo, lessonTwo)).toBe(lessonTwo)
    expect(resolveCompletionNavigation(sequentialLessonSix, authoritativeLessonThree)).toBe(authoritativeLessonThree)
  })

  test('honors an authoritative target when the rendered activity has no sequential next', () => {
    const earlierPendingLesson = '/xpex/courses/ai/learn/lesson-3'
    expect(resolveCompletionNavigation(null, earlierPendingLesson)).toBe(earlierPendingLesson)
  })

  test('never falls back to a stale sequential next after backend-confirmed completion', () => {
    const staleSequentialNext = '/xpex/courses/ai/learn/lesson-6'
    expect(resolveCompletionNavigation(staleSequentialNext, null)).toBeNull()
  })
})
