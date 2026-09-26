import React from 'react'
import Link from 'next/link'
import { Radio } from 'lucide-react'

/** Hero banner matching the XPeX Pulse reference image design.
 * Bold gradient title, honest tagline, section nav chips. */
export function PulseHero() {
  return (
    <div className="pulse-hero">
      <div className="pulse-hero-eyebrow">
        <Radio size={12} aria-hidden="true" />
        Central Inteligente de Descoberta
      </div>

      <h1 className="pulse-hero-title">XPeX PULSE</h1>

      <p className="pulse-hero-sub">
        Central inteligente de vídeos, tendências e notícias sobre IA
      </p>

      <p className="pulse-hero-tagline">
        Aprenda. <em>Descubra.</em> Acompanhe o futuro.
      </p>

      <nav className="pulse-hero-nav" aria-label="Seções do Pulse">
        <span className="pulse-hero-nav-item">Vídeos</span>
        <span className="pulse-hero-nav-item">Notícias</span>
        <span className="pulse-hero-nav-item">Tendências</span>
        <span className="pulse-hero-nav-item">Tecnologias</span>
        <span className="pulse-hero-nav-item">Aprendizado</span>
        <Link href="/xpex/gxeon" className="pulse-hero-nav-item">
          GXEON Copilot
        </Link>
      </nav>
    </div>
  )
}
