import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import {
  resolveXpexAccess,
  resolveXpexOrganization,
  resolveXpexPoloAccess,
  type LearnHouseMembership,
  type XpexExperienceRole,
} from '@/lib/xpex/access'
import { AuthenticatedDashboard } from './experiences/AuthenticatedDashboard'
import { FuturisticStudentDashboard } from './experiences/FuturisticStudentDashboard'
import { XpexAuthenticatedShell } from './XpexAuthenticatedShell'
import { XpexErrorState } from './XpexPrimitives'
import { getXpexLearningDashboard } from '@/lib/xpex/learning-dashboard'
import { getXpexTeacherDashboard } from '@/lib/xpex/teacher-dashboard'
import { getXpexLaunchReadiness } from '@/lib/xpex/launch-readiness'

function AccessDenied({ noOrganization = false }: { noOrganization?: boolean }) {
  return <main className="xpex-root grid min-h-screen place-items-center p-6"><div className="max-w-xl"><XpexErrorState title={noOrganization ? 'Sua conta está pronta' : 'Acesso não autorizado'} description={noOrganization ? 'Seu acesso ao ambiente de aprendizagem ainda precisa ser associado a uma organização ou matrícula válida.' : 'Sua conta não possui um papel autorizado nesta organização. Peça a uma pessoa administradora para revisar sua associação.'} /></div></main>
}

function resolveOperationalOrganization(
  memberships: LearnHouseMembership[] | undefined,
  isSuperadmin: boolean,
): LearnHouseMembership['org'] | null {
  if (isSuperadmin) return resolveXpexOrganization(memberships)

  const slugs = [...new Set((memberships ?? []).map(({ org }) => org?.slug).filter((slug): slug is string => Boolean(slug)))]
  for (const slug of slugs) {
    if (resolveXpexPoloAccess(memberships, slug)) {
      return memberships?.find(({ org }) => org?.slug === slug)?.org ?? null
    }
  }
  return null
}

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
  const isSuperadmin = session.user.is_superadmin === true
  const hasOrganizationMembership = memberships?.some(({ org }) => Boolean(org?.slug)) ?? false
  const requestedOperationalRole = requestedRole === 'polo' || requestedRole === 'professora'

  // Polo and Professor are one operational surface. For explicit operational routes,
  // resolve an organization that grants either canonical manager or teacher access.
  // This keeps teacher-only users inside the unified shell without inventing manager rights.
  const organization = requestedOperationalRole
    ? resolveOperationalOrganization(memberships, isSuperadmin)
    : resolveXpexOrganization(memberships, isSuperadmin ? undefined : requestedRole)
  const organizationSlug = organization?.slug
  if (!organizationSlug) return <AccessDenied noOrganization={!hasOrganizationMembership} />

  const membershipRoles = resolveXpexAccess(memberships, organizationSlug)
  const canonicalRoles: XpexExperienceRole[] = isSuperadmin
    ? (['polo', ...membershipRoles.filter(role => role !== 'polo')] as XpexExperienceRole[])
    : membershipRoles
  const poloAccess = resolveXpexPoloAccess(memberships, organizationSlug, isSuperadmin)
  const shouldUseUnifiedPolo = Boolean(
    poloAccess && (requestedOperationalRole || (!requestedRole && (membershipRoles.includes('polo') || membershipRoles.includes('professora')))),
  )
  const role: XpexExperienceRole | undefined = shouldUseUnifiedPolo
    ? 'polo'
    : requestedRole ?? (isSuperadmin ? 'polo' : canonicalRoles[0])
  const roles: XpexExperienceRole[] = poloAccess
    ? (['polo', ...canonicalRoles.filter(item => item !== 'polo' && item !== 'professora')] as XpexExperienceRole[])
    : canonicalRoles
  if (!role || (role === 'polo' ? !poloAccess : !roles.includes(role))) return <AccessDenied />

  const fullName = [session.user.first_name, session.user.last_name].filter(Boolean).join(' ').trim()
  const displayName = fullName || session.user.username || 'Pessoa participante'
  let learningData = null
  let learningDataFailed = false
  let teacherData = null
  let teacherDataFailed = false
  let launchReadiness = null
  let launchReadinessFailed = false
  const adminAccess = poloAccess?.isManager ?? isSuperadmin

  if (session.tokens?.access_token) {
    if (role === 'aluno') {
      try {
        learningData = await getXpexLearningDashboard(session.tokens.access_token, organizationSlug)
      } catch {
        learningDataFailed = true
      }
    }
    if (role === 'polo' && poloAccess?.isTeacher) {
      try {
        teacherData = await getXpexTeacherDashboard(session.tokens.access_token, organizationSlug)
      } catch {
        teacherDataFailed = true
      }
    }
    if (role === 'polo' && poloAccess?.isManager) {
      try {
        launchReadiness = await getXpexLaunchReadiness(session.tokens.access_token, organizationSlug)
      } catch {
        launchReadinessFailed = true
      }
    }
  }

  const organizationName = organization?.name
  return (
    <XpexAuthenticatedShell role={role} allowedRoles={roles} displayName={displayName} organizationSlug={organizationSlug} adminAccess={adminAccess}>
      {role === 'aluno' ? (
        <FuturisticStudentDashboard
          displayName={displayName}
          organizationName={organizationName}
          organizationSlug={organizationSlug}
          data={learningData}
          failed={learningDataFailed}
        />
      ) : (
        <AuthenticatedDashboard
          role={role}
          displayName={displayName}
          learningData={learningData}
          learningDataFailed={learningDataFailed}
          teacherData={teacherData}
          teacherDataFailed={teacherDataFailed}
          launchReadiness={launchReadiness}
          launchReadinessFailed={launchReadinessFailed}
          organizationName={organizationName}
          organizationSlug={organizationSlug}
          poloAccess={poloAccess}
        />
      )}
    </XpexAuthenticatedShell>
  )
}
