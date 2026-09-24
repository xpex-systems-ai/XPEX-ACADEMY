'use client'

import React from 'react'
import {
  Brain,
  GraduationCap,
  Layers,
  Package,
  Sparkles,
  Zap,
} from 'lucide-react'

export function GxeonHero() {
  return (
    <section className="gxeon-hero-card" aria-label="GXEON Apresentação Principal">
      <div className="gxeon-hero-layout">
        {/* Left Side: Product Identity & Core Message */}
        <div>
          <span className="gxeon-eyebrow">XPeX ACADEMY</span>
          <h1 className="gxeon-hero-title">
            <span className="gx-part">GX</span>
            <span className="eon-part">EON</span>
          </h1>
          <p className="gxeon-hero-subtitle">
            Copilot — Seu centro de comando inteligente
          </p>
          <p className="gxeon-hero-desc">
            Aprenda mais rápido. Construa com IA. Conecte conhecimento, projetos e prática em um só lugar.
          </p>

          <div className="gxeon-hero-chips">
            <div className="gxeon-hero-chip">
              <div className="gxeon-chip-icon" aria-hidden="true">
                <Brain size={15} />
              </div>
              <span className="gxeon-chip-text">
                IA especializada<br />no seu aprendizado
              </span>
            </div>

            <div className="gxeon-hero-chip">
              <div className="gxeon-chip-icon" aria-hidden="true">
                <Layers size={15} />
              </div>
              <span className="gxeon-chip-text">
                Conectado aos seus<br />cursos e conteúdos
              </span>
            </div>

            <div className="gxeon-hero-chip">
              <div className="gxeon-chip-icon" aria-hidden="true">
                <Sparkles size={15} />
              </div>
              <span className="gxeon-chip-text">
                Foco em projetos<br />reais e resultados
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Futuristic Metallic / Neon X Visual */}
        <div className="gxeon-visual-container" aria-hidden="true">
          <div className="gxeon-orbital-rings" />

          {/* 4 Orbital Feature Cards */}
          <div className="gxeon-orbit-card top-left">
            <GraduationCap size={14} className="text-[#00D4FF]" />
            <span>Conhecimento em Ação</span>
          </div>

          <div className="gxeon-orbit-card top-right">
            <Package size={14} className="text-[#FF7A00]" />
            <span>Projetos Reais</span>
          </div>

          <div className="gxeon-orbit-card bottom-left">
            <Brain size={14} className="text-[#00D4FF]" />
            <span>Aprendizado Personalizado</span>
          </div>

          <div className="gxeon-orbit-card bottom-right">
            <Zap size={14} className="text-[#00D4FF]" />
            <span>IA com Propósito</span>
          </div>

          {/* Central Glowing Metallic X */}
          <div className="gxeon-center-x">
            <svg
              width="170"
              height="170"
              viewBox="0 0 170 170"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="transform hover:scale-105 transition-transform duration-500"
            >
              <defs>
                <linearGradient id="gxeon-x-left" x1="0" y1="0" x2="170" y2="170" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#00D4FF" />
                  <stop offset="45%" stopColor="#0077FF" />
                  <stop offset="100%" stopColor="#FF7A00" />
                </linearGradient>
                <linearGradient id="gxeon-x-right" x1="170" y1="0" x2="0" y2="170" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFA64D" />
                  <stop offset="55%" stopColor="#FF7A00" />
                  <stop offset="100%" stopColor="#00D4FF" />
                </linearGradient>
                <filter id="gxeon-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Glowing Background Glow Path */}
              <path
                d="M32 26 L76 85 L32 144 L56 144 L88 100 L120 144 L144 144 L98 85 L142 26 L118 26 L88 68 L56 26 Z"
                fill="none"
                stroke="url(#gxeon-x-left)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.5"
                filter="url(#gxeon-glow)"
              />

              {/* Foreground Metallic / Neon X */}
              <path
                d="M36 28 L76 85 L36 142 L56 142 L88 98 L118 142 L138 142 L98 85 L136 28 L116 28 L88 70 L58 28 Z"
                fill="url(#gxeon-x-left)"
                stroke="#FFFFFF"
                strokeWidth="1.2"
                strokeOpacity="0.4"
              />

              {/* Core Light Accent */}
              <path
                d="M58 28 L88 70 L116 28"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.85"
              />
              <path
                d="M36 142 L88 98 L138 142"
                stroke="#FFD5A3"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.85"
              />
            </svg>
          </div>

          {/* Far-Right Vertical Indicators Stack */}
          <div className="gxeon-vertical-indicators">
            <span>Ideias</span>
            <span>Conhecimento</span>
            <span>Projetos</span>
            <span className="active">Resultados</span>
          </div>
        </div>
      </div>
    </section>
  )
}
