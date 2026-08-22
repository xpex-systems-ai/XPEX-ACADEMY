import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { resolveXpexAccess, resolveXpexOrganization } from './access'
import { getXpexLearningDashboard } from './learning-dashboard'

type AuthorizedOrganization = NonNullable<ReturnType<typeof resolveXpexOrganization>> & { slug: string }
export type AuthorizedStudentLearning = {
  data: Awaited<ReturnType<typeof getXpexLearningDashboard>>
  organization: AuthorizedOrganization
  displayName: string
  accessToken: string
}

export async function getAuthorizedStudentLearning(returnPath: string): Promise<AuthorizedStudentLearning | null> {
  const session = await getServerSession()
  if (!session?.user) redirect(`/login?next=${encodeURIComponent(returnPath)}`)
  const organization = resolveXpexOrganization(session.roles, 'aluno')
  const accessToken = session.tokens?.access_token
  if (!organization || !organization.slug || !resolveXpexAccess(session.roles, organization.slug).includes('aluno') || !accessToken) return null
  const authorizedOrganization: AuthorizedOrganization = { ...organization, slug: organization.slug }
  const data = await getXpexLearningDashboard(accessToken, authorizedOrganization.slug)
  const name = [session.user.first_name, session.user.last_name].filter(Boolean).join(' ') || session.user.username || 'Estudante'
  return { data, organization: authorizedOrganization, displayName: name, accessToken }
}
