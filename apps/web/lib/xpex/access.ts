export type XpexExperienceRole = 'aluno' | 'professora' | 'polo'

export interface LearnHouseMembership {
  role?: { name?: string; role_uuid?: string }
  org?: { slug?: string }
}

const CANONICAL_ROLE_UUIDS: Record<string, XpexExperienceRole> = {
  role_global_admin: 'polo',
  role_global_instructor: 'professora',
  role_global_user: 'aluno',
}

export function xpexRoleForMembership(membership: LearnHouseMembership): XpexExperienceRole | null {
  const roleUuid = membership.role?.role_uuid?.toLowerCase()
  return roleUuid ? CANONICAL_ROLE_UUIDS[roleUuid] ?? null : null
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

export function safeLoginNext(pathname: string): string {
  return pathname.startsWith('/') && !pathname.startsWith('//') && !pathname.includes('\\')
    ? pathname
    : '/xpex'
}
