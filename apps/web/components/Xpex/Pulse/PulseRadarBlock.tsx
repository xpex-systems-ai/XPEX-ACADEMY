'use client'

import React from 'react'
import Link from 'next/link'
import type { PulseRadarItem } from '@/types/pulse'

interface PulseRadarBlockProps {
  items: PulseRadarItem[]
  label?: string
}

export function PulseRadarBlock({ items, label = 'Curado' }: PulseRadarBlockProps) {
  return (
    <section className="pulse-radar-panel" aria-label="Radar de Sinais XPeX">
      <div className="pulse-panel-header">
        <div className="pulse-panel-title-wrap">
          <span className="pulse-panel-accent-tag">SONAR DE INTELIGÊNCIA</span>
          <h3 className="pulse-panel-title">RADAR XPeX</h3>
        </div>
        <span className="pulse-label-badge">{label}</span>
      </div>

      <div className="pulse-radar-container">
        <div className="pulse-radar-visual-col" aria-hidden="true">
          <div className="pulse-sonar-wrapper">
            <div className="pulse-sonar-circle ring-1" />
            <div className="pulse-sonar-circle ring-2" />
            <div className="pulse-sonar-circle ring-3" />
            <div className="pulse-sonar-sweep" />
            <div className="pulse-sonar-center-point" />
            <div className="pulse-sonar-blip blip-1" />
            <div className="pulse-sonar-blip blip-2" />
            <div className="pulse-sonar-blip blip-3" />
          </div>
          <span className="pulse-radar-legend">Sinais Detectados na Rede XPeX</span>
        </div>

        <div className="pulse-radar-topics-col">
          <div className="pulse-radar-list">
            {items.map((item, index) => {
              const rank = item.rank || index + 1
              const percentage = item.interestPercentage || (100 - index * 15)
              return (
                <div key={item.id} className="pulse-radar-topic-item" tabIndex={0}>
                  <div className="pulse-radar-topic-top">
                    <div className="pulse-radar-topic-name">
                      <span className="pulse-radar-rank-num">#{rank}</span>
                      <span className="pulse-radar-title">{item.title}</span>
                    </div>
                    <span className="pulse-heat-badge">{item.heatLevel || 'Em alta'}</span>
                  </div>

                  <p className="pulse-radar-desc">{item.description}</p>

                  <div className="pulse-radar-meter-row">
                    <div className="pulse-radar-bar-track" aria-hidden="true">
                      <div
                        className="pulse-radar-bar-fill"
                        style={{ width: `${Math.min(100, Math.max(10, percentage))}%` }}
                      />
                    </div>
                    <span className="pulse-radar-percent-label">{percentage}%</span>
                  </div>

                  {item.url && (
                    <div className="pulse-radar-action-wrap">
                      <Link href={item.url} className="pulse-radar-trail-link">
                        Explorar trilha correspondente →
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
