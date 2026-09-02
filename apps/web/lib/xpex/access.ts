export type XpexExperienceRole = 'aluno' | 'professora' | 'polo'

export interface LearnHouseMembership {
  role?: { name?: string; role_uuid?: string }
  org?: { slug?: string; name?: string }
}

export type XpexPoloCapability =
  | 'view_pole_overview' | 'manage_students' | 'manage_classes'
  | 'manage_courses' | 'view_assigned_students' | 'view_students_progress'
  | 'manage_authored_content' | 'manage_mentoring'

export type XpexPoloAccess = {
  experience: 'polo_unificado' | 'polo_unificado_reduced'
  capabilities: XpexPoloCapability[]
  isManager: boolean
  isTeacher: boolean
}

const CANONICAL_ROLE_UUIDS: Record<string, XpexExperienceRole> = {
  role_global_admin: 'polo',
  role_global_maintainer: 'polo',
  role_global_instructor: 'professora',
  role_global_user: 'aluno',
}

const CANONICAL_ROLE_NAMES: Record<string, XpexExperienceRole> = {
  admin: 'polo',
  administrator: 'polo',
  maintainer: 'polo',
  instructor: 'professora',
  teacher: 'professora',
  professor: 'professora',
  professora: 'professora',
  user: 'aluno',
  student: 'aluno',
  aluno: 'aluno',
}

function normalizeRoleValue(value: string | undefined): string | null {
  const normalized = value?.trim().toLowerCase()
  return normalized || null
}

export function xpexRoleForMembership(membership: LearnHouseMembership): XpexExperienceRole | null {
  const roleUuid = normalizeRoleValue(membership.role?.role_uuid)
  // A supplied UUID is authoritative. Never fall back to a display name when
  // that identifier is unknown: a custom role named "Admin" must not inherit
  // the polo experience.
  if (roleUuid) return CANONICAL_ROLE_UUIDS[roleUuid] ?? null

  const roleName = normalizeRoleValue(membership.role?.name)
  return roleName ? CANONICAL_ROLE_NAMES[roleName] ?? null : null
}

export function resolveXpexAccess(
  memberships: LearnHouseMembership[] | undefined,
  orgSlug: string,
): XpexExperienceRole[] {
  const roles = (memberships ?? [])
    .filter(({ org }) => org?.slug === orgSlug)
    .map(xpexRoleForMembership)
    .filter((role): role is XpexExperienceRole => role !== null)
  return [...new Set(roles)]
}

/** Derive the unified operational experience only from canonical session roles. */
export function resolveXpexPoloAccess(
  memberships: LearnHouseMembership[] | undefined,
  orgSlug: string,
  isSuperadmin = false,
): XpexPoloAccess | null {
  const roles = resolveXpexAccess(memberships, orgSlug)
  const isManager = isSuperadmin || roles.includes('polo')
  const isTeacher = roles.includes('professora')
  if (!isManager && !isTeacher) return null
  const capabilities: XpexPoloCapability[] = isManager
    ? ['view_pole_overview', 'manage_students', 'manage_classes', 'manage_courses', 'view_assigned_students', 'view_students_progress', 'manage_authored_content', 'manage_mentoring']
    : ['view_assigned_students', 'view_students_progress', 'manage_authored_content', 'manage_mentoring']
  return { experience: isManager ? 'polo_unificado' : 'polo_unificado_reduced', capabilities, isManager, isTeacher }
}

export function resolveXpexOrganization(
  memberships: LearnHouseMembership[] | undefined,
  requestedRole?: XpexExperienceRole,
): LearnHouseMembership['org'] | null {
  const membership = memberships?.find((candidate) => {
    const role = xpexRoleForMembership(candidate)
    return Boolean(candidate.org?.slug && role && (!requestedRole || role === requestedRole))
  })
  return membership?.org ?? null
}

export function safeLoginNext(pathname: string): string {
  return pathname.startsWith('/') && !pathname.startsWith('//') && !pathname.includes('\\')
    ? pathname
    : '/xpex'
}
