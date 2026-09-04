import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import {
  resolveXpexAccess,
  resolveXpexOrganization,
  resolveXpexPoloAccess,
  type LearnHouseMembership,
  type XpexExperienceRole,
  type XpexPoloAccess,
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

function membershipOrganizations(
  memberships: LearnHouseMembership[] | undefined,
): NonNullable<LearnHouseMembership['org']>[] {
  const organizations = new Map<string, NonNullable<LearnHouseMembership['org']>>()
  for (const { org } of memberships ?? []) {
    if (org?.slug && !organizations.has(org.slug)) organizations.set(org.slug, org)
  }
  return [...organizations.values()]
}

function resolveOperationalOrganization(
  memberships: LearnHouseMembership[] | undefined,
  isSuperadmin: boolean,
): LearnHouseMembership['org'] | null {
  if (isSuperadmin) return resolveXpexOrganization(memberships)

  for (const org of membershipOrganizations(memberships)) {
    if (org.slug && resolveXpexPoloAccess(memberships, org.slug)) return org
  }
  return null
}

const AUTHORITATIVE_TEACHER_ACCESS: XpexPoloAccess = {
  experience: 'polo_unificado_reduced',
  capabilities: [
    'view_assigned_students',
    'view_students_progress',
    'manage_authored_content',
    'manage_mentoring',
  ],
  isManager: false,
  isTeacher: true,
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
  if (isSuperadmin && !requestedRole) redirect('/xpex/admin')

  const hasOrganizationMembership = memberships?.some(({ org }) => Boolean(org?.slug)) ?? false
  const requestedOperationalRole = requestedRole === 'polo' || requestedRole === 'professora'

  let teacherData = null
  let teacherDataFailed = false
  let authoritativeTeacherAccess = false

  // Prefer canonical session roles. If serialization/custom-role drift prevents the
  // web resolver from recognizing a teacher, ask the XPeX teacher endpoint itself.
  // That endpoint performs a DB join against Role.role_uuid == role_global_instructor,
  // so a 200 response is server-authoritative proof of teacher access and grants only
  // the reduced teacher capability set — never manager/admin rights.
  let organization = requestedOperationalRole
    ? resolveOperationalOrganization(memberships, isSuperadmin)
    : resolveXpexOrganization(memberships, isSuperadmin ? undefined : requestedRole)

  if (
    requestedOperationalRole
    && !organization
    && !isSuperadmin
    && session.tokens?.access_token
  ) {
    for (const candidate of membershipOrganizations(memberships)) {
      if (!candidate.slug) continue
      try {
        teacherData = await getXpexTeacherDashboard(session.tokens.access_token, candidate.slug)
        organization = candidate
        authoritativeTeacherAccess = true
        break
      } catch {
        // A 403/404 means this organization does not grant canonical teacher access.
        // Keep checking other memberships without widening authorization.
      }
    }
  }

  const organizationSlug = organization?.slug
  if (!organizationSlug) return <AccessDenied noOrganization={!hasOrganizationMembership} />

  const membershipRoles = resolveXpexAccess(memberships, organizationSlug)
  const canonicalRoles: XpexExperienceRole[] = isSuperadmin
    ? (['polo', ...membershipRoles.filter(role => role !== 'polo')] as XpexExperienceRole[])
    : membershipRoles
  const poloAccess = resolveXpexPoloAccess(memberships, organizationSlug, isSuperadmin)
    ?? (authoritativeTeacherAccess ? AUTHORITATIVE_TEACHER_ACCESS : null)
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
  let launchReadiness = null
  let launchReadinessFailed = false

  // Platform-wide native admin navigation is superadmin-only. Organization
  // managers keep their Polo workspace and organization-scoped capabilities,
  // but never receive a platform-admin entry point in the XPeX shell.
  const adminAccess = isSuperadmin

  if (session.tokens?.access_token) {
    if (role === 'aluno') {
      try {
        learningData = await getXpexLearningDashboard(session.tokens.access_token, organizationSlug)
      } catch {
        learningDataFailed = true
      }
    }
    if (role === 'polo' && poloAccess?.isTeacher && teacherData === null) {
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
