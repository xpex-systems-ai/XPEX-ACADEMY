'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, BookOpen, ChartNoAxesCombined, GraduationCap, Library, Settings, Users } from 'lucide-react'
import { useOrg } from '@components/Contexts/OrgContext'
import { getUriWithOrg } from '@services/config/config'

const nativeLinks = [
  { label: 'Turmas', path: '/dash/users/settings/usergroups', icon: GraduationCap, xpex: false },
  { label: 'Cursos', path: '/dash/courses', icon: BookOpen, xpex: false },
  { label: 'Alunos', path: '/xpex/polo/alunos', icon: Users, xpex: true },
  { label: 'Conteúdos', path: '/dash/library', icon: Library, xpex: false },
  { label: 'Relatórios', path: '/dash/analytics', icon: ChartNoAxesCombined, xpex: false },
  { label: 'Configurações', path: '/dash/org/settings/general', icon: Settings, xpex: false },
] as const

function monogram(name?: string) {
  const parts = (name || 'XpeX Academy').trim().split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'XP'
}

export default function XpexNativeAdminMenu() {
  const org = useOrg()
  const pathname = usePathname() || ''

  if (!org?.slug) return null

  return (
    <aside className="xpex-native-admin-menu" aria-label="Navegação acadêmica XpeX">
      <Link href="/xpex/polo" className="xpex-native-admin-brand" aria-label="Voltar para a visão geral do Polo">
        <span className="xpex-native-admin-monogram" aria-hidden="true">{monogram(org?.name)}</span>
        <span className="xpex-native-admin-brand-copy">
          <strong>{org?.name || 'XpeX Academy'}</strong>
          <small>Operação acadêmica</small>
        </span>
      </Link>

      <Link href="/xpex/polo" className="xpex-native-admin-back">
        <ArrowLeft size={16} aria-hidden="true" />
        <span>Visão Geral</span>
      </Link>

      <nav className="xpex-native-admin-nav">
        {nativeLinks.map(item => {
          const Icon = item.icon
          const href = item.xpex ? item.path : getUriWithOrg(org.slug, item.path)
          const active = item.xpex
            ? pathname === item.path || pathname.startsWith(`${item.path}/`)
            : pathname === item.path || pathname.endsWith(item.path) || pathname.includes(`${item.path}/`)

          return (
            <Link key={item.label} href={href} className={`xpex-native-admin-link${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>
              <Icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="xpex-native-admin-credit">
        <span>XpeX Academy</span>
        <small>Tecnologia educacional</small>
      </div>
    </aside>
  )
}
