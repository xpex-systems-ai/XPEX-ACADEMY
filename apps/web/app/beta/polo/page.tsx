import type { Metadata } from 'next'
import { BetaShell } from '@components/Beta/BetaShell'

export const metadata: Metadata = { title: 'Polo Kelle Digital Lab | XpeX Academy', description: 'Preview demonstrativo do polo piloto da XpeX Academy.' }
export default function PoleBetaPage() { return <BetaShell role="polo" /> }
