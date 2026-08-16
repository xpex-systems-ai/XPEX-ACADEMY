import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { resolveXpexAccess, type LearnHouseMembership, type XpexExperienceRole } from '@/lib/xpex/access'
import { PoleExperience } from './experiences/PoleExperience'
import { StudentExperience } from './experiences/StudentExperience'
import { TeacherExperience } from './experiences/TeacherExperience'
import { XpexAppShell } from './XpexAppShell'

const PILOT_ORG_SLUG = 'kelle-digital-lab'
const experiences = { aluno: StudentExperience, professora: TeacherExperience, polo: PoleExperience }

function AccessDenied() {
  return <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-white"><section className="max-w-lg rounded-2xl border border-white/10 bg-white/5 p-8"><h1 className="text-xl font-bold">Acesso não autorizado</h1><p className="mt-3 text-slate-300">Sua conta não possui uma função válida no Polo Kelle Digital Lab. Peça a um administrador para revisar sua associação.</p></section></main>
}

/**
 * Server authorization boundary for XpeX. Route parameters can request an
 * experience, but only API-issued organization memberships can authorize it.
 */
export async function AuthenticatedXpexExperience({
  requestedRole,
  returnPath,
}: {
  requestedRole?: XpexExperienceRole
  returnPath: string
}) {
  const session = await getServerSession()
  if (!session?.user) redirect(`/login?next=${encodeURIComponent(returnPath)}`)

  const memberships = session.roles as unknown as LearnHouseMembership[] | undefined
  const roles = resolveXpexAccess(memberships, PILOT_ORG_SLUG)
  const role = requestedRole ?? roles[0]
  if (!role || !roles.includes(role)) return <AccessDenied />

  const Experience = experiences[role]
  const displayName = session.user.first_name || session.user.username || 'Pessoa participante'
  return <XpexAppShell role={role} mode="authenticated" allowedRoles={roles} displayName={displayName}><Experience /></XpexAppShell>
}
