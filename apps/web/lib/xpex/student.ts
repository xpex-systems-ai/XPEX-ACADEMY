import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { resolveXpexAccess, resolveXpexOrganization } from './access'
import { getXpexLearningDashboard } from './learning-dashboard'
import { getPoloBranding } from './polo-branding-server'

type AuthorizedOrganization = NonNullable<ReturnType<typeof resolveXpexOrganization>> & { id: number; slug: string }
export type AuthorizedStudentLearning = {
  data: Awaited<ReturnType<typeof getXpexLearningDashboard>>
  organization: AuthorizedOrganization
  displayName: string
  accessToken: string
  branding: Awaited<ReturnType<typeof getPoloBranding>>
}

export async function getAuthorizedStudentLearning(returnPath: string): Promise<AuthorizedStudentLearning | null> {
  const session = await getServerSession()
  if (!session?.user) redirect(`/login?next=${encodeURIComponent(returnPath)}`)
  const organization = resolveXpexOrganization(session.roles, 'aluno')
  const accessToken = session.tokens?.access_token
  if (!organization || !organization.slug || !organization.id || !resolveXpexAccess(session.roles, organization.slug).includes('aluno') || !accessToken) return null
  const authorizedOrganization: AuthorizedOrganization = { ...organization, id: organization.id, slug: organization.slug }
  const [data, branding] = await Promise.all([
    getXpexLearningDashboard(accessToken, authorizedOrganization.slug),
    getPoloBranding(accessToken, authorizedOrganization.slug, authorizedOrganization.name),
  ])
  const name = [session.user.first_name, session.user.last_name].filter(Boolean).join(' ') || session.user.username || 'Estudante'
  return { data, organization: authorizedOrganization, displayName: name, accessToken, branding }
}
