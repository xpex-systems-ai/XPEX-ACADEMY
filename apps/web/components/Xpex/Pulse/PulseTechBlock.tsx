import React from 'react'
import { Lightbulb } from 'lucide-react'
import type { PulseTechItem } from '@/types/pulse'

interface PulseTechBlockProps {
  items: PulseTechItem[]
  label: string
}

/** Tecnologias Emergentes block — curated tech landscape, tagged. */
export function PulseTechBlock({ items, label }: PulseTechBlockProps) {
  return (
    <section className="pulse-section" aria-labelledby="pulse-tech-heading">
      <div className="pulse-section-header">
        <div className="pulse-section-title-group">
          <div className="pulse-section-icon" aria-hidden="true">
            <Lightbulb size={16} />
          </div>
          <h2 id="pulse-tech-heading" className="pulse-section-title cyan">
            Tecnologias <span>Emergentes</span>
          </h2>
        </div>
        <span className="pulse-section-label">{label}</span>
      </div>

      <div className="pulse-grid-4">
        {items.map((tech) => (
          <div key={tech.id} className="pulse-card">
            <div className="pulse-card-header">
              <h3 className="pulse-card-title">{tech.title}</h3>
              <span
                className="pulse-section-label"
                aria-label={`Status: ${tech.label}`}
              >
                {tech.label}
              </span>
            </div>
            <p className="pulse-card-desc">{tech.description}</p>
            {tech.tags && tech.tags.length > 0 && (
              <div className="pulse-card-tags" aria-label="Tags">
                {tech.tags.map((tag) => (
                  <span key={tag} className="pulse-tag">{tag}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
