import React from 'react'

export function PulseHero() {
  return (
    <header className="pulse-hero" aria-label="Cabeçalho XPeX Pulse">
      <div className="pulse-hero-content">
        <div className="pulse-brand-row">
          <div className="pulse-brand-badge">
            <span className="pulse-status-dot" aria-hidden="true" />
            <span className="pulse-badge-text">LIVE INTELLIGENCE V2</span>
          </div>
          <div className="pulse-live-indicator" title="Hub de Mídia e Inteligência Operacional">
            <span className="pulse-radar-wave" aria-hidden="true" />
            <span>CENTRAL ATIVA</span>
          </div>
        </div>

        <h1 className="pulse-hero-title">
          <span className="pulse-title-gradient">XPeX PULSE</span>
        </h1>
        <p className="pulse-hero-tagline">
          Aprenda. Descubra. Acompanhe o futuro da inteligência artificial.
        </p>
      </div>

      <div className="pulse-hero-aside" aria-hidden="true">
        <div className="pulse-aside-card">
          <div className="pulse-aside-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <div className="pulse-aside-text">
            <span className="pulse-aside-badge">RADAR GLOBAL</span>
            <p className="pulse-aside-motto">
              CONTEÚDOS REAIS. TENDÊNCIAS ATUALIZADAS. APRENDIZADO CONTÍNUO.
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
