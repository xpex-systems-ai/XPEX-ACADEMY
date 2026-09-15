'use client'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useOrg } from '@components/Contexts/OrgContext'
import { ChevronDown, ArrowDownAZ, ArrowUpAZ, Clock, History, GripVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu'

export type FolderSortMode =
  | 'name_asc'
  | 'name_desc'
  | 'newest'
  | 'oldest'
  | 'manual'

interface FolderSortDropdownProps {
  value: FolderSortMode
  onChange: (_value: FolderSortMode) => void
}

export function FolderSortDropdown({ value, onChange }: FolderSortDropdownProps) {
  const { t } = useTranslation()
  const org = useOrg() as any
  const isKelleDigitalLab = /kelle/i.test(`${org?.slug || ''} ${org?.name || ''}`)

  const copy = (key: string, portuguese: string, fallback: string) =>
    isKelleDigitalLab ? portuguese : t(key, { defaultValue: fallback })

  const sortOptions = [
    { value: 'name_asc' as FolderSortMode, label: copy('library.sort.name_asc', 'Nome (A–Z)', 'Name (A–Z)'), icon: ArrowDownAZ },
    { value: 'name_desc' as FolderSortMode, label: copy('library.sort.name_desc', 'Nome (Z–A)', 'Name (Z–A)'), icon: ArrowUpAZ },
    { value: 'newest' as FolderSortMode, label: copy('library.sort.newest', 'Mais recentes', 'Newest first'), icon: Clock },
    { value: 'oldest' as FolderSortMode, label: copy('library.sort.oldest', 'Mais antigos', 'Oldest first'), icon: History },
    { value: 'manual' as FolderSortMode, label: copy('library.sort.manual', 'Manual', 'Manual'), icon: GripVertical },
  ]

  const currentOption = sortOptions.find((opt) => opt.value === value) || sortOptions[0]
  const CurrentIcon = currentOption.icon

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-2 h-8 text-xs bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors">
          <CurrentIcon size={14} className="text-gray-400" />
          <span className="text-gray-500">{copy('library.sort.sort_by', 'Ordenar por', 'Sort by')}</span>
          <span className="font-medium text-gray-700">{currentOption.label}</span>
          <ChevronDown size={12} className="text-gray-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {sortOptions.map((option) => {
          const Icon = option.icon
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`flex items-center gap-2 text-sm ${value === option.value ? 'bg-gray-100 text-gray-900' : 'text-gray-600'}`}
            >
              <Icon size={14} />
              <span>{option.label}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default FolderSortDropdown
