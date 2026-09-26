'use client'

import React from 'react'
import type { PulseResourceCard } from '@/types/pulse'

interface PulseResourceGridProps {
  cards: PulseResourceCard[]
}

export function PulseResourceGrid({ cards }: PulseResourceGridProps) {
  return (
    <section className="pulse-resource-grid-section" aria-label="Recursos do XPeX Pulse">
      <div className="pulse-section-header">
        <div className="pulse-section-title-group">
          <span className="pulse-badge-accent">ARQUITETURA V2</span>
          <h3 className="pulse-section-title">RECURSOS DO XPEX PULSE</h3>
          <p className="pulse-section-subtitle">
            Ambiente completo projetado para transformar informação em domínio prático.
          </p>
        </div>
      </div>

      <div className="pulse-resource-cards-grid">
        {cards.map((card) => (
          <article key={card.id} className="pulse-resource-card" tabIndex={0}>
            <div className="pulse-resource-card-header">
              <span className="pulse-resource-badge">{card.badgeText}</span>
            </div>
            <h4 className="pulse-resource-card-title">{card.title}</h4>
            <p className="pulse-resource-card-desc">{card.description}</p>
            {card.href && (
              <a href={card.href} className="pulse-resource-card-link">
                Acessar recurso →
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
