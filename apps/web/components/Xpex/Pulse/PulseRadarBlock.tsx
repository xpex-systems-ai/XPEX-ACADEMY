import React from 'react'
import Link from 'next/link'
import { Target, ArrowRight } from 'lucide-react'
import type { PulseRadarItem } from '@/types/pulse'

interface PulseRadarBlockProps {
  items: PulseRadarItem[]
  label: string
}

/** Radar XPeX block — internal editorial signals, honest availability labels. */
export function PulseRadarBlock({ items, label }: PulseRadarBlockProps) {
  return (
    <section className="pulse-section" aria-labelledby="pulse-radar-heading">
      <div className="pulse-section-header">
        <div className="pulse-section-title-group">
          <div className="pulse-section-icon orange" aria-hidden="true">
            <Target size={16} />
          </div>
          <h2 id="pulse-radar-heading" className="pulse-section-title">
            Radar <span>XPeX</span>
          </h2>
        </div>
        <span className="pulse-section-label">{label}</span>
      </div>

      <div className="pulse-grid-3">
        {items.map((item) => (
          <div key={item.id} className="pulse-card">
            <div className="pulse-card-header">
              <h3 className="pulse-card-title">{item.title}</h3>
              <span
                className="pulse-section-label"
                aria-label={`Status: ${item.label}`}
              >
                {item.label}
              </span>
            </div>
            <p className="pulse-card-desc">{item.description}</p>
            {item.url && (
              <Link href={item.url} className="pulse-card-link">
                Explorar <ArrowRight size={13} aria-hidden="true" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
