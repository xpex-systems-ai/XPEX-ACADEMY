export type XpexExperienceRole = 'aluno' | 'professora' | 'polo'

export interface LearnHouseMembership {
  role?: { name?: string; role_uuid?: string }
  org?: { slug?: string }
}

const ROLE_NAMES: Record<string, XpexExperienceRole> = {
  admin: 'polo',
  administrator: 'polo',
  instructor: 'professora',
  teacher: 'professora',
  member: 'aluno',
  student: 'aluno',
}

export function xpexRoleForMembership(membership: LearnHouseMembership): XpexExperienceRole | null {
  const candidates = [membership.role?.name, membership.role?.role_uuid]
  for (const candidate of candidates) {
    const normalized = candidate?.toLowerCase().replace(/^role_(global|organization)_/, '')
    if (normalized && ROLE_NAMES[normalized]) return ROLE_NAMES[normalized]
  }
  return null
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
