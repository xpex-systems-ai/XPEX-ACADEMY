import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

describe('native XpeX student learning', () => {
  test('ships all native routes and functional student navigation', () => {
    for (const route of ['app/xpex/courses/page.tsx', 'app/xpex/courses/[courseId]/page.tsx', 'app/xpex/courses/[courseId]/learn/page.tsx', 'app/xpex/courses/[courseId]/learn/[activityId]/page.tsx', 'app/xpex/activities/page.tsx']) expect(read(route).length).toBeGreaterThan(100)
    const navigation = read('components/Xpex/xpex-navigation.ts')
    expect(navigation).toContain("href: '/xpex/courses'")
    expect(navigation).toContain("href: '/xpex/activities'")
  })

  test('authorizes course and activity IDs against the server dashboard', () => {
    expect(read('lib/xpex/student.ts')).toContain("resolveXpexOrganization(session.roles, 'aluno')")
    expect(read('app/xpex/courses/[courseId]/learn/[activityId]/actions.ts')).toContain('course?.activities.find')
  })

  test('reuses canonical video and Trail completion implementations', () => {
    expect(read('app/xpex/courses/[courseId]/learn/[activityId]/Player.tsx')).toContain("Objects/Activities/Video/Video")
    expect(read('app/xpex/courses/[courseId]/learn/[activityId]/actions.ts')).toContain('markActivityAsComplete')
  })

  test('keeps catalogs metadata-only and blocks generic assignment completion', () => {
    const dashboard = read('../api/src/services/xpex/dashboard.py')
    expect(dashboard).not.toContain('Activity.content,')
    expect(dashboard).not.toContain('Activity.details,')
    const action = read('app/xpex/courses/[courseId]/learn/[activityId]/actions.ts')
    expect(action).toContain("activity.activity_type === 'TYPE_ASSIGNMENT'")
    expect(read('app/xpex/courses/[courseId]/learn/[activityId]/Player.tsx')).toContain('canComplete &&')
  })

  test('loads protected content only through the canonical activity read', () => {
    const page = read('app/xpex/courses/[courseId]/learn/[activityId]/page.tsx')
    expect(page).toContain('getActivityWithAuthHeader')
    expect(page).toContain('activity.is_locked === true')
    expect(page).toContain('details: null, extra_metadata: null')
  })
})
