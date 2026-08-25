import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import {
  resolveXpexAccess,
  resolveXpexOrganization,
  type LearnHouseMembership,
  type XpexExperienceRole,
} from '@/lib/xpex/access'
import { AuthenticatedDashboard } from './experiences/AuthenticatedDashboard'
import { XpexAuthenticatedShell } from './XpexAuthenticatedShell'
import { XpexErrorState } from './XpexPrimitives'
import { getXpexLearningDashboard } from '@/lib/xpex/learning-dashboard'

function AccessDenied({ noOrganization = false }: { noOrganization?: boolean }) {
  return <main className="xpex-root grid min-h-screen place-items-center p-6"><div className="max-w-xl"><XpexErrorState title={noOrganization ? 'Sua conta está pronta' : 'Acesso não autorizado'} description={noOrganization ? 'Seu acesso ao ambiente de aprendizagem ainda precisa ser associado a uma organização ou matrícula válida.' : 'Sua conta não possui um papel autorizado nesta organização. Peça a uma pessoa administradora para revisar sua associação.'} /></div></main>
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

  const memberships: LearnHouseMembership[] | undefined = session.roles
  const hasOrganizationMembership = memberships?.some(({ org }) => Boolean(org?.slug)) ?? false
  const organization = resolveXpexOrganization(memberships, requestedRole)
  const organizationSlug = organization?.slug
  if (!organizationSlug) return <AccessDenied noOrganization={!hasOrganizationMembership} />
  const roles = resolveXpexAccess(memberships, organizationSlug)
  const role = requestedRole ?? roles[0]
  if (!role || !roles.includes(role)) return <AccessDenied />

  const fullName = [session.user.first_name, session.user.last_name].filter(Boolean).join(' ').trim()
  const displayName = fullName || session.user.username || 'Pessoa participante'
  let learningData = null
  let learningDataFailed = false
  if (role === 'aluno' && session.tokens?.access_token) {
    try {
      learningData = await getXpexLearningDashboard(
        session.tokens.access_token,
        organizationSlug
      )
    } catch {
      learningDataFailed = true
    }
  }
  const organizationName = organization?.name
  return (
    <XpexAuthenticatedShell role={role} allowedRoles={roles} displayName={displayName}>
      <AuthenticatedDashboard
        role={role}
        displayName={displayName}
        learningData={learningData}
        learningDataFailed={learningDataFailed}
        organizationName={organizationName}
        organizationSlug={organizationSlug}
      />
    </XpexAuthenticatedShell>
  )
}
