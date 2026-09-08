import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import {
  concealCachedQuizAnswers,
  getAssessmentProgress,
  getAttemptNumber,
} from '../lib/assignments/assessment-flow.ts'

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

  test('mounts the native persisted assignment flow with server result actions', () => {
    const player = read('app/xpex/courses/[courseId]/learn/[activityId]/Player.tsx')
    const assessment = read('app/xpex/courses/[courseId]/learn/[activityId]/XpexAssignment.tsx')
    const studentActivity = read('components/Objects/Activities/Assignment/AssignmentStudentActivity.tsx')
    const shortAnswer = read('app/orgs/[orgslug]/dash/assignments/[assignmentuuid]/_components/TaskEditor/Subs/TaskTypes/TaskShortAnswerObject.tsx')
    const numberAnswer = read('app/orgs/[orgslug]/dash/assignments/[assignmentuuid]/_components/TaskEditor/Subs/TaskTypes/TaskNumberAnswerObject.tsx')
    const legacyActivity = read('app/orgs/[orgslug]/(withmenu)/course/[courseuuid]/activity/[activityid]/activity.tsx')
    const activities = read('app/xpex/activities/page.tsx')
    expect(player).toContain("activity.activity_type === 'TYPE_ASSIGNMENT'")
    expect(player).toContain('orgUuid={orgUuid}')
    expect(assessment).toContain('submitAssignmentForGrading')
    expect(assessment).toContain('getFinalGrade')
    expect(assessment).toContain('retryAssignmentSubmission')
    expect(assessment).toContain('queryKeys.assignments.tasks')
    expect(assessment).toContain('attemptNumber')
    expect(assessment).toContain('Aguardando correção')
    expect(assessment).toContain("result.passed ? 'Aprovado' : 'Reprovado'")
    expect(studentActivity).not.toContain('useCourse()')
    expect(shortAnswer).toContain('queryKeys.assignments.taskSubmission')
    expect(numberAnswer).toContain('queryKeys.assignments.taskSubmission')
    expect(legacyActivity).toContain('AssignmentStudentAttempt')
    expect(legacyActivity).toContain('concealCachedQuizAnswers')
    expect(legacyActivity).toContain('queryKeys.assignments.tasks')
    expect(activities).toContain('<h2>Avaliações</h2>')
  })

  test('requires every native task while validating every quiz question', () => {
    const tasks = [
      {
        assignment_task_uuid: 'quiz-1',
        assignment_type: 'QUIZ',
        contents: {
          questions: [
            { questionUUID: 'q1', options: [{ optionUUID: 'a' }] },
            { questionUUID: 'q2', options: [{ optionUUID: 'b' }] },
          ],
        },
      },
      { assignment_task_uuid: 'short-1', assignment_type: 'SHORT_ANSWER' },
    ]
    const partial = getAssessmentProgress(tasks, {
      'quiz-1': {
        task_submission: {
          submissions: [{ questionUUID: 'q1', optionUUID: 'a', answer: true }],
        },
      },
      'short-1': { task_submission: { submissions: [] } },
    })
    expect(partial.ready).toBe(false)
    expect(partial.completedTasks).toBe(1)
    expect(partial.answeredQuizQuestions).toBe(1)

    const complete = getAssessmentProgress(tasks, {
      'quiz-1': {
        task_submission: {
          submissions: [
            { questionUUID: 'q1', optionUUID: 'a', answer: true },
            { questionUUID: 'q2', optionUUID: 'b', answer: true },
          ],
        },
      },
      'short-1': { task_submission: { submissions: [] } },
    })
    expect(complete.ready).toBe(true)
    expect(complete.completedTasks).toBe(2)
  })

  test('conceals cached quiz keys without mutating the graded response', () => {
    const tasks = [{
      assignment_task_uuid: 'quiz-1',
      assignment_type: 'QUIZ',
      contents: {
        questions: [{
          questionUUID: 'q1',
          options: [{ optionUUID: 'a', assigned_right_answer: true }],
        }],
      },
    }]
    const concealed = concealCachedQuizAnswers(tasks)
    expect('assigned_right_answer' in concealed[0].contents.questions[0].options[0]).toBe(false)
    expect(tasks[0].contents.questions[0].options[0].assigned_right_answer).toBe(true)
    expect(getAttemptNumber([{ attempt_number: 3 }])).toBe(3)
    expect(getAttemptNumber([])).toBe(1)
  })

  test('loads protected content only through the canonical activity read', () => {
    const page = read('app/xpex/courses/[courseId]/learn/[activityId]/page.tsx')
    expect(page).toContain('getActivityWithAuthHeader')
    expect(page).toContain('activity.is_locked === true')
    expect(page).toContain('details: null, extra_metadata: null')
  })
})
