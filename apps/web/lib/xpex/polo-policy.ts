import { resolveXpexPoloAccess, type LearnHouseMembership, type XpexPoloAccess, type XpexPoloCapability } from './access'

export const poloSectionPolicy = {
  turmas: { status: 'NATIVE_BRIDGE', capability: 'manage_classes' },
  cursos: { status: 'NATIVE_BRIDGE', capability: 'manage_courses' },
  conteudos: { status: 'NATIVE_BRIDGE', capability: 'manage_authored_content' },
  relatorios: { status: 'NATIVE_BRIDGE', capability: 'view_pole_overview' },
  configuracoes: { status: 'NATIVE_BRIDGE', capability: 'view_pole_overview' },
  trilhas: { status: 'COMING_SOON', capability: 'view_pole_overview' },
  mentorias: { status: 'COMING_SOON', capability: 'view_pole_overview' },
  eventos: { status: 'COMING_SOON', capability: 'view_pole_overview' },
  certificados: { status: 'COMING_SOON', capability: 'view_pole_overview' },
  recursos: { status: 'COMING_SOON', capability: 'view_pole_overview' },
} as const satisfies Record<string, { status: 'NATIVE_BRIDGE' | 'COMING_SOON'; capability: XpexPoloCapability }>

export function canAccessPoloSection(access: XpexPoloAccess | null | undefined, section: string): boolean {
  if (!Object.hasOwn(poloSectionPolicy, section)) return false
  const policy = poloSectionPolicy[section as keyof typeof poloSectionPolicy]
  return Boolean(access?.isManager && access.capabilities.includes(policy.capability))
}

export function canNavigatePolo(access: XpexPoloAccess | null | undefined, href: string): boolean {
  if (!access) return false
  if (href === '/xpex/polo') return access.isManager || access.isTeacher
  if (href === '/xpex/polo#cursos') return access.isTeacher && access.capabilities.includes('manage_authored_content')
  if (href === '/xpex/polo/alunos') return access.isManager && access.capabilities.includes('manage_students')
  const section = href.replace('/xpex/polo/', '')
  return canAccessPoloSection(access, section)
    && poloSectionPolicy[section as keyof typeof poloSectionPolicy].status === 'NATIVE_BRIDGE'
}

type PoloSession = {
  user?: { is_superadmin?: boolean } | null
  roles?: LearnHouseMembership[]
  tokens?: { access_token?: string }
}

/** Verify live Learning Core membership on every administrative render/action. */
export async function authorizePoloManager<T>(
  session: PoloSession | null,
  organizationSlug: string,
  verify: (_token: string, _slug: string) => Promise<T>,
): Promise<T> {
  const access = resolveXpexPoloAccess(session?.roles, organizationSlug, session?.user?.is_superadmin === true)
  const hasOrganization = session?.roles?.some(({ org }) => org?.slug === organizationSlug)
  if (!session?.user || !session.tokens?.access_token || !organizationSlug || !hasOrganization
    || !access?.isManager || !access.capabilities.includes('manage_students')) {
    throw new Error('Polo administration access denied')
  }
  return verify(session.tokens.access_token, organizationSlug)
}
