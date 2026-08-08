import { notFound } from 'next/navigation'
import { AuthenticatedXpexExperience } from '@components/Xpex/AuthenticatedXpexExperience'
import type { XpexExperienceRole } from '@/lib/xpex/access'

const roles = new Set<XpexExperienceRole>(['aluno', 'professora', 'polo'])

export default async function XpexRolePage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params
  if (!roles.has(role as XpexExperienceRole)) notFound()
  return <AuthenticatedXpexExperience requestedRole={role as XpexExperienceRole} />
}
