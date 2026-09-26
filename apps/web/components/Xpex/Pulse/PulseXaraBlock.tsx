import React from 'react'
import Link from 'next/link'
import { GraduationCap, Bot, ArrowRight } from 'lucide-react'
import type { PulseXaraItem } from '@/types/pulse'

interface PulseXaraBlockProps {
  items: PulseXaraItem[]
  label: string
}

/**
 * Aprenda com XARA block.
 *
 * V1: Curated static recommendations.
 * V2: Will be replaced by real personalized content from GXEON AI Gateway.
 *
 * SECURITY: XARA routes through GXEON Gateway (/xpex/ai-gateway).
 * No direct browser-to-provider calls. No API keys in the frontend.
 */
export function PulseXaraBlock({ items, label }: PulseXaraBlockProps) {
  return (
    <section className="pulse-section" aria-labelledby="pulse-xara-heading">
      <div className="pulse-section-header">
        <div className="pulse-section-title-group">
          <div className="pulse-section-icon success" aria-hidden="true">
            <Bot size={16} />
          </div>
          <h2 id="pulse-xara-heading" className="pulse-section-title cyan">
            Aprenda com <span>XARA</span>
          </h2>
        </div>
        <span className="pulse-section-label">{label}</span>
      </div>

      <div className="pulse-status-notice" role="note">
        <Bot size={16} aria-hidden="true" />
        <span>
          Conteúdos e recomendações selecionados pela equipe XPeX.
          Recomendações personalizadas com IA chegam em breve via GXEON Copilot.
        </span>
      </div>

      <div className="pulse-grid-3">
        {items.map((item) => (
          <div key={item.id} className="pulse-xara-card">
            <div className="pulse-xara-label">
              <GraduationCap size={12} aria-hidden="true" />
              {item.label}
            </div>
            <h3 className="pulse-card-title">{item.title}</h3>
            <p className="pulse-card-desc">{item.description}</p>
            {item.url && item.label !== 'Em preparação' ? (
              <Link href={item.url} className="pulse-card-link">
                Começar <ArrowRight size={13} aria-hidden="true" />
              </Link>
            ) : (
              <span className="pulse-card-link" style={{ opacity: 0.45, cursor: 'default' }}>
                Em preparação
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="pulse-status-notice" role="note">
        <GraduationCap size={16} aria-hidden="true" />
        <span>
          Use o{' '}
          <Link href="/xpex/gxeon" style={{ color: 'var(--pulse-cyan)', textDecoration: 'none', fontWeight: 600 }}>
            GXEON Copilot
          </Link>{' '}
          para tirar dúvidas sobre seus cursos com IA agora mesmo.
        </span>
      </div>
    </section>
  )
}
