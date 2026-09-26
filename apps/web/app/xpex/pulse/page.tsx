import React from 'react'
import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import { XpexStudentDenied } from '@components/Xpex/XpexStudentStates'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'
import { PulseHome } from '@components/Xpex/Pulse/PulseHome'

export const metadata = {
  title: 'XPeX Pulse — Central de Descoberta | XPeX Academy',
  description: 'Central inteligente de vídeos, tendências e notícias sobre IA. Aprenda. Descubra. Acompanhe o futuro.',
}

export default async function PulsePage() {
  const learning = await getAuthorizedStudentLearning('/xpex/pulse')
  if (!learning) {
    return <XpexStudentDenied />
  }

  const organizationSlug = learning.organization.slug

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
          <h1>XPeX Pulse — Central Inteligente de Descoberta</h1>
          <p>Vídeos curados, tendências de mercado, tecnologias emergentes e radar XPeX.</p>
        </header>

        <PulseHome
          accessToken={learning.accessToken}
          displayName={learning.displayName}
          organizationSlug={organizationSlug}
        />
      </main>
    </XpexAuthenticatedShell>
  )
}
