type AssignmentTask = {
  assignment_task_uuid?: string
  assignment_type?: string
  contents?: {
    questions?: Array<{
      questionUUID?: string
      options?: Array<{ optionUUID?: string } & Record<string, unknown>>
    } & Record<string, unknown>>
  } & Record<string, unknown>
} & Record<string, unknown>

type TaskSubmission = {
  task_submission?: {
    submissions?: Array<{
      questionUUID?: string
      optionUUID?: string
      answer?: unknown
    }>
  }
}

type TaskSubmissionMap = Record<string, TaskSubmission | null> | null | undefined
type QuizQuestion = NonNullable<
  NonNullable<AssignmentTask['contents']>['questions']
>[number]
type QuizAnswers = NonNullable<
  NonNullable<TaskSubmission['task_submission']>['submissions']
>

export type AssessmentProgress = {
  answeredQuizQuestions: number
  completedTasks: number
  quizOnly: boolean
  ready: boolean
  totalQuizQuestions: number
  totalTasks: number
}

function quizQuestionHasSelection(
  question: QuizQuestion,
  answers: QuizAnswers,
) {
  if (!question?.questionUUID) return false
  const optionUUIDs = new Set(
    (question.options || []).map(option => option?.optionUUID).filter(Boolean),
  )
  return answers.some(
    answer =>
      answer?.answer === true &&
      answer.questionUUID === question.questionUUID &&
      !!answer.optionUUID &&
      optionUUIDs.has(answer.optionUUID),
  )
}

export function getAssessmentProgress(
  tasks: AssignmentTask[] | null | undefined,
  submissions: TaskSubmissionMap,
): AssessmentProgress {
  const assignmentTasks = Array.isArray(tasks) ? tasks : []
  let answeredQuizQuestions = 0
  let completedTasks = 0
  let totalQuizQuestions = 0

  for (const task of assignmentTasks) {
    const taskUuid = task?.assignment_task_uuid || ''
    const submission = taskUuid ? submissions?.[taskUuid] : null

    if (task?.assignment_type !== 'QUIZ') {
      if (submission) completedTasks += 1
      continue
    }

    const questions = Array.isArray(task.contents?.questions)
      ? task.contents.questions
      : []
    const answers = Array.isArray(submission?.task_submission?.submissions)
      ? submission.task_submission.submissions
      : []
    const selectedQuestions = questions.filter(question =>
      quizQuestionHasSelection(question, answers),
    ).length

    answeredQuizQuestions += selectedQuestions
    totalQuizQuestions += questions.length
    if (questions.length > 0 && selectedQuestions === questions.length) {
      completedTasks += 1
    }
  }

  return {
    answeredQuizQuestions,
    completedTasks,
    quizOnly:
      assignmentTasks.length > 0 &&
      assignmentTasks.every(task => task?.assignment_type === 'QUIZ'),
    ready:
      assignmentTasks.length > 0 && completedTasks === assignmentTasks.length,
    totalQuizQuestions,
    totalTasks: assignmentTasks.length,
  }
}

export function concealCachedQuizAnswers(tasks: unknown): unknown {
  if (!Array.isArray(tasks)) return tasks

  return tasks.map(task => {
    if (!task || typeof task !== 'object') return task
    const assignmentTask = task as AssignmentTask
    if (assignmentTask.assignment_type !== 'QUIZ') return task

    const contents = assignmentTask.contents || {}
    const questions = Array.isArray(contents.questions) ? contents.questions : []
    return {
      ...assignmentTask,
      contents: {
        ...contents,
        questions: questions.map(question => ({
          ...question,
          options: (question.options || []).map(option => {
            if (!option || typeof option !== 'object') return option
            return Object.fromEntries(
              Object.entries(option).filter(
                ([key]) => key !== 'assigned_right_answer',
              ),
            )
          }),
        })),
      },
    }
  })
}

export function getAttemptNumber(submission: unknown): number {
  if (!Array.isArray(submission)) return 1
  const value = Number(submission[0]?.attempt_number || 1)
  return Number.isFinite(value) && value > 0 ? value : 1
}
