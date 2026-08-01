import type { Metadata } from 'next'
import { BetaShell } from '@components/Beta/BetaShell'

export const metadata: Metadata = { title: 'Dashboard do aluno | XpeX Academy', description: 'Preview demonstrativo da experiência beta do aluno.' }

export default function StudentBetaPage() { return <BetaShell role="aluno" /> }
