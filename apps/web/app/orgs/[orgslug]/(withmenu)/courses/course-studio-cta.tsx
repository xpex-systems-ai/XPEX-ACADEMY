'use client'

import Link from 'next/link'
import { Sparkle } from '@phosphor-icons/react'
import useAdminStatus from '@components/Hooks/useAdminStatus'
import { getUriWithOrg } from '@services/config/config'

export default function CourseStudioCta({ orgslug }: { orgslug: string }) {
  const { rights } = useAdminStatus()

  if (!rights?.dashboard?.action_access) return null

  return (
    <div className="mx-auto w-full max-w-(--breakpoint-2xl) px-4 sm:px-6 lg:px-8 pt-6">
      <div className="flex flex-col gap-3 rounded-xl border border-violet-200 bg-violet-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-violet-950">AI Course Studio</p>
          <p className="text-sm text-violet-700">
            Gere, revise, aprove e publique cursos com IA sob aprovação humana.
          </p>
        </div>
        <Link
          href={getUriWithOrg(orgslug, '/course-studio')}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
        >
          <Sparkle size={18} weight="fill" />
          Criar curso com IA
        </Link>
      </div>
    </div>
  )
}
