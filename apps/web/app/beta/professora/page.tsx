import type { Metadata } from 'next'
import { BetaShell } from '@components/Beta/BetaShell'

export const metadata: Metadata = { title: 'Visão da professora | XpeX Academy', description: 'Preview demonstrativo da turma piloto.' }

export default function TeacherBetaPage() { return <BetaShell role="professora" /> }
