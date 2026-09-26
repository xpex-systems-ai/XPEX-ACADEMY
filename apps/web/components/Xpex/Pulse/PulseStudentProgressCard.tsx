'use client'

import React from 'react'
import Link from 'next/link'
import type { PulseStudentProgress } from '@/types/pulse'

interface PulseStudentProgressCardProps {
  progress?: PulseStudentProgress
  displayName?: string
}

export function PulseStudentProgressCard({
  progress,
  displayName = 'Aluno XPeX',
}: PulseStudentProgressCardProps) {
  if (!progress) {
    return (
      <aside className="pulse-progress-widget" aria-label="Painel de Progresso do Aluno">
        <div className="pulse-progress-header">
          <div className="pulse-progress-user-info">
            <span className="pulse-progress-greeting">Meu Progresso</span>
            <span className="pulse-progress-name">{displayName}</span>
          </div>
        </div>
        <div className="pulse-progress-body">
          <div className="pulse-progress-unavailable" role="status">
            <strong>Dados de progresso em preparação</strong>
            <span>
              O Pulse só exibirá percentual, XP, horas, vídeos e conquistas quando esses dados vierem da fonte oficial do aluno.
            </span>
          </div>
        </div>
        <div className="pulse-progress-footer">
          <Link href="/xpex/trails" className="pulse-progress-link">
            <span>Ver trilhas disponíveis</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </aside>
    )
  }

  const percentage = progress.completionPercentage
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <aside className="pulse-progress-widget" aria-label="Painel de Progresso do Aluno">
      <div className="pulse-progress-header">
        <div className="pulse-progress-user-info">
          <span className="pulse-progress-greeting">Meu Progresso</span>
          <span className="pulse-progress-name">{displayName}</span>
        </div>
        <div className="pulse-level-badge">
          <span>Nv. {progress.level}</span>
          <span className="pulse-level-xp">{progress.xp} XP</span>
        </div>
      </div>

      <div className="pulse-progress-body">
        <div className="pulse-progress-circle-wrap">
          <svg className="pulse-radial-svg" width="88" height="88" viewBox="0 0 88 88" aria-hidden="true">
            <circle className="pulse-radial-bg" cx="44" cy="44" r={radius} strokeWidth="7" fill="transparent" />
            <circle
              className="pulse-radial-fill"
              cx="44"
              cy="44"
              r={radius}
              strokeWidth="7"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 44 44)"
            />
          </svg>
          <div className="pulse-radial-text">
            <span className="pulse-radial-val">{percentage}%</span>
            <span className="pulse-radial-label">META</span>
          </div>
        </div>

        <div className="pulse-progress-stats">
          <div className="pulse-stat-row"><span className="pulse-stat-label">Trilhas em andamento</span><span className="pulse-stat-value">{progress.activeTrailsCount}</span></div>
          <div className="pulse-stat-row"><span className="pulse-stat-label">Vídeos assistidos</span><span className="pulse-stat-value">{progress.watchedVideosCount}</span></div>
          <div className="pulse-stat-row"><span className="pulse-stat-label">Horas de conteúdo</span><span className="pulse-stat-value">{progress.contentHoursCompleted}h</span></div>
          <div className="pulse-stat-row"><span className="pulse-stat-label">Conquistas</span><span className="pulse-stat-value">{progress.achievementsCount}</span></div>
        </div>
      </div>

      <div className="pulse-progress-footer">
        <Link href="/xpex/trails" className="pulse-progress-link">
          <span>Ver meu progresso completo</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </aside>
  )
}
