'use client'

import { useEffect, useState } from 'react'
import { getAssignmentFromActivityUUID } from '@services/courses/assignments'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { AssignmentProvider } from '@components/Contexts/Assignments/AssignmentContext'
import AssignmentSubmissionProvider from '@components/Contexts/Assignments/AssignmentSubmissionContext'
import { AssignmentsTaskProvider } from '@components/Contexts/Assignments/AssignmentsTaskContext'
import AssignmentStudentActivity from '@components/Objects/Activities/Assignment/AssignmentStudentActivity'
import { useAssignmentSubmission, useAssignmentTaskSubmissions } from '@components/Contexts/Assignments/AssignmentSubmissionContext'
import { useAssignments } from '@components/Contexts/Assignments/AssignmentContext'
import { getFinalGrade, retryAssignmentSubmission, submitAssignmentForGrading } from '@services/courses/assignments'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/keys'

function AssessmentActions({ assignmentUuid }: { assignmentUuid: string }) {
  const session = useLHSession() as any
  const submission = useAssignmentSubmission() as any
  const taskSubmissions = useAssignmentTaskSubmissions()
  const assignment = useAssignments() as any
  const queryClient = useQueryClient()
  const [result, setResult] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const status = Array.isArray(submission) ? submission[0]?.submission_status : null
  const graded = status === 'GRADED'
  const quizQuestions = assignment?.assignment_tasks?.flatMap((task: any) => task.contents?.questions || []) || []
  const savedAnswers = Object.values(taskSubmissions || {}).flatMap((item: any) => item?.task_submission?.submissions || [])
  const answeredQuestions = new Set(savedAnswers.filter((answer: any) => answer.answer === true).map((answer: any) => answer.questionUUID))
  const complete = quizQuestions.length > 0 && quizQuestions.every((question: any) => answeredQuestions.has(question.questionUUID))

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments.submission(assignmentUuid) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments.taskSubmission(assignmentUuid) }),
    ])
  }

  useEffect(() => {
    if (!graded || !session?.data?.user?.id || result) return
    getFinalGrade(session.data.user.id, assignmentUuid, session.data.tokens.access_token)
      .then(response => response.success ? setResult(response.data) : setError('Não foi possível carregar o resultado.'))
  }, [assignmentUuid, graded, result, session])

  const submit = async () => {
    if (!complete || busy || !window.confirm('Enviar respostas para correção final?')) return
    setBusy(true); setError(null)
    const response = await submitAssignmentForGrading(assignmentUuid, session.data.tokens.access_token)
    if (!response.success) setError(response.data?.detail || 'Não foi possível enviar a avaliação.')
    await refresh(); setBusy(false)
  }

  const retry = async () => {
    if (busy) return
    setBusy(true); setError(null)
    const response = await retryAssignmentSubmission(assignmentUuid, session.data.tokens.access_token)
    if (response.success) { setResult(null); await refresh() }
    else setError(response.data?.detail || 'Não foi possível iniciar outra tentativa.')
    setBusy(false)
  }

  if (graded && result) return <section className="xpex-card" aria-live="polite"><p className="xpex-label">Resultado persistido</p><h2>{result.passed ? 'Aprovado' : 'Reprovado'}</h2><p><strong>{result.percentage_display}</strong> · mínimo {result.passing_threshold}%</p>{result.tasks?.map((task: any) => <p key={task.assignment_task_uuid}>{task.description}: {task.percentage_display} — {task.feedback}</p>)}<div className="flex gap-3"><button type="button" disabled={busy} onClick={retry}>{busy ? 'Preparando…' : 'Tentar novamente'}</button><a href="../../">Voltar ao curso</a></div></section>
  return <section className="xpex-card"><p>{answeredQuestions.size} de {quizQuestions.length} questões respondidas</p><button type="button" disabled={!complete || busy} aria-busy={busy} onClick={submit}>{busy ? 'Corrigindo…' : 'Enviar avaliação'}</button>{!complete ? <p>Responda todas as questões para habilitar o envio.</p> : null}{error ? <p role="alert">{error}</p> : null}</section>
}

export default function XpexAssignment({ activityUuid }: { activityUuid: string }) {
  const session = useLHSession() as any
  const accessToken = session?.data?.tokens?.access_token
  const [assignmentUuid, setAssignmentUuid] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!accessToken) return
    getAssignmentFromActivityUUID(activityUuid, accessToken).then(response => {
      if (response.status === 200 && response.data?.published) setAssignmentUuid(response.data.assignment_uuid)
      else setError(true)
    })
  }, [accessToken, activityUuid])

  if (error) return <div className="xpex-empty" role="alert"><h2>Avaliação indisponível</h2><p>Não foi possível abrir esta avaliação. Tente novamente.</p></div>
  if (!assignmentUuid) return <div className="xpex-empty" role="status"><h2>Carregando avaliação…</h2><p>Buscando questões e sua tentativa salva.</p></div>
  return <AssignmentSubmissionProvider assignment_uuid={assignmentUuid}>
    <AssignmentProvider assignment_uuid={assignmentUuid}>
      <AssignmentsTaskProvider><AssignmentStudentActivity /><AssessmentActions assignmentUuid={assignmentUuid} /></AssignmentsTaskProvider>
    </AssignmentProvider>
  </AssignmentSubmissionProvider>
}
