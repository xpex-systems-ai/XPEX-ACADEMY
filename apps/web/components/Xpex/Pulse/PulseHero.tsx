import React from 'react'

export function PulseHero() {
  return (
    <header className="pulse-hero pulse-hero-v3" aria-label="Cabeçalho XPeX Pulse">
      <div className="pulse-hero-orbit pulse-hero-orbit-one" aria-hidden="true" />
      <div className="pulse-hero-orbit pulse-hero-orbit-two" aria-hidden="true" />
      <div className="pulse-hero-content">
        <div className="pulse-brand-row">
          <div className="pulse-brand-badge">
            <span className="pulse-status-dot" aria-hidden="true" />
            <span className="pulse-badge-text">INTELLIGENCE FABRIC V3</span>
          </div>
          <div className="pulse-live-indicator" title="Hub de mídia, descoberta e inteligência da XPeX Academy">
            <span className="pulse-radar-wave" aria-hidden="true" />
            <span>PULSE ONLINE</span>
          </div>
        </div>

        <div className="pulse-title-stack">
          <span className="pulse-eyebrow">XPeX Academy Intelligence Layer</span>
          <h1 className="pulse-hero-title">
            <span className="pulse-title-gradient">XPeX PULSE</span>
          </h1>
          <p className="pulse-hero-tagline">
            Conteúdo, descoberta e contexto de IA em uma central única para transformar informação em aprendizado.
          </p>
        </div>

        <div className="pulse-hero-capabilities" aria-label="Capacidades do XPeX Pulse">
          <span>Descoberta</span>
          <span>Fontes verificadas</span>
          <span>Busca inteligente</span>
          <span>XARA + GXEON</span>
        </div>
      </div>

      <div className="pulse-hero-aside" aria-hidden="true">
        <div className="pulse-aside-card pulse-aside-card-v3">
          <div className="pulse-aside-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18" />
              <path d="M12 3a14 14 0 0 1 3.5 9A14 14 0 0 1 12 21 14 14 0 0 1 8.5 12 14 14 0 0 1 12 3z" />
              <path d="M5.5 6.5c4 2 9 2 13 0M5.5 17.5c4-2 9-2 13 0" opacity=".55" />
            </svg>
          </div>
          <div className="pulse-aside-text">
            <span className="pulse-aside-badge">RADAR XPeX</span>
            <p className="pulse-aside-motto">
              FONTES REAIS. CONTEXTO CONFIÁVEL. APRENDIZADO CONTÍNUO.
            </p>
          </div>
          <div className="pulse-signal-bars">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </header>
  )
}
