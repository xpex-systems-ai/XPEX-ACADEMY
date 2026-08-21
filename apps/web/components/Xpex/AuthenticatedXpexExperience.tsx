import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import {
  resolveXpexAccess,
  type LearnHouseMembership,
  type XpexExperienceRole,
} from '@/lib/xpex/access'
import { AuthenticatedDashboard } from './experiences/AuthenticatedDashboard'
import { XpexAuthenticatedShell } from './XpexAuthenticatedShell'
import { XpexErrorState } from './XpexPrimitives'
import { getXpexLearningDashboard } from '@/lib/xpex/learning-dashboard'

const PILOT_ORG_SLUG = 'kelle-digital-lab'

function AccessDenied() {
  return <main className="xpex-root grid min-h-screen place-items-center p-6"><div className="max-w-xl"><XpexErrorState title="Acesso não autorizado" description="Sua conta não possui um papel autorizado nesta organização. Peça a uma pessoa administradora para revisar sua associação." /></div></main>
}

/**
 * Server authorization boundary for XpeX. Route parameters can request an
 * experience, but only API-issued organization memberships can authorize it.
 */
export async function AuthenticatedXpexExperience({
  requestedRole,
  returnPath,
}: {
  requestedRole?: XpexExperienceRole
  returnPath: string
}) {
  const session = await getServerSession()
  if (!session?.user) redirect(`/login?next=${encodeURIComponent(returnPath)}`)

  const memberships = session.roles as unknown as
    | LearnHouseMembership[]
    | undefined
  const roles = resolveXpexAccess(memberships, PILOT_ORG_SLUG)
  const role = requestedRole ?? roles[0]
  if (!role || !roles.includes(role)) return <AccessDenied />

  const displayName =
    session.user.first_name || session.user.username || 'Pessoa participante'
  let learningData = null
  let learningDataFailed = false
  if (role === 'aluno' && session.tokens?.access_token) {
    try {
      learningData = await getXpexLearningDashboard(
        session.tokens.access_token,
        PILOT_ORG_SLUG
      )
    } catch (error) {
      learningDataFailed = true
      console.error('[XPEX_DASHBOARD] Unable to load learner dashboard', error)
    }
  }
  const organizationName = memberships?.find(({ org }) => org?.slug === PILOT_ORG_SLUG)?.org?.name
  return (
    <XpexAuthenticatedShell role={role} allowedRoles={roles} displayName={displayName}>
      <AuthenticatedDashboard
        role={role}
        displayName={displayName}
        learningData={learningData}
        learningDataFailed={learningDataFailed}
        organizationName={organizationName}
      />
    </XpexAuthenticatedShell>
  )
}
