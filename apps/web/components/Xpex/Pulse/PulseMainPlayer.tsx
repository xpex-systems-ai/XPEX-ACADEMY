'use client'

import React, { useState } from 'react'
import type { PulseVideoItem } from '@/types/pulse'

interface PulseMainPlayerProps {
  activeVideo: PulseVideoItem | null
  onAskXara?: (_prompt: string) => void
  onSaveVideo?: (_video: PulseVideoItem) => void
}

export function PulseMainPlayer({
  activeVideo,
  onAskXara,
  onSaveVideo,
}: PulseMainPlayerProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!activeVideo || !activeVideo.youtubeId) {
    return (
      <section className="pulse-player-container" id="pulse-main-player" aria-label="Player Principal XPeX">
        <div className="pulse-player-empty">
          <p>Nenhum vídeo selecionado no momento.</p>
        </div>
      </section>
    )
  }

  const handleSave = () => {
    setIsSaved(!isSaved)
    onSaveVideo?.(activeVideo)
  }

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(activeVideo.url || window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <section className="pulse-player-container" id="pulse-main-player" aria-label="Player Principal XPeX">
      <div className="pulse-player-frame-wrapper">
        <div className="pulse-player-status-bar">
          <div className="pulse-playing-badge">
            <span className="pulse-playing-dot" aria-hidden="true" />
            <span>EM REPRODUÇÃO</span>
          </div>
          <div className="pulse-player-quality-pill">
            <span>PLAYER OFICIAL • YOUTUBE EMBED</span>
          </div>
        </div>

        <div className="pulse-video-aspect-ratio">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${activeVideo.youtubeId}?rel=0&modestbranding=1`}
            title={activeVideo.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="pulse-iframe-player"
          />
        </div>
      </div>

      <div className="pulse-player-meta-box">
        <div className="pulse-player-header-row">
          <div className="pulse-player-headings">
            <div className="pulse-tag-row">
              <span className="pulse-chip-category">IA & TECNOLOGIA</span>
              <span className="pulse-label-badge">{activeVideo.label}</span>
              {activeVideo.durationLabel && (
                <span className="pulse-duration-chip">⏱ {activeVideo.durationLabel}</span>
              )}
            </div>
            <h2 className="pulse-player-title">{activeVideo.title}</h2>
          </div>

          <div className="pulse-player-actions">
            <button
              type="button"
              className="pulse-btn-xara-action"
              onClick={() => onAskXara?.(`Gostaria de um resumo detalhado e pontos-chave do vídeo "${activeVideo.title}".`)}
              title="Pedir resumo e análise prática para a mentora XARA"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                <path d="M12 2a10 10 0 0 1 10 10" />
                <circle cx="12" cy="12" r="4" />
              </svg>
              <span>Resumir com XARA</span>
            </button>

            <button
              type="button"
              className={`pulse-btn-tool ${isSaved ? 'is-saved' : ''}`}
              onClick={handleSave}
              aria-label={isSaved ? 'Remover marcação desta sessão' : 'Marcar conteúdo nesta sessão'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              <span>{isSaved ? 'Marcado' : 'Marcar'}</span>
            </button>

            <button
              type="button"
              className="pulse-btn-tool"
              onClick={handleShare}
              aria-label="Compartilhar link do vídeo"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>{copied ? 'Copiado!' : 'Compartilhar'}</span>
            </button>
          </div>
        </div>

        <div className="pulse-channel-row">
          <div className="pulse-channel-avatar" aria-hidden="true">
            {activeVideo.channelName.charAt(0)}
          </div>
          <div className="pulse-channel-info">
            <span className="pulse-channel-name">{activeVideo.channelName}</span>
            <span className="pulse-channel-stats">
              {activeVideo.source || 'Curadoria XPeX'} • Fonte atribuída
            </span>
          </div>
        </div>

        <p className="pulse-player-description">{activeVideo.description}</p>
      </div>
    </section>
  )
}
