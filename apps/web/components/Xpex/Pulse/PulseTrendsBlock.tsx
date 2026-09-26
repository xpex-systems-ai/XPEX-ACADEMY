'use client'

import React from 'react'
import type { PulseTrendItem } from '@/types/pulse'

interface PulseTrendsBlockProps {
  items: PulseTrendItem[]
  label?: string
}

export function PulseTrendsBlock({ items, label = 'Curado' }: PulseTrendsBlockProps) {
  return (
    <section className="pulse-trends-panel" aria-label="Tendências de Mercado e IA">
      <div className="pulse-panel-header">
        <div className="pulse-panel-title-wrap">
          <span className="pulse-panel-accent-tag">MERCADO & CARREIRA</span>
          <h3 className="pulse-panel-title">TENDÊNCIAS DE MERCADO</h3>
        </div>
        <span className="pulse-label-badge">{label}</span>
      </div>

      <div className="pulse-trends-list">
        {items.map((trend, index) => {
          const rank = trend.rank || index + 1
          return (
            <div key={trend.id} className="pulse-trend-row" tabIndex={0}>
              <div className="pulse-trend-rank-box" aria-hidden="true">
                <span className="pulse-trend-rank-num">0{rank}</span>
              </div>

              <div className="pulse-trend-content">
                <div className="pulse-trend-head">
                  <h4 className="pulse-trend-title">{trend.title}</h4>
                  <div className="pulse-trend-badge-wrap">
                    {trend.growthRateLabel && (
                      <span className="pulse-growth-badge">{trend.growthRateLabel}</span>
                    )}
                    {trend.direction && (
                      <span className="pulse-direction-chip">{trend.direction}</span>
                    )}
                  </div>
                </div>

                <p className="pulse-trend-desc">{trend.description}</p>
                {typeof trend.interestScore === 'number' && (
                  <div className="pulse-trend-bar-track" aria-hidden="true">
                    <div
                      className="pulse-trend-bar-fill"
                      style={{ width: `${Math.min(100, Math.max(0, trend.interestScore))}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
