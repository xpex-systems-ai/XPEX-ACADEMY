import React from 'react'
import { TrendingUp } from 'lucide-react'
import type { PulseTrendItem } from '@/types/pulse'

interface PulseTrendsBlockProps {
  items: PulseTrendItem[]
  label: string
}

const directionClass: Record<string, string> = {
  'Em alta': 'em-alta',
  'Emergindo': 'emergindo',
  'Em observação': 'observacao',
}

/** Tendências de Mercado block — curated editorial observations, never fake % growth. */
export function PulseTrendsBlock({ items, label }: PulseTrendsBlockProps) {
  return (
    <section className="pulse-section" aria-labelledby="pulse-trends-heading">
      <div className="pulse-section-header">
        <div className="pulse-section-title-group">
          <div className="pulse-section-icon orange" aria-hidden="true">
            <TrendingUp size={16} />
          </div>
          <h2 id="pulse-trends-heading" className="pulse-section-title">
            Tendências <span>de Mercado</span>
          </h2>
        </div>
        <span className="pulse-section-label">{label}</span>
      </div>

      <div className="pulse-grid-4">
        {items.map((trend) => (
          <div key={trend.id} className="pulse-card">
            <div className="pulse-card-header">
              <h3 className="pulse-card-title">{trend.title}</h3>
              {trend.direction && (
                <span
                  className={`pulse-card-direction ${directionClass[trend.direction] ?? ''}`}
                  aria-label={`Direção: ${trend.direction}`}
                >
                  {trend.direction}
                </span>
              )}
            </div>
            <p className="pulse-card-desc">{trend.description}</p>
            {trend.source && (
              <span className="pulse-news-source">{trend.source}</span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
