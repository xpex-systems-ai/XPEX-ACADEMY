'use client'

import { useLHSession } from '@components/Contexts/LHSessionContext'
import { PoleExperience } from './experiences/PoleExperience'
import { StudentExperience } from './experiences/StudentExperience'
import { TeacherExperience } from './experiences/TeacherExperience'
import { XpexAppShell } from './XpexAppShell'
import { resolveXpexAccess, type LearnHouseMembership, type XpexExperienceRole } from '@/lib/xpex/access'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

const PILOT_ORG_SLUG = 'kelle-digital-lab'
const experiences = { aluno: StudentExperience, professora: TeacherExperience, polo: PoleExperience }

export function AuthenticatedXpexExperience({ requestedRole }: { requestedRole?: XpexExperienceRole }) {
  const session = useLHSession()
  const pathname = usePathname()
  const router = useRouter()
  const memberships = session?.data?.roles as unknown as LearnHouseMembership[] | undefined
  const roles = resolveXpexAccess(memberships, PILOT_ORG_SLUG)
  const role = requestedRole ?? roles[0]

  useEffect(() => {
    if (session?.status === 'unauthenticated') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [pathname, router, session?.status])

  if (!session || session.status === 'loading') {
    return <main className="grid min-h-screen place-items-center bg-slate-950 text-white">Validando acesso…</main>
  }
  if (session.status === 'unauthenticated') return null
  if (!role || !roles.includes(role)) {
    return <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-white"><section className="max-w-lg rounded-2xl border border-white/10 bg-white/5 p-8"><h1 className="text-xl font-bold">Acesso não autorizado</h1><p className="mt-3 text-slate-300">Sua conta não possui uma função válida no Polo Kelle Digital Lab. Peça a um administrador para revisar sua associação.</p></section></main>
  }

  const Experience = experiences[role]
  const displayName = session.data?.user?.first_name || session.data?.user?.username || 'Pessoa participante'
  return <XpexAppShell role={role} mode="authenticated" allowedRoles={roles} displayName={displayName}><Experience /></XpexAppShell>
}
