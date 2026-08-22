import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { resolveXpexAccess, resolveXpexOrganization } from './access'
import { getXpexLearningDashboard } from './learning-dashboard'

export async function getAuthorizedStudentLearning(returnPath: string) {
  const session = await getServerSession()
  if (!session?.user) redirect(`/login?next=${encodeURIComponent(returnPath)}`)
  const organization = resolveXpexOrganization(session.roles, 'aluno')
  if (!organization?.slug || !resolveXpexAccess(session.roles, organization.slug).includes('aluno') || !session.tokens?.access_token) return null
  const data = await getXpexLearningDashboard(session.tokens.access_token, organization.slug)
  const name = [session.user.first_name, session.user.last_name].filter(Boolean).join(' ') || session.user.username || 'Estudante'
  return { data, organization, displayName: name, accessToken: session.tokens.access_token }
}
