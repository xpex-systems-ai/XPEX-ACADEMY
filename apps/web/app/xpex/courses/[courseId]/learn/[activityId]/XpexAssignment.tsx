'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/keys'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { OrgContext } from '@components/Contexts/OrgContext'
import { AssignmentProvider, useAssignments } from '@components/Contexts/Assignments/AssignmentContext'
import AssignmentSubmissionProvider, {
  useAssignmentSubmission,
  useAssignmentTaskSubmissions,
} from '@components/Contexts/Assignments/AssignmentSubmissionContext'
import { AssignmentsTaskProvider } from '@components/Contexts/Assignments/AssignmentsTaskContext'
import AssignmentStudentActivity from '@components/Objects/Activities/Assignment/AssignmentStudentActivity'
import {
  getAssignmentFromActivityUUID,
  getFinalGrade,
  retryAssignmentSubmission,
  submitAssignmentForGrading,
} from '@services/courses/assignments'
import {
  concealCachedQuizAnswers,
  getAssessmentProgress,
  getAttemptNumber,
} from '@/lib/assignments/assessment-flow'

function AssessmentActions({ assignmentUuid, courseUuid }: { assignmentUuid: string; courseUuid: string }) {
  const session = useLHSession() as any
  const submission = useAssignmentSubmission() as any
  const taskSubmissions = useAssignmentTaskSubmissions()
  const assignment = useAssignments() as any
  const queryClient = useQueryClient()
  const [result, setResult] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultRequest, setResultRequest] = useState(0)
  const status = Array.isArray(submission) ? submission[0]?.submission_status : null
  const graded = status === 'GRADED'
  const awaitingReview = status === 'SUBMITTED' || status === 'LATE'
  const progress = getAssessmentProgress(
    assignment?.assignment_tasks,
    taskSubmissions,
  )
  const assignmentObject = assignment?.assignment_object
  const currentAttempt = getAttemptNumber(submission)
  const maxAttempts = Number(assignmentObject?.max_retries || 0)
  const canRetry =
    !!assignmentObject?.allow_retries &&
    (maxAttempts === 0 || currentAttempt < maxAttempts)
  const userId = session?.data?.user?.id
  const accessToken = session?.data?.tokens?.access_token
  const progressText = progress.quizOnly
    ? `${progress.answeredQuizQuestions} de ${progress.totalQuizQuestions} questões respondidas`
    : `${progress.completedTasks} de ${progress.totalTasks} tarefas salvas`

  const refresh = async (concealAnswers = false) => {
    const tasksKey = queryKeys.assignments.tasks(assignmentUuid)
    if (concealAnswers) {
      queryClient.setQueryData(tasksKey, concealCachedQuizAnswers)
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments.submission(assignmentUuid) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments.taskSubmission(assignmentUuid) }),
      queryClient.invalidateQueries({ queryKey: tasksKey }),
    ])
  }

  useEffect(() => {
    if (!graded || !userId || !accessToken) return
    let active = true
    setError(null)
    getFinalGrade(userId, assignmentUuid, accessToken)
      .then(response => {
        if (!active) return
        if (response.success) setResult(response.data)
        else setError('Não foi possível carregar o resultado.')
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar o resultado.')
      })
    return () => {
      active = false
    }
  }, [accessToken, assignmentUuid, graded, resultRequest, userId])

  const submit = async () => {
    if (!progress.ready || busy || !accessToken || !window.confirm('Enviar respostas para correção final?')) return
    setBusy(true)
    setError(null)
    try {
      const response = await submitAssignmentForGrading(assignmentUuid, accessToken)
      if (!response.success) {
        setError(response.data?.detail || 'Não foi possível enviar a avaliação.')
        return
      }
      await refresh()
    } catch {
      setError('Não foi possível enviar a avaliação.')
    } finally {
      setBusy(false)
    }
  }

  const retry = async () => {
    if (!canRetry || busy || !accessToken) return
    setBusy(true)
    setError(null)
    try {
      const response = await retryAssignmentSubmission(assignmentUuid, accessToken)
      if (response.success) {
        await refresh(true)
        setResult(null)
      } else {
        setError(response.data?.detail || 'Não foi possível iniciar outra tentativa.')
      }
    } catch {
      setError('Não foi possível iniciar outra tentativa.')
    } finally {
      setBusy(false)
    }
  }

  if (graded && !result) return <section className="xpex-card" aria-live="polite"><p className="xpex-label">Resultado persistido</p>{error ? <><p role="alert">{error}</p><button type="button" onClick={() => setResultRequest(value => value + 1)}>Tentar carregar novamente</button></> : <p>Carregando resultado…</p>}</section>
  if (graded && result) return <section className="xpex-card" aria-live="polite"><p className="xpex-label">Resultado persistido</p><h2>{result.passed ? 'Aprovado' : 'Reprovado'}</h2><p><strong>{result.percentage_display}</strong> · mínimo {result.passing_threshold}%</p>{result.tasks?.map((task: any) => <p key={task.assignment_task_uuid}>{task.description}: {task.percentage_display} — {task.feedback}</p>)}{error ? <p role="alert">{error}</p> : null}<div className="flex gap-3">{canRetry ? <button type="button" disabled={busy} onClick={retry}>{busy ? 'Preparando…' : 'Tentar novamente'}</button> : null}<Link href={`/xpex/courses/${courseUuid.replace('course_', '')}`}>Voltar ao curso</Link></div></section>
  if (awaitingReview) return <section className="xpex-card" aria-live="polite"><p className="xpex-label">Avaliação enviada</p><h2>Aguardando correção</h2><p>Suas respostas estão salvas. O resultado aparecerá aqui depois da avaliação.</p><Link href={`/xpex/courses/${courseUuid.replace('course_', '')}`}>Voltar ao curso</Link></section>
  return <section className="xpex-card"><p>{progressText}</p><button type="button" disabled={!progress.ready || busy} aria-busy={busy} onClick={submit}>{busy ? 'Corrigindo…' : 'Enviar avaliação'}</button>{!progress.ready ? <p>Salve todas as respostas para habilitar o envio.</p> : null}{error ? <p role="alert">{error}</p> : null}</section>
}

function AssessmentContent({ assignmentUuid, courseUuid }: { assignmentUuid: string; courseUuid: string }) {
  const submission = useAssignmentSubmission()
  const attemptNumber = getAttemptNumber(submission)
  return <AssignmentsTaskProvider key={`${assignmentUuid}-attempt-${attemptNumber}`}><AssignmentStudentActivity /><AssessmentActions assignmentUuid={assignmentUuid} courseUuid={courseUuid} /></AssignmentsTaskProvider>
}

export default function XpexAssignment({ activityUuid, courseUuid, orgUuid, orgSlug }: { activityUuid: string; courseUuid: string; orgUuid: string; orgSlug: string }) {
  const session = useLHSession() as any
  const accessToken = session?.data?.tokens?.access_token
  const [assignmentUuid, setAssignmentUuid] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!accessToken) return
    getAssignmentFromActivityUUID(activityUuid, accessToken)
      .then(response => {
        if (response.status === 200 && response.data?.published) setAssignmentUuid(response.data.assignment_uuid)
        else setError(true)
      })
      .catch(() => setError(true))
  }, [accessToken, activityUuid])

  if (error) return <div className="xpex-empty" role="alert"><h2>Avaliação indisponível</h2><p>Não foi possível abrir esta avaliação. Tente novamente.</p></div>
  if (!assignmentUuid) return <div className="xpex-empty" role="status"><h2>Carregando avaliação…</h2><p>Buscando questões e sua tentativa salva.</p></div>
  return <OrgContext.Provider value={{ org: { org_uuid: orgUuid, slug: orgSlug }, isUserPartOfTheOrg: true, orgslug: orgSlug }}>
    <AssignmentSubmissionProvider assignment_uuid={assignmentUuid}>
      <AssignmentProvider assignment_uuid={assignmentUuid}>
        <AssessmentContent assignmentUuid={assignmentUuid} courseUuid={courseUuid} />
      </AssignmentProvider>
    </AssignmentSubmissionProvider>
  </OrgContext.Provider>
}
