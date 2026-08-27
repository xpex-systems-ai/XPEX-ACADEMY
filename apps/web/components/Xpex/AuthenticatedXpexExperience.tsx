import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import {
  resolveXpexAccess,
  resolveXpexOrganization,
  type LearnHouseMembership,
  type XpexExperienceRole,
} from '@/lib/xpex/access'
import { AuthenticatedDashboard } from './experiences/AuthenticatedDashboard'
import { FuturisticStudentDashboard } from './experiences/FuturisticStudentDashboard'
import { XpexAuthenticatedShell } from './XpexAuthenticatedShell'
import { XpexErrorState } from './XpexPrimitives'
import { getXpexLearningDashboard } from '@/lib/xpex/learning-dashboard'
import { getXpexTeacherDashboard } from '@/lib/xpex/teacher-dashboard'
import { listCourseStudioDrafts } from '@services/xpex/courseStudio'

function AccessDenied({ noOrganization = false }: { noOrganization?: boolean }) {
  return <main className="xpex-root grid min-h-screen place-items-center p-6"><div className="max-w-xl"><XpexErrorState title={noOrganization ? 'Sua conta está pronta' : 'Acesso não autorizado'} description={noOrganization ? 'Seu acesso ao ambiente de aprendizagem ainda precisa ser associado a uma organização ou matrícula válida.' : 'Sua conta não possui um papel autorizado nesta organização. Peça a uma pessoa administradora para revisar sua associação.'} /></div></main>
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

  // A superadmin is a platform-level administrator. Its organization membership
  // may legitimately be a student membership, so do not use that membership
  // role to block the administrative XPeX experience.
  const organization = resolveXpexOrganization(memberships, isSuperadmin ? undefined : requestedRole)
  const organizationSlug = organization?.slug
  if (!organizationSlug) return <AccessDenied noOrganization={!hasOrganizationMembership} />

  const membershipRoles = resolveXpexAccess(memberships, organizationSlug)
  const roles: XpexExperienceRole[] = isSuperadmin
    ? (['polo', ...membershipRoles.filter(role => role !== 'polo')] as XpexExperienceRole[])
    : membershipRoles
  const role: XpexExperienceRole | undefined = requestedRole ?? (isSuperadmin ? 'polo' : roles[0])
  if (!role || !roles.includes(role)) return <AccessDenied />

  const fullName = [session.user.first_name, session.user.last_name].filter(Boolean).join(' ').trim()
  const displayName = fullName || session.user.username || 'Pessoa participante'
  let learningData = null
  let learningDataFailed = false
  let teacherData = null
  let teacherDataFailed = false
  let adminAccess = isSuperadmin

  if (session.tokens?.access_token) {
    if (!adminAccess) {
      try {
        await listCourseStudioDrafts(organizationSlug, session.tokens.access_token)
        adminAccess = true
      } catch {
        adminAccess = false
      }
    }
    if (role === 'aluno') {
      try {
        learningData = await getXpexLearningDashboard(session.tokens.access_token, organizationSlug)
      } catch {
        learningDataFailed = true
      }
    }
    if (role === 'professora') {
      try {
        teacherData = await getXpexTeacherDashboard(session.tokens.access_token, organizationSlug)
      } catch {
        teacherDataFailed = true
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
          organizationName={organizationName}
          organizationSlug={organizationSlug}
        />
      )}
    </XpexAuthenticatedShell>
  )
}
