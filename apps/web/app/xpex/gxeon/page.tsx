import React from 'react'
import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import { XpexStudentDenied } from '@components/Xpex/XpexStudentStates'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'
import { GxeonCommandCenter } from '@components/Xpex/Gxeon/GxeonCommandCenter'

export const metadata = {
  title: 'GXEON Copilot — Centro de Comando Inteligente | XPeX Academy',
  description: 'Aprenda mais rápido. Construa com IA. Conecte conhecimento, projetos e prática em um só lugar.',
}

export default async function GxeonCommandCenterPage() {
  const learning = await getAuthorizedStudentLearning('/xpex/gxeon')
  if (!learning) {
    return <XpexStudentDenied />
  }

  const organizationSlug = learning.organization.slug
  const nativeWorkspaceAvailable = Boolean(organizationSlug && organizationSlug !== 'default')
  const courses = learning.data.courses || []
  const totalLessons = courses.reduce((sum, course) => sum + (course.total_lessons || 0), 0)
  const completedLessons = courses.reduce((sum, course) => sum + (course.completed_lessons || 0), 0)
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  return (
    <XpexAuthenticatedShell
      role="aluno"
      allowedRoles={['aluno']}
      displayName={learning.displayName}
      organizationSlug={organizationSlug}
      poloBranding={learning.branding}
    >
      <main className="xpex-native-page">
        <header className="sr-only">
          <h1>GXEON Copilot — Centro de Comando Inteligente</h1>
          <p>Seu centro de comando inteligente da XPeX Academy.</p>
        </header>

        <GxeonCommandCenter
          accessToken={learning.accessToken}
          organizationSlug={organizationSlug}
          displayName={learning.displayName}
          enrolledCoursesCount={courses.length}
          availableLessonsCount={totalLessons}
          overallProgress={progress}
          nativeWorkspaceAvailable={nativeWorkspaceAvailable}
        />
      </main>
    </XpexAuthenticatedShell>
  )
}
