'use client'

import { useEffect, useState } from 'react'
import { getAssignmentFromActivityUUID } from '@services/courses/assignments'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { AssignmentProvider } from '@components/Contexts/Assignments/AssignmentContext'
import AssignmentSubmissionProvider from '@components/Contexts/Assignments/AssignmentSubmissionContext'
import { AssignmentsTaskProvider } from '@components/Contexts/Assignments/AssignmentsTaskContext'
import AssignmentStudentActivity from '@components/Objects/Activities/Assignment/AssignmentStudentActivity'

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
      <AssignmentsTaskProvider><AssignmentStudentActivity /></AssignmentsTaskProvider>
    </AssignmentProvider>
  </AssignmentSubmissionProvider>
}
