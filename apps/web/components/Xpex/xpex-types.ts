import type { LucideIcon } from 'lucide-react'

export type XpexRole = 'aluno' | 'professora' | 'polo'
export type XpexNavItem = { label: string; icon: LucideIcon; href: string }
export type XpexMetric = { label: string; value: string; detail: string; icon: LucideIcon; tone?: 'orange' | 'blue' }

