'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  FolderOpen,
  GraduationCap,
  Settings,
  Users,
} from 'lucide-react'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { getUriWithOrg } from '@services/config/config'
import { getOrgLogoMediaDirectory } from '@services/media/media'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Cursos', href: '/dash/courses', icon: BookOpen },
  { label: 'Alunos', href: '/dash/users/settings/users', icon: Users },
  { label: 'Turmas', href: '/dash/users/settings/usergroups', icon: GraduationCap },
  { label: 'Conteúdos', href: '/dash/library', icon: FolderOpen },
  { label: 'Relatórios', href: '/dash/analytics', icon: BarChart3 },
  { label: 'Configurações', href: '/dash/org/settings/general', icon: Settings },
] as const

function OrganizationMark({ org }: { org: any }) {
  if (org?.logo_image && org?.org_uuid) {
    return (
      <img
        src={getOrgLogoMediaDirectory(org.org_uuid, org.logo_image)}
        alt={org?.name ?? 'Organização'}
        className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 object-contain p-1"
      />
    )
  }

  const initials = String(org?.name ?? 'XpeX')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join('') || 'XP'

  return (
    <div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(255,122,0,.16),rgba(0,212,255,.16))] text-sm font-black text-white shadow-[0_0_24px_rgba(0,212,255,.08)]">
      {initials}
    </div>
  )
}

export default function XpexNativeBridgeMenu() {
  const org = useOrg() as any
  const session = useLHSession() as any
  const pathname = usePathname() || ''
  if (!org) return null

  const hrefFor = (href: string) => getUriWithOrg(org.slug, href)
  const currentUser = session?.data?.user?.username || session?.data?.user?.email || 'Conta XpeX'

  const items = NAV_ITEMS.map(item => ({
    ...item,
    href: hrefFor(item.href),
    active: pathname === item.href || pathname.startsWith(`${item.href}/`),
  }))

  return (
    <>
      <aside className="hidden min-h-screen w-[248px] shrink-0 flex-col border-r border-white/[0.08] bg-[#05080f] lg:flex">
        <div className="border-b border-white/[0.08] p-4">
          <Link href="/xpex/polo" className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/[0.04]">
            <OrganizationMark org={org} />
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-white">{org.name}</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/70">XpeX Academy</p>
            </div>
          </Link>
        </div>

        <div className="px-3 pt-4">
          <Link href="/xpex/polo" className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-cyan-300/25 hover:text-white">
            <ChevronLeft size={15} /> Voltar ao painel do Polo
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Operação XpeX">
          {items.map(item => {
            const Icon = item.icon
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={item.active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                  item.active
                    ? 'border border-cyan-300/15 bg-cyan-300/[0.08] text-white shadow-[inset_3px_0_0_rgba(0,212,255,.7)]'
                    : 'border border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-white',
                )}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-white/[0.08] p-4">
          <p className="truncate text-xs font-semibold text-slate-300">{currentUser}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-600">Tecnologia educacional XpeX Academy</p>
        </div>
      </aside>

      <div className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#05080f]/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Link href="/xpex/polo" className="flex min-w-0 items-center gap-2">
            <OrganizationMark org={org} />
            <div className="min-w-0">
              <p className="truncate text-xs font-black text-white">{org.name}</p>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-300/70">XpeX Academy</p>
            </div>
          </Link>
          <Link href="/xpex/polo" className="rounded-lg border border-white/10 px-3 py-2 text-[11px] font-bold text-slate-300">Polo</Link>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-3" aria-label="Operação XpeX mobile">
          {items.map(item => {
            const Icon = item.icon
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-bold',
                  item.active
                    ? 'border-cyan-300/25 bg-cyan-300/[0.08] text-white'
                    : 'border-white/10 bg-white/[0.03] text-slate-400',
                )}
              >
                <Icon size={14} /> {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
