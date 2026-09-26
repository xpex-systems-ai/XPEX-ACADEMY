'use client'

import React from 'react'
import type { PulseTechItem } from '@/types/pulse'

interface PulseTechBlockProps {
  items: PulseTechItem[]
  label?: string
}

export function PulseTechBlock({ items, label = 'Curado' }: PulseTechBlockProps) {
  return (
    <section className="pulse-tech-panel" aria-label="Tecnologias Emergentes">
      <div className="pulse-panel-header">
        <div className="pulse-panel-title-wrap">
          <span className="pulse-panel-accent-tag">FRONTEIRA TECNOLÓGICA</span>
          <h3 className="pulse-panel-title">TECNOLOGIAS EMERGENTES</h3>
        </div>
        <span className="pulse-label-badge">{label}</span>
      </div>

      <div className="pulse-tech-grid">
        {items.map((tech) => (
          <article key={tech.id} className="pulse-tech-card" tabIndex={0}>
            <div className="pulse-tech-top-meta">
              <span className="pulse-tech-provider">{tech.providerOrOrg || 'Tecnologia Aberta'}</span>
              {tech.stage && <span className="pulse-stage-pill">{tech.stage}</span>}
            </div>

            <h4 className="pulse-tech-name">{tech.title}</h4>
            <p className="pulse-tech-desc">{tech.description}</p>

            {tech.tags && tech.tags.length > 0 && (
              <div className="pulse-tech-tags">
                {tech.tags.map((tag) => (
                  <span key={tag} className="pulse-tech-tag">#{tag}</span>
                ))}
              </div>
            )}

            {tech.url && (
              <a
                href={tech.url}
                target="_blank"
                rel="noopener noreferrer"
                className="pulse-tech-explore-link"
                aria-label={`Explorar documentação de ${tech.title}`}
              >
                Documentação oficial ↗
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
