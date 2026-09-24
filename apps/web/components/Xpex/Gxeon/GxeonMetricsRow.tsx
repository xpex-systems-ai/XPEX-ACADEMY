'use client'

import React from 'react'
import { GraduationCap, Play, BarChart2 } from 'lucide-react'
import type { AIGatewayHealthResponse } from '@services/ai/ai'

export interface GxeonMetricsRowProps {
  enrolledCoursesCount: number
  availableLessonsCount: number
  overallProgress: number
  gatewayHealth: AIGatewayHealthResponse | null
}

export function GxeonMetricsRow({
  enrolledCoursesCount,
  availableLessonsCount,
  overallProgress,
  gatewayHealth,
}: GxeonMetricsRowProps) {
  const isOnline = gatewayHealth?.status === 'ready'
  const isDegraded = gatewayHealth?.status === 'unconfigured'

  const statusTitle = isOnline
    ? 'GX está online'
    : isDegraded
    ? 'GX em configuração'
    : 'GX temporariamente indisponível'

  const statusSubtext = isOnline
    ? 'Ambiente integrado e pronto para ajudar.'
    : isDegraded
    ? 'Credenciais em processo de ativação.'
    : 'Seu conteúdo da aula continua disponível.'

  const statusDotClass = isOnline
    ? 'bg-[#00E69A] shadow-[0_0_12px_#00E69A]'
    : isDegraded
    ? 'bg-[#FBBF24] shadow-[0_0_12px_#FBBF24]'
    : 'bg-[#F87171] shadow-[0_0_12px_#F87171]'

  return (
    <section className="gxeon-metrics-grid" aria-label="Métricas reais do estudante">
      {/* Card 1: Cursos Matriculados */}
      <article className="gxeon-metric-card">
        <div className="gxeon-metric-icon-box" aria-hidden="true">
          <GraduationCap size={22} />
        </div>
        <div>
          <div className="gxeon-metric-value">{enrolledCoursesCount}</div>
          <div className="gxeon-metric-label">Cursos Matriculados</div>
          <div className="gxeon-metric-subtext">Continue aprendendo e evoluindo.</div>
        </div>
      </article>

      {/* Card 2: Aulas Disponíveis */}
      <article className="gxeon-metric-card">
        <div className="gxeon-metric-icon-box" aria-hidden="true">
          <Play size={22} fill="currentColor" />
        </div>
        <div>
          <div className="gxeon-metric-value">{availableLessonsCount}</div>
          <div className="gxeon-metric-label">Aulas Disponíveis</div>
          <div className="gxeon-metric-subtext">Conteúdo prático e atualizado.</div>
        </div>
      </article>

      {/* Card 3: Progresso Geral */}
      <article className="gxeon-metric-card">
        <div className="gxeon-metric-icon-box" aria-hidden="true">
          <BarChart2 size={22} />
        </div>
        <div>
          <div className="gxeon-metric-value">{overallProgress}%</div>
          <div className="gxeon-metric-label">Progresso Geral</div>
          <div className="gxeon-metric-subtext">
            {overallProgress > 0 ? 'Você está indo muito bem!' : 'Inicie suas primeiras aulas!'}
          </div>
        </div>
      </article>

      {/* Card 4: GX Status */}
      <article className="gxeon-metric-card">
        <div className="gxeon-metric-icon-box" aria-hidden="true">
          <div className={`w-3.5 h-3.5 rounded-full ${statusDotClass}`} />
        </div>
        <div>
          <div className="text-base font-extrabold text-white leading-tight">{statusTitle}</div>
          <div className="gxeon-metric-subtext mt-1">{statusSubtext}</div>
        </div>
      </article>
    </section>
  )
}
