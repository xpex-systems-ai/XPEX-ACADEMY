import { XpexAppShell } from '@components/Xpex/XpexAppShell'
import { PoleExperience } from '@components/Xpex/experiences/PoleExperience'
import { StudentExperience } from '@components/Xpex/experiences/StudentExperience'
import { TeacherExperience } from '@components/Xpex/experiences/TeacherExperience'
import type { XpexRole } from '@components/Xpex/xpex-types'
import type { ReactNode } from 'react'

export type BetaRole = XpexRole

const experiences = {
  aluno: StudentExperience,
  professora: TeacherExperience,
  polo: PoleExperience,
} satisfies Record<BetaRole, () => ReactNode>

export function BetaShell({ role }: { role: BetaRole }) {
  const Experience = experiences[role]
  return <XpexAppShell role={role}><Experience /></XpexAppShell>
}
